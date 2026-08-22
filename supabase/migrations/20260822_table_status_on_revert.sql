-- Возврат готового тикета в работу должен гасить «Ждут подачу».
--
-- `orders_sync_table_status` ловит переходы вперёд (ready → served → paid), но
-- обратный ход не обрабатывает: повар нажал «Вернуть» на кухне — заказ снова
-- `cooking`, а стол остался `awaiting`. Официант видит горящий стол и подходит
-- к нему, хотя нести нечего.
--
-- Считать статус в BEFORE-триггере нельзя: там строка ещё со старым статусом,
-- и пересчёт увидел бы прежний `ready`. Поэтому отдельный AFTER-триггер, и
-- пересчёт общий (`refresh_table_status`) — у стола могут быть другие заказы,
-- и один из них может быть готов к подаче.

create or replace function public.refresh_table_status_on_revert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.table_id is not null then
    perform public.refresh_table_status(new.table_id);
  end if;
  return null;
end;
$$;

drop trigger if exists orders_refresh_table_on_revert on public.orders;

create trigger orders_refresh_table_on_revert
after update of status on public.orders
for each row
when (
  old.status is distinct from new.status
  and (
    -- Готовое вернули на кухню — «Ждут подачу» снимаем.
    (old.status in ('ready', 'served') and new.status in ('queued', 'cooking'))
    -- Отменённый заказ стол больше не занимает.
    or new.status = 'cancelled'
  )
)
execute function public.refresh_table_status_on_revert();
