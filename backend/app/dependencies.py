from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.models import AdminSession, AdminUser
from app.auth.security import csrf_guard, token_digest
from app.config import Settings, get_settings
from app.db import get_db

Database = Annotated[Session, Depends(get_db)]
Configuration = Annotated[Settings, Depends(get_settings)]


def current_user(request: Request, db: Database, settings: Configuration) -> AdminUser:
    raw = request.cookies.get(settings.cookie_name)
    session = db.get(AdminSession, token_digest(raw)) if raw and len(raw) <= 128 else None
    if session is None or session.expires_at <= datetime.now(UTC):
        raise HTTPException(401, "Authentication required")
    user = db.get(AdminUser, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(401, "Authentication required")
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        csrf_guard(request, settings)
    return user


AuthenticatedUser = Annotated[AdminUser, Depends(current_user)]


def require_admin(user: AuthenticatedUser) -> AdminUser:
    if user.role != "admin":
        raise HTTPException(403, "Administrator permission required")
    return user
