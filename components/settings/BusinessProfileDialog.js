"use client";

// Quick pop-up for the business profile (the same fields as Settings → Workspace),
// so it can be filled in from wherever you are instead of jumping to Settings.

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CUSTOMER_TYPES, INDUSTRIES, useSettings } from "@/lib/settings";
import { lockScroll } from "@/lib/scrollLock";

const field =
  "w-full min-h-10 rounded-[9px] border border-sense-blue/20 bg-white/80 px-3 py-[9px] text-xs text-sense-navy outline-none placeholder:text-[#6f7f82] focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)]";
const labelText = "text-[13px] font-semibold text-[#3d5053]";

/** focus: "company" or "keywords", the field to start in. onSaved runs after a successful save. */
export default function BusinessProfileDialog({ onClose, onSaved, focus = "company", title = "Your business" }) {
  const id = useId();
  const [settings, setSettings] = useSettings();
  const [f, setF] = useState(() => ({
    company: settings.company,
    industry: settings.industry,
    customers: settings.customers,
    description: settings.description,
    keywords: settings.keywords,
  }));
  const companyRef = useRef(null);
  const keywordsRef = useRef(null);
  const set = (key) => (e) => setF((v) => ({ ...v, [key]: e.target.value }));

  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    (focus === "keywords" ? keywordsRef : companyRef).current?.focus();
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
    // Runs once when the pop-up opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await setSettings({ ...settings, ...f });
    setSaving(false);
    if (res?.error) return setError(`Couldn’t save: ${res.error}`);
    onSaved?.();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[55] grid place-items-center p-4">
      <button type="button" tabIndex={-1} aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-sense-navy/45 backdrop-blur-[2px]" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onSubmit={save}
        className="relative grid max-h-[calc(100vh-32px)] w-full max-w-[480px] gap-3.5 overflow-y-auto rounded-[22px] bg-paper p-5 text-sense-navy shadow-[0_24px_60px_rgba(0,31,62,0.35)] sm:p-6"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id={`${id}-title`} className="text-lg font-bold text-sense-blue">{title}</h2>
            <p className="mt-0.5 text-[13px] leading-[1.5] text-[#4b5d60]">
              Sense AI uses this to tailor trends, content and plans to you. You can change it any time in Settings.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-2xl leading-none text-sense-blue hover:bg-sense-blue/10">
            ×
          </button>
        </header>

        <label className="grid gap-1.5">
          <span className={labelText}>Company name</span>
          <input ref={companyRef} value={f.company} onChange={set("company")} maxLength={80} placeholder="e.g. Northside Roasters" className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={labelText}>Industry</span>
            <select value={f.industry} onChange={set("industry")} className={`${field} cursor-pointer`}>
              {INDUSTRIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className={labelText}>Who are your customers?</span>
            <select value={f.customers} onChange={set("customers")} className={`${field} cursor-pointer`}>
              {CUSTOMER_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className={labelText}>What does your business do?</span>
          <textarea
            value={f.description}
            onChange={set("description")}
            rows={2}
            maxLength={400}
            placeholder="e.g. We roast small-batch coffee and sell beans online and to local cafés."
            className={`${field} resize-y leading-normal`}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelText}>
            Your topics <span className="font-normal text-[#6f7f82]">(keywords, separated by commas)</span>
          </span>
          <input ref={keywordsRef} value={f.keywords} onChange={set("keywords")} placeholder="e.g. coffee, espresso, local" className={field} />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-coral-400/10 px-3 py-2 text-xs text-coral-400">
            {error}
          </p>
        )}
        <footer className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="min-h-[40px] cursor-pointer rounded-[20px] border border-sense-blue/25 px-4 text-[13px] font-bold text-sense-blue transition hover:bg-sense-blue/10">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="min-h-[40px] cursor-pointer rounded-[20px] bg-sense-lime px-6 text-[13px] font-extrabold uppercase text-sense-navy shadow-[0_4px_0_rgba(0,31,62,0.17)] transition hover:translate-y-px disabled:cursor-default disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
