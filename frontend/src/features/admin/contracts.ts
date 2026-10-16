import type { AppointmentStatus, Lead, PropertyInput, User } from "./types.ts";

export function parseUser(value: unknown): User {
  if (!value || typeof value !== "object") throw new Error("Respuesta de usuario inválida");
  const user = value as User;
  if (typeof user.id !== "string" || typeof user.email !== "string" || typeof user.full_name !== "string" || !["admin", "staff"].includes(user.role) || user.is_active !== true) throw new Error("Usuario administrativo inválido");
  return user;
}
export function emptyProperty(): PropertyInput {
  return { slug: "", title: "", description: "", status: "draft", operation: "sale", property_type: "house", price: "0.00", currency: "MXN", location: { city: "", state: "", neighborhood: "" }, features: { area_m2: 0, bedrooms: 0, bathrooms: 0, parking_spaces: 0 }, latitude: null, longitude: null, images: [] };
}
export function propertyInput(value: PropertyInput): PropertyInput {
  // Whitelist write fields: never send database IDs, timestamps or image positions.
  return { slug: value.slug.trim(), title: value.title.trim(), description: value.description.trim(), status: value.status, operation: value.operation, property_type: value.property_type, price: String(value.price), currency: value.currency, location: { ...value.location }, features: { ...value.features }, latitude: value.latitude, longitude: value.longitude, images: value.images.map(({ url, alt, width, height, object_key }) => ({ url, alt, width, height, object_key })) };
}
export const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["pending_confirmation", "confirmed", "cancelled"], pending_confirmation: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled"], completed: [], cancelled: [],
};
export const appointmentLabels: Record<AppointmentStatus, string> = { requested: "Nueva solicitud", pending_confirmation: "Por confirmar", confirmed: "Confirmada", completed: "Finalizada", cancelled: "Cancelada" };
export const leadStatusLabels: Record<string, string> = { new: "Nueva", contacted: "Contactado", qualified: "Calificado", closed: "Cerrado" };
export const leadSourceLabels: Record<string, string> = { kitchen_customizer: "Configurador de cocinas", kitchen: "Solicitud de cocina", property: "Catálogo de propiedades", website: "Sitio web" };
export function localDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function confirmedDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Fecha de confirmación inválida");
  return date.toISOString();
}

export function openStreetMapUrl(latitude: number | null, longitude: number | null): string | null {
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `https://www.openstreetmap.org/?mlat=${latitude.toFixed(6)}&mlon=${longitude.toFixed(6)}#map=18/${latitude.toFixed(6)}/${longitude.toFixed(6)}`;
}

export function leadWhatsAppUrl(lead: Pick<Lead, "name" | "phone" | "submission" | "appointment">): string | null {
  let digits = lead.phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "52" + digits;
  if (digits.length < 7 || digits.length > 15) return null;
  const appointment = lead.appointment;
  const requested = appointment ? new Date(appointment.requested_datetime) : null;
  const confirmed = appointment?.confirmed_datetime ? new Date(appointment.confirmed_datetime) : null;
  const selected = confirmed || requested;
  const stateText = appointment?.status === "confirmed" ? "Tu cita está confirmada. Estos son los datos:" : "Queremos confirmar contigo la visita de levantamiento. ¿Este horario te funciona?";
  const lines = [
    `Hola ${lead.name} 👋`, "", "Te contactamos de MHG Arquitectos por tu solicitud de cocina.", "",
    ...(lead.submission?.folio ? [`📋 Folio: ${lead.submission.folio}`] : []),
    ...(selected ? [`📅 Fecha: ${selected.toLocaleDateString("es-MX")}`, `🕐 Hora: ${selected.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`] : []),
    ...(appointment?.branch ? [`📍 Sucursal: ${appointment.branch}`] : []),
    ...(appointment?.address ? [`🏠 Dirección: ${appointment.address}`] : []),
    ...(appointment ? (() => { const map = openStreetMapUrl(appointment.latitude, appointment.longitude); return map ? [`🗺️ Ubicación: ${map}`] : []; })() : []),
    "", stateText, "", "MHG Arquitectos",
  ];
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`;
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
