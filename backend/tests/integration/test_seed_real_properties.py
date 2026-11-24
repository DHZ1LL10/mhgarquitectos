from decimal import Decimal

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.properties.models import Property, PropertyImage, PropertyStatus
from app.properties.real_catalog import (
    MATA_LARGA_IMAGE_COUNT,
    MATA_LARGA_IMAGE_PREFIX,
    MATA_LARGA_SLUG,
    mata_larga_property,
    validate_mata_larga_payload,
)
from app.properties.schemas import PropertyCreate
from app.scripts.seed_real_properties import (
    SUPPORTED_ENVIRONMENTS,
    bootstrap_mata_larga,
    format_summary,
)


def _model_from_payload(payload: PropertyCreate) -> Property:
    item = Property(**payload.model_dump(mode="python", exclude={"images"}))
    item.images = [
        PropertyImage(**image.model_dump(), position=position)
        for position, image in enumerate(payload.images)
    ]
    return item


def _session(connection) -> Session:
    return Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )


def test_real_property_bootstrap_creates_once_and_second_run_skips(connection):
    with _session(connection) as db:
        first = bootstrap_mata_larga(db)
        db.commit()
        second = bootstrap_mata_larga(db)
        db.commit()

        assert (first.created, first.updated, first.skipped) == (1, 0, 0)
        assert (second.created, second.updated, second.skipped) == (0, 0, 1)
        assert db.scalar(select(func.count()).select_from(Property)) == 1
        item = db.scalar(select(Property).where(Property.slug == MATA_LARGA_SLUG))
        assert item.status == PropertyStatus.published
        assert item.features["parking_spaces"] is None
        assert len(item.images) == MATA_LARGA_IMAGE_COUNT
        assert [image.position for image in item.images] == list(range(MATA_LARGA_IMAGE_COUNT))
        assert format_summary(second) == (
            "created=0 updated=0 skipped=1 slug=residencia-mata-larga-fortin status=published"
        )


def test_real_property_bootstrap_updates_only_mata_larga_by_slug(connection):
    other_payload = PropertyCreate.model_validate(
        {
            "slug": "registro-ajeno-existente",
            "status": "draft",
            "title": "Registro ajeno existente",
            "description": "Este registro no pertenece al bootstrap controlado.",
            "operation": "sale",
            "property_type": "land",
            "price": 500_000,
            "currency": "MXN",
            "location": {
                "city": "Fortín",
                "state": "Veracruz",
                "neighborhood": "Centro",
            },
            "features": {"area_m2": 100, "bedrooms": 0, "bathrooms": 0},
            "images": [],
        }
    )
    with _session(connection) as db:
        other = _model_from_payload(other_payload)
        db.add(other)
        bootstrap_mata_larga(db)
        db.commit()
        other_snapshot = (other.id, other.title, other.status, other.price, other.updated_at)

        mata_larga = db.scalar(select(Property).where(Property.slug == MATA_LARGA_SLUG))
        mata_larga.title = "Dato desactualizado"
        mata_larga.price = Decimal("1.00")
        mata_larga.status = PropertyStatus.draft
        mata_larga.images[0].alt = "Dato desactualizado"
        db.commit()

        result = bootstrap_mata_larga(db)
        db.commit()

        assert (result.created, result.updated, result.skipped) == (0, 1, 0)
        assert db.scalar(select(func.count()).select_from(Property)) == 2
        refreshed = db.scalar(select(Property).where(Property.slug == MATA_LARGA_SLUG))
        expected = mata_larga_property()
        assert refreshed.title == expected.title
        assert refreshed.price == expected.price
        assert refreshed.status == PropertyStatus.published
        assert [image.url for image in refreshed.images] == [image.url for image in expected.images]
        db.refresh(other)
        assert (
            other.id,
            other.title,
            other.status,
            other.price,
            other.updated_at,
        ) == other_snapshot


def test_public_api_returns_published_mata_larga_with_approved_gallery(
    connection, anonymous_client
):
    with _session(connection) as db:
        bootstrap_mata_larga(db)
        db.commit()

    response = anonymous_client.get(f"/api/v1/properties/{MATA_LARGA_SLUG}")
    assert response.status_code == 200
    item = response.json()
    expected_urls = [image.url for image in mata_larga_property().images]
    assert item["slug"] == MATA_LARGA_SLUG
    assert item["status"] == "published"
    assert len(item["images"]) == MATA_LARGA_IMAGE_COUNT
    assert [image["url"] for image in item["images"]] == expected_urls
    assert all(url.startswith(MATA_LARGA_IMAGE_PREFIX) for url in expected_urls)
    assert [entry["slug"] for entry in anonymous_client.get("/api/v1/properties").json()] == [
        MATA_LARGA_SLUG
    ]


def test_real_property_payload_is_single_listing_and_fails_closed():
    payload = mata_larga_property()
    validate_mata_larga_payload(payload)
    assert {"staging", "production"} <= SUPPORTED_ENVIRONMENTS

    with pytest.raises(ValueError, match="approved Mata Larga slug"):
        validate_mata_larga_payload(payload.model_copy(update={"slug": "casa-demo"}))
    with pytest.raises(ValueError, match="approved Mata Larga title"):
        validate_mata_larga_payload(payload.model_copy(update={"title": "Casa demo"}))
    with pytest.raises(ValueError, match="exactly 18 images"):
        validate_mata_larga_payload(payload.model_copy(update={"images": payload.images[:-1]}))
