"use client";
import { useState } from "react";
import type { PropertyImage } from "../types";
import styles from "../styles/properties.module.css";

export default function PropertyGallery({ images }: { images: PropertyImage[] }) {
  const [active, setActive] = useState(0);
  const image = images[active] || images[0];
  if (!image) return <p>Sin fotografías.</p>;
  return <div className={styles.gallery}>
    <img className={styles.hero} src={image.src} alt={image.alt} width={image.width} height={image.height} />
    {images.length > 1 && <>
      <div className={styles.galleryControls}>
        <button type="button" onClick={() => setActive(index => (index - 1 + images.length) % images.length)} aria-label="Fotografía anterior">←</button>
        <p aria-live="polite">Fotografía {active + 1} de {images.length}</p>
        <button type="button" onClick={() => setActive(index => (index + 1) % images.length)} aria-label="Fotografía siguiente">→</button>
      </div>
      <div className={styles.thumbnails} aria-label="Fotografías de la propiedad">
        {images.map((photo, index) => <button type="button" className={styles.thumbnail} key={photo.src} aria-label={`Ver fotografía ${index + 1} de ${images.length}`} aria-pressed={index === active} onClick={() => setActive(index)}>
          <img src={photo.src} alt="" width={photo.width} height={photo.height} loading="lazy" />
        </button>)}
      </div>
    </>}
    {images.length === 1 && <p className={styles.galleryCount}>Fotografía 1 de 1</p>}
  </div>;
}
