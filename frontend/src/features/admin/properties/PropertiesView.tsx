"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Property } from "../types";
import { currency, formatDateTime } from "../shared/format";
import { EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from "../shared/ui";
import { useAdminQuery } from "../shared/use-admin-query";
import Icon from "../shared/Icon";
import styles from "../admin.module.css";

const statusLabels = { draft: "Borrador", published: "Publicada", archived: "Archivada" } as const;

export default function PropertiesView() {
  const params = useSearchParams();
  const router = useRouter();
  const offset = Math.max(0, Number(params.get("offset") || 0) || 0);
  const status = params.get("estado") || "all";
  const query = useAdminQuery<Property[]>(`/admin/properties?limit=25&offset=${offset}${status !== "all" ? `&status=${status}` : ""}`);
  return <>
    <PageHeader eyebrow="Catálogo inmobiliario" title="Propiedades" description="El contenido guardado y publicado aquí alimenta el catálogo público desde la API." actions={<Link className={styles.primaryButton} href="/admin/propiedades/nueva"><Icon name="building" size={16}/>Nueva propiedad</Link>}/>
    <div className={styles.tableTools}><select className={styles.filterSelect} value={status} onChange={event => router.push(`/admin/propiedades${event.target.value === "all" ? "" : `?estado=${event.target.value}`}`)} aria-label="Filtrar estado"><option value="all">Todos los estados</option><option value="draft">Borradores</option><option value="published">Publicadas</option><option value="archived">Archivadas</option></select><button className={styles.secondaryButton} onClick={() => void query.reload()}>Actualizar</button></div>
    {query.loading && !query.data ? <LoadingState/> : query.error ? <ErrorState message={query.error} retry={query.reload}/> : query.data?.length ? <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Propiedad</th><th>Ubicación</th><th>Operación</th><th>Precio</th><th>Estado</th><th>Actualizada</th><th aria-label="Acciones"/></tr></thead><tbody>{query.data.map(item => <tr key={item.id}><td data-label="Propiedad" className={styles.primaryCell}><Link href={`/admin/propiedades/${item.id}`}>{item.title}</Link><small>/{item.slug}</small></td><td data-label="Ubicación">{item.location.neighborhood}, {item.location.city}</td><td data-label="Operación">{item.operation === "sale" ? "Venta" : "Renta"}</td><td data-label="Precio">{currency(item.price, item.currency)}</td><td data-label="Estado"><span className={`${styles.badge} ${styles[`property_${item.status}`]}`}>{statusLabels[item.status]}</span></td><td data-label="Actualizada">{formatDateTime(item.updated_at)}</td><td data-label="Acciones"><Link className={styles.textLink} href={`/admin/propiedades/${item.id}`}>Editar</Link></td></tr>)}</tbody></table></div> : <EmptyState title="Sin propiedades" description="Crea el primer registro del catálogo administrativo." action={<Link className={styles.primaryButton} href="/admin/propiedades/nueva">Nueva propiedad</Link>}/>}<Pagination offset={offset} count={query.data?.length || 0} href={next => `/admin/propiedades?offset=${next}${status !== "all" ? `&estado=${status}` : ""}`}/>
  </>;
}
