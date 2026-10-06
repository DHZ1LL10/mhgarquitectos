# Fase 2 — checkpoint previo al reinicio

Fecha: 2026-10-06. Rama: phase-2-backend-core.
La fase NO está cerrada. El usuario solicitó este checkpoint para reiniciar Windows
después de descargar/configurar WSL. No se hizo deploy ni se tocó Netlify, DNS o producción.

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
- Frontend y customizador sin cambios visuales o funcionales.

## Evidencia ya obtenida

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

## Bloqueo y validaciones pendientes

Docker Desktop no pudo iniciar su motor: WSL no estaba instalado/operativo.
Se intentó una instancia PostgreSQL portable oficial EDB 17.11 dentro de una carpeta
ignorada. initdb funcionó, pero Windows bloqueó pg_ctl.exe por Application Control.
No se eludió esa política. No hay servidor portable iniciado.

Los 10 tests de integración se recolectaron correctamente, pero su ejecución se detuvo
en setup con timeout de conexión. NO están aprobados. Tampoco se ha ejecutado todavía
el build de Docker, upgrade/downgrade real, Alembic check contra PostgreSQL ni el flujo
HTTP contra la API persistente. No sustituir estas comprobaciones por SQLite o mocks.

## Reanudar después del reinicio

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

El siguiente agente debe mantener todas las restricciones originales: sin navegador,
Playwright, Puppeteer, Selenium, deploy, producción, DNS ni cambios de Netlify.
No tocar el tag phase-1-complete, que sigue en 4d39f0f.
No declarar completa la fase hasta comprobar la persistencia real.

## Rollback y alcance pendiente

El frontend sigue local por defecto: no requiere backend para funcionar.
Para revisar Fase 1, crear una rama/worktree desde phase-1-complete; no resetear esta
rama ni borrar datos. Para detener el nuevo stack usar compose down sin -v.
Antes de retroceder migraciones de una base con datos: backup y estrategia explícita,
no ejecutar el downgrade inicial como rollback operativo.

Antes de conectar clientes reales: auth administrativa, idempotencia/antiabuso,
privacidad, política de publicación/revalidación de Next, backups y operación del
backend. El admin, customizador y formularios existentes todavía no consumen esta API.

