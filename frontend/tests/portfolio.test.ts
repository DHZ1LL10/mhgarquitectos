import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  featuredPortfolioProjects,
  portfolioAudit,
  portfolioCategories,
  portfolioProjects,
  wrapPortfolioIndex,
} from "../src/data/portfolio.ts";

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

test("portfolio exposes exactly the two approved categories with project-level cards", () => {
  assert.deepEqual(portfolioCategories.map((category) => category.label), [
    "Cocina y mobiliario",
    "Diseño y construcción",
  ]);
  assert.deepEqual(portfolioCategories.map((category) => category.projects.length), [20, 4]);
  assert.equal(portfolioProjects.length, 24);
  assert.equal(new Set(portfolioProjects.map((project) => project.id)).size, 24);
  for (const category of portfolioCategories) {
    assert.ok(category.projects.every((project) => project.category === category.slug));
  }
});

test("landing selection exposes nine deterministic featured projects across both categories", () => {
  assert.equal(featuredPortfolioProjects.length, 9);
  assert.deepEqual(featuredPortfolioProjects.map((project) => project.featuredOrder), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(new Set(featuredPortfolioProjects.map((project) => project.featuredOrder)).size, 9);
  assert.deepEqual(new Set(featuredPortfolioProjects.map((project) => project.category)), new Set([
    "cocina-mobiliario",
    "diseno-construccion",
  ]));
  assert.deepEqual(featuredPortfolioProjects.map((project) => [project.slug, project.coverImage.src]), [
    ["cocina-encinos", "/img/portfolio/projects/cocina-encinos/001.webp"],
    ["cocina-orizaba", "/img/portfolio/projects/cocina-orizaba/059.webp"],
    ["showroom-tuxtepec", "/img/portfolio/projects/showroom-tuxtepec/054.webp"],
    ["mobiliario-residencial-terra", "/img/portfolio/projects/mobiliario-residencial-terra/021.webp"],
    ["cocina-lambrin", "/img/portfolio/projects/cocina-lambrin/011.webp"],
    ["cocina-ambar", "/img/portfolio/projects/cocina-ambar/005.webp"],
    ["cocina-verde-isla", "/img/portfolio/projects/cocina-verde-isla/001.webp"],
    ["residencia-fachada-piedra", "/img/portfolio/projects/residencia-fachada-piedra/001.webp"],
    ["interior-residencial", "/img/portfolio/projects/interior-residencial/001.webp"],
  ]);
  for (const project of portfolioProjects) {
    assert.equal(project.featured, project.featuredOrder !== null, project.slug);
  }
});

test("the audited source becomes 381 unique, existing project images", () => {
  assert.equal(portfolioAudit.sourceImages, 436);
  assert.equal(portfolioAudit.usedSourceImages, 376);
  assert.equal(portfolioAudit.constructionImages, 5);
  assert.equal(portfolioAudit.derivedImages, 381);
  assert.equal(portfolioAudit.excluded, 60);
  assert.deepEqual(portfolioAudit.exclusionReasons, {
    exact_duplicate: 9,
    privacy: 27,
    brand_asset: 2,
    marketing_graphic: 22,
  });

  const images = portfolioProjects.flatMap((project) => project.images);
  assert.equal(images.length, 381);
  assert.equal(new Set(images.map((image) => image.src)).size, images.length);
  const routeDigest = createHash("sha256")
    .update(images.map((image) => image.src).sort().join("\n"))
    .digest("hex");
  assert.equal(routeDigest, "7e1a450aae76f29e25841971aee28f9426df4767c0eca34f48ffbb5c1cf6bd2e");
  for (const project of portfolioProjects) {
    assert.ok(project.images.includes(project.coverImage), project.slug);
    assert.ok(project.images.length > 0, project.slug);
    for (const image of project.images) {
      assert.match(image.src, new RegExp(`^/img/portfolio/projects/${project.slug}/\\d{3}\\.webp$`));
      assert.ok(image.width > 0 && image.height > 0, image.src);
      assert.ok(image.width <= 1800 && image.height <= 1800, image.src);
      assert.match(image.alt, new RegExp(`^${project.title} — fotografía \\d+ de \\d+$`));
      assert.ok(existsSync(path.join(publicDirectory, image.src.slice(1))), image.src);
    }
  }
});

test("landing and full catalog reuse the same cards and modal implementation", () => {
  const sections = readFileSync(path.join(frontend, "src/components/site/HomeSections.tsx"), "utf8");
  const catalog = readFileSync(path.join(frontend, "src/app/(public)/proyectos/page.tsx"), "utf8");
  const component = readFileSync(path.join(frontend, "src/components/site/PortfolioProjects.tsx"), "utf8");
  assert.match(sections, /<PortfolioProjects variant="featured" \/>/);
  assert.match(catalog, /<PortfolioProjects variant="catalog" \/>/);
  assert.equal((component.match(/role="dialog"/g) ?? []).length, 1);
  assert.match(component, /visibleProjects\.map\(\(project\) =>/);
  assert.match(component, /href="\/proyectos">Ver todos los proyectos<\/Link>/);
  assert.doesNotMatch(component, /featuredOrder/);
});

test("all portfolio derivatives are WebP files without EXIF, XMP or embedded profiles", () => {
  const portfolioDirectory = path.join(publicDirectory, "img", "portfolio");
  const files = readdirSync(portfolioDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
  assert.equal(files.length, 381);
  for (const file of files) {
    assert.equal(path.extname(file), ".webp", file);
    const chunks = webpChunks(readFileSync(file));
    assert.ok(!chunks.includes("EXIF"), file);
    assert.ok(!chunks.includes("XMP "), file);
    assert.ok(!chunks.includes("ICCP"), file);
  }
});

test("project modal contracts cover open, close, navigation, focus and loading behavior", () => {
  const component = readFileSync(path.join(frontend, "src/components/site/PortfolioProjects.tsx"), "utf8");
  const styles = readFileSync(path.join(frontend, "src/components/site/portfolio.module.css"), "utf8");
  assert.match(component, /onClick=\{\(event\) => openProject\(project, event\.currentTarget\)\}/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /event\.key === "Escape"/);
  assert.match(component, /event\.key === "ArrowLeft"/);
  assert.match(component, /event\.key === "ArrowRight"/);
  assert.match(component, /event\.key !== "Tab"/);
  assert.match(component, /document\.body\.style\.overflow = "hidden"/);
  assert.match(component, /openerRef\.current\?\.focus\(\)/);
  assert.match(component, /setActiveImageIndex\(index\)/);
  assert.match(component, /new window\.Image\(\)/);
  assert.match(component, /loading="lazy"/);
  assert.match(component, /src=\{project\.coverImage\.src\}/);
  assert.match(component, /\{activeProject && activeImage \? \(/);
  assert.match(component, /if \(event\.target === event\.currentTarget\) closeProject\(\)/);
  assert.match(styles, /grid-template-columns: minmax\(0, 74fr\) minmax\(260px, 26fr\)/);
  assert.match(styles, /height: min\(94dvh, 940px\)/);
  assert.match(styles, /\.mainImage > img \{[\s\S]*?object-fit: contain/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?grid-template-columns: 1fr;[\s\S]*?grid-template-rows: minmax\(58dvh, auto\) auto/);
  assert.match(styles, /\.cardImage \{[\s\S]*?aspect-ratio: 4 \/ 3/);
  assert.equal(wrapPortfolioIndex(-1, 5), 4);
  assert.equal(wrapPortfolioIndex(5, 5), 0);
  assert.equal(wrapPortfolioIndex(2, 5), 2);
});
