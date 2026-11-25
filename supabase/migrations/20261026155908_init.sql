-- Budget Tracker: initial schema
-- Every table is owned by a user and locked down with Row Level Security,
-- so each person only ever sees their own rows.

-- ─── profiles ────────────────────────────────────────────────────────────
-- One row per auth user, created automatically on signup.
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  is_pro         boolean not null default false,
  -- Overall monthly budget. NULL = use the sum of the category budgets.
  monthly_budget numeric(12, 2) check (monthly_budget >= 0),
  created_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Users may change their overall budget, but never their own is_pro flag.
-- Only the service role (server / Stripe webhook) can set is_pro.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (monthly_budget) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── categories ──────────────────────────────────────────────────────────
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (length(trim(name)) between 1 and 50),
  icon           text not null default '💸',
  color          text not null default '#6366f1',
  -- Default budget for the current month and future months.
  monthly_budget numeric(12, 2) not null default 0 check (monthly_budget >= 0),
  archived       boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  -- Lets other tables reference (id, user_id) so a row can't point at
  -- someone else's category.
  unique (id, user_id)
);

create index categories_user_id_idx on public.categories (user_id);

-- ─── category_budgets ────────────────────────────────────────────────────
-- Budget for one category in one specific month. When a category's default
-- budget changes, the app snapshots the old amount here for past months so
-- history doesn't get rewritten.
create table public.category_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  month       date not null check (extract(day from month) = 1),
  amount      numeric(12, 2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (category_id, month),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);

create index category_budgets_user_month_idx on public.category_budgets (user_id, month);

-- ─── receipts (used in Phase 3) ──────────────────────────────────────────
create table public.receipts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  image_path text,
  merchant   text,
  total      numeric(12, 2),
  raw_json   jsonb,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index receipts_user_id_idx on public.receipts (user_id);

-- ─── transactions ────────────────────────────────────────────────────────
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  -- Positive = spending. Negative = refund/return.
  amount      numeric(12, 2) not null check (amount <> 0),
  merchant    text,
  date        date not null default current_date,
  note        text,
  receipt_id  uuid references public.receipts (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- No cascade: a category with transactions gets archived, not deleted.
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_receipt_id_idx on public.transactions (receipt_id);

-- ─── receipt_items (used in Phase 3) ─────────────────────────────────────
create table public.receipt_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  receipt_id  uuid not null,
  name        text not null,
  price       numeric(12, 2) not null,
  category_id uuid,
  foreign key (receipt_id, user_id) references public.receipts (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

create index receipt_items_receipt_id_idx on public.receipt_items (receipt_id, user_id);
create index receipt_items_category_id_idx on public.receipt_items (category_id, user_id);

-- ─── Row Level Security: "your rows only" ────────────────────────────────
alter table public.categories       enable row level security;
alter table public.category_budgets enable row level security;
alter table public.receipts         enable row level security;
alter table public.transactions     enable row level security;
alter table public.receipt_items    enable row level security;

create policy "own rows" on public.categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.category_budgets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.receipts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.transactions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.receipt_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
