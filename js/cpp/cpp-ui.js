/* Окно задания по C++: редактор кода, ввод, «Должно быть» / «Твой вывод», проверка на тестах, эталонный код.
   Разметка задания:
   <div class="cppw" data-id="c1-l1-z1" data-cmp="exact|nums|none" data-title="…">
     <script type="text/x-cpp" data-role="ref">эталон</script>
     <script type="text/x-cpp" data-role="start">заготовка (необязательно)</script>
     <script type="text/plain" data-role="in" data-name="Пример из лабы">ввод</script>  (наборов может быть несколько)
   </div> */
(function(G){
'use strict';
const CPP=G.CPP;
const KW=new Set(('int char short long unsigned signed float double bool void const static if else while do for switch case default break continue return goto '+
  'struct class public private protected virtual new delete this true false sizeof enum typedef using namespace inline operator friend template typename '+
  'extern register auto volatile __fastcall __property __published NULL').split(' '));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- подсветка синтаксиса в стиле редактора C++Builder ---------- */
function highlight(src){
  let out='', i=0; const n=src.length;
  while(i<n){
    const c=src[i];
    if(c==='/'&&src[i+1]==='/'){ let j=src.indexOf('\n',i); if(j<0) j=n; out+=`<i class="hc">${esc(src.slice(i,j))}</i>`; i=j; continue; }
    if(c==='/'&&src[i+1]==='*'){ let j=src.indexOf('*/',i+2); j=j<0?n:j+2; out+=`<i class="hc">${esc(src.slice(i,j))}</i>`; i=j; continue; }
    if(c==='#'&&(i===0||/\n\s*$/.test(src.slice(Math.max(0,i-40),i)))){ let j=src.indexOf('\n',i); if(j<0) j=n; out+=`<b class="hp">${esc(src.slice(i,j))}</b>`; i=j; continue; }
    if(c==='"'||c==="'"){ let j=i+1; while(j<n&&src[j]!==c&&src[j]!=='\n'){ if(src[j]==='\\') j++; j++; } j=Math.min(j+1,n); out+=`<b class="hs">${esc(src.slice(i,j))}</b>`; i=j; continue; }
    if(/[A-Za-z_]/.test(c)){ let j=i+1; while(j<n&&/\w/.test(src[j])) j++; const w=src.slice(i,j); out+=KW.has(w)?`<b class="hk">${w}</b>`:esc(w); i=j; continue; }
    if(/[0-9]/.test(c)){ let j=i+1; while(j<n&&/[\w.]/.test(src[j])) j++; out+=`<b class="hn">${esc(src.slice(i,j))}</b>`; i=j; continue; }
    out+=esc(c); i++;
  }
  return out;
}
CPP.highlight=highlight;

/* ---------- экран консоли (цвета Windows) ---------- */
function screenHTML(screen,marks){
  // screen: [[{c,a}]], marks: массив классов строк
  return screen.map((row,y)=>{
    let h='', cur=-1, buf='';
    const flush=()=>{ if(buf){ h+= cur===7?esc(buf):`<span class="ca${cur&15}${(cur>>4)&7?' cb'+((cur>>4)&7):''}">${esc(buf)}</span>`; buf=''; } };
    for(const cell of row){ const a=cell.a==null?7:cell.a; if(a!==cur){ flush(); cur=a; } buf+=cell.c; }
    flush();
    const m=marks&&marks[y]?' '+marks[y]:'';
    return `<div class="cl${m}">${h||'&#8203;'}</div>`;
  }).join('');
}
function trimScreen(screen){ const s=screen.map(r=>{ const rr=r.slice(); while(rr.length&&rr[rr.length-1].c===' ') rr.pop(); return rr; }); while(s.length&&!s[s.length-1].length) s.pop(); return s; }

/* ---------- сравнение ---------- */
const nums=s=>(s.join('\n').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)||[]);
function compare(exp,got,mode){
  if(mode==='none') return {ok:true,marks:[],msg:''};
  if(mode==='nums'||mode==='approx'){
    const a=nums(exp), b=nums(got);
    const eq=(x,y)=>{ if(mode==='nums') return x===y; const p=parseFloat(x), q=parseFloat(y); return Math.abs(p-q)<=1e-9+5e-5*Math.max(Math.abs(p),Math.abs(q)); };
    const ok=a.length===b.length&&a.every((x,i)=>eq(x,b[i]));
    let msg;
    if(ok) msg= mode==='approx'?'Ответ совпадает с эталоном (числа сравниваются с точностью до 5 знаков, текст подсказок может быть своим)':'Все числа совпадают с эталоном (текст подсказок может быть своим)';
    else if(a.length!==b.length) msg=`Чисел в выводе ${b.length}, а в эталоне ${a.length}: ${a.join(', ')||'—'}`;
    else { const k=a.findIndex((x,i)=>!eq(x,b[i])); msg=`Число №${k+1} отличается: в эталоне ${a[k]}, у тебя ${b[k]}`; }
    return {ok,marks:[],msg}; }
  const n=Math.max(exp.length,got.length); const marks=[]; let first=-1;
  for(let i=0;i<n;i++){ const ok=exp[i]===got[i]; marks[i]=ok?'ok':'bad'; if(!ok&&first<0) first=i; }
  if(first<0) return {ok:true,marks,msg:'Вывод совпадает с эталоном'};
  const e=exp[first], g=got[first];
  let why='';
  if(e!=null&&g!=null&&e.replace(/\s+/g,'')===g.replace(/\s+/g,'')) why=' (разница только в пробелах)';
  else if(e!=null&&g!=null&&e.toLowerCase()===g.toLowerCase()) why=' (разница в больших/маленьких буквах)';
  const msg= g==null ? `Не хватает строки ${first+1}: «${e}»` : e==null ? `Лишняя строка ${first+1}: «${g}»` : `Строка ${first+1} отличается${why}: ожидалось «${e}», у тебя «${g}»`;
  return {ok:false,marks,msg};
}

/* ---------- редактор ---------- */
function makeEditor(host,code,onRun){
  host.innerHTML=`<div class="ced"><div class="cg" aria-hidden="true"></div><div class="cw"><pre class="chl" aria-hidden="true"></pre><textarea class="cta" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Код программы на C++"></textarea></div></div>`;
  const ta=host.querySelector('.cta'), hl=host.querySelector('.chl'), gut=host.querySelector('.cg');
  let errLine=0;
  const sync=()=>{ const v=ta.value; hl.innerHTML=highlight(v)+'\n'; const lines=v.split('\n').length; let g=''; for(let k=1;k<=lines;k++) g+=`<div${k===errLine?' class="err"':''}>${k}</div>`; gut.innerHTML=g; };
  const scroll=()=>{ hl.scrollTop=ta.scrollTop; hl.scrollLeft=ta.scrollLeft; gut.scrollTop=ta.scrollTop; };
  ta.value=code; sync();
  ta.addEventListener('input',()=>{ errLine=0; sync(); host.dispatchEvent(new Event('codechange')); });
  ta.addEventListener('scroll',scroll);
  ta.addEventListener('keydown',e=>{
    if(e.key==='Tab'&&!e.shiftKey){ e.preventDefault(); document.execCommand('insertText',false,'  '); return; }
    if(e.key==='Enter'&&!e.ctrlKey){ e.preventDefault(); const s=ta.value.slice(0,ta.selectionStart); const ind=(s.split('\n').pop().match(/^\s*/)||[''])[0]; const extra=/\{\s*$/.test(s)?'  ':''; document.execCommand('insertText',false,'\n'+ind+extra); return; }
    if(e.key==='}'){ const s=ta.value.slice(0,ta.selectionStart); const last=s.split('\n').pop(); if(/^\s+$/.test(last)&&last.length>=2){ e.preventDefault(); ta.setSelectionRange(ta.selectionStart-2,ta.selectionStart); document.execCommand('insertText',false,'}'); } return; }
    if(e.key==='F9'||(e.key==='Enter'&&e.ctrlKey)){ e.preventDefault(); onRun(); }
  });
  return {
    get value(){ return ta.value; }, set value(v){ ta.value=v; errLine=0; sync(); },
    markLine(k){ errLine=k; sync(); if(k){ const lh=parseFloat(getComputedStyle(ta).lineHeight)||20; ta.scrollTop=Math.max(0,(k-3)*lh); scroll(); } },
    focus(){ ta.focus(); }
  };
}

const store={ get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} } };

/* ---------- окно задания ---------- */
function initTask(el){
  if(el.dataset.ready) return; el.dataset.ready='1';
  const id=el.dataset.id, mode=el.dataset.cmp||'exact';
  const get=r=>{ const s=el.querySelector(`script[data-role="${r}"]`); return s?s.textContent.replace(/^\n/,'').replace(/\s+$/,'')+'\n':null; };
  const ref=get('ref');
  const start=get('start')||'#include <iostream.h>\n#include <conio.h>\n\nint main()\n{\n  \n  getch();\n  return 0;\n}\n';
  const ins=[...el.querySelectorAll('script[data-role="in"]')].map((s,k)=>({name:s.dataset.name||('Тест '+(k+1)),text:s.textContent.replace(/^\n/,'')}));
  if(!ins.length) ins.push({name:'Без ввода',text:''});
  const key='cppw:'+id;
  el.innerHTML=`
    <div class="cw-head"><span class="cw-t">${esc(el.dataset.title||'Напиши программу')}</span>
      <span class="cw-btns"><button class="btn pri" data-a="run" title="F9 или Ctrl+Enter">▶ Запустить <kbd>F9</kbd></button>
      ${mode==='none'?'':'<button class="btn" data-a="check">✓ Проверить на всех тестах</button>'}
      <button class="btn" data-a="reset" title="Вернуть заготовку">↺ Заново</button></span></div>
    <div class="cw-ed"></div>
    <div class="cw-err" hidden></div>
    <div class="cw-in"><label>Ввод с клавиатуры <small>(то, что набираешь, пока работает программа)</small>
      ${ins.length>1?`<span class="cw-tests">${ins.map((t,k)=>`<button class="chip${k?'':' on'}" data-t="${k}">${esc(t.name)}</button>`).join('')}</span>`:''}</label>
      <textarea class="cw-input" rows="${Math.min(6,Math.max(2,ins[0].text.split('\n').length))}" spellcheck="false" aria-label="Ввод для программы"></textarea></div>
    <div class="cw-outs">
      <div class="cw-o"><div class="cw-ot">Должно быть <small>(эталон)</small></div><div class="con exp"></div></div>
      <div class="cw-o"><div class="cw-ot">Твой вывод</div><div class="con got"><div class="cl hint">Нажми «▶ Запустить» — здесь появится то, что выведет твоя программа.</div></div></div>
    </div>
    <div class="cw-res" hidden></div>
    <div class="cw-warn" hidden></div>
    <div class="cw-sum" hidden></div>`;
  const ed=makeEditor(el.querySelector('.cw-ed'),store.get(key)||start,()=>run());
  const inp=el.querySelector('.cw-input'), expBox=el.querySelector('.con.exp'), gotBox=el.querySelector('.con.got');
  const errBox=el.querySelector('.cw-err'), resBox=el.querySelector('.cw-res'), warnBox=el.querySelector('.cw-warn'), sumBox=el.querySelector('.cw-sum');
  let cur=0; inp.value=ins[0].text;
  let saveT=null;
  el.querySelector('.cw-ed').addEventListener('codechange',()=>{ clearTimeout(saveT); saveT=setTimeout(()=>store.set(key,ed.value===start?null:ed.value),400); });
  const expOf=(input)=>{ if(!ref) return null; const r=CPP.run(ref,{input}); return r; };
  const showExp=()=>{ const r=expOf(inp.value); if(!r){ expBox.innerHTML='<div class="cl hint">Эталона нет — проверь вывод сам.</div>'; return null; }
    if(r.error){ expBox.innerHTML=`<div class="cl hint">${r.error.kind==='runtime'?'Эталон не досчитал на этих данных: ':''}${esc(r.error.message)}</div>`+screenHTML(trimScreen(r.screen)); return r; }
    expBox.innerHTML=screenHTML(trimScreen(r.screen))||'<div class="cl hint">(программа ничего не выводит)</div>'; return r; };
  showExp();
  inp.addEventListener('input',()=>{ clearTimeout(inp._t); inp._t=setTimeout(showExp,250); });
  el.querySelectorAll('.cw-tests .chip').forEach(b=>b.addEventListener('click',()=>{ cur=+b.dataset.t; el.querySelectorAll('.cw-tests .chip').forEach(x=>x.classList.toggle('on',x===b)); inp.value=ins[cur].text; showExp(); }));

  function showError(e){
    const code=e.code&&!/x/.test(e.code)?` <code>${e.code}</code>`:'';
    const where=e.line?`строка ${e.line}`:'';
    const kind=e.kind==='compile'?'Ошибка компиляции':'Ошибка во время работы';
    errBox.innerHTML=`<b>${kind}${where?' — '+where:''}</b>${code}<div>${esc(e.message)}</div>`;
    errBox.className='cw-err '+(e.kind==='compile'?'ce':'re'); errBox.hidden=false;
    if(e.line) ed.markLine(e.line);
  }
  function run(){
    errBox.hidden=true; ed.markLine(0); sumBox.hidden=true;
    const t0=performance.now();
    const r=CPP.run(ed.value,{input:inp.value});
    const er=showExp();
    if(r.error) showError(r.error);
    if(r.compileError){ gotBox.innerHTML='<div class="cl hint">Программа не скомпилировалась — исправь ошибку выше.</div>'; resBox.hidden=true; }
    else {
      const scr=trimScreen(r.screen);
      let cmp=null;
      if(er&&!er.error&&!r.error&&mode!=='none'){ cmp=compare(er.lines,r.lines,mode); }
      gotBox.innerHTML=screenHTML(scr,cmp&&mode==='exact'?cmp.marks:null)||'<div class="cl hint">(программа ничего не вывела)</div>';
      if(cmp){ resBox.hidden=false; resBox.className='cw-res '+(cmp.ok?'ok':'bad'); resBox.textContent=(cmp.ok?'✓ ':'✗ ')+cmp.msg; }
      else resBox.hidden=true;
    }
    const w=(r.warnings||[]).slice(0,5);
    warnBox.hidden=!w.length; warnBox.innerHTML=w.map(x=>`<div>⚠ ${x.line?'Строка '+x.line+': ':''}${esc(x.msg)}</div>`).join('');
    el.dataset.ran='1';
  }
  function checkAll(){
    errBox.hidden=true; ed.markLine(0);
    const rows=[]; let okAll=true, firstBad=-1;
    ins.forEach((t,k)=>{
      const er=expOf(t.text), r=CPP.run(ed.value,{input:t.text});
      if(r.compileError){ showError(r.error); okAll=false; rows.push(`<li class="bad">${esc(t.name)}: не скомпилировалось</li>`); return; }
      if(r.error){ okAll=false; if(firstBad<0) firstBad=k; rows.push(`<li class="bad">${esc(t.name)}: ошибка при работе — ${esc(r.error.message)}</li>`); return; }
      const c=compare(er.lines,r.lines,mode); if(!c.ok){ okAll=false; if(firstBad<0) firstBad=k; }
      rows.push(`<li class="${c.ok?'ok':'bad'}">${c.ok?'✓':'✗'} ${esc(t.name)}${c.ok?'':' — '+esc(c.msg)}</li>`);
    });
    sumBox.hidden=false; sumBox.className='cw-sum '+(okAll?'ok':'bad');
    sumBox.innerHTML=`<b>${okAll?'Все тесты пройдены — задание решено ✓':'Есть ошибки — смотри тест, отмеченный ✗'}</b><ul>${rows.join('')}</ul>`;
    if(okAll) store.set(key+':done','1');
    el.classList.toggle('solved',okAll);
    if(firstBad>=0){ const b=el.querySelector(`.cw-tests .chip[data-t="${firstBad}"]`); if(b) b.click(); run(); }
  }
  if(store.get(key+':done')) el.classList.add('solved');
  el.querySelector('.cw-btns').addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(!b) return;
    if(b.dataset.a==='run') run();
    if(b.dataset.a==='check') checkAll();
    if(b.dataset.a==='reset'){ if(!b.dataset.sure){ b.dataset.sure='1'; b.textContent='Точно? Твой код сотрётся'; setTimeout(()=>{ delete b.dataset.sure; b.textContent='↺ Заново'; },3000); return; }
      delete b.dataset.sure; b.textContent='↺ Заново'; ed.value=start; store.set(key,null); errBox.hidden=true; resBox.hidden=true; warnBox.hidden=true; sumBox.hidden=true; gotBox.innerHTML='<div class="cl hint">Нажми «▶ Запустить».</div>'; }
  });
  // эталонный код — в свёрнутом блоке рядом
  const refBox=document.querySelector(`[data-ref-for="${CSS.escape(id)}"]`);
  if(refBox&&ref) refBox.innerHTML=`<pre class="cpp-code">${highlight(ref.replace(/\s+$/,''))}</pre><button class="btn" data-copy>Вставить эталон в редактор</button>`;
  if(refBox) refBox.addEventListener('click',e=>{ if(e.target.closest('[data-copy]')){ ed.value=ref; store.set(key,ref); el.scrollIntoView({behavior:'smooth',block:'start'}); } });
}

/* статичный код на странице: <pre class="cpp-code"> — подсветка */
function highlightStatic(root){ (root||document).querySelectorAll('pre.cpp-code:not([data-hl])').forEach(p=>{ p.dataset.hl='1'; p.innerHTML=highlight(p.textContent); }); }

CPP.initTasks=function(root){ (root||document).querySelectorAll('.cppw').forEach(initTask); highlightStatic(root); };
CPP.compare=compare; CPP.screenHTML=screenHTML; CPP.makeEditor=makeEditor;
})(typeof window!=='undefined'?window:globalThis);
