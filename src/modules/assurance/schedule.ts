export const scheduleTypes = ["Monthly", "Quarterly", "Annual", "Business day", "Interval-based", "Event-triggered"] as const;
export type Schedule = {
  type: string; day: number; quarterMonth: number; month: number; businessDay: number;
  interval: number; anchor: string; event: string; offset: number; cutoff: string; timezone: string; effective: string;
};
export const initialSchedule: Schedule = {
  type: "Monthly", day: 5, quarterMonth: 1, month: 6, businessDay: 3,
  interval: 2, anchor: "2026-06-05", event: "", offset: 5, cutoff: "17:00", timezone: "America/New_York", effective: "2026-06-01",
};
const parseDate = (value: string) => new Date(`${value}T00:00:00Z`);
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parseDate(value).getTime()) && parseDate(value).toISOString().slice(0,10) === value;
export function scheduleError(s: Schedule): string {
  if (!validDate(s.effective)) return "Choose a valid effective date.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.cutoff)) return "Choose a cutoff time.";
  if (s.type === "Event-triggered") {
    if (!s.event.trim()) return "Describe the event that creates an obligation.";
    if (!Number.isInteger(s.offset) || s.offset < 0 || s.offset > 365) return "Enter a deadline offset between 0 and 365 calendar days.";
  } else if (s.type === "Interval-based") {
    if (!validDate(s.anchor)) return "Choose a valid first due date.";
    if (!Number.isInteger(s.interval) || s.interval < 1 || s.interval > 120) return "Enter an interval between 1 and 120 months.";
  } else if (s.type === "Business day") {
    if (!Number.isInteger(s.businessDay) || s.businessDay < 1 || s.businessDay > 23) return "Choose a business day between 1 and 23.";
  } else if (!Number.isInteger(s.day) || s.day < 1 || s.day > 31) return "Choose a due day between 1 and 31.";
  return "";
}
// UTC represents the selected local calendar date; the cutoff uses the chosen time zone.
export function occurrenceDates(s: Schedule): string[] {
  if (scheduleError(s) || s.type === "Event-triggered") return [];
  const effective = parseDate(s.effective);
  const result: string[] = [];
  const anchor = parseDate(s.anchor);
  const start = s.type === "Interval-based" ? anchor : new Date(Date.UTC(effective.getUTCFullYear(), effective.getUTCMonth(), 1));
  for (let i = 0; i < 2400 && result.length < 3; i++) {
    const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const m = month.getUTCMonth();
    if (s.type === "Quarterly" && m % 3 !== s.quarterMonth - 1) continue;
    if (s.type === "Annual" && m !== s.month - 1) continue;
    if (s.type === "Interval-based" && i % s.interval !== 0) continue;
    const lastDay = new Date(Date.UTC(month.getUTCFullYear(), m + 1, 0)).getUTCDate();
    let day = Math.min(s.type === "Interval-based" ? anchor.getUTCDate() : s.day, lastDay);
    if (s.type === "Business day") {
      let count = 0;
      for (day = 1; day <= lastDay; day++) {
        const weekday = new Date(Date.UTC(month.getUTCFullYear(), m, day)).getUTCDay();
        if (weekday !== 0 && weekday !== 6) count++;
        if (count === s.businessDay) break;
      }
      if (day > lastDay) continue;
    }
    const date = new Date(Date.UTC(month.getUTCFullYear(), m, day));
    if (date >= effective) result.push(date.toISOString().slice(0, 10));
  }
  return result;
}
export const displayDate = (date: string) => parseDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
