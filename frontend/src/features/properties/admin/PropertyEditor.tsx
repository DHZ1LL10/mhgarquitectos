"use client";
import { useState, type FormEvent } from "react";
import type { Property, PropertyImage } from "../types";
import { validateDemoProperty } from "./demo-state";
import styles from "../styles/admin.module.css";

type Props = { property: Property; records: Property[]; images: PropertyImage[]; onSave: (property: Property) => void; onCancel: () => void };

export default function PropertyEditor({ property, records, images, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(() => structuredClone(property));
  const [errors, setErrors] = useState<string[]>([]);
  const change = <K extends keyof Property>(key: K, value: Property[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = { ...draft, title: draft.title.trim(), slug: draft.slug.trim(), description: draft.description.trim() };
    const issues = validateDemoProperty(clean, records); setErrors(issues);
    if (!issues.length) onSave(clean);
  };
  return <section className={styles.panel} aria-labelledby="editor-title">
    <h2 id="editor-title">{records.some(item => item.id === draft.id) ? "Editar propiedad de ejemplo" : "Nueva propiedad de ejemplo"}</h2>
    {errors.length > 0 && <ul className={styles.errors} role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.field}>Título<input value={draft.title} maxLength={160} onChange={e => change("title", e.target.value)} /></label>
      <label className={styles.field}>Slug<input value={draft.slug} maxLength={100} onChange={e => change("slug", e.target.value)} aria-describedby="slug-help" /></label>
      <p id="slug-help" className={styles.hint}>Minúsculas, números y guiones. Cambiarlo aquí no crea una nueva URL pública.</p>
      <label className={styles.field}>Descripción<textarea value={draft.description} maxLength={5000} onChange={e => change("description", e.target.value)} /></label>
      <div className={styles.row}>
        <label className={styles.field}>Operación<select value={draft.operation} onChange={e => change("operation", e.target.value as Property["operation"])}><option value="sale">Venta</option><option value="rent">Renta</option></select></label>
        <label className={styles.field}>Tipo<select value={draft.propertyType} onChange={e => change("propertyType", e.target.value as Property["propertyType"])}><option value="house">Casa</option><option value="apartment">Departamento</option><option value="land">Terreno</option></select></label>
      </div>
      <div className={styles.row}>
        <label className={styles.field}>Precio de ejemplo (MXN)<input type="number" min="0.01" step="0.01" value={draft.price} onChange={e => change("price", Number(e.target.value))} /></label>
        <label className={styles.field}>Estado simulado<select value={draft.status} onChange={e => change("status", e.target.value as Property["status"])}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
      </div>
      {([['city', 'Ciudad'], ['state', 'Estado'], ['neighborhood', 'Zona de ejemplo']] as const).map(([key, label]) => <label className={styles.field} key={key}>{label}<input value={draft.location[key]} maxLength={120} onChange={e => change("location", { ...draft.location, [key]: e.target.value })} /></label>)}
      <div className={styles.row}>{([['areaM2', 'Superficie (m²)'], ['bedrooms', 'Recámaras'], ['bathrooms', 'Baños'], ['parkingSpaces', 'Estacionamientos']] as const).map(([key, label]) => <label className={styles.field} key={key}>{label}<input type="number" min={key === "areaM2" ? "0.01" : "0"} step={key === "areaM2" ? "0.01" : "1"} value={draft.features[key]} onChange={e => change("features", { ...draft.features, [key]: Number(e.target.value) })} /></label>)}</div>
      <label className={styles.field}>Fotografía de ejemplo<select value={draft.images[0]?.src || ""} onChange={e => { const image = images.find(item => item.src === e.target.value); if (image) change("images", [structuredClone(image)]); }}>{images.map(image => <option key={image.src} value={image.src}>{image.alt}</option>)}</select></label>
      <p className={styles.hint}>Solo se pueden elegir fotografías locales de ejemplo. Cambiar la fotografía sustituye la galería de esta copia en memoria. No hay subida de archivos.</p>
      <div className={styles.actions}><button className={styles.button} type="submit">Guardar en memoria</button><button className={`${styles.button} ${styles.secondary}`} type="button" onClick={onCancel}>Cancelar</button></div>
    </form>
  </section>;
}
