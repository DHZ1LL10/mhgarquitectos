from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from app.dependencies import Database, admin_endpoints_enabled
from app.properties.models import Property, PropertyImage, PropertyStatus
from app.properties.schemas import PropertyCreate, PropertyOutput, PropertyPatch

public_router = APIRouter(prefix="/properties", tags=["Properties · public"])
admin_router = APIRouter(
    prefix="/properties",
    tags=["Properties · future admin"],
    dependencies=[Depends(admin_endpoints_enabled)],
)


@public_router.get("", response_model=list[PropertyOutput])
def list_properties(
    db: Database, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)
):
    return db.scalars(
        select(Property)
        .where(Property.status == PropertyStatus.published)
        .order_by(Property.created_at.desc(), Property.id)
        .limit(limit)
        .offset(offset)
    ).all()


@public_router.get("/{slug}", response_model=PropertyOutput)
def get_property(slug: str, db: Database):
    item = db.scalar(
        select(Property).where(Property.slug == slug, Property.status == PropertyStatus.published)
    )
    if item is None:
        raise HTTPException(404, "Property not found")
    return item


@admin_router.post("", response_model=PropertyOutput, status_code=201)
def create_property(payload: PropertyCreate, db: Database):
    values = payload.model_dump(mode="python", exclude={"images"})
    item = Property(**values)
    item.images = [
        PropertyImage(**image.model_dump(), position=i) for i, image in enumerate(payload.images)
    ]
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@admin_router.patch("/{id}", response_model=PropertyOutput)
def update_property(id: UUID, payload: PropertyPatch, db: Database):
    item = db.scalar(select(Property).where(Property.id == id).with_for_update())
    if item is None:
        raise HTTPException(404, "Property not found")
    existing = {
        name: getattr(item, name) for name in PropertyCreate.model_fields if name != "images"
    }
    existing["images"] = [
        {name: getattr(image, name) for name in ("url", "object_key", "alt", "width", "height")}
        for image in item.images
    ]
    merged = PropertyCreate.model_validate({**existing, **payload.model_dump(exclude_unset=True)})
    for name, value in merged.model_dump(exclude={"images"}).items():
        setattr(item, name, value)
    if "images" in payload.model_fields_set:
        # Flush deletes first to avoid conflicts on (property_id, position).
        item.images.clear()
        db.flush()
        item.images = [
            PropertyImage(**image.model_dump(), position=i) for i, image in enumerate(merged.images)
        ]
    db.commit()
    db.refresh(item)
    return item
