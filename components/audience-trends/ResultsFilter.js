"use client";

// Narrows the results already on the page (radar, list) by platform. It doesn't
// change what a search fetches: every search covers both TikTok and Instagram.
// (The trend list's header shows how many trends match.)

import SegmentedControl from "@/components/ui/SegmentedControl";

const SOURCES = ["All platforms", "Instagram", "TikTok"];

export default function ResultsFilter({ source, setSource }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[10px] font-bold tracking-wider text-paper/85 uppercase">Show results from</span>
      <SegmentedControl label="Show results from" options={SOURCES} value={source} onChange={setSource} />
    </div>
  );
}
