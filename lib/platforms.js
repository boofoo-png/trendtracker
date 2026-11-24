// The social platforms the app plans and writes for, in one place so every screen
// (calendar, AI plan, creators, Adapt, Overview) offers the same ones.
// Trend search (Audience) is separate: it only collects Instagram and TikTok posts.

export const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "TikTok"];

/** Short codes for calendar chips. */
export const PLATFORM_CODES = { Instagram: "IG", Facebook: "FB", TikTok: "TT" };

/** "Adapt for other platforms" can also write a blog draft. */
export const ADAPT_TARGETS = [...SOCIAL_PLATFORMS, "Blog"];
