from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "mhg"
    db_user: str = "mhg"
    db_password: str
    enable_admin_endpoints: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    @property
    def database_url(self) -> URL:
        return URL.create("postgresql+psycopg", username=self.db_user,
                          password=self.db_password, host=self.db_host,
                          port=self.db_port, database=self.db_name)


@lru_cache
def get_settings() -> Settings:
    return Settings()

