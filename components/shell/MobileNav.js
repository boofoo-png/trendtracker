"use client";

// Phone and tablet menu (below the lg breakpoint, where the sidebar is hidden):
// a menu button in the top bar that opens the same navigation as a drawer.

import { lockScroll } from "@/lib/scrollLock";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import NavItem from "./NavItem";
import UtilityLink from "./UtilityLink";
import SenseButton from "./SenseButton";
import { NAV, UTILITY } from "./nav";

const glass =
  "border border-[rgba(246,248,237,0.34)] bg-[rgba(246,248,237,0.18)] text-[#f6f8ed] shadow-[inset_0_1px_0_rgba(246,248,237,0.28),0_10px_25px_rgba(0,31,62,0.1)] backdrop-blur-[18px]";

function Drawer({ onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-sense-navy/45 backdrop-blur-[2px]"
      />
      <aside
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[min(290px,85vw)] flex-col overflow-y-auto rounded-r-[30px] bg-[linear-gradient(160deg,#03525e_0%,#2d6a57_70%,#527d51_100%)] pt-6 pb-6 pl-6 text-paper shadow-[0_0_40px_rgba(0,31,62,0.4)]"
      >
        <div className="flex items-center justify-between pr-4">
          <div className="flex items-center gap-2.5">
            <Image src="/sidebar/logo.svg" alt="" width={36} height={37} />
            <span className="text-lg font-bold">Sixth Sense</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-10 cursor-pointer place-items-center rounded-full text-2xl leading-none transition hover:bg-black/15"
          >
            ×
          </button>
        </div>

        {/* Close on any link tap, including the page you're already on. */}
        <div className="contents" onClick={(e) => e.target.closest("a, [data-closes-menu]") && onClose()}>
        <p className="mt-8 text-[11px] font-medium tracking-[0.15px] opacity-75">WORKSPACE</p>
        <nav aria-label="Main" className="mt-3 flex flex-col gap-1.5">
          {NAV.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-1.5 pt-6">
          {UTILITY.map((item) => (
            <UtilityLink key={item.href} {...item} />
          ))}
          <SenseButton />
        </div>
        </div>
      </aside>
    </div>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState(null); // the path the menu was opened on
  const buttonRef = useRef(null);
  const open = openOn === pathname; // following a link closes it

  // Stable, so the drawer's setup (scroll lock, Escape key) runs once per opening.
  const close = useCallback(() => {
    setOpenOn(null);
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpenOn(pathname)}
        className={`grid size-12 shrink-0 cursor-pointer place-items-center rounded-full transition hover:bg-[rgba(246,248,237,0.28)] lg:hidden ${glass}`}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {open && <Drawer onClose={close} />}
    </>
  );
}
