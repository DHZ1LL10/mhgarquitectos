import re
import unicodedata
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.auth.audit import record_audit
from app.dependencies import AuthenticatedUser, Database, require_permission
from app.projects.models import Project, ProjectImage
from app.projects.schemas import Category, ProjectDetail, ProjectInput, ProjectSummary

public_router = APIRouter(prefix="/projects", tags=["Projects"])
admin_router = APIRouter(
    prefix="/admin/projects",
    tags=["Projects admin"],
    dependencies=[Depends(require_permission("projects.manage"))],
)


def summary(db, item, cover=None, count=None):
    values = {
        name: getattr(item, name)
        for name in ProjectSummary.model_fields
        if name not in {"cover_image", "image_count"}
    }
    values["cover_image"] = (
        cover
        if count is not None
        else db.scalar(
            select(ProjectImage).where(ProjectImage.project_id == item.id, ProjectImage.is_cover)
        )
    )
    values["image_count"] = (
        count
        if count is not None
        else db.scalar(
            select(func.count()).select_from(ProjectImage).where(ProjectImage.project_id == item.id)
        )
    )
    return ProjectSummary.model_validate(values)


def summaries(db, items):
    items = list(items)
    ids = [item.id for item in items]
    if not ids:
        return []
    covers = {
        image.project_id: image
        for image in db.scalars(
            select(ProjectImage).where(ProjectImage.project_id.in_(ids), ProjectImage.is_cover)
        )
    }
    counts = dict(
        db.execute(
            select(ProjectImage.project_id, func.count())
            .where(ProjectImage.project_id.in_(ids))
            .group_by(ProjectImage.project_id)
        ).all()
    )
    return [summary(db, item, covers.get(item.id), counts.get(item.id, 0)) for item in items]


def detail(db, item):
    return ProjectDetail(
        **summary(db, item).model_dump(),
        description=item.description,
        images=db.scalars(
            select(ProjectImage)
            .where(ProjectImage.project_id == item.id)
            .order_by(ProjectImage.sort_order, ProjectImage.id)
        ).all(),
    )


def get_item(db, id):
    item = db.scalar(select(Project).where(Project.id == id).with_for_update())
    if item is None:
        raise HTTPException(404, "Proyecto no encontrado.")
    return item


@public_router.get("", response_model=list[ProjectSummary])
def public_list(
    db: Database,
    category: Category | None = None,
    featured: bool = False,
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = select(Project).where(Project.status == "published")
    if category:
        query = query.where(Project.category == category)
    if featured:
        query = query.where(Project.featured)
    return summaries(
        db,
        db.scalars(
            query.order_by(Project.category, Project.featured_order, Project.created_at, Project.id)
            .limit(limit)
            .offset(offset)
        ),
    )


@public_router.get("/{slug}", response_model=ProjectDetail)
def public_detail(slug: str, db: Database):
    item = db.scalar(select(Project).where(Project.slug == slug, Project.status == "published"))
    if item is None:
        raise HTTPException(404, "Proyecto no encontrado.")
    return detail(db, item)


@admin_router.get("", response_model=list[ProjectSummary])
def admin_list(db: Database):
    return summaries(db, db.scalars(select(Project).order_by(Project.updated_at.desc())))


@admin_router.get("/{id}", response_model=ProjectDetail)
def admin_detail(id: UUID, db: Database):
    return detail(db, get_item(db, id))


def validate_publication(db, item):
    if item.status == "published":
        count = db.scalar(
            select(func.count()).select_from(ProjectImage).where(ProjectImage.project_id == item.id)
        )
        covers = db.scalar(
            select(func.count())
            .select_from(ProjectImage)
            .where(ProjectImage.project_id == item.id, ProjectImage.is_cover)
        )
        if count and covers != 1:
            raise HTTPException(409, "Selecciona una portada antes de publicar.")


@admin_router.post("", response_model=ProjectDetail, status_code=201)
def create(payload: ProjectInput, db: Database, actor: AuthenticatedUser):
    normalized = (
        unicodedata.normalize("NFKD", payload.name).encode("ascii", "ignore").decode().lower()
    )
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")[:140].rstrip("-") or "proyecto"
    if db.scalar(select(Project.id).where(Project.slug == slug)):
        slug += "-" + uuid4().hex[:12]
    item = Project(**payload.model_dump(), slug=slug)
    db.add(item)
    db.flush()
    record_audit(db, actor, "project.created", "project", item.id)
    db.commit()
    return detail(db, item)


@admin_router.patch("/{id}", response_model=ProjectDetail)
def update(id: UUID, payload: ProjectInput, db: Database, actor: AuthenticatedUser):
    item = get_item(db, id)
    previous = item.status
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.flush()
    validate_publication(db, item)
    action = (
        "project.updated"
        if previous == item.status
        else "project.published"
        if item.status == "published"
        else "project.unpublished"
    )
    record_audit(
        db,
        actor,
        action,
        "project",
        item.id,
        {
            "status": item.status,
            "category": item.category,
            "featured": item.featured,
            "featured_order": item.featured_order,
        },
    )
    db.commit()
    return detail(db, item)
