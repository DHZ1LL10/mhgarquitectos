import type { Metadata } from "next";
import "./globals.css";
import { deployment, site } from "@/config/site";

export const metadata: Metadata = {
  title: "MHG Arquitectos",
  metadataBase: new URL(site.url),
  icons: { icon: "/img/logo.jpg" },
  robots: { index: deployment.publicIndexing, follow: deployment.publicIndexing },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
