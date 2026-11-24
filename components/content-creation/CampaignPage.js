"use client";

// Content Creation → Campaign, based on the Figma Make "Create Campaign" screen.
// Fill in a brief, Sense AI (Gemini) drafts the campaign; starter ideas open the
// matching creator. The brief and the latest draft are kept in this browser.

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { generateCampaign } from "@/app/(dashboard)/content-creation/actions";
import {
  AUDIENCE_TYPES,
  CAMPAIGN_CHANNELS,
  CAMPAIGN_FOCUS,
  CAMPAIGN_GOALS,
  EMPTY_BRIEF,
  briefProblem,
  cleanBrief,
} from "@/lib/campaignBrief";
import { clearContentTrend, loadContentTrend, saveContentTrend } from "@/lib/contentTrend";
import TrendSlot from "./TrendSlot";
import { presetAudiences } from "@/lib/presetAudiences";
import { saveItem } from "@/lib/savedContent";
import { useBusiness } from "@/lib/settings";
import useStored from "@/lib/useStored";
import useHydrated from "@/lib/useHydrated";
import { SkeletonPanel } from "@/components/ui/Skeleton";
import {
  CopyButton,
  Field,
  LoadingState,
  PageHeading,
  Panel,
  TextArea,
  TextInput,
} from "./ui";

const KEY = "trendtracker:campaign";
const EMPTY_STATE = { brief: EMPTY_BRIEF, plan: null, savedId: null };
const AUDIENCE_FROM_CUSTOMERS = { "Consumers (B2C)": "B2C", "Businesses (B2B)": "B2B", Both: "Both" };

const fmtDate = (iso) =>
  iso ? new Date(`${iso}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

/** Which creator screen a starter idea should open. */
function creatorFor(item) {
  const t = `${item.channel} ${item.format}`.toLowerCase();
  if (/blog|article/.test(t)) return "blog";
  if (/video|reel|tiktok/.test(t)) return "video";
  if (/\bad\b|ads|advert|sponsored/.test(t)) return "ad";
  return "social";
}

function planToText(plan, brief) {
  const section = (title, rows) => [`\n${title.toUpperCase()}`, ...rows].join("\n");
  return [
    plan.name,
    plan.coreMessage,
    plan.summary,
    section("Brief", [
      `Goal: ${brief.goal}${brief.targetValue ? ` · Target: ${brief.targetValue}` : ""}`,
      `Offer: ${brief.offer}`,
      `Audience: ${brief.audienceName || brief.segments.join(", ")}`,
      `Channels: ${brief.channels.join(", ")} · ${brief.days} days${brief.launchDate ? ` from ${fmtDate(brief.launchDate)}` : ""}`,
    ]),
    section("Strategy", [`Positioning: ${plan.positioning}`, `Audience tension: ${plan.audienceTension}`, `Creative direction: ${plan.creativeDirection}`]),
    section("Channel plan", plan.channelPlan.map((c) => `- ${c.channel} (${c.cadence}): ${c.purpose}`)),
    section("Timeline", plan.timeline.map((t) => `- ${t.phase}, ${t.timing}: ${t.focus}`)),
    section("Starter content", plan.starterContent.map((s) => `- [${s.channel} · ${s.format}] ${s.title}: ${s.copy}`)),
    section("Measurement", plan.measurement.map((m) => `- ${m.metric}: ${m.target}`)),
  ].join("\n");
}

/* ---------- form pieces ---------- */

function Step({ n, title, hint, children }) {
  return (
    <section className="border-b border-sense-blue/10 py-6 first:pt-0 last:border-0">
      <h2 className="text-[15px] font-bold text-sense-blue">
        {n}. {title}
      </h2>
      {hint && <p className="mt-1 text-[11px] text-[#5f706e]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Tiles({ options, value, onChange, multiple = false, cols = "sm:grid-cols-3" }) {
  const on = (name) => (multiple ? value.includes(name) : value === name);
  const toggle = (name) =>
    multiple ? onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]) : onChange(name);
  return (
    <div className={`grid grid-cols-1 gap-2.5 ${cols}`}>
      {options.map(([name, description]) => (
        <button
          key={name}
          type="button"
          aria-pressed={on(name)}
          onClick={() => toggle(name)}
          className={`relative grid cursor-pointer gap-1 rounded-[14px] border p-4 text-left transition ${
            on(name)
              ? "border-sense-blue bg-sense-lime/30 shadow-[0_4px_0_rgba(0,31,62,0.12)]"
              : "border-sense-blue/15 bg-white/60 hover:border-sense-blue/40 hover:bg-sense-lime/10"
          }`}
        >
          <strong className="text-[13px] text-sense-blue">{name}</strong>
          <span className="text-[11px] leading-[1.45] text-[#5f706e]">{description}</span>
          {on(name) && <span className="absolute top-3 right-3 text-xs font-bold text-sense-blue">✓</span>}
        </button>
      ))}
    </div>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={`min-h-8 cursor-pointer rounded-2xl border px-3.5 text-[11px] font-semibold transition ${
              on ? "border-sense-blue bg-sense-blue text-paper" : "border-sense-blue/20 bg-white/70 text-sense-blue hover:bg-sense-blue/10"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function SegmentPicker({ value, onChange, suggestions }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const s = draft.trim().slice(0, 60);
    if (s && !value.includes(s)) onChange([...value, s]);
    setDraft("");
  };
  return (
    <div className="grid gap-2.5">
      <Chips options={[...new Set([...value, ...suggestions])]} value={value} onChange={onChange} />
      <div className="flex max-w-md gap-2">
        <input
          aria-label="Add a customer segment"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add your own segment"
          className="min-h-9 flex-1 rounded-xl border border-sense-blue/15 bg-white/80 px-3 text-xs outline-none focus:ring-2 focus:ring-sense-blue/30"
        />
        <button type="button" onClick={add} disabled={!draft.trim()} className="cursor-pointer rounded-xl bg-sense-blue px-3.5 text-[11px] font-bold text-paper disabled:opacity-50">
          Add
        </button>
      </div>
    </div>
  );
}

function BriefForm({ brief, update, onGenerate, onReset, pending, error, trend, onTrendChange, hasPlan, onShowPlan }) {
  const { industry } = useBusiness();
  const set = (key) => ({ value: brief[key], onChange: (v) => update({ [key]: v }) });

  return (
    <Panel>
      <div className="mb-6 flex flex-col gap-3 border-b border-sense-blue/15 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-sense-blue">Set up your campaign</h2>
          <p className="mt-1 max-w-[680px] text-xs leading-[1.55] text-[#5f706e]">
            Only steps 3, 4 and 6 are required. Leave anything else blank and Sense AI will suggest it.
            Generating creates an editable draft; nothing is published or spent.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TrendSlot trend={trend} onChange={onTrendChange} />
          {hasPlan && (
            <button type="button" onClick={onShowPlan} className="min-h-9 cursor-pointer rounded-[18px] bg-sense-blue px-4 text-[11px] font-bold text-paper transition hover:bg-sense-blue/85">
              View current draft
            </button>
          )}
        </div>
      </div>

      <Step n={1} title="Business goal">
        <Tiles options={CAMPAIGN_GOALS} {...set("goal")} />
      </Step>

      <Step n={2} title="Success target" hint="How will you know it worked?">
        <div className="grid gap-x-5 sm:grid-cols-2">
          <TextInput label="Target metric" placeholder="e.g. Online orders, enquiries, followers" {...set("targetMetric")} />
          <TextInput label="Target value" placeholder="e.g. 50 orders in 30 days" {...set("targetValue")} />
        </div>
        <TextInput label="Why this matters" placeholder="e.g. Clear spring stock before the summer range" {...set("targetReason")} />
      </Step>

      <Step n={3} title="What are you promoting?">
        <Tiles options={CAMPAIGN_FOCUS} cols="sm:grid-cols-2 xl:grid-cols-4" {...set("focus")} />
        <div className="mt-4 grid gap-x-5">
          <TextArea rows={2} label="Offer summary (required)" placeholder="Describe the product, service, event or deal this campaign promotes." {...set("offer")} />
          <TextInput label="Call to action" placeholder="e.g. Shop now, Book a call, Get 15% off" {...set("cta")} />
        </div>
      </Step>

      <Step n={4} title="Target audience" hint="Give the audience a name, pick segments, or both (required).">
        <div className="grid gap-x-5 sm:grid-cols-2">
          <TextInput label="Audience name" placeholder="e.g. Busy working parents" {...set("audienceName")} />
          <Field label="Audience type">
            <Chips options={AUDIENCE_TYPES} value={[brief.audienceType]} onChange={(v) => update({ audienceType: v.find((x) => x !== brief.audienceType) ?? "" })} />
          </Field>
        </div>
        <TextArea rows={2} label="Description" placeholder="Who they are, how they buy, what they care about." {...set("audienceDescription")} />
        <Field label="Customer segments">
          <SegmentPicker value={brief.segments} onChange={(v) => update({ segments: v })} suggestions={presetAudiences(industry).slice(0, 8)} />
        </Field>
        <div className="mt-3 grid gap-x-5 sm:grid-cols-2">
          <TextInput label="Location" placeholder="e.g. Vancouver, Canada-wide, online only" {...set("location")} />
          <TextInput label="Decision-maker" placeholder="e.g. The parent, the store owner" {...set("role")} />
          <TextInput label="Interests" placeholder="e.g. Home cooking, fitness, sustainability" {...set("interests")} />
          <TextInput label="What do they need or struggle with?" placeholder="e.g. Not enough time to cook healthy meals" {...set("painPoints")} />
        </div>
      </Step>

      <Step n={5} title="Messaging" hint="Optional. Sense AI will write these if you leave them blank.">
        <TextArea rows={2} label="Value proposition" placeholder="What makes this offer worth it to the audience?" {...set("valueProposition")} />
        <TextInput label="Core message" placeholder="A short headline or opening line" {...set("coreMessage")} />
      </Step>

      <Step n={6} title="Channels and content formats">
        <Tiles options={CAMPAIGN_CHANNELS} multiple {...set("channels")} />
        <div className="mt-4">
          <TextInput label="Content formats" placeholder="e.g. Product demos, customer stories, how-to carousels" {...set("contentFormats")} />
        </div>
      </Step>

      <Step n={7} title="Timing and budget">
        <div className="grid gap-x-5 sm:grid-cols-3">
          <Field label={`Campaign window: ${brief.days} days`}>
            <input
              type="range"
              min={7}
              max={90}
              value={brief.days}
              onChange={(e) => update({ days: Number(e.target.value) })}
              className="mt-3 w-full cursor-pointer accent-[#03525e]"
            />
          </Field>
          <TextInput label="Budget / resources" placeholder="e.g. $2,000 · 1 content owner" {...set("budget")} />
          <TextInput label="Launch date" type="date" {...set("launchDate")} />
        </div>
      </Step>

      <Step n={8} title="Review">
        <TextArea rows={2} label="Campaign summary (optional)" placeholder="Summarise the campaign in one sentence." {...set("summary")} />
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[
            ["Objective", brief.goal],
            ["Target", brief.targetValue || "Sense AI will suggest"],
            ["Audience", brief.audienceName || brief.segments.join(", ") || "Not set"],
            ["Channels", brief.channels.join(", ") || "Not set"],
            ["Budget", brief.budget || "Not set"],
            ["Launch", fmtDate(brief.launchDate) || "Flexible"],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 rounded-xl border border-sense-blue/10 bg-white/70 p-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#5f706e]">{k}</dt>
              <dd className="truncate text-xs font-semibold text-sense-navy" title={v}>{v}</dd>
            </div>
          ))}
        </dl>
      </Step>

      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-[#ff7f7f]/20 p-3 text-xs font-semibold text-[#8a2f2f]">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          className="min-h-[42px] cursor-pointer rounded-[22px] border border-sense-blue/25 px-5 text-[11px] font-bold text-sense-blue transition hover:bg-sense-blue/10"
        >
          Clear brief
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[22px] bg-sense-lime px-6 text-[10px] font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)] disabled:cursor-wait disabled:opacity-60"
        >
          <Icon name="sparkles" size={14} /> {pending ? "Generating…" : "Generate campaign"}
        </button>
      </div>
    </Panel>
  );
}

/* ---------- result ---------- */

function ResultSection({ n, title, hint, children }) {
  return (
    <section className="border-t border-sense-blue/10 pt-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2.5 text-[15px] font-bold text-sense-blue">
          <span className="grid size-7 place-items-center rounded-lg bg-sense-lime text-[11px] font-extrabold text-sense-navy">
            {String(n).padStart(2, "0")}
          </span>
          {title}
        </h3>
        {hint && <p className="text-[11px] text-[#5f706e]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const tile = "grid content-start gap-1.5 rounded-xl border border-sense-blue/10 bg-white/70 p-4";
const tileLabel = "text-[10px] font-bold uppercase tracking-wider text-[#5f706e]";

function CopyPlanButton({ text, className }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={className}
    >
      {copied ? "✓ Copied" : "Copy plan"}
    </button>
  );
}

function PlanView({ plan, brief, onEdit, onRegenerate, onSave, saved, pending, error, trend }) {
  const text = planToText(plan, brief);
  const handoff = (item) =>
    saveContentTrend(
      {
        name: item.title,
        audience: brief.audienceName || brief.segments.join(" + "),
        platform: item.channel,
        format: item.format,
        hook: `${item.copy} (Part of the "${plan.name}" campaign.)`,
      },
      {
        source: "campaign",
        path: `/content-creation/${creatorFor(item)}`,
        returnTo: { href: "/content-creation/campaign", label: "Back to your campaign" },
      },
    );
  const btn = "inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-[20px] px-4 text-[11px] font-bold transition disabled:cursor-wait disabled:opacity-60";

  return (
    <Panel className="gap-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <span className="inline-block rounded-full bg-sense-lime px-3 py-1 text-[10px] font-extrabold uppercase">
            Draft · Ready to review
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-sense-blue">{plan.name}</h2>
          <p className="mt-2 text-base font-semibold text-sense-navy">{plan.coreMessage}</p>
          <p className="mt-2 text-xs leading-[1.6] text-[#41585c]">{plan.summary}</p>
          {trend && <p className="mt-2 text-[11px] text-[#5f706e]">Built around “{trend.name}”.</p>}
        </div>
        <div className="grid content-center gap-1 rounded-2xl bg-sense-blue p-5 text-paper">
          <span className="text-[10px] font-bold uppercase tracking-wider text-paper/75">Primary success target</span>
          <strong className="text-xl">{brief.targetValue || plan.measurement[0]?.target || "See measurement"}</strong>
          <small className="text-[11px] text-paper/80">{brief.targetMetric || plan.measurement[0]?.metric}</small>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {[
          ["Audience", [brief.audienceName || brief.segments.join(", "), brief.location].filter(Boolean).join(" · ")],
          ["Offer", brief.offer],
          ["Call to action", brief.cta || "See starter content"],
          ["Budget", brief.budget || "Not set"],
          ["Launch", fmtDate(brief.launchDate) || "Flexible"],
          ["Duration", `${brief.days} days`],
        ].map(([k, v]) => (
          <div key={k} className={tile}>
            <dt className={tileLabel}>{k}</dt>
            <dd className="text-xs font-semibold leading-[1.45] text-sense-navy">{v}</dd>
          </div>
        ))}
      </dl>

      <ResultSection n={1} title="Campaign strategy" hint="Positioning and message direction">
        <div className="grid gap-2.5 md:grid-cols-3">
          {[
            ["Positioning", plan.positioning],
            ["Audience tension", plan.audienceTension],
            ["Creative direction", plan.creativeDirection],
          ].map(([k, v]) => (
            <article key={k} className={tile}>
              <span className={tileLabel}>{k}</span>
              <p className="text-xs leading-[1.6] text-[#41585c]">{v}</p>
            </article>
          ))}
        </div>
      </ResultSection>

      <ResultSection n={2} title="Channel plan" hint={brief.contentFormats || undefined}>
        <div className="grid gap-2.5 md:grid-cols-3">
          {plan.channelPlan.map((c) => (
            <article key={c.channel} className={tile}>
              <strong className="text-sm text-sense-blue">{c.channel}</strong>
              <span className="w-fit rounded-full bg-sense-lime/60 px-2.5 py-0.5 text-[10px] font-bold">{c.cadence}</span>
              <p className="text-xs leading-[1.55] text-[#41585c]">{c.purpose}</p>
            </article>
          ))}
        </div>
      </ResultSection>

      <ResultSection n={3} title="Timeline" hint={`${brief.days} days${brief.launchDate ? ` from ${fmtDate(brief.launchDate)}` : ""}`}>
        <ol className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {plan.timeline.map((t, i) => (
            <li key={i} className={tile}>
              <span className={tileLabel}>{t.timing}</span>
              <strong className="text-[13px] text-sense-blue">{t.phase}</strong>
              <p className="text-xs leading-[1.55] text-[#41585c]">{t.focus}</p>
            </li>
          ))}
        </ol>
      </ResultSection>

      <ResultSection n={4} title="Starter content" hint="Open any idea in the matching creator">
        <div className="grid gap-2.5 md:grid-cols-2">
          {plan.starterContent.map((s, i) => (
            <article key={i} className={`${tile} gap-2`}>
              <span className={tileLabel}>
                {s.channel} · {s.format}
              </span>
              <strong className="text-[13px] text-sense-blue">{s.title}</strong>
              <p className="text-xs leading-[1.55] text-[#41585c]">{s.copy}</p>
              <div className="mt-1 flex items-center gap-2">
                <Link
                  href={`/content-creation/${creatorFor(s)}`}
                  onClick={() => handoff(s)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-2xl bg-sense-blue px-3.5 text-[11px] font-bold text-paper transition hover:bg-sense-blue/85"
                >
                  Create this <Icon name="chevron" size={13} />
                </Link>
                <CopyButton text={`${s.title}\n${s.copy}`} label="Copy idea" />
              </div>
            </article>
          ))}
        </div>
      </ResultSection>

      <ResultSection n={5} title="Measurement" hint="What to track">
        <dl className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {plan.measurement.map((m, i) => (
            <div key={i} className={tile}>
              <dt className={tileLabel}>{m.metric}</dt>
              <dd className="text-sm font-bold text-sense-navy">{m.target}</dd>
            </div>
          ))}
        </dl>
      </ResultSection>

      {error && (
        <p role="alert" className="rounded-xl bg-[#ff7f7f]/20 p-3 text-xs font-semibold text-[#8a2f2f]">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 rounded-2xl bg-[#e3eadd] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[11px] text-[#5f706e]">
          <Icon name="sparkles" size={15} /> A draft to edit, not a live campaign. Nothing is published or spent.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className={`${btn} border border-sense-blue/25 text-sense-blue hover:bg-sense-blue/10`}>
            <Icon name="edit" size={14} /> Edit brief
          </button>
          <button type="button" onClick={onRegenerate} disabled={pending} className={`${btn} bg-sense-blue text-paper hover:bg-sense-blue/85`}>
            {pending ? "Generating…" : "Regenerate"}
          </button>
          <CopyPlanButton text={text} className={`${btn} border border-sense-blue/25 text-sense-blue hover:bg-sense-blue/10`} />
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className={`${btn} ${saved ? "cursor-default bg-[#4e8067] text-paper" : "bg-sense-lime text-sense-navy hover:opacity-85"}`}
          >
            {saved ? "✓ Saved to My Content" : "Save to My Content"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- page ---------- */

export default function CampaignPage() {
  const business = useBusiness();
  const [state, setState] = useStored(KEY, EMPTY_STATE);
  const [editing, setEditing] = useState(false);
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Read after mount so server and client markup match on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrend(loadContentTrend("/content-creation/campaign"));
  }, []);

  const stored = { ...EMPTY_STATE, ...state };
  const brief = {
    ...EMPTY_BRIEF,
    ...stored.brief,
    audienceType: stored.brief?.audienceType || AUDIENCE_FROM_CUSTOMERS[business.customers] || "",
  };
  const plan = stored.plan;

  const update = (patch) => setState((s) => ({ ...EMPTY_STATE, ...s, brief: { ...brief, ...patch } }));

  const generate = () => {
    setError(null);
    const clean = cleanBrief(brief);
    const problem = briefProblem(clean);
    if (problem) return setError(problem);
    startTransition(async () => {
      const res = await generateCampaign(clean, trend, business).catch((err) => ({ error: err.message }));
      if (res.error) return setError(res.error);
      setState((s) => ({ ...EMPTY_STATE, ...s, plan: res.plan, savedId: null }));
      setEditing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const reset = () => {
    if (!window.confirm("Clear the whole brief and the current draft?")) return;
    setState(EMPTY_STATE);
    setError(null);
    setEditing(false);
  };

  const save = () => {
    const entry = saveItem({
      kind: "campaign",
      type: "Campaign",
      title: plan.name.slice(0, 120),
      text: planToText(plan, brief),
      trend: trend?.name ?? null,
    });
    if (entry) setState((s) => ({ ...s, savedId: entry.id }));
    else setError("Couldn't save: your account is still loading. Try again in a moment.");
  };

  const showPlan = plan && !editing;
  const hydrated = useHydrated();

  return (
    <div className="w-full">
      <PageHeading
        title={!hydrated ? "Campaign" : showPlan ? "Your campaign draft" : "Create Campaign"}
        description={
          showPlan
            ? "Review the plan, open any starter idea in a creator, or edit the brief and regenerate."
            : "Set your goal, offer, audience, channels and timing. Sense AI drafts an editable campaign plan for your business."
        }
      />
      {!hydrated ? (
        <SkeletonPanel lines={7} />
      ) : pending && !showPlan ? (
        <Panel>
          <LoadingState />
        </Panel>
      ) : showPlan ? (
        <PlanView
          plan={plan}
          brief={brief}
          trend={trend}
          onEdit={() => setEditing(true)}
          onRegenerate={generate}
          onSave={save}
          saved={Boolean(stored.savedId)}
          pending={pending}
          error={error}
        />
      ) : (
        <BriefForm
          brief={brief}
          update={update}
          onGenerate={generate}
          onReset={reset}
          pending={pending}
          error={error}
          trend={trend}
          onTrendChange={(next) => {
            if (!next) {
              clearContentTrend();
              setTrend(null);
              return;
            }
            const entry = { ...next, source: next.source ?? "trend", returnTo: next.returnTo ?? trend?.returnTo ?? null };
            saveContentTrend(entry, { source: entry.source, path: "/content-creation/campaign", returnTo: entry.returnTo });
            setTrend(entry);
          }}
          hasPlan={Boolean(plan)}
          onShowPlan={() => setEditing(false)}
        />
      )}
    </div>
  );
}
