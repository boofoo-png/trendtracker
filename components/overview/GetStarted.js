"use client";

// "Get started" checklist at the top of Overview for new workspaces. Each step ticks
// itself off from real data (no manual checkboxes), the next step gets the button,
// and the card disappears once every step is done. "Hide" is remembered in this
// browser only, per workspace: it's a convenience, not account data.

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Dashboard";
import { useAccount } from "@/lib/account";
import { NOT_SET } from "@/lib/business";
import { useContentStore } from "@/lib/contentStore";
import { useSettings } from "@/lib/settings";

const hideKey = (workspaceId) => `trendtracker:get-started-hidden:${workspaceId}`;

function readHidden(workspaceId) {
  try {
    return localStorage.getItem(hideKey(workspaceId)) === "1";
  } catch {
    return false;
  }
}

function writeHidden(workspaceId, hidden) {
  try {
    if (hidden) localStorage.setItem(hideKey(workspaceId), "1");
    else localStorage.removeItem(hideKey(workspaceId));
  } catch {
    // Storage blocked: the card just comes back next visit.
  }
}

/** data: getPerformance() result. */
export default function GetStarted({ data }) {
  const { workspaceId } = useAccount();
  const [settings, , settingsLoaded] = useSettings();
  const content = useContentStore();
  const [hidden, setHidden] = useState(true); // assume hidden until storage is read

  useEffect(() => {
    // Read after mount so server and client markup match on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspaceId) setHidden(readHidden(workspaceId));
  }, [workspaceId]);

  // Wait for everything the steps depend on, so nothing flashes as "not done".
  // A failed load (data.error) would show finished steps as not done, so skip the card.
  if (!workspaceId || !settingsLoaded || !content.loaded || hidden || data.error) return null;

  const steps = [
    {
      done: settings.industry !== NOT_SET || Boolean(settings.description?.trim()),
      title: "Tell Sense AI about your business",
      why: "Your industry and a line about what you do, so everything it writes fits your business.",
      href: "/settings#workspace",
      action: "Add business details",
    },
    {
      done: data.connected,
      title: "Connect Instagram",
      why: "Brings in your real followers, posts and reach.",
      href: "/settings#connections",
      action: "Connect Instagram",
    },
    {
      done: (data.trackedCount ?? data.competitors.length) > 0,
      title: "Track a competitor",
      why: "See how often they post and how their audience responds, next to your numbers.",
      href: "/competitors",
      action: "Track a competitor",
    },
    {
      done: Boolean(data.trendsUpdatedAt) || data.trends.length > 0,
      title: "Find trends for your audience",
      why: "Spot what's growing on Instagram and TikTok before it peaks.",
      href: "/audience-trends",
      action: "Find trends",
    },
    {
      done: content.saved.length > 0 || content.calendar.length > 0,
      title: "Create your first post",
      why: "Sense AI writes the caption and suggests visuals. Save it or put it on your calendar.",
      href: "/content-creation/social",
      action: "Write a post",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.findIndex((s) => !s.done);

  const hide = () => {
    writeHidden(workspaceId, true);
    setHidden(true);
  };

  return (
    <section
      aria-label="Get started"
      className="mb-3.5 rounded-[24px] border border-paper/40 bg-paper/[0.92] p-5 text-sense-navy shadow-[0_9px_0_rgba(0,31,63,0.12),0_18px_34px_rgba(0,31,63,0.1)] backdrop-blur-md sm:px-6 sm:py-[22px] lg:mb-[18px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Get started</Eyebrow>
          <h2 className="text-[17px] font-bold text-sense-blue">Set up Sense AI in five steps</h2>
          <p className="mt-1 text-[13px] text-[#4b5d60]">
            {doneCount} of {steps.length} done. Each step ticks itself off once you&apos;ve done it.
          </p>
        </div>
        <button
          type="button"
          onClick={hide}
          className="-mt-1 -mr-2 shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold text-sense-blue hover:bg-sense-blue/10"
        >
          Hide
        </button>
      </div>

      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
        className="mt-4 h-2 overflow-hidden rounded-full bg-sense-blue/10"
      >
        <div className="h-full rounded-full bg-sense-blue transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <ol className="mt-4 grid gap-2">
        {steps.map((s, i) => {
          const isNext = i === next;
          return (
            <li
              key={s.title}
              className={`flex flex-col gap-3 rounded-2xl px-3.5 py-3 sm:flex-row sm:items-center ${
                isNext ? "border border-sense-blue/25 bg-white/70" : "border border-transparent"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    s.done ? "bg-[#2f6b4f] text-paper" : isNext ? "bg-sense-blue text-paper" : "border border-sense-blue/30 text-sense-blue"
                  }`}
                >
                  {s.done ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <div className="min-w-0">
                  <strong className={`block text-sm ${s.done ? "text-[#4b5d60] line-through decoration-[#4b5d60]/50" : "text-sense-navy"}`}>
                    {s.title}
                    <span className="sr-only">{s.done ? " (done)" : ""}</span>
                  </strong>
                  {!s.done && <p className="mt-0.5 text-[13px] leading-[1.5] text-[#4b5d60]">{s.why}</p>}
                </div>
              </div>
              {!s.done &&
                (isNext ? (
                  <Link
                    href={s.href}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-2xl bg-sense-blue px-3.5 py-2 text-xs font-bold text-paper hover:bg-sense-blue/85 sm:self-center"
                  >
                    {s.action} <Icon name="chevron" size={13} />
                  </Link>
                ) : (
                  <Link
                    href={s.href}
                    className="inline-flex shrink-0 items-center gap-[3px] self-start text-xs font-bold text-sense-blue hover:underline sm:self-center"
                  >
                    {s.action} <Icon name="chevron" size={13} />
                  </Link>
                ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
