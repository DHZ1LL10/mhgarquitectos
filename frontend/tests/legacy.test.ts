import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import { serviceQuotes } from "../src/data/service-quotes.ts";
import { buildQuoteMessage } from "../src/data/quote-message.ts";
import { site } from "../src/config/site.ts";

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
  for (const match of original.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    if (/img\/(mobiliario|interiorismo)\//.test(match[1])) continue;
    assert.ok(corporate.includes(match[1]), match[1]);
  }
  assert.ok(sections.includes('/img/construccion/fachada-1.jpg'));
  assert.ok(!sections.includes('/img/construccion/nosotros-led.jpg'));
  assert.ok(existsSync(path.join(root, "frontend/public/img/construccion/fachada-1.jpg")));
  assert.match(sections, /<a href="\/cocina-customizer\.html"/);
  assert.doesNotMatch(sections, /onclick=|dangerouslySetInnerHTML/);
});

test("home follows the business order and exposes only the two approved project tabs", () => {
  const sections = read("frontend/src/components/site/HomeSections.tsx");
  const ids = ["inicio", "nosotros", "proyectos", "propiedades", "servicios", "sucursales", "contacto"];
  for (let index = 1; index < ids.length; index++) assert.ok(sections.indexOf(`id="${ids[index - 1]}"`) < sections.indexOf(`id="${ids[index]}"`));
  assert.equal([...sections.matchAll(/role="tab"/g)].length, 2);
  assert.doesNotMatch(sections, /tab-mobiliario|tab-interiorismo|cat-mobiliario|cat-interiorismo/);
  assert.match(sections, /Propiedades en venta/);
  assert.match(sections, /properties\.slice\(0, 3\)/);
  assert.match(sections, /href="\/propiedades"/);
  const header = read("frontend/src/components/site/SiteHeader.tsx");
  const labels = ["Nosotros", "Proyectos", "Propiedades en venta", "Servicios", "Sucursales", "Contacto", "WhatsApp"];
  for (let index = 1; index < labels.length; index++) assert.ok(header.indexOf(labels[index - 1]) < header.indexOf(labels[index]));
  assert.match(header, /home \? "#propiedades" : "\/#propiedades"/);
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
    summaryGrid: { innerHTML: "", textContent: "" }, sidebarSteps: { innerHTML: "", textContent: "" },
  };
  let url = "";
  const context = vm.createContext({
    document: { addEventListener() {}, getElementById(id: string) { return nodes[id] || null; }, querySelectorAll() { return []; } },
    window: { scrollTo() {}, open(value: string) { url = value; }, MHG_CUSTOMIZER_CONFIG: { whatsappNumber: site.quotesWhatsApp } },
    URL, Uint8Array,
  });
  vm.runInContext(read("frontend/public/kitchen-submission.js"), context);
  vm.runInContext(read("frontend/public/cotizador.js"), context);
  assert.equal(vm.runInContext("STEPS.length", context), 8);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(STEPS.map(step => step.label))", context)), ["Situación actual", "Tableros interiores", "Frentes exteriores", "Herrajes", "Cubierta", "Extras", "Datos del cliente", "Resumen"]);
  assert.equal(vm.runInContext("HERRAJE_SECTIONS.find(section => section.id === 'basureros').opts.find(option => option.id === 'bas-la').images", context), undefined);
  assert.equal(vm.runInContext("CUBIERTA_VARIANTES.sinterizado.length", context), 62);
  assert.equal(vm.runInContext("Object.values(PALETTES).reduce((n, a) => n + a.length, 0)", context), 97);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(Object.values(CUBIERTA_INFO).map(v => v.precioBase))", context)), [6500, 8500, 12000, 17000]);
  vm.runInContext('state.cliente.nombre="Cliente de prueba"; state.cliente.lat=18.9; state.cliente.lng=-96.97; state.extras=["Iluminación LED"]; buildSummary(); sendWhatsApp(); renderStep(0);', context);
  assert.match(nodes.summaryGrid.innerHTML, /Cliente de prueba/);
  assert.doesNotMatch(read("frontend/public/cotizador.js"), /totalAmount|Estimado de inversión|A confirmar tras levantamiento/);
  assert.doesNotMatch(read("frontend/public/cocina-customizer.html"), /totalAmount|Estimado de inversión|Precio referencial basado/);
  assert.equal(new URL(url).pathname, `/${site.quotesWhatsApp}`);
  assert.match(new URL(url).searchParams.get("text") || "", /Cliente de prueba/);
  assert.match(new URL(url).searchParams.get("text") || "", /https:\/\/www\.openstreetmap\.org\//);
  const text = new URL(url).searchParams.get("text") || "";
  assert.ok(text.indexOf("👤 *CLIENTE*") < text.indexOf("📅 *VISITA / LEVANTAMIENTO*") && text.indexOf("📅 *VISITA / LEVANTAMIENTO*") < text.indexOf("🧰 *CONFIGURACIÓN*") && text.indexOf("*Herrajes:*") < text.indexOf("*Cubierta:*"));
  assert.equal(vm.runInContext("state.extras.length", context), 1, "The legacy new-configuration behavior must not change");
});

test("customizer navigation follows the new order and preserves step validation on direct jumps", () => {
  const fields: Record<string, { value: string; selectedIndex?: number; options?: { text: string }[] }> = {
    "c-nombre": { value: "" }, "c-tel": { value: "" }, "c-dir": { value: "" },
    "c-fecha": { value: "" }, "c-hora": { value: "" }, "c-asesor": { value: "" }, "c-obs": { value: "" },
    "c-sucursal": { value: "", selectedIndex: 0, options: [{ text: "Fortín de las Flores" }] },
  };
  const validation = { textContent: "", hidden: true, focus() {} };
  const context = vm.createContext({
    document: { addEventListener() {}, getElementById(id: string) { return id === "stepValidation" ? validation : fields[id] || null; }, querySelectorAll() { return []; } },
    window: { scrollTo() {}, open() {}, matchMedia() { return { matches: true }; } }, alert() { throw new Error("browser alert must not be used for step validation"); },
  });
  vm.runInContext(read("frontend/public/cotizador.js"), context);
  vm.runInContext("renderStep(0); navigateToStep(7)", context);
  assert.equal(vm.runInContext("_currentStep", context), 0);
  assert.match(validation.textContent, /situación actual/);
  vm.runInContext("state.situacion='sin-cocina'; navigateToStep(7)", context);
  assert.match(validation.textContent, /tablero interior/);
  vm.runInContext("state.interior='blanco-frosty'; navigateToStep(7)", context);
  assert.match(validation.textContent, /línea de frentes/);
  vm.runInContext("state.frentes.economica=['Blanco']; state.bisagra=HERRAJE_SECTIONS[0].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[0],false); state.corredera=HERRAJE_SECTIONS[1].opts[0].val; resolverHerraje(HERRAJE_SECTIONS[1],false); resolverHerraje(HERRAJE_SECTIONS[2],true); resolverHerraje(HERRAJE_SECTIONS[3],true); resolverHerraje(HERRAJE_SECTIONS[4],true); resolverHerraje(HERRAJE_SECTIONS[5],true); navigateToStep(7)", context);
  assert.match(validation.textContent, /nombre, teléfono, dirección/);
  Object.assign(fields["c-nombre"], { value: "Persona" }); Object.assign(fields["c-tel"], { value: "2710000000" });
  Object.assign(fields["c-dir"], { value: "Calle de prueba" }); Object.assign(fields["c-fecha"], { value: "2026-11-01" });
  Object.assign(fields["c-hora"], { value: "10:00" }); Object.assign(fields["c-sucursal"], { value: "Fortin" });
  vm.runInContext("navigateToStep(7)", context);
  assert.equal(vm.runInContext("_currentStep", context), 7);
  vm.runInContext("state.cliente.lat=18.9; state.cliente.lng=-96.97; renderStep(2); renderStep(6); nextStep()", context);
  assert.equal(vm.runInContext("_currentStep", context), 7);
  assert.equal(vm.runInContext("state.cliente.lat", context), 18.9);
  assert.equal(vm.runInContext("state.cliente.nombre", context), "Persona");
});

test("Leaflet and OpenStreetMap replace Google Maps without an API key", () => {
  const html = read("frontend/public/cocina-customizer.html");
  assert.match(html, /leaflet\/1\.9\.4\/leaflet\.min/);
  assert.match(html, /OpenStreetMap/);
  assert.match(html, /customizer-runtime-config\.js/);
  assert.doesNotMatch(html + read("frontend/public/cotizador.js"), /maps\.googleapis\.com|MHG_GOOGLE_MAPS_API_KEY|AIza[0-9A-Za-z_-]{20,}/);
});
