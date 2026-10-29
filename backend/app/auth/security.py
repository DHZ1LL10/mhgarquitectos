import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from ipaddress import ip_address

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.auth.models import AdminSession, AdminUser, LoginLimit, PublicRateLimit
from app.auth.permissions import FULL_PERMISSIONS, normalize_permissions
from app.auth.schemas import CreateAdminInput
from app.config import Settings

# Argon2id, 64 MiB, 3 iterations, 4 lanes (library defaults, pinned explicitly).
hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
dummy_hash = hasher.hash(secrets.token_urlsafe(32))


def token_digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def client_ip(request: Request, settings: Settings) -> str:
    peer = request.client.host if request.client else "unknown"
    if not settings.trust_proxy:
        return peer
    try:
        peer_address = ip_address(peer)
    except ValueError:
        return peer
    if not any(peer_address in network for network in settings.trusted_proxy_networks):
        return peer

    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return peer
    try:
        chain = [ip_address(value.strip()) for value in forwarded.split(",")]
    except ValueError:
        return peer
    for candidate in reversed(chain):
        if not any(candidate in network for network in settings.trusted_proxy_networks):
            return str(candidate)
    return str(chain[0])


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


def consume_public_budget(
    db: Session, category: str, ip: str, maximum: int, window_seconds: int
) -> None:
    now = datetime.now(UTC)
    db.execute(delete(PublicRateLimit).where(PublicRateLimit.expires_at <= now))
    key = token_digest(f"{category}:{ip}")
    db.execute(
        insert(PublicRateLimit)
        .values(key=key, attempts=0, expires_at=now + timedelta(seconds=window_seconds))
        .on_conflict_do_nothing()
    )
    bucket = db.scalar(select(PublicRateLimit).where(PublicRateLimit.key == key).with_for_update())
    if bucket.attempts >= maximum:
        retry_after = max(1, int((bucket.expires_at - now).total_seconds()))
        db.commit()
        raise HTTPException(
            429,
            "Too many public submissions. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    bucket.attempts += 1
    db.commit()


def enforce_public_rate_limit(
    request: Request, db: Session, settings: Settings, category: str, maximum: int
) -> None:
    if settings.public_rate_limit_enabled:
        consume_public_budget(
            db,
            category,
            client_ip(request, settings),
            maximum,
            settings.public_rate_limit_window_seconds,
        )


def verify_password(encoded: str, password: str) -> bool:
    try:
        return hasher.verify(encoded, password)
    except (VerificationError, InvalidHashError):
        return False


def create_user(db: Session, payload: CreateAdminInput, *, commit: bool = True) -> AdminUser:
    if db.scalar(select(AdminUser.id).where(AdminUser.email == str(payload.email))) is not None:
        raise ValueError("Email already exists")
    if (
        payload.role == "owner"
        and db.scalar(select(AdminUser.id).where(AdminUser.role == "owner")) is not None
    ):
        raise ValueError("An owner already exists")
    user = AdminUser(
        email=str(payload.email),
        full_name=payload.full_name,
        role=payload.role,
        password_hash=hasher.hash(payload.password.get_secret_value()),
        is_active=True,
        permissions=(
            list(FULL_PERMISSIONS)
            if payload.role == "owner"
            else normalize_permissions(payload.permissions)
        ),
        must_change_password=payload.must_change_password,
    )
    db.add(user)
    if commit:
        db.commit()
        db.refresh(user)
    else:
        db.flush()
    return user


def revoke_session(db: Session, raw: str | None) -> None:
    if raw:
        db.execute(delete(AdminSession).where(AdminSession.token_hash == token_digest(raw)))


def revoke_user_sessions(db: Session, user_id, keep_token_hash: str | None = None) -> None:
    statement = delete(AdminSession).where(AdminSession.user_id == user_id)
    if keep_token_hash:
        statement = statement.where(AdminSession.token_hash != keep_token_hash)
    db.execute(statement)
