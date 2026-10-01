import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Sign-in failed
      </h1>
      <p className="max-w-sm text-center text-zinc-600 dark:text-zinc-400">
        Something went wrong while completing sign-in. Please try again.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Back to login
      </Link>
    </div>
  );
}
