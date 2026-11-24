"""access management, owner role and administrative audit

Revision ID: 0006_access_management
Revises: 0005_service_folios
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006_access_management"
down_revision = "0005_service_folios"
branch_labels = None
depends_on = None

FULL = '["dashboard.view","clients.view","clients.manage","appointments.view","appointments.manage","kitchens.view","properties.view","properties.manage","properties.publish"]'
READ = '["dashboard.view","clients.view","appointments.view","kitchens.view"]'


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column(
            "permissions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column(
        "admin_users",
        sa.Column("must_change_password", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.drop_constraint("ck_admin_role", "admin_users", type_="check")
    op.execute(
        sa.text(
            "UPDATE admin_users SET permissions = CAST(:read AS jsonb) WHERE role = 'staff'"
        ).bindparams(read=READ)
    )
    op.execute(
        sa.text(
            "UPDATE admin_users SET permissions = CAST(:full AS jsonb) WHERE role = 'admin'"
        ).bindparams(full=FULL)
    )
    op.execute(
        """
        WITH first_admin AS (
          SELECT id FROM admin_users WHERE role = 'admin' AND is_active ORDER BY created_at, id LIMIT 1
        )
        UPDATE admin_users SET role = CASE WHEN id IN (SELECT id FROM first_admin) THEN 'owner' ELSE 'staff' END
        WHERE role = 'admin'
        """
    )
    op.create_check_constraint("ck_admin_role", "admin_users", "role IN ('owner', 'staff')")
    op.create_check_constraint(
        "ck_admin_owner_active", "admin_users", "role != 'owner' OR is_active"
    )
    op.create_index(
        "uq_admin_single_owner",
        "admin_users",
        ["role"],
        unique=True,
        postgresql_where=sa.text("role = 'owner'"),
    )
    op.create_table(
        "admin_audit_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["admin_users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_created_at", "admin_audit_events", ["created_at"])
    op.create_index("ix_admin_audit_events_actor_user_id", "admin_audit_events", ["actor_user_id"])


def downgrade() -> None:
    op.drop_index("ix_admin_audit_events_actor_user_id", table_name="admin_audit_events")
    op.drop_index("ix_admin_audit_created_at", table_name="admin_audit_events")
    op.drop_table("admin_audit_events")
    op.drop_index("uq_admin_single_owner", table_name="admin_users")
    op.drop_constraint("ck_admin_owner_active", "admin_users", type_="check")
    op.drop_constraint("ck_admin_role", "admin_users", type_="check")
    op.execute("UPDATE admin_users SET role = 'admin' WHERE role = 'owner'")
    op.create_check_constraint("ck_admin_role", "admin_users", "role IN ('admin', 'staff')")
    op.drop_column("admin_users", "must_change_password")
    op.drop_column("admin_users", "permissions")
