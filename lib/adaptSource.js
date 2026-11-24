"use client";

// "Adapt for other platforms" handoff: the content to adapt is carried to
// /content-creation/repurpose in this browser tab (sessionStorage), so the tool
// opens with it filled in. Per-tab convenience only; nothing important lives here.

const KEY = "trendtracker:adapt-source";
export const ADAPT_PATH = "/content-creation/repurpose";

/** returnTo: { href, label } for the Back link on the Adapt screen. */
export function setAdaptSource(text, returnTo = null) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ text: String(text ?? ""), returnTo }));
  } catch {}
}

/** { text, returnTo } waiting for the Adapt screen, removed once read; or null. */
export function takeAdaptSource() {
  try {
    const entry = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    sessionStorage.removeItem(KEY);
    return entry?.text ? entry : null;
  } catch {
    return null;
  }
}
