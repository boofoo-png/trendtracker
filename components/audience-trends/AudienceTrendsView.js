"use client";

import useTrendFilters from "@/lib/useTrendFilters";
import LiveStatusBanner from "./LiveStatusBanner";
import AudienceSelector from "./AudienceSelector";
import TrendRadar from "./TrendRadar";
import Watchlist from "./Watchlist";
import HowToRead from "./HowToRead";
import TrendTable from "./TrendTable";
import CampaignDirection from "./CampaignDirection";

export default function AudienceTrendsView({ initial }) {
  const state = useTrendFilters(initial);

  return (
    <>
      <LiveStatusBanner {...state} />
      <AudienceSelector {...state} />
      <div className="grid gap-4 xl:grid-cols-[1fr_336px]">
        <TrendRadar {...state} />
        <div className="flex flex-col gap-4">
          <Watchlist {...state} />
          <HowToRead />
        </div>
      </div>
      <TrendTable {...state} />
      <CampaignDirection {...state} />
    </>
  );
}
