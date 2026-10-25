"use client";

import Link from "next/link";
import type { Kitchen } from "../types";
import { humanLabel } from "../contracts";
import { formatDateTime } from "../shared/format";
import { AppointmentBadge, EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from "../shared/ui";
import { useAdminQuery } from "../shared/use-admin-query";
import { useSearchParams } from "next/navigation";
import styles from "../admin.module.css";

export default function KitchensView() {
  const params = useSearchParams();
  const offset = Math.max(0, Number(params.get("offset") || 0) || 0);
  const query = useAdminQuery<Kitchen[]>(`/admin/kitchen-configurations?limit=25&offset=${offset}`);
  return <>
    <PageHeader eyebrow="Proyectos solicitados" title="Cocinas" description="Configuraciones enviadas por clientes, listas para revisión y seguimiento." actions={<button className={styles.secondaryButton} onClick={() => void query.reload()}>Actualizar</button>}/>
    {query.loading && !query.data ? <LoadingState/> : query.error ? <ErrorState message={query.error} retry={query.reload}/> : query.data?.length ? <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Folio</th><th>Cliente</th><th>Situación</th><th>Sucursal</th><th>Cita</th><th>Estado</th><th>Recibido</th><th aria-label="Acciones"/></tr></thead><tbody>{query.data.map(item => { const appointment = item.appointments[0]; return <tr key={item.id}><td data-label="Folio" className={styles.primaryCell}><Link href={`/admin/cocinas/${item.id}`}>{item.submission?.folio || "Sin folio"}</Link><small>Versión {item.selection_version}</small></td><td data-label="Cliente">{item.leads[0]?.name || "Sin cliente asociado"}</td><td data-label="Situación">{humanLabel(item.current_situation)}</td><td data-label="Sucursal">{item.branch}</td><td data-label="Cita">{formatDateTime(appointment?.confirmed_datetime || item.requested_datetime)}</td><td data-label="Estado">{appointment ? <AppointmentBadge status={appointment.status}/> : "Sin cita"}</td><td data-label="Recibido">{formatDateTime(item.created_at)}</td><td data-label="Acciones"><Link className={styles.textLink} href={`/admin/cocinas/${item.id}`}>Ver proyecto</Link></td></tr>; })}</tbody></table></div> : <EmptyState title="Sin proyectos" description="Las configuraciones enviadas desde el customizador aparecerán aquí."/>}
    <Pagination offset={offset} count={query.data?.length || 0} href={next => `/admin/cocinas?offset=${next}`}/>
  </>;
}
