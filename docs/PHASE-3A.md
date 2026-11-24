# Fase 3A — autenticación y administración persistente

Rama: `phase-3-admin-auth`, creada desde `87174e2`. No se modifica Netlify ni producción.

## Autenticación

FastAPI es la autoridad. Un login válido crea un token aleatorio de 256 bits, enviado
solo en una cookie HttpOnly; PostgreSQL guarda únicamente su SHA-256. No hay JWT,
secretos de firma ni tokens en localStorage, sessionStorage o respuestas JSON.
La sesión expira de forma absoluta a las ocho horas por defecto (configurable 1–24).
Logout elimina la sesión de PostgreSQL y la cookie. Login rota la sesión del navegador.
Cada petición consulta el usuario actual: desactivar una cuenta o cambiar su rol tiene
efecto sobre sesiones existentes. Se limpian sesiones caducadas al iniciar sesión.

Contraseñas con Argon2id: 64 MiB, tres iteraciones, cuatro lanes, salt aleatorio de la
biblioteca. Rehash al iniciar sesión si cambian los parámetros. Referencia:
[argon2-cffi PasswordHasher](https://argon2-cffi.readthedocs.io/en/stable/api.html).
El CLI exige contraseñas de 12–128 caracteres, no las recorta y usa getpass con terminal
interactiva. No existe registro público ni cuentas predeterminadas.

Cookie `mhg_session`, host-only, Path=/api/v1, HttpOnly, SameSite=Lax por defecto.
`COOKIE_SECURE=true` con HTTPS. `COOKIE_SAMESITE=none` exige Secure. Login, logout y
escrituras autenticadas exigen Origin exacto de CORS_ORIGINS y X-MHG-Admin: 1.
La cabecera no es un secreto: junto con Origin estricto y el preflight impide envíos
CSRF desde formularios/orígenes ajenos. Las rutas públicas siguen públicas.
CORS usa orígenes explícitos, credentials=true y nunca wildcard. Respuestas API no-store.
No se registran contraseñas, cookies ni cuerpos con datos personales.

Límite de login compartido en PostgreSQL: cinco intentos por email y 30 por IP cada
15 minutos, incluidos los éxitos. Devuelve 429 y Retry-After. Se almacenan hashes de
los identificadores de esos contadores y se limpian al expirar. Tras un proxy hay que
configurar explícitamente los proxies confiables; nunca confiar en X-Forwarded-For
arbitrario. No es un sistema general antiabuso para los endpoints públicos.

## Tablas y migración

`0002_admin_auth`, posterior a `0001_core` (sin modificarla):

- admin_users: UUID, email único normalizado a minúsculas, password_hash, full_name,
  role (admin/staff), is_active, created_at, updated_at y last_login_at nullable.
  CHECK de rol y normalización; trigger updated_at.
- admin_sessions: token_hash PK, user_id FK CASCADE, created_at, expires_at;
  índices de usuario y expiración.
- auth_login_limits: clave hash PK, número de intentos y expiración indexada.

Roles guardados como texto con constraint: agregar otro exige migrar la constraint
y definir permisos, sin cambiar el mecanismo de sesiones. No hay edición de usuarios
desde el panel en esta fase. Crear staff usa el mismo CLI con --role staff.

## Permisos y endpoints

| Operación | Público | staff | admin |
| --- | --- | --- | --- |
| Propiedades publicadas; envíos de leads/cocina/citas | Sí | Sí | Sí |
| POST /auth/login; POST /auth/logout | Origin + cabecera | Sí | Sí |
| GET /auth/me | 401 | Cuenta propia | Cuenta propia |
| GET /admin/dashboard | 401 | Totales de leads/citas/cocinas | Todos los totales |
| GET /admin/properties | 401 | 403 | Sí, todos los estados |
| POST /properties; PATCH /properties/{id} | 401 | 403 | Crear/editar/publicar/archivar |
| GET /admin/leads, /admin/appointments, /admin/kitchen-configurations | 401 | Consulta | Consulta |
| GET /kitchen-configurations/{id} | 401 | Consulta | Consulta |
| PATCH /appointments/{id} | 401 | 403 | Transiciones válidas y campos permitidos |

Todas las rutas de la tabla llevan prefijo /api/v1. Las listas administrativas usan
limit (1–100, default 25) y offset. Las citas y cocinas incluyen leads relacionados;
las cocinas incluyen además sus citas asociadas. No hay borrado de configuraciones.
Se eligió staff de solo lectura por menor privilegio; no depende de ocultar botones.

## Arranque local (PowerShell)

Desde la raíz del repositorio, con Docker Desktop Linux operativo:

```powershell
cd backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Establecer DB_PASSWORD solo si se inicializa una base nueva.
# No cambiar la contraseña del .env de un volumen ya existente.
docker compose up --build -d
docker compose exec api alembic current
docker compose exec api alembic check
docker compose exec api python -m app.scripts.create_admin
# Solicita email, nombre y contraseña con confirmación sin mostrarla.
# Opcional: docker compose exec api python -m app.scripts.create_admin --role staff
Invoke-RestMethod http://localhost:8000/health
cd ../frontend
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm ci
npm run dev
```

Abrir manualmente http://localhost:3000/admin. Usar localhost en ambos extremos:
127.0.0.1 y localhost son hosts distintos para cookies y orígenes. `npm ci` solo es
necesario si faltan dependencias. Tras construir las imágenes, `docker compose up -d`
sigue funcionando sin flags adicionales. Para parar, `docker compose down` sin -v.

Variables backend: DB_* y puertos existentes; CORS_ORIGINS como JSON de orígenes
(local: ["http://localhost:3000"]), COOKIE_SECURE=false local, COOKIE_SAMESITE=lax,
SESSION_HOURS=8. ENABLE_ADMIN_ENDPOINTS ya no existe y no concede permisos.
Frontend: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1. Es una URL pública,
sin credenciales; queda incorporada al build de Next. Cambiarla exige reconstruir.
PROPERTY_REPOSITORY=local sigue por defecto para el catálogo público.

Para hosting futuro, preferir frontend y API HTTPS bajo subdominios del mismo sitio:
cookie host-only del backend, SameSite=Lax y CORS con origen del frontend. Para sitios
distintos se admite SameSite=None + Secure, pero algunos navegadores bloquean cookies
de terceros: antes de desplegar en esa topología debe decidirse dominio común o proxy
del mismo origen. No se configuró infraestructura ni un dominio productivo.

## Panel real

/admin/login inicia sesión y /admin consulta /auth/me antes de cargar datos.
La redirección al login es cliente: el HTML estático contiene solo el cascarón de carga,
nunca datos administrativos. El backend valida siempre la sesión y permisos.
Hay Dashboard, Propiedades, Leads, Citas y Configuraciones de cocina, con paginación,
loading, estados vacíos, errores de red, 401/403 y logout. Ninguna escritura se reintenta
automáticamente; tras un timeout comprobar la lista antes de repetir.

Propiedades guarda todos sus campos, referencias de imágenes y estados en PostgreSQL.
Los formularios usan estado local únicamente para la edición pendiente. Guardar vuelve
a consultar el servidor. Precios conservados como decimal textual; campos de identidad
y timestamps se excluyen de los payloads de escritura. No hay subida de imágenes.
Citas permite transiciones existentes, fecha confirmada y notas. La fecha del formulario
se convierte de hora local a ISO UTC. Cocinas son de solo lectura con materiales,
selecciones versionadas, clientes, ubicación, citas y timestamps.

El catálogo público continúa local por decisión de alcance; no basta con publicar en el
panel para actualizarlo. Falta activar su repositorio HTTP y definir revalidación/SEO.
Los formularios públicos y el customizador tampoco envían todavía a la API.

## Validaciones y comprobación manual

Cierre técnico del 9 de octubre de 2026:

- migración de desarrollo en `0002_admin_auth (head)` y `alembic check` limpio;
- downgrade de `0002_admin_auth` a `0001_core`, upgrade a head y check en `mhg_test`;
- 89 pruebas backend contra PostgreSQL real y 62 contratos backend locales;
- 38 pruebas frontend, TypeScript, ESLint, build Next.js y verificación HTTP de rutas;
- 415 hashes legacy de origen y 414 copias públicas verificados, con sintaxis JS válida;
- login, cookie, `/auth/me`, dashboard, propiedad draft/publicada, lecturas administrativas,
  persistencia de sesión y propiedad tras reiniciar db/api, logout y 401 posterior probados
  por HTTP real. Los datos y la cuenta temporal de validación fueron eliminados.

Comandos sin navegador:

```powershell
cd backend
docker compose --profile test run --build --rm tests
# Reversibilidad SOLO en mhg_test (elimina usuarios/sesiones de esa base descartable):
docker compose --profile test run --rm tests alembic downgrade 0001_core
docker compose --profile test run --rm tests alembic upgrade head
docker compose --profile test run --rm tests alembic check
cd ../frontend
npm test
npm run typecheck
npm run lint
npm run build
npm run verify:routes
```

Verificación manual pendiente del usuario:

1. Sin sesión: /admin lleva a /admin/login sin mostrar registros. Login incorrecto
   da error; login válido abre el panel. Recargar mantiene sesión. Logout la revoca.
2. admin: crear propiedad, editar precio/texto/galería, guardar, recargar; recorrer
   draft → published → archived. Slug duplicado debe mostrar conflicto sin perder el formulario.
3. Reiniciar frontend/backend y confirmar que siguen los datos. Revisar paginación,
   estados vacíos y errores cuando la API está detenida.
4. staff: puede consultar leads/citas/cocinas; no editar propiedades ni citas.
5. Leads muestran contactos y las tres asociaciones. Citas muestran cliente, sucursal,
   dirección/coordenadas; confirmar con fecha y completar. Comprobar hora local.
6. Cocinas muestran correctamente selecciones anidadas, extras, cliente y citas;
   no hay edición del snapshot original.
7. Probar móvil/teclado, campos requeridos, cierre de sesión y bloqueo por intentos.
   En DevTools comprobar HttpOnly y ausencia de tokens en localStorage/sessionStorage.
8. Regresión manual de landing/customizador (incluidos PDF y WhatsApp), sin cambios
   de archivos legacy en esta fase.

Pendiente: recuperación de contraseñas, MFA, gestión de usuarios en UI, auditoría de
cambios, resolución de ediciones simultáneas, antiabuso público, política de retención,
backups y despliegue. Actualmente prevalece la última edición válida de un registro.
No hay emails, mapas, notificaciones, OAuth ni servicios cloud.
