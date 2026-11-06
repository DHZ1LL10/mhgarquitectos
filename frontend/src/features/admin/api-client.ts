export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.name = "ApiError"; this.status = status; }
}

function requestTimeoutSignal(): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(15000);
  }
  return undefined;
}

export class AdminApi {
  private readonly base: string;
  private readonly fetcher: typeof fetch;
  constructor(baseUrl: string, fetcher: typeof fetch = fetch) {
    this.fetcher = fetcher.bind(globalThis);
    if (!baseUrl) throw new ApiError(0, "Falta configurar NEXT_PUBLIC_API_BASE_URL para el panel.");
    let url: URL;
    try { url = new URL(baseUrl); } catch { throw new ApiError(0, "La URL de API no es válida."); }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new ApiError(0, "La URL de API no es válida.");
    this.base = url.href.replace(/\/$/, "");
  }
  async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    if (!path.startsWith("/") || path.startsWith("//")) throw new ApiError(0, "Ruta de API no válida.");
    let response: Response;
    try {
      const signal = requestTimeoutSignal();
      response = await this.fetcher(this.base + path, {
        method, credentials: "include", cache: "no-store",
        ...(signal ? { signal } : {}),
        headers: { Accept: "application/json", "X-MHG-Admin": "1", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch { throw new ApiError(0, "No se pudo conectar con la API. Si estabas guardando, recarga la lista antes de volver a enviar."); }
    if (!response.ok) {
      let detail = "";
      try {
        const payload = await response.json();
        detail = payload.error?.message || "";
        if (Array.isArray(payload.error?.details)) detail += ": " + payload.error.details.map((item: { location: string[]; message: string }) => `${item.location.join(".")}: ${item.message}`).join("; ");
      } catch { /* status remains authoritative */ }
      const message = response.status === 401 && path === "/auth/login" ? "Credenciales incorrectas." : response.status === 401 ? "Tu sesión no está activa. Inicia sesión." : response.status === 403 ? "No tienes permiso para esta operación o el origen no está autorizado." : response.status === 429 ? "Demasiados intentos. Espera 15 minutos antes de volver a intentar." : detail || `La API respondió ${response.status}.`;
      throw new ApiError(response.status, message);
    }
    if (response.status === 204) return undefined as T;
    try { return await response.json() as T; } catch { throw new ApiError(0, "La API devolvió una respuesta no válida."); }
  }
}
export function resolveAdminApiBaseUrl(value = process.env.NEXT_PUBLIC_API_BASE_URL) { return value || ""; }
export function adminApi() { return new AdminApi(resolveAdminApiBaseUrl()); }
