# Fase 4G — Usuarios, permisos y asignación de asesor

## Alcance

Fase 4G incorpora una selección comercial obligatoria de asesor al flujo de cocinas y convierte el acceso administrativo simple en autorización por permisos. Advisor y AdminUser son conceptos deliberadamente independientes: el catálogo comercial no crea ni sincroniza cuentas del CRM.

No forma parte de esta fase desplegar, crear cuentas reales, configurar DNS ni modificar producción.

## Catálogo Advisor

La fuente frontend es `public/advisor-catalog.js` y contiene exactamente:

- Cotización en línea
- Arq. Max Herrera
- Arq. Marco Rodriguez
- Arq. Daniel Aguilar
- Arq. Monse Galicia
- Arq. Itzel Suarez
- Lic. Alma Altamirano

El placeholder no es válido. La selección se conserva en el draft de `sessionStorage` y se propaga al payload, PostgreSQL, resumen, PDF, WhatsApp, correo SMTP y vistas administrativas. El backend mantiene una allowlist equivalente como frontera de confianza; no acepta nombres arbitrarios.

## Modelo de acceso

Antes existían roles `admin` y `staff`. Después de la migración existen:

- `owner`: único, siempre activo, acceso total y única persona que administra cuentas.
- `staff`: acceso exclusivamente mediante la allowlist de permisos.

Permisos estables:

- `dashboard.view`
- `clients.view`, `clients.manage`
- `appointments.view`, `appointments.manage`
- `kitchens.view`
- `properties.view`, `properties.manage`, `properties.publish`

Los permisos de gestión requieren el permiso de lectura correspondiente. Publicar requiere lectura y edición. El backend valida estas dependencias y el frontend las representa con controles dependientes.

Los presets Recepción, Comercial y Operaciones son atajos visuales, no roles persistidos. Ninguno concede Propiedades automáticamente.

## Migración

`0006_access_management` agrega `permissions` JSONB, `must_change_password`, la tabla `admin_audit_events`, restricciones de rol/owner activo y un índice parcial único para impedir un segundo owner.

Para conservar acceso local, el usuario `admin` activo más antiguo se convierte en `owner`; otros `admin` pasan a `staff` con permisos equivalentes completos. Los `staff` históricos reciben permisos de lectura compatibles. La migración no crea personas, correos ni credenciales y no asume que el owner migrado sea Max.

## Ciclo de contraseñas y sesiones

Las contraseñas siguen usando Argon2id. Las cuentas staff nuevas y los resets quedan con `must_change_password=true`. Después del login sólo pueden consultar `/auth/me`, cerrar sesión o cambiar contraseña. El cambio valida la contraseña actual, quita el flag y revoca las demás sesiones. Un reset del owner revoca todas las sesiones del staff; desactivar también las revoca e impide nuevos logins.

Las contraseñas temporales viajan sólo en la solicitud de creación/reset y permanecen momentáneamente en memoria de la UI para copiarse. No aparecen en respuestas, auditoría, logs ni almacenamiento del navegador.

Las sesiones conservan tokens opacos en cookie HttpOnly y hashes SHA-256 en PostgreSQL. Cada request vuelve a cargar el usuario desde la base; por eso los cambios de permisos son efectivos de inmediato sin almacenar permisos en la sesión.

## Autorización

`require_permission` aplica la autorización en backend. Owner hace bypass; staff necesita el permiso exacto. El sidebar y las vistas también se adaptan, pero son sólo UX: los endpoints devuelven 403 para acceso insuficiente. El dashboard consulta y devuelve únicamente métricas de módulos autorizados.

`properties.manage` permite crear/editar borradores. Cualquier creación, transición o edición de una propiedad publicada exige además `properties.publish`.

## Administración de usuarios

`/admin/usuarios` es owner-only e incluye listado, creación, edición de identidad/permisos/estado, reset de contraseña y estados de acceso. El owner se muestra protegido: no puede desactivarse, editarse, eliminarse ni reemplazarse desde estas rutas. No existe endpoint ordinario de eliminación ni promoción staff → owner.

## Auditoría mínima

`AdminAuditEvent` guarda actor real, acción, tipo/id de entidad, metadata acotada y timestamp. Registra eventos críticos de usuarios, leads, citas y propiedades. La metadata está limitada a 4 KiB y rechaza de forma recursiva claves de password, token, cookie o secret. La consulta reciente es owner-only; no se creó una UI extensa.

## Bootstrap de owner

Después de migrar una base nueva sin owner:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.scripts.create_owner
```

El comando exige una terminal interactiva, nombre, correo y contraseña inicial de al menos 12 caracteres; normaliza el correo, usa Argon2id, fuerza cambio en el primer login y falla si ya existe owner. No acepta passwords por argumentos ni las vuelve a imprimir.

**Max owner account is NOT created yet. Create it during production provisioning with the owner bootstrap.**

## Final PostgreSQL QA

QA ejecutado el 27 de octubre de 2026 contra PostgreSQL 17.11 en Docker, usando la
base local persistente y `mhg_test` descartable sobre `tmpfs`. La base local pasó de
`0005_service_folios` a `0006_access_management`; su único `admin` activo
preexistente se convirtió en `owner`, sin crear usuarios, y la sesión existente se
conservó. `alembic current` quedó en `0006_access_management (head)` y `alembic
check` no reporta operaciones pendientes.

En `mhg_test` se validó la selección determinística con tres cuentas sintéticas: se
promovió el `admin` activo más antiguo ordenando por `created_at, id`; el `admin`
activo posterior y el inactivo quedaron como `staff`. PostgreSQL rechazó físicamente
un segundo owner y la desactivación del owner. El ciclo real
`0006 -> 0005 -> 0006` terminó correctamente y preservó usuarios y sesiones.
El downgrade elimina, por diseño, auditoría, `permissions` y
`must_change_password`; además no puede reconstruir cuáles cuentas `staff` eran
`admin` antes del primer upgrade. Por tanto, un rollback de producción requiere
restaurar el backup previo si debe conservarse exactamente esa semántica.

El QA detectó y corrigió una divergencia de metadata: el índice parcial
`uq_admin_single_owner` existía en la migración pero no estaba declarado en el modelo
SQLAlchemy, por lo que `alembic check` proponía eliminarlo. Modelo y migración ahora
describen la misma protección y existe una prueba de regresión.

La matriz verificada con API real fue:

| Escenario staff | Resultado |
| --- | --- |
| Login con temporal | Permitido; `must_change_password=true` |
| CRM antes del cambio | 403; sólo `me`, cambio y logout |
| Password actual incorrecta o nueva menor a 12 | Rechazo |
| Password válida | Argon2id actualizado; temporal anterior rechazada |
| Módulo sin permiso con sesión válida | 403 |
| Permiso modificado | Efectivo en la siguiente request |
| Desactivación o reset | Sesiones revocadas |
| `properties.manage` sin `properties.publish` | Draft editable; publicación 403 |
| Owner | Acceso efectivo total; no editable/desactivable por API ordinaria |

Resultados finales: 125 pruebas backend sobre PostgreSQL, 97 pruebas frontend,
Ruff, formato, compileall, typecheck, lint, build, verificación de 415 assets,
rutas y scanner de secretos en verde. Auditoría verificó actor, acción, entidad,
timestamp y rechazo recursivo de metadata sensible. El advisor se probó end-to-end
con `Cotización en línea` y `Arq. Max Herrera`: payload, PostgreSQL, vistas admin y
transporte SMTP de prueba conservaron el valor exacto; los tests frontend cubren
resumen, PDF, WhatsApp y persistencia del draft sin hacer envíos externos.

La automatización visual de Firefox fue bloqueada por la política de URLs del runner;
por eso la inspección manual de sidebar y redirects con una sesión staff queda como
paso humano antes del cutover. Los guards frontend y los 403 backend sí quedaron
cubiertos automáticamente. También permanece pendiente ejecutar backup/restauración,
SMTP real y smoke HTTPS en la infraestructura definitiva; no forman parte de este QA
local.

## QA local

1. Aplicar migraciones sobre una base local respaldada.
2. Confirmar exactamente cero o un owner y que no se crearon cuentas nuevas.
3. Validar selección de cada advisor, draft/refresh/anterior y envío completo.
4. Crear sólo cuentas sintéticas locales desde Usuarios; no usar nombres o correos reales.
5. Probar cada preset, acceso directo a rutas negadas y 403 del backend.
6. Probar password temporal, cambio obligatorio, reset, revocación y disable/enable.
7. Verificar eventos de auditoría sin secretos.
8. Ejecutar suites, build, checks de legado y ciclo downgrade/upgrade en DB descartable.

## Production cutover (no ejecutar en esta fase)

1. Respaldar producción actual y verificar restauración.
2. Revisar y fusionar/push sólo después de aprobación.
3. Provisionar API y PostgreSQL administrado.
4. Aplicar migraciones y verificar constraints/índices.
5. Crear el owner real de Max con el bootstrap, usando correo confirmado y canal seguro.
6. Configurar SMTP mediante secretos del proveedor.
7. Configurar variables de Netlify y URL pública de API.
8. Configurar dominio/subdominio de API y DNS.
9. Limitar CORS al dominio real.
10. Confirmar cookie Secure/SameSite y HTTPS extremo a extremo.
11. Ejecutar smoke tests de salud y API.
12. Verificar catálogo y propiedades publicadas.
13. Enviar una solicitud real de cocina y validar Advisor/PostgreSQL.
14. Verificar correo SMTP.
15. Probar login owner y cambio inicial de contraseña.
16. Crear una cuenta staff controlada y probar permisos/403/revocación.
17. Confirmar backups, logs y alertas básicas.
18. Mantener rollback: artefacto anterior, migración downgrade evaluada y restauración de backup.
