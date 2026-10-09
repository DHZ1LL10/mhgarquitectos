# MHG Arquitectos — Frontend

Aplicación Next.js + TypeScript. Conserva el sitio corporativo y sirve el customizador como documento HTML/JavaScript independiente. El panel administrativo usa la API autenticada y el customizador envía solicitudes reales a PostgreSQL mediante el backend.

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
| `/admin/login` | Inicio de sesión administrativo real |
| `/admin` | Panel autenticado conectado a la API |
| `/customizer-runtime-config.js` | Configuración pública del customizador generada en runtime |
| `/robots.txt` | Bloqueo de indexación del entorno ficticio |
| `/sitemap.xml` | Portada, catálogo y fichas publicadas; sin administrador |

Borradores, archivados y slugs inexistentes devuelven 404. Las fichas públicas todavía se prerenderizan desde el repositorio local durante el build. El panel administrativo persiste propiedades, citas, leads y configuraciones en la API; activar el catálogo público contra esa API sigue siendo una decisión posterior.

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
  admin/                         Contratos y panel conectado a la API
  styles/                        CSS Modules encapsulados
src/data/                        Fixtures y definición de cotizaciones
public/                          Solo las copias legacy permitidas
scripts/                         Integridad, sincronización y pruebas HTTP
tests/                           Pruebas Node sin navegador
docs/                            Referencia, validación manual y rollback
```

Las vistas públicas reciben `Property` y no conocen los fixtures. `ApiPropertyRepository` ya implementa el contrato paralelo, pero el repositorio local sigue siendo el valor por defecto para no cambiar producción. La publicación futura también necesita definir generación de rutas y revalidación/caché.

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

- FastAPI, autenticación administrativa y persistencia PostgreSQL existen en el entorno local. No hay analytics ni subida de imágenes.
- Todos los inmuebles son ficticios, con aviso explícito. Imágenes del portafolio, sin afirmar disponibilidad comercial.
- El customizador sigue como documento HTML/JavaScript independiente. Al llegar al resumen envía configuración, cita y lead en una operación atómica e idempotente; WhatsApp permanece como canal complementario manual.
- `.browser-validation/` sigue teniendo 116 archivos previamente trackeados. Se añadió ignore, sin borrarlos, desindexarlos ni modificar el historial. No se copian a la aplicación.
- `/admin` exige una sesión real mediante cookie HttpOnly y el backend valida permisos por rol.
- No se optimizaron imágenes, se sustituyeron fuentes ni se consolidó el CSS legacy en esta fase.
- La apariencia, interacción, PDF, gestos, mapa y envío necesitan [validación manual](docs/VALIDACION-MANUAL.md).
- La ubicación usa Leaflet con mosaicos de OpenStreetMap, sin API key. El usuario puede marcar o mover el punto y editar la dirección manualmente; no se hace reverse geocoding.
- [Netlify de prueba](docs/NETLIFY-PRUEBA.md), [rollback](docs/ROLLBACK.md) y [resultado de validación](docs/RESULTADOS-FASE-1.md).
