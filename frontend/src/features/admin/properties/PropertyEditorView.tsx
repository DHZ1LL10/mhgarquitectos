"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "../api-client";
import { emptyProperty } from "../contracts";
import type { Property, PropertyInput } from "../types";
import MediaEditor from "../shared/MediaEditor";
import PropertyForm from "../PropertyForm";
import { ErrorState, LoadingState, PageHeader } from "../shared/ui";
import { useAdminSession } from "../shared/session";
import { useAdminQuery } from "../shared/use-admin-query";
import styles from "../admin.module.css";
import { can } from "../permissions";

export default function PropertyEditorView({ id }: { id?: string }) {
  const router = useRouter();
  const { user, handleError } = useAdminSession();
  const query = useAdminQuery<Property>(id ? `/admin/properties/${id}` : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!can(user, "properties.manage")) return <ErrorState message="No tienes permiso para editar propiedades." retry={() => router.push("/admin/propiedades")}/>;
  if (id && query.loading && !query.data) return <LoadingState rows={8}/>;
  if (id && (query.error || !query.data)) return <ErrorState message={query.error || "Propiedad no encontrada."} retry={query.reload}/>;
  const initial: PropertyInput = query.data || emptyProperty();
  const save = async (value: PropertyInput) => {
    setSaving(true); setError("");
    try { const { images, ...fields } = value; const payload = id ? fields : { ...fields, images }; const saved = await adminApi().request<Property>(id ? `/properties/${id}` : "/properties", id ? "PATCH" : "POST", payload); router.push(`/admin/propiedades/${saved.id}`); router.refresh(); }
    catch (reason) { setError(handleError(reason)); }
    finally { setSaving(false); }
  };
  return <>
    <Link className={styles.textLink} href="/admin/propiedades">← Volver a propiedades</Link>
    <PageHeader eyebrow="Catálogo inmobiliario" title={id ? `Editar ${query.data?.title}` : "Nueva propiedad"} description="Organiza la información antes de publicarla en el catálogo."/>
    {error && <p className={styles.errorNotice} role="alert">{error}</p>}
    <PropertyForm key={id || "new"} initial={initial} gallery={query.data?.images} saving={saving} canPublish={can(user, "properties.publish")} onSave={save} onCancel={() => router.push("/admin/propiedades")}/>
    {id && query.data && <MediaEditor kind="properties" id={id} reload={query.reload} images={query.data.images.map((image, index) => ({ id: image.id!, url: image.url, alt: image.alt, cover: index === 0 }))}/>}
  </>;
}
