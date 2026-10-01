"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string | undefined;
  initialFirstName: string | null;
  initialLastName: string | null;
  initialAvatarUrl: string | null;
};

export function ProfileForm({
  userId,
  email,
  initialFirstName,
  initialLastName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isIncomplete = !initialFirstName || !initialLastName;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMessage(null);

    const supabase = createClient();
    let newAvatarUrl = avatarUrl;

    // Upload the photo to Supabase Storage (not the database) and store
    // only the resulting public URL on the profile row.
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setErrorMessage(`Photo upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      // Bust the CDN/browser cache so a re-uploaded photo shows immediately.
      newAvatarUrl = `${publicUrl}?t=${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setErrorMessage(`Failed to save profile: ${updateError.message}`);
      return;
    }

    setAvatarUrl(newAvatarUrl);
    setAvatarFile(null);
    setMessage("Profile saved!");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md">
      {isIncomplete && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Welcome! Please add your first and last name to finish setting up
          your profile.
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              avatarPreview ??
              avatarUrl ??
              `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                email ?? "U"
              )}`
            }
            alt="Profile photo"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-zinc-50">
            {email}
          </p>
          <label className="mt-1 inline-block cursor-pointer text-sm text-zinc-500 underline dark:text-zinc-400">
            Change photo
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Last name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
