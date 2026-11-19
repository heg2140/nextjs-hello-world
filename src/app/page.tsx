import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Illustrative cards for the hero; real suggestions live on /explore.
const PREVIEW = [
  {
    icon: "🌳",
    title: "Walk the Little Island piers",
    neighborhood: "Chelsea",
    transit: "1 train to 14 St, walk west",
    score: 24,
  },
  {
    icon: "🎨",
    title: "Free evening hours at a museum",
    neighborhood: "Upper East Side",
    transit: "Q train to 86 St",
    score: 18,
  },
  {
    icon: "📸",
    title: "Sunset from the Brooklyn Bridge",
    neighborhood: "DUMBO",
    transit: "F train to York St",
    score: 31,
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-dots flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-zinc-50">
              Free NYC
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              AI-curated, student-voted free things to do around the city.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/explore/new"
                    className="rounded-full bg-zinc-900 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    Find something to do
                  </Link>
                  <Link
                    href="/explore"
                    className="rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Explore top picks
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-zinc-900 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          <div aria-hidden className="relative hidden lg:block">
            <div className="flex flex-col gap-4">
              {PREVIEW.map((card, i) => (
                <div
                  key={card.title}
                  className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  style={{ marginLeft: `${i * 2}rem`, marginRight: `${(2 - i) * 2}rem` }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
                    {card.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{card.title}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {card.neighborhood}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">🚇 {card.transit}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    ▲ {card.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
