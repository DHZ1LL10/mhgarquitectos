from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.common import IdentityTimestamps
from app.db import Base


class KitchenConfiguration(IdentityTimestamps, Base):
    __tablename__ = "kitchen_configurations"
    __table_args__ = (
        CheckConstraint("selection_version >= 1", name="ck_kitchen_selection_version"),
        CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)", name="ck_kitchen_coordinates_pair"
        ),
        CheckConstraint(
            "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
            name="ck_kitchen_coordinates_range",
        ),
        CheckConstraint(
            "jsonb_typeof(selections) = 'object' AND jsonb_typeof(extras) = 'array'",
            name="ck_kitchen_selections",
        ),
    )
    current_situation: Mapped[str] = mapped_column(String(200), nullable=False)
    interior_board: Mapped[dict] = mapped_column(JSONB, nullable=False)
    exterior_fronts: Mapped[dict] = mapped_column(JSONB, nullable=False)
    hardware: Mapped[dict] = mapped_column(JSONB, nullable=False)
    countertop: Mapped[dict] = mapped_column(JSONB, nullable=False)
    finish: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    extras: Mapped[list] = mapped_column(JSONB, nullable=False)
    address: Mapped[str] = mapped_column(String(1000), nullable=False)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    branch: Mapped[str] = mapped_column(String(160), nullable=False)
    advisor: Mapped[str | None] = mapped_column(String(160))
    requested_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    selection_version: Mapped[int] = mapped_column(nullable=False, default=1)
    selections: Mapped[dict] = mapped_column(JSONB, nullable=False)
