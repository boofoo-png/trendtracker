"use client";

// Trend search for the selected audiences, in two explicit steps:
//   1. "Find trends"      → Gemini proposes hashtags (free, nothing scraped)
//   2. "Run trend search" → Apify scrapes them (costs credits) + Gemini scores fit

// The Apify cost is for the developer, not customers: shown only when running
// locally (`npm run dev`). Every search's estimate is also saved in Supabase
// (trend_searches.est_cost_usd).
const SHOW_COST = process.env.NODE_ENV === "development";

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export default function TrendSearchPanel({
  audiences,
  liveAudiences,
  estCostPerTag,
  postsPerTag,
  searchPlan,
  isPlanning,
  isRunning,
  planSearch,
  removePlanTag,
  cancelSearch,
  runSearch,
  backgroundSearch,
}) {
  const hasSelection = audiences.length > 0;
  const planIsStale = searchPlan && !sameSet(searchPlan.audiences, audiences);
  const showingSelected = liveAudiences?.length > 0 && sameSet(liveAudiences, audiences);

  // Step 2: confirm
  if (searchPlan && !planIsStale) {
    const tags = searchPlan.hashtags;
    const cost = (tags.length * estCostPerTag).toFixed(2);

    return (
      <section
        aria-label="Confirm trend search"
        className="mt-4 rounded-xl border border-sense-blue/15 bg-white/70 p-4"
      >
        <p className="text-sm font-semibold">
          Search trends for {searchPlan.audiences.join(", ")}
        </p>

        {tags.length > 0 ? (
          <>
            <p className="mt-1 text-xs text-ink-500">
              Sense AI suggests these hashtags. Remove any you don&apos;t want, then confirm.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tags.map((h) => (
                <li
                  key={h.tag}
                  className="flex items-center rounded-full bg-sense-lime/60 text-xs font-semibold"
                  title={h.audience ? `For ${h.audience}` : undefined}
                >
                  <span className="py-1 pl-3 pr-1">#{h.tag}</span>
                  <button
                    type="button"
                    aria-label={`Remove #${h.tag}`}
                    disabled={isRunning}
                    onClick={() => removePlanTag(h.tag)}
                    className="py-1 pl-1 pr-3 opacity-60 hover:opacity-100 disabled:opacity-30"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink-500">
              Searches TikTok + Instagram · up to {tags.length * postsPerTag} posts · takes 1–5 min
            </p>
            {SHOW_COST && (
              <p className="mt-1 w-max rounded-md border border-dashed border-sense-blue/30 px-2 py-0.5 text-[11px] text-ink-500">
                Dev only: est. ~${cost} of Apify credit
              </p>
            )}
          </>
        ) : (
          !searchPlan.error && (
            <p className="mt-1 text-xs text-ink-500">All hashtags removed. Nothing to search.</p>
          )
        )}

        {searchPlan.error && (
          <p role="alert" className="mt-2 text-xs text-coral-400">
            {searchPlan.error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runSearch}
            disabled={isRunning || tags.length === 0}
            className="cursor-pointer rounded-[18px] bg-sense-blue text-xs font-bold text-paper transition-colors hover:bg-sense-blue/85 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2"
          >
            {isRunning ? "Searching… (1–5 min)" : "Run trend search"}
          </button>
          <button
            type="button"
            onClick={cancelSearch}
            disabled={isRunning}
            className="cursor-pointer rounded-[18px] border border-sense-blue/20 bg-white/70 text-xs font-bold text-sense-blue transition-colors hover:bg-sense-blue/10 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }

  // Step 1: start
  return (
    // A short, bold label so it reads as a button; the audience names go in the text beside it.
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <button
        type="button"
        onClick={planSearch}
        disabled={!hasSelection || isPlanning || isRunning || Boolean(backgroundSearch)}
        className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[24px] bg-sense-lime px-6 text-sm font-bold text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.18)] transition hover:-translate-y-px hover:bg-sense-blue hover:text-paper active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,31,62,0.18)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-sense-lime disabled:hover:text-sense-navy"
      >
        <span aria-hidden="true">✦</span>
        {backgroundSearch
          ? "Search in progress…"
          : isPlanning
            ? "Choosing hashtags…"
            : showingSelected
              ? "Find trends again"
              : "Find trends"}
      </button>
      <p className="text-xs leading-[1.5] text-ink-500">
        {backgroundSearch ? (
          "A search is already running. Its results will show up on this page automatically."
        ) : !hasSelection ? (
          "Select one or more saved audiences first."
        ) : (
          <>
            For <strong className="font-semibold text-sense-navy">{audiences.join(", ")}</strong>.{" "}
            {showingSelected
              ? "The trends below are already for this selection. Run again to update them."
              : "You'll review the hashtags before anything runs."}
          </>
        )}
      </p>
    </div>
  );
}
