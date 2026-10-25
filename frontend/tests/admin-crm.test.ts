import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("admin uses real routes and a shared CRM shell instead of a monolithic view state", () => {
  const routes = ["page.tsx", "clientes/page.tsx", "clientes/[id]/page.tsx", "citas/page.tsx", "citas/[id]/page.tsx", "cocinas/page.tsx", "cocinas/[id]/page.tsx", "propiedades/page.tsx", "propiedades/nueva/page.tsx", "propiedades/[id]/page.tsx"];
  for (const route of routes) assert.equal(existsSync(new URL(`../src/app/(management)/admin/(crm)/${route}`, import.meta.url)), true, route);
  assert.equal(existsSync(new URL("../src/features/admin/AdminPanel.tsx", import.meta.url)), false);
  assert.match(source("src/app/(management)/admin/(crm)/layout.tsx"), /AdminShell/);
});

test("sidebar exposes business navigation and hides properties from staff", () => {
  const shell = source("src/features/admin/layout/AdminShell.tsx");
  for (const route of ["/admin/clientes", "/admin/citas", "/admin/cocinas", "/admin/propiedades"]) assert.match(shell, new RegExp(route));
  assert.match(shell, /adminOnly: true/);
  assert.match(shell, /user\.role === "admin"/);
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

test("client CRM has table, filters, record page, contact actions and admin-only status update", () => {
  const list = source("src/features/admin/clients/ClientsView.tsx");
  const detail = source("src/features/admin/clients/ClientDetailView.tsx");
  assert.match(list, /<table/); assert.match(list, /Buscar nombre/); assert.match(list, /Filtrar por estado/); assert.match(list, /Próxima cita/);
  assert.match(detail, /Datos del cliente/); assert.match(detail, /Actividad/); assert.match(detail, /Cita asociada/); assert.match(detail, /Proyecto de cocina/);
  assert.match(detail, /user\.role === "admin"/); assert.match(detail, /\/leads\/\$\{lead\.id\}\/status/);
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
