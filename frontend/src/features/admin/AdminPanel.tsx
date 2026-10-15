"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "./api-client";
import {
  appointmentLabels,
  emptyProperty,
  humanLabel,
  humanSelection,
  leadSourceLabels,
  leadStatusLabels,
  leadWhatsAppUrl,
  openStreetMapUrl,
  parseUser,
  transitions,
} from "./contracts";
import type { Appointment, AppointmentStatus, Dashboard, Kitchen, Lead, Property, PropertyInput, User } from "./types";
import PropertyForm from "./PropertyForm";
import AppointmentForm from "./AppointmentForm";
import styles from "../properties/styles/admin.module.css";

type View = "dashboard" | "properties" | "leads" | "appointments" | "kitchen-configurations";
type Data = { dashboard?: Dashboard; properties?: Property[]; leads?: Lead[]; appointments?: Appointment[]; "kitchen-configurations"?: Kitchen[]; dashboardLeads?: Lead[]; dashboardAppointments?: Appointment[] };
const labels: Record<View, string> = { dashboard: "Resumen", properties: "Propiedades", leads: "Clientes / Solicitudes", appointments: "Citas", "kitchen-configurations": "Cocinas solicitadas" };
const statusOrder: AppointmentStatus[] = ["pending_confirmation", "requested", "confirmed", "completed", "cancelled"];
const date = (value: string | null) => value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "Sin confirmar";
const onlyDate = (value: string) => new Date(value).toLocaleDateString("es-MX", { dateStyle: "medium" });
const onlyTime = (value: string) => new Date(value).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`${styles.status} ${styles[`status_${status}`]}`}>{appointmentLabels[status]}</span>;
}

function WhatsAppContact({ lead }: { lead: Lead }) {
  const url = leadWhatsAppUrl(lead);
  return url ? <a className={`${styles.button} ${styles.whatsapp}`} href={url} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a> : null;
}

function Location({ item }: { item: { address: string; latitude: number | null; longitude: number | null } }) {
  const map = openStreetMapUrl(item.latitude, item.longitude);
  return <div className={styles.location}><p>{item.address}</p>{map && <a className={`${styles.button} ${styles.secondary}`} href={map} target="_blank" rel="noopener noreferrer">Ver ubicación</a>}</div>;
}

function TechnicalInfo({ values }: { values: [string, string | null][] }) {
  return <details className={styles.technical}><summary>Información técnica</summary><dl>{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "No asociado"}</dd></div>)}</dl></details>;
}

function ClientSummary({ lead }: { lead: Lead }) {
  return <div className={styles.client}><strong>{lead.name}</strong><a href={`tel:${lead.phone}`}>{lead.phone}</a>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : <span>Sin correo</span>}</div>;
}

function AppointmentCard({ item, user, saving, onSave }: { item: Appointment; user: User; saving: boolean; onSave: (id: string, value: unknown) => Promise<void> }) {
  const lead = item.leads[0];
  const can = transitions[item.status];
  return <article className={`${styles.record} ${styles.appointmentCard}`}>
    <header className={styles.cardHeader}><div><p className={styles.eyebrow}>Cita · {item.branch}</p><h3>{onlyDate(item.confirmed_datetime || item.requested_datetime)} · {onlyTime(item.confirmed_datetime || item.requested_datetime)}</h3></div><StatusBadge status={item.status} /></header>
    <div className={styles.detailGrid}>
      <section><h4>Cliente</h4>{lead ? <><ClientSummary lead={lead} /><WhatsAppContact lead={{ ...lead, appointment: item }} /></> : <p>Sin cliente relacionado.</p>}</section>
      <section><h4>Cita</h4><p><strong>Solicitada:</strong> {date(item.requested_datetime)}</p><p><strong>Confirmada:</strong> {date(item.confirmed_datetime)}</p><p><strong>Sucursal:</strong> {item.branch}</p></section>
      <section><h4>Ubicación</h4><Location item={item} /></section>
      <section><h4>Solicitud</h4><p><strong>Folio:</strong> {item.submission?.folio || "Sin folio"}</p><p>{item.notes || "Sin observaciones"}</p><p className={styles.hint}>Visita de levantamiento para proyecto de cocina.</p></section>
    </div>
    {user.role === "admin" && <div className={styles.quickActions}>
      {can.includes("pending_confirmation") && <button className={`${styles.button} ${styles.secondary}`} disabled={saving} onClick={() => onSave(item.id, { status: "pending_confirmation" })}>Marcar por confirmar</button>}
      {can.includes("confirmed") && <button className={styles.button} disabled={saving} onClick={() => onSave(item.id, { status: "confirmed", confirmed_datetime: item.confirmed_datetime || item.requested_datetime })}>Confirmar cita</button>}
      {can.includes("completed") && <button className={styles.button} disabled={saving} onClick={() => onSave(item.id, { status: "completed", confirmed_datetime: item.confirmed_datetime })}>Marcar finalizada</button>}
      {can.includes("cancelled") && <button className={`${styles.button} ${styles.danger}`} disabled={saving} onClick={() => onSave(item.id, { status: "cancelled" })}>Cancelar</button>}
    </div>}
    {user.role === "admin" && <details className={styles.editor}><summary>Cambiar fecha, hora o notas</summary><AppointmentForm key={item.updated_at} item={item} saving={saving} onSave={onSave} /></details>}
    <TechnicalInfo values={[["ID de cita", item.id], ["ID de envío", item.submission?.id || null], ["ID de configuración", item.submission?.configuration_id || null]]} />
  </article>;
}

function KitchenRows({ item }: { item: Kitchen }) {
  const hardware = item.hardware || {};
  const rows: [string, unknown][] = [
    ["Situación actual", item.current_situation], ["Tablero interior", item.interior_board], ["Frentes exteriores", item.exterior_fronts],
    ["Bisagras", hardware.bisagras], ["Correderas", hardware.correderas], ["Cajones", hardware.cajones], ["Basurero", hardware.basureros],
    ["Especiero", hardware.especiero], ["Módulos especiales", hardware.modulos_especiales], ["Cubierta", item.countertop], ["Variante", item.finish], ["Extras", item.extras],
  ];
  return <dl className={styles.summaryList}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{humanSelection(value)}</dd></div>)}</dl>;
}

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [data, setData] = useState<Data>({});
  const [offset, setOffset] = useState(0);
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; value: PropertyInput } | null>(null);
  const sequence = useRef(0);
  const invalidateRequests = useCallback(() => { sequence.current++; }, []);
  const fail = useCallback((reason: unknown) => {
    if (reason instanceof ApiError && reason.status === 401) { setUser(null); setData({}); setEditing(null); router.replace("/admin/login"); }
    setError(reason instanceof Error ? reason.message : "No se pudo completar la operación.");
  }, [router]);
  const load = useCallback(async (target: View, start = 0) => {
    const request = ++sequence.current;
    setLoading(true); setError(""); setView(target); setOffset(start); setData({});
    try {
      if (target === "dashboard") {
        const [dashboard, dashboardAppointments, dashboardLeads] = await Promise.all([
          adminApi().request<Dashboard>("/admin/dashboard"), adminApi().request<Appointment[]>("/admin/appointments?limit=5&offset=0"), adminApi().request<Lead[]>("/admin/leads?limit=5&offset=0"),
        ]);
        if (sequence.current === request) setData({ dashboard, dashboardAppointments, dashboardLeads });
      } else {
        const result = await adminApi().request(`/admin/${target}?limit=25&offset=${start}`);
        if (sequence.current === request) setData({ [target]: result });
      }
    } catch (reason) { if (sequence.current === request) fail(reason); }
    finally { if (sequence.current === request) setLoading(false); }
  }, [fail]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => adminApi().request("/auth/me")).then(value => { if (active) { setUser(parseUser(value)); void load("dashboard"); } }).catch(reason => { if (active) { fail(reason); setLoading(false); } });
    return () => { active = false; invalidateRequests(); };
  }, [fail, load, invalidateRequests]);
  async function logout() { setSaving(true); setError(""); try { await adminApi().request("/auth/logout", "POST"); setUser(null); setData({}); router.replace("/admin/login"); } catch (reason) { fail(reason); } finally { setSaving(false); } }
  async function saveProperty(value: PropertyInput) { setSaving(true); setError(""); setMessage(""); try { await adminApi().request(editing?.id ? `/properties/${editing.id}` : "/properties", editing?.id ? "PATCH" : "POST", value); setEditing(null); setMessage("Propiedad guardada."); await load("properties", offset); } catch (reason) { fail(reason); } finally { setSaving(false); } }
  async function saveAppointment(id: string, value: unknown) { setSaving(true); setError(""); setMessage(""); try { await adminApi().request(`/appointments/${id}`, "PATCH", value); setMessage("Cita actualizada."); await load("appointments", offset); } catch (reason) { fail(reason); } finally { setSaving(false); } }
  const filteredAppointments = useMemo(() => appointmentFilter === "all" ? data.appointments : data.appointments?.filter(item => item.status === appointmentFilter), [appointmentFilter, data.appointments]);
  const count = view === "dashboard" ? 0 : (data[view]?.length ?? 0);
  const metrics = data.dashboard ? [
    ["Solicitudes nuevas", data.dashboard.new_leads], ["Citas nuevas", data.dashboard.requested_appointments], ["Por confirmar", data.dashboard.pending_confirmation_appointments],
    ["Confirmadas", data.dashboard.confirmed_appointments], ["Próximas citas", data.dashboard.upcoming_appointments], ["Finalizadas", data.dashboard.completed_appointments], ["Propiedades publicadas", data.dashboard.published_properties],
  ] as const : [];

  return <main className={styles.shell}><div className={styles.container}>
    <nav className={styles.navigation}><a href="/">Volver al sitio</a>{user && <button disabled={saving} className={`${styles.button} ${styles.secondary}`} onClick={logout}>Cerrar sesión</button>}</nav>
    <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Operación comercial</p><h1 className={styles.heading}>Administración MHG</h1>{user && <p>{user.full_name} · {user.role === "admin" ? "Administrador" : "Personal de consulta"}</p>}</div></header>
    {error && <p className={styles.errors} role="alert">{error}</p>}{!user && !loading && <a href="/admin/login">Ir al inicio de sesión</a>}
    {user && <>
      <nav className={styles.actions} aria-label="Secciones administrativas">{(Object.keys(labels) as View[]).filter(key => key !== "properties" || user.role === "admin").map(key => <button key={key} disabled={saving} className={`${styles.navButton} ${key === view ? styles.navActive : ""}`} aria-current={key === view ? "page" : undefined} onClick={() => { setEditing(null); setMessage(""); void load(key); }}>{labels[key]}</button>)}</nav>
      <div className={styles.toolbar}><h2>{labels[view]}</h2><button disabled={loading || saving} className={`${styles.button} ${styles.secondary}`} onClick={() => void load(view, offset)}>Actualizar datos</button></div>
      {message && <p className={styles.message} role="status">{message}</p>}
      {view === "dashboard" && data.dashboard && <>
        <div className={styles.metrics}>{metrics.filter(([, value]) => value !== null).map(([label, value]) => <article key={label} className={styles.metric}><strong>{value}</strong><span>{label}</span></article>)}</div>
        <div className={styles.dashboardGrid}><section><h2>Próximas y pendientes</h2><div className={styles.list}>{data.dashboardAppointments?.filter(item => !["completed", "cancelled"].includes(item.status)).map(item => <button className={styles.preview} key={item.id} onClick={() => { setAppointmentFilter(item.status); void load("appointments"); }}><StatusBadge status={item.status} /><strong>{item.leads[0]?.name || "Sin cliente"}</strong><span>{date(item.confirmed_datetime || item.requested_datetime)} · {item.branch}</span></button>)}</div></section><section><h2>Solicitudes recientes</h2><div className={styles.list}>{data.dashboardLeads?.map(lead => <button className={styles.preview} key={lead.id} onClick={() => void load("leads")}><strong>{lead.name}</strong><span>{lead.submission?.folio || "Sin folio"} · {leadSourceLabels[lead.source] || humanLabel(lead.source)}</span><span>{date(lead.created_at)}</span></button>)}</div></section></div>
      </>}
      {view === "properties" && user.role === "admin" && <><button disabled={saving || loading} className={styles.button} onClick={() => { setEditing({ id: null, value: emptyProperty() }); setError(""); setMessage(""); }}>Crear propiedad</button>{editing && <PropertyForm key={editing.id ?? "new"} initial={editing.value} saving={saving} onSave={saveProperty} onCancel={() => setEditing(null)} />}<div className={styles.cards}>{data.properties?.map(item => <article className={styles.record} key={item.id}><h2>{item.title}</h2><span className={styles.badge}>{({ draft: "Borrador", published: "Publicada", archived: "Archivada" })[item.status]}</span><p>{item.price} {item.currency}</p><p>Actualizada: {date(item.updated_at)}</p><button disabled={saving} className={`${styles.button} ${styles.secondary}`} onClick={() => { setEditing({ id: item.id, value: item }); setError(""); setMessage(""); }}>Editar propiedad</button></article>)}</div></>}
      {view === "leads" && <div className={styles.list}>{data.leads?.map(item => <article className={styles.record} key={item.id}><header className={styles.cardHeader}><div><p className={styles.eyebrow}>{leadSourceLabels[item.source] || humanLabel(item.source)}</p><h2>{item.name}</h2></div><span className={styles.badge}>{leadStatusLabels[item.status] || humanLabel(item.status)}</span></header><div className={styles.detailGrid}><section><h4>Contacto</h4><ClientSummary lead={item} /><WhatsAppContact lead={item} /></section><section><h4>Solicitud</h4><p><strong>Folio:</strong> {item.submission?.folio || "Sin folio"}</p><p><strong>Llegó:</strong> {date(item.created_at)}</p><p>{item.message || "Sin observaciones"}</p></section><section><h4>Ubicación</h4>{item.address ? <Location item={{ address: item.address, latitude: item.latitude, longitude: item.longitude }} /> : <p>Sin dirección.</p>}</section><section><h4>Cita asociada</h4>{item.appointment ? <><StatusBadge status={item.appointment.status} /><p>{date(item.appointment.confirmed_datetime || item.appointment.requested_datetime)}</p><p>{item.appointment.branch}</p></> : <p>Sin cita.</p>}</section></div><TechnicalInfo values={[["ID de cliente", item.id], ["ID de propiedad", item.property_id], ["ID de configuración", item.kitchen_configuration_id], ["ID de cita", item.appointment_id]]} /></article>)}</div>}
      {view === "appointments" && <><nav className={styles.filters} aria-label="Filtrar citas"><button className={appointmentFilter === "all" ? styles.filterActive : ""} onClick={() => setAppointmentFilter("all")}>Todas</button>{statusOrder.map(status => <button key={status} className={appointmentFilter === status ? styles.filterActive : ""} onClick={() => setAppointmentFilter(status)}>{appointmentLabels[status]}</button>)}</nav><div className={styles.list}>{filteredAppointments?.map(item => <AppointmentCard key={item.id} item={item} user={user} saving={saving} onSave={saveAppointment} />)}</div></>}
      {view === "kitchen-configurations" && <div className={styles.list}>{data["kitchen-configurations"]?.map(item => <article className={styles.record} key={item.id}><header className={styles.cardHeader}><div><p className={styles.eyebrow}>Solicitud de cocina</p><h2>{item.submission?.folio || "Sin folio"}</h2></div><span className={styles.badge}>{item.branch}</span></header><div className={styles.detailGrid}><section><h4>Cliente</h4>{item.leads[0] ? <><ClientSummary lead={item.leads[0]} /><WhatsAppContact lead={item.leads[0]} /></> : <p>Sin cliente.</p>}</section><section><h4>Visita</h4><p>{date(item.requested_datetime)}</p><p>{item.advisor ? `Asesor: ${item.advisor}` : "Sin asesor asignado"}</p></section><section><h4>Ubicación</h4><Location item={item} /></section><section><h4>Observaciones</h4><p>{item.notes || "Sin observaciones"}</p></section></div><KitchenRows item={item} /><TechnicalInfo values={[["ID de configuración", item.id], ["ID de envío", item.submission?.id || null], ["Versión de selección", String(item.selection_version)]]} /></article>)}</div>}
      {!loading && !error && view !== "dashboard" && count === 0 && <div className={styles.empty}>No hay registros en esta página.</div>}
      {view !== "dashboard" && <div className={styles.toolbar}><button className={`${styles.button} ${styles.secondary}`} disabled={offset === 0 || loading || saving} onClick={() => void load(view, Math.max(0, offset - 25))}>Anterior</button><span>Página {offset / 25 + 1}</span><button className={`${styles.button} ${styles.secondary}`} disabled={count < 25 || loading || saving} onClick={() => void load(view, offset + 25)}>Siguiente</button></div>}
    </>}
    {loading && <p role="status">Cargando datos del servidor…</p>}
  </div></main>;
}
