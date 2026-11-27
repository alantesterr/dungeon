/* ⚙ ASM-студия: x86 (MASM + Irvine32 и 8086/DOS) и учебная модель R1…R3 — по шагам, с объяснением каждой команды.
   Ядро — мини-эмулятор с учебного сайта автора (alantesterr.github.io/contents), дополнен: переходы и метки, LOOP,
   MUL/DIV/IMUL/IDIV, NEG/NOT, PUSH/POP, свои процедуры (CALL/RET), TEST, XCHG, SAR/SAL/ROL/ROR, массивы (DUP, [esi]), INT 21h (AH=2/9/4Ch).
   Окно похоже на онлайн-компилятор MASM (masm.isas.dev): редактор, задания, консоль — но своё оформление.
   ASM.mount(host, code, opts) — встроить; ASM.studio(opts) — открыть окном; ASM.data() — программы из data/subjects/arch/asm.json. */
(function () {
  'use strict';
  var REGMAP = {};
  ['a', 'b', 'c', 'd'].forEach(function (x) {
    REGMAP['e' + x + 'x'] = { r: 'e' + x + 'x', p: 'e', s: 32 }; REGMAP[x + 'x'] = { r: 'e' + x + 'x', p: 'x', s: 16 };
    REGMAP[x + 'h'] = { r: 'e' + x + 'x', p: 'h', s: 8 }; REGMAP[x + 'l'] = { r: 'e' + x + 'x', p: 'l', s: 8 };
  });
  ['si', 'di', 'bp', 'sp'].forEach(function (x) { REGMAP['e' + x] = { r: 'e' + x, p: 'e', s: 32 }; REGMAP[x] = { r: 'e' + x, p: 'x', s: 16 }; });
  var RESERVED = { c: 1, pascal: 1, stdcall: 1, basic: 1, fortran: 1, syscall: 1, offset: 1, ptr: 1, byte: 1, word: 1, dword: 1, proc: 1, end: 1 };
  var SEGREGS = { ds: 1, es: 1, ss: 1, cs: 1, fs: 1, gs: 1 };
  var TYPES = { db: 1, byte: 1, sbyte: 1, dw: 2, word: 2, sword: 2, dd: 4, dword: 4, sdword: 4 };
  var IRV = ['dumpregs', 'writedec', 'writeint', 'writehex', 'writebin', 'writestring', 'writechar', 'crlf', 'readint', 'readdec', 'waitmsg', 'clrscr'];
  var JCC = { je: 'ZF=1 (равно)', jz: 'ZF=1 (ноль)', jne: 'ZF=0 (не равно)', jnz: 'ZF=0 (не ноль)', jg: 'больше (со знаком)', jnle: 'больше (со знаком)', jge: 'больше или равно (со знаком)', jnl: 'больше или равно (со знаком)',
    jl: 'меньше (со знаком)', jnge: 'меньше (со знаком)', jle: 'меньше или равно (со знаком)', jng: 'меньше или равно (со знаком)', ja: 'выше (без знака)', jnbe: 'выше (без знака)', jae: 'выше или равно (без знака)', jnb: 'CF=0', jnc: 'CF=0',
    jb: 'ниже (без знака)', jc: 'CF=1', jnae: 'ниже (без знака)', jbe: 'ниже или равно (без знака)', jna: 'ниже или равно (без знака)', js: 'SF=1 (минус)', jns: 'SF=0 (плюс)', jo: 'OF=1', jno: 'OF=0', jmp: 'всегда', loop: 'ECX ≠ 0 после уменьшения', jcxz: 'CX=0', jecxz: 'ECX=0' };
  var P2 = function (b) { return Math.pow(2, b); };
  var norm = function (v, b) { var m = P2(b); return ((v % m) + m) % m; };
  var signed = function (v, b) { return v >= P2(b - 1) ? v - P2(b) : v; };
  var hxr = function (v, b) { var s = norm(v, b).toString(16).toUpperCase(); while (s.length < b / 4) s = '0' + s; return s; };
  var hx = function (v, b) { return hxr(v, b) + 'h'; };
  var fmtNeg = function (n) { return n < 0 ? '−' + (-n) : String(n); };
  var decS = function (v, b) { var u = norm(v, b), s = signed(u, b); return s === u ? String(u) : (u + ' / ' + fmtNeg(s)); };
  var parity = function (v) { var x = v & 0xFF, c = 0; while (x) { c += x & 1; x >>= 1; } return c % 2 === 0 ? 1 : 0; };
  var bin = function (v, b) { var s = norm(v, b).toString(2); while (s.length < b) s = '0' + s; return s.replace(/(.{4})(?=.)/g, '$1 '); };
  var TYPE_RU = { 1: 'байт · 8 бит', 2: 'слово · 16 бит', 4: 'двойное слово · 32 бита' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var rep = function (s, n) { var o = ''; for (var i = 0; i < n; i++) o += s; return o; };

  function parseNum(s) {
    s = String(s).trim().replace(/^\+/, '');
    var neg = false; if (s.charAt(0) === '-' || s.charAt(0) === '−') { neg = true; s = s.slice(1).trim(); }
    var v = null;
    if (/^[0-9][0-9a-f]*h$/i.test(s)) v = parseInt(s.slice(0, -1), 16);
    else if (/^0x[0-9a-f]+$/i.test(s)) v = parseInt(s, 16);
    else if (/^[01]+b$/i.test(s)) v = parseInt(s.slice(0, -1), 2);
    else if (/^[0-9]+d?$/i.test(s)) v = parseInt(s, 10);
    else if (/^'.'$/.test(s) || /^".?"$/.test(s)) v = s.length === 3 ? s.charCodeAt(1) : 0;
    if (v === null || isNaN(v)) return null;
    return neg ? -v : v;
  }
  function splitTop(s) {
    var out = [], cur = '', q = null, dep = 0;
    for (var i = 0; i < s.length; i++) { var ch = s[i];
      if (q) { cur += ch; if (ch === q) q = null; } else if (ch === '"' || ch === "'") { q = ch; cur += ch; } else if (ch === '(' || ch === '[') { dep++; cur += ch; } else if (ch === ')' || ch === ']') { dep--; cur += ch; } else if (ch === ',' && !dep) { out.push(cur); cur = ''; } else cur += ch; }
    if (cur.trim() !== '') out.push(cur); return out.map(function (x) { return x.trim(); });
  }
  function stripComment(line) {
    var q = null; for (var i = 0; i < line.length; i++) { var ch = line[i]; if (q) { if (ch === q) q = null; } else if (ch === '"' || ch === "'") q = ch; else if (ch === ';') return [line.slice(0, i), line.slice(i + 1).trim()]; }
    return [line, ''];
  }
  function AsmError(line, msg, hint) { this.line = line; this.msg = msg; this.hint = hint || ''; }

  /* ---------- учебная модель: MOV R1, 10 · ADD R3, R1, R2 · LOAD R1, [200] · STORE [202], R3 ---------- */
  function isEdu(src) { return !/^\s*\.code\b/im.test(src) && /^\s*(mov|add|sub|load|store)\s+(r\d|\[)/im.test(src); }
  function assembleEdu(src) {
    var lines = src.replace(/\r/g, '').split('\n'), code = [], init = { PC: 100 }, mem = {}, used = {};
    lines.forEach(function (ln, i) {
      var sc = stripComment(ln), t = sc[0].trim();
      if (!t) { var m0 = /старт:\s*(.+)$/i.exec(sc[1] || ''); if (m0) m0[1].replace(/(R\d|PC)\s*=\s*(-?\d+)/gi, function (_, r, v) { init[r.toUpperCase()] = +v; }).replace(/\[(\d+)\]\s*=\s*(-?\d+)/g, function (_, a, v) { mem[a] = +v; }); return; }
      var m = /^([a-z]+)\s+(.+)$/i.exec(t); if (!m) throw new AsmError(i, 'Не понимаю строку', 'Формат: КОМАНДА приёмник, источник');
      var op = m[1].toUpperCase(), a = splitTop(m[2]);
      if (['MOV', 'ADD', 'SUB', 'LOAD', 'STORE', 'MUL'].indexOf(op) < 0) throw new AsmError(i, 'Команду ' + op + ' учебная модель не знает', 'Есть: MOV, ADD, SUB, MUL, LOAD, STORE.');
      a.forEach(function (x) { var r = /^r\d$/i.exec(x); if (r) used[x.toUpperCase()] = 1; var mm = /^\[(\d+)\]$/.exec(x); if (mm && mem[mm[1]] == null) mem[mm[1]] = 0; });
      code.push({ line: i, op: op, a: a, raw: t, comment: sc[1] });
    });
    Object.keys(used).forEach(function (r) { if (init[r] == null) init[r] = 0; });
    var ord = {}; Object.keys(init).filter(function (k) { return k !== 'PC'; }).sort().concat(['PC']).forEach(function (k) { ord[k] = init[k]; }); init = ord;
    return { mode: 'edu', code: code, init: init, mem0: mem, vars: {}, lines: lines };
  }
  function eduVal(st, x, line) {
    var r = /^r\d$/i.exec(x); if (r) return st.regs[x.toUpperCase()] || 0;
    var m = /^\[(\d+)\]$/.exec(x); if (m) return st.cells[m[1]] || 0;
    var n = parseNum(x); if (n == null) throw new AsmError(line, 'Не число и не регистр: ' + x); return n;
  }
  function execEdu(prog, st) {
    var ins = prog.code[st.pc]; if (!ins) { st.done = true; return { lead: 'Конец программы', txt: '' }; }
    st.pc++; st.regs.PC++;
    var a = ins.a, txt = '', d = a[0].toUpperCase();
    try {
      if (ins.op === 'MOV') { st.regs[d] = eduVal(st, a[1], ins.line); txt = 'Записываем ' + a[1] + ' в ' + d + ': ' + d + ' = ' + st.regs[d] + '.'; }
      else if (ins.op === 'ADD' || ins.op === 'SUB' || ins.op === 'MUL') {
        var x = eduVal(st, a.length > 2 ? a[1] : a[0], ins.line), y = eduVal(st, a.length > 2 ? a[2] : a[1], ins.line), r = ins.op === 'ADD' ? x + y : ins.op === 'SUB' ? x - y : x * y;
        st.regs[d] = r; txt = d + ' = ' + x + (ins.op === 'ADD' ? ' + ' : ins.op === 'SUB' ? ' − ' : ' × ') + y + ' = ' + r + '. Результат пишется только в приёмник ' + d + ' — источники ' + (a.length > 2 ? a[1].toUpperCase() + ' и ' + a[2].toUpperCase() : a[1]) + ' только читаются.';
      }
      else if (ins.op === 'LOAD') { st.regs[d] = eduVal(st, a[1], ins.line); txt = 'LOAD: из ячейки памяти ' + a[1] + ' число ' + st.regs[d] + ' копируется в регистр ' + d + '. АЛУ работает только с регистрами — поэтому данные сначала «приносят» из памяти.'; }
      else if (ins.op === 'STORE') { var ad = /^\[(\d+)\]$/.exec(a[0]); if (!ad) throw new AsmError(ins.line, 'STORE [адрес], регистр'); var old = st.cells[ad[1]]; st.cells[ad[1]] = eduVal(st, a[1], ins.line); txt = 'STORE: значение ' + a[1].toUpperCase() + ' = ' + st.cells[ad[1]] + ' записано в ячейку ' + ad[1] + '.' + (old === st.cells[ad[1]] ? ' Там уже было ' + old + ' — число «не изменилось», хотя запись была!' : ''); }
    } catch (e) { st.done = true; return { lead: ins.raw, txt: e.msg || String(e), err: 1 }; }
    txt += ' PC = ' + st.regs.PC + ' (счётчик команд +1).';
    if (st.pc >= prog.code.length) st.done = true;
    return { lead: ins.raw, txt: txt, comment: ins.comment };
  }

  /* ---------- x86 ---------- */
  function assemble(src) {
    if (isEdu(src)) return assembleEdu(src);
    var lines = src.replace(/\r/g, '').split('\n');
    var mode = /irvine32|\.386|\.586|\be[a-d]x\b/i.test(src) ? 32 : 16;
    var mem = [], vars = {}, code = [], labels = {}, procs = {}, sec = null, entry = null, lastVar = null;
    for (var i = 0; i < lines.length; i++) {
      var sc = stripComment(lines[i]), t = sc[0].trim(), comment = sc[1]; if (!t) continue;
      var low = t.toLowerCase();
      if (/^(include|includelib|\.model|\.stack|\.386|\.486|\.586|\.686|option|title|\.const)\b/.test(low)) continue;
      if (/^(stack|code|data)\b/.test(low) && !/^data\s+(db|dw|dd)/.test(low)) throw new AsmError(i, 'Syntax error: ' + t.split(/\s+/)[0], 'Директива пишется с точкой: .stack / .code / .data, а метка — с двоеточием: start:');
      if (low === '.data' || low === '.data?') { sec = 'data'; continue; }
      if (low === '.code') { sec = 'code'; continue; }
      var me = /^end\s*(\w*)/.exec(low); if (me) { entry = me[1] || null; break; }
      var pm = /^(\w+)\s+proc\b/.exec(low); if (pm) { labels[pm[1]] = code.length; procs[pm[1]] = code.length; continue; }
      if (/\bendp\b/.test(low)) { code.push({ line: i, op: 'endp', raw: t, ops: [], args: [], comment: comment, hidden: 1 }); continue; }
      var lm = /^([a-z_@$?][\w@$?]*):\s*(.*)$/i.exec(t);
      if (lm && sec === 'code') { labels[lm[1].toLowerCase()] = code.length; if (!lm[2].trim()) continue; t = lm[2].trim(); low = t.toLowerCase(); }
      if (sec === 'data') {
        var m = /^([a-z_@$?][\w@$?]*)\s+([a-z]+)\s+(.+)$/i.exec(t), cont = null;
        if (!m || !TYPES[m[2].toLowerCase()]) { cont = /^([a-z]+)\s+(.+)$/i.exec(t); if (!cont || !TYPES[cont[1].toLowerCase()] || !lastVar) throw new AsmError(i, 'Не понимаю строку данных', 'Формат: имя DB/DW/DWORD значение'); m = [t, lastVar.name, cont[1], cont[2]]; }
        var name = m[1], lname = name.toLowerCase(), size = TYPES[m[2].toLowerCase()];
        if (!cont) {
          if (RESERVED[lname]) throw new AsmError(i, 'Syntax error: ' + name, '«' + name + '» — зарезервированное слово MASM' + (lname === 'c' ? ' (соглашение о вызове языка C)' : '') + '. Переименуй переменную, например в ' + (lname === 'c' ? 'C1' : name.toUpperCase() + '1') + ' — и в .data, и в коде.');
          if (REGMAP[lname] || SEGREGS[lname]) throw new AsmError(i, 'Syntax error: ' + name, '«' + name + '» — имя регистра, так называть переменную нельзя.');
          if (vars[lname]) throw new AsmError(i, 'Повторное объявление: ' + name);
        }
        var addr = mem.length, count = 0, isStr = /["']/.test(m[3]);
        var parts = splitTop(m[3]);
        for (var pi = 0; pi < parts.length; pi++) {
          var part = parts[pi], dm = /^(\d+)\s+dup\s*\((.*)\)$/i.exec(part);
          var list = dm ? (function () { var a = []; for (var k = 0; k < +dm[1]; k++) a.push(dm[2].trim()); return a; })() : [part];
          for (var li = 0; li < list.length; li++) {
            var pp = list[li], sm = /^(["'])(.*)\1$/.exec(pp);
            if (sm && sm[2].length !== 1) { if (size !== 1) throw new AsmError(i, 'Строка может быть только BYTE/DB'); for (var ci = 0; ci < sm[2].length; ci++) { mem.push(sm[2].charCodeAt(ci) & 0xFF); count++; } continue; }
            var v = pp === '?' ? 0 : parseNum(pp);
            if (v === null) throw new AsmError(i, 'Не число: ' + pp);
            var b = size * 8; if (v < -P2(b - 1) || v > P2(b) - 1) throw new AsmError(i, 'Значение ' + pp + ' не помещается в ' + b + ' бит', 'Диапазон ' + b + '-битного числа: ' + (-P2(b - 1)) + '…' + (P2(b) - 1));
            var u = norm(v, b); for (var k = 0; k < size; k++) mem.push(Math.floor(u / P2(8 * k)) & 0xFF); count++;
          }
        }
        if (cont) { lastVar.count += count; if (isStr) lastVar.isStr = true; continue; }
        lastVar = vars[lname] = { name: name, addr: addr, size: size, count: count, isStr: isStr };
        continue;
      }
      if (sec !== 'code') throw new AsmError(i, 'Строка вне секций .data / .code', 'Перед командами напиши .code, перед переменными — .data');
      var mm = /^([a-z]+)\s*(.*)$/i.exec(t); if (!mm) throw new AsmError(i, 'Не понимаю строку');
      var op = mm[1].toLowerCase(), args = mm[2] ? splitTop(mm[2]) : [];
      var ins = { line: i, op: op, args: args, comment: comment, raw: t };
      if (op === 'mov' && args.length === 2 && (/^@data$/i.test(args[1]) || SEGREGS[args[0].toLowerCase()])) { ins.skip = 'Служебная строка DOS: настраивает сегментный регистр DS на сегмент данных. В симуляторе пропускаем — данные и так доступны.'; ins.ops = []; code.push(ins); continue; }
      if (JCC[op]) { if (args.length !== 1) throw new AsmError(i, op.toUpperCase() + ': нужна метка', 'Например: ' + op + ' metka'); ins.lbl = args[0].toLowerCase(); ins.ops = []; code.push(ins); continue; }
      if (op === 'call') { ins.fn = (args[0] || '').toLowerCase(); ins.ops = []; code.push(ins); continue; }
      ins.ops = args.map(function (a) { return resolve(a, vars, i, mode); });
      validate(ins, mode);
      code.push(ins);
    }
    code.forEach(function (c) {
      if (c.lbl != null && labels[c.lbl] == null) throw new AsmError(c.line, 'Нет такой метки: ' + c.args[0], 'Метка пишется с двоеточием в начале строки: ' + c.args[0] + ':');
      if (c.op === 'call' && IRV.indexOf(c.fn) < 0 && procs[c.fn] == null) throw new AsmError(c.line, 'call ' + c.args[0] + ': такой процедуры нет', 'Симулятор знает процедуры Irvine32: ' + IRV.join(', ') + ' — и твои собственные (имя PROC … ret … имя ENDP).');
    });
    var start = entry && labels[entry] != null ? labels[entry] : (labels.main != null ? labels.main : labels.start != null ? labels.start : 0);
    return { mode: mode, mem: mem, vars: vars, code: code, lines: lines, labels: labels, procs: procs, start: start };
  }
  function resolve(a, vars, line, mode) {
    var s = a.trim(), low = s.toLowerCase(), size = null;
    var pm = /^(byte|word|dword)\s+ptr\s+(.+)$/.exec(low); if (pm) { size = { byte: 8, word: 16, dword: 32 }[pm[1]]; s = s.slice(low.indexOf('ptr') + 3).trim(); low = s.toLowerCase(); }
    if (REGMAP[low]) { var R = REGMAP[low]; return { k: 'reg', r: R.r, p: R.p, s: R.s, name: low.toUpperCase() }; }
    if (/^offset\s+/.test(low)) { var n0 = low.replace(/^offset\s+/, '').trim(); if (!vars[n0]) throw new AsmError(line, 'Неизвестное имя: ' + n0); return { k: 'imm', v: vars[n0].addr, name: 'OFFSET ' + vars[n0].name }; }
    if (/^(type|sizeof|lengthof)\s+/.test(low)) { var w = low.split(/\s+/), vv = vars[w[1]]; if (!vv) throw new AsmError(line, 'Неизвестное имя: ' + w[1]); var val = w[0] === 'type' ? vv.size : w[0] === 'lengthof' ? vv.count : vv.size * vv.count; return { k: 'imm', v: val, name: s }; }
    var inner = low, br = /^(\w*)\s*\[(.+)\]$/.exec(low); if (br) inner = (br[1] ? br[1] + '+' : '') + br[2].trim();
    var parts = inner.split('+').map(function (x) { return x.trim(); }), base = null, reg = null, disp = 0;
    for (var i = 0; i < parts.length; i++) {
      var x = parts[i]; if (!x) continue;
      if (vars[x]) { if (base) throw new AsmError(line, 'Две переменные в одном адресе'); base = vars[x]; }
      else if (REGMAP[x] && REGMAP[x].s >= 16) { if (reg) throw new AsmError(line, 'Симулятор понимает один регистр в адресе'); reg = REGMAP[x]; }
      else { var n = parseNum(x); if (n == null) { if (RESERVED[x]) throw new AsmError(line, 'Syntax error: ' + x, '«' + x + '» — зарезервированное слово MASM. Переименуй переменную, например в ' + (x === 'c' ? 'C1' : x.toUpperCase() + '1') + ' — и в .data, и здесь.'); throw new AsmError(line, 'Неизвестный операнд: ' + s, 'Проверь, объявлена ли переменная в .data и нет ли опечатки.'); } disp += n; }
    }
    if (!base && !reg && !br) return { k: 'imm', v: disp, name: s };
    if (!base && !reg) return { k: 'mem', addr: disp, s: size || 0, name: s };
    if (reg) return { k: 'ind', reg: reg, base: base ? base.addr : 0, disp: disp, s: size || (base ? base.size * 8 : 0), name: s };
    return { k: 'mem', addr: base.addr + disp, s: size || base.size * 8, name: s, v: base };
  }
  function validate(ins, mode) {
    var op = ins.op, ops = ins.ops, line = ins.line;
    var need = function (n) { if (ops.length !== n) throw new AsmError(line, op.toUpperCase() + ': нужно операндов — ' + n); };
    var fix = function (a, b) { if ((a.k === 'mem' || a.k === 'ind') && !a.s) { if (b && b.s) a.s = b.s; else throw new AsmError(line, 'Непонятен размер операнда ' + a.name, 'Укажи размер: BYTE PTR / WORD PTR / DWORD PTR ' + a.name); } };
    if (['mov', 'add', 'adc', 'sub', 'sbb', 'xor', 'and', 'or', 'cmp', 'test', 'xchg'].indexOf(op) >= 0) {
      need(2); var d = ops[0], s = ops[1]; fix(d, s); fix(s, d);
      if (d.k === 'imm') throw new AsmError(line, 'Приёмник не может быть числом', 'Первый операнд — куда записывать: регистр или переменная.');
      if ((d.k === 'mem' || d.k === 'ind') && (s.k === 'mem' || s.k === 'ind')) throw new AsmError(line, 'Нельзя: память → память одной командой', 'Сначала загрузи одну переменную в регистр, потом работай с ним.');
      if (s.k !== 'imm' && d.s !== s.s) throw new AsmError(line, 'instruction operands must be the same size (' + d.s + ' и ' + s.s + ' бит)', 'Размеры операндов не совпадают: ' + d.name + ' — ' + d.s + ' бит, ' + s.name + ' — ' + s.s + ' бит. Расширь меньший операнд или возьми регистр нужного размера (например, CL вместо CX).');
      if (s.k === 'imm' && (s.v < -P2(d.s - 1) || s.v > P2(d.s) - 1)) throw new AsmError(line, 'Число ' + s.name + ' не помещается в ' + d.s + ' бит');
      return;
    }
    if (op === 'movzx' || op === 'movsx') { need(2); fix(ops[1]); if (ops[0].k !== 'reg' || ops[1].k === 'imm' || ops[1].s >= ops[0].s) throw new AsmError(line, op.toUpperCase() + ': приёмник — регистр большего размера, источник — меньшего'); return; }
    if (op === 'lea') { need(2); if (ops[0].k !== 'reg' || ops[1].k === 'imm' || ops[1].k === 'reg') throw new AsmError(line, 'LEA регистр, переменная'); return; }
    if (['shl', 'shr', 'sal', 'sar', 'rol', 'ror'].indexOf(op) >= 0) { need(2); fix(ops[0]); if (ops[0].k === 'imm' || !(ops[1].k === 'imm' || (ops[1].k === 'reg' && ops[1].name === 'CL'))) throw new AsmError(line, op.toUpperCase() + ': формат ' + op + ' регистр, число (или CL)'); return; }
    if (['inc', 'dec', 'neg', 'not', 'mul', 'div', 'idiv', 'pop'].indexOf(op) >= 0) { need(1); fix(ops[0]); if (ops[0].k === 'imm') throw new AsmError(line, op.toUpperCase() + ': операнд не может быть числом', 'Нужен регистр или переменная.'); return; }
    if (op === 'push') { need(1); fix(ops[0], { s: mode }); return; }
    if (op === 'imul') { if (ops.length < 1 || ops.length > 3) need(1); fix(ops[0]); if (ops.length > 1 && ops[0].k !== 'reg') throw new AsmError(line, 'IMUL с 2–3 операндами: первый — регистр'); return; }
    if (['cbw', 'cwd', 'cwde', 'cdq', 'exit', 'nop', 'ret', 'clc', 'stc'].indexOf(op) >= 0) { if (op !== 'ret') need(0); return; }
    if (op === 'int') { need(1); return; }
    throw new AsmError(line, 'Команду ' + op.toUpperCase() + ' симулятор пока не поддерживает', 'Есть: MOV, MOVZX, MOVSX, LEA, XCHG, ADD, ADC, SUB, SBB, INC, DEC, NEG, MUL, IMUL, DIV, IDIV, AND, OR, XOR, NOT, TEST, CMP, SHL, SHR, SAR, ROL, ROR, CBW, CWD, CWDE, CDQ, JMP, Jcc, LOOP, PUSH, POP, CALL, RET, INT 21h, exit.');
  }
  function initState(prog) {
    if (prog.mode === 'edu') { var r = {}; Object.keys(prog.init).forEach(function (k) { r[k] = prog.init[k]; }); var c = {}; Object.keys(prog.mem0).forEach(function (k) { c[k] = prog.mem0[k]; }); return { regs: r, cells: c, flags: {}, mem: [], out: '', done: false, pc: 0, stack: [] }; }
    var regs = prog.mode === 32 ? { eax: 0x0019FFCC, ebx: 0x003BE000, ecx: 0, edx: 0x00401000, esi: 0, edi: 0, ebp: 0x0019FF80, esp: 0x0019FF74 } : { eax: 0, ebx: 0, ecx: 0, edx: 0, esi: 0, edi: 0, ebp: 0, esp: 0x100 };
    return { regs: regs, flags: { CF: 0, ZF: 0, SF: 0, OF: 0, PF: 0, AF: 0 }, mem: prog.mem.slice(), out: '', done: false, pc: prog.start || 0, stack: [], steps: 0 };
  }
  function cloneState(s) { var r = {}, f = {}, c = {}; Object.keys(s.regs).forEach(function (k) { r[k] = s.regs[k]; }); Object.keys(s.flags).forEach(function (k) { f[k] = s.flags[k]; }); if (s.cells) Object.keys(s.cells).forEach(function (k) { c[k] = s.cells[k]; }); return { regs: r, flags: f, cells: c, mem: s.mem.slice(), out: s.out, done: s.done, pc: s.pc, stack: s.stack.slice(), steps: s.steps, inp: s.inp }; }
  function getReg(st, o) { var v = st.regs[o.r]; if (o.p === 'e') return v; if (o.p === 'x') return v & 0xFFFF; if (o.p === 'l') return v & 0xFF; return (v >>> 8) & 0xFF; }
  function setReg(st, o, val) {
    var v = st.regs[o.r];
    if (o.p === 'e') v = norm(val, 32); else if (o.p === 'x') v = v - (v & 0xFFFF) + norm(val, 16); else if (o.p === 'l') v = v - (v & 0xFF) + norm(val, 8); else v = v - (v & 0xFF00) + norm(val, 8) * 256;
    st.regs[o.r] = norm(v, 32);
  }
  function readMem(st, addr, bytes) { var v = 0; for (var k = 0; k < bytes; k++) v += (st.mem[addr + k] || 0) * P2(8 * k); return v; }
  function writeMem(st, addr, bytes, val) { var u = norm(val, bytes * 8); for (var k = 0; k < bytes; k++) st.mem[addr + k] = Math.floor(u / P2(8 * k)) & 0xFF; }
  function addrOf(st, o) { return o.k === 'ind' ? o.base + o.disp + getReg(st, o.reg) : o.addr; }
  function rd(st, o, size) { if (o.k === 'reg') return getReg(st, o); if (o.k === 'mem' || o.k === 'ind') return readMem(st, addrOf(st, o), o.s / 8); return norm(o.v, size || 32); }
  function wr(st, o, val) { if (o.k === 'reg') setReg(st, o, val); else writeMem(st, addrOf(st, o), o.s / 8, val); }
  function setSZP(st, res, b) { st.flags.ZF = res === 0 ? 1 : 0; st.flags.SF = res >= P2(b - 1) ? 1 : 0; st.flags.PF = parity(res); }
  function flagsTxt(f) { return 'CF=' + f.CF + ' ZF=' + f.ZF + ' SF=' + f.SF + ' OF=' + f.OF; }
  function valTxt(v, b) { var u = norm(v, b), s = signed(u, b); return hx(u, b) + ' = ' + (s === u ? u : (u + ' (без знака) / ' + fmtNeg(s) + ' (со знаком)')); }
  var ACC = { 8: { k: 'reg', r: 'eax', p: 'l', s: 8, name: 'AL' }, 16: { k: 'reg', r: 'eax', p: 'x', s: 16, name: 'AX' }, 32: { k: 'reg', r: 'eax', p: 'e', s: 32, name: 'EAX' } };
  var DACC = { 8: { k: 'reg', r: 'eax', p: 'h', s: 8, name: 'AH' }, 16: { k: 'reg', r: 'edx', p: 'x', s: 16, name: 'DX' }, 32: { k: 'reg', r: 'edx', p: 'e', s: 32, name: 'EDX' } };
  function jumpOk(op, f, st, prog) {
    switch (op) {
      case 'jmp': return true; case 'je': case 'jz': return f.ZF === 1; case 'jne': case 'jnz': return f.ZF === 0;
      case 'jg': case 'jnle': return f.ZF === 0 && f.SF === f.OF; case 'jge': case 'jnl': return f.SF === f.OF;
      case 'jl': case 'jnge': return f.SF !== f.OF; case 'jle': case 'jng': return f.ZF === 1 || f.SF !== f.OF;
      case 'ja': case 'jnbe': return f.CF === 0 && f.ZF === 0; case 'jae': case 'jnb': case 'jnc': return f.CF === 0;
      case 'jb': case 'jc': case 'jnae': return f.CF === 1; case 'jbe': case 'jna': return f.CF === 1 || f.ZF === 1;
      case 'js': return f.SF === 1; case 'jns': return f.SF === 0; case 'jo': return f.OF === 1; case 'jno': return f.OF === 0;
      case 'jcxz': return (st.regs.ecx & 0xFFFF) === 0; case 'jecxz': return st.regs.ecx === 0;
    }
    return false;
  }
  function execStep(prog, st) {
    if (prog.mode === 'edu') return execEdu(prog, st);
    var ins = prog.code[st.pc]; if (!ins) { st.done = true; return { lead: 'Конец программы', txt: '' }; }
    st.pc++; st.steps = (st.steps || 0) + 1;
    if (ins.skip) return { lead: ins.raw, txt: ins.skip };
    var op = ins.op, ops = ins.ops, f = st.flags, lead = ins.raw, txt = '', pre = '', d = ops[0], s = ops[1];
    var extPre = function (fromName, fromV, fromB, toName, toV, toB, fill) {
      var fb = bin(fromV, fromB), pad = rep(' ', bin(toV, toB).length - fb.length);
      return 'было  ' + fromName + ' = ' + pad + fb + '   (' + hx(fromV, fromB) + ' = ' + fmtNeg(signed(fromV, fromB)) + ' со знаком / ' + norm(fromV, fromB) + ' без знака)\nстало ' + toName + ' = ' + bin(toV, toB) + '   (' + hx(toV, toB) + ' = ' + fmtNeg(signed(toV, toB)) + ' / ' + norm(toV, toB) + ')\n' + rep(' ', toName.length + 9) + rep('^', Math.max(1, bin(toV, toB).length - fb.length - 1)) + ' дописано: ' + fill;
    };
    var sp = function (dir, b) { var R = prog.mode === 32 ? 'esp' : 'esp'; st.regs[R] = norm(st.regs[R] + dir * b / 8, 32); };
    switch (op) {
      case 'endp': if (st.stack.length) { var ra = st.stack.pop(); st.pc = ra.pc; sp(1, prog.mode); return { lead: lead, txt: 'Конец процедуры без ret — возвращаемся.', hidden: 1 }; } st.done = true; return { lead: lead, txt: 'Конец процедуры main.' };
      case 'nop': txt = 'NOP — «ничего не делать». Занимает время и место, и всё.'; break;
      case 'clc': f.CF = 0; txt = 'CLC: CF = 0.'; break;
      case 'stc': f.CF = 1; txt = 'STC: CF = 1.'; break;
      case 'mov': { var b = d.s, v = rd(st, s, b), before = d.k === 'reg' && d.p === 'h' ? (st.regs[d.r] & 0xFF) : null; wr(st, d, v);
        if (d.k === 'reg' && d.p === 'h' && s.k === 'imm' && s.v === 0) { var X = d.name[0], ax = st.regs[d.r] & 0xFFFF;
          lead = ins.raw + '   ← беззнаковое расширение байта до слова';
          txt = X + 'H = 0000 0000, значит ' + X + 'X = ' + X + 'H : ' + X + 'L. Слева дописали 8 нулей — число стало 16-битным и НЕ изменилось. Так расширяют только беззнаковые (и положительные) числа. Для знаковых нужен CBW.';
          pre = extPre(X + 'L', before, 8, X + 'X', ax, 16, '8 нулей (' + X + 'H = 0000 0000)'); }
        else { var from = s.k === 'imm' ? 'число ' + s.name : (s.k === 'mem' || s.k === 'ind') ? 'значение из памяти ' + s.name + (s.k === 'ind' ? ' (адрес ' + addrOf(st, s) + ')' : '') : 'регистр ' + s.name;
          txt = 'Копируем ' + from + ' в ' + d.name + ': ' + d.name + ' = ' + bin(v, b) + ' = ' + valTxt(v, b) + '. MOV ничего не считает и флаги не меняет.' + (d.k === 'reg' && d.s < 32 && prog.mode === 32 ? ' Остальные биты E' + (d.name.length === 2 && /[XHL]$/.test(d.name) ? d.name[0] + 'X' : d.name) + ' не тронуты.' : '') + (/^OFFSET/.test(s.name) ? ' OFFSET — это адрес, где в памяти начинается переменная.' : ''); }
        break; }
      case 'lea': { var a0 = addrOf(st, s); wr(st, d, a0); txt = 'LEA кладёт в ' + d.name + ' АДРЕС ' + s.name + ' (= ' + a0 + '), а не значение. Как OFFSET.'; break; }
      case 'xchg': { var xa = rd(st, d, d.s), xb = rd(st, s, d.s); wr(st, d, xb); wr(st, s, xa); txt = 'XCHG меняет местами: ' + d.name + ' = ' + valTxt(xb, d.s) + ', ' + s.name + ' = ' + valTxt(xa, d.s) + '.'; break; }
      case 'movzx': case 'movsx': { var v2 = rd(st, s), sg = op === 'movsx', r2 = sg ? norm(signed(v2, s.s), d.s) : v2; wr(st, d, r2); var ng = v2 >= P2(s.s - 1);
        lead = ins.raw + '   ← ' + (sg ? 'знаковое' : 'беззнаковое') + ' расширение ' + s.s + ' → ' + d.s + ' бит';
        txt = sg ? 'MOVSX копирует знаковый бит ' + s.name + ' (' + (ng ? 1 : 0) + ') во все новые старшие биты. Число со знаком не меняется: ' + fmtNeg(signed(v2, s.s)) + '.' : 'MOVZX дописывает слева нули. Число без знака не меняется: ' + v2 + '.';
        pre = extPre(s.name, v2, s.s, d.name, r2, d.s, sg ? (ng ? 'единицы (копии знака 1)' : 'нули (копии знака 0)') : 'нули'); break; }
      case 'add': case 'adc': case 'sub': case 'sbb': case 'cmp': {
        var bb = d.s, a = rd(st, d, bb), c = rd(st, s, bb), cin = (op === 'adc' || op === 'sbb') ? f.CF : 0, isAdd = op === 'add' || op === 'adc', r, res;
        if (isAdd) { r = a + c + cin; res = norm(r, bb); f.CF = r >= P2(bb) ? 1 : 0; f.OF = ((signed(a, bb) + signed(c, bb) + cin) > P2(bb - 1) - 1 || (signed(a, bb) + signed(c, bb) + cin) < -P2(bb - 1)) ? 1 : 0; }
        else { r = a - c - cin; res = norm(r, bb); f.CF = r < 0 ? 1 : 0; f.OF = ((signed(a, bb) - signed(c, bb) - cin) > P2(bb - 1) - 1 || (signed(a, bb) - signed(c, bb) - cin) < -P2(bb - 1)) ? 1 : 0; }
        f.AF = ((a ^ c ^ res) & 0x10) ? 1 : 0; setSZP(st, res, bb);
        if (op !== 'cmp') wr(st, d, res);
        var sign = isAdd ? '+' : '−';
        txt = d.name + ' = ' + hx(a, bb) + ' ' + sign + ' ' + hx(c, bb) + (cin ? ' ' + sign + ' CF(1)' : (op === 'adc' || op === 'sbb' ? ' ' + sign + ' CF(0)' : '')) + ' = ' + valTxt(res, bb) + '. ' + flagsTxt(f) + '.';
        var w = bin(a, bb).length, dd = function (vv) { return hx(vv, bb) + ' = ' + decS(vv, bb); };
        pre = '  ' + bin(a, bb) + '   (' + dd(a) + ')\n' + sign + ' ' + bin(c, bb) + '   (' + dd(c) + ')' + ((op === 'adc' || op === 'sbb') ? '\n' + sign + ' ' + rep(' ', w - 1) + cin + '   (CF)' : '') + '\n  ' + rep('─', w) + '\n' + (isAdd && f.CF ? '1' : ' ') + ' ' + bin(res, bb) + '   (' + dd(res) + ')' + (isAdd && f.CF ? '\n↑ этот 1 не влез в ' + bb + ' бит → ушёл в CF' : '');
        if (f.CF) txt += isAdd ? ' CF=1: перенос за пределы ' + bb + ' бит (для беззнаковых результат не влез).' : ' CF=1: был заём (без знака первое меньше второго).';
        if (f.OF) txt += ' OF=1: знаковое переполнение — результат со знаком неверный!';
        if (op === 'cmp') txt = 'CMP сравнивает: вычитает, но результат НЕ записывает — меняются только флаги (для следующего перехода). ' + txt;
        break; }
      case 'xor': case 'and': case 'or': case 'test': { var b3 = d.s, a3 = rd(st, d, b3), c3 = rd(st, s, b3), r3 = op === 'xor' ? norm((a3 ^ c3) >>> 0, b3) : op === 'or' ? norm((a3 | c3) >>> 0, b3) : norm((a3 & c3) >>> 0, b3);
        if (op !== 'test') wr(st, d, r3); f.CF = 0; f.OF = 0; f.AF = 0; setSZP(st, r3, b3);
        txt = (op === 'xor' && d.k === 'reg' && s.k === 'reg' && d.name === s.name) ? d.name + ' XOR ' + d.name + ' = 0 — быстрый способ обнулить регистр. ZF=1.' : (op === 'test' ? 'TEST = AND без записи, только флаги. ' : '') + d.name + ' ' + op.toUpperCase() + ' ' + s.name + ' = ' + valTxt(r3, b3) + '. ' + flagsTxt(f) + '.';
        pre = '  ' + bin(a3, b3) + '\n' + { xor: '⊕', and: '&', or: '|', test: '&' }[op] + ' ' + bin(c3, b3) + '\n  ' + rep('─', bin(a3, b3).length) + '\n  ' + bin(r3, b3); break; }
      case 'not': { var a4 = rd(st, d, d.s), r4 = norm(~a4 >>> 0, d.s); wr(st, d, r4); txt = 'NOT переворачивает все биты: ' + d.name + ' = ' + valTxt(r4, d.s) + '. Флаги не меняются.'; pre = '  ' + bin(a4, d.s) + '\n→ ' + bin(r4, d.s); break; }
      case 'neg': { var a5 = rd(st, d, d.s), r5 = norm(-a5, d.s); wr(st, d, r5); f.CF = a5 ? 1 : 0; f.OF = a5 === P2(d.s - 1) ? 1 : 0; setSZP(st, r5, d.s); txt = 'NEG меняет знак (дополнительный код: инвертировать биты и прибавить 1): ' + fmtNeg(signed(a5, d.s)) + ' → ' + fmtNeg(signed(r5, d.s)) + ' = ' + hx(r5, d.s) + '. ' + flagsTxt(f) + '.'; break; }
      case 'shl': case 'sal': case 'shr': case 'sar': case 'rol': case 'ror': { var b6 = d.s, a6 = rd(st, d, b6), n6 = (s.k === 'imm' ? s.v : getReg(st, s)) & 31, r6 = a6;
        for (var q = 0; q < n6; q++) {
          if (op === 'shl' || op === 'sal') { f.CF = (r6 >= P2(b6 - 1)) ? 1 : 0; r6 = norm(r6 * 2, b6); }
          else if (op === 'shr') { f.CF = r6 & 1; r6 = Math.floor(r6 / 2); }
          else if (op === 'sar') { f.CF = r6 & 1; r6 = norm(Math.floor(signed(r6, b6) / 2), b6); }
          else if (op === 'rol') { var hi = r6 >= P2(b6 - 1) ? 1 : 0; r6 = norm(r6 * 2 + hi, b6); f.CF = hi; }
          else { var lo = r6 & 1; r6 = Math.floor(r6 / 2) + lo * P2(b6 - 1); f.CF = lo; }
        }
        wr(st, d, r6); if (op !== 'rol' && op !== 'ror') setSZP(st, r6, b6);
        txt = d.name + ' = ' + hx(a6, b6) + ' ' + { shl: 'сдвиг влево', sal: 'сдвиг влево', shr: 'сдвиг вправо (слева нули)', sar: 'арифметический сдвиг вправо (слева копии знака)', rol: 'циклический сдвиг влево', ror: 'циклический сдвиг вправо' }[op] + ' на ' + n6 + ' = ' + hx(r6, b6) +
          (op === 'shl' || op === 'sal' ? ' (умножить на ' + P2(n6) + ')' : op === 'shr' ? ' (разделить без знака на ' + P2(n6) + ')' : op === 'sar' ? ' (разделить со знаком на ' + P2(n6) + ')' : '') + '. Последний «вылетевший» бит — в CF = ' + f.CF + '.';
        pre = '  ' + bin(a6, b6) + '\n→ ' + bin(r6, b6); break; }
      case 'inc': case 'dec': { var b7 = d.s, a7 = rd(st, d, b7), r7 = norm(op === 'inc' ? a7 + 1 : a7 - 1, b7); f.OF = (op === 'inc' ? a7 === P2(b7 - 1) - 1 : a7 === P2(b7 - 1)) ? 1 : 0; f.AF = ((a7 ^ 1 ^ r7) & 0x10) ? 1 : 0; setSZP(st, r7, b7); wr(st, d, r7); txt = d.name + ' ' + (op === 'inc' ? '+ 1' : '− 1') + ' = ' + valTxt(r7, b7) + '. CF не меняется (в отличие от ADD/SUB).'; break; }
      case 'mul': case 'imul': {
        if (op === 'imul' && ops.length > 1) { var bI = d.s, x1 = signed(rd(st, ops.length === 3 ? s : d, bI), bI), x2 = signed(rd(st, ops.length === 3 ? ops[2] : s, bI), bI), pr = x1 * x2, rI = norm(pr, bI); wr(st, d, rI); f.CF = f.OF = (pr !== signed(rI, bI)) ? 1 : 0; txt = 'IMUL (со знаком): ' + d.name + ' = ' + fmtNeg(x1) + ' × ' + fmtNeg(x2) + ' = ' + fmtNeg(signed(rI, bI)) + (f.OF ? ' — НЕ влезло в ' + bI + ' бит! CF=OF=1.' : '. CF=OF=0 — влезло.'); break; }
        var b8 = d.s, sgn = op === 'imul', m1 = rd(st, ACC[b8], b8), m2 = rd(st, d, b8); if (sgn) { m1 = signed(m1, b8); m2 = signed(m2, b8); }
        var big = BigInt(m1) * BigInt(m2), full = BigInt.asUintN(2 * b8, big), lowv = Number(full & BigInt(P2(b8) - 1)), highv = Number(full >> BigInt(b8));
        if (b8 === 8) setReg(st, ACC[16], Number(full)); else { setReg(st, ACC[b8], lowv); setReg(st, DACC[b8], highv); }
        var fits = sgn ? BigInt.asIntN(b8, BigInt(lowv)) === big : highv === 0; f.CF = f.OF = fits ? 0 : 1;
        var resN = b8 === 8 ? 'AX' : DACC[b8].name + ':' + ACC[b8].name;
        txt = (sgn ? 'IMUL (со знаком)' : 'MUL (без знака)') + ': ' + ACC[b8].name + ' × ' + d.name + ' = ' + fmtNeg(m1) + ' × ' + fmtNeg(m2) + ' = ' + big + '. Результат вдвое длиннее — он в ' + resN + (b8 === 8 ? '' : ' (старшая половина в ' + DACC[b8].name + ')') + '. ' + (f.CF ? 'CF=OF=1: старшая половина нужна.' : 'CF=OF=0: старшая половина пустая.');
        break; }
      case 'div': case 'idiv': {
        var b9 = d.s, sg9 = op === 'idiv', dv = rd(st, d, b9); if (sg9) dv = signed(dv, b9);
        if (!dv) { st.done = true; return { lead: lead, txt: 'Деление на ноль! Настоящая программа упала бы с ошибкой «Integer divide by zero».', err: 1 }; }
        var dd9 = b9 === 8 ? BigInt(getReg(st, ACC[16])) : (BigInt(getReg(st, DACC[b9])) << BigInt(b9)) + BigInt(getReg(st, ACC[b9]));
        if (sg9) dd9 = BigInt.asIntN(2 * b9, dd9);
        var qq = dd9 / BigInt(dv), rr = dd9 % BigInt(dv);
        if ((sg9 && (qq > BigInt(P2(b9 - 1) - 1) || qq < BigInt(-P2(b9 - 1)))) || (!sg9 && qq > BigInt(P2(b9) - 1))) { st.done = true; return { lead: lead, txt: 'Частное не влезает в ' + b9 + ' бит — переполнение при делении (программа упала бы). Делимое — это ' + (b9 === 8 ? 'весь AX' : DACC[b9].name + ':' + ACC[b9].name) + '; не забыл обнулить ' + (b9 === 8 ? 'AH' : DACC[b9].name) + ' (или CBW/CWD/CDQ для знаковых)?', err: 1 }; }
        setReg(st, ACC[b9], Number(BigInt.asUintN(b9, qq))); setReg(st, DACC[b9], Number(BigInt.asUintN(b9, rr)));
        txt = (sg9 ? 'IDIV (со знаком)' : 'DIV (без знака)') + ': ' + (b9 === 8 ? 'AX' : DACC[b9].name + ':' + ACC[b9].name) + ' / ' + d.name + ' = ' + dd9 + ' / ' + dv + ' → частное ' + qq + ' в ' + ACC[b9].name + ', остаток ' + rr + ' в ' + DACC[b9].name + '.';
        break; }
      case 'cbw': { var al = st.regs.eax & 0xFF, n1 = al >= 0x80, ax1 = n1 ? 0xFF00 + al : al; setReg(st, ACC[16], ax1);
        lead = 'cbw   ← знаковое расширение AL (8 бит) → AX (16 бит)';
        txt = 'Старший бит AL — это знак: AL = ' + bin(al, 8) + ', знак = ' + (n1 ? 1 : 0) + ' (' + (n1 ? 'отрицательное' : 'положительное') + '). CBW копирует его во все 8 бит AH: AH = ' + (n1 ? '1111 1111' : '0000 0000') + '. Значение не изменилось (' + fmtNeg(signed(al, 8)) + '), теперь оно в 16 битах.' + (n1 ? ' С mov ah, 0 вышло бы ' + al + ' — совсем другое число!' : ' Для положительного CBW = mov ah, 0.');
        pre = extPre('AL', al, 8, 'AX', ax1, 16, n1 ? '8 единиц — копии знака (AH = FFh)' : '8 нулей (AH = 00h)'); break; }
      case 'cwd': { var axv = st.regs.eax & 0xFFFF, n2 = axv >= 0x8000, dx = n2 ? 0xFFFF : 0; setReg(st, DACC[16], dx);
        lead = 'cwd   ← знаковое расширение AX (16 бит) → DX:AX (32 бита)';
        txt = 'Как CBW, только шире: знак AX = ' + (n2 ? 1 : 0) + ', его копии заполняют DX = ' + hx(dx, 16) + '. Пара DX:AX — то же число ' + fmtNeg(signed(axv, 16)) + ' в 32 битах. Нужно перед IDIV.';
        pre = extPre('AX', axv, 16, 'DX:AX', dx * 65536 + axv, 32, n2 ? '16 единиц (DX = FFFFh)' : '16 нулей (DX = 0000h)'); break; }
      case 'cwde': { var a16 = st.regs.eax & 0xFFFF, e = norm(signed(a16, 16), 32); st.regs.eax = e; txt = 'CWDE: AX → EAX со знаком. EAX = ' + valTxt(e, 32) + '.'; pre = extPre('AX', a16, 16, 'EAX', e, 32, a16 >= 0x8000 ? 'единицы' : 'нули'); break; }
      case 'cdq': { var n3 = st.regs.eax >= 0x80000000; st.regs.edx = n3 ? 0xFFFFFFFF : 0; txt = 'CDQ: EAX → EDX:EAX со знаком. EDX = ' + hx(st.regs.edx, 32) + '. Нужно перед IDIV для 32 бит.'; break; }
      case 'push': { var bP = d.k === 'imm' ? prog.mode : d.s, vP = rd(st, d, bP); st.stack.push({ v: vP, b: bP }); sp(-1, bP); txt = 'PUSH кладёт ' + d.name + ' = ' + valTxt(vP, bP) + ' на вершину стека. ESP уменьшился на ' + bP / 8 + ' (стек растёт вниз). В стеке сейчас: ' + st.stack.length + '.'; break; }
      case 'pop': { if (!st.stack.length) { st.done = true; return { lead: lead, txt: 'POP из пустого стека — программа упала бы!', err: 1 }; } var top = st.stack.pop(); wr(st, d, top.v); sp(1, d.s); txt = 'POP снимает верхнее значение стека (' + valTxt(top.v, d.s) + ') в ' + d.name + '. Последним положил — первым снял (LIFO).'; break; }
      case 'ret': { if (!st.stack.length) { st.done = true; txt = 'RET из main — программа завершена.'; break; } var back = st.stack.pop(); st.pc = back.pc; sp(1, prog.mode); txt = 'RET: адрес возврата снят со стека — продолжаем после call (строка ' + (prog.code[back.pc] ? prog.code[back.pc].line + 1 : '—') + ').'; break; }
      case 'int': { var ah = (st.regs.eax >>> 8) & 0xFF;
        if (ah === 0x4C) { st.done = true; txt = 'INT 21h с AH = 4Ch — завершение программы (DOS).'; }
        else if (ah === 2) { st.out += String.fromCharCode(st.regs.edx & 0xFF); txt = 'INT 21h, AH = 2: печать символа из DL («' + String.fromCharCode(st.regs.edx & 0xFF) + '»).'; }
        else if (ah === 9) { var p9 = st.regs.edx & 0xFFFF, s9 = ''; while (p9 < st.mem.length && st.mem[p9] !== 36 && s9.length < 500) { s9 += String.fromCharCode(st.mem[p9]); p9++; } st.out += s9; txt = 'INT 21h, AH = 9: печать строки с адреса DX до символа $: «' + s9 + '».'; }
        else txt = 'INT 21h с AH = ' + hx(ah, 8) + ' — в симуляторе ничего не делает.';
        break; }
      case 'exit': st.done = true; txt = 'exit — программа завершена (в Irvine32 это вызов ExitProcess).'; break;
      case 'call': {
        var fn = ins.fn, eax = st.regs.eax;
        if (prog.procs[fn] != null) { st.stack.push({ pc: st.pc, ret: 1, v: st.pc, b: prog.mode }); sp(-1, prog.mode); st.pc = prog.procs[fn]; txt = 'CALL ' + ins.args[0] + ': адрес возврата положен в стек, прыгаем в процедуру. Обратно вернёт RET.'; break; }
        if (fn === 'dumpregs') { st.out += dumpRegs(st, prog) + '\n'; txt = 'DumpRegs печатает все регистры и флаги — смотри консоль.'; }
        else if (fn === 'writedec') { st.out += String(eax); txt = 'WriteDec печатает EAX как беззнаковое: ' + eax; }
        else if (fn === 'writeint') { var sv = signed(eax, 32); st.out += (sv >= 0 ? '+' : '') + sv; txt = 'WriteInt печатает EAX со знаком: ' + (sv >= 0 ? '+' : '') + sv; }
        else if (fn === 'writehex') { st.out += hxr(eax, 32); txt = 'WriteHex печатает EAX в шестнадцатеричном виде: ' + hxr(eax, 32); }
        else if (fn === 'writebin') { st.out += bin(eax, 32); txt = 'WriteBin печатает EAX в двоичном виде.'; }
        else if (fn === 'writechar') { st.out += String.fromCharCode(eax & 0xFF); txt = 'WriteChar печатает символ из AL: «' + String.fromCharCode(eax & 0xFF) + '».'; }
        else if (fn === 'writestring') { var a8 = st.regs.edx, str = ''; while (a8 < st.mem.length && st.mem[a8] !== 0 && str.length < 500) { str += String.fromCharCode(st.mem[a8]); a8++; } st.out += str; txt = 'WriteString печатает строку с адреса EDX до байта 0: «' + str + '»'; }
        else if (fn === 'crlf') { st.out += '\n'; txt = 'Crlf — перевод строки.'; }
        else if (fn === 'clrscr') { st.out = ''; txt = 'Clrscr — очистить экран.'; }
        else if (fn === 'waitmsg') { st.out += 'Press any key to continue...\n'; txt = 'WaitMsg — «нажмите любую клавишу».'; }
        else if (fn === 'readint' || fn === 'readdec') {
          var q2 = st.inp = (st.inp || []).slice(), val = q2.length ? parseInt(q2.shift(), 10) || 0 : 0;
          st.regs.eax = norm(val, 32); st.out += val + '\n';
          txt = (fn === 'readint' ? 'ReadInt' : 'ReadDec') + ' читает число с клавиатуры в EAX. Ввели: ' + val + (q2.length || (st.inp0 && st.inp0.length) ? '' : ' (поле «Ввод» в студии пустое — взяли 0)') + '.';
        }
        break; }
      default:
        if (JCC[op]) {
          var go;
          if (op === 'loop') { if (prog.mode === 32) st.regs.ecx = norm(st.regs.ecx - 1, 32); else setReg(st, { r: 'ecx', p: 'x' }, (st.regs.ecx & 0xFFFF) - 1); go = (prog.mode === 32 ? st.regs.ecx : st.regs.ecx & 0xFFFF) !== 0;
            txt = 'LOOP: ' + (prog.mode === 32 ? 'ECX' : 'CX') + ' − 1 = ' + (prog.mode === 32 ? st.regs.ecx : st.regs.ecx & 0xFFFF) + (go ? ' ≠ 0 → прыгаем на ' + ins.args[0] + ' (ещё круг).' : ' = 0 → цикл закончен, идём дальше.'); }
          else { go = jumpOk(op, f, st, prog); txt = op.toUpperCase() + ' — переход, если ' + JCC[op] + '. ' + (op === 'jmp' ? 'Прыгаем на ' + ins.args[0] + '.' : flagsTxt(f) + ' → ' + (go ? 'условие выполнено, прыгаем на ' + ins.args[0] + '.' : 'условие НЕ выполнено, идём на следующую строку.')); }
          if (go) st.pc = prog.labels[ins.lbl];
          if (st.steps > 20000) { st.done = true; txt = 'Похоже на бесконечный цикл (20 000 шагов) — остановлено.'; }
        }
    }
    if (st.pc >= prog.code.length) st.done = true;
    return { lead: lead, txt: txt, pre: pre, comment: ins.comment };
  }
  function dumpRegs(st, prog) {
    var r = st.regs, f = st.flags, efl = f.CF * 1 + 2 + f.PF * 4 + f.AF * 16 + f.ZF * 64 + f.SF * 128 + 512 + f.OF * 2048;
    var eip = 0x00401000 + (prog.code[st.pc - 1] ? prog.code[st.pc - 1].line * 5 : 0);
    return '  EAX=' + hxr(r.eax, 32) + '  EBX=' + hxr(r.ebx, 32) + '  ECX=' + hxr(r.ecx, 32) + '  EDX=' + hxr(r.edx, 32) + '\n  ESI=' + hxr(r.esi, 32) + '  EDI=' + hxr(r.edi, 32) + '  EBP=' + hxr(r.ebp, 32) + '  ESP=' + hxr(r.esp, 32) + '\n  EIP=' + hxr(eip, 32) + '  EFL=' + hxr(efl, 32) + '  CF=' + f.CF + '  SF=' + f.SF + '  ZF=' + f.ZF + '  OF=' + f.OF + '  AF=' + f.AF + '  PF=' + f.PF;
  }

  /* ---------- подсветка кода ---------- */
  var KW = /^(mov|movzx|movsx|lea|xchg|add|adc|sub|sbb|inc|dec|neg|mul|imul|div|idiv|and|or|xor|not|test|cmp|shl|shr|sal|sar|rol|ror|cbw|cwd|cwde|cdq|jmp|je|jz|jne|jnz|jg|jge|jl|jle|ja|jae|jb|jbe|jc|jnc|js|jns|jo|jno|jnle|jnl|jnge|jng|jnbe|jnb|jnae|jna|jcxz|jecxz|loop|push|pop|call|ret|int|nop|exit|load|store|clc|stc)$/i;
  var DIR = /^(include|includelib|\.model|\.stack|\.data\??|\.code|\.386|\.586|proc|endp|end|db|dw|dd|byte|sbyte|word|sword|dword|sdword|dup|offset|ptr|small|flat|stdcall|type|sizeof|lengthof)$/i;
  function hlLine(line) {
    var sc = stripComment(line), body = sc[0], com = line.length > body.length ? line.slice(body.length) : '';
    var h = body.replace(/("[^"]*"|'[^']*')|([.\w@$?]+)|([^"'.\w@$?]+)/g, function (m, str, w, other) {
      if (str) return '<span class="as-s">' + esc(str) + '</span>';
      if (other) return esc(other);
      if (KW.test(w)) return '<span class="as-k">' + esc(w) + '</span>';
      if (DIR.test(w)) return '<span class="as-d">' + esc(w) + '</span>';
      if (REGMAP[w.toLowerCase()] || /^r\d$/i.test(w) || /^(pc|ds|es|ss|cs)$/i.test(w)) return '<span class="as-r">' + esc(w) + '</span>';
      if (parseNum(w) != null) return '<span class="as-n">' + esc(w) + '</span>';
      return esc(w);
    });
    return h + (com ? '<span class="as-c">' + esc(com) + '</span>' : '');
  }

  /* ---------- встраиваемая студия ---------- */
  var uid = 0;
  function mount(host, code, opts) {
    opts = opts || {}; var id = ++uid;
    host.classList.add('asm');
    host.innerHTML =
      '<div class="as-bar"><button class="as-b pri" data-a="run" title="Выполнить всё (F5)">▶ Запуск</button><button class="as-b" data-a="step" title="Одна команда (F10)">⏭ Шаг</button><button class="as-b" data-a="back" title="Шаг назад">◀ Назад</button><button class="as-b" data-a="reset" title="С начала">↺</button>' +
      '<span class="as-sep"></span>' + (opts.extraBtns || '') + '<span class="as-mode"></span><span class="as-grow"></span><label class="as-inp" title="Числа для ReadInt / ReadDec через пробел">Ввод: <input data-inp placeholder="напр. 5 7"></label></div>' +
      '<div class="as-main"><div class="as-ed"><div class="as-gut"></div><div class="as-wrap"><pre class="as-hl" aria-hidden="true"></pre><textarea spellcheck="false" wrap="off" autocomplete="off" autocapitalize="off" aria-label="Код на ассемблере"></textarea></div></div>' +
      '<div class="as-side"><div class="as-state"></div></div></div>' +
      '<div class="as-low"><div class="as-con"><div class="as-ct">Консоль</div><pre class="as-out"></pre></div><div class="as-expl" aria-live="polite"></div></div>';
    var ta = host.querySelector('textarea'), hl = host.querySelector('.as-hl'), gut = host.querySelector('.as-gut'), stEl = host.querySelector('.as-state'), ex = host.querySelector('.as-expl'), out = host.querySelector('.as-out'), md = host.querySelector('.as-mode'), wrap = host.querySelector('.as-wrap');
    var S = { prog: null, err: null, st: null, prev: null, hist: [], msg: null, src: code || '' };
    ta.value = S.src;
    var paint = function () {
      var lines = ta.value.replace(/\r/g, '').split('\n'), cur = S.prog && S.hist.length && S.st.pc >= 0 ? (S.lastLine != null ? S.lastLine : -1) : -1;
      var done = {}; S.hist.forEach(function (h) { if (h.line != null) done[h.line] = 1; });
      var next = S.prog && S.st && !S.st.done && S.prog.code[S.st.pc] ? S.prog.code[S.st.pc].line : -1;
      hl.innerHTML = lines.map(function (l, i) { return '<div class="' + (S.err && S.err.line === i ? 'err' : i === cur ? 'cur' : done[i] ? 'done' : '') + (i === next ? ' nx' : '') + '">' + (hlLine(l) || ' ') + '</div>'; }).join('');
      gut.innerHTML = lines.map(function (_, i) { return '<div class="' + (i === next ? 'nx' : i === cur ? 'cur' : '') + '">' + (i === next ? '➤' : '') + (i + 1) + '</div>'; }).join('');
      var w = Math.max.apply(null, lines.map(function (l) { return l.length; }).concat([30]));
      ta.style.width = hl.style.width = (w + 3) + 'ch'; ta.style.height = hl.style.height = (lines.length * 18 + 10) + 'px';
    };
    var build = function (keepMsg) {
      S.err = null; S.src = ta.value;
      try { S.prog = assemble(S.src); } catch (e) { if (e instanceof AsmError) { S.err = e; S.prog = null; } else throw e; }
      reset(keepMsg);
    };
    var reset = function (keepMsg) {
      S.hist = []; S.lastLine = null;
      if (S.prog) { S.st = initState(S.prog); S.st.inp = S.st.inp0 = (host.querySelector('[data-inp]').value.trim().split(/\s+/).filter(Boolean)); S.prev = cloneState(S.st);
        if (!keepMsg) S.msg = { lead: 'Готово — жми «⏭ Шаг» (по одной команде) или «▶ Запуск»', txt: S.prog.mode === 'edu' ? 'Учебная модель процессора: регистры R1–R3 и счётчик команд PC. Каждая команда — одна строка.' : S.prog.mode === 32 ? 'Режим Irvine32 (32 бита). При старте в регистрах «мусор» от Windows — поэтому в программах сначала обнуляют: xor eax, eax.' : 'Режим 8086 / DOS (16 бит, как emu8086). Регистры при старте = 0.' };
        md.textContent = S.prog.mode === 'edu' ? 'учебная модель' : S.prog.mode === 32 ? 'MASM · Irvine32 · 32 бита' : '8086 · DOS · 16 бит'; md.className = 'as-mode'; }
      else { S.st = null; md.textContent = 'ошибка сборки'; md.className = 'as-mode bad'; }
      render();
    };
    var step = function () {
      if (!S.prog || S.st.done) return false;
      var line = S.prog.code[S.st.pc] ? S.prog.code[S.st.pc].line : null;
      S.hist.push({ st: cloneState(S.st), prev: S.prev, msg: S.msg, line: line, last: S.lastLine });
      S.prev = cloneState(S.st); S.msg = execStep(S.prog, S.st); S.lastLine = line;
      if (S.msg && S.msg.hidden && !S.st.done) return step();
      return true;
    };
    var act = function (a) {
      if (a === 'reset') { build(); return; }
      if (!S.prog) return;
      if (a === 'back') { var h = S.hist.pop(); if (h) { S.st = h.st; S.prev = h.prev; S.msg = h.msg; S.lastLine = h.last; render(); } return; }
      if (a === 'step') { if (S.st.done) { reset(); return; } step(); render(); if (opts.onStep) opts.onStep(S); }
      if (a === 'run') { if (S.st.done) reset(true); var n = 0, first = S.prev; while (!S.st.done && n++ < 20000) step(); S.prev = first; S.msg = { lead: S.msg && S.msg.err ? S.msg.lead : '✓ Программа выполнена: ' + S.hist.length + ' команд', txt: S.msg && S.msg.err ? S.msg.txt : 'Подсвечено, что изменилось с начала. Чтобы понять каждую строку — «↺», потом «⏭ Шаг».' }; render(); if (opts.onRun) opts.onRun(S); }
    };
    var render = function () {
      paint();
      var bS = host.querySelector('[data-a="step"]'), bB = host.querySelector('[data-a="back"]'), bR = host.querySelector('[data-a="run"]');
      if (!S.prog) {
        stEl.innerHTML = '<div class="as-lbl">Сборка</div><p class="as-p">Программа не собралась — как в настоящем MASM. Исправь строку, отмеченную красным: всё соберётся само.</p>';
        ex.className = 'as-expl bad'; ex.innerHTML = '<b>Строка ' + (S.err.line + 1) + ': ' + esc(S.err.msg) + '</b><div>' + esc(S.err.hint) + '</div>';
        out.textContent = 'Assembling: Source.asm\nSource.asm(' + (S.err.line + 1) + ') : error A2008: ' + S.err.msg + '\n\nBuild FAILED.';
        bS.disabled = bB.disabled = bR.disabled = true; return;
      }
      var st = S.st, pv = S.prev, m32 = S.prog.mode === 32, edu = S.prog.mode === 'edu';
      bS.disabled = bR.disabled = false; bB.disabled = !S.hist.length; bS.textContent = st.done ? '↺ Сначала' : '⏭ Шаг';
      if (edu) {
        var rr = Object.keys(st.regs).map(function (k) { return '<div class="as-reg' + (st.regs[k] !== pv.regs[k] ? ' chg' : '') + '"><span class="rn">' + k + '</span><span class="rv">' + st.regs[k] + '</span></div>'; }).join('');
        var cc = Object.keys(st.cells);
        stEl.innerHTML = '<div class="as-lbl">Регистры</div><div class="as-regs edu">' + rr + '</div>' + (cc.length ? '<div class="as-lbl">Память</div><table class="as-mem"><tr><th>Адрес</th><th>Значение</th></tr>' + cc.map(function (a) { return '<tr class="' + (st.cells[a] !== pv.cells[a] ? 'chg' : '') + '"><td>[' + a + ']</td><td>' + st.cells[a] + '</td></tr>'; }).join('') + '</table>' : '');
      } else {
        var regRow = function (R) {
          var v = st.regs[R], p = pv.regs[R], hs = hxr(v, 32), ps = hxr(p, 32), seg = function (a, b, cls) { var s = hs.slice(a, b), o = ps.slice(a, b); return '<span class="' + cls + (s !== o ? ' chg' : '') + '">' + s + '</span>'; };
          var nm = R.toUpperCase();
          if (m32) return '<div class="as-reg' + (v !== p ? ' on' : '') + '"><span class="rn">' + nm + '</span><span class="rv">' + seg(0, 4, 'hi') + seg(4, 6, 'h8') + seg(6, 8, 'l8') + '</span><span class="rd">' + decS(v, 32) + '</span></div>';
          return '<div class="as-reg' + ((v & 0xFFFF) !== (p & 0xFFFF) ? ' on' : '') + '"><span class="rn">' + nm.slice(1) + '</span><span class="rv">' + seg(4, 6, 'h8') + seg(6, 8, 'l8') + '</span><span class="rd">' + decS(v & 0xFFFF, 16) + '</span></div>';
        };
        var fl = ['CF', 'ZF', 'SF', 'OF', 'PF', 'AF'].map(function (k) { return '<span class="as-fl' + (st.flags[k] ? ' on' : '') + (st.flags[k] !== pv.flags[k] ? ' chg' : '') + '" title="' + { CF: 'перенос (без знака)', ZF: 'результат ноль', SF: 'результат отрицательный', OF: 'переполнение (со знаком)', PF: 'чётное число единиц', AF: 'перенос из 3-го бита' }[k] + '">' + k + '=' + st.flags[k] + '</span>'; }).join('');
        var vs = Object.keys(S.prog.vars).map(function (k) { return S.prog.vars[k]; });
        var memRows = vs.map(function (v) {
          if (v.isStr) { var n = v.size * v.count, s = '', ch = false; for (var k = 0; k < n; k++) { var c = st.mem[v.addr + k]; if (c !== pv.mem[v.addr + k]) ch = true; s += c ? String.fromCharCode(c) : '·0'; } return '<tr class="' + (ch ? 'chg' : '') + '"><td>' + esc(v.name) + '</td><td>строка</td><td colspan="2">«' + esc(s) + '»</td></tr>'; }
          var b = v.size * 8, cells = [];
          for (var k2 = 0; k2 < Math.min(v.count, 16); k2++) { var a = v.addr + k2 * v.size, val = readMem(st, a, v.size), old = readMem(pv, a, v.size); cells.push({ bin: bin(val, b), val: val, ch: val !== old }); }
          return '<tr class="' + (cells.some(function (c) { return c.ch; }) ? 'chg' : '') + '"><td>' + esc(v.name) + (v.count > 1 ? '[' + v.count + ']' : '') + '</td><td>' + TYPE_RU[v.size].split(' · ')[0] + '</td><td class="bin">' + cells.map(function (c) { return c.bin; }).join('<br>') + '</td><td>' + cells.map(function (c) { return hx(c.val, b) + ' = ' + decS(c.val, b); }).join('<br>') + '</td></tr>';
        }).join('');
        stEl.innerHTML = '<div class="as-lbl">Регистры' + (m32 ? ' <small>(hex: старшие · <i class="h8">AH</i> · <i class="l8">AL</i>)</small>' : ' <small>(<i class="h8">AH</i> · <i class="l8">AL</i>)</small>') + '</div><div class="as-regs">' + (m32 ? ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'esp'] : ['eax', 'ebx', 'ecx', 'edx']).map(regRow).join('') + '</div>' +
          '<div class="as-lbl">Флаги</div><div class="as-flags">' + fl + '</div>' +
          (st.stack.length ? '<div class="as-lbl">Стек (вершина сверху)</div><div class="as-stack">' + st.stack.slice().reverse().map(function (x) { return '<span>' + (x.ret ? '↩ возврат' : hx(x.v, x.b) + ' = ' + decS(x.v, x.b)) + '</span>'; }).join('') + '</div>' : '') +
          (vs.length ? '<div class="as-lbl">Переменные в памяти</div><table class="as-mem"><tr><th>Имя</th><th>Тип</th><th>Биты</th><th>Значение</th></tr>' + memRows + '</table>' : '');
      }
      out.textContent = st.out || (S.hist.length ? '' : (edu ? '' : 'C:\\masm32> Source.exe\n'));
      var m = S.msg || { lead: '', txt: '' };
      ex.className = 'as-expl' + (m.err ? ' bad' : '');
      ex.innerHTML = '<b>' + esc(m.lead || '') + '</b><div>' + esc(m.txt || '') + '</div>' + (m.pre ? '<pre>' + esc(m.pre) + '</pre>' : '') + (m.comment ? '<div class="as-cm">💬 ' + esc(m.comment) + '</div>' : '');
      var cl = hl.querySelector('.cur'); if (cl) { var ed = host.querySelector('.as-ed'); if (cl.offsetTop < ed.scrollTop || cl.offsetTop > ed.scrollTop + ed.clientHeight - 40) ed.scrollTop = Math.max(0, cl.offsetTop - ed.clientHeight / 2); }
    };
    var tm = null;
    ta.addEventListener('input', function () { paint(); clearTimeout(tm); tm = setTimeout(function () { build(); S.msg = S.prog ? { lead: 'Код изменён — программа собрана заново', txt: 'Жми «⏭ Шаг» или «▶ Запуск».' } : S.msg; render(); if (opts.onChange) opts.onChange(ta.value); }, 600); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); var a = ta.selectionStart; ta.value = ta.value.slice(0, a) + '    ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = a + 4; ta.dispatchEvent(new Event('input')); }
    });
    host.addEventListener('keydown', function (e) { if (e.key === 'F10') { e.preventDefault(); act('step'); } else if (e.key === 'F5') { e.preventDefault(); act('run'); } });
    host.querySelector('.as-bar').addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.getAttribute('data-a')); });
    host.querySelector('[data-inp]').addEventListener('change', function () { reset(); });
    build();
    return {
      get: function () { return ta.value; },
      set: function (c) { ta.value = c; build(); },
      run: function () { act('run'); }, step: function () { act('step'); },
      state: function () { return S; }, focus: function () { ta.focus(); }
    };
  }

  /* ---------- окно «ASM-студия» ---------- */
  var DATA = null, dataP = null;
  function data() { if (DATA) return Promise.resolve(DATA); if (!dataP) dataP = fetch('data/subjects/arch/asm.json').then(function (r) { return r.json(); }).then(function (j) { DATA = j; return j; }); return dataP; }
  var TEMPLATE = 'INCLUDE Irvine32.inc\n\n.data\n    ; переменные: имя DB/DW/DWORD значение\n\n.code\nmain PROC\n    ; твой код здесь\n\n    call DumpRegs\n    exit\nmain ENDP\nEND main\n';
  var win = null;
  function studio(o) {
    o = o || {};
    if (win) win.remove();
    win = document.createElement('div'); win.className = 'asw' + (o.side ? ' side' : '');
    win.innerHTML = '<div class="asw-t"><span class="asw-ic">⚙</span><b>ASM-студия</b><span class="asw-tt">' + esc(o.title || 'Source.asm') + '</span><span class="as-grow"></span>' +
      (o.onTasks ? '<button class="as-b" data-tasks>📋 Задания</button>' : '') + '<button class="as-b" data-new title="Пустая программа">📄 Новый</button><button class="as-b" data-help title="Подсказка по командам">❓</button><button class="asw-x" data-x title="Закрыть">×</button></div><div class="asw-b"></div>';
    document.body.appendChild(win);
    var ed = mount(win.querySelector('.asw-b'), o.code != null ? o.code : TEMPLATE, o);
    win.querySelector('[data-x]').onclick = function () { close(); if (o.onClose) o.onClose(); };
    win.querySelector('[data-new]').onclick = function () { if (o.onNew) o.onNew(); ed.set(TEMPLATE); };
    win.querySelector('[data-help]').onclick = function () { help(win); };
    var tb = win.querySelector('[data-tasks]'); if (tb) tb.onclick = function () { o.onTasks(); };
    setTimeout(function () { ed.focus(); }, 50);
    win._ed = ed; return ed;
  }
  function help(w) {
    var old = w.querySelector('.as-help'); if (old) { old.remove(); return; }
    var h = document.createElement('div'); h.className = 'as-help';
    h.innerHTML = '<button class="asw-x" data-hx>×</button><b>Шпаргалка</b><table>' + [
      ['mov a, b', 'a ← b (копия, флаги не меняются)'], ['add / sub a, b', 'a ← a ± b, меняет флаги'], ['adc / sbb a, b', 'ещё ± CF (перенос из прошлой операции)'], ['inc / dec a', 'a ± 1 (CF не трогает)'],
      ['cbw · cwd', 'AL→AX · AX→DX:AX со знаком'], ['movzx / movsx', 'расширить нулями / знаком'], ['mul b', 'AX = AL·b (или DX:AX = AX·b)'], ['div b', 'AL = AX / b, AH = остаток'],
      ['cmp a, b', 'сравнить (вычесть без записи)'], ['je jne jg jl ja jb', 'переход по флагам после cmp'], ['loop м', 'ECX−1, если ≠ 0 — на метку м'], ['push / pop', 'положить / снять со стека'],
      ['call WriteInt', 'печать EAX со знаком (Irvine32)'], ['call WriteString', 'печать строки по адресу EDX (mov edx, OFFSET msg)'], ['call DumpRegs', 'все регистры и флаги'], ['exit', 'конец программы']
    ].map(function (r) { return '<tr><td><code>' + esc(r[0]) + '</code></td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table><p>Клавиши: <b>F10</b> — шаг, <b>F5</b> — запуск. Флаги: CF — перенос без знака, OF — переполнение со знаком, ZF — ноль, SF — минус.</p>';
    w.appendChild(h); h.querySelector('[data-hx]').onclick = function () { h.remove(); };
  }
  function close() { if (win) { win.remove(); win = null; } }
  window.ASM = { assemble: assemble, execStep: execStep, initState: initState, mount: mount, studio: studio, close: close, data: data, TEMPLATE: TEMPLATE, isOpen: function () { return !!win; }, editor: function () { return win && win._ed; } };
})();
