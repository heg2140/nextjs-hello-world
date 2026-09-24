export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Hello World
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Deployed with Next.js on Vercel.
      </p>
      <a
        href="/tasks"
        className="mt-8 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        View Tasks
      </a>
    </div>
  );
}
