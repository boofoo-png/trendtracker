// Turn normalized posts into the Trend shape the UI uses (see lib/trends.js).
//
// Scores are heuristics. Tune them here:
//   momentum: 50% engagement-per-post rank among trends
//           + 30% week-over-week growth in posts (capped at +100%)
//           + 20% share of posts from the last 7 days
//   fit:      share of posts that also mention a BUSINESS_KEYWORD (×1.5, capped)
//   depth:    "Broad" if total reach is at or above the median trend, else "Niche"

import { engagementOf } from "./normalize";
import { TOP_POSTS_PER_TREND } from "./config";

const DAY = 86_400_000;
const clamp01 = (n) => Math.min(1, Math.max(0, n));

function mostCommon(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

function mentions(post, word) {
  return post.hashtags.includes(word) || post.text.toLowerCase().includes(word);
}

export function buildTrends(posts, { hashtags, businessKeywords, minPosts, now }) {
  // Without an explicit list, use the hashtags the posts were scraped for.
  hashtags ??= [...new Set(posts.map((p) => p.queryTag).filter(Boolean))];
  const platforms = [...new Set(posts.map((p) => p.platform))];
  const raw = [];

  for (const platform of platforms) {
    for (const tag of hashtags) {
      const matched = posts.filter(
        (p) => p.platform === platform && (p.queryTag === tag || p.hashtags.includes(tag)),
      );
      if (matched.length < minPosts) continue;

      const ages = matched.map((p) => (now - new Date(p.createdAt).getTime()) / DAY);
      const recent = ages.filter((a) => a >= 0 && a < 7).length;
      const prior = ages.filter((a) => a >= 7 && a < 14).length;
      const history = Array.from({ length: 7 }, (_, i) =>
        ages.filter((a) => a >= 6 - i && a < 7 - i).length,
      );

      const engagement = matched.map(engagementOf);
      const totalEngagement = engagement.reduce((a, b) => a + b, 0);
      const reach = totalEngagement + matched.reduce((a, p) => a + p.views, 0);

      const others = businessKeywords.filter((k) => k !== tag);
      const fitShare = others.length
        ? matched.filter((p) => others.some((k) => mentions(p, k))).length / matched.length
        : 0.5;

      raw.push({
        id: `${platform.toLowerCase()}-${tag}`,
        name: `#${tag}`,
        platform,
        format: mostCommon(matched.map((p) => p.format)),
        postCount: matched.length,
        avgEngagement: totalEngagement / matched.length,
        reach,
        recentShare: recent / matched.length,
        change: prior ? Math.round(((recent - prior) / prior) * 100) : recent ? 100 : 0,
        fit: Math.round(clamp01(fitShare * 1.5) * 100),
        history,
        topPosts: matched
          .toSorted((a, b) => engagementOf(b) - engagementOf(a))
          .slice(0, TOP_POSTS_PER_TREND)
          .map((p) => ({
            id: p.id,
            platform: p.platform,
            format: p.format,
            url: p.url,
            embedUrl: p.embedUrl,
            text: p.text.slice(0, 140),
            likes: p.likes,
            views: p.views,
          })),
        angle: null,
      });
    }
  }

  const byEngagement = raw.map((t) => t.avgEngagement).sort((a, b) => a - b);
  const reachMedian = median(raw.map((t) => t.reach));

  return raw.map(({ avgEngagement, recentShare, reach, ...t }) => {
    const engagementRank =
      byEngagement.length > 1 ? byEngagement.indexOf(avgEngagement) / (byEngagement.length - 1) : 1;
    const momentum = Math.round(
      100 * (0.5 * engagementRank + 0.3 * clamp01(t.change / 100) + 0.2 * recentShare),
    );
    return { ...t, momentum, depth: reach >= reachMedian ? "Broad" : "Niche" };
  });
}
