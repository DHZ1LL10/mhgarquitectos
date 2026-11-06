"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { portfolioCategories, type PortfolioProject, wrapPortfolioIndex } from "@/data/portfolio";
import styles from "./portfolio.module.css";

export default function PortfolioProjects() {
  const [activeCategory, setActiveCategory] = useState(portfolioCategories[0].slug);
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const category = portfolioCategories.find((item) => item.slug === activeCategory) ?? portfolioCategories[0];
  const activeImage = activeProject?.images[activeImageIndex];

  const closeProject = useCallback(() => {
    setActiveProject(null);
    setActiveImageIndex(0);
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  const openProject = (project: PortfolioProject, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setActiveImageIndex(0);
    setActiveProject(project);
  };

  const showRelativeImage = useCallback((offset: number) => {
    setActiveImageIndex((current) => activeProject
      ? wrapPortfolioIndex(current + offset, activeProject.images.length)
      : 0);
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeProject();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showRelativeImage(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showRelativeImage(1);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeProject, closeProject, showRelativeImage]);

  useEffect(() => {
    if (!activeProject) return;
    [activeImageIndex - 1, activeImageIndex + 1].forEach((index) => {
      const image = new window.Image();
      image.src = activeProject.images[wrapPortfolioIndex(index, activeProject.images.length)].src;
    });
  }, [activeImageIndex, activeProject]);

  const selectTab = (index: number, focus = false) => {
    const selected = portfolioCategories[index];
    setActiveCategory(selected.slug);
    if (focus) tabRefs.current[index]?.focus();
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Categorías de proyectos">
        {portfolioCategories.map((item, index) => {
          const active = item.slug === activeCategory;
          return (
            <button
              className={`${styles.tab}${active ? ` ${styles.tabActive}` : ""}`}
              type="button"
              role="tab"
              id={`portfolio-tab-${item.slug}`}
              aria-controls={`portfolio-panel-${item.slug}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => {
                let destination = index;
                if (event.key === "ArrowRight") destination = (index + 1) % portfolioCategories.length;
                else if (event.key === "ArrowLeft") destination = (index - 1 + portfolioCategories.length) % portfolioCategories.length;
                else if (event.key === "Home") destination = 0;
                else if (event.key === "End") destination = portfolioCategories.length - 1;
                else return;
                event.preventDefault();
                selectTab(destination, true);
              }}
              ref={(node) => { tabRefs.current[index] = node; }}
              key={item.slug}
            >
              {item.label}
              <span aria-hidden="true">{item.projects.length.toString().padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>

      <div
        className={styles.panel}
        id={`portfolio-panel-${category.slug}`}
        role="tabpanel"
        aria-labelledby={`portfolio-tab-${category.slug}`}
      >
        <div className={styles.grid}>
          {category.projects.map((project) => (
            <button
              type="button"
              className={`${styles.card} portfolio-project-card`}
              onClick={(event) => openProject(project, event.currentTarget)}
              aria-label={`Ver proyecto ${project.title}, ${project.images.length} fotografías`}
              key={project.id}
            >
              <span className={styles.cardImage}>
                <Image
                  src={project.coverImage.src}
                  alt={project.coverImage.alt}
                  width={project.coverImage.width}
                  height={project.coverImage.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw"
                  loading="lazy"
                />
                <span className={styles.cardCount}>{project.images.length} fotos</span>
              </span>
              <span className={styles.cardBody}>
                <span className={styles.cardTag}>{project.tag}</span>
                <strong>{project.title}</strong>
                <span className={styles.cardDescription}>{project.shortDescription}</span>
                <span className={styles.cardAction}>Ver proyecto <span aria-hidden="true">↗</span></span>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.cta}>
          <p>{category.cta.prompt}</p>
          <a className="btn btn-primary" href={category.cta.href} target="_blank" rel="noopener noreferrer">
            {category.cta.label}
          </a>
        </div>
      </div>

      {activeProject && activeImage ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeProject(); }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-dialog-title"
            aria-describedby="portfolio-dialog-description"
            ref={dialogRef}
          >
            <button className={styles.close} type="button" onClick={closeProject} ref={closeButtonRef} aria-label="Cerrar proyecto">
              <span aria-hidden="true">×</span>
            </button>

            <div className={styles.gallery}>
              <div className={styles.mainImage}>
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  width={activeImage.width}
                  height={activeImage.height}
                  sizes="(max-width: 800px) 100vw, 74vw"
                  priority
                />
                {activeProject.images.length > 1 ? (
                  <>
                    <button className={`${styles.galleryArrow} ${styles.previous}`} type="button" onClick={() => showRelativeImage(-1)} aria-label="Fotografía anterior">‹</button>
                    <button className={`${styles.galleryArrow} ${styles.next}`} type="button" onClick={() => showRelativeImage(1)} aria-label="Fotografía siguiente">›</button>
                  </>
                ) : null}
                <span className={styles.imageCount}>{activeImageIndex + 1} / {activeProject.images.length}</span>
              </div>

              {activeProject.images.length > 1 ? (
                <div className={styles.thumbnails} aria-label="Miniaturas del proyecto">
                  {activeProject.images.map((image, index) => (
                    <button
                      type="button"
                      className={`${styles.thumbnail}${index === activeImageIndex ? ` ${styles.thumbnailActive}` : ""}`}
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Mostrar fotografía ${index + 1} de ${activeProject.images.length}`}
                      aria-current={index === activeImageIndex ? "true" : undefined}
                      key={image.src}
                    >
                      <Image src={image.src} alt="" width={image.width} height={image.height} sizes="72px" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className={styles.projectInfo}>
              <span>{activeProject.tag}</span>
              <h3 id="portfolio-dialog-title">{activeProject.title}</h3>
              <p id="portfolio-dialog-description">{activeProject.description}</p>
              <div className={styles.projectMeta}>
                <span>Galería completa</span>
                <strong>{activeProject.images.length} fotografías</strong>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
