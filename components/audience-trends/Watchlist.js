"use client";

import Card from "@/components/ui/Card";
import AdviceBadge from "@/components/ui/AdviceBadge";
import Skeleton from "@/components/ui/Skeleton";

export default function Watchlist({ watchedTrends, watchlistLoaded, selectedTrend, setSelectedTrendId, toggleWatch }) {
  const count = watchedTrends.length;

  return (
    <Card
      eyebrow="Watchlist"
      title="Saved signals"
      aside={
        <span
          aria-label={`${count} saved`}
          className="flex size-6 items-center justify-center rounded-full bg-sense-blue/10 text-[13px] font-bold text-sense-blue"
        >
          {watchlistLoaded ? count : "·"}
        </span>
      }
    >
      {!watchlistLoaded ? (
        <div role="status" aria-label="Loading watchlist" className="grid gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : count === 0 ? (
        <p className="text-[13px] text-[#4b5d60]">
          Tap <span aria-hidden="true" className="text-sm text-sense-blue">☆</span>
          <span className="sr-only">the star</span> on any trend in the list below to save it here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {watchedTrends.map((trend) => {
            const selected = trend.id === selectedTrend?.id;
            return (
              <li
                key={trend.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${selected ? "border border-sense-blue/40 bg-sense-blue/10" : "border border-sense-blue/10 bg-white/70"}`}
              >
                <span aria-hidden="true" className="text-[#4b5d60]">↗</span>
                <button
                  type="button"
                  onClick={() => setSelectedTrendId(trend.id)}
                  disabled={trend.hiddenByFilters}
                  title={trend.hiddenByFilters ? "Hidden by the current source filter" : undefined}
                  className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
                >
                  <span className="block text-[13px] font-medium [overflow-wrap:anywhere]">{trend.name}</span>
                  <span className="block text-xs text-[#4b5d60]">
                    {trend.platform} · momentum {trend.momentum}
                    {trend.hiddenByFilters && " · hidden by filters"}
                  </span>
                </button>
                <AdviceBadge advice={trend.advice} />
                <button
                  type="button"
                  onClick={() => toggleWatch(trend.id)}
                  aria-label={`Remove ${trend.name} from watchlist`}
                  className="text-sm text-[#4b5d60] opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
