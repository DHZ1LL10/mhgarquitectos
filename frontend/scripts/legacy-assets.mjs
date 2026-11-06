import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const frontend = fileURLToPath(new URL("../", import.meta.url));
export const repository = path.resolve(frontend, "..");
export const publicDirectory = path.join(frontend, "public");
export const baseline = JSON.parse(await readFile(path.join(frontend, "docs/legacy-baseline.json"), "utf8"));
export const customization = JSON.parse(await readFile(path.join(frontend, "docs/legacy-customizations.json"), "utf8"));
const documents = new Set([
  "cocina-customizer.html", "cotizador.js", "galeria-configurador.js",
  "configurador-galeria.css", "style.css",
]);
export const publicFiles = [...Object.keys(baseline.files).filter(name => documents.has(name) || name.startsWith("img/")), ...Object.keys(customization.additions)];
export function expectedPublicHash(name) { return customization.modified[name] || customization.additions[name] || baseline.files[name]; }
export function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
export async function originalBytes(name) {
  const bytes = await readFile(path.join(repository, name));
  if (sha256(bytes) !== baseline.files[name]) throw new Error(`Protected original changed: ${name}`);
  return bytes;
}
export async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in public: ${entry.name}`);
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(location));
    else files.push(location);
  }
  return files;
}
