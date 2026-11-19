import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { PageHeader } from "@/components/page-header";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Profile" description="Manage your name and photo." />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-start px-6 pb-20">
        <div className="-mt-6 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <ProfileForm
            userId={user.id}
            email={user.email}
            initialFirstName={profile?.first_name ?? null}
            initialLastName={profile?.last_name ?? null}
            initialAvatarUrl={profile?.avatar_url ?? null}
          />
        </div>

        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
