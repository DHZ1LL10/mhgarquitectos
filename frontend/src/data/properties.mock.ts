import type { Property } from "../features/properties/types.ts";

/** Fictional listings. Portfolio images illustrate the demo, never availability. */
export const mockProperties: readonly Property[] = [
  {
    id: "demo-001", slug: "casa-demo-fortin", status: "published",
    title: "Casa de ejemplo en Fortín",
    description: "Ficha de demostración de una casa con espacios abiertos y áreas de descanso. El precio, la ubicación y las características son ficticios. Las fotografías pertenecen al portafolio de MHG y no representan una oferta inmobiliaria disponible.",
    operation: "sale", propertyType: "house", price: 2850000, currency: "MXN",
    location: { city: "Fortín de las Flores", state: "Veracruz", neighborhood: "Zona de ejemplo" },
    features: { areaM2: 180, bedrooms: 3, bathrooms: 2, parkingSpaces: 2 },
    images: [
      { src: "/img/fachada-frente.jpg", alt: "Fachada del portafolio MHG utilizada como ejemplo", width: 1080, height: 608 },
      { src: "/img/construccion/entrada.jpg", alt: "Entrada del portafolio MHG utilizada como ejemplo", width: 1080, height: 608 },
      { src: "/img/construccion/recamara.jpg", alt: "Recámara del portafolio MHG utilizada como ejemplo", width: 1080, height: 607 },
    ],
  },
  {
    id: "demo-002", slug: "departamento-demo-tuxtepec", status: "published",
    title: "Departamento de ejemplo en Tuxtepec",
    description: "Ejemplo de ficha de departamento en renta para explorar el catálogo. Todos los datos comerciales son ficticios. La imagen ilustra un proyecto del portafolio y no acredita disponibilidad de un inmueble.",
    operation: "rent", propertyType: "apartment", price: 12000, currency: "MXN",
    location: { city: "Tuxtepec", state: "Oaxaca", neighborhood: "Zona de ejemplo" },
    features: { areaM2: 85, bedrooms: 2, bathrooms: 1, parkingSpaces: 1 },
    images: [{ src: "/img/interiorismo/espacio-1.jpg", alt: "Interior del portafolio MHG utilizado como ejemplo", width: 1496, height: 1496 }],
  },
  {
    id: "demo-003", slug: "casa-demo-borrador", status: "draft",
    title: "Casa de ejemplo en borrador", description: "Borrador ficticio para probar edición. No debe aparecer en el catálogo ni tener una ficha pública.",
    operation: "sale", propertyType: "house", price: 1950000, currency: "MXN",
    location: { city: "Fortín de las Flores", state: "Veracruz", neighborhood: "Zona de ejemplo" },
    features: { areaM2: 120, bedrooms: 2, bathrooms: 1, parkingSpaces: 1 },
    images: [{ src: "/img/construccion/entrada.jpg", alt: "Fotografía de ejemplo del portafolio", width: 1080, height: 608 }],
  },
  {
    id: "demo-004", slug: "departamento-demo-archivado", status: "archived",
    title: "Departamento de ejemplo archivado", description: "Registro ficticio archivado. No debe aparecer en el catálogo ni tener una ficha pública.",
    operation: "rent", propertyType: "apartment", price: 9000, currency: "MXN",
    location: { city: "Tuxtepec", state: "Oaxaca", neighborhood: "Zona de ejemplo" },
    features: { areaM2: 70, bedrooms: 1, bathrooms: 1, parkingSpaces: 0 },
    images: [{ src: "/img/interiorismo/espacio-1.jpg", alt: "Fotografía de ejemplo del portafolio", width: 1496, height: 1496 }],
  },
];

export function createDemoProperties(): Property[] { return structuredClone([...mockProperties]); }
