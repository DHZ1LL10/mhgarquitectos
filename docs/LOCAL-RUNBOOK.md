# MHG Arquitectos — runbook local

Esta guía arranca el release candidate local sin crear servicios externos. Los comandos
parten de la raíz del repositorio, salvo cuando se indica `cd`.

## A. Requisitos

- Docker Desktop con Docker Compose.
- Node.js 24 (la versión esperada está en `frontend/.nvmrc`).
- npm 11 o compatible con el `package-lock.json`.
- Git y PowerShell 7 en Windows.
- Python 3.13 sólo para desarrollo directo; la API normal corre en Docker.

Comprueba las herramientas:

```powershell
docker version
docker compose version
node --version
npm --version
```

## B. Configuración local

No copies valores desde otro ambiente ni subas archivos `.env`.

```powershell
if (-not (Test-Path backend\.env)) {
  Copy-Item backend\.env.example backend\.env
}
if (-not (Test-Path frontend\.env.local)) {
  Copy-Item frontend\.env.example frontend\.env.local
}
```

En `backend/.env`, reemplaza al menos `DB_PASSWORD`. Para correo real configura
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`,
`SMTP_USE_TLS` y `NOTIFICATION_EMAIL`. En local, `ENVIRONMENT` puede omitirse porque el
valor por defecto es `local`; `COOKIE_SECURE=false`, `COOKIE_SAMESITE=lax` y el origen
exacto `http://localhost:3000` son correctos sólo para este entorno.

En `frontend/.env.local`, usa:

```dotenv
SITE_URL=http://localhost:3000
PROPERTY_REPOSITORY=api
PROPERTY_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
CUSTOMIZER_API_BASE_URL=http://localhost:8000/api/v1
NEXT_TELEMETRY_DISABLED=1
```

`PROPERTY_REPOSITORY=api` mantiene landing, catálogo y administración sobre PostgreSQL.
`local` queda únicamente como fixture explícito para pruebas aisladas. Las demás URLs
locales mantienen el admin y el customizador contra la API Docker.

## C. Backend, PostgreSQL y migraciones

```powershell
cd backend
docker compose build api migrate
docker compose up -d db
docker compose run --rm migrate
docker compose up -d api
docker compose ps
Invoke-RestMethod http://localhost:8000/health
```

La respuesta debe ser `status=ok` y `database=ok`. Para verificar el estado de Alembic:

```powershell
docker compose run --rm migrate alembic current
docker compose run --rm migrate alembic check
```

La revisión vigente es `0005_service_folios (head)` y `check` no debe detectar operaciones.
Los datos viven en el volumen `mhg-core_postgres-data`; no uses `docker compose down -v`
salvo que quieras borrar deliberadamente la base local.

## D. Frontend

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev
```

`npm run dev` valida primero los assets legacy. Turbopack usa `unsafe-eval` únicamente en
desarrollo; los builds de staging y producción no lo incluyen.

## E. Crear un administrador

Con la API y la base activas:

```powershell
cd backend
docker compose exec api python -m app.scripts.create_admin
```

Introduce email, nombre y contraseña en los prompts. La contraseña no debe pasarse como
argumento ni guardarse en documentación. No existe registro público de administradores.

## F. URLs locales

| Recurso | URL |
| --- | --- |
| Landing | `http://localhost:3000/` |
| Propiedades | `http://localhost:3000/propiedades` |
| Customizador | `http://localhost:3000/cocina-customizer.html` |
| Login admin | `http://localhost:3000/admin/login` |
| API health | `http://localhost:8000/health` |
| OpenAPI local | `http://localhost:8000/docs` |

## F.1 Datos sintéticos para la demostración CRM

Con API y PostgreSQL activos, carga una vez los escenarios locales:

```powershell
cd backend
docker compose exec api python -m app.scripts.seed_admin_demo
```

El comando es idempotente y se niega a correr fuera de `ENVIRONMENT=local`. Conserva
registros existentes, no reinicia folios y no envía correo ni WhatsApp. Crea tres clientes,
tres citas y tres cocinas sintéticas enlazadas; también importa Mata Larga como publicada y
crea una propiedad borrador y una archivada. Los correos usan `example.com` y los teléfonos
sintéticos están bloqueados por el frontend para acciones externas.

## G. Detener y volver a iniciar

Detén Next con `Ctrl+C`. Para los contenedores:

```powershell
cd backend
docker compose stop
```

Reinicio posterior, conservando datos:

```powershell
cd backend
docker compose up -d db
docker compose run --rm migrate
docker compose up -d api
docker compose ps
```

No añadas `-v` a `down`: eliminaría el volumen PostgreSQL.

## H. SMTP local

SMTP es opcional para arrancar localmente, pero si falta la submission se guarda con
`notification_status=not_configured`. Para una entrega real usa una credencial dedicada y
un buzón controlado en `NOTIFICATION_EMAIL`; nunca una lista de clientes.

Tras una submission sintética comprueba únicamente el estado, sin imprimir destinatarios
ni credenciales:

```powershell
cd backend
docker compose exec -T db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select folio, notification_status, notification_attempts, notified_at from kitchen_submissions order by created_at desc limit 1;"'
```

`sent` confirma que el servidor SMTP aceptó el mensaje. La recepción en bandeja, su aspecto
HTML y los enlaces deben confirmarse además con la checklist manual.

## I. Backup y restore local seguro

Guarda backups fuera del repositorio:

```powershell
cd backend
$backupDir = Join-Path $env:USERPROFILE "MHG-private-backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir "mhg-$stamp.dump"
docker compose exec -T db sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --file=/tmp/mhg.dump'
docker compose cp db:/tmp/mhg.dump $backupFile
docker compose exec -T db sh -lc 'rm -f -- /tmp/mhg.dump'
Get-FileHash $backupFile -Algorithm SHA256
```

Ensaya el restore sólo en una base descartable con nombre nuevo:

```powershell
$drillDb = "mhg_restore_drill_$(Get-Date -Format 'yyyyMMddHHmmss')"
docker compose cp $backupFile db:/tmp/mhg-restore.dump
docker compose exec -T -e DRILL_DB=$drillDb db sh -lc 'createdb -U "$POSTGRES_USER" "$DRILL_DB"'
docker compose exec -T -e DRILL_DB=$drillDb db sh -lc 'pg_restore -U "$POSTGRES_USER" -d "$DRILL_DB" /tmp/mhg-restore.dump'
docker compose exec -T -e DRILL_DB=$drillDb db sh -lc 'psql -U "$POSTGRES_USER" -d "$DRILL_DB" -c "select version_num from alembic_version;"'
docker compose exec -T -e DRILL_DB=$drillDb db sh -lc 'psql -U "$POSTGRES_USER" -d "$DRILL_DB" -c "select count(*) from kitchen_submissions;"'
docker compose exec -T -e DRILL_DB=$drillDb db sh -lc 'dropdb -U "$POSTGRES_USER" --force "$DRILL_DB"'
docker compose exec -T db sh -lc 'rm -f -- /tmp/mhg-restore.dump'
```

Antes de `dropdb`, comprueba que `$drillDb` empieza exactamente por
`mhg_restore_drill_`. Nunca ejecutes `pg_restore` contra la base principal.

## J. Matriz automática

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check app migrations tests
.\.venv\Scripts\python.exe -m ruff format --check app migrations tests
.\.venv\Scripts\python.exe -m compileall -q app migrations tests
.\.venv\Scripts\python.exe -m pytest tests/test_contracts.py
docker compose --profile test run --rm tests
```

Frontend:

```powershell
cd frontend
npm test
npm run typecheck
npm run lint
npm run verify:legacy
npm run build
npm run verify:routes
```

El perfil `test` usa `mhg_test` sobre tmpfs y no modifica la base local principal.
