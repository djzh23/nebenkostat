-- Freiwilliges Feedback für die kostenlose Beta.
-- Die E-Mail wird nur als Snapshot des eingeloggten Kontos gespeichert;
-- Marketing-Updates erfordern eine separate Einwilligung.

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (char_length(email) <= 320),
  message text not null check (char_length(message) between 5 and 4000),
  wants_beta_updates boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_user_created_idx
  on public.beta_feedback (user_id, created_at desc);

alter table public.beta_feedback enable row level security;

drop policy if exists "Users can insert own beta feedback" on public.beta_feedback;
create policy "Users can insert own beta feedback" on public.beta_feedback
  for insert with check (
    auth.uid() = user_id
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Users can view own beta feedback" on public.beta_feedback;
create policy "Users can view own beta feedback" on public.beta_feedback
  for select using (auth.uid() = user_id);
