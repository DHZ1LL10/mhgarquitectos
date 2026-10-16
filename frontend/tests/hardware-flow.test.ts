import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const source = readFileSync(path.join(root, "frontend/public/cotizador.js"), "utf8");

function createContext() {
  const alerts: string[] = [];
  const context = vm.createContext({
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; },
    },
    window: { scrollTo() {}, open() {} },
    alert(message: string) { alerts.push(message); },
  });
  vm.runInContext(source, context);
  return { context, alerts };
}

test("Bisagras requiere confirmación explícita, no acepta No aplica y avanza al siguiente apartado", () => {
  const { context } = createContext();
  assert.equal(vm.runInContext("HERRAJE_SECTIONS[0].optional", context), false);
  assert.equal(vm.runInContext("resolverHerraje(HERRAJE_SECTIONS[0],true)", context), false);
  assert.equal(vm.runInContext("stepIsComplete(3)", context), false);
  vm.runInContext("confirmarHerrajeUnico('bisagras')", context);
  assert.equal(vm.runInContext("stepIsComplete(3)", context), false);
  assert.equal(vm.runInContext("state.herrajeNextIndex", context), 1);
  assert.equal(vm.runInContext("state.bisagra", context), "Bisagra cierre suave");
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[0])", context), true);
});

test("radios persist selection but require Continuar before completing (including Correderas)", () => {
  const { context } = createContext();
  vm.runInContext("seleccionarHerrajeRadio('bisagras', HERRAJE_SECTIONS[0].opts[0].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[0])", context), false);
  vm.runInContext("confirmarHerrajeUnico('bisagras')", context);
  vm.runInContext("seleccionarHerrajeRadio('correderas', HERRAJE_SECTIONS[1].opts[2].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[1])", context), false);
  vm.runInContext("confirmarHerrajeUnico('correderas')", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[1])", context), true);
  assert.equal(vm.runInContext("state.corredera", context), "LA Hettich oculta soft-close (módulo completo)");
});

test("the final optional subsection advances after Continue and no longer triggers a false validation alert", () => {
  const { context, alerts } = createContext();
  vm.runInContext("resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true); state.modulos.push(HERRAJE_SECTIONS[5].opts[0].val); continuarHerrajeMultiple('modulos')", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[5])", context), true);
  assert.equal(vm.runInContext("herrajesCompletos() && validateStep(3)", context), true);
  assert.equal(alerts.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext("state.modulos", context))), ["Esquinero extraíble"]);
});

test("the final optional subsection also advances through No aplica and remains complete on return", () => {
  const { context, alerts } = createContext();
  vm.runInContext("resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true); resolverHerrajeOpcional('modulos')", context);
  assert.equal(vm.runInContext("state.herrajesNoAplica.modulos && herrajesCompletos() && validateStep(3)", context), true);
  vm.runInContext("abrirSeccionHerrajes('sec-modulos',false)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[5])", context), true);
  assert.equal(alerts.length, 0);
});

test("reselecting an optional radio requires one confirmation and preserves No aplica until changed", () => {
  const { context } = createContext();
  vm.runInContext("resolverHerrajeOpcional('especias')", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[4])", context), true);
  vm.runInContext("seleccionarHerrajeRadio('especias', HERRAJE_SECTIONS[4].opts[0].val)", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[4])", context), false);
  assert.equal(vm.runInContext("state.herrajesNoAplica.especias", context), undefined);
  vm.runInContext("confirmarHerrajeUnico('especias')", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[4])", context), true);
});

test("optional radio and multi sections complete through No aplica without product selections or prices", () => {
  const { context } = createContext();
  vm.runInContext("state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true); resolverHerraje(HERRAJE_SECTIONS[5],true)", context);
  assert.equal(vm.runInContext("herrajesCompletos()", context), true);
  assert.equal(vm.runInContext("state.cajones.length + state.modulos.length", context), 0);
  assert.equal(vm.runInContext("state.basurero === null && state.especias === null", context), true);
  assert.equal(vm.runInContext("herrajeResumen(HERRAJE_SECTIONS[2])", context), "No aplica");
  assert.equal(vm.runInContext("herrajeResumen(HERRAJE_SECTIONS[3])", context), "No aplica");
});

test("multi product selection can be reviewed and is retained until the user explicitly confirms", () => {
  const { context } = createContext();
  vm.runInContext("state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); state.cajones.push(HERRAJE_SECTIONS[2].opts[0].val);", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[2])", context), false);
  assert.equal(vm.runInContext("state.cajones[0]", context), "Con MDF");
  vm.runInContext("state.cajones.push(HERRAJE_SECTIONS[2].opts[1].val); continuarHerrajeMultiple('cajones')", context);
  assert.equal(vm.runInContext("herrajeSeccionCompleta(HERRAJE_SECTIONS[2])", context), true);
  assert.equal(vm.runInContext("state.cajones.join('|')", context), "Con MDF|Tiro aluminio");
  assert.equal(vm.runInContext("state.herrajeNextIndex", context), 3);
});

test("No aplica can be replaced with a product and does not erase later subselections", () => {
  const { context } = createContext();
  vm.runInContext("resolverHerraje(HERRAJE_SECTIONS[3],true); state.modulos.push(HERRAJE_SECTIONS[5].opts[0].val)", context);
  assert.equal(vm.runInContext("state.basurero", context), null);
  assert.equal(vm.runInContext("herrajeResumen(HERRAJE_SECTIONS[3])", context), "No aplica");
  vm.runInContext("state.basurero=HERRAJE_SECTIONS[3].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[3],false)", context);
  assert.equal(vm.runInContext("herrajeResumen(HERRAJE_SECTIONS[3])", context), "Basurero LB (va en puerta)");
  assert.equal(vm.runInContext("state.modulos[0]", context), "Esquinero extraíble");
});

test("leaving Herrajes is blocked until every required and optional subsection has a decision", () => {
  const { context, alerts } = createContext();
  assert.equal(vm.runInContext("validateStep(3)", context), false);
  assert.equal(alerts.length, 0);
  assert.match(source, /Completa Herrajes\. Te llevamos al primer subpaso pendiente/);
  assert.match(source, /showHardwareValidation\('Completa este subpaso/);
  vm.runInContext("state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true); resolverHerraje(HERRAJE_SECTIONS[5],true)", context);
  assert.equal(vm.runInContext("validateStep(3)", context), true);
  assert.equal(vm.runInContext("stepIsComplete(3)", context), true);
});

test("Herrajes renders one internal wizard panel with directional navigation", () => {
  assert.match(source, /Herrajes · ' \+ \(index \+ 1\) \+ ' de ' \+ HERRAJE_SECTIONS\.length/);
  assert.match(source, /function previousHardwareStep\(\)/);
  assert.match(source, /hardware-enter-' \+ \(direction < 0 \? 'back' : 'forward'\)/);
  assert.doesNotMatch(source.slice(source.indexOf("function buildHerrajeContainer"), source.indexOf("function escQ")), /HERRAJE_SECTIONS\.map\(function\(sec\)/);
});

test("hinge image opens its associated single-photo lightbox and single photos omit thumbnail galleries", () => {
  const { context } = createContext();
  assert.equal(vm.runInContext("herrajeImagenes(HERRAJE_SECTIONS[0].opts[0]).length", context), 1);
  assert.match(source.slice(source.indexOf("function prepararGaleriaHerraje"), source.indexOf("function herrajeSeccionCompleta")), /window\.openLightbox\(images\.slice\(\), option\.label, active\)/);
  assert.match(source.slice(source.indexOf("function prepararGaleriaHerraje"), source.indexOf("function herrajeSeccionCompleta")), /if \(images\.length < 2\) return/);
  const styles = readFileSync(path.join(root, "frontend/public/configurador-galeria.css"), "utf8");
  assert.match(styles, /#bis-hettich \.herr-card-photo > img \{ object-fit: cover; object-position: 58% center;/);
  assert.match(styles, /\.herr-gallery button img \{[^}]*object-fit: contain; object-position: center;/);
  assert.match(styles, /#lbThumbnails img \{[^}]*object-fit: contain; object-position: center;/);
});
