"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentLabels } from "../contracts";
import type { Appointment, AppointmentStatus } from "../types";
import { effectiveAppointmentDate, formatDateTime, formatTime, isToday, startOfWeek } from "../shared/format";
import { AppointmentBadge, EmptyState, ErrorState, LoadingState, PageHeader } from "../shared/ui";
import { useAdminQuery } from "../shared/use-admin-query";
import styles from "../admin.module.css";

const statuses: AppointmentStatus[] = ["requested", "pending_confirmation", "confirmed", "completed", "cancelled"];

export default function AppointmentsView() {
  const params = useSearchParams();
  const router = useRouter();
  const view = params.get("vista") === "agenda" ? "agenda" : "lista";
  const status = params.get("estado") || "all";
  const period = params.get("periodo") || "all";
  const query = useAdminQuery<Appointment[]>("/admin/appointments?limit=100&offset=0");
  const items = useMemo(() => (query.data || []).filter(item => {
    const date = effectiveAppointmentDate(item);
    return (status === "all" || item.status === status) && (period === "all" || (period === "today" && isToday(date)) || (period === "upcoming" && date >= new Date() && item.status === "confirmed"));
  }), [query.data, status, period]);
  const href = (changes: Record<string, string>) => { const next = new URLSearchParams(params.toString()); Object.entries(changes).forEach(([key, value]) => value === "all" ? next.delete(key) : next.set(key, value)); const search = next.toString(); return `/admin/citas${search ? `?${search}` : ""}`; };

  return <>
    <PageHeader eyebrow="Agenda comercial" title="Citas" description="Confirma visitas, ajusta horarios y consulta la carga semanal." actions={<button className={styles.secondaryButton} onClick={() => void query.reload()}>Actualizar</button>}/>
    <nav className={styles.tabs} aria-label="Vista de citas"><Link className={view === "lista" ? styles.activeTab : ""} href={href({ vista: "lista" })}>Lista</Link><Link className={view === "agenda" ? styles.activeTab : ""} href={href({ vista: "agenda" })}>Agenda semanal</Link></nav>
    <div className={styles.tableTools}><select className={styles.filterSelect} value={status} onChange={event => router.push(href({ estado: event.target.value }))} aria-label="Filtrar estado"><option value="all">Todos los estados</option>{statuses.map(item => <option value={item} key={item}>{appointmentLabels[item]}</option>)}</select><select className={styles.filterSelect} value={period} onChange={event => router.push(href({ periodo: event.target.value }))} aria-label="Filtrar periodo"><option value="all">Todas las fechas</option><option value="today">Hoy</option><option value="upcoming">Próximas confirmadas</option></select></div>
    {query.loading && !query.data ? <LoadingState/> : query.error ? <ErrorState message={query.error} retry={query.reload}/> : items.length ? view === "agenda" ? <WeekAgenda items={items}/> : <AppointmentTable items={items}/> : <EmptyState title="Sin citas" description="No hay citas que coincidan con estos filtros."/>}
  </>;
}

function AppointmentTable({ items }: { items: Appointment[] }) {
  return <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Cliente</th><th>Fecha y hora</th><th>Sucursal</th><th>Ubicación</th><th>Folio</th><th>Estado</th><th aria-label="Acciones"/></tr></thead><tbody>{items.map(item => <tr key={item.id}><td data-label="Cliente" className={styles.primaryCell}><Link href={`/admin/citas/${item.id}`}>{item.leads[0]?.name || "Sin cliente asociado"}</Link><small>{item.leads[0]?.phone || "Sin teléfono"}</small></td><td data-label="Fecha y hora">{formatDateTime(item.confirmed_datetime || item.requested_datetime)}</td><td data-label="Sucursal">{item.branch}</td><td data-label="Ubicación">{item.address}</td><td data-label="Folio">{item.submission?.folio || "—"}</td><td data-label="Estado"><AppointmentBadge status={item.status}/></td><td data-label="Acciones"><Link className={styles.textLink} href={`/admin/citas/${item.id}`}>Ver cita</Link></td></tr>)}</tbody></table></div>;
}

function WeekAgenda({ items }: { items: Appointment[] }) {
  const first = startOfWeek();
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(first); date.setDate(first.getDate() + index); return date; });
  return <div className={styles.agenda}>{days.map(day => <section className={styles.agendaDay} key={day.toISOString()}><header>{day.toLocaleDateString("es-MX", { weekday: "short" })}<strong>{day.getDate()}</strong>{day.toLocaleDateString("es-MX", { month: "short" })}</header>{items.filter(item => { const date = effectiveAppointmentDate(item); return date.toDateString() === day.toDateString(); }).map(item => <Link className={styles.agendaEvent} href={`/admin/citas/${item.id}`} key={item.id}><strong>{formatTime(item.confirmed_datetime || item.requested_datetime)}</strong><span>{item.leads[0]?.name || "Sin cliente"}</span><span>{item.branch}</span></Link>)}</section>)}</div>;
}
