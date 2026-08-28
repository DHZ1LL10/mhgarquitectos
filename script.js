/* ─────────────────────────────────────────
   MHG Arquitectos — Script (v2 — post-audit)
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll behaviour ──────── */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu toggle ───────────── */
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.toggle('is-open', open);
  });

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Reveal on scroll ─────────────── */
  const reveals = document.querySelectorAll(
    '.service-card, .gallery-item, .contact-card, .trust-img-wrap, .trust-content, .trust-badge-card, .map-wrap, .social-row, .btn-full'
  );

  reveals.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement.children);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 400);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => revealObserver.observe(el));

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Active nav link on scroll ───── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  /* ── Lazy Map (load only when near viewport) ─── */
  const mapWrap = document.getElementById('map-wrap');
  if (mapWrap) {
    const iframe = mapWrap.querySelector('iframe');
    if (iframe) {
      // Show placeholder first
      const placeholder = document.createElement('div');
      placeholder.className = 'map-placeholder';
      placeholder.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>Fortín de las Flores, Veracruz</span>
        <small style="font-size:.8rem;opacity:.7">Clic para cargar el mapa</small>
      `;
      mapWrap.replaceChild(placeholder, iframe);

      const loadMap = () => {
        iframe.src = iframe.getAttribute('data-src') || iframe.src;
        mapWrap.replaceChild(iframe, placeholder);
      };

      // Load on click or when 200px away from viewport
      placeholder.addEventListener('click', loadMap);

      const mapObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          loadMap();
          mapObserver.disconnect();
        }
      }, { rootMargin: '200px' });

      mapObserver.observe(mapWrap);
    }
  }

  /* ── Gallery lightbox with prev/next ─── */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  let currentIdx = 0;

  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-label', 'Galería ampliada');
  lightbox.style.cssText = `
    display:none; position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,.93); align-items:center;
    justify-content:center; cursor:zoom-out;
  `;

  const lbImg = document.createElement('img');
  lbImg.alt = 'Proyecto MHG Arquitectos ampliado';
  lbImg.style.cssText = `
    max-width:88vw; max-height:88vh; object-fit:contain;
    border-radius:8px; box-shadow:0 20px 60px rgba(0,0,0,.8);
    animation:lbIn .25s ease; cursor:default;
  `;
  lbImg.addEventListener('click', e => e.stopPropagation());

  const lbClose = document.createElement('button');
  lbClose.innerHTML = '&times;';
  lbClose.setAttribute('aria-label', 'Cerrar');
  lbClose.style.cssText = `
    position:absolute; top:20px; right:28px;
    background:none; border:none; color:#fff;
    font-size:2.4rem; cursor:pointer; line-height:1;
    opacity:.7; transition:.2s;
  `;
  lbClose.onmouseenter = () => lbClose.style.opacity = '1';
  lbClose.onmouseleave = () => lbClose.style.opacity = '.7';

  const lbPrev = document.createElement('button');
  lbPrev.className = 'lb-nav lb-prev';
  lbPrev.setAttribute('aria-label', 'Anterior');
  lbPrev.innerHTML = '&#8249;';

  const lbNext = document.createElement('button');
  lbNext.className = 'lb-nav lb-next';
  lbNext.setAttribute('aria-label', 'Siguiente');
  lbNext.innerHTML = '&#8250;';

  lightbox.appendChild(lbImg);
  lightbox.appendChild(lbClose);
  lightbox.appendChild(lbPrev);
  lightbox.appendChild(lbNext);
  document.body.appendChild(lightbox);

  // Lightbox animation keyframe
  const lbStyle = document.createElement('style');
  lbStyle.textContent = `@keyframes lbIn { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }`;
  document.head.appendChild(lbStyle);

  const showImage = (idx) => {
    currentIdx = (idx + galleryItems.length) % galleryItems.length;
    lbImg.src = galleryItems[currentIdx].querySelector('img').src;
    lbImg.alt = galleryItems[currentIdx].querySelector('img').alt || 'Proyecto MHG';
    lbImg.style.animation = 'none';
    requestAnimationFrame(() => { lbImg.style.animation = 'lbIn .25s ease'; });
  };

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      showImage(i);
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIdx - 1); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIdx + 1); });

  const closeLb = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  };

  lightbox.addEventListener('click', closeLb);
  lbClose.addEventListener('click', e => { e.stopPropagation(); closeLb(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLb();
    if (lightbox.style.display === 'flex') {
      if (e.key === 'ArrowLeft') showImage(currentIdx - 1);
      if (e.key === 'ArrowRight') showImage(currentIdx + 1);
    }
  });

  /* ── Animated counter (badge) ──────── */
  const counters = document.querySelectorAll('.counter[data-target]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          const duration = 1400;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = '+' + Math.round(current).toLocaleString('es-MX');
            if (current >= target) clearInterval(timer);
          }, 16);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

});
