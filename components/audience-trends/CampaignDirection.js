"use client";

import { useEffect, useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import AdviceBadge from "@/components/ui/AdviceBadge";
import ContentAngleCard from "./ContentAngleCard";
import CampaignFocusForm from "./CampaignFocusForm";
import { generateCampaignDirection } from "@/app/(dashboard)/audience-trends/actions";

// Gemini runs only when a Generate / Regenerate button is pressed.
// Results are kept per trend × audience × focus for this session.

const FOCUS_KEY = "trendtracker:campaign-focus";
const EMPTY_FOCUS = { type: "Product", name: "", details: "" };

/** The focus sent to Gemini, or null for general brand awareness. */
function activeFocus(focus) {
  if (focus.type === "General brand" || !focus.name.trim()) return null;
  return { type: focus.type, name: focus.name.trim(), details: focus.details.trim() };
}

export default function CampaignDirection({ selectedTrend, audiences, liveAudiences }) {
  const [results, setResults] = useState({}); // key → { angle, error, attempt }
  const [pendingKey, setPendingKey] = useState(null);
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [focus, setFocus] = useState(EMPTY_FOCUS);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FOCUS_KEY) ?? "null");
      // Read after mount so server and client markup match on hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved?.type) setFocus({ ...EMPTY_FOCUS, ...saved });
    } catch {}
  }, []);

  const updateFocus = (next) => {
    setFocus(next);
    try {
      localStorage.setItem(FOCUS_KEY, JSON.stringify(next));
    } catch {}
  };

  if (!selectedTrend) return null;

  const forAudiences = audiences.length ? audiences : (liveAudiences ?? []);
  const sentFocus = activeFocus(focus);
  const focusKey = sentFocus ? `${sentFocus.type}:${sentFocus.name}:${sentFocus.details}` : "brand";
  const key = `${selectedTrend.id}::${[...forAudiences].sort().join("|")}::${focusKey}`;
  const entry = results[key];
  // The sample trend's hand-written angle only applies to the general-brand case.
  const angle = entry?.angle ?? (sentFocus ? null : selectedTrend.angle) ?? null;
  const isPending = pendingKey === key;
  const audienceLabel = forAudiences.length ? forAudiences.join(" + ") : "your audience";

  const generate = () => {
    const trend = selectedTrend;
    const focusToSend = sentFocus;
    const attempt = entry ? (entry.attempt ?? 0) + 1 : 0;
    setPendingKey(key);
    startTransition(async () => {
      const res = await generateCampaignDirection(trend, forAudiences, focusToSend, attempt).catch((err) => ({
        error: err.message,
      }));
      setResults((prev) => ({
        ...prev,
        [key]: res.angle
          ? { angle: res.angle, attempt }
          : { ...prev[key], error: res.error ?? "Couldn't generate a direction.", attempt },
      }));
      setPendingKey((k) => (k === key ? null : k));
    });
  };

  const copyBrief = async () => {
    const text = [
      `${selectedTrend.name} × ${audienceLabel}`,
      sentFocus ? `Promoting (${sentFocus.type}): ${sentFocus.name}${sentFocus.details ? ` (${sentFocus.details})` : ""}` : null,
      `Angle: ${angle.headline}`,
      angle.summary,
      `Do: ${angle.do}`,
      `Avoid: ${angle.avoid}`,
      `Why: ${angle.why}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Card
      eyebrow="Turn it into campaign direction"
      aside={
        <div className="flex flex-wrap justify-end gap-2">
          {angle && (
            <button
              type="button"
              onClick={copyBrief}
              className="rounded-md bg-white px-3 py-2 text-xs font-medium"
            >
              {copied ? "Copied ✓" : "Copy brief"}
            </button>
          )}
          <button
            type="button"
            disabled
            title="The Campaigns page isn't built yet"
            className="rounded-md bg-teal-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Use in Campaigns
          </button>
        </div>
      }
    >
      <div className="-mt-2 mb-5">
        {selectedTrend.advice && <AdviceBadge advice={selectedTrend.advice} />}
        <h2 className="mt-2 text-xl font-medium">
          {selectedTrend.name} × {audienceLabel}
        </h2>
        <p className="mt-1 text-[11px] text-ink-500">
          {selectedTrend.platform} · {selectedTrend.format} · momentum {selectedTrend.momentum}
          {" "}({selectedTrend.change >= 0 ? "+" : ""}
          {selectedTrend.change}%)
          {sentFocus && (
            <>
              {" · "}promoting <strong className="text-teal-900">{sentFocus.name}</strong>
            </>
          )}
        </p>
      </div>

      <div className="mb-5">
        <CampaignFocusForm focus={focus} onChange={updateFocus} disabled={isPending} />
      </div>

      {!angle && !isPending ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-black/15 px-4 py-10 text-center">
          <p className="max-w-md text-sm text-ink-500">
            {sentFocus
              ? `Get a content angle that promotes ${sentFocus.name} through this trend.`
              : "Get a content angle, a recommended approach and do/avoid guidance for this trend. Add a product, event or offer above to make it specific."}
          </p>
          <button
            type="button"
            onClick={generate}
            className="rounded-md bg-teal-900 px-4 py-2 text-xs font-semibold text-white"
          >
            ✦ Generate campaign direction
          </button>
          {entry?.error && (
            <p role="alert" className="text-xs text-coral-400">
              {entry.error}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <ContentAngleCard angle={angle} loading={isPending} />

          <div aria-busy={isPending} className={isPending ? "opacity-50" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Recommended approach
            </p>
            <h3 className="mt-1 text-lg font-medium">{angle?.headline ?? "…"}</h3>
            <p className="mt-1 text-xs text-ink-500">{angle?.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border-l-4 border-lime-400 bg-white/80 p-3">
                <p className="text-[10px] font-semibold uppercase">Do</p>
                <p className="mt-1 text-xs text-ink-500">{angle?.do}</p>
              </div>
              <div className="rounded-md border-l-4 border-coral-400 bg-white/80 p-3">
                <p className="text-[10px] font-semibold uppercase">Avoid</p>
                <p className="mt-1 text-xs text-ink-500">{angle?.avoid}</p>
              </div>
            </div>

            <p className="mt-4 text-xs">
              <strong>Why this advice:</strong>{" "}
              <span className="text-ink-500">{angle?.why}</span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={generate}
                disabled={isPending}
                className="rounded-md bg-white px-3 py-2 text-xs font-medium disabled:opacity-50"
              >
                {isPending ? "✦ Writing…" : entry?.angle ? "✦ Regenerate" : "✦ Generate with AI"}
              </button>
              {entry?.error && (
                <p role="alert" className="text-xs text-coral-400">
                  {entry.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
