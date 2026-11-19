import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HeaderNav, HeaderSignIn } from "@/components/header-nav";

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
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white transition-transform group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900">
            F
          </span>
          <span className="hidden text-base font-semibold tracking-tight text-zinc-900 sm:inline dark:text-zinc-50">
            Free NYC
          </span>
        </Link>

        {user && <HeaderNav />}

        <div className="ml-auto">
          {user ? (
            <Link href="/profile" aria-label="Profile" className="block shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  avatarUrl ??
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    user.email ?? "U"
                  )}`
                }
                alt="Your profile"
                className="h-9 w-9 rounded-full border border-zinc-200 object-cover transition-shadow hover:ring-2 hover:ring-zinc-300 dark:border-zinc-700 dark:hover:ring-zinc-600"
              />
            </Link>
          ) : (
            <HeaderSignIn />
          )}
        </div>
      </div>
    </header>
  );
}
