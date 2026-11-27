/* EWB-студия: свободная сборка схем как в Electronics Workbench 5.12.
   Подключается ПОСЛЕ главного скрипта: использует ewbGeom/ewbDraw/ewbEval, parseExpr, minimize, ewbFromExpr, saveFile, toast, esc.
   Модель: детали {id,type,x,y,rot,p,st,out}, провода {f:'id.pin',t:'id.pin',xm?,ym?,via?}. Провода не направлены: цепь (net) = все
   выводы, соединённые проводами; значение цепи даёт выход-источник. */
(function(){
'use strict';
const W=window, A=W.ARCH=W.ARCH||{};

/* ---------------- новые детали (микросхемы рисуются прямоугольником с подписями выводов) ---------------- */
const CH={
  rs:{t:'RS Flip-Flop',L:['S','R'],R:['Q','Qn'],w:70,tag:'RS'},
  t:{t:'T Flip-Flop',L:['T','C'],R:['Q','Qn'],w:70,tag:'T',clk:'C'},
  mux2:{t:'MUX 2→1',L:['D0','D1'],B:['S'],R:['Y'],w:64,tag:'MUX'},
  mux4:{t:'MUX 4→1',L:['D0','D1','D2','D3'],B:['S1','S0'],R:['Y'],w:70,tag:'MUX'},
  mux8:{t:'MUX 8→1',L:['D0','D1','D2','D3','D4','D5','D6','D7'],B:['S2','S1','S0'],R:['Y'],w:76,tag:'MUX'},
  demux4:{t:'DEMUX 1→4',L:['D'],B:['S1','S0'],R:['Y0','Y1','Y2','Y3'],w:70,tag:'DMX'},
  dec24:{t:'Decoder 2→4',L:['A1','A0','E'],R:['Y0','Y1','Y2','Y3'],w:70,tag:'DC',def:{E:1}},
  dec38:{t:'Decoder 3→8',L:['A2','A1','A0','E'],R:['Y0','Y1','Y2','Y3','Y4','Y5','Y6','Y7'],w:76,tag:'DC',def:{E:1}},
  enc42:{t:'Encoder 4→2',L:['I0','I1','I2','I3'],R:['A1','A0','V'],w:70,tag:'CD'},
  enc83:{t:'Priority Encoder 8→3',L:['I0','I1','I2','I3','I4','I5','I6','I7'],R:['A2','A1','A0','V'],w:76,tag:'CD*'},
  add4:{t:'4-bit Adder (7483)',L:['A3','A2','A1','A0','B3','B2','B1','B0','Ci'],R:['S3','S2','S1','S0','Co'],w:80,tag:'Σ4'},
  cnt4:{t:'4-bit Counter (163)',L:['C','EN','CLR'],R:['Q3','Q2','Q1','Q0','RCO'],w:80,tag:'CT2',clk:'C',def:{EN:1,CLR:1},low:['CLR']},
  cnt10:{t:'Decade Counter (160)',L:['C','EN','CLR'],R:['Q3','Q2','Q1','Q0','RCO'],w:80,tag:'CT10',clk:'C',def:{EN:1,CLR:1},low:['CLR']},
  reg4:{t:'4-bit Register',L:['D3','D2','D1','D0','C'],R:['Q3','Q2','Q1','Q0'],w:80,tag:'RG',clk:'C'},
  cmp1:{t:'Comparator 1-bit',L:['A','B'],R:['GT','EQ','LT'],w:70,tag:'=='}
};
const SP={ // особые детали
  seg7:{t:'Seven-Segment Display'}, txt:{t:'Text (надпись)'}, conn:{t:'Connector (узел)'}
};
const NAME=Object.assign({},typeof EWB_NAME!=='undefined'?EWB_NAME:{},{gate:'Logic gate',conn:'Connector (узел)'}); Object.keys(CH).forEach(k=>NAME[k]=CH[k].t); Object.keys(SP).forEach(k=>NAME[k]=SP[k].t);
const GATE_RU={and:'AND (И)',or:'OR (ИЛИ)',not:'NOT (НЕ)',nand:'NAND (И-НЕ)',nor:'NOR (ИЛИ-НЕ)',xor:'XOR (искл. ИЛИ)',xnor:'XNOR (искл. ИЛИ-НЕ)',buf:'Buffer (повторитель)'};

function chipGeom(c){ const d=CH[c.type], L=d.L, R=d.R, B=d.B||[]; const rows=Math.max(L.length,R.length);
  const hb=rows*16+12, h=hb+(B.length?12:0), w=d.w||76, pins={};
  L.forEach((n,i)=>pins[n]=[0,14+i*16,'in']); R.forEach((n,i)=>pins[n]=[w,14+i*16,'out']);
  B.forEach((n,i)=>pins[n]=[Math.round(w/(B.length+1)*(i+1)),h,'in']); return {w,h,pins,hb}; }
function geom(c){
  if(CH[c.type]) return chipGeom(c);
  if(c.type==='seg7'){ const pins={}; 'abcdefg'.split('').forEach((k,i)=>pins[k]=[6+i*8,74,'in']); return {w:62,h:74,pins}; }
  if(c.type==='txt'){ const t=String((c.p&&c.p.text)||'Текст'); return {w:Math.max(30,t.length*6.4),h:16,pins:{}}; }
  if(c.type==='conn') return {w:8,h:8,pins:{n:[4,4,'io']}};
  if(c.type==='wg'){ const pins={}; for(let k=0;k<16;k++) pins['b'+k]=[13+(15-k)*10,46,'out']; return {w:176,h:46,pins}; } // 16 выходов, бит 15 слева — как в EWB
  if(c.type==='la'){ const pins={}; for(let k=0;k<16;k++) pins['c'+k]=[0,10+k*10,'in']; return {w:50,h:172,pins}; }
  if(c.type==='clk') return {w:50,h:36,pins:{o:[50,14,'out']}};
  return ewbGeom(c); }
/* вид деталей как в EWB: ключ с клавишей [A], генератор Clock в кружке, значки приборов */
const DX={
  sw(c){ const p=c.p, on=!!p.on; return `<circle class="bd" cx="12" cy="7" r="2.2"/><circle class="bd" cx="12" cy="23" r="2.2"/><circle cx="32" cy="15" r="2.2"/><line x1="32" y1="15" x2="12" y2="${on?8:22}" class="lv"/>`+L_(32,15,48,15)+T(1,10,"1"," class=\"sm\"")+T(1,26,"0"," class=\"sm\"")+T(22,34,`[${esc(p.key||'Space')}]`,' class="sm" text-anchor="middle"'); },
  clk(c){ return `<circle class="bd" cx="18" cy="14" r="11"/><path class="ln" d="M11,18 V10 H16 V18 H21 V10 H25"/>`+L_(29,14,50,14)+L_(18,25,18,30)+`<path class="ln" d="M12,30 H24 M14.5,33 H21.5"/>`+T(31,30,esc(c.p.f||'1 Hz')+'/50%',' class="lb" style="font-size:9.5px"'); },
  vcc(c){ return L_(12,12,12,26)+`<path class="ln" d="M4,12 H20"/>`+T(12,9,c.p.vdd?'Vdd':'Vcc',' class="sm" text-anchor="middle"'); },
  wg(c){ const v=c.view||{}; let s=`<rect x="0" y="0" width="176" height="36" fill="#d4d4d4" stroke="#000"/><rect x="6" y="5" width="164" height="15" fill="#fff" stroke="#555"/>`+T(14,16,v.idx>=0?hex4(v.idx):'0000',' style="font:10.5px Courier New,monospace"')+T(110,16,hex4(v.word||0),' style="font:10.5px Courier New,monospace"');
    for(let k=0;k<16;k++){ const x=13+k*10; s+=`<circle cx="${x}" cy="29" r="2.6" fill="#fff" stroke="#333"/>`+L_(x,32,x,46); } return s; },
  la(c){ let s=`<rect x="6" y="0" width="44" height="172" fill="#d4d4d4" stroke="#000"/><rect x="18" y="5" width="27" height="162" fill="#fff" stroke="#555"/>`;
    for(let k=0;k<16;k++){ const y=10+k*10; s+=L_(0,y,6,y)+`<circle cx="11" cy="${y}" r="2.6" fill="#fff" stroke="#333"/><path d="M21,${y+3} h4 v-5 h5 v5 h5 v-5 h5" fill="none" stroke="#333" stroke-width=".7"/>`; } return s; }};
const T=(x,y,s,o='')=>`<text x="${x}" y="${y}"${o}>${s}</text>`, L_=(a,b,c,d)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="ld"/>`;
function chipDraw(c){ const d=CH[c.type], g=chipGeom(c), p=c.p||{}; let s='';
  s+=`<rect class="bd" x="12" y="2" width="${g.w-24}" height="${g.hb-4}"/>`;
  Object.entries(g.pins).forEach(([n,[x,y,dir]])=>{ const low=(d.low||[]).includes(n); const nm=n==='Qn'?"Q'":n;
    if(x===0){ const clk=d.clk===n; const bub=low||(clk&&p.edge==='fall'); s+=L_(0,y,bub?6:12,y)+(bub?`<circle class="bd" cx="9" cy="${y}" r="3"/>`:'');
      if(clk) s+=`<path class="ln" d="M12,${y-5} L19,${y} L12,${y+5}"/>`+T(22,y+3.5,n==='C'?'':nm,' class="pn"'); else s+=T(15,y+3.5,nm,' class="pn"'); }
    else if(x===g.w){ s+=L_(g.w-12,y,g.w,y)+T(g.w-15,y+3.5,nm,' class="pn" text-anchor="end"'); }
    else { s+=L_(x,g.hb-2,x,g.h)+T(x,g.hb-5,nm,' class="sm" text-anchor="middle"'); } });
  s+=T(g.w/2,(g.hb)/2+4,d.tag,' class="sm" text-anchor="middle" style="font-weight:700;font-size:10px;fill:#444"');
  if(c.view&&c.view.bad) s+=T(g.w/2,g.hb+12,'запрет!',' class="sm" text-anchor="middle" style="fill:#c00;font-weight:700"');
  return s; }
const SEGS={a:'M14,8 h26',b:'M42,10 v22',c:'M42,38 v22',d:'M14,62 h26',e:'M12,38 v22',f:'M12,10 v22',g:'M14,35 h26'};
function draw(c,showL=true){ const p=c.p||{}, g=geom(c); const lbl=p.label&&showL&&c.type!=='lc'?T(g.w/2,-5,esc(p.label),' class="lb" text-anchor="middle"'):'';
  if(DX[c.type]) return lbl+DX[c.type](c);
  if(CH[c.type]) return lbl+chipDraw(c);
  if(c.type==='seg7'){ const v=c.view||{}; let s=`<rect x="2" y="0" width="52" height="68" fill="#222" stroke="#000"/>`;
    Object.entries(SEGS).forEach(([k,d])=>s+=`<path d="${d}" stroke="${v[k]?'#ff3030':'#4a1010'}" stroke-width="5" stroke-linecap="round" fill="none"/>`);
    'abcdefg'.split('').forEach((k,i)=>s+=L_(6+i*8,68,6+i*8,74)+T(6+i*8,66,k,' style="font-size:6px;fill:#bbb" text-anchor="middle"')); return lbl+s; }
  if(c.type==='txt') return T(0,12,esc(p.text||'Текст'),` style="font-size:12px;fill:${p.col||'#1a1a8a'}"`);
  if(c.type==='lamp'&&p.col&&p.col!=='red'){ const col={green:'#19c519',blue:'#2a6bff',yellow:'#ffd000'}[p.col]||'#ff2a2a'; const on=c.view&&c.view.on;
    return lbl+L_(0,12,12,12)+(on?`<circle cx="20" cy="12" r="13" fill="${col}" opacity=".25"/>`:'')+`<circle class="bd" cx="20" cy="12" r="8" style="fill:${on?col:'#fff'}"/>`; }
  if(!showL&&p.label) return ewbDraw(Object.assign({},c,{p:Object.assign({},p,{label:''})}),c.view);
  return ewbDraw(c,c.view); }
function evalPart(c,get){ const p=c.p||{}, st=c.st;
  const edge=(pin)=>{ const C=get(pin), fall=p.edge==='fall'; const k='pc_'+pin; const e=st[k]!==undefined&&st[k]!==C&&(fall?C===0:C===1); st[k]=C; return e; };
  const pre=(n)=>{ const cur=get(n), k='pv_'+n, v=st[k]===undefined?cur:st[k]; st[k]=cur; return v; }; // значение входа ДО фронта
  const num=(names)=>names.reduce((s,n)=>s*2+(get(n)?1:0),0);
  switch(c.type){
    case 'rs':{ const S=get('S'),R=get('R'); c.view={bad:S&&R}; if(S&&!R) st.q=1; else if(R&&!S) st.q=0; if(S&&R) return {Q:0,Qn:0}; return {Q:st.q||0,Qn:1-(st.q||0)}; }
    case 't':{ const tv=pre('T'); if(edge('C')&&tv) st.q=1-(st.q||0); return {Q:st.q||0,Qn:1-(st.q||0)}; }
    case 'mux2': return {Y:get(get('S')?'D1':'D0')};
    case 'mux4': return {Y:get('D'+num(['S1','S0']))};
    case 'mux8': return {Y:get('D'+num(['S2','S1','S0']))};
    case 'demux4':{ const i=num(['S1','S0']), d=get('D'), o={}; for(let k=0;k<4;k++) o['Y'+k]=(k===i&&d)?1:0; return o; }
    case 'dec24': case 'dec38':{ const n=c.type==='dec24'?['A1','A0']:['A2','A1','A0'], i=num(n), e=get('E'), o={}; for(let k=0;k<(1<<n.length);k++) o['Y'+k]=(k===i&&e)?1:0; return o; }
    case 'enc42':{ const I=[0,1,2,3].map(k=>get('I'+k)); return {A1:I[2]|I[3],A0:I[1]|I[3],V:(I[0]|I[1]|I[2]|I[3])}; }
    case 'enc83':{ let hi=-1; for(let k=7;k>=0;k--) if(get('I'+k)){ hi=k; break; } const v=Math.max(hi,0); return {A2:(v>>2)&1,A1:(v>>1)&1,A0:v&1,V:hi>=0?1:0}; }
    case 'add4':{ const a=num(['A3','A2','A1','A0']), b=num(['B3','B2','B1','B0']), s=a+b+get('Ci'); return {S3:(s>>3)&1,S2:(s>>2)&1,S1:(s>>1)&1,S0:s&1,Co:(s>>4)&1}; }
    case 'cnt4': case 'cnt10':{ const M=c.type==='cnt4'?16:10; st.q=st.q||0; if(edge('C')&&get('EN')) st.q=(st.q+1)%M; if(get('CLR')===0) st.q=0; const q=st.q;
      return {Q3:(q>>3)&1,Q2:(q>>2)&1,Q1:(q>>1)&1,Q0:q&1,RCO:(q===M-1&&get('EN'))?1:0}; }
    case 'reg4':{ const dv=['D3','D2','D1','D0'].reduce((s,n)=>s*2+(pre(n)?1:0),0); if(edge('C')) st.q=dv; const q=st.q||0; return {Q3:(q>>3)&1,Q2:(q>>2)&1,Q1:(q>>1)&1,Q0:q&1}; }
    case 'cmp1':{ const a=get('A'),b=get('B'); return {GT:a&&!b?1:0,EQ:a===b?1:0,LT:!a&&b?1:0}; }
    case 'seg7':{ const v={}; 'abcdefg'.split('').forEach(k=>v[k]=get(k)); c.view=v; return {}; }
    case 'txt': case 'conn': return {};
  }
  return ewbEval(c,get); }
const isClocked=c=>['jk','d','t','cnt4','cnt10','reg4'].includes(c.type);

/* ---------------- полки деталей (Parts Bins) — состав как в EWB 5.12 ----------------
   Плитка: {n:имя, i:значок, it:деталь} — ставится сразу; {fam:[…]} — сначала выбор модели; без it/fam — аналоговая деталь (только сообщение). */
const I=s=>`<svg viewBox="0 0 24 24">${s}</svg>`, PA=(d,o='')=>`<path d="${d}" fill="none" stroke="#000" stroke-width="1.1"${o}/>`;
const TX=(x,y,t,sz=6.5,o='')=>`<text x="${x}" y="${y}" text-anchor="middle" style="font:700 ${sz}px Arial;fill:#000"${o}>${t}</text>`;
const CI=(s='')=>`<circle cx="12" cy="12" r="7" fill="#fff" stroke="#000" stroke-width="1.1"/>`+s;
const DI=(s='')=>PA('M12 4l7 8-7 8-7-8z','fill="#fff"')+PA('M1 9h5M1 15h5M18 12h5')+s;
const BX=(t,sz=6.5)=>`<rect x="4" y="5" width="16" height="14" fill="#fff" stroke="#000" stroke-width="1.1"/>`+TX(12,14.5,t,sz);
const CHIP=t=>TX(12,8,t,6)+`<rect x="3" y="11" width="18" height="8" fill="#fff" stroke="#000"/><path d="M4 19v2M8 19v2M12 19v2M16 19v2M20 19v2" stroke="#000" stroke-width=".8"/>`;
const GI=k=>{ const inv=['nand','nor','xnor','not'].includes(k), b=k.replace(/^n(and|or)$/,'$1').replace('xnor','xor'); let s=PA('M1 9h5M1 15h5');
  if(k==='not'||k==='buf'||k==='tri'||k==='sch'){ s=PA('M1 12h5')+PA('M6 6l10 6-10 6z','fill="#fff"')+(k==='not'?'<circle cx="18" cy="12" r="2" fill="#fff" stroke="#000"/>'+PA('M20 12h3'):PA('M16 12h7'));
    if(k==='tri') s+=PA('M11 3v6'); if(k==='sch') s+=PA('M8 14h3v-4h2'); return I(s); }
  s+= b==='and'? PA('M6 6h5a6 6 0 010 12H6z','fill="#fff"') : PA('M5 6q8 0 11 6q-3 6-11 6q3-6 0-12z','fill="#fff"');
  if(b==='xor') s+=PA('M3 6q3 6 0 12'); s+= inv?'<circle cx="19" cy="12" r="2" fill="#fff" stroke="#000"/>'+PA('M21 12h2'):PA('M17 12h6'); return I(s); };
const g2=k=>({type:'gate',p:{k,n:2}}), gn=(k,n)=>({type:'gate',p:k==='not'||k==='buf'?{k}:{k,n}});
const M_=(m,t,it)=>({m,t,it});
const FAM={
  ttl:[M_('7400','Quad 2-input NAND',gn('nand',2)),M_('7402','Quad 2-input NOR',gn('nor',2)),M_('7404','Hex inverter',gn('not')),M_('7408','Quad 2-input AND',gn('and',2)),M_('7410','Triple 3-input NAND',gn('nand',3)),M_('7411','Triple 3-input AND',gn('and',3)),M_('7420','Dual 4-input NAND',gn('nand',4)),M_('7421','Dual 4-input AND',gn('and',4)),M_('7427','Triple 3-input NOR',gn('nor',3)),M_('7432','Quad 2-input OR',gn('or',2)),M_('7474','Dual D-type flip-flop (PR, CLR)',{type:'d',p:{edge:'rise',async:1}}),M_('7476','Dual JK flip-flop (PR, CLR)',{type:'jk',p:{edge:'fall',async:1}}),M_('7483','4-bit binary full adder',{type:'add4'}),M_('7485','Magnitude comparator (1 разряд)',{type:'cmp1'}),M_('7486','Quad 2-input XOR',gn('xor',2))],
  ttl1:[M_('74138','3-to-8 line decoder',{type:'dec38'}),M_('74139','Dual 2-to-4 line decoder',{type:'dec24'}),M_('74148','8-to-3 priority encoder',{type:'enc83'}),M_('74151','1-of-8 data selector (MUX)',{type:'mux8'}),M_('74153','Dual 4-to-1 data selector (MUX)',{type:'mux4'}),M_('74155','Dual 2-to-4 demultiplexer',{type:'demux4'}),M_('74157','Quad 2-to-1 data selector (MUX)',{type:'mux2'}),M_('74160','Synchronous decade counter',{type:'cnt10'}),M_('74163','Synchronous 4-bit binary counter',{type:'cnt4'}),M_('74175','Quad D-type flip-flop (регистр)',{type:'reg4'})],
  ttl2:[M_('74266','Quad 2-input XNOR',gn('xnor',2)),M_('74283','4-bit binary full adder',{type:'add4'})],
  ttl3:[M_('74393','4-bit binary counter',{type:'cnt4'})], ttl4:[],
  cmos:[M_('4001','Quad 2-input NOR',gn('nor',2)),M_('4002','Dual 4-input NOR',gn('nor',4)),M_('4011','Quad 2-input NAND',gn('nand',2)),M_('4012','Dual 4-input NAND',gn('nand',4)),M_('4013','Dual D-type flip-flop',{type:'d',p:{edge:'rise',async:1}}),M_('4023','Triple 3-input NAND',gn('nand',3)),M_('4025','Triple 3-input NOR',gn('nor',3)),M_('4027','Dual JK flip-flop',{type:'jk',p:{edge:'rise',async:1}}),M_('4030','Quad 2-input XOR',gn('xor',2)),M_('4069','Hex inverter',gn('not')),M_('4071','Quad 2-input OR',gn('or',2)),M_('4073','Triple 3-input AND',gn('and',3)),M_('4075','Triple 3-input OR',gn('or',3)),M_('4077','Quad 2-input XNOR',gn('xnor',2)),M_('4081','Quad 2-input AND',gn('and',2)),M_('4082','Dual 4-input AND',gn('and',4))]};
const pick=(list,ms)=>ms.map(m=>[].concat(FAM.ttl,FAM.ttl1,FAM.ttl2,FAM.cmos).find(x=>x.m===m)).filter(Boolean);
const GFAM={and:['7408','7411','7421','4081','4073','4082'],or:['7432','4071','4075'],nand:['7400','7410','7420','4011','4023','4012'],nor:['7402','7427','4001','4025','4002'],not:['7404','4069'],xor:['7486','4030'],xnor:['74266','4077'],buf:[]};
const ICV=(t)=>({n:t}); // аналоговая деталь — только сообщение
const BINS=[
  {k:'fav',t:'Favorites',items:[]},
  {k:'sources',t:'Sources',items:[{n:'Ground',i:I(PA('M12 3v9M5 12h14M8 15.5h8M10.5 19h3')),it:{type:'gnd'}},{n:'Battery',i:I(PA('M2 12h7M15 12h7M9 5v14M15 8v8'))},{n:'DC Current Source',i:I(CI(PA('M12 17V7M9 10l3-3 3 3')))},{n:'AC Voltage Source',i:I(CI(PA('M7.5 12q2.25-5 4.5 0t4.5 0')))},{n:'AC Current Source',i:I(CI(PA('M12 18V6M9.5 8.5L12 6l2.5 2.5M7 13.5q1.2-2 2.4 0')))},
    {n:'Voltage-Controlled Voltage Source',i:I(DI(TX(12,11,'+',7)+TX(12,17,'–',7)))},{n:'Voltage-Controlled Current Source',i:I(DI(PA('M12 16V8M10 10l2-2 2 2')))},{n:'Current-Controlled Voltage Source',i:I(DI(TX(12,11,'+',7)+TX(12,17,'–',7)))},{n:'Current-Controlled Current Source',i:I(DI(PA('M12 16V8M10 10l2-2 2 2')))},
    {n:'Vcc Source',i:I(TX(12,8,'Vcc',7)+PA('M5 10h14M12 10v12')),it:{type:'vcc'}},{n:'Vdd Source',i:I(TX(12,8,'Vdd',7)+PA('M5 10h14M12 10v12')),it:{type:'vcc',p:{vdd:1}}},{n:'Clock',i:I(CI(PA('M8 15v-6h4v6h4v-6'))),it:{type:'clk',p:{f:'1 Hz',fv:1}}},
    {n:'AM Source',i:I(CI(TX(12,14.5,'AM',6)))},{n:'FM Source',i:I(CI(TX(12,14.5,'FM',6)))},{n:'Voltage-Controlled Sine Wave Oscillator',i:I(DI(PA('M8 12q2-4 4 0t4 0')))},{n:'Voltage-Controlled Triangle Wave Oscillator',i:I(DI(PA('M8 13l2-3 2 4 2-4 2 3')))},{n:'Voltage-Controlled Square Wave Oscillator',i:I(DI(PA('M8 14v-4h4v4h4v-4')))},{n:'Controlled One-Shot',i:I(DI(PA('M8 14h2v-4h4v4h2')))},
    {n:'Piecewise Linear Source',i:I(`<rect x="5" y="5" width="14" height="14" fill="#000"/><rect x="8" y="5" width="8" height="5" fill="#fff"/><rect x="8" y="13" width="8" height="6" fill="#ddd"/>`)},{n:'Voltage-Controlled Piecewise Linear Source',i:I(CI(PA('M8 15l3-5 2 3 3-5')))},{n:'Frequency-Shift-Keying Source',i:I(CI(TX(12,14.5,'FSK',5.5)))},{n:'Polynomial Source',i:I(DI(TX(12,14.5,'P',7)))},{n:'Nonlinear Dependent Source',i:I(DI(TX(12,14.5,'N',7)))}]},
  {k:'basic',t:'Basic',items:[{n:'Connector',i:I('<circle cx="12" cy="12" r="2.6"/>'),it:{type:'conn'}},{n:'Resistor',i:I(PA('M1 12h4l1.5-4 3 8 3-8 3 8 3-8 1.5 4h4'))},{n:'Capacitor',i:I(PA('M1 12h9M14 12h9M10 5v14M14 5v14'))},{n:'Inductor',i:I(PA('M1 13h3a2.5 2.5 0 015 0a2.5 2.5 0 015 0a2.5 2.5 0 015 0h5'))},{n:'Transformer',i:I(PA('M7 3v3a2 2 0 010 4a2 2 0 010 4a2 2 0 010 4v3M17 3v3a2 2 0 000 4a2 2 0 000 4a2 2 0 000 4v3M11 4v16M13 4v16'))},
    {n:'Relay',i:I(`<rect x="3" y="4" width="8" height="16" fill="#fff" stroke="#000"/>`+PA('M14 18l6-6M14 6h7M14 18h-2'))},{n:'Switch',i:I(PA('M2 16h5l9-6M17 16h5')+'<circle cx="7" cy="16" r="1.4"/><circle cx="17" cy="16" r="1.4"/>'+TX(12,7,'[ ]',6)),it:{type:'sw',p:{key:'A',label:'A'}}},{n:'Time-Delay Switch',i:I(PA('M2 16h5l9-6M17 16h5')+TX(12,8,'TD',6))},{n:'Voltage-Controlled Switch',i:I(PA('M2 16h5l9-6M17 16h5')+`<rect x="9" y="3" width="6" height="4" fill="#fff" stroke="#000"/>`)},{n:'Current-Controlled Switch',i:I(PA('M2 16h5l9-6M17 16h5M8 4h8'))},
    {n:'Pull-Up Resistor',i:I(TX(12,6,'+V',6)+PA('M12 8v2l-3 1.5 6 2-6 2 6 2-3 1.5v3'))},{n:'Potentiometer',i:I(PA('M1 14h4l1.5-4 3 8 3-8 3 8 3-8 1.5 4h4M12 4v6M10 8l2 2 2-2'))},{n:'Resistor Pack',i:I(`<rect x="3" y="5" width="18" height="14" fill="#fff" stroke="#000"/>`+PA('M6 8v8M10 8v8M14 8v8M18 8v8'))},{n:'Voltage-Controlled Analog Switch',i:I(`<rect x="4" y="5" width="16" height="14" fill="#fff" stroke="#000"/>`+PA('M7 14l8-4'))},
    {n:'Polarized Capacitor',i:I(PA('M1 12h9M14 12h9M10 5v14M16 5q-4 7 0 14')+TX(6,8,'+',7))},{n:'Variable Capacitor',i:I(PA('M1 12h9M14 12h9M10 5v14M14 5v14M5 19l14-14M16 5h3v3'))},{n:'Variable Inductor',i:I(PA('M1 13h3a2.5 2.5 0 015 0a2.5 2.5 0 015 0a2.5 2.5 0 015 0h5M5 19l14-14'))},{n:'Coreless Coil',i:I(PA('M2 12h3a2 2 0 014 0a2 2 0 014 0a2 2 0 014 0h5'))},{n:'Magnetic Core',i:I(PA('M3 8a3 3 0 016 0a3 3 0 016 0a3 3 0 016 0M3 16h18M3 18h18'))},{n:'Nonlinear Transformer',i:I(PA('M7 3v18M17 3v18M11 4v16M13 4v16')+TX(12,22,'NL',5))}]},
  {k:'diodes',t:'Diodes',items:[{n:'Diode',i:I(PA('M1 12h7M16 12h7M16 6v12')+PA('M8 6v12l8-6z','fill="#fff"'))},{n:'Zener Diode',i:I(PA('M1 12h7M16 12h7M18 5l-2 1v12l-2 1')+PA('M8 6v12l8-6z','fill="#fff"'))},{n:'Light-Emitting Diode',i:I(PA('M1 12h7M16 12h7M16 6v12M15 4l3-3M18 6l3-3')+PA('M8 6v12l8-6z','fill="#fff"'))},{n:'Full-Wave Bridge Rectifier',i:I(PA('M12 3l9 9-9 9-9-9z')+PA('M9 9l3 3M15 15l-3-3'))},{n:'Shockley Diode',i:I(PA('M1 12h7M16 12h7M16 6v12M8 6v12l8-6zM16 12l3 4'))},{n:'Silicon-Controlled Rectifier',i:I(PA('M1 12h7M16 12h7M16 6v12M16 16l4 5')+PA('M8 6v12l8-6z','fill="#fff"'))},{n:'DIAC',i:I(PA('M2 12h20M7 4v16M17 4v16M7 6l10 6-10 6M17 6L7 12l10 6'))},{n:'TRIAC',i:I(PA('M2 12h20M7 4v16M17 4v16M7 6l10 6-10 6M17 6L7 12l10 6M17 16l4 5'))},{n:'Varactor Diode',i:I(PA('M1 12h7M18 12h5M16 6v12M18 6v12')+PA('M8 6v12l8-6z','fill="#fff"'))}]},
  {k:'trans',t:'Transistors',items:['NPN Transistor','PNP Transistor','N-Channel JFET','P-Channel JFET','3-Terminal Depletion N-MOSFET','3-Terminal Depletion P-MOSFET','4-Terminal Depletion N-MOSFET','4-Terminal Depletion P-MOSFET','3-Terminal Enhancement N-MOSFET','3-Terminal Enhancement P-MOSFET','4-Terminal Enhancement N-MOSFET','4-Terminal Enhancement P-MOSFET','N-Channel GaAsFET','P-Channel GaAsFET'].map((n,k)=>({n,i:I(CI(PA(k<2?'M3 12h6M9 7v10M9 10l6-5M9 14l6 5':'M3 14h6M9 7v10M9 9h7M9 15h7')+(k===0?PA('M13 17.5l2 1.5-.5-2.4'):'')))}))},
  {k:'analog',t:'Analog ICs',items:['3-Terminal Opamp','5-Terminal Opamp','7-Terminal Opamp','9-Terminal Opamp','Comparator','Phase-Locked Loop'].map((n,k)=>({n,i:I(k===5?BX('PLL',6):PA('M5 4v16l14-8z','fill="#fff"')+PA('M1 8h4M1 16h4M19 12h4')+TX(8,10,'–',6)+TX(8,17,'+',6)+(k===4?TX(11,14,'C',5):''))}))},
  {k:'mixed',t:'Mixed ICs',items:[['ADC','A/D'],['DAC (I)','D/A'],['DAC (V)','D/A'],['Monostable Multivibrator','⊓'],['555 Timer','555']].map(([n,t])=>({n,i:I(BX(t,6))}))},
  {k:'digic',t:'Digital ICs',items:[['74xx','ttl'],['741xx','ttl1'],['742xx','ttl2'],['743xx','ttl3'],['744xx','ttl4'],['4xxx','cmos']].map(([t,f])=>({n:t+' ICs',i:I(CHIP(t)),fam:FAM[f]}))},
  {k:'gates',t:'Logic Gates',items:[{n:'2-Input AND Gate',i:GI('and'),it:g2('and')},{n:'2-Input OR Gate',i:GI('or'),it:g2('or')},{n:'NOT Gate',i:GI('not'),it:{type:'gate',p:{k:'not'}}},{n:'2-Input NOR Gate',i:GI('nor'),it:g2('nor')},{n:'2-Input NAND Gate',i:GI('nand'),it:g2('nand')},{n:'2-Input XOR Gate',i:GI('xor'),it:g2('xor')},{n:'2-Input XNOR Gate',i:GI('xnor'),it:g2('xnor')},{n:'Tristate Buffer',i:GI('tri'),it:{type:'gate',p:{k:'buf'}}},{n:'Buffer',i:GI('buf'),it:{type:'gate',p:{k:'buf'}}},{n:'Schmitt Trigger',i:GI('sch'),it:{type:'gate',p:{k:'buf'}}},
    ...['and','or','nand','nor','not','xor','xnor','buf'].map(k=>({n:k.toUpperCase()+' ICs',i:I(CHIP(k.toUpperCase())),fam:pick(null,GFAM[k]),row:2}))]},
  {k:'digital',t:'Digital',items:[{n:'Half-Adder',i:I(BX('½+',7)),it:{type:'ha'}},{n:'Full-Adder',i:I(BX('Σ',8)),it:{type:'fa'}},{n:'RS Flip-Flop',i:I(BX('RS',6.5)),it:{type:'rs'}},{n:'JK Flip-Flop with Active High Asynch Inputs',i:I(BX('JK',6.5)),it:{type:'jk',p:{edge:'fall'}}},{n:'JK Flip-Flop with Active Low Asynch Inputs',i:I(BX('JK',6.5)+'<circle cx="12" cy="4" r="1.3" fill="#fff" stroke="#000"/>'),it:{type:'jk',p:{edge:'fall',async:1}}},{n:'D Flip-Flop',i:I(BX('D',7)),it:{type:'d',p:{edge:'rise'}}},{n:'D Flip-Flop with Active Low Asynch Inputs',i:I(BX('D',7)+'<circle cx="12" cy="4" r="1.3" fill="#fff" stroke="#000"/>'),it:{type:'d',p:{edge:'rise',async:1}}},
    {n:'Multiplexers',i:I(BX('MUX',5.5)),fam:pick(null,['74157','74153','74151'])},{n:'Demultiplexers',i:I(BX('DMX',5.5)),fam:pick(null,['74155','74139','74138'])},{n:'Encoders',i:I(BX('ENC',5.5)),fam:[M_('4→2','4-to-2 line encoder',{type:'enc42'})].concat(pick(null,['74148']))},{n:'Arithmetic',i:I(BX('Σ4',6)),fam:pick(null,['7483','74283','7485'])},{n:'Counters',i:I(BX('CNT',5.5)),fam:pick(null,['74163','74160'])},{n:'Shift Registers',i:I(BX('SR',6)),fam:pick(null,['74175'])},{n:'Flip-Flops',i:I(BX('FF',6)),fam:[M_('T','T flip-flop (из JK, учебный)',{type:'t',p:{edge:'rise'}})].concat(pick(null,['7474','7476','4013','4027']))}]},
  {k:'ind',t:'Indicators',items:[{n:'Voltmeter',i:I(BX('V',8))},{n:'Ammeter',i:I(BX('A',8))},{n:'Bulb',i:I(CI(PA('M7 12q2.5-4 5 0t5 0')))},{n:'Red Probe',i:I('<circle cx="12" cy="12" r="6" fill="#e00" stroke="#000"/>'+PA('M1 12h5')),it:{type:'lamp',p:{}}},{n:'Seven-Segment Display',i:I(`<rect x="5" y="2" width="14" height="18" fill="#fff" stroke="#000"/>`+TX(12,16,'8',13,' style="font:700 13px Arial;fill:#e00"')+PA('M7 20v3M10 20v3M14 20v3M17 20v3')),it:{type:'seg7'}},{n:'Decoded Seven-Segment Display',i:I(`<rect x="5" y="2" width="14" height="18" fill="#fff" stroke="#000"/>`+TX(12,16,'8',13,' style="font:700 13px Arial;fill:#e00"')+PA('M8 20v3M11 20v3M14 20v3M17 20v3')),it:{type:'hex'}},{n:'Buzzer',i:I(PA('M5 9h5l6-5v16l-6-5H5z','fill="#fff"'))},{n:'Bargraph Display',i:I(`<rect x="3" y="4" width="18" height="16" fill="#fff" stroke="#000"/>`+PA('M6 7h12M6 10h12M6 13h12M6 16h12'))},{n:'Decoded Bargraph Display',i:I(`<rect x="3" y="4" width="18" height="16" fill="#000" stroke="#000"/>`+PA('M6 7h12M6 10h12M6 13h12M6 16h12','stroke="#fff"'))}]},
  {k:'controls',t:'Controls',items:[['Voltage Differentiator','d/dt'],['Voltage Integrator','∫'],['Voltage Gain Block','K'],['Voltage Multiplier','X'],['Voltage Divider','÷'],['Three-Way Voltage Summer','Σ'],['Voltage Limiter','⊐'],['Current Limiter Block','I'],['Voltage Hysteresis Block','⊏⊐'],['Voltage Slew Rate Block','/']].map(([n,t])=>({n,i:I(BX(t,7))}))},
  {k:'misc',t:'Miscellaneous',items:[{n:'Fuse',i:I(PA('M2 12h4M18 12h4')+`<rect x="6" y="9" width="12" height="6" fill="#fff" stroke="#000"/>`+PA('M6 12h12'))},{n:'Write Data',i:I(BX('W',8))},{n:'Netlist Component',i:I(BX('N',8))},{n:'Lossy Transmission Line',i:I(PA('M2 9h20M2 15h20')+TX(12,13.5,'Z',6))},{n:'Lossless Transmission Line',i:I(PA('M2 9h20M2 15h20'))},{n:'Crystal',i:I(PA('M1 12h6M17 12h6M7 6v12M17 6v12')+`<rect x="9" y="7" width="6" height="10" fill="#fff" stroke="#000"/>`)},{n:'DC Motor',i:I(CI(TX(12,14.5,'M',8)))},{n:'Vacuum Triode',i:I(CI(PA('M8 16h8M8 12h8M8 8h8','stroke-dasharray="1.5 1"')))},{n:'Buck Converter',i:I(BX('BK',6))},{n:'Boost Converter',i:I(BX('BS',6))},{n:'Buck Boost Converter',i:I(BX('BB',6))},{n:'Text (надпись)',i:I(TX(12,17,'Aa',11,' style="font:11px Arial;fill:#1a1a8a"')),it:{type:'txt',p:{text:'Текст'}}}]},
  {k:'inst',t:'Instruments',items:[{n:'Multimeter',i:I(`<rect x="2" y="5" width="20" height="13" fill="#ddd" stroke="#000"/><rect x="5" y="7" width="14" height="5" fill="#fff" stroke="#000"/><circle cx="8" cy="15.5" r="1"/><circle cx="16" cy="15.5" r="1"/>`)},{n:'Function Generator',i:I(`<rect x="2" y="5" width="20" height="13" fill="#ddd" stroke="#000"/>`+PA('M4 11l2-3 2 3M10 11q1.5-3 3 0t3 0M18 11v-3h2v3')+'<circle cx="8" cy="15.5" r="1"/><circle cx="12" cy="15.5" r="1"/><circle cx="16" cy="15.5" r="1"/>')},{n:'Oscilloscope',i:I(`<rect x="2" y="4" width="20" height="15" fill="#ddd" stroke="#000"/><rect x="4" y="6" width="16" height="10" fill="#fff" stroke="#000"/>`+PA('M5 13q3-7 7 0t7-3'))},{n:'Bode Plotter',i:I(`<rect x="2" y="4" width="20" height="15" fill="#ddd" stroke="#000"/><rect x="4" y="6" width="16" height="10" fill="#fff" stroke="#000"/>`+PA('M5 8h8q4 0 6 7'))},
    {n:'Word Generator',i:I(`<rect x="2" y="5" width="20" height="13" fill="#ddd" stroke="#000"/><rect x="4" y="7" width="16" height="6" fill="#fff" stroke="#000"/>`+TX(12,12,'01X',5.5)+PA('M5 16h14','stroke-dasharray="1 1.5"')),it:{type:'wg',p:{words:[0,1,2,3,4,5,6,7]}}},{n:'Logic Analyzer',i:I(`<rect x="2" y="3" width="20" height="18" fill="#ddd" stroke="#000"/><rect x="7" y="5" width="13" height="14" fill="#fff" stroke="#000"/>`+PA('M8 8h3v-2h3v2h3M8 12h2v-2h4v2h3M8 16h4v-2h2v2h3','stroke-width=".8"')+PA('M3 6v13','stroke-dasharray="1 1.5"')),it:{type:'la'}},{n:'Logic Converter',i:I(`<rect x="1" y="5" width="22" height="14" fill="#e3262b" stroke="#600"/><rect x="3" y="9" width="18" height="8" fill="#fff" stroke="#600"/>`+PA('M4 11h3a2 2 0 010 4H4zM9 13h4M11 11.5l2 1.5-2 1.5')+TX(17.5,15.5,'A|B',4.5)),it:{type:'lc'}}]}];
const INSTR=['lc','wg','la'];
const BIN_ICON={fav:I(`<rect x="3" y="4" width="8" height="16" fill="#fff" stroke="#000"/>`+PA('M3 8h8M3 12h8M3 16h8M7 4v16M14 12h8M14 12l3-3M14 12l3 3')),sources:I(PA('M12 2v6M4 8h16M7 12h10M4 16h16M7 20h10')),basic:I(PA('M1 12h4l1.5-4 3 8 3-8 3 8 3-8 1.5 4h4')),diodes:I(PA('M2 12h6M15 12h7M15 6v12')+PA('M8 6v12l7-6z','fill="#fff"')),trans:I(PA('M3 12h7M10 6v12M10 9l8-5M10 15l8 5M16 18.5l2 1.5-.4-2.5')),
  analog:I(TX(12,6,'ANA',5.5,' style="font:700 5.5px Arial;fill:#1a1aa0"')+PA('M12 8l5 6-5 6-5-6z','fill="#fff"')+PA('M10 14h4')),mixed:I(TX(12,6,'MIXED',5,' style="font:700 5px Arial;fill:#1a1aa0"')+PA('M12 8l5 6-5 6-5-6z','fill="#fff"')+PA('M10 14h4')),digic:I(TX(12,6,'DIGIT',5,' style="font:700 5px Arial;fill:#1a1aa0"')+PA('M12 8l5 6-5 6-5-6z','fill="#fff"')+PA('M10 14h4')),
  gates:GI('and'),digital:I(`<rect x="3" y="3" width="18" height="18" fill="#fff" stroke="#000"/>`+TX(8,10,'S',6)+TX(16,10,'Q',6)+TX(8,18,'R',6)+TX(16,18,'Q',6)+PA('M12 3v18M3 12h18','stroke-width=".6"')),
  ind:I(`<rect x="5" y="2" width="14" height="19" fill="#fff" stroke="#000"/>`+TX(12,16,'8',13,' style="font:700 13px Arial;fill:#d00"')),controls:I(`<rect x="4" y="3" width="16" height="17" fill="#fff" stroke="#000"/>`+TX(12,16,'f',12,' style="font:italic 700 12px Times New Roman"')),misc:I(TX(12,19,'M',17,' style="font:900 17px Arial"')),
  inst:I(`<rect x="2" y="3" width="20" height="15" fill="#ddd" stroke="#000"/><rect x="4" y="5" width="16" height="9" fill="#fff" stroke="#000"/>`+PA('M5 12h3v-4h4v4h3v-4h3','stroke="#0a0"')+'<circle cx="8" cy="16" r=".8"/><circle cx="16" cy="16" r=".8"/>')};
const BIN_GAP={sources:1,analog:1,gates:1,ind:1,inst:1}; // где в ряду полок разрыв, как в EWB
function itemName(it){ if(it.type==='gate') return GATE_RU[it.p.k]; if(it.type==='lamp') return 'Red Probe (пробник)';
  if(it.type==='d'||it.type==='jk') return NAME[it.type]+(it.p&&it.p.async?' + PR/CLR':''); return NAME[it.type]||it.type; }

/* ---------------- маршрутизация проводов ---------------- */
const snap=v=>Math.round(v/5)*5;
function rot(x,y,cx,cy,r){ for(let i=0;i<r;i++){ const dx=x-cx, dy=y-cy; x=cx-dy; y=cy+dx; } return [x,y]; }
function pinInfo(c,pin){ const g=geom(c); const q=g.pins[pin]||g.pins[pin==='i'?'n':pin]; if(!q) return null; const r=(c.rot||0)%4;
  let [x,y]=q; let d=x<=0?[-1,0]:x>=g.w?[1,0]:y<=0?[0,-1]:y>=g.h?[0,1]:[0,0]; if(c.type==='conn') d=[0,0];
  if(c.fx){ x=g.w-x; d=[-d[0],d[1]]; } if(c.fy){ y=g.h-y; d=[d[0],-d[1]]; } // Flip: сначала отражение, потом поворот (как transform в render)
  [x,y]=rot(x,y,g.w/2,g.h/2,r); let [dx,dy]=d; for(let i=0;i<r;i++){ [dx,dy]=[-dy,dx]; }
  const ins=Object.keys(g.pins).filter(n=>g.pins[n][2]==='in'); const k=Math.max(0,ins.indexOf(pin));
  return {x:c.x+x,y:c.y+y,d:[dx,dy],dir:q[2],k}; }
function route(a,b,w){
  if(w.via&&w.via.length) return [[a.x,a.y],...w.via,[b.x,b.y]];
  const S=10, p1=[a.x+a.d[0]*S,a.y+a.d[1]*S], p2=[b.x+b.d[0]*S,b.y+b.d[1]*S];
  const h1=a.d[1]===0, h2=b.d[1]===0; let mid;
  if(w.xm!=null) mid=[[w.xm,p1[1]],[w.xm,p2[1]]];
  else if(w.ym!=null) mid=[[p1[0],w.ym],[p2[0],w.ym]];
  else if(h1&&h2){ const k=b.k||0; const xm=p2[0]>p1[0]+8+k*6? p2[0]-k*6 : snap((p1[0]+p2[0])/2); mid=[[xm,p1[1]],[xm,p2[1]]]; }
  else if(!h1&&!h2){ const ym=snap((p1[1]+p2[1])/2); mid=[[p1[0],ym],[p2[0],ym]]; }
  else if(h1) mid=[[p2[0],p1[1]]]; else mid=[[p1[0],p2[1]]];
  const pts=[[a.x,a.y],p1,...mid,p2,[b.x,b.y]], out=[];
  pts.forEach(p=>{ const l=out[out.length-1]; if(l&&l[0]===p[0]&&l[1]===p[1]) return; const l2=out[out.length-2];
    if(l&&l2&&((l2[0]===l[0]&&l[0]===p[0])||(l2[1]===l[1]&&l[1]===p[1]))) out.pop(); out.push(p); });
  return out; }

/* ---------------- Квайн — Мак-Класки с безразличными наборами ---------------- */
function qm(n,ones,dcs){ const pc=x=>{let c=0;while(x){c+=x&1;x>>=1;}return c;};
  if(!ones.length) return {zero:true,terms:[]}; if(ones.length+dcs.length===(1<<n)) return {one:true,terms:[{v:0,m:(1<<n)-1}]};
  let cur=[...ones,...dcs].map(v=>({v,m:0})), primes=[], seen=new Set();
  while(cur.length){ const next=[], used=new Set(), keys=new Set();
    for(let i=0;i<cur.length;i++) for(let j=i+1;j<cur.length;j++){ const a=cur[i],b=cur[j]; if(a.m!==b.m) continue; const d=a.v^b.v; if(pc(d)!==1) continue;
      used.add(i); used.add(j); const nv={v:a.v&~d,m:a.m|d}, k=nv.v+'/'+nv.m; if(!keys.has(k)){ keys.add(k); next.push(nv); } }
    cur.forEach((x,i)=>{ if(!used.has(i)){ const k=x.v+'/'+x.m; if(!seen.has(k)){ seen.add(k); primes.push(x); } } }); cur=next; }
  const cov=(p,t)=>((t&~p.m)===p.v); let best=null; const lits=s=>s.reduce((a,p)=>a+n-pc(p.m),0);
  (function rec(rest,ch){ if(best&&ch.length>best.length) return; if(!rest.length){ if(!best||ch.length<best.length||(ch.length===best.length&&lits(ch)<lits(best))) best=ch.slice(); return; }
    for(const p of primes.filter(p=>cov(p,rest[0]))){ ch.push(p); rec(rest.filter(x=>!cov(p,x)),ch); ch.pop(); } })(ones.slice(),[]);
  return {terms:best}; }
const termStr=(t,names)=>{ const n=names.length, a=[]; for(let i=0;i<n;i++){ const b=1<<(n-1-i); if(t.m&b) continue; a.push((t.v&b)?names[i]:names[i]+"'"); } return a.join('')||'1'; };
const termExpr=(t,names)=>{ const n=names.length, a=[]; for(let i=0;i<n;i++){ const b=1<<(n-1-i); if(t.m&b) continue; a.push((t.v&b)?names[i]:'!'+names[i]); } return a.join('*')||'1'; };

/* ---------------- стили: окно EWB 5.12 (как на Windows 10/11) ---------------- */
const css=`
.ews{color-scheme:light;position:relative;outline:none;--f:#f0f0f0;--hi:#fff;--sh:#a0a0a0;--dk:#696969;color:#000}
.ews .ew{border:1px solid #6f6f6f;background:var(--f);font:12px "Segoe UI",Tahoma,Arial,sans-serif;color:#000;display:flex;flex-direction:column;height:var(--ews-h,620px);position:relative;user-select:none;box-shadow:0 2px 10px #0004}
.ews .ew.max{position:fixed;inset:0;z-index:2000;height:auto!important;border:0}
.ews .ew.min{height:auto!important}.ews .ew.min>:not(.e-title){display:none}
.ews .e-title{display:flex;align-items:center;gap:6px;height:30px;padding-left:6px;background:#fff;font:12px "Segoe UI",Arial;flex:none}
.ews .e-title .ttl{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ews .e-title .cb{width:44px;height:30px;display:flex;align-items:center;justify-content:center;cursor:default}
.ews .e-title .cb:hover{background:#e5e5e5}.ews .e-title .cb.x:hover{background:#e81123}.ews .e-title .cb.x:hover svg path{stroke:#fff}
.ews .e-title .cb svg{width:10px;height:10px}
.ews .e-menu{display:flex;background:#fff;flex:none;border-bottom:1px solid #e3e3e3}
.ews .e-menu>span{padding:3px 7px;cursor:default}
.ews .e-menu>span:hover,.ews .e-menu>span.open{background:#cce8ff;box-shadow:inset 0 0 0 1px #99d1ff}
.ews u{text-decoration:none}.ews.alt u,.ews .mdrop u{text-decoration:underline}
.ews .mdrop{position:absolute;z-index:60;background:#f2f2f2;border:1px solid #a0a0a0;box-shadow:2px 2px 3px #0005;padding:2px;min-width:200px;font:12px "Segoe UI",Arial}
.ews .mdrop .mi{display:flex;gap:28px;justify-content:space-between;padding:3px 10px 3px 26px;cursor:default;white-space:nowrap;position:relative;border:1px solid transparent}
.ews .mdrop .mi:hover{background:#91c9f7;border-color:#91c9f7}
.ews .mdrop .mi.dis{color:#6d6d6d}.ews .mdrop .mi.dis:hover{background:#e5e5e5;border-color:#e5e5e5}
.ews .mdrop .mi.chk::before{content:"✓";position:absolute;left:8px}
.ews .mdrop .sep{height:1px;background:#d7d7d7;margin:3px 2px 3px 26px}
.ews .e-tb{display:flex;gap:6px;padding:2px 4px 3px;background:var(--f);flex:none;border-bottom:1px solid #a0a0a0}
.ews .e-tb .rows{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ews .e-tb .row{display:flex;align-items:center;gap:1px;flex-wrap:wrap}
.ews .e-tb .gap{width:8px}
.ews .tb{width:27px;height:27px;display:inline-flex;align-items:center;justify-content:center;background:var(--f);border:1px solid;border-color:var(--hi) var(--dk) var(--dk) var(--hi);box-shadow:inset -1px -1px 0 var(--sh);cursor:default;position:relative;padding:0;box-sizing:border-box}
.ews .tb svg{width:22px;height:22px}
.ews .tb.dis svg{filter:grayscale(1) opacity(.35)}
.ews .tb:not(.dis):active,.ews .tb.on{border-color:var(--dk) var(--hi) var(--hi) var(--dk);box-shadow:inset 1px 1px 0 var(--sh);background:#e6e6e6}
.ews .tb.on svg,.ews .tb:not(.dis):active svg{transform:translate(1px,1px)}
.ews .binb{height:29px;width:27px;flex-direction:column;justify-content:flex-start;padding-top:1px}
.ews .binb svg{width:20px;height:20px}
.ews .binb::after{content:"";border:4px solid transparent;border-top:4px solid #0a64d8;border-bottom:0;margin-top:1px}
.ews .zsel{height:21px;font:700 12px Arial;border:1px solid #7a7a7a;background:#fff;color:#000;margin:0 4px;width:74px;padding:0 2px}
.ews .pwr{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:4px;padding:1px 4px 0}
.ews .pw{width:40px;height:23px;border:1px solid #000;background:#fff;display:flex;padding:0;cursor:default;position:relative;box-shadow:1px 1px 0 #000}
.ews .pw span{flex:1;font:700 11px Arial;display:flex;align-items:center;justify-content:center;color:#000}
.ews .pw span:first-child::before{content:"";width:8px;height:8px;border:1px solid #000;border-radius:50%}
.ews .pw span:last-child::before{content:"";width:1.5px;height:10px;background:#000}
.ews .pw i{position:absolute;top:1px;bottom:1px;left:20px;width:17px;background:linear-gradient(90deg,#fff,#cfcfcf);border:1px solid #000;transform:skewY(-12deg);transition:left .12s}
.ews .pw.on i{left:1px;transform:skewY(12deg)}
.ews .pause{font:10px Arial;border:1px solid #000;padding:2px 6px;background:#fff;box-shadow:inset -1px -1px 0 #888,1px 1px 0 #000;cursor:default}
.ews .pause.on{background:#5a5a5a;color:#fff;box-shadow:inset 1px 1px 0 #000}
.ews .pause.dis{color:#999}
.ews .e-mdi{flex:1;min-height:0;position:relative;background:#ababab;display:flex;flex-direction:column;overflow:hidden}
.ews .e-child{flex:1;min-height:0;display:flex;flex-direction:column;background:#fff;border:1px solid #6d8fc0}
.ews .e-ct{height:22px;flex:none;display:flex;align-items:center;padding:0 6px;font:12px "Segoe UI",Arial;background:linear-gradient(#bcd2ec,#d9e6f5);color:#000;border-bottom:1px solid #9ab}
.ews .e-ct.ina{color:#7a8899}
.ews .e-canvas{flex:1;min-height:0;overflow:scroll;background:#fff;position:relative;touch-action:none;cursor:default}
.ews .e-canvas.placing{cursor:copy}
.ews .e-canvas::-webkit-scrollbar{width:17px;height:17px;background:#f0f0f0}
.ews .e-canvas::-webkit-scrollbar-thumb{background:#cdcdcd;border:4px solid #f0f0f0}
.ews .e-canvas::-webkit-scrollbar-thumb:hover{background:#a6a6a6}
.ews .e-status{display:flex;flex:none;background:var(--f);border-top:1px solid #d0d0d0;font:12px "Segoe UI",Arial;height:21px}
.ews .e-status span{border-right:1px solid #c0c0c0;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ews .e-status .s1{flex:0 0 160px}.ews .e-status .s2{flex:0 0 90px}.ews .e-status .s3{flex:0 0 120px}.ews .e-status .s4{flex:1;border:0}
.ews svg.ewbsvg{max-width:none;height:auto}
.ews .ewbsvg .lb{fill:#4848f0}.ews .ewbsvg .rid{fill:#000;font-size:9.5px}
.ews .ewbsvg .wire{stroke-width:1}
.ews .ewbsvg .wire.w1{stroke:#e8000b;stroke-width:1.6}.ews .ewbsvg .wire.w0{stroke:#1a5fd0;stroke-width:1.2}
.ews .ewbsvg .wire.sel{stroke:#e00;stroke-width:1.6}
.ews .ewbsvg .wire.tmp{stroke:#000;stroke-dasharray:4 3}
.ews .cmp.sel .ld,.ews .cmp.sel .ln,.ews .cmp.sel .bd,.ews .cmp.sel .lv{stroke:#e00}.ews .cmp.sel text{fill:#e00}
.ews .pin{fill:transparent;stroke:none;cursor:pointer}
.ews .pin:hover,.ews.wiring .pin:hover{fill:#000;fill-opacity:1}
.ews .pin.hot{fill:#e8000b}
.ews .wh{fill:none;stroke:transparent;stroke-width:9;cursor:pointer}
.ews .cmp{cursor:default}
.ews.run .cmp[data-t=sw]{cursor:pointer}
.ews .band{fill:none;stroke:#000;stroke-dasharray:3 2}
.ews .floating{fill:#ff9800}
.ews .fw{position:absolute;z-index:20;background:var(--f);border:1px solid #8a8a8a;box-shadow:2px 3px 8px #0005;display:flex;flex-direction:column;min-width:120px}
.ews .fw.act{z-index:25;border-color:#5a5a5a}
.ews .fw .ft{display:flex;align-items:center;gap:5px;height:23px;padding-left:5px;background:#fff;font:12px "Segoe UI",Arial;cursor:default;touch-action:none}
.ews .fw:not(.act) .ft{color:#888}
.ews .fw .ft .ic{width:14px;height:11px;border:1px solid #555;background:linear-gradient(#fff 3px,#2f6fd0 3px)}
.ews .fw .ft span{flex:1;white-space:nowrap}
.ews .fw .ft .x{width:30px;height:21px;display:flex;align-items:center;justify-content:center}
.ews .fw .ft .x:hover{background:#e81123}.ews .fw .ft .x:hover svg path{stroke:#fff}
.ews .fw .ft .x svg{width:9px;height:9px}
.ews .fw .fb{padding:3px;overflow:auto}
.ews .bin .fb{display:flex;flex-direction:column;gap:2px;padding:3px 4px 4px}
.ews .bin .brow{display:flex;gap:1px;flex-wrap:wrap}
.ews .bin .tb.na svg{opacity:.85}
.ews .bin .tb.used svg{filter:grayscale(1) opacity(.3)}
.ews .bin .tb.on{background:#fff3bf}
.ews .bin .empty{font-size:11px;color:#444;padding:4px 6px;max-width:260px;white-space:normal}
.ews .tip{position:absolute;z-index:90;background:#ffffe1;border:1px solid #000;padding:1px 4px;font:11px "Segoe UI",Tahoma;white-space:nowrap;pointer-events:none;box-shadow:1px 1px 2px #0004}
.ews .wbtn{font:11px "Segoe UI",Tahoma,Arial;background:#e1e1e1;border:1px solid #adadad;padding:2px 8px;cursor:default;color:#000;min-height:21px}
.ews .wbtn:hover{background:#e5f1fb;border-color:#0078d7}
.ews .wbtn:active,.ews .wbtn.on{background:#cce4f7;border-color:#005499}
.ews .wbtn.dk{background:#6b6b6b;color:#fff;border-color:#333}
.ews .wbtn:disabled{color:#a0a0a0;background:#ececec;border-color:#d0d0d0}
.ews input.wi,.ews select.wi{font:11px "Segoe UI",Tahoma;background:#fff;color:#000;border:1px solid #7a7a7a;padding:1px 3px;height:19px;box-sizing:border-box}
.ews fieldset{border:1px solid #c8c8c8;margin:0;padding:3px 5px 5px;font:11px "Segoe UI",Tahoma}
.ews legend{padding:0 2px}
.ews .lcw{width:404px;font:11px "Segoe UI",Tahoma}
.ews .lcw .top{display:flex;align-items:flex-end;gap:2px;padding:2px 4px 3px 26px}
.ews .lcw .top .v{display:flex;flex-direction:column;align-items:center;font:10px Arial;width:16px;cursor:pointer}
.ews .lcw .top .v i{width:12px;height:12px;border:1px solid #000;border-radius:50%;background:#fff;display:block}
.ews .lcw .top .v.on i{background:#3a3a3a}
.ews .lcw .top .out{margin-left:auto;display:flex;align-items:center;gap:4px;font:10px Arial}
.ews .lcw .top .out i{width:11px;height:11px;border:1px solid #888;border-radius:50%;background:radial-gradient(#888 35%,#fff 40%)}
.ews .lcw .mid{display:flex;gap:6px}
.ews .lct{flex:1;height:148px;background:#fff;border:1px solid #7a7a7a;overflow-y:scroll;font:10px "Courier New",monospace;line-height:12px}
.ews .lct .r{display:flex;cursor:default}
.ews .lct .r>b{font-weight:400;width:30px;border-right:1px solid #000;padding-left:3px}
.ews .lct .r>em{font-style:normal;flex:1;padding-left:10px;letter-spacing:6px}
.ews .lct .r>s{text-decoration:none;width:24px;border-left:1px solid #000;text-align:center;cursor:pointer}
.ews .lct .r>s:hover{background:#cce8ff}
.ews .lcc{width:126px;border:1px solid #c8c8c8;padding:2px 3px;display:flex;flex-direction:column;gap:2px}
.ews .lcc .h{text-align:center;padding:1px 0 2px}
.ews .lcc .wbtn{display:flex;align-items:center;justify-content:space-between;padding:1px 4px;font:700 9px Arial;height:19px}
.ews .lcc .wbtn svg{height:11px;width:auto}
.ews .lcin{width:100%;margin-top:4px;font:11px "Courier New",monospace;height:20px}
.ews .lcmsg{font:11px "Segoe UI",Tahoma;margin-top:3px;min-height:15px;color:#202060;white-space:normal}
.ews .wgw{display:grid;grid-template-columns:62px 1fr;gap:4px;width:300px;font:11px "Segoe UI",Tahoma}
.ews .wgl{grid-row:span 2;height:196px;background:#fff;border:1px solid #7a7a7a;overflow-y:scroll;font:11px "Courier New",monospace;line-height:13px;padding:1px 0}
.ews .wgl div{padding:0 3px;cursor:default}.ews .wgl div.cur{background:#000;color:#fff}.ews .wgl div.ed{outline:1px dotted #000}.ews .wgl div.bp::after{content:"•";color:#e00}
.ews .wgl input{width:40px;font:11px "Courier New",monospace;border:0;padding:0;background:#ffffcc;color:#000}
.ews input[type=radio],.ews input[type=checkbox]{accent-color:#0078d7;margin:0}
.ews .wgg{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.ews .wgg .ad{display:grid;grid-template-columns:auto 44px;gap:2px 4px;align-items:center}
.ews .wgg .ad input{width:44px}
.ews .wgg .bt{display:flex;flex-direction:column;gap:2px}
.ews .wgg .bt .wbtn{padding:0 4px;min-height:17px}
.ews .wgw .wide{grid-column:2}
.ews .wgw .row{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.ews .wgw .bits{grid-column:1/-1;display:flex;gap:2px;justify-content:center;padding-top:2px}
.ews .bits i{width:12px;height:12px;border:1px solid #000;border-radius:50%;background:#fff;font:7px Arial;display:flex;align-items:center;justify-content:center;font-style:normal}
.ews .bits i.on{background:#e00;color:#fff}
.ews .law{width:470px;font:11px "Segoe UI",Tahoma}
.ews .law .scr{display:flex;border:1px solid #7a7a7a;background:#fff}
.ews .law .chs{display:flex;flex-direction:column;background:var(--f);padding:3px 2px;gap:0}
.ews .law .chs i{width:12px;height:12px;margin:1px 0;border:1px solid #000;border-radius:50%;background:#fff;font:7px Arial;display:flex;align-items:center;justify-content:center;font-style:normal}
.ews .law .chs i.c{background:#fff;font-weight:700}.ews .law .chs i.on{background:#3a3a3a;color:#fff}
.ews .law .plot{flex:1;overflow-x:scroll;position:relative}
.ews .law .bot{display:grid;grid-template-columns:auto 1fr auto auto;gap:6px;margin-top:4px;align-items:stretch}
.ews .law .tv{background:#fff;border:1px solid #7a7a7a;font:10px "Courier New",monospace;padding:2px 4px;min-width:88px;line-height:13px}
.ews .edlg{position:absolute;inset:0;z-index:80;display:flex;align-items:flex-start;justify-content:center;padding-top:60px;background:#0000}
.ews .edlg>.dw{background:#f0f0f0;border:1px solid #888;box-shadow:0 4px 18px #0006;min-width:300px;max-width:min(560px,94%);font:12px "Segoe UI",Tahoma,Arial;color:#000}
.ews .edlg .dt{display:flex;align-items:center;height:30px;padding-left:10px;background:#fff}
.ews .edlg .dt span{flex:1}
.ews .edlg .dt .x{width:44px;height:30px;display:flex;align-items:center;justify-content:center}
.ews .edlg .dt .x:hover{background:#e81123}.ews .edlg .dt .x:hover svg path{stroke:#fff}
.ews .edlg .dt .x svg{width:10px;height:10px}
.ews .edlg .db{padding:12px;display:grid;gap:8px;max-height:62vh;overflow:auto;user-select:text}
.ews .edlg label.f{display:grid;grid-template-columns:140px 1fr;gap:8px;align-items:center}
.ews .edlg input:not([type=checkbox]):not([type=radio]),.ews .edlg select,.ews .edlg textarea{font:12px "Segoe UI",Tahoma;background:#fff;color:#000;border:1px solid #7a7a7a;padding:2px 4px}
.ews .edlg textarea{min-height:80px;font-family:Consolas,monospace}
.ews .edlg .df{display:flex;justify-content:flex-end;gap:8px;padding:0 12px 12px}
.ews .edlg .df .wbtn{min-width:75px;min-height:23px}
.ews .edlg .msg{display:flex;gap:12px;align-items:flex-start;line-height:1.45;max-width:440px}
.ews .edlg .msg svg{flex:none;width:32px;height:32px}
.ews .edlg .help{line-height:1.5;font-size:12.5px}.ews .edlg .help b{color:#0a246a}
.ews .ptabs{display:flex;gap:0;margin-bottom:-1px;position:relative;z-index:1;flex-wrap:wrap}
.ews .ptabs span{padding:3px 9px;border:1px solid #d9d9d9;border-bottom:0;background:#f0f0f0;cursor:default;margin-top:2px}
.ews .ptabs span.on{background:#fff;border-color:#d9d9d9;margin-top:0;padding-bottom:5px}
.ews .tabp{border:1px solid #d9d9d9;background:#fff;padding:12px;display:grid;gap:8px;min-height:150px;align-content:start}
.ews .mlist{height:150px;overflow-y:auto;background:#fff;border:1px solid #7a7a7a;font:12px "Segoe UI",Tahoma}
.ews .mlist div{padding:1px 4px;cursor:default;display:flex;gap:10px}.ews .mlist div b{font-weight:400;width:52px}
.ews .mlist div.on{background:#0078d7;color:#fff}
.ews .task{border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:10px 12px;margin-bottom:8px;color:var(--ink)}
.ews .task .tt{font:700 15px var(--f-body);margin-bottom:4px}
.ews .task .tx{font-size:14.5px;line-height:1.5}
.ews .task .tb2{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.ews .task .res{margin-top:8px;font-size:14px;border-radius:8px;padding:8px 10px}
.ews .task .res.ok{background:var(--ok-bg);color:var(--ok)}
.ews .task .res.bad{background:var(--bad-bg);color:var(--bad)}
.ews .task .res table{border-collapse:collapse;margin-top:6px;font:12.5px var(--f-mono,monospace);color:var(--ink)}
.ews .task .res td,.ews .task .res th{border:1px solid var(--line);padding:2px 6px;text-align:center}
.ews .task .res td.x{background:var(--bad-bg);color:var(--bad);font-weight:700}
.ewbt-list,.ewb-go{display:flex;flex-wrap:wrap;gap:6px}.ewb-go{margin:4px 0 16px}.ewbt-h{margin-top:22px}.ewbtab-intro{font-size:15px;line-height:1.5;margin:0 0 10px;max-width:900px}
.ews .ews-foot{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}
.ews .ews-foot .hint{font-size:12.5px;color:var(--muted)}
@media (max-width:760px){.ews .e-tb .gap{width:3px}.ews .e-status .s2,.ews .e-status .s3{display:none}.ews .lcw,.ews .law{width:min(404px,calc(100vw - 40px))}}
`;
function addCss(){ if(document.getElementById('ews-css')) return; const s=document.createElement('style'); s.id='ews-css'; s.textContent=css; document.head.appendChild(s); }

/* значки панели инструментов (как в EWB 5.12) */
const XI='<svg viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="#000" stroke-width="1.1"/></svg>';
const ICON={
  new:I('<path d="M5 2h10l4 4v16H5z" fill="#fff" stroke="#000"/><path d="M15 2v4h4" fill="none" stroke="#000"/>'),
  open:I('<path d="M2 5h6l2 2h8v3H6L2 20z" fill="#e8c860" stroke="#000"/><path d="M2 20l4-10h17l-4 10z" fill="#f6e08a" stroke="#000"/>'),
  save:I('<rect x="3" y="3" width="18" height="18" fill="#222"/><rect x="6" y="3" width="12" height="7" fill="#fff"/><rect x="14" y="4" width="2.5" height="5" fill="#222"/><rect x="6" y="14" width="12" height="7" fill="#aaa"/>'),
  print:I('<rect x="6" y="2" width="12" height="7" fill="#fff" stroke="#000"/><path d="M3 9h18l-2 9H5z" fill="#c8c8c8" stroke="#000"/><path d="M5 18l-1 4h16l-1-4" fill="#fff" stroke="#000"/><path d="M6 13h12" stroke="#000"/>'),
  cut:I('<circle cx="8" cy="18" r="2.6" fill="none" stroke="#000" stroke-width="1.3"/><circle cx="16" cy="18" r="2.6" fill="none" stroke="#000" stroke-width="1.3"/><path d="M9.5 16L16 3M14.5 16L8 3" stroke="#000" stroke-width="1.3"/>'),
  copy:I('<path d="M3 3h8l3 3v11H3z" fill="#fff" stroke="#000"/><path d="M10 8h8l3 3v11H10z" fill="#fff" stroke="#000"/><path d="M12 13h6M12 16h7M12 19h7" stroke="#447"/>'),
  paste:I('<rect x="3" y="4" width="13" height="17" fill="#c89a3a" stroke="#000"/><rect x="7" y="2" width="5" height="4" fill="#ccc" stroke="#000"/><path d="M10 9h8l3 3v10H10z" fill="#fff" stroke="#000"/><path d="M12 14h7M12 17h7" stroke="#447"/>'),
  rot:I('<path d="M3 20h12L3 8z" fill="#fff" stroke="#000"/><path d="M15 6a6 6 0 016 6" fill="none" stroke="#c00" stroke-width="1.6"/><path d="M19 12l2 3 2-3z" fill="#c00"/>'),
  fliph:I('<path d="M11 19H3l8-12z" fill="#c00" stroke="#000"/><path d="M13 19h8l-8-12z" fill="#fff" stroke="#000"/><path d="M12 3v19" stroke="#000" stroke-dasharray="2 1.5"/>'),
  flipv:I('<path d="M20 11V3L6 11z" fill="#c00" stroke="#000"/><path d="M20 13v8L6 13z" fill="#fff" stroke="#000"/><path d="M3 12h19" stroke="#000" stroke-dasharray="2 1.5"/>'),
  sub:I('<rect x="6" y="8" width="12" height="9" fill="#fff" stroke="#000"/><path d="M2 12.5h4M18 12.5h4M12 3v5" stroke="#000"/><text x="12" y="15.5" text-anchor="middle" style="font:700 6px Arial">SC</text>'),
  graph:I('<rect x="2" y="2" width="20" height="20" fill="#fff" stroke="#000"/><path d="M4 4v16h16" fill="none" stroke="#000"/><path d="M5 19q4 0 6-12q2 12 8 12" fill="none" stroke="#e00" stroke-width="1.4"/>'),
  prop:I('<path d="M4 4h12v16H4z" fill="#fff" stroke="#000"/><path d="M6 8h8M6 11h8M6 14h5" stroke="#000"/><path d="M13 21l1-4 8-9 2 2-8 9z" fill="#c8c8c8" stroke="#000"/><path d="M18 4l2 3" stroke="#000"/>'),
  zout:I('<circle cx="10" cy="10" r="6.5" fill="#fff" stroke="#000" stroke-width="1.4"/><path d="M15 15l6 6" stroke="#000" stroke-width="2.6"/><path d="M7 10h6" stroke="#000" stroke-width="1.5"/>'),
  zin:I('<circle cx="10" cy="10" r="6.5" fill="#fff" stroke="#000" stroke-width="1.4"/><path d="M15 15l6 6" stroke="#000" stroke-width="2.6"/><path d="M7 10h6M10 7v6" stroke="#000" stroke-width="1.5"/>'),
  help:I('<text x="12" y="20" text-anchor="middle" style="font:900 19px Arial;fill:#1a1aa0">?</text>'),
  info:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1f6fd1"/><rect x="14.3" y="13" width="3.4" height="11" fill="#fff"/><circle cx="16" cy="9" r="2" fill="#fff"/></svg>',
  warn:'<svg viewBox="0 0 32 32"><path d="M16 2l15 27H1z" fill="#fcd116" stroke="#b08a00"/><rect x="14.4" y="11" width="3.2" height="10" fill="#000"/><circle cx="16" cy="25" r="1.8"/></svg>',
  err:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#d81e1e"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3"/></svg>',
  ask:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1f6fd1"/><text x="16" y="23" text-anchor="middle" style="font:700 19px Arial;fill:#fff">?</text></svg>'};
const MENUS=['File','Edit','Circuit','Analysis','Window','Help'], ZOOMS=[50,66,75,80,100,125,150,200,300];
const amp=s=>esc(s).replace(/&amp;(.)/,'<u>$1</u>');
const hex4=v=>(v>>>0).toString(16).toUpperCase().padStart(4,'0');
const fmtT=t=>t<1000?(t).toFixed(2)+' ms':(t/1000).toFixed(2)+' s';
/* подсказки строки состояния — тексты из ресурсов EWB 5.12 */
const HINT={new:'Clear the circuit window',open:'Load circuit from file',save:'Save circuit to file',saveas:'Save circuit as file',revert:'Revert to last saved state',import:'Import SPICE Netlist from file',export:'Export Circuit to SPICE Netlist',print:'Print parts of the circuit',psetup:'Setup printing parameters',exit:'Exit Electronics Workbench',install:'Install add-in modules',
  undo:'Undo changes',cut:'Cut to Clipboard',copy:'Copy to Clipboard',paste:'Paste from clipboard',del:'Delete selected items',all:'Select all items in circuit window',bmp:'Copy selected area as a bitmap',clip:'Show contents of clipboard',
  rot:'Rotate selected item(s) clockwise',fliph:'Flip selected item(s) horizontally',flipv:'Flip selected item(s) vertically',prop:'Display/Set component properties...',sub:'Create a subcircuit using selected components',zin:'Zoom in on the circuit',zout:'Zoom out on the circuit',sopt:'View/Set Schematic Options',restr:'Display/Set restrictions on circuit',
  power:'Activate simulation',pause:'Pause simulation',stop:'Stop simulation',aopt:'Display/Set analysis options',graph:'Display Graphs generated by analysis',
  a_dc:'Perform DC Operating Point Analysis',a_ac:'Perform AC Frequency Analysis',a_tr:'Perform Transient Analysis',a_fo:'Perform Fourier Analysis',a_no:'Perform Noise Analysis',a_di:'Perform Distortion Analysis',a_ps:'Perform Parameter Sweep Analysis',a_ts:'Perform Temperature Sweep Analysis',a_pz:'Perform Pole-Zero Analysis',a_tf:'Perform Transfer Function Analysis',a_se:'Perform Sensitivity Analysis',a_wc:'Perform Worst Case Analysis',a_mc:'Perform Monte Carlo Analysis',
  arrange:'Arrange Windows',circ:'Circuit',desc:'Circuit Description',help:'Get Some General Help',hidx:'Help by index',rel:'Release Notes',about:'About Electronics Workbench',wprop:'Display/Set wire properties',addtext:'Add text component here',shelf:'Return the instrument to the Parts Bin',open_i:'Open the instrument'};
const ANALYSES=[['a_dc','&DC Operating Point'],['a_ac','A&C Frequency...'],['a_tr','&Transient...'],['a_fo','&Fourier...'],['a_no','&Noise...'],['a_di','D&istortion...'],['a_ps','&Parameter Sweep...'],['a_ts','T&emperature Sweep...'],['a_pz','Pole-&Zero...'],['a_tf','Transfer F&unction...'],['a_se','&Sensitivity...'],['a_wc','&Worst Case...'],['a_mc','&Monte Carlo...']];
/* ---------------- студия ---------------- */
let UID=0;
class Studio{
  constructor(el,opt={}){ addCss(); this.el=el; this.opt=opt; this.key=opt.storageKey||'ewbs:auto'; this.zp=80; this.zoom=1; this.uid=++UID;
    this.comps=[]; this.wires=[]; this.sel=new Set(); this.selW=-1; this.undoS=[]; this.redoS=[]; this.clip=null; this.desc='';
    this.power=false; this.paused=false; this.t=0; this.hist=[]; this.file='Untitled.ewb'; this.wins={}; this.bins={}; this.zTop=30;
    this.so={grid:false,labels:true,rid:false,lv:false}; try{ Object.assign(this.so,JSON.parse(localStorage.getItem('ewbs:so')||'{}')); }catch(_){}
    this.colorLv=this.so.lv;
    this.build(); let loaded=false;
    if(opt.circuit){ this.loadCirc(opt.circuit); loaded=true; }
    else if(!opt.task){ try{ const s=localStorage.getItem(this.key); if(s){ this.loadCirc(JSON.parse(s),true); loaded=true; } }catch(_){} }
    if(opt.task) this.setTask(opt.task);
    else if(!loaded) this.loadCirc(DEMO());
    this.saved=JSON.stringify(this.dump()); // «Save changes?» спрашиваем только если схему меняли
  }
  /* ---------- окно программы ---------- */
  build(){ const o=this.opt;
    this.el.classList.add('ews'); this.el.tabIndex=0; if(o.height) this.el.style.setProperty('--ews-h',o.height+'px');
    const tb=(k,tip,dis)=>`<span class="tb${dis?' dis':''}" data-tb="${k}" data-tip="${tip}" data-hint="${esc(HINT[k]||tip)}" role="button" aria-label="${tip}">${ICON[k]}</span>`;
    const R1=[['new','New'],['open','Open'],['save','Save'],['print','Print'],0,['cut','Cut'],['copy','Copy'],['paste','Paste'],0,['rot','Rotate'],['fliph','Flip Horizontal'],['flipv','Flip Vertical'],['sub','Create Subcircuit'],['graph','Display Graphs'],0,['prop','Component Properties'],0,['zout','Zoom Out'],['zin','Zoom In'],'z',0,['help','Help']];
    const appIco='<svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="2" width="11" height="8" fill="#2a50b8"/><path d="M2 6h3l1-2 2 4 1-2h2" fill="none" stroke="#fff" stroke-width="1"/><circle cx="10" cy="11" r="4" fill="#e00"/><circle cx="9" cy="10" r="1.2" fill="#fff" opacity=".7"/></svg>';
    this.el.innerHTML=`${o.task?'<div class="task"></div>':''}<div class="ew">
      <div class="e-title">${appIco}<span class="ttl">Electronics Workbench</span><span class="cb" data-cb="min" title="Свернуть"><svg viewBox="0 0 10 10"><path d="M0 5.5h10" stroke="#000"/></svg></span><span class="cb" data-cb="max" title="Развернуть на весь экран"><svg viewBox="0 0 10 10"><path d="M.5 .5h9v9h-9z" fill="none" stroke="#000"/></svg></span><span class="cb x" data-cb="close" title="Закрыть">${XI}</span></div>
      <div class="e-menu">${MENUS.map(m=>`<span data-menu="${m}">${amp(m.replace(/^./,'&$&'))}</span>`).join('')}</div>
      <div class="e-tb"><div class="rows"><div class="row r1">${R1.map(x=>x===0?'<span class="gap"></span>':x==='z'?`<select class="zsel" data-tip="Zoom" data-hint="Zoom in on the circuit" aria-label="Zoom">${ZOOMS.map(z=>`<option value="${z}"${z===80?' selected':''}>${z}%</option>`).join('')}</select>`:tb(x[0],x[1])).join('')}</div>
        <div class="row r2">${BINS.map(b=>`${BIN_GAP[b.k]?'<span class="gap"></span>':''}<span class="tb binb" data-bin="${b.k}" data-tip="${b.t}" data-hint="Parts Bins: ${b.t}" role="button" aria-label="${b.t}">${BIN_ICON[b.k]}</span>`).join('')}</div></div>
        <div class="pwr"><button class="pw" data-a="power" data-tip="Activate/Stop simulation" data-hint="Activate simulation (Ctrl+G)" aria-label="Питание O/I"><span></span><span></span><i></i></button><span class="pause dis" data-a="pause" role="button" data-tip="Pause/Resume simulation (F9)" data-hint="Pause simulation">Pause</span></div></div>
      <div class="e-mdi"><div class="e-child"><div class="e-ct">Untitled</div><div class="e-canvas"></div></div></div>
      <div class="e-status"><span class="s1">Ready</span><span class="s2"></span><span class="s3">Temp:&nbsp; 27</span><span class="s4"></span></div></div>
      <div class="ews-foot"><span class="hint">Как в EWB: открой полку деталей кнопкой во 2-м ряду и перетащи деталь на схему · провод — тяни от вывода к выводу · двойной щелчок — свойства (у прибора — его окно) · правая кнопка — меню · питание O/I справа вверху · Help → Help — подробная справка.</span></div>
      <input type="file" accept=".ewbs,.json,.dp,.txt,application/json" hidden>`;
    const $=s=>this.el.querySelector(s);
    this.ew=$('.ew'); this.cv=$('.e-canvas'); this.mdi=$('.e-mdi'); this.st1=$('.s1'); this.st2=$('.s2'); this.st4=$('.s4'); this.ct=$('.e-ct'); this.fin=$('input[type=file]'); this.taskBox=$('.task'); this.mbar=$('.e-menu');
    this.mbar.addEventListener('pointerdown',e=>{ const m=e.target.closest('[data-menu]'); if(!m) return; e.preventDefault(); if(this.menuSpan===m) this.closeMenu(); else this.openMenu(m); });
    this.mbar.addEventListener('pointerover',e=>{ const m=e.target.closest('[data-menu]'); if(m&&this.menu&&this.menuSpan!==m&&!this.ctxOpen) this.openMenu(m); });
    $('.e-title').addEventListener('click',e=>{ const b=e.target.closest('[data-cb]'); if(b) this.cmd(b.dataset.cb); });
    $('.e-title').addEventListener('dblclick',e=>{ if(!e.target.closest('[data-cb]')) this.cmd('max'); });
    $('.e-tb').addEventListener('click',e=>{ const b=e.target.closest('[data-tb]'); if(b&&!b.classList.contains('dis')) this.cmd(b.dataset.tb); const bn=e.target.closest('[data-bin]'); if(bn) this.toggleBin(bn.dataset.bin); const a=e.target.closest('[data-a]'); if(a) this.cmd(a.dataset.a); });
    $('.zsel').addEventListener('change',e=>{ this.zp=+e.target.value; this.zoom=this.zp/80; this.render(); this.el.focus({preventScroll:true}); });
    this.el.addEventListener('pointerover',e=>this.hover(e)); this.el.addEventListener('pointerout',e=>{ if(e.target.closest&&e.target.closest('[data-tip]')) this.hideTip(); });
    this.fin.addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return; const txt=await f.text(); e.target.value='';
      if(this.finCb){ const cb=this.finCb; this.finCb=null; return cb(txt,f.name); }
      try{ const j=JSON.parse(txt); this.snapshot(); this.loadCirc(j); this.file=f.name.replace(/\.ewbs$/,'.ewb'); this.saved=JSON.stringify(this.dump()); this.render(); }catch(err){ this.msg('Could not open file.<br>«'+esc(f.name)+'» — это не файл схемы этой программы (.ewbs).','err'); } });
    this.cv.addEventListener('pointerdown',e=>this.down(e));
    this.cv.addEventListener('dblclick',e=>{ const g=e.target.closest('[data-id]'); if(!g) return; const c=this.byId(g.dataset.id); if(INSTR.includes(c.type)) this.openWin(c); else this.props(c); });
    this.cv.addEventListener('contextmenu',e=>{ e.preventDefault(); this.ctxCanvas(e); });
    this.cv.addEventListener('scroll',()=>this.hideTip());
    this.mdi.addEventListener('pointerdown',e=>this.fwDown(e));
    this.mdi.addEventListener('click',e=>this.fwClick(e));
    this.mdi.addEventListener('input',e=>this.panInput(e)); this.mdi.addEventListener('change',e=>this.panInput(e,true));
    this.mdi.addEventListener('keydown',e=>{ if(e.target.closest('input,textarea,select')) e.stopPropagation(); });
    this.el.addEventListener('keydown',e=>this.key_(e)); this.el.addEventListener('keyup',e=>{ if(e.key==='Alt'){ e.preventDefault(); if(this.altOnly&&!this.menu){ this.openMenu(this.mbar.firstChild); } this.el.classList.remove('alt'); } });
    this.docDown=e=>{ if(!this.el.isConnected) return document.removeEventListener('pointerdown',this.docDown,true); if(this.menu&&!e.target.closest('.mdrop')&&!e.target.closest('[data-menu]')) this.closeMenu(); };
    document.addEventListener('pointerdown',this.docDown,true);
    this.timer=setInterval(()=>this.loop(),25);
  }
  /* ---------- подсказки и строка состояния ---------- */
  hover(e){ const t=e.target.closest&&e.target.closest('[data-tip],[data-hint]'); if(!t){ return; }
    if(t.dataset.hint) this.setHint(t.dataset.hint);
    if(t.dataset.tip){ clearTimeout(this.tipT); this.tipT=setTimeout(()=>{ if(!t.isConnected) return; this.hideTip(); const d=document.createElement('div'); d.className='tip'; d.textContent=t.dataset.tip;
      const r=t.getBoundingClientRect(), pr=this.el.getBoundingClientRect(); d.style.left=Math.max(0,Math.min(r.left-pr.left+6,pr.width-200))+'px'; d.style.top=(r.bottom-pr.top+4)+'px'; this.el.appendChild(d); this.tip=d; setTimeout(()=>{ if(this.tip===d) this.hideTip(); },4500); },450); } }
  hideTip(){ clearTimeout(this.tipT); if(this.tip){ this.tip.remove(); this.tip=null; } }
  setHint(h){ this.st1.textContent=h; clearTimeout(this.hintT); this.hintT=setTimeout(()=>{ this.st1.textContent='Ready'; },2500); }
  /* ---------- меню ---------- */
  openMenu(span){ this.closeMenu(); this.hideTip(); this.pastePt=null; span.classList.add('open'); const items=this.menuItems(span.dataset.menu);
    const r=span.getBoundingClientRect(), pr=this.ew.getBoundingClientRect(); this.menuSpan=span; this.showDrop(items,r.left-pr.left,r.bottom-pr.top); }
  showDrop(items,x,y){ const d=document.createElement('div'); d.className='mdrop'; this.menuList=items.filter(it=>it!=='-'); this.mIdx=-1;
    d.innerHTML=items.map(it=>it==='-'?'<div class="sep"></div>':`<div class="mi${it[3]?' dis':''}${it[4]?' chk':''}" data-mi="${it[0]}" data-hint="${esc(HINT[it[0]]||it[1].replace(/&/g,''))}"><span>${amp(it[1])}</span><span>${it[2]||''}</span></div>`).join('');
    this.ew.appendChild(d); const W_=this.ew.clientWidth; d.style.left=Math.max(0,Math.min(x,W_-d.offsetWidth-2))+'px'; d.style.top=y+'px'; this.menu=d;
    d.addEventListener('click',e=>{ const it=e.target.closest('[data-mi]'); if(!it||it.classList.contains('dis')) return; const k=it.dataset.mi, ctx=this.ctxData; this.closeMenu(); this.cmd(k,ctx); }); }
  closeMenu(){ if(this.menu){ this.menu.remove(); this.menu=null; } if(this.menuSpan){ this.menuSpan.classList.remove('open'); this.menuSpan=null; } this.ctxOpen=false; this.ctxData=null; }
  menuKey(e){ const k=e.key, its=[...this.menu.querySelectorAll('.mi')];
    if(k==='Escape'){ this.closeMenu(); return true; }
    if((k==='ArrowLeft'||k==='ArrowRight')&&this.menuSpan){ const all=[...this.mbar.children]; let i=all.indexOf(this.menuSpan)+(k==='ArrowRight'?1:-1); i=(i+all.length)%all.length; this.openMenu(all[i]); const f=this.menu.querySelector('.mi:not(.dis)'); if(f){ this.mIdx=its.length?0:-1; this.hl(); } return true; }
    if(k==='ArrowDown'||k==='ArrowUp'){ const n=its.length; let i=this.mIdx; for(let s=0;s<n;s++){ i=(i+(k==='ArrowDown'?1:-1)+n)%n; if(!its[i].classList.contains('dis')) break; } this.mIdx=i; this.hl(); return true; }
    if(k==='Enter'&&this.mIdx>=0){ its[this.mIdx].click(); return true; }
    if(k.length===1){ const it=its.find(x=>{ const u=x.querySelector('u'); return u&&u.textContent.toLowerCase()===k.toLowerCase()&&!x.classList.contains('dis'); }); if(it){ it.click(); return true; } }
    return false; }
  hl(){ [...this.menu.querySelectorAll('.mi')].forEach((x,i)=>{ x.style.background=i===this.mIdx?'#91c9f7':''; if(i===this.mIdx) this.setHint(x.dataset.hint); }); }
  ctxCanvas(e){ const g=e.target.closest('[data-id]'), wh=e.target.closest('[data-w]'); const pr=this.ew.getBoundingClientRect(); let items;
    if(g){ const c=this.byId(g.dataset.id); if(!this.sel.has(c.id)){ this.sel=new Set([c.id]); this.selW=-1; this.render(); }
      items= INSTR.includes(c.type)? [['open_i','&Open'],['help','&Help'],'-',['shelf','&Return to Shelf']] : [['help','&Help'],'-',['cut','Cu&t'],['copy','&Copy'],['paste','&Paste','',!this.clip],['del','&Delete'],'-',['rot','&Rotate'],['fliph','Flip &Horizontal'],['flipv','Flip &Vertical'],'-',['prop','Component &Properties...']]; this.ctxData=c.id; }
    else if(wh){ this.sel=new Set(); this.selW=+wh.dataset.w; this.render(); items=[['del','&Delete'],['wprop','Wire &Properties...']]; }
    else { const [x,y]=this.pt(e); this.ctxPt=[x,y]; this.pastePt=[x,y]; items=[['help','&Help'],'-',['paste','&Paste','',!this.clip],['all','Select &All'],'-',['addtext','Add &Text...'],['sopt','Schematic &Options...'],'-',['zin','Zoom &In'],['zout','Zoom &Out']]; }
    this.closeMenu(); const cd=this.ctxData; this.showDrop(items,e.clientX-pr.left,e.clientY-pr.top); this.ctxOpen=true; this.ctxData=cd; }
  /* ---------- диалоги и сообщения ---------- */
  dialog(title,body,onOk,info,opts={}){ this.closeMenu(); const d=document.createElement('div'); d.className='edlg';
    const btns=opts.buttons||(info?[['x','OK']]:[['ok','OK'],['x','Cancel']]);
    d.innerHTML=`<div class="dw" role="dialog" aria-label="${esc(title)}"${opts.w?` style="width:${opts.w}px"`:''}><div class="dt"><span>${esc(title)}</span><span class="x" data-d="x">${XI}</span></div><div class="db">${body}</div><div class="df">${btns.map(([k,t],i)=>`<button class="wbtn" data-d="${k}"${i===0?' autofocus':''}>${t}</button>`).join('')}</div></div>`;
    this.ew.appendChild(d); const f=d.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea')||d.querySelector('.df .wbtn'); if(f) setTimeout(()=>f.focus(),0);
    const close=()=>{ d.remove(); this.el.focus({preventScroll:true}); };
    const vals=()=>{ const v={}; d.querySelectorAll('[data-f]').forEach(x=>{ if(x.type==='radio'){ if(x.checked) v[x.dataset.f]=x.value; } else v[x.dataset.f]=x.type==='checkbox'?x.checked:x.value; }); return v; };
    const ok=k=>{ const v=vals(); close(); if(onOk) onOk(v,k); };
    if(opts.init) opts.init(d,close);
    d.addEventListener('click',e=>{ const b=e.target.closest('[data-d]'); if(!b) return; const k=b.dataset.d; if(k==='x'){ close(); if(opts.onCancel) opts.onCancel(); } else ok(k); });
    d.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Escape'){ close(); if(opts.onCancel) opts.onCancel(); } if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON'){ e.preventDefault(); if(info) close(); else ok(btns[0][0]); } });
    return d; }
  msg(text,icon='info',buttons,cb){ return this.dialog('Electronics Workbench',`<div class="msg">${ICON[icon]||ICON.info}<div>${text}</div></div>`,cb?((v,k)=>cb(k)):null,!buttons,{buttons}); }
  analog(name){ this.msg(`«${esc(name)}» — аналоговая часть Electronics Workbench.<br>В этой учебной копии моделируется только цифровая логика (уровни 0/1), как в лабах по архитектуре ЭВМ: вентили, триггеры, счётчики, шифраторы, мультиплексоры, сумматоры и приборы Word Generator, Logic Analyzer, Logic Converter.`,'info'); }
  /* ---------- плавающие окна (полки деталей и приборы) ---------- */
  mkWin(key,title,html,x,y,cls=''){ const w=document.createElement('div'); w.className='fw '+cls; w.dataset.fw=key;
    w.innerHTML=`<div class="ft"><i class="ic"></i><span>${esc(title)}</span><span class="x" data-fx="${key}" title="Close">${XI}</span></div><div class="fb">${html}</div>`;
    this.mdi.appendChild(w); this.place_(w,x,y); this.front(w); return w; }
  place_(w,x,y){ const mw=this.mdi.clientWidth, mh=this.mdi.clientHeight; w.style.left=Math.max(0,Math.min(x,mw-w.offsetWidth))+'px'; w.style.top=Math.max(0,Math.min(y,mh-30))+'px'; }
  front(w){ this.mdi.querySelectorAll('.fw.act').forEach(x=>x.classList.remove('act')); w.classList.add('act'); w.style.zIndex=++this.zTop; this.ct.classList.add('ina'); }
  fwDown(e){ const w=e.target.closest('.fw'); if(!w){ this.mdi.querySelectorAll('.fw.act').forEach(x=>x.classList.remove('act')); this.ct.classList.remove('ina'); return; }
    this.front(w); const ft=e.target.closest('.ft');
    if(ft&&!e.target.closest('[data-fx]')){ e.preventDefault(); const sx=e.clientX, sy=e.clientY, x0=w.offsetLeft, y0=w.offsetTop;
      const mv=ev=>{ this.place_(w,x0+ev.clientX-sx,y0+ev.clientY-sy); }; const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); const c=this.byId(w.dataset.fw); if(c){ c.st.wx=w.offsetLeft; c.st.wy=w.offsetTop; } };
      window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); return; }
    const ti=e.target.closest('[data-ti]'); if(ti) this.tileDown(e,ti);
    const la=e.target.closest('[data-cur]'); if(la) this.laCursor(e,la); }
  fwClick(e){ const x=e.target.closest('[data-fx]'); if(x){ this.closeWin(x.dataset.fx); return; } this.panClick(e); }
  closeWin(k){ if(k.startsWith('bin:')){ const b=k.slice(4); this.bins[b]&&this.bins[b].remove(); delete this.bins[b]; this.el.querySelector(`[data-bin="${b}"]`).classList.remove('on'); if(this.placing&&this.placing.bin===b) this.cancelPlace(); if(!this.mdi.querySelector('.fw.act')) this.ct.classList.remove('ina'); return; }
    if(k==='desc'){ const w=this.wins.desc; if(w){ this.desc=w.querySelector('textarea').value; w.remove(); delete this.wins.desc; this.autosave(); } return; }
    if(this.wins[k]){ this.wins[k].remove(); delete this.wins[k]; } this.ct.classList.remove('ina'); }
  /* ---------- полки деталей ---------- */
  binItems(k){ if(k!=='fav') return BINS.find(b=>b.k===k).items; let f=[]; try{ f=JSON.parse(localStorage.getItem('ewbs:fav')||'[]'); }catch(_){}
    return f.map(([b,i])=>{ const bin=BINS.find(x=>x.k===b); return bin&&bin.items[i]?Object.assign({},bin.items[i],{ref:[b,i]}):null; }).filter(Boolean); }
  tileHTML(k){ const items=this.binItems(k); if(!items.length) return `<div class="empty">Favorites пока пуст: сюда сами попадают детали, которые ты ставишь чаще всего.</div>`;
    const rows=[[],[]]; items.forEach((it,i)=>rows[it.row===2?1:0].push(it.i?`<span class="tb${!it.it&&!it.fam?' na':''}${it.it&&INSTR.includes(it.it.type)&&this.comps.some(c=>c.type===it.it.type)?' used':''}${this.placing&&this.placing.bin===k&&this.placing.i===i?' on':''}" data-ti="${k}:${i}" data-tip="${esc(it.n)}" data-hint="${esc(it.n)}">${it.i}</span>`:''));
    const per=k==='gates'?99:Math.ceil(rows[0].length/(rows[0].length>12?2:1)); const r0=rows[0], out=[]; for(let i=0;i<r0.length;i+=per) out.push(r0.slice(i,i+per)); if(rows[1].length) out.push(rows[1]);
    return out.map(r=>`<div class="brow">${r.join('')}</div>`).join(''); }
  toggleBin(k){ const btn=this.el.querySelector(`[data-bin="${k}"]`); if(this.bins[k]){ this.closeWin('bin:'+k); return; }
    const b=BINS.find(x=>x.k===k), r=btn.getBoundingClientRect(), mr=this.mdi.getBoundingClientRect();
    const w=this.mkWin('bin:'+k,b.t,this.tileHTML(k),r.left-mr.left-4,2,'bin'); this.bins[k]=w; btn.classList.add('on'); }
  refreshBins(){ Object.entries(this.bins).forEach(([k,w])=>{ w.querySelector('.fb').innerHTML=this.tileHTML(k); }); }
  tileOf(ref){ const [k,i]=ref.split(':'); const it=this.binItems(k)[+i]; return it&&Object.assign({},it,{bin:k,i:+i}); }
  tileDown(e,ti){ e.preventDefault(); const t=this.tileOf(ti.dataset.ti); if(!t) return; this.hideTip();
    if(!t.it&&!t.fam) return this.analog(t.n);
    if(t.it&&INSTR.includes(t.it.type)&&this.comps.some(c=>c.type===t.it.type)) return this.msg('Прибор «'+esc(t.n)+'» уже на схеме: в Electronics Workbench каждый прибор один. Дважды щёлкни по его значку, чтобы открыть окно, или верни его на полку (правая кнопка → Return to Shelf).','info');
    const sx=e.clientX, sy=e.clientY; let moved=false;
    const mv=ev=>{ if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>6) moved=true; };
    const up=ev=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up);
      if(moved){ const r=this.cv.getBoundingClientRect(); const el=document.elementFromPoint(ev.clientX,ev.clientY); if(el&&el.closest('.e-canvas')===this.cv&&ev.clientX<=r.right-17&&ev.clientY<=r.bottom-17){ const [x,y]=this.pt(ev); this.placeTile(t,x,y); } }
      else { this.placing=t; this.cv.classList.add('placing'); this.refreshBins(); this.st1.textContent='Щёлкни на схеме, куда поставить: '+t.n; clearTimeout(this.hintT); } };
    window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); }
  cancelPlace(){ this.placing=null; this.cv.classList.remove('placing'); this.refreshBins(); this.st1.textContent='Ready'; }
  placeTile(t,x,y){ this.cancelPlace(); const go=it=>{ this.place(it,x,y); this.addFav(t); };
    if(t.fam){ if(!t.fam.length) return this.msg('В библиотеке «'+esc(t.n)+'» этой учебной копии нет моделей. Возьми микросхему из 74xx, 741xx или 4xxx.','info'); return this.chooseModel(t,go); }
    go(t.it); }
  addFav(t){ if(t.bin==='fav'||!t.ref&&t.bin===undefined) return; const ref=t.ref||[t.bin,t.i]; let f=[]; try{ f=JSON.parse(localStorage.getItem('ewbs:fav')||'[]'); }catch(_){}
    f=f.filter(x=>!(x[0]===ref[0]&&x[1]===ref[1])); f.unshift(ref); f=f.slice(0,14); try{ localStorage.setItem('ewbs:fav',JSON.stringify(f)); }catch(_){} if(this.bins.fav) this.refreshBins(); }
  chooseModel(t,cb){ let sel=0; const list=t.fam;
    const d=this.dialog(t.n,`<div style="display:grid;grid-template-columns:110px 1fr;gap:10px"><div><div style="margin-bottom:3px">Library</div><div class="mlist" style="height:180px"><div class="on">default</div></div></div><div><div style="margin-bottom:3px">Model</div><div class="mlist ml" style="height:180px">${list.map((m,i)=>`<div data-m="${i}" class="${i===0?'on':''}"><b>${esc(m.m)}</b><span>${esc(m.t)}</span></div>`).join('')}</div></div></div><div style="font-size:11px;color:#444">В EWB микросхема содержит несколько одинаковых секций; здесь ставится одна секция (один элемент) — для схем лаб этого достаточно.</div>`,
      (v,k)=>{ const m=list[sel]; const it=JSON.parse(JSON.stringify(m.it)); it.p=Object.assign({},it.p||{},{model:m.m}); cb(it); },false,{w:440,buttons:[['ok','Accept'],['x','Cancel']],
      init:(dd)=>{ dd.querySelector('.ml').addEventListener('click',e=>{ const r=e.target.closest('[data-m]'); if(!r) return; sel=+r.dataset.m; dd.querySelectorAll('.ml [data-m]').forEach(x=>x.classList.toggle('on',x===r)); });
        dd.querySelector('.ml').addEventListener('dblclick',e=>{ if(e.target.closest('[data-m]')) dd.querySelector('[data-d=ok]').click(); }); }}); }
  byId(id){ return this.comps.find(c=>c.id===id); }
  newId(type){ const base=(type==='gate'?'U':type==='sw'?'S':type==='lamp'?'L':type[0].toUpperCase()); let n=1; const ids=new Set(this.comps.map(c=>c.id)); while(ids.has(base+n)) n++; return base+n; }
  /* ---------- загрузка/сохранение ---------- */
  norm(c){ c=JSON.parse(JSON.stringify(c)); c.p=c.p||{}; c.st=Object.assign({q:0,v:0,word:0,idx:-1},c.st||{}); c.out=c.out||{}; c.rot=c.rot||0; if(c.type==='jk'||c.type==='d') c.p.pre=1;
    if(c.type==='wg'&&c.st.idx<0){ const a=+c.p.init||0; c.st.idx=a; c.st.word=(c.p.words||[])[a]||0; } if(c.type==='clk'&&!c.p.fv){ const m=String(c.p.f||'1').match(/[\d.]+/); c.p.fv=m?+m[0]:1; } return c; }
  loadCirc(j,quiet){ this.comps=(j.comps||[]).map(c=>this.norm(c)); this.wires=(j.wires||[]).map(w=>{ const x=Object.assign({},w); delete x._pts; delete x._lc; if(x.via===null) delete x.via; return x; });
    this.wires.forEach(w=>{ ['f','t'].forEach(k=>{ const [ci,p]=w[k].split('.'); const c=this.byId(ci); if(c&&c.type==='conn') w[k]=ci+'.n'; }); });
    this.file=j.file||this.file||'Untitled.ewb'; if(j.desc!==undefined) this.desc=j.desc; this.hist=[]; this.sel=new Set(); this.selW=-1; this.t=0; this.rebuild(); if(this.power) this.settle(); this.render(); if(!quiet) this.autosave(); }
  dump(){ return {file:this.file,desc:this.desc||undefined,comps:this.comps.map(c=>({id:c.id,type:c.type,x:c.x,y:c.y,rot:c.rot||undefined,fx:c.fx||undefined,fy:c.fy||undefined,p:c.p})),wires:this.wires.map(w=>{ const o={f:w.f,t:w.t}; if(w.col) o.col=w.col; if(w.xm!=null) o.xm=w.xm; if(w.ym!=null) o.ym=w.ym; if(w.via) o.via=w.via; return o; })}; }
  autosave(){ if(this.opt.noSave) return; clearTimeout(this.asT); this.asT=setTimeout(()=>{ try{ localStorage.setItem(this.key,JSON.stringify(this.dump())); }catch(_){} },400); }
  snapshot(){ this.undoS.push(JSON.stringify(this.dump())); if(this.undoS.length>80) this.undoS.shift(); this.redoS=[]; }
  undo(){ if(!this.undoS.length) return this.setHint('Отменять нечего'); this.redoS.push(JSON.stringify(this.dump())); const st=this.keepState(); this.loadCirc(JSON.parse(this.undoS.pop())); this.restoreState(st); }
  redo(){ if(!this.redoS.length) return; this.undoS.push(JSON.stringify(this.dump())); const st=this.keepState(); this.loadCirc(JSON.parse(this.redoS.pop())); this.restoreState(st); }
  keepState(){ const m={}; this.comps.forEach(c=>m[c.id]={st:c.st,out:c.out}); return m; }
  restoreState(m){ this.comps.forEach(c=>{ if(m[c.id]){ c.st=m[c.id].st; c.out=m[c.id].out; } }); if(this.power) this.settle(); this.render(); }
  /* ---------- цепи ---------- */
  rebuild(){ const par={}; const f=k=>{ while(par[k]!==k){ par[k]=par[par[k]]; k=par[k]; } return k; };
    const add=k=>{ if(par[k]===undefined) par[k]=k; }; const uni=(a,b)=>{ add(a); add(b); const ra=f(a), rb=f(b); if(ra!==rb) par[ra]=rb; };
    this.comps.forEach(c=>{ const g=geom(c); Object.keys(g.pins).forEach(p=>add(c.id+'.'+p)); });
    this.wires=this.wires.filter(w=>{ const a=w.f.split('.'), b=w.t.split('.'); const ca=this.byId(a[0]), cb=this.byId(b[0]); return ca&&cb&&pinInfo(ca,a[1])&&pinInfo(cb,b[1]); });
    this.wires.forEach(w=>uni(w.f,w.t));
    const net={}, nets={}; Object.keys(par).forEach(k=>{ const r=f(k); net[k]=r; (nets[r]=nets[r]||{pins:[],drv:[]}).pins.push(k); });
    this.comps.forEach(c=>{ const g=geom(c); Object.entries(g.pins).forEach(([p,q])=>{ if(q[2]==='out'){ const r=net[c.id+'.'+p]; nets[r].drv.push([c,p]); } }); });
    this.net=net; this.nets=nets; this.forced={};
    this.comps.forEach(c=>{ c.in=new Proxy({},{get:(_,p)=>typeof p==="string"&&this.connected(c,p)?1:0}); }); }
  get(c,pin){ const k=c.id+'.'+pin, r=this.net[k]; const n=r&&this.nets[r];
    if(r&&this.forced[r]!==undefined) return this.forced[r];
    if(n&&n.drv.length){ let v=0; for(const [dc,dp] of n.drv){ if(dc.out[dp]) { v=1; break; } } return v; }
    const d=CH[c.type]; if(d&&d.def&&d.def[pin]!==undefined) return d.def[pin];
    if(pin==='PR'||pin==='CLR') return 1; return 0; }
  connected(c,pin){ const r=this.net[c.id+'.'+pin]; return !!(r&&this.nets[r]&&this.nets[r].pins.length>1); }
  settle(){ let ok=false; for(let it=0;it<200;it++){ let ch=false;
      for(const c of this.comps){ const o=evalPart(c,(pin)=>this.get(c,pin)); for(const k in o) if(c.out[k]!==o[k]){ c.out[k]=o[k]; ch=true; } }
      if(!ch){ ok=true; break; } }
    this.unstable=!ok; return ok; }
  netVal(k){ const r=this.net[k]; if(!r) return 0; if(this.forced[r]!==undefined) return this.forced[r]; const n=this.nets[r]; return n.drv.some(([c,p])=>c.out[p])?1:0; }
  /* ---------- время, такт, генератор слов ---------- */
  loop(){ if(!this.power||this.paused) return; const dt=25; this.t+=dt; if(this.t%100<dt) this.st2.textContent=fmtT(this.t);
    const clks=this.comps.filter(c=>c.type==='clk'); const wgs=this.comps.filter(c=>c.type==='wg'&&c.st.run); if(!clks.length&&!wgs.length) return; let ch=false;
    clks.forEach(c=>{ const f=Math.max(0.05,Math.min(+c.p.fv||1,20)); const v=Math.floor(this.t/1000*f*2)%2; if(c.st.v!==v){ c.st.v=v; ch=true; } });
    wgs.forEach(c=>{ const f=Math.max(0.2,Math.min(+c.p.fv||2,20)); const k=Math.floor(this.t/1000*f); if(c.st.lastK!==k){ c.st.lastK=k; this.wgStep(c,true); ch=true; } });
    if(ch){ this.settle(); this.record(); this.render(true); } }
  wgRange(c){ const w=c.p.words||[0], a=Math.max(0,+c.p.init||0), b=c.p.final!=null?+c.p.final:w.length-1; return [a,Math.max(a,b)]; }
  wgWord(c,a){ return (c.p.words||[])[a]||0; }
  wgStep(c,auto){ const [a,b]=this.wgRange(c); let i=c.st.idx; i=(i<a||i>=b)?a:i+1; if(c.st.idx<a&&!auto) i=a; c.st.idx=i; c.st.word=this.wgWord(c,i);
    if(auto){ if(c.st.run==='burst'&&i>=b) c.st.run=null; if((c.p.bp||[]).includes(i)&&c.st.run){ c.st.run=null; this.st1.textContent='Word Generator: breakpoint '+hex4(i); } } }
  wgReset(c){ const [a]=this.wgRange(c); c.st.idx=a; c.st.word=this.wgWord(c,a); c.st.run=null; }
  record(){ const la=this.comps.find(c=>c.type==='la'); if(!la||la.st.stop) return; const row=[this.t]; for(let k=0;k<16;k++) row.push(this.connected(la,'c'+k)?this.get(la,'c'+k):null);
    this.hist.push(row); if(this.hist.length>400) this.hist.shift(); }
  resetSim(){ this.comps.forEach(c=>{ if(['jk','d','t','rs','cnt4','cnt10','reg4'].includes(c.type)){ c.st.q=c.p.q0||0; } if(c.type==='clk') c.st.v=0; if(c.type==='wg') this.wgReset(c); Object.keys(c.st).forEach(k=>{ if(/^p[cv]_/.test(k)||k==='pc'||k==='pv') delete c.st[k]; }); });
    this.hist=[]; this.t=0; }
  /* ---------- отрисовка ---------- */
  bbox(){ let x2=1000,y2=640; this.comps.forEach(c=>{ const g=geom(c); x2=Math.max(x2,c.x+g.w+160); y2=Math.max(y2,c.y+g.h+160); }); return [x2,y2]; }
  render(fast){ const pw=this.power, [W_,H_]=this.bbox(); this.W=W_; this.H=H_; const so=this.so;
    let s=`<svg class="ewbsvg" viewBox="0 0 ${W_} ${H_}" width="${W_*this.zoom}" height="${H_*this.zoom}" role="img" aria-label="Схема ${esc(this.file)}">${so.grid?`<defs><pattern id="ewsgrid${this.uid}" width="10" height="10" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill="#9a9a9a"/></pattern></defs>`:''}
      <rect x="0" y="0" width="${W_}" height="${H_}" fill="${so.grid?`url(#ewsgrid${this.uid})`:'#fff'}" data-bg="1"/>`;
    this.wires.forEach((w,i)=>{ const [ac,ap]=w.f.split('.'), [bc,bp]=w.t.split('.'); const a=pinInfo(this.byId(ac),ap), b=pinInfo(this.byId(bc),bp); if(!a||!b) return;
      const pts=route(a,b,w); w._pts=pts; const lv=this.netVal(w.f); const P=pts.map(p=>p.join(',')).join(' ');
      s+=`<polyline class="wire${this.colorLv&&pw?(lv?' w1':' w0'):''}${i===this.selW?' sel':''}"${w.col?` style="stroke:${w.col}"`:''} points="${P}"/><polyline class="wh" data-w="${i}" points="${P}"/>`; });
    const cnt={}; this.wires.forEach(w=>{ cnt[w.f]=(cnt[w.f]||0)+1; cnt[w.t]=(cnt[w.t]||0)+1; });
    this.comps.forEach(c=>{ if(pw){ if(c.type==='lamp') c.view={on:this.get(c,'i')===1}; if(c.type==='hex'){ const v=[0,1,2,3].map(k=>this.get(c,'b'+k)); c.view={v:v[0]|(v[1]<<1)|(v[2]<<2)|(v[3]<<3)}; } }
      else { if(c.type==='lamp') c.view={on:false}; if(c.type==='hex') c.view={v:null}; if(c.type==='seg7') c.view={}; }
      if(c.type==='wg') c.view={word:c.st.word,idx:c.st.idx};
      const g=geom(c), r=(c.rot||0)%4, sel=this.sel.has(c.id), cx=g.w/2, cy=g.h/2;
      const d=c.p.disp||{}, showL=d.own?d.lb!==false:so.labels, showR=d.own?!!d.rid:so.rid;
      let body=draw(c,showL); if(showR&&!['txt','conn'].includes(c.type)) body+=T(g.w+2,-3,esc(c.id),' class="rid"');
      s+=`<g class="cmp${sel?' sel':''}" data-id="${c.id}" data-t="${c.type}" transform="translate(${c.x},${c.y})${r?` rotate(${r*90} ${cx} ${cy})`:''}${c.fx||c.fy?` translate(${cx},${cy}) scale(${c.fx?-1:1},${c.fy?-1:1}) translate(${-cx},${-cy})`:''}"><rect x="-3" y="-3" width="${g.w+6}" height="${g.h+6}" fill="transparent"/>${body}</g>`; });
    this.comps.forEach(c=>{ const g=geom(c); Object.keys(g.pins).forEach(p=>{ const q=pinInfo(c,p); const k=c.id+'.'+p; const fl=pw&&q.dir==='in'&&!this.connected(c,p)&&['gate','ha','fa','jk','d','lamp'].includes(c.type)&&!(p==='PR'||p==='CLR');
        s+=`${(cnt[k]||0)>=2&&c.type!=='conn'?`<circle cx="${q.x}" cy="${q.y}" r="2.4" fill="#000"/>`:''}<circle class="pin${fl?' floating':''}" data-pin="${k}" cx="${q.x}" cy="${q.y}" r="${c.type==='conn'?5:4}"/>`; }); });
    if(this.tmp) s+=this.tmp; s+='</svg>';
    this.cv.innerHTML=s; this.svg=this.cv.firstChild;
    const one=this.sel.size===1?this.byId([...this.sel][0]):null, has=this.sel.size>0, onlyInstr=has&&[...this.sel].every(id=>INSTR.includes(this.byId(id).type));
    const dis={cut:!has||onlyInstr,copy:!has||onlyInstr,paste:!this.clip,rot:!has||onlyInstr,fliph:!has||onlyInstr,flipv:!has||onlyInstr,sub:!has,graph:true,prop:!one};
    this.el.querySelectorAll('.r1 [data-tb]').forEach(b=>b.classList.toggle('dis',!!dis[b.dataset.tb]));
    this.el.querySelector('.pw').classList.toggle('on',pw); const pz=this.el.querySelector('.pause'); pz.classList.toggle('on',this.paused); pz.classList.toggle('dis',!pw); pz.textContent=this.paused?'Resume':'Pause';
    this.el.classList.toggle('run',pw); this.ct.textContent=this.file==='Untitled.ewb'?'Untitled':this.file;
    this.st2.textContent=pw?fmtT(this.t):'';
    const fl=pw&&this.comps.some(c=>c.type!=='conn'&&Object.entries(geom(c).pins).some(([p,q])=>q[2]==='in'&&!this.connected(c,p)&&['gate','jk','d','lamp'].includes(c.type)&&!(p==='PR'||p==='CLR')));
    this.st4.textContent= this.unstable&&pw?'⚠ Схема не устанавливается: выходы всё время меняются (генерация). Проверь обратные связи.':this.paused?'Simulation paused (F9 — Resume).':pw?(this.status||'')+(fl?' Оранжевые выводы ни к чему не подключены (= 0).':''):(this.status||'');
    if(!fast) this.renderPanels(); else this.updatePanels();
    if(!fast&&Object.keys(this.bins).some(k=>k==='inst'||k==='fav')) this.refreshBins(); }
  /* ---------- приборы: окна как в EWB ---------- */
  openWin(c){ if(this.wins[c.id]){ this.front(this.wins[c.id]); return; } const ttl={lc:'Logic Converter',wg:'Word Generator',la:'Logic Analyzer'}[c.type];
    const w=this.mkWin(c.id,ttl,this.instHTML(c),0,0); this.wins[c.id]=w;
    const mw=this.mdi.clientWidth, mh=this.mdi.clientHeight; const x=c.st.wx!=null?c.st.wx:Math.max(10,Math.min(mw-w.offsetWidth-10,(c.x-this.cv.scrollLeft/this.zoom)*this.zoom)), y=c.st.wy!=null?c.st.wy:Math.max(10,mh-w.offsetHeight-30);
    this.place_(w,x,y); this.front(w); if(c.type==='la') this.laScroll(c); }
  instHTML(c){ return c.type==='lc'?this.lcHTML(c):c.type==='wg'?this.wgHTML(c):this.laHTML(c); }
  renderPanels(){ Object.keys(this.wins).forEach(id=>{ if(id==='desc') return; const c=this.byId(id), w=this.wins[id]; if(!c){ w.remove(); delete this.wins[id]; return; }
      const fb=w.querySelector('.fb'), sc=[...fb.querySelectorAll('.lct,.wgl')].map(x=>x.scrollTop); fb.innerHTML=this.instHTML(c); [...fb.querySelectorAll('.lct,.wgl')].forEach((x,i)=>x.scrollTop=sc[i]||0); if(c.type==='la') this.laScroll(c); }); }
  updatePanels(){ Object.keys(this.wins).forEach(id=>{ const c=this.byId(id), w=this.wins[id]; if(!c) return;
      if(c.type==='la'){ const sc=w.querySelector('.scr'); if(sc) sc.outerHTML=this.laScr(c); const tv=w.querySelector('.tv'); if(tv) tv.innerHTML=this.laTV(c); this.laScroll(c); }
      if(c.type==='wg') this.wgLive(c,w); }); }
  /* --- Logic Analyzer --- */
  laSW(c){ return Math.max(2,Math.round(64/(c.st.cpd||8))); }
  laScr(c){ const H=this.hist, sw=this.laSW(c), rh=13, n=Math.max(H.length,1), Wd=Math.max(380,n*sw+30), Hh=16*rh+8; const last=H[H.length-1]||[];
    let p=`<svg viewBox="0 0 ${Wd} ${Hh}" width="${Wd}" height="${Hh}" style="display:block">`;
    for(let k=0;k<16;k++){ const y=6+k*rh+rh-3; p+=`<line x1="0" y1="${y}" x2="${Wd}" y2="${y}" stroke="#999" stroke-dasharray="1 2"/>`; }
    for(let k=0;k<16;k++){ let d=''; const y0=6+k*rh; H.forEach((row,t)=>{ const v=row[k+1]; if(v==null) return; const y=v?y0+2:y0+rh-3; d+=`${d?'L':'M'}${t*sw} ${y} L${(t+1)*sw} ${y} `; }); if(d) p+=`<path d="${d}" fill="none" stroke="#000" stroke-width="1"/>`; }
    const t1=Math.min(c.st.t1||0,n-1), t2=Math.min(c.st.t2!=null?c.st.t2:n-1,n-1);
    p+=`<line x1="${t1*sw+1}" y1="0" x2="${t1*sw+1}" y2="${Hh}" stroke="#e00"/><path d="M${t1*sw-4} 0h10l-5 6z" fill="#e00"/><line x1="${t2*sw+1}" y1="0" x2="${t2*sw+1}" y2="${Hh}" stroke="#0040ff"/><path d="M${t2*sw-4} 0h10l-5 6z" fill="#0040ff"/></svg>`;
    return `<div class="scr"><div class="chs">${Array.from({length:16},(_,k)=>{ const on=this.connected(c,'c'+k), v=last[k+1]; return `<i class="${on?(v?'on':'c'):''}">${on&&v!=null?v:''}</i>`; }).join('')}</div><div class="plot" data-cur="${c.id}">${p}</div></div>`; }
  laTV(c){ const H=this.hist, n=H.length; if(!n) return 'T1 &nbsp; —<br>T2 &nbsp; —<br>T2-T1 —'; const t1=Math.min(c.st.t1||0,n-1), t2=Math.min(c.st.t2!=null?c.st.t2:n-1,n-1), a=H[t1][0]/1000, b=H[t2][0]/1000;
    return `T1 &nbsp;&nbsp;${a.toFixed(4)} s<br>T2 &nbsp;&nbsp;${b.toFixed(4)} s<br>T2-T1 ${(b-a).toFixed(4)} s`; }
  laHTML(c){ return `<div class="law">${this.laScr(c)}<div class="bot"><div style="display:flex;flex-direction:column;gap:3px"><button class="wbtn" data-la="stop">${c.st.stop?'Start':'Stop'}</button><button class="wbtn" data-la="reset">Reset</button></div><div class="tv">${this.laTV(c)}</div>
      <fieldset><legend>Clock</legend><div class="row" style="display:flex;gap:4px;align-items:center">Clocks per division <input class="wi" type="number" min="1" max="64" value="${c.st.cpd||8}" data-lacpd="${c.id}" style="width:46px"></div><div style="display:flex;gap:4px;align-items:center;margin-top:3px"><button class="wbtn" data-la="cset">Set...</button><span style="font-size:10px">Internal ◉</span></div></fieldset>
      <fieldset><legend>Trigger</legend><button class="wbtn" data-la="tset">Set...</button><div style="font-size:10px;margin-top:3px">Qualifier ◌</div></fieldset></div>
      <div style="font-size:10.5px;color:#333;margin-top:3px">Каналы слева — 16 входов прибора (сверху вниз 0…15). Отсчёт пишется на каждом изменении схемы (такт, генератор слов, переключатель). Красный/синий курсоры T1/T2 — щёлкни по полю (Shift — синий).</div></div>`; }
  laScroll(c){ const w=this.wins[c.id]; const pl=w&&w.querySelector('.plot'); if(pl&&!c.st.stop) pl.scrollLeft=pl.scrollWidth; }
  laCursor(e,el){ const c=this.byId(el.dataset.cur), r=el.getBoundingClientRect(); const i=Math.max(0,Math.floor((e.clientX-r.left+el.scrollLeft)/this.laSW(c))); if(e.shiftKey) c.st.t2=i; else c.st.t1=i; c.st.stop=1; this.renderPanels(); }
  /* --- Word Generator --- */
  wgHTML(c){ const w=c.p.words||[], [a,b]=this.wgRange(c), n=Math.max(64,w.length,b+1), ed=c.st.edit!=null?c.st.edit:a, bp=c.p.bp||[], v=this.wgWord(c,ed);
    let list=''; for(let i=0;i<n;i++){ const cls=[i===c.st.idx?'cur':'',i===ed?'ed':'',bp.includes(i)?'bp':''].join(' ').trim(); list+= i===ed?`<div class="${cls}" data-wga="${i}"><input data-wgw="${c.id}" value="${hex4(this.wgWord(c,i))}" maxlength="4" spellcheck="false"></div>`:`<div class="${cls}" data-wga="${i}">${hex4(this.wgWord(c,i))}</div>`; }
    return `<div class="wgw"><div class="wgl" data-wgl="${c.id}">${list}</div>
      <div class="wgg"><fieldset><legend>Address</legend><div class="ad">Edit<input class="wi" data-wgad="edit" data-id="${c.id}" value="${hex4(ed)}">Current<input class="wi" readonly value="${c.st.idx<0?'----':hex4(c.st.idx)}" data-wgcur>Initial<input class="wi" data-wgad="init" data-id="${c.id}" value="${hex4(a)}">Final<input class="wi" data-wgad="final" data-id="${c.id}" value="${hex4(b)}"></div></fieldset>
        <div class="bt">${[['cycle','Cycle'],['burst','Burst'],['step','Step'],['bp','Breakpoint'],['pat','Pattern...']].map(([k,t])=>`<button class="wbtn${c.st.run===k?' dk':''}" data-wgb="${k}" data-id="${c.id}">${t}</button>`).join('')}</div></div>
      <fieldset class="wide"><legend>Trigger</legend><div class="row"><button class="wbtn dk">Internal</button><button class="wbtn" data-wgb="ext" data-id="${c.id}">External</button></div></fieldset>
      <fieldset class="wide"><legend>Frequency</legend><div class="row"><input class="wi" type="number" min="0.2" max="20" step="0.5" value="${c.p.fv||2}" data-wgf="${c.id}" style="width:56px"><select class="wi"><option>Hz</option></select><span style="font-size:10px">на сайте до 20 Hz — чтобы видеть глазом</span></div></fieldset>
      <div class="wide row">ASCII <input class="wi" data-wgasc="${c.id}" value="${v>=32&&v<127?esc(String.fromCharCode(v)):''}" maxlength="1" style="width:22px"> Binary <input class="wi" data-wgbin="${c.id}" value="${(v>>>0).toString(2).padStart(16,'0')}" maxlength="16" style="width:118px;font-family:Courier New,monospace"></div>
      <div class="bits">${Array.from({length:16},(_,k)=>{ const bit=15-k; return `<i class="${(c.st.word>>bit)&1?'on':''}" title="бит ${bit}">${bit}</i>`; }).join('')}</div></div>`; }
  wgLive(c,w){ const cur=w.querySelector('[data-wgcur]'); if(cur) cur.value=c.st.idx<0?'----':hex4(c.st.idx);
    w.querySelectorAll('[data-wga]').forEach(x=>x.classList.toggle('cur',+x.dataset.wga===c.st.idx)); const bits=w.querySelectorAll('.bits i'); bits.forEach((x,k)=>x.classList.toggle('on',!!((c.st.word>>(15-k))&1)));
    w.querySelectorAll('[data-wgb]').forEach(b=>b.classList.toggle('dk',c.st.run===b.dataset.wgb)); }
  /* --- Logic Converter --- */
  lcHTML(c){ const st=c.st; if(!st.nv){ let n=0; 'ABCDEFGH'.split('').forEach((k,i)=>{ if(this.connected(c,k)) n=i+1; }); st.nv=Math.max(n,2); }
    const n=st.nv, names='ABCDEFGH'.slice(0,n).split(''); if(!st.tab||st.tab.length!==(1<<n)) st.tab=Array(1<<n).fill('?');
    const rows=st.tab.map((v,r)=>`<div class="r"><b>${String(r).padStart(3,'0')}</b><em>${r.toString(2).padStart(n,'0')}</em><s data-lco="${c.id}" data-r="${r}" title="0 → 1 → X">${v}</s></div>`).join('');
    const G='<svg viewBox="0 0 22 12"><path d="M4 1h6a5 5 0 010 10H4z" fill="#fff" stroke="#000"/><path d="M0 4h4M0 8h4M15 6h6" stroke="#000"/></svg>', TT='<b style="letter-spacing:2px">10|1</b>', AB='<b>A|B</b>', AR='<span>→</span>';
    return `<div class="lcw"><div class="top">${'ABCDEFGH'.split('').map((k,i)=>`<span class="v${i<n?' on':''}" data-lcv="${c.id}" data-n="${i+1}" title="Переменных: ${i+1}"><i></i>${k}</span>`).join('')}<span class="out">Out <i></i></span></div>
      <div class="mid"><div class="lct">${rows}</div><div class="lcc"><div class="h">Conversions</div>${[['c2t',G,TT],['t2e',TT,AB],['t2s',TT,AB,'SIMP'],['e2t',AB,TT],['e2c',AB,G],['e2n',AB,'<b>NAND</b>']].map(([k,a,b,m])=>`<button class="wbtn" data-lcb="${k}" data-id="${c.id}" data-tip="${{c2t:'Схема → таблица истинности',t2e:'Таблица → выражение (СДНФ)',t2s:'Таблица → упрощённое выражение',e2t:'Выражение → таблица',e2c:'Выражение → схема',e2n:'Выражение → схема на NAND'}[k]}">${a}${m?`<span style="font-size:7px;position:relative;top:-4px">${m}</span>`:AR}${b}</button>`).join('')}</div></div>
      <input class="wi lcin" data-lci="${c.id}" value="${esc(st.expr||'')}" placeholder="A'B+AC" spellcheck="false"><div class="lcmsg">${st.msg||'Подключи A, B, C… ко входам схемы, Out — к выходу и нажми первую кнопку.'}</div></div>`; }
  panClick(e){ const t=e.target;
    const la=t.closest('[data-la]'); if(la){ const c=this.comps.find(x=>x.type==='la'); const k=la.dataset.la; if(k==='reset'){ this.hist=[]; c.st.t1=0; delete c.st.t2; c.st.stop=0; } if(k==='stop') c.st.stop=c.st.stop?0:1;
      if(k==='cset'||k==='tset') this.msg(k==='cset'?'Clock setup: в этой копии анализатор пишет отсчёт на каждое изменение схемы (внутренняя синхронизация). Clocks per division меняет масштаб по времени.':'Trigger: запуск записи — сразу (Trigger pattern = XXXXXXXXXXXXXXXX).','info'); this.renderPanels(); return; }
    const wa=t.closest('[data-wga]'); if(wa&&!t.closest('input')){ const c=this.byId(wa.closest('[data-wgl]').dataset.wgl); c.st.edit=+wa.dataset.wga; this.renderPanels(); const i=this.wins[c.id]&&this.wins[c.id].querySelector('[data-wgw]'); if(i){ i.focus(); i.select(); } return; }
    const wb=t.closest('[data-wgb]'); if(wb){ const c=this.byId(wb.dataset.id), a=wb.dataset.wgb;
      if(a==='step'){ if(!this.power) return this.needPower(); c.st.run=null; this.wgStep(c); this.settle(); this.record(); }
      if(a==='burst'||a==='cycle'){ if(!this.power) return this.needPower(); if(c.st.run===a){ c.st.run=null; } else { c.st.run=a; c.st.lastK=Math.floor(this.t/1000*Math.max(0.2,Math.min(+c.p.fv||2,20))); if(a==='burst'){ const [s]=this.wgRange(c); c.st.idx=s-1; } } }
      if(a==='bp'){ const ed=c.st.edit!=null?c.st.edit:this.wgRange(c)[0]; const bp=new Set(c.p.bp||[]); bp.has(ed)?bp.delete(ed):bp.add(ed); c.p.bp=[...bp]; this.autosave(); }
      if(a==='pat') return this.wgPattern(c);
      if(a==='ext') return this.msg('External trigger: внешний запуск по сигналу на входе прибора. В этой копии генератор работает только от внутреннего таймера (Internal).','info');
      this.render(); return; }
    const lv=t.closest('[data-lcv]'); if(lv){ const c=this.byId(lv.dataset.lcv); c.st.nv=+lv.dataset.n; c.st.tab=null; this.renderPanels(); return; }
    const lo=t.closest('[data-lco]'); if(lo){ const c=this.byId(lo.dataset.lco), r=+lo.dataset.r; const nx={'?':'0','0':'1','1':'X','X':'0'}; c.st.tab[r]=nx[c.st.tab[r]]; this.renderPanels(); return; }
    const lb=t.closest('[data-lcb]'); if(lb){ this.lcCmd(this.byId(lb.dataset.id),lb.dataset.lcb); } }
  needPower(){ this.msg('Сначала включи моделирование: переключатель O/I справа вверху (Analysis → Activate, Ctrl+G).','info'); }
  panInput(e,final){ const t=e.target, H=x=>{ const v=parseInt(String(x).trim(),16); return isNaN(v)?null:v&0xFFFF; };
    if(t.dataset.wgw&&final){ const c=this.byId(t.dataset.wgw), a=c.st.edit!=null?c.st.edit:this.wgRange(c)[0], v=H(t.value); if(v==null) return; this.setWord(c,a,v); c.st.edit=a+1; this.renderPanels(); const i=this.wins[c.id].querySelector('[data-wgw]'); if(i){ i.focus(); i.select(); } }
    if(t.dataset.wgad&&final){ const c=this.byId(t.dataset.id), v=H(t.value); if(v==null) return this.renderPanels(); const k=t.dataset.wgad; if(k==='edit') c.st.edit=v; else { c.p[k]=Math.min(v,1023); if(c.st.run==null) this.wgReset(c); this.autosave(); } if(this.power) this.settle(); this.render(); }
    if(t.dataset.wgbin&&final){ const c=this.byId(t.dataset.wgbin), v=parseInt(t.value.replace(/[^01]/g,'')||'0',2); this.setWord(c,c.st.edit!=null?c.st.edit:this.wgRange(c)[0],v&0xFFFF); this.renderPanels(); }
    if(t.dataset.wgasc&&t.value){ const c=this.byId(t.dataset.wgasc); this.setWord(c,c.st.edit!=null?c.st.edit:this.wgRange(c)[0],t.value.charCodeAt(0)&0xFF); this.renderPanels(); }
    if(t.dataset.wgf){ this.byId(t.dataset.wgf).p.fv=Math.max(0.2,Math.min(20,+t.value||2)); this.autosave(); }
    if(t.dataset.lacpd&&final){ this.byId(t.dataset.lacpd).st.cpd=Math.max(1,Math.min(64,+t.value||8)); this.renderPanels(); }
    if(t.dataset.lci){ this.byId(t.dataset.lci).st.expr=t.value; }
    if(t.dataset.desc!==undefined){ this.desc=t.value; this.autosave(); } }
  setWord(c,a,v){ const w=(c.p.words||[]).slice(); while(w.length<=a) w.push(0); w[a]=v; c.p.words=w; if(c.p.final==null||+c.p.final<a){ if(c.p.final!=null) c.p.final=a; } if(c.st.idx===a){ c.st.word=v; if(this.power){ this.settle(); this.record(); } } this.autosave(); }
  wgPattern(c){ this.dialog('Pre-setting patterns',`<div style="display:grid;gap:5px">${[['clr','Clear buffer'],['open','Open'],['save','Save'],['up','Up counter'],['down','Down counter'],['shr','Shift right'],['shl','Shift left']].map(([k,t],i)=>`<label style="display:flex;gap:6px;align-items:center"><input type="radio" name="pt${this.uid}" data-f="k" value="${k}"${i===3?' checked':''}>${t}</label>`).join('')}</div><div style="font-size:11px;color:#444">Заполняет слова от Initial до Final (Open/Save — файл слов .dp: по одному hex-слову в строке).</div>`,v=>{
      const [a,b]=this.wgRange(c), N=Math.max(b-a+1,16), w=(c.p.words||[]).slice(); const put=(i,x)=>{ while(w.length<=a+i) w.push(0); w[a+i]=x&0xFFFF; };
      if(v.k==='save'){ saveFile((this.file.replace(/\.ewbs?$/,'')||'words')+'.dp',w.map(hex4).join('\n')); return; }
      if(v.k==='open'){ this.finCb=(txt)=>{ const ws=txt.split(/[\s,;]+/).filter(Boolean).map(x=>parseInt(x,16)&0xFFFF).filter(x=>!isNaN(x)); if(!ws.length) return this.msg('В файле нет слов (hex).','err'); c.p.words=ws; c.p.init=0; c.p.final=ws.length-1; this.wgReset(c); this.render(); this.autosave(); }; this.fin.click(); return; }
      for(let i=0;i<N;i++){ if(v.k==='clr') put(i,0); if(v.k==='up') put(i,i); if(v.k==='down') put(i,N-1-i); if(v.k==='shr') put(i,0x8000>>>(i%16)); if(v.k==='shl') put(i,1<<(i%16)); }
      c.p.words=w; if(c.p.final==null) c.p.final=a+N-1; this.wgReset(c); if(this.power) this.settle(); this.render(); this.autosave(); }); }
  /* ---------- Logic Converter ---------- */
  lcCmd(c,k){ const st=c.st, n=st.nv, names='ABCDEFGH'.slice(0,n).split('');
    const say=m=>{ st.msg=m; this.renderPanels(); };
    if(k==='c2t'){ if(!this.connected(c,'Out')) return say('Вывод Out (справа) не подключён к выходу схемы.');
      const nets=names.map(x=>this.net[c.id+'.'+x]); if(nets.some((r,i)=>!this.connected(c,names[i]))) return say('Не все выводы '+names.join(', ')+' подключены. Подключи их ко входам схемы или уменьши число переменных (буквы сверху).');
      const keep=this.keepState(); const tab=[];
      for(let r=0;r<(1<<n);r++){ this.forced={}; nets.forEach((nr,i)=>this.forced[nr]=(r>>(n-1-i))&1); this.settle(); tab.push(String(this.netVal(c.id+'.Out'))); }
      this.forced={}; this.restoreState(keep); st.tab=tab; return say('Таблица построена по схеме: Logic Converter сам перебрал все '+(1<<n)+' комбинаций входов.'); }
    if(k==='t2e'||k==='t2s'){ if(st.tab.includes('?')) return say('В столбце F есть «?» — заполни таблицу (щелчками) или нажми «Схема → Таблица».');
      const ones=[], dcs=[]; st.tab.forEach((v,r)=>{ if(v==='1') ones.push(r); if(v==='X') dcs.push(r); });
      if(k==='t2e'){ const e=ones.map(r=>names.map((x,i)=>((r>>(n-1-i))&1)?x:x+"'").join('')).join(' + ')||'0'; st.expr=e; return say('СДНФ (сумма минтермов): <b>'+esc(e)+'</b>'); }
      const res=qm(n,ones,dcs); const e=res.zero?'0':res.one?'1':res.terms.map(t=>termStr(t,names)).join(' + '); st.expr=e; return say('Упрощённое (Квайн — Мак-Класки'+(dcs.length?', X — безразличные':'')+'): <b>'+esc(e)+'</b>'); }
    if(k==='e2t'||k==='e2c'||k==='e2n'){ let e; const src=(st.expr||'').trim(); if(!src) return say('Впиши выражение в строку ниже.');
      try{ e=parseExpr(src); }catch(err){ return say('Ошибка в выражении: '+esc(err.message)); }
      const vs=[...exprVars(e)].sort(varSort); if(vs.some(v=>!/^[A-H]$/.test(v))) return say('В Logic Converter переменные — буквы A…H.');
      const nn=Math.max(...vs.map(v=>'ABCDEFGH'.indexOf(v)+1),1); st.nv=nn; const nm='ABCDEFGH'.slice(0,nn).split('');
      st.tab=[]; for(let r=0;r<(1<<nn);r++){ const env={}; nm.forEach((x,i)=>env[x]=(r>>(nn-1-i))&1); st.tab.push(String(evalExpr(e,env))); }
      if(k==='e2t') return say('Таблица построена по выражению.');
      let ex=src; if(k==='e2n'){ const ones=st.tab.map((v,r)=>v==='1'?r:-1).filter(r=>r>=0); const res=qm(nn,ones,[]);
        if(res.zero||res.one) return say('Функция — константа '+(res.one?1:0)+', схема не нужна.');
        const lit=(t)=>{ const a=[]; for(let i=0;i<nn;i++){ const b=1<<(nn-1-i); if(t.m&b) continue; a.push((t.v&b)?nm[i]:`!(${nm[i]}*${nm[i]})`); } return a; };
        const terms=res.terms.map(t=>{ const l=lit(t); return l.length===1&&!l[0].startsWith('!')?`!(${l[0]}*${l[0]})`:`!(${l.join('*')})`; });
        ex= terms.length===1? `!(${terms[0]}*${terms[0]})` : `!(${terms.join('*')})`; }
      const gen=ewbFromExpr(ex,{file:'lc.ewb',out:'F'}); this.importGen(gen); return say(k==='e2n'?'Построена схема только на NAND (И-НЕ): упрощённая ДНФ → закон де Моргана → NAND–NAND.':'Схема построена по выражению и добавлена справа.'); } }
  importGen(gen){ this.snapshot(); const [bx]=this.contentBox(); const ox=Math.max(20,bx+60), oy=20, map={};
    gen.comps.forEach(c=>{ const nid=this.newId(c.type); map[c.id]=nid; const n=this.norm(Object.assign({},c,{id:nid,x:c.x+ox,y:c.y+oy})); delete n._d; this.comps.push(n); });
    gen.wires.forEach(w=>{ const [a,ap]=w.f.split('.'),[b,bp]=w.t.split('.'); if(!map[a]||!map[b]) return; this.wires.push({f:map[a]+'.'+ap,t:map[b]+'.'+bp}); });
    this.rebuild(); if(this.power) this.settle(); this.render(); this.autosave(); }
  contentBox(){ let x2=0,y2=0; this.comps.forEach(c=>{ if(c.type==='lc'||c.type==='la'||c.type==='wg') return; const g=geom(c); x2=Math.max(x2,c.x+g.w); y2=Math.max(y2,c.y+g.h); }); return [x2,y2]; }
  /* ---------- меню (пункты как в EWB 5.12) ---------- */
  menuItems(m){ const has=this.sel.size>0, one=this.sel.size===1, pw=this.power;
    const wl=Object.keys(this.wins).filter(k=>k!=='desc').map((id,i)=>['win:'+id,'&'+(i+3)+' '+({lc:'Logic Converter',wg:'Word Generator',la:'Logic Analyzer'}[this.byId(id).type])]);
    const M={
      File:[['new','&New','Ctrl+N'],['open','&Open...','Ctrl+O'],['save','&Save','Ctrl+S'],['saveas','Save &As...'],['revert','&Revert to Saved...','',!this.saved],'-',['import','&Import...'],['export','&Export...'],'-',['print','&Print...','Ctrl+P'],['psetup','Print Set&up...'],'-',['exit','E&xit','Alt+F4'],'-',['install','I&nstall...']],
      Edit:[['undo','&Undo','Ctrl+Z',!this.undoS.length],'-',['cut','Cu&t','Ctrl+X',!has],['copy','&Copy','Ctrl+C',!has],['paste','&Paste','Ctrl+V',!this.clip],['del','&Delete','Del',!has&&this.selW<0],['all','Select &All','Ctrl+A'],'-',['bmp','Copy as &Bitmap','Ctrl+I'],['clip','&Show Clipboard']],
      Circuit:[['rot','&Rotate','Ctrl+R',!has],['fliph','Flip &Horizontal','',!has],['flipv','Flip &Vertical','',!has],['prop','Component &Properties...','',!one],'-',['sub','Create &Subcircuit...','Ctrl+B',!has],'-',['zin','Zoom &In','Ctrl++'],['zout','Zoom &Out','Ctrl+-'],'-',['sopt','Schematic &Options...'],['restr','R&estrictions...']],
      Analysis:[['power','&Activate','Ctrl+G',pw],[('pause'),this.paused?'&Resume':'&Pause','F9',!pw],['stop','St&op','Ctrl+T',!pw],['aopt','Analysis &Options...','Ctrl+Y'],'-',...ANALYSES,'-',['graph','Display &Graphs']],
      Window:[['arrange','&Arrange','Ctrl+W'],'-',['circ','&1 Circuit','',false,true],['desc','&2 Description','Ctrl+D',false,!!this.wins.desc],...wl],
      Help:[['help','Electronics Workbench &Help','F1'],['hidx','Help &Index...'],'-',['rel','&Release Notes'],'-',['about','&About Electronics Workbench...']]};
    return M[m]; }
  cmd(k,ctx){ const one=this.sel.size===1?this.byId([...this.sel][0]):null; if(k.startsWith('win:')){ const w=this.wins[k.slice(4)]; if(w) this.front(w); return; }
    if(k.startsWith('a_')) return this.analog((ANALYSES.find(a=>a[0]===k)||['',''])[1].replace(/&|\.\.\./g,'')+' Analysis');
    switch(k){
      case 'min': this.ew.classList.toggle('min'); this.ew.classList.remove('max'); break;
      case 'max': this.ew.classList.remove('min'); this.ew.classList.toggle('max'); document.body.style.overflow=this.ew.classList.contains('max')?'hidden':''; setTimeout(()=>this.render(),0); break;
      case 'close': case 'exit': this.askSave(()=>{ this.ew.classList.remove('max'); document.body.style.overflow=''; this.ew.classList.add('min'); }); break;
      case 'new': this.askSave(()=>{ this.snapshot(); this.closeInstr(); this.loadCirc({file:'Untitled.ewb',comps:[],wires:[]}); this.desc=''; this.saved=null; this.status=''; if(this.power) this.cmd('stop'); }); break;
      case 'open': this.askSave(()=>this.openDlg()); break;
      case 'save': if(this.file==='Untitled.ewb') return this.cmd('saveas'); this.saveTo(this.file); break;
      case 'saveas': this.dialog('Save Circuit File As',`<label class="f">File name<input data-f="name" value="${esc(this.file.replace(/\.ewbs?$/,''))}"></label><label class="f">Save as type<select data-f="type"><option value="file">Electronics Workbench Files (*.ewbs) — файл на компьютер</option><option value="br">Хранилище браузера (без файла)</option></select></label><div style="font-size:11px;color:#444">Файл .ewbs открывается здесь же (File → Open). Хранилище браузера — только на этом устройстве.</div>`,v=>{ const nm=(v.name||'Untitled').trim().replace(/[\\/:*?"<>|]/g,'_'); this.file=nm+'.ewb'; this.saveTo(this.file,v.type==='br'); },false,{buttons:[['ok','Save'],['x','Cancel']]}); break;
      case 'revert': if(this.saved) this.msg('Revert to the last saved version of «'+esc(this.file)+'»?','ask',[['y','Yes'],['x','No']],b=>{ if(b==='y'){ this.snapshot(); this.loadCirc(JSON.parse(this.saved)); } }); break;
      case 'import': this.msg('Import… — загрузка списка соединений SPICE (*.cir). В этой учебной копии импорт не поддерживается — открывай схемы через File → Open (*.ewbs).','info'); break;
      case 'export': this.dialog('Export',`<label class="f">Save as type<select data-f="t"><option value="net">SPICE netlist (*.cir)</option><option value="svg">Рисунок схемы (*.svg)</option></select></label>`,v=>v.t==='svg'?this.saveSvg():this.exportNet(),false,{buttons:[['ok','Export'],['x','Cancel']]}); break;
      case 'print': this.dialog('Print',`<div>Print items</div>${['Schematic','Description','Instruments'].map((t,i)=>`<label style="display:flex;gap:6px"><input type="checkbox"${i===0?' checked':''} disabled>${t}</label>`).join('')}<div style="font-size:11px;color:#444">Печать заменена сохранением рисунка схемы (*.svg) — его можно распечатать или вставить в отчёт.</div>`,()=>this.saveSvg(),false,{buttons:[['ok','Print'],['x','Cancel']]}); break;
      case 'psetup': this.msg('Print Setup: используется принтер по умолчанию твоей системы.','info'); break;
      case 'install': this.msg('Install… — установка дополнительных модулей EWB. В учебной копии недоступно.','info'); break;
      case 'undo': this.undo(); break; case 'redo': this.redo(); break;
      case 'copy': this.copy(); break; case 'cut': this.copy(); this.delSel(true); break; case 'paste': this.paste(this.pastePt); this.pastePt=null; break;
      case 'del': this.delSel(); break;
      case 'all': this.sel=new Set(this.comps.map(c=>c.id)); this.render(); break;
      case 'bmp': this.copyBmp(); break;
      case 'clip': this.msg(this.clip?'Clipboard: '+this.clip.comps.length+' компонент(ов), '+this.clip.wires.length+' провод(ов). Edit → Paste вставит их на схему.':'Clipboard is empty.','info'); break;
      case 'rot': case 'fliph': case 'flipv': { const ids=[...this.sel].filter(id=>!INSTR.includes(this.byId(id).type)); if(!ids.length) return this.msg('Instruments cannot be rotated.','info'); this.snapshot();
        ids.forEach(id=>{ const c=this.byId(id); if(k==='rot') c.rot=((c.rot||0)+1)%4; else if((k==='fliph')===((c.rot||0)%2===0)) c.fx=c.fx?0:1; else c.fy=c.fy?0:1; }); this.clearVia(new Set(ids)); this.render(); this.autosave(); break; }
      case 'prop': if(one) INSTR.includes(one.type)?this.openWin(one):this.props(one); break;
      case 'open_i': { const c=this.byId(ctx); if(c) this.openWin(c); break; }
      case 'shelf': { const c=this.byId(ctx||[...this.sel][0]); if(c) this.toShelf(c); break; }
      case 'sub': this.msg('A subcircuit cannot be created.<br>Подсхемы (Create Subcircuit) в этой учебной копии не поддерживаются: собирай схему целиком, а повторяющиеся куски копируй (Ctrl+C / Ctrl+V).','info'); break;
      case 'zin': this.setZoom(ZOOMS.find(z=>z>this.zp)||this.zp); break; case 'zout': this.setZoom([...ZOOMS].reverse().find(z=>z<this.zp)||this.zp); break;
      case 'sopt': this.schemOpts(); break;
      case 'restr': this.msg('Restrictions: преподаватель в EWB может запретить детали и анализы паролем. В учебной копии ограничений нет.','info'); break;
      case 'wprop': { const w=this.wires[this.selW]; if(!w) return; this.dialog('Wire Properties',`<label class="f">Color<select data-f="c">${[['','Black (по умолчанию)'],['#e00000','Red'],['#00a000','Green'],['#0040ff','Blue'],['#a000a0','Purple'],['#808080','Gray']].map(([v,t])=>`<option value="${v}"${(w.col||'')===v?' selected':''}>${t}</option>`).join('')}</select></label>`,v=>{ this.snapshot(); if(v.c) w.col=v.c; else delete w.col; this.render(); this.autosave(); }); break; }
      case 'addtext': { const [x,y]=this.ctxPt||[40,40]; this.dialog('Add Text',`<label class="f">Text<input data-f="t" value=""></label>`,v=>{ if(v.t) this.place({type:'txt',p:{text:v.t}},x+20,y+6); }); break; }
      case 'power': if(this.power) return; this.power=true; this.paused=false; this.resetSim(); this.settle(); this.record(); this.render(); break;
      case 'stop': if(!this.power) return; this.power=false; this.paused=false; this.render(); break;
      case 'pwr': case 'toggle': this.cmd(this.power?'stop':'power'); break;
      case 'pause': if(!this.power) return; this.paused=!this.paused; this.render(); break;
      case 'aopt': this.dialog('Analysis Options',`<div class="ptabs"><span class="on">Global</span><span>DC</span><span>Transient</span><span>Device</span><span>Instruments</span></div><div class="tabp"><label class="f">Temperature, °C<input value="27" disabled></label><label class="f">Режим<input value="логический (0/1), без задержек" disabled></label><div style="font-size:11px;color:#444">Параметры аналогового моделирования (SPICE) в учебной копии не используются.</div></div>`,null,true); break;
      case 'graph': this.analog('Display Graphs'); break;
      case 'arrange': { let x=8,y=8; Object.values(this.bins).concat(Object.values(this.wins)).forEach(w=>{ this.place_(w,x,y); x+=w.offsetWidth+8; if(x>this.mdi.clientWidth-120){ x=8; y+=Math.max(60,w.offsetHeight)+8; } }); break; }
      case 'circ': this.mdi.querySelectorAll('.fw.act').forEach(x=>x.classList.remove('act')); this.ct.classList.remove('ina'); this.el.focus({preventScroll:true}); break;
      case 'desc': if(this.wins.desc){ this.front(this.wins.desc); break; } this.wins.desc=this.mkWin('desc','Description',`<textarea data-desc spellcheck="false" style="width:340px;height:160px;font:12px Consolas,monospace;border:1px solid #7a7a7a;resize:both">${esc(this.desc||'')}</textarea>`,30,30); this.wins.desc.querySelector('textarea').focus(); break;
      case 'help': case 'hidx': this.dialog('Electronics Workbench Help',HELP,null,true,{w:560}); break;
      case 'rel': this.dialog('Release Notes','<div class="help"><b>Учебная копия EWB 5.12 (цифровая часть).</b><br>• Окно, меню, панели деталей и приборы повторяют Electronics Workbench 5.12.<br>• Моделирование — логическое (0/1), мгновенное; аналоговые детали и анализы показывают сообщение.<br>• Микросхема из библиотеки ставится одной секцией (например, 7408 — один элемент И).<br>• Edit → Undo (Ctrl+Z) — добавлено для удобства; Ctrl+Shift+Z — вернуть.<br>• Схема сама сохраняется в браузере; файлы — *.ewbs.<br>• Генератор слов работает до 20 Гц, чтобы изменения было видно глазом.</div>',null,true,{w:520}); break;
      case 'about': this.dialog('About Electronics Workbench','<div class="help" style="display:flex;gap:14px"><div style="flex:none;width:92px;height:110px;background:#fff200;border:1px solid #c8b400;display:flex;align-items:center;justify-content:center;font:900 15px Arial;color:#1a1aa0;text-align:center;line-height:1.1">EWB<br>5.12</div><div><b>Electronics Workbench</b><br>Version 5.12 — учебная копия интерфейса для курса «Архитектура ЭВМ».<br><br>Цифровая логика: вентили, триггеры, счётчики, шифраторы, мультиплексоры, сумматоры; приборы Word Generator, Logic Analyzer, Logic Converter.<br><br>Оригинальная программа — Interactive Image Technologies Ltd.</div></div>',null,true,{w:500}); break;
    } }
  setZoom(z){ this.zp=z; this.zoom=z/80; const s=this.el.querySelector('.zsel'); if(s) s.value=z; this.render(); }
  askSave(go){ const cur=JSON.stringify(this.dump()); const empty=!this.comps.length; if(empty||cur===this.saved||this.opt.task) return go();
    this.msg('Save changes to «'+esc(this.file==='Untitled.ewb'?'Untitled':this.file)+'»?','warn',[['y','Yes'],['n','No'],['x','Cancel']],b=>{ if(b==='y'){ this.cmd('save'); go(); } else if(b==='n') go(); }); }
  saveTo(name,browser){ const j=this.dump(); j.file=name; const txt=JSON.stringify(j,null,1);
    if(browser){ try{ const all=JSON.parse(localStorage.getItem('ewbs:lib')||'{}'); all[name.replace(/\.ewbs?$/,'')]=j; localStorage.setItem('ewbs:lib',JSON.stringify(all)); }catch(_){ return this.msg('Браузер не дал сохранить.','err'); } }
    else saveFile(name.replace(/\.ewbs?$/,'')+'.ewbs',txt);
    this.saved=JSON.stringify(this.dump()); this.render(); this.setHint('Saved: '+name); }
  openDlg(){ let lib={}; try{ lib=JSON.parse(localStorage.getItem('ewbs:lib')||'{}'); }catch(_){} const ex=A.examples?A.examples():[]; const names=Object.keys(lib); let sel=null;
    const rows=[...names.map(n=>`<div data-o="b:${esc(n)}"><b style="width:18px">📄</b><span>${esc(n)}.ewb</span></div>`),...ex.map((x,i)=>`<div data-o="e:${i}"><b style="width:18px">📘</b><span>${esc(x.t)}</span></div>`)].join('');
    this.dialog('Open Circuit File',`<div style="display:grid;grid-template-columns:1fr;gap:6px"><div>Схемы в браузере и примеры из лаб:</div><div class="mlist ol" style="height:210px">${rows||'<div>— пусто —</div>'}</div><div style="display:flex;gap:6px"><button class="wbtn" data-d="file">Файл с компьютера (*.ewbs)…</button><button class="wbtn" data-d="delb">Удалить схему из браузера</button></div></div>`,(v,k)=>{
        if(k==='file'){ this.fin.click(); return; }
        if(!sel) return; const [t,id]=[sel.slice(0,1),sel.slice(2)];
        if(k==='delb'){ if(t!=='b') return; delete lib[id]; try{ localStorage.setItem('ewbs:lib',JSON.stringify(lib)); }catch(_){} this.setHint('Deleted: '+id); return; }
        this.snapshot(); this.closeInstr(); if(t==='b'){ this.loadCirc(lib[id]); this.file=id+'.ewb'; this.desc=lib[id].desc||''; this.saved=JSON.stringify(this.dump()); this.render(); }
        else { const x=ex[+id]; const c=x.make(); this.loadCirc(c); this.status=c.status||''; if(!this.power) this.cmd('power'); else this.render(); } },false,{w:460,buttons:[['ok','Open'],['x','Cancel']],
      init:d=>{ const L=d.querySelector('.ol'); L.addEventListener('click',e=>{ const r=e.target.closest('[data-o]'); if(!r) return; sel=r.dataset.o; L.querySelectorAll('[data-o]').forEach(x=>x.classList.toggle('on',x===r)); }); L.addEventListener('dblclick',e=>{ if(e.target.closest('[data-o]')) d.querySelector('[data-d=ok]').click(); }); }}); }
  closeInstr(){ Object.keys(this.wins).forEach(k=>{ if(k!=='desc'){ this.wins[k].remove(); delete this.wins[k]; } }); }
  svgText(){ const svg=this.svg.outerHTML.replace(/<circle class="pin[^>]*>/g,'').replace(/<polyline class="wh"[^>]*>/g,''); const st='<style>.ld{stroke:#000;stroke-width:1.2}.bd{fill:#fff;stroke:#000;stroke-width:1.3}.ln{fill:none;stroke:#000;stroke-width:1.3}.lv{stroke:#000;stroke-width:2.2}.wire{fill:none;stroke:#000;stroke-width:1}.w1{stroke:#e8000b}.w0{stroke:#1a5fd0}text{font:11px Arial}.lb{fill:#4848f0}.rid{font-size:9.5px}.sm{font-size:8.5px}.pn{font-size:9.5px}</style>'; return svg.replace(/<svg([^>]*)>/,'<svg xmlns="http://www.w3.org/2000/svg"$1>'+st).replace(/class="cmp sel"/g,'class="cmp"'); }
  saveSvg(){ saveFile(this.file.replace(/\.ewbs?$/,'')+'.svg',this.svgText()); }
  copyBmp(){ const img=new Image(), W_=this.W, H_=this.H; img.onload=()=>{ const cv=document.createElement('canvas'); cv.width=W_; cv.height=H_; const g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,W_,H_); g.drawImage(img,0,0);
      cv.toBlob(b=>{ try{ navigator.clipboard.write([new ClipboardItem({'image/png':b})]).then(()=>this.setHint('Схема скопирована как картинка — вставь в Word (Ctrl+V)'),()=>this.dlBlob(b)); }catch(_){ this.dlBlob(b); } }); };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(this.svgText()); }
  dlBlob(b){ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=this.file.replace(/\.ewbs?$/,'')+'.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); this.setHint('Буфер обмена недоступен — картинка сохранена файлом .png'); }
  exportNet(){ const nn={}; let k=0; const nid=p=>{ const r=this.net[p]; if(!r) return 'NC'; if(nn[r]==null) nn[r]=++k; return nn[r]; };
    const L=['* Electronics Workbench netlist — '+this.file,'* учебная копия: цифровые элементы'];
    this.comps.forEach(c=>{ if(c.type==='txt') return; const g=geom(c); L.push(`${c.id} ${c.type==='gate'?c.p.k+(c.p.n||''):c.type}${c.p.model?' ('+c.p.model+')':''} `+Object.keys(g.pins).map(p=>p+'='+nid(c.id+'.'+p)).join(' ')+(c.p.label?' ; '+c.p.label:'')); });
    L.push('.end'); saveFile(this.file.replace(/\.ewbs?$/,'')+'.cir',L.join('\n')); }
  schemOpts(){ const so=this.so;
    this.dialog('Schematic Options',`<div class="ptabs"><span class="on" data-tab="0">Grid</span><span data-tab="1">Show/Hide</span><span data-tab="2">Wiring</span></div>
      <div class="tabp" data-p="0"><label style="display:flex;gap:6px"><input type="checkbox" data-f="grid"${so.grid?' checked':''}>Show grid</label><label style="display:flex;gap:6px"><input type="checkbox" checked disabled>Use grid (детали прилипают к шагу 5)</label></div>
      <div class="tabp" data-p="1" hidden><label style="display:flex;gap:6px"><input type="checkbox" data-f="labels"${so.labels?' checked':''}>Show labels</label><label style="display:flex;gap:6px"><input type="checkbox" data-f="rid"${so.rid?' checked':''}>Show reference ID</label><label style="display:flex;gap:6px"><input type="checkbox" disabled>Show nodes</label><label style="display:flex;gap:6px"><input type="checkbox" disabled checked>Show values</label></div>
      <div class="tabp" data-p="2" hidden><label style="display:flex;gap:6px"><input type="checkbox" checked disabled>Autowire on connection</label><label style="display:flex;gap:6px"><input type="checkbox" data-f="lv"${so.lv?' checked':''}>Цвет проводов по уровню: 1 — красный, 0 — синий (только на сайте)</label></div>`,v=>{
      Object.assign(so,{grid:!!v.grid,labels:!!v.labels,rid:!!v.rid,lv:!!v.lv}); this.colorLv=so.lv; try{ localStorage.setItem('ewbs:so',JSON.stringify(so)); }catch(_){} this.render(); },false,{w:420,init:d=>this.tabs(d)}); }
  tabs(d){ d.querySelector('.ptabs').addEventListener('click',e=>{ const t=e.target.closest('[data-tab]'); if(!t) return; d.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x===t)); d.querySelectorAll('[data-p]').forEach(p=>p.hidden=p.dataset.p!==t.dataset.tab); }); }
  toShelf(c){ this.snapshot(); this.comps=this.comps.filter(x=>x!==c); this.wires=this.wires.filter(w=>w.f.split('.')[0]!==c.id&&w.t.split('.')[0]!==c.id); if(this.wins[c.id]){ this.wins[c.id].remove(); delete this.wins[c.id]; }
    this.sel.delete(c.id); this.rebuild(); if(this.power) this.settle(); this.render(); this.refreshBins(); this.autosave(); }
  pulseClocks(){ const cl=this.comps.filter(c=>c.type==='clk'); if(!cl.length) return; cl.forEach(c=>c.st.v=1); this.settle(); this.record(); cl.forEach(c=>c.st.v=0); this.settle(); this.record(); this.render(true); }
  clearVia(ids){ const S=ids||this.sel; this.wires.forEach(w=>{ if(S.has(w.f.split('.')[0])||S.has(w.t.split('.')[0])){ delete w.via; } }); }
  copy(){ const ids=new Set([...this.sel].filter(id=>!INSTR.includes(this.byId(id).type))); if(!ids.size) return this.msg('An instrument cannot be copied.','info'); this.clip={comps:this.comps.filter(c=>ids.has(c.id)).map(c=>JSON.parse(JSON.stringify({id:c.id,type:c.type,x:c.x,y:c.y,rot:c.rot,fx:c.fx,fy:c.fy,p:c.p}))),wires:this.wires.filter(w=>ids.has(w.f.split('.')[0])&&ids.has(w.t.split('.')[0])).map(w=>({f:w.f,t:w.t}))}; this.render(); }
  paste(at){ if(!this.clip) return; this.snapshot(); const map={}; this.sel=new Set(); const x0=Math.min(...this.clip.comps.map(c=>c.x)), y0=Math.min(...this.clip.comps.map(c=>c.y));
    const dx=at?snap(at[0])-x0:30, dy=at?snap(at[1])-y0:30;
    this.clip.comps.forEach(c=>{ const id=this.newId(c.type); map[c.id]=id; const n=this.norm(Object.assign({},c,{id,x:c.x+dx,y:c.y+dy})); this.comps.push(n); this.sel.add(id); });
    this.clip.wires.forEach(w=>{ const [a,ap]=w.f.split('.'),[b,bp]=w.t.split('.'); this.wires.push({f:map[a]+'.'+ap,t:map[b]+'.'+bp}); });
    if(!at){ this.clip.comps.forEach(c=>{ c.x+=30; c.y+=30; }); } this.rebuild(); if(this.power) this.settle(); this.render(); this.autosave(); }
  delSel(quiet){ if(!this.sel.size&&this.selW<0) return;
    if(this.selW>=0&&!this.sel.size){ this.snapshot(); this.wires.splice(this.selW,1); this.selW=-1; }
    else { const ins=[...this.sel].map(id=>this.byId(id)).filter(c=>INSTR.includes(c.type));
      if(ins.length&&!quiet&&this.sel.size===ins.length) return this.msg('An instrument cannot be deleted; return it to the shelf.<br>Прибор не удаляют, а возвращают на полку: правая кнопка по прибору → <b>Return to Shelf</b> (или перетащи его на панель инструментов).','info',[['s','Return to Shelf'],['x','Cancel']],b=>{ if(b==='s') ins.forEach(c=>this.toShelf(c)); });
      this.snapshot(); const ids=new Set([...this.sel].filter(id=>!INSTR.includes(this.byId(id).type))); this.comps=this.comps.filter(c=>!ids.has(c.id)||c.locked); this.wires=this.wires.filter(w=>!ids.has(w.f.split('.')[0])&&!ids.has(w.t.split('.')[0])); this.sel=new Set(); }
    this.rebuild(); if(this.power) this.settle(); this.render(); this.autosave(); }
  /* ---------- свойства детали (вкладки как в EWB) ---------- */
  props(c){ if(!c) return; const p=c.p, t=c.type, d=p.disp||{}, nm=t==='gate'?(p.k==='not'?'NOT':(p.k==='buf'?'Buffer':(p.n||2)+'-Input '+p.k.toUpperCase()))+' Gate':t==='lamp'?'Red Probe':t==='conn'?'Connector':t==='txt'?'Text':t==='sw'?'Switch':t==='clk'?'Clock':t==='vcc'?(p.vdd?'Vdd':'Vcc')+' Source':t==='gnd'?'Ground':t==='hex'?'Decoded Seven-Segment Display':(p.model?p.model+' — ':'')+(NAME[t]||t).replace(/ (.*)/,'');
    const multi=t==='gate'&&p.k!=='not'&&p.k!=='buf', ff=['jk','d','t','rs','cnt4','cnt10','reg4'].includes(t), chip=!!CH[t]||['ha','fa'].includes(t);
    const tabs=[['Label',`<label class="f">Label<input data-f="label" value="${esc(p.label||'')}"${t==='txt'?' disabled':''}></label><label class="f">Reference ID<input data-f="rid" value="${esc(c.id)}"></label>`]];
    if(t==='txt') tabs.unshift(['Text',`<label class="f">Text<input data-f="text" value="${esc(p.text||'')}"></label><label class="f">Color<select data-f="col">${[['#1a1a8a','Blue'],['#000000','Black'],['#c00000','Red'],['#008000','Green']].map(([v,n])=>`<option value="${v}"${(p.col||'#1a1a8a')===v?' selected':''}>${n}</option>`).join('')}</select></label>`]);
    if(t==='sw') tabs.push(['Value',`<label class="f">Key<input data-f="key" maxlength="5" value="${esc(p.key||'Space')}"></label><label style="display:flex;gap:6px"><input type="checkbox" data-f="on"${p.on?' checked':''}>Сейчас включён (1)</label><div style="font-size:11px;color:#444">Клавиша переключает ключ во время моделирования: буква, цифра или Space.</div>`]);
    if(t==='clk') tabs.push(['Value',`<label class="f">Frequency<span><input type="number" min="0.1" max="20" step="0.1" data-f="fv" value="${p.fv||1}" style="width:70px"> Hz</span></label><label class="f">Duty cycle<span><input value="50" disabled style="width:70px"> %</span></label><label class="f">Voltage<span><input value="5" disabled style="width:70px"> V</span></label><div style="font-size:11px;color:#444">В EWB частота любая; на сайте до 20 Гц, чтобы счёт был виден глазом.</div>`]);
    if(t==='vcc') tabs.push(['Value',`<label class="f">Voltage<span><input value="5" disabled style="width:70px"> V</span></label>`]);
    if(t==='lamp') tabs.push(['Value',`<label class="f">Color<select data-f="col">${[['red','Red'],['green','Green'],['blue','Blue'],['yellow','Yellow']].map(([k,n])=>`<option value="${k}"${(p.col||'red')===k?' selected':''}>${n}</option>`).join('')}</select></label><label class="f">Threshold voltage<span><input value="2.5" disabled style="width:70px"> V</span></label>`]);
    if(multi) tabs.push(['Number of Inputs',`<div style="display:grid;grid-template-columns:repeat(4,auto);gap:6px 16px;justify-content:start">${[2,3,4,5,6,7,8].map(n=>`<label style="display:flex;gap:5px"><input type="radio" name="ni${this.uid}" data-f="n" value="${n}"${(p.n||2)===n?' checked':''}>${n}</label>`).join('')}</div><label class="f" style="margin-top:6px">Тип элемента<select data-f="k">${['and','or','nand','nor','xor','xnor'].map(k=>`<option value="${k}"${p.k===k?' selected':''}>${GATE_RU[k]}</option>`).join('')}</select></label>`]);
    if(t==='gate'||ff||chip){ const mods=[].concat(FAM.ttl,FAM.ttl1,FAM.ttl2,FAM.ttl3,FAM.cmos).filter(m=>m.it.type===t&&(t!=='gate'||m.it.p.k===p.k));
      tabs.push(['Models',`<div style="display:grid;grid-template-columns:100px 1fr;gap:8px"><div><div>Library</div><div class="mlist" style="height:110px"><div class="on">default</div></div></div><div><div>Model</div><div class="mlist" style="height:110px"><div class="${!p.model?'on':''}"><b>ideal</b><span>идеальная модель</span></div>${mods.map(m=>`<div class="${p.model===m.m?'on':''}"><b>${m.m}</b><span>${esc(m.t)}</span></div>`).join('')}</div></div></div>
        ${['jk','d','t','cnt4','cnt10','reg4'].includes(t)?`<label class="f">Срабатывание<select data-f="edge"><option value="rise"${p.edge!=='fall'?' selected':''}>по фронту 0→1</option><option value="fall"${p.edge==='fall'?' selected':''}>по спаду 1→0 (кружок у C)</option></select></label>`:''}
        ${t==='jk'||t==='d'?`<label style="display:flex;gap:6px"><input type="checkbox" data-f="async"${p.async?' checked':''}>Асинхронные входы PR и CLR (активный 0)</label>`:''}${ff?`<label class="f">Начальное состояние Q<select data-f="q0"><option value="0"${!p.q0?' selected':''}>0</option><option value="1"${p.q0?' selected':''}>1</option></select></label>`:''}`]); }
    tabs.push(['Fault',`<div style="display:grid;gap:5px">${['None','Leakage','Short','Open'].map((f,i)=>`<label style="display:flex;gap:6px"><input type="radio" ${i===0?'checked':'disabled'}>${f}</label>`).join('')}</div><div style="font-size:11px;color:#444">Неисправности моделируются только в аналоговом режиме EWB.</div>`]);
    if(t!=='txt') tabs.push(['Display',`<label style="display:flex;gap:6px"><input type="checkbox" data-f="own"${!d.own?' checked':''}>Use Schematic Options global setting</label><label style="display:flex;gap:6px"><input type="checkbox" data-f="lb"${(d.own?d.lb!==false:this.so.labels)?' checked':''}>Show labels</label><label style="display:flex;gap:6px"><input type="checkbox" data-f="srid"${(d.own?d.rid:this.so.rid)?' checked':''}>Show reference ID</label>`]);
    if(t==='gate'||t==='clk'||ff) tabs.push(['Analysis Setup',`<label style="display:flex;gap:6px"><input type="checkbox" checked disabled>Use global temperature</label><label class="f">Temperature<span><input value="27" disabled style="width:70px"> °C</span></label>`]);
    const body=`<div class="ptabs">${tabs.map(([n],i)=>`<span data-tab="${i}" class="${i===0?'on':''}">${n}</span>`).join('')}</div>${tabs.map(([n,h],i)=>`<div class="tabp" data-p="${i}"${i?' hidden':''}>${h}</div>`).join('')}`;
    let model=p.model;
    this.dialog(nm+' Properties',body,v=>{ this.snapshot();
      if(v.label!==undefined&&t!=='txt') p.label=v.label; if(v.key!==undefined){ p.key=v.key.length===1?v.key.toUpperCase():(v.key||'Space'); } if(v.on!==undefined) p.on=v.on?1:0;
      if(v.n!==undefined) p.n=+v.n; if(v.k!==undefined) p.k=v.k; if(v.fv!==undefined){ p.fv=Math.max(0.1,Math.min(20,+v.fv||1)); p.f=p.fv+' Hz'; }
      if(v.col!==undefined) p.col=v.col; if(v.edge!==undefined) p.edge=v.edge; if(v.async!==undefined) p.async=v.async?1:0; if(v.q0!==undefined){ p.q0=+v.q0; if(!this.power) c.st.q=p.q0; }
      if(v.text!==undefined) p.text=v.text; if(model!==undefined) p.model=model||undefined;
      if(v.own!==undefined){ p.disp=v.own?undefined:{own:1,lb:!!v.lb,rid:!!v.srid}; }
      if(v.rid&&v.rid!==c.id){ const nid=v.rid.trim().replace(/[^\wА-Яа-я]/g,''); if(nid&&!this.byId(nid)&&!/\./.test(nid)){ const old=c.id; this.wires.forEach(w=>{ ['f','t'].forEach(k=>{ const [a,b]=w[k].split('.'); if(a===old) w[k]=nid+'.'+b; }); }); if(this.sel.has(old)){ this.sel.delete(old); this.sel.add(nid); } c.id=nid; } else if(nid!==c.id) this.msg('Reference ID «'+esc(v.rid)+'» уже занят или недопустим.','err'); }
      this.clearVia(new Set([c.id])); this.rebuild(); if(this.power) this.settle(); this.render(); this.autosave(); },false,{w:440,init:dd=>{ this.tabs(dd);
        dd.querySelectorAll('.mlist').forEach((L,li)=>{ if(li!==1) return; L.addEventListener('click',e=>{ const r=e.target.closest('.mlist>div'); if(!r) return; L.querySelectorAll('div').forEach(x=>x.classList.toggle('on',x===r)); const b=r.querySelector('b').textContent; model=b==='ideal'?'':b; }); }); }}); }
  /* ---------- постановка детали ---------- */
  place(item,x,y){ this.snapshot(); const c=this.norm(Object.assign({},item,{id:this.newId(item.type)})); const g=geom(c);
    c.x=Math.max(0,snap(x-g.w/2)); c.y=Math.max(0,snap(y-g.h/2)); if(c.type==='sw'){ const used=new Set(this.comps.filter(q=>q.type==='sw').map(q=>q.p.key)); const nx='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(k=>!used.has(k))||'A'; c.p=Object.assign({},c.p,{key:nx,label:nx}); }
    if(c.type==='lamp'&&!c.p.label) c.p.label=''; if(c.type==='wg') this.wgReset(c); this.comps.push(c); this.sel=new Set([c.id]); this.selW=-1;
    this.rebuild(); if(this.power) this.settle(); this.render(); this.autosave(); this.el.focus({preventScroll:true}); if(INSTR.includes(c.type)) this.refreshBins(); }
  /* ---------- мышь на поле ---------- */
  pt(e){ const r=this.svg.getBoundingClientRect(); return [(e.clientX-r.left)/this.zoom,(e.clientY-r.top)/this.zoom]; }
  down(e){ if(e.button===2) return; this.el.focus({preventScroll:true}); const [x,y]=this.pt(e);
    this.closeMenu(); this.cmd('circ'); if(this.placing){ this.placeTile(this.placing,x,y); return; }
    const pin=e.target.closest('[data-pin]'), cmp=e.target.closest('[data-id]'), wh=e.target.closest('[data-w]');
    if(pin){ e.preventDefault(); return this.startWire(e,pin.dataset.pin); }
    if(this.wireFrom&&!pin){ this.wireFrom=null; this.tmp=null; this.el.classList.remove('wiring'); if(!wh){ this.render(); } }
    if(cmp){ const c=this.byId(cmp.dataset.id); e.preventDefault();
      if(c.type==='sw'&&!e.shiftKey){ let moved=false; const sx=e.clientX, sy=e.clientY; const mv=ev=>{ if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>4){ moved=true; window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); this.startDrag(ev,c,x,y,true); } };
        const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); if(!moved){ this.toggle(c); this.sel=new Set([c.id]); this.selW=-1; this.render(true); } };
        window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); return; }
      return this.startDrag(e,c,x,y); }
    if(wh){ e.preventDefault(); const i=+wh.dataset.w; this.sel=new Set(); this.selW=i; this.render(); return this.dragWire(e,i); }
    // рамка выделения
    this.sel=new Set(); this.selW=-1; const x0=x,y0=y; let band=null;
    const mv=ev=>{ const [x1,y1]=this.pt(ev); band=[Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0)]; this.tmp=`<rect class="band" x="${band[0]}" y="${band[1]}" width="${band[2]}" height="${band[3]}"/>`; this.render(true); };
    const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); this.tmp=null;
      if(band){ this.comps.forEach(c=>{ const g=geom(c); if(c.x+g.w/2>=band[0]&&c.x+g.w/2<=band[0]+band[2]&&c.y+g.h/2>=band[1]&&c.y+g.h/2<=band[1]+band[3]) this.sel.add(c.id); }); } this.render(); };
    window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); }
  startDrag(e,c,x,y,noSel){ if(!this.sel.has(c.id)){ this.sel= e.shiftKey? new Set([...this.sel,c.id]) : new Set([c.id]); } this.selW=-1;
    const start=[...this.sel].map(id=>{ const q=this.byId(id); return [q,q.x,q.y]; }); let moved=false, snapped=false; const [x0,y0]=this.pt(e);
    const mv=ev=>{ const [x1,y1]=this.pt(ev); const dx=x1-x0, dy=y1-y0; if(!moved&&Math.abs(dx)+Math.abs(dy)<3) return; if(!moved){ this.snapshot(); moved=true; this.clearVia(); }
      start.forEach(([q,qx,qy])=>{ q.x=Math.max(0,snap(qx+dx)); q.y=Math.max(0,snap(qy+dy)); }); this.render(true); };
    const up=ev=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); const el=moved&&document.elementFromPoint(ev.clientX,ev.clientY);
      if(el&&el.closest&&el.closest('.e-tb,.bin')&&start.some(([q])=>INSTR.includes(q.type))){ start.forEach(([q,qx,qy])=>{ q.x=qx; q.y=qy; }); start.filter(([q])=>INSTR.includes(q.type)).forEach(([q])=>this.toShelf(q)); return; } // прибор вернули на полку
      if(moved) this.autosave(); this.render(); };
    window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); this.render(true); }
  dragWire(e,i){ const w=this.wires[i]; const pts=w._pts||[]; const [x0,y0]=this.pt(e);
    // ищем ближайший внутренний отрезок: вертикальный → двигаем по x, горизонтальный → по y
    let best=null, bd=1e9; for(let k=1;k<pts.length-2;k++){ const a=pts[k], b=pts[k+1]; const vert=a[0]===b[0]; const d=vert?Math.abs(x0-a[0]):Math.abs(y0-a[1]); if(d<bd){ bd=d; best={vert}; } }
    if(!best) return; let moved=false;
    const mv=ev=>{ const [x1,y1]=this.pt(ev); if(!moved){ this.snapshot(); moved=true; delete w.via; } if(best.vert){ w.xm=snap(x1); delete w.ym; } else { w.ym=snap(y1); delete w.xm; } this.render(true); };
    const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); if(moved) this.autosave(); };
    window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); }
  startWire(e,from){ const [fc,fp]=from.split('.'); const a=pinInfo(this.byId(fc),fp);
    if(this.wireFrom&&this.wireFrom!==from){ const f=this.wireFrom; this.wireFrom=null; this.el.classList.remove('wiring'); this.tmp=null; return this.addWire(f,from); }
    this.el.classList.add('wiring'); let moved=false;
    const mv=ev=>{ const [x,y]=this.pt(ev); moved=true; this.tmp=`<polyline class="wire tmp" points="${a.x},${a.y} ${x},${a.y} ${x},${y}"/>`; this.render(true); };
    const up=ev=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up);
      if(!moved){ this.wireFrom=from; this.tmp=`<circle cx="${a.x}" cy="${a.y}" r="6" fill="none" stroke="#e8000b" stroke-width="2"/>`; this.render(true); this.st1.textContent='Провод начат от '+this.pinName(from)+'. Щёлкни второй вывод (или пустое место — отмена).'; return; }
      this.el.classList.remove('wiring'); this.tmp=null;
      const el=document.elementFromPoint(ev.clientX,ev.clientY); const pin=el&&el.closest&&el.closest('[data-pin]'), wh=el&&el.closest&&el.closest('[data-w]');
      if(pin&&pin.dataset.pin!==from) return this.addWire(from,pin.dataset.pin);
      if(wh){ const [x,y]=this.pt(ev); return this.joinWire(from,+wh.dataset.w,x,y); }
      this.render(); };
    window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); }
  pinName(k){ const [c,p]=k.split('.'); const q=this.byId(c); return (q&&q.p.label?q.p.label:c)+'.'+(p==='Qn'?"Q'":p); }
  addWire(a,b){ if(a===b) return; if(this.wires.some(w=>(w.f===a&&w.t===b)||(w.f===b&&w.t===a))){ this.render(); return this.setHint('Такой провод уже есть'); }
    const ia=this.pinDir(a), ib=this.pinDir(b);
    if(ia==='out'&&ib==='out'&&this.net[a]!==this.net[b]){ this.setHint('Два выхода соединять нельзя — получится конфликт уровней'); this.render(); return; }
    const same=this.net[a]&&this.net[a]===this.net[b]; if(same){ this.render(); return this.setHint('Эти выводы уже в одной цепи'); }
    this.snapshot(); const [f,t]= ib==='out'&&ia!=='out'?[b,a]:[a,b]; this.wires.push({f,t}); this.rebuild(); if(this.power){ this.settle(); this.record(); } this.render(); this.autosave(); }
  pinDir(k){ const [c,p]=k.split('.'); const q=this.byId(c); const g=geom(q); return g.pins[p]?g.pins[p][2]:'in'; }
  joinWire(from,i,x,y){ const w=this.wires[i]; const pts=w._pts; let best=null,bd=1e9;
    for(let k=0;k<pts.length-1;k++){ const [a,b]=[pts[k],pts[k+1]]; let px,py; if(a[0]===b[0]){ px=a[0]; py=Math.max(Math.min(a[1],b[1]),Math.min(Math.max(a[1],b[1]),y)); } else { py=a[1]; px=Math.max(Math.min(a[0],b[0]),Math.min(Math.max(a[0],b[0]),x)); } const d=Math.hypot(px-x,py-y); if(d<bd){ bd=d; best=[px,py]; } }
    this.snapshot(); const id=this.newId('conn'); this.comps.push(this.norm({id,type:'conn',x:best[0]-4,y:best[1]-4}));
    const [f,t]=[w.f,w.t]; this.wires.splice(i,1); this.wires.push({f,t:id+'.n'},{f:id+'.n',t},{f:id+'.n',t:from}); this.fixDir(); this.rebuild(); if(this.power){ this.settle(); this.record(); } this.render(); this.autosave(); }
  fixDir(){ this.wires.forEach(w=>{ if(this.pinDir(w.t)==='out'&&this.pinDir(w.f)!=='out'){ const x=w.f; w.f=w.t; w.t=x; } }); }
  toggle(c){ this.snapshot(); c.p.on=c.p.on?0:1; if(this.power){ this.settle(); this.record(); } this.render(true); this.autosave(); }
  key_(e){ if(e.target.closest('input,textarea,select')||e.target.closest('.edlg')) return; const k=e.key, ctrl=e.ctrlKey||e.metaKey;
    if(this.menu){ if(this.menuKey(e)) e.preventDefault(); return; }
    this.altOnly=k==='Alt'; if(k==='Alt'){ e.preventDefault(); this.el.classList.add('alt'); return; }
    if(e.altKey&&!ctrl){ const m=[...this.mbar.children].find(s=>s.dataset.menu[0].toLowerCase()===k.toLowerCase()); if(m){ e.preventDefault(); this.altOnly=false; this.el.classList.add('alt'); this.openMenu(m); return; } }
    const CK={z:e.shiftKey?'redo':'undo',c:'copy',x:'cut',v:'paste',a:'all',s:'save',o:'open',n:'new',p:'print',r:'rot',g:'power',t:'stop',y:'aopt',w:'arrange',d:'desc',i:'bmp',b:'sub','+':'zin','=':'zin','-':'zout'};
    if(ctrl&&!e.altKey&&CK[k.toLowerCase()]){ e.preventDefault(); this.pastePt=null; return this.cmd(CK[k.toLowerCase()]); }
    if(k==='F9'){ e.preventDefault(); return this.cmd('pause'); } if(k==='F1'){ e.preventDefault(); return this.cmd('help'); }
    if(k==='Delete'||k==='Backspace'){ e.preventDefault(); return this.delSel(); }
    if(k==='Escape'){ if(this.placing) this.cancelPlace(); this.wireFrom=null; this.tmp=null; this.el.classList.remove('wiring'); this.sel=new Set(); this.selW=-1; return this.render(); }
    if(k.startsWith('Arrow')&&this.sel.size){ e.preventDefault(); this.snapshot(); const d=e.shiftKey?20:5; this.sel.forEach(id=>{ const c=this.byId(id); if(k==='ArrowLeft') c.x=Math.max(0,c.x-d); if(k==='ArrowRight') c.x+=d; if(k==='ArrowUp') c.y=Math.max(0,c.y-d); if(k==='ArrowDown') c.y+=d; }); this.clearVia(); this.render(); this.autosave(); return; }
    const key=k===' '?'Space':k.length===1?k.toUpperCase():k; const sws=this.comps.filter(c=>c.type==='sw'&&String(c.p.key||'Space').toUpperCase()===key.toUpperCase());
    if(sws.length&&!ctrl&&!e.altKey){ e.preventDefault(); this.snapshot(); sws.forEach(c=>c.p.on=c.p.on?0:1); if(this.power){ this.settle(); this.record(); } this.render(true); this.autosave(); return; }
    if((k==='r'||k==='R')&&this.sel.size) return this.cmd('rot');
    if(k==='+'||k==='=') return this.cmd('zin'); if(k==='-') return this.cmd('zout'); }
  /* ---------- задания с автопроверкой ---------- */
  setTask(t){ this.task=t; this.key='ewbs:task:'+t.id; let loaded=false;
    try{ const s=localStorage.getItem(this.key); if(s){ this.loadCirc(JSON.parse(s),true); loaded=true; } }catch(_){}
    if(!loaded) this.loadCirc(this.taskStart(t),true); this.renderTask(); }
  taskStart(t){ const comps=[], wires=[]; let y=20; const keys='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    (t.inputs||[]).forEach((nm,i)=>{ comps.push({id:'in_'+nm,type:'sw',x:10,y,p:{label:nm,key:(t.keys&&t.keys[i])||keys[i]}}); y+=50; });
    if(t.clock) comps.push({id:'clk',type:'clk',x:10,y:y+10,p:{label:'Clock',f:'1 Hz',fv:1}});
    (t.outputs||[]).forEach((nm,i)=>comps.push({id:'out_'+nm,type:'lamp',x:t.outX||520,y:20+i*40,p:{label:nm}}));
    if(t.hex) comps.push({id:'hx',type:'hex',x:(t.outX||520)+80,y:20,p:{label:'Display'}});
    (t.extra||[]).forEach(c=>comps.push(c));
    return {file:(t.file||t.id)+'.ewb',comps,wires}; }
  renderTask(){ if(!this.taskBox) return; const t=this.task;
    this.taskBox.innerHTML=`<div class="tt">🛠 ${t.title}</div><div class="tx">${t.text}</div><div class="tb2"><button class="btn pri" data-k="check">✔ Проверить схему</button>${t.solution?'<button class="btn" data-k="sol">Показать решение</button>':''}<button class="btn" data-k="reset">Начать заново</button></div><div class="res" hidden></div>`;
    this.taskBox.onclick=e=>{ const b=e.target.closest('[data-k]'); if(!b) return;
      if(b.dataset.k==='check') this.check(); if(b.dataset.k==='reset'){ if(!b.dataset.sure){ b.dataset.sure=1; b.textContent='Точно? Твоя схема удалится'; return; } this.snapshot(); this.loadCirc(this.taskStart(t)); this.renderTask(); }
      if(b.dataset.k==='sol'){ const c=t.solution(); this.snapshot(); this.loadCirc(c); if(!this.power) this.cmd('power'); toast('Загружено решение — можно Ctrl+Z, чтобы вернуть свою схему'); } }; }
  findIO(){ const t=this.task, by=(type,nm)=>this.comps.find(c=>c.type===type&&String(c.p.label||'').trim().toLowerCase()===nm.toLowerCase());
    const ins=(t.inputs||[]).map(nm=>[nm,by('sw',nm)]), outs=(t.outputs||[]).map(nm=>[nm,by('lamp',nm)]); return {ins,outs}; }
  check(){ const t=this.task, box=this.taskBox.querySelector('.res'); const {ins,outs}=this.findIO();
    const miss=[...ins.filter(x=>!x[1]).map(x=>'переключатель «'+x[0]+'»'),...outs.filter(x=>!x[1]).map(x=>'лампочка «'+x[0]+'»')];
    const show=(ok,html)=>{ box.hidden=false; box.className='res '+(ok?'ok':'bad'); box.innerHTML=html; };
    if(miss.length) return show(false,'Не нашёл: '+miss.join(', ')+'. Подписи (Label) должны совпадать с заданием.');
    if(t.only){ const bad=this.comps.filter(c=>c.type==='gate'&&!t.only.includes(c.p.k)); if(bad.length) return show(false,'По условию можно только '+t.only.map(k=>k.toUpperCase()).join(', ')+'. Лишние элементы: '+bad.map(c=>c.p.k.toUpperCase()+' ('+c.id+')').join(', ')+'.'); }
    if(t.gatesOnly){ const ok=['sw','lamp','gate','conn','txt','vcc','gnd','hex','seg7','la','lc','wg','clk']; const bad=this.comps.filter(c=>!ok.includes(c.type)); if(bad.length) return show(false,'Здесь нужно собрать из вентилей (Logic Gates), без готовых микросхем: '+bad.map(c=>NAME[c.type]||c.type).join(', ')+'.'); }
    const wasPw=this.power, keep=this.keepState(), saved=ins.map(x=>x[1].p.on); this.power=true;
    const read=()=>{ const o={}; outs.forEach(([nm,c])=>o[nm]=this.get(c,'i')); return o; };
    const setIn=v=>ins.forEach(([nm,c])=>c.p.on=v[nm]?1:0);
    let bad=[], rows=0;
    try{
      if(t.kind==='comb'){ const n=ins.length; for(let r=0;r<(1<<n);r++){ const v={}; ins.forEach(([nm],i)=>v[nm]=(r>>(n-1-i))&1); if(t.valid&&!t.valid(v)) continue; setIn(v); this.settle(); const got=read(), exp=t.fn(v); rows++;
          if(outs.some(([nm])=>exp[nm]!==undefined&&got[nm]!==exp[nm])) bad.push({v,got,exp}); } }
      else if(t.kind==='seq'){ // последовательность: шаги {in:{...}, clk:bool, exp:{...}}
        this.comps.forEach(c=>{ if(['jk','d','t','rs','cnt4','cnt10','reg4'].includes(c.type)) c.st.q=0; });
        const clks=this.comps.filter(c=>c.type==='clk'); if(t.clock&&!clks.length){ this.power=wasPw; return show(false,'В схеме нет Clock (Sources → Clock).'); }
        clks.forEach(c=>{ c.st.v=0; }); this.settle();
        const steps=typeof t.steps==='function'?t.steps():t.steps; const rel={};
        for(const s of steps){ if(s.in) setIn(Object.assign({},Object.fromEntries(ins.map(([nm,c])=>[nm,c.p.on])),s.in)); this.settle();
          if(s.clk){ clks.forEach(c=>c.st.v=1); this.settle(); clks.forEach(c=>c.st.v=0); this.settle(); }
          if(s.rel) rel[s.rel]=read()[outs[0][0]];
          if(s.exp){ const got=read(); rows++; if(Object.keys(s.exp).some(k=>got[k]!==s.exp[k])) bad.push({v:s.label||s.in||{},got,exp:s.exp,lbl:s.label}); } }
        if(t.relCheck){ rows=steps.filter(s=>s.rel).length; if(!t.relCheck(rel)){ const seq=steps.filter(s=>s.rel).map(s=>(s.label||'старт')+': Q='+rel[s.rel]).join(' → ');
            this.power=wasPw; setIn(Object.fromEntries(ins.map(([nm],i)=>[nm,saved[i]]))); this.restoreState(keep); this.render();
            return show(false,'<b>Q меняется не так.</b> При T = 1 каждый спад C должен переключать Q, при T = 0 — нет. У тебя: '+esc(seq)); } } }
    } finally { setIn(Object.fromEntries(ins.map(([nm],i)=>[nm,saved[i]]))); this.restoreState(keep); this.power=wasPw; this.render(); }
    if(this.unstable) return show(false,'Схема не устанавливается (генерация) — проверь обратные связи.');
    if(!bad.length){ show(true,`<b>Схема работает верно!</b> Проверено ${rows} ${t.kind==='comb'?'комбинаций входов':'шагов'}. ${t.okText||''}`); try{ localStorage.setItem('ewbs:done:'+t.id,'1'); }catch(_){} return; }
    const on=outs.map(x=>x[0]); const head=t.kind==='comb'?ins.map(x=>x[0]):['шаг'];
    show(false,`<b>Есть ошибки: ${bad.length} из ${rows}.</b> ${t.kind==='comb'?'Строки таблицы, где лампочки горят не так, как надо (слева — входы, справа — «надо / у тебя»):':'Шаги, где выходы не совпали:'}<div style="overflow:auto"><table><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}${on.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${bad.slice(0,12).map(b=>`<tr>${t.kind==='comb'?head.map(h=>`<td>${b.v[h]}</td>`).join(''):`<td>${esc(String(b.lbl||''))}</td>`}${on.map(h=>`<td class="${b.exp[h]!==undefined&&b.exp[h]!==b.got[h]?'x':''}">${b.exp[h]===undefined?'—':b.exp[h]} / ${b.got[h]}</td>`).join('')}</tr>`).join('')}</table></div>${bad.length>12?'…и ещё '+(bad.length-12):''}`); }
}
const HELP=`<div class="help">
<b>Окно.</b> Всё как в Electronics Workbench 5.12: меню File / Edit / Circuit / Analysis / Window / Help, панель инструментов (New, Open, Save, Print, Cut, Copy, Paste, Rotate, Flip, Component Properties, Zoom), справа — переключатель питания <b>O/I</b> и кнопка <b>Pause</b>. Наведи на кнопку — появится подсказка, а внизу в строке состояния — что она делает.<br>
<b>Детали.</b> Второй ряд кнопок — полки (Parts Bins): Favorites, Sources, Basic, Diodes, Transistors, Analog ICs, Mixed ICs, Digital ICs, Logic Gates, Digital, Indicators, Controls, Miscellaneous, Instruments. Щёлкни полку — откроется её окно; <b>перетащи</b> значок детали на схему (или щёлкни значок, потом место на схеме). Для лаб нужны: <b>Sources</b> — Ground, Vcc, Clock; <b>Basic</b> — Switch, Connector; <b>Indicators</b> — Red Probe, Seven-Segment Display; <b>Logic Gates</b>; <b>Digital</b> — сумматоры, RS/JK/D-триггеры, MUX, DMX, шифраторы, счётчики; <b>Digital ICs</b> — микросхемы 74xx / 741xx / 4xxx (выбираешь модель в списке). Аналоговые детали стоят на полках, но здесь не моделируются.<br>
<b>Провода.</b> Наведи на вывод детали (появится чёрная точка) → зажми и тяни до другого вывода. Отпустишь на середине провода — появится узел (Connector). Провод можно выделить и удалить (Del), средний отрезок — двигать мышью, цвет — правая кнопка → Wire Properties.<br>
<b>Свойства.</b> Двойной щелчок по детали — окно с вкладками Label (подпись), Value (клавиша переключателя, частота Clock), Number of Inputs (число входов элемента), Models (модель микросхемы, фронт триггера), Display.<br>
<b>Моделирование.</b> Переключатель <b>O/I</b> (Analysis → Activate, Ctrl+G). При включении триггеры и счётчики сбрасываются, как в EWB. Ключи переключаются мышью или своей клавишей ([A], [B], … или [Space]). <b>Pause</b> (F9) — пауза. В строке состояния идёт время моделирования.<br>
<b>Приборы</b> (полка Instruments, каждый по одному). Двойной щелчок по значку прибора открывает его окно (его можно двигать за заголовок).<br>
• <b>Logic Converter</b>: подключи A, B, C… ко входам схемы, Out — к выходу → первая кнопка (схема → таблица), затем «10|1 SIMP → A|B» — упрощённая формула. Можно наоборот: впиши формулу внизу и получи таблицу, схему или схему на NAND. Кружки A…H сверху — сколько переменных; щелчок по столбцу результата — 0 / 1 / X.<br>
• <b>Word Generator</b>: слева список слов (hex) — щёлкни слово и впиши новое; <b>Step</b> — по одному, <b>Burst</b> — от Initial до Final, <b>Cycle</b> — по кругу, <b>Breakpoint</b> — остановка на слове, <b>Pattern…</b> — заполнить (счётчик вверх/вниз, сдвиг). Внизу 16 выходов: бит 15 слева, бит 0 справа.<br>
• <b>Logic Analyzer</b>: 16 входов слева; показывает временные диаграммы, курсоры T1/T2 — щелчком по полю.<br>
<b>Файлы.</b> File → Save / Save As — файл *.ewbs (или хранилище браузера), File → Open — свои схемы и примеры из лаб. Схема ещё и сама сохраняется в браузере. Edit → Copy as Bitmap (Ctrl+I) — картинка схемы для отчёта; File → Export — netlist или рисунок *.svg. Window → Description — заметки к схеме.<br>
<b>Клавиши:</b> Ctrl+N/O/S, Ctrl+X/C/V, Del, Ctrl+A, Ctrl+R — повернуть, Ctrl+Z — отменить, Ctrl+G — питание, F9 — пауза, Ctrl+T — стоп, Ctrl+W — упорядочить окна, Ctrl+D — описание, Ctrl+ +/− — масштаб, стрелки — сдвиг, Alt — меню с клавиатуры, F1 — эта справка.</div>`;
function DEMO(){ return {file:'demo_xor.ewb',comps:[{id:'A',type:'sw',x:30,y:50,p:{label:'A',key:'A'}},{id:'B',type:'sw',x:30,y:130,p:{label:'B',key:'B'}},{id:'U1',type:'gate',x:160,y:70,p:{k:'xor',n:2}},{id:'U2',type:'gate',x:160,y:150,p:{k:'and',n:2}},{id:'L1',type:'lamp',x:290,y:78,p:{label:'S'}},{id:'L2',type:'lamp',x:290,y:158,p:{label:'C'}},{id:'T1',type:'txt',x:30,y:10,p:{text:'Пример: полусумматор. Включи питание O/I (справа вверху) и жми клавиши A и B.'}}],
  wires:[{f:'A.o',t:'U1.i0'},{f:'B.o',t:'U1.i1'},{f:'A.o',t:'U2.i0'},{f:'B.o',t:'U2.i1'},{f:'U1.o',t:'L1.i'},{f:'U2.o',t:'L2.i'}]}; }

A.Studio=Studio; A.geom=geom; A.drawPart=draw; A.CHIPS=CH; A.qm=qm;
/* вкладка EWB (t16) и кнопки «Собрать самому» в лабах */
A.openTask=function(id){ const t=A.TASKS&&A.TASKS[id]; if(!t) return; const box=document.getElementById('ewb-task-host'); if(!box) return;
  if(typeof showTopic==='function') showTopic('t16'); A.initTab(); box.hidden=false; box.innerHTML='<div></div>'; A.taskStudio=new Studio(box.firstChild,{task:t,height:520});
  setTimeout(()=>box.scrollIntoView({behavior:'smooth',block:'start'}),30); };
A.initTab=function(){ const host=document.getElementById('ewb-main'); if(!host||host.dataset.ok) return; host.dataset.ok=1; A.main=new Studio(host,{height:600});
  const tl=document.getElementById('ewb-tasks'); if(tl&&A.TASKS){ const done=id=>{ try{ return localStorage.getItem('ewbs:done:'+id)==='1'; }catch(_){ return false; } };
    const groups={}; Object.entries(A.TASKS).forEach(([id,t])=>{ (groups[t.group||'Задания']=groups[t.group||'Задания']||[]).push([id,t]); });
    tl.innerHTML=Object.entries(groups).map(([g,list])=>`<h3>${esc(g)}</h3><div class="ewbt-list">${list.map(([id,t])=>`<button class="btn" data-task="${id}">${done(id)?'✅ ':''}${esc(t.title)}</button>`).join('')}</div>`).join('');
    tl.addEventListener('click',e=>{ const b=e.target.closest('[data-task]'); if(b) A.openTask(b.dataset.task); }); } };
document.addEventListener('click',e=>{ const b=e.target.closest('[data-ewbtask]'); if(b){ e.preventDefault(); A.openTask(b.dataset.ewbtask); }
  const o=e.target.closest('[data-ewbopen]'); if(o){ e.preventDefault(); const ex=(A.examples?A.examples():[]).find(x=>x.k===o.dataset.ewbopen); if(!ex) return; if(typeof showTopic==='function') showTopic('t16'); A.initTab(); A.main.snapshot(); const c=ex.make(); A.main.loadCirc(c); A.main.status=c.status||''; if(!A.main.power) A.main.cmd('power'); window.scrollTo({top:0}); } });
})();

(function(){ const s=document.getElementById('t16'); if(s&&!s.hidden&&window.ARCH) ARCH.initTab(); })();
