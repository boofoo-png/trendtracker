"use client";

// What a Content Creation screen is building on. Shows the selected trend (or calendar
// post, insight…) with an ×; after removing it, "Undo" brings it back. "+ Use a trend"
// is always there to pick one of the workspace's latest trends.

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { listPickerTrends } from "@/app/(dashboard)/content-creation/actions";
import { SelectedTrendBadge } from "./ui";

const linkBtn =
  "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-2xl px-3 text-[11px] font-bold whitespace-nowrap transition";

function TrendPicker({ onPick, label }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null); // { trends, audiences, error }
  const [loading, startLoading] = useTransition();
  const ref = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Loaded each time it opens, so a search run in another tab shows up.
    if (next)
      startLoading(async () => {
        const res = await listPickerTrends().catch((err) => ({ trends: [], audiences: [], error: err.message }));
        setData(res);
      });
  };

  const trends = data?.trends ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={listId}
        className={`${linkBtn} border border-sense-blue/25 bg-white/70 text-sense-blue hover:bg-sense-blue/10`}
      >
        <Icon name="trend" size={13} /> {label}
      </button>
      {open && (
        <div
          id={listId}
          className="absolute right-0 z-30 mt-2 w-[min(300px,calc(100vw-48px))] overflow-hidden rounded-2xl border border-sense-blue/15 bg-paper text-sense-navy shadow-[0_18px_40px_rgba(0,31,62,0.22)]"
        >
          <p className="border-b border-sense-blue/10 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#647477]">
            Your latest trends
          </p>
          {loading && !data ? (
            <p className="px-3.5 py-4 text-xs text-[#5f706e]">Loading…</p>
          ) : data?.error ? (
            <p role="alert" className="px-3.5 py-4 text-xs text-coral-400">{data.error}</p>
          ) : trends.length === 0 ? (
            <div className="grid gap-2 px-3.5 py-4 text-xs text-[#5f706e]">
              <p>No trends yet. Run a trend search first, then come back.</p>
              <Link href="/audience-trends" className="font-bold text-sense-blue underline">
                Go to Audience Trends
              </Link>
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-y-auto py-1">
              {trends.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick({ name: t.name, platform: t.platform, format: t.format, audience: data.audiences.join(" + "), hook: "" });
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition hover:bg-sense-lime/40"
                  >
                    <span className="grid min-w-0 flex-1 gap-px">
                      <strong className="truncate text-xs">
                        {t.starred && <span className="text-[#c28a00]" aria-label="Starred">★ </span>}
                        {t.name}
                      </strong>
                      <small className="truncate text-[10px] text-[#647477]">
                        {t.platform}
                        {t.format ? ` · ${t.format}` : ""}
                      </small>
                    </span>
                    <span className="shrink-0 rounded-lg bg-sense-blue/10 px-1.5 py-0.5 text-[10px] font-bold text-sense-blue" title="Momentum">
                      {t.momentum}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * trend: the current starting point or null. onChange(next | null) is called when the
 * user removes it, undoes that, or picks a trend.
 */
export default function TrendSlot({ trend, onChange }) {
  const [removed, setRemoved] = useState(null); // last one removed, for Undo

  if (trend) {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <SelectedTrendBadge
          trend={trend}
          onClear={() => {
            setRemoved(trend);
            onChange(null);
          }}
        />
        <TrendPicker label="Change" onPick={onChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      {removed && (
        <button
          type="button"
          onClick={() => {
            onChange(removed);
            setRemoved(null);
          }}
          className={`${linkBtn} text-sense-blue hover:bg-sense-blue/10`}
          title={`Use “${removed.name}” again`}
        >
          ↶ Undo
        </button>
      )}
      <TrendPicker label="Use a trend" onPick={onChange} />
    </div>
  );
}
