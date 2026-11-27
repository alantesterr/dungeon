/* Схемы для лаб 5–7 (EWB-окна на страницах тем и примеры во вкладке EWB) + задания с автопроверкой.
   Подключается ДО главного скрипта; схемы строятся лениво (вызовы ewbGeom/ewbFromExpr происходят уже после загрузки страницы). */
(function(){
'use strict';
const A=window.ARCH=window.ARCH||{};
/* ---- мини-конструктор ---- */
function B(file){ const c={file,comps:[],wires:[],_n:0};
  c.add=o=>{ c.comps.push(o); return o; };
  c.w=(f,t,via,extra)=>{ const o={f,t}; if(via) o.via=via; Object.assign(o,extra||{}); c.wires.push(o); return o; };
  c.P=(id,pin)=>{ const k=c.comps.find(x=>x.id===id); const g=ewbGeom(k); const q=g.pins[pin]; return [k.x+q[0],k.y+q[1]]; };
  c.node=(x,y)=>{ const id='j'+(++c._n); c.add({id,type:'conn',x:x-4,y:y-4}); return id; };
  /* «шина» от выхода src: вертикаль x=rx, от неё горизонтальные отводы к входам targets [[id,pin],…]; узлы — чёрные точки, как в EWB */
  c.rail=(src,rx,targets)=>{ const [sid,sp]=src.split('.'); const [sx,sy]=c.P(sid,sp);
    const T=targets.map(([id,pin])=>({id,pin,y:c.P(id,pin)[1]}));
    const up=T.filter(t=>t.y<sy).sort((a,b)=>b.y-a.y), dn=T.filter(t=>t.y>=sy).sort((a,b)=>a.y-b.y);
    let entry=null; if(up.length&&dn.length){ entry=c.node(rx,sy); c.w(src,entry+'.i',sx===rx?[]:null); }
    [up,dn].forEach(L=>{ let prev=entry; L.forEach((t,k)=>{ const last=k===L.length-1;
      if(!last){ const j=c.node(rx,t.y); if(prev) c.w(prev+'.n',j+'.i',[]); else c.w(src,j+'.i',[[rx,sy]]); c.w(j+'.n',t.id+'.'+t.pin); prev=j; }
      else { if(prev) c.w(prev+'.n',t.id+'.'+t.pin,[[rx,t.y]]); else c.w(src,t.id+'.'+t.pin,[[rx,sy],[rx,t.y]]); } }); }); };
  c.done=()=>{ delete c.add; delete c.w; delete c.P; delete c.node; delete c.rail; delete c.done; delete c._n; return c; };
  return c; }
const sw=(id,x,y,key,on,label)=>({id,type:'sw',x,y,p:{label:label||id,key,on:on?1:0}});
const gate=(id,k,x,y,n,o)=>({id,type:'gate',x,y,p:{k,n:n||2},out:o==null?undefined:{o}});
const lamp=(id,x,y,label,col)=>({id,type:'lamp',x,y,p:{label:label||id,col}});

/* ===== Триггеры из вентилей ===== */
function crossLatch(c,x,y,k,top,bot,q0){ // два NAND/NOR накрест: g3 (выход Q) сверху, g4 (Q') снизу. top/bot — источники входов
  const g3=c.add(gate('g3',k,x,y,2,q0)), g4=c.add(gate('g4',k,x,y+120,2,1-q0));
  if(top) c.w(top,'g3.i0'); if(bot) c.w(bot,'g4.i1');
  c.w('g3.o','g4.i0',[[x+70,y+15],[x+70,y+50],[x-14,y+90],[x-14,y+130]]);
  c.w('g4.o','g3.i1',[[x+80,y+135],[x+80,y+100],[x-20,y+60],[x-20,y+20]]); }
const RS_STEPS=(lowAct)=>[];
const EX={
  rs_nor:()=>{ const c=B('rs_nor.ewb'); c.add(sw('R',10,35,'R',0)); c.add(sw('S',10,140,'S',0));
    crossLatch(c,160,40,'nor',null,null,0); c.w('R.o','g3.i0'); c.w('S.o','g4.i1',[[130,155],[130,180]]);
    c.add(lamp('Q',290,43,'Q')); c.add(lamp('Qn',290,163,"Q'")); c.w('g3.o','Q.i'); c.w('g4.o','Qn.i');
    Object.assign(c,{la:true,probe:[['S','S.o'],['R','R.o'],['Q','g3.o'],["Q'",'g4.o']],status:'Клавиши S и R. S=1 — установка (Q=1), R=1 — сброс (Q=0), оба 0 — хранение, оба 1 — запрет (Q=Q′=0).',
      steps:[{bin:'basic',show:['S','R'],t:'Basic → 2 Switch: S (Set — установка) и R (Reset — сброс). У RS-триггера на <b>NOR</b> входы активны <b>единицей</b>.'},
        {bin:'gates',show:['g3','g4'],t:'Logic Gates → 2 <b>NOR</b> (ИЛИ-НЕ). Верхний даёт Q, нижний — Q′.'},
        {wires:true,show:[],t:'Главное — <b>перекрёстная обратная связь</b>: выход верхнего NOR → вход нижнего, выход нижнего → вход верхнего. R → свободный вход верхнего (он сбрасывает Q), S → свободный вход нижнего (он сбрасывает Q′, т. е. ставит Q=1).'},
        {bin:'ind',show:['Q','Qn'],t:'Indicators → 2 Red Probe на Q и Q′.'},
        {power:true,show:[],t:'Питание → щёлкай S и R. Отпустил S — Q всё равно 1: схема <b>помнит</b> бит, хотя входы уже 0. Это и отличает триггер от комбинационной схемы.'}]}); return c.done(); },
  rs_nand_sw:()=>{ const c=B('rs_nand_sw.ewb'); c.add(sw('Sn',10,35,'S',1,"S'")); c.add(sw('Rn',10,140,'R',1,"R'"));
    crossLatch(c,160,40,'nand',null,null,0); c.w('Sn.o','g3.i0'); c.w('Rn.o','g4.i1',[[130,155],[130,180]]);
    c.add(lamp('Q',290,43,'Q')); c.add(lamp('Qn',290,163,"Q'")); c.w('g3.o','Q.i'); c.w('g4.o','Qn.i');
    Object.assign(c,{la:true,probe:[["S'",'Sn.o'],["R'",'Rn.o'],['Q','g3.o'],["Q'",'g4.o']],status:'На NAND входы активны НУЛЁМ: S′=0 — установка, R′=0 — сброс, оба 1 — хранение, оба 0 — запрет (Q=Q′=1).',
      steps:[{bin:'basic',show:['Sn','Rn'],t:'Basic → 2 Switch: S′ и R′ (со штрихом — активны нулём). Поставь оба в 1 — это режим хранения.'},
        {bin:'gates',show:['g3','g4'],t:'Logic Gates → 2 <b>NAND</b> (И-НЕ).'},{wires:true,show:[],t:'Перекрёстные связи: выход каждого NAND — на вход другого. S′ → верхний, R′ → нижний.'},
        {bin:'ind',show:['Q','Qn'],t:'Indicators → Red Probe на Q и Q′.'},{power:true,show:[],t:'Питание → кратко поставь S′=0 (Q=1), верни 1 — Q держится. Потом R′=0 — сброс. Оба в 0 — обе лампочки горят: запрет.'}]}); return c.done(); },
  rs_sync:()=>{ const c=B('rs_sync.ewb'); c.add(sw('S',10,20,'S',0)); c.add(sw('C',10,95,'C',0)); c.add(sw('R',10,170,'R',0));
    c.add(gate('g1','nand',140,20,2,1)); c.add(gate('g2','nand',140,170,2,1));
    c.w('S.o','g1.i0',[[120,35],[120,30]]); c.rail('C.o',100,[['g1','i1'],['g2','i0']]); c.w('R.o','g2.i1',[[120,185],[120,190]]);
    crossLatch(c,270,20,'nand','g1.o','g2.o',0);
    c.add(lamp('Q',400,23,'Q')); c.add(lamp('Qn',400,143,"Q'")); c.w('g3.o','Q.i'); c.w('g4.o','Qn.i');
    Object.assign(c,{la:true,probe:[['S','S.o'],['R','R.o'],['C','C.o'],['Q','g3.o']],status:'Синхронный RS: S и R действуют, только пока C = 1. При C = 0 триггер хранит бит, что бы ни было на S и R.',
      steps:[{bin:'basic',show:['S','C','R'],t:'3 Switch: S, C (синхросигнал, «разрешение») и R.'},{bin:'gates',show:['g1','g2'],t:'2 <b>NAND</b> на входе: S·C и R·C. Пока C = 0, их выходы = 1 — для NAND-защёлки это «хранение».'},
        {bin:'gates',show:['g3','g4'],t:'Ещё 2 <b>NAND</b> накрест — обычный RS-триггер на NAND (S′, R′).'},{bin:'ind',show:['Q','Qn'],t:'Red Probe на Q и Q′.'},
        {wires:true,show:[],t:'C идёт на оба входных NAND (узел-точка на проводе). Выходы входных NAND — на свободные входы защёлки.'},{power:true,show:[],t:'Поставь S = 1 при C = 0 — ничего. Подними C — Q = 1. Опусти C и меняй S/R — Q не меняется.'}]}); return c.done(); },
  d_latch:()=>{ const c=B('d_latch.ewb'); c.add(sw('D',10,20,'D',0)); c.add(sw('C',10,110,'C',0));
    c.add(gate('n','not',80,163)); c.w('D.o','n.i0',[[68,35],[68,175]]);
    c.add(gate('g1','nand',160,20,2,1)); c.add(gate('g2','nand',160,170,2,1));
    c.w('D.o','g1.i0',[[140,35],[140,30]],{dot:1}); c.rail('C.o',120,[['g1','i1'],['g2','i0']]); c.w('n.o','g2.i1',[[140,175],[140,190]]);
    crossLatch(c,290,20,'nand','g1.o','g2.o',0);
    c.add(lamp('Q',420,23,'Q')); c.add(lamp('Qn',420,143,"Q'")); c.w('g3.o','Q.i'); c.w('g4.o','Qn.i');
    Object.assign(c,{la:true,probe:[['D','D.o'],['C','C.o'],['Q','g3.o']],status:'D-защёлка (по уровню): пока C = 1, Q повторяет D («прозрачна»). Когда C = 0 — Q запоминает последнее значение.',
      steps:[{bin:'basic',show:['D','C'],t:'2 Switch: D (данные) и C (разрешение записи).'},{bin:'gates',show:['n'],t:'<b>NOT</b>: из D получаем D′. Так на S и R защёлки всегда приходят противоположные сигналы — <b>запрещённой комбинации больше не бывает</b>.'},
        {bin:'gates',show:['g1','g2'],t:'2 NAND: D·C и D′·C.'},{bin:'gates',show:['g3','g4'],t:'2 NAND накрест — RS-защёлка.'},{bin:'ind',show:['Q','Qn'],t:'Red Probe на Q и Q′.'},
        {wires:true,show:[],t:'Это синхронный RS-триггер, у которого S = D, а R = D′.'},{power:true,show:[],t:'C = 1: щёлкай D — Q повторяет. C = 0: щёлкай D — Q стоит.'}]}); return c.done(); },
  d_ms:()=>{ const c=B('d_flipflop_ms.ewb'); c.add(sw('D',10,30,'D',0)); c.add(sw('C',10,250,'C',0));
    c.add(gate('nd','not',80,173)); c.add(gate('nc','not',80,330));
    c.w('D.o','nd.i0',[[68,45],[68,185]]); c.w('C.o','nc.i0',[[66,265],[66,342]]);
    // ведущий (master) — прозрачен при C=0 (берёт C′), ведомый (slave) — при C=1
    c.add(gate('m1','nand',170,30,2,1)); c.add(gate('m2','nand',170,180,2,1));
    c.w('D.o','m1.i0',[[150,45],[150,40]],{dot:1}); c.w('nd.o','m2.i1',[[150,185],[150,200]]); c.rail('nc.o',140,[['m1','i1'],['m2','i0']]);
    c.add(gate('m3','nand',290,30,2,0)); c.add(gate('m4','nand',290,150,2,1)); c.w('m1.o','m3.i0',[[250,45],[250,40]]); c.w('m2.o','m4.i1',[[250,195],[250,170]]);
    c.w('m3.o','m4.i0',[[360,45],[360,80],[276,120],[276,160]]); c.w('m4.o','m3.i1',[[370,165],[370,130],[270,90],[270,50]]);
    c.add(gate('s1','nand',440,30,2,1)); c.add(gate('s2','nand',440,180,2,1));
    c.w('m3.o','s1.i0',[[400,45],[400,40]]); c.w('m4.o','s2.i1',[[405,165],[405,200]]); c.rail('C.o',420,[['s1','i1'],['s2','i0']]);
    c.add(gate('s3','nand',560,30,2,0)); c.add(gate('s4','nand',560,150,2,1)); c.w('s1.o','s3.i0',[[520,45],[520,40]]); c.w('s2.o','s4.i1',[[520,195],[520,170]]);
    c.w('s3.o','s4.i0',[[630,45],[630,80],[546,120],[546,160]]); c.w('s4.o','s3.i1',[[640,165],[640,130],[540,90],[540,50]]);
    c.add(lamp('Qm',400,290,'Qm (ведущий)','green')); c.w('m3.o','Qm.i',[[395,45],[395,302]],{dot:1});
    c.add(lamp('Q',690,33,'Q')); c.add(lamp('Qn',690,153,"Q'")); c.w('s3.o','Q.i'); c.w('s4.o','Qn.i');
    Object.assign(c,{la:true,probe:[['D','D.o'],['C','C.o'],['Qm','m3.o'],['Q','s3.o']],status:'D-триггер по фронту из двух защёлок: пока C = 0, ведущий (зелёная лампа) следит за D; в момент 0→1 ведомый копирует его и выход Q меняется. Между фронтами Q неизменен.',
      steps:[{bin:'basic',show:['D','C'],t:'2 Switch: D и C (тактовый вход; жми клавишу C два раза = один импульс).'},{bin:'gates',show:['nd','nc'],t:'2 <b>NOT</b>: D′ и C′.'},
        {bin:'gates',show:['m1','m2','m3','m4'],t:'<b>Ведущая защёлка</b> (master) из 4 NAND — как D-защёлка, но разрешение у неё C′: она открыта, когда C = 0.'},
        {bin:'gates',show:['s1','s2','s3','s4'],t:'<b>Ведомая защёлка</b> (slave) из 4 NAND, разрешение — C: открыта, когда C = 1. Её вход — выходы ведущей.'},
        {bin:'ind',show:['Qm','Q','Qn'],t:'Лампы: Qm (выход ведущей) и Q, Q′.'},{wires:true,show:[],t:'Защёлки никогда не открыты одновременно — поэтому запись происходит только в момент переключения C из 0 в 1 (по <b>фронту</b>).'},
        {power:true,show:[],t:'C = 0: меняй D — меняется только Qm. Подними C — Q = Qm. Пока C = 1, меняй D — ничего не меняется.'}]}); return c.done(); },
  jk_ms:(tMode)=>{ const c=B(tMode?'t_flipflop.ewb':'jk_ms.ewb');
    if(tMode) c.add(sw('T',10,100,'T',0)); else { c.add(sw('J',10,40,'J',0)); c.add(sw('K',10,200,'K',0)); }
    c.add(sw('C',10,300,'C',0)); c.add(gate('nc','not',80,370)); c.w('C.o','nc.i0',[[66,315],[66,382]]);
    c.add(gate('m1','nand',180,40,3,1)); c.add(gate('m2','nand',180,190,3,1));
    if(tMode) c.rail('T.o',150,[['m1','i0'],['m2','i2']]); else { c.w('J.o','m1.i0',[[150,55],[150,51]]); c.w('K.o','m2.i2',[[150,215],[150,222]]); }
    c.rail('C.o',160,[['m1','i1'],['m2','i1']]);
    c.add(gate('m3','nand',300,45,2,0)); c.add(gate('m4','nand',300,165,2,1)); c.w('m1.o','m3.i0',[[270,61],[270,55]]); c.w('m2.o','m4.i1',[[270,211],[270,185]]);
    c.w('m3.o','m4.i0',[[370,60],[370,95],[286,135],[286,175]]); c.w('m4.o','m3.i1',[[380,180],[380,145],[280,105],[280,65]]);
    c.add(gate('s1','nand',450,45,2,1)); c.add(gate('s2','nand',450,165,2,1)); c.w('m3.o','s1.i0',[[410,60],[410,55]]); c.w('m4.o','s2.i1',[[415,180],[415,185]]);
    c.rail('nc.o',430,[['s1','i1'],['s2','i0']]);
    c.add(gate('s3','nand',570,45,2,0)); c.add(gate('s4','nand',570,165,2,1)); c.w('s1.o','s3.i0',[[530,60],[530,55]]); c.w('s2.o','s4.i1',[[530,180],[530,185]]);
    c.w('s3.o','s4.i0',[[640,60],[640,95],[556,135],[556,175]]); c.w('s4.o','s3.i1',[[650,180],[650,145],[550,105],[550,65]]);
    // обратные связи JK: Q′ → вход m1, Q → вход m2 (поверх и снизу схемы)
    c.w('s4.o','m1.i2',[[660,180],[660,20],[170,20],[170,72]]); c.w('s3.o','m2.i0',[[670,60],[670,250],[170,250],[170,201]]);
    c.add(lamp('Q',700,48,'Q')); c.add(lamp('Qn',700,168,"Q'")); c.w('s3.o','Q.i',null,{dot:1}); c.w('s4.o','Qn.i',null,{dot:1});
    const sname=tMode?'T-триггер':'JK-триггер';
    Object.assign(c,{la:true,probe:tMode?[['T','T.o'],['C','C.o'],['Q','s3.o']]:[['J','J.o'],['K','K.o'],['C','C.o'],['Q','s3.o']],
      status:tMode?'T = 1: каждый импульс C (клавиша C дважды: 1 и 0) переключает Q. T = 0 — хранение. Срабатывание по спаду C (1→0).':'J=1,K=0 — установка; J=0,K=1 — сброс; J=K=0 — хранение; J=K=1 — переключение. Срабатывает по спаду C (1→0): нажми C дважды.',
      steps:[{bin:'basic',show:tMode?['T','C']:['J','K','C'],t:tMode?'Switch T и Switch C (тактовый).':'3 Switch: J, K и C (тактовый: два щелчка клавиши C = один импульс).'},
        {bin:'gates',show:['nc'],t:'<b>NOT</b>: C′ — разрешение для ведомой половины.'},
        {bin:'gates',show:['m1','m2'],t:`2 NAND на <b>3 входа</b> (двойной щелчок → Number of inputs = 3): m1 = (J·C·Q′)′, m2 = (K·C·Q)′. Обратная связь от выходов не даёт сразу и установить, и сбросить — поэтому J = K = 1 означает «переключить».${tMode?' У T-триггера J и K соединены вместе — это вход T.':''}`},
        {bin:'gates',show:['m3','m4'],t:'2 NAND накрест — ведущий (master) RS-триггер. Он принимает данные, пока C = 1.'},
        {bin:'gates',show:['s1','s2','s3','s4'],t:'Ведомый (slave): 2 NAND с разрешением C′ + 2 NAND накрест. Он копирует ведущий, когда C падает в 0.'},
        {bin:'ind',show:['Q','Qn'],t:'Red Probe на Q и Q′.'},{wires:true,show:[],t:'Не забудь две длинные обратные связи: Q′ → третий вход m1, Q → первый вход m2.'},
        {power:true,show:[],t:`Питание. ${tMode?'T = 1, жми C, C, C, C… — Q меняется на каждом спаде.':'Поставь J = K = 1 и жми C дважды несколько раз — Q каждый раз переключается.'}`}]}); return c.done(); },
  t_ms:()=>EX.jk_ms(true),
  /* ===== Дешифраторы и шифраторы из вентилей ===== */
  dec38:()=>{ const c=B('decoder3x8.ewb'); const V=['A2','A1','A0'];
    V.forEach((v,i)=>{ c.add(sw(v,10,20+i*90,v==='A2'?'C':v==='A1'?'B':'A',0)); c.add(gate('n'+v,'not',80,62+i*90)); c.w(v+'.o','n'+v+'.i0',[[66,35+i*90],[66,74+i*90]]); });
    for(let k=0;k<8;k++){ c.add(gate('y'+k,'and',330,10+k*52,3)); c.add(lamp('L'+k,430,19+k*52,'Y'+k)); c.w('y'+k+'.o','L'+k+'.i'); }
    V.forEach((v,i)=>{ const bit=2-i; const dir=[], inv=[]; for(let k=0;k<8;k++) ((k>>bit)&1?dir:inv).push(['y'+k,'i'+i]); c.rail(v+'.o',160+i*44,dir); c.rail('n'+v+'.o',178+i*44,inv); });
    Object.assign(c,{status:'Код A2A1A0 (клавиши C, B, A) → горит ровно одна лампа Yk, где k — двоичное число на входах.',
      steps:[{bin:'basic',show:V,t:'3 Switch: A2 (старший), A1, A0 (младший).'},{bin:'gates',show:V.map(v=>'n'+v),t:'3 <b>NOT</b>: получаем инверсии Ā2, Ā1, Ā0. Итого 6 «шин»: каждый вход в прямом и инверсном виде.'},
        {bin:'gates',show:[0,1,2,3,4,5,6,7].map(k=>'y'+k),t:'8 <b>AND</b> на 3 входа (Number of inputs = 3). Элемент Yk берёт для каждого бита прямой сигнал, если в числе k этот бит = 1, и инверсный — если 0. Например, Y5 = A2·Ā1·A0 (5 = 101).'},
        {bin:'ind',show:[0,1,2,3,4,5,6,7].map(k=>'L'+k),t:'8 Red Probe на выходы Y0…Y7.'},{wires:true,show:[],t:'Проведи 6 вертикальных шин и отводы от них к входам AND — так в EWB удобнее всего: каждый отвод ставит точку-узел.'},
        {power:true,show:[],t:'Перебери все 8 комбинаций — каждый раз светится одна лампа. Это и есть «двоичный код → унитарный код».'}]}); return c.done(); },
  enc42:()=>{ const c=B('encoder4x2.ewb'); for(let k=0;k<4;k++) c.add(sw('I'+k,10,20+k*60,String(k),k===0?1:0));
    c.add(gate('a1','or',260,50)); c.add(gate('a0','or',260,170)); c.add(lamp('A1',380,53,'A1')); c.add(lamp('A0',380,173,'A0')); c.w('a1.o','A1.i'); c.w('a0.o','A0.i');
    c.rail('I1.o',150,[['a0','i0']]); c.rail('I2.o',180,[['a1','i0']]); c.rail('I3.o',210,[['a1','i1'],['a0','i1']]);
    c.add({id:'T1',type:'txt',x:10,y:262,p:{text:'I0 никуда не подключён: код 00 и так получается'}});
    Object.assign(c,{status:'Включай ровно ОДИН вход (клавиши 0…3) — лампы A1A0 покажут его номер в двоичном виде. Два входа сразу — неверный код (для этого есть приоритетный шифратор).',
      steps:[{bin:'basic',show:['I0','I1','I2','I3'],t:'4 Switch: I0…I3 (клавиши 0, 1, 2, 3).'},{bin:'gates',show:['a1','a0'],t:'2 <b>OR</b>: A1 = I2 + I3 (номера 2 и 3 имеют старший бит 1), A0 = I1 + I3 (номера 1 и 3 — нечётные).'},
        {bin:'ind',show:['A1','A0'],t:'2 Red Probe: A1 (старший бит кода) и A0.'},{wires:true,show:[],t:'I3 нужен обоим OR — провод от провода, получится узел.'},{power:true,show:[],t:'Проверь: I2 → 10, I3 → 11, I1 → 01, I0 → 00.'}]}); return c.done(); },
  enc42p:()=>{ const c=B('priority_encoder4x2.ewb'); for(let k=0;k<4;k++) c.add(sw('I'+k,10,20+k*60,String(k),0));
    c.add(gate('n2','not',240,120)); c.add(gate('ad','and',320,195)); c.add(gate('a1','or',430,30)); c.add(gate('a0','or',430,150)); c.add(gate('v','or',430,250,4));
    c.add(lamp('A1',540,33,'A1')); c.add(lamp('A0',540,153,'A0')); c.add(lamp('V',540,265,'V')); c.w('a1.o','A1.i'); c.w('a0.o','A0.i'); c.w('v.o','V.i');
    c.w('n2.o','ad.i1',[[300,132],[300,215]]); c.w('ad.o','a0.i1',[[400,210],[400,170]]);
    c.rail('I0.o',140,[['v','i0']]); c.rail('I1.o',160,[['ad','i0'],['v','i1']]); c.rail('I2.o',180,[['a1','i1'],['n2','i0'],['v','i2']]); c.rail('I3.o',200,[['a1','i0'],['a0','i0'],['v','i3']]);
    Object.assign(c,{status:'Приоритетный: если включено несколько входов, код показывает СТАРШИЙ из них. V = 1 — «есть хоть один запрос».',
      steps:[{bin:'basic',show:['I0','I1','I2','I3'],t:'4 Switch I0…I3. Здесь можно включать сразу несколько.'},{bin:'gates',show:['n2','ad'],t:'NOT и AND: I1·Ī2 — «I1 считается, только если нет I2».'},
        {bin:'gates',show:['a1','a0','v'],t:'OR: A1 = I3 + I2; A0 = I3 + I1·Ī2; V = I0 + I1 + I2 + I3 (OR на 4 входа).'},{bin:'ind',show:['A1','A0','V'],t:'3 Red Probe.'},
        {power:true,show:[],t:'Включи I1 и I2 одновременно: обычный шифратор дал бы 11 (ерунда), приоритетный даёт 10 — номер старшего запроса. Так контроллер прерываний выбирает, кого обслужить первым.'}]}); return c.done(); },
  enc83:()=>{ const c=B('encoder8x3.ewb'); for(let k=0;k<8;k++) c.add(sw('I'+k,10,10+k*46,String(k),k===0?1:0));
    c.add(gate('a2','or',330,30,4)); c.add(gate('a1','or',330,150,4)); c.add(gate('a0','or',330,270,4));
    ['a2','a1','a0'].forEach((g,i)=>{ c.add(lamp('A'+(2-i),440,30+i*120+27-12,'A'+(2-i))); c.w(g+'.o','A'+(2-i)+'.i'); });
    const used={1:[],2:[],3:[],4:[],5:[],6:[],7:[]}; const cnt={a2:0,a1:0,a0:0};
    for(let k=1;k<8;k++){ ['a2','a1','a0'].forEach((g,i)=>{ if((k>>(2-i))&1){ used[k].push([g,'i'+cnt[g]]); cnt[g]++; } }); }
    for(let k=1;k<8;k++) c.rail('I'+k+'.o',130+k*22,used[k]);
    Object.assign(c,{status:'Включи один из входов I0…I7 (клавиши 0…7) — A2A1A0 покажут его номер.',
      steps:[{bin:'basic',show:[0,1,2,3,4,5,6,7].map(k=>'I'+k),t:'8 Switch I0…I7.'},{bin:'gates',show:['a2','a1','a0'],t:'3 <b>OR на 4 входа</b>: A2 = I4+I5+I6+I7, A1 = I2+I3+I6+I7, A0 = I1+I3+I5+I7 — в каждый OR идут номера, у которых этот бит = 1.'},
        {bin:'ind',show:['A2','A1','A0'],t:'3 Red Probe.'},{wires:true,show:[],t:'Шины от входов I1…I7 и отводы к OR. I0 не подключается: код 000 получается сам.'},{power:true,show:[],t:'I6 → 110, I5 → 101 и т. д.'}]}); return c.done(); },
  /* ===== Сумматоры из вентилей ===== */
  ha_task:()=>{ const c=B('half_adder.ewb'); c.add(sw('A',10,20,'A')); c.add(sw('B',10,90,'B')); c.add(gate('x','xor',150,25)); c.add(gate('a','and',150,95));
    c.add(lamp('S',260,28,'S')); c.add(lamp('C',260,98,'C')); c.rail('A.o',90,[['x','i0'],['a','i0']]); c.rail('B.o',110,[['x','i1'],['a','i1']]); c.w('x.o','S.i'); c.w('a.o','C.i'); return c.done(); },
  fa_gates:()=>{ const c=B('full_adder_gates.ewb'); c.add(sw('A',10,20,'A')); c.add(sw('B',10,90,'B')); c.add(sw('Ci',10,190,'C',0,'Ci'));
    c.add(gate('x1','xor',130,25)); c.add(gate('n1','and',130,100)); c.add(gate('x2','xor',260,30)); c.add(gate('n2','and',260,140)); c.add(gate('o','or',390,110));
    c.rail('A.o',80,[['x1','i0'],['n1','i0']]); c.rail('B.o',100,[['x1','i1'],['n1','i1']]);
    c.rail('x1.o',225,[['x2','i0'],['n2','i0']]); c.rail('Ci.o',240,[['x2','i1'],['n2','i1']]);
    c.w('n1.o','o.i0',[[360,115],[360,120]]); c.w('n2.o','o.i1',[[350,155],[350,130]]);
    c.add(lamp('S',470,33,'S')); c.add(lamp('Co',470,113,'Co')); c.w('x2.o','S.i'); c.w('o.o','Co.i');
    Object.assign(c,{status:'Полный сумматор из 5 вентилей: S = A ⊕ B ⊕ Ci, Co = A·B + Ci·(A ⊕ B). Клавиши A, B, C.',
      steps:[{bin:'basic',show:['A','B','Ci'],t:'3 Switch: A, B и Ci (перенос из младшего разряда).'},{bin:'gates',show:['x1','n1'],t:'Первый полусумматор: XOR (A ⊕ B) и AND (A·B).'},
        {bin:'gates',show:['x2','n2'],t:'Второй полусумматор: XOR (сумма первого ⊕ Ci) и AND ((A ⊕ B)·Ci).'},{bin:'gates',show:['o'],t:'OR объединяет два переноса — это Co.'},
        {bin:'ind',show:['S','Co'],t:'Red Probe: S и Co.'},{power:true,show:[],t:'1 + 1 + 1 = 11₂: S = 1 и Co = 1.'}]}); return c.done(); },
  add4g:()=>{ const c=B('adder4_gates.ewb'); const keysA='1234', keysB='5678';
    c.add({id:'hx',type:'hex',x:600,y:10,p:{label:'Σ (hex)'}});
    for(let i=0;i<4;i++){ const by=20+i*150; c.add(sw('A'+i,10,by,keysA[i])); c.add(sw('B'+i,10,by+55,keysB[i]));
      c.add(gate('x1_'+i,'xor',130,by+5)); c.add(gate('n1_'+i,'and',130,by+80)); c.add(gate('x2_'+i,'xor',260,by+10)); c.add(gate('n2_'+i,'and',260,by+60)); c.add(gate('o'+i,'or',380,by+85));
      c.rail('A'+i+'.o',90,[['x1_'+i,'i0'],['n1_'+i,'i0']]); c.rail('B'+i+'.o',105,[['x1_'+i,'i1'],['n1_'+i,'i1']]);
      c.rail('x1_'+i+'.o',220,[['x2_'+i,'i0'],['n2_'+i,'i0']]);
      c.w('n1_'+i+'.o','o'+i+'.i0',[[350,by+95]]); c.w('n2_'+i+'.o','o'+i+'.i1',[[340,by+75],[340,by+105]]);
      c.add(lamp('S'+i,480,by+13,'S'+i)); c.w('x2_'+i+'.o','S'+i+'.i');
      const px=[38,28,18,8][i]; c.w('x2_'+i+'.o','hx.b'+i,[[450+i*6,by+25],[450+i*6,108+(3-i)*6],[600+px,108+(3-i)*6]],{dot:1}); }
    c.add(sw('Ci',10,620,'0',0,'Ci')); c.rail('Ci.o',235,[['x2_0','i1'],['n2_0','i1']]);
    for(let i=1;i<4;i++){ const by=20+i*150, bp=by-150; const j=c.node(245,by+30); c.w('o'+(i-1)+'.o',j+'.i',[[446,bp+100],[446,bp+128],[245,bp+128]]); c.w(j+'.n','x2_'+i+'.i1'); c.w(j+'.n','n2_'+i+'.i1',[[245,by+80]]); }
    c.add(lamp('Co',480,558,'Co (перенос)')); c.w('o3.o','Co.i');
    Object.assign(c,{la:false,status:'Слагаемые: A3A2A1A0 (клавиши 4 3 2 1) и B3B2B1B0 (клавиши 8 7 6 5), Ci — клавиша 0. Лампы S3…S0 и Co — сумма, индикатор — она же в hex.',
      steps:[{bin:'basic',show:['A0','B0','A1','B1','A2','B2','A3','B3','Ci'],t:'9 Switch: биты чисел A и B (по 4) и входной перенос Ci.'},
        {bin:'gates',show:[0,1,2,3].flatMap(i=>['x1_'+i,'n1_'+i,'x2_'+i,'n2_'+i,'o'+i]),t:'На <b>каждый</b> разряд — полный сумматор из 5 вентилей: 2 XOR, 2 AND и OR. Всего 20 элементов.'},
        {bin:'ind',show:['S0','S1','S2','S3','Co','hx'],t:'4 Red Probe на суммы, одна — на перенос Co из старшего разряда, и Decoded 7-Segment Display.'},
        {wires:true,show:[],t:'Главная связь — <b>перенос</b>: выход OR разряда i → вход переноса разряда i+1 (Ci₀ — внешний). Поэтому он называется сумматор «с последовательным переносом» (ripple carry): старший бит ждёт, пока перенос «пробежит» через все младшие.'},
        {power:true,show:[],t:'Пример: 0111 + 0101 (7 + 5): клавиши 1 2 3 и 5 7 → S = 1100, индикатор C (12).'}]}); return c.done(); },
  /* ===== Счётчики ===== */
  cnt_down5:()=>{ const c=B('counter_down5.ewb'); c.add({id:'clk',type:'clk',x:10,y:90,p:{label:'Clock',f:'1 Hz',fv:1}}); c.add({id:'v',type:'vcc',x:110,y:0}); c.w('clk.o','f0.C');
    for(let i=0;i<5;i++){ const fx=120+i*125; c.add({id:'f'+i,type:'jk',x:fx,y:60,p:{label:'JK'+i,edge:'fall'},st:{q:0}});
      c.w('v.o','f'+i+'.J',[[122,26],[122,36],[fx-12,36],[fx-12,75]]); c.w('v.o','f'+i+'.K',[[122,26],[122,36],[fx-18,36],[fx-18,105]]);
      if(i) c.w('f'+(i-1)+'.Qn','f'+i+'.C',[[fx-125+82,105],[fx-125+82,90]]);
      c.add(lamp('Q'+i,fx+84,140,'Q'+i)); c.w('f'+i+'.Q','Q'+i+'.i',[[fx+76,75],[fx+76,152]]); }
    Object.assign(c,{clock:true,la:true,probe:[['CLK','clk.o'],['Q0','f0.Q'],['Q1','f1.Q'],['Q2','f2.Q'],['Q3','f3.Q'],['Q4','f4.Q']],status:'Вычитающий: 0 → 31 → 30 → … Лампы на прямых выходах Q, а такт следующему триггеру — с инверсного Q′.',
      steps:[{bin:'sources',show:['clk','v'],t:'Clock (1 Hz) и +5V.'},{bin:'digital',show:['f0','f1','f2','f3','f4'],t:'5 JK Flip-Flop (по спаду), J = K = 1 — счётный режим.'},
        {wires:true,show:[],t:'<b>Отличие от суммирующего</b>: на C следующего триггера идёт <b>Q′</b> предыдущего (а не Q). Когда Q падает 0→1… точнее, когда Q′ падает (то есть Q растёт 0→1), следующий разряд переключается — это заём при вычитании.'},
        {bin:'ind',show:['Q0','Q1','Q2','Q3','Q4'],t:'5 Red Probe на прямые выходы Q0…Q4 (Q4 — старший).'},{power:true,show:[],t:'Первый такт: 00000 → 11111 (31), дальше 30, 29, … В лабе есть и второй способ: оставить Q → C, а лампы повесить на Q′.'}]}); return c.done(); },
  cnt_sync6:()=>{ const c=B('counter_sync6.ewb'); const N=6, fx=i=>130+i*190;
    c.add({id:'clk',type:'clk',x:10,y:220,p:{label:'Clock',f:'1 Hz',fv:1}}); c.add({id:'v',type:'vcc',x:fx(0)-48,y:20});
    for(let i=0;i<N;i++){ const x=fx(i); c.add({id:'f'+i,type:'jk',x,y:80,p:{label:'JK'+i,edge:'fall',pre:1},st:{q:0}}); c.add(lamp('Q'+i,x+84,140,'Q'+i)); c.w('f'+i+'.Q','Q'+i+'.i',[[x+76,95],[x+76,152]]);
      c.w('clk.o','f'+i+'.C',[[x-30,238],[x-30,110]]); }
    // T0 = 1, T1 = Q0, Ti = T(i-1)·Q(i-1)
    const j0=c.node(fx(0)-36,95); c.w('v.o',j0+'.i',[[fx(0)-36,46]]); c.w(j0+'.n','f0.J'); c.w(j0+'.n','f0.K',[[fx(0)-36,125]]);
    const j1=c.node(fx(1)-20,95); c.w('f0.Q',j1+'.i'); c.w(j1+'.n','f1.J'); c.w(j1+'.n','f1.K',[[fx(1)-20,125]]);
    for(let i=2;i<N;i++){ const x=fx(i), ax=x-85; c.add(gate('a'+i,'and',ax,0));
      if(i===2) c.w('f0.Q','a2.i0',[[fx(0)+82,95],[fx(0)+82,10]]); else c.w('a'+(i-1)+'.o','a'+i+'.i0',[[fx(i-1)-24,15],[fx(i-1)-24,10]],{dot:1});
      c.w('f'+(i-1)+'.Q','a'+i+'.i1',[[fx(i-1)+88,95],[fx(i-1)+88,20]]);
      const j=c.node(x-20,95); c.w('a'+i+'.o',j+'.i',[[x-20,15]]); c.w(j+'.n','f'+i+'.J'); c.w(j+'.n','f'+i+'.K',[[x-20,125]]); }
    Object.assign(c,{clock:true,la:true,probe:[['CLK','clk.o'],...[0,1,2,3,4,5].map(i=>['Q'+i,'f'+i+'.Q'])],status:'Синхронный: Clock идёт на ВСЕ триггеры сразу. Триггер i переключается, только если все младшие Q = 1 (это и делают элементы AND).',
      steps:[{bin:'sources',show:['clk','v'],t:'Clock и +5V.'},{bin:'digital',show:[0,1,2,3,4,5].map(i=>'f'+i),t:'6 JK Flip-Flop. Тактовые входы всех соединены в <b>одну шину CLK</b>.'},
        {bin:'gates',show:['a2','a3','a4','a5'],t:'4 AND: T2 = Q0·Q1, T3 = T2·Q2, T4 = T3·Q3, T5 = T4·Q4 (цепочка — каждый AND берёт выход предыдущего).'},
        {wires:true,show:[],t:'J0 = K0 = 1 (+5V); J1 = K1 = Q0; Jk = Kk = выход своего AND. J и K каждого триггера соединены вместе.'},
        {bin:'ind',show:[0,1,2,3,4,5].map(i=>'Q'+i),t:'6 Red Probe на Q0…Q5.'},{power:true,show:[],t:'Счёт 0…63. В Logic Analyzer видно: все выходы меняются в <b>один и тот же</b> момент, без «лесенки» задержек, как у асинхронного.'}]}); return c.done(); },
  cnt_mod:(M)=>{ M=M||10; const n=Math.max(1,Math.ceil(Math.log2(M))); const pow2=(1<<n)===M; const c=B('counter_mod'+M+'.ewb');
    c.add({id:'clk',type:'clk',x:10,y:90,p:{label:'Clock',f:'1 Hz',fv:1}}); c.add({id:'v',type:'vcc',x:100,y:0}); c.w('clk.o','f0.C');
    for(let i=0;i<n;i++){ const fx=110+i*125; c.add({id:'f'+i,type:'jk',x:fx,y:50,p:{label:'JK'+i,edge:'fall',async:1},st:{q:0}});
      c.w('v.o','f'+i+'.J',[[112,26],[112,34],[fx-12,34],[fx-12,75]]); c.w('v.o','f'+i+'.K',[[112,26],[112,34],[fx-18,34],[fx-18,105]]);
      if(i) c.w('f'+(i-1)+'.Q','f'+i+'.C',[[fx-125+80,75],[fx-125+92,75],[fx-125+92,90]]);
      c.add(lamp('Q'+i,fx+40,230,'Q'+i)); c.w('f'+i+'.Q','Q'+i+'.i',[[fx+86,75],[fx+86,215],[fx+30,215],[fx+30,242]],{dot:1}); }
    const ones=[]; for(let i=0;i<n;i++) if((M>>i)&1) ones.push(i);
    if(!pow2){ const nx=110+(n-1)*125+130; c.add(gate('nd','nand',nx,170,ones.length,1));
      ones.forEach((b,k)=>{ const fx=110+b*125, m=ones.length, h=Math.max(30,m*12+6), py=Math.round(h/(m+1)*(k+1)); c.w('f'+b+'.Q','nd.i'+k,[[fx+86,75],[fx+86,160-k*5],[nx-14-k*6,160-k*5],[nx-14-k*6,170+py]]); });
      for(let i=0;i<n;i++){ const fx=110+i*125; c.w('nd.o','f'+i+'.CLR',[[nx+66,0+170+Math.round((ones.length*12+6>30?ones.length*12+6:30)/2)],[nx+66,200],[fx+35,200]]); } }
    const bits=[]; for(let i=0;i<n;i++) bits.push(['Q'+i,'f'+i+'.Q']);
    Object.assign(c,{clock:true,la:true,probe:[['CLK','clk.o'],...bits,...(pow2?[]:[['CLR','nd.o']])],
      status:pow2?`M = ${M} = 2^${n}: сброс не нужен, ${n} триггера сами считают 0…${M-1}.`:`Считает 0…${M-1}. Как только появляется ${M} = ${M.toString(2)}₂, NAND (входы — Q с единицами: ${ones.map(b=>'Q'+b).join(', ')}) выдаёт 0 на CLR — счётчик мгновенно обнуляется.`,
      steps:[{bin:'sources',show:['clk','v'],t:'Clock и +5V.'},{bin:'digital',show:Array.from({length:n},(_,i)=>'f'+i),t:`Число триггеров n: 2^(n−1) < M ≤ 2^n → для M = ${M} нужно <b>${n}</b> (2^${n} = ${1<<n}). JK с асинхронными входами PR/CLR.`},
        ...(pow2?[]:[{bin:'gates',show:['nd'],t:`<b>NAND</b> на ${ones.length} входа: ${M} = ${M.toString(2).padStart(n,'0')}₂ → единицы в разрядах ${ones.map(b=>'Q'+b).join(', ')}. Только при этом коде (первом «лишнем») на выходе NAND будет 0.`}]),
        {bin:'ind',show:Array.from({length:n},(_,i)=>'Q'+i),t:'Red Probe на Q0…Q'+(n-1)+'.'},
        {wires:true,show:[],t:'Обычный асинхронный счётчик: Q → C следующего, J = K = +5V.'+(pow2?'':' Выход NAND → CLR всех триггеров (CLR активен нулём — кружок на входе).')},
        {power:true,show:[],t:`Жми «Такт»: ${Array.from({length:Math.min(M,6)},(_,i)=>i).join(', ')}${M>6?', …':''}, ${M-1}, 0, … Состояние ${M} живёт доли микросекунды — в Logic Analyzer EWB его не видно.`}]});
    return c.done(); }
};
A.EX=EX;
/* сопоставление ключей data-c → функции (для initEWB главного скрипта) */
window.EWB_EXTRA={rs_nor:EX.rs_nor,rs_nand_sw:EX.rs_nand_sw,rs_sync:EX.rs_sync,d_latch:EX.d_latch,d_ms:EX.d_ms,jk_ms:()=>EX.jk_ms(false),t_ms:EX.t_ms,
  dec38:EX.dec38,enc42:EX.enc42,enc42p:EX.enc42p,enc83:EX.enc83,fa_gates:EX.fa_gates,add4g:EX.add4g,cnt_down5:EX.cnt_down5,cnt_sync6:EX.cnt_sync6,
  cnt_modM:()=>{ const ch=[]; for(let M=4;M<=31;M++) ch.push({t:'M = '+M+(M===10?' (декадный)':''),make:()=>EX.cnt_mod(M)}); const c=ch[6].make(); c.choices=ch; c.choiceIdx=6; return c; }};

/* список примеров для меню File → Примеры во вкладке EWB */
const TITLES=[['ha_gates','Т5. Полусумматор (XOR + AND)'],['fa_2ha','Т5. Полный сумматор из 2 полусумматоров'],['fa_gates','Т5. Полный сумматор из 5 вентилей'],['add3','Т5. 3-разрядный сумматор (Full-Adder ×3)'],['add4g','Т5. 4-разрядный сумматор из вентилей (20 элементов)'],
  ['dec24','Т5. Дешифратор 2→4'],['dec38','Т5. Дешифратор 3→8'],['enc42','Т5. Шифратор 4→2'],['enc42p','Т5. Приоритетный шифратор 4→2 + V'],['enc83','Т5. Шифратор 8→3'],
  ['rs_nor','Т6. RS-триггер на NOR'],['rs_nand_sw','Т6. RS-триггер на NAND (S′, R′)'],['rs_nand','Т6. RS на NAND + Word Generator'],['rs_sync','Т6. Синхронный RS-триггер'],['d_latch','Т6. D-защёлка (по уровню)'],['d_ms','Т6. D-триггер по фронту (master–slave)'],['jk_ms','Т6. JK-триггер из 9 вентилей (master–slave)'],['t_ms','Т6. T-триггер из вентилей'],['jk_wg','Т6. JK Flip-Flop + Word Generator'],['d_wg','Т6. D Flip-Flop + Word Generator'],
  ['cnt_async','Т7. Асинхронный суммирующий 3-разрядный'],['cnt_down5','Т7. Вычитающий 5-разрядный асинхронный'],['cnt_sync6','Т7. Синхронный 6-разрядный'],['cnt_mod10','Т7. Декадный (MOD-10)'],['cnt_modM','Т7. По модулю M (выбор M в окне лабы, здесь M = 10)']];
A.examples=()=>TITLES.map(([k,t])=>({k,t,make:()=>{ const f=(window.EWB_EXTRA&&window.EWB_EXTRA[k])||(typeof EWB_CIRCUITS!=='undefined'&&EWB_CIRCUITS[k]); const c=f(); delete c.choices; return c; }}));

/* ===== задания с автопроверкой (вкладка EWB → «Собрать самому») ===== */
const bits=(v,n)=>{ const o={}; for(let i=0;i<n;i++) o['Q'+i]=(v>>i)&1; return o; };
const cntSteps=(n,f,pulses)=>()=>{ const s=[{exp:bits(f(0),n),label:'старт'}]; for(let k=1;k<=pulses;k++) s.push({clk:1,exp:bits(f(k),n),label:'такт '+k}); return s; };
const fromExpr=(e,out,all)=>()=>{ const c=ewbFromExpr(e,{file:'solution.ewb',out}); (all||[]).forEach((v,i)=>{ if(!c.comps.some(k=>k.type==='sw'&&k.p.label===v)) c.comps.push({id:'s_'+v,type:'sw',x:10,y:20+c.comps.filter(k=>k.type==='sw').length*60,p:{label:v,key:v}}); }); return c; };
const GO=['sw','lamp','gate','conn','txt','vcc','gnd','hex','seg7','la','lc','wg','clk'];
A.TASKS={
  t3_f1:{group:'Тема 3. Логические элементы',title:'F = (A + B̄)·B·C',text:'Собери схему из лабы 3 (задание 1). Входы A, B, C уже стоят, выход — лампа F. Логические элементы — в панели <b>Logic Gates</b>.',inputs:['A','B','C'],outputs:['F'],kind:'comb',fn:v=>({F:(v.A|(1-v.B))&v.B&v.C}),solution:fromExpr('(A+!B)*B*C','F')},
  t3_major:{group:'Тема 3. Логические элементы',title:'Функция большинства Q (2 из 3)',text:'Q = 1, когда хотя бы два входа из трёх равны 1 (задача из силлабуса). Подсказка: Q = AB + AC + BC.',inputs:['A','B','C'],outputs:['Q'],kind:'comb',fn:v=>({Q:(v.A+v.B+v.C)>=2?1:0}),solution:fromExpr('A*B+A*C+B*C','Q')},
  t3_xnand:{group:'Тема 3. Логические элементы',title:'XOR только из NAND',text:'Собери F = A ⊕ B, используя <b>только элементы NAND</b> (их нужно 4). Так доказывается, что NAND — универсальный элемент.',inputs:['A','B'],outputs:['F'],kind:'comb',only:['nand'],fn:v=>({F:v.A^v.B}),solution:fromExpr('!(!(A*!(A*B))*!(B*!(A*B)))','F')},
  t3_tab:{group:'Тема 3. Логические элементы',title:'Схема по таблице: Q = 0110',text:'Таблица из СРО: A B → Q: 00→0, 01→1, 10→1, 11→0. Найди функцию и собери схему.',inputs:['A','B'],outputs:['Q'],kind:'comb',fn:v=>({Q:v.A^v.B}),solution:fromExpr('A^B','Q')},
  t4_k4:{group:'Тема 4. Карты Карно',title:'Q = Σ(1,3,5,7,10,11,14,15)',text:'Задача силлабуса: 4 входа A, B, C, D (A — старший). Минимизируй картой Карно и собери упрощённую схему. Можно проверить себя прибором Logic Converter.',inputs:['A','B','C','D'],outputs:['Q'],kind:'comb',fn:v=>{ const m=v.A*8+v.B*4+v.C*2+v.D; return {Q:[1,3,5,7,10,11,14,15].includes(m)?1:0}; },solution:fromExpr('!A*D+A*C','Q',['A','B','C','D'])},
  t4_k3:{group:'Тема 4. Карты Карно',title:"F = A'B'C' + A'BC + ABC' + ABC",text:'Сначала упрости картой Карно (получится 3 слагаемых), потом собери.',inputs:['A','B','C'],outputs:['F'],kind:'comb',fn:v=>({F:((!v.A&&!v.B&&!v.C)||(!v.A&&v.B&&v.C)||(v.A&&v.B&&!v.C)||(v.A&&v.B&&v.C))?1:0}),solution:fromExpr('!A*!B*!C+B*C+A*B','F')},
  t5_ha:{group:'Тема 5. Комбинационные схемы',title:'Полусумматор из вентилей',text:'Выходы S (сумма) и C (перенос). Только базовые элементы, без готового Half-Adder.',inputs:['A','B'],outputs:['S','C'],kind:'comb',gatesOnly:1,fn:v=>({S:v.A^v.B,C:v.A&v.B}),solution:EX.ha_task},
  t5_fa:{group:'Тема 5. Комбинационные схемы',title:'Полный сумматор из вентилей',text:'Входы A, B, Ci; выходы S и Co. Без готовых сумматоров — только вентили (2 XOR, 2 AND, OR).',inputs:['A','B','Ci'],outputs:['S','Co'],kind:'comb',gatesOnly:1,fn:v=>{ const s=v.A+v.B+v.Ci; return {S:s&1,Co:s>>1}; },solution:EX.fa_gates},
  t5_add4:{group:'Тема 5. Комбинационные схемы',title:'4-разрядный сумматор из вентилей',text:'Числа A3…A0 и B3…B0, входной перенос Ci → сумма S3…S0 и перенос Co. Только вентили. Проверка переберёт все 512 комбинаций.',inputs:['A3','A2','A1','A0','B3','B2','B1','B0','Ci'],outputs:['S3','S2','S1','S0','Co'],kind:'comb',gatesOnly:1,outX:620,
    fn:v=>{ const a=v.A3*8+v.A2*4+v.A1*2+v.A0, b=v.B3*8+v.B2*4+v.B1*2+v.B0, s=a+b+v.Ci; return {S3:(s>>3)&1,S2:(s>>2)&1,S1:(s>>1)&1,S0:s&1,Co:(s>>4)&1}; },solution:()=>{ const c=EX.add4g(); c.comps.forEach(k=>{ if(k.id==='Co') k.p.label='Co'; }); return c; }},
  t5_dec24:{group:'Тема 5. Комбинационные схемы',title:'Дешифратор 2→4',text:'Только AND и NOT (задача силлабуса). Y0 = Ā1Ā0, Y1 = Ā1A0, Y2 = A1Ā0, Y3 = A1A0.',inputs:['A1','A0'],outputs:['Y0','Y1','Y2','Y3'],kind:'comb',gatesOnly:1,fn:v=>{ const k=v.A1*2+v.A0, o={}; for(let i=0;i<4;i++) o['Y'+i]=i===k?1:0; return o; },solution:()=>EWB_CIRCUITS.dec24()},
  t5_dec38:{group:'Тема 5. Комбинационные схемы',title:'Дешифратор 3→8',text:'Входы A2 A1 A0, выходы Y0…Y7: горит выход с номером, равным коду на входах.',inputs:['A2','A1','A0'],outputs:['Y0','Y1','Y2','Y3','Y4','Y5','Y6','Y7'],kind:'comb',gatesOnly:1,keys:['C','B','A'],fn:v=>{ const k=v.A2*4+v.A1*2+v.A0, o={}; for(let i=0;i<8;i++) o['Y'+i]=i===k?1:0; return o; },solution:EX.dec38},
  t5_enc42:{group:'Тема 5. Комбинационные схемы',title:'Шифратор 4→2',text:'Входы I0…I3 (активен ровно один), выходы A1 A0 — номер активного входа. Проверка перебирает только допустимые наборы (один вход = 1).',inputs:['I0','I1','I2','I3'],outputs:['A1','A0'],kind:'comb',gatesOnly:1,keys:['0','1','2','3'],valid:v=>v.I0+v.I1+v.I2+v.I3===1,fn:v=>{ const k=v.I1?1:v.I2?2:v.I3?3:0; return {A1:k>>1,A0:k&1}; },solution:EX.enc42},
  t5_enc42p:{group:'Тема 5. Комбинационные схемы',title:'Приоритетный шифратор 4→2 с V',text:'Можно включать несколько входов: код = номер <b>старшего</b> активного. V = 1, если активен хоть один.',inputs:['I0','I1','I2','I3'],outputs:['A1','A0','V'],kind:'comb',gatesOnly:1,keys:['0','1','2','3'],fn:v=>{ const k=v.I3?3:v.I2?2:v.I1?1:0; return {A1:k>>1,A0:k&1,V:(v.I0|v.I1|v.I2|v.I3)}; },solution:EX.enc42p},
  t5_enc83:{group:'Тема 5. Комбинационные схемы',title:'Шифратор 8→3',text:'Входы I0…I7 (активен один) → код A2 A1 A0.',inputs:['I0','I1','I2','I3','I4','I5','I6','I7'],outputs:['A2','A1','A0'],kind:'comb',gatesOnly:1,keys:['0','1','2','3','4','5','6','7'],valid:v=>Object.values(v).reduce((a,b)=>a+b,0)===1,fn:v=>{ let k=0; for(let i=0;i<8;i++) if(v['I'+i]) k=i; return {A2:k>>2,A1:(k>>1)&1,A0:k&1}; },solution:EX.enc83},
  t6_rsnor:{group:'Тема 6. Триггеры из вентилей',title:'RS-триггер на NOR',text:'Входы S, R, выходы Q и Q′. Проверка: установка, хранение, сброс, хранение, установка.',inputs:['S','R'],outputs:['Q',"Q'"],kind:'seq',gatesOnly:1,
    steps:[{in:{S:1,R:0},exp:{Q:1,"Q'":0},label:'S=1 R=0'},{in:{S:0,R:0},exp:{Q:1,"Q'":0},label:'S=0 R=0 (хранение)'},{in:{S:0,R:1},exp:{Q:0,"Q'":1},label:'S=0 R=1'},{in:{S:0,R:0},exp:{Q:0,"Q'":1},label:'хранение'},{in:{S:1,R:0},exp:{Q:1,"Q'":0},label:'S=1'}],solution:EX.rs_nor},
  t6_rssync:{group:'Тема 6. Триггеры из вентилей',title:'Синхронный (тактируемый) RS-триггер',text:'Входы S, C, R, выход Q. Пока C = 1, работает как RS; при C = 0 хранит. Собери из 4 NAND (2 на входе + 2 накрест).',inputs:['S','C','R'],outputs:['Q'],kind:'seq',gatesOnly:1,
    steps:[{in:{S:1,R:0,C:1},exp:{Q:1},label:'C=1, S=1'},{in:{S:0},exp:{Q:1},label:'хранение'},{in:{C:0,R:1},exp:{Q:1},label:'C=0, R=1 — игнор'},{in:{C:1},exp:{Q:0},label:'C=1, R=1 — сброс'},{in:{R:0,C:0,S:1},exp:{Q:0},label:'C=0, S=1 — игнор'},{in:{C:1},exp:{Q:1},label:'C=1 — установка'}],solution:EX.rs_sync},
  t6_dlatch:{group:'Тема 6. Триггеры из вентилей',title:'D-защёлка (по уровню)',text:'Входы D и C, выход Q. Пока C = 1, Q = D; при C = 0 — хранение.',inputs:['D','C'],outputs:['Q'],kind:'seq',gatesOnly:1,
    steps:[{in:{D:1,C:1},exp:{Q:1},label:'D=1 C=1'},{in:{D:0,C:1},exp:{Q:0},label:'D=0 C=1'},{in:{D:1,C:1},exp:{Q:1},label:'D=1 C=1'},{in:{C:0},exp:{Q:1},label:'C=0'},{in:{D:0},exp:{Q:1},label:'D=0 C=0 (хранит)'},{in:{C:1},exp:{Q:0},label:'C=1'}],solution:EX.d_latch},
  t6_dff:{group:'Тема 6. Триггеры из вентилей',title:'D-триггер по фронту (из вентилей)',text:'Входы D и C (C — переключатель), выход Q. Q меняется только в момент C: 0→1. Подсказка: две D-защёлки (ведущая с C′, ведомая с C).',inputs:['D','C'],outputs:['Q'],kind:'seq',gatesOnly:1,
    steps:[{in:{D:0,C:0},label:'D=0 C=0'},{in:{C:1},exp:{Q:0},label:'фронт C, D=0'},{in:{D:1},exp:{Q:0},label:'D=1 при C=1'},{in:{C:0},exp:{Q:0},label:'C=0'},{in:{C:1},exp:{Q:1},label:'фронт, D=1'},{in:{D:0},exp:{Q:1},label:'D=0 при C=1'},{in:{C:0},exp:{Q:1},label:'спад C'},{in:{C:1},exp:{Q:0},label:'фронт, D=0'}],solution:EX.d_ms},
  t6_jk:{group:'Тема 6. Триггеры из вентилей',title:'JK-триггер (master–slave) из вентилей',text:'Входы J, K, C; выход Q. Срабатывает по спаду C (1→0). Проверка: установка, хранение, сброс, переключение ×2.',inputs:['J','K','C'],outputs:['Q'],kind:'seq',gatesOnly:1,
    steps:[{in:{J:0,K:1,C:1}},{in:{C:0},exp:{Q:0},label:'сброс'},{in:{J:1,K:0,C:1}},{in:{C:0},exp:{Q:1},label:'J=1: установка'},{in:{J:0,K:0,C:1}},{in:{C:0},exp:{Q:1},label:'J=K=0: хранение'},{in:{J:0,K:1,C:1}},{in:{C:0},exp:{Q:0},label:'K=1: сброс'},{in:{J:1,K:1,C:1}},{in:{C:0},exp:{Q:1},label:'J=K=1: переключение'},{in:{C:1}},{in:{C:0},exp:{Q:0},label:'ещё переключение'}],solution:()=>EX.jk_ms(false)},
  t6_t:{group:'Тема 6. Триггеры из вентилей',title:'T-триггер из вентилей',text:'Входы T и C, выход Q. T = 1 — каждый спад C переключает Q; T = 0 — хранение.',inputs:['T','C'],outputs:['Q'],kind:'seq',gatesOnly:1,
    steps:[],solution:EX.t_ms},
  t7_up3:{group:'Тема 7. Счётчики',title:'Асинхронный 3-разрядный суммирующий',text:'Clock уже стоит. Выходы — лампы Q0, Q1, Q2. Используй JK Flip-Flop (Digital). Проверка: 10 тактов, счёт 0→7→0→…',inputs:[],outputs:['Q0','Q1','Q2'],clock:1,kind:'seq',steps:cntSteps(3,k=>k%8,10),solution:()=>EWB_CIRCUITS.cnt_async()},
  t7_down5:{group:'Тема 7. Счётчики',title:'Вычитающий 5-разрядный асинхронный',text:'Задание 1 лабы: на JK-триггерах. Лампы Q0…Q4 показывают число; после первого такта 0 → 31.',inputs:[],outputs:['Q0','Q1','Q2','Q3','Q4'],clock:1,kind:'seq',steps:cntSteps(5,k=>(32-k%32)%32,36),solution:EX.cnt_down5},
  t7_sync6:{group:'Тема 7. Счётчики',title:'Синхронный 6-разрядный',text:'Задание 2 лабы: общий CLK на все 6 JK-триггеров, J = K = AND младших Q. Проверка: 70 тактов.',inputs:[],outputs:['Q0','Q1','Q2','Q3','Q4','Q5'],clock:1,kind:'seq',steps:cntSteps(6,k=>k%64,70),solution:EX.cnt_sync6},
  t7_mod10:{group:'Тема 7. Счётчики',title:'Счётчик по модулю 10',text:'4 JK-триггера с CLR и NAND, который ловит код 1010. Проверка: 25 тактов (0…9, 0…9, 0…4).',inputs:[],outputs:['Q0','Q1','Q2','Q3'],clock:1,kind:'seq',steps:cntSteps(4,k=>k%10,25),solution:()=>EX.cnt_mod(10)}
};
// T-триггер без входа сброса: начальное Q неизвестно, поэтому проверяем «относительно»: каждый спад при T=1 меняет Q, при T=0 — нет
A.TASKS.t6_t.steps=[{in:{T:0,C:0},rel:'s'},{in:{T:1}},{in:{C:1}},{in:{C:0},rel:'a',label:'спад 1 (T=1)'},{in:{C:1}},{in:{C:0},rel:'b',label:'спад 2 (T=1)'},{in:{T:0}},{in:{C:1}},{in:{C:0},rel:'c',label:'спад 3 (T=0)'},{in:{T:1}},{in:{C:1}},{in:{C:0},rel:'d',label:'спад 4 (T=1)'}];
A.TASKS.t6_t.relCheck=v=>v.s!==v.a&&v.a!==v.b&&v.b===v.c&&v.c!==v.d;
Object.entries(A.TASKS).forEach(([k,t])=>{ t.id=k; });
})();
