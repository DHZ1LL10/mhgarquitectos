import type { NextConfig } from "next";
import { resolveDeploymentConfig, type DeploymentEnvironment } from "./src/config/deployment.ts";

function apiOrigin(): string | null {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

export function buildContentSecurityPolicy(
  environment: string | undefined = process.env.NODE_ENV,
): string {
  const connectSources = ["'self'", apiOrigin()].filter(Boolean).join(" ");
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    ...(environment === "development" ? ["'unsafe-eval'"] : []),
    "https://cdnjs.cloudflare.com",
    "https://unpkg.com",
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `connect-src ${connectSources}`,
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "frame-src https://www.google.com",
    "worker-src 'self' blob:",
  ].join("; ");
}

export function buildSecurityHeaders(
  environment: DeploymentEnvironment,
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
) {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(nodeEnvironment) },
    ...(environment === "production"
      ? []
      : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
  ];
}

const deployment = resolveDeploymentConfig();
const securityHeaders = buildSecurityHeaders(deployment.environment);

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/index.html", destination: "/" }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
