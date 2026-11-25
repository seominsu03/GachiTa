// Accept any minute in Korean local 24-hour time; never round departure time.
export function normalizeDepartureTime(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim()) ?? /^(\d{2})(\d{2})$/.exec(value.trim());
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return match[1].padStart(2, '0') + ':' + match[2];
}
