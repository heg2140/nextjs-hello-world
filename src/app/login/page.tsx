import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="bg-dots flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          F
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in to Free NYC
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Use your Google account to find, save and vote on free things to do.
        </p>
        <div className="mt-8 flex justify-center">
          <GoogleSignInButton />
        </div>
      </div>
    </main>
  );
}
