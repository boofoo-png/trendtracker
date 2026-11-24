import AdviceBadge from "@/components/ui/AdviceBadge";
import Sparkline from "@/components/ui/Sparkline";
import { FIT_ENABLED } from "@/lib/features";

export default function TrendRow({ trend, selected, expanded, saved, onSelect, onToggleSave }) {
  const meta = [trend.platform, trend.format].filter(Boolean).join(" · ");
  const changeLabel = `${trend.change >= 0 ? "+" : ""}${trend.change}%`;

  return (
    <tr
      // The radar's "See its posts" link scrolls here.
      id={expanded ? "selected-trend" : undefined}
      onClick={onSelect}
      aria-selected={selected}
      className={`scroll-mt-24 cursor-pointer border-t border-sense-blue/10 ${selected ? "bg-sense-blue/10 shadow-[inset_4px_0_0_var(--color-sense-navy)]" : "hover:bg-white/60"}`}
    >
      <td className="px-2 py-3 sm:px-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-expanded={expanded}
          className="text-left text-sm font-semibold [overflow-wrap:anywhere]"
        >
          <span aria-hidden="true" className="mr-1 hidden w-3 text-[#4b5d60] sm:inline-block">
            {expanded ? "▾" : "▸"}
          </span>
          {trend.name}
        </button>
        <p className="text-[13px] text-[#4b5d60]">{meta}</p>
      </td>
      <td className="hidden px-2 py-3 sm:px-3 text-[#4b5d60] md:table-cell">
        <Sparkline data={trend.history} />
      </td>
      <td className="px-2 py-3 sm:px-3">
        <p className="text-sm font-semibold">{trend.momentum}</p>
        <p className="text-xs text-[#4b5d60]">{changeLabel}</p>
      </td>
      {FIT_ENABLED && (
        <td className="px-2 py-3 sm:px-3">
          <p className="text-sm font-semibold">{trend.fit}</p>
          {trend.fitReasons && (
            <details className="text-xs text-[#4b5d60]" onClick={(e) => e.stopPropagation()}>
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
      <td className="px-2 py-3 sm:px-3">
        <AdviceBadge advice={trend.advice} />
      </td>
      <td className="px-2 py-3 sm:px-3 text-right">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${trend.name} from watchlist` : `Save ${trend.name} to watchlist`}
          title={saved ? "Saved to watchlist. Tap to remove" : "Save to watchlist"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          // Outline star = not saved, gold star = saved; a round hover area makes it read as a button.
          className={`ml-auto grid size-9 cursor-pointer place-items-center rounded-full text-[22px] leading-none transition hover:scale-110 ${
            saved ? "text-amber-400 hover:bg-amber-400/15" : "text-sense-blue/70 hover:bg-sense-blue/10 hover:text-amber-500"
          }`}
        >
          {saved ? "★" : "☆"}
        </button>
      </td>
    </tr>
  );
}
