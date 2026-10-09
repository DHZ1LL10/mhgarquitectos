import json
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from html import escape
from typing import Protocol

from app.config import Settings


@dataclass(frozen=True)
class KitchenEmailData:
    folio: str
    submission_id: str
    name: str
    phone: str
    email: str | None
    requested_datetime: str
    branch: str
    address: str
    latitude: float | None
    longitude: float | None
    current_situation: str
    interior_board: dict
    exterior_fronts: dict
    hardware: dict
    countertop: dict
    finish: dict | None
    extras: list


class EmailNotifier(Protocol):
    @property
    def configured(self) -> bool: ...

    def send_kitchen_submission(self, data: KitchenEmailData) -> None: ...


def map_url(latitude: float | None, longitude: float | None) -> str | None:
    if latitude is None or longitude is None:
        return None
    return (
        "https://www.openstreetmap.org/"
        f"?mlat={latitude:.6f}&mlon={longitude:.6f}#map=18/{latitude:.6f}/{longitude:.6f}"
    )


def _json(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)


def build_kitchen_email(data: KitchenEmailData, sender: str, recipient: str) -> EmailMessage:
    location = map_url(data.latitude, data.longitude)
    coordinates = (
        f"{data.latitude:.6f}, {data.longitude:.6f}"
        if data.latitude is not None and data.longitude is not None
        else "No proporcionadas"
    )
    fields = [
        ("Folio", data.folio),
        ("Referencia", data.submission_id),
        ("Cliente", data.name),
        ("Teléfono", data.phone),
        ("Email", data.email or "No proporcionado"),
        ("Fecha solicitada", data.requested_datetime),
        ("Sucursal", data.branch),
        ("Dirección", data.address),
        ("Coordenadas", coordinates),
        ("Mapa", location or "Sin ubicación seleccionada"),
        ("Situación actual", data.current_situation),
        ("Tablero interior", _json(data.interior_board)),
        ("Frentes exteriores", _json(data.exterior_fronts)),
        ("Herrajes", _json(data.hardware)),
        ("Cubierta", _json(data.countertop)),
        ("Variante / acabado", _json(data.finish)),
        ("Extras", _json(data.extras)),
    ]
    message = EmailMessage()
    message["Subject"] = f"Nueva solicitud de cocina {data.folio}"
    message["From"] = sender
    message["To"] = recipient
    message.set_content("Nueva solicitud de cocina\n\n" + "\n".join(f"{k}: {v}" for k, v in fields))
    rows = "".join(
        f"<tr><th style='text-align:left;vertical-align:top;padding:6px'>{escape(key)}</th>"
        f"<td style='padding:6px;white-space:pre-wrap'>{escape(value)}</td></tr>"
        for key, value in fields
    )
    message.add_alternative(
        "<!doctype html><html><body><h1>Nueva solicitud de cocina</h1>"
        f"<table>{rows}</table></body></html>",
        subtype="html",
    )
    return message


class SmtpEmailNotifier:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.smtp_host and self.settings.smtp_from and self.settings.notification_email
        )

    def send_kitchen_submission(self, data: KitchenEmailData) -> None:
        if not self.configured:
            raise RuntimeError("SMTP is not configured")
        message = build_kitchen_email(
            data, str(self.settings.smtp_from), str(self.settings.notification_email)
        )
        with smtplib.SMTP(
            self.settings.smtp_host, self.settings.smtp_port, timeout=10
        ) as connection:
            connection.ehlo()
            if self.settings.smtp_use_tls:
                connection.starttls(context=ssl.create_default_context())
                connection.ehlo()
            if self.settings.smtp_user:
                connection.login(
                    self.settings.smtp_user,
                    self.settings.smtp_password.get_secret_value(),
                )
            connection.send_message(message)


def get_email_notifier(settings: Settings) -> EmailNotifier:
    return SmtpEmailNotifier(settings)
