"use client";

// Google vs Meta revenue line chart. Hover (or tap, or use the arrow keys) and a
// label appears on the point under the cursor, with that point's exact figures.

import { useId, useRef, useState } from "react";

const SERIES = [
  { key: "google", label: "Google", color: "#03525e" },
  { key: "meta", label: "Meta", color: "#5f9a52" },
];
const STEPS = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000];
const money = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (now, before) => {
  if (!before) return null;
  const p = Math.round(((now - before) / before) * 1000) / 10;
  return `${p >= 0 ? "+" : ""}${p}%`;
};

/** Smooth path through the points without overshooting them (monotone cubic). */
function smoothPath(pts) {
  const n = pts.length;
  if (n < 2) return "";
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const slope = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
  const t = pts.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    return slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  });
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

/**
 * revenue: { labels: ["Mon", …], names: ["Monday", …], compare: "day", google: [...], meta: [...] }
 */
export default function RevenueChart({ revenue }) {
  const tableId = useId();
  const plotRef = useRef(null);
  const [active, setActive] = useState(null); // index of the point being inspected
  const [plotWidth, setPlotWidth] = useState(0);
  const n = revenue.labels.length;
  const labelEvery = Math.ceil(n / 7); // at most ~7 axis labels; every point still has a tooltip

  const max = Math.max(...revenue.google, ...revenue.meta);
  const step = STEPS.find((s) => s * 5 >= max) ?? STEPS.at(-1);
  const top = step * 5;
  const ticks = [5, 4, 3, 2, 1, 0].map((i) => i * step);

  // Plot coordinates in percent of the plot area (0,0 = top-left).
  const x = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v) => 100 - (v / top) * 100;
  const points = Object.fromEntries(SERIES.map((s) => [s.key, revenue[s.key].map((v, i) => [x(i), y(v)])]));
  const metaPath = smoothPath(points.meta);

  const pick = (e) => {
    const r = plotRef.current.getBoundingClientRect();
    setPlotWidth(r.width);
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setActive(Math.round(frac * (n - 1)));
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? -1) + dir)));
    } else if (e.key === "Escape") setActive(null);
  };

  // Where the label goes, so it points at the inspected day without covering it:
  // - wide charts: beside the points (right of them, or left in the right half),
  //   vertically centred on them;
  // - narrow charts (phones): above the higher point, or below it when that point
  //   is near the top, hugging the edge at either end so it stays inside.
  let tip = null;
  if (active !== null) {
    const px = x(active);
    const ys = SERIES.map((s) => y(revenue[s.key][active]));
    const py = Math.min(...ys);
    const total = revenue.google[active] + revenue.meta[active];
    const prevTotal = active > 0 ? revenue.google[active - 1] + revenue.meta[active - 1] : null;
    let top;
    let transform;
    if (plotWidth >= 420) {
      top = Math.min(72, Math.max(28, (ys[0] + ys[1]) / 2));
      transform = px <= 55 ? "translate(16px, -50%)" : "translate(calc(-100% - 16px), -50%)";
    } else {
      const below = py < 45;
      const tx = px < 25 ? "-10px" : px > 75 ? "calc(-100% + 10px)" : "-50%";
      top = below ? Math.max(...ys) : py;
      transform = `translate(${tx}, ${below ? "16px" : "calc(-100% - 16px)"})`;
    }
    tip = { px, top, transform, total, change: pct(total, prevTotal) };
  }

  return (
    <div className="min-w-0">
      <div className="flex">
        {/* Y axis */}
        <div aria-hidden="true" className="relative mr-2 w-9 shrink-0 text-right text-[9px] text-sense-blue">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / top) * 100}%` }}>
              {t >= 1000000 ? `$${t / 1000000}M` : `$${t / 1000}k`}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div
          ref={plotRef}
          tabIndex={0}
          role="img"
          aria-label={`Google and Meta revenue by ${revenue.compare}. Use the left and right arrow keys to read each point.`}
          aria-describedby={tableId}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setPlotWidth(plotRef.current.getBoundingClientRect().width);
            setActive((i) => i ?? revenue.meta.indexOf(Math.max(...revenue.meta)));
          }}
          onBlur={() => setActive(null)}
          className="relative h-[190px] flex-1 cursor-crosshair touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sense-blue/40"
        >
          {/* Grid lines */}
          {ticks.map((t) => (
            <i key={t} aria-hidden="true" className="absolute inset-x-0 h-px bg-sense-blue/10" style={{ top: `${100 - (t / top) * 100}%` }} />
          ))}

          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id="reportArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ddfe56" stopOpacity="0.75" />
                <stop offset="1" stopColor="#ddfe56" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <path d={`${metaPath} L100,100 L0,100 Z`} fill="url(#reportArea)" />
            {SERIES.map((s) => (
              <path key={s.key} d={smoothPath(points[s.key])} fill="none" stroke={s.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>

          {tip && (
            <>
              {/* Guide line and the exact points */}
              <i aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-sense-navy/25" style={{ left: `${tip.px}%` }} />
              {SERIES.map((s) => (
                <i
                  key={s.key}
                  aria-hidden="true"
                  className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper shadow"
                  style={{ left: `${tip.px}%`, top: `${y(revenue[s.key][active])}%`, background: s.color }}
                />
              ))}

              <div
                role="status"
                className="pointer-events-none absolute z-10 grid min-w-[150px] gap-1 rounded-lg border border-sense-blue/15 bg-paper px-3 py-2 text-[11px] whitespace-nowrap text-sense-navy shadow-[0_8px_18px_rgba(0,31,62,0.16)]"
                style={{ left: `${tip.px}%`, top: `${tip.top}%`, transform: tip.transform }}
              >
                <strong className="text-xs text-sense-blue">{revenue.names[active]}</strong>
                {SERIES.map((s) => (
                  <span key={s.key} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      <i className="size-2 rounded-full" style={{ background: s.color }} /> {s.label}
                    </span>
                    <b>{money(revenue[s.key][active])}</b>
                  </span>
                ))}
                <span className="mt-0.5 flex justify-between gap-4 border-t border-sense-blue/10 pt-1 text-[10px] text-[#5f706e]">
                  <span>Total {money(tip.total)}</span>
                  {tip.change && (
                    <span className={tip.change.startsWith("-") ? "text-[#b84f4f]" : "text-[#4e8665]"}>
                      {tip.change} vs previous {revenue.compare}
                    </span>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* X axis */}
      <div aria-hidden="true" className="relative mt-2 ml-11 h-4 text-[9px] text-sense-blue">
        {revenue.labels.map((l, i) => (i % labelEvery !== 0 ? null : (
          <span
            key={l}
            className={`absolute whitespace-nowrap ${active !== null && Math.abs(active - i) < labelEvery / 2 ? "font-bold" : ""}`}
            style={{ left: `${x(i)}%`, transform: i === 0 ? "none" : i + labelEvery > n - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
          >
            {l}
          </span>
        )))}
      </div>

      <div className="mt-2 ml-11 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#647477]">
        <span className="flex gap-4">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <i className="size-2 rounded-full" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </span>
        <span className="hidden sm:inline">Hover over the chart for exact figures</span>
        <span className="sm:hidden">Tap the chart for exact figures</span>
      </div>

      {/* The same numbers for screen readers. */}
      <table id={tableId} className="sr-only">
        <caption>Revenue by {revenue.compare}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {SERIES.map((s) => (
              <th key={s.key} scope="col">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {revenue.names.map((name, i) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              {SERIES.map((s) => (
                <td key={s.key}>{money(revenue[s.key][i])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
