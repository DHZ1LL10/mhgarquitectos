import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>
    {/* Keep the original CSS and fonts during the visual migration. */}
    <link rel="stylesheet" href="/style.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    {/* eslint-disable-next-line @next/next/no-page-custom-font */}
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <SiteHeader />
    {children}
    <SiteFooter />
    <FloatingWhatsApp />
  </>;
}
