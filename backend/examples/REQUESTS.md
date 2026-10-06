# Requests de ejemplo (PowerShell)

Desde backend/, con el stack local levantado. Estos ejemplos crean datos en tu base
local; no envían correos ni mensajes. Habilita ENABLE_ADMIN_ENDPOINTS=true únicamente
para los requests administrativos y recrea api con docker compose up -d api.

```powershell
$apiBase = "http://localhost:8000"
Invoke-RestMethod "$apiBase/health"

# Admin local: crear propiedad (repetir el mismo slug devuelve 409).
$property = Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/properties" -ContentType "application/json; charset=utf-8" -Body (Get-Content examples/property.json -Raw -Encoding UTF8)

# Público: solo published.
Invoke-RestMethod "$apiBase/api/v1/properties?limit=20&offset=0"
Invoke-RestMethod "$apiBase/api/v1/properties/casa-prueba-local"

# Admin local: archivar; el GET anterior pasará a 404.
Invoke-RestMethod -Method Patch -Uri "$apiBase/api/v1/properties/$($property.id)" -ContentType "application/json" -Body '{"status":"archived"}'

# Público: cocina, cita y lead en una transacción.
$submission = Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/kitchen-submissions" -ContentType "application/json; charset=utf-8" -Body (Get-Content examples/kitchen-submission.json -Raw -Encoding UTF8)
$submission.lead

# Admin local: consultar configuración y confirmar cita.
Invoke-RestMethod "$apiBase/api/v1/kitchen-configurations/$($submission.configuration.id)"
Invoke-RestMethod -Method Patch -Uri "$apiBase/api/v1/appointments/$($submission.appointment.id)" -ContentType "application/json" -Body '{"status":"confirmed","confirmed_datetime":"2030-10-12T10:00:00-06:00"}'

# Público: lead general, sin referencias.
Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/leads" -ContentType "application/json" -Body '{"source":"contact","name":"Persona de prueba","phone":"+52 222 123 4567","email":"persona@example.com","message":"Prueba local"}'
```

Los endpoints individuales de cocina y citas aceptan respectivamente los objetos
configuration y appointment del JSON del ejemplo. Un lead individual permite agregar
property_id, kitchen_configuration_id y appointment_id; deben existir y la propiedad
debe estar publicada. Ningún ejemplo usa credenciales reales ni API keys.

