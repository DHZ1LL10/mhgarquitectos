import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { AdminApi, ApiError } from "../src/features/admin/api-client.ts";
import { initialSessionError } from "../src/features/admin/auth-state.ts";
import { confirmedDateTime, emptyProperty, leadWhatsAppUrl, localDateTime, openStreetMapUrl, parseUser, propertyInput, transitions } from "../src/features/admin/contracts.ts";

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
  for (const file of ["AdminPanel.tsx", "Login.tsx", "api-client.ts"]) {
    const source = readFileSync(new URL(`../src/features/admin/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|saveDemoProperty|createDemoProperties/);
  }
});

test("admin contact links use real lead phone, folio and OpenStreetMap", () => {
  const lead = { name: "María", phone: "272 220 0485", submission: { folio: "MHG-ABC" } };
  const whatsapp = leadWhatsAppUrl(lead as never);
  assert.match(whatsapp || "", /^https:\/\/wa\.me\/522722200485\?text=/);
  assert.match(decodeURIComponent(whatsapp || ""), /MHG-ABC/);
  assert.match(openStreetMapUrl(19.043, -98.198) || "", /openstreetmap\.org/);
  assert.equal(openStreetMapUrl(null, -98.198), null);
});
