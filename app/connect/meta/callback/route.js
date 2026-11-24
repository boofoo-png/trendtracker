import { NextResponse } from "next/server";
import { currentWorkspace } from "@/lib/trendStore";
import { exchangeCode, saveConnection } from "@/lib/meta";

// Facebook sends the user back here after they approve (or cancel) the connection.
const STATE_COOKIE = "tt-meta-state";

export async function GET(request) {
  const url = new URL(request.url);
  const back = new URL("/settings#connections", request.url);
  const done = (key, value) => {
    back.searchParams.set(key, value);
    const res = NextResponse.redirect(back);
    res.cookies.set(STATE_COOKIE, "", { path: "/connect/meta", maxAge: 0 });
    return res;
  };

  if (url.searchParams.get("error")) {
    return done("meta_error", url.searchParams.get("error_description") || "Facebook connection was cancelled.");
  }
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== request.cookies.get(STATE_COOKIE)?.value) {
    return done("meta_error", "That connection attempt expired. Please try again.");
  }

  const { userId, workspaceId } = await currentWorkspace();
  if (!workspaceId) return NextResponse.redirect(new URL("/login?next=/settings", request.url));

  try {
    const conn = await exchangeCode({ code, redirectUri: new URL("/connect/meta/callback", request.url).toString() });
    await saveConnection(workspaceId, userId, conn);
    return done("meta", conn.pages.length ? "connected" : "no_pages");
  } catch (err) {
    return done("meta_error", err.message);
  }
}
