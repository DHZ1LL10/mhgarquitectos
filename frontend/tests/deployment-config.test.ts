import assert from "node:assert/strict";
import test from "node:test";
import { resolveDeploymentConfig } from "../src/config/deployment.ts";

const staging = {
  DEPLOYMENT_ENV: "staging",
  SITE_URL: "https://staging.mhgarquitectos.com",
  PROPERTY_REPOSITORY: "api",
  PROPERTY_API_BASE_URL: "https://api-staging.mhgarquitectos.com/api/v1",
  NEXT_PUBLIC_API_BASE_URL: "https://api-staging.mhgarquitectos.com/api/v1",
  CUSTOMIZER_API_BASE_URL: "https://api-staging.mhgarquitectos.com/api/v1",
};

test("managed builds require an explicit deployment environment", () => {
  assert.throws(() => resolveDeploymentConfig({}, "production"), /DEPLOYMENT_ENV is required/);
});

test("staging is fail-closed for indexing and requires API mode", () => {
  assert.deepEqual(resolveDeploymentConfig(staging, "production"), {
    environment: "staging",
    publicIndexing: false,
  });
  assert.throws(
    () => resolveDeploymentConfig({ ...staging, PROPERTY_REPOSITORY: "local" }, "production"),
    /must be api/,
  );
});

test("production is indexable only with complete HTTPS configuration", () => {
  const production = {
    ...staging,
    DEPLOYMENT_ENV: "production",
    SITE_URL: "https://mhgarquitectos.com",
    PROPERTY_API_BASE_URL: "https://api.mhgarquitectos.com/api/v1",
    NEXT_PUBLIC_API_BASE_URL: "https://api.mhgarquitectos.com/api/v1",
    CUSTOMIZER_API_BASE_URL: "https://api.mhgarquitectos.com/api/v1",
  };
  assert.deepEqual(resolveDeploymentConfig(production, "production"), {
    environment: "production",
    publicIndexing: true,
  });
  assert.throws(
    () => resolveDeploymentConfig({ ...production, SITE_URL: "http://mhgarquitectos.com" }, "production"),
    /HTTPS URL/,
  );
  assert.throws(
    () => resolveDeploymentConfig({ ...production, CUSTOMIZER_API_BASE_URL: staging.CUSTOMIZER_API_BASE_URL }, "production"),
    /must be identical/,
  );
});
