from functools import lru_cache
from ipaddress import IPv4Network, IPv6Network, ip_network
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL, make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)
    environment: Literal["local", "test", "staging", "production"] = "local"
    database_url_value: SecretStr | None = Field(
        default=None, validation_alias="DATABASE_URL", repr=False
    )
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "mhg"
    db_user: str = "mhg"
    db_password: str | None = None
    db_sslmode: Literal["disable", "allow", "prefer", "require", "verify-ca", "verify-full"] = (
        "prefer"
    )
    db_pool_size: int = Field(default=5, ge=1, le=20)
    db_max_overflow: int = Field(default=5, ge=0, le=20)
    db_pool_timeout_seconds: int = Field(default=10, ge=1, le=60)
    db_pool_recycle_seconds: int = Field(default=1800, ge=60, le=86400)
    session_hours: int = Field(default=8, ge=1, le=24)
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict"] = "lax"
    cookie_name: str = "mhg_session"
    cors_origins: list[str] = ["http://localhost:3000"]
    trust_proxy: bool = False
    trusted_proxy_cidrs: list[str] = []
    max_request_body_bytes: int = Field(default=1_048_576, ge=1024, le=10_485_760)
    public_rate_limit_enabled: bool = True
    public_rate_limit_window_seconds: int = Field(default=900, ge=1, le=86400)
    public_rate_limit_kitchen_submissions: int = Field(default=10, ge=1, le=10000)
    public_rate_limit_leads: int = Field(default=20, ge=1, le=10000)
    public_rate_limit_appointments: int = Field(default=10, ge=1, le=10000)
    public_rate_limit_kitchen_configurations: int = Field(default=10, ge=1, le=10000)
    openapi_enabled: bool = True
    log_level: str = "INFO"
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_user: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True
    notification_email: str | None = None
    staging_email_override: str | None = None

    @field_validator(
        "smtp_host",
        "smtp_user",
        "smtp_password",
        "smtp_from",
        "notification_email",
        "staging_email_override",
        mode="before",
    )
    @classmethod
    def blank_optional_values(cls, value):
        return None if value == "" else value

    @field_validator("database_url_value", mode="before")
    @classmethod
    def blank_database_url(cls, value):
        return None if value == "" else value

    @model_validator(mode="after")
    def secure_configuration(self):
        if self.database_url_value is None and not self.db_password:
            raise ValueError("DB_PASSWORD is required when DATABASE_URL is not configured")
        if self.environment in ("staging", "production") and not self.cookie_secure:
            raise ValueError("Staging and production require COOKIE_SECURE=true")
        expected_cookie_names = {
            "staging": "mhg_staging_session",
            "production": "mhg_production_session",
        }
        expected_cookie_name = expected_cookie_names.get(self.environment)
        if expected_cookie_name and self.cookie_name != expected_cookie_name:
            raise ValueError(f"{self.environment} requires COOKIE_NAME={expected_cookie_name}")
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
            if self.environment in ("staging", "production") and url.scheme != "https":
                raise ValueError("Staging and production CORS origins must use HTTPS")
        if (self.smtp_user is None) != (self.smtp_password is None):
            raise ValueError("SMTP_USER and SMTP_PASSWORD must be configured together")
        for address in (self.smtp_from, self.notification_email, self.staging_email_override):
            if address is not None and ("@" not in address or "\n" in address or "\r" in address):
                raise ValueError("Email settings must be plain email addresses")
        if self.environment == "staging" and self.smtp_host and not self.staging_email_override:
            raise ValueError("Staging SMTP requires STAGING_EMAIL_OVERRIDE")
        if self.environment != "staging" and self.staging_email_override:
            raise ValueError("STAGING_EMAIL_OVERRIDE is only valid in staging")
        networks = []
        for cidr in self.trusted_proxy_cidrs:
            try:
                networks.append(ip_network(cidr, strict=False))
            except ValueError as exc:
                raise ValueError("TRUSTED_PROXY_CIDRS must contain valid IP networks") from exc
        if self.trust_proxy and not networks:
            raise ValueError("TRUST_PROXY=true requires TRUSTED_PROXY_CIDRS")
        return self

    @property
    def database_url(self) -> URL:
        if self.database_url_value:
            url = make_url(self.database_url_value.get_secret_value())
            if url.get_backend_name() not in ("postgresql", "postgres"):
                raise ValueError("DATABASE_URL must use PostgreSQL")
            url = url.set(drivername="postgresql+psycopg")
        else:
            url = URL.create(
                "postgresql+psycopg",
                username=self.db_user,
                password=self.db_password,
                host=self.db_host,
                port=self.db_port,
                database=self.db_name,
            )
        return url.update_query_dict({"sslmode": self.db_sslmode})

    @property
    def trusted_proxy_networks(self) -> tuple[IPv4Network | IPv6Network, ...]:
        return tuple(ip_network(value, strict=False) for value in self.trusted_proxy_cidrs)

    @property
    def notification_recipient(self) -> str | None:
        return (
            self.staging_email_override
            if self.environment == "staging"
            else self.notification_email
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
