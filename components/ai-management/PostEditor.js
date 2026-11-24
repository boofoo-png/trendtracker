"use client";

// Pop-up for adding a post to a calendar day (or editing one). Opens when a day in
// the calendar is clicked; Done saves it to that date.

import { useEffect, useId, useRef, useState } from "react";
import { CHANNEL_CODES, channelsOf, toISODate } from "@/lib/calendar";
import { POST_FORMATS, POST_TIMES } from "@/lib/calendarOptions";
import { lockScroll } from "@/lib/scrollLock";

const CHANNELS = Object.keys(CHANNEL_CODES);

const field =
  "w-full min-h-10 rounded-[9px] border border-sense-blue/20 bg-white/80 px-3 py-[9px] text-xs text-sense-navy outline-none placeholder:text-[#6f7f82] focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)]";
const labelText = "text-[13px] font-semibold text-[#3d5053]";

const longDate = (iso) =>
  new Date(`${iso}T00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

/**
 * post: an existing post to edit, or { date } for a new one.
 * onSave(fields) gets { date, time, channel, format, title, caption }.
 */
export default function PostEditor({ post, today, onSave, onClose, onDelete, onWrite }) {
  const id = useId();
  const titleRef = useRef(null);
  const editing = Boolean(post.id);
  const [f, setF] = useState({
    date: post.date,
    time: post.time ?? "9:00 AM",
    channels: post.id ? channelsOf(post) : ["Instagram"],
    format: post.format ?? "Image",
    title: post.title ?? "",
    caption: post.caption ?? "",
  });
  const [tried, setTried] = useState(false);
  const set = (key) => (e) => setF((v) => ({ ...v, [key]: e.target.value }));

  // Focus the title, close on Escape, keep the page from scrolling behind.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, []);

  const minDate = editing ? undefined : toISODate(today);
  const titleMissing = !f.title.trim();
  const noChannel = f.channels.length === 0;
  const toggleChannel = (c) =>
    setF((v) => ({ ...v, channels: v.channels.includes(c) ? v.channels.filter((x) => x !== c) : CHANNELS.filter((x) => x === c || v.channels.includes(x)) }));
  const dateMissing = !/^\d{4}-\d{2}-\d{2}$/.test(f.date);

  /** The form's values if they're valid, else null (and the problems are shown). */
  const valid = () => {
    setTried(true);
    if (titleMissing || dateMissing) {
      titleRef.current?.focus();
      return null;
    }
    if (noChannel) return null;
    // `channel: undefined` clears the single-channel field older posts used.
    return { ...f, channel: undefined, title: f.title.trim().slice(0, 120), caption: f.caption.trim().slice(0, 2200) };
  };

  const submit = (e) => {
    e.preventDefault();
    const fields = valid();
    if (fields) onSave(fields);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" tabIndex={-1} aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-sense-navy/45 backdrop-blur-[2px]" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-heading`}
        onSubmit={submit}
        className="relative grid max-h-[calc(100vh-32px)] w-full max-w-[460px] gap-4 overflow-y-auto rounded-[22px] bg-paper p-5 text-sense-navy shadow-[0_24px_60px_rgba(0,31,62,0.35)] sm:p-6"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#4b5d60]">{editing ? "Edit post" : "New post"}</p>
            <h2 id={`${id}-heading`} className="text-lg font-bold text-sense-blue">
              {dateMissing ? "Choose a date" : longDate(f.date)}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 cursor-pointer place-items-center rounded-full text-2xl leading-none text-sense-blue hover:bg-sense-blue/10">
            ×
          </button>
        </header>

        <label className="grid gap-1.5">
          <span className={labelText}>Title</span>
          <input
            ref={titleRef}
            value={f.title}
            onChange={set("title")}
            maxLength={120}
            placeholder="e.g. Behind the scenes: our new roast"
            aria-invalid={tried && titleMissing}
            className={`${field} ${tried && titleMissing ? "border-[#b84f4f]" : ""}`}
          />
          {tried && titleMissing && <span role="alert" className="text-[13px] font-semibold text-[#b84f4f]">Give the post a title.</span>}
        </label>

        <fieldset className="grid gap-1.5">
          <legend className={`${labelText} mb-1.5`}>
            Channels <span className="font-normal text-[#6f7f82]">(pick one or more)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={f.channels.includes(c)}
                onClick={() => toggleChannel(c)}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition ${
                  f.channels.includes(c) ? "border-sense-blue bg-sense-blue text-paper" : "border-sense-blue/20 bg-white/70 text-sense-blue hover:bg-sense-blue/10"
                }`}
              >
                {f.channels.includes(c) && <span aria-hidden="true">✓</span>}
                {c}
              </button>
            ))}
          </div>
          {tried && noChannel && <span role="alert" className="text-[13px] font-semibold text-[#b84f4f]">Pick at least one channel.</span>}
        </fieldset>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="col-span-2 grid gap-1.5 sm:col-span-1">
            <span className={labelText}>Date</span>
            <input type="date" value={f.date} min={minDate} onChange={set("date")} className={field} />
          </label>
          <label className="grid gap-1.5">
            <span className={labelText}>Time</span>
            <select value={f.time} onChange={set("time")} className={`${field} cursor-pointer`}>
              {(POST_TIMES.includes(f.time) ? POST_TIMES : [f.time, ...POST_TIMES]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className={labelText}>Format</span>
            <select value={f.format} onChange={set("format")} className={`${field} cursor-pointer`}>
              {POST_FORMATS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className={labelText}>
            Caption <span className="font-normal text-[#6f7f82]">(optional)</span>
          </span>
          <textarea
            value={f.caption}
            onChange={set("caption")}
            rows={4}
            maxLength={2200}
            placeholder="What will the post say? You can also write it later in Content Creation."
            className={`${field} min-h-[96px] resize-y leading-normal`}
          />
        </label>

        {onWrite && (
          <button
            type="button"
            onClick={() => {
              const fields = valid();
              if (fields) onWrite(fields);
            }}
            className="flex items-center justify-between gap-3 rounded-xl border border-sense-blue/15 bg-white/70 px-4 py-3 text-left transition hover:border-sense-blue/40 hover:bg-white"
          >
            <span>
              <strong className="flex items-center gap-1.5 text-xs text-sense-blue">✦ {f.caption.trim() ? "Rewrite the caption with AI" : "Write the caption with AI"}</strong>
              <span className="text-[13px] text-[#4b5d60]">Saves your changes, then opens Content Creation where Sense AI drafts this post for you.</span>
            </span>
            <span aria-hidden="true" className="text-lg text-sense-blue">›</span>
          </button>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {editing && onDelete ? (
            <button type="button" onClick={onDelete} className="cursor-pointer rounded-[18px] px-3 py-2 text-[13px] font-bold text-[#b84f4f] transition hover:bg-[#ff7f7f]/15">
              Delete post
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="min-h-[40px] cursor-pointer rounded-[20px] border border-sense-blue/25 px-4 text-[13px] font-bold text-sense-blue transition hover:bg-sense-blue/10">
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] cursor-pointer rounded-[20px] bg-sense-lime px-6 text-[13px] font-extrabold uppercase text-sense-navy shadow-[0_4px_0_rgba(0,31,62,0.17)] transition hover:translate-y-px"
            >
              Done
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
