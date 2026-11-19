import Link from "next/link";
import type { ReactNode } from "react";

// Full-width band at the top of a page: optional back link, title,
// description and actions on the right.
export function PageHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="bg-dots border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-6 px-6 py-10 sm:py-12">
        <div className="max-w-2xl">
          {back && (
            <Link
              href={back.href}
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← {back.label}
            </Link>
          )}
          {eyebrow && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
