import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Mock content is never intentionally indexed. This is not authentication.
  return { rules: { userAgent: "*", disallow: "/" } };
}
