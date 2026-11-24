// Sample daily marketing figures for Overview and Reports, until real ad, analytics and
// competitor data is connected. Each day's numbers come from a hash of its date, so
// they're the same on every visit and every device, and any date range can be added up.
// When real data arrives, replace dayFigures() with a lookup; the totals logic stays.

import { addDays } from "../calendarDates";

const BASE = Date.UTC(2025, 0, 1);
const dayNumber = (d) => Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - BASE) / 86400000);

/** Deterministic 0–1 value for a key (FNV-1a hash + mulberry32 mix). */
function rand(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = (h + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const jitter = (key, spread) => 1 + (rand(key) * 2 - 1) * spread;

// Weekday shape, Sunday first. Meta peaks on Thursday; Google dips at weekends.
const META_WEEK = [0.9, 0.85, 0.95, 1.05, 1.35, 1.1, 1.0];
const GOOGLE_WEEK = [0.8, 1.05, 1.1, 1.05, 1.0, 1.0, 0.85];

export const COMPETITORS = [
  { name: "GuestSupply", perDay: 1.4, growth: 0.5 },
  { name: "Out of Eden", perDay: 4, growth: 0.15 },
  { name: "Hotel Buyer", perDay: 3.3, growth: -0.1 },
];

export const CHANNELS = [
  { key: "instagram", name: "Instagram", icon: "instagram", reach: 9000, growth: 0.5 },
  { key: "facebook", name: "Facebook", icon: "message", reach: 6000, growth: -0.25 },
  { key: "tiktok", name: "TikTok", icon: "video", reach: 4000, growth: 0.3 },
];

function platform(k, prefix, f, base) {
  return {
    spend: base.spend * f * jitter(k + prefix + "s", 0.08),
    revenue: base.revenue * f * jitter(k + prefix + "r", 0.16),
    impressions: base.impressions * f * jitter(k + prefix + "i", 0.1),
    clicks: base.clicks * f * jitter(k + prefix + "c", 0.12),
    conversions: base.conversions * f * jitter(k + prefix + "v", 0.15),
  };
}

/** Everything for one calendar day. */
export function dayFigures(date) {
  const n = dayNumber(date);
  const k = String(n);
  const year = n / 365;
  const trend = 1 + 0.3 * year;
  const month = date.getMonth();
  const season = month === 10 ? 1.12 : month === 11 ? 1.2 : month === 0 ? 0.88 : 1;
  const wd = date.getDay();

  return {
    date,
    google: platform(k, "g", trend * season * GOOGLE_WEEK[wd], { spend: 850, revenue: 5200, impressions: 150000, clicks: 7500, conversions: 480 }),
    meta: platform(k, "m", trend * season * META_WEEK[wd], { spend: 950, revenue: 7400, impressions: 210000, clicks: 8500, conversions: 590 }),
    interest: 80 + 7 * Math.sin((n / 45) * 2 * Math.PI) + (rand(k + "in") * 2 - 1) * 3,
    // Public posts mentioning the business's keywords (drives "Interest in your topics").
    topicPosts: 75 * trend * (1 + 0.12 * Math.sin((n / 45) * 2 * Math.PI)) * jitter(k + "tp", 0.25),
    newMembers: 14 * trend * jitter(k + "nm", 0.4),
    engagement: 21 + 2.5 * Math.sin((n / 30) * 2 * Math.PI + 1) + (rand(k + "en") * 2 - 1) * 1.5,
    competitorPosts: Object.fromEntries(
      COMPETITORS.map((c, i) => [c.name, c.perDay * (1 + c.growth * year) * jitter(k + "cp" + i, 0.6)]),
    ),
    channels: Object.fromEntries(
      CHANNELS.map((c) => {
        const reach = c.reach * (1 + c.growth * year) * jitter(k + c.key + "r", 0.12);
        return [c.key, { reach, interactions: reach * 0.06 * jitter(k + c.key + "x", 0.2) }];
      }),
    ),
  };
}

/** One entry per day from `from` to `to`, inclusive. */
export function daysIn(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(dayFigures(d));
  return out;
}

export const sum = (days, pick) => days.reduce((total, d) => total + pick(d), 0);
export const avg = (days, pick) => (days.length ? sum(days, pick) / days.length : 0);

/** "+12.5%" style change from `before` to `now`. */
export function changePct(now, before, digits = 1) {
  if (!before) return "+0%";
  const p = ((now - before) / before) * 100;
  const rounded = Math.round(p * 10 ** digits) / 10 ** digits;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

/**
 * Split days into at most ~13 chart points: daily up to a month, then near-equal
 * blocks (about a week each up to ~4 months, about a month each beyond).
 */
export function buckets(days) {
  if (days.length <= 31) return days.map((d) => [d]);
  const size = days.length <= 124 ? 7 : 30;
  const count = Math.ceil(days.length / size);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(days.slice(Math.round((i * days.length) / count), Math.round(((i + 1) * days.length) / count)));
  }
  return out;
}
