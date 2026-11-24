"use client";

// Small ⓘ button that explains a metric. Shows on hover, keyboard focus, or tap.
// The explanation is drawn at the top level of the page (a portal), so it's never
// hidden behind neighbouring cards, and it's kept inside the screen.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WIDTH = 240;

export default function InfoTip({ label, children }) {
  const id = useId();
  const buttonRef = useRef(null);
  const [pos, setPos] = useState(null); // { top, left } while showing
  const [pinned, setPinned] = useState(false); // opened by a tap/click

  const show = useCallback(() => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(WIDTH, window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left + r.width / 2 - width / 2), window.innerWidth - width - 12);
    setPos({ top: r.bottom + 6, left, width });
  }, []);
  const hide = useCallback(() => {
    setPos(null);
    setPinned(false);
  }, []);

  useEffect(() => {
    if (!pos) return;
    const onDown = (e) => !buttonRef.current?.contains(e.target) && hide();
    const onKey = (e) => e.key === "Escape" && hide();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [pos, hide]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`What is ${label}?`}
        aria-describedby={pos ? id : undefined}
        aria-expanded={Boolean(pos)}
        onMouseEnter={show}
        onMouseLeave={() => !pinned && hide()}
        onFocus={show}
        onBlur={hide}
        onClick={() => {
          if (pinned) return hide();
          show();
          setPinned(true);
        }}
        className="ml-1 inline-grid size-5 cursor-help place-items-center rounded-full align-[-3px] text-sense-blue/70 transition hover:bg-sense-blue/10 hover:text-sense-blue focus-visible:outline-2 focus-visible:outline-sense-blue"
      >
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      </button>
      {pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="pointer-events-none fixed z-[60] rounded-xl bg-sense-navy px-3 py-2.5 text-left text-[13px] leading-[1.5] font-normal text-paper shadow-[0_10px_24px_rgba(0,31,62,0.3)]"
          >
            {children}
          </span>,
          document.body,
        )}
    </>
  );
}
