from fastapi import HTTPException

from app.appointments.models import AppointmentStatus

TRANSITIONS = {
    AppointmentStatus.requested: {
        AppointmentStatus.pending_confirmation,
        AppointmentStatus.confirmed,
        AppointmentStatus.cancelled,
    },
    AppointmentStatus.pending_confirmation: {
        AppointmentStatus.confirmed,
        AppointmentStatus.cancelled,
    },
    AppointmentStatus.confirmed: {AppointmentStatus.completed, AppointmentStatus.cancelled},
    AppointmentStatus.completed: set(),
    AppointmentStatus.cancelled: set(),
}


def validate_transition(current: AppointmentStatus, target: AppointmentStatus) -> None:
    if target != current and target not in TRANSITIONS[current]:
        raise HTTPException(
            409, f"Invalid appointment transition: {current.value} -> {target.value}"
        )
