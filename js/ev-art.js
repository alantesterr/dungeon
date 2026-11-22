/* =====================================================================
   ОСОБЫЕ КОМНАТЫ «Всё подряд» — рисуются кодом:
     bridge — мост через пропасть (доски кладутся / рассыпаются и падают);
     dark   — тёмная комната с факелами (спички), иногда зеркало со злым двойником;
     boxes  — комната со шкатулками (буквы → слово на двери).
   A.bgEv(c, t, E)   — фон и предметы (до героя);
   A.evOver(c, t, E, hero) — то, что поверх героя: темнота с кругами света, двойник, осколки.
   ===================================================================== */
(function () {
  'use strict';
  var A = window.DA, W = 480, H = 270;
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  var FY = function () { return A.FLOOR_Y + 8; };

  /* ================= МОСТ ================= */
  var B = { x0: 96, pw: 48, n: 6 };
  A.EV = { bridgePlankX: function (i) { return B.x0 + i * B.pw + B.pw / 2; }, bridgeEnd: B.x0 + B.n * B.pw };
  function bridge(c, t, E) {
    var fy = FY();
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a1430'); g.addColorStop(0.6, '#3a2a4a'); g.addColorStop(1, '#120c1c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (var s = 0; s < 40; s++) if ((Math.floor(t / 500) + s) % 7) px(c, hash(s, 1) * W, hash(s, 2) * 110, 1, 1, 'rgba(255,255,255,.7)');
    c.fillStyle = '#e8e0ff'; c.beginPath(); c.arc(380, 46, 14, 0, 7); c.fill(); c.fillStyle = 'rgba(232,224,255,.12)'; c.beginPath(); c.arc(380, 46, 26, 0, 7); c.fill();
    /* дальние горы */
    c.fillStyle = '#2a2040'; c.beginPath(); c.moveTo(0, 170); for (var x = 0; x <= W; x += 40) c.lineTo(x, 120 + hash(x, 3) * 50); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.fillStyle = '#211934'; c.beginPath(); c.moveTo(0, 190); for (var x2 = 0; x2 <= W; x2 += 30) c.lineTo(x2, 150 + hash(x2, 4) * 40); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    /* пропасть: туман внизу */
    var fg = c.createLinearGradient(0, fy + 10, 0, H); fg.addColorStop(0, 'rgba(10,6,20,0)'); fg.addColorStop(1, 'rgba(10,6,20,.95)'); c.fillStyle = fg; c.fillRect(0, fy, W, H - fy);
    if (!A.lite) for (var f = 0; f < 5; f++) { var fx = ((t / 50 + f * 120) % (W + 200)) - 100; c.fillStyle = 'rgba(180,160,220,.07)'; c.beginPath(); c.ellipse(fx, H - 20 + f * 3, 90, 16, 0, 0, 7); c.fill(); }
    /* скалы */
    function cliff(x0, x1, right) {
      c.fillStyle = '#3b3346'; c.beginPath(); c.moveTo(x0, fy); c.lineTo(x1, fy);
      for (var y = fy; y <= H; y += 12) c.lineTo(right ? x0 + 6 + hash(y, 5) * 10 : x1 - 6 - hash(y, 6) * 10, y);
      c.lineTo(right ? x1 : x0, H); c.closePath(); c.fill();
      px(c, x0, fy, x1 - x0, 4, '#5a7a3a'); px(c, x0, fy + 4, x1 - x0, 2, '#3a5a2a');
      for (var k = x0; k < x1; k += 9) px(c, k, fy - 2 - (hash(k, 7) * 3 | 0), 2, 3, '#6f9a4e');
    }
    cliff(0, B.x0, false); cliff(B.x0 + B.n * B.pw, W, true);
    /* верёвки-перила и столбы */
    var ex = B.x0 + B.n * B.pw;
    px(c, B.x0 - 6, fy - 30, 5, 34, '#5a3a1e'); px(c, ex + 1, fy - 30, 5, 34, '#5a3a1e');
    c.strokeStyle = '#a08060'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(B.x0 - 4, fy - 28); c.quadraticCurveTo((B.x0 + ex) / 2, fy - 8, ex + 3, fy - 28); c.stroke();
    /* доски: летающий глаз опускает доску с высоты, где держал её */
    var FLY_DY = 64;   /* насколько выше моста висит глаз */
    for (var i = 0; i < B.n; i++) {
      var p = E.planks[i]; if (!p) continue;
      var k2 = Math.min(1, (t - p) / 700), ease = 1 - Math.pow(1 - k2, 3), y = fy - 1 - (1 - ease) * (FLY_DY - 4);
      plank(c, B.x0 + i * B.pw + 1, y, B.pw - 2, (1 - ease) * 0.15, 1);
      if (k2 >= 1 && t - p < 1100 && !A.lite) { var d = (t - p - 700) / 400; for (var q = 0; q < 6; q++) px(c, B.x0 + i * B.pw + 4 + q * 7, fy - 3 - d * 8, 2, 2, 'rgba(220,200,160,' + (1 - d).toFixed(2) + ')'); }
    }
    /* уроненные доски: глаз разжимает лапы — доска кувыркаясь летит в пропасть мимо моста */
    E.falls.forEach(function (F) {
      var dt = t - F.t0, x = B.x0 + F.i * B.pw + 1; if (dt < 0) return;
      var ft = dt / 1000; if (ft > 2.2) return;
      var yy = fy - FLY_DY + 4 + ft * ft * 150, a = yy > H - 20 ? Math.max(0, 1 - (yy - (H - 20)) / 40) : 1;
      c.globalAlpha = a; plank(c, x + Math.sin(ft * 5) * 4, yy, B.pw - 2, ft * 3.2, 1, ft > 0.5); c.globalAlpha = 1;
    });
    /* летающий глаз с доской: висит над следующим местом для доски */
    if (E.placed < B.n && !E.flyAway) {
      var tx = B.x0 + E.placed * B.pw + B.pw / 2; E.fx = E.fx == null ? tx + 80 : E.fx + (tx - E.fx) * 0.05;
      var bob = Math.sin(t / 380) * 4, ey = fy - FLY_DY + bob, st = E.flyT && t - E.flyT < 900 ? E.flyMood : 'idle';
      if (E.holding) {   /* доска в «лапах» под глазом */
        c.strokeStyle = 'rgba(80,40,60,.9)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(E.fx - 10, ey - 30); c.lineTo(E.fx - 14, ey + 2); c.moveTo(E.fx + 10, ey - 30); c.lineTo(E.fx + 14, ey + 2); c.stroke();
        plank(c, E.fx - B.pw / 2 + 1, ey + 2, B.pw - 2, Math.sin(t / 500) * 0.06, 1);
      }
      A.drawMonster(c, 'eye', st, E.flyT ? t - E.flyT : t, E.fx, ey, 1);
      E.flyTop = ey - 64;   /* верх монстра — для облачка с вопросом */
    }
    /* сундук на той стороне */
    var fr = A.anim.chest_full_open || [], kk = E.chestOpen ? Math.min(2, Math.floor((t - E.chestOpen) / 120)) : 0;
    A.frame(c, fr[kk], 428, fy - 40, 2.5);
    if (E.cage && A.drawCage) A.drawCage(c, t, 398, fy - 3, E.cage.kind, E.cage.openT, true);
  }
  function plank(c, x, y, w, rot, s, cracked) {
    c.save(); c.translate(x + w / 2, y + 3); c.rotate(rot || 0);
    px(c, -w / 2, -3, w, 6, '#8a5a2e'); px(c, -w / 2, -3, w, 1, '#b07a44'); px(c, -w / 2, 2, w, 1, '#5a3a1e');
    px(c, -w / 2 + 3, -1, 2, 2, '#4a2e14'); px(c, w / 2 - 5, -1, 2, 2, '#4a2e14');
    if (cracked) { c.strokeStyle = '#2a1a0a'; c.lineWidth = 1; c.beginPath(); c.moveTo(-w / 2 + 8, -3); c.lineTo(-2, 1); c.lineTo(4, -2); c.lineTo(w / 2 - 6, 3); c.stroke(); }
    c.restore();
  }

  /* ================= ТЁМНАЯ КОМНАТА ================= */
  function dark(c, t, E) {
    var fy = FY();
    px(c, 0, 0, W, H, '#14101a');
    for (var y = 20; y < A.FLOOR_Y; y += 14) for (var x = -14; x < W; x += 28) px(c, x + ((y / 14) % 2 ? 14 : 0), y, 27, 13, (hash(x, y) > 0.5) ? '#2a2430' : '#26202c');
    for (var y2 = A.FLOOR_Y; y2 < H; y2 += 10) for (var x2 = 0; x2 < W; x2 += 20) px(c, x2 + ((y2 / 10) % 2 ? 10 : 0), y2, 19, 9, '#1e1a22');
    /* капли воды */
    if (!A.lite) { var dp = (t / 1600) % 1; px(c, 236, 20 + dp * 190, 1, 3, 'rgba(160,190,230,.6)'); }
    /* дверь слева */
    px(c, 4, A.FLOOR_Y - 60, 34, 60, '#0c0a10'); px(c, 8, A.FLOOR_Y - 56, 26, 56, '#3a2818');
    E.torches.forEach(function (T) {
      /* предмет под факелом (виден, только когда факел горит — темнота его скрывает) */
      var ix = T.x;
      if (T.item === 'chest') { var fr = A.anim.chest_full_open || [], k = T.taken ? 2 : 0; A.frame(c, fr[k], ix - 20, fy - 40, 2.5); }
      else if (T.item === 'coins' && !T.taken) { for (var i = 0; i < 7; i++) { px(c, ix - 12 + (i % 4) * 7, fy - 5 - Math.floor(i / 4) * 4, 5, 3, '#FAC775'); px(c, ix - 12 + (i % 4) * 7, fy - 5 - Math.floor(i / 4) * 4, 5, 1, '#fff1b8'); } }
      else if (T.item === 'potion' && !T.taken) { px(c, ix - 4, fy - 16, 8, 11, '#c0303a'); px(c, ix - 2, fy - 20, 4, 4, '#d8d0c0'); px(c, ix - 3, fy - 14, 2, 4, 'rgba(255,255,255,.5)'); }
      else if (T.item === 'bat' && !T.taken) { var bf = Math.floor(t / 120) % 2; px(c, ix - 3, A.FLOOR_Y - 120, 6, 5, '#1a1420'); px(c, ix - 9, A.FLOOR_Y - 121 + bf * 2, 6, 3, '#1a1420'); px(c, ix + 3, A.FLOOR_Y - 121 + bf * 2, 6, 3, '#1a1420'); px(c, ix - 2, A.FLOOR_Y - 119, 1, 1, '#ff4040'); px(c, ix + 1, A.FLOOR_Y - 119, 1, 1, '#ff4040'); }
      else if (T.item === 'mirror') mirror(c, t, E, ix, fy);
      else if (T.item === 'cage' && A.drawCage) A.drawCage(c, t, ix, fy - 3, E.cageKind, T.openT, true);
      /* бра с факелом */
      px(c, T.x - 3, 100, 6, 10, '#3a3440'); px(c, T.x - 5, 98, 10, 3, '#4a4452');
      if (T.lit && !(E.dim && E.m && E.m.state !== 'gone')) A.torch(c, T.x, 96, t + T.x * 7);
      else if (T.lit) { px(c, T.x - 2, 90, 4, 6, '#6a1a1a'); }
      else { px(c, T.x - 2, 92, 4, 5, '#2a2228'); if (!A.lite && (Math.floor(t / 700) + T.x) % 5 === 0) px(c, T.x, 86, 1, 4, 'rgba(160,160,160,.25)'); }
      /* «искры» в момент зажигания */
      if (T.litT && t - T.litT < 700 && !A.lite) { var k3 = (t - T.litT) / 700; for (var s2 = 0; s2 < 10; s2++) { var a = s2 * 0.63; px(c, T.x + Math.cos(a) * k3 * 26, 92 + Math.sin(a) * k3 * 26, 2, 2, 'rgba(255,200,90,' + (1 - k3).toFixed(2) + ')'); } }
    });
    /* светящиеся глаза в темноте (до того, как всё зажжено) */
    if (!E.allLit && !A.lite) { var ex = 150 + Math.sin(t / 2000) * 120; if (Math.floor(t / 2600) % 3 !== 2) { px(c, ex, 150, 2, 1, '#ffd25a'); px(c, ex + 6, 150, 2, 1, '#ffd25a'); } }
  }
  function mirror(c, t, E, x, fy) {
    var M = E.m || { state: 'idle' }, w = 30, h = 60, top = fy - h - 4;
    px(c, x - w / 2 - 3, top - 3, w + 6, h + 6, '#8a6a2a'); px(c, x - w / 2 - 3, top - 3, w + 6, 1, '#d9b25a');
    px(c, x - w / 2 - 6, top - 8, w + 12, 6, '#8a6a2a');
    if (M.state === 'shatter' || M.state === 'gone') {
      px(c, x - w / 2, top, w, h, '#0c0a10');
      c.strokeStyle = 'rgba(200,210,230,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w / 2, top + 8); c.lineTo(x + 3, top + 30); c.lineTo(x + w / 2, top + 14); c.moveTo(x + 3, top + 30); c.lineTo(x - 4, top + h); c.stroke();
      return;
    }
    var g = c.createLinearGradient(x - w / 2, top, x + w / 2, top + h); g.addColorStop(0, '#3a4660'); g.addColorStop(0.5, '#5a6a8a'); g.addColorStop(1, '#2a3248'); c.fillStyle = g; c.fillRect(x - w / 2, top, w, h);
    /* отражение героя в зеркале (пока двойник не вышел) */
    if (M.state === 'idle' || M.state === 'turn') {
      c.save(); c.beginPath(); c.rect(x - w / 2, top, w, h); c.clip();
      c.globalAlpha = 0.55; c.filter = 'brightness(0.6)';
      var turn = M.state === 'turn' ? Math.min(1, (t - M.t0) / 3600) : 0;
      if (turn > 0.5) { c.translate(x * 2, 0); c.scale(-1, 1); }
      A.drawHero(c, 'idle', Math.floor(t / 450), x, fy - 2, 1.2);
      c.restore(); c.filter = 'none';
      if (turn > 0.6) { px(c, x - 3, fy - 46, 2, 1, '#ff3030'); px(c, x + 2, fy - 46, 2, 1, '#ff3030'); }
    }
    px(c, x - w / 2 + 3, top + 4, 2, h - 12, 'rgba(255,255,255,.18)');
  }

  /* ================= ШКАТУЛКИ ================= */
  function boxes(c, t, E) {
    var fy = FY();
    px(c, 0, 0, W, H, '#221a28');
    for (var y = 0; y < A.FLOOR_Y; y += 12) for (var x = 0; x < W + 48; x += 48) px(c, x + ((y / 12) % 2 ? 24 : 0) - 24, y, 47, 11, ((x / 48 + y / 12) % 2) ? '#3a2a40' : '#352640');
    px(c, 0, 0, W, 30, 'rgba(0,0,0,.35)');
    px(c, 0, A.FLOOR_Y, W, H - A.FLOOR_Y, '#2e1e14');
    for (var y2 = A.FLOOR_Y; y2 < H; y2 += 8) for (var x2 = -16; x2 < W; x2 += 32) px(c, x2 + ((y2 - A.FLOOR_Y) % 16 ? 16 : 0), y2, 31, 7, '#4a3222');
    /* люстра со свечами */
    px(c, 239, 0, 2, 20, '#555'); px(c, 200, 20, 80, 3, '#8a6a2a');
    for (var k = 0; k < 5; k++) { var cx = 206 + k * 17, fl = Math.sin(t / 90 + k) * 1; px(c, cx, 14, 3, 6, '#efe6d8'); px(c, cx, 10 - fl, 3, 4, '#ff9a1f'); }
    if (!A.lite) { var lg = c.createRadialGradient(240, 20, 4, 240, 20, 200); lg.addColorStop(0, 'rgba(255,190,90,.22)'); lg.addColorStop(1, 'rgba(255,150,40,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H); }
    /* дверь с ячейками для букв */
    var dx = 418, dy = A.FLOOR_Y - 92;
    px(c, dx - 4, dy - 6, 62, 98, '#22182a'); px(c, dx, dy, 54, 92, E.doorOpen ? '#0c0810' : '#5a3a1e');
    if (!E.doorOpen) {
      for (var j = 0; j < 4; j++) px(c, dx + 4, dy + 8 + j * 22, 46, 1, '#3a2412');
      px(c, dx + 44, dy + 50, 4, 4, '#d9b25a');
      var n = E.word.length, sw = Math.min(10, Math.floor(46 / n)), sx = dx + 27 - n * sw / 2;
      for (var s = 0; s < n; s++) { px(c, sx + s * sw, dy + 30, sw - 2, 12, E.solved && E.solved[s] ? '#FAC775' : '#1a1020'); }
      /* цепь и замок */
      px(c, dx + 18, dy + 58, 18, 14, '#8a8a9a'); px(c, dx + 22, dy + 52, 10, 8, '#5a5a6a'); px(c, dx + 25, dy + 63, 4, 5, '#2a2a3a');
    } else { if (!A.lite) { var dg = c.createRadialGradient(dx + 27, dy + 46, 4, dx + 27, dy + 46, 60); dg.addColorStop(0, 'rgba(255,230,150,.5)'); dg.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = dg; c.fillRect(dx - 40, dy - 20, 140, 130); } }
    /* столы и шкатулки */
    E.boxes.forEach(function (bx, i) {
      var x = bx.x;
      px(c, x - 20, fy - 22, 40, 4, '#6b4526'); px(c, x - 18, fy - 18, 3, 18, '#4a2e14'); px(c, x + 15, fy - 18, 3, 18, '#4a2e14');
      var shake = bx.shakeT && t - bx.shakeT < 500 ? Math.sin((t - bx.shakeT) / 30) * 2 : 0, by = fy - 36;
      if (bx.cage && A.drawCage) { A.drawCage(c, t, x, fy - 22, E.cageKind, bx.openT, true); if (!bx.open && E.hover === i) { c.strokeStyle = 'rgba(250,199,117,.9)'; c.lineWidth = 1; c.strokeRect(x - 19, fy - 54, 38, 34); } return; }
      if (bx.open) {
        px(c, x - 10, by + 4, 20, 10, '#7a1f2b'); px(c, x - 10, by + 4, 20, 2, '#d9b25a');
        px(c, x - 10, by - 6, 20, 4, '#9a2f3b');   /* откинутая крышка */
        if (!A.lite && t - bx.openT < 1200) { var k4 = (t - bx.openT) / 1200; c.fillStyle = 'rgba(255,230,150,' + (1 - k4).toFixed(2) + ')'; c.beginPath(); c.arc(x, by, 6 + k4 * 20, 0, 7); c.fill(); }
      } else {
        px(c, x - 10 + shake, by, 20, 14, '#9a2f3b'); px(c, x - 10 + shake, by, 20, 3, '#c84a55'); px(c, x - 10 + shake, by + 5, 20, 2, '#d9b25a'); px(c, x - 2 + shake, by + 6, 4, 4, '#ffe9a8');
        if (E.hover === i) { c.strokeStyle = 'rgba(250,199,117,.9)'; c.lineWidth = 1; c.strokeRect(x - 12, by - 2, 24, 18); }
      }
    });
  }

  A.bgEv = function (c, t, E) { ({ bridge: bridge, dark: dark, boxes: boxes }[E.kind] || (A.EV3 && A.EV3[E.kind]) || bridge)(c, t, E); };

  /* поверх героя: темнота тёмной комнаты, двойник, осколки зеркала */
  A.evOver = function (c, t, E, h) {
    if (E.kind !== 'dark') { if (A.EV3over && A.EV3over[E.kind]) A.EV3over[E.kind](c, t, E, h); return; }
    var fy = FY(), M = E.m;
    if (!E.allLit || (E.dim && M && M.state !== 'gone')) {
      var cv = E._cv || (E._cv = document.createElement('canvas')); cv.width = W; cv.height = H; var d = cv.getContext('2d');
      d.fillStyle = 'rgba(4,3,8,' + (E.dim && M && M.state !== 'gone' ? 0.985 : 0.965) + ')'; d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = 'destination-out';
      var hole = function (x, y, r, a) { var g = d.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.fillRect(x - r, y - r, r * 2, r * 2); };
      var fl = Math.sin(t / 90) * 3;
      hole(h.x, fy - 30, 62 + fl, 1);   /* факел героя */
      E.torches.forEach(function (T) { if (T.lit && !(E.dim && M && M.state !== 'gone')) hole(T.x, 120, 95 + fl, 1); });
      if (M && (M.state === 'out' || M.state === 'fight')) hole(M.x - 34, fy - 30, 40, 0.8);
      c.drawImage(cv, 0, 0);
    }
    if (M && (M.state === 'out' || M.state === 'fight' || M.state === 'shatter')) twin(c, t, E, fy);
  };
  function twin(c, t, E, fy) {
    var M = E.m, tx = M.x - 34, k = M.state === 'out' ? Math.min(1, (t - M.t0) / 2800) : 1, x = M.x + (tx - M.x) * k;
    if (M.state === 'shatter') {
      var st = (t - M.t0) / 1200; if (st > 1.3) return;
      for (var i = 0; i < 40; i++) { var a = hash(i, 9) * 6.28, v = 20 + hash(i, 10) * 70; px(c, x + Math.cos(a) * v * st, fy - 30 + Math.sin(a) * v * st + st * st * 40, 3, 2, 'rgba(200,215,240,' + Math.max(0, 1 - st).toFixed(2) + ')'); }
      return;
    }
    var shake = M.hitT && t - M.hitT < 400 ? Math.sin((t - M.hitT) / 25) * 3 : 0;
    var g = c.createRadialGradient(x, fy - 30, 4, x, fy - 30, 50); g.addColorStop(0, 'rgba(200,30,40,.28)'); g.addColorStop(1, 'rgba(120,0,20,0)'); c.fillStyle = g; c.fillRect(x - 50, fy - 80, 100, 100);
    c.save(); c.filter = 'brightness(0.28) contrast(1.6) saturate(0)'; c.translate((x + shake) * 2, 0); c.scale(-1, 1);
    A.drawHero(c, M.laughT && t - M.laughT < 600 ? 'attack' : 'idle', Math.floor(t / 300), x + shake, fy, 1.5); c.restore(); c.filter = 'none';
    var blink = Math.floor(t / 1800) % 7 === 0 && (t % 1800) < 120;
    if (!blink) { px(c, x + shake - 5, fy - 55, 2, 2, '#ff2020'); px(c, x + shake + 1, fy - 55, 2, 2, '#ff2020'); if (!A.lite) { px(c, x + shake - 6, fy - 56, 4, 4, 'rgba(255,30,30,.25)'); px(c, x + shake, fy - 56, 4, 4, 'rgba(255,30,30,.25)'); } }
    /* трещины от верных ответов */
    c.strokeStyle = 'rgba(230,240,255,.85)'; c.lineWidth = 1;
    for (var j = 0; j < (M.cracks || 0); j++) { var cx = x + shake - 8 + j * 6, cy = fy - 50 + j * 9; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 6, cy + 8); c.lineTo(cx + 2, cy + 14); c.lineTo(cx + 9, cy + 22); c.stroke(); }
  }
})();
