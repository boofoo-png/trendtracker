// Date ranges for Overview and Reports: 7 / 30 / 90 days, or a custom From–To range.
// Plain functions (no React), so server code can use them too.

import { addDays, toISODate, fromISODate } from "./calendarDates";

export const PRESETS = ["7 days", "30 days", "90 days"];
export const CUSTOM = "Custom";
export const MAX_CUSTOM_DAYS = 365;
export const DEFAULT_PERIOD = { preset: "30 days" };

const fmt = (d, withYear) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });

/** "Nov 1 – 18", "Oct 20 – Nov 18" or "Dec 3, 2025 – Jan 9, 2026". */
export function rangeLabel(from, to) {
  const crossYear = from.getFullYear() !== to.getFullYear();
  if (crossYear) return `${fmt(from, true)} – ${fmt(to, true)}`;
  if (from.getMonth() === to.getMonth()) return `${fmt(from)} – ${to.getDate()}`;
  return `${fmt(from)} – ${fmt(to)}`;
}

/**
 * A stored period → concrete dates. Presets end today; custom ranges are clamped to
 * the past year. The comparison period is the same length, immediately before.
 */
export function resolvePeriod(period, today) {
  let from;
  let to = today;
  if (period?.preset === CUSTOM && period.from && period.to) {
    from = fromISODate(period.from);
    to = fromISODate(period.to);
    if (to > today) to = today;
    const earliest = addDays(today, -(MAX_CUSTOM_DAYS - 1));
    if (from < earliest) from = earliest;
    if (from > to) from = to;
  } else {
    const n = Number.parseInt(PRESETS.includes(period?.preset) ? period.preset : DEFAULT_PERIOD.preset, 10);
    from = addDays(today, -(n - 1));
  }
  const days = Math.round((to - from) / 86400000) + 1;
  const custom = period?.preset === CUSTOM;
  return {
    from,
    to,
    days,
    prevFrom: addDays(from, -days),
    prevTo: addDays(from, -1),
    custom,
    /** "the last 30 days" / "Nov 1 – 18" */
    label: custom ? rangeLabel(from, to) : `the last ${days} days`,
    /** "previous 30 days" */
    compareLabel: `previous ${days} ${days === 1 ? "day" : "days"}`,
    key: `${toISODate(from)}_${toISODate(to)}`,
  };
}
