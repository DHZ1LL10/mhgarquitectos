import Link from "next/link";
import type { Property } from "../types";
import {
  formatCurrency,
  formatPrice,
  operationLabels,
  propertyWhatsAppUrl,
  typeLabels,
} from "../presentation";
import PropertyGallery from "./PropertyGallery";
import styles from "../styles/properties.module.css";

export default function PropertyDetail({ property }: { property: Property }) {
  const features = property.features;
  const facts: [string, string | number][] = [
    ["Tipo", typeLabels[property.propertyType]],
    ["Operación", operationLabels[property.operation]],
    ["Construcción", `${features.constructionAreaM2 ?? features.areaM2} m²`],
    ...(features.landAreaM2 ? [["Terreno", `${features.landAreaM2} m²`] as [string, string]] : []),
    ...(features.gardenAreaM2 ? [["Jardín privado", `${features.gardenAreaM2} m²`] as [string, string]] : []),
    ["Recámaras", features.bedrooms],
    ["Baños completos", features.bathrooms],
    ...(features.halfBathrooms ? [["Medio baño", features.halfBathrooms] as [string, number]] : []),
    ...(features.parkingSpaces != null ? [["Estacionamientos", features.parkingSpaces] as [string, number]] : []),
    ...(features.constructionProgress != null ? [["Avance aproximado", `${features.constructionProgress}%`] as [string, string]] : []),
  ];
  const whatsappUrl = propertyWhatsAppUrl(property);

  return <main className={styles.page}>
    <Link href="/propiedades" className={styles.back}>← Volver a propiedades</Link>
    <p className={styles.eyebrow}>{operationLabels[property.operation]} · {typeLabels[property.propertyType]}</p>
    <h1 className={styles.title}>{property.title}</h1>
    <p className={styles.location}>{property.location.neighborhood}, {property.location.city}, {property.location.state}</p>

    <div className={styles.detail}>
      <PropertyGallery key={property.slug} images={property.images} />
      <aside className={styles.summary} aria-label="Resumen comercial de la propiedad">
        {features.commercialLabel && <span className={styles.opportunity}>{features.commercialLabel}</span>}
        <p className={styles.detailPrice}>{formatPrice(property)}</p>
        {features.listPrice != null && <div className={styles.commercialTerms}>
          <div><span>Precio de lista</span><strong>{formatCurrency(features.listPrice)} MXN</strong></div>
          {features.bonus != null && <div><span>Bono especial</span><strong>{formatCurrency(features.bonus)} MXN</strong></div>}
          <div className={styles.currentPrice}><span>Precio de oportunidad</span><strong>{formatPrice(property)}</strong></div>
        </div>}
        <dl className={styles.facts}>{facts.map(([label, value]) => <div className={styles.fact} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {features.constructionStatus && <p className={styles.progressNote}>{features.constructionStatus}{features.constructionProgress != null ? `, con aproximadamente ${features.constructionProgress}% de avance.` : "."}</p>}
        <div className={styles.ctas}>
          <a href="/#contacto" className={styles.secondaryCta}>Solicitar información</a>
          <a href={whatsappUrl} className={styles.primaryCta} target="_blank" rel="noopener noreferrer">Agendar visita por WhatsApp</a>
        </div>
      </aside>
    </div>

    <section className={styles.contentSection}>
      <p className={styles.eyebrow}>La residencia</p>
      <h2 className={styles.subheading}>Espacios para vivir hacia el exterior</h2>
      <p className={styles.description}>{property.description}</p>
    </section>

    <div className={styles.infoColumns}>
      {features.distribution?.length ? <section className={styles.infoPanel}>
        <h2 className={styles.subheading}>Distribución</h2>
        <ul className={styles.featureList}>{features.distribution.map(item => <li key={item}>{item}</li>)}</ul>
      </section> : null}
      {features.amenities?.length ? <section className={styles.infoPanel}>
        <h2 className={styles.subheading}>Acabados y detalles</h2>
        <ul className={styles.featureList}>{features.amenities.map(item => <li key={item}>{item}</li>)}</ul>
      </section> : null}
    </div>
  </main>;
}
