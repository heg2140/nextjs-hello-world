import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExploreForm } from "@/components/explore-form";
import { SuggestionFeed } from "@/components/suggestion-feed";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function NewSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only show the search the user just ran (its id is put in the URL by the
  // form), so coming back to this page later starts with no results.
  const { generation: generationParam } = await searchParams;
  const generationId =
    typeof generationParam === "string" ? generationParam : null;

  const { data: latestGeneration } = generationId
    ? await supabase
        .from("generations")
        .select("id")
        .eq("id", generationId)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  let latestItems: Array<{
    id: number;
    title: string;
    description: string;
    neighborhood: string;
    transit_directions: string;
    activity_type: string | null;
    created_at: string;
    score: number;
    myVote: number;
  }> = [];

  if (latestGeneration) {
    const [{ data: suggestions }, { data: votes }] = await Promise.all([
      supabase
        .from("suggestions")
        .select(
          "id, title, description, neighborhood, transit_directions, activity_type, created_at"
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
    <main className="flex flex-1 flex-col">
      <PageHeader
        back={{ href: "/explore", label: "Back to Explore" }}
        title="Find something free to do"
        description="Tell it where you are, and it'll generate a few free, transit-reachable ideas."
      />

      <div className="mx-auto w-full max-w-7xl px-6 pb-20">
        <ExploreForm />

        <div className="mt-14 flex items-baseline justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Results ({latestItems.length})
          </h2>
          {latestItems.length > 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Vote on the ones worth it. The best rise to Explore.
            </p>
          )}
        </div>
        <SuggestionFeed
          items={latestItems}
          emptyMessage="Generate suggestions above to see results here."
        />
      </div>
    </main>
  );
}
