import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuggestionFeed } from "@/components/suggestion-feed";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: saved, error: savedError } = await supabase
    .from("saved_suggestions")
    .select("suggestion_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const savedIds = (saved ?? []).map((s) => s.suggestion_id as number);

  const [{ data: suggestions }, { data: votes }] = savedIds.length
    ? await Promise.all([
        supabase
          .from("suggestions")
          .select(
            "id, title, description, neighborhood, transit_directions, activity_type, created_at"
          )
          .in("id", savedIds),
        supabase
          .from("votes")
          .select("suggestion_id, user_id, value")
          .in("suggestion_id", savedIds),
      ])
    : [{ data: [] }, { data: [] }];

  const score = new Map<number, number>();
  const myVote = new Map<number, number>();
  for (const vote of votes ?? []) {
    score.set(vote.suggestion_id, (score.get(vote.suggestion_id) ?? 0) + vote.value);
    if (vote.user_id === user.id) myVote.set(vote.suggestion_id, vote.value);
  }

  // Most recently saved first.
  const byId = new Map((suggestions ?? []).map((s) => [s.id as number, s]));
  const items = savedIds
    .map((id) => byId.get(id))
    .filter((s) => s !== undefined)
    .map((s) => ({
      ...s,
      score: score.get(s.id) ?? 0,
      myVote: myVote.get(s.id) ?? 0,
      isSaved: true,
    }));

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Saved"
        title="Your saved activities"
        description="Everything you've bookmarked, most recent first. Tap the bookmark on a card to remove it."
      />

      <div className="mx-auto w-full max-w-7xl px-6 pb-20">
        {savedError ? (
          <p className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Couldn&apos;t load your saved activities: {savedError.message}
          </p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Nothing saved yet</p>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Tap the bookmark on any card in{" "}
              <Link href="/explore" className="underline">
                Explore
              </Link>{" "}
              or your search results to save it here.
            </p>
          </div>
        ) : (
          <div className="pt-8">
            <SuggestionFeed items={items} />
          </div>
        )}
      </div>
    </main>
  );
}
