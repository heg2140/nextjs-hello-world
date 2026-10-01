import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Hello World
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Deployed with Next.js on Vercel.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/tasks"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          View Tasks
        </Link>

        {user ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.08]"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.08]"
            >
              Profile
            </Link>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.08]"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
