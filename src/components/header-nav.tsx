"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/explore/new", label: "Find something" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? "rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
