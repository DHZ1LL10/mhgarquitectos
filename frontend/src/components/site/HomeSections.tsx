export default function HomeSections() {
  return (<>

  {/* ═══════════════ HERO ═══════════════ */}
  <section className="hero" id="inicio">
    <div className="hero-bg">
      <img src="/img/fachada-frente.jpg" alt="Proyecto arquitectónico MHG Arquitectos en Fortín de las Flores" className="hero-img" fetchPriority="high" decoding="sync" />
      <div className="hero-overlay"></div>
    </div>
    <div className="hero-content">
      <span className="hero-line"></span>
      <h1 className="hero-title">
        Tu espacio ideal,<br />
        <em>diseñado y construido</em><br />
        con precisión.
      </h1>
      <p className="hero-sub">
        Diseñamos. Construimos. Equipamos.<br />
        Más de 6 años transformando espacios residenciales y comerciales en Fortín y Tuxtepec.
      </p>
      <div className="hero-actions">
        <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20conocer%20m%C3%A1s%20sobre%20sus%20servicios%20de%20dise%C3%B1o%20y%20construcci%C3%B3n." className="btn btn-primary" target="_blank" rel="noopener noreferrer" id="hero-whatsapp-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Escribir por WhatsApp
        </a>
        <a href="#proyectos" className="btn btn-ghost">Ver proyectos</a>

      </div>
    </div>
    <a href="#servicios" className="hero-scroll" aria-label="Scroll hacia abajo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
    </a>
  </section>

  {/* ═══════════════ PROYECTOS POR CATEGORÍA ═══════════════ */}
  <section className="section projects-section" id="proyectos">
    <div className="container">
      <div className="section-header">
        <span className="section-label">Nuestro trabajo</span>
        <h2 className="section-title">Proyectos Realizados</h2>
        <p className="section-desc">Selecciona una categoría para ver nuestros trabajos.</p>
      </div>

      {/* Tabs de categoría */}
      <div className="proj-tabs" role="tablist" aria-label="Categorías de proyectos">
        <button className="proj-tab active" role="tab" data-cat="construccion" id="tab-construccion" aria-selected="true">Diseño y Construcción</button>
        <button className="proj-tab" role="tab" data-cat="cocinas" id="tab-cocinas" aria-selected="false">Cocinas</button>
        <button className="proj-tab" role="tab" data-cat="mobiliario" id="tab-mobiliario" aria-selected="false">Mobiliario</button>
        <button className="proj-tab" role="tab" data-cat="interiorismo" id="tab-interiorismo" aria-selected="false">Interiorismo</button>
      </div>

      {/* CONSTRUCCIÓN */}
      <div className="proj-panel active" id="cat-construccion" role="tabpanel" aria-labelledby="tab-construccion">
        <div className="proj-grid">
          <div className="proj-item" id="proj-c1">
            <img src="/img/construccion/fachada-1.jpg" alt="Fachada residencial con piedra — MHG Arquitectos" loading="lazy" />
            <div className="proj-overlay"><span>Fachada Residencial</span></div>
          </div>
          <div className="proj-item" id="proj-c2">
            <img src="/img/construccion/entrada.jpg" alt="Entrada de proyecto con puerta decorativa" loading="lazy" />
            <div className="proj-overlay"><span>Entrada de Proyecto</span></div>
          </div>
          <div className="proj-item" id="proj-c3">
            <img src="/img/construccion/recamara.jpg" alt="Recámara terminada con closet integrado" loading="lazy" />
            <div className="proj-overlay"><span>Recámara con Closet</span></div>
          </div>
          <div className="proj-item" id="proj-c4">
            <img src="/img/construccion/obra-proceso.jpg" alt="Obra en proceso — vista aérea" loading="lazy" />
            <div className="proj-overlay"><span>Obra en Proceso</span></div>
          </div>
          <div className="proj-item" id="proj-c5">
            <img src="/img/construccion/obra-aerea.jpg" alt="Vista aérea del proyecto" loading="lazy" />
            <div className="proj-overlay"><span>Vista Aérea</span></div>
          </div>
        </div>
        <div className="proj-sidebar">
          <div className="proj-cta-card" id="proj-c-cta">
            <p>¿Tienes un proyecto residencial o comercial?</p>
            <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20construir%20o%20remodelar.%20%C2%BFPodr%C3%ADan%20darme%20informaci%C3%B3n?" className="btn btn-primary" target="_blank" rel="noopener noreferrer" id="proj-wa-construccion">
              Platicar sobre mi obra
            </a>
          </div>
        </div>
      </div>

      {/* COCINAS */}
      <div className="proj-panel" id="cat-cocinas" role="tabpanel" aria-labelledby="tab-cocinas" hidden>
        <div className="proj-grid">
          <div className="proj-item" id="proj-k1">
            <img src="/img/cocinas/cocina-lambrin-1.jpg" alt="Cocina Lambrin con cubierta — MHG Arquitectos" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Lambrin · Con Cubierta</span></div>
          </div>
          <div className="proj-item" id="proj-k2">
            <img src="/img/cocinas/cocina-lambrin-2.jpg" alt="Cocina Lambrin vista lateral" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Lambrin</span></div>
          </div>
          <div className="proj-item" id="proj-k3">
            <img src="/img/cocinas/cocina-lambrin-3.jpg" alt="Cocina Lambrin sin cubierta" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Lambrin · Sin Cubierta</span></div>
          </div>
          <div className="proj-item" id="proj-k4">
            <img src="/img/cocinas/cocina-depto-1.jpg" alt="Cocina para departamento" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Departamento</span></div>
          </div>
          <div className="proj-item" id="proj-k5">
            <img src="/img/cocinas/cocina-oxford-1.jpg" alt="Cocina Oxford" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Oxford</span></div>
          </div>
          <div className="proj-item" id="proj-k6">
            <img src="/img/cocinas/cocina-durango-1.jpg" alt="Cocina Durango" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Durango</span></div>
          </div>
          <div className="proj-item" id="proj-k7">
            <img src="/img/cocinas/cocina-romero-1.jpg" alt="Cocina Romero" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Romero</span></div>
          </div>
          <div className="proj-item" id="proj-k8">
            <img src="/img/cocinas/cocina-romero-2.jpg" alt="Cocina Romero — detalle" loading="lazy" />
            <div className="proj-overlay"><span>Cocina Romero · Detalle</span></div>
          </div>
        </div>
        <div className="proj-sidebar">
          <div className="proj-cta-card" id="proj-k-cta">
            <p>¿Quieres renovar tu cocina?</p>
            <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20una%20Cocina%20Integral%20a%20medida.%20%C2%BFPueden%20cotizarme?" className="btn btn-primary" target="_blank" rel="noopener noreferrer" id="proj-wa-cocinas">
              Cotizar mi cocina
            </a>
          </div>
        </div>
      </div>

      {/* MOBILIARIO */}
      <div className="proj-panel" id="cat-mobiliario" role="tabpanel" aria-labelledby="tab-mobiliario" hidden>
        <div className="proj-grid">
          <div className="proj-item" id="proj-m1">
            <img src="/img/mobiliario/closet-grande-1.jpg" alt="Closet grande de madera — MHG Arquitectos" loading="lazy" />
            <div className="proj-overlay"><span>Closet Grande</span></div>
          </div>
          <div className="proj-item" id="proj-m2">
            <img src="/img/mobiliario/closet-tux-1.jpg" alt="Closet residencial premium" loading="lazy" />
            <div className="proj-overlay"><span>Closet Residencial</span></div>
          </div>
          <div className="proj-item" id="proj-m3">
            <img src="/img/mobiliario/isla-showroom-1.jpg" alt="Isla de showroom en madera y vidrio" loading="lazy" />
            <div className="proj-overlay"><span>Isla Showroom</span></div>
          </div>
          <div className="proj-item" id="proj-m4">
            <img src="/img/mobiliario/closet-tux-2.jpg" alt="Diseño de closet a medida" loading="lazy" />
            <div className="proj-overlay"><span>Closet a Medida</span></div>
          </div>
          <div className="proj-item" id="proj-m6">
            <img src="/img/mobiliario/puerta-1.jpg" alt="Puerta de madera a medida" loading="lazy" />
            <div className="proj-overlay"><span>Puertas a Medida</span></div>
          </div>
          <div className="proj-item" id="proj-m5">
            <img src="/img/mobiliario/mueble-tv-1.jpg" alt="Mueble de TV moderno" loading="lazy" />
            <div className="proj-overlay"><span>Mueble de TV</span></div>
          </div>
          <div className="proj-item" id="proj-m7">
            <img src="/img/mobiliario/closet-tux-4.jpg" alt="Closet premium con acabados finos" loading="lazy" />
            <div className="proj-overlay"><span>Closet Premium</span></div>
          </div>
        </div>
        <div className="proj-sidebar">
          <div className="proj-cta-card" id="proj-m-cta">
            <p>Closets, muebles, puertas y más.</p>
            <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20mobiliario%20a%20medida%20(closet%2C%20mueble%20de%20TV%2C%20puerta%20u%20otro).%20%C2%BFPueden%20asesorarme?" className="btn btn-primary" target="_blank" rel="noopener noreferrer" id="proj-wa-mobiliario">
              Cotizar mobiliario
            </a>
          </div>
        </div>
      </div>

      {/* INTERIORISMO */}
      <div className="proj-panel" id="cat-interiorismo" role="tabpanel" aria-labelledby="tab-interiorismo" hidden>
        <div className="proj-grid">
          <div className="proj-item" id="proj-i1">
            <img src="/img/interiorismo/espacio-1.jpg" alt="Espacio interior diseñado por MHG" loading="lazy" />
            <div className="proj-overlay"><span>Diseño de Espacio</span></div>
          </div>
          <div className="proj-item" id="proj-i2">
            <img src="/img/interiorismo/espacio-2.jpg" alt="Interiorismo — closet con diseño integrado" loading="lazy" />
            <div className="proj-overlay"><span>Closet Integrado</span></div>
          </div>
          <div className="proj-item" id="proj-i3">
            <img src="/img/interiorismo/espacio-3.jpg" alt="Detalle de interiorismo" loading="lazy" />
            <div className="proj-overlay"><span>Detalle de Acabados</span></div>
          </div>
        </div>
        <div className="proj-sidebar">
          <div className="proj-cta-card" id="proj-i-cta">
            <p>¿Quieres transformar un espacio?</p>
            <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20el%20servicio%20de%20Interiorismo%20para%20mi%20espacio.%20%C2%BFPodr%C3%ADan%20asesorarme?" className="btn btn-primary" target="_blank" rel="noopener noreferrer" id="proj-wa-interiorismo">
              Cotizar interiorismo
            </a>
          </div>
        </div>
      </div>

    </div>
  </section>

  {/* ═══════════════ SERVICIOS ═══════════════ */}
  <section className="services" id="servicios">
    <div className="container">
      <div className="services-header">
        <div className="services-header-left">
          <span className="section-label">Lo que hacemos</span>
          <h2 className="section-title">Servicios<br/>Profesionales</h2>
        </div>
        <p className="services-header-right">Soluciones integrales desde el diseño hasta la entrega final, con más de 6 años de experiencia en Veracruz.</p>
      </div>

      <ul className="services-list">

        {/* 1. Diseño y Construcción */}
        <li className="service-row" id="service-1">
          <span className="service-num">01</span>
          <div className="service-body">
            <h3 className="service-title">Diseño y Construcción</h3>
            <p className="service-desc">Proyectos residenciales y comerciales desde el concepto hasta la entrega de llaves. Obra ejecutiva con supervisión técnica.</p>
          </div>
          <button className="service-cta" data-quote-service="construccion" id="service-cta-1">
            Cotizar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </li>

        {/* 2. Cocinas Integrales — SIEMPRE al customizador */}
        <li className="service-row" id="service-2">
          <span className="service-num">02</span>
          <div className="service-body">
            <h3 className="service-title">Cocinas Integrales</h3>
            <p className="service-desc">Diseño y fabricación de cocinas a medida con materiales de alta calidad. Cubiertas, herrajes y acabados personalizados.</p>
          </div>
          <a href="/cocina-customizer.html" className="service-cta" id="service-cta-2" style={{"display": "inline-flex", "alignItems": "center", "gap": "8px", "textDecoration": "none"}}>
            Cotizar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </li>

        {/* 3. Mobiliario General */}
        <li className="service-row" id="service-3">
          <span className="service-num">03</span>
          <div className="service-body">
            <h3 className="service-title">Mobiliario General</h3>
            <p className="service-desc">Closets, muebles de TV, alacenas, puertas y todo tipo de mobiliario fabricado a medida para tu espacio.</p>
          </div>
          <button className="service-cta" data-quote-service="mobiliario" id="service-cta-3">
            Cotizar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </li>

        {/* 4. Interiorismo */}
        <li className="service-row" id="service-4">
          <span className="service-num">04</span>
          <div className="service-body">
            <h3 className="service-title">Interiorismo</h3>
            <p className="service-desc">Diseño integral de espacios interiores: distribución, materiales, iluminación y acabados que expresan tu personalidad.</p>
          </div>
          <button className="service-cta" data-quote-service="interiorismo" id="service-cta-4">
            Cotizar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </li>

      </ul>
    </div>
  </section>

  {/* ═══════════════ NOSOTROS ═══════════════ */}
  <section className="section trust-section" id="nosotros">
    <div className="container trust-container">
      <div className="trust-visual">
        <div className="trust-img-wrap">
          <img src="/img/construccion/fachada-1.jpg" alt="Proyecto residencial terminado — MHG Arquitectos" className="trust-img" loading="lazy" />
        </div>
        <div className="trust-badge-card">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <div>
            <strong>+1,500</strong>
            <span>seguidores</span>
          </div>
        </div>
      </div>
      <div className="trust-content">
        <span className="section-label">Quiénes somos</span>
        <h2 className="section-title">6 años y medio<br/>construyendo confianza</h2>
        <div className="trust-divider"></div>
        <p className="trust-text">
          MHG Arquitectos nació con la visión de ofrecer diseño de calidad al alcance de familias y negocios en Veracruz. Desde nuestros inicios hemos documentado cada etapa de cada proyecto.
        </p>
        <p className="trust-text">
          En más de <strong>6 años y medio</strong> de trayectoria hemos completado proyectos de construcción, cocinas integrales, mobiliario e interiorismo en Fortín de las Flores y Tuxtepec.
        </p>
        <div className="trust-stats">
          <div>
            <span className="trust-stat-num">6.5</span>
            <span className="trust-stat-label">Años de experiencia</span>
          </div>
          <div>
            <span className="trust-stat-num">2</span>
            <span className="trust-stat-label">Sucursales en Veracruz</span>
          </div>
          <div>
            <span className="trust-stat-num">+1.5K</span>
            <span className="trust-stat-label">Seguidores en redes</span>
          </div>
        </div>
        <a href="https://wa.me/5212711055612?text=Hola%2C%20quisiera%20platicar%20sobre%20mi%20proyecto%20con%20MHG%20Arquitectos." className="btn btn-primary" target="_blank" rel="noopener noreferrer" id="trust-whatsapp-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Platicar sobre mi proyecto
        </a>
      </div>
    </div>
  </section>

  {/* ═══════════════ SUCURSALES ═══════════════ */}
  <section className="section branches-section" id="sucursales">
    <div className="container">
      <div className="section-header">
        <span className="section-label">Dónde estamos</span>
        <h2 className="section-title">Nuestras Sucursales</h2>
        <p className="section-desc">Presencia en dos ciudades de Veracruz para atenderte mejor.</p>
      </div>
      <div className="branches-grid">

        <div className="branch-card branch-card--main" id="branch-fortin">
          <div className="branch-header">
            <div className="branch-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <span className="branch-tag">Sede principal</span>
              <h3 className="branch-city">Fortín de las Flores</h3>
            </div>
          </div>
          <div className="branch-body">
            <p className="branch-address">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Av 2 Ote. 505, Centro, Fortín de las Flores, Ver.
            </p>
            <p className="branch-phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.0 1.19 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              271 704 1499
            </p>
            <div className="branch-actions">
              <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20encuentro%20en%20Fort%C3%ADn%20de%20las%20Flores%20y%20quisiera%20informaci%C3%B3n%20sobre%20sus%20servicios." className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" id="branch-wa-fortin">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Fortín
              </a>
              <a href="https://maps.app.goo.gl/yDzXWv3kr93pRYJS7" className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" id="branch-map-fortin">
                Ver en mapa
              </a>
            </div>
          </div>
          <div className="branch-map" id="branch-map-fortin-wrap">
            <div className="map-placeholder" data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d-96.9918519!3d18.9011673!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c4e59a2781fd2b%3A0x57ccc75dd8048371!2sMHG%20Arquitectos!5e0!3m2!1ses-419!2smx!4v1700000000000!5m2!1ses-419!2smx">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Fortín de las Flores</span>
              <small>Clic para abrir el mapa</small>
            </div>
          </div>
        </div>

        <div className="branch-card" id="branch-tuxtepec">
          <div className="branch-header">
            <div className="branch-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <span className="branch-tag">Sucursal</span>
              <h3 className="branch-city">Tuxtepec, Oaxaca</h3>
            </div>
          </div>
          <div className="branch-body">
            <p className="branch-address">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Tuxtepec, Oaxaca — zona frontera Veracruz
            </p>
            <p className="branch-note">Atendemos proyectos en Tuxtepec y zona conurbada.</p>
            <div className="branch-actions">
              <a href="https://wa.me/5212711055612?text=Hola%2C%20estoy%20en%20Tuxtepec%20y%20quisiera%20informaci%C3%B3n%20sobre%20sus%20servicios%20en%20mi%20zona." className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" id="branch-wa-tuxtepec">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Tuxtepec
              </a>
              <a href="https://maps.app.goo.gl/WbCFJu8TXqUyKoir7" className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" id="branch-map-tuxtepec">
                Ver en mapa
              </a>
            </div>
          </div>
          <div className="branch-map" id="branch-map-tuxtepec-wrap">
            <div className="map-placeholder" data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d-96.1324432!3d18.0864067!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c3e7498847cb5d%3A0x13e68b73d9e99253!2sMobiliario%20y%20Cocinas%20MHG%20Arquitectos!5e0!3m2!1ses-419!2smx!4v1700000000000!5m2!1ses-419!2smx">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Tuxtepec, Oaxaca</span>
              <small>Clic para abrir el mapa</small>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  {/* ═══════════════ CONTACTO ═══════════════ */}
  <section className="section contact-section" id="contacto">
    <div className="container">
      <div className="section-header">
        <span className="section-label">Contáctanos</span>
        <h2 className="section-title">¿Listo para comenzar<br/>tu proyecto?</h2>
        <p className="section-desc">Escríbenos y con gusto te asesoramos sin compromiso.</p>
      </div>

      <div className="contact-grid">
        <div className="contact-info">

          <div className="contact-card" id="contact-wa">
            <div className="contact-icon contact-icon--green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </div>
            <div className="contact-detail">
              <span className="contact-label">WhatsApp</span>
              <a href="https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20conocer%20m%C3%A1s%20sobre%20sus%20servicios." className="contact-value contact-link" target="_blank" rel="noopener noreferrer" id="contact-wa-link">+52 271 105 5612</a>
            </div>
          </div>

          <div className="contact-card" id="contact-email">
            <div className="contact-icon contact-icon--dark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div className="contact-detail">
              <span className="contact-label">Correo electrónico</span>
              <a href="mailto:mhgarq1@gmail.com" className="contact-value contact-link" id="contact-email-link">mhgarq1@gmail.com</a>
            </div>
          </div>

          <div className="contact-card" id="contact-location">
            <div className="contact-icon contact-icon--dark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div className="contact-detail">
              <span className="contact-label">Sucursales</span>
              <span className="contact-value">Fortín de las Flores · Tuxtepec</span>
            </div>
          </div>

          <div className="social-row">
            <span className="social-label">Síguenos</span>
            <div className="social-links">
              <a href="https://www.instagram.com/mhgarquitectos/" className="social-btn" target="_blank" rel="noopener noreferrer" id="contact-instagram-btn" aria-label="Instagram MHG Arquitectos">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                Instagram
              </a>
              <a href="https://www.facebook.com/p/MHG-Arquitectos-100063646684954/" className="social-btn" target="_blank" rel="noopener noreferrer" id="contact-facebook-btn" aria-label="Facebook MHG Arquitectos">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
            </div>
          </div>

          <div className="contact-cta-wrap">
            <a href="https://wa.me/5212711055612?text=Hola%2C%20quisiera%20iniciar%20mi%20proyecto%20con%20MHG%20Arquitectos." className="btn btn-primary btn-full" target="_blank" rel="noopener noreferrer" id="contact-cta-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Iniciar mi proyecto
            </a>
          </div>

        </div>
      </div>
    </div>
  </section>

  
  </>);
}
