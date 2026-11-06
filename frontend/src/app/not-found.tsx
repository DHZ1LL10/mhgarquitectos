import Link from "next/link";
import styles from "@/features/properties/styles/properties.module.css";

export default function NotFound() {
  return <main className={styles.page}>
    <p className={styles.eyebrow}>MHG Arquitectos · 404</p>
    <h1 className={styles.title}>Página no encontrada</h1>
    <p className={styles.description}>Esta dirección no existe o no corresponde a una propiedad publicada.</p>
    <p><Link className={styles.back} href="/propiedades">Ver propiedades</Link></p>
    <p><a className={styles.back} href="/">Volver al inicio</a></p>
  </main>;
}
