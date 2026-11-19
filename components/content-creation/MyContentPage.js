"use client";

// Library of content saved from the Content Creation screens (this browser only).

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { listSaved, onSavedChange, removeItem } from "@/lib/savedContent";
import Skeleton from "@/components/ui/Skeleton";
import { CopyButton, PageHeading } from "./ui";

const CARD_STYLE = {
  "Social post": "bg-[linear-gradient(145deg,var(--color-sense-blue),#167181)] text-paper",
  "Blog post": "bg-[linear-gradient(145deg,#f8f8f1,#e9efdf)] text-sense-navy",
};
const DEFAULT_STYLE = "bg-[linear-gradient(145deg,var(--color-sense-lime),#efffae)] text-sense-navy";

function SavedCard({ item, open, onToggle }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[18px] border border-paper/70 bg-paper/95 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_15px_25px_rgba(0,31,62,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.19),0_18px_30px_rgba(0,31,62,0.14)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex min-h-[118px] w-full cursor-pointer flex-col items-start justify-center p-[17px] text-left ${CARD_STYLE[item.type] ?? DEFAULT_STYLE}`}
      >
        <span className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.08em]">{item.type}</span>
        <strong className="line-clamp-3 text-[13px] leading-tight">{item.title}</strong>
      </button>
      {open && (
        <p className="max-h-[260px] overflow-y-auto border-b border-sense-blue/10 px-3.5 py-3 text-[11px] leading-[1.55] whitespace-pre-line text-[#41585c]">
          {item.text}
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3.5 pt-3 pb-3.5">
        <span className="truncate text-[9px] font-extrabold uppercase text-sense-blue">
          {item.trend ? `Trend: ${item.trend}` : "No trend"}
        </span>
        <div className="row-span-2 flex items-center gap-1">
          <CopyButton text={item.text} />
          <button
            type="button"
            title="Delete"
            aria-label="Delete"
            onClick={() => removeItem(item.id)}
            className="cursor-pointer rounded px-1 text-base leading-none text-[#708083] transition-colors hover:text-coral-400"
          >
            ×
          </button>
        </div>
        <small className="mt-1 text-[10px] text-[#708083]">
          {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </small>
      </div>
    </article>
  );
}

export default function MyContentPage() {
  const [loaded, setLoaded] = useState(null); // null until read from this browser
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    // localStorage is only available after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(listSaved());
    return onSavedChange(setLoaded);
  }, []);

  const items = loaded ?? [];
  const types = ["All", ...new Set(items.map((i) => i.type))];
  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) => (type === "All" || i.type === type) && (!q || `${i.title} ${i.text} ${i.trend ?? ""}`.toLowerCase().includes(q)),
  );

  return (
    <div className="w-full">
      <PageHeading
        title="My Content"
        description="Everything you've saved from Content Creation. Saved in this browser only."
        action={
          <Link
            href="/content-creation/upload"
            className="inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[22px] bg-sense-lime px-[18px] text-[10px] font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition duration-150 hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)]"
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
          className="h-11 w-full bg-transparent text-xs text-sense-navy outline-none placeholder:text-[#8a9799]"
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
              className={`min-h-7 cursor-pointer rounded-2xl border px-3.5 text-[10px] font-bold transition-colors ${
                t === type ? "border-sense-blue bg-sense-blue text-paper" : "border-paper/50 bg-paper/90 text-sense-navy hover:bg-paper"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-[11px] whitespace-nowrap text-paper/85">
          {loaded ? `${shown.length} ${shown.length === 1 ? "item" : "items"}` : "Loading…"}
        </span>
      </div>

      {!loaded ? (
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
          {shown.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-[340px] place-items-center content-center gap-2 rounded-[18px] border border-dashed border-paper/55 bg-paper/10 px-4 text-center text-paper">
          <Icon name="content" size={24} />
          <strong className="text-sm">{items.length ? "Nothing matches your search" : "No saved content yet"}</strong>
          <p className="text-[11px] text-paper/80">
            {items.length ? "Try another word or filter." : "Generate something in Content Creation and press Save."}
          </p>
          {!items.length && (
            <Link href="/content-creation" className="mt-2 text-[11px] font-bold text-sense-lime underline-offset-2 hover:underline">
              Go to Content Creation
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
