"use client";

// The signed-in user's account data from Supabase, shared by every component in the
// app shell: profile + workspace (Settings) and saved/selected audiences.
// Loaded once in the browser after sign-in; writes go straight to Supabase (RLS
// limits them to the user's own rows and workspace).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cleanBusiness } from "@/lib/business";
import { connectContentStore } from "@/lib/contentStore";
import { WORKSPACE_COOKIE, pickMembership } from "@/lib/workspaceChoice";

const readCookie = (name) =>
  typeof document === "undefined"
    ? null
    : decodeURIComponent(document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? "") || null;

/** Settings → Timezone labels and the IANA zone saved in profiles.timezone. */
export const TIMEZONE_ZONES = {
  "Pacific Time (PT)": "America/Vancouver",
  "Mountain Time (MT)": "America/Edmonton",
  "Central Time (CT)": "America/Winnipeg",
  "Eastern Time (ET)": "America/Toronto",
};
const ZONE_LABELS = Object.fromEntries(Object.entries(TIMEZONE_ZONES).map(([label, zone]) => [zone, label]));

// localStorage keys from before accounts existed. Imported once, then removed.
const LEGACY_SETTINGS = "trendtracker:settings";
const LEGACY_AUDIENCES = "trendtracker:audiences";

const norm = (s) => s.trim().toLowerCase();
const cut = (v, n) => String(v ?? "").trim().slice(0, n);

function readLegacy(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function dropLegacy(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** "Mary Ann Smith" -> ["Mary", "Ann Smith"]. Only for data saved before first/last existed. */
function splitName(full) {
  const [first = "", ...rest] = String(full ?? "").trim().split(/\s+/);
  return [first, rest.join(" ")];
}

/** profiles + workspaces rows -> the flat shape the Settings UI edits. */
function toSettings(profile, workspace, email) {
  const [first, last] =
    profile?.first_name || profile?.last_name ? [profile.first_name, profile.last_name] : splitName(profile?.full_name);
  return {
    firstName: first ?? "",
    lastName: last ?? "",
    name: profile?.full_name ?? "",
    role: profile?.job_role ?? "",
    email: email ?? "",
    phone: profile?.phone ?? "",
    company: workspace?.company ?? "",
    website: workspace?.website ?? "",
    industry: workspace?.industry,
    customers: workspace?.customer_type,
    description: workspace?.description ?? "",
    keywords: (workspace?.keywords ?? []).join(", "),
    timezone: ZONE_LABELS[profile?.timezone],
    alerts: profile?.alert_prefs,
  };
}

function profileRow(s) {
  // Older saved settings (this browser, before accounts) only have `name`.
  const [f, l] = s.firstName !== undefined || s.lastName !== undefined ? [s.firstName, s.lastName] : splitName(s.name);
  const first = cut(f, 40);
  const last = cut(l, 40);
  return {
    first_name: first,
    last_name: last,
    full_name: `${first} ${last}`.trim().slice(0, 80),
    job_role: cut(s.role, 80),
    phone: cut(s.phone, 40),
    timezone: TIMEZONE_ZONES[s.timezone] ?? TIMEZONE_ZONES["Pacific Time (PT)"],
    alert_prefs: s.alerts ?? {},
  };
}

function workspaceRow(s) {
  const b = cleanBusiness(s);
  return {
    company: b.company,
    website: cut(s.website, 200),
    industry: b.industry,
    customer_type: b.customers,
    description: b.description,
    keywords: b.keywords,
  };
}

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const supabase = createClient();
  const [state, setState] = useState({
    loaded: false,
    error: null,
    userId: null,
    workspaceId: null,
    workspaces: [], // [{ id, company, role }] every business this user belongs to
    settings: {},
    audiences: [], // [{ id, name }]
    selected: [], // audience names
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const load = useCallback(async () => {
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) {
      setState((s) => ({ ...s, loaded: true, error: "Not signed in." }));
      return null;
    }
    const [profile, memberships] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces (*)")
        .eq("user_id", userId)
        .order("created_at"),
    ]);
    // Every business this user belongs to; the active one is picked in the account menu.
    const active = pickMembership(memberships.data, readCookie(WORKSPACE_COOKIE));
    const membership = { data: active, error: memberships.error };
    const workspaces = (memberships.data ?? []).map((m) => ({
      id: m.workspace_id,
      company: m.workspaces?.company ?? "",
      role: m.role,
    }));
    const workspaceId = active?.workspace_id ?? null;
    const [audiences, selections] = workspaceId
      ? await Promise.all([
          supabase.from("audiences").select("id, name").eq("workspace_id", workspaceId).order("created_at"),
          supabase.from("audience_selections").select("audience_id").eq("user_id", userId),
        ])
      : [{ data: [] }, { data: [] }];

    const error = profile.error ?? membership.error ?? audiences.error ?? selections.error;
    const picked = new Set((selections.data ?? []).map((r) => r.audience_id));
    const next = {
      loaded: true,
      error: error ? error.message : workspaceId ? null : "No workspace found for this account.",
      userId,
      workspaceId,
      workspaces,
      settings: toSettings(profile.data, membership.data?.workspaces, claims.claims.email),
      audiences: audiences.data ?? [],
      selected: (audiences.data ?? []).filter((a) => picked.has(a.id)).map((a) => a.name),
    };
    setState(next);
    if (workspaceId) connectContentStore(supabase, workspaceId, userId); // My Content + calendar
    return next;
  }, [supabase]);

  // ---- Settings ----------------------------------------------------------

  /** Save the whole settings object. Resolves to { error?, emailPending? }. */
  const saveSettings = useCallback(
    async (nextOrFn) => {
      const cur = stateRef.current;
      const next = typeof nextOrFn === "function" ? nextOrFn(cur.settings) : nextOrFn;
      if (!cur.userId || !cur.workspaceId) return { error: "Not signed in." };
      const emailChanged = next.email && norm(next.email) !== norm(cur.settings.email ?? "");

      // Show the change right away; the email only changes once it's confirmed.
      setState((s) => ({
        ...s,
        settings: { ...next, email: s.settings.email },
        // Keep the business list in the account menu in step with the new name.
        workspaces: s.workspaces.map((w) => (w.id === cur.workspaceId ? { ...w, company: cleanBusiness(next).company } : w)),
      }));

      const [p, w] = await Promise.all([
        supabase.from("profiles").update(profileRow(next)).eq("id", cur.userId),
        supabase.from("workspaces").update(workspaceRow(next)).eq("id", cur.workspaceId),
      ]);
      let error = p.error?.message ?? w.error?.message ?? null;
      let emailPending = false;
      if (!error && emailChanged) {
        const res = await supabase.auth.updateUser({ email: next.email.trim() });
        if (res.error) error = res.error.message;
        else emailPending = true;
      }
      if (error) await load(); // put back what's really saved
      return { error, emailPending };
    },
    [supabase, load],
  );

  // ---- Audiences ---------------------------------------------------------

  const addAudience = useCallback(
    async (name) => {
      const cur = stateRef.current;
      const clean = name.replace(/\s+/g, " ").trim().slice(0, 60);
      if (!clean || !cur.workspaceId) return;
      let audience = cur.audiences.find((a) => norm(a.name) === norm(clean));
      if (!audience) {
        const { data, error } = await supabase
          .from("audiences")
          .upsert(
            { workspace_id: cur.workspaceId, name: clean, source: "custom", created_by: cur.userId },
            { onConflict: "workspace_id,name" },
          )
          .select("id, name")
          .single();
        if (error) return console.error("Saving audience failed:", error.message);
        audience = data;
      }
      setState((s) => ({
        ...s,
        audiences: s.audiences.some((a) => a.id === audience.id) ? s.audiences : [...s.audiences, audience],
        selected: s.selected.includes(audience.name) ? s.selected : [...s.selected, audience.name],
      }));
      const { error } = await supabase
        .from("audience_selections")
        .upsert({ user_id: cur.userId, audience_id: audience.id }, { ignoreDuplicates: true });
      if (error) console.error("Selecting audience failed:", error.message);
    },
    [supabase],
  );

  const removeAudience = useCallback(
    async (name) => {
      const audience = stateRef.current.audiences.find((a) => a.name === name);
      if (!audience) return;
      setState((s) => ({
        ...s,
        audiences: s.audiences.filter((a) => a.id !== audience.id),
        selected: s.selected.filter((n) => n !== name),
      }));
      const { error } = await supabase.from("audiences").delete().eq("id", audience.id);
      if (error) {
        console.error("Removing audience failed:", error.message);
        load();
      }
    },
    [supabase, load],
  );

  const toggleAudience = useCallback(
    async (name) => {
      const cur = stateRef.current;
      const audience = cur.audiences.find((a) => a.name === name);
      if (!audience) return;
      const on = cur.selected.includes(name);
      setState((s) => ({ ...s, selected: on ? s.selected.filter((n) => n !== name) : [...s.selected, name] }));
      const { error } = on
        ? await supabase.from("audience_selections").delete().eq("user_id", cur.userId).eq("audience_id", audience.id)
        : await supabase.from("audience_selections").upsert({ user_id: cur.userId, audience_id: audience.id }, { ignoreDuplicates: true });
      if (error) {
        console.error("Updating audience selection failed:", error.message);
        load();
      }
    },
    [supabase, load],
  );

  // ---- First load + one-time import of this browser's old data ------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const acct = await load();
      if (cancelled || !acct?.workspaceId) return;

      const oldSettings = readLegacy(LEGACY_SETTINGS);
      if (oldSettings && !acct.settings.name && !acct.settings.company) {
        const { error } = await saveSettings({ ...acct.settings, ...oldSettings, email: acct.settings.email });
        if (!error) dropLegacy(LEGACY_SETTINGS);
      } else if (oldSettings) {
        dropLegacy(LEGACY_SETTINGS); // account already set up; don't overwrite it
      }

      const oldAudiences = readLegacy(LEGACY_AUDIENCES);
      if (Array.isArray(oldAudiences?.saved) && oldAudiences.saved.length && !acct.audiences.length) {
        const rows = [...new Map(oldAudiences.saved.map((n) => [norm(String(n)), cut(n, 60)])).values()]
          .filter(Boolean)
          .map((name) => ({ workspace_id: acct.workspaceId, name, source: "custom", created_by: acct.userId }));
        const { data, error } = await supabase
          .from("audiences")
          .upsert(rows, { onConflict: "workspace_id,name" })
          .select("id, name");
        if (!error) {
          const picked = new Set((oldAudiences.selected ?? []).map((n) => norm(String(n))));
          const selections = data.filter((a) => picked.has(norm(a.name))).map((a) => ({ user_id: acct.userId, audience_id: a.id }));
          if (selections.length) await supabase.from("audience_selections").upsert(selections, { ignoreDuplicates: true });
          dropLegacy(LEGACY_AUDIENCES);
          if (!cancelled) load();
        }
      } else if (oldAudiences) {
        dropLegacy(LEGACY_AUDIENCES);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, saveSettings, supabase]);

  const value = useMemo(
    () => ({ ...state, saveSettings, addAudience, removeAudience, toggleAudience, reload: load }),
    [state, saveSettings, addAudience, removeAudience, toggleAudience, load],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider> (the app shell).");
  return ctx;
}
