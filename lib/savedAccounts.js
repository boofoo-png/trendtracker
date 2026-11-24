"use client";

// Instagram-style account switching: other accounts signed in on this browser, so the
// account menu can flip between them without typing a password each time.
//
// Supabase keeps one session at a time (in cookies). For every other account we keep
// its refresh token here; switching swaps the cookies over to that account's session.
// Stored only in this browser, like the session itself.

import { createClient } from "@/lib/supabase/client";

const KEY = "trendtracker:accounts";

// A full page load, not router.push: everything the previous account loaded in memory
// (account data, My Content, calendar, trends) must start fresh for the new account.
const hardNavigate = (url) => {
  window.location.href = url;
};
const MAX = 5;

/** [{ userId, email, name, company, refreshToken, savedAt }] */
export function listSavedAccounts() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((a) => a?.userId && a?.refreshToken) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {}
}

export function forgetAccount(userId) {
  write(listSavedAccounts().filter((a) => a.userId !== userId));
}

/** Remember the account signed in right now (its latest refresh token and how to show it). */
async function saveCurrent(profile) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s?.refresh_token) return null;
  const entry = {
    userId: s.user.id,
    email: s.user.email ?? "",
    name: profile?.name ?? "",
    company: profile?.company ?? "",
    refreshToken: s.refresh_token,
    savedAt: Date.now(),
  };
  write([entry, ...listSavedAccounts().filter((a) => a.userId !== entry.userId)]);
  return entry;
}

/**
 * Drop this browser's session cookies WITHOUT telling Supabase to end the session
 * (signOut would revoke the refresh token we just saved).
 */
function clearSessionCookies() {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  for (const c of document.cookie.split("; ")) {
    const name = c.split("=")[0];
    if (name.startsWith(`sb-${ref}-auth-token`)) document.cookie = `${name}=; path=/; max-age=0`;
  }
}

/** "+ Add account": keep this account saved, then sign in (or sign up) as another. */
export async function addAccount(profile) {
  const saved = await saveCurrent(profile);
  clearSessionCookies();
  hardNavigate(`/login?add=1${saved ? `&back=${encodeURIComponent(saved.userId)}` : ""}`);
}

/**
 * Switch to a saved account. Saves the current one first (if any). If the saved login
 * no longer works (expired or signed out elsewhere), goes to the login page with the
 * email filled in. Returns only on failure, with { error }.
 */
export async function switchToAccount(userId, profile) {
  const target = listSavedAccounts().find((a) => a.userId === userId);
  if (!target) return { error: "That account isn't saved on this browser any more." };
  await saveCurrent(profile);
  clearSessionCookies();

  const supabase = createClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: target.refreshToken });
  if (error || !data.session) {
    forgetAccount(userId);
    hardNavigate(`/login?email=${encodeURIComponent(target.email)}&error=${encodeURIComponent("Please sign in again to switch to this account.")}`);
    return {};
  }
  forgetAccount(userId); // it's the active account now; the cookies hold its session
  hardNavigate("/overview");
  return {};
}
