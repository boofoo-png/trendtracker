"use client";

// Planned posts from AI Management, kept in this browser until there's a database.
// [{ id, date: "YYYY-MM-DD", time, channel, format, title, caption, createdAt }]

import { useSyncExternalStore } from "react";
import useStored from "./useStored";

export const CALENDAR_KEY = "trendtracker:calendar";
const EMPTY = [];

export const CHANNEL_CODES = { Instagram: "IG", TikTok: "TT", YouTube: "YT" };

export const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromISODate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const minutes = (time) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time ?? "");
  if (!m) return 0;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
};

export const byDateTime = (a, b) => a.date.localeCompare(b.date) || minutes(a.time) - minutes(b.time);

export function useCalendar() {
  const [posts, setPosts] = useStored(CALENDAR_KEY, EMPTY);
  const list = Array.isArray(posts) ? posts : EMPTY;
  return {
    posts: list,
    addPosts: (items) =>
      setPosts((cur) =>
        [...(Array.isArray(cur) ? cur : []), ...items.map((p) => ({ ...p, id: crypto.randomUUID(), createdAt: Date.now() }))].sort(byDateTime),
      ),
    removePost: (id) => setPosts((cur) => (Array.isArray(cur) ? cur : []).filter((p) => p.id !== id)),
  };
}

// Today's date, read only in the browser: with cacheComponents, Next.js prerenders
// client components and doesn't allow reading the current time there.
let todayCache = null;
const getToday = () => {
  const iso = toISODate(new Date());
  if (todayCache?.iso !== iso) todayCache = { iso, date: fromISODate(iso) };
  return todayCache.date;
};
const noSubscribe = () => () => {};

/** Today at midnight in the browser, or null during server rendering. */
export const useToday = () => useSyncExternalStore(noSubscribe, getToday, () => null);

/** Posts from `today` onwards, soonest first. */
export function upcoming(posts, today) {
  if (!today) return [];
  const from = toISODate(today);
  return posts.filter((p) => p.date >= from).sort(byDateTime);
}
