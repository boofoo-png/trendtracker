"use client";

import useStored from "./useStored";
import { DEFAULT_PERIOD } from "./periods";

/** The date range picked on Overview/Reports. Shared by both pages and remembered in this browser. */
export default function usePeriod() {
  return useStored("trendtracker:period", DEFAULT_PERIOD);
}
