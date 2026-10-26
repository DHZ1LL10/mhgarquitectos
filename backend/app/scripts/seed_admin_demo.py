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

DEMO_MARKER = "mhg-local-crm-demo-v1"
MEXICO_CITY = ZoneInfo("America/Mexico_City")
REAL_PUBLISHED_PROPERTY_SLUG = "residencia-mata-larga-fortin"
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
    records = [
        {
            "slug": "residencia-mata-larga-fortin",
            "status": PropertyStatus.published,
            "title": "Residencia en venta en Mata Larga, Fortín",
            "description": (
                "Residencia en Mata Larga, Fortín, con 202 m² de terreno, 174 m² de "
                "construcción y jardín privado. Se encuentra en etapa final de construcción."
            ),
            "operation": Operation.sale,
            "property_type": PropertyType.house,
            "price": 2_990_000,
            "location": {"city": "Fortín", "state": "Veracruz", "neighborhood": "Mata Larga"},
            "features": {
                "area_m2": 174,
                "construction_area_m2": 174,
                "land_area_m2": 202,
                "garden_area_m2": 105,
                "bedrooms": 3,
                "bathrooms": 2,
                "half_bathrooms": 1,
                "parking_spaces": None,
                "construction_progress": 85,
                "construction_status": "Etapa final de construcción",
                "distribution": ["Sala – comedor", "Cocina", "Área de lavado", "Cochera"],
                "amenities": ["Jardín privado", "Acabados en mármol", "Carpintería incluida"],
                "list_price": 3_190_000,
                "bonus": 200_000,
                "commercial_label": "Precio de oportunidad",
            },
            "images": _images(
                [
                    (
                        "/img/propiedades/mata-larga/fachada-portada.jpg",
                        "Fachada y jardín de la residencia en Mata Larga",
                    ),
                    (
                        "/img/propiedades/mata-larga/fachada-principal.jpg",
                        "Fachada principal de la residencia",
                    ),
                    (
                        "/img/propiedades/mata-larga/jardin-privado.jpg",
                        "Jardín privado de la residencia",
                    ),
                    (
                        "/img/propiedades/mata-larga/sala-comedor-01.jpg",
                        "Sala comedor con vista al jardín",
                    ),
                    (
                        "/img/propiedades/mata-larga/plano-planta-baja.jpg",
                        "Plano arquitectónico de planta baja",
                    ),
                    (
                        "/img/propiedades/mata-larga/plano-planta-alta.jpg",
                        "Plano arquitectónico de planta alta",
                    ),
                ]
            ),
        },
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
        item = Property(currency="MXN", **record)
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
            "address": "Dirección sintética local 101, Fortín, Veracruz",
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
            "address": "Dirección sintética local 202, Tuxtepec, Oaxaca",
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
            "address": "Dirección sintética local 303, Fortín, Veracruz",
            "situation": "barra-concreto",
            "countertop": "Piedra sinterizada",
        },
    ]
    created = 0
    for scenario in scenarios:
        key_hash = _digest(f"{DEMO_MARKER}:{scenario['key']}")
        if (
            db.scalar(
                select(KitchenSubmission.id).where(
                    KitchenSubmission.idempotency_key_hash == key_hash
                )
            )
            is not None
        ):
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
            notes=f"Escenario sintético local · {DEMO_MARKER}",
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
            notes=f"Escenario sintético local · {DEMO_MARKER}",
        )
        db.add_all([configuration, appointment])
        db.flush()
        lead = Lead(
            source="kitchen_customizer",
            name=scenario["name"],
            phone=scenario["phone"],
            email=scenario["email"],
            message="Solicitud sintética para demostración local del CRM.",
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
