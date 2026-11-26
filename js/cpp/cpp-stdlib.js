/* Учебный интерпретатор C++ — библиотеки (iostream, iomanip, stdio, conio, math, stdlib, string.h, ctype, string, windows, sysutils). */
(function(G){
'use strict';
const CPP=G.CPP; const {CppError,T}=CPP;
const Ty=()=>CPP.types;
const rerr=(m,l)=>new CppError(m,l,'runtime');
const cerr=(m,l,c)=>new CppError(m,l,'compile',c);
const LIB=CPP.LIB={};
const def=(names,g,o)=>{ for(const n of names.split(' ')) LIB[n]=Object.assign({g:g.split(' ')},o); };
const num=v=>({t:Ty().tDbl,v});
const int=v=>({t:Ty().tInt,v:v|0});
const vd=()=>({t:Ty().tVoid,v:0});
const bool=v=>({t:Ty().tBool,v:v?1:0});
const chr=v=>({t:Ty().tChar,v:Ty().toIntT(v,'char')});
const str=(v,ansi)=>({t:T.str(ansi),v});
const manip=(f)=>({t:Ty().tManip,v:f});
function needNum(a,name,line){ if(!Ty().isNum(a.t)) throw cerr(`В ${name}() нужно передать число, а передано ${Ty().tname(a.t)}`,line,'E2342'); return a.v; }
function mathFn(name,f,check){ LIB[name]={g:['math'],fn:(it,a,line)=>{ if(a.length<f.length) throw cerr(`${name}() нужно ${f.length} аргумент(а)`,line,'E2193');
  a.forEach(x=>{ if(x.idiv) it.idivWarn(x,line); });
  const xs=a.map(x=>needNum(x,name,line)); if(check){ const w=check(...xs); if(w) it.warn(name+line,w,line); } return num(f(...xs)); },fnName:true,fn2:true}; LIB[name].fn.isMath=true; }

/* ---------- iostream ---------- */
def('cout cerr clog','iostream',{std:true,val:()=>({t:Ty().tOs,v:'cout'})});
def('cin','iostream',{std:true,val:()=>({t:Ty().tIs,v:'cin'})});
def('endl','iostream',{std:true,val:()=>manip(it=>it.out('\n'))});
def('ends','iostream',{std:true,val:()=>manip(it=>it.out('\0'))});
def('flush','iostream',{std:true,val:()=>manip(()=>{})});
const flagM={fixed:it=>{it.os.fixed=true;it.os.sci=false;},scientific:it=>{it.os.sci=true;it.os.fixed=false;},showpoint:it=>{it.os.showpoint=true;},noshowpoint:it=>{it.os.showpoint=false;},
  left:it=>{it.os.left=true;it.os.internal=false;},right:it=>{it.os.left=false;it.os.internal=false;},internal:it=>{it.os.internal=true;},hex:it=>{it.os.base=16;},dec:it=>{it.os.base=10;},oct:it=>{it.os.base=8;},
  boolalpha:it=>{it.os.boolalpha=true;},noboolalpha:it=>{it.os.boolalpha=false;},showpos:it=>{it.os.showpos=true;},noshowpos:it=>{it.os.showpos=false;},uppercase:it=>{it.os.upper=true;},nouppercase:it=>{it.os.upper=false;},
  ws:()=>{},skipws:()=>{},noskipws:()=>{}};
for(const k in flagM) def(k,'iostream',{std:true,val:()=>manip(flagM[k])});
// ios::fixed и т. п. — флаги для setf / setiosflags
const IOS={fixed:1,scientific:2,showpoint:4,left:8,right:16,internal:32,hex:64,dec:128,oct:256,boolalpha:512,showpos:1024,uppercase:2048,floatfield:3,adjustfield:56,basefield:448,skipws:4096};
for(const k in IOS) LIB['ios::'+k]={g:['iostream'],val:()=>int(IOS[k])};
function applyFlags(it,f,on){ for(const k in IOS){ if(['floatfield','adjustfield','basefield','skipws'].includes(k)) continue; if(f&IOS[k]){ if(on) flagM[k](it); else { if(k==='fixed') it.os.fixed=false; if(k==='scientific') it.os.sci=false; if(k==='showpoint') it.os.showpoint=false; if(k==='left') it.os.left=false; if(k==='showpos') it.os.showpos=false; if(k==='uppercase') it.os.upper=false; if(k==='boolalpha') it.os.boolalpha=false; if(k==='hex'||k==='oct') it.os.base=10; } } } }
def('setw','iomanip',{std:true,argc:1,fn:(it,a)=>manip(i=>{i.os.w=a[0].v;})});
def('setprecision','iomanip',{std:true,argc:1,fn:(it,a)=>manip(i=>{i.os.prec=a[0].v;})});
def('setfill','iomanip',{std:true,argc:1,fn:(it,a)=>manip(i=>{i.os.fill=CPP.b2c(a[0].v);})});
def('setiosflags','iomanip',{std:true,argc:1,fn:(it,a)=>manip(i=>applyFlags(i,a[0].v,true))});
def('resetiosflags','iomanip',{std:true,argc:1,fn:(it,a)=>manip(i=>applyFlags(i,a[0].v,false))});
def('setbase','iomanip',{std:true,argc:1,fn:(it,a)=>manip(i=>{i.os.base=a[0].v;})});
def('getline','iostream string',{std:true,lv:true,fn:(it,a,line)=>{
  if(a.length<2) throw cerr('getline(cin, s) — нужно два аргумента',line,'E2193');
  const x=a[1]; if(!x.lv||!Ty().isStr(Ty().unref(x.t))) throw cerr('Второй аргумент getline — переменная типа string',line,'E2034');
  if(it.inFail) return {t:Ty().tIs,v:'cin'};
  const s=it.readLine(); if(s==null){ it.noInput(line); return {t:Ty().tIs,v:'cin'}; }
  const delim=a[2]?CPP.b2c(it.rv(a[2]).v):null;
  x.cell.v=delim&&s.includes(delim)?s.slice(0,s.indexOf(delim)):s; return {t:Ty().tIs,v:'cin'}; }});

CPP.streamMethod=function(it,st,m,args,line,sc,rawArgs){
  const os=it.os;
  const R=a=>it.rv(a);
  if(st==='cout'){
    switch(m){
      case 'width':{ const old=os.w; if(args[0]) os.w=R(args[0]).v; return int(old); }
      case 'precision':{ const old=os.prec; if(args[0]) os.prec=R(args[0]).v; return int(old); }
      case 'fill':{ const old=os.fill.charCodeAt(0); if(args[0]) os.fill=CPP.b2c(R(args[0]).v); return chr(old); }
      case 'setf':{ const f=R(args[0]).v; if(args[1]){ applyFlags(it,R(args[1]).v,false); } applyFlags(it,f,true); return int(0); }
      case 'unsetf': applyFlags(it,R(args[0]).v,false); return int(0);
      case 'flush': return {t:Ty().tOs,v:'cout'};
      case 'put': it.out(CPP.b2c(R(args[0]).v)); return {t:Ty().tOs,v:'cout'};
      case 'write':{ const s=it.cstr(R(args[0]).v,line).slice(0,R(args[1]).v); it.out(s); return {t:Ty().tOs,v:'cout'}; }
    }
    throw cerr(`У cout нет метода ${m}()`,line,'E2316');
  }
  switch(m){
    case 'get':{
      if(!args.length){ const c=it.getCh(); if(c==null){ it.noInput(line); return int(-1); } return int(CPP.c2b(c)); }
      const x=args[0];
      if(args.length===1){ if(!x.lv) throw cerr('cin.get(c) — нужна переменная char',line); const c=it.getCh(); if(c==null){ it.noInput(line); return {t:Ty().tIs,v:'cin'}; } x.cell.v=Ty().toIntT(CPP.c2b(c),"char"); x.cell.u=false; return {t:Ty().tIs,v:'cin'}; }
      // cin.get(buf, n)
      const p=R(x).v, n=R(args[1]).v; let s=''; while(s.length<n-1){ const c=it.peekCh(); if(c==null||c==='\n') break; s+=c; it.ip++; } it.writeCStr(p,s,line); return {t:Ty().tIs,v:'cin'}; }
    case 'getline':{
      const p=R(args[0]).v, n=args[1]?R(args[1]).v:256;
      if(it.inFail) return {t:Ty().tIs,v:'cin'};
      const s=it.readLine(); if(s==null){ it.noInput(line); return {t:Ty().tIs,v:'cin'}; }
      if(s.length>n-1) it.warn('gl'+line,`Строка длиннее ${n-1} символов — cin.getline обрезал её`,line);
      it.writeCStr(p,s.slice(0,n-1),line); return {t:Ty().tIs,v:'cin'}; }
    case 'ignore':{ const n=args[0]?R(args[0]).v:1; const d=args[1]?CPP.b2c(R(args[1]).v):null; let k=0; while(k<n){ const c=it.getCh(); if(c==null) break; k++; if(d!=null&&c===d) break; } return {t:Ty().tIs,v:'cin'}; }
    case 'peek':{ const c=it.peekCh(); return int(c==null?-1:c.charCodeAt(0)); }
    case 'eof': return bool(it.ip>=it.input.length);
    case 'fail': case 'bad': return bool(it.inFail);
    case 'good': return bool(!it.inFail);
    case 'clear': it.inFail=false; return vd();
    case 'sync': return int(0);
  }
  throw cerr(`У cin нет метода ${m}()`,line,'E2316');
};

/* ---------- stdio ---------- */
function cstrArg(it,a,line,num){ const t=Ty().unref(a.t); if(num&&Ty().isNum(t)) return it.fmtNum(a); if(Ty().isStr(t)) return a.v; if(Ty().isPtr(t)&&Ty().isCharT(t.to)) return it.cstr(a.v,line); throw cerr(`Ожидалась строка, а передано ${Ty().tname(t)}`,line,'E2034'); }
def('printf','stdio',{fn:(it,a,line)=>{ if(!a.length) throw cerr('printf без аргументов',line,'E2193'); const fmt=cstrArg(it,a[0],line); checkFmt(it,fmt,a.slice(1),line); const s=CPP.cformat(fmt,a.slice(1),x=>it.cstr(x.v,line),line); it.out(s); return int(s.length); }});
function checkFmt(it,fmt,args,line){
  const specs=[...fmt.matchAll(/%[-+ #0]*(\*|\d+)?(\.(\*|\d+))?[hlL]?([diuoxXfFeEgGcsp%])/g)].filter(m=>m[4]!=='%');
  if(specs.length>args.length) it.warn('pf'+line,`В формате printf ${specs.length} спецификаторов (%…), а значений передано ${args.length}`,line);
  specs.forEach((m,k)=>{ const a=args[k]; if(!a) return; const c=m[4]; const t=Ty().unref(a.t);
    if('di'.includes(c)&&Ty().isFlt(t)) it.warn('pfd'+line,`%${c} печатает целое, а передано дробное (${Ty().tname(t)}) — выведется мусор. Для дробных — %f`,line);
    if('feEgG'.includes(c)&&Ty().isInt(t)) it.warn('pff'+line,`%${c} печатает дробное, а передано целое — выведется мусор. Для целых — %d`,line);
    if(c==='s'&&!(Ty().isPtr(t)||Ty().isStr(t))) it.warn('pfs'+line,'%s печатает строку (char*), а передано не строку',line);
    if(c==='s'&&Ty().isStr(t)) it.warn('pfs2'+line,'string в printf передают через .c_str(): printf("%s", s.c_str())',line);
  });
}
def('sprintf','stdio',{fn:(it,a,line)=>{ const fmt=cstrArg(it,a[1],line); const s=CPP.cformat(fmt,a.slice(2),x=>it.cstr(x.v,line),line); it.writeCStr(a[0].v,s,line); return int(s.length); }});
def('puts','stdio',{argc:1,fn:(it,a,line)=>{ it.out(cstrArg(it,a[0],line)+'\n'); return int(0); }});
def('putchar','stdio',{argc:1,fn:(it,a)=>{ it.out(CPP.b2c(a[0].v)); return int(a[0].v); }});
def('getchar','stdio',{fn:(it,a,line)=>{ const c=it.getCh(); if(c==null){ it.noInput(line); return int(-1); } return int(CPP.c2b(c)); }});
def('gets','stdio',{argc:1,fn:(it,a,line)=>{ const s=it.readLine(); if(s==null){ it.noInput(line); return {t:T.ptr(Ty().tChar),v:null}; } it.writeCStr(a[0].v,s,line); return a[0]; }});
def('scanf','stdio',{lv:true,fn:(it,a,line)=>{
  const fmt=cstrArg(it,it.rv(a[0]),line); let k=1, n=0;
  for(let i=0;i<fmt.length;i++){
    const c=fmt[i];
    if(c!=='%'){ if(/\s/.test(c)) it.skipWs(); else { if(it.peekCh()===c) it.ip++; } continue; }
    i++; let w=''; while(/\d/.test(fmt[i])){ w+=fmt[i]; i++; } let L=''; while('hlL'.includes(fmt[i])){ L+=fmt[i]; i++; }
    const cv=fmt[i]; if(cv==='%'){ continue; }
    const arg=a[k++]; if(!arg) break;
    const p=it.rv(arg);
    if(!Ty().isPtr(p.t)) { it.warn('sc'+line,'В scanf перед переменной нужен & — scanf("%d", &x). Без него программа в Builder упадёт',line); throw rerr('scanf: передана не адресная переменная (нужен &)',line); }
    const cellAt=p.v.arr[p.v.i]; const tt=p.t.to;
    if('dioux'.includes(cv)){ const s=it.readToken('int',line); if(s==null) break; cellAt.v=Ty().toIntT(parseInt(s,cv==='x'?16:cv==='o'?8:10),tt.n||'int'); cellAt.u=false; n++; }
    else if('feEgG'.includes(cv)){ const s=it.readToken('float',line); if(s==null) break; let v=parseFloat(s); if(tt.n==='float') v=Math.fround(v); if(L!=='l'&&tt.n==='double') it.warn('scd'+line,'Для double в scanf нужен %lf, а не %f',line); cellAt.v=v; cellAt.u=false; n++; }
    else if(cv==='c'){ const ch=it.getCh(); if(ch==null){ it.noInput(line); break; } cellAt.v=Ty().toIntT(CPP.c2b(ch),"char"); n++; }
    else if(cv==='s'){ const s=it.readToken('word',line); if(s==null) break; it.writeCStr(p.v,s,line); n++; }
  }
  return int(n); }});
def('EOF','stdio',{val:()=>int(-1)});
// файлы — виртуальная файловая система
def('fopen','stdio',{fn:(it,a,line)=>{ const name=cstrArg(it,a[0],line), mode=cstrArg(it,a[1],line);
  if(mode[0]==='r'&&!it.files.has(name)) return {t:T.ptr({k:'p',n:'FILE'}),v:null};
  if(mode[0]==='w') it.files.set(name,''); if(mode[0]==='a'&&!it.files.has(name)) it.files.set(name,'');
  const f={name,mode,pos:0}; const c={v:f,t:{k:'p',n:'FILE'}}; return {t:T.ptr({k:'p',n:'FILE'}),v:{arr:[c],i:0,base:c,es:4}}; }});
const fileOf=(it,a,line)=>{ if(!a.v) throw rerr('Файл не открыт (указатель FILE* равен NULL) — проверь имя файла',line); return a.v.arr[0].v; };
def('fclose','stdio',{fn:(it,a,line)=>{ fileOf(it,a[0],line).closed=true; return int(0); }});
def('fprintf','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[0],line); const s=CPP.cformat(cstrArg(it,a[1],line),a.slice(2),x=>it.cstr(x.v,line),line); it.files.set(f.name,(it.files.get(f.name)||'')+s); return int(s.length); }});
def('fputs','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[1],line); it.files.set(f.name,(it.files.get(f.name)||'')+cstrArg(it,a[0],line)); return int(0); }});
def('fputc putc','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[1],line); it.files.set(f.name,(it.files.get(f.name)||'')+CPP.b2c(a[0].v)); return int(a[0].v); }});
def('fgets','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[2],line); const txt=it.files.get(f.name)||''; if(f.pos>=txt.length) return {t:a[0].t,v:null};
  let j=txt.indexOf('\n',f.pos); j=j<0?txt.length:j+1; let s=txt.slice(f.pos,j); const n=a[1].v; if(s.length>n-1){ s=s.slice(0,n-1); j=f.pos+n-1; } f.pos=j; it.writeCStr(a[0].v,s,line); return a[0]; }});
def('fgetc getc','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[0],line); const txt=it.files.get(f.name)||''; if(f.pos>=txt.length) return int(-1); return int(CPP.c2b(txt[f.pos++])); }});
def('feof','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[0],line); return int(f.pos>=(it.files.get(f.name)||'').length?1:0); }});
def('fscanf','stdio',{fn:(it,a,line)=>{ const f=fileOf(it,a[0],line); const txt=it.files.get(f.name)||''; const save=[it.input,it.ip,it.opts.echo,it.inFail];
  it.input=txt; it.ip=f.pos; it.opts.echo=false; it.inFail=false; let r; try{ r=LIB.scanf.fn(it,a.slice(1),line); } finally { f.pos=it.ip; [it.input,it.ip,it.opts.echo,it.inFail]=save; } return r; }});
def('stdin stdout','stdio',{val:()=>({t:T.ptr({k:'p',n:'FILE'}),v:null})});

/* ---------- conio ---------- */
// в консоли среды C++Builder getch() ждёт отдельного нажатия клавиши (не берёт символы из строки, введённой для cin)
def('getch getche','conio',{fn:(it)=>{ if(it.opts.interactive){ const ks=it.opts.keys||[]; it.ki=it.ki||0; if(it.ki<ks.length) return int(ks[it.ki++]); it.waitKey=true; throw new CPP.WaitSig(); } return int(13); }});
def('kbhit','conio',{fn:()=>int(1)});
def('clrscr','conio',{fn:(it)=>{ it.con.clear(); return vd(); }});
def('clreol','conio',{fn:()=>vd()});
def('gotoxy','conio',{argc:2,fn:(it,a)=>{ it.con.gotoxy(a[0].v,a[1].v); return vd(); }});
def('wherex','conio',{fn:(it)=>int(it.con.x+1)});
def('wherey','conio',{fn:(it)=>int(it.con.y+1)});
def('textcolor','conio',{argc:1,fn:(it,a)=>{ it.conioAttr=((it.conioAttr==null?7:it.conioAttr)&0xf0)|(a[0].v&15); return vd(); }});
def('textbackground','conio',{argc:1,fn:(it,a)=>{ it.conioAttr=((it.conioAttr==null?7:it.conioAttr)&0x0f)|((a[0].v&7)<<4); return vd(); }});
def('textattr','conio',{argc:1,fn:(it,a)=>{ it.conioAttr=a[0].v&255; return vd(); }});
def('cprintf','conio',{fn:(it,a,line)=>{ const s=CPP.cformat(cstrArg(it,a[0],line),a.slice(1),x=>it.cstr(x.v,line),line); it.con.write(s,it.conioAttr==null?7:it.conioAttr,true); return int(s.length); }});
def('cputs','conio',{fn:(it,a,line)=>{ it.con.write(cstrArg(it,a[0],line),it.conioAttr==null?7:it.conioAttr,true); return int(0); }});
def('putch','conio',{fn:(it,a)=>{ it.con.write(CPP.b2c(a[0].v),it.conioAttr==null?7:it.conioAttr,true); return int(a[0].v); }});
const COLORS='BLACK BLUE GREEN CYAN RED MAGENTA BROWN LIGHTGRAY DARKGRAY LIGHTBLUE LIGHTGREEN LIGHTCYAN LIGHTRED LIGHTMAGENTA YELLOW WHITE'.split(' ');
COLORS.forEach((c,i)=>{ LIB[c]={g:['conio'],val:()=>int(i)}; });
LIB.BLINK={g:['conio'],val:()=>int(128)};

/* ---------- windows ---------- */
def('Sleep','windows',{argc:1,fn:()=>vd()});
def('GetStdHandle','windows',{fn:()=>int(7)});
def('STD_OUTPUT_HANDLE STD_INPUT_HANDLE','windows',{val:()=>int(-11)});
def('SetConsoleTextAttribute','windows',{argc:2,fn:(it,a)=>{ it.con.attr=a[1].v&255; return int(1); }});
def('SetConsoleCP SetConsoleOutputCP','windows',{fn:()=>int(1)});
def('CharToOem AnsiToOem','windows',{fn:(it,a,line)=>{ it.writeCStr(a[1].v,cstrArg(it,a[0],line),line); return int(1); }});
const FG={FOREGROUND_BLUE:1,FOREGROUND_GREEN:2,FOREGROUND_RED:4,FOREGROUND_INTENSITY:8,BACKGROUND_BLUE:16,BACKGROUND_GREEN:32,BACKGROUND_RED:64,BACKGROUND_INTENSITY:128};
for(const k in FG) LIB[k]={g:['windows'],val:()=>int(FG[k])};
def('delay sleep','dos',{fn:()=>vd()});

/* ---------- math ---------- */
const dom=(nm,cond)=>(x,y)=>cond(x,y)?`${nm}: математическая ошибка — аргумент вне области определения (в Builder появится сообщение «${nm}: DOMAIN error», результат NAN)`:null;
mathFn('sqrt',Math.sqrt,dom('sqrt',x=>x<0));
mathFn('pow',(x,y)=>Math.pow(x,y),dom('pow',(x,y)=>x<0&&!Number.isInteger(y)));
mathFn('sin',Math.sin); mathFn('cos',Math.cos); mathFn('tan',Math.tan);
mathFn('asin',Math.asin,dom('asin',x=>x<-1||x>1)); mathFn('acos',Math.acos,dom('acos',x=>x<-1||x>1)); mathFn('atan',Math.atan); mathFn('atan2',Math.atan2);
mathFn('exp',Math.exp); mathFn('log',Math.log,dom('log',x=>x<=0)); mathFn('log10',Math.log10,dom('log10',x=>x<=0));
mathFn('sinh',Math.sinh); mathFn('cosh',Math.cosh); mathFn('tanh',Math.tanh);
mathFn('fabs',Math.abs); mathFn('ceil',Math.ceil); mathFn('floor',Math.floor);
mathFn('fmod',(x,y)=>x%y); mathFn('hypot',Math.hypot); mathFn('pow10',x=>Math.pow(10,x));
mathFn('ldexp',(x,e)=>x*Math.pow(2,e));
LIB.abs={g:['math','stdlib'],fn:(it,a,line)=>{ const x=a[0]; if(Ty().isFlt(x.t)) it.warn('abs'+line,`abs() работает только с целыми: ${CPP.numStr(x.v,'g',6)} превратится в ${Math.trunc(x.v)}. Для дробных используй fabs()`,line); return int(Math.abs(Ty().toIntT(x.v,'int'))); }};
LIB.labs={g:['math','stdlib'],fn:(it,a)=>int(Math.abs(a[0].v|0))};
LIB.M_PI={g:['math'],val:()=>num(Math.PI)}; LIB.M_E={g:['math'],val:()=>num(Math.E)};
LIB.M_PI_2={g:['math'],val:()=>num(Math.PI/2)}; LIB.M_SQRT2={g:['math'],val:()=>num(Math.SQRT2)};
for(const nm of ['round','cbrt','log2','trunc']) LIB[nm]={g:['__none'],fn:(it,a,line)=>{ throw cerr(`Функции ${nm}() в C++Builder 6 нет (она появилась в C99/C++11). ${nm==='round'?'Округлить можно так: floor(x + 0.5)':nm==='cbrt'?'Кубический корень: pow(x, 1/3.)':''}`,line,'E2268'); }};

/* ---------- stdlib ---------- */
def('rand','stdlib',{fn:()=>int(CPP.RNG.rand())});
def('srand','stdlib',{argc:1,fn:(it,a)=>{ CPP.RNG.srand(a[0].v); it.randomized=true; return vd(); }});
def('random','stdlib',{argc:1,fn:(it,a)=>{ const n=a[0].v|0; return int(n?CPP.RNG.lrand()%n:0); }});
def('randomize','stdlib',{fn:(it)=>{ CPP.RNG.srand(Date.now()/1000|0); it.randomized=true; return vd(); }});
def('RAND_MAX','stdlib',{val:()=>int(32767)});
def('atoi atol','stdlib',{argc:1,fn:(it,a,line)=>{ const m=cstrArg(it,a[0],line).match(/^\s*[+-]?\d+/); return int(m?parseInt(m[0],10):0); }});
def('atof','stdlib',{argc:1,fn:(it,a,line)=>{ const m=cstrArg(it,a[0],line).match(/^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/); return num(m?parseFloat(m[0]):0); }});
def('itoa ltoa','stdlib',{argc:3,fn:(it,a,line)=>{ const r=a[2].v||10; const s=r===10?String(a[0].v|0):(a[0].v>>>0).toString(r); it.writeCStr(a[1].v,s,line); return a[1]; }});
def('exit','stdlib',{argc:1,fn:(it,a)=>{ throw new CPP.signals.ExitSig(a[0].v); }});
def('system','stdlib',{argc:1,fn:(it,a,line)=>{ const c=cstrArg(it,a[0],line).trim().toLowerCase(); if(c==='cls') it.con.clear(); else if(c==='pause') it.out('Для продолжения нажмите любую клавишу . . . '); else if(/^chcp/.test(c)) it.out('Текущая кодовая страница: '+c.split(/\s+/)[1]+'\n'); return int(0); }});
def('max min','stdlib algorithm',{argc:2,fn:(it,a,line,sc,e)=>{ const nm=e.f.name; const x=a[0],y=a[1]; const big=nm==='max'?(x.v>=y.v?x:y):(x.v<=y.v?x:y); return {t:Ty().isFlt(x.t)||Ty().isFlt(y.t)?Ty().tDbl:x.t,v:big.v}; }});
def('swap','algorithm iostream',{std:true,lv:true,argc:2,fn:(it,a,line)=>{ if(!a[0].lv||!a[1].lv) throw cerr('swap меняет местами две переменные',line); const t=a[0].cell.v; a[0].cell.v=a[1].cell.v; a[1].cell.v=t; return vd(); }});
def('malloc','stdlib',{fn:(it,a,line)=>{ throw cerr('malloc в этом курсе не используем — пиши new',line); }});

/* ---------- limits ---------- */
LIB.INT_MAX={g:['limits'],val:()=>int(2147483647)}; LIB.INT_MIN={g:['limits'],val:()=>int(-2147483648)};
LIB.UINT_MAX={g:['limits'],val:()=>({t:Ty().tUint,v:4294967295})}; LIB.CHAR_MAX={g:['limits'],val:()=>int(127)}; LIB.CHAR_MIN={g:['limits'],val:()=>int(-128)};
LIB.SHRT_MAX={g:['limits'],val:()=>int(32767)}; LIB.LONG_MAX={g:['limits'],val:()=>int(2147483647)};
LIB.MAXINT={g:['limits'],val:()=>int(2147483647)};

/* ---------- time ---------- */
def('time','time',{fn:(it,a)=>{ const v=Date.now()/1000|0; if(a[0]&&a[0].v){ a[0].v.arr[a[0].v.i].v=v; } return {t:Ty().tLong,v}; }});
def('clock','time',{fn:(it)=>int(it.steps/100|0)});
def('CLOCKS_PER_SEC CLK_TCK','time',{val:()=>int(1000)});
def('difftime','time',{fn:(it,a)=>num(a[0].v-a[1].v)});

/* ---------- string.h ---------- */
const P_=(it,a,line)=>{ const p=a.v; if(!p) throw rerr('Строковая функция получила нулевой указатель (NULL)',line); return p; };
const S_=(it,a,line)=>cstrArg(it,a,line);
const w=(it,a,s,line)=>it.writeCStr(P_(it,a,line),s,line);
def('strlen','cstring',{argc:1,fn:(it,a,line)=>({t:Ty().tUint,v:S_(it,a[0],line).length})});
def('strcpy','cstring',{argc:2,fn:(it,a,line)=>{ w(it,a[0],S_(it,a[1],line),line); return a[0]; }});
def('strncpy','cstring',{argc:3,fn:(it,a,line)=>{ const s=S_(it,a[1],line), n=a[2].v; const p=P_(it,a[0],line); for(let k=0;k<n;k++){ const c=p.arr[p.i+k]; if(!c) throw rerr('strncpy вышла за границу массива',line); c.v=k<s.length?Ty().toIntT(CPP.c2b(s[k]),"char"):0; c.u=false; } return a[0]; }});
def('strcat','cstring',{argc:2,fn:(it,a,line)=>{ w(it,a[0],S_(it,a[0],line)+S_(it,a[1],line),line); return a[0]; }});
def('strncat','cstring',{argc:3,fn:(it,a,line)=>{ w(it,a[0],S_(it,a[0],line)+S_(it,a[1],line).slice(0,a[2].v),line); return a[0]; }});
const cmp=(x,y)=>{ for(let k=0;k<Math.max(x.length,y.length);k++){ const a=k<x.length?CPP.c2b(x[k]):0, b=k<y.length?CPP.c2b(y[k]):0; if(a!==b) return a-b; } return 0; };
def('strcmp','cstring',{argc:2,fn:(it,a,line)=>int(cmp(S_(it,a[0],line),S_(it,a[1],line)))});
def('strncmp','cstring',{argc:3,fn:(it,a,line)=>int(cmp(S_(it,a[0],line).slice(0,a[2].v),S_(it,a[1],line).slice(0,a[2].v)))});
def('stricmp strcmpi','cstring',{argc:2,fn:(it,a,line)=>int(cmp(S_(it,a[0],line).toLowerCase(),S_(it,a[1],line).toLowerCase()))});
def('strnicmp strncmpi','cstring',{argc:3,fn:(it,a,line)=>int(cmp(S_(it,a[0],line).slice(0,a[2].v).toLowerCase(),S_(it,a[1],line).slice(0,a[2].v).toLowerCase()))});
const ptrAt=(p,k)=>k<0?null:Object.assign({},p,{i:p.i+k});
def('strchr','cstring',{argc:2,fn:(it,a,line)=>{ const s=S_(it,a[0],line); const ch=CPP.b2c(a[1].v); const k=ch==='\0'?s.length:s.indexOf(ch); return {t:a[0].t,v:ptrAt(P_(it,a[0],line),k)}; }});
def('strrchr','cstring',{argc:2,fn:(it,a,line)=>{ const s=S_(it,a[0],line); const k=s.lastIndexOf(CPP.b2c(a[1].v)); return {t:a[0].t,v:ptrAt(P_(it,a[0],line),k)}; }});
def('strstr','cstring',{argc:2,fn:(it,a,line)=>{ const k=S_(it,a[0],line).indexOf(S_(it,a[1],line)); return {t:a[0].t,v:ptrAt(P_(it,a[0],line),k)}; }});
def('strpbrk','cstring',{argc:2,fn:(it,a,line)=>{ const s=S_(it,a[0],line), set=S_(it,a[1],line); let k=-1; for(let i=0;i<s.length;i++) if(set.includes(s[i])){ k=i; break; } return {t:a[0].t,v:ptrAt(P_(it,a[0],line),k)}; }});
def('strspn','cstring',{argc:2,fn:(it,a,line)=>{ const s=S_(it,a[0],line), set=S_(it,a[1],line); let k=0; while(k<s.length&&set.includes(s[k])) k++; return int(k); }});
def('strcspn','cstring',{argc:2,fn:(it,a,line)=>{ const s=S_(it,a[0],line), set=S_(it,a[1],line); let k=0; while(k<s.length&&!set.includes(s[k])) k++; return int(k); }});
def('strrev','cstring',{argc:1,fn:(it,a,line)=>{ w(it,a[0],[...S_(it,a[0],line)].reverse().join(''),line); return a[0]; }});
const up=s=>s.replace(/[a-z]/g,c=>c.toUpperCase()), lo=s=>s.replace(/[A-Z]/g,c=>c.toLowerCase());
def('strupr','cstring',{argc:1,fn:(it,a,line)=>{ w(it,a[0],up(S_(it,a[0],line)),line); return a[0]; }});
def('strlwr','cstring',{argc:1,fn:(it,a,line)=>{ w(it,a[0],lo(S_(it,a[0],line)),line); return a[0]; }});
def('strset','cstring',{argc:2,fn:(it,a,line)=>{ const s=S_(it,a[0],line); w(it,a[0],CPP.b2c(a[1].v).repeat(s.length),line); return a[0]; }});
def('strnset','cstring',{argc:3,fn:(it,a,line)=>{ const s=S_(it,a[0],line); const n=Math.min(a[2].v,s.length); w(it,a[0],CPP.b2c(a[1].v).repeat(n)+s.slice(n),line); return a[0]; }});
def('strdup','cstring',{argc:1,fn:(it,a,line)=>{ const s=S_(it,a[0],line); const owner={v:null,heap:true,t:T.arr(Ty().tChar,null)}; owner.t.nv=s.length+1; owner.v=[...s,'\0'].map((c,k)=>({v:Ty().toIntT(CPP.c2b(c),"char"),owner,i:k,es:1,t:Ty().tChar})); return {t:T.ptr(Ty().tChar),v:{arr:owner.v,i:0,base:owner,es:1}}; }});
def('memset','cstring',{argc:3,fn:(it,a,line)=>{ const p=P_(it,a[0],line); const n=a[2].v; const es=p.es||1; for(let k=0;k<Math.ceil(n/es);k++){ const c=p.arr[p.i+k]; if(!c) break; c.v=a[1].v===0?0:(es===1?Ty().toIntT(a[1].v,'char'):a[1].v); c.u=false; } return a[0]; }});
def('strtok','cstring',{argc:2,fn:(it,a,line)=>{
  let p=a[0].v; const delim=S_(it,a[1],line);
  if(!p){ p=it.strtokNext; if(!p) return {t:T.ptr(Ty().tChar),v:null}; }
  let i=p.i; const arr=p.arr; while(arr[i]&&arr[i].v&&delim.includes(CPP.b2c(arr[i].v))) i++;
  if(!arr[i]||arr[i].v===0){ it.strtokNext=null; return {t:T.ptr(Ty().tChar),v:null}; }
  const st=i; while(arr[i]&&arr[i].v&&!delim.includes(CPP.b2c(arr[i].v))) i++;
  if(arr[i]&&arr[i].v){ arr[i].v=0; it.strtokNext=Object.assign({},p,{i:i+1}); } else it.strtokNext=null;
  return {t:T.ptr(Ty().tChar),v:Object.assign({},p,{i:st})}; }});

/* ---------- ctype ---------- */
const ctype=(nm,f)=>{ LIB[nm]={g:['ctype'],argc:1,fn:(it,a)=>int(f(CPP.b2c(a[0].v))?1:0)}; };
ctype('isdigit',c=>/[0-9]/.test(c)); ctype('isalpha',c=>/[A-Za-z]/.test(c)); ctype('isalnum',c=>/[A-Za-z0-9]/.test(c));
ctype('isspace',c=>/[ \t\n\r\f\v]/.test(c)); ctype('isupper',c=>/[A-Z]/.test(c)); ctype('islower',c=>/[a-z]/.test(c));
ctype('ispunct',c=>/[!-\/:-@\[-`{-~]/.test(c)); ctype('isxdigit',c=>/[0-9a-fA-F]/.test(c));
LIB.toupper={g:['ctype'],argc:1,fn:(it,a)=>int(/[a-z]/.test(CPP.b2c(a[0].v))?a[0].v-32:a[0].v)};
LIB.tolower={g:['ctype'],argc:1,fn:(it,a)=>int(/[A-Z]/.test(CPP.b2c(a[0].v))?a[0].v+32:a[0].v)};

/* ---------- SysUtils (vcl.h) ---------- */
const fltStr=v=>CPP.numStr(v,'g',15).replace(/e\+?(-?)0*(\d)/,'E$1$2');
def('IntToStr','sysutils',{argc:1,fn:(it,a,line)=>{ if(!Ty().isInt(a[0].t)) throw cerr('IntToStr принимает целое. Для дробного — FloatToStr',line,'E2xxx'); return str(String(a[0].v),true); }});
def('FloatToStr','sysutils',{argc:1,fn:(it,a)=>str(fltStr(a[0].v),true)});
def('StrToInt','sysutils',{argc:1,fn:(it,a,line)=>{ const s=cstrArg(it,a[0],line,true).trim(); if(!/^[+-]?\d+$/.test(s)) throw rerr(`'${s}' is not a valid integer value — строку «${s}» нельзя превратить в целое число (EConvertError)`,line); return int(parseInt(s,10)); }});
def('StrToFloat','sysutils',{argc:1,fn:(it,a,line)=>{ const s0=cstrArg(it,a[0],line,true).trim(); const s=s0.replace(',','.'); if(!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) throw rerr(`'${s0}' is not a valid floating point value — «${s0}» не число (EConvertError)`,line); return num(parseFloat(s)); }});
def('FloatToStrF','sysutils',{fn:(it,a)=>{ const v=a[0].v, fmt=a[1].v, prec=a[2]?a[2].v:15, dig=a[3]?a[3].v:2; return str(fmt===0?CPP.numStr(v,'g',prec):CPP.numStr(v,'f',dig),true); }});
def('FormatFloat','sysutils',{argc:2,fn:(it,a,line)=>{ const f=cstrArg(it,a[0],line); const m=f.match(/\.(0+|#+)/); const d=m?m[1].length:0; return str(CPP.numStr(a[1].v,'f',d),true); }});
def('IntToHex','sysutils',{argc:2,fn:(it,a)=>str((a[0].v>>>0).toString(16).toUpperCase().padStart(a[1].v,'0'),true)});
def('UpperCase AnsiUpperCase','sysutils',{argc:1,fn:(it,a,line)=>str(cstrArg(it,a[0],line).toUpperCase(),true)});
def('LowerCase AnsiLowerCase','sysutils',{argc:1,fn:(it,a,line)=>str(cstrArg(it,a[0],line).toLowerCase(),true)});
def('Trim','sysutils',{argc:1,fn:(it,a,line)=>str(cstrArg(it,a[0],line).trim(),true)});
def('ShowMessage','sysutils',{argc:1,fn:(it,a,line)=>{ const s=cstrArg(it,a[0],line,true); if(it.vcl&&it.vcl.showMessage) it.vcl.showMessage(s); else it.out('[ShowMessage] '+s+'\n'); return vd(); }});

/* ---------- методы string / AnsiString ---------- */
CPP.strMethod=function(it,x,m,args,line){
  const holder=x.lv?x.cell:{v:x.v};
  const s=holder.v; const t=Ty().unref(x.t); const ansi=t.ansi;
  const A=k=>{ const a=args[k]; return a?it.rv(a):null; };
  const S=k=>{ const a=A(k); if(!a) return ''; if(Ty().isCharT(a.t)) return CPP.b2c(a.v); return it.toJsStr(a,line); };
  const N=k=>A(k).v;
  const npos=4294967295;
  const U=v=>({t:Ty().tUint,v:v<0?npos:v});
  const mut=v=>{ if(!x.lv) throw cerr('Изменять можно только строку-переменную',line); if(t.c) throw cerr('Строка объявлена const — менять её нельзя',line,'E2024'); holder.v=v; };
  const cptr=()=>{ const owner={v:null,t:T.arr(Ty().tChar,null),ro:true}; owner.t.nv=s.length+1; owner.v=[...s,'\0'].map((c,k)=>({v:Ty().toIntT(CPP.c2b(c),"char"),owner,i:k,es:1,t:Ty().tChar,ro:true})); return {t:T.ptr(Object.assign({},Ty().tChar,{c:true})),v:{arr:owner.v,i:0,base:owner,es:1},isLit:true}; };
  if(ansi){
    switch(m){
      case 'Length': return int(s.length);
      case 'SubString': return str(s.substr(N(0)-1,N(1)),true);
      case 'Pos': return int(s.indexOf(S(0))+1);
      case 'Insert': mut(s.slice(0,N(1)-1)+S(0)+s.slice(N(1)-1)); return vd();
      case 'Delete': mut(s.slice(0,N(0)-1)+s.slice(N(0)-1+N(1))); return vd();
      case 'UpperCase': return str(s.toUpperCase(),true);
      case 'LowerCase': return str(s.toLowerCase(),true);
      case 'Trim': return str(s.trim(),true);
      case 'IsEmpty': return bool(!s.length);
      case 'ToInt': { if(!/^\s*[+-]?\d+\s*$/.test(s)) throw rerr(`'${s}' is not a valid integer value (EConvertError)`,line); return int(parseInt(s,10)); }
      case 'ToDouble': { const v=parseFloat(s.replace(',','.')); if(Number.isNaN(v)) throw rerr(`'${s}' is not a valid floating point value (EConvertError)`,line); return num(v); }
      case 'c_str': return cptr();
      case 'SetLength': mut(s.slice(0,N(0)).padEnd(N(0),' ')); return vd();
    }
    throw cerr(`У AnsiString нет метода ${m}()`,line,'E2316');
  }
  switch(m){
    case 'length': case 'size': return U(s.length);
    case 'empty': return bool(!s.length);
    case 'clear': mut(''); return vd();
    case 'c_str': case 'data': return cptr();
    case 'substr':{ const p=args.length?N(0):0; if(p>s.length) throw rerr(`substr: позиция ${p} больше длины строки ${s.length} (out_of_range)`,line); return str(args.length>1?s.substr(p,N(1)):s.slice(p)); }
    case 'find':{ const p=args.length>1?N(1):0; return U(s.indexOf(S(0),p)); }
    case 'rfind':{ const p=args.length>1?N(1):Infinity; return U(s.lastIndexOf(S(0),p)); }
    case 'find_first_of':{ const set=S(0); for(let k=args.length>1?N(1):0;k<s.length;k++) if(set.includes(s[k])) return U(k); return U(-1); }
    case 'find_last_of':{ const set=S(0); for(let k=s.length-1;k>=0;k--) if(set.includes(s[k])) return U(k); return U(-1); }
    case 'find_first_not_of':{ const set=S(0); for(let k=0;k<s.length;k++) if(!set.includes(s[k])) return U(k); return U(-1); }
    case 'insert':{ const p=N(0); if(p>s.length) throw rerr('insert: позиция больше длины строки',line); mut(s.slice(0,p)+S(1)+s.slice(p)); return x; }
    case 'erase':{ const p=args.length?N(0):0; const n=args.length>1?N(1):Infinity; if(p>s.length) throw rerr('erase: позиция больше длины строки',line); mut(s.slice(0,p)+(n===Infinity?'':s.slice(p+n))); return x; }
    case 'replace':{ const p=N(0), n=N(1); mut(s.slice(0,p)+S(2)+s.slice(p+n)); return x; }
    case 'append': mut(s+(args.length>1&&Ty().isInt(A(0).t)?CPP.b2c(N(1)).repeat(N(0)):S(0))); return x;
    case 'push_back': mut(s+CPP.b2c(N(0))); return vd();
    case 'at':{ const k=N(0); if(k<0||k>=s.length) throw rerr(`at(${k}): индекс вне строки длиной ${s.length} (out_of_range)`,line);
      const c={get v(){ return Ty().toIntT(CPP.c2b(holder.v[k]),"char"); }, set v(z){ mut(holder.v.slice(0,k)+CPP.b2c(z)+holder.v.slice(k+1)); }}; return {t:Ty().tChar,cell:c,lv:true}; }
    case 'compare': { const o=S(0); return int(s<o?-1:s>o?1:0); }
    case 'swap': { const o=args[0]; const tmp=o.cell.v; o.cell.v=s; mut(tmp); return vd(); }
    case 'resize': mut(s.slice(0,N(0)).padEnd(N(0),args[1]?CPP.b2c(N(1)):'\0')); return vd();
  }
  throw cerr(`У string нет метода ${m}()`,line,'E2316');
};
})(typeof window!=='undefined'?window:globalThis);
