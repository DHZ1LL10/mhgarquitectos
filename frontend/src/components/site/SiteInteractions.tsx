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
    const reveals = document.querySelectorAll<HTMLElement>(".section-header, .service-card, .portfolio-project-card, .contact-card, .trust-img-wrap, .trust-content, .trust-badge-card, .map-wrap, .social-row, .btn-full, .branch-card");
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
    return () => {
      controller.abort(); observers.forEach(observer => observer.disconnect()); timers.forEach(clearTimeout);
      restores.forEach(restore => restore()); closeMenu();
      reveals.forEach(el => el.classList.remove("reveal", "visible"));
    };
  }, [pathname]);
  return null;
}
