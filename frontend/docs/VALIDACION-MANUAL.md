# Checklist manual — Fase 1

Estas pruebas NO fueron ejecutadas en navegador por el agente. No hay capturas nuevas ni evaluación de Core Web Vitals. Marcar cada caso después de probarlo y registrar navegador, ancho, resultado y cualquier diferencia.

## Preparación

1. Desde `frontend/`, ejecutar `npm.cmd run dev` y abrir manualmente `http://localhost:3000`.
2. Para comparar el original, en otra terminal ejecutar desde la raíz `python -m http.server 3001 --bind 127.0.0.1`. Abrir manualmente `http://localhost:3001/index.html`.
3. Ambos servidores son locales; detenerlos con Ctrl+C al terminar. No utilizar `file://`, porque el PDF usa `/img/logo.jpg`.
4. Probar anchos 1440, 1024, 850, 768, 390 y 320 px. Los anchos intermedios son especialmente importantes por el enlace nuevo del menú.
5. Usar solamente datos ficticios. No es necesario enviar mensajes de WhatsApp ni contactar al negocio.

## Portada: equivalencia visual

- [ ] Comparar lado a lado logo, tipografías, hero, imagen, overlay, títulos y botones.
- [ ] Comparar las seis secciones en orden: inicio, proyectos, servicios, nosotros, sucursales y contacto.
- [ ] Comparar fotografías, recortes, espacios, colores, bordes, footer y botón flotante.
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
- [ ] Completar datos ficticios; comprobar texto y destino de WhatsApp (`5212717041499`) sin enviar el mensaje.
- [ ] Cancelar y cerrar por Escape/fondo; volver a abrir y comprobar que los campos se reinician como antes.
- [ ] Navegar portada → propiedades → ficha → portada varias veces. Confirmar un solo comportamiento por clic y que no quedan overlays o scroll bloqueado.

## Customizador independiente

- [ ] Desde Servicios → Cocinas, confirmar navegación completa a `/cocina-customizer.html`.
- [ ] Abrir esa URL directamente y recargar: sigue funcionando como página independiente.
- [ ] Paso 1: intentar continuar vacío; después usar `Cliente de prueba`, teléfono ficticio, dirección ficticia, fecha, hora y sucursal.
- [ ] Pasos 2 y 3: seleccionar situación e interior; comprobar selección y avance.
- [ ] Paso 4: abrir cada una de las cuatro líneas; elegir color, cancelar y comprobar que no se guardó; repetir aplicando y confirmar que sí se guardó.
- [ ] Seleccionar varias líneas; al reabrir una, comprobar su acabado y previsualización.
- [ ] Abrir Ampliar desde tarjetas y desde modales; cerrar y comprobar que se conserva la selección y el modal inferior.
- [ ] Paso 5: elegir corredera y basurero; activar/desactivar cajones y módulos múltiples. Revisar galerías de esquinero y basurero completo.
- [ ] Paso 6: recorrer Base sólida, Granito, Cuarzo y Piedra sinterizada. Comprobar precios contra el original.
- [ ] En sinterizadas: probar las cuatro colecciones, elegir acabado y cambiar de colección/categoría; comparar limpieza de selección con el original.
- [ ] Paso 7: activar y desactivar los cuatro extras; Ampliar no debe cambiar selección.
- [ ] Paso 8: revisar cliente, materiales, herrajes, variantes y extras del resumen.
- [ ] Descargar un PDF REAL con conexión al CDN de jsPDF. Abrirlo y revisar logo, contenido, páginas y nombre del archivo; no usar solo una simulación.
- [ ] Probar datos largos y varias selecciones; documentar el truncado heredado si aparece, sin confundirlo con una regresión.
- [ ] Abrir WhatsApp desde el resumen; revisar número y mensaje sin enviarlo.
- [ ] Recorrer Anterior/Siguiente por los ocho pasos y comparar la conservación de datos.
- [ ] “Nueva configuración” vuelve al paso 1 y conserva datos, como el original; no se cambió ese comportamiento.
- [ ] Volver al sitio mediante el enlace original `/index.html`: debe mostrar la portada Next.js.
- [ ] Probar teclado y gestos táctiles de la galería; documentar controles que ya carecían de teclado en el original.
- [ ] Confirmar que la única referencia ausente conocida sigue siendo `img/favicon.ico`; no se añadió ni cambió ese archivo.

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

## Administración de demostración

- [ ] Abrir `/admin` directamente. No debe mostrar login ni exigir credenciales.
- [ ] Debe aparecer exactamente: “Modo demostración: los cambios se pierden al recargar.”
- [ ] Se ven cuatro registros y sus estados.
- [ ] Editar un título, precio y descripción; guardar en memoria y comprobar el cambio en la lista.
- [ ] Cambiar un borrador a publicado y después a archivado: cambia solo la pantalla de administración.
- [ ] Abrir el catálogo público en otra pestaña: continúa mostrando los dos fixtures originales.
- [ ] Crear un registro ficticio completo; guardarlo y editarlo otra vez.
- [ ] Intentar guardar un slug duplicado, uno con espacios, precio cero o superficie cero: debe mostrar errores.
- [ ] Cancelar edición: el registro anterior permanece intacto.
- [ ] Elegir otra fotografía local: se informa que sustituye la galería de la copia en memoria. No hay subida de archivos.
- [ ] Recargar `/admin`: vuelven exactamente los cuatro registros iniciales; las creaciones y ediciones desaparecen.
- [ ] Salir mediante los enlaces y volver: confirmar que no se presenta una promesa de persistencia.
- [ ] Confirmar que no aparece enlace `/admin` en header/footer públicos.

## Antes de cualquier despliegue futuro

- [ ] Aprobar equivalencia visual y registrar diferencias pendientes.
- [ ] Revisar instrucciones del sitio Netlify independiente; no reutilizar producción.
- [ ] Comprobar manualmente la integración de Netlify cuando se autorice, ya que no fue desplegada aquí.
- [ ] Mantener el customizador intacto hasta una autorización específica para migrarlo o corregirlo.
