"use client";

// Reports: a real Instagram performance report from the connected account (see
// app/actions/performance.js): headline numbers, recent posts, top posts, when you
// post, and how you compare with your tracked competitors. "Download PDF" prints it.
// Replaces the sample ad-spend/revenue report (no ad or sales source is connected).

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { PageTitle, Panel } from "@/components/ui/Dashboard";
import { SkeletonPanel } from "@/components/ui/Skeleton";
import { getPerformance } from "@/app/actions/performance";
import { useSettings } from "@/lib/settings";
import { TIMEZONE_ZONES } from "@/lib/account";
import { DAYS, DAY_NAMES, SLOTS, bestOf, postingPattern } from "@/lib/postingPattern";

const WINDOWS = [7, 30]; // Instagram insights go back at most 30 days
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const n = (v) => (v == null ? "—" : compact.format(v));
const pct = (v) => (v == null ? "—" : `${v.toFixed(1)}%`);
const shortDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const engagementOf = (p) => (p.likes == null ? null : p.likes + p.comments);

function Kpi({ label, value, note }) {
  return (
    <article className="flex min-h-[112px] min-w-0 flex-col rounded-[20px] border border-paper/75 bg-paper/95 p-4 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_16px_28px_rgba(0,31,62,0.09)]">
      <span className="text-[13px] font-bold text-sense-blue">{label}</span>
      <strong className="mt-2.5 text-[clamp(22px,2.2vw,28px)] leading-none font-medium tracking-[-0.03em] text-[#10292f] tabular-nums">
        {value}
      </strong>
      <p className="mt-auto pt-2 text-xs leading-[1.4] text-[#4b5d60]">{note}</p>
    </article>
  );
}

function PanelTitle({ children, aside }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <h3 className="text-[15px] font-bold text-sense-blue">{children}</h3>
      {aside}
    </div>
  );
}

/** Plain-English takeaways from your recent posts (rules, not AI). */
function takeaways(me, pattern) {
  const out = [];
  const formats = (me.formats ?? []).filter((f) => f.avgEngagement != null && (f.rated ?? f.count) >= 2);
  if (formats.length > 1) {
    const [best, ...rest] = [...formats].sort((a, b) => b.avgEngagement - a.avgEngagement);
    const others = rest.reduce((a, f) => a + f.avgEngagement, 0) / rest.length;
    if (others > 0 && best.avgEngagement / others >= 1.2) {
      out.push(`Your ${best.format.toLowerCase()}s get ${(best.avgEngagement / others).toFixed(1)}× the likes and comments of your other posts.`);
    }
  }
  const bestDay = bestOf(pattern.days);
  if (bestDay) out.push(`${DAY_NAMES[bestDay[0]]} are your best day: about ${n(bestDay[1].avg)} likes and comments per post.`);
  const bestSlot = bestOf(pattern.slots);
  if (bestSlot) out.push(`Posts in the ${SLOTS.find(([k]) => k === bestSlot[0])[1].toLowerCase()} do best for you.`);
  if (me.postsPerWeek < 2) out.push(`You post about ${me.postsPerWeek.toFixed(1)} times a week. Posting more often usually grows reach.`);
  return out.slice(0, 4);
}

function RecentPosts({ me, pattern }) {
  const posts = [...(me.posts ?? [])].reverse(); // oldest → newest
  const max = Math.max(1, ...posts.map((p) => engagementOf(p) ?? 0));
  const tips = takeaways(me, pattern);
  return (
    <Panel className="xl:col-span-7">
      <PanelTitle>Your recent posts</PanelTitle>
      {posts.length === 0 ? (
        <p className="text-[13px] text-[#4b5d60]">No posts yet.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <div
              role="img"
              aria-label={`Likes and comments on your last ${posts.length} posts`}
              className="flex h-[170px] items-end gap-[3px] border-b border-sense-blue/15"
            >
              {posts.map((p) => {
                const e = engagementOf(p);
                return (
                  <i
                    key={p.id}
                    title={`${shortDate(p.time)}: ${e == null ? "likes hidden" : `${n(e)} likes + comments`} (${p.format})`}
                    className={`min-h-1 flex-1 rounded-t-[3px] ${e == null ? "bg-sense-blue/15" : "bg-[#1d4990]"}`}
                    style={{ height: `${e == null ? 4 : (e / max) * 100}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-[#4b5d60]">
              <span>{shortDate(posts[0].time)}</span>
              <span>Likes + comments per post</span>
              <span>{shortDate(posts.at(-1).time)}</span>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-sense-blue">What stands out</h4>
            {tips.length ? (
              <ul className="mt-2 grid gap-1.5 text-[13px] leading-[1.5] text-[#3d5053]">
                {tips.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-[#4b5d60]">Post a few more times to see patterns here.</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function TopPosts({ me }) {
  const top = [...(me.posts ?? [])]
    .filter((p) => engagementOf(p) != null)
    .sort((a, b) => engagementOf(b) - engagementOf(a))
    .slice(0, 5);
  return (
    <Panel className="min-w-0 xl:col-span-5">
      <PanelTitle>Your top posts</PanelTitle>
      {top.length === 0 ? (
        <p className="text-[13px] text-[#4b5d60]">Likes are hidden on your recent posts, so there&apos;s nothing to rank.</p>
      ) : (
        <ol className="grid min-w-0 grid-cols-1 gap-2">
          {top.map((p, i) => (
            <li key={p.id} className="min-w-0">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-xl p-1.5 hover:bg-sense-blue/5">
                <span className="w-4 text-center text-xs font-bold text-[#4b5d60]">{i + 1}</span>
                <span className="block size-12 shrink-0 overflow-hidden rounded-lg bg-sense-blue/10">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN
                    <img src={p.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                  )}
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-sense-navy">{p.caption || "(no caption)"}</span>
                  <span className="text-xs text-[#4b5d60]">
                    {shortDate(p.time)} · {p.format} · ♥ {n(p.likes)} · 💬 {n(p.comments)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function WhenYouPost({ pattern }) {
  const { days } = pattern;
  const max = Math.max(1, ...Object.values(days).map((d) => d.count));
  const best = bestOf(days)?.[0];
  return (
    <Panel className="xl:col-span-5">
      <PanelTitle>When you post</PanelTitle>
      <div className="grid grid-cols-7 items-end gap-2" role="img" aria-label={`Posts by weekday: ${DAYS.map((d) => `${d} ${days[d].count}`).join(", ")}`}>
        {DAYS.map((d) => (
          <div key={d} className="grid justify-items-center gap-1">
            <span className="text-xs text-[#4b5d60] tabular-nums">{days[d].count || ""}</span>
            <span className="flex h-24 w-full items-end overflow-hidden rounded-md bg-sense-blue/5">
              <span className={`w-full rounded-md ${best === d ? "bg-sense-lime" : "bg-sense-blue/70"}`} style={{ height: `${(days[d].count / max) * 100}%` }} />
            </span>
            <span className={`text-xs ${best === d ? "font-bold text-sense-navy" : "text-[#4b5d60]"}`}>{best === d ? `★ ${d}` : d}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#4b5d60]">Bars: how many of your recent posts went out each day. ★ = most likes and comments per post.</p>
    </Panel>
  );
}

function VsCompetitors({ me, competitors }) {
  const rows = [{ handle: me.username, ...me, you: true }, ...competitors];
  const cols = [
    ["Followers", (r) => n(r.followers)],
    ["Posts / week", (r) => (r.postsPerWeek == null ? "—" : r.postsPerWeek.toFixed(1))],
    ["Avg likes", (r) => n(r.avgLikes)],
    ["Engagement", (r) => pct(r.engagementRate)],
  ];
  return (
    <Panel className="xl:col-span-7">
      <PanelTitle aside={<Link href="/competitors" className="text-xs font-bold text-sense-blue hover:underline print:hidden">Manage competitors →</Link>}>
        You vs your competitors
      </PanelTitle>
      {competitors.length === 0 ? (
        <p className="text-[13px] text-[#4b5d60]">
          You&apos;re not tracking any competitors yet.{" "}
          <Link href="/competitors" className="font-bold text-sense-blue underline">Track one</Link> to compare here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-[13px]">
            <thead>
              <tr className="text-left text-xs text-[#4b5d60]">
                <th scope="col" className="pb-2 font-semibold">Account</th>
                {cols.map(([label]) => (
                  <th key={label} scope="col" className="pb-2 text-right font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.handle} className={`border-t border-sense-blue/10 ${r.you ? "bg-sense-blue/5" : ""}`}>
                  <th scope="row" className="py-2 text-left font-normal">
                    <strong>@{r.handle}</strong> {r.you && <span className="text-xs text-[#4b5d60]">(you)</span>}
                  </th>
                  {cols.map(([label, fmt]) => (
                    <td key={label} className="py-2 text-right tabular-nums">{fmt(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default function ReportsDashboard() {
  const [settings] = useSettings();
  const timeZone = TIMEZONE_ZONES[settings.timezone] ?? undefined;
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    getPerformance({ days })
      .then((d) => alive && setData(d))
      .catch((err) => alive && setData({ connected: false, error: err.message }));
    return () => {
      alive = false;
    };
  }, [days]);

  const me = data?.me;
  const i = data?.insights;
  const pattern = postingPattern(me?.posts ?? [], timeZone);

  return (
    <div className="w-full">
      <PageTitle
        eyebrow="Insights / Reports"
        title="Instagram report"
        description={
          data?.connected
            ? `How @${data.instagram.username} is doing, from Instagram. Reach, views and interactions cover the last ${days} days.`
            : data
              ? "Connect Instagram to get your report."
              : " "
        }
      >
        {data?.connected && (
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <div role="group" aria-label="Report period" className="flex rounded-full border border-paper/40 bg-paper/10 p-1">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={days === w}
                  onClick={() => setDays(w)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition ${days === w ? "bg-paper text-sense-navy" : "text-paper hover:bg-paper/15"}`}
                >
                  {w} days
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[34px] cursor-pointer items-center gap-[7px] rounded-[17px] border border-paper/40 px-3.5 text-xs font-semibold text-paper transition hover:bg-paper/15"
            >
              <Icon name="upload" size={14} className="rotate-180" /> Download PDF
            </button>
          </div>
        )}
      </PageTitle>

      {!data ? (
        <div role="status" aria-label="Loading report" className="grid grid-cols-1 gap-[18px] xl:grid-cols-12">
          <SkeletonPanel lines={3} className="xl:col-span-5" />
          <SkeletonPanel lines={4} className="xl:col-span-7" />
        </div>
      ) : !data.connected ? (
        <Panel>
          <div className="flex flex-col items-start gap-3 py-6">
            <h3 className="text-[17px] font-bold text-sense-blue">Your report needs your Instagram</h3>
            <p className="max-w-xl text-[13px] leading-[1.6] text-[#3d5053]">
              Connect your Instagram business account and this page becomes a live report: followers, reach, views and
              interactions, your best posts and days, and how you compare with competitors. You can download it as a PDF.
            </p>
            <Link href="/settings#connections" className="inline-flex items-center gap-1 rounded-2xl bg-sense-blue px-4 py-2 text-xs font-bold text-paper hover:bg-sense-blue/85">
              Connect Instagram <Icon name="chevron" size={13} />
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:col-span-12 xl:grid-cols-6">
            <Kpi label="Followers" value={n(me?.followers)} note={data.facebook ? `+ ${n(data.facebook.followers)} on Facebook` : "on Instagram"} />
            <Kpi label="Reach" value={n(i?.reach)} note={`accounts that saw your posts, last ${days} days`} />
            <Kpi label="Views" value={n(i?.views)} note={`times your content was seen, last ${days} days`} />
            <Kpi label="Interactions" value={n(i?.total_interactions)} note={`likes, comments, saves and shares, last ${days} days`} />
            <Kpi label="Engagement rate" value={pct(me?.engagementRate)} note="likes + comments per post vs followers" />
            <Kpi label="Posts per week" value={me?.postsPerWeek == null ? "—" : me.postsPerWeek.toFixed(1)} note="over the last 30 days" />
          </div>
          {data.insightsError && (
            <p className="text-xs text-paper xl:col-span-12">Instagram didn&apos;t return reach and views: {data.insightsError}</p>
          )}
          {me ? (
            <>
              <RecentPosts me={me} pattern={pattern} />
              <TopPosts me={me} />
              <WhenYouPost pattern={pattern} />
              <VsCompetitors me={me} competitors={data.competitors} />
            </>
          ) : (
            <Panel className="xl:col-span-12">
              <p className="text-[13px] text-[#4b5d60]">Your posts couldn&apos;t load{data.meError ? `: ${data.meError}` : ""}. Try again in a little while.</p>
            </Panel>
          )}
          <p className="text-xs text-paper/85 xl:col-span-12">
            From Instagram for @{data.instagram.username}. Likes and comments are from your last {me?.sampleSize ?? 0} posts.
          </p>
        </div>
      )}
    </div>
  );
}
