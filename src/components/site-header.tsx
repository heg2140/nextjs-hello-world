import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
        >
          Free NYC
        </Link>

        {user ? (
          <Link href="/profile" aria-label="Profile" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                avatarUrl ??
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                  user.email ?? "U"
                )}`
              }
              alt="Your profile"
              className="h-8 w-8 rounded-full border border-black/[.08] object-cover dark:border-white/[.145]"
            />
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
