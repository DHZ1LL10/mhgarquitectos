import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../public/cotizador.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/cocina-customizer.html", import.meta.url), "utf8");

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}

function draftContext() {
  const storage = memoryStorage();
  const context = vm.createContext({
    document: { body: null, addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } },
    window: { sessionStorage: storage, clearTimeout, setTimeout, scrollTo() {}, matchMedia() { return { matches: true }; } },
  });
  vm.runInContext(source, context);
  return { context, storage };
}

function choiceCard() {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  return {
    classList: { add(...names: string[]) { names.forEach(name => classes.add(name)); }, remove(...names: string[]) { names.forEach(name => classes.delete(name)); } },
    setAttribute(name: string, value: string) { attributes.set(name, value); },
    selected() { return classes.has("selected"); },
    attribute(name: string) { return attributes.get(name); },
  };
}

function choiceContext() {
  const card = choiceCard();
  const bodyClasses = new Set<string>();
  const context = vm.createContext({
    document: {
      body: { classList: { add(name: string) { bodyClasses.add(name); }, remove(name: string) { bodyClasses.delete(name); } } },
      addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return [card]; },
    },
    window: {
      clearTimeout() {}, scrollTo() {},
      setTimeout(callback: () => void) { callback(); return 1; },
      matchMedia() { return { matches: true }; },
    },
  });
  vm.runInContext(source, context);
  vm.runInContext("var _testTarget=null; navigateToStep=function(target){ _testTarget=target; return true; }", context);
  return { context, card };
}

test("session draft restores selections, pending location, hardware step and receipt", () => {
  const { context, storage } = draftContext();
  vm.runInContext(`
    state.situacion='remodelacion'; state.cliente.nombre='María';
    _locationSelection={lat:19.043,lng:-98.198}; state.herrajeStepIndex=4; _currentStep=6;
    state.corredera=HERRAJE_SECTIONS[1].opts[0].val; state.herrajesAtendidos={bisagras:true,correderas:true};
    _submissionIdentity={key:'11111111-1111-4111-8111-111111111111',fingerprint:'same'};
    _submissionReceipt={folio:'COC-00009',status:'received'}; saveCustomizerDraft();
    state=initialCustomizerState(); _locationSelection=null; _currentStep=0; _submissionIdentity=null; _submissionReceipt=null;
    restoreCustomizerDraft();
  `, context);
  assert.equal(vm.runInContext("state.situacion", context), "remodelacion");
  assert.equal(vm.runInContext("state.cliente.nombre", context), "María");
  assert.equal(vm.runInContext("_locationSelection.lat", context), 19.043);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 4);
  assert.equal(vm.runInContext("state.herrajesAtendidos.correderas", context), true);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[1])", context), true);
  assert.equal(vm.runInContext("_currentStep", context), 6);
  assert.equal(vm.runInContext("_submissionReceipt.folio", context), "COC-00009");
  assert.ok(storage.getItem("mhg:kitchen-customizer:draft:v1"));
});

test("Nueva configuración clears the draft, pending location and submission identity", () => {
  const { context, storage } = draftContext();
  vm.runInContext("state.situacion='remodelacion'; _locationSelection={lat:1,lng:2}; _submissionReceipt={folio:'COC-00001'}; saveCustomizerDraft(); startNewConfiguration()", context);
  assert.equal(storage.getItem("mhg:kitchen-customizer:draft:v1"), null);
  assert.equal(vm.runInContext("state.situacion", context), null);
  assert.equal(vm.runInContext("_locationSelection", context), null);
  assert.equal(vm.runInContext("_submissionReceipt", context), null);
});

test("single-choice situation and interior persist then auto-advance", () => {
  const first = choiceContext();
  vm.runInContext("selectSituation(document.querySelectorAll()[0], 'remodelacion')", first.context);
  assert.equal(vm.runInContext("state.situacion", first.context), "remodelacion");
  assert.equal(vm.runInContext("_testTarget", first.context), 1);
  assert.equal(first.card.selected(), true);
  assert.equal(first.card.attribute("aria-pressed"), "true");

  const second = choiceContext();
  vm.runInContext("selectInterior(document.querySelectorAll()[0], 'gris-oxford')", second.context);
  assert.equal(vm.runInContext("state.interior", second.context), "gris-oxford");
  assert.equal(vm.runInContext("_testTarget", second.context), 2);
});

test("Frentes keeps explicit confirmation and does not use the auto-advance queue", () => {
  const frenteFlow = source.slice(source.indexOf("function buildFrente"), source.indexOf("/* ─── HERRAJE BUILDER"));
  assert.doesNotMatch(frenteFlow, /queueSelectionAdvance|navigateToStep/);
  assert.match(source, /function applyFrenteModal\(\)/);
  assert.match(html, /Aplicar selección/);
});

test("selection feedback locks duplicate actions and reduced motion removes waiting", () => {
  assert.match(source, /SELECTION_FEEDBACK_MS = 180/);
  assert.match(source, /STEP_TRANSITION_MS = 380/);
  assert.match(source, /_selectionFeedbackPending/);
  assert.match(source, /reducedMotionPreferred\(\) \? 0 : SELECTION_FEEDBACK_MS/);
  assert.match(source, /saveCustomizerDraft\(\);\s*setNavigationLocked\(true\)/);
  assert.match(html, /stepEnterForward \.38s cubic-bezier\(\.22,1,\.36,1\)/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /role="button" tabindex="0" aria-pressed="false"/);
  assert.match(html, /stepIndicator" role="status" aria-live="polite"/);
});

test("transition lock accepts one queued advance and rejects a double click", () => {
  const timers: Array<() => void> = [];
  const context = vm.createContext({
    document: {
      body: { classList: { add() {}, remove() {} } },
      addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; },
    },
    window: {
      clearTimeout() {}, scrollTo() {},
      setTimeout(callback: () => void) { timers.push(callback); return timers.length; },
      matchMedia() { return { matches: false }; },
    },
  });
  vm.runInContext(source, context);
  vm.runInContext("var _advanceCount=0; var _firstQueue=queueSelectionAdvance(function(){_advanceCount++}); var _secondQueue=queueSelectionAdvance(function(){_advanceCount++})", context);
  assert.equal(vm.runInContext("_firstQueue", context), true);
  assert.equal(vm.runInContext("_secondQueue", context), false);
  assert.equal(timers.length, 1);
  timers[0]();
  assert.equal(vm.runInContext("_advanceCount", context), 1);
  assert.equal(vm.runInContext("_selectionFeedbackPending", context), false);
});

test("image loading prioritizes current content and limits idle preload to the next step", () => {
  assert.match(html, /notengococina\.jpg[^>]*loading="eager"[^>]*fetchpriority="high"/);
  assert.match(html, /tabintblancofrosty\.jpg[^>]*loading="lazy"/);
  assert.match(source, /slice\(0, 4\)/);
  assert.match(source, /requestIdleCallback\(work/);
});

type GeoSuccess = (position: { coords: { latitude: number; longitude: number } }) => void;
type GeoFailure = (error: { code: number }) => void;
type MarkerDrag = (event: { target: { getLatLng(): { lat: number; lng: number } } }) => void;

function mapContext(geolocation?: { getCurrentPosition(success: GeoSuccess, error: GeoFailure): void }) {
  const status = { textContent: "" };
  const button = { disabled: false };
  const mapNode = {};
  let mapCreates = 0;
  let tileCreates = 0;
  let markerCreates = 0;
  let invalidations = 0;
  let lastView: unknown = null;
  let dragHandler: MarkerDrag | null = null;
  const map = {
    setView(point: unknown, zoom: number) { lastView = { point, zoom }; return this; },
    on() { return this; },
    invalidateSize() { invalidations += 1; return this; },
    removeLayer() {},
  };
  const marker = {
    addTo() { return this; },
    on(name: string, handler: MarkerDrag) { if (name === "dragend") dragHandler = handler; return this; },
    setLatLng() { return this; },
  };
  const L = {
    Icon: { Default: { mergeOptions() {} } },
    map() { mapCreates += 1; return map; },
    tileLayer() { tileCreates += 1; return { addTo() { return this; } }; },
    marker() { markerCreates += 1; return marker; },
  };
  const context = vm.createContext({
    document: {
      body: { style: { overflow: "" } }, activeElement: null, addEventListener() {}, removeEventListener() {}, querySelectorAll() { return []; },
      getElementById(id: string) { return id === "locationMap" ? mapNode : id === "locationMapStatus" ? status : id === "useCurrentLocationButton" ? button : null; },
    },
    navigator: { geolocation },
    window: { L, clearTimeout() {}, setTimeout(callback: () => void) { callback(); return 1; }, scrollTo() {}, matchMedia() { return { matches: true }; } },
  });
  vm.runInContext(source, context);
  return { context, status, button, counts: () => ({ mapCreates, tileCreates, markerCreates, invalidations, lastView }), drag: () => dragHandler };
}

test("map creates one reusable instance and one tile layer with controlled invalidation", () => {
  const fixture = mapContext();
  vm.runInContext("initializeLocationMap(); initializeLocationMap()", fixture.context);
  assert.deepEqual(JSON.parse(JSON.stringify(fixture.counts())), { mapCreates: 1, tileCreates: 1, markerCreates: 0, invalidations: 2, lastView: { point: [18.9, -96.97], zoom: 15 } });
  assert.match(source, /updateWhenIdle: true/);
  assert.match(source, /keepBuffer: 2/);
  assert.doesNotMatch(source, /requestIdleCallback\(warm|setTimeout\(function\(\) \{ if \(_locationMap\) _locationMap\.invalidateSize/);
  assert.match(html, /\.map-picker-map \{[^}]*overflow: hidden;[^}]*isolation: isolate/);
  assert.match(html, /\.map-picker-dialog \{[^}]*contain: layout paint/);
});

test("geolocation success survives map initialization races, moves the marker and confirms coordinates", () => {
  const fixture = mapContext({ getCurrentPosition(success) { success({ coords: { latitude: 19.043, longitude: -98.198 } }); } });
  vm.runInContext("useCurrentLocation()", fixture.context);
  assert.equal(vm.runInContext("_locationSelection.lat", fixture.context), 19.043);
  assert.match(fixture.status.textContent, /Ubicación obtenida/);
  vm.runInContext("initializeLocationMap(); confirmLocationMap()", fixture.context);
  assert.equal(fixture.counts().markerCreates, 1);
  assert.equal(vm.runInContext("state.cliente.lat", fixture.context), 19.043);
  assert.equal(vm.runInContext("state.cliente.lng", fixture.context), -98.198);
});

test("marker drag persists its new position and reopening reuses the map", () => {
  const fixture = mapContext();
  vm.runInContext("initializeLocationMap(); setLocationMarker({lat:18.9,lng:-96.97})", fixture.context);
  fixture.drag()?.({ target: { getLatLng() { return { lat: 18.91, lng: -96.98 }; } } });
  vm.runInContext("initializeLocationMap()", fixture.context);
  assert.equal(vm.runInContext("_locationSelection.lat", fixture.context), 18.91);
  assert.equal(fixture.counts().mapCreates, 1);
  assert.equal(fixture.counts().tileCreates, 1);
});

for (const [code, expected] of [[1, "permiso"], [2, "dispositivo"], [3, "demasiado"]] as const) {
  test(`geolocation error ${code} is explained inline`, () => {
    const fixture = mapContext({ getCurrentPosition(_success, error) { error({ code }); } });
    vm.runInContext("useCurrentLocation()", fixture.context);
    assert.match(fixture.status.textContent.toLowerCase(), new RegExp(expected));
    assert.equal(fixture.button.disabled, false);
  });
}

test("unsupported geolocation is handled inline without alert", () => {
  const fixture = mapContext();
  vm.runInContext("useCurrentLocation()", fixture.context);
  assert.match(fixture.status.textContent, /no permite obtener la ubicación/i);
  assert.doesNotMatch(source.slice(source.indexOf("function useCurrentLocation"), source.indexOf("function confirmLocationMap")), /alert\(/);
});
