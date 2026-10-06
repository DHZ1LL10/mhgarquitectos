from fastapi import APIRouter

from app.dependencies import Database
from app.leads.models import Lead
from app.leads.schemas import LeadCreate, LeadOutput
from app.leads.service import validate_references

router = APIRouter(prefix="/leads", tags=["Leads · public"])


@router.post("", response_model=LeadOutput, status_code=201)
def create_lead(payload: LeadCreate, db: Database):
    validate_references(payload, db)
    item = Lead(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
