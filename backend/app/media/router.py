import logging
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select

from app.auth.audit import record_audit
from app.auth.permissions import has_permission
from app.auth.security import consume_public_budget
from app.dependencies import AuthenticatedUser, Configuration, Database
from app.media.models import MediaCleanup
from app.media.provider import CloudinaryProvider, MediaProvider, media_folder
from app.media.validation import validate_image
from app.projects.models import Project, ProjectImage
from app.properties.models import Property, PropertyImage, PropertyStatus

router = APIRouter(prefix="/admin/media", tags=["Media"])


def audit_media(db, actor, kind, item, operation):
    resource = "project" if kind == "projects" else "property"
    item.updated_at = datetime.now(UTC)
    record_audit(db, actor, f"{resource}.{operation}", resource, item.id)


def provider(settings: Configuration):
    if not all(
        (
            settings.cloudinary_cloud_name,
            settings.cloudinary_api_key,
            settings.cloudinary_api_secret,
        )
    ):
        raise HTTPException(503, "El almacenamiento de fotografías no está configurado.")
    return CloudinaryProvider(
        settings.cloudinary_cloud_name,
        settings.cloudinary_api_key.get_secret_value(),
        settings.cloudinary_api_secret.get_secret_value(),
    )


def entity(db, actor, kind, id):
    if kind not in {"projects", "properties"}:
        raise HTTPException(404, "Contenido no encontrado.")
    permission = "projects.manage" if kind == "projects" else "properties.manage"
    if not has_permission(actor.role, actor.permissions, permission):
        raise HTTPException(403, "No tienes permiso para administrar estas fotografías.")
    model = Project if kind == "projects" else Property
    item = db.scalar(select(model).where(model.id == id).with_for_update())
    if item is None:
        raise HTTPException(404, "Contenido no encontrado.")
    if (
        kind == "properties"
        and item.status == PropertyStatus.published
        and not has_permission(actor.role, actor.permissions, "properties.publish")
    ):
        raise HTTPException(403, "Se requiere permiso para publicar.")
    return item


def authorize_upload(kind: str, id: UUID, db: Database, actor: AuthenticatedUser):
    # Resolve authorization before the storage dependency, even when cloud is disabled.
    entity(db, actor, kind, id)


@router.post("/{kind}/{id}/upload", dependencies=[Depends(authorize_upload)])
def upload(
    kind: str,
    id: UUID,
    file: UploadFile,
    db: Database,
    actor: AuthenticatedUser,
    settings: Configuration,
    storage: Annotated[MediaProvider, Depends(provider)],
):
    item = entity(db, actor, kind, id)
    consume_public_budget(
        db,
        "admin-media",
        str(actor.id),
        settings.media_upload_limit,
        settings.media_upload_window_seconds,
    )
    content = file.file.read(settings.media_max_file_bytes + 1)
    validate_image(content, file.content_type, settings.media_max_file_bytes)
    item = entity(db, actor, kind, id)
    model = ProjectImage if kind == "projects" else PropertyImage
    fk = model.project_id if kind == "projects" else model.property_id
    existing = list(db.scalars(select(model).where(fk == id)))
    if len(existing) >= (200 if kind == "projects" else 50):
        raise HTTPException(409, "La galería alcanzó su límite de fotografías.")
    stored = storage.upload(content, media_folder(settings.cloudinary_folder, kind, item.slug))
    try:
        if kind == "projects":
            image = ProjectImage(
                project_id=id,
                provider="cloudinary",
                **stored.__dict__,
                alt_text=item.name,
                is_cover=not existing,
                sort_order=max((x.sort_order for x in existing), default=-1) + 1,
            )
        else:
            image = PropertyImage(
                property_id=id,
                provider="cloudinary",
                public_id=stored.public_id,
                url=stored.secure_url,
                width=stored.width,
                height=stored.height,
                format=stored.format,
                bytes=stored.bytes,
                alt=item.title,
                position=max((x.position for x in existing), default=-1) + 1,
            )
        db.add(image)
        db.flush()
        audit_media(db, actor, kind, item, "image_uploaded")
        db.commit()
    except Exception:
        db.rollback()
        try:
            storage.destroy(stored.public_id)
        except Exception:  # noqa: BLE001 - preserve original failure, never log provider secrets
            # Never log provider exceptions: they can include credentials/request URLs.
            logging.getLogger(__name__).error(
                "media rollback cleanup failed; review provider assets"
            )
            db.add(MediaCleanup(public_id=stored.public_id))
            db.commit()
        raise
    return {"id": str(image.id)}


@router.post("/{kind}/{id}/images/{image_id}/cover")
def cover(kind: str, id: UUID, image_id: UUID, db: Database, actor: AuthenticatedUser):
    item = entity(db, actor, kind, id)
    model = ProjectImage if kind == "projects" else PropertyImage
    fk = model.project_id if kind == "projects" else model.property_id
    images = list(db.scalars(select(model).where(fk == id)))
    selected = next((x for x in images if x.id == image_id), None)
    if selected is None:
        raise HTTPException(404, "Fotografía no encontrada.")
    if kind == "projects":
        for image in images:
            image.is_cover = False
        db.flush()
        selected.is_cover = True
    else:
        # Two-phase positions preserve the existing unique constraint and image IDs.
        ordered = [selected] + sorted(
            (x for x in images if x != selected), key=lambda x: x.position
        )
        base = max(x.position for x in images) + 1
        for index, image in enumerate(ordered):
            image.position = base + index
        db.flush()
        for index, image in enumerate(ordered):
            image.position = index
    audit_media(db, actor, kind, item, "cover_changed")
    db.commit()
    return {"ok": True}


@router.post("/{kind}/{id}/images/{image_id}/remove")
def remove(kind: str, id: UUID, image_id: UUID, db: Database, actor: AuthenticatedUser):
    item = entity(db, actor, kind, id)
    model = ProjectImage if kind == "projects" else PropertyImage
    fk = model.project_id if kind == "projects" else model.property_id
    images = list(db.scalars(select(model).where(fk == id)))
    selected = next((x for x in images if x.id == image_id), None)
    if selected is None:
        raise HTTPException(404, "Fotografía no encontrada.")
    was_cover = kind == "projects" and selected.is_cover
    # Queue only server-owned cloud identifiers; local assets are never removed.
    if selected.provider == "cloudinary" and selected.public_id:
        db.add(MediaCleanup(public_id=selected.public_id))
    db.delete(selected)
    db.flush()
    if was_cover:
        remaining = sorted((x for x in images if x != selected), key=lambda x: x.sort_order)
        if remaining:
            remaining[0].is_cover = True
    audit_media(db, actor, kind, item, "image_deleted")
    db.commit()
    return {"ok": True}
