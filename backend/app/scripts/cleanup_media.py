"""Retry committed cloud deletions. Local files are never deleted."""

from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.media.models import MediaCleanup
from app.media.router import provider
from app.projects.models import ProjectImage
from app.properties.models import PropertyImage


def cleanup(db, storage, root):
    removed = 0
    for task in db.scalars(select(MediaCleanup).with_for_update(skip_locked=True)).all():
        # Never delete objects outside the configured environment or still referenced.
        if not task.public_id.startswith(root + "/"):
            continue
        if db.scalar(
            select(ProjectImage.id).where(ProjectImage.public_id == task.public_id)
        ) or db.scalar(select(PropertyImage.id).where(PropertyImage.public_id == task.public_id)):
            continue
        storage.destroy(task.public_id)
        db.delete(task)
        removed += 1
    db.commit()
    return removed


def main():
    settings = get_settings()
    try:
        with SessionLocal() as db:
            count = cleanup(db, provider(settings), settings.cloudinary_folder)
        print(f"removed={count}")
    except Exception:  # noqa: BLE001 - CLI must not expose provider exceptions or credentials
        # Do not print SDK exception text (it may contain credentials).
        raise SystemExit("Media cleanup failed; queued items are retained for retry") from None


if __name__ == "__main__":
    main()
