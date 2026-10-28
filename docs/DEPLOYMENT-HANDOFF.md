# MHG Arquitectos — handoff de despliegue futuro

## Punto de partida

Fase 4B cierra un release candidate local. No existe staging provisionado por esta fase,
no se modificó producción, DNS ni la web actual de Netlify. `render.yaml` conserva la
arquitectura aprobada: API FastAPI en Render Web Service, PostgreSQL administrado en Render
y frontend staging como un sitio Netlify separado.

La autorización futura debe cubrir explícitamente el gasto recurrente y cualquier cambio
de DNS. Los precios y límites de los proveedores cambian: hay que revisarlos el mismo día
de contratar, sin reutilizar estimaciones históricas.

## PRE-CUTOVER 4G

El repositorio distingue frontend `local`, `staging` y `production` mediante
`DEPLOYMENT_ENV`. Un build con `NODE_ENV=production` se detiene si esa variable falta.
Staging y producción exigen `PROPERTY_REPOSITORY=api`, las tres URLs de API idénticas,
HTTPS y `SITE_URL` sin path. Esto evita publicar por accidente fixtures locales o un build
con modo SEO indeterminado.

### Render staging

Configuración no secreta:

| Variable | Valor exacto |
| --- | --- |
| `ENVIRONMENT` | `staging` |
| `DB_SSLMODE` | `require` |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` | `5` / `5` |
| `DB_POOL_TIMEOUT_SECONDS` / `DB_POOL_RECYCLE_SECONDS` | `10` / `1800` |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | `true` / `lax` |
| `COOKIE_NAME` | `mhg_staging_session` |
| `SESSION_HOURS` | `8` |
| `CORS_ORIGINS` | `["https://staging.mhgarquitectos.com"]` |
| `OPENAPI_ENABLED` | `false` |
| `MAX_REQUEST_BODY_BYTES` | `1048576` |
| `TRUST_PROXY` / `TRUSTED_PROXY_CIDRS` | `false` / `[]` |
| `PUBLIC_RATE_LIMIT_ENABLED` | `true` |
| `PUBLIC_RATE_LIMIT_WINDOW_SECONDS` | `900` |
| `PUBLIC_RATE_LIMIT_KITCHEN_SUBMISSIONS` | `10` |
| `PUBLIC_RATE_LIMIT_LEADS` | `20` |
| `PUBLIC_RATE_LIMIT_APPOINTMENTS` | `10` |
| `PUBLIC_RATE_LIMIT_KITCHEN_CONFIGURATIONS` | `10` |
| `LOG_LEVEL` | `INFO` |
| `SMTP_PORT` / `SMTP_USE_TLS` | `587` / `true` |

Secretos o configuración interna en Render: `DATABASE_URL` generado por
`mhg-postgres-staging`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` y
`STAGING_EMAIL_OVERRIDE`. El override debe ser un buzón interno y `NOTIFICATION_EMAIL`
no se usa como destinatario efectivo en staging.

### Netlify staging

El sitio debe ser nuevo y separado del sitio productivo actual. Todas estas variables son
configuración pública; Netlify no recibe secretos de backend:

| Variable | Valor exacto |
| --- | --- |
| `DEPLOYMENT_ENV` | `staging` |
| `SITE_URL` | `https://staging.mhgarquitectos.com` |
| `PROPERTY_REPOSITORY` | `api` |
| `PROPERTY_API_BASE_URL` | `https://api-staging.mhgarquitectos.com/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api-staging.mhgarquitectos.com/api/v1` |
| `CUSTOMIZER_API_BASE_URL` | `https://api-staging.mhgarquitectos.com/api/v1` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

`next.config.ts`, metadata raíz y `robots.ts` producen `noindex, nofollow`, bloqueo
completo en robots y `X-Robots-Tag` para staging. `netlify.toml` ya no fija ese header de
forma global: así producción no puede heredarlo por reutilizar el archivo.

### Render production

No existe todavía un recurso productivo en este repositorio. Cuando se autorice, usar la
misma imagen y comandos de migración/health de staging con esta configuración no secreta:

| Variable | Valor exacto |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `DB_SSLMODE` | `require` |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` | `5` / `5` inicialmente |
| `DB_POOL_TIMEOUT_SECONDS` / `DB_POOL_RECYCLE_SECONDS` | `10` / `1800` |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | `true` / `lax` |
| `COOKIE_NAME` | `mhg_production_session` |
| `SESSION_HOURS` | `8` |
| `CORS_ORIGINS` | `["https://mhgarquitectos.com"]` |
| `OPENAPI_ENABLED` | `false` |
| `MAX_REQUEST_BODY_BYTES` | `1048576` |
| `TRUST_PROXY` / `TRUSTED_PROXY_CIDRS` | `false` / `[]` |
| `PUBLIC_RATE_LIMIT_ENABLED` | `true` |
| Límites públicos | los mismos valores iniciales de staging |
| `LOG_LEVEL` | `INFO` |
| `SMTP_PORT` / `SMTP_USE_TLS` | `587` / `true` |

Secretos o configuración interna: `DATABASE_URL` productiva exclusiva,
`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` y `NOTIFICATION_EMAIL` operativo.
`STAGING_EMAIL_OVERRIDE` debe estar ausente; la configuración backend rechaza su presencia
fuera de staging.

### Netlify production

Estas variables son públicas y deben cargarse sólo cuando el nuevo frontend vaya a
reemplazar el deploy productivo mediante un cutover autorizado:

| Variable | Valor exacto |
| --- | --- |
| `DEPLOYMENT_ENV` | `production` |
| `SITE_URL` | `https://mhgarquitectos.com` |
| `PROPERTY_REPOSITORY` | `api` |
| `PROPERTY_API_BASE_URL` | `https://api.mhgarquitectos.com/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.mhgarquitectos.com/api/v1` |
| `CUSTOMIZER_API_BASE_URL` | `https://api.mhgarquitectos.com/api/v1` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

En production las rutas públicas generan metadata indexable, robots permite contenido
público y enlaza el sitemap del `SITE_URL`; `/admin` continúa con metadata `noindex`.
No se emite `X-Robots-Tag: noindex`. Sitemap y canonical se derivan de variables, no de
un dominio fijado en el código de despliegue.

### Controles de identidad, demo y correo

- El backend exige HTTPS en CORS, cookies Secure/lax y un nombre de cookie distinto en
  staging y producción. Frontend y API deben permanecer bajo el mismo dominio registrable
  (`*.mhgarquitectos.com`) para que la cookie host-only y SameSite funcione por HTTPS.
- `seed_admin_demo.py` se detiene antes de abrir la base cuando `ENVIRONMENT` no es
  `local`; nunca forma parte de `dockerCommand`, pre-deploy ni comandos productivos.
- Producción frontend no compila con `PROPERTY_REPOSITORY=local`. Antes de migrar datos se
  deben buscar los marcadores sintéticos documentados; nunca se deben importar bases
  locales ni ejecutar seeds.
- Producción rechaza `STAGING_EMAIL_OVERRIDE`. Staging exige el override cuando SMTP está
  configurado.
- No se crea una cuenta real durante build o deploy. Después de `alembic upgrade head`, y
  sólo en la base productiva confirmada, se ejecutará interactivamente
  `python -m app.scripts.create_owner`. No ejecutar `seed_admin_demo.py`.

## Secuencia cuando el cliente autorice

1. **Revisar precio y alcance.** Confirmar precios actuales de Render Web Service, Render
   PostgreSQL, almacenamiento/backups, Netlify, SMTP y monitorización. Definir presupuesto,
   responsables y fecha de apagado si staging será temporal.
2. **Elegir staging temporal o producción.** No reutilizar la web productiva para la
   prueba. Si se omite staging, registrar la aceptación del mayor riesgo.
3. **Confirmar el commit.** Usar un commit con CI verde, secret scan verde y migraciones
   revisadas. No desplegar una rama con cambios locales.
4. **Crear Render PostgreSQL.** Aplicar el recurso descrito en `render.yaml`, misma región
   que la API, red privada, PostgreSQL 17 y sin acceso público. Confirmar plan, disco,
   retención y procedimiento de recuperación antes de cargar datos.
5. **Crear Render API.** Crear el Blueprint desde el repositorio. Revisar que el contexto y
   Dockerfile sean `backend/`, que `/health` sea el health check y que el pre-deploy ejecute
   `alembic upgrade head`, `current` y `check`.
6. **Crear sitio Netlify separado.** Base `frontend`, build `npm run build`, publish `.next`.
   Mantener intacto el sitio productivo actual. Desactivar previews que no tengan una
   política de variables/CORS deliberada.
7. **Cargar variables y secretos.** Render recibe base de datos, SMTP y configuración de
   backend; Netlify sólo URLs/configuración pública. Nunca copiar `.env` local. Usar el
   gestor de secretos de cada proveedor.
8. **Cerrar CORS.** `CORS_ORIGINS` debe ser un array JSON de orígenes HTTPS exactos, sin
   wildcard ni rutas. Incluir sólo el frontend autorizado.
9. **Configurar SMTP.** Usar credenciales dedicadas al entorno. En staging definir
   obligatoriamente `STAGING_EMAIL_OVERRIDE` a un buzón interno y probar con datos
   sintéticos.
10. **Ejecutar migraciones.** Revisar logs del pre-deploy; no activar el release si
    `upgrade`, `current` o `check` falla. Obtener un backup/PITR antes de futuras migraciones
    sobre datos de producción.
11. **Crear owner.** En una shell interactiva de Render ejecutar
    `python -m app.scripts.create_owner`; confirmar el correo real antes de hacerlo y
    guardar la credencial temporal en el gestor de contraseñas.
12. **Configurar dominios.** Tras autorización separada de DNS, usar frontend y API bajo el
    mismo site registrable, por ejemplo `staging.mhgarquitectos.com` y
    `api-staging.mhgarquitectos.com`. No tocar los registros productivos no relacionados.
13. **Validar TLS y cookies.** Confirmar certificados válidos, `COOKIE_SECURE=true`, cookie
    HttpOnly host-only, nombre exclusivo por entorno y `COOKIE_SAMESITE=lax`. Las URLs
    temporales `netlify.app`/`onrender.com` no validan de forma fiable el admin por ser
    cross-site.
14. **Ejecutar smoke test.** Health, landing, propiedades, submission sintética, folio,
    relaciones admin, transiciones, logout y SMTP al override. Confirmar que CORS/CSRF
    rechazan orígenes no autorizados.
15. **Verificar backups.** Confirmar la ventana real de PITR/backup del plan contratado y
    realizar un restore a una instancia/base separada; nunca sobre la activa.
16. **Activar monitorización.** Alertar sobre `/health`, errores 5xx, latencia, uso de disco,
    conexiones PostgreSQL, fallos de deploy/migración y fallos SMTP. Definir quién responde.

## Variables por entorno

| Área | Local | Staging | Producción |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `local` | `staging` | `production` |
| Base | `DB_*`, sin TLS | `DATABASE_URL`, `DB_SSLMODE=require` | URL/credencial exclusiva y TLS |
| Cookie | no Secure, `lax` | Secure, `lax`, nombre staging | Secure, `lax`, nombre producción |
| CORS | `http://localhost:3000` | frontend staging HTTPS exacto | frontend producción HTTPS exacto |
| OpenAPI | habilitado | deshabilitado | deshabilitado |
| SMTP | opcional/controlado | credencial propia + override obligatorio | credencial propia + destinatario operativo |
| Frontend/API URLs | localhost | dominios staging | dominios producción |

Variables sensibles de backend: `DATABASE_URL` o `DB_PASSWORD`, `SMTP_USER`,
`SMTP_PASSWORD` y los datos internos del canal de correo. No deben existir en Netlify ni en
Git. Las variables `NEXT_PUBLIC_*` son públicas por definición.

## Qué tiene coste

- **Coste recurrente obligatorio:** Render Web Service y Render PostgreSQL del ambiente que
  se cree.
- **Puede generar coste:** Netlify según plan/uso, almacenamiento y retención adicionales,
  SMTP, monitor externo, logs de larga retención, tráfico y un segundo ambiente simultáneo.
- **Puede no añadir coste:** subdominios y TLS administrado si el dominio y el plan actuales
  lo permiten; debe verificarse con los proveedores.
- **Aún no asumido:** Fase 4B no creó cuentas, servicios, bases, sitios ni consumo cloud.

## Controles y rollback

- Conservar el último artefacto/commit sano y bloquear despliegues si CI o pre-deploy falla.
- Las migraciones son forward-only: antes de cambios destructivos, backup/PITR probado.
- Un rollback de aplicación sólo es seguro si la revisión anterior entiende el esquema
  vigente; comprobar compatibilidad antes de promover.
- Para un fallo del frontend, restaurar el deploy previo en el sitio correcto de Netlify.
- Para un fallo de API, restaurar la imagen/commit previo sin revertir a ciegas la base.
- Para pérdida/corrupción de datos, restaurar a una base nueva, validar y después planear el
  cambio de conexión. Nunca restaurar directamente encima de la base activa.

## Condición de salida futura

Staging sólo estará listo cuando el flujo público y el administrativo funcionen por HTTPS
en dominios reales, SMTP esté confinado al buzón de staging, migraciones y restore hayan
pasado, monitorización/backup estén comprobados y producción continúe intacta.

# Fase 4G — handoff de identidad

**Max owner account is NOT created yet. Create it during production provisioning with the owner bootstrap.**

Antes del primer acceso productivo, aplica `0006_access_management`, confirma que no exista otro owner y ejecuta `python -m app.scripts.create_owner` en una terminal segura. No copies una cuenta local, no inventes el correo y no coloques la contraseña en variables, comandos, tickets o logs. Después del login inicial, completa el cambio obligatorio y prueba una cuenta staff con permisos mínimos.

El catálogo Advisor no representa identidades autenticadas y no debe sincronizarse automáticamente con AdminUser.
