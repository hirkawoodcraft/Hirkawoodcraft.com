/* Service worker: برنامه را آفلاین قابل‌استفاده می‌کند.
   - index.html: اول اینترنت (برای گرفتن آخرین نسخه)، اگر نبود یا کند بود از حافظه.
   - بقیه‌ی فایل‌ها: از حافظه، و در پس‌زمینه به‌روز می‌شوند.
   فقط وقتی فهرست فایل‌ها عوض شد عدد VER را بالا ببرید. */
const VER = 'mdf-v1';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const OPTIONAL = ['Vazirmatn.woff2']; // اگر فایل فونت را آپلود کرده باشید ذخیره می‌شود، وگرنه نادیده گرفته می‌شود

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VER);
    await c.addAll(CORE);
    await Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VER) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VER);
    if (r.mode === 'navigate') {
      try {
        const n = await Promise.race([
          fetch(new Request(r.url, { cache: 'no-cache' })),
          new Promise((_, j) => setTimeout(j, 4000))
        ]);
        if (n && n.ok) { c.put('index.html', n.clone()); return n; }
      } catch (_) {}
      return (await c.match('index.html')) || (await c.match('./')) || Response.error();
    }
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(n => { if (n && n.ok) c.put(r, n.clone()); return n; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
