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
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
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

        <button
          type="button"
          onClick={() => {
            ai.ask();
            setOpen(true);
          }}
          disabled={query.trim().length < 3 || ai.loading}
          title="Ask Sense AI for related audiences (uses Gemini)"
          className="cursor-pointer rounded-[18px] border border-sense-blue/20 bg-white/70 text-xs font-bold text-sense-blue transition-colors hover:bg-sense-blue/10 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2.5"
        >
          {ai.loading ? "✦ Thinking…" : "✦ Suggest with AI"}
        </button>
        <button
          type="button"
          onClick={() => query.trim() && add(query)}
          disabled={!query.trim()}
          className="cursor-pointer rounded-[18px] border border-sense-blue/20 bg-white/70 text-xs font-bold text-sense-blue transition-colors hover:bg-sense-blue/10 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2.5"
        >
          + Add custom audience
        </button>
      </div>
      {ai.error && <p className="mt-1 text-[11px] text-ink-500">{ai.error}</p>}

      {/* Saved audiences */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider">
          Saved to your profile{" "}
          <span className="font-normal normal-case tracking-normal text-ink-500">
            Select one or more audiences to compare their trends.
          </span>
        </p>

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
              return (
                <li
                  key={name}
                  className={`flex items-center rounded-full text-xs font-semibold transition-colors ${isSelected ? "bg-sense-blue text-paper" : "border border-sense-blue/20 bg-white/70 text-sense-blue"}`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleAudience(name)}
                    className="py-1.5 pl-3 pr-1"
                  >
                    {name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeAudience(name)}
                    className="py-1.5 pl-1 pr-3 opacity-60 hover:opacity-100"
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
