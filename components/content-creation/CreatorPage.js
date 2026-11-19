"use client";

// One Content Creation screen (Social Post, Video, Blog, Ad Copy, Edit Posts,
// Improve Copy, Repurpose, Upload). Layout follows the Figma Make app; results
// are written by Gemini via the generateContent server action.

import { useEffect, useState, useTransition } from "react";
import { generateContent } from "@/app/(dashboard)/content-creation/actions";
import { CONTENT_KINDS, FIELD_OPTIONS as O } from "@/lib/contentKinds";
import { loadContentTrend } from "@/lib/contentTrend";
import { listSaved, saveItem } from "@/lib/savedContent";
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
  SelectedTrendBadge,
  Tabs,
  Tags,
  TextArea,
  TextInput,
  UploadZone,
} from "./ui";

const DEFAULTS = {
  social: { goal: "Awareness", tone: "Professional", idea: "" },
  video: { platform: "Instagram", goal: "Awareness", format: "Short-form", duration: "15 seconds", idea: "" },
  blog: { tone: "Professional", idea: "" },
  ad: { product: "", adGoal: "Awareness", adFormat: "Image Ad", idea: "" },
  edit: { post: "", change: "", instructions: "" },
  improve: { contentType: "Caption", text: "", improve: "", instructions: "" },
  repurpose: { source: "", platforms: ["Instagram", "Blog"], instructions: "" },
  upload: { fileText: "", focus: "Edit", instructions: "" },
};

const ideaFromTrend = (t) =>
  t.hook || `Content that uses the ${t.name} trend${t.audience ? ` to reach ${t.audience}` : ""}.`;

// ---------- Forms ----------

function Form({ kind, f, set }) {
  const ideaPlaceholder = "e.g. A practical story showing how our product saves time for busy teams.";
  const idea = (label = "Describe your idea") => (
    <TextArea label={label} value={f.idea} onChange={set("idea")} placeholder={ideaPlaceholder} className="mt-auto" />
  );

  switch (kind) {
    case "social":
      return (
        <>
          <UploadZone
            label="Upload your post"
            hint="An existing draft as a text file (optional)"
            onText={(text) => set("idea")(text)}
          />
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
            placeholder="e.g. Refillable hotel amenity collection"
          />
          <Select label="Campaign Goal" value={f.adGoal} options={O.adGoal} onChange={set("adGoal")} />
          <Select label="Ad Format" value={f.adFormat} options={O.adFormat} onChange={set("adFormat")} />
          {idea("Key message (optional)")}
        </>
      );
    case "edit":
      return (
        <>
          <UploadZone label="Upload your post" hint="Caption or draft as a text file" onText={(text) => set("post")(text)} />
          <TextArea label="Your post" value={f.post} onChange={set("post")} placeholder="Paste the post you want to edit." />
          <TextArea
            label="What would you like to change?"
            value={f.change}
            onChange={set("change")}
            placeholder="Make this post more engaging and clearer while keeping the professional tone."
            rows={3}
          />
          <TextArea
            label="Specific instructions (optional)"
            value={f.instructions}
            onChange={set("instructions")}
            placeholder="Add one detail about the customer experience and end with a direct next step."
            rows={3}
          />
        </>
      );
    case "improve":
      return (
        <>
          <Select label="Content type" value={f.contentType} options={O.contentType} onChange={set("contentType")} />
          <TextArea label="Your text" value={f.text} onChange={set("text")} placeholder="Paste the text to improve." />
          <TextArea
            label="What would you like to improve?"
            value={f.improve}
            onChange={set("improve")}
            placeholder="Make it more engaging, persuasive, and specific."
            rows={3}
          />
          <TextArea
            label="Additional instructions (optional)"
            value={f.instructions}
            onChange={set("instructions")}
            placeholder="Keep the copy concise and professional."
            rows={3}
          />
        </>
      );
    case "repurpose":
      return <RepurposeForm f={f} set={set} />;
    case "upload":
      return (
        <>
          <UploadZone
            large
            label="Upload your file"
            hint="TXT, MD, CSV or HTML up to 1 MB"
            onText={(text) => set("fileText")(text)}
          />
          <TextArea
            label="Or paste the content"
            value={f.fileText}
            onChange={set("fileText")}
            placeholder="The document text appears here after upload."
            rows={4}
          />
          <ChoiceGrid
            label="What would you like us to focus on?"
            options={O.focus}
            value={f.focus}
            onChange={set("focus")}
            icon={(o) => (o === "Insights" ? "sparkles" : o === "Rewrite" ? "repeat" : "edit")}
          />
          <TextArea
            label="Specific instructions (optional)"
            value={f.instructions}
            onChange={set("instructions")}
            placeholder="Identify the strongest message and recommend practical improvements."
            rows={3}
          />
        </>
      );
    default:
      return null;
  }
}

function RepurposeForm({ f, set }) {
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    // localStorage is only available after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(listSaved());
  }, []);

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
      <TextArea label="Paste your content" value={f.source} onChange={set("source")} placeholder="Paste the content to repurpose." />
      <ChoiceGrid
        multiple
        label="Repurpose for"
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
    case "edit":
      return (
        <>
          <Section label="Enhanced Caption">
            <CopyBlock lead={r.hook} paragraphs={[r.caption]} />
          </Section>
          <Section label="Alternative Options">
            <Alternatives items={r.alternatives ?? []} />
          </Section>
          <Section label="Visual Suggestions (optional)">
            <NumberedList items={r.visualSuggestions ?? []} />
          </Section>
          <Section label="Suggested Hashtags (optional)">
            <Tags items={r.hashtags ?? []} hash />
          </Section>
        </>
      );
    case "improve":
      return (
        <>
          <Section label="Improved Version">
            <CopyBlock paragraphs={[r.improved]} />
          </Section>
          <Section label="Alternative Options">
            <Alternatives items={r.alternatives ?? []} />
          </Section>
          <Section label="Key Improvements">
            <NumberedList items={r.keyImprovements ?? []} />
          </Section>
        </>
      );
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
    case "upload": {
      const active = tab ?? "Result";
      return (
        <>
          <Tabs tabs={["Result", "Summary", "File preview"]} active={active} onChange={setTab} />
          <p className="-mt-2 mb-3.5 text-[11px] text-[#768285]">Analysis focus: {f.focus}</p>
          {active === "Result" && (
            <Section label={f.focus === "Insights" ? "Insights" : `${f.focus} result`}>
              <CopyBlock paragraphs={[r.result]} />
            </Section>
          )}
          {active === "Summary" && (
            <Section label="Summary">
              <CopyBlock paragraphs={[r.summary]} />
            </Section>
          )}
          {active === "File preview" && (
            <Section label="File preview">
              <div className="max-h-[260px] overflow-y-auto rounded-[10px] border border-sense-blue/10 bg-white/70 p-[15px] text-[11px] leading-[1.55] whitespace-pre-line text-[#41585c]">
                {f.fileText}
              </div>
            </Section>
          )}
          <Section label="Suggested Actions">
            <Alternatives items={r.suggestedActions ?? []} />
          </Section>
          <Section label="Key Takeaways">
            <NumberedList items={r.takeaways ?? []} />
          </Section>
        </>
      );
    }
    default:
      return null;
  }
}

// ---------- Saving ----------

const lines = (title, items) => (items?.length ? [`${title}:`, ...items.map((i) => `- ${i}`)] : []);
const tagLine = (tags) => (tags?.length ? [tags.map((t) => `#${t.replace(/^#/, "")}`).join(" ")] : []);

/** Plain-text version of a result for My Content, plus a short title. */
function toSaved(kind, r) {
  switch (kind) {
    case "social":
    case "edit":
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
      return { title: r.improved, text: r.improved };
    case "repurpose":
      return {
        title: r.versions?.[0]?.text,
        text: (r.versions ?? []).map((v) => [`[${v.platform}]`, v.text, ...tagLine(v.hashtags)].join("\n")).join("\n\n"),
      };
    case "upload":
      return { title: r.summary, text: [r.result, "", `Summary: ${r.summary}`].join("\n") };
    default:
      return { title: "", text: "" };
  }
}

// ---------- Page ----------

export default function CreatorPage({ kind }) {
  const meta = CONTENT_KINDS[kind];
  const [fields, setFields] = useState(DEFAULTS[kind]);
  const [trend, setTrend] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = loadContentTrend();
    if (!t) return;
    // Read after mount so server and client markup match on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrend(t);
    setFields((f) => ({
      ...f,
      ...("idea" in f && !f.idea ? { idea: ideaFromTrend(t) } : {}),
      ...(kind === "video" && O.platform.includes(t.platform) ? { platform: t.platform } : {}),
    }));
  }, [kind]);

  const set = (key) => (value) => setFields((f) => ({ ...f, [key]: value }));

  const run = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateContent(kind, fields, trend).catch((err) => ({ error: err.message }));
      if (res.error) return setError(res.error);
      setResult(res.result);
      setSavedId(null);
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
    else setError("Couldn't save: your browser blocked local storage.");
  };

  return (
    <div className="w-full">
      <PageHeading title={meta.title} description={meta.description} />

      <div className="grid gap-3.5 lg:grid-cols-[minmax(270px,0.72fr)_minmax(0,1.45fr)]">
        <Panel>
          <PanelLabel aside={trend && <SelectedTrendBadge trend={trend} />}>{meta.inputLabel}</PanelLabel>
          <Form kind={kind} f={fields} set={set} />
          <GenerateButton label={meta.generateLabel} pending={pending} onClick={run} />
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
              <Result kind={kind} r={result} f={fields} />
              <ResultActions
                onRegenerate={run}
                onSave={save}
                saved={Boolean(savedId)}
                pending={pending}
                saveLabel={kind === "repurpose" ? "Save Version" : kind === "ad" || kind === "upload" ? "Save Content" : kind === "edit" || kind === "improve" ? "Save Changes" : "Save"}
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
