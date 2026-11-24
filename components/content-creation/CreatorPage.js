"use client";

// One Content Creation screen (Write a new post, Video, Blog, Ad Copy, Improve your
// writing, Adapt for other platforms). Layout follows the Figma Make app; results
// are written by Gemini via the generateContent server action.

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ADAPT_PATH, setAdaptSource, takeAdaptSource } from "@/lib/adaptSource";
import { clearDraft, loadDraft, saveDraft } from "@/lib/creatorDraft";
import { useAccount } from "@/lib/account";
import { generateContent } from "@/app/(dashboard)/content-creation/actions";
import { CONTENT_KINDS, FIELD_OPTIONS as O } from "@/lib/contentKinds";
import { clearContentTrend, loadContentTrend, saveContentTrend } from "@/lib/contentTrend";
import TrendSlot from "./TrendSlot";
import { useBusiness } from "@/lib/settings";
import { saveItem } from "@/lib/savedContent";
import { useContentStore } from "@/lib/contentStore";
import {
  Alternatives,
  ChoiceGrid,
  CopyBlock,
  EmptyState,
  Field,
  GenerateButton,
  LoadingState,
  NumberedList,
  PageHeading,
  Panel,
  PanelLabel,
  ResultActions,
  Section,
  Select,
  Tabs,
  Tags,
  TextArea,
  TextInput,
  UploadZone,
  UPLOAD_HINT,
} from "./ui";

const DEFAULTS = {
  social: { goal: "Awareness", tone: "Professional", idea: "" },
  video: { platform: "Instagram", goal: "Awareness", format: "Short-form", duration: "15 seconds", idea: "" },
  blog: { tone: "Professional", idea: "" },
  ad: { product: "", adGoal: "Awareness", adFormat: "Image Ad", idea: "" },
  improve: { text: "", writingType: "Social post", intent: "Improve it", instructions: "" },
  repurpose: { source: "", platforms: ["Instagram", "Blog"], instructions: "" },
};

const ideaFromTrend = (t) =>
  t.source === "trend" || !t.source
    ? t.hook || `Content that uses the ${t.name} trend${t.audience ? ` to reach ${t.audience}` : ""}.`
    : [t.name, t.hook].filter(Boolean).join(": ");

// ---------- Forms ----------

const INTENT_ICON = { "Improve it": "sparkles", "Rewrite it": "repeat", "Summarize it": "content", "Get feedback": "message" };
const INSTRUCTIONS_PLACEHOLDER = {
  "Improve it": "e.g. Make it more engaging and end with a clear next step.",
  "Rewrite it": "e.g. Make it playful and shorter, for a younger audience.",
  "Summarize it": "e.g. Focus on anything about pricing or dates.",
  "Get feedback": "e.g. Will this convince small business owners to sign up?",
};
/** The button label follows the chosen intent. */
export const improveButtonLabel = (intent) =>
  ({ "Rewrite it": "Rewrite with AI", "Summarize it": "Summarize with AI", "Get feedback": "Get feedback" })[intent] ??
  "Improve with AI";

function Form({ kind, f, set }) {
  const ideaPlaceholder = "e.g. A practical story showing how our product saves time for busy teams.";
  const idea = (label = "Describe your idea") => (
    <TextArea label={label} value={f.idea} onChange={set("idea")} placeholder={ideaPlaceholder} className="mt-auto" />
  );

  switch (kind) {
    case "social":
      // Starts from scratch; existing writing belongs in "Improve your writing".
      return (
        <>
          <p className="mb-[18px] rounded-[10px] bg-sense-blue/5 px-3 py-2.5 text-xs text-[#3d5053]">
            Already have a post written?{" "}
            <Link href="/content-creation/improve" className="font-bold text-sense-blue underline">
              Improve it instead →
            </Link>
          </p>
          <Select label="Content Goal" value={f.goal} options={O.goal} onChange={set("goal")} />
          <Select label="Tone of voice" value={f.tone} options={O.tone} onChange={set("tone")} />
          {idea()}
        </>
      );
    case "video":
      return (
        <>
          <Select label="Platform" value={f.platform} options={O.platform} onChange={set("platform")} />
          <Select label="Video Goal" value={f.goal} options={O.goal} onChange={set("goal")} />
          <Select label="Video Format" value={f.format} options={O.format} onChange={set("format")} />
          <Select label="Video Duration" value={f.duration} options={O.duration} onChange={set("duration")} />
          {idea()}
        </>
      );
    case "blog":
      return (
        <>
          <Select label="Tone of voice" value={f.tone} options={O.tone} onChange={set("tone")} />
          {idea("Describe your topic")}
        </>
      );
    case "ad":
      return (
        <>
          <TextInput
            label="Product or Service"
            value={f.product}
            onChange={set("product")}
            placeholder="e.g. Our new spring collection"
          />
          <Select label="Campaign Goal" value={f.adGoal} options={O.adGoal} onChange={set("adGoal")} />
          <Select label="Ad Format" value={f.adFormat} options={O.adFormat} onChange={set("adFormat")} />
          {idea("Key message (optional)")}
        </>
      );
    case "improve":
      return (
        <>
          <UploadZone label="Upload a file" hint={UPLOAD_HINT} onText={(text) => set("text")(text)} />
          <TextArea
            label="Or paste your text"
            value={f.text}
            onChange={set("text")}
            placeholder="Paste a post, ad, email, web page or any document."
            rows={6}
          />
          <Select label="What is it?" value={f.writingType} options={O.writingType} onChange={set("writingType")} />
          <ChoiceGrid
            label="What do you want?"
            options={O.intent}
            value={f.intent}
            onChange={set("intent")}
            icon={(o) => INTENT_ICON[o]}
          />
          <TextArea
            label="Anything specific? (optional)"
            value={f.instructions}
            onChange={set("instructions")}
            placeholder={INSTRUCTIONS_PLACEHOLDER[f.intent]}
            rows={3}
          />
        </>
      );
    case "repurpose":
      return <RepurposeForm f={f} set={set} />;
    default:
      return null;
  }
}

function RepurposeForm({ f, set }) {
  const { saved } = useContentStore();

  return (
    <>
      <Field label="Select saved content">
        <select
          value=""
          onChange={(e) => {
            const item = saved.find((i) => i.id === e.target.value);
            if (item) set("source")(item.text);
          }}
          className="min-h-10 w-full cursor-pointer rounded-[9px] border border-sense-blue/20 bg-white/65 px-3 py-[9px] text-xs text-sense-navy outline-none focus:border-sense-blue"
        >
          <option value="">{saved.length ? "Choose from My Content" : "No saved content yet"}</option>
          {saved.map((i) => (
            <option key={i.id} value={i.id}>
              {i.type}: {i.title}
            </option>
          ))}
        </select>
      </Field>
      <TextArea label="Or paste your content" value={f.source} onChange={set("source")} placeholder="Paste a post, article or any content you want on other platforms." />
      <ChoiceGrid
        multiple
        label="Make versions for"
        options={O.platforms}
        value={f.platforms}
        onChange={set("platforms")}
        icon={(o) => (o === "Blog" ? "content" : "message")}
      />
      <TextArea
        label="Additional instructions (optional)"
        value={f.instructions}
        onChange={set("instructions")}
        placeholder="Make each version native to its platform."
        rows={3}
      />
    </>
  );
}

// ---------- Results ----------

function Result({ kind, r, f }) {
  const [tab, setTab] = useState(null);

  switch (kind) {
    case "social":
      return (
        <>
          <Section label="Caption">
            <CopyBlock lead={r.hook} paragraphs={[r.caption]} />
          </Section>
          <Section label="Visual Guidelines">
            <NumberedList items={r.visualGuidelines ?? []} />
          </Section>
          <Section label="Suggested Hashtags (optional)">
            <Tags items={r.hashtags ?? []} hash />
          </Section>
        </>
      );
    case "video":
      return (
        <>
          <Section label="Video Script">
            <CopyBlock lead={r.hook} paragraphs={[r.script]} />
          </Section>
          <Section label="Video Concept">
            <NumberedList items={r.concept ?? []} />
          </Section>
          <Section label="Storyboard and Scene Breakdown">
            <NumberedList
              items={(r.scenes ?? []).map((s) => `${s.title} — ${s.description}`)}
              aside={(i) => r.scenes[i]?.timing}
            />
          </Section>
        </>
      );
    case "blog":
      return (
        <>
          <Section label="Suggested Titles">
            <NumberedList items={r.titles ?? []} copyable />
          </Section>
          <Section label="Article Outline">
            <CopyBlock paragraphs={r.outline ?? []} />
          </Section>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section label="Key Points & Content Guidance">
              <NumberedList items={r.keyPoints ?? []} />
            </Section>
            <Section label="SEO Keywords">
              <Tags items={r.keywords ?? []} />
            </Section>
          </div>
        </>
      );
    case "ad":
      return (
        <>
          <Section label="Ad Headlines">
            <NumberedList items={r.headlines ?? []} copyable />
          </Section>
          <Section label="Ad Copy">
            <NumberedList items={r.copy ?? []} copyable />
          </Section>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section label="Call to Action (CTA)">
              <Tags items={r.ctas ?? []} />
            </Section>
            <Section label="Creative Guidelines">
              <NumberedList items={r.guidelines ?? []} />
            </Section>
          </div>
        </>
      );
    case "improve":
      return <ImproveResult r={r} />;
    case "repurpose": {
      const versions = r.versions ?? [];
      const current = versions.find((v) => v.platform === tab) ?? versions[0];
      if (!current) return <EmptyState>No versions came back. Try regenerating.</EmptyState>;
      return (
        <>
          <Tabs tabs={versions.map((v) => v.platform)} active={current.platform} onChange={setTab} />
          <Section label={`${current.platform} ${current.platform === "Blog" ? "Draft" : "Caption"}`}>
            <CopyBlock paragraphs={[current.text]} />
          </Section>
          {current.hashtags?.length > 0 && (
            <Section label="Suggested Hashtags (optional)">
              <Tags items={current.hashtags} hash />
            </Section>
          )}
          <Section label="Key adjustments">
            <NumberedList items={current.adjustments ?? []} />
          </Section>
        </>
      );
    }
    default:
      return null;
  }
}

/** "Improve your writing" results, laid out by mode (see lib/gemini/content.js). */
function ImproveResult({ r }) {
  switch (r.mode) {
    case "improvePost":
      return (
        <>
          <Section label="Improved post">
            <CopyBlock lead={r.hook} paragraphs={[r.caption]} />
          </Section>
          <Section label="Other versions">
            <Alternatives items={r.alternatives ?? []} />
          </Section>
          <Section label="Visual suggestions (optional)">
            <NumberedList items={r.visualSuggestions ?? []} />
          </Section>
          <Section label="Suggested hashtags (optional)">
            <Tags items={r.hashtags ?? []} hash />
          </Section>
        </>
      );
    case "summarize":
      return (
        <>
          <Section label="Summary">
            <CopyBlock paragraphs={[r.summary]} />
          </Section>
          <Section label="Key takeaways">
            <NumberedList items={r.takeaways ?? []} />
          </Section>
          <Section label="Suggested next steps">
            <Alternatives items={r.suggestedActions ?? []} />
          </Section>
        </>
      );
    case "feedback":
      return (
        <>
          <Section label="Feedback">
            <CopyBlock lead={r.summary} paragraphs={(r.feedback ?? "").split(/\n{2,}/).filter(Boolean)} />
          </Section>
          <Section label="What works">
            <NumberedList items={r.strengths ?? []} />
          </Section>
          <Section label="What to fix">
            <Alternatives items={r.suggestedActions ?? []} />
          </Section>
        </>
      );
    default:
      return (
        <>
          <Section label="New version">
            <CopyBlock paragraphs={[r.improved]} />
          </Section>
          <Section label="Other versions">
            <Alternatives items={r.alternatives ?? []} />
          </Section>
          <Section label="What changed">
            <NumberedList items={r.keyImprovements ?? []} />
          </Section>
        </>
      );
  }
}

// ---------- Saving ----------

const lines = (title, items) => (items?.length ? [`${title}:`, ...items.map((i) => `- ${i}`)] : []);
const tagLine = (tags) => (tags?.length ? [tags.map((t) => `#${t.replace(/^#/, "")}`).join(" ")] : []);

/** Plain-text version of a result for My Content, plus a short title. */
function toSaved(kind, r) {
  switch (kind) {
    case "social":
      return { title: r.hook, text: [r.hook, r.caption, ...tagLine(r.hashtags)].join("\n\n") };
    case "video":
      return {
        title: r.hook,
        text: [r.hook, r.script, ...lines("Scenes", (r.scenes ?? []).map((s) => `${s.timing} ${s.title}: ${s.description}`))].join("\n\n"),
      };
    case "blog":
      return {
        title: r.titles?.[0],
        text: [r.titles?.[0], ...lines("Outline", r.outline), ...lines("Key points", r.keyPoints), `Keywords: ${(r.keywords ?? []).join(", ")}`].join("\n"),
      };
    case "ad":
      return {
        title: r.headlines?.[0],
        text: [...lines("Headlines", r.headlines), ...lines("Copy", r.copy), `CTAs: ${(r.ctas ?? []).join(", ")}`].join("\n"),
      };
    case "improve":
      if (r.mode === "improvePost") return { title: r.hook, text: [r.hook, r.caption, ...tagLine(r.hashtags)].join("\n\n") };
      if (r.mode === "summarize") return { title: r.summary, text: [r.summary, "", ...lines("Key takeaways", r.takeaways)].join("\n") };
      if (r.mode === "feedback") return { title: `Feedback: ${r.summary}`, text: [r.feedback, "", ...lines("What works", r.strengths), ...lines("What to fix", (r.suggestedActions ?? []).map((a) => `${a.label}: ${a.text}`))].join("\n") };
      return { title: r.improved, text: r.improved };
    case "repurpose":
      return {
        title: r.versions?.[0]?.text,
        text: (r.versions ?? []).map((v) => [`[${v.platform}]`, v.text, ...tagLine(v.hashtags)].join("\n")).join("\n\n"),
      };
    default:
      return { title: "", text: "" };
  }
}

// ---------- Page ----------

// Results that make sense to turn into posts for other platforms, and the Back link
// the Adapt screen shows to return here (the result is still waiting, see creatorDraft).
const ADAPTABLE = {
  social: "Back to your post",
  blog: "Back to your blog post",
  ad: "Back to your ad",
  improve: "Back to your writing",
};

export default function CreatorPage({ kind }) {
  const meta = CONTENT_KINDS[kind];
  const router = useRouter();
  const business = useBusiness();
  const [fields, setFields] = useState(DEFAULTS[kind]);
  const [trend, setTrend] = useState(null);
  const [back, setBack] = useState(true); // where the Back link goes; set by the handoff
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [restored, setRestored] = useState(false); // result came back from an earlier visit
  const [pending, startTransition] = useTransition();
  const { workspaceId } = useAccount();
  const restoreChecked = useRef(false);

  // Opened from "Adapt for other platforms": start with that content filled in
  // (a new task, so an earlier draft isn't brought back).
  useEffect(() => {
    if (kind !== "repurpose") return;
    const handoff = takeAdaptSource();
    if (!handoff) return;
    restoreChecked.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFields((f) => ({ ...f, source: handoff.text }));
    if (handoff.returnTo?.href) setBack(handoff.returnTo);
  }, [kind]);

  // Bring back the last result on this screen, so leaving the page doesn't lose it.
  useEffect(() => {
    if (!workspaceId || restoreChecked.current) return;
    restoreChecked.current = true;
    const draft = loadDraft(workspaceId, kind);
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFields({ ...DEFAULTS[kind], ...draft.fields });
    setResult(draft.result);
    setSavedId(draft.savedId ?? null);
    setGeneratedAt(draft.at);
    setRestored(true);
  }, [workspaceId, kind]);

  // Keep the draft up to date: the latest result, what was typed, and whether it's saved.
  useEffect(() => {
    if (result && generatedAt) saveDraft(workspaceId, kind, { fields, result, savedId, at: generatedAt });
  }, [workspaceId, kind, fields, result, savedId, generatedAt]);

  // Reloading or closing the tab with an unsaved result: ask first.
  useEffect(() => {
    if (!result || savedId) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [result, savedId]);

  const startOver = () => {
    clearDraft(workspaceId, kind);
    setResult(null);
    setSavedId(null);
    setGeneratedAt(null);
    setRestored(false);
    setError(null);
    setFields(DEFAULTS[kind]);
  };

  useEffect(() => {
    const t = loadContentTrend(`/content-creation/${kind}`);
    if (!t) return;
    // Read after mount so server and client markup match on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrend(t);
    if (t.returnTo?.href) setBack(t.returnTo);
    setFields((f) => ({
      ...f,
      ...("idea" in f && !f.idea ? { idea: ideaFromTrend(t) } : {}),
      ...(kind === "video" && O.platform.includes(t.platform) ? { platform: t.platform } : {}),
    }));
  }, [kind]);

  const set = (key) => (value) => setFields((f) => ({ ...f, [key]: value }));

  // Remove, undo or pick a trend. The idea is filled in from the trend unless the
  // user has written their own.
  const changeTrend = (next) => {
    const path = `/content-creation/${kind}`;
    if (!next) {
      clearContentTrend();
      setTrend(null);
      return;
    }
    const entry = { ...next, source: next.source ?? "trend", returnTo: next.returnTo ?? trend?.returnTo ?? null };
    saveContentTrend(entry, { source: entry.source, path, returnTo: entry.returnTo });
    setFields((f) => ({
      ...f,
      ...("idea" in f && (!f.idea || (trend && f.idea === ideaFromTrend(trend))) ? { idea: ideaFromTrend(entry) } : {}),
      ...(kind === "video" && O.platform.includes(entry.platform) ? { platform: entry.platform } : {}),
    }));
    setTrend(entry);
  };

  const run = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateContent(kind, fields, trend, business).catch((err) => ({ error: err.message }));
      if (res.error) return setError(res.error);
      setResult(res.result);
      setSavedId(null);
      setGeneratedAt(Date.now());
      setRestored(false);
    });
  };

  const save = () => {
    const { title, text } = toSaved(kind, result);
    const entry = saveItem({
      kind,
      type: meta.savedType,
      title: String(title ?? meta.card).slice(0, 120),
      text,
      trend: trend?.name ?? null,
    });
    if (entry) setSavedId(entry.id);
    else setError("Couldn't save: your account is still loading. Try again in a moment.");
  };

  return (
    <div className="w-full">
      <PageHeading title={meta.title} description={meta.description} back={back} />

      <div className="grid gap-3.5 lg:grid-cols-[minmax(270px,0.72fr)_minmax(0,1.45fr)]">
        <Panel>
          <PanelLabel
            aside={
              <TrendSlot trend={trend} onChange={changeTrend} />
            }
          >{meta.inputLabel}</PanelLabel>
          <Form kind={kind} f={fields} set={set} />
          <GenerateButton
            label={kind === "improve" ? improveButtonLabel(fields.intent) : meta.generateLabel}
            pending={pending}
            onClick={run}
          />
        </Panel>

        <Panel className="lg:min-h-[560px]">
          <PanelLabel>{meta.resultLabel}</PanelLabel>
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-coral-400/10 px-3 py-2 text-xs text-coral-400">
              {error}
            </p>
          )}
          {pending && !result ? (
            <LoadingState />
          ) : result ? (
            <div className={`flex flex-1 flex-col ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
              {restored && generatedAt && (
                <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sense-blue/[0.06] px-3 py-2 text-xs text-[#3d5053]">
                  <span>
                    Your last result from{" "}
                    {new Date(generatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {savedId ? " · saved to My Content" : " · not saved yet"}
                  </span>
                  <button type="button" onClick={startOver} className="cursor-pointer font-bold text-sense-blue underline">
                    Start over
                  </button>
                </p>
              )}
              <Result kind={kind} r={result} f={fields} />
              <ResultActions
                onRegenerate={run}
                onSave={save}
                onAdapt={
                  ADAPTABLE[kind] && !["summarize", "feedback"].includes(result.mode)
                    ? () => {
                        setAdaptSource(toSaved(kind, result).text, { href: `/content-creation/${kind}`, label: ADAPTABLE[kind] });
                        router.push(ADAPT_PATH);
                      }
                    : undefined
                }
                saved={Boolean(savedId)}
                pending={pending}
                saveLabel="Save"
              />
            </div>
          ) : (
            <EmptyState />
          )}
        </Panel>
      </div>
    </div>
  );
}
