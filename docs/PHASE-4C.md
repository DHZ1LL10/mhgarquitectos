# Fase 4C — Primera propiedad real

## Alcance

Se incorpora la primera propiedad real al repositorio local: `residencia-mata-larga-fortin`.
Los cuatro registros demo permanecen como fixtures draft/archived y no se exponen en la
landing, el catálogo, rutas públicas ni sitemap. Esta fase no hace deploy ni modifica
Render, Netlify, DNS, `main` o producción.

## Fotografías

La fuente contiene 18 JPEG únicos de 1080 × 1350 px, sin rotación EXIF y con un peso total
aproximado de 2.19 MiB. No había duplicados exactos. Se copiaron sin recomprimir ni escalar,
porque cada archivo ya pesa entre 96 y 255 KB. Los originales de `Downloads/casaMax` no se
modificaron.

La portada es `fachada-portada.jpg`. La galería incluye fachada, jardín, sala–comedor,
vestíbulo, baños, recámaras y los planos de ambas plantas. Sus miniaturas se desplazan
horizontalmente para evitar una pared de 18 elementos en móvil.

## Datos y compatibilidad

- Precio de oportunidad: $2,990,000 MXN.
- Precio de lista: $3,190,000 MXN.
- Bono especial: $200,000 MXN.
- 202 m² de terreno, 174 m² de construcción y 105 m² de jardín.
- 3 recámaras, 2 baños completos y 1 medio baño.
- Etapa final de construcción, aproximadamente 85% de avance.
- La cochera se comunica sólo como parte de la distribución; no se inventa un número de
  estacionamientos.

El contrato conserva `areaM2`/`area_m2` y añade campos opcionales para superficies,
medio baño, progreso, estado, distribución, detalles y términos comerciales. PostgreSQL ya
guarda `features` como JSONB, por lo que no se requiere migración SQL.

## Checklist manual

- [ ] Landing: aparece sólo Mata Larga en “Propiedades en venta”; foto y precio son legibles.
- [ ] `/propiedades`: sólo hay una tarjeta, sin textos demo ni datos de estacionamiento.
- [ ] Ficha: título, ubicación, superficies, recámaras, baños y avance son correctos.
- [ ] Comercial: lista $3,190,000, bono $200,000 y oportunidad $2,990,000 tienen jerarquía clara.
- [ ] Galería desktop: 18 imágenes, flechas, contador y miniaturas funcionan sin deformación.
- [ ] Galería móvil: la imagen cabe, las miniaturas tienen scroll horizontal y no desbordan.
- [ ] Planos: planta baja y planta alta aparecen al final de la galería.
- [ ] CTA: “Solicitar información” llega a contacto.
- [ ] WhatsApp: abre el número central MHG con propiedad, precio y solicitud de visita.
- [ ] SEO: title, description, canonical y OpenGraph usan la propiedad y portada reales.

## Datos deliberadamente no inventados

No se publica cantidad de cajones, coordenadas, antigüedad, orientación, régimen, dirección
exacta, fecha de entrega ni una promesa de terminación. Esos datos deberán agregarse sólo
cuando MHG los confirme.
