// "My Content": content saved from the Content Creation screens.
// Kept in this browser's localStorage only — there's no database yet.

const KEY = "trendtracker:saved-content";
const EVENT = "trendtracker:saved-content-change";

/** [{ id, type, kind, title, text, trend, createdAt }] newest first */
export function listSaved() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 200)));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

export function saveItem(item) {
  const entry = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  return write([entry, ...listSaved()]) ? entry : null;
}

export function removeItem(id) {
  write(listSaved().filter((i) => i.id !== id));
}

/** Calls `fn` whenever saved content changes (this tab or another). Returns unsubscribe. */
export function onSavedChange(fn) {
  const handler = () => fn(listSaved());
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
