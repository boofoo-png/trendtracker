"use client";

// Profile and settings, based on the Marketing Intelligence Hub Figma Make app.
// Saved to Supabase (profiles + workspaces, see lib/account.js). The company name
// shows in the top bar; alert toggles control what the bell lists.

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Eyebrow, PageTitle, Panel } from "@/components/ui/Dashboard";
import Skeleton, { SkeletonPanel } from "@/components/ui/Skeleton";
import { signOut } from "@/app/actions/auth";
import ConnectionsSection from "./ConnectionsSection";
import { Select, TextArea, TextInput } from "@/components/content-creation/ui";
import { ALERT_TYPES, CUSTOMER_TYPES, INDUSTRIES, SECTION_EVENT, TIMEZONES, initials, useSettings } from "@/lib/settings";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: "audience" },
  { id: "workspace", label: "Workspace", icon: "content" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "connections", label: "Connected accounts", icon: "instagram" },
];

const fullName = (s) => `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim();

const sectionFromHash = () => {
  const id = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return SECTIONS.some((s) => s.id === id) ? id : "profile";
};

function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full px-1.5 pr-3 text-[11px] font-bold transition-colors ${
        on ? "bg-sense-blue text-paper" : "bg-[#dce5d1] text-sense-navy"
      }`}
    >
      <span
        className={`size-5 rounded-full shadow transition-transform ${on ? "translate-x-0 bg-sense-lime" : "bg-paper"}`}
      />
      {on ? "On" : "Off"}
    </button>
  );
}

function SectionHeading({ eyebrow, title, aside }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b border-sense-blue/15 pb-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-lg font-bold text-sense-blue">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings, loaded] = useSettings();
  const [draft, setDraft] = useState(null); // unsaved edits; null = none
  const [section, setSection] = useState("profile");
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { error } | { info } after a save

  // Follow the URL hash (#workspace, #notifications) and links from the top bar.
  useEffect(() => {
    const sync = (e) => setSection(e?.detail ?? sectionFromHash());
    sync(); // read the hash after mount so server and client markup match
    window.addEventListener("hashchange", sync);
    window.addEventListener(SECTION_EVENT, sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener(SECTION_EVENT, sync);
    };
  }, []);

  const values = draft ?? settings;
  const dirty = draft !== null;
  const update = (patch) => {
    setJustSaved(false);
    setDraft((d) => ({ ...(d ?? settings), ...patch }));
  };
  const field = (key) => ({ value: values[key], onChange: (v) => update({ [key]: v }) });

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setNotice(null);
    const res = await setSettings(draft);
    setSaving(false);
    if (res.error) {
      setNotice({ error: `Couldn't save: ${res.error}` });
      return; // keep the draft so nothing typed is lost
    }
    setDraft(null);
    setJustSaved(true);
    if (res.emailPending) setNotice({ info: "Check your new inbox: the email address changes once you confirm it." });
  };

  const go = (id) => {
    setSection(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="w-full">
      <PageTitle
        eyebrow="Account and workspace"
        title="Profile and settings"
        description="Manage your personal details, workspace preferences and alerts. Saved to your account."
      >
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="min-h-[42px] cursor-pointer rounded-[22px] border border-paper/40 px-4 text-[11px] font-bold text-paper transition hover:bg-paper/15"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[22px] bg-sense-lime px-[18px] text-[10px] font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)] disabled:cursor-default disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {saving ? "Saving…" : justSaved && !dirty ? "✓ Changes saved" : "Save changes"}
          </button>
        </div>
      </PageTitle>

      {!loaded ? (
        <div className="grid gap-[18px] lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="grid justify-items-center gap-2 self-start rounded-[22px] bg-paper/95 p-6">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <SkeletonPanel lines={5} />
        </div>
      ) : (
      <div className="grid gap-[18px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <Panel as="aside" className="self-start">
          <div className="grid justify-items-center gap-1 border-b border-sense-blue/15 pb-5 text-center">
            <span className="mb-2 grid size-16 place-items-center rounded-full bg-sense-blue text-lg font-bold text-paper">
              {initials(fullName(settings) || settings.company)}
            </span>
            <strong className="text-sm">{fullName(settings) || "Your name"}</strong>
            <p className="text-[11px] text-[#5f706e]">{settings.role || "Add your role"}</p>
            <span className="text-[11px] font-semibold text-sense-blue">{settings.company || "Your company"}</span>
          </div>
          <nav aria-label="Settings sections" className="mt-4 grid gap-1.5">
            {SECTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                aria-current={section === id ? "page" : undefined}
                onClick={() => go(id)}
                className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold transition-colors ${
                  section === id ? "bg-sense-blue text-paper" : "text-sense-blue hover:bg-sense-blue/10"
                }`}
              >
                <Icon name={icon} size={17} />
                <span className="flex-1">{label}</span>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </nav>
          <form action={signOut} className="mt-4 border-t border-sense-blue/15 pt-4">
            <button
              type="submit"
              className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-sense-blue/20 px-3 text-xs font-semibold text-sense-blue transition-colors hover:bg-sense-blue/10"
            >
              Sign out
            </button>
          </form>
        </Panel>

        <Panel>
          {section === "profile" && (
            <>
              <SectionHeading
                eyebrow="Personal details"
                title="Your profile"
                aside={
                  <span className="grid size-10 place-items-center rounded-full bg-sense-blue text-xs font-bold text-paper">
                    {initials(fullName(values) || values.company)}
                  </span>
                }
              />
              <div className="grid gap-x-5 sm:grid-cols-2">
                <TextInput label="First name" placeholder="e.g. Alex" autoComplete="given-name" {...field("firstName")} />
                <TextInput label="Last name" placeholder="e.g. Chen" autoComplete="family-name" {...field("lastName")} />
                <TextInput label="Role at company" placeholder="e.g. Marketing Manager" autoComplete="organization-title" {...field("role")} />
                <TextInput label="Email address" type="email" placeholder="you@company.com" autoComplete="email" {...field("email")} />
                <TextInput label="Phone number" type="tel" placeholder="604-555-0100" autoComplete="tel" {...field("phone")} />
              </div>
            </>
          )}

          {section === "workspace" && (
            <>
              <SectionHeading eyebrow="Company details" title="Workspace profile" />
              <div className="grid gap-x-5 sm:grid-cols-2">
                <TextInput label="Company name" placeholder="Shown in the top bar" autoComplete="organization" {...field("company")} />
                <TextInput label="Website" placeholder="yourcompany.com" autoComplete="url" {...field("website")} />
                <Select label="Industry" options={INDUSTRIES} {...field("industry")} />
                <Select label="Who are your customers?" options={CUSTOMER_TYPES} {...field("customers")} />
                <TextArea
                  className="sm:col-span-2"
                  rows={3}
                  label="What does your business do?"
                  placeholder="e.g. We roast small-batch coffee and sell beans online and to local cafés."
                  {...field("description")}
                />
                <TextInput
                  label="Keywords that describe your business (comma-separated)"
                  placeholder="e.g. coffee, espresso, sustainable, local"
                  {...field("keywords")}
                />
                <Select label="Timezone" options={TIMEZONES} {...field("timezone")} />
              </div>
              <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-sense-lime/40 p-3.5 text-sense-navy">
                <Icon name="sparkles" size={18} className="mt-0.5 shrink-0" />
                <p className="text-[11px] leading-[1.5]">
                  <strong className="block text-xs">Sense AI uses these details</strong>
                  Audience suggestions, hashtags, trend fit, campaign directions, content and posting
                  plans are all written for the business you describe here. Keywords also shape the
                  fit score on scraped trends.
                </p>
              </div>
              <div className="mt-2 flex items-start gap-2.5 rounded-xl bg-[#e3eadd] p-3.5 text-sense-blue">
                <Icon name="trend" size={18} className="mt-0.5 shrink-0" />
                <p className="grid gap-1 text-[11px] leading-[1.5] text-[#5f706e]">
                  <strong className="text-xs text-sense-blue">Trend sources</strong>
                  Audience trends are scraped from public Instagram and TikTok posts. Account
                  connections for publishing aren&apos;t available yet.
                </p>
              </div>
            </>
          )}

          {section === "connections" && (
            <>
              <SectionHeading eyebrow="Facebook and Instagram" title="Connected accounts" />
              <ConnectionsSection />
            </>
          )}

          {section === "notifications" && (
            <>
              <SectionHeading eyebrow="Alert preferences" title="Choose what reaches you" />
              <ul className="grid gap-2.5">
                {ALERT_TYPES.map(([key, title, detail]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-sense-blue/10 bg-white/70 p-3.5"
                  >
                    <div>
                      <strong className="text-xs text-sense-blue">{title}</strong>
                      <p className="mt-0.5 text-[11px] text-[#5f706e]">{detail}</p>
                    </div>
                    <Switch
                      label={title}
                      on={values.alerts[key]}
                      onChange={(on) => update({ alerts: { ...values.alerts, [key]: on } })}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-[#5f706e]">
                These control which alerts appear under the bell in the top bar.
              </p>
            </>
          )}

          {dirty && !notice?.error && (
            <p role="status" className="mt-5 text-[11px] font-semibold text-sense-blue">
              You have unsaved changes.
            </p>
          )}
          {notice && (
            <p role={notice.error ? "alert" : "status"} className={`mt-5 text-[11px] font-semibold ${notice.error ? "text-[#b23b3b]" : "text-sense-blue"}`}>
              {notice.error ?? notice.info}
            </p>
          )}
        </Panel>
      </div>
      )}
    </div>
  );
}
