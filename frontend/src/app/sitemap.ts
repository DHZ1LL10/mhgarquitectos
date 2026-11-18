import type { MetadataRoute } from "next";
import { propertyRepository } from "@/features/properties";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await propertyRepository.listPublished();
  return ["/", "/propiedades", ...properties.map(property => `/propiedades/${property.slug}`)]
    .map(route => ({ url: new URL(route, site.url).href }));
}
