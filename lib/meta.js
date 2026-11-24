import "server-only";

// Facebook + Instagram via Facebook Login and the Graph API (graph.facebook.com).
// One connection covers the user's Facebook Pages and the Instagram professional
// accounts linked to them. Tokens stay on the server (meta_connections, service role).
//
// .env.local:
//   META_APP_ID, META_APP_SECRET    from developers.facebook.com → your app → App settings → Basic
//   META_LOGIN_CONFIG_ID (optional) Facebook Login for Business configuration ID. When set it's
//                                   sent instead of the permission list (Business-type apps).
//   META_GRAPH_VERSION (optional)   defaults to v26.0

import { createAdminClient } from "@/lib/supabase/admin";

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v26.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

// Read-only: list Pages, read Page posts, read the linked Instagram account and its insights.
export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
];

export const isMetaConfigured = () =>
  Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);

export function loginUrl({ redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
  });
  if (process.env.META_LOGIN_CONFIG_ID)
    params.set("config_id", process.env.META_LOGIN_CONFIG_ID);
  else params.set("scope", META_SCOPES.join(","));
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params}`;
}

/** GET a Graph API path. Throws with Meta's own message on errors. */
async function graph(path, params = {}) {
  const url = `${GRAPH}/${path.replace(/^\//, "")}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    const err = new Error(e.message || `Meta API error ${res.status}`);
    err.code = e.code;
    throw err;
  }
  return body;
}

/** Login code → long-lived user token, plus who logged in and their Pages. */
export async function exchangeCode({ code, redirectUri }) {
  const app = {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
  };
  const short = await graph("oauth/access_token", {
    ...app,
    redirect_uri: redirectUri,
    code,
  });
  const long = await graph("oauth/access_token", {
    ...app,
    grant_type: "fb_exchange_token",
    fb_exchange_token: short.access_token,
  });
  const token = long.access_token;
  const me = await graph("me", { fields: "id,name", access_token: token });
  const accounts = await graph("me/accounts", {
    fields: "id,name,access_token,instagram_business_account{id,username}",
    limit: "50",
    access_token: token,
  });
  const pages = (accounts.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    token: p.access_token,
    ig: p.instagram_business_account
      ? {
          id: p.instagram_business_account.id,
          username: p.instagram_business_account.username,
        }
      : null,
  }));
  return {
    fbUserId: me.id,
    fbUserName: me.name ?? "",
    userToken: token,
    expiresAt: long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000).toISOString()
      : null,
    pages,
  };
}

export async function saveConnection(workspaceId, userId, c) {
  const { error } = await createAdminClient().from("meta_connections").upsert({
    workspace_id: workspaceId,
    connected_by: userId,
    fb_user_id: c.fbUserId,
    fb_user_name: c.fbUserName,
    user_token: c.userToken,
    token_expires_at: c.expiresAt,
    pages: c.pages,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Couldn't save the connection: ${error.message}`);
}

export async function getConnection(workspaceId) {
  const { data } = await createAdminClient()
    .from("meta_connections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data;
}

/** Cache the workspace's own Instagram numbers (the Competitors page's "You" row). */
export async function saveSelfSnapshot(workspaceId, snapshot) {
  await createAdminClient()
    .from("meta_connections")
    .update({
      self_snapshot: snapshot,
      self_snapshot_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);
}

export async function deleteConnection(workspaceId) {
  const { error } = await createAdminClient()
    .from("meta_connections")
    .delete()
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

const settle = async (p) => {
  try {
    return { value: await p };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * An Instagram account's totals over the last `days` days (Meta allows up to 30):
 * { reach, views, accounts_engaged, total_interactions }. Metrics Meta doesn't
 * return are left out.
 */
export async function igInsights(ig, token, days = 7) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - Math.min(30, Math.max(1, days)) * 86400;
  const res = await graph(`${ig.id}/insights`, {
    metric: "reach,views,accounts_engaged,total_interactions",
    period: "day",
    metric_type: "total_value",
    since: String(since),
    until: String(until),
    access_token: token,
  });
  return Object.fromEntries(
    (res.data ?? []).map((m) => [m.name, m.total_value?.value ?? null]),
  );
}

const igWeek = (ig, token) => igInsights(ig, token, 7);

/** A Facebook Page's follower count (falls back to likes for older Pages). */
export async function pageFollowers(page) {
  const res = await graph(page.id, { fields: "name,followers_count,fan_count", access_token: page.token });
  return { name: res.name ?? page.name, followers: res.followers_count ?? res.fan_count ?? null };
}

/**
 * What's connected, with live numbers: each Page (followers, latest posts) and its
 * Instagram account (followers, latest posts, 7-day totals). No tokens in the result.
 */
export async function connectionOverview(conn) {
  const pages = await Promise.all(
    conn.pages.map(async (p) => {
      const [page, posts, ig, igMedia, igInsights] = await Promise.all([
        settle(
          graph(p.id, {
            fields: "name,link,followers_count,fan_count,picture{url}",
            access_token: p.token,
          }),
        ),
        settle(
          graph(`${p.id}/posts`, {
            fields:
              "message,created_time,permalink_url,full_picture,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)",
            limit: "6",
            access_token: p.token,
          }),
        ),
        p.ig
          ? settle(
              graph(p.ig.id, {
                fields:
                  "username,name,profile_picture_url,followers_count,follows_count,media_count",
                access_token: p.token,
              }),
            )
          : null,
        p.ig
          ? settle(
              graph(`${p.ig.id}/media`, {
                fields:
                  "caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count",
                limit: "8",
                access_token: p.token,
              }),
            )
          : null,
        p.ig ? settle(igWeek(p.ig, p.token)) : null,
      ]);

      return {
        id: p.id,
        name: page.value?.name ?? p.name,
        link: page.value?.link ?? `https://facebook.com/${p.id}`,
        picture: page.value?.picture?.data?.url ?? null,
        followers: page.value?.followers_count ?? page.value?.fan_count ?? null,
        error: page.error ?? posts.error ?? null,
        posts: (posts.value?.data ?? []).map((x) => ({
          id: x.id,
          text: (x.message ?? "").slice(0, 200),
          time: x.created_time,
          url: x.permalink_url,
          image: x.full_picture ?? null,
          reactions: x.reactions?.summary?.total_count ?? 0,
          comments: x.comments?.summary?.total_count ?? 0,
          shares: x.shares?.count ?? 0,
        })),
        instagram: p.ig
          ? {
              id: p.ig.id,
              username: ig.value?.username ?? p.ig.username,
              picture: ig.value?.profile_picture_url ?? null,
              followers: ig.value?.followers_count ?? null,
              following: ig.value?.follows_count ?? null,
              postCount: ig.value?.media_count ?? null,
              week: igInsights?.value ?? null,
              weekError: igInsights?.error ?? null,
              error: ig.error ?? igMedia.error ?? null,
              posts: (igMedia.value?.data ?? []).map((m) => ({
                id: m.id,
                text: (m.caption ?? "").slice(0, 200),
                time: m.timestamp,
                url: m.permalink,
                image:
                  m.media_type === "VIDEO"
                    ? (m.thumbnail_url ?? null)
                    : (m.media_url ?? null),
                type:
                  m.media_product_type === "REELS"
                    ? "Reel"
                    : m.media_type === "CAROUSEL_ALBUM"
                      ? "Carousel"
                      : m.media_type === "VIDEO"
                        ? "Video"
                        : "Image",
                likes: m.like_count ?? 0,
                comments: m.comments_count ?? 0,
              })),
            }
          : null,
      };
    }),
  );
  return {
    fbUserName: conn.fb_user_name,
    connectedAt: conn.connected_at,
    tokenExpiresAt: conn.token_expires_at,
    pages,
  };
}
