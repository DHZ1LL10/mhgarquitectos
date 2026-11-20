import type { Metadata } from "next";
import { projectSummaries } from "@/features/projects/server";
export const dynamic = "force-dynamic";
import PortfolioProjects from "@/components/site/PortfolioProjects";
import styles from "@/components/site/portfolio.module.css";

export const metadata: Metadata = {
  title: "Proyectos | MHG Arquitectos",
  description: "Explora proyectos de cocina, mobiliario, diseño y construcción realizados por MHG Arquitectos.",
  alternates: { canonical: "/proyectos" },
  openGraph: {
    title: "Proyectos | MHG Arquitectos",
    description: "Catálogo de proyectos de cocina, mobiliario, diseño y construcción.",
    url: "/proyectos",
    type: "website",
    locale: "es_MX",
  },
};

export default async function ProjectsPage() {
  const projects = await projectSummaries(false);
  return (
    <main className={styles.catalogPage}>
      <header className={styles.catalogHeader}>
        <span className={styles.catalogEyebrow}>Trabajo realizado</span>
        <h1>Proyectos</h1>
        <p>Explora nuestro catálogo de cocinas, mobiliario, arquitectura e interiorismo.</p>
      </header>
      <section className={styles.catalogProjects} aria-label="Catálogo de proyectos">
        <PortfolioProjects variant="catalog" projects={projects} />
      </section>
    </main>
  );
}
