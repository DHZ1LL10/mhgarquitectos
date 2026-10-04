"use client";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  const home = pathname === "/" || pathname === "/index.html";
  return (<header className={home ? "navbar" : "navbar scrolled"} id="navbar">
    <div className="nav-inner">
      <a href={home ? "#inicio" : "/#inicio"} className="nav-logo" id="nav-logo-link">
        <img src="/img/logo.jpg" alt="MHG Arquitectos" className="nav-logo-img" width="42" height="42" />
        <span className="nav-logo-text">MHG <span className="accent">Arquitectos</span></span>
      </a>
      <button className="nav-toggle" id="nav-toggle" aria-label="Abrir menú" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav className="nav-menu" id="nav-menu">
        <a href={home ? "#proyectos" : "/#proyectos"} className="nav-link">Proyectos</a>
        <a href={home ? "#servicios" : "/#servicios"} className="nav-link">Servicios</a>
        <a href={home ? "#nosotros" : "/#nosotros"} className="nav-link">Nosotros</a>
        <a href={home ? "#sucursales" : "/#sucursales"} className="nav-link">Sucursales</a>
        <a href={home ? "#contacto" : "/#contacto"} className="nav-link">Contacto</a>
        <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20conocer%20m%C3%A1s%20sobre%20sus%20servicios." className="btn btn-nav" target="_blank" rel="noopener noreferrer" id="nav-whatsapp-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          WhatsApp
        </a>
      </nav>
    </div>
  </header>);
}
