import Link from "next/link";
import type { AppointmentStatus, LeadStatus } from "../types";
import { appointmentLabels, leadStatusLabels } from "../contracts";
import styles from "../admin.module.css";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className={styles.pageHeader}><div>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className={styles.headerActions}>{actions}</div>}</header>;
}

export function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`${styles.badge} ${styles[`appointment_${status}`]}`}>{appointmentLabels[status]}</span>;
}

export function LeadBadge({ status }: { status: LeadStatus }) {
  return <span className={`${styles.badge} ${styles[`lead_${status}`]}`}>{leadStatusLabels[status]}</span>;
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return <div className={styles.skeleton} aria-live="polite" aria-label="Cargando datos">{Array.from({ length: rows }, (_, index) => <span key={index} />)}</div>;
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className={styles.errorState} role="alert"><strong>No pudimos cargar esta vista</strong><p>{message}</p><button className={styles.secondaryButton} onClick={retry}>Reintentar</button></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className={styles.emptyState}><strong>{title}</strong><p>{description}</p>{action}</div>;
}

export function TechnicalInfo({ values }: { values: [string, string | null | undefined][] }) {
  return <details className={styles.technical}><summary>Información técnica</summary><dl>{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "No asociado"}</dd></div>)}</dl></details>;
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className={styles.textLink} href={href}>{children}</Link>;
}

export function Pagination({ offset, count, href }: { offset: number; count: number; href: (offset: number) => string }) {
  return <nav className={styles.pagination} aria-label="Paginación"><Link aria-disabled={offset === 0} className={offset === 0 ? styles.disabledLink : styles.secondaryButton} href={href(Math.max(0, offset - 25))}>Anterior</Link><span>Página {offset / 25 + 1}</span><Link aria-disabled={count < 25} className={count < 25 ? styles.disabledLink : styles.secondaryButton} href={href(offset + 25)}>Siguiente</Link></nav>;
}
