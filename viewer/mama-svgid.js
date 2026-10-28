/* mama-svgid: rhwp 쪽 SVG 내부 id를 쪽마다 고유하게 (clipPath 충돌 방지) */
window.mamaUniqIds = function (svg, p) {
  return String(svg)
    .replace(/(\s)id=(["'])([^"']+)\2/g, function (m, s, q, id) { return s + 'id=' + q + p + id + q; })
    .replace(/url\(\s*(["']?)#([^"')\s]+)\1\s*\)/g, function (m, q, id) { return 'url(#' + p + id + ')'; })
    .replace(/(href=)(["'])#([^"']+)\2/g, function (m, a, q, id) { return a + q + '#' + p + id + q; });
};
console.info('[mama-svgid] 준비 완료');
