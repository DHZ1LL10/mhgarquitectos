from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "mhg"
    db_user: str = "mhg"
    db_password: str
    session_hours: int = Field(default=8, ge=1, le=24)
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_name: str = "mhg_session"
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    @model_validator(mode="after")
    def secure_configuration(self):
        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("SameSite=None requires COOKIE_SECURE=true")
        for origin in self.cors_origins:
            url = urlsplit(origin)
            if (
                url.scheme not in ("https", "http")
                or not url.netloc
                or url.path
                or url.query
                or url.fragment
                or url.username
                or "*" in origin
            ):
                raise ValueError("CORS origins must be explicit HTTP(S) origins without paths")
        return self

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+psycopg",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
