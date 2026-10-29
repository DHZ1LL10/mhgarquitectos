import { ApiError } from "./api-client.ts";

export function initialSessionError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "";
  return error instanceof Error ? error.message : "No se pudo comprobar la sesión.";
}
