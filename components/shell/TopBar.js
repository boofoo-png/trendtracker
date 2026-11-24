"use client";

// Based on the top bar in the Marketing Intelligence Hub Figma Make app:
// a search pill that jumps to any screen, an alerts bell, and the account menu
// (profile, business details, notifications, sign out).

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { trends } from "@/lib/trends";
import { channelLabel, fromISODate, upcoming, useCalendar, useToday } from "@/lib/calendar";
import { ALERT_TYPES, initials, openSettingsSection, useSettings } from "@/lib/settings";
import { signOut } from "@/app/actions/auth";
import { addAccount, listSavedAccounts, switchToAccount } from "@/lib/savedAccounts";
import { useAccount } from "@/lib/account";
import useStored from "@/lib/useStored";
import MobileNav from "./MobileNav";
import Skeleton from "@/components/ui/Skeleton";
import useHydrated from "@/lib/useHydrated";
import { openSense } from "@/lib/assistant/shared";

const glass =
  "border border-[rgba(246,248,237,0.34)] bg-[rgba(246,248,237,0.18)] text-[#f6f8ed] shadow-[inset_0_1px_0_rgba(246,248,237,0.28),0_10px_25px_rgba(0,31,62,0.1)] backdrop-blur-[18px]";
const popover =
  "absolute right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-paper/60 bg-paper text-sense-navy shadow-[0_18px_40px_rgba(0,31,62,0.25)]";

const DESTINATIONS = [
  ["Overview", "/overview", "trend", "dashboard home summary metrics"],
  ["Audience trends", "/audience-trends", "audience", "audience trends hashtags tiktok instagram search radar watchlist"],
  ["Competitors", "/competitors", "target", "competitor benchmark campaigns comparison"],
  ["Content Creation", "/content-creation", "content", "content create write generate"],
  ["Write a new post", "/content-creation/social", "message", "social post caption instagram create new write"],
  ["Video", "/content-creation/video", "video", "video script storyboard reel tiktok"],
  ["Blog post", "/content-creation/blog", "content", "blog article seo outline"],
  ["Ad copy", "/content-creation/ad", "target", "ad copy advert headline campaign"],
  ["Improve your writing", "/content-creation/improve", "sparkles", "improve edit rewrite polish summarize feedback upload file document post email website copy"],
  ["Adapt for other platforms", "/content-creation/repurpose", "repeat", "adapt repurpose convert channels platforms instagram facebook tiktok blog"],
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
  const pages = (words.length ? DESTINATIONS.filter((d) => words.every((w) => d.keywords.includes(w))) : DESTINATIONS.slice(0, 6)).slice(0, 6);
  // Anything typed can also go to Sense AI as a question.
  const results = query.trim()
    ? [...pages, { label: `Ask Sense AI: “${query.trim()}”`, href: "#sense", icon: "sparkles", ask: query.trim() }]
    : [...pages, { label: "Ask Sense AI a question", href: "#sense", icon: "sparkles", ask: "" }];

  const go = (d) => {
    setOpen(false);
    setQuery("");
    if (d.href === "#sense") return openSense(d.ask);
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
          placeholder="Search or ask…"
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
          body: `${channelLabel(next)} · ${fromISODate(next.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${next.time}`,
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
  const hydrated = useHydrated();
  // Until the browser has read which alerts you've seen, don't claim any are unread.
  const unread = hydrated ? alerts.filter((a) => !read.includes(a.id)) : [];
  useDismiss(ref, open, () => setOpen(false));

  const markRead = (ids) => setRead((cur) => [...new Set([...(Array.isArray(cur) ? cur : []), ...ids])].slice(-100));
  const [settings, setSettings] = useSettings();
  const [choosing, setChoosing] = useState(false); // showing the alert switches

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
          {/* Choose alert types right here instead of going to Settings. */}
          <div className="border-t border-sense-blue/10">
            <button
              type="button"
              aria-expanded={choosing}
              onClick={() => setChoosing((c) => !c)}
              className="flex w-full cursor-pointer items-center justify-center gap-1 px-4 py-3 text-[11px] font-bold text-sense-blue hover:bg-sense-blue/5"
            >
              Choose which alerts you get
              <Icon name="chevron" size={13} className={`transition-transform ${choosing ? "-rotate-90" : "rotate-90"}`} />
            </button>
            {choosing && (
              <ul className="grid gap-1 px-3 pb-3">
                {ALERT_TYPES.map(([key, title]) => {
                  const on = settings.alerts[key];
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        onClick={() => setSettings({ ...settings, alerts: { ...settings.alerts, [key]: !on } })}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-xs hover:bg-sense-blue/5"
                      >
                        <span>{title}</span>
                        <span
                          aria-hidden="true"
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-sense-blue" : "bg-[#d5dccf]"}`}
                        >
                          <span className={`absolute top-0.5 size-4 rounded-full bg-paper shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const MENU_LINKS = [
  ["profile", "Your profile", "Name, role, email and phone", "audience"],
  ["workspace", "Business details", "Company, industry and topics", "content"],
  ["notifications", "Notifications", "Choose which alerts you get", "bell"],
  ["connections", "Connected accounts", "Facebook and Instagram", "instagram"],
];

/**
 * "Accounts" in the account menu (Instagram-style): the account you're using, other
 * accounts signed in on this browser (tap to switch), and "+ Add account".
 */
function AccountSwitcher({ fullName, company }) {
  const { userId } = useAccount();
  const [others, setOthers] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const me = { name: fullName, company };

  useEffect(() => {
    // Saved accounts live in this browser only; read after the menu opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOthers(listSavedAccounts().filter((a) => a.userId !== userId));
  }, [userId]);

  const row = "flex w-full items-center gap-3 px-4 py-2 text-left transition";
  const badge = "grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold";

  return (
    <div className="border-b border-sense-blue/10 py-1.5">
      <p className="px-4 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#647477]">Accounts</p>
      <ul>
        <li className={`${row} cursor-default`} aria-current="true">
          <span className={`${badge} bg-sense-blue text-paper`}>{initials(company || fullName)}</span>
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-xs font-semibold">{company || fullName || "This account"}</span>
            <span className="truncate text-[10px] text-[#647477]">{fullName}</span>
          </span>
          <Icon name="check" size={15} className="text-sense-blue" />
        </li>
        {others.map((a) => (
          <li key={a.userId}>
            <button
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={async () => {
                setBusy(a.userId);
                setError(null);
                const res = await switchToAccount(a.userId, me);
                if (res?.error) {
                  setBusy(null);
                  setError(res.error);
                }
              }}
              className={`${row} cursor-pointer hover:bg-sense-lime/30 disabled:opacity-60`}
              title={`Switch to ${a.email}`}
            >
              <span className={`${badge} bg-sense-blue/10 text-sense-blue`}>{initials(a.company || a.name || a.email)}</span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-xs font-semibold">{a.company || a.name || a.email}</span>
                <span className="truncate text-[10px] text-[#647477]">{a.email}</span>
              </span>
              {busy === a.userId && <span className="text-[10px] text-[#647477]">Switching…</span>}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        role="menuitem"
        disabled={busy !== null}
        onClick={() => {
          setBusy("add");
          addAccount(me);
        }}
        className={`${row} cursor-pointer text-xs font-semibold text-sense-blue hover:bg-sense-lime/30 disabled:opacity-60`}
      >
        <span className={`${badge} border border-dashed border-sense-blue/40 text-base leading-none`}>+</span>
        {busy === "add" ? "Opening sign in…" : "Add account"}
      </button>
      {error && <p role="alert" className="px-4 pb-1.5 text-[11px] text-coral-400">{error}</p>}
    </div>
  );
}

/** Account menu: who's signed in, shortcuts into Settings, and Sign out. */
function AccountMenu() {
  const [settings, , loaded] = useSettings();
  const ref = useRef(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useDismiss(ref, open, () => setOpen(false));

  if (!loaded) {
    return (
      <span aria-hidden="true" className={`flex h-12 shrink-0 items-center gap-2.5 rounded-full p-1.5 sm:pr-5 ${glass}`}>
        <Skeleton tone="dark" className="size-9 rounded-full" />
        <Skeleton tone="dark" className="hidden h-3 w-28 sm:block" />
      </span>
    );
  }

  const fullName = `${settings.firstName ?? ""} ${settings.lastName ?? ""}`.trim();
  const company = settings.company || "Set up your company";
  const avatar = initials(fullName || settings.company);
  const subtitle = [settings.role, settings.company].filter(Boolean).join(" · ");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Account menu for ${fullName || company}`}
        // Phones: just the round avatar. Wider screens: avatar, company name and a caret.
        className={`flex h-12 max-w-[260px] shrink-0 cursor-pointer items-center gap-2.5 rounded-full p-1.5 text-xs font-semibold transition hover:bg-[rgba(246,248,237,0.28)] sm:py-1 sm:pr-4 ${glass}`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6f8ed] text-[11px] font-bold text-[#03525e]">
          {fullName || settings.company ? avatar : <Icon name="audience" size={18} />}
        </span>
        <span className="hidden truncate sm:inline">{company}</span>
        <Icon name="chevron" size={14} className={`hidden transition-transform sm:block ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Account" className={`${popover} w-[min(290px,calc(100vw-32px))]`}>
          <div className="flex items-center gap-3 border-b border-sense-blue/10 px-4 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sense-blue text-xs font-bold text-paper">{avatar}</span>
            <span className="grid min-w-0 gap-px">
              <strong className="truncate text-sm">{fullName || "Your name"}</strong>
              {settings.email && <span className="truncate text-[11px] text-[#5f706e]">{settings.email}</span>}
              {subtitle && <span className="truncate text-[11px] font-semibold text-sense-blue">{subtitle}</span>}
            </span>
          </div>
          <AccountSwitcher fullName={fullName} company={settings.company} />
          <ul className="py-1.5">
            {MENU_LINKS.map(([id, label, hint, icon]) => (
              <li key={id}>
                <Link
                  role="menuitem"
                  href={`/settings#${id}`}
                  onClick={() => {
                    setOpen(false);
                    openSettingsSection(id); // when Settings is already open
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-sense-lime/30"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sense-blue/10 text-sense-blue">
                    <Icon name={icon} size={16} />
                  </span>
                  <span className="grid min-w-0 gap-px">
                    <strong className="text-xs">{label}</strong>
                    <span className="truncate text-[11px] text-[#5f706e]">{hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <form action={signOut} onSubmit={() => setSigningOut(true)} className="border-t border-sense-blue/10 p-1.5">
            <button
              type="submit"
              role="menuitem"
              disabled={signingOut}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-xs font-bold text-[#b84f4f] transition hover:bg-[#ff7f7f]/15 disabled:opacity-60"
            >
              <span className="grid size-8 shrink-0 place-items-center">
                <Icon name="logout" size={17} />
              </span>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </form>
        </div>
      )}
    </div>
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
      <AccountMenu key={`m-${pathname}`} />
    </header>
  );
}
