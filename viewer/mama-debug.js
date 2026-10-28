/* mama-debug.js : 폰 진단용 (?debug=1 화면 로그 / ?debug=0 끄기 / ?off=files,pinch 기능 끄기 / ?on=all 모두 켜기) */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var MAP = { files: 'mamaFiles', pinch: 'mamaPinch', rhwp: 'mamaRhwp', excel: 'mamaExcel', home: 'mamaHome', conv: 'mamaConv' };
  if (q.has('off')) q.get('off').split(',').forEach(function (k) { k = k.trim(); if (MAP[k]) localStorage.setItem(MAP[k], 'off'); });
  if (q.has('on')) { var v = q.get('on').split(','); Object.keys(MAP).forEach(function (k) { if (v[0] === 'all' || v.indexOf(k) >= 0) localStorage.removeItem(MAP[k]); }); }
  if (q.has('debug')) { if (q.get('debug') === '0') localStorage.removeItem('mamaDebug'); else localStorage.setItem('mamaDebug', '1'); }
  if (localStorage.getItem('mamaDebug') !== '1') return;

  var lines = [], pre = null;
  function str(a) {
    if (a instanceof Error) return a.name + ': ' + a.message;
    if (a && typeof a === 'object') { try { return JSON.stringify(a).slice(0, 200); } catch (e) { return String(a); } }
    return String(a);
  }
  function add(kind, args) {
    var t = new Date().toTimeString().slice(0, 8);
    lines.push((kind === 'E' ? '[오류] ' : kind === 'W' ? '[경고] ' : '') + t + ' ' + Array.prototype.map.call(args, str).join(' '));
    if (lines.length > 100) lines.shift();
    if (pre) { pre.textContent = lines.join('\n'); pre.scrollTop = pre.scrollHeight; }
  }
  ['log', 'info', 'warn', 'error'].forEach(function (m) {
    var o = console[m];
    console[m] = function () { add(m === 'error' ? 'E' : m === 'warn' ? 'W' : 'I', arguments); return o.apply(console, arguments); };
  });
  window.addEventListener('error', function (e) { add('E', [e.message + ' @ ' + (e.filename || '').split('/').pop() + ':' + e.lineno]); });
  window.addEventListener('unhandledrejection', function (e) { add('E', ['Promise: ', e.reason]); });
  document.addEventListener('change', function (e) {
    var f = e.target && e.target.files && e.target.files[0];
    if (f) add('I', ['[선택] ' + f.name + ' / ' + f.size + 'B / type=' + (f.type || '(없음)')]);
  }, true);

  var offs = Object.keys(MAP).filter(function (k) { return localStorage.getItem(MAP[k]) === 'off'; });
  add('I', ['폭 ' + innerWidth + 'px / 꺼진 기능: ' + (offs.join(',') || '없음') + ' / ' + navigator.userAgent.slice(0, 90)]);

  function mount() {
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,.88);color:#7CFC00;font:11px/1.35 monospace';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;padding:4px 6px;background:#222';
    function btn(t, f) { var b = document.createElement('button'); b.textContent = t; b.style.cssText = 'color:#fff;background:#444;border:0;border-radius:4px;padding:3px 8px;font-size:12px'; b.onclick = f; bar.appendChild(b); }
    btn('접기', function () { pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; });
    btn('지우기', function () { lines = []; pre.textContent = ''; });
    btn('복사', function () { navigator.clipboard && navigator.clipboard.writeText(lines.join('\n')).then(function () { alert('복사됨'); }); });
    btn('진단 끄기', function () { localStorage.removeItem('mamaDebug'); box.remove(); });
    pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;padding:6px;height:32vh;overflow:auto;white-space:pre-wrap;word-break:break-all';
    pre.textContent = lines.join('\n');
    box.appendChild(bar); box.appendChild(pre);
    document.body.appendChild(box);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();