# Fase 4E.1 — Admin CRM UX / Visual Polish

## Resultado

La iteración pule la experiencia del CRM administrativo sin cambiar su arquitectura,
contratos, autenticación o modelo de datos. El backend continúa como monolito modular
FastAPI y el frontend conserva las rutas de Fase 4E. No se agregó un sistema de tareas,
una librería de calendario ni carga de imágenes.

## Reglas operativas derivadas

Las vistas comparten helpers puros para clasificar citas sin persistir estados nuevos:

- **Vencida:** `requested` o `pending_confirmation` cuyo horario ya pasó.
- **Hoy:** cita activa programada para el día actual y todavía vigente.
- **Próxima:** cita activa con fecha futura.
- **Finalizada / Cancelada:** estados terminales persistidos.
- Una cita confirmada cuyo horario ya pasó se presenta como **Pendiente de cerrar**.

La bandeja “Requiere atención” ordena: citas vencidas, citas de hoy por confirmar,
clientes nuevos y citas futuras por confirmar. La ficha de cliente deriva una próxima
acción a partir de los datos existentes; no crea ni guarda tareas.

## Cambios por módulo

### Dashboard y clientes

- KPI con icono, valor, contexto corto y enlace al filtro correspondiente.
- Agenda de hoy con mensajes operativos para horarios vencidos y visitas por cerrar.
- Folios legacy truncados visualmente, con valor completo accesible; folios `COC-*`
  permanecen completos.
- Filas de clientes navegables por teclado y clic, con acciones de contacto independientes.
- Cabecera y sidebar de cliente con próxima acción derivada.
- Timeline descendente con tipos y claves estables, incluso con timestamps iguales.

### Citas

- Badge temporal separado del estado persistido en lista y detalle.
- Agenda semanal con anterior, hoy y siguiente; rango, conteo, día actual y tarjetas por
  cliente, hora, sucursal y estado.
- La semana seleccionada usa `semana=AAAA-MM-DD` y conserva los demás filtros.
- En móvil, la agenda cambia a una lista por día.
- El detalle destaca la acción primaria válida; una cita vencida lleva primero a ajustar
  fecha, sin confirmar automáticamente un horario pasado.

### Cocinas

- Estado de cita visible en cabecera y folio compacto accesible.
- Situación, frentes y cubierta tienen mayor énfasis visual.
- Cliente y cita son tarjetas enlazadas completas.
- Se conserva `Imprimir / guardar PDF` mediante el diálogo nativo del navegador.

### Propiedades

- Estados `Borrador`, `Publicada` y `Archivada` diferenciados de forma consistente.
- Navegación por secciones no bloqueante.
- Slug automático desde el título hasta la primera edición manual, con opción de regenerar.
- Coordenadas dentro de “Ubicación avanzada”.
- Campos opcionales vacíos permanecen nulos; distribución y amenidades aceptan un elemento
  por línea.
- Precio con vista previa en MXN.
- Galería con vista previa, error de imagen, alt, dimensiones, reordenamiento, eliminación,
  conteo y marca de portada. Continúa siendo por URL/ruta; no hay upload.
- Consecuencias de publicación explícitas y campos públicos requeridos mediante validación
  nativa antes de enviar.
- Barra de guardado sticky adaptada a móvil.

## Seed local 4E

Aurora Campos, Mateo Ríos y Renata Solís conservan sus identidades sintéticas, correos
`example.com` y teléfonos bloqueados. Los textos visibles ahora describen solicitudes,
zonas y notas naturales. Al volver a ejecutar el seed, sólo refresca esos campos cuando la
configuración existente contiene el marcador exacto `mhg-local-crm-demo-v1`.

El seed sigue siendo exclusivo de `ENVIRONMENT=local`, idempotente y sin notificaciones.
No elimina registros, no reinicia folios y no modifica propiedades reales o ambiguas.
Mata Larga sigue siendo la única propiedad real publicada creada por el seed; las
propiedades demo continúan en `draft` y `archived`.

## Pruebas automatizadas

- Clasificación vencida/hoy/próxima y estados terminales.
- Mensajes operativos de la agenda de hoy.
- Prioridad de “Requiere atención”.
- Próxima acción del cliente.
- Navegación semanal y parámetro estable de lunes.
- Eventos de actividad con timestamps iguales.
- Presentación accesible de folios legacy y `COC-*`.
- Slug normalizado, reordenamiento de imágenes y copy de publicación.
- Seed local idempotente y copy natural protegido.

## Checklist manual

### Dashboard y clientes

- [ ] Revisar KPI, hover, enlaces y orden de “Requiere atención”.
- [ ] Confirmar mensajes de horarios vencidos y visitas por cerrar.
- [ ] Abrir un cliente haciendo clic en cualquier zona no interactiva de su fila.
- [ ] Verificar folio completo mediante tooltip/lector y acciones WhatsApp/teléfono/correo.
- [ ] Revisar próxima acción y timeline de la ficha.

### Citas

- [ ] Comparar badge temporal y estado persistido en lista y detalle.
- [ ] Navegar semana anterior, actual y siguiente sin perder filtros.
- [ ] Revisar rango, conteos, columna de hoy y agenda móvil por día.
- [ ] Abrir una cita vencida y confirmar que conduce a reprogramar antes de confirmar.
- [ ] Verificar WhatsApp sin enviar mensajes.

### Cocinas y propiedades

- [ ] Revisar énfasis de selección y enlaces completos a cliente/cita.
- [ ] Abrir impresión del navegador sin guardar ni enviar el PDF.
- [ ] Crear un borrador y comprobar slug automático, edición manual y regeneración.
- [ ] Abrir ubicación avanzada y dejar opcionales vacíos.
- [ ] Agregar URLs de imagen, provocar un error, reordenar y comprobar portada.
- [ ] Revisar copy de borrador/publicada/archivada y validación previa a publicar.

### Responsive y accesibilidad

- [ ] Revisar dashboard, clientes, agenda y editor a 1440 px, laptop, tablet y móvil.
- [ ] Navegar con teclado por filas, enlaces, secciones y controles.
- [ ] Activar `prefers-reduced-motion` y confirmar que no hay animaciones largas.
