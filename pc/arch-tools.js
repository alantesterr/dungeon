/* Калькуляторы и тренажёры тем 10–15 (виджеты .widget с id). Подключается ПОСЛЕ главного скрипта. */
(function(){
'use strict';
const $=(r,s)=>r.querySelector(s);
const H=(v,d)=>(v>>>0).toString(16).toUpperCase().padStart(d||1,'0');
const parseHex=s=>{ s=String(s).trim().replace(/^0x/i,'').replace(/h$/i,''); return /^[0-9a-f]+$/i.test(s)?parseInt(s,16):NaN; };
const css=`.tw2{overflow:auto;margin-top:8px}.tw2 table{border-collapse:collapse;font:13px var(--f-mono,monospace)}.tw2 td,.tw2 th{border:1px solid var(--line);padding:3px 7px;text-align:center}
.tw2 th{background:var(--bg)}.tw2 td.hit{background:var(--ok-bg);color:var(--ok);font-weight:700}.tw2 td.miss{background:var(--bad-bg);color:var(--bad);font-weight:700}.tw2 td.cur{outline:2px solid var(--accent)}
.hbits{display:flex;flex-wrap:wrap;gap:3px;margin:8px 0}.hbits button{width:34px;padding:3px 0;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--ink);font:700 15px var(--f-mono,monospace);cursor:pointer;display:flex;flex-direction:column;align-items:center}
.hbits button small{font:500 9.5px var(--f-body);color:var(--muted)}.hbits button.p{background:var(--accent-soft)}.hbits button.err{background:var(--bad-bg);color:var(--bad);border-color:var(--bad)}
.irq-lane{display:grid;grid-template-columns:90px 1fr;gap:6px;align-items:center;margin:3px 0;font-size:13px}.irq-bar{position:relative;height:20px;background:var(--bg);border-radius:4px}
.irq-bar i{position:absolute;top:2px;bottom:2px;border-radius:3px;background:var(--accent);opacity:.85}.irq-bar i.w{background:var(--fix);opacity:.45}.irq-bar b{position:absolute;top:-1px;font:600 10px var(--f-mono,monospace);color:var(--ink)}
.calc-out .ok{color:var(--ok);font-weight:700}.calc-out .bad{color:var(--bad);font-weight:700}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ---------- Тема 10: симулятор кэша ---------- */
function cacheSim(root){
  root.innerHTML=`<div class="wt">Симулятор кэша: попадания и промахи</div>
    <div class="row-in">
      <label>Строк в кэше<select class="cs-n"><option>4</option><option selected>8</option><option>16</option></select></label>
      <label>Размер строки, байт<select class="cs-b"><option>1</option><option selected>4</option><option>16</option><option>64</option></select></label>
      <label>Организация<select class="cs-a"><option value="1">прямое отображение (1-way)</option><option value="2" selected>2-канальный (2-way)</option><option value="4">4-канальный</option><option value="0">полностью ассоциативный</option></select></label>
      <label>Замещение<select class="cs-r"><option>LRU</option><option>FIFO</option></select></label>
    </div>
    <label style="display:block;margin-top:6px">Последовательность адресов (дес. или 0x…), через пробел<input class="cs-s" style="width:100%" value="0 4 8 12 0 4 64 68 0 128 4 256 0"></label>
    <div class="calc-out" aria-live="polite"></div><div class="tw2"></div>`;
  const q=s=>$(root,s), out=q('.calc-out'), tw=q('.tw2');
  function run(){ const N=+q('.cs-n').value, B=+q('.cs-b').value, aw=+q('.cs-a').value, ways=aw===0?N:Math.min(aw,N), sets=N/ways, R=q('.cs-r').value;
    const addrs=q('.cs-s').value.split(/[\s,;]+/).filter(Boolean).map(x=>/^0x/i.test(x)?parseInt(x,16):parseInt(x,10)).filter(x=>!isNaN(x)&&x>=0);
    const S=Array.from({length:sets},()=>[]); let t=0, hits=0; const rows=[];
    addrs.forEach(a=>{ t++; const blk=Math.floor(a/B), set=blk%sets, tag=Math.floor(blk/sets); const L=S[set]; const f=L.find(x=>x.tag===tag);
      let res, ev=null; if(f){ res='hit'; hits++; f.used=t; } else { res='miss'; if(L.length<ways) L.push({tag,used:t,ins:t}); else { const v=L.reduce((m,x)=>(R==='LRU'?x.used<m.used:x.ins<m.ins)?x:m); ev=v.tag; v.tag=tag; v.used=t; v.ins=t; } }
      rows.push({a,blk,set,tag,res,ev,snap:S.map(l=>l.map(x=>x.tag))}); });
    const rate=addrs.length?hits/addrs.length:0;
    out.innerHTML=`Адрес → блок = ⌊адрес / ${B}⌋ → набор = блок mod ${sets} (${sets} наборов по ${ways} строк${aw===0?', полностью ассоциативный: один набор':''}) → тег = ⌊блок / ${sets}⌋.<br>Попаданий: <b>${hits}</b> из ${addrs.length}, hit rate = <b>${(rate*100).toFixed(1)} %</b>. Если кэш 1 нс, память 100 нс: AMAT = 1 + ${(1-rate).toFixed(3)} × 100 = <b>${(1+(1-rate)*100).toFixed(1)} нс</b>.`;
    tw.innerHTML=`<table><tr><th>#</th><th>адрес</th><th>блок</th><th>набор</th><th>тег</th><th>результат</th><th>вытеснен тег</th><th>кэш после (наборы)</th></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.a}</td><td>${r.blk}</td><td>${r.set}</td><td>${r.tag}</td><td class="${r.res}">${r.res==='hit'?'попадание':'промах'}</td><td>${r.ev==null?'':r.ev}</td><td style="text-align:left">${r.snap.map((l,k)=>k+':['+l.join(',')+']').join(' ')}</td></tr>`).join('')}</table>`; }
  root.addEventListener('input',run); root.addEventListener('change',run); run(); }

/* ---------- Тема 10: адрес → Tag / набор / смещение (лекция № 10, раздел 13) + многоуровневый AMAT ---------- */
function cacheAddr(root){
  root.innerHTML=`<div class="wt">Калькулятор: где в кэше лежит адрес</div>
    <div class="row-in"><label>Объём кэша, КиБ<input type="number" class="ca-c" value="32" min="1"></label><label>Линия, байт<select class="ca-l"><option>16</option><option>32</option><option selected>64</option><option>128</option></select></label>
      <label>Ассоциативность<select class="ca-w"><option value="1">1-way (прямое)</option><option>2</option><option>4</option><option selected>8</option><option>16</option><option value="0">полностью ассоц.</option></select></label>
      <label>Бит адреса<input type="number" class="ca-b" value="16" min="8" max="48"></label><label>Адрес (hex)<input class="ca-a" value="1234"></label></div>
    <div class="calc-out ca-o"></div>
    <div class="wt" style="margin-top:14px">Многоуровневый AMAT (лекция № 10, 14.3)</div>
    <div class="row-in"><label>T₁, нс<input type="number" class="am-t1" value="1" step="0.1"></label><label>M₁<input type="number" class="am-m1" value="0.10" step="0.01"></label><label>T₂, нс<input type="number" class="am-t2" value="4" step="0.1"></label><label>M₂<input type="number" class="am-m2" value="0.20" step="0.01"></label><label>T₃, нс<input type="number" class="am-t3" value="12" step="0.1"></label><label>M₃<input type="number" class="am-m3" value="0.25" step="0.01"></label><label>T_RAM, нс<input type="number" class="am-tr" value="80"></label></div>
    <div class="calc-out am-o"></div>`;
  const q=s=>$(root,s), lg=x=>Math.log2(x);
  function upd(){ const C=(+q('.ca-c').value||1)*1024, L=+q('.ca-l').value, w=+q('.ca-w').value, B=+q('.ca-b').value||16, a=parseHex(q('.ca-a').value);
    const lines=C/L, ways=w===0?lines:w, sets=lines/ways, ob=lg(L), ib=lg(sets), tb=B-ob-ib, o=q('.ca-o');
    if(!Number.isInteger(sets)||!Number.isInteger(ib)){ o.innerHTML='<span class="bad">Число наборов должно быть степенью двойки — проверь параметры.</span>'; }
    else if(isNaN(a)||a>=Math.pow(2,B)){ o.innerHTML=`<span class="bad">Адрес — hex, меньше 2^${B}.</span>`; }
    else { const blk=Math.floor(a/L), off=a%L, set=sets?blk%sets:0, tag=Math.floor(blk/sets), bits=(a>>>0).toString(2).padStart(B,'0');
      o.innerHTML=`Шаг 1. Линий = ${C} / ${L} = <b>${lines}</b>; наборов = ${lines} / ${ways} = <b>${sets}</b>.<br>
        Шаг 2. Offset = log₂${L} = ${ob} бит, Index = log₂${sets} = ${ib} бит, Tag = ${B} − ${ob} − ${ib} = <b>${tb}</b> бит.<br>
        Шаг 3. 0x${H(a)} = ${a}. Блок = ⌊${a} / ${L}⌋ = <b>${blk}</b>, смещение = ${a} mod ${L} = <b>${off}</b>; набор = ${blk} mod ${sets} = <b>${set}</b>; Tag = ⌊${blk} / ${sets}⌋ = <b>${tag}</b>.<br>
        Шаг 4. Биты: <span class="hx-p">${bits.slice(0,tb)||'—'}</span> | ${bits.slice(tb,tb+ib)||'—'} | <span class="hx-o">${bits.slice(tb+ib)}</span> &nbsp;(Tag | Index | Offset)<br>
        В наборе ${set} сравниваются метки ${ways} линий: совпала метка ${tag} у действительной линии — попадание, нет — промах.`; }
    const v=c=>+q(c).value||0, l3=v('.am-t3')+v('.am-m3')*v('.am-tr'), l2=v('.am-t2')+v('.am-m2')*l3, am=v('.am-t1')+v('.am-m1')*l2;
    q('.am-o').innerHTML=`Считаем изнутри: T₃ + M₃·T_RAM = ${v('.am-t3')} + ${v('.am-m3')}×${v('.am-tr')} = ${l3.toFixed(2)} нс → T₂ + M₂·(…) = ${v('.am-t2')} + ${v('.am-m2')}×${l3.toFixed(2)} = ${l2.toFixed(2)} нс → AMAT = ${v('.am-t1')} + ${v('.am-m1')}×${l2.toFixed(2)} = <b>${am.toFixed(2)} нс</b>.`; }
  root.addEventListener('input',upd); root.addEventListener('change',upd); upd(); }

/* ---------- Тема 10: AMAT с переводом единиц (практическая работа AMAT) ---------- */
function amatUnits(root){
  const UN={'с':1e9,'мс':1e6,'мкс':1e3,'нс':1,'пс':1e-3}, opts=sel=>Object.keys(UN).map(u=>`<option${u===sel?' selected':''}>${u}</option>`).join('');
  root.innerHTML=`<div class="wt">Калькулятор AMAT с единицами</div>
    <div class="row-in"><label>Hit Time<input class="au-ht" value="2"></label><label>ед.<select class="au-hu">${opts('мкс')}</select></label>
      <label>Дано<select class="au-k"><option value="hit">Hit Rate, %</option><option value="miss">Miss Rate, %</option></select></label><label>%<input class="au-r" value="90"></label>
      <label>Miss Penalty<input class="au-mp" value="500"></label><label>ед.<select class="au-mu">${opts('нс')}</select></label></div>
    <div class="calc-out au-o"></div>`;
  const q=s=>$(root,s), n=s=>parseFloat(String(q(s).value).replace(/\s/g,'').replace(',','.')), f=x=>(+x.toFixed(6)).toLocaleString('ru-RU',{maximumFractionDigits:6});
  function upd(){ const ht=n('.au-ht'), mp=n('.au-mp'), r=n('.au-r'), hu=q('.au-hu').value, mu=q('.au-mu').value, hit=q('.au-k').value==='hit';
    if([ht,mp,r].some(isNaN)){ q('.au-o').textContent='Впиши числа (можно с запятой).'; return; }
    const H1=ht*UN[hu], M1=mp*UN[mu], m=hit?1-r/100:r/100, A=H1+m*M1;
    q('.au-o').innerHTML=`Шаг 1. Hit Time = ${f(ht)} ${hu}${hu==='нс'?'':` = ${f(H1)} нс`}.<br>Шаг 2. Miss Penalty = ${f(mp)} ${mu}${mu==='нс'?'':` = ${f(M1)} нс`}.<br>
      Шаг 3. Miss Rate = ${hit?`1 − ${f(r)} / 100`:`${f(r)} / 100`} = <b>${f(m)}</b>.<br>Шаг 4. AMAT = ${f(H1)} + ${f(m)} × ${f(M1)} = ${f(H1)} + ${f(m*M1)} = <b>${f(A)} нс</b>.`; }
  root.addEventListener('input',upd); root.addEventListener('change',upd); upd(); }

/* ---------- Тема 11: пропускная способность памяти ---------- */
function ramCalc(root){
  root.innerHTML=`<div class="wt">Калькулятор: пропускная способность оперативной памяти</div>
    <div class="row-in">
      <label>Тип<select class="rc-t"><option value="1">SDR SDRAM (1 передача/такт)</option><option value="2">DDR</option><option value="2">DDR2</option><option value="2" selected>DDR3</option><option value="2">DDR4</option><option value="2">DDR5</option></select></label>
      <label>Частота шины памяти, МГц<input type="number" class="rc-f" value="800" min="1"></label>
      <label>Каналов<select class="rc-c"><option>1</option><option selected>2</option><option>4</option></select></label>
      <label>Ширина канала, бит<input type="number" class="rc-w" value="64" min="8" step="8"></label>
    </div><div class="calc-out" aria-live="polite"></div>`;
  const q=s=>$(root,s), out=q('.calc-out');
  function upd(){ const k=+q('.rc-t').value, f=+q('.rc-f').value||0, ch=+q('.rc-c').value, w=+q('.rc-w').value||64; const tname=q('.rc-t').selectedOptions[0].textContent.split(' ')[0];
    const mt=f*k, perCh=mt*w/8, all=perCh*ch; const gen={DDR:'PC',DDR2:'PC2',DDR3:'PC3',DDR4:'PC4',DDR5:'PC5'}[tname];
    out.innerHTML=`Шаг 1. ${tname}: ${k===2?'данные передаются по <b>обоим фронтам</b> такта':'одна передача за такт'} → ${f} МГц × ${k} = <b>${mt} MT/s</b> (так и пишут в названии: ${tname}-${mt}).<br>
      Шаг 2. Один канал = ${w} бит = ${w/8} байт за передачу → ${mt} × ${w/8} = <b>${perCh} МБ/с</b>${gen?` (маркировка модуля <b>${gen}-${perCh}</b>)`:''}.<br>
      Шаг 3. Каналов ${ch} → теоретически <b>${all} МБ/с ≈ ${(all/1000).toFixed(1)} ГБ/с</b>. ${ch>1?'Многоканальный режим работает, только если модули стоят в слотах разных каналов.':''}`; }
  root.addEventListener('input',upd); upd(); }

/* ---------- Тема 12: сегмент:смещение, селектор, адресная шина ---------- */
function segCalc(root){
  root.innerHTML=`<div class="wt">Калькулятор: адрес в реальном режиме (сегмент:смещение)</div>
    <div class="row-in"><label>Сегмент (hex)<input class="sg-s" value="1234"></label><label>Смещение (hex)<input class="sg-o" value="5678"></label><label>Или физ. адрес → пары (hex)<input class="sg-p" value="179B8"></label></div>
    <div class="calc-out" aria-live="polite"></div>
    <div class="wt" style="margin-top:14px">Селектор защищённого режима</div>
    <div class="row-in"><label>Селектор (hex, 16 бит)<input class="sl-v" value="002B"></label></div><div class="calc-out sl-out"></div>
    <div class="wt" style="margin-top:14px">Адресная шина → объём памяти</div>
    <div class="row-in"><label>Число адресных линий<input type="number" class="ab-n" value="20" min="1" max="64"></label></div><div class="calc-out ab-out"></div>`;
  const q=s=>$(root,s);
  const fmtB=n=>{ const u=['байт','КБ','МБ','ГБ','ТБ','ПБ','ЭБ']; let i=0, v=n; while(v>=1024&&i<u.length-1){ v/=1024; i++; } return (Number.isInteger(v)?v:v.toFixed(2))+' '+u[i]; };
  function upd(){ const s=parseHex(q('.sg-s').value), o=parseHex(q('.sg-o').value), out=$(root,'.calc-out');
    if(isNaN(s)||isNaN(o)||s>0xFFFF||o>0xFFFF) out.innerHTML='<span class="bad">Сегмент и смещение — от 0 до FFFF (hex).</span>';
    else { const pa=s*16+o; out.innerHTML=`Шаг 1. Сегмент × 16 = сдвиг на 4 бита = дописать 0 справа: ${H(s,4)}h → <b>${H(s,4)}0h</b>.<br>Шаг 2. + смещение: ${H(s,4)}0h + ${H(o,4)}h = <b>${H(pa,5)}h</b> (${pa}).${pa>0xFFFFF?' <span class="bad">Больше 1 МБ: на 8086 адрес «завернётся» в '+H(pa&0xFFFFF,5)+'h, на 286+ с открытой линией A20 попадёт в HMA.</span>':''}`; }
    const p=parseHex(q('.sg-p').value); if(!isNaN(p)&&p<=0x10FFEF){ const segs=[]; const sMin=Math.max(0,Math.ceil((p-0xFFFF)/16)), sMax=Math.min(0xFFFF,Math.floor(p/16)); [sMax,sMax-1,sMin].forEach(sg=>{ if(sg>=sMin&&sg<=sMax&&!segs.includes(sg)) segs.push(sg); });
      out.innerHTML+=`<br>Обратно: ${H(p,5)}h можно записать как ${segs.map(sg=>`<b>${H(sg,4)}:${H(p-sg*16,4)}</b>`).join(', ')} … — всего ${sMax-sMin+1} вариантов (сегменты перекрываются через 16 байт).`; }
    const v=parseHex(q('.sl-v').value), so=$(root,'.sl-out'); if(isNaN(v)||v>0xFFFF) so.innerHTML='Селектор — 16 бит (0…FFFF).'; else so.innerHTML=`${H(v,4)}h = ${(v>>>0).toString(2).padStart(16,'0').replace(/(.{4})(?=.)/g,'$1 ')}₂ → <b>индекс = ${v>>3}</b> (биты 15–3), <b>TI = ${(v>>2)&1}</b> (${(v>>2)&1?'LDT':'GDT'}), <b>RPL = ${v&3}</b> (уровень привилегий запроса${(v&3)===0?' — ядро':''}${(v&3)===3?' — пользовательская программа':''}). Дескриптор лежит по адресу база_${(v>>2)&1?'LDT':'GDT'} + ${v>>3} × 8 = база + ${H((v>>3)*8)}h.`;
    const n=+q('.ab-n').value; $(root,'.ab-out').innerHTML=n>0&&n<=64?`2<sup>${n}</sup> = ${n<=53?BigInt(2)**BigInt(n)+'':'…'} адресов → <b>${fmtB(Math.pow(2,n))}</b>. Примеры: 8086 — 20 линий (1 МБ), 80286 — 24 (16 МБ), 80386 — 32 (4 ГБ).`:''; }
  root.addEventListener('input',upd); upd(); }

/* ---------- Тема 13: код Хэмминга ---------- */
function hammingCalc(root){
  root.innerHTML=`<div class="wt">Код Хэмминга: кодирование, ошибка, синдром</div>
    <div class="row-in"><label>Информационные биты<input class="hm-d" value="1011" spellcheck="false"></label><label>или проверить готовый код<input class="hm-c" placeholder="например 111001000" spellcheck="false"></label></div>
    <div class="calc-out hm-out" aria-live="polite"></div><div class="hbits"></div><div class="calc-out hm-syn"></div>`;
  const q=s=>$(root,s); let word=[], err=-1;
  const isP=k=>(k&(k-1))===0;
  function encode(bits){ const m=bits.length; let r=0; while((1<<r)<m+r+1) r++; const n=m+r, w=Array(n+1).fill(0); let j=0; for(let k=1;k<=n;k++) if(!isP(k)) w[k]=bits[j++];
    const lines=[]; for(let p=1;p<=n;p<<=1){ const cov=[]; let s=0; for(let k=1;k<=n;k++) if(k&p){ cov.push(k); if(k!==p) s^=w[k]; } w[p]=s; lines.push(`P${p} проверяет позиции ${cov.join(', ')}: ${cov.filter(k=>k!==p).map(k=>w[k]).join(' ⊕ ')} = <b>${s}</b>`); }
    return {w:w.slice(1),r,m,lines}; }
  function syndrome(w){ const n=w.length; let s=0; const parts=[]; for(let p=1;p<=n;p<<=1){ let x=0; const cov=[]; for(let k=1;k<=n;k++) if(k&p){ x^=w[k-1]; cov.push(k); } if(x) s|=p; parts.push(`S${p} (поз. ${cov.join(',')}) = ${cov.map(k=>w[k-1]).join('⊕')} = <b>${x}</b>`); } return {s,parts}; }
  function draw(){ const box=q('.hbits'); box.innerHTML=word.map((b,i)=>`<button data-k="${i}" class="${isP(i+1)?'p':''}${i===err?' err':''}" title="Щёлкни, чтобы внести ошибку в этот бит">${b}<small>${isP(i+1)?'P':'d'}${i+1}</small></button>`).join('');
    const {s,parts}=syndrome(word); q('.hm-syn').innerHTML=`Синдром: ${parts.join('; ')} → S = ${(s>>>0).toString(2)}₂ = <b>${s}</b>. ${s===0?'<span class="ok">Ошибок нет.</span>':s<=word.length?`<span class="bad">Ошибка в бите ${s}</span> — переверни его: ${word.map((b,i)=>i===s-1?1-b:b).join('')}.`:'<span class="bad">Синдром больше длины слова — ошибок больше одной.</span>'} <i>Щёлкни любой бит выше — внесёшь ошибку и увидишь синдром.</i>`; }
  function upd(src){ const c=q('.hm-c').value.trim(), d=q('.hm-d').value.trim();
    if(src==='c'&&c){ if(!/^[01]+$/.test(c)){ q('.hm-out').innerHTML='Код — только 0 и 1.'; return; } word=c.split('').map(Number); err=-1; q('.hm-out').innerHTML=`Принятое слово ${c} (${c.length} бит). Позиции нумеруются слева с 1, контрольные — на позициях 1, 2, 4, 8…`; draw(); return; }
    if(!/^[01]+$/.test(d)){ q('.hm-out').innerHTML='Информационные биты — только 0 и 1.'; return; }
    const e=encode(d.split('').map(Number)); word=e.w; err=-1;
    q('.hm-out').innerHTML=`Шаг 1. m = ${e.m} бит данных → нужно r контрольных: 2ʳ ≥ m + r + 1 → <b>r = ${e.r}</b>, длина кода ${e.m+e.r} — код (${e.m+e.r},${e.m}).<br>Шаг 2. Контрольные биты — на позициях-степенях двойки (1, 2, 4, 8…), данные — по порядку на остальные.<br>Шаг 3. Чётность: ${e.lines.join('<br>')}<br>Кодовое слово: <b>${word.join('')}</b>`; draw(); }
  root.addEventListener('input',e=>upd(e.target.classList.contains('hm-c')?'c':'d'));
  root.addEventListener('click',e=>{ const b=e.target.closest('[data-k]'); if(!b) return; const k=+b.dataset.k; word[k]^=1; err=err===k?-1:k; draw(); });
  upd('d'); }

/* ---------- Тема 14: шины ---------- */
function busCalc(root){
  root.innerHTML=`<div class="wt">Калькулятор: пропускная способность шины</div>
    <div class="row-in"><label>Ширина, бит<input type="number" class="bc-w" value="32" min="1"></label><label>Частота, МГц<input type="number" class="bc-f" value="100" min="1"></label><label>Передач за такт<select class="bc-k"><option>1</option><option>2</option><option>4</option><option>8</option></select></label></div>
    <div class="calc-out bc-o"></div>
    <div class="wt" style="margin-top:14px">PCI Express</div>
    <div class="row-in"><label>Поколение<select class="pc-g"><option value="1">1.0 — 2,5 ГТ/с, 8b/10b</option><option value="2">2.0 — 5 ГТ/с, 8b/10b</option><option value="3" selected>3.0 — 8 ГТ/с, 128b/130b</option><option value="4">4.0 — 16 ГТ/с</option><option value="5">5.0 — 32 ГТ/с</option></select></label><label>Линий<select class="pc-x"><option>1</option><option>4</option><option>8</option><option selected>16</option></select></label></div>
    <div class="calc-out pc-o"></div>`;
  const q=s=>$(root,s);
  function upd(){ const w=+q('.bc-w').value||0, f=+q('.bc-f').value||0, k=+q('.bc-k').value; const B=w/8*f*k;
    q('.bc-o').innerHTML=`${w} бит = ${w/8} байт за передачу × ${f}·10⁶ тактов/с × ${k} = <b>${B} МБ/с</b> (${(B*8).toFixed(0)} Мбит/с). Это теоретический максимум: на практике меньше из-за служебных тактов, арбитража и ожиданий.`;
    const g=+q('.pc-g').value, x=+q('.pc-x').value; const gt={1:2.5,2:5,3:8,4:16,5:32}[g], enc=g<=2?8/10:128/130; const lane=gt*enc/8;
    q('.pc-o').innerHTML=`Одна линия: ${gt} ГТ/с × ${g<=2?'8/10':'128/130'} (кодирование) / 8 = <b>${lane.toFixed(3)} ГБ/с</b> в каждую сторону.<br>x${x}: ${lane.toFixed(3)} × ${x} = <b>${(lane*x).toFixed(2)} ГБ/с</b> в одну сторону, ${(lane*x*2).toFixed(2)} ГБ/с в обе (полный дуплекс).`; }
  root.addEventListener('input',upd); upd(); }

/* ---------- Тема 15: приоритет прерываний (8259) ---------- */
function irqSim(root){
  root.innerHTML=`<div class="wt">Тренажёр: контроллер прерываний 8259 — приоритет и вложенность</div>
    <p style="margin:0 0 6px;font-size:14px">Запросы: <b>IRQ:время_прихода:длительность_обработки</b>, через пробел. Фиксированный приоритет — меньший номер IRQ важнее. Обработчик может быть прерван только более приоритетным запросом.</p>
    <div class="row-in"><label style="flex:1">Запросы<input class="iq-s" style="width:100%" value="1:0:4 0:0:2 6:0:3 3:2:3 0:5:2"></label><label>Режим<select class="iq-m"><option value="nest">вложенные (STI в обработчике)</option><option value="flat">без вложенности (CLI)</option></select></label></div>
    <div class="calc-out iq-o"></div><div class="iq-g"></div>
    <div class="wt" style="margin-top:14px">Таблица векторов: где лежит вектор</div>
    <div class="row-in"><label>Номер прерывания (hex)<input class="iv-n" value="21"></label></div><div class="calc-out iv-o"></div>`;
  const q=s=>$(root,s), NAMES={0:'таймер',1:'клавиатура',2:'каскад',3:'COM2',4:'COM1',5:'LPT2/звук',6:'дисковод',7:'LPT1',8:'часы RTC',12:'мышь PS/2',13:'сопроцессор',14:'IDE0',15:'IDE1'};
  function upd(){ const reqs=q('.iq-s').value.split(/\s+/).filter(Boolean).map((s,i)=>{ const [a,b,c]=s.split(':').map(Number); return {irq:a,t:b||0,d:Math.max(1,c||1),id:i,left:Math.max(1,c||1),runs:[],start:null,end:null}; }).filter(r=>!isNaN(r.irq)&&r.irq>=0&&r.irq<=15);
    const nest=q('.iq-m').value==='nest'; let t=0; const stack=[]; const log=[]; let guard=0;
    const pending=()=>reqs.filter(r=>r.t<=t&&r.left>0&&!stack.includes(r));
    while(reqs.some(r=>r.left>0)&&guard++<500){ const cur=stack[stack.length-1]; const pd=pending().sort((a,b)=>a.irq-b.irq||a.t-b.t);
      if(pd.length&&(!cur||(nest&&pd[0].irq<cur.irq))){ const r=pd[0]; if(cur) log.push(`t=${t}: IRQ${r.irq} (${NAMES[r.irq]||'устройство'}) важнее IRQ${cur.irq} → прерывает его обработчик`); else log.push(`t=${t}: обслуживается IRQ${r.irq} (${NAMES[r.irq]||'устройство'})${pd.length>1?' — из ожидающих '+pd.map(x=>'IRQ'+x.irq).join(', ')+' у него высший приоритет':''}`); stack.push(r); if(r.start==null) r.start=t; continue; }
      if(!cur){ t++; continue; }
      cur.runs.push(t); cur.left--; t++; if(cur.left===0){ cur.end=t; stack.pop(); log.push(`t=${t}: IRQ${cur.irq} закончен (IRET + EOI)`); } }
    const T=Math.max(t,1); const lanes=[...new Set(reqs.map(r=>r.irq))].sort((a,b)=>a-b);
    q('.iq-g').innerHTML=lanes.map(irq=>{ const rs=reqs.filter(r=>r.irq===irq); return `<div class="irq-lane"><span>IRQ${irq} <small style="color:var(--muted)">${NAMES[irq]||''}</small></span><div class="irq-bar">${rs.map(r=>{ const w=(r.start==null?T:r.start)-r.t; return (w>0?`<i class="w" style="left:${r.t/T*100}%;width:${w/T*100}%"></i>`:'')+r.runs.map(x=>`<i style="left:${x/T*100}%;width:${100/T}%"></i>`).join('')+`<b style="left:${r.t/T*100}%">↓${r.t}</b>`; }).join('')}</div></div>`; }).join('')+`<div style="font-size:12px;color:var(--muted)">Синие — обработчик выполняется, жёлтые — запрос ждёт. Шкала 0…${T}.</div>`;
    q('.iq-o').innerHTML=`<b>Порядок начала обслуживания:</b> ${reqs.slice().filter(r=>r.start!=null).sort((a,b)=>a.start-b.start||a.irq-b.irq).map(r=>'IRQ'+r.irq).join(' → ')}<br><b>Порядок завершения:</b> ${reqs.slice().filter(r=>r.end!=null).sort((a,b)=>a.end-b.end).map(r=>'IRQ'+r.irq).join(' → ')}<details style="margin-top:4px"><summary>Пошагово</summary>${log.join('<br>')}</details>`;
    const n=parseHex(q('.iv-n').value); q('.iv-o').innerHTML=isNaN(n)||n>255?'Номер — 00…FF (hex).':`Вектор ${H(n,2)}h лежит по адресу ${H(n,2)}h × 4 = <b>0000:${H(n*4,4)}h</b> (байты ${H(n*4,4)}h…${H(n*4+3,4)}h): сначала 2 байта <b>смещения</b> (IP), потом 2 байта <b>сегмента</b> (CS) обработчика. Вся таблица: 256 × 4 = 1024 байта = первый килобайт памяти.${n>=8&&n<=15?` В IBM PC это IRQ${n-8} (${NAMES[n-8]||''}).`:''}`; }
  root.addEventListener('input',upd); root.addEventListener('change',upd); upd(); }

const TOOLS={cacheAddr,amatUnits,cacheSim,ramCalc,segCalc,hammingCalc,busCalc,irqSim};
Object.entries(TOOLS).forEach(([id,f])=>{ document.querySelectorAll(`.widget[id^="${id}"]`).forEach(el=>{ try{ f(el); }catch(e){ console.error(el.id,e); } }); });
})();
