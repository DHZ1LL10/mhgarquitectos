import type { Property } from "../types.ts";

export function validateDemoProperty(property: Property, existing: readonly Property[]): string[] {
  const errors: string[] = [];
  if (!property.title.trim() || property.title.length > 160) errors.push("El título es obligatorio y admite hasta 160 caracteres.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(property.slug) || property.slug.length > 100) errors.push("El slug debe usar minúsculas, números y guiones, con un máximo de 100 caracteres.");
  if (existing.some(item => item.id !== property.id && item.slug === property.slug)) errors.push("Ya existe otra propiedad con ese slug.");
  if (!property.description.trim() || property.description.length > 5000) errors.push("La descripción es obligatoria y admite hasta 5000 caracteres.");
  if (!property.location.city.trim() || !property.location.state.trim() || !property.location.neighborhood.trim()) errors.push("Completa ciudad, estado y zona.");
  if (!Number.isFinite(property.price) || property.price <= 0) errors.push("El precio debe ser mayor que cero.");
  if (!Number.isFinite(property.features.areaM2) || property.features.areaM2 <= 0) errors.push("La superficie debe ser mayor que cero.");
  for (const key of ["bedrooms", "bathrooms", "parkingSpaces"] as const) {
    if (!Number.isInteger(property.features[key]) || property.features[key] < 0) errors.push("Recámaras, baños y estacionamientos deben ser enteros no negativos.");
  }
  if (!["draft", "published", "archived"].includes(property.status)) errors.push("Estado de publicación inválido.");
  if (!["sale", "rent"].includes(property.operation)) errors.push("Operación inválida.");
  if (!["house", "apartment", "land"].includes(property.propertyType)) errors.push("Tipo de propiedad inválido.");
  if (property.currency !== "MXN") errors.push("Esta demostración utiliza MXN.");
  if (!property.images.length || property.images.some(image => !image.src.startsWith("/img/") || image.src.includes("..") || !image.alt.trim() || image.width <= 0 || image.height <= 0)) errors.push("Selecciona una fotografía local válida con texto alternativo.");
  return [...new Set(errors)];
}

export function saveDemoProperty(records: readonly Property[], property: Property): Property[] {
  const errors = validateDemoProperty(property, records);
  if (errors.length) throw new Error(errors.join(" "));
  const updated = records.some(item => item.id === property.id)
    ? records.map(item => item.id === property.id ? property : item)
    : [...records, property];
  return structuredClone(updated);
}
