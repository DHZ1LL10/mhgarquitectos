"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "./api-client";
import { parseUser } from "./contracts";
import styles from "../properties/styles/admin.module.css";

export default function ChangePassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi().request("/auth/me").then(value => { const user = parseUser(value); if (!user.must_change_password) router.replace("/admin"); else setReady(true); }).catch(() => router.replace("/admin/login"));
  }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const current = String(form.get("current") || "");
    const next = String(form.get("next") || "");
    if (next !== String(form.get("confirmation") || "")) { setError("La confirmación no coincide."); return; }
    if (next.length < 12) { setError("La nueva contraseña debe tener al menos 12 caracteres."); return; }
    setBusy(true);
    try { parseUser(await adminApi().request("/auth/change-password", "POST", { current_password: current, new_password: next })); router.replace("/admin"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cambiar la contraseña."); }
    finally { setBusy(false); }
  }
  if (!ready) return <main className={styles.shell}><div className={styles.container}><h1 className={styles.heading}>Cambio de contraseña</h1><p>Validando sesión…</p></div></main>;
  return <main className={styles.shell}><div className={styles.container}><h1 className={styles.heading}>Crea tu nueva contraseña</h1><p className={styles.hint}>Antes de entrar al CRM, reemplaza la contraseña temporal.</p><section className={styles.panel}>{error && <p className={styles.errors} role="alert">{error}</p>}<form className={styles.form} onSubmit={submit}><label className={styles.field}>Contraseña actual<input type="password" name="current" autoComplete="current-password" required /></label><label className={styles.field}>Nueva contraseña<input type="password" name="next" autoComplete="new-password" minLength={12} maxLength={128} required /></label><label className={styles.field}>Confirmar nueva contraseña<input type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label><button className={styles.button} disabled={busy}>{busy ? "Guardando…" : "Cambiar contraseña"}</button></form></section></div></main>;
}
