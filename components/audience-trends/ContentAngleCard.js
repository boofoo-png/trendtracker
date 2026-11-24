export default function ContentAngleCard({ angle, loading = false }) {
  return (
    <article
      className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#001f3e,#03525e)] p-5 text-paper shadow-[0_6px_0_rgba(0,31,62,0.2)]"
      aria-busy={loading}
    >
      {/* soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-lime-400/15 blur-3xl"
      />
      <p className="relative text-[13px] font-semibold uppercase tracking-wider text-lime-400">
        ✦ AI content angle
      </p>
      <div className="relative">
        {loading ? (
          <div className="space-y-2" aria-label="Generating">
            <div className="h-5 w-11/12 animate-pulse rounded bg-white/15" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-white/15" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold leading-snug">{angle?.headline}</h3>
            <p className="mt-3 text-xs text-paper/75">{angle?.summary}</p>
          </>
        )}
      </div>
    </article>
  );
}
