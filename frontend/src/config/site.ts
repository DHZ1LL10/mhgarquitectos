import { resolveDeploymentConfig } from "./deployment.ts";

export const deployment = resolveDeploymentConfig();

export const site = {
  name: "MHG Arquitectos",
  url: process.env.SITE_URL || "https://mhgarquitectos.com",
  generalWhatsApp: "5212711055612",
  quotesWhatsApp: "5212722200485",
} as const;
