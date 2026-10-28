(function () {
  'use strict';

  var PDF_URL  = '/convert-pdf';
  var HWPX_URL = '/convert-hwpx';

  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;font:600 13px "Malgun Gothic",sans-serif';
  document.body.appendChild(box);

  var logEl = document.createElement('div');
  logEl.style.cssText = 'display:none;max-width:330px;padding:8px 11px;border-radius:8px;background:rgba(18,22,28,.94);color:#cfe3ff;font:12px/1.55 "Malgun Gothic",sans-serif;white-space:pre-wrap;border:1px solid #37404c';
  box.appendChild(logEl);

  var timer = null;
  function say(msg, hold) {
    logEl.style.display = 'block';
    logEl.textContent = msg;
    if (timer) { clearTimeout(timer); timer = null; }
    if (!hold) { timer = setTimeout(function () { logEl.style.display = 'none'; }, 7000); }
  }

  function mkBtn(label, fn) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'padding:10px 14px;border-radius:8px;border:1px solid #4a525d;background:#2f3540;color:#e6e6e6;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.45)';
    b.onclick = fn;
    box.appendChild(b);
    return b;
  }

  var picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = '.hwpx,.hwp';
  picker.style.display = 'none';
  box.appendChild(picker);

  var kind = 'pdf';

  picker.addEventListener('change', function () {
    if (picker.files && picker.files[0]) run(picker.files[0], kind);
  });

  function askFile(k) {
    kind = k;
    picker.value = '';
    picker.click();
  }

  function inject(file) {
    var inp = document.getElementById('file-input');
    if (!inp) { window.open(URL.createObjectURL(file), '_blank'); return; }
    try {
      var dt = new DataTransfer();
      dt.items.add(file);
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      window.open(URL.createObjectURL(file), '_blank');
    }
  }

  async function run(file, k) {
    var url = (k === 'hwpx') ? HWPX_URL : PDF_URL;
    var t0 = Date.now();
    say('변환 중... ' + file.name + ' (' + Math.round(file.size / 1024) + 'KB)\n한글 엔진 호출 중, 약 10초', true);
    try {
      var res = await fetch(url + '?name=' + encodeURIComponent(file.name), {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: await file.arrayBuffer()
      });
      var secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (!res.ok) {
        var txt = await res.text();
        say('실패 HTTP ' + res.status + ' (' + secs + 's)\n' + txt.slice(0, 320), true);
        return;
      }
      var blob = await res.blob();
      var base = file.name.replace(/\.[^.]+$/, '');
      var name = base + ((k === 'hwpx') ? '.hwpx' : '.pdf');
      var type = (k === 'hwpx') ? 'application/x-hwp+zip' : 'application/pdf';
      var pages = res.headers.get('X-Page-Count') || '?';
      var kb = Math.round(blob.size / 1024);
      say('완료 · ' + kb + 'KB · ' + secs + 's' + ((k === 'pdf') ? (' · ' + pages + '쪽') : ''));
      inject(new File([blob], name, { type: type }));
    } catch (e) {
      say('오류: ' + e.message, true);
    }
  }

  mkBtn('원본 조판 PDF', function () { askFile('pdf'); });
  mkBtn('hwp → hwpx 편집본', function () { askFile('hwpx'); });
})();