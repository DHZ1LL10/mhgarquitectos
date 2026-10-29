"""Create idempotent, local-only CRM demonstration records.

The script never sends notifications, deletes records, or resets folio counters.
"""

import hashlib
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.appointments.models import Appointment, AppointmentStatus
from app.config import get_settings
from app.db import SessionLocal
from app.kitchen_configurations.folios import KITCHEN_FOLIO_PREFIX, next_service_folio
from app.kitchen_configurations.models import KitchenConfiguration
from app.kitchen_configurations.submission_models import KitchenSubmission
from app.leads.models import Lead, LeadStatus
from app.properties.models import Operation, Property, PropertyImage, PropertyStatus, PropertyType
from app.properties.real_catalog import MATA_LARGA_SLUG, mata_larga_property

DEMO_MARKER = "mhg-local-crm-demo-v1"
MEXICO_CITY = ZoneInfo("America/Mexico_City")
REAL_PUBLISHED_PROPERTY_SLUG = MATA_LARGA_SLUG
DEMO_PROPERTY_STATUSES = {
    "casa-bosque-local": PropertyStatus.draft,
    "departamento-rio-local": PropertyStatus.archived,
}


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _at_local_day(days: int, hour: int, minute: int = 0) -> datetime:
    local_today = datetime.now(MEXICO_CITY).date()
    return datetime.combine(local_today + timedelta(days=days), time(hour, minute), MEXICO_CITY)


def _images(paths: list[tuple[str, str]]) -> list[PropertyImage]:
    return [
        PropertyImage(url=path, alt=alt, width=1080, height=1350, position=position)
        for position, (path, alt) in enumerate(paths)
    ]


def is_clearly_synthetic_property(item: Property) -> bool:
    """Identify only known local validation/demo records; never guess about user data."""
    if item.slug == REAL_PUBLISHED_PROPERTY_SLUG:
        return False
    if item.slug in DEMO_PROPERTY_STATUSES:
        return True
    if item.slug.startswith("phase3-validation-"):
        return (
            item.title == "Phase 3 persistence validation"
            and item.description == "Propiedad de prueba automatizada."
        )
    if item.slug.startswith("validacion-"):
        return (
            item.title == "Casa de prueba local"
            and item.description == "Registro exclusivamente para validar la API local."
        )
    return False


def synthetic_published_properties(db) -> list[Property]:
    return [
        item
        for item in db.scalars(
            select(Property).where(Property.status == PropertyStatus.published)
        ).all()
        if is_clearly_synthetic_property(item)
    ]


def seed_properties(db) -> int:
    real_payload = mata_larga_property()
    real_record = real_payload.model_dump(mode="python", exclude={"images"})
    real_record["images"] = [
        PropertyImage(**image.model_dump(), position=position)
        for position, image in enumerate(real_payload.images)
    ]
    records = [
        real_record,
        {
            "slug": "casa-bosque-local",
            "status": PropertyStatus.draft,
            "title": "Casa Bosque — propuesta interna",
            "description": "Registro sintético local para revisar el flujo editorial del CRM.",
            "operation": Operation.sale,
            "property_type": PropertyType.house,
            "price": 2_450_000,
            "location": {"city": "Fortín", "state": "Veracruz", "neighborhood": "Zona sintética"},
            "features": {"area_m2": 156, "bedrooms": 3, "bathrooms": 2, "parking_spaces": 1},
            "images": _images([("/img/fachada-frente.jpg", "Referencia visual sintética")]),
        },
        {
            "slug": "departamento-rio-local",
            "status": PropertyStatus.archived,
            "title": "Departamento Río — registro archivado",
            "description": "Registro sintético local para revisar propiedades archivadas.",
            "operation": Operation.rent,
            "property_type": PropertyType.apartment,
            "price": 12_500,
            "location": {"city": "Tuxtepec", "state": "Oaxaca", "neighborhood": "Zona sintética"},
            "features": {"area_m2": 82, "bedrooms": 2, "bathrooms": 1, "parking_spaces": 1},
            "images": _images([("/img/interiorismo/espacio-1.jpg", "Referencia visual sintética")]),
        },
    ]
    created = 0
    for record in records:
        if db.scalar(select(Property.id).where(Property.slug == record["slug"])) is not None:
            continue
        images = record.pop("images")
        item = Property(**{"currency": "MXN", **record})
        item.images = images
        db.add(item)
        created += 1
    return created


def seed_crm_scenarios(db) -> int:
    scenarios = [
        {
            "key": "aurora",
            "name": "Aurora Campos",
            "email": "aurora.campos@example.com",
            "phone": "0000000001",
            "lead_status": LeadStatus.new,
            "appointment_status": AppointmentStatus.pending_confirmation,
            "requested": _at_local_day(0, 10),
            "confirmed": None,
            "branch": "Fortín",
            "address": "Colonia Centro, Fortín, Veracruz",
            "message": "Quiero renovar mi cocina y revisar opciones de distribución y acabados.",
            "notes": "Confirmar disponibilidad para la visita y revisar medidas del espacio.",
            "situation": "remodelacion",
            "countertop": "Cuarzo",
        },
        {
            "key": "mateo",
            "name": "Mateo Ríos",
            "email": "mateo.rios@example.com",
            "phone": "0000000002",
            "lead_status": LeadStatus.contacted,
            "appointment_status": AppointmentStatus.confirmed,
            "requested": _at_local_day(2, 12, 30),
            "confirmed": _at_local_day(2, 12, 30),
            "branch": "Tuxtepec",
            "address": "Colonia Santa Fe, San Juan Bautista Tuxtepec, Oaxaca",
            "message": "Busco diseñar una cocina nueva para una casa en proceso de adecuación.",
            "notes": "Visita confirmada para revisar distribución, cubierta y almacenamiento.",
            "situation": "sin-cocina",
            "countertop": "Granito natural",
        },
        {
            "key": "renata",
            "name": "Renata Solís",
            "email": "renata.solis@example.com",
            "phone": "0000000003",
            "lead_status": LeadStatus.qualified,
            "appointment_status": AppointmentStatus.completed,
            "requested": _at_local_day(-3, 16),
            "confirmed": _at_local_day(-3, 16),
            "branch": "Fortín",
            "address": "Colonia San José, Fortín, Veracruz",
            "message": "Necesito actualizar frentes y herrajes conservando la base existente.",
            "notes": "Visita realizada; el proyecto queda listo para seguimiento comercial.",
            "situation": "barra-concreto",
            "countertop": "Piedra sinterizada",
        },
    ]
    created = 0
    for scenario in scenarios:
        key_hash = _digest(f"{DEMO_MARKER}:{scenario['key']}")
        existing = db.scalar(
            select(KitchenSubmission).where(KitchenSubmission.idempotency_key_hash == key_hash)
        )
        if existing is not None:
            configuration = db.get(KitchenConfiguration, existing.configuration_id)
            appointment = db.get(Appointment, existing.appointment_id)
            lead = db.get(Lead, existing.lead_id)
            if configuration and configuration.selections.get("demo_marker") == DEMO_MARKER:
                configuration.address = scenario["address"]
                configuration.requested_datetime = scenario["requested"]
                configuration.notes = scenario["notes"]
                if appointment:
                    appointment.requested_datetime = scenario["requested"]
                    appointment.confirmed_datetime = scenario["confirmed"]
                    appointment.address = scenario["address"]
                    appointment.status = scenario["appointment_status"]
                    appointment.notes = scenario["notes"]
                if lead:
                    lead.message = scenario["message"]
            continue
        configuration = KitchenConfiguration(
            current_situation=scenario["situation"],
            interior_board={"id": "blanco-frosty", "label": "Blanco Frosty 15 mm"},
            exterior_fronts={"arauco": {"label": "Arauco · Chardonnay"}},
            hardware={
                "bisagras": {"label": "Bisagra cierre suave"},
                "correderas": {"label": "Corredera telescópica"},
                "cajones": [],
                "basureros": {"not_applicable": True},
                "especiero": {"not_applicable": True},
                "modulos_especiales": [],
            },
            countertop={"label": scenario["countertop"]},
            finish=None,
            extras=[],
            address=scenario["address"],
            latitude=None,
            longitude=None,
            branch=scenario["branch"],
            advisor=None,
            requested_datetime=scenario["requested"],
            notes=scenario["notes"],
            selection_version=1,
            selections={"demo_marker": DEMO_MARKER},
        )
        appointment = Appointment(
            requested_datetime=scenario["requested"],
            confirmed_datetime=scenario["confirmed"],
            branch=scenario["branch"],
            address=scenario["address"],
            latitude=None,
            longitude=None,
            status=scenario["appointment_status"],
            notes=scenario["notes"],
        )
        db.add_all([configuration, appointment])
        db.flush()
        lead = Lead(
            source="kitchen_customizer",
            name=scenario["name"],
            phone=scenario["phone"],
            email=scenario["email"],
            message=scenario["message"],
            kitchen_configuration_id=configuration.id,
            appointment_id=appointment.id,
            status=scenario["lead_status"],
        )
        db.add(lead)
        db.flush()
        db.add(
            KitchenSubmission(
                folio=next_service_folio(db, KITCHEN_FOLIO_PREFIX),
                idempotency_key_hash=key_hash,
                payload_hash=_digest(f"{DEMO_MARKER}:payload:{scenario['key']}"),
                configuration_id=configuration.id,
                appointment_id=appointment.id,
                lead_id=lead.id,
                status="received",
                notification_status="not_configured",
                notification_attempts=0,
            )
        )
        created += 1
    return created


def main() -> None:
    settings = get_settings()
    if settings.environment != "local":
        raise SystemExit("Refusing to seed CRM demo data outside ENVIRONMENT=local")
    with SessionLocal() as db:
        try:
            properties = seed_properties(db)
            scenarios = seed_crm_scenarios(db)
            unexpected_publications = synthetic_published_properties(db)
            db.commit()
        except Exception:
            db.rollback()
            raise
    print(f"Local CRM demo ready: {properties} properties and {scenarios} scenarios created")
    for item in unexpected_publications:
        print(
            "WARNING: clearly synthetic property remains published; archive it after review: "
            f"id={item.id} slug={item.slug} title={item.title!r}"
        )


if __name__ == "__main__":
    main()
