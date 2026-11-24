import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { REMEMBER_COOKIE, withRemember } from "@/lib/supabase/remember";

// Pages anyone can open. Everything else needs a signed-in user.
const PUBLIC = ["/login", "/signup", "/forgot-password", "/auth/"];
const isPublic = (path) => PUBLIC.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));

// Refreshes the Supabase session on each request and sends signed-out visitors
// to /login. This is an optimistic check: RLS in the database is the real guard.
export async function proxy(request) {
  let response = NextResponse.next({ request });

  // Not configured yet: let the app run without auth.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return response;
  }

  const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, withRemember(options, remember));
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Don't put code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path, params = {}) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = NextResponse.redirect(url);
    // Keep any refreshed session cookies.
    for (const cookie of response.cookies.getAll()) res.cookies.set(cookie);
    return res;
  };

  if (!signedIn && !isPublic(pathname)) {
    return redirectTo("/login", pathname === "/" ? {} : { next: pathname + search });
  }
  if (signedIn && (pathname === "/login" || pathname === "/signup")) return redirectTo("/overview");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
