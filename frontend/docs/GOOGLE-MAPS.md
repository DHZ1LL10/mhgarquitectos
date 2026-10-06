# Configuración de Google Maps para el customizador

El selector está implementado en el customizador HTML estático y carga Google Maps JavaScript API solo cuando el usuario abre el selector. La clave no está escrita en `cotizador.js` ni en el HTML. `public/maps-config.js` proporciona el punto de configuración en tiempo de ejecución y permanece vacío en el repositorio.

Para activarlo hace falta:

1. Un proyecto de Google Cloud con facturación habilitada.
2. Habilitar **Maps JavaScript API** y **Geocoding API** para ese proyecto.
3. Crear una clave de navegador y restringirla por HTTP referrer a los hosts autorizados (por ejemplo, los dominios de prueba y producción que el propietario decida) y por API a esas dos APIs.
4. Proporcionar el valor a `window.MHG_GOOGLE_MAPS_API_KEY` desde una configuración generada fuera de Git, antes de `cotizador.js`. Para una publicación futura, inyectarlo como configuración de build/runtime desde una variable protegida del entorno de despliegue y generar `maps-config.js` durante el build. La clave resultante es visible en el navegador; las restricciones de Google Cloud, no ocultarla en el frontend, son la protección correspondiente.

La variable esperada por el código es `window.MHG_GOOGLE_MAPS_API_KEY`. No existe hoy un mecanismo de variables de entorno para los documentos estáticos dentro de `public/`, ni se añadieron variables o cambios al Netlify productivo. Por eso el mapa y el reverse geocoding mostrarán un mensaje de configuración pendiente hasta que se proporcione una clave válida. La dirección continúa siendo editable manualmente y se puede confirmar un pin cuando Maps esté configurado.

La clave no debe añadirse al repositorio. No se requiere backend para el flujo implementado; si la política de seguridad futura exige ocultar completamente las credenciales o aplicar límites server-side, habría que diseñar un servicio propio de geocodificación antes de activarlo.
