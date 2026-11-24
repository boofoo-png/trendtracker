import "server-only";

// Real competitor stats from Instagram Business Discovery: using the workspace's
// connected Instagram account, look up any business/creator account by @username and
// get its public numbers and recent posts. Read-only, public data only.

import { GRAPH_VERSION } from "@/lib/meta";

const FORMAT = (m) =>
  m.media_product_type === "REELS"
    ? "Reel"
    : m.media_type === "CAROUSEL_ALBUM"
      ? "Carousel"
      : m.media_type === "VIDEO"
        ? "Video"
        : "Image";

/** "@Nike", "instagram.com/nike/", "nike" → "nike"; null if it can't be a username. */
export function cleanHandle(raw) {
  const s = String(raw ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(s) ? s : null;
}

/** The Page + Instagram account to look things up with, from a meta_connections row. */
export function lookupAccount(conn) {
  const page = conn?.pages?.find((p) => p.ig);
  return page
    ? { igId: page.ig.id, username: page.ig.username, token: page.token }
    : null;
}

/** Public numbers and the last 25 posts of @username. Throws a friendly error. */
export async function discover(account, username) {
  const fields =
    `business_discovery.username(${username}){username,name,profile_picture_url,followers_count,media_count,` +
    "media.limit(25){caption,like_count,comments_count,timestamp,media_type,media_product_type,permalink,media_url,thumbnail_url}}";
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${account.igId}?${new URLSearchParams({ fields, access_token: account.token })}`;
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (body.error) {
    const msg = body.error.message ?? "";
    if (
      body.error.code === 110 ||
      /cannot be found|does not exist|Invalid user/i.test(msg)
    ) {
      throw new Error(
        `@${username} wasn't found, or it's a personal account. Only business and creator accounts can be looked up.`,
      );
    }
    if (body.error.code === 4 || body.error.code === 32 || /limit/i.test(msg)) {
      throw new Error(
        "Instagram's hourly limit was reached. Try again in a little while.",
      );
    }
    throw new Error(msg || "Instagram didn't respond. Try again.");
  }
  return summarize(body.business_discovery);
}

const avg = (list) =>
  list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;

/** Business Discovery result → the numbers the Competitors page compares. */
export function summarize(bd) {
  const media = bd.media?.data ?? [];

  // Hashtags from the full captions (the saved captions below are cut short, and
  // hashtags usually sit at the end). Counted once per post.
  // Accounts can hide like counts; Instagram then leaves like_count out. Those posts
  // still count for how often/when they post, but are left out of every average that
  // uses likes (counting them as 0 would make the account look worse than it is).
  const tagStats = new Map();
  for (const m of media) {
    const known = m.like_count != null;
    const engagement = (m.like_count ?? 0) + (m.comments_count ?? 0);
    const tags = new Set(
      [...(m.caption ?? "").matchAll(/#([\p{L}\p{N}_]{2,40})/gu)].map((x) =>
        x[1].toLowerCase(),
      ),
    );
    for (const tag of tags) {
      const t = tagStats.get(tag) ?? { tag, count: 0, rated: 0, engagement: 0 };
      t.count += 1;
      if (known) {
        t.rated += 1;
        t.engagement += engagement;
      }
      tagStats.set(tag, t);
    }
  }
  const hashtags = [...tagStats.values()]
    .map((t) => ({
      tag: t.tag,
      count: t.count,
      avgEngagement: t.rated ? Math.round(t.engagement / t.rated) : null,
    }))
    .sort(
      (a, b) =>
        b.count - a.count || (b.avgEngagement ?? 0) - (a.avgEngagement ?? 0),
    )
    .slice(0, 12);

  const posts = media.map((m) => ({
    id: m.id,
    caption: (m.caption ?? "").slice(0, 220),
    format: FORMAT(m),
    likes: m.like_count ?? null, // null = the owner hides like counts
    comments: m.comments_count ?? 0,
    time: m.timestamp,
    url: m.permalink,
    image:
      m.media_type === "VIDEO"
        ? (m.thumbnail_url ?? null)
        : (m.media_url ?? null),
  }));

  // Posts per week over the last 30 days. If all 25 fetched posts are newer than that
  // (a very active account), use the span they actually cover instead.
  const now = Date.now();
  const DAY = 86400000;
  const oldestDays = posts.length
    ? (now - Date.parse(posts.at(-1).time)) / DAY
    : 0;
  const perWeek =
    posts.length >= 25 && oldestDays < 30
      ? (posts.length / Math.max(1, oldestDays)) * 7
      : (posts.filter((p) => now - Date.parse(p.time) <= 30 * DAY).length /
          30) *
        7;

  // Like-based numbers use only posts whose likes are visible; null if none are.
  const rated = posts.filter((p) => p.likes != null);
  const avgLikes = rated.length ? avg(rated.map((p) => p.likes)) : null;
  const avgComments = avg(posts.map((p) => p.comments));
  const avgEngagement = rated.length
    ? avg(rated.map((p) => p.likes + p.comments))
    : null;
  const followers = bd.followers_count ?? 0;

  const byFormat = {};
  for (const p of posts) {
    byFormat[p.format] ??= { count: 0, rated: 0, engagement: 0 };
    byFormat[p.format].count += 1;
    if (p.likes != null) {
      byFormat[p.format].rated += 1;
      byFormat[p.format].engagement += p.likes + p.comments;
    }
  }
  const formats = Object.entries(byFormat)
    .map(([format, f]) => ({
      format,
      count: f.count,
      rated: f.rated,
      avgEngagement: f.rated ? f.engagement / f.rated : null,
    }))
    .sort((a, b) => b.count - a.count);

  const top =
    [...rated].sort(
      (a, b) => b.likes + b.comments - (a.likes + a.comments),
    )[0] ?? null;

  return {
    username: bd.username,
    name: bd.name ?? "",
    picture: bd.profile_picture_url ?? null,
    followers,
    postCount: bd.media_count ?? 0,
    postsPerWeek: Math.round(perWeek * 10) / 10,
    avgLikes: avgLikes == null ? null : Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    // Average (likes + comments) per post as a % of followers; null if likes are hidden.
    engagementRate:
      avgEngagement == null
        ? null
        : followers
          ? Math.round((avgEngagement / followers) * 10000) / 100
          : 0,
    // How many of the fetched posts hide their like count.
    hiddenLikes: posts.length - rated.length,
    topFormat: formats[0]?.format ?? null,
    formats,
    topPost: top,
    hashtags,
    posts: posts.slice(0, 24), // shown 6 at a time on the Competitors page
    sampleSize: posts.length,
  };
}
