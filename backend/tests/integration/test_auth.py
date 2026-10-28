from datetime import UTC, datetime, timedelta
from unittest.mock import patch
from uuid import uuid4

import pytest
from sqlalchemy import inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.models import AdminAuditEvent, AdminSession
from app.auth.permissions import DEFAULT_STAFF_PERMISSIONS
from app.auth.schemas import CreateAdminInput
from app.auth.security import create_user, token_digest
from app.scripts import create_owner
from tests.payloads import appointment_payload, property_payload

PASSWORD = "Test-only-password-123!"


def add_user(
    connection, role="owner", active=True, permissions=None, email=None, must_change=False
):
    with Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    ) as db:
        user = create_user(
            db,
            CreateAdminInput(
                email=email or role + "@example.com",
                full_name="Test User",
                password=PASSWORD,
                role=role,
                permissions=permissions
                if permissions is not None
                else (DEFAULT_STAFF_PERMISSIONS if role == "staff" else []),
                must_change_password=must_change,
            ),
        )
        user.is_active = active
        db.commit()
        return user


def login(client, role="owner", password=PASSWORD, email=None):
    return client.post(
        "/api/v1/auth/login", json={"email": email or role + "@example.com", "password": password}
    )


def test_owner_bootstrap_and_unique_normalized_email(connection, monkeypatch):
    def session():
        return Session(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        )

    monkeypatch.setattr(create_owner, "SessionLocal", session)
    monkeypatch.setattr(create_owner.sys.stdin, "isatty", lambda: True)
    with (
        patch("builtins.input", side_effect=["First Admin", "ADMIN@example.com"]),
        patch.object(create_owner, "getpass", side_effect=[PASSWORD, PASSWORD]),
    ):
        create_owner.main()
    row = connection.execute(text("SELECT email, password_hash, role FROM admin_users")).one()
    assert row.email == "admin@example.com" and row.role == "owner"
    assert row.password_hash.startswith("$argon2id$") and PASSWORD not in row.password_hash
    with pytest.raises(ValueError):
        add_user(connection, email="second@example.com")
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(text("UPDATE admin_users SET email = 'ADMIN@example.com'"))
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(text("UPDATE admin_users SET role = 'superuser'"))
    assert (
        inspect(connection).get_foreign_keys("admin_sessions")[0]["options"]["ondelete"]
        == "CASCADE"
    )


def test_login_cookie_me_rotation_logout_and_revocation(anonymous_client, connection):
    user = add_user(connection)
    response = login(anonymous_client)
    assert response.status_code == 200
    assert response.json()["id"] == str(user.id) and response.json()["last_login_at"]
    assert {"password", "password_hash", "token", "session_token"}.isdisjoint(response.json())
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Max-Age=28800" in cookie
    raw = anonymous_client.cookies.get("mhg_session")
    assert connection.scalar(select(AdminSession.token_hash)) == token_digest(raw)
    assert anonymous_client.get("/api/v1/auth/me").status_code == 200
    assert login(anonymous_client).status_code == 200
    assert (
        connection.scalar(
            select(AdminSession.token_hash).where(AdminSession.token_hash == token_digest(raw))
        )
        is None
    )
    current = anonymous_client.cookies.get("mhg_session")
    assert anonymous_client.post("/api/v1/auth/logout").status_code == 204
    assert anonymous_client.get("/api/v1/auth/me").status_code == 401
    anonymous_client.cookies.set("mhg_session", current)
    assert anonymous_client.get("/api/v1/auth/me").status_code == 401
    assert anonymous_client.post("/api/v1/auth/logout").status_code == 204


@pytest.mark.parametrize("active,password", [(True, "wrong-password"), (False, PASSWORD)])
def test_invalid_credentials_and_inactive_user(anonymous_client, connection, active, password):
    add_user(connection, role="staff", active=active)
    response = login(anonymous_client, role="staff", password=password)
    assert (
        response.status_code == 401 and response.json()["error"]["message"] == "Invalid credentials"
    )
    assert not anonymous_client.cookies.get("mhg_session")


def test_expired_session_and_immediate_user_deactivation(client, connection):
    connection.execute(text("UPDATE admin_users SET role = 'staff', is_active = false"))
    assert client.get("/api/v1/auth/me").status_code == 401
    connection.execute(text("UPDATE admin_users SET is_active = true"))
    connection.execute(
        text("UPDATE admin_sessions SET expires_at = :expired"),
        {"expired": datetime.now(UTC) - timedelta(seconds=1)},
    )
    assert client.get("/api/v1/auth/me").status_code == 401


def test_csrf_origin_header_and_login_rate_limit(anonymous_client, connection):
    add_user(connection)
    payload = {"email": "owner@example.com", "password": PASSWORD}
    assert (
        anonymous_client.post(
            "/api/v1/auth/login", json=payload, headers={"Origin": "https://evil.example"}
        ).status_code
        == 403
    )
    assert (
        anonymous_client.post(
            "/api/v1/auth/login", json=payload, headers={"X-MHG-Admin": ""}
        ).status_code
        == 403
    )
    for _ in range(5):
        assert login(anonymous_client, password="wrong").status_code == 401
    response = login(anonymous_client)
    assert response.status_code == 429 and response.headers["retry-after"]
    connection.execute(
        text("UPDATE auth_login_limits SET expires_at = now() - interval '1 second'")
    )
    assert login(anonymous_client).status_code == 200
    assert (
        anonymous_client.post(
            "/api/v1/auth/logout", headers={"Origin": "https://evil.example"}
        ).status_code
        == 403
    )
    assert anonymous_client.get("/api/v1/auth/me").status_code == 200


@pytest.mark.parametrize(
    "path",
    [
        "/admin/dashboard",
        "/admin/properties",
        "/admin/leads",
        "/admin/appointments",
        "/admin/kitchen-configurations",
        "/auth/me",
    ],
)
def test_administrative_reads_require_authentication(anonymous_client, path):
    assert anonymous_client.get("/api/v1" + path).status_code == 401


def test_staff_permissions_and_admin_writes(anonymous_client, connection):
    add_user(connection, role="staff")
    assert login(anonymous_client, role="staff").status_code == 200
    for path in ("leads", "appointments", "kitchen-configurations", "dashboard"):
        assert anonymous_client.get("/api/v1/admin/" + path).status_code == 200
    assert anonymous_client.get("/api/v1/admin/properties").status_code == 403
    assert anonymous_client.post("/api/v1/properties", json=property_payload()).status_code == 403
    lead = anonymous_client.post(
        "/api/v1/leads",
        json={"source": "website", "name": "Persona sintética", "phone": "0000000000"},
    ).json()
    assert (
        anonymous_client.patch(
            f"/api/v1/leads/{lead['id']}/status", json={"status": "contacted"}
        ).status_code
        == 403
    )
    appointment = anonymous_client.post("/api/v1/appointments", json=appointment_payload()).json()
    assert (
        anonymous_client.patch(
            "/api/v1/appointments/" + appointment["id"], json={"status": "cancelled"}
        ).status_code
        == 403
    )
    add_user(connection)
    assert login(anonymous_client).status_code == 200
    assert (
        anonymous_client.patch(
            f"/api/v1/leads/{lead['id']}/status", json={"status": "contacted"}
        ).json()["status"]
        == "contacted"
    )
    assert (
        anonymous_client.patch(
            f"/api/v1/leads/{lead['id']}/status", json={"status": "unknown"}
        ).status_code
        == 422
    )
    prop = anonymous_client.post("/api/v1/properties", json=property_payload())
    assert prop.status_code == 201
    assert (
        anonymous_client.patch(
            "/api/v1/properties/" + prop.json()["id"], json={"status": "published"}
        ).status_code
        == 200
    )
    assert anonymous_client.get("/api/v1/admin/properties").json()[0]["status"] == "published"
    assert (
        anonymous_client.patch(
            "/api/v1/appointments/" + appointment["id"], json={"status": "cancelled"}
        ).status_code
        == 200
    )
    assert (
        anonymous_client.patch(
            "/api/v1/properties/" + prop.json()["id"],
            json={"status": "archived"},
            headers={"X-MHG-Admin": ""},
        ).status_code
        == 403
    )


def test_administrative_related_records_and_no_store(client):
    from tests.payloads import contact_payload, kitchen_payload

    response = client.post(
        "/api/v1/kitchen-submissions",
        headers={"Idempotency-Key": str(uuid4())},
        json={
            "configuration": kitchen_payload(),
            "appointment": appointment_payload(),
            "contact": contact_payload(),
        },
    )
    assert response.status_code == 201
    saved = response.json()
    for path in ("leads", "appointments", "kitchen-configurations"):
        response = client.get("/api/v1/admin/" + path)
        assert response.status_code == 200 and response.headers["cache-control"] == "no-store"
        assert len(response.json()) == 1
    config = client.get("/api/v1/admin/kitchen-configurations").json()[0]
    assert config["leads"][0]["id"] == saved["lead_id"]
    assert config["appointments"][0]["id"] == saved["appointment_id"]
    assert config["submission"]["folio"] == saved["folio"]
    assert (
        client.get("/api/v1/admin/appointments").json()[0]["leads"][0]["name"]
        == "Persona de prueba"
    )
    lead = client.get("/api/v1/admin/leads").json()[0]
    assert lead["appointment"]["requested_datetime"] == "2030-10-12T16:00:00Z"
    dashboard = client.get("/api/v1/admin/dashboard").json()
    assert dashboard["new_leads"] == 1
    assert dashboard["requested_appointments"] == 1
    assert dashboard["pending_confirmation_appointments"] == 0
    assert dashboard["published_properties"] == 0
    assert client.get("/api/v1/admin/leads?limit=101").status_code == 422
    assert (
        client.get(f"/api/v1/admin/leads/{saved['lead_id']}").json()["submission"]["folio"]
        == saved["folio"]
    )
    assert (
        client.get(f"/api/v1/admin/appointments/{saved['appointment_id']}").json()["leads"][0]["id"]
        == saved["lead_id"]
    )
    assert (
        client.get(f"/api/v1/admin/kitchen-configurations/{saved['configuration_id']}").json()[
            "submission"
        ]["folio"]
        == saved["folio"]
    )
    assert client.get(f"/api/v1/admin/leads/{uuid4()}").status_code == 404
    assert client.get(f"/api/v1/admin/appointments/{uuid4()}").status_code == 404
    assert client.get(f"/api/v1/admin/kitchen-configurations/{uuid4()}").status_code == 404


def test_database_email_uniqueness_and_session_cascade(client, connection):
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(
            text(
                "INSERT INTO admin_users (email, password_hash, full_name, role, is_active) SELECT email, password_hash, full_name, role, is_active FROM admin_users LIMIT 1"
            )
        )
    assert connection.scalar(select(AdminSession.token_hash))
    connection.execute(text("DELETE FROM admin_users"))
    assert connection.scalar(select(AdminSession.token_hash)) is None
    assert client.get("/api/v1/auth/me").status_code == 401


def test_permission_changes_apply_to_existing_session(client, connection):
    assert client.get("/api/v1/admin/properties").status_code == 200
    connection.execute(
        text(
            "UPDATE admin_users SET role = 'staff', permissions = '[\"dashboard.view\",\"clients.view\"]'::jsonb"
        )
    )
    assert client.get("/api/v1/admin/properties").status_code == 403
    assert client.get("/api/v1/admin/leads").status_code == 200


def test_secure_cookie_and_explicit_cors(anonymous_client, connection):
    from app.config import get_settings
    from app.main import app

    add_user(connection)
    settings = get_settings().model_copy(update={"cookie_secure": True, "cookie_samesite": "lax"})
    app.dependency_overrides[get_settings] = lambda: settings
    response = login(anonymous_client)
    assert response.status_code == 200
    cookie = response.headers["set-cookie"]
    assert "Secure" in cookie and "HttpOnly" in cookie and "SameSite=lax" in cookie
    assert "Domain=" not in cookie
    allowed = anonymous_client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-mhg-admin",
        },
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert allowed.headers["access-control-allow-credentials"] == "true"
    denied = anonymous_client.options(
        "/api/v1/auth/login",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert denied.status_code == 400 and "access-control-allow-origin" not in denied.headers


def test_owner_user_management_password_gate_and_audit(client, connection):
    created = client.post(
        "/api/v1/admin/users",
        json={
            "full_name": "Temporary Staff",
            "email": "staff-member@example.com",
            "temporary_password": "Temporary-pass-123!",
            "permissions": ["dashboard.view", "appointments.view"],
        },
    )
    assert created.status_code == 201
    staff = created.json()
    assert staff["role"] == "staff" and staff["must_change_password"] is True
    assert "temporary_password" not in created.text and "password_hash" not in created.text
    assert (
        client.post(
            "/api/v1/admin/users",
            json={
                "full_name": "Bad",
                "email": "bad@example.com",
                "temporary_password": "Temporary-pass-123!",
                "permissions": ["unknown.permission"],
            },
        ).status_code
        == 422
    )
    owner = client.get("/api/v1/auth/me").json()
    assert (
        client.patch(f"/api/v1/admin/users/{owner['id']}", json={"is_active": False}).status_code
        == 409
    )
    assert client.delete(f"/api/v1/admin/users/{staff['id']}").status_code == 405

    assert (
        login(
            client, role="staff", email="staff-member@example.com", password="Temporary-pass-123!"
        ).status_code
        == 200
    )
    assert client.get("/api/v1/auth/me").json()["must_change_password"] is True
    assert client.get("/api/v1/admin/dashboard").status_code == 403
    assert (
        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "wrong", "new_password": "Permanent-pass-456!"},
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "Temporary-pass-123!", "new_password": "too-short"},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "Temporary-pass-123!", "new_password": "Permanent-pass-456!"},
        ).status_code
        == 200
    )
    assert client.get("/api/v1/admin/dashboard").status_code == 200
    assert client.get("/api/v1/admin/leads").status_code == 403
    assert client.get("/api/v1/admin/appointments").status_code == 200
    assert client.get("/api/v1/admin/users").status_code == 403
    assert (
        login(
            client, role="staff", email="staff-member@example.com", password="Temporary-pass-123!"
        ).status_code
        == 401
    )
    assert (
        login(
            client, role="staff", email="staff-member@example.com", password="Permanent-pass-456!"
        ).status_code
        == 200
    )

    assert login(client, email="admin@example.com").status_code == 200
    updated = client.patch(
        f"/api/v1/admin/users/{staff['id']}",
        json={
            "permissions": ["dashboard.view", "clients.view", "clients.manage"],
            "is_active": False,
        },
    )
    assert updated.status_code == 200 and updated.json()["is_active"] is False
    reset = client.post(
        f"/api/v1/admin/users/{staff['id']}/reset-password",
        json={"temporary_password": "Another-temp-789!"},
    )
    assert reset.status_code == 200 and reset.json()["must_change_password"] is True
    assert (
        login(
            client, role="staff", email="staff-member@example.com", password="Another-temp-789!"
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/v1/auth/login", json={"email": "admin@example.com", "password": PASSWORD}
        ).status_code
        == 200
    )
    assert (
        client.patch(f"/api/v1/admin/users/{staff['id']}", json={"is_active": True}).status_code
        == 200
    )
    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        events = db.scalars(select(AdminAuditEvent).order_by(AdminAuditEvent.created_at)).all()
    assert {event.action for event in events} >= {
        "USER_CREATED",
        "USER_PASSWORD_CHANGED",
        "USER_PERMISSIONS_UPDATED",
        "USER_DISABLED",
        "USER_PASSWORD_RESET",
        "USER_ENABLED",
    }
    assert all(event.actor_user_id and event.created_at for event in events)
    assert all(
        "password" not in str(event.event_metadata).lower()
        and "token" not in str(event.event_metadata).lower()
        for event in events
    )


def test_property_publish_permission_is_separate(anonymous_client, connection):
    add_user(connection, role="staff", permissions=["properties.view", "properties.manage"])
    assert login(anonymous_client, role="staff").status_code == 200
    draft = anonymous_client.post("/api/v1/properties", json=property_payload(status="draft"))
    assert draft.status_code == 201
    assert (
        anonymous_client.patch(
            f"/api/v1/properties/{draft.json()['id']}", json={"title": "Draft edit"}
        ).status_code
        == 200
    )
    assert (
        anonymous_client.patch(
            f"/api/v1/properties/{draft.json()['id']}", json={"status": "published"}
        ).status_code
        == 403
    )
    published = property_payload(slug="cannot-publish", status="published")
    assert anonymous_client.post("/api/v1/properties", json=published).status_code == 403
