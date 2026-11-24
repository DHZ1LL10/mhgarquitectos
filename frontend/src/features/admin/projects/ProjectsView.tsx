"use client";
import Link from "next/link";
import { useState } from "react";
import { categories, type ProjectSummary } from "@/features/projects/types";
import { useAdminQuery } from "../shared/use-admin-query";
import { ErrorState, LoadingState, PageHeader } from "../shared/ui";
import styles from "../admin.module.css";
import { formatDateTime } from "../shared/format";

export default function ProjectsView() {
  const query = useAdminQuery<ProjectSummary[]>("/admin/projects");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  if (!query.data && query.loading) return <LoadingState/>;
  if (query.error) return <ErrorState message={query.error} retry={query.reload}/>;
  const projects = (query.data || []).filter(project => (!category || project.category === category) && project.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <><PageHeader eyebrow="Portfolio" title="Proyectos" description="Administra los trabajos reales y elige qué mostrar en portada."/>
    <Link href="/admin/proyectos/nuevo" className={styles.primaryButton}>Nuevo proyecto</Link>
    <div className={styles.fieldGrid}><label className={styles.field}>Buscar<input value={search} onChange={e => setSearch(e.target.value)}/></label><label className={styles.field}>Categoría<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label></div>
    <div className={styles.imageEditor}>{projects.map(project => <article key={project.id} className={styles.imageCard}>
      <div className={styles.imagePreview}>{project.cover_image && <img src={project.cover_image.secure_url} alt={project.cover_image.alt_text} loading="lazy"/>}</div>
      <div className={styles.imageFields}><h2>{project.name}</h2><p>{categories.find(c => c.slug === project.category)?.label} · {project.image_count} fotos</p><p>{project.status === "published" ? "Publicado" : "Borrador"}{project.featured ? ` · Portada ${project.featured_order}` : ""}</p>{project.updated_at && <p>Actualizado: {formatDateTime(project.updated_at)}</p>}<Link href={`/admin/proyectos/${project.id}`} className={styles.secondaryButton}>Editar proyecto</Link></div>
    </article>)}</div>{!projects.length && <p>No hay proyectos con estos filtros.</p>}</>;
}
