"use client";

// Sense AI assistant drawer, based on the Figma Make "Sense AI" panel. Opens from the
// sidebar's help button or the top bar search (openSense in lib/assistant/shared.js).
// Answers come from Gemini using the workspace: business profile, latest trends,
// calendar, saved content, campaign draft and the (labelled) sample figures.

import { lockScroll } from "@/lib/scrollLock";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { askSense } from "@/app/actions/assistant";
import { SENSE_EVENT, STARTER_PROMPTS } from "@/lib/assistant/shared";
import { saveContentTrend } from "@/lib/contentTrend";
import { listCalendar, listSaved } from "@/lib/contentStore";
import { channelLabel, toISODate } from "@/lib/calendar";
import { useBusiness } from "@/lib/settings";
import useAudiences from "@/lib/useAudiences";

const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

/** What only this browser knows, sent along with each question. */
function browserContext(pathname, selectedAudiences) {
  const today = toISODate(new Date());
  const calendar = listCalendar();
  const campaign = readJSON("trendtracker:campaign", {});
  return {
    page: pathname,
    audiences: selectedAudiences,
    upcomingPosts: (Array.isArray(calendar) ? calendar : [])
      .filter((p) => p.date >= today)
      .slice(0, 6)
      .map((p) => ({ date: p.date, time: p.time, channel: channelLabel(p), title: p.title })),
    savedContent: listSaved()
      .slice(0, 10)
      .map(({ type, title }) => ({ type, title })),
    campaign: campaign.plan
      ? {
          name: campaign.plan.name,
          coreMessage: campaign.plan.coreMessage,
          goal: campaign.brief?.goal,
          audience: campaign.brief?.audienceName || (campaign.brief?.segments ?? []).join(", "),
        }
      : null,
  };
}

/** Paragraphs, "- " bullet lists and **bold**. React escapes everything else. */
function Answer({ text }) {
  const inline = (line) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    );
  return (
    <div className="grid gap-2.5 text-[13px] leading-[1.6]">
      {text.split(/\n\s*\n/).map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="grid list-disc gap-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

function Message({ message, onFollowUp, onAction, last }) {
  if (message.role === "user") {
    return (
      <div className="ml-10 self-end rounded-[16px] rounded-br-[5px] bg-sense-lime px-3.5 py-2.5 text-[13px] text-sense-navy">
        {message.text}
      </div>
    );
  }
  if (message.error) {
    return (
      <div role="alert" className="mr-6 rounded-[16px] bg-[#ff7f7f] px-3.5 py-3 text-[12px] font-semibold text-sense-navy">
        {message.error}
      </div>
    );
  }
  return (
    <div className="mr-4 grid gap-3 rounded-[16px] rounded-bl-[5px] bg-paper px-4 py-3.5 text-sense-navy shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sense-blue">
        <Icon name="sparkles" size={13} /> Sense AI
      </span>
      <Answer text={message.text} />
      {message.action && (
        <button
          type="button"
          onClick={() => onAction(message.action)}
          className="inline-flex min-h-9 w-fit cursor-pointer items-center gap-1.5 rounded-[18px] bg-sense-blue px-4 text-[11px] font-bold text-paper transition hover:bg-sense-blue/85"
        >
          {message.action.label} <Icon name="chevron" size={13} />
        </button>
      )}
      {last && message.followUps?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-sense-blue/10 pt-3">
          {message.followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFollowUp(f)}
              className="cursor-pointer rounded-2xl border border-sense-blue/20 bg-white/70 px-3 py-1.5 text-left text-[11px] font-semibold text-sense-blue transition hover:bg-sense-blue hover:text-paper"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Drawer({ onClose, messages, setMessages, initialQuestion }) {
  const pathname = usePathname();
  const router = useRouter();
  const business = useBusiness();
  const { audiences: selectedAudiences } = useAudiences();
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const askedInitial = useRef(false);

  const send = useCallback(
    (text) => {
      const question = text.trim().slice(0, 1200);
      if (!question || pending) return;
      const history = [...messages.filter((m) => !m.error), { role: "user", text: question }];
      setMessages((m) => [...m, { role: "user", text: question }]);
      setInput("");
      startTransition(async () => {
        const res = await askSense(
          history.map(({ role, text: t }) => ({ role, text: t })),
          browserContext(pathname, selectedAudiences),
          business,
        ).catch((err) => ({ error: err.message }));
        setMessages((m) => [
          ...m,
          res.error
            ? { role: "assistant", error: res.error }
            : { role: "assistant", text: res.reply.answer, followUps: res.reply.followUps, action: res.reply.action },
        ]);
      });
    },
    [messages, pending, pathname, business, selectedAudiences, setMessages],
  );

  // Escape closes; the page behind doesn't scroll while the drawer is open.
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);

  // A question passed in from the top bar search is asked straight away.
  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true;
      send(initialQuestion);
    }
  }, [initialQuestion, send]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const runAction = (action) => {
    if (action.kind === "create") {
      saveContentTrend(
        { name: action.ideaTitle, audience: "", platform: "", format: "", hook: action.ideaBrief },
        { source: "assistant", path: action.target },
      );
    }
    onClose();
    // Already on that creator: reload it so it picks up the idea.
    if (action.target === pathname && action.kind === "create") window.location.assign(action.target);
    else router.push(action.target);
  };

  const lastAssistant = messages.findLastIndex((m) => m.role === "assistant");

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" tabIndex={-1} aria-label="Close Sense AI" onClick={onClose} className="absolute inset-0 cursor-default bg-sense-navy/45 backdrop-blur-[2px]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sense AI assistant"
        className="absolute inset-y-0 right-0 flex w-[min(440px,100%)] flex-col bg-sense-navy bg-[image:radial-gradient(circle_at_90%_8%,rgba(221,254,86,0.16),transparent_30%)] text-paper shadow-[-18px_0_50px_rgba(0,31,63,0.35)]"
      >
        <header className="flex items-center gap-3 border-b border-paper/15 px-5 py-4">
          <span className="grid size-10 shrink-0 -rotate-[5deg] place-items-center rounded-xl bg-sense-lime text-sense-navy">
            <Icon name="sparkles" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Sense AI</p>
            <p className="text-[11px] text-paper/80">Your marketing research assistant</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={pending}
              className="cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold text-paper/80 transition hover:bg-paper/10 disabled:opacity-50"
            >
              New chat
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close assistant" className="grid size-9 cursor-pointer place-items-center rounded-full text-2xl leading-none font-light text-paper/80 transition hover:bg-paper/10">
            ×
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 && (
            <>
              <div className="rounded-[14px] bg-[radial-gradient(circle_at_90%_15%,rgba(221,254,86,0.28),transparent_38%),linear-gradient(135deg,#03525e,#0b3a52)] p-5 shadow-[0_6px_0_rgba(0,0,0,0.18)]">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-[#ff7f7f]">Ask about your market</p>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">What would you like to understand?</h2>
                <p className="mt-2 text-xs leading-[1.6] text-paper/85">
                  I can connect audience, competitor, content and performance signals from your workspace.
                </p>
              </div>
              <div className="grid gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-transparent bg-paper px-4 text-left text-[13px] font-semibold text-sense-navy shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:border-sense-lime hover:text-sense-blue"
                  >
                    {p}
                    <Icon name="chevron" size={14} />
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((m, i) => (
            <Message key={i} message={m} last={i === lastAssistant && !pending} onFollowUp={send} onAction={runAction} />
          ))}

          {pending && (
            <div role="status" className="mr-16 grid gap-2 rounded-[16px] rounded-bl-[5px] bg-paper px-4 py-3.5">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sense-blue">
                <Icon name="sparkles" size={13} /> Sense AI is thinking…
              </span>
              <span className="h-2.5 w-11/12 animate-pulse rounded bg-sense-blue/15" />
              <span className="h-2.5 w-2/3 animate-pulse rounded bg-sense-blue/15" />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <footer className="border-t border-paper/15 px-5 pt-3.5 pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) send(input);
              else inputRef.current?.focus();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={1200}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              aria-label="Ask a question about your market"
              placeholder="Ask a question about your market"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] border-2 border-transparent bg-paper px-4 py-2.5 text-[13px] text-sense-navy outline-none placeholder:text-[#6b7b7d] focus:border-sense-lime"
            />
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 min-w-[68px] shrink-0 cursor-pointer rounded-[22px] bg-sense-lime px-5 text-[11px] font-extrabold uppercase text-sense-navy shadow-[0_4px_0_rgba(0,0,0,0.25)] transition hover:translate-y-px hover:shadow-[0_3px_0_rgba(0,0,0,0.25)] disabled:cursor-wait"
            >
              {pending ? "…" : "Ask"}
            </button>
          </form>
          <p className="mt-2 text-[10px] text-paper/75">
            Uses your trends, calendar, saved content and settings. Sample figures are labelled as such.
          </p>
        </footer>
      </aside>
    </div>
  );
}

/** Mounted once in the app shell; listens for openSense() calls. */
export default function SenseAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]); // kept while you move between pages
  const opener = useRef(null);

  useEffect(() => {
    const onOpen = (e) => {
      opener.current = document.activeElement;
      setQuestion(e.detail?.question ?? "");
      setOpen(true);
    };
    window.addEventListener(SENSE_EVENT, onOpen);
    return () => window.removeEventListener(SENSE_EVENT, onOpen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuestion("");
    opener.current?.focus?.();
  }, []);

  if (!open) return null;
  return <Drawer key={question} onClose={close} messages={messages} setMessages={setMessages} initialQuestion={question} />;
}
