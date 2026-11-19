// The Campaign brief on Content Creation → Campaign (from the Figma Make "Create Campaign"
// screen). Shared by the form and the server action that validates it.

export const CAMPAIGN_GOALS = [
  ["Awareness", "Introduce your product or service to a new audience."],
  ["Leads", "Drive sign-ups, enquiries or qualified interest."],
  ["Sales", "Convert interest into purchases and revenue."],
];

export const CAMPAIGN_FOCUS = [
  ["Product", "A physical or digital product."],
  ["Service", "A service, booking or subscription."],
  ["Event", "A launch, pop-up, webinar or appearance."],
  ["Sale or offer", "A discount, bundle or limited-time deal."],
];

export const CAMPAIGN_CHANNELS = [
  ["Instagram", "Visual storytelling for product and brand."],
  ["TikTok", "Short-form video to reach new audiences."],
  ["YouTube", "Longer demos, tutorials and Shorts."],
  ["Facebook", "Community, local reach and paid social."],
  ["Email", "Nurture subscribers and warm leads."],
  ["Blog", "Search traffic and in-depth proof."],
];

export const AUDIENCE_TYPES = ["B2C", "B2B", "Both"];

export const EMPTY_BRIEF = {
  goal: "Awareness",
  targetMetric: "",
  targetValue: "",
  targetReason: "",
  focus: "Product",
  offer: "",
  cta: "",
  audienceName: "",
  audienceDescription: "",
  audienceType: "",
  segments: [],
  location: "",
  role: "",
  interests: "",
  painPoints: "",
  valueProposition: "",
  coreMessage: "",
  channels: ["Instagram"],
  contentFormats: "",
  days: 30,
  budget: "",
  launchDate: "",
  summary: "",
};

const names = (list) => list.map(([n]) => n);
const str = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const LONG = new Set(["offer", "audienceDescription", "painPoints", "valueProposition", "targetReason", "summary"]);

/** Validated brief. Unknown choices fall back to defaults; text is clipped. */
export function cleanBrief(raw) {
  const out = {};
  for (const [key, fallback] of Object.entries(EMPTY_BRIEF)) {
    const v = raw?.[key];
    if (key === "goal") out.goal = names(CAMPAIGN_GOALS).includes(v) ? v : fallback;
    else if (key === "focus") out.focus = names(CAMPAIGN_FOCUS).includes(v) ? v : fallback;
    else if (key === "audienceType") out.audienceType = AUDIENCE_TYPES.includes(v) ? v : "";
    else if (key === "channels")
      out.channels = [...new Set((Array.isArray(v) ? v : []).filter((c) => names(CAMPAIGN_CHANNELS).includes(c)))];
    else if (key === "segments")
      out.segments = [...new Set((Array.isArray(v) ? v : []).map((s) => str(s, 60)).filter(Boolean))].slice(0, 8);
    else if (key === "days") out.days = Math.min(90, Math.max(7, Math.round(Number(v) || fallback)));
    else if (key === "launchDate") out.launchDate = /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : "";
    else out[key] = str(v, LONG.has(key) ? 600 : 160);
  }
  return out;
}

/** First problem that stops generation, or null. */
export function briefProblem(b) {
  if (!b.offer) return "Describe what the campaign promotes (step 3).";
  if (!b.audienceName && !b.segments.length) return "Name the audience or pick a segment (step 4).";
  if (!b.channels.length) return "Choose at least one channel (step 6).";
  return null;
}
