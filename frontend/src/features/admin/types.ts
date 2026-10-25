export type Role = "admin" | "staff";
export type LeadStatus = "new" | "contacted" | "qualified" | "closed";
export type User = { id: string; email: string; full_name: string; role: Role; is_active: boolean; last_login_at: string | null };
export type ImageInput = { url: string; alt: string; width: number; height: number; object_key: string | null };
export type PropertyInput = {
  slug: string; title: string; description: string; status: "draft" | "published" | "archived";
  operation: "sale" | "rent"; property_type: "house" | "apartment" | "land"; price: string; currency: string;
  location: { city: string; state: string; neighborhood: string };
  features: {
    area_m2: number; construction_area_m2?: number; land_area_m2?: number;
    garden_area_m2?: number; bedrooms: number; bathrooms: number;
    half_bathrooms?: number; parking_spaces: number | null; construction_progress?: number;
    construction_status?: string; distribution?: string[]; amenities?: string[];
    list_price?: number; bonus?: number; commercial_label?: string;
  };
  latitude: number | null; longitude: number | null; images: ImageInput[];
};
export type Property = PropertyInput & { id: string; created_at: string; updated_at: string };
export type SubmissionReference = { id: string; folio: string; configuration_id: string; appointment_id: string; lead_id: string; status: string; notification_status: "pending" | "sent" | "failed" | "not_configured" };
export type AppointmentStatus = "requested" | "pending_confirmation" | "confirmed" | "completed" | "cancelled";
export type AppointmentSummary = { id: string; requested_datetime: string; confirmed_datetime: string | null; branch: string; address: string; latitude: number | null; longitude: number | null; status: AppointmentStatus; notes: string | null; created_at: string; updated_at: string };
export type Lead = { id: string; name: string; phone: string; email: string | null; source: string; status: LeadStatus; message: string | null; property_id: string | null; kitchen_configuration_id: string | null; appointment_id: string | null; submission: SubmissionReference | null; appointment: AppointmentSummary | null; address: string | null; latitude: number | null; longitude: number | null; created_at: string; updated_at: string };
export type Appointment = AppointmentSummary & { leads: Lead[]; submission: SubmissionReference | null };
export type Kitchen = { id: string; current_situation: string; interior_board: Record<string, unknown>; exterior_fronts: Record<string, unknown>; hardware: Record<string, unknown>; countertop: Record<string, unknown>; finish: Record<string, unknown> | null; extras: Record<string, unknown>[]; selections: Record<string, unknown>; selection_version: number; address: string; latitude: number | null; longitude: number | null; branch: string; advisor: string | null; requested_datetime: string | null; notes: string | null; leads: Lead[]; appointments: Appointment[]; submission: SubmissionReference | null; created_at: string; updated_at: string };
export type Dashboard = { properties: number | null; leads: number; appointments: number; kitchen_configurations: number; new_leads: number; requested_appointments: number; pending_confirmation_appointments: number; confirmed_appointments: number; upcoming_appointments: number; completed_appointments: number; published_properties: number | null };
