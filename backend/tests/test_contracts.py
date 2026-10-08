import io
from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from app.appointments.models import AppointmentStatus
from app.appointments.schemas import AppointmentCreate, AppointmentData
from app.appointments.service import TRANSITIONS, validate_transition
from app.config import Settings, get_settings
from app.db import get_db
from app.kitchen_configurations.schemas import KitchenCreate
from app.kitchen_configurations.submissions import Submission
from app.leads.schemas import LeadCreate
from app.main import app
from app.properties.schemas import PropertyCreate, PropertyOutput
from tests.payloads import appointment_payload, contact_payload, kitchen_payload, property_payload


def test_health_contract_and_unavailable_db():
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            response = client.get("/health")
            assert response.json() == {"status": "ok", "database": "ok"}
            assert response.headers["X-Request-ID"]
            db.execute.side_effect = OperationalError("SELECT 1", {}, Exception("secret"))
            response = client.get("/health")
            assert response.status_code == 503
            assert "secret" not in response.text
    finally:
        app.dependency_overrides.clear()


def test_admin_operations_default_deny_and_openapi():
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_settings] = lambda: Settings(db_password="test")
    try:
        with TestClient(app) as client:
            for method, path, body in (
                ("post", "/api/v1/properties", property_payload()),
                ("patch", f"/api/v1/properties/{uuid4()}", {"title": "Example"}),
                ("patch", f"/api/v1/appointments/{uuid4()}", {"status": "cancelled"}),
                ("get", f"/api/v1/kitchen-configurations/{uuid4()}", None),
            ):
                response = client.request(method, path, json=body)
                assert response.status_code == 401
            schema = client.get("/openapi.json").json()
            assert "/api/v1/kitchen-submissions" in schema["paths"]
            assert "/api/v1/auth/login" in schema["paths"]
            assert db.execute.call_count == 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "overrides",
    [
        {"price": "-1"},
        {"price": "12.345"},
        {"price": "NaN"},
        {"slug": "Bad Slug"},
        {"status": "unknown"},
        {"operation": "other"},
        {"title": " "},
        {"currency": "mxn"},
        {"latitude": 91, "longitude": 0},
        {"latitude": 19},
        {"images": [{"url": "javascript:alert(1)", "alt": "x", "width": 1, "height": 1}]},
        {"features": {"area_m2": -1, "bedrooms": 0, "bathrooms": 0, "parking_spaces": 0}},
        {"unexpected": "field"},
    ],
)
def test_property_input_rejects_invalid_values(overrides):
    with pytest.raises(ValidationError):
        PropertyCreate.model_validate(property_payload(**overrides))


def test_property_output_decimal_and_orm_shape():
    from app.properties.models import Property, PropertyImage

    now = datetime.now(UTC)
    values = PropertyCreate.model_validate(property_payload()).model_dump(exclude={"images"})
    item = Property(**values, id=uuid4(), created_at=now, updated_at=now)
    item.images = [
        PropertyImage(
            **property_payload()["images"][0],
            id=uuid4(),
            position=0,
            created_at=now,
            updated_at=now,
        )
    ]
    data = PropertyOutput.model_validate(item).model_dump(mode="json")
    assert data["price"] == "2500000.50"
    assert data["images"][0]["position"] == 0


@pytest.mark.parametrize(
    "overrides",
    [
        {"requested_datetime": "2030-10-12T10:00:00"},
        {"latitude": -91, "longitude": 0},
        {"latitude": None, "longitude": 10},
        {"branch": " "},
        {"status": "confirmed"},
    ],
)
def test_appointment_input(overrides):
    with pytest.raises(ValidationError):
        AppointmentCreate.model_validate(appointment_payload(**overrides))


def test_confirmation_requires_aware_datetime():
    with pytest.raises(ValidationError):
        AppointmentData.model_validate(appointment_payload(status="confirmed"))
    valid = AppointmentData.model_validate(
        appointment_payload(status="confirmed", confirmed_datetime="2030-10-12T16:00:00Z")
    )
    assert valid.confirmed_datetime.utcoffset().total_seconds() == 0


@pytest.mark.parametrize("current", list(AppointmentStatus))
@pytest.mark.parametrize("target", list(AppointmentStatus))
def test_every_appointment_transition(current, target):
    if current == target or target in TRANSITIONS[current]:
        validate_transition(current, target)
    else:
        with pytest.raises(HTTPException) as error:
            validate_transition(current, target)
        assert error.value.status_code == 409


@pytest.mark.parametrize(
    "overrides",
    [
        {"email": "invalid"},
        {"phone": "-------"},
        {"name": " "},
        {"phone": "abcd1234"},
        {"property_id": "not-uuid"},
        {"status": "closed"},
    ],
)
def test_lead_input(overrides):
    with pytest.raises(ValidationError):
        LeadCreate.model_validate(contact_payload(**overrides))


def test_kitchen_version_and_payload_limits():
    valid = KitchenCreate.model_validate(kitchen_payload())
    assert valid.countertop["label"] == "Superficie sólida Corian"
    for override in (
        {"selection_version": 0},
        {"selections": {"text": "x" * 65537}},
        {"latitude": 100},
        {"requested_datetime": "2030-01-01T12:00:00"},
    ):
        with pytest.raises(ValidationError):
            KitchenCreate.model_validate(kitchen_payload(**override))


def test_atomic_submission_context():
    values = {
        "configuration": kitchen_payload(),
        "appointment": appointment_payload(),
        "contact": contact_payload(),
    }
    assert Submission.model_validate(values).configuration.selection_version == 1
    values["appointment"]["branch"] = "Different"
    with pytest.raises(ValidationError):
        Submission.model_validate(values)


def test_initial_migration_renders_postgresql_ddl():
    output = io.StringIO()
    config = Config("alembic.ini", output_buffer=output)
    command.upgrade(config, "head", sql=True)
    sql = output.getvalue()
    for required in (
        "CREATE TYPE property_status",
        "CREATE TABLE leads",
        "ON DELETE RESTRICT",
        "CREATE TRIGGER",
        "TIMESTAMP WITH TIME ZONE",
        "uq_properties_slug",
    ):
        assert required in sql


@pytest.mark.parametrize(
    "settings",
    [
        {"cors_origins": ["*"]},
        {"cors_origins": ["https://example.com/path"]},
        {"cors_origins": ["https://user:secret@example.com"]},
        {"cookie_samesite": "none", "cookie_secure": False},
        {"session_hours": 0},
        {"session_hours": 25},
    ],
)
def test_unsafe_auth_configuration_rejected(settings):
    with pytest.raises(ValidationError):
        Settings(db_password="test", **settings)
