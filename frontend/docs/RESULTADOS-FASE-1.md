# Resultado de Fase 1

## Entrega

Implementación terminada en la rama local `phase-1-next-properties`, desde `62c2efa785a16a141c9da1a2ecfd7054a739a7a0`.

El trabajo se retomó con árbol limpio y `9f96608` como HEAD: el commit de pruebas anterior sí estaba realizado. Se continuó desde el modelo local de propiedades, sin repetir la migración corporativa.

No se hizo push ni deploy. No se consultó ni modificó la configuración remota de Netlify, dominio o DNS. No se abrió navegador ni se usó o instaló Playwright, Puppeteer o Selenium. `npm ls` confirmó ausencia de esos paquetes instalados.

## Implementado

- Next.js 16.3.8, React 19.3.0, TypeScript 5.9.3; Node local 24.21.0; versiones directas fijadas y lockfile.
- Sitio corporativo convertido a JSX conservando secciones, clases, IDs, contenido e imágenes. Header/footer reutilizados; única ampliación deliberada: enlace Propiedades.
- Interacciones corporativas adaptadas a effects con cleanup; formularios conservan configuración y formato de mensajes de WhatsApp.
- Customizador independiente en `/cocina-customizer.html`, sin React ni iframe; `/index.html` resuelve la portada mediante rewrite.
- Contrato asíncrono de repositorio público de propiedades, adaptador local y selección central del adaptador, sin conocimiento de fixtures en las vistas.
- `/propiedades` muestra dos registros `published`; borrador y archivado no son públicos.
- Dos fichas prerenderizadas con metadata individual, canonical, Open Graph, Twitter Card, galería y contenido inicial HTML.
- `/admin` permite crear/editar y simular estados únicamente en memoria. Aviso exacto, sin login, backend, almacenamiento o upload.
- CSS Modules para las pantallas nuevas y aviso de demostración; CSS legacy intacto.
- Sitemap de rutas públicas y bloqueo de indexación en metadata, robots y cabeceras del entorno ficticio.
- Configuración y documentación de Netlify de prueba, sin crear el sitio.

## Verificaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm run build` | Correcto; 9 páginas generadas en el build |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto, cero warnings |
| `npm test` | 11 pruebas Node correctas |
| `npm run verify:legacy` | 415 originales y 412 copias con SHA-256 correcto; sintaxis legacy correcta |
| `npm run verify:routes` | Rutas, HTML inicial, metadata, 404, headers y bytes legacy correctos mediante HTTP local |
| Referencias de imágenes | Coincidencia exacta de nombres y mayúsculas; único faltante conocido: favicon legacy |
| Originales frente al commit de referencia | Sin diferencias en HTML, CSS, JS, imágenes ni perfil de navegador |
| `.browser-validation/` | 116 archivos previamente trackeados; no borrados ni desindexados; fuera de public/ y del artefacto nuevo |

Build y runners necesitaron permiso para crear subprocesos: la ejecución restringida de Windows falló con `spawn EPERM`; la ejecución autorizada posterior terminó correctamente. No se cambió la política de PowerShell ni la configuración del sistema.

### Rutas verificadas por HTTP

200 y HTML inicial: `/`, `/index.html`, `/propiedades`, `/propiedades/casa-demo-fortin`, `/propiedades/departamento-demo-tuxtepec`, `/admin`.

404: `/no-existe`, `/propiedades/no-existe`, `/propiedades/casa-demo-borrador`, `/propiedades/departamento-demo-archivado`, `/.browser-validation/Local%20State`, `/INFORME-FOTOSMAX.md`.

200 y hash exacto de respuesta: `/cocina-customizer.html`, `/style.css`, `/cotizador.js`, `/galeria-configurador.js`, `/configurador-galeria.css`, `/img/logo.jpg`.

También se comprobó el sitemap, robots y la misma secuencia de 27 imágenes y 23 tarjetas de proyecto del HTML corporativo original. El script detuvo el servidor local al terminar.

### Archivos protegidos por SHA-256

Ocho archivos de raíz: `index.html`, `script.js`, `modals.js`, `cocina-customizer.html`, `cotizador.js`, `galeria-configurador.js`, `configurador-galeria.css`, `style.css`; más las 407 imágenes de `img/`.

Las copias públicas son cinco de esos documentos (customizador, cotizador, galería JS, galería CSS y style.css) y las 407 imágenes. El manifiesto con cada hash se encuentra en `legacy-baseline.json`.

## Commits de implementación

| Commit | Alcance |
|---|---|
| `3da23cd` | Baseline y criterios de aceptación |
| `c0c3aae` | Corrección UTF-8 de la documentación del baseline |
| `da96b90` | Scaffold aislado Next.js y TypeScript |
| `dd52160` | Copias legacy verificables y rutas de compatibilidad |
| `bfeee85` | Preservación de bytes y finales de línea con Git |
| `8ac0a61` | Traslado fiel del marcado corporativo |
| `b59cc41` | Interacciones en el ciclo de React |
| `9f96608` | Regresiones sin navegador |
| `d0044af` | Modelo y repositorio local de propiedades |
| `a29606e` | Listado de propiedades |
| `7c61724` | Fichas, metadata y rutas SEO |
| `5c2b9dd` | Administración de demostración en memoria |
| `0e63aef` | Integración de navegación |
| `10fae13` | Preparación documental de Netlify de prueba |
| `666f473` | Verificación HTTP del build sin navegador |

Este informe, README, checklist manual y rollback se entregan en el commit final de documentación, identificable mediante `git log -1`.

## Pendientes y límites

- La equivalencia visual es objetivo de la implementación, no una validación realizada. El usuario debe ejecutar `VALIDACION-MANUAL.md`.
- No se generó ni abrió un PDF real; no se probaron WhatsApp, mapas, teclado, gestos, foco ni navegadores físicos. Se verificaron mensajes/URLs y datos sin abrir servicios.
- No se midieron Core Web Vitals, carga real de fuentes ni tamaños de viewport.
- No se desplegó Netlify de prueba; adaptador, redirects y headers deben comprobarse allí cuando se autorice.
- Los datos mock permanecen `noindex`. Indexar propiedades requiere contenido real aprobado y revisar juntos robots, metadata, cabeceras y origen canónico.
- `dynamicParams = false` limita las fichas a las generadas en build. La conexión futura a FastAPI requiere definir publicación y revalidación, además del adaptador HTTP.
- El administrador no es seguro ni persistente y no debe recibir datos personales. Su estado no altera el catálogo público.
- El customizador conserva los defectos de la referencia: favicon ausente, reinicio sin limpiar, limitaciones por zonas, validación básica, inserción HTML de datos, texto inicial de bisagra y truncado/folio PDF.
- No se resolvió la separación de los dos números WhatsApp; se conservan como estaban.
- No se optimizaron imágenes ni se consolidó CSS; las copias públicas duplican deliberadamente assets durante la convivencia.
- La instalación advirtió que ESLint 9.39.5 está deprecado. El lint fijado funciona y pasó; revisar su actualización compatible como mantenimiento de herramientas, sin afectar el legacy.
- `.browser-validation` continúa en el historial y en Git. El ignore evita archivos nuevos; su eventual limpieza requiere un trabajo separado y explícito.

## Siguiente paso

Ejecutar la checklist manual local y comunicar diferencias concretas. Tras aprobar esa equivalencia, autorizar por separado un sitio de prueba Netlify. Producción debe continuar sin cambios.
