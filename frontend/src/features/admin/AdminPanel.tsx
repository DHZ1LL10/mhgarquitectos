"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "./api-client";
import { appointmentLabels, emptyProperty, parseUser } from "./contracts";
import type { Appointment, Dashboard, Kitchen, Lead, Property, PropertyInput, User } from "./types";
import PropertyForm from "./PropertyForm";
import AppointmentForm from "./AppointmentForm";
import styles from "../properties/styles/admin.module.css";

type View = "dashboard" | "properties" | "leads" | "appointments" | "kitchen-configurations";
type Data = { dashboard?: Dashboard; properties?: Property[]; leads?: Lead[]; appointments?: Appointment[]; "kitchen-configurations"?: Kitchen[] };
const labels: Record<View, string> = { dashboard: "Dashboard", properties: "Propiedades", leads: "Leads", appointments: "Citas", "kitchen-configurations": "Configuraciones de cocina" };
const date = (value: string | null) => value ? new Date(value).toLocaleString("es-MX") : "Sin confirmar";
function Contacts({ leads }: { leads: Lead[] }) { return leads.length ? <ul>{leads.map(lead => <li key={lead.id}>{lead.name} · {lead.phone}{lead.email ? ` · ${lead.email}` : ""}</li>)}</ul> : <p>Sin cliente relacionado.</p>; }
function Location({ item }: { item: { address: string; latitude: number | null; longitude: number | null } }) { return <p>{item.address}{item.latitude !== null && item.longitude !== null && <> · {item.latitude}, {item.longitude}</>}</p>; }
function Snapshot({ value }: { value: unknown }) {
  if (value == null) return <span>Sin selección</span>;
  if (Array.isArray(value)) return value.length ? <ul>{value.map((item, index) => <li key={index}><Snapshot value={item} /></li>)}</ul> : <span>Ninguno</span>;
  if (typeof value === "object") return <dl>{Object.entries(value).map(([key, item]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd><Snapshot value={item} /></dd></div>)}</dl>;
  return <span>{String(value)}</span>;
}

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [data, setData] = useState<Data>({});
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; value: PropertyInput } | null>(null);
  const sequence = useRef(0);
  const invalidateRequests = useCallback(() => { sequence.current++; }, []);
  const fail = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) { setUser(null); setData({}); setEditing(null); router.replace("/admin/login"); }
    setError(error instanceof Error ? error.message : "No se pudo completar la operación.");
  }, [router]);
  const load = useCallback(async (target: View, start = 0) => {
    const request = ++sequence.current;
    setLoading(true); setError(""); setView(target); setOffset(start); setData({});
    try {
      const result = await adminApi().request(`/admin/${target}?limit=25&offset=${start}`);
      if (sequence.current === request) setData({ [target]: result });
    } catch (error) { if (sequence.current === request) fail(error); }
    finally { if (sequence.current === request) setLoading(false); }
  }, [fail]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => adminApi().request("/auth/me")).then(value => {
      if (!active) return;
      setUser(parseUser(value)); void load("dashboard");
    }).catch(error => { if (active) { fail(error); setLoading(false); } });
    return () => { active = false; invalidateRequests(); };
  }, [fail, load, invalidateRequests]);
  async function logout() {
    setSaving(true); setError("");
    try { await adminApi().request("/auth/logout", "POST"); setUser(null); setData({}); router.replace("/admin/login"); }
    catch (error) { fail(error); } finally { setSaving(false); }
  }
  async function saveProperty(value: PropertyInput) {
    setSaving(true); setError(""); setMessage("");
    try {
      await adminApi().request(editing?.id ? `/properties/${editing.id}` : "/properties", editing?.id ? "PATCH" : "POST", value);
      setEditing(null); setMessage("Propiedad guardada en PostgreSQL."); await load("properties", offset);
    } catch (error) { fail(error); } finally { setSaving(false); }
  }
  async function saveAppointment(id: string, value: unknown) {
    setSaving(true); setError(""); setMessage("");
    try { await adminApi().request(`/appointments/${id}`, "PATCH", value); setMessage("Cita guardada en PostgreSQL."); await load("appointments", offset); }
    catch (error) { fail(error); } finally { setSaving(false); }
  }
  const count = view === "dashboard" ? 0 : (data[view]?.length ?? 0);
  return <main className={styles.shell}><div className={styles.container}>
    <nav className={styles.navigation}><a href="/">Volver al sitio</a>{user && <button disabled={saving} className={`${styles.button} ${styles.secondary}`} onClick={logout}>Cerrar sesión</button>}</nav>
    <h1 className={styles.heading}>Administración MHG</h1>
    {user && <p>{user.full_name} · {user.role === "admin" ? "Administrador" : "Personal de consulta"}</p>}
    {error && <p className={styles.errors} role="alert">{error}</p>}
    {!user && !loading && <a href="/admin/login">Ir al inicio de sesión</a>}
    {user && <>
      <nav className={styles.actions} aria-label="Secciones administrativas">{(Object.keys(labels) as View[]).filter(key => key !== "properties" || user.role === "admin").map(key => <button key={key} disabled={saving} className={`${styles.button} ${key === view ? "" : styles.secondary}`} aria-current={key === view ? "page" : undefined} onClick={() => { setEditing(null); setMessage(""); void load(key); }}>{labels[key]}</button>)}</nav>
      <div className={styles.toolbar}><h2>{labels[view]}</h2><button disabled={loading || saving} className={`${styles.button} ${styles.secondary}`} onClick={() => void load(view, offset)}>Actualizar datos</button></div>
      {message && <p className={styles.message} role="status">{message}</p>}
      {view === "dashboard" && data.dashboard && <div className={styles.cards}>{Object.entries(data.dashboard).filter(([, value]) => value !== null).map(([key, value]) => <article className={styles.record} key={key}><h2>{labels[key === "kitchen_configurations" ? "kitchen-configurations" : key as View]}</h2><p>{value} registros</p></article>)}</div>}
      {view === "properties" && user.role === "admin" && <>
        <button disabled={saving || loading} className={styles.button} onClick={() => { setEditing({ id: null, value: emptyProperty() }); setError(""); setMessage(""); }}>Crear propiedad</button>
        {editing && <PropertyForm key={editing.id ?? "new"} initial={editing.value} saving={saving} onSave={saveProperty} onCancel={() => setEditing(null)} />}
        <div className={styles.cards}>{data.properties?.map(item => <article className={styles.record} key={item.id}><h2>{item.title}</h2><span className={styles.badge}>{({ draft: "Borrador", published: "Publicado", archived: "Archivado" })[item.status]}</span><p>{item.price} {item.currency}</p><p>{item.slug}</p><p>Actualizado: {date(item.updated_at)}</p><button disabled={saving} className={`${styles.button} ${styles.secondary}`} onClick={() => { setEditing({ id: item.id, value: item }); setError(""); setMessage(""); }}>Editar propiedad</button></article>)}</div>
      </>}
      {view === "leads" && <div className={styles.list}>{data.leads?.map(item => <article className={styles.record} key={item.id}><h2>{item.name}</h2><p>{item.phone} · {item.email || "Sin email"}</p><p>Origen: {item.source} · Estado: {item.status}</p><p>{item.message}</p><p>Propiedad: {item.property_id || "Sin asociación"}</p><p>Configuración: {item.kitchen_configuration_id || "Sin asociación"}</p><p>Cita: {item.appointment_id || "Sin asociación"}</p><p>{date(item.created_at)}</p></article>)}</div>}
      {view === "appointments" && <div className={styles.list}>{data.appointments?.map(item => <article className={styles.record} key={item.id}><h2>{appointmentLabels[item.status]} · {item.branch}</h2><p>ID: {item.id}</p><Contacts leads={item.leads} /><p>Solicitada: {date(item.requested_datetime)} · Confirmada: {date(item.confirmed_datetime)}</p><Location item={item} /><p>{item.notes}</p>{user.role === "admin" && <AppointmentForm key={item.updated_at} item={item} saving={saving} onSave={saveAppointment} />}</article>)}</div>}
      {view === "kitchen-configurations" && <div className={styles.list}>{data["kitchen-configurations"]?.map(item => <article className={styles.record} key={item.id}><h2>Configuración · {item.branch}</h2><p>ID: {item.id}</p><Contacts leads={item.leads} /><p>Situación: {item.current_situation}</p><Location item={item} /><p>Asesor: {item.advisor || "Sin asignar"} · Solicitada: {date(item.requested_datetime)}</p><p>{item.notes}</p>
        {([["Tablero interior", item.interior_board], ["Frentes exteriores", item.exterior_fronts], ["Herrajes", item.hardware], ["Cubierta", item.countertop], ["Acabado", item.finish], ["Extras", item.extras]] as const).map(([label, value]) => <section key={label}><h3>{label}</h3><Snapshot value={value} /></section>)}
        <h3>Citas asociadas</h3>{item.appointments.length ? item.appointments.map(appointment => <p key={appointment.id}>{appointment.id} · {appointmentLabels[appointment.status]} · {date(appointment.requested_datetime)}</p>) : <p>Sin cita asociada.</p>}
        <p>Creada: {date(item.created_at)} · Actualizada: {date(item.updated_at)}</p><details><summary>Selecciones completas · versión {item.selection_version}</summary><Snapshot value={item.selections} /></details>
      </article>)}</div>}
      {!loading && !error && view !== "dashboard" && count === 0 && <p>No hay registros en esta página.</p>}
      {view !== "dashboard" && <div className={styles.toolbar}><button className={`${styles.button} ${styles.secondary}`} disabled={offset === 0 || loading || saving} onClick={() => void load(view, Math.max(0, offset - 25))}>Anterior</button><span>Página {offset / 25 + 1}</span><button className={`${styles.button} ${styles.secondary}`} disabled={count < 25 || loading || saving} onClick={() => void load(view, offset + 25)}>Siguiente</button></div>}
    </>}
    {loading && <p role="status">Cargando datos del servidor…</p>}
  </div></main>;
}
