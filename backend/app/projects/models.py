from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common import IdentityTimestamps
from app.db import Base


class Project(IdentityTimestamps, Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "category IN ('kitchen_furniture', 'design_construction')", name="ck_project_category"
        ),
        CheckConstraint("status IN ('draft', 'published')", name="ck_project_status"),
        CheckConstraint(
            "(featured AND featured_order IS NOT NULL AND featured_order BETWEEN 1 AND 9) OR (NOT featured AND featured_order IS NULL)",
            name="ck_project_featured",
        ),
        Index(
            "uq_project_featured_order",
            "category",
            "featured_order",
            unique=True,
            postgresql_where=text("featured"),
        ),
    )
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    category: Mapped[str] = mapped_column(String(32))
    short_description: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="draft")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    featured_order: Mapped[int | None] = mapped_column(Integer)
    images: Mapped[list["ProjectImage"]] = relationship(
        cascade="all, delete-orphan", order_by="ProjectImage.sort_order", lazy="raise"
    )


class ProjectImage(IdentityTimestamps, Base):
    __tablename__ = "project_images"
    __table_args__ = (
        CheckConstraint("provider IN ('local', 'cloudinary')", name="ck_project_image_provider"),
        CheckConstraint(
            "width > 0 AND height > 0 AND sort_order >= 0", name="ck_project_image_dimensions"
        ),
        Index("uq_project_cover", "project_id", unique=True, postgresql_where=text("is_cover")),
    )
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    provider: Mapped[str] = mapped_column(String(16), default="local")
    public_id: Mapped[str | None] = mapped_column(String(1024))
    secure_url: Mapped[str] = mapped_column(String(2048))
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    format: Mapped[str] = mapped_column(String(16))
    bytes: Mapped[int | None] = mapped_column(Integer)
    alt_text: Mapped[str] = mapped_column(String(250))
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer)
