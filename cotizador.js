/* ═══════════════════════════════════════════════════════════════
   MHG Arquitectos — Configurador de Cocina
   cotizador.js  —  Logic engine v3 (redesigned)
═══════════════════════════════════════════════════════════════ */

/* ─── STATE ─── */
const state = {
  current_step: 0,
  has_kitchen:      null,
  gama:             null,
  interior_color:   null,
  frente_tipo:      null,
  frente_color:     null,
  modules:          {},   // { id: qty }
  cubierta:         null,
  herraje:          null,
  extras: {
    led:            false,
    led_tipo:       null,
    isla:           false,
    bancos:         false,
    parrilla_isla:  false,
    campana:        false,
    campana_tipo:   null,
    mueble_auxiliar:false,
  },
  cliente: {
    nombre: '', tel: '', direccion: '', fecha: '', hora: '',
  }
};

/* ─── STEP METADATA ─── */
const STEPS = [
  { key:'has_kitchen',    label:'Situación actual',    short: () => state.has_kitchen === 'no' ? 'Nueva cocina' : state.has_kitchen === 'si' ? 'Renovación' : '' },
  { key:'gama',           label:'Nivel de gama',       short: () => state.gama ? GAMA_LABELS[state.gama] : '' },
  { key:'interior_color', label:'Color interior',      short: () => state.interior_color ? INT_LABELS[state.interior_color] : '' },
  { key:'frente_tipo',    label:'Frentes',             short: () => state.frente_tipo ? FRENTE_LABELS[state.frente_tipo] : '' },
  { key:'modules',        label:'Módulos',             short: () => { const n = Object.values(state.modules).reduce((a,b)=>a+b,0); return n ? `${n} módulo${n!==1?'s':''}` : ''; } },
  { key:'cubierta',       label:'Cubierta',            short: () => state.cubierta ? CUB_LABELS[state.cubierta] : '' },
  { key:'herraje',        label:'Herrajes',            short: () => state.herraje ? HER_LABELS[state.herraje] : '' },
  { key:'extras',         label:'Extras',              short: () => { const n = ['led','isla','campana','mueble_auxiliar'].filter(k=>state.extras[k]).length; return n ? `${n} extra${n!==1?'s':''}` : 'Ninguno'; } },
  { key:'cliente',        label:'Tus datos',           short: () => state.cliente.nombre || '' },
  { key:'done',           label:'Listo',               short: () => '' },
];

const GAMA_LABELS  = { basica:'Básica', media:'Media', alta:'Premium' };
const INT_LABELS   = { blanco:'Blanco básico', gris:'Sólido gris', madera:'Madera' };
const FRENTE_LABELS= { solido:'Sólido liso', madera:'Veta madera', araujo:'Araujo', decolux:'Decolux', transformad:'Transformad' };
const CUB_LABELS   = { laminado:'Laminado HP', corian:'Corian', granito:'Granito', cuarzo:'Cuarzo', sinterizado:'Sinterizado' };
const HER_LABELS   = { economico:'Económico', cierre_suave:'Cierre suave', blum:'Blum Premium', oculto:'Sin jaladores' };

/* ─── STEP HEADERS ─── */
const STEP_HEADERS = [
  { eyebrow:'Paso 1 de 9', title:'¿Cuál es tu <em>situación actual?</em>', sub:'Cuéntanos si ya tienes una cocina o si partiremos desde cero.' },
  { eyebrow:'Paso 2 de 9', title:'Elige tu <em>nivel de gama</em>',       sub:'La gama define los materiales base, herraje y cubierta incluidos. Todo es ajustable.' },
  { eyebrow:'Paso 3 de 9', title:'Color del <em>interior</em>',           sub:'El interior de todos los muebles llevará este acabado.' },
  { eyebrow:'Paso 4 de 9', title:'Tipo y marca de <em>frentes</em>',      sub:'Los frentes son las puertas visibles de tu cocina. Elige el material y la marca.' },
  { eyebrow:'Paso 5 de 9', title:'Selecciona tus <em>módulos</em>',       sub:'Indica cuántos módulos de cada tipo necesitas. Los detalles finos se definen en el levantamiento.' },
  { eyebrow:'Paso 6 de 9', title:'Material de <em>cubierta</em>',         sub:'La cubierta cubre las superficies de trabajo de tu cocina.' },
  { eyebrow:'Paso 7 de 9', title:'Sistema de <em>herrajes</em>',          sub:'Los herrajes definen cómo abren y cierran tus puertas y cajones.' },
  { eyebrow:'Paso 8 de 9', title:'Elementos <em>adicionales</em>',        sub:'Opcionales. Activa lo que quieras incluir en tu cocina.' },
  { eyebrow:'Paso 9 de 9', title:'Tus <em>datos de contacto</em>',        sub:'Para confirmar tu cita de levantamiento en sitio.' },
  { eyebrow:'Completado',  title:'Configuración <em>lista</em>',          sub:'' },
];

/* ─── MODULE CATALOG ─── */
const MODULE_CATALOG = {
  bajos: [
    { id:'tarja',        name:'Módulo de tarja',          size:'45 cm',   desc:'Para lavaplatos sencillo o doble. Incluye acceso para desagüe y alimentación.',
      img:'https://images.unsplash.com/photo-1587093430416-0dc23a0c62c1?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'basura',       name:'Módulo bote de basura',    size:'45 cm',   desc:'Cubo de basura extraíble integrado, oculto dentro del mueble.',
      img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'garrafon',     name:'Herraje garrafón',         size:'45 cm',   desc:'Módulo especial con guía extraíble para facilitar el cambio del garrafón.',
      img:null },
    { id:'cajones_60',   name:'Cajones (ancho estándar)', size:'60 cm+',  desc:'Mueble de cajones corridos. Ideal para utensilios, ropa de cocina y almacenamiento.',
      img:'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'cajones_cat2', name:'Cajones dobles (en mueble)',size:'60+ cm', desc:'Dos o más cajones integrados en un mismo módulo de mayor profundidad.',
      img:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'extraible_15', name:'Extraíble angosto',        size:'15 cm',   desc:'Módulo extraíble para especias, aceites y condimentos. Óptimo en espacios reducidos.',
      img:null },
    { id:'extraible_30', name:'Extraíble mediano',        size:'30 cm',   desc:'Extraíble para almacenaje vertical de tablas, bandejas o alimentos en bolsa.',
      img:null },
    { id:'esquinero',    name:'Esquinero extraíble',      size:'~100 cm', desc:'Solución funcional para la esquina de la cocina. Maximiza el espacio disponible.',
      img:null },
    { id:'cajones_ind',  name:'Cajones individuales',     size:'≤60 cm',  desc:'Cajón individual de menor dimensión para zonas específicas o complemento de módulos.',
      img:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&h=460&q=80' },
  ],
  altos: [
    { id:'torre_horno',  name:'Torre de hornos',          size:'60–80 cm ancho', desc:'Mueble vertical para empotrar horno o microondas. La altura depende del electrodoméstico.',
      img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'mod_refri',    name:'Módulo refrigerador',      size:'~95 cm',  desc:'Marco de muebles a cada lado del refrigerador para integración visual completa.',
      img:'https://images.unsplash.com/photo-1484154133-d2d5ffe43ea1?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'vitrina_cristal',name:'Vitrina con cristal',    size:'Variable',desc:'Puerta de vidrio templado para mostrar vajilla o vajilla decorativa.',
      img:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&h=460&q=80' },
    { id:'alacena',      name:'Módulo aéreo estándar',    size:'Variable',desc:'Mueble superior de almacenamiento general. Puede llevar puerta sencilla o doble.',
      img:'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&h=460&q=80' },
  ],
  especiales: [
    { id:'panel_entrepanel',name:'Módulo panel / entrepanel', size:'Variable', desc:'Panel decorativo lateral o divisorio con entrepanel para dar terminado y uniformidad.',
      img:null },
    { id:'extraible_especias',name:'Extraíble especias + parrilla', size:'15–30 cm', desc:'Solución junto a parrilla o estufa para especias, aceites y herramientas de cocina.',
      img:null },
    { id:'mod_cajones_isla',name:'Isla — módulos cajones',  size:'Variable', desc:'Cajones integrados en la isla para almacenamiento a doble acceso.',
      img:'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?auto=format&fit=crop&w=800&h=460&q=80' },
  ]
};

/* ─── COLOR PALETTES ─── */
const COLOR_PALETTES = {
  solido: [
    { hex:'#FFFFFF', name:'Blanco' },
    { hex:'#F5F5F0', name:'Hueso' },
    { hex:'#E0E0DC', name:'Gris perla' },
    { hex:'#A8A8A0', name:'Gris medio' },
    { hex:'#5A5A58', name:'Grafito' },
    { hex:'#2A2A28', name:'Negro mate' },
  ],
  madera: [
    { hex:'#C8A96A', name:'Roble claro' },
    { hex:'#A0784A', name:'Roble medio' },
    { hex:'#7A5C3A', name:'Nogal' },
    { hex:'#5A3E28', name:'Wengué' },
    { hex:'#3E2A1A', name:'Ébano' },
  ],
  araujo: [
    { hex:'#FFFFFF', name:'Blanco Oslo' },
    { hex:'#F2F0EC', name:'Crema suave' },
    { hex:'#D0D0CC', name:'Gris plata' },
    { hex:'#888880', name:'Gris oscuro' },
    { hex:'#C8A870', name:'Roble arena' },
    { hex:'#8A6840', name:'Roble oscuro' },
  ],
  decolux: [
    { hex:'#FAFAFA', name:'Blanco glaciar' },
    { hex:'#F0EDE8', name:'Lino' },
    { hex:'#D8D4CC', name:'Gris nube' },
    { hex:'#B0ACA4', name:'Gris piedra' },
    { hex:'#585450', name:'Carbón' },
    { hex:'#C0A868', name:'Arena dorada' },
  ],
  transformad: [
    { hex:'#FFFFFF', name:'Blanco polar' },
    { hex:'#E8E4DE', name:'Paja' },
    { hex:'#D0CCC4', name:'Canto rodado' },
    { hex:'#B8B4AC', name:'Gris ceniza' },
    { hex:'#787470', name:'Gris urbano' },
    { hex:'#383430', name:'Negro profundo' },
    { hex:'#C0A060', name:'Dorado suave' },
    { hex:'#A08060', name:'Cobre' },
  ]
};

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  buildModules();
  buildColorSections();
  renderStep(0);
  // Set min date for levantamiento
  const dateInput = document.getElementById('c-fecha');
  if (dateInput) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    dateInput.min = d.toISOString().split('T')[0];
  }
});

/* ─── SIDEBAR ─── */
function buildSidebar() {
  const nav = document.getElementById('sidebarSteps');
  if (!nav) return;
  nav.innerHTML = STEPS.slice(0, 9).map((s, i) => `
    <div class="sidebar-step" id="sidebar-step-${i}">
      <div class="step-bullet">${i + 1}</div>
      <div class="step-text">
        <span class="step-text-label">${s.label}</span>
        <span class="step-text-val" id="sidebar-val-${i}"></span>
      </div>
    </div>
  `).join('');
}

function updateSidebar(step) {
  STEPS.slice(0, 9).forEach((s, i) => {
    const el = document.getElementById(`sidebar-step-${i}`);
    const valEl = document.getElementById(`sidebar-val-${i}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i === step) el.classList.add('active');
    else if (i < step) el.classList.add('done');
    if (valEl) valEl.textContent = s.short();
  });
}

/* ─── MODULES ─── */
function buildModules() {
  Object.entries(MODULE_CATALOG).forEach(([cat, mods]) => {
    const container = document.getElementById(`modules-${cat}`);
    if (!container) return;
    container.innerHTML = mods.map(m => {
      const photoHTML = m.img
        ? `<img src="${m.img}" alt="${m.name}" onerror="this.parentElement.innerHTML=placeholderHTML('${m.name}')" />`
        : `<div class="photo-placeholder">
            <div class="photo-placeholder-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
            </div>
            <div class="photo-placeholder-text">Imagen de referencia</div>
          </div>`;

      return `
      <div class="option-card" id="mod-${m.id}" data-mod-id="${m.id}">
        <div class="option-photo">
          ${photoHTML}
          ${m.img ? `<button class="zoom-btn" onclick="openLightbox(event, this.closest('.option-card').querySelector('img'), '${m.name}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            Ampliar
          </button>` : ''}
        </div>
        <div class="option-info">
          <span class="option-tag">${m.size}</span>
          <h3 class="option-name">${m.name}</h3>
          <p class="option-desc">${m.desc}</p>
          <div class="qty-row">
            <span class="qty-label">
              <span class="qty-active-indicator" id="ind-${m.id}"></span>
            </span>
            <div class="qty-control">
              <button class="qty-btn" onclick="changeQty('${m.id}', -1)">−</button>
              <span class="qty-val" id="qty-${m.id}">0</span>
              <button class="qty-btn" onclick="changeQty('${m.id}', +1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  });
}

function changeQty(id, delta) {
  const current = state.modules[id] || 0;
  const next = Math.max(0, current + delta);
  state.modules[id] = next;
  const qtyEl = document.getElementById(`qty-${id}`);
  const cardEl = document.getElementById(`mod-${id}`);
  const indEl  = document.getElementById(`ind-${id}`);
  if (qtyEl) qtyEl.textContent = next;
  if (cardEl) cardEl.classList.toggle('in-cart', next > 0);
  if (indEl) indEl.style.background = next > 0 ? 'var(--green)' : 'var(--border-dark)';
  updateSidebar(state.current_step);
}

/* ─── COLOR SECTIONS ─── */
function buildColorSections() {
  Object.entries(COLOR_PALETTES).forEach(([brand, colors]) => {
    const container = document.getElementById(`colors-${brand}`);
    if (!container) return;
    container.innerHTML = `
      <div class="color-section-label">Selecciona el color</div>
      <div class="color-row">
        ${colors.map(c => `
          <div class="color-swatch" onclick="selectColor(this,'${brand}','${c.name}')">
            <div class="swatch-dot" style="background:${c.hex};${c.hex==='#FFFFFF'?'border-color:#ccc;':''}"></div>
            <span class="swatch-name">${c.name}</span>
          </div>
        `).join('')}
      </div>
    `;
  });
}

function selectColor(el, brand, name) {
  const section = el.closest('.color-section');
  section.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.frente_color = `${FRENTE_LABELS[brand] || brand} — ${name}`;
  updateSidebar(state.current_step);
}

/* ─── CARD SELECTION HELPERS ─── */
function selectCardOpt(card, stateKey, value) {
  const container = card.closest('.options-list');
  if (container) container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state[stateKey] = value;
  updateSidebar(state.current_step);
}

function selectGamaCard(card, gamaKey) {
  const container = card.closest('.options-list');
  if (container) container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.gama = gamaKey;

  // Apply gama presets
  const PRESETS = {
    basica:  { interior_color:'blanco', frente_tipo:'solido', cubierta:'laminado', herraje:'economico' },
    media:   { interior_color:'gris',   frente_tipo:'araujo', cubierta:'granito',  herraje:'cierre_suave' },
    alta:    { interior_color:'madera', frente_tipo:'transformad', cubierta:'cuarzo', herraje:'blum' },
  };
  if (PRESETS[gamaKey]) Object.assign(state, PRESETS[gamaKey]);
  updateSidebar(state.current_step);
}

function selectFrenteCard(card, tipo) {
  const container = card.closest('.options-list');
  if (container) container.querySelectorAll('.option-card').forEach(c => {
    c.classList.remove('selected');
    // Hide all color sections
    const cs = c.querySelector('.color-section');
    if (cs) cs.style.display = 'none';
  });
  card.classList.add('selected');
  state.frente_tipo = tipo;
  state.frente_color = null;

  // Show color section for this card
  const colorSec = card.querySelector('.color-section');
  if (colorSec) colorSec.style.display = 'block';

  updateSidebar(state.current_step);
}

/* ─── EXTRAS ─── */
function toggleExtraCard(card, key) {
  const isActive = card.classList.toggle('active');
  state.extras[key] = isActive;

  const subEl = document.getElementById(`sub-${key}`);
  if (subEl) subEl.classList.toggle('visible', isActive);

  updateSidebar(state.current_step);
}

function selectSubOpt(btn, key, value) {
  btn.closest('.sub-opts-row').querySelectorAll('.sub-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.extras[key] = value;
}

/* ─── PLACEHOLDER HELPER ─── */
function placeholderHTML(text) {
  return `
    <div class="photo-placeholder">
      <div class="photo-placeholder-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
      <div class="photo-placeholder-text">${text}</div>
    </div>
  `;
}

/* ─── LIGHTBOX ─── */
function openLightbox(event, imgEl, caption) {
  event.stopPropagation();
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCaption');
  if (!lb || !imgEl) return;
  lbImg.src = imgEl.src;
  lbImg.alt = caption || '';
  if (lbCap) lbCap.textContent = caption || '';
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}

function closeLightboxOnBg(event) {
  if (event.target === document.getElementById('lightbox')) closeLightbox();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ═══════════════════════════════════════════════════════
   STEP NAVIGATION
═══════════════════════════════════════════════════════ */
function renderStep(step) {
  state.current_step = step;

  // Show/hide panels
  document.querySelectorAll('.step-panel').forEach((p, i) => {
    p.classList.toggle('active', i === step);
  });

  // Update header
  const h = STEP_HEADERS[step];
  if (h) {
    const eyeEl = document.getElementById('contentEyebrow');
    const titleEl = document.getElementById('contentTitle');
    const subEl = document.getElementById('contentSubtitle');
    if (eyeEl) eyeEl.textContent = h.eyebrow;
    if (titleEl) titleEl.innerHTML = h.title;
    if (subEl) subEl.textContent = h.sub;
  }

  // Progress bar
  const fill = document.getElementById('topProgressFill');
  if (fill) fill.style.width = `${((step) / 9) * 100}%`;

  // Counter
  const cc = document.getElementById('counterCurrent');
  if (cc) cc.textContent = Math.min(step + 1, 9);

  // Prev/Next buttons
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  if (btnPrev) btnPrev.disabled = step === 0;
  if (btnNext) {
    if (step === 8) {
      btnNext.textContent = 'Finalizar';
      btnNext.innerHTML = 'Finalizar <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    } else if (step >= 9) {
      btnNext.style.display = 'none';
    } else {
      btnNext.innerHTML = 'Siguiente <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      btnNext.style.display = '';
    }
  }

  // Footer visibility
  const footer = document.getElementById('contentFooter');
  if (footer) footer.style.display = step === 9 ? 'none' : '';

  // Sidebar
  updateSidebar(step);

  // Scroll to top of content
  const body = document.querySelector('.content-body');
  if (body) body.scrollTop = 0;
}

function nextStep() {
  const step = state.current_step;

  // Validation per step
  const validators = {
    0: () => state.has_kitchen !== null || (alert('Por favor selecciona tu situación actual.'), false),
    1: () => state.gama !== null || (alert('Por favor selecciona una gama.'), false),
    2: () => state.interior_color !== null || (alert('Por favor selecciona el color de interior.'), false),
    3: () => state.frente_tipo !== null || (alert('Por favor selecciona el tipo de frente.'), false),
    4: () => true, // Modules optional
    5: () => state.cubierta !== null || (alert('Por favor selecciona el tipo de cubierta.'), false),
    6: () => state.herraje !== null || (alert('Por favor selecciona el sistema de herraje.'), false),
    7: () => true, // Extras optional
    8: () => {
      const n = document.getElementById('c-nombre')?.value.trim();
      const t = document.getElementById('c-tel')?.value.trim();
      const d = document.getElementById('c-dir')?.value.trim();
      const f = document.getElementById('c-fecha')?.value;
      const h = document.getElementById('c-hora')?.value;
      if (!n || !t || !d || !f || !h) {
        alert('Por favor completa todos los campos de contacto.');
        return false;
      }
      state.cliente = { nombre: n, tel: t, direccion: d, fecha: f, hora: h };
      return true;
    }
  };

  const ok = validators[step] ? validators[step]() : true;
  if (!ok) return;

  if (step < 9) renderStep(step + 1);
}

function prevStep() {
  if (state.current_step > 0) renderStep(state.current_step - 1);
}

/* ═══════════════════════════════════════════════════════
   PDF GENERATION
═══════════════════════════════════════════════════════ */
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, MARGIN = 18;
  const green = [26, 79, 46];
  const dark  = [15, 18, 16];
  const light = [240, 242, 241];
  const muted = [122, 132, 128];
  let y = 0;

  // Header bar
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 38, 'F');

  // Logo placeholder area
  doc.setFillColor(255,255,255, 0.15);
  doc.roundedRect(MARGIN, 8, 22, 22, 2, 2, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(8); doc.setTextColor(255,255,255);
  doc.text('MHG', MARGIN + 11, 21, {align:'center'});

  // Title in header
  doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.setTextColor(255,255,255);
  doc.text('MHG ARQUITECTOS', MARGIN + 28, 17);
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.setTextColor(200, 230, 210);
  doc.text('Configurador de Cocina Integral', MARGIN + 28, 23);

  // Folio & date
  const folio = `COT-${Date.now().toString().slice(-6)}`;
  const fecha = new Date().toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'});
  doc.setFont('helvetica','normal'); doc.setFontSize(7);
  doc.setTextColor(200,230,210);
  doc.text(`Folio: ${folio}`, W - MARGIN, 16, {align:'right'});
  doc.text(fecha, W - MARGIN, 22, {align:'right'});

  y = 50;

  // Helper: section title
  const sectionTitle = (txt, yy) => {
    doc.setFillColor(...light);
    doc.rect(MARGIN, yy, W - MARGIN*2, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.setTextColor(...green);
    doc.text(txt.toUpperCase(), MARGIN + 4, yy + 5.5);
    return yy + 13;
  };

  // Helper: row
  const row = (label, value, yy) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    doc.setTextColor(...muted); doc.text(label, MARGIN + 4, yy);
    doc.setFont('helvetica','normal'); doc.setTextColor(...dark);
    doc.text(value || '—', MARGIN + 52, yy);
    return yy + 7;
  };

  // ── Cliente
  y = sectionTitle('Datos del cliente', y);
  y = row('Nombre:', state.cliente.nombre, y);
  y = row('Teléfono:', state.cliente.tel, y);
  y = row('Dirección:', state.cliente.direccion, y);
  y = row('Fecha levantamiento:', `${state.cliente.fecha}  ${state.cliente.hora}`, y);
  y += 6;

  // ── Configuración
  y = sectionTitle('Configuración seleccionada', y);
  y = row('Situación:', state.has_kitchen === 'no' ? 'Nueva cocina' : 'Renovación de cocina existente', y);
  y = row('Gama:', GAMA_LABELS[state.gama] || state.gama, y);
  y = row('Interior:', INT_LABELS[state.interior_color] || state.interior_color, y);
  y = row('Frentes:', `${FRENTE_LABELS[state.frente_tipo] || state.frente_tipo}${state.frente_color ? ' — ' + state.frente_color : ''}`, y);
  y = row('Cubierta:', CUB_LABELS[state.cubierta] || state.cubierta, y);
  y = row('Herraje:', HER_LABELS[state.herraje] || state.herraje, y);
  y += 6;

  // ── Módulos
  const modEntries = Object.entries(state.modules).filter(([,q]) => q > 0);
  if (modEntries.length > 0) {
    y = sectionTitle('Módulos seleccionados', y);
    const allMods = [...MODULE_CATALOG.bajos, ...MODULE_CATALOG.altos, ...MODULE_CATALOG.especiales];
    modEntries.forEach(([id, qty]) => {
      const mod = allMods.find(m => m.id === id);
      if (mod) y = row(`${mod.name}:`, `${qty} unidad${qty !== 1 ? 'es' : ''}  (${mod.size})`, y);
    });
    y += 6;
  }

  // ── Extras
  const extrasActivos = ['led','isla','campana','mueble_auxiliar'].filter(k => state.extras[k]);
  if (extrasActivos.length > 0) {
    y = sectionTitle('Elementos adicionales', y);
    const EXTRA_LABELS = { led:'Iluminación LED', isla:'Isla / Barra', campana:'Campana extractora', mueble_auxiliar:'Mueble auxiliar' };
    extrasActivos.forEach(k => {
      let det = '';
      if (k === 'led' && state.extras.led_tipo) det = ` (${state.extras.led_tipo})`;
      if (k === 'isla' && state.extras.bancos) det += ' — Con bancos';
      if (k === 'campana' && state.extras.campana_tipo) det += ` (${state.extras.campana_tipo})`;
      y = row(EXTRA_LABELS[k] + ':', 'Incluido' + det, y);
    });
    y += 6;
  }

  // ── Footer
  doc.setFillColor(...green);
  doc.rect(0, 277, W, 20, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7);
  doc.setTextColor(200, 230, 210);
  doc.text('MHG Arquitectos  |  Tel. 271 704 1499  |  Fortín de las Flores, Veracruz', W/2, 284, {align:'center'});
  doc.text('Este documento es una preconfiguración orientativa. La cotización formal se entrega tras el levantamiento.', W/2, 290, {align:'center'});

  doc.save(`MHG_Cocina_${state.cliente.nombre?.replace(/\s+/g,'_') || folio}.pdf`);
}

/* ═══════════════════════════════════════════════════════
   WHATSAPP
═══════════════════════════════════════════════════════ */
function sendWhatsApp() {
  const allMods = [...MODULE_CATALOG.bajos, ...MODULE_CATALOG.altos, ...MODULE_CATALOG.especiales];
  const modLines = Object.entries(state.modules)
    .filter(([,q]) => q > 0)
    .map(([id, q]) => {
      const m = allMods.find(x => x.id === id);
      return `  • ${m ? m.name : id} x${q}`;
    }).join('\n') || '  • (Sin módulos especificados)';

  const extrasActivos = ['led','isla','campana','mueble_auxiliar']
    .filter(k => state.extras[k])
    .map(k => ({ led:'LED', isla:'Isla', campana:'Campana', mueble_auxiliar:'Mueble auxiliar' })[k])
    .join(', ') || 'Ninguno';

  const msg = `*NUEVA CONFIGURACIÓN — COCINA INTEGRAL*

*Cliente:* ${state.cliente.nombre}
*Teléfono:* ${state.cliente.tel}
*Dirección:* ${state.cliente.direccion}
*Levantamiento:* ${state.cliente.fecha}  ${state.cliente.hora}

*CONFIGURACIÓN*
• Situación: ${state.has_kitchen === 'no' ? 'Nueva cocina' : 'Renovación'}
• Gama: ${GAMA_LABELS[state.gama] || state.gama}
• Interior: ${INT_LABELS[state.interior_color] || state.interior_color}
• Frentes: ${FRENTE_LABELS[state.frente_tipo] || state.frente_tipo}${state.frente_color ? ' — ' + state.frente_color : ''}
• Cubierta: ${CUB_LABELS[state.cubierta] || state.cubierta}
• Herraje: ${HER_LABELS[state.herraje] || state.herraje}

*MÓDULOS*
${modLines}

*EXTRAS:* ${extrasActivos}

_Configuración enviada desde el sitio web_`;

  window.open(`https://wa.me/5212717041499?text=${encodeURIComponent(msg)}`, '_blank');
}
