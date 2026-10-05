export type PropertyStatus = "draft" | "published" | "archived";
export type PropertyOperation = "sale" | "rent";
export type PropertyType = "house" | "apartment" | "land";

export interface PropertyImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Property {
  id: string;
  slug: string;
  status: PropertyStatus;
  title: string;
  description: string;
  operation: PropertyOperation;
  propertyType: PropertyType;
  price: number;
  currency: "MXN";
  location: { city: string; state: string; neighborhood: string };
  features: { areaM2: number; bedrooms: number; bathrooms: number; parkingSpaces: number };
  images: PropertyImage[];
}
