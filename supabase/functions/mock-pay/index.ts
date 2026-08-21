// Мок платёжного шлюза (фаза 4 гостевого ТЗ).
//
// Закрытие счёта живёт на сервере, а не в браузере, потому что «оплачено» —
// это не то, что клиент может объявить сам: у гостя в RLS есть право ровно
// на одну колонку (чаевые). Когда появится настоящий шлюз, здесь будет
// проверка его подписи или вебхука, а всё остальное останется как есть.
//
// Пока проверки нет: любой, кто знает номер стола, может закрыть его счёт.
// Это осознанная граница мока — деньги в приложении не двигаются.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const body = await req.json().catch(() => ({}));
  const tableNumber = String(body.tableNumber ?? '').trim();
  const tip = Number(body.tip ?? 0);
  if (!tableNumber) return json({ error: 'Не указан стол' }, 400);

  const { data: table } = await admin
    .from('dining_tables')
    .select('id')
    .eq('number', tableNumber)
    .maybeSingle();
  if (!table) return json({ error: 'Стол не найден' }, 404);

  const { data: orders, error: readError } = await admin
    .from('orders')
    .select('id, number, total')
    .eq('table_id', table.id)
    .not('status', 'in', '(cancelled,paid)');
  if (readError) return json({ error: readError.message }, 400);
  if (!orders?.length) return json({ error: 'За столом нет открытого счёта' }, 409);

  // Чаевые кладём на последний заказ — счёт гость закрывает один раз.
  if (tip > 0) {
    const last = orders[orders.length - 1];
    const { error } = await admin.from('orders').update({ tip }).eq('id', last.id);
    if (error) return json({ error: error.message }, 400);
  }

  const { error: payError } = await admin
    .from('orders')
    .update({ status: 'paid' })
    .in('id', orders.map((order) => order.id));
  if (payError) return json({ error: payError.message }, 400);

  // Сумму считаем после записи чаевых и по самой базе: гость мог оставить их
  // раньше, отдельным действием, и клиент об этом уже не помнит.
  const { data: closed } = await admin
    .from('orders')
    .select('total, tip')
    .in('id', orders.map((order) => order.id));

  const paid = (closed ?? []).reduce(
    (sum, order) => sum + Number(order.total ?? 0) + Number(order.tip ?? 0),
    0,
  );
  return json({ ok: true, paid, orders: orders.map((o) => o.number) });
});
