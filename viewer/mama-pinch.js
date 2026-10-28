/* mama-pinch.js v2 : 두 손가락 확대/축소 + 두 번 탭(폭 맞춤<->100%) + 폰에서 한글 문서 자동 폭 맞춤 */
(function () {
  'use strict';
  if (localStorage.getItem('mamaPinch') === 'off') return;
  var TAG = '[mama-pinch]', MIN = 0.3, MAX = 4;
  var g = null, raf = 0, pend = null, tapS = null, lastTap = null, pinched = false;

  function scroller(el) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.tagName === 'HEADER') return null;
      var cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowX + ' ' + cs.overflowY) && el.children.length) return el;
    }
    return null;
  }
  function kidsOf(sc) {
    return Array.prototype.filter.call(sc.children, function (k) {
      var cs = getComputedStyle(k);
      return cs.display !== 'none' && cs.position !== 'fixed';
    });
  }
  function curZ(kids) { return parseFloat(kids[0].style.zoom) || 1; }
  function label(sc, z) {
    if (sc.id !== 'rhwp-scroll') return;
    var lb = document.getElementById('rhwp-zoom');
    if (lb) lb.textContent = Math.round(z * 100) + '%';
  }
  function zoomTo(sc, kids, z, cx, cy) {
    var old = curZ(kids);
    z = Math.min(MAX, Math.max(MIN, z));
    if (Math.abs(z - old) < 0.005) return old;
    var r = sc.getBoundingClientRect();
    if (cx == null) { cx = r.left + sc.clientWidth / 2; cy = r.top + sc.clientHeight / 2; }
    var px = sc.scrollLeft + cx - r.left, py = sc.scrollTop + cy - r.top;
    kids.forEach(function (k) { k.style.zoom = z; });
    var ratio = z / old;
    sc.scrollLeft = px * ratio - (cx - r.left);
    sc.scrollTop = py * ratio - (cy - r.top);
    label(sc, z);
    return z;
  }
  function fitZ(sc, kids) {
    var old = curZ(kids), w = 0;
    kids.forEach(function (k) { k.style.zoom = 1; });
    kids.forEach(function (k) { w = Math.max(w, k.scrollWidth); });
    kids.forEach(function (k) { k.style.zoom = old; });
    var cs = getComputedStyle(sc);
    var avail = sc.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return w > 0 ? Math.min(MAX, Math.max(MIN, Math.floor(avail / w * 100) / 100)) : 1;
  }
  function dist(t) { var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY; return Math.sqrt(dx * dx + dy * dy) || 1; }
  function mid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }; }

  function apply() {
    raf = 0;
    if (!g || !pend) return;
    g.z = zoomTo(g.sc, g.kids, pend.z, pend.x, pend.y);
  }

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      var t = e.touches[0];
      tapS = { x: t.clientX, y: t.clientY, t: Date.now(), target: t.target };
      pinched = false;
      return;
    }
    tapS = null;
    if (e.touches.length !== 2) return;
    var sc = scroller(e.touches[0].target);
    if (!sc || !sc.contains(e.touches[1].target)) return;
    var kids = kidsOf(sc);
    if (!kids.length) return;
    var z0 = curZ(kids);
    g = { sc: sc, kids: kids, z0: z0, z: z0, d0: dist(e.touches) };
    pinched = true;
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (tapS && e.touches.length === 1) {
      var t = e.touches[0];
      if (Math.abs(t.clientX - tapS.x) > 10 || Math.abs(t.clientY - tapS.y) > 10) tapS = null;
    }
    if (!g || e.touches.length !== 2) return;
    e.preventDefault();
    var m = mid(e.touches);
    pend = { z: g.z0 * dist(e.touches) / g.d0, x: m.x, y: m.y };
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: false });

  function doubleTap(x, y, target) {
    if (target.closest && target.closest('button,a,input,select,textarea,[contenteditable="true"]')) return;
    var sc = scroller(target);
    if (!sc) return;
    var kids = kidsOf(sc);
    if (!kids.length) return;
    var f = fitZ(sc, kids), z = curZ(kids), nz;
    if (Math.abs(z - f) < 0.03) nz = Math.abs(f - 1) < 0.03 ? 2 : 1;
    else nz = f;
    nz = zoomTo(sc, kids, nz, x, y);
    console.info(TAG, '두 번 탭 →', Math.round(nz * 100) + '%');
  }

  function end(e) {
    if (g && e.touches.length < 2) {
      console.info(TAG, '배율', Math.round(g.z * 100) + '%');
      g = null; pend = null;
    }
    if (e.type === 'touchend' && e.touches.length === 0 && tapS && !pinched && Date.now() - tapS.t < 250) {
      var t = e.changedTouches[0], now = Date.now();
      if (lastTap && now - lastTap.t < 320 && Math.abs(t.clientX - lastTap.x) < 30 && Math.abs(t.clientY - lastTap.y) < 30) {
        doubleTap(t.clientX, t.clientY, tapS.target);
        lastTap = null;
      } else lastTap = { x: t.clientX, y: t.clientY, t: now };
    }
    if (e.touches.length === 0) tapS = null;
  }
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', end, { passive: true });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  /* 폰(폭 900px 미만)에서 한글 문서를 열면 화면 폭에 맞춤 */
  var fitted = new WeakSet(), ft = 0;
  function autoFit() {
    var pages = document.getElementById('rhwp-pages'), sc = document.getElementById('rhwp-scroll');
    if (!pages || !sc || !pages.firstElementChild || fitted.has(pages.firstElementChild) || !sc.clientWidth) return;
    fitted.add(pages.firstElementChild);
    if (window.innerWidth >= 900) return;
    var f = Math.min(1, fitZ(sc, [pages]));
    pages.style.zoom = f; sc.scrollLeft = 0; sc.scrollTop = 0; label(sc, f);
    console.info(TAG, '폭 맞춤', Math.round(f * 100) + '%');
  }
  new MutationObserver(function () { clearTimeout(ft); ft = setTimeout(autoFit, 250); })
    .observe(document.body, { childList: true, subtree: true });

  console.info(TAG, 'v2 준비 완료 (끄기: localStorage.mamaPinch="off")');
})();