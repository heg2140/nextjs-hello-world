"use client";

// Bookmark toggle. Filled when the suggestion is saved. "icon" is the round
// button on cards; "tag" is a labeled pill that sits with the popup's tags.
export function SaveButton({
  saved,
  onToggle,
  size = "icon",
}: {
  saved: boolean;
  onToggle: () => void;
  size?: "icon" | "tag";
}) {
  const tag = size === "tag";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      title={saved ? "Remove from saved" : "Save for later"}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        tag ? "gap-1.5 border px-3 py-1 text-sm font-medium" : "h-8 w-8"
      } ${
        saved
          ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          : tag
            ? "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={tag ? "h-3.5 w-3.5" : "h-4 w-4"}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
      </svg>
      {tag && (saved ? "Saved" : "Save")}
    </button>
  );
}
