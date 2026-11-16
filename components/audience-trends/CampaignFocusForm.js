"use client";

import { useId } from "react";

import { FOCUS_TYPES } from "@/lib/campaignFocus";

const PLACEHOLDERS = {
  Product: { name: "e.g. Refillable amenity dispensers", details: "Key benefit, price point, launch date…" },
  Service: { name: "e.g. Linen management service", details: "Who it's for, what it saves…" },
  Event: { name: "e.g. Hospitality Expo stand B12", details: "Date, location, what's happening…" },
  "Sale or offer": { name: "e.g. 15% off first bulk order", details: "Dates, conditions, code…" },
};

/** What the campaign should promote. `focus` is { type, name, details }. */
export default function CampaignFocusForm({ focus, onChange, disabled }) {
  const id = useId();
  const isGeneral = focus.type === "General brand";
  const ph = PLACEHOLDERS[focus.type] ?? PLACEHOLDERS.Product;
  const set = (patch) => onChange({ ...focus, ...patch });
  const field =
    "w-full rounded-md bg-white px-3 py-2 text-xs outline-none ring-teal-900/30 focus:ring-2 disabled:opacity-60";

  return (
    <fieldset disabled={disabled} className="rounded-lg bg-white/60 p-4">
      <legend className="sr-only">What are you promoting?</legend>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        What are you promoting?
      </p>

      <div role="radiogroup" aria-label="Campaign focus type" className="mb-3 flex flex-wrap gap-2">
        {FOCUS_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={focus.type === type}
            onClick={() => set({ type })}
            className={`rounded-full px-3 py-1 text-xs ${focus.type === type ? "bg-teal-900 text-white" : "bg-white"}`}
          >
            {type}
          </button>
        ))}
      </div>

      {isGeneral ? (
        <p className="text-[11px] text-ink-500">
          The direction will focus on brand awareness rather than a specific offer.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <label htmlFor={`${id}-name`} className="mb-1 block text-[11px] font-medium">
              {focus.type} name
            </label>
            <input
              id={`${id}-name`}
              type="text"
              maxLength={100}
              value={focus.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder={ph.name}
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`${id}-details`} className="mb-1 block text-[11px] font-medium">
              Details <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id={`${id}-details`}
              type="text"
              maxLength={400}
              value={focus.details}
              onChange={(e) => set({ details: e.target.value })}
              placeholder={ph.details}
              className={field}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
