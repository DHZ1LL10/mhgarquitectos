import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { AdminApi, ApiError, resolveAdminApiBaseUrl } from "../src/features/admin/api-client.ts";
import { initialSessionError } from "../src/features/admin/auth-state.ts";
import { appointmentWhatsAppMessage, appointmentWhatsAppUrl, confirmedDateTime, emptyProperty, leadWhatsAppUrl, localDateTime, openStreetMapUrl, parseUser, phoneDigits, propertyInput, transitions } from "../src/features/admin/contracts.ts";

test("admin HTTP client sends cookies, CSRF header and no cache", async () => {
  const client = new AdminApi("https://api.example.com/api/v1/", async (url, options) => {
    assert.equal(url, "https://api.example.com/api/v1/auth/login");
    assert.equal(options?.credentials, "include");
    assert.equal(options?.cache, "no-store");
    assert.equal(options?.method, "POST");
    assert.equal(new Headers(options?.headers).get("x-mhg-admin"), "1");
    assert.equal(new Headers(options?.headers).get("authorization"), null);
    assert.deepEqual(JSON.parse(options?.body as string), { email: "test@example.com", password: "test-only" });
    return Response.json({ id: "test" });
  });
  assert.deepEqual(await client.request("/auth/login", "POST", { email: "test@example.com", password: "test-only" }), { id: "test" });
});

test("default browser fetch keeps the global receiver and reaches /auth/me", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = function (this: typeof globalThis, url, options) {
    assert.equal(this, globalThis);
    assert.equal(url, "http://localhost:8000/api/v1/auth/me");
    assert.equal(options?.credentials, "include");
    calls++;
    return Promise.resolve(Response.json({ error: { message: "Authentication required" } }, { status: 401 }));
  } as typeof fetch;
  try {
    const client = new AdminApi("http://localhost:8000/api/v1");
    await assert.rejects(client.request("/auth/me"), error => error instanceof ApiError && error.status === 401);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("initial /auth/me 401 means unauthenticated rather than network failure", () => {
  assert.equal(initialSessionError(new ApiError(401, "Tu sesión no está activa.")), "");
  assert.equal(initialSessionError(new ApiError(0, "No se pudo conectar con la API.")), "No se pudo conectar con la API.");
});

test("login 401 is presented as invalid credentials", async () => {
  const client = new AdminApi("http://localhost:8000/api/v1", async (url, options) => {
    assert.equal(url, "http://localhost:8000/api/v1/auth/login");
    assert.equal(options?.credentials, "include");
    return Response.json({ error: { message: "Authentication failed" } }, { status: 401 });
  });
  await assert.rejects(client.request("/auth/login", "POST", { email: "bad@example.com", password: "bad" }), error => error instanceof ApiError && error.status === 401 && error.message === "Credenciales incorrectas.");
});

test("API URL construction accepts local HTTP and rejects file URLs", () => {
  assert.doesNotThrow(() => new AdminApi("http://localhost:8000/api/v1"));
  assert.throws(() => new AdminApi("file:///api/v1"), error => error instanceof ApiError && error.status === 0);
  assert.equal(resolveAdminApiBaseUrl("http://localhost:8000/api/v1"), "http://localhost:8000/api/v1");
  assert.equal(resolveAdminApiBaseUrl(""), "");
});

test("admin login route imports the client component and real submit handler", () => {
  const page = readFileSync(new URL("../src/app/(management)/admin/login/page.tsx", import.meta.url), "utf8");
  const login = readFileSync(new URL("../src/features/admin/Login.tsx", import.meta.url), "utf8");
  assert.match(page, /import Login from "@\/features\/admin\/Login"/);
  assert.match(login, /^"use client";/);
  assert.match(login, /onSubmit=\{submit\}/);
  assert.match(login, /request\("\/auth\/login", "POST"/);
});

for (const status of [401, 403, 409, 422, 429, 500]) {
  test(`admin HTTP error ${status} retains status for correct UI handling`, async () => {
    const client = new AdminApi("https://api.example.com/api/v1", async () => Response.json({ error: { message: "Rejected" } }, { status }));
    await assert.rejects(client.request("/admin/properties"), error => error instanceof ApiError && error.status === status);
  });
}

test("network failure never retries a write; logout supports empty response", async () => {
  let calls = 0;
  const failing = new AdminApi("https://api.example.com/api/v1", async () => { calls++; throw new TypeError("offline"); });
  await assert.rejects(failing.request("/properties", "POST", {}), error => error instanceof ApiError && error.status === 0);
  assert.equal(calls, 1);
  const client = new AdminApi("https://api.example.com/api/v1", async () => new Response(null, { status: 204 }));
  assert.equal(await client.request("/auth/logout", "POST"), undefined);
  assert.throws(() => new AdminApi(""));
  assert.throws(() => new AdminApi("https://user:secret@api.example.com"));
});

test("property writes strip database identity and preserve decimals, images and coordinates", () => {
  const property = { ...emptyProperty(), id: "database-id", created_at: "now", price: "2500000.50", latitude: 19, longitude: -98, images: [{ url: "/img/a.jpg", alt: "A", width: 100, height: 50, object_key: null, id: "image-id", position: 0 }] };
  const payload = propertyInput(property);
  assert.equal(payload.price, "2500000.50");
  assert.equal(payload.latitude, 19);
  assert.equal("id" in payload, false);
  assert.equal("id" in payload.images[0], false);
  assert.equal("position" in payload.images[0], false);
  payload.location.city = "Changed";
  assert.equal(property.location.city, "");
});

test("appointment form preserves timezone and exposes only supported transitions", () => {
  const iso = "2030-10-12T16:00:00.000Z";
  assert.equal(confirmedDateTime(localDateTime(iso)), iso);
  assert.equal(confirmedDateTime(""), null);
  assert.throws(() => confirmedDateTime("invalid"));
  assert.deepEqual(transitions.completed, []);
  assert.deepEqual(transitions.cancelled, []);
  assert.equal(transitions.requested.includes("completed"), false);
});

test("user contract fails closed for inactive and unknown roles", () => {
  const user = { id: "id", full_name: "Admin", email: "a@example.com", role: "admin", is_active: true, last_login_at: null };
  assert.equal(parseUser(user).role, "admin");
  assert.throws(() => parseUser({ ...user, role: "unknown" }));
  assert.throws(() => parseUser({ ...user, is_active: false }));
});

test("admin client and UI do not persist tokens or use demo storage", () => {
  for (const file of ["Login.tsx", "api-client.ts", "layout/AdminShell.tsx", "shared/session.tsx"]) {
    const source = readFileSync(new URL(`../src/features/admin/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|saveDemoProperty|createDemoProperties/);
  }
});

test("admin contact links use real lead phone, folio and OpenStreetMap", () => {
  const lead = { name: "María", phone: "272 220 0485", submission: { folio: "MHG-ABC" }, appointment: { requested_datetime: "2030-10-12T16:00:00.000Z", confirmed_datetime: null, status: "pending_confirmation", branch: "Fortín", address: "Centro", latitude: 19.043, longitude: -98.198 } };
  const whatsapp = leadWhatsAppUrl(lead as never);
  assert.match(whatsapp || "", /^https:\/\/wa\.me\/522722200485\?text=/);
  assert.match(decodeURIComponent(whatsapp || ""), /MHG-ABC/);
  assert.match(decodeURIComponent(whatsapp || ""), /Fortín/);
  const decoded = decodeURIComponent(whatsapp || "");
  assert.match(decoded, /12 de octubre de 2030/);
  assert.match(decoded, /Hora: .*10:00/);
  assert.match(decoded, /Queremos confirmar/);
  assert.doesNotMatch(decoded, /�/);
  assert.match(whatsapp || "", /%F0%9F%91%8B/);
  assert.match(openStreetMapUrl(19.043, -98.198) || "", /openstreetmap\.org/);
  assert.equal(openStreetMapUrl(null, -98.198), null);
});

test("pending and confirmed WhatsApp templates preserve Unicode, date, time and URL encoding", () => {
  const base = { name: "María", phone: "272 220 0485", submission: { folio: "COC-00003" }, appointment: { requested_datetime: "2030-10-12T16:00:00.000Z", confirmed_datetime: "2030-10-12T17:30:00.000Z", status: "confirmed", branch: "Fortín", address: "Mata Larga", latitude: 18.9, longitude: -96.97 } } as never;
  const pending = appointmentWhatsAppMessage(base, "pending");
  const confirmed = appointmentWhatsAppMessage(base, "confirmed");
  assert.match(pending, /Fecha propuesta:/); assert.match(pending, /Hora:/); assert.match(pending, /¿Te funciona este horario\?/);
  assert.match(confirmed, /quedó confirmada/); assert.match(confirmed, /Fecha:/); assert.match(confirmed, /Hora:/);
  assert.match(pending, /👋/); assert.match(confirmed, /📋/); assert.doesNotMatch(pending + confirmed, /�/);
  const encoded = appointmentWhatsAppUrl(base, "confirmed") || "";
  assert.equal(decodeURIComponent(encoded.split("?text=")[1]), confirmed);
  assert.match(encoded, /%F0%9F%91%8B/);
});

test("synthetic or malformed phone numbers never produce external actions", () => {
  assert.equal(phoneDigits("0000000001"), null);
  assert.equal(phoneDigits("sin teléfono"), null);
  assert.equal(phoneDigits("272 220 0485"), "522722200485");
});
