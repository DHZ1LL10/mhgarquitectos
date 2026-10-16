import type { Metadata } from "next";
import { propertyRepository } from "@/features/properties";
import PropertyList from "@/features/properties/components/PropertyList";
import styles from "@/features/properties/styles/properties.module.css";

export const metadata: Metadata = {
  title: "Propiedades en venta | MHG Arquitectos",
  description: "Conoce las propiedades disponibles de MHG Arquitectos en Fortín, Veracruz.",
  alternates: { canonical: "/propiedades" },
  openGraph: { title: "Propiedades en venta | MHG Arquitectos", description: "Propiedades disponibles en Fortín, Veracruz.", url: "/propiedades", type: "website", locale: "es_MX" },
};

export default async function PropertiesPage() {
  const properties = await propertyRepository.listPublished();
  return <main className={styles.page}>
    <p className={styles.eyebrow}>MHG Arquitectos</p>
    <h1 className={styles.title}>Propiedades</h1>
    <p className={styles.description}>Conoce espacios seleccionados para vivir e invertir en la región.</p>
    <PropertyList properties={properties} />
  </main>;
}
