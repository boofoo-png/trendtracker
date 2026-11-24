"use server";

// Every action here is triggered by an explicit button press in the UI.
// Nothing runs on page load, typing, or selection.

import { scrapeTrends } from "@/lib/apify/getTrends";
import { EST_COST_PER_POST, MAX_HASHTAGS_PER_SEARCH, RESULTS_PER_HASHTAG } from "@/lib/apify/config";
import {
  currentWorkspace,
  failTrendSearch,
  finishTrendSearch,
  getLatestTrends,
  getRunningSearch,
  startTrendSearch,
} from "@/lib/trendStore";
import {
  getAudienceFit,
  getAudienceSuggestions,
  getSearchHashtags,
} from "@/lib/gemini/audience";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { getCampaignDirection } from "@/lib/gemini/campaign";
import { FOCUS_TYPES } from "@/lib/campaignFocus";
import { FIT_ENABLED } from "@/lib/features";
import { businessContext, businessKeywords } from "@/lib/business";

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

/** "✦ Find similar audiences" button: related audience names. */
// Each action takes `business`, the profile from Settings → Workspace (lib/business.js).

export async function suggestAudiences(query, business) {
  const q = cleanAudience(query);
  if (q.length < 3) return { audiences: [], error: "Type at least 3 characters first." };
  if (!isGeminiConfigured()) return { audiences: [], error: NO_KEY };
  try {
    return { audiences: await getAudienceSuggestions(q.toLowerCase(), businessContext(business)) };
  } catch (err) {
    return { audiences: [], error: err.message };
  }
}

/** "Find trends" button: Gemini proposes hashtags; nothing is scraped yet. */
export async function planTrendSearch(audiences, business) {
  const names = cleanAudiences(audiences);
  if (names.length === 0) return { hashtags: [], error: "Select at least one audience." };
  if (!isGeminiConfigured()) return { hashtags: [], error: NO_KEY };
  try {
    const hashtags = await getSearchHashtags(names, MAX_HASHTAGS_PER_SEARCH, businessContext(business));
    if (hashtags.length === 0) return { hashtags, error: "Sense AI couldn't suggest hashtags." };
    return { hashtags };
  } catch (err) {
    return { hashtags: [], error: err.message };
  }
}

/** "Run trend search" button: scrape (Apify credits), then score fit per audience (Gemini) if FIT_ENABLED. */
export async function runTrendSearch(audiences, hashtags, business) {
  const names = cleanAudiences(audiences);
  const tags = cleanTags(hashtags);
  if (names.length === 0 || tags.length === 0) {
    return { trends: [], errors: ["Select an audience and at least one hashtag."] };
  }

  const { supabase, userId, workspaceId } = await currentWorkspace();
  if (!workspaceId) return { trends: [], errors: ["Sign in again to run a trend search."] };

  // One search at a time per workspace, so a second tab or teammate can't pay twice.
  const running = await getRunningSearch(supabase, workspaceId);
  if (running) {
    return { trends: [], running, errors: ["A trend search is already running. Its results will appear here when it finishes."] };
  }

  let searchId = null;
  try {
    const estCost = tags.length * RESULTS_PER_HASHTAG * Object.values(EST_COST_PER_POST).reduce((a, b) => a + b, 0);
    searchId = await startTrendSearch({ workspaceId, userId, audiences: names, hashtags: tags, estCost: Number(estCost.toFixed(2)) });
    const { trends, posts, updatedAt, errors } = await scrapeTrends(tags, businessKeywords(business));

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
          audienceFit[name] = await getAudienceFit(name, summary, businessContext(business));
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
      // Saved to this workspace only; other accounts never see it.
      await finishTrendSearch(searchId, { workspaceId, posts, trends: result.trends, errors, finishedAt: updatedAt });
    } else {
      result.errors.push("No trends found for these hashtags. Try different ones.");
      await failTrendSearch(searchId, result.errors);
    }
    return result;
  } catch (err) {
    if (searchId) await failTrendSearch(searchId, [err.message]).catch(() => {});
    return { trends: [], errors: [err.message] };
  }
}

/**
 * Polled by the page while a search started elsewhere (another visit, tab or teammate)
 * is still running: the latest results, with `running` set until it finishes.
 */
export async function checkTrendSearch() {
  return getLatestTrends();
}

/** "✦ Generate campaign direction" button: Gemini writes a direction for one trend. */
export async function generateCampaignDirection(trend, audiences, focus, attempt = 0, business) {
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

  const names = cleanAudiences(audiences);
  const tries = Math.max(0, Math.min(Number(attempt) || 0, 20));
  let angle;
  try {
    angle = await getCampaignDirection(summary, names, cleanFocus, tries, businessContext(business));
  } catch (err) {
    return { error: err.message };
  }

  // Keep it for this workspace so it's still there after a reload or on another device.
  // A failed save doesn't hide the answer; it just won't be remembered.
  let savedAt = null;
  try {
    const { supabase, userId, workspaceId } = await currentWorkspace();
    if (workspaceId) {
      const { data, error } = await supabase
        .from("campaign_directions")
        .insert({
          workspace_id: workspaceId,
          trend_key: str(trend.id, 120),
          audiences: names,
          focus: cleanFocus ?? { type: "General brand", name: "", details: "" },
          attempt: tries,
          result: angle,
          created_by: userId,
        })
        .select("created_at")
        .single();
      if (error) console.error("Saving campaign direction failed:", error.message);
      savedAt = data?.created_at ?? null;
    }
  } catch (err) {
    console.error("Saving campaign direction failed:", err.message);
  }
  return { angle, savedAt };
}

/**
 * Campaign directions saved in this workspace, newest first (the page keeps the newest
 * per trend + audiences + focus), so generated ideas survive reloads.
 */
export async function getCampaignDirections() {
  const { supabase, workspaceId } = await currentWorkspace();
  if (!workspaceId) return { directions: [] };
  const { data, error } = await supabase
    .from("campaign_directions")
    .select("trend_key, audiences, focus, attempt, result, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return { directions: [], error: error.message };
  return {
    directions: data.map((r) => ({
      trendKey: r.trend_key,
      audiences: r.audiences ?? [],
      focus: r.focus,
      attempt: r.attempt,
      angle: r.result,
      savedAt: r.created_at,
    })),
  };
}
