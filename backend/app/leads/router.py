from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select

from app.auth.audit import record_audit
from app.auth.security import enforce_public_rate_limit
from app.dependencies import AuthenticatedUser, Configuration, Database, require_permission
from app.leads.models import Lead
from app.leads.schemas import LeadCreate, LeadOutput, LeadStatusPatch
from app.leads.service import validate_references

router = APIRouter(prefix="/leads", tags=["Leads · public"])


@router.post("", response_model=LeadOutput, status_code=201)
def create_lead(payload: LeadCreate, request: Request, db: Database, settings: Configuration):
    enforce_public_rate_limit(request, db, settings, "leads", settings.public_rate_limit_leads)
    validate_references(payload, db)
    item = Lead(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch(
    "/{id}/status",
    response_model=LeadOutput,
    dependencies=[Depends(require_permission("clients.manage"))],
    description="Update only the commercial status of a lead.",
)
def update_lead_status(id: UUID, payload: LeadStatusPatch, db: Database, actor: AuthenticatedUser):
    item = db.scalar(select(Lead).where(Lead.id == id).with_for_update())
    if item is None:
        raise HTTPException(404, "Lead not found")
    item.status = payload.status
    record_audit(db, actor, "LEAD_STATUS_CHANGED", "lead", item.id, {"status": payload.status})
    db.commit()
    db.refresh(item)
    return item
