-- Saved suggestions ("favorites"). Run once in the Free NYC Supabase project:
-- SQL Editor -> New query -> paste -> Run. Safe to run more than once.

create table if not exists public.saved_suggestions (
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_id bigint not null references public.suggestions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, suggestion_id)
);

create index if not exists saved_suggestions_user_created_idx
  on public.saved_suggestions (user_id, created_at desc);

alter table public.saved_suggestions enable row level security;

-- Each user can only see, add and remove their own saves.
drop policy if exists "Users can read their own saves" on public.saved_suggestions;
create policy "Users can read their own saves"
  on public.saved_suggestions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can save suggestions" on public.saved_suggestions;
create policy "Users can save suggestions"
  on public.saved_suggestions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can unsave suggestions" on public.saved_suggestions;
create policy "Users can unsave suggestions"
  on public.saved_suggestions for delete to authenticated
  using (user_id = auth.uid());
