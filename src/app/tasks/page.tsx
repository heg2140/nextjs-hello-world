import { supabase } from "@/lib/supabase";

type Task = {
  id: number;
  title: string;
  is_complete: boolean;
  created_at: string;
};

// Always fetch fresh data from Supabase on each request.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, is_complete, created_at")
    .order("id", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-black">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Tasks
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Live data fetched from Supabase.
        </p>

        {error && (
          <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Failed to load tasks: {error.message}
          </p>
        )}

        {!error && tasks && tasks.length === 0 && (
          <p className="mt-8 text-zinc-500 dark:text-zinc-400">
            No tasks found.
          </p>
        )}

        {!error && tasks && tasks.length > 0 && (
          <ul className="mt-8 flex flex-col gap-3">
            {tasks.map((task: Task) => (
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
                <span
                  className={
                    task.is_complete
                      ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {task.is_complete ? "Done" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
