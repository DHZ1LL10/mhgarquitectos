from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select

from app.appointments.models import Appointment
from app.appointments.schemas import AppointmentOutput
from app.dependencies import AuthenticatedUser, Database, current_user, require_admin
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.schemas import KitchenOutput
from app.kitchen_configurations.submission_models import KitchenSubmission
from app.kitchen_configurations.submission_schemas import SubmissionReference
from app.leads.models import Lead
from app.leads.schemas import LeadOutput
from app.properties.models import Property, PropertyStatus
from app.properties.schemas import PropertyOutput

router = APIRouter(prefix="/admin", tags=["Administration"], dependencies=[Depends(current_user)])


class LeadDetails(LeadOutput):
    submission: SubmissionReference | None = None
    appointment: AppointmentOutput | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AppointmentDetails(AppointmentOutput):
    leads: list[LeadDetails]
    submission: SubmissionReference | None = None


class KitchenDetails(KitchenOutput):
    leads: list[LeadDetails]
    appointments: list[AppointmentOutput]
    submission: SubmissionReference | None = None


def submission_map(db: Database, field, ids) -> dict:
    if not ids:
        return {}
    items = db.scalars(select(KitchenSubmission).where(field.in_(ids))).all()
    return {getattr(item, field.key): SubmissionReference.model_validate(item) for item in items}


@router.get("/dashboard")
def dashboard(db: Database, user: AuthenticatedUser):
    now = datetime.now(UTC)
    appointment_counts = db.execute(
        select(
            func.count().filter(Appointment.status == "requested"),
            func.count().filter(Appointment.status == "pending_confirmation"),
            func.count().filter(Appointment.status == "confirmed"),
            func.count().filter(
                Appointment.status == "confirmed", Appointment.confirmed_datetime >= now
            ),
            func.count().filter(Appointment.status == "completed"),
        )
    ).one()
    return {
        "properties": db.scalar(select(func.count()).select_from(Property))
        if user.role == "admin"
        else None,
        "leads": db.scalar(select(func.count()).select_from(Lead)),
        "appointments": db.scalar(select(func.count()).select_from(Appointment)),
        "kitchen_configurations": db.scalar(select(func.count()).select_from(KitchenConfiguration)),
        "new_leads": db.scalar(select(func.count()).select_from(Lead).where(Lead.status == "new")),
        "requested_appointments": appointment_counts[0],
        "pending_confirmation_appointments": appointment_counts[1],
        "confirmed_appointments": appointment_counts[2],
        "upcoming_appointments": appointment_counts[3],
        "completed_appointments": appointment_counts[4],
        "published_properties": db.scalar(
            select(func.count()).select_from(Property).where(Property.status == "published")
        )
        if user.role == "admin"
        else None,
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


@router.get("/leads", response_model=list[LeadDetails])
def leads(db: Database, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    items = db.scalars(
        select(Lead).order_by(Lead.created_at.desc(), Lead.id).limit(limit).offset(offset)
    ).all()
    submissions = submission_map(db, KitchenSubmission.lead_id, [item.id for item in items])
    appointments = {
        item.id: item
        for item in db.scalars(
            select(Appointment).where(
                Appointment.id.in_([lead.appointment_id for lead in items if lead.appointment_id])
            )
        ).all()
    }
    configurations = {
        item.id: item
        for item in db.scalars(
            select(KitchenConfiguration).where(
                KitchenConfiguration.id.in_(
                    [
                        lead.kitchen_configuration_id
                        for lead in items
                        if lead.kitchen_configuration_id
                    ]
                )
            )
        ).all()
    }

    def location(lead):
        return appointments.get(lead.appointment_id) or configurations.get(
            lead.kitchen_configuration_id
        )

    return [
        LeadDetails(
            **LeadOutput.model_validate(item).model_dump(),
            submission=submissions.get(item.id),
            appointment=(
                AppointmentOutput.model_validate(appointments[item.appointment_id])
                if item.appointment_id in appointments
                else None
            ),
            address=location(item).address if location(item) else None,
            latitude=location(item).latitude if location(item) else None,
            longitude=location(item).longitude if location(item) else None,
        )
        for item in items
    ]


@router.get("/appointments", response_model=list[AppointmentDetails])
def appointments(db: Database, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    priority = case(
        (Appointment.status == "pending_confirmation", 0),
        (Appointment.status == "requested", 1),
        (Appointment.status == "confirmed", 2),
        (Appointment.status == "completed", 3),
        else_=4,
    )
    items = db.scalars(
        select(Appointment)
        .order_by(priority, Appointment.requested_datetime.asc(), Appointment.id)
        .limit(limit)
        .offset(offset)
    ).all()
    contacts = db.scalars(
        select(Lead).where(Lead.appointment_id.in_([item.id for item in items]))
    ).all()
    lead_submissions = submission_map(db, KitchenSubmission.lead_id, [item.id for item in contacts])
    submissions = submission_map(db, KitchenSubmission.appointment_id, [item.id for item in items])
    return [
        AppointmentDetails(
            **AppointmentOutput.model_validate(item).model_dump(),
            leads=[
                LeadDetails(
                    **LeadOutput.model_validate(lead).model_dump(),
                    submission=lead_submissions.get(lead.id),
                )
                for lead in contacts
                if lead.appointment_id == item.id
            ],
            submission=submissions.get(item.id),
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
    lead_submissions = submission_map(db, KitchenSubmission.lead_id, [item.id for item in contacts])
    submissions = submission_map(
        db, KitchenSubmission.configuration_id, [item.id for item in items]
    )
    return [
        KitchenDetails(
            **KitchenOutput.model_validate(item).model_dump(),
            leads=[
                LeadDetails(
                    **LeadOutput.model_validate(lead).model_dump(),
                    submission=lead_submissions.get(lead.id),
                )
                for lead in contacts
                if lead.kitchen_configuration_id == item.id
            ],
            submission=submissions.get(item.id),
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
