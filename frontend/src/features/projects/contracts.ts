import type { MediaImage, ProjectSummary } from "./types.ts";

/** Whitelist the RSC payload even if an API accidentally adds detail fields. */
export function projectSummary(value: unknown): ProjectSummary {
  if (!value || typeof value !== "object") throw new Error("Invalid project summary");
  const p = value as ProjectSummary;
  if (typeof p.id !== "string" || typeof p.slug !== "string" || typeof p.name !== "string" || typeof p.short_description !== "string" || !["kitchen_furniture", "design_construction"].includes(p.category) || !["draft", "published"].includes(p.status) || typeof p.featured !== "boolean" || !Number.isInteger(p.image_count) || p.image_count < 0 || (p.featured_order !== null && (!Number.isInteger(p.featured_order) || p.featured_order < 1 || p.featured_order > 9))) throw new Error("Invalid project summary");
  let cover: MediaImage | null = null;
  if (p.cover_image) {
    const image = p.cover_image;
    if (typeof image.secure_url !== "string" || !image.width || !image.height) throw new Error("Invalid project cover");
    cover = { id: image.id, provider: image.provider, secure_url: image.secure_url, width: image.width, height: image.height, alt_text: image.alt_text, is_cover: image.is_cover, sort_order: image.sort_order };
  }
  return { id: p.id, slug: p.slug, name: p.name, category: p.category, short_description: p.short_description, status: p.status, featured: p.featured, featured_order: p.featured_order, image_count: p.image_count, cover_image: cover };
}
