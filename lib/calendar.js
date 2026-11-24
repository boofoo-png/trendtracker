"use client";

// The content calendar: planned posts from AI Management and the post editor.
// Stored in Supabase per workspace (calendar_posts); see lib/contentStore.js.
// [{ id, date: "YYYY-MM-DD", time: "9:30 AM", channels, format, title, caption, createdAt }]

import { useSyncExternalStore } from "react";
import { addPosts, byDateTime, removePost, updatePost, useContentStore } from "./contentStore";
import { addDays, fromISODate, toISODate } from "./calendarDates";

export { addDays, byDateTime, fromISODate, toISODate };

export { PLATFORM_CODES as CHANNEL_CODES } from "./platforms"; // Instagram, Facebook, TikTok

/** A post's channels. A post can go to several; older posts and AI plans store one `channel`. */
export const channelsOf = (p) =>
  Array.isArray(p?.channels) && p.channels.length ? p.channels : p?.channel ? [p.channel] : [];
/** "Instagram", or "Instagram & TikTok". */
export const channelLabel = (p) => channelsOf(p).join(" & ");

export function useCalendar() {
  const { calendar, loaded } = useContentStore();
  return { posts: calendar, loaded, addPosts, removePost, updatePost };
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
