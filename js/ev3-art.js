/* =====================================================================
   ШАГ 3 — рисовка: суд, побег (подкоп), рыбалка на озере.
   A.EV3[kind](c, t, E) — фон и предметы; A.EV3over[kind](c, t, E, hero) — поверх героя.
   ===================================================================== */
(function () {
  'use strict';
  var A = window.DA, W = 480, H = 270;
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  var FY = function () { return A.FLOOR_Y + 8; };
  A.EV3 = {}; A.EV3over = {};

  /* ================= СУД ================= */
  A.COURT = { pro: 92, def: 396, judge: 240, hero: 326 };
  A.EV3.court = function (c, t, E) {
    var fy = FY();
    /* стены: тёмные дубовые панели, колонны, герб с весами */
    px(c, 0, 0, W, A.FLOOR_Y, '#2a1a12');
    for (var x = 0; x < W; x += 40) { px(c, x, 30, 38, A.FLOOR_Y - 30, '#3a2418'); px(c, x + 4, 40, 30, 70, '#432a1c'); px(c, x + 4, 120, 30, 80, '#432a1c'); px(c, x + 38, 30, 2, A.FLOOR_Y - 30, '#1e120c'); }
    px(c, 0, 24, W, 8, '#5a3a22'); px(c, 0, 24, W, 1, '#8a6a3a');
    [20, 160, 320, 460].forEach(function (cx) { px(c, cx - 7, 32, 14, A.FLOOR_Y - 32, '#6b5a48'); px(c, cx - 9, 32, 18, 5, '#8a7a64'); px(c, cx - 9, A.FLOOR_Y - 6, 18, 6, '#8a7a64'); for (var k = 0; k < 3; k++) px(c, cx - 4 + k * 4, 38, 1, A.FLOOR_Y - 46, 'rgba(0,0,0,.2)'); });
    /* герб: весы */
    var gx = 240, gy = 22; px(c, gx - 26, gy - 16, 52, 34, '#7a1f2b'); px(c, gx - 26, gy - 16, 52, 2, '#FAC775'); px(c, gx - 1, gy - 12, 2, 22, '#FAC775'); px(c, gx - 16, gy - 9, 32, 2, '#FAC775');
    var tilt = E.tug ? Math.max(-4, Math.min(4, E.tug)) : 0;
    px(c, gx - 19, gy - 5 + tilt, 8, 3, '#FAC775'); px(c, gx + 11, gy - 5 - tilt, 8, 3, '#FAC775');
    /* пол */
    px(c, 0, A.FLOOR_Y, W, H - A.FLOOR_Y, '#2a1a10');
    for (var y = A.FLOOR_Y; y < H; y += 8) for (var x2 = -16; x2 < W; x2 += 32) px(c, x2 + ((y - A.FLOOR_Y) % 16 ? 16 : 0), y, 31, 7, ((x2 / 32 + y / 8) % 2) ? '#4a2e1a' : '#43291a');
    px(c, 170, A.FLOOR_Y + 6, 140, H - A.FLOOR_Y - 6, '#5a1a22'); px(c, 174, A.FLOOR_Y + 10, 132, 2, '#FAC775');
    /* присяжные-тени (слева сзади): кивают, ахают */
    for (var j = 0; j < 6; j++) {
      var jx = 26 + (j % 3) * 22, jy = 118 + Math.floor(j / 3) * 20, mood = E.juryT && t - E.juryT < 900 ? E.jury : 0, bob = mood > 0 ? Math.sin((t - E.juryT) / 90 + j) * 2 : mood < 0 ? -Math.abs(Math.sin((t - E.juryT) / 60 + j)) * 3 : Math.sin(t / 1400 + j) * 0.6;
      px(c, jx - 6, jy + 6, 12, 14, '#120a08'); c.fillStyle = '#120a08'; c.beginPath(); c.arc(jx, jy + bob, 5, 0, 7); c.fill();
      px(c, jx - 2, jy - 1 + bob, 1, 1, 'rgba(255,220,150,.5)'); px(c, jx + 1, jy - 1 + bob, 1, 1, 'rgba(255,220,150,.5)');
    }
    px(c, 14, 150, 80, 6, '#5a3a22');
    /* судейская трибуна и сова-судья */
    var J = A.COURT.judge;
    A.drawPet(c, 'owl', E.judgeSleep ? 'sleep' : 'idle', t, J, 112, false, 3.2);
    px(c, J - 22, 98, 44, 20, '#141018'); px(c, J - 6, 98, 12, 6, '#efe6d8');   /* мантия и жабо */
    px(c, J - 60, 116, 120, 98, '#5a3a22'); px(c, J - 60, 116, 120, 4, '#8a6a3a'); px(c, J - 64, 112, 128, 5, '#6b4526'); px(c, J - 64, 112, 128, 1, '#a08050');
    px(c, J - 14, 140, 28, 28, '#7a1f2b'); px(c, J - 10, 144, 20, 20, '#FAC775'); px(c, J - 1, 147, 2, 14, '#7a1f2b'); px(c, J - 8, 150, 16, 2, '#7a1f2b');
    /* молоток */
    var gk = E.gavelT ? Math.max(0, 1 - (t - E.gavelT) / 280) : 0, ga = -0.9 + (1 - gk) * 0.9;
    c.save(); c.translate(J + 34, 110); c.rotate(gk > 0 ? -gk * 1.1 : 0); px(c, 0, -2, 16, 3, '#8a5a2e'); px(c, 12, -6, 7, 10, '#6b4526'); c.restore();
    if (E.gavelT && t - E.gavelT < 400 && !A.lite) { var sk = (t - E.gavelT) / 400; for (var s = 0; s < 6; s++) px(c, J + 48 + Math.cos(s) * sk * 14, 112 + Math.sin(s) * sk * 10, 2, 2, 'rgba(255,230,150,' + (1 - sk).toFixed(2) + ')'); }
    /* «материалы дела» на столе адвоката */
    px(c, A.COURT.hero - 30, fy - 30, 46, 6, '#6b4526'); px(c, A.COURT.hero - 28, fy - 24, 3, 24, '#4a2e14'); px(c, A.COURT.hero + 12, fy - 24, 3, 24, '#4a2e14');
    px(c, A.COURT.hero - 24, fy - 36, 22, 6, E.fileOpen ? '#efe6d8' : '#c9a24a'); px(c, A.COURT.hero - 24, fy - 36, 22, 1, '#8a6a2a'); px(c, A.COURT.hero - 18, fy - 34, 9, 3, '#a32d2d');
    /* прокурор (монстр) */
    if (E.proKey) { var ps = E.proT && t - E.proT < 600 ? (E.proMood > 0 ? 'attack' : 'hit') : 'idle'; A.drawMonster(c, E.proKey, ps, E.proT ? t - E.proT : t, A.COURT.pro, fy, 1); if (E.proMood < 0 && E.proT && t - E.proT < 1200 && !A.lite) { px(c, A.COURT.pro + 10, fy - 50 + ((t - E.proT) / 30 % 10), 2, 3, '#85B7EB'); } }
    /* скамья подсудимого: деревянная загородка, внутри — подзащитный */
    var D2 = A.COURT.def;
    if (!(E.verdict === 'jail' && t - E.vT > 2600)) { px(c, D2 - 18, fy - 16, 36, 4, '#6b4526'); A.drawPet(c, E.defKind, E.verdict === 'free' ? 'meow' : E.verdict === 'jail' ? 'lay' : 'sit', t, D2, fy - 16, true, 1.7); }
    px(c, D2 - 30, fy - 22, 60, 22, '#5a3a22'); px(c, D2 - 30, fy - 22, 60, 3, '#8a6a3a'); for (var b = D2 - 26; b < D2 + 30; b += 10) px(c, b, fy - 18, 2, 18, '#3a2412');
    if (E.verdict === 'jail') {   /* сверху падает решётка, потом уводят */
      var vk = Math.min(1, (t - E.vT) / 500), yb = -70 + vk * (fy - 70 + 70);
      for (var bb = D2 - 30; bb <= D2 + 30; bb += 6) px(c, bb, Math.min(yb, fy - 70), 3, 70, '#9a94a4');
      px(c, D2 - 32, Math.min(yb, fy - 70), 64, 4, '#6a6470');
    }
    if (E.verdict === 'free' && !A.lite) {   /* конфетти */
      for (var cf = 0; cf < 60; cf++) { var ck = ((t - E.vT) / 2400 + hash(cf, 1)) % 1; px(c, hash(cf, 2) * W, ck * H - 10, 3, 2, ['#FAC775', '#5DCAA5', '#F09595', '#85B7EB', '#AFA9EC'][cf % 5]); }
    }
  };

  /* ================= ПОБЕГ: подкоп в разрезе ================= */
  A.ESC_STEPS = 5;
  A.EV3.escape = function (c, t, E) {
    var surf = 70;
    var g = c.createLinearGradient(0, 0, 0, surf); g.addColorStop(0, '#0e1430'); g.addColorStop(1, '#2a3060'); c.fillStyle = g; c.fillRect(0, 0, W, surf);
    for (var s = 0; s < 20; s++) px(c, hash(s, 3) * W, hash(s, 4) * 50, 1, 1, '#fff');
    /* тюрьма сверху слева */
    px(c, 20, surf - 56, 140, 56, '#4a4652'); for (var by = surf - 56; by < surf; by += 8) for (var bx = 20; bx < 160; bx += 16) px(c, bx + ((by / 8) % 2 ? 8 : 0), by, 15, 7, '#57525f');
    px(c, 70, surf - 40, 30, 24, '#1a1620'); for (var k = 0; k < 5; k++) px(c, 72 + k * 6, surf - 40, 2, 24, '#9a94a4');
    if (!A.lite && Math.floor(t / 900) % 2) { var sx = 200 + Math.sin(t / 1500) * 120; c.fillStyle = 'rgba(255,240,180,.08)'; c.beginPath(); c.moveTo(150, surf - 50); c.lineTo(sx - 30, surf); c.lineTo(sx + 30, surf); c.fill(); }   /* луч прожектора */
    /* земля */
    px(c, 0, surf, W, H - surf, '#24160c');
    for (var y = surf; y < H; y += 10) for (var x = 0; x < W; x += 20) { var l = y < 120 ? '#4a3220' : y < 190 ? '#3a2616' : '#2a1a10'; px(c, x + ((y / 10) % 2 ? 10 : 0), y, 19, 9, l); }
    for (var r = 0; r < 18; r++) px(c, hash(r, 7) * W, surf + 10 + hash(r, 8) * 180, 4 + hash(r, 9) * 6, 3, '#6b6460');
    px(c, 0, surf, W, 3, '#3a5a2a');
    /* решётка-выход на поверхности справа */
    px(c, 400, surf - 4, 40, 6, '#6a6470'); for (var k2 = 0; k2 < 6; k2++) px(c, 402 + k2 * 7, surf - 3, 2, 4, '#2a2630');
    /* тоннель: из камеры вниз, вправо и вверх к решётке; копается по шагам */
    var path = [[85, surf], [85, 150], [180, 190], [290, 190], [380, 150], [420, surf]];
    var dug = E.dug || 0, prog = Math.min(dug, A.ESC_STEPS), anim = E.digT ? Math.min(1, (t - E.digT) / 900) : 1, total = Math.max(0, prog - 1 + anim);
    var segs = path.length - 1, upto = total / A.ESC_STEPS * segs;
    c.strokeStyle = '#120a06'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(path[0][0], path[0][1]);
    var head = path[0];
    for (var i = 0; i < segs; i++) {
      var a = path[i], b2 = path[i + 1], f = Math.max(0, Math.min(1, upto - i)); if (f <= 0) break;
      head = [a[0] + (b2[0] - a[0]) * f, a[1] + (b2[1] - a[1]) * f]; c.lineTo(head[0], head[1]);
    }
    c.stroke(); c.lineWidth = 1;
    E.head = head;
    /* копатель — подзащитный */
    var free = E.free && t - E.freeT > 0;
    if (!free) {
      A.drawPet(c, E.defKind, anim < 1 ? 'run' : 'idle', t, head[0], head[1] + 6, false, 1.4);
      if (anim < 1 && !A.lite) for (var d = 0; d < 6; d++) { var dk = ((t / 300) + d / 6) % 1; px(c, head[0] + 6 + dk * 14, head[1] - dk * 10 + dk * dk * 14, 2, 2, '#6b4526'); }
    } else {
      var fk = Math.min(1, (t - E.freeT) / 900);
      A.drawPet(c, E.defKind, 'meow', t, 420 + fk * 10, surf - fk * 4, false, 1.6);
      if (!A.lite) for (var st = 0; st < 12; st++) { var sa = st * 0.52, sr = fk * 30; px(c, 420 + Math.cos(sa) * sr, surf - 14 + Math.sin(sa) * sr, 2, 2, 'rgba(255,230,150,' + (1 - fk).toFixed(2) + ')'); }
    }
    /* шаги подкопа */
    for (var p = 0; p < A.ESC_STEPS; p++) px(c, 180 + p * 26, 246, 20, 8, p < prog ? '#FAC775' : 'rgba(255,255,255,.12)');
  };

  /* ================= РЫБАЛКА ================= */
  A.LAKE = { pier: 250, rodX: 262, floatX: 380, water: A.FLOOR_Y + 14 };
  A.EV3.fish = function (c, t, E) {
    var Wy = A.LAKE.water;
    var g = c.createLinearGradient(0, 0, 0, Wy); g.addColorStop(0, '#1c1840'); g.addColorStop(0.55, '#5a3a6a'); g.addColorStop(1, '#d98a5a'); c.fillStyle = g; c.fillRect(0, 0, W, Wy);
    for (var s = 0; s < 26; s++) if ((Math.floor(t / 600) + s) % 6) px(c, hash(s, 1) * W, hash(s, 2) * 80, 1, 1, 'rgba(255,255,255,.75)');
    c.fillStyle = '#ffd9a0'; c.beginPath(); c.arc(360, Wy - 18, 16, Math.PI, 0); c.fill();
    /* лес на дальнем берегу */
    c.fillStyle = '#20183a'; c.beginPath(); c.moveTo(0, Wy); for (var x = 0; x <= W; x += 12) c.lineTo(x, Wy - 24 - hash(x, 5) * 26); c.lineTo(W, Wy); c.fill();
    c.fillStyle = '#16102a'; for (var tr = 0; tr < 9; tr++) { var tx = 20 + tr * 55, th = 40 + hash(tr, 6) * 30; c.beginPath(); c.moveTo(tx, Wy - 10); c.lineTo(tx + 12, Wy - 10 - th); c.lineTo(tx + 24, Wy - 10); c.fill(); }
    /* вода с бликами */
    var wg = c.createLinearGradient(0, Wy, 0, H); wg.addColorStop(0, '#3a3a6a'); wg.addColorStop(1, '#141432'); c.fillStyle = wg; c.fillRect(0, Wy, W, H - Wy);
    for (var l = 0; l < 22; l++) { var lx = (hash(l, 9) * W + t / (40 + l)) % W, ly = Wy + 4 + hash(l, 10) * (H - Wy - 8); px(c, lx, ly, 8 + hash(l, 11) * 18, 1, 'rgba(255,217,160,' + (0.12 + 0.1 * Math.sin(t / 500 + l)).toFixed(2) + ')'); }
    px(c, 344, Wy + 2, 32, 1, 'rgba(255,217,160,.5)'); px(c, 350, Wy + 6, 20, 1, 'rgba(255,217,160,.35)');
    /* туман */
    if (!A.lite) for (var f = 0; f < 4; f++) { var fx = ((t / 70 + f * 150) % (W + 200)) - 100; c.fillStyle = 'rgba(220,200,240,.06)'; c.beginPath(); c.ellipse(fx, Wy + 8, 100, 10, 0, 0, 7); c.fill(); }
    /* берег слева, камыши */
    c.fillStyle = '#2a3a22'; c.beginPath(); c.moveTo(0, Wy - 6); c.lineTo(120, Wy - 4); c.lineTo(150, H); c.lineTo(0, H); c.fill();
    for (var rd = 0; rd < 14; rd++) { var rx = 100 + rd * 9 + (rd % 2) * 3, rh = 22 + hash(rd, 12) * 18, sw = Math.sin(t / 700 + rd) * 2; c.strokeStyle = '#4a6a2a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(rx, H - 30 + (rd % 3) * 8); c.lineTo(rx + sw, H - 30 - rh + (rd % 3) * 8); c.stroke(); px(c, rx + sw - 1, H - 34 - rh + (rd % 3) * 8, 3, 7, '#6b4526'); }
    /* мостки */
    px(c, 120, A.FLOOR_Y, A.LAKE.pier - 120 + 30, 6, '#8a5a2e'); px(c, 120, A.FLOOR_Y, A.LAKE.pier - 120 + 30, 1, '#b07a44');
    for (var pl = 130; pl < A.LAKE.pier + 30; pl += 28) px(c, pl, A.FLOOR_Y + 6, 4, 40, '#5a3a1e');
    /* сундук с удочками на мостках */
    px(c, 138, A.FLOOR_Y - 14, 26, 14, '#6b4526'); px(c, 138, A.FLOOR_Y - 14, 26, 3, '#8a5a2e'); px(c, 149, A.FLOOR_Y - 9, 4, 4, '#d9b25a');
    for (var u = 0; u < 3; u++) { c.strokeStyle = '#c9a24a'; c.beginPath(); c.moveTo(142 + u * 6, A.FLOOR_Y - 14); c.lineTo(136 + u * 8, A.FLOOR_Y - 40); c.stroke(); }
    /* фонарь */
    px(c, 236, A.FLOOR_Y - 30, 2, 30, '#3a2412'); px(c, 232, A.FLOOR_Y - 38, 10, 9, '#ffcf6a');
    if (!A.lite) { var lg = c.createRadialGradient(237, A.FLOOR_Y - 34, 2, 237, A.FLOOR_Y - 34, 60); lg.addColorStop(0, 'rgba(255,200,110,.28)'); lg.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = lg; c.fillRect(170, A.FLOOR_Y - 100, 130, 130); }
    /* светлячки */
    if (!A.lite) for (var ff = 0; ff < 8; ff++) { var fa = t / 1600 + ff * 1.7; if ((Math.floor(t / 400) + ff) % 3) px(c, 60 + ff * 40 + Math.sin(fa) * 14, Wy - 40 + Math.cos(fa * 1.3) * 12, 2, 2, 'rgba(220,255,140,.85)'); }
  };
  /* поверх героя: удочка, леска, поплавок, рыба */
  A.EV3over.fish = function (c, t, E, h) {
    if (!E.rod) return;
    var hx = h.x + 10, hy = A.FLOOR_Y - 36, tip = [hx + 34, hy - 22], fl = E.floatX || A.LAKE.floatX, wy = A.LAKE.water + 6;
    c.strokeStyle = '#8a5a2e'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, hy + 8); c.lineTo(tip[0], tip[1]); c.stroke();
    var bite = E.bite, dip = bite ? Math.abs(Math.sin(t / 70)) * 5 + 2 : Math.sin(t / 600) * 1.2, snap = E.snapT && t - E.snapT < 900;
    if (!snap && E.state !== 'idle') {
      c.strokeStyle = 'rgba(230,230,230,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo((tip[0] + fl) / 2, tip[1] + 30, fl, wy + dip - 4); c.stroke();
      px(c, fl - 2, wy + dip - 6, 4, 3, '#E24B4A'); px(c, fl - 2, wy + dip - 3, 4, 3, '#efe6d8');
      if (!A.lite) { var rk = (t / 1200) % 1; c.strokeStyle = 'rgba(255,255,255,' + (0.35 * (1 - rk)).toFixed(2) + ')'; c.beginPath(); c.ellipse(fl, wy + 1, 4 + rk * 14, 1 + rk * 3, 0, 0, 7); c.stroke(); }
      if (bite && !A.lite) for (var s = 0; s < 5; s++) px(c, fl - 8 + s * 4, wy - 2 - Math.abs(Math.sin(t / 90 + s)) * 6, 2, 2, 'rgba(200,220,255,.8)');
    }
    if (snap) { var k = (t - E.snapT) / 900; c.strokeStyle = 'rgba(230,230,230,' + (1 - k).toFixed(2) + ')'; c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(tip[0] + 20, tip[1] + 30 + k * 20); c.stroke(); fishSprite(c, E.fishKind, fl + k * 30, wy + 4 - Math.sin(k * Math.PI) * 30, false, 1 - k); }
    if (E.catchT && t - E.catchT < 1400) {   /* рыба вылетает дугой к герою */
      var ck = Math.min(1, (t - E.catchT) / 1100), fx = fl + (h.x - 6 - fl) * ck, fy2 = wy - Math.sin(ck * Math.PI) * 70 + (hy - wy) * ck;
      fishSprite(c, E.fishKind, fx, fy2, true, 1, t);
      if (ck < 0.3) for (var sp = 0; sp < 8; sp++) px(c, fl - 10 + sp * 3, wy - ck * 40 - Math.abs(Math.sin(sp)) * 10, 2, 2, 'rgba(200,220,255,.8)');
    }
  };
  var FISH_COL = { gold: ['#FAC775', '#ffe9a8'], ghost: ['rgba(200,215,255,.7)', 'rgba(255,255,255,.8)'], carp: ['#c9a24a', '#e8d098'], perch: ['#5a8a3a', '#d8a040'], pike: ['#4a6a4a', '#a8c088'], roach: ['#aab4c8', '#e8eef8'] };
  function fishSprite(c, kind, x, y, flip, a, t) {
    var C = FISH_COL[kind] || FISH_COL.carp; c.save(); c.globalAlpha = a == null ? 1 : a; c.translate(x, y); if (flip) c.scale(-1, 1);
    c.fillStyle = C[0]; c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(7, 0); c.lineTo(14, -5); c.lineTo(14, 5); c.fill();
    c.fillStyle = C[1]; c.fillRect(-6, -1, 8, 2); c.fillStyle = '#1a1008'; c.fillRect(-6, -2, 2, 2);
    if (kind === 'gold' && t) { c.fillStyle = 'rgba(255,240,180,' + (0.5 + 0.5 * Math.sin(t / 90)).toFixed(2) + ')'; c.fillRect(-2, -7, 2, 2); c.fillRect(4, 5, 2, 2); }
    c.restore();
  }
  A.fishSprite = fishSprite;
})();
