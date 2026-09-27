(function() {
  'use strict';
  var lb = document.getElementById('lightbox');
  var img = document.getElementById('lbImg');
  var caption = document.getElementById('lbCaption');
  var thumbnails = document.getElementById('lbThumbnails');
  var previous = document.getElementById('lbPrev');
  var next = document.getElementById('lbNext');
  var close = document.getElementById('lbClose');
  var images = [], active = 0, title = '';
  var returnFocus = null, previousOverflow = '', background = [];
  var touchStart = null;

  function showLightboxImage(index) {
    active = (index + images.length) % images.length;
    img.src = images[active];
    img.alt = title || 'Imagen ampliada';
    caption.textContent = title + (images.length > 1 ? ' · ' + (active + 1) + ' / ' + images.length : '');
    thumbnails.querySelectorAll('button').forEach(function(button, i) {
      button.setAttribute('aria-pressed', String(i === active));
      if (i === active) {
        thumbnails.scrollLeft = Math.max(0, button.offsetLeft - thumbnails.offsetLeft - thumbnails.clientWidth / 2 + button.offsetWidth / 2);
      }
    });
  }

  // Compatible with openLightbox(src, caption), plus an array and optional start index.
  window.openLightbox = function(source, label, startIndex) {
    var requested = Array.isArray(source) ? source : [source];
    var startSource = requested[startIndex || 0];
    var valid = requested.filter(function(src, i, all) {
      return typeof src === 'string' && src.length > 0 && all.indexOf(src) === i;
    });
    if (!valid.length) return;
    if (lb.style.display !== 'flex') {
      returnFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      background = Array.from(document.body.children).filter(function(el) {
        return el !== lb && !/^(SCRIPT|STYLE)$/.test(el.tagName);
      }).map(function(el) {
        var inert = el.inert;
        el.inert = true;
        return { element: el, inert: inert };
      });
    }
    images = valid;
    title = label || '';
    thumbnails.replaceChildren();
    var multiple = images.length > 1;
    previous.hidden = next.hidden = thumbnails.hidden = !multiple;
    if (multiple) images.forEach(function(src, i) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Ver fotografía ' + (i + 1));
      var thumb = document.createElement('img');
      thumb.src = src;
      thumb.alt = '';
      button.appendChild(thumb);
      button.addEventListener('click', function() { showLightboxImage(i); });
      thumbnails.appendChild(button);
    });
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    showLightboxImage(Math.max(0, images.indexOf(startSource)));
    close.focus({ preventScroll: true });
  };

  window.closeLightbox = function() {
    if (lb.style.display !== 'flex') return;
    lb.style.display = 'none';
    img.removeAttribute('src');
    thumbnails.replaceChildren();
    touchStart = null;
    document.body.style.overflow = previousOverflow;
    background.forEach(function(item) { item.element.inert = item.inert; });
    background = [];
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  };
  close.addEventListener('click', window.closeLightbox);
  previous.addEventListener('click', function() { showLightboxImage(active - 1); });
  next.addEventListener('click', function() { showLightboxImage(active + 1); });
  document.addEventListener('keydown', function(event) {
    if (event.defaultPrevented || lb.style.display !== 'flex') return;
    if (event.key === 'Escape') { event.preventDefault(); window.closeLightbox(); }
    if (images.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      showLightboxImage(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Tab') {
      var buttons = Array.from(lb.querySelectorAll('button')).filter(function(b) { return !b.hidden && b.getClientRects().length; });
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !lb.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !lb.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
  var stage = lb.querySelector('.lb-stage');
  stage.addEventListener('click', function(event) {
    if (event.target === stage) window.closeLightbox();
  });
  stage.addEventListener('touchstart', function(event) {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', function(event) {
    if (!touchStart || images.length < 2 || !event.changedTouches.length) return;
    var dx = event.changedTouches[0].clientX - touchStart.x;
    var dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) showLightboxImage(active + (dx < 0 ? 1 : -1));
  }, { passive: true });
  stage.addEventListener('touchcancel', function() { touchStart = null; });

  // Explicit controls keep viewing photographs separate from selecting cards.
  function attachPhotoControl(photo, image, label) {
    if (!image || !image.getAttribute('src') || photo.querySelector('.photo-ampliar')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-ampliar';
    button.textContent = 'Ampliar ↗';
    button.setAttribute('aria-label', 'Ampliar ' + label);
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      window.openLightbox(image.src, label);
    });
    image.addEventListener('error', function() { button.hidden = true; });
    image.addEventListener('load', function() { button.hidden = false; });
    photo.appendChild(button);
  }

  function attachAllPhotoControls() {
    document.querySelectorAll('.material-card').forEach(function(card) {
      attachPhotoControl(card.querySelector('.material-card-swatch'), card.querySelector('.material-card-swatch img'), card.querySelector('.material-card-name').textContent);
    });
    document.querySelectorAll('.extra-card').forEach(function(card) {
      attachPhotoControl(card.querySelector('.extra-card-photo') || card, card.querySelector('.extra-card-img'), card.querySelector('.extra-card-name').textContent);
    });
    document.querySelectorAll('.frente-line-card').forEach(function(card) {
      attachPhotoControl(card, card.querySelector('.frente-line-card-img'), card.querySelector('.frente-line-card-name').textContent);
    });
    // Preserve the existing image click behavior for the other steps.
    document.querySelectorAll('.option-photo img').forEach(function(image) {
      if (image.dataset.lb) return;
      image.dataset.lb = '1';
      image.style.cursor = 'zoom-in';
      image.addEventListener('click', function(event) {
        event.stopPropagation();
        window.openLightbox(image.src, image.alt);
      });
    });
  }
  new MutationObserver(attachAllPhotoControls).observe(document.body, { childList: true, subtree: true });
  attachAllPhotoControls();
})();
