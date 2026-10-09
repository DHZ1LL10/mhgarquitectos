from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
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
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_user: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True
    notification_email: str | None = None

    @field_validator(
        "smtp_host", "smtp_user", "smtp_password", "smtp_from", "notification_email", mode="before"
    )
    @classmethod
    def blank_optional_values(cls, value):
        return None if value == "" else value

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
        if (self.smtp_user is None) != (self.smtp_password is None):
            raise ValueError("SMTP_USER and SMTP_PASSWORD must be configured together")
        for address in (self.smtp_from, self.notification_email):
            if address is not None and ("@" not in address or "\n" in address or "\r" in address):
                raise ValueError("SMTP_FROM and NOTIFICATION_EMAIL must be plain email addresses")
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
