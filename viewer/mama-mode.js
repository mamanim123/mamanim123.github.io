/* mama-mode.js */
(function () {
  if ('serviceWorker' in navigator && window.isSecureContext)
    navigator.serviceWorker.register('./sw.js').then(function () { console.info('[mama-mode] 서비스워커 등록'); })
      .catch(function (e) { console.warn('[mama-mode] 서비스워커 실패', e); });
  var NEED = ['원본 조판 PDF', 'hwp → hwpx 편집본', '한글에서 편집'];
  function hide() { document.querySelectorAll('button').forEach(function (b) {
    if (NEED.indexOf(b.textContent.trim()) >= 0) b.style.display = 'none'; }); }
  var ac = new AbortController(); setTimeout(function () { ac.abort(); }, 2500);
  fetch('./ping', { cache: 'no-store', signal: ac.signal })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (!j || !j.ok) throw 0; window.mamaServer = true; console.info('[mama-mode] 서버 연결됨 (전체 기능)'); })
    .catch(function () { window.mamaServer = false; hide(); setTimeout(hide, 1500); setTimeout(hide, 4000);
      console.info('[mama-mode] 서버 없음 -> 보기 전용'); });
})();