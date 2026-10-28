/* mama-tohwp.js v2 : 기존 'hwp → hwpx 편집본' 버튼을 양방향 변환 저장 버튼으로 교체 */
(function () {
  'use strict';
  const TAG = '[mama-tohwp]';
  if (localStorage.getItem('mamaConv') === 'off') { console.log(TAG, '꺼짐'); return; }
  const RX = /hwp\s*→\s*hwpx|hwpx\s*→\s*hwp|변환 중/;
  let last = null, alive = false, btn = null, busy = false;

  function findBtn() {
    if (btn && btn.isConnected) return btn;
    btn = null;
    for (const b of document.querySelectorAll('button, a, [role="button"]')) {
      if (RX.test(b.textContent)) { btn = b; b.dataset.mamaConv = '1'; break; }
    }
    return btn;
  }
  function setLabel(b, s) {
    if (b.textContent.trim() === s) return;
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let n, t = null;
    while ((n = w.nextNode())) { if (n.nodeValue.trim()) { if (!t) t = n; else n.nodeValue = ''; } }
    if (t) t.nodeValue = s; else b.textContent = s;
  }
  function kind() {
    if (!last) return '';
    const m = /\.(hwpx?)$/i.exec(last.name || '');
    return m ? m[1].toLowerCase() : '';
  }
  function sync() {
    const b = findBtn(); if (!b || busy) return;
    const k = kind();
    if (alive && k) {
      b.style.removeProperty('display');
      setLabel(b, k === 'hwpx' ? 'hwpx → hwp 변환 저장' : 'hwp → hwpx 변환 저장');
      b.title = '한글 2024로 변환해서 내려받기 (PC 서버 필요)';
    } else {
      b.style.setProperty('display', 'none', 'important');
    }
  }
  function remember(f) {
    if (f && f.name && typeof f.arrayBuffer === 'function') { last = f; setTimeout(sync, 0); setTimeout(sync, 800); }
  }

  const prev = window.handleFile;
  if (typeof prev === 'function') {
    window.handleFile = function () { for (const a of arguments) remember(a); return prev.apply(this, arguments); };
  }
  document.addEventListener('change', e => { const t = e.target; if (t && t.files && t.files[0]) remember(t.files[0]); }, true);
  document.addEventListener('drop', e => { const d = e.dataTransfer; if (d && d.files && d.files[0]) remember(d.files[0]); }, true);

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  document.addEventListener('click', async e => {
    const b = e.target.closest && e.target.closest('[data-mama-conv]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const k = kind(); if (!k || busy) return;
    const to = k === 'hwpx' ? 'hwp' : 'hwpx';
    const url = (to === 'hwp' ? './convert-hwp' : './convert-hwpx') + '?name=' + encodeURIComponent(last.name);
    busy = true; setLabel(b, '변환 중… (한글 실행)'); b.style.pointerEvents = 'none';
    try {
      const r = await fetch(url, { method: 'POST', body: last });
      if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200));
      const blob = await r.blob();
      if (blob.size < 1000) throw new Error('결과 파일이 너무 작음 ' + blob.size + 'B');
      const name = last.name.replace(/\.hwpx?$/i, '.' + to);
      download(blob, name);
      console.log(TAG, '저장 완료', name, blob.size + 'B');
    } catch (err) {
      console.error(TAG, err);
      alert('변환 실패: ' + (err.message || err));
    } finally {
      busy = false; b.style.pointerEvents = ''; sync();
    }
  }, true);

  let timer = 0;
  new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(sync, 300); })
    .observe(document.body, { childList: true, subtree: true });

  fetch('./ping', { cache: 'no-store' })
    .then(r => { alive = r.ok; sync(); console.log(TAG, alive ? '서버 연결됨' : '서버 없음(버튼 숨김)'); })
    .catch(() => { alive = false; sync(); });
  sync();
  console.log(TAG, '준비 완료 (끄기: localStorage.mamaConv="off")');
})();