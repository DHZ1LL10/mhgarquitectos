from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.common import IdentityTimestamps
from app.db import Base


class MediaCleanup(IdentityTimestamps, Base):
    """Durable outbox; cloud removal happens only after the database change commits."""

    __tablename__ = "media_cleanup"
    public_id: Mapped[str] = mapped_column(String(1024), unique=True)
