# Checklist manual — estado actual

Estas pruebas NO fueron ejecutadas en navegador por el agente. No hay capturas nuevas ni evaluación de Core Web Vitals. Marcar cada caso después de probarlo y registrar navegador, ancho, resultado y cualquier diferencia.

## Preparación

1. Levantar PostgreSQL, migraciones y API desde `backend/` con `docker compose up --build -d`.
2. Crear un administrador local si aún no existe y ejecutar el frontend desde `frontend/` con `npm.cmd run dev`.
3. Abrir manualmente `http://localhost:3000`. No utilizar `file://`, porque el customizador necesita la configuración de runtime y usa `/img/logo.jpg`.
4. Probar anchos 1440, 1024, 850, 768, 390 y 320 px.
5. Usar solamente datos ficticios y una cuenta SMTP de pruebas. No enviar mensajes de WhatsApp ni contactar al negocio.

## Portada: equivalencia visual

- [ ] Comparar lado a lado logo, tipografías, hero, imagen, overlay, títulos y botones; el H1 debe decir exactamente “Diseñamos Construimos Equipamos”.
- [ ] Comparar las seis secciones en orden: inicio, proyectos, servicios, nosotros, sucursales y contacto.
- [ ] Comparar fotografías, recortes, espacios, colores, bordes, footer y botón flotante; en Nosotros confirmar la imagen corporativa y únicamente la métrica 6.5 años.
- [ ] Confirmar ausencia de desbordamiento horizontal y texto tapado en todos los anchos.
- [ ] Revisar el header con el único enlace nuevo, Propiedades; comprobar que cabe a 1024 y 850 px.
- [ ] Desplazarse: la navegación debe pasar de transparente a sólida igual que el original.
- [ ] Revisar consola: sin errores de hidratación, React o JavaScript. Distinguir errores heredados del original.

## Portada: interacciones

- [ ] Menú móvil: abrir, elegir sección y comprobar cierre; repetir varias veces.
- [ ] Anclas de header y footer: desplazamiento a cada sección correcto.
- [ ] Portafolio: cambiar entre Construcción, Cocinas, Mobiliario e Interiorismo; volver a la primera.
- [ ] Abrir una foto de cada categoría; siguiente/anterior y flechas recorren su propia categoría.
- [ ] Cerrar galerías por X, fondo y Escape; el scroll del documento vuelve a funcionar.
- [ ] Sucursales: los mapas aparecen al aproximarse a la sección; probar también clic temprano en el placeholder y verificar que no se duplica el iframe.
- [ ] Enlaces generales de WhatsApp: apuntan al número original `5212711055612`; no es necesario enviar.
- [ ] Abrir Cotizar para Construcción, Mobiliario e Interiorismo; comparar campos y estilo con el original.
- [ ] Intentar enviar vacío: mensaje de campo requerido, foco y resaltado correctos.
- [ ] Completar datos ficticios; comprobar texto y destino temporal de WhatsApp configurado en `src/config/site.ts`, sin enviar el mensaje.
- [ ] Cancelar y cerrar por Escape/fondo; volver a abrir y comprobar que los campos se reinician como antes.
- [ ] Navegar portada → propiedades → ficha → portada varias veces. Confirmar un solo comportamiento por clic y que no quedan overlays o scroll bloqueado.

## Customizador independiente

- [ ] Desde Servicios → Cocinas, confirmar navegación completa a `/cocina-customizer.html`.
- [ ] Abrir esa URL directamente y recargar: sigue funcionando como página independiente.
- [ ] Confirmar el orden exacto: 1 Situación actual, 2 Tableros interiores, 3 Frentes exteriores, 4 Herrajes, 5 Cubierta, 6 Extras, 7 Datos del cliente, 8 Resumen.
- [ ] Intentar avanzar y saltar desde el menú sin seleccionar situación, interior o frentes; debe aplicar las mismas validaciones que Siguiente.
- [ ] En Situación e Interior seleccionar una opción y comprobar selección/avance; usar el menú lateral y Anterior para volver sin perder elecciones.
- [ ] En Frentes abrir cada una de las cuatro líneas; elegir color, cancelar y comprobar que no se guardó; repetir aplicando y confirmar que sí se guardó.
- [ ] Seleccionar varias líneas; al reabrir una, comprobar su acabado y previsualización.
- [ ] Abrir Ampliar desde tarjetas y desde modales; cerrar y comprobar que se conserva la selección y el modal inferior.
- [ ] En Herrajes elegir corredera y basurero; activar/desactivar cajones y módulos múltiples. En “Línea Alta · Módulo completo” confirmar una foto y ausencia de miniaturas con una sola imagen.
- [ ] En Cubierta recorrer Base sólida, Granito, Cuarzo y Piedra sinterizada. Comprobar precios contra el original.
- [ ] En sinterizadas: probar las cuatro colecciones, elegir acabado y cambiar de colección/categoría; comparar limpieza de selección con el original.
- [ ] En Extras activar y desactivar los cuatro extras; Ampliar no debe cambiar selección.
- [ ] En Datos del cliente, comprobar el email opcional, abrir el mapa Leaflet/OSM, colocar y mover el pin y usar “Usar mi ubicación” después de conceder permiso manualmente.
- [ ] Confirmar ubicación, reabrirla, cambiarla y editar manualmente la dirección. La dirección no debe depender de reverse geocoding.
- [ ] Al entrar a Resumen debe aparecer “Enviando solicitud…” y después “Solicitud recibida correctamente” con un folio `MHG-...`.
- [ ] Volver a un paso anterior y regresar sin cambios: debe conservar el folio y no crear otra solicitud. Cambiar un dato y regresar debe crear una solicitud nueva.
- [ ] Simular API inaccesible: debe aparecer el error y “Reintentar”; nunca debe afirmar que fue recibida. Restaurar la API y reintentar debe funcionar sin duplicar filas.
- [ ] En Resumen comprobar dirección, coordenadas y enlace OSM; descargar PDF y comprobarlos; revisar el enlace de mapa del mensaje de WhatsApp sin enviarlo.
- [ ] Descargar un PDF REAL con conexión al CDN de jsPDF. Abrirlo y revisar logo, contenido, páginas y nombre del archivo; no usar solo una simulación.
- [ ] Probar datos largos y varias selecciones; documentar el truncado heredado si aparece, sin confundirlo con una regresión.
- [ ] Abrir WhatsApp desde el resumen; revisar número y mensaje sin enviarlo.
- [ ] Recorrer Anterior/Siguiente y navegación lateral por los ocho pasos; comprobar que toda selección y dato se conserva.
- [ ] “Nueva configuración” vuelve al paso 1 Situación y conserva datos, como el original; no se cambió ese comportamiento.
- [ ] Activar reducción de movimiento del sistema y repetir pasos, selección, secciones y modales; las animaciones deben reducirse.
- [ ] Volver al sitio mediante el enlace original `/index.html`: debe mostrar la portada Next.js.
- [ ] Probar teclado y gestos táctiles de la galería; documentar controles que ya carecían de teclado en el original.
- [ ] Confirmar que la única referencia legacy ausente conocida sigue siendo `img/favicon.ico`.

## Propiedades

- [ ] `/propiedades` muestra exactamente dos fichas de ejemplo y el aviso de contenido ficticio.
- [ ] No aparecen la casa en borrador ni el departamento archivado.
- [ ] Abrir cada ficha mediante tarjeta, URL directa y recarga.
- [ ] Revisar título, ubicación ficticia, precio/mes cuando corresponde, características, descripción y galería.
- [ ] En la casa, cambiar las tres miniaturas por clic y teclado. En el departamento, la imagen única se presenta correctamente.
- [ ] Navegar de una ficha a otra y confirmar que la galería no conserva un índice de la ficha anterior.
- [ ] “Volver a propiedades” funciona; los enlaces corporativos de páginas interiores apuntan a las secciones de la portada.
- [ ] Abrir `/propiedades/no-existe`, `/propiedades/casa-demo-borrador` y `/propiedades/departamento-demo-archivado`: mostrar 404, no contenido privado.
- [ ] Inspeccionar código fuente: título, descripción, canonical y Open Graph de cada ficha están en el HTML inicial.
- [ ] Confirmar `noindex`: es intencional durante esta fase y no debe quitarse para indexar ejemplos ficticios.

## Administración real

- [ ] Abrir `/admin` sin sesión: debe mostrar o redirigir a `/admin/login` sin revelar datos.
- [ ] Probar contraseña incorrecta y después iniciar sesión con un administrador local.
- [ ] Verificar Dashboard, Propiedades, Leads, Citas y Configuraciones de cocina; recargar y confirmar que los datos persisten.
- [ ] Localizar el folio recién creado en Lead, Cita y Configuración y comprobar que los tres IDs relacionados coinciden.
- [ ] Comprobar nombre, teléfono, email, fecha, sucursal, dirección, ubicación, selecciones y timestamps.
- [ ] Abrir el enlace de ubicación: debe llevar a OpenStreetMap con el punto correcto.
- [ ] Abrir “Contactar por WhatsApp”: debe usar el teléfono real del cliente y texto prellenado; cerrar sin enviarlo.
- [ ] Crear y editar una propiedad; cambiar draft → published → archived y confirmar persistencia tras recargar.
- [ ] Iniciar sesión como staff: debe consultar leads, citas y configuraciones, pero no administrar propiedades ni modificar citas.
- [ ] Cerrar sesión: la cookie debe revocarse y `/admin` debe volver a exigir login.
- [ ] Confirmar que no aparece enlace `/admin` en header/footer públicos.

## Antes de cualquier despliegue futuro

- [ ] Aprobar equivalencia visual y registrar diferencias pendientes.
- [ ] Revisar instrucciones del sitio Netlify independiente; no reutilizar producción.
- [ ] Comprobar manualmente la integración de Netlify cuando se autorice, ya que no fue desplegada aquí.
- [ ] Mantener el customizador como documento legacy independiente; cualquier migración futura requiere su propio alcance.
