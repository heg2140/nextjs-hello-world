"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { activityIcon } from "@/lib/explore-constants";

type FeedItem = {
  id: number;
  title: string;
  description: string;
  neighborhood: string;
  transit_directions: string;
  activity_type?: string | null;
  created_at: string;
  score: number;
  myVote: number;
};

export function SuggestionFeed({
  items,
  emptyMessage = "No suggestions yet.",
  showRank = false,
}: {
  items: FeedItem[];
  emptyMessage?: string;
  showRank?: boolean;
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
      <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start gap-4">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
              {activityIcon(item.activity_type)}
              {showRank && (
                <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {index + 1}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h3>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <svg viewBox="0 0 16 16" aria-hidden className="h-3 w-3 fill-current">
                  <path d="M8 0a5.5 5.5 0 0 0-5.5 5.5C2.5 9.6 8 16 8 16s5.5-6.4 5.5-10.5A5.5 5.5 0 0 0 8 0Zm0 7.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                </svg>
                {item.neighborhood}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1 rounded-full bg-zinc-50 p-1 dark:bg-zinc-950">
              <button
                onClick={() => handleVote(item.id, 1)}
                aria-label="Upvote"
                aria-pressed={item.myVote === 1}
                className={
                  item.myVote === 1
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs text-white"
                    : "flex h-7 w-7 items-center justify-center rounded-full text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }
              >
                ▲
              </button>
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {item.score}
              </span>
              <button
                onClick={() => handleVote(item.id, -1)}
                aria-label="Downvote"
                aria-pressed={item.myVote === -1}
                className={
                  item.myVote === -1
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                    : "flex h-7 w-7 items-center justify-center rounded-full text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }
              >
                ▼
              </button>
            </div>
          </div>

          <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {item.description}
          </p>

          <div className="mt-5 flex gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <span aria-hidden>🚇</span>
            <span>{item.transit_directions}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
