from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.appointments.models import Appointment
from app.kitchen_configurations.models import KitchenConfiguration
from app.leads.schemas import LeadCreate
from app.properties.models import Property, PropertyStatus


def validate_references(payload: LeadCreate, db: Session) -> None:
    # FK constraints are the final authority, including concurrent changes.
    if payload.property_id is not None:
        item = db.get(Property, payload.property_id)
        if item is None or item.status != PropertyStatus.published:
            raise HTTPException(422, "property_id must reference a published property")
    for name, model in (
        ("kitchen_configuration_id", KitchenConfiguration),
        ("appointment_id", Appointment),
    ):
        entity_id = getattr(payload, name)
        if entity_id is not None and db.get(model, entity_id) is None:
            raise HTTPException(422, f"{name} does not reference an existing entity")
