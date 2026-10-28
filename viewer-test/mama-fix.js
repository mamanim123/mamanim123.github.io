/* mama-fix.js : 레이아웃 보정 패치 v1 (index.html 메인 스크립트 뒤에서 로드) */
(function () {
  'use strict';
  var TAG = '[mama-fix]';

  // ---------- 공통 유틸 ----------
  var U = function (v) { return (parseFloat(v || '0') || 0) / 75; };            // HWPUNIT -> px
  var ln = function (n) { return n ? (n.localName || String(n.nodeName).split(':').pop()) : ''; };
  var kids = function (n, name) { return n ? Array.from(n.children).filter(function (c) { return ln(c) === name; }) : []; };
  var kid = function (n, name) { return kids(n, name)[0] || null; };
  function find(n, name) {
    if (!n) return null;
    var all = n.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) if (ln(all[i]) === name) return all[i];
    return null;
  }
  var ALIGN = { LEFT: 'left', RIGHT: 'right', CENTER: 'center', JUSTIFY: 'justify', DISTRIBUTE: 'justify', DISTRIBUTE_SPACE: 'justify' };

  // ---------- CSS ----------
  var css = document.createElement('style');
  css.textContent =
    '#doc-scroll-area{justify-content:safe center;}' +
    '#doc-page.hwpx-page #doc-content p,#doc-page.hwpx-page #doc-content td{white-space:pre-wrap;}' +
    '#doc-content .whitespace-pre-line{white-space:pre-wrap;}';
  document.head.appendChild(css);

  // ---------- 확대/축소: transform:scale -> zoom (잘림/스크롤 문제 해결) ----------
  if (typeof docPage !== 'undefined' && docPage) {
    new MutationObserver(function () {
      var m = /scale\(([\d.]+)\)/.exec(docPage.style.transform || '');
      if (m) { docPage.style.transform = ''; docPage.style.zoom = m[1]; }
    }).observe(docPage, { attributes: true, attributeFilter: ['style'] });
  }

  // ---------- HWPX: 문단 모양 확장 파싱 ----------
  var paraEx = {};
  if (typeof parseHwpxHeaderStyles === 'function') {
    var origHeader = parseHwpxHeaderStyles;
    parseHwpxHeaderStyles = function (xmlText) {
      var r = origHeader.apply(this, arguments);
      try {
        Object.keys(paraEx).forEach(function (k) { delete paraEx[k]; });
        var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        var all = doc.getElementsByTagName('*');
        for (var i = 0; i < all.length; i++) {
          var pp = all[i];
          if (ln(pp) !== 'paraPr') continue;
          var id = pp.getAttribute('id'); if (id == null) continue;
          var al = find(pp, 'align'), mg = find(pp, 'margin'), ls = find(pp, 'lineSpacing'), bs = find(pp, 'breakSetting');
          var m = {};
          if (mg) Array.from(mg.children).forEach(function (c) { m[ln(c)] = c.getAttribute('value'); });
          paraEx[id] = {
            align: ((al && al.getAttribute('horizontal')) || 'JUSTIFY').toUpperCase(),
            intent: U(m.intent), left: U(m.left), right: U(m.right), prev: U(m.prev), next: U(m.next),
            lsType: ls ? (ls.getAttribute('type') || 'PERCENT').toUpperCase() : 'PERCENT',
            lsValue: ls ? parseFloat(ls.getAttribute('value') || '160') : 160,
            keepWord: !bs || (bs.getAttribute('breakNonLatinWord') || 'KEEP_WORD') === 'KEEP_WORD'
          };
        }
        console.info(TAG, 'paraPr', Object.keys(paraEx).length + '개 파싱');
      } catch (e) { console.warn(TAG, 'paraPr 파싱 실패', e); }
      return r;
    };
  }

  function lineHeightCss(px) {
    if (!px) return '';
    switch (px.lsType) {
      case 'PERCENT': return String(px.lsValue / 100);
      case 'FIXED': return U(px.lsValue) + 'px';
      case 'BETWEEN_LINES': return 'calc(1em + ' + U(px.lsValue) + 'px)';
      case 'AT_LEAST': return 'max(1em, ' + U(px.lsValue) + 'px)';
      default: return '';
    }
  }

  function applyPara(el, pNode) {
    var px = paraEx[pNode.getAttribute('paraPrIDRef')];
    if (!px) return;
    var s = el.style;
    s.textAlign = ALIGN[px.align] || 'justify';
    s.textAlignLast = px.align.indexOf('DISTRIBUTE') === 0 ? 'justify' : '';
    s.marginTop = px.prev + 'px';
    s.marginBottom = px.next + 'px';
    s.marginLeft = px.left + 'px';
    s.marginRight = px.right + 'px';
    if (px.intent < 0) { s.paddingLeft = (-px.intent) + 'px'; s.textIndent = px.intent + 'px'; }
    else { s.textIndent = px.intent + 'px'; }
    s.lineHeight = lineHeightCss(px);
    s.wordBreak = px.keepWord ? 'keep-all' : 'normal';
    s.overflowWrap = 'anywhere';
    var run = find(pNode, 'run');
    var cp = run && hwpxStyles.charPrMap[run.getAttribute('charPrIDRef')];
    if (cp && cp.fontSizePt) s.fontSize = cp.fontSizePt + 'pt';
    if (el.textContent === '' && !el.firstElementChild) el.innerHTML = '<br>';   // 빈 줄 높이 유지
  }

  // ---------- HWPX: 페이지 여백 (머리말/꼬리말 여백 포함) ----------
  if (typeof renderHwpxDocument === 'function') {
    var origDoc = renderHwpxDocument;
    renderHwpxDocument = function () {
      var r = origDoc.apply(this, arguments);
      try {
        var pp = hwpxSections[0] && find(hwpxSections[0].doc, 'pagePr');
        var mg = pp && kid(pp, 'margin');
        if (pp && mg) {
          var w = U(pp.getAttribute('width')), h = U(pp.getAttribute('height'));
          if ((pp.getAttribute('landscape') || '').toUpperCase() === 'NARROWLY' && w < h) { var t = w; w = h; h = t; }
          var g = function (k) { return U(mg.getAttribute(k)); };
          docPage.style.width = w + 'px';
          docPage.style.minHeight = h + 'px';
          docPage.style.padding = (g('top') + g('header')) + 'px ' + g('right') + 'px ' +
                                  (g('bottom') + g('footer')) + 'px ' + (g('left') + g('gutter')) + 'px';
        }
      } catch (e) { console.warn(TAG, '페이지 여백 보정 실패', e); }
      return r;
    };
  }

  // ---------- HWPX: 문단 ----------
  if (typeof renderHwpxParagraphNode === 'function') {
    var origPara = renderHwpxParagraphNode;
    renderHwpxParagraphNode = function (pNode, container) {
      var before = container.lastElementChild;
      var r = origPara.apply(this, arguments);
      var el = container.lastElementChild;
      if (el && el !== before && el.tagName === 'P') { try { applyPara(el, pNode); } catch (e) { console.warn(TAG, e); } }
      return r;
    };
  }

  // ---------- HWPX: 표 ----------
  function fixTable(el, tbl) {
    var table = el.tagName === 'TABLE' ? el : el.querySelector('table');
    if (!table) return;
    var sz = kid(tbl, 'sz'), out = kid(tbl, 'outMargin'), inM = kid(tbl, 'inMargin'), pos = kid(tbl, 'pos');
    var W = sz ? U(sz.getAttribute('width')) : 0;

    // 바깥 여백 / 너비
    if (el !== table) { el.classList.remove('my-2', 'my-3', 'my-4', 'my-6'); el.style.margin = '0'; }
    table.classList.remove('w-full');
    if (out) table.style.margin = U(out.getAttribute('top')) + 'px ' + U(out.getAttribute('right')) + 'px ' +
                                  U(out.getAttribute('bottom')) + 'px ' + U(out.getAttribute('left')) + 'px';
    if (W) { table.style.width = W + 'px'; table.style.maxWidth = 'none'; table.style.tableLayout = 'fixed'; }

    // 가로 정렬 (글자처럼 취급이면 소속 문단 정렬을 따름)
    var align = 'LEFT';
    if (pos && pos.getAttribute('treatAsChar') === '1') {
      var p = tbl.parentNode; while (p && ln(p) !== 'p') p = p.parentNode;
      var ppx = p && paraEx[p.getAttribute('paraPrIDRef')];
      if (ppx) align = ppx.align;
    } else if (pos) align = (pos.getAttribute('horzAlign') || 'LEFT').toUpperCase();
    if (align === 'CENTER') { table.style.marginLeft = 'auto'; table.style.marginRight = 'auto'; }
    else if (align === 'RIGHT') { table.style.marginLeft = 'auto'; }

    // 열 너비 (절대 px)
    var tcs = [];
    kids(tbl, 'tr').forEach(function (tr) { kids(tr, 'tc').forEach(function (tc) { tcs.push(tc); }); });
    var colCnt = parseInt(tbl.getAttribute('colCnt') || '0', 10);
    var colW = new Array(colCnt).fill(null);
    tcs.forEach(function (tc) {
      var a = kid(tc, 'cellAddr'), sp = kid(tc, 'cellSpan'), cs = kid(tc, 'cellSz');
      if (a && sp && cs && sp.getAttribute('colSpan') === '1') colW[+a.getAttribute('colAddr')] = U(cs.getAttribute('width'));
    });
    for (var it = 0; it < 6 && colW.some(function (w) { return w == null; }); it++) {
      tcs.forEach(function (tc) {
        var a = kid(tc, 'cellAddr'), sp = kid(tc, 'cellSpan'), cs = kid(tc, 'cellSz');
        if (!a || !sp || !cs) return;
        var c0 = +a.getAttribute('colAddr'), n = +sp.getAttribute('colSpan');
        if (n < 2) return;
        var idx = [], known = 0;
        for (var c = c0; c < c0 + n && c < colCnt; c++) { if (colW[c] == null) idx.push(c); else known += colW[c]; }
        if (idx.length === 1) colW[idx[0]] = Math.max(1, U(cs.getAttribute('width')) - known);
      });
    }
    var unknown = colW.filter(function (w) { return w == null; }).length;
    if (unknown && W) {
      var rest = W - colW.reduce(function (s, w) { return s + (w || 0); }, 0);
      colW = colW.map(function (w) { return w == null ? Math.max(1, rest / unknown) : w; });
    }
    if (colCnt && !colW.some(function (w) { return w == null; })) {
      Array.from(table.children).forEach(function (c) { if (c.tagName === 'COLGROUP') c.remove(); });
      var cg = document.createElement('colgroup');
      colW.forEach(function (w) { var col = document.createElement('col'); col.style.width = w + 'px'; cg.appendChild(col); });
      table.insertBefore(cg, table.firstChild);
    }

    // 셀: 안쪽 여백 / 세로정렬 / 높이 / 가로정렬
    var tds = [];
    Array.from(table.rows).forEach(function (row) {
      Array.from(row.cells).forEach(function (td) { if (td.style.display !== 'none') tds.push(td); });
    });
    if (tds.length !== tcs.length) { console.info(TAG, '셀 개수 불일치 -> 셀 보정 생략', tds.length, tcs.length); return; }
    var tblPad = inM ? ['top', 'right', 'bottom', 'left'].map(function (k) { return U(inM.getAttribute(k)); }) : null;
    tcs.forEach(function (tc, i) {
      var td = tds[i];
      var cm = tc.getAttribute('hasMargin') === '1' ? kid(tc, 'cellMargin') : null;
      var pad = cm ? ['top', 'right', 'bottom', 'left'].map(function (k) { return U(cm.getAttribute(k)); }) : tblPad;
      if (pad) td.style.padding = pad.map(function (v) { return v + 'px'; }).join(' ');
      var sub = kid(tc, 'subList');
      var va = ((sub && sub.getAttribute('vertAlign')) || 'CENTER').toUpperCase();
      td.style.verticalAlign = va === 'TOP' ? 'top' : (va === 'BOTTOM' ? 'bottom' : 'middle');
      var sp = kid(tc, 'cellSpan'), cs = kid(tc, 'cellSz');
      if (cs && sp && sp.getAttribute('rowSpan') === '1') td.style.height = U(cs.getAttribute('height')) + 'px';
      var fp = sub && kid(sub, 'p');
      var px = fp && paraEx[fp.getAttribute('paraPrIDRef')];
      if (px) {
        td.style.textAlign = ALIGN[px.align] || 'left';
        td.style.lineHeight = lineHeightCss(px);
        td.style.wordBreak = px.keepWord ? 'keep-all' : 'normal';
      }
    });
  }

  if (typeof renderHwpxTable === 'function') {
    var origTbl = renderHwpxTable;
    renderHwpxTable = function (tblNode, container) {
      var before = container.lastElementChild;
      var r = origTbl.apply(this, arguments);
      var el = container.lastElementChild;
      if (el && el !== before) { try { fixTable(el, tblNode); } catch (e) { console.warn(TAG, '표 보정 실패', e); } }
      return r;
    };
  }

  // ---------- HWP 5.0: 문단 텍스트 디코더 교체 (16바이트 컨트롤 처리) ----------
  if (typeof decodeHwpParaText === 'function') {
    var WIDE = { 1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,11:1,12:1,14:1,15:1,16:1,17:1,18:1,19:1,20:1,21:1,22:1,23:1 };
    decodeHwpParaText = function (u8) {
      if (!u8 || u8.length < 2) return '';
      var view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      var out = [], i = 0;
      while (i + 1 < u8.byteLength) {
        var code = view.getUint16(i, true);
        if (code < 32) {
          if (WIDE[code]) { if (code === 9) out.push('\t'); i += 16; continue; }
          if (code === 10 || code === 13) out.push('\n');
          else if (code === 24) out.push('-');
          else if (code === 30) out.push('\u00A0');
          else if (code === 31) out.push(' ');
          i += 2; continue;
        }
        out.push(String.fromCharCode(code));
        i += 2;
      }
      return out.join('').replace(/\n+$/, '');
    };
  }

  // ---------- EXCEL ----------
  if (window.XLSX && typeof XLSX.read === 'function' && !XLSX.__mamaPatched) {
    try {
      var read0 = XLSX.read;
      XLSX.read = function (d, o) { return read0.call(this, d, Object.assign({ cellStyles: true, cellNF: true }, o || {})); };
      XLSX.__mamaPatched = true;
    } catch (e) { console.warn(TAG, 'XLSX.read 패치 실패', e); }
  }

  var sheetShape = { rows: 0, cols: 0 };
  function curShape() {
    var c = 0; (currentSheetData || []).forEach(function (r) { if (r.length > c) c = r.length; });
    return { rows: (currentSheetData || []).length, cols: c };
  }
  function sameShape() { var s = curShape(); return s.rows === sheetShape.rows && s.cols === sheetShape.cols; }

  function sheetToGrid(ws) {
    if (!ws) return [['']];
    var maxR = -1, maxC = -1;
    Object.keys(ws).forEach(function (k) {
      if (k[0] === '!') return;
      var a = XLSX.utils.decode_cell(k);
      if (a.r > maxR) maxR = a.r; if (a.c > maxC) maxC = a.c;
    });
    (ws['!merges'] || []).forEach(function (m) { if (m.e.r > maxR) maxR = m.e.r; if (m.e.c > maxC) maxC = m.e.c; });
    if (maxR < 0) return [['']];
    maxR = Math.min(maxR, 9999); maxC = Math.min(maxC, 255);
    var rows = [];
    for (var r = 0; r <= maxR; r++) {               // 항상 A1 부터 (시작 위치 밀림 방지)
      var row = [];
      for (var c = 0; c <= maxC; c++) {
        var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })], v = '';
        if (cell) {
          var isDate = cell.t === 'd' || (cell.t === 'n' && cell.z && XLSX.SSF && XLSX.SSF.is_date && XLSX.SSF.is_date(cell.z));
          v = isDate ? (cell.w || String(cell.v)) : (cell.v != null ? cell.v : '');
        }
        row.push(v);
      }
      rows.push(row);
    }
    return rows;
  }

  if (typeof switchExcelSheet === 'function') {
    switchExcelSheet = function (sheetName) {
      currentSheetName = sheetName;
      Array.from(excelTabs.children).forEach(function (tab) {
        tab.className = tab.textContent === sheetName
          ? 'px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white shadow-xs whitespace-nowrap'
          : 'px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap';
      });
      currentSheetData = sheetToGrid(workbook.Sheets[sheetName]);
      sheetShape = curShape();
      selectedExcelRow = 0; selectedExcelCol = 0;
      renderExcelTable();
      updateExcelFormulaBar();
    };
  }

  function applySheetLayout() {
    var ws = workbook && workbook.Sheets[currentSheetName];
    if (!ws) return;
    var ths = excelTable.querySelectorAll('thead th');
    (ws['!cols'] || []).forEach(function (col, c) {
      if (!col || !ths[c + 1]) return;
      var px = col.wpx || (col.wch ? Math.round(col.wch * 7 + 5) : (col.width ? Math.round(col.width * 7 + 5) : 0));
      if (px) { ths[c + 1].style.width = px + 'px'; ths[c + 1].style.minWidth = px + 'px'; }
    });
    var trs = excelTable.querySelectorAll('tbody tr');
    (ws['!rows'] || []).forEach(function (row, r) {
      if (row && trs[r] && (row.hpx || row.hpt)) trs[r].style.height = (row.hpx || row.hpt * 4 / 3) + 'px';
    });
    if (!sameShape()) return;                        // 행/열을 추가·삭제했으면 병합 적용 생략
    (ws['!merges'] || []).forEach(function (m) {
      var top = trs[m.s.r] && trs[m.s.r].children[m.s.c + 1];
      if (!top) return;
      top.rowSpan = m.e.r - m.s.r + 1; top.colSpan = m.e.c - m.s.c + 1;
      top.style.textAlign = 'center'; top.style.verticalAlign = 'middle';
      for (var r = m.s.r; r <= m.e.r; r++) for (var c = m.s.c; c <= m.e.c; c++) {
        if (r === m.s.r && c === m.s.c) continue;
        var td = trs[r] && trs[r].children[c + 1];
        if (td) td.style.display = 'none';
      }
    });
  }

  if (typeof renderExcelTable === 'function') {
    var origRender = renderExcelTable;
    renderExcelTable = function () {
      var r = origRender.apply(this, arguments);
      try { applySheetLayout(); } catch (e) { console.warn(TAG, '시트 레이아웃 실패', e); }
      return r;
    };
  }

  if (typeof saveExcelFile === 'function') {
    saveExcelFile = function () {
      try {
        var old = workbook.Sheets[currentSheetName];
        var ws = XLSX.utils.aoa_to_sheet(currentSheetData);
        if (old && sameShape()) ['!merges', '!cols', '!rows'].forEach(function (k) { if (old[k]) ws[k] = old[k]; });
        workbook.Sheets[currentSheetName] = ws;
        var saveName = currentFileName.replace(/\.[^/.]+$/, '') + '_수정.xlsx';
        XLSX.writeFile(workbook, saveName, { cellStyles: true });
        statusText.textContent = saveName + ' 저장 완료!';
      } catch (err) { alert('엑셀 저장 중 오류가 발생했습니다: ' + err.message); }
    };
  }

  console.info(TAG, '적용 완료');
})();