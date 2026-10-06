import enum
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.common import IdentityTimestamps, db_enum
from app.db import Base


class AppointmentStatus(str, enum.Enum):
    requested = "requested"
    pending_confirmation = "pending_confirmation"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class Appointment(IdentityTimestamps, Base):
    __tablename__ = "appointments"
    __table_args__ = (
        CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)", name="ck_appointments_coordinates_pair"
        ),
        CheckConstraint(
            "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
            name="ck_appointments_coordinates_range",
        ),
        CheckConstraint(
            "status NOT IN ('confirmed', 'completed') OR confirmed_datetime IS NOT NULL",
            name="ck_appointments_confirmation",
        ),
        Index("ix_appointments_status_requested", "status", "requested_datetime"),
    )
    requested_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    confirmed_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    branch: Mapped[str] = mapped_column(String(160), nullable=False)
    address: Mapped[str] = mapped_column(String(1000), nullable=False)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    status: Mapped[AppointmentStatus] = mapped_column(
        db_enum(AppointmentStatus, "appointment_status"),
        nullable=False,
        default=AppointmentStatus.requested,
    )
    notes: Mapped[str | None] = mapped_column(Text)
