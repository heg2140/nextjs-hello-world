import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sign-in failed
      </h1>
      <p className="max-w-sm text-center text-zinc-600 dark:text-zinc-400">
        Something went wrong while completing sign-in. Please try again.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        Back to login
      </Link>
    </div>
  );
}
