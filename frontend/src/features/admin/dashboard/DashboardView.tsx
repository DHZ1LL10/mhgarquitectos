"use client";

import Link from "next/link";
import { appointmentLabels, leadSourceLabels, humanLabel } from "../contracts";
import type { Appointment, AppointmentStatus, Dashboard, Lead } from "../types";
import { useAdminSession } from "../shared/session";
import { useAdminQuery } from "../shared/use-admin-query";
import { effectiveAppointmentDate, formatDateTime, isToday } from "../shared/format";
import { AppointmentBadge, EmptyState, ErrorState, Identifier, LeadBadge, LoadingState, PageHeader, TemporalBadge } from "../shared/ui";
import Icon from "../shared/Icon";
import { buildActivityEvents } from "./activity";
import { buildDashboardAttention, classifyAppointmentTemporal, todayAppointmentCue } from "../shared/operations";
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
  const attention = buildDashboardAttention(leads.data || [], items, now).slice(0, 6);
  const upcoming = items.filter(item => item.status === "confirmed" && effectiveAppointmentDate(item) >= now).sort((a, b) => effectiveAppointmentDate(a).getTime() - effectiveAppointmentDate(b).getTime()).slice(0, 5);
  const maximum = Math.max(1, ...chartStatuses.map(status => items.filter(item => item.status === status).length));
  const busy = dashboard.loading || appointments.loading || leads.loading;
  const error = dashboard.error || appointments.error || leads.error;
  const reload = () => { void dashboard.reload(); void appointments.reload(); void leads.reload(); };

  const metrics = dashboard.data ? [
    { label: "Clientes nuevos", value: dashboard.data.new_leads, href: "/admin/clientes?estado=new", icon: "clients" as const, micro: "Esperan primer contacto" },
    { label: "Citas por confirmar", value: dashboard.data.pending_confirmation_appointments, href: "/admin/citas?estado=pending_confirmation", icon: "clock" as const, micro: "Requieren respuesta" },
    { label: "Agenda de hoy", value: today.length, href: "/admin/citas?periodo=today", icon: "calendar" as const, micro: "Visitas activas del día" },
    { label: "Próximas confirmadas", value: dashboard.data.upcoming_appointments, href: "/admin/citas?periodo=upcoming", icon: "calendar" as const, micro: "Ya acordadas" },
    ...(user.role === "admin" ? [{ label: "Propiedades publicadas", value: dashboard.data.published_properties || 0, href: "/admin/propiedades?estado=published", icon: "building" as const, micro: "Visibles en el sitio" }] : []),
  ] : [];
  const activity = buildActivityEvents(leads.data || [], items).slice(0, 5);

  return <>
    <PageHeader eyebrow="Operación comercial" title={`Buen día, ${user.full_name.split(" ")[0]}`} description="Resumen accionable de solicitudes, agenda y seguimiento comercial." actions={<button className={styles.secondaryButton} onClick={reload}>Actualizar</button>} />
    {busy && !dashboard.data ? <LoadingState rows={6} /> : error ? <ErrorState message={error} retry={reload} /> : <>
      <section className={styles.kpiGrid} aria-label="Indicadores clave">{metrics.map(metric => <Link className={styles.kpi} href={metric.href} key={metric.label}><span className={styles.kpiHeading}><Icon name={metric.icon} size={18}/>{metric.label}</span><strong>{metric.value}</strong><small>{metric.micro} <Icon name="arrow" size={14}/></small></Link>)}</section>
      <div className={styles.sectionGrid}>
        <div>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Agenda de hoy</h2><p>Citas vigentes programadas para hoy.</p></div><Link className={styles.textLink} href="/admin/citas?periodo=today">Ver agenda</Link></header>{today.length ? <div className={styles.compactList}>{today.map(item => <AppointmentRow item={item} now={now} key={item.id}/>)}</div> : <EmptyState title="Agenda despejada" description="No hay citas activas programadas para hoy." />}</section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Próximas visitas</h2><p>Confirmadas y ordenadas por fecha.</p></div></header>{upcoming.length ? <div className={styles.compactList}>{upcoming.map(item => <AppointmentRow item={item} now={now} key={item.id}/>)}</div> : <EmptyState title="Sin próximas visitas" description="Las citas confirmadas aparecerán aquí." />}</section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Solicitudes recientes</h2><p>Clientes ordenados por recepción.</p></div><Link className={styles.textLink} href="/admin/clientes">Ver clientes</Link></header><div className={styles.compactList}>{leads.data?.map(lead => <Link className={styles.compactItem} href={`/admin/clientes/${lead.id}`} key={lead.id}><span><strong>{lead.name}</strong><small><Identifier value={lead.submission?.folio} /> · {leadSourceLabels[lead.source] || humanLabel(lead.source)} · {formatDateTime(lead.created_at)}</small></span><LeadBadge status={lead.status}/></Link>)}</div></section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Actividad reciente</h2><p>Eventos derivados de timestamps persistidos.</p></div></header><div className={styles.timeline}>{activity.map(event => <Link className={styles.timelineItem} href={event.href} key={event.key}><span className={styles.timelineDot}/><span><strong>{event.label}</strong><small>{event.detail} · {formatDateTime(event.at)}</small></span></Link>)}</div></section>
        </div>
        <aside>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Requiere atención</h2><p>Ordenado por urgencia operativa.</p></div></header>{attention.length ? <div className={styles.attentionList}>{attention.map(item => <Link className={styles.attentionItem} href={item.href} key={item.key}><span><strong>{item.title}</strong><small>{item.detail} · {formatDateTime(item.at)}</small></span><span className={styles.priority}>{item.label}</span></Link>)}</div> : <EmptyState title="Todo al día" description="No hay solicitudes o citas pendientes." />}</section>
          <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Estado de citas</h2><p>Distribución de los registros cargados.</p></div></header><div className={styles.chart}>{chartStatuses.map(status => { const count = items.filter(item => item.status === status).length; return <div className={styles.chartRow} key={status}><span>{appointmentLabels[status]}</span><div className={styles.chartTrack}><div className={styles.chartBar} style={{ width: `${count / maximum * 100}%` }} /></div><strong>{count}</strong></div>; })}</div></section>
        </aside>
      </div>
    </>}
  </>;
}

function AppointmentRow({ item, now }: { item: Appointment; now: Date }) {
  const cue = todayAppointmentCue(item, now);
  return <Link className={styles.compactItem} href={`/admin/citas/${item.id}`}><span><strong>{item.leads[0]?.name || "Sin cliente asociado"}</strong><small>{formatDateTime(item.confirmed_datetime || item.requested_datetime)} · {item.branch} · {item.address}</small>{cue && <em className={styles.operationalCue}>{cue}</em>}</span><span className={styles.badgeStack}><AppointmentBadge status={item.status}/><TemporalBadge state={classifyAppointmentTemporal(item, now)}/></span></Link>;
}
