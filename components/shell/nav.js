// Main navigation, shared by the desktop sidebar and the phone menu.
export const NAV = [
  { label: "Overview", icon: "/sidebar/overview.svg", href: "/overview" },
  { label: "Competitors", icon: "/sidebar/competitors.svg", iconSize: 15, href: "/competitors" },
  { label: "Audience", icon: "/sidebar/audience.svg", href: "/audience-trends" },
  { label: "Content Creation", icon: "/sidebar/content.svg", href: "/content-creation" },
  { label: "Content Calendar", icon: "/sidebar/calendar.svg", href: "/ai-management" }, // was "AI Management"
  { label: "Reports", icon: "/sidebar/reports.svg", href: "/reports" },
];

// Bottom-of-sidebar links. The "?" Sense AI button sits next to these (SenseButton).
export const UTILITY = [
  { href: "/settings", label: "Settings", icon: "/sidebar/settings.svg", width: 28, height: 27 },
];
