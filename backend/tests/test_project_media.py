from io import BytesIO

import pytest
from fastapi import HTTPException
from PIL import Image
from pydantic import ValidationError

from app.media.provider import media_folder
from app.media.validation import validate_image
from app.projects.schemas import ProjectDetail, ProjectInput, ProjectSummary


def png():
    stream = BytesIO()
    Image.new("RGB", (8, 6)).save(stream, format="PNG")
    return stream.getvalue()


def test_upload_checks_decoded_content_not_extension():
    assert validate_image(png(), "image/png", 10000) == (8, 6, "png")
    for content, mime in [
        (png(), "image/jpeg"),
        (b"fake image", "image/png"),
        (png(), "text/html"),
    ]:
        with pytest.raises(HTTPException) as exc:
            validate_image(content, mime, 10000)
        assert exc.value.status_code == 415


def test_upload_size_is_bounded():
    with pytest.raises(HTTPException) as exc:
        validate_image(png(), "image/png", 10)
    assert exc.value.status_code == 413


def test_media_paths_are_controlled():
    assert (
        media_folder("mhg/staging", "projects", "cocina-ambar")
        == "mhg/staging/projects/cocina-ambar"
    )
    for root, kind, slug in [
        ("../other", "projects", "a"),
        ("mhg", "other", "a"),
        ("mhg", "properties", "../a"),
    ]:
        with pytest.raises(ValueError):
            media_folder(root, kind, slug)


def test_summaries_cannot_serialize_full_galleries():
    assert "images" not in ProjectSummary.model_fields
    assert "description" not in ProjectSummary.model_fields
    assert "images" in ProjectDetail.model_fields
    assert "description" in ProjectDetail.model_fields


def test_featured_order_is_required_and_bounded():
    for position in [None, 0, 10]:
        with pytest.raises(ValidationError):
            ProjectInput(
                name="Cocina", category="kitchen_furniture", featured=True, featured_order=position
            )
    assert (
        ProjectInput(name="Cocina", category="kitchen_furniture", featured_order=3).featured_order
        is None
    )


def test_cloudinary_sdk_is_server_side_and_returns_only_media_metadata(monkeypatch):
    import cloudinary.uploader

    from app.media.provider import CloudinaryProvider

    calls = []

    def upload(file, **options):
        calls.append(options)
        return {
            "public_id": options["public_id"],
            "secure_url": "https://res.cloudinary.com/test/image/upload/a.jpg",
            "width": 8,
            "height": 6,
            "format": "jpg",
            "bytes": 100,
        }

    monkeypatch.setattr(cloudinary.uploader, "upload", upload)
    result = CloudinaryProvider("test", "dummy-key", "dummy-secret").upload(
        png(), "mhg/test/projects/test"
    )
    assert calls[0]["overwrite"] is False
    assert calls[0]["resource_type"] == "image"
    assert "dummy-secret" not in repr(result)
    assert "dummy-key" not in repr(result)


def test_cloud_settings_allow_disabled_uploads_but_reject_partial_config():
    from app.config import Settings

    settings = Settings(
        _env_file=None,
        db_password="test-only",
        cloudinary_cloud_name="",
        cloudinary_api_key="",
        cloudinary_api_secret="",
    )
    assert settings.cloudinary_api_secret is None
    assert settings.media_upload_limit == 120
    assert settings.media_upload_window_seconds == 900
    assert settings.media_max_file_bytes == 8 * 1024 * 1024
    with pytest.raises(ValidationError):
        Settings(_env_file=None, db_password="test-only", cloudinary_cloud_name="test")
