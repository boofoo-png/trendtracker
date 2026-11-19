"use client";

// JSON state kept in this browser's localStorage, shared live between every
// component (and tab) that reads the same key. There's no database yet.

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "trendtracker:stored-change";
const cache = new Map(); // key -> { raw, value }

function read(key, fallback) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value = fallback;
  try {
    if (raw != null) value = JSON.parse(raw);
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(fn) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

/**
 * [value, setValue] backed by localStorage. `fallback` must be a stable
 * (module-level) value; it's also what the server renders.
 */
export default function useStored(key, fallback) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next) => writeStored(key, typeof next === "function" ? next(read(key, fallback)) : next),
    [key, fallback],
  );
  return [value, set];
}
