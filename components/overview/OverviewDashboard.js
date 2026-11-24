"use client";

// Marketing Overview, laid out like the Marketing Intelligence Hub Figma Make app.
// Figures are sample data (lib/sample) for the chosen date range until the competitor,
// analytics and reports sources are connected.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Change, Eyebrow, PageTitle, SampleNote, isNegative } from "@/components/ui/Dashboard";
import PeriodPicker from "@/components/ui/PeriodPicker";
import Skeleton from "@/components/ui/Skeleton";
import InfoTip from "@/components/ui/InfoTip";
import { useBusiness } from "@/lib/settings";
import BusinessProfileDialog from "@/components/settings/BusinessProfileDialog";
import { rangeLabel, resolvePeriod } from "@/lib/periods";
import { overviewFor } from "@/lib/sample/overview";
import { useToday } from "@/lib/calendar";
import usePeriod from "@/lib/usePeriod";

function Card({ className = "", children }) {
  return (
    <article
      className={`col-span-12 flex min-w-0 flex-col rounded-[24px] border border-paper/40 bg-paper/[0.92] p-5 text-sense-navy shadow-[0_9px_0_rgba(0,31,63,0.12),0_18px_34px_rgba(0,31,63,0.1)] backdrop-blur-md sm:min-h-[250px] sm:px-6 sm:py-[22px] ${className}`}
    >
      {children}
    </article>
  );
}

function CardHeading({ eyebrow, title, info, aside }) {
  return (
    <div className="flex items-start justify-between gap-3.5">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="text-[17px] font-bold text-sense-blue">
          {/* Keep the ⓘ on the same line as the title's last word. */}
          {title.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="whitespace-nowrap">
            {title.split(" ").at(-1)}
            {info && <InfoTip label={title}>{info}</InfoTip>}
          </span>
        </h3>
      </div>
      {aside}
    </div>
  );
}

/** Small trend line for a series of numbers. */
function Sparkline({ values, label }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 36 - ((v - min) / (max - min || 1)) * 32 - 2]);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg role="img" aria-label={label} viewBox="0 0 100 38" preserveAspectRatio="none" className="h-12 w-full">
      <polygon points={`0,38 ${line} 100,38`} fill="rgba(221,254,86,0.45)" />
      <polyline points={line} fill="none" stroke="#03525e" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

const joinWords = (words) =>
  words.length <= 1 ? words[0] ?? "" : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;

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
      <CardHeading
        eyebrow="Competitor watch"
        title="What competitors are posting"
        info="How many posts each competitor published in the selected dates, and how that compares with the period before."
        aside={<CardLink href="/competitors">View details</CardLink>}
      />
      <div className="mt-7 grid grid-cols-[70px_repeat(3,minmax(70px,1fr))] overflow-x-auto sm:grid-cols-[90px_repeat(3,minmax(0,1fr))]">
        <div className="grid grid-rows-[58px_58px] text-[10px] text-[#697779]">
          <span className="flex items-center border-b border-sense-blue/15">Posts</span>
          <span className="flex items-center border-b border-sense-blue/15 leading-tight">Change vs before</span>
        </div>
        {competitors.map(({ name, change, posts }) => (
          <div key={name} className="grid grid-rows-[58px_58px_34px] text-center">
            <b className={`${cell} font-normal`}>{posts}</b>
            <strong className={`${cell} font-normal ${isNegative(change) ? "text-[#d8505a]" : "text-sense-blue"}`}>
              {change}
            </strong>
            <span className="self-end text-[10px] text-[#1d4990]">{name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopicInterest({ interest, rangeLabel }) {
  const { keywords } = useBusiness();
  const [editingTopics, setEditingTopics] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 8000);
    return () => clearTimeout(t);
  }, [justSaved]);
  const topics = keywords.slice(0, 3);
  const n = Number.parseFloat(interest.change);
  const direction = Math.abs(n) < 1 ? "about the same as" : n > 0 ? "up from" : "down from";
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="Market buzz"
        title="Interest in your topics"
        info="How many public Instagram and TikTok posts mention your business keywords (set in Settings → Workspace), compared with the period before."
        aside={<Change value={interest.change} />}
      />
      <div className="mt-6">
        <Sparkline values={interest.spark} label={`Posts about your topics over ${rangeLabel}, ${interest.change} vs before`} />
      </div>
      <span
        className="mt-3 inline-flex w-max rounded-lg bg-sense-blue/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-sense-blue"
        title="These numbers are placeholders until post tracking is connected. Your topics are still saved and used by Sense AI."
      >
        Sample data
      </span>
      <p className="mt-1.5 text-[11px] leading-[1.5] text-[#41585c]">
        <strong className="text-sense-navy">{interest.posts.toLocaleString("en-US")} posts</strong> about{" "}
        {topics.length ? joinWords(topics) : "your topics"} in {rangeLabel}, {direction}{" "}
        {interest.prevPosts.toLocaleString("en-US")} before.
      </p>
      <button
        type="button"
        onClick={() => setEditingTopics(true)}
        className="mt-2 inline-flex cursor-pointer items-center gap-[3px] self-start text-[10px] font-bold whitespace-nowrap text-sense-blue transition-all hover:gap-1.5 hover:underline"
      >
        {topics.length ? "Change your topics" : "Choose your topics"} <Icon name="chevron" size={14} />
      </button>
      {justSaved && (
        <p role="status" className="mt-2 rounded-lg bg-sense-lime/60 px-2.5 py-1.5 text-[10px] leading-[1.45] font-semibold text-sense-navy">
          ✓ Topics saved. Sense AI now uses them when it suggests hashtags, writes content and plans campaigns.
        </p>
      )}
      {editingTopics && (
        <BusinessProfileDialog
          title="Your topics"
          focus="keywords"
          onClose={() => setEditingTopics(false)}
          onSaved={() => setJustSaved(true)}
        />
      )}
    </Card>
  );
}

function AudienceGrowth({ audience }) {
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="Audience growth"
        title="New followers"
        info="People who started following you on Instagram and Facebook, signed up on your website, or joined your email list in the selected dates."
        aside={<Change value={audience.change} />}
      />
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
      <CardHeading
        eyebrow="How people respond"
        title="Engagement rate"
        info="Of the people who saw your posts, the share who liked, commented or shared them. Higher means your content is landing."
        aside={<Change value={engagement.change} />}
      />
      <strong className="mt-6 block text-[34px] font-normal">{engagement.value}</strong>
      <Muted>{engagement.note}</Muted>
      <div aria-hidden="true" className="mt-5 flex h-[80px] items-end gap-[9px]">
        {engagement.bars.map((height, i) => (
          <i
            key={i}
            className="min-h-3 flex-1 rounded-t-[5px] rounded-b-[2px] bg-[#1d4990] transition-[height] duration-300"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[10px] text-[#697779]">
        <span>{engagement.barRange[0]}</span>
        <span>{engagement.barRange[1]}</span>
      </div>
    </Card>
  );
}

function Planning({ planning }) {
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="Your next move"
        title="Best day to post next"
        info="The next date that falls on one of the two weekdays that brought in the most sales during the selected dates."
      />
      <div className="mt-10 flex items-center gap-3">
        <span className="text-[#1d4990]">
          <Icon name="calendar" size={29} />
        </span>
        <strong className="text-[26px] font-normal whitespace-nowrap">{planning.date}</strong>
      </div>
      <Muted>{planning.reason}</Muted>
      <CardLink href="/content-creation" className="mt-5">
        Create content
      </CardLink>
    </Card>
  );
}

function CrossChannel({ channels }) {
  const tone = (v) => (isNegative(v) ? "text-[#d8505a]" : "text-sense-blue");
  return (
    <Card className="xl:col-span-6">
      <CardHeading
        eyebrow="Channel comparison"
        title="How each channel is doing"
        info="Reach: how many people saw your content. Engagement: how many of them liked, commented or shared. Both compared with the period before."
        aside={<CardLink href="/reports">Open report</CardLink>}
      />
      {/* One tile per channel, stretched to fill the card's height. */}
      <div className="mt-5 grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
        {channels.map(({ icon, name, reach, engagement }) => (
          <div
            key={name}
            className="flex flex-col items-center justify-center rounded-2xl border border-sense-blue/10 bg-white/55 px-2 py-5 text-center"
          >
            <span className="grid size-[52px] place-items-center rounded-full bg-sense-blue text-paper">
              <Icon name={icon} size={21} />
            </span>
            <strong className="mt-3 text-xs font-bold text-sense-blue">{name}</strong>
            <span className="mt-4 text-[10px] text-[#697779]">Reach</span>
            <strong className={`text-[24px] leading-tight font-normal ${tone(reach)}`}>{reach}</strong>
            <span className="mt-3 text-[10px] text-[#697779]">Engagement</span>
            <Change value={engagement} className="mt-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function OverviewSkeleton() {
  const spans = ["xl:col-span-6", "sm:col-span-6 xl:col-span-3", "sm:col-span-6 xl:col-span-3", "sm:col-span-6 xl:col-span-3", "sm:col-span-6 xl:col-span-3", "xl:col-span-6"];
  return (
    <div role="status" aria-label="Loading overview" className="grid grid-cols-12 gap-3.5 lg:gap-[18px]">
      {spans.map((span, i) => (
        <div key={i} className={`col-span-12 grid min-h-[250px] content-start gap-3 rounded-[24px] bg-paper/[0.92] p-6 ${span}`}>
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function OverviewDashboard() {
  const today = useToday(); // null until the browser takes over (dates depend on "today")
  const [period, setPeriod] = usePeriod();
  const range = today ? resolvePeriod(period, today) : null;
  const key = range?.key;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the range key captures everything that matters
  const data = useMemo(() => (range ? overviewFor(range, today) : null), [key]);

  return (
    <div className="w-full">
      <PageTitle
        eyebrow="Your workspace today"
        title="Marketing Overview"
        description={range ? `Showing ${rangeLabel(range.from, range.to)}, compared with the ${range.compareLabel}.` : "\u00a0"}
      >
        {today && <PeriodPicker value={period} onChange={setPeriod} today={today} />}
      </PageTitle>

      {!data ? (
        <OverviewSkeleton />
      ) : (
        <div className="grid grid-cols-12 gap-3.5 lg:gap-[18px]">
          <CompetitorActivities competitors={data.competitors} />
          <TopicInterest interest={data.interest} rangeLabel={range.label} />
          <AudienceGrowth audience={data.audience} />
          <Engagement engagement={data.engagement} />
          <Planning planning={data.planning} />
          <CrossChannel channels={data.channels} />
        </div>
      )}

      <SampleNote />
    </div>
  );
}
