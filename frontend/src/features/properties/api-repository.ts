import type { PropertyRepository } from "./repository.ts";
import type { Property } from "./types.ts";

type JsonObject = Record<string, unknown>;
type Fetcher = typeof fetch;

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid property API object");
  return value as JsonObject;
}
function string(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Invalid property API text");
  return value;
}
function number(value: unknown, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new Error("Invalid property API number");
  }
  return value;
}
function optionalNumber(value: unknown, integer = false): number | undefined {
  return value === undefined || value === null ? undefined : number(value, integer);
}
function nullableNumber(value: unknown, integer = false): number | null | undefined {
  return value === undefined ? undefined : value === null ? null : number(value, integer);
}
function optionalPercentage(value: unknown): number | undefined {
  const parsed = optionalNumber(value, true);
  if (parsed !== undefined && parsed > 100) throw new Error("Invalid property API percentage");
  return parsed;
}
function optionalString(value: unknown): string | undefined {
  return value === undefined || value === null ? undefined : string(value);
}
function optionalStrings(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error("Invalid property API text list");
  return value.map(string);
}

export function mapApiProperty(value: unknown): Property {
  const data = object(value);
  if (data.status !== "published") throw new Error("API returned a non-public property");
  if (data.currency !== "MXN") throw new Error("The current frontend property contract only supports MXN");
  if (data.operation !== "sale" && data.operation !== "rent") throw new Error("Invalid property operation");
  if (data.property_type !== "house" && data.property_type !== "apartment" && data.property_type !== "land") {
    throw new Error("Unsupported property type");
  }
  const slug = string(data.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid property slug");
  const location = object(data.location);
  const features = object(data.features);
  if (!Array.isArray(data.images)) throw new Error("Invalid property images");
  const rawPrice = data.price;
  if (typeof rawPrice !== "number" && (typeof rawPrice !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(rawPrice))) {
    throw new Error("Invalid property price");
  }
  return {
    id: string(data.id), slug, status: "published",
    title: string(data.title), description: string(data.description),
    operation: data.operation, propertyType: data.property_type,
    price: number(Number(rawPrice)), currency: "MXN",
    location: { city: string(location.city), state: string(location.state), neighborhood: string(location.neighborhood) },
    features: {
      areaM2: number(features.area_m2),
      constructionAreaM2: optionalNumber(features.construction_area_m2),
      landAreaM2: optionalNumber(features.land_area_m2),
      gardenAreaM2: optionalNumber(features.garden_area_m2),
      bedrooms: number(features.bedrooms, true),
      bathrooms: number(features.bathrooms, true),
      halfBathrooms: optionalNumber(features.half_bathrooms, true),
      parkingSpaces: nullableNumber(features.parking_spaces, true),
      constructionProgress: optionalPercentage(features.construction_progress),
      constructionStatus: optionalString(features.construction_status),
      distribution: optionalStrings(features.distribution),
      amenities: optionalStrings(features.amenities),
      listPrice: optionalNumber(features.list_price, true),
      bonus: optionalNumber(features.bonus, true),
      commercialLabel: optionalString(features.commercial_label),
    },
    images: data.images.map(value => {
      const image = object(value);
      const src = string(image.url);
      if ((!src.startsWith("/") || src.startsWith("//")) && !src.startsWith("https://")) {
        throw new Error("Invalid property image URL");
      }
      if (src.includes("\\")) throw new Error("Invalid property image URL");
      const width = number(image.width, true);
      const height = number(image.height, true);
      if (!width || !height) throw new Error("Invalid image dimensions");
      return { src, alt: string(image.alt), width, height };
    }),
  };
}

/** Server-side read adapter. No writes, auth, mock fallback, or client-side API secret. */
export class ApiPropertyRepository implements PropertyRepository {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(baseUrl: string, fetcher: Fetcher = fetch) {
    const url = new URL(baseUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error("PROPERTY_API_BASE_URL must be an HTTP(S) API URL without credentials, query or fragment");
    }
    this.baseUrl = url.href.replace(/\/$/, "");
    this.fetcher = fetcher;
  }

  private async request(path: string): Promise<Response> {
    return this.fetcher(this.baseUrl + path, {
      headers: { Accept: "application/json" },
      // Publishing in the CRM must be visible without rebuilding the frontend.
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  }

  async listPublished(): Promise<Property[]> {
    const records: Property[] = [];
    const ids = new Set<string>();
    const limit = 100;
    for (let page = 0; page < 1_000; page++) {
      const response = await this.request(`/properties?limit=${limit}&offset=${page * limit}`);
      if (!response.ok) throw new Error(`Property API returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("Property API list must be an array");
      for (const value of payload) {
        const property = mapApiProperty(value);
        if (ids.has(property.id)) throw new Error("Property API pagination returned duplicate IDs");
        ids.add(property.id);
        records.push(property);
      }
      if (payload.length < limit) return records;
    }
    throw new Error("Property API pagination exceeded its safety limit");
  }

  async getPublishedBySlug(slug: string): Promise<Property | null> {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
    const response = await this.request(`/properties/${encodeURIComponent(slug)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Property API returned HTTP ${response.status}`);
    const property = mapApiProperty(await response.json());
    if (property.slug !== slug) throw new Error("Property API returned a different slug");
    return property;
  }
}

