import { ApiPropertyRepository } from "./api-repository.ts";
import { createLocalPropertyRepository } from "./local-repository.ts";
import type { PropertyRepository } from "./repository.ts";

type RepositoryEnvironment = {
  PROPERTY_REPOSITORY?: string;
  PROPERTY_API_BASE_URL?: string;
};

export function createConfiguredPropertyRepository(env: RepositoryEnvironment): PropertyRepository {
  const source = env.PROPERTY_REPOSITORY || "local";
  if (source === "local") return createLocalPropertyRepository();
  if (source !== "api") throw new Error("PROPERTY_REPOSITORY must be local or api");
  if (!env.PROPERTY_API_BASE_URL) throw new Error("PROPERTY_API_BASE_URL is required in api mode");
  return new ApiPropertyRepository(env.PROPERTY_API_BASE_URL);
}

