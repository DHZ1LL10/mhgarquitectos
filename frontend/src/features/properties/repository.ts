import type { Property } from "./types.ts";

/** Public read contract. An HTTP adapter can replace the local implementation. */
export interface PropertyRepository {
  listPublished(): Promise<Property[]>;
  getPublishedBySlug(slug: string): Promise<Property | null>;
}
