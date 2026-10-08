import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import delete, select

from app.auth.models import AdminSession, AdminUser
from app.auth.schemas import LoginInput, UserOutput
from app.auth.security import (
    consume_login_budget,
    csrf_guard,
    dummy_hash,
    hasher,
    revoke_session,
    token_digest,
    verify_password,
)
from app.dependencies import AuthenticatedUser, Configuration, Database

router = APIRouter(prefix="/auth", tags=["Administrative authentication"])


@router.post("/login", response_model=UserOutput)
def login(
    payload: LoginInput, request: Request, response: Response, db: Database, settings: Configuration
):
    csrf_guard(request, settings)
    consume_login_budget(
        db, str(payload.email), request.client.host if request.client else "unknown"
    )
    user = db.scalar(
        select(AdminUser).where(AdminUser.email == str(payload.email)).with_for_update()
    )
    valid = verify_password(
        user.password_hash if user else dummy_hash, payload.password.get_secret_value()
    )
    if not valid or user is None or not user.is_active:
        raise HTTPException(401, "Invalid credentials")
    if hasher.check_needs_rehash(user.password_hash):
        user.password_hash = hasher.hash(payload.password.get_secret_value())
    now = datetime.now(UTC)
    raw = secrets.token_urlsafe(32)
    revoke_session(db, request.cookies.get(settings.cookie_name))
    db.execute(delete(AdminSession).where(AdminSession.expires_at <= now))
    db.add(
        AdminSession(
            token_hash=token_digest(raw),
            user_id=user.id,
            created_at=now,
            expires_at=now + timedelta(hours=settings.session_hours),
        )
    )
    user.last_login_at = now
    db.commit()
    response.set_cookie(
        settings.cookie_name,
        raw,
        max_age=settings.session_hours * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/api/v1",
    )
    return user


@router.get("/me", response_model=UserOutput)
def me(user: AuthenticatedUser):
    return user


@router.post("/logout", status_code=204)
def logout(request: Request, db: Database, settings: Configuration):
    csrf_guard(request, settings)
    revoke_session(db, request.cookies.get(settings.cookie_name))
    db.commit()
    response = Response(status_code=204)
    response.delete_cookie(
        settings.cookie_name,
        path="/api/v1",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return response
