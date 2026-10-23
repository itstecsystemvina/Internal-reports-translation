/**
 * Formats typing into DD/MM as the user goes: "2110" → "21/10", "56" → "5/6".
 * A day starting with 4–9 or a month starting with 2–9 can only be one digit.
 */
export function formatDayMonth(raw: string) {
  const s = raw.replace(/[^\d/]/g, "");
  if (s.includes("/")) {
    const [d, m = ""] = s.split("/");
    return `${d.slice(0, 2)}/${m.slice(0, 2)}`;
  }
  const dayLen = /^[4-9]/.test(s) ? 1 : 2;
  const d = s.slice(0, dayLen);
  const rest = s.slice(dayLen);
  const m = rest.slice(0, /^[2-9]/.test(rest) ? 1 : 2);
  return m ? `${d}/${m}` : d;
}

/** Pads to DD/MM when complete: "5/6" → "05/06". Leaves incomplete input alone. */
export function padDayMonth(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(value);
  return match ? `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}` : value;
}

export function isValidDayMonth(value: string) {
  if (!value) return true;
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(value);
  if (!match) return false;
  const [d, m] = [Number(match[1]), Number(match[2])];
  return d >= 1 && d <= 31 && m >= 1 && m <= 12;
}

/** True when any task in the report has a date that isn't a valid DD/MM. */
export function hasInvalidDate(content: { currentWeek: { tasks: { date: string }[] }[]; nextWeek: { tasks: { date: string }[] }[] }) {
  return [...content.currentWeek, ...content.nextWeek].some((s) => s.tasks.some((t) => !isValidDayMonth(t.date)));
}
