// What the Overview, Competitors and Reports screens show, for Sense AI. Overview and
// Reports are built from the same sample series (lib/sample), so the assistant always
// quotes the numbers the marketer sees. It's told they are sample figures.

import { resolvePeriod } from "@/lib/periods";
import { overviewFor } from "@/lib/sample/overview";
import { reportFor } from "@/lib/sample/reports";

function periodLines(preset, today) {
  const range = resolvePeriod({ preset }, today);
  const o = overviewFor(range, today);
  const r = reportFor(range);
  const kpis = r.kpis.map(([label, value, change]) => `${label.toLowerCase()} ${value} (${change})`).join("; ");
  return [
    `- Last ${range.days} days vs the ${range.compareLabel}: ${kpis}.`,
    `  Interest in your topics: ${o.interest.posts} public posts mention the business's keywords (${o.interest.change} vs before); new followers ${o.audience.value} (${o.audience.change}); engagement rate ${o.engagement.value} (${o.engagement.change}).`,
    `  How each channel is doing (reach / engagement change): ${o.channels.map((c) => `${c.name} ${c.reach} / ${c.engagement}`).join(", ")}.`,
    `  Competitor posts: ${o.competitors.map((c) => `${c.name} ${c.posts} (${c.change})`).join(", ")}.`,
    `  Insight: ${r.insight}`,
  ].join("\n");
}

export function sampleSummary(today) {
  return [
    "SAMPLE DATA (demo figures on the Overview, Competitors and Reports pages; not real yet):",
    periodLines("7 days", today),
    periodLines("30 days", today),
    `- Best day to post next: ${overviewFor(resolvePeriod({ preset: "30 days" }, today), today).planning.date} (${overviewFor(resolvePeriod({ preset: "30 days" }, today), today).planning.reason})`,
    '- Competitor campaigns (last 30 days, your engagement vs theirs): GuestSupply "Product launch announcement" (paid social, product demo Reels) 1.8% vs 3.6%; Out of Eden "Seasonal offer campaign" (cross-channel carousels) 2.1% vs 4.2%; Hotel Buyer "Community spotlight" (organic customer stories on TikTok) 2.4% vs 4.0%.',
  ].join("\n");
}
