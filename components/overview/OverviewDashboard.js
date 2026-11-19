"use client";

// Marketing Overview, laid out like the Marketing Intelligence Hub Figma Make app.
// The numbers are placeholder data until the competitor, analytics and reports
// sources are connected; swap OVERVIEW_DATA for real values when they are.

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Change, Eyebrow, PageTitle, SampleNote, Toggle, isNegative } from "@/components/ui/Dashboard";

const PERIODS = ["7 days", "30 days"];

const OVERVIEW_DATA = {
  "7 days": {
    competitors: [
      { name: "GuestSupply", change: "+2.5%", posts: 10 },
      { name: "Out of Eden", change: "+1.3%", posts: 30 },
      { name: "Hotel Buyer", change: "-0.5%", posts: 23 },
    ],
    interest: { score: 81.5, change: "-2.6%", label: "Slight decrease" },
    audience: { value: "+100", change: "+0.6%", label: "New audience members in one week" },
    engagement: { value: "20%", change: "+3.5%", bars: [35, 29, 74, 43, 59] },
    planning: { date: "Nov 10" },
    channels: [
      { icon: "instagram", name: "Instagram", momentum: "+10%", change: "+1.5%" },
      { icon: "message", name: "Facebook", momentum: "-5%", change: "-1.5%" },
      { icon: "search", name: "Web", momentum: "+5%", change: "+3.5%" },
      { icon: "email", name: "Email", momentum: "—", change: "Stable" },
    ],
  },
  "30 days": {
    competitors: [
      { name: "GuestSupply", change: "+6.1%", posts: 41 },
      { name: "Out of Eden", change: "+4.8%", posts: 112 },
      { name: "Hotel Buyer", change: "-1.9%", posts: 87 },
    ],
    interest: { score: 84.1, change: "+3.2%", label: "Steady increase" },
    audience: { value: "+420", change: "+2.4%", label: "New audience members in 30 days" },
    engagement: { value: "26%", change: "+5.1%", bars: [42, 51, 47, 63, 70] },
    planning: { date: "Nov 24" },
    channels: [
      { icon: "instagram", name: "Instagram", momentum: "+18%", change: "+4.2%" },
      { icon: "message", name: "Facebook", momentum: "-2%", change: "-0.8%" },
      { icon: "search", name: "Web", momentum: "+9%", change: "+2.1%" },
      { icon: "email", name: "Email", momentum: "+1%", change: "+0.4%" },
    ],
  },
};

function Card({ className = "", children }) {
  return (
    <article
      className={`col-span-12 flex min-w-0 flex-col rounded-[24px] border border-paper/40 bg-paper/[0.92] p-5 text-sense-navy shadow-[0_9px_0_rgba(0,31,63,0.12),0_18px_34px_rgba(0,31,63,0.1)] backdrop-blur-md sm:min-h-[250px] sm:px-6 sm:py-[22px] ${className}`}
    >
      {children}
    </article>
  );
}

function CardHeading({ eyebrow, title, aside }) {
  return (
    <div className="flex items-start justify-between gap-3.5">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="text-[17px] font-bold text-sense-blue">{title}</h3>
      </div>
      {aside}
    </div>
  );
}

function CardLink({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-[3px] whitespace-nowrap text-[10px] font-bold text-sense-blue transition-all hover:gap-1.5 hover:underline ${className}`}
    >
      {children} <Icon name="chevron" size={14} />
    </Link>
  );
}

function Muted({ children }) {
  return <p className="mt-2 text-[11px] leading-[1.5] text-[#5f706e]">{children}</p>;
}

function CompetitorActivities({ competitors }) {
  const cell = "grid h-[58px] place-items-center border-b border-sense-blue/15 text-[clamp(20px,2.2vw,29px)]";
  return (
    <Card className="xl:col-span-6">
      <CardHeading eyebrow="Live watchlist" title="Competitor Activities" aside={<CardLink href="/competitors">View details</CardLink>} />
      <div className="mt-7 grid grid-cols-[70px_repeat(3,minmax(70px,1fr))] overflow-x-auto sm:grid-cols-[90px_repeat(3,minmax(0,1fr))]">
        <div className="grid grid-rows-[58px_58px] text-[10px] text-[#697779]">
          <span className="flex items-center border-b border-sense-blue/15">Change</span>
          <span className="flex items-center border-b border-sense-blue/15">Posts</span>
        </div>
        {competitors.map(({ name, change, posts }) => (
          <div key={name} className="grid grid-rows-[58px_58px_34px] text-center">
            <strong className={`${cell} font-normal ${isNegative(change) ? "text-[#d8505a]" : "text-sense-blue"}`}>
              {change}
            </strong>
            <b className={`${cell} font-normal`}>{posts}</b>
            <span className="self-end text-[10px] text-[#1d4990]">{name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MarketInterest({ interest }) {
  // The semicircle is the top half of a conic gradient, so the score fills half of it.
  const fill = interest.score / 2;
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading eyebrow="Market signal" title="Market Interest" aside={<Change value={interest.change} />} />
      <Muted>{interest.label}</Muted>
      <div
        role="img"
        aria-label={`Market interest ${interest.score} percent`}
        className="relative mx-auto mt-[34px] h-[106px] w-full max-w-[210px] overflow-hidden"
      >
        <div
          className="absolute inset-0 rounded-t-[210px]"
          style={{
            background: `conic-gradient(from 270deg, var(--color-sense-lime) 0 ${fill}%, #1d4990 ${fill}% 50%, #dce5d1 50% 100%)`,
          }}
        />
        <div className="absolute inset-x-7 -bottom-px h-[78px] rounded-t-[120px] bg-paper" />
        <div className="absolute inset-x-0 bottom-1 z-10 grid justify-items-center">
          <strong className="text-[27px] font-medium">{interest.score}%</strong>
          <span className="text-[9px] text-[#697779]">interest score</span>
        </div>
      </div>
    </Card>
  );
}

function AudienceGrowth({ audience }) {
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading eyebrow="Across 4 channels" title="Audience Growth" aside={<Change value={audience.change} />} />
      <div className="mt-[50px] mb-6 flex items-center gap-3.5">
        <span className="text-[#1d4990]">
          <Icon name="audience" size={32} />
        </span>
        <strong className="text-4xl font-semibold">{audience.value}</strong>
      </div>
      <Muted>{audience.label}</Muted>
      <CardLink href="/audience-trends" className="mt-5">
        Explore audience
      </CardLink>
    </Card>
  );
}

function Engagement({ engagement }) {
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading eyebrow="Content response" title="Engagement" aside={<Change value={engagement.change} />} />
      <strong className="mt-6 block text-[34px] font-normal">{engagement.value}</strong>
      <Muted>Increase over the selected period</Muted>
      <div aria-hidden="true" className="mt-6 flex h-[92px] items-end gap-[9px]">
        {engagement.bars.map((height, i) => (
          <i
            key={i}
            className="min-h-3 w-6 rounded-t-[5px] rounded-b-[2px] bg-[#1d4990] transition-[height] duration-300"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

function Planning({ planning }) {
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading eyebrow="Your next move" title="Planning" />
      <div className="mt-12 flex items-center gap-3.5">
        <span className="text-[#1d4990]">
          <Icon name="calendar" size={29} />
        </span>
        <strong className="text-[31px] font-normal">{planning.date}</strong>
      </div>
      <Muted>Next recommended publishing window</Muted>
      <CardLink href="/content-creation" className="mt-5">
        Create content
      </CardLink>
    </Card>
  );
}

function CrossChannel({ channels }) {
  return (
    <Card className="xl:col-span-6">
      <CardHeading eyebrow="Channel comparison" title="Cross-Channel Momentum" aside={<CardLink href="/reports">Open report</CardLink>} />
      <div className="mt-[26px] grid grid-cols-2 gap-x-2.5 gap-y-6 sm:grid-cols-4">
        {channels.map(({ icon, name, momentum, change }) => (
          <div key={name} className="grid justify-items-center gap-3 text-center">
            <Change value={change} />
            <strong className="text-[26px] font-normal">{momentum}</strong>
            <span className="grid size-[54px] place-items-center rounded-full bg-sense-blue text-paper">
              <Icon name={icon} size={20} />
            </span>
            <small className="text-[10px] font-bold text-sense-blue">{name}</small>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function OverviewDashboard() {
  const [period, setPeriod] = useState(PERIODS[0]);
  const data = OVERVIEW_DATA[period];

  return (
    <div className="w-full">
      <PageTitle eyebrow="Your workspace today" title="Marketing Overview">
        <Toggle label="Time period" options={PERIODS} value={period} onChange={setPeriod} />
      </PageTitle>

      <div className="grid grid-cols-12 gap-3.5 lg:gap-[18px]">
        <CompetitorActivities competitors={data.competitors} />
        <MarketInterest interest={data.interest} />
        <AudienceGrowth audience={data.audience} />
        <Engagement engagement={data.engagement} />
        <Planning planning={data.planning} />
        <CrossChannel channels={data.channels} />
      </div>

      <SampleNote />
    </div>
  );
}
