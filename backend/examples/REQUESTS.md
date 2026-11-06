# Requests de ejemplo (PowerShell)

Desde `backend/`, con el stack local levantado. Estos ejemplos crean datos en la base
local; no envían correos ni mensajes. Primero crea una cuenta con el CLI documentado:

```powershell
docker compose exec api python -m app.scripts.create_admin
```

La contraseña se captura de forma interactiva y nunca se pasa como argumento. Para
probar la API con PowerShell, `Get-Credential` evita escribirla en el historial:

```powershell
$apiBase = "http://localhost:8000"
$origin = "http://localhost:3000"
$headers = @{ Origin = $origin; "X-MHG-Admin" = "1" }
$credential = Get-Credential -Message "Administrador local MHG"
$plainPassword = $credential.GetNetworkCredential().Password
$loginBody = @{ email = $credential.UserName; password = $plainPassword } | ConvertTo-Json
$plainPassword = $null

Invoke-RestMethod "$apiBase/health"
$me = Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/auth/login" `
  -Headers $headers -ContentType "application/json" -Body $loginBody `
  -SessionVariable adminSession
Invoke-RestMethod -Uri "$apiBase/api/v1/auth/me" -WebSession $adminSession

# Admin: crear propiedad (repetir el mismo slug devuelve 409).
$property = Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/properties" `
  -Headers $headers -WebSession $adminSession -ContentType "application/json; charset=utf-8" `
  -Body (Get-Content examples/property.json -Raw -Encoding UTF8)

# Público: solo published.
Invoke-RestMethod "$apiBase/api/v1/properties?limit=20&offset=0"
Invoke-RestMethod "$apiBase/api/v1/properties/casa-prueba-local"

# Admin: archivar; el GET público anterior pasará a 404.
Invoke-RestMethod -Method Patch -Uri "$apiBase/api/v1/properties/$($property.id)" `
  -Headers $headers -WebSession $adminSession -ContentType "application/json" `
  -Body '{"status":"archived"}'

# Público: cocina, cita y lead en una transacción.
$idempotencyKey = [guid]::NewGuid().ToString()
$submission = Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/kitchen-submissions" `
  -Headers @{ "Idempotency-Key" = $idempotencyKey } `
  -ContentType "application/json; charset=utf-8" `
  -Body (Get-Content examples/kitchen-submission.json -Raw -Encoding UTF8)
$submission

# staff/admin: consultar configuración. Solo admin puede confirmar la cita.
Invoke-RestMethod -Uri "$apiBase/api/v1/kitchen-configurations/$($submission.configuration_id)" `
  -WebSession $adminSession
Invoke-RestMethod -Method Patch -Uri "$apiBase/api/v1/appointments/$($submission.appointment_id)" `
  -Headers $headers -WebSession $adminSession -ContentType "application/json" `
  -Body '{"status":"confirmed","confirmed_datetime":"2030-10-12T10:00:00-06:00"}'

# Público: lead general, sin referencias.
Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/leads" `
  -ContentType "application/json" `
  -Body '{"source":"contact","name":"Persona de prueba","phone":"+52 222 123 4567","email":"persona@example.com","message":"Prueba local"}'

# Logout real: revoca la fila de sesión y elimina la cookie.
Invoke-RestMethod -Method Post -Uri "$apiBase/api/v1/auth/logout" `
  -Headers $headers -WebSession $adminSession
```

Los endpoints individuales de cocina y citas aceptan respectivamente los objetos
`configuration` y `appointment` del JSON del ejemplo. Un lead individual permite
agregar `property_id`, `kitchen_configuration_id` y `appointment_id`; deben existir y
la propiedad debe estar publicada. Ningún ejemplo contiene credenciales reales ni
claves de API.
