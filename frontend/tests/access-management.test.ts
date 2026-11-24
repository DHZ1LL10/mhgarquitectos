import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { can, normalizePermissions, permissionPresets, secureTemporaryPassword } from "../src/features/admin/permissions.ts";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("owner bypasses flags and staff permissions remain explicit", () => {
  const base = { id: "1", email: "x@example.com", full_name: "X", is_active: true, must_change_password: false, last_login_at: null } as const;
  assert.equal(can({ ...base, role: "owner", permissions: [] }, "properties.publish"), true);
  assert.equal(can({ ...base, role: "staff", permissions: ["appointments.view"] }, "appointments.view"), true);
  assert.equal(can({ ...base, role: "staff", permissions: ["appointments.view"] }, "appointments.manage"), false);
});

test("permission dependencies close invalid child toggles and presets exclude properties", () => {
  assert.deepEqual(normalizePermissions(["clients.manage", "properties.publish"]), []);
  assert.deepEqual(normalizePermissions(["properties.view", "properties.manage", "properties.publish"]), ["properties.view", "properties.manage", "properties.publish"]);
  for (const values of Object.values(permissionPresets)) assert.equal(values.some(value => value.startsWith("properties.")), false);
});

test("temporary password generator produces a 20-character value without persistence", () => {
  const password = secureTemporaryPassword((array: Uint32Array<ArrayBuffer>) => { array.fill(7); return array; });
  assert.equal(password.length, 20);
  const editor = source("src/features/admin/users/UserEditor.tsx");
  assert.doesNotMatch(editor, /localStorage|sessionStorage/);
  assert.match(editor, /navigator\.clipboard/);
  assert.match(editor, /no se volverá a mostrar/i);
});

test("first-login flow redirects and backend-shaped UI exposes permission guards", () => {
  const login = source("src/features/admin/Login.tsx");
  const session = source("src/features/admin/shared/session.tsx");
  const shell = source("src/features/admin/layout/AdminShell.tsx");
  assert.match(login + session, /must_change_password/);
  assert.match(login + session, /\/admin\/cambiar-contrasena/);
  assert.match(shell, /No tienes permiso para acceder a esta sección/);
  assert.match(shell, /ownerOnly/);
});

test("advisor catalog is exact, frozen and separate from admin users", () => {
  const context = { window: {} as Record<string, unknown>, Object };
  vm.runInNewContext(source("public/advisor-catalog.js"), context);
  const catalog = context.window.MHGAdvisorCatalog as { advisors: string[]; isValid(value: string): boolean };
  assert.deepEqual(Array.from(catalog.advisors), ["Cotización en línea", "Arq. Max Herrera", "Arq. Marco Rodriguez", "Arq. Daniel Aguilar", "Arq. Monse Galicia", "Arq. Itzel Suarez", "Lic. Alma Altamirano"]);
  assert.equal(catalog.isValid(""), false);
  assert.equal(Object.isFrozen(catalog.advisors), true);
  assert.doesNotMatch(source("src/features/admin/users/UserEditor.tsx"), /Max Herrera|Marco Rodriguez|Daniel Aguilar|Monse Galicia|Itzel Suarez|Alma Altamirano/);
});

test("advisor propagates to summary, PDF, WhatsApp and admin details", () => {
  const customizer = source("public/cotizador.js");
  assert.match(customizer, /label:'Atendido por'/);
  assert.match(customizer, /row\('Atendido por:'\s*,\s*state\.cliente\.asesor/);
  assert.match(customizer, /\*Atendido por:\*.*state\.cliente\.asesor/);
  assert.match(source("src/features/admin/kitchens/KitchenDetailView.tsx"), /item\.advisor/);
  assert.match(source("src/features/admin/clients/ClientDetailView.tsx"), /lead\.advisor/);
  assert.match(source("src/features/admin/appointments/AppointmentDetailView.tsx"), /lead\.advisor/);
});
