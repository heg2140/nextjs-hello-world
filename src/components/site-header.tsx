import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/[.08] bg-zinc-50/80 backdrop-blur dark:border-white/[.145] dark:bg-black/80">
      <div className="mx-auto flex max-w-3xl items-center px-6 py-3">
        <Link
          href="/"
          className="text-sm font-medium text-black transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
        >
          ← Home
        </Link>
      </div>
    </header>
  );
}
