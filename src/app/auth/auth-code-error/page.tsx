import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="bg-dots flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sign-in failed
      </h1>
      <p className="max-w-sm text-center text-zinc-600 dark:text-zinc-400">
        Something went wrong while completing sign-in. Please try again.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        Back to login
      </Link>
    </main>
  );
}
