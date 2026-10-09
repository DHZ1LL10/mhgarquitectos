"use client";
import { useState, type FormEvent } from "react";
import type { Appointment, AppointmentStatus } from "./types";
import { appointmentLabels, confirmedDateTime, localDateTime, transitions } from "./contracts";
import styles from "../properties/styles/admin.module.css";
export default function AppointmentForm({ item, saving, onSave }: { item: Appointment; saving: boolean; onSave: (id: string, value: unknown) => Promise<void> }) {
  const [status, setStatus] = useState(item.status);
  const [confirmed, setConfirmed] = useState(localDateTime(item.confirmed_datetime));
  const [notes, setNotes] = useState(item.notes || "");
  async function submit(event: FormEvent) { event.preventDefault(); await onSave(item.id, { status, confirmed_datetime: confirmedDateTime(confirmed), notes: notes || null }); }
  return <form className={styles.form} onSubmit={submit}><fieldset disabled={saving} className={styles.form}>
    <label className={styles.field}>Estado<select value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)}>{[item.status, ...transitions[item.status]].map(value => <option key={value} value={value}>{appointmentLabels[value]}</option>)}</select></label>
    <label className={styles.field}>Fecha confirmada (hora local)<input type="datetime-local" required={status === "confirmed" || status === "completed"} value={confirmed} onChange={e => setConfirmed(e.target.value)} /></label>
    <label className={styles.field}>Notas<textarea maxLength={10000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
    <button className={styles.button}>{saving ? "Guardando…" : "Guardar cita"}</button>
  </fieldset></form>;
}
