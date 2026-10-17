import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExploreForm } from "@/components/explore-form";
import { SuggestionFeed } from "@/components/suggestion-feed";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: latestGeneration } = await supabase
    .from("generations")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: suggestions, error: suggestionsError }, { data: votes }] =
    await Promise.all([
      supabase
        .from("suggestions")
        .select(
          "id, generation_id, title, description, neighborhood, transit_directions, created_at"
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

  // "Your latest search" = only the batch from the most recent generation
  // you ran, in the order they were generated.
  const latestItems = latestGeneration
    ? allItems.filter((s) => s.generation_id === latestGeneration.id)
    : [];

  // "Community feed" = everything else (from you and others), ranked by
  // score, so the latest batch doesn't show up twice on screen.
  const communityItems = allItems
    .filter((s) => s.generation_id !== latestGeneration?.id)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Free Things To Do
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          AI-generated, community-voted free activities in NYC reachable by
          public transit.
        </p>

        <ExploreForm />

        {suggestionsError && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Failed to load suggestions: {suggestionsError.message}
          </p>
        )}

        {!suggestionsError && (
          <>
            <h2 className="mt-12 text-xl font-semibold text-black dark:text-zinc-50">
              Your latest search
            </h2>
            <SuggestionFeed
              items={latestItems}
              emptyMessage="Generate your first set of suggestions above."
            />

            <h2 className="mt-12 text-xl font-semibold text-black dark:text-zinc-50">
              Community feed
            </h2>
            <SuggestionFeed
              items={communityItems}
              emptyMessage="No other suggestions yet — check back after more people search."
            />
          </>
        )}
      </div>
    </div>
  );
}
