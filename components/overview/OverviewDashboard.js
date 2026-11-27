"use client";

// Marketing Overview: live numbers from the workspace's connected accounts (see
// app/actions/performance.js). No sample figures: a card without data says what it
// needs (connect Instagram, track a competitor, find trends) and links there.

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Eyebrow, PageTitle } from "@/components/ui/Dashboard";
import Skeleton from "@/components/ui/Skeleton";
import InfoTip from "@/components/ui/InfoTip";
import AdviceBadge from "@/components/ui/AdviceBadge";
import GetStarted from "./GetStarted";
import { getPerformance } from "@/app/actions/performance";
import { addDays, useToday } from "@/lib/calendar";
import { useSettings } from "@/lib/settings";
import { TIMEZONE_ZONES } from "@/lib/account";
import { DAYS, DAY_NAMES, bestOf, postingPattern } from "@/lib/postingPattern";

const DAYS_SHOWN = 7; // Instagram insights window on Overview
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const n = (v) => (v == null ? "—" : compact.format(v));

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

function CardLink({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-[3px] whitespace-nowrap text-xs font-bold text-sense-blue transition-all hover:gap-1.5 hover:underline ${className}`}
    >
      {children} <Icon name="chevron" size={14} />
    </Link>
  );
}

function Muted({ children }) {
  return <p className="mt-2 text-[13px] leading-[1.5] text-[#4b5d60]">{children}</p>;
}

/** What a card needs before it can show anything, with the button to get it. */
function Needs({ text, href, action }) {
  return (
    <div className="mt-5 flex flex-1 flex-col items-start justify-center gap-3 rounded-2xl border border-dashed border-sense-blue/25 bg-white/40 p-4">
      <p className="text-[13px] leading-[1.5] text-[#3d5053]">{text}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-2xl bg-sense-blue px-3.5 py-2 text-xs font-bold text-paper hover:bg-sense-blue/85"
      >
        {action} <Icon name="chevron" size={13} />
      </Link>
    </div>
  );
}

const CONNECT = { href: "/settings#connections", action: "Connect Instagram" };

function CompetitorWatch({ data }) {
  const cols = [
    ...(data.me ? [{ handle: data.me.username, postsPerWeek: data.me.postsPerWeek, engagementRate: data.me.engagementRate, you: true }] : []),
    ...data.competitors.slice(0, 3),
  ];
  const cell = "grid h-[58px] place-items-center border-b border-sense-blue/15 text-[clamp(20px,2.2vw,28px)] tabular-nums";
  return (
    <Card className="xl:col-span-6">
      <CardHeading
        eyebrow="Competitor watch"
        title="How you compare"
        info="Posts per week and engagement (likes + comments per post as a share of followers) from each account's recent Instagram posts."
        aside={data.competitors.length > 0 && <CardLink href="/competitors">View details</CardLink>}
      />
      {!data.connected ? (
        <Needs text="Connect your Instagram business account to compare yourself with competitors." {...CONNECT} />
      ) : data.competitors.length === 0 ? (
        <Needs
          text="Track a competitor to see how often they post and how their audience responds, next to your own numbers."
          href="/competitors"
          action="Track a competitor"
        />
      ) : (
        <div
          className="mt-6 grid overflow-x-auto"
          style={{ gridTemplateColumns: `90px repeat(${cols.length}, minmax(70px, 1fr))` }}
        >
          <div className="grid grid-rows-[58px_58px] text-xs text-[#4b5d60]">
            <span className="flex items-center border-b border-sense-blue/15">Posts / week</span>
            <span className="flex items-center border-b border-sense-blue/15">Engagement</span>
          </div>
          {cols.map((c) => (
            <div key={c.handle} className="grid grid-rows-[58px_58px_34px] text-center">
              <b className={`${cell} font-normal`}>{c.postsPerWeek == null ? "—" : c.postsPerWeek.toFixed(1)}</b>
              <b className={`${cell} font-normal`}>{c.engagementRate == null ? "—" : `${c.engagementRate.toFixed(1)}%`}</b>
              <span className={`self-end truncate px-1 text-xs ${c.you ? "font-bold text-sense-navy" : "text-[#3d5053]"}`}>
                {c.you ? "You" : `@${c.handle}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Followers({ data }) {
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="Your audience"
        title="Followers"
        info="How many people follow your connected Instagram account and Facebook Page right now."
      />
      {!data.connected ? (
        <Needs text="Connect Instagram to see your followers." {...CONNECT} />
      ) : (
        <>
          <div className="mt-8 flex items-center gap-3.5">
            <span className="text-[#1d4990]">
              <Icon name="instagram" size={30} />
            </span>
            <strong className="text-4xl font-semibold tabular-nums">{n(data.me?.followers)}</strong>
          </div>
          <Muted>
            on Instagram (@{data.instagram.username}) · {n(data.me?.postCount)} posts
          </Muted>
          {data.facebook && (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-[#3d5053]">
              <Icon name="message" size={15} /> <strong className="tabular-nums">{n(data.facebook.followers)}</strong> on Facebook ({data.facebook.name})
            </p>
          )}
          <CardLink href="/reports" className="mt-auto pt-4">
            See your report
          </CardLink>
        </>
      )}
    </Card>
  );
}

function LatestTrends({ data }) {
  const when = data.trendsUpdatedAt
    ? new Date(data.trendsUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="Market buzz"
        title="Trends to act on"
        info="The strongest trends from your latest search on the Audience page, ranked by momentum."
      />
      {data.trends.length === 0 ? (
        <Needs text="Find what's trending on Instagram and TikTok for the audiences you care about." href="/audience-trends" action="Find trends" />
      ) : (
        <>
          <ul className="mt-4 grid gap-2">
            {data.trends.slice(0, 3).map((t) => (
              <li key={`${t.platform}-${t.name}`} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <strong className="block truncate text-[13px]">{t.name}</strong>
                  <span className="text-xs text-[#4b5d60]">{t.platform} · momentum {t.momentum}</span>
                </span>
                <AdviceBadge advice={t.advice} />
              </li>
            ))}
          </ul>
          <Muted>
            From your search{data.trendsFor.length ? ` for ${data.trendsFor.join(", ")}` : ""}
            {when ? ` on ${when}` : ""}.
          </Muted>
          <CardLink href="/audience-trends" className="mt-auto pt-3">
            See all trends
          </CardLink>
        </>
      )}
    </Card>
  );
}

function Engagement({ data }) {
  const me = data.me;
  // Likes + comments on your most recent posts, oldest → newest.
  const recent = (me?.posts ?? []).slice(0, 8).reverse();
  const values = recent.map((p) => (p.likes == null ? null : p.likes + p.comments));
  const max = Math.max(1, ...values.filter((v) => v != null));
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="How people respond"
        title="Engagement rate"
        info="Average likes + comments per post as a share of your followers, from your recent Instagram posts."
      />
      {!data.connected ? (
        <Needs text="Connect Instagram to see how people respond to your posts." {...CONNECT} />
      ) : me?.engagementRate == null ? (
        <Muted>Not enough visible likes on your recent posts to work this out yet.</Muted>
      ) : (
        <>
          <strong className="mt-5 block text-[34px] font-normal tabular-nums">{me.engagementRate.toFixed(1)}%</strong>
          <Muted>
            About {n(me.avgLikes)} likes and {n(me.avgComments)} comments per post, from your last {me.sampleSize} posts.
          </Muted>
          {recent.length > 1 && (
            <>
              <div
                role="img"
                aria-label={`Likes and comments on your last ${recent.length} posts: ${values.map((v) => v ?? "hidden").join(", ")}`}
                className="mt-4 flex h-[70px] items-end gap-[7px]"
              >
                {values.map((v, i) => (
                  <i
                    key={i}
                    className={`min-h-2 flex-1 rounded-t-[5px] rounded-b-[2px] ${v == null ? "bg-sense-blue/15" : "bg-[#1d4990]"}`}
                    style={{ height: `${v == null ? 8 : (v / max) * 100}%` }}
                  />
                ))}
              </div>
              <div aria-hidden="true" className="mt-1.5 flex justify-between text-xs text-[#4b5d60]">
                <span>Older</span>
                <span>Latest post</span>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}

function BestDay({ data, today, timeZone }) {
  const posts = data.me?.posts ?? [];
  const { days, avg } = postingPattern(posts, timeZone);
  const best = bestOf(days);
  // The next date (from tomorrow) that falls on that weekday.
  const next = best
    ? Array.from({ length: 7 }, (_, i) => addDays(today, i + 1)).find(
        (d) => DAYS[(d.getDay() + 6) % 7] === best[0],
      )
    : null;
  return (
    <Card className="sm:col-span-6 xl:col-span-3">
      <CardHeading
        eyebrow="Your next move"
        title="Best day to post next"
        info="The weekday your recent Instagram posts got the most likes and comments on average (days with at least 2 posts), and the next date it falls on."
      />
      {!data.connected ? (
        <Needs text="Connect Instagram so we can spot which days your posts do best." {...CONNECT} />
      ) : !best ? (
        <Muted>Post on the same weekday at least twice and we&apos;ll spot your best day. We look at your last {posts.length} posts.</Muted>
      ) : (
        <>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[#1d4990]">
              <Icon name="calendar" size={28} />
            </span>
            <strong className="text-[26px] font-normal whitespace-nowrap">
              {next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </strong>
          </div>
          <Muted>
            Your {DAY_NAMES[best[0]].replace(/s$/, "")} posts get about {n(best[1].avg)} likes and comments on average
            {avg > 0 ? ` (vs ${n(avg)} overall)` : ""}.
          </Muted>
          <CardLink href="/ai-management" className="mt-auto pt-4">
            Plan a post
          </CardLink>
        </>
      )}
    </Card>
  );
}

function LastWeek({ data }) {
  const i = data.insights;
  const tiles = [
    ["Reach", i?.reach, "Different accounts that saw your posts"],
    ["Views", i?.views, "Times your posts and stories were seen"],
    ["Accounts engaged", i?.accounts_engaged, "Accounts that liked, commented, saved or shared"],
    ["Interactions", i?.total_interactions, "Likes, comments, saves and shares in total"],
  ];
  return (
    <Card className="xl:col-span-6">
      <CardHeading
        eyebrow="Last 7 days"
        title="How your Instagram is doing"
        info="Totals from Instagram for the last 7 days."
        aside={data.connected && <CardLink href="/reports">Open report</CardLink>}
      />
      {!data.connected ? (
        <Needs text="Connect Instagram to see your reach, views and interactions for the last 7 days." {...CONNECT} />
      ) : !i ? (
        <Muted>Instagram didn&apos;t return insights{data.insightsError ? `: ${data.insightsError}` : ""}. Try again later.</Muted>
      ) : (
        <>
          <div className="mt-5 grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map(([label, value, hint]) => (
              <div key={label} title={hint} className="flex flex-col items-center justify-center rounded-2xl border border-sense-blue/10 bg-white/55 px-2 py-4 text-center">
                <span className="text-xs text-[#4b5d60]">{label}</span>
                <strong className="mt-1 text-[26px] leading-tight font-normal text-sense-blue tabular-nums">{n(value)}</strong>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#4b5d60]">TikTok isn&apos;t connected, so it isn&apos;t included.</p>
        </>
      )}
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
  const today = useToday();
  const [settings] = useSettings();
  const timeZone = TIMEZONE_ZONES[settings.timezone] ?? undefined;
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    getPerformance({ days: DAYS_SHOWN })
      .then((d) => alive && setData(d))
      .catch((err) => alive && setData({ connected: false, competitors: [], trends: [], trendsFor: [], error: err.message }));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="w-full">
      <PageTitle
        eyebrow="Your workspace today"
        title="Marketing Overview"
        description={
          data?.connected
            ? `Live from your connected accounts (@${data.instagram.username}).`
            : data
              ? "Connect your accounts to see your real numbers here."
              : " "
        }
      />

      {!data || !today ? (
        <OverviewSkeleton />
      ) : (
        <>
          <GetStarted data={data} />
          <div className="grid grid-cols-12 gap-3.5 lg:gap-[18px]">
            <CompetitorWatch data={data} />
            <Followers data={data} />
            <LatestTrends data={data} />
            <Engagement data={data} />
            <BestDay data={data} today={today} timeZone={timeZone} />
            <LastWeek data={data} />
          </div>
        </>
      )}
    </div>
  );
}
