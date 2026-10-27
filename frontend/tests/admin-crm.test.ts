import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { buildActivityEvents } from "../src/features/admin/dashboard/activity.ts";
import { buildClientActivity } from "../src/features/admin/dashboard/activity.ts";
import {
  buildDashboardAttention,
  classifyAppointmentTemporal,
  compactIdentifier,
  deriveClientNextAction,
  parseWeekStart,
  shiftWeek,
  todayAppointmentCue,
  weekParam,
} from "../src/features/admin/shared/operations.ts";
import { moveImage, publicationCopy, publicationIssues, slugAfterTitleChange, slugifyPropertyTitle } from "../src/features/admin/properties/property-utils.ts";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("admin uses real routes and a shared CRM shell instead of a monolithic view state", () => {
  const routes = ["page.tsx", "clientes/page.tsx", "clientes/[id]/page.tsx", "citas/page.tsx", "citas/[id]/page.tsx", "cocinas/page.tsx", "cocinas/[id]/page.tsx", "propiedades/page.tsx", "propiedades/nueva/page.tsx", "propiedades/[id]/page.tsx"];
  for (const route of routes) assert.equal(existsSync(new URL(`../src/app/(management)/admin/(crm)/${route}`, import.meta.url)), true, route);
  assert.equal(existsSync(new URL("../src/features/admin/AdminPanel.tsx", import.meta.url)), false);
  assert.match(source("src/app/(management)/admin/(crm)/layout.tsx"), /AdminShell/);
});

test("sidebar exposes only permitted navigation and reserves users for owner", () => {
  const shell = source("src/features/admin/layout/AdminShell.tsx");
  for (const route of ["/admin/clientes", "/admin/citas", "/admin/cocinas", "/admin/propiedades"]) assert.match(shell, new RegExp(route));
  assert.match(shell, /properties\.view/);
  assert.match(shell, /ownerOnly: true/);
  assert.match(shell, /user\.role === "owner"/);
  assert.match(shell, /aria-current/);
  assert.match(shell, /aria-expanded/);
});

test("dashboard KPIs link to actionable filters and uses one lightweight chart", () => {
  const dashboard = source("src/features/admin/dashboard/DashboardView.tsx");
  assert.match(dashboard, /clientes\?estado=new/);
  assert.match(dashboard, /citas\?estado=pending_confirmation/);
  assert.match(dashboard, /citas\?periodo=today/);
  assert.match(dashboard, /citas\?periodo=upcoming/);
  assert.match(dashboard, /styles\.chartBar/);
  assert.match(dashboard, /Actividad reciente/);
});

test("dashboard activity keys remain unique for equal labels and timestamps", () => {
  const timestamp = "2026-10-25T22:44:48.739798Z";
  const events = buildActivityEvents([
    { id: "lead-a", name: "Cliente A", created_at: timestamp },
    { id: "lead-b", name: "Cliente B", created_at: timestamp },
  ], []);
  assert.equal(events[0].label, events[1].label);
  assert.equal(events[0].at, events[1].at);
  assert.notEqual(events[0].entityId, events[1].entityId);
  assert.equal(new Set(events.map(event => event.key)).size, events.length);
  assert.deepEqual(events.map(event => event.key).sort(), [
    `lead-created:lead-a:${timestamp}`,
    `lead-created:lead-b:${timestamp}`,
  ]);
});

const appointment = (id: string, status: "requested" | "pending_confirmation" | "confirmed" | "completed" | "cancelled", date: string) => ({
  id, status, requested_datetime: date, confirmed_datetime: status === "confirmed" || status === "completed" ? date : null,
  branch: "Fortín", address: "Centro, Fortín", latitude: null, longitude: null, notes: null,
  created_at: date, updated_at: date, leads: [], submission: null,
});

test("temporal rules distinguish overdue, today, upcoming and terminal appointments", () => {
  const now = new Date("2026-10-25T18:00:00-06:00");
  assert.equal(classifyAppointmentTemporal(appointment("past", "pending_confirmation", "2026-10-25T10:00:00-06:00"), now), "overdue");
  assert.equal(classifyAppointmentTemporal(appointment("today", "confirmed", "2026-10-25T19:00:00-06:00"), now), "today");
  assert.equal(classifyAppointmentTemporal(appointment("future", "requested", "2026-10-27T10:00:00-06:00"), now), "upcoming");
  assert.equal(classifyAppointmentTemporal(appointment("done", "completed", "2026-10-24T10:00:00-06:00"), now), "completed");
  assert.equal(classifyAppointmentTemporal(appointment("cancelled", "cancelled", "2026-10-27T10:00:00-06:00"), now), "cancelled");
  assert.equal(todayAppointmentCue(appointment("late", "requested", "2026-10-25T10:00:00-06:00"), now), "Horario vencido · requiere seguimiento");
  assert.equal(todayAppointmentCue(appointment("close", "confirmed", "2026-10-25T10:00:00-06:00"), now), "Pendiente de cerrar");
});

test("dashboard attention prioritizes overdue, today, new leads and future pending", () => {
  const now = new Date("2026-10-25T12:00:00-06:00");
  const items = buildDashboardAttention(
    [{ id: "lead-new", name: "Nuevo", status: "new", created_at: "2026-10-25T09:00:00-06:00" }],
    [
      appointment("future", "pending_confirmation", "2026-10-28T10:00:00-06:00"),
      appointment("today", "pending_confirmation", "2026-10-25T16:00:00-06:00"),
      appointment("overdue", "requested", "2026-10-24T10:00:00-06:00"),
    ],
    now,
  );
  assert.deepEqual(items.map(item => item.key), ["appointment:overdue", "appointment:today", "lead:lead-new", "appointment:future"]);
});

test("client next action follows the persisted appointment without creating tasks", () => {
  const now = new Date("2026-10-25T12:00:00-06:00");
  const overdue = appointment("late", "pending_confirmation", "2026-10-24T10:00:00-06:00");
  assert.equal(deriveClientNextAction({ id: "lead", status: "new", appointment: overdue }, now).title, "Retomar cita vencida");
  assert.equal(deriveClientNextAction({ id: "lead", status: "new", appointment: null }, now).title, "Contactar al cliente");
});

test("week navigation uses a stable Monday query parameter", () => {
  const selected = parseWeekStart("2026-10-21");
  assert.equal(weekParam(selected), "2026-10-19");
  assert.equal(weekParam(shiftWeek(selected, -1)), "2026-10-12");
  assert.equal(weekParam(shiftWeek(selected, 1)), "2026-10-26");
});

test("client activity preserves events sharing a timestamp with stable keys", () => {
  const timestamp = "2026-10-25T10:00:00Z";
  const events = buildClientActivity({ id: "lead-a", created_at: timestamp, updated_at: timestamp, appointment: appointment("appointment-a", "confirmed", timestamp) });
  assert.equal(events.filter(event => event.at === timestamp).length, 3);
  assert.equal(new Set(events.map(event => event.key)).size, events.length);
});

test("compact folios preserve complete COC folios and expose long legacy identifiers", () => {
  assert.deepEqual(compactIdentifier("COC-00042"), { display: "COC-00042", full: "COC-00042", truncated: false });
  const legacy = compactIdentifier("legacy-validation-folio-1234567890");
  assert.equal(legacy.truncated, true);
  assert.equal(legacy.full, "legacy-validation-folio-1234567890");
  assert.match(legacy.display, /…/);
});

test("property helpers support automatic slugs, image ordering and publication consequences", () => {
  assert.equal(slugifyPropertyTitle("Residencia en Mata Larga, Fortín"), "residencia-en-mata-larga-fortin");
  assert.equal(slugAfterTitleChange("Título nuevo", "titulo-anterior", false), "titulo-nuevo");
  assert.equal(slugAfterTitleChange("Título nuevo", "slug-manual", true), "slug-manual");
  const images = [
    { url: "/a.jpg", alt: "A", width: 10, height: 10, object_key: null },
    { url: "/b.jpg", alt: "B", width: 10, height: 10, object_key: null },
  ];
  assert.deepEqual(moveImage(images, 1, 0).map(image => image.url), ["/b.jpg", "/a.jpg"]);
  assert.match(publicationCopy("published"), /landing, catálogo y detalle público/);
  assert.match(publicationCopy("draft"), /No visible públicamente/);
  assert.deepEqual(publicationIssues({ slug: "casa", title: "Casa", description: "Lista", status: "published", operation: "sale", property_type: "house", price: "0", currency: "MXN", location: { city: "Fortín", state: "Veracruz", neighborhood: "Centro" }, features: { area_m2: 0, bedrooms: 0, bathrooms: 0, parking_spaces: null }, latitude: null, longitude: null, images: [] }), ["superficie", "precio", "fotografías"]);
  const form = source("src/features/admin/PropertyForm.tsx");
  assert.match(form, /<img/); assert.match(form, /onError=/); assert.match(form, /Portada/);
});

test("client CRM has table, filters, record page, contact actions and permission-guarded status update", () => {
  const list = source("src/features/admin/clients/ClientsView.tsx");
  const detail = source("src/features/admin/clients/ClientDetailView.tsx");
  assert.match(list, /<table/); assert.match(list, /Buscar nombre/); assert.match(list, /Filtrar por estado/); assert.match(list, /Próxima cita/);
  assert.match(detail, /Datos del cliente/); assert.match(detail, /Actividad/); assert.match(detail, /Cita asociada/); assert.match(detail, /Proyecto de cocina/);
  assert.match(detail, /can\(user, "clients\.manage"\)/); assert.match(detail, /\/leads\/\$\{lead\.id\}\/status/);
});

test("appointments provide list, weekly agenda, filters and guarded workflow actions", () => {
  const list = source("src/features/admin/appointments/AppointmentsView.tsx");
  const detail = source("src/features/admin/appointments/AppointmentDetailView.tsx");
  assert.match(list, /Agenda semanal/); assert.match(list, /periodo/); assert.match(list, /estado/); assert.match(list, /WeekAgenda/);
  assert.match(detail, /Confirmar cita/); assert.match(detail, /Marcar finalizada/); assert.match(detail, /window\.confirm/); assert.match(detail, /Enviar confirmación por WhatsApp/);
});

test("kitchens and properties use table/detail flows with hierarchical editing", () => {
  const kitchens = source("src/features/admin/kitchens/KitchensView.tsx") + source("src/features/admin/kitchens/KitchenDetailView.tsx");
  const properties = source("src/features/admin/properties/PropertiesView.tsx") + source("src/features/admin/PropertyForm.tsx");
  assert.match(kitchens, /<table/); assert.match(kitchens, /Resumen de selección/); assert.match(kitchens, /Imprimir \/ guardar PDF/);
  assert.match(properties, /<table/); assert.match(properties, /Nueva propiedad/);
  for (const section of ["Información general", "Ubicación", "Características", "Precio", "Fotografías", "Publicación"]) assert.match(properties, new RegExp(section));
});
