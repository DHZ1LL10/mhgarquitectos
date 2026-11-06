import type { Appointment, AppointmentStatus, Lead } from "../types.ts";
import { addBusinessCalendarDays, businessCalendarDate, businessDateKey, effectiveAppointmentDate, isToday, startOfWeek } from "./format.ts";

export type TemporalState = "overdue" | "today" | "upcoming" | "completed" | "cancelled" | "past";

export const temporalLabels: Record<TemporalState, string> = {
  overdue: "Vencida",
  today: "Hoy",
  upcoming: "Próxima",
  completed: "Finalizada",
  cancelled: "Cancelada",
  past: "Pendiente de cerrar",
};

export function classifyAppointmentTemporal(
  item: Pick<Appointment, "status" | "requested_datetime" | "confirmed_datetime">,
  now = new Date(),
): TemporalState {
  if (item.status === "completed") return "completed";
  if (item.status === "cancelled") return "cancelled";
  const date = effectiveAppointmentDate(item);
  if (["requested", "pending_confirmation"].includes(item.status) && date < now) return "overdue";
  if (isToday(date, now)) return "today";
  if (date > now) return "upcoming";
  return "past";
}

export function todayAppointmentCue(
  item: Pick<Appointment, "status" | "requested_datetime" | "confirmed_datetime">,
  now = new Date(),
): string | null {
  const date = effectiveAppointmentDate(item);
  if (!isToday(date, now) || date >= now) return null;
  if (["requested", "pending_confirmation"].includes(item.status)) return "Horario vencido · requiere seguimiento";
  if (item.status === "confirmed") return "Pendiente de cerrar";
  return null;
}

export type AttentionItem = {
  key: string;
  priority: number;
  title: string;
  detail: string;
  href: string;
  label: string;
  at: string;
};

export function buildDashboardAttention(
  leads: Pick<Lead, "id" | "name" | "status" | "created_at">[],
  appointments: Pick<Appointment, "id" | "status" | "requested_datetime" | "confirmed_datetime" | "leads">[],
  now = new Date(),
): AttentionItem[] {
  const appointmentItems = appointments
    .filter(item => ["requested", "pending_confirmation"].includes(item.status))
    .map(item => {
      const at = effectiveAppointmentDate(item).toISOString();
      const temporal = classifyAppointmentTemporal(item, now);
      const priority = temporal === "overdue" ? 0 : temporal === "today" ? 1 : 3;
      return {
        key: `appointment:${item.id}`,
        priority,
        title: item.leads[0]?.name || "Sin cliente asociado",
        detail: temporal === "overdue" ? "Cita vencida sin resolver" : temporal === "today" ? "Cita de hoy por confirmar" : "Cita futura por confirmar",
        href: `/admin/citas/${item.id}`,
        label: priority === 0 ? "Vencida" : priority === 1 ? "Hoy" : "Programada",
        at,
      };
    });
  const leadItems = leads.filter(lead => lead.status === "new").map(lead => ({
    key: `lead:${lead.id}`,
    priority: 2,
    title: lead.name,
    detail: "Solicitud nueva sin seguimiento",
    href: `/admin/clientes/${lead.id}`,
    label: "Nueva",
    at: lead.created_at,
  }));
  return [...appointmentItems, ...leadItems]
    .sort((a, b) => a.priority - b.priority || new Date(a.at).getTime() - new Date(b.at).getTime());
}

export type ClientNextAction = { title: string; detail: string; href: string | null; actionLabel: string };

export function deriveClientNextAction(
  lead: Pick<Lead, "id" | "status" | "appointment">,
  now = new Date(),
): ClientNextAction {
  const appointment = lead.appointment;
  if (appointment) {
    const temporal = classifyAppointmentTemporal(appointment, now);
    if (temporal === "overdue") return { title: "Retomar cita vencida", detail: "El horario propuesto ya pasó y sigue sin resolverse.", href: `/admin/citas/${appointment.id}`, actionLabel: "Abrir cita" };
    if (["requested", "pending_confirmation"].includes(appointment.status)) return { title: "Confirmar horario", detail: "La cita está pendiente de confirmación con el cliente.", href: `/admin/citas/${appointment.id}`, actionLabel: "Revisar cita" };
    if (appointment.status === "confirmed" && effectiveAppointmentDate(appointment) < now) return { title: "Cerrar visita", detail: "La cita confirmada ya pasó y falta registrar el resultado.", href: `/admin/citas/${appointment.id}`, actionLabel: "Cerrar cita" };
    if (appointment.status === "confirmed") return { title: "Preparar visita", detail: "La cita está confirmada; revisa el proyecto antes del encuentro.", href: `/admin/citas/${appointment.id}`, actionLabel: "Ver cita" };
  }
  if (lead.status === "new") return { title: "Contactar al cliente", detail: "La solicitud todavía no tiene seguimiento comercial.", href: null, actionLabel: "Usar contacto" };
  if (lead.status === "closed") return { title: "Sin acción pendiente", detail: "El seguimiento comercial está cerrado.", href: null, actionLabel: "Cerrado" };
  return { title: "Continuar seguimiento", detail: "Revisa el último contacto y define el siguiente paso.", href: null, actionLabel: "Usar contacto" };
}

export function compactIdentifier(value: string | null | undefined, maxLength = 18): { display: string; full: string; truncated: boolean } {
  if (!value) return { display: "—", full: "", truncated: false };
  if (value.length <= maxLength || /^COC-\d+$/.test(value)) return { display: value, full: value, truncated: false };
  const edge = Math.max(4, Math.floor((maxLength - 1) / 2));
  return { display: `${value.slice(0, edge)}…${value.slice(-edge)}`, full: value, truncated: true };
}

export function parseWeekStart(value: string | null, fallback = new Date()): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return startOfWeek(fallback);
  const [year, month, day] = value.split("-").map(Number);
  const parsed = businessCalendarDate(year, month, day);
  return parsed ? startOfWeek(parsed) : startOfWeek(fallback);
}

export function weekParam(date: Date): string {
  return businessDateKey(date);
}

export function shiftWeek(date: Date, weeks: number): Date {
  return addBusinessCalendarDays(startOfWeek(date), weeks * 7);
}

export function contextualAppointmentAction(status: AppointmentStatus, temporal: TemporalState): { status: AppointmentStatus; label: string } | null {
  if (temporal === "overdue" && ["requested", "pending_confirmation"].includes(status)) return { status: "confirmed", label: "Reprogramar o confirmar" };
  if (status === "requested") return { status: "pending_confirmation", label: "Iniciar confirmación" };
  if (status === "pending_confirmation") return { status: "confirmed", label: "Confirmar cita" };
  if (status === "confirmed") return { status: "completed", label: "Marcar finalizada" };
  return null;
}
