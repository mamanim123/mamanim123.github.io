/* mama-files.js : 최근 연 파일 목록(폰 안에 저장) + 공유 메뉴로 받은 파일 열기 */
(function () {
  'use strict';
  const TAG = '[mama-files]';
  if (localStorage.getItem('mamaFiles') === 'off') { console.log(TAG, '꺼짐'); return; }
  const KEEP = 10, MAXSZ = 30 * 1024 * 1024;
  let dbP = null, box = null;

  function db() {
    if (!dbP) dbP = new Promise((res, rej) => {
      const r = indexedDB.open('mama-files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('recent', { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbP;
  }
  function run(mode, fn) {
    return db().then(d => new Promise((res, rej) => {
      const t = d.transaction('recent', mode), q = fn(t.objectStore('recent'));
      t.oncomplete = () => res(q ? q.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }
  const list = () => run('readonly', s => s.getAll()).then(a => (a || []).sort((x, y) => y.time - x.time));
  const getOne = id => run('readonly', s => s.get(id));
  const del = id => run('readwrite', s => s.delete(id));
  const clearAll = () => run('readwrite', s => s.clear());
  async function save(file) {
    if (!file || !file.name || file.size > MAXSZ) return;
    await run('readwrite', s => s.put({ id: file.name + '|' + file.size, name: file.name, size: file.size,
      type: file.type || '', time: Date.now(), blob: file }));
    const all = await list();
    for (const r of all.slice(KEEP)) await del(r.id);
  }

  const EXT = { hwp: ['HWP', '#2563eb'], hwpx: ['HWPX', '#2563eb'], xlsx: ['XLSX', '#059669'], xls: ['XLS', '#059669'],
    csv: ['CSV', '#059669'], pdf: ['PDF', '#e11d48'] };
  const fmtSize = n => n < 1024 ? n + 'B' : n < 1048576 ? Math.round(n / 1024) + 'KB' : (n / 1048576).toFixed(1) + 'MB';
  const fmtTime = t => { const d = new Date(t), p = x => String(x).padStart(2, '0');
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
  const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
  const stop = ev => { ev.preventDefault(); ev.stopPropagation(); };

  function findZone() {
    const z = document.querySelector('[data-mama-big]');
    if (z) return z;
    for (const e of document.querySelectorAll('label, div')) {
      if (e.textContent.includes('여기를 클릭하거나') && getComputedStyle(e).borderTopStyle === 'dashed') return e;
    }
    return null;
  }
  async function render() {
    if (!box) return;
    let items = [];
    try { items = await list(); } catch (e) { console.warn(TAG, e); }
    box.textContent = '';
    if (!items.length) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    const head = el('div', 'display:flex;justify-content:space-between;align-items:center;margin:0 2px 8px');
    head.appendChild(el('span', 'font-weight:700;font-size:14px;color:#334155', '최근 연 파일'));
    const clr = el('button', 'font-size:12px;color:#94a3b8;background:none;border:0;padding:4px', '모두 지우기');
    clr.onclick = async ev => { stop(ev); if (confirm('최근 파일 목록을 모두 지울까요?')) { await clearAll(); render(); } };
    head.appendChild(clr);
    box.appendChild(head);
    for (const r of items) {
      const ext = (r.name.split('.').pop() || '').toLowerCase();
      const [lab, col] = EXT[ext] || [ext.toUpperCase(), '#64748b'];
      const row = el('div', 'display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:6px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer');
      row.appendChild(el('span', 'flex:none;font:700 10px/1 sans-serif;color:#fff;background:' + col + ';border-radius:6px;padding:6px 0;width:42px;text-align:center', lab));
      const mid = el('div', 'flex:1;min-width:0');
      mid.appendChild(el('div', 'font-size:14px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', r.name));
      mid.appendChild(el('div', 'font-size:11px;color:#94a3b8;margin-top:2px', fmtSize(r.size) + ' · ' + fmtTime(r.time)));
      row.appendChild(mid);
      const x = el('button', 'flex:none;border:0;background:none;color:#cbd5e1;font-size:18px;padding:4px 6px', '✕');
      x.title = '목록에서 지우기';
      x.onclick = async ev => { stop(ev); await del(r.id); render(); };
      row.appendChild(x);
      row.onclick = ev => { stop(ev); openRecent(r.id); };
      box.appendChild(row);
    }
  }
  async function openRecent(id) {
    const r = await getOne(id);
    if (!r) { render(); return; }
    window.handleFile(new File([r.blob], r.name, { type: r.type || r.blob.type || '' }));
  }
  function mount() {
    const z = findZone();
    if (!z) return;
    if (box && box.isConnected && box.previousElementSibling === z) return;
    if (!box) { box = el('div', 'width:100%;max-width:680px;margin:16px auto 0;text-align:left'); box.id = 'mama-recent'; }
    z.after(box);
    render();
  }

  async function takeShared() {
    const q = new URLSearchParams(location.search);
    if (!q.has('share')) return;
    const key = new URL('./__shared__', location.href).href;
    history.replaceState(null, '', location.pathname);
    if (q.get('share') !== '1' || !('caches' in window)) { alert('공유된 파일을 받지 못했습니다.'); return; }
    try {
      const c = await caches.open('mama-share'), r = await c.match(key);
      if (!r) { alert('공유된 파일을 찾지 못했습니다.'); return; }
      const name = decodeURIComponent(r.headers.get('X-Mama-Name') || 'shared');
      const blob = await r.blob();
      await c.delete(key);
      console.info(TAG, '공유 받은 파일:', name);
      window.handleFile(new File([blob], name, { type: blob.type }));
    } catch (e) { console.error(TAG, e); alert('공유 파일 열기 실패: ' + e.message); }
  }

  const prev = window.handleFile;
  if (typeof prev === 'function') {
    window.handleFile = function (file) {
      if (file && file.name) save(file).then(render).catch(e => console.warn(TAG, '최근 목록 저장 실패', e));
      return prev.apply(this, arguments);
    };
  } else console.warn(TAG, 'handleFile 없음 → 최근 목록 저장 안 됨');

  let t = 0;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(mount, 400); })
    .observe(document.body, { childList: true, subtree: true });
  mount();
  takeShared();
  console.info(TAG, '준비 완료 (끄기: localStorage.mamaFiles="off")');
})();