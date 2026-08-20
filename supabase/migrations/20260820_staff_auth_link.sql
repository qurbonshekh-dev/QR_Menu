-- Этап 1 ТЗ официанта: вход в приложение по логину и паролю.
--
-- Сотрудник получает вход: строка `staff` связывается с пользователем Supabase Auth.
-- Гостевое меню остаётся публичным — там входить некому и незачем.

alter table public.staff
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

-- Кто вошёл — глазами RLS-политик. security definer: политика не должна зависеть
-- от права читать staff, иначе выйдет рекурсия «чтобы прочитать — надо прочитать».
create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$ select id from public.staff where auth_user_id = auth.uid() $$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.staff where auth_user_id = auth.uid()) $$;

-- Зал правит только вошедший персонал. Триггеры статусов стола от этого не страдают:
-- `sync_table_status_from_order` и `occupy_table_on_order` — security definer, они идут мимо RLS.
drop policy if exists "update tables" on public.dining_tables;
create policy "staff updates tables" on public.dining_tables
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Закрыть вызов гостя может официант, а не сам гость.
drop policy if exists "resolve waiter calls" on public.waiter_calls;
create policy "staff resolves waiter calls" on public.waiter_calls
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Правка заказов (`orders`) пока остаётся открытой анониму: с ней работает экран
-- кухни, у которого своего входа ещё нет. Сузить — вместе с логином кухни.
