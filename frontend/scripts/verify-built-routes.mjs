import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
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

  for (const route of ["/", "/index.html", "/propiedades", "/propiedades/casa-demo-fortin", "/propiedades/departamento-demo-tuxtepec", "/admin"]) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/, route);
    const html = withoutScripts(await response.text());
    assert.match(html, /<h1\b/, `${route}: server-rendered heading`);
    assert.match(html, /<meta name="robots" content="[^"]*noindex/, route);
    if (route === "/" || route === "/index.html") {
      for (const id of ["inicio", "proyectos", "servicios", "nosotros", "sucursales", "contacto"]) assert.ok(html.includes(`id="${id}"`), `${route}: ${id}`);
      assert.match(html, /href="\/cocina-customizer\.html"/);
      assert.match(html, /href="\/propiedades"/);
      const original = await readFile(path.join(frontend, "../index.html"), "utf8");
      const originalImages = [...original.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)].map(match => match[0].includes('alt="Proyecto residencial terminado') ? "/img/construccion/nosotros-led.jpg" : "/" + match[1]);
      const migratedImages = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1]);
      assert.deepEqual(migratedImages, originalImages, "Corporate images and their order must be unchanged");
      assert.equal([...html.matchAll(/class="proj-item"/g)].length, 23);
    }
    if (route.startsWith("/propiedades")) {
      assert.match(html, /rel="canonical"/);
      assert.match(html, /property="og:title"/);
      assert.match(html, /Catálogo de demostración/);
      assert.doesNotMatch(html, /casa-demo-borrador|departamento-demo-archivado/);
    }
    if (route === "/propiedades") {
      assert.match(html, /href="\/propiedades\/casa-demo-fortin"/);
      assert.match(html, /href="\/propiedades\/departamento-demo-tuxtepec"/);
    }
    if (route === "/propiedades/casa-demo-fortin") {
      assert.match(html, /<h1[^>]*>Casa de ejemplo en Fortín<\/h1>/);
      assert.match(html, /name="description"/); assert.match(html, /property="og:image"/);
      assert.match(html, /rel="canonical" href="[^"]*\/propiedades\/casa-demo-fortin"/);
      assert.match(html, /Características de ejemplo/);
    }
    if (route === "/admin") {
      assert.ok(html.includes("Modo demostración: los cambios se pierden al recargar."));
      assert.doesNotMatch(html, /type="(?:password|file)"/);
    }
    results.push(`200 + initial HTML + noindex: ${route}`);
  }

  for (const route of ["/no-existe", "/propiedades/no-existe", "/propiedades/casa-demo-borrador", "/propiedades/departamento-demo-archivado", "/.browser-validation/Local%20State", "/INFORME-FOTOSMAX.md"]) {
    assert.equal((await get(route)).status, 404, route);
    results.push(`404: ${route}`);
  }
  for (const name of ["cocina-customizer.html", "style.css", "cotizador.js", "galeria-configurador.js", "configurador-galeria.css", "maps-config.js", "img/logo.jpg", "img/construccion/nosotros-led.jpg"]) {
    const response = await get("/" + name); assert.equal(response.status, 200, name);
    const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(sha256(bytes), expectedPublicHash(name), `HTTP bytes: ${name}`);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    if (name.endsWith(".html")) assert.doesNotMatch(bytes.toString("utf8"), /\/_next\//);
    results.push(`200 + exact SHA-256: /${name}`);
  }
  const sitemap = await (await get("/sitemap.xml")).text();
  assert.match(sitemap, /casa-demo-fortin/); assert.match(sitemap, /departamento-demo-tuxtepec/);
  assert.doesNotMatch(sitemap, /\/admin|borrador|archivado/);
  const robots = await (await get("/robots.txt")).text(); assert.match(robots, /Disallow: \//);
  results.push("Sitemap contains only public routes; robots blocks demo indexing.");
  console.log(results.join("\n"));
  console.log("HTTP checks complete. No browser was used; the local server will stop.");
} catch (error) {
  console.error(logs); throw error;
} finally {
  if (child.exitCode === null && !spawnError) { child.kill(); await exit; }
}
