"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ALL_LABEL = "All neighborhoods";

export function NeighborhoodFilter({
  options,
  selected,
}: {
  options: Array<{ name: string; count: number }>;
  selected: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matches = options.filter((o) =>
    o.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleSelect = (name: string | null) => {
    setOpen(false);
    setQuery("");
    router.push(
      name ? `/explore?neighborhood=${encodeURIComponent(name)}` : "/explore"
    );
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <input
        type="text"
        value={open ? query : (selected ?? ALL_LABEL)}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
            e.currentTarget.blur();
          }
          if (e.key === "Enter" && matches.length > 0) {
            e.preventDefault();
            handleSelect(matches[0].name);
            e.currentTarget.blur();
          }
        }}
        placeholder="Search neighborhoods..."
        className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-800 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-200"
      />

      {open && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-black/[.08] bg-white shadow-lg dark:border-white/[.145] dark:bg-zinc-900">
          {!query.trim() && (
            <li>
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="block w-full px-3 py-2 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                {ALL_LABEL}
              </button>
            </li>
          )}
          {matches.map((o) => (
            <li key={o.name}>
              <button
                type="button"
                onClick={() => handleSelect(o.name)}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                {o.name}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">
                  ({o.count})
                </span>
              </button>
            </li>
          ))}
          {query.trim() && matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No matches found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
