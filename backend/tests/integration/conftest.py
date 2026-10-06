import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import engine, get_db
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def migrated_database():
    settings = get_settings()
    if not settings.db_name.endswith("_test"):
        pytest.fail("Integration tests require an explicit disposable DB_NAME ending in _test")
    # Never silently replace PostgreSQL with SQLite or skip unavailable storage.
    command.upgrade(Config("alembic.ini"), "head")
    command.check(Config("alembic.ini"))
    yield
    engine.dispose()


@pytest.fixture
def connection(migrated_database):
    with engine.connect() as connection:
        transaction = connection.begin()
        yield connection
        transaction.rollback()


@pytest.fixture
def client(connection):
    def override_db():
        with Session(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        ) as session:
            yield session

    settings = get_settings().model_copy(update={"enable_admin_endpoints": True})
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_settings] = lambda: settings
    try:
        with TestClient(app, raise_server_exceptions=False) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
