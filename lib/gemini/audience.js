import "server-only";
import { cacheLife } from "next/cache";
import { generateJson } from "./client";

// Every function takes `context` (lib/business.js → businessContext) describing the
// user's business. It's an argument, so it is also part of the cache key.

/** Up to 6 audience names related to what the user typed. */
export async function getAudienceSuggestions(query, context) {
  "use cache";
  cacheLife("days");

  const result = await generateJson({
    system:
      `${context} Suggest marketing audience segments. ` +
      "Each is a short noun phrase of 2–4 words in Title-case-free plain English, " +
      'e.g. "Busy working parents", "Small cafe owners". No duplicates, no explanations.',
    prompt: `Suggest up to 6 audience segments related to: "${query}"`,
    schema: {
      type: "OBJECT",
      properties: { audiences: { type: "ARRAY", items: { type: "STRING" } } },
      required: ["audiences"],
    },
    temperature: 0.6,
  });

  return (result.audiences ?? [])
    .map((a) => String(a).trim())
    .filter((a) => a && a.length <= 60)
    .slice(0, 6);
}

/**
 * Fit of each trend for one audience.
 * `trends` is a compact, serializable summary: [{ id, name, platform, format, examples }]
 * Returns { [trendId]: { fit: 0–100, reason } }.
 */
export async function getAudienceFit(audience, trends, context) {
  "use cache";
  cacheLife("hours");

  const result = await generateJson({
    system:
      `${context} Score how naturally each social media trend belongs to a given ` +
      "audience AND could be used by this business to reach them. 0 = irrelevant, " +
      "50 = loosely related, 100 = core interest of the audience. Be discriminating: " +
      "use the full range. The reason is one short sentence (max 20 words).",
    prompt:
      `Audience: "${audience}"\n\nTrends (JSON):\n${JSON.stringify(trends)}\n\n` +
      "Return one score for every trend id.",
    schema: {
      type: "OBJECT",
      properties: {
        scores: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              fit: { type: "INTEGER" },
              reason: { type: "STRING" },
            },
            required: ["id", "fit", "reason"],
          },
        },
      },
      required: ["scores"],
    },
  });

  const ids = new Set(trends.map((t) => t.id));
  const scores = {};
  for (const s of result.scores ?? []) {
    if (!ids.has(s.id)) continue;
    scores[s.id] = {
      fit: Math.max(0, Math.min(100, Math.round(Number(s.fit) || 0))),
      reason: String(s.reason ?? "").slice(0, 200),
    };
  }
  return scores;
}

/**
 * Hashtags worth scraping to find trends for these audiences.
 * Returns [{ tag, audience }] with tags lowercase, no "#".
 */
export async function getSearchHashtags(audiences, max, context) {
  "use cache";
  cacheLife("days");

  const result = await generateJson({
    system:
      `${context} Pick TikTok/Instagram hashtags that this audience actively ` +
      "posts under or follows, where emerging content trends would show up. Prefer " +
      "specific, active hashtags over generic ones (#fyp, #viral). Lowercase, no '#', " +
      "letters/digits/underscores only.",
    prompt:
      `Audiences: ${JSON.stringify(audiences)}\n` +
      `Return at most ${max} hashtags in total, spread across the audiences, ` +
      "each tagged with the audience it is for.",
    schema: {
      type: "OBJECT",
      properties: {
        hashtags: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { tag: { type: "STRING" }, audience: { type: "STRING" } },
            required: ["tag", "audience"],
          },
        },
      },
      required: ["hashtags"],
    },
    temperature: 0.4,
  });

  const seen = new Set();
  return (result.hashtags ?? [])
    .map((h) => ({
      tag: String(h.tag ?? "").toLowerCase().replace(/^#/, "").replace(/[^a-z0-9_]/g, ""),
      audience: String(h.audience ?? ""),
    }))
    .filter((h) => h.tag.length >= 2 && h.tag.length <= 40 && !seen.has(h.tag) && seen.add(h.tag))
    .slice(0, max);
}
