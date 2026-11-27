"use client";

// Content Creation landing page, from the Marketing Intelligence Hub Figma Make app.
// Each card opens its creator screen.

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { clearContentTrend, forwardContentTrend, loadContentTrend, sourceOf } from "@/lib/contentTrend";
import { BackLink, MyContentLink } from "./ui";

const CREATE_OPTIONS = [
  {
    icon: "message",
    id: "social",
    title: "Write a new post",
    description: "Start from scratch. AI writes the caption and suggests visuals for your social post.",
  },
  {
    icon: "video",
    id: "video",
    title: "Video",
    description: "Short-form scripts and storyboards for engaging video content.",
  },
  {
    icon: "content",
    id: "blog",
    title: "Blog",
    description: "Articles and SEO-optimized content for your website and blog.",
  },
  {
    icon: "target",
    id: "ad",
    title: "Ad Copy",
    description: "Campaign copy and ad creative optimized for conversion.",
  },
];

const HERE = "/content-creation";

function SelectedTrend({ trend, onClear }) {
  const source = sourceOf(trend);
  return (
    <section
      aria-label={source.label}
      className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-[18px] border border-sense-lime/70 bg-[linear-gradient(110deg,rgba(0,31,62,0.78),rgba(3,82,94,0.58)),rgba(0,31,62,0.7)] px-[18px] py-[15px] text-paper shadow-[0_12px_30px_rgba(0,31,62,0.16)] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <span className="grid size-[42px] place-items-center rounded-[13px] bg-sense-lime text-sense-navy">
        <Icon name="trend" size={20} />
      </span>
      <div className="grid min-w-0 gap-[3px]">
        <small className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-sense-lime">
          {source.label}
        </small>
        <strong className="text-[15px]">
          {trend.name}
          {trend.audience && <span className="font-medium text-paper/70"> × {trend.audience}</span>}
        </strong>
        <p className="text-xs leading-normal text-paper/80">
          {trend.hook ? `${trend.hook} ` : ""}Choose a content type below and Sense AI will build on
          this {source.noun}.
        </p>
      </div>
      <div className="col-start-2 flex items-center gap-2 justify-self-start sm:col-start-auto">
        {(trend.platform || trend.format) && (
          <span className="whitespace-nowrap rounded-full border border-paper/25 px-2.5 py-[7px] text-[11px] font-bold text-paper/90">
            {[trend.platform, trend.format].filter(Boolean).join(" · ")}
          </span>
        )}
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer whitespace-nowrap rounded-full bg-paper/15 px-3 py-[7px] text-xs font-bold text-paper transition hover:bg-paper/25"
        >
          × Clear
        </button>
      </div>
    </section>
  );
}

function ActionCard({ id, icon, title, description }) {
  return (
    <Link
      href={`/content-creation/${id}`}
      onClick={() => forwardContentTrend(HERE, `/content-creation/${id}`)}
      className="group relative flex min-h-[166px] cursor-pointer flex-col items-start gap-3.5 overflow-hidden rounded-[23px] border border-paper/70 bg-paper/95 px-[22px] py-6 text-left text-sense-navy shadow-[0_8px_0_rgba(0,31,62,0.18),0_18px_30px_rgba(0,31,62,0.1)] transition duration-200 hover:-translate-y-[3px] hover:bg-paper hover:shadow-[0_5px_0_rgba(0,31,62,0.2),0_20px_34px_rgba(0,31,62,0.15)]"
    >
      <span className="grid size-[39px] place-items-center rounded-xl border border-sense-blue/15 bg-[linear-gradient(145deg,rgba(221,254,86,0.2),rgba(3,82,94,0.08)),rgba(255,255,255,0.62)] text-sense-blue transition duration-200 group-hover:-rotate-3 group-hover:scale-105 group-hover:bg-sense-blue group-hover:text-paper">
        <Icon name={icon} size={21} />
      </span>
      <strong className="text-[15px] font-bold text-sense-blue">{title}</strong>
      <span className="max-w-[225px] text-xs leading-[1.55] text-[#344c53]">{description}</span>
      <i
        aria-hidden="true"
        className="absolute right-[18px] bottom-[17px] -translate-x-1.5 text-sense-blue opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      >
        <Icon name="chevron" size={17} />
      </i>
    </Link>
  );
}

function ImproveBanner() {
  const href = "/content-creation/improve";
  return (
    <Link
      href={href}
      onClick={() => forwardContentTrend(HERE, href)}
      className="group grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-[23px] border border-paper/70 bg-paper/95 p-[18px] text-left text-sense-navy shadow-[0_8px_0_rgba(0,31,62,0.18),0_18px_30px_rgba(0,31,62,0.1)] transition duration-200 hover:-translate-y-[3px] hover:bg-paper hover:shadow-[0_5px_0_rgba(0,31,62,0.2),0_20px_34px_rgba(0,31,62,0.15)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-[18px] sm:px-6 sm:py-5"
    >
      <span className="grid size-[46px] place-items-center rounded-xl border border-sense-blue/15 bg-[linear-gradient(145deg,rgba(221,254,86,0.2),rgba(3,82,94,0.08)),rgba(255,255,255,0.62)] text-sense-blue transition duration-200 group-hover:-rotate-3 group-hover:scale-105 group-hover:bg-sense-blue group-hover:text-paper">
        <Icon name="sparkles" size={22} />
      </span>
      <span className="grid min-w-0 gap-1">
        <strong className="text-[15px] font-bold text-sense-blue">Improve a post, ad or document</strong>
        <small className="max-w-[640px] text-xs leading-[1.55] text-[#344c53]">
          Upload or paste a post, ad, email or document. Improve it, rewrite it, summarize it or get feedback.
        </small>
      </span>
      <span className="col-span-full inline-flex min-h-[40px] items-center justify-center gap-1.5 justify-self-end whitespace-nowrap rounded-[20px] bg-sense-blue px-[18px] text-xs font-bold text-paper transition group-hover:bg-sense-blue/85 sm:col-span-1">
        Start improving
        <Icon name="chevron" size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function ContentCreationDashboard() {
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    // Read after mount so server and client markup match on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrend(loadContentTrend(HERE));
  }, []);

  return (
    <div className="w-full">
      <header className="flex flex-col items-stretch justify-between gap-6 text-paper sm:flex-row sm:items-start">
        <div className="min-w-0">
          {trend?.returnTo?.href && <BackLink href={trend.returnTo.href}>{trend.returnTo.label}</BackLink>}
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">Content Creation</h1>
          <p className="mt-2 max-w-[700px] text-[13px] leading-[1.6] text-paper/85">
            Write posts, ads and blogs, improve ones you already have, and adapt them for other platforms.
          </p>
        </div>
        <MyContentLink />
      </header>

      {trend && (
        <SelectedTrend
          trend={trend}
          onClear={() => {
            clearContentTrend();
            setTrend(null);
          }}
        />
      )}

      <section aria-label="Campaign" className="mt-6">
        <Link
          href="/content-creation/campaign"
          onClick={() => forwardContentTrend(HERE, "/content-creation/campaign")}
          className="group grid min-h-[104px] w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-[23px] border border-paper/20 bg-paper/10 p-[18px] text-left text-paper shadow-[0_7px_0_rgba(0,31,62,0.18),0_18px_32px_rgba(0,31,62,0.12)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_4px_0_rgba(0,31,62,0.2),0_20px_36px_rgba(0,31,62,0.16)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-[18px] sm:px-6 sm:py-5"
        >
          <span className="grid size-[54px] place-items-center rounded-2xl bg-sense-lime text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)]">
            <Icon name="campaign" size={24} />
          </span>
          <span className="grid min-w-0 gap-1.5">
            <strong className="text-lg font-extrabold">Campaign</strong>
            <small className="max-w-[690px] text-[13px] leading-[1.55] text-paper/80">
              Build an editable campaign plan by defining your goal, offer, audience, channels,
              timing, and budget.
            </small>
          </span>
          <span className="col-span-full inline-flex min-h-[42px] items-center justify-center gap-1.5 justify-self-end whitespace-nowrap rounded-[22px] bg-sense-lime px-[18px] text-xs font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] sm:col-span-1">
            Create campaign
            <Icon name="chevron" size={17} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      <section className="mt-[26px]">
        <h2 className="mb-4 text-[15px] font-bold text-paper">Create new AI-guided content</h2>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          {CREATE_OPTIONS.map((option) => (
            <ActionCard key={option.title} {...option} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h2 className="mb-4 text-[15px] font-bold text-paper">Already have something written?</h2>
        <ImproveBanner />
      </section>
    </div>
  );
}
