"use client";

// My Content (saved_content) and the content calendar (calendar_posts), kept in
// Supabase per workspace. One shared in-memory copy feeds every component; changes
// show right away and are written to Supabase in the background (undone if the
// write fails). AccountProvider connects the store once the workspace is known.

import { useSyncExternalStore } from "react";
import { POST_FORMATS } from "./calendarOptions";

// localStorage keys from before accounts existed. Imported once, then removed.
const LEGACY_SAVED = "trendtracker:saved-content";
const LEGACY_CALENDAR = "trendtracker:calendar";

const EMPTY = Object.freeze({ loaded: false, saved: [], calendar: [] });
let snapshot = EMPTY;
let conn = null; // { supabase, workspaceId, userId }
const listeners = new Set();

function set(patch) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((fn) => fn());
}
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

/** The whole store: { loaded, saved, calendar }. */
export const useContentStore = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

// ---- Row mapping --------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idOf = (id) => (typeof id === "string" && UUID.test(id) ? id : crypto.randomUUID());
const KINDS = ["social", "video", "blog", "ad", "edit", "improve", "repurpose", "upload", "campaign"];

/** "9:30 PM" -> "21:30"; null if it isn't a time. */
function to24h(label) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label ?? "");
  if (!m) return null;
  const h = (Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}
/** "21:30:00" -> "9:30 PM". */
function to12h(time) {
  if (!time) return "9:00 AM";
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const savedFromRow = (r) => ({
  id: r.id,
  kind: r.kind,
  type: r.type,
  title: r.title,
  text: r.body,
  trend: r.source_trend,
  createdAt: Date.parse(r.created_at),
});

const savedToRow = (item) => ({
  id: idOf(item.id),
  workspace_id: conn.workspaceId,
  created_by: conn.userId,
  kind: KINDS.includes(item.kind) ? item.kind : "upload",
  type: String(item.type || "Content").slice(0, 60),
  title: String(item.title || "Untitled").slice(0, 120),
  body: String(item.text ?? ""),
  source_trend: item.trend ?? null,
  ...(item.createdAt ? { created_at: new Date(item.createdAt).toISOString() } : {}),
});

const postFromRow = (r) => ({
  id: r.id,
  date: r.scheduled_date,
  time: to12h(r.scheduled_time),
  channels: r.channels,
  format: r.format,
  title: r.title,
  caption: r.caption,
  createdAt: Date.parse(r.created_at),
});

function postFields(p) {
  const channels = Array.isArray(p.channels) && p.channels.length ? p.channels : p.channel ? [p.channel] : ["Instagram"];
  return {
    scheduled_date: p.date,
    scheduled_time: to24h(p.time),
    channels,
    format: POST_FORMATS.includes(p.format) ? p.format : "Image",
    title: String(p.title ?? "").slice(0, 120),
    caption: String(p.caption ?? ""),
  };
}

const postToRow = (p) => ({
  id: idOf(p.id),
  workspace_id: conn.workspaceId,
  created_by: conn.userId,
  ...postFields(p),
  ...(p.createdAt ? { created_at: new Date(p.createdAt).toISOString() } : {}),
});

const minutes = (time) => {
  const t = to24h(time);
  return t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : 0;
};
export const byDateTime = (a, b) => a.date.localeCompare(b.date) || minutes(a.time) - minutes(b.time);

// ---- Loading ------------------------------------------------------------------

function readLegacy(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
function dropLegacy(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Copies what this browser saved before accounts into the workspace, then forgets it. */
async function importLegacy() {
  const saved = readLegacy(LEGACY_SAVED);
  if (saved) {
    const rows = saved.filter((i) => i && typeof i === "object").map(savedToRow);
    const { error } = rows.length
      ? await conn.supabase.from("saved_content").upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      : { error: null };
    if (error) console.error("Importing My Content failed:", error.message);
    else dropLegacy(LEGACY_SAVED);
  }
  const calendar = readLegacy(LEGACY_CALENDAR);
  if (calendar) {
    const rows = calendar.filter((p) => p && /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "")).map(postToRow);
    const { error } = rows.length
      ? await conn.supabase.from("calendar_posts").upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      : { error: null };
    if (error) console.error("Importing the calendar failed:", error.message);
    else dropLegacy(LEGACY_CALENDAR);
  }
}

async function reload() {
  if (!conn) return;
  const { supabase, workspaceId } = conn;
  const [saved, calendar] = await Promise.all([
    supabase.from("saved_content").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(500),
    supabase.from("calendar_posts").select("*").eq("workspace_id", workspaceId).order("scheduled_date").limit(2000),
  ]);
  if (conn?.workspaceId !== workspaceId) return; // switched account meanwhile
  if (saved.error) console.error("Loading My Content failed:", saved.error.message);
  if (calendar.error) console.error("Loading the calendar failed:", calendar.error.message);
  set({
    loaded: true,
    saved: (saved.data ?? []).map(savedFromRow),
    calendar: (calendar.data ?? []).map(postFromRow).sort(byDateTime),
  });
}

let connecting = null; // { key, promise }: one load at a time per account

/** Called by AccountProvider after sign-in. Loads (and imports old browser data) fresh. */
export function connectContentStore(supabase, workspaceId, userId) {
  const key = `${workspaceId}:${userId}`;
  if (connecting?.key === key) return connecting.promise;
  if (conn && `${conn.workspaceId}:${conn.userId}` !== key) snapshot = EMPTY; // different account
  conn = { supabase, workspaceId, userId };
  const promise = (async () => {
    await importLegacy();
    await reload();
  })().finally(() => {
    if (connecting?.promise === promise) connecting = null;
  });
  connecting = { key, promise };
  return promise;
}

/** Runs a write; on failure, logs it and reloads what's really saved. */
async function write(label, run) {
  const { error } = await run(conn.supabase);
  if (error) {
    console.error(`${label} failed:`, error.message);
    await reload();
  }
}

// ---- My Content ---------------------------------------------------------------

/** Saved items, newest first: [{ id, kind, type, title, text, trend, createdAt }]. */
export const listSaved = () => snapshot.saved;

/** Calendar posts, soonest first (for code outside React, e.g. the assistant). */
export const listCalendar = () => snapshot.calendar;

/** Adds an item; returns it (with id) right away, or null when not signed in yet. */
export function saveItem(item) {
  if (!conn) return null;
  const row = savedToRow({ ...item, id: undefined, createdAt: Date.now() });
  const entry = savedFromRow({ ...row, created_at: row.created_at });
  set({ saved: [entry, ...snapshot.saved] });
  write("Saving to My Content", (db) => db.from("saved_content").insert(row));
  return entry;
}

export function removeItem(id) {
  if (!conn) return;
  set({ saved: snapshot.saved.filter((i) => i.id !== id) });
  write("Deleting from My Content", (db) => db.from("saved_content").delete().eq("id", id));
}

/** Calls `fn(items)` whenever saved content changes. Returns unsubscribe. */
export function onSavedChange(fn) {
  let last = snapshot.saved;
  return subscribe(() => {
    if (snapshot.saved !== last) fn((last = snapshot.saved));
  });
}

// ---- Calendar -----------------------------------------------------------------

export function addPosts(items) {
  if (!conn || !items.length) return;
  const rows = items.map((p) => postToRow({ ...p, createdAt: Date.now() }));
  set({ calendar: [...snapshot.calendar, ...rows.map(postFromRow)].sort(byDateTime) });
  write("Adding to the calendar", (db) => db.from("calendar_posts").insert(rows));
}

export function removePost(id) {
  if (!conn) return;
  set({ calendar: snapshot.calendar.filter((p) => p.id !== id) });
  write("Removing from the calendar", (db) => db.from("calendar_posts").delete().eq("id", id));
}

export function updatePost(id, patch) {
  if (!conn) return;
  const cur = snapshot.calendar.find((p) => p.id === id);
  if (!cur) return;
  const merged = { ...cur, ...patch };
  const fields = postFields(merged);
  set({ calendar: snapshot.calendar.map((p) => (p.id === id ? postFromRow({ ...fields, id, created_at: new Date(cur.createdAt).toISOString() }) : p)).sort(byDateTime) });
  write("Updating the calendar", (db) =>
    db.from("calendar_posts").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id),
  );
}
