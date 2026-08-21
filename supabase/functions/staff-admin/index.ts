// Заведение учётных записей персонала. Живёт на сервере, а не в админке,
// потому что создание пользователя требует service_role-ключа — в браузер
// такой ключ класть нельзя ни при каких условиях.
//
// Кто вызывает — проверяем по его же токену: заводить сотрудников может только
// менеджер. Проверка роли на клиенте была бы украшением: запрос к функции
// можно послать и мимо интерфейса.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROLES = ['waiter', 'cook', 'manager'];

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

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user) return json({ error: 'Нужен вход' }, 401);

  const { data: manager } = await admin
    .from('staff')
    .select('id, role, restaurant_id')
    .eq('auth_user_id', caller.user.id)
    .maybeSingle();
  if (!manager || manager.role !== 'manager') {
    return json({ error: 'Заводить сотрудников может только менеджер' }, 403);
  }

  const body = await req.json().catch(() => ({}));

  if (body.action === 'create') {
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const role = String(body.role ?? '');

    if (!name || !email || password.length < 8 || !ROLES.includes(role)) {
      return json({ error: 'Проверьте имя, почту, роль и пароль (от 8 символов)' }, 400);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      // Почты у поваров может не быть вовсе — подтверждать некому и нечем.
      email_confirm: true,
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Не удалось создать учётную запись' }, 400);
    }

    const { error: staffError } = await admin.from('staff').insert({
      restaurant_id: manager.restaurant_id,
      name,
      role,
      auth_user_id: created.user.id,
    });
    if (staffError) {
      // Пользователь без строки в штате войти всё равно не сможет, а мусор
      // в auth останется навсегда — убираем сразу.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: staffError.message }, 400);
    }

    return json({ ok: true });
  }

  // Вход существующему сотруднику. Отдельное действие, а не 'create':
  // у Анны уже есть строка в штате, за ней закреплены столы и её заказы —
  // заводить дубль ради логина значит потерять всё это.
  if (body.action === 'attach') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const staffId = String(body.staffId ?? '');

    if (!email || password.length < 8 || !staffId) {
      return json({ error: 'Проверьте почту и пароль (от 8 символов)' }, 400);
    }

    const { data: member } = await admin
      .from('staff')
      .select('id, auth_user_id')
      .eq('id', staffId)
      .maybeSingle();
    if (!member) return json({ error: 'Сотрудник не найден' }, 404);
    if (member.auth_user_id) return json({ error: 'У сотрудника уже есть вход' }, 400);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Не удалось создать учётную запись' }, 400);
    }

    const { error: linkError } = await admin
      .from('staff')
      .update({ auth_user_id: created.user.id })
      .eq('id', member.id);
    if (linkError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: linkError.message }, 400);
    }

    return json({ ok: true });
  }

  if (body.action === 'reset-password') {
    const password = String(body.password ?? '');
    if (password.length < 8) return json({ error: 'Пароль от 8 символов' }, 400);

    const { data: member } = await admin
      .from('staff')
      .select('auth_user_id')
      .eq('id', String(body.staffId ?? ''))
      .maybeSingle();
    if (!member?.auth_user_id) return json({ error: 'У сотрудника нет учётной записи' }, 404);

    const { error } = await admin.auth.admin.updateUserById(member.auth_user_id, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Неизвестное действие' }, 400);
});
