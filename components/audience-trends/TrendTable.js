import Card from "@/components/ui/Card";
import { Fragment } from "react";
import TrendRow from "./TrendRow";
import TrendPosts from "./TrendPosts";
import { FIT_ENABLED } from "@/lib/features";

const COLUMNS = [
  { label: "Trend" },
  { label: "Recent trend", className: "hidden md:table-cell" },
  { label: "Momentum" },
  ...(FIT_ENABLED ? [{ label: "Fit" }] : []),
  { label: "Advice" },
  { label: <span className="sr-only">Watchlist</span> },
];

export default function TrendTable({
  filteredTrends,
  matchCount,
  audiences,
  selectedTrend,
  selectedTrendId,
  setSelectedTrendId,
  isSample,
  watchlist,
  toggleWatch,
}) {
  const audienceLabel = audiences.length ? audiences.join(", ") : "all audiences";

  return (
    <Card
      eyebrow="Live trend list"
      title={`Ranked signals for ${audienceLabel}`}
      aside={<p className="text-xs text-[#4b5d60]">{matchCount} matching trends</p>}
    >
      {matchCount === 0 ? (
        <p className="py-8 text-center text-sm text-[#4b5d60]">No trends match these filters.</p>
      ) : (
        // Fallback: scrolls sideways if the columns can't fit (the table is sized to fit a phone).
        <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`px-2 pb-2 text-left sm:px-3 text-xs font-semibold uppercase tracking-wider text-[#4b5d60] ${c.className ?? ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTrends.map((trend) => {
              const expanded = trend.id === selectedTrendId;
              return (
                <Fragment key={trend.id}>
                  <TrendRow
                    trend={trend}
                    selected={trend.id === selectedTrend?.id}
                    expanded={expanded}
                    saved={watchlist.has(trend.id)}
                    // Clicking the open trend again closes its previews.
                    onSelect={() => setSelectedTrendId(expanded ? null : trend.id)}
                    onToggleSave={() => toggleWatch(trend.id)}
                  />
                  {expanded && (
                    <tr className="bg-sense-blue/[0.05]">
                      <td colSpan={COLUMNS.length} className="px-3 pb-4">
                        <TrendPosts trend={trend} isSample={isSample} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </Card>
  );
}
