import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración de demostración | MHG Arquitectos",
  description: "Demostración local de edición de propiedades. Sin autenticación ni persistencia.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
