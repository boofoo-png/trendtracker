"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const base =
  "flex min-h-[52px] items-center gap-[9px] rounded-l-[18px] px-3.5 text-base font-medium tracking-[-0.015em]";

/** A sidebar link. Without `href` it renders as a not-yet-available item. */
export default function NavItem({ href, icon, iconSize = 20, label }) {
  const pathname = usePathname();
  const active = href && (pathname === href || pathname.startsWith(`${href}/`));
  const content = (
    <>
      <span className="flex size-5 shrink-0 items-center justify-center">
        <Image src={icon} alt="" width={iconSize} height={iconSize} />
      </span>
      <span>{label}</span>
    </>
  );

  if (!href) {
    return (
      <span aria-disabled="true" title="Coming soon" className={`${base} cursor-default`}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${base} transition-colors ${active ? "bg-black/15" : "hover:bg-black/10"}`}
    >
      {content}
    </Link>
  );
}
