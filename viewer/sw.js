/* sw.js - 마마 오피스 서비스워커 */
const CACHE = 'mama-v4';
const CORE = ['./', './index.html', './manifest.json', './mama-ext.js', './mama-fix.js',
  './mama-rhwp.js', './mama-svgid.js', './mama-mode.js', './mama-excel.js', './mama-tohwp.js', './mama-home.js', './mama-pinch.js', './logo.png?v=2', './vendor/exceljs/exceljs.min.js', './vendor/rhwp/rhwp.js', './vendor/rhwp/rhwp_bg.wasm'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
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