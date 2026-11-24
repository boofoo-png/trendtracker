"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { trends as sampleTrends } from "./trends";
import { ADVICE_RANK, getAdvice } from "./advice";
import { checkTrendSearch, planTrendSearch, runTrendSearch } from "@/app/(dashboard)/audience-trends/actions";
import useAudiences from "./useAudiences";
import { FIT_ENABLED } from "./features";
import { useBusiness } from "./settings";
import { useAccount } from "./account";
import { createClient } from "./supabase/client";

const LEGACY_WATCHLIST = "trendtracker:watchlist"; // localStorage, before accounts
const EMPTY = { trends: [], updatedAt: null, audiences: [], hashtags: [], errors: [] };
const POLL_MS = 10_000; // how often to check on a search started elsewhere

/** Average the stored per-audience Gemini fit over the selected audiences that have one. */
function withAudienceFit(trend, selected) {
  if (!FIT_ENABLED) return trend;
  const hits = selected
    .filter((a) => trend.audienceFit?.[a])
    .map((a) => ({ audience: a, ...trend.audienceFit[a] }));
  if (hits.length === 0) return trend;
  return {
    ...trend,
    baseFit: trend.fit,
    fit: Math.round(hits.reduce((sum, h) => sum + h.fit, 0) / hits.length),
    fitReasons: hits,
  };
}

export default function useTrendFilters(initial) {
  const [live, setLive] = useState({ ...EMPTY, ...initial });
  // A search that was already running when the page opened (started before leaving
  // the page, in another tab, or by a teammate): { startedAt, audiences } | null.
  const [background, setBackground] = useState(initial?.running ?? null);
  const [backgroundNote, setBackgroundNote] = useState(null);
  const audienceState = useAudiences();
  const { audiences } = audienceState;
  const business = useBusiness();
  const { userId, workspaceId } = useAccount();
  const supabase = createClient();

  const [source, setSource] = useState("All platforms");
  const [selectedTrendId, setSelectedTrendId] = useState(null);
  const [watchlist, setWatchlist] = useState(() => new Set());
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);

  // Search flow: plan (Gemini, free) → confirm → run (Apify, costs credits).
  // { audiences, hashtags: [{tag, audience}], error } | null
  const [searchPlan, setSearchPlan] = useState(null);
  const [isPlanning, startPlanning] = useTransition();
  const [isRunning, startRunning] = useTransition();

  const isSample = live.trends.length === 0;
  const allTrends = isSample ? sampleTrends : live.trends;

  // Starred trends live in Supabase (per user and workspace), keyed by trend id.
  const rowFor = (id) => {
    const t = allTrends.find((x) => x.id === id);
    return { user_id: userId, workspace_id: workspaceId, trend_key: id, name: t?.name ?? id, platform: t?.platform ?? "" };
  };
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("watchlist").select("trend_key").eq("workspace_id", workspaceId);
      if (cancelled) return;
      if (error) console.error("Loading watchlist failed:", error.message);
      let keys = (data ?? []).map((r) => r.trend_key);

      // One-time import of the stars saved in this browser before accounts existed.
      let legacy = null;
      try {
        legacy = JSON.parse(localStorage.getItem(LEGACY_WATCHLIST) ?? "null");
      } catch {}
      if (!error && Array.isArray(legacy)) {
        const fresh = legacy.filter((id) => typeof id === "string" && !keys.includes(id));
        const res = fresh.length
          ? await supabase.from("watchlist").upsert(fresh.map(rowFor), { ignoreDuplicates: true })
          : { error: null };
        if (!res.error) {
          keys = [...keys, ...fresh];
          try {
            localStorage.removeItem(LEGACY_WATCHLIST);
          } catch {}
        }
      }
      if (cancelled) return;
      setWatchlist(new Set(keys));
      setWatchlistLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // Load once per workspace; rowFor only needs the trends shown at that time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, workspaceId]);

  const toggleWatch = async (id) => {
    if (!workspaceId) return;
    const on = watchlist.has(id);
    const flip = (prev) => {
      const next = new Set(prev);
      on ? next.delete(id) : next.add(id);
      return next;
    };
    setWatchlist(flip);
    const { error } = on
      ? await supabase.from("watchlist").delete().eq("user_id", userId).eq("workspace_id", workspaceId).eq("trend_key", id)
      : await supabase.from("watchlist").upsert(rowFor(id), { ignoreDuplicates: true });
    if (error) {
      console.error("Updating watchlist failed:", error.message);
      setWatchlist((prev) => {
        const next = new Set(prev);
        on ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  // Check on that search every few seconds; show its results when it's done.
  useEffect(() => {
    if (!background) return;
    let alive = true;
    const timer = setInterval(async () => {
      const latest = await checkTrendSearch().catch(() => null);
      if (!alive || !latest || latest.running) return;
      const fresh = latest.updatedAt && latest.updatedAt >= background.startedAt;
      if (fresh) setLive({ ...EMPTY, ...latest });
      setBackgroundNote(fresh ? null : "The search that was running didn’t find any trends. Try different audiences or hashtags.");
      setBackground(null);
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [background]);

  const planSearch = () => {
    const forAudiences = [...audiences];
    startPlanning(async () => {
      const res = await planTrendSearch(forAudiences, business);
      setSearchPlan({ audiences: forAudiences, hashtags: res.hashtags ?? [], error: res.error ?? null });
    });
  };

  const removePlanTag = (tag) =>
    setSearchPlan((p) => p && { ...p, hashtags: p.hashtags.filter((h) => h.tag !== tag) });

  const cancelSearch = () => setSearchPlan(null);

  const runSearch = () => {
    if (!searchPlan?.hashtags.length) return;
    const { audiences: forAudiences, hashtags } = searchPlan;
    startRunning(async () => {
      const res = await runTrendSearch(forAudiences, hashtags.map((h) => h.tag), business);
      if (res.running) {
        // Another search beat this one to it: wait for that one instead.
        setBackground(res.running);
        setSearchPlan(null);
      } else if (res.trends?.length) {
        setLive({ ...EMPTY, ...res });
        setSearchPlan(null);
        setSelectedTrendId(null);
      } else {
        setSearchPlan((p) => p && { ...p, error: res.errors?.join(" · ") || "Search failed." });
      }
    });
  };

  const filteredTrends = useMemo(
    () =>
      allTrends
        .filter((t) => source === "All platforms" || t.platform === source)
        .map((t) => withAudienceFit(t, audiences))
        .map((t) => ({ ...t, advice: getAdvice(t.momentum, t.fit) }))
        .sort(
          (a, b) =>
            ADVICE_RANK.indexOf(a.advice) - ADVICE_RANK.indexOf(b.advice) ||
            b.momentum - a.momentum,
        ),
    [allTrends, source, audiences],
  );

  const selectedTrend =
    filteredTrends.find((t) => t.id === selectedTrendId) ?? filteredTrends[0] ?? null;

  // Starred trends from the current data, ignoring the source filter.
  const watchedTrends = useMemo(
    () =>
      allTrends
        .filter((t) => watchlist.has(t.id))
        .map((t) => withAudienceFit(t, audiences))
        .map((t) => ({
          ...t,
          advice: getAdvice(t.momentum, t.fit),
          hiddenByFilters: !filteredTrends.some((f) => f.id === t.id),
        })),
    [allTrends, watchlist, audiences, filteredTrends],
  );

  return {
    ...audienceState,
    source, setSource,
    selectedTrend, selectedTrendId, setSelectedTrendId,
    watchlist, watchlistLoaded, toggleWatch, watchedTrends,
    filteredTrends,
    matchCount: filteredTrends.length,
    isSample,
    updatedAt: live.updatedAt,
    liveAudiences: live.audiences,
    liveHashtags: live.hashtags,
    errors: [...(live.errors ?? []), ...(backgroundNote ? [backgroundNote] : [])],
    backgroundSearch: background,
    searchPlan, isPlanning, isRunning,
    planSearch, removePlanTag, cancelSearch, runSearch,
  };
}
