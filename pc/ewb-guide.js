/* Сборка «по шагам» поверх EWB-студии: список шагов с живыми галочками, таблица истинности, которая заполняется,
   пока щёлкаешь переключатели, и окно EWB прямо в слайде лабы. Подключается ПОСЛЕ ewb-studio.js. */
(function(){
'use strict';
const A=window.ARCH; if(!A||!A.Studio) return;
const P=A.Studio.prototype, geom=A.geom;
const KIND={and:'AND',or:'OR',not:'NOT',nand:'NAND',nor:'NOR',xor:'XOR',xnor:'XNOR',buf:'Buffer'};
const BIN={gate:'Logic Gates',jk:'Digital',d:'Digital',t:'Digital',rs:'Digital',ha:'Digital',fa:'Digital',clk:'Sources',vcc:'Sources',gnd:'Sources',conn:'Basic',hex:'Indicators',seg7:'Indicators',lamp:'Indicators',sw:'Basic'};
const RU={jk:'JK Flip-Flop',d:'D Flip-Flop',t:'T Flip-Flop',rs:'RS Flip-Flop',ha:'Half-Adder',fa:'Full-Adder',vcc:'+5V (Vcc)',gnd:'Ground',hex:'Decoded 7-Segment Display'};
const SKIP=['sw','lamp','conn','txt','clk','la','lc','wg'];
const kindOf=c=>c.type==='gate'?'gate:'+c.p.k+':'+((c.p.k==='not'||c.p.k==='buf')?1:(c.p.n||2)):c.type+(c.p&&c.p.async?':a':'');
const nameOf=k=>{ const [t,g,n]=k.split(':'); if(t==='gate') return KIND[g]+(+n>2?` на ${n} входа`:''); return (RU[t]||t)+(g==='a'?' с входами PR/CLR':''); };
const css=`.gd{margin-top:10px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:12px}
.gd ol{margin:0;padding-left:0;list-style:none;display:grid;gap:5px}
.gd li{display:grid;grid-template-columns:24px 1fr;gap:6px;align-items:start;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);font-size:14px;line-height:1.4}
.gd li .m{width:22px;height:22px;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font:700 12px var(--f-mono);color:var(--muted)}
.gd li.ok{opacity:.75}.gd li.ok .m{background:var(--ok);border-color:var(--ok);color:#fff}
.gd li.now{border-color:var(--accent);background:var(--accent-soft);opacity:1}.gd li.now .m{border-color:var(--accent);color:var(--accent)}
.gd li small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.gd .wl{margin:4px 0 0;padding-left:16px;font-size:12.5px}.gd .wl li{display:list-item;border:0;background:none;padding:0;list-style:disc;opacity:1}
.gd .tt2{font:12.5px var(--f-mono);border-collapse:collapse;width:100%}.gd .tt2 td,.gd .tt2 th{border:1px solid var(--line);padding:2px 5px;text-align:center}
.gd .tt2 tr.ok td{background:var(--ok-bg)}.gd .tt2 tr.bad td{background:var(--bad-bg)}.gd .tt2 tr.cur td{outline:2px solid var(--accent);outline-offset:-2px}
.gd .tth{font:700 12px var(--f-body);letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin:0 0 4px}
.gd .prog{height:6px;background:var(--line);border-radius:3px;overflow:hidden;margin:4px 0 8px}.gd .prog i{display:block;height:100%;background:var(--ok);transition:width .3s}
.gd .yay{margin-top:6px;padding:8px 10px;border-radius:8px;background:var(--ok-bg);color:var(--ok);font-weight:600}
.ewb-inline{margin:10px 0 16px}.ewb-inline .ei-bar{display:flex;justify-content:flex-end;margin-bottom:4px}
@media (max-width:760px){.gd{grid-template-columns:minmax(0,1fr)}}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* разбор эталонного решения: какие детали и какие соединения */
function plan(t){ if(!t.solution) return null; let sol; try{ sol=t.solution(); }catch(_){ return null; }
  const cnt={}, idx={}, nm={}; sol.comps.forEach(c=>{ if(SKIP.includes(c.type)) return; const k=kindOf(c); cnt[k]=(cnt[k]||0)+1; });
  sol.comps.forEach(c=>{ if(c.type==='sw'||c.type==='lamp'||c.type==='clk'){ nm[c.id]=c.p.label||c.id; return; } if(c.type==='conn'||c.type==='txt') return;
    const base=c.type==='gate'?KIND[c.p.k]:(RU[c.type]||c.type).split(' ')[0]; idx[base]=(idx[base]||0)+1; nm[c.id]=base+idx[base]; });
  // цепи эталона
  const par={}; const f=k=>{ if(par[k]===undefined) par[k]=k; while(par[k]!==k){ par[k]=par[par[k]]; k=par[k]; } return k; };
  const norm=p=>{ const [c,q]=p.split('.'); const k=sol.comps.find(x=>x.id===c); return k&&k.type==='conn'?c+'.n':p; };
  sol.wires.forEach(w=>{ const a=f(norm(w.f)), b=f(norm(w.t)); if(a!==b) par[a]=b; });
  const nets={}; Object.keys(par).forEach(k=>{ const r=f(k); (nets[r]=nets[r]||[]).push(k); });
  const pinRu=(c,p)=>{ if(c.type==='lamp'||c.type==='hex') return ''; if(p==='o') return ' (выход)'; const m=p.match(/^i(\d)$/); if(m) return ` (вход ${+m[1]+1})`; return ' ('+(p==='Qn'?"Q'":p)+')'; };
  const lines=[]; Object.values(nets).forEach(list=>{ const pins=list.filter(p=>!/\.n$/.test(p)||!sol.comps.find(x=>x.id===p.split('.')[0]&&x.type==='conn'));
    const ends=pins.map(p=>{ const [c,q]=p.split('.'); const k=sol.comps.find(x=>x.id===c); if(!k) return null; const g=geom(k); const dir=g.pins[q]?g.pins[q][2]:'in'; return {dir,txt:(nm[c]||c)+pinRu(k,q)}; }).filter(Boolean);
    const src=ends.find(e=>e.dir==='out'), dst=ends.filter(e=>e!==src); if(src&&dst.length) lines.push(`<b>${src.txt}</b> → ${dst.map(d=>d.txt).join(', ')}`); });
  return {cnt,lines}; }

P.guideInit=function(){ const t=this.task; if(!t||!this.taskBox) return; this.gp=this.gp||plan(t); this.tt={}; this.passed=false;
  let g=this.taskBox.querySelector('.gd'); if(!g){ g=document.createElement('div'); g.className='gd'; this.taskBox.appendChild(g); }
  this.gbox=g; this.guide(); };
P.guideSteps=function(){ const t=this.task, gp=this.gp||{cnt:{},lines:[]}; const have={}; this.comps.forEach(c=>{ if(!SKIP.includes(c.type)){ const k=kindOf(c); have[k]=(have[k]||0)+1; } });
  const S=[]; const passed=this.passed;
  Object.entries(gp.cnt).forEach(([k,n])=>{ const [ty]=k.split(':'); S.push({t:`Поставь ${n>1?n+' × ':''}<b>${nameOf(k)}</b>`,h:`Полка <b>${BIN[ty]||'Digital'}</b> во втором ряду кнопок → перетащи на поле.${ty==='gate'&&+k.split(':')[2]>2?' Потом двойной щелчок → Number of Inputs = '+k.split(':')[2]+'.':''}`,ok:passed||(have[k]||0)>=n}); });
  if(t.clock&&!this.comps.some(c=>c.type==='clk')) S.push({t:'Поставь <b>Clock</b>',h:'Полка Sources.',ok:false});
  const gates=this.comps.filter(c=>!SKIP.includes(c.type)&&c.type!=='vcc'&&c.type!=='gnd'), outs=this.comps.filter(c=>c.type==='lamp');
  const floating=gates.reduce((s,c)=>s+Object.entries(geom(c).pins).filter(([p,q])=>q[2]==='in'&&p!=='PR'&&p!=='CLR'&&!this.connected(c,p)).length,0);
  const lampsOff=outs.filter(c=>!this.connected(c,'i')).length;
  S.push({t:'Соедини провода',h:`Тяни от вывода к выводу. ${floating?`Свободных входов у элементов: <b>${floating}</b>. `:''}${lampsOff?`Не подключено лампочек: <b>${lampsOff}</b>.`:''}`,wl:gp.lines,ok:passed||(gates.length>0&&!floating&&!lampsOff)});
  S.push({t:'Включи питание <b>O/I</b>',h:'Переключатель справа вверху окна (или Ctrl+G).',ok:passed||this.power});
  if(t.kind==='comb'){ const n=(t.inputs||[]).length, tot=t.valid?Object.keys(this.ttAll()).length:(1<<n), seen=Object.keys(this.tt).length;
    S.push({t:`Испытай: перебери все комбинации входов (${seen}/${tot})`,h:`Щёлкай переключатели или их клавиши (${(t.inputs||[]).join(', ')}). Таблица справа заполняется сама.`,ok:passed||seen>=tot}); }
  else S.push({t:'Испытай схему',h:t.clock?'Нажимай клавиши/такт и смотри на лампочки.':'Щёлкай переключатели по таблице режимов и смотри на Q.',ok:passed||this.tried});
  S.push({t:'Нажми <b>✔ Проверить схему</b>',h:'Программа сама прогонит все комбинации/такты.',ok:passed});
  return S; };
P.ttAll=function(){ const t=this.task, ins=t.inputs||[], n=ins.length, all={}; for(let r=0;r<(1<<n);r++){ const v={}; ins.forEach((nm,i)=>v[nm]=(r>>(n-1-i))&1); if(t.valid&&!t.valid(v)) continue; all[r]=v; } return all; };
P.guide=function(){ if(!this.gbox||!this.task) return; const t=this.task;
  // запомнить строку таблицы, если схема включена
  if(this.power&&t.kind==='comb'){ const {ins,outs}=this.findIO(); if(ins.every(x=>x[1])&&outs.every(x=>x[1])){ const v={}; let r=0; ins.forEach(([nm,c])=>{ v[nm]=c.p.on?1:0; r=r*2+v[nm]; }); if(!t.valid||t.valid(v)){ const got={}; outs.forEach(([nm,c])=>got[nm]=this.get(c,'i')); this.tt[r]=got; this.curRow=r; } } }
  if(this.power&&t.kind!=='comb') this.tried=this.tried||this.togg>1;
  const S=this.guideSteps(); const now=S.findIndex(s=>!s.ok), done=S.filter(s=>s.ok).length;
  let tt='';
  if(t.kind==='comb'&&(t.inputs||[]).length<=4){ const all=this.ttAll(), outsN=t.outputs||[];
    tt=`<div><div class="tth">Таблица истинности твоей схемы</div><table class="tt2"><tr>${(t.inputs||[]).map(x=>`<th>${x}</th>`).join('')}${outsN.map(x=>`<th>${x}</th>`).join('')}</tr>${Object.entries(all).map(([r,v])=>{ const got=this.tt[r], exp=t.fn(v); const ok=got&&outsN.every(o=>exp[o]===undefined||got[o]===exp[o]);
      return `<tr class="${got?(ok?'ok':'bad'):''}${+r===this.curRow&&this.power?' cur':''}">${(t.inputs||[]).map(x=>`<td>${v[x]}</td>`).join('')}${outsN.map(o=>`<td>${got?got[o]:'?'}</td>`).join('')}</tr>`; }).join('')}</table>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">Зелёная строка — лампочки горят как надо, красная — нет. «?» — эту комбинацию ты ещё не пробовал.</div></div>`; }
  else if(t.kind==='comb') tt=`<div><div class="tth">Испытание</div><p style="font-size:13px;margin:0">Входов много (${t.inputs.length}) — таблица большая, проверку сделает кнопка «✔ Проверить схему».</p></div>`;
  else tt=`<div><div class="tth">Что должно получиться</div><p style="font-size:13px;margin:0">${t.text}</p></div>`;
  this.gbox.innerHTML=`<div><div class="tth">Собираем по шагам · ${done} из ${S.length}</div><div class="prog"><i style="width:${done/S.length*100}%"></i></div><ol>${S.map((s,i)=>`<li class="${s.ok?'ok':''}${i===now?' now':''}"><span class="m">${s.ok?'✓':i+1}</span><span>${s.t}${i===now||!s.ok?`<small>${s.h}</small>`:''}${s.wl&&i===now&&s.wl.length?`<details style="margin-top:3px"><summary style="font-size:12.5px;cursor:pointer">Подсказка: что с чем соединить (по эталону)</summary><ul class="wl">${s.wl.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}</span></li>`).join('')}</ol>${this.passed?'<div class="yay">🎉 Готово! Схема собрана и проверена. Можно идти к следующему заданию (→).</div>':''}</div>${tt}`; };
// встраиваемся в студию
const oR=P.render; P.render=function(fast){ const r=oR.apply(this,arguments); if(this.task&&this.gbox&&!this._ginner){ this._ginner=1; try{ this.guide(); }finally{ this._ginner=0; } } return r; };
const oRT=P.renderTask; P.renderTask=function(){ const r=oRT.apply(this,arguments); this.guideInit(); return r; };
const oT=P.toggle; P.toggle=function(){ this.togg=(this.togg||0)+1; return oT.apply(this,arguments); };
const oK=P.key_; P.key_=function(e){ if(e.key&&e.key.length===1) this.togg=(this.togg||0)+1; return oK.apply(this,arguments); };
const oC=P.check; P.check=function(){ const r=oC.apply(this,arguments); const box=this.taskBox&&this.taskBox.querySelector('.res'); this.passed=!!(box&&box.classList.contains('ok')); this.guide(); return r; };
const oL=P.loadCirc; P.loadCirc=function(){ const r=oL.apply(this,arguments); if(this.task){ this.tt={}; this.passed=false; this.tried=false; this.togg=0; } return r; };

/* «Собрать здесь»: окно EWB прямо в слайде лабы, а не на вкладке EWB */
document.addEventListener('click',e=>{ const b=e.target.closest('[data-ewbtask]'); if(!b) return; const slide=b.closest('.lslide,.topic'); if(!slide||slide.id==='t16') return;
  e.preventDefault(); e.stopImmediatePropagation(); const id=b.dataset.ewbtask, t=A.TASKS&&A.TASKS[id]; if(!t) return;
  const go=b.closest('.ewb-go')||b; let host=go.nextElementSibling;
  if(host&&host.classList.contains('ewb-inline')&&host.dataset.task===id){ host.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if(host&&host.classList.contains('ewb-inline')) host.remove();
  host=document.createElement('div'); host.className='ewb-inline'; host.dataset.task=id; host.innerHTML='<div class="ei-bar"><button class="btn" data-eiclose>Свернуть сборку ✕</button></div><div></div>';
  go.after(host); new A.Studio(host.lastChild,{task:t,height:460}); host.scrollIntoView({behavior:'smooth',block:'start'}); },true);
document.addEventListener('click',e=>{ const c=e.target.closest('[data-eiclose]'); if(c) c.closest('.ewb-inline').remove(); });
// кнопки «собрать здесь» под условиями заданий лаб 3–7 (HTML тем не трогаем — добавляем из скрипта)
const MAP={'t3-z1':['t3_f1'],'t3-z2':['t3_major','t3_tab','t3_xnand'],'t4-z3':['t4_k4'],'t4-z4':['t4_k3'],'t5-z2':['t5_fa'],'t5-z4':['t5_dec24','t5_enc42'],
  't6-z1':['t6_rssync','t6_rsnor'],'t6-z2':['t6_dlatch','t6_dff'],'t6-z3':['t6_jk','t6_t'],'t7-z1':['t7_down5'],'t7-z2':['t7_sync6'],'t7-z3':['t7_mod10'],'t7-z4':['t7_up3']};
const addGo=(task,ids)=>{ if(!task) return; const d=document.createElement('div'); d.className='ewb-go';
  d.innerHTML=ids.filter(i=>A.TASKS[i]).map((i,k)=>`<button class="btn${k?'':' pri'}" data-ewbtask="${i}">🛠 ${A.TASKS[i].title}</button>`).join(''); task.after(d); };
Object.entries(MAP).forEach(([id,ids])=>addGo(document.getElementById(id),ids));
const ha=[...document.querySelectorAll('#t5 .lab-task')].find(x=>/полусумм/i.test(x.textContent)&&!x.id); if(ha) addGo(ha,['t5_ha']);
// кнопки у заданий: подпись «собрать здесь»
document.querySelectorAll('.lslide [data-ewbtask]').forEach(b=>{ if(!/здесь/.test(b.textContent)) b.textContent=b.textContent.replace(/\s*\(автопроверка\)/,'')+' — собрать здесь по шагам'; });
})();
