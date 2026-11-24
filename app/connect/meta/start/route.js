import { NextResponse } from "next/server";
import { currentWorkspace } from "@/lib/trendStore";
import { isMetaConfigured, loginUrl } from "@/lib/meta";

// "Connect Facebook & Instagram" → Facebook's login dialog.
const STATE_COOKIE = "tt-meta-state";

export async function GET(request) {
  const back = new URL("/settings#connections", request.url);
  const { workspaceId } = await currentWorkspace();
  if (!workspaceId) return NextResponse.redirect(new URL("/login?next=/settings", request.url));
  if (!isMetaConfigured()) {
    back.searchParams.set("meta_error", "Add META_APP_ID and META_APP_SECRET to .env.local first.");
    return NextResponse.redirect(back);
  }

  // Random value checked on the way back, so nobody can attach their Facebook to your workspace.
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(
    loginUrl({ redirectUri: new URL("/connect/meta/callback", request.url).toString(), state }),
  );
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/connect/meta",
    maxAge: 600,
  });
  return res;
}
