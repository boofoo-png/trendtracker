// Hands a starting point (a trend, a calendar post, a campaign idea, a competitor
// insight) to a Content Creation screen. Per-tab only (sessionStorage).
//
// Each handoff is addressed to one page (`path`). It's shown only on that page and
// is dropped as soon as the user goes anywhere else (see ContentTrendWatcher), so
// opening Content Creation from the sidebar later starts clean.

const KEY = "trendtracker:content-trend";

export const TREND_SOURCES = {
  trend: { label: "From Audience trends", noun: "trend" },
  calendar: { label: "From your content calendar", noun: "planned post" },
  campaign: { label: "From your campaign", noun: "campaign idea" },
  competitor: { label: "From a competitor insight", noun: "insight" },
  assistant: { label: "From Sense AI", noun: "suggestion" },
};

function read() {
  try {
    const entry = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return entry?.name && entry?.path ? entry : null;
  } catch {
    return null;
  }
}

function write(entry) {
  try {
    if (entry) sessionStorage.setItem(KEY, JSON.stringify(entry));
    else sessionStorage.removeItem(KEY);
  } catch {}
}

/**
 * Call from the link's onClick, just before navigating to `path`.
 * item: { name, audience, platform, format, hook }; source: a TREND_SOURCES key.
 */
export function saveContentTrend(item, { source = "trend", path }) {
  write({ ...item, source: TREND_SOURCES[source] ? source : "trend", path });
}

/** The handoff for this page, or null. */
export function loadContentTrend(pathname) {
  const entry = read();
  return entry && entry.path === pathname ? entry : null;
}

/** Pass the current handoff on to the next page (Content Creation → a creator). */
export function forwardContentTrend(fromPath, toPath) {
  const entry = loadContentTrend(fromPath);
  if (entry) write({ ...entry, path: toPath });
}

export function clearContentTrend() {
  write(null);
}

/** Drop a handoff that wasn't meant for the page now showing. */
export function dropStaleContentTrend(pathname) {
  const entry = read();
  if (entry && entry.path !== pathname) write(null);
}

export const sourceOf = (item) => TREND_SOURCES[item?.source] ?? TREND_SOURCES.trend;
