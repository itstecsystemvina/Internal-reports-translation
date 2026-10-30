import type { Lang } from "@/lib/i18n";

// All dates are calculated in Vietnam time (UTC+7, no daylight saving).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS: Record<Lang, string[]> = {
  vi: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  ko: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
};

/** "Thứ 6" / "금요일" (0 = Sunday … 6 = Saturday). */
export const weekdayName = (day: number, lang: Lang = "vi") => WEEKDAYS[lang][day];

/** "T6" / "CN" / "금". */
export const weekdayShort = (day: number, lang: Lang = "vi") =>
  lang === "ko" ? WEEKDAYS.ko[day][0] : day === 0 ? "CN" : `T${day + 1}`;

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

/** Day and month: "23/10" in Vietnamese, "10/23" in Korean. */
export function shortDate(dateStr: string, lang: Lang = "vi") {
  const d = parseISODate(dateStr);
  return lang === "ko" ? `${d.getUTCMonth() + 1}/${d.getUTCDate()}` : `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** "20/10 – 26/10/2026" / "2026년 10/20 – 10/26" */
export function weekRangeLabel(weekStart: string, lang: Lang = "vi") {
  const end = addDays(weekStart, 6);
  return lang === "ko"
    ? `${end.slice(0, 4)}년 ${shortDate(weekStart, lang)} – ${shortDate(end, lang)}`
    : `${shortDate(weekStart)} – ${shortDate(end)}/${end.slice(0, 4)}`;
}

/** "23/10 · 14:32" / "10/23 · 14:32" in Vietnam time (no weekday), for compact cells. */
export function formatSubmittedShort(date: Date | string, lang: Lang = "vi") {
  const d = new Date(new Date(date).getTime() + VN_OFFSET_MS);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${shortDate(toISODate(d), lang)} · ${hh}:${mm}`;
}

/** "Thứ 5, 23/10 · 14:32" / "10/23(목) 14:32" in Vietnam time. */
export function formatSubmitted(date: Date | string, lang: Lang = "vi") {
  const d = new Date(new Date(date).getTime() + VN_OFFSET_MS);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const day = d.getUTCDay();
  return lang === "ko"
    ? `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${weekdayShort(day, lang)}) ${hh}:${mm}`
    : `${WEEKDAYS.vi[day]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1} · ${hh}:${mm}`;
}

/** The moment a week's report is due: dueDay of that week at dueTime ("HH:MM"), Vietnam time. */
export function deadlineAt(weekStart: string, dueDay: number, dueTime: string) {
  const [h, m] = dueTime.split(":").map(Number);
  return new Date(parseISODate(dayInWeek(weekStart, dueDay)).getTime() + (h * 60 + m) * 60_000 - VN_OFFSET_MS);
}

/** "2 ngày 3 giờ", "3 giờ 20 phút" / "2일 3시간": the two largest units of a duration. */
export function formatDuration(ms: number, lang: Lang = "vi") {
  const total = Math.max(1, Math.floor(Math.abs(ms) / 60_000));
  const [day, hour, minute] = lang === "ko" ? ["일", "시간", "분"] : [" ngày", " giờ", " phút"];
  const parts = [
    [Math.floor(total / 1440), day],
    [Math.floor((total % 1440) / 60), hour],
    [total % 60, minute],
  ] as const;
  const first = parts.findIndex(([n]) => n > 0);
  return parts
    .slice(first, first + 2)
    .filter(([n]) => n > 0)
    .map(([n, unit]) => `${n}${unit}`)
    .join(" ");
}

/** Whole days from today (Vietnam) until dateStr; negative if past. */
export function daysUntil(dateStr: string, now = new Date()) {
  return Math.round((parseISODate(dateStr).getTime() - parseISODate(todayVN(now)).getTime()) / DAY_MS);
}
