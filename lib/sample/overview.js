// Overview card figures for a resolved period (lib/periods.js), from the sample series.

import { addDays } from "../calendarDates";
import { CHANNELS, COMPETITORS, avg, changePct, daysIn, sum } from "./series";

const fmtDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The two weekdays with the most revenue in the period, and the next date on one of them. */
function bestDays(days, today) {
  const totals = WEEKDAYS.map((_, i) =>
    sum(days.filter((d) => d.date.getDay() === i), (d) => d.google.revenue + d.meta.revenue),
  );
  const top = totals
    .map((total, i) => ({ total, i }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 2)
    .map((x) => x.i)
    .sort((a, b) => a - b);
  let next = addDays(today, 1);
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, i);
    if (top.includes(d.getDay())) {
      next = d;
      break;
    }
  }
  return { names: top.map((i) => WEEKDAYS[i]), next };
}

export function overviewFor(range, today) {
  const now = daysIn(range.from, range.to);
  const before = daysIn(range.prevFrom, range.prevTo);

  const topicNow = sum(now, (d) => d.topicPosts);
  const topicBefore = sum(before, (d) => d.topicPosts);
  const topicChange = changePct(topicNow, topicBefore);

  const membersNow = sum(now, (d) => d.newMembers);
  const engagementNow = avg(now, (d) => d.engagement);

  // Engagement bars: five slices of the period, scaled so small differences show.
  const slices = splitInto(now, Math.min(5, now.length));
  const sliceAvg = slices.map((s) => avg(s, (d) => d.engagement));
  const top = Math.max(...sliceAvg);
  const low = Math.min(...sliceAvg);
  const best = bestDays(now, today);

  return {
    competitors: COMPETITORS.map((c) => {
      const posts = sum(now, (d) => d.competitorPosts[c.name]);
      return {
        name: c.name,
        posts: Math.round(posts),
        change: changePct(posts, sum(before, (d) => d.competitorPosts[c.name])),
      };
    }),
    interest: {
      posts: Math.round(topicNow),
      prevPosts: Math.round(topicBefore),
      change: topicChange,
      // Up to ~20 points for the small trend line.
      spark: splitInto(now, Math.min(20, now.length)).map((s) => sum(s, (d) => d.topicPosts) / s.length),
    },
    audience: {
      value: `+${Math.round(membersNow).toLocaleString("en-US")}`,
      change: changePct(membersNow, sum(before, (d) => d.newMembers)),
      label: `new followers across Instagram, Facebook, Web and Email in ${range.label}`,
    },
    engagement: {
      value: `${Math.round(engagementNow * 10) / 10}%`,
      change: changePct(engagementNow, avg(before, (d) => d.engagement)),
      note: `of people who saw your posts liked, commented or shared, on average`,
      bars: sliceAvg.map((v) => Math.round(30 + ((v - low) / (top - low || 1)) * 70)),
      barRange: [fmtDate(range.from), fmtDate(range.to)],
    },
    planning: {
      date: best.next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      reason: `${best.names[0]}s and ${best.names[1]}s brought in the most sales in ${range.label}.`,
    },
    channels: CHANNELS.map((c) => {
      const reach = sum(now, (d) => d.channels[c.key].reach);
      const prevReach = sum(before, (d) => d.channels[c.key].reach);
      const rate = sum(now, (d) => d.channels[c.key].interactions) / reach;
      const prevRate = sum(before, (d) => d.channels[c.key].interactions) / prevReach;
      return {
        icon: c.icon,
        name: c.name,
        reach: changePct(reach, prevReach, 0),
        engagement: changePct(rate, prevRate),
      };
    }),
  };
}

function splitInto(days, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(days.slice(Math.round((i * days.length) / n), Math.round(((i + 1) * days.length) / n)));
  }
  return out.filter((s) => s.length);
}
