"use client";

// Narrows the results already on the page (radar, list) by platform. It doesn't
// change what a search fetches: every search covers both TikTok and Instagram.
// The count sits right next to the buttons, in a solid pill so it reads on the
// bright background.

import SegmentedControl from "@/components/ui/SegmentedControl";

const SOURCES = ["All platforms", "Instagram", "TikTok"];

export default function ResultsFilter({ source, setSource, filteredTrends }) {
  const count = filteredTrends.length;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[10px] font-bold tracking-wider text-paper/85 uppercase">Show results from</span>
      <SegmentedControl label="Show results from" options={SOURCES} value={source} onChange={setSource} />
      <p
        aria-live="polite"
        className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-sense-navy shadow-[0_3px_0_rgba(0,31,62,0.15)]"
      >
        {count} {count === 1 ? "trend" : "trends"}
        {source !== "All platforms" && ` on ${source}`}
      </p>
    </div>
  );
}
