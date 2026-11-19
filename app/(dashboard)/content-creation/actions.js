"use server";

// Triggered only by the Generate / Regenerate buttons on Content Creation screens.

import { isGeminiConfigured } from "@/lib/gemini/client";
import { generateContentFor } from "@/lib/gemini/content";
import { CONTENT_KINDS, FIELD_OPTIONS } from "@/lib/contentKinds";

const NO_KEY = "AI features are off: add GEMINI_API_KEY to .env.local.";
const LONG = new Set(["post", "text", "source", "fileText"]);

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
      out[key] = str(value, LONG.has(key) ? (key === "fileText" ? 12000 : 4000) : 600);
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
    hook: str(trend.hook, 200),
  };
}

const REQUIRED = {
  edit: ["post", "Paste or upload the post to edit."],
  improve: ["text", "Add the text to improve."],
  repurpose: ["source", "Paste or pick the content to repurpose."],
  upload: ["fileText", "Upload a text file or paste its content."],
  ad: ["product", "Say what product or service the ad is for."],
};

export async function generateContent(kind, fields, trend) {
  if (!CONTENT_KINDS[kind]) return { error: "Unknown content type." };
  if (!isGeminiConfigured()) return { error: NO_KEY };

  const clean = cleanFields(kind, fields);
  const [need, message] = REQUIRED[kind] ?? [];
  if (need && !clean[need]) return { error: message };
  if (!need && !clean.idea && !trend?.name) return { error: "Describe your idea first." };

  try {
    return { result: await generateContentFor(kind, clean, cleanTrend(trend)) };
  } catch (err) {
    return { error: err.message };
  }
}
