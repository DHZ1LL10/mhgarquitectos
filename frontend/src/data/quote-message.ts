import { serviceQuotes, type ServiceKey } from "./service-quotes.ts";

export function buildQuoteMessage(key: ServiceKey, values: Record<string, string>) {
  const config = serviceQuotes[key];
  let message = `*COTIZACIÓN — ${config.title.toUpperCase()}*\n\n`;
  for (const field of config.fields) {
    const value = values[field.id]?.trim();
    if (value) message += `• *${field.label}:* ${value}\n`;
  }
  return message + "\n_Cotización enviada desde mhgarquitectos.com_";
}
