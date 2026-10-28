"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentLabels } from "../contracts";
import type { Appointment, AppointmentStatus } from "../types";
import { addBusinessCalendarDays, businessDateKey, effectiveAppointmentDate, formatBusinessDate, formatDateTime, formatTime, isToday } from "../shared/format";
import { AppointmentBadge, EmptyState, ErrorState, Identifier, LoadingState, PageHeader, TemporalBadge } from "../shared/ui";
import { useAdminQuery } from "../shared/use-admin-query";
import { classifyAppointmentTemporal, parseWeekStart, shiftWeek, weekParam } from "../shared/operations";
import styles from "../admin.module.css";

const statuses: AppointmentStatus[] = ["requested", "pending_confirmation", "confirmed", "completed", "cancelled"];

export default function AppointmentsView() {
  const params = useSearchParams();
  const router = useRouter();
  const view = params.get("vista") === "agenda" ? "agenda" : "lista";
  const status = params.get("estado") || "all";
  const period = params.get("periodo") || "all";
  const selectedWeek = parseWeekStart(params.get("semana"));
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
    {query.loading && !query.data ? <LoadingState/> : query.error ? <ErrorState message={query.error} retry={query.reload}/> : view === "agenda" ? <WeekAgenda items={items} first={selectedWeek} href={href}/> : items.length ? <AppointmentTable items={items}/> : <EmptyState title="Sin citas" description="No hay citas que coincidan con estos filtros."/>}
  </>;
}

function AppointmentTable({ items }: { items: Appointment[] }) {
  const now = new Date();
  return <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Cliente</th><th>Fecha y hora</th><th>Sucursal</th><th>Ubicación</th><th>Folio</th><th>Estado</th><th aria-label="Acciones"/></tr></thead><tbody>{items.map(item => <tr key={item.id}><td data-label="Cliente" className={styles.primaryCell}><Link href={`/admin/citas/${item.id}`}>{item.leads[0]?.name || "Sin cliente asociado"}</Link><small>{item.leads[0]?.phone || "Sin teléfono"}</small></td><td data-label="Fecha y hora">{formatDateTime(item.confirmed_datetime || item.requested_datetime)}<span className={styles.inlineBadge}><TemporalBadge state={classifyAppointmentTemporal(item, now)}/></span></td><td data-label="Sucursal">{item.branch}</td><td data-label="Ubicación">{item.address}</td><td data-label="Folio"><Identifier value={item.submission?.folio}/></td><td data-label="Estado"><AppointmentBadge status={item.status}/></td><td data-label="Acciones"><Link className={styles.textLink} href={`/admin/citas/${item.id}`}>Ver cita</Link></td></tr>)}</tbody></table></div>;
}

function WeekAgenda({ items, first, href }: { items: Appointment[]; first: Date; href: (changes: Record<string, string>) => string }) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => addBusinessCalendarDays(first, index));
  const last = days[6];
  const visibleDayKeys = new Set(days.map(businessDateKey));
  const visible = items.filter(item => visibleDayKeys.has(businessDateKey(effectiveAppointmentDate(item))));
  return <><div className={styles.agendaToolbar}><div><strong>{formatBusinessDate(first, { day: "numeric", month: "long" })} — {formatBusinessDate(last, { day: "numeric", month: "long", year: "numeric" })}</strong><span>{visible.length} {visible.length === 1 ? "cita" : "citas"} en esta semana</span></div><nav aria-label="Navegar semanas"><Link className={styles.secondaryButton} href={href({ semana: weekParam(shiftWeek(first, -1)), vista: "agenda" })}>← Anterior</Link><Link className={styles.secondaryButton} href={href({ semana: "all", vista: "agenda" })}>Hoy</Link><Link className={styles.secondaryButton} href={href({ semana: weekParam(shiftWeek(first, 1)), vista: "agenda" })}>Siguiente →</Link></nav></div><div className={styles.agenda}>{days.map(day => { const dayKey = businessDateKey(day); const dayItems = visible.filter(item => businessDateKey(effectiveAppointmentDate(item)) === dayKey); return <section className={`${styles.agendaDay} ${isToday(day, now) ? styles.agendaToday : ""}`} key={dayKey}><header>{formatBusinessDate(day, { weekday: "short" })}<strong>{formatBusinessDate(day, { day: "numeric" })}</strong>{formatBusinessDate(day, { month: "short" })}<small>{dayItems.length}</small></header>{dayItems.length ? dayItems.map(item => <Link className={`${styles.agendaEvent} ${styles[`agenda_${item.status}`]}`} href={`/admin/citas/${item.id}`} key={item.id}><strong>{formatTime(item.confirmed_datetime || item.requested_datetime)}</strong><span>{item.leads[0]?.name || "Sin cliente"}</span><span>{item.branch}</span><AppointmentBadge status={item.status}/></Link>) : <p className={styles.agendaEmpty}>Sin citas</p>}</section>; })}</div></>;
}
