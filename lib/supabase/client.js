"use client";

import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { REMEMBER_COOKIE, withRemember } from "./remember";

let client;

// Supabase client for Client Components. Runs as the signed-in user (RLS applies).
// One instance per tab so every hook shares the same session. Cookies are written
// here (not by the default handler) so token refreshes respect Remember Me.
export function createClient() {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        // Client components also render once on the server, where there's no document.
        getAll() {
          return typeof document === "undefined" ? [] : parseCookieHeader(document.cookie);
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          const all = parseCookieHeader(document.cookie);
          const remember = all.find((c) => c.name === REMEMBER_COOKIE)?.value !== "0";
          for (const { name, value, options } of cookiesToSet) {
            document.cookie = serializeCookieHeader(name, value, withRemember(options, remember));
          }
        },
      },
    },
  );
  return client;
}
