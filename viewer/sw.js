/* sw.js - 마마 오피스 서비스워커 */
const CACHE = 'mama-v6';
const CORE = ['./', './index.html', './manifest.json', './mama-ext.js', './mama-fix.js',
  './mama-rhwp.js', './mama-svgid.js', './mama-mode.js', './mama-excel.js', './mama-tohwp.js', './mama-home.js', './mama-pinch.js', './mama-files.js', './logo.png?v=2', './vendor/exceljs/exceljs.min.js', './vendor/rhwp/rhwp.js', './vendor/rhwp/rhwp_bg.wasm'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'mama-share').map(k => caches.delete(k)))));
  self.clients.claim();
});
/* 공유 받기 (안드로이드 공유 메뉴 → manifest share_target) */
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'POST' || !u.pathname.endsWith('/share-target')) return;
  e.respondWith((async () => {
    let ok = 0;
    try {
      const fd = await e.request.formData();
      const f = fd.getAll('file').find(x => x && typeof x === 'object' && x.size);
      if (f) {
        const c = await caches.open('mama-share');
        await c.put(new URL('./__shared__', self.registration.scope).href, new Response(f, { headers: {
          'Content-Type': f.type || 'application/octet-stream', 'X-Mama-Name': encodeURIComponent(f.name || 'shared') } }));
        ok = 1;
      }
    } catch (err) {}
    return Response.redirect(new URL('./index.html?share=' + ok, self.registration.scope).href, 303);
  })());
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  // 같은 서버의 확장자 없는 경로(/ping, /poll, /convert-pdf...)는 서버 API -> 캐시 금지
  if (u.origin === location.origin && u.pathname !== '/' && !/\.[a-z0-9]+$/i.test(u.pathname)) return;
  e.respondWith(fetch(r).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});