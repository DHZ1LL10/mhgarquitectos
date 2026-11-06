from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth.audit import record_audit
from app.auth.models import AdminAuditEvent, AdminUser
from app.auth.schemas import (
    AuditEventOutput,
    CreateAdminInput,
    PasswordResetInput,
    StaffCreateInput,
    StaffUpdateInput,
    UserOutput,
)
from app.auth.security import create_user, hasher, revoke_user_sessions
from app.dependencies import AuthenticatedUser, Database, require_owner

router = APIRouter(
    prefix="/admin/users",
    tags=["Administrative users"],
    dependencies=[Depends(require_owner)],
)


def staff_or_404(db: Database, user_id: UUID) -> AdminUser:
    user = db.scalar(select(AdminUser).where(AdminUser.id == user_id).with_for_update())
    if user is None:
        raise HTTPException(404, "User not found")
    if user.role == "owner":
        raise HTTPException(409, "Owner cannot be modified through user management")
    return user


@router.get("", response_model=list[UserOutput])
def list_users(db: Database):
    return db.scalars(select(AdminUser).order_by(AdminUser.created_at, AdminUser.id)).all()


@router.post("", response_model=UserOutput, status_code=201)
def create_staff(payload: StaffCreateInput, db: Database, actor: AuthenticatedUser):
    try:
        user = create_user(
            db,
            CreateAdminInput(
                email=payload.email,
                full_name=payload.full_name,
                password=payload.temporary_password,
                role="staff",
                permissions=payload.permissions,
                must_change_password=True,
            ),
            commit=False,
        )
        record_audit(
            db,
            actor,
            "USER_CREATED",
            "admin_user",
            user.id,
            {"role": "staff", "permissions": user.permissions},
        )
        db.commit()
        db.refresh(user)
        return user
    except (ValueError, IntegrityError) as exc:
        db.rollback()
        raise HTTPException(409, "Email already exists") from exc


@router.patch("/{user_id}", response_model=UserOutput)
def update_staff(
    user_id: UUID,
    payload: StaffUpdateInput,
    db: Database,
    actor: AuthenticatedUser,
):
    user = staff_or_404(db, user_id)
    changes = payload.model_dump(exclude_unset=True)
    if any(value is None for value in changes.values()):
        raise HTTPException(422, "Updated fields cannot be null")
    previous_permissions = list(user.permissions)
    previous_active = user.is_active
    for field, value in changes.items():
        setattr(user, field, str(value) if field == "email" else value)
    if "permissions" in changes and user.permissions != previous_permissions:
        record_audit(
            db,
            actor,
            "USER_PERMISSIONS_UPDATED",
            "admin_user",
            user.id,
            {"permissions": user.permissions},
        )
    if "is_active" in changes and user.is_active != previous_active:
        revoke_user_sessions(db, user.id)
        record_audit(
            db,
            actor,
            "USER_ENABLED" if user.is_active else "USER_DISABLED",
            "admin_user",
            user.id,
        )
    other_changes = set(changes) - {"permissions", "is_active"}
    if other_changes:
        record_audit(
            db,
            actor,
            "USER_UPDATED",
            "admin_user",
            user.id,
            {"fields": sorted(other_changes)},
        )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Email already exists") from exc
    db.refresh(user)
    return user


@router.post("/{user_id}/reset-password", response_model=UserOutput)
def reset_staff_password(
    user_id: UUID,
    payload: PasswordResetInput,
    db: Database,
    actor: AuthenticatedUser,
):
    user = staff_or_404(db, user_id)
    user.password_hash = hasher.hash(payload.temporary_password.get_secret_value())
    user.must_change_password = True
    revoke_user_sessions(db, user.id)
    record_audit(db, actor, "USER_PASSWORD_RESET", "admin_user", user.id)
    db.commit()
    db.refresh(user)
    return user


@router.get("/audit/recent", response_model=list[AuditEventOutput])
def recent_audit(db: Database, limit: int = Query(50, ge=1, le=100)):
    return db.scalars(
        select(AdminAuditEvent).order_by(AdminAuditEvent.created_at.desc()).limit(limit)
    ).all()


@router.get("/{user_id}", response_model=UserOutput)
def get_user(user_id: UUID, db: Database):
    user = db.get(AdminUser, user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    return user
