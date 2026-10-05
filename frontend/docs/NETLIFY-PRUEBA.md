# Preparación de un Netlify de prueba

No se creó ningún sitio ni se ejecutó despliegue, push, cambio de dominio, DNS o configuración remota durante esta implementación.

## Límites

- No modificar el sitio productivo ni asociarle `frontend/netlify.toml`.
- No existe un `netlify.toml` nuevo en la raíz del repositorio.
- La configuración productiva actual no fue inspeccionada; rama, build, directorio publicado, redirects e inyecciones permanecen por confirmar antes de cualquier transición futura.
- El nuevo sitio contiene datos ficticios. Debe permanecer fuera del índice y separado del dominio principal.

## Preparación futura, solo cuando se autorice

1. Crear un sitio de prueba independiente, sin dominio personalizado. No reutilizar el identificador del sitio productivo.
2. Seleccionar la rama de trabajo aprobada; no cambiar la rama del sitio existente. El push de esta rama también queda pendiente.
3. Base directory: `frontend`. La configuración corresponde a `frontend/netlify.toml`; verificar en los logs que ese sea el archivo cargado.
4. Build command: `npm run build`. Publish directory relativo a la base: `.next`.
5. Node: `24.21.0`; npm utiliza el lockfile versionado. El build verifica los originales de la raíz y las copias públicas; no desplegar únicamente una exportación suelta de frontend que omita la raíz.
6. Definir `SITE_URL=https://NOMBRE-DEL-SITIO-DE-PRUEBA.netlify.app` antes del build. No habilita indexación: robots, metadata y cabeceras siguen bloqueándola.
7. Usar la integración Next.js/OpenNext detectada por Netlify. No instalar el runtime legacy ni añadir un rewrite SPA `/* /index.html 200`.
8. Confirmar que `/index.html` resuelva la portada, `/cocina-customizer.html` sirva HTML estático y `/img/*` conserve sus rutas.
9. Confirmar 404 para slugs desconocidos, borradores y archivados, y `X-Robots-Tag` también en archivos estáticos.
10. Completar la checklist manual. La publicación productiva requiere una decisión posterior.

## Assets

`public/` contiene exclusivamente 412 archivos permitidos: cinco documentos del legacy y 407 imágenes. No incluye `.browser-validation`, informes, inventarios, capturas, credenciales ni el index original. La verificación falla si aparece un archivo inesperado.

## Referencias técnicas

- [Next.js en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Build y directorio de publicación](https://docs.netlify.com/snippets/frameworks/nextjs-config-values/)

La compatibilidad del adaptador y los ajustes del sitio separado se deben comprobar en ese entorno. Un build local correcto no demuestra que se haya validado Netlify.
