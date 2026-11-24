"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { publicSite } from "@/config/public-site";
import { serviceQuotes, type ServiceKey } from "@/data/service-quotes";
import { buildQuoteMessage } from "@/data/quote-message";

const inputStyle: CSSProperties = { width: "100%", background: "#111", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "11px 13px", color: "#f0f0f0", fontFamily: "Inter,sans-serif", fontSize: ".88rem", outline: "none", transition: "border-color .2s,box-shadow .2s", boxSizing: "border-box" };
const labelStyle: CSSProperties = { display: "block", fontSize: ".75rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 };
const selectStyle: CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 };

export default function ServiceQuoteModal() {
  const [service, setService] = useState<ServiceKey | null>(null);
  const [minimumDate, setMinimumDate] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (box.current) { box.current.style.transform = "translateY(20px)"; box.current.style.opacity = "0"; }
    timers.current.push(setTimeout(() => { setService(null); closing.current = false; }, 280));
  }, []);

  useEffect(() => {
    const open = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-quote-service]") : null;
      const key = target?.dataset.quoteService;
      if (!key || !Object.hasOwn(serviceQuotes, key)) return;
      timers.current.forEach(clearTimeout); timers.current = []; closing.current = false;
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      setMinimumDate(tomorrow.toISOString().split("T")[0]); setService(key as ServiceKey);
    };
    document.addEventListener("click", open);
    return () => { document.removeEventListener("click", open); timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (!service) return;
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const element = box.current;
    if (element) { element.style.transform = "translateY(20px)"; element.style.opacity = "0"; }
    const frame = requestAnimationFrame(() => { if (element) { element.style.transform = "translateY(0)"; element.style.opacity = "1"; } });
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", escape);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", escape); document.body.style.overflow = overflow; };
  }, [service, close]);

  const config = service ? serviceQuotes[service] : null;
  const submit = () => {
    if (!service || !config) return;
    const values: Record<string, string> = {};
    for (const field of config.fields) {
      const element = document.getElementById(field.id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      values[field.id] = element?.value.trim() || "";
      if (field.required && !values[field.id]) {
        element?.focus();
        if (element) {
          element.style.borderColor = "#e74c3c"; element.style.boxShadow = "0 0 0 3px rgba(231,76,60,.15)";
          timers.current.push(setTimeout(() => { element.style.borderColor = "rgba(255,255,255,.07)"; element.style.boxShadow = "none"; }, 2500));
        }
        alert(`Por favor completa el campo: "${field.label}"`); return;
      }
    }
    window.open(`https://wa.me/${publicSite.quotesWhatsApp}?text=${encodeURIComponent(buildQuoteMessage(service, values))}`, "_blank");
    close();
  };

  return <div id="modal-overlay" style={{ display: service ? "block" : "none", position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)", overflowY: "auto", animation: "mhgModalIn .2s ease" }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
    <div ref={box} id="modal-box" style={{ background: "#0f0f0f", border: "1px solid rgba(46,204,113,.2)", borderRadius: 20, maxWidth: 620, width: "90%", margin: "40px auto", position: "relative", overflow: "hidden", transition: "transform .3s cubic-bezier(.4,0,.2,1), opacity .3s ease" }}>
      <div style={{ height: 4, background: "linear-gradient(90deg,#1a7a43,#2ecc71)" }} />
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div id="modal-icon" style={{ fontSize: "2rem", marginBottom: 8 }}>{config?.icon}</div>
          <h2 id="modal-title" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", fontWeight: 400, color: "#f0f0f0", marginBottom: 4 }}>{config?.title || "Cotización"}</h2>
          <p id="modal-subtitle" style={{ fontSize: ".85rem", color: "#888" }}>{config?.subtitle || "Completa el formulario para recibir tu cotización personalizada."}</p>
        </div>
        <button onClick={close} aria-label="Cerrar cotización" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#888", width: 36, height: 36, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }} onMouseOver={e => { e.currentTarget.style.color = "#fff"; }} onMouseOut={e => { e.currentTarget.style.color = "#888"; }}>✕</button>
      </div>
      <div style={{ padding: "24px 32px 32px" }}>
        <div id="modal-form-content" key={service}>
          {config && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{config.fields.map(field => {
            const full = field.type === "textarea" || /notas|municipio|dir/.test(field.id);
            const props = { id: field.id, style: field.type === "select" ? selectStyle : inputStyle,
              onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "#2ecc71"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(46,204,113,.15)"; },
              onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.boxShadow = "none"; } };
            return <div key={field.id} style={full ? { gridColumn: "1 / -1" } : undefined}>
              <label htmlFor={field.id} style={labelStyle}>{field.label}{field.required ? " *" : ""}</label>
              {field.type === "select" ? <select {...props} defaultValue=""><option value="" disabled>— Selecciona —</option>{field.options?.map(option => <option key={option} value={option}>{option}</option>)}</select>
                : field.type === "textarea" ? <textarea {...props} rows={3} placeholder={field.placeholder || ""} />
                : <input {...props} type={field.type} placeholder={field.placeholder || ""} min={field.type === "date" ? minimumDate : undefined} />}
            </div>;
          })}</div>}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={close} style={{ flex: 1, background: "transparent", border: "1.5px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#888", padding: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: ".9rem", transition: "all .2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "#2ecc71"; e.currentTarget.style.color = "#2ecc71"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "#888"; }}>Cancelar</button>
          <button onClick={submit} style={{ flex: 2, background: "#2ecc71", color: "#000", border: "none", borderRadius: 8, padding: "12px 24px", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: ".9rem", fontWeight: 700, transition: "all .2s" }} onMouseOver={e => { e.currentTarget.style.background = "#27ae60"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseOut={e => { e.currentTarget.style.background = "#2ecc71"; e.currentTarget.style.transform = "translateY(0)"; }}>Enviar cotización por WhatsApp</button>
        </div>
      </div>
    </div>
  </div>;
}
