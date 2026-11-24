// "Remember Me" on the login form. Supabase always gives its session cookies a
// 400-day lifetime; when the box is left unticked we drop that lifetime so they
// become browser-session cookies and the user is signed out when the browser closes.

export const REMEMBER_COOKIE = "tt-remember"; // "0" = don't remember

/** Cookie options to use for a Supabase auth cookie. Removals (maxAge 0) pass through. */
export function withRemember(options, remember) {
  if (remember || !options || !(options.maxAge > 0)) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
