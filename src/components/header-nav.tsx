"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/explore", label: "Explore" },
  // "Find something" is shortened to "Find" on phones so the header fits.
  { href: "/explore/new", label: "Find", extra: " something" },
  { href: "/saved", label: "Saved" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label, extra }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? "rounded-full bg-zinc-100 px-2.5 py-1.5 sm:px-3 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "rounded-full px-2.5 py-1.5 sm:px-3 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }
          >
            {label}
            {extra && <span className="hidden sm:inline">{extra}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

// The homepage has its own Sign in button, so skip the header one there.
export function HeaderSignIn() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href="/login"
      className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      Sign in
    </Link>
  );
}
