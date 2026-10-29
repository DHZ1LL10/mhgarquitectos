from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator

from app.auth.permissions import Permission, normalize_permissions
from app.common import InputModel, OutputModel


class LoginInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr = Field(max_length=254)
    password: SecretStr = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value


class UserIdentity(InputModel):
    email: EmailStr = Field(max_length=254)
    full_name: str = Field(min_length=1, max_length=200)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, value):
        if not value.strip():
            raise ValueError("Name required")
        return value.strip()


class CreateAdminInput(UserIdentity):
    """Internal bootstrap-compatible input; role is never accepted from public APIs."""

    password: SecretStr = Field(min_length=12, max_length=128)
    role: Literal["owner", "staff"] = "owner"
    permissions: list[Permission] = Field(default_factory=list)
    must_change_password: bool = False

    @field_validator("permissions")
    @classmethod
    def permissions_are_valid(cls, value):
        return normalize_permissions(value)


class StaffCreateInput(UserIdentity):
    temporary_password: SecretStr = Field(min_length=12, max_length=128)
    permissions: list[Permission]

    @field_validator("permissions")
    @classmethod
    def permissions_are_valid(cls, value):
        return normalize_permissions(value)


class StaffUpdateInput(InputModel):
    email: EmailStr | None = Field(default=None, max_length=254)
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    permissions: list[Permission] | None = None
    is_active: bool | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, value):
        if value is not None and not value.strip():
            raise ValueError("Name required")
        return value.strip() if value is not None else value

    @field_validator("permissions")
    @classmethod
    def permissions_are_valid(cls, value):
        return normalize_permissions(value) if value is not None else value


class ChangePasswordInput(InputModel):
    current_password: SecretStr = Field(min_length=1, max_length=128)
    new_password: SecretStr = Field(min_length=12, max_length=128)


class PasswordResetInput(InputModel):
    temporary_password: SecretStr = Field(min_length=12, max_length=128)


class UserOutput(OutputModel):
    id: UUID
    email: str
    full_name: str
    role: Literal["owner", "staff"]
    is_active: bool
    permissions: list[Permission]
    must_change_password: bool
    last_login_at: datetime | None


class AuditEventOutput(OutputModel):
    id: UUID
    actor_user_id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None
    event_metadata: dict
    created_at: datetime
