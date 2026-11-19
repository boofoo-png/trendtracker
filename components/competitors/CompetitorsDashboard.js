"use client";

// Competitor performance, laid out like the Marketing Intelligence Hub Figma Make app.
// Placeholder data until competitor tracking is connected; swap CAMPAIGNS for real values.

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Eyebrow, PageTitle, Panel, PanelHeading, SampleNote } from "@/components/ui/Dashboard";
import { saveContentTrend } from "@/lib/contentTrend";

const FINDINGS = [
  "All findings",
  "Most viewed post",
  "Most liked post",
  "Most popular item",
  "Most popular trends",
  "Common reused layouts",
  "Most used by users",
];

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=82&w=1080`;

const CAMPAIGNS = [
  {
    id: "product-launch",
    brand: "GuestSupply",
    date: "7 Oct · 2 weeks ago",
    title: "Product launch announcement",
    description: "Explore how competitors frame product launches across paid and organic channels.",
    tags: ["Most popular trends", "Most liked post"],
    channel: "Paid social",
    platform: "Instagram",
    format: "Product demo Reel",
    image: unsplash("1711060001575-2cfa3c5a2bfa"),
    unit: "Reels",
    yours: { count: 4, engagement: 1.8 },
    theirs: { count: 12, engagement: 3.6 },
  },
  {
    id: "seasonal-offer",
    brand: "Out of Eden",
    date: "6 Aug · 1 month ago",
    title: "Seasonal offer campaign",
    description: "Compare seasonal offers across email, web and paid campaigns.",
    tags: ["Most viewed post", "Common reused layouts"],
    channel: "Cross-channel",
    platform: "Instagram",
    format: "Offer carousel",
    image: unsplash("1663465803384-77c2df8ab422"),
    unit: "posts",
    yours: { count: 6, engagement: 2.1 },
    theirs: { count: 15, engagement: 4.2 },
  },
  {
    id: "community-spotlight",
    brand: "Hotel Buyer",
    date: "21 Oct · 21h ago",
    title: "Community spotlight",
    description: "See how community stories encourage engagement and content sharing.",
    tags: ["Most popular item", "Most used by users"],
    channel: "Organic",
    platform: "TikTok",
    format: "Customer story",
    image: unsplash("1648042497232-25de1ed8aaf2"),
    unit: "stories",
    yours: { count: 5, engagement: 2.4 },
    theirs: { count: 11, engagement: 4.0 },
  },
];

const fmt = (n) => `${n.toFixed(1)}%`;

function CampaignCard({ campaign, active, dimmed, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group min-w-0 cursor-pointer overflow-hidden rounded-[21px] border border-paper/75 bg-paper/95 text-left text-sense-navy shadow-[0_6px_0_rgba(0,31,62,0.17),0_18px_30px_rgba(0,31,62,0.11)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_4px_0_rgba(0,31,62,0.2),0_20px_34px_rgba(0,31,62,0.16)] ${
        active ? "-translate-y-[3px] outline-2 -outline-offset-2 outline-sense-lime" : ""
      } ${dimmed ? "opacity-45" : ""}`}
    >
      <div className="relative h-[118px] overflow-hidden bg-sense-blue">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote placeholder imagery */}
        <img
          src={campaign.image}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,31,62,0.04),rgba(0,31,62,0.62))]" />
        <span className="absolute bottom-3 left-4 z-10 text-[11px] font-bold text-paper">{campaign.brand}</span>
        {active && (
          <em className="absolute right-3.5 bottom-3 z-10 rounded-xl bg-sense-lime px-2 py-1 text-[9px] font-bold uppercase not-italic">
            Selected
          </em>
        )}
      </div>
      <div className="grid gap-[7px] px-[17px] pt-[15px] pb-[17px]">
        <small className="text-[10px] text-[#718083]">{campaign.date}</small>
        <strong className="text-sm text-sense-blue">{campaign.title}</strong>
        <p className="min-h-9 text-[11px] leading-[1.55] text-[#5d6e71]">{campaign.description}</p>
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          <span className="rounded-[14px] bg-sense-lime px-2 py-[5px] text-[10px] font-bold">{campaign.tags[0]}</span>
          <span className="rounded-[14px] bg-[#e2eadf] px-2 py-[5px] text-[10px] font-bold text-sense-blue">
            {campaign.channel}
          </span>
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value, note, highlight }) {
  return (
    <div
      className={`grid gap-[5px] rounded-[11px] border border-sense-blue/10 p-[13px] ${
        highlight ? "bg-[linear-gradient(145deg,rgba(221,254,86,0.35),rgba(255,255,255,0.75))]" : "bg-white/70"
      }`}
    >
      <span className="text-[10px] text-[#708083]">{label}</span>
      <strong className="text-xl font-medium text-sense-blue">{value}</strong>
      <small className="text-[10px] text-[#5c896c]">{note}</small>
    </div>
  );
}

function Comparison({ campaign, gap }) {
  return (
    <Panel className="lg:col-span-5">
      <div className="mb-3.5">
        <PanelHeading
          eyebrow="Active benchmark"
          title="Competitor comparison"
          subtitle={`${campaign.brand} · Last 30 days`}
          aside={
            <span className="whitespace-nowrap rounded-[14px] bg-sense-lime px-2.5 py-[5px] text-[10px] font-extrabold">
              {gap.toFixed(1)} pts gap
            </span>
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-[9px]">
        <Stat label="Your business" value={`${campaign.yours.count} ${campaign.unit}`} note={`${fmt(campaign.yours.engagement)} avg engagement`} />
        <Stat highlight label={campaign.brand} value={`${campaign.theirs.count} ${campaign.unit}`} note={`${fmt(campaign.theirs.engagement)} avg engagement`} />
        <Stat label="Engagement gap" value={`${gap.toFixed(1)} pts`} note={gap > 0 ? "competitor lead" : "your lead"} />
        <Stat label="Period" value="Last 30 days" note="unweighted average" />
      </div>
      <div className="mt-2.5 flex items-start gap-[9px] rounded-[10px] bg-[#e3eadd] p-3 text-sense-blue">
        <Icon name="trend" size={16} className="mt-0.5 shrink-0" />
        <p className="grid gap-1 text-[10px] leading-[1.5] text-[#68777a]">
          <strong className="text-[11px] text-sense-blue">Evidence note</strong>
          Post rate = engagements ÷ reach × 100; averages are unweighted. A test opportunity, not a
          guarantee.
        </p>
      </div>
    </Panel>
  );
}

function NextMove({ campaign }) {
  const { yours, theirs, brand, unit } = campaign;
  const target = Math.min(theirs.engagement, yours.engagement + 0.6);
  const steps = [
    [
      "Spot the opportunity",
      `Your ${fmt(yours.engagement)} engagement trails ${brand} at ${fmt(theirs.engagement)}. Test a stronger ${campaign.format.toLowerCase()} next week.`,
    ],
    [
      "Post Tuesday, repeat Friday",
      "Film a 20–30s piece: customer problem → product solution → question. Try a different use case on Friday.",
    ],
    [
      `Review your ${unit} after 7 days`,
      `Beat your ${fmt(yours.engagement)} baseline. Aim first for ${fmt(target)}; the competitor benchmark is ${fmt(theirs.engagement)}.`,
    ],
  ];

  const handoff = () =>
    saveContentTrend({
      name: campaign.title,
      audience: `${brand} benchmark`,
      platform: campaign.platform,
      format: campaign.format,
      hook: `Close the engagement gap with ${brand} (${fmt(theirs.engagement)}).`,
    });

  return (
    <Panel className="flex flex-col lg:col-span-7">
      <div className="mb-3.5">
        <PanelHeading
          eyebrow="Action plan"
          title="Your next move"
          subtitle="Turn the benchmark into your next post."
          aside={
            <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-sense-lime text-sense-navy">
              <Icon name="sparkles" size={17} />
            </span>
          }
        />
      </div>
      <ol className="grid gap-[9px]">
        {steps.map(([title, description], i) => (
          <li
            key={title}
            className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-[11px] rounded-[11px] border border-sense-blue/10 bg-white/70 p-3"
          >
            <span className="grid size-7 place-items-center rounded-[9px] bg-sense-lime text-[11px] font-extrabold">
              {i + 1}
            </span>
            <div>
              <strong className="text-xs text-sense-blue">{title}</strong>
              <p className="mt-0.5 text-[11px] leading-[1.5] text-[#5d6e71]">{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <footer className="mt-auto flex flex-col items-start justify-between gap-3 pt-4 sm:flex-row sm:items-center">
        <p className="flex items-center gap-1.5 text-[10px] text-[#68777a]">
          <Icon name="sparkles" size={14} /> Recommendations refresh as new competitor activity is detected.
        </p>
        <Link
          href="/content-creation"
          onClick={handoff}
          className="inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[20px] bg-sense-blue px-4 text-[11px] font-bold text-paper shadow-[0_4px_0_rgba(0,31,62,0.2)] transition hover:translate-y-0.5 hover:shadow-[0_2px_0_rgba(0,31,62,0.2)]"
        >
          Create from this insight <Icon name="chevron" size={14} />
        </Link>
      </footer>
    </Panel>
  );
}

export default function CompetitorsDashboard() {
  const [finding, setFinding] = useState(FINDINGS[0]);
  const [activeId, setActiveId] = useState(CAMPAIGNS[0].id);
  const active = CAMPAIGNS.find((c) => c.id === activeId) ?? CAMPAIGNS[0];
  const gap = active.theirs.engagement - active.yours.engagement;

  return (
    <div className="w-full">
      <PageTitle
        eyebrow="Competitive intelligence"
        title="Competitor performance"
        description="See how your business compares with competitors, and explore the campaigns driving their performance."
      >
        <span className="inline-flex min-h-8 items-center gap-[7px] whitespace-nowrap rounded-[17px] border border-paper/30 bg-paper/10 px-3.5 text-[11px] text-paper/90">
          <i className="size-[7px] rounded-full bg-sense-lime shadow-[0_0_0_4px_rgba(221,254,86,0.16)]" />
          Sample data
        </span>
      </PageTitle>

      <section aria-label="Filter by findings" className="mb-[18px] flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3.5">
        <Eyebrow className="mb-0 whitespace-nowrap text-paper/75">Filter by findings</Eyebrow>
        <div className="flex flex-wrap gap-[7px]">
          {FINDINGS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={finding === item}
              onClick={() => setFinding(item)}
              className={`min-h-[30px] cursor-pointer rounded-2xl border px-3.5 text-[11px] font-bold text-sense-navy transition hover:-translate-y-px hover:border-sense-lime hover:bg-sense-lime ${
                finding === item ? "-translate-y-px border-sense-lime bg-sense-lime" : "border-paper/40 bg-paper/90"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-5 grid gap-[18px] md:grid-cols-3">
        {CAMPAIGNS.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            active={campaign.id === active.id}
            dimmed={finding !== "All findings" && !campaign.tags.includes(finding)}
            onSelect={() => setActiveId(campaign.id)}
          />
        ))}
      </div>

      <div className="grid gap-[18px] lg:grid-cols-12">
        <Comparison campaign={active} gap={gap} />
        <NextMove campaign={active} />
      </div>

      <SampleNote />
    </div>
  );
}
