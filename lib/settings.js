"use client";

import { useAccount, TIMEZONE_ZONES } from "./account";
import { CUSTOMER_TYPES, INDUSTRIES, NOT_SET, cleanBusiness } from "./business";

export { CUSTOMER_TYPES, INDUSTRIES };

/** Fired by links to /settings#section so an already-open Settings page switches tab. */
export const SECTION_EVENT = "trendtracker:settings-section";
export const openSettingsSection = (id) =>
  window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: id }));

export const TIMEZONES = Object.keys(TIMEZONE_ZONES);

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
  industry: NOT_SET,
  customers: NOT_SET,
  description: "",
  keywords: "",
  timezone: TIMEZONES[0],
  alerts: { competitor: true, trends: true, reports: false, planner: true },
};

/**
 * [settings, saveSettings, loaded]: the profile + workspace from Supabase.
 * saveSettings(next) resolves to { error?, emailPending? }.
 */
export function useSettings() {
  const { settings: stored, saveSettings, loaded } = useAccount();
  const settings = { ...DEFAULT_SETTINGS };
  for (const [k, v] of Object.entries(stored)) if (v != null) settings[k] = v;
  settings.alerts = { ...DEFAULT_SETTINGS.alerts, ...stored.alerts };
  if (!INDUSTRIES.includes(settings.industry)) settings.industry = NOT_SET;
  if (!CUSTOMER_TYPES.includes(settings.customers)) settings.customers = NOT_SET;
  if (!TIMEZONES.includes(settings.timezone)) settings.timezone = TIMEZONES[0];
  return [settings, saveSettings, loaded];
}

/** The business profile to send with AI requests (see lib/business.js). */
export function useBusiness() {
  const [settings] = useSettings();
  return cleanBusiness(settings);
}

export function initials(text, fallback = "SS") {
  const parts = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
