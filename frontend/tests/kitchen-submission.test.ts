import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/kitchen-submission.js", import.meta.url), "utf8");
const context: Record<string, unknown> = { URL, Uint8Array };
vm.runInNewContext(source, context);
type BuiltPayload = {
  contact: { source: string; email: string | null };
  configuration: { current_situation: string; hardware: { basureros: { not_applicable: boolean } }; selection_version: number; address: string; requested_datetime: string };
  appointment: { address: string; requested_datetime: string };
};
const contract = context.MHGKitchenSubmission as {
  buildPayload(state: unknown): BuiltPayload;
  identityFor(previous: unknown, payload: unknown, crypto: unknown): { key: string; fingerprint: string };
  openStreetMapUrl(latitude: number, longitude: number): string;
  parseReceipt(value: unknown): Record<string, unknown>;
  send(base: string, payload: unknown, identity: { key: string }, fetcher: typeof fetch): Promise<Record<string, unknown>>;
};

function state() {
  return {
    cliente: { nombre: "María", tel: "+52 272 220 0485", email: "maria@example.com", fecha: "2030-10-12", hora: "10:00", sucursal: "Fortín", asesor: "En línea", dir: "Centro", obs: "Visita", lat: 19.043, lng: -98.198 },
    situacion: "remodelacion", interior: "blanco-frosty", frentes: { arauco: ["Arena"] },
    bisagra: "Bisagra cierre suave", corredera: "Corredera cierre suave", cajones: ["Cajón"], basurero: null, especias: null, modulos: [],
    cubierta: "Superficie sólida Corian", cubPrecio: "$", cubiertaCategoria: "superficie-solida", cubiertaVariante: { id: "blanco", nombre: "Blanco" }, extras: ["Iluminación LED"],
    herrajesAtendidos: { bisagras: true, correderas: true, cajones: true, basureros: true, especiero: true, modulos: true },
    herrajesNoAplica: { basureros: true, especiero: true, modulos: true },
  };
}

test("customizer builds the domain payload without UI step indexes", () => {
  const payload = contract.buildPayload(state());
  assert.equal(payload.contact.source, "kitchen_customizer");
  assert.equal(payload.contact.email, "maria@example.com");
  assert.equal(payload.configuration.current_situation, "remodelacion");
  assert.equal(payload.configuration.hardware.basureros.not_applicable, true);
  assert.equal(payload.configuration.selection_version, 1);
  assert.equal(payload.appointment.address, payload.configuration.address);
  assert.equal(payload.appointment.requested_datetime, payload.configuration.requested_datetime);
  assert.equal(JSON.stringify(payload).includes("step"), false);
});

test("idempotency identity persists for the same payload and rotates after an edit", () => {
  let calls = 0;
  const crypto = { randomUUID: () => `00000000-0000-4000-8000-${String(++calls).padStart(12, "0")}` };
  const payload = contract.buildPayload(state());
  const first = contract.identityFor(null, payload, crypto);
  const same = contract.identityFor(first, contract.buildPayload(state()), crypto);
  const changedState = state(); changedState.cliente.obs = "Otra observación";
  const changed = contract.identityFor(same, contract.buildPayload(changedState), crypto);
  assert.equal(same.key, first.key);
  assert.notEqual(changed.key, first.key);
  assert.equal(calls, 2);
});

test("submission request reports success and exposes network/API failures", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const receipt = { submission_id: id, configuration_id: id, appointment_id: id, lead_id: id, folio: "MHG-ABC123", status: "received", replayed: false };
  const success = await contract.send("https://api.example.com/api/v1", {}, { key: id }, async (url, init) => {
    assert.equal(url, "https://api.example.com/api/v1/kitchen-submissions");
    assert.equal(new Headers(init?.headers).get("Idempotency-Key"), id);
    assert.equal(init?.credentials, "omit");
    return Response.json(receipt, { status: 201 });
  });
  assert.equal(success.folio, "MHG-ABC123");
  await assert.rejects(contract.send("https://api.example.com/api/v1", {}, { key: id }, async () => { throw new TypeError("offline"); }), /conectar/);
  await assert.rejects(contract.send("https://api.example.com/api/v1", {}, { key: id }, async () => Response.json({ error: { message: "Invalid input" } }, { status: 422 })), /Invalid input/);
});

test("map helper uses OpenStreetMap and rejects invalid coordinates", () => {
  assert.match(contract.openStreetMapUrl(19.043, -98.198), /^https:\/\/www\.openstreetmap\.org\//);
  assert.equal(contract.openStreetMapUrl(Number.NaN, -98.198), "");
  const html = readFileSync(new URL("../public/cocina-customizer.html", import.meta.url), "utf8");
  assert.match(html, /leaflet@1\.9\.4/);
  assert.match(html, /OpenStreetMap/);
  assert.doesNotMatch(html, /maps\.googleapis\.com|maps-config\.js|Mapa de Google/);
});

test("summary exposes explicit sending, success and retry states", () => {
  const customizer = readFileSync(new URL("../public/cotizador.js", import.meta.url), "utf8");
  for (const state of ["sending", "success", "error"]) assert.match(customizer, new RegExp(`_submissionStatus = '${state}'`));
  assert.match(customizer, /Solicitud recibida correctamente/);
  assert.match(customizer, /retry\.textContent = 'Reintentar'/);
});
