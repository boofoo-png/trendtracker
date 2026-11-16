"use server";

// Every action here is triggered by an explicit button press in the UI.
// Nothing runs on page load, typing, or selection.

import { updateTag } from "next/cache";
import { saveLatestResult, scrapeTrends } from "@/lib/apify/getTrends";
import { MAX_HASHTAGS_PER_SEARCH, TRENDS_CACHE_TAG } from "@/lib/apify/config";
import {
  getAudienceFit,
  getAudienceSuggestions,
  getSearchHashtags,
} from "@/lib/gemini/audience";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { getCampaignDirection } from "@/lib/gemini/campaign";
import { FOCUS_TYPES } from "@/lib/campaignFocus";
import { FIT_ENABLED } from "@/lib/features";

const NO_KEY = "AI features are off: add GEMINI_API_KEY to .env.local.";

const cleanAudience = (s) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
const cleanAudiences = (list) =>
  [...new Set((Array.isArray(list) ? list : []).map(cleanAudience).filter(Boolean))].slice(0, 5);
const cleanTags = (list) =>
  [
    ...new Set(
      (Array.isArray(list) ? list : [])
        .map((t) => String(t).toLowerCase().replace(/[^a-z0-9_]/g, ""))
        .filter((t) => t.length >= 2 && t.length <= 40),
    ),
  ].slice(0, MAX_HASHTAGS_PER_SEARCH);

/** "✦ Suggest with AI" button: related audience names. */
export async function suggestAudiences(query) {
  const q = cleanAudience(query);
  if (q.length < 3) return { audiences: [], error: "Type at least 3 characters first." };
  if (!isGeminiConfigured()) return { audiences: [], error: NO_KEY };
  try {
    return { audiences: await getAudienceSuggestions(q.toLowerCase()) };
  } catch (err) {
    return { audiences: [], error: err.message };
  }
}

/** "Find trends" button: Gemini proposes hashtags; nothing is scraped yet. */
export async function planTrendSearch(audiences) {
  const names = cleanAudiences(audiences);
  if (names.length === 0) return { hashtags: [], error: "Select at least one audience." };
  if (!isGeminiConfigured()) return { hashtags: [], error: NO_KEY };
  try {
    const hashtags = await getSearchHashtags(names, MAX_HASHTAGS_PER_SEARCH);
    if (hashtags.length === 0) return { hashtags, error: "Sense AI couldn't suggest hashtags." };
    return { hashtags };
  } catch (err) {
    return { hashtags: [], error: err.message };
  }
}

/** "Run trend search" button: scrape (Apify credits), then score fit per audience (Gemini) if FIT_ENABLED. */
export async function runTrendSearch(audiences, hashtags) {
  const names = cleanAudiences(audiences);
  const tags = cleanTags(hashtags);
  if (names.length === 0 || tags.length === 0) {
    return { trends: [], errors: ["Select an audience and at least one hashtag."] };
  }

  try {
    const { trends, updatedAt, errors } = await scrapeTrends(tags);

    // Score fit for every audience in this search, so switching between them later is free.
    const audienceFit = {};
    if (FIT_ENABLED && trends.length && isGeminiConfigured()) {
      const summary = trends.map((t) => ({
        id: t.id,
        name: t.name,
        platform: t.platform,
        format: t.format,
        examples: (t.topPosts ?? []).map((p) => p.text).slice(0, 3),
      }));
      for (const name of names) {
        try {
          audienceFit[name] = await getAudienceFit(name, summary);
        } catch (err) {
          errors.push(`Fit for ${name}: ${err.message}`);
        }
      }
    }

    const result = {
      trends: trends.map((t) => ({
        ...t,
        audienceFit: Object.fromEntries(
          Object.entries(audienceFit)
            .filter(([, scores]) => scores[t.id])
            .map(([name, scores]) => [name, scores[t.id]]),
        ),
      })),
      updatedAt,
      audiences: names,
      hashtags: tags,
      errors,
    };

    if (result.trends.length) {
      await saveLatestResult({ ...result, errors: [] });
      updateTag(TRENDS_CACHE_TAG);
    } else {
      result.errors.push("No trends found for these hashtags. Try different ones.");
    }
    return result;
  } catch (err) {
    return { trends: [], errors: [err.message] };
  }
}

/** "✦ Generate campaign direction" button: Gemini writes a direction for one trend. */
export async function generateCampaignDirection(trend, audiences, focus, attempt = 0) {
  if (!trend?.id) return { error: "Select a trend first." };
  if (!isGeminiConfigured()) return { error: NO_KEY };

  const str = (v, n) => String(v ?? "").slice(0, n);
  const summary = {
    name: str(trend.name, 80),
    platform: str(trend.platform, 20),
    format: str(trend.format, 60),
    depth: str(trend.depth, 10),
    momentum: Number(trend.momentum) || 0,
    weeklyChangePercent: Number(trend.change) || 0,
    advice: str(trend.advice, 20),
    examplePosts: (trend.topPosts ?? []).map((p) => str(p.text, 140)).slice(0, 3),
  };

  const clean = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const focusName = clean(focus?.name, 100);
  const cleanFocus = focusName
    ? {
        type: FOCUS_TYPES.includes(focus?.type) ? focus.type : "Product",
        name: focusName,
        details: clean(focus?.details, 400),
      }
    : null;

  try {
    return {
      angle: await getCampaignDirection(
        summary,
        cleanAudiences(audiences),
        cleanFocus,
        Math.max(0, Math.min(Number(attempt) || 0, 20)),
      ),
    };
  } catch (err) {
    return { error: err.message };
  }
}
