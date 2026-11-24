import "server-only";

const API = "https://api.apify.com/v2";

function authHeaders() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set. Add it to .env.local.");
  return { Authorization: `Bearer ${token}` };
}

async function apifyFetch(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init.headers },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify ${res.status} on ${path.split("?")[0]}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Start a new run and wait (up to 300s) for its items. Spends Apify credits. */
export async function runActor(actorId, input) {
  const items = await apifyFetch(
    `/acts/${actorId}/run-sync-get-dataset-items?timeout=300&clean=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    },
  );
  return items ?? [];
}
