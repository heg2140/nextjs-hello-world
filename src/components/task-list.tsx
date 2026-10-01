"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Task = {
  id: number;
  title: string;
  is_complete: boolean;
  created_at: string;
};

export function TaskList({
  userId,
  initialTasks,
}: {
  userId: string;
  initialTasks: Task[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setAdding(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .insert({ title: title.trim(), user_id: userId, is_complete: false });

    setAdding(false);

    if (error) {
      setErrorMessage(`Failed to add task: ${error.message}`);
      return;
    }

    setTitle("");
    router.refresh();
  };

  const handleToggle = async (task: Task) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ is_complete: !task.is_complete })
      .eq("id", task.id);

    if (!error) {
      router.refresh();
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="mt-6 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 rounded-lg border border-black/[.08] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {initialTasks.length === 0 ? (
        <p className="mt-8 text-zinc-500 dark:text-zinc-400">
          No tasks yet. Add one above.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {initialTasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-black/[.08] bg-white px-4 py-3 dark:border-white/[.145] dark:bg-zinc-900"
            >
              <span
                className={
                  task.is_complete
                    ? "text-zinc-400 line-through dark:text-zinc-600"
                    : "text-black dark:text-zinc-50"
                }
              >
                {task.title}
              </span>
              <button
                onClick={() => handleToggle(task)}
                className={
                  task.is_complete
                    ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400"
                    : "rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }
              >
                {task.is_complete ? "Done" : "Pending"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
