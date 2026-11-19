// Main navigation, shared by the desktop sidebar and the phone menu.
export const NAV = [
  { label: "Overview", icon: "/sidebar/overview.svg", href: "/overview" },
  { label: "Audience", icon: "/sidebar/audience.svg", href: "/audience-trends" },
  { label: "Competitors", icon: "/sidebar/competitors.svg", iconSize: 15, href: "/competitors" },
  { label: "Content Creation", icon: "/sidebar/content.svg", href: "/content-creation" },
  { label: "AI Management", icon: "/sidebar/ai.svg", href: "/ai-management" },
  { label: "Reports", icon: "/sidebar/reports.svg", href: "/reports" },
];

export const UTILITY = [
  { href: "/settings", label: "Settings", icon: "/sidebar/settings.svg", width: 28, height: 27 },
  { href: "/settings#notifications", label: "Alert settings", icon: "/sidebar/alert.svg", width: 24, height: 23 },
];
