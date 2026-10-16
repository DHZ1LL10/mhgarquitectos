"use client";
import { useState, type FormEvent } from "react";
import type { PropertyInput } from "./types";
import { propertyInput } from "./contracts";
import styles from "../properties/styles/admin.module.css";

export default function PropertyForm({ initial, saving, onSave, onCancel }: { initial: PropertyInput; saving: boolean; onSave: (value: PropertyInput) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => propertyInput(initial));
  const change = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  async function submit(event: FormEvent) { event.preventDefault(); await onSave(propertyInput(draft)); }
  return <section className={styles.panel}><h2>Datos de la propiedad</h2><form className={styles.form} onSubmit={submit}><fieldset disabled={saving} className={styles.form}>
    <label className={styles.field}>Título<input required maxLength={200} value={draft.title} onChange={e => change("title", e.target.value)} /></label>
    <label className={styles.field}>Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} value={draft.slug} onChange={e => change("slug", e.target.value)} /></label>
    <label className={styles.field}>Descripción<textarea required maxLength={20000} value={draft.description} onChange={e => change("description", e.target.value)} /></label>
    <div className={styles.row}>
      <label className={styles.field}>Operación<select value={draft.operation} onChange={e => change("operation", e.target.value as PropertyInput["operation"])}><option value="sale">Venta</option><option value="rent">Renta</option></select></label>
      <label className={styles.field}>Tipo<select value={draft.property_type} onChange={e => change("property_type", e.target.value as PropertyInput["property_type"])}><option value="house">Casa</option><option value="apartment">Departamento</option><option value="land">Terreno</option></select></label>
      <label className={styles.field}>Precio<input type="number" required min="0" max="999999999999.99" step="0.01" value={draft.price} onChange={e => change("price", e.target.value)} /></label>
      <label className={styles.field}>Moneda<input required pattern="[A-Z]{3}" maxLength={3} value={draft.currency} onChange={e => change("currency", e.target.value.toUpperCase())} /></label>
      <label className={styles.field}>Estado<select value={draft.status} onChange={e => change("status", e.target.value as PropertyInput["status"])}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
    </div>
    {([["city", "Ciudad"], ["state", "Estado"], ["neighborhood", "Colonia / zona"]] as const).map(([key, label]) => <label key={key} className={styles.field}>{label}<input required maxLength={120} value={draft.location[key]} onChange={e => change("location", { ...draft.location, [key]: e.target.value })} /></label>)}
    <div className={styles.row}>{([["area_m2", "Superficie (m²)"], ["bedrooms", "Recámaras"], ["bathrooms", "Baños"]] as const).map(([key, label]) => <label key={key} className={styles.field}>{label}<input required type="number" min="0" max={key === "area_m2" ? undefined : 100} step={key === "area_m2" ? "any" : "1"} value={draft.features[key]} onChange={e => change("features", { ...draft.features, [key]: Number(e.target.value) })} /></label>)}<label className={styles.field}>Estacionamientos (opcional)<input type="number" min="0" max="100" step="1" value={draft.features.parking_spaces ?? ""} onChange={e => change("features", { ...draft.features, parking_spaces: e.target.value === "" ? null : Number(e.target.value) })} /></label></div>
    <div className={styles.row}>{(["latitude", "longitude"] as const).map(key => <label key={key} className={styles.field}>{key === "latitude" ? "Latitud" : "Longitud"}<input type="number" step="any" min={key === "latitude" ? -90 : -180} max={key === "latitude" ? 90 : 180} value={draft[key] ?? ""} onChange={e => change(key, e.target.value === "" ? null : Number(e.target.value))} /></label>)}</div>
    <h3>Imágenes</h3><p className={styles.hint}>Usa una ruta del sitio (/img/…) o una URL HTTPS. Se guardan referencias; no se suben archivos. El orden de esta lista es el de la galería.</p>
    {draft.images.map((image, index) => <fieldset key={index} className={styles.form}><legend>Imagen {index + 1}</legend>
      {(["url", "alt"] as const).map(key => <label className={styles.field} key={key}>{key === "url" ? "Ruta o URL" : "Texto alternativo"}<input required maxLength={key === "url" ? 2048 : 250} value={image[key]} onChange={e => change("images", draft.images.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))} /></label>)}
      <div className={styles.row}>{(["width", "height"] as const).map(key => <label className={styles.field} key={key}>{key === "width" ? "Ancho (px)" : "Alto (px)"}<input type="number" required min="1" max="30000" value={image[key]} onChange={e => change("images", draft.images.map((item, i) => i === index ? { ...item, [key]: Number(e.target.value) } : item))} /></label>)}</div>
      <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={() => change("images", draft.images.filter((_, i) => i !== index))}>Quitar referencia de imagen</button>
    </fieldset>)}
    <button type="button" disabled={draft.images.length >= 50} className={`${styles.button} ${styles.secondary}`} onClick={() => change("images", [...draft.images, { url: "", alt: "", width: 1200, height: 800, object_key: null }])}>Agregar referencia de imagen</button>
    <p className={styles.hint}>Guardar persiste en la API. La publicación en el catálogo público requiere su integración y política de actualización posteriores.</p>
    <div className={styles.actions}><button className={styles.button}>{saving ? "Guardando…" : "Guardar propiedad"}</button><button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onCancel}>Cancelar</button></div>
  </fieldset></form></section>;
}
