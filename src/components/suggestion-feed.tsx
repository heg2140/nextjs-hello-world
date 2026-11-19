"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { activityIcon } from "@/lib/explore-constants";
import { SuggestionDetail } from "@/components/suggestion-detail";
import { VoteControl } from "@/components/vote-control";

// Cut text at a word boundary so the card can show a "Read more" link.
function preview(text: string, maxLength: number) {
  const clean = (text ?? "").trim();
  if (clean.length <= maxLength) return { text: clean, truncated: false };
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return {
    text: `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`,
    truncated: true,
  };
}

const DESCRIPTION_PREVIEW = 150;
const TRANSIT_PREVIEW = 90;

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
  // The popup reads the item from `items`, so votes made in it show up there
  // as soon as the page data refreshes.
  const [openId, setOpenId] = useState<number | null>(null);
  const openItem = items.find((i) => i.id === openId) ?? null;

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
    <>
      <ul className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => {
          const description = preview(item.description, DESCRIPTION_PREVIEW);
          const transit = preview(item.transit_directions, TRANSIT_PREVIEW);
          const readMore = (
            <button
              type="button"
              onClick={() => setOpenId(item.id)}
              className="relative z-10 ml-1 font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-100"
            >
              Read more
            </button>
          );
          return (
            <li
              key={item.id}
              className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {/* Covers the whole card so any click opens the details; the
                  vote buttons sit above it. */}
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                aria-label={`View details for ${item.title}`}
                className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              />

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
                <div className="relative z-10">
                  <VoteControl
                    score={item.score}
                    myVote={item.myVote}
                    onVote={(value) => handleVote(item.id, value)}
                  />
                </div>
              </div>

              <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {description.text}
                {description.truncated && readMore}
              </p>

              <div className="mt-5 flex gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <span aria-hidden>🚇</span>
                <span>
                  {transit.text}
                  {transit.truncated && readMore}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                View details →
              </p>
            </li>
          );
        })}
      </ul>

      {openItem && (
        <SuggestionDetail
          item={openItem}
          onClose={() => setOpenId(null)}
          onVote={(value) => handleVote(openItem.id, value)}
        />
      )}
    </>
  );
}
