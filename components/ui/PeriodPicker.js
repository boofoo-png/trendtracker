"use client";

// 7 days · 30 days · 90 days · Custom. Custom opens a small From–To panel.

import { useEffect, useId, useRef, useState } from "react";
import { CUSTOM, MAX_CUSTOM_DAYS, PRESETS, rangeLabel } from "@/lib/periods";
import { addDays, fromISODate, toISODate } from "@/lib/calendarDates";

const pill = "min-w-14 cursor-pointer rounded-[19px] px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-colors sm:min-w-16 sm:px-3.5";

function CustomPanel({ value, today, onApply, onCancel }) {
  const id = useId();
  const ref = useRef(null);
  const min = toISODate(addDays(today, -(MAX_CUSTOM_DAYS - 1)));
  const max = toISODate(today);
  const [from, setFrom] = useState(value?.preset === CUSTOM ? value.from : toISODate(addDays(today, -13)));
  const [to, setTo] = useState(value?.preset === CUSTOM ? value.to : max);

  // Latest onCancel, so the listeners below are set up once (not on every keystroke).
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    ref.current?.querySelector("input")?.focus();
    const onDown = (e) =>
      ref.current && !ref.current.contains(e.target) && !e.target.closest("[data-period-custom]") && cancelRef.current();
    const onKey = (e) => e.key === "Escape" && cancelRef.current();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  let error = null;
  if (!from || !to) error = "Choose both dates.";
  else if (from > to) error = "The start date must be before the end date.";
  else if (from < min || to > max) error = "Pick dates within the past year.";
  const days = !error ? Math.round((fromISODate(to) - fromISODate(from)) / 86400000) + 1 : 0;

  const field =
    "w-full rounded-[9px] border border-sense-blue/20 bg-white/80 px-3 py-2 text-xs text-sense-navy outline-none focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)]";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Custom date range"
      className="absolute top-[calc(100%+8px)] left-0 z-40 grid sm:right-0 sm:left-auto w-[min(300px,calc(100vw-32px))] gap-3 rounded-2xl border border-paper/60 bg-paper p-4 text-left text-sense-navy shadow-[0_18px_40px_rgba(0,31,62,0.25)]"
    >
      <strong className="text-sm text-sense-blue">Custom range</strong>
      <div className="grid grid-cols-2 gap-2.5">
        <label htmlFor={`${id}-from`} className="grid gap-1 text-[11px] font-semibold text-[#53676a]">
          From
          <input id={`${id}-from`} type="date" min={min} max={max} value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
        </label>
        <label htmlFor={`${id}-to`} className="grid gap-1 text-[11px] font-semibold text-[#53676a]">
          To
          <input id={`${id}-to`} type="date" min={min} max={max} value={to} onChange={(e) => setTo(e.target.value)} className={field} />
        </label>
      </div>
      <p role={error ? "alert" : undefined} className={`text-[11px] ${error ? "font-semibold text-[#b84f4f]" : "text-[#5f706e]"}`}>
        {error ?? `${days} ${days === 1 ? "day" : "days"}, compared with the ${days} days before. Up to one year.`}
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-[18px] px-3.5 py-2 text-[11px] font-bold text-sense-blue transition hover:bg-sense-blue/10">
          Cancel
        </button>
        <button
          type="button"
          disabled={Boolean(error)}
          onClick={() => onApply({ preset: CUSTOM, from, to })}
          className="cursor-pointer rounded-[18px] bg-sense-lime px-4 py-2 text-[11px] font-extrabold text-sense-navy shadow-[0_3px_0_rgba(0,31,62,0.17)] transition hover:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

/** value: { preset } or { preset: "Custom", from, to } (ISO dates). */
export default function PeriodPicker({ value, onChange, today }) {
  const [editing, setEditing] = useState(false);
  const isCustom = value?.preset === CUSTOM && value.from && value.to;
  const customText = isCustom ? rangeLabel(fromISODate(value.from), fromISODate(value.to)) : "Custom";

  return (
    <div className="relative shrink-0">
      <div role="group" aria-label="Date range" className="flex rounded-[24px] bg-paper/80 p-1">
        {PRESETS.map((p) => {
          const on = value?.preset === p;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setEditing(false);
                onChange({ preset: p });
              }}
              className={`${pill} ${on ? "bg-sense-blue text-paper" : "text-sense-navy hover:bg-sense-blue/10"}`}
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          data-period-custom
          aria-pressed={Boolean(isCustom)}
          aria-expanded={editing}
          aria-haspopup="dialog"
          title={isCustom ? `Custom range: ${customText}. Click to change.` : "Choose a custom date range"}
          onClick={() => setEditing((e) => !e)}
          className={`${pill} max-w-[150px] truncate ${isCustom ? "bg-sense-blue text-paper" : "text-sense-navy hover:bg-sense-blue/10"}`}
        >
          {customText}
        </button>
      </div>
      {editing && (
        <CustomPanel
          value={value}
          today={today}
          onCancel={() => setEditing(false)}
          onApply={(v) => {
            setEditing(false);
            onChange(v);
          }}
        />
      )}
    </div>
  );
}
