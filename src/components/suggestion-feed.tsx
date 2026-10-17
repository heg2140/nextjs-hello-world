"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FeedItem = {
  id: number;
  title: string;
  description: string;
  neighborhood: string;
  transit_directions: string;
  created_at: string;
  score: number;
  myVote: number;
};

export function SuggestionFeed({
  items,
  emptyMessage = "No suggestions yet.",
}: {
  items: FeedItem[];
  emptyMessage?: string;
}) {
  const router = useRouter();

  const handleVote = async (suggestionId: number, value: 1 | -1) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const item = items.find((i) => i.id === suggestionId);
    const alreadyVotedThisWay = item?.myVote === value;

    if (alreadyVotedThisWay) {
      // Clicking the same vote again removes it (toggle off).
      await supabase
        .from("votes")
        .delete()
        .eq("suggestion_id", suggestionId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("votes").upsert(
        {
          suggestion_id: suggestionId,
          user_id: user.id,
          value,
        },
        { onConflict: "suggestion_id,user_id" }
      );
    }

    router.refresh();
  };

  if (items.length === 0) {
    return (
      <p className="mt-4 text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-black dark:text-zinc-50">
                {item.title}
              </h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {item.neighborhood}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <button
                onClick={() => handleVote(item.id, 1)}
                aria-label="Upvote"
                className={
                  item.myVote === 1
                    ? "rounded-full bg-green-600 px-2.5 py-1 text-sm font-medium text-white"
                    : "rounded-full bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }
              >
                ▲
              </button>
              <span className="text-sm font-semibold text-black dark:text-zinc-50">
                {item.score}
              </span>
              <button
                onClick={() => handleVote(item.id, -1)}
                aria-label="Downvote"
                className={
                  item.myVote === -1
                    ? "rounded-full bg-red-600 px-2.5 py-1 text-sm font-medium text-white"
                    : "rounded-full bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }
              >
                ▼
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {item.description}
          </p>

          <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            🚇 {item.transit_directions}
          </p>
        </li>
      ))}
    </ul>
  );
}
