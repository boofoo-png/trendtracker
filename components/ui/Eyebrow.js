export default function Eyebrow({ tone = "muted", children }) {
  const color = tone === "accent" ? "text-coral-400" : "text-ink-500";
  return (
    <p className={`mb-[5px] text-[9px] font-bold uppercase tracking-[0.11em] ${color}`}>{children}</p>
  );
}
