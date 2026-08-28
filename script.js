/* ─────────────────────────────────────────
   MHG Arquitectos — Script v3
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll ────────────────── */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
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

  /* ── Project category tabs ────────── */
  const tabs = document.querySelectorAll('.proj-tab');
  const grids = document.querySelectorAll('.proj-grid');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-cat');

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      grids.forEach(g => {
        const isTarget = g.id === 'cat-' + cat;
        g.classList.toggle('active', isTarget);
        if (isTarget) {
          g.removeAttribute('hidden');
        } else {
          g.setAttribute('hidden', '');
        }
      });
    });
  });

  /* ── Lazy map loader (generic) ────── */
  function initLazyMap(wrap) {
    if (!wrap) return;
    const placeholder = wrap.querySelector('.map-placeholder');
    if (!placeholder) return;

    const mapSrc = placeholder.getAttribute('data-src');
    if (!mapSrc) return;

    const loadMap = () => {
      const iframe = document.createElement('iframe');
      iframe.src = mapSrc;
      iframe.title = 'Mapa MHG Arquitectos';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
      wrap.replaceChild(iframe, placeholder);
    };

    placeholder.addEventListener('click', loadMap);

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { loadMap(); observer.disconnect(); }
    }, { rootMargin: '200px' });

    observer.observe(wrap);
  }

  // Contact section map
  const mainMapWrap = document.getElementById('map-wrap');
  if (mainMapWrap) {
    const ph = mainMapWrap.querySelector('.map-placeholder');
    if (ph) {
      const src = ph.getAttribute('data-src');
      const iframe = document.createElement('iframe');
      iframe.setAttribute('data-src', src);
      mainMapWrap.appendChild(iframe);
      initLazyMap(mainMapWrap);
    }
  }

  // Branch maps
  document.querySelectorAll('.branch-map').forEach(wrap => initLazyMap(wrap));

  /* ── Reveal on scroll ─────────────── */
  const reveals = document.querySelectorAll(
    '.service-card, .proj-item, .proj-cta-card, .contact-card, .trust-img-wrap, .trust-content, .trust-badge-card, .map-wrap, .social-row, .btn-full, .branch-card'
  );

  reveals.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement.children);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 70, 400);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => revealObserver.observe(el));

  /* ── Smooth scroll anchor links ───── */
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

  /* ── Project + Gallery lightbox ───── */
  let currentIdx = 0;
  let currentItems = [];

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
  lbImg.alt = 'Proyecto MHG Arquitectos';
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

  const lbStyle = document.createElement('style');
  lbStyle.textContent = `@keyframes lbIn { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }`;
  document.head.appendChild(lbStyle);

  const showImage = (idx) => {
    currentIdx = (idx + currentItems.length) % currentItems.length;
    const src = currentItems[currentIdx].querySelector('img').src;
    const alt = currentItems[currentIdx].querySelector('img').alt || 'Proyecto MHG';
    lbImg.src = src;
    lbImg.alt = alt;
    lbImg.style.animation = 'none';
    requestAnimationFrame(() => { lbImg.style.animation = 'lbIn .25s ease'; });
  };

  const openLightbox = (items, idx) => {
    currentItems = Array.from(items);
    showImage(idx);
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    lbPrev.style.display = currentItems.length > 1 ? 'flex' : 'none';
    lbNext.style.display = currentItems.length > 1 ? 'flex' : 'none';
  };

  // Attach to proj-items (grouped by active grid)
  document.querySelectorAll('.proj-grid').forEach(grid => {
    const items = grid.querySelectorAll('.proj-item');
    items.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox(items, i));
    });
  });

  lbPrev.addEventListener('click', e => { e.stopPropagation(); showImage(currentIdx - 1); });
  lbNext.addEventListener('click', e => { e.stopPropagation(); showImage(currentIdx + 1); });

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

  /* ── Animated counter ──────────────── */
  document.querySelectorAll('.counter[data-target]').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const duration = 1400;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = '+' + Math.round(current).toLocaleString('es-MX');
          if (current >= target) clearInterval(timer);
        }, 16);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
  });

});
