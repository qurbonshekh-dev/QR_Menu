-- У заказа ровно одна доставка — и база должна об этом знать.
--
-- Без уникального ограничения PostgREST считает связь «один ко многим» и
-- отдаёт `deliveries` массивом, а сгенерированные типы обещают объект
-- (`isOneToOne: true`). Расхождение молча ломало кухню: `order.deliveries?.kind`
-- всегда undefined, и заказ на самовывоз подписывался «Доставка» — повар
-- собирал его без упаковки навынос.

alter table public.deliveries
  add constraint deliveries_order_id_key unique (order_id);
