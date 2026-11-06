import re

from sqlalchemy import BigInteger, CheckConstraint, String
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.db import Base

KITCHEN_FOLIO_PREFIX = "COC"
_PREFIX_PATTERN = re.compile(r"^[A-Z]{3,12}$")


class ServiceFolioCounter(Base):
    __tablename__ = "service_folio_counters"
    __table_args__ = (
        CheckConstraint("last_value >= 0", name="ck_service_folio_counter_nonnegative"),
    )

    service_prefix: Mapped[str] = mapped_column(String(12), primary_key=True)
    last_value: Mapped[int] = mapped_column(BigInteger, nullable=False)


def format_service_folio(prefix: str, value: int) -> str:
    if not _PREFIX_PATTERN.fullmatch(prefix):
        raise ValueError("folio prefix must contain 3 to 12 uppercase letters")
    if value < 1:
        raise ValueError("folio value must be positive")
    return f"{prefix}-{value:05d}"


def next_service_folio(db: Session, prefix: str) -> str:
    if not _PREFIX_PATTERN.fullmatch(prefix):
        raise ValueError("folio prefix must contain 3 to 12 uppercase letters")
    statement = (
        insert(ServiceFolioCounter)
        .values(service_prefix=prefix, last_value=1)
        .on_conflict_do_update(
            index_elements=[ServiceFolioCounter.service_prefix],
            set_={"last_value": ServiceFolioCounter.last_value + 1},
        )
        .returning(ServiceFolioCounter.last_value)
    )
    value = db.scalar(statement)
    if value is None:  # pragma: no cover - PostgreSQL RETURNING always produces a value.
        raise RuntimeError("folio counter did not return a value")
    return format_service_folio(prefix, value)
