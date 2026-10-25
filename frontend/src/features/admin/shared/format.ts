export function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "Sin confirmar";
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-MX", { dateStyle: "medium" });
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export function effectiveAppointmentDate(item: { requested_datetime: string; confirmed_datetime: string | null }): Date {
  return new Date(item.confirmed_datetime || item.requested_datetime);
}

export function isToday(date: Date, now = new Date()): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function startOfWeek(date = new Date()): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day);
  return result;
}

export function currency(value: string, code: string): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("es-MX", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(amount) : `${value} ${code}`;
}
