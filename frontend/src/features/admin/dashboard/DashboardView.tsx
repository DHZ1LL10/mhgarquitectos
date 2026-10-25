"use client";

import Link from "next/link";
import { appointmentLabels, leadSourceLabels, humanLabel } from "../contracts";
import type { Appointment, AppointmentStatus, Dashboard, Lead } from "../types";
import { useAdminSession } from "../shared/session";
import { useAdminQuery } from "../shared/use-admin-query";
import { effectiveAppointmentDate, formatDateTime, isToday } from "../shared/format";
import { AppointmentBadge, EmptyState, ErrorState, LeadBadge, LoadingState, PageHeader } from "../shared/ui";
import Icon from "../shared/Icon";
import styles from "../admin.module.css";

const chartStatuses: AppointmentStatus[] = ["pending_confirmation", "confirmed", "completed", "cancelled"];

export default function DashboardView() {
  const { user } = useAdminSession();
  const dashboard = useAdminQuery<Dashboard>("/admin/dashboard");
  const appointments = useAdminQuery<Appointment[]>("/admin/appointments?limit=100&offset=0");
  const leads = useAdminQuery<Lead[]>("/admin/leads?limit=8&offset=0");
  const items = appointments.data || [];
  const now = new Date();
  const today = items.filter(item => isToday(effectiveAppointmentDate(item), now) && !["cancelled", "completed"].includes(item.status));
  const attention = items.filter(item => ["requested", "pending_confirmation"].includes(item.status)).slice(0, 5);
  const upcoming = items.filter(item => item.status === "confirmed" && effectiveAppointmentDate(item) >= now).sort((a, b) => effectiveAppointmentDate(a).getTime() - effectiveAppointmentDate(b).getTime()).slice(0, 5);
  const maximum = Math.max(1, ...chartStatuses.map(status => items.filter(item => item.status === status).length));
  const busy = dashboard.loading || appointments.loading || leads.loading;
  const error = dashboard.error || appointments.error || leads.error;
  const reload = () => { void dashboard.reload(); void appointments.reload(); void leads.reload(); };

  const metrics = dashboard.data ? [
    { label: "Clientes nuevos", value: dashboard.data.new_leads, href: "/admin/clientes?estado=new" },
    { label: "Citas por confirmar", value: dashboard.data.pending_confirmation_appointments, href: "/admin/citas?estado=pending_confirmation" },
    { label: "Agenda de hoy", value: today.length, href: "/admin/citas?periodo=today" },
    { label: "Próximas confirmadas", value: dashboard.data.upcoming_appointments, href: "/admin/citas?periodo=upcoming" },
    ...(user.role === "admin" ? [{ label: "Propiedades publicadas", value: dashboard.data.published_properties || 0, href: "/admin/propiedades?estado=published" }] : []),
  ] : [];
  const activity = [
    ...(leads.data || []).map(lead => ({ label: "Solicitud recibida", detail: lead.name, at: lead.created_at, href: `/admin/clientes/${lead.id}` })),
    ...items.filter(item => ["confirmed", "completed"].includes(item.status)).map(item => ({ label: item.status === "confirmed" ? "Cita confirmada" : "Cita finalizada", detail: item.leads[0]?.name || item.branch, at: item.updated_at, href: `/admin/citas/${item.id}` })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 5);
  const newLeads = (leads.data || []).filter(lead => lead.status === "new").slice(0, Math.max(0, 5 - attention.length));

  return <>
    <PageHeader eyebrow="Operación comercial" title={`Buen día, ${user.full_name.split(" ")[0]}`} description="Resumen accionable de solicitudes, agenda y seguimiento comercial." actions={<button className={styles.secondaryButton} onClick={reload}>Actualizar</button>} />
    {busy && !dashboard.data ? <LoadingState rows={6} /> : error ? <ErrorState message={error} retry={reload} /> : <>
      <section className={styles.kpiGrid} aria-label="Indicadores clave">{metrics.map(metric => <Link className={styles.kpi} href={metric.href} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>Ver detalle <Icon name="arrow" size={14}/></small></Link>)}</section>
      <div className={styles.sectionGrid}>
        <div>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Agenda de hoy</h2><p>Citas vigentes programadas para hoy.</p></div><Link className={styles.textLink} href="/admin/citas?periodo=today">Ver agenda</Link></header>{today.length ? <div className={styles.compactList}>{today.map(item => <AppointmentRow item={item} key={item.id}/>)}</div> : <EmptyState title="Agenda despejada" description="No hay citas activas programadas para hoy." />}</section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Próximas visitas</h2><p>Confirmadas y ordenadas por fecha.</p></div></header>{upcoming.length ? <div className={styles.compactList}>{upcoming.map(item => <AppointmentRow item={item} key={item.id}/>)}</div> : <EmptyState title="Sin próximas visitas" description="Las citas confirmadas aparecerán aquí." />}</section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Solicitudes recientes</h2><p>Clientes ordenados por recepción.</p></div><Link className={styles.textLink} href="/admin/clientes">Ver clientes</Link></header><div className={styles.compactList}>{leads.data?.map(lead => <Link className={styles.compactItem} href={`/admin/clientes/${lead.id}`} key={lead.id}><span><strong>{lead.name}</strong><small>{lead.submission?.folio || "Sin folio"} · {leadSourceLabels[lead.source] || humanLabel(lead.source)} · {formatDateTime(lead.created_at)}</small></span><LeadBadge status={lead.status}/></Link>)}</div></section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Actividad reciente</h2><p>Eventos derivados de timestamps persistidos.</p></div></header><div className={styles.timeline}>{activity.map(event => <Link className={styles.timelineItem} href={event.href} key={`${event.label}-${event.at}`}><span className={styles.timelineDot}/><span><strong>{event.label}</strong><small>{event.detail} · {formatDateTime(event.at)}</small></span></Link>)}</div></section>
        </div>
        <aside>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Requiere atención</h2><p>Solicitudes nuevas y citas aún no confirmadas.</p></div></header>{attention.length || newLeads.length ? <div className={styles.attentionList}>{attention.map(item => <Link className={styles.attentionItem} href={`/admin/citas/${item.id}`} key={item.id}><span><strong>{item.leads[0]?.name || "Sin cliente asociado"}</strong><small>Cita · {formatDateTime(item.requested_datetime)}</small></span><span className={styles.priority}>Atender</span></Link>)}{newLeads.map(lead => <Link className={styles.attentionItem} href={`/admin/clientes/${lead.id}`} key={lead.id}><span><strong>{lead.name}</strong><small>Solicitud nueva · {formatDateTime(lead.created_at)}</small></span><span className={styles.priority}>Atender</span></Link>)}</div> : <EmptyState title="Todo al día" description="No hay solicitudes o citas pendientes." />}</section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Estado de citas</h2><p>Distribución de los registros cargados.</p></div></header><div className={styles.chart}>{chartStatuses.map(status => { const count = items.filter(item => item.status === status).length; return <div className={styles.chartRow} key={status}><span>{appointmentLabels[status]}</span><div className={styles.chartTrack}><div className={styles.chartBar} style={{ width: `${count / maximum * 100}%` }} /></div><strong>{count}</strong></div>; })}</div></section>
        </aside>
      </div>
    </>}
  </>;
}

function AppointmentRow({ item }: { item: Appointment }) {
  return <Link className={styles.compactItem} href={`/admin/citas/${item.id}`}><span><strong>{item.leads[0]?.name || "Sin cliente asociado"}</strong><small>{formatDateTime(item.confirmed_datetime || item.requested_datetime)} · {item.branch} · {item.address}</small></span><AppointmentBadge status={item.status}/></Link>;
}
