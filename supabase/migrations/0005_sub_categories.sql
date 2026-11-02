-- Sub categories (e.g. Coffee under Food). One level deep, enforced in saveCategory.
-- Deleting the main category just makes its subs regular categories again.
alter table public.categories add column parent_id uuid check (parent_id <> id);
alter table public.categories
  add constraint categories_parent_fk foreign key (parent_id, user_id)
  references public.categories (id, user_id) on delete set null (parent_id);
create index categories_parent_user_idx on public.categories (parent_id, user_id);
