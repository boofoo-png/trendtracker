import AdviceBadge from "@/components/ui/AdviceBadge";
import Sparkline from "@/components/ui/Sparkline";
import { FIT_ENABLED } from "@/lib/features";

export default function TrendRow({ trend, selected, expanded, saved, onSelect, onToggleSave }) {
  const meta = [trend.platform, trend.format, trend.depth].filter(Boolean).join(" · ");
  const changeLabel = `${trend.change >= 0 ? "+" : ""}${trend.change}%`;

  return (
    <tr
      onClick={onSelect}
      aria-selected={selected}
      className={`cursor-pointer border-t border-black/5 ${selected ? "bg-lime-400/25" : "hover:bg-white/50"}`}
    >
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-expanded={expanded}
          className="text-left text-sm font-semibold"
        >
          <span aria-hidden="true" className="mr-1 inline-block w-3 text-ink-500">
            {expanded ? "▾" : "▸"}
          </span>
          {trend.name}
        </button>
        <p className="text-[11px] text-ink-500">{meta}</p>
      </td>
      <td className="hidden px-3 py-3 text-ink-500 md:table-cell">
        <Sparkline data={trend.history} />
      </td>
      <td className="px-3 py-3">
        <p className="text-sm font-semibold">{trend.momentum}</p>
        <p className="text-[10px] text-ink-500">{changeLabel}</p>
      </td>
      {FIT_ENABLED && (
        <td className="px-3 py-3">
          <p className="text-sm font-semibold">{trend.fit}</p>
          {trend.fitReasons && (
            <details className="text-[10px] text-ink-500" onClick={(e) => e.stopPropagation()}>
              <summary className="cursor-pointer">✦ Why</summary>
              <ul className="mt-1 max-w-56 space-y-1">
                {trend.fitReasons.map((r) => (
                  <li key={r.audience}>
                    <strong>{r.audience} ({r.fit}):</strong> {r.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </td>
      )}
      <td className="px-3 py-3">
        <AdviceBadge advice={trend.advice} />
      </td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${trend.name} from watchlist` : `Add ${trend.name} to watchlist`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={`text-lg ${saved ? "text-amber-300" : "text-black/20 hover:text-black/40"}`}
        >
          ★
        </button>
      </td>
    </tr>
  );
}
