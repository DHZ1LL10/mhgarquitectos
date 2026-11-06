"""Public write rate limiting for Internet-facing deployments."""

import sqlalchemy as sa
from alembic import op

revision = "0004_staging_hardening"
down_revision = "0003_kitchen_submissions"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "public_rate_limits",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_public_rate_limits_expires_at", "public_rate_limits", ["expires_at"])


def downgrade():
    op.drop_table("public_rate_limits")
