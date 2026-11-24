"""Idempotent kitchen submission receipts and notification delivery state."""

import sqlalchemy as sa
from alembic import op

revision = "0003_kitchen_submissions"
down_revision = "0002_admin_auth"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "kitchen_submissions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("folio", sa.String(40), nullable=False),
        sa.Column("idempotency_key_hash", sa.String(64), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column(
            "configuration_id",
            sa.UUID(),
            sa.ForeignKey("kitchen_configurations.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "appointment_id",
            sa.UUID(),
            sa.ForeignKey("appointments.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "lead_id",
            sa.UUID(),
            sa.ForeignKey("leads.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("status", sa.String(32), server_default="received", nullable=False),
        sa.Column("notification_status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("notification_attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("notification_error", sa.Text()),
        sa.Column("notified_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("folio", name="uq_kitchen_submissions_folio"),
        sa.UniqueConstraint(
            "idempotency_key_hash", name="uq_kitchen_submissions_idempotency_key_hash"
        ),
        sa.UniqueConstraint("configuration_id", name="uq_kitchen_submissions_configuration_id"),
        sa.UniqueConstraint("appointment_id", name="uq_kitchen_submissions_appointment_id"),
        sa.UniqueConstraint("lead_id", name="uq_kitchen_submissions_lead_id"),
        sa.CheckConstraint("status = 'received'", name="ck_kitchen_submission_status"),
        sa.CheckConstraint(
            "notification_status IN ('pending', 'sent', 'failed', 'not_configured')",
            name="ck_kitchen_submission_notification_status",
        ),
        sa.CheckConstraint(
            "notification_attempts >= 0", name="ck_kitchen_submission_notification_attempts"
        ),
    )
    op.create_index(
        "ix_kitchen_submissions_notification_created",
        "kitchen_submissions",
        ["notification_status", "created_at"],
    )
    op.execute(
        "CREATE TRIGGER trg_kitchen_submissions_updated_at BEFORE UPDATE ON "
        "kitchen_submissions FOR EACH ROW EXECUTE FUNCTION mhg_touch_updated_at()"
    )


def downgrade():
    op.drop_table("kitchen_submissions")
