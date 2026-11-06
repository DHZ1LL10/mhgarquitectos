from collections.abc import Iterable
from typing import Literal, get_args

Permission = Literal[
    "dashboard.view",
    "clients.view",
    "clients.manage",
    "appointments.view",
    "appointments.manage",
    "kitchens.view",
    "properties.view",
    "properties.manage",
    "properties.publish",
]

PERMISSIONS: frozenset[str] = frozenset(get_args(Permission))
FULL_PERMISSIONS: tuple[str, ...] = tuple(get_args(Permission))
DEFAULT_STAFF_PERMISSIONS: tuple[str, ...] = (
    "dashboard.view",
    "clients.view",
    "appointments.view",
    "kitchens.view",
)

DEPENDENCIES: dict[str, frozenset[str]] = {
    "clients.manage": frozenset({"clients.view"}),
    "appointments.manage": frozenset({"appointments.view"}),
    "properties.manage": frozenset({"properties.view"}),
    "properties.publish": frozenset({"properties.view", "properties.manage"}),
}


def normalize_permissions(values: Iterable[str]) -> list[str]:
    selected = set(values)
    unknown = selected - PERMISSIONS
    if unknown:
        raise ValueError(f"Unknown permissions: {', '.join(sorted(unknown))}")
    for permission, required in DEPENDENCIES.items():
        if permission in selected and not required.issubset(selected):
            raise ValueError(f"{permission} requires {', '.join(sorted(required))}")
    return [permission for permission in FULL_PERMISSIONS if permission in selected]


def has_permission(role: str, permissions: Iterable[str], permission: str) -> bool:
    if permission not in PERMISSIONS:
        raise ValueError(f"Unknown permission: {permission}")
    return role == "owner" or permission in permissions
