import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing page for the links in Supabase auth emails (sign-up confirmation,
// email change). Handles both the PKCE ?code= link and the ?token_hash= link.
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextParam = url.searchParams.get("next") ?? "/overview";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/overview";

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: { message: "This link is missing its code." } };

  if (error) {
    const back = new URL("/login", url.origin);
    back.searchParams.set("error", error.message);
    return NextResponse.redirect(back);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
