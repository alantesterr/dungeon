/* =====================================================================
   БИБЛИОТЕКА ПРЕДМЕТА — 2D-комната (рисуется кодом, пиксельный стиль как у домика).
   У каждого предмета свой стиль:
     C++          — «Кибер-библиотека»: тёмно-бирюзовые стены с бегущими огоньками по дорожкам микросхем;
     Архитектура  — «Машинный архив»: стальные панели с заклёпками, шестерёнки, мигающие двоичные лампочки;
     Философия    — «Античная библиотека»: тёплый песчаник, золотой меандр, колонны, масляные лампы;
     ИКТ          — «Сетевой архив»: ночная синева, узлы сети с бегущими пакетами.
   Шкафы: каждая полка = тема, книги = выученные вопросы. Слева в углу — красный шкаф «Полка ошибок».
   A.bgLib(c, t, L) — L из game.js: { sid, cases:[{x, w, rows:[{n, fill, dust, gold, empty}]}], err:{x, w, fill, clean}, hover, anim }
   ===================================================================== */
(function () {
  'use strict';
  var A = window.DA, W = 480, H = 270;
  var CASE_TOP = 58, ROW_H = 36, ROWS = 4, SLOT = 6, PER_ROW = 9;
  A.LIB = { CASE_TOP: CASE_TOP, ROW_H: ROW_H, ROWS: ROWS, PER_ROW: PER_ROW, CASE_W: 66, ERR_X: 6, ERR_W: 54, DOOR_X: 456 };

  var PAL = {
    cpp: { name: 'Кибер-библиотека', wall: '#12282a', wall2: '#0e2022', accent: '#5DCAA5', glow: '93,202,165', floorA: '#2a2f33', floorB: '#24292c', carpet: '#0f6e56', carpet2: '#5DCAA5',
      wood: '#2b2a2e', woodD: '#18171a', woodL: '#4a4950', board: '#3c3b42', books: ['#1D9E75', '#5DCAA5', '#0F6E56', '#2f8f8a', '#EF9F27', '#3a7ca5', '#97C459', '#9FE1CB', '#26667a'] },
    arch: { name: 'Машинный архив', wall: '#1b2236', wall2: '#141a2b', accent: '#85B7EB', glow: '133,183,235', floorA: '#2b3042', floorB: '#252a3a', carpet: '#3C3489', carpet2: '#AFA9EC',
      wood: '#3a3f52', woodD: '#22263a', woodL: '#5f6b8a', board: '#4b5268', books: ['#534AB7', '#7F77DD', '#185FA5', '#85B7EB', '#3C3489', '#AFA9EC', '#D85A30', '#5f6b8a', '#2b5f9e'] },
    phil: { name: 'Античная библиотека', wall: '#c8b28a', wall2: '#b39c72', accent: '#FAC775', glow: '250,199,117', floorA: '#d8cdb8', floorB: '#a89a82', carpet: '#7a1f2b', carpet2: '#FAC775',
      wood: '#5a3a1e', woodD: '#3a2412', woodL: '#8a5e34', board: '#6b4526', books: ['#A32D2D', '#8a5a2b', '#BA7517', '#6b3d1e', '#D85A30', '#c9a24a', '#3B6D11', '#7a1f2b', '#4a2f6b'] },
    ict: { name: 'Сетевой архив', wall: '#10202f', wall2: '#0c1925', accent: '#85B7EB', glow: '133,183,235', floorA: '#1f2a36', floorB: '#1a2430', carpet: '#185FA5', carpet2: '#9FE1CB',
      wood: '#2a3442', woodD: '#18202b', woodL: '#47566b', board: '#36435a', books: ['#185FA5', '#85B7EB', '#0f8fb0', '#2a5a8a', '#9FE1CB', '#5DCAA5', '#cfd8e6', '#3C3489', '#4f7fb8'] }
  };
  A.libName = function (sid) { return (PAL[sid] || PAL.cpp).name; };
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

  /* ---------- стены ---------- */
  function wallCpp(c, P, t) {
    px(c, 0, 0, W, A.FLOOR_Y, P.wall);
    for (var x = 0; x < W; x += 40) px(c, x, 0, 1, A.FLOOR_Y, P.wall2);
    /* дорожки микросхемы в верхней полосе и справа, по ним бегут огоньки */
    var traces = [[0, 14, W], [0, 26, 200], [280, 26, W], [0, 40, 150], [330, 40, W]];
    traces.forEach(function (tr, i) {
      px(c, tr[0], tr[1], tr[2] - tr[0], 1, 'rgba(93,202,165,.25)');
      for (var k = tr[0] + 20; k < tr[2]; k += 46) { px(c, k - 1, tr[1] - 1, 3, 3, 'rgba(93,202,165,.35)'); }
      if (A.lite) return;
      var len = tr[2] - tr[0], p = ((t / (14 + i * 3)) + i * 97) % len;
      px(c, tr[0] + p - 6, tr[1], 6, 1, 'rgba(160,255,220,.9)'); px(c, tr[0] + p, tr[1] - 1, 2, 3, '#d8fff0');
    });
    /* «двоичный дождь» на правой стене */
    if (!A.lite) for (var i = 0; i < 6; i++) { var y = (t / 30 + i * 41) % 160 + 50; px(c, 432 + (i % 3) * 14, y, 2, 4, 'rgba(93,202,165,' + (0.15 + 0.1 * (i % 2)) + ')'); }
  }
  function gear(c, cx, cy, r, a, col, hole) {
    c.save(); c.translate(cx, cy); c.rotate(a); c.fillStyle = col;
    for (var k = 0; k < 8; k++) { c.save(); c.rotate(k * Math.PI / 4); c.fillRect(-2, -r - 3, 4, 5); c.restore(); }
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = hole; c.beginPath(); c.arc(0, 0, r * 0.35, 0, 7); c.fill(); c.restore();
  }
  function wallArch(c, P, t) {
    px(c, 0, 0, W, A.FLOOR_Y, P.wall);
    for (var y = 0; y < A.FLOOR_Y; y += 32) for (var x = 0; x < W; x += 48) {
      px(c, x, y, 48, 1, P.wall2); px(c, x, y, 1, 32, P.wall2);
      [[3, 3], [44, 3], [3, 28], [44, 28]].forEach(function (r) { px(c, x + r[0], y + r[1], 1, 1, '#5f6b8a'); });
    }
    gear(c, 150, 30, 13, t / 1400, '#4b5268', P.wall); gear(c, 171, 42, 8, -t / 900, '#5f6b8a', P.wall);
    gear(c, 330, 28, 10, -t / 1100, '#4b5268', P.wall);
    /* двоичные лампочки: показывают «счёт» */
    var v = Math.floor(t / 600);
    for (var b = 0; b < 12; b++) { var on = (v >> (b % 10)) & 1; px(c, 360 + b * 8, 46, 4, 4, on ? '#85B7EB' : '#2b3350'); if (on && !A.lite) px(c, 359 + b * 8, 45, 6, 6, 'rgba(133,183,235,.18)'); }
    /* трубы под потолком */
    px(c, 0, 6, W, 4, '#3a3f52'); px(c, 0, 6, W, 1, '#5f6b8a');
    for (var j = 30; j < W; j += 90) px(c, j, 4, 6, 8, '#22263a');
  }
  function wallPhil(c, P, t) {
    for (var y = 0; y < A.FLOOR_Y; y += 16) for (var x = -16; x < W; x += 32) {
      var o = (y / 16) % 2 ? 16 : 0, sh = hash(x, y) * 14 | 0;
      px(c, x + o, y, 31, 15, 'rgb(' + (200 - sh) + ',' + (178 - sh) + ',' + (138 - sh) + ')');
    }
    px(c, 0, 0, W, A.FLOOR_Y, 'rgba(40,22,8,.38)');
    /* золотой меандр */
    px(c, 0, 48, W, 8, '#7a5a2a');
    for (var m = 0; m < W; m += 12) { px(c, m, 49, 10, 1, '#FAC775'); px(c, m + 9, 49, 1, 5, '#FAC775'); px(c, m + 3, 53, 7, 1, '#FAC775'); px(c, m + 3, 51, 1, 3, '#FAC775'); }
    /* лавровые венки */
    [110, 370].forEach(function (cx) { c.strokeStyle = '#7a9a3a'; c.lineWidth = 2; c.beginPath(); c.arc(cx, 26, 11, 0.4, Math.PI - 0.4, true); c.stroke(); for (var l = 0; l < 6; l++) { var a = 0.6 + l * 0.36; px(c, cx + Math.cos(a + Math.PI) * 11 - 1, 26 - Math.sin(a) * 11 - 1, 3, 2, '#97C459'); } });
  }
  function wallIct(c, P, t) {
    px(c, 0, 0, W, A.FLOOR_Y, P.wall);
    for (var y = 6; y < A.FLOOR_Y; y += 12) for (var x = 6; x < W; x += 12) px(c, x, y, 1, 1, 'rgba(133,183,235,.12)');
    var N = [[30, 20], [90, 36], [150, 14], [200, 40], [290, 18], [340, 38], [400, 16], [452, 34], [430, 90], [455, 140]];
    c.strokeStyle = 'rgba(133,183,235,.22)'; c.lineWidth = 1;
    for (var i = 0; i < N.length - 1; i++) { c.beginPath(); c.moveTo(N[i][0], N[i][1]); c.lineTo(N[i + 1][0], N[i + 1][1]); c.stroke(); }
    N.forEach(function (n, k) { px(c, n[0] - 2, n[1] - 2, 5, 5, k % 3 ? '#2a5a8a' : '#85B7EB'); });
    if (!A.lite) for (var p = 0; p < 3; p++) {
      var s = ((t / 1600) + p / 3) % 1 * (N.length - 1), k2 = Math.floor(s), f = s - k2, a = N[k2], b = N[k2 + 1];
      px(c, a[0] + (b[0] - a[0]) * f - 1, a[1] + (b[1] - a[1]) * f - 1, 3, 3, '#9FE1CB');
    }
  }

  /* ---------- окно со светом, лампы ---------- */
  function windowLight(c, P, t, sid) {
    var x = 216, y = 4, w = 48, h = 50;
    px(c, x - 3, y, w + 6, h + 3, sid === 'phil' ? '#7a5a2a' : '#22263a');
    c.save(); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + 18); c.arc(x + w / 2, y + 18, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.clip();
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1b2a4a'); g.addColorStop(1, '#33507a'); c.fillStyle = g; c.fillRect(x, y - 10, w, h + 10);
    c.fillStyle = '#e8eefc'; c.beginPath(); c.arc(x + 32, y + 18, 6, 0, 7); c.fill(); c.fillStyle = '#25406a'; c.beginPath(); c.arc(x + 35, y + 16, 5, 0, 7); c.fill();
    for (var s = 0; s < 7; s++) if ((Math.floor(t / 400) + s) % 5) px(c, x + 6 + (s * 13) % 40, y + 8 + (s * 7) % 30, 1, 1, '#fff');
    c.restore();
    px(c, x + w / 2 - 1, y + 4, 2, h - 4, sid === 'phil' ? '#7a5a2a' : '#22263a'); px(c, x, y + 30, w, 2, sid === 'phil' ? '#7a5a2a' : '#22263a');
    if (A.lite) return;
    /* луч лунного света на пол с пылинками */
    c.save(); c.globalCompositeOperation = 'lighter';
    var lg = c.createLinearGradient(240, 50, 200, 230); lg.addColorStop(0, 'rgba(180,200,255,.10)'); lg.addColorStop(1, 'rgba(180,200,255,0)');
    c.fillStyle = lg; c.beginPath(); c.moveTo(x + 4, y + h); c.lineTo(x + w - 4, y + h); c.lineTo(x + w + 30, A.FLOOR_Y + 30); c.lineTo(x - 50, A.FLOOR_Y + 30); c.closePath(); c.fill();
    for (var d = 0; d < 16; d++) { var pp = (t / 9000 + d / 16) % 1, dx = x - 30 + hash(d, 3) * 100 + Math.sin(t / 1300 + d) * 6, dy = 60 + pp * 160; px(c, dx, dy, 1, 1, 'rgba(255,250,220,' + (0.5 * Math.sin(pp * Math.PI)).toFixed(2) + ')'); }
    c.restore();
  }
  function lamp(c, P, t, x, sid) {
    var f = Math.sin(t / 120 + x) * 0.04;
    px(c, x, 0, 1, 14, '#555'); px(c, x - 5, 14, 11, 3, sid === 'phil' ? '#BA7517' : '#5f6b8a'); px(c, x - 3, 17, 7, 4, sid === 'phil' ? '#ffcf6a' : 'rgb(' + P.glow + ')');
    if (A.lite) return;
    var g = c.createRadialGradient(x, 22, 2, x, 22, 70); g.addColorStop(0, 'rgba(' + (sid === 'phil' ? '255,190,90' : P.glow) + ',' + (0.22 + f).toFixed(3) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - 70, 0, 140, 100);
  }

  /* ---------- пол, ковёр, дверь, кафедра ---------- */
  function floor(c, P, sid) {
    var y0 = A.FLOOR_Y;
    if (sid === 'phil') { for (var y = y0; y < H; y += 10) for (var x = 0; x < W; x += 20) px(c, x, y, 20, 10, ((x / 20 + (y - y0) / 10) % 2) ? P.floorA : P.floorB); px(c, 0, y0, W, H - y0, 'rgba(40,22,8,.35)'); }
    else for (var y2 = y0; y2 < H; y2 += 8) for (var x2 = -16; x2 < W; x2 += 32) { px(c, x2 + ((y2 - y0) % 16 ? 16 : 0), y2, 31, 7, ((x2 / 32 + y2 / 8) % 2) ? P.floorA : P.floorB); }
    px(c, 0, y0, W, 4, 'rgba(0,0,0,.4)');
    /* ковёр */
    var cx0 = 120, cx1 = 360, cy0 = y0 + 14, cy1 = H - 8;
    px(c, cx0, cy0, cx1 - cx0, cy1 - cy0, P.carpet); px(c, cx0 + 4, cy0 + 4, cx1 - cx0 - 8, 2, P.carpet2); px(c, cx0 + 4, cy1 - 6, cx1 - cx0 - 8, 2, P.carpet2);
    for (var k = cx0 + 10; k < cx1 - 10; k += 16) px(c, k, (cy0 + cy1) / 2 - 2, 6, 4, 'rgba(255,255,255,.12)');
    for (var fr = cx0; fr < cx1; fr += 4) { px(c, fr, cy0 - 2, 2, 2, P.carpet2); px(c, fr, cy1, 2, 2, P.carpet2); }
  }
  function door(c, P, t, sid) {
    var x = 440, y = A.FLOOR_Y - 64;
    px(c, x - 4, y - 6, 40, 70, sid === 'phil' ? '#7a5a2a' : '#22263a');
    A.tile(c, 'doors_leaf_open', x, y, 2);
    px(c, x, y, 32, 64, 'rgba(0,0,0,.25)');
  }
  function lectern(c, P, t, sid) {
    var x = 404, y = A.FLOOR_Y;
    px(c, x - 2, y - 26, 4, 26, P.woodD); px(c, x - 10, y - 2, 20, 3, P.woodD);
    px(c, x - 13, y - 32, 26, 7, P.wood); px(c, x - 11, y - 36, 10, 5, '#efe6d8'); px(c, x + 1, y - 36, 10, 5, '#e6dcc8'); px(c, x, y - 36, 1, 5, '#a89a82');
    /* свеча */
    var f = Math.sin(t / 90) + Math.sin(t / 37) * 0.5;
    px(c, x + 14, y - 40, 3, 8, '#efe6d8'); px(c, x + 14, y - 44 - f, 3, 4, '#ff9a1f'); px(c, x + 15, y - 45 - f, 1, 2, '#ffe28a');
    if (!A.lite) { var g = c.createRadialGradient(x + 15, y - 44, 1, x + 15, y - 44, 40); g.addColorStop(0, 'rgba(255,180,80,.25)'); g.addColorStop(1, 'rgba(255,150,40,0)'); c.fillStyle = g; c.fillRect(x - 25, y - 85, 80, 80); }
  }

  /* ---------- шкаф ---------- */
  function caseFrame(c, P, x, w, err) {
    var top = CASE_TOP, bot = A.FLOOR_Y + 2, wood = err ? '#3a1a1c' : P.wood, woodD = err ? '#22100f' : P.woodD, woodL = err ? '#6b2a2e' : P.woodL;
    px(c, x + 2, top + 4, w, bot - top, 'rgba(0,0,0,.35)');
    px(c, x, top, w, bot - top, woodD);
    px(c, x - 2, top - 4, w + 4, 8, wood); px(c, x - 2, top - 4, w + 4, 1, woodL); px(c, x - 3, top + 3, w + 6, 2, woodD);
    px(c, x, top + 4, 4, bot - top - 4, wood); px(c, x + w - 4, top + 4, 4, bot - top - 4, wood); px(c, x + 1, top + 4, 1, bot - top - 4, woodL);
    px(c, x - 1, bot - 4, w + 2, 4, wood);
  }
  function rowRect(x, w, r) { return { x: x + 4, y: CASE_TOP + 8 + r * ROW_H, w: w - 8, h: ROW_H }; }
  function books(c, P, t, x, w, r, row, seed, err, anim) {
    var R = rowRect(x, w, r), by = R.y + R.h - 3, n = Math.min(PER_ROW, row.fill || 0);
    /* задняя стенка шкафа с волокнами дерева */
    px(c, R.x, R.y, R.w, R.h - 3, err ? '#2a1214' : P.woodD);
    for (var gx = R.x + 3; gx < R.x + R.w; gx += 7) px(c, gx, R.y, 1, R.h - 3, 'rgba(255,255,255,.035)');
    px(c, R.x, R.y, R.w, 4, 'rgba(0,0,0,.35)');
    /* «места» под ещё не выученные книги — едва заметные силуэты: видно, сколько осталось собрать */
    for (var gi = Math.min(PER_ROW, row.fill || 0); gi < PER_ROW && row.n != null; gi++) {
      var gh = 18 + Math.floor(hash(seed, gi) * 11), gbx = R.x + 2 + gi * SLOT;
      px(c, gbx, R.y + R.h - 3 - gh, SLOT - 1, gh, 'rgba(255,255,255,.045)'); px(c, gbx, R.y + R.h - 3 - gh, SLOT - 1, 1, 'rgba(255,255,255,.09)');
    }
    /* доска полки */
    px(c, R.x - 1, by, R.w + 2, 3, err ? '#5a2226' : P.board); px(c, R.x - 1, by, R.w + 2, 1, err ? '#8a3a3e' : P.woodL);
    if (row.gold && !A.lite) { var ga = 0.18 + 0.1 * Math.sin(t / 400 + seed); px(c, R.x, R.y, R.w, R.h - 3, 'rgba(250,199,117,' + ga.toFixed(3) + ')'); }
    if (!n) {   /* пустая полка — паутинка в углу */
      c.strokeStyle = 'rgba(220,220,230,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(R.x, R.y + 8); c.lineTo(R.x + 8, R.y); c.moveTo(R.x, R.y); c.lineTo(R.x + 6, R.y + 6); c.stroke();
    }
    for (var i = 0; i < n; i++) {
      var hgt = 18 + Math.floor(hash(seed, i) * 11), col = err ? (i % 2 ? '#A32D2D' : '#C84040') : P.books[Math.floor(hash(seed + 7, i) * P.books.length)];
      var bx = R.x + 2 + i * SLOT, yoff = 0, alpha = 1;
      if (anim && row.newFrom != null && i >= row.newFrom) {   /* новая книга влетает сверху с отскоком */
        var st = anim.t0 + anim.delay + (i - row.newFrom) * 200, k = (t - st) / 650;
        if (k < 0) continue;
        if (k < 1) { yoff = -46 * Math.pow(1 - k, 2) + (k > 0.75 ? Math.sin((k - 0.75) * 4 * Math.PI) * 2 : 0); alpha = Math.min(1, k * 3); }
        else if (k < 1.8 && !A.lite) { var sp = (k - 1) / 0.8; c.fillStyle = 'rgba(255,230,150,' + (1 - sp).toFixed(2) + ')'; for (var s = 0; s < 4; s++) { var a = s * 1.57 + 0.6; c.fillRect(Math.round(bx + 2 + Math.cos(a) * (3 + sp * 8)), Math.round(by - hgt / 2 + Math.sin(a) * (3 + sp * 8)), 1, 1); } }
      }
      c.globalAlpha = alpha;
      px(c, bx, by - hgt + yoff, SLOT - 1, hgt, col);
      px(c, bx, by - hgt + yoff, SLOT - 1, 2, 'rgba(255,255,255,.22)');
      px(c, bx + SLOT - 2, by - hgt + yoff, 1, hgt, 'rgba(0,0,0,.3)');
      if (hash(seed, i + 50) > 0.55) px(c, bx, by - hgt * 0.55 + yoff, SLOT - 1, 1, err ? '#ffb0b0' : '#FAC775');
      if (!err && row.dust && i >= n - row.dust) { px(c, bx, by - hgt + yoff, SLOT - 1, 3, 'rgba(210,205,190,.75)'); px(c, bx, by - hgt + yoff, SLOT - 1, hgt, 'rgba(120,115,105,.35)'); }
      c.globalAlpha = 1;
    }
  }

  A.bgLib = function (c, t, L) {
    var sid = L.sid, P = PAL[sid] || PAL.cpp;
    c.fillStyle = '#0c0a12'; c.fillRect(0, 0, W, H);
    ({ cpp: wallCpp, arch: wallArch, phil: wallPhil, ict: wallIct }[sid] || wallCpp)(c, P, t);
    windowLight(c, P, t, sid);
    lamp(c, P, t, 120, sid); lamp(c, P, t, 360, sid);
    floor(c, P, sid);
    door(c, P, t, sid);
    /* шкаф ошибок в углу */
    var E = L.err;
    caseFrame(c, P, E.x, E.w, true);
    for (var r = 0; r < ROWS; r++) books(c, P, t, E.x, E.w, r, { fill: Math.max(0, Math.min(PER_ROW, E.fill - r * PER_ROW)), newFrom: E.newFrom != null ? Math.max(0, E.newFrom - r * PER_ROW) : null }, 900 + r, true, L.anim && E.newFrom != null ? { t0: L.anim.t0, delay: 300 } : null);
    if (E.clean && !A.lite) for (var s = 0; s < 6; s++) { var q = (t / 1800 + s / 6) % 1; px(c, E.x + 8 + (s * 9) % (E.w - 14), CASE_TOP + 150 - q * 140, 2, 2, 'rgba(159,225,203,' + (1 - q).toFixed(2) + ')'); }
    /* красная свеча над шкафом ошибок */
    var fl = Math.sin(t / 80) + Math.sin(t / 31) * 0.5; px(c, E.x + E.w / 2 - 2, CASE_TOP - 14, 4, 10, '#8a1f2b'); px(c, E.x + E.w / 2 - 2, CASE_TOP - 19 - fl, 4, 5, '#ff5a3a'); px(c, E.x + E.w / 2 - 1, CASE_TOP - 20 - fl, 2, 2, '#ffd0a0');
    if (!A.lite) { var g = c.createRadialGradient(E.x + E.w / 2, CASE_TOP - 16, 2, E.x + E.w / 2, CASE_TOP - 16, 50); g.addColorStop(0, 'rgba(255,70,50,.22)'); g.addColorStop(1, 'rgba(255,40,30,0)'); c.fillStyle = g; c.fillRect(E.x - 30, CASE_TOP - 66, E.w + 60, 100); }
    /* шкафы тем */
    L.cases.forEach(function (cs, ci) {
      caseFrame(c, P, cs.x, cs.w, false);
      cs.rows.forEach(function (row, r) { books(c, P, t, cs.x, cs.w, r, row, (row.n | 0) * 31 + ci, false, L.anim && row.newFrom != null ? { t0: L.anim.t0, delay: 500 + (ci * ROWS + r) * 160 } : null); });
    });
    /* лестница у последнего шкафа */
    var lc = L.cases[L.cases.length - 1];
    if (lc) { var lx = lc.x + lc.w + 2; c.strokeStyle = P.woodL; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, CASE_TOP + 10); c.lineTo(lx + 14, A.FLOOR_Y); c.moveTo(lx + 8, CASE_TOP + 8); c.lineTo(lx + 22, A.FLOOR_Y); c.stroke(); for (var st = 0; st < 7; st++) { var yy = CASE_TOP + 24 + st * 20, k = (yy - CASE_TOP) / (A.FLOOR_Y - CASE_TOP); px(c, lx + k * 14, yy, 9, 2, P.woodL); } }
    lectern(c, P, t, sid);
    /* подсветка полки под курсором */
    var hv = L.hover;
    if (hv) { var rr = hv.err ? { x: E.x + 2, y: CASE_TOP - 2, w: E.w - 4, h: A.FLOOR_Y - CASE_TOP } : rowRect(hv.x, hv.w, hv.r); c.strokeStyle = 'rgba(' + (hv.err ? '255,120,120' : P.glow) + ',' + (0.7 + 0.3 * Math.sin(t / 150)).toFixed(2) + ')'; c.lineWidth = 2; c.strokeRect(rr.x - 1, rr.y - 1, rr.w + 2, rr.h + 1); }
    /* виньетка */
    var vg = c.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    /* таблички с номерами — поверх всего (после виньетки, чтобы не темнели); под курсором табличка горит */
    L.cases.forEach(function (cs) {
      cs.rows.forEach(function (row, r) {
        if (row.n == null) return;
        var on = hv && !hv.err && hv.x === cs.x && hv.r === r;
        plate(c, t, cs.x + cs.w / 2, rowRect(cs.x, cs.w, r).y + ROW_H - 11, String(row.n), on, row.gold);
      });
    });
  };
  /* ---------- пиксельный шрифт для табличек: 3×5, рисуется квадратиками — цифры чёткие при любом размере ---------- */
  var GL = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
    'П': '111101101101101', 'Л': '011101101101101'
  };
  function glyphs(c, s, x, y, k, col) {
    c.fillStyle = col;
    for (var i = 0; i < s.length; i++) { var g = GL[s[i]]; if (!g) continue; for (var b = 0; b < 15; b++) if (g[b] === '1') c.fillRect(x + i * 4 * k + (b % 3) * k, y + Math.floor(b / 3) * k, k, k); }
  }
  function plate(c, t, cx, top, s, on, gold) {
    var k = 2, tw = s.length * 4 * k - k, w = tw + 8, h = 5 * k + 6, x = Math.round(cx - w / 2), y = Math.round(top);
    if (on) {   /* горит: свечение, яркая табличка, лёгкое «дыхание» */
      var a = 0.55 + 0.35 * Math.sin(t / 140);
      var g = c.createRadialGradient(cx, y + h / 2, 2, cx, y + h / 2, 26); g.addColorStop(0, 'rgba(255,220,120,' + a.toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,200,80,0)');
      c.fillStyle = g; c.fillRect(cx - 28, y - 18, 56, h + 36);
    }
    px(c, x - 1, y - 1, w + 2, h + 2, '#1a0f05');
    px(c, x, y, w, h, on ? '#fff1b8' : gold ? '#FAC775' : '#caa04e');
    px(c, x, y, w, 1, on ? '#ffffff' : '#ffe9a8'); px(c, x, y + h - 1, w, 1, on ? '#e0b040' : '#8a6a2a');
    glyphs(c, s, x + 4, y + 3, k, on ? '#7a2a00' : '#2a1a0a');
  }
  A.libRowRect = rowRect;
})();
