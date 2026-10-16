import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../public/cotizador.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/cocina-customizer.html", import.meta.url), "utf8");

function draftContext() {
  const values = new Map<string, string>();
  const storage = {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
  const context = vm.createContext({
    document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } },
    window: {
      sessionStorage: storage,
      clearTimeout,
      setTimeout,
      scrollTo() {},
      matchMedia() { return { matches: true }; },
    },
  });
  vm.runInContext(source, context);
  return { context, storage };
}

test("session draft restores selections, client data, location, hardware step and receipt", () => {
  const { context, storage } = draftContext();
  vm.runInContext(`
    state.situacion='remodelacion';
    state.cliente.nombre='María'; state.cliente.lat=19.043; state.cliente.lng=-98.198;
    state.herrajeStepIndex=4; _currentStep=6;
    _submissionIdentity={key:'11111111-1111-4111-8111-111111111111',fingerprint:'same'};
    _submissionReceipt={folio:'COC-00009',status:'received'};
    saveCustomizerDraft();
    state=initialCustomizerState(); _currentStep=0; _submissionIdentity=null; _submissionReceipt=null;
    restoreCustomizerDraft();
  `, context);
  assert.equal(vm.runInContext("state.situacion", context), "remodelacion");
  assert.equal(vm.runInContext("state.cliente.nombre", context), "María");
  assert.equal(vm.runInContext("state.cliente.lat", context), 19.043);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 4);
  assert.equal(vm.runInContext("_currentStep", context), 6);
  assert.equal(vm.runInContext("_submissionReceipt.folio", context), "COC-00009");
  assert.equal(vm.runInContext("_submissionStatus", context), "success");
  assert.ok(storage.getItem("mhg:kitchen-customizer:draft:v1"));
});

test("Nueva configuración clears the session draft and submission identity", () => {
  const { context, storage } = draftContext();
  vm.runInContext("state.situacion='remodelacion'; _submissionReceipt={folio:'COC-00001'}; saveCustomizerDraft(); startNewConfiguration()", context);
  assert.equal(storage.getItem("mhg:kitchen-customizer:draft:v1"), null);
  assert.equal(vm.runInContext("state.situacion", context), null);
  assert.equal(vm.runInContext("_submissionReceipt", context), null);
  assert.equal(vm.runInContext("_submissionIdentity", context), null);
});

test("step motion is directional, locked against double navigation and reduced-motion safe", () => {
  assert.match(source, /_stepTransitioning/);
  assert.match(source, /step-exit-forward/);
  assert.match(source, /step-enter-back/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /stepEnterForward \.22s/);
});

test("image loading prioritizes current content and limits idle preload to the next step", () => {
  assert.match(html, /notengococina\.jpg[^>]*loading="eager"[^>]*fetchpriority="high"/);
  assert.match(html, /tabintblancofrosty\.jpg[^>]*loading="lazy"/);
  assert.match(source, /slice\(0, 4\)/);
  assert.match(source, /requestIdleCallback\(work/);
  assert.match(source, /Array\.from\(next\.querySelectorAll\('img'\)\)\.slice\(0, 4\)/);
});

test("map warm-up is idle, keeps normal OSM tiles and invalidates on open", () => {
  assert.match(source, /if \(step === 6\) warmLocationMap\(\)/);
  assert.match(source, /tileLayer\('https:\/\/\{s\}\.tile\.openstreetmap\.org/);
  assert.match(source, /_locationMap\.invalidateSize\(\)/);
  assert.doesNotMatch(source, /serviceWorker|caches\.open/);
});
