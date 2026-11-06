import type { ImageInput, PropertyInput } from "../types.ts";

export function slugifyPropertyTitle(title: string): string {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX").trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160).replace(/-+$/g, "");
}

export function slugAfterTitleChange(title: string, currentSlug: string, manuallyEdited: boolean): string {
  return manuallyEdited ? currentSlug : slugifyPropertyTitle(title);
}

export function moveImage(images: ImageInput[], from: number, to: number): ImageInput[] {
  if (from < 0 || from >= images.length || to < 0 || to >= images.length || from === to) return [...images];
  const result = [...images];
  const [image] = result.splice(from, 1);
  result.splice(to, 0, image);
  return result;
}

export function publicationCopy(status: PropertyInput["status"]): string {
  if (status === "published") return "Visible de inmediato en landing, catálogo y detalle público al guardar.";
  if (status === "archived") return "Oculta del sitio público; permanece disponible en administración.";
  return "No visible públicamente. Puedes completar y revisar la ficha antes de publicar.";
}

export function publicationIssues(property: PropertyInput): string[] {
  if (property.status !== "published") return [];
  const issues: string[] = [];
  if (!property.title.trim() || !property.description.trim()) issues.push("información general");
  if (!property.location.city.trim() || !property.location.state.trim() || !property.location.neighborhood.trim()) issues.push("ubicación");
  if (!(Number(property.features.area_m2) > 0)) issues.push("superficie");
  if (!(Number(property.price) > 0)) issues.push("precio");
  if (!property.images.length || property.images.some(image => !image.url.trim() || !image.alt.trim() || image.width < 1 || image.height < 1)) issues.push("fotografías");
  return issues;
}
