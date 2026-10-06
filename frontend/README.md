# MHG Arquitectos — Fase 1

Aplicación aislada Next.js + TypeScript. Conserva el sitio corporativo y sirve el customizador original como documento HTML independiente. Propiedades y administración utilizan exclusivamente datos ficticios locales.

No se desplegó ni modificó Netlify. No se abrió navegador ni se instaló una herramienta de browser testing.

## Ejecutar localmente

Requisitos: Node `24.21.0`, npm y el repositorio completo (los hashes se comparan contra los originales de su raíz).

Desde `frontend/`:

```powershell
npm.cmd ci
$env:NEXT_TELEMETRY_DISABLED = '1'
npm.cmd run dev
```

Usar `npm` en shells donde no exista la restricción de scripts de PowerShell. El `npm.cmd` evita ejecutar `npm.ps1` y no cambia la política del equipo.

Opcional: copiar `.env.example` a `.env.local` para definir el origen local de las URLs canónicas. Sin `SITE_URL`, se utiliza `https://mhgarquitectos.com` como referencia; no se realiza ninguna llamada a ese dominio. Todo el entorno está bloqueado para indexación.

## Rutas

| Ruta | Implementación |
|---|---|
| `/` | Sitio corporativo trasladado a JSX con CSS original |
| `/index.html` | Rewrite interno hacia `/` |
| `/cocina-customizer.html` | HTML original sin React ni iframe |
| `/propiedades` | Solo propiedades `published` |
| `/propiedades/casa-demo-fortin` | Ficha de demostración con galería |
| `/propiedades/departamento-demo-tuxtepec` | Ficha de demostración con una imagen |
| `/admin` | Crear/editar/cambiar estado solo en memoria; no hay login |
| `/robots.txt` | Bloqueo de indexación del entorno ficticio |
| `/sitemap.xml` | Portada, catálogo y fichas publicadas; sin administrador |

Borradores, archivados y slugs inexistentes devuelven 404. Las fichas se prerenderizan durante el build. Editar el administrador no modifica el catálogo público ni el código fuente. Recargar o abandonar esa pantalla descarta la edición en memoria.

## Arquitectura

```text
src/app/                         Rutas, layouts y metadata
src/components/site/             Marcado e interacciones corporativas
src/components/ui/               Aviso de demostración
src/features/properties/
  types.ts                       Modelo de datos
  repository.ts                  Contrato asíncrono de lectura pública
  local-repository.ts            Adaptador local, filtra por publicación
  index.ts                       Selección del adaptador
  components/                    Listado, ficha y galería
  admin/                         Edición temporal y validación de datos
  styles/                        CSS Modules encapsulados
src/data/                        Fixtures y definición de cotizaciones
public/                          Solo las copias legacy permitidas
scripts/                         Integridad, sincronización y pruebas HTTP
tests/                           Pruebas Node sin navegador
docs/                            Referencia, validación manual y rollback
```

Las vistas reciben `Property` y no conocen los fixtures. Para una API futura, implementar `PropertyRepository` y seleccionarlo en `features/properties/index.ts`. La publicación futura también necesitará definir generación de rutas, revalidación/caché y permisos; cambiar el adaptador no habilita por sí solo un administrador real.

El administrador es deliberadamente independiente del repositorio público. `saveDemoProperty` produce una copia en memoria y nunca escribe archivos, cookies, localStorage, sessionStorage o una API.

## Verificaciones sin navegador

```powershell
npm.cmd run verify:legacy
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
$env:NEXT_TELEMETRY_DISABLED = '1'
npm.cmd run build
npm.cmd run verify:routes
```

`verify:routes` requiere un build terminado. Inicia `next start` en un puerto local libre, hace solicitudes HTTP y detiene su propio proceso al terminar. No utiliza navegador, Playwright, Puppeteer ni Selenium. En entornos con restricciones de creación de subprocesos, build y tests pueden necesitar permisos adicionales (`spawn EPERM`).

`sync:legacy` sincroniza los assets legacy aprobados y conserva las copias personalizadas registradas en `docs/legacy-customizations.json`; verifica los originales antes de escribir. `verify:legacy` comprueba los 415 hashes originales, los hashes de las personalizaciones/adiciones y rechaza archivos extra en `public/`.

`.gitattributes` conserva los finales de línea originales y desactiva transformaciones Git de las copias públicas para mantener hashes entre Windows y Linux.

## Estado y límites

- Sin backend, autenticación, persistencia, analytics ni subida de imágenes.
- Todos los inmuebles son ficticios, con aviso explícito. Imágenes del portafolio, sin afirmar disponibilidad comercial.
- El customizador sigue como documento HTML/JavaScript independiente. En esta solicitud solo cambiaron el orden de pasos, su navegación/animación, selección de ubicación y la fotografía indicada; el resto de catálogos y funciones se conserva.
- `.browser-validation/` sigue teniendo 116 archivos previamente trackeados. Se añadió ignore, sin borrarlos, desindexarlos ni modificar el historial. No se copian a la aplicación.
- La nueva navegación añade únicamente Propiedades al header/footer; el acceso a `/admin` es directo y no constituye seguridad.
- No se optimizaron imágenes, se sustituyeron fuentes ni se consolidó el CSS legacy en esta fase.
- La apariencia, interacción, PDF real, gestos y mapas necesitan [validación manual](docs/VALIDACION-MANUAL.md).
- Google Maps espera `window.MHG_GOOGLE_MAPS_API_KEY`; el archivo público está vacío y no contiene credenciales. Consulta los requisitos de Cloud/API y restricciones en [GOOGLE-MAPS.md](docs/GOOGLE-MAPS.md).
- [Netlify de prueba](docs/NETLIFY-PRUEBA.md), [rollback](docs/ROLLBACK.md) y [resultado de validación](docs/RESULTADOS-FASE-1.md).
