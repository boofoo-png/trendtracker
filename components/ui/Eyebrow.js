export default function Eyebrow({ tone = "accent", children }) {
  const color = tone === "accent" ? "text-coral-400" : "text-ink-500";
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${color}`}>{children}</p>
  );
}
