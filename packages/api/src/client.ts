import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Один клиент Supabase на приложение. Ключ публикуемый (anon) — он и задуман
 * для браузера, доступ ограничивают RLS-политики, а не секретность ключа.
 * Значения читаются из переменных окружения Vite: envDir указывает на корень
 * воркспейса, поэтому .env один на все три приложения.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Скопируйте .env.example в .env — см. README.',
  );
}

export const supabase = createClient<Database>(url, key);

/**
 * Имя канала realtime обязано быть уникальным на подписку. Одно имя на два
 * компонента — и второй `.on()` прилетает уже после `subscribe()`: supabase-js
 * бросает исключение, а React роняет экран в белое. Так и случилось, когда на
 * запросы гостей подписались и оболочка (ради счётчика), и сам экран сообщений.
 */
export function channelName(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** Ресторан пока один. Когда их станет несколько, id придёт из QR-ссылки —
 *  `?restaurant=` уже читается в TableSessionProvider гостевого приложения. */
export async function currentRestaurantId(): Promise<string> {
  const { data, error } = await supabase.from('restaurants').select('id').limit(1).single();
  if (error) throw error;
  return data.id;
}
