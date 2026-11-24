import "server-only";
import { ACTORS, MIN_POSTS_PER_TREND } from "./config";
import { runActor } from "./client";
import { NORMALIZERS } from "./normalize";
import { buildTrends } from "./buildTrends";

// Saved results are per workspace in Supabase: see lib/trendStore.js.

const errorMessage = (platform, r) => `${platform}: ${r.reason?.message ?? r.reason}`;

/**
 * Run every actor for these hashtags and build trends. Spends Apify credits.
 * `keywords` describe the user's business (Settings → Workspace) and drive the
 * non-AI "fit" estimate: how often a trend's posts also mention them.
 */
export async function scrapeTrends(hashtags, keywords = []) {
  const platforms = Object.keys(ACTORS);
  const results = await Promise.allSettled(
    platforms.map((p) => runActor(ACTORS[p].id, ACTORS[p].input(hashtags))),
  );

  const posts = [];
  const errors = [];
  results.forEach((r, i) => {
    const platform = platforms[i];
    if (r.status === "rejected") return errors.push(errorMessage(platform, r));
    posts.push(...r.value.map(NORMALIZERS[platform]));
  });

  const now = Date.now();
  const trends = buildTrends(posts, { hashtags, businessKeywords: keywords, minPosts: MIN_POSTS_PER_TREND, now });
  return { trends, posts, updatedAt: now, errors };
}
