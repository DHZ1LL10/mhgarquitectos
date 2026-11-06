# Fase 4D — Customizer flow + map performance

## Alcance

- Situación actual y Tableros interiores avanzan automáticamente después de una selección única.
- Frentes exteriores conserva la confirmación explícita porque permite explorar familias, colores y variantes.
- Herrajes utiliza `type` (`radio` o `multi`) y `optional` como fuente de sus reglas; no depende de etiquetas visibles.
- Cubierta, Extras y Datos del cliente conservan sus reglas funcionales.
- No hubo cambios de backend, submission, folios, SMTP, Admin ni despliegue.

## Movimiento

- Feedback de selección: 180 ms.
- Transición de panel: 380 ms.
- Easing: `cubic-bezier(.22,1,.36,1)`.
- El bloqueo compartido evita dobles acciones durante feedback y transición.
- `prefers-reduced-motion` elimina la espera y reduce animaciones a duración mínima.

## Herrajes

- `radio` obligatorio: seleccionar completa y avanza.
- `radio` opcional: seleccionar o `No aplica` completa y avanza.
- `multi` opcional: las opciones no avanzan; requiere el botón contextual o `No aplica`.
- La última subsección completa Herrajes y abre Cubierta sin usar el botón global Siguiente.
- El botón global Siguiente permanece oculto dentro del mini-wizard; Anterior y edición siguen disponibles.

## Mapa: causa y corrección

El warm-up anterior construía Leaflet, la capa OSM y dos invalidaciones mientras el modal estaba oculto. Además, una respuesta rápida o cacheada de Geolocation podía llegar antes de crear `L.map()`; `setLocationMarker` retornaba sin conservar las coordenadas y el pin se perdía.

La implementación ahora:

- crea una única instancia y una única tile layer sólo al abrir el modal;
- conserva coordenadas antes de depender de que Leaflet esté listo;
- reutiliza mapa, capa y marker;
- invalida tamaño una vez por apertura;
- usa `updateWhenIdle`, buffer limitado y desactiva animaciones costosas de Leaflet;
- persiste la selección pendiente en `sessionStorage` y la confirma hacia `state.cliente`;
- diferencia permiso denegado, ubicación no disponible, timeout y API no soportada;
- contiene visualmente el mapa con `overflow`, `isolation`, `contain` y un stacking context local sin un `z-index` extremo;
- elimina el `transform` del diálogo que envolvía el canvas de Leaflet.

## Checklist manual

- [ ] Elegir una Situación: ver check, feedback breve y avance a Tableros.
- [ ] Volver con Anterior, cambiar Situación y comprobar que se conserva.
- [ ] Elegir Tablero: verificar autoavance a Frentes.
- [ ] Explorar Frentes, abrir/cerrar modal y confirmar que no autoavanza al elegir un color.
- [ ] En Herrajes, comprobar autoavance de Bisagras y Correderas.
- [ ] En Basureros/Especiero, probar opción y `No aplica`.
- [ ] En Cajones/Módulos, seleccionar varias opciones y confirmar que no avanzan hasta el botón contextual.
- [ ] Completar Módulos por selección y por `No aplica`; ambos deben abrir Cubierta directamente.
- [ ] Volver a Herrajes y editar decisiones previas.
- [ ] Refrescar durante el flujo y confirmar paso, elecciones, subpaso y receipt restaurados.
- [ ] Abrir el mapa varias veces: debe conservar una sola instancia, pin y posición.
- [ ] Probar “Usar mi ubicación” con permiso concedido, denegado y bloqueado.
- [ ] Arrastrar el pin, confirmar, refrescar y validar coordenadas en Resumen.
- [ ] Revisar mapa y wizard en desktop y móvil; ningún pane debe cubrir textos o controles.
- [ ] Revisar navegación con Enter/Espacio, foco y `prefers-reduced-motion`.
- [ ] Completar submission real y revisar folio, PDF, WhatsApp, email y Admin sin regresiones.

## Riesgos pendientes

- Geolocation depende del permiso y precisión del navegador/dispositivo.
- Fluidez y descarga de tiles dependen de red y disponibilidad de OpenStreetMap.
- La validación automatizada usa dobles de Leaflet; la percepción de rendimiento y el clipping requieren la revisión manual indicada.
