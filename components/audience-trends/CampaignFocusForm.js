"use client";

import { useId } from "react";

import { FOCUS_TYPES } from "@/lib/campaignFocus";

const PLACEHOLDERS = {
  Product: { name: "e.g. Our new spring range", details: "Key benefit, price point, launch date…" },
  Service: { name: "e.g. Same-day delivery", details: "Who it's for, what it saves…" },
  Event: { name: "e.g. Pop-up at the Saturday market", details: "Date, location, what's happening…" },
  "Sale or offer": { name: "e.g. 15% off your first order", details: "Dates, conditions, code…" },
};

/** What the campaign should promote. `focus` is { type, name, details }. */
export default function CampaignFocusForm({ focus, onChange, disabled }) {
  const id = useId();
  const isGeneral = focus.type === "General brand";
  const ph = PLACEHOLDERS[focus.type] ?? PLACEHOLDERS.Product;
  const set = (patch) => onChange({ ...focus, ...patch });
  const field =
    "w-full rounded-[9px] border border-sense-blue/20 bg-white/65 text-sense-navy outline-none placeholder:text-[#6f7f82] focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)] px-3 py-2 text-xs disabled:opacity-60";

  return (
    <fieldset disabled={disabled} className="rounded-xl border border-sense-blue/10 bg-white/60 p-4">
      <legend className="sr-only">What are you promoting?</legend>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#4b5d60]">
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
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${focus.type === type ? "bg-sense-blue text-paper" : "border border-sense-blue/20 bg-white/70 text-sense-blue hover:bg-sense-blue/10"}`}
          >
            {type}
          </button>
        ))}
      </div>

      {isGeneral ? (
        <p className="text-[13px] text-[#4b5d60]">
          The direction will focus on brand awareness rather than a specific offer.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <label htmlFor={`${id}-name`} className="mb-1 block text-[13px] font-semibold text-[#53676a]">
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
            <label htmlFor={`${id}-details`} className="mb-1 block text-[13px] font-semibold text-[#53676a]">
              Details <span className="font-normal text-[#4b5d60]">(optional)</span>
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
