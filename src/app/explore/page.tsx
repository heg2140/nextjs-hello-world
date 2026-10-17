import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuggestionFeed } from "@/components/suggestion-feed";
import { ACTIVITY_TYPES } from "@/lib/explore-constants";

export const dynamic = "force-dynamic";

const TOP_N_PER_CATEGORY = 3;

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: suggestions, error: suggestionsError }, { data: votes }] =
    await Promise.all([
      supabase
        .from("suggestions")
        .select(
          "id, activity_type, title, description, neighborhood, transit_directions, created_at"
        )
        .order("created_at", { ascending: true }),
      supabase.from("votes").select("suggestion_id, user_id, value"),
    ]);

  const votesBySuggestion = new Map<number, { score: number; myVote: number }>();
  for (const vote of votes ?? []) {
    const entry = votesBySuggestion.get(vote.suggestion_id) ?? {
      score: 0,
      myVote: 0,
    };
    entry.score += vote.value;
    if (vote.user_id === user.id) {
      entry.myVote = vote.value;
    }
    votesBySuggestion.set(vote.suggestion_id, entry);
  }

  const allItems = (suggestions ?? []).map((s) => ({
    ...s,
    score: votesBySuggestion.get(s.id)?.score ?? 0,
    myVote: votesBySuggestion.get(s.id)?.myVote ?? 0,
  }));

  const byCategory = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const category = item.activity_type ?? "Other";
    const list = byCategory.get(category) ?? [];
    list.push(item);
    byCategory.set(category, list);
  }

  // Render in a stable, predictable order: the canonical activity types
  // first, then anything else (e.g. older rows without a category).
  const categoryOrder = [
    ...ACTIVITY_TYPES,
    ...[...byCategory.keys()].filter(
      (c) => !(ACTIVITY_TYPES as readonly string[]).includes(c)
    ),
  ];

  const sections = categoryOrder
    .map((category) => ({
      category,
      items: (byCategory.get(category) ?? [])
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N_PER_CATEGORY),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Free NYC
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              The community&apos;s top-voted free things to do, by category.
            </p>
          </div>
          <Link
            href="/explore/new"
            className="shrink-0 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Find something to do
          </Link>
        </div>

        {suggestionsError && (
          <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Failed to load suggestions: {suggestionsError.message}
          </p>
        )}

        {!suggestionsError && sections.length === 0 && (
          <p className="mt-12 text-zinc-500 dark:text-zinc-400">
            Nothing here yet —{" "}
            <Link href="/explore/new" className="underline">
              generate the first suggestions
            </Link>
            .
          </p>
        )}

        {!suggestionsError &&
          sections.map((section) => (
            <div key={section.category} className="mt-12">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {section.category}
              </h2>
              <SuggestionFeed items={section.items} />
            </div>
          ))}
      </div>
    </div>
  );
}
