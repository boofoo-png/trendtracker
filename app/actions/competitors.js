"use server";

// Competitors page: track real competitors on Instagram (Business Discovery through the
// workspace's connected Instagram account). Numbers — yours and theirs — are saved and
// reused for a few hours, so the page can show them instantly and update in the
// background; "Refresh" fetches everything again.

import { currentWorkspace } from "@/lib/trendStore";
import { getConnection, saveSelfSnapshot } from "@/lib/meta";
import { cleanHandle, discover, lookupAccount } from "@/lib/competitors";

const FRESH_MS = 6 * 60 * 60 * 1000;
const MAX_COMPETITORS = 10;

const isStale = (at) => !at || Date.now() - Date.parse(at) > FRESH_MS;

async function context() {
  const { supabase, workspaceId } = await currentWorkspace();
  if (!workspaceId) return { error: "Not signed in." };
  const conn = await getConnection(workspaceId);
  return { supabase, workspaceId, conn, account: lookupAccount(conn) };
}

/** Your own numbers: the saved copy if it's fresh (and for the same account), else Instagram. */
async function mine({ workspaceId, conn, account }, { refresh, savedOnly }) {
  const saved =
    conn?.self_snapshot?.username === account.username
      ? conn.self_snapshot
      : null;
  const stale = !saved || isStale(conn.self_snapshot_at);
  if (savedOnly || (!refresh && !stale)) return { value: saved, stale };
  try {
    const value = await discover(account, account.username);
    await saveSelfSnapshot(workspaceId, value);
    return { value, stale: false };
  } catch (err) {
    return { value: saved, error: err.message, stale: false };
  }
}

/**
 * { connected, me, meError, stale, competitors: [{ id, handle, stats, updatedAt, error }] }
 * savedOnly: true answers from saved numbers only (instant; `stale` says whether a
 *   normal call would update anything).
 * refresh: true fetches everything again; otherwise only what's older than 6 hours.
 */
export async function getCompetitors({
  refresh = false,
  savedOnly = false,
} = {}) {
  const ctx = await context();
  if (ctx.error) return { connected: false, error: ctx.error, competitors: [] };
  const { supabase, account } = ctx;

  const { data: rows, error } = await supabase
    .from("competitors")
    .select("id, name, handles, snapshot, snapshot_at, created_at")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at");
  if (error)
    return {
      connected: Boolean(account),
      error: error.message,
      competitors: [],
    };

  const saved = (r) => ({
    id: r.id,
    handle: r.handles?.instagram ?? r.name,
    stats: r.snapshot,
    updatedAt: r.snapshot_at,
  });
  if (!account) return { connected: false, competitors: rows.map(saved) };

  const [competitors, me] = await Promise.all([
    Promise.all(
      rows.map(async (r) => {
        if (savedOnly || (!refresh && !isStale(r.snapshot_at))) return saved(r);
        const handle = r.handles?.instagram ?? r.name;
        try {
          const stats = await discover(account, handle);
          const updatedAt = new Date().toISOString();
          await supabase
            .from("competitors")
            .update({ snapshot: stats, snapshot_at: updatedAt })
            .eq("id", r.id);
          return { id: r.id, handle, stats, updatedAt };
        } catch (err) {
          // Keep showing the last numbers we had, with the reason they couldn't update.
          return { ...saved(r), error: err.message };
        }
      }),
    ),
    mine(ctx, { refresh, savedOnly }),
  ]);

  const stale =
    savedOnly && (me.stale || rows.some((r) => isStale(r.snapshot_at)));
  return {
    connected: true,
    me: me.value ?? null,
    meError: me.error ?? null,
    stale,
    competitors,
  };
}

/** Look up @handle and start tracking it. */
export async function addCompetitor(raw) {
  const handle = cleanHandle(raw);
  if (!handle)
    return { error: "Enter an Instagram username, like @starbucks." };
  const ctx = await context();
  if (ctx.error) return { error: ctx.error };
  const { supabase, workspaceId, account } = ctx;
  if (!account)
    return {
      error:
        "Connect your Instagram account first (Settings → Connected accounts).",
    };
  if (handle === account.username)
    return { error: "That's your own account. Add a competitor's username." };

  const { count } = await supabase
    .from("competitors")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if ((count ?? 0) >= MAX_COMPETITORS)
    return { error: `You can track up to ${MAX_COMPETITORS} competitors.` };

  let stats;
  try {
    stats = await discover(account, handle);
  } catch (err) {
    return { error: err.message };
  }
  const { error } = await supabase.from("competitors").insert({
    workspace_id: workspaceId,
    name: stats.username,
    handles: { instagram: stats.username },
    snapshot: stats,
    snapshot_at: new Date().toISOString(),
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? `You're already tracking @${stats.username}.`
          : error.message,
    };
  return { ok: true };
}

export async function removeCompetitor(id) {
  const ctx = await context();
  if (ctx.error) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("competitors")
    .delete()
    .eq("id", String(id))
    .eq("workspace_id", ctx.workspaceId);
  return error ? { error: error.message } : { ok: true };
}
