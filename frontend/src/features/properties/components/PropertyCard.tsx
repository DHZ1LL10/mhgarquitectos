import Link from "next/link";
import type { Property } from "../types";
import { formatPrice, operationLabels, typeLabels } from "../presentation";
import styles from "../styles/properties.module.css";

export default function PropertyCard({ property }: { property: Property }) {
  const photo = property.images[0];
  const features = property.features;
  const metrics = [
    features.constructionAreaM2 ? `${features.constructionAreaM2} m² construcción` : `${features.areaM2} m²`,
    features.landAreaM2 ? `${features.landAreaM2} m² terreno` : null,
    `${features.bedrooms} recámaras`,
  ].filter(Boolean);
  return <article className={styles.card}>
    <Link className={styles.cardLink} href={`/propiedades/${property.slug}`}>
      {photo && <img className={styles.cardImage} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />}
      <div className={styles.cardBody}>
        <span className={styles.badge}>{operationLabels[property.operation]} · {typeLabels[property.propertyType]}</span>
        <h2 className={styles.cardTitle}>{property.title}</h2>
        <p className={styles.meta}>{property.location.neighborhood}, {property.location.city}, {property.location.state}</p>
        <p className={styles.meta}>{metrics.join(" · ")}</p>
        {features.commercialLabel && <p className={styles.opportunity}>{features.commercialLabel}</p>}
        <p className={styles.price}>{formatPrice(property)}</p>
      </div>
    </Link>
  </article>;
}
