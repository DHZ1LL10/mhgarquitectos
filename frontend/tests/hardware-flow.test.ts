import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const source = readFileSync(path.join(root, "frontend/public/cotizador.js"), "utf8");

function createContext() {
  const context = vm.createContext({
    document: {
      body: null,
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; },
    },
    window: {
      scrollTo() {}, open() {}, clearTimeout() {},
      setTimeout(callback: () => void) { callback(); return 1; },
      matchMedia() { return { matches: true }; },
    },
  });
  vm.runInContext(source, context);
  return context;
}

test("required single-choice hardware auto-advances after selection", () => {
  const context = createContext();
  assert.equal(vm.runInContext("HERRAJE_SECTIONS[0].type", context), "radio");
  assert.equal(vm.runInContext("HERRAJE_SECTIONS[0].optional", context), false);
  assert.equal(vm.runInContext("resolverHerraje(HERRAJE_SECTIONS[0],true)", context), false);
  vm.runInContext("seleccionarHerrajeRadio('bisagras', HERRAJE_SECTIONS[0].opts[0].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[0])", context), true);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 1);
  vm.runInContext("seleccionarHerrajeRadio('correderas', HERRAJE_SECTIONS[1].opts[2].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[1])", context), true);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 2);
  assert.equal(vm.runInContext("state.corredera", context), "LA Hettich oculta soft-close (módulo completo)");
});

test("optional single-choice and No aplica both auto-advance", () => {
  const context = createContext();
  vm.runInContext("abrirSeccionHerrajes('sec-basureros',false); seleccionarHerrajeRadio('basureros', HERRAJE_SECTIONS[3].opts[0].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[3])", context), true);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 4);
  vm.runInContext("abrirSeccionHerrajes('sec-especias',false); resolverHerrajeOpcional('especias')", context);
  assert.equal(vm.runInContext("state.herrajesNoAplica.especias", context), true);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[4])", context), true);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 5);
});

test("multi-choice remains incomplete until its contextual confirmation", () => {
  const context = createContext();
  vm.runInContext("state.cajones.push(HERRAJE_SECTIONS[2].opts[0].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[2])", context), false);
  vm.runInContext("continuarHerrajeMultiple('cajones')", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[2])", context), true);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 3);
  assert.match(source, /confirmLabel:'Confirmar selección'/);
  assert.match(source, /confirmLabel:'Continuar con módulos'/);
});

test("last multi-choice confirmation moves directly from Herrajes to Cubierta", () => {
  const context = createContext();
  vm.runInContext(`
    _currentStep=3;
    state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false);
    state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false);
    resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true);
    state.modulos.push(HERRAJE_SECTIONS[5].opts[0].val); continuarHerrajeMultiple('modulos');
  `, context);
  assert.equal(vm.runInContext("herrajesCompletos()", context), true);
  assert.equal(vm.runInContext("_currentStep", context), 4);
  assert.match(source, /step === total - 1 \|\| step === 3/);
  assert.doesNotMatch(source.slice(source.indexOf("function buildHerrajeContainer"), source.indexOf("function escQ")), /herraje-required-continue/);
});

test("last No aplica moves directly to Cubierta and remains complete", () => {
  const context = createContext();
  vm.runInContext(`
    _currentStep=3;
    state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false);
    state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false);
    resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true);
    resolverHerrajeOpcional('modulos');
  `, context);
  assert.equal(vm.runInContext("state.herrajesNoAplica.modulos && herrajesCompletos()", context), true);
  assert.equal(vm.runInContext("_currentStep", context), 4);
});

test("Previous returns to the prior hardware subsection", () => {
  const context = createContext();
  vm.runInContext("state.herrajeStepIndex=4; previousHardwareStep()", context);
  assert.equal(vm.runInContext("state.herrajeStepIndex", context), 3);
});

test("optional and multi choices preserve values and summaries", () => {
  const context = createContext();
  vm.runInContext("resolverHerraje(HERRAJE_SECTIONS[3],true); state.modulos.push(HERRAJE_SECTIONS[5].opts[0].val)", context);
  assert.equal(vm.runInContext("herrajeResumen(HERRAJE_SECTIONS[3])", context), "No aplica");
  vm.runInContext("state.basurero=HERRAJE_SECTIONS[3].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[3],false)", context);
  assert.equal(vm.runInContext("herrajeResumen(HERRAJE_SECTIONS[3])", context), "Basurero LB (va en puerta)");
  assert.equal(vm.runInContext("state.modulos[0]", context), "Esquinero extraíble");
});

test("leaving Herrajes is blocked until every subsection has a decision", () => {
  const context = createContext();
  assert.equal(vm.runInContext("validateStep(3)", context), false);
  assert.match(source, /Completa Herrajes\. Te llevamos al primer subpaso pendiente/);
  vm.runInContext("state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true); resolverHerraje(HERRAJE_SECTIONS[5],true)", context);
  assert.equal(vm.runInContext("validateStep(3) && stepIsComplete(3)", context), true);
});

test("Herrajes renders one accessible internal wizard with directional navigation", () => {
  assert.match(source, /Herrajes · ' \+ \(index \+ 1\) \+ ' de ' \+ HERRAJE_SECTIONS\.length/);
  assert.match(source, /function previousHardwareStep\(\)/);
  assert.match(source, /hardware-enter-' \+ \(direction < 0 \? 'back' : 'forward'\)/);
  assert.match(source, /focusHardwareHeading/);
  assert.doesNotMatch(source.slice(source.indexOf("function buildHerrajeContainer"), source.indexOf("function escQ")), /HERRAJE_SECTIONS\.map\(function\(sec\)/);
});

test("hinge image opens its single-photo lightbox without fake thumbnails", () => {
  const context = createContext();
  assert.equal(vm.runInContext("herrajeImagenes(HERRAJE_SECTIONS[0].opts[0]).length", context), 1);
  assert.match(source.slice(source.indexOf("function prepararGaleriaHerraje"), source.indexOf("function herrajeSeccionCompleta")), /window\.openLightbox\(images\.slice\(\), option\.label, active\)/);
  assert.match(source.slice(source.indexOf("function prepararGaleriaHerraje"), source.indexOf("function herrajeSeccionCompleta")), /if \(images\.length < 2\) return/);
  const styles = readFileSync(path.join(root, "frontend/public/configurador-galeria.css"), "utf8");
  assert.match(styles, /#bis-hettich \.herr-card-photo > img \{ object-fit: cover; object-position: 58% center;/);
  assert.match(styles, /\.herr-gallery button img \{[^}]*object-fit: contain; object-position: center;/);
  assert.match(styles, /#lbThumbnails img \{[^}]*object-fit: contain; object-position: center;/);
});
