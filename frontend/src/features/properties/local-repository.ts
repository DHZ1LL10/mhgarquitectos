import type { PropertyRepository } from "./repository.ts";
import type { Property } from "./types.ts";
import { mockProperties } from "../../data/properties.mock.ts";

export function createLocalPropertyRepository(seed: readonly Property[] = mockProperties): PropertyRepository {
  // Protect the source and subsequent reads from changes made by consumers.
  const records = structuredClone([...seed]);
  return {
    async listPublished() { return structuredClone(records.filter(property => property.status === "published")); },
    async getPublishedBySlug(slug) {
      const property = records.find(item => item.slug === slug && item.status === "published");
      return property ? structuredClone(property) : null;
    },
  };
}
