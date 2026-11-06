import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { baseline, repository, publicDirectory, publicFiles, originalBytes, expectedPublicHash, sha256, walk } from "./legacy-assets.mjs";

for (const name of Object.keys(baseline.files)) await originalBytes(name);
for (const name of publicFiles) {
  assert.equal(sha256(await readFile(path.join(publicDirectory, name))), expectedPublicHash(name), `Copy differs: ${name}`);
}
const actual = (await walk(publicDirectory)).map(file => path.relative(publicDirectory, file).replaceAll("\\", "/")).sort();
const applicationAssetPrefixes = ["img/propiedades/", "img/portfolio/"];
const actualLegacyFiles = actual.filter(name => !applicationAssetPrefixes.some(prefix => name.startsWith(prefix)));
assert.deepEqual(actualLegacyFiles, [...publicFiles].sort(), "Unexpected or missing legacy files in public/");
for (const name of ["script.js", "modals.js", "cotizador.js", "galeria-configurador.js"]) {
  new vm.Script(await readFile(path.join(repository, name), "utf8"), { filename: name });
}
for (const name of ["cotizador.js", "kitchen-submission.js"]) {
  new vm.Script(await readFile(path.join(publicDirectory, name), "utf8"), { filename: `public/${name}` });
}
console.log(`Verified ${Object.keys(baseline.files).length} original hashes and ${publicFiles.length} public copies; legacy JS syntax OK.`);
