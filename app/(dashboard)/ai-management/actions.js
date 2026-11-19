"use server";

// Triggered only by "Create my plan" on the AI Management screen.

import { isGeminiConfigured } from "@/lib/gemini/client";
import { PLAN_CHANNELS, PLAN_FREQUENCIES, generatePostingPlan } from "@/lib/gemini/plan";
import { businessContext } from "@/lib/business";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function createPostingPlan({ goal, channels, perWeek, startWeekday, business } = {}) {
  if (!isGeminiConfigured()) return { error: "AI features are off: add GEMINI_API_KEY to .env.local." };

  const cleanGoal = String(goal ?? "").trim().slice(0, 500);
  if (cleanGoal.length < 5) return { error: "Describe what your content should achieve." };
  const picked = (Array.isArray(channels) ? channels : []).filter((c) => PLAN_CHANNELS.includes(c));
  if (!picked.length) return { error: "Choose at least one channel." };

  try {
    const plan = await generatePostingPlan({
      goal: cleanGoal,
      channels: picked,
      perWeek: PLAN_FREQUENCIES.includes(perWeek) ? perWeek : 3,
      startWeekday: WEEKDAYS.includes(startWeekday) ? startWeekday : "Monday",
      context: businessContext(business),
    });
    if (!plan.posts.length) return { error: "Sense AI didn't return any posts. Try again." };
    return { plan };
  } catch (e) {
    return { error: e.message || "Couldn't create the plan. Try again." };
  }
}
