"use client";

import { useState } from "react";
import { adminApi } from "../api-client";
import { previewImage } from "@/features/projects/media";
import { useAdminSession } from "./session";
import styles from "../admin.module.css";

export type EditableImage = { id: string; url: string; alt: string; cover: boolean };
export default function MediaEditor({ kind, id, images, reload }: {
  kind: "projects" | "properties"; id: string; images: EditableImage[]; reload: () => Promise<void>;
}) {
  const { handleError } = useAdminSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ name: string; status: string }[]>([]);
  const base = `/admin/media/${kind}/${id}`;
  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true); setError("");
    const queue = Array.from(files);
    setProgress(queue.map(file => ({ name: file.name, status: "Pendiente" })));
    const report = (index: number, status: string) => setProgress(previous => previous.map((row, i) => i === index ? { ...row, status } : row));
    let completed = 0;
    try {
      // Sequential requests keep memory bounded and respect the dedicated upload budget.
      for (const [index, file] of queue.entries()) {
        try {
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error("Usa JPG, PNG o WebP de hasta 8 MB por fotografía.");
          report(index, "Subiendo…");
          setMessage(`Subiendo ${index + 1} de ${queue.length}…`);
          const data = new FormData(); data.append("file", file);
          await adminApi().request(`${base}/upload`, "POST", data);
          completed++; report(index, "Guardada");
        } catch (reason) {
          report(index, "No guardada: vuelve a seleccionar este archivo para reintentar.");
          throw reason; // Stop on rate limit, lost session or uncertain network result; never auto-retry writes.
        }
      }
    } catch (reason) { setError(reason instanceof Error && !("status" in reason) ? reason.message : handleError(reason)); }
    finally { setMessage(`${completed} fotografías añadidas. Las anteriores se conservaron.`); await reload(); setBusy(false); }
  }
  async function action(image: EditableImage, operation: "cover" | "remove") {
    if (operation === "remove" && !window.confirm("¿Quitar esta fotografía de la galería?")) return;
    setBusy(true); setError("");
    try { await adminApi().request(`${base}/images/${image.id}/${operation}`, "POST"); await reload(); }
    catch (reason) { setError(handleError(reason)); }
    finally { setBusy(false); }
  }
  return <section className={styles.formSection} aria-label="Galería">
    <h2>Fotografías</h2><p>Selecciona varias fotografías. JPG, PNG o WebP, hasta 8 MB cada una. Los cambios de galería se guardan inmediatamente.</p>
    <label className={styles.field}>Añadir fotografías<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { void upload(event.target.files); event.target.value = ""; }}/></label>
    <p role="status">{message}</p>{error && <p role="alert" className={styles.errorNotice}>{error}</p>}
    {progress.length > 0 && <ul aria-label="Progreso por fotografía">{progress.map((row, index) => <li key={`${index}:${row.name}`}>{row.name}: {row.status}</li>)}</ul>}
    <div className={styles.imageEditor}>{images.map(image => <article className={styles.imageCard} key={image.id}>
      <div className={styles.imagePreview}><img src={previewImage(image.url)} alt={image.alt} loading="lazy"/>{image.cover && <strong>Portada</strong>}</div>
      <div className={styles.imageActions}><button type="button" className={styles.secondaryButton} disabled={busy || image.cover} onClick={() => void action(image, "cover")}>Usar como portada</button><button type="button" className={styles.dangerButton} disabled={busy} onClick={() => void action(image, "remove")}>Quitar</button></div>
    </article>)}</div>
  </section>;
}
