import io
from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from app.appointments.models import AppointmentStatus
from app.appointments.schemas import AppointmentCreate, AppointmentData
from app.appointments.service import TRANSITIONS, validate_transition
from app.auth.security import client_ip
from app.config import Settings, get_settings
from app.db import engine_options, get_db
from app.kitchen_configurations.schemas import KitchenCreate
from app.kitchen_configurations.submissions import Submission
from app.leads.schemas import LeadCreate
from app.main import app, create_app
from app.notifications.email import (
    KitchenEmailData,
    SmtpEmailNotifier,
    build_kitchen_email,
    map_url,
)
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


def test_database_url_fallback_ssl_and_small_pool():
    local = Settings(
        db_host="db",
        db_port=5433,
        db_name="mhg_local",
        db_user="mhg_user",
        db_password="not-printed",
        db_sslmode="disable",
    )
    assert local.database_url.host == "db"
    assert local.database_url.database == "mhg_local"
    assert local.database_url.query["sslmode"] == "disable"

    managed = Settings(
        DATABASE_URL="postgresql://managed:not-printed@database.example/mhg",
        db_sslmode="require",
        db_pool_size=3,
        db_max_overflow=2,
    )
    assert managed.database_url.drivername == "postgresql+psycopg"
    assert managed.database_url.host == "database.example"
    assert managed.database_url.query["sslmode"] == "require"
    options = engine_options(managed)
    assert options["pool_size"] == 3 and options["max_overflow"] == 2


def request_with_peer(peer: str, headers: list[tuple[bytes, bytes]]) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": headers,
            "client": (peer, 1234),
            "server": ("test", 80),
            "scheme": "http",
            "query_string": b"",
        }
    )


def test_forwarded_ip_requires_a_trusted_immediate_proxy():
    spoofed = request_with_peer("203.0.113.10", [(b"x-forwarded-for", b"198.51.100.20")])
    disabled = Settings(db_password="test", trust_proxy=False)
    assert client_ip(spoofed, disabled) == "203.0.113.10"
    forwarded_only = request_with_peer("203.0.113.10", [(b"forwarded", b"for=198.51.100.20")])
    assert client_ip(forwarded_only, disabled) == "203.0.113.10"

    configured = Settings(db_password="test", trust_proxy=True, trusted_proxy_cidrs=["10.0.0.0/8"])
    assert client_ip(spoofed, configured) == "203.0.113.10"
    trusted = request_with_peer("10.0.0.4", [(b"x-forwarded-for", b"198.51.100.20, 10.0.0.3")])
    assert client_ip(trusted, configured) == "198.51.100.20"
    malformed = request_with_peer("10.0.0.4", [(b"x-forwarded-for", b"not-an-ip")])
    assert client_ip(malformed, configured) == "10.0.0.4"


def test_request_body_limit_rejects_before_route_processing():
    limited = create_app(Settings(db_password="test", max_request_body_bytes=1024))
    with TestClient(limited, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/kitchen-submissions",
            content=b"x" * 1025,
            headers={"Content-Type": "application/json", "Idempotency-Key": str(uuid4())},
        )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "payload_too_large"


def test_openapi_can_be_disabled_and_security_headers_are_present():
    disabled = create_app(Settings(db_password="test", openapi_enabled=False))
    with TestClient(disabled, raise_server_exceptions=False) as client:
        response = client.get("/openapi.json")
    assert response.status_code == 404
    assert response.headers["x-content-type-options"] == "nosniff"
    assert (
        response.headers["content-security-policy"] == "default-src 'none'; frame-ancestors 'none'"
    )


def test_exact_cors_allowlist_accepts_only_the_configured_origin():
    cors_app = create_app(
        Settings(db_password="test", cors_origins=["https://staging.example.com"])
    )
    with TestClient(cors_app) as client:
        allowed = client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://staging.example.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        denied = client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://preview.netlify.app",
                "Access-Control-Request-Method": "POST",
            },
        )
    assert allowed.headers["access-control-allow-origin"] == "https://staging.example.com"
    assert denied.status_code == 400
    assert "access-control-allow-origin" not in denied.headers


def test_staging_email_override_is_mandatory_and_authoritative():
    with pytest.raises(ValidationError):
        Settings(
            db_password="test",
            environment="staging",
            cookie_secure=True,
            smtp_host="smtp.example.com",
            smtp_from="sender@example.com",
            notification_email="customer@example.com",
        )
    staging = Settings(
        db_password="test",
        environment="staging",
        cookie_secure=True,
        smtp_host="smtp.example.com",
        smtp_from="sender@example.com",
        notification_email="customer@example.com",
        staging_email_override="internal@example.com",
    )
    assert staging.notification_recipient == "internal@example.com"
    assert SmtpEmailNotifier(staging).configured is True
    with pytest.raises(ValidationError):
        Settings(db_password="test", staging_email_override="internal@example.com")


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


def test_kitchen_email_has_plaintext_html_and_openstreetmap_link():
    data = KitchenEmailData(
        folio="MHG-TEST",
        submission_id=str(uuid4()),
        name="María <Cliente>",
        phone="+52 272 220 0485",
        email="maria@example.com",
        requested_datetime="2030-10-12T16:00:00+00:00",
        branch="Fortín",
        address="Dirección de prueba",
        latitude=19.043,
        longitude=-98.198,
        current_situation="remodelacion",
        interior_board={"label": "Blanco"},
        exterior_fronts={"linea": ["Arena"]},
        hardware={"bisagras": "Cierre suave"},
        countertop={"label": "Superficie sólida Corian"},
        finish={"label": "Blanco"},
        extras=[{"label": "Iluminación LED"}],
        received_at="2030-10-10T18:30:00+00:00",
        notes="Medidas <pendientes> & confirmar",
    )
    message = build_kitchen_email(data, "web@example.com", "ventas@example.com")
    assert message["Subject"] == "Nueva solicitud de cocina MHG-TEST"
    assert message.get_body(preferencelist=("plain",)).get_content().find("María <Cliente>") >= 0
    html = message.get_body(preferencelist=("html",)).get_content()
    assert "María &lt;Cliente&gt;" in html
    assert "Medidas &lt;pendientes&gt; &amp; confirmar" in html
    assert "Datos del cliente" in html
    assert "Cita / levantamiento" in html
    assert "Bisagras" in html
    assert "{" not in html and "&quot;" not in html
    assert "openstreetmap.org" in html
    plain = message.get_body(preferencelist=("plain",)).get_content()
    assert "DATOS DEL CLIENTE" in plain
    assert "CONFIGURACIÓN" in plain
    assert "Medidas <pendientes> & confirmar" in plain
    without_pin = build_kitchen_email(
        KitchenEmailData(**{**data.__dict__, "latitude": None, "longitude": None}),
        "web@example.com",
        "ventas@example.com",
    )
    assert "openstreetmap.org" not in without_pin.get_body(preferencelist=("html",)).get_content()
    assert "Sin pin seleccionado" in without_pin.get_body(preferencelist=("plain",)).get_content()
    assert map_url(None, None) is None


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
        "CREATE TABLE kitchen_submissions",
        "CREATE TABLE public_rate_limits",
        "uq_kitchen_submissions_idempotency_key_hash",
    ):
        assert required in sql


@pytest.mark.parametrize(
    "settings",
    [
        {"cors_origins": ["*"]},
        {"cors_origins": ["https://example.com/path"]},
        {"cors_origins": ["https://user:secret@example.com"]},
        {"cookie_samesite": "none", "cookie_secure": False},
        {"environment": "staging", "cookie_secure": False},
        {"trust_proxy": True, "trusted_proxy_cidrs": []},
        {"trusted_proxy_cidrs": ["not-a-network"]},
        {"session_hours": 0},
        {"session_hours": 25},
        {"smtp_user": "user", "smtp_password": None},
        {"smtp_from": "bad\n@example.com"},
    ],
)
def test_unsafe_auth_configuration_rejected(settings):
    with pytest.raises(ValidationError):
        Settings(db_password="test", **settings)
