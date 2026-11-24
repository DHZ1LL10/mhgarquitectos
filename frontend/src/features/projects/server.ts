import "server-only";
import type { ProjectSummary } from "./types";
import { projectSummary } from "./contracts";

export async function projectSummaries(featured: boolean): Promise<ProjectSummary[]> {
  const base = process.env.PROPERTY_API_BASE_URL;
  if (!base) throw new Error("PROPERTY_API_BASE_URL is required for projects");
  const results: ProjectSummary[] = [];
  for (let offset = 0; ; offset += 100) {
    const response = await fetch(`${base.replace(/\/$/, "")}/projects?featured=${featured}&limit=100&offset=${offset}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de proyectos");
    const page: unknown = await response.json();
    if (!Array.isArray(page)) throw new Error("Invalid projects response");
    results.push(...page.map(projectSummary));
    if (page.length < 100) break;
  }
  return results;
}
