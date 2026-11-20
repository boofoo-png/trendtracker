"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * false while the server-rendered page is showing, true once the browser has taken
 * over. Use it to show a placeholder instead of empty defaults for anything saved in
 * this browser (settings, calendar, saved content), which the server can't see.
 */
export default function useHydrated() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
