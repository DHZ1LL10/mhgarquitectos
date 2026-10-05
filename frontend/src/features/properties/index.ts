import type { PropertyRepository } from "./repository.ts";
import { createLocalPropertyRepository } from "./local-repository.ts";

// Composition point: future HTTP repository is selected here, not in views.
export const propertyRepository: PropertyRepository = createLocalPropertyRepository();
