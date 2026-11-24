import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { projectSummary } from "../src/features/projects/contracts.ts";
import { cloudinaryLoader, previewImage } from "../src/features/projects/media.ts";
import { AdminApi } from "../src/features/admin/api-client.ts";
import { portfolioProjects } from "../src/data/portfolio.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("bootstrap matches all approved legacy descriptions, order and covers", () => {
  const source = JSON.parse(read("../../backend/app/projects/legacy_catalog.json"));
  assert.equal(source.length, 24);
  assert.equal(source.reduce((n: number, p: { images: unknown[] }) => n + p.images.length, 0), 381);
  for (const project of portfolioProjects) {
    const stored = source.find((p: { slug: string }) => p.slug === project.slug);
    for (const key of ["title", "category", "description", "shortDescription", "featured", "featuredOrder", "coverImage", "images"] as const) assert.deepEqual(stored[key], project[key]);
  }
});

test("public summaries strip galleries, full description and unexpected provider fields", () => {
  const image = { id: "image", provider: "local", secure_url: "/img/a.webp", width: 400, height: 300, alt_text: "Proyecto", is_cover: true, sort_order: 0, private_field: "must-not-cross" };
  const result = projectSummary({ id: "p", slug: "p", name: "Proyecto", category: "kitchen_furniture", status: "published", featured: true, featured_order: 1, short_description: "Resumen", image_count: 381, cover_image: image, images: Array(381).fill(image), description: "Detalle privado del DTO" });
  assert.ok(!("images" in result)); assert.ok(!("description" in result)); assert.ok(!("private_field" in result.cover_image!));
  const client = read("../src/components/site/PortfolioProjects.tsx");
  assert.doesNotMatch(client, /import\s+\{[^}]*\}\s+from\s+["']@\/data\/portfolio/);
  assert.match(client, /openProject = async/); assert.match(client, /\/projects\/\$\{encodeURIComponent\(project.slug\)\}/);
  assert.match(read("../src/app/(public)/page.tsx"), /projectSummaries\(true\)/);
  assert.match(read("../src/app/(public)/proyectos/page.tsx"), /projectSummaries\(false\)/);
});

test("local media is unchanged and Cloudinary delivery has bounded responsive transforms", () => {
  assert.equal(previewImage("/img/portfolio/a.webp"), "/img/portfolio/a.webp");
  assert.equal(previewImage("https://unrelated.example/a.jpg"), "https://unrelated.example/a.jpg");
  const cloud = "https://res.cloudinary.com/demo/image/upload/v1/mhg/project/photo.jpg";
  assert.match(cloudinaryLoader({ src: cloud, width: 160 }), /f_auto,q_auto,c_limit,w_160/);
  assert.match(cloudinaryLoader({ src: cloud, width: 9000 }), /w_2560/);
});

test("multipart Admin transport preserves credentials, CSRF header and native boundary", async () => {
  const data = new FormData(); data.append("file", new Blob(["fake"], { type: "image/png" }), "photo.png");
  const api = new AdminApi("https://api.example.test/api/v1", async (_url, init) => {
    assert.equal(init?.credentials, "include"); assert.equal(new Headers(init?.headers).get("X-MHG-Admin"), "1");
    assert.equal(new Headers(init?.headers).get("Content-Type"), null); assert.equal(init?.body, data);
    return Response.json({ id: "saved" });
  });
  assert.deepEqual(await api.request("/admin/media/projects/p/upload", "POST", data), { id: "saved" });
});

test("Admin workflows use shared incremental media and expose project permission", () => {
  const editor = read("../src/features/admin/properties/PropertyEditorView.tsx");
  assert.match(editor, /const \{ images, \.\.\.fields \} = value/);
  assert.match(editor, /id \? fields/);
  assert.match(editor, /MediaEditor kind="properties"/);
  assert.match(read("../src/features/admin/projects/ProjectEditor.tsx"), /MediaEditor kind="projects"/);
  assert.match(read("../src/features/admin/shared/MediaEditor.tsx"), /for \(const \[index, file\] of queue.entries\(\)\)/);
  assert.match(read("../src/features/admin/layout/AdminShell.tsx"), /projects.manage/);
});
