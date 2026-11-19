"use client";

import { useEffect, useRef } from "react";
import { activityIcon } from "@/lib/explore-constants";
import { parseTransit, STEP_ICONS } from "@/lib/transit";
import { VoteControl } from "@/components/vote-control";

export type DetailItem = {
  id: number;
  title: string;
  description: string;
  neighborhood: string;
  transit_directions: string;
  activity_type?: string | null;
  score: number;
  myVote: number;
};

// Popup with everything about one suggestion. Uses the native <dialog>
// element, which handles focus, Escape to close and the backdrop for us.
export function SuggestionDetail({
  item,
  onClose,
  onVote,
}: {
  item: DetailItem;
  onClose: () => void;
  onVote: (value: 1 | -1) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    // Stop the page behind the popup from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  const { steps, note } = parseTransit(item.transit_directions);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby={`suggestion-${item.id}-title`}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/50 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <div className="bg-dots relative border-b border-zinc-200 px-6 pt-8 pb-6 sm:px-10 sm:pt-10 dark:border-zinc-800">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          ×
        </button>

        <div className="flex items-start gap-5 pr-8">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            {activityIcon(item.activity_type)}
          </span>
          <div className="min-w-0">
            {/* Focus the title on open (not the close button) so screen
                readers announce it and no focus ring flashes on the ×. */}
            <h2
              id={`suggestion-${item.id}-title`}
              tabIndex={-1}
              autoFocus
              className="text-2xl font-semibold leading-tight tracking-tight outline-none sm:text-3xl"
            >
              {item.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5 fill-current">
                  <path d="M8 0a5.5 5.5 0 0 0-5.5 5.5C2.5 9.6 8 16 8 16s5.5-6.4 5.5-10.5A5.5 5.5 0 0 0 8 0Zm0 7.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                </svg>
                {item.neighborhood}
              </span>
              {item.activity_type && (
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  {item.activity_type}
                </span>
              )}
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                Free
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 px-6 py-8 sm:px-10 md:grid-cols-[1fr_auto]">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            What it is
          </h3>
          <p className="mt-3 text-base leading-relaxed text-zinc-700 sm:text-lg dark:text-zinc-300">
            {item.description}
          </p>
        </section>

        <section className="flex flex-row items-center gap-4 md:flex-col md:items-center">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 md:order-last dark:text-zinc-400">
            Worth it?
          </h3>
          <VoteControl score={item.score} myVote={item.myVote} onVote={onVote} size="lg" />
        </section>
      </div>

      <section className="border-t border-zinc-200 px-6 py-8 sm:px-10 dark:border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          How to get there
        </h3>

        {steps.length > 0 ? (
          <ol className="mt-5">
            {steps.map((step, i) => (
                <li key={i} className="relative flex gap-4 pb-6">
                  {/* Line connecting this stop to the next one. */}
                  <span
                    aria-hidden
                    className="absolute top-11 bottom-0 left-[1.375rem] w-0.5 bg-zinc-200 dark:bg-zinc-700"
                  />
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg dark:border-zinc-700 dark:bg-zinc-950">
                    {STEP_ICONS[step.kind]}
                  </span>
                  <div className="pt-1">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Step {i + 1}
                    </p>
                    <p className="mt-0.5 text-base text-zinc-800 dark:text-zinc-200">{step.text}</p>
                  </div>
                </li>
            ))}
            <li className="relative flex gap-4">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg text-white dark:bg-zinc-100 dark:text-zinc-900">
                {STEP_ICONS.arrive}
              </span>
              <div className="pt-1">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Arrive</p>
                <p className="mt-0.5 text-base font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              </div>
            </li>
          </ol>
        ) : (
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">No directions available.</p>
        )}

        {note && (
          <p className="mt-6 flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
            <span aria-hidden>⚠️</span>
            {note}
          </p>
        )}
      </section>
    </dialog>
  );
}
