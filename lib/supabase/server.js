import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { REMEMBER_COOKIE, withRemember } from "./remember";

// Supabase client for Server Components, Server Functions and Route Handlers.
// Runs as the signed-in user from the auth cookies (RLS applies).
// `remember` overrides the saved Remember Me choice (used while signing in).
export async function createClient({ remember } = {}) {
  const cookieStore = await cookies();
  const keep = remember ?? cookieStore.get(REMEMBER_COOKIE)?.value !== "0";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, withRemember(options, keep));
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // proxy.js refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}
