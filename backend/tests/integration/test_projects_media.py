from io import BytesIO
from uuid import uuid4

import pytest
from PIL import Image
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.main import app
from app.media.provider import StoredImage
from app.media.router import provider
from app.projects.models import ProjectImage
from app.scripts.seed_projects import bootstrap
from tests.integration.test_auth import add_user, login
from tests.payloads import contact_payload, property_payload


class FakeStorage:
    def __init__(self):
        self.uploaded = []
        self.deleted = []

    def upload(self, content, folder):
        key = f"{folder}/{uuid4().hex}"
        self.uploaded.append(key)
        return StoredImage(
            key,
            f"https://res.cloudinary.com/test/image/upload/{key}.png",
            8,
            8,
            "png",
            len(content),
        )

    def destroy(self, key):
        self.deleted.append(key)


@pytest.fixture
def storage(client):
    fake = FakeStorage()
    app.dependency_overrides[provider] = lambda: fake
    yield fake
    app.dependency_overrides.pop(provider, None)


def image_file():
    data = BytesIO()
    Image.new("RGB", (8, 8)).save(data, "PNG")
    return ("photo.png", data.getvalue(), "image/png")


def create_project(client, **values):
    response = client.post(
        "/api/v1/admin/projects",
        json={"name": "Proyecto real", "category": "kitchen_furniture", **values},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_bootstrap_counts_idempotence_covers_and_summary_contract(client, connection):
    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        assert bootstrap(db) == {"created": 24, "updated": 0, "skipped": 0}
        ids = list(db.scalars(select(ProjectImage.id)))
        assert len(ids) == 381
        assert bootstrap(db) == {"created": 0, "updated": 0, "skipped": 24}
        assert set(db.scalars(select(ProjectImage.id))) == set(ids)
        assert (
            db.scalar(
                select(func.count())
                .select_from(ProjectImage)
                .where(ProjectImage.provider != "local")
            )
            == 0
        )
    summaries = client.get("/api/v1/projects").json()
    assert len(summaries) == 24
    assert sum(p["category"] == "kitchen_furniture" for p in summaries) == 20
    assert all("images" not in p and "description" not in p for p in summaries)
    featured = client.get("/api/v1/projects?featured=true").json()
    assert len(featured) == 13
    assert sum(p["category"] == "kitchen_furniture" for p in featured) == 9
    for item in summaries:
        detail = client.get(f"/api/v1/projects/{item['slug']}").json()
        assert len(detail["images"]) == item["image_count"]
        assert sum(image["is_cover"] for image in detail["images"]) == 1
        assert item["cover_image"] in detail["images"]


def test_upload_budget_separate_persistent_and_incremental(client, storage):
    settings = get_settings().model_copy(
        update={"media_upload_limit": 3, "public_rate_limit_leads": 1}
    )
    app.dependency_overrides[get_settings] = lambda: settings
    assert client.post("/api/v1/leads", json=contact_payload()).status_code == 201
    project = create_project(client)
    base = f"/api/v1/admin/media/projects/{project['id']}"
    for _ in range(3):
        response = client.post(base + "/upload", files={"file": image_file()})
        assert response.status_code == 200, response.text
    denied = client.post(base + "/upload", files={"file": image_file()})
    assert denied.status_code == 429
    assert int(denied.headers["retry-after"]) > 0
    assert len(storage.uploaded) == 3
    assert client.post("/api/v1/leads", json=contact_payload()).status_code == 429
    detail = client.get(f"/api/v1/admin/projects/{project['id']}").json()
    assert len(detail["images"]) == 3
    selected = detail["images"][-1]["id"]
    assert client.post(f"{base}/images/{selected}/cover").status_code == 200
    assert client.post(f"{base}/images/{selected}/remove").status_code == 200
    detail = client.get(f"/api/v1/admin/projects/{project['id']}").json()
    assert len(detail["images"]) == 2
    assert sum(image["is_cover"] for image in detail["images"]) == 1


def test_property_fields_preserve_gallery_and_media_is_incremental(client, storage):
    response = client.post("/api/v1/properties", json=property_payload())
    assert response.status_code == 201, response.text
    original = response.json()
    base = f"/api/v1/admin/media/properties/{original['id']}"
    endpoint = f"/api/v1/properties/{original['id']}"
    response = client.patch(endpoint, json={"title": "Título actualizado"})
    assert response.status_code == 200
    assert response.json()["images"] == original["images"]
    assert client.patch(endpoint, json={"images": []}).status_code == 422
    added = client.post(base + "/upload", files={"file": image_file()})
    assert added.status_code == 200, added.text
    image_id = added.json()["id"]
    assert client.post(f"{base}/images/{image_id}/cover").status_code == 200
    current = client.get(f"/api/v1/admin/properties/{original['id']}").json()
    assert current["images"][0]["id"] == image_id
    assert {x["id"] for x in original["images"]}.issubset({x["id"] for x in current["images"]})
    assert client.post(f"{base}/images/{image_id}/remove").status_code == 200
    current = client.get(f"/api/v1/admin/properties/{original['id']}").json()
    assert {x["id"] for x in current["images"]} == {x["id"] for x in original["images"]}


def test_upload_rejects_fake_image_and_cross_entity_mutations(client, storage):
    first = create_project(client)
    second = create_project(client)
    base = f"/api/v1/admin/media/projects/{first['id']}"
    assert (
        client.post(
            base + "/upload", files={"file": ("x.png", b"not an image", "image/png")}
        ).status_code
        == 415
    )
    added = client.post(base + "/upload", files={"file": image_file()}).json()
    assert (
        client.post(
            f"/api/v1/admin/media/projects/{second['id']}/images/{added['id']}/remove"
        ).status_code
        == 404
    )
    assert len(storage.uploaded) == 1


def test_upload_body_limit_is_specific_and_bounded(client, storage):
    project = create_project(client)
    endpoint = f"/api/v1/admin/media/projects/{project['id']}/upload"
    medium = b"invalid" * 200000
    assert (
        client.post(
            "/api/v1/leads", content=medium, headers={"Content-Type": "application/json"}
        ).status_code
        == 413
    )
    assert (
        client.post(endpoint, files={"file": ("photo.png", medium, "image/png")}).status_code == 415
    )
    assert (
        client.post(
            endpoint, files={"file": ("photo.png", b"x" * (8 * 1024 * 1024 + 1), "image/png")}
        ).status_code
        == 413
    )
    assert storage.uploaded == []


def test_anonymous_projects_admin_and_upload_denied(anonymous_client):
    assert anonymous_client.get("/api/v1/admin/projects").status_code == 401
    assert (
        anonymous_client.post(
            f"/api/v1/admin/media/projects/{uuid4()}/upload", files={"file": image_file()}
        ).status_code
        == 401
    )


def test_featured_constraints_in_postgres(client, connection):
    first = create_project(client, featured=True, featured_order=1)
    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        with pytest.raises(IntegrityError), db.begin_nested():
            db.execute(
                text("UPDATE projects SET featured_order=NULL WHERE id=:id"), {"id": first["id"]}
            )
        with pytest.raises(IntegrityError), db.begin_nested():
            db.execute(
                text("UPDATE projects SET featured_order=10 WHERE id=:id"), {"id": first["id"]}
            )
    assert (
        client.post(
            "/api/v1/admin/projects",
            json={
                "name": "Otro",
                "category": "kitchen_furniture",
                "featured": True,
                "featured_order": 1,
            },
        ).status_code
        == 409
    )
    assert create_project(client, category="design_construction", featured=True, featured_order=1)


def test_staff_permission_is_checked_on_each_request(anonymous_client, connection):
    user = add_user(connection, role="staff", permissions=[])
    assert login(anonymous_client, role="staff").status_code == 200
    assert anonymous_client.get("/api/v1/admin/projects").status_code == 403
    assert (
        anonymous_client.post(
            f"/api/v1/admin/media/projects/{uuid4()}/upload", files={"file": image_file()}
        ).status_code
        == 403
    )
    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        from app.auth.models import AdminUser

        db.get(AdminUser, user.id).permissions = ["projects.manage"]
        db.commit()
    assert anonymous_client.get("/api/v1/admin/projects").status_code == 200
    project = create_project(anonymous_client)
    assert anonymous_client.get(f"/api/v1/projects/{project['slug']}").status_code == 404
    response = anonymous_client.patch(
        f"/api/v1/admin/projects/{project['id']}",
        json={
            "name": "Nombre actualizado",
            "category": "design_construction",
            "status": "published",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["slug"] == project["slug"]
    assert anonymous_client.get(f"/api/v1/projects/{project['slug']}").status_code == 200


def test_failed_database_write_compensates_cloud_upload(client, storage, monkeypatch):
    project = create_project(client)
    import app.media.router as media

    def failure(*args, **kwargs):
        raise RuntimeError("simulated database write failure")

    monkeypatch.setattr(media, "record_audit", failure)
    response = client.post(
        f"/api/v1/admin/media/projects/{project['id']}/upload", files={"file": image_file()}
    )
    assert response.status_code == 500
    assert storage.uploaded == storage.deleted
    assert client.get(f"/api/v1/admin/projects/{project['id']}").json()["images"] == []


def test_upload_csrf_and_permission_before_provider(client, storage, connection):
    project = create_project(client)
    endpoint = f"/api/v1/admin/media/projects/{project['id']}/upload"
    assert (
        client.post(
            endpoint, files={"file": image_file()}, headers={"Origin": "https://untrusted.example"}
        ).status_code
        == 403
    )
    add_user(connection, role="staff", permissions=[])
    login(client, role="staff")
    assert client.post(endpoint, files={"file": image_file()}).status_code == 403
    assert storage.uploaded == []


def test_cloud_removal_is_queued_and_retryable_without_deleting_local_assets(
    client, storage, connection
):
    from app.media.models import MediaCleanup
    from app.scripts.cleanup_media import cleanup

    project = create_project(client)
    base = f"/api/v1/admin/media/projects/{project['id']}"
    image = client.post(base + "/upload", files={"file": image_file()}).json()
    assert client.post(f"{base}/images/{image['id']}/remove").status_code == 200
    assert storage.deleted == []
    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        assert db.scalar(select(func.count()).select_from(MediaCleanup)) == 1
        assert cleanup(db, storage, "other/environment") == 0
        assert cleanup(db, storage, get_settings().cloudinary_folder) == 1
        assert cleanup(db, storage, get_settings().cloudinary_folder) == 0
    assert storage.uploaded == storage.deleted
