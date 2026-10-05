import type { Metadata } from "next";
import DemoNotice from "@/components/ui/DemoNotice";
import { propertyRepository } from "@/features/properties";
import PropertyList from "@/features/properties/components/PropertyList";
import styles from "@/features/properties/styles/properties.module.css";

export const metadata: Metadata = {
  title: "Propiedades — Catálogo de demostración | MHG Arquitectos",
  description: "Explora el catálogo de demostración de MHG Arquitectos. Propiedades y precios ficticios para validar la nueva experiencia.",
  alternates: { canonical: "/propiedades" },
  openGraph: { title: "Propiedades | MHG Arquitectos", description: "Catálogo de demostración con datos ficticios.", url: "/propiedades", type: "website", locale: "es_MX" },
};

export default async function PropertiesPage() {
  const properties = await propertyRepository.listPublished();
  return <main className={styles.page}>
    <p className={styles.eyebrow}>MHG Arquitectos</p>
    <h1 className={styles.title}>Propiedades</h1>
    <p className={styles.description}>Conoce la nueva experiencia para explorar espacios.</p>
    <DemoNotice />
    <PropertyList properties={properties} />
  </main>;
}
