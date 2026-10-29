"""Create or reconcile the single approved real property listing."""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import SessionLocal
from app.properties.models import Property, PropertyImage
from app.properties.real_catalog import (
    MATA_LARGA_SLUG,
    mata_larga_property,
    validate_mata_larga_payload,
)
from app.properties.schemas import PropertyCreate

SUPPORTED_ENVIRONMENTS = frozenset({"local", "test", "staging", "production"})


@dataclass(frozen=True)
class BootstrapResult:
    created: int
    updated: int
    skipped: int
    slug: str
    status: str


def format_summary(result: BootstrapResult) -> str:
    return (
        f"created={result.created} updated={result.updated} skipped={result.skipped} "
        f"slug={result.slug} status={result.status}"
    )


def _property_images(payload: PropertyCreate) -> list[PropertyImage]:
    return [
        PropertyImage(**image.model_dump(), position=position)
        for position, image in enumerate(payload.images)
    ]


def _stored_payload(item: Property) -> PropertyCreate:
    values = {name: getattr(item, name) for name in PropertyCreate.model_fields if name != "images"}
    values["images"] = [
        {name: getattr(image, name) for name in ("url", "object_key", "alt", "width", "height")}
        for image in item.images
    ]
    return PropertyCreate.model_validate(values)


def bootstrap_mata_larga(db: Session) -> BootstrapResult:
    """Upsert only Mata Larga by its immutable approved slug."""
    payload = mata_larga_property()
    validate_mata_larga_payload(payload)
    item = db.scalar(select(Property).where(Property.slug == MATA_LARGA_SLUG).with_for_update())

    if item is None:
        values = payload.model_dump(mode="python", exclude={"images"})
        item = Property(**values)
        item.images = _property_images(payload)
        db.add(item)
        db.flush()
        return BootstrapResult(1, 0, 0, payload.slug, payload.status.value)

    if _stored_payload(item) == payload:
        return BootstrapResult(0, 0, 1, payload.slug, payload.status.value)

    for name, value in payload.model_dump(mode="python", exclude={"images"}).items():
        setattr(item, name, value)
    item.images.clear()
    db.flush()
    item.images = _property_images(payload)
    db.flush()
    return BootstrapResult(0, 1, 0, payload.slug, payload.status.value)


def main() -> None:
    settings = get_settings()
    if settings.environment not in SUPPORTED_ENVIRONMENTS:
        raise SystemExit("Unsupported environment for controlled real property bootstrap")

    with SessionLocal() as db:
        try:
            result = bootstrap_mata_larga(db)
            db.commit()
        except Exception:
            db.rollback()
            raise

    print(format_summary(result))


if __name__ == "__main__":
    main()
