// Reports figures for a resolved period (lib/periods.js), from the sample series.

import { buckets, changePct, daysIn, sum } from "./series";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COUNTRY_SHARES = [
  ["United States", 0.41],
  ["Canada", 0.195],
  ["United Kingdom", 0.175],
  ["Germany", 0.12],
  ["Australia", 0.1],
];

const money = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const compact = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}K` : Math.round(n).toLocaleString("en-US");
/** "rose 12%" / "fell 3%" / "held steady" from a "+12%" style change. */
function movement(change, up, down, flat) {
  const n = Number.parseFloat(change);
  if (Math.abs(n) < 1) return flat;
  return `${n > 0 ? up : down} ${Math.abs(n)}%`;
}

const short = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

function totals(days) {
  const t = { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0, google: {}, meta: {} };
  for (const key of ["spend", "revenue", "impressions", "clicks", "conversions"]) {
    t.google[key] = sum(days, (d) => d.google[key]);
    t.meta[key] = sum(days, (d) => d.meta[key]);
    t[key] = t.google[key] + t.meta[key];
  }
  return t;
}

/** Chart points: names for the tooltip, short labels for the axis. */
function revenueSeries(days) {
  const groups = buckets(days);
  const daily = groups.every((g) => g.length === 1);
  const weekday = daily && groups.length <= 7;
  return {
    compare: daily ? "day" : groups[0].length >= 28 ? "month" : "week",
    labels: groups.map((g) => (weekday ? WEEKDAYS[g[0].date.getDay()].slice(0, 3) : short(g[0].date))),
    names: groups.map((g) =>
      daily
        ? g[0].date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
        : `${short(g[0].date)} – ${short(g.at(-1).date)}`,
    ),
    google: groups.map((g) => Math.round(sum(g, (d) => d.google.revenue))),
    meta: groups.map((g) => Math.round(sum(g, (d) => d.meta.revenue))),
  };
}

export function reportFor(range) {
  const now = daysIn(range.from, range.to);
  const before = daysIn(range.prevFrom, range.prevTo);
  const t = totals(now);
  const p = totals(before);
  const vs = range.compareLabel;

  // Platform efficiency: ROAS (revenue ÷ spend) and CPA (spend ÷ conversions).
  const roas = (x) => x.revenue / x.spend;
  const cpa = (x) => x.spend / x.conversions;
  const metaRoasChange = changePct(roas(t.meta), roas(p.meta), 0);
  const googleRoasChange = changePct(roas(t.google), roas(p.google), 0);
  const googleCpaChange = changePct(cpa(t.google), cpa(p.google), 0);
  const metaCpaChange = changePct(cpa(t.meta), cpa(p.meta), 0);
  const strong = roas(t.meta) >= roas(t.google) ? "Meta" : "Google";
  const weak = strong === "Meta" ? "Google" : "Meta";
  const weakCpaChange = weak === "Google" ? googleCpaChange : metaCpaChange;

  // Best weekday by total revenue (only meaningful with at least a week of data).
  const byWeekday = WEEKDAYS.map((_, i) => sum(now.filter((d) => d.date.getDay() === i), (d) => d.google.revenue + d.meta.revenue));
  const bestDay = WEEKDAYS[byWeekday.indexOf(Math.max(...byWeekday))];
  const period = range.custom ? `from ${range.label}` : `over ${range.label}`;

  const revenueChange = Number.parseFloat(changePct(t.revenue, p.revenue));
  const metaTop = { spend: t.meta.spend * 0.42, revenue: t.meta.revenue * 0.45, conversions: t.meta.conversions * 0.45 };

  return {
    compareTo: vs,
    kpis: [
      ["Total Spend", money(t.spend), changePct(t.spend, p.spend)],
      ["Revenue", money(t.revenue), changePct(t.revenue, p.revenue)],
      ["ROAS", `${roas(t).toFixed(1)}×`, changePct(roas(t), roas(p))],
      ["Impressions", compact(t.impressions), changePct(t.impressions, p.impressions)],
      ["Conversions", Math.round(t.conversions).toLocaleString("en-US"), changePct(t.conversions, p.conversions)],
      ["Clicks", Math.round(t.clicks).toLocaleString("en-US"), changePct(t.clicks, p.clicks)],
    ],
    revenue: revenueSeries(now),
    insight:
      `${strong} delivered the stronger ROAS ${period} (${roas(t[strong.toLowerCase()]).toFixed(1)}×, ` +
      `${movement(strong === "Meta" ? metaRoasChange : googleRoasChange, "up", "down", "flat")} vs the ${vs}), while ${weak}'s cost per ` +
      `acquisition ${movement(weakCpaChange, "rose", "fell", "held steady")}.` +
      (range.days >= 7 ? ` ${bestDay}s brought in the most revenue overall.` : ""),
    topPerformer: `${strong} ROAS ${roas(t[strong.toLowerCase()]).toFixed(1)}× (${movement(strong === "Meta" ? metaRoasChange : googleRoasChange, "up", "down", "flat")})`,
    underperforming: `${weak} cost per acquisition $${cpa(t[weak.toLowerCase()]).toFixed(2)} (${movement(weakCpaChange, "up", "down", "flat")})`,
    suggestion:
      `Reallocate about 10% of spend from ${weak} to ${strong}, where each dollar currently returns ` +
      `${roas(t[strong.toLowerCase()]).toFixed(1)}× instead of ${roas(t[weak.toLowerCase()]).toFixed(1)}×. ` +
      (range.days >= 7 ? `Schedule your strongest creative for ${bestDay}s, then ` : "") +
      `recheck ${weak}'s cost per acquisition after the next ${range.days} days.`,
    countries: COUNTRY_SHARES.map(([name, share]) => ({
      name,
      Revenue: Math.round(t.revenue * share),
      Conversions: Math.round(t.conversions * share),
    })),
    campaign: {
      name: "Meta · Prospecting",
      bars: [0.48, 0.84, 0.59, 0.76, 0.51, 0.68].map((b, i) => Math.round(b * 100 * (0.92 + ((range.days + i * 7) % 9) / 50))),
      spend: money(metaTop.spend),
      revenue: money(metaTop.revenue),
      conversions: Math.round(metaTop.conversions).toLocaleString("en-US"),
      roas: `${(metaTop.revenue / metaTop.spend).toFixed(1)}×`,
    },
    score: {
      value: Math.max(20, Math.min(95, Math.round(55 + revenueChange * 1.5))),
      note:
        `You earned ${money(t.revenue)} ${period}, ` +
        `${revenueChange >= 0 ? "outperforming" : "trailing"} the ${vs} by ${Math.abs(revenueChange)}%.`,
    },
  };
}
