"use client";

import useStored from "./useStored";

export const SETTINGS_KEY = "trendtracker:settings";

/** Fired by links to /settings#section so an already-open Settings page switches tab. */
export const SECTION_EVENT = "trendtracker:settings-section";
export const openSettingsSection = (id) =>
  window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: id }));

export const INDUSTRIES = ["Hospitality and Tourism", "Wholesale", "Retail", "Food and Beverage", "Other"];
export const TIMEZONES = ["Pacific Time (PT)", "Mountain Time (MT)", "Central Time (CT)", "Eastern Time (ET)"];

export const ALERT_TYPES = [
  ["competitor", "Competitor campaign alerts", "When a watched competitor launches a new campaign."],
  ["trends", "Trend spike alerts", "When a relevant topic gains unusual momentum."],
  ["reports", "Scheduled report reminders", "Before a recurring report is generated and shared."],
  ["planner", "Content calendar reminders", "When a planned post is coming up in your calendar."],
];

export const DEFAULT_SETTINGS = {
  name: "",
  role: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  industry: INDUSTRIES[0],
  timezone: TIMEZONES[0],
  alerts: { competitor: true, trends: true, reports: false, planner: true },
};

export function useSettings() {
  const [stored, setStored] = useStored(SETTINGS_KEY, DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...stored, alerts: { ...DEFAULT_SETTINGS.alerts, ...stored?.alerts } };
  return [settings, setStored];
}

export function initials(text, fallback = "SS") {
  const parts = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
