"use server";

// Real numbers for Overview and Reports, from the workspace's connected accounts:
// your Instagram (profile numbers + recent posts, and insights for the last N days),
// your Facebook Page's followers, your tracked competitors (saved snapshots) and your
// latest trend search. Nothing here is made up: anything unavailable comes back null,
// and the pages say what's needed instead.

import { currentWorkspace, getLatestTrends } from "@/lib/trendStore";
import { getConnection, igInsights, pageFollowers } from "@/lib/meta";
import { lookupAccount, ownStats } from "@/lib/competitors";
import { ADVICE_RANK, getAdvice } from "@/lib/advice";

const settle = async (p) => {
  try {
    return { value: await p };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * {
 *   connected, instagram: { username }, me (stats | null), meError,
 *   insights: { days, reach, views, accounts_engaged, total_interactions } | null, insightsError,
 *   facebook: { name, followers } | null,
 *   competitors: [{ handle, name, picture, followers, postsPerWeek, engagementRate, avgLikes }],
 *   trends: [{ name, platform, momentum, advice }], trendsFor: [audience names]
 * }
 * days: insights window (1–30).
 */
export async function getPerformance({ days = 7 } = {}) {
  const { supabase, workspaceId } = await currentWorkspace();
  if (!workspaceId) return { connected: false, error: "Not signed in." };

  const conn = await getConnection(workspaceId);
  const account = lookupAccount(conn);
  const page = conn?.pages?.find((p) => p.ig) ?? conn?.pages?.[0] ?? null;

  const [me, insights, facebook, competitorRows, latest] = await Promise.all([
    account ? ownStats({ workspaceId, conn, account }) : Promise.resolve({ value: null }),
    account ? settle(igInsights({ id: account.igId }, account.token, days)) : Promise.resolve({ value: null }),
    page ? settle(pageFollowers(page)) : Promise.resolve({ value: null }),
    supabase.from("competitors").select("handles, name, snapshot").eq("workspace_id", workspaceId).order("created_at"),
    getLatestTrends(),
  ]);

  const competitors = (competitorRows.data ?? [])
    .filter((r) => r.snapshot)
    .map((r) => ({
      handle: r.handles?.instagram ?? r.name,
      name: r.snapshot.name ?? "",
      picture: r.snapshot.picture ?? null,
      followers: r.snapshot.followers ?? null,
      postsPerWeek: r.snapshot.postsPerWeek ?? null,
      engagementRate: r.snapshot.engagementRate ?? null,
      avgLikes: r.snapshot.avgLikes ?? null,
    }));

  const trends = (latest.trends ?? [])
    .map((t) => ({ name: t.name, platform: t.platform, momentum: t.momentum, advice: getAdvice(t.momentum, t.fit) }))
    .sort((a, b) => ADVICE_RANK.indexOf(a.advice) - ADVICE_RANK.indexOf(b.advice) || b.momentum - a.momentum)
    .slice(0, 5);

  return {
    connected: Boolean(account),
    instagram: account ? { username: account.username } : null,
    me: me.value ?? null,
    meError: me.error ?? null,
    insights: insights.value ? { days, ...insights.value } : null,
    insightsError: insights.error ?? null,
    facebook: facebook.value ?? null,
    competitors,
    trackedCount: competitorRows.data?.length ?? 0, // includes competitors not looked up yet
    trends,
    trendsFor: latest.audiences ?? [],
    trendsUpdatedAt: latest.updatedAt ?? null,
  };
}

/**
 * Saved facts only (no Instagram calls, so it's quick): your last saved Instagram numbers,
 * your tracked competitors and your latest trends. Used by the notifications bell and
 * Sense AI. { connected, me, competitors, trends, trendsFor, trendsUpdatedAt }.
 */
export async function getSavedFacts() {
  const { supabase, workspaceId } = await currentWorkspace();
  if (!workspaceId) return { connected: false, me: null, competitors: [], trends: [], trendsFor: [] };
  const conn = await getConnection(workspaceId);
  const account = lookupAccount(conn);
  const [me, competitorRows, latest] = await Promise.all([
    account ? ownStats({ workspaceId, conn, account }, { savedOnly: true }) : Promise.resolve({ value: null }),
    supabase.from("competitors").select("handles, name, snapshot").eq("workspace_id", workspaceId).order("created_at"),
    getLatestTrends(),
  ]);
  const competitors = (competitorRows.data ?? [])
    .filter((r) => r.snapshot)
    .map((r) => ({
      handle: r.handles?.instagram ?? r.name,
      followers: r.snapshot.followers ?? null,
      postsPerWeek: r.snapshot.postsPerWeek ?? null,
      engagementRate: r.snapshot.engagementRate ?? null,
      avgLikes: r.snapshot.avgLikes ?? null,
      topFormat: r.snapshot.topFormat ?? null,
    }));
  const trends = (latest.trends ?? [])
    .map((t) => ({ id: t.id, name: t.name, platform: t.platform, momentum: t.momentum, change: t.change, advice: getAdvice(t.momentum, t.fit) }))
    .sort((a, b) => ADVICE_RANK.indexOf(a.advice) - ADVICE_RANK.indexOf(b.advice) || b.momentum - a.momentum)
    .slice(0, 10);
  const m = me.value;
  return {
    connected: Boolean(account),
    me: m
      ? {
          username: m.username,
          followers: m.followers,
          postsPerWeek: m.postsPerWeek,
          engagementRate: m.engagementRate,
          avgLikes: m.avgLikes,
          avgComments: m.avgComments,
          topFormat: m.topFormat,
        }
      : null,
    competitors,
    trends,
    trendsFor: latest.audiences ?? [],
    trendsUpdatedAt: latest.updatedAt ?? null,
  };
}
