import enum
from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.common import IdentityTimestamps, db_enum
from app.db import Base


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    closed = "closed"


class Lead(IdentityTimestamps, Base):
    __tablename__ = "leads"
    __table_args__ = (Index("ix_leads_status_created", "status", "created_at"),)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    email: Mapped[str | None] = mapped_column(String(254))
    message: Mapped[str | None] = mapped_column(Text)
    property_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("properties.id", ondelete="RESTRICT"), index=True
    )
    kitchen_configuration_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("kitchen_configurations.id", ondelete="RESTRICT"), index=True
    )
    appointment_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[LeadStatus] = mapped_column(
        db_enum(LeadStatus, "lead_status"), nullable=False, default=LeadStatus.new
    )
