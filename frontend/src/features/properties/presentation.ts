import type { Property } from "./types.ts";
import { site } from "../../config/site.ts";

export const operationLabels = { sale: "Venta", rent: "Renta" } as const;
export const typeLabels = { house: "Casa", apartment: "Departamento", land: "Terreno" } as const;
export const statusLabels = { draft: "Borrador", published: "Publicado", archived: "Archivado" } as const;
export function formatCurrency(amount: number, currency: Property["currency"] = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
export function formatPrice(property: Pick<Property, "price" | "currency" | "operation">) {
  const amount = formatCurrency(property.price, property.currency);
  return `${amount} MXN${property.operation === "rent" ? " / mes" : ""}`;
}

export function propertySeoDescription(property: Property): string {
  const features = property.features;
  if (features.landAreaM2 && features.constructionAreaM2 && features.gardenAreaM2) {
    return `${features.landAreaM2} m² de terreno, ${features.constructionAreaM2} m² de construcción, ${features.gardenAreaM2} m² de jardín, ${features.bedrooms} recámaras y precio de oportunidad de ${formatPrice(property)}.`;
  }
  return property.description;
}

export function propertyWhatsAppUrl(property: Property): string {
  const message = `Hola, me interesa la residencia en venta en Mata Larga, Fortín, con precio de oportunidad de ${formatPrice(property)}. ¿Me pueden compartir más información y disponibilidad para visitarla?`;
  return `https://wa.me/${site.generalWhatsApp}?text=${encodeURIComponent(message)}`;
}
