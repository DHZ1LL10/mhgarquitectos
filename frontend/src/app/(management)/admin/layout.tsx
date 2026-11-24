import type { Metadata } from "next";
export const metadata: Metadata = { title: "Administración | MHG Arquitectos", description: "Panel administrativo de MHG Arquitectos.", robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
