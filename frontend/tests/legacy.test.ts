import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import { serviceQuotes } from "../src/data/service-quotes.ts";
import { buildQuoteMessage } from "../src/data/quote-message.ts";

const root = path.resolve(import.meta.dirname, "../..");
const read = (name: string) => readFileSync(path.join(root, name), "utf8");

test("service fields match the original configuration, including order and labels", () => {
  const source = read("modals.js");
  const context = vm.createContext({});
  const configs = vm.runInContext(source.slice(0, source.indexOf("let activeModalKey")) + "\nMODAL_CONFIGS", context);
  assert.deepEqual(serviceQuotes, JSON.parse(JSON.stringify(configs)));
});

test("quote messages preserve original formatting and never interpret user input as HTML", () => {
  const message = buildQuoteMessage("construccion", { "mc-nombre": "  <b>Cliente & prueba</b>  ", "mc-notas": "Línea 1\nLínea 2" });
  assert.equal(message, "*COTIZACIÓN — DISEÑO Y CONSTRUCCIÓN*\n\n• *Tu nombre completo:* <b>Cliente & prueba</b>\n• *Descripción de tu proyecto (opcional):* Línea 1\nLínea 2\n\n_Cotización enviada desde mhgarquitectos.com_");
  assert.equal(decodeURIComponent(encodeURIComponent(message)), message);
});

test("corporate section IDs, content and asset paths survive the JSX transfer", () => {
  const original = read("index.html");
  const sections = read("frontend/src/components/site/HomeSections.tsx");
  const corporate = sections + read("frontend/src/components/site/SiteHeader.tsx") + read("frontend/src/components/site/SiteFooter.tsx");
  for (const id of ["inicio", "proyectos", "servicios", "nosotros", "sucursales", "contacto"]) assert.ok(sections.includes(`id="${id}"`));
  for (const match of original.matchAll(/<img[^>]+src="([^"]+)"/g)) assert.ok(corporate.includes(match[1]), match[1]);
  assert.match(sections, /<a href="\/cocina-customizer\.html"/);
  assert.doesNotMatch(sections, /onclick=|dangerouslySetInnerHTML/);
});

test("all literal legacy image references exist with exact case except the known missing favicon", () => {
  const missing: string[] = [];
  for (const file of ["index.html", "cocina-customizer.html", "cotizador.js", "script.js", "modals.js", "galeria-configurador.js", "style.css", "configurador-galeria.css"]) {
    for (const match of read(file).matchAll(/["'](\/?img\/[^"'<>]+?\.(?:jpg|jpeg|png|webp|ico))["']/g)) {
      const reference = match[1].replace(/^\//, "");
      let directory = root;
      for (const segment of reference.split("/")) {
        if (!readdirSync(directory).includes(segment)) { missing.push(reference); break; }
        directory = path.join(directory, segment);
      }
    }
  }
  assert.deepEqual([...new Set(missing)], ["img/favicon.ico"]);
});

test("public output excludes browser profiles, reports and the old home document", () => {
  for (const name of [".browser-validation", ".git", "validacion-fotosmax", "index.html", "script.js", "modals.js"]) {
    assert.equal(existsSync(path.join(root, "frontend/public", name)), false, name);
  }
});

test("legacy catalogs, defaults, summary and WhatsApp retain their baseline behavior", () => {
  const nodes: Record<string, { innerHTML: string; textContent: string }> = {
    summaryGrid: { innerHTML: "", textContent: "" }, totalAmount: { innerHTML: "", textContent: "" }, sidebarSteps: { innerHTML: "", textContent: "" },
  };
  let url = "";
  const context = vm.createContext({
    document: { addEventListener() {}, getElementById(id: string) { return nodes[id] || null; }, querySelectorAll() { return []; } },
    window: { scrollTo() {}, open(value: string) { url = value; } },
  });
  vm.runInContext(read("cotizador.js"), context);
  assert.equal(vm.runInContext("STEPS.length", context), 8);
  assert.equal(vm.runInContext("CUBIERTA_VARIANTES.sinterizado.length", context), 62);
  assert.equal(vm.runInContext("Object.values(PALETTES).reduce((n, a) => n + a.length, 0)", context), 97);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(Object.values(CUBIERTA_INFO).map(v => v.precioBase))", context)), [6500, 8500, 12000, 17000]);
  vm.runInContext('state.cliente.nombre="Cliente de prueba"; state.extras=["Iluminación LED"]; buildSummary(); sendWhatsApp(); renderStep(0);', context);
  assert.match(nodes.summaryGrid.innerHTML, /Cliente de prueba/);
  assert.equal(nodes.totalAmount.textContent, "A confirmar tras levantamiento");
  assert.equal(new URL(url).pathname, "/5212717041499");
  assert.match(new URL(url).searchParams.get("text") || "", /Cliente de prueba/);
  assert.equal(vm.runInContext("state.extras.length", context), 1, "The legacy new-configuration behavior must not change");
});
