"use client";

import Card from "@/components/ui/Card";
import AdviceBadge from "@/components/ui/AdviceBadge";

export default function Watchlist({ watchedTrends, selectedTrend, setSelectedTrendId, toggleWatch }) {
  const count = watchedTrends.length;

  return (
    <Card
      eyebrow="Watchlist"
      title="Saved signals"
      aside={
        <span
          aria-label={`${count} saved`}
          className="flex size-6 items-center justify-center rounded-full bg-lime-400 text-[11px] font-semibold"
        >
          {count}
        </span>
      }
    >
      {count === 0 ? (
        <p className="text-[11px] text-ink-500">
          Star a trend in the list to keep an eye on it here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {watchedTrends.map((trend) => {
            const selected = trend.id === selectedTrend?.id;
            return (
              <li
                key={trend.id}
                className={`flex items-center gap-2 rounded-md px-3 py-2 ${selected ? "bg-lime-400/30" : "bg-white/80"}`}
              >
                <span aria-hidden="true" className="text-ink-500">↗</span>
                <button
                  type="button"
                  onClick={() => setSelectedTrendId(trend.id)}
                  disabled={trend.hiddenByFilters}
                  title={trend.hiddenByFilters ? "Hidden by the current depth/source filters" : undefined}
                  className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
                >
                  <span className="block truncate text-xs font-medium">{trend.name}</span>
                  <span className="block text-[10px] text-ink-500">
                    {trend.platform} · momentum {trend.momentum}
                    {trend.hiddenByFilters && " · hidden by filters"}
                  </span>
                </button>
                <AdviceBadge advice={trend.advice} />
                <button
                  type="button"
                  onClick={() => toggleWatch(trend.id)}
                  aria-label={`Remove ${trend.name} from watchlist`}
                  className="text-sm text-ink-500 opacity-60 hover:opacity-100"
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
