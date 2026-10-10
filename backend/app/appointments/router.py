from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select

from app.appointments.models import Appointment
from app.appointments.schemas import (
    AppointmentCreate,
    AppointmentData,
    AppointmentOutput,
    AppointmentPatch,
)
from app.appointments.service import validate_transition
from app.auth.security import enforce_public_rate_limit
from app.dependencies import Configuration, Database, require_admin

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post(
    "",
    response_model=AppointmentOutput,
    status_code=201,
    description="Public appointment request. Does not reserve availability or confirm a booking.",
)
def create_appointment(
    payload: AppointmentCreate, request: Request, db: Database, settings: Configuration
):
    enforce_public_rate_limit(
        request, db, settings, "appointments", settings.public_rate_limit_appointments
    )
    item = Appointment(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch(
    "/{id}",
    response_model=AppointmentOutput,
    dependencies=[Depends(require_admin)],
    description="Authenticated administrator operation.",
)
def update_appointment(id: UUID, payload: AppointmentPatch, db: Database):
    item = db.scalar(select(Appointment).where(Appointment.id == id).with_for_update())
    if item is None:
        raise HTTPException(404, "Appointment not found")
    existing = {name: getattr(item, name) for name in AppointmentData.model_fields}
    merged = AppointmentData.model_validate({**existing, **payload.model_dump(exclude_unset=True)})
    validate_transition(item.status, merged.status)
    for name, value in merged.model_dump().items():
        setattr(item, name, value)
    db.commit()
    db.refresh(item)
    return item
