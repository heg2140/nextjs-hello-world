import type { SupabaseClient } from "@supabase/supabase-js";

// IDs of the suggestions this user has saved. Returns an empty set if the
// saved_suggestions table doesn't exist yet (supabase/saved-suggestions.sql).
export async function loadSavedIds(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("saved_suggestions")
    .select("suggestion_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((row) => row.suggestion_id as number));
}
