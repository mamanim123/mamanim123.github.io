/* mama-home.js v2 : 첫 화면 정리 (카드 안에서만 숨김) + 로고 교체 */
(function () {
  'use strict';
  const TAG = '[mama-home]';
  if (localStorage.getItem('mamaHome') === 'off') { console.log(TAG, '꺼짐'); return; }
  const UP = '여기를 클릭하거나';
  const TITLE = '마마 오피스 뷰어';
  const HIDE = ['새 한글 문서', '새 엑셀 시트', '체험용 샘플'];
  const LOGO = './logo.png?v=2';
  let logoOk = null;

  const probe = new Image();
  probe.onload = () => { logoOk = true; apply(); };
  probe.onerror = () => { logoOk = false; console.log(TAG, 'logo.png 없음 → 기존 아이콘 유지'); };
  probe.src = LOGO;

  function findAll(txt, root, exact) {
    const out = [], w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const v = n.nodeValue;
      if (exact ? v.trim() === txt : v.includes(txt)) out.push(n.parentElement);
    }
    return out;
  }
  function getCard() {
    for (const up of findAll(UP)) {
      let el = up;
      while (el && el !== document.body) {
        if (el.textContent.includes(TITLE)) return { card: el, up: up };
        el = el.parentElement;
      }
    }
    return null;
  }
  function hideIn(card) {
    for (const t of HIDE) {
      for (let el of findAll(t, card)) {
        while (el.parentElement && el.parentElement !== card &&
               !el.parentElement.textContent.includes(UP)) el = el.parentElement;
        if (el !== card && !el.textContent.includes(UP) && !el.dataset.mamaHidden) {
          el.style.setProperty('display', 'none', 'important');
          el.dataset.mamaHidden = '1';
          console.log(TAG, '숨김:', t);
        }
      }
    }
  }
  function enlarge(up) {
    let zone = up;
    for (let i = 0; i < 6 && zone; i++) {
      if (getComputedStyle(zone).borderTopStyle === 'dashed') break;
      zone = zone.parentElement;
    }
    if (!zone || getComputedStyle(zone).borderTopStyle !== 'dashed') zone = up.parentElement;
    if (!zone || zone.dataset.mamaBig) return;
    zone.dataset.mamaBig = '1';
    Object.assign(zone.style, { minHeight: '320px', padding: '48px 24px', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center' });
    up.style.fontSize = '20px'; up.style.fontWeight = '700';
    if (up.nextElementSibling) up.nextElementSibling.style.fontSize = '14px';
    zone.querySelectorAll('svg, i').forEach(ic => { ic.style.width = '64px'; ic.style.height = '64px'; });
    let c = zone.parentElement;
    for (let i = 0; i < 6 && c; i++) {
      if (/\bmax-w-/.test(c.className || '')) { c.style.maxWidth = '680px'; c.style.width = '100%'; break; }
      c = c.parentElement;
    }
    console.log(TAG, '파일 선택 영역 확대');
  }
  function logo(card) {
    if (logoOk !== true) return;
    const t = findAll(TITLE, card, true)[0];
    if (!t) return;
    let box = null, el = t;
    for (let i = 0; i < 3 && el && el !== card && !box; i++) {
      const p = el.previousElementSibling;
      if (p && !p.textContent.trim() && p.querySelector('svg, i, img')) box = p;
      el = el.parentElement;
    }
    if (!box || box.querySelector('img[data-mama-logo]')) return;
    box.innerHTML = '<img data-mama-logo="1" src="' + LOGO + '" alt="청담재활 주간보호" ' +
      'style="height:96px;width:auto;display:block;border-radius:12px">';
    Object.assign(box.style, { background: 'transparent', border: '0', boxShadow: 'none',
      width: 'auto', height: 'auto', padding: '0' });
    console.log(TAG, '로고 교체');
  }
  function apply() {
    const r = getCard(); if (!r) return;
    hideIn(r.card); enlarge(r.up); logo(r.card);
  }
  let timer = 0;
  new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(apply, 300); })
    .observe(document.body, { childList: true, subtree: true });
  apply();
  console.log(TAG, 'v2 준비 완료 (끄기: localStorage.mamaHome="off")');
})();