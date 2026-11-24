"use client";

// Real competitors on Instagram: add by @username, compare with your own account,
// open one to see its recent posts, best post and plain-English takeaways.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import { Panel, PanelHeading } from "@/components/ui/Dashboard";
import {
  addCompetitor,
  getCompetitors,
  removeCompetitor,
} from "@/app/actions/competitors";
import { saveContentTrend } from "@/lib/contentTrend";
import { useSettings } from "@/lib/settings";
import { TIMEZONE_ZONES } from "@/lib/account";

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const n = (v) => (v == null ? "—" : compact.format(v));
const pct = (v) => (v == null ? "—" : `${v.toFixed(2)}%`);
const ago = (iso) => {
  if (!iso) return "";
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return mins < 1
    ? "just now"
    : mins < 60
      ? `${mins} min ago`
      : mins < 1440
        ? `${Math.round(mins / 60)} h ago`
        : `${Math.round(mins / 1440)} d ago`;
};

const COLUMNS = [
  ["followers", "Followers", n, "How many people follow the account."],
  [
    "postsPerWeek",
    "Posts / week",
    (v) => (v == null ? "—" : v.toFixed(1)),
    "How often they posted over the last 30 days.",
  ],
  [
    "avgLikes",
    "Avg likes",
    n,
    "Average likes per post, over their last 25 posts.",
  ],
  [
    "avgComments",
    "Avg comments",
    n,
    "Average comments per post, over their last 25 posts.",
  ],
  [
    "engagementRate",
    "Engagement",
    pct,
    "Average likes + comments per post, as a share of followers. Higher means their followers react more. Because it's a share, it compares big and small accounts fairly.",
  ],
];

// The table's name column sticks to the left while the numbers scroll sideways; once
// scrolled, a soft shadow on its right edge shows there's more underneath.
const STICKY = "sticky left-0 z-10";
const STICKY_EDGE =
  "after:pointer-events-none after:absolute after:inset-y-0 after:-right-3 after:w-3 after:bg-gradient-to-r after:from-sense-navy/15 after:to-transparent";

// Columns that need like counts; shown as "Hidden" when an account hides its likes.
const LIKE_BASED = new Set(["avgLikes", "engagementRate"]);

const UNDO_MS = 7000;

const TIP_W = 260;

/** The name cell of a table row: a button for competitors (opens their details), plain for you. */
function RowOpener({ button, expanded, onToggle, children }) {
  const cls = "flex items-center gap-2.5";
  if (!button) return <span className={cls}>{children}</span>;
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={expanded ? "competitor-details" : undefined}
      onClick={(e) => {
        e.stopPropagation(); // the row's own click handler would toggle it back
        onToggle();
      }}
      className={`${cls} -m-1 w-[calc(100%+0.5rem)] cursor-pointer rounded-lg p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-sense-blue`}
    >
      {children}
    </button>
  );
}

/**
 * A small "i" button that opens a box with `text` just above it. The box is drawn on
 * top of the page (a portal), so the table's sideways scroll can't cut it off. Closes
 * on a click elsewhere, Escape, scrolling or resizing.
 */
function InfoTip({ label, text }) {
  const btn = useRef(null);
  const box = useRef(null);
  const [pos, setPos] = useState(null); // where the open box goes; null = closed

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btn.current.getBoundingClientRect();
    const center = r.left + r.width / 2;
    const left = Math.min(
      Math.max(center - TIP_W / 2, 12),
      window.innerWidth - TIP_W - 12,
    );
    setPos({
      left,
      bottom: window.innerHeight - r.top + 8,
      arrow: center - left,
    });
  };

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const outside = (e) => {
      if (!btn.current?.contains(e.target) && !box.current?.contains(e.target))
        close();
    };
    const esc = (e) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-label={`What does ${label} mean?`}
        aria-expanded={Boolean(pos)}
        className={`grid size-5 cursor-pointer place-items-center rounded-full border text-xs font-bold normal-case transition ${
          pos
            ? "border-sense-blue bg-sense-blue text-paper"
            : "border-sense-blue/30 text-sense-blue hover:bg-sense-blue/10"
        }`}
      >
        i
      </button>
      {pos &&
        createPortal(
          <div
            ref={box}
            role="tooltip"
            style={{ left: pos.left, bottom: pos.bottom, width: TIP_W }}
            className="fixed z-50 rounded-xl bg-sense-navy px-3 py-2.5 text-left text-sm leading-[1.5] text-paper shadow-lg motion-safe:animate-[fadeIn_0.15s_ease-out]"
          >
            <strong className="mb-0.5 block text-sense-lime">{label}</strong>
            {text}
            <span
              aria-hidden="true"
              style={{ left: pos.arrow - 6 }}
              className="absolute -bottom-1.5 size-3 rotate-45 bg-sense-navy"
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function Avatar({ src, label, mine }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold ${mine ? "bg-sense-blue text-paper" : "bg-sense-blue/10 text-sense-blue"}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      ) : (
        label.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

/** Short, non-AI comparisons between you and one competitor. */
function takeaways(me, them) {
  if (!me || !them) return [];
  const out = [];
  const ratio = (a, b) => (b > 0 ? a / b : null);
  const pw = ratio(them.postsPerWeek, me.postsPerWeek);
  if (them.postsPerWeek > 0 && (me.postsPerWeek === 0 || pw >= 1.5)) {
    out.push(
      `They post ${them.postsPerWeek.toFixed(1)}× a week; you post ${me.postsPerWeek.toFixed(1)}×. Posting more often is their biggest edge.`,
    );
  } else if (me.postsPerWeek > 0 && pw != null && pw <= 0.67) {
    out.push(
      `You post more often than they do (${me.postsPerWeek.toFixed(1)} vs ${them.postsPerWeek.toFixed(1)} a week).`,
    );
  }
  // Skip engagement comparisons when either side hides likes (rate is null).
  const bothRated = them.engagementRate != null && me.engagementRate != null;
  if (
    bothRated &&
    them.engagementRate > me.engagementRate * 1.2 &&
    them.engagementRate > 0
  ) {
    out.push(
      `Their posts get a bigger reaction for their size: ${pct(them.engagementRate)} engagement vs your ${pct(me.engagementRate)}.`,
    );
  } else if (
    bothRated &&
    me.engagementRate > them.engagementRate * 1.2 &&
    me.engagementRate > 0
  ) {
    out.push(
      `Your audience reacts more for its size: ${pct(me.engagementRate)} engagement vs their ${pct(them.engagementRate)}.`,
    );
  }
  // Formats compared on posts with visible likes only (`rated`; older saved data has no
  // `rated`, where every post counted).
  const ratedCount = (f) => f.rated ?? f.count;
  const comparable = (them.formats ?? []).filter(
    (f) => f.avgEngagement != null && ratedCount(f) >= 2,
  );
  const best = [...comparable].sort(
    (a, b) => b.avgEngagement - a.avgEngagement,
  )[0];
  const rest = comparable.filter((f) => f !== best);
  if (best && rest.length) {
    const others =
      rest.reduce((a, f) => a + f.avgEngagement * ratedCount(f), 0) /
      rest.reduce((a, f) => a + ratedCount(f), 0);
    if (others > 0 && best.avgEngagement / others >= 1.3) {
      out.push(
        `Their ${best.format.toLowerCase()}s get ${(best.avgEngagement / others).toFixed(1)}× more likes and comments than their other posts.`,
      );
    }
  }
  if (them.topFormat && me.topFormat && them.topFormat !== me.topFormat) {
    out.push(
      `They mostly post ${them.topFormat.toLowerCase()}s; you mostly post ${me.topFormat.toLowerCase()}s.`,
    );
  }
  return out.slice(0, 3);
}

const shortDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

/** A post thumbnail. Click to show it in the big box above. */
function PostTile({ post, selected, best, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title="Show this post above"
      className={`group grid cursor-pointer gap-1.5 rounded-xl p-1.5 text-left transition ${
        selected
          ? "bg-sense-blue/10 outline-2 outline-sense-navy"
          : "bg-white/70 hover:bg-sense-blue/10"
      }`}
    >
      <span className="relative block aspect-square overflow-hidden rounded-lg bg-sense-blue/10">
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN
          <img
            src={post.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover transition group-hover:scale-105"
          />
        )}
        <span className="absolute top-1.5 left-1.5 rounded-md bg-sense-navy/70 px-1.5 py-0.5 text-[11px] font-bold text-paper">
          {post.format}
        </span>
        {best && (
          <span className="absolute top-1.5 right-1.5 rounded-md bg-sense-lime px-1.5 py-0.5 text-[11px] font-bold text-sense-navy">
            ★ Best
          </span>
        )}
      </span>
      <span className="px-0.5 text-xs text-[#3d5053]">
        {post.likes == null ? "♥ hidden" : `♥ ${n(post.likes)}`} · 💬{" "}
        {n(post.comments)}
      </span>
    </button>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = {
  Mon: "Mondays",
  Tue: "Tuesdays",
  Wed: "Wednesdays",
  Thu: "Thursdays",
  Fri: "Fridays",
  Sat: "Saturdays",
  Sun: "Sundays",
};
const SLOTS = [
  ["morning", "Morning", "5am–11am", (h) => h >= 5 && h < 11],
  ["afternoon", "Afternoon", "11am–5pm", (h) => h >= 11 && h < 17],
  ["evening", "Evening", "5pm–10pm", (h) => h >= 17 && h < 22],
  ["night", "Night", "10pm–5am", (h) => h >= 22 || h < 5],
];

/** Group posts by weekday and time of day (in the viewer's timezone) with average engagement. */
function postingPattern(posts, timeZone) {
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  });
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  });
  // count = all posts (for "when"); rated/eng = posts with visible likes (for averages).
  const blank = () => ({ count: 0, rated: 0, eng: 0 });
  const days = Object.fromEntries(DAYS.map((d) => [d, blank()]));
  const slots = Object.fromEntries(SLOTS.map(([k]) => [k, blank()]));
  let total = 0;
  let rated = 0;
  const add = (g, eng) => {
    g.count += 1;
    if (eng != null) {
      g.rated += 1;
      g.eng += eng;
    }
  };
  for (const p of posts) {
    if (!p.time) continue;
    const d = new Date(p.time);
    const eng = p.likes == null ? null : p.likes + (p.comments ?? 0);
    const day = days[dayFmt.format(d)];
    if (day) add(day, eng);
    const h = Number(hourFmt.format(d)) % 24;
    const slot = SLOTS.find(([, , , test]) => test(h))?.[0];
    if (slot) add(slots[slot], eng);
    if (eng != null) {
      total += eng;
      rated += 1;
    }
  }
  const avg = rated ? total / rated : 0;
  const withAvg = (o) =>
    Object.fromEntries(
      Object.entries(o).map(([k, v]) => [
        k,
        { ...v, avg: v.rated ? v.eng / v.rated : null },
      ]),
    );
  return { days: withAvg(days), slots: withAvg(slots), avg };
}

/** Highest average engagement among groups with at least 2 posts (one post isn't a pattern). */
function bestOf(groups) {
  return Object.entries(groups)
    .filter(([, g]) => g.rated >= 2)
    .sort((a, b) => b[1].avg - a[1].avg)[0];
}

/** "How they post": top hashtags and when they post, from their recent posts. */
function HowTheyPost({ stats, me, timeZone }) {
  const posts = stats?.posts ?? [];
  if (!posts.length) return null;
  const { days, slots, avg } = postingPattern(posts, timeZone);
  const maxDay = Math.max(...Object.values(days).map((d) => d.count), 1);
  const busiestDay = Object.entries(days).sort(
    (a, b) => b[1].count - a[1].count,
  )[0];
  const busiestSlot = Object.entries(slots).sort(
    (a, b) => b[1].count - a[1].count,
  )[0];
  const bestDay = bestOf(days);
  const bestSlot = bestOf(slots);
  const slotLabel = (k) => SLOTS.find(([key]) => key === k)[1].toLowerCase();
  const mine = new Set((me?.hashtags ?? []).map((h) => h.tag));
  const hidden = posts.filter((p) => p.likes == null).length;

  const summary = [
    `They post most on ${DAY_NAMES[busiestDay[0]]}, usually in the ${slotLabel(busiestSlot[0])}.`,
    bestSlot && avg > 0 && bestSlot[1].avg / avg >= 1.15
      ? `Their ${slotLabel(bestSlot[0])} posts get ${(bestSlot[1].avg / avg).toFixed(1)}× their usual engagement.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mt-5 grid gap-4 border-t border-sense-blue/10 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#4b5d60]">
          How they post
        </p>
        <p className="text-xs text-[#4b5d60]">
          From their last {posts.length} posts · times in your timezone
        </p>
      </div>
      <p className="text-sm leading-[1.5] text-sense-navy">{summary}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* When */}
        <div className="grid content-start gap-3 rounded-xl bg-white/60 p-3">
          <strong className="text-sm text-sense-blue">When they post</strong>
          <div
            className="grid grid-cols-7 items-end gap-1.5"
            role="img"
            aria-label={`Posts by weekday: ${DAYS.map((d) => `${d} ${days[d].count}`).join(", ")}`}
          >
            {DAYS.map((d) => {
              const g = days[d];
              const best = bestDay?.[0] === d;
              return (
                <div
                  key={d}
                  className="grid justify-items-center gap-1"
                  title={`${DAY_NAMES[d]}: ${g.count} post${g.count === 1 ? "" : "s"}${g.avg != null ? `, avg ${n(g.avg)} likes + comments` : ""}`}
                >
                  <span className="text-xs tabular-nums text-[#4b5d60]">
                    {g.count || ""}
                  </span>
                  <span className="flex h-16 w-full items-end overflow-hidden rounded-md bg-sense-blue/5">
                    <span
                      className={`w-full rounded-md ${best ? "bg-sense-lime" : "bg-sense-blue/70"}`}
                      style={{ height: `${(g.count / maxDay) * 100}%` }}
                    />
                  </span>
                  <span
                    className={`text-xs ${best ? "font-bold text-sense-navy" : "text-[#4b5d60]"}`}
                  >
                    {best ? `★ ${d}` : d}
                  </span>
                </div>
              );
            })}
          </div>
          <ul className="grid grid-cols-2 gap-1.5">
            {SLOTS.map(([key, label, range]) => {
              const g = slots[key];
              const best = bestSlot?.[0] === key;
              return (
                <li
                  key={key}
                  className={`grid gap-0.5 rounded-lg px-2.5 py-2 ${best ? "bg-sense-lime/60" : "bg-sense-blue/5"}`}
                >
                  <span className="text-[13px] font-semibold">
                    {label}{" "}
                    <span className="font-normal text-[#4b5d60]">{range}</span>
                    {best && <span className="ml-1">★</span>}
                  </span>
                  <span className="text-xs text-[#3d5053]">
                    {g.count
                      ? `${g.count} post${g.count === 1 ? "" : "s"}${g.avg != null ? ` · avg ${n(g.avg)} engagement` : ""}`
                      : "No posts"}
                  </span>
                </li>
              );
            })}
          </ul>
          {(bestDay || bestSlot) && (
            <p className="text-xs text-[#4b5d60]">
              ★ Best = most likes + comments per post on average.
            </p>
          )}
          {hidden > 0 && (
            <p className="text-xs text-[#4b5d60]">
              {hidden === posts.length
                ? "They hide their likes, so which day and time do best can’t be worked out."
                : `Averages leave out ${hidden} post${hidden === 1 ? "" : "s"} with hidden likes.`}
            </p>
          )}
        </div>

        {/* Hashtags */}
        <div className="grid content-start gap-3 rounded-xl bg-white/60 p-3">
          <strong className="text-sm text-sense-blue">Top hashtags</strong>
          {!stats.hashtags ? (
            <p className="text-[13px] text-[#4b5d60]">
              Press Refresh at the top to load their hashtags.
            </p>
          ) : stats.hashtags.length === 0 ? (
            <p className="text-[13px] text-[#4b5d60]">
              They don’t use hashtags in their recent posts.
            </p>
          ) : (
            <ul className="grid gap-1">
              {stats.hashtags.map((h) => (
                <li
                  key={h.tag}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] odd:bg-sense-blue/5"
                >
                  <strong className="min-w-0 flex-1 truncate">#{h.tag}</strong>
                  {mine.has(h.tag) && (
                    <span className="shrink-0 rounded-md bg-sense-blue/10 px-1.5 py-0.5 text-[11px] font-bold text-sense-blue">
                      You use this too
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-[#4b5d60] tabular-nums">
                    {h.count}×
                    {h.avgEngagement != null && ` · avg ${n(h.avgEngagement)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const PER_PAGE = 6;

/** Their recent posts, 6 at a time, with arrows to page through the rest. */
function RecentPosts({ posts, selectedId, bestId, onSelect }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(posts.length / PER_PAGE);
  const shown = posts.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const arrow =
    "grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-sense-blue/25 bg-white/80 text-base font-bold text-sense-blue transition hover:bg-sense-blue hover:text-paper disabled:cursor-default disabled:opacity-30 disabled:hover:bg-white/80 disabled:hover:text-sense-blue";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#4b5d60]">
          Recent posts
        </p>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4b5d60] tabular-nums">
              {page * PER_PAGE + 1}–{page * PER_PAGE + shown.length} of{" "}
              {posts.length}
            </span>
            <button
              type="button"
              aria-label="Previous posts"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className={arrow}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="More posts"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pages - 1}
              className={arrow}
            >
              ›
            </button>
          </div>
        )}
      </div>
      {shown.length ? (
        <div
          key={page}
          className="grid grid-cols-3 gap-2 lg:grid-cols-6 motion-safe:animate-[fadeIn_0.25s_ease-out]"
        >
          {shown.map((p) => (
            <PostTile
              key={p.id}
              post={p}
              selected={p.id === selectedId}
              best={p.id === bestId}
              onSelect={() => onSelect(p.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[#4b5d60]">No posts yet.</p>
      )}
      {pages > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: pages }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === page ? "w-4 bg-sense-blue" : "w-1.5 bg-sense-blue/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ me, item, onRemove }) {
  const s = item.stats;
  const [settings] = useSettings();
  // Show posting times in the timezone chosen in Settings (else this browser's).
  const timeZone = TIMEZONE_ZONES[settings.timezone] ?? undefined;
  // The big box shows their latest post until you click another one below.
  const [featuredId, setFeaturedId] = useState(null);
  const posts = s?.posts ?? [];
  const best = s?.topPost ?? null;
  const bestId = best?.id;
  const featured =
    (featuredId &&
      (posts.find((p) => p.id === featuredId) ??
        (best?.id === featuredId ? best : null))) ||
    posts[0] ||
    best;
  const tips = takeaways(me, s);
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Avatar src={s?.picture} label={item.handle} />
        <div className="grid min-w-[10rem] flex-1">
          <strong className="truncate text-base">@{item.handle}</strong>
          <span className="truncate text-[13px] text-[#4b5d60]">{s?.name}</span>
        </div>
        <a
          href={`https://www.instagram.com/${item.handle}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-bold text-sense-blue underline"
        >
          View profile ↗
        </a>
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 cursor-pointer rounded-2xl px-2.5 py-1 text-[13px] font-bold text-[#b84f4f] hover:bg-[#ff7f7f]/15"
        >
          Stop tracking
        </button>
      </div>

      {tips.length > 0 && (
        <div className="mb-4 grid gap-1.5 rounded-xl bg-sense-blue/[0.06] p-3">
          <strong className="flex items-center gap-1.5 text-sm text-sense-blue">
            <Icon name="sparkles" size={14} /> What stands out
          </strong>
          <ul className="grid gap-1 text-[13px] leading-[1.5] text-sense-navy">
            {tips.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      )}

      {featured && (
        <div className="mb-4 grid gap-4 rounded-xl border border-sense-blue/10 bg-white/60 p-3 sm:grid-cols-[200px_minmax(0,1fr)]">
          <a
            href={featured.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block aspect-square overflow-hidden rounded-lg bg-sense-blue/10"
            title="View this post on Instagram"
          >
            {featured.image && (
              // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN
              <img
                key={featured.id}
                src={featured.image}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover motion-safe:animate-[fadeIn_0.25s_ease-out]"
              />
            )}
            <span className="absolute top-2 left-2 rounded-md bg-sense-navy/70 px-1.5 py-0.5 text-xs font-bold text-paper">
              {featured.format}
            </span>
          </a>
          <div className="grid content-start gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-sense-blue">
                {featuredId ? "Selected post" : "Their latest post"}
              </strong>
              {featured.id === bestId && (
                <span className="rounded-md bg-sense-lime px-1.5 py-0.5 text-xs font-bold text-sense-navy">
                  ★ Their best recent post
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#4b5d60]">
              {shortDate(featured.time)} ·{" "}
              {featured.likes == null
                ? "likes hidden"
                : `♥ ${n(featured.likes)} likes`}{" "}
              · 💬 {n(featured.comments)} comments
            </p>
            <p className="line-clamp-6 text-[13px] leading-[1.55] whitespace-pre-line text-[#33484c]">
              {featured.caption || "(no caption)"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Link
                href="/content-creation"
                // Hand the idea to Content Creation, like the trend "Use in Content" button.
                onClick={() =>
                  saveContentTrend(
                    {
                      name: `@${item.handle}'s ${featured.format.toLowerCase()}`,
                      platform: "Instagram",
                      format: featured.format,
                      hook: featured.caption.slice(0, 160),
                    },
                    { source: "competitor", path: "/content-creation", returnTo: { href: "/competitors", label: "Back to Competitors" } },
                  )
                }
                className="inline-flex items-center gap-1 rounded-2xl bg-sense-blue px-3 py-1.5 text-[13px] font-bold text-paper hover:bg-sense-blue/85"
              >
                Create a response <Icon name="chevron" size={13} />
              </Link>
              <a
                href={featured.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-sense-blue underline"
              >
                View post ↗
              </a>
            </div>
          </div>
        </div>
      )}

      <RecentPosts
        posts={posts}
        selectedId={featured?.id}
        bestId={bestId}
        onSelect={setFeaturedId}
      />
      <HowTheyPost stats={s} me={me} timeZone={timeZone} />
    </Panel>
  );
}

export default function RealCompetitors() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [handle, setHandle] = useState("");
  const [formError, setFormError] = useState(null);
  const [loading, startLoading] = useTransition();
  const [adding, startAdding] = useTransition();

  const [scrolled, setScrolled] = useState(false); // table scrolled sideways (phones)
  const [updating, setUpdating] = useState(false); // background update after opening

  // Every fetch gets a number; only the newest one may replace what's shown, so a slow
  // background update can't overwrite a newer list (e.g. right after adding someone).
  const seq = useRef(0);
  const fetchData = useCallback(async (opts) => {
    const id = ++seq.current;
    const next = await getCompetitors(opts);
    if (id === seq.current) setData(next);
    return next;
  }, []);

  // Opening the page: show the saved numbers straight away (no Instagram calls), then
  // update anything older than 6 hours in the background.
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await fetchData({ savedOnly: true });
      if (!alive || !saved?.stale) return;
      setUpdating(true);
      await fetchData();
      if (alive) setUpdating(false);
    })();
    return () => {
      alive = false;
    };
  }, [fetchData]);

  const refreshAll = () =>
    startLoading(async () => {
      await fetchData({ refresh: true });
    });

  // The details open below the table, often off-screen, so scroll down to them when
  // someone picks a competitor (not when they close it).
  const detailRef = useRef(null);
  const scrollPending = useRef(false);
  const open = (id) => {
    scrollPending.current = id != null;
    setSelected(id);
  };
  useEffect(() => {
    if (!scrollPending.current || !detailRef.current) return;
    scrollPending.current = false;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    detailRef.current.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, [selected, data]);

  // "Stop tracking" hides the competitor straight away but only deletes it after a few
  // seconds, so Undo can bring it back. Leaving the page deletes it then.
  const [pending, setPending] = useState(null); // { id, handle }
  const pendingRef = useRef(null);
  const timer = useRef(null);
  const commit = useCallback(
    async (p) => {
      const res = await removeCompetitor(p.id);
      if (res.error)
        setFormError(`Couldn’t stop tracking @${p.handle}: ${res.error}`);
      await fetchData();
    },
    [fetchData],
  );
  const remove = (item) => {
    clearTimeout(timer.current);
    if (pendingRef.current) commit(pendingRef.current); // only one Undo at a time
    const p = { id: item.id, handle: item.handle };
    pendingRef.current = p;
    setPending(p);
    setSelected(null);
    timer.current = setTimeout(() => {
      pendingRef.current = null;
      setPending(null);
      commit(p);
    }, UNDO_MS);
  };
  const undo = () => {
    clearTimeout(timer.current);
    const p = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (p) open(p.id);
  };
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (pendingRef.current) removeCompetitor(pendingRef.current.id);
    },
    [],
  );

  const add = (e) => {
    e.preventDefault();
    setFormError(null);
    startAdding(async () => {
      const res = await addCompetitor(handle);
      if (res.error) return setFormError(res.error);
      setHandle("");
      const next = await fetchData();
      open(next.competitors.at(-1)?.id ?? null);
    });
  };

  const me = data?.me;
  const list = (data?.competitors ?? []).filter((c) => c.id !== pending?.id);
  const current = list.find((c) => c.id === selected) ?? null;
  const rows = [
    ...(me ? [{ id: "me", handle: me.username, stats: me, mine: true }] : []),
    ...list,
  ];
  // Highlight the best value in each column.
  const best = Object.fromEntries(
    COLUMNS.map(([key]) => [
      key,
      Math.max(...rows.map((r) => r.stats?.[key] ?? -1)),
    ]),
  );

  return (
    <section className="mb-6 grid gap-[18px]">
      <Panel>
        <PanelHeading
          eyebrow="Live from Instagram"
          title="Your competitors"
          subtitle="Public numbers from their last 25 posts, compared with your account."
          aside={
            data?.connected && list.length > 0 ? (
              <span className="flex items-center gap-2">
                {updating && !loading && (
                  <span
                    role="status"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4b5d60]"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-sense-blue motion-safe:animate-pulse"
                    />
                    Updating from Instagram…
                  </span>
                )}
                <button
                  type="button"
                  onClick={refreshAll}
                  disabled={loading}
                  className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-2xl border border-sense-blue/25 px-3 text-[13px] font-bold text-sense-blue hover:bg-sense-blue/10 disabled:opacity-60"
                >
                  <Icon name="repeat" size={13} />{" "}
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </span>
            ) : null
          }
        />

        {!data ? (
          <p className="mt-4 text-sm text-[#4b5d60]">Loading…</p>
        ) : !data.connected ? (
          <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-sense-blue/25 p-4 text-sm leading-[1.6] text-[#3d5053]">
            <strong className="text-sense-blue">
              Connect Instagram to track real competitors
            </strong>
            <p>
              Competitor numbers are looked up through your own Instagram
              business account.
            </p>
            <Link
              href="/settings#connections"
              className="w-max rounded-2xl bg-sense-blue px-3.5 py-2 text-[13px] font-bold text-paper hover:bg-sense-blue/85"
            >
              Go to Connected accounts
            </Link>
          </div>
        ) : (
          <>
            <form
              onSubmit={add}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              <label className="flex min-h-10 min-w-[15rem] max-w-[320px] flex-1 items-center gap-1 rounded-[20px] border border-sense-blue/25 bg-white/80 px-3 focus-within:border-sense-blue">
                <span className="text-base text-[#6f7f82]">@</span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="their Instagram username"
                  aria-label="Competitor's Instagram username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent text-sm text-sense-navy outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={adding || !handle.trim()}
                className="min-h-10 shrink-0 cursor-pointer rounded-[20px] bg-sense-lime px-5 text-[13px] font-extrabold uppercase text-sense-navy shadow-[0_4px_0_rgba(0,31,62,0.17)] transition hover:translate-y-px disabled:cursor-default disabled:opacity-60"
              >
                {adding ? "Looking up…" : "Add competitor"}
              </button>
              <span className="text-xs text-[#4b5d60]">
                Business and creator accounts only.
              </span>
            </form>
            {formError && (
              <p role="alert" className="mt-2 text-sm text-coral-400">
                {formError}
              </p>
            )}
            {data.meError && (
              <p className="mt-2 text-[13px] text-[#4b5d60]">
                Your own numbers couldn’t load: {data.meError}
              </p>
            )}

            <div aria-live="polite">
              {pending && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sense-navy px-3.5 py-2.5 text-sm text-paper motion-safe:animate-[fadeIn_0.2s_ease-out]">
                  <span>
                    Stopped tracking <strong>@{pending.handle}</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={undo}
                    className="cursor-pointer rounded-2xl bg-sense-lime px-3 py-1 text-[13px] font-bold text-sense-navy hover:bg-sense-lime/85"
                  >
                    ↶ Undo
                  </button>
                </div>
              )}
            </div>

            {list.length === 0 ? (
              <p className="mt-4 text-sm text-[#3d5053]">
                Add a competitor above to compare their followers, posting and
                engagement with yours.
              </p>
            ) : (
              <>
                <div
                  className="mt-4 overflow-x-auto bg-paper"
                  onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 0)}
                >
                  <table className="w-full min-w-[660px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-[#4b5d60]">
                        <th
                          scope="col"
                          className={`${STICKY} ${scrolled ? STICKY_EDGE : ""} bg-paper pb-2 font-semibold`}
                        >
                          Account
                        </th>
                        {COLUMNS.map(([key, label, , text]) => (
                          <th
                            key={key}
                            scope="col"
                            className="pb-2 text-right font-semibold"
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              <InfoTip label={label} text={text} />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const active = r.id === selected;
                        return (
                          <tr
                            key={r.id}
                            onClick={() =>
                              !r.mine && open(active ? null : r.id)
                            }
                            className={`group border-t border-sense-blue/10 transition ${r.mine ? "bg-sense-blue/5" : "cursor-pointer hover:bg-sense-blue/5"} ${active ? "bg-sense-blue/10" : ""}`}
                          >
                            {/* The name column stays put when the table scrolls
                                sideways (phones). It needs a solid background so the
                                numbers slide under it, with the row's tint on top. */}
                            <th
                              scope="row"
                              className={`${STICKY} ${scrolled ? STICKY_EDGE : ""} bg-paper py-2.5 text-left font-normal ${
                                active
                                  ? "bg-[linear-gradient(rgba(3,82,94,0.1),rgba(3,82,94,0.1))] shadow-[inset_4px_0_0_var(--color-sense-navy)]"
                                  : r.mine
                                    ? "bg-[linear-gradient(rgba(3,82,94,0.05),rgba(3,82,94,0.05))]"
                                    : "group-hover:bg-[linear-gradient(rgba(3,82,94,0.05),rgba(3,82,94,0.05))]"
                              }`}
                            >
                              {/* Competitors' names are real buttons so Tab + Enter
                                  can open them too; the whole row still takes clicks. */}
                              <RowOpener
                                button={!r.mine}
                                expanded={active}
                                onToggle={() => open(active ? null : r.id)}
                              >
                                <Avatar
                                  src={r.stats?.picture}
                                  label={r.handle}
                                  mine={r.mine}
                                />
                                <span className="grid min-w-0 max-w-[7.5rem] sm:max-w-[16rem]">
                                  <strong className="truncate">
                                    @{r.handle}
                                  </strong>
                                  <span className="truncate text-xs text-[#4b5d60]">
                                    {r.mine
                                      ? "You"
                                      : r.error
                                        ? `Couldn’t update: ${r.error}`
                                        : `Updated ${ago(r.updatedAt)} · ${active ? "tap again to close" : "tap for details"}`}
                                  </span>
                                  {active && (
                                    <span className="mt-0.5 w-max rounded-md bg-sense-blue px-1.5 py-0.5 text-[11px] font-bold text-paper">
                                      Details below ↓
                                    </span>
                                  )}
                                </span>
                              </RowOpener>
                            </th>
                            {COLUMNS.map(([key, , fmt]) => {
                              const v = r.stats?.[key];
                              const top =
                                rows.length > 1 &&
                                v != null &&
                                v === best[key] &&
                                v > 0;
                              return (
                                <td
                                  key={key}
                                  className={`py-2.5 text-right tabular-nums ${top ? "font-bold text-sense-blue" : ""}`}
                                >
                                  {v == null &&
                                  r.stats &&
                                  LIKE_BASED.has(key) ? (
                                    <span
                                      className="text-xs text-[#4b5d60]"
                                      title="This account hides its like counts"
                                    >
                                      Hidden
                                    </span>
                                  ) : (
                                    fmt(v)
                                  )}
                                  {top && (
                                    <span
                                      className="ml-1 text-[11px]"
                                      aria-label="highest"
                                    >
                                      ▲
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </Panel>

      {current && (
        <div ref={detailRef} id="competitor-details" className="scroll-mt-24">
          <Detail
            key={current.id}
            me={me}
            item={current}
            onRemove={() => remove(current)}
          />
        </div>
      )}
    </section>
  );
}
