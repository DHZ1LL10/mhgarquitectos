from uuid import UUID

from app.common import OutputModel


class SubmissionReference(OutputModel):
    id: UUID
    folio: str
    configuration_id: UUID
    appointment_id: UUID
    lead_id: UUID
    status: str
    notification_status: str
