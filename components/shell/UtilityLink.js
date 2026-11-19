"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openSettingsSection } from "@/lib/settings";

/** Icon-only link at the bottom of the sidebar (Settings, Alerts). */
export default function UtilityLink({ href, label, icon, width, height }) {
  const pathname = usePathname();
  const [path, section] = href.split("#");
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={pathname === path && !section ? "page" : undefined}
      onClick={() => section && openSettingsSection(section)}
      className={`grid size-10 place-items-center rounded-full transition hover:bg-black/10 ${pathname === path && !section ? "bg-black/15" : ""}`}
    >
      <Image src={icon} alt="" width={width} height={height} />
    </Link>
  );
}
