import { NextResponse } from "next/server";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

function apiBaseUrl(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return "";
    return url.href.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function GET() {
  const config = {
    apiBaseUrl: apiBaseUrl(process.env.CUSTOMIZER_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL),
    whatsappNumber: site.quotesWhatsApp,
  };
  return new NextResponse(`window.MHG_CUSTOMIZER_CONFIG = Object.freeze(${JSON.stringify(config)});`, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
