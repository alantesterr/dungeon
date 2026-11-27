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
  /* интерпретатор + мини-Builder сайта (для «🧪 Попробовать» в вопросах про формы) */
  PR.loadVcl = function () { return PR.loadCpp().then(function () { return loadScript('js/cpp/vcl.js'); }).then(function () { return loadScript('js/cpp/vcl-ui.js'); }); };
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
  /* ---------- 🕯 ПОДВАЛ БИБЛИОТЕКИ (v111): спускаешься по лестнице; стол с компьютером, полка «книги прогресса» —
     по книге на каждую тему лаб (корешок заполняется по мере решения, золотой — тема решена вся).
     Нажми на книгу — сядешь за компьютер сразу в этой теме; на компьютер — к списку; «⬆ Наверх» — обратно в библиотеку. ---------- */
  var BOOKC = { cpp: ['#1D9E75', '#3a7ca5', '#EF9F27', '#97C459', '#5DCAA5', '#c0392b', '#8e44ad', '#2f8f8a'], arch: ['#85B7EB', '#AFA9EC', '#3C3489', '#5a7bd0', '#e0a040', '#7f8c8d', '#c0392b', '#2e86c1'] };
  function bookRects(n) { var out = [], per = 8; for (var i = 0; i < n; i++) { var r = Math.floor(i / per), k = i % per; out.push({ x: 474 + k * 18, y: r ? 150 : 82, w: 14, h: 44 }); } return out; }
  function topicProg(sid) {
    var L = labs[sid] || [], s = save();
    return byTopic(sid).map(function (g) { var d = 0, n = 0; g.labs.forEach(function (li) { L[li].tasks.forEach(function (t) { n++; if (s[t.id]) d++; }); }); return { n: g.n, d: d, tot: n, title: topicTitle(sid, g.n) }; });
  }
  function drawRoom(c, t, hx, sit, on, B) {
    var W = 640, H = 360; c.imageSmoothingEnabled = false; B = B || {};
    /* каменные стены подвала */
    c.fillStyle = '#16131c'; c.fillRect(0, 0, W, H);
    for (var y = 0; y < 250; y += 18) for (var x = (y / 18) % 2 ? -20 : 0; x < W; x += 40) { var sh = ((x * 7 + y * 13) % 5); c.fillStyle = ['#2a2630', '#2e2935', '#26222c', '#312b38', '#2b2731'][sh]; c.fillRect(x + 1, y + 1, 38, 16); }
    c.fillStyle = 'rgba(80,140,90,.18)'; [[40, 30], [230, 12], [560, 40], [400, 220]].forEach(function (m) { c.fillRect(m[0], m[1], 22, 5); c.fillRect(m[0] + 4, m[1] + 5, 10, 4); });   /* мох */
    /* балки потолка */
    c.fillStyle = '#3b2a1e'; c.fillRect(0, 0, W, 12); [150, 330, 520].forEach(function (bx) { c.fillRect(bx, 0, 14, 30); c.fillStyle = '#2c1f16'; c.fillRect(bx, 26, 14, 4); c.fillStyle = '#3b2a1e'; });
    /* пол — плиты */
    c.fillStyle = '#2b2620'; c.fillRect(0, 250, W, 110); for (var i = 0; i < W; i += 48) { c.fillStyle = '#231f1a'; c.fillRect(i, 250, 2, 110); } c.fillStyle = '#231f1a'; c.fillRect(0, 300, W, 2);
    c.fillStyle = '#3a3128'; c.fillRect(0, 248, W, 4);
    /* лестница наверх (в библиотеку) — слева */
    for (var k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#4a3a2a' : '#54432f'; c.fillRect(0, 250 - k * 17 - 10, 120 - k * 13, 10); c.fillStyle = '#2f2419'; c.fillRect(0, 250 - k * 17, 120 - k * 13, 7); }
    c.fillStyle = 'rgba(255,220,140,' + (0.10 + 0.04 * Math.sin(t / 400)) + ')'; c.beginPath(); c.moveTo(0, 0); c.lineTo(70, 0); c.lineTo(20, 120); c.lineTo(0, 120); c.fill();   /* свет сверху из люка */
    if (B.hv === 'up') { c.strokeStyle = '#FAC775'; c.lineWidth = 2; c.strokeRect(2, 120, 116, 130); }
    /* факелы */
    [200, 440].forEach(function (fx, n) { var fl = Math.sin(t / 70 + n) + Math.sin(t / 23 + n * 2) * 0.5;
      c.fillStyle = '#4a3526'; c.fillRect(fx, 74, 6, 22); c.fillStyle = '#ff9a3a'; c.fillRect(fx - 2, 62 - fl, 10, 12); c.fillStyle = '#ffe07a'; c.fillRect(fx, 66 - fl, 6, 7);
      var g = c.createRadialGradient(fx + 3, 70, 4, fx + 3, 70, 110); g.addColorStop(0, 'rgba(255,170,80,.20)'); g.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g; c.fillRect(fx - 110, 0, 220, 260); });
    /* полка «книги прогресса» */
    var tp = B.prog || [], rs = bookRects(tp.length), cols = BOOKC[B.sid] || BOOKC.cpp;
    c.fillStyle = '#4a3526'; c.fillRect(466, 126, 152, 6); c.fillRect(466, 194, 152, 6); c.fillStyle = '#5a4630'; c.fillRect(462, 60, 6, 142); c.fillRect(616, 60, 6, 142);
    c.fillStyle = '#e8d6a8'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText('КНИГИ ПРОГРЕССА', 542, 56);
    tp.forEach(function (b, i) {
      var r = rs[i], pct = b.tot ? b.d / b.tot : 0, gold = b.tot && b.d >= b.tot, col = gold ? '#e8b84a' : cols[i % cols.length], lift = B.hv === i ? 6 : 0;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(r.x + 2, r.y + 2, r.w, r.h);
      c.fillStyle = pct ? col : '#4b4552'; c.globalAlpha = pct ? 1 : 0.75; c.fillRect(r.x, r.y - lift, r.w, r.h); c.globalAlpha = 1;
      /* «налитая» часть корешка = доля решённых */
      c.fillStyle = 'rgba(0,0,0,.38)'; c.fillRect(r.x + 2, r.y - lift + 4, r.w - 4, Math.round((r.h - 8) * (1 - pct)));
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(r.x + 1, r.y - lift, 2, r.h);
      c.fillStyle = gold ? '#fff3c4' : '#f2ead8'; c.font = 'bold 8px monospace'; c.fillText(String(b.n), r.x + r.w / 2, r.y - lift + r.h - 3);
      if (gold) { var sp = (t / 600 + i) % 1; c.fillStyle = 'rgba(255,240,180,' + (1 - sp).toFixed(2) + ')'; c.fillRect(r.x + 4, r.y - lift - 4 - sp * 10, 2, 2); }
      if (B.hv === i) { c.strokeStyle = '#FAC775'; c.lineWidth = 2; c.strokeRect(r.x - 1, r.y - lift - 1, r.w + 2, r.h + 2); }
    });
    if (!tp.length) { c.fillStyle = '#8a8496'; c.font = '10px monospace'; c.fillText('загружаю…', 542, 110); }
    /* стол */
    c.fillStyle = '#6b4a2f'; c.fillRect(250, 200, 250, 12); c.fillStyle = '#553a24'; c.fillRect(262, 212, 10, 50); c.fillRect(478, 212, 10, 50);
    c.fillStyle = '#d8d2c0'; c.fillRect(436, 212, 40, 50); c.fillStyle = '#b9b29c'; c.fillRect(441, 220, 30, 5); c.fillRect(441, 229, 30, 5); c.fillStyle = on || B.hv === 'pc' ? '#3ce36b' : '#2b4a2f'; c.fillRect(466, 252, 5, 4);
    c.fillStyle = '#d8d2c0'; c.fillRect(300, 110, 120, 92); c.fillStyle = '#b9b29c'; c.fillRect(340, 200, 40, 6); c.fillRect(325, 196, 70, 5);
    c.fillStyle = on ? '#3a6ea5' : '#101418'; c.fillRect(310, 120, 100, 70);
    if (on) {
      c.fillStyle = '#d4d0c8'; c.fillRect(316, 126, 88, 58); c.fillStyle = '#0a246a'; c.fillRect(316, 126, 88, 8);
      c.fillStyle = '#fff'; c.fillRect(320, 138, 50, 42); c.fillStyle = '#000080'; for (var q = 0; q < 6; q++) c.fillRect(323, 141 + q * 6, 14 + (q * 13) % 30, 2);
      c.fillStyle = 'rgba(160,200,255,' + (0.12 + 0.08 * Math.sin(t / 90)) + ')'; c.fillRect(310, 120, 100, 70);
    } else { c.fillStyle = 'rgba(60,227,107,' + (0.35 + 0.35 * Math.sin(t / 300)) + ')'; c.fillRect(314, 182, 4, 3); }   /* курсор ждёт */
    if (B.hv === 'pc') { c.strokeStyle = '#FAC775'; c.lineWidth = 2; c.strokeRect(296, 106, 128, 102); }
    c.fillStyle = '#cfc8b4'; c.fillRect(318, 204, 84, 6); c.fillStyle = '#e8d38a'; c.fillRect(262, 160, 8, 40); c.beginPath(); c.moveTo(250, 160); c.lineTo(282, 160); c.lineTo(272, 146); c.lineTo(260, 146); c.fill();
    c.fillStyle = 'rgba(255,220,120,.08)'; c.beginPath(); c.moveTo(250, 160); c.lineTo(282, 160); c.lineTo(324, 250); c.lineTo(208, 250); c.fill();
    /* кружка с чаем — пар */
    c.fillStyle = '#c94f3d'; c.fillRect(425, 190, 9, 10); c.fillStyle = 'rgba(230,230,240,.35)'; for (var v = 0; v < 3; v++) { var ph = (t / 900 + v / 3) % 1; c.fillRect(428 + Math.sin(ph * 6 + v) * 2, 186 - ph * 16, 2, 3); }
    /* стул */
    c.fillStyle = '#2d3e50'; c.fillRect(236, 222, 46, 8); c.fillRect(232, 176, 10, 52); c.fillStyle = '#1f2b38'; c.fillRect(256, 230, 6, 22); c.fillRect(242, 248, 34, 4);
    if (A && A.drawHero) {
      if (sit) A.drawHero(c, 'idle', Math.floor(t / 450), 266, 232, 1.6);
      else if (B.hy != null) A.drawHero(c, 'walk', Math.floor(t / 110), hx, B.hy, 1.6);
      else A.drawHero(c, B.walk ? 'walk' : 'idle', Math.floor(t / (B.walk ? 110 : 450)), hx, 252, 1.6);
    }
  }
  /* sid — предмет; topic — сразу сесть в этой теме (книга); back — вернулись из-за компьютера */
  function enterRoom(sid, done, back) {
    PR.active = true; leaveRoom();
    room = el('<div class="prx-room" role="dialog" aria-label="Подвал библиотеки: лабораторные"><canvas width="640" height="360"></canvas>' +
      '<div class="prx-cap"><b>🕯 Подвал · ' + (sid === 'arch' ? 'лабы Архитектуры' : 'лабы C++') + '</b><span>спускаюсь…</span><button class="btn primary sm" data-pc>💻 За компьютер</button><button class="btn ghost sm" data-up>⬆ Наверх</button></div><div class="prx-flash"></div></div>');
    document.body.appendChild(room);
    var cv = room.querySelector('canvas'), c = cv.getContext('2d'), t0 = performance.now(), ready = false, finished = false, cap = room.querySelector('.prx-cap span');
    var B = { sid: sid, prog: [], hv: null }, mode = back ? 'idle' : 'down', hx = back ? 266 : 10, tSit = 0, wantTopic = null, myRoom = room;
    var dataP = load(sid).then(function () { ready = true; B.prog = topicProg(sid); idleCap(); }, function (e) { ready = 'err'; cap.textContent = 'Ошибка загрузки: ' + e.message; });
    var idleCap = function () { if (mode !== 'idle' || !ready) return; var d = 0, n = 0; B.prog.forEach(function (b) { d += b.d; n += b.tot; }); cap.innerHTML = 'Решено <b>' + d + ' из ' + n + '</b>. 📗 Книга — задания темы · 💻 компьютер — с чистого листа.'; };
    var sitDown = function (want) { if (mode === 'sit' || mode === 'go') return; var bp = room.querySelector('.bm-pop'); if (bp) bp.remove(); wantTopic = want; mode = 'go'; B.walk = true; cap.textContent = 'иду к компьютеру…'; };
    var finish = function () { if (finished) return; finished = true; var go = function () { done(wantTopic); }; if (ready === true) go(); else dataP.then(function () { if (ready === true) go(); }); };
    /* книга темы: задания этой темы прямо в подвале — выбрал, и сразу садишься за это задание */
    var bookPop = function (n) {
      var old = room.querySelector('.bm-pop'); if (old) old.remove();
      var L = labs[sid] || [], s0 = save(), g = byTopic(sid).filter(function (x) { return x.n === n; })[0]; if (!g) return;
      var items = []; g.labs.forEach(function (li) { L[li].tasks.forEach(function (t, ti) { items.push({ li: li, ti: ti, t: t, l: L[li] }); }); });
      var d = 0; items.forEach(function (x) { if (s0[x.t.id]) d++; });
      var pop = el('<div class="bm-pop" role="dialog" aria-label="Задания темы"><div class="bm-h"><b>📗 Тема ' + n + '</b><span>' + esc(topicTitle(sid, n)) + '</span><em>' + d + ' из ' + items.length + '</em><button class="bm-x" title="Закрыть">×</button></div>' +
        '<div class="bm-list">' + items.map(function (x, i) { return '<button class="bm-it' + (s0[x.t.id] ? ' ok' : '') + '" data-i="' + i + '"><b>' + (s0[x.t.id] ? '✅ ' : x.t.kind === 'vcl' ? '🗔 ' : '📄 ') + esc(x.t.name || 'Задание') + ' <small>' + esc(x.l.short || '') + '</small></b><span>' + esc(brief(x.t)) + '</span></button>'; }).join('') + '</div>' +
        '<div class="bm-f"><button class="btn ghost sm" data-rnd>🎲 Случайное нерешённое</button></div></div>');
      room.appendChild(pop);
      pop.querySelector('.bm-x').onclick = function () { pop.remove(); };
      pop.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { var x = items[+b.getAttribute('data-i')]; sitDown({ li: x.li, ti: x.ti }); }; });
      pop.querySelector('[data-rnd]').onclick = function () { var x = randomTask(sid, n); if (x) sitDown({ li: x.li, ti: x.ti }); };
    };
    room.querySelector('[data-pc]').onclick = function () { if (mode === 'sit') { finish(); return; } sitDown(null); };
    room.querySelector('[data-up]').onclick = function () { leaveRoom(); PR.active = false; task = null; if (window.DGame && DGame.lib) DGame.lib(); };
    var pt = function (e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 640, y: (e.clientY - r.top) / r.height * 360 }; };
    var hit = function (p) {
      var rs = bookRects(B.prog.length); for (var i = 0; i < rs.length; i++) if (p.x >= rs[i].x - 2 && p.x <= rs[i].x + rs[i].w + 2 && p.y >= rs[i].y - 8 && p.y <= rs[i].y + rs[i].h) return i;
      if (p.x >= 296 && p.x <= 480 && p.y >= 106 && p.y <= 262) return 'pc';
      if (p.x < 120 && p.y > 110 && p.y < 252) return 'up';
      return null;
    };
    cv.addEventListener('mousemove', function (e) { if (mode !== 'idle') return; var h = hit(pt(e)); B.hv = h; cv.style.cursor = h != null ? 'pointer' : '';
      if (typeof h === 'number') { var b = B.prog[h]; cap.innerHTML = '📗 <b>Тема ' + b.n + '</b> · ' + esc(b.title || '') + ' — решено <b>' + b.d + ' из ' + b.tot + '</b>' + (b.d >= b.tot && b.tot ? ' ✨' : '') + ' · нажми — выбрать задание'; }
      else if (h === 'pc') cap.textContent = sid === 'arch' ? '💻 Включить компьютер — EWB, ассемблер, задачи' : '💻 Сесть за компьютер — чистый C++Builder'; else if (h === 'up') cap.textContent = '⬆ Подняться в библиотеку'; else idleCap(); });
    cv.addEventListener('click', function (e) { if (mode !== 'idle') { if (mode === 'down') { mode = 'idle'; hx = 120; idleCap(); } return; } var h = hit(pt(e)); if (typeof h === 'number') bookPop(B.prog[h].n); else if (h === 'pc') sitDown(null); else if (h === 'up') room.querySelector('[data-up]').click(); });
    var last = t0;
    (function frame(now) {
      if (room !== myRoom || !room) return;
      var t = now - t0, dt = Math.min(50, now - last); last = now;
      if (mode === 'down') { var k = Math.min(1, t / 1400); hx = 10 + k * 100; B.hy = 120 + k * 132; B.walk = true; if (k >= 1) { mode = 'idle'; B.hy = null; B.walk = false; hx = 120; idleCap(); } }
      else if (mode === 'go') { hx += dt * 0.2 * (hx < 266 ? 1 : -1); if (Math.abs(hx - 266) < 4) { hx = 266; mode = 'sit'; B.walk = false; tSit = t; B.hv = null; } }
      var sit = mode === 'sit', on = sit && t - tSit > 350;
      drawRoom(c, t, hx, sit, on, B);
      if (sit) {
        if (t - tSit > 350 && t - tSit < 900) cap.textContent = 'включаю ' + SUBJ[sid].title + '…';
        if (t - tSit > 900) { var z = Math.min(1, (t - tSit - 900) / 900), s = 1 + z * z * 5.2; cv.style.transformOrigin = '56% 43%'; cv.style.transform = 'scale(' + s + ')'; room.querySelector('.prx-flash').style.opacity = Math.max(0, (z - .55) / .45); }
        if (t - tSit > 1850) { finish(); if (ready === true) return; }
      }
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
      (SUBJ[sid].site ? '<button class="w2k" data-asm title="Ассемблер x86 по шагам — как онлайн-компилятор MASM">⚙ ASM-студия</button>' : '') +
      '<label class="pk-chk"><input type="checkbox" data-only' + (view.only ? ' checked' : '') + '> только нерешённые</label>' +
      '<input class="pk-find" data-find placeholder="🔍 Найти: массив, switch, кнопка…" value="' + esc(view.q) + '"></div>' +
      '<div class="lb-wrap"><div class="lb-tree pk-tree">' + tree + '</div><div class="lb-right"></div></div>' +
      '<div class="prx-bar"><span class="pk-all">Решено ' + done + ' из ' + all.length + bar(done, all.length) + '</span><span class="grow"></span><button class="w2k" data-exit>🚪 Встать из-за компьютера</button></div>', { ico: '📁' });
    win.querySelector('[data-x]').onclick = exit; win.querySelector('[data-exit]').onclick = exit;
    win.querySelector('[data-free]').onclick = function () { openFree(sid); };
    var ab = win.querySelector('[data-asm]'); if (ab) ab.onclick = function () { asmFree(sid); };
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
  var hiding = false;
  function hideTask() { hiding = true; try { hideTask0(); } finally { hiding = false; } }
  function hideTask0() { if (window.ASM) ASM.close(); if (pb) { pb.remove(); pb = null; } if (pkw) { pkw.remove(); pkw = null; } if (tw) { tw.remove(); tw = null; } if (vclBox) { vclBox.remove(); vclBox = null; } if (siteBox) { siteBox.remove(); siteBox = null; } var ide = window.CPP && CPP.ide && CPP.ide(); if (ide) ide.hide(); }
  function startCode(t) {
    if (t.start) return t.start;
    return '#include <iostream.h>\n#include <conio.h>\n#include <math.h>\n\nint main()\n{\n  // ' + String(t.name || 'Задание') + ': напиши решение здесь\n\n  getch();\n  return 0;\n}\n';
  }
  /* «Пустой Builder»: как после запуска настоящей программы — Project1 с пустой Form1 */
  function openFree(sid) {
    closeWin(); hideTask(); task = null; curSid = sid;
    if (SUBJ[sid].site) { openSite(sid, 't16', 'Electronics Workbench — свободная сборка'); return; }
    var p = CPP.IDE_TEST.newProject('vcl', 'Project1'); p.dgKeep = true;
    CPP.openIDE(p); pickBtn(sid);
    if (window.DGame && DGame.toast) DGame.toast('💻 Чистый Builder. Задание — жёлтая кнопка «📋 Задания» справа вверху');
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
  var siteBox = null, siteBack = null;
  function openSite(sid, anchor, title) {
    if (siteBox) siteBox.remove();
    var url = SUBJ[sid].site + '#' + (anchor || 't1');
    siteBox = el('<div class="prx prx-site"><div class="prx-t"><span class="ico">⚡</span><span class="tt">' + esc(SUBJ[sid].title) + ' — ' + esc(title || '') + '</span><button data-x title="К списку">×</button></div>' +
      '<div class="prx-b"><iframe title="Лабораторный стенд" src="' + esc(url) + '" loading="eager"></iframe><div class="site-load">Загружается стенд…</div></div></div>');
    document.body.appendChild(siteBox);
    var sb0 = siteBack; siteBack = null;
    siteBox.querySelector('[data-x]').onclick = function () { if (!task && sb0) { siteBox.remove(); siteBox = null; sb0(); return; } openList(sid, task ? task.li : undefined); };
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
  /* ---------- ⚙ Архитектура: задания на ассемблер — в ASM-студии (с нуля → по шагам → эталон) ---------- */
  function asmStart(t) { return '; ' + String(t.name || 'Задание') + '\n; ' + plainT(t.text).slice(0, 150).replace(/\n/g, ' ') + (plainT(t.text).length > 150 ? '…' : '') + '\n' + ASM.TEMPLATE; }
  function asmTask(t, l, A, ks, keepCode) {
    var key = 'dgAsm:' + t.id, mine = null; try { mine = localStorage.getItem(key); } catch (e) {}
    var code = keepCode != null ? keepCode : mine != null ? mine : asmStart(t), sid = task.sid;
    var ed = ASM.studio({ side: true, title: (l.short || '') + ' · ' + t.name, code: code, onTasks: function () { pickWin(sid); },
      onChange: function (c) { try { localStorage.setItem(key, c); } catch (e) {} },
      onRun: function () { PR._ran = true; },
      onClose: function () { openList(sid, task ? task.li : undefined); } });
    var refs = ks.map(function (k) { return { k: k, code: A.progs[k], title: A.titles[k] || k }; }).filter(function (x) { return x.code; });
    var full = siteImg(t.text || ''), solved = save()[t.id];
    var ref0 = refs[0] ? refs[0].code : '', steps = ref0.split('\n').map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { var c = o.x.replace(/;.*/, '').trim(); return c && !/^(include|\.model|\.stack|\.data|\.code|end\b|main\s+(proc|endp)|start:)/i.test(c); });
    tw = makeWin('prx-task asm-task', t.name + ' · ' + (l.short || ''), '<div class="tk-scroll">' +
      '<p class="tk-brief">🎯 <b>Задача:</b> ' + esc(brief(t)) + '</p>' +
      '<p class="tk-mini">Пиши код слева в ⚙ ASM-студии. <b>⏭ Шаг</b> (F10) — выполнить одну команду и увидеть, что она сделала с регистрами, флагами и памятью; <b>▶ Запуск</b> (F5) — всю программу.</p>' +
      '<details class="tk-full"><summary>📖 Подробнее — полное условие из методички</summary><div class="tk-text">' + full + '</div></details>' +
      (steps.length ? '<details class="tk-livebox"><summary>🧭 По шагам — как решать</summary><p class="tk-mini">Строки эталона по одной — с объяснением. Сначала попробуй сам, потом подглядывай.</p><div class="as-steps"></div></details>' : '') +
      (refs.length ? '<details class="tk-ref"><summary>📄 Эталон — вставится в студию</summary><div class="as-refs"></div></details>' : '') +
      (t.solution ? '<details class="tk-ref2"><summary>📝 Разбор из методички</summary><div class="tk-sol">' + siteImg(t.solution) + '</div></details>' : '') +
      '<div class="tk-res">' + (solved ? '<p class="tk-ok">✓ Это задание ты уже сделал.</p>' : '') + '</div></div>' +
      '<div class="prx-bar"><button class="w2k primary" data-done>' + (solved ? '✓ Сделано' : '✓ Я сделал задание') + '</button><span class="grow"></span><button class="w2k" data-site title="Это задание на учебном сайте">🌐 На сайте</button><button class="w2k" data-list>📁 К списку</button></div>', { ico: '⚙', min: true });
    tw.querySelector('[data-x]').onclick = tw.querySelector('[data-list]').onclick = function () { openList(sid, task.li); };
    tw.querySelector('[data-site]').onclick = function () { ASM.close(); openSite(sid, t.anchor, l.title); };
    tw.querySelector('[data-done]').onclick = function () {
      var e2 = ASM.editor(); if (e2 && refs.some(function (r) { return r.code.trim() === e2.get().trim(); })) { tw.querySelector('.tk-res').innerHTML = '<p class="tk-warn">В студии сейчас эталон — он работает. В прогресс не идёт: верни свой вариант или напиши сам.</p>'; return; }
      if (e2 && !PR._ran) { tw.querySelector('.tk-res').innerHTML = '<p class="tk-warn">Сначала запусти свою программу в студии (▶ Запуск или ⏭ Шаг) — посмотри, что получилось.</p>'; return; }
      markSolved(t, 'Задание по ассемблеру сделано!'); this.textContent = '✓ Сделано'; };
    /* по шагам: строка эталона + что она делает (комментарий автора или разбор симулятора) */
    var sb = tw.querySelector('.as-steps');
    if (sb) {
      var expl = {}; try { var P = ASM.assemble(ref0), st = ASM.initState(P), n = 0; while (!st.done && n++ < 3000) { var ln = P.code[st.pc] ? P.code[st.pc].line : null, m = ASM.execStep(P, st); if (ln != null && !expl[ln] && m && m.txt) expl[ln] = m.txt; } } catch (e) {}
      var k = 0, draw = function () {
        sb.innerHTML = steps.slice(0, k).map(function (o, i) { var c = o.x.split(';'), why = c.length > 1 ? c.slice(1).join(';').trim() : ''; return '<div class="tk-hint"><b>' + (i + 1) + '.</b> <code>' + esc(c[0].trim()) + '</code>' + (why ? ' — ' + esc(why) : '') + (expl[o.i] ? '<small>' + esc(expl[o.i]) + '</small>' : '') + '</div>'; }).join('') +
          (k < steps.length ? '<button class="w2k" data-hint>💡 ' + (k ? 'Следующая строка' : 'Первая строка') + ' (' + (k + 1) + ' из ' + steps.length + ')</button> ' + (k ? '' : '') : '<p class="tk-mini">Это вся программа. Напиши её сама в студии и пройди «⏭ Шаг».</p>');
        var b = sb.querySelector('[data-hint]'); if (b) b.onclick = function () { k++; draw(); };
      };
      draw();
    }
    var rb = tw.querySelector('.as-refs');
    if (rb) {
      var mineK = key + ':mine';
      var drawR = function (ins) {
        rb.innerHTML = (ins ? '<p class="tk-ok">✓ Эталон «' + esc(ins) + '» вставлен в студию — жми ⏭ Шаг и смотри, что делает каждая строка.</p>' : '') +
          refs.map(function (r, i) { return '<button class="w2k" data-ref="' + i + '">⤵ ' + esc(r.title) + '</button> '; }).join('') +
          (ins ? '<button class="w2k" data-mine>↩ Вернуть мой вариант</button>' : '');
        rb.querySelectorAll('[data-ref]').forEach(function (b) { b.onclick = function () { var r = refs[+b.getAttribute('data-ref')], e2 = ASM.editor(); if (!e2) return; try { if (!rb._saved) { localStorage.setItem(mineK, e2.get()); rb._saved = 1; } } catch (e) {} e2.set(r.code); drawR(r.title); }; });
        var mb = rb.querySelector('[data-mine]'); if (mb) mb.onclick = function () { var e2 = ASM.editor(); try { var j = localStorage.getItem(mineK); if (j != null && e2) e2.set(j); } catch (e) {} rb._saved = 0; drawR(null); };
      };
      drawR(null);
      var dref = tw.querySelector('.tk-ref'); dref.addEventListener('toggle', function () { if (dref.open && !dref._ins && refs[0]) { dref._ins = 1; rb.querySelector('[data-ref="0"]').click(); } });
    }
  }
  function openTask(sid, li, ti, keep) {
    var keepAsm = keep && SUBJ[sid].site && window.ASM && ASM.isOpen() ? ASM.editor().get() : null;
    closeWin(); curSid = sid;
    if (keep && !SUBJ[sid].site) { if (tw) { tw.remove(); tw = null; } if (pkw) { pkw.remove(); pkw = null; } } else hideTask();
    var od = document.querySelector('.prx-open'); if (od) od.remove();
    var l = labs[sid][li], t = l.tasks[ti]; task = { sid: sid, li: li, ti: ti, t: t }; PR._ran = false;
    D.save.labLast = D.save.labLast || {}; D.save.labLast[sid] = t.id; try { D.persist(); } catch (e) {}
    if (SUBJ[sid].site) {
      Promise.resolve().then(function () { return ASM.data(); }).then(function (A) {
        if (!task || task.t !== t) return;
        var ks = (A.tasks || {})[t.id];
        if (ks) { asmTask(t, l, A, ks, keepAsm); return; }
        openSite(sid, t.anchor, l.title); siteTaskWin(t, l);
      }, function () { openSite(sid, t.anchor, l.title); siteTaskWin(t, l); });
      return;
    }
    if (keep) { if (t.kind === 'vcl') ensureVclCheck(); }   /* выбрал задание в пустом Builder — твой проект остаётся, решаешь в нём */
    else if (t.kind === 'vcl' && t.vcl) openVcl(t); else openConsole(t);
    taskWin(t, l); pickBtn(sid);
  }
  /* ---------- «📋 Задания»: кнопка в Builder — окно выбора задания (тема → задание), Builder при этом не закрывается ---------- */
  var pb = null, pkw = null;
  function pickBtn(sid) {
    if (SUBJ[sid].site) return;   /* в архитектуре кнопка «📋 Задания» — в самой ASM-студии */
    if (!pb) { pb = el('<button class="w2k pk-dockbtn" title="Выбрать задание, не закрывая Builder">📋 Задания</button>'); document.body.appendChild(pb); }
    pb.onclick = function () { pickWin(sid); };
  }
  function pickWin(sid) {
    if (pkw) { pkw.remove(); pkw = null; return; }
    var L = labs[sid] || [], s = save(), topics = byTopic(sid), cur = task ? +L[task.li].topic : (view.topic != null ? view.topic : (topics[0] || {}).n);
    pkw = makeWin('prx-pick', 'Задания — выбери тему, потом задание', '<div class="pp-wrap"><div class="pp-top"></div><div class="pp-list"></div></div>' +
      '<div class="prx-bar"><button class="w2k" data-rnd>🎲 Случайное</button><span class="grow"></span><label class="pk-chk"><input type="checkbox" data-keep checked> решать в моём проекте</label></div>', { ico: '📋' });
    var top = pkw.querySelector('.pp-top'), list = pkw.querySelector('.pp-list');
    pkw.querySelector('[data-x]').onclick = function () { pkw.remove(); pkw = null; };
    var go = function (li, ti) { var k = pkw.querySelector('[data-keep]').checked; openTask(sid, li, ti, k); };
    top.innerHTML = topics.map(function (g) { var n = 0, d = 0; g.labs.forEach(function (li) { L[li].tasks.forEach(function (t) { n++; if (s[t.id]) d++; }); }); return '<button class="pp-t" data-tp="' + g.n + '" title="' + esc(topicTitle(sid, g.n)) + '"><b>' + g.n + '</b> ' + esc(topicTitle(sid, g.n) || 'Тема ' + g.n) + ' <em>' + d + '/' + n + '</em></button>'; }).join('');
    var draw = function () {
      top.querySelectorAll('.pp-t').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-tp') === cur); });
      var g = topics.filter(function (x) { return x.n === cur; })[0], h = '';
      if (g) g.labs.forEach(function (li) { var l = L[li]; h += '<h4>' + esc(l.short || l.title) + '</h4>' + l.tasks.map(function (t, ti) { var on = task && task.t === t; return '<button class="pp-it' + (s[t.id] ? ' ok' : '') + (on ? ' on' : '') + '" data-li="' + li + '" data-ti="' + ti + '"><b>' + (s[t.id] ? '✅ ' : t.kind === 'vcl' ? '🗔 ' : '📄 ') + esc(t.name || 'Задание') + '</b><span>' + esc(brief(t)) + '</span></button>'; }).join(''); });
      list.innerHTML = h; list.scrollTop = 0;
      list.querySelectorAll('[data-li]').forEach(function (b) { b.onclick = function () { go(+b.getAttribute('data-li'), +b.getAttribute('data-ti')); }; });
    };
    top.querySelectorAll('.pp-t').forEach(function (b) { b.onclick = function () { cur = view.topic = +b.getAttribute('data-tp'); draw(); }; });
    pkw.querySelector('[data-rnd]').onclick = function () { var x = randomTask(sid, cur); if (x) go(x.li, x.ti); };
    draw(); var on = top.querySelector('.pp-t.on'); if (on) on.scrollIntoView({ block: 'nearest' });
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
      box.innerHTML = (done ? '<p class="tk-ok">✓ Эталон вставлен в Builder' + (vcl ? ': форма и код Unit1.cpp. Нажми F9 и посмотри, как работает; двойной щелчок по кнопке покажет её обработчик.' : ' и уже запущен — посмотри, как работает. F9 — запустить ещё раз.') + '</p>' : '') +
        '<pre class="tk-code cpp-code">' + (CPP.highlight ? CPP.highlight(code.replace(/\s+$/, '')) : esc(code)) + '</pre>' +
        '<p>' + (done ? '' : '<button class="w2k" data-ins>⤵ Вставить эталон в Builder</button> ') + (has && done ? '<button class="w2k" data-mine>↩ Вернуть мой вариант</button>' : '') + '</p>';
      var a = box.querySelector('[data-ins]'); if (a) a.onclick = insert;
      var b = box.querySelector('[data-mine]'); if (b) b.onclick = function () { try { var j = localStorage.getItem(mineKey); if (j) { var p = CPP.IDE_TEST.prjLoad(JSON.parse(j)); p.dgKeep = true; CPP.openIDE(p); if (vcl) ensureVclCheck(); } } catch (e) {} draw(false); };
    };
    draw(false);
    d.addEventListener('toggle', function () { if (d.open && !d._ins) { d._ins = 1; insert(); setTimeout(function () { var rb = document.querySelector('.bcbx [data-a="run"]'); if (rb && !vcl) rb.click(); }, 400); } });
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
      '<details class="tk-ref"><summary>📄 Эталон' + (vcl ? ' — откроется готовая форма в Builder' : ' — готовый код вставится в Builder и запустится') + '</summary><div class="tk-refbox"></div></details>' +
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
  /* сел за компьютер: через книгу — сразу задание; через компьютер — C++: чистый Builder, Архитектура: рабочий стол */
  function boot(sid, want) {
    if (room) room.classList.add('desk');
    if (want && want.li != null) return openTask(sid, want.li, want.ti);
    if (SUBJ[sid].site) return openDesktop(sid);
    openFree(sid);
  }
  function exit() {
    var sid = curSid; hideTask(); closeWin(); task = null;
    enterRoom(sid, function (w) { boot(sid, w); }, true);   /* встал из-за компьютера — снова в подвале */
  }
  /* ---------- рабочий стол «как на Windows» (Архитектура): EWB, ASM-студия, блокнот задач, учебный сайт ---------- */
  function asmFree(sid, back) {
    closeWin(); hideTask(); task = null;
    var c = null; try { c = localStorage.getItem('dgAsm:free'); } catch (e) {}
    ASM.studio({ title: 'Source.asm', code: c, onTasks: function () { pickWin(sid); }, onChange: function (v) { try { localStorage.setItem('dgAsm:free', v); } catch (e) {} }, onClose: function () { back ? back() : openList(sid); } });
  }
  function openDesktop(sid) {
    closeWin(); hideTask(); task = null; curSid = sid;
    var s0 = save(), all = every(sid), done = all.filter(function (x) { return s0[x.t.id]; }).length;
    var apps = [['ewb', '⚡', 'Electronics Workbench', 'собрать схему'], ['asm', '⚙', 'ASM-студия', 'ассемблер x86 по шагам'], ['tasks', '📒', 'Блокнот задач', 'все лабы по темам'], ['site', '🌐', 'Учебный сайт', 'лекции и стенды'], ['off', '⏻', 'Выключить', 'встать из-за компьютера']];
    win = el('<div class="prx-desktop" role="application" aria-label="Рабочий стол"><div class="dk-icons">' + apps.map(function (a) { return '<button class="dk-ic" data-app="' + a[0] + '" title="' + esc(a[3]) + '"><span class="dk-i">' + a[1] + '</span><span class="dk-n">' + esc(a[2]) + '</span></button>'; }).join('') + '</div>' +
      '<div class="dk-note"><b>💡 Что открыть?</b><span>⚡ <b>EWB</b> — схемы (темы 3–7, 16)<br>⚙ <b>ASM-студия</b> — программы на ассемблере (темы 8–9)<br>📒 <b>Блокнот задач</b> — выбрать лабу по теме</span></div>' +
      '<div class="dk-bar"><button class="dk-start">🪟 Пуск</button><span class="dk-task">Решено лаб: <b>' + done + ' из ' + all.length + '</b></span><span class="grow"></span><span class="dk-clock"></span></div></div>');
    document.body.appendChild(win);
    var ck = win.querySelector('.dk-clock'), tick = function () { if (!win || !ck.isConnected) return; var d = new Date(); ck.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); setTimeout(tick, 15000); }; tick();
    var back = function () { openDesktop(sid); };
    var act = { ewb: function () { closeWin(); siteBack = back; openSite(sid, 't16', 'Electronics Workbench — свободная сборка'); }, asm: function () { asmFree(sid, back); }, tasks: function () { openList(sid); }, site: function () { closeWin(); siteBack = back; openSite(sid, 't1', 'Учебный сайт'); }, off: exit };
    win.querySelectorAll('[data-app]').forEach(function (b) { b.onclick = function () { act[b.getAttribute('data-app')](); }; });
    win.querySelector('.dk-start').onclick = function () { act.tasks(); };
  }
  document.addEventListener('bcb-hide', function () { if (!PR.active || vclBox || hiding) return; if (task) openList(curSid, task.li); else exit(); });

  PR.open = function (sid) { if (!SUBJ[sid] || PR.active) return; if (curSid !== sid) view = { only: false, q: '' }; curSid = sid; enterRoom(sid, function (w) { boot(sid, w); }); };
})();
/* запуск программы (F9 или ▶ Run) в Builder — для шага «Нажми F9» */
(function () {
  var mark = function () { if (window.PR && PR.active) { PR._ran = true; } };
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.bcbx [data-a="run"]')) mark(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'F9') mark(); }, true);
})();
