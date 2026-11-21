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
  A.COURT = { pro: 122, def: 396, judge: 240, hero: 326 };
  A.EV3.court = function (c, t, E) {
    var fy = FY();
    /* стены: тёмные дубовые панели, колонны, герб с весами */
    px(c, 0, 0, W, A.FLOOR_Y, '#2a1a12');
    for (var x = 0; x < W; x += 40) { px(c, x, 30, 38, A.FLOOR_Y - 30, '#3a2418'); px(c, x + 4, 40, 30, 70, '#432a1c'); px(c, x + 4, 120, 30, 80, '#432a1c'); px(c, x + 38, 30, 2, A.FLOOR_Y - 30, '#1e120c'); }
    px(c, 0, 24, W, 8, '#5a3a22'); px(c, 0, 24, W, 1, '#8a6a3a');
    [20, 160, 320, 460].forEach(function (cx) { px(c, cx - 7, 32, 14, A.FLOOR_Y - 32, '#6b5a48'); px(c, cx - 9, 32, 18, 5, '#8a7a64'); px(c, cx - 9, A.FLOOR_Y - 6, 18, 6, '#8a7a64'); for (var k = 0; k < 3; k++) px(c, cx - 4 + k * 4, 38, 1, A.FLOOR_Y - 46, 'rgba(0,0,0,.2)'); });
    /* герб: весы */
    var gx = 400, gy = 62; px(c, gx - 26, gy - 16, 52, 34, '#7a1f2b'); px(c, gx - 26, gy - 16, 52, 2, '#FAC775'); px(c, gx - 1, gy - 12, 2, 22, '#FAC775'); px(c, gx - 16, gy - 9, 32, 2, '#FAC775');
    var tilt = E.tug ? Math.max(-4, Math.min(4, E.tug)) : 0;
    px(c, gx - 19, gy - 5 + tilt, 8, 3, '#FAC775'); px(c, gx + 11, gy - 5 - tilt, 8, 3, '#FAC775');
    /* пол */
    px(c, 0, A.FLOOR_Y, W, H - A.FLOOR_Y, '#2a1a10');
    for (var y = A.FLOOR_Y; y < H; y += 8) for (var x2 = -16; x2 < W; x2 += 32) px(c, x2 + ((y - A.FLOOR_Y) % 16 ? 16 : 0), y, 31, 7, ((x2 / 32 + y / 8) % 2) ? '#4a2e1a' : '#43291a');
    px(c, 170, A.FLOOR_Y + 6, 140, H - A.FLOOR_Y - 6, '#5a1a22'); px(c, 174, A.FLOOR_Y + 10, 132, 2, '#FAC775');
    /* присяжные-тени (слева сзади): кивают, ахают */
    for (var j = 0; j < 6; j++) {
      var jx = 18 + (j % 3) * 20, jy = 112 + Math.floor(j / 3) * 20, mood = E.juryT && t - E.juryT < 900 ? E.jury : 0, bob = mood > 0 ? Math.sin((t - E.juryT) / 90 + j) * 2 : mood < 0 ? -Math.abs(Math.sin((t - E.juryT) / 60 + j)) * 3 : Math.sin(t / 1400 + j) * 0.6;
      px(c, jx - 6, jy + 6, 12, 14, '#120a08'); c.fillStyle = '#120a08'; c.beginPath(); c.arc(jx, jy + bob, 5, 0, 7); c.fill();
      px(c, jx - 2, jy - 1 + bob, 1, 1, 'rgba(255,220,150,.5)'); px(c, jx + 1, jy - 1 + bob, 1, 1, 'rgba(255,220,150,.5)');
    }
    px(c, 14, 150, 80, 6, '#5a3a22');
    /* судейская трибуна и сова-судья */
    var J = A.COURT.judge;
    judgeOwl(c, t, E, J, 116);

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
    prosecutor(c, t, E, A.COURT.pro, fy);
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

  /* ---------- СОВА-СУДЬЯ: крупная, в парике с буклями и мантии; глаза следят за говорящим, брови хмурятся ---------- */
  function judgeOwl(c, t, E, x, base) {
    var angry = (E.gavelT && t - E.gavelT < 900) || E.verdict === 'jail', pleased = E.verdict === 'free';
    var breathe = Math.sin(t / 700) * 0.8, y = base + breathe;
    var look = E.look === 'pro' ? -1 : E.look === 'hero' ? 1 : Math.sin(t / 2500) * 0.6;
    /* тень за судьёй и тёплый ореол */
    if (!A.lite) { var g = c.createRadialGradient(x, y - 40, 6, x, y - 40, 70); g.addColorStop(0, angry ? 'rgba(255,80,60,.22)' : 'rgba(255,200,110,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 80, y - 120, 160, 130); }
    /* тело и мантия */
    c.fillStyle = '#5a3a1e'; c.beginPath(); c.ellipse(x, y - 22, 27, 30, 0, 0, 7); c.fill();
    c.fillStyle = '#141018'; c.beginPath(); c.moveTo(x - 30, y + 2); c.lineTo(x - 24, y - 36); c.lineTo(x + 24, y - 36); c.lineTo(x + 30, y + 2); c.fill();
    px(c, x - 1, y - 34, 2, 34, '#2a2030');
    for (var f = 0; f < 4; f++) { px(c, x - 26 + f * 2, y - 30 + f * 8, 3, 6, '#22182a'); px(c, x + 23 - f * 2, y - 30 + f * 8, 3, 6, '#22182a'); }   /* складки */
    /* жабо */
    c.fillStyle = '#efe6d8'; c.beginPath(); c.moveTo(x - 9, y - 38); c.lineTo(x, y - 24); c.lineTo(x + 9, y - 38); c.fill();
    px(c, x - 3, y - 30, 6, 2, '#d8cfc0'); px(c, x - 2, y - 27, 4, 2, '#d8cfc0');
    /* крылья: левое лежит на трибуне, правое держит молоток */
    c.fillStyle = '#4a2e14'; c.beginPath(); c.ellipse(x - 30, y - 12, 8, 18, 0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 30, y - 14, 8, 18, -0.5, 0, 7); c.fill();
    for (var w = 0; w < 4; w++) { px(c, x - 35 + w * 2, y - 4 + w * 2, 4, 2, '#6b4526'); px(c, x + 31 - w * 2, y - 6 + w * 2, 4, 2, '#6b4526'); }
    /* голова */
    var hy = y - 66;
    c.fillStyle = '#7a5030'; c.beginPath(); c.ellipse(x, hy, 26, 21, 0, 0, 7); c.fill();
    /* ушные пучки */
    c.fillStyle = '#5a3a1e'; c.beginPath(); c.moveTo(x - 22, hy - 12); c.lineTo(x - 26, hy - 30); c.lineTo(x - 12, hy - 18); c.fill(); c.beginPath(); c.moveTo(x + 22, hy - 12); c.lineTo(x + 26, hy - 30); c.lineTo(x + 12, hy - 18); c.fill();
    /* парик с буклями */
    for (var k = 0; k < 6; k++) { var wy = hy - 8 + k * 7; c.fillStyle = k % 2 ? '#d8d2c6' : '#efe9dd'; c.beginPath(); c.arc(x - 27, wy, 5, 0, 7); c.fill(); c.beginPath(); c.arc(x + 27, wy, 5, 0, 7); c.fill(); }
    c.fillStyle = '#efe9dd'; c.beginPath(); c.ellipse(x, hy - 17, 20, 6, 0, Math.PI, 0); c.fill(); for (var k2 = -2; k2 <= 2; k2++) { c.fillStyle = '#d8d2c6'; c.beginPath(); c.arc(x + k2 * 8, hy - 18, 3.5, 0, 7); c.fill(); }
    /* лицевой диск */
    c.fillStyle = '#c8a070'; c.beginPath(); c.arc(x - 11, hy + 1, 12, 0, 7); c.fill(); c.beginPath(); c.arc(x + 11, hy + 1, 12, 0, 7); c.fill();
    c.strokeStyle = '#8a6040'; c.lineWidth = 1; c.beginPath(); c.arc(x - 11, hy + 1, 12, 0.2, 2.9); c.stroke(); c.beginPath(); c.arc(x + 11, hy + 1, 12, 0.25, 2.95); c.stroke();
    /* глаза */
    var blink = Math.floor(t / 3700) % 3 === 0 && t % 3700 < 140;
    [-11, 11].forEach(function (ex) {
      var cx = x + ex, cy = hy;
      if (blink) { px(c, cx - 8, cy - 1, 16, 3, '#5a3a1e'); return; }
      c.fillStyle = angry ? '#ff6a3a' : '#FAC775'; c.beginPath(); c.arc(cx, cy, 8.5, 0, 7); c.fill();
      c.fillStyle = angry ? '#c02010' : '#EF9F27'; c.beginPath(); c.arc(cx + look * 2, cy, 5.5, 0, 7); c.fill();
      c.fillStyle = '#120806'; c.beginPath(); c.arc(cx + look * 3, cy, angry ? 2.2 : pleased ? 4.2 : 3.3, 0, 7); c.fill();
      px(c, cx + look * 3 - 3, cy - 4, 2, 2, '#fff');
      if (angry && !A.lite) { c.fillStyle = 'rgba(255,60,30,.25)'; c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fill(); }
    });
    /* брови: спокойные / нахмуренные / довольные */
    c.strokeStyle = '#3a2412'; c.lineWidth = 3; c.beginPath();
    if (angry) { c.moveTo(x - 20, hy - 12); c.lineTo(x - 4, hy - 7); c.moveTo(x + 20, hy - 12); c.lineTo(x + 4, hy - 7); }
    else if (pleased) { c.moveTo(x - 19, hy - 9); c.quadraticCurveTo(x - 11, hy - 15, x - 4, hy - 10); c.moveTo(x + 19, hy - 9); c.quadraticCurveTo(x + 11, hy - 15, x + 4, hy - 10); }
    else { c.moveTo(x - 19, hy - 11); c.lineTo(x - 4, hy - 10); c.moveTo(x + 19, hy - 11); c.lineTo(x + 4, hy - 10); }
    c.stroke(); c.lineWidth = 1;
    /* клюв */
    c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(x - 4, hy + 6); c.lineTo(x + 4, hy + 6); c.lineTo(x, hy + 14); c.fill(); px(c, x - 1, hy + 7, 2, 2, '#8a6a2a');
    /* перья на груди (видны над мантией) */
    for (var p2 = 0; p2 < 5; p2++) { px(c, x - 14 + p2 * 6, y - 44, 3, 2, '#a07a4a'); }
  }

  /* ---------- ПРОКУРОР: демон-юрист в костюме, рога, монокль, красный галстук, плащ ----------
     Состояния: idle (дышит, барабанит пальцами), point (тычет пальцем в героя — читает обвинение),
     gloat (злорадно хохочет — ты ошибся), sweat (пятится, потеет — ты прав). */
  function prosecutor(c, t, E, x, fy) {
    var st = E.proT && t - E.proT < 1700 ? (E.proMood > 0 ? 'gloat' : 'sweat') : E.pointT && t - E.pointT < 2600 ? 'point' : 'idle';
    if (E.verdict === 'jail') st = 'gloat'; else if (E.verdict === 'free') st = 'sweat';
    var k = st === 'gloat' ? Math.abs(Math.sin(t / 70)) * 2 : 0, back = st === 'sweat' ? -Math.min(6, (t - (E.proT || t)) / 120) : 0;
    x += back; var y = fy - k;
    /* красная аура */
    if (!A.lite) { var fl = 0.18 + 0.08 * Math.sin(t / 130) + (st === 'gloat' ? 0.12 : 0); var g = c.createRadialGradient(x, y - 44, 6, x, y - 44, 64); g.addColorStop(0, 'rgba(200,20,40,' + fl.toFixed(3) + ')'); g.addColorStop(1, 'rgba(80,0,20,0)'); c.fillStyle = g; c.fillRect(x - 70, y - 120, 140, 130); }
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(x, fy, 20, 5, 0, 0, 7); c.fill();
    /* плащ (развевается) */
    var wave = Math.sin(t / 260) * 3;
    c.fillStyle = '#5a0f18'; c.beginPath(); c.moveTo(x - 16, y - 62); c.quadraticCurveTo(x - 30 - wave, y - 30, x - 26 - wave, y - 2); c.lineTo(x + 26 + wave, y - 2); c.quadraticCurveTo(x + 30 + wave, y - 30, x + 16, y - 62); c.fill();
    c.fillStyle = '#a02030'; c.beginPath(); c.moveTo(x - 14, y - 60); c.quadraticCurveTo(x - 24 - wave, y - 30, x - 22 - wave, y - 4); c.lineTo(x - 16, y - 4); c.lineTo(x - 12, y - 58); c.fill();
    /* ноги, туфли */
    px(c, x - 9, y - 26, 8, 24, '#16121c'); px(c, x + 1, y - 26, 8, 24, '#16121c'); px(c, x - 10, y - 3, 10, 4, '#0a080c'); px(c, x, y - 3, 11, 4, '#0a080c'); px(c, x - 8, y - 3, 3, 1, '#5a5a6a'); px(c, x + 3, y - 3, 3, 1, '#5a5a6a');
    /* пиджак */
    px(c, x - 14, y - 62, 28, 38, '#1e1828'); px(c, x - 14, y - 62, 2, 38, '#2e2640'); px(c, x + 12, y - 62, 2, 38, '#141018');
    c.fillStyle = '#efe6d8'; c.beginPath(); c.moveTo(x - 6, y - 62); c.lineTo(x, y - 44); c.lineTo(x + 6, y - 62); c.fill();   /* рубашка */
    c.fillStyle = '#2e2640'; c.beginPath(); c.moveTo(x - 7, y - 62); c.lineTo(x - 1, y - 42); c.lineTo(x - 9, y - 50); c.fill(); c.beginPath(); c.moveTo(x + 7, y - 62); c.lineTo(x + 1, y - 42); c.lineTo(x + 9, y - 50); c.fill();   /* лацканы */
    px(c, x - 2, y - 61, 4, 3, '#c0303a'); c.fillStyle = '#c0303a'; c.beginPath(); c.moveTo(x - 2, y - 58); c.lineTo(x + 2, y - 58); c.lineTo(x + 3, y - 46); c.lineTo(x, y - 43); c.lineTo(x - 3, y - 46); c.fill();   /* галстук */
    px(c, x - 1, y - 36, 2, 2, '#c9a24a'); px(c, x - 1, y - 30, 2, 2, '#c9a24a');   /* пуговицы */
    px(c, x + 6, y - 56, 5, 4, '#FAC775');   /* значок обвинения */
    /* руки */
    var skin = '#7a6a8a';
    if (st === 'point') {   /* правая рука вытянута к герою, палец */
      var ext = Math.min(1, (t - E.pointT) / 260), jab = Math.sin((t - E.pointT) / 120) * 2;
      px(c, x + 12, y - 58, 22 * ext + jab, 6, '#1e1828'); px(c, x + 12 + 22 * ext + jab, y - 58, 6, 6, skin); px(c, x + 18 + 22 * ext + jab, y - 57, 7, 2, skin);
      px(c, x - 20, y - 58, 6, 26, '#1e1828'); px(c, x - 21, y - 34, 7, 6, skin); px(c, x - 26, y - 40, 8, 10, '#efe6d8');   /* левая — с папкой */
    } else if (st === 'gloat') {   /* руки вверх, хохочет */
      px(c, x - 22, y - 80, 6, 22, '#1e1828'); px(c, x + 16, y - 80, 6, 22, '#1e1828'); px(c, x - 23, y - 86, 8, 7, skin); px(c, x + 15, y - 86, 8, 7, skin);
    } else if (st === 'sweat') {   /* руки перед собой, защищается */
      px(c, x + 12, y - 58, 12, 6, '#1e1828'); px(c, x + 22, y - 64, 6, 12, skin); px(c, x - 18, y - 58, 6, 22, '#1e1828'); px(c, x - 19, y - 38, 7, 6, skin);
    } else {   /* руки за спиной / барабанит пальцами по папке */
      var tap = Math.floor(t / 180) % 2;
      px(c, x - 20, y - 58, 6, 26, '#1e1828'); px(c, x - 21, y - 34, 7, 6, skin); px(c, x + 14, y - 58, 6, 24, '#1e1828'); px(c, x + 14, y - 36 + tap, 7, 6, skin); px(c, x - 27, y - 40, 8, 10, '#efe6d8'); px(c, x - 26, y - 38, 6, 1, '#8a8494');
    }
    /* голова */
    var hx = x, hy = y - 76;
    px(c, hx - 3, hy + 9, 6, 5, skin);   /* шея */
    c.fillStyle = skin; c.beginPath(); c.ellipse(hx, hy, 11, 12, 0, 0, 7); c.fill();
    c.fillStyle = '#5a4a6a'; c.beginPath(); c.ellipse(hx + 3, hy + 3, 7, 8, 0, 0, 7); c.fill();   /* тень лица */
    c.fillStyle = skin; c.beginPath(); c.ellipse(hx - 1, hy, 10, 11, 0, 0, 7); c.fill();
    /* зачёсанные волосы и рога */
    c.fillStyle = '#0e0a12'; c.beginPath(); c.ellipse(hx, hy - 8, 11, 6, 0, Math.PI, 0); c.fill(); px(c, hx - 11, hy - 8, 4, 8, '#0e0a12');
    c.fillStyle = '#2a1a1a'; c.beginPath(); c.moveTo(hx - 8, hy - 10); c.quadraticCurveTo(hx - 18, hy - 18, hx - 14, hy - 28); c.lineTo(hx - 10, hy - 16); c.fill(); c.beginPath(); c.moveTo(hx + 8, hy - 10); c.quadraticCurveTo(hx + 18, hy - 18, hx + 14, hy - 28); c.lineTo(hx + 10, hy - 16); c.fill();
    px(c, hx - 15, hy - 28, 2, 3, '#d8c8a8'); px(c, hx + 13, hy - 28, 2, 3, '#d8c8a8');
    /* брови, глаза */
    var eyeCol = st === 'gloat' ? '#ff3030' : '#FAC775';
    c.strokeStyle = '#0e0a12'; c.lineWidth = 2; c.beginPath();
    if (st === 'sweat') { c.moveTo(hx - 8, hy - 6); c.lineTo(hx - 2, hy - 7); c.moveTo(hx + 8, hy - 6); c.lineTo(hx + 2, hy - 7); }
    else { c.moveTo(hx - 8, hy - 7); c.lineTo(hx - 2, hy - 4); c.moveTo(hx + 8, hy - 7); c.lineTo(hx + 2, hy - 4); }
    c.stroke(); c.lineWidth = 1;
    if (st === 'sweat') { px(c, hx - 7, hy - 4, 4, 4, '#fff'); px(c, hx + 3, hy - 4, 4, 4, '#fff'); px(c, hx - 6, hy - 3, 1, 1, '#000'); px(c, hx + 4, hy - 3, 1, 1, '#000'); }
    else { px(c, hx - 7, hy - 3, 5, 2, eyeCol); px(c, hx + 2, hy - 3, 5, 2, eyeCol); if (!A.lite) { px(c, hx - 8, hy - 4, 7, 4, st === 'gloat' ? 'rgba(255,40,40,.3)' : 'rgba(250,199,117,.25)'); px(c, hx + 1, hy - 4, 7, 4, st === 'gloat' ? 'rgba(255,40,40,.3)' : 'rgba(250,199,117,.25)'); } }
    /* монокль на правом глазу */
    c.strokeStyle = '#d9b25a'; c.beginPath(); c.arc(hx + 4.5, hy - 2, 4.5, 0, 7); c.stroke(); c.beginPath(); c.moveTo(hx + 9, hy); c.quadraticCurveTo(hx + 12, hy + 10, hx + 8, hy + 18); c.stroke();
    /* рот: ухмылка / хохот с клыками / дрожащий */
    if (st === 'gloat') { px(c, hx - 6, hy + 4, 12, 5, '#1a0a0e'); px(c, hx - 5, hy + 4, 2, 2, '#fff'); px(c, hx + 3, hy + 4, 2, 2, '#fff'); px(c, hx - 2, hy + 7, 4, 2, '#a02030'); }
    else if (st === 'sweat') { for (var m = 0; m < 5; m++) px(c, hx - 5 + m * 2, hy + 6 + (m % 2), 2, 1, '#1a0a0e'); }
    else { c.strokeStyle = '#1a0a0e'; c.beginPath(); c.moveTo(hx - 6, hy + 5); c.quadraticCurveTo(hx, hy + 9, hx + 6, hy + 4); c.stroke(); px(c, hx + 3, hy + 5, 1, 2, '#fff'); }
    /* пот */
    if (st === 'sweat' && !A.lite) for (var d = 0; d < 3; d++) { var dk = ((t / 500) + d / 3) % 1; px(c, hx - 12 + d * 12, hy - 8 + dk * 18, 2, 3, 'rgba(133,183,235,' + (1 - dk).toFixed(2) + ')'); }
    /* хохот: «ХА-ХА» значками */
    if (st === 'gloat' && !A.lite && Math.floor(t / 200) % 2) { px(c, hx + 14, hy - 16, 3, 3, '#ff6060'); px(c, hx + 19, hy - 21, 3, 3, '#ff6060'); }
  }
  /* поверх героя: прожекторы, сердцебиение, вспышка возражения, молния приговора */
  A.EV3over.court = function (c, t, E, h) {
    if (A.lite) return;
    var C = A.COURT, pending = E.st && !E.st.done && !E.verdict, decisive = E.st && E.st.mult > 1;
    /* полумрак зала + конусы прожекторов */
    c.save();
    c.fillStyle = 'rgba(6,4,10,' + (pending ? 0.32 : 0.2) + ')'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    var cone = function (x, col, a) { var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 8, 0); c.lineTo(x + 8, 0); c.lineTo(x + 44, H); c.lineTo(x - 44, H); c.fill(); };
    var proOn = E.pointT && t - E.pointT < 2600 && pending;
    cone(C.pro, '255,60,70', proOn ? 0.22 : 0.1); cone(C.judge, '255,210,140', 0.09); cone(C.def, '120,170,255', 0.1); cone(h.x, '160,200,255', pending ? 0.12 : 0.06);
    c.restore();
    /* сердцебиение: красная пульсирующая рамка, пока ждём ответа (решающее — чаще и сильнее) */
    if (pending) {
      var per = decisive ? 620 : 950, ph = (t % per) / per, beat = Math.max(Math.exp(-ph * 14), 0.7 * Math.exp(-Math.abs(ph - 0.22) * 18));
      var vg = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(170,0,20,' + ((decisive ? 0.55 : 0.32) * beat).toFixed(3) + ')'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    /* «ВОЗРАЖАЮ!»: белая вспышка и линии скорости от героя */
    if (E.objT && t - E.objT < 700) {
      var k = (t - E.objT) / 700;
      c.fillStyle = 'rgba(255,255,255,' + Math.max(0, 0.7 - k * 2.5).toFixed(2) + ')'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)).toFixed(2) + ')'; c.lineWidth = 2;
      for (var i = 0; i < 26; i++) { var a = i / 26 * Math.PI * 2, r0 = 40 + k * 60, r1 = r0 + 40 + (i % 3) * 30; c.beginPath(); c.moveTo(h.x + Math.cos(a) * r0, 150 + Math.sin(a) * r0); c.lineTo(h.x + Math.cos(a) * r1, 150 + Math.sin(a) * r1); c.stroke(); }
      c.lineWidth = 1;
    }
    /* приговор «ВИНОВЕН»: молния */
    if (E.verdict === 'jail' && t - E.vT < 900) {
      var lk = (t - E.vT) / 900, on = lk < 0.12 || (lk > 0.2 && lk < 0.28);
      if (on) { c.fillStyle = 'rgba(230,235,255,.55)'; c.fillRect(0, 0, W, H); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); var bx = C.def + 10; c.moveTo(bx, 0); for (var s = 1; s < 8; s++) c.lineTo(bx + (s % 2 ? -14 : 12), s * 22); c.stroke(); c.lineWidth = 1; }
      c.fillStyle = 'rgba(160,0,20,' + (0.25 * (1 - lk)).toFixed(2) + ')'; c.fillRect(0, 0, W, H);
    }
    if (E.verdict === 'free' && t - E.vT < 1500) { var gk = (t - E.vT) / 1500; c.fillStyle = 'rgba(255,220,120,' + (0.35 * (1 - gk)).toFixed(2) + ')'; c.fillRect(0, 0, W, H); }
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
