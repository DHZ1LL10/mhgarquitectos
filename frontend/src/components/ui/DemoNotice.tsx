import styles from "./demo-notice.module.css";

export default function DemoNotice({ admin = false }: { admin?: boolean }) {
  return <aside className={styles.notice} aria-label="Contenido de demostración">
    <strong>{admin ? "Modo demostración: los cambios se pierden al recargar." : "Catálogo de demostración"}</strong>
    <p>{admin ? "No hay autenticación ni guardado. Editar o publicar aquí solo modifica esta sesión de la pantalla; no cambia el catálogo público. Usa únicamente datos ficticios." : "Precios y características ficticios. Las fotografías ilustran proyectos del portafolio de MHG; no son ofertas inmobiliarias disponibles."}</p>
  </aside>;
}
