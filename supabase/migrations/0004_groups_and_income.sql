-- Category folders (e.g. "Subscriptions" holding Spotify, Claude, ...) and
-- paycheck info on the profile.

-- ─── category_groups ─────────────────────────────────────────────────────
create table public.category_groups (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 50),
  icon       text not null default '📁',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index category_groups_user_id_idx on public.category_groups (user_id);

alter table public.category_groups enable row level security;
create policy "own rows" on public.category_groups for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A category can sit in one folder. Deleting the folder just un-files it.
alter table public.categories add column group_id uuid;
alter table public.categories
  add constraint categories_group_fk foreign key (group_id, user_id)
  references public.category_groups (id, user_id) on delete set null (group_id);
create index categories_group_user_idx on public.categories (group_id, user_id);

-- ─── income on profiles ──────────────────────────────────────────────────
alter table public.profiles
  add column pay_amount numeric(12, 2) check (pay_amount >= 0),          -- take-home per paycheck
  add column pay_frequency text not null default 'semimonthly'
    check (pay_frequency in ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  add column retirement_per_paycheck numeric(12, 2) not null default 0 check (retirement_per_paycheck >= 0),
  add column tax_per_paycheck numeric(12, 2) not null default 0 check (tax_per_paycheck >= 0);

-- Users can edit their own budget and income fields (still never is_pro).
grant update (monthly_budget, pay_amount, pay_frequency, retirement_per_paycheck, tax_per_paycheck)
  on public.profiles to authenticated;
