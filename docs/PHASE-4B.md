# Fase 4B — Local Production Readiness

Fecha de validación: 16 de octubre de 2026.

## Resultado

MHG Arquitectos queda como **LOCAL RELEASE CANDIDATE** en
`phase-4b-local-release-candidate`. No se desplegó, provisionó ni modificó ningún recurso
externo, DNS o sitio productivo. `render.yaml` permanece sin cambios para una autorización
futura.

## Evidencia funcional

- Landing, propiedades, customizador y login respondieron 200 en local.
- El verificador del build confirmó rutas públicas/admin, 404 privados, sitemap, robots,
  configuración runtime y hashes exactos de assets legacy.
- Los tests cubren navegación del customizador, Herrajes, mapa OSM, `sessionStorage`,
  idempotencia, PDF y WhatsApp.
- Una submission PostgreSQL real creó `COC-00001` y relacionó exactamente un lead, cita y
  configuración con dirección/coordenadas.
- El panel admin autenticado leyó las tres vistas, avanzó la cita por
  `pending_confirmation`, `confirmed` y `completed`, y el logout devolvió 401 después.
- El administrador sintético temporal y sus sesiones se eliminaron al terminar.
- Tras reiniciar PostgreSQL y FastAPI, health volvió a verde y el registro persistió.
- El replay con la misma clave devolvió HTTP 200, `replayed=true`, conservó `COC-00001`,
  dejó el contador en 1 y no repitió la notificación.
- Conviven cuatro folios preexistentes `MHG-*` y el nuevo formato COC.

## SMTP

El `.env` local tenía todos los campos SMTP necesarios configurados (sus valores no se
leyeron ni imprimieron). La entrega controlada quedó `sent`, con `notified_at` y un solo
intento. El contrato automatizado confirma mensaje multipart con plaintext y HTML, folio,
cliente, fecha/hora, dirección, enlace OpenStreetMap y configuración escapada de forma
segura.

`sent` prueba aceptación por el servidor SMTP, no inspección de la bandeja. La recepción y
renderización final quedan como verificación humana en `LOCAL-RELEASE-CHECKLIST.md`.

## Folios y restore

- Principal antes de la prueba: cuatro folios legacy y contador COC en 0.
- Principal después: `COC-00001`, contador 1, cuatro legacy intactos.
- Integración PostgreSQL: inicio, incremento, padding, rollback transaccional, unicidad,
  convivencia legacy y 24 asignaciones concurrentes únicas.
- Restore drill: dump custom de 38,893 bytes, restaurado en una base de nombre descartable.
- Restore verificado: 12 tablas, `0005_service_folios`, dataset RC, contador 1 y cuatro
  legacy. La base descartable y el dump transitorio se eliminaron después.

Nunca se restauró sobre la base principal y no se reinició ningún contador.

## Matriz automática

| Área | Resultado |
| --- | --- |
| Ruff check / format | Verde; 56 archivos formateados |
| `compileall` | Verde |
| Contratos backend | 74 passed |
| Integración PostgreSQL | Incluida en 108 passed |
| Suite backend Docker | 108 passed |
| Alembic principal | `0005_service_folios (head)`; sin operaciones nuevas |
| Frontend | 61 passed |
| TypeScript / ESLint | Verde |
| Assets legacy | 415 hashes originales, 414 copias públicas; JS válido |
| Next production build | Verde; 10 páginas generadas |
| Rutas/assets HTTP | Verde |
| Docker API/PostgreSQL | Ambos healthy |
| Secret scan | Verde |

Existe un aviso no bloqueante de Starlette: `TestClient` basado en `httpx` está deprecado a
favor de `httpx2`. No afecta las pruebas actuales, pero debe resolverse cuando la cadena de
dependencias soporte la migración.

## Configuración y secretos

- Git sólo trackea `backend/.env.example` y `frontend/.env.example`; los `.env` reales están
  ignorados.
- El scanner de secretos trackeados pasó.
- No se copiaron credenciales, tokens, app passwords, cookies ni URLs de base reales.
- Los ejemplos documentan local y el handoff contiene la matriz local/staging/producción.
- La clave `ENABLE_ADMIN_ENDPOINTS` encontrada únicamente en el `.env` local es legacy e
  ignorada por la configuración actual; no es necesaria para habilitar admin.

## Datos

Se conserva intencionalmente un dataset inequívocamente sintético para trazabilidad y
restore:

- folio: `COC-00001`;
- cliente: `MHG RC Local 4B 2026-10-16`;
- dirección: `Dataset sintetico RC 4B, Puebla, Puebla`;
- cita final: `completed`;
- notificación: `sent`, un intento.

Los datos preexistentes no se borraron porque su propiedad no era inequívoca. Puede haber
filas efímeras de presupuesto de login asociadas a los administradores RC por hashes no
reversibles; no se eliminaron para evitar una limpieza amplia. No son credenciales ni datos
de cliente y caducan según el control de rate limiting.

## Lo que requiere un entorno desplegado

- Cookies Secure, CORS y CSRF entre dominios HTTPS reales.
- TLS, DNS y comportamiento same-site del admin.
- Health, latencia y rate limiting detrás del proxy del proveedor.
- Backups/PITR, métricas y retención reales del plan contratado.
- Build/deploy de Netlify y Render, rollback de plataforma y observabilidad externa.
- Recepción/renderización en clientes de correo distintos al buzón controlado local.

Estos puntos no bloquean el release candidate local, pero sí bloquean declarar staging o
producción listos.
