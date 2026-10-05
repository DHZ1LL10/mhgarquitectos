import Link from "next/link";
import DemoNotice from "@/components/ui/DemoNotice";
import type { Property } from "../types";
import { formatPrice, operationLabels, typeLabels } from "../presentation";
import PropertyGallery from "./PropertyGallery";
import styles from "../styles/properties.module.css";

export default function PropertyDetail({ property }: { property: Property }) {
  const facts = [
    ["Tipo", typeLabels[property.propertyType]], ["Operación", operationLabels[property.operation]],
    ["Superficie", `${property.features.areaM2} m²`], ["Recámaras", property.features.bedrooms],
    ["Baños", property.features.bathrooms], ["Estacionamientos", property.features.parkingSpaces],
  ];
  return <main className={styles.page}>
    <Link href="/propiedades" className={styles.back}>← Volver a propiedades</Link>
    <h1 className={styles.title}>{property.title}</h1>
    <p className={styles.description}>{property.location.neighborhood} · {property.location.city}, {property.location.state}</p>
    <DemoNotice />
    <div className={styles.detail}>
      <PropertyGallery key={property.slug} images={property.images} />
      <section aria-label="Características de ejemplo">
        <span className={styles.badge}>{operationLabels[property.operation]}</span>
        <p className={styles.price}>{formatPrice(property)}</p>
        <dl className={styles.facts}>{facts.map(([label, value]) => <div className={styles.fact} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className={styles.meta}>Información ficticia para validación. No se reciben solicitudes sobre estas propiedades de ejemplo.</p>
        <a href="/#contacto" className={styles.back}>Conocer los servicios de MHG</a>
      </section>
    </div>
    <h2 className={styles.subheading}>Descripción</h2>
    <p className={styles.description}>{property.description}</p>
  </main>;
}
