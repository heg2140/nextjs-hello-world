import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuggestionFeed } from "@/components/suggestion-feed";
import { PageHeader } from "@/components/page-header";
import { loadSavedIds } from "@/lib/saved";
import {
  ACTIVITY_TYPES,
  NEAR_COLUMBIA_LABEL,
  activityIcon,
  isNearColumbia,
} from "@/lib/explore-constants";

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

  const [{ data: suggestions, error: suggestionsError }, { data: votes }, savedIds] =
    await Promise.all([
      supabase
        .from("suggestions")
        .select(
          "id, activity_type, title, description, neighborhood, transit_directions, created_at"
        )
        .order("created_at", { ascending: true }),
      supabase.from("votes").select("suggestion_id, user_id, value"),
      loadSavedIds(supabase, user.id),
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
    isSaved: savedIds.has(s.id),
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

  const topByScore = (items: typeof allItems) =>
    [...items].sort((a, b) => b.score - a.score).slice(0, TOP_N_PER_CATEGORY);

  // "Near Columbia" goes first and spans every activity type, so a suggestion
  // can appear both here and in its own category.
  const sections = [
    {
      category: NEAR_COLUMBIA_LABEL,
      items: topByScore(allItems.filter((item) => isNearColumbia(item.neighborhood))),
    },
    ...categoryOrder.map((category) => ({
      category,
      items: topByScore(byCategory.get(category) ?? []),
    })),
  ].filter((section) => section.items.length > 0);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Explore"
        title="Top-voted free things to do"
        description={`The community's ${TOP_N_PER_CATEGORY} favorite picks in each category, ranked by votes.`}
        actions={
          <Link
            href="/explore/new"
            className="inline-block rounded-full bg-zinc-900 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Find something to do
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-6 pb-20">
        {sections.length > 0 && (
          <nav className="flex flex-wrap gap-2 pt-8">
            {sections.map((section) => (
              <a
                key={section.category}
                href={`#${encodeURIComponent(section.category)}`}
                className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-50"
              >
                {activityIcon(section.category)} {section.category}
              </a>
            ))}
          </nav>
        )}

        {suggestionsError && (
          <p className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Failed to load suggestions: {suggestionsError.message}
          </p>
        )}

        {!suggestionsError && sections.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Nothing here yet</p>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              <Link href="/explore/new" className="underline">
                Generate the first suggestions
              </Link>{" "}
              and they&apos;ll show up here.
            </p>
          </div>
        )}

        {!suggestionsError &&
          sections.map((section) => (
            <section
              key={section.category}
              id={encodeURIComponent(section.category)}
              className="mt-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                  {activityIcon(section.category)}
                </span>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {section.category}
                </h2>
              </div>
              <SuggestionFeed items={section.items} showRank />
            </section>
          ))}
      </div>
    </main>
  );
}
