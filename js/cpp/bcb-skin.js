/* «Шкурка» эмулятора C++Builder 6 для игры: значки палитры и панели инструментов в стиле Builder 6
   (нарисованы заново пиксельной графикой — оригинальные картинки Borland не копируются), все вкладки палитры,
   стрелка-указатель, редактор без номеров строк. Подключается после bcb-ide.js. */
(function (G) {
  'use strict';
  var CPP = G.CPP; if (!CPP || !CPP.VCL) return;
  var V = CPP.VCL;
  var S = function (body, w) { w = w || 24; return '<svg class="bi" width="' + w + '" height="' + w + '" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">' + body + '</svg>'; };
  var box = function (x, y, w, h, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (fill || '#fff') + '"/>'; };
  /* утопленная рамка Windows: тёмная сверху-слева, светлая снизу-справа */
  var sunk = function (x, y, w, h) { return box(x, y, w, h, '#fff') + box(x, y, w, 1, '#808080') + box(x, y, 1, h, '#808080') + box(x + 1, y + 1, w - 2, 1, '#404040') + box(x + 1, y + 1, 1, h - 2, '#404040'); };
  var raised = function (x, y, w, h) { return box(x, y, w, h, '#d4d0c8') + box(x, y, w, 1, '#fff') + box(x, y, 1, h, '#fff') + box(x, y + h - 1, w, 1, '#404040') + box(x + w - 1, y, 1, h, '#404040') + box(x + 1, y + h - 2, w - 2, 1, '#808080') + box(x + w - 2, y + 1, 1, h - 2, '#808080'); };
  var txt = function (x, y, s, size, extra) { return '<text x="' + x + '" y="' + y + '" font-family="' + (extra && extra.f || 'Tahoma,Arial,sans-serif') + '" font-size="' + size + '" font-weight="' + (extra && extra.w || 400) + '" fill="' + (extra && extra.c || '#000') + '">' + s + '</text>'; };
  var lines = function (x, y, n, w, step, col) { var o = ''; for (var i = 0; i < n; i++) o += box(x, y + i * (step || 3), w - (i % 2) * 3, 1, col || '#000080'); return o; };
  var ICON = {
    TLabel: S(txt(5, 19, 'A', 18, { f: 'Times New Roman,serif', w: 700 })),
    TEdit: S(sunk(1, 6, 22, 12) + txt(4, 15, 'ab', 9) + box(16, 8, 1, 8, '#000')),
    TMemo: S(sunk(2, 2, 20, 20) + lines(5, 6, 5, 13, 3)),
    TButton: S(raised(1, 6, 22, 12) + txt(6, 15, 'OK', 8, { w: 700 })),
    TCheckBox: S(sunk(5, 5, 14, 14) + '<path d="M8 12 L10 15 L16 8" stroke="#000" stroke-width="2" fill="none"/>'),
    TRadioButton: S('<circle cx="12" cy="12" r="7" fill="#fff" stroke="#808080" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#000"/>'),
    TListBox: S(sunk(1, 2, 22, 20) + lines(4, 6, 5, 12, 3) + box(18, 4, 3, 16, '#d4d0c8')),
    TComboBox: S(sunk(1, 7, 22, 10) + lines(4, 11, 1, 10) + raised(15, 8, 7, 8) + '<path d="M16.5 11 h4 l-2 2.5z" fill="#000"/>'),
    TScrollBar: S(box(1, 8, 22, 8, '#e8e6e0') + raised(1, 8, 6, 8) + raised(17, 8, 6, 8) + raised(9, 9, 5, 6) + '<path d="M3 12 l2.5-2v4z M21 12 l-2.5-2v4z" fill="#000"/>'),
    TGroupBox: S('<rect x="2.5" y="7.5" width="19" height="13" fill="none" stroke="#808080"/><rect x="3.5" y="8.5" width="17" height="11" fill="none" stroke="#fff"/>' + box(5, 3, 13, 8, '#d4d0c8') + txt(6, 10, 'xy', 8)),
    TRadioGroup: S('<rect x="2.5" y="5.5" width="19" height="16" fill="none" stroke="#808080"/>' + box(5, 2, 9, 6, '#d4d0c8') + '<circle cx="8" cy="12" r="2.5" fill="#fff" stroke="#000"/><circle cx="8" cy="12" r="1" fill="#000"/><circle cx="8" cy="18" r="2.5" fill="#fff" stroke="#000"/>' + box(12, 11, 7, 1, '#000080') + box(12, 17, 7, 1, '#000080')),
    TPanel: S(raised(2, 5, 20, 14)),
    TMainMenu: S(raised(1, 3, 22, 18) + box(3, 5, 18, 4, '#fff') + txt(4, 9, 'File', 5) + box(3, 10, 18, 9, '#fff')),
    TPopupMenu: S(box(4, 2, 16, 20, '#fff') + '<rect x="4.5" y="2.5" width="15" height="19" fill="none" stroke="#000"/>' + box(6, 7, 12, 3, '#0a246a') + lines(6, 13, 3, 11, 3, '#000')),
    TBitBtn: S(raised(1, 6, 22, 12) + '<path d="M4 12 L6 15 L10 9" stroke="#008000" stroke-width="2" fill="none"/>' + txt(11, 15, 'Ok', 7)),
    TStaticText: S(sunk(2, 4, 20, 16) + txt(7, 17, 'A', 13, { f: 'Times New Roman,serif', w: 700 })),
    TShape: S('<circle cx="8" cy="9" r="5" fill="#ffff00" stroke="#000"/><rect x="11.5" y="11.5" width="9" height="9" fill="#ff0000" stroke="#000"/><path d="M3 21 l4-7 l4 7z" fill="#0000ff" stroke="#000"/>'),
    TImage: S(sunk(1, 3, 22, 18) + box(3, 5, 18, 14, '#80c0ff') + '<path d="M3 19 l6-8 l4 5 l3-3 l5 6z" fill="#008000"/><circle cx="17" cy="8" r="2" fill="#ffff00"/>'),
    TStatusBar: S(raised(1, 3, 22, 18) + box(3, 5, 18, 10, '#fff') + box(2, 16, 20, 4, '#d4d0c8') + box(2, 16, 20, 1, '#808080') + box(12, 17, 1, 3, '#808080')),
    TDateTimePicker: S(sunk(1, 7, 22, 10) + txt(3, 15, '12', 7) + raised(15, 8, 7, 8) + '<path d="M16.5 11 h4 l-2 2.5z" fill="#000"/>'),
    TTimer: S('<circle cx="12" cy="13" r="8" fill="#fff" stroke="#000" stroke-width="1.5"/>' + box(10, 2, 4, 3, '#808080') + '<path d="M12 13 V8 M12 13 L15 15" stroke="#c00000" stroke-width="1.5"/>'),
    TOpenDialog: S('<path d="M2 8 h7 l2 2 h10 v11 H2z" fill="#ffd966" stroke="#806000"/><path d="M2 21 l3-8 h18 l-3 8z" fill="#ffeb99" stroke="#806000"/>'),
    TSaveDialog: S(box(3, 3, 18, 18, '#000080') + box(6, 3, 12, 7, '#fff') + box(14, 4, 3, 5, '#000080') + box(6, 14, 12, 7, '#c0c0c0')),
    TFontDialog: S(txt(3, 18, 'F', 16, { f: 'Times New Roman,serif', w: 700, c: '#000080' }) + txt(12, 21, 'f', 11, { f: 'Times New Roman,serif', c: '#c00000' })),
    TColorDialog: S(box(2, 2, 9, 9, '#ff0000') + box(13, 2, 9, 9, '#00a000') + box(2, 13, 9, 9, '#0000ff') + box(13, 13, 9, 9, '#ffff00'))
  };
  Object.keys(ICON).forEach(function (k) { V.ICON[k] = ICON[k]; });
  /* все вкладки палитры, как в C++Builder 6 Enterprise (пустые вкладки — как будто компоненты не установлены) */
  var ALL = ['Standard', 'Additional', 'Win32', 'System', 'Data Access', 'Data Controls', 'dbExpress', 'DataSnap', 'BDE', 'ADO', 'InterBase', 'WebServices', 'InternetExpress', 'Internet', 'WebSnap', 'FastNet', 'Decision Cube', 'QReport', 'Dialogs', 'Win 3.1', 'Samples', 'ActiveX', 'COM+', 'Servers'];
  V.TABS.length = 0; ALL.forEach(function (t) { V.TABS.push(t); });

  /* значки панели инструментов (16×16) */
  var T = function (body) { return '<svg class="ti16" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' + body + '</svg>'; };
  var b16 = function (x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>'; };
  var TOOL = {
    newOther: T('<path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#000"/><path d="M10 1v3h3" fill="none" stroke="#000"/>' + b16(11, 0, 1, 1, '#ff0') + b16(13, 1, 1, 1, '#ff0')),
    open: T('<path d="M1 4h5l1 1h6v9H1z" fill="#ffd966" stroke="#806000"/><path d="M1 14l2-6h12l-2 6z" fill="#ffeb99" stroke="#806000"/>'),
    save: T(b16(1, 1, 14, 14, '#000080') + b16(4, 1, 8, 5, '#fff') + b16(9, 2, 2, 3, '#000080') + b16(4, 9, 8, 6, '#c0c0c0')),
    viewUnit: T('<path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#000"/>' + b16(5, 6, 6, 1, '#000080') + b16(5, 8, 5, 1, '#000080') + b16(5, 10, 6, 1, '#000080') + b16(5, 12, 4, 1, '#000080')),
    viewForm: T(b16(1, 2, 14, 12, '#d4d0c8') + '<rect x="1.5" y="2.5" width="13" height="11" fill="none" stroke="#000"/>' + b16(2, 3, 12, 3, '#0a246a') + b16(4, 8, 4, 3, '#fff')),
    toggle: T(b16(1, 1, 8, 9, '#fff') + '<rect x="1.5" y="1.5" width="7" height="8" fill="none" stroke="#000"/>' + b16(7, 6, 8, 9, '#d4d0c8') + '<rect x="7.5" y="6.5" width="7" height="8" fill="none" stroke="#000"/>' + b16(8, 7, 6, 2, '#0a246a')),
    newForm: T(b16(1, 3, 12, 11, '#d4d0c8') + '<rect x="1.5" y="3.5" width="11" height="10" fill="none" stroke="#000"/>' + b16(2, 4, 10, 2, '#0a246a') + b16(11, 0, 1, 5, '#c00') + b16(9, 2, 5, 1, '#c00')),
    incHdr: T('<path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#000"/><text x="5" y="13" font-size="9" font-family="Courier New" font-weight="700" fill="#008000">#</text>'),
    options: T('<rect x="1.5" y="2.5" width="13" height="11" fill="#d4d0c8" stroke="#000"/>' + b16(4, 5, 2, 2, '#000') + b16(7, 5, 6, 1, '#000') + b16(4, 9, 2, 2, '#000') + b16(7, 9, 5, 1, '#000')),
    run: T('<path d="M4 2 L13 8 L4 14z" fill="#00a000" stroke="#004000"/>'),
    reset: T(b16(3, 3, 10, 10, '#c00000') + '<rect x="3.5" y="3.5" width="9" height="9" fill="none" stroke="#600000"/>'),
    help: T('<circle cx="8" cy="8" r="6.5" fill="#ffffe0" stroke="#000080"/><text x="5" y="12" font-size="10" font-family="Times New Roman" font-weight="700" fill="#000080">?</text>')
  };
  var ARROW = '<svg class="bi" width="24" height="24" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true"><path d="M7 3 V19 L11 15 L14 21 L16 20 L13 14 L18 14 Z" fill="#fff" stroke="#000"/></svg>';

  function skin(root) {
    if (!root || root.dataset.skin) return; root.dataset.skin = '1';
    root.querySelectorAll('.bx-tools [data-a]').forEach(function (b) { var ic = TOOL[b.getAttribute('data-a')]; if (ic) b.innerHTML = ic; });
    var pal = root.querySelector('.bcb-pal');
    if (pal && !root.querySelector('.pal-arrow')) {
      var a = document.createElement('button'); a.className = 'pal-arrow on'; a.title = 'Указатель (снять выбор компонента)'; a.innerHTML = ARROW;
      a.onclick = function () { var on = root.querySelector('.pi.on'); if (on) on.click(); };
      pal.parentNode.insertBefore(a, pal);
      pal.addEventListener('click', function () { setTimeout(function () { a.classList.toggle('on', !root.querySelector('.pi.on')); }, 0); });
    }
    root.classList.add('bcb6');
    floatLayout(root);
  }

  /* ---------- раскладка «отдельными окнами», как в настоящем C++Builder 6 ---------- */
  var cap = function (t, btns) { return '<div class="w6-cap"><span class="w6-t">' + t + '</span>' + (btns || '<i>_</i><i>□</i><i class="x">×</i>') + '</div>'; };
  function floatLayout(root) {
    root.classList.add('flo');
    var left = root.querySelector('.bx-left'), oi = root.querySelector('.oi'), ed = root.querySelector('.bx-ed'), st = root.querySelector('.bx-status');
    /* Object TreeView над Object Inspector */
    if (left && !root.querySelector('.otv')) {
      var otv = document.createElement('div'); otv.className = 'otv';
      otv.innerHTML = cap('Object TreeView', '<i class="x">×</i>') + '<div class="otv-tools"><i>✚</i><i>✖</i><i>▲</i><i>▼</i></div><div class="otv-tree"></div>';
      left.insertBefore(otv, left.firstChild);
      var oih = oi && oi.querySelector('.oi-h'); if (oih) oih.outerHTML = cap('Object Inspector', '<i class="x">×</i>');
    }
    /* окно редактора: заголовок «Unit1.cpp», ClassExplorer слева, внизу «строка: столбец | Insert» и вкладки */
    if (ed && !ed.querySelector('.w6-cap')) {
      ed.insertAdjacentHTML('afterbegin', cap('Unit1.cpp'));
      var cls = document.createElement('div'); cls.className = 'clsx'; cls.innerHTML = '<div class="clsx-h"><span>⊞</span> <b>Project1 - Classes</b></div><div class="clsx-tree"></div>';
      ed.insertBefore(cls, ed.querySelector('.bx-ftabs'));
      var foot = document.createElement('div'); foot.className = 'ed-foot'; ed.appendChild(foot);
      if (st) foot.appendChild(st);
      var bt = ed.querySelector('.bx-btabs'); if (bt) foot.appendChild(bt);
    }
    var tick = function () {
      if (root.hidden) return;
      var ide = CPP.ide && CPP.ide(); if (!ide || !ide.get) return;
      var prj; try { prj = ide.get(); } catch (e) { return; } if (!prj) return;
      root.classList.toggle('con-prj', prj.kind === 'console');
      var on = root.querySelector('.bx-ftabs span.on'), name = on ? on.textContent.replace(/×$/, '').trim() : 'Unit1';
      if (!/\.(cpp|h|bpr)$/.test(name)) name += '.cpp';
      var t = ed && ed.querySelector('.w6-t'); if (t && t.textContent !== name) t.textContent = name;
      /* вкладки редактора подписаны с расширением, как в Builder: Unit1.cpp, Project1.cpp */
      root.querySelectorAll('.bx-ftabs span').forEach(function (s) { var n = s.firstChild; if (n && n.nodeType === 3 && !/\.(cpp|h|bpr)\s*$/.test(n.nodeValue)) n.nodeValue = n.nodeValue.trim() + '.cpp'; });
      /* ClassExplorer: классы из кода всех модулей */
      var code = prj.units.map(function (u) { return u.cpp || ''; }).concat(prj.forms.map(function (f) { return f.code || ''; })).join('\n');
      var names = []; code.replace(/\bclass\s+(?:PACKAGE\s+)?([A-Za-z_]\w*)/g, function (_, n) { if (names.indexOf(n) < 0) names.push(n); });
      prj.forms.forEach(function (f) { var n = 'T' + (f.fn || 'Form1'); if (names.indexOf(n) < 0) names.unshift(n); });
      var ct = root.querySelector('.clsx-tree'), ch = root.querySelector('.clsx-h b');
      if (ch) ch.textContent = (prj.name || 'Project1') + ' - Classes';
      var ch2 = names.map(function (n) { return '<div>⊞ <span class="ci">C</span>' + n + '</div>'; }).join('');
      if (ct && ct.innerHTML !== ch2) ct.innerHTML = ch2;
      /* Object TreeView: форма и её компоненты */
      var tree = root.querySelector('.otv-tree');
      if (tree) {
        var sel = root.querySelector('.oi-sel'), fname = sel && sel.value ? sel.value.split(':')[0] : '';
        var f = prj.forms.find(function (p) { return p.fn === fname || p.form && p.form.Name === fname; }) || prj.forms.find(function (p) { return p.fn === prj.main; }) || prj.forms[0];
        var h = '';
        if (f) {
          var fn = f.fn || (f.form && f.form.Name) || 'Form1';
          h = '<div class="tv-r"><span class="ti-ic">▣</span>' + fn + '</div>' + (f.comps || []).map(function (c) { return '<div class="tv-c">├ <span class="ti-ic">' + (V.ICON[c.vcl] ? '◇' : '·') + '</span>' + c.Name + '</div>'; }).join('');
        }
        if (tree.innerHTML !== h) tree.innerHTML = h;
      }
    };
    setInterval(tick, 900); tick();
  }
  var open0 = CPP.openIDE;
  CPP.openIDE = function (p) { open0(p); var ide = CPP.ide && CPP.ide(); if (ide && ide.root) skin(ide.root); };
  CPP.skinBuilder = skin;
})(typeof window !== 'undefined' ? window : globalThis);
