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

/** Latest successful run's items, or null if the actor has never run. Cheap: no new run. */
export async function getLastRunItems(actorId) {
  const run = await apifyFetch(`/acts/${actorId}/runs/last?status=SUCCEEDED`);
  if (!run?.data) return null;
  const items = await apifyFetch(`/datasets/${run.data.defaultDatasetId}/items?clean=true`);
  return { items: items ?? [], finishedAt: run.data.finishedAt };
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

async function getStoreId(name) {
  // Get-or-create a named key-value store.
  const store = await apifyFetch(`/key-value-stores?name=${encodeURIComponent(name)}`, {
    method: "POST",
    cache: "no-store",
  });
  return store.data.id;
}

/** Read a JSON record from a named key-value store, or null if it doesn't exist. */
export async function getRecord(storeName, key) {
  const id = await getStoreId(storeName);
  return apifyFetch(`/key-value-stores/${id}/records/${encodeURIComponent(key)}`);
}

/** Write a JSON record to a named key-value store. */
export async function putRecord(storeName, key, value) {
  const id = await getStoreId(storeName);
  const res = await fetch(`${API}/key-value-stores/${id}/records/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(value),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Apify ${res.status} saving ${key}`);
}
