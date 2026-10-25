"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "../api-client";
import { parseUser } from "../contracts";
import type { User } from "../types";
import styles from "../admin.module.css";

type SessionContextValue = {
  user: User;
  logout: () => Promise<void>;
  handleError: (reason: unknown) => string;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleError = useCallback((reason: unknown) => {
    if (reason instanceof ApiError && reason.status === 401) {
      setUser(null);
      router.replace("/admin/login");
      return "Tu sesión terminó. Inicia sesión nuevamente.";
    }
    return reason instanceof Error ? reason.message : "No se pudo completar la operación.";
  }, [router]);

  useEffect(() => {
    let active = true;
    adminApi().request("/auth/me")
      .then(value => { if (active) setUser(parseUser(value)); })
      .catch(reason => { if (active) setError(handleError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [handleError]);

  const logout = useCallback(async () => {
    await adminApi().request("/auth/logout", "POST");
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  const value = useMemo(() => user ? { user, logout, handleError } : null, [user, logout, handleError]);
  if (loading) return <div aria-live="polite" className={styles.boot}><h1>Administración MHG</h1><p>Preparando tu espacio de trabajo…</p></div>;
  if (!value) return <div role="alert" className={styles.boot}>{error || "Redirigiendo al acceso administrativo…"}</div>;
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useAdminSession must be used within AdminSessionProvider");
  return value;
}
