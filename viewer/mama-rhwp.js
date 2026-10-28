/* mama-rhwp.js : rhwp(WASM) 기반 HWP/HWPX 원본 레이아웃 뷰어 */
import init, { HwpDocument } from './vendor/rhwp/rhwp.js';

const TAG = '[mama-rhwp]';

// 글자 폭 측정 콜백 (rhwp 필수) - 이 PC에 설치된 한컴 글꼴로 측정됨
let ctx = null, lastFont = '';
globalThis.measureTextWidth = (font, text) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (font !== lastFont) { ctx.font = font; lastFont = font; }
  return ctx.measureText(text).width;
};

const ready = init({ module_or_path: new URL('./vendor/rhwp/rhwp_bg.wasm', import.meta.url).href })
  .then(() => { console.info(TAG, '엔진 준비 완료'); return true; })
  .catch(e => { console.error(TAG, '엔진 로드 실패', e); return false; });

const legacyHandle = window.handleFile;
let curDoc = null, curFile = null, zoom = 1;

// ---------- 뷰 생성 ----------
const view = document.createElement('div');
view.id = 'rhwp-view';
view.className = 'hidden flex-1 flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden';
view.innerHTML = `
  <div class="bg-slate-50 border-b border-slate-200 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-2 text-xs text-slate-600 no-print">
    <div class="flex items-center gap-2 min-w-0">
      <span class="font-semibold text-slate-700 truncate">원본 레이아웃 (rhwp)</span>
      <span id="rhwp-info" class="font-mono text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded">0쪽</span>
    </div>
    <div class="flex items-center gap-1 flex-shrink-0">
      <button id="rhwp-edit"  class="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">웹 편집</button>
      <button id="rhwp-hwp"   class="px-2 py-1 rounded bg-blue-600 text-white">한글에서 편집</button>
      <button id="rhwp-zout"  class="px-2 py-1 rounded hover:bg-slate-200">－</button>
      <span   id="rhwp-zoom"  class="font-mono w-10 text-center">100%</span>
      <button id="rhwp-zin"   class="px-2 py-1 rounded hover:bg-slate-200">＋</button>
      <button id="rhwp-print" class="px-2 py-1 rounded hover:bg-slate-200">인쇄</button>
    </div>
  </div>
  <div id="rhwp-scroll" class="flex-1 overflow-auto bg-slate-200/70 p-2 sm:p-6">
    <div id="rhwp-pages" style="width:max-content;margin:0 auto"></div>
  </div>`;
document.querySelector('main').appendChild(view);
const $ = id => view.querySelector('#' + id);
const pagesEl = $('rhwp-pages');

function hideView() { view.classList.add('hidden'); view.classList.remove('flex'); }
function showView(name) {
  setupHeader('pdf', name);                  // 헤더 표시 + 다른 뷰 숨김
  pdfView.classList.add('hidden');
  btnDownload.classList.add('hidden');
  fileBadge.textContent = name.toLowerCase().endsWith('.hwp') ? 'HWP' : 'HWPX';
  fileBadge.className = 'px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full uppercase tracking-wider bg-blue-100 text-blue-800';
  view.classList.remove('hidden'); view.classList.add('flex');
}
function setZoom(z) {
  zoom = Math.min(3, Math.max(0.3, Math.round(z * 10) / 10));
  pagesEl.style.zoom = zoom;
  $('rhwp-zoom').textContent = Math.round(zoom * 100) + '%';
}

async function renderRhwp(file) {
  if (!(await ready)) throw new Error('rhwp 엔진 로드 실패');
  const u8 = new Uint8Array(await file.arrayBuffer());
  if (curDoc && typeof curDoc.free === 'function') { try { curDoc.free(); } catch (e) {} }
  curDoc = new HwpDocument(u8);
  curFile = file;
  const n = curDoc.pageCount();
  showView(file.name);
  pagesEl.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);margin:0 auto 16px;width:max-content;line-height:0';
    wrap.innerHTML = (window.mamaUniqIds || (s => s))(curDoc.renderPageSvg(i), "p" + i + "_");
    pagesEl.appendChild(wrap);
    statusText.textContent = `rhwp 렌더링 중 ${i + 1}/${n}쪽`;
    await new Promise(r => setTimeout(r, 0));
  }
  $('rhwp-info').textContent = n + '쪽';
  statusText.textContent = `${file.name} · rhwp 원본 레이아웃 · ${n}쪽`;
  console.info(TAG, file.name, n + '쪽 렌더링 완료');
}

// ---------- 파일 라우터 교체 ----------
window.handleFile = function (file) {
  hideView();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const enabled = localStorage.getItem('mamaRhwp') !== 'off';
  if (enabled && (ext === 'hwp' || ext === 'hwpx')) {
    currentSourceFile = file;
    statusText.textContent = `${file.name} rhwp 엔진으로 여는 중...`;
    renderRhwp(file).catch(err => {
      console.error(TAG, err);
      hideView();
      legacyHandle(file);
      statusText.textContent = 'rhwp 실패 → 기존 뷰어로 표시: ' + err.message;
    });
    return;
  }
  return legacyHandle(file);
};

// ---------- 버튼 ----------
$('rhwp-edit').onclick = () => { if (curFile) { hideView(); legacyHandle(curFile); } };
$('rhwp-hwp').onclick = async () => {
  if (!curFile) return;
  try {
    const r = await fetch('./open?name=' + encodeURIComponent(curFile.name), {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: await curFile.arrayBuffer()
    });
    const j = await r.json();
    statusText.textContent = j.ok ? '한글에서 열었습니다.' : ('한글 열기 실패: ' + j.message);
  } catch (e) { alert('한글 열기 오류: ' + e.message); }
};
$('rhwp-zin').onclick  = () => setZoom((parseFloat(pagesEl.style.zoom) || 1) + 0.1);
$('rhwp-zout').onclick = () => setZoom((parseFloat(pagesEl.style.zoom) || 1) - 0.1);
$('rhwp-print').onclick = () => window.print();
btnClose.addEventListener('click', hideView);

console.info(TAG, '로드됨 (끄기: localStorage.mamaRhwp="off")');