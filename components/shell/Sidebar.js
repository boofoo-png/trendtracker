import Image from "next/image";
import NavItem from "./NavItem";
import UtilityLink from "./UtilityLink";

const NAV = [
  { label: "Overview", icon: "/sidebar/overview.svg", href: "/overview" },
  { label: "Audience", icon: "/sidebar/audience.svg", href: "/audience-trends" },
  { label: "Competitors", icon: "/sidebar/competitors.svg", iconSize: 15, href: "/competitors" },
  { label: "Content Creation", icon: "/sidebar/content.svg", href: "/content-creation" },
  { label: "AI Management", icon: "/sidebar/ai.svg", href: "/ai-management" },
  { label: "Reports", icon: "/sidebar/reports.svg", href: "/reports" },
];

// Sizes follow the Figma Make app (16px nav text, 18px brand); the layout and
// icons follow the SIXTH SENSE design file. Fits the viewport without scrolling.
export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col overflow-hidden rounded-r-[34px] bg-[rgba(246,248,237,0.2)] pt-7 pb-6 pl-[27px] text-[#f6f8ed] lg:flex print:hidden">
      <div className="flex items-center gap-2.5 pl-[3px]">
        <Image src="/sidebar/logo.svg" alt="" width={40} height={41} priority />
        <span className="text-lg font-bold tracking-[0.15px]">Sixth Sense</span>
      </div>

      <p className="mt-10 pl-[3px] text-[11px] font-medium tracking-[0.15px] opacity-75">WORKSPACE</p>

      <nav aria-label="Main" className="mt-3 flex flex-col gap-2">
        {NAV.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-1.5 pt-4 pl-1.5">
        <UtilityLink href="/settings" label="Settings" icon="/sidebar/settings.svg" width={28} height={27} />
        <UtilityLink href="/settings#notifications" label="Alert settings" icon="/sidebar/alert.svg" width={24} height={23} />
      </div>
    </aside>
  );
}
