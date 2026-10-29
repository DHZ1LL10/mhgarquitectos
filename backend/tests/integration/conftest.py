import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.schemas import CreateAdminInput
from app.auth.security import create_user
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
def anonymous_client(connection):
    def override_db():
        with Session(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        ) as session:
            yield session

    settings = get_settings().model_copy(update={"cookie_secure": False, "cookie_samesite": "lax"})
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_settings] = lambda: settings
    try:
        with TestClient(
            app,
            raise_server_exceptions=False,
            headers={"Origin": "http://localhost:3000", "X-MHG-Admin": "1"},
        ) as client:
            yield client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def client(anonymous_client, connection):
    with Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    ) as db:
        create_user(
            db,
            CreateAdminInput(
                email="admin@example.com",
                full_name="Test Admin",
                password="Test-only-password-123!",
            ),
        )
    response = anonymous_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "Test-only-password-123!"},
    )
    assert response.status_code == 200, response.text
    return anonymous_client
