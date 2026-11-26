/* =====================================================================
   💻 ПРАКТИКА (ноябрь 2026): комната с компьютером в библиотеке предмета.
   Герой садится за компьютер и «ныряет» в экран → список лабораторных → задание.
   C++: среда C++Builder 6 и интерпретатор C++ с учебного сайта автора (js/cpp/*), задания —
   data/subjects/cpp/labs.json (120 заданий: условие, шаги, эталон, проверки «ввод → экран»).
   Решённые задания: D.save.labs[id задания] = 1.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.DG, A = window.DA;
  var PR = window.PR = { active: false };
  var VER = (document.querySelector('script[src*="practice.js"]') || {}).src || '';
  VER = (VER.match(/\?v=\d+/) || [''])[0];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var md = function (s) { return D.md ? D.md(String(s || '')) : esc(s).replace(/\n/g, '<br>'); };
  var SUBJ = {
    cpp: { title: 'C++Builder 6', data: 'data/subjects/cpp/labs.json', js: ['cpp-parse', 'cpp-lib', 'cpp-run', 'cpp-stdlib', 'cpp-ui', 'vcl', 'vcl-ui', 'bcb-ide'].map(function (n) { return 'js/cpp/' + n + '.js'; }), css: 'css/bcb.css' }
  };
  var labs = {}, loading = {};
  function save() { var S = D.save; S.labs = S.labs || {}; return S.labs; }
  function allTasks(sid) { var out = []; (labs[sid] || []).forEach(function (l) { l.tasks.forEach(function (t) { out.push(t); }); }); return out; }
  PR.has = function (sid) { return !!SUBJ[sid]; };
  PR.label = function (sid) {
    var all = allTasks(sid); if (!all.length) return 'лабораторные за компьютером';
    var s = save(), n = all.filter(function (t) { return s[t.id]; }).length; return 'решено ' + n + ' из ' + all.length;
  };

  /* ---------- загрузка скриптов и данных (только когда садимся за компьютер) ---------- */
  function loadScript(src) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src + VER; s.onload = ok; s.onerror = function () { bad(new Error('Не загрузился ' + src)); }; document.head.appendChild(s); }); }
  function load(sid) {
    if (loading[sid]) return loading[sid];
    var cfg = SUBJ[sid];
    if (cfg.css && !document.querySelector('link[data-pr="' + sid + '"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = cfg.css + VER; l.setAttribute('data-pr', sid); document.head.appendChild(l); }
    var chain = Promise.resolve();
    cfg.js.forEach(function (src) { chain = chain.then(function () { return loadScript(src); }); });
    loading[sid] = Promise.all([chain, fetch(cfg.data, { cache: 'no-cache' }).then(function (r) { return r.json(); })]).then(function (r) { labs[sid] = r[1]; return r[1]; });
    loading[sid].catch(function () { loading[sid] = null; });
    return loading[sid];
  }
  PR.preload = function (sid) { if (SUBJ[sid]) fetch(SUBJ[sid].data).then(function (r) { return r.json(); }).then(function (j) { if (!labs[sid]) labs[sid] = j; }).catch(function () {}); };

  /* ---------- комната: стол, компьютер, герой садится и «ныряет» в монитор ---------- */
  var room = null;
  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstChild; }
  function drawRoom(c, t, hx, sit, on) {
    var W = 640, H = 360; c.imageSmoothingEnabled = false;
    c.fillStyle = '#1b1626'; c.fillRect(0, 0, W, H);
    for (var y = 0; y < 250; y += 16) for (var x = (y / 16) % 2 ? -16 : 0; x < W; x += 32) { c.fillStyle = (x + y) % 3 ? '#2a2236' : '#2e2640'; c.fillRect(x + 1, y + 1, 30, 14); }
    c.fillStyle = '#3b2a1e'; c.fillRect(0, 250, W, 110); for (var i = 0; i < W; i += 40) { c.fillStyle = '#33241a'; c.fillRect(i, 250, 2, 110); }
    c.fillStyle = '#4a3526'; c.fillRect(0, 248, W, 4);
    /* окно с луной */
    c.fillStyle = '#0d1530'; c.fillRect(60, 60, 90, 70); c.fillStyle = '#e8e1b8'; c.beginPath(); c.arc(120, 85, 10, 0, 7); c.fill(); c.fillStyle = '#0d1530'; c.beginPath(); c.arc(126, 81, 9, 0, 7); c.fill();
    c.strokeStyle = '#5a4630'; c.lineWidth = 4; c.strokeRect(60, 60, 90, 70); c.beginPath(); c.moveTo(105, 60); c.lineTo(105, 130); c.stroke();
    /* полка с дискетами и книгами */
    c.fillStyle = '#5a4630'; c.fillRect(470, 90, 120, 6); ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#7f8c8d'].forEach(function (col, k) { c.fillStyle = col; c.fillRect(478 + k * 17, 64, 13, 26); });
    /* стол */
    c.fillStyle = '#6b4a2f'; c.fillRect(250, 200, 250, 12); c.fillStyle = '#553a24'; c.fillRect(262, 212, 10, 50); c.fillRect(478, 212, 10, 50);
    /* системный блок */
    c.fillStyle = '#d8d2c0'; c.fillRect(436, 212, 40, 50); c.fillStyle = '#b9b29c'; c.fillRect(441, 220, 30, 5); c.fillRect(441, 229, 30, 5); c.fillStyle = on ? '#3ce36b' : '#2b4a2f'; c.fillRect(466, 252, 5, 4);
    /* монитор (ЭЛТ) */
    c.fillStyle = '#d8d2c0'; c.fillRect(300, 110, 120, 92); c.fillStyle = '#b9b29c'; c.fillRect(340, 200, 40, 6); c.fillRect(325, 196, 70, 5);
    c.fillStyle = on ? '#3a6ea5' : '#101418'; c.fillRect(310, 120, 100, 70);
    if (on) {
      c.fillStyle = '#d4d0c8'; c.fillRect(316, 126, 88, 58); c.fillStyle = '#0a246a'; c.fillRect(316, 126, 88, 8);
      c.fillStyle = '#fff'; c.fillRect(320, 138, 50, 42); c.fillStyle = '#000080'; for (var k = 0; k < 6; k++) c.fillRect(323, 141 + k * 6, 14 + (k * 13) % 30, 2);
      c.fillStyle = 'rgba(160,200,255,' + (0.12 + 0.08 * Math.sin(t / 90)) + ')'; c.fillRect(310, 120, 100, 70);
    }
    /* клавиатура, лампа */
    c.fillStyle = '#cfc8b4'; c.fillRect(318, 204, 84, 6); c.fillStyle = '#e8d38a'; c.fillRect(462, 160, 8, 40); c.beginPath(); c.moveTo(450, 160); c.lineTo(482, 160); c.lineTo(472, 146); c.lineTo(460, 146); c.fill();
    c.fillStyle = 'rgba(255,220,120,.08)'; c.beginPath(); c.moveTo(450, 160); c.lineTo(482, 160); c.lineTo(524, 250); c.lineTo(408, 250); c.fill();
    /* стул: стоит слева от стола, герой сидит боком к монитору */
    c.fillStyle = '#2d3e50'; c.fillRect(236, 222, 46, 8); c.fillRect(232, 176, 10, 52); c.fillStyle = '#1f2b38'; c.fillRect(256, 230, 6, 22); c.fillRect(242, 248, 34, 4);
    /* герой */
    if (A && A.drawHero) {
      if (sit) { A.drawHero(c, on ? 'idle' : 'idle', Math.floor(t / 450), 266, 232, 1.6); }
      else A.drawHero(c, 'walk', Math.floor(t / 110), hx, 252, 1.6);
    }
  }
  function enterRoom(sid, done) {
    PR.active = true;
    room = el('<div class="prx-room" role="dialog" aria-label="Компьютерная комната"><canvas width="640" height="360"></canvas>' +
      '<div class="prx-cap"><b>💻 Практика · ' + esc(SUBJ[sid].title) + '</b><span>садимся за компьютер…</span><button class="btn ghost sm" data-skip>Пропустить ⏭</button></div><div class="prx-flash"></div></div>');
    document.body.appendChild(room);
    var cv = room.querySelector('canvas'), c = cv.getContext('2d'), t0 = performance.now(), ready = false, finished = false, ph = 0;
    var dataP = load(sid).then(function () { ready = true; }, function (e) { ready = 'err'; room.querySelector('.prx-cap span').textContent = 'Ошибка загрузки: ' + e.message; });
    var finish = function () { if (finished) return; finished = true; if (ready === true) done(); else dataP.then(function () { if (ready === true) done(); }); };
    room.querySelector('[data-skip]').onclick = function () { ph = 9; finish(); };
    (function frame(now) {
      if (!room || finished && ph === 9) return;
      var t = now - t0, walk = Math.min(1, t / 1800), hx = 40 + walk * 226, sit = t > 1900, on = t > 2300;
      drawRoom(c, t, hx, sit, on);
      var cap = room.querySelector('.prx-cap span');
      if (t > 1900 && t < 2300) cap.textContent = 'включаю компьютер…'; else if (t >= 2300 && t < 3000) cap.textContent = 'загружается ' + SUBJ[sid].title + '…';
      if (t > 3000) { var k = Math.min(1, (t - 3000) / 1100), s = 1 + k * k * 5.2; cv.style.transformOrigin = '56% 43%'; cv.style.transform = 'scale(' + s + ')'; room.querySelector('.prx-flash').style.opacity = Math.max(0, (k - .55) / .45); }
      if (t > 4200) { finish(); if (ready === true) return; }
      requestAnimationFrame(frame);
    })(t0);
  }
  function leaveRoom() { if (room) { room.remove(); room = null; } }

  /* ---------- окна в стиле Windows 2000 ---------- */
  var win = null;
  function closeWin() { if (win) { win.remove(); win = null; } }
  function makeWin(cls, title, body, opts) {
    var w = el('<div class="prx ' + cls + '"><div class="prx-t"><span class="ico">' + (opts && opts.ico || 'C') + '</span><span class="tt">' + esc(title) + '</span>' +
      (opts && opts.min ? '<button data-min title="Свернуть">_</button>' : '') + '<button data-x title="Закрыть">×</button></div><div class="prx-b">' + body + '</div></div>');
    document.body.appendChild(w);
    var t = w.querySelector('.prx-t'), drag = null;
    t.addEventListener('mousedown', function (e) { if (e.target.closest('button')) return; var r = w.getBoundingClientRect(); drag = { x: e.clientX - r.left, y: e.clientY - r.top }; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!drag) return; w.style.left = Math.max(0, e.clientX - drag.x) + 'px'; w.style.top = Math.max(0, e.clientY - drag.y) + 'px'; w.style.right = 'auto'; w.style.transform = 'none'; });
    window.addEventListener('mouseup', function () { drag = null; });
    var mn = w.querySelector('[data-min]'); if (mn) mn.onclick = function () { w.classList.toggle('mini'); };
    return w;
  }

  /* ---------- список лабораторных ---------- */
  var curSid = null;
  function openList(sid, focusLab) {
    closeWin(); hideTask();
    var L = labs[sid] || [], s = save();
    var tree = L.map(function (l, i) {
      var done = l.tasks.filter(function (t) { return s[t.id]; }).length;
      return '<button class="lb-it' + (i === (focusLab || 0) ? ' on' : '') + '" data-lab="' + i + '"><span class="lb-n">Т' + l.topic + '</span><span class="lb-name">' + esc(l.short || l.title) + '</span><span class="lb-c' + (done === l.tasks.length ? ' full' : '') + '">' + done + '/' + l.tasks.length + '</span></button>';
    }).join('');
    win = makeWin('prx-list', 'Лабораторные работы — ' + SUBJ[sid].title, '<div class="lb-wrap"><div class="lb-tree">' + tree + '</div><div class="lb-right"></div></div>' +
      '<div class="prx-bar"><span class="grow">' + esc(PR.label(sid)) + '</span><button class="w2k" data-exit>🚪 Встать из-за компьютера</button></div>', { ico: '📁' });
    win.querySelector('[data-x]').onclick = exit; win.querySelector('[data-exit]').onclick = exit;
    var right = win.querySelector('.lb-right');
    var show = function (i) {
      win.querySelectorAll('.lb-it').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-lab') === i); });
      var l = L[i];
      right.innerHTML = '<h3>' + esc(l.title) + '</h3>' + (l.description ? '<details class="lb-desc"><summary>Текст лабы из методички</summary><div>' + md(l.description) + '</div></details>' : '') +
        '<div class="lb-tasks">' + l.tasks.map(function (t, k) {
          return '<button class="lb-task' + (s[t.id] ? ' ok' : '') + '" data-t="' + k + '"><b>' + (s[t.id] ? '✓ ' : '') + esc(t.name || ('Задание ' + (k + 1))) + '</b><span>' + esc(String(t.title || t.text || '').replace(/[*`#]/g, '').slice(0, 90)) + '</span><em>' + (t.kind === 'vcl' ? 'форма (VCL)' : 'консоль') + (t.tests && t.tests.length ? ' · проверок: ' + t.tests.length : '') + '</em></button>';
        }).join('') + '</div>';
      right.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { openTask(sid, i, +b.getAttribute('data-t')); }; });
    };
    win.querySelectorAll('[data-lab]').forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-lab')); }; });
    show(focusLab || 0);
  }

  /* ---------- задание ---------- */
  var task = null, tw = null, vclBox = null;
  function hideTask() { if (tw) { tw.remove(); tw = null; } if (vclBox) { vclBox.remove(); vclBox = null; } var ide = window.CPP && CPP.ide && CPP.ide(); if (ide) ide.hide(); }
  function startCode(t) {
    if (t.start) return t.start;
    return '#include <iostream.h>\n#include <conio.h>\n#include <math.h>\n\nint main()\n{\n  // ' + String(t.name || 'Задание') + ': напиши решение здесь\n\n  getch();\n  return 0;\n}\n';
  }
  function openTask(sid, li, ti) {
    closeWin();
    var l = labs[sid][li], t = l.tasks[ti]; task = { sid: sid, li: li, ti: ti, t: t };
    if (t.kind === 'vcl' && t.vcl) openVcl(t); else openConsole(t);
    taskWin(t, l);
  }
  function openConsole(t) {
    var X = CPP.IDE_TEST, key = 'dgLab:' + t.id, prj = null;
    try { var sv = localStorage.getItem(key); if (sv) prj = X.prjLoad(JSON.parse(sv)); } catch (e) { prj = null; }
    if (!prj) { prj = X.newProject('console', 'Lab_' + t.id.replace(/[^A-Za-z0-9]/g, '_')); prj.units[0].cpp = startCode(t); }
    CPP.openIDE(prj);
  }
  function openVcl(t) {
    vclBox = el('<div class="prx prx-vcl"><div class="prx-t"><span class="ico">C</span><span class="tt">C++Builder 6 — ' + esc(t.name || 'Форма') + '</span><button data-x title="К списку">×</button></div><div class="prx-b"><div class="vclw" data-id="dg-' + esc(t.id) + '"><script type="application/json" data-role="vcl"></script></div></div></div>');
    vclBox.querySelector('script').textContent = JSON.stringify(t.vcl);
    document.body.appendChild(vclBox);
    vclBox.querySelector('[data-x]').onclick = function () { openList(task.sid, task.li); };
    CPP.initVcl(vclBox);
    var w = vclBox.querySelector('.vclw');
    new MutationObserver(function () { if (w.classList.contains('solved')) markSolved(t, 'Форма работает, как надо — задание решено!'); }).observe(w, { attributes: true, attributeFilter: ['class'] });
  }
  function taskWin(t, l) {
    var tests = t.tests || [];
    tw = makeWin('prx-task', t.name + ' · ' + (l.short || ''), '<div class="tk-scroll"><div class="tk-text">' + md(t.text || t.title || '') + '</div>' +
      (t.note ? '<p class="tk-note">⚠ ' + md(t.note) + '</p>' : '') +
      '<details class="tk-steps"><summary>💡 Подсказка: как решать по шагам</summary><div>' + md(t.steps || 'Подсказки нет — посмотри эталон.') + '</div></details>' +
      '<details class="tk-ref"><summary>📄 Эталонное решение</summary><pre class="tk-code"></pre></details>' +
      '<div class="tk-res" aria-live="polite"></div></div>' +
      '<div class="prx-bar">' + (t.kind === 'vcl' ? '<span class="grow tk-hint">Собери форму, напиши обработчик, жми F9 и «Проверить» в окне Builder.</span>' : '<button class="w2k primary" data-check>✔ Проверить' + (tests.length ? ' (' + tests.length + ')' : '') + '</button><span class="grow"></span>') +
      '<button class="w2k" data-list>📁 К списку</button></div>', { ico: '📝', min: true });
    tw.querySelector('.tk-code').textContent = t.ref || (t.vcl && t.vcl.ref ? t.vcl.ref.code : '') || t.unit || '';
    tw.querySelector('[data-x]').onclick = function () { openList(task.sid, task.li); };
    tw.querySelector('[data-list]').onclick = function () { openList(task.sid, task.li); };
    var ck = tw.querySelector('[data-check]'); if (ck) ck.onclick = check;
    if (save()[t.id]) tw.querySelector('.tk-res').innerHTML = '<p class="tk-ok">✓ Это задание ты уже решал.</p>';
  }
  function userCode() {
    var ide = CPP.ide && CPP.ide(); if (!ide) return '';
    var prj = ide.get(); try { localStorage.setItem('dgLab:' + task.t.id, JSON.stringify(CPP.IDE_TEST.prjJSON(prj))); } catch (e) {}
    return prj.units.map(function (u) { return u.cpp; }).join('\n');
  }
  function check() {
    var t = task.t, tests = t.tests || [], code = userCode(), res = tw.querySelector('.tk-res'), mode = t.cmp || 'exact';
    if (!tests.length) {
      var r0 = CPP.run(code, { input: '' });
      res.innerHTML = r0.compileError ? '<p class="tk-bad">✗ Ошибка компиляции: ' + esc(r0.error && r0.error.message) + '</p>' :
        '<p class="tk-warn">У этого задания нет автопроверки. Программа запустилась — сравни с эталоном и отметь сам.</p><button class="w2k" data-self>✓ Решил сам</button>';
      var sb = res.querySelector('[data-self]'); if (sb) sb.onclick = function () { markSolved(t, 'Отмечено как решённое.'); };
      return;
    }
    var all = true, h = '';
    tests.forEach(function (ts, i) {
      var r = CPP.run(code, { input: ts.input || '' }), exp = String(ts.output || '').replace(/\r/g, '').replace(/\n+$/, '').split('\n'), got = (r.lines || []).slice();
      while (got.length && got[got.length - 1] === '') got.pop();
      if (r.compileError || (r.error && !r.ok && !(r.lines || []).length)) { all = false; h += '<div class="tk-t bad"><b>Проверка ' + (i + 1) + ' ✗</b> ' + esc(r.error ? r.error.message : 'ошибка') + '</div>'; return; }
      var cmp = CPP.compare(exp, got, mode); if (!cmp.ok) all = false;
      h += '<div class="tk-t ' + (cmp.ok ? 'ok' : 'bad') + '"><b>Проверка ' + (i + 1) + (ts.label ? ' · ' + esc(ts.label) : '') + ' ' + (cmp.ok ? '✓' : '✗') + '</b>' + (cmp.msg ? '<span>' + esc(cmp.msg) + '</span>' : '') +
        (cmp.ok ? '' : '<div class="tk-cols"><div><i>Должно быть</i><pre>' + esc(exp.join('\n')) + '</pre></div><div><i>У тебя</i><pre>' + esc(got.join('\n')) + '</pre></div></div>') + '</div>';
    });
    res.innerHTML = (all ? '<p class="tk-ok">✓ Все проверки пройдены!</p>' : '<p class="tk-bad">Есть ошибки — смотри, где вывод отличается.</p>') + h;
    if (all) markSolved(t, 'Все проверки пройдены — задание решено!');
  }
  function markSolved(t, msg) {
    var s = save(); if (s[t.id]) return; s[t.id] = 1; D.persist();
    if (window.DGame && DGame.toast) DGame.toast('💻 ' + msg); else if (typeof window.toast === 'function') window.toast(msg);
    var r = tw && tw.querySelector('.tk-res'); if (r && !/tk-ok/.test(r.innerHTML)) r.insertAdjacentHTML('afterbegin', '<p class="tk-ok">✓ ' + esc(msg) + '</p>');
    try { if (window.DA && DA.sfx) DA.sfx('ok'); } catch (e) {}
  }
  function exit() {
    hideTask(); closeWin(); leaveRoom(); PR.active = false; task = null;
    if (window.DGame && DGame.lib) DGame.lib();
  }
  document.addEventListener('bcb-hide', function () { if (PR.active && task && !vclBox) openList(task.sid, task.li); });

  PR.open = function (sid) { if (!SUBJ[sid] || PR.active) return; curSid = sid; enterRoom(sid, function () { if (room) room.classList.add('desk'); openList(sid); }); };
})();
