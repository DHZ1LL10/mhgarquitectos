# Fase 1: referencia y aceptación

Referencia: commit 62c2efa785a16a141c9da1a2ecfd7054a739a7a0. Rama aislada: phase-1-next-properties. No hacer push ni modificar Netlify productivo.

## Restricciones
- Sin navegador, browser testing, Playwright, Puppeteer o Selenium.
- Sin backend, autenticación, almacenamiento remoto, analytics ni subida de imágenes.
- Originales corporativos y customizador inmutables; hashes en legacy-baseline.json.
- .browser-validation tiene 116 archivos trackeados. .gitignore no los desindexa; se conservan sin leer datos privados, borrar archivos ni reescribir historia. Nunca copiar al artefacto nuevo.

## Criterios
- / y /index.html muestran el sitio corporativo equivalente; mismo contenido, clases e IDs.
- /cocina-customizer.html es documento estático independiente, enlace HTML normal, sin iframe ni montaje React.
- Ocho pasos, selección, cancelar/aplicar, galerías, PDF y WhatsApp conservados.
- /propiedades solo muestra published; fichas con HTML inicial, metadata y 404 para slugs no públicos.
- /admin indica exactamente: “Modo demostración: los cambios se pierden al recargar.” Sin login ni persistencia.
- Estilos nuevos encapsulados; style.css intacto.
- Build, typecheck, lint, hashes, referencias y pruebas Node deben pasar.
- Equivalencia visual y navegación manual pendientes del usuario; no atribuir ejecuci?n a capturas antiguas.

## Comportamientos heredados que no se corrigen
Nueva configuración conserva estado; selección por zonas no efectiva; bisagra inicial distinta del texto de la tarjeta; PDF trunca valores largos y usa folio temporal; favicon del customizador ausente. Se conserva incluso la inserción de datos con innerHTML del customizador, documentada en la auditoría.

## Referencia manual
Comparar originales servidos por HTTP y app nueva en puertos diferentes. No usar file:// para evaluar el PDF. Anchos 1440, 768, 390 y 320 px. No se han creado capturas ni abierto navegador durante esta fase.
