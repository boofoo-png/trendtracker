// When an account posts and which days and times do best, from its recent posts (in the
// viewer's timezone). Used by Competitors ("How they post"), Overview and Reports.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES = {
  Mon: "Mondays",
  Tue: "Tuesdays",
  Wed: "Wednesdays",
  Thu: "Thursdays",
  Fri: "Fridays",
  Sat: "Saturdays",
  Sun: "Sundays",
};
export const SLOTS = [
  ["morning", "Morning", "5am–11am", (h) => h >= 5 && h < 11],
  ["afternoon", "Afternoon", "11am–5pm", (h) => h >= 11 && h < 17],
  ["evening", "Evening", "5pm–10pm", (h) => h >= 17 && h < 22],
  ["night", "Night", "10pm–5am", (h) => h >= 22 || h < 5],
];

/** Group posts by weekday and time of day (in the viewer's timezone) with average engagement. */
export function postingPattern(posts, timeZone) {
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  });
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  });
  // count = all posts (for "when"); rated/eng = posts with visible likes (for averages).
  const blank = () => ({ count: 0, rated: 0, eng: 0 });
  const days = Object.fromEntries(DAYS.map((d) => [d, blank()]));
  const slots = Object.fromEntries(SLOTS.map(([k]) => [k, blank()]));
  let total = 0;
  let rated = 0;
  const add = (g, eng) => {
    g.count += 1;
    if (eng != null) {
      g.rated += 1;
      g.eng += eng;
    }
  };
  for (const p of posts) {
    if (!p.time) continue;
    const d = new Date(p.time);
    const eng = p.likes == null ? null : p.likes + (p.comments ?? 0);
    const day = days[dayFmt.format(d)];
    if (day) add(day, eng);
    const h = Number(hourFmt.format(d)) % 24;
    const slot = SLOTS.find(([, , , test]) => test(h))?.[0];
    if (slot) add(slots[slot], eng);
    if (eng != null) {
      total += eng;
      rated += 1;
    }
  }
  const avg = rated ? total / rated : 0;
  const withAvg = (o) =>
    Object.fromEntries(
      Object.entries(o).map(([k, v]) => [
        k,
        { ...v, avg: v.rated ? v.eng / v.rated : null },
      ]),
    );
  return { days: withAvg(days), slots: withAvg(slots), avg };
}

/** Highest average engagement among groups with at least 2 posts (one post isn't a pattern). */
export function bestOf(groups) {
  return Object.entries(groups)
    .filter(([, g]) => g.rated >= 2)
    .sort((a, b) => b[1].avg - a[1].avg)[0];
}
