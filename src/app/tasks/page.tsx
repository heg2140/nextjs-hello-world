import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/task-list";

// Always fetch fresh data from Supabase on each request.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, is_complete, created_at")
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-black">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Tasks
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Your tasks, fetched live from Supabase.
        </p>

        {error && (
          <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Failed to load tasks: {error.message}
          </p>
        )}

        {!error && <TaskList userId={user.id} initialTasks={tasks ?? []} />}
      </div>
    </div>
  );
}
