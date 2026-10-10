# Fase 4A — hardening y automatización previa a staging

Esta etapa prepara el monolito FastAPI y el frontend Next.js para Internet sin crear
recursos en Render, Netlify, DNS, AWS ni producción. La arquitectura aprobada para el
paso posterior es un sitio Netlify de staging, un Render Web Service y Render Postgres.

## Matriz de configuración

| Configuración | Local | Staging | Producción futura |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `local` | `staging` | `production` |
| Base | `DB_*` | `DATABASE_URL` secreta | URL propia de producción |
| `DB_SSLMODE` | `disable` | `require` | `require` o verificación CA |
| Cookie | no Secure, `lax` | Secure, `lax`, nombre exclusivo | Secure, `lax`, nombre exclusivo |
| CORS | `http://localhost:3000` | sólo dominio canónico | sólo dominio productivo |
| OpenAPI | habilitado | deshabilitado | deshabilitado |
| Proxy | deshabilitado | sólo CIDR confirmado del proxy | sólo CIDR confirmado del proxy |
| SMTP | opcional | credencial propia + override interno obligatorio | sin override de staging |
| Catálogo | local | local durante 4A | decisión posterior |

`DATABASE_URL`, contraseñas y credenciales SMTP sólo viven en el gestor de secretos del
entorno. `NEXT_PUBLIC_*` nunca contiene secretos. Los deploy previews no se agregan a
CORS y no acceden al panel real.

## Controles de entrada

- El middleware rechaza con 413 los cuerpos mayores que `MAX_REQUEST_BODY_BYTES`, antes
  del parseo JSON. Se aplica a POST, PUT y PATCH, por lo que incluye rutas públicas y admin.
- PostgreSQL comparte ventanas de rate limiting entre procesos. Los límites separados
  cubren `kitchen-submissions`, `leads`, `appointments` y `kitchen-configurations`.
- `X-Forwarded-For` sólo se procesa cuando `TRUST_PROXY=true` y el peer inmediato está
  dentro de `TRUSTED_PROXY_CIDRS`. `Forwarded` se ignora. Una cadena inválida vuelve a la
  IP del peer. No se debe activar la confianza hasta confirmar los CIDR reales del PaaS.
- OpenAPI se controla con `OPENAPI_ENABLED`.

## Auditoría de endpoints públicos

El frontend actual sólo usa `POST /api/v1/kitchen-submissions`. No hay llamadas desde
`frontend/src`, `frontend/public` o sus pruebas a los POST individuales de leads, citas
o configuraciones. Se mantienen por compatibilidad con los contratos previos, todos con
rate limit y body limit. Antes de producción se recomienda deprecarlos y deshabilitarlos
si ningún formulario nuevo demuestra necesitarlos; no deben eliminarse sin esa revisión.

## Cookies, CORS y CSRF

Sólo se permiten `SameSite=lax` o `strict`; la topología de subdominios aprobada no
necesita `None`. La cookie sigue siendo HttpOnly, host-only y limitada a `/api/v1`.
Staging y producción rechazan configuración sin Secure. CORS sigue siendo una allowlist
de orígenes exactos. Las escrituras autenticadas conservan Origin exacto más
`X-MHG-Admin: 1`.

## Correo de staging

Si SMTP está habilitado con `ENVIRONMENT=staging`, `STAGING_EMAIL_OVERRIDE` es obligatorio
y sustituye a `NOTIFICATION_EMAIL` como destinatario efectivo. El override se rechaza en
local, test y producción para impedir mezclar políticas. El correo conserva dentro del
cuerpo los datos proporcionados por el cliente para que el equipo pueda validar el flujo.

## Headers del frontend

La CSP mantiene las excepciones mínimas que exige el frontend existente:

- `unsafe-inline` en scripts y estilos por Next.js y el documento legacy con CSS inline;
- `unpkg.com` para Leaflet;
- `cdnjs.cloudflare.com` para jsPDF;
- Google Fonts;
- imágenes HTTPS para el futuro catálogo;
- `google.com` para los mapas iframe;
- `geolocation=(self)` para seleccionar ubicación en el customizador.

Retirar estas excepciones requiere primero eliminar los scripts/estilos inline o alojar
localmente las dependencias. La API usa una CSP cerrada porque sólo entrega JSON.

## CI

Cada pull request ejecuta backend, PostgreSQL 17, Alembic, build Docker, frontend completo
y un guard ligero de secretos versionados. Dependabot revisa npm, pip y GitHub Actions.
La protección de rama y el secret scanning nativo deben activarse en GitHub al configurar
el repositorio; ningún workflow usa secretos de staging.
