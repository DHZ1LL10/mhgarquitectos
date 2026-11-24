import hashlib
import json
import logging
from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from pydantic import model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.appointments.models import Appointment
from app.appointments.schemas import AppointmentCreate
from app.auth.security import enforce_public_rate_limit
from app.common import InputModel, OutputModel
from app.dependencies import Configuration, Database
from app.kitchen_configurations.folios import KITCHEN_FOLIO_PREFIX, next_service_folio
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.schemas import KitchenCreate
from app.kitchen_configurations.submission_models import KitchenSubmission
from app.leads.models import Lead
from app.leads.schemas import ContactInput
from app.notifications.email import (
    EmailNotifier,
    KitchenEmailData,
    get_email_notifier,
)

logger = logging.getLogger("mhg.notifications")
router = APIRouter(prefix="/kitchen-submissions", tags=["Kitchen submission · public"])


class Submission(InputModel):
    configuration: KitchenCreate
    appointment: AppointmentCreate
    contact: ContactInput

    @model_validator(mode="after")
    def same_context(self):
        for name in ("address", "latitude", "longitude", "branch"):
            if getattr(self.configuration, name) != getattr(self.appointment, name):
                raise ValueError(f"configuration and appointment must share {name}")
        requested = self.configuration.requested_datetime
        if requested is not None and requested != self.appointment.requested_datetime:
            raise ValueError("requested_datetime must match the appointment")
        return self


class SubmissionOutput(OutputModel):
    submission_id: UUID
    folio: str
    configuration_id: UUID
    appointment_id: UUID
    lead_id: UUID
    status: Literal["received"]
    replayed: bool


def notifier_dependency(settings: Configuration) -> EmailNotifier:
    return get_email_notifier(settings)


Notifier = Annotated[EmailNotifier, Depends(notifier_dependency)]
IdempotencyKey = Annotated[UUID, Header(alias="Idempotency-Key")]


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _payload_digest(payload: Submission) -> str:
    canonical = json.dumps(
        payload.model_dump(mode="json"),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return _digest(canonical)


def _receipt(item: KitchenSubmission, replayed: bool) -> SubmissionOutput:
    return SubmissionOutput(
        submission_id=item.id,
        folio=item.folio,
        configuration_id=item.configuration_id,
        appointment_id=item.appointment_id,
        lead_id=item.lead_id,
        status="received",
        replayed=replayed,
    )


def _existing_receipt(
    db: Database, key_hash: str, payload_hash: str, response: Response
) -> SubmissionOutput | None:
    existing = db.scalar(
        select(KitchenSubmission).where(KitchenSubmission.idempotency_key_hash == key_hash)
    )
    if existing is None:
        return None
    if existing.payload_hash != payload_hash:
        raise HTTPException(409, "Idempotency key was already used for different data")
    response.status_code = 200
    return _receipt(existing, replayed=True)


def _email_data(
    submission: KitchenSubmission,
    payload: Submission,
) -> KitchenEmailData:
    configuration = payload.configuration
    return KitchenEmailData(
        folio=submission.folio,
        submission_id=str(submission.id),
        name=payload.contact.name,
        phone=payload.contact.phone,
        email=str(payload.contact.email) if payload.contact.email else None,
        requested_datetime=payload.appointment.requested_datetime.isoformat(),
        branch=payload.appointment.branch,
        advisor=configuration.advisor,
        address=payload.appointment.address,
        latitude=payload.appointment.latitude,
        longitude=payload.appointment.longitude,
        current_situation=configuration.current_situation,
        interior_board=configuration.interior_board,
        exterior_fronts=configuration.exterior_fronts,
        hardware=configuration.hardware,
        countertop=configuration.countertop,
        finish=configuration.finish,
        extras=configuration.extras,
        received_at=submission.created_at.isoformat(),
        notes=configuration.notes,
    )


def _notify_after_commit(
    db: Database,
    submission: KitchenSubmission,
    payload: Submission,
    notifier: EmailNotifier,
) -> None:
    submission.notification_attempts += 1
    if not notifier.configured:
        submission.notification_status = "not_configured"
        db.commit()
        return
    try:
        notifier.send_kitchen_submission(_email_data(submission, payload))
        submission.notification_status = "sent"
        submission.notification_error = None
        submission.notified_at = datetime.now(UTC)
    except Exception as exc:  # noqa: BLE001 - notification cannot invalidate persisted data.
        logger.error(
            "kitchen_notification_failed submission_id=%s error_type=%s",
            submission.id,
            type(exc).__name__,
        )
        submission.notification_status = "failed"
        submission.notification_error = type(exc).__name__[:500]
    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001 - receipt remains committed if bookkeeping fails.
        db.rollback()
        logger.error(
            "kitchen_notification_status_update_failed submission_id=%s error_type=%s",
            submission.id,
            type(exc).__name__,
        )


@router.post(
    "",
    response_model=SubmissionOutput,
    status_code=201,
    description=(
        "Idempotent atomic public submission. Persistence commits before the optional "
        "notification channel is attempted."
    ),
)
def create_submission(
    payload: Submission,
    request: Request,
    response: Response,
    idempotency_key: IdempotencyKey,
    db: Database,
    notifier: Notifier,
    settings: Configuration,
):
    enforce_public_rate_limit(
        request,
        db,
        settings,
        "kitchen-submissions",
        settings.public_rate_limit_kitchen_submissions,
    )
    key_hash = _digest(str(idempotency_key))
    payload_hash = _payload_digest(payload)
    receipt = _existing_receipt(db, key_hash, payload_hash, response)
    if receipt is not None:
        return receipt

    configuration_values = payload.configuration.model_dump()
    configuration_values["requested_datetime"] = payload.appointment.requested_datetime
    configuration = KitchenConfiguration(**configuration_values)
    appointment = Appointment(**payload.appointment.model_dump())
    try:
        db.add_all([configuration, appointment])
        db.flush()
        lead = Lead(
            **payload.contact.model_dump(),
            kitchen_configuration_id=configuration.id,
            appointment_id=appointment.id,
        )
        db.add(lead)
        db.flush()
        submission = KitchenSubmission(
            folio=next_service_folio(db, KITCHEN_FOLIO_PREFIX),
            idempotency_key_hash=key_hash,
            payload_hash=payload_hash,
            configuration_id=configuration.id,
            appointment_id=appointment.id,
            lead_id=lead.id,
            status="received",
            notification_status="pending",
        )
        db.add(submission)
        db.commit()
    except IntegrityError:
        db.rollback()
        receipt = _existing_receipt(db, key_hash, payload_hash, response)
        if receipt is not None:
            return receipt
        raise
    except Exception:
        db.rollback()
        raise

    _notify_after_commit(db, submission, payload, notifier)
    return _receipt(submission, replayed=False)
