"use client";

// Based on the top bar in the Marketing Intelligence Hub Figma Make app:
// a search pill that jumps to any screen, an alerts bell, and the company pill
// (name comes from Settings → Workspace).

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { trends } from "@/lib/trends";
import { fromISODate, upcoming, useCalendar, useToday } from "@/lib/calendar";
import { initials, openSettingsSection, useSettings } from "@/lib/settings";
import useStored from "@/lib/useStored";
import MobileNav from "./MobileNav";

const glass =
  "border border-[rgba(246,248,237,0.34)] bg-[rgba(246,248,237,0.18)] text-[#f6f8ed] shadow-[inset_0_1px_0_rgba(246,248,237,0.28),0_10px_25px_rgba(0,31,62,0.1)] backdrop-blur-[18px]";
const popover =
  "absolute right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-paper/60 bg-paper text-sense-navy shadow-[0_18px_40px_rgba(0,31,62,0.25)]";

const DESTINATIONS = [
  ["Overview", "/overview", "trend", "dashboard home summary metrics"],
  ["Audience trends", "/audience-trends", "audience", "audience trends hashtags tiktok instagram search radar watchlist"],
  ["Competitors", "/competitors", "target", "competitor benchmark campaigns comparison"],
  ["Content Creation", "/content-creation", "content", "content create write generate"],
  ["Social post", "/content-creation/social", "message", "social post caption instagram"],
  ["Video", "/content-creation/video", "video", "video script storyboard reel tiktok youtube"],
  ["Blog post", "/content-creation/blog", "content", "blog article seo outline"],
  ["Ad copy", "/content-creation/ad", "target", "ad copy advert headline campaign"],
  ["Edit posts", "/content-creation/edit", "edit", "edit post refine"],
  ["Improve copy", "/content-creation/improve", "sparkles", "improve copy tone rewrite"],
  ["Repurpose content", "/content-creation/repurpose", "repeat", "repurpose convert channels"],
  ["Upload a file", "/content-creation/upload", "upload", "upload file document draft"],
  ["My Content", "/content-creation/my-content", "content", "my content saved library"],
  ["AI Management", "/ai-management", "calendar", "ai management planner calendar schedule plan"],
  ["Reports", "/reports", "trend", "reports insights revenue roas pdf"],
  ["Settings", "/settings", "edit", "settings profile workspace company account"],
  ["Alert settings", "/settings#notifications", "bell", "notifications alerts preferences"],
].map(([label, href, icon, keywords]) => ({ label, href, icon, keywords: `${label} ${keywords}`.toLowerCase() }));

const TOP_TREND = [...trends].sort((a, b) => b.change - a.change)[0];
const NO_READ = [];

/** Close when clicking outside `ref` or pressing Escape. */
function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && close();
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}

function Search() {
  const router = useRouter();
  const listId = useId();
  const ref = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useDismiss(ref, open, () => setOpen(false));

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = (words.length ? DESTINATIONS.filter((d) => words.every((w) => d.keywords.includes(w))) : DESTINATIONS.slice(0, 6)).slice(0, 7);

  const go = (d) => {
    setOpen(false);
    setQuery("");
    if (d.href.startsWith("/settings#")) openSettingsSection(d.href.split("#")[1]);
    router.push(d.href);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <label className={`flex h-12 items-center gap-2.5 rounded-full px-5 ${glass}`}>
        <Icon name="search" size={17} className="shrink-0" />
        <input
          type="search"
          role="combobox"
          aria-label="Search SixthSense"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          placeholder="Search pages"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[rgba(246,248,237,0.78)]"
        />
      </label>
      {open && (
        <ul id={listId} role="listbox" className={`${popover} left-0 py-1.5`}>
          {results.length ? (
            results.map((d, i) => (
              <li
                key={d.href}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(d);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm ${i === active ? "bg-sense-lime/50" : ""}`}
              >
                <Icon name={d.icon} size={16} className="shrink-0 text-sense-blue" />
                <span className="flex-1">{d.label}</span>
                {i === active && <span className="text-[10px] text-[#5f706e]">Enter ↵</span>}
              </li>
            ))
          ) : (
            <li role="presentation" className="px-4 py-3 text-xs text-[#5f706e]">
              No pages match “{query}”.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function useAlerts() {
  const [settings] = useSettings();
  const { posts } = useCalendar();
  const next = upcoming(posts, useToday())[0];
  const all = [
    {
      id: "competitor-guestsupply-launch",
      type: "competitor",
      icon: "target",
      title: "GuestSupply launched a product campaign",
      body: "Their engagement is 1.8 pts ahead of yours. See the benchmark.",
      href: "/competitors",
    },
    {
      id: `trend-${TOP_TREND.id}`,
      type: "trends",
      icon: "trend",
      title: `“${TOP_TREND.name}” is up ${TOP_TREND.change}%`,
      body: `Gaining momentum on ${TOP_TREND.platform}. Open Audience trends.`,
      href: "/audience-trends",
    },
    {
      id: "report-weekly",
      type: "reports",
      icon: "content",
      title: "Your weekly report is ready",
      body: "Revenue, ROAS and channel performance for the last 7 days.",
      href: "/reports",
    },
    next
      ? {
          id: `planner-${next.id}`,
          type: "planner",
          icon: "calendar",
          title: `Next post: ${next.title}`,
          body: `${next.channel} · ${fromISODate(next.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${next.time}`,
          href: "/ai-management",
        }
      : {
          id: "planner-empty",
          type: "planner",
          icon: "calendar",
          title: "Your content calendar is empty",
          body: "Let Sense AI draft a two-week posting plan.",
          href: "/ai-management",
        },
  ];
  return all.filter((a) => settings.alerts[a.type]);
}

function Alerts() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useStored("trendtracker:alerts-read", NO_READ);
  const alerts = useAlerts();
  const unread = alerts.filter((a) => !read.includes(a.id));
  useDismiss(ref, open, () => setOpen(false));

  const markRead = (ids) => setRead((cur) => [...new Set([...(Array.isArray(cur) ? cur : []), ...ids])].slice(-100));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Alerts"
        aria-label={`Alerts${unread.length ? `, ${unread.length} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className={`relative grid size-12 shrink-0 cursor-pointer place-items-center rounded-full transition hover:bg-[rgba(246,248,237,0.28)] ${glass}`}
      >
        <Icon name="bell" size={18} />
        {unread.length > 0 && (
          <span className="absolute top-3 right-3.5 size-[7px] rounded-full border border-[#f6f8ed] bg-[#ff7f7f]" />
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Alerts" className={`${popover} w-[min(340px,calc(100vw-32px))]`}>
          <div className="flex items-center justify-between border-b border-sense-blue/10 px-4 py-3">
            <strong className="text-sm text-sense-blue">Alerts</strong>
            {unread.length > 0 && (
              <button type="button" onClick={() => markRead(alerts.map((a) => a.id))} className="cursor-pointer text-[11px] font-bold text-sense-blue hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          {alerts.length ? (
            <ul className="max-h-[360px] overflow-auto">
              {alerts.map((a) => {
                const isUnread = !read.includes(a.id);
                return (
                  <li key={a.id}>
                    <Link
                      href={a.href}
                      onClick={() => {
                        markRead([a.id]);
                        setOpen(false);
                      }}
                      className="flex gap-3 px-4 py-3 transition hover:bg-sense-lime/30"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sense-blue/10 text-sense-blue">
                        <Icon name={a.icon} size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className={`block text-xs ${isUnread ? "text-sense-navy" : "font-medium text-[#5f706e]"}`}>{a.title}</strong>
                        <span className="text-[11px] leading-[1.4] text-[#5f706e]">{a.body}</span>
                      </span>
                      {isUnread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#ff7f7f]" aria-label="Unread" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-xs text-[#5f706e]">All alerts are switched off.</p>
          )}
          <Link
            href="/settings#notifications"
            onClick={() => {
              openSettingsSection("notifications");
              setOpen(false);
            }}
            className="block border-t border-sense-blue/10 px-4 py-3 text-center text-[11px] font-bold text-sense-blue hover:bg-sense-blue/5"
          >
            Manage alert settings
          </Link>
        </div>
      )}
    </div>
  );
}

function CompanyPill() {
  const [settings] = useSettings();
  const name = settings.company || "Set up your company";
  return (
    <Link
      href="/settings#workspace"
      onClick={() => openSettingsSection("workspace")}
      title={`${name} · Workspace settings`}
      aria-label={`${name}: workspace settings`}
      // Phones: just the round avatar. Wider screens: avatar and company name.
      className={`flex h-12 max-w-[260px] shrink-0 items-center gap-2.5 rounded-full p-1.5 text-xs font-semibold transition hover:bg-[rgba(246,248,237,0.28)] sm:py-1 sm:pr-5 ${glass}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6f8ed] text-[11px] font-bold text-[#03525e]">
        {settings.company ? initials(settings.company) : <Icon name="audience" size={18} />}
      </span>
      <span className="hidden truncate sm:inline">{name}</span>
    </Link>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  return (
    <header className="relative z-30 flex items-center gap-2 pt-4 pb-2 print:hidden sm:gap-3 sm:pt-6">
      <MobileNav />
      {/* Remount on navigation so open dropdowns close. */}
      <Search key={`s-${pathname}`} />
      <Alerts key={`a-${pathname}`} />
      <CompanyPill />
    </header>
  );
}
