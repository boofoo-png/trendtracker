import Link from "next/link";

export default function NavItem({ href, icon, label, active = false }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
