import { ADVICE } from "@/lib/advice";

const styles = {
  [ADVICE.ACT_NOW]: "bg-sense-lime text-sense-navy",
  [ADVICE.USE_WITH_CARE]: "bg-amber-300 text-sense-navy",
  [ADVICE.WATCH]: "bg-sense-blue/15 text-sense-blue",
  [ADVICE.SKIP]: "bg-[#e2e6dd] text-ink-500",
};

export default function AdviceBadge({ advice }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-center text-[10px] leading-tight font-bold uppercase sm:whitespace-nowrap ${styles[advice]}`}>
      {advice}
    </span>
  );
}
