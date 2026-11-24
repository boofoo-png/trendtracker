"use client";

// "Add to calendar" for a finished piece of content (a result or a My Content item):
// opens the calendar's own post pop-up with the title and text filled in, so only the
// date, time and platforms need choosing. Afterwards the button says where it went.

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import PostEditor from "@/components/ai-management/PostEditor";
import { addDays, toISODate, useCalendar, useToday } from "@/lib/calendar";

const CALENDAR = "/ai-management";
const shortDate = (iso) =>
  new Date(`${iso}T00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/**
 * title, text: what to schedule. compact: the small My Content style.
 * getSavedId(): the My Content item this is (saving it first if needed), so the
 * calendar post is linked to it: one post, shown once in My Content, edits in sync.
 */
export default function AddToCalendar({ title, text, getSavedId, compact = false, className = "" }) {
  const today = useToday();
  const { addPosts } = useCalendar();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(null); // ISO date it was added to

  const style = compact
    ? "inline-flex cursor-pointer items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-bold text-sense-blue transition-colors hover:bg-sense-blue/10"
    : `inline-flex min-h-[35px] cursor-pointer items-center justify-center gap-1.5 rounded-[18px] border border-sense-blue/25 bg-white/70 px-4 text-[10px] font-bold text-sense-blue transition-opacity hover:opacity-85 ${className}`;

  if (added) {
    return (
      <Link href={CALENDAR} title="Open your content calendar" className={`${style} text-[#2f6b4f]`}>
        <Icon name="check" size={13} /> {compact ? `On calendar · ${shortDate(added)}` : `On your calendar · ${shortDate(added)} →`}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!today}
        title="Plan this post on your content calendar"
        className={style}
      >
        <Icon name="calendar" size={13} /> {compact ? "Schedule" : "Add to calendar"}
      </button>
      {open && today && (
        <PostEditor
          // A new post, starting tomorrow, with the content filled in.
          post={{ date: toISODate(addDays(today, 1)), title: String(title ?? "").slice(0, 120), caption: String(text ?? "").slice(0, 2200) }}
          today={today}
          onClose={() => setOpen(false)}
          onSave={(fields) => {
            const savedId = getSavedId?.() ?? null;
            addPosts([{ ...fields, savedId }]);
            // In My Content the card's own "Scheduled" tag shows it; elsewhere, say so here.
            if (!compact) setAdded(fields.date);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
