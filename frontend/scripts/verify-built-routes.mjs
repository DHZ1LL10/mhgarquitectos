import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { frontend, sha256, expectedPublicHash } from "./legacy-assets.mjs";

// HTTP requests only. This script never launches or controls a browser.
const probe = createServer();
probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
let logs = "";
const child = spawn(process.execPath, [path.join(frontend, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: frontend, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
const exit = once(child, "exit");
child.stdout.on("data", chunk => { logs += chunk; });
child.stderr.on("data", chunk => { logs += chunk; });
let spawnError;
child.on("error", error => { spawnError = error; });
const base = `http://127.0.0.1:${port}`;
const get = async route => fetch(base + route, { signal: AbortSignal.timeout(15000) });
const withoutScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const results = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null) throw new Error(`Next start exited: ${logs}`);
    try { const response = await get("/"); if (response.status === 200) { ready = true; break; } } catch { /* wait for startup */ }
    await delay(250);
  }
  assert.ok(ready, `Server did not start: ${logs}`);

  for (const route of ["/", "/index.html", "/propiedades", "/propiedades/residencia-mata-larga-fortin", "/admin", "/admin/clientes", "/admin/clientes/00000000-0000-0000-0000-000000000001", "/admin/citas", "/admin/citas/00000000-0000-0000-0000-000000000001", "/admin/cocinas", "/admin/cocinas/00000000-0000-0000-0000-000000000001", "/admin/propiedades", "/admin/propiedades/nueva", "/admin/propiedades/00000000-0000-0000-0000-000000000001", "/admin/login"]) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/, route);
    const html = withoutScripts(await response.text());
    assert.match(html, /<h1\b/, `${route}: server-rendered heading`);
    assert.match(html, /<meta name="robots" content="[^"]*noindex/, route);
    if (route === "/" || route === "/index.html") {
      const sectionIds = ["inicio", "nosotros", "proyectos", "propiedades", "servicios", "sucursales", "contacto"];
      for (const id of sectionIds) assert.ok(html.includes(`id="${id}"`), `${route}: ${id}`);
      for (let index = 1; index < sectionIds.length; index++) assert.ok(html.indexOf(`id="${sectionIds[index - 1]}"`) < html.indexOf(`id="${sectionIds[index]}"`), `${route}: section order`);
      assert.match(html, /href="\/cocina-customizer\.html"/);
      assert.match(html, /href="\/propiedades"/);
      assert.equal([...html.matchAll(/class="proj-item"/g)].length, 13);
      assert.equal([...html.matchAll(/role="tab"/g)].length, 2);
      assert.doesNotMatch(html, /tab-mobiliario|tab-interiorismo|cat-mobiliario|cat-interiorismo/);
    }
    if (route.startsWith("/propiedades")) {
      assert.match(html, /rel="canonical"/);
      assert.match(html, /property="og:title"/);
      assert.doesNotMatch(html, /Catálogo de demostración|Información ficticia|Fotografías de ejemplo|solo ilustrativa/i);
      assert.doesNotMatch(html, /casa-demo-fortin|departamento-demo-tuxtepec|casa-demo-borrador|departamento-demo-archivado/);
    }
    if (route === "/propiedades") {
      assert.match(html, /href="\/propiedades\/residencia-mata-larga-fortin"/);
      assert.match(html, /\$2,990,000/);
    }
    if (route === "/propiedades/residencia-mata-larga-fortin") {
      assert.match(html, /<h1[^>]*>Residencia en venta en Mata Larga, Fortín<\/h1>/);
      assert.match(html, /name="description"/); assert.match(html, /property="og:image"/);
      assert.match(html, /rel="canonical" href="[^"]*\/propiedades\/residencia-mata-larga-fortin"/);
      assert.match(html, /Precio de lista/); assert.match(html, /Bono especial/);
      assert.match(html, /Agendar visita por WhatsApp/);
    }
    if (route.startsWith("/admin") && route !== "/admin/login") {
      assert.match(html, /Administración MHG/);
      assert.doesNotMatch(html, /Modo demostración|Guardar en memoria/);
      assert.doesNotMatch(html, /type="(?:password|file)"/);
    }
    if (route === "/admin/login") {
      assert.match(html, /Acceso administrativo/);
      assert.match(html, /type="password"/);
      assert.doesNotMatch(html, /Modo demostración|Guardar en memoria/);
    }
    results.push(`200 + initial HTML + noindex: ${route}`);
  }

  for (const route of ["/no-existe", "/propiedades/no-existe", "/propiedades/casa-demo-fortin", "/propiedades/departamento-demo-tuxtepec", "/propiedades/casa-demo-borrador", "/propiedades/departamento-demo-archivado", "/.browser-validation/Local%20State", "/INFORME-FOTOSMAX.md"]) {
    assert.equal((await get(route)).status, 404, route);
    results.push(`404: ${route}`);
  }
  for (const name of ["cocina-customizer.html", "style.css", "cotizador.js", "kitchen-submission.js", "galeria-configurador.js", "configurador-galeria.css", "img/logo.jpg", "img/construccion/nosotros-led.jpg"]) {
    const response = await get("/" + name); assert.equal(response.status, 200, name);
    const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(sha256(bytes), expectedPublicHash(name), `HTTP bytes: ${name}`);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    if (name.endsWith(".html")) assert.doesNotMatch(bytes.toString("utf8"), /\/_next\//);
    results.push(`200 + exact SHA-256: /${name}`);
  }
  const runtimeConfig = await get("/customizer-runtime-config.js");
  assert.equal(runtimeConfig.status, 200);
  assert.match(runtimeConfig.headers.get("content-type") || "", /application\/javascript/);
  const runtimeConfigBody = await runtimeConfig.text();
  assert.match(runtimeConfigBody, /MHG_CUSTOMIZER_CONFIG/);
  assert.doesNotMatch(runtimeConfigBody, /password|secret|token/i);
  results.push("200 + safe runtime config: /customizer-runtime-config.js");
  const sitemap = await (await get("/sitemap.xml")).text();
  assert.match(sitemap, /residencia-mata-larga-fortin/);
  assert.doesNotMatch(sitemap, /\/admin|casa-demo|departamento-demo|borrador|archivado/);
  const robots = await (await get("/robots.txt")).text(); assert.match(robots, /Disallow: \//);
  results.push("Sitemap contains only public routes; robots blocks demo indexing.");
  console.log(results.join("\n"));
  console.log("HTTP checks complete. No browser was used; the local server will stop.");
} catch (error) {
  console.error(logs); throw error;
} finally {
  if (child.exitCode === null && !spawnError) { child.kill(); await exit; }
}
