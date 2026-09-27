# Informe del configurador — 24/09/2026

Cambios realizados dentro del proyecto, sin investigación en Internet. Descargas solo se leyó como origen. Se conservaron los cambios previos; style.css no se editó en esta ronda.

## Archivos

Modificados: cotizador.js y cocina-customizer.html.
Agregados: este informe, inventario-piedrasinterizada.json y 96 imágenes en img/customizer/piedrasinterizada/, con sus nombres originales.

Inventario exhaustivo: 130 archivos de origen, 118 asociados (22 existentes y 96 copiados) y 12 sin asociación segura. El JSON contiene nombres, tamaños, asociaciones y rutas HERO/muestra/galería.

## Precios por metro lineal

| Categoría | Precio base |
|---|---:|
| Base sólida Corian | $6,500 |
| Granito | $8,500 |
| Cuarzo | $12,000 |
| Piedra sinterizada | $17,000 |

La fuente de precios es CUBIERTA_INFO.precioBase. Tarjetas y estado se alimentan de ella; modal, resumen, PDF y WhatsApp consumen el mismo valor.

## Catálogo

62 variantes: Luxury 12; Mármol 17; Piedra / Stone 25; Cemento & Urbano 8. Se conservaron los 11 identificadores anteriores y se agregaron 51 variantes. Paloma Stone ahora se muestra como Palomastone, conservando su ID.

Cada variante tiene una colección. Abrir Piedra sinterizada muestra primero las colecciones. Elegir colección no selecciona acabado; cambiar a otra colección limpia una variante incompatible. Cambiar categoría también limpia la variante. Reabrir la misma categoría conserva el acabado y vuelve a mostrar las colecciones.

Se priorizaron fotografías de cocina como HERO y placas como muestras; ambas se pueden ampliar. Mystic Silver, Appennino Gold y Ceppo di Gre se revisaron visualmente para distinguir cocina de placa a pesar de los tamaños incluidos en sus nombres.

Pendiente: Statuario. El archivo galeria-new-torano-statuario.webp nombra dos acabados y no permite atribución inequívoca.

Se reconocieron las grafías identificables amayalimen (Amaya Linen), Appenino/Appeninno (Appennino Gold), Grey (Gray) y Tivoli Strata (Tivoli White Strata). Los nombres visibles siguen exactamente el catálogo indicado.

## Funciones agregadas

- cubiertaPrecioTexto: formato central de precios.
- actualizarTarjetasCubierta: nombres y precios desde el catálogo.
- selectCubiertaColeccion: filtrado, limpieza de selección incompatible y recuperación del foco.

## Funciones modificadas

- Inicialización DOMContentLoaded: actualiza tarjetas.
- selectCubierta: obtiene nombre/precio del catálogo y reinicia la vista de colecciones.
- renderCubiertaVariantes: colecciones compactas y acabados filtrados.
- selectCubiertaVariante: valida colección activa y guarda su clave.
- cubiertaImagenes y cubiertaMuestra: respetan HERO y muestra explícitos.
- buildHerrajeContainer: botón nativo Ampliar por foto, stopPropagation y ocultación si falla la imagen.
- selectHerrajeOpt: corrige el selector que retiraba la marca anterior en opciones únicas.
- buildSummary, _buildPDF y sendWhatsApp: etiqueta Especiero; se conserva la clave especias.
- Registro automático de lightbox en HTML: Herrajes usa su botón dedicado, conservando el clic de selección de tarjeta.

## Validaciones

- Sintaxis de cotizador.js y scripts inline correcta.
- 325 referencias del catálogo verificadas por segmentos y mayúsculas/minúsculas.
- Las 96 imágenes nuevas existen; las existentes coinciden por SHA-256 con el origen.
- 118 rutas sinterizadas decodificadas correctamente en Edge local.
- Sin IDs/nombres duplicados; cada variante sinterizada tiene una colección válida.
- Probados 62 acabados, cuatro filtros, cambios de colección, HERO, modal abierto y cambio a Granito.
- Cuatro precios propagados al estado, resumen, textos entregados a PDF y URL de WhatsApp. Acabado comprobado en las exportaciones.
- Las 10 opciones de Herrajes con imagen abren lightbox sin cambiar selección; sin imagen no tienen Ampliar. Selecciones únicas y múltiples verificadas. Ampliar activado mediante Enter.
- Navegación siguiente/anterior de ocho pasos y apertura/cierre del modal de frentes verificadas.
- Edge headless a 1440×900, 390×900 y 320×900: sin overflow horizontal en ocho pasos ni modal. Revisión visual de escritorio y móvil.

Limitación: jsPDF se carga desde CDN. Se bloquearon solicitudes HTTPS y se verificó _buildPDF con un sustituto que captura sus llamadas de texto; no se generó un PDF real. WhatsApp se validó capturando la URL, sin abrir el servicio ni enviar mensajes.

Git diff --check señala espacios finales en bloques de frentes con modificaciones previas; no se limpiaron bloques ajenos al alcance.

## Archivos sin asociación segura

Los nombres genéricos no identifican material; Dakota, Cosmopolita Black y los cajones no pertenecen al catálogo. Las fotos que mencionan dos acabados no se atribuyen a uno por suposición. Foto-Portland no distingue Linen/Pearl y Onice White Matt no confirma Lux White.

- `6.jpg`
- `amb-03-dakota-copia-WEBP.webp`
- `Ambte-1_Vagli-Gold-Crotone-Pulpis-1.webp`
- `cajonlateralescristal.webp`
- `cajontiraaluminio.webp`
- `COSMOPOLITA_BLACK_3200X1600_RGB_PZA1_11zon-1-scaled-e1769613007227-2048x1024.webp`
- `ESPACIO_NOCHE-1-copia.webp`
- `Foto-Portland-min.jpg`
- `galeria-new-torano-statuario.webp`
- `JPEG-DalmauInteriors-RubenMilena-ALTA-13.jpg`
- `MG_3592dAA_8_11zon.webp`
- `ONICE-WHITE-MATT-160X320-JPG-scaled-e1750938818807-2048x1024.jpg.webp`

## Imágenes nuevas copiadas

Destino: img/customizer/piedrasinterizada/

- `amazonite-seagreen-02.webp`
- `AMAZONITE_-horizontal-rbzaxflm3a0vq1s2hp1yzbwwe579rpbnin77sqazik.jpg`
- `ANKARA-768x573.webp`
- `AS_ANKARA_B_3200x1600_RGB_11zon-scaled-e1788852943830-2048x1024.webp`
- `AS_AURA_LUX_WHITE_A_3200X1600_RGB_ALTA_MOD_2_11zon-1-scaled-e1768988912116-2048x1024.webp`
- `ASCALE_AURA-AMB-3-SECUNDARIA_11zon.webp`
- `cover-crystal-lux-white-5120-2048x1038.webp`
- `cover-labradorite-royalblue-1-2048x1023.webp`
- `labradorite-royalblue-01.webp`
- `AS_MYSTIC_SILVER_B_3200X1600_RGB_11zon_11zon-2-2048x1024.webp`
- `MYSTIC-SILVER-160X320_4_11zon.webp`
- `amb-14-onice-black_1_11zon.webp`
- `ONICE_BLACK_A_3200X1600_RGB_PZA1-scaled-e1750938961304-2048x1024.jpg.webp`
- `ONICE-BLUE-MATT-160X320-A_WEB-scaled-e1756453006285-2048x1024.webp`
- `Onice_Blue_web.webp`
- `11zon_amb-17-onice-lux-white.webp`
- `ONICE-SEAGREEN-2-1.jpg`
- `ONICE_SEAGREEN_A_1600X3200_RGB_ALTA_3_11zon-scaled-e1767806053996-2048x1023.webp`
- `cover-patagonia-5120-2048x1023.webp`
- `patagonia-gold-01.webp`
- `AS_VERSILIS_V3_A_3200X1600_RGB-scaled-e1788863852738-2048x1024.webp`
- `alpiwhite.webp`
- `alpiwhitecocina.webp`
- `APPENNINO-GOLD-160X320_3_11zon.webp`
- `AS_APPENINNO_GOLD_B_3200X1600_RGB_11zon_11zon-1-2048x1024.webp`
- `AS_APPENINNO_GOLD_B_3200X1600_RGB_11zon_11zon-1-scaled-rinl51m2yrkgggukrcknypdjb0q0arye37rqib4vnw.webp`
- `ASCALE_APPENINO-cocinawebp.webp`
- `Casa-Caujaral-Lungomare-Meson-e-isla-Gramarston®-Belvedere-Black-01-gramar.jpg`
- `cover-belvedere-black-5120-2048x1024.webp`
- `amb-28-crotone-pulpis_v2_3_11zon.webp`
- `CROTONE_PULPIS_160X320_RGB_PZA3-min-scaled-e1748426594481-2048x1024.jpg.webp`
- `Cocina-principal-Modula-Line-Meson-salpicadero-e-isla-Gramarston®-Ducal-Gold-01-gramar.jpg`
- `cover-ducal-gold-5120-2048x1034.webp`
- `amb-25-grassi-white_v2_2_11zon.webp`
- `cover-grassi-white-5120-1-2048x1024.jpg.webp`
- `cover-lasa-white-1-2048x1024.webp`
- `lasa-white-06.webp`
- `cover-laurent-black-5120-2048x1024.webp`
- `laurent-black-05.webp`
- `cover-lucca-gold-5120-2048x1022.webp`
- `lucca-gold-01.webp`
- `AMBIENTE-LUMINA-COLOR.webp`
- `AS_LUMINA_A_1760X3525_RGB-1-scaled-e1788857200779-2048x1024.webp`
- `cover-macchia-vecchia-2048x1022.webp`
- `macchia-vecchia-gold-05.webp`
- `26-Marquina-Ascale-01-scaled.webp`
- `MARQUINA_BLACK_A_1600X3200_RGB_1_11zon-scaled-e1767870529832-2048x1024.webp`
- `montblanc-white-04.webp`
- `MONTBLANC_WHITE_A_3200X1600_RGB_1_11zon-1-scaled-e1767870093852-2048x1024.webp`
- `cover-new-torano-h-2048x1024.webp`
- `ASCALE_AMB-5-TAJ-MAHAL-VARIANTE.jpg`
- `cover-taj-mahal-almond-5120-2048x1024.webp`
- `VAGLI-GOLD-B-Editada-1-scaled-e1752675434928-2048x1035.webp`
- `ASCALE_COCINA-VERSO-SECUNDARIA-1_ALTA-copia.webp`
- `VERSO_GOLD_A_RGB_PZA1_1-copia-2-2048x1025.webp`
- `amayalimen.webp`
- `amayalimencocina.webp`
- `antalya-sand-06.webp`
- `H-ANTALYA_SAND_3200X1600_RGB_PZA1_MASCARAS-2048x1024.webp`
- `ASCALE_ARMANI-SILVER-SECUNDARIA_1-copia.webp`
- `cover-armani-silver-2048x1024.webp`
- `BOREAL_SAND_1600X3200_PZA1_RGB_ALTA_1_11zon-1-2048x1024.webp`
- `ASCALE_BOREAL-UMBER-webp.webp`
- `BOREAL_UMBER_1600X3200_PZA3_R__-2048x1024.webp`
- `AS_BRERA_BONE_3200X1600_RGB_PZA1-copia-1-scaled-e1786521553192-2048x1024.webp`
- `ASCALE_COCINA-BRERA-BONE-DET_BAJA.webp`
- `AS_BRERA_DARK_3200X1600_RGB_PZA1-copia-1-scaled-e1786531464521-2048x1024.webp`
- `webp-ASCALE_COCINA-BRERA-DARK_detalle.webp`
- `AS_BRERA_LIGHT_3200X1600_RGB_PZA1-copia-1-scaled-e1786526164382-2048x1024.webp`
- `ASCALE_BANO-BRERA-LIGHT_BAJA_3.webp`
- `CEPPO-DI-GRE_320X160-4.jpg`
- `CEPPO_DI_GRE_SILVER_1-e1747297291567-2048x1021.jpg.webp`
- `AS_DENVER_1200X2800_RGB_PZA1_MASCARAS-1-2048x878.webp`
- `amb-01-foresta-blue-120x280_1_11zon.webp`
- `FORESTABLUE-2048x1024.webp`
- `Apt-Modelo-Sta-Maria-de-los-Cerros-Cocina-Quadra-Laminada-Gramarston®-Grum-Black-02.webp`
- `cover-grum-black-5120-2048x1024.webp`
- `PORTLAND_LINEN_1600X3200_RGB_PZA1-2048x1024.jpg.webp`
- `AMB_PORTLAND-PEARL-1.jpg`
- `PORTLAND_PEARL_1600X3200_RGB_PZA1_MASCARAS-copia-1-2048x1024.webp`
- `amb-05-tivoli-strata-100x300-copia.webp`
- `TIVOLI_WHITE-STRATA_1000X3000_RGB_PZA1-1-scaled-e1786957418322-2048x683.webp`
- `tivolistratacocina.webp`
- `tivoliwhitestrata.webp`
- `ASCALE_COSMOPOLITA-BROWN-DET.jpg`
- `COSMOPOLITA_BROWN_3200X1600_RGB_PZA2_2_11zon_2_11zon-1-scaled-e1767868643310-2048x1024.webp`
- `ASCALE_COSMOPOLITA-DARK_11zon.webp`
- `COSMOPOLITA_GREY_3200X1600_PZA1-copia-2048x1024.jpg.webp`
- `Det_Cosmopolita-Gray.webp`
- `11zon_COSMOPOLITA_IVORY_1200X2800_RGB_PZA1-scaled-e1789110561249-2048x878.webp`
- `ASCALE_COSMOPOLITA-LIGHT.jpg`
- `COSMOPOLITA_LIGHT_3200X1600_PZA1_RGB_ALTA_11zon_11zon-1-1-2048x1018.webp`
- `ASCALE_COSMOPOLITA-SILVER.jpg`
- `COSMOPOLITA_SILVER_3200X1600_PZA1-copia-2048x1024.jpg.webp`
- `amb-15-urban-white_1_11zon.webp`
- `URBAN_WHITE_1200X2800_RGB_PZA3-min-scaled-e1747387097587-2048x878.jpg.webp`

## Residuo de validación

El perfil temporal .browser-validation dejó carpetas residuales por permisos de Windows. La revisión automática rechazó su eliminación forzada. No forma parte del configurador. Los scripts y capturas temporales sí se eliminaron.
