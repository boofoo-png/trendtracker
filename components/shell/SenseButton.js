"use client";

import Image from "next/image";
import { openSense } from "@/lib/assistant/shared";

/**
 * Sidebar "Help and Sense AI" button (the ? icon in the Figma Make design).
 * Solid navy, like the settings gear beside it (both from the SIXTH SENSE design file).
 */
export default function SenseButton() {
  return (
    <button
      type="button"
      onClick={() => openSense()}
      data-closes-menu
      title="Help and Sense AI"
      aria-label="Open Sense AI assistant"
      className="grid size-10 cursor-pointer place-items-center rounded-full transition hover:bg-black/10"
    >
      <Image src="/sidebar/help.svg" alt="" width={26} height={26} />
    </button>
  );
}
