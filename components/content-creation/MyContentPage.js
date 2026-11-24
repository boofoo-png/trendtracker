"use client";

// Library of everything you've made: content saved from the Content Creation screens,
// plus posts planned in the AI Management calendar (read straight from the calendar,
// so the two never disagree). Kept in this browser only.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { removeItem, updateItem } from "@/lib/savedContent";
import { useContentStore } from "@/lib/contentStore";
import { channelLabel, channelsOf, useCalendar, useToday } from "@/lib/calendar";
import { saveContentTrend } from "@/lib/contentTrend";
import useHydrated from "@/lib/useHydrated";
import Skeleton from "@/components/ui/Skeleton";
import { CopyButton, PageHeading } from "./ui";
import PostEditor from "@/components/ai-management/PostEditor";
import AddToCalendar from "./AddToCalendar";
import { AdaptDialog } from "./AdaptPanel";

export const PLANNED = "Planned post";

const plannedWhen = (item) =>
  `${new Date(`${item.date}T00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${item.time}`;

/** A post from the content calendar. */
function PlannedCard({ item, open, onToggle, onEdit, onWrite, onRemove }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[18px] border border-paper/70 bg-paper/95 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_15px_25px_rgba(0,31,62,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.19),0_18px_30px_rgba(0,31,62,0.14)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[118px] w-full cursor-pointer flex-col items-start justify-center gap-2 bg-[linear-gradient(145deg,#001f3e,#0b3a52)] p-[17px] text-left text-paper"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sense-lime">
          <Icon name="calendar" size={13} /> {PLANNED}
        </span>
        <strong className="line-clamp-2 text-[13px] leading-tight">{item.title}</strong>
        <span className="text-[13px] text-paper/80">{plannedWhen(item)}</span>
      </button>
      {open && (
        <p className="max-h-[260px] overflow-y-auto border-b border-sense-blue/10 px-3.5 py-3 text-[13px] leading-[1.55] whitespace-pre-line text-[#33484c]">
          {item.text || "No caption yet. Press “Write caption with AI” to draft one."}
        </p>
      )}
      <div className="grid gap-2.5 px-3.5 pt-3 pb-3.5">
        <span className="truncate text-[11px] font-extrabold uppercase text-sense-blue">
          {channelLabel(item)} · {item.format}
        </span>
        <div className="grid gap-1.5">
          <button
            type="button"
            onClick={onWrite}
            title="Opens Content Creation so Sense AI can draft this post's caption"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-sense-blue px-3 py-2 text-[13px] font-bold text-paper transition hover:bg-sense-blue/85"
          >
            <Icon name="sparkles" size={13} /> {item.text ? "Rewrite caption with AI" : "Write caption with AI"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Change the date, time, channels or caption in your calendar"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-sense-blue/25 px-3 py-2 text-[13px] font-bold text-sense-blue transition hover:bg-sense-blue/10"
          >
            <Icon name="edit" size={13} /> Change details
          </button>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          {item.text ? <CopyButton text={item.text} label="Copy caption" /> : <span className="text-xs text-[#6f7f82]">No caption yet</span>}
          <button
            type="button"
            title="Remove this post from your calendar"
            onClick={onRemove}
            className="inline-flex cursor-pointer items-center gap-1 rounded-2xl px-2 py-1 text-xs font-bold text-[#4b5d60] transition-colors hover:bg-[#ff7f7f]/15 hover:text-[#b84f4f]"
          >
            <Icon name="trash" size={13} /> Remove
          </button>
        </div>
      </div>
    </article>
  );
}

const CARD_STYLE = {
  "Social post": "bg-[linear-gradient(145deg,var(--color-sense-blue),#167181)] text-paper",
  "Blog post": "bg-[linear-gradient(145deg,#f8f8f1,#e9efdf)] text-sense-navy",
};
const DEFAULT_STYLE = "bg-[linear-gradient(145deg,var(--color-sense-lime),#efffae)] text-sense-navy";

/** scheduled: calendar posts made from this item (shown as tags; click to change). */
function SavedCard({ item, open, onToggle, onAdapt, scheduled = [], onEditScheduled }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [text, setText] = useState(item.text);
  const changed = title.trim() !== item.title || text !== item.text;

  const startEditing = () => {
    setTitle(item.title);
    setText(item.text);
    setEditing(true);
  };
  const saveEdits = () => {
    updateItem(item.id, { title, text });
    setEditing(false);
  };
  const cancel = () => {
    if (changed && !window.confirm("Discard your changes?")) return;
    setEditing(false);
  };

  const small = "inline-flex cursor-pointer items-center gap-1 rounded-2xl px-2 py-1 text-xs font-bold transition-colors";

  if (editing) {
    return (
      <article className="min-w-0 overflow-hidden rounded-[18px] border-2 border-sense-blue/40 bg-paper text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_15px_25px_rgba(0,31,62,0.1)] sm:col-span-2">
        <div className="grid gap-3 p-4">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-sense-blue">Editing · {item.type}</span>
          <label className="grid gap-1 text-[13px] font-semibold text-[#3d5053]">
            Title
            <input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-10 rounded-[9px] border border-sense-blue/25 bg-white px-3 text-[13px] font-normal text-sense-navy outline-none focus:border-sense-blue"
            />
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-[#3d5053]">
            Text
            <textarea
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              rows={Math.min(16, Math.max(6, text.split("\n").length + 1))}
              className="rounded-[9px] border border-sense-blue/25 bg-white px-3 py-2.5 text-[13px] leading-[1.55] font-normal text-sense-navy outline-none focus:border-sense-blue"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={cancel} className={`${small} border border-sense-blue/25 px-3.5 py-2 text-[13px] text-sense-blue hover:bg-sense-blue/10`}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdits}
              disabled={!changed || !text.trim()}
              className={`${small} bg-sense-blue px-3.5 py-2 text-[13px] text-paper hover:bg-sense-blue/85 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Save changes
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-[18px] border border-paper/70 bg-paper/95 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_15px_25px_rgba(0,31,62,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.19),0_18px_30px_rgba(0,31,62,0.14)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex min-h-[118px] w-full cursor-pointer flex-col items-start justify-center p-[17px] text-left ${CARD_STYLE[item.type] ?? DEFAULT_STYLE}`}
      >
        <span className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em]">{item.type}</span>
        <strong className="line-clamp-3 text-[13px] leading-tight">{item.title}</strong>
      </button>
      {open && (
        <p className="max-h-[260px] overflow-y-auto border-b border-sense-blue/10 px-3.5 py-3 text-[13px] leading-[1.55] whitespace-pre-line text-[#33484c]">
          {item.text}
        </p>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-2.5 px-3.5 pt-3 pb-3.5">
        {scheduled.length > 0 && (
          <ul className="grid min-w-0 gap-1">
            {scheduled.map((p) => (
              <li key={p.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onEditScheduled(p)}
                  title="Change the date, time or platforms"
                  className="flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-lg bg-sense-blue/10 px-2 py-1.5 text-left text-[13px] font-bold text-sense-blue transition-colors hover:bg-sense-blue/15"
                >
                  <Icon name="calendar" size={13} />
                  <span className="min-w-0 flex-1 truncate" title={`${plannedWhen(p)} · ${channelLabel(p)}`}>
                    <span className="sr-only">Scheduled for </span>
                    {plannedWhen(p)}
                  </span>
                  <Icon name="edit" size={12} className="opacity-60" />
                  <span className="sr-only">(change)</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] font-extrabold uppercase text-sense-blue">
            {item.trend ? `Trend: ${item.trend}` : "No trend"}
          </span>
          <small className="shrink-0 text-xs text-[#4b5d60]">
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </small>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <CopyButton text={item.text} label="Copy" />
          <button type="button" title="Change the title or text" onClick={startEditing} className={`${small} text-sense-blue hover:bg-sense-blue/10`}>
            <Icon name="edit" size={13} /> Edit
          </button>
          <button
            type="button"
            title="Turn this into versions for Instagram, Facebook, TikTok or your blog"
            onClick={onAdapt}
            className={`${small} text-sense-blue hover:bg-sense-blue/10`}
          >
            <Icon name="repeat" size={13} /> Adapt
          </button>
          <AddToCalendar compact title={item.title} text={item.text} getSavedId={() => item.id} />
          <button
            type="button"
            title="Delete from My Content"
            onClick={() =>
              window.confirm(
                scheduled.length
                  ? `Delete "${item.title}" from My Content? It stays on your calendar.`
                  : `Delete "${item.title}" from My Content?`,
              ) && removeItem(item.id)
            }
            className={`${small} text-[#4b5d60] hover:bg-[#ff7f7f]/15 hover:text-[#b84f4f]`}
          >
            <Icon name="trash" size={13} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MyContentPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { posts, removePost, updatePost } = useCalendar();
  const today = useToday();
  const [editing, setEditing] = useState(null); // calendar post open in the edit pop-up
  const [adapting, setAdapting] = useState(null); // saved item open in the Adapt pop-up
  const { saved, loaded } = useContentStore();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [openId, setOpenId] = useState(null);

  // A post scheduled from a saved item is shown on that item's card (as a "Scheduled"
  // tag), not as a second card. Only calendar posts on their own get a card.
  const savedIds = new Set(saved.map((i) => i.id));
  const scheduledFor = (id) => posts.filter((p) => p.savedId === id);
  const planned = posts
    .filter((p) => !(p.savedId && savedIds.has(p.savedId)))
    .map((p) => ({ ...p, type: PLANNED, text: p.caption ?? "", planned: true }));
  const items = [...saved, ...planned].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const ready = loaded && hydrated;
  const count = (t) => (t === "All" ? items.length : items.filter((i) => i.type === t).length);
  const types = ["All", ...new Set(items.map((i) => i.type))];
  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) =>
      (type === "All" || i.type === type) &&
      (!q || `${i.title} ${i.text} ${i.trend ?? ""} ${i.planned ? `${channelsOf(i).join(" ")} ${i.format}` : ""}`.toLowerCase().includes(q)),
  );

  // "Change details" edits the post right here, in the same pop-up the calendar uses.
  const editPost = (item) => setEditing(posts.find((p) => p.id === item.id) ?? null);
  const writePost = (item) => {
    const creator = ["Video", "Reel"].includes(item.format) ? "video" : "social";
    saveContentTrend(
      { name: item.title, audience: "", platform: channelLabel(item), format: item.format, hook: item.text },
      {
        source: "calendar",
        path: `/content-creation/${creator}`,
        returnTo: { href: "/content-creation/my-content", label: "Back to My Content" },
      },
    );
    router.push(`/content-creation/${creator}`);
  };
  const removePlanned = (item) => {
    if (window.confirm(`Remove "${item.title}" from your content calendar?`)) removePost(item.id);
  };

  return (
    <div className="w-full">
      <PageHeading
        title="My Content"
        description="Everything you've saved from Content Creation and planned in your calendar. Saved to your workspace."
        action={
          <Link
            href="/content-creation/improve"
            className="inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[22px] bg-sense-lime px-[18px] text-xs font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition duration-150 hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)]"
          >
            <Icon name="upload" size={16} />
            Upload
          </Link>
        }
      />

      <label className="mb-2.5 flex min-h-11 items-center gap-2.5 rounded-xl border border-paper/55 bg-paper/95 px-3.5 text-sense-blue">
        <Icon name="search" size={17} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your content"
          aria-label="Search your content"
          className="h-11 w-full bg-transparent text-xs text-sense-navy outline-none placeholder:text-[#6f7f82]"
        />
      </label>

      <div className="mb-3.5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-[7px]">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === type}
              onClick={() => setType(t)}
              className={`min-h-7 cursor-pointer rounded-2xl border px-3.5 text-xs font-bold transition-colors ${
                t === type ? "border-sense-blue bg-sense-blue text-paper" : "border-paper/50 bg-paper/90 text-sense-navy hover:bg-paper"
              }`}
            >
              {t} {ready && <span className="font-normal opacity-75">({count(t)})</span>}
            </button>
          ))}
        </div>
        <span className="text-[13px] whitespace-nowrap text-paper/85">
          {ready ? `${shown.length} ${shown.length === 1 ? "item" : "items"}` : "Loading…"}
        </span>
      </div>

      {!ready ? (
        <div role="status" aria-label="Loading your saved content" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-2.5 rounded-[18px] bg-paper/95 p-[17px]">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : shown.length ? (
        <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((item) =>
            item.planned ? (
              <PlannedCard
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
                onEdit={() => editPost(item)}
                onWrite={() => writePost(item)}
                onRemove={() => removePlanned(item)}
              />
            ) : (
              <SavedCard
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
                onAdapt={() => setAdapting(item)}
                scheduled={scheduledFor(item.id)}
                onEditScheduled={(p) => setEditing(p)}
              />
            ),
          )}
        </div>
      ) : (
        <div className="grid min-h-[340px] place-items-center content-center gap-2 rounded-[18px] border border-dashed border-paper/55 bg-paper/10 px-4 text-center text-paper">
          <Icon name="content" size={24} />
          <strong className="text-sm">{items.length ? "Nothing matches your search" : "No content yet"}</strong>
          <p className="text-[13px] text-paper/80">
            {items.length
              ? "Try another word or filter."
              : "Generate something in Content Creation and press Save, or plan posts in your Content Calendar."}
          </p>
          {!items.length && (
            <Link href="/content-creation" className="mt-2 text-[13px] font-bold text-sense-lime underline-offset-2 hover:underline">
              Go to Content Creation
            </Link>
          )}
        </div>
      )}

      {adapting && <AdaptDialog source={adapting.text} title={adapting.title} onClose={() => setAdapting(null)} />}

      {editing && today && (
        <PostEditor
          key={editing.id}
          post={editing}
          today={today}
          onClose={() => setEditing(null)}
          onSave={(fields) => {
            updatePost(editing.id, fields);
            setEditing(null);
          }}
          onDelete={() => {
            removePost(editing.id);
            setEditing(null);
          }}
          onWrite={(fields) => {
            updatePost(editing.id, fields);
            setEditing(null);
            writePost({ ...editing, ...fields, text: fields.caption });
          }}
        />
      )}
    </div>
  );
}
