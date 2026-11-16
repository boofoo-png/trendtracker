import { Suspense } from "react";
import PageHeader from "@/components/audience-trends/PageHeader";
import AudienceTrendsView from "@/components/audience-trends/AudienceTrendsView";
import { getLatestTrends } from "@/lib/apify/getTrends";

export const metadata = {
  title: "Audience Trends · SixthSense",
};

async function LiveTrends() {
  const initial = await getLatestTrends();
  return <AudienceTrendsView initial={initial} />;
}

export default function AudienceTrendsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader />
      <Suspense fallback={<p className="text-sm text-white/80">Loading live trends…</p>}>
        <LiveTrends />
      </Suspense>
    </div>
  );
}
