from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.appointments.models import Appointment
from app.appointments.schemas import AppointmentOutput
from app.dependencies import AuthenticatedUser, Database, current_user, require_admin
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.schemas import KitchenOutput
from app.leads.models import Lead
from app.leads.schemas import LeadOutput
from app.properties.models import Property, PropertyStatus
from app.properties.schemas import PropertyOutput

router = APIRouter(prefix="/admin", tags=["Administration"], dependencies=[Depends(current_user)])


class AppointmentDetails(AppointmentOutput):
    leads: list[LeadOutput]


class KitchenDetails(KitchenOutput):
    leads: list[LeadOutput]
    appointments: list[AppointmentOutput]


@router.get("/dashboard")
def dashboard(db: Database, user: AuthenticatedUser):
    return {
        "properties": db.scalar(select(func.count()).select_from(Property))
        if user.role == "admin"
        else None,
        "leads": db.scalar(select(func.count()).select_from(Lead)),
        "appointments": db.scalar(select(func.count()).select_from(Appointment)),
        "kitchen_configurations": db.scalar(select(func.count()).select_from(KitchenConfiguration)),
    }


@router.get(
    "/properties", response_model=list[PropertyOutput], dependencies=[Depends(require_admin)]
)
def properties(
    db: Database,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: PropertyStatus | None = None,
):
    statement = select(Property)
    if status is not None:
        statement = statement.where(Property.status == status)
    return db.scalars(
        statement.order_by(Property.created_at.desc(), Property.id).limit(limit).offset(offset)
    ).all()


@router.get("/leads", response_model=list[LeadOutput])
def leads(db: Database, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    return db.scalars(
        select(Lead).order_by(Lead.created_at.desc(), Lead.id).limit(limit).offset(offset)
    ).all()


@router.get("/appointments", response_model=list[AppointmentDetails])
def appointments(db: Database, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    items = db.scalars(
        select(Appointment)
        .order_by(Appointment.requested_datetime.desc(), Appointment.id)
        .limit(limit)
        .offset(offset)
    ).all()
    contacts = db.scalars(
        select(Lead).where(Lead.appointment_id.in_([item.id for item in items]))
    ).all()
    return [
        AppointmentDetails(
            **AppointmentOutput.model_validate(item).model_dump(),
            leads=[
                LeadOutput.model_validate(lead)
                for lead in contacts
                if lead.appointment_id == item.id
            ],
        )
        for item in items
    ]


@router.get("/kitchen-configurations", response_model=list[KitchenDetails])
def kitchens(db: Database, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    items = db.scalars(
        select(KitchenConfiguration)
        .order_by(KitchenConfiguration.created_at.desc(), KitchenConfiguration.id)
        .limit(limit)
        .offset(offset)
    ).all()
    contacts = db.scalars(
        select(Lead).where(Lead.kitchen_configuration_id.in_([item.id for item in items]))
    ).all()
    related = db.scalars(
        select(Appointment).where(
            Appointment.id.in_([lead.appointment_id for lead in contacts if lead.appointment_id])
        )
    ).all()
    return [
        KitchenDetails(
            **KitchenOutput.model_validate(item).model_dump(),
            leads=[
                LeadOutput.model_validate(lead)
                for lead in contacts
                if lead.kitchen_configuration_id == item.id
            ],
            appointments=[
                AppointmentOutput.model_validate(appointment)
                for appointment in related
                if any(
                    lead.kitchen_configuration_id == item.id
                    and lead.appointment_id == appointment.id
                    for lead in contacts
                )
            ],
        )
        for item in items
    ]
