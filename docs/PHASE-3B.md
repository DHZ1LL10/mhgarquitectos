# Fase 3B — solicitudes públicas del customizador

## Flujo

Al entrar en Resumen con Datos del cliente válidos, el customizador construye un
payload por dominios y ejecuta `POST /api/v1/kitchen-submissions`. La API crea
`KitchenConfiguration`, `Appointment`, `Lead` y el recibo `KitchenSubmission` en una
sola transacción PostgreSQL. Después del commit intenta el correo SMTP. El recibo y
sus relaciones quedan visibles inmediatamente en Leads, Citas y Configuraciones del
panel administrativo.

WhatsApp y PDF siguen disponibles como acciones secundarias. El éxito que muestra la
interfaz depende exclusivamente del recibo de la API.

## Contrato público

La petición exige `Content-Type: application/json` y `Idempotency-Key: <UUID>`.
Contiene tres objetos:

- `configuration`: situación, tablero, frentes, herrajes, cubierta, acabado, extras,
  dirección, coordenadas, sucursal, asesor, fecha, observaciones y snapshot versionado.
- `appointment`: fecha solicitada, sucursal, dirección, coordenadas y notas.
- `contact`: nombre, teléfono, email opcional, mensaje y source.

Configuración y cita deben coincidir en dirección, coordenadas, sucursal y fecha. El
cliente no puede definir estados administrativos. Los schemas Pydantic limitan
tamaños, enums, fechas y coordenadas. La respuesta 201 contiene solamente:

```json
{
  "submission_id": "uuid",
  "folio": "MHG-...",
  "configuration_id": "uuid",
  "appointment_id": "uuid",
  "lead_id": "uuid",
  "status": "received",
  "replayed": false
}
```

Una repetición exacta devuelve 200 y `replayed: true`. Una misma clave con contenido
distinto devuelve 409. El servidor guarda hashes SHA-256 de la clave y del payload,
no la clave original. El customizador conserva una clave para el contenido actual;
un cambio del payload genera otra identidad y un reintento conserva la anterior.

## Correo

`app/notifications/email.py` implementa SMTP STARTTLS configurable y genera versiones
plaintext y HTML. Incluye folio, referencia, cliente, teléfono, email, fecha, sucursal,
dirección, coordenadas, enlace OSM y toda la configuración. Si SMTP está ausente, el
recibo queda `not_configured`. Si el envío falla, queda `failed`, se registra solo el
tipo de error y la transacción de negocio permanece confirmada. Un envío exitoso queda
`sent` con fecha y número de intentos.

Variables de `backend/.env`:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=usuario
SMTP_PASSWORD=secreto
SMTP_FROM=notificaciones@example.com
SMTP_USE_TLS=true
NOTIFICATION_EMAIL=destino@example.com
```

No hay credenciales en Git. Para un proveedor real se debe crear una credencial SMTP
restringida y almacenarla en el gestor de secretos del entorno de staging.

## Frontend y mapa

`/customizer-runtime-config.js` expone al documento legacy la URL pública de API desde
`CUSTOMIZER_API_BASE_URL` o `NEXT_PUBLIC_API_BASE_URL`, además del destinatario temporal
centralizado de WhatsApp. `public/kitchen-submission.js` contiene la construcción y
envío testeables del contrato sin acoplar la API a índices de pasos.

El mapa usa Leaflet 1.9.4 y mosaicos de OpenStreetMap con atribución visible, sin API
key. Permite clic, arrastre del marcador y Geolocation API. La dirección sigue siendo
manual y editable; reverse geocoding público no es una dependencia.

## Ejecución local

Desde `backend/`:

```powershell
Copy-Item .env.example .env
# Sustituir DB_PASSWORD por una contraseña local propia en .env.
docker compose up --build -d
docker compose exec api python -m app.scripts.create_admin
docker compose exec api alembic current
```

Desde `frontend/`:

```powershell
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

La URL local de API es `http://localhost:8000/api/v1`. El frontend se sirve en
`http://localhost:3000` y el backend debe incluir ese origen exacto en `CORS_ORIGINS`.

## Pendiente antes de staging

- Backend publicado detrás de TLS y URL configurada en el frontend de prueba.
- Cookies admin `Secure`, orígenes CORS exactos y secreto de sesión en gestor seguro.
- SMTP real probado con cuenta restringida y dominio remitente autorizado.
- Rate limiting y límite de cuerpo en proxy/WAF para el endpoint público.
- Política de privacidad, consentimiento, retención y eliminación de datos personales.
- Backups PostgreSQL, restauración ensayada y observabilidad/alertas.
- Aprobación de la validación manual de `frontend/docs/VALIDACION-MANUAL.md`.

No se cambió Netlify, DNS, producción ni el catálogo público de propiedades.
