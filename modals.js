/* ═══════════════════════════════════════════════════════════════
   MHG Arquitectos — Modals de Cotización por Servicio
   modals.js
   ═══════════════════════════════════════════════════════════════ */

/* ─── MODAL CONFIGS ─── */
const MODAL_CONFIGS = {

  construccion: {
    icon: '🏗️',
    title: 'Diseño y Construcción',
    subtitle: 'Cuéntanos sobre tu proyecto para enviarte una cotización preliminar.',
    fields: [
      { id:'mc-tipo', label:'Tipo de proyecto', type:'select',
        required:true, options:['Residencial nueva construcción','Remodelación residencial','Proyecto comercial','Bodega / Industrial','Otro'] },
      { id:'mc-pisos', label:'Número de pisos aproximado', type:'select',
        required:true, options:['1 piso','2 pisos','3 pisos o más','Aún no definido'] },
      { id:'mc-m2', label:'Metros cuadrados aproximados', type:'select',
        required:false, options:['Menos de 80 m²','80 – 150 m²','150 – 300 m²','Más de 300 m²','No lo sé aún'] },
      { id:'mc-terreno', label:'¿Cuentas con terreno?', type:'select',
        required:true, options:['Sí, tengo terreno propio','No, necesito asesoría para conseguir uno','No aplica (remodelación)'] },
      { id:'mc-municipio', label:'Municipio / Ciudad de la obra', type:'text', required:true, placeholder:'Ej. Fortín de las Flores, Ver.' },
      { id:'mc-nombre', label:'Tu nombre completo', type:'text', required:true, placeholder:'Nombre y apellido' },
      { id:'mc-tel', label:'Número de teléfono', type:'tel', required:true, placeholder:'+52 271 000 0000' },
      { id:'mc-fecha', label:'Fecha preferida para visita / levantamiento', type:'date', required:true },
      { id:'mc-notas', label:'Descripción de tu proyecto (opcional)', type:'textarea', required:false, placeholder:'Cuéntanos brevemente lo que tienes en mente...' },
    ]
  },

  mobiliario: {
    icon: '🪵',
    title: 'Mobiliario General',
    subtitle: 'Dinos qué mueble necesitas y te orientamos con la cotización.',
    fields: [
      { id:'mm-tipo', label:'Tipo de mueble', type:'select',
        required:true, options:['Closet','Mueble de TV','Alacena','Puerta de madera','Vestidor','Mueble de baño','Librería','Otro'] },
      { id:'mm-dimensiones', label:'Dimensiones aproximadas', type:'select',
        required:false, options:['Pequeño (menos de 1.5m)','Mediano (1.5 – 2.4m)','Grande (más de 2.4m)','No lo sé aún'] },
      { id:'mm-material', label:'Material preferido', type:'select',
        required:false, options:['Melamina (económico)','MDF con chapa','Madera sólida','Sin preferencia / Lo que recomienden'] },
      { id:'mm-color', label:'Tono o color aproximado', type:'select',
        required:false, options:['Blanco / Claro','Gris','Madera natural','Oscuro / Wengué','No tengo preferencia'] },
      { id:'mm-led', label:'¿Incluir iluminación LED?', type:'select',
        required:false, options:['Sí, me interesa','No por ahora','No sé, que me asesoren'] },
      { id:'mm-nombre', label:'Tu nombre completo', type:'text', required:true, placeholder:'Nombre y apellido' },
      { id:'mm-tel', label:'Número de teléfono', type:'tel', required:true, placeholder:'+52 271 000 0000' },
      { id:'mm-municipio', label:'Municipio / Ciudad', type:'text', required:true, placeholder:'Ej. Tuxtepec, Oax.' },
      { id:'mm-fecha', label:'Fecha preferida para levantamiento', type:'date', required:true },
    ]
  },

  interiorismo: {
    icon: '🎨',
    title: 'Interiorismo',
    subtitle: 'Cuéntanos sobre el espacio que quieres transformar.',
    fields: [
      { id:'mi-espacio', label:'Tipo de espacio', type:'select',
        required:true, options:['Sala / Comedor','Recámara principal','Recámara secundaria','Oficina en casa','Local comercial','Departamento completo','Casa completa','Otro'] },
      { id:'mi-m2', label:'Metros cuadrados aproximados del espacio', type:'select',
        required:false, options:['Menos de 20 m²','20 – 50 m²','50 – 100 m²','Más de 100 m²','No lo sé'] },
      { id:'mi-estilo', label:'Estilo que te atrae', type:'select',
        required:false, options:['Moderno / Minimalista','Rústico / Industrial','Clásico / Elegante','Contemporáneo','Tropical / Natural','No tengo preferencia'] },
      { id:'mi-presupuesto', label:'Rango de presupuesto aproximado', type:'select',
        required:false, options:['Menos de $30,000 MXN','$30,000 – $80,000 MXN','$80,000 – $200,000 MXN','Más de $200,000 MXN','Prefiero no indicarlo'] },
      { id:'mi-nombre', label:'Tu nombre completo', type:'text', required:true, placeholder:'Nombre y apellido' },
      { id:'mi-tel', label:'Número de teléfono', type:'tel', required:true, placeholder:'+52 271 000 0000' },
      { id:'mi-municipio', label:'Municipio / Ciudad', type:'text', required:true, placeholder:'Ej. Fortín de las Flores, Ver.' },
      { id:'mi-fecha', label:'Fecha preferida para visita', type:'date', required:true },
    ]
  }

};

/* ─── ACTIVE MODAL ─── */
let activeModalKey = null;

/* ─── OPEN MODAL ─── */
function openModal(serviceKey) {
  const config = MODAL_CONFIGS[serviceKey];
  if (!config) return;

  activeModalKey = serviceKey;

  document.getElementById('modal-icon').textContent = config.icon;
  document.getElementById('modal-title').textContent = config.title;
  document.getElementById('modal-subtitle').textContent = config.subtitle;

  // Build form
  const container = document.getElementById('modal-form-content');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;';

  config.fields.forEach(field => {
    const group = document.createElement('div');
    // Full width for textarea, address, notas
    const isFullWidth = field.type === 'textarea' || field.id.includes('notas') || field.id.includes('municipio') || field.id.includes('dir');
    if (isFullWidth) group.style.gridColumn = '1 / -1';

    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.style.cssText = 'display:block;font-size:0.75rem;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;';
    label.textContent = field.label + (field.required ? ' *' : '');
    group.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.id = field.id;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— Selecciona —';
      placeholder.disabled = true;
      placeholder.selected = true;
      input.appendChild(placeholder);
      (field.options || []).forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = field.id;
      input.rows = 3;
      input.placeholder = field.placeholder || '';
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.id = field.id;
      input.placeholder = field.placeholder || '';
      if (field.type === 'date') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        input.min = tomorrow.toISOString().split('T')[0];
      }
    }

    input.style.cssText = 'width:100%;background:#111;border:1.5px solid rgba(255,255,255,0.07);border-radius:8px;padding:11px 13px;color:#f0f0f0;font-family:Inter,sans-serif;font-size:0.88rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-sizing:border-box;';
    if (field.type === 'select') {
      input.style.cssText += 'appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px;';
    }

    input.addEventListener('focus', () => {
      input.style.borderColor = '#2ecc71';
      input.style.boxShadow = '0 0 0 3px rgba(46,204,113,0.15)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(255,255,255,0.07)';
      input.style.boxShadow = 'none';
    });

    group.appendChild(input);
    grid.appendChild(group);
  });

  container.appendChild(grid);

  // Show overlay
  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Animate in
  const box = document.getElementById('modal-box');
  box.style.transform = 'translateY(20px)';
  box.style.opacity = '0';
  box.style.transition = 'transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s ease';
  requestAnimationFrame(() => {
    box.style.transform = 'translateY(0)';
    box.style.opacity = '1';
  });
}

/* ─── CLOSE MODAL ─── */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  box.style.transform = 'translateY(20px)';
  box.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    activeModalKey = null;
  }, 280);
}

function closeModalOnOverlay(event) {
  if (event.target === document.getElementById('modal-overlay')) closeModal();
}

/* ─── SUBMIT MODAL ─── */
function submitModal() {
  if (!activeModalKey) return;
  const config = MODAL_CONFIGS[activeModalKey];
  const requiredFields = config.fields.filter(f => f.required);

  for (const field of requiredFields) {
    const el = document.getElementById(field.id);
    if (!el || !el.value.trim()) {
      el?.focus();
      el && (el.style.borderColor = '#e74c3c');
      el && (el.style.boxShadow = '0 0 0 3px rgba(231,76,60,0.15)');
      setTimeout(() => {
        if (el) {
          el.style.borderColor = 'rgba(255,255,255,0.07)';
          el.style.boxShadow = 'none';
        }
      }, 2500);
      alert(`Por favor completa el campo: "${field.label}"`);
      return;
    }
  }

  // Build WhatsApp message
  const iconMap = { construccion:'', mobiliario:'', interiorismo:'' };
  let msg = `*COTIZACIÓN — ${config.title.toUpperCase()}*\n\n`;

  config.fields.forEach(field => {
    const el = document.getElementById(field.id);
    const val = el?.value?.trim();
    if (val) {
      msg += `• *${field.label}:* ${val}\n`;
    }
  });

  msg += `\n_Cotización enviada desde mhgarquitectos.com_`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/5212717041499?text=${encoded}`, '_blank');
  closeModal();
}

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModalKey) closeModal();
});
