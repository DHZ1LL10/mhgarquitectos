import type { AppointmentStatus, Lead, LeadStatus, Permission, PropertyInput, User } from "./types.ts";
import { BUSINESS_TIME_ZONE, businessDateTimeInputToIso, businessDateTimeInputValue } from "./shared/format.ts";

const permissions: Permission[] = ["dashboard.view", "clients.view", "clients.manage", "appointments.view", "appointments.manage", "kitchens.view", "properties.view", "properties.manage", "properties.publish"];

export function parseUser(value: unknown): User {
  if (!value || typeof value !== "object") throw new Error("Respuesta de usuario inválida");
  const user = value as User;
  if (typeof user.id !== "string" || typeof user.email !== "string" || typeof user.full_name !== "string" || !["owner", "staff"].includes(user.role) || user.is_active !== true || !Array.isArray(user.permissions) || user.permissions.some(item => !permissions.includes(item)) || typeof user.must_change_password !== "boolean") throw new Error("Usuario administrativo inválido");
  return user;
}
export function emptyProperty(): PropertyInput {
  return { slug: "", title: "", description: "", status: "draft", operation: "sale", property_type: "house", price: "0.00", currency: "MXN", location: { city: "", state: "", neighborhood: "" }, features: { area_m2: 0, bedrooms: 0, bathrooms: 0, parking_spaces: null }, latitude: null, longitude: null, images: [] };
}
export function propertyInput(value: PropertyInput): PropertyInput {
  // Whitelist write fields: never send database IDs, timestamps or image positions.
  return { slug: value.slug.trim(), title: value.title.trim(), description: value.description.trim(), status: value.status, operation: value.operation, property_type: value.property_type, price: String(value.price), currency: value.currency, location: { ...value.location }, features: { ...value.features }, latitude: value.latitude, longitude: value.longitude, images: value.images.map(({ url, alt, width, height, object_key }) => ({ url, alt, width, height, object_key })) };
}
export const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["pending_confirmation", "confirmed", "cancelled"], pending_confirmation: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled"], completed: [], cancelled: [],
};
export const appointmentLabels: Record<AppointmentStatus, string> = { requested: "Nueva solicitud", pending_confirmation: "Por confirmar", confirmed: "Confirmada", completed: "Finalizada", cancelled: "Cancelada" };
export const leadStatusLabels: Record<LeadStatus, string> = { new: "Nuevo", contacted: "Contactado", qualified: "En seguimiento", closed: "Cerrado" };
export const leadSourceLabels: Record<string, string> = { kitchen_customizer: "Configurador de cocinas", kitchen: "Solicitud de cocina", property: "Catálogo de propiedades", website: "Sitio web" };
export function localDateTime(iso: string | null): string {
  return businessDateTimeInputValue(iso);
}
export function confirmedDateTime(value: string): string | null {
  return businessDateTimeInputToIso(value);
}

export function openStreetMapUrl(latitude: number | null, longitude: number | null): string | null {
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `https://www.openstreetmap.org/?mlat=${latitude.toFixed(6)}&mlon=${longitude.toFixed(6)}#map=18/${latitude.toFixed(6)}/${longitude.toFixed(6)}`;
}

export function phoneDigits(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (/^0{6}/.test(digits)) return null;
  if (digits.length === 10) digits = "52" + digits;
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

function appointmentMessageLines(
  lead: Pick<Lead, "name" | "submission" | "appointment">,
  mode: "pending" | "confirmed",
): string[] {
  const appointment = lead.appointment;
  const requested = appointment ? new Date(appointment.requested_datetime) : null;
  const confirmed = appointment?.confirmed_datetime ? new Date(appointment.confirmed_datetime) : null;
  const selected = mode === "confirmed" ? confirmed || requested : requested;
  const detailLines = [
    ...(lead.submission?.folio ? [`📋 Folio: ${lead.submission.folio}`] : []),
    ...(selected ? [`📅 ${mode === "pending" ? "Fecha propuesta" : "Fecha"}: ${selected.toLocaleDateString("es-MX", { dateStyle: "long", timeZone: BUSINESS_TIME_ZONE })}`, `🕐 Hora: ${selected.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: BUSINESS_TIME_ZONE })}`] : []),
    ...(appointment?.branch ? [`📍 Sucursal: ${appointment.branch}`] : []),
    ...(appointment?.address ? [`🏠 Dirección: ${appointment.address}`] : []),
    ...(appointment ? (() => { const map = openStreetMapUrl(appointment.latitude, appointment.longitude); return map ? [`🗺️ Ubicación: ${map}`] : []; })() : []),
  ];
  return mode === "confirmed"
    ? [
      `Hola, ${lead.name} 👋`, "", "Tu visita con MHG Arquitectos quedó confirmada.", "",
      ...detailLines, "", "Nos vemos en el horario acordado.",
      "Si necesitas hacer algún cambio, puedes responder a este mensaje.", "", "MHG Arquitectos",
    ]
    : [
      `Hola, ${lead.name} 👋`, "", "Te contactamos de MHG Arquitectos por tu solicitud de cocina.", "",
      ...detailLines, "", "Queremos confirmar contigo la visita de levantamiento.",
      "¿Te funciona este horario?", "",
      "Si necesitas cambiar la fecha u hora, indícanos qué horario te acomoda mejor.", "", "MHG Arquitectos",
    ];
}

export function appointmentWhatsAppMessage(
  lead: Pick<Lead, "name" | "submission" | "appointment">,
  mode: "pending" | "confirmed",
): string {
  return appointmentMessageLines(lead, mode).join("\n");
}

export function appointmentWhatsAppUrl(
  lead: Pick<Lead, "name" | "phone" | "submission" | "appointment">,
  mode: "pending" | "confirmed",
): string | null {
  const digits = phoneDigits(lead.phone);
  if (!digits) return null;
  const message = appointmentWhatsAppMessage(lead, mode);
  if (message.includes("�")) throw new Error("El mensaje contiene caracteres Unicode inválidos");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function leadWhatsAppUrl(lead: Pick<Lead, "name" | "phone" | "submission" | "appointment">): string | null {
  const mode = lead.appointment?.status === "confirmed" || lead.appointment?.status === "completed" ? "confirmed" : "pending";
  return appointmentWhatsAppUrl(lead, mode);
}

export function phoneUrl(phone: string): string | null {
  const digits = phoneDigits(phone);
  return digits ? `tel:+${digits}` : null;
}

export function emailUrl(email: string | null): string | null {
  return email ? `mailto:${email}` : null;
}

export function humanSelection(value: unknown): string {
  if (value == null || value === "") return "No seleccionado";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.map(humanSelection).join(", ") : "Ninguno";
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    if (item.not_applicable === true) return "No aplica";
    for (const key of ["label", "nombre", "name", "material", "selection"]) if (item[key]) return humanSelection(item[key]);
    if ("selections" in item) return humanSelection(item.selections);
    if (item.id) return humanLabel(String(item.id));
    const parts = Object.entries(item).filter(([key, entry]) => !["completed", "reference_price", "category"].includes(key) && entry != null && entry !== false).map(([key, entry]) => `${humanLabel(key)}: ${humanSelection(entry)}`);
    return parts.length ? parts.join(" · ") : "No seleccionado";
  }
  return humanLabel(String(value));
}

export function humanLabel(value: string): string {
  const known: Record<string, string> = { "sin-cocina": "Sin cocina instalada", "barra-concreto": "Base de concreto existente", remodelacion: "Remodelación", "blanco-frosty": "Blanco Frosty 15 mm", "gris-oxford": "Gris Oxford 15 mm", modulos_especiales: "Módulos especiales" };
  return known[value] || value.replaceAll("_", " ").replaceAll("-", " ").replace(/^./, character => character.toUpperCase());
}
