from pydantic import AwareDatetime, Field, JsonValue, model_validator

from app.common import Coordinates, TimestampOutput


class KitchenCreate(Coordinates):
    current_situation: str = Field(min_length=1, max_length=200)
    interior_board: dict[str, JsonValue]
    exterior_fronts: dict[str, JsonValue]
    hardware: dict[str, JsonValue]
    countertop: dict[str, JsonValue]
    finish: dict[str, JsonValue] | None = None
    extras: list[dict[str, JsonValue]] = Field(default_factory=list, max_length=100)
    address: str = Field(min_length=1, max_length=1000)
    branch: str = Field(min_length=1, max_length=160)
    advisor: str | None = Field(default=None, max_length=160)
    requested_datetime: AwareDatetime | None = None
    notes: str | None = Field(default=None, max_length=10000)
    selection_version: int = Field(default=1, ge=1, le=10000)
    selections: dict[str, JsonValue] = Field(default_factory=dict)

    @model_validator(mode="after")
    def bounded_snapshot(self):
        import json

        # This is a customer snapshot, not trusted pricing or a file upload.
        for name in (
            "interior_board",
            "exterior_fronts",
            "hardware",
            "countertop",
            "finish",
            "extras",
            "selections",
        ):
            if len(json.dumps(getattr(self, name), allow_nan=False).encode("utf-8")) > 65536:
                raise ValueError(f"{name} exceeds 64 KiB")
        return self


class KitchenOutput(KitchenCreate, TimestampOutput):
    pass
