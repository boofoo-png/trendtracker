// Hands the trend picked on Audience Trends ("Use in Content") to the
// Content Creation page. Per-tab only (sessionStorage); safe to lose.

const KEY = "trendtracker:content-trend";

/** trend: { name, audience, platform, format, hook } */
export function saveContentTrend(trend) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trend));
  } catch {}
}

export function loadContentTrend() {
  try {
    const trend = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return trend?.name ? trend : null;
  } catch {
    return null;
  }
}
