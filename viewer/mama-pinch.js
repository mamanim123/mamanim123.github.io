/* mama-pinch.js : 모바일 두 손가락 확대/축소 (문서 영역만, 상단 메뉴는 고정) */
(function () {
  'use strict';
  if (localStorage.getItem('mamaPinch') === 'off') return;
  var TAG = '[mama-pinch]', MIN = 0.3, MAX = 4;
  var g = null, raf = 0, pend = null;

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
  function dist(t) { var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY; return Math.sqrt(dx * dx + dy * dy) || 1; }
  function mid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }; }

  function apply() {
    raf = 0;
    if (!g || !pend) return;
    var z = pend.z, old = g.z, sc = g.sc;
    if (Math.abs(z - old) < 0.005) return;
    var r = sc.getBoundingClientRect();
    var px = sc.scrollLeft + pend.x - r.left, py = sc.scrollTop + pend.y - r.top;
    g.kids.forEach(function (k) { k.style.zoom = z; });
    g.z = z;
    var ratio = z / old;
    sc.scrollLeft = px * ratio - (pend.x - r.left);
    sc.scrollTop = py * ratio - (pend.y - r.top);
    if (sc.id === 'rhwp-scroll') {
      var lb = document.getElementById('rhwp-zoom');
      if (lb) lb.textContent = Math.round(z * 100) + '%';
    }
  }

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 2) return;
    var sc = scroller(e.touches[0].target);
    if (!sc || !sc.contains(e.touches[1].target)) return;
    var kids = kidsOf(sc);
    if (!kids.length) return;
    var z0 = parseFloat(kids[0].style.zoom) || 1;
    g = { sc: sc, kids: kids, z0: z0, z: z0, d0: dist(e.touches) };
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!g || e.touches.length !== 2) return;
    e.preventDefault();
    var m = mid(e.touches);
    var z = Math.min(MAX, Math.max(MIN, g.z0 * dist(e.touches) / g.d0));
    pend = { z: z, x: m.x, y: m.y };
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: false });

  function end(e) {
    if (g && e.touches.length < 2) {
      console.info(TAG, '배율', Math.round(g.z * 100) + '%');
      g = null; pend = null;
    }
  }
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', end, { passive: true });
  /* iOS 사파리: 페이지 전체 확대 막기 (문서 영역 확대는 위 코드가 담당) */
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  console.info(TAG, '준비 완료 (끄기: localStorage.mamaPinch="off")');
})();