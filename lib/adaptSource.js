"use client";

// "Adapt for other platforms" handoff: the content to adapt is carried to
// /content-creation/repurpose in this browser tab (sessionStorage), so the tool
// opens with it filled in. Per-tab convenience only; nothing important lives here.

const KEY = "trendtracker:adapt-source";
export const ADAPT_PATH = "/content-creation/repurpose";

export function setAdaptSource(text) {
  try {
    sessionStorage.setItem(KEY, String(text ?? ""));
  } catch {}
}

/** The waiting content, removed once read (so a later visit starts empty). */
export function takeAdaptSource() {
  try {
    const text = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return text || null;
  } catch {
    return null;
  }
}
