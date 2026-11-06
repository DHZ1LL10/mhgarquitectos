import type { Appointment, Lead } from "../types.ts";

export type ActivityEvent = {
  key: string;
  type: "lead-created" | "appointment-requested" | "appointment-confirmed" | "appointment-completed";
  entityId: string;
  label: string;
  detail: string;
  at: string;
  href: string;
};

export type ClientActivityEvent = {
  key: string;
  type: "lead-created" | "appointment-requested" | "appointment-confirmed" | "lead-updated";
  label: string;
  at: string;
};

function activityEvent(
  type: ActivityEvent["type"],
  entityId: string,
  label: string,
  detail: string,
  at: string,
  href: string,
): ActivityEvent {
  return { key: `${type}:${entityId}:${at}`, type, entityId, label, detail, at, href };
}

export function buildActivityEvents(
  leads: Pick<Lead, "id" | "name" | "created_at">[],
  appointments: Pick<Appointment, "id" | "status" | "created_at" | "updated_at" | "branch" | "leads">[],
): ActivityEvent[] {
  const leadEvents = leads.map(lead => activityEvent(
    "lead-created",
    lead.id,
    "Solicitud recibida",
    lead.name,
    lead.created_at,
    `/admin/clientes/${lead.id}`,
  ));
  const appointmentEvents = appointments.flatMap(item => {
    const detail = item.leads[0]?.name || item.branch;
    const requested = activityEvent(
      "appointment-requested",
      item.id,
      "Cita solicitada",
      detail,
      item.created_at,
      `/admin/citas/${item.id}`,
    );
    if (item.status === "confirmed") {
      return [requested, activityEvent("appointment-confirmed", item.id, "Cita confirmada", detail, item.updated_at, `/admin/citas/${item.id}`)];
    }
    if (item.status === "completed") {
      return [requested, activityEvent("appointment-completed", item.id, "Cita finalizada", detail, item.updated_at, `/admin/citas/${item.id}`)];
    }
    return [requested];
  });
  return [...leadEvents, ...appointmentEvents].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function buildClientActivity(lead: Pick<Lead, "id" | "created_at" | "updated_at" | "appointment">): ClientActivityEvent[] {
  const events: ClientActivityEvent[] = [{ key: `lead-created:${lead.id}:${lead.created_at}`, type: "lead-created", label: "Solicitud recibida", at: lead.created_at }];
  if (lead.appointment) {
    events.push({ key: `appointment-requested:${lead.appointment.id}:${lead.appointment.created_at}`, type: "appointment-requested", label: "Cita solicitada", at: lead.appointment.created_at });
    if (lead.appointment.confirmed_datetime) events.push({ key: `appointment-confirmed:${lead.appointment.id}:${lead.appointment.confirmed_datetime}`, type: "appointment-confirmed", label: "Cita confirmada", at: lead.appointment.confirmed_datetime });
  }
  if (lead.updated_at !== lead.created_at) events.push({ key: `lead-updated:${lead.id}:${lead.updated_at}`, type: "lead-updated", label: "Última actualización", at: lead.updated_at });
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
