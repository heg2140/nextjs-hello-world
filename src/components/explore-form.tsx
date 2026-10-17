"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AddressAutocomplete,
  type SelectedAddress,
} from "@/components/address-autocomplete";
import { ACTIVITY_TYPES, TIMES_OF_DAY } from "@/lib/explore-constants";

export function ExploreForm() {
  const router = useRouter();
  const [startingPoint, setStartingPoint] = useState<SelectedAddress | null>(
    null
  );
  const [activityType, setActivityType] = useState<string>(ACTIVITY_TYPES[0]);
  const [timeOfDay, setTimeOfDay] = useState<string>(TIMES_OF_DAY[0]);
  const [maxTravelMinutes, setMaxTravelMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingPoint) {
      setErrorMessage(
        "Pick a starting point from the suggestions so we know it's a real address."
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await fetch("/api/generate-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startingPoint: startingPoint.displayName,
        startingLat: startingPoint.lat,
        startingLon: startingPoint.lon,
        activityType,
        timeOfDay,
        maxTravelMinutes,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErrorMessage(data.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Starting point
        </label>
        <AddressAutocomplete value={startingPoint} onChange={setStartingPoint} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Activity type
          </label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-emerald-500"
          >
            {ACTIVITY_TYPES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Time of day
          </label>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-emerald-500"
          >
            {TIMES_OF_DAY.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Max travel (min)
          </label>
          <input
            type="number"
            min={5}
            max={180}
            value={maxTravelMinutes}
            onChange={(e) => setMaxTravelMinutes(Number(e.target.value))}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-emerald-500"
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !startingPoint}
        className="self-start rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {loading ? "Finding free things to do..." : "Generate suggestions"}
      </button>
    </form>
  );
}
