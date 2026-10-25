"use client";

import { useState } from "react";
import Link from "next/link";
import { adminApi } from "../api-client";
import { humanLabel, leadSourceLabels, leadStatusLabels, openStreetMapUrl } from "../contracts";
import type { Kitchen, Lead, LeadStatus } from "../types";
import ContactActions from "../shared/ContactActions";
import Icon from "../shared/Icon";
import { formatDateTime } from "../shared/format";
import { EmptyState, ErrorState, LeadBadge, LoadingState, TechnicalInfo } from "../shared/ui";
import { useAdminSession } from "../shared/session";
import { useAdminQuery } from "../shared/use-admin-query";
import styles from "../admin.module.css";

export default function ClientDetailView({ id }: { id: string }) {
  const { user, handleError } = useAdminSession();
  const query = useAdminQuery<Lead>(`/admin/leads/${id}`);
  const kitchen = useAdminQuery<Kitchen>(query.data?.kitchen_configuration_id ? `/admin/kitchen-configurations/${query.data.kitchen_configuration_id}` : null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  if (query.loading && !query.data) return <LoadingState rows={7}/>;
  if (query.error || !query.data) return <ErrorState message={query.error || "Cliente no encontrado."} retry={query.reload}/>;
  const lead = query.data;
  const map = openStreetMapUrl(lead.latitude, lead.longitude);
  const changeStatus = async (status: LeadStatus) => {
    setSaving(true); setError(""); setNotice("");
    try { const updated = await adminApi().request<Lead>(`/leads/${lead.id}/status`, "PATCH", { status }); query.setData({ ...lead, status: updated.status, updated_at: updated.updated_at }); setNotice("Estado del cliente actualizado."); }
    catch (reason) { setError(handleError(reason)); }
    finally { setSaving(false); }
  };
  const events = [
    { label: "Solicitud recibida", value: lead.created_at },
    ...(lead.appointment ? [{ label: "Cita solicitada", value: lead.appointment.created_at }, ...(lead.appointment.confirmed_datetime ? [{ label: "Cita confirmada", value: lead.appointment.confirmed_datetime }] : [])] : []),
    ...(lead.updated_at !== lead.created_at ? [{ label: "Última actualización", value: lead.updated_at }] : []),
  ].sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());

  return <>
    <Link className={styles.textLink} href="/admin/clientes">← Volver a clientes</Link>
    <header className={styles.detailHeader}><div><div className={styles.recordTitle}><h1>{lead.name}</h1><LeadBadge status={lead.status}/></div><div className={styles.recordMeta}><span>{leadSourceLabels[lead.source] || humanLabel(lead.source)}</span><span>{lead.submission?.folio || "Sin folio"}</span><span>Recibido {formatDateTime(lead.created_at)}</span></div></div><ContactActions lead={lead}/></header>
    {notice && <p className={styles.successNotice} role="status">{notice}</p>}{error && <p className={styles.errorNotice} role="alert">{error}</p>}
    <div className={styles.sectionGrid}><div>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Datos del cliente</h2><p>Información proporcionada en su solicitud.</p></div></header><dl className={styles.infoGrid}><div className={styles.infoItem}><dt>Teléfono</dt><dd>{lead.phone}</dd></div><div className={styles.infoItem}><dt>Correo</dt><dd>{lead.email || "No proporcionado"}</dd></div><div className={styles.infoItem}><dt>Dirección</dt><dd>{lead.address || "No proporcionada"}</dd></div><div className={styles.infoItem}><dt>Mensaje</dt><dd>{lead.message || "Sin observaciones"}</dd></div></dl>{map && <a className={styles.secondaryButton} href={map} target="_blank" rel="noopener noreferrer"><Icon name="map" size={16}/>Ver ubicación</a>}</section>
      {lead.appointment && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Cita asociada</h2><p>{formatDateTime(lead.appointment.confirmed_datetime || lead.appointment.requested_datetime)} · {lead.appointment.branch}</p></div><Link className={styles.secondaryButton} href={`/admin/citas/${lead.appointment.id}`}>Abrir cita</Link></header></section>}
      {lead.kitchen_configuration_id && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Proyecto de cocina</h2><p>{kitchen.data ? `${humanLabel(kitchen.data.current_situation)} · ${kitchen.data.branch}` : "Configuración vinculada"}</p></div><Link className={styles.secondaryButton} href={`/admin/cocinas/${lead.kitchen_configuration_id}`}>Ver configuración</Link></header></section>}
    </div><aside>
      {user.role === "admin" && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Seguimiento</h2><p>Actualiza únicamente el estado comercial.</p></div></header><label className={styles.field}>Estado<select disabled={saving} value={lead.status} onChange={event => void changeStatus(event.target.value as LeadStatus)}>{(Object.keys(leadStatusLabels) as LeadStatus[]).map(status => <option key={status} value={status}>{leadStatusLabels[status]}</option>)}</select></label></section>}
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Actividad</h2><p>Eventos registrados por el sistema.</p></div></header>{events.length ? <div className={styles.timeline}>{events.map(event => <div className={styles.timelineItem} key={`${event.label}-${event.value}`}><span className={styles.timelineDot}/><div><strong>{event.label}</strong><small>{formatDateTime(event.value)}</small></div></div>)}</div> : <EmptyState title="Sin actividad" description="Todavía no existen eventos para este cliente."/>}<TechnicalInfo values={[["ID de cliente", lead.id], ["ID de configuración", lead.kitchen_configuration_id], ["ID de cita", lead.appointment_id], ["ID de propiedad", lead.property_id]]}/></section>
    </aside></div>
  </>;
}
