from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from app.common import InputModel, TimestampOutput
from app.leads.models import LeadStatus


class ContactInput(InputModel):
    source: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    phone: str = Field(min_length=7, max_length=40, pattern=r"^[+0-9() .-]+$")
    email: EmailStr | None = Field(default=None, max_length=254)
    message: str | None = Field(default=None, max_length=10000)

    @field_validator("phone")
    @classmethod
    def enough_digits(cls, value: str) -> str:
        if not 7 <= sum(char.isdigit() for char in value) <= 15:
            raise ValueError("phone must contain 7 to 15 digits")
        return value


class LeadCreate(ContactInput):
    property_id: UUID | None = None
    kitchen_configuration_id: UUID | None = None
    appointment_id: UUID | None = None


class LeadOutput(LeadCreate, TimestampOutput):
    status: LeadStatus


class LeadStatusPatch(InputModel):
    status: LeadStatus
