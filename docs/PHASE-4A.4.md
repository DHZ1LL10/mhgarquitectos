# Fase 4A.4 — preparación de provisioning de staging

Estado de esta entrega: definición y runbook solamente. No se han creado recursos, no se
ha desplegado, no se ha tocado DNS y no se ha modificado el sitio Netlify productivo.

## 1. Archivos de esta entrega

- `render.yaml`: Blueprint declarativo para un Web Service y PostgreSQL exclusivos de
  staging.
- `docs/PHASE-4A.4.md`: matriz de configuración, decisiones y procedimiento operativo.

No hace falta una rama nueva. `phase-4a-staging-hardening` queda como rama de despliegue
de staging durante 4A; cualquier rama permanente distinta se propondrá antes de crearla.

## 2. Arquitectura y Blueprint

```text
Internet
   |
   +-- HTTPS --> Netlify nuevo: frontend staging
   |                 |  fetch HTTPS + CORS exacto
   |                 v
   +----------> Render Web Service: mhg-api-staging
                         |  DATABASE_URL interna + TLS require
                         v
                  Render PostgreSQL: mhg-postgres-staging
                  (sin acceso externo, PITR administrado)
```

El Blueprint raíz `render.yaml` fija:

- API y base en `oregon`, evitando tráfico interregional;
- Docker con `backend/Dockerfile` y contexto `backend/`;
- proceso web en el puerto esperado `10000`, conservando `--no-proxy-headers`;
- health check `GET /health`, que también verifica `SELECT 1`;
- plan API `0.5c-512mb` y PostgreSQL `0.1c-256mb`, PostgreSQL 17 y disco de 1 GB;
- PostgreSQL sin acceso público (`ipAllowList: []`) y conexión privada inyectada por
  Render;
- previews desactivados y autodeploy sólo desde `phase-4a-staging-hardening`, después de
  que pasen los checks de CI (`autoDeployTrigger: checksPass`);
- migraciones como pre-deploy y no como parte del arranque del servidor.

Render documenta que `dockerfilePath` y `dockerContext` son relativos a la raíz del repo,
que `checksPass` espera a CI y que `preDeployCommand` es el mecanismo recomendado para
migraciones. Referencias: [Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
y [Deploying on Render](https://render.com/docs/deploys).

## 3. Variables exactas de Render

### Versionadas en el Blueprint

| Variable | Valor |
| --- | --- |
| `ENVIRONMENT` | `staging` |
| `DB_SSLMODE` | `require` |
| `DB_POOL_SIZE` | `5` |
| `DB_MAX_OVERFLOW` | `5` |
| `DB_POOL_TIMEOUT_SECONDS` | `10` |
| `DB_POOL_RECYCLE_SECONDS` | `1800` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `COOKIE_NAME` | `mhg_staging_session` |
| `SESSION_HOURS` | `8` |
| `OPENAPI_ENABLED` | `false` |
| `MAX_REQUEST_BODY_BYTES` | `1048576` (1 MiB) |
| `TRUST_PROXY` | `false` |
| `TRUSTED_PROXY_CIDRS` | `[]` |
| `PUBLIC_RATE_LIMIT_ENABLED` | `true` |
| `PUBLIC_RATE_LIMIT_WINDOW_SECONDS` | `900` |
| `PUBLIC_RATE_LIMIT_KITCHEN_SUBMISSIONS` | `10` |
| `PUBLIC_RATE_LIMIT_LEADS` | `20` |
| `PUBLIC_RATE_LIMIT_APPOINTMENTS` | `10` |
| `PUBLIC_RATE_LIMIT_KITCHEN_CONFIGURATIONS` | `10` |
| `LOG_LEVEL` | `INFO` |
| `SMTP_PORT` | `587` |
| `SMTP_USE_TLS` | `true` |

### Inyectada automáticamente

| Variable | Origen |
| --- | --- |
| `DATABASE_URL` | `mhg-postgres-staging.connectionString`, URL interna generada por Render |

La aplicación agrega `sslmode=require` mediante `DB_SSLMODE`. Render admite TLS en la
red privada con certificado autofirmado para este modo. No se copian credenciales de base
de datos al repositorio ni al frontend. Referencia: [conexiones de Render Postgres](https://render.com/docs/postgresql-creating-connecting).

### Introducidas manualmente al crear el Blueprint (`sync: false`)

| Variable | Valor que debe introducirse | Clasificación |
| --- | --- | --- |
| `CORS_ORIGINS` | JSON con un único origen exacto, por ejemplo `["https://sitio-staging.netlify.app"]` | configuración pública |
| `SMTP_HOST` | host del proveedor SMTP de staging | configuración sensible |
| `SMTP_USER` | usuario SMTP exclusivo de staging | secreto |
| `SMTP_PASSWORD` | contraseña/token SMTP exclusivo de staging | secreto |
| `SMTP_FROM` | remitente autorizado de staging | configuración sensible |
| `STAGING_EMAIL_OVERRIDE` | buzón interno único que recibirá todas las pruebas | dato interno sensible |

`NOTIFICATION_EMAIL` se omite deliberadamente: en staging el destinatario efectivo es
siempre `STAGING_EMAIL_OVERRIDE`. Render sólo solicita valores `sync: false` en la creación
inicial; cambios posteriores se hacen en el gestor de entorno del servicio.

## 4. Variables exactas del nuevo sitio Netlify

Configurar únicamente en el contexto **Production** del sitio nuevo de staging. En un
sitio Netlify, “Production” significa su URL principal y no el sitio productivo actual de
MHG.

| Variable | Valor |
| --- | --- |
| `SITE_URL` | `https://<sitio-staging>.netlify.app` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<api-staging>.onrender.com/api/v1` |
| `CUSTOMIZER_API_BASE_URL` | `https://<api-staging>.onrender.com/api/v1` |
| `PROPERTY_REPOSITORY` | `local` |
| `PROPERTY_API_BASE_URL` | `https://<api-staging>.onrender.com/api/v1` |
| `NEXT_TELEMETRY_DISABLED` | `1` (ya está también en `netlify.toml`) |

Ninguna es secreta: `NEXT_PUBLIC_API_BASE_URL` se entrega al navegador y las restantes
son URLs o selección de comportamiento. El sitio nuevo usa base directory `frontend`,
build `npm run build` y publish `.next` conforme a `frontend/netlify.toml`. Sus headers
mantienen `X-Robots-Tag: noindex, nofollow` y las protecciones ya aprobadas.

No definir esas URLs en los contextos **Deploy Previews** ni **Branch deploys**. Desactivar
Deploy Previews para este sitio en Netlify; aunque alguien los active después, no agregar
sus orígenes a CORS. Así ningún preview tendrá acceso al API administrativo.

## 5. Secretos y separación de entornos

- Secretos: `DATABASE_URL`/credenciales PostgreSQL generadas, `SMTP_USER` y
  `SMTP_PASSWORD`.
- Datos internos sensibles tratados como secretos operativos: `STAGING_EMAIL_OVERRIDE`,
  `SMTP_FROM` y `SMTP_HOST`.
- Configuración pública no secreta: CORS exacto, flags, límites, nombres de cookie y URLs
  públicas.
- Netlify no recibe secretos de backend. No se copia `.env` local.
- Las credenciales SMTP deben ser exclusivas de staging, de alcance mínimo y rotables.
- El Blueprint no genera ni siembra administradores. La contraseña del primer admin sólo
  se escribe en una terminal interactiva de Render.

## 6. Migraciones y primer administrador

Cada deploy candidato ejecuta una sola instancia de pre-deploy, separada del proceso web:

```sh
alembic upgrade head && alembic current && alembic check
```

Si cualquier comando falla, no se activa el nuevo build. No hay downgrade automático.
`upgrade head` es idempotente, `current` deja evidencia en el log y `check` detecta cambios
de modelos sin migración. Render serializa los deploys de un servicio; no se ejecutan
migraciones desde `CMD` ni desde cada réplica.

Después del primer despliegue exitoso, abrir una Shell interactiva del Web Service y
ejecutar:

```sh
python -m app.scripts.create_admin
```

Introducir email, nombre y contraseña sólo en sus prompts. No pasar contraseña como
argumento, no capturarla en logs y no crear usuarios por seed. El script rechaza stdin no
interactivo para proteger esta regla.

## 7. Cookies, CORS y CSRF

Con los dominios temporales, `*.netlify.app` y `*.onrender.com` son sitios distintos. Un
`fetch` administrativo con credenciales es cross-site; una cookie `SameSite=Lax` no se
envía en esas peticiones XHR/fetch. Además, algunos navegadores bloquean cookies de
terceros. CORS exacto y `allow_credentials` no cambian esa regla. Resultado esperado:

- `/health` y el envío público del customizador funcionan (el público usa
  `credentials: omit`);
- el login puede responder, pero la sesión HttpOnly no será utilizable de forma fiable en
  las llamadas administrativas siguientes;
- no se cambiará silenciosamente a `SameSite=None`.

Con `https://staging.mhgarquitectos.com` y
`https://api-staging.mhgarquitectos.com`, ambos orígenes son distintos pero pertenecen al
mismo site HTTPS registrable. `Secure; HttpOnly; SameSite=Lax`, cookie host-only en la API,
CORS exacto y el guard CSRF (`Origin` exacto más `X-MHG-Admin: 1`) funcionan juntos.

**Decisión:** usar primero URLs temporales sólo para validar provisioning, health,
migraciones, formulario público y SMTP. Para declarar el flujo completo listo —incluido
login/admin— se requieren los dos subdominios reales. Configurarlos será un paso separado
y manual después de autorización explícita de DNS.

## 8. Proxy e impacto en rate limiting

Render termina HTTPS y reenvía tráfico al contenedor. Existe evidencia pública de uso de
`X-Forwarded-For`, pero la documentación oficial consultada no publica una lista estable
de CIDR del peer inmediato que permita satisfacer el modelo de confianza de la aplicación.
Por eso el primer staging conserva:

```text
TRUST_PROXY=false
TRUSTED_PROXY_CIDRS=[]
uvicorn --no-proxy-headers
```

Efecto: el rate limiting agrupa peticiones por la IP del proxy vista por el contenedor, no
por el cliente final. Es seguro frente a spoofing, pero puede producir límites compartidos
y falsos 429 bajo concurrencia. No se debilita la validación; antes de producción habrá que
obtener de Render una garantía verificable de la cadena y de los peers confiables, o mover
el control de borde a una capa que entregue una identidad de cliente autenticable.

## 9. SMTP, observabilidad y backups

En staging, configurar SMTP obliga a definir `STAGING_EMAIL_OVERRIDE`; el backend reemplaza
el destinatario de toda solicitud con ese buzón interno. La prueba previa al go-live debe
confirmar en el registro de notificaciones que el estado sea `sent` y que ningún correo de
cliente haya sido destinatario.

Observabilidad inicial:

- logs actuales en stdout con timestamp, nivel, logger, request ID, método, ruta, status y
  duración;
- `X-Request-ID` en respuestas;
- `/health` comprueba aplicación y base;
- logs, métricas básicas y eventos de deploy en Render; logs/builds en Netlify.

Después del primer staging se puede conectar un monitor HTTPS externo a `/health`; no se
añade aún una plataforma de observabilidad.

La base pagada tiene backup continuo/PITR administrado. En workspace Hobby la ventana es
de 3 días (7 en Pro o superior); restaurar crea otra instancia para validarla antes del
cambio. Tras crearla, abrir **PostgreSQL > Recovery**, comprobar que aparece la ventana de
PITR y registrar una captura/fecha de la verificación. No ejecutar una restauración sobre
la base activa. La exportación portable y su restore drill quedan para la siguiente
subfase. Referencia: [Render Postgres Recovery and Backups](https://render.com/docs/postgresql-backups).

## 10. Coste mensual estimado

Estimación a 9 de octubre de 2026, antes de impuestos y extras:

| Componente | Plan | Estimado |
| --- | --- | ---: |
| Render Web Service | `0.5c-512mb` | USD 7/mes |
| Render PostgreSQL | `0.1c-256mb`, 1 GB | USD 6/mes |
| Netlify staging | Free, dentro de 300 créditos/mes | USD 0/mes |
| DNS/HTTPS | subdominios y certificados administrados | USD 0 adicional |
| **Base esperada** | | **USD 13/mes** |

Render publica esos precios y 1 GB incluido en [Pricing](https://render.com/pricing).
Netlify Free publica USD 0 y 300 créditos/mes en [Netlify Pricing](https://www.netlify.com/pricing/).
Tráfico, builds o uso superior al incluido, un plan Netlify Personal (USD 9/mes), mayor
disco, workspace Render Pro o un segundo entorno incrementarían el total.

## 11. Pasos manuales después de aprobación

1. Confirmar que el commit aprobado tiene todos los checks GitHub en verde.
2. En Render, conectar el repositorio y crear un Blueprint desde `render.yaml` en la rama
   `phase-4a-staging-hardening`; revisar el resumen de coste antes de confirmar.
3. Introducir los seis valores `sync: false` sin pegarlos en issues, commits o capturas.
   Para el primer pase, usar como CORS la URL exacta que tendrá el nuevo Netlify staging.
4. Confirmar que PostgreSQL muestra `ipAllowList` vacía, API/base están en Oregon y
   `DATABASE_URL` referencia la conexión interna. No copiar la URL externa.
5. Crear un sitio Netlify **nuevo** desde el mismo repo, seleccionar base `frontend`, rama
   de producción `phase-4a-staging-hardening` y desactivar Deploy Previews/branch deploys.
6. Cargar las variables Netlify sólo en contexto Production, con las URLs temporales
   exactas. Verificar visualmente que el site ID/nombre no corresponde al productivo.
7. Si la URL final generada de Netlify difiere de la prevista, actualizar `CORS_ORIGINS`
   en Render con un array JSON de ese único origen y redesplegar la API.
8. Revisar el pre-deploy: `upgrade head`, revisión vigente en `current` y `check` sin
   operaciones pendientes. Luego comprobar `/health` por HTTPS.
9. Abrir Render Shell, ejecutar `python -m app.scripts.create_admin` y guardar la
   credencial en el gestor de contraseñas del equipo.
10. Enviar una solicitud pública sintética; verificar persistencia, folio, email sólo al
    override y logs sin secretos. No usar datos de un cliente real.
11. Confirmar PITR en la pestaña Recovery y métricas/logs básicos.
12. Solicitar aprobación separada para DNS. Sólo después configurar ambos subdominios,
    cambiar CORS/URLs y validar login, logout, CSRF y panel administrativo.

## 12. Riesgos antes del primer deploy

| Riesgo | Control / condición |
| --- | --- |
| Auth no funciona entre dominios temporales | Esperado; no declarar staging listo hasta usar subdominios same-site |
| Rate limit agrupa clientes detrás del proxy | Mantener `TRUST_PROXY=false`; probar carga baja y resolver antes de producción |
| Un secreto entra a Git o Netlify | `sync: false`, scanner CI y secretos sólo en Render |
| SMTP envía a clientes | Credencial propia + override obligatorio + prueba sintética |
| Migración incompatible bloquea deploy | Pre-deploy fail-closed; backup/PITR y migraciones sólo hacia adelante |
| Plan DB pequeño agota RAM/conexiones/disco | Pool acotado, métricas; escalar tras evidencia, no por anticipación |
| Un preview alcanza admin | Previews desactivados, sin variables y fuera de CORS |
| Se modifica producción por error | Sitio Netlify nuevo y verificación de identidad antes de cada cambio manual |
| Coste o consumo inesperado | Planes fijados, autoscaling de storage apagado y revisión de billing |
| Dependencia de dos proveedores | Runbook y Blueprint; export/restore portable en la siguiente subfase |

## Criterio de aprobación para iniciar provisioning

- CI verde en el commit que contiene esta entrega.
- Blueprint revisado sin secretos y coste aceptado.
- URL/nombre previstos del sitio Netlify nuevo y buzón override identificados.
- Credenciales SMTP de staging disponibles fuera de Git.
- Aceptación explícita de que el pase con dominios temporales no valida auth.
- Autorización explícita del usuario antes de pulsar Create/Deploy o modificar DNS.
