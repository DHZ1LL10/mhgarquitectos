# Fase 4E — MHG Admin CRM Experience

## Resultado

El administrador dejó de ser una vista monolítica controlada por estado interno. Ahora es
una aplicación CRM con rutas reales, shell compartido, navegación lateral, tablas operativas
y fichas enlazadas. La autenticación por cookie, CSRF, roles y contratos existentes se
conservan. No se desplegó infraestructura.

## Arquitectura y rutas

El código vive en `frontend/src/features/admin/` y se divide en `layout`, `dashboard`,
`clients`, `appointments`, `kitchens`, `properties` y `shared`. `AdminShell` valida la sesión,
mantiene navegación y logout; las vistas consumen la API mediante `useAdminQuery`.

| Ruta | Uso |
| --- | --- |
| `/admin` | Dashboard operativo |
| `/admin/clientes` | Tabla, búsqueda y filtros |
| `/admin/clientes/[id]` | Ficha, actividad y seguimiento |
| `/admin/citas` | Lista y agenda semanal |
| `/admin/citas/[id]` | Confirmación, edición y cierre |
| `/admin/cocinas` | Tabla de configuraciones |
| `/admin/cocinas/[id]` | Ficha de selección persistida |
| `/admin/propiedades` | Catálogo administrativo |
| `/admin/propiedades/nueva` | Alta de propiedad |
| `/admin/propiedades/[id]` | Edición jerárquica |

El rol `staff` puede consultar clientes, citas y cocinas. Propiedades y las mutaciones de
estado quedan restringidas a `admin`, tanto en interfaz como en backend.

## Diseño y componentes

El shell usa superficies claras, verde MHG, jerarquía tipográfica, badges consistentes,
focus visible y microinteracciones de 180–200 ms. En escritorio la sidebar es fija; en
tablet/móvil se vuelve drawer accesible. Las tablas cambian a tarjetas etiquetadas en móvil.
Hay componentes compartidos para estados de carga/error/vacío, paginación, contactos,
badges, iconos y datos técnicos colapsables.

## Dashboard

Los KPIs enlazan a filtros reales: clientes nuevos, citas por confirmar, agenda de hoy,
próximas confirmadas y propiedades publicadas para administradores. La pantalla incluye
agenda del día, pendientes derivados de leads/citas, próximas visitas, solicitudes y
actividad obtenida de timestamps persistidos. Una gráfica de barras CSS resume citas por
estado sin agregar una dependencia de visualización.

## Clientes y estados

La tabla ofrece búsqueda local, filtro, paginación, próxima cita y acciones externas sólo
cuando los datos son válidos. La ficha reúne contacto, ubicación, cita, cocina y timeline.
Los estados reales se presentan como `Nuevo`, `Contactado`, `En seguimiento` y `Cerrado`.
`PATCH /api/v1/leads/{id}/status` permite al administrador cambiar únicamente el enum de
estado; no acepta edición arbitraria del lead.

## Citas y WhatsApp

La lista y agenda semanal usan las transiciones permitidas por backend. La ficha permite
marcar por confirmar, confirmar, finalizar o cancelar; cancelar exige confirmación y una
cita confirmada expone la acción “Enviar confirmación por WhatsApp”. Fecha/hora y notas se
pueden ajustar sin crear estados imposibles.

Las plantillas pendientes y confirmadas se construyen como Unicode en una única función,
incluyen fecha y hora `es-MX`, omiten campos vacíos y aplican `encodeURIComponent` una sola
vez al parámetro `text`. La revisión del repositorio no encontró bytes de reemplazo en la
fuente anterior: el síntoma `�` no quedó reproducible desde el código versionado. La causa
verificable de fragilidad era que el texto no tenía una función inspeccionable separada del
URL; ahora tests decodifican el enlace y comprueban emojis, ausencia de U+FFFD, fecha, hora
y ambas variantes. No se envían mensajes automáticamente.

## Cocinas y PDF

La tabla enlaza folio, cliente, cita y estado. La ficha traduce las selecciones persistidas
a labels humanos y agrupa situación, tableros, frentes, herrajes, cubierta, extras,
observaciones, cliente y cita. Los UUID quedan en información técnica.

El generador PDF del customizador depende de su estado global y DOM legacy; no puede
reutilizarse de forma limpia desde una configuración persistida sin duplicarlo. La ficha
ofrece `Imprimir / guardar PDF` usando el diálogo nativo del navegador y estilos de impresión.

## Propiedades y publicación

La discrepancia provenía de dos decisiones simultáneas: `PROPERTY_REPOSITORY` elegía fixtures
locales por defecto y el repositorio HTTP usaba `force-cache`, `generateStaticParams` y
`dynamicParams=false`. El admin leía PostgreSQL, pero landing y catálogo podían quedar
anclados al dataset/build local.

La fuente por defecto es ahora `api`; las lecturas públicas usan `no-store` y las rutas de
landing, catálogo, detalle y sitemap son dinámicas. `draft` y `archived` siguen excluidas por
el endpoint público; `published` se refleja sin reconstruir Next. El modo `local` sólo se
mantiene como opt-in explícito para CI/fixtures. El editor separa información, ubicación,
características, precio, fotografías y publicación.

## Seed local

Ejecutar con los contenedores activos:

```powershell
cd backend
docker compose exec api python -m app.scripts.seed_admin_demo
```

El script requiere `ENVIRONMENT=local`, es idempotente y no borra datos, reinicia folios ni
envía notificaciones. Crea escenarios enlazados para Aurora Campos (hoy/por confirmar),
Mateo Ríos (futura/confirmada) y Renata Solís (pasada/finalizada), todos sintéticos, con
correos `example.com` y teléfonos bloqueados para contacto. También crea/importa:

- `residencia-mata-larga-fortin` — real y publicada;
- `casa-bosque-local` — sintética y borrador;
- `departamento-rio-local` — sintética y archivada.

Mata Larga es la única propiedad real publicada por el seed. Una comprobación conservadora
advierte si firmas inequívocas de validaciones históricas o propiedades demo 4E aparecen
publicadas. La advertencia no cambia ni borra registros automáticamente.

## Pruebas automáticas

- Backend: contratos, autorización staff/admin, detalles CRM, publicación pública y seed.
- Frontend: 82 pruebas para API/admin, rutas, navegación, KPIs, tablas, agenda, flujo,
  WhatsApp/Unicode/hora, cocinas, propiedades, fuente única y regresiones existentes.
- Validación requerida: Ruff, pytest, `npm test`, typecheck, lint, build, assets legacy,
  rutas HTTP, Docker healthy, `git diff --check` y scanner de secretos.

## Checklist manual

### Login

- [ ] Iniciar sesión con una cuenta válida.
- [ ] Cerrar sesión y comprobar redirección.

### Dashboard

- [ ] Validar KPIs y enlaces filtrados.
- [ ] Revisar agenda de hoy y ubicaciones.
- [ ] Revisar pendientes y gráfica por estado.

### Clientes

- [ ] Probar tabla, búsqueda, filtros y paginación.
- [ ] Abrir ficha y secciones vinculadas.
- [ ] Revisar WhatsApp, llamada y correo sin enviar/contactar.
- [ ] Cambiar estado como admin y verificar que staff no puede hacerlo.

### Citas

- [ ] Alternar lista y agenda semanal.
- [ ] Probar filtros hoy y por confirmar.
- [ ] Confirmar y cambiar horario.
- [ ] Revisar WhatsApp pendiente y confirmado sin enviarlo.
- [ ] Finalizar una cita confirmada.
- [ ] Confirmar el diálogo antes de cancelar.

### Cocinas

- [ ] Revisar tabla y ficha.
- [ ] Confirmar labels de selecciones y vínculos.
- [ ] Abrir impresión/guardar PDF.
- [ ] Verificar que teléfonos sintéticos no ofrecen WhatsApp.

### Propiedades

- [ ] Revisar tabla y editar un borrador.
- [ ] Cambiar entre draft, published y archived.
- [ ] Confirmar que sólo published aparece en landing, catálogo y detalle.
- [ ] Confirmar que Mata Larga permanece disponible.

### Responsive

- [ ] Revisar 1440 px y laptop.
- [ ] Revisar sidebar drawer en tablet.
- [ ] Revisar tablas/tarjetas y fichas en móvil.
