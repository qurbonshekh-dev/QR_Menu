-- `close_bill` не для анонима.
--
-- Проверка «auth.uid() не пуст, но это не сотрудник» пропускала гостя: у него
-- uid пуст, и условие не срабатывало. С публичным ключом это значит, что любой
-- мог выписать чек с произвольной скидкой и методом оплаты — то есть подделать
-- выручку смены.
--
-- Теперь спрашиваем роль подключения: сервер (service_role) ходит от имени
-- гостевого шлюза, всем остальным нужна строка в `staff`.

create or replace function public.assert_can_close_bill()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return; end if;
  if public.is_staff() then return; end if;
  raise exception 'Закрывать счёт может только сотрудник';
end;
$$;

revoke execute on function public.close_bill(uuid[], jsonb, uuid, uuid, numeric, text, numeric) from anon;
