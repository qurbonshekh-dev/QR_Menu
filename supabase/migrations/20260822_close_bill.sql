-- Единый шов закрытия счёта.
--
-- Счёт закрывают трое: касса, официант кнопкой «Закрыть счёт» и гость мок-оплатой.
-- Пока каждый писал `orders.status = 'paid'` сам, выручка существовала только
-- как сумма заказов — и Z-отчёт разошёлся бы с кассой на первой же смене:
-- закрытое официантом мимо кассы в него просто не попадает.
--
-- Теперь все трое зовут `close_bill`, и она одна выписывает чек, копирует в него
-- строки, пишет платежи и закрывает заказы — одной транзакцией, потому что чек
-- без заказов и заказы без чека одинаково бесполезны.
--
-- Платежи приходят массивом: `[{"method":"cash","amount":120,"change_given":30}]`.
-- Пустой массив — «оплата не разбита» (так закрывает официант, забравший деньги
-- на месте): чек всё равно выписывается, платёж пишется одной строкой наличными.

create or replace function public.close_bill(
  p_order_ids uuid[],
  p_payments jsonb default '[]'::jsonb,
  p_cashier_id uuid default null,
  p_cash_shift_id uuid default null,
  p_discount numeric default 0,
  p_discount_reason text default null,
  p_tip numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant_id uuid;
  v_table_number text;
  v_channel text;
  v_subtotal numeric;
  v_tip numeric;
  v_total numeric;
  v_receipt_id uuid;
  v_paid numeric;
  v_payment jsonb;
  v_last_order uuid;
begin
  -- Вызывать может сотрудник или сервер (edge-функция гостевой оплаты ходит
  -- с service_role, и auth.uid() у неё пуст).
  if auth.uid() is not null and not public.is_staff() then
    raise exception 'Закрывать счёт может только сотрудник';
  end if;

  if p_order_ids is null or array_length(p_order_ids, 1) is null then
    raise exception 'Нечего закрывать: не переданы заказы';
  end if;

  select o.restaurant_id, max(t.number), max(o.channel)
  into v_restaurant_id, v_table_number, v_channel
  from public.orders o
  left join public.dining_tables t on t.id = o.table_id
  where o.id = any (p_order_ids)
    and o.status not in ('paid', 'cancelled')
  group by o.restaurant_id;

  if v_restaurant_id is null then
    raise exception 'Заказы уже закрыты или не найдены';
  end if;

  -- Чаевые пишем в последний заказ визита — счёт закрывают один раз.
  select o.id into v_last_order
  from public.orders o
  where o.id = any (p_order_ids)
  order by o.placed_at desc
  limit 1;

  select coalesce(sum(i.quantity * i.unit_price), 0)
  into v_subtotal
  from public.order_items i
  where i.order_id = any (p_order_ids);

  -- Чаевые не передали — берём те, что гость уже оставил в заказе.
  v_tip := coalesce(p_tip, (
    select coalesce(sum(o.tip), 0) from public.orders o where o.id = any (p_order_ids)
  ));

  if p_discount > v_subtotal then
    raise exception 'Скидка больше суммы чека';
  end if;

  v_total := v_subtotal - coalesce(p_discount, 0) + v_tip;

  insert into public.receipts (
    restaurant_id, cash_shift_id, cashier_id, table_number, channel,
    subtotal, discount, discount_reason, tip, total, status, paid_at
  )
  values (
    v_restaurant_id, p_cash_shift_id, p_cashier_id, v_table_number, coalesce(v_channel, 'dine_in'),
    v_subtotal, coalesce(p_discount, 0), p_discount_reason, v_tip, v_total, 'paid', now()
  )
  returning id into v_receipt_id;

  insert into public.receipt_orders (receipt_id, order_id)
  select v_receipt_id, o.id from public.orders o where o.id = any (p_order_ids);

  insert into public.receipt_items (receipt_id, title, options, modifiers, quantity, unit_price, sort_order)
  select v_receipt_id, i.title, i.options, i.modifiers, i.quantity, i.unit_price,
         row_number() over (order by i.title)
  from public.order_items i
  where i.order_id = any (p_order_ids);

  if jsonb_array_length(coalesce(p_payments, '[]'::jsonb)) = 0 then
    insert into public.receipt_payments (receipt_id, method, amount)
    values (v_receipt_id, 'cash', v_total);
  else
    for v_payment in select * from jsonb_array_elements(p_payments)
    loop
      -- Платёж без суммы — «на весь остаток чека». Так зовёт гостевой шлюз:
      -- считать итог второй раз на его стороне значит завести второй источник
      -- правды, который разойдётся с первым на первой же скидке.
      insert into public.receipt_payments (receipt_id, method, amount, change_given, provider_ref, status)
      values (
        v_receipt_id,
        coalesce(v_payment ->> 'method', 'cash'),
        coalesce(
          (v_payment ->> 'amount')::numeric,
          v_total - coalesce((select sum(amount) from public.receipt_payments where receipt_id = v_receipt_id), 0)
        ),
        coalesce((v_payment ->> 'change_given')::numeric, 0),
        v_payment ->> 'provider_ref',
        coalesce(v_payment ->> 'status', 'paid')
      );
    end loop;

    select coalesce(sum(amount), 0) into v_paid
    from public.receipt_payments
    where receipt_id = v_receipt_id and status = 'paid';

    -- Копейки округления прощаем, расхождение в сомони — нет: это или недобор
    -- денег, или касса ошиблась в сдаче.
    if abs(v_paid - v_total) > 0.5 then
      raise exception 'Платежи (%) не сходятся с чеком (%)', v_paid, v_total;
    end if;
  end if;

  -- Чаевые остаются и в заказе: кабинет официанта считает их по своим столам,
  -- и переучивать его ради чека незачем.
  if p_tip is not null and p_tip > 0 and v_last_order is not null then
    update public.orders set tip = p_tip where id = v_last_order;
  end if;

  update public.orders
  set status = 'paid'
  where id = any (p_order_ids) and status not in ('paid', 'cancelled');

  return v_receipt_id;
end;
$$;

revoke all on function public.close_bill(uuid[], jsonb, uuid, uuid, numeric, text, numeric) from public;
grant execute on function public.close_bill(uuid[], jsonb, uuid, uuid, numeric, text, numeric) to authenticated, service_role;
