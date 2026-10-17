import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExploreForm } from "@/components/explore-form";
import { SuggestionFeed } from "@/components/suggestion-feed";

export const dynamic = "force-dynamic";

export default async function NewSearchPage() {
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

  let latestItems: Array<{
    id: number;
    title: string;
    description: string;
    neighborhood: string;
    transit_directions: string;
    created_at: string;
    score: number;
    myVote: number;
  }> = [];

  if (latestGeneration) {
    const [{ data: suggestions }, { data: votes }] = await Promise.all([
      supabase
        .from("suggestions")
        .select(
          "id, title, description, neighborhood, transit_directions, created_at"
        )
        .eq("generation_id", latestGeneration.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("votes")
        .select("suggestion_id, user_id, value")
        .eq("user_id", user.id),
    ]);

    const myVoteBySuggestion = new Map<number, number>();
    for (const vote of votes ?? []) {
      myVoteBySuggestion.set(vote.suggestion_id, vote.value);
    }

    // Scores need every user's votes, not just this user's — fetch those
    // separately so this page stays cheap for the common case.
    const suggestionIds = (suggestions ?? []).map((s) => s.id);
    const { data: allVotesForBatch } = suggestionIds.length
      ? await supabase
          .from("votes")
          .select("suggestion_id, value")
          .in("suggestion_id", suggestionIds)
      : { data: [] };

    const scoreBySuggestion = new Map<number, number>();
    for (const vote of allVotesForBatch ?? []) {
      scoreBySuggestion.set(
        vote.suggestion_id,
        (scoreBySuggestion.get(vote.suggestion_id) ?? 0) + vote.value
      );
    }

    latestItems = (suggestions ?? []).map((s) => ({
      ...s,
      score: scoreBySuggestion.get(s.id) ?? 0,
      myVote: myVoteBySuggestion.get(s.id) ?? 0,
    }));
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-5xl">
        <Link
          href="/explore"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Explore
        </Link>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Find something free to do
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tell it where you are, and it&apos;ll generate a few free, transit-reachable
          ideas.
        </p>

        <ExploreForm />

        <h2 className="mt-12 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Your latest search
        </h2>
        <SuggestionFeed
          items={latestItems}
          emptyMessage="Generate your first set of suggestions above."
        />
      </div>
    </div>
  );
}
