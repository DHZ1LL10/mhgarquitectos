from fastapi import APIRouter
from pydantic import model_validator

from app.appointments.models import Appointment
from app.appointments.schemas import AppointmentCreate, AppointmentOutput
from app.common import InputModel
from app.dependencies import Database
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.schemas import KitchenCreate, KitchenOutput
from app.leads.models import Lead
from app.leads.schemas import ContactInput, LeadOutput

router = APIRouter(prefix="/kitchen-submissions", tags=["Kitchen submission · public"])


class Submission(InputModel):
    configuration: KitchenCreate
    appointment: AppointmentCreate
    contact: ContactInput

    @model_validator(mode="after")
    def same_context(self):
        for name in ("address", "latitude", "longitude", "branch"):
            if getattr(self.configuration, name) != getattr(self.appointment, name):
                raise ValueError(f"configuration and appointment must share {name}")
        requested = self.configuration.requested_datetime
        if requested is not None and requested != self.appointment.requested_datetime:
            raise ValueError("requested_datetime must match the appointment")
        return self


class SubmissionOutput(InputModel):
    configuration: KitchenOutput
    appointment: AppointmentOutput
    lead: LeadOutput


@router.post(
    "",
    response_model=SubmissionOutput,
    status_code=201,
    description="Atomic public submission: either all three entities persist, or none do.",
)
def create_submission(payload: Submission, db: Database):
    configuration_values = payload.configuration.model_dump()
    configuration_values["requested_datetime"] = payload.appointment.requested_datetime
    configuration = KitchenConfiguration(**configuration_values)
    appointment = Appointment(**payload.appointment.model_dump())
    with db.begin():
        db.add_all([configuration, appointment])
        db.flush()
        lead = Lead(
            **payload.contact.model_dump(),
            kitchen_configuration_id=configuration.id,
            appointment_id=appointment.id,
        )
        db.add(lead)
        db.flush()
    return SubmissionOutput(
        configuration=KitchenOutput.model_validate(configuration),
        appointment=AppointmentOutput.model_validate(appointment),
        lead=LeadOutput.model_validate(lead),
    )
