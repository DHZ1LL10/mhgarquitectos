export type PropertyStatus = "draft" | "published" | "archived";
export type PropertyOperation = "sale" | "rent";
export type PropertyType = "house" | "apartment" | "land";

export interface PropertyImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface PropertyFeatures {
  /** Legacy/general area retained for API compatibility. */
  areaM2: number;
  constructionAreaM2?: number;
  landAreaM2?: number;
  gardenAreaM2?: number;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  parkingSpaces?: number | null;
  constructionProgress?: number;
  constructionStatus?: string;
  distribution?: string[];
  amenities?: string[];
  listPrice?: number;
  bonus?: number;
  commercialLabel?: string;
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
  features: PropertyFeatures;
  images: PropertyImage[];
}
