# MHG Arquitectos 🏛️✨

> **Diseñamos. Construimos. Equipamos.**  
> Sitio web oficial y portafolio digital interactivo de **MHG Arquitectos**, firma especializada en diseño arquitectónico, construcción residencial y comercial, cocinas integrales, mobiliario a medida e interiorismo en Fortín de las Flores (Veracruz) y Tuxtepec (Oaxaca).

[![Website](https://img.shields.io/badge/Sitio_Web-mhgarquitectos.com-1a4f2e?style=for-the-badge&logo=google-chrome&logoColor=white)](https://mhgarquitectos.com/)
[![Status](https://img.shields.io/badge/Estado-Producción-success?style=for-the-badge)]()
[![Tecnología](https://img.shields.io/badge/Stack-HTML5_%7C_CSS3_%7C_JS_ES6-blue?style=for-the-badge)]()
[![Responsive](https://img.shields.io/badge/Diseño-100%25_Responsive-orange?style=for-the-badge)]()

---

## 📖 Tabla de Contenidos

1. [Sobre el Proyecto](#-sobre-el-proyecto)
2. [Características Principales](#-características-principales)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
5. [Servicios y Módulos](#-servicios-y-módulos)
6. [Cómo Ejecutar Localmente](#-cómo-ejecutar-localmente)
7. [Optimizaciones y Buenas Prácticas](#-optimizaciones-y-buenas-prácticas)
8. [Contacto y Sucursales](#-contacto-y-sucursales)
9. [Licencia](#-licencia)

---

## 🌿 Sobre el Proyecto

Este repositorio contiene la plataforma web de **MHG Arquitectos** (versión 2.0 Editorial). Fue concebido como una experiencia visual de alta gama que combina elegancia editorial, navegación fluida y canales directos de conversión para clientes potenciales en la región de las Altas Montañas de Veracruz y la Cuenca del Papaloapan.

El sitio presenta la trayectoria de más de 6 años y medio de la firma, destacando proyectos reales ejecutados en obra civil, carpintería arquitectónica y remodelación integral.

---

## ✨ Características Principales

- **🎨 Diseño Editorial v2.0:**
  - Inspirado en portafolios y editoriales de arquitectura contemporánea.
  - Paleta refinada con tonos bosque profundo (`#1a4f2e`), neutros suaves y tipografía dual (*Cormorant Garamond* para títulos y *Inter* para lectura técnica).
- **📂 Portafolio Interactivo con Filtrado:**
  - Navegación fluida por pestañas accesibles (`role="tablist"` / `role="tabpanel"`) entre 4 categorías:
    - *Diseño y Construcción*
    - *Cocinas Integrales*
    - *Mobiliario General*
    - *Interiorismo*
- **🔍 Lightbox Nativo de Alto Rendimiento:**
  - Visualizador modal para imágenes de alta resolución sin dependencias externas.
  - Soporte de navegación por teclado (flechas y `Esc`) y gestos.
- **🗺️ Mapas con Carga Perezosa (Lazy Loading):**
  - Implementación con `IntersectionObserver` para incrustar los mapas interactivos de Google Maps únicamente cuando el usuario navega hacia la sección de sucursales, acelerando drásticamente el First Contentful Paint (FCP).
- **💬 Embudos de Conversión hacia WhatsApp:**
  - Enlaces directos a WhatsApp Business con mensajes contextuales prellenados según el servicio cotizado o la sucursal seleccionada (Fortín o Tuxtepec).
  - Botón flotante siempre visible con animación de pulso sutil.
- **📱 Responsividad Total:**
  - Adaptabilidad para smartphones, tablets, laptops y pantallas de ultra alta resolución.
- **⚡ Cero Dependencias / Carga Ultrarrápida:**
  - Construido 100% en Vanilla HTML, CSS y JavaScript sin necesidad de bundlers pesados.

---

## 📂 Estructura del Proyecto

```text
mhgarquitectos/
│
├── img/                               # Activos multimedia organizados por área
│   ├── cocinas/                       # Proyectos de cocinas integrales y cubiertas
│   ├── construccion/                  # Obras residenciales, fachadas y vistas aéreas
│   ├── interiorismo/                  # Proyectos de interiorismo y remodelaciones
│   ├── mobiliario/                    # Closets a medida, muebles de TV y carpintería
│   ├── logo.jpg                       # Logotipo oficial de MHG Arquitectos
│   └── ...                            # Imágenes principales del Hero y banners
│
├── index.html                         # Estructura semántica, accesibilidad y SEO
├── style.css                          # Tokens de diseño, sistema de rejilla y estilos
├── script.js                          # Lógica interactiva (tabs, lightbox, nav, lazy maps)
└── README.md                          # Documentación del repositorio
```

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico**: Marcado estándar optimizado para motores de búsqueda (SEO) y lectores de pantalla.
- **CSS3 Moderno**:
  - Variables / CSS Custom Properties para el sistema de diseño (`--green`, `--dark`, etc.).
  - CSS Grid y Flexbox para layouts complejos y adaptables.
  - Microinteracciones, transiciones fluidas y animaciones con GPU acceleration.
- **JavaScript (ES6+)**:
  - `IntersectionObserver` para animaciones "reveal on scroll" y carga diferida de mapas iframe.
  - Manejo accesible de eventos del DOM y lightbox modal dinámico.
- **Google Fonts**: Cormorant Garamond & Inter.
- **Open Graph & Twitter Cards**: Optimizado para previsualizaciones en redes sociales y servicios de mensajería.

---

## 📐 Servicios y Módulos

| # | Servicio | Descripción |
|---|----------|-------------|
| **01** | **Diseño y Construcción** | Proyectos residenciales y comerciales desde anteproyecto hasta la entrega de llaves, con supervisión técnica de obra. |
| **02** | **Cocinas Integrales** | Diseño y fabricación a medida con cubiertas de granito/cuarzo, herrajes de primera y acabados finos. |
| **03** | **Mobiliario General** | Closets, muebles de TV, alacenas, vestidores y carpintería arquitectónica adaptada al espacio. |
| **04** | **Interiorismo** | Soluciones integrales de iluminación, texturas, cromática y ambientación de interiores. |

---

## 🚀 Cómo Ejecutar Localmente

No se requiere ningún entorno de compilación ni instalación de paquetes pesados de Node.js.

### Opción 1: Abrir directamente en el navegador
Basta con hacer doble clic en el archivo `index.html` o arrastrarlo a cualquier navegador moderno.

### Opción 2: Usar un servidor estático local (Recomendado)

Si utilizas **Visual Studio Code**:
1. Instala la extensión **Live Server**.
2. Haz clic derecho sobre `index.html` y selecciona **Open with Live Server**.

Si prefieres la terminal:
```bash
# Con Python 3
python -m http.server 3000

# O con npx / serve
npx serve .
```
Luego abre en tu navegador `http://localhost:3000`.

---

## 📊 Optimizaciones y Buenas Prácticas

- **SEO On-Page**: Metadatos descriptivos, URL canónica (`https://mhgarquitectos.com/`), Open Graph tags actualizados y jerarquía de encabezados (`h1` a `h3`).
- **Core Web Vitals**: Atributos `fetchpriority="high"` en la imagen principal del hero, `loading="lazy"` en las imágenes del portafolio y lazy loading bajo demanda para iframes pesados de mapas.
- **Accesibilidad (a11y)**: Roles ARIA (`role="tab"`, `role="tabpanel"`, `aria-label`, `aria-expanded`), contraste cromático verificado y navegación asistida por teclado en componentes modales.

---

## 📍 Contacto y Sucursales

- **Sede Fortín de las Flores (Matriz):**  
  Av 2 Ote. 505, Centro, Fortín de las Flores, Veracruz.  
  Teléfono: `271 704 1499`
- **Sucursal Tuxtepec:**  
  Tuxtepec, Oaxaca — Zona frontera Veracruz.
- **WhatsApp:** [+52 271 105 5612](https://wa.me/5212711055612)
- **Correo Electrónico:** [mhgarq1@gmail.com](mailto:mhgarq1@gmail.com)
- **Redes Sociales:**
  - Instagram: [@mhgarquitectos](https://www.instagram.com/mhgarquitectos/)
  - Facebook: [MHG Arquitectos](https://www.facebook.com/p/MHG-Arquitectos-100063646684954/)

---

## 📄 Licencia

© 2026 **MHG Arquitectos**. Todos los derechos reservados.  
El código fuente y los activos gráficos de proyectos son propiedad de MHG Arquitectos.
