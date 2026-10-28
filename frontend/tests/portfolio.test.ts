import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { portfolioCategories } from "../src/data/portfolio.ts";

const frontend = path.resolve(import.meta.dirname, "..");
const publicDirectory = path.join(frontend, "public");

function webpChunks(bytes: Buffer) {
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
  const chunks: string[] = [];
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.subarray(offset, offset + 4).toString("ascii");
    const size = bytes.readUInt32LE(offset + 4);
    chunks.push(name);
    offset += 8 + size + (size % 2);
  }
  return chunks;
}

test("portfolio exposes the four approved categories and curated counts", () => {
  assert.deepEqual(portfolioCategories.map(category => category.label), [
    "Diseño y construcción",
    "Cocinas",
    "Carpintería y mobiliario",
    "Showroom Tuxtepec",
  ]);
  assert.deepEqual(portfolioCategories.map(category => category.projects.length), [5, 12, 14, 8]);
  for (const category of portfolioCategories) {
    assert.ok(category.projects.every(project => project.category === category.slug));
  }
});

test("every portfolio entry has a unique existing image with intrinsic dimensions and alt text", () => {
  const projects = portfolioCategories.flatMap(category => category.projects);
  assert.equal(new Set(projects.map(project => project.src)).size, projects.length);
  for (const project of projects) {
    assert.match(project.src, /^\/img\//);
    assert.ok(project.width > 0 && project.height > 0, project.src);
    assert.match(project.alt, /MHG Arquitectos|Recámara|Obra en proceso/);
    assert.ok(existsSync(path.join(publicDirectory, project.src.slice(1))), project.src);
  }
});

test("new public derivatives are WebP files without EXIF, XMP or embedded profiles", () => {
  const portfolioDirectory = path.join(publicDirectory, "img", "portfolio");
  const files = readdirSync(portfolioDirectory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name));
  assert.equal(files.length, 34);
  for (const file of files) {
    assert.equal(path.extname(file), ".webp", file);
    const bytes = readFileSync(file);
    const chunks = webpChunks(bytes);
    assert.ok(!chunks.includes("EXIF"), file);
    assert.ok(!chunks.includes("XMP "), file);
    assert.ok(!chunks.includes("ICCP"), file);
  }
});

test("portfolio UI keeps lazy Next images, category lightboxes and keyboard tabs", () => {
  const sections = readFileSync(path.join(frontend, "src/components/site/HomeSections.tsx"), "utf8");
  const interactions = readFileSync(path.join(frontend, "src/components/site/SiteInteractions.tsx"), "utf8");
  const styles = readFileSync(path.join(frontend, "src/components/site/portfolio.module.css"), "utf8");
  assert.match(sections, /from "next\/image"/);
  assert.match(sections, /loading="lazy"/);
  assert.match(sections, /data-full-src=\{project\.src\}/);
  assert.match(interactions, /source\.dataset\.fullSrc \|\| source\.src/);
  assert.match(interactions, /ArrowRight/);
  assert.match(interactions, /ArrowLeft/);
  assert.match(interactions, /event\.key === "Home"/);
  assert.match(interactions, /event\.key === "End"/);
  assert.match(interactions, /if \(e\.key === "Escape"\) closeLightbox\(\)/);
  assert.match(styles, /\.portrait img \{\s*object-fit: contain;/);
  assert.match(styles, /\.tabs \{[\s\S]*?overflow-x: auto;/);
});
