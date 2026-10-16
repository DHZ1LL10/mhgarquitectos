from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db import SessionLocal, engine
from app.kitchen_configurations.folios import (
    KITCHEN_FOLIO_PREFIX,
    ServiceFolioCounter,
    format_service_folio,
    next_service_folio,
)


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
