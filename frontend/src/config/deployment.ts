export type DeploymentEnvironment = "local" | "staging" | "production";

type DeploymentVariables = Record<string, string | undefined>;

function deploymentEnvironment(
  value: string | undefined,
  nodeEnvironment: string | undefined,
): DeploymentEnvironment {
  if (value === "local" || value === "staging" || value === "production") return value;
  if (value) throw new Error("DEPLOYMENT_ENV must be local, staging or production");
  if (nodeEnvironment === "production") {
    throw new Error("DEPLOYMENT_ENV is required for production-mode builds");
  }
  return "local";
}

function httpsUrl(value: string | undefined, name: string): URL {
  if (!value) throw new Error(`${name} is required outside local development`);
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${name} must be a valid HTTPS URL`); }
  if (
    parsed.protocol !== "https:"
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    throw new Error(`${name} must be a credential-free HTTPS URL without query or fragment`);
  }
  return parsed;
}

export function resolveDeploymentConfig(
  variables: DeploymentVariables = process.env,
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
) {
  const environment = deploymentEnvironment(variables.DEPLOYMENT_ENV, nodeEnvironment);
  if (environment !== "local") {
    const siteUrl = httpsUrl(variables.SITE_URL, "SITE_URL");
    if (siteUrl.pathname !== "/") throw new Error("SITE_URL must be an origin without a path");
    if (variables.PROPERTY_REPOSITORY !== "api") {
      throw new Error("PROPERTY_REPOSITORY must be api in staging and production");
    }
    const apiUrls = [
      httpsUrl(variables.PROPERTY_API_BASE_URL, "PROPERTY_API_BASE_URL"),
      httpsUrl(variables.NEXT_PUBLIC_API_BASE_URL, "NEXT_PUBLIC_API_BASE_URL"),
      httpsUrl(variables.CUSTOMIZER_API_BASE_URL, "CUSTOMIZER_API_BASE_URL"),
    ];
    if (new Set(apiUrls.map(url => url.href.replace(/\/$/, ""))).size !== 1) {
      throw new Error("Frontend API base URLs must be identical in staging and production");
    }
  }
  return {
    environment,
    publicIndexing: environment === "production",
  } as const;
}
