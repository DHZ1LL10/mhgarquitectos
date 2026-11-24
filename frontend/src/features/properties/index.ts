import type { PropertyRepository } from "./repository.ts";
import { createConfiguredPropertyRepository } from "./configured-repository.ts";

// Server composition point. Existing views and the independent demo admin stay unchanged.
export const propertyRepository: PropertyRepository = createConfiguredPropertyRepository({
  PROPERTY_REPOSITORY: process.env.PROPERTY_REPOSITORY,
  PROPERTY_API_BASE_URL: process.env.PROPERTY_API_BASE_URL,
});
