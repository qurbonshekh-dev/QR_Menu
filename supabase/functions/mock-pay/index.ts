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

  // Счёт закрывает `close_bill` — одна функция на всех, кто это делает: касса,
  // официант и вот этот шлюз. Чек с методом «qr» появляется здесь же, иначе
  // оплаченное гостем не попало бы ни в один отчёт кассы.
  //
  // Чаевые передаём ей: она сама положит их в последний заказ и в чек. Если
  // гость оставил их раньше, отдельным действием, — берутся те, что в заказах.
  const orderIds = orders.map((order) => order.id);
  const { data: receiptId, error: closeError } = await admin.rpc('close_bill', {
    p_order_ids: orderIds,
    // Без суммы: её знает чек, а второй расчёт на этой стороне разошёлся бы
    // с ним на первой же скидке.
    p_payments: [{ method: 'qr', status: 'paid', provider_ref: 'mock-pay' }],
    p_tip: tip > 0 ? tip : null,
  });
  if (closeError) return json({ error: closeError.message }, 400);

  const { data: receipt } = await admin
    .from('receipts')
    .select('number, total')
    .eq('id', receiptId)
    .maybeSingle();

  return json({
    ok: true,
    paid: Number(receipt?.total ?? 0),
    receipt: receipt?.number,
    orders: orders.map((o) => o.number),
  });
});
