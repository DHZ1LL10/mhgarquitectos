import styles from "./demo-notice.module.css";

export default function DemoNotice() {
  return <aside className={styles.notice} aria-label="Contenido de demostración">
    <strong>Catálogo de demostración</strong>
    <p>Precios y características ficticios. Las fotografías ilustran proyectos del portafolio de MHG; no son ofertas inmobiliarias disponibles.</p>
  </aside>;
}
