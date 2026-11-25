-- Cover the composite (category_id, user_id) foreign keys with indexes.
drop index if exists public.transactions_category_id_idx;
create index transactions_category_user_idx on public.transactions (category_id, user_id);
create index category_budgets_category_user_idx on public.category_budgets (category_id, user_id);
create index receipt_items_user_id_idx on public.receipt_items (user_id);
