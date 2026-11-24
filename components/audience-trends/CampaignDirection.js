"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { saveContentTrend } from "@/lib/contentTrend";
import Card from "@/components/ui/Card";
import AdviceBadge from "@/components/ui/AdviceBadge";
import ContentAngleCard from "./ContentAngleCard";
import CampaignFocusForm from "./CampaignFocusForm";
import { generateCampaignDirection } from "@/app/(dashboard)/audience-trends/actions";
import { useBusiness } from "@/lib/settings";

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
  const business = useBusiness();
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
      const res = await generateCampaignDirection(trend, forAudiences, focusToSend, attempt, business).catch((err) => ({
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
      id="campaign-direction"
      className="scroll-mt-24"
      eyebrow="Turn it into campaign direction"
      aside={
        <div className="flex flex-wrap justify-end gap-2">
          {angle && (
            <button
              type="button"
              onClick={copyBrief}
              className="cursor-pointer rounded-[18px] border border-sense-blue/20 bg-white/70 text-xs font-bold text-sense-blue transition-colors hover:bg-sense-blue/10 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2"
            >
              {copied ? "Copied ✓" : "Copy brief"}
            </button>
          )}
          <Link
            href="/content-creation"
            onClick={() =>
              saveContentTrend({
                name: selectedTrend.name,
                audience: forAudiences.join(" + "),
                platform: selectedTrend.platform,
                format: selectedTrend.format,
                hook: angle?.headline ?? "",
              }, { source: "trend", path: "/content-creation" })
            }
            className="cursor-pointer rounded-[18px] bg-sense-blue text-xs font-bold text-paper transition-colors hover:bg-sense-blue/85 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2"
          >
            Use in Content
          </Link>
        </div>
      }
    >
      <div className="-mt-2 mb-5">
        {selectedTrend.advice && <AdviceBadge advice={selectedTrend.advice} />}
        <h2 className="mt-2 text-xl font-bold text-sense-blue">
          {selectedTrend.name} × {audienceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-[#4b5d60]">
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
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-sense-blue/25 px-4 py-10 text-center">
          <p className="max-w-md text-sm text-[#4b5d60]">
            {sentFocus
              ? `Get a content angle that promotes ${sentFocus.name} through this trend.`
              : "Get a content angle, a recommended approach and do/avoid guidance for this trend. Add a product, event or offer above to make it specific."}
          </p>
          <button
            type="button"
            onClick={generate}
            className="cursor-pointer rounded-[18px] bg-sense-blue text-xs font-bold text-paper transition-colors hover:bg-sense-blue/85 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4b5d60]">
              Recommended approach
            </p>
            <h3 className="mt-1 text-lg font-bold">{angle?.headline ?? "…"}</h3>
            <p className="mt-1 text-xs text-[#4b5d60]">{angle?.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border-l-4 border-sense-lime bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase">Do</p>
                <p className="mt-1 text-xs text-[#4b5d60]">{angle?.do}</p>
              </div>
              <div className="rounded-xl border-l-4 border-coral-400 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase">Avoid</p>
                <p className="mt-1 text-xs text-[#4b5d60]">{angle?.avoid}</p>
              </div>
            </div>

            <p className="mt-4 text-xs">
              <strong>Why this advice:</strong>{" "}
              <span className="text-[#4b5d60]">{angle?.why}</span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={generate}
                disabled={isPending}
                className="cursor-pointer rounded-[18px] border border-sense-blue/20 bg-white/70 text-xs font-bold text-sense-blue transition-colors hover:bg-sense-blue/10 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2"
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
