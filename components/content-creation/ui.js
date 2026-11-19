"use client";

// Building blocks for the Content Creation screens, styled after the
// Marketing Intelligence Hub Figma Make app.

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export function MyContentLink() {
  return (
    <Link
      href="/content-creation/my-content"
      className="inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[22px] bg-sense-lime px-[18px] text-[10px] font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition duration-150 hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)]"
    >
      <Icon name="content" size={16} />
      My Content
    </Link>
  );
}

export function BackLink({ href = "/content-creation", children = "Back to Content Creation" }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-paper/90 transition-colors hover:text-sense-lime"
    >
      <Icon name="chevron" size={16} className="rotate-180" /> {children}
    </Link>
  );
}

export function PageHeading({ title, description, back = true, action = <MyContentLink /> }) {
  return (
    <header className="mb-6 flex flex-col items-stretch justify-between gap-6 text-paper sm:flex-row sm:items-start">
      <div className="min-w-0">
        {back && <BackLink />}
        <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">{title}</h1>
        <p className="mt-2 max-w-[700px] text-[13px] leading-[1.6] text-paper/85">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Panel({ className = "", children }) {
  return (
    <article
      className={`flex min-w-0 flex-col rounded-[18px] border border-paper/70 bg-paper/95 p-[18px] text-sense-navy shadow-[0_7px_0_rgba(0,31,62,0.16),0_18px_35px_rgba(0,31,62,0.12)] backdrop-blur-[18px] sm:rounded-[22px] sm:p-[22px] ${className}`}
    >
      {children}
    </article>
  );
}

export function PanelLabel({ children, aside }) {
  return (
    <div className="mb-[18px] flex min-h-[36px] flex-col items-stretch justify-between gap-3 border-b border-sense-blue/20 pb-3 sm:flex-row sm:items-start">
      <p className="mt-1 text-[13px] font-bold text-sense-blue">{children}</p>
      {aside}
    </div>
  );
}

export function SelectedTrendBadge({ trend }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-sense-blue/20 bg-[linear-gradient(135deg,rgba(221,254,86,0.3),rgba(3,82,94,0.06))] px-2.5 py-[7px] sm:max-w-[210px]">
      <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-sense-blue text-paper">
        <Icon name="trend" size={14} />
      </span>
      <p className="grid min-w-0 gap-px">
        <small className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#647477]">Selected trend</small>
        <strong className="truncate text-[11px]">{trend.name}</strong>
      </p>
    </div>
  );
}

const inputClass =
  "w-full min-h-10 rounded-[9px] border border-sense-blue/20 bg-white/65 px-3 py-[9px] text-xs text-sense-navy outline-none placeholder:text-[#8a9799] focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)]";

export function Field({ label, children, className = "" }) {
  return (
    <label className={`mb-[13px] grid gap-[7px] ${className}`}>
      <span className="text-[11px] font-semibold text-[#53676a]">{label}</span>
      {children}
    </label>
  );
}

export function Select({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} cursor-pointer`}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

export function TextInput({ label, value, onChange, placeholder, type = "text", autoComplete }) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 4, className = "" }) {
  return (
    <Field label={label} className={className}>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} min-h-[88px] resize-y leading-normal`}
      />
    </Field>
  );
}

const TEXT_FILE = /\.(txt|md|markdown|csv|html?|json|rtf)$/i;

/** Reads a plain-text file into `onText(text, fileName)`. */
export function UploadZone({ label = "Upload your file", hint, onText, large = false }) {
  const [status, setStatus] = useState(null);

  const read = async (file) => {
    if (!file) return;
    if (!(file.type.startsWith("text/") || TEXT_FILE.test(file.name))) {
      setStatus({ error: true, text: `${file.name}: only text files (.txt, .md, .csv, .html) can be read for now. Paste the content instead.` });
      return;
    }
    if (file.size > 1_000_000) {
      setStatus({ error: true, text: `${file.name} is over 1 MB.` });
      return;
    }
    onText(await file.text(), file.name);
    setStatus({ text: `Loaded ${file.name}` });
  };

  return (
    <label
      className={`relative mb-[18px] grid cursor-pointer place-items-center content-center gap-1.5 rounded-[13px] border border-dashed border-sense-blue/35 bg-sense-blue/5 p-[18px] text-center text-sense-blue transition-colors hover:border-sense-blue hover:bg-sense-lime/10 ${large ? "min-h-[180px]" : "min-h-[120px]"}`}
    >
      <input
        type="file"
        accept=".txt,.md,.markdown,.csv,.html,.htm,.json,.rtf,text/*"
        className="absolute size-px overflow-hidden opacity-0"
        onChange={(e) => {
          read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Icon name="upload" size={large ? 20 : 18} />
      <span className="text-xs font-bold">{label}</span>
      <small className={`text-[11px] ${status?.error ? "text-coral-400" : "text-[#647477]"}`}>
        {status?.text ?? hint}
      </small>
    </label>
  );
}

/** Grid of toggle tiles (single choice when `multiple` is false). */
export function ChoiceGrid({ label, options, value, onChange, multiple = false, icon }) {
  const selected = multiple ? value : [value];
  const toggle = (o) => {
    if (!multiple) return onChange(o);
    onChange(selected.includes(o) ? selected.filter((v) => v !== o) : [...selected, o]);
  };
  return (
    <div className="mb-[13px] grid gap-[7px]">
      <span className="text-[11px] font-semibold text-[#53676a]">{label}</span>
      <div className="grid grid-cols-2 gap-[7px] sm:grid-cols-4">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o)}
              className={`grid min-h-[62px] cursor-pointer place-items-center content-center gap-1.5 rounded-[9px] border px-1 py-2 text-[10px] font-bold transition-colors ${
                on
                  ? "border-[rgba(29,73,144,0.34)] bg-sense-lime/25 text-sense-blue"
                  : "border-sense-blue/10 bg-white/60 text-[#627477] hover:border-[rgba(29,73,144,0.34)] hover:bg-sense-lime/25 hover:text-sense-blue"
              }`}
            >
              <Icon name={icon(o)} size={16} />
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GenerateButton({ label = "Generate with AI", pending, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="mt-auto flex min-h-[42px] cursor-pointer items-center justify-center gap-[7px] rounded-[22px] bg-sense-lime text-[10px] font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition-colors hover:bg-sense-blue hover:text-paper disabled:cursor-wait disabled:opacity-60"
    >
      <Icon name="sparkles" size={14} />
      {pending ? "Generating…" : label}
    </button>
  );
}

export function Section({ label, children }) {
  return (
    <div className="mb-[17px] grid gap-2">
      <span className="text-[11px] font-semibold text-[#53676a]">{label}</span>
      {children}
    </div>
  );
}

const box = "rounded-[10px] border border-sense-blue/10 bg-white/70";

export function CopyBlock({ lead, paragraphs = [] }) {
  return (
    <div className={`${box} grid gap-2 p-[15px] text-xs leading-[1.55]`}>
      {lead && <p className="font-bold text-sense-navy">{lead}</p>}
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} className="whitespace-pre-line text-[#41585c]">
          {p}
        </p>
      ))}
    </div>
  );
}

export function CopyButton({ text, size = 14 }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={copied ? "Copied" : "Copy"}
      aria-label={copied ? "Copied" : "Copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="cursor-pointer rounded p-0.5 text-sense-blue transition-opacity hover:opacity-70"
    >
      {copied ? <span className="text-[10px] font-bold">✓</span> : <Icon name="content" size={size} />}
    </button>
  );
}

/** Numbered rows; `copyable` adds a copy button, `aside` adds a right-hand note per row. */
export function NumberedList({ items, copyable = false, aside }) {
  return (
    <div className={`${box} grid px-3 py-[7px]`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-[9px] border-b border-sense-blue/10 py-2 last:border-b-0"
        >
          <b className="grid size-[19px] place-items-center rounded-[5px] bg-sense-blue/10 text-[10px] text-sense-blue">{i + 1}</b>
          <p className="text-[11px] leading-[1.45] text-[#41585c]">{item}</p>
          {copyable ? <CopyButton text={item} /> : aside ? <small className="text-[10px] text-[#788587]">{aside(i)}</small> : <span />}
        </div>
      ))}
    </div>
  );
}

export function Tags({ items, hash = false }) {
  return (
    <div className="flex flex-wrap gap-[7px]">
      {items.map((t) => (
        <span
          key={t}
          className="rounded-[15px] border border-sense-blue/20 bg-white/60 px-[9px] py-[5px] text-[10px] font-bold text-sense-blue"
        >
          {hash ? `#${t.replace(/^#/, "")}` : t}
        </span>
      ))}
    </div>
  );
}

/** Three alternative versions side by side, each copyable. */
export function Alternatives({ items }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {items.map((a, i) => (
        <article key={i} className="relative grid min-w-0 content-start gap-2 rounded-[9px] border border-sense-blue/10 bg-white/65 p-3 pb-8">
          <span className="text-[10px] font-bold uppercase tracking-wide text-sense-blue">{a.label || `Option ${i + 1}`}</span>
          <p className="whitespace-pre-line text-[11px] leading-[1.5] text-[#41585c]">{a.text}</p>
          <span className="absolute right-2 bottom-2">
            <CopyButton text={a.text} size={13} />
          </span>
        </article>
      ))}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="-mt-[3px] mb-[18px] flex flex-wrap gap-[17px] border-b border-sense-blue/15 pb-2.5">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={t === active}
          onClick={() => onChange(t)}
          className={`relative cursor-pointer text-[11px] font-bold transition-colors ${
            t === active
              ? "text-sense-blue after:absolute after:inset-x-0 after:-bottom-[11px] after:h-0.5 after:rounded after:bg-sense-blue"
              : "text-[#748184] hover:text-sense-blue"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function ResultActions({ onRegenerate, onSave, saved, saveLabel = "Save", pending }) {
  const btn = "min-h-[35px] min-w-[90px] flex-1 cursor-pointer rounded-[18px] px-4 text-[10px] font-bold transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60 sm:flex-none";
  return (
    <div className="mt-auto flex justify-end gap-[9px] pt-3.5">
      <button type="button" onClick={onRegenerate} disabled={pending} className={`${btn} bg-sense-blue text-paper`}>
        {pending ? "Generating…" : "Regenerate"}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saved}
        className={`${btn} ${saved ? "cursor-default bg-[#4e8067] text-paper" : "bg-sense-lime text-sense-navy"}`}
      >
        {saved ? "Saved ✓" : saveLabel}
      </button>
    </div>
  );
}

export function EmptyState({ children = "Your suggestions will appear here after you generate." }) {
  return (
    <div className="grid min-h-[360px] place-items-center content-center gap-3 text-center text-sense-blue/50">
      <Icon name="sparkles" size={24} />
      <p className="max-w-[260px] text-xs leading-[1.55]">{children}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div aria-busy="true" className="grid animate-pulse gap-4">
      {[4, 3, 5].map((n, i) => (
        <div key={i} className="grid gap-2">
          <i className="h-2.5 w-24 rounded-full bg-[#d5dccf]" />
          {Array.from({ length: n }, (_, j) => (
            <i key={j} className={`h-2 rounded-full bg-[#e0e5dc] ${j === n - 1 ? "w-2/3" : ""}`} />
          ))}
        </div>
      ))}
      <p className="text-xs text-sense-blue/60">Sense AI is writing…</p>
    </div>
  );
}
