"""Concurrency-safe service-specific human folios."""

import sqlalchemy as sa
from alembic import op

revision = "0005_service_folios"
down_revision = "0004_staging_hardening"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "service_folio_counters",
        sa.Column("service_prefix", sa.String(12), primary_key=True),
        sa.Column("last_value", sa.BigInteger(), nullable=False),
        sa.CheckConstraint(
            "last_value >= 0", name="ck_service_folio_counter_nonnegative"
        ),
    )
    op.execute(
        """
        INSERT INTO service_folio_counters (service_prefix, last_value)
        SELECT 'COC', COALESCE(MAX(CAST(SUBSTRING(folio FROM 5) AS BIGINT)), 0)
        FROM kitchen_submissions
        WHERE folio ~ '^COC-[0-9]+$'
        """
    )


def downgrade():
    op.drop_table("service_folio_counters")
