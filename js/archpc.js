/* 🖥 Компьютер Архитектуры (v113): четыре приложения на рабочем столе, у каждого — только свои задания.
     ⚡ EWB         — схемы (темы 3–7): настоящая студия EWB с сайта автора (pc/arch.html в рамке), сборка с автопроверкой, эталонные схемы
     ⚙ ASM-студия  — ассемблер (темы 8–9): с нуля → по шагам → эталон, «Проверить» сравнивает с эталоном переменные и вывод
     🧮 Тетрадь     — расчёты (темы 1, 2, 4, 9–15): поля для ответов с проверкой, рядом калькулятор темы
     📒 Блокнот     — теория, контрольные вопросы, «свой компьютер»: пишешь ответ сам, потом сравниваешь с эталоном
   Подача как в C++: задача кратко (+ картинка) → «Подробнее» → «По шагам» → «Эталон».
   Данные: data/subjects/arch/pc.json (собирается data/subjects/arch/pc-build.py), условия — labs.json. */
(function () {
  'use strict';
  var AP = window.AP = {};
  var DATA = null, dataP = null;
  var APPS = {
    ewb: { ico: '⚡', name: 'Electronics Workbench', free: 'Свободная сборка схем', hint: 'Схемы тем 3–7: собери сам — проверка нажатием «Проверить схему».' },
    asm: { ico: '⚙', name: 'ASM-студия', free: 'Пустая программа', hint: 'Ассемблер тем 8–9: пиши код, ⏭ Шаг — по одной команде.' },
    calc: { ico: '🧮', name: 'Тетрадь', free: 'Все калькуляторы', hint: 'Расчёты: впиши ответы — тетрадь проверит. Рядом калькулятор темы.' },
    note: { ico: '📒', name: 'Блокнот', free: 'Мои записи', hint: 'Теория и вопросы: сначала напиши сам, потом сравни с эталоном.' }
  };
  var TOOLS = [['numCalc', 'Числа и доп. код'], ['ieeeCalc', 'IEEE 754'], ['logicCalc', 'Логика → таблица'], ['kmapCalc', 'Карта Карно'], ['adderSim', 'Сумматор'], ['ffSim', 'Триггеры'], ['cntSim', 'Счётчики'],
    ['cacheAddr', 'Кэш: Tag/Set/Offset'], ['amatUnits', 'AMAT с единицами'], ['ramCalc', 'Память DDR'], ['segCalc', 'Сегмент:смещение'], ['hammingCalc', 'Код Хэмминга'], ['busCalc', 'Шины'], ['irqSim', 'Прерывания']];
  var D = function () { return window.DG; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var U = function () { return (window.PR && PR.util) || {}; };
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  function load() { if (DATA) return Promise.resolve(DATA); if (!dataP) dataP = Promise.all([fetch('data/subjects/arch/pc.json?v=113').then(function (r) { return r.json(); }), window.ASM ? ASM.data() : null]).then(function (r) { DATA = r[0]; return DATA; }); return dataP; }
  function solved(id) { var s = D().save.labs || {}; return !!s[id]; }
  function mark(t, msg) {
    var S = D().save; S.labs = S.labs || {}; if (S.labs[t.id]) return; S.labs[t.id] = 1; D().persist();
    if (window.DGame && DGame.toast) DGame.toast('🖥 ' + msg);
    try { if (window.DA && DA.sfx) DA.sfx('ok'); } catch (e) {}
    refreshSide(); var r = W && W.querySelector('.ap-res'); if (r) r.innerHTML = '<p class="tk-ok">✓ ' + esc(msg) + '</p>';
  }
  function hashId(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function labsArr() { return (window.PR && PR.labs && PR.labs('arch')) || []; }
  function every(app) { var out = []; labsArr().forEach(function (l, li) { l.tasks.forEach(function (t, ti) { var sp = DATA.tasks[t.id]; if (sp && sp.app === app) out.push({ t: t, l: l, li: li, ti: ti, sp: sp }); }); }); return out; }
  function findTask(id) { var r = null; labsArr().forEach(function (l, li) { l.tasks.forEach(function (t, ti) { if (t.id === id) r = { t: t, l: l, li: li, ti: ti, sp: DATA.tasks[id] || { app: 'note' } }; }); }); return r; }

  /* ================= окно приложения ================= */
  var W = null, cur = null, app = null, pollT = null, onExit = null;
  AP.apps = APPS;
  AP.open = function (a, o) { o = o || {}; onExit = o.onExit || onExit; return load().then(function () { app = a; build(); if (o.task) select(o.task); else free(); }); };
  AP.openTask = function (id, o) { o = o || {}; onExit = o.onExit || onExit; return load().then(function () { var x = findTask(id); if (!x) return; app = x.sp.app; build(); select(id); }); };
  AP.close = function () { clearInterval(pollT); if (W) { W.remove(); W = null; } if (window.ASM) ASM.close(); cur = null; };
  AP.isOpen = function () { return !!W; };
  function build() {
    AP.close();
    var A = APPS[app];
    W = document.createElement('div'); W.className = 'apw ap-' + app;
    W.innerHTML = '<div class="apw-t"><span class="apw-ic">' + A.ico + '</span><b>' + esc(A.name) + '</b><span class="apw-tt"></span><span class="grow"></span>' +
      '<button class="apw-b" data-side title="Показать / скрыть список заданий">📋 Задания</button><button class="apw-b" data-desk title="Свернуть на рабочий стол">🖥 Рабочий стол</button><button class="apw-x" data-x title="Закрыть">×</button></div>' +
      '<div class="apw-body"><aside class="ap-side"></aside><main class="ap-work"></main><section class="ap-panel"></section></div>';
    document.body.appendChild(W);
    W.querySelector('[data-x]').onclick = W.querySelector('[data-desk]').onclick = function () { AP.close(); if (onExit) onExit(); };
    W.querySelector('[data-side]').onclick = function () { W.classList.toggle('noside'); };
    if (window.innerWidth < 760) W.classList.add('noside');
    refreshSide();
  }
  function refreshSide() {
    if (!W) return; var side = W.querySelector('.ap-side'), list = every(app), groups = {}, order = [];
    list.forEach(function (x) { var n = x.l.topic; if (!groups[n]) { groups[n] = []; order.push(n); } groups[n].push(x); });
    var d = list.filter(function (x) { return solved(x.t.id); }).length;
    side.innerHTML = '<button class="ap-free' + (!cur ? ' on' : '') + '" data-free>🆓 ' + esc(APPS[app].free) + '</button><div class="ap-prog">Решено <b>' + d + ' из ' + list.length + '</b><i style="--p:' + (list.length ? Math.round(d * 100 / list.length) : 0) + '%"></i></div>' +
      order.map(function (n) {
        var g = groups[n], dn = g.filter(function (x) { return solved(x.t.id); }).length;
        return '<details class="ap-top"' + (cur && cur.l.topic === n || !cur && n === order[0] ? ' open' : '') + '><summary><b>Тема ' + n + '</b><em>' + dn + '/' + g.length + '</em><span>' + esc(topicName(n)) + '</span></summary>' +
          g.map(function (x) { return '<button class="ap-it' + (solved(x.t.id) ? ' ok' : '') + (cur && cur.t.id === x.t.id ? ' on' : '') + '" data-id="' + esc(x.t.id) + '">' + (solved(x.t.id) ? '✅' : x.sp.read ? '📖' : x.t.ex ? '💡' : '○') + ' ' + esc(x.t.name) + '</button>'; }).join('') + '</details>';
      }).join('');
    side.querySelector('[data-free]').onclick = free;
    side.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { select(b.getAttribute('data-id')); if (window.innerWidth < 760) W.classList.add('noside'); }; });
  }
  function topicName(n) { var sj = D().SUBJ && D().SUBJ.arch, f = sj && sj.floors.filter(function (x) { return x.n === n; })[0]; return f ? f.title : ''; }
  function frame(hash) { return '<iframe class="ap-frame" title="Компьютер" src="pc/arch.html?v=113#' + hash + '"></iframe>'; }
  function setFrame(hash) { var w = W.querySelector('.ap-work .ap-fhost') || W.querySelector('.ap-work'); w.innerHTML = frame(hash); }

  /* ---------- свободный режим ---------- */
  function free() {
    clearInterval(pollT); cur = null; W.querySelector('.apw-tt').textContent = '— ' + APPS[app].free; refreshSide();
    var work = W.querySelector('.ap-work'), panel = W.querySelector('.ap-panel');
    if (window.ASM) ASM.close();
    if (app === 'ewb') work.innerHTML = frame('ewb');
    else if (app === 'asm') { work.innerHTML = '<div class="ap-asm"></div>'; var c = ls.get('dgAsm:free'); ASM.mount(work.firstChild, c || ASM.TEMPLATE, { onChange: function (v) { ls.set('dgAsm:free', v); } }); }
    else if (app === 'calc') { work.innerHTML = '<div class="ap-tools">' + TOOLS.map(function (x, i) { return '<button class="w2k' + (i ? '' : ' on') + '" data-tool="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div><div class="ap-fhost">' + frame('tool=numCalc') + '</div>';
      work.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { work.querySelectorAll('[data-tool]').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); setFrame('tool=' + b.getAttribute('data-tool')); }; }); }
    else { work.innerHTML = '<div class="ap-paper"><h3>📝 Мои записи по архитектуре</h3><textarea class="ap-ta big" placeholder="Пиши здесь что угодно — сохраняется само">' + esc(ls.get('dgNote:free') || '') + '</textarea></div>'; work.querySelector('textarea').oninput = function () { ls.set('dgNote:free', this.value); }; }
    var list = every(app), d = list.filter(function (x) { return solved(x.t.id); }).length;
    panel.innerHTML = '<div class="ap-scroll"><p class="tk-brief">' + APPS[app].ico + ' <b>' + esc(APPS[app].name) + '</b></p><p class="tk-mini">' + esc(APPS[app].hint) + '</p><p>Заданий здесь: <b>' + list.length + '</b>, решено: <b>' + d + '</b>.</p>' +
      '<p class="tk-mini">Выбери задание слева (📋 Задания). Задания других тем открываются в своих программах: схемы — в EWB, ассемблер — в ASM-студии, расчёты — в Тетради, теория — в Блокноте.</p>' +
      (list.length ? '<button class="w2k primary" data-next>▶ Первое нерешённое</button>' : '') + '</div>';
    var nb = panel.querySelector('[data-next]'); if (nb) nb.onclick = function () { var x = list.filter(function (y) { return !solved(y.t.id) && !y.sp.read; })[0] || list[0]; select(x.t.id); };
  }

  /* ---------- задание ---------- */
  function select(id) {
    clearInterval(pollT); if (window.ASM) ASM.close();
    var x = findTask(id); if (!x) return; if (x.sp.app !== app) { app = x.sp.app; build(); }
    cur = x; refreshSide();
    var t = x.t, sp = x.sp, u = U();
    D().save.labLast = D().save.labLast || {}; D().save.labLast.arch = t.id; try { D().persist(); } catch (e) {}
    W.querySelector('.apw-tt').textContent = '— ' + t.name + ' · ' + (x.l.short || '');
    var full = (u.siteImg || esc)(t.text || ''), fm = full.match(/<figure[\s\S]*?<\/figure>/), fig = fm ? '<div class="tk-fig1">' + fm[0] + '</div>' : '';
    var steps = String(t.solution || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s && !/^\[рисунок/.test(s); });
    if (steps.length > 9) { var k = Math.ceil(steps.length / 9), g = []; for (var i = 0; i < steps.length; i += k) g.push(steps.slice(i, i + k).join('\n')); steps = g; }
    var panel = W.querySelector('.ap-panel');
    panel.innerHTML = '<div class="ap-scroll">' +
      '<p class="tk-brief">🎯 <b>Задача:</b> ' + esc(u.brief ? u.brief(t) : t.name) + '</p>' + fig +
      '<div class="ap-act"></div>' +
      '<details class="tk-full"><summary>📖 Подробнее — полное условие</summary><div class="tk-text">' + full + '</div></details>' +
      (steps.length ? '<details class="tk-livebox"><summary>🧭 По шагам</summary><div class="tk-hints"></div></details>' : '') +
      '<details class="tk-ref"><summary>📄 Эталон</summary><div class="ap-ref"></div></details>' +
      '<div class="ap-res">' + (solved(t.id) ? '<p class="tk-ok">✓ Это задание ты уже сделал.</p>' : '') + '</div></div>' +
      '<div class="prx-bar"><button class="w2k" data-prev title="Предыдущее задание">◀</button><button class="w2k" data-nxt title="Следующее задание">▶</button><span class="grow"></span><button class="w2k primary" data-ok>' + (solved(t.id) ? '✓ Сделано' : '✓ Готово') + '</button></div>';
    if (steps.length && u.hints) u.hints(panel.querySelector('.tk-hints'), { steps: steps.map(function (s, i) { return (i + 1) + '. ' + s.replace(/^\d+[.)]\s*/, ''); }).join('\n') });
    var list = every(app), pos = list.findIndex(function (y) { return y.t.id === t.id; });
    panel.querySelector('[data-prev]').onclick = function () { if (pos > 0) select(list[pos - 1].t.id); };
    panel.querySelector('[data-nxt]').onclick = function () { if (pos < list.length - 1) select(list[pos + 1].t.id); };
    ({ ewb: ewbTask, asm: asmTask, calc: calcTask, note: noteTask })[app](x, panel);
  }

  /* ================= ⚡ EWB ================= */
  function buildKey(b) { return b.t ? b.t : 'x_' + hashId(b.e + '|' + (b.o || 'F')); }
  function buildHash(b) { return b.t ? 'task=' + b.t : 'etask=' + encodeURIComponent(b.e) + '&out=' + encodeURIComponent(b.o || 'F') + (b.n ? '&title=' + encodeURIComponent('Собери: ' + b.n) : ''); }
  function buildName(b) { if (b.t) { var tt = { t3_f1: 'F = (A + B̄)·B·C', t3_major: 'Функция большинства', t3_xnand: 'XOR из NAND', t3_tab: 'Схема по таблице', t4_k4: 'Карта на 4 входа', t4_k3: 'Карта на 3 входа', t5_ha: 'Полусумматор', t5_fa: 'Полный сумматор', t5_add4: '4-разрядный сумматор', t5_dec24: 'Дешифратор 2→4', t5_dec38: 'Дешифратор 3→8', t5_enc42: 'Шифратор 4→2', t5_enc42p: 'Приоритетный шифратор', t5_enc83: 'Шифратор 8→3', t6_rsnor: 'RS-триггер на NOR', t6_rssync: 'Синхронный RS', t6_dlatch: 'D-защёлка', t6_dff: 'D-триггер по фронту', t6_jk: 'JK-триггер', t6_t: 'T-триггер', t7_up3: 'Счётчик 3 разряда', t7_down5: 'Вычитающий 5 разрядов', t7_sync6: 'Синхронный 6 разрядов', t7_mod10: 'Счётчик по модулю 10' }; return tt[b.t] || b.t; } return b.n || ('y = ' + b.e); }
  function ewbDone(b) { return ls.get('ewbs:done:' + buildKey(b)) === '1'; }
  function ewbTask(x, panel) {
    var t = x.t, sp = x.sp, builds = sp.builds || [], refs = sp.refs || [], work = W.querySelector('.ap-work');
    var act = panel.querySelector('.ap-act'), ref = panel.querySelector('.ap-ref');
    if (sp.read || !builds.length) {
      work.innerHTML = frame(refs.length ? refHash(refs[0]) : 'ewb');
      act.innerHTML = '<p class="tk-mini">' + (sp.read ? '📖 Теория. Рядом — EWB: попробуй всё, о чём тут написано (детали — в панелях Parts Bins, питание — переключатель O/I).' : '💡 Пример из лабы: схема уже открыта — включи питание O/I, пощёлкай переключатели (клавиши A, B, C…). Потом собери такую же сама в «Свободной сборке».') + '</p>';
    } else {
      act.innerHTML = '<p class="tk-mini">🛠 Собери схему сама — внизу у EWB есть шаги, таблица истинности и кнопка <b>«✔ Проверить схему»</b>:</p><div class="ap-builds">' +
        builds.map(function (b, i) { return '<button class="ap-bld" data-b="' + i + '"><i>' + (ewbDone(b) ? '✅' : '🛠') + '</i>' + esc(buildName(b)) + '</button>'; }).join('') + '</div>';
      var openB = function (i) { act.querySelectorAll('.ap-bld').forEach(function (e) { e.classList.toggle('on', +e.getAttribute('data-b') === i); }); work.innerHTML = frame(buildHash(builds[i])); };
      act.querySelectorAll('.ap-bld').forEach(function (e) { e.onclick = function () { openB(+e.getAttribute('data-b')); }; });
      var first = builds.findIndex(function (b) { return !ewbDone(b); }); openB(first < 0 ? 0 : first);
      pollT = setInterval(function () {
        if (!W || cur !== x) return clearInterval(pollT);
        var all = true; act.querySelectorAll('.ap-bld').forEach(function (e) { var ok = ewbDone(builds[+e.getAttribute('data-b')]); if (!ok) all = false; e.querySelector('i').textContent = ok ? '✅' : '🛠'; });
        if (all && !solved(t.id)) mark(t, 'Все схемы задания собраны и проверены!');
      }, 1500);
    }
    if (sp.gen === 'modM') { act.insertAdjacentHTML('beforeend', '<div class="ap-items"></div>'); items(x, act.querySelector('.ap-items')); }
    /* эталон: готовые схемы и решения заданий */
    var refList = refs.map(function (r) { return { h: refHash(r), n: r.c ? circName(r.c) : r.n || ('y = ' + r.x) }; }).concat(builds.filter(function (b) { return b.t; }).map(function (b) { return { h: 'sol=' + b.t, n: 'Решение: ' + buildName(b) }; }));
    ref.innerHTML = refList.length ? '<p class="tk-mini">Готовая схема откроется в EWB — включи питание и посмотри, как работает. (Проверку засчитывает только твоя сборка.)</p>' + refList.map(function (r, i) { return '<button class="w2k" data-r="' + i + '">⤵ ' + esc(r.n) + '</button> '; }).join('') + (t.solution ? '<div class="tk-sol">' + (U().siteImg || esc)(t.solution) + '</div>' : '') : (t.solution ? '<div class="tk-sol">' + (U().siteImg || esc)(t.solution) + '</div>' : '<p class="tk-mini">Эталона нет.</p>');
    ref.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { act.querySelectorAll('.ap-bld').forEach(function (e) { e.classList.remove('on'); }); work.innerHTML = frame(refList[+b.getAttribute('data-r')].h); }; });
    okBtn(x, panel, builds.length && !sp.read ? 'Сначала собери все схемы и нажми в EWB «✔ Проверить схему» — галочки появятся сами.' : null);
  }
  function refHash(r) { return r.c ? 'circ=' + r.c : 'expr=' + encodeURIComponent(r.x) + '&out=' + encodeURIComponent(r.o || 'y'); }
  function circName(k) { return { ha_gates: 'Полусумматор из вентилей', fa_2ha: 'Полный сумматор из 2 полусумматоров', add3: 'Сумматор 3-разрядных чисел', dec24: 'Дешифратор 2→4', dec38: 'Дешифратор 3→8', enc42: 'Шифратор 4→2', enc83: 'Шифратор 8→3', enc42p: 'Приоритетный шифратор', fa_gates: 'Полный сумматор из вентилей', add4g: '4-разрядный сумматор', rs_nand: 'RS-триггер на И-НЕ', rs_nor: 'RS на NOR', rs_nand_sw: 'RS на NAND', rs_sync: 'Синхронный RS', d_latch: 'D-защёлка', d_ms: 'D-триггер (master–slave)', jk_ms: 'JK-триггер (master–slave)', t_ms: 'T-триггер', d_wg: 'D-триггер + Word Generator', jk_wg: 'JK-триггер + Word Generator', cnt_async: 'Асинхронный счётчик', cnt_mod10: 'Счётчик по модулю 10', cnt_down5: 'Вычитающий 5-разрядный', cnt_sync6: 'Синхронный 6-разрядный', cnt_modM: 'Счётчик по модулю M' }[k] || k; }

  /* ================= ⚙ ASM ================= */
  function asmTask(x, panel) {
    var t = x.t, sp = x.sp, work = W.querySelector('.ap-work'), act = panel.querySelector('.ap-act'), ref = panel.querySelector('.ap-ref');
    var A = (window.ASM && ASM.data && null), keys = sp.asm || [], progs = [];
    ASM.data().then(function (AD) {
      if (!cur || cur.t !== t) return;
      progs = keys.map(function (k) { return { k: k, code: AD.progs[k], title: AD.titles[k] || k }; }).filter(function (p) { return p.code; });
      var key = 'dgAsm:' + t.id, mine = ls.get(key), start = '; ' + t.name + '\n; ' + String(U().plainT ? U().plainT(t.text) : t.text).slice(0, 150) + '\n' + ASM.TEMPLATE;
      var code = mine != null ? mine : (t.ex || sp.read) && progs[0] ? progs[0].code : start;
      work.innerHTML = '<div class="ap-asm"></div>';
      var ran = false, ed = ASM.mount(work.firstChild, code, { onChange: function (v) { ls.set(key, v); }, onRun: function () { ran = true; }, onStep: function () { ran = true; } });
      W._asm = ed;
      act.innerHTML = (t.ex || sp.read ? '<p class="tk-mini">💡 Пример из лабы уже в редакторе. Жми <b>⏭ Шаг</b> (F10) и смотри, что делает каждая строка. Потом попробуй изменить числа.</p>' : '<p class="tk-mini">Пиши программу в редакторе. <b>⏭ Шаг</b> (F10) — одна команда, <b>▶ Запуск</b> (F5) — вся программа.</p>') +
        (progs.length && !sp.read ? '<button class="w2k primary" data-chk>✔ Проверить программу</button> <button class="w2k" data-new>📄 Начать с нуля</button>' : '') + '<div class="ap-chk"></div>';
      var cb = act.querySelector('[data-chk]'); if (cb) cb.onclick = function () { asmCheck(x, ed, progs, act.querySelector('.ap-chk')); };
      var nb = act.querySelector('[data-new]'); if (nb) nb.onclick = function () { ed.set(start); };
      /* по шагам — строки эталона с объяснением */
      var sb = panel.querySelector('.tk-hints');
      if (progs[0]) {
        var lines = progs[0].code.split('\n').map(function (s, i) { return { s: s, i: i }; }).filter(function (o) { var c = o.s.replace(/;.*/, '').trim(); return c && !/^(include|\.model|\.stack|\.data|\.code|end\b|main\s+(proc|endp)|start:)/i.test(c); });
        var expl = {}; try { var P = ASM.assemble(progs[0].code), st = ASM.initState(P), n = 0; while (!st.done && n++ < 3000) { var ln = P.code[st.pc] ? P.code[st.pc].line : null, m = ASM.execStep(P, st); if (ln != null && !expl[ln] && m && m.txt) expl[ln] = m.txt; } } catch (e) {}
        if (!sb) { panel.querySelector('.tk-full').insertAdjacentHTML('afterend', '<details class="tk-livebox"><summary>🧭 По шагам</summary><div class="tk-hints"></div></details>'); sb = panel.querySelector('.tk-hints'); }
        var k = 0, draw = function () {
          sb.innerHTML = lines.slice(0, k).map(function (o, i) { var c = o.s.split(';'), why = c.length > 1 ? c.slice(1).join(';').trim() : ''; return '<div class="tk-hint"><b>' + (i + 1) + '.</b> <code>' + esc(c[0].trim()) + '</code>' + (why ? ' — ' + esc(why) : '') + (expl[o.i] ? '<small>' + esc(expl[o.i]) + '</small>' : '') + '</div>'; }).join('') +
            (k < lines.length ? '<button class="w2k" data-hint>💡 ' + (k ? 'Следующая строка' : 'Первая строка') + ' (' + (k + 1) + ' из ' + lines.length + ')</button>' : '<p class="tk-mini">Это вся программа — напиши её сама и проверь.</p>');
          var b = sb.querySelector('[data-hint]'); if (b) b.onclick = function () { k++; draw(); };
        };
        draw();
      }
      /* эталон — вставляется в редактор, свой вариант можно вернуть */
      var mineK = key + ':mine', drawR = function (ins) {
        ref.innerHTML = (ins ? '<p class="tk-ok">✓ Эталон «' + esc(ins) + '» в редакторе — жми ⏭ Шаг.</p>' : '<p class="tk-mini">Эталон вставится в редактор. Твой вариант сохранится — его можно вернуть.</p>') +
          progs.map(function (p, i) { return '<button class="w2k" data-ref="' + i + '">⤵ ' + esc(p.title) + '</button> '; }).join('') + (ins ? '<button class="w2k" data-mine>↩ Вернуть мой вариант</button>' : '') +
          (t.solution ? '<div class="tk-sol">' + (U().siteImg || esc)(t.solution) + '</div>' : '');
        ref.querySelectorAll('[data-ref]').forEach(function (b) { b.onclick = function () { var p = progs[+b.getAttribute('data-ref')]; if (!ref._saved) { ls.set(mineK, ed.get()); ref._saved = 1; } ed.set(p.code); drawR(p.title); }; });
        var mb = ref.querySelector('[data-mine]'); if (mb) mb.onclick = function () { var j = ls.get(mineK); if (j != null) ed.set(j); ref._saved = 0; drawR(null); };
      };
      drawR(null);
      okBtn(x, panel, progs.length && !sp.read && !t.ex ? 'Нажми «✔ Проверить программу» — засчитается, когда результат совпадёт с эталоном.' : null, function () { return ran; });
    });
  }
  /* сравниваем итог программы с эталоном: переменные с теми же именами, вывод, а если переменных нет — регистры */
  function runProg(src) { var P = ASM.assemble(src), st = ASM.initState(P), n = 0; while (!st.done && n++ < 20000) ASM.execStep(P, st); return { P: P, st: st }; }
  function varVal(R, name) { var v = R.P.vars[name.toLowerCase()]; if (!v) return null; var out = []; for (var k = 0; k < Math.min(v.count, 8); k++) { var x = 0; for (var b = 0; b < v.size; b++) x += (R.st.mem[v.addr + k * v.size + b] || 0) * Math.pow(256, b); out.push(x); } return out.join(','); }
  function asmCheck(x, ed, progs, box) {
    var mine; try { mine = runProg(ed.get()); } catch (e) { box.innerHTML = '<p class="tk-bad">✗ Программа не собирается: ' + esc(e.msg || e.message || e) + '</p>'; return; }
    var best = null;
    progs.forEach(function (p) {
      var R; try { R = runProg(p.code); } catch (e) { return; }
      var rows = [], ok = true;
      if (R.P.mode === 'edu') {
        Object.keys(R.st.regs).forEach(function (r) { var a = R.st.regs[r], b = mine.st.regs[r]; rows.push([r, a, b]); if (a !== b) ok = false; });
        Object.keys(R.st.cells).forEach(function (c) { var a = R.st.cells[c], b = (mine.st.cells || {})[c]; rows.push(['[' + c + ']', a, b]); if (a !== b) ok = false; });
      } else {
        var names = Object.keys(R.P.vars).filter(function (n) { return !R.P.vars[n].isStr; });
        var changed = names.filter(function (n) { var v = R.P.vars[n], init = []; for (var b = 0; b < v.size * v.count; b++) init.push(R.P.mem[v.addr + b] || 0); for (b = 0; b < init.length; b++) if ((R.st.mem[v.addr + b] || 0) !== init[b]) return true; return false; });
        changed.forEach(function (n) { var a = varVal(R, n), b = varVal(mine, n); rows.push([R.P.vars[n].name, a, b == null ? '— нет такой переменной' : b]); if (a !== b) ok = false; });
        var outA = (R.st.out || '').replace(/\s+$/, ''), outB = (mine.st.out || '').replace(/\s+$/, '');
        var dump = /EAX=/.test(outA);
        if (outA && !dump) { rows.push(['вывод', outA, outB]); if (outA !== outB) ok = false; }
        if (!changed.length && (dump || !outA)) {   /* нет переменных — сверяем регистры (16 или 32 бита) */
          var m16 = R.P.mode === 16; ['eax', 'ebx', 'ecx', 'edx'].forEach(function (r) { var a = R.st.regs[r], b = mine.st.regs[r]; if (m16) { a &= 0xFFFF; b &= 0xFFFF; } if (a === b && !used(R, r)) return; rows.push([(m16 ? r.slice(1) : r).toUpperCase(), a, b]); if (a !== b) ok = false; });
        }
      }
      if (!best || ok) best = { ok: ok, rows: rows, p: p };
    });
    if (!best) { box.innerHTML = '<p class="tk-warn">Эталон не запускается в симуляторе — сравни сам с «📄 Эталон».</p>'; return; }
    box.innerHTML = (best.ok ? '<p class="tk-ok">✓ Результат совпал с эталоном!</p>' : '<p class="tk-bad">Пока не совпадает — сравни «Должно быть» и «У тебя».</p>') +
      '<table class="ap-cmp"><tr><th></th><th>Должно быть</th><th>У тебя</th></tr>' + best.rows.map(function (r) { var ok = String(r[1]) === String(r[2]); return '<tr class="' + (ok ? 'ok' : 'bad') + '"><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</table>';
    var isRef = progs.some(function (p) { return p.code.replace(/\s+/g, '') === ed.get().replace(/\s+/g, ''); });
    if (best.ok && isRef) box.insertAdjacentHTML('beforeend', '<p class="tk-warn">Это вставленный эталон — он работает, но в прогресс не идёт. Напиши свою программу (📄 Начать с нуля) и проверь.</p>');
    else if (best.ok) mark(x.t, 'Программа работает как эталон!');
  }
  function used(R, r) { var re = new RegExp('\\b(' + r + '|' + r.slice(1) + '|' + r[1] + 'l|' + r[1] + 'h)\\b', 'i'); return R.P.code.some(function (c) { return c.args && re.test(c.args.join(' ')); }); }

  /* ================= 🧮 Тетрадь ================= */
  function calcTask(x, panel) {
    var t = x.t, sp = x.sp, work = W.querySelector('.ap-work'), act = panel.querySelector('.ap-act'), ref = panel.querySelector('.ap-ref');
    work.innerHTML = '<div class="ap-paper"><div class="ap-items"></div></div>' + (sp.tool ? '<div class="ap-tool"><div class="ap-tt">🧮 Калькулятор темы — проверяй себя, но ответ впиши сам</div><div class="ap-fhost">' + frame('tool=' + sp.tool) + '</div></div>' : '');
    var its = sp.items || [], hasGen = !!sp.gen;
    if (!its.length && !hasGen) { work.querySelector('.ap-items').innerHTML = '<h3>' + esc(t.name) + '</h3><div class="tk-text">' + (U().siteImg || esc)(t.text) + '</div><p class="tk-mini">Здесь нечего вписывать — разберись в теории и попробуй калькулятор ниже.</p>'; }
    else items(x, work.querySelector('.ap-items'));
    act.innerHTML = '<p class="tk-mini">✍ Впиши ответы в тетрадь (в середине) и нажми <b>«✔ Проверить»</b>. Можно по одному полю — Enter.</p>';
    ref.innerHTML = '<button class="w2k" data-show>👁 Показать ответы в тетради</button>' + (t.solution ? '<div class="tk-sol">' + (U().siteImg || esc)(t.solution) + '</div>' : '');
    ref.querySelector('[data-show]').onclick = function () { W.querySelectorAll('.ap-row').forEach(function (r) { if (r._show) r._show(); }); };
    okBtn(x, panel, its.length || hasGen ? 'Засчитается, когда все ответы в тетради будут верными.' : null);
  }
  /* ---- проверка одного ответа ---- */
  function normHex(s) { return String(s).replace(/\s+/g, '').replace(/^0x/i, '').replace(/h$/i, '').replace(/^0+(?=.)/, '').toUpperCase(); }
  function normBin(s) { return String(s).replace(/[\s_]/g, '').replace(/b$/i, '').replace(',', '.').replace(/^0+(?=[01])/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); }
  function num(s) { s = String(s).replace(/\s+/g, '').replace(',', '.').replace(/−/g, '-').replace(/[^\d.eE+\-]/g, ''); return s === '' ? NaN : +s; }
  function textNorm(s) { return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[\s·×*]+/g, '').replace(/[−–]/g, '-').replace(/х/g, 'x'); }
  function checkOne(it, v) {
    if (it.k === 'self') return null;
    if (!String(v).trim()) return false;
    if (it.k === 'hex') return it.a.some(function (a) { return normHex(a) === normHex(v); });
    if (it.k === 'bin') return it.a.some(function (a) { return normBin(a) === normBin(v); });
    if (it.k === 'num') { var n = num(v); return !isNaN(n) && it.a.some(function (a) { var tol = it.tol || 0; return Math.abs(n - a) <= Math.max(1e-9, tol < 1 && tol > 0 && Math.abs(a) > 10 ? Math.abs(a) * tol : tol); }); }
    if (it.k === 'list') { var f = function (s) { return String(s).toUpperCase().replace(/[^A-Z0-9,]/g, '').split(',').filter(Boolean).join(','); }; return it.a.some(function (a) { return f(a) === f(v); }); }
    if (it.k === 'tt') { var r = truth(v, it.v); return r != null && r === it.tt; }
    return it.a.some(function (a) { return textNorm(v).indexOf(textNorm(a)) >= 0 || textNorm(a) === textNorm(v); });
  }
  /* булева формула → строка таблицы истинности (строки 00…0 → 11…1, первая переменная — старшая).
     Понимает: + | ∨ — ИЛИ; * · & ∧ и просто рядом (AB) — И; ! ¬ ~ и ' после, черта над буквой — НЕ; ^ ⊕ — XOR; 0/1; скобки. */
  function truth(src, vars) {
    var s = String(src).normalize('NFD').replace(/\s+/g, '').replace(/^[A-Za-z]\w*(\([^)]*\))?=/, '').replace(/([A-Za-z])([̄̅]+)(\d+)/g, '$1$3$2'), toks = [], i = 0;
    var VS = vars.slice().sort(function (a, b) { return b.length - a.length; });
    while (i < s.length) {
      var ch = s[i];
      if (/[̄̅]/.test(ch)) { toks.push({ k: 'bar' }); i++; continue; }
      if ('+|∨'.indexOf(ch) >= 0) { toks.push({ k: 'or' }); i++; continue; }
      if ('*·&∧'.indexOf(ch) >= 0) { toks.push({ k: 'and' }); i++; continue; }
      if ('^⊕'.indexOf(ch) >= 0) { toks.push({ k: 'xor' }); i++; continue; }
      if ('!¬~'.indexOf(ch) >= 0) { toks.push({ k: 'not' }); i++; continue; }
      if ("'′’".indexOf(ch) >= 0) { toks.push({ k: 'bar' }); i++; continue; }
      if (ch === '(' || ch === ')') { toks.push({ k: ch }); i++; continue; }
      if (ch === '0' || ch === '1') { if (!/[A-Za-z]/.test(s[i - 1] || '')) { toks.push({ k: 'c', v: +ch }); i++; continue; } }
      var m = null; for (var j = 0; j < VS.length; j++) { var vn = VS[j]; if (s.substr(i, vn.length).toLowerCase() === vn.toLowerCase()) { m = vn; break; } }
      if (!m) return null; toks.push({ k: 'v', v: m }); i += m.length;
    }
    var p = 0;
    var atom = function () {
      var t = toks[p]; if (!t) throw 0;
      var node;
      if (t.k === 'not') { p++; node = { op: 'not', a: atom() }; }
      else if (t.k === '(') { p++; node = expr(); if (!toks[p] || toks[p].k !== ')') throw 0; p++; }
      else if (t.k === 'v') { p++; node = { v: t.v }; }
      else if (t.k === 'c') { p++; node = { c: t.v }; }
      else throw 0;
      while (toks[p] && toks[p].k === 'bar') { p++; node = { op: 'not', a: node }; }
      return node;
    };
    var term = function () { var l = atom(); while (toks[p] && (toks[p].k === 'and' || toks[p].k === 'v' || toks[p].k === '(' || toks[p].k === 'not' || toks[p].k === 'c')) { if (toks[p].k === 'and') p++; l = { op: 'and', a: l, b: atom() }; } return l; };
    var xr = function () { var l = term(); while (toks[p] && toks[p].k === 'xor') { p++; l = { op: 'xor', a: l, b: term() }; } return l; };
    var expr = function () { var l = xr(); while (toks[p] && toks[p].k === 'or') { p++; l = { op: 'or', a: l, b: xr() }; } return l; };
    var ast; try { ast = expr(); if (p !== toks.length) return null; } catch (e) { return null; }
    var ev = function (n, env) { if (n.c != null) return n.c; if (n.v) return env[n.v]; var a = ev(n.a, env); if (n.op === 'not') return 1 - a; var b = ev(n.b, env); return n.op === 'and' ? a & b : n.op === 'or' ? a | b : a ^ b; };
    var out = ''; for (var r = 0; r < (1 << vars.length); r++) { var env = {}; vars.forEach(function (vn, k) { env[vn] = (r >> (vars.length - 1 - k)) & 1; }); out += ev(ast, env); }
    return out;
  }
  AP._truth = truth;
  /* ---- генераторы заданий: кэш, AMAT, IEEE по вариантам, счётчик по модулю M ---- */
  function bigOf(h) { return BigInt('0x' + h.replace(/^0x/i, '')); }
  function lg(n) { return Math.round(Math.log2(n)); }
  function genItems(x, box, after) {
    var t = x.t, g = x.sp.gen, out = [];
    if (g === 'cache') {
      var re = /Кэш:\s*([\d,.]+)\s*(КиБ|МиБ|байт)[^;]*;\s*линия:\s*(\d+)[^;]*;\s*ассоциативность:\s*(\d+)-way;\s*адрес:\s*(\d+)\s*бит[а-я]*\.\s*Адрес\(а\):\s*([0-9xa-fA-F ,]+)/g, m, k = 0, base = { 't10-c1': 1, 't10-c2': 6, 't10-c3': 11 }[t.id] || 1;
      while ((m = re.exec(t.text))) {
        var size = +m[1].replace(',', '.') * (m[2] === 'МиБ' ? 1048576 : m[2] === 'КиБ' ? 1024 : 1), line = +m[3], ways = +m[4], bits = +m[5], lines = size / line, sets = lines / ways, ob = lg(line), sb = lg(sets), tb = bits - ob - sb, nn = base + k++;
        out.push({ h: '№' + nn + ': кэш ' + m[1] + ' ' + m[2] + ', линия ' + line + ', ' + ways + '-way, адрес ' + bits + ' бит' });
        out.push({ l: '№' + nn + ' линий', a: [lines], k: 'num' }, { l: '№' + nn + ' наборов', a: [sets], k: 'num' }, { l: '№' + nn + ' бит Tag / Set / Offset (через /)', a: [tb + '/' + sb + '/' + ob], k: 'text' });
        m[6].split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (ad) {
          var A = bigOf(ad), blk = A / BigInt(line), off = A % BigInt(line), set = blk % BigInt(sets), tag = blk / BigInt(sets);
          out.push({ l: '№' + nn + ' ' + ad + ': Tag', a: [Number(tag)], k: 'num' }, { l: '№' + nn + ' ' + ad + ': Set', a: [Number(set)], k: 'num' }, { l: '№' + nn + ' ' + ad + ': Offset', a: [Number(off)], k: 'num' }, { l: '№' + nn + ' ' + ad + ': начало блока (hex)', a: [(blk * BigInt(line)).toString(16)], k: 'hex' });
        });
      }
    } else if (g === 'amat') {
      var U2 = { 'пс': 0.001, 'нс': 1, 'мкс': 1000, 'мс': 1e6, 'с': 1e9 }, ra = /Hit Time\s*=\s*([\d\s,.]+?)\s*(пс|нс|мкс|мс|с)\s*;\s*(Hit|Miss) Rate\s*=\s*([\d,.]+)\s*%\s*;\s*Miss Penalty\s*=\s*([\d\s,.]+?)\s*(пс|нс|мкс|мс|с)(?![а-яё])/g, mm, n0 = t.id === 't10-a2' ? 11 : 1, q = 0;
      var nv = function (s) { return +String(s).replace(/\s+/g, '').replace(',', '.'); };
      while ((mm = ra.exec(t.text))) {
        var ht = nv(mm[1]) * U2[mm[2]], rate = nv(mm[4]) / 100, mr = mm[3] === 'Hit' ? 1 - rate : rate, mp = nv(mm[5]) * U2[mm[6]], am = Math.round((ht + mr * mp) * 1e6) / 1e6;
        out.push({ l: '№' + (n0 + q++) + ': Hit Time ' + mm[1].trim() + ' ' + mm[2] + ', ' + mm[3] + ' Rate ' + mm[4] + '%, Miss Penalty ' + mm[5].trim() + ' ' + mm[6] + ' → AMAT, нс', a: [am], k: 'num', tol: 0.0005, u: 'нс' });
      }
    } else if (g === 'ieee') {
      var V = [[-12.365, 0.0123, -10.698, 302.125, -0.001, -100.001], [-29.0065, -0.0301, 10.695, 128.125, 0.0021, -512.125], [-29.0135, -0.0221, 16.065, -28.125, -0.0021, 52.025], [12.003, 0.001, -22.99, 20.125, 0.0125, 20.02], [-120.01, 0.00001, 2.001, 50.05, -25.025, 12.003],
        [-101.001, 0.0005, -20.9, 51.001, -128.05, -120.1], [111.1, -0.0001, -9.9, 1024.1, -0.001, -10.166], [-0.021, 1.01, -3.001, -10.12, -0.125, 550.66], [12.225, -0.09, 125.125, 10.12, -0.009, 513.0025], [1.0225, -0.129, 0.005, 110.12, -10.009, -513.0025]];
      var vk = 'dgVar:' + t.id, vn = +(ls.get(vk) || 1);
      box.insertAdjacentHTML('beforeend', '<p class="ap-var">Мой вариант: <select data-var>' + V.map(function (_, i) { return '<option' + (i + 1 === vn ? ' selected' : '') + '>' + (i + 1) + '</option>'; }).join('') + '</select></p>');
      box.querySelector('[data-var]').onchange = function () { ls.set(vk, this.value); select(t.id); };
      var hx = function (v, dbl) { var b = new ArrayBuffer(8), dv = new DataView(b); if (dbl) { dv.setFloat64(0, v); return ('00000000' + dv.getUint32(0).toString(16)).slice(-8).toUpperCase() + ('00000000' + dv.getUint32(4).toString(16)).slice(-8).toUpperCase(); } dv.setFloat32(0, v); return ('00000000' + dv.getUint32(0).toString(16)).slice(-8).toUpperCase(); };
      V[vn - 1].forEach(function (v, i) { out.push({ l: (i < 3 ? '1' : '2') + String.fromCharCode(1072 + i % 3) + ') ' + String(v).replace('.', ',') + ' → ' + (i < 3 ? 'single (8 hex)' : 'double (16 hex)'), a: [hx(v, i >= 3)], k: 'hex' }); });
    } else if (g === 'modM') {
      var nk = 'dgVar:' + t.id, num0 = +(ls.get(nk) || 10), M = num0 + 3, nb = Math.ceil(Math.log2(M)), bs = M.toString(2), qs = [];
      for (var b = 0; b < bs.length; b++) if (bs[bs.length - 1 - b] === '1') qs.push('Q' + b);
      box.insertAdjacentHTML('beforeend', '<p class="ap-var">Мой номер по списку: <input data-num type="number" min="1" max="60" value="' + num0 + '" style="width:60px"></p>');
      box.querySelector('[data-num]').onchange = function () { ls.set(nk, this.value); select(t.id); };
      out.push({ l: 'модуль M = номер + 3', a: [M], k: 'num' }, { l: 'сколько триггеров (2ⁿ⁻¹ < M ≤ 2ⁿ)', a: [nb], k: 'num' }, { l: 'M в двоичной', a: [bs], k: 'bin' }, { l: 'какие выходы идут на NAND сброса (через запятую, напр. Q3,Q1)', a: [qs.reverse().join(',')], k: 'list' });
    }
    return out;
  }
  function items(x, box) {
    var t = x.t, sp = x.sp, key = 'dgCalc:' + t.id, saved = {}; try { saved = JSON.parse(ls.get(key) || '{}'); } catch (e) {}
    box.innerHTML = '<h3>✍ ' + esc(t.name) + '</h3>';
    var list = (sp.items || []).concat(sp.gen ? genItems(x, box) : []);
    var rows = [], save = function () { var o = {}; rows.forEach(function (r) { o[r.id] = r.inp.value; if (r.self) o[r.id + ':s'] = r.self; }); ls.set(key, JSON.stringify(o)); };
    list.forEach(function (it, i) {
      if (it.h) { box.insertAdjacentHTML('beforeend', '<h4 class="ap-h">' + esc(it.h) + '</h4>'); return; }
      var id = 'i' + i + ':' + it.l.slice(0, 30), row = document.createElement('div'); row.className = 'ap-row k-' + it.k;
      var big = it.k === 'self' || it.k === 'tt';
      row.innerHTML = '<label>' + esc(it.l) + '</label><div class="ap-in">' + (it.k === 'self' ? '<textarea rows="3" placeholder="Напиши своими словами…"></textarea>' : '<input autocomplete="off" spellcheck="false" placeholder="' + ({ hex: 'hex, напр. 1F4', bin: '0 и 1', num: 'число', tt: 'формула: !x1*x2 + x3 …', list: 'через запятую', text: 'ответ' }[it.k] || '') + '">') + (it.u ? '<em>' + esc(it.u) + '</em>' : '') + '<button class="w2k" data-c>' + (it.k === 'self' ? 'Сравнить' : '✔') + '</button><span class="ap-mk"></span></div><div class="ap-fb"></div>';
      box.appendChild(row);
      var inp = row.querySelector('input,textarea'), mk = row.querySelector('.ap-mk'), fb = row.querySelector('.ap-fb'), R = { id: id, it: it, inp: inp, row: row, ok: null, self: saved[id + ':s'] };
      inp.value = saved[id] || '';
      var judge = function (quiet) {
        if (it.k === 'self') {
          fb.innerHTML = '<div class="ap-cmp2"><b>Эталон:</b> ' + esc(it.a[0]) + '</div><span>Совпадает по смыслу?</span> <button class="w2k" data-y>✓ Да</button> <button class="w2k" data-n>✗ Нет, перепишу</button>';
          fb.querySelector('[data-y]').onclick = function () { R.self = 'y'; R.ok = true; mk.textContent = '✅'; fb.innerHTML = '<span class="tk-ok">✓ Засчитано</span> <small>' + esc(it.a[0]) + '</small>'; save(); allCheck(); };
          fb.querySelector('[data-n]').onclick = function () { R.self = ''; R.ok = false; mk.textContent = '✏'; save(); };
          return;
        }
        var ok = checkOne(it, inp.value); R.ok = ok; mk.textContent = ok ? '✅' : (String(inp.value).trim() ? '❌' : ''); row.classList.toggle('ok', !!ok); row.classList.toggle('bad', ok === false && !!String(inp.value).trim());
        if (it.k === 'tt' && !ok && String(inp.value).trim() && !quiet) { var got = truth(inp.value, it.v); fb.innerHTML = got == null ? 'Не понял формулу. Пиши так: <code>!x1*x2 + x1*!x3</code> (НЕ — !, И — *, ИЛИ — +, XOR — ^).' : 'Таблица твоей формулы: <code>' + got + '</code>, нужно: <code>' + it.tt + '</code> (строки ' + it.v.join('') + ' = 0…0 → 1…1).'; }
        else if (!ok && String(inp.value).trim() && !quiet && it.k === 'num' && it.u) fb.textContent = 'Проверь единицы: ответ нужен в ' + it.u + '.';
        else fb.textContent = '';
      };
      R.judge = judge;
      row._show = function () { if (it.k === 'self') { judge(); return; } inp.value = it.k === 'tt' ? '(любая формула с таблицей ' + it.tt + ')' : String(it.a[0]); if (it.k !== 'tt') judge(true); else { fb.innerHTML = 'Например — СДНФ по единицам таблицы ' + it.tt + '.'; } R.shown = true; };
      row.querySelector('[data-c]').onclick = function () { judge(); save(); allCheck(); };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && it.k !== 'self') { e.preventDefault(); judge(); save(); allCheck(); var nx = rows[rows.indexOf(R) + 1]; if (nx) nx.inp.focus(); } });
      inp.addEventListener('input', function () { save(); });
      if (inp.value && it.k !== 'self') judge(true);
      if (it.k === 'self' && R.self === 'y') { R.ok = true; mk.textContent = '✅'; }
      rows.push(R);
    });
    if (rows.length) { var b = document.createElement('div'); b.className = 'ap-all'; b.innerHTML = '<button class="w2k primary" data-all>✔ Проверить всё</button> <span class="ap-sum"></span>'; box.appendChild(b); b.querySelector('[data-all]').onclick = function () { rows.forEach(function (r) { if (r.it.k !== 'self') r.judge(true); }); allCheck(true); }; }
    var allCheck = function (show) {
      var n = rows.length, ok = rows.filter(function (r) { return r.ok; }).length, sum = box.querySelector('.ap-sum'); if (sum) sum.textContent = 'верно ' + ok + ' из ' + n;
      if (n && ok === n && !rows.some(function (r) { return r.shown; })) mark(t, 'Все ответы верные!');
      else if (show && n && ok === n) { var r0 = W.querySelector('.ap-res'); if (r0) r0.innerHTML = '<p class="tk-warn">Ответы подсмотрены в эталоне — сотри и впиши сама, тогда засчитается.</p>'; }
    };
    allCheck();
  }

  /* ================= 📒 Блокнот ================= */
  function noteTask(x, panel) {
    var t = x.t, sp = x.sp, work = W.querySelector('.ap-work'), act = panel.querySelector('.ap-act'), ref = panel.querySelector('.ap-ref'), key = 'dgNote:' + t.id, u = U();
    var qs = String(t.text || '').match(/[^?!.\n]*\?/g) || [], sl = String(t.solution || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var cards = qs.length >= 3 && Math.abs(qs.length - sl.length) <= 1 && /вопрос/i.test(t.name);
    var sol = (u.siteImg || esc)(t.solution || '');
    if (cards) {
      var saved = {}; try { saved = JSON.parse(ls.get(key) || '{}'); } catch (e) {}
      work.innerHTML = '<div class="ap-paper"><h3>🃏 ' + esc(t.name) + ' — карточки</h3><p class="tk-mini">Ответь на вопрос своими словами, потом открой ответ и честно отметь.</p>' + qs.map(function (q, i) {
        return '<div class="ap-card' + (saved['k' + i] ? ' ok' : '') + '" data-i="' + i + '"><b>' + (i + 1) + '. ' + esc(q.trim()) + '</b><textarea rows="2" placeholder="Мой ответ…">' + esc(saved['a' + i] || '') + '</textarea><button class="w2k" data-open>👁 Ответ</button><div class="ap-ans" hidden>' + esc(sl[i] || '') + ' <button class="w2k" data-know>✓ Знаю</button></div></div>'; }).join('') + '</div>';
      var store = function () { var o = {}; work.querySelectorAll('.ap-card').forEach(function (c, i) { o['a' + i] = c.querySelector('textarea').value; if (c.classList.contains('ok')) o['k' + i] = 1; }); ls.set(key, JSON.stringify(o)); var n = qs.length, k = work.querySelectorAll('.ap-card.ok').length; if (k === n) mark(t, 'Все вопросы разобраны!'); };
      work.querySelectorAll('.ap-card').forEach(function (c) { c.querySelector('textarea').oninput = store; c.querySelector('[data-open]').onclick = function () { c.querySelector('.ap-ans').hidden = false; }; c.querySelector('[data-know]').onclick = function () { c.classList.add('ok'); store(); }; });
      act.innerHTML = '<p class="tk-mini">🃏 ' + qs.length + ' вопросов. Засчитается, когда на всех нажмёшь «✓ Знаю».</p>';
    } else {
      work.innerHTML = '<div class="ap-paper"><h3>' + (sp.pc ? '💻 ' : '📖 ') + esc(t.name) + '</h3>' + (sp.pc ? '<p class="ap-tip">💡 Это задание делается на <b>твоём компьютере</b>. Как узнать — в «🧭 По шагам» и «📄 Эталон» справа. Запиши, что получилось:</p>' : '') +
        '<div class="tk-text ap-read">' + (u.siteImg || esc)(t.text || '') + '</div>' + (t.solution ? '<h4>✍ Мой ответ / конспект</h4><textarea class="ap-ta" placeholder="Напиши ответ своими словами — сохраняется само">' + esc(ls.get(key) || '') + '</textarea><button class="w2k" data-cmp>⚖ Сравнить с эталоном</button><div class="ap-side2" hidden><h4>📄 Эталон</h4><div class="tk-sol">' + sol + '</div><p>Совпадает по смыслу? <button class="w2k primary" data-y>✓ Да, понял</button></p></div>' : '<p class="tk-mini">Прочитай и нажми «✓ Готово».</p>') + '</div>' +
        (sp.tool ? '<div class="ap-tool"><div class="ap-tt">🧮 Калькулятор темы</div><div class="ap-fhost">' + frame('tool=' + sp.tool) + '</div></div>' : '');
      var ta = work.querySelector('textarea'); if (ta) ta.oninput = function () { ls.set(key, this.value); };
      var cb = work.querySelector('[data-cmp]'); if (cb) cb.onclick = function () { work.querySelector('.ap-side2').hidden = false; };
      var yb = work.querySelector('[data-y]'); if (yb) yb.onclick = function () { if (ta && ta.value.trim().length < 10) { yb.insertAdjacentHTML('afterend', ' <span class="tk-warn">Сначала напиши хоть пару строк сама 🙂</span>'); return; } mark(t, 'Разобрано!'); };
      act.innerHTML = '<p class="tk-mini">' + (t.solution ? '✍ Напиши ответ сама (в середине), потом «⚖ Сравнить с эталоном».' : '📖 Теория — прочитай.') + '</p>';
    }
    ref.innerHTML = t.solution ? '<div class="tk-sol">' + sol + '</div>' : '<p class="tk-mini">Эталона нет — это теория.</p>';
    okBtn(x, panel, cards ? 'Отметь «✓ Знаю» на всех карточках.' : t.solution ? 'Напиши ответ, сравни с эталоном и нажми «✓ Да, понял».' : null);
  }

  /* «✓ Готово»: где есть проверка — подсказываем, что нужно; где нет (теория, пример) — засчитываем */
  function okBtn(x, panel, need, can) {
    var b = panel.querySelector('[data-ok]');
    b.onclick = function () {
      if (solved(x.t.id)) return;
      if (need) { panel.querySelector('.ap-res').innerHTML = '<p class="tk-warn">' + esc(need) + '</p>'; return; }
      if (can && !can()) { panel.querySelector('.ap-res').innerHTML = '<p class="tk-warn">Сначала запусти программу (⏭ Шаг или ▶ Запуск).</p>'; return; }
      mark(x.t, x.sp.read ? 'Теория прочитана.' : 'Задание отмечено.'); b.textContent = '✓ Сделано';
    };
  }
})();
