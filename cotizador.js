/* ═══════════════════════════════════════════════════════════════
   MHG Arquitectos — Cotizador de Cocinas
   cotizador.js
   ═══════════════════════════════════════════════════════════════ */

/* ─── STATE ─── */
const state = {
  currentStep: 0,
  totalSteps: 9,
  has_kitchen: null,
  gama: null,
  interior_color: null,
  frente_type: null,
  frente_color: null,
  cubierta: null,
  herraje: null,
  led: false,
  led_tipo: null,
  isla: false,
  bancos: false,
  parrilla_isla: false,
  mueble_auxiliar: false,
  campana: false,
  campana_tipo: null,
  modules: {},   // { id: qty }
  client: { nombre:'', tel:'', dir:'', fecha:'', hora:'' }
};

/* ─── STEP LABELS ─── */
const STEP_LABELS = [
  '¿Tienes cocina?',
  'Gama',
  'Interior',
  'Frentes',
  'Módulos',
  'Cubierta',
  'Herrajes',
  'Extras',
  'Contacto',
  'Listo'
];

/* ─── COLOR CATALOGS ─── */
const COLOR_CATALOGS = {
  solido: [
    { hex:'#ffffff', label:'Blanco' },
    { hex:'#f5f5f0', label:'Hueso' },
    { hex:'#b0b0b0', label:'Gris plata' },
    { hex:'#6b6b6b', label:'Gris oscuro' },
    { hex:'#1a1a1a', label:'Negro' },
    { hex:'#2c4a35', label:'Verde bosque' },
    { hex:'#4a3728', label:'Marrón' },
    { hex:'#c9a84c', label:'Dorado mate' },
    { hex:'#3a5a8c', label:'Azul petróleo' },
    { hex:'#8b3a3a', label:'Terracota' },
  ],
  madera: [
    { hex:'#c8a97a', label:'Roble claro' },
    { hex:'#8b6340', label:'Nogal' },
    { hex:'#6b3e26', label:'Caoba' },
    { hex:'#d4b896', label:'Pino natural' },
    { hex:'#4a3728', label:'Wengué' },
    { hex:'#a0785a', label:'Teca' },
  ],
  araujo: [
    { hex:'#ffffff', label:'Blanco Arctic' },
    { hex:'#f0e8d8', label:'Crema' },
    { hex:'#c8b89a', label:'Arena' },
    { hex:'#8b8b8b', label:'Grafito' },
    { hex:'#c8a97a', label:'Roble Araujo' },
    { hex:'#6b3e26', label:'Nogal Araujo' },
  ],
  decolux: [
    { hex:'#f8f8f8', label:'Blanco brillo' },
    { hex:'#e0e0e0', label:'Gris perla brillo' },
    { hex:'#1a1a1a', label:'Negro brillo' },
    { hex:'#c9a84c', label:'Champagne' },
    { hex:'#ffffff', label:'Blanco mate' },
    { hex:'#d4b896', label:'Nude mate' },
    { hex:'#6b6b6b', label:'Gris mate' },
  ],
  transformad: [
    { hex:'#f5f5f5', label:'Blanco premium' },
    { hex:'#e8e0d0', label:'Cashmere' },
    { hex:'#c9a84c', label:'Oro mate' },
    { hex:'#8b8b7a', label:'Sage green' },
    { hex:'#3a3a3a', label:'Anthracite' },
    { hex:'#1a1a2e', label:'Navy Deep' },
    { hex:'#c8a97a', label:'Roble Fumed' },
    { hex:'#6b3e26', label:'Nogal Dark' },
  ]
};

/* ─── MODULE CATALOG ─── */
const MODULES = {
  bajos: [
    { id:'tarja', icon:'🚿', name:'Módulo de tarja', detail:'Incluye espacio para fregadero empotrado', gama:['basica','media','alta'], maxQty:2 },
    { id:'bote_basura', icon:'🗑️', name:'Bote de basura integrado', detail:'45 cm de ancho · Herraje extraíble', gama:['media','alta'], maxQty:2 },
    { id:'herraje_garrafon', icon:'💧', name:'Herraje garrafón', detail:'45 cm · Espacio para garrafón de agua', gama:['media','alta'], maxQty:2 },
    { id:'cajones_basicos', icon:'🗄️', name:'Cajones básicos', detail:'60 cm o más · Almacenamiento general', gama:['basica','media','alta'], maxQty:6 },
    { id:'cajones_dobles', icon:'📦', name:'Módulo doble cajón', detail:'2 cajones o más dentro del mismo módulo', gama:['media','alta'], maxQty:4 },
    { id:'modulo_extraible_sm', icon:'↔️', name:'Extraíble pequeño', detail:'15 cm o 30 cm · Para especias u objetos delgados', gama:['media','alta'], maxQty:3 },
    { id:'esquinero', icon:'🔄', name:'Esquinero extraíble', detail:'~1 m · Aprovecha el espacio de esquina', gama:['alta'], maxQty:2 },
    { id:'extraible_especias', icon:'🧂', name:'Extraíble especias + parrilla', detail:'Cajón junto a parrilla para condimentos', gama:['media','alta'], maxQty:2 },
    { id:'modulo_ref', icon:'🧊', name:'Módulo refrigerador', detail:'~95 cm ancho · Se adapta al electrodoméstico', gama:['basica','media','alta'], maxQty:1 },
  ],
  altos: [
    { id:'aereo_estandar', icon:'📋', name:'Aéreo estándar', detail:'Mueble alto con panel y entrepaño', gama:['basica','media','alta'], maxQty:8 },
    { id:'vitrina_cristal', icon:'🪟', name:'Vitrina con cristal', detail:'Puerta de cristal · Exhibe vajilla o decoración', gama:['media','alta'], maxQty:4 },
    { id:'aereo_cajones', icon:'🗄️', name:'Aéreo con cajones', detail:'Cajones integrados en mueble alto', gama:['alta'], maxQty:3 },
  ],
  especiales: [
    { id:'torre_hornos_60', icon:'🔲', name:'Torre de hornos 60 cm', detail:'60 cm ancho · Para horno eléctrico/vapor', gama:['media','alta'], maxQty:1 },
    { id:'torre_hornos_80', icon:'🔳', name:'Torre de hornos 80 cm', detail:'80 cm ancho · Para hornos más grandes', gama:['alta'], maxQty:1 },
    { id:'cajones_individuales', icon:'📁', name:'Cajones individuales', detail:'60 cm hacia abajo · Almacenamiento a medida', gama:['media','alta'], maxQty:4 },
  ]
};

/* ─── GAMA DEFAULTS ─── */
const GAMA_DEFAULTS = {
  basica: {
    interior_color: 'blanco',
    cubierta: 'laminado',
    herraje: 'economico',
    led: false, isla: false,
    modules: { tarja:1, cajones_basicos:3, aereo_estandar:3, modulo_ref:1 }
  },
  media: {
    interior_color: 'gris',
    cubierta: 'granito',
    herraje: 'cierre_suave',
    led: true, led_tipo: 'bajo_muebles',
    isla: false,
    modules: { tarja:1, bote_basura:1, cajones_basicos:3, cajones_dobles:1,
                modulo_extraible_sm:1, aereo_estandar:4, vitrina_cristal:1,
                modulo_ref:1, torre_hornos_60:1 }
  },
  alta: {
    interior_color: 'madera',
    cubierta: 'cuarzo',
    herraje: 'blum',
    led: true, led_tipo: 'cinta_perimetral',
    isla: true, bancos: true,
    campana: true,
    modules: { tarja:1, bote_basura:1, herraje_garrafon:1, cajones_basicos:2,
                cajones_dobles:2, modulo_extraible_sm:2, esquinero:1,
                extraible_especias:1, modulo_ref:1, aereo_estandar:4,
                vitrina_cristal:2, aereo_cajones:1, torre_hornos_60:1, cajones_individuales:2 }
  }
};

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildProgressBar();
  buildModules();
  setMinDate();
});

function setMinDate() {
  const input = document.getElementById('c-fecha');
  if (input) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    input.min = tomorrow.toISOString().split('T')[0];
  }
}

/* ─── PROGRESS BAR ─── */
function buildProgressBar() {
  const container = document.getElementById('progressSteps');
  const fill = document.getElementById('progressFill');
  container.innerHTML = '';
  container.appendChild(fill);

  STEP_LABELS.forEach((label, i) => {
    const step = document.createElement('div');
    step.className = 'progress-step' + (i === 0 ? ' active' : '');
    step.id = `pstep-${i}`;
    step.innerHTML = `<div class="step-dot">${i < 9 ? i+1 : '✓'}</div><span class="step-label">${label}</span>`;
    container.appendChild(step);
  });
}

function updateProgress() {
  const total = state.totalSteps - 1;
  const pct = (state.currentStep / total) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  STEP_LABELS.forEach((_, i) => {
    const el = document.getElementById(`pstep-${i}`);
    if (!el) return;
    el.className = 'progress-step';
    if (i < state.currentStep) el.classList.add('done');
    else if (i === state.currentStep) el.classList.add('active');
  });
}

/* ─── STEP NAVIGATION ─── */
function nextStep() {
  if (state.currentStep >= state.totalSteps - 1) return;
  hidePanel(state.currentStep);
  state.currentStep++;
  showPanel(state.currentStep);
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
  if (state.currentStep <= 0) return;
  hidePanel(state.currentStep);
  state.currentStep--;
  showPanel(state.currentStep);
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hidePanel(n) {
  document.getElementById(`step-${n}`)?.classList.remove('active');
}
function showPanel(n) {
  document.getElementById(`step-${n}`)?.classList.add('active');
}

/* ─── OPTION SELECTION (radio-style) ─── */
function selectOpt(card, key) {
  // Deselect siblings in same group
  const parent = card.parentElement;
  parent.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state[key] = card.dataset.val;

  // Enable next button
  const nextBtn = document.getElementById(`btn-next-${state.currentStep}`);
  if (nextBtn) nextBtn.removeAttribute('disabled');

  updateSummary();

  // Special cascades
  if (key === 'led_tipo') { /* no cascade needed */ }
  if (key === 'campana_tipo') { /* no cascade needed */ }
}

/* ─── FRENTE TYPE ─── */
function selectFrenteType(card, type) {
  const parent = card.parentElement;
  parent.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.frente_type = type;
  state.frente_color = null;

  // Show colors
  showColorSection(type);
}

function showColorSection(type) {
  const section = document.getElementById('color-section');
  const grid = document.getElementById('color-swatches');
  section.classList.remove('hidden');
  grid.innerHTML = '';

  const colors = COLOR_CATALOGS[type] || [];
  colors.forEach(c => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.innerHTML = `
      <div class="swatch-circle" style="background:${c.hex}" title="${c.label}"></div>
      <span class="swatch-label">${c.label}</span>
    `;
    swatch.addEventListener('click', () => {
      grid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      state.frente_color = c.label;
      const nextBtn = document.getElementById('btn-next-3');
      if (nextBtn) nextBtn.removeAttribute('disabled');
      updateSummary();
    });
    grid.appendChild(swatch);
  });
}

/* ─── GAMA SELECTION ─── */
function selectGama(card, gama) {
  document.querySelectorAll('.gama-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.gama = gama;

  // Apply defaults
  const defaults = GAMA_DEFAULTS[gama];
  if (defaults) {
    Object.keys(defaults).forEach(k => {
      if (k === 'modules') {
        state.modules = { ...defaults.modules };
      } else {
        state[k] = defaults[k];
      }
    });
  }

  // Pre-select interior color if on step 2
  const nextBtn = document.getElementById('btn-next-1');
  if (nextBtn) nextBtn.removeAttribute('disabled');

  updateSummary();
}

/* ─── MODULE BUILDER ─── */
function buildModules() {
  renderModuleList('modules-bajos', MODULES.bajos);
  renderModuleList('modules-altos', MODULES.altos);
  renderModuleList('modules-especiales', MODULES.especiales);
}

function renderModuleList(containerId, moduleList) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  moduleList.forEach(mod => {
    const qty = state.modules[mod.id] || 0;
    const inCart = qty > 0;

    const row = document.createElement('div');
    row.className = `module-row${inCart ? ' in-cart' : ''}`;
    row.id = `mrow-${mod.id}`;
    row.innerHTML = `
      <div class="module-icon">${mod.icon}</div>
      <div class="module-info">
        <div class="module-name">${mod.name}</div>
        <div class="module-detail">${mod.detail}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty('${mod.id}', -1, ${mod.maxQty})">−</button>
        <div class="qty-val" id="qty-${mod.id}">${qty}</div>
        <button class="qty-btn" onclick="changeQty('${mod.id}', 1, ${mod.maxQty})">+</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function changeQty(id, delta, max) {
  const current = state.modules[id] || 0;
  const next = Math.max(0, Math.min(max, current + delta));
  state.modules[id] = next;

  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = next;

  const row = document.getElementById(`mrow-${id}`);
  if (row) {
    row.classList.toggle('in-cart', next > 0);
  }

  updateSummary();
}

function refreshModulesFromState() {
  // Update qty displays after gama selection
  const allMods = [...MODULES.bajos, ...MODULES.altos, ...MODULES.especiales];
  allMods.forEach(mod => {
    const qty = state.modules[mod.id] || 0;
    const qtyEl = document.getElementById(`qty-${mod.id}`);
    if (qtyEl) qtyEl.textContent = qty;
    const row = document.getElementById(`mrow-${mod.id}`);
    if (row) row.classList.toggle('in-cart', qty > 0);
  });
}

/* ─── TOGGLE EXTRAS ─── */
function toggleExtra(row, key) {
  row.classList.toggle('active');
  state[key] = row.classList.contains('active');

  // Show/hide sub-options
  const subId = `${key}-subopts`;
  const sub = document.getElementById(subId);
  if (sub) sub.classList.toggle('hidden', !state[key]);

  updateSummary();
}

/* ─── VALIDATE & FINISH ─── */
function finishConfig() {
  const nombre = document.getElementById('c-nombre')?.value.trim();
  const tel    = document.getElementById('c-tel')?.value.trim();
  const dir    = document.getElementById('c-dir')?.value.trim();
  const fecha  = document.getElementById('c-fecha')?.value;
  const hora   = document.getElementById('c-hora')?.value;

  if (!nombre || !tel || !dir || !fecha || !hora) {
    alert('Por favor completa todos los campos para continuar.');
    return;
  }

  state.client = { nombre, tel, dir, fecha, hora };
  nextStep();
}

/* ─── LIVE SUMMARY ─── */
function updateSummary() {
  // Update modules list if on step 4
  if (state.currentStep === 4) refreshModulesFromState();

  const body = document.getElementById('summary-body');
  const gamaWrap = document.getElementById('summary-gama-wrap');
  const gamaVal  = document.getElementById('summary-gama-val');

  const items = [];

  if (state.has_kitchen !== null)
    items.push({ k:'Situación', v: state.has_kitchen === 'si' ? 'Renovación' : 'Cocina nueva' });

  if (state.gama) {
    gamaWrap.classList.remove('hidden');
    const gamaNames = { basica:'🥈 Básica', media:'🥇 Media', alta:'✨ Premium' };
    gamaVal.textContent = gamaNames[state.gama] || state.gama;
  }

  if (state.interior_color)
    items.push({ k:'Interior', v: capitalize(state.interior_color) });

  if (state.frente_type) {
    const ftype = state.frente_type.charAt(0).toUpperCase() + state.frente_type.slice(1);
    items.push({ k:'Frente', v: `${ftype}${state.frente_color ? ' · '+state.frente_color : ''}` });
  }

  if (state.cubierta)
    items.push({ k:'Cubierta', v: cubertaLabel(state.cubierta) });

  if (state.herraje)
    items.push({ k:'Herraje', v: herrajeLabel(state.herraje) });

  const extras = [];
  if (state.led) extras.push('LED');
  if (state.isla) extras.push('Isla');
  if (state.campana) extras.push('Campana');
  if (state.mueble_auxiliar) extras.push('Mueble aux.');
  if (extras.length > 0)
    items.push({ k:'Extras', v: extras.join(', ') });

  if (items.length === 0) {
    body.innerHTML = '<div class="summary-empty"><div style="font-size:1.5rem;margin-bottom:8px">👆</div>Tus selecciones aparecerán aquí</div>';
  } else {
    body.innerHTML = items.map(i =>
      `<div class="summary-item">
         <span class="summary-item-key">${i.k}</span>
         <span class="summary-item-val">${i.v}</span>
       </div>`
    ).join('');
  }

  // Modules
  const modWrap = document.getElementById('summary-modules-wrap');
  const modContainer = document.getElementById('summary-modules');
  const selectedMods = Object.entries(state.modules).filter(([,qty]) => qty > 0);

  if (selectedMods.length > 0) {
    modWrap.classList.remove('hidden');
    const allMods = [...MODULES.bajos, ...MODULES.altos, ...MODULES.especiales];
    modContainer.innerHTML = selectedMods.map(([id, qty]) => {
      const mod = allMods.find(m => m.id === id);
      return `<div class="summary-module-item">
        <span class="smi-icon">${mod?.icon || '📦'}</span>
        <span class="smi-name">${mod?.name || id}</span>
        <span class="smi-qty">×${qty}</span>
      </div>`;
    }).join('');
  } else {
    modWrap.classList.add('hidden');
  }
}

/* ─── PDF GENERATION ─── */
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 20; // margin
  let y = M;

  // ── Header background
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, PAGE_W, 45, 'F');

  // ── Green accent line
  doc.setFillColor(46, 204, 113);
  doc.rect(0, 44, PAGE_W, 1.5, 'F');

  // ── Company name (bold)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MHG ARQUITECTOS', M, 20);

  // ── Slogan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Diseñamos. Construimos. Equipamos.', M, 27);

  // ── Phone
  doc.setTextColor(46, 204, 113);
  doc.setFontSize(9);
  doc.text('Tel: 271 704 1499  ·  WhatsApp: +52 271 105 5612', M, 34);
  doc.setTextColor(150, 150, 150);
  doc.text('mhgarq1@gmail.com', M, 40);

  // ── Right side: document title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('COTIZACIÓN DE COCINA', PAGE_W - M, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const today = new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' });
  doc.text(`Fecha: ${today}`, PAGE_W - M, 27, { align: 'right' });
  doc.text('Folio: ' + Math.random().toString(36).slice(2,8).toUpperCase(), PAGE_W - M, 33, { align: 'right' });

  y = 56;

  // ── CLIENT SECTION
  doc.setFillColor(20, 20, 20);
  doc.roundedRect(M, y, PAGE_W - M*2, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(46, 204, 113);
  doc.text('DATOS DEL CLIENTE', M + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text(`Nombre: ${state.client.nombre}`, M + 6, y + 16);
  doc.text(`Teléfono: ${state.client.tel}`, M + 6, y + 22);
  const col2x = PAGE_W / 2 + 5;
  doc.text(`Dirección: ${state.client.dir}`, col2x, y + 16);
  doc.text(`Levantamiento: ${formatDate(state.client.fecha)} · ${state.client.hora}`, col2x, y + 22);

  y += 36;

  // ── CONFIGURATION SECTION
  sectionTitle(doc, 'CONFIGURACIÓN SELECCIONADA', y, M, PAGE_W);
  y += 10;

  const gamaNames = { basica:'Básica', media:'Media', alta:'Premium' };
  const configRows = [
    ['Gama', gamaNames[state.gama] || '—'],
    ['Situación actual', state.has_kitchen === 'si' ? 'Tiene cocina (renovación)' : 'Cocina nueva desde cero'],
    ['Color interior', capitalize(state.interior_color || '—')],
    ['Tipo de frente', `${capitalize(state.frente_type || '—')}${state.frente_color ? ' · '+state.frente_color : ''}`],
    ['Cubierta', cubertaLabel(state.cubierta || '—')],
    ['Sistema de herrajes', herrajeLabel(state.herraje || '—')],
  ];

  configRows.forEach((row, i) => {
    const rowY = y + i * 9;
    if (i % 2 === 0) {
      doc.setFillColor(22, 22, 22);
      doc.rect(M, rowY - 4, PAGE_W - M*2, 9, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(row[0], M + 4, rowY + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 220);
    doc.text(row[1], M + 60, rowY + 1);
  });

  y += configRows.length * 9 + 8;

  // ── EXTRAS
  const extrasActive = [
    state.led && `Iluminación LED${state.led_tipo ? ' ('+ledLabel(state.led_tipo)+')' : ''}`,
    state.isla && `Isla / Barra${state.bancos?' · Con bancos':''}${state.parrilla_isla?' · Con parrilla':''}`,
    state.campana && `Campana extractora${state.campana_tipo?' ('+capitalize(state.campana_tipo)+')':''}`,
    state.mueble_auxiliar && 'Mueble auxiliar',
  ].filter(Boolean);

  if (extrasActive.length > 0) {
    sectionTitle(doc, 'EXTRAS Y OPCIONES ADICIONALES', y, M, PAGE_W);
    y += 10;
    extrasActive.forEach((extra, i) => {
      const rowY = y + i * 8;
      if (i % 2 === 0) {
        doc.setFillColor(22, 22, 22);
        doc.rect(M, rowY - 4, PAGE_W - M*2, 8, 'F');
      }
      doc.setFillColor(46, 204, 113);
      doc.circle(M + 8, rowY + 0.5, 1.2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 220, 220);
      doc.text(extra, M + 14, rowY + 1);
    });
    y += extrasActive.length * 8 + 8;
  }

  // ── MODULES
  const selectedMods = Object.entries(state.modules).filter(([,qty]) => qty > 0);
  if (selectedMods.length > 0) {
    sectionTitle(doc, 'MÓDULOS DE COCINA', y, M, PAGE_W);
    y += 10;

    const allMods = [...MODULES.bajos, ...MODULES.altos, ...MODULES.especiales];

    // Table header
    doc.setFillColor(46, 204, 113);
    doc.rect(M, y - 4, PAGE_W - M*2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('MÓDULO', M + 4, y + 0.5);
    doc.text('DESCRIPCIÓN', M + 75, y + 0.5);
    doc.text('CANT.', PAGE_W - M - 12, y + 0.5, { align: 'right' });
    y += 8;

    selectedMods.forEach(([id, qty], i) => {
      const mod = allMods.find(m => m.id === id);
      const rowY = y + i * 9;
      if (rowY > PAGE_H - 40) {
        doc.addPage();
        y = M;
      }
      if (i % 2 === 0) {
        doc.setFillColor(18, 18, 18);
        doc.rect(M, rowY - 4, PAGE_W - M*2, 9, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(220, 220, 220);
      doc.text(mod?.name || id, M + 4, rowY + 1, { maxWidth: 65 });
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(7.5);
      doc.text(mod?.detail || '', M + 75, rowY + 1, { maxWidth: 80 });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(46, 204, 113);
      doc.text(String(qty), PAGE_W - M - 4, rowY + 1, { align: 'right' });
    });
    y += selectedMods.length * 9 + 10;
  }

  // ── DISCLAIMER
  if (y > PAGE_H - 60) { doc.addPage(); y = M; }

  doc.setFillColor(15, 15, 15);
  doc.roundedRect(M, y, PAGE_W - M*2, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(46, 204, 113);
  doc.text('NOTA IMPORTANTE', M + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7.5);
  const disclaimer = 'Esta cotización es un estimado orientativo generado en base a la configuración del cliente. El precio definitivo se determinará durante el levantamiento en sitio, donde se verificarán medidas exactas, condiciones del espacio y requerimientos finales.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, PAGE_W - M*2 - 12);
  doc.text(disclaimerLines, M + 6, y + 15);
  y += 36;

  // ── MAPS
  sectionTitle(doc, 'NUESTRAS SUCURSALES', y, M, PAGE_W);
  y += 10;

  const colW = (PAGE_W - M*2 - 8) / 2;
  // Fortín
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(M, y, colW, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(46, 204, 113);
  doc.text('📍 Fortín de las Flores (Matriz)', M+5, y+8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(180,180,180);
  doc.text('Av 2 Ote. 505, Centro, Fortín, Ver.', M+5, y+15);
  doc.text('Tel: 271 704 1499', M+5, y+21);
  doc.setTextColor(46,204,113);
  doc.textWithLink('Ver en Google Maps →', M+5, y+27, { url:'https://maps.app.goo.gl/yDzXWv3kr93pRYJS7' });

  // Tuxtepec
  const col2X = M + colW + 8;
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(col2X, y, colW, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(46,204,113);
  doc.text('📍 Tuxtepec, Oaxaca (Sucursal)', col2X+5, y+8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(180,180,180);
  doc.text('Tuxtepec, Oaxaca — Zona frontera Veracruz', col2X+5, y+15);
  doc.text('WhatsApp: +52 271 105 5612', col2X+5, y+21);
  doc.setTextColor(46,204,113);
  doc.textWithLink('Ver en Google Maps →', col2X+5, y+27, { url:'https://maps.app.goo.gl/WbCFJu8TXqUyKoir7' });

  y += 36;

  // ── FOOTER
  doc.setFillColor(10, 10, 10);
  doc.rect(0, PAGE_H - 18, PAGE_W, 18, 'F');
  doc.setFillColor(46, 204, 113);
  doc.rect(0, PAGE_H - 18, PAGE_W, 1, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100,100,100);
  doc.text('© 2026 MHG Arquitectos · Todos los derechos reservados · mhgarq1@gmail.com', PAGE_W/2, PAGE_H - 8, { align:'center' });

  doc.save(`Cotizacion_Cocina_MHG_${state.client.nombre.replace(/\s+/g,'_')}.pdf`);
}

function sectionTitle(doc, text, y, M, PAGE_W) {
  doc.setFillColor(46, 204, 113);
  doc.rect(M, y - 1, 3, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(46, 204, 113);
  doc.text(text, M + 7, y + 5);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(M + 7 + doc.getTextWidth(text) + 4, y + 3, PAGE_W - M, y + 3);
}

/* ─── WHATSAPP SEND ─── */
function sendWhatsApp() {
  const gamaNames = { basica:'Básica', media:'Media', alta:'Premium' };
  const selectedMods = Object.entries(state.modules).filter(([,qty]) => qty > 0);
  const allMods = [...MODULES.bajos, ...MODULES.altos, ...MODULES.especiales];

  const modList = selectedMods.map(([id, qty]) => {
    const mod = allMods.find(m => m.id === id);
    return `• ${mod?.name || id}: ${qty}`;
  }).join('\n');

  const extras = [
    state.led && `LED: Sí (${ledLabel(state.led_tipo || '')})`,
    state.isla && `Isla: Sí${state.bancos?' + Bancos':''}${state.parrilla_isla?' + Parrilla':''}`,
    state.campana && `Campana: Sí (${capitalize(state.campana_tipo || '')})`,
    state.mueble_auxiliar && 'Mueble auxiliar: Sí',
  ].filter(Boolean).join('\n');

  const msg = `🍳 *COTIZACIÓN TÉCNICA — COCINA MHG*\n\n` +
    `👤 *Cliente:* ${state.client.nombre}\n` +
    `📱 *Tel:* ${state.client.tel}\n` +
    `📍 *Dirección:* ${state.client.dir}\n` +
    `📅 *Fecha levantamiento:* ${formatDate(state.client.fecha)} a las ${state.client.hora}\n\n` +
    `🏷️ *Gama:* ${gamaNames[state.gama] || state.gama}\n` +
    `🏗️ *Situación:* ${state.has_kitchen === 'si' ? 'Renovación' : 'Cocina nueva'}\n\n` +
    `🎨 *Configuración:*\n` +
    `• Interior: ${capitalize(state.interior_color || '—')}\n` +
    `• Frente: ${capitalize(state.frente_type || '—')}${state.frente_color?' — '+state.frente_color:''}\n` +
    `• Cubierta: ${cubertaLabel(state.cubierta || '—')}\n` +
    `• Herraje: ${herrajeLabel(state.herraje || '—')}\n\n` +
    (modList ? `📦 *Módulos:*\n${modList}\n\n` : '') +
    (extras ? `✨ *Extras:*\n${extras}\n\n` : '') +
    `_Cotización generada en el configurador web MHG Arquitectos_`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/5212717041499?text=${encoded}`, '_blank');
}

/* ─── HELPERS ─── */
function capitalize(str) {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g,' ');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${months[parseInt(m)-1]} ${y}`;
}

function cubertaLabel(val) {
  const map = {
    laminado: 'Laminado Alta Presión',
    corian: 'Superficie Sólida Corian®',
    granito: 'Granito Natural',
    cuarzo: 'Cuarzo Engineered',
    sinterizado: 'Cuarzo Sinterizado'
  };
  return map[val] || capitalize(val);
}

function herrajeLabel(val) {
  const map = {
    economico: 'Económico (Push-to-open)',
    cierre_suave: 'Cierre suave',
    blum: 'Blum Premium',
    oculto: 'Sin jaladores (oculto)'
  };
  return map[val] || capitalize(val);
}

function ledLabel(val) {
  const map = {
    bajo_muebles: 'Bajo muebles altos',
    cinta_perimetral: 'Cinta perimetral',
    spot: 'Spot empotrado'
  };
  return map[val] || capitalize(val);
}
