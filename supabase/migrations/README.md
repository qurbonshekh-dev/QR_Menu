# Миграции

База проекта `Food` (`rkuyxugalgkgunofrdkh`) собиралась через Supabase MCP, поэтому первые
таблицы существуют только в облаке. Всё, что меняет схему **после** появления этой папки,
кладётся сюда файлом — иначе через месяц никто не ответит, почему у `staff` появилась колонка.

Применять: Supabase Dashboard → SQL Editor → вставить файл целиком, либо
`supabase db push`, если подключён CLI.

## Первый менеджер

Панель ресторана заводит учётные записи, но саму себя завести не может: первый
менеджер должен появиться руками. Один раз:

1. Supabase Dashboard → Authentication → Users → **Add user** (почта и пароль на ваше усмотрение,
   галочка «Auto Confirm User»).
2. Привязать его к сотруднику:

```sql
update public.staff
set auth_user_id = (select id from auth.users where email = 'ПОЧТА_МЕНЕДЖЕРА')
where name = 'ИМЯ_СОТРУДНИКА';
```

Если строки менеджера в штате ещё нет:

```sql
insert into public.staff (restaurant_id, name, role, auth_user_id)
select r.id, 'Имя менеджера', 'manager', u.id
from public.restaurants r, auth.users u
where u.email = 'ПОЧТА_МЕНЕДЖЕРА'
limit 1;
```

Дальше — всё в панели: `npm run dev:admin`, вход менеджера, «Новый сотрудник».
