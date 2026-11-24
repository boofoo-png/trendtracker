import "server-only";

// Trend search results, saved per workspace in Supabase (trend_searches, trends,
// posts, search_posts). Each search is a new snapshot; the page shows the newest
// finished one for the signed-in user's workspace.

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { WORKSPACE_COOKIE, pickMembership } from "@/lib/workspaceChoice";
import { createAdminClient } from "@/lib/supabase/admin";

const EMPTY = { trends: [], updatedAt: null, audiences: [], hashtags: [], errors: [] };
const POST_TEXT_MAX = 140; // what the UI shows; full captions stay in posts.text

/** The signed-in user and their active workspace (chosen in the account menu; else the first). */
export async function currentWorkspace() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { supabase, userId: null, workspaceId: null };
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("created_at");
  const preferred = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  return { supabase, userId, workspaceId: pickMembership(data, preferred)?.workspace_id ?? null };
}

/** Newest finished search for this workspace, in the shape the Audience Trends page uses. */
export async function getLatestTrends() {
  const { supabase, workspaceId } = await currentWorkspace();
  if (!workspaceId) return EMPTY;

  // RLS limits every read below to the user's own workspace.
  const { data: search, error } = await supabase
    .from("trend_searches")
    .select("id, audiences, hashtags, finished_at")
    .eq("workspace_id", workspaceId)
    .in("status", ["succeeded", "partial"])
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ...EMPTY, errors: [error.message] };
  if (!search) return EMPTY;

  const { data: rows, error: trendsError } = await supabase.from("trends").select("*").eq("search_id", search.id);
  if (trendsError) return { ...EMPTY, errors: [trendsError.message] };

  const postIds = [...new Set(rows.flatMap((r) => r.top_post_ids))];
  const { data: posts } = postIds.length
    ? await supabase.from("posts").select("id, platform, format, url, embed_url, text, likes, views").in("id", postIds)
    : { data: [] };
  const byId = new Map((posts ?? []).map((p) => [p.id, p]));

  return {
    ...EMPTY,
    updatedAt: new Date(search.finished_at).getTime(),
    audiences: search.audiences,
    hashtags: (search.hashtags ?? []).map((h) => (typeof h === "string" ? h : h.tag)),
    trends: rows.map((r) => ({
      id: r.trend_key,
      name: r.name,
      platform: r.platform,
      format: r.format,
      postCount: r.post_count,
      change: r.change_pct,
      fit: r.fit,
      history: r.history,
      momentum: r.momentum,
      depth: r.depth,
      angle: r.angle,
      audienceFit: r.audience_fit ?? {},
      topPosts: r.top_post_ids
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((p) => ({
          id: p.id,
          platform: p.platform,
          format: p.format,
          url: p.url,
          embedUrl: p.embed_url,
          text: p.text.slice(0, POST_TEXT_MAX),
          likes: Number(p.likes),
          views: Number(p.views),
        })),
    })),
  };
}

/** Records a search as running before anything is scraped. Returns its id. */
export async function startTrendSearch({ workspaceId, userId, audiences, hashtags, estCost }) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trend_searches")
    .insert({
      workspace_id: workspaceId,
      run_by: userId,
      audiences,
      hashtags: hashtags.map((tag) => ({ tag })),
      est_cost_usd: estCost,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't save the search: ${error.message}`);
  return data.id;
}

/** Marks a search failed (nothing scraped, or no trends found). */
export async function failTrendSearch(searchId, errors) {
  await createAdminClient()
    .from("trend_searches")
    .update({ status: "failed", errors, finished_at: new Date().toISOString() })
    .eq("id", searchId);
}

const dedupe = (list, key) => [...new Map(list.map((x) => [key(x), x])).values()];
const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

/**
 * Saves a finished search: the scraped posts (shared public data), which posts this
 * search returned, and its trends. Uses the service role because posts and
 * search_posts are server-written only.
 */
export async function finishTrendSearch(searchId, { workspaceId, posts, trends, errors, finishedAt }) {
  const admin = createAdminClient();
  const now = new Date(finishedAt).toISOString();

  const postRows = dedupe(posts, (p) => p.id).map((p) => ({
    id: p.id,
    platform: p.platform,
    text: p.text ?? "",
    hashtags: p.hashtags ?? [],
    format: p.format,
    url: p.url,
    embed_url: p.embedUrl,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    views: p.views,
    posted_at: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    last_seen_at: now,
  }));
  for (const batch of chunks(postRows, 500)) {
    const { error } = await admin.from("posts").upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`Couldn't save posts: ${error.message}`);
  }

  const links = dedupe(posts, (p) => p.id).map((p) => ({ search_id: searchId, post_id: p.id, query_tag: p.queryTag }));
  for (const batch of chunks(links, 500)) {
    const { error } = await admin.from("search_posts").upsert(batch, { ignoreDuplicates: true });
    if (error) throw new Error(`Couldn't save posts: ${error.message}`);
  }

  const trendRows = trends.map((t) => ({
    search_id: searchId,
    workspace_id: workspaceId,
    trend_key: t.id,
    name: t.name,
    platform: t.platform,
    format: t.format ?? null,
    depth: t.depth,
    post_count: t.postCount ?? 0,
    momentum: Math.max(0, Math.min(100, Math.round(t.momentum))),
    change_pct: Math.round(t.change ?? 0),
    fit: t.fit == null ? null : Math.max(0, Math.min(100, Math.round(t.fit))),
    audience_fit: t.audienceFit && Object.keys(t.audienceFit).length ? t.audienceFit : null,
    history: t.history ?? [],
    top_post_ids: (t.topPosts ?? []).map((p) => p.id),
    angle: t.angle ?? null,
  }));
  const { error: trendsError } = await admin.from("trends").insert(trendRows);
  if (trendsError) throw new Error(`Couldn't save trends: ${trendsError.message}`);

  const { error } = await admin
    .from("trend_searches")
    .update({
      status: errors.length ? "partial" : "succeeded",
      errors,
      post_count: postRows.length,
      finished_at: now,
    })
    .eq("id", searchId);
  if (error) throw new Error(`Couldn't save the search: ${error.message}`);
}
