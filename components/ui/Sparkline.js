export default function Sparkline({ data, width = 120, height = 24 }) {
  if (!data?.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * (width - 4) + 2,
    height - 2 - ((v - min) / range) * (height - 4),
  ]);
  const [lastX, lastY] = points.at(-1);
  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx={lastX} cy={lastY} r="2.5" className="fill-coral-400" />
    </svg>
  );
}
