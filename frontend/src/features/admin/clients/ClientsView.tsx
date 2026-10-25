"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { emailUrl, humanLabel, leadSourceLabels, leadWhatsAppUrl, phoneUrl } from "../contracts";
import type { Lead, LeadStatus } from "../types";
import { formatDateTime } from "../shared/format";
import { EmptyState, ErrorState, LeadBadge, LoadingState, PageHeader, Pagination } from "../shared/ui";
import { useAdminQuery } from "../shared/use-admin-query";
import Icon from "../shared/Icon";
import styles from "../admin.module.css";

export default function ClientsView() {
  const params = useSearchParams();
  const offset = Math.max(0, Number(params.get("offset") || 0) || 0);
  const initialStatus = params.get("estado") || "all";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const query = useAdminQuery<Lead[]>(`/admin/leads?limit=25&offset=${offset}`);
  const filtered = useMemo(() => (query.data || []).filter(item => {
    const needle = search.toLocaleLowerCase("es-MX");
    const matchesSearch = !needle || [item.name, item.email || "", item.phone, item.submission?.folio || ""].some(value => value.toLocaleLowerCase("es-MX").includes(needle));
    return matchesSearch && (status === "all" || item.status === status);
  }), [query.data, search, status]);
  const pageHref = (next: number) => `/admin/clientes?offset=${next}${status !== "all" ? `&estado=${status}` : ""}`;

  return <>
    <PageHeader eyebrow="Relaciones comerciales" title="Clientes" description="Solicitudes, datos de contacto y estado de seguimiento en un solo lugar." actions={<button className={styles.secondaryButton} onClick={() => void query.reload()}>Actualizar</button>} />
    <div className={styles.tableTools}><label className={styles.searchField}><Icon name="search" size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nombre, teléfono, correo o folio" aria-label="Buscar clientes" /></label><select className={styles.filterSelect} value={status} onChange={event => setStatus(event.target.value)} aria-label="Filtrar por estado"><option value="all">Todos los estados</option><option value="new">Nuevos</option><option value="contacted">Contactados</option><option value="qualified">En seguimiento</option><option value="closed">Cerrados</option></select></div>
    {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState message={query.error} retry={query.reload} /> : filtered.length ? <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Cliente</th><th>Contacto</th><th>Origen</th><th>Folio</th><th>Estado</th><th>Próxima cita</th><th>Recibido</th><th aria-label="Acciones" /></tr></thead><tbody>{filtered.map(item => { const whatsapp = leadWhatsAppUrl(item); const phone = phoneUrl(item.phone); const email = emailUrl(item.email); return <tr key={item.id}><td data-label="Cliente" className={styles.primaryCell}><Link href={`/admin/clientes/${item.id}`}>{item.name}</Link><small>{item.message || "Sin observaciones"}</small></td><td data-label="Contacto"><strong>{item.phone}</strong><br/><small className={styles.muted}>{item.email || "Sin correo"}</small></td><td data-label="Origen">{leadSourceLabels[item.source] || humanLabel(item.source)}</td><td data-label="Folio">{item.submission?.folio || "—"}</td><td data-label="Estado"><LeadBadge status={item.status as LeadStatus}/></td><td data-label="Próxima cita">{item.appointment && !["completed", "cancelled"].includes(item.appointment.status) ? formatDateTime(item.appointment.confirmed_datetime || item.appointment.requested_datetime) : "—"}</td><td data-label="Recibido">{formatDateTime(item.created_at)}</td><td data-label="Acciones"><div className={styles.rowActions}>{whatsapp && <a className={styles.iconButton} href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${item.name}`}><Icon name="message" size={16}/></a>}{phone && <a className={styles.iconButton} href={phone} aria-label={`Llamar a ${item.name}`}><Icon name="phone" size={16}/></a>}{email && <a className={styles.iconButton} href={email} aria-label={`Enviar correo a ${item.name}`}><Icon name="mail" size={16}/></a>}<Link className={styles.iconButton} href={`/admin/clientes/${item.id}`} aria-label={`Ver a ${item.name}`}><Icon name="arrow" size={16}/></Link></div></td></tr>; })}</tbody></table></div> : <EmptyState title="Sin resultados" description="No encontramos clientes con estos filtros." />}
    <Pagination offset={offset} count={query.data?.length || 0} href={pageHref}/>
  </>;
}
