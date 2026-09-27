# Integración de fotosmax y mejora visual

## Entrega

Se integraron las 8 imágenes de fotosmax; no hay archivos sin asociación ni imágenes nuevas pendientes. Todas las asociaciones se comprobaron por nombre y revisión visual. No se consultó Internet.

Archivos modificados:
- cocina-customizer.html: estructura fotográfica de Extras, botón accesible del hero de Frentes y marcado de la galería común.
- cotizador.js: fotografías de Herrajes, soporte retrocompatible img/images, miniaturas y conexión con la galería común.

Archivos nuevos:
- configurador-galeria.css: presentación de Herrajes, Extras, Frentes y galería, limitada al configurador.
- galeria-configurador.js: lightbox común para una o varias fotografías.
- inventario-fotosmax.json: inventario completo, tamaños, destinos, IDs y SHA-256.
- INFORME-FOTOSMAX.md y validacion-fotosmax/: informe, resultados y capturas.
- Las 8 imágenes listadas abajo.

style.css, los informes anteriores y las imágenes anteriores no se editaron. Los cambios que ya existían se conservaron. Se compararon CUBIERTA_INFO, CUBIERTA_VARIANTES y PALETTES con la versión al inicio de esta ronda: son idénticos. También se comprobaron los IDs, valores de selección, nombres y descripciones anteriores de Herrajes.

## Inventario y asociaciones exactas

Origen: C:/Users/dhzil/Downloads/fotosmax/. Se inventariaron todos los archivos de la carpeta recursivamente: 8 imágenes, sin otros archivos.

| Archivo original | Opción existente | ID | Destino |
|---|---|---|---|
| basurerocompleto.jpg | Basurero Línea Alta / módulo completo | bas-la | img/customizer/herrajes/basurerocompleto.jpg |
| especiero1.jpg | Especiero | esp-si | img/customizer/herrajes/especiero1.jpg |
| esquineroextraible1.jpeg | Esquinero extraíble | mod-esq | img/customizer/herrajes/esquineroextraible1.jpeg |
| esquineroextraible2.jpg | Esquinero extraíble | mod-esq | img/customizer/herrajes/esquineroextraible2.jpg |
| esquineroextraible3.jpg | Esquinero extraíble | mod-esq | img/customizer/herrajes/esquineroextraible3.jpg |
| esquineroextraible4.jpg | Esquinero extraíble | mod-esq | img/customizer/herrajes/esquineroextraible4.jpg |
| modulogarrafon.jpg | Módulo extraíble garrafón | mod-gar | img/customizer/herrajes/modulogarrafon.jpg |
| torredecontactos.jpg | Torre de contactos | ext-contactos | img/customizer/extras/torredecontactos.jpg |

No se renombró ningún archivo. No se integraron asociaciones adicionales fuera de las cinco opciones solicitadas. Archivos no utilizados: ninguno.

## Galerías y fotografías

- Esquinero extraíble: **4 fotos en una sola opción**. HERO inicial: esquineroextraible4.jpg. Galería: 4 → 1 → 2 → 3; las cuatro imágenes se conservan. Miniaturas y contador discretos en tarjeta, con ampliación de la foto activa.
- Basurero Línea Alta / módulo completo: **2 fotos**. HERO nuevo basurerocompleto.jpg y fotografía anterior img/customizer/basurero_modulocompleto.jpeg, conservada como segunda imagen.
- Especiero: especiero1.jpg, con encuadre cercano en tarjeta y fotografía completa en lightbox.
- Módulo extraíble garrafón: modulogarrafon.jpg.
- Torre de contactos: torredecontactos.jpg sustituye al placeholder.
- Frentes: la cocina se usa primero y la muestra después, cuando ambas existen; solo muestra como fallback. No se modificaron sus catálogos.
- Cubiertas: el lightbox recibe las imágenes existentes y comienza en la foto mostrada. No se modificaron sus datos, precios ni selección.

## Diseño

**Extras:** foto arriba sin filtro de brillo ni overlay, y footer blanco compacto debajo. Se conserva toda la fotografía con object-fit: contain. El área de foto de la tarjeta LED mide aproximadamente 83% en 1440 px, 85% en 768 px, 79% en 390 px y 75% en 320 px. Nombre destacado y descripción pequeña; selección por borde/check verde y sombra ligera, sin oscurecer la imagen. Las cuatro opciones tienen botón Ampliar.

**Herrajes:** fotografías grandes, nombres legibles y descripciones compactas en panel claro. Botones flotantes discretos; las opciones sin imagen permanecen sin placeholder ni botón de ampliación. Las opciones únicas tienen ancho contenido para evitar grandes bandas vacías; el Especiero se encuadra sobre el producto. Todos los controles de fotografía detienen la propagación del clic y no alteran las selecciones.

**Frentes:** brillo original en tarjetas, panel claro localizado para el texto, nombre de línea 1.32rem en escritorio / 1.25rem móvil, subtexto .76rem y precio .84rem. Se conserva hero a la izquierda y muestras a la derecha en escritorio. Acabado actual 1.3rem, nombres de muestra .86rem / .84rem, muestras de 86px de alto. El check de la muestra seleccionada es pequeño y no cubre toda su superficie. Botón real accesible para ampliar el hero.

**Galería común:** mantiene openLightbox(src, caption) y admite openLightbox(images, caption, index). Anterior/siguiente, miniaturas, contador, flechas de teclado, Escape, deslizamiento horizontal táctil, cierre por fondo y restauración de foco/scroll. El contenido inferior queda inerte mientras está abierta; al cerrar se restaura, incluidos los modales. Una imagen no muestra controles de galería innecesarios.

## Funciones

Nuevas:
- herrajeImagenes: normaliza img/images, elimina duplicados y admite opciones con una sola imagen.
- prepararGaleriaHerraje: controles de ampliación y miniaturas de tarjeta sin tocar el estado seleccionado.
- showLightboxImage: navega entre imágenes del lightbox.
- attachPhotoControl y attachAllPhotoControls: agregan controles de ampliación a Extras/Frentes, incluidos los que se reconstruyen dinámicamente.

Modificadas:
- buildHerrajeContainer: renderiza imágenes únicas o múltiples usando los helpers.
- actualizarCubiertaVisual: envía la galería existente al lightbox, comenzando en la foto activa.
- updateFrenteModalPreview: cocina/muestra, texto alternativo y botón accesible de galería.
- openLightbox y closeLightbox: trasladadas a galeria-configurador.js y ampliadas de manera retrocompatible.
- Manejadores internos del lightbox: teclado, foco, fondo, miniaturas y gestos táctiles.

No se cambiaron las funciones de selección, navegación, resumen, PDF ni WhatsApp.

## Validaciones

- node --check para cotizador.js y galeria-configurador.js; scripts inline compilados: correcto.
- 8 archivos copiados: existencia, SHA-256 idéntico al origen, extensión y mayúsculas/minúsculas comprobadas.
- Todas las rutas de Herrajes comprobadas segmento por segmento. 21 imágenes distintas de Herrajes/Extras decodificadas correctamente en Edge; ninguna rota.
- 14 opciones de Herrajes verificadas: 13 con imagen y Torre de horno sin fotografía. Se recorrieron las 17 fotos disponibles, incluidas las 4 de Esquinero y las 2 del Basurero Línea Alta.
- Selección simple y múltiple conserva sus valores; ampliar/cambiar miniatura no modifica el estado.
- Cuatro Extras: fotografías, ampliar, seleccionar y ausencia de filtro/overlay oscuro comprobados.
- Cuatro líneas de Frentes: ampliar tarjeta, cocina como hero, modal, galería y restauración de foco/inert verificados.
- Cubiertas: colecciones, acabado y galería compartida probados; catálogos/precios comparados íntegramente con el inicio de esta ronda.
- Resumen, datos transmitidos a PDF y URL de WhatsApp comprobados con los nuevos herrajes y Torre de contactos seleccionados.
- Teclado real mediante Edge DevTools: Enter abre, flecha cambia y Escape cierra restaurando el foco. Gesto táctil real mediante DevTools: cambia de foto sin cambiar selección.
- Clic de puntero real sobre Ampliar de Extras: el botón recibe el clic y no selecciona la tarjeta.
- Ocho pasos siguiente/anterior comprobados, incluyendo validación de datos del cliente.
- Edge local a 1440×960, 768×960, 390×960 y 320×960: sin overflow horizontal en los ocho pasos; modal de Frentes comprobado en todos esos anchos. Imagen de lightbox contenida en el viewport móvil.
- Revisión visual de Extras: LED sin oscurecimiento añadido, Isla completa, detalle de Alacena, foto real de Torre de contactos y footers compactos.
- Revisión visual de Herrajes: galería de Esquinero, Garrafón, Basurero completo, Especiero y móvil de 320 px.
- Revisión visual de Frentes: tarjetas más claras, nombres grandes y modal de Transformad con Bosco, Legno Fumé y Ártico legibles.

## Evidencia visual

- [extras-1440](validacion-fotosmax/extras-1440.png)
- [extras-320](validacion-fotosmax/extras-320.png)
- [extras-inferiores-390](validacion-fotosmax/extras-inferiores-390.png)
- [frentes-1440](validacion-fotosmax/frentes-1440.png)
- [modal-frentes-1440](validacion-fotosmax/modal-frentes-1440.png)
- [modal-frentes-320](validacion-fotosmax/modal-frentes-320.png)
- [herrajes-1440](validacion-fotosmax/herrajes-1440.png)
- [herrajes-320](validacion-fotosmax/herrajes-320.png)
- [galeria-esquinero-390](validacion-fotosmax/galeria-esquinero-390.png)
- [basureros-1440](validacion-fotosmax/basureros-1440.png)
- [especias-1440](validacion-fotosmax/especias-1440.png)

## Revisión manual pendiente / límites

- La biblioteca jsPDF está referenciada desde un CDN. Las solicitudes externas se bloquearon en las pruebas; se ejecutó _buildPDF con un sustituto que captura sus llamadas de texto. Queda por comprobar la descarga y apariencia del PDF real en un navegador donde jsPDF esté disponible.
- WhatsApp se validó capturando su URL y contenido, sin abrir el servicio ni enviar mensajes.
- Las pruebas móviles usan emulación de Edge y eventos táctiles reales del protocolo; no sustituyen una revisión en un teléfono físico.
- Edge reutilizó el perfil temporal .browser-validation que ya existía de la ronda anterior; no es parte de los assets del configurador.
