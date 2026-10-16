# MHG Arquitectos — handoff de despliegue futuro

## Punto de partida

Fase 4B cierra un release candidate local. No existe staging provisionado por esta fase,
no se modificó producción, DNS ni la web actual de Netlify. `render.yaml` conserva la
arquitectura aprobada: API FastAPI en Render Web Service, PostgreSQL administrado en Render
y frontend staging como un sitio Netlify separado.

La autorización futura debe cubrir explícitamente el gasto recurrente y cualquier cambio
de DNS. Los precios y límites de los proveedores cambian: hay que revisarlos el mismo día
de contratar, sin reutilizar estimaciones históricas.

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
11. **Crear primer administrador.** En una shell interactiva de Render ejecutar
    `python -m app.scripts.create_admin`; guardar la credencial en el gestor de contraseñas.
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
