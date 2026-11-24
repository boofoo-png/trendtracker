"use client";

// The last result on each Content Creation screen (plus what was typed), so leaving
// the page doesn't lose it. Kept in this browser per workspace (so two accounts on one
// computer never see each other's drafts) and dropped after a week. A convenience:
// anything worth keeping is saved to My Content.

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const keyFor = (workspaceId, kind) => `trendtracker:draft:${workspaceId}:${kind}`;

/** { fields, result, savedId, at } or null. */
export function loadDraft(workspaceId, kind) {
  if (!workspaceId) return null;
  try {
    const draft = JSON.parse(localStorage.getItem(keyFor(workspaceId, kind)) ?? "null");
    if (!draft?.result || !draft.at || Date.now() - draft.at > MAX_AGE_MS) return null;
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(workspaceId, kind, draft) {
  if (!workspaceId) return;
  try {
    localStorage.setItem(keyFor(workspaceId, kind), JSON.stringify(draft));
  } catch {}
}

export function clearDraft(workspaceId, kind) {
  if (!workspaceId) return;
  try {
    localStorage.removeItem(keyFor(workspaceId, kind));
  } catch {}
}
