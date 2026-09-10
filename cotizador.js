/* ═══════════════════════════════════════════════════════════
   MHG Cocinas — Configurador v4
   cotizador.js
═══════════════════════════════════════════════════════════ */

/* ─── STATE ─── */
var state = {
  cliente: { nombre:'', tel:'', fecha:'', hora:'', sucursal:'', asesor:'', dir:'', obs:'' },
  situacion:  null,
  interior:   null,
  frentes:    {},   // { economica: ['Blanco','Gris'], arauco: ['Nogal'] ... }
  bisagra:    'Hettich concealed',
  corredera:  null,
  cajones:    [],
  modulos:    [],
  cubierta:   null,
  cubPrecio:  null,
  extras:     [],
};

/* ─── STEPS META ─── */
var STEPS = [
  { key:'cliente',   label:'Datos del cliente',    short: function(){ return state.cliente.nombre || ''; } },
  { key:'situacion', label:'Situación actual',      short: function(){ var m={sin_cocina:'Sin cocina', barra_concreto:'Barra de concreto', remodelacion:'Remodelación'}; return m[state.situacion] || ''; } },
  { key:'interior',  label:'Tableros interiores',   short: function(){ return state.interior ? (state.interior==='blanco-frosty'?'Blanco Frosty':'Gris Oxford') : ''; } },
  { key:'frentes',   label:'Frentes exteriores',    short: function(){ var k=Object.keys(state.frentes); return k.length ? k.length+' línea'+(k.length!==1?'s':'') : ''; } },
  { key:'herrajes',  label:'Herrajes',               short: function(){ return state.corredera ? state.corredera.split(' ').slice(0,2).join(' ') : ''; } },
  { key:'cubierta',  label:'Cubierta',               short: function(){ return state.cubierta || ''; } },
  { key:'extras',    label:'Extras',                 short: function(){ return state.extras.length ? state.extras.length+' extra'+(state.extras.length!==1?'s':'') : 'Ninguno'; } },
  { key:'resumen',   label:'Resumen',                short: function(){ return ''; } },
];

var STEP_HEADERS = [
  { eyebrow:'Paso 1 de 8', title:'Tus <em>datos</em>', sub:'Llena tu información de contacto para personalizar la cotización.' },
  { eyebrow:'Paso 2 de 8', title:'<em>Situación</em> actual', sub:'Cuéntanos cómo está el espacio hoy para ajustar la propuesta.' },
  { eyebrow:'Paso 3 de 8', title:'<em>Tableros</em> interiores', sub:'El acabado interior de todos los muebles lleva este material.' },
  { eyebrow:'Paso 4 de 8', title:'<em>Frentes</em> exteriores', sub:'Los frentes son las puertas visibles de tu cocina. Puedes combinar líneas y colores por zonas.' },
  { eyebrow:'Paso 5 de 8', title:'<em>Herrajes</em>', sub:'Selecciona bisagras, correderas, tipo de cajón y módulos especiales.' },
  { eyebrow:'Paso 6 de 8', title:'<em>Cubierta</em>', sub:'El material de la superficie de trabajo de tu cocina.' },
  { eyebrow:'Paso 7 de 8', title:'<em>Extras</em>', sub:'Agrega elementos adicionales que complementen tu proyecto.' },
  { eyebrow:'Paso 8 de 8', title:'Tu <em>resumen</em>', sub:'Revisa la configuración y descarga o comparte tu preconfiguración.' },
];

/* ─── COLOR PALETTES per frente line ─── */
var PALETTES = {
  economica: [
    {name:'Blanco',  hex:'#FFFFFF'},{name:'Crema',   hex:'#F5EDD6'},
    {name:'Beige',   hex:'#E8D8B8'},{name:'Gris claro', hex:'#D0D0CC'},
    {name:'Gris medio',hex:'#A0A09A'},{name:'Gris oscuro',hex:'#6A6A66'},
    {name:'Negro',   hex:'#222222'},{name:'Nogal',   hex:'#7A4E2D'},
    {name:'Cerezo',  hex:'#8B3030'},
  ],
  arauco: [
    {name:'Blanco Frosty', hex:'#F5F4F0'},{name:'Gris Oxford', hex:'#888A86'},
    {name:'Gris Ceniza',   hex:'#B0B4B0'},{name:'Negro Onyx',  hex:'#1A1A18'},
    {name:'Nogal Europeo', hex:'#6B4226'},{name:'Olivo',       hex:'#6B7551'},
    {name:'Arena',         hex:'#D4BFA0'},{name:'Roble',       hex:'#A0784E'},
    {name:'Wenge',         hex:'#3D2B1A'},{name:'Larice',      hex:'#C8A878'},
    {name:'Crema Puro',    hex:'#F2EBD8'},{name:'Teka',        hex:'#8B6040'},
  ],
  decorlux: [
    {name:'Blanco Nieve',  hex:'#FAFAFA'},{name:'Gris Bruma',  hex:'#C8C8C4'},
    {name:'Gris Acero',    hex:'#808080'},{name:'Grafito',     hex:'#484848'},
    {name:'Negro Matt',    hex:'#1E1E1E'},{name:'Caramelo',    hex:'#C08040'},
    {name:'Tabaco',        hex:'#7A4A28'},{name:'Sahara',      hex:'#C8A870'},
    {name:'Champagne',     hex:'#E8D8A0'},{name:'Verde Salvia', hex:'#8A9A7A'},
    {name:'Azul Noche',    hex:'#2A3A5E'},{name:'Bordo',       hex:'#6A1E28'},
  ],
  transformad: [
    {name:'Blanco Polar',  hex:'#F8F8F6'},{name:'Gris Perla',  hex:'#D8D8D4'},
    {name:'Gris Topo',     hex:'#9A9490'},{name:'Antracita',   hex:'#3A3A38'},
    {name:'Negro Piano',   hex:'#101010'},{name:'Roble Nórdico',hex:'#C8A060'},
    {name:'Madera Natural',hex:'#A87840'},{name:'Noce',        hex:'#6A4020'},
    {name:'Arena Fina',    hex:'#DCC898'},{name:'Mint',        hex:'#B0D0C0'},
    {name:'Azul Marino',   hex:'#1A2A4A'},{name:'Terracota',   hex:'#B05030'},
  ],
};

/* ─── HERRAJE SECTIONS (built by JS) ─── */
var HERRAJE_SECTIONS = [
  {
    id:'bisagras', title:'Bisagras',
    type:'radio', key:'bisagra',
    opts:[
      { id:'bis-hettich', label:'Marco Hettich — Bisagra oculta', desc:'Bisagra de cazoleta apertura 110°. Estándar en todas las líneas.', val:'Hettich concealed' },
    ],
    preselect:'bis-hettich',
  },
  {
    id:'correderas', title:'Correderas para cajones',
    type:'radio', key:'corredera',
    opts:[
      { id:'cor-bas', label:'Línea Básica — Telescópica',              desc:'Corredera lateral extensión completa, instalación sencilla.',           val:'Básica telescópica' },
      { id:'cor-med', label:'Línea Media — Telescópica reforzada',     desc:'Mayor capacidad de carga, deslizamiento más suave.',                    val:'Media telescópica reforzada' },
      { id:'cor-alt', label:'Línea Alta — Oculta cierre suave Hettich',desc:'Corredera bajo-montada, invisible desde exterior. Amortiguación automática.', val:'Alta Hettich oculta soft-close' },
    ],
  },
  {
    id:'cajones', title:'Cajones',
    type:'multi', key:'cajones',
    opts:[
      { id:'caj-mol', label:'Con moldura',          desc:'Cajón estándar con frente moldurado.',    val:'Con moldura' },
      { id:'caj-alu', label:'Aluminio',              desc:'Perfil lateral de aluminio anodizado.',   val:'Aluminio' },
      { id:'caj-cri', label:'Laterales de cristal', desc:'Cristal lateral con perfil de aluminio.', val:'Laterales de cristal' },
    ],
  },
  {
    id:'modulos', title:'Módulos especiales',
    type:'multi', key:'modulos',
    opts:[
      { id:'mod-esp', label:'Extraíble especias',        desc:'Extraíble angosto junto a parrilla.',         val:'Extraíble especias' },
      { id:'mod-esq', label:'Esquinero extraíble',       desc:'Sistema giratorio para esquinas ciegas.',     val:'Esquinero extraíble' },
      { id:'mod-hor', label:'Torre de horno',            desc:'Módulo vertical para horno empotrado.',       val:'Torre de horno' },
      { id:'mod-gar', label:'Módulo extraíble garrafón', desc:'Cajón profundo con guías para garrafón.',     val:'Módulo garrafón' },
      { id:'mod-tar', label:'Módulo tarja',              desc:'Módulo base con tarja integrada.',            val:'Módulo tarja' },
    ],
  },
];

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', function() {
  buildFrente();
  buildHerrajeContainer();
  renderStep(0);
});

/* ─── FRENTE BUILDER ─── */
function buildFrente() {
  var container = document.getElementById('frenteList');
  if (!container) return;
  var lines = [
    { key:'economica', label:'Línea Económica', mm:'15 mm', price:'$850 / tablero' },
    { key:'arauco',    label:'Línea Arauco',     mm:'15 mm', price:'$1,700 / tablero' },
    { key:'decorlux',  label:'Línea Decorlux',   mm:'18 mm', price:'$6,500 / tablero' },
    { key:'transformad',label:'Línea Transformad',mm:'18 mm', price:'$8,500 / tablero' },
  ];
  container.innerHTML = lines.map(function(l) {
    var colors = (PALETTES[l.key]||[]).map(function(c) {
      return '<div class="color-chip" style="background:' + c.hex + ';' +
        (c.hex==='#FFFFFF'||c.hex==='#FAFAFA'||c.hex==='#F8F8F6'||c.hex==='#F5F4F0'?'box-shadow:inset 0 0 0 1px #ccc;':'') + '"' +
        ' onclick="toggleFrenteColor(event,\'' + l.key + '\',\'' + c.name + '\')" title="' + c.name + '">' +
        '<span class="color-chip-tooltip">' + c.name + '</span>' +
        '</div>';
    }).join('');
    return '<div class="frente-item" id="fr-' + l.key + '" data-key="' + l.key + '">' +
      '<div class="frente-header" onclick="toggleFrente(\'fr-' + l.key + '\')">' +
        '<div class="frente-checkbox"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>' +
        '<div class="frente-header-info">' +
          '<div class="frente-name">' + l.label + '</div>' +
          '<div class="frente-meta">' + l.mm + ' · ' + l.price + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="frente-palette-wrap">' +
        '<div class="frente-palette-label">Selecciona color(es)</div>' +
        '<div class="frente-colors" id="colors-' + l.key + '">' + colors + '</div>' +
        '<div class="frente-zone-note">Puedes elegir varios colores si distintas zonas llevan acabados diferentes.</div>' +
      '</div>' +
    '</div>';
  }).join('');
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
    // deselect all colors
    var chips = el.querySelectorAll('.color-chip');
    chips.forEach(function(c){ c.classList.remove('sel'); });
  }
  updateSidebar();
}

function toggleFrenteColor(e, lineKey, colorName) {
  e.stopPropagation();
  var chip = e.currentTarget;
  var isSelected = chip.classList.toggle('sel');
  if (!state.frentes[lineKey]) state.frentes[lineKey] = [];
  if (isSelected) {
    if (state.frentes[lineKey].indexOf(colorName) === -1) state.frentes[lineKey].push(colorName);
  } else {
    state.frentes[lineKey] = state.frentes[lineKey].filter(function(c){ return c !== colorName; });
  }
  updateSidebar();
}

/* ─── HERRAJE BUILDER ─── */
function buildHerrajeContainer() {
  var container = document.getElementById('herrajeContainer');
  if (!container) return;
  container.innerHTML = HERRAJE_SECTIONS.map(function(sec) {
    var isOpen = sec.id === 'bisagras';
    var optsHTML;
    if (sec.type === 'radio') {
      optsHTML = '<div class="herraje-opts">' +
        sec.opts.map(function(o) {
          var isPresel = sec.preselect === o.id;
          return '<div class="herraje-opt' + (isPresel?' selected':'') + '" id="' + o.id + '" onclick="selectHerrajeOpt(this,\'' + sec.key + '\',\'' + o.val + '\')">' +
            '<div class="herraje-radio"></div>' +
            '<div><div class="herraje-opt-name">' + o.label + '</div><div class="herraje-opt-desc">' + o.desc + '</div></div>' +
          '</div>';
        }).join('') +
      '</div>';
    } else {
      optsHTML = '<div class="multi-grid">' +
        sec.opts.map(function(o) {
          return '<div class="multi-opt" id="' + o.id + '" onclick="toggleMultiOpt(this,\'' + sec.key + '\',\'' + o.val + '\')">' +
            '<div class="multi-cb"></div>' +
            '<span class="multi-name">' + o.label + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
    }
    return '<div class="herraje-section' + (isOpen?' open':'') + '" id="sec-' + sec.id + '">' +
      '<div class="herraje-section-header' + (isOpen?' open':'') + '" onclick="toggleHerrajeSection(\'sec-' + sec.id + '\')">' +
        '<span class="herraje-section-title">' + sec.title + '</span>' +
        '<svg class="herraje-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>' +
      '</div>' +
      '<div class="herraje-section-body">' + optsHTML + '</div>' +
    '</div>';
  }).join('');
}

function toggleHerrajeSection(id) {
  var el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
function selectHerrajeOpt(el, key, val) {
  var parent = el.closest('.herraje-section-body');
  if (parent) parent.querySelectorAll('.herraje-opt').forEach(function(o){ o.classList.remove('selected'); });
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
function selectCubierta(el, key, name, price) {
  document.querySelectorAll('.cubierta-item').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  state.cubierta = name;
  state.cubPrecio = price;
  updateSidebar();
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

/* ─── RENDER / NAVIGATION ─── */
var _currentStep = 0;

function renderStep(step) {
  _currentStep = step;
  var total = STEPS.length;

  // panels
  document.querySelectorAll('.step-panel').forEach(function(p, i) {
    p.classList.toggle('active', i === step);
  });

  // header
  var h = STEP_HEADERS[step];
  var eyebrow = document.getElementById('contentEyebrow');
  var title   = document.getElementById('contentTitle');
  var sub     = document.getElementById('contentSubtitle');
  if (eyebrow) eyebrow.textContent = h.eyebrow;
  if (title)   title.innerHTML = h.title;
  if (sub)     sub.textContent = h.sub;

  // progress
  var fill = document.getElementById('topProgressFill');
  var ctr  = document.getElementById('counterCurrent');
  if (fill) fill.style.width = ((step + 1) / total * 100) + '%';
  if (ctr)  ctr.textContent = step + 1;

  // footer indicator
  var ind = document.getElementById('stepIndicator');
  if (ind) ind.textContent = 'Paso ' + (step+1) + ' de ' + total;

  // nav buttons
  var prev = document.getElementById('btnPrev');
  var next = document.getElementById('btnNext');
  if (prev) prev.disabled = step === 0;
  if (next) {
    if (step === total - 1) {
      next.style.display = 'none';
    } else {
      next.style.display = '';
      next.textContent = '';
      next.innerHTML = 'Siguiente <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }

  // summary step
  if (step === total - 1) buildSummary();

  updateSidebar();
  window.scrollTo(0,0);
}

function updateSidebar() {
  var sb = document.getElementById('sidebarSteps');
  if (!sb) return;
  sb.innerHTML = STEPS.map(function(s, i) {
    var active = i === _currentStep;
    var done = i < _currentStep;
    var cls = 'sidebar-step' + (active?' active':'') + (done?' done':'');
    var bullet = done
      ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>'
      : (i+1);
    return '<div class="' + cls + '">' +
      '<div class="step-bullet">' + bullet + '</div>' +
      '<div class="step-text">' +
        '<span class="step-text-label">' + s.label + '</span>' +
        (s.short() ? '<span class="step-text-val">' + s.short() + '</span>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function nextStep() {
  var step = _currentStep;
  var ok = true;

  if (step === 0) {
    var n = document.getElementById('c-nombre').value.trim();
    var t = document.getElementById('c-tel').value.trim();
    var d = document.getElementById('c-dir').value.trim();
    var f = document.getElementById('c-fecha').value;
    var h = document.getElementById('c-hora').value;
    var s = document.getElementById('c-sucursal').value;
    if (!n||!t||!d||!f||!h||!s) { alert('Por favor completa todos los campos requeridos.'); ok = false; }
    else {
      state.cliente = {
        nombre: n, tel: t, dir: d, fecha: f, hora: h,
        sucursal: document.getElementById('c-sucursal').options[document.getElementById('c-sucursal').selectedIndex].text,
        asesor: document.getElementById('c-asesor').value || 'En línea',
        obs: document.getElementById('c-obs').value.trim(),
      };
    }
  }
  if (step === 1 && !state.situacion) { alert('Selecciona una opción de situación actual.'); ok = false; }
  if (step === 2 && !state.interior)  { alert('Selecciona el tablero interior.'); ok = false; }
  if (step === 3 && Object.keys(state.frentes).length === 0) { alert('Selecciona al menos una línea de frentes.'); ok = false; }

  if (!ok) return;
  if (step < STEPS.length - 1) renderStep(step + 1);
}

function prevStep() {
  if (_currentStep > 0) renderStep(_currentStep - 1);
}

/* ─── SUMMARY BUILDER ─── */
function buildSummary() {
  var grid = document.getElementById('summaryGrid');
  if (!grid) return;

  var frentesText = Object.keys(state.frentes).map(function(k) {
    var lbl = {economica:'Económica', arauco:'Arauco', decorlux:'Decorlux', transformad:'Transformad'}[k] || k;
    var cols = state.frentes[k];
    return lbl + (cols && cols.length ? ' (' + cols.join(', ') + ')' : '');
  }).join(' | ') || '—';

  var boxes = [
    {
      title:'Cliente',
      rows:[
        {label:'Nombre', val: state.cliente.nombre},
        {label:'Teléfono', val: state.cliente.tel},
        {label:'Dirección', val: state.cliente.dir},
        {label:'Levantamiento', val: state.cliente.fecha + ' ' + state.cliente.hora},
        {label:'Sucursal', val: state.cliente.sucursal},
        {label:'Atendido por', val: state.cliente.asesor},
      ]
    },
    {
      title:'Materiales',
      rows:[
        {label:'Situación', val: {sin_cocina:'Sin cocina', barra_concreto:'Base de concreto', remodelacion:'Remodelación'}[state.situacion]||'—'},
        {label:'Interior', val: state.interior==='blanco-frosty'?'Blanco Frosty 15mm':'Gris Oxford 15mm'},
        {label:'Frentes', val: frentesText},
        {label:'Cubierta', val: state.cubierta||'—'},
      ]
    },
    {
      title:'Herrajes',
      rows:[
        {label:'Bisagras', val: state.bisagra},
        {label:'Correderas', val: state.corredera||'—'},
        {label:'Cajones', val: state.cajones.join(', ')||'—'},
        {label:'Módulos especiales', val: state.modulos.join(', ')||'—'},
      ]
    },
    {
      title:'Extras',
      rows: state.extras.length
        ? state.extras.map(function(e){ return {label:e, val:'Incluido'}; })
        : [{label:'Sin extras adicionales', val:''}]
    },
  ];

  grid.innerHTML = boxes.map(function(b) {
    return '<div class="summary-box">' +
      '<div class="summary-box-title">' + b.title + '</div>' +
      b.rows.map(function(r){ return '<div class="summary-row"><span class="summary-row-label">' + r.label + '</span><span class="summary-row-val">' + (r.val||'—') + '</span></div>'; }).join('') +
    '</div>';
  }).join('');

  // Total estimate note
  var totalEl = document.getElementById('totalAmount');
  if (totalEl) totalEl.textContent = 'A confirmar tras levantamiento';
}

/* ─── PDF ─── */
function downloadPDF() {
  var logoEl = new Image();
  logoEl.crossOrigin = 'anonymous';
  logoEl.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width  = logoEl.naturalWidth  || 120;
    canvas.height = logoEl.naturalHeight || 120;
    canvas.getContext('2d').drawImage(logoEl, 0, 0);
    _buildPDF(canvas.toDataURL('image/jpeg', 0.9));
  };
  logoEl.onerror = function() { _buildPDF(null); };
  logoEl.src = (window.location.origin || '') + '/img/logo.jpg';
}

function _buildPDF(logoDataURL) {
  var jsPDF = window.jspdf.jsPDF;
  var doc   = new jsPDF({ unit:'mm', format:'a4' });
  var W     = 210;
  var M     = 16;
  var GREEN = [26, 79, 46];
  var GREEN2= [38, 110, 64];
  var CREAM = [248, 246, 240];
  var DARK  = [22, 26, 23];
  var MUTED = [110, 122, 116];
  var BORDER= [220, 226, 222];
  var GOLD  = [180, 148, 80];

  var folio = 'COT-' + Date.now().toString().slice(-6);
  var fecha = new Date().toLocaleDateString('es-MX', {year:'numeric', month:'long', day:'numeric'});
  var y = 0;

  /* HEADER */
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(0, 0, W, 46, 'F');
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 44, W, 1.2, 'F');

  if (logoDataURL) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 7, 28, 28, 3, 3, 'F');
    doc.addImage(logoDataURL, 'JPEG', M + 1, 8, 26, 26);
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
    if (rowAlt) { doc.setFillColor(245,247,245); doc.rect(M, yy-5, W-M*2, 8,'F'); }
    rowAlt = !rowAlt;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text(label, M+4, yy);
    doc.setFont('helvetica','normal'); doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    var val = value || '—';
    if (val.length > 60) val = val.substring(0,57) + '...';
    doc.text(val, M+56, yy);
    doc.setDrawColor(BORDER[0],BORDER[1],BORDER[2]); doc.setLineWidth(0.1);
    doc.line(M, yy+2.5, W-M, yy+2.5);
    return yy + 8;
  };

  // Cliente
  y = section('Datos del cliente', y);
  y = row('Nombre:', state.cliente.nombre, y);
  y = row('Teléfono:', state.cliente.tel, y);
  y = row('Dirección:', state.cliente.dir, y);
  y = row('Levantamiento:', state.cliente.fecha + '  ' + state.cliente.hora, y);
  y = row('Sucursal:', state.cliente.sucursal, y);
  y = row('Atendido por:', state.cliente.asesor, y);
  if (state.cliente.obs) y = row('Observaciones:', state.cliente.obs, y);
  y += 6;

  // Materiales
  var frentesText = Object.keys(state.frentes).map(function(k) {
    var lbl = {economica:'Económica',arauco:'Arauco',decorlux:'Decorlux',transformad:'Transformad'}[k]||k;
    var c = state.frentes[k];
    return lbl + (c&&c.length?' ('+c.join(', ')+')'  :'');
  }).join(' | ')||'—';

  y = section('Materiales seleccionados', y);
  y = row('Situación:', {sin_cocina:'Sin cocina',barra_concreto:'Base de concreto',remodelacion:'Remodelación'}[state.situacion]||'—', y);
  y = row('Interior:', state.interior==='blanco-frosty'?'Blanco Frosty 15mm Arauco':'Gris Oxford 15mm Arauco', y);
  y = row('Frentes:', frentesText, y);
  y = row('Cubierta:', (state.cubierta||'—') + (state.cubPrecio?' — '+state.cubPrecio:''), y);
  y += 6;

  // Herrajes
  y = section('Herrajes', y);
  y = row('Bisagras:', state.bisagra||'—', y);
  y = row('Correderas:', state.corredera||'—', y);
  y = row('Cajones:', state.cajones.join(', ')||'—', y);
  y = row('Módulos especiales:', state.modulos.join(', ')||'—', y);
  y += 6;

  // Extras
  if (state.extras.length > 0) {
    y = section('Elementos adicionales', y);
    state.extras.forEach(function(e){ y = row(e+':', 'Incluido', y); });
    y += 6;
  }

  // Note box
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

  // Filename: MHG_Cocinas_<cliente>_<sucursal>_<id>
  var filename = 'MHG_Cocinas_' +
    (state.cliente.nombre||'Cliente').replace(/\s+/g,'_') + '_' +
    (state.cliente.sucursal||'MHG').replace(/\s+/g,'_') + '_' +
    folio + '.pdf';
  doc.save(filename);
}

/* ─── WHATSAPP ─── */
function sendWhatsApp() {
  var frentesText = Object.keys(state.frentes).map(function(k) {
    var lbl = {economica:'Económica',arauco:'Arauco',decorlux:'Decorlux',transformad:'Transformad'}[k]||k;
    var c = state.frentes[k];
    return '  • ' + lbl + (c&&c.length?' ('+c.join(', ')+')':'');
  }).join('\n')||'  • —';

  var msg = '*CONFIGURACIÓN COCINA — MHG*\n\n' +
    '*Cliente:* ' + state.cliente.nombre + '\n' +
    '*Tel:* ' + state.cliente.tel + '\n' +
    '*Dirección:* ' + state.cliente.dir + '\n' +
    '*Levantamiento:* ' + state.cliente.fecha + '  ' + state.cliente.hora + '\n' +
    '*Sucursal:* ' + state.cliente.sucursal + '\n' +
    '*Atendido por:* ' + state.cliente.asesor + '\n\n' +
    '*SITUACIÓN:* ' + ({sin_cocina:'Sin cocina',barra_concreto:'Base de concreto',remodelacion:'Remodelación'}[state.situacion]||'—') + '\n' +
    '*INTERIOR:* ' + (state.interior==='blanco-frosty'?'Blanco Frosty 15mm':'Gris Oxford 15mm') + '\n' +
    '*FRENTES:*\n' + frentesText + '\n' +
    '*CUBIERTA:* ' + (state.cubierta||'—') + '\n' +
    '*CORREDERAS:* ' + (state.corredera||'—') + '\n' +
    '*CAJONES:* ' + (state.cajones.join(', ')||'—') + '\n' +
    '*MÓDULOS:* ' + (state.modulos.join(', ')||'—') + '\n' +
    '*EXTRAS:* ' + (state.extras.join(', ')||'Ninguno') + '\n\n' +
    (state.cliente.obs ? '*Obs:* ' + state.cliente.obs + '\n\n' : '') +
    '_Configuración enviada desde mhgarquitectos.com_';

  window.open('https://wa.me/5212717041499?text=' + encodeURIComponent(msg), '_blank');
}
