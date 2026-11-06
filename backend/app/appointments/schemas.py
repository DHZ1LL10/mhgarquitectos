from pydantic import AwareDatetime, Field, model_validator

from app.appointments.models import AppointmentStatus
from app.common import Coordinates, InputModel, TimestampOutput


class AppointmentCreate(Coordinates):
    requested_datetime: AwareDatetime
    branch: str = Field(min_length=1, max_length=160)
    address: str = Field(min_length=1, max_length=1000)
    notes: str | None = Field(default=None, max_length=10000)


class AppointmentData(AppointmentCreate):
    confirmed_datetime: AwareDatetime | None = None
    status: AppointmentStatus = AppointmentStatus.requested

    @model_validator(mode="after")
    def require_confirmation(self):
        if (
            self.status in (AppointmentStatus.confirmed, AppointmentStatus.completed)
            and self.confirmed_datetime is None
        ):
            raise ValueError("confirmed_datetime is required for confirmed/completed appointments")
        return self


class AppointmentPatch(InputModel):
    requested_datetime: AwareDatetime | None = None
    confirmed_datetime: AwareDatetime | None = None
    branch: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    notes: str | None = None
    status: AppointmentStatus | None = None


class AppointmentOutput(AppointmentData, TimestampOutput):
    pass
