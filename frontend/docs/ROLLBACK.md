# Rollback de Fase 1

## Situación actual

Producción no se cambió. No se hizo push, deploy, cambio de rama remota, DNS ni configuración Netlify. Los commits están únicamente en `phase-1-next-properties`.

Referencia original: `62c2efa785a16a141c9da1a2ecfd7054a739a7a0`, conservada en `main`. No se necesita un rollback productivo para abandonar esta implementación.

## Desarrollo local

1. Detener los servidores locales con Ctrl+C.
2. Revisar `git status` antes de cambiar de rama. Conservar cualquier trabajo posterior del usuario.
3. Para volver a trabajar sobre el original, cambiar a `main` cuando el árbol esté limpio, o usar otro checkout aislado.
4. Para revertir un cambio de la rama nueva, preferir un commit de reversión específico. No usar `reset --hard`, borrados recursivos ni reescritura del historial como rutina.
5. No borrar `.browser-validation` ni desindexarla como parte de esta reversión; sigue siendo un asunto separado.

## Si más adelante se autoriza sustituir producción

Antes del cambio, registrar el ID del sitio y del despliegue productivo vigente, dominio, rama, directorio base, directorio publicado, comando de build, redirects y ajustes relevantes. Esta información remota no se consultó durante la Fase 1.

Si aparece una regresión después de ese cambio futuro:

1. Restaurar desde Netlify el despliegue anterior identificado, sin modificar DNS.
2. Restaurar los ajustes de build y rama anteriores para evitar que un despliegue automático publique de nuevo la versión defectuosa.
3. Revisar `/`, `/index.html`, `/cocina-customizer.html`, imágenes, PDF y WhatsApp.
4. Mantener la rama nueva para investigar y corregir; no eliminar pruebas ni evidencias.

La fase no tiene base de datos ni escrituras persistentes, por lo que no requiere reversión de datos. Los cambios del administrador son ficticios y se descartan al recargar.
