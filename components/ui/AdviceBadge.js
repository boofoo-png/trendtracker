import { ADVICE } from "@/lib/advice";

const styles = {
  [ADVICE.ACT_NOW]: "bg-teal-900 text-white",
  [ADVICE.USE_WITH_CARE]: "bg-amber-300 text-teal-900",
  [ADVICE.WATCH]: "bg-gray-500 text-white",
  [ADVICE.SKIP]: "bg-gray-200 text-ink-500",
};

export default function AdviceBadge({ advice }) {
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${styles[advice]}`}>
      {advice}
    </span>
  );
}
