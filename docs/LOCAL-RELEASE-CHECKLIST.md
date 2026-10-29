# Checklist funcional local — MHG Arquitectos

Usar datos sintéticos. Marcar recepción de correo sólo después de revisar el buzón.

## Landing y propiedades

- [ ] Landing carga sin errores visibles en desktop y móvil.
- [ ] Navegación, anclas, CTA y regreso al inicio funcionan.
- [ ] `/propiedades` muestra sólo publicaciones y cada detalle abre.
- [ ] Slugs inexistentes, borradores y archivados responden 404.

## Customizador

- [ ] Los pasos respetan orden, validaciones, atrás/continuar y resumen.
- [ ] Herrajes exige decisión en cada subsección y conserva selecciones.
- [ ] Ubicación muestra mapa OpenStreetMap, dirección y pin correctos.
- [ ] Recargar/restaurar pestaña recupera el draft desde `sessionStorage`.
- [ ] Enviar una vez produce `COC-xxxxx`; reintentar no duplica registros.
- [ ] El resumen muestra estado de envío, éxito y opción de nueva configuración.
- [ ] PDF descarga/abre y contiene folio y datos legibles.
- [ ] WhatsApp abre el mensaje correcto con folio, sin enviarlo automáticamente.

## Administración

- [ ] Credenciales inválidas fallan y el login válido abre `/admin`.
- [ ] Dashboard refleja los totales y pendientes actuales.
- [ ] El lead muestra contacto, folio, ubicación y cita asociada.
- [ ] La cita muestra fecha, sucursal, ubicación y configuración relacionadas.
- [ ] Estados permitidos avanzan sin saltos inválidos.
- [ ] La configuración conserva selecciones, Herrajes, extras y notas.
- [ ] Logout invalida la sesión y una ruta protegida vuelve a pedir login.

## Email

- [ ] El buzón controlado recibe exactamente un mensaje por submission nueva.
- [ ] Asunto y cuerpos plaintext/HTML muestran el mismo `COC-xxxxx`.
- [ ] Cliente, fecha/hora, dirección, mapa y configuración son correctos.
- [ ] HTML se ve correctamente en desktop/móvil y el plaintext es legible.
- [ ] Un replay idempotente no genera un segundo correo.
