from fastapi import APIRouter, Request

from app.auth.security import enforce_public_rate_limit
from app.dependencies import Configuration, Database
from app.leads.models import Lead
from app.leads.schemas import LeadCreate, LeadOutput
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
