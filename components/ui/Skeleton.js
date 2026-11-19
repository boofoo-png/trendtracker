// Grey shimmering placeholder shown while browser-saved data loads.
export default function Skeleton({ className = "", tone = "light" }) {
  const color = tone === "dark" ? "bg-paper/25" : "bg-sense-blue/10";
  return <span aria-hidden="true" className={`block animate-pulse rounded-md ${color} ${className}`} />;
}

/** A card-shaped block of placeholder lines. */
export function SkeletonPanel({ lines = 4, className = "" }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`grid gap-3 rounded-[22px] border border-paper/60 bg-paper/95 p-6 shadow-[0_6px_0_rgba(0,31,62,0.16),0_18px_30px_rgba(0,31,62,0.1)] ${className}`}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-1/2" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-9 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
