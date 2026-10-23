// All dates are calculated in Vietnam time (UTC+7, no daylight saving).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAYS_VI = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function parseISODate(s: string) {
  return new Date(`${s}T00:00:00Z`);
}

/** Today's date in Vietnam, as YYYY-MM-DD. */
export function todayVN(now = new Date()) {
  return toISODate(new Date(now.getTime() + VN_OFFSET_MS));
}

/** Monday of the week containing the given date. */
export function mondayOf(dateStr: string) {
  const d = parseISODate(dateStr);
  const day = d.getUTCDay();
  return toISODate(new Date(d.getTime() - ((day + 6) % 7) * DAY_MS));
}

export function currentWeekStart(now = new Date()) {
  return mondayOf(todayVN(now));
}

export function addDays(dateStr: string, n: number) {
  return toISODate(new Date(parseISODate(dateStr).getTime() + n * DAY_MS));
}

export function addWeeks(weekStart: string, n: number) {
  return addDays(weekStart, n * 7);
}

/** The date in the given week that falls on `weekday` (0 = Sunday … 6 = Saturday). */
export function dayInWeek(weekStart: string, weekday: number) {
  return addDays(weekStart, (weekday + 6) % 7);
}

export function isValidWeekStart(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && mondayOf(s) === s;
}

/** ISO week number. */
export function weekNumber(weekStart: string) {
  const thursday = parseISODate(addDays(weekStart, 3));
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / DAY_MS + 1) / 7);
}

export function shortDate(dateStr: string) {
  const d = parseISODate(dateStr);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** "20/10 – 26/10/2026" */
export function weekRangeLabel(weekStart: string) {
  const end = addDays(weekStart, 6);
  return `${shortDate(weekStart)} – ${shortDate(end)}/${end.slice(0, 4)}`;
}

/** "Thứ 5, 23/10 · 14:32" in Vietnam time. */
export function formatSubmitted(date: Date | string) {
  const d = new Date(new Date(date).getTime() + VN_OFFSET_MS);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${WEEKDAYS_VI[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1} · ${hh}:${mm}`;
}

/** Whole days from today (Vietnam) until dateStr; negative if past. */
export function daysUntil(dateStr: string, now = new Date()) {
  return Math.round((parseISODate(dateStr).getTime() - parseISODate(todayVN(now)).getTime()) / DAY_MS);
}
