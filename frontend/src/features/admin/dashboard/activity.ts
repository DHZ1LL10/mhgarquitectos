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
