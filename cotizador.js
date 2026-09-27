/* ═══════════════════════════════════════════════════════════
   MHG Cocinas — Configurador v4.1
   cotizador.js
═══════════════════════════════════════════════════════════ */

/* ─── STATE ─── */
var state = {
  cliente:   { nombre:'', tel:'', fecha:'', hora:'', sucursal:'', asesor:'', dir:'', obs:'' },
  situacion: null,
  interior:  null,
  frentes:   {},
  bisagra:   'Hettich oculta cierre suave',
  corredera: null,
  cajones:   [],
  basurero:  null,
  especias:  null,
  modulos:   [],
  cubierta:  null,
  cubPrecio: null,
  cubiertaCategoria: null,
  cubiertaVariante: null,
  extras:    [],
};

/* ─── STEPS META ─── */
var STEPS = [
  { label:'Datos del cliente',   short: function(){ return state.cliente.nombre || ''; } },
  { label:'Situación actual',    short: function(){ var m={'sin-cocina':'Sin cocina','barra-concreto':'Base de concreto','remodelacion':'Remodelación'}; return m[state.situacion]||''; } },
  { label:'Tableros interiores', short: function(){ return state.interior ? (state.interior==='blanco-frosty'?'Blanco Frosty':'Gris Oxford') : ''; } },
  { label:'Frentes exteriores',  short: function(){ var k=Object.keys(state.frentes); return k.length ? k.length+' línea'+(k.length!==1?'s':'') : ''; } },
  { label:'Herrajes',            short: function(){ return state.corredera ? state.corredera.split(' ').slice(0,2).join(' ') : ''; } },
  { label:'Cubierta',            short: function(){ return state.cubierta || ''; } },
  { label:'Extras',              short: function(){ return state.extras.length ? state.extras.length+' extra'+(state.extras.length!==1?'s':'') : 'Ninguno'; } },
  { label:'Resumen',             short: function(){ return ''; } },
];

var STEP_HEADERS = [
  { eyebrow:'Paso 1 de 8', title:'Tus <em>datos</em>',            sub:'Llena tu información de contacto para personalizar la cotización.' },
  { eyebrow:'Paso 2 de 8', title:'<em>Situación</em> actual',     sub:'Cuéntanos cómo está el espacio hoy para ajustar la propuesta.' },
  { eyebrow:'Paso 3 de 8', title:'<em>Tableros</em> interiores',  sub:'El acabado interior de todos los muebles lleva este material.' },
  { eyebrow:'Paso 4 de 8', title:'<em>Frentes</em> exteriores',   sub:'Los frentes son las puertas visibles de tu cocina. Puedes combinar líneas y colores por zonas.' },
  { eyebrow:'Paso 5 de 8', title:'<em>Herrajes</em>',             sub:'Selecciona los herrajes de tu cocina. Cada sección se despliega al tocarla.' },
  { eyebrow:'Paso 6 de 8', title:'<em>Cubierta</em>',             sub:'El material de la superficie de trabajo de tu cocina.' },
  { eyebrow:'Paso 7 de 8', title:'<em>Extras</em>',               sub:'Agrega elementos adicionales que complementen tu proyecto.' },
  { eyebrow:'Paso 8 de 8', title:'Tu <em>resumen</em>',           sub:'Revisa la configuración y descarga o comparte tu preconfiguración.' },
];

/* ─── COLOR PALETTES per frente line ─── */
var PALETTES = {
  economica: [
    {name:'Blanco',      hex:'#FFFFFF'},{name:'Crema',       hex:'#F5EDD6'},
    {name:'Beige',       hex:'#E8D8B8'},{name:'Gris claro',  hex:'#D0D0CC'},
    {name:'Gris medio',  hex:'#A0A09A'},{name:'Gris oscuro', hex:'#6A6A66'},
    {name:'Negro',       hex:'#222222'},{name:'Nogal',       hex:'#7A4E2D'},
    {name:'Cerezo',      hex:'#8B3030'},
  ],
  arauco: [
    {"name":"Chardonnay",       "swatch":"img/customizer/COLORES ARAUCO/Chardonnay.jpg",        "kitchen":"img/customizer/COLORES ARAUCO/cocinaChardonnay.jpg"},
    {"name":"Ámbar",            "swatch":"img/customizer/COLORES ARAUCO/ambar.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinaambar.jpg"},
    {"name":"Andhuac",          "swatch":"img/customizer/COLORES ARAUCO/anahuac.jpg",            "kitchen":"img/customizer/COLORES ARAUCO/cocinaanahuac.jpg"},
    {"name":"Blanco Absoluto",  "swatch":"img/customizer/COLORES ARAUCO/blancoabsoluto.jpg",     "kitchen":"img/customizer/COLORES ARAUCO/cocinablancoabsoluto.jpg"},
    {"name":"Blanco Frosty",    "swatch":"img/customizer/COLORES ARAUCO/blancofrosty.jpg",       "kitchen":"img/customizer/COLORES ARAUCO/cocinablancofrosty.jpg"},
    {"name":"Cairo",            "swatch":"img/customizer/COLORES ARAUCO/cairo.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinacairo.jpg"},
    {"name":"Cerezo",           "swatch":"img/customizer/COLORES ARAUCO/cerezo.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinacerezo.jpg"},
    {"name":"Copal",            "swatch":"img/customizer/COLORES ARAUCO/copal.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinacopal.jpg"},
    {"name":"Durango",          "swatch":"img/customizer/COLORES ARAUCO/durango.jpg",            "kitchen":"img/customizer/COLORES ARAUCO/cocinadurango.jpg"},
    {"name":"Ébano Indio",      "swatch":"img/customizer/COLORES ARAUCO/ebanoindi.jpg",          "kitchen":"img/customizer/COLORES ARAUCO/cocinaebanoindi.jpg"},
    {"name":"Encino Polar",     "swatch":"img/customizer/COLORES ARAUCO/encinopolar.jpg",        "kitchen":"img/customizer/COLORES ARAUCO/cocinaencinopolar.jpg"},
    {"name":"Filigrana",        "swatch":"img/customizer/COLORES ARAUCO/filigrana.jpg",          "kitchen":"img/customizer/COLORES ARAUCO/cocinafiligrana.jpg"},
    {"name":"Fresno Bruma",     "swatch":"img/customizer/COLORES ARAUCO/fresnobruma.jpg",        "kitchen":"img/customizer/COLORES ARAUCO/cocinafresnobruma.jpg"},
    {"name":"Gris",             "swatch":"img/customizer/COLORES ARAUCO/gris.jpg",               "kitchen":"img/customizer/COLORES ARAUCO/cocinagris.jpg"},
    {"name":"Gris Claro",       "swatch":"img/customizer/COLORES ARAUCO/grisclaro.jpg",          "kitchen":"img/customizer/COLORES ARAUCO/cocinagrisclaro.jpg"},
    {"name":"Latte",            "swatch":"img/customizer/COLORES ARAUCO/latte.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinalatte.jpg"},
    {"name":"Malta",            "swatch":"img/customizer/COLORES ARAUCO/malta.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinamalta.jpg"},
    {"name":"Monarca",          "swatch":"img/customizer/COLORES ARAUCO/monarca.jpg",            "kitchen":"img/customizer/COLORES ARAUCO/cocinamonarca.jpg"},
    {"name":"Negro",            "swatch":"img/customizer/COLORES ARAUCO/negro.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinanegro.jpg"},
    {"name":"Negro Forest",     "swatch":"img/customizer/COLORES ARAUCO/negroforest.jpg",        "kitchen":"img/customizer/COLORES ARAUCO/cocinanegroforest.jpg"},
    {"name":"Níquel",           "swatch":"img/customizer/COLORES ARAUCO/niquel.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinaniquel.jpg"},
    {"name":"Nogal Británico",  "swatch":"img/customizer/COLORES ARAUCO/nogalbritanico.jpg",     "kitchen":"img/customizer/COLORES ARAUCO/cocinanogalbritanico.jpg"},
    {"name":"Nogal Mérida",     "swatch":"img/customizer/COLORES ARAUCO/roblemerida.jpg",        "kitchen":"img/customizer/COLORES ARAUCO/cocinanogalmerida.jpg"},
    {"name":"Nogal Neo",        "swatch":"img/customizer/COLORES ARAUCO/nogalneo.jpg",           "kitchen":"img/customizer/COLORES ARAUCO/cocinanogalneo.jpg"},
    {"name":"Oporto",           "swatch":"img/customizer/COLORES ARAUCO/oporto.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinaoporto.jpg"},
    {"name":"Oxford",           "swatch":"img/customizer/COLORES ARAUCO/oxford.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinaoxford.jpg"},
    {"name":"Precompuesto Ceniza","swatch":"img/customizer/COLORES ARAUCO/precompuestoceniza.jpg","kitchen":"img/customizer/COLORES ARAUCO/cocinaprecompuestoceniza.jpg"},
    {"name":"Rioja",            "swatch":"img/customizer/COLORES ARAUCO/rioja.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinarioja.jpg"},
    {"name":"Roble Santana",    "swatch":"img/customizer/COLORES ARAUCO/roblesantana.jpg",       "kitchen":"img/customizer/COLORES ARAUCO/cocinaroblesantana.jpg"},
    {"name":"Romero",           "swatch":"img/customizer/COLORES ARAUCO/romero.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinaromero.jpg"},
    {"name":"Sisal",            "swatch":"img/customizer/COLORES ARAUCO/sisal.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinasisal.jpg"},
    {"name":"Tulum",            "swatch":"img/customizer/COLORES ARAUCO/tulum.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinatulum.jpg"},
    {"name":"Turmalina",        "swatch":"img/customizer/COLORES ARAUCO/turmalina.jpg",          "kitchen":"img/customizer/COLORES ARAUCO/cocinaturmalina.jpg"},
    {"name":"Visón",            "swatch":"img/customizer/COLORES ARAUCO/vison.jpg",              "kitchen":"img/customizer/COLORES ARAUCO/cocinavison.jpg"},
    {"name":"Wengue",           "swatch":"img/customizer/COLORES ARAUCO/wengue.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinawengue.jpg"},
    {"name":"Zafiro",           "swatch":"img/customizer/COLORES ARAUCO/zafiro.jpg",             "kitchen":"img/customizer/COLORES ARAUCO/cocinazafiro.jpg"}
  ],
  decorlux: [
    // ── Alto Brillo (High Gloss) ──
    {"name":"HG · Acryl Glass",       "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_white.webp",              "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Acryl_Glass_Cocina-768x623.webp"},
    {"name":"HG · Beige",             "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_beige.webp",              "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Beige_Cocina_1-768x623.webp"},
    {"name":"HG · Beige Metalic",     "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_beige_metalic-2.webp",   "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Beige_Metalic_Cocina-768x623.webp"},
    {"name":"HG · Black",             "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_black.webp",             "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Black_Cocina-768x623.webp"},
    {"name":"HG · Blanco",            "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_blanco.webp",            "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Blanco_Cocina-768x623.webp"},
    {"name":"HG · Dark Grey",         "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_dark_grey.webp",         "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Dark_Grey_Cocina-768x623.webp"},
    {"name":"HG · Grey",              "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_grey.webp",              "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Grey_Cocina-768x623.webp"},
    {"name":"HG · Negro Metalizado",  "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_black_metalic-1.webp",  "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Negro_Metalizado_Cocina-768x623.webp"},
    {"name":"HG · Rojo",              "hex":"#C0392B", "swatch":null,                                                              "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Rojo_estandar_Cocina-768x623.webp"},
    {"name":"HG · Silver Claro",      "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_silver_metalic_claro-1.webp", "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Silver_Metallic_Claro_Cocina-768x623.webp"},
    {"name":"HG · Silver Oscuro",     "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_silver_metalic_oscuro-1.webp","kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Silver_Metallic_Oscuro_Cocina-768x623.webp"},
    // ── Mate ──
    {"name":"Mate · Beige",           "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_mate_beige.webp",           "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Beige_Cocina-1024x831.webp"},
    {"name":"Mate · Beige Metallic",  "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_mate_beige_metalic-1.webp","kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Beige_metallic_Cocina-1024x831.webp"},
    {"name":"Mate · Black",           "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_mate_black.webp",           "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Black_Cocina-768x623.webp"},
    {"name":"Mate · Blanco",          "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_blanco.webp",            "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Blanco_Cocina-768x623.webp"},
    {"name":"Mate · Dark Grey",       "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_mate_dark_grey.webp",       "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Dark_Grey_Cocina-768x623.webp"},
    {"name":"Mate · Grey",            "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_mate_grey.webp",            "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Grey_Cocina-768x623.webp"},
    {"name":"Mate · Grey Metallic",   "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_mate_grey_metalic-1.webp", "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Grey_metallic_Cocina-768x623.webp"},
    {"name":"Mate · Grey Sand",       "swatch":"img/customizer/COLORES DECORLUX/tablero_acrilico_1800_ar_hg_grey_sand.webp",        "kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_White_11082_Cocina-768x623.webp"},
    {"name":"Mate · White 1982",      "swatch":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_Top_Matt_Mate_White_1982.webp","kitchen":"img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800__Acrilico_Top_Matt_Mate_Blanco_Cocina-768x623.webp"},
    // ── Supramatte ──
    {"name":"SM · Antracita",    "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_antracita.webp",      "kitchen":null},
    {"name":"SM · Aqua Grey",    "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_aqua_grey.webp",      "kitchen":null},
    {"name":"SM · Arena",        "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_arena.webp",          "kitchen":null},
    {"name":"SM · Artic White",  "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_artic_white.webp",    "kitchen":null},
    {"name":"SM · Congo",        "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_congo.webp",          "kitchen":null},
    {"name":"SM · Grafito",      "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_grafito.webp",        "kitchen":null},
    {"name":"SM · Gris Cálido",  "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_gris_calido.webp",   "kitchen":null},
    {"name":"SM · Gris Humo",    "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_gris_humo.webp",     "kitchen":null},
    {"name":"SM · Menta",        "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_menta.webp",         "kitchen":null},
    {"name":"SM · Negro",        "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_negro.webp",         "kitchen":null},
    {"name":"SM · Stone G Bay",  "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_stone_g_bay.webp",   "kitchen":null},
    {"name":"SM · Terracota",    "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_terracota.webp",     "kitchen":null},
    {"name":"SM · Ványla",       "swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_vanyla.webp",        "kitchen":null},
    {"name":"SM · Verde Esmeralda","swatch":"img/customizer/COLORES DECORLUX/colores matte/tablero_supramatte_verde_esmeralda.webp","kitchen":null}
  ],
  transformad: [
    {"name":"Bosco",        "swatch":"img/customizer/TMATT/BOSCO-PMT969M-scaled-600x600.jpg",       "kitchen":"img/customizer/TMATT/cocinabosco.jpg"},
    {"name":"Legno Fumé",   "swatch":"img/customizer/TMATT/Legno-Fume-scaled.jpg",                  "kitchen":"img/customizer/TMATT/COCINALEGNO.jpg"},
    {"name":"Mare",         "swatch":"img/customizer/TMATT/MARE-PMT5726M-scaled-600x600.jpg",       "kitchen":null},
    {"name":"Ópalo",        "swatch":"img/customizer/TMATT/OPALO-PMT0423M-600x600.jpg",             "kitchen":null},
    {"name":"Bianco Zen",   "swatch":"img/customizer/TMATT/PMT002M-Bianco-Zen-600x600.png",         "kitchen":"img/customizer/TMATT/cocinablancozen.jpg"},
    {"name":"Ártico",       "swatch":"img/customizer/TMATT/PMT003M-ARTICO-1-600x600.png",           "kitchen":"img/customizer/TMATT/cocinaartico.jpg"},
    {"name":"Nero",         "swatch":"img/customizer/TMATT/PMT1303M-Nero-1-600x600.png",            "kitchen":"img/customizer/TMATT/cocinanero.jpg"},
    {"name":"Lignite",      "swatch":"img/customizer/TMATT/PMT2125M-LIGNITE-1-scaled-600x600.jpg",  "kitchen":"img/customizer/TMATT/cocinalignite.jpg"},
    {"name":"Nuvola",       "swatch":"img/customizer/TMATT/PMT304M-Nuvola-600x600.png",             "kitchen":"img/customizer/TMATT/cocinanuvola.jpg"},
    {"name":"Cotton",       "swatch":"img/customizer/TMATT/PMT3325M-Cotton-600x600.png",            "kitchen":"img/customizer/TMATT/cocinacotton.png"},
    {"name":"Visone",       "swatch":"img/customizer/TMATT/PMT4504M-Visone-1-600x600.png",          "kitchen":"img/customizer/TMATT/cocinavisone.jpg"},
    {"name":"Smeraldo",     "swatch":"img/customizer/TMATT/PMT5025M-SMERALDO-1-scaled-600x600.jpg", "kitchen":"img/customizer/TMATT/cocinasmeraldo.jpg"},
    {"name":"Terracotta",   "swatch":"img/customizer/TMATT/PMT6125M-TERRACOTTA-scaled-600x600.jpg", "kitchen":"img/customizer/TMATT/cocinaterracota.jpg"},
    {"name":"Arena",        "swatch":"img/customizer/TMATT/PMT729M-Arena-1-600x600.png",            "kitchen":"img/customizer/TMATT/cocinaarena.jpg"},
    {"name":"Antracite",    "swatch":"img/customizer/TMATT/PMT761M-Antracite-1-600x600.png",        "kitchen":"img/customizer/TMATT/cocinaantracite.png"},
    {"name":"Rosso",        "swatch":"img/customizer/TMATT/ROSSO-PMT4125M-scaled-600x600.jpg",      "kitchen":null},
    {"name":"Elba",         "swatch":"img/customizer/TMATT/Tmatt-Elba-PMT5628M--600x600.jpg",       "kitchen":"img/customizer/TMATT/cocinaelba.jpg"},
    {"name":"Toscano",      "swatch":"img/customizer/TMATT/Tmatt-Toscano-PMT5627M-600x600.jpg",     "kitchen":"img/customizer/TMATT/cocinatoscano.jpg"}
  ]
};


/* ─── HERRAJE SECTIONS ─── */
// General material guidance supplied for each category; not variant-specific.
var CUBIERTA_INFO = {
  "solida": {
    "titulo": "Base sólida Corian",
    "precioBase": 6500,
    "descripcion": "Superficie homogénea y no porosa que permite diseños continuos, uniones discretas y fácil mantenimiento.",
    "imagen": "img/customizer/superficiesolida.jpg",
    "destacada": "Reparable y renovable",
    "ventajas": [
      "No porosa.",
      "Fácil de limpiar.",
      "Posibilidad de uniones visualmente continuas.",
      "Los rayones y daños menores pueden repararse/restaurarse.",
      "Permite gran flexibilidad de diseño.",
      "Adecuada para integrar cubiertas y elementos con apariencia continua."
    ],
    "caracteristicas": {
      "manchas": {
        "titulo": "Manchas",
        "nivel": "Buena",
        "detalle": "Su superficie no porosa facilita retirar derrames comunes. Se recomienda limpiarlos oportunamente."
      },
      "calor": {
        "titulo": "Calor",
        "nivel": "Moderada",
        "detalle": "Debe evitarse colocar ollas o sartenes muy calientes directamente sobre la superficie. Se recomienda usar protectores térmicos."
      },
      "rayaduras": {
        "titulo": "Rayaduras",
        "nivel": "Moderada",
        "detalle": "Puede presentar marcas con el uso. Utilizar tabla de corte. Una ventaja es que muchos rayones superficiales pueden restaurarse."
      },
      "porosidad": {
        "titulo": "Porosidad",
        "nivel": "Prácticamente nula / no porosa"
      },
      "mantenimiento": {
        "titulo": "Mantenimiento",
        "nivel": "Fácil",
        "detalle": "Agua jabonosa y limpieza habitual. Muchos daños superficiales pueden repararse."
      },
      "sellado": {
        "titulo": "Sellado",
        "nivel": "No requiere sellado periódico."
      }
    }
  },
  "granito": {
    "titulo": "Granito",
    "precioBase": 8500,
    "descripcion": "Piedra natural de gran dureza y durabilidad. Cada placa presenta vetas y variaciones únicas.",
    "imagen": "img/customizer/granito/granitosangabrielcocina.webp",
    "destacada": "Piedra natural: cada placa es única",
    "ventajas": [
      "Material natural.",
      "Cada pieza es única.",
      "Alta resistencia al rayado.",
      "Alta resistencia al calor.",
      "Muy durable.",
      "Adecuado para superficies de trabajo intenso."
    ],
    "caracteristicas": {
      "manchas": {
        "titulo": "Manchas",
        "nivel": "Alta con cuidado adecuado",
        "detalle": "La absorción suele ser baja, pero al ser piedra natural puede variar. Algunas piedras pueden beneficiarse de un sellador/impregnador."
      },
      "calor": {
        "titulo": "Calor",
        "nivel": "Alta",
        "detalle": "Soporta temperaturas elevadas, aunque se recomienda utilizar protectores para evitar choques térmicos localizados."
      },
      "rayaduras": {
        "titulo": "Rayaduras",
        "nivel": "Alta",
        "detalle": "Su dureza proporciona muy buena resistencia al uso cotidiano."
      },
      "porosidad": {
        "titulo": "Porosidad",
        "nivel": "Baja, pero variable",
        "detalle": "Es piedra natural y la absorción depende de la variedad."
      },
      "mantenimiento": {
        "titulo": "Mantenimiento",
        "nivel": "Moderado",
        "detalle": "Limpiar con productos suaves o neutros. Evitar productos agresivos no recomendados para piedra natural."
      },
      "sellado": {
        "titulo": "Sellado",
        "nivel": "Depende de la piedra",
        "detalle": "Algunos granitos no lo requieren y otros pueden beneficiarse de un impregnador para aumentar su resistencia a manchas."
      }
    }
  },
  "cuarzo": {
    "titulo": "Cuarzo",
    "precioBase": 12000,
    "descripcion": "Superficie de cuarzo de alta densidad, no porosa y de mantenimiento sencillo, disponible en una amplia variedad de diseños.",
    "imagen": "img/customizer/cuarzo/Marquina-Black-1024x758.jpg",
    "destacada": "Bajo mantenimiento y gran resistencia a manchas",
    "aclaracion": "Cuarzo manufacturado/ingenierizado para cubiertas, no cuarcita natural.",
    "ventajas": [
      "No porosa.",
      "Alta resistencia a manchas.",
      "Alta resistencia al rayado.",
      "Fácil limpieza.",
      "No requiere sellado periódico.",
      "Apariencia consistente.",
      "Amplia variedad de colores y diseños."
    ],
    "caracteristicas": {
      "manchas": {
        "titulo": "Manchas",
        "nivel": "Alta",
        "detalle": "Su baja absorción y superficie no porosa ofrecen muy buena resistencia a derrames cotidianos."
      },
      "calor": {
        "titulo": "Calor",
        "nivel": "Buena, con precauciones",
        "detalle": "Es resistente al calor cotidiano, pero temperaturas muy elevadas pueden dañarlo. Utilizar siempre protector o salvamanteles para ollas y sartenes calientes."
      },
      "rayaduras": {
        "titulo": "Rayaduras",
        "nivel": "Alta",
        "detalle": "Presenta buena resistencia al desgaste cotidiano. Aun así se recomienda utilizar tabla de corte."
      },
      "porosidad": {
        "titulo": "Porosidad",
        "nivel": "No porosa"
      },
      "mantenimiento": {
        "titulo": "Mantenimiento",
        "nivel": "Muy fácil",
        "detalle": "Normalmente basta agua, jabón y limpieza habitual."
      },
      "sellado": {
        "titulo": "Sellado",
        "nivel": "No requiere sellado periódico."
      }
    }
  },
  "sinterizado": {
    "titulo": "Piedra sinterizada",
    "precioBase": 17000,
    "descripcion": "Superficie mineral de muy baja porosidad diseñada para ofrecer alta resistencia frente al uso intenso, calor y agentes cotidianos.",
    "imagen": "img/customizer/piedrasinterizada/allure-black-cocina.webp",
    "destacada": "Máximo desempeño técnico para uso intensivo",
    "ventajas": [
      "Muy baja absorción de agua.",
      "Alta resistencia a manchas.",
      "Alta resistencia a rayaduras.",
      "Alta resistencia al calor.",
      "Alta resistencia a la abrasión.",
      "Buena resistencia química.",
      "Resistencia a radiación UV.",
      "Fácil mantenimiento.",
      "No requiere sellado periódico.",
      "Adecuada para aplicaciones interiores y, cuando el producto lo permita, exteriores."
    ],
    "caracteristicas": {
      "manchas": {
        "titulo": "Manchas",
        "nivel": "Muy alta",
        "detalle": "La muy baja porosidad dificulta que líquidos y manchas comunes penetren en la superficie."
      },
      "calor": {
        "titulo": "Calor",
        "nivel": "Muy alta",
        "detalle": "El material presenta elevada estabilidad y resistencia térmica."
      },
      "rayaduras": {
        "titulo": "Rayaduras",
        "nivel": "Muy alta",
        "detalle": "Está diseñado para soportar uso intenso y ofrece alta resistencia al rayado y abrasión."
      },
      "porosidad": {
        "titulo": "Porosidad",
        "nivel": "Muy baja / prácticamente nula"
      },
      "mantenimiento": {
        "titulo": "Mantenimiento",
        "nivel": "Muy fácil",
        "detalle": "Generalmente puede mantenerse con agua, jabón neutro y limpieza habitual."
      },
      "sellado": {
        "titulo": "Sellado",
        "nivel": "No requiere sellado periódico."
      },
      "uv": {
        "titulo": "Resistencia UV",
        "nivel": "Alta",
        "detalle": "La piedra sinterizada presenta buena estabilidad frente a radiación ultravioleta."
      },
      "quimica": {
        "titulo": "Resistencia química",
        "nivel": "Alta",
        "detalle": "Presenta buena resistencia frente a productos habituales y agentes químicos compatibles."
      }
    }
  }
};

var CUBIERTA_VARIANTES = {
  "solida": [],
  "cuarzo": [
    {
      "id": "cuarzo-black-mirror",
      "nombre": "Black Mirror",
      "imagen": "img/customizer/cuarzo/black-mirror-01-1.jpg",
      "imagenes": [
        "img/customizer/cuarzo/black-mirror-01-1.jpg",
        "img/customizer/cuarzo/Black-mirror-placa-completaa-1-1536x1023.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-dubai",
      "nombre": "Calacatta Dubai",
      "imagen": "img/customizer/cuarzo/Calacatta Dubai.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta Dubai.jpg",
        "img/customizer/cuarzo/Calacatta Dubai cocina.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-miel",
      "nombre": "Calacatta Miel",
      "imagen": "img/customizer/cuarzo/Calacatta Miel.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta Miel.jpg",
        "img/customizer/cuarzo/Calacatta Miel cocina.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-napoli",
      "nombre": "Calacatta Napoli",
      "imagen": "img/customizer/cuarzo/Calacatta Napoli.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta Napoli.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-panal",
      "nombre": "Calacatta Panal",
      "imagen": "img/customizer/cuarzo/Calacatta Panal.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta Panal.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-sahara",
      "nombre": "Calacatta Sahara",
      "imagen": "img/customizer/cuarzo/CALACATTA SAHARA.jpg",
      "imagenes": [
        "img/customizer/cuarzo/CALACATTA SAHARA.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-volcan",
      "nombre": "Calacatta Volcan",
      "imagen": "img/customizer/cuarzo/Calacatta Volcan.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta Volcan.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-oro",
      "nombre": "Calacatta Oro",
      "imagen": "img/customizer/cuarzo/Calacatta-Oro-detalle-veta-1024x576.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta-Oro-detalle-veta-1024x576.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-statuario",
      "nombre": "Calacatta Statuario",
      "imagen": "img/customizer/cuarzo/Calacatta-Statuario.webp",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta-Statuario.webp",
        "img/customizer/cuarzo/calacatta-statuario-detallee-1024x576.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-storm",
      "nombre": "Calacatta Storm",
      "imagen": "img/customizer/cuarzo/Calacatta-Storm-1024x1024.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta-Storm-1024x1024.jpg",
        "img/customizer/cuarzo/Calacatta-Storm-placa-1536x864.jpg"
      ]
    },
    {
      "id": "cuarzo-calacatta-vintage",
      "nombre": "Calacatta Vintage",
      "imagen": "img/customizer/cuarzo/Calacatta-Vintage-1.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Calacatta-Vintage-1.jpg",
        "img/customizer/cuarzo/calacatta-vintage-detalle-1024x576.jpg"
      ]
    },
    {
      "id": "cuarzo-carrara",
      "nombre": "Carrara",
      "imagen": "img/customizer/cuarzo/Carrara-1.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Carrara-1.jpg",
        "img/customizer/cuarzo/carrara-detalle-veta-1024x682.jpg"
      ]
    },
    {
      "id": "cuarzo-cosmopolitan",
      "nombre": "Cosmopolitan",
      "imagen": "img/customizer/cuarzo/cosmopolitan-detalle-1024x576.jpg",
      "imagenes": [
        "img/customizer/cuarzo/cosmopolitan-detalle-1024x576.jpg"
      ]
    },
    {
      "id": "cuarzo-everest-white",
      "nombre": "Everest White",
      "imagen": "img/customizer/cuarzo/Everest-White-1-1-1-1024x684.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Everest-White-1-1-1-1024x684.jpg",
        "img/customizer/cuarzo/everest-white-placa-2-1-1024x682.jpg"
      ]
    },
    {
      "id": "cuarzo-golden-night",
      "nombre": "Golden Night",
      "imagen": "img/customizer/cuarzo/golden-night-02.png",
      "imagenes": [
        "img/customizer/cuarzo/golden-night-02.png",
        "img/customizer/cuarzo/golden-night-detalle-veta-1024x682.jpg"
      ]
    },
    {
      "id": "cuarzo-gris-cemento",
      "nombre": "Gris Cemento",
      "imagen": "img/customizer/cuarzo/gris_cemento.jpg",
      "imagenes": [
        "img/customizer/cuarzo/gris_cemento.jpg"
      ]
    },
    {
      "id": "cuarzo-italian-beige",
      "nombre": "Italian Beige",
      "imagen": "img/customizer/cuarzo/italian-beige.jpg",
      "imagenes": [
        "img/customizer/cuarzo/italian-beige.jpg"
      ]
    },
    {
      "id": "cuarzo-italian-gray",
      "nombre": "Italian Gray",
      "imagen": "img/customizer/cuarzo/italian-gray-detalle-1024x576.jpg",
      "imagenes": [
        "img/customizer/cuarzo/italian-gray-detalle-1024x576.jpg"
      ]
    },
    {
      "id": "cuarzo-italian-white",
      "nombre": "Italian White",
      "imagen": "img/customizer/cuarzo/Italian-White.jpeg",
      "imagenes": [
        "img/customizer/cuarzo/Italian-White.jpeg",
        "img/customizer/cuarzo/italian-white-detalle.jpg"
      ]
    },
    {
      "id": "cuarzo-luminous-black",
      "nombre": "Luminous Black",
      "imagen": "img/customizer/cuarzo/luminous-black-detalle-1024x682.jpg",
      "imagenes": [
        "img/customizer/cuarzo/luminous-black-detalle-1024x682.jpg"
      ]
    },
    {
      "id": "cuarzo-luminous-white",
      "nombre": "Luminous White",
      "imagen": "img/customizer/cuarzo/Luminous-White-detalle-1024x682.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Luminous-White-detalle-1024x682.jpg"
      ]
    },
    {
      "id": "cuarzo-marquina-black",
      "nombre": "Marquina Black",
      "imagen": "img/customizer/cuarzo/Marquina-Black-1024x758.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Marquina-Black-1024x758.jpg",
        "img/customizer/cuarzo/Marquina-Black-placa-completa-1536x864.jpg"
      ]
    },
    {
      "id": "cuarzo-mirage",
      "nombre": "Mirage",
      "imagen": "img/customizer/cuarzo/MIRAGE-PLACA-COMPLETA-1024x576.jpg",
      "imagenes": [
        "img/customizer/cuarzo/MIRAGE-PLACA-COMPLETA-1024x576.jpg"
      ]
    },
    {
      "id": "cuarzo-ourus-black",
      "nombre": "Ourus Black",
      "imagen": "img/customizer/cuarzo/ourus-black-1024x683.jpg",
      "imagenes": [
        "img/customizer/cuarzo/ourus-black-1024x683.jpg"
      ]
    },
    {
      "id": "cuarzo-persa",
      "nombre": "Persa",
      "imagen": "img/customizer/cuarzo/persa.jpg",
      "imagenes": [
        "img/customizer/cuarzo/persa.jpg",
        "img/customizer/cuarzo/persacocina.jpg"
      ]
    },
    {
      "id": "cuarzo-pure-black",
      "nombre": "Pure Black",
      "imagen": "img/customizer/cuarzo/pure-black-1024x576.png",
      "imagenes": [
        "img/customizer/cuarzo/pure-black-1024x576.png",
        "img/customizer/cuarzo/pure-black-1-1024x632.png"
      ]
    },
    {
      "id": "cuarzo-spark-white",
      "nombre": "Spark White",
      "imagen": "img/customizer/cuarzo/Spark White.jpg",
      "imagenes": [
        "img/customizer/cuarzo/Spark White.jpg"
      ]
    },
    {
      "id": "cuarzo-statuario-precioso",
      "nombre": "Statuario Precioso",
      "imagen": "img/customizer/cuarzo/STATUARIO-PRECIOSO-PLACA-COMPLETA-scaled.jpg",
      "imagenes": [
        "img/customizer/cuarzo/STATUARIO-PRECIOSO-PLACA-COMPLETA-scaled.jpg"
      ]
    },
    {
      "id": "cuarzo-super-white",
      "nombre": "Super White",
      "imagen": "img/customizer/cuarzo/Super-White-1-2.png",
      "imagenes": [
        "img/customizer/cuarzo/Super-White-1-2.png",
        "img/customizer/cuarzo/super-white-placa-1-1536x864.jpg"
      ]
    },
    {
      "id": "cuarzo-white-mirror",
      "nombre": "White Mirror",
      "imagen": "img/customizer/cuarzo/white-mirror-03.jpg",
      "imagenes": [
        "img/customizer/cuarzo/white-mirror-03.jpg",
        "img/customizer/cuarzo/White-mirror-placa-completa-1-1536x864.jpg"
      ]
    }
  ],
  "granito": [
    {
      "id": "granito-viscount-white",
      "nombre": "Viscount White",
      "imagen": "img/customizer/granito/Granito Viscount White.jpg",
      "imagenes": [
        "img/customizer/granito/Granito Viscount White.jpg",
        "img/customizer/granito/Granito Viscount Whitecocina.webp"
      ]
    },
    {
      "id": "granito-negro-absoluto",
      "nombre": "Negro Absoluto",
      "imagen": "img/customizer/granito/Granito-Negro-Absolutoa-1024x572.jpg",
      "imagenes": [
        "img/customizer/granito/Granito-Negro-Absolutoa-1024x572.jpg",
        "img/customizer/granito/negroabsolutococina.jpg"
      ]
    },
    {
      "id": "granito-san-gabriel",
      "nombre": "San Gabriel",
      "imagen": "img/customizer/granito/granito-san-gabriel.jpg",
      "imagenes": [
        "img/customizer/granito/granito-san-gabriel.jpg",
        "img/customizer/granito/granitosangabrielcocina.webp"
      ]
    }
  ],
  "sinterizado": [
    {
      "id": "sinterizado-amazonite",
      "nombre": "Amazonite",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/amazonite-seagreen-02.webp",
      "muestra": "img/customizer/piedrasinterizada/AMAZONITE_-horizontal-rbzaxflm3a0vq1s2hp1yzbwwe579rpbnin77sqazik.jpg",
      "imagenes": [
        "img/customizer/piedrasinterizada/amazonite-seagreen-02.webp",
        "img/customizer/piedrasinterizada/AMAZONITE_-horizontal-rbzaxflm3a0vq1s2hp1yzbwwe579rpbnin77sqazik.jpg"
      ]
    },
    {
      "id": "sinterizado-ankara",
      "nombre": "Ankara",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/ANKARA-768x573.webp",
      "muestra": "img/customizer/piedrasinterizada/ANKARA-768x573.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ANKARA-768x573.webp",
        "img/customizer/piedrasinterizada/AS_ANKARA_B_3200x1600_RGB_11zon-scaled-e1788852943830-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-aura-lux-white",
      "nombre": "Aura Lux White",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_AURA-AMB-3-SECUNDARIA_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_AURA_LUX_WHITE_A_3200X1600_RGB_ALTA_MOD_2_11zon-1-scaled-e1768988912116-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_AURA-AMB-3-SECUNDARIA_11zon.webp",
        "img/customizer/piedrasinterizada/AS_AURA_LUX_WHITE_A_3200X1600_RGB_ALTA_MOD_2_11zon-1-scaled-e1768988912116-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-crystal-lux-white",
      "nombre": "Crystal Lux White",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/cover-crystal-lux-white-5120-2048x1038.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-crystal-lux-white-5120-2048x1038.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/cover-crystal-lux-white-5120-2048x1038.webp"
      ]
    },
    {
      "id": "sinterizado-labradorite",
      "nombre": "Labradorite",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/labradorite-royalblue-01.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-labradorite-royalblue-1-2048x1023.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/labradorite-royalblue-01.webp",
        "img/customizer/piedrasinterizada/cover-labradorite-royalblue-1-2048x1023.webp"
      ]
    },
    {
      "id": "sinterizado-mystic-silver",
      "nombre": "Mystic Silver",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/MYSTIC-SILVER-160X320_4_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_MYSTIC_SILVER_B_3200X1600_RGB_11zon_11zon-2-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/MYSTIC-SILVER-160X320_4_11zon.webp",
        "img/customizer/piedrasinterizada/AS_MYSTIC_SILVER_B_3200X1600_RGB_11zon_11zon-2-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-onice-black",
      "nombre": "Onice Black",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/amb-14-onice-black_1_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/ONICE_BLACK_A_3200X1600_RGB_PZA1-scaled-e1750938961304-2048x1024.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/amb-14-onice-black_1_11zon.webp",
        "img/customizer/piedrasinterizada/ONICE_BLACK_A_3200X1600_RGB_PZA1-scaled-e1750938961304-2048x1024.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-onice-blue",
      "nombre": "Onice Blue",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/Onice_Blue_web.webp",
      "muestra": "img/customizer/piedrasinterizada/ONICE-BLUE-MATT-160X320-A_WEB-scaled-e1756453006285-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/Onice_Blue_web.webp",
        "img/customizer/piedrasinterizada/ONICE-BLUE-MATT-160X320-A_WEB-scaled-e1756453006285-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-onice-lux-white",
      "nombre": "Onice Lux White",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/11zon_amb-17-onice-lux-white.webp",
      "muestra": "img/customizer/piedrasinterizada/11zon_amb-17-onice-lux-white.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/11zon_amb-17-onice-lux-white.webp"
      ]
    },
    {
      "id": "sinterizado-onice-seagreen",
      "nombre": "Onice Seagreen",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/ONICE-SEAGREEN-2-1.jpg",
      "muestra": "img/customizer/piedrasinterizada/ONICE_SEAGREEN_A_1600X3200_RGB_ALTA_3_11zon-scaled-e1767806053996-2048x1023.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ONICE-SEAGREEN-2-1.jpg",
        "img/customizer/piedrasinterizada/ONICE_SEAGREEN_A_1600X3200_RGB_ALTA_3_11zon-scaled-e1767806053996-2048x1023.webp"
      ]
    },
    {
      "id": "sinterizado-patagonia",
      "nombre": "Patagonia",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/patagonia-gold-01.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-patagonia-5120-2048x1023.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/patagonia-gold-01.webp",
        "img/customizer/piedrasinterizada/cover-patagonia-5120-2048x1023.webp"
      ]
    },
    {
      "id": "sinterizado-versilis",
      "nombre": "Versilis",
      "coleccion": "luxury",
      "imagen": "img/customizer/piedrasinterizada/AS_VERSILIS_V3_A_3200X1600_RGB-scaled-e1788863852738-2048x1024.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_VERSILIS_V3_A_3200X1600_RGB-scaled-e1788863852738-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/AS_VERSILIS_V3_A_3200X1600_RGB-scaled-e1788863852738-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-alpi-white",
      "nombre": "Alpi White",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/alpiwhitecocina.webp",
      "muestra": "img/customizer/piedrasinterizada/alpiwhite.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/alpiwhitecocina.webp",
        "img/customizer/piedrasinterizada/alpiwhite.webp"
      ]
    },
    {
      "id": "sinterizado-appennino-gold",
      "nombre": "Appennino Gold",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_APPENINO-cocinawebp.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_APPENINNO_GOLD_B_3200X1600_RGB_11zon_11zon-1-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_APPENINO-cocinawebp.webp",
        "img/customizer/piedrasinterizada/APPENNINO-GOLD-160X320_3_11zon.webp",
        "img/customizer/piedrasinterizada/AS_APPENINNO_GOLD_B_3200X1600_RGB_11zon_11zon-1-2048x1024.webp",
        "img/customizer/piedrasinterizada/AS_APPENINNO_GOLD_B_3200X1600_RGB_11zon_11zon-1-scaled-rinl51m2yrkgggukrcknypdjb0q0arye37rqib4vnw.webp"
      ]
    },
    {
      "id": "sinterizado-belvedere",
      "nombre": "Belvedere",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/Casa-Caujaral-Lungomare-Meson-e-isla-Gramarston®-Belvedere-Black-01-gramar.jpg",
      "muestra": "img/customizer/piedrasinterizada/cover-belvedere-black-5120-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/Casa-Caujaral-Lungomare-Meson-e-isla-Gramarston®-Belvedere-Black-01-gramar.jpg",
        "img/customizer/piedrasinterizada/cover-belvedere-black-5120-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-crotone-pulpis",
      "nombre": "Crotone Pulpis",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/amb-28-crotone-pulpis_v2_3_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/CROTONE_PULPIS_160X320_RGB_PZA3-min-scaled-e1748426594481-2048x1024.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/amb-28-crotone-pulpis_v2_3_11zon.webp",
        "img/customizer/piedrasinterizada/CROTONE_PULPIS_160X320_RGB_PZA3-min-scaled-e1748426594481-2048x1024.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-ducal-gold",
      "nombre": "Ducal Gold",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/Cocina-principal-Modula-Line-Meson-salpicadero-e-isla-Gramarston®-Ducal-Gold-01-gramar.jpg",
      "muestra": "img/customizer/piedrasinterizada/cover-ducal-gold-5120-2048x1034.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/Cocina-principal-Modula-Line-Meson-salpicadero-e-isla-Gramarston®-Ducal-Gold-01-gramar.jpg",
        "img/customizer/piedrasinterizada/cover-ducal-gold-5120-2048x1034.webp"
      ]
    },
    {
      "id": "sinterizado-grassi-white",
      "nombre": "Grassi White",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/amb-25-grassi-white_v2_2_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-grassi-white-5120-1-2048x1024.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/amb-25-grassi-white_v2_2_11zon.webp",
        "img/customizer/piedrasinterizada/cover-grassi-white-5120-1-2048x1024.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-lasa",
      "nombre": "Lasa",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/lasa-white-06.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-lasa-white-1-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/lasa-white-06.webp",
        "img/customizer/piedrasinterizada/cover-lasa-white-1-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-laurent",
      "nombre": "Laurent",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/laurent-black-05.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-laurent-black-5120-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/laurent-black-05.webp",
        "img/customizer/piedrasinterizada/cover-laurent-black-5120-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-lucca-gold",
      "nombre": "Lucca Gold",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/lucca-gold-01.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-lucca-gold-5120-2048x1022.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/lucca-gold-01.webp",
        "img/customizer/piedrasinterizada/cover-lucca-gold-5120-2048x1022.webp"
      ]
    },
    {
      "id": "sinterizado-lumina",
      "nombre": "Lumina",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/AMBIENTE-LUMINA-COLOR.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_LUMINA_A_1760X3525_RGB-1-scaled-e1788857200779-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/AMBIENTE-LUMINA-COLOR.webp",
        "img/customizer/piedrasinterizada/AS_LUMINA_A_1760X3525_RGB-1-scaled-e1788857200779-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-macchia-vecchia",
      "nombre": "Macchia Vecchia",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/macchia-vecchia-gold-05.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-macchia-vecchia-2048x1022.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/macchia-vecchia-gold-05.webp",
        "img/customizer/piedrasinterizada/cover-macchia-vecchia-2048x1022.webp"
      ]
    },
    {
      "id": "sinterizado-marquina",
      "nombre": "Marquina",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/26-Marquina-Ascale-01-scaled.webp",
      "muestra": "img/customizer/piedrasinterizada/MARQUINA_BLACK_A_1600X3200_RGB_1_11zon-scaled-e1767870529832-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/26-Marquina-Ascale-01-scaled.webp",
        "img/customizer/piedrasinterizada/MARQUINA_BLACK_A_1600X3200_RGB_1_11zon-scaled-e1767870529832-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-montblanc",
      "nombre": "Montblanc",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/montblanc-white-04.webp",
      "muestra": "img/customizer/piedrasinterizada/MONTBLANC_WHITE_A_3200X1600_RGB_1_11zon-1-scaled-e1767870093852-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/montblanc-white-04.webp",
        "img/customizer/piedrasinterizada/MONTBLANC_WHITE_A_3200X1600_RGB_1_11zon-1-scaled-e1767870093852-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-new-torano",
      "nombre": "New Torano",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/cover-new-torano-h-2048x1024.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-new-torano-h-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/cover-new-torano-h-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-taj-mahal",
      "nombre": "Taj Mahal",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_AMB-5-TAJ-MAHAL-VARIANTE.jpg",
      "muestra": "img/customizer/piedrasinterizada/cover-taj-mahal-almond-5120-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_AMB-5-TAJ-MAHAL-VARIANTE.jpg",
        "img/customizer/piedrasinterizada/cover-taj-mahal-almond-5120-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-vagli-gold",
      "nombre": "Vagli Gold",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/VAGLI-GOLD-B-Editada-1-scaled-e1752675434928-2048x1035.webp",
      "muestra": "img/customizer/piedrasinterizada/VAGLI-GOLD-B-Editada-1-scaled-e1752675434928-2048x1035.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/VAGLI-GOLD-B-Editada-1-scaled-e1752675434928-2048x1035.webp"
      ]
    },
    {
      "id": "sinterizado-verso-gold",
      "nombre": "Verso Gold",
      "coleccion": "marmol",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_COCINA-VERSO-SECUNDARIA-1_ALTA-copia.webp",
      "muestra": "img/customizer/piedrasinterizada/VERSO_GOLD_A_RGB_PZA1_1-copia-2-2048x1025.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_COCINA-VERSO-SECUNDARIA-1_ALTA-copia.webp",
        "img/customizer/piedrasinterizada/VERSO_GOLD_A_RGB_PZA1_1-copia-2-2048x1025.webp"
      ]
    },
    {
      "id": "sinterizado-allure-black",
      "nombre": "Allure Black",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/allure-black-cocina.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-allure-black-5120-r2gymp4dl8rbxg35bumde3s4bdi0h9dlwlan9r9aka.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/allure-black-cocina.webp",
        "img/customizer/piedrasinterizada/cover-allure-black-5120-r2gymp4dl8rbxg35bumde3s4bdi0h9dlwlan9r9aka.webp"
      ]
    },
    {
      "id": "sinterizado-amaya-linen",
      "nombre": "Amaya Linen",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/amayalimencocina.webp",
      "muestra": "img/customizer/piedrasinterizada/amayalimen.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/amayalimencocina.webp",
        "img/customizer/piedrasinterizada/amayalimen.webp"
      ]
    },
    {
      "id": "sinterizado-antalya-sand",
      "nombre": "Antalya Sand",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/antalya-sand-06.webp",
      "muestra": "img/customizer/piedrasinterizada/H-ANTALYA_SAND_3200X1600_RGB_PZA1_MASCARAS-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/antalya-sand-06.webp",
        "img/customizer/piedrasinterizada/H-ANTALYA_SAND_3200X1600_RGB_PZA1_MASCARAS-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-arena-sand",
      "nombre": "Arena Sand",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_ARENA-SAND-COCINA.webp",
      "muestra": "img/customizer/piedrasinterizada/ARENA-SAND_3200x1600-1-scaled-e1787067193492-rs3dwvk0oocwt2kmugcuqvz84ul2oud0d0bwydkhu4.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_ARENA-SAND-COCINA.webp",
        "img/customizer/piedrasinterizada/ARENA-SAND_3200x1600-1-scaled-e1787067193492-rs3dwvk0oocwt2kmugcuqvz84ul2oud0d0bwydkhu4.webp"
      ]
    },
    {
      "id": "sinterizado-arizona-sand",
      "nombre": "Arizona Sand",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/arizona-sand-cocina.webp",
      "muestra": "img/customizer/piedrasinterizada/arizonasand.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/arizona-sand-cocina.webp",
        "img/customizer/piedrasinterizada/arizonasand.webp"
      ]
    },
    {
      "id": "sinterizado-armani-silver",
      "nombre": "Armani Silver",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_ARMANI-SILVER-SECUNDARIA_1-copia.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-armani-silver-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_ARMANI-SILVER-SECUNDARIA_1-copia.webp",
        "img/customizer/piedrasinterizada/cover-armani-silver-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-boreal-sand",
      "nombre": "Boreal Sand",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/BOREAL_SAND_1600X3200_PZA1_RGB_ALTA_1_11zon-1-2048x1024.webp",
      "muestra": "img/customizer/piedrasinterizada/BOREAL_SAND_1600X3200_PZA1_RGB_ALTA_1_11zon-1-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/BOREAL_SAND_1600X3200_PZA1_RGB_ALTA_1_11zon-1-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-boreal-umber",
      "nombre": "Boreal Umber",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_BOREAL-UMBER-webp.webp",
      "muestra": "img/customizer/piedrasinterizada/BOREAL_UMBER_1600X3200_PZA3_R__-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_BOREAL-UMBER-webp.webp",
        "img/customizer/piedrasinterizada/BOREAL_UMBER_1600X3200_PZA3_R__-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-brera-bone",
      "nombre": "Brera Bone",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_COCINA-BRERA-BONE-DET_BAJA.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_BRERA_BONE_3200X1600_RGB_PZA1-copia-1-scaled-e1786521553192-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_COCINA-BRERA-BONE-DET_BAJA.webp",
        "img/customizer/piedrasinterizada/AS_BRERA_BONE_3200X1600_RGB_PZA1-copia-1-scaled-e1786521553192-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-brera-dark",
      "nombre": "Brera Dark",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/webp-ASCALE_COCINA-BRERA-DARK_detalle.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_BRERA_DARK_3200X1600_RGB_PZA1-copia-1-scaled-e1786531464521-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/webp-ASCALE_COCINA-BRERA-DARK_detalle.webp",
        "img/customizer/piedrasinterizada/AS_BRERA_DARK_3200X1600_RGB_PZA1-copia-1-scaled-e1786531464521-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-brera-light",
      "nombre": "Brera Light",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_BANO-BRERA-LIGHT_BAJA_3.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_BRERA_LIGHT_3200X1600_RGB_PZA1-copia-1-scaled-e1786526164382-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_BANO-BRERA-LIGHT_BAJA_3.webp",
        "img/customizer/piedrasinterizada/AS_BRERA_LIGHT_3200X1600_RGB_PZA1-copia-1-scaled-e1786526164382-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-ceppo-di-gre",
      "nombre": "Ceppo di Gre",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/CEPPO-DI-GRE_320X160-4.jpg",
      "muestra": "img/customizer/piedrasinterizada/CEPPO_DI_GRE_SILVER_1-e1747297291567-2048x1021.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/CEPPO-DI-GRE_320X160-4.jpg",
        "img/customizer/piedrasinterizada/CEPPO_DI_GRE_SILVER_1-e1747297291567-2048x1021.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-denver",
      "nombre": "Denver",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/AS_DENVER_1200X2800_RGB_PZA1_MASCARAS-1-2048x878.webp",
      "muestra": "img/customizer/piedrasinterizada/AS_DENVER_1200X2800_RGB_PZA1_MASCARAS-1-2048x878.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/AS_DENVER_1200X2800_RGB_PZA1_MASCARAS-1-2048x878.webp"
      ]
    },
    {
      "id": "sinterizado-etna-black",
      "nombre": "Etna Black",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/etnablackcocina.jpg",
      "muestra": "img/customizer/piedrasinterizada/etnablack.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/etnablackcocina.jpg",
        "img/customizer/piedrasinterizada/etnablack.webp"
      ]
    },
    {
      "id": "sinterizado-foresta-blue",
      "nombre": "Foresta Blue",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/amb-01-foresta-blue-120x280_1_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/amb-01-foresta-blue-120x280_1_11zon.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/amb-01-foresta-blue-120x280_1_11zon.webp",
        "img/customizer/piedrasinterizada/FORESTABLUE-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-grum-black",
      "nombre": "Grum Black",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/Apt-Modelo-Sta-Maria-de-los-Cerros-Cocina-Quadra-Laminada-Gramarston®-Grum-Black-02.webp",
      "muestra": "img/customizer/piedrasinterizada/cover-grum-black-5120-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/Apt-Modelo-Sta-Maria-de-los-Cerros-Cocina-Quadra-Laminada-Gramarston®-Grum-Black-02.webp",
        "img/customizer/piedrasinterizada/cover-grum-black-5120-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-nebula-brown",
      "nombre": "Nebula Brown",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/cocinanebulabrown.webp",
      "muestra": "img/customizer/piedrasinterizada/nebulabrown.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/cocinanebulabrown.webp",
        "img/customizer/piedrasinterizada/nebulabrown.webp"
      ]
    },
    {
      "id": "sinterizado-paloma-stone",
      "nombre": "Palomastone",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/cocinapalomastone.webp",
      "muestra": "img/customizer/piedrasinterizada/palomastone.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/cocinapalomastone.webp",
        "img/customizer/piedrasinterizada/palomastone.webp"
      ]
    },
    {
      "id": "sinterizado-portland-linen",
      "nombre": "Portland Linen",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/PORTLAND_LINEN_1600X3200_RGB_PZA1-2048x1024.jpg.webp",
      "muestra": "img/customizer/piedrasinterizada/PORTLAND_LINEN_1600X3200_RGB_PZA1-2048x1024.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/PORTLAND_LINEN_1600X3200_RGB_PZA1-2048x1024.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-portland-pearl",
      "nombre": "Portland Pearl",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/AMB_PORTLAND-PEARL-1.jpg",
      "muestra": "img/customizer/piedrasinterizada/PORTLAND_PEARL_1600X3200_RGB_PZA1_MASCARAS-copia-1-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/AMB_PORTLAND-PEARL-1.jpg",
        "img/customizer/piedrasinterizada/PORTLAND_PEARL_1600X3200_RGB_PZA1_MASCARAS-copia-1-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-savanna-terra",
      "nombre": "Savanna Terra",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/cocinasavannaterra.webp",
      "muestra": "img/customizer/piedrasinterizada/savannaterra.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/cocinasavannaterra.webp",
        "img/customizer/piedrasinterizada/savannaterra.webp"
      ]
    },
    {
      "id": "sinterizado-tivoli-white",
      "nombre": "Tivoli White",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/tivoliwhitecocina.webp",
      "muestra": "img/customizer/piedrasinterizada/tivoliwhite.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/tivoliwhitecocina.webp",
        "img/customizer/piedrasinterizada/tivoliwhite.webp"
      ]
    },
    {
      "id": "sinterizado-tivoli-white-strata",
      "nombre": "Tivoli White Strata",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/tivolistratacocina.webp",
      "muestra": "img/customizer/piedrasinterizada/amb-05-tivoli-strata-100x300-copia.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/tivolistratacocina.webp",
        "img/customizer/piedrasinterizada/TIVOLI_WHITE-STRATA_1000X3000_RGB_PZA1-1-scaled-e1786957418322-2048x683.webp",
        "img/customizer/piedrasinterizada/tivoliwhitestrata.webp"
      ]
    },
    {
      "id": "sinterizado-toffee-brown",
      "nombre": "Toffee Brown",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/toffeebrowncocina.webp",
      "muestra": "img/customizer/piedrasinterizada/toffeebrown.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/toffeebrowncocina.webp",
        "img/customizer/piedrasinterizada/toffeebrown.webp"
      ]
    },
    {
      "id": "sinterizado-trevi-white",
      "nombre": "Trevi White",
      "coleccion": "stone",
      "imagen": "img/customizer/piedrasinterizada/treviwhitecocina.jpg",
      "muestra": "img/customizer/piedrasinterizada/treviwhite.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/treviwhitecocina.jpg",
        "img/customizer/piedrasinterizada/treviwhite.webp"
      ]
    },
    {
      "id": "sinterizado-cosmopolita-brown",
      "nombre": "Cosmopolita Brown",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-BROWN-DET.jpg",
      "muestra": "img/customizer/piedrasinterizada/COSMOPOLITA_BROWN_3200X1600_RGB_PZA2_2_11zon_2_11zon-1-scaled-e1767868643310-2048x1024.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-BROWN-DET.jpg",
        "img/customizer/piedrasinterizada/COSMOPOLITA_BROWN_3200X1600_RGB_PZA2_2_11zon_2_11zon-1-scaled-e1767868643310-2048x1024.webp"
      ]
    },
    {
      "id": "sinterizado-cosmopolita-dark",
      "nombre": "Cosmopolita Dark",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-DARK_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-DARK_11zon.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-DARK_11zon.webp"
      ]
    },
    {
      "id": "sinterizado-cosmopolita-gray",
      "nombre": "Cosmopolita Gray",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/Det_Cosmopolita-Gray.webp",
      "muestra": "img/customizer/piedrasinterizada/COSMOPOLITA_GREY_3200X1600_PZA1-copia-2048x1024.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/Det_Cosmopolita-Gray.webp",
        "img/customizer/piedrasinterizada/COSMOPOLITA_GREY_3200X1600_PZA1-copia-2048x1024.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-cosmopolita-ivory",
      "nombre": "Cosmopolita Ivory",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/11zon_COSMOPOLITA_IVORY_1200X2800_RGB_PZA1-scaled-e1789110561249-2048x878.webp",
      "muestra": "img/customizer/piedrasinterizada/11zon_COSMOPOLITA_IVORY_1200X2800_RGB_PZA1-scaled-e1789110561249-2048x878.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/11zon_COSMOPOLITA_IVORY_1200X2800_RGB_PZA1-scaled-e1789110561249-2048x878.webp"
      ]
    },
    {
      "id": "sinterizado-cosmopolita-light",
      "nombre": "Cosmopolita Light",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-LIGHT.jpg",
      "muestra": "img/customizer/piedrasinterizada/COSMOPOLITA_LIGHT_3200X1600_PZA1_RGB_ALTA_11zon_11zon-1-1-2048x1018.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-LIGHT.jpg",
        "img/customizer/piedrasinterizada/COSMOPOLITA_LIGHT_3200X1600_PZA1_RGB_ALTA_11zon_11zon-1-1-2048x1018.webp"
      ]
    },
    {
      "id": "sinterizado-cosmopolita-silver",
      "nombre": "Cosmopolita Silver",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-SILVER.jpg",
      "muestra": "img/customizer/piedrasinterizada/COSMOPOLITA_SILVER_3200X1600_PZA1-copia-2048x1024.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/ASCALE_COSMOPOLITA-SILVER.jpg",
        "img/customizer/piedrasinterizada/COSMOPOLITA_SILVER_3200X1600_PZA1-copia-2048x1024.jpg.webp"
      ]
    },
    {
      "id": "sinterizado-moon-black",
      "nombre": "Moon Black",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/moon-black-cocina.webp",
      "muestra": "img/customizer/piedrasinterizada/moonblack.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/moon-black-cocina.webp",
        "img/customizer/piedrasinterizada/moonblack.webp"
      ]
    },
    {
      "id": "sinterizado-urban-white",
      "nombre": "Urban White",
      "coleccion": "urbano",
      "imagen": "img/customizer/piedrasinterizada/amb-15-urban-white_1_11zon.webp",
      "muestra": "img/customizer/piedrasinterizada/URBAN_WHITE_1200X2800_RGB_PZA3-min-scaled-e1747387097587-2048x878.jpg.webp",
      "imagenes": [
        "img/customizer/piedrasinterizada/amb-15-urban-white_1_11zon.webp",
        "img/customizer/piedrasinterizada/URBAN_WHITE_1200X2800_RGB_PZA3-min-scaled-e1747387097587-2048x878.jpg.webp"
      ]
    }
  ]
};

var HERRAJE_SECTIONS = [
  {
    id:'bisagras', title:'Bisagras',
    type:'radio', key:'bisagra',
    preselect:'bis-hettich',
    opts:[
      {
        id:'bis-hettich',
        label:'Bisagra cierre suave',
        desc:'Bisagra de cazoleta con cierre amortiguado. Apertura 110°. Estándar en todas las líneas.',
        val:'Bisagra cierre suave',
        img:'img/customizer/cierresuave.jpg',

      },
    ],
  },

  {
    id:'correderas', title:'Correderas para cajones',
    type:'radio', key:'corredera',
    opts:[
      {
        id:'cor-lb',
        label:'Línea Básica · Telescópica San José',
        desc:'Va en puerta. Corredera telescópica lateral de extensión completa. Económica y funcional.',
        val:'LB Telescópica San José (va en puerta)',
        img:'img/customizer/telescopica.jpg',
      },
      {
        id:'cor-lm',
        label:'Línea Media · Telescópica Hettich',
        desc:'Va abajo de la tarja. Mayor capacidad de carga y deslizamiento más suave.',
        val:'LM Telescópica Hettich (abajo tarja)',
        img:'img/customizer/telescopicahettich.jpg',
      },

      {
        id:'cor-la',
        label:'Línea Alta · Oculta cierre suave Hettich',
        desc:'Módulo completo. Corredera bajo-montada invisible, amortiguación automática al cerrar.',
        val:'LA Hettich oculta soft-close (módulo completo)',
        img:'img/customizer/cierresuevaocultahettich.jpg',
      },
    ],
  },
  {
    id:'cajones', title:'Cajones',
    type:'multi', key:'cajones',
    opts:[
      { id:'caj-mdf', label:'Con MDF',             desc:'Cajón con estructura interior de MDF, acabado sólido y resistente.',       val:'Con MDF',              img:'img/customizer/cajonmdf.jpg' },
      { id:'caj-alu', label:'Tiro de aluminio',     desc:'Perfil lateral de aluminio anodizado. Apariencia premium y gran dureza.',  val:'Tiro aluminio',        img:'img/customizer/cajontiraaluminio.webp' },
      { id:'caj-cri', label:'Laterales de cristal', desc:'Cristal lateral templado con perfil de aluminio. Diseño contemporáneo.',  val:'Laterales de cristal', img:'img/customizer/cajonlateralescristal.webp' },
    ],
  },
  {
    id:'basureros', title:'Basureros',
    type:'radio', key:'basurero',
    opts:[
      {
        id:'bas-lb',
        label:'Línea Básica · Va en puerta',
        desc:'Bote de basura integrado en la puerta del mueble bajo. Solución compacta y económica.',
        val:'Basurero LB (va en puerta)',
        img:'img/customizer/basurero_vaenpuerta.jpeg',
      },
      {
        id:'bas-lm',
        label:'Línea Media · Abajo de la tarja',
        desc:'Módulo extraíble de basura ubicado debajo de la tarja. Acceso práctico desde el frente.',
        val:'Basurero LM (abajo tarja)',
        img:'img/customizer/basurero_abajotarja.jpeg',
      },
      {
        id:'bas-la',
        label:'Línea Alta · Módulo completo',
        desc:'Módulo completo con compartimentos de reciclaje integrados y cierre suave.',
        val:'Basurero LA (módulo completo)',
        img:'img/customizer/herrajes/basurerocompleto.jpg',
        images:['img/customizer/herrajes/basurerocompleto.jpg', 'img/customizer/basurero_modulocompleto.jpeg'],
      },
    ],
  },
  {
    id:'especias', title:'Especiero',
    type:'radio', key:'especias',
    opts:[
      {
        id:'esp-si',
        label:'Extraíble de especias',
        desc:'Módulo angosto extraíble junto a la parrilla para organización de especias y condimentos.',
        val:'Extraíble especias',
        img:'img/customizer/herrajes/especiero1.jpg',
      },
    ],
  },
  {
    id:'modulos', title:'Módulos especiales',
    type:'multi', key:'modulos',
    opts:[
      { id:'mod-esq', label:'Esquinero extraíble',       desc:'Sistema giratorio para aprovechar las esquinas ciegas.',  val:'Esquinero extraíble', img:'img/customizer/herrajes/esquineroextraible4.jpg', images:['img/customizer/herrajes/esquineroextraible4.jpg', 'img/customizer/herrajes/esquineroextraible1.jpeg', 'img/customizer/herrajes/esquineroextraible2.jpg', 'img/customizer/herrajes/esquineroextraible3.jpg'] },
      { id:'mod-hor', label:'Torre de horno',            desc:'Módulo vertical para horno empotrado a la medida.',       val:'Torre de horno',      img:null },
      { id:'mod-gar', label:'Módulo extraíble garrafón', desc:'Cajón profundo con guías especiales para garrafón.',      val:'Módulo garrafón',     img:'img/customizer/herrajes/modulogarrafon.jpg' },
    ],
  },
];

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', function() {
  actualizarTarjetasCubierta();
  buildFrente();
  buildHerrajeContainer();
  renderStep(0);
});

/* ─── FRENTE BUILDER ─── */
function buildFrente() {
  var container = document.getElementById('frenteList');
  if (!container) return;
  var lines = [
    { key:'economica',  label:'Línea Económica',  tag:'Estándar',  mm:'15 mm', price:'$850 / tablero',   img:'img/customizer/tabintblancofrosty.jpg' },
    { key:'arauco',     label:'Línea Arauco',      tag:'Popular',   mm:'15 mm', price:'$1,700 / tablero', img:'img/customizer/COLORES ARAUCO/cocinaChardonnay.jpg' },
    { key:'decorlux',   label:'Línea Decorlux',    tag:'Premium',   mm:'18 mm', price:'$6,500 / tablero', img:'img/customizer/COLORES DECORLUX/Decorlux_Tableros_MDF_1800_Acrilico_High_Gloss_Alto_Brillo_Blanco_Cocina-768x623.webp' },
    { key:'transformad',label:'Línea Transformad', tag:'Exclusivo', mm:'18 mm', price:'$8,500 / tablero', img:'img/customizer/TMATT/COCINALEGNO.jpg' },
  ];
  container.innerHTML = '<div class="frente-line-cards">' + lines.map(function(l) {
    var isSel = state.frentes && state.frentes[l.key] && state.frentes[l.key].length > 0;
    var colorCount = isSel ? state.frentes[l.key].length : 0;
    var badgeText = isSel ? (colorCount + ' color' + (colorCount !== 1 ? 'es' : '')) : 'Seleccionado';
    var editText = isSel ? 'Cambiar color' : 'Ver colores';
    return '<div class="frente-line-card' + (isSel ? ' selected' : '') + '" id="fr-' + l.key + '" onclick="openFrenteModal(\'' + l.key + '\')">' +
      '<img class="frente-line-card-img" src="' + l.img + '" alt="' + l.label + '" />' +
      '<div class="frente-line-card-overlay"></div>' +
      '<div class="frente-line-card-badge">' + badgeText + '</div>' +
      '<div class="frente-line-card-edit">' + editText + '</div>' +
      '<div class="frente-line-card-body">' +
        '<div class="frente-line-card-label">' + l.tag + ' · ' + l.mm + '</div>' +
        '<div class="frente-line-card-name">' + l.label + '</div>' +
        '<div class="frente-line-card-price">' + l.price + '</div>' +
      '</div>' +
    '</div>';
  }).join('') + '</div>';
}

function toggleFrente(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var key = el.getAttribute('data-key');
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (!state.frentes[key]) state.frentes[key] = [];
  } else {
    delete state.frentes[key];
    el.querySelectorAll('.frente-color-card').forEach(function(c){ c.classList.remove('sel'); });
    var preview = document.getElementById('preview-' + key);
    if (preview) preview.style.display = 'none';
  }
  updateSidebar();
}

function toggleFrenteColor(e, key, el) {
  e.stopPropagation();
  var container = document.getElementById('fr-' + key);
  if (!container) return;
  
  var isSel = el.classList.contains('sel');
  
  if (isSel) {
    el.classList.remove('sel');
    if (container.querySelectorAll('.frente-color-card.sel').length === 0) {
      document.getElementById('zone-panel-' + key).classList.remove('active');
    }
  } else {
    el.classList.add('sel');
    
    var zonePanel = document.getElementById('zone-panel-' + key);
    if (zonePanel) zonePanel.classList.add('active');
    
    var cname = el.getAttribute('data-cname');
    var kImage = el.getAttribute('data-kitchen');
    
    var zoneStatus = document.getElementById('zone-status-' + key);
    var lineLabel = {economica:'Económica',arauco:'Arauco',decorlux:'Decorlux',transformad:'Transformad'}[key]||key;
    if (zoneStatus) zoneStatus.innerHTML = 'Color aplicado a: Toda la cocina (Línea ' + lineLabel + ', ' + cname + ')';
    
    var previewArea = document.getElementById('preview-' + key);
    if (previewArea) {
      if (kImage) {
        previewArea.style.display = 'block';
        var imgEl = document.getElementById('preview-img-' + key);
        if (imgEl) {
          imgEl.src = kImage;
          imgEl.style.display = 'block';
        }
        var nameEl = document.getElementById('preview-name-' + key);
        if (nameEl) nameEl.textContent = 'Vista previa: ' + cname;
      } else {
        previewArea.style.display = 'none';
      }
    }
  }
  
  var selected = [];
  container.querySelectorAll('.frente-color-card.sel').forEach(function(c){
    selected.push(c.getAttribute('data-cname'));
  });
  if (selected.length > 0) {
    state.frentes[key] = selected;
    container.classList.add('selected');
  } else {
    delete state.frentes[key];
    container.classList.remove('selected');
  }
  updateSidebar();
}

/* ─── HERRAJE BUILDER ─── */
// Keep legacy img-only options compatible; the gallery is presentation state only.
function herrajeImagenes(option) {
  return [option.img].concat(option.images || []).filter(function(src, index, all) {
    return typeof src === 'string' && src.length > 0 && all.indexOf(src) === index;
  });
}

function prepararGaleriaHerraje(photo, option) {
  var images = herrajeImagenes(option);
  var img = photo.querySelector('img');
  if (!img || !images.length) return;
  var active = 0;
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'herr-ampliar photo-ampliar';
  button.textContent = 'Ampliar ↗';
  button.setAttribute('aria-label', 'Ampliar ' + option.label);
  button.addEventListener('click', function(event) {
    event.stopPropagation();
    window.openLightbox(images, option.label, active);
  });
  img.addEventListener('error', function() { button.hidden = true; });
  img.addEventListener('load', function() { button.hidden = false; });
  photo.appendChild(button);
  if (images.length < 2) return;
  var strip = document.createElement('div');
  strip.className = 'herr-gallery';
  strip.setAttribute('aria-label', 'Fotografías de ' + option.label);
  var count = document.createElement('span');
  count.className = 'herr-gallery-count';
  count.textContent = images.length + ' fotos';
  strip.appendChild(count);
  images.forEach(function(src, index) {
    var thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.setAttribute('aria-label', 'Ver foto ' + (index + 1) + ' de ' + option.label);
    thumb.setAttribute('aria-pressed', String(index === active));
    var small = document.createElement('img');
    small.src = src;
    small.alt = '';
    small.loading = 'lazy';
    thumb.appendChild(small);
    thumb.addEventListener('click', function(event) {
      event.stopPropagation();
      active = index;
      img.src = src;
      strip.querySelectorAll('button').forEach(function(b, i) { b.setAttribute('aria-pressed', String(i === active)); });
    });
    strip.appendChild(thumb);
  });
  photo.appendChild(strip);
}

function buildHerrajeContainer() {
  var container = document.getElementById('herrajeContainer');
  if (!container) return;
  container.innerHTML = HERRAJE_SECTIONS.map(function(sec) {
    var isOpen = sec.id === 'bisagras';
    var optsHTML;

    if (sec.type === 'radio') {
      optsHTML = '<div class="herr-cards">' +
        sec.opts.map(function(o) {
          var isPresel = sec.preselect && sec.preselect === o.id;
          var selCls = isPresel ? ' selected' : '';
          if (herrajeImagenes(o).length) {
            return '<div class="herr-card' + selCls + '" id="' + o.id + '" onclick="selectHerrajeOpt(this,\'' + sec.key + '\',\'' + escQ(o.val) + '\')">' +
              '<div class="herr-card-photo"><img src="' + herrajeImagenes(o)[0] + '" alt="' + o.label + '" loading="lazy" />' +
              '<div class="herr-card-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div></div>' +
              '<div class="herr-card-body"><div class="herr-card-name">' + o.label + '</div><div class="herr-card-desc">' + o.desc + '</div></div>' +
            '</div>';
          } else {
            return '<div class="herr-opt' + selCls + '" id="' + o.id + '" onclick="selectHerrajeOpt(this,\'' + sec.key + '\',\'' + escQ(o.val) + '\')">' +
              '<div class="herr-radio"></div>' +
              '<div><div class="herr-opt-name">' + o.label + '</div><div class="herr-opt-desc">' + o.desc + '</div></div>' +
            '</div>';
          }
        }).join('') +
      '</div>';
    } else {
      optsHTML = '<div class="herr-cards">' +
        sec.opts.map(function(o) {
          if (herrajeImagenes(o).length) {
            return '<div class="herr-card multi" id="' + o.id + '" onclick="toggleMultiOpt(this,\'' + sec.key + '\',\'' + escQ(o.val) + '\')">' +
              '<div class="herr-card-photo"><img src="' + herrajeImagenes(o)[0] + '" alt="' + o.label + '" loading="lazy" />' +
              '<div class="herr-card-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div></div>' +
              '<div class="herr-card-body"><div class="herr-card-name">' + o.label + '</div><div class="herr-card-desc">' + o.desc + '</div></div>' +
            '</div>';
          } else {
            return '<div class="herr-opt multi-cb-row" id="' + o.id + '" onclick="toggleMultiOpt(this,\'' + sec.key + '\',\'' + escQ(o.val) + '\')">' +
              '<div class="herr-cb"></div>' +
              '<div><div class="herr-opt-name">' + o.label + '</div><div class="herr-opt-desc">' + o.desc + '</div></div>' +
            '</div>';
          }
        }).join('') +
      '</div>';
    }

    return '<div class="herraje-section' + (isOpen ? ' open' : '') + '" id="sec-' + sec.id + '">' +
      '<div class="herraje-section-header" onclick="toggleHerrajeSection(\'sec-' + sec.id + '\')">' +
        '<span class="herraje-section-title">' + sec.title + '</span>' +
        '<svg class="herraje-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>' +
      '</div>' +
      '<div class="herraje-section-body">' + optsHTML + '</div>' +
    '</div>';
  }).join('');
  HERRAJE_SECTIONS.forEach(function(section) {
    section.opts.forEach(function(option) {
      var card = document.getElementById(option.id);
      var photo = card && card.querySelector('.herr-card-photo');
      if (photo) prepararGaleriaHerraje(photo, option);
    });
  });
}


function escQ(s) { return s.replace(/'/g, "\\'"); }

function toggleHerrajeSection(id) {
  var el = document.getElementById(id);
  var isOpen = el.classList.contains('open');
  document.querySelectorAll('.herraje-section').forEach(function(sec) {
    sec.classList.remove('open');
  });
  if (!isOpen) {
    el.classList.add('open');
  }
}

function selectHerrajeOpt(el, key, val) {
  var body = el.closest('.herraje-section-body');
  if (body) body.querySelectorAll('.herr-card, .herr-opt').forEach(function(o){ o.classList.remove('selected'); });
  el.classList.add('selected');
  state[key] = val;
  updateSidebar();
}

function toggleMultiOpt(el, key, val) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (state[key].indexOf(val) === -1) state[key].push(val);
  } else {
    state[key] = state[key].filter(function(v){ return v !== val; });
  }
  updateSidebar();
}

/* ─── SELECTIONS ─── */
function selectSituation(el, val) {
  document.querySelectorAll('.option-card').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  state.situacion = val;
  updateSidebar();
}

function selectInterior(el, val) {
  document.querySelectorAll('.material-card').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  state.interior = val;
  updateSidebar();
}

function cubiertaPrecioTexto(key) {
  return '$' + CUBIERTA_INFO[key].precioBase.toLocaleString('en-US') + ' / m lineal';
}

function actualizarTarjetasCubierta() {
  Object.keys(CUBIERTA_INFO).forEach(function(key) {
    var card = document.getElementById('cub-' + key);
    if (!card) return;
    card.querySelector('.cubierta-name').textContent = CUBIERTA_INFO[key].titulo;
    card.querySelector('.cubierta-price').textContent = cubiertaPrecioTexto(key);
  });
}

var CUBIERTA_COLECCIONES = {
  luxury: { nombre: 'Luxury', descripcion: 'Piedras exóticas y ónices' },
  marmol: { nombre: 'Mármol', descripcion: 'Vetas clásicas y contemporáneas' },
  stone: { nombre: 'Piedra / Stone', descripcion: 'Calizas, pizarras, granitos y acabados minerales' },
  urbano: { nombre: 'Cemento & Urbano', descripcion: 'Industrial y metálicos' }
};
var cubiertaColeccionActiva = null;

function selectCubiertaColeccion(key) {
  if (state.cubiertaCategoria !== 'sinterizado' || !CUBIERTA_COLECCIONES[key]) return;
  cubiertaColeccionActiva = key;
  if (state.cubiertaVariante && state.cubiertaVariante.coleccion !== key) state.cubiertaVariante = null;
  renderCubiertaVariantes();
  updateSidebar();
  var active = document.querySelector('.cubierta-coleccion[aria-pressed="true"]');
  if (active) active.focus({ preventScroll: true });
}

function cubiertaVarianteTexto() {
  if (!state.cubierta) return '—';
  return state.cubiertaVariante ? state.cubiertaVariante.nombre : 'Acabado por definir';
}

// Return a new array: the approved catalogue and its original paths stay intact.
function cubiertaImagenes(variant) {
  if (variant.coleccion) return variant.imagenes.slice();
  var images = variant.imagenes && variant.imagenes.length ? variant.imagenes : [variant.imagen];
  return images.slice().sort(function(a, b) {
    return Number(/cocina/i.test(b)) - Number(/cocina/i.test(a));
  });
}

// Prefer an explicitly named sample/detail for the compact swatch.
function cubiertaMuestra(variant) {
  if (variant.muestra) return variant.muestra;
  var images = variant.imagenes || [variant.imagen];
  return images.find(function(path) { return !/cocina/i.test(path) && /detalle|placa/i.test(path); }) || variant.imagen;
}

function cubiertaElemento(tag, className, text) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function actualizarCubiertaVisual() {
  var visual = document.getElementById('cubiertaVisual');
  if (!visual) return;
  visual.replaceChildren();
  var info = CUBIERTA_INFO[state.cubiertaCategoria];
  var variant = (CUBIERTA_VARIANTES[state.cubiertaCategoria] || []).find(function(v) {
    return state.cubiertaVariante && v.id === state.cubiertaVariante.id;
  });
  var images = variant ? cubiertaImagenes(variant) : [info.imagen];
  var caption = variant ? variant.nombre : 'Acabado por definir';
  var heroButton = cubiertaElemento('button', 'cubierta-hero');
  heroButton.type = 'button';
  heroButton.setAttribute('aria-label', 'Ampliar imagen de ' + (variant ? caption : info.titulo));
  var hero = cubiertaElemento('img');
  hero.src = images[0];
  hero.alt = variant ? info.titulo + ' · ' + caption : info.titulo + ' · Imagen general';
  heroButton.appendChild(hero);
  heroButton.appendChild(cubiertaElemento('span', 'cubierta-zoom-hint', 'Ampliar imagen ↗'));
  heroButton.addEventListener('click', function() { window.openLightbox(images, info.titulo + ' · ' + caption, images.indexOf(hero.getAttribute('src'))); });
  visual.appendChild(heroButton);
  if (images.length > 1) {
    var thumbs = cubiertaElemento('div', 'cubierta-thumbnails');
    thumbs.setAttribute('aria-label', 'Fotografías del acabado');
    images.forEach(function(path, index) {
      var button = cubiertaElemento('button', 'cubierta-thumbnail');
      button.type = 'button';
      var label = /cocina/i.test(path) ? 'Cocina' : 'Muestra / detalle';
      button.setAttribute('aria-label', label + ', foto ' + (index + 1));
      button.setAttribute('aria-pressed', String(index === 0));
      var img = cubiertaElemento('img');
      img.src = path;
      img.alt = '';
      img.loading = 'lazy';
      button.appendChild(img);
      button.title = label;
      button.addEventListener('click', function() {
        hero.src = path;
        thumbs.querySelectorAll('button').forEach(function(b) {
          b.setAttribute('aria-pressed', String(b === button));
        });
      });
      thumbs.appendChild(button);
    });
    visual.appendChild(thumbs);
  }
  var status = document.getElementById('cubiertaAcabadoActual');
  if (status) status.textContent = caption;
  var pageStatus = document.getElementById('cubiertaSelectionStatus');
  if (pageStatus) pageStatus.textContent = info.titulo + ' · ' + caption;
}

function renderCubiertaVariantes() {
  var panel = document.getElementById('cubiertaVariantes');
  if (!panel) return;
  panel.replaceChildren();
  var info = CUBIERTA_INFO[state.cubiertaCategoria];
  panel.hidden = !info;
  if (!info) return;
  var layout = cubiertaElemento('div', 'cubierta-config-layout');
  var visual = cubiertaElemento('div', 'cubierta-visual');
  visual.id = 'cubiertaVisual';
  layout.appendChild(visual);
  var controls = cubiertaElemento('div', 'cubierta-config-controls');
  controls.appendChild(cubiertaElemento('p', 'cubierta-eyebrow', 'Material y acabado'));
  controls.appendChild(cubiertaElemento('h3', 'cubierta-config-title', info.titulo));
  controls.appendChild(cubiertaElemento('p', 'cubierta-config-description', info.descripcion));
  if (info.aclaracion) controls.appendChild(cubiertaElemento('p', 'cubierta-material-note', info.aclaracion));
  controls.appendChild(cubiertaElemento('p', 'cubierta-config-price', state.cubPrecio));
  controls.appendChild(cubiertaElemento('h4', 'cubierta-section-title', state.cubiertaCategoria === 'sinterizado' && !cubiertaColeccionActiva ? 'Elige una colección' : 'Elige tu acabado'));
  var status = cubiertaElemento('p', 'cubierta-current-finish', cubiertaVarianteTexto());
  status.id = 'cubiertaAcabadoActual';
  status.setAttribute('role', 'status');
  controls.appendChild(status);
  var variants = CUBIERTA_VARIANTES[state.cubiertaCategoria] || [];
  if (state.cubiertaCategoria === 'sinterizado') {
    var collections = cubiertaElemento('div', 'cubierta-colecciones');
    collections.setAttribute('aria-label', 'Colecciones de Piedra sinterizada');
    Object.keys(CUBIERTA_COLECCIONES).forEach(function(key) {
      var collection = CUBIERTA_COLECCIONES[key];
      var button = cubiertaElemento('button', 'cubierta-coleccion');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(cubiertaColeccionActiva === key));
      button.appendChild(cubiertaElemento('strong', '', collection.nombre));
      button.appendChild(cubiertaElemento('span', '', collection.descripcion));
      button.addEventListener('click', function() { selectCubiertaColeccion(key); });
      collections.appendChild(button);
    });
    controls.appendChild(collections);
    variants = variants.filter(function(v) { return v.coleccion === cubiertaColeccionActiva; });
  }
  if (variants.length) {
    controls.appendChild(cubiertaElemento('p', 'cubierta-material-note', 'Selección opcional · ' + variants.length + ' acabados'));
    var grid = cubiertaElemento('div', 'cubierta-swatches');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Acabados de ' + info.titulo);
    variants.forEach(function(v) {
      var button = cubiertaElemento('button', 'cubierta-variante-select');
      button.type = 'button';
      button.dataset.varianteId = v.id;
      button.setAttribute('aria-pressed', String(!!state.cubiertaVariante && state.cubiertaVariante.id === v.id));
      var photo = cubiertaElemento('img');
      photo.src = cubiertaMuestra(v);
      photo.alt = '';
      photo.loading = 'lazy';
      button.appendChild(photo);
      button.appendChild(cubiertaElemento('span', '', v.nombre));
      button.addEventListener('click', function() { selectCubiertaVariante(v.id); });
      grid.appendChild(button);
    });
    controls.appendChild(grid);
    var clear = cubiertaElemento('button', 'cubierta-variante-clear', 'Dejar acabado por definir');
    clear.type = 'button';
    clear.addEventListener('click', function() { selectCubiertaVariante(null); });
    controls.appendChild(clear);
  } else if (state.cubiertaCategoria !== 'sinterizado' || cubiertaColeccionActiva) {
    controls.appendChild(cubiertaElemento('p', 'cubierta-material-note', 'Puedes continuar sin elegir acabado. No hay variantes disponibles en esta categoría.'));
  }
  var technical = cubiertaElemento('details', 'cubierta-information');
  technical.appendChild(cubiertaElemento('summary', '', 'Características generales del material'));
  technical.appendChild(cubiertaElemento('p', 'cubierta-material-note', 'Orientativas de la categoría, no de un acabado específico.'));
  var metrics = cubiertaElemento('div', 'cubierta-metrics');
  Object.keys(info.caracteristicas).forEach(function(key) {
    var c = info.caracteristicas[key];
    var card = cubiertaElemento('details', 'cubierta-metric');
    var summary = cubiertaElemento('summary');
    summary.appendChild(cubiertaElemento('span', 'cubierta-metric-label', c.titulo));
    summary.appendChild(cubiertaElemento('strong', '', c.nivel));
    card.appendChild(summary);
    card.appendChild(cubiertaElemento('p', '', c.detalle || c.nivel));
    metrics.appendChild(card);
  });
  technical.appendChild(metrics);
  controls.appendChild(technical);
  controls.appendChild(cubiertaElemento('p', 'cubierta-highlight', info.destacada));
  var advantages = cubiertaElemento('details', 'cubierta-information');
  advantages.appendChild(cubiertaElemento('summary', '', 'Ventajas principales'));
  var list = cubiertaElemento('ul');
  info.ventajas.forEach(function(text) { list.appendChild(cubiertaElemento('li', '', text)); });
  advantages.appendChild(list);
  controls.appendChild(advantages);
  var care = cubiertaElemento('details', 'cubierta-information');
  care.appendChild(cubiertaElemento('summary', '', 'Cuidados y mantenimiento'));
  var careList = cubiertaElemento('ul');
  // Reuse category guidance rather than duplicate it in the data or variants.
  ['manchas', 'calor', 'rayaduras', 'mantenimiento', 'sellado'].forEach(function(key) {
    var c = info.caracteristicas[key];
    careList.appendChild(cubiertaElemento('li', '', c.detalle || c.nivel));
  });
  care.appendChild(careList);
  controls.appendChild(care);
  controls.appendChild(cubiertaElemento('p', 'cubierta-material-note', 'Las características pueden variar según el fabricante, acabado y modelo específico.'));
  layout.appendChild(controls);
  panel.appendChild(layout);
  actualizarCubiertaVisual();
}

function selectCubiertaVariante(id) {
  var variant = (CUBIERTA_VARIANTES[state.cubiertaCategoria] || []).find(function(v) { return v.id === id; });
  if (id !== null && (!variant || (variant.coleccion && variant.coleccion !== cubiertaColeccionActiva))) return;
  state.cubiertaVariante = variant ? { id: variant.id, nombre: variant.nombre, coleccion: variant.coleccion || null, imagen: cubiertaImagenes(variant)[0] } : null;
  document.querySelectorAll('.cubierta-variante-select').forEach(function(button) {
    button.setAttribute('aria-pressed', String(!!variant && button.dataset.varianteId === variant.id));
  });
  actualizarCubiertaVisual();
  updateSidebar();
}

var cubiertaModalReturnFocus = null;
var cubiertaModalOverflow = '';
var cubiertaModalBackground = [];

function openCubiertaModal(trigger) {
  var modal = document.getElementById('cubiertaModal');
  if (!modal || !CUBIERTA_INFO[state.cubiertaCategoria]) return;
  document.getElementById('cubiertaModalTitle').textContent = state.cubierta;
  if (modal.hidden) {
    cubiertaModalReturnFocus = trigger || document.activeElement;
    cubiertaModalOverflow = document.body.style.overflow;
    cubiertaModalBackground = Array.from(document.body.children).filter(function(el) {
      return el !== modal && el.id !== 'lightbox' && !/^(SCRIPT|STYLE)$/.test(el.tagName);
    }).map(function(el) {
      var previous = el.inert;
      el.inert = true;
      return { element: el, inert: previous };
    });
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  document.getElementById('cubiertaModalClose').focus({ preventScroll: true });
}

function closeCubiertaModal() {
  var modal = document.getElementById('cubiertaModal');
  if (!modal || modal.hidden) return;
  var lb = document.getElementById('lightbox');
  if (lb && lb.style.display === 'flex') window.closeLightbox();
  modal.hidden = true;
  document.body.style.overflow = cubiertaModalOverflow;
  cubiertaModalBackground.forEach(function(item) { item.element.inert = item.inert; });
  cubiertaModalBackground = [];
  if (cubiertaModalReturnFocus && cubiertaModalReturnFocus.isConnected) {
    cubiertaModalReturnFocus.focus({ preventScroll: true });
  }
  cubiertaModalReturnFocus = null;
}

function handleCubiertaModalKeydown(event) {
  var modal = document.getElementById('cubiertaModal');
  if (!modal || modal.hidden) return;
  var lb = document.getElementById('lightbox');
  if (lb && lb.style.display === 'flex') return; // Escape closes only the top layer.
  if (event.key === 'Escape') {
    event.preventDefault();
    closeCubiertaModal();
  } else if (event.key === 'Tab') {
    var focusable = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, summary, [tabindex]')).filter(function(el) {
      return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0;
    });
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      event.preventDefault();
      if (last) last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      event.preventDefault();
      if (first) first.focus();
    }
  }
}
document.addEventListener('keydown', handleCubiertaModalKeydown);

function selectCubierta(el, key) {
  if (!CUBIERTA_INFO[key]) return;
  document.querySelectorAll('.cubierta-item').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  if (state.cubiertaCategoria !== key) state.cubiertaVariante = null;
  state.cubiertaCategoria = key;
  state.cubierta = CUBIERTA_INFO[key].titulo;
  state.cubPrecio = cubiertaPrecioTexto(key);
  cubiertaColeccionActiva = null;
  renderCubiertaVariantes();
  updateSidebar();
  openCubiertaModal(el);
}

function toggleExtra(el, key, label) {
  el.classList.toggle('active');
  if (el.classList.contains('active')) {
    if (state.extras.indexOf(label) === -1) state.extras.push(label);
  } else {
    state.extras = state.extras.filter(function(e){ return e !== label; });
  }
  updateSidebar();
}

/* ─── NAVIGATION / RENDER ─── */
var _currentStep = 0;

function renderStep(step) {
  _currentStep = step;
  var total = STEPS.length;

  document.querySelectorAll('.step-panel').forEach(function(p, i){
    p.classList.toggle('active', i === step);
  });

  var h = STEP_HEADERS[step];
  var eyebrow = document.getElementById('contentEyebrow');
  var title   = document.getElementById('contentTitle');
  var sub     = document.getElementById('contentSubtitle');
  if (eyebrow) eyebrow.textContent = h.eyebrow;
  if (title)   title.innerHTML = h.title;
  if (sub)     sub.textContent = h.sub;

  var fill = document.getElementById('topProgressFill');
  var ctr  = document.getElementById('counterCurrent');
  if (fill) fill.style.width = ((step + 1) / total * 100) + '%';
  if (ctr)  ctr.textContent = step + 1;

  var ind = document.getElementById('stepIndicator');
  if (ind) ind.textContent = 'Paso ' + (step + 1) + ' de ' + total;

  var prev = document.getElementById('btnPrev');
  var next = document.getElementById('btnNext');
  if (prev) prev.disabled = step === 0;
  if (next) {
    if (step === total - 1) {
      next.style.display = 'none';
    } else {
      next.style.display = '';
      next.innerHTML = 'Siguiente <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }

  if (step === total - 1) buildSummary();
  updateSidebar();
  window.scrollTo(0, 0);
}

function updateSidebar() {
  var sb = document.getElementById('sidebarSteps');
  if (!sb) return;
  sb.innerHTML = STEPS.map(function(s, i) {
    var active = i === _currentStep;
    var done   = i < _currentStep;
    var cls = 'sidebar-step' + (active?' active':'') + (done?' done':'');
    var bullet = done
      ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>'
      : (i + 1);
    var short = s.short();
    return '<div class="' + cls + '">' +
      '<div class="step-bullet">' + bullet + '</div>' +
      '<div class="step-text">' +
        '<span class="step-text-label">' + s.label + '</span>' +
        (short ? '<span class="step-text-val">' + short + '</span>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function nextStep() {
  var step = _currentStep;
  var ok = true;

  if (step === 0) {
    var n  = (document.getElementById('c-nombre') || {}).value || '';
    var t  = (document.getElementById('c-tel')    || {}).value || '';
    var d  = (document.getElementById('c-dir')    || {}).value || '';
    var f  = (document.getElementById('c-fecha')  || {}).value || '';
    var h  = (document.getElementById('c-hora')   || {}).value || '';
    var sEl = document.getElementById('c-sucursal');
    var s  = sEl ? sEl.value : '';
    if (!n.trim()||!t.trim()||!d.trim()||!f||!h||!s) {
      alert('Por favor completa: nombre, teléfono, dirección, fecha, hora y sucursal.');
      ok = false;
    } else {
      state.cliente = {
        nombre:   n.trim(),
        tel:      t.trim(),
        dir:      d.trim(),
        fecha:    f,
        hora:     h,
        sucursal: sEl.options[sEl.selectedIndex].text,
        asesor:   (document.getElementById('c-asesor') || {}).value || 'En línea',
        obs:      ((document.getElementById('c-obs') || {}).value || '').trim(),
      };
    }
  }
  if (step === 1 && !state.situacion)                    { alert('Selecciona una opción de situación actual.'); ok = false; }
  if (step === 2 && !state.interior)                     { alert('Selecciona el tablero interior.'); ok = false; }
  if (step === 3) {
    var lineas = Object.keys(state.frentes);
    if (lineas.length === 0) {
      alert('Selecciona al menos una línea de frentes.');
      ok = false;
    } else {
      var hasColor = false;
      for (var i = 0; i < lineas.length; i++) {
        if (state.frentes[lineas[i]].length > 0) {
          hasColor = true;
          break;
        }
      }
      if (!hasColor) {
        alert('Por favor selecciona al menos un color dentro de la línea elegida.');
        ok = false;
      }
    }
  }

  if (!ok) return;
  if (step < STEPS.length - 1) renderStep(step + 1);
}

function prevStep() {
  if (_currentStep > 0) renderStep(_currentStep - 1);
}

/* ─── SUMMARY ─── */
function buildSummary() {
  var grid = document.getElementById('summaryGrid');
  if (!grid) return;

  var situacionLabel = {'sin-cocina':'Sin cocina','barra-concreto':'Base de concreto','remodelacion':'Remodelación'};
  var frentesText = Object.keys(state.frentes).map(function(k) {
    var lbl = {economica:'Económica', arauco:'Arauco', decorlux:'Decorlux', transformad:'Transformad'}[k] || k;
    var c   = state.frentes[k];
    return lbl + (c && c.length ? ' (' + c.join(', ') + ')' : '');
  }).join(' | ') || '—';

  var boxes = [
    {
      title: 'Cliente',
      rows: [
        {label:'Nombre',        val: state.cliente.nombre},
        {label:'Teléfono',      val: state.cliente.tel},
        {label:'Dirección',     val: state.cliente.dir},
        {label:'Levantamiento', val: state.cliente.fecha + '  ' + state.cliente.hora},
        {label:'Sucursal',      val: state.cliente.sucursal},
        {label:'Atendido por',  val: state.cliente.asesor},
      ]
    },
    {
      title: 'Materiales',
      rows: [
        {label:'Situación', val: situacionLabel[state.situacion] || '—'},
        {label:'Interior',  val: state.interior==='blanco-frosty' ? 'Blanco Frosty 15mm Arauco' : 'Gris Oxford 15mm Arauco'},
        {label:'Frentes',   val: frentesText},
        {label:'Cubierta',  val: (state.cubierta||'—') + (state.cubPrecio ? ' — ' + state.cubPrecio : '')},
        {label:'Variante', val: cubiertaVarianteTexto()},
      ]
    },
    {
      title: 'Herrajes',
      rows: [
        {label:'Bisagras',    val: state.bisagra},
        {label:'Correderas',  val: state.corredera || '—'},
        {label:'Cajones',     val: state.cajones.join(', ') || '—'},
        {label:'Basurero',    val: state.basurero || '—'},
        {label:'Especiero',    val: state.especias  || '—'},
        {label:'Módulos esp.',val: state.modulos.join(', ') || '—'},
      ]
    },
    {
      title: 'Extras',
      rows: state.extras.length
        ? state.extras.map(function(e){ return {label: e, val: 'Incluido'}; })
        : [{label: 'Sin extras adicionales', val: ''}]
    },
  ];

  grid.innerHTML = boxes.map(function(b) {
    return '<div class="summary-box">' +
      '<div class="summary-box-title">' + b.title + '</div>' +
      b.rows.map(function(r){
        return '<div class="summary-row">' +
          '<span class="summary-row-label">' + r.label + '</span>' +
          '<span class="summary-row-val">' + (r.val || '—') + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }).join('');

  if (state.cubiertaVariante) {
    var preview = document.createElement('img');
    preview.className = 'cubierta-summary-img';
    preview.src = state.cubiertaVariante.imagen;
    preview.alt = state.cubiertaVariante.nombre;
    grid.children[1].appendChild(preview);
  }

  var totalEl = document.getElementById('totalAmount');
  if (totalEl) totalEl.textContent = 'A confirmar tras levantamiento';
}

/* ─── PDF ─── */
function downloadPDF() {
  var logoEl = new Image();
  logoEl.crossOrigin = 'anonymous';
  logoEl.onload = function() {
    var c = document.createElement('canvas');
    c.width  = logoEl.naturalWidth  || 120;
    c.height = logoEl.naturalHeight || 120;
    c.getContext('2d').drawImage(logoEl, 0, 0);
    _buildPDF(c.toDataURL('image/jpeg', 0.9));
  };
  logoEl.onerror = function() { _buildPDF(null); };
  logoEl.src = '/img/logo.jpg';
}

function _buildPDF(logoDataURL) {
  var jsPDF  = window.jspdf.jsPDF;
  var doc    = new jsPDF({ unit:'mm', format:'a4' });
  var W      = 210;
  var M      = 16;
  var GREEN  = [26,  79,  46];
  var GREEN2 = [38, 110,  64];
  var CREAM  = [248, 246, 240];
  var DARK   = [22,  26,  23];
  var MUTED  = [110, 122, 116];
  var BORDER = [220, 226, 222];
  var GOLD   = [180, 148, 80];

  var folio = 'COT-' + Date.now().toString().slice(-6);
  var fecha = new Date().toLocaleDateString('es-MX', {year:'numeric', month:'long', day:'numeric'});
  var y = 0;

  /* HEADER */
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(0, 0, W, 46, 'F');
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 44, W, 1.2, 'F');

  if (logoDataURL) {
    doc.setFillColor(255,255,255);
    doc.roundedRect(M, 7, 28, 28, 3, 3, 'F');
    doc.addImage(logoDataURL, 'JPEG', M+1, 8, 26, 26);
  } else {
    doc.setFillColor(255,255,255);
    doc.roundedRect(M, 7, 28, 28, 3, 3, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(26,79,46);
    doc.text('MHG', M+14, 24, {align:'center'});
  }

  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(255,255,255);
  doc.text('MHG COCINAS', M+34, 19);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(200,230,210);
  doc.text('Configuración de Cocina Integral', M+34, 26);
  doc.setDrawColor(GREEN2[0],GREEN2[1],GREEN2[2]); doc.setLineWidth(0.3);
  doc.line(M+34, 29, W-M, 29);
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(200,230,210);
  doc.text('Folio:', W-M-34, 20);
  doc.setFont('helvetica','normal');
  doc.text(folio, W-M, 20, {align:'right'});
  doc.text(fecha, W-M, 27, {align:'right'});

  y = 56;
  var rowAlt = false;

  var section = function(txt, yy) {
    if (yy + 23 > 240) { doc.addPage(); yy = 20; }
    doc.setFillColor(CREAM[0],CREAM[1],CREAM[2]);
    doc.rect(M, yy, W-M*2, 9, 'F');
    doc.setFillColor(GREEN[0],GREEN[1],GREEN[2]);
    doc.rect(M, yy, 3, 9, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(GREEN[0],GREEN[1],GREEN[2]);
    doc.text(txt.toUpperCase(), M+7, yy+6);
    doc.setDrawColor(BORDER[0],BORDER[1],BORDER[2]); doc.setLineWidth(0.2);
    doc.line(M, yy+9, W-M, yy+9);
    rowAlt = false;
    return yy + 15;
  };

  var row = function(label, value, yy) {
    if (yy + 8 > 240) { doc.addPage(); yy = 20; }
    if (rowAlt) { doc.setFillColor(245,247,245); doc.rect(M, yy-5, W-M*2, 8,'F'); }
    rowAlt = !rowAlt;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text(label, M+4, yy);
    doc.setFont('helvetica','normal'); doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    var val = value || '—';
    if (val.length > 62) val = val.substring(0,59) + '...';
    doc.text(val, M+56, yy);
    doc.setDrawColor(BORDER[0],BORDER[1],BORDER[2]); doc.setLineWidth(0.1);
    doc.line(M, yy+2.5, W-M, yy+2.5);
    return yy + 8;
  };

  var situacionLabel = {'sin-cocina':'Sin cocina','barra-concreto':'Base de concreto','remodelacion':'Remodelación'};
  var frentesText = Object.keys(state.frentes).map(function(k){
    var lbl = {economica:'Económica',arauco:'Arauco',decorlux:'Decorlux',transformad:'Transformad'}[k]||k;
    var c   = state.frentes[k];
    return lbl + (c&&c.length?' ('+c.join(', ')+')':'');
  }).join(' | ') || '—';

  // Cliente
  y = section('Datos del cliente', y);
  y = row('Nombre:',        state.cliente.nombre, y);
  y = row('Teléfono:',      state.cliente.tel, y);
  y = row('Dirección:',     state.cliente.dir, y);
  y = row('Levantamiento:', state.cliente.fecha + '  ' + state.cliente.hora, y);
  y = row('Sucursal:',      state.cliente.sucursal, y);
  y = row('Atendido por:',  state.cliente.asesor, y);
  if (state.cliente.obs) y = row('Observaciones:', state.cliente.obs, y);
  y += 6;

  // Materiales
  y = section('Materiales seleccionados', y);
  y = row('Situación:', situacionLabel[state.situacion]||'—', y);
  y = row('Interior:',  state.interior==='blanco-frosty'?'Blanco Frosty 15mm Arauco':'Gris Oxford 15mm Arauco', y);
  y = row('Frentes:',   frentesText, y);
  y = row('Cubierta:',  (state.cubierta||'—') + (state.cubPrecio?' — '+state.cubPrecio:''), y);
  y = row('Variante:', cubiertaVarianteTexto(), y);
  y += 6;

  // Herrajes
  y = section('Herrajes', y);
  y = row('Bisagras:',    state.bisagra, y);
  y = row('Correderas:',  state.corredera || '—', y);
  y = row('Cajones:',     state.cajones.join(', ') || '—', y);
  y = row('Basurero:',    state.basurero || '—', y);
  y = row('Especiero:',    state.especias  || '—', y);
  if (state.modulos.length) y = row('Módulos esp.:',  state.modulos.join(', '), y);
  y += 6;

  // Extras
  if (state.extras.length) {
    y = section('Elementos adicionales', y);
    state.extras.forEach(function(e){ y = row(e + ':', 'Incluido', y); });
    y += 6;
  }

  // Note
  if (y > 240) { doc.addPage(); }
  var noteY = 248;
  doc.setFillColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.roundedRect(M, noteY, W-M*2, 12, 2, 2, 'F');
  doc.setDrawColor(BORDER[0],BORDER[1],BORDER[2]); doc.setLineWidth(0.3);
  doc.roundedRect(M, noteY, W-M*2, 12, 2, 2, 'S');
  doc.setFont('helvetica','italic'); doc.setFontSize(7.5); doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
  doc.text('Este documento es una preconfiguración orientativa. La cotización formal se entregará tras el levantamiento en sitio.', W/2, noteY+7.5, {align:'center'});

  // Footer
  doc.setFillColor(GREEN[0],GREEN[1],GREEN[2]);
  doc.rect(0, 272, W, 25, 'F');
  doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.rect(0, 272, W, 1.2, 'F');
  if (logoDataURL) doc.addImage(logoDataURL, 'JPEG', M, 276, 13, 13);
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255);
  doc.text('MHG Arquitectos', M+16, 281);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(200,230,210);
  doc.text('Cocinas Integrales · Mobiliario · Interiorismo', M+16, 287);
  doc.text('mhgarquitectos.com', W-M, 281, {align:'right'});
  doc.text('Folio: ' + folio, W-M, 287, {align:'right'});

  /* FILENAME: MHG_Cocinas_<cliente>_<sucursal>_<folio> */
  var clean = function(s){ return (s||'').replace(/\s+/g,'_').replace(/[^A-Za-z0-9_áéíóúÁÉÍÓÚñÑ]/g,''); };
  var filename = 'MHG_Cocinas_' + clean(state.cliente.nombre) + '_' + clean(state.cliente.sucursal) + '_' + folio + '.pdf';
  doc.save(filename);
}

/* ─── WHATSAPP ─── */
function sendWhatsApp() {
  var situacionLabel = {'sin-cocina':'Sin cocina','barra-concreto':'Base de concreto','remodelacion':'Remodelación'};
  var frentesText = Object.keys(state.frentes).map(function(k){
    var lbl = {economica:'Económica',arauco:'Arauco',decorlux:'Decorlux',transformad:'Transformad'}[k]||k;
    var c   = state.frentes[k];
    return '  • ' + lbl + (c&&c.length?' ('+c.join(', ')+')':'');
  }).join('\n') || '  • —';

  var msg = '*CONFIGURACIÓN COCINA — MHG*\n\n' +
    '*Cliente:* '       + state.cliente.nombre + '\n' +
    '*Tel:* '           + state.cliente.tel + '\n' +
    '*Dirección:* '     + state.cliente.dir + '\n' +
    '*Levantamiento:* ' + state.cliente.fecha + '  ' + state.cliente.hora + '\n' +
    '*Sucursal:* '      + state.cliente.sucursal + '\n' +
    '*Atendido por:* '  + state.cliente.asesor + '\n\n' +
    '*SITUACIÓN:* '   + (situacionLabel[state.situacion]||'—') + '\n' +
    '*INTERIOR:* '    + (state.interior==='blanco-frosty'?'Blanco Frosty 15mm':'Gris Oxford 15mm') + '\n' +
    '*FRENTES:*\n'    + frentesText + '\n' +
    '*CUBIERTA:* '    + (state.cubierta||'—') + (state.cubPrecio ? ' — ' + state.cubPrecio : '') + '\n' +
    '*VARIANTE:* '    + cubiertaVarianteTexto() + '\n\n' +
    '*HERRAJES:*\n' +
    '  • Bisagras: '   + state.bisagra + '\n' +
    '  • Correderas: ' + (state.corredera||'—') + '\n' +
    '  • Cajones: '    + (state.cajones.join(', ')||'—') + '\n' +
    '  • Basurero: '   + (state.basurero||'—') + '\n' +
    '  • Especiero: '   + (state.especias||'—') + '\n' +
    '  • Módulos: '    + (state.modulos.join(', ')||'—') + '\n' +
    '*EXTRAS:* '       + (state.extras.join(', ')||'Ninguno') + '\n\n' +
    (state.cliente.obs ? '*Obs:* ' + state.cliente.obs + '\n\n' : '') +
    '_Configuración enviada desde mhgarquitectos.com_';

  window.open('https://wa.me/5212717041499?text=' + encodeURIComponent(msg), '_blank');
}

function selectFrenteZone(btn) { var p = btn.parentElement; p.querySelectorAll('.frente-zone-btn').forEach(function(b){ b.classList.remove('sel'); }); btn.classList.add('sel'); }

// FRENTE MODAL LOGIC
var currentModalLineKey = null;
var currentModalSelection = []; // temporary selection array of objects {cname, zone}
var frenteModalPreviousOverflow = '';
var frenteModalReturnFocus = null;

function updateFrenteModalPreview(cObj, label, previewOnly) {
  var imgWrap = document.querySelector('.modal-preview-img-wrap');
  var img = document.getElementById('modalPreviewImg');
  var placeholder = document.getElementById('modalPreviewPlaceholder');
  var status = document.getElementById('modalZoneStatus');
  if (!cObj || !img || !imgWrap) return;

  var previewImages = [cObj.kitchen, cObj.swatch].filter(function(src, index, all) { return src && all.indexOf(src) === index; });
  var newSrc = previewImages[0] || null;
  var zoom = document.getElementById('frentePreviewZoom');
  if (zoom) {
    zoom.hidden = !newSrc;
    zoom.onclick = function(event) { event.stopPropagation(); window.openLightbox(previewImages, label); };
  }
  img.onclick = function(event) { event.stopPropagation(); if (newSrc) window.openLightbox(previewImages, label); };
  img.alt = label;
  imgWrap.style.background = cObj.hex || '';
  if (newSrc) {
    if (placeholder) placeholder.style.display = 'none';
    img.style.display = 'block';
    img.style.opacity = '0';
    img.src = newSrc;
    requestAnimationFrame(function() { img.style.opacity = '1'; });
  } else {
    img.style.display = 'none';
    img.removeAttribute('src');
    img.style.opacity = '0';
    if (placeholder) placeholder.style.display = cObj.hex ? 'none' : 'flex';
  }
  if (status) status.textContent = (previewOnly ? 'Vista previa · ' : '') + label;
}

function openFrenteModal(lineKey) {
  try {
    currentModalLineKey = lineKey;
    var lineLabel = {economica:'Económica', arauco:'Arauco', decorlux:'Decorlux', transformad:'Transformad'}[lineKey] || lineKey;

    document.getElementById('frenteModalTitle').textContent = 'Frentes exteriores';
    document.getElementById('frenteModalLineTitle').textContent = 'Línea ' + lineLabel;
    
    currentModalSelection = [];
    if (state.frentes && state.frentes[lineKey]) {
       state.frentes[lineKey].forEach(function(c) { currentModalSelection.push({ cname: c, zone: 'Toda la cocina' }); });
    }
    
    var palette = PALETTES[lineKey] || [];
    var lastGroup = null;
    var colorsHTML = palette.map(function(c) {
      var isSel = currentModalSelection.find(function(s) { return s.cname === c.name; });
      var selClass = isSel ? 'sel' : '';

      // Group label logic (for decorlux: HG·, Mate·, SM·)
      var groupPrefix = null;
      var m = c.name.match(/^([A-Z]{2,}(?:\s[A-Za-z]+)?)\s·\s/);
      if (m) groupPrefix = m[1];
      var labelHTML = '';
      if (groupPrefix && groupPrefix !== lastGroup) {
        lastGroup = groupPrefix;
        var groupLabels = {'HG':'Alto Brillo (High Gloss)', 'Mate':'Acrílico Mate', 'SM':'Supramatte'};
        labelHTML = '<div class="frente-modal-grid-label">' + (groupLabels[groupPrefix] || groupPrefix) + '</div>';
      }
      // Display name: strip "XX · " prefix
      var displayName = c.name.replace(/^[A-Z]{2,}(?:\s[A-Za-z]+)?\s·\s/, '');

      var cardHTML;
      if (c.swatch) {
        cardHTML = '<div class="frente-color-card ' + selClass + '" role="button" tabindex="0" aria-pressed="' + String(!!isSel) + '" onclick="toggleModalColor(this, \'' + c.name + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}">' +
          '<div class="frente-color-card-img">' +
            '<img src="' + c.swatch + '" alt="' + displayName + '" loading="lazy" />' +
            '<div class="frente-color-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>' +
          '</div>' +
          '<div class="frente-color-card-name">' + displayName + '</div>' +
        '</div>';
      } else {
        var lightBg = ['#FFFFFF','#FAFAFA','#F8F8F6','#F5F4F0','#F5EDD6','#F2EBD8'].indexOf(c.hex) !== -1;
        cardHTML = '<div class="frente-color-card ' + selClass + '" role="button" tabindex="0" aria-pressed="' + String(!!isSel) + '" onclick="toggleModalColor(this, \'' + c.name + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}">' +
          '<div class="frente-color-card-img" style="background:' + c.hex + ';' + (lightBg ? 'box-shadow:inset 0 0 0 1px #ccc;' : '') + '">' +
            '<div class="frente-color-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>' +
          '</div>' +
          '<div class="frente-color-card-name">' + displayName + '</div>' +
        '</div>';
      }
      return labelHTML + cardHTML;
    }).join('');

    var grid = document.getElementById('frenteModalGrid');
    grid.innerHTML = colorsHTML;

    // Reset and initialize the large preview without changing temporary state.
    var img = document.getElementById('modalPreviewImg');
    var ph  = document.getElementById('modalPreviewPlaceholder');
    if (img) {
      img.style.display = 'none';
      img.removeAttribute('src');
      img.style.opacity = '1';
      img.onclick = function(event) {
        event.stopPropagation();
        if (img.src) window.openLightbox(img.src, document.getElementById('modalZoneStatus').textContent);
      };
    }
    if (ph)  { ph.style.display = 'flex'; }
    var status = document.getElementById('modalZoneStatus');
    if (status) status.textContent = 'Selecciona un acabado';

    var selectedName = currentModalSelection.length ? currentModalSelection[0].cname : null;
    var previewColor = palette.find(function(c) { return c.name === selectedName; }) || palette[0];
    if (previewColor) updateFrenteModalPreview(previewColor, previewColor.name, !selectedName);


    var modal = document.getElementById('frenteColorModal');
    if (modal) {
      frenteModalReturnFocus = document.activeElement;
      frenteModalPreviousOverflow = document.body.style.overflow;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.getElementById('frenteModalClose').focus({ preventScroll: true });
    } else {
      console.error("Modal element not found!");
      alert("Error: El modal no se encontró en la página.");
    }
  } catch (err) {
    console.error("Error in openFrenteModal:", err);
    alert("Hubo un error al abrir la selección: " + err.message);
  }
}

function closeFrenteModal() {
  var modal = document.getElementById('frenteColorModal');
  if (!modal || !modal.classList.contains('active')) return;
  modal.classList.remove('active');
  document.body.style.overflow = frenteModalPreviousOverflow;
  if (frenteModalReturnFocus && frenteModalReturnFocus.isConnected) frenteModalReturnFocus.focus({ preventScroll: true });
  frenteModalReturnFocus = null;
}

function toggleModalColor(el, cname) {
  var isSel = el.classList.contains('sel');
  var p = el.parentElement;
  var imgWrap     = document.getElementById('modalPreviewImg').parentElement;
  var img         = document.getElementById('modalPreviewImg');
  var placeholder = document.getElementById('modalPreviewPlaceholder');
  var status      = document.getElementById('modalZoneStatus');

  if (isSel) {
    el.classList.remove('sel');
    el.setAttribute('aria-pressed', 'false');
    currentModalSelection = currentModalSelection.filter(function(s) { return s.cname !== cname; });
    var firstColor = (PALETTES[currentModalLineKey] || [])[0];
    if (firstColor) updateFrenteModalPreview(firstColor, firstColor.name, true);
    else if (status) status.textContent = 'Selecciona un acabado';
  } else {
    // Deselect all others
    p.querySelectorAll('.frente-color-card').forEach(function(c){ c.classList.remove('sel'); c.setAttribute('aria-pressed', 'false'); });
    el.classList.add('sel');
    el.setAttribute('aria-pressed', 'true');
    currentModalSelection = [{ cname: cname, zone: 'Toda la cocina' }];

    var cObj = (PALETTES[currentModalLineKey]||[]).find(function(c){ return c.name === cname; });
    if (cObj) updateFrenteModalPreview(cObj, cname, false);
  }
}

document.addEventListener('keydown', function(event) {
  var modal = document.getElementById('frenteColorModal');
  var lightbox = document.getElementById('lightbox');
  if (!modal || !modal.classList.contains('active') || (lightbox && lightbox.style.display === 'flex')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeFrenteModal();
  }
});

function applyFrenteModal() {
  var cnames = currentModalSelection.map(function(s){ return s.cname; });
  if (cnames.length > 0) {
    state.frentes[currentModalLineKey] = cnames; 
  } else {
    delete state.frentes[currentModalLineKey];
  }
  closeFrenteModal();
  buildFrente(); 
  updateSidebar();
}
