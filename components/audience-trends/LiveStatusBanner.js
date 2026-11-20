"use client";

function timeAgo(ts) {
  if (!ts) return null;
  const mins = Math.round((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

export default function LiveStatusBanner({ isSample, updatedAt, liveAudiences, errors, isRunning }) {
  const status = isRunning
    ? "Searching TikTok & Instagram… (can take a few minutes)"
    : isSample
      ? "Showing sample data · choose an audience to run a search"
      : `Live · updated ${timeAgo(updatedAt)}`;

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-paper/60 bg-paper/95 px-4 py-3 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.14)]">
      <div>
        <p className="text-sm font-semibold">Live audience trend tracker</p>
        <p className="text-xs text-ink-500">
          {liveAudiences?.length
            ? `Latest search: ${liveAudiences.join(", ")}`
            : "Sense AI scans social activity when you run a trend search."}
        </p>
        {errors.length > 0 && (
          <p role="alert" className="mt-1 text-xs text-coral-400">
            {errors.join(" · ")}
          </p>
        )}
      </div>
      <span aria-live="polite" className="rounded-full bg-sense-lime px-3 py-1 text-[11px] font-bold">
        {isRunning && <span aria-hidden="true" className="mr-1 inline-block animate-pulse">●</span>}
        {status}
      </span>
    </section>
  );
}
