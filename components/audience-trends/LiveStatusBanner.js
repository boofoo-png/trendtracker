"use client";

// Says what the trends on this page are: which audiences they were searched for, when,
// and whether that still matches the audiences selected now.

function timeAgo(ts) {
  if (!ts) return null;
  const mins = Math.round((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

const day = (ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

const startedAgo = (ts) => {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  return mins < 1 ? "just now" : `${mins} min ago`;
};

export default function LiveStatusBanner({ isSample, updatedAt, liveAudiences = [], audiences = [], errors, isRunning: runningHere, backgroundSearch }) {
  // Running in this visit, or started earlier / elsewhere and still going.
  const isRunning = runningHere || Boolean(backgroundSearch);
  const status = backgroundSearch && !runningHere
    ? `Still searching… started ${startedAgo(backgroundSearch.startedAt)}`
    : isRunning
    ? "Searching TikTok & Instagram… (can take a few minutes)"
    : isSample
      ? "Sample data"
      : `Live data · ${timeAgo(updatedAt)}`;

  // Results are for one set of audiences; the selection may have changed since.
  const changed = !isSample && !isRunning && liveAudiences.length > 0 && audiences.length > 0 && !sameSet(liveAudiences, audiences);

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-paper/60 bg-paper/95 px-4 py-3 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.14)]">
      <div className="min-w-0">
        {isSample ? (
          <>
            <p className="text-sm font-semibold">Showing example trends</p>
            {!isRunning && (
              <p className="text-xs text-[#4b5d60]">Choose your audiences below and press Find trends to see real ones.</p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-semibold">Showing trends for:</span> {liveAudiences.length ? liveAudiences.join(", ") : "your last search"}
            </p>
            <p className="text-xs text-[#4b5d60]">{updatedAt ? `From your search on ${day(updatedAt)}` : "From your last search"}</p>
          </>
        )}
        {backgroundSearch && !runningHere && (
          <p className="mt-1.5 rounded-lg bg-sense-blue/10 px-2.5 py-1.5 text-xs text-sense-navy">
            A trend search for <strong>{backgroundSearch.audiences?.join(", ") || "your audiences"}</strong> is still running.
            The new trends will appear here automatically when it’s done. You don’t need to search again.
          </p>
        )}
        {changed && (
          <p className="mt-1.5 rounded-lg bg-sense-blue/10 px-2.5 py-1.5 text-xs text-sense-navy">
            Your selected audiences have changed. Press <strong>Find trends</strong> to update these results.
          </p>
        )}
        {errors.length > 0 && (
          <p role="alert" className="mt-1 text-xs text-coral-400">
            {errors.join(" · ")}
          </p>
        )}
      </div>
      <span aria-live="polite" className="rounded-full bg-sense-blue/10 px-3 py-1 text-[13px] font-bold text-sense-blue">
        {isRunning && <span aria-hidden="true" className="mr-1 inline-block animate-pulse">●</span>}
        {status}
      </span>
    </section>
  );
}
