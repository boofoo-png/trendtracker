"use client";

// "Adapt for other platforms", right where the content is: pick platforms, press
// Create versions, and one version per platform appears in tabs, each with Copy,
// Save and Add to calendar. Shown under a result (AdaptPanel) or as a pop-up over My
// Content (AdaptDialog). Uses the "repurpose" content kind on the server.

import { useEffect, useRef, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { generateContent } from "@/app/(dashboard)/content-creation/actions";
import { FIELD_OPTIONS } from "@/lib/contentKinds";
import { useBusiness } from "@/lib/settings";
import { saveItem } from "@/lib/savedContent";
import { lockScroll } from "@/lib/scrollLock";
import AddToCalendar from "./AddToCalendar";
import { ChoiceGrid, CopyBlock, CopyButton, NumberedList, Section, Tabs, Tags } from "./ui";

const tagLine = (tags) => (tags?.length ? `\n\n${tags.map((t) => `#${t.replace(/^#/, "")}`).join(" ")}` : "");
const versionText = (v) => `${v.text}${tagLine(v.hashtags)}`;
const titleOf = (v) => String(v.text ?? "").split("\n")[0].slice(0, 120) || `${v.platform} version`;

/** source: the content to adapt. onClose: hides the panel. */
export function AdaptPanel({ source, onClose, className = "" }) {
  const business = useBusiness();
  const [platforms, setPlatforms] = useState(["Facebook", "TikTok"]);
  const [result, setResult] = useState(null); // { versions }
  const [tab, setTab] = useState(null);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState({}); // platform → My Content id
  const [pending, startTransition] = useTransition();

  const create = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateContent("repurpose", { source, platforms, instructions: "" }, null, business).catch((err) => ({
        error: err.message,
      }));
      if (res.error) return setError(res.error);
      setResult(res.result);
      setTab(null);
      setSavedIds({});
    });
  };

  const versions = result?.versions ?? [];
  const current = versions.find((v) => v.platform === tab) ?? versions[0];

  /** Saves this version to My Content once; returns its id. */
  const save = (v) => {
    if (savedIds[v.platform]) return savedIds[v.platform];
    const entry = saveItem({ kind: "repurpose", type: `${v.platform} version`, title: titleOf(v), text: versionText(v) });
    if (!entry) {
      setError("Couldn't save: your account is still loading. Try again in a moment.");
      return null;
    }
    setSavedIds((s) => ({ ...s, [v.platform]: entry.id }));
    return entry.id;
  };

  return (
    <section
      aria-label="Adapt for other platforms"
      className={`rounded-2xl border border-sense-blue/20 bg-white/70 p-4 motion-safe:animate-[fadeIn_0.2s_ease-out] ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-sense-blue">
            <Icon name="repeat" size={15} /> Adapt for other platforms
          </h3>
          <p className="mt-0.5 text-xs text-[#4b5d60]">Sense AI rewrites it to suit each platform you pick.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 cursor-pointer place-items-center rounded-full text-xl leading-none text-sense-blue hover:bg-sense-blue/10">
          ×
        </button>
      </div>

      <ChoiceGrid
        multiple
        label="Make versions for"
        options={FIELD_OPTIONS.platforms}
        value={platforms}
        onChange={setPlatforms}
        icon={(o) => (o === "Blog" ? "content" : "message")}
      />
      <button
        type="button"
        onClick={create}
        disabled={pending || platforms.length === 0}
        className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[19px] bg-sense-blue px-4 text-xs font-bold text-paper transition hover:bg-sense-blue/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="sparkles" size={14} /> {pending ? "Creating versions…" : result ? "Create again" : "Create versions"}
      </button>
      {platforms.length === 0 && <p className="mt-2 text-xs text-[#4b5d60]">Pick at least one platform.</p>}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-coral-400/10 px-3 py-2 text-xs text-coral-400">
          {error}
        </p>
      )}

      {current && (
        <div className={`mt-5 border-t border-sense-blue/10 pt-4 ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
          <Tabs tabs={versions.map((v) => v.platform)} active={current.platform} onChange={setTab} />
          <Section label={current.platform === "Blog" ? "Blog draft" : `${current.platform} post`}>
            <CopyBlock paragraphs={[current.text]} />
          </Section>
          {current.hashtags?.length > 0 && (
            <Section label="Suggested hashtags (optional)">
              <Tags items={current.hashtags} hash />
            </Section>
          )}
          {current.adjustments?.length > 0 && (
            <Section label="What changed for this platform">
              <NumberedList items={current.adjustments} />
            </Section>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={versionText(current)} label={`Copy ${current.platform} version`} />
            {savedIds[current.platform] ? (
              <span className="inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-xs font-bold text-[#2f6b4f]">
                <Icon name="check" size={13} /> Saved to My Content
              </span>
            ) : (
              <button
                type="button"
                onClick={() => save(current)}
                className="inline-flex min-h-[32px] cursor-pointer items-center rounded-2xl bg-sense-lime px-3.5 text-xs font-bold text-sense-navy hover:opacity-85"
              >
                Save
              </button>
            )}
            {current.platform !== "Blog" && (
              <AddToCalendar
                key={`${current.platform}-${current.text.length}`}
                title={titleOf(current)}
                text={versionText(current)}
                getSavedId={() => save(current)}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** The same panel as a pop-up (for My Content, where cards are too narrow). */
export function AdaptDialog({ source, title, onClose }) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <button type="button" tabIndex={-1} aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-sense-navy/45 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={`Adapt "${title}" for other platforms`} className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[640px] overflow-y-auto rounded-[22px] bg-paper p-2 shadow-[0_24px_60px_rgba(0,31,62,0.35)]">
        <p className="px-3 pt-2 text-xs text-[#4b5d60]">
          Adapting: <strong className="text-sense-navy">{title}</strong>
        </p>
        <AdaptPanel source={source} onClose={onClose} className="border-0 bg-transparent" />
      </div>
    </div>
  );
}
