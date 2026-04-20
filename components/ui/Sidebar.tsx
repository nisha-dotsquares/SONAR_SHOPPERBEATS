"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLink {
  href: string;
  label: string;
}

interface SidebarProps {
  links: SidebarLink[];
  active?: string;               // selected label
  onChange?: (label: string) => void; // callback when clicked
}

export default function Sidebar({ links, active, onChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <ul>
        {links.map((link) => {
          const isActive =
            active === link.label || pathname.startsWith(link.href) 

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive ? "active" : ""}
                onClick={() => onChange?.(link.label)}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
