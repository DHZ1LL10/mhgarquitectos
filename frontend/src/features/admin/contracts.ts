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
export const appointmentLabels: Record<AppointmentStatus, string> = { requested: "Solicitada", pending_confirmation: "Pendiente de confirmar", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada" };
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

export function leadWhatsAppUrl(lead: Pick<Lead, "name" | "phone" | "submission">): string | null {
  let digits = lead.phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "52" + digits;
  if (digits.length < 7 || digits.length > 15) return null;
  const folio = lead.submission?.folio ? ` sobre la solicitud ${lead.submission.folio}` : "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hola ${lead.name}, te contactamos de MHG Arquitectos${folio}.`)}`;
}
