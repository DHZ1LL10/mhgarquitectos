import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime
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
    advisor: str
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
    received_at: str | None = None
    notes: str | None = None


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


LABELS = {
    "sin-cocina": "Sin cocina instalada",
    "barra-concreto": "Base de concreto existente",
    "remodelacion": "Remodelación",
    "blanco-frosty": "Blanco Frosty 15 mm",
    "gris-oxford": "Gris Oxford 15 mm",
    "economica": "Línea económica",
    "arauco": "Arauco",
    "decorlux": "Decorlux",
    "transformad": "Transformad",
    "modulos_especiales": "Módulos especiales",
}


def _label(value: object) -> str:
    text = str(value).strip()
    return LABELS.get(text, text.replace("_", " ").replace("-", " ").capitalize())


def _human(value: object) -> str:
    if value is None or value == "":
        return "No seleccionado"
    if isinstance(value, bool):
        return "Sí" if value else "No"
    if isinstance(value, list):
        rendered = [_human(item) for item in value if item not in (None, "", False)]
        return ", ".join(rendered) if rendered else "Ninguno"
    if isinstance(value, dict):
        if value.get("not_applicable") is True:
            return "No aplica"
        for key in ("label", "nombre", "name", "material", "selection"):
            if value.get(key) not in (None, ""):
                return _human(value[key])
        if "selections" in value:
            return _human(value["selections"])
        if value.get("id") not in (None, ""):
            return _label(value["id"])
        parts = [
            f"{_label(key)}: {_human(item)}"
            for key, item in value.items()
            if key not in {"completed", "reference_price", "category"}
            and item not in (None, "", False)
        ]
        return "; ".join(parts) if parts else "No seleccionado"
    return _label(value)


def _date_parts(value: str | None) -> tuple[str, str]:
    if not value:
        return ("No disponible", "No disponible")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return (value, "No disponible")
    return (parsed.strftime("%d/%m/%Y"), parsed.strftime("%H:%M"))


def _configuration_rows(data: KitchenEmailData) -> list[tuple[str, str]]:
    hardware = data.hardware or {}
    return [
        ("Situación actual", _human(data.current_situation)),
        ("Tablero interior", _human(data.interior_board)),
        ("Frentes exteriores", _human(data.exterior_fronts)),
        ("Bisagras", _human(hardware.get("bisagras"))),
        ("Correderas", _human(hardware.get("correderas"))),
        ("Cajones", _human(hardware.get("cajones"))),
        ("Basurero", _human(hardware.get("basureros"))),
        ("Especiero", _human(hardware.get("especiero"))),
        ("Módulos especiales", _human(hardware.get("modulos_especiales"))),
        ("Cubierta", _human(data.countertop)),
        ("Variante", _human(data.finish)),
        ("Extras", _human(data.extras)),
    ]


def _html_rows(rows: list[tuple[str, str]]) -> str:
    return "".join(
        "<tr>"
        f'<td style="padding:8px 12px;color:#65716a;width:38%;vertical-align:top">{escape(key)}</td>'
        f'<td style="padding:8px 12px;color:#172019;font-weight:600;vertical-align:top">{escape(value)}</td>'
        "</tr>"
        for key, value in rows
    )


def build_kitchen_email(data: KitchenEmailData, sender: str, recipient: str) -> EmailMessage:
    location = map_url(data.latitude, data.longitude)
    requested_date, requested_time = _date_parts(data.requested_datetime)
    received_date, received_time = _date_parts(data.received_at)
    client_rows = [
        ("Nombre", data.name),
        ("Teléfono", data.phone),
        ("Email", data.email or "No proporcionado"),
    ]
    appointment_rows = [
        ("Fecha", requested_date),
        ("Hora", requested_time),
        ("Sucursal", data.branch),
        ("Atendido por", data.advisor),
    ]
    configuration_rows = _configuration_rows(data)
    plain_sections = [
        "MHG ARQUITECTOS",
        "Nueva solicitud de cocina",
        "",
        f"Folio: {data.folio}",
        (
            f"Fecha de recepción: {received_date} {received_time}"
            if data.received_at
            else "Fecha de recepción: No disponible"
        ),
        "",
        "DATOS DEL CLIENTE",
        *(f"{key}: {value}" for key, value in client_rows),
        "",
        "CITA / LEVANTAMIENTO",
        *(f"{key}: {value}" for key, value in appointment_rows),
        "",
        "UBICACIÓN",
        f"Dirección: {data.address}",
        *([f"Abrir ubicación: {location}"] if location else ["Ubicación: Sin pin seleccionado"]),
        "",
        "CONFIGURACIÓN",
        *(f"{key}: {value}" for key, value in configuration_rows),
        "",
        "OBSERVACIONES",
        data.notes or "Sin observaciones",
        "",
        "MHG Arquitectos",
    ]
    location_button = (
        f'<a href="{escape(location, quote=True)}" style="display:inline-block;padding:11px 18px;background:#1a4f2e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">Abrir ubicación</a>'
        if location
        else '<p style="margin:10px 0 0;color:#65716a">Sin pin seleccionado</p>'
    )
    message = EmailMessage()
    message["Subject"] = f"Nueva solicitud de cocina {data.folio}"
    message["From"] = sender
    message["To"] = recipient
    message.set_content("\n".join(plain_sections))
    message.add_alternative(
        '<!doctype html><html><body style="margin:0;background:#f3f6f4;font-family:Arial,sans-serif;color:#172019">'
        '<div style="display:none;max-height:0;overflow:hidden">Nueva solicitud de cocina recibida.</div>'
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4"><tr><td align="center" style="padding:24px 12px">'
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:12px;overflow:hidden">'
        '<tr><td style="padding:24px 28px;background:#173f29;color:#ffffff"><div style="font-size:13px;letter-spacing:2px">MHG ARQUITECTOS</div><h1 style="margin:8px 0 0;font-size:26px">Nueva solicitud de cocina</h1></td></tr>'
        f'<tr><td style="padding:22px 28px"><div style="padding:18px;background:#eef4f0;border-left:4px solid #b49450"><div style="font-size:12px;color:#65716a;text-transform:uppercase">Folio</div><div style="font-size:22px;font-weight:700;color:#1a4f2e">{escape(data.folio)}</div><div style="margin-top:6px;color:#65716a">Recibida: {escape(received_date)}{(" · " + escape(received_time)) if data.received_at else ""}</div></div></td></tr>'
        '<tr><td style="padding:0 28px 20px"><h2 style="font-size:16px;color:#1a4f2e">Datos del cliente</h2><table role="presentation" width="100%">'
        + _html_rows(client_rows)
        + '</table><h2 style="font-size:16px;color:#1a4f2e;margin-top:24px">Cita / levantamiento</h2><table role="presentation" width="100%">'
        + _html_rows(appointment_rows)
        + f'</table><h2 style="font-size:16px;color:#1a4f2e;margin-top:24px">Ubicación</h2><p style="line-height:1.6">{escape(data.address)}</p>{location_button}'
        + '<h2 style="font-size:16px;color:#1a4f2e;margin-top:24px">Configuración</h2><table role="presentation" width="100%">'
        + _html_rows(configuration_rows)
        + f'</table><h2 style="font-size:16px;color:#1a4f2e;margin-top:24px">Observaciones</h2><p style="line-height:1.6;white-space:pre-wrap">{escape(data.notes or "Sin observaciones")}</p></td></tr>'
        '<tr><td style="padding:18px 28px;background:#173f29;color:#ffffff;text-align:center;font-size:13px">MHG Arquitectos</td></tr>'
        "</table></td></tr></table></body></html>",
        subtype="html",
    )
    return message


class SmtpEmailNotifier:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.smtp_host
            and self.settings.smtp_from
            and self.settings.notification_recipient
        )

    def send_kitchen_submission(self, data: KitchenEmailData) -> None:
        if not self.configured:
            raise RuntimeError("SMTP is not configured")
        message = build_kitchen_email(
            data, str(self.settings.smtp_from), str(self.settings.notification_recipient)
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
