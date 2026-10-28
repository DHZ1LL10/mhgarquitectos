export const BUSINESS_TIME_ZONE = "America/Mexico_City";

type BusinessDateParts = {
  year: number;
  month: number;
  day: number;
};

type BusinessDateTimeParts = BusinessDateParts & {
  hour: number;
  minute: number;
  second: number;
};

const businessDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const businessDateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find(part => part.type === type)?.value;
  if (!value) throw new Error(`No se pudo obtener ${type} en ${BUSINESS_TIME_ZONE}`);
  return Number(value);
}

export function businessDateParts(date: Date): BusinessDateParts {
  const parts = businessDatePartsFormatter.formatToParts(date);
  return {
    year: numericPart(parts, "year"),
    month: numericPart(parts, "month"),
    day: numericPart(parts, "day"),
  };
}

function businessDateTimeParts(date: Date): BusinessDateTimeParts {
  const parts = businessDateTimePartsFormatter.formatToParts(date);
  return {
    year: numericPart(parts, "year"),
    month: numericPart(parts, "month"),
    day: numericPart(parts, "day"),
    hour: numericPart(parts, "hour"),
    minute: numericPart(parts, "minute"),
    second: numericPart(parts, "second"),
  };
}

export function businessDateKey(date: Date): string {
  const { year, month, day } = businessDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function businessCalendarDate(year: number, month: number, day: number): Date | null {
  const result = new Date(Date.UTC(year, month - 1, day, 12));
  if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month - 1 || result.getUTCDate() !== day) return null;
  return result;
}

export function addBusinessCalendarDays(date: Date, days: number): Date {
  const { year, month, day } = businessDateParts(date);
  return new Date(Date.UTC(year, month - 1, day + days, 12));
}

export function formatBusinessDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-MX", { ...options, timeZone: BUSINESS_TIME_ZONE }).format(date);
}

export function businessDateTimeInputValue(value: string | null): string {
  if (!value) return "";
  const parts = businessDateTimeParts(new Date(value));
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function businessDateTimeInputToIso(value: string): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Fecha de confirmación inválida");
  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const expected: BusinessDateTimeParts = {
    year: Number(yearValue),
    month: Number(monthValue),
    day: Number(dayValue),
    hour: Number(hourValue),
    minute: Number(minuteValue),
    second: 0,
  };
  const calendarDate = businessCalendarDate(expected.year, expected.month, expected.day);
  if (!calendarDate || expected.hour > 23 || expected.minute > 59) throw new Error("Fecha de confirmación inválida");

  const wallClockAsUtc = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute);
  let instant = wallClockAsUtc;
  for (let attempt = 0; attempt < 3; attempt++) {
    const observed = businessDateTimeParts(new Date(instant));
    const offset = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second) - instant;
    instant = wallClockAsUtc - offset;
  }
  const result = new Date(instant);
  const observed = businessDateTimeParts(result);
  if (Object.entries(expected).some(([key, expectedValue]) => observed[key as keyof BusinessDateTimeParts] !== expectedValue)) throw new Error("Fecha de confirmación inválida");
  return result.toISOString();
}

export function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: BUSINESS_TIME_ZONE }) : "Sin confirmar";
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-MX", { dateStyle: "medium", timeZone: BUSINESS_TIME_ZONE });
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIME_ZONE });
}

export function effectiveAppointmentDate(item: { requested_datetime: string; confirmed_datetime: string | null }): Date {
  return new Date(item.confirmed_datetime || item.requested_datetime);
}

export function isToday(date: Date, now = new Date()): boolean {
  return businessDateKey(date) === businessDateKey(now);
}

export function startOfWeek(date = new Date()): Date {
  const { year, month, day } = businessDateParts(date);
  const result = businessCalendarDate(year, month, day);
  if (!result) throw new Error("Fecha de agenda inválida");
  const weekday = (result.getUTCDay() + 6) % 7;
  result.setUTCDate(result.getUTCDate() - weekday);
  return result;
}

export function currency(value: string, code: string): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("es-MX", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(amount) : `${value} ${code}`;
}
