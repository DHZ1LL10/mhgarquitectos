from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import Settings, get_settings

settings = get_settings()


def engine_options(configuration: Settings) -> dict:
    return {
        "pool_pre_ping": True,
        "pool_size": configuration.db_pool_size,
        "max_overflow": configuration.db_max_overflow,
        "pool_timeout": configuration.db_pool_timeout_seconds,
        "pool_recycle": configuration.db_pool_recycle_seconds,
        "connect_args": {"connect_timeout": 5, "options": "-c timezone=UTC"},
    }


engine = create_engine(settings.database_url, **engine_options(settings))
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session]:
    with SessionLocal() as session:
        yield session
