import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.auth.models import AdminSession, AdminUser, LoginLimit
from app.auth.schemas import CreateAdminInput
from app.config import Settings

# Argon2id, 64 MiB, 3 iterations, 4 lanes (library defaults, pinned explicitly).
hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
dummy_hash = hasher.hash(secrets.token_urlsafe(32))


def token_digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def csrf_guard(request: Request, settings: Settings) -> None:
    if (
        request.headers.get("origin") not in settings.cors_origins
        or request.headers.get("x-mhg-admin") != "1"
    ):
        raise HTTPException(403, "Untrusted request origin or missing CSRF header")


def consume_login_budget(db: Session, email: str, ip: str) -> None:
    now = datetime.now(UTC)
    db.execute(delete(LoginLimit).where(LoginLimit.expires_at <= now))
    # Stored in PostgreSQL: applies across workers and survives process restarts.
    for subject, maximum in (("email:" + email, 5), ("ip:" + ip, 30)):
        key = token_digest(subject)
        db.execute(
            insert(LoginLimit)
            .values(key=key, attempts=0, expires_at=now + timedelta(minutes=15))
            .on_conflict_do_nothing()
        )
        bucket = db.scalar(select(LoginLimit).where(LoginLimit.key == key).with_for_update())
        if bucket.attempts >= maximum:
            db.commit()
            raise HTTPException(
                429, "Too many login attempts. Try again later.", headers={"Retry-After": "900"}
            )
        bucket.attempts += 1
    db.commit()


def verify_password(encoded: str, password: str) -> bool:
    try:
        return hasher.verify(encoded, password)
    except (VerificationError, InvalidHashError):
        return False


def create_user(db: Session, payload: CreateAdminInput) -> AdminUser:
    if db.scalar(select(AdminUser.id).where(AdminUser.email == str(payload.email))) is not None:
        raise ValueError("Email already exists")
    user = AdminUser(
        email=str(payload.email),
        full_name=payload.full_name,
        role=payload.role,
        password_hash=hasher.hash(payload.password.get_secret_value()),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def revoke_session(db: Session, raw: str | None) -> None:
    if raw:
        db.execute(delete(AdminSession).where(AdminSession.token_hash == token_digest(raw)))
