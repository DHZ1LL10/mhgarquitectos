from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.common import IdentityTimestamps
from app.db import Base


class KitchenSubmission(IdentityTimestamps, Base):
    __tablename__ = "kitchen_submissions"
    __table_args__ = (
        CheckConstraint("status = 'received'", name="ck_kitchen_submission_status"),
        CheckConstraint(
            "notification_status IN ('pending', 'sent', 'failed', 'not_configured')",
            name="ck_kitchen_submission_notification_status",
        ),
        CheckConstraint(
            "notification_attempts >= 0", name="ck_kitchen_submission_notification_attempts"
        ),
        Index("ix_kitchen_submissions_notification_created", "notification_status", "created_at"),
    )

    folio: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    idempotency_key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    configuration_id: Mapped[UUID] = mapped_column(
        ForeignKey("kitchen_configurations.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    appointment_id: Mapped[UUID] = mapped_column(
        ForeignKey("appointments.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    lead_id: Mapped[UUID] = mapped_column(
        ForeignKey("leads.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="received")
    notification_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    notification_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notification_error: Mapped[str | None] = mapped_column(Text)
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
