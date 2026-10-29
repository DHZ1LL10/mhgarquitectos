import type { MetadataRoute } from "next";
import { deployment, site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (!deployment.publicIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: new URL("/sitemap.xml", site.url).href,
    host: site.url,
  };
}
