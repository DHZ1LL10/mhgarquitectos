import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.auth.models import AdminAuditEvent, AdminUser

FORBIDDEN_METADATA_KEYS = frozenset({"password", "temporary_password", "token", "cookie", "secret"})


def _contains_sensitive_key(value: object) -> bool:
    if isinstance(value, dict):
        return any(
            str(key).lower() in FORBIDDEN_METADATA_KEYS or _contains_sensitive_key(item)
            for key, item in value.items()
        )
    if isinstance(value, list):
        return any(_contains_sensitive_key(item) for item in value)
    return False


def record_audit(
    db: Session,
    actor: AdminUser,
    action: str,
    entity_type: str,
    entity_id: UUID | None = None,
    metadata: dict | None = None,
) -> AdminAuditEvent:
    safe = metadata or {}
    if _contains_sensitive_key(safe):
        raise ValueError("Sensitive audit metadata is forbidden")
    if len(json.dumps(safe, allow_nan=False).encode("utf-8")) > 4096:
        raise ValueError("Audit metadata exceeds 4 KiB")
    event = AdminAuditEvent(
        actor_user_id=actor.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        event_metadata=safe,
        created_at=datetime.now(UTC),
    )
    db.add(event)
    return event
