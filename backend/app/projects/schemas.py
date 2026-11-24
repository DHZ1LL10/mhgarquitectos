from typing import Literal
from uuid import UUID

from pydantic import Field, model_validator

from app.common import InputModel, OutputModel, TimestampOutput

Category = Literal["kitchen_furniture", "design_construction"]


class ProjectInput(InputModel):
    name: str = Field(min_length=1, max_length=200)
    category: Category
    short_description: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=20000)
    status: Literal["draft", "published"] = "draft"
    featured: bool = False
    featured_order: int | None = Field(default=None, ge=1, le=9)

    @model_validator(mode="after")
    def featured_position(self):
        if self.featured and self.featured_order is None:
            raise ValueError("Elige una posición entre 1 y 9 en esta categoría.")
        if not self.featured:
            self.featured_order = None
        return self


class ImageOutput(OutputModel):
    id: UUID
    provider: str
    secure_url: str
    width: int
    height: int
    alt_text: str
    is_cover: bool
    sort_order: int


class ProjectSummary(TimestampOutput):
    name: str
    slug: str
    category: Category
    short_description: str
    status: str
    featured: bool
    featured_order: int | None
    cover_image: ImageOutput | None
    image_count: int


class ProjectDetail(ProjectSummary):
    description: str
    images: list[ImageOutput]
