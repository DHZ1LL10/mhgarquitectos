export type Role = "admin" | "staff";
export type User = { id: string; email: string; full_name: string; role: Role; is_active: boolean; last_login_at: string | null };
export type ImageInput = { url: string; alt: string; width: number; height: number; object_key: string | null };
export type PropertyInput = {
  slug: string; title: string; description: string; status: "draft" | "published" | "archived";
  operation: "sale" | "rent"; property_type: "house" | "apartment" | "land"; price: string; currency: string;
  location: { city: string; state: string; neighborhood: string };
  features: { area_m2: number; bedrooms: number; bathrooms: number; parking_spaces: number };
  latitude: number | null; longitude: number | null; images: ImageInput[];
};
export type Property = PropertyInput & { id: string; created_at: string; updated_at: string };
export type Lead = { id: string; name: string; phone: string; email: string | null; source: string; status: string; message: string | null; property_id: string | null; kitchen_configuration_id: string | null; appointment_id: string | null; created_at: string };
export type AppointmentStatus = "requested" | "pending_confirmation" | "confirmed" | "completed" | "cancelled";
export type Appointment = { id: string; requested_datetime: string; confirmed_datetime: string | null; branch: string; address: string; latitude: number | null; longitude: number | null; status: AppointmentStatus; notes: string | null; leads: Lead[]; created_at: string; updated_at: string };
export type Kitchen = { id: string; current_situation: string; interior_board: Record<string, unknown>; exterior_fronts: Record<string, unknown>; hardware: Record<string, unknown>; countertop: Record<string, unknown>; finish: Record<string, unknown> | null; extras: Record<string, unknown>[]; selections: Record<string, unknown>; selection_version: number; address: string; latitude: number | null; longitude: number | null; branch: string; advisor: string | null; requested_datetime: string | null; notes: string | null; leads: Lead[]; appointments: Appointment[]; created_at: string; updated_at: string };
export type Dashboard = { properties: number | null; leads: number; appointments: number; kitchen_configurations: number };
