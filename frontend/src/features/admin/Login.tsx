"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "./api-client";
import { parseUser } from "./contracts";
import styles from "../properties/styles/admin.module.css";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => adminApi().request("/auth/me")).then(value => { parseUser(value); if (mounted) router.replace("/admin"); }).catch(error => { if (mounted && !(error instanceof ApiError && error.status === 401)) setError(error.message); });
    return () => { mounted = false; };
  }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try { parseUser(await adminApi().request("/auth/login", "POST", { email: data.get("email"), password: data.get("password") })); router.replace("/admin"); }
    catch (error) { setError(error instanceof Error ? error.message : "No se pudo iniciar sesión."); }
    finally { setBusy(false); }
  }
  return <main className={styles.shell}><div className={styles.container}><a href="/">Volver al sitio</a><h1 className={styles.heading}>Acceso administrativo</h1><section className={styles.panel}>
    {error && <p role="alert" className={styles.errors}>{error}</p>}
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>Email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
      <label className={styles.field}>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
      <button className={styles.button} disabled={busy}>{busy ? "Iniciando sesión…" : "Iniciar sesión"}</button>
    </form></section></div></main>;
}
