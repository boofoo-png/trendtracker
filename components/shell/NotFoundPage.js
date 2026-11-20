"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";

export default function NotFoundPage() {
  const pathname = usePathname();

  return (
    <section className="mx-auto grid max-w-[760px] justify-items-center gap-6 rounded-[28px] border border-paper/60 bg-paper/95 px-6 py-12 text-center text-sense-navy shadow-[0_8px_0_rgba(0,31,62,0.16),0_22px_40px_rgba(0,31,62,0.14)] sm:px-12 sm:py-16">
      <span className="grid size-20 place-items-center rounded-[24px] bg-sense-blue shadow-[0_6px_0_rgba(0,31,62,0.2)]">
        <Image src="/sidebar/logo.svg" alt="" width={44} height={45} />
      </span>

      <div className="grid gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5f706e]">Error 404</p>
        <h1 className="text-[clamp(26px,4vw,40px)] font-semibold tracking-[-0.03em] text-sense-blue">
          This page doesn&apos;t exist
        </h1>
        <p className="mx-auto max-w-[480px] text-sm leading-[1.6] text-[#41585c]">
          Sense AI looked everywhere, but there&apos;s nothing at{" "}
          <code className="rounded-md bg-sense-blue/10 px-1.5 py-0.5 text-[13px] break-all text-sense-blue">{pathname}</code>. The
          link may be old or mistyped.
        </p>
      </div>

      <Link
        href="/overview"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[22px] bg-sense-lime px-6 text-[11px] font-extrabold uppercase text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] transition hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)]"
      >
        Back to Overview
      </Link>

      <div className="grid w-full gap-3 border-t border-sense-blue/15 pt-6">
        <p className="text-xs font-semibold text-[#5f706e]">Or jump to</p>
        <nav aria-label="Pages" className="flex flex-wrap justify-center gap-2">
          {NAV.filter((item) => item.href !== "/overview").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-sense-blue/20 bg-white/70 px-4 py-2 text-xs font-semibold text-sense-blue transition hover:bg-sense-blue hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-[11px] text-[#5f706e]">You can also use the search bar at the top to find any page.</p>
      </div>
    </section>
  );
}
