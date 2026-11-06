export type ServiceKey = "construccion" | "mobiliario" | "interiorismo";
export interface QuoteField { id: string; label: string; type: "select" | "text" | "tel" | "date" | "textarea"; required: boolean; options?: string[]; placeholder?: string; }
export interface QuoteConfig { icon: string; title: string; subtitle: string; fields: QuoteField[]; }
export const serviceQuotes: Record<ServiceKey, QuoteConfig> = {
  "construccion": {
    "icon": "🏗️",
    "title": "Diseño y Construcción",
    "subtitle": "Cuéntanos sobre tu proyecto para enviarte una cotización preliminar.",
    "fields": [
      {
        "id": "mc-tipo",
        "label": "Tipo de proyecto",
        "type": "select",
        "required": true,
        "options": [
          "Residencial nueva construcción",
          "Remodelación residencial",
          "Proyecto comercial",
          "Bodega / Industrial",
          "Otro"
        ]
      },
      {
        "id": "mc-pisos",
        "label": "Número de pisos aproximado",
        "type": "select",
        "required": true,
        "options": [
          "1 piso",
          "2 pisos",
          "3 pisos o más",
          "Aún no definido"
        ]
      },
      {
        "id": "mc-m2",
        "label": "Metros cuadrados aproximados",
        "type": "select",
        "required": false,
        "options": [
          "Menos de 80 m²",
          "80 – 150 m²",
          "150 – 300 m²",
          "Más de 300 m²",
          "No lo sé aún"
        ]
      },
      {
        "id": "mc-terreno",
        "label": "¿Cuentas con terreno?",
        "type": "select",
        "required": true,
        "options": [
          "Sí, tengo terreno propio",
          "No, necesito asesoría para conseguir uno",
          "No aplica (remodelación)"
        ]
      },
      {
        "id": "mc-municipio",
        "label": "Municipio / Ciudad de la obra",
        "type": "text",
        "required": true,
        "placeholder": "Ej. Fortín de las Flores, Ver."
      },
      {
        "id": "mc-nombre",
        "label": "Tu nombre completo",
        "type": "text",
        "required": true,
        "placeholder": "Nombre y apellido"
      },
      {
        "id": "mc-tel",
        "label": "Número de teléfono",
        "type": "tel",
        "required": true,
        "placeholder": "+52 271 000 0000"
      },
      {
        "id": "mc-fecha",
        "label": "Fecha preferida para visita / levantamiento",
        "type": "date",
        "required": true
      },
      {
        "id": "mc-notas",
        "label": "Descripción de tu proyecto (opcional)",
        "type": "textarea",
        "required": false,
        "placeholder": "Cuéntanos brevemente lo que tienes en mente..."
      }
    ]
  },
  "mobiliario": {
    "icon": "🪵",
    "title": "Mobiliario General",
    "subtitle": "Dinos qué mueble necesitas y te orientamos con la cotización.",
    "fields": [
      {
        "id": "mm-tipo",
        "label": "Tipo de mueble",
        "type": "select",
        "required": true,
        "options": [
          "Closet",
          "Mueble de TV",
          "Alacena",
          "Puerta de madera",
          "Vestidor",
          "Mueble de baño",
          "Librería",
          "Otro"
        ]
      },
      {
        "id": "mm-dimensiones",
        "label": "Dimensiones aproximadas",
        "type": "select",
        "required": false,
        "options": [
          "Pequeño (menos de 1.5m)",
          "Mediano (1.5 – 2.4m)",
          "Grande (más de 2.4m)",
          "No lo sé aún"
        ]
      },
      {
        "id": "mm-material",
        "label": "Material preferido",
        "type": "select",
        "required": false,
        "options": [
          "Melamina (económico)",
          "MDF con chapa",
          "Madera sólida",
          "Sin preferencia / Lo que recomienden"
        ]
      },
      {
        "id": "mm-color",
        "label": "Tono o color aproximado",
        "type": "select",
        "required": false,
        "options": [
          "Blanco / Claro",
          "Gris",
          "Madera natural",
          "Oscuro / Wengué",
          "No tengo preferencia"
        ]
      },
      {
        "id": "mm-led",
        "label": "¿Incluir iluminación LED?",
        "type": "select",
        "required": false,
        "options": [
          "Sí, me interesa",
          "No por ahora",
          "No sé, que me asesoren"
        ]
      },
      {
        "id": "mm-nombre",
        "label": "Tu nombre completo",
        "type": "text",
        "required": true,
        "placeholder": "Nombre y apellido"
      },
      {
        "id": "mm-tel",
        "label": "Número de teléfono",
        "type": "tel",
        "required": true,
        "placeholder": "+52 271 000 0000"
      },
      {
        "id": "mm-municipio",
        "label": "Municipio / Ciudad",
        "type": "text",
        "required": true,
        "placeholder": "Ej. Tuxtepec, Oax."
      },
      {
        "id": "mm-fecha",
        "label": "Fecha preferida para levantamiento",
        "type": "date",
        "required": true
      }
    ]
  },
  "interiorismo": {
    "icon": "🎨",
    "title": "Interiorismo",
    "subtitle": "Cuéntanos sobre el espacio que quieres transformar.",
    "fields": [
      {
        "id": "mi-espacio",
        "label": "Tipo de espacio",
        "type": "select",
        "required": true,
        "options": [
          "Sala / Comedor",
          "Recámara principal",
          "Recámara secundaria",
          "Oficina en casa",
          "Local comercial",
          "Departamento completo",
          "Casa completa",
          "Otro"
        ]
      },
      {
        "id": "mi-m2",
        "label": "Metros cuadrados aproximados del espacio",
        "type": "select",
        "required": false,
        "options": [
          "Menos de 20 m²",
          "20 – 50 m²",
          "50 – 100 m²",
          "Más de 100 m²",
          "No lo sé"
        ]
      },
      {
        "id": "mi-estilo",
        "label": "Estilo que te atrae",
        "type": "select",
        "required": false,
        "options": [
          "Moderno / Minimalista",
          "Rústico / Industrial",
          "Clásico / Elegante",
          "Contemporáneo",
          "Tropical / Natural",
          "No tengo preferencia"
        ]
      },
      {
        "id": "mi-presupuesto",
        "label": "Rango de presupuesto aproximado",
        "type": "select",
        "required": false,
        "options": [
          "Menos de $30,000 MXN",
          "$30,000 – $80,000 MXN",
          "$80,000 – $200,000 MXN",
          "Más de $200,000 MXN",
          "Prefiero no indicarlo"
        ]
      },
      {
        "id": "mi-nombre",
        "label": "Tu nombre completo",
        "type": "text",
        "required": true,
        "placeholder": "Nombre y apellido"
      },
      {
        "id": "mi-tel",
        "label": "Número de teléfono",
        "type": "tel",
        "required": true,
        "placeholder": "+52 271 000 0000"
      },
      {
        "id": "mi-municipio",
        "label": "Municipio / Ciudad",
        "type": "text",
        "required": true,
        "placeholder": "Ej. Fortín de las Flores, Ver."
      },
      {
        "id": "mi-fecha",
        "label": "Fecha preferida para visita",
        "type": "date",
        "required": true
      }
    ]
  }
};
