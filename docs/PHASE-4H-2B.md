# Fase 4H.2B — CMS de proyectos y media

Implementación local. No implica publicación ni configuración remota. El backend sigue siendo un monolito modular FastAPI. No se migran físicamente las fotografías legacy.

## Arquitectura y datos

```text
Admin Next.js → sesión + Origin/X-MHG-Admin → FastAPI → PostgreSQL
                                             ↓
                                      Cloudinary SDK (servidor)
Landing /proyectos → API summary → portada + contador
Abrir modal → API detail → galería bajo demanda
Legacy /img/portfolio/* + nuevas URLs Cloudinary → misma galería
```

Migración `0007_managed_projects`, posterior a `0006_access_management`:

- `projects`: UUID, nombre, slug único estable, categoría, descripciones, estado, destacado y posición, timestamps.
- `project_images`: FK con cascade, provider, public_id privado, secure_url, dimensiones, formato, bytes, alt, portada, orden, timestamps.
- `property_images`: adición de provider (default local), public_id, format y bytes. No se recrean imágenes ni propiedades.
- `media_cleanup`: outbox de identificadores cloud pendientes de eliminación física.
- CHECK de categoría/estado y posición destacada 1–9 no nula. Índice único parcial por categoría/posición destacada; máximo nueve, incluidos borradores reservados. Índice único parcial de portada por proyecto. Las operaciones bajo bloqueo de fila mantienen una portada cuando hay imágenes.

El downgrade elimina únicamente estructuras nuevas; es destructivo para los proyectos/media nuevos. Sólo se probó sobre PostgreSQL efímero de QA. Para rollback de staging con datos, preferir rollback de aplicación compatible y conservar el esquema; respaldar antes de cualquier downgrade.

## API

Todas las rutas siguientes llevan `/api/v1`:

| Método/ruta | Contrato |
| --- | --- |
| GET `/projects?featured=true&category=kitchen_furniture&limit=100&offset=0` | Sólo publicados, summaries con portada y contador; sin description completa ni images |
| GET `/projects/{slug}` | Detalle publicado con galería completa |
| GET `/admin/projects` | Summaries administrativos |
| GET `/admin/projects/{id}` | Detalle administrativo |
| POST `/admin/projects` | Crear; slug calculado, no editable en Admin |
| PATCH `/admin/projects/{id}` | Guardar formulario completo, publicar/despublicar, categoría y destacados |
| POST `/admin/media/{projects\|properties}/{id}/upload` | Un archivo multipart `file` por request |
| POST `/admin/media/{projects\|properties}/{id}/images/{image_id}/cover` | Cambiar portada conservando imágenes e IDs |
| POST `/admin/media/{projects\|properties}/{id}/images/{image_id}/remove` | Quitar exactamente una referencia y encolar limpieza cloud |

Nuevo permiso `projects.manage`, con acceso owner implícito y asignación explícita a staff. Se consulta en cada request, incluyendo uploads. Propiedades conserva `properties.manage` y exige además `properties.publish` para modificar una propiedad publicada. Sesiones revocables, cambio de contraseña obligatorio y CSRF existentes permanecen activos. No hay uploads públicos ni unsigned presets.

Las operaciones registran eventos de creación, edición, publicación/despublicación, upload, portada y eliminación en el audit log existente. Los errores no exponen respuestas del proveedor ni credenciales.

## Resolución de hallazgos de auditoría

1. **Rate limit de uploads:** bucket `admin-media` por usuario, persistido y bloqueado en PostgreSQL: 120 imágenes/900 segundos, configurable. Incluye intentos fallidos después de autorizar. Responde 429 con Retry-After. No se consumen buckets de leads/citas/configurador ni se desactiva su limitación. Upload multipart tiene límite de cuerpo específico (archivo + 64 KiB de overhead); las demás rutas mantienen el límite global anterior. Se autorizan usuario, permiso y entidad antes de invocar al proveedor.
2. **Galería incremental de Propiedades:** editar campos no envía `images`; upload añade, remove quita un ID y cover reordena preservando IDs. Una petición PATCH con `images` se rechaza salvo `replace_images=true` explícito. El Admin nunca utiliza reemplazo completo. Legacy y Cloudinary conviven. No se modifica Mata Larga al arrancar ni se ejecutan seeds automáticamente.
3. **Payload público:** landing solicita sólo destacados (9+4 tras bootstrap); catálogo solicita summaries (20+4). SQL obtiene portadas y conteos en lotes, sin cargar todas las imágenes. La frontera RSC aplica whitelist adicional. El Client Component no importa el catálogo legacy en runtime. El modal solicita detail al abrirse; mantiene tabs, teclado, foco, scroll lock y layout previo.

## Cloudinary y fallos

- Provider abstraído con SDK Python. Secretos únicamente en backend. Los tests usan fake/mock, nunca Cloudinary real.
- Límite default 8 MiB por archivo, validación Pillow del contenido JPEG/PNG/WebP, MIME coherente, imagen estática y máximo 40 megapíxeles. No se aceptan URLs como uploads.
- Identificadores generados en servidor: `CLOUDINARY_FOLDER/projects/{slug}/{uuid}` o `.../properties/{slug}/{uuid}`; sin nombres de archivo del cliente ni overwrite.
- Si falla la escritura DB después del upload, se intenta compensar eliminando el objeto cloud. Si esa limpieza falla, se encola su identificador. Si la propia DB está indisponible también, se registra un aviso seguro y se requiere reconciliación operativa.
- Quitar una imagen confirma primero la eliminación de su referencia DB. `python -m app.scripts.cleanup_media` procesa la outbox: sólo su prefijo de entorno, sin referencias activas, y nunca archivos locales. Reintentos seguros; tareas fallidas permanecen pendientes. El comando se ejecuta explícitamente, no al arrancar.
- Un timeout durante la transferencia puede dejar un objeto sin respuesta confirmada; revisar objetos huérfanos del prefijo correspondiente antes de borrar cualquier objeto ambiguo. No se implementa limpieza masiva automática.
- Delivery Cloudinary: `f_auto,q_auto,c_limit,w_*` para cards, thumbnails y galería; tamaños responsive mediante loader de Next/Image, sin segunda optimización Next para cloud. Legacy conserva Next/Image y sus 381 derivados originales. Preload limitado a vecinos; thumbnails lazy.

## Bootstrap controlado

Fuente: `frontend/src/data/portfolio.ts` y su manifest vigente, congelados en `backend/app/projects/legacy_catalog.json`. Test cruzado compara descripciones, orden, portadas, categorías y destacados con la fuente original.

`python -m app.scripts.seed_projects` es una transacción explícita y aditiva, permitida en cualquier entorno configurado. Verifica 24 slugs, 381 rutas únicas, categorías 20+4, selección 9+4 y una portada por proyecto. Busca por slug, crea los ausentes y **omite** los existentes para conservar ediciones posteriores del Admin. Segundo recorrido: created=0, updated=0, skipped=24. No crea usuarios, leads, citas, propiedades ni datos demo. No modifica imágenes físicas.

En una importación parcial con posiciones destacadas ya ocupadas por otros proyectos, el índice único aborta la transacción; resolver el conflicto en Admin, sin borrar datos automáticamente.

## Experiencia Admin

`/admin/proyectos`: búsqueda, categoría, portada, contador y estado; crear y editar. Formulario con nombre, categoría, resumen, descripción, borrador/publicado, destacado y orden 1–9 por categoría. Para intercambiar una posición ocupada, primero desmarcar el proyecto que la reserva. Slug estable generado automáticamente.

Editor media reutilizado por proyectos y propiedades: selección múltiple, envío secuencial, estado por archivo, aviso de fallo y conservación de cargas ya confirmadas. Se detiene al primer fallo; no reintenta escrituras inciertas. Portada y quitar foto son operaciones inmediatas; quitar requiere confirmación. Guardar los campos comerciales no reemplaza la galería. El usuario no introduce URLs, dimensiones ni IDs del proveedor.

Propiedades mantiene secciones Información/Ubicación/Características/Precio/Publicación. Se guarda primero el borrador y después se añaden fotografías. El slug se genera desde el título al crear y se conserva al editar. La galería actual se usa al validar publicación.

## Variables exactas

Backend (Render staging, configuración manual por el operador; no aplicada en esta fase):

| Variable | Valor/clasificación |
| --- | --- |
| CLOUDINARY_CLOUD_NAME | Nombre real del cloud; no secreto, sólo se configura en backend |
| CLOUDINARY_API_KEY | Secret, sólo backend |
| CLOUDINARY_API_SECRET | Secret, sólo backend |
| CLOUDINARY_FOLDER | `mhg/staging` (producción futura: `mhg/production`) |
| MEDIA_MAX_FILE_BYTES | `8388608` |
| MEDIA_UPLOAD_LIMIT | `120` |
| MEDIA_UPLOAD_WINDOW_SECONDS | `900` |

Sin las tres credenciales, la API y el catálogo funcionan, pero uploads responde 503. Configuración parcial se rechaza. Con Cloudinary configurado en staging/production, el folder debe terminar en `/staging` o `/production` respectivamente. Mantener DATABASE_URL, DB_SSLMODE, cookies, CORS y SMTP ya definidos en el handoff; no introducir credenciales cloud en frontend.

Netlify staging (mismas variables públicas/server-build existentes):

```text
DEPLOYMENT_ENV=staging
SITE_URL=https://staging.mhgarquitectos.com
PROPERTY_REPOSITORY=api
PROPERTY_API_BASE_URL=https://api-staging.mhgarquitectos.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api-staging.mhgarquitectos.com/api/v1
CUSTOMIZER_API_BASE_URL=https://api-staging.mhgarquitectos.com/api/v1
```

Únicamente NEXT_PUBLIC_API_BASE_URL cruza al cliente. DEPLOYMENT_ENV y validaciones estrictas siguen server/build-only. No hay variables Cloudinary NEXT_PUBLIC. Las rutas públicas de las imágenes cloud no son secretos.

## Comandos de staging — sólo para ejecutar después de autorizar el despliegue

1. Respaldar PostgreSQL staging y configurar las variables backend anteriores.
2. Desplegar primero backend. El predeploy existente ejecuta `python -m app.scripts.render_predeploy` (upgrade/current/check). Verificar head `0007_managed_projects`.
3. En Render Shell del backend staging:

```sh
python -m app.scripts.seed_projects
python -m app.scripts.seed_projects
alembic current
alembic check
```

4. Esperar respectivamente created=24/skipped=0 y created=0/skipped=24 para una DB sin proyectos. Comprobar API pública 24 summaries, 13 destacados y detail con imágenes.
5. Desplegar frontend compatible después del bootstrap. Durante el intervalo evitar editar propiedades desde el Admin anterior: enviaba `images` y la API nueva exige reemplazo explícito. Mantener noindex en staging. Probar landing, `/proyectos`, permisos staff, crear borrador, upload real, portada y eliminar una imagen de prueba desde Admin.
6. Cuando corresponda limpiar objetos cloud ya retirados: `python -m app.scripts.cleanup_media` en el mismo entorno. No ejecutar seeds demo ni volver a reconciliar Mata Larga para este cambio.

## Validación y límites

La suite backend incluye PostgreSQL real en Docker, bootstrap/idempotencia, constraints, permisos hot owner/staff, CSRF, presupuesto independiente, upload fake y compensación, galería incremental y regresiones Mata Larga existentes. Frontend incluye manifiesto 381, summaries sin galerías, loader local/cloud, transporte multipart y contratos de las pantallas y modal.

Validación realizada el 20 de noviembre de 2026:

- Pytest completo en Docker/PostgreSQL: **152 passed**, una advertencia de deprecación httpx/Starlette; sin skips.
- Ruff, format check y compileall: correctos.
- Alembic upgrade/downgrade a 0006/upgrade/current/check: head 0007, sin nuevas operaciones.
- Frontend: **116 tests**, typecheck, lint y build con las variables explícitas de staging: correctos.
- verify:legacy: **415 hashes originales y 415 copias públicas** intactos; además los tests verifican los **381 derivados de portfolio**.
- verify:routes sobre el build, con runtime local apuntando a API/PostgreSQL de QA: 23 rutas 200, 404 esperados, sitemap, noindex, 45 assets representativos y Next/Image correctos. Landing y catálogo excluyen imágenes no-portada también en el HTML/RSC.
- API de QA: 24 proyectos, 20+4, 381 imágenes, destacados 9+4; bootstrap CLI created=24 y luego skipped=24.
- Secret scan existente y git diff --check: correctos. Ninguna escritura en servicios remotos.

Pendientes operativos: credenciales y prueba real Cloudinary, QA visual de los nuevos formularios/modal en staging, monitorear cuota/coste del proveedor y programar limpieza si se desea. Los tests con mocks y contratos no se presentan como QA visual manual ni como comprobación de una cuenta Cloudinary real.
