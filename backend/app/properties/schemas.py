from decimal import Decimal
from uuid import UUID

from pydantic import Field, field_validator

from app.common import Coordinates, InputModel, OutputModel, TimestampOutput
from app.properties.models import Operation, PropertyStatus, PropertyType


class Location(InputModel):
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    neighborhood: str = Field(min_length=1, max_length=160)


class Features(InputModel):
    area_m2: float = Field(ge=0, allow_inf_nan=False)
    bedrooms: int = Field(ge=0, le=100)
    bathrooms: int = Field(ge=0, le=100)
    parking_spaces: int = Field(ge=0, le=100)


class ImageInput(InputModel):
    url: str = Field(min_length=1, max_length=2048)
    object_key: str | None = Field(default=None, max_length=1024)
    alt: str = Field(min_length=1, max_length=250)
    width: int = Field(gt=0, le=30000)
    height: int = Field(gt=0, le=30000)

    @field_validator("url")
    @classmethod
    def safe_url(cls, value: str) -> str:
        from urllib.parse import urlsplit

        parsed = urlsplit(value)
        if value.startswith("/") and not value.startswith("//") and "\\" not in value:
            return value
        if (
            parsed.scheme == "https"
            and parsed.netloc
            and not parsed.username
            and not parsed.password
        ):
            return value
        raise ValueError("Use a project-relative path or an HTTPS image URL")


class ImageOutput(ImageInput, OutputModel):
    id: UUID
    position: int


class PropertyCreate(Coordinates):
    slug: str = Field(min_length=1, max_length=160, pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")
    status: PropertyStatus = PropertyStatus.draft
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=20000)
    operation: Operation
    property_type: PropertyType
    price: Decimal = Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)
    currency: str = Field(default="MXN", pattern=r"^[A-Z]{3}$")
    location: Location
    features: Features
    images: list[ImageInput] = Field(default_factory=list, max_length=50)


class PropertyPatch(InputModel):
    # Validate the merged object with PropertyCreate, keeping omitted values unchanged.
    slug: str | None = None
    status: PropertyStatus | None = None
    title: str | None = None
    description: str | None = None
    operation: Operation | None = None
    property_type: PropertyType | None = None
    price: Decimal | None = None
    currency: str | None = None
    location: Location | None = None
    features: Features | None = None
    latitude: float | None = None
    longitude: float | None = None
    images: list[ImageInput] | None = None


class PropertyOutput(PropertyCreate, TimestampOutput):
    images: list[ImageOutput]
