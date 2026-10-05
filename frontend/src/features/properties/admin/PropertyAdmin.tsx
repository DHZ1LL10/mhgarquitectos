"use client";
import { useState } from "react";
import DemoNotice from "@/components/ui/DemoNotice";
import type { Property } from "../types";
import { formatPrice, statusLabels } from "../presentation";
import { saveDemoProperty } from "./demo-state";
import PropertyEditor from "./PropertyEditor";
import styles from "../styles/admin.module.css";

export default function PropertyAdmin({ initialProperties }: { initialProperties: Property[] }) {
  const [records, setRecords] = useState(() => structuredClone(initialProperties));
  const [editing, setEditing] = useState<Property | null>(null);
  const [message, setMessage] = useState("");
  const images = initialProperties.flatMap(property => property.images).filter((image, index, all) => all.findIndex(item => item.src === image.src) === index);
  const create = () => {
    setMessage("");
    setEditing({ id: `demo-${crypto.randomUUID()}`, slug: "", status: "draft", title: "", description: "", operation: "sale", propertyType: "house", price: 0, currency: "MXN", location: { city: "", state: "", neighborhood: "" }, features: { areaM2: 0, bedrooms: 0, bathrooms: 0, parkingSpaces: 0 }, images: structuredClone(images.slice(0, 1)) });
  };
  const save = (property: Property) => {
    setRecords(previous => saveDemoProperty(previous, property)); setEditing(null);
    setMessage(`“${property.title}” guardada en memoria como ${statusLabels[property.status].toLowerCase()}. El catálogo público no cambió.`);
  };
  return <main className={styles.shell}><div className={styles.container}>
    <nav className={styles.navigation} aria-label="Navegación de demostración"><a href="/">Volver al sitio</a><a href="/propiedades">Ver catálogo público de ejemplo</a></nav>
    <h1 className={styles.heading}>Administración de propiedades</h1>
    <DemoNotice admin />
    <div className={styles.toolbar}><p>{records.length} registros de ejemplo · {records.filter(item => item.status === "published").length} publicados en esta pantalla</p><button className={styles.button} type="button" onClick={create}>Crear propiedad de ejemplo</button></div>
    {message && <p className={styles.message} role="status">{message}</p>}
    <div className={styles.layout}>
      <div className={styles.list}>{records.map(property => <article className={styles.record} key={property.id}>
        <h2>{property.title}</h2><span className={styles.badge}>{statusLabels[property.status]}</span>
        <p>{formatPrice(property)}</p><p className={styles.hint}>{property.slug}</p>
        <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={() => { setMessage(""); setEditing(structuredClone(property)); }}>Editar {property.title}</button>
      </article>)}</div>
      {editing ? <PropertyEditor key={editing.id} property={editing} records={records} images={images} onSave={save} onCancel={() => setEditing(null)} /> : <div className={styles.panel}><h2>Explorar la edición</h2><p>Selecciona un registro o crea uno nuevo. Los estados y cambios son una simulación local sin conexión con un servidor.</p></div>}
    </div>
  </div></main>;
}
