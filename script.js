/* ─────────────────────────────────────────
   MHG Arquitectos — Script
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll behaviour ──────── */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu toggle ───────────── */
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.classList.toggle('is-open', open);
  });

  /* Close menu when a nav link is clicked */
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('is-open');
    });
  });

  /* ── Reveal on scroll ─────────────── */
  const reveals = document.querySelectorAll(
    '.service-card, .gallery-item, .contact-card, .trust-img-wrap, .trust-content, .trust-badge-card, .map-wrap, .social-row, .btn-full'
  );

  reveals.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Staggered delay for grid items
        const siblings = Array.from(entry.target.parentElement.children);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 400);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => observer.observe(el));

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

  /* ── Hamburger animation ──────────── */
  const style = document.createElement('style');
  style.textContent = `
    .nav-toggle.is-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .nav-toggle.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .nav-toggle.is-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    .nav-link.active { color: var(--green) !important; }
  `;
  document.head.appendChild(style);

  /* ── Gallery lightbox (basic) ─────── */
  const galleryItems = document.querySelectorAll('.gallery-item');

  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.style.cssText = `
    display:none; position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,.93); align-items:center;
    justify-content:center; cursor:zoom-out;
  `;

  const lbImg = document.createElement('img');
  lbImg.style.cssText = `
    max-width:92vw; max-height:90vh; object-fit:contain;
    border-radius:8px; box-shadow: 0 20px 60px rgba(0,0,0,.8);
    animation: lbIn .25s ease;
  `;

  const lbClose = document.createElement('button');
  lbClose.innerHTML = '&times;';
  lbClose.style.cssText = `
    position:absolute; top:20px; right:28px;
    background:none; border:none; color:#fff;
    font-size:2.4rem; cursor:pointer; line-height:1;
    opacity:.7; transition:.2s;
  `;
  lbClose.onmouseenter = () => lbClose.style.opacity = '1';
  lbClose.onmouseleave = () => lbClose.style.opacity = '.7';

  lightbox.appendChild(lbImg);
  lightbox.appendChild(lbClose);
  document.body.appendChild(lightbox);

  const lbStyle = document.createElement('style');
  lbStyle.textContent = `@keyframes lbIn { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }`;
  document.head.appendChild(lbStyle);

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.querySelector('img').src;
      lbImg.src = src;
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLb = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  };
  lightbox.addEventListener('click', closeLb);
  lbClose.addEventListener('click', e => { e.stopPropagation(); closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

});
