/* Мост «компьютер в подвале» ↔ код учебного сайта. Режим берётся из адреса после #:
   #ewb                    — свободная EWB-студия
   #task=t5_ha             — задание EWB с автопроверкой (A.TASKS); успех → localStorage 'ewbs:done:<id>'
   #etask=<expr>&out=F&title=… — задание «собери схему по формуле», проверка по таблице истинности
   #circ=ha_gates          — готовая схема (эталон) в студии
   #sol=t5_ha              — эталон-решение задания A.TASKS
   #expr=<expr>&out=y      — схема, построенная по формуле (эталон)
   #tool=cacheAddr         — калькулятор/тренажёр с сайта */
(function () {
  'use strict';
  var P = {}; (location.hash || '').slice(1).split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i < 0) P[kv] = true; else P[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); });
  var host = document.getElementById('host');
  var INLINE = ['numCalc', 'ieeeCalc', 'logicCalc', 'kmapCalc', 'adderSim', 'muxSim', 'ffSim', 'cntSim', 'pageCalc', 'amatCalc', 'matCalc', 'stackSim'];
  /* виджет калькулятора создаём ДО загрузки arch-tools.js — он сам найдёт его по id */
  if (P.tool) host.innerHTML = '<div class="widget" id="' + String(P.tool).replace(/[^\w]/g, '') + '"></div>';
  function hashId(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  window.PCB = {
    P: P,
    start: function () {
      var A = window.ARCH, H = Math.max(420, window.innerHeight - 16);
      try {
        if (P.tool) { if (INLINE.indexOf(P.tool) >= 0 && typeof window[P.tool] === 'function') window[P.tool](document.getElementById(P.tool), true); return; }
        host.innerHTML = '<div></div>'; var el = host.firstChild;
        if (P.task && A.TASKS[P.task]) { window.STUDIO = new A.Studio(el, { task: A.TASKS[P.task], height: H }); return; }
        if (P.etask) {
          var e = P.etask, out = P.out || 'F', vars = [];
          var ast = parseExpr(e); exprVars(ast).forEach(function (v) { vars.push(v); }); vars.sort();
          var id = 'x_' + hashId(e + '|' + out);
          var t = { id: id, group: 'Лабы', title: P.title || ('Собери ' + out + ' = ' + e), text: P.text || ('Собери схему для <b>' + out + '</b>. Входы уже стоят, выход — лампа ' + out + '. Логические элементы — в панели <b>Logic Gates</b>. Потом нажми «Проверить».'),
            inputs: vars, outputs: [out], kind: 'comb', fn: function (v) { var o = {}; o[out] = evalExpr(ast, v) ? 1 : 0; return o; },
            solution: function () { return ewbFromExpr(e, { file: 'solution.ewb', out: out }); } };
          A.TASKS[id] = t; window.STUDIO = new A.Studio(el, { task: t, height: H }); return;
        }
        if (P.sol && A.TASKS[P.sol]) { window.STUDIO = new A.Studio(el, { circuit: A.TASKS[P.sol].solution(), height: H, noSave: true, storageKey: 'ewbs:view' }); return; }
        if (P.circ) { var f = (typeof EWB_CIRCUITS !== 'undefined' ? EWB_CIRCUITS : {})[P.circ] || (window.EWB_EXTRA || {})[P.circ]; if (f) { window.STUDIO = new A.Studio(el, { circuit: f(), height: H, noSave: true, storageKey: 'ewbs:view' }); return; } }
        if (P.expr) { window.STUDIO = new A.Studio(el, { circuit: ewbFromExpr(P.expr, { file: 'scheme.ewb', lc: true, out: P.out || 'y' }), height: H, noSave: true, storageKey: 'ewbs:view' }); return; }
        window.STUDIO = new A.Studio(el, { height: H, storageKey: 'ewbs:dg-free' });
      } catch (err) { host.innerHTML = '<p class="pc-msg">Не удалось открыть: ' + String(err && err.message || err) + '</p>'; console.error(err); }
    },
    taskId: function () { if (P.task) return P.task; if (P.etask) return 'x_' + hashId(P.etask + '|' + (P.out || 'F')); return null; },
    hashId: hashId
  };
})();
