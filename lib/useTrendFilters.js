"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { trends as sampleTrends } from "./trends";
import { ADVICE_RANK, getAdvice } from "./advice";
import { planTrendSearch, runTrendSearch } from "@/app/(dashboard)/audience-trends/actions";
import useAudiences from "./useAudiences";
import { FIT_ENABLED } from "./features";

const WATCHLIST_KEY = "trendtracker:watchlist";
const EMPTY = { trends: [], updatedAt: null, audiences: [], hashtags: [], errors: [] };

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
  const audienceState = useAudiences();
  const { audiences } = audienceState;

  const [depth, setDepth] = useState("All");
  const [source, setSource] = useState("All platforms");
  const [selectedTrendId, setSelectedTrendId] = useState(null);
  const [watchlist, setWatchlist] = useState(() => new Set());

  // Search flow: plan (Gemini, free) → confirm → run (Apify, costs credits).
  // { audiences, hashtags: [{tag, audience}], error } | null
  const [searchPlan, setSearchPlan] = useState(null);
  const [isPlanning, startPlanning] = useTransition();
  const [isRunning, startRunning] = useTransition();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "[]");
      // Read after mount so server and client markup match on hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWatchlist(new Set(saved));
    } catch {}
  }, []);

  const toggleWatch = (id) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const planSearch = () => {
    const forAudiences = [...audiences];
    startPlanning(async () => {
      const res = await planTrendSearch(forAudiences);
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
      const res = await runTrendSearch(forAudiences, hashtags.map((h) => h.tag));
      if (res.trends?.length) {
        setLive({ ...EMPTY, ...res });
        setSearchPlan(null);
        setSelectedTrendId(null);
      } else {
        setSearchPlan((p) => p && { ...p, error: res.errors?.join(" · ") || "Search failed." });
      }
    });
  };

  const isSample = live.trends.length === 0;
  const allTrends = isSample ? sampleTrends : live.trends;

  const filteredTrends = useMemo(
    () =>
      allTrends
        .filter((t) => depth === "All" || t.depth === depth)
        .filter((t) => source === "All platforms" || t.platform === source)
        .map((t) => withAudienceFit(t, audiences))
        .map((t) => ({ ...t, advice: getAdvice(t.momentum, t.fit) }))
        .sort(
          (a, b) =>
            ADVICE_RANK.indexOf(a.advice) - ADVICE_RANK.indexOf(b.advice) ||
            b.momentum - a.momentum,
        ),
    [allTrends, depth, source, audiences],
  );

  const selectedTrend =
    filteredTrends.find((t) => t.id === selectedTrendId) ?? filteredTrends[0] ?? null;

  // Starred trends from the current data, ignoring depth/source filters.
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
    depth, setDepth,
    source, setSource,
    selectedTrend, selectedTrendId, setSelectedTrendId,
    watchlist, toggleWatch, watchedTrends,
    filteredTrends,
    matchCount: filteredTrends.length,
    isSample,
    updatedAt: live.updatedAt,
    liveAudiences: live.audiences,
    liveHashtags: live.hashtags,
    errors: live.errors ?? [],
    searchPlan, isPlanning, isRunning,
    planSearch, removePlanTag, cancelSearch, runSearch,
  };
}
