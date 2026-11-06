import type { Property } from "../types";
import PropertyCard from "./PropertyCard";
import styles from "../styles/properties.module.css";

export default function PropertyList({ properties }: { properties: Property[] }) {
  if (!properties.length) return <p>No hay propiedades publicadas por el momento.</p>;
  return <div className={styles.grid}>{properties.map(property => <PropertyCard key={property.id} property={property} />)}</div>;
}
