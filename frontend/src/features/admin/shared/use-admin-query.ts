"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../api-client";
import { useAdminSession } from "./session";

export function useAdminQuery<T>(path: string | null) {
  const { handleError } = useAdminSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);

  const reload = useCallback(async () => {
    if (!path) { setLoading(false); return; }
    const request = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const value = await adminApi().request<T>(path);
      if (sequence.current === request) setData(value);
    } catch (reason) {
      if (sequence.current === request) setError(handleError(reason));
    } finally {
      if (sequence.current === request) setLoading(false);
    }
  }, [handleError, path]);

  useEffect(() => { void Promise.resolve().then(reload); }, [reload]);
  return { data, loading, error, reload, setData };
}
