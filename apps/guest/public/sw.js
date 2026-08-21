// Сервис-воркер гостевого меню (фаза 6 ТЗ).
//
// Кэшируем только свою статику: оболочку приложения, скрипты, стили, картинки
// блюд. Запросы в Supabase не трогаем совсем — заказ и статусы обязаны быть
// свежими, а показать вчерашний счёт из кэша хуже, чем честно не показать.

const CACHE = 'qr-menu-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Чужие домены (Supabase) — мимо кэша: свежесть данных важнее офлайна.
  if (url.origin !== self.location.origin) return;

  // Навигация: сначала сеть, кэш — запасной путь, чтобы приложение открывалось
  // и без связи, но обновлялось сразу, как только связь есть.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Статика собрана с хэшем в имени: если файл уже в кэше, он не устареет.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
