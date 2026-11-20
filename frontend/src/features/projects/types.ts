import type { PortfolioImage } from "@/data/portfolio";

export type ProjectSummary = {
  id: string; slug: string; category: "kitchen_furniture" | "design_construction";
  name: string; short_description: string; featured: boolean; featured_order: number | null;
  image_count: number; cover_image: MediaImage | null; status: "draft" | "published";
  updated_at?: string;
};
export type MediaImage = { id: string; provider: "local" | "cloudinary"; secure_url: string; width: number; height: number; alt_text: string; is_cover: boolean; sort_order: number };
export type ProjectDetail = ProjectSummary & { description: string; images: MediaImage[] };
export type CardProject = { id: string; slug: string; title: string; shortDescription: string; tag: string; coverImage: PortfolioImage; imageCount: number };
export const categories = [
  { slug: "kitchen_furniture", label: "Cocina y mobiliario", cta: {
    prompt: "¿Quieres transformar tu cocina o crear mobiliario a medida?", label: "Cotizar mi proyecto",
    href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20cotizar%20una%20cocina%20o%20mobiliario%20a%20medida.",
  } },
  { slug: "design_construction", label: "Diseño y construcción", cta: {
    prompt: "¿Tienes un proyecto residencial o comercial?", label: "Platicar sobre mi obra",
    href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20construir%20o%20remodelar.%20%C2%BFPodr%C3%ADan%20darme%20informaci%C3%B3n%3F",
  } },
] as const;
export function cardProject(project: ProjectSummary): CardProject {
  const image = project.cover_image;
  return { id: project.id, slug: project.slug, title: project.name, shortDescription: project.short_description,
    tag: categories.find(c => c.slug === project.category)!.label, imageCount: project.image_count,
    coverImage: image ? { src: image.secure_url, alt: image.alt_text, width: image.width, height: image.height } : { src: "/img/logo.jpg", alt: project.name, width: 400, height: 400 } };
}
