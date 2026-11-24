# Fase 2 — validación técnica cerrada con PostgreSQL real

Fecha de cierre: 2026-10-08. Rama: phase-2-backend-core.
Inicio de esta validación: working tree limpio en 4a99b83, con el checkpoint técnico
95aff55 en el historial. El tag phase-1-complete permanece en 4d39f0f.
No se hizo deploy ni se tocó Netlify, DNS o producción. No se utilizó navegador.

## Resultado de la validación real

- Docker Desktop 4.89.0, Engine 29.7.2, Compose 5.5.0 y motor Linux/WSL 2 operativos.
- Build de las imágenes Python y PostgreSQL fijadas por digest: correcto.
  La instalación de dependencias con --require-hashes funcionó dentro de Linux.
- PostgreSQL 17.11 y FastAPI arrancaron con healthchecks healthy. /health devolvió
  200 con {"status":"ok","database":"ok"}. migrate terminó con exit code 0.
- Alembic current: 0001_core (head). Alembic check: sin diferencias con metadata.
- Suite Docker: **66 passed**, incluyendo 56 pruebas de contratos/reglas y
  **10 pruebas de integración contra PostgreSQL real**. Sin SQLite ni pruebas omitidas.
- En mhg_test exclusivamente: downgrade base, upgrade head y check correctos.
  Suite completa repetida después del ciclo: **66 passed**.
- Inspección del esquema real: cinco tablas de dominio más alembic_version,
  cinco enums nativos y sus valores, cuatro foreign keys, 14 CHECK constraints,
  ocho índices/índices únicos relevantes (además de las PK), cinco triggers updated_at,
  defaults UUID y timestamps con zona horaria. RESTRICT en las tres FK de leads;
  CASCADE de propiedad a imágenes. Unicidad de slug y property_id/position comprobada
  en el catálogo PostgreSQL. Las pruebas ejercitan además precio negativo,
  coordenadas incompletas, restricción de borrado y actualización de timestamp por SQL.
- Requests HTTP reales de backend/examples/REQUESTS.md, con datos sintéticos:
  creación/listado/detalle/PATCH de propiedades, configuración individual y consulta,
  cita individual y cambios de estado, lead con las tres relaciones y envío atómico
  kitchen-submissions. Se comprobaron slug duplicado (409), draft/archived ocultos
  (404), estado inválido (422), transición inválida (409) y confirmación válida (200).
  La suite también verifica rollback completo ante fallo en la última escritura
  del envío atómico y referencias inexistentes.
- Persistencia: se comparó row_to_json de todas las filas y columnas, ordenadas por
  UUID, antes/después de restart db api y otra vez tras down/up (sin -v).
  Permanecieron idénticas 3 propiedades, 3 imágenes, 2 configuraciones, 2 citas y
  2 leads, incluidas sus relaciones y timestamps. El volumen real es
  mhg-core_postgres-data; al recrear PostgreSQL se omitió correctamente la inicialización.
- ApiPropertyRepository ejecutado directamente con Node contra FastAPI/PostgreSQL:
  listado, detalle, decimal, features, imágenes y null para slugs privados/inexistentes
  correctos. No se activó PROPERTY_REPOSITORY=api en el frontend.
- Administración habilitada únicamente mediante variable temporal de proceso para
  los requests locales. Se recreó api con ENABLE_ADMIN_ENDPOINTS=false y se verificó
  403 en las cuatro rutas administrativas. El .env local conserva false.
- Logs de API/PostgreSQL revisados: arranque y recuperación correctos. Los mensajes
  de terminación de conexiones durante restart corresponden al apagado solicitado.
- Al terminar se ejecutó compose down sin -v: servicios detenidos y volumen conservado
  con datos sintéticos. backend/.env y los snapshots locales siguen ignorados por Git.

No aparecieron fallos de modelos, migraciones, relaciones o configuración que
requiriesen corregir código. Esta sesión solo actualiza este reporte; no modifica
el frontend ni las correcciones del customizador del commit 4a99b83.
Persiste únicamente la advertencia ya conocida de Starlette sobre la futura
deprecación de httpx en TestClient; no afecta los resultados con las versiones fijadas.

El checkpoint técnico de persistencia de Fase 2 queda cerrado. Esto no habilita
el sistema para exposición pública: los pendientes de producto/seguridad siguen al final.

## Implementado y guardado

- Backend modular FastAPI, SQLAlchemy 2.1, Pydantic 2, PostgreSQL/psycopg.
- Cuatro dominios, imágenes de propiedades, relaciones y constraints.
- Migración inicial Alembic 0001_core y triggers de updated_at.
- Endpoints requeridos y envío transaccional kitchen-submissions.
- Endpoints administrativos deshabilitados por defecto; no hay autenticación falsa.
- Dockerfile y Compose: db, migrate, api, test-db y tests.
- Dependencias con hashes; imágenes Docker por digest.
- Adaptador HTTP de propiedades con selección por entorno; local sigue por defecto.
- Documentación y ejemplos en backend/README.md y backend/examples/.
- infra/ reservado; sin Terraform, cloud, Maps, notificaciones ni almacenamiento remoto.
- Las correcciones de frontend/customizador posteriores al checkpoint se guardaron
  separadamente en 4a99b83; durante esta validación no se modificaron.

## Evidencia histórica obtenida antes del checkpoint 95aff55

- Backend: 56 pruebas de contratos/reglas pasan, sin DB ni navegador.
- Ruff check y format --check: pasan. compileall: pasa.
- Alembic upgrade head --sql: genera DDL PostgreSQL correctamente.
- docker compose --env-file .env.example config --quiet: pasa.
- Dependencias Linux CPython 3.13: resolución/descarga con --require-hashes pasa.
- Imágenes Python 3.13.13 y PostgreSQL 17.11: manifests/digests consultados.
- Frontend: 18 tests pasan; typecheck, ESLint y next build pasan.
- Verificación legacy: 415 hashes originales y 414 copias públicas coinciden.
- verify:routes por HTTP sin navegador: pasa, incluyendo HTML, 404, sitemap,
  redirección legacy y SHA-256 del customizador/assets.
- Una prueba y un script HTTP heredados exigían todavía LED en Nosotros.
  Se corrigieron SOLO las expectativas a fachada-1.jpg; el sitio no se modificó.
- El archivo generado next-env.d.ts fue restaurado a su estado inicial después del build.
- Advertencia no bloqueante: Starlette TestClient depreca httpx en favor de httpx2;
  las pruebas actuales con versiones fijadas pasan. Revisar al actualizar dependencias.

## Bloqueo histórico resuelto

Docker Desktop no pudo iniciar su motor: WSL no estaba instalado/operativo.
Se intentó una instancia PostgreSQL portable oficial EDB 17.11 dentro de una carpeta
ignorada. initdb funcionó, pero Windows bloqueó pg_ctl.exe por Application Control.
No se eludió esa política. No hay servidor portable iniciado.

En 95aff55 los 10 tests de integración se habían detenido en setup con timeout de
conexión. Todos estos bloqueos se resolvieron al disponer del motor Docker operativo:
la evidencia de ejecución real figura al inicio de este documento.

## Procedimiento reproducible (completado el 2026-10-08)

1. Leer este documento y backend/README.md. Revisar git status, rama y últimos commits.
2. Comprobar docker version y docker info: debe responder el servidor Linux.
3. En backend/, crear .env desde .env.example SOLO si no existe. Usar contraseña local;
   no incluir .env ni credenciales en Git.
4. Ejecutar docker compose config --quiet y docker compose up --build -d.
5. Comprobar servicios saludables, /health y Alembic current/check.
6. Ejecutar docker compose --profile test run --build --rm tests.
7. Corregir fallos reales que aparezcan y repetir solo las validaciones afectadas.
8. Comprobar downgrade/upgrade/check exclusivamente en mhg_test mediante servicio tests
   (comandos en README), nunca en una base con datos que deban conservarse.
9. Probar requests de backend/examples/REQUESTS.md; habilitar administración solo
   localmente para ese smoke test. Comprobar persistencia tras reiniciar servicios.
10. Restaurar ENABLE_ADMIN_ENDPOINTS=false y apagar los servicios locales si procede;
    conservar el volumen. No ejecutar down -v.
11. Validar adaptador con API real sin convertir el frontend en dependencia obligatoria.
    No cambiar metadata, diseño, admin demo ni customizador en esta fase.
12. Actualizar este reporte, hacer commits coherentes, revisar diff respecto al tag y
    entregar el informe completo solicitado originalmente.

Mantener todas las restricciones originales: sin navegador,
Playwright, Puppeteer, Selenium, deploy, producción, DNS ni cambios de Netlify.
No tocar el tag phase-1-complete, que sigue en 4d39f0f.
Para levantar de nuevo el stack conservando estos datos: desde backend/ ejecutar
docker compose up -d. No sobrescribir el .env local ni cambiar su contraseña sobre
el volumen existente. Las pruebas de integración continúan usando solo mhg_test.

## Rollback y alcance pendiente

El frontend sigue local por defecto: no requiere backend para funcionar.
Para revisar Fase 1, crear una rama/worktree desde phase-1-complete; no resetear esta
rama ni borrar datos. Para detener el nuevo stack usar compose down sin -v.
Antes de retroceder migraciones de una base con datos: backup y estrategia explícita,
no ejecutar el downgrade inicial como rollback operativo.

Antes de conectar clientes reales: auth administrativa, idempotencia/antiabuso,
privacidad, política de publicación/revalidación de Next, backups y operación del
backend. El admin, customizador y formularios existentes todavía no consumen esta API.
