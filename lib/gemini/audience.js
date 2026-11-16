import "server-only";
import { cacheLife } from "next/cache";
import { generateJson } from "./client";

export const BUSINESS_CONTEXT =
  "The user is a marketer at a B2B supplier to the hospitality and travel industry " +
  "(hotels, booking, sustainable supply). They research social media trends to plan campaigns.";

/** Up to 6 audience names related to what the user typed. */
export async function getAudienceSuggestions(query) {
  "use cache";
  cacheLife("days");

  const result = await generateJson({
    system:
      `${BUSINESS_CONTEXT} Suggest marketing audience segments. ` +
      "Each is a short noun phrase of 2–4 words in Title-case-free plain English, " +
      'e.g. "Hospitality buyers", "Boutique hotel owners". No duplicates, no explanations.',
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
export async function getAudienceFit(audience, trends) {
  "use cache";
  cacheLife("hours");

  const result = await generateJson({
    system:
      `${BUSINESS_CONTEXT} Score how naturally each social media trend belongs to a given ` +
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
export async function getSearchHashtags(audiences, max) {
  "use cache";
  cacheLife("days");

  const result = await generateJson({
    system:
      `${BUSINESS_CONTEXT} Pick TikTok/Instagram hashtags that this audience actively ` +
      "posts under or follows, where emerging content trends would show up. Prefer " +
      "specific, active hashtags over generic ones (#travel, #fyp). Lowercase, no '#', " +
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
