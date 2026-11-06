import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { publicDirectory, publicFiles, originalBytes, customization } from "./legacy-assets.mjs";

// Explicit allowlist; never recursively copy the repository root.
for (const name of publicFiles) {
  if (customization.modified[name] || customization.additions[name]) continue;
  const bytes = await originalBytes(name);
  const destination = path.join(publicDirectory, name);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}
console.log(`Copied ${publicFiles.length} protected files without conversion.`);
