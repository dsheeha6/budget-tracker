-- Savings goals (e.g. "Emergency fund", "Japan trip") and the money put
-- toward them. A goal's saved amount is the sum of its contributions.

-- ─── savings_goals ───────────────────────────────────────────────────────
create table public.savings_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (length(trim(name)) between 1 and 50),
  icon          text not null default '🎯',
  color         text not null default '#10b981',
  target_amount numeric(12, 2) not null check (target_amount > 0),
  -- Optional: when set, the app shows how much a month it takes to get there.
  target_date   date,
  archived      boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  unique (id, user_id)
);

create index savings_goals_user_id_idx on public.savings_goals (user_id);

-- ─── goal_contributions ──────────────────────────────────────────────────
create table public.goal_contributions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id    uuid not null,
  -- Positive = money put in. Negative = money taken back out.
  amount     numeric(12, 2) not null check (amount <> 0),
  date       date not null default current_date,
  note       text,
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references public.savings_goals (id, user_id) on delete cascade
);

create index goal_contributions_goal_user_idx on public.goal_contributions (goal_id, user_id);
create index goal_contributions_user_date_idx on public.goal_contributions (user_id, date desc);

-- ─── Row Level Security: "your rows only" ────────────────────────────────
alter table public.savings_goals      enable row level security;
alter table public.goal_contributions enable row level security;

create policy "own rows" on public.savings_goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.goal_contributions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
