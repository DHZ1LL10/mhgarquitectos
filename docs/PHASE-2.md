# Fase 2: backend core

Referencia inmutable: tag `phase-1-complete` en `4d39f0f`.
Inicio: rama `phase-2-backend-core`, árbol limpio. Frontend Next.js existente,
customizador independiente y repositorio local conservados.

Monolito modular FastAPI con dominios properties, leads, appointments y
kitchen_configurations. PostgreSQL es la persistencia real. No habrá auth ficticia:
las operaciones administrativas se marcan explícitamente y se deshabilitan por
defecto. La habilitación local NO es una medida de autenticación ni autoriza
exponer el backend en Internet.

No se modifica producción, Netlify, dominio, DNS, customizador, tag ni diseño.
No se implementan auth/users, imágenes remotas, notificaciones ni infraestructura.

Decisiones de datos:
- UUID, tiempos UTC con zona, precio decimal, enums PostgreSQL y constraints.
- Ubicación y features de propiedades son objetos tipados en la API y JSONB en DB.
- Imágenes: filas separadas con orden, metadatos, URL y object_key opcional futuro.
- Configuraciones de cocina por conceptos, nunca por índices de pantalla.
- Lead referencia opcionalmente una propiedad, configuración y/o cita, con FK
  RESTRICT para no borrar contexto comercial. Varios leads pueden referenciar
  la misma entidad; no se deduplican personas automáticamente.
- No se exige que una cita futura tenga una hora confirmada hasta status confirmed.
- Fechas solicitadas requieren offset horario; la API almacena timestamptz.
- El esquema completo de selección de cocina lleva selection_version y selections.
- Un endpoint transaccional adicional permitirá crear configuración, cita y lead
  juntos sin datos parciales, además de los endpoints individuales.

Fuentes técnicas: [FastAPI settings](https://fastapi.tiangolo.com/advanced/settings/),
[SQLAlchemy PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html),
[Compose startup order](https://docs.docker.com/compose/how-tos/startup-order).

