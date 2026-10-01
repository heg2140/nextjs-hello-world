import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";

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
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 font-sans dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Profile
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your name and photo.
        </p>
      </div>

      <div className="mt-8">
        <ProfileForm
          userId={user.id}
          email={user.email}
          initialFirstName={profile?.first_name ?? null}
          initialLastName={profile?.last_name ?? null}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}
