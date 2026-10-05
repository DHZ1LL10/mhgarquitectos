import type { Property } from "./types.ts";

export const operationLabels = { sale: "Venta", rent: "Renta" } as const;
export const typeLabels = { house: "Casa", apartment: "Departamento", land: "Terreno" } as const;
export const statusLabels = { draft: "Borrador", published: "Publicado", archived: "Archivado" } as const;
export function formatPrice(property: Pick<Property, "price" | "currency" | "operation">) {
  const amount = new Intl.NumberFormat("es-MX", { style: "currency", currency: property.currency, maximumFractionDigits: 0 }).format(property.price);
  return `${amount} MXN${property.operation === "rent" ? " / mes" : ""}`;
}
