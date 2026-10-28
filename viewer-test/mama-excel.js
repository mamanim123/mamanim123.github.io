/* mama-excel.js : ExcelJS 기반 엑셀 원본 서식 뷰어 (보기 전용, 편집은 기존 편집기) */
const TAG = '[mama-excel]';
const prevHandle = window.handleFile;
const LIB = new URL('./vendor/exceljs/exceljs.min.js', import.meta.url).href;
const MDW = 7;            // Calibri 11pt 숫자 폭(px) - 엑셀 열너비 환산 기준
const MAX_CELLS = 300000; // 너무 큰 시트는 앞부분만

let libP = null;
function loadLib() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (!libP) libP = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = LIB;
    s.onload = () => window.ExcelJS ? res(window.ExcelJS) : rej(new Error('ExcelJS 객체 없음'));
    s.onerror = () => { libP = null; rej(new Error('exceljs.min.js 로드 실패')); };
    document.head.appendChild(s);
  });
  return libP;
}

/* ---------- 색 ---------- */
const THEME0 = ['FFFFFF','000000','E7E6E6','44546A','4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47'];
let THEME = THEME0.slice();
const IDX = ('000000,FFFFFF,FF0000,00FF00,0000FF,FFFF00,FF00FF,00FFFF,000000,FFFFFF,FF0000,00FF00,0000FF,FFFF00,FF00FF,00FFFF,' +
  '800000,008000,000080,808000,800080,008080,C0C0C0,808080,9999FF,993366,FFFFCC,CCFFFF,660066,FF8080,0066CC,CCCCFF,' +
  '000080,FF00FF,FFFF00,00FFFF,800080,800000,008080,0000FF,00CCFF,CCFFFF,CCFFCC,FFFF99,99CCFF,FF99CC,CC99FF,FFCC99,' +
  '3366FF,33CCCC,99CC00,FFCC00,FF9900,FF6600,666699,969696,003366,339966,003300,333300,993300,993366,333399,333333').split(',');
function readTheme(wb) {
  THEME = THEME0.slice();
  try {
    const x = wb._themes && (wb._themes.theme1 || Object.values(wb._themes)[0]);
    if (!x) return;
    ['lt1','dk1','lt2','dk2','accent1','accent2','accent3','accent4','accent5','accent6'].forEach((n, i) => {
      const m = new RegExp('<a:' + n + '>\\s*<a:(?:srgbClr val|sysClr[^>]*lastClr)="([0-9A-Fa-f]{6})"').exec(x);
      if (m) THEME[i] = m[1].toUpperCase();
    });
  } catch (e) {}
}
function tint(hex, t) {
  if (!t) return hex;
  const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
  }
  l = t < 0 ? l * (1 + t) : l * (1 - t) + t;
  const f = (p, q, x) => { if (x < 0) x += 1; if (x > 1) x -= 1;
    return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
  let R, G, B;
  if (!s) R = G = B = l;
  else { const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; R = f(p, q, h + 1 / 3); G = f(p, q, h); B = f(p, q, h - 1 / 3); }
  return [R, G, B].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
function color(c, def) {
  if (!c) return def;
  let h = null;
  if (c.argb) h = String(c.argb).slice(-6);
  else if (c.theme != null) h = THEME[c.theme];
  else if (c.indexed != null) h = c.indexed == 64 ? '000000' : c.indexed == 65 ? 'FFFFFF' : IDX[c.indexed];
  return h ? '#' + tint(h, c.tint) : def;
}

/* ---------- 서식 ---------- */
const BW = { thin: '1px solid', hair: '1px solid', medium: '2px solid', thick: '3px solid', dashed: '1px dashed',
  mediumDashed: '2px dashed', dotted: '1px dotted', double: '3px double', dashDot: '1px dashed', mediumDashDot: '2px dashed',
  dashDotDot: '1px dotted', mediumDashDotDot: '2px dashed', slantDashDot: '2px dashed' };
const bd = b => (b && BW[b.style]) ? BW[b.style] + ' ' + color(b.color, '#000') : '';
const HA = { left: 'left', center: 'center', right: 'right', fill: 'left', justify: 'justify', centerContinuous: 'center', distributed: 'justify' };
const VA = { top: 'top', middle: 'middle', bottom: 'bottom', justify: 'middle', distributed: 'middle' };

function fontCss(f, s, isRun) {
  if (!f) return;
  if (f.name) s.fontFamily = '"' + f.name + '","맑은 고딕","Malgun Gothic",sans-serif';
  if (f.size) s.fontSize = f.size + 'pt';
  if (f.bold) s.fontWeight = 'bold';
  if (f.italic) s.fontStyle = 'italic';
  const dec = []; if (f.underline) dec.push('underline'); if (f.strike) dec.push('line-through');
  if (dec.length) s.textDecoration = dec.join(' ');
  const c = color(f.color, null); if (c) s.color = c;
  if (isRun && f.vertAlign === 'superscript') s.verticalAlign = 'super';
  if (isRun && f.vertAlign === 'subscript') s.verticalAlign = 'sub';
}
function fillCss(fl) {
  if (!fl) return null;
  if (fl.type === 'pattern' && fl.pattern && fl.pattern !== 'none') return color(fl.fgColor, null) || color(fl.bgColor, null);
  if (fl.type === 'gradient' && fl.stops && fl.stops.length) return color(fl.stops[0].color, null);
  return null;
}
function ssf(f, v) { try { if (window.XLSX && XLSX.SSF) return XLSX.SSF.format(f, v); } catch (e) {} return String(v); }
function fmtVal(cell) {
  let v = cell.value;
  if (v == null || v === '') return { t: '' };
  if (typeof v === 'object' && !(v instanceof Date)) {
    if (v.richText) return { t: v.richText.map(r => r.text).join(''), rich: v.richText };
    if (v.hyperlink) return { t: v.text && v.text.richText ? v.text.richText.map(r => r.text).join('') : String(v.text == null ? v.hyperlink : v.text), link: v.hyperlink };
    if (v.error) return { t: v.error, err: true };
    if ('result' in v || v.formula || v.sharedFormula) {
      v = v.result;
      if (v == null) return { t: '' };
      if (typeof v === 'object' && v.error) return { t: v.error, err: true };
    }
  }
  const nf = cell.numFmt;
  if (v instanceof Date) return { t: ssf(nf || 'yyyy-mm-dd', v.getTime() / 86400000 + 25569), num: true };
  if (typeof v === 'number') return { t: ssf(nf || 'General', v), num: true };
  if (typeof v === 'boolean') return { t: v ? 'TRUE' : 'FALSE', bool: true };
  return { t: String(v) };
}

/* ---------- 주소/병합 ---------- */
function dec(a) { const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(String(a).toUpperCase()); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return { r: +m[2], c }; }
function colName(c) { let s = ''; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = (c - 1 - m) / 26; } return s; }
function getMerges(ws) {
  const out = [];
  try { Object.values(ws._merges || {}).forEach(x => { const m = x.model || x; if (m && m.top) out.push({ t: m.top, l: m.left, b: m.bottom, r: m.right }); }); } catch (e) {}
  if (!out.length) try { ((ws.model && ws.model.merges) || []).forEach(s => { const [a, z] = s.split(':'); const p = dec(a), q = dec(z || a); out.push({ t: p.r, l: p.c, b: q.r, r: q.c }); }); } catch (e) {}
  return out;
}

/* ---------- 시트 렌더링 ---------- */
function renderSheet(ws) {
  const v0 = (ws.views && ws.views[0]) || {};
  const GL = v0.showGridLines === false ? '1px solid transparent' : '1px solid #d9d9d9';
  const nR = Math.max(ws.rowCount || 0, 1), nC = Math.max(ws.columnCount || 0, 1);
  const maxR = Math.min(nR, Math.max(50, Math.floor(MAX_CELLS / nC)));
  const merges = getMerges(ws), master = new Map(), covered = new Set();
  merges.forEach(m => { master.set(m.t + ',' + m.l, m);
    for (let r = m.t; r <= m.b; r++) for (let c = m.l; c <= m.r; c++) if (r !== m.t || c !== m.l) covered.add(r + ',' + c); });
  const cellAt = (r, c) => { const row = ws.findRow(r); return row ? row.findCell(c) : undefined; };
  const bAt = (r, c, side) => { const x = cellAt(r, c); const b = x && x.border && x.border[side]; return b && b.style ? b : null; };
  const isEmpty = (r, c) => { if (c > nC) return true; const x = cellAt(r, c); return !x || x.value == null || x.value === ''; };
  const dW = ws.properties && ws.properties.defaultColWidth;
  const cols = [];
  for (let c = 1; c <= nC; c++) {
    const col = ws.getColumn(c); if (col.hidden) continue;
    const w = col.width || dW;
    cols.push([c, w ? Math.max(1, Math.trunc(((256 * w + Math.trunc(128 / MDW)) / 256) * MDW)) : 64]);
  }
  const visC = new Set(cols.map(x => x[0])), firstC = cols.length ? cols[0][0] : 1;
  const defH = (ws.properties && ws.properties.defaultRowHeight) || 15;

  const table = document.createElement('table');
  const cg = document.createElement('colgroup');
  const addCol = w => { const e = document.createElement('col'); e.style.width = w + 'px'; cg.appendChild(e); };
  addCol(40); cols.forEach(x => addCol(x[1]));
  table.appendChild(cg);
  table.style.width = (40 + cols.reduce((a, x) => a + x[1], 0)) + 'px';
  const hr = table.createTHead().insertRow();
  hr.appendChild(document.createElement('th'));
  cols.forEach(([c]) => { const th = document.createElement('th'); th.textContent = colName(c); hr.appendChild(th); });
  const tb = table.createTBody();

  for (let r = 1; r <= maxR; r++) {
    const row = ws.findRow(r);
    if (row && row.hidden) continue;
    const tr = tb.insertRow();
    tr.dataset.r = r;
    const rh = document.createElement('th'); rh.textContent = r; tr.appendChild(rh);
    let wrapRow = false;
    for (const [c] of cols) {
      const key = r + ',' + c;
      if (covered.has(key)) continue;
      const td = document.createElement('td'); td.dataset.c = c;
      const s = td.style, cell = row ? row.findCell(c) : undefined, m = master.get(key);
      let rEnd = r, cEnd = c;
      if (m) {
        let rs = 0; for (let i = m.t; i <= m.b; i++) { const x = ws.findRow(i); if (!(x && x.hidden)) rs++; }
        let cs = 0; for (let j = m.l; j <= m.r; j++) if (visC.has(j)) cs++;
        if (rs > 1) td.rowSpan = rs; if (cs > 1) td.colSpan = cs;
        rEnd = m.b; cEnd = m.r;
      }
      s.borderRight = bd(bAt(r, cEnd, 'right') || bAt(r, cEnd + 1, 'left')) || GL;
      s.borderBottom = bd(bAt(rEnd, c, 'bottom') || bAt(rEnd + 1, c, 'top')) || GL;
      if (c === firstC) { const b = bAt(r, c, 'left'); if (b) s.borderLeft = bd(b); }
      if (r === 1) { const b = bAt(r, c, 'top'); if (b) s.borderTop = bd(b); }
      if (cell) {
        const bg = fillCss(cell.fill); if (bg) s.background = bg;
        fontCss(cell.font, s, false);
      }
      const v = cell ? fmtVal(cell) : { t: '' };
      const al = (cell && cell.alignment) || {};
      s.textAlign = HA[al.horizontal] || (v.num ? 'right' : (v.bool || v.err) ? 'center' : 'left');
      s.verticalAlign = VA[al.vertical] || 'bottom';
      if (al.indent) s[s.textAlign === 'right' ? 'paddingRight' : 'paddingLeft'] = (2 + al.indent * 9) + 'px';
      if (al.wrapText) { td.classList.add('wr'); wrapRow = true; }
      if (v.rich) v.rich.forEach(run => { const sp = document.createElement('span'); sp.textContent = run.text; fontCss(run.font, sp.style, true); td.appendChild(sp); });
      else if (v.link) { const a = document.createElement('a'); a.href = v.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = v.t; a.style.color = 'inherit'; td.appendChild(a); }
      else td.textContent = v.t;
      if (v.t && !al.wrapText && !v.num && s.textAlign === 'left' && !m && isEmpty(r, c + 1) &&
          !master.has(r + ',' + (c + 1)) && !covered.has(r + ',' + (c + 1))) td.classList.add('sp');
      tr.appendChild(td);
    }
    if (!wrapRow || (row && row.height)) tr.style.height = Math.round(((row && row.height) || defH) * 4 / 3) + 'px';
  }
  return { table, info: nR + '행 × ' + nC + '열' + (maxR < nR ? ' (앞 ' + maxR + '행만 표시)' : '') };
}
function applyFreeze(ws, table) {
  const v = (ws.views && ws.views[0]) || {};
  if (v.state !== 'frozen') return;
  const ys = v.ySplit || 0, xs = v.xSplit || 0;
  [...table.tBodies[0].rows].forEach(tr => {
    const fr = ys && +tr.dataset.r <= ys, top = tr.offsetTop;
    [...tr.cells].forEach((el, i) => {
      const fc = i > 0 && xs && +el.dataset.c <= xs;
      if (i === 0) { if (fr) { el.style.top = top + 'px'; el.style.zIndex = 5; } return; }
      if (!fr && !fc) return;
      el.style.position = 'sticky';
      if (fr) el.style.top = top + 'px';
      if (fc) el.style.left = el.offsetLeft + 'px';
      el.style.zIndex = fr && fc ? 3 : 2;
      if (!el.style.background) el.style.background = '#fff';
    });
  });
}

/* ---------- 뷰 ---------- */
const css = document.createElement('style');
css.textContent =
  '#xl-sheet table{border-collapse:separate;border-spacing:0;table-layout:fixed;font-family:Calibri,"맑은 고딕","Malgun Gothic",sans-serif;font-size:11pt;color:#000;background:#fff}' +
  '#xl-sheet td{padding:0 2px;overflow:hidden;white-space:nowrap;line-height:1.2;box-sizing:border-box}' +
  '#xl-sheet td.wr{white-space:pre-wrap;word-break:break-all}' +
  '#xl-sheet td.sp{overflow:visible;position:relative;z-index:1}' +
  '#xl-sheet th{background:#f3f4f6;color:#555;font:11px/1.4 "Malgun Gothic",sans-serif;border-right:1px solid #ccc;border-bottom:1px solid #ccc;position:sticky;padding:0 2px;text-align:center;overflow:hidden;white-space:nowrap}' +
  '#xl-sheet thead th{top:0;z-index:6;height:20px}#xl-sheet tbody th{left:0;z-index:4}#xl-sheet thead th:first-child{left:0;z-index:7}' +
  '#xl-tabs button{padding:2px 10px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;white-space:nowrap}#xl-tabs button.on{background:#059669;color:#fff;border-color:#059669}';
document.head.appendChild(css);

const view = document.createElement('div');
view.id = 'xl-view';
view.className = 'hidden flex-1 flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden';
view.innerHTML =
  '<div class="bg-slate-50 border-b border-slate-200 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-2 text-xs text-slate-600 no-print">' +
  '<div class="flex items-center gap-2 min-w-0"><span class="font-semibold text-slate-700 truncate">원본 서식 (ExcelJS)</span>' +
  '<span id="xl-info" class="font-mono text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded"></span></div>' +
  '<div class="flex items-center gap-1 flex-shrink-0">' +
  '<button id="xl-edit" class="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">편집</button>' +
  '<button id="xl-zout" class="px-2 py-1 rounded hover:bg-slate-200">－</button><span id="xl-zoom" class="font-mono w-10 text-center">100%</span>' +
  '<button id="xl-zin" class="px-2 py-1 rounded hover:bg-slate-200">＋</button></div></div>' +
  '<div id="xl-tabs" class="flex gap-1 px-2 py-1 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs"></div>' +
  '<div id="xl-scroll" class="flex-1 overflow-auto bg-white"><div id="xl-sheet" style="width:max-content"></div></div>';
document.querySelector('main').appendChild(view);
const $ = id => view.querySelector('#' + id);
const sheetEl = $('xl-sheet');
let curFile = null, zoom = 1;

const setStatus = t => { try { statusText.textContent = t; } catch (e) {} };
function hideView() { view.classList.add('hidden'); view.classList.remove('flex'); }
function hideRhwp() { const r = document.getElementById('rhwp-view'); if (r) { r.classList.add('hidden'); r.classList.remove('flex'); } }
function showView(name) {
  try { setupHeader('pdf', name); } catch (e) {}
  try { pdfView.classList.add('hidden'); } catch (e) {}
  try { btnDownload.classList.add('hidden'); } catch (e) {}
  try { fileBadge.textContent = 'EXCEL';
    fileBadge.className = 'px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800'; } catch (e) {}
  view.classList.remove('hidden'); view.classList.add('flex');
}
function setZoom(z) {
  zoom = Math.min(3, Math.max(0.3, Math.round(z * 10) / 10));
  sheetEl.style.zoom = zoom;
  $('xl-zoom').textContent = Math.round(zoom * 100) + '%';
}
function showSheet(ws) {
  const t0 = performance.now();
  sheetEl.innerHTML = '';
  const { table, info } = renderSheet(ws);
  sheetEl.appendChild(table);
  try { applyFreeze(ws, table); } catch (e) { console.warn(TAG, '틀 고정 실패', e); }
  const zs = ws.views && ws.views[0] && ws.views[0].zoomScale;
  setZoom(zs ? zs / 100 : 1);
  $('xl-scroll').scrollTo(0, 0);
  $('xl-info').textContent = ws.name + ' · ' + info;
  setStatus(curFile.name + ' · 엑셀 원본 서식 · ' + ws.name);
  console.info(TAG, curFile.name, ws.name, info, Math.round(performance.now() - t0) + 'ms 렌더링 완료');
}
function buildTabs(sheets, act) {
  const box = $('xl-tabs'); box.innerHTML = '';
  sheets.forEach((ws, i) => {
    const b = document.createElement('button'); b.textContent = ws.name;
    const tc = ws.properties && color(ws.properties.tabColor, null);
    if (tc) b.style.borderBottom = '3px solid ' + tc;
    if (i === act) b.className = 'on';
    b.onclick = () => { box.querySelectorAll('button').forEach(x => x.className = ''); b.className = 'on'; showSheet(ws); };
    box.appendChild(b);
  });
  box.style.display = sheets.length > 1 ? '' : 'none';
}
async function openExcel(file) {
  const X = await loadLib();
  const wb = new X.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  readTheme(wb);
  curFile = file;
  const sheets = wb.worksheets.filter(w => w && w.state !== 'hidden' && w.state !== 'veryHidden');
  if (!sheets.length) throw new Error('보이는 시트 없음');
  let act = 0;
  try { const w = wb.worksheets[(wb.views && wb.views[0] && wb.views[0].activeTab) || 0]; if (sheets.includes(w)) act = sheets.indexOf(w); } catch (e) {}
  showView(file.name);
  buildTabs(sheets, act);
  showSheet(sheets[act]);
}

/* ---------- 파일 라우터 ---------- */
window.handleFile = function (file) {
  hideView();
  const ext = ((file && file.name) || '').split('.').pop().toLowerCase();
  if (localStorage.getItem('mamaExcel') !== 'off' && (ext === 'xlsx' || ext === 'xlsm')) {
    hideRhwp();
    try { currentSourceFile = file; } catch (e) {}
    setStatus(file.name + ' 원본 서식으로 여는 중...');
    openExcel(file).catch(err => {
      console.error(TAG, err);
      hideView();
      prevHandle(file);
      setStatus('엑셀 원본 서식 보기 실패 → 기존 뷰어로 표시: ' + err.message);
    });
    return;
  }
  return prevHandle(file);
};

$('xl-edit').onclick = () => { if (curFile) { hideView(); prevHandle(curFile); } };
$('xl-zin').onclick = () => setZoom(zoom + 0.1);
$('xl-zout').onclick = () => setZoom(zoom - 0.1);
try { btnClose.addEventListener('click', hideView); } catch (e) {}
console.info(TAG, '로드됨 (끄기: localStorage.mamaExcel="off")');
