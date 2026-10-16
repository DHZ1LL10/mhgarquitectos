from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from sqlalchemy import delete, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import SessionLocal, engine
from app.kitchen_configurations.folios import (
    KITCHEN_FOLIO_PREFIX,
    ServiceFolioCounter,
    format_service_folio,
    next_service_folio,
)
from tests.payloads import appointment_payload, contact_payload, kitchen_payload


def test_kitchen_folio_starts_at_one_increments_and_pads(connection):
    with Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    ) as db:
        assert next_service_folio(db, KITCHEN_FOLIO_PREFIX) == "COC-00001"
        assert next_service_folio(db, KITCHEN_FOLIO_PREFIX) == "COC-00002"
        assert format_service_folio(KITCHEN_FOLIO_PREFIX, 12_345) == "COC-12345"
        assert format_service_folio(KITCHEN_FOLIO_PREFIX, 123_456) == "COC-123456"


def test_folio_allocation_rolls_back_with_its_transaction(connection):
    with Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    ) as db:
        transaction = db.begin_nested()
        assert next_service_folio(db, "RLB") == "RLB-00001"
        transaction.rollback()
        assert next_service_folio(db, "RLB") == "RLB-00001"


def test_submission_folio_unique_constraint_and_legacy_coexistence(client, connection):
    payload = {
        "configuration": kitchen_payload(),
        "appointment": appointment_payload(),
        "contact": contact_payload(),
    }

    def submit():
        response = client.post(
            "/api/v1/kitchen-submissions",
            json=payload,
            headers={"Idempotency-Key": str(uuid4())},
        )
        assert response.status_code == 201, response.text
        return response.json()

    first = submit()
    second = submit()
    assert [first["folio"], second["folio"]] == ["COC-00001", "COC-00002"]
    with pytest.raises(IntegrityError), connection.begin_nested():
        connection.execute(
            text("UPDATE kitchen_submissions SET folio = :folio WHERE id = :id"),
            {"folio": first["folio"], "id": second["submission_id"]},
        )

    legacy_folio = "MHG-" + uuid4().hex.upper()
    connection.execute(
        text("UPDATE kitchen_submissions SET folio = :folio WHERE id = :id"),
        {"folio": legacy_folio, "id": first["submission_id"]},
    )
    third = submit()
    assert third["folio"] == "COC-00003"
    stored = set(connection.execute(text("SELECT folio FROM kitchen_submissions")).scalars())
    assert legacy_folio in stored
    assert {second["folio"], third["folio"]}.issubset(stored)


def test_folio_allocation_is_unique_under_real_postgres_concurrency(migrated_database):
    prefix = "PAR"
    with engine.begin() as connection:
        connection.execute(
            delete(ServiceFolioCounter).where(ServiceFolioCounter.service_prefix == prefix)
        )

    def allocate() -> str:
        with SessionLocal() as db:
            folio = next_service_folio(db, prefix)
            db.commit()
            return folio

    try:
        with ThreadPoolExecutor(max_workers=8) as executor:
            folios = list(executor.map(lambda _: allocate(), range(24)))
        assert len(set(folios)) == 24
        assert sorted(int(folio.split("-")[1]) for folio in folios) == list(range(1, 25))
    finally:
        with engine.begin() as connection:
            connection.execute(
                delete(ServiceFolioCounter).where(ServiceFolioCounter.service_prefix == prefix)
            )
