"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { categories, type ProjectDetail } from "@/features/projects/types";
import { adminApi } from "../api-client";
import { useAdminQuery } from "../shared/use-admin-query";
import { useAdminSession } from "../shared/session";
import { ErrorState, LoadingState, PageHeader } from "../shared/ui";
import MediaEditor from "../shared/MediaEditor";
import styles from "../admin.module.css";

export default function ProjectEditor({ id }: { id?: string }) {
  const query = useAdminQuery<ProjectDetail>(id ? `/admin/projects/${id}` : null);
  if (id && !query.data && query.loading) return <LoadingState/>;
  if (query.error) return <ErrorState message={query.error} retry={query.reload}/>;
  return <><EditorForm key={id || "new"} initial={query.data} id={id}/>{id && query.data && <MediaEditor kind="projects" id={id} reload={query.reload} images={query.data.images.map(image => ({ id: image.id, url: image.secure_url, alt: image.alt_text, cover: image.is_cover }))}/>}</>;
}
function EditorForm({ initial, id }: { initial: ProjectDetail | null; id?: string }) {
  const router = useRouter(); const { handleError } = useAdminSession();
  const [draft, setDraft] = useState({ name: initial?.name || "", category: initial?.category || "kitchen_furniture", short_description: initial?.short_description || "", description: initial?.description || "", status: initial?.status || "draft", featured: initial?.featured || false, featured_order: initial?.featured_order || 1 });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const value = await adminApi().request<ProjectDetail>(id ? `/admin/projects/${id}` : "/admin/projects", id ? "PATCH" : "POST", { ...draft, featured_order: draft.featured ? draft.featured_order : null });
      router.push(`/admin/proyectos/${value.id}`); router.refresh();
    } catch (reason) { setError(handleError(reason)); } finally { setBusy(false); }
  }
  return <><Link href="/admin/proyectos">← Volver a proyectos</Link><PageHeader eyebrow="Portfolio" title={id ? "Editar proyecto" : "Nuevo proyecto"} description="Guarda primero los datos y añade las fotografías en la galería."/>
    <form onSubmit={save}><fieldset disabled={busy} className={styles.form}><section className={styles.formSection}><h2>Información</h2>
      <label className={styles.field}>Nombre<input required maxLength={200} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label>
      <label className={styles.field}>Categoría<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as ProjectDetail["category"] })}>{categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
      <label className={styles.field}>Descripción breve<textarea required maxLength={500} value={draft.short_description} onChange={e => setDraft({ ...draft, short_description: e.target.value })}/></label>
      <label className={styles.field}>Descripción completa<textarea maxLength={20000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label>
    </section><section className={styles.formSection}><h2>Publicación</h2><label className={styles.field}>Estado<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as ProjectDetail["status"] })}><option value="draft">Borrador (oculto)</option><option value="published">Publicado</option></select></label>
      <label><input type="checkbox" checked={draft.featured} onChange={e => setDraft({ ...draft, featured: e.target.checked })}/> Mostrar en página principal</label>
      {draft.featured && <label className={styles.field}>Orden dentro de la categoría<input type="number" min={1} max={9} required value={draft.featured_order} onChange={e => setDraft({ ...draft, featured_order: Number(e.target.value) })}/><small>Hasta nueve proyectos por categoría. Desmarca el proyecto que ocupa esta posición antes de reasignarla.</small></label>}
    </section>{error && <p role="alert" className={styles.errorNotice}>{error}</p>}<button className={styles.primaryButton}>{busy ? "Guardando…" : draft.status === "draft" ? "Guardar borrador" : initial?.status === "published" ? "Guardar cambios" : "Publicar"}</button></fieldset></form></>;
}
