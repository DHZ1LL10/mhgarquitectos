import { resolveDeploymentConfig } from "./deployment.ts";
import { publicSite } from "./public-site.ts";

export const deployment = resolveDeploymentConfig();

export const site = {
  ...publicSite,
  url: process.env.SITE_URL || "https://mhgarquitectos.com",
} as const;
