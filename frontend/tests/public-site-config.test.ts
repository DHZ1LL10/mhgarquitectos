import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { publicSite } from "../src/config/public-site.ts";

const frontendRoot = path.resolve(import.meta.dirname, "..");

function source(relativePath: string): string {
  return readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

test("public site configuration is browser-safe and environment-independent", () => {
  const publicSource = source("src/config/public-site.ts");

  assert.deepEqual(publicSite, {
    name: "MHG Arquitectos",
    generalWhatsApp: "5212711055612",
    quotesWhatsApp: "5212722200485",
  });
  assert.doesNotMatch(publicSource, /process\.env|DEPLOYMENT_ENV|resolveDeploymentConfig/);
  assert.doesNotMatch(publicSource, /from\s+["'][^"']*(?:deployment|config\/site)[^"']*["']/);
});

test("client components do not import server-only site or deployment configuration", () => {
  const clientViolations = sourceFiles(path.join(frontendRoot, "src"))
    .filter(file => /^\s*["']use client["'];/m.test(readFileSync(file, "utf8")))
    .filter(file => {
      const contents = readFileSync(file, "utf8");
      return /from\s+["'][^"']*(?:config\/site|config\/deployment)[^"']*["']/.test(contents);
    })
    .map(file => path.relative(frontendRoot, file));

  assert.deepEqual(clientViolations, []);
});
