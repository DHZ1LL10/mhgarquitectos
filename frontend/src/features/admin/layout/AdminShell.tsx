"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../shared/Icon";
import { AdminSessionProvider, useAdminSession } from "../shared/session";
import styles from "../admin.module.css";
import { can } from "../permissions";
import type { Permission } from "../types";

const navigation = [
  { href: "/admin", label: "Inicio", icon: "home" as const, permission: "dashboard.view" as Permission },
  { href: "/admin/clientes", label: "Clientes", icon: "clients" as const, permission: "clients.view" as Permission },
  { href: "/admin/citas", label: "Citas", icon: "calendar" as const, permission: "appointments.view" as Permission },
  { href: "/admin/cocinas", label: "Cocinas", icon: "kitchen" as const, permission: "kitchens.view" as Permission },
  { href: "/admin/propiedades", label: "Propiedades", icon: "building" as const, permission: "properties.view" as Permission },
  { href: "/admin/usuarios", label: "Usuarios", icon: "users" as const, ownerOnly: true },
];

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, handleError } = useAdminSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const links = navigation.filter(item => item.ownerOnly ? user.role === "owner" : item.permission ? can(user, item.permission) : true);
  const route = navigation.slice().sort((a, b) => b.href.length - a.href.length).find(item => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href));
  const allowed = !route || (route.ownerOnly ? user.role === "owner" : route.permission ? can(user, route.permission) : true);
  async function closeSession() {
    setBusy(true); setError("");
    try { await logout(); } catch (reason) { setError(handleError(reason)); setBusy(false); }
  }
  return <div className={styles.adminApp}>
    <button className={styles.mobileMenu} aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen(value => !value)}><Icon name="menu"/><span>Menú</span></button>
    {open && <button className={styles.backdrop} aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
    <aside id="admin-sidebar" className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link className={styles.brand} href="/admin" onClick={() => setOpen(false)}><span className={styles.brandMark}>MHG</span><span><strong>MHG Arquitectos</strong><small>Centro de operaciones</small></span></Link>
      <nav className={styles.sidebarNav} aria-label="Navegación administrativa">{links.map(item => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? styles.activeNav : ""} onClick={() => setOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></Link>;
      })}</nav>
      <div className={styles.sidebarFooter}><div className={styles.userCard}><span>{user.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{user.full_name}</strong><small>{user.role === "owner" ? "Propietario" : "Personal"}</small></div></div><Link href="/">Volver al sitio</Link><button disabled={busy} onClick={closeSession}><Icon name="logout" size={18}/>{busy ? "Cerrando…" : "Cerrar sesión"}</button>{error && <p role="alert">{error}</p>}</div>
    </aside>
    <main className={styles.mainContent}>{allowed ? children : <section className={styles.boot} role="alert"><h1>No tienes permiso para acceder a esta sección.</h1><Link href="/admin">Volver al inicio</Link></section>}</main>
  </div>;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return <AdminSessionProvider><Shell>{children}</Shell></AdminSessionProvider>;
}
