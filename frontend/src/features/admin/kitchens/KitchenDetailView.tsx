"use client";

import Link from "next/link";
import type { Kitchen } from "../types";
import { humanSelection, openStreetMapUrl } from "../contracts";
import { formatDateTime } from "../shared/format";
import { ErrorState, LoadingState, TechnicalInfo } from "../shared/ui";
import { useAdminQuery } from "../shared/use-admin-query";
import ContactActions from "../shared/ContactActions";
import Icon from "../shared/Icon";
import styles from "../admin.module.css";

export default function KitchenDetailView({ id }: { id: string }) {
  const query = useAdminQuery<Kitchen>(`/admin/kitchen-configurations/${id}`);
  if (query.loading && !query.data) return <LoadingState rows={8}/>;
  if (query.error || !query.data) return <ErrorState message={query.error || "Proyecto no encontrado."} retry={query.reload}/>;
  const item = query.data;
  const lead = item.leads[0];
  const appointment = item.appointments[0];
  const map = openStreetMapUrl(item.latitude, item.longitude);
  const hardware = item.hardware || {};
  const rows: [string, unknown][] = [
    ["Situación actual", item.current_situation], ["Tablero interior", item.interior_board], ["Frentes exteriores", item.exterior_fronts],
    ["Bisagras", hardware.bisagras], ["Correderas", hardware.correderas], ["Cajones", hardware.cajones], ["Basureros", hardware.basureros],
    ["Especiero", hardware.especiero], ["Módulos especiales", hardware.modulos_especiales], ["Cubierta", item.countertop], ["Acabado", item.finish], ["Extras", item.extras],
  ];
  return <>
    <Link className={styles.textLink} href="/admin/cocinas">← Volver a cocinas</Link>
    <header className={styles.detailHeader}><div><div className={styles.recordTitle}><h1>{item.submission?.folio || "Proyecto de cocina"}</h1><span className={styles.badge}>{item.branch}</span></div><div className={styles.recordMeta}><span>Recibido {formatDateTime(item.created_at)}</span><span>Versión {item.selection_version}</span></div></div><div className={styles.contactActions}>{lead && <ContactActions lead={lead}/>}<button className={styles.secondaryButton} onClick={() => window.print()}><Icon name="edit" size={16}/>Imprimir / guardar PDF</button></div></header>
    <p className={styles.notice}>La exportación usa la función de impresión del navegador para conservar esta ficha como PDF. El PDF visual del customizador no se duplica en administración.</p>
    <div className={styles.sectionGrid}><div>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Resumen de selección</h2><p>Decisiones del cliente traducidas a lenguaje operativo.</p></div></header><dl className={styles.summaryList}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{humanSelection(value)}</dd></div>)}</dl></section>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Visita y ubicación</h2><p>{formatDateTime(item.requested_datetime)}</p></div>{map && <a className={styles.secondaryButton} href={map} target="_blank" rel="noopener noreferrer"><Icon name="map" size={16}/>Abrir mapa</a>}</header><dl className={styles.infoGrid}><div className={styles.infoItem}><dt>Dirección</dt><dd>{item.address}</dd></div><div className={styles.infoItem}><dt>Asesor</dt><dd>{item.advisor || "Sin asignar"}</dd></div><div className={styles.infoItem}><dt>Notas</dt><dd>{item.notes || "Sin observaciones"}</dd></div></dl></section>
    </div><aside>
      {lead && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Cliente</h2><p>{lead.name}</p></div><Link className={styles.textLink} href={`/admin/clientes/${lead.id}`}>Abrir ficha</Link></header><p>{lead.phone}<br/>{lead.email || "Sin correo"}</p></section>}
      {appointment && <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Cita</h2><p>{formatDateTime(appointment.confirmed_datetime || appointment.requested_datetime)}</p></div><Link className={styles.textLink} href={`/admin/citas/${appointment.id}`}>Abrir cita</Link></header></section>}
      <section className={styles.panel}><TechnicalInfo values={[["ID de configuración", item.id], ["ID de envío", item.submission?.id], ["ID de cita", appointment?.id], ["Estado de notificación", item.submission?.notification_status]]}/></section>
    </aside></div>
  </>;
}
