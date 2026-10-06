from typing import Annotated

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db

Database = Annotated[Session, Depends(get_db)]


def admin_endpoints_enabled(settings: Annotated[Settings, Depends(get_settings)]) -> None:
    # Deliberately not authentication. Default-deny until actual auth is implemented.
    if not settings.enable_admin_endpoints:
        raise HTTPException(status_code=403, detail="Administrative endpoints disabled")
