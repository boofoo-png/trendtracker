"use client";

import Card from "@/components/ui/Card";
import { FIT_ENABLED } from "@/lib/features";

// x = momentum (0–100). y = fit (0–100) when fit is enabled, otherwise weekly growth (%).
// Quadrants split at the midpoint of each axis (growth splits at 0%: growing vs. slowing).

const GROWTH_MIN = -50; // y-axis range for weekly growth (%), values outside are clamped
const GROWTH_MAX = 150;

const AXES = FIT_ENABLED
  ? {
      title: "Momentum versus audience fit",
      yLabel: "Audience fit",
      yValue: (t) => t.fit,
      yPercent: (v) => v,
      yMid: 50,
      yText: (t) => `fit ${t.fit}`,
      quadrants: {
        topRight: "Act now",
        topLeft: "Watch & prepare",
        bottomRight: "Popular, poor fit",
        bottomLeft: "Skip",
      },
    }
  : {
      title: "Momentum versus weekly growth",
      yLabel: "Weekly growth",
      yValue: (t) => t.change,
      yPercent: (v) =>
        ((Math.min(GROWTH_MAX, Math.max(GROWTH_MIN, v)) - GROWTH_MIN) / (GROWTH_MAX - GROWTH_MIN)) * 100,
      yMid: 0,
      yText: (t) => `growth ${t.change >= 0 ? "+" : ""}${t.change}%`,
      quadrants: {
        topRight: "Act now",
        topLeft: "Emerging",
        bottomRight: "Peaking",
        bottomLeft: "Skip",
      },
    };

// Keep dots and tooltips inside the plot.
const clampPct = (v) => Math.min(97, Math.max(3, v));

/** Smooth-scroll to a section further down the page (instant if reduced motion is on). */
function jumpTo(id) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export default function TrendRadar({ filteredTrends, selectedTrend, selectedTrendId, setSelectedTrendId }) {
  // Picking a trend opens it in the list and changes the campaign section, both
  // further down; this note says so and links there.
  const picked = selectedTrendId && selectedTrend?.id === selectedTrendId ? selectedTrend : null;
  const link =
    "cursor-pointer rounded-full border border-sense-blue/25 bg-white px-3 py-1 text-xs font-bold text-sense-blue transition hover:bg-sense-blue hover:text-paper";

  const midY = AXES.yPercent(AXES.yMid);
  const corner = "pointer-events-none absolute text-xs font-semibold uppercase tracking-wider text-[#4b5d60]/80";

  return (
    <Card
      eyebrow="Trend radar"
      title={AXES.title}
      aside={<p className="text-[13px] text-[#4b5d60]">Select a dot or row to investigate</p>}
    >
      <div className="flex gap-2">
        {/* y-axis label */}
        <div className="flex w-4 items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#4b5d60]">
            {AXES.yLabel} →
          </span>
        </div>

        <div className="flex-1">
          <div
            className="relative h-72 overflow-hidden rounded-xl border border-sense-blue/10 bg-white/50 sm:h-80"
            role="group"
            aria-label={`${AXES.title}. ${filteredTrends.length} trends plotted. Use the trend list for the same data as a table.`}
          >
            {/* quadrant lines */}
            <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-sense-blue/15" />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 h-px bg-sense-blue/15"
              style={{ top: `${100 - midY}%` }}
            />

            {/* quadrant labels */}
            <span aria-hidden="true" className={`${corner} left-3 top-2`}>{AXES.quadrants.topLeft}</span>
            <span aria-hidden="true" className={`${corner} right-3 top-2`}>{AXES.quadrants.topRight}</span>
            <span aria-hidden="true" className={`${corner} bottom-2 left-3`}>{AXES.quadrants.bottomLeft}</span>
            <span aria-hidden="true" className={`${corner} bottom-2 right-3`}>{AXES.quadrants.bottomRight}</span>

            {filteredTrends.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-[#4b5d60]">
                No trends match these filters.
              </p>
            )}

            {/* dots */}
            {filteredTrends.map((trend) => {
              const selected = trend.id === selectedTrend?.id;
              const x = clampPct(trend.momentum);
              const y = clampPct(AXES.yPercent(AXES.yValue(trend)));
              const tooltipBelow = y > 80; // near the top edge → show the label underneath
              return (
                <button
                  key={trend.id}
                  type="button"
                  onClick={() => setSelectedTrendId(trend.id)}
                  aria-pressed={selected}
                  aria-label={`${trend.name} on ${trend.platform}, momentum ${trend.momentum}, ${AXES.yText(trend)}`}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none ${selected ? "z-20" : "z-10 hover:z-30 focus-visible:z-30"}`}
                  style={{ left: `${x}%`, top: `${100 - y}%` }}
                >
                  <span
                    aria-hidden="true"
                    className={`block rounded-full border-2 border-white shadow transition-transform group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-sense-blue ${
                      selected ? "size-4 bg-coral-400" : "size-3 bg-sense-blue/70"
                    }`}
                  />
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-sense-navy px-2 py-1 text-xs font-semibold text-paper ${
                      tooltipBelow ? "top-full mt-1.5" : "bottom-full mb-1.5"
                    } ${selected ? "block" : "hidden group-hover:block group-focus-visible:block"}`}
                  >
                    {trend.name} · {trend.platform}
                  </span>
                </button>
              );
            })}
          </div>

          {/* x-axis label */}
          <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-[#4b5d60]">
            <span>Low</span>
            <span>Momentum →</span>
            <span>High</span>
          </div>

          {picked && (
            <div
              role="status"
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-sense-blue/[0.06] px-3 py-2.5 motion-safe:animate-[fadeIn_0.2s_ease-out]"
            >
              <p className="mr-auto text-xs text-sense-navy">
                <strong>{picked.name}</strong> · {picked.platform} selected
              </p>
              <button type="button" onClick={() => jumpTo("selected-trend")} className={link}>
                See its posts ↓
              </button>
              <button type="button" onClick={() => jumpTo("campaign-direction")} className={link}>
                Get campaign ideas ↓
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
