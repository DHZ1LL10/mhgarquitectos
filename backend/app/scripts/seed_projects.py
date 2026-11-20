"""Explicit, additive import of the approved legacy portfolio. Never runs at startup."""

import json
from collections import Counter
from pathlib import Path

from sqlalchemy import select

from app.db import SessionLocal
from app.projects.models import Project, ProjectImage


def bootstrap(db):
    source = json.loads(
        (Path(__file__).parents[1] / "projects/legacy_catalog.json").read_text(encoding="utf-8")
    )
    if len(source) != 24 or sum(len(p["images"]) for p in source) != 381:
        raise ValueError("Unexpected legacy catalog counts")
    if Counter(p["category"] for p in source) != {
        "cocina-mobiliario": 20,
        "diseno-construccion": 4,
    }:
        raise ValueError("Unexpected legacy categories")
    if Counter(p["category"] for p in source if p["featured"]) != {
        "cocina-mobiliario": 9,
        "diseno-construccion": 4,
    }:
        raise ValueError("Unexpected legacy featured selection")
    paths = [image["src"] for project in source for image in project["images"]]
    if len(set(paths)) != 381 or len({p["slug"] for p in source}) != 24:
        raise ValueError("Duplicate legacy identifiers")
    for project in source:
        if sum(image["src"] == project["coverImage"]["src"] for image in project["images"]) != 1:
            raise ValueError("Invalid legacy cover")
        for image in project["images"]:
            if (
                not image["src"].startswith("/img/portfolio/")
                or ".." in image["src"]
                or "\\" in image["src"]
            ):
                raise ValueError("Invalid legacy image path")
    created = skipped = 0
    for project in source:
        if db.scalar(select(Project.id).where(Project.slug == project["slug"])):
            skipped += 1
            continue  # Never overwrite subsequent admin edits or galleries.
        item = Project(
            name=project["title"],
            slug=project["slug"],
            category="kitchen_furniture"
            if project["category"] == "cocina-mobiliario"
            else "design_construction",
            short_description=project["shortDescription"],
            description=project["description"],
            status="published",
            featured=project["featured"],
            featured_order=project["featuredOrder"],
        )
        db.add(item)
        db.flush()
        for order, image in enumerate(project["images"]):
            db.add(
                ProjectImage(
                    project_id=item.id,
                    provider="local",
                    secure_url=image["src"],
                    width=image["width"],
                    height=image["height"],
                    format="webp",
                    alt_text=image["alt"],
                    is_cover=image["src"] == project["coverImage"]["src"],
                    sort_order=order,
                )
            )
        created += 1
    db.commit()
    return {"created": created, "updated": 0, "skipped": skipped}


if __name__ == "__main__":
    with SessionLocal() as session:
        print(json.dumps(bootstrap(session)))
