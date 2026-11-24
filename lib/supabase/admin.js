import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server only, for writes the schema reserves
// for the server (posts, search_posts, ai_cache). Never import from client code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
