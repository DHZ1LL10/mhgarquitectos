from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import Database, current_user
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.schemas import KitchenCreate, KitchenOutput

router = APIRouter(prefix="/kitchen-configurations", tags=["Kitchen configurations"])


@router.post(
    "",
    response_model=KitchenOutput,
    status_code=201,
    description="Public submission. Selection snapshots are customer input, not authoritative pricing.",
)
def create_configuration(payload: KitchenCreate, db: Database):
    item = KitchenConfiguration(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get(
    "/{id}",
    response_model=KitchenOutput,
    dependencies=[Depends(current_user)],
    description="Authenticated administrative reader; contains personal data.",
)
def get_configuration(id: UUID, db: Database):
    item = db.get(KitchenConfiguration, id)
    if item is None:
        raise HTTPException(404, "Kitchen configuration not found")
    return item
