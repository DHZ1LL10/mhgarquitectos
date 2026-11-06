"""Approved real property records that may be bootstrapped outside local development."""

from app.properties.models import PropertyStatus
from app.properties.schemas import PropertyCreate

MATA_LARGA_SLUG = "residencia-mata-larga-fortin"
MATA_LARGA_TITLE = "Residencia en venta en Mata Larga, Fortín"
MATA_LARGA_IMAGE_PREFIX = "/img/propiedades/mata-larga/"
MATA_LARGA_IMAGE_COUNT = 18


def mata_larga_property() -> PropertyCreate:
    """Return a fresh, schema-validated copy of the approved Mata Larga listing."""
    return PropertyCreate.model_validate(
        {
            "slug": MATA_LARGA_SLUG,
            "status": PropertyStatus.published,
            "title": MATA_LARGA_TITLE,
            "description": (
                "Residencia en Mata Larga, Fortín, diseñada para disfrutar de espacios "
                "amplios, luz natural y una conexión directa con el exterior. Cuenta con "
                "202 m² de terreno, 174 m² de construcción y un jardín privado de 105 m². "
                "Su distribución integra las áreas sociales y de servicio en planta baja, "
                "mientras que las tres recámaras se ubican en planta alta. Los acabados en "
                "mármol, la carpintería incluida y las preparaciones para climatización y "
                "paneles solares complementan una vivienda pensada para el presente y "
                "preparada para el futuro. Actualmente se encuentra en etapa final de "
                "construcción, con aproximadamente 85% de avance."
            ),
            "operation": "sale",
            "property_type": "house",
            "price": 2_990_000,
            "currency": "MXN",
            "location": {
                "city": "Fortín",
                "state": "Veracruz",
                "neighborhood": "Mata Larga",
            },
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
                "distribution": [
                    "Sala – comedor",
                    "Cocina",
                    "Medio baño",
                    "Área de lavado",
                    "Cochera",
                    "2 recámaras",
                    "Baño compartido",
                    "Recámara principal con baño",
                ],
                "amenities": [
                    "Jardín privado de 105 m²",
                    "Acabados en mármol",
                    "Carpintería incluida",
                    (
                        "Impermeabilización con prefabricado asfáltico de 3.5 mm con "
                        "refuerzo de poliéster"
                    ),
                    "Preparación para climas",
                    "Preparación para paneles solares",
                ],
                "list_price": 3_190_000,
                "bonus": 200_000,
                "commercial_label": "Precio de oportunidad",
            },
            "images": [
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}fachada-portada.jpg",
                    "alt": "Fachada y jardín de la residencia en Mata Larga",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}fachada-principal.jpg",
                    "alt": "Fachada principal de la residencia",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}jardin-privado.jpg",
                    "alt": "Jardín privado junto a los ventanales de la residencia",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}sala-comedor-01.jpg",
                    "alt": "Sala comedor con ventanales hacia el jardín",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}sala-comedor-02.jpg",
                    "alt": "Vista amplia de la sala comedor con acabados en mármol",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}vestibulo-01.jpg",
                    "alt": "Vestíbulo iluminado de la planta alta",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}vestibulo-02.jpg",
                    "alt": "Segunda vista del vestíbulo y cubo de escaleras",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}bano-compartido-01.jpg",
                    "alt": "Baño compartido en etapa final de construcción",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}bano-compartido-02.jpg",
                    "alt": "Área de regadera del baño compartido",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}recamara-principal.jpg",
                    "alt": "Recámara principal con entrada de luz natural",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}bano-principal.jpg",
                    "alt": "Baño de la recámara principal en etapa final",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}recamara-secundaria-01.jpg",
                    "alt": "Primera vista de una recámara secundaria",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}recamara-secundaria-02.jpg",
                    "alt": "Ventana y vista exterior de una recámara secundaria",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}recamara-secundaria-03.jpg",
                    "alt": "Segunda recámara secundaria con iluminación natural",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}recamara-secundaria-04.jpg",
                    "alt": "Vista hacia el acceso de una recámara secundaria",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}recamara-secundaria-05.jpg",
                    "alt": "Ventana y acabados de una recámara secundaria",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}plano-planta-baja.jpg",
                    "alt": "Plano arquitectónico de planta baja",
                    "width": 1080,
                    "height": 1350,
                },
                {
                    "url": f"{MATA_LARGA_IMAGE_PREFIX}plano-planta-alta.jpg",
                    "alt": "Plano arquitectónico de planta alta",
                    "width": 1080,
                    "height": 1350,
                },
            ],
        }
    )


def validate_mata_larga_payload(payload: PropertyCreate) -> None:
    """Fail closed if the controlled payload expands beyond the one approved listing."""
    if payload.slug != MATA_LARGA_SLUG:
        raise ValueError("Real property bootstrap is restricted to the approved Mata Larga slug")
    if payload.title != MATA_LARGA_TITLE:
        raise ValueError("Real property bootstrap is restricted to the approved Mata Larga title")
    if payload.status != PropertyStatus.published:
        raise ValueError("The approved Mata Larga listing must remain published")
    if len(payload.images) != MATA_LARGA_IMAGE_COUNT:
        raise ValueError("The approved Mata Larga gallery must contain exactly 18 images")
    image_urls = [image.url for image in payload.images]
    if len(set(image_urls)) != MATA_LARGA_IMAGE_COUNT or not all(
        url.startswith(MATA_LARGA_IMAGE_PREFIX) for url in image_urls
    ):
        raise ValueError("Mata Larga images must be unique approved project-relative paths")
