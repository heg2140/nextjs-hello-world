"use client";

// Upvote / score / downvote. Clicking your current vote again removes it.
export function VoteControl({
  score,
  myVote,
  onVote,
  size = "sm",
}: {
  score: number;
  myVote: number;
  onVote: (value: 1 | -1) => void;
  size?: "sm" | "lg";
}) {
  const button = size === "lg" ? "h-11 w-11 text-base" : "h-7 w-7 text-xs";
  const idle =
    "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

  return (
    <div
      className={`flex shrink-0 flex-col items-center rounded-full bg-zinc-50 p-1 dark:bg-zinc-950 ${
        size === "lg" ? "gap-1.5 border border-zinc-200 dark:border-zinc-800" : "gap-1"
      }`}
    >
      <button
        type="button"
        onClick={() => onVote(1)}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        className={`flex items-center justify-center rounded-full ${button} ${
          myVote === 1 ? "bg-green-600 text-white" : idle
        }`}
      >
        ▲
      </button>
      <span
        className={`font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 ${
          size === "lg" ? "text-xl" : "text-sm"
        }`}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        className={`flex items-center justify-center rounded-full ${button} ${
          myVote === -1 ? "bg-red-600 text-white" : idle
        }`}
      >
        ▼
      </button>
    </div>
  );
}
