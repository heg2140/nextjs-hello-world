import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuggestionFeed } from "@/components/suggestion-feed";
import { ACTIVITY_TYPES, NEIGHBORHOODS } from "@/lib/explore-constants";

export const dynamic = "force-dynamic";

const TOP_N_PER_CATEGORY = 3;

type GroupBy = "activity" | "neighborhood";

// Older suggestions were saved before the AI had to pick from NEIGHBORHOODS,
// so match those case-insensitively and fall back to the trimmed text.
function normalizeNeighborhood(raw: string | null) {
  const text = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "Other";
  const match = NEIGHBORHOODS.find((n) => n.toLowerCase() === text.toLowerCase());
  return match ?? text;
}

function sortGroups(keys: string[], canonical: readonly string[]) {
  return [
    ...canonical.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !canonical.includes(k)).sort(),
  ];
}

function exploreHref(groupBy: GroupBy, neighborhood: string | null) {
  const params = new URLSearchParams();
  if (groupBy === "neighborhood") params.set("group", "neighborhood");
  if (neighborhood) params.set("neighborhood", neighborhood);
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { group, neighborhood: neighborhoodParam } = await searchParams;
  const groupBy: GroupBy = group === "neighborhood" ? "neighborhood" : "activity";
  const selectedNeighborhood =
    typeof neighborhoodParam === "string" ? neighborhoodParam : null;

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
    neighborhood: normalizeNeighborhood(s.neighborhood),
    score: votesBySuggestion.get(s.id)?.score ?? 0,
    myVote: votesBySuggestion.get(s.id)?.myVote ?? 0,
  }));

  const neighborhoodCounts = new Map<string, number>();
  for (const item of allItems) {
    neighborhoodCounts.set(
      item.neighborhood,
      (neighborhoodCounts.get(item.neighborhood) ?? 0) + 1
    );
  }
  const neighborhoodOptions = [...neighborhoodCounts.keys()].sort();

  const visibleItems = selectedNeighborhood
    ? allItems.filter((item) => item.neighborhood === selectedNeighborhood)
    : allItems;

  const byCategory = new Map<string, typeof allItems>();
  for (const item of visibleItems) {
    const category =
      groupBy === "neighborhood"
        ? item.neighborhood
        : (item.activity_type ?? "Other");
    const list = byCategory.get(category) ?? [];
    list.push(item);
    byCategory.set(category, list);
  }

  // Render in a stable, predictable order: the canonical activity types or
  // neighborhoods first, then anything else (e.g. older rows).
  const categoryOrder = sortGroups(
    [...byCategory.keys()],
    groupBy === "neighborhood" ? NEIGHBORHOODS : ACTIVITY_TYPES
  );

  const sections = categoryOrder
    .map((category) => ({
      category,
      items: (byCategory.get(category) ?? [])
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N_PER_CATEGORY),
    }))
    .filter((section) => section.items.length > 0);

  const pillClass = (active: boolean) =>
    active
      ? "rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-200 dark:text-zinc-900"
      : "rounded-full border border-black/[.08] bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Free NYC
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              The community&apos;s top-voted free things to do.
            </p>
          </div>
          <Link
            href="/explore/new"
            className="shrink-0 rounded-full bg-zinc-800 px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:scale-[1.03] hover:bg-zinc-700 hover:shadow-lg dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Find something to do
          </Link>
        </div>

        {!suggestionsError && allItems.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Group by
              </span>
              <Link
                href={exploreHref("activity", selectedNeighborhood)}
                className={pillClass(groupBy === "activity")}
              >
                Activity type
              </Link>
              <Link
                href={exploreHref("neighborhood", selectedNeighborhood)}
                className={pillClass(groupBy === "neighborhood")}
              >
                Neighborhood
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Neighborhood
              </span>
              <Link
                href={exploreHref(groupBy, null)}
                className={pillClass(selectedNeighborhood === null)}
              >
                All
              </Link>
              {neighborhoodOptions.map((n) => (
                <Link
                  key={n}
                  href={exploreHref(groupBy, n)}
                  className={pillClass(selectedNeighborhood === n)}
                >
                  {n} ({neighborhoodCounts.get(n)})
                </Link>
              ))}
            </div>
          </div>
        )}

        {suggestionsError && (
          <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Failed to load suggestions: {suggestionsError.message}
          </p>
        )}

        {!suggestionsError && allItems.length > 0 && sections.length === 0 && (
          <p className="mt-12 text-zinc-500 dark:text-zinc-400">
            No suggestions in this neighborhood yet.{" "}
            <Link href={exploreHref(groupBy, null)} className="underline">
              Show all neighborhoods
            </Link>
            .
          </p>
        )}

        {!suggestionsError && allItems.length === 0 && (
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
