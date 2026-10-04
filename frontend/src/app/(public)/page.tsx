import type { Metadata } from "next";
import HomeSections from "@/components/site/HomeSections";

export const metadata: Metadata = {
  title: "MHG Arquitectos | Diseño, Construcción y Mobiliario — Fortín de las Flores, Veracruz",
  description: "MHG Arquitectos: Diseño y construcción, cocinas integrales, mobiliario general e interiorismo en Fortín de las Flores y Tuxtepec, Veracruz. Más de 6 años de experiencia.",
  keywords: "arquitectos veracruz, cocinas integrales fortín, mobiliario veracruz, interiorismo, construcción residencial, fortín de las flores, tuxtepec",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MHG Arquitectos | Diseñamos. Construimos. Equipamos.",
    description: "Diseño y construcción, cocinas integrales, mobiliario e interiorismo en Fortín de las Flores y Tuxtepec.",
    type: "website", locale: "es_MX", url: "/", images: ["/img/fachada-frente.jpg"],
  },
  twitter: { card: "summary_large_image", title: "MHG Arquitectos | Diseñamos. Construimos. Equipamos.", images: ["/img/fachada-frente.jpg"] },
};

export default function Home() { return <HomeSections />; }
