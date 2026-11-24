"use server";

// Triggered only by the Generate / Regenerate buttons on Content Creation screens.

import { isGeminiConfigured } from "@/lib/gemini/client";
import { generateContentFor } from "@/lib/gemini/content";
import { CONTENT_KINDS, FIELD_OPTIONS } from "@/lib/contentKinds";
import { businessContext } from "@/lib/business";
import { briefProblem, cleanBrief } from "@/lib/campaignBrief";
import { generateCampaignPlan } from "@/lib/gemini/campaignPlan";
import { currentWorkspace, getLatestTrends } from "@/lib/trendStore";

const NO_KEY = "AI features are off: add GEMINI_API_KEY to .env.local.";
const LONG = new Set(["text", "source"]);

const str = (v, n) => String(v ?? "").replace(/\r/g, "").trim().slice(0, n);

function cleanFields(kind, fields) {
  const out = {};
  for (const key of CONTENT_KINDS[kind].fields) {
    const value = fields?.[key];
    const options = FIELD_OPTIONS[key];
    if (key === "platforms") {
      const picked = (Array.isArray(value) ? value : []).filter((p) => options.includes(p));
      out.platforms = picked.length ? picked : [options[0]];
    } else if (options) {
      out[key] = options.includes(value) ? value : options[0];
    } else {
      out[key] = str(value, key === "text" ? 12000 : LONG.has(key) ? 4000 : 600);
    }
  }
  return out;
}

function cleanTrend(trend) {
  if (!trend?.name) return null;
  return {
    name: str(trend.name, 80),
    audience: str(trend.audience, 200),
    platform: str(trend.platform, 20),
    format: str(trend.format, 60),
    hook: str(trend.hook, 400),
    source: ["trend", "calendar", "campaign", "competitor", "assistant"].includes(trend.source) ? trend.source : "trend",
  };
}

const REQUIRED = {
  improve: ["text", "Add your writing first: upload a file or paste the text."],
  repurpose: ["source", "Paste or pick the content to repurpose."],
  ad: ["product", "Say what product or service the ad is for."],
};

export async function generateContent(kind, fields, trend, business) {
  if (!CONTENT_KINDS[kind]) return { error: "Unknown content type." };
  if (!isGeminiConfigured()) return { error: NO_KEY };

  const clean = cleanFields(kind, fields);
  const [need, message] = REQUIRED[kind] ?? [];
  if (need && !clean[need]) return { error: message };
  if (!need && !clean.idea && !trend?.name) return { error: "Describe your idea first." };

  try {
    return { result: await generateContentFor(kind, clean, cleanTrend(trend), businessContext(business)) };
  } catch (err) {
    return { error: err.message };
  }
}

/** "Generate campaign" button on Content Creation → Campaign. */
export async function generateCampaign(brief, trend, business) {
  if (!isGeminiConfigured()) return { error: NO_KEY };
  const clean = cleanBrief(brief);
  const problem = briefProblem(clean);
  if (problem) return { error: problem };
  try {
    const plan = await generateCampaignPlan(clean, cleanTrend(trend), businessContext(business));
    if (!plan.name || !plan.starterContent.length) return { error: "Sense AI returned an incomplete plan. Try again." };
    return { plan };
  } catch (err) {
    return { error: err.message || "Couldn't generate the campaign. Try again." };
  }
}

/**
 * "+ Use a trend" picker: the workspace's latest trends (starred first), loaded when
 * the picker opens. No AI and no scraping, just a read of saved results.
 */
export async function listPickerTrends() {
  const { supabase, userId, workspaceId } = await currentWorkspace();
  if (!workspaceId) return { trends: [], audiences: [] };
  const [latest, stars] = await Promise.all([
    getLatestTrends(),
    supabase.from("watchlist").select("trend_key").eq("user_id", userId).eq("workspace_id", workspaceId),
  ]);
  const starred = new Set((stars.data ?? []).map((r) => r.trend_key));
  const trends = latest.trends
    .map((t) => ({ id: t.id, name: t.name, platform: t.platform, format: t.format, momentum: t.momentum, starred: starred.has(t.id) }))
    .sort((a, b) => Number(b.starred) - Number(a.starred) || b.momentum - a.momentum);
  return { trends, audiences: latest.audiences ?? [] };
}
