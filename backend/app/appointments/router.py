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
from app.auth.audit import record_audit
from app.auth.security import enforce_public_rate_limit
from app.dependencies import AuthenticatedUser, Configuration, Database, require_permission

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
    dependencies=[Depends(require_permission("appointments.manage"))],
    description="Authenticated administrator operation.",
)
def update_appointment(id: UUID, payload: AppointmentPatch, db: Database, actor: AuthenticatedUser):
    item = db.scalar(select(Appointment).where(Appointment.id == id).with_for_update())
    if item is None:
        raise HTTPException(404, "Appointment not found")
    previous_status = item.status
    existing = {name: getattr(item, name) for name in AppointmentData.model_fields}
    merged = AppointmentData.model_validate({**existing, **payload.model_dump(exclude_unset=True)})
    validate_transition(item.status, merged.status)
    for name, value in merged.model_dump().items():
        setattr(item, name, value)
    actions = {
        "confirmed": "APPOINTMENT_CONFIRMED",
        "cancelled": "APPOINTMENT_CANCELLED",
        "completed": "APPOINTMENT_COMPLETED",
    }
    action = (
        actions.get(merged.status, "APPOINTMENT_UPDATED")
        if merged.status != previous_status
        else "APPOINTMENT_UPDATED"
    )
    record_audit(
        db,
        actor,
        action,
        "appointment",
        item.id,
        {"status": merged.status},
    )
    db.commit()
    db.refresh(item)
    return item
