"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Corporate DOM enhancements. Never loaded by the independent kitchen document. */
export default function SiteInteractions() {
  const pathname = usePathname();
  useEffect(() => {
    const controller = new AbortController();
    const observers: IntersectionObserver[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const restores: (() => void)[] = [];
    const frames: number[] = [];
    const on = <K extends keyof GlobalEventHandlersEventMap>(el: EventTarget | null, name: K,
      handler: (e: GlobalEventHandlersEventMap[K]) => void, passive = false) => {
      el?.addEventListener(name, handler as EventListener, { signal: controller.signal, passive });
    };
    const observe = (callback: IntersectionObserverCallback, options: IntersectionObserverInit) => {
      const observer = new IntersectionObserver(callback, options); observers.push(observer); return observer;
    };
    const home = pathname === "/" || pathname === "/index.html";
    const navbar = document.getElementById("navbar"), toggle = document.getElementById("nav-toggle"), menu = document.getElementById("nav-menu");
    const onScroll = () => navbar?.classList.toggle("scrolled", !home || window.scrollY > 40);
    on(window, "scroll", onScroll, true); onScroll();
    const closeMenu = () => { menu?.classList.remove("open"); toggle?.classList.remove("is-open"); toggle?.setAttribute("aria-expanded", "false"); };
    closeMenu();
    on(toggle, "click", () => {
      const open = menu?.classList.toggle("open") ?? false;
      toggle?.setAttribute("aria-expanded", String(open)); toggle?.classList.toggle("is-open", open);
    });
    menu?.querySelectorAll(".nav-link").forEach(link => on(link, "click", closeMenu));
    const tabs = document.querySelectorAll<HTMLElement>(".proj-tab"), panels = document.querySelectorAll<HTMLElement>(".proj-panel");
    tabs.forEach(tab => on(tab, "click", () => {
      tabs.forEach(item => { item.classList.toggle("active", item === tab); item.setAttribute("aria-selected", String(item === tab)); });
      panels.forEach(panel => { const active = panel.id === "cat-" + tab.dataset.cat; panel.classList.toggle("active", active); panel.hidden = !active; });
    }));
    document.querySelectorAll<HTMLElement>(".branch-map").forEach(wrap => {
      const placeholder = wrap.querySelector<HTMLElement>(".map-placeholder"), src = placeholder?.dataset.src;
      if (!placeholder || !src) return;
      let iframe: HTMLIFrameElement | null = null;
      const load = () => {
        if (iframe || !placeholder.isConnected) return;
        iframe = document.createElement("iframe"); iframe.src = src; iframe.title = "Mapa MHG Arquitectos";
        iframe.allowFullscreen = true; iframe.loading = "lazy"; iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.style.cssText = "width:100%;height:100%;border:none;display:block;"; wrap.replaceChild(iframe, placeholder);
      };
      on(placeholder, "click", load);
      const observer = observe(([entry]) => { if (entry.isIntersecting) { load(); observer.disconnect(); } }, { rootMargin: "200px" });
      observer.observe(wrap); restores.push(() => { if (iframe?.parentNode === wrap) wrap.replaceChild(placeholder, iframe); });
    });
    const reveals = document.querySelectorAll<HTMLElement>(".service-card, .proj-item, .proj-cta-card, .contact-card, .trust-img-wrap, .trust-content, .trust-badge-card, .map-wrap, .social-row, .btn-full, .branch-card");
    const revealObserver = observe(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = Array.from(entry.target.parentElement?.children ?? []);
      timers.push(setTimeout(() => entry.target.classList.add("visible"), Math.min(siblings.indexOf(entry.target) * 70, 400)));
      revealObserver.unobserve(entry.target);
    }), { threshold: 0.1 });
    reveals.forEach(el => { el.classList.add("reveal"); revealObserver.observe(el); });
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => on(anchor, "click", event => {
      const id = anchor.getAttribute("href")?.slice(1), target = id ? document.getElementById(id) : null;
      if (target) { event.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }));
    const navLinks = document.querySelectorAll(".nav-link");
    const sectionObserver = observe(entries => entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
    }), { rootMargin: "-40% 0px -40% 0px" });
    document.querySelectorAll("section[id]").forEach(section => sectionObserver.observe(section));

    // This overlay is entirely owned by the effect, never by React's children.
    const lightbox = document.createElement("div"); lightbox.id = "lightbox";
    lightbox.setAttribute("role", "dialog"); lightbox.setAttribute("aria-label", "Galería ampliada");
    lightbox.style.cssText = "display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.93);align-items:center;justify-content:center;cursor:zoom-out;";
    const image = document.createElement("img"); image.alt = "Proyecto MHG Arquitectos";
    image.style.cssText = "max-width:88vw;max-height:88vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.8);animation:lbIn .25s ease;cursor:default;";
    const close = document.createElement("button"); close.textContent = "×"; close.setAttribute("aria-label", "Cerrar");
    close.style.cssText = "position:absolute;top:20px;right:28px;background:none;border:none;color:#fff;font-size:2.4rem;cursor:pointer;line-height:1;opacity:.7;transition:.2s;";
    const previous = document.createElement("button"); previous.className = "lb-nav lb-prev"; previous.textContent = "‹"; previous.setAttribute("aria-label", "Anterior");
    const next = document.createElement("button"); next.className = "lb-nav lb-next"; next.textContent = "›"; next.setAttribute("aria-label", "Siguiente");
    lightbox.append(image, close, previous, next); document.body.append(lightbox);
    const style = document.createElement("style"); style.textContent = "@keyframes lbIn { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }"; document.head.append(style);
    let items: HTMLElement[] = [], index = 0, overflow = "";
    const show = (position: number) => {
      if (!items.length) return;
      index = (position + items.length) % items.length;
      const source = items[index].querySelector("img"); if (!source) return;
      image.src = source.src; image.alt = source.alt || "Proyecto MHG"; image.style.animation = "none";
      frames.push(requestAnimationFrame(() => { image.style.animation = "lbIn .25s ease"; }));
    };
    const closeLightbox = () => { if (lightbox.style.display === "flex") { lightbox.style.display = "none"; document.body.style.overflow = overflow; } };
    document.querySelectorAll(".proj-grid").forEach(grid => {
      const group = Array.from(grid.querySelectorAll<HTMLElement>(".proj-item"));
      group.forEach((item, position) => on(item, "click", () => {
        items = group; show(position); overflow = document.body.style.overflow;
        lightbox.style.display = "flex"; document.body.style.overflow = "hidden";
        previous.style.display = next.style.display = items.length > 1 ? "flex" : "none";
      }));
    });
    on(image, "click", e => e.stopPropagation()); on(close, "mouseenter", () => { close.style.opacity = "1"; }); on(close, "mouseleave", () => { close.style.opacity = ".7"; });
    on(lightbox, "click", closeLightbox);
    on(previous, "click", e => { e.stopPropagation(); show(index - 1); }); on(next, "click", e => { e.stopPropagation(); show(index + 1); });
    on(document, "keydown", e => {
      if (lightbox.style.display !== "flex") return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
    return () => {
      controller.abort(); observers.forEach(observer => observer.disconnect()); timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame);
      closeLightbox(); lightbox.remove(); style.remove(); restores.forEach(restore => restore()); closeMenu();
      reveals.forEach(el => el.classList.remove("reveal", "visible"));
    };
  }, [pathname]);
  return null;
}
