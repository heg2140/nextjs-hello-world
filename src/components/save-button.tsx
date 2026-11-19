"use client";

// Bookmark toggle. Filled when the suggestion is saved.
export function SaveButton({
  saved,
  onToggle,
  size = "sm",
}: {
  saved: boolean;
  onToggle: () => void;
  size?: "sm" | "lg";
}) {
  const icon = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      title={saved ? "Remove from saved" : "Save for later"}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors ${
        size === "lg" ? "px-4 py-2.5 text-sm" : "h-8 w-8"
      } ${
        saved
          ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          : size === "lg"
            ? "border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className={icon} fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
      </svg>
      {size === "lg" && (saved ? "Saved" : "Save for later")}
    </button>
  );
}
