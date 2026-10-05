import Link from "next/link";
import type { Property } from "../types";
import { formatPrice, operationLabels, typeLabels } from "../presentation";
import styles from "../styles/properties.module.css";

export default function PropertyCard({ property }: { property: Property }) {
  const photo = property.images[0];
  return <article className={styles.card}>
    <Link className={styles.cardLink} href={`/propiedades/${property.slug}`}>
      {photo && <img className={styles.cardImage} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />}
      <div className={styles.cardBody}>
        <span className={styles.badge}>{operationLabels[property.operation]} · {typeLabels[property.propertyType]}</span>
        <h2 className={styles.cardTitle}>{property.title}</h2>
        <p className={styles.meta}>{property.location.city}, {property.location.state}</p>
        <p className={styles.meta}>{property.features.areaM2} m² · {property.features.bedrooms} recámaras · {property.features.bathrooms} baños</p>
        <p className={styles.price}>{formatPrice(property)}</p>
      </div>
    </Link>
  </article>;
}
