// Service Worker — офлайн-режим дневника тренировок
// Версия кэша: подними цифру, если надо принудительно сбросить кэш у всех
const CACHE = 'wd-v5';

// Свои файлы (пути относительные — сайт живёт в подпапке /workout-diary/)
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon.svg'
];

// Внешние библиотеки. Без них приложение офлайн не запустится вообще:
// firebase-app-compat падает первым, и дальше ни одна строка не выполняется.
const VENDOR = [
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Живые данные — эти запросы кэшировать нельзя никогда
const NEVER_CACHE = [
  /firestore\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebaseinstallations\.googleapis\.com/,
  /google\.firestore\./
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Каждый файл отдельно: если один отсутствует, установка не срывается
    await Promise.all(CORE.map(u => c.add(u).catch(err => console.log('skip', u, err))));
    // Внешние — через no-cors, ответ непрозрачный, но для <script src> этого хватает
    await Promise.all(VENDOR.map(async u => {
      try {
        const r = await fetch(u, { mode: 'no-cors' });
        await c.put(u, r);
      } catch (err) { console.log('skip vendor', u); }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (NEVER_CACHE.some(re => re.test(req.url))) return; // уходит в сеть как есть

  // Открытие приложения: сначала сеть (чтобы подхватить новую версию),
  // при отсутствии связи — сохранённая копия
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(CACHE);
        c.put('./index.html', net.clone());
        return net;
      } catch (err) {
        const c = await caches.open(CACHE);
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Всё остальное (скрипты, шрифты, иконки): сначала кэш, потом сеть
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) return hit;
    try {
      const net = await fetch(req);
      if (net && (net.ok || net.type === 'opaque')) c.put(req, net.clone());
      return net;
    } catch (err) {
      return hit || Response.error();
    }
  })());
});
