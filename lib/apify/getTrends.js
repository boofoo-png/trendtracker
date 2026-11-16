import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  ACTORS,
  BUSINESS_KEYWORDS,
  MIN_POSTS_PER_TREND,
  RESULT_KEY,
  RESULT_STORE,
  TRENDS_CACHE_TAG,
} from "./config";
import { getLastRunItems, getRecord, putRecord, runActor } from "./client";
import { NORMALIZERS } from "./normalize";
import { buildTrends } from "./buildTrends";

const EMPTY = { trends: [], updatedAt: null, audiences: [], hashtags: [], errors: [] };

const toTrends = (posts, now, hashtags) =>
  buildTrends(posts, {
    hashtags,
    businessKeywords: BUSINESS_KEYWORDS,
    minPosts: MIN_POSTS_PER_TREND,
    now,
  });

const errorMessage = (platform, r) => `${platform}: ${r.reason?.message ?? r.reason}`;

/**
 * The latest saved search result. Falls back to the actors' last runs
 * (e.g. runs started from the Apify console). Never starts a scrape.
 */
export async function getLatestTrends() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TRENDS_CACHE_TAG);

  try {
    const saved = await getRecord(RESULT_STORE, RESULT_KEY);
    if (saved?.trends?.length) return { ...EMPTY, ...saved, errors: [] };
  } catch (err) {
    return { ...EMPTY, errors: [err.message] };
  }

  const platforms = Object.keys(ACTORS);
  const results = await Promise.allSettled(platforms.map((p) => getLastRunItems(ACTORS[p].id)));
  const posts = [];
  const finished = [];
  const errors = [];
  results.forEach((r, i) => {
    const platform = platforms[i];
    if (r.status === "rejected") return errors.push(errorMessage(platform, r));
    if (!r.value) return;
    posts.push(...r.value.items.map(NORMALIZERS[platform]));
    finished.push(new Date(r.value.finishedAt).getTime());
  });

  const updatedAt = finished.length ? Math.max(...finished) : null;
  return { ...EMPTY, trends: updatedAt ? toTrends(posts, updatedAt) : [], updatedAt, errors };
}

/** Run every actor for these hashtags and build trends. Spends Apify credits. */
export async function scrapeTrends(hashtags) {
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
  return { trends: toTrends(posts, now, hashtags), updatedAt: now, errors };
}

export async function saveLatestResult(result) {
  await putRecord(RESULT_STORE, RESULT_KEY, result);
}
