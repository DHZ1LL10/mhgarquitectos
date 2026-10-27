"use client";

import { useState } from "react";
import Link from "next/link";
import { adminApi } from "../api-client";
import { appointmentWhatsAppUrl, confirmedDateTime, localDateTime, openStreetMapUrl, transitions } from "../contracts";
import type { Appointment, AppointmentStatus } from "../types";
import { useAdminSession } from "../shared/session";
import { useAdminQuery } from "../shared/use-admin-query";
import { AppointmentBadge, ErrorState, Identifier, LoadingState, TechnicalInfo, TemporalBadge } from "../shared/ui";
import { formatDateTime } from "../shared/format";
import Icon from "../shared/Icon";
import styles from "../admin.module.css";
import { can } from "../permissions";
import { classifyAppointmentTemporal, contextualAppointmentAction } from "../shared/operations";

export default function AppointmentDetailView({ id }: { id: string }) {
  const { user, handleError } = useAdminSession();
  const query = useAdminQuery<Appointment>(`/admin/appointments/${id}`);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  if (query.loading && !query.data) return <LoadingState rows={7}/>;
  if (query.error || !query.data) return <ErrorState message={query.error || "Cita no encontrada."} retry={query.reload}/>;
  const item = query.data;
  const lead = item.leads[0] ? { ...item.leads[0], appointment: item } : null;
  const map = openStreetMapUrl(item.latitude, item.longitude);
  const allowed = transitions[item.status];
  const whatsappMode = item.status === "confirmed" || item.status === "completed" ? "confirmed" : "pending";
  const whatsapp = lead ? appointmentWhatsAppUrl(lead, whatsappMode) : null;
  const temporal = classifyAppointmentTemporal(item);
  const primaryAction = contextualAppointmentAction(item.status, temporal);

  const patch = async (payload: Record<string, unknown>, message: string) => {
    setSaving(true); setError(""); setNotice("");
    try { await adminApi().request(`/appointments/${item.id}`, "PATCH", payload); await query.reload(); setNotice(message); }
    catch (reason) { setError(handleError(reason)); }
    finally { setSaving(false); }
  };
  const transition = (status: AppointmentStatus) => {
    if (status === "cancelled" && !window.confirm("¿Cancelar esta cita? Esta acción quedará registrada.")) return;
    const payload: Record<string, unknown> = { status };
    if (status === "confirmed") payload.confirmed_datetime = item.confirmed_datetime || item.requested_datetime;
    if (status === "completed") payload.confirmed_datetime = item.confirmed_datetime;
    void patch(payload, status === "confirmed" ? "Cita confirmada. Ya puedes enviar la confirmación por WhatsApp." : "Estado de la cita actualizado.");
  };
  const saveDetails = () => void patch({ ...(date ? { confirmed_datetime: confirmedDateTime(date) } : {}), notes: notes ?? item.notes }, "Detalles de la cita actualizados.");

  return <>
    <Link className={styles.textLink} href="/admin/citas">← Volver a citas</Link>
    <header className={styles.detailHeader}><div><div className={styles.recordTitle}><h1>{lead?.name || "Cita sin cliente"}</h1><AppointmentBadge status={item.status}/><TemporalBadge state={temporal}/></div><div className={styles.recordMeta}><span><Identifier value={item.submission?.folio}/></span><span>{formatDateTime(item.confirmed_datetime || item.requested_datetime)}</span><span>{item.branch}</span></div></div><div className={styles.contactActions}>{temporal === "overdue" && can(user, "appointments.manage") ? <a className={styles.primaryButton} href="#ajustar-cita">Reprogramar cita</a> : primaryAction && can(user, "appointments.manage") ? <button disabled={saving} className={styles.primaryButton} onClick={() => transition(primaryAction.status)}>{primaryAction.label}</button> : null}{whatsapp && <a className={styles.secondaryButton} href={whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="message" size={16}/>{whatsappMode === "confirmed" ? "Enviar confirmación por WhatsApp" : "Confirmar horario por WhatsApp"}</a>}</div></header>
    {temporal === "overdue" && <p className={styles.overdueNotice}><strong>Cita vencida.</strong> El horario ya pasó; ajusta la fecha y confirma el siguiente paso con el cliente.</p>}
    {notice && <p className={styles.successNotice} role="status">{notice}</p>}{error && <p className={styles.errorNotice} role="alert">{error}</p>}
    <div className={styles.appointmentFlow}>{(["requested", "pending_confirmation", "confirmed", "completed"] as AppointmentStatus[]).map(status => <span className={`${styles.flowStep} ${item.status === status ? styles.flowActive : ""}`} key={status}>{status === "requested" ? "Solicitud" : status === "pending_confirmation" ? "Por confirmar" : status === "confirmed" ? "Confirmada" : "Finalizada"}</span>)}</div>
    <div className={styles.sectionGrid}><div>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Información de la visita</h2><p>Horario, sucursal y ubicación.</p></div></header><dl className={styles.infoGrid}><div className={styles.infoItem}><dt>Fecha solicitada</dt><dd>{formatDateTime(item.requested_datetime)}</dd></div><div className={styles.infoItem}><dt>Fecha confirmada</dt><dd>{formatDateTime(item.confirmed_datetime)}</dd></div><div className={styles.infoItem}><dt>Sucursal</dt><dd>{item.branch}</dd></div><div className={styles.infoItem}><dt>Dirección</dt><dd>{item.address}</dd></div></dl>{map && <a className={styles.secondaryButton} href={map} target="_blank" rel="noopener noreferrer"><Icon name="map" size={16}/>Abrir mapa</a>}</section>
      {lead && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Cliente</h2><p>{lead.phone} · {lead.email || "Sin correo"}</p>{lead.advisor && <p>Atendido por: {lead.advisor}</p>}</div>{can(user, "clients.view") && <Link className={styles.secondaryButton} href={`/admin/clientes/${lead.id}`}>Ver cliente</Link>}</header></section>}
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Observaciones</h2></div></header><p>{item.notes || "Sin observaciones"}</p></section>
    </div><aside>
      {can(user, "appointments.manage") && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Acciones</h2><p>Avanza la cita respetando el flujo operativo.</p></div></header><div className={styles.splitActions}>{allowed.includes("pending_confirmation") && <button disabled={saving} className={styles.secondaryButton} onClick={() => transition("pending_confirmation")}>Marcar por confirmar</button>}{allowed.includes("confirmed") && <button disabled={saving} className={styles.primaryButton} onClick={() => transition("confirmed")}>Confirmar cita</button>}{allowed.includes("completed") && <button disabled={saving} className={styles.primaryButton} onClick={() => transition("completed")}>Marcar finalizada</button>}{allowed.includes("cancelled") && <button disabled={saving} className={styles.dangerButton} onClick={() => transition("cancelled")}>Cancelar cita</button>}</div></section>}
      {can(user, "appointments.manage") && <section className={styles.panel} id="ajustar-cita"><header className={styles.panelHeader}><div><h2>Ajustar detalles</h2><p>La fecha se interpreta en tu zona horaria local.</p></div></header><div className={styles.form}><label className={styles.field}>Fecha confirmada<input type="datetime-local" value={date || localDateTime(item.confirmed_datetime || item.requested_datetime)} onChange={event => setDate(event.target.value)}/></label><label className={styles.field}>Notas<textarea value={notes ?? item.notes ?? ""} onChange={event => setNotes(event.target.value)}/></label><button disabled={saving} className={styles.secondaryButton} onClick={saveDetails}>Guardar cambios</button></div></section>}
      <section className={styles.panel}><TechnicalInfo values={[["ID de cita", item.id], ["ID de envío", item.submission?.id], ["ID de configuración", item.submission?.configuration_id]]}/></section>
    </aside></div>
  </>;
}
