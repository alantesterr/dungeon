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
  var md = function (s) { return (D.md ? D.md(String(s || '')) : esc(s).replace(/\n/g, '<br>')).replace(/\*\*([^*<]+)\*\*/g, '<b>$1</b>'); };
  var SUBJ = {
    cpp: { title: 'C++Builder 6', data: 'data/subjects/cpp/labs.json', js: ['cpp-parse', 'cpp-lib', 'cpp-run', 'cpp-stdlib', 'cpp-ui', 'vcl', 'vcl-ui', 'bcb-ide', 'bcb-skin'].map(function (n) { return 'js/cpp/' + n + '.js'; }), css: 'css/bcb.css' }
    , arch: { title: 'Electronics Workbench', site: 'https://alantesterr.github.io/contents/', data: 'data/subjects/arch/labs.json', js: [] }
  };
  var labs = {}, loading = {};
  function save() { var S = D.save; S.labs = S.labs || {}; return S.labs; }
  function allTasks(sid) { var out = []; (labs[sid] || []).forEach(function (l) { l.tasks.forEach(function (t) { out.push(t); }); }); return out; }
  PR.has = function (sid) { return !!SUBJ[sid]; };
  PR.label = function (sid) {
    var all = allTasks(sid); if (!all.length) return 'лабораторные за компьютером';
    var s = save(), n = all.filter(function (t) { return s[t.id]; }).length; return 'решено ' + n + ' из ' + all.length;
  };
  /* прогресс для полки «💻 Лабораторные» в библиотеке; данные подгружаются один раз в фоне */
  var pre = {};
  PR.progress = function (sid) {
    var all = allTasks(sid);
    if (!all.length && !pre[sid] && SUBJ[sid]) { pre[sid] = 1; fetch(SUBJ[sid].data).then(function (r) { return r.json(); }).then(function (j) { if (!labs[sid]) labs[sid] = j; if (window.DGame && DGame.lib && !PR.active) DGame.lib(); }).catch(function () {}); }
    var s = save(), n = all.filter(function (t) { return s[t.id]; }).length;
    return { done: n, total: all.length, pct: all.length ? Math.round(n * 100 / all.length) : 0 };
  };
  /* лабы, сгруппированные по темам 1–15 */
  function byTopic(sid) {
    var g = {}; (labs[sid] || []).forEach(function (l, i) { (g[l.topic] = g[l.topic] || []).push(i); });
    return Object.keys(g).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return { n: n, labs: g[n] }; });
  }
  function topicTitle(sid, n) { var sj = D.SUBJ && D.SUBJ[sid], f = sj && sj.floors.filter(function (x) { return x.n === n; })[0]; return f ? f.title : ''; }

  /* ---------- загрузка скриптов и данных (только когда садимся за компьютер) ---------- */
  var scripts = {};
  function loadScript(src) { if (scripts[src]) return scripts[src]; return (scripts[src] = new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src + VER; s.onload = ok; s.onerror = function () { scripts[src] = null; bad(new Error('Не загрузился ' + src)); }; document.head.appendChild(s); })); }
  /* только интерпретатор C++ (для «🧪 Попробовать» в тестах), без Builder */
  PR.loadCpp = function () {
    if (!document.querySelector('link[data-pr="cpp"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = SUBJ.cpp.css + VER; l.setAttribute('data-pr', 'cpp'); document.head.appendChild(l); }
    var c = Promise.resolve(); ['cpp-parse', 'cpp-lib', 'cpp-run', 'cpp-stdlib', 'cpp-ui'].forEach(function (n) { c = c.then(function () { return loadScript('js/cpp/' + n + '.js'); }); }); return c; };
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

  /* ---------- «Практикум»: как обычная программа — темы слева, задания с коротким описанием справа ---------- */
  var curSid = null, view = { only: false, q: '' };
  function plainT(s) { return String(s || '').replace(/```[\s\S]*?```/g, ' ').replace(/\[рисунок:[^\]]*\]/g, ' ').replace(/[*`#>|_]/g, '').replace(/\s+/g, ' ').trim(); }
  /* «Коротко»: первое предложение условия без «Написать программу…» и без примера экрана */
  function brief(t) {
    var s = plainT(t.text || t.title).replace(/(Экран должен выглядеть|Рекомендуемый вид|Пример (экрана|работы)|Например)[\s\S]*$/i, '').trim();
    if (/^[a-zа-я]\s*=/i.test(s)) return 'Вычисли по формуле: ' + s.replace(/\s*При\s[\s\S]*$/, '').slice(0, 90) + (s.length > 90 ? '…' : '');   /* тема 1: формулы */
    s = s.replace(/^(Тема|Цель работы[^:]*|Контрольные задания[^:]*):\s*/i, '').replace(/^(Напи(шите|сать)|Составь(те)?|Созда(йте|ть)|Разработа(йте|ть))\s+(программу|приложение|функцию)\s*,?\s*(котор[а-яё]+\s+)?/i, '');
    /* первое предложение; если оно короткое («Дано трёхзначное число.») — добавляем второе, где сама задача */
    var parts = s.match(/[^.!?]+(?:[.!?](?=\s|$)|$)/g) || [s], b = '';
    for (var i = 0; i < parts.length && (b.length < 45 || i < 1); i++) b += parts[i];
    s = b.trim() || s;
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s.length > 130 ? s.slice(0, 127).replace(/\s+\S*$/, '') + '…' : s;
  }
  function tags(sid, t) {
    if (SUBJ[sid].site) return (t.tools || []).slice(0, 3);
    var c = String(t.ref || (t.vcl && t.vcl.ref && t.vcl.ref.code) || t.unit || ''), out = [];
    if (t.kind === 'vcl') { out.push('форма'); var ty = []; ((t.vcl && t.vcl.ref && t.vcl.ref.comps) || []).forEach(function (x) { var n = String(x.type || '').slice(1); if (n && ty.indexOf(n) < 0) ty.push(n); }); out = out.concat(ty.slice(0, 3)); }
    else out.push('консоль');
    if (/\bclass\s+\w+/.test(c)) out.push('классы');
    [[/\bswitch\b/, 'switch'], [/\bif\s*\(/, 'if'], [/\bfor\s*\(|\bwhile\s*\(/, 'циклы'], [/\w\s*\[\s*\w+\s*\]\s*\[/, 'матрица'], [/\w\[\s*\w*\s*\]/, 'массив'], [/strlen|strcpy|AnsiString|char\s+\w+\s*\[/, 'строки'], [/\bstruct\b/, 'struct'], [/fstream|FILE\s*\*|fopen/, 'файлы'], [/SetConsoleTextAttribute/, 'цвет'], [/\b(sqrt|pow|cos|sin|tan|fabs|exp|log|atan|acos|asin)\s*\(/, 'math']]
      .forEach(function (p) { if (p[0].test(c) && out.indexOf(p[1]) < 0 && !(p[1] === 'массив' && out.indexOf('матрица') >= 0)) out.push(p[1]); });
    if (out.indexOf('классы') < 0 && (c.match(/^\s*\w[\w\s\*&]*\s+\w+\s*\([^;{)]*\)\s*\{/gm) || []).filter(function (x) { return !/\bmain\s*\(|__fastcall/.test(x); }).length) out.push('функции');
    return out.slice(0, 4);
  }
  function level(sid, t) { if (SUBJ[sid].site) return 0; var n = String(t.ref || (t.vcl && t.vcl.ref && t.vcl.ref.code) || '').split('\n').filter(function (x) { x = x.trim(); return x && !/^(#|\/\/|[{}]+;?$|return\b|getch|using\b|cout\s*<<\s*endl;$|int main|\}?\s*else\s*\{?$)/.test(x); }).length; return n < 14 ? 1 : n < 30 ? 2 : 3; }   /* сложность по строкам «с делом» */
  function every(sid) { var out = []; (labs[sid] || []).forEach(function (l, li) { l.tasks.forEach(function (t, ti) { out.push({ li: li, ti: ti, t: t, l: l }); }); }); return out; }
  function lastOf(sid) { var id = (D.save.labLast || {})[sid]; return id ? every(sid).filter(function (x) { return x.t.id === id; })[0] : null; }
  function randomTask(sid, topic) {
    var s = save(), all = every(sid), pool = all.filter(function (x) { return !s[x.t.id] && (topic == null || +x.l.topic === topic); });
    if (!pool.length) pool = all.filter(function (x) { return !s[x.t.id]; });
    if (!pool.length) pool = all;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function openList(sid, focusLab) {
    closeWin(); hideTask();
    var L = labs[sid] || [], s = save(), topics = byTopic(sid);
    var topicOfLab = function (i) { return +(L[i] || {}).topic; };
    var curTopic = focusLab != null && L[focusLab] ? topicOfLab(focusLab) : (view.topic != null ? view.topic : (topics[0] || {}).n);
    var cnt = function (ids) { var d = 0, n = 0; ids.forEach(function (i) { L[i].tasks.forEach(function (t) { n++; if (s[t.id]) d++; }); }); return [d, n]; };
    var bar = function (d, n) { return '<span class="pk-bar"><i style="width:' + (n ? Math.round(d * 100 / n) : 0) + '%"></i></span>'; };
    var tree = topics.map(function (g) {
      var c = cnt(g.labs), tt = topicTitle(sid, g.n);
      return '<button class="pk-top' + (c[0] === c[1] ? ' full' : '') + '" data-top="' + g.n + '" title="' + esc(tt) + '"><span class="pk-num">' + g.n + '</span><span class="pk-tt">' + esc(tt || ('Тема ' + g.n)) + bar(c[0], c[1]) + '</span><em>' + c[0] + '/' + c[1] + '</em></button>';
    }).join('');
    var last = lastOf(sid), all = every(sid), done = all.filter(function (x) { return s[x.t.id]; }).length;
    win = makeWin('prx-list pk', 'Практикум — ' + SUBJ[sid].title, '<div class="pk-tool">' +
      (last ? '<button class="w2k primary" data-cont title="' + esc(last.t.name) + '">▶ Продолжить: ' + esc((last.l.short || '') + ' · ' + (last.t.name || '')) + '</button>' : '') +
      '<button class="w2k" data-rand title="Нерешённое задание из выбранной темы">🎲 Случайное задание</button>' +
      '<button class="w2k" data-free title="Как после запуска настоящей программы">' + (SUBJ[sid].site ? '⚡ Пустой EWB' : '🖥 Пустой Builder') + '</button>' +
      '<label class="pk-chk"><input type="checkbox" data-only' + (view.only ? ' checked' : '') + '> только нерешённые</label>' +
      '<input class="pk-find" data-find placeholder="🔍 Найти: массив, switch, кнопка…" value="' + esc(view.q) + '"></div>' +
      '<div class="lb-wrap"><div class="lb-tree pk-tree">' + tree + '</div><div class="lb-right"></div></div>' +
      '<div class="prx-bar"><span class="pk-all">Решено ' + done + ' из ' + all.length + bar(done, all.length) + '</span><span class="grow"></span><button class="w2k" data-exit>🚪 Встать из-за компьютера</button></div>', { ico: '📁' });
    win.querySelector('[data-x]').onclick = exit; win.querySelector('[data-exit]').onclick = exit;
    win.querySelector('[data-free]').onclick = function () { openFree(sid); };
    var cb = win.querySelector('[data-cont]'); if (cb) cb.onclick = function () { openTask(sid, last.li, last.ti); };
    var right = win.querySelector('.lb-right');
    var card = function (x) {
      var t = x.t, ok = s[t.id], lv = level(sid, t);
      return '<button class="lb-task pk-card' + (ok ? ' ok' : '') + '" data-li="' + x.li + '" data-ti="' + x.ti + '"><b>' + (ok ? '✅ ' : '') + esc(t.name || 'Задание') + (lv ? '<i class="pk-lv" title="сложность">' + '★★★'.slice(0, lv) + '<u>' + '★★★'.slice(lv) + '</u></i>' : '') + '</b>' +
        '<span>' + esc(brief(t)) + '</span><em>' + tags(sid, t).map(function (g) { return '<s>' + esc(g) + '</s>'; }).join('') + '</em></button>';
    };
    var draw = function () {
      win.querySelectorAll('[data-top]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-top') === curTopic && !view.q); });
      var q = view.q.trim().toLowerCase(), h = '';
      var keep = function (x) { if (view.only && s[x.t.id]) return false; if (!q) return true; return (x.t.name + ' ' + plainT(x.t.text) + ' ' + tags(sid, x.t).join(' ') + ' ' + (x.t.ref || '')).toLowerCase().indexOf(q) >= 0; };
      if (q) {
        var found = all.filter(keep);
        h = '<h3>Найдено: ' + found.length + '</h3><div class="lb-tasks">' + found.slice(0, 80).map(card).join('') + '</div>';
      } else {
        var g = topics.filter(function (x) { return x.n === curTopic; })[0]; if (!g) { right.innerHTML = ''; return; }
        var c = cnt(g.labs);
        h = '<div class="pk-head"><h3>Тема ' + g.n + '. ' + esc(topicTitle(sid, g.n)) + '</h3><span>' + c[0] + ' из ' + c[1] + bar(c[0], c[1]) + '</span></div>';
        g.labs.forEach(function (li) {
          var l = L[li], xs = l.tasks.map(function (t, ti) { return { li: li, ti: ti, t: t, l: l }; }).filter(keep);
          if (!xs.length) return;
          var dn = l.tasks.filter(function (t) { return s[t.id]; }).length;
          h += '<div class="pk-lab"><h4>' + esc(l.title) + ' <em>' + dn + '/' + l.tasks.length + '</em></h4>' + (l.description ? '<details class="lb-desc"><summary>Текст лабы из методички</summary><div>' + md(l.description) + '</div></details>' : '') + '<div class="lb-tasks">' + xs.map(card).join('') + '</div></div>';
        });
        if (!/pk-lab/.test(h)) h += '<p class="pk-empty">🎉 В этой теме всё решено! Сними галочку «только нерешённые», чтобы увидеть задания.</p>';
      }
      right.innerHTML = h; right.scrollTop = 0;
      right.querySelectorAll('[data-li]').forEach(function (b) { b.onclick = function () { openTask(sid, +b.getAttribute('data-li'), +b.getAttribute('data-ti')); }; });
    };
    win.querySelectorAll('[data-top]').forEach(function (b) { b.onclick = function () { curTopic = view.topic = +b.getAttribute('data-top'); view.q = ''; win.querySelector('[data-find]').value = ''; draw(); }; });
    win.querySelector('[data-only]').onchange = function () { view.only = this.checked; draw(); };
    win.querySelector('[data-find]').oninput = function () { view.q = this.value; draw(); };
    win.querySelector('[data-rand]').onclick = function () {
      var x = randomTask(sid, curTopic), b = this; if (!x) return;
      b.disabled = true; var k = 0, names = all.map(function (y) { return y.t.name; });
      var spin = setInterval(function () { b.textContent = '🎲 ' + names[Math.floor(Math.random() * names.length)]; if (++k > 8) { clearInterval(spin); b.textContent = '🎲 ' + (x.l.short || '') + ' · ' + x.t.name; setTimeout(function () { openTask(sid, x.li, x.ti); }, 450); } }, 70);
    };
    draw();
    var on = win.querySelector('.pk-top.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- задание ---------- */
  var task = null, tw = null, vclBox = null;
  function hideTask() { if (tw) { tw.remove(); tw = null; } if (vclBox) { vclBox.remove(); vclBox = null; } if (siteBox) { siteBox.remove(); siteBox = null; } var ide = window.CPP && CPP.ide && CPP.ide(); if (ide) ide.hide(); }
  function startCode(t) {
    if (t.start) return t.start;
    return '#include <iostream.h>\n#include <conio.h>\n#include <math.h>\n\nint main()\n{\n  // ' + String(t.name || 'Задание') + ': напиши решение здесь\n\n  getch();\n  return 0;\n}\n';
  }
  /* «Пустой Builder»: как после запуска настоящей программы — Project1 с пустой Form1 */
  function openFree(sid) {
    closeWin(); hideTask(); task = null; curSid = sid;
    if (SUBJ[sid].site) { openSite(sid, 't16', 'Electronics Workbench — свободная сборка'); return; }
    var p = CPP.IDE_TEST.newProject('vcl', 'Project1'); p.dgKeep = true;
    CPP.openIDE(p);
    if (window.DGame && DGame.toast) DGame.toast('💻 Пустой Builder. Лабу можно открыть: File → Open Project (Ctrl+F11)');
  }
  /* File → Open Project: окно открытия файла Windows с папками «Тема 01 … Тема 15» */
  function openDialog(sid) {
    var old = document.querySelector('.prx-open'); if (old) old.remove();
    var L = labs[sid] || [], s = save(), dir = null;
    var w = makeWin('prx-open', 'Open Project', '<div class="od-top">Look in: <span class="od-path"></span> <button class="w2k od-up" title="Up One Level">⬆</button></div><div class="od-list"></div>' +
      '<div class="od-f"><label>File name:</label><input class="od-name" readonly><button class="w2k primary od-ok">Open</button></div>' +
      '<div class="od-f"><label>Files of type:</label><select disabled><option>C++Builder project (*.bpr)</option></select><button class="w2k od-cancel">Cancel</button></div>', { ico: '📂' });
    var list = w.querySelector('.od-list'), name = w.querySelector('.od-name'), pick = null;
    var open = function (p) { if (!p) return; if (p.dir != null) { dir = p.dir; draw(); return; } w.remove(); openTask(sid, p.li, p.ti); };
    var draw = function () {
      w.querySelector('.od-path').textContent = dir == null ? '📁 Лабораторные' : '📁 Тема ' + (dir < 10 ? '0' : '') + dir;
      var items = [];
      if (dir == null) byTopic(sid).forEach(function (g) { items.push({ dir: g.n, label: 'Тема ' + (g.n < 10 ? '0' : '') + g.n + ' — ' + topicTitle(sid, g.n), ic: '📁' }); });
      else byTopic(sid).filter(function (g) { return g.n === dir; })[0].labs.forEach(function (li) { L[li].tasks.forEach(function (t, ti) { items.push({ li: li, ti: ti, label: (L[li].short || 'Лаба') + ' — ' + (t.name || 'Задание') + '.bpr', ic: s[t.id] ? '✅' : (t.kind === 'vcl' ? '🗔' : '📄') }); }); });
      list.innerHTML = items.map(function (it, k) { return '<div class="od-it" data-k="' + k + '"><span>' + it.ic + '</span>' + esc(it.label) + '</div>'; }).join('');
      list.querySelectorAll('.od-it').forEach(function (d) {
        var it = items[+d.getAttribute('data-k')];
        d.onclick = function () { list.querySelectorAll('.od-it').forEach(function (x) { x.classList.remove('on'); }); d.classList.add('on'); pick = it; name.value = it.dir != null ? '' : it.label; };
        d.ondblclick = function () { open(it); };
      });
    };
    w.querySelector('.od-up').onclick = function () { dir = null; draw(); };
    w.querySelector('.od-ok').onclick = function () { open(pick); };
    w.querySelector('.od-cancel').onclick = w.querySelector('[data-x]').onclick = function () { w.remove(); };
    draw();
  }
  /* в Builder пункт File → Open Project и кнопка «Open» на панели открывают окно с лабами */
  document.addEventListener('click', function (e) {
    if (!PR.active || !curSid) return;
    var b = e.target.closest && e.target.closest('.bcbx [data-a="open"]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    var dd = document.querySelector('.bcbx .bx-drop'); if (dd) dd.remove();
    document.querySelectorAll('.bcbx .bx-menu .on').forEach(function (x) { x.classList.remove('on'); });
    openDialog(curSid);
  }, true);
  /* ---------- Архитектура: «компьютер» показывает учебный сайт автора (тот же адрес alantesterr.github.io) —
     там живые окна EWB, пошаговый ассемблер и калькуляторы. Открываем нужную тему / задание по якорю #id. ---------- */
  var siteBox = null;
  function openSite(sid, anchor, title) {
    if (siteBox) siteBox.remove();
    var url = SUBJ[sid].site + '#' + (anchor || 't1');
    siteBox = el('<div class="prx prx-site"><div class="prx-t"><span class="ico">⚡</span><span class="tt">' + esc(SUBJ[sid].title) + ' — ' + esc(title || '') + '</span><button data-x title="К списку">×</button></div>' +
      '<div class="prx-b"><iframe title="Лабораторный стенд" src="' + esc(url) + '" loading="eager"></iframe><div class="site-load">Загружается стенд…</div></div></div>');
    document.body.appendChild(siteBox);
    siteBox.querySelector('[data-x]').onclick = function () { openList(sid, task ? task.li : undefined); };
    var fr = siteBox.querySelector('iframe');
    fr.onload = function () {
      var ld = siteBox && siteBox.querySelector('.site-load'); if (ld) ld.remove();
      /* тот же сайт (alantesterr.github.io): прячем шапку сайта, чтобы было похоже на программу; локально (другой адрес) — как есть */
      try {
        var d = fr.contentDocument; if (!d) return;
        var s = d.createElement('style'); s.textContent = 'header,.subj,.tabs,.top,.brand,footer,.toTop{display:none!important}body{padding-top:0!important}';
        d.head.appendChild(s);
        if (anchor) { var a = d.getElementById(anchor); if (a) { var det = a.closest('details'); if (det) det.open = true; setTimeout(function () { a.scrollIntoView(); }, 300); } }
      } catch (e) {}
    };
  }
  function siteImg(s) {   /* «[рисунок: подпись — img/x.png]» → картинка с сайта */
    return md(s).replace(/\[рисунок:\s*([^\]]*?)\s*—\s*(img\/[^\]\s]+)\]/g, function (_, cap, src) { return '<figure class="tk-img"><img src="' + SUBJ.arch.site + src + '" alt="' + cap + '" loading="lazy"><figcaption>' + cap + '</figcaption></figure>'; });
  }
  var SRC = { teacher_lab: 'из методички преподавателя', teacher_lecture: 'из лекции преподавателя', umkd_syllabus: 'из УМКД / силлабуса', added: 'дополнительное' };
  function siteTaskWin(t, l) {
    var solved = save()[t.id], tq = window.TRY ? { q: plainT(t.name) + '. ' + plainT(t.text).slice(0, 600) } : null;
    var full = siteImg(t.text || ''), fm = full.match(/<figure[\s\S]*?<\/figure>/), firstFig = fm ? '<div class="tk-fig1">' + fm[0] + '</div>' : '';
    /* «По шагам» — решение по строкам, открываются по одной (сначала сам, потом подглядываешь) */
    var steps = String(t.solution || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^\[рисунок/.test(x); });
    if (steps.length < 2) steps = (plainT(t.solution).match(/[^.!?]+[.!?]+/g) || []).map(function (x) { return x.trim(); });
    if (steps.length > 8) { var k = Math.ceil(steps.length / 8), g = []; for (var i = 0; i < steps.length; i += k) g.push(steps.slice(i, i + k).join('\n')); steps = g; }
    tw = makeWin('prx-task', t.name + ' · ' + (l.short || ''), '<div class="tk-scroll">' +
      '<p class="tk-src">' + (SRC[t.src] ? '<span class="src-badge ' + (t.src === 'added' ? 'add' : 'exam') + '">' + esc(SRC[t.src]) + '</span>' : '') + (t.ex ? ' <span class="src-badge add">пример из методички</span>' : '') + '</p>' +
      '<p class="tk-brief">🎯 <b>Задача:</b> ' + esc(brief(t)) + '</p>' + firstFig +
      (t.tools && t.tools.length ? '<p class="tk-tools">🧰 На стенде слева: <b>' + esc(t.tools.join(', ')) + '</b></p>' : '') +
      (tq && TRY.find(tq, 'arch').length ? '<p class="tk-tools">🧪 Проверь себя на тренажёре: <button class="w2k" data-try>' + esc(TRY.find(tq, 'arch').map(function (x) { return x.label; }).join(' · ')) + '</button></p>' : '') +
      '<details class="tk-full"><summary>📖 Подробнее — полное условие из методички</summary><div class="tk-text">' + full + '</div></details>' +
      (steps.length ? '<details class="tk-livebox"><summary>🧭 По шагам</summary><div class="tk-hints"></div></details>' : '') +
      (t.solution ? '<details class="tk-ref"><summary>📄 Эталон — решение и разбор</summary><div class="tk-sol">' + siteImg(t.solution) + '</div></details>' : '') +
      '<div class="tk-res">' + (solved ? '<p class="tk-ok">✓ Это задание ты уже сделал.</p>' : '') + '</div></div>' +
      '<div class="prx-bar"><button class="w2k primary" data-done>' + (solved ? '✓ Сделано' : '✓ Я сделал задание') + '</button><span class="grow"></span><button class="w2k" data-studio title="Свободная сборка схем">⚡ EWB-студия</button><button class="w2k" data-list>📁 К списку</button></div>', { ico: '📝', min: true });
    tw.querySelector('[data-x]').onclick = tw.querySelector('[data-list]').onclick = function () { openList(task.sid, task.li); };
    tw.querySelector('[data-done]').onclick = function () { markSolved(t, 'Задание отмечено как сделанное.'); this.textContent = '✓ Сделано'; };
    tw.querySelector('[data-studio]').onclick = function () { openSite(task.sid, 't16', 'EWB-студия'); };
    var trb = tw.querySelector('[data-try]'); if (trb) trb.onclick = function () { TRY.open(tq, 'arch'); };
    if (steps.length) hints(tw.querySelector('.tk-hints'), { steps: steps.map(function (x, i) { return (i + 1) + '. ' + x.replace(/^\d+[.)]\s*/, ''); }).join('\n') });
  }
  function openTask(sid, li, ti) {
    closeWin(); hideTask(); curSid = sid;
    var od = document.querySelector('.prx-open'); if (od) od.remove();
    var l = labs[sid][li], t = l.tasks[ti]; task = { sid: sid, li: li, ti: ti, t: t }; PR._ran = false;
    D.save.labLast = D.save.labLast || {}; D.save.labLast[sid] = t.id; try { D.persist(); } catch (e) {}
    if (SUBJ[sid].site) { openSite(sid, t.anchor, l.title); siteTaskWin(t, l); return; }
    if (t.kind === 'vcl' && t.vcl) openVcl(t); else openConsole(t);
    taskWin(t, l);
  }
  function openConsole(t) {
    var X = CPP.IDE_TEST, key = 'dgLab:' + t.id, prj = null;
    try { var sv = localStorage.getItem(key); if (sv) prj = X.prjLoad(JSON.parse(sv)); } catch (e) { prj = null; }
    /* с нуля, как в настоящей программе: пустой Builder (Project1 с Form1) — консольный проект студент создаёт сам */
    if (!prj) { prj = X.newProject('vcl', 'Project1'); task.fresh = true; }
    prj.name = prj.name || 'Project1'; prj.dgKeep = true;
    CPP.openIDE(prj);
  }
  /* живые шаги «с нуля»: проверяются сами по состоянию проекта в Builder */
  var STEPS = [
    ['con', 'Создай консольное приложение: <b>File → New → Other… → Console Wizard</b> (или <b>File → New → Console Application</b>). На вопрос «Save changes?» жми <b>No</b>.'],
    ['inc', 'Builder создал <b>Unit1.cpp</b> с пустой <code>main()</code>. Подключи библиотеки вверху: <code>#include &lt;iostream.h&gt;</code>, <code>&lt;conio.h&gt;</code>, если нужны sqrt/cos — <code>&lt;math.h&gt;</code>.'],
    ['code', 'Напиши решение внутри <code>main()</code>: объяви переменные, введи их (<code>cin &gt;&gt;</code>), посчитай, выведи (<code>cout &lt;&lt;</code>).'],
    ['run', 'Нажми <b>F9</b> (Run ▶) и проверь программу в консоли. Ошибки компиляции Builder покажет внизу.'],
    ['ok', 'Нажми <b>«✔ Проверить»</b> — игра прогонит программу на проверках из методички.']
  ];
  function stepState(t) {
    var ide = CPP.ide && CPP.ide(), prj = ide && ide.get && ide.get(); if (!prj) return {};
    var code = prj.kind === 'console' ? prj.units.map(function (u) { return u.cpp || ''; }).join('\n') : '';
    var st = { con: prj.kind === 'console' };
    st.inc = st.con && /#include\s*<iostream(\.h)?>/.test(code);
    st.code = st.inc && /\bcin\s*>>|\bcout\s*<</.test(code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''));
    st.run = st.code && !!(task.ran || PR._ran);
    st.ok = !!save()[t.id];
    return st;
  }
  function drawSteps(t) {
    var box = tw && tw.querySelector('.tk-live'); if (!box) return;
    var st = stepState(t), cur = -1;
    STEPS.forEach(function (s, i) { if (cur < 0 && !st[s[0]]) cur = i; });
    var h = STEPS.map(function (s, i) { var d = !!st[s[0]]; return '<li class="' + (d ? 'done' : i === cur ? 'cur' : '') + '"><span>' + (d ? '✓' : i + 1) + '</span><div>' + s[1] + '</div></li>'; }).join('');
    if (box.innerHTML !== h) box.innerHTML = h;
  }
  /* картинка «как должна выглядеть форма» — по эталону задания (vcl.ref) */
  function formPic(ref) {
    if (!ref || !ref.form) return '';
    var f = ref.form, W = f.Width || 320, H = f.Height || 200, sc = Math.min(1, 360 / W);
    var comp = function (c) {
      var x = c.Left || 0, y = c.Top || 0, w = c.Width, h = c.Height, cap = esc(c.Caption != null ? c.Caption : c.Text != null ? c.Text : c.Name || ''), ty = c.type;
      var st = 'left:' + x + 'px;top:' + y + 'px;' + (w ? 'width:' + w + 'px;' : '') + (h ? 'height:' + h + 'px;' : '');
      if (ty === 'TButton' || ty === 'TBitBtn') return '<div class="fp-btn" style="' + st + (w ? '' : 'width:75px;') + (h ? '' : 'height:25px;') + '">' + cap + '</div>';
      if (ty === 'TEdit') return '<div class="fp-edit" style="' + st + (w ? '' : 'width:121px;') + '">' + esc(c.Text || '') + '</div>';
      if (ty === 'TMemo' || ty === 'TListBox') return '<div class="fp-edit" style="' + st + (w ? '' : 'width:185px;') + (h ? '' : 'height:89px;') + '"></div>';
      if (ty === 'TCheckBox' || ty === 'TRadioButton') return '<div class="fp-lbl" style="' + st + '">' + (ty === 'TCheckBox' ? '☐ ' : '◯ ') + cap + '</div>';
      if (ty === 'TPanel' || ty === 'TGroupBox' || ty === 'TRadioGroup') return '<div class="fp-pan" style="' + st + (w ? '' : 'width:185px;') + (h ? '' : 'height:41px;') + '">' + cap + '</div>';
      return '<div class="fp-lbl" style="' + st + '">' + cap + '</div>';
    };
    return '<details class="tk-pic" open><summary>🖼 Как должна выглядеть форма</summary><div class="fp-wrap" style="height:' + Math.round((H + 4) * sc) + 'px"><div class="fp-form" style="width:' + W + 'px;height:' + H + 'px;transform:scale(' + sc + ')">' +
      '<div class="fp-cap">' + esc(f.Caption || 'Form1') + '<i>_</i><i>□</i><i>×</i></div><div class="fp-cl" style="height:' + (H - 22) + 'px">' + (ref.comps || []).map(comp).join('') + '</div></div></div>' +
      '<p class="fp-note">Положи компоненты примерно так же. Имена (Label1, Button1…) Builder даст сам.</p></details>';
  }
  /* оконное (VCL) задание — в большом Builder с отдельными окнами. Пустое задание начинается с File → New → Application
     (Project1 с пустой Form1), задание-продолжение — с формой из методички. Проверка — та же, что на сайте (CPP.vclRunCheck). */
  function ensureVclCheck() {
    if (CPP.vclRunCheck) return;
    var d = el('<div style="display:none"><div class="vclw" data-id="dg-init"><script type="application/json" data-role="vcl">{"form":{"Caption":"Form1","Width":200,"Height":120},"comps":[],"code":"","checks":[]}</script></div></div>');
    document.body.appendChild(d); try { CPP.initVcl(d); } catch (e) {} d.remove();
  }
  function openVcl(t) {
    var X = CPP.IDE_TEST, key = 'dgLab:' + t.id, prj = null, c = t.vcl || {};
    try { var sv = localStorage.getItem(key); if (sv) prj = X.prjLoad(JSON.parse(sv)); } catch (e) { prj = null; }
    if (!prj) {
      prj = X.newProject('vcl', 'Project1');
      if ((c.comps && c.comps.length) || c.code) {
        var p = new CPP.VCL.Project({ formName: 'Form1', unitName: 'Unit1', form: Object.assign({}, c.form || {}, { Visible: false }), comps: c.comps || [], code: c.code || '' });
        prj.forms = [p]; prj.auto = ['Form1']; prj.main = 'Form1';
      }
      task.fresh = true;
    }
    prj.dgKeep = true; CPP.openIDE(prj); ensureVclCheck();
  }
  function mainForm() { var ide = CPP.ide && CPP.ide(), prj = ide && ide.get && ide.get(); if (!prj || prj.kind === 'console') return null; return prj.forms.find(function (p) { return p.fn === prj.main; }) || prj.forms[0]; }
  /* шаги обучалки из методички (vcl.steps) или общие: компоненты → обработчики → F9 → Проверить */
  function vclSteps(t) {
    var c = t.vcl || {}, ref = c.ref || {};
    if (c.steps && c.steps.length) return c.steps.map(function (s) { return { t: s.t, c: s.c || {} }; });
    var types = []; (ref.comps || []).forEach(function (x) { if (types.indexOf(x.type) < 0) types.push(x.type); });
    var hs = []; String(ref.code || '').replace(/TForm1::(\w+)\s*\(/g, function (_, n) { if (hs.indexOf(n) < 0 && !/^TForm1$/.test(n)) hs.push(n); });
    var out = [];
    types.forEach(function (ty) { var n = (ref.comps || []).filter(function (x) { return x.type === ty; }).length; out.push({ t: 'Положи на форму <b>' + ty.slice(1) + '</b>' + (n > 1 ? ' × ' + n : '') + ' (палитра, вкладка ' + ((CPP.VCL.COMP[ty] || {}).tab || 'Standard') + ').', c: { comp: ty, count: n } }); });
    hs.forEach(function (h) { out.push({ t: 'Создай обработчик <code>' + h + '</code>: выдели компонент и дважды щёлкни по нему (или по событию в Object Inspector → Events), напиши код.', c: { handler: h } }); });
    out.push({ t: 'Нажми <b>F9</b> (Run ▶) — проверь окно программы.', c: { run: 1 } });
    if (c.checks && c.checks.length) out.push({ t: 'Нажми <b>«✔ Проверить»</b>.', c: { check: -1 } });
    return out;
  }
  function vclStepOk(c, p, t) {
    if (!p) return false;
    try {
      if (c.comp) return p.comps.filter(function (x) { return x.vcl === c.comp; }).length >= (c.count || 1);
      if (c.prop) { var o = p.find(c.prop[0]); if (!o) return false; var w = c.prop[2], k = c.prop[1];
        if (k === 'Font.Size') return o.p.Font.p.Size == w; if (k === 'Font.Color') return CPP.VCL.colorName(o.p.Font.p.Color) === w;
        return typeof w === 'string' && /^cl/.test(w) ? CPP.VCL.colorName(o.p[k]) === w : String(o.p[k]) === String(w); }
      if (c.handler) return p.handlers().some(function (h) { return h.name === c.handler; });
      if (c.code) return new RegExp(c.code).test(p.code);
      if (c.run) return !!(task.ran || PR._ran);
      if (c.check != null) { var chs = (t.vcl || {}).checks || []; if (c.check < 0) return !!save()[t.id]; return CPP.vclRunCheck && chs[c.check] ? CPP.vclRunCheck(p, chs[c.check]).length === 0 : false; }
    } catch (e) { return false; }
    return false;
  }
  function drawVclSteps(t) {
    var box = tw && tw.querySelector('.tk-live'); if (!box) return;
    var p = mainForm(), steps = vclSteps(t), cur = -1, h = '';
    if (!p) { h = '<li class="cur"><span>1</span><div>Создай оконное приложение: <b>File → New → Application</b>.</div></li>'; }
    else steps.forEach(function (s, i) { var d = vclStepOk(s.c, p, t); if (!d && cur < 0) cur = i; h += '<li class="' + (d ? 'done' : i === cur ? 'cur' : '') + '"><span>' + (d ? '✓' : i + 1) + '</span><div>' + s.t + '</div></li>'; });
    if (box.innerHTML !== h) box.innerHTML = h;
  }
  function checkVcl() {
    var t = task.t, res = tw.querySelector('.tk-res'), p = mainForm(), chs = (t.vcl || {}).checks || [];
    try { var ide = CPP.ide(); localStorage.setItem('dgLab:' + t.id, JSON.stringify(CPP.IDE_TEST.prjJSON(ide.get()))); } catch (e) {}
    task.ran = true;
    if (!p) { res.innerHTML = '<p class="tk-bad">Сначала создай оконное приложение: File → New → Application.</p>'; return; }
    if (!chs.length) { res.innerHTML = '<p class="tk-warn">У этого задания нет автопроверки — сравни с картинкой и эталоном.</p><button class="w2k" data-self>✓ Решил сам</button>'; res.querySelector('[data-self]').onclick = function () { markSolved(t, 'Отмечено как решённое.'); }; return; }
    var all = true, rows = chs.map(function (ch) {
      var bad;
      try { bad = CPP.vclRunCheck(p, ch); } catch (e) { bad = [e.vclAsk ? 'программа ждёт ответа в диалоге' : 'ошибка: ' + (e.message || e)]; }
      if (bad.length) all = false;
      return '<div class="tk-t ' + (bad.length ? 'bad' : 'ok') + '"><b>' + (bad.length ? '✗ ' : '✓ ') + esc(ch.name) + '</b>' + (bad.length ? '<span>' + bad.map(esc).join('<br>') + '</span>' : '') + '</div>';
    }).join('');
    res.innerHTML = (all ? '<p class="tk-ok">✓ Работает как в задании!</p>' : '<p class="tk-bad">Пока не всё работает.</p>') + rows;
    if (all) markSolved(t, 'Форма работает как надо — задание решено!');
  }
  /* подсказки по одной: «💡 Подсказка 1 из N» → «Ещё подсказка», без спешки и без штрафа */
  function hintList(t) {
    var src = String(t.steps || '').trim(); if (!src) return [];
    var parts = src.split(/\n(?=\s*\d+[.)]\s)/).map(function (x) { return x.trim(); }).filter(Boolean);
    return parts.length > 1 ? parts : src.split(/\n{2,}/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function hints(box, t) {
    var list = hintList(t), k = 0; if (!box) return;
    if (!list.length) { box.innerHTML = '<p class="tk-mini">Подсказок нет — если застрял, загляни в эталон ниже.</p>'; return; }
    var draw = function () {
      box.innerHTML = list.slice(0, k).map(function (h, i) { return '<div class="tk-hint"><b>💡 ' + (i + 1) + '.</b> ' + md(h.replace(/^\d+[.)]\s*/, '')) + '</div>'; }).join('') +
        (k < list.length ? '<button class="w2k" data-hint>💡 ' + (k ? 'Ещё подсказка' : 'Подсказка') + ' (' + (k + 1) + ' из ' + list.length + ')</button>' : '<p class="tk-mini">Это все подсказки. Не выходит — открой эталон, разберись и напиши сам.</p>');
      var b = box.querySelector('[data-hint]'); if (b) b.onclick = function () { k++; draw(); };
    };
    draw();
  }
  /* черновик сохраняется сам каждые несколько секунд — можно выйти и вернуться */
  function autosave() {
    if (!task || !window.CPP || !CPP.ide) return; var ide = CPP.ide(), prj = ide && ide.get && ide.get(); if (!prj || prj.kind !== 'console') return;
    try { var j = JSON.stringify(CPP.IDE_TEST.prjJSON(prj)); if (j !== task.saved) { localStorage.setItem('dgLab:' + task.t.id, j); task.saved = j; } } catch (e) {}
  }
  /* «Пример работы»: эталон запускается на первом тесте — видно и ввод, и вывод, как в консоли */
  function sampleOut(t) {
    if (!t.ref || !window.CPP || !CPP.run) return '';
    var ts = (t.tests || [])[0] || { input: '' }, r;
    try { r = CPP.run(t.ref, { input: ts.input || '', maxSteps: 2000000 }); } catch (e) { return ''; }
    var scr = (r.screen || []).map(function (row) { var x = row.slice(); while (x.length && x[x.length - 1].c === ' ') x.pop(); return x; });
    while (scr.length && !scr[scr.length - 1].length) scr.pop();
    if (!scr.length) return '';
    return '<div class="tk-sample"><div class="tk-sample-t">C:\\Projects\\Project1.exe — пример работы' + (ts.input ? ' (ввод: ' + esc(String(ts.input).replace(/\n/g, ' ')) + ')' : '') + '</div><div class="con tk-con">' + CPP.screenHTML(scr.slice(0, 40)) + '</div></div>';
  }
  /* эталон: оконное и ООП — вставляется в Builder (твой вариант сохраняется, его можно вернуть); обычный код — показывается целиком */
  function refProject(t) {
    var X = CPP.IDE_TEST, p;
    if (t.kind === 'vcl') {
      var r = (t.vcl && t.vcl.ref) || {}; p = X.newProject('vcl', 'Project1');
      var f = new CPP.VCL.Project({ formName: 'Form1', unitName: 'Unit1', form: Object.assign({}, r.form || {}, { Visible: false }), comps: r.comps || [], code: r.code || '' });
      p.forms = [f]; p.auto = ['Form1']; p.main = 'Form1';
    } else { p = X.newProject('console', 'Project1'); p.units[0].cpp = t.ref; }
    p.dgKeep = true; return p;
  }
  function refBox(t, vcl, oop) {
    var d = tw.querySelector('.tk-ref'), box = tw.querySelector('.tk-refbox'), code = t.ref || (t.vcl && t.vcl.ref ? t.vcl.ref.code : '') || t.unit || '';
    var mineKey = 'dgLab:' + t.id + ':mine';
    var insert = function () {
      var ide = CPP.ide && CPP.ide(), cur = ide && ide.get && ide.get();
      try { if (cur) localStorage.setItem(mineKey, JSON.stringify(CPP.IDE_TEST.prjJSON(cur))); } catch (e) {}
      var rp = refProject(t); CPP.openIDE(rp); if (vcl) ensureVclCheck();
      if (task) task.refPrj = rp;
      draw(true);
    };
    var draw = function (done) {
      var has = (function () { try { return !!localStorage.getItem(mineKey); } catch (e) { return false; } })();
      box.innerHTML = (done ? '<p class="tk-ok">✓ Эталон вставлен в Builder' + (vcl ? ': форма и код Unit1.cpp. Нажми F9 и посмотри, как работает; двойной щелчок по кнопке покажет её обработчик.' : '. Нажми F9 и разбери, как он устроен.') + '</p>' : '') +
        '<pre class="tk-code cpp-code">' + (CPP.highlight ? CPP.highlight(code.replace(/\s+$/, '')) : esc(code)) + '</pre>' +
        '<p>' + (done ? '' : '<button class="w2k" data-ins>⤵ Вставить эталон в Builder</button> ') + (has && done ? '<button class="w2k" data-mine>↩ Вернуть мой вариант</button>' : '') + '</p>';
      var a = box.querySelector('[data-ins]'); if (a) a.onclick = insert;
      var b = box.querySelector('[data-mine]'); if (b) b.onclick = function () { try { var j = localStorage.getItem(mineKey); if (j) { var p = CPP.IDE_TEST.prjLoad(JSON.parse(j)); p.dgKeep = true; CPP.openIDE(p); if (vcl) ensureVclCheck(); } } catch (e) {} draw(false); };
    };
    draw(false);
    d.addEventListener('toggle', function () { if (d.open && (vcl || oop) && !d._ins) { d._ins = 1; insert(); } });
  }
  function taskWin(t, l) {
    var tests = t.tests || [];
    var oop = t.kind !== 'vcl' && /\bclass\s+\w+/.test(t.ref || ''), vcl = t.kind === 'vcl';
    /* порядок: коротко + картинка/пример → подробнее → по шагам → эталон (всё, кроме главного, свёрнуто) */
    tw = makeWin('prx-task', t.name + ' · ' + (l.short || ''), '<div class="tk-scroll"><p class="tk-brief">🎯 <b>Задача:</b> ' + esc(brief(t)) + '</p>' +
      (vcl ? formPic(t.vcl && t.vcl.ref) : sampleOut(t)) +
      '<details class="tk-full"><summary>📖 Подробнее — полное условие из методички</summary><div class="tk-text">' + md(t.text || t.title || '') + '</div>' +
        (t.note ? '<p class="tk-note">⚠ ' + md(t.note) + '</p>' : '') + '</details>' +
      '<details class="tk-livebox"><summary>🧭 По шагам</summary><p class="tk-mini">' + (vcl ? 'Как в настоящем Builder — шаги отмечаются сами:' : 'С нуля, как в настоящем Builder — шаги отмечаются сами:') + '</p><ol class="tk-live"></ol>' +
        (vcl ? '' : '<p class="tk-skip">Уже умеешь? <a href="#" data-auto>Создать консольный проект за меня</a></p>') +
        '<p class="tk-mini"><b>Как решать:</b></p><div class="tk-hints"></div></details>' +
      '<details class="tk-ref"><summary>📄 Эталон' + (vcl ? ' — откроется готовая форма в Builder' : oop ? ' — код вставится в Builder' : ' — готовый код') + '</summary><div class="tk-refbox"></div></details>' +
      '<div class="tk-res" aria-live="polite"></div></div>' +
      '<div class="prx-bar">' + (t.kind === 'vcl' ? '<button class="w2k primary" data-checkv>✔ Проверить' + ((t.vcl && t.vcl.checks || []).length ? ' (' + t.vcl.checks.length + ')' : '') + '</button><span class="grow"></span>' : '<button class="w2k primary" data-check>✔ Проверить' + (tests.length ? ' (' + tests.length + ')' : '') + '</button><span class="grow"></span>') +
      '<button class="w2k" data-list>📁 К списку</button></div>', { ico: '📝', min: true });
    hints(tw.querySelector('.tk-hints'), t);
    refBox(t, vcl, oop);
    tw.querySelector('[data-x]').onclick = function () { openList(task.sid, task.li); };
    tw.querySelector('[data-list]').onclick = function () { openList(task.sid, task.li); };
    var ck = tw.querySelector('[data-check]'); if (ck) ck.onclick = check;
    var au = tw.querySelector('[data-auto]'); if (au) au.onclick = function (e) {
      e.preventDefault(); var p = CPP.IDE_TEST.newProject('console', 'Project1'); p.units[0].cpp = startCode(t); p.dgKeep = true; CPP.openIDE(p); drawSteps(t);
    };
    var cv = tw.querySelector('[data-checkv]'); if (cv) cv.onclick = checkVcl;
    if (t.kind === 'vcl') { clearInterval(PR.stepT); PR.stepT = setInterval(function () { if (!tw || !task || task.t !== t) { clearInterval(PR.stepT); return; } drawVclSteps(t); }, 900); drawVclSteps(t); }
    if (t.kind !== 'vcl') { clearInterval(PR.stepT); var tk = 0; PR.stepT = setInterval(function () { if (!tw || !task || task.t !== t) { clearInterval(PR.stepT); return; } drawSteps(t); if (++tk % 6 === 0) autosave(); }, 700); drawSteps(t); }
    if (save()[t.id]) tw.querySelector('.tk-res').innerHTML = '<p class="tk-ok">✓ Это задание ты уже решал.</p>';
  }
  function userCode() {
    var ide = CPP.ide && CPP.ide(); if (!ide) return '';
    var prj = ide.get(); try { localStorage.setItem('dgLab:' + task.t.id, JSON.stringify(CPP.IDE_TEST.prjJSON(prj))); } catch (e) {}
    return prj.units.map(function (u) { return u.cpp; }).join('\n');
  }
  function check() {
    var t = task.t, tests = t.tests || [], code = userCode(), res = tw.querySelector('.tk-res'), mode = t.cmp || 'exact';
    var kp = CPP.ide().get(); if (kp && kp.kind !== 'console') { res.innerHTML = '<p class="tk-bad">Сначала создай консольное приложение: File → New → Console Application (шаг 1).</p>'; return; }
    task.ran = true;
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
    res.innerHTML = (all ? '<p class="tk-ok">✓ Все проверки пройдены!</p>' : '<p class="tk-bad">Почти! Ничего страшного — сравни «Должно быть» и «У тебя», поправь и проверь ещё раз. Черновик сохранён.</p>') + h;
    if (all) markSolved(t, 'Все проверки пройдены — задание решено!');
  }
  function markSolved(t, msg) {
    var ide0 = window.CPP && CPP.ide && CPP.ide(); if (task && task.t === t && task.refPrj && ide0 && ide0.get && ide0.get() === task.refPrj) {   /* в Builder сейчас эталон — не засчитываем */
      var rr = tw && tw.querySelector('.tk-res'); if (rr) rr.insertAdjacentHTML('afterbegin', '<p class="tk-warn">Это эталон — он работает. В прогресс не идёт: верни свой вариант (📄 Эталон → ↩) или собери заново сам и проверь.</p>');
      return;
    }
    var s = save(); if (s[t.id]) return; s[t.id] = 1; D.persist();
    if (window.DGame && DGame.toast) DGame.toast('💻 ' + msg); else if (typeof window.toast === 'function') window.toast(msg);
    var r = tw && tw.querySelector('.tk-res'); if (r && !/tk-ok/.test(r.innerHTML)) r.insertAdjacentHTML('afterbegin', '<p class="tk-ok">✓ ' + esc(msg) + '</p>');
    try { if (window.DA && DA.sfx) DA.sfx('ok'); } catch (e) {}
  }
  function exit() {
    hideTask(); closeWin(); leaveRoom(); PR.active = false; task = null;
    if (window.DGame && DGame.lib) DGame.lib();
  }
  document.addEventListener('bcb-hide', function () { if (PR.active && !vclBox) openList(curSid, task ? task.li : undefined); });

  PR.open = function (sid) { if (!SUBJ[sid] || PR.active) return; if (curSid !== sid) view = { only: false, q: '' }; curSid = sid; enterRoom(sid, function () { if (room) room.classList.add('desk'); openList(sid); }); };
})();
/* запуск программы (F9 или ▶ Run) в Builder — для шага «Нажми F9» */
(function () {
  var mark = function () { if (window.PR && PR.active) { PR._ran = true; } };
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.bcbx [data-a="run"]')) mark(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'F9') mark(); }, true);
})();
