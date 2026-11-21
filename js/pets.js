/* =====================================================================
   ПИТОМЦЫ: рисовка.
   Коты — набор Luiz Melo «Pet Cats Pack» (CC0, assets/pets/cat-1…6, кадры 50×50, лапы на 31-й строке).
   Свои (рисуются кодом): слизень, совёнок, дракончик.
   A.PET_KINDS — виды; A.drawPet(c, kind, anim, t, x, y, flip, s) — питомец лапами в точке (x, y);
   A.drawCage(c, t, x, y, kind, openT) — клетка с питомцем (висит на цепи; openT — момент открытия).
   ===================================================================== */
(function () {
  'use strict';
  var A = window.DA;
  var CAT_ANIMS = ['idle', 'walk', 'run', 'sleep', 'lay', 'meow', 'sit', 'stretch'];
  A.PET_KINDS = {
    'cat-1': { name: 'Рыжий кот', cat: 1 }, 'cat-2': { name: 'Чёрный кот', cat: 2 }, 'cat-3': { name: 'Сиамский кот', cat: 3 },
    'cat-4': { name: 'Сфинкс', cat: 4 }, 'cat-5': { name: 'Пушистый кот', cat: 5 }, 'cat-6': { name: 'Полосатый кот', cat: 6 },
    slime: { name: 'Слизень', own: true }, owl: { name: 'Совёнок', own: true }, dragon: { name: 'Дракончик', own: true }
  };
  A.petImg = {};
  A.loadPets = function () {
    Object.keys(A.PET_KINDS).forEach(function (k) {
      if (!A.PET_KINDS[k].cat) return; A.petImg[k] = {};
      CAT_ANIMS.forEach(function (a) { var i = new Image(); i.src = 'assets/pets/' + k + '/' + a + '.png'; A.petImg[k][a] = i; });
    });
  };
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  var FPS = { idle: 8, walk: 10, run: 14, sleep: 1, lay: 8, meow: 6, sit: 1, stretch: 9 };

  A.drawPet = function (c, kind, anim, t, x, y, flip, s) {
    var K = A.PET_KINDS[kind]; if (!K) return; s = s || 1.4;
    if (K.cat) {
      var set = A.petImg[kind], img = set && (set[anim] || set.idle); if (!img || !img.complete || !img.naturalWidth) return;
      var n = Math.max(1, Math.round(img.naturalWidth / 50)), f = Math.floor(t / 1000 * (FPS[anim] || 8)) % n;
      if (anim === 'lay' || anim === 'stretch') f = Math.min(n - 1, Math.floor(t / 1000 * FPS[anim]));   /* лечь / потянуться — один раз, потом лежит */
      c.save(); c.translate(Math.round(x), Math.round(y)); if (flip) c.scale(-1, 1);
      c.drawImage(img, f * 50, 0, 50, 50, Math.round(-25 * s), Math.round(-32 * s), Math.round(50 * s), Math.round(50 * s));
      c.restore();
      if (anim === 'sleep') zzz(c, t, x + (flip ? -8 : 8), y - 18);
      return;
    }
    c.save(); c.translate(Math.round(x), Math.round(y)); if (flip) c.scale(-1, 1); c.scale(s / 1.4, s / 1.4);
    ({ slime: slime, owl: owl, dragon: dragon }[kind])(c, anim, t);
    c.restore();
    if (anim === 'sleep') zzz(c, t, x + 8, y - 18);
  };
  function zzz(c, t, x, y) { var k = (t / 1400) % 1; c.fillStyle = 'rgba(220,225,255,' + (1 - k).toFixed(2) + ')'; c.font = 'bold 7px monospace'; c.fillText('z', x + k * 6, y - k * 10); c.fillText('Z', x + 4 + k * 8, y - 6 - k * 12); }
  /* слизень: прыгает, сплющивается при приземлении */
  function slime(c, anim, t) {
    var moving = anim === 'walk' || anim === 'run', ph = moving ? (t / (anim === 'run' ? 260 : 380)) % 1 : 0;
    var hop = moving ? Math.max(0, Math.sin(ph * Math.PI)) * 7 : 0, sq = moving ? (ph < 0.15 || ph > 0.9 ? 1.25 : 0.92) : 1 + Math.sin(t / 400) * 0.05;
    if (anim === 'sleep' || anim === 'lay') sq = 1.35;
    var w = 18 * sq, h = 14 / sq;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 0, 9, 2.5, 0, 0, 7); c.fill();
    c.fillStyle = '#5DCAA5'; c.beginPath(); c.ellipse(0, -h / 2 - hop, w / 2, h / 2, 0, 0, 7); c.fill();
    c.fillStyle = '#9FE1CB'; c.beginPath(); c.ellipse(-3, -h * 0.7 - hop, 3, 2, -0.4, 0, 7); c.fill();
    if (anim === 'sleep') { px(c, 1, -h / 2 - hop - 1, 3, 1, '#0F6E56'); px(c, 6, -h / 2 - hop - 1, 3, 1, '#0F6E56'); }
    else { px(c, 1, -h / 2 - hop - 3, 2, 3, '#0b2a22'); px(c, 6, -h / 2 - hop - 3, 2, 3, '#0b2a22'); if (anim === 'meow') px(c, 3, -h / 2 - hop + 2, 3, 2, '#0b2a22'); }
  }
  /* совёнок: машет крыльями, когда идёт; моргает */
  function owl(c, anim, t) {
    var moving = anim === 'walk' || anim === 'run', bob = moving ? Math.abs(Math.sin(t / 120)) * 2 : 0, flap = moving ? (Math.floor(t / 90) % 2) : 0;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 0, 7, 2, 0, 0, 7); c.fill();
    var y = -bob;
    px(c, -6, y - 16, 12, 15, '#8a5a2e'); px(c, -4, y - 10, 8, 8, '#d8c098');
    px(c, -7, y - 19, 3, 4, '#8a5a2e'); px(c, 4, y - 19, 3, 4, '#8a5a2e');
    var blink = Math.floor(t / 2600) % 5 === 0 && t % 2600 < 160;
    if (anim === 'sleep' || blink) { px(c, -5, y - 13, 4, 1, '#2a1a0a'); px(c, 1, y - 13, 4, 1, '#2a1a0a'); }
    else { px(c, -5, y - 15, 4, 4, '#fff1b8'); px(c, 1, y - 15, 4, 4, '#fff1b8'); px(c, -4, y - 14, 2, 2, '#1a1008'); px(c, 2, y - 14, 2, 2, '#1a1008'); }
    px(c, -1, y - 11, 2, 2, '#EF9F27');
    px(c, -9, y - 12 - flap * 4, 3, 8, '#6b4526'); px(c, 6, y - 12 - flap * 4, 3, 8, '#6b4526');
    px(c, -3, y - 1, 2, 1, '#EF9F27'); px(c, 1, y - 1, 2, 1, '#EF9F27');
  }
  /* дракончик: фиолетовый, крылышки, хвост, иногда пускает искру */
  function dragon(c, anim, t) {
    var moving = anim === 'walk' || anim === 'run', leg = moving ? (Math.floor(t / 110) % 2) : 0, wing = Math.floor(t / (moving ? 100 : 400)) % 2;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 0, 9, 2.5, 0, 0, 7); c.fill();
    if (anim === 'sleep' || anim === 'lay') { px(c, -9, -6, 18, 6, '#7F77DD'); px(c, 5, -9, 6, 5, '#7F77DD'); px(c, 8, -8, 2, 1, '#2a1a4a'); px(c, -13, -3, 5, 2, '#534AB7'); return; }
    px(c, -8, -11, 14, 8, '#7F77DD'); px(c, -6, -6, 10, 3, '#AFA9EC');
    px(c, 4, -17, 8, 7, '#7F77DD'); px(c, 9, -15, 2, 2, '#FAC775'); px(c, 11, -12, 2, 1, '#2a1a4a'); px(c, 5, -19, 2, 3, '#534AB7'); px(c, 8, -20, 2, 3, '#534AB7');
    px(c, -14, -9, 7, 3, '#534AB7'); px(c, -16, -12, 3, 3, '#534AB7');
    px(c, -5, -18 + wing * 3, 7, 5 - wing * 2, '#AFA9EC');
    px(c, -6, -3, 3, 3 - leg, '#534AB7'); px(c, 2, -3, 3, 2 + leg, '#534AB7');
    if (anim === 'meow' || Math.floor(t / 3000) % 4 === 0 && t % 3000 < 300) { px(c, 13, -13, 3, 2, '#EF9F27'); px(c, 16, -13, 2, 1, '#FAC775'); }
  }

  /* клетка: висит на цепи; внутри грустный питомец; при открытии дверца откидывается, питомец выпрыгивает */
  A.drawCage = function (c, t, x, y, kind, openT, stand) {
    var open = openT && t >= openT, k = open ? Math.min(1, (t - openT) / 600) : 0, sway = open ? 0 : Math.sin(t / 900) * 1.5;
    if (stand) sway = 0; else px(c, x - 1 + sway / 2, 0, 2, y - 22, '#6a6470');
    for (var i = 0; !stand && i < y - 22; i += 4) px(c, x - 2 + sway / 2, i, 4, 2, '#8a8494');
    c.save(); c.translate(x + sway, y);
    px(c, -16, -26, 32, 3, '#5a5462'); px(c, -18, 0, 36, 3, '#5a5462'); px(c, -3, -30, 6, 4, '#8a8494');
    if (!open || k < 1) A.drawPet(c, kind, 'sit', t, 0, 0, false, 1.1);
    for (var b = -14; b <= 14; b += 5) { if (open && b > 8) continue; px(c, b, -24, 2, 24, '#9a94a4'); }
    if (open) { c.save(); c.translate(12, -24); c.rotate(-k * 1.6); for (var d = 0; d < 3; d++) px(c, d * 4, 0, 2, 24, '#9a94a4'); c.restore(); }
    else { px(c, 9, -14, 6, 6, '#c9a24a'); px(c, 11, -12, 2, 2, '#3a2412'); }
    c.restore();
    if (open && t - openT < 1400) {   /* питомец выпрыгивает дугой вниз и вправо */
      var jk = Math.min(1, (t - openT - 300) / 700); if (jk > 0) A.drawPet(c, kind, 'run', t, x + jk * 30, y + 8 - Math.sin(jk * Math.PI) * 26 + jk * (A.FLOOR_Y + 8 - y - 8), false, 1.3);
      for (var s = 0; s < 10; s++) { var a = s * 0.63, r = (t - openT) / 1400 * 30; px(c, x + Math.cos(a) * r, y - 12 + Math.sin(a) * r, 2, 2, 'rgba(255,230,150,' + (1 - (t - openT) / 1400).toFixed(2) + ')'); }
    }
  };
})();
