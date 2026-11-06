import enum
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common import IdentityTimestamps, db_enum
from app.db import Base


class PropertyStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Operation(str, enum.Enum):
    sale = "sale"
    rent = "rent"


class PropertyType(str, enum.Enum):
    house = "house"
    apartment = "apartment"
    land = "land"


class Property(IdentityTimestamps, Base):
    __tablename__ = "properties"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_properties_slug"),
        CheckConstraint("price >= 0", name="ck_properties_price"),
        CheckConstraint("currency ~ '^[A-Z]{3}$'", name="ck_properties_currency"),
        CheckConstraint("slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name="ck_properties_slug"),
        CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)", name="ck_properties_coordinates_pair"
        ),
        CheckConstraint(
            "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
            name="ck_properties_coordinates_range",
        ),
        CheckConstraint(
            "jsonb_typeof(location) = 'object' AND jsonb_typeof(features) = 'object'",
            name="ck_properties_objects",
        ),
        Index("ix_properties_status_created_at", "status", "created_at", "id"),
    )
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[PropertyStatus] = mapped_column(
        db_enum(PropertyStatus, "property_status"), default=PropertyStatus.draft, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    operation: Mapped[Operation] = mapped_column(
        db_enum(Operation, "property_operation"), nullable=False
    )
    property_type: Mapped[PropertyType] = mapped_column(
        db_enum(PropertyType, "property_type"), nullable=False
    )
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="MXN", nullable=False)
    location: Mapped[dict] = mapped_column(JSONB, nullable=False)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    features: Mapped[dict] = mapped_column(JSONB, nullable=False)
    images: Mapped[list["PropertyImage"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="PropertyImage.position",
        lazy="selectin",
    )


class PropertyImage(IdentityTimestamps, Base):
    __tablename__ = "property_images"
    __table_args__ = (
        UniqueConstraint("property_id", "position", name="uq_property_images_position"),
        CheckConstraint(
            "width > 0 AND height > 0 AND position >= 0", name="ck_property_images_dimensions"
        ),
    )
    property_id: Mapped[UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    object_key: Mapped[str | None] = mapped_column(String(1024))
    alt: Mapped[str] = mapped_column(String(250), nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    property: Mapped[Property] = relationship(back_populates="images")
