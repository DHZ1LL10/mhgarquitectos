"""Managed projects and additive property media metadata."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0007_managed_projects"
down_revision = "0006_access_management"
branch_labels = None
depends_on = None


def identity():
    return [
        sa.Column(
            "id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    ]


def upgrade():
    op.create_table(
        "media_cleanup",
        *identity(),
        sa.Column("public_id", sa.String(1024), nullable=False, unique=True),
    )
    op.create_table(
        "projects",
        *identity(),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(160), nullable=False, unique=True),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("short_description", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("featured_order", sa.Integer()),
        sa.CheckConstraint(
            "category IN ('kitchen_furniture', 'design_construction')", name="ck_project_category"
        ),
        sa.CheckConstraint("status IN ('draft', 'published')", name="ck_project_status"),
        sa.CheckConstraint(
            "(featured AND featured_order IS NOT NULL AND featured_order BETWEEN 1 AND 9) OR (NOT featured AND featured_order IS NULL)",
            name="ck_project_featured",
        ),
    )
    op.create_index(
        "uq_project_featured_order",
        "projects",
        ["category", "featured_order"],
        unique=True,
        postgresql_where=sa.text("featured"),
    )
    op.create_table(
        "project_images",
        *identity(),
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(16), nullable=False),
        sa.Column("public_id", sa.String(1024)),
        sa.Column("secure_url", sa.String(2048), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("format", sa.String(16), nullable=False),
        sa.Column("bytes", sa.Integer()),
        sa.Column("alt_text", sa.String(250), nullable=False),
        sa.Column("is_cover", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.CheckConstraint("provider IN ('local', 'cloudinary')", name="ck_project_image_provider"),
        sa.CheckConstraint(
            "width > 0 AND height > 0 AND sort_order >= 0", name="ck_project_image_dimensions"
        ),
    )
    op.create_index("ix_project_images_project_id", "project_images", ["project_id"])
    op.create_index(
        "uq_project_cover",
        "project_images",
        ["project_id"],
        unique=True,
        postgresql_where=sa.text("is_cover"),
    )
    for column in [
        sa.Column("provider", sa.String(16), nullable=False, server_default="local"),
        sa.Column("public_id", sa.String(1024)),
        sa.Column("format", sa.String(16)),
        sa.Column("bytes", sa.Integer()),
    ]:
        op.add_column("property_images", column)


def downgrade():
    op.drop_table("media_cleanup")
    for column in ["bytes", "format", "public_id", "provider"]:
        op.drop_column("property_images", column)
    op.drop_table("project_images")
    op.drop_table("projects")
