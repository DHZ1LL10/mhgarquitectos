from uuid import uuid4

import pytest
from sqlalchemy import event, func, select, text
from sqlalchemy.exc import IntegrityError

from app.appointments.models import Appointment
from app.config import get_settings
from app.kitchen_configurations.folios import KITCHEN_FOLIO_PREFIX, ServiceFolioCounter
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.submission_models import KitchenSubmission
from app.kitchen_configurations.submissions import notifier_dependency
from app.leads.models import Lead
from app.properties.models import Property
from app.scripts.seed_admin_demo import (
    seed_crm_scenarios,
    seed_properties,
    synthetic_published_properties,
)
from tests.payloads import appointment_payload, contact_payload, kitchen_payload, property_payload


def create(client, path, payload):
    response = client.post("/api/v1/" + path, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_health_real_postgres(client):
    assert client.get("/health").json() == {"status": "ok", "database": "ok"}


def test_public_rate_limit_is_shared_in_postgres(anonymous_client):
    from app.main import app

    settings = get_settings().model_copy(
        update={
            "public_rate_limit_leads": 1,
            "public_rate_limit_appointments": 1,
            "public_rate_limit_kitchen_configurations": 1,
            "public_rate_limit_kitchen_submissions": 1,
            "public_rate_limit_window_seconds": 60,
        }
    )
    app.dependency_overrides[get_settings] = lambda: settings
    try:
        requests = (
            ("/api/v1/leads", contact_payload(), {}),
            ("/api/v1/appointments", appointment_payload(), {}),
            ("/api/v1/kitchen-configurations", kitchen_payload(), {}),
            (
                "/api/v1/kitchen-submissions",
                {
                    "configuration": kitchen_payload(),
                    "appointment": appointment_payload(),
                    "contact": contact_payload(),
                },
                {"Idempotency-Key": str(uuid4())},
            ),
        )
        responses = []
        for path, payload, headers in requests:
            first = anonymous_client.post(path, json=payload, headers=headers)
            limited = anonymous_client.post(path, json=payload, headers=headers)
            responses.append((first, limited))
    finally:
        app.dependency_overrides.pop(get_settings, None)
    for first, limited in responses:
        assert first.status_code == 201, first.text
        assert limited.status_code == 429
        assert int(limited.headers["retry-after"]) >= 1


def test_properties_crud_public_filter_slug_and_images(client):
    items = [
        create(client, "properties", property_payload(slug=f"casa-{status}", status=status))
        for status in ("draft", "published", "archived")
    ]
    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    assert [item["status"] for item in response.json()] == ["published"]
    for item in items:
        response = client.get("/api/v1/properties/" + item["slug"])
        assert response.status_code == (200 if item["status"] == "published" else 404)
    duplicate = client.post("/api/v1/properties", json=property_payload(slug="casa-draft"))
    assert duplicate.status_code == 409
    response = client.patch(
        "/api/v1/properties/" + items[0]["id"], json={"status": "published", "images": []}
    )
    assert response.status_code == 200, response.text
    assert response.json()["images"] == []
    assert len(client.get("/api/v1/properties").json()) == 2
    assert (
        client.patch("/api/v1/properties/" + items[0]["id"], json={"title": None}).status_code
        == 422
    )
    assert (
        client.patch("/api/v1/properties/" + items[0]["id"], json={"price": "-1"}).status_code
        == 422
    )
    response = client.patch(
        "/api/v1/properties/" + items[0]["id"], json={"images": property_payload()["images"]}
    )
    assert response.status_code == 200
    assert len(response.json()["images"]) == 1
    assert (
        client.patch(
            "/api/v1/properties/" + items[0]["id"], json={"slug": "casa-published"}
        ).status_code
        == 409
    )
    assert client.get(f"/api/v1/admin/properties/{items[0]['id']}").status_code == 200
    assert client.get(f"/api/v1/admin/properties/{uuid4()}").status_code == 404


def test_local_crm_seed_is_idempotent_and_keeps_synthetic_properties_private(connection):
    from sqlalchemy.orm import Session

    with Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    ) as db:
        assert seed_properties(db) == 3
        assert seed_crm_scenarios(db) == 3
        db.commit()
        assert seed_properties(db) == 0
        assert seed_crm_scenarios(db) == 0
        db.commit()
        assert db.scalar(select(func.count()).select_from(Lead)) == 3
        assert db.scalar(select(func.count()).select_from(Appointment)) == 3
        assert db.scalar(select(func.count()).select_from(KitchenConfiguration)) == 3
        assert db.scalar(select(func.count()).select_from(KitchenSubmission)) == 3
        aurora = db.scalar(select(Lead).where(Lead.name == "Aurora Campos"))
        assert aurora.email == "aurora.campos@example.com"
        assert aurora.phone == "0000000001"
        assert aurora.message == (
            "Quiero renovar mi cocina y revisar opciones de distribución y acabados."
        )
        appointment = db.get(Appointment, aurora.appointment_id)
        assert appointment.address == "Colonia Centro, Fortín, Veracruz"
        assert appointment.notes == (
            "Confirmar disponibilidad para la visita y revisar medidas del espacio."
        )
        published = db.scalars(select(Property.slug).where(Property.status == "published")).all()
        assert published == ["residencia-mata-larga-fortin"]

        historical = db.scalar(select(Property).where(Property.slug == "casa-bosque-local"))
        historical.status = "published"
        db.flush()
        warnings = synthetic_published_properties(db)
        assert [item.slug for item in warnings] == ["casa-bosque-local"]
        assert historical.status == "published"  # Warning only: the seed never changes prior data.


def test_pagination_and_validation(client):
    for n in range(3):
        create(client, "properties", property_payload(slug=f"casa-{n}", status="published"))
    pages = [client.get(f"/api/v1/properties?limit=1&offset={n}").json()[0]["id"] for n in range(3)]
    assert len(set(pages)) == 3
    assert client.get("/api/v1/properties?limit=101").status_code == 422
    assert client.get("/api/v1/properties?offset=-1").status_code == 422
    assert (
        client.post(
            "/api/v1/properties", json=property_payload(latitude=100, longitude=0)
        ).status_code
        == 422
    )


def test_kitchen_persistence(client, connection):
    item = create(client, "kitchen-configurations", kitchen_payload())
    response = client.get("/api/v1/kitchen-configurations/" + item["id"])
    assert response.status_code == 200
    assert response.json()["selections"] == kitchen_payload()["selections"]
    assert response.json()["countertop"]["label"] == "Superficie sólida Corian"
    assert (
        connection.scalar(
            select(KitchenConfiguration.latitude).where(KitchenConfiguration.id == item["id"])
        )
        == 19.043
    )
    assert item["created_at"] and item["updated_at"]
    assert (
        client.post(
            "/api/v1/kitchen-configurations", json=kitchen_payload(selection_version=0)
        ).status_code
        == 422
    )


def test_appointment_lifecycle_and_invalid_states(client):
    item = create(client, "appointments", appointment_payload())
    path = "/api/v1/appointments/" + item["id"]
    assert item["status"] == "requested"
    assert client.patch(path, json={"status": "bogus"}).status_code == 422
    assert (
        client.patch(
            path, json={"status": "completed", "confirmed_datetime": "2030-10-12T16:00:00Z"}
        ).status_code
        == 409
    )
    assert client.patch(path, json={"status": "confirmed"}).status_code == 422
    assert client.patch(path, json={"status": "pending_confirmation"}).status_code == 200
    response = client.patch(
        path, json={"status": "confirmed", "confirmed_datetime": "2030-10-12T16:00:00Z"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["updated_at"] >= item["updated_at"]
    assert client.patch(path, json={"status": "completed"}).status_code == 200
    assert client.patch(path, json={"status": "requested"}).status_code == 409
    assert client.patch(path, json={"branch": None}).status_code == 422


def test_lead_relations_and_invalid_references(client, connection):
    prop = create(client, "properties", property_payload(status="published"))
    kitchen = create(client, "kitchen-configurations", kitchen_payload())
    appointment = create(client, "appointments", appointment_payload())
    item = create(
        client,
        "leads",
        contact_payload(
            property_id=prop["id"],
            kitchen_configuration_id=kitchen["id"],
            appointment_id=appointment["id"],
        ),
    )
    assert item["status"] == "new"
    assert item["property_id"] == prop["id"]
    assert item["kitchen_configuration_id"] == kitchen["id"]
    assert item["appointment_id"] == appointment["id"]
    assert connection.scalar(select(func.count()).select_from(Lead)) == 1
    assert (
        client.post("/api/v1/leads", json=contact_payload(property_id=str(uuid4()))).status_code
        == 422
    )
    assert (
        client.post("/api/v1/leads", json=contact_payload(appointment_id=str(uuid4()))).status_code
        == 422
    )
    assert client.post("/api/v1/leads", json=contact_payload(email="bad")).status_code == 422
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(
            text("DELETE FROM appointments WHERE id = :id"), {"id": appointment["id"]}
        )


def test_lead_draft_property_not_allowed(client):
    prop = create(client, "properties", property_payload())
    assert (
        client.post("/api/v1/leads", json=contact_payload(property_id=prop["id"])).status_code
        == 422
    )


def test_atomic_submission_success(client, connection):
    key = str(uuid4())
    payload = {
        "configuration": kitchen_payload(),
        "appointment": appointment_payload(),
        "contact": contact_payload(),
    }
    response = client.post(
        "/api/v1/kitchen-submissions", json=payload, headers={"Idempotency-Key": key}
    )
    assert response.status_code == 201, response.text
    result = response.json()
    assert result["status"] == "received"
    assert result["replayed"] is False
    assert result["folio"] == "COC-00001"
    assert result["configuration_id"] and result["appointment_id"] and result["lead_id"]
    for model in (KitchenConfiguration, Appointment, Lead, KitchenSubmission):
        assert connection.scalar(select(func.count()).select_from(model)) == 1
    assert connection.scalar(select(KitchenSubmission.notification_status)) == "not_configured"

    duplicate = client.post(
        "/api/v1/kitchen-submissions", json=payload, headers={"Idempotency-Key": key}
    )
    assert duplicate.status_code == 200
    assert duplicate.json() == {**result, "replayed": True}
    for model in (KitchenConfiguration, Appointment, Lead, KitchenSubmission):
        assert connection.scalar(select(func.count()).select_from(model)) == 1

    changed = {**payload, "contact": contact_payload(name="Otra persona")}
    assert (
        client.post(
            "/api/v1/kitchen-submissions", json=changed, headers={"Idempotency-Key": key}
        ).status_code
        == 409
    )
    assert client.post("/api/v1/kitchen-submissions", json=payload).status_code == 422
    assert (
        client.post(
            "/api/v1/kitchen-submissions",
            json=payload,
            headers={"Idempotency-Key": "not-a-uuid"},
        ).status_code
        == 422
    )


def test_atomic_submission_rollback(client, connection):
    def fail_final_write(mapper, connection, target):
        raise RuntimeError("Intentional last-write failure")

    event.listen(KitchenSubmission, "before_insert", fail_final_write)
    try:
        response = client.post(
            "/api/v1/kitchen-submissions",
            headers={"Idempotency-Key": str(uuid4())},
            json={
                "configuration": kitchen_payload(),
                "appointment": appointment_payload(),
                "contact": contact_payload(),
            },
        )
        assert response.status_code == 500
        assert "Intentional" not in response.text
    finally:
        event.remove(KitchenSubmission, "before_insert", fail_final_write)
    for model in (KitchenConfiguration, Appointment, Lead, KitchenSubmission):
        assert connection.scalar(select(func.count()).select_from(model)) == 0
    assert (
        connection.scalar(
            select(ServiceFolioCounter.last_value).where(
                ServiceFolioCounter.service_prefix == KITCHEN_FOLIO_PREFIX
            )
        )
        == 0
    )


def test_smtp_failure_preserves_submission_and_admin_relations(client, connection):
    class FailingNotifier:
        configured = True

        def send_kitchen_submission(self, data):
            assert data.name == "Persona de prueba"
            raise TimeoutError("test-only SMTP failure")

    from app.main import app

    app.dependency_overrides[notifier_dependency] = lambda: FailingNotifier()
    try:
        response = client.post(
            "/api/v1/kitchen-submissions",
            headers={"Idempotency-Key": str(uuid4())},
            json={
                "configuration": kitchen_payload(),
                "appointment": appointment_payload(),
                "contact": contact_payload(),
            },
        )
    finally:
        app.dependency_overrides.pop(notifier_dependency, None)
    assert response.status_code == 201, response.text
    receipt = response.json()
    stored = connection.execute(
        select(
            KitchenSubmission.notification_status,
            KitchenSubmission.notification_error,
            KitchenSubmission.notification_attempts,
        ).where(KitchenSubmission.id == receipt["submission_id"])
    ).one()
    assert stored.notification_status == "failed"
    assert stored.notification_error == "TimeoutError"
    assert stored.notification_attempts == 1
    for path in ("leads", "appointments", "kitchen-configurations"):
        items = client.get("/api/v1/admin/" + path).json()
        assert items[0]["submission"]["folio"] == receipt["folio"]
        assert items[0]["submission"]["configuration_id"] == receipt["configuration_id"]


def test_successful_notification_is_recorded_after_persistence(client, connection):
    delivered = []

    class RecordingNotifier:
        configured = True

        def send_kitchen_submission(self, data):
            delivered.append(data)

    from app.main import app

    app.dependency_overrides[notifier_dependency] = lambda: RecordingNotifier()
    try:
        response = client.post(
            "/api/v1/kitchen-submissions",
            headers={"Idempotency-Key": str(uuid4())},
            json={
                "configuration": kitchen_payload(),
                "appointment": appointment_payload(),
                "contact": contact_payload(),
            },
        )
    finally:
        app.dependency_overrides.pop(notifier_dependency, None)

    assert response.status_code == 201, response.text
    receipt = response.json()
    stored = connection.execute(
        select(
            KitchenSubmission.notification_status,
            KitchenSubmission.notification_attempts,
            KitchenSubmission.notification_error,
            KitchenSubmission.notified_at,
        ).where(KitchenSubmission.id == receipt["submission_id"])
    ).one()
    assert len(delivered) == 1
    assert delivered[0].folio == receipt["folio"]
    assert stored.notification_status == "sent"
    assert stored.notification_attempts == 1
    assert stored.notification_error is None
    assert stored.notified_at is not None


def test_database_constraints_and_timestamp_trigger(client, connection):
    item = create(client, "properties", property_payload())
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(
            text("UPDATE properties SET price = -1 WHERE id = :id"), {"id": item["id"]}
        )
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(
            text("UPDATE properties SET latitude = 10 WHERE id = :id"), {"id": item["id"]}
        )
    original = connection.scalar(select(Property.updated_at).where(Property.id == item["id"]))
    connection.execute(
        text("UPDATE properties SET title = 'Changed through SQL' WHERE id = :id"),
        {"id": item["id"]},
    )
    assert (
        connection.scalar(select(Property.updated_at).where(Property.id == item["id"])) > original
    )
