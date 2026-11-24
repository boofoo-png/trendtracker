"use client";

import { useId, useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import { suggestAudiences } from "@/app/(dashboard)/audience-trends/actions";
import { EST_COST_PER_POST, RESULTS_PER_HASHTAG } from "@/lib/apify/config";
import TrendSearchPanel from "./TrendSearchPanel";
import Skeleton from "@/components/ui/Skeleton";
import { useBusiness } from "@/lib/settings";
import { presetAudiences } from "@/lib/presetAudiences";

const norm = (s) => s.trim().toLowerCase();

/** Gemini suggestions, fetched only when ask() is called. */
function useAiSuggestions(query) {
  const business = useBusiness();
  const [result, setResult] = useState(null); // { query, audiences, error }
  const [loading, startLoading] = useTransition();

  const ask = () => {
    const q = query.trim();
    startLoading(async () => {
      const res = await suggestAudiences(q, business);
      setResult({ query: q, ...res });
    });
  };

  // Results stay visible only while the text they were asked for is unchanged.
  const current = result?.query === query.trim() ? result : null;
  return {
    audiences: current?.audiences ?? [],
    error: current?.error ?? null,
    loading,
    ask,
  };
}

export default function AudienceSelector({
  savedAudiences,
  audiencesLoaded,
  audiences: selectedAudiences,
  addAudience,
  removeAudience,
  toggleAudience,
  ...search
}) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ai = useAiSuggestions(query);
  const { industry } = useBusiness();

  const savedSet = new Set(savedAudiences.map(norm));
  const q = norm(query);
  const presetMatches = presetAudiences(industry).filter(
    (a) => !savedSet.has(norm(a)) && (!q || norm(a).includes(q)),
  ).slice(0, 5);
  const presetSet = new Set(presetMatches.map(norm));
  const aiMatches = ai.audiences.filter((a) => !savedSet.has(norm(a)) && !presetSet.has(norm(a)));
  const options = [
    ...presetMatches.map((label) => ({ label, ai: false })),
    ...aiMatches.map((label) => ({ label, ai: true })),
  ];
  const showList = open && (options.length > 0 || ai.loading);

  const add = (label) => {
    addAudience(label);
    setQuery("");
    setActive(-1);
    setOpen(false); // otherwise the list covers the chip that was just added
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) add(options[active].label);
      else if (query.trim()) add(query);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <Card
      eyebrow="Choose an audience"
      title="Whose interests do you want to explore?"
      aside={<p className="text-[11px] text-ink-500">Pick audiences, then press Find trends to search for them</p>}
    >
      {/* Search / add */}
      {/* Phones: [field][+ Add] on one line (so the suggestion list never covers Add), AI below. */}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="relative min-w-0 flex-1">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
            ⌕
          </span>
          <input
            type="text"
            role="combobox"
            aria-label="Search or add an audience"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listboxId}-${active}` : undefined}
            placeholder="Search or add an audience"
            value={query}
            maxLength={60}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            className="w-full rounded-[9px] border border-sense-blue/20 bg-white/65 text-sense-navy outline-none placeholder:text-[#8a9799] focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)] py-2.5 pl-9 pr-3 text-sm"
          />

          {showList && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-paper/60 bg-paper py-1.5 text-sm text-sense-navy shadow-[0_18px_40px_rgba(0,31,62,0.25)]"
            >
              {options.map((opt, i) => (
                <li
                  key={opt.label}
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(opt.label);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 ${i === active ? "bg-sense-lime/50" : ""}`}
                >
                  <span>{opt.label}</span>
                  {opt.ai && <span className="text-[10px] text-ink-500">✦ Sense AI</span>}
                </li>
              ))}
              {ai.loading && (
                <li role="presentation" className="px-3 py-2 text-xs text-ink-500">
                  ✦ Finding related audiences…
                </li>
              )}
            </ul>
          )}
        </div>

        {/* "Add" saves what's typed (same as pressing Enter); AI suggestions need a few letters. */}
        <button
          type="button"
          onClick={() => query.trim() && add(query)}
          disabled={!query.trim()}
          className="shrink-0 cursor-pointer rounded-[18px] bg-sense-blue px-5 py-2.5 text-xs font-bold text-paper transition-colors hover:bg-sense-blue/85 disabled:cursor-not-allowed disabled:bg-sense-blue/30"
        >
          + Add
        </button>
        <button
          type="button"
          onClick={() => {
            ai.ask();
            setOpen(true);
          }}
          disabled={query.trim().length < 3 || ai.loading}
          title={query.trim().length < 3 ? "Type at least 3 letters first" : "Ask Sense AI for related audiences"}
          className="w-full shrink-0 cursor-pointer rounded-[18px] border border-sense-blue/20 bg-white/70 text-xs font-bold text-sense-blue transition-colors hover:bg-sense-blue/10 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2.5 sm:w-auto"
        >
          {ai.loading ? "✦ Thinking…" : "✦ Suggest with AI"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-500">
        {query.trim().length === 0
          ? "Type a group of people, like “coffee lovers”, then press Enter or Add."
          : query.trim().length < 3
            ? "Keep typing: Suggest with AI works after 3 letters."
            : "Press Enter or Add to save it, or Suggest with AI for related audiences."}
      </p>
      {ai.error && <p className="mt-1 text-[11px] text-ink-500">{ai.error}</p>}

      {/* Saved audiences */}
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-xs">
            <span className="font-semibold uppercase tracking-wider">Saved to your profile</span>{" "}
            <span className="text-ink-500">Tap an audience to select it for your search.</span>
          </p>
          {savedAudiences.length > 0 && (
            <p aria-live="polite" className="text-xs font-semibold text-sense-blue">
              {selectedAudiences.length} of {savedAudiences.length} selected
            </p>
          )}
        </div>

        {!audiencesLoaded ? (
          <div role="status" aria-label="Loading saved audiences" className="flex flex-wrap gap-2">
            {["w-28", "w-36", "w-24"].map((w) => (
              <Skeleton key={w} className={`h-8 rounded-full ${w}`} />
            ))}
          </div>
        ) : savedAudiences.length === 0 ? (
          <p className="rounded-xl border border-dashed border-sense-blue/25 px-4 py-4 text-center text-[11px] text-ink-500">
            Search above or add your first custom audience. Until then, you&apos;ll see example
            trends.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {savedAudiences.map((name) => {
              const isSelected = selectedAudiences.includes(name);
              // Looks like a checkbox chip: ○ / ✓ shows it can be picked; the × (behind a
              // divider) is a separate "delete" button.
              return (
                <li
                  key={name}
                  className={`flex items-center rounded-full border-2 text-[13px] font-semibold shadow-[0_2px_0_rgba(0,31,62,0.12)] transition ${
                    isSelected
                      ? "border-sense-blue bg-sense-blue text-paper"
                      : "border-sense-blue/30 bg-white text-sense-blue hover:border-sense-blue hover:bg-sense-blue/5"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleAudience(name)}
                    title={isSelected ? "Selected. Tap to deselect" : "Tap to select"}
                    className="flex cursor-pointer items-center gap-2 rounded-l-full py-1.5 pl-2 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-sense-lime"
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-[18px] place-items-center rounded-full border-2 text-[11px] leading-none ${
                        isSelected ? "border-paper bg-paper text-sense-blue" : "border-sense-blue/40"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    {name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${name}`}
                    title={`Delete ${name}`}
                    onClick={() => removeAudience(name)}
                    className={`cursor-pointer self-stretch rounded-r-full border-l px-2.5 text-base leading-none transition ${
                      isSelected
                        ? "border-paper/30 text-paper/70 hover:bg-coral-400 hover:text-paper"
                        : "border-sense-blue/20 text-sense-blue/50 hover:bg-coral-400/15 hover:text-coral-400"
                    }`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-2 text-[11px] text-ink-500">Audiences are saved to your workspace.</p>
      </div>

      <TrendSearchPanel
        audiences={selectedAudiences}
        estCostPerTag={RESULTS_PER_HASHTAG * Object.values(EST_COST_PER_POST).reduce((a, b) => a + b, 0)}
        postsPerTag={RESULTS_PER_HASHTAG * Object.keys(EST_COST_PER_POST).length}
        {...search}
      />
    </Card>
  );
}
