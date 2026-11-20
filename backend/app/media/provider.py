"""Cloud storage boundary. Credentials and destructive identifiers stay server-side."""

import re
from dataclasses import dataclass
from typing import Protocol
from uuid import uuid4


@dataclass(frozen=True)
class StoredImage:
    public_id: str
    secure_url: str
    width: int
    height: int
    format: str
    bytes: int


class MediaProvider(Protocol):
    def upload(self, content: bytes, folder: str) -> StoredImage: ...

    def destroy(self, public_id: str) -> None: ...


def media_folder(root: str, domain: str, slug: str) -> str:
    if domain not in {"projects", "properties"}:
        raise ValueError("Invalid media domain")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError("Invalid media slug")
    if not re.fullmatch(r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*", root):
        raise ValueError("Invalid media folder")
    return f"{root}/{domain}/{slug}"


class CloudinaryProvider:
    def __init__(self, cloud_name: str, api_key: str, api_secret: str):
        self.options = {
            "cloud_name": cloud_name,
            "api_key": api_key,
            "api_secret": api_secret,
            "secure": True,
        }

    def upload(self, content: bytes, folder: str) -> StoredImage:
        from io import BytesIO

        import cloudinary.uploader

        result = cloudinary.uploader.upload(
            BytesIO(content),
            public_id=f"{folder}/{uuid4().hex}",
            overwrite=False,
            resource_type="image",
            allowed_formats=["jpg", "png", "webp"],
            timeout=45,
            **self.options,
        )
        return StoredImage(**{key: result[key] for key in StoredImage.__dataclass_fields__})

    def destroy(self, public_id: str) -> None:
        import cloudinary.uploader

        result = cloudinary.uploader.destroy(
            public_id, resource_type="image", invalidate=True, timeout=30, **self.options
        )
        if result.get("result") not in {"ok", "not found"}:
            raise RuntimeError("Media removal was not confirmed")
