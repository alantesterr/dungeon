/* Учебный интерпретатор C++ — исполнитель. Ведёт себя как программа, собранная в Borland C++Builder 6:
   int 32 бита, деление целых, double в cout как %g с 6 цифрами, адреса десятичным числом и т. д. */
(function(G){
'use strict';
const CPP=G.CPP; const {CppError,T}=CPP;

const BRK={sig:'break'}, CNT={sig:'continue'};
class RetSig{ constructor(v){ this.v=v; } }
class GotoSig{ constructor(l,line){ this.label=l; this.line=line; } }
class ExitSig{ constructor(c){ this.code=c; } }
class WaitSig{}   // интерактивная консоль: программа ждёт ввод, а введённых строк больше нет
CPP.WaitSig=WaitSig;
const rerr=(msg,line)=>new CppError(msg,line,'runtime');
const cerr=(msg,line,code)=>new CppError(msg,line,'compile',code);

/* ---------------- типы ---------------- */
const INTS=new Set(['char','uchar','short','ushort','int','uint','long','ulong','llong','bool']);
const FLTS=new Set(['float','double','ldouble']);
const P=n=>({k:'p',n});
const tInt=P('int'), tDbl=P('double'), tBool=P('bool'), tChar=P('char'), tVoid=P('void'), tFlt=P('float'), tUint=P('uint'), tLong=P('long');
const tOs=P('ostream'), tIs=P('istream'), tManip=P('manip');
const unref=t=>t&&t.k==='ref'?t.to:t;
const isInt=t=>!!t&&((t.k==='p'&&INTS.has(t.n))||t.k==='enum');
const isFlt=t=>!!t&&t.k==='p'&&FLTS.has(t.n);
const isNum=t=>isInt(t)||isFlt(t);
const isPtr=t=>!!t&&t.k==='ptr';
const isStr=t=>!!t&&t.k==='str';
const isCls=t=>!!t&&t.k==='cls';
const isArr=t=>!!t&&t.k==='arr';
const isVoid=t=>!!t&&t.k==='p'&&t.n==='void';
const isCharT=t=>!!t&&t.k==='p'&&(t.n==='char'||t.n==='uchar');
const PN={char:'char',uchar:'unsigned char',short:'short',ushort:'unsigned short',int:'int',uint:'unsigned int',long:'long',ulong:'unsigned long',llong:'__int64',
  bool:'bool',float:'float',double:'double',ldouble:'long double',void:'void',ostream:'ostream',istream:'istream',manip:'манипулятор',FILE:'FILE'};
function tname(t){
  if(!t) return '?';
  const c=t.c?'const ':'';
  switch(t.k){
    case 'p': return c+(PN[t.n]||t.n);
    case 'ptr': return tname(t.to)+' *';
    case 'ref': return tname(t.to)+' &';
    case 'arr': return tname(t.of)+'['+(t.n==null?'':t.nv!=null?t.nv:'')+']';
    case 'str': return c+(t.ansi?'AnsiString':'string');
    case 'cls': return c+t.name;
    case 'enum': return c+t.name;
  }
  return '?';
}
CPP.tname=tname;
const SZ={char:1,uchar:1,bool:1,short:2,ushort:2,int:4,uint:4,long:4,ulong:4,llong:8,float:4,double:8,ldouble:10,void:1};
function wrapInt(v,n){
  switch(n){
    case 'char': return (v<<24)>>24;
    case 'uchar': return v&255;
    case 'short': return (v<<16)>>16;
    case 'ushort': return v&65535;
    case 'uint': case 'ulong': return v>>>0;
    case 'bool': return v?1:0;
    case 'llong': return Math.trunc(v);
    default: return v|0;
  }
}
function toIntT(v,n){
  if(typeof v!=='number') v=Number(v)||0;
  if(!Number.isFinite(v)) v=Number.isNaN(v)?0:-2147483648;
  return wrapInt(Math.trunc(v),n);
}
function arith(t1,t2){ // обычные арифметические преобразования
  const n1=t1.k==='enum'?'int':t1.n, n2=t2.k==='enum'?'int':t2.n;
  if(n1==='ldouble'||n2==='ldouble'||n1==='double'||n2==='double') return tDbl;
  if(n1==='float'||n2==='float') return tFlt;
  if(n1==='llong'||n2==='llong') return P('llong');
  if(n1==='uint'||n2==='uint'||n1==='ulong'||n2==='ulong') return tUint;
  return tInt;
}
function promote(t){ if(t.k==='enum') return tInt; if(t.k==='p'&&['char','uchar','short','ushort','bool'].includes(t.n)) return tInt; return t; }

/* ---------------- значения и память ---------------- */
// Ячейка: {v, u (не присвоена), name}. Массив: ячейка с v = [ячейки]. Объект: ячейка с v = {cls, f:{поле: ячейка}}.
// Указатель: null или {arr:[ячейки], i, base:ячейка-владелец, es:размер элемента}
let ADDR_STACK=0x1AFF40, ADDR_HEAP=0x8F2A40, ADDR_DATA=0x40A128;
function cell(v,extra){ const c={v}; if(extra) Object.assign(c,extra); return c; }

class Interp{
  constructor(prog,opts){
    this.prog=prog; this.opts=opts||{};
    this.con=new CPP.Console();
    this.steps=0; this.maxSteps=this.opts.maxSteps||4000000;
    this.input=String(this.opts.input||'').replace(/\r\n?/g,'\n'); this.ip=0; this.echoedTo=-1; this.inFail=false;
    this.warnings=[]; this.warned=new Set();
    this.os={w:0,prec:6,fixed:false,sci:false,left:false,fill:' ',base:10,showpoint:false,boolalpha:false,showpos:false,upper:false};
    this.classes=new Map(); this.funcs=new Map(); this.globals=new Map(); this.enumConsts=new Map();
    this.statics=new Map(); // static-переменные функций по узлу
    this.files=new Map(Object.entries(this.opts.files||{})); this.openFiles=[];
    this.dtorsGlobal=[];
    this.groups=new Set(); this.dotH=new Set(); this.usingStd=false; this.usedStdQual=false;
    this.vcl=this.opts.vcl||null; // хук для эмулятора C++Builder
    ADDR_STACK=0x1AFF40; ADDR_HEAP=0x8F2A40; ADDR_DATA=0x40A128;
    CPP.RNG.reset();
    CPP.addrOf=(v)=>this.ptrAddr(v.v);
  }

  /* ---------- подготовка ---------- */
  setup(){
    const pr=this.prog;
    for(const h of pr.headers){
      const m=CPP.HDR[h.name];
      if(!m) throw cerr(`Не найден заголовочный файл «${h.name}». В C++Builder 6 есть, например, iostream.h, math.h, conio.h, stdlib.h, string.h`,h.line,'F1003');
      const [g,dot]=m; (CPP.IMPLIES[g]||[g]).forEach(x=>this.groups.add(x)); this.groups.add(g); if(dot) this.dotH.add(g); else this.dotH.add(g+'!std');
    }
    for(const d of pr.decls) if(d.k==='using'&&d.name==='std') this.usingStd=true;
    for(const e of pr.enumDefs){ let v=0; for(const it of e.items){ if(it.val) v=this.constEval(it.val); this.enumConsts.set(it.name,{t:e.name?T.enm(e.name):tInt,v}); v++; } }
    for(const def of pr.classDefs) this.defineClass(def);
    for(const d of pr.decls){
      if(d.k==='func'){
        if(d.cls){ this.attachMethod(d); continue; }
        const list=this.funcs.get(d.name)||[];
        const same=list.find(f=>f.params.length===d.params.length&&f.params.every((p,i)=>sameType(p.t,d.params[i].t)));
        if(same){ if(d.body){ if(same.body) throw cerr(`Функция ${d.name} описана дважды`,d.line,'E2171'); Object.assign(same,{body:d.body,line:d.line,params:mergeParams(same.params,d.params)}); } else same.params=mergeParams(same.params,d.params); }
        else list.push(Object.assign({},d));
        this.funcs.set(d.name,list);
      }
    }
  }
  defineClass(def){
    if(this.classes.has(def.name)) throw cerr(`Класс ${def.name} объявлен дважды`,def.line,'E2238');
    const ci={name:def.name,def,bases:def.bases.map(b=>{ const bc=this.classes.get(b.name); if(!bc&&!(this.vcl&&this.vcl.hasClass(b.name))) throw cerr(`Базовый класс ${b.name} не объявлен`,def.line,'E2303'); return {ci:bc,access:b.access,name:b.name}; }),
      fields:def.fields, methods:new Map(), statics:new Map(), props:new Map()};
    for(const m of def.methods){ const l=ci.methods.get(m.name)||[]; l.push(Object.assign({},m,{ci})); ci.methods.set(m.name,l); }
    for(const s of def.statics){ ci.statics.set(s.name,{t:s.t,access:s.access,cell:cell(this.zero(s.t)),decl:s}); }
    for(const pr of def.props) ci.props.set(pr.name,pr);
    for(const e of def.enums){ let v=0; for(const it of e.items){ if(it.val) v=this.constEval(it.val); this.enumConsts.set(it.name,{t:tInt,v}); v++; } }
    this.classes.set(def.name,ci);
  }
  attachMethod(d){
    const ci=this.classes.get(d.cls);
    if(!ci) throw cerr(`Класс ${d.cls} не объявлен`,d.line,'E2316');
    const list=ci.methods.get(d.name);
    const m=list&&list.find(f=>f.params.length===d.params.length&&f.params.every((p,i)=>sameType(p.t,d.params[i].t)));
    if(!m) throw cerr(`В классе ${d.cls} нет метода ${d.name} с такими параметрами — сначала объяви его внутри класса`,d.line,'E2316');
    if(m.body) throw cerr(`Метод ${d.cls}::${d.name} описан дважды`,d.line,'E2171');
    m.body=d.body; m.inits=d.inits; m.defLine=d.line; m.params=mergeParams(m.params,d.params);
  }
  constEval(e){ const v=this.ev(e,null); return Math.trunc(this.rv(v).v); }

  /* ---------- запуск ---------- */
  prepare(){ // разбор имён и глобальные переменные (без вызова main) — нужно и для обработчиков событий VCL
    this.setup();
    this.checkProgram();
    this.globalScope={vars:new Map(),parent:null,objs:[],isGlobal:true}; this.gInit=new Set();
    for(const d of this.prog.decls){
      if(d.k!=="var") continue;
      if(d.cls){ const ci=this.classes.get(d.cls); const st=ci&&ci.statics.get(d.name); if(!st) throw cerr(`В классе ${d.cls} нет static-поля ${d.name}`,d.line,"E2316");
        if(d.init) st.cell.v=this.convertTo(this.rv(this.ev(d.init,this.globalScope)),st.t,d.line).v; st.defined=true; continue; }
      this.declareVar(d,this.globalScope,true);
    }
  }
  run(){
    const out={ok:true};
    try{
      this.prepare();
      const mains=this.funcs.get('main');
      if(!mains||!mains[0].body) throw cerr('В программе нет функции main() — выполнение начинается с неё',0,'E2xxx');
      const main=mains[0];
      let code=0;
      try{
        const args=main.params.length?[{t:tInt,v:1},{t:T.ptr(T.ptr(tChar)),v:null}].slice(0,main.params.length):[];
        const r=this.callFunc(main,args,null,main.line);
        code=r&&r.v!=null?r.v:0;
      }catch(e){ if(e instanceof ExitSig) code=e.code; else throw e; }
      this.runDtors(this.globalScope);
      out.exitCode=code;
    }catch(e){
      if(e instanceof WaitSig){ out.waiting=true; out.waitKey=!!this.waitKey; }
      else if(e instanceof ExitSig){ out.exitCode=e.code; }
      else if(e instanceof CppError){ out.ok=false; out.error=e; }
      else if(e instanceof RangeError&&/call stack/i.test(e.message)){ out.ok=false; out.error=rerr('Переполнение стека (Stack overflow): рекурсия не останавливается — проверь условие выхода',0); }
      else { out.ok=false; out.error=rerr('Внутренняя ошибка тренажёра: '+e.message,0); out.internal=e; }
    }
    out.lines=this.con.lines(); out.screen=this.con.colored(); out.warnings=this.warnings; out.steps=this.steps;
    out.inputLeft=this.input.slice(this.ip);
    return out;
  }
  warn(key,msg,line){ if(this.warned.has(key)) return; this.warned.add(key); this.warnings.push({msg,line}); }
  tick(line){ if(++this.steps>this.maxSteps) throw rerr('Программа работает слишком долго — похоже на бесконечный цикл. Проверь, меняется ли переменная в условии цикла',line); }

  /* ---------- проверка имён до запуска (как компилятор) ---------- */
  checkProgram(){
    const self=this;
    const lib=n=>CPP.LIB[n];
    const hasLib=(n,line,q)=>{
      const L=lib(n); if(!L) return false;
      if(L.g&&!L.g.some(g=>this.groups.has(g))){
        const hn=CPP.HDR_NAME[L.g[0]]||L.g[0];
        throw cerr(`«${n}» не объявлено. Подключи библиотеку: #include <${hn}>`,line,L.fn?'E2268':'E2451');
      }
      if(L.std&&!q&&!this.usingStd&&!this.dotH.has(L.g[0])&&!L.g.some(g=>this.dotH.has(g))&&!this.usedStd(n)){
        throw cerr(`«${n}» не объявлено. Ты подключил <${CPP.HDR_NAME[L.g[0]].replace('.h','')}> без .h — добавь строку using namespace std; (или пиши std::${n}, или подключай iostream.h)`,line,'E2451');
      }
      return true;
    };
    this.usedStd=()=>false;
    const walkFn=(f,ci)=>{
      const sc=[new Set(f.params.map(p=>p.name).filter(Boolean))];
      const has=n=>sc.some(s=>s.has(n));
      const known=(n,line,q)=>{
        if(has(n)) return true;
        if(ci&&this.memberKnown(ci,n)) return true;
        if(this.globalNames.has(n)||this.funcs.has(n)||this.enumConsts.has(n)||this.classes.has(n)) return true;
        if(this.vcl&&this.vcl.knows(n)) return true;
        if(hasLib(n,line,q)) return true;
        return false;
      };
      const E=(e)=>{ if(!e||typeof e!=='object') return;
        switch(e.k){
          case "id": if(!known(e.name,e.line,e.std)) throw cerr(`Неизвестное имя «${e.name}» (Undefined symbol). Переменную нужно объявить до использования, например: int ${e.name};`,e.line,'E2451'); return;
          case 'call': if(e.f.k==='id'){ const n=e.f.name; if(!known(n,e.line,e.f.std)) throw cerr(`Вызов неизвестной функции «${n}»(…) (Call to undefined function). Проверь имя или подключи нужную библиотеку`,e.line,'E2268'); } else E(e.f); e.args.forEach(E); return;
          case 'mem': E(e.a); return;
          case 'scope': return;
          case 'ilist': e.items.forEach(E); return;
          default: for(const k of ['a','b','c','i','n','e']) if(e[k]&&typeof e[k]==='object') E(e[k]); if(e.args) e.args.forEach(E);
        }
      };
      const S=(s)=>{ if(!s) return;
        switch(s.k){
          case 'block': sc.push(new Set()); s.body.forEach(S); sc.pop(); return;
          case 'decl': for(const it of s.items){ if(it.k!=='var') continue; if(it.init) E(it.init); if(it.ctorArgs) it.ctorArgs.forEach(E); arrDims(it.t); sc[sc.length-1].add(it.name); } return;
          case 'expr': E(s.e); return;
          case 'if': E(s.c); S(s.a); S(s.b); return;
          case 'while': case 'do': E(s.c); S(s.body); return;
          case 'for': sc.push(new Set()); S(s.init); E(s.c); E(s.step); S(s.body); sc.pop(); return;
          case 'switch': E(s.c); S(s.body); return;
          case 'case': return;
          case 'return': E(s.e); return;
          case 'label': S(s.s); return;
        }
      };
      const arrDims=(t)=>{ while(t&&(t.k==='arr'||t.k==='ptr')){ if(t.k==='arr'&&t.n) E(t.n); t=t.of||t.to; } };
      if(f.inits) f.inits.forEach(i=>i.args.forEach(E));
      if(f.params) f.params.forEach(p=>p.def&&E(p.def));
      S(f.body);
    };
    this.globalNames=new Set();
    for(const d of this.prog.decls){
      if(d.k==='var'&&!d.cls){ this.globalNames.add(d.name); }
      if(d.k==='func'&&d.body){ walkFn(d,d.cls?this.classes.get(d.cls):null); }
    }
    for(const ci of this.classes.values()) for(const l of ci.methods.values()) for(const m of l) if(m.body&&!m.defLine) walkFn(m,ci);
  }
  memberKnown(ci,n){
    if(!ci) return false;
    if(ci.fields&&ci.fields.some(f=>f.name===n)) return true;
    if(ci.methods&&ci.methods.has(n)) return true;
    if(ci.statics&&ci.statics.has(n)) return true;
    if(ci.props&&ci.props.has(n)) return true;
    if(ci.vclBase) return true;
    for(const b of ci.bases){ if(b.ci){ if(this.memberKnown(b.ci,n)) return true; } else if(this.vcl&&this.vcl.knowsMember(n)) return true; }
    return false;
  }

  /* ---------- память ---------- */
  sizeOf(t,line){
    t=unref(t);
    switch(t.k){
      case 'p': return SZ[t.n]||4;
      case 'enum': return 4;
      case 'ptr': return 4;
      case 'str': return t.ansi?4:8;
      case 'arr': { const n=t.nv!=null?t.nv:(t.n?this.constEval(t.n):0); return n*this.sizeOf(t.of,line); }
      case 'cls': { const ci=this.classes.get(t.name); if(!ci) return 4; let s=0, al=1;
        const all=this.allFields(ci); for(const f of all){ const z=this.sizeOf(f.t,line); const a=Math.min(Math.max(z>=8?8:z>=4?4:z>=2?2:1,1),8); al=Math.max(al,a); s=Math.ceil(s/a)*a+z; }
        if(this.hasVirtual(ci)) s+=4; s=Math.ceil(s/al)*al; return s||1; }
    }
    return 4;
  }
  addrOfCell(c){
    if(c.aliasOf) return this.addrOfCell(c.aliasOf);
    if(c.owner) return this.addrOfCell(c.owner)+c.i*(c.es||this.sizeOf(c.t||tInt));
    if(c.addr==null){ const t=c.t||tInt; const z=Math.max(this.sizeOf(t),1); if(c.heap){ c.addr=ADDR_HEAP; ADDR_HEAP+=Math.ceil(z/8)*8+8; } else if(c.data){ c.addr=ADDR_DATA; ADDR_DATA+=Math.ceil(z/4)*4; } else { ADDR_STACK-=z; ADDR_STACK-=((ADDR_STACK%4)+4)%4; c.addr=ADDR_STACK; } }
    return c.addr;
  }
  ptrAddr(p){ if(!p) return 0; return this.addrOfCell(p.base)+p.i*p.es; }
  ptrTo(c,t){ // указатель на ячейку (элемент массива — с учётом владельца)
    if(c.owner) return {arr:c.owner.v,i:c.i,base:c.owner,es:c.es};
    return {arr:[c],i:0,base:c,es:this.sizeOf(t)};
  }
  zero(t){
    t=unref(t);
    switch(t.k){
      case 'p': return 0; case 'enum': return 0; case 'ptr': return null; case 'str': return '';
      case 'arr': return null; case 'cls': return null;
    }
    return 0;
  }
  // размер массива: только константа, как в Borland (int a[n] с переменной n — ошибка E2313)
  arrLen(t,line,sc){
    if(t.nv!=null) return t.nv;
    if(t.n==null) throw cerr('Не указан размер массива',line,'E2449');
    if(!this.isConstExpr(t.n,sc)) throw cerr('Размер массива должен быть константой (Constant expression required). В C++Builder 6 нельзя int a[n] с переменной n — объяви массив с запасом, например int a[100], или используй new int[n]',line,'E2313');
    const n=Math.trunc(this.rv(this.ev(t.n,sc||this.globalScope)).v);
    if(n<=0) throw cerr('Размер массива должен быть больше нуля',line,'E2449');
    t.nv=n; return n;
  }
  isConstExpr(e,sc){
    switch(e.k){
      case 'num': case 'chr': case 'bool': case 'sizeof': return true;
      case 'id': { const v=this.lookup(e.name,sc||this.globalScope); if(v) return !!(v.t.c&&v.cell.cexpr); if(this.enumConsts.has(e.name)) return true; const L=CPP.LIB[e.name]; return !!(L&&L.val); }
      case 'bin': return this.isConstExpr(e.a,sc)&&this.isConstExpr(e.b,sc);
      case 'un': return e.op!=='*'&&e.op!=='&'&&this.isConstExpr(e.a,sc);
      case 'cond': return this.isConstExpr(e.c,sc)&&this.isConstExpr(e.a,sc)&&this.isConstExpr(e.b,sc);
      case 'cast': return this.isConstExpr(e.a,sc);
      case 'scope': return true;
    }
    return false;
  }
  // создать ячейку под переменную типа t (без вызова конструкторов)
  makeCell(t,line,extra,sc){
    t=unref(t);
    const c=cell(this.zero(t),extra); c.t=t;
    if(t.k==='arr'){
      const dims=[]; let et=t; while(et.k==='arr'){ dims.push(this.arrLen(et,line,sc)); et=et.of; }
      const total=dims.reduce((a,b)=>a*b,1);
      if(total>2000000) throw rerr('Слишком большой массив для тренажёра',line);
      const les=this.sizeOf(et,line);
      if(dims.length===1){
        c.v=new Array(total); for(let k=0;k<total;k++) c.v[k]=this.makeCell(et,line,{owner:c,i:k,es:les},sc);
      } else {
        // многомерный массив лежит в памяти сплошь: строки — это «окна» в общий ряд ячеек
        const flat={v:null,aliasOf:c}; flat.t=T.arr(et,null); flat.t.nv=total;
        const leaves=new Array(total); for(let k=0;k<total;k++) leaves[k]=this.makeCell(et,line,{owner:flat,i:k,es:les},sc);
        flat.v=leaves; c.flat=flat;
        const build=(lvl,off,parent,typ)=>{
          if(lvl===dims.length-1) return leaves.slice(off,off+dims[lvl]);
          let stride=1; for(let q=lvl+1;q<dims.length;q++) stride*=dims[q];
          const rt=typ.of, rsz=stride*les, arr=new Array(dims[lvl]);
          for(let r=0;r<dims[lvl];r++){ const rc={t:rt,owner:parent,i:r,es:rsz}; rc.v=build(lvl+1,off+r*stride,rc,rt); arr[r]=rc; }
          return arr;
        };
        c.v=build(0,0,c,t);
      }
    }
    if(t.k==='cls'){ c.v=this.newObj(t.name,line); }
    return c;
  }
  newObj(name,line){
    const ci=this.classes.get(name);
    if(!ci){ if(this.vcl&&this.vcl.hasClass(name)) return this.vcl.newObj(name); throw cerr(`Тип ${name} не объявлен`,line,'E2451'); }
    const o={cls:ci,f:Object.create(null),id:++Interp.oid};
    const add=(c)=>{ for(const b of c.bases) if(b.ci) add(b.ci); for(const f of c.fields){ const fc=this.makeCell(f.t,line); fc.u=!isCls(f.t)&&!isStr(f.t); fc.name=f.name; o.f[f.name]=fc; } };
    add(ci); return o;
  }
  allFields(ci){ const r=[]; const add=c=>{ for(const b of c.bases) if(b.ci) add(b.ci); r.push(...c.fields); }; add(ci); return r; }

  /* ---------- области видимости ---------- */
  newScope(parent){ return {vars:new Map(),parent,objs:[]}; }
  lookup(name,sc){ for(let s=sc;s;s=s.parent){ const v=s.vars.get(name); if(v) return v; if(s.fnTop) break; } const g=this.globalScope&&this.globalScope.vars.get(name); return g||null; }
  runDtors(sc){
    for(let k=sc.objs.length-1;k>=0;k--){ const c=sc.objs[k]; this.destroyCell(c); }
    sc.objs.length=0;
  }
  destroyCell(c){
    if(!c||c.moved) return;
    if(c.v&&c.v.cls&&!c.v.dead){ this.destroyObj(c.v); }
    else if(Array.isArray(c.v)){ for(let k=c.v.length-1;k>=0;k--) this.destroyCell(c.v[k]); }
  }
  destroyObj(o){
    if(!o||o.dead) return; o.dead=true;
    for(let ci=o.cls; ci; ci=ci.bases[0]&&ci.bases[0].ci){
      const d=ci.methods.get('~'+ci.name);
      if(d&&d[0].body) this.callFunc(d[0],[],this.objPtr(o),d[0].line,true);
      // поля-объекты
      for(const f of ci.fields){ const fc=o.f[f.name]; if(fc&&fc.v&&fc.v.cls) this.destroyObj(fc.v); }
      if(!ci.bases.length) break;
    }
  }
  objPtr(o){ const c=cell(o); c.t=T.cls(o.cls.name); return {arr:[c],i:0,base:c,es:4,obj:o}; }

  /* ---------- объявления переменных ---------- */
  declareVar(d,sc,isGlobal){
    let t=d.t;
    if(isVoid(t)) throw cerr(`Переменная не может иметь тип void`,d.line,'E2xxx');
    if(sc.vars.has(d.name)&&!isGlobal) throw cerr(`Переменная «${d.name}» уже объявлена в этом блоке (Multiple declaration)`,d.line,'E2238');
    // глобальная: повторное объявление без значения допустимо (как extern TForm1 *Form1 + TForm1 *Form1), а два «= значение» — ошибка
    if(isGlobal&&d.init){ this.gInit=this.gInit||new Set(); if(this.gInit.has(d.name)) throw cerr(`Глобальная переменная «${d.name}» объявлена дважды (Multiple declaration for '${d.name}'). Оставь одно объявление — например, удали повтор из вставленного кода`,d.line,'E2238'); this.gInit.add(d.name); }
    if(d.static&&!isGlobal){ // static-локальная: живёт между вызовами
      let st=this.statics.get(d);
      if(!st){ st={t:this.fixArr(t,d),cell:null}; st.cell=this.makeCell(st.t,d.line,{data:true},sc); if(d.init) this.initCell(st.cell,st.t,d,sc); this.statics.set(d,st); }
      sc.vars.set(d.name,{t:st.t,cell:st.cell}); return;
    }
    if(t.k==='ref'){
      if(!d.init) throw cerr(`Ссылку «${d.name}» нужно сразу связать с переменной: int &${d.name} = x;`,d.line,'E2304');
      const x=this.ev(d.init,sc);
      if(!x.lv){ if(t.to.c){ const c=this.makeCell(t.to,d.line); c.v=this.convertTo(this.rv(x),t.to,d.line).v; sc.vars.set(d.name,{t:t.to,cell:c}); return; }
        throw cerr(`Ссылку можно связать только с переменной, а не с выражением`,d.line,'E2357'); }
      sc.vars.set(d.name,{t:t.to,cell:x.cell,isRef:true}); return;
    }
    t=this.fixArr(t,d);
    const c=this.makeCell(t,d.line,isGlobal?{data:true}:null,sc);
    c.name=d.name;
    if(d.init||d.ctorArgs) this.initCell(c,t,d,sc);
    if(t.c&&d.init&&d.init.k!=='ilist'&&this.isConstExpr(d.init,sc)) c.cexpr=true;
    sc.vars.set(d.name,{t,cell:c});
    if(d.init||d.ctorArgs){}
    else {
      if(isCls(t)) this.construct(c.v,[],d.line);
      else if(!isGlobal&&!isStr(t)) this.markUninit(c);
    }
    if(isCls(t)||(isArr(t)&&this.baseElem(t).k==='cls')){ sc.objs.push(c); if(isArr(t)&&!d.init){ for(const el of this.flatCells(c)) if(el.v&&el.v.cls) this.construct(el.v,[],d.line); } }
  }
  markUninit(c){ if(Array.isArray(c.v)) c.v.forEach(x=>this.markUninit(x)); else c.u=true; }
  flatCells(c){ if(Array.isArray(c.v)) return c.v.flatMap(x=>this.flatCells(x)); return [c]; }
  baseElem(t){ while(t.k==='arr') t=t.of; return t; }
  fixArr(t,d){ // размер массива из инициализатора: int a[] = {1,2,3}; char s[] = "abc";
    if(t.k!=='arr'||t.n!=null) return t;
    if(!d.init) throw cerr(`Не указан размер массива «${d.name}»: напиши число в [ ] или задай значения в { }`,d.line,'E2449');
    if(d.init.k==='ilist') return T.arr(t.of,{k:'num',v:d.init.items.length,nt:'int'});
    if(d.init.k==='str'&&isCharT(t.of)) return T.arr(t.of,{k:'num',v:d.init.v.length+1,nt:'int'});
    throw cerr('Массив можно задать только списком в { }',d.line,'E2225');
  }
  initCell(c,t,d,sc){
    const line=d.line;
    if(d.ctorArgs){
      const args=d.ctorArgs.map(a=>this.ev(a,sc));
      if(isCls(t)){ this.construct(c.v,args,line); return; }
      if(isStr(t)){ c.v=this.strCtor(args.map(a=>this.rv(a)),line); return; }
      if(args.length!==1) throw cerr('Для простой переменной в скобках нужно одно значение',line);
      c.v=this.convertTo(this.rv(args[0]),t,line).v; c.u=false; return;
    }
    this.assignInit(c,t,d.init,sc,line);
  }
  assignInit(c,t,init,sc,line){
    if(init.k==='ilist'){
      if(isArr(t)){
        const n=c.v.length;
        // плоский список для многомерного массива
        if(isArr(t.of)&&init.items.length&&init.items[0].k!=='ilist'){
          const flat=this.flatCells(c); if(init.items.length>flat.length) throw cerr('Слишком много значений',line,'E2225');
          const et=this.baseElem(t);
          init.items.forEach((it,k)=>{ flat[k].v=this.convertTo(this.rv(this.ev(it,sc)),et,line).v; });
          for(const x of flat) x.u=false; return;
        }
        if(init.items.length>n) throw cerr(`Слишком много значений для массива из ${n} элементов (Too many initializers)`,line,'E2225');
        for(let k=0;k<n;k++){ const el=c.v[k]; if(k<init.items.length) this.assignInit(el,t.of,init.items[k],sc,line); else this.clearCell(el,t.of); }
        return;
      }
      if(isCls(t)){ // агрегат struct
        const ci=this.classes.get(t.name); const fs=this.allFields(ci);
        const hasCtor=ci.methods.has(ci.name);
        if(hasCtor){ this.construct(c.v,init.items.map(x=>this.ev(x,sc)),line); return; }
        init.items.forEach((it,k)=>{ if(fs[k]) this.assignInit(c.v.f[fs[k].name],fs[k].t,it,sc,line); });
        for(const f of fs.slice(init.items.length)) this.clearCell(c.v.f[f.name],f.t);
        return;
      }
      if(init.items.length===1) return this.assignInit(c,t,init.items[0],sc,line);
      throw cerr('Список значений { } подходит только для массива или структуры',line,'E2225');
    }
    if(isArr(t)){
      if(init.k==='str'&&isCharT(t.of)){
        if(init.v.length+1>c.v.length) throw cerr(`Строка "${init.v}" не помещается в массив из ${c.v.length} символов (нужно ${init.v.length+1}, с учётом '\\0')`,line,'E2225');
        for(let k=0;k<c.v.length;k++){ c.v[k].v=k<init.v.length?toIntT(CPP.c2b(init.v[k]),"char"):0; c.v[k].u=false; }
        return;
      }
      throw cerr('Массиву нельзя присвоить значение целиком — только поэлементно или списком { }',line,'E2277');
    }
    const x=this.ev(init,sc);
    if(isCls(t)){ this.copyInto(c,t,x,line,true); return; }
    c.v=this.convertTo(this.rv(x),t,line,true).v; c.u=false;
  }
  clearCell(c,t){ if(Array.isArray(c.v)) c.v.forEach(x=>this.clearCell(x,t.of)); else if(c.v&&c.v.cls){} else { c.v=this.zero(t); c.u=false; } }

  /* ---------- конструкторы ---------- */
  construct(o,args,line,isCopy){
    if(!o) return;
    if(o.vcl){ return; }
    const ci=o.cls;
    const ctors=ci.methods.get(ci.name);
    if(!ctors){
      if(args.length===1){ const a=this.rv(args[0]); if(a.v&&a.v.cls){ this.copyObjFields(o,a.v); return; } }
      if(args.length) throw cerr(`У класса ${ci.name} нет конструктора с параметрами — объяви его: ${ci.name}(…)`,line,'E2285');
      this.constructBases(o,ci,null,line); this.initFields(o,ci,null,line); return;
    }
    let f=this.pickOverload(ctors,args,line,ci.name,true);
    if(!f){
      if(args.length===1){ const a=this.rv(args[0]); if(a.v&&a.v.cls&&a.v.cls===ci){ this.copyObjFields(o,a.v); return; } }
      if(!args.length) throw cerr(`У класса ${ci.name} нет конструктора без параметров. Объект нужно создавать с аргументами или добавить ${ci.name}()`,line,'E2285');
      throw cerr(`Нет подходящего конструктора ${ci.name}(${args.map(a=>tname(this.argType(a))).join(', ')})`,line,'E2285');
    }
    this.checkAccess(f,ci,line,'конструктор');
    if(!f.body) throw cerr(`Конструктор ${ci.name}::${ci.name} объявлен, но не описан (Unresolved external)`,line,'E2xxx');
    this.callFunc(f,args,this.objPtr(o),line,false,o);
  }
  constructBases(o,ci,inits,line,sc){
    for(const b of ci.bases){
      if(!b.ci) continue;
      const it=inits&&inits.find(x=>x.name===b.name);
      const args=it?it.args.map(a=>this.ev(a,sc)):[];
      // конструируем часть базового класса на том же объекте
      const ctors=b.ci.methods.get(b.ci.name);
      if(!ctors){ this.constructBases(o,b.ci,null,line); this.initFields(o,b.ci,null,line); continue; }
      const f=this.pickOverload(ctors,args,line,b.ci.name,true);
      if(!f) throw cerr(`Нет подходящего конструктора базового класса ${b.ci.name} — вызови его в списке инициализации: ${ci.name}(…) : ${b.ci.name}(…)`,line,'E2251');
      this.callFunc(f,args,this.objPtr(o),line,false,o,b.ci);
    }
  }
  initFields(o,ci,inits,line,sc){
    for(const f of ci.fields){
      const it=inits&&inits.find(x=>x.name===f.name);
      const fc=o.f[f.name];
      if(it){
        const args=it.args.map(a=>this.ev(a,sc));
        if(isCls(f.t)) this.construct(fc.v,args,it.line);
        else if(isStr(f.t)) { fc.v=this.strCtor(args.map(a=>this.rv(a)),it.line); }
        else if(f.t.k==='ref'){ fc.v=args[0].cell; }
        else { fc.v=this.convertTo(this.rv(args[0]),f.t,it.line).v; fc.u=false; }
      } else if(f.init){ this.assignInit(fc,f.t,f.init,sc||this.globalScope,line); }
      else if(isCls(f.t)) this.construct(fc.v,[],line);
    }
    if(inits) for(const it of inits){ if(!ci.fields.some(f=>f.name===it.name)&&!ci.bases.some(b=>b.name===it.name)) throw cerr(`В списке инициализации «${it.name}» — это не поле и не базовый класс ${ci.name}`,it.line,'E2xxx'); }
  }
  copyObjFields(dst,src){
    if(dst.vcl) return;
    for(const k in dst.f){ if(src.f[k]) this.copyCellVal(dst.f[k],src.f[k]); }
  }
  copyCellVal(d,s){
    if(Array.isArray(s.v)){ for(let k=0;k<s.v.length;k++) this.copyCellVal(d.v[k],s.v[k]); return; }
    if(s.v&&s.v.cls){ this.copyObjFields(d.v,s.v); return; }
    d.v=s.v; d.u=s.u;
  }
  copyInto(c,t,x,line,isInit){ const xv=this.rv(x).v; if(xv&&xv.vcl){ c.v=xv.clone?xv.clone():xv; return; }
    const v=this.rv(x);
    if(!v.v||!v.v.cls){ // Dog d = "Rex"; — неявный конструктор
      if(isInit){ this.construct(c.v,[x],line); return; }
      throw cerr(`Нельзя присвоить ${tname(v.t)} объекту класса ${t.name}`,line,'E2034');
    }
    if(!this.isDerived(v.v.cls,this.classes.get(t.name))) throw cerr(`Нельзя присвоить объект класса ${v.v.cls.name} объекту класса ${t.name}`,line,'E2034');
    if(isInit){
      if(x.temp&&v.v.cls.name===t.name){ c.v=v.v; x.temp.moved=true; return; } // Dog d = Dog("Rex"); — без лишней копии, как в Builder
      const ci=this.classes.get(t.name); const cc=ci.methods.get(ci.name); const cp=cc&&cc.find(f=>f.params.length===1&&unref(f.params[0].t).k==='cls'&&unref(f.params[0].t).name===ci.name);
      if(cp){ this.callFunc(cp,[x.lv?x:{t:v.t,v:v.v,lv:false}],this.objPtr(c.v),line,false,c.v); return; }
      this.copyObjFields(c.v,v.v); return;
    }
    const ci=this.classes.get(t.name); const op=ci.methods.get('operator=');
    if(op){ this.callFunc(op[0],[x],this.objPtr(c.v),line); return; }
    this.copyObjFields(c.v,v.v);
  }
  isDerived(a,b){ if(!a||!b) return false; if(a===b) return true; return a.bases.some(x=>x.ci&&this.isDerived(x.ci,b)); }
  hasVirtual(ci){ for(const l of ci.methods.values()) if(l.some(m=>m.virtual)) return true; return ci.bases.some(b=>b.ci&&this.hasVirtual(b.ci)); }

  /* ---------- функции ---------- */
  argType(a){ return a.lv?a.t:a.t; }
  pickOverload(list,args,line,name,silent){
    let best=null, bs=-1;
    for(const f of list){
      const ps=f.params;
      const min=ps.filter(p=>p.def==null&&!p.vararg).length;
      const va=ps.some(p=>p.vararg);
      if(args.length<min||(!va&&args.length>ps.length)) continue;
      let s=10;
      for(let k=0;k<args.length&&k<ps.length;k++){
        if(ps[k].vararg) break;
        const sc=this.matchScore(args[k],ps[k].t); if(sc<0){ s=-1; break; } s+=sc;
      }
      if(s>bs){ bs=s; best=f; }
    }
    if(!best&&!silent) throw cerr(`Нет подходящей функции ${name}(${args.map(a=>tname(this.argType(a))).join(', ')}) — проверь количество и типы аргументов`,line,'E2285');
    return best;
  }
  matchScore(a,pt){
    const at=unref(a.t); const p=unref(pt);
    if(p.k==='p'&&(p.n==='ostream'||p.n==='istream')) return at.k==='p'&&at.n===p.n?4:-1;
    if(pt.k==='ref'&&!p.c&&!a.lv&&!isCls(p)) return -1;
    if(p.k==='p'&&at.k==='p'){ if(p.n===at.n) return 4; if(isNum(p)&&isNum(at)) return (isInt(p)===isInt(at))?2:1; return -1; }
    if(isNum(p)&&isNum(at)) return 1;
    if(isPtr(p)){ if(at.k==='ptr'||at.k==='arr'){ const e=at.k==='ptr'?at.to:at.of; return sameType(p.to,e)?4:(isVoid(p.to)?2:(e.k==='arr'&&p.to.k==='arr')?3:0); } if(a.k==='null'||(isInt(at)&&a.v===0)) return 1; return -1; }
    if(isStr(p)){ if(isStr(at)) return 4; if((at.k==='ptr'||at.k==='arr')&&isCharT(at.to||at.of)) return 2; if(isCharT(at)&&p.ansi) return 1; return -1; }
    if(isCls(p)){ if(isCls(at)&&(at.name===p.name)) return 4; if(isCls(at)&&this.isDerived(this.classes.get(at.name),this.classes.get(p.name))) return 3; if(this.classes.get(p.name)&&this.classes.get(p.name).methods.get(p.name)) return 0; return -1; }
    if(p.k==='enum'&&(at.k==='enum'||isInt(at))) return at.k==='enum'?4:0;
    if(isNum(p)&&at.k==='enum') return 2;
    if(isNum(p)&&(isPtr(at))) return p.n==='bool'?0:-1;
    return -1;
  }
  callFunc(f,args,thisPtr,line,isDtor,ctorObj,asClass){
    this.tick(line);
    if(f.lib) return f.lib(args,line);
    if(!f.body){ throw cerr(`Функция ${f.cls?f.cls+'::':''}${f.name} объявлена (прототип), но не описана — нет тела { } (Unresolved external)`,line,'E2xxx'); }
    if(!this.depth) this.depth=0;
    if(++this.depth>2500){ this.depth=0; throw rerr('Переполнение стека (Stack overflow): слишком глубокая рекурсия — проверь условие выхода из рекурсии',line); }
    const sc={vars:new Map(),parent:this.globalScope,objs:[],fnTop:true,fn:f,thisPtr,ci:asClass||f.ci||null};
    const ps=f.params;
    for(let k=0;k<ps.length;k++){
      const p=ps[k]; if(p.vararg) break;
      let a=args[k];
      if(a===undefined){ if(p.def==null) throw cerr(`Не хватает аргументов при вызове ${f.name}`,line,'E2193'); a=this.ev(p.def,sc); }
      this.bindParam(sc,p,a,line,f);
    }
    if(ps.length&&ps[ps.length-1].vararg) sc.varargs=args.slice(ps.length-1).map(a=>this.rv(a));
    let ret;
    try{
      if(f.isCtor&&ctorObj){ this.constructBases(ctorObj,asClass||f.ci,f.inits,line,sc); this.initFields(ctorObj,asClass||f.ci,f.inits,line,sc); }
      this.execBlock(f.body,sc,true);
      if(!isVoid(f.ret)&&!f.isCtor&&!f.isDtor&&f.name!=='main') this.warn('noret'+f.name,`Функция ${f.name} должна вернуть значение (return …), а дошла до конца без return`,f.line);
      ret={t:f.ret,v:this.zero(f.ret)};
    }catch(e){
      if(e instanceof RetSig){ ret=e.v; }
      else { this.depth--; throw e; }
    }
    this.runDtors(sc);
    this.depth--;
    return ret;
  }
  bindParam(sc,p,a,line,f){
    if(!p.name) return;
    const pt=p.t;
    if(pt.k==='ref'){
      const to=pt.to;
      if(a.lv){
        if(isNum(to)&&isNum(a.t)&&unref(a.t).n!==to.n&&!to.c) throw cerr(`Параметр-ссылка ${tname(pt)} не может ссылаться на переменную типа ${tname(a.t)}`,line,'E2xxx');
        if(a.t.c&&!to.c) throw cerr(`Нельзя передать константу в параметр-ссылку без const`,line,'E2xxx');
        sc.vars.set(p.name,{t:to,cell:a.cell,isRef:true}); return;
      }
      if(to.k==='p'&&(to.n==='ostream'||to.n==='istream')){ sc.vars.set(p.name,{t:to,cell:cell(this.rv(a).v)}); return; }
      if(!to.c&&!isCls(to)) throw cerr(`В параметр-ссылку «${p.name}» нужно передать переменную, а не значение или выражение`,line,'E2357');
      const c=this.makeCell(to,line);
      if(isCls(to)){ const v=this.rv(a); c.v=v.v; } else c.v=this.convertTo(this.rv(a),to,line).v;
      sc.vars.set(p.name,{t:to,cell:c}); return;
    }
    const c=this.makeCell(pt,line); c.name=p.name;
    if(isCls(pt)){ this.copyInto(c,pt,a,line,true); sc.objs.push(c); }
    else c.v=this.convertTo(this.rv(a),pt,line,true).v;
    sc.vars.set(p.name,{t:pt,cell:c});
  }

  /* ---------- операторы ---------- */
  execBlock(b,sc,isFnBody){
    const s2=isFnBody?sc:this.newScope(sc);
    try{ this.execList(b.body,s2); }
    finally{ if(!isFnBody) this.runDtors(s2); }
  }
  execList(list,sc){
    let i=0;
    while(i<list.length){
      try{
        for(;i<list.length;i++) this.exec(list[i],sc);
      }catch(e){
        if(e instanceof GotoSig){
          const k=list.findIndex(s=>s.k==='label'&&s.name===e.label);
          if(k>=0){ i=k; continue; }
        }
        throw e;
      }
    }
  }
  exec(s,sc){
    this.tick(s.line);
    switch(s.k){
      case 'block': return this.execBlock(s,sc);
      case 'empty': return;
      case 'expr': { this.temps=[]; this.ev(s.e,sc); this.flushTemps(); return; }
      case 'decl': for(const it of s.items) if(it.k==='var'){ this.temps=[]; this.declareVar(it,sc,false); this.flushTemps(); } return;
      case 'if': if(this.truthy(this.ev(s.c,sc),s.line)) this.execSub(s.a,sc); else if(s.b) this.execSub(s.b,sc); return;
      case 'while':
        while(this.truthy(this.ev(s.c,sc),s.line)){ this.tick(s.line); try{ this.execSub(s.body,sc); }catch(e){ if(e===BRK) break; if(e===CNT) continue; throw e; } }
        return;
      case 'do':
        do{ this.tick(s.line); try{ this.execSub(s.body,sc); }catch(e){ if(e===BRK) break; if(e===CNT) continue; throw e; } }while(this.truthy(this.ev(s.c,sc),s.line));
        return;
      case 'for':{
        const fs=this.newScope(sc);
        try{
          if(s.init) this.exec(s.init,fs);
          while(!s.c||this.truthy(this.ev(s.c,fs),s.line)){
            this.tick(s.line);
            try{ this.execSub(s.body,fs); }catch(e){ if(e===BRK) break; if(e!==CNT) throw e; }
            if(s.step) this.ev(s.step,fs);
          }
        } finally { this.runDtors(fs); }
        return; }
      case 'switch':{
        const v=this.rv(this.ev(s.c,sc));
        if(!isInt(v.t)) throw cerr(`В switch можно проверять только целое значение или символ (не ${tname(v.t)})`,s.line,'E2xxx');
        const body=s.body.k==='block'?s.body.body:[s.body];
        let start=-1, def=-1;
        for(let k=0;k<body.length;k++){ const st=body[k]; if(st.k==='case'){ if(this.constEval(st.v)===v.v){ start=k; break; } } else if(st.k==='default') def=k; }
        if(start<0) start=def; if(start<0) return;
        const s2=this.newScope(sc);
        try{ for(let k=start;k<body.length;k++){ const st=body[k]; if(st.k==='case'||st.k==='default') continue; this.exec(st,s2); } }
        catch(e){ if(e!==BRK) throw e; }
        finally{ this.runDtors(s2); }
        return; }
      case 'case': case 'default': throw cerr('case/default можно писать только внутри switch',s.line,'E2xxx');
      case 'break': throw BRK;
      case 'continue': throw CNT;
      case 'return':{
        const fn=this.curFn(sc);
        if(!s.e){ if(fn&&!isVoid(fn.ret)&&fn.name!=='main') throw cerr(`Функция ${fn.name} должна вернуть значение: return значение;`,s.line,'E2xxx'); throw new RetSig({t:tVoid,v:0}); }
        const x=this.ev(s.e,sc);
        if(fn&&isVoid(fn.ret)&&!fn.isCtor){ const rv=this.rv(x); if(!isVoid(rv.t)) throw cerr(`Функция ${fn.name} объявлена void — она не может возвращать значение`,s.line,'E2467'); }
        if(fn&&fn.ret.k==='ref'){ if(!x.lv) throw cerr('Функция возвращает ссылку — вернуть можно только переменную',s.line); throw new RetSig({t:fn.ret.to,cell:x.cell,lv:true}); }
        let r=this.rv(x);
        if(fn&&isCls(fn.ret)){ if(x.lv&&x.cell){ x.cell.moved=true; } throw new RetSig({t:fn.ret,v:r.v,temp:null}); }
        if(fn&&!isVoid(fn.ret)) r=this.convertTo(r,fn.ret,s.line,true);
        throw new RetSig(r); }
      case 'goto': throw new GotoSig(s.label,s.line);
      case 'label': return this.exec(s.s,sc);
      case 'proto': return;
    }
    throw rerr('Неизвестный оператор '+s.k,s.line);
  }
  execSub(s,sc){ if(s.k==='decl'){ const s2=this.newScope(sc); try{ this.exec(s,s2); } finally{ this.runDtors(s2); } } else this.exec(s,sc); }
  curFn(sc){ for(let s=sc;s;s=s.parent) if(s.fnTop) return s.fn; return null; }
  curScopeTop(sc){ for(let s=sc;s;s=s.parent) if(s.fnTop) return s; return null; }
  flushTemps(){ const t=this.temps; this.temps=null; if(t) for(let k=t.length-1;k>=0;k--) if(!t[k].moved) this.destroyCell(t[k]); }
  truthy(x,line){ const v=this.rv(x);
    if(isPtr(v.t)) return v.v!=null;
    if(isNum(v.t)) return v.v!==0&&!Number.isNaN(v.v);
    if(isStr(v.t)) throw cerr('Строку string нельзя использовать как условие — сравни её, например s == ""',line,'E2xxx');
    if(isCls(v.t)) throw cerr('Объект класса нельзя использовать как условие',line,'E2xxx');
    if(v.t===tIs) return !this.inFail;
    if(v.t===tOs) return true;
    return !!v.v;
  }

  /* ---------- rvalue и преобразования ---------- */
  rv(x){
    if(!x.lv) return x;
    const t=x.t, c=x.cell;
    if(isArr(t)) return {t:T.ptr(t.of),v:c.v.length?this.ptrTo(c.v[0],t.of):{arr:c.v,i:0,base:c,es:this.sizeOf(t.of)},fromArr:t};
    if(c.u){ c.u=false; if(c.name) this.warn('u'+c.name,`Переменная «${c.name}» используется, но ей ещё не присвоено значение. В C++Builder там был бы «мусор» — случайное число`,x.line); }
    if(c.getter) return {t,v:c.getter()};
    return {t,v:c.v};
  }
  convertTo(v,t,line,implicit){
    t=unref(t); const ft=unref(v.t);
    if(t.k==='p'&&t.n==='void') return {t,v:0};
    if(isNum(t)){
      if(isNum(ft)){
        if(isFlt(t)){ if(v.idiv&&isInt(ft)) this.idivWarn(v,line); return {t,v:t.n==='float'?Math.fround(v.v):v.v}; }
        if(implicit&&isFlt(ft)&&isInt(t)&&t.n!=='bool') this.warn('conv'+line,`Дробное число превращено в ${tname(t)} — дробная часть отброшена`,line);
        return {t,v:toIntT(v.v,t.n==='enum'?'int':t.n)};
      }
      if(isPtr(ft)){ if(t.n==='bool') return {t,v:v.v?1:0}; if(!implicit) return {t,v:this.ptrAddr(v.v)}; }
      if(t.k==='enum'&&isNum(ft)) return {t,v:toIntT(v.v,'int')};
      throw cerr(`Нельзя превратить ${tname(ft)} в ${tname(t)}`,line,'E2034');
    }
    if(t.k==='enum'){ if(isNum(ft)) return {t,v:toIntT(v.v,'int')}; }
    if(isPtr(t)){
      if(isPtr(ft)){
        if(implicit&&ft.to.c&&!t.to.c&&!(v.isLit)) throw cerr(`Нельзя присвоить const ${tname(ft.to)}* указателю без const`,line,'E2034');
        if(implicit&&!isVoid(t.to)&&!isVoid(ft.to)&&!sameType(t.to,ft.to)&&!(isCls(t.to)&&isCls(ft.to)&&this.isDerived(this.classes.get(ft.to.name),this.classes.get(t.to.name)))&&!(isCharT(t.to)&&isCharT(ft.to)))
          throw cerr(`Нельзя присвоить указатель на ${tname(ft.to)} указателю на ${tname(t.to)}`,line,'E2034');
        return {t,v:v.v};
      }
      if(isInt(ft)&&v.v===0) return {t,v:null};
      if(isInt(ft)&&!implicit) return {t,v:null};
      throw cerr(`Нельзя присвоить ${tname(ft)} указателю ${tname(t)}`,line,'E2034');
    }
    if(isStr(t)){
      if(isStr(ft)) return {t,v:v.v};
      if(isPtr(ft)&&isCharT(ft.to)) return {t,v:this.cstr(v.v,line)};
      if(isCharT(ft)&&(t.ansi||!implicit)) return {t,v:CPP.b2c(v.v)};
      if(t.ansi&&isNum(ft)) return {t,v:this.fmtNum(v)};
      throw cerr(`Нельзя присвоить ${tname(ft)} строке ${tname(t)}`,line,'E2034');
    }
    if(isCls(t)){ if(isCls(ft)) return v; throw cerr(`Нельзя превратить ${tname(ft)} в ${tname(t)}`,line,'E2034'); }
    return v;
  }
  idivWarn(v,line){ const [x,y]=v.idiv.split('/'); this.warn('idiv'+line,`Целое ÷ целое = целое: ${v.idiv} даёт ${v.v}, дробная часть отброшена, а результат идёт в дробное число. Если нужна дробь — пиши ${x}.0/${y} или (double)`,line); }
  fmtNum(v){ return isFlt(v.t)?CPP.numStr(v.v,'g',15):String(v.v); }
  cstr(p,line){ // прочитать C-строку по указателю
    if(!p) throw rerr('Обращение к строке по нулевому указателю (NULL) — в Builder программа бы упала',line);
    let s='', i=p.i; const a=p.arr;
    while(true){ if(i>=a.length||i<0) throw rerr('Строка не закончилась символом \'\\0\' — чтение вышло за границу массива',line); const c=a[i]; const v=c.v; if(v===0) break; s+=CPP.b2c(v); i++; if(s.length>100000) break; }
    return s;
  }
  litArr(e){ // строковая константа → массив char (один на узел)
    if(!e._arr){ const owner=cell(null,{data:true}); owner.t=T.arr(tChar,{k:'num',v:e.v.length+1}); owner.t.nv=e.v.length+1;
      owner.v=[...e.v,'\0'].map((ch,k)=>cell(toIntT(CPP.c2b(ch),"char"),{owner,i:k,es:1,t:tChar,ro:true})); e._arr=owner; }
    return e._arr;
  }

  /* ---------- выражения ---------- */
  ev(e,sc){
    switch(e.k){
      case 'num': return {t:e.nt==='float'?tFlt:e.nt==='double'?tDbl:e.nt==='uint'?tUint:tInt,v:e.nt==='float'?Math.fround(e.v):e.v};
      case 'chr': return {t:tChar,v:toIntT(CPP.c2b(e.v),"char")};
      case 'bool': return {t:tBool,v:e.v};
      case 'null': return {t:T.ptr(tVoid),v:null,isNull:true};
      case 'str': { const a=this.litArr(e); return {t:T.ptr(Object.assign({},tChar,{c:true})),v:{arr:a.v,i:0,base:a,es:1},isLit:true,lit:e.v}; }
      case 'id': return this.evId(e,sc);
      case 'gscope': { const v=this.globalScope.vars.get(e.name); if(v) return {t:v.t,cell:v.cell,lv:true,line:e.line,name:e.name};
        if(this.funcs.has(e.name)) return {t:tVoid,gfn:e.name,v:0}; throw cerr(`Глобальной переменной «${e.name}» нет`,e.line,'E2451'); }
      case 'this':{ const top=this.curScopeTop(sc); if(!top||!top.thisPtr) throw cerr('this можно использовать только внутри метода класса',e.line,'E2xxx'); return {t:T.ptr(T.cls(top.thisPtr.obj.cls.name)),v:top.thisPtr}; }
      case 'scope': return this.evScope(e,sc);
      case 'assign': return this.evAssign(e,sc);
      case 'bin': return this.evBin(e,sc);
      case 'un': return this.evUn(e,sc);
      case 'pre': case 'post': return this.evInc(e,sc);
      case 'cond': { const c=this.truthy(this.ev(e.c,sc),e.line); const a=this.ev(c?e.a:e.b,sc);
        const other=null; return a.lv?a:this.rv(a); }
      case 'comma': this.ev(e.a,sc); return this.ev(e.b,sc);
      case 'call': return this.evCall(e,sc);
      case 'idx': return this.evIdx(e,sc);
      case 'mem': return this.evMem(e,sc);
      case 'cast': { const x=this.rv(this.ev(e.a,sc)); const t=e.t;
        if(isPtr(t)&&isPtr(x.t)) return {t,v:x.v};
        if(isNum(t)&&isPtr(x.t)) return {t,v:toIntT(this.ptrAddr(x.v),t.n)};
        return this.convertTo(x,t,e.line,false); }
      case 'sizeof': { if(e.t) return {t:tUint,v:this.sizeOf(e.t,e.line)};
        const x=this.ev(e.a,sc); if(x.lv) return {t:tUint,v:this.sizeOf(x.t,e.line)}; if(x.isLit) return {t:tUint,v:x.lit.length+1}; return {t:tUint,v:this.sizeOf(x.t,e.line)}; }
      case 'new': return this.evNew(e,sc);
      case 'delete': { const x=this.rv(this.ev(e.a,sc)); if(!isPtr(x.t)) throw cerr('delete применяют только к указателю',e.line,'E2xxx');
        if(x.v){ if(e.arr) { if(x.v.base.v) for(let k=x.v.arr.length-1;k>=0;k--) this.destroyCell(x.v.arr[k]); } else this.destroyCell(x.v.arr[x.v.i]); x.v.base.freed=true; }
        return {t:tVoid,v:0}; }
      case 'ctor': { // временный объект: Dog("Rex"), string("abc")
        const args=this.evArgs(e.args,sc);
        if(isStr(e.t)) return {t:e.t,v:this.strCtor(args.map(a=>this.rv(a)),e.line)};
        const c=this.makeCell(e.t,e.line); this.construct(c.v,args,e.line);
        if(this.temps) this.temps.push(c);
        return {t:e.t,v:c.v,temp:c}; }
      case 'ilist': throw cerr('Список { } здесь не подходит',e.line,'E2188');
    }
    throw rerr('Неизвестное выражение '+e.k,e.line);
  }
  evId(e,sc){
    const n=e.name;
    const v=this.lookup(n,sc);
    if(v) return {t:v.t,cell:v.cell,lv:true,line:e.line,name:n};
    const top=this.curScopeTop(sc);
    if(top&&top.thisPtr){
      const o=top.thisPtr.obj;
      const r=this.memberOf(o,n,e.line,top.ci,true);
      if(r) return r;
    }
    if(top&&top.ci){ const st=this.findStatic(top.ci,n); if(st) return {t:st.t,cell:st.cell,lv:true,line:e.line}; }
    if(this.enumConsts.has(n)){ const c=this.enumConsts.get(n); return {t:c.t,v:c.v}; }
    if(this.vcl){ const r=this.vcl.ident(n,e.line); if(r) return r; }
    const L=CPP.LIB[n];
    if(L&&L.val) return L.val(this);
    if(L&&L.fn){ this.warn("noeff"+e.line,`«${n}» без скобок ничего не делает (Code has no effect) — чтобы вызвать функцию, пиши ${n}(…)`,e.line); return {t:tVoid,v:0}; }
    if(this.funcs.has(n)) throw cerr(`«${n}» — это функция, её вызывают со скобками: ${n}(…)`,e.line,'E2xxx');
    throw cerr(`Неизвестное имя «${n}»`,e.line,'E2451');
  }
  findStatic(ci,n){ if(ci.statics.has(n)) return ci.statics.get(n); for(const b of ci.bases) if(b.ci){ const r=this.findStatic(b.ci,n); if(r) return r; } return null; }
  evScope(e,sc){
    if(e.cls==='ios'||e.cls==='std') { const L=CPP.LIB[e.cls==='ios'?'ios::'+e.name:e.name]; if(L&&L.val) return L.val(this); }
    if(e.cls==='string'&&e.name==='npos') return {t:tUint,v:4294967295};
    const ci=this.classes.get(e.cls);
    if(!ci){ if(this.vcl){ const r=this.vcl.scope(e.cls,e.name,e.line); if(r) return r; } throw cerr(`${e.cls} — это не класс`,e.line,'E2090'); }
    const st=this.findStatic(ci,e.name);
    if(st){ this.checkAccess(st,ci,e.line,'поле',this.curScopeTop(sc)); return {t:st.t,cell:st.cell,lv:true,line:e.line}; }
    // Base::method — вызов метода базового класса (обрабатывается в evCall)
    return {t:tVoid,scopeFn:{ci,name:e.name},v:0};
  }
  memberOf(o,n,line,ctxCi,quiet,viaCls){
    if(o.vcl){ const r=this.vcl.member(o,n,line,true); if(r) return r; if(!o.cls) return null; }
    const fc=o.f[n];
    const ci=o.cls;
    const finfo=this.findField(viaCls||ci,n);
    if(fc&&finfo){
      return {t:finfo.f.t,cell:fc,lv:true,line,member:finfo,name:n};
    }
    const pr=this.findProp(ci,n);
    if(pr) return this.propLval(o,pr,line);
    const st=this.findStatic(ci,n); if(st) return {t:st.t,cell:st.cell,lv:true,line};
    if(this.findMethod(ci,n)) return {t:tVoid,method:{o,name:n},v:0};
    if(quiet) return null;
    throw cerr(`В классе ${ci.name} нет члена «${n}»`,line,'E2316');
  }
  findField(ci,n){ const f=ci.fields.find(x=>x.name===n); if(f) return {f,ci}; for(const b of ci.bases) if(b.ci){ const r=this.findField(b.ci,n); if(r){ r.via=r.via||[]; r.via.push(b); return r; } } return null; }
  findProp(ci,n){ if(ci.props.has(n)) return {p:ci.props.get(n),ci}; for(const b of ci.bases) if(b.ci){ const r=this.findProp(b.ci,n); if(r) return r; } return null; }
  findMethod(ci,n){ if(ci.methods.has(n)) return {list:ci.methods.get(n),ci}; for(const b of ci.bases) if(b.ci){ const r=this.findMethod(b.ci,n); if(r) return r; } return null; }
  propLval(o,pr,line){ // __property: чтение через read, запись через write
    const self=this, p=pr.p;
    const c={get v(){ return self.propGet(o,p,line); }, set v(x){ self.propSet(o,p,x,line); }};
    return {t:p.t,cell:c,lv:true,line,prop:true};
  }
  propGet(o,p,line){
    if(!p.read) throw cerr(`Свойство ${p.name} только для записи (нет read)`,line,'E2xxx');
    if(o.f[p.read]) return o.f[p.read].v;
    const m=this.findMethod(o.cls,p.read); if(!m) throw cerr(`В read свойства ${p.name} указано неизвестное имя ${p.read}`,line);
    return this.callFunc(m.list[0],[],this.objPtr(o),line).v;
  }
  propSet(o,p,x,line){
    if(!p.write) throw cerr(`Свойство ${p.name} только для чтения (нет write) — присвоить ему нельзя`,line,'E2xxx');
    if(o.f[p.write]){ o.f[p.write].v=x; o.f[p.write].u=false; return; }
    const m=this.findMethod(o.cls,p.write); if(!m) throw cerr(`В write свойства ${p.name} указано неизвестное имя ${p.write}`,line);
    this.callFunc(m.list[0],[{t:p.t,v:x}],this.objPtr(o),line);
  }
  checkAccess(member,ci,line,what,top,viaFieldInfo){
    const acc=member.access||'public';
    if(acc==='public'&&!(viaFieldInfo&&viaFieldInfo.via&&viaFieldInfo.via.some(b=>b.access!=='public'))) return;
    const ctx=top&&top.ci;
    const owner=member.ci||(viaFieldInfo&&viaFieldInfo.ci)||ci;
    if(acc==='private'&&ctx&&ctx===owner) return;
    if(acc==='protected'&&ctx&&this.isDerived(ctx,owner)) return;
    if(acc==='public'&&ctx&&this.isDerived(ctx,owner)) return;
    const nm=member.name||member.decl&&member.decl.name;
    const why=acc==='private'?'закрыт (private) — доступен только внутри методов своего класса':acc==='protected'?'защищён (protected) — доступен только в методах класса и его наследников':'недоступен из-за закрытого наследования';
    throw cerr(`«${owner.name}::${nm}» ${why}. Используй открытый метод (например, get/set)`,line,'E2247');
  }
  evMem(e,sc){
    const x=this.ev(e.a,sc);
    let o, base=x;
    const xt=unref(x.t);
    if(xt===tOs||xt===tIs||(xt.k==='p'&&(xt.n==='ostream'||xt.n==='istream'))) return {t:tVoid,stream:this.rv(x).v,mname:e.name,v:0};
    if(e.arrow){
      const p=this.rv(x);
      if(!isPtr(p.t)){ if(isCls(p.t)) throw cerr(`«${e.name}»: у объекта (не указателя) члены вызывают через точку: obj.${e.name}`,e.line,'E2288'); throw cerr('Слева от -> должен быть указатель на объект',e.line,'E2288'); }
      if(!p.v) throw rerr('Обращение через нулевой указатель (NULL->'+e.name+') — в Builder это Access violation',e.line);
      const c=p.v.arr[p.v.i]; if(!c) throw rerr('Указатель смотрит за пределы массива',e.line);
      if(c.freed||p.v.base.freed) throw rerr('Объект уже удалён (delete) — к нему нельзя обращаться',e.line);
      o=c.v; if(!o||!(o.cls||o.vcl)) throw cerr(`Слева от -> должен быть указатель на объект класса, а не ${tname(p.t)}`,e.line,'E2288');
    } else {
      if(isStr(xt)) return {t:tVoid,strObj:x,mname:e.name,v:0};
      if(isPtr(xt)&&!e.arrow) throw cerr(`«${e.name}»: это указатель — к членам обращаются через стрелку: p->${e.name}`,e.line,'E2294');
      const v=x.lv?x.cell.v:x.v;
      if(!v||!(v.cls||v.vcl)) throw cerr(`Слева от точки должен быть объект (структура/класс), а не ${tname(xt)}`,e.line,'E2294');
      o=v;
    }
    if(o.vcl){ const r=this.vcl.member(o,e.name,e.line,!!o.cls); if(r) return r; }
    const top=this.curScopeTop(sc);
    const fi=this.findField(o.cls,e.name);
    if(fi){ this.checkAccess(fi.f,o.cls,e.line,'поле',top,fi); return {t:fi.f.t,cell:o.f[e.name],lv:true,line:e.line,name:e.name}; }
    const pr=this.findProp(o.cls,e.name); if(pr){ this.checkAccess(pr.p,o.cls,e.line,'свойство',top); return this.propLval(o,pr,e.line); }
    const st=this.findStatic(o.cls,e.name); if(st) return {t:st.t,cell:st.cell,lv:true,line:e.line};
    const m=this.findMethod(o.cls,e.name);
    if(m){ const sn=e.arrow?(unref(this.rv(x).t).to||{}).name:xt.name; return {t:tVoid,method:{o,name:e.name,viaPtr:e.arrow||x.lv&&x.isRef,scls:this.classes.get(sn)},v:0}; }
    throw cerr(`В классе ${o.cls.name} нет члена «${e.name}»`,e.line,'E2316');
  }
  evIdx(e,sc){
    const a=this.ev(e.a,sc);
    const at=unref(a.t);
    { const av=a.lv?a.cell.v:a.v; if(av&&av.vcl&&av.index) return av.index(this.rv(this.ev(e.i,sc)).v,e.line); }
    if(isStr(at)){ // s[i]
      const i=this.rv(this.ev(e.i,sc)).v;
      const holder=a.lv?a.cell:{v:a.v};
      const self=this;
      const base=at.ansi?1:0;
      const c={get v(){ const s=holder.v; const k=i-base; if(k<0||k>s.length) throw rerr(`Индекс ${i} вне строки длиной ${s.length}`,e.line); return k===s.length?0:toIntT(CPP.c2b(s[k]),"char"); },
        set v(x){ const s=holder.v; const k=i-base; if(k<0||k>=s.length) throw rerr(`Индекс ${i} вне строки длиной ${s.length}`,e.line); holder.v=s.slice(0,k)+CPP.b2c(x)+s.slice(k+1); }};
      return {t:tChar,cell:c,lv:true,line:e.line};
    }
    if(isCls(at)){ const o=a.lv?a.cell.v:a.v; const m=this.findMethod(o.cls,'operator[]'); if(m){ const r=this.callFunc(m.list[0],[this.ev(e.i,sc)],this.objPtr(o),e.line); return r; } }
    const p=this.rv(a);
    const iv=this.rv(this.ev(e.i,sc));
    if(isPtr(iv.t)&&isInt(p.t)) return this.derefAt(iv,p.v,e.line); // 2[a]
    if(!isPtr(p.t)) throw cerr(`Квадратные скобки [ ] применяют к массиву или указателю, а «${a.name||'это'}» — ${tname(at)}`,e.line,'E2062');
    if(!isInt(iv.t)) throw cerr('Индекс массива должен быть целым числом',e.line,'E2xxx');
    return this.derefAt(p,iv.v,e.line,a.name);
  }
  derefAt(p,k,line,name){
    const pv=p.v;
    if(!pv) throw rerr('Обращение по нулевому указателю (NULL) — в Builder это Access violation',line);
    const i=pv.i+k;
    if(i<0||i>=pv.arr.length){
      const n=pv.arr.length;
      throw rerr(`Выход за границы массива${name?' «'+name+'»':''}: индекс ${i}, а допустимы 0…${n-1}. В C++Builder это не ошибка компиляции — программа прочитала бы «мусор» или упала`,line);
    }
    const c=pv.arr[i];
    if(pv.base.freed) throw rerr('Память уже освобождена через delete',line);
    return {t:p.t.to,cell:c,lv:true,line,name};
  }
  evNew(e,sc){
    if(e.n!=null){
      const n=this.rv(this.ev(e.n,sc));
      if(!isInt(n.t)||n.v<0) throw rerr('Размер в new[] должен быть неотрицательным целым',e.line);
      const owner=cell(null,{heap:true}); owner.t=T.arr(e.t,null); owner.t.nv=n.v;
      const es=this.sizeOf(e.t);
      owner.v=[]; for(let k=0;k<n.v;k++){ const c=this.makeCell(e.t,e.line,{owner,i:k,es}); this.markUninit(c); owner.v.push(c); if(isCls(e.t)) this.construct(c.v,[],e.line); }
      return {t:T.ptr(e.t),v:{arr:owner.v,i:0,base:owner,es}};
    }
    const c=this.makeCell(e.t,e.line,{heap:true});
    if(isCls(e.t)) this.construct(c.v,(e.args||[]).map(a=>this.ev(a,sc)),e.line);
    else if(e.args&&e.args.length) c.v=this.convertTo(this.rv(this.ev(e.args[0],sc)),e.t,e.line).v;
    else if(isStr(e.t)) c.v=''; else this.markUninit(c);
    return {t:T.ptr(e.t),v:{arr:[c],i:0,base:c,es:this.sizeOf(e.t)}};
  }

  /* ---------- присваивание ---------- */
  needLv(x,line,what){
    if(!x.lv) throw cerr(`${what||'Слева от ='} должна стоять переменная (Lvalue required)`,line,'E2277');
    if(x.t.c||x.cell.ro) throw cerr(`Нельзя изменить константу${x.name?' «'+x.name+'»':''} (Cannot modify a const object)`,line,'E2024');
    if(isArr(x.t)) throw cerr(`Массиву «${x.name||''}» нельзя присвоить значение целиком — присваивай по элементам`,line,'E2277');
  }
  store(x,v,line){ // записать rvalue v в lvalue x с преобразованием
    const t=unref(x.t);
    if(isCls(t)){ this.copyInto(x.cell,t,v,line,false); return; }
    const cv=this.convertTo(v.lv?this.rv(v):v,t,line,true);
    x.cell.v=cv.v; x.cell.u=false;
  }
  evAssign(e,sc){
    if(e.b.k==='ilist') throw cerr('Список { } можно использовать только при объявлении массива',e.line,'E2188');
    const a=this.ev(e.a,sc);
    if(a.vclProp) return this.vcl.assign(a,e.op,()=>this.ev(e.b,sc),e.line);
    this.needLv(a,e.line,e.op==='='?null:`Слева от ${e.op}`);
    if(e.op==='='){
      const b=this.ev(e.b,sc);
      if(isStr(unref(a.t))&&isNum(this.rv(b).t)&&!unref(a.t).ansi){ const bv=this.rv(b); if(isCharT(bv.t)) { a.cell.v=CPP.b2c(bv.v); return a; } }
      this.store(a,isCls(unref(a.t))?b:this.rv(b),e.line);
      return a;
    }
    const op=e.op.slice(0,-1);
    if(isStr(unref(a.t))&&op==='+'){ const b=this.rv(this.ev(e.b,sc)); a.cell.v=a.cell.v+this.toJsStr(b,e.line,true); return a; }
    const r=this.binop(op,this.rv(a),this.rv(this.ev(e.b,sc)),e.line);
    this.store(a,r,e.line);
    return a;
  }
  evInc(e,sc){
    const a=this.ev(e.a,sc);
    if(a.vclProp) return this.vcl.inc(a,e,this.rv.bind(this));
    this.needLv(a,e.line,`Операция ${e.op}`);
    const t=unref(a.t);
    const old=this.rv(a);
    let nv;
    if(isPtr(t)){ if(!old.v) throw rerr('++/-- для нулевого указателя',e.line); nv={t,v:Object.assign({},old.v,{i:old.v.i+(e.op==='++'?1:-1)})}; }
    else if(isNum(t)){ if(t.n==='bool'&&e.op==='--') throw cerr('Для bool нельзя --',e.line); nv=this.binop(e.op==='++'?'+':'-',old,{t:tInt,v:1},e.line); }
    else throw cerr(`Операцию ${e.op} можно применять только к числу или указателю`,e.line,'E2xxx');
    this.store(a,nv,e.line);
    return e.k==='pre'?a:old;
  }

  /* ---------- унарные и бинарные ---------- */
  evUn(e,sc){
    if(e.op==='&'){
      const x=this.ev(e.a,sc);
      if(x.method) throw cerr('Адрес метода брать не нужно',e.line);
      if(!x.lv) throw cerr('Адрес (&) можно взять только у переменной',e.line,'E2027');
      if(x.cell.getter||x.prop) throw cerr('У свойства нельзя взять адрес',e.line);
      return {t:T.ptr(x.t),v:this.ptrTo(x.cell,x.t)};
    }
    if(e.op==='*'){
      const p=this.rv(this.ev(e.a,sc));
      if(!isPtr(p.t)) throw cerr(`Разыменовать (*) можно только указатель, а здесь ${tname(p.t)}`,e.line,'E2xxx');
      if(isVoid(p.t.to)) throw cerr('Нельзя разыменовать void* — сначала приведи к нужному типу',e.line);
      return this.derefAt(p,0,e.line);
    }
    const x=this.rv(this.ev(e.a,sc));
    if(isCls(x.t)){ const m=this.findMethod(x.v.cls,'operator'+e.op); if(m) return this.callFunc(m.list[0],[],this.objPtr(x.v),e.line); }
    switch(e.op){
      case '!': return {t:tBool,v:this.truthy(x,e.line)?0:1};
      case '-': if(!isNum(x.t)) throw cerr('Минус применяют к числу',e.line); { const t=isFlt(x.t)?x.t:promote(x.t); return {t,v:isFlt(t)?-x.v:wrapInt(-x.v,t.n)}; }
      case '+': if(!isNum(x.t)) throw cerr('Плюс применяют к числу',e.line); return {t:isFlt(x.t)?x.t:promote(x.t),v:x.v};
      case '~': if(!isInt(x.t)) throw cerr('Операция ~ только для целых',e.line); { const t=promote(x.t); return {t,v:wrapInt(~x.v,t.n)}; }
    }
  }
  evBin(e,sc){
    const op=e.op;
    if(op==='&&'){ const a=this.truthy(this.ev(e.a,sc),e.line); if(!a) return {t:tBool,v:0}; return {t:tBool,v:this.truthy(this.ev(e.b,sc),e.line)?1:0}; }
    if(op==='||'){ const a=this.truthy(this.ev(e.a,sc),e.line); if(a) return {t:tBool,v:1}; return {t:tBool,v:this.truthy(this.ev(e.b,sc),e.line)?1:0}; }
    if(op==='<<'){
      // цепочка cout << a << b << c: Borland сначала вычисляет все операнды справа налево, потом печатает слева направо
      const chain=[]; let n=e; while(n.k==='bin'&&n.op==='<<'){ chain.unshift(n.b); n=n.a; }
      const root=this.ev(n,sc), rt=unref(root.t);
      if(rt===tOs||rt.n==='ostream'){
        const st=this.rv(root).v, vals=new Array(chain.length);
        for(let k=chain.length-1;k>=0;k--){ const x=this.ev(chain[k],sc); vals[k]=x.lv&&!x.prop&&!x.vclProp?this.rv(x):x; }
        for(let k=0;k<chain.length;k++) this.ostreamOut(st,vals[k],e.line);
        return {t:tOs,v:st};
      }
      if(chain.length>1){ let acc=this.rv(root); for(const x of chain){ const b=this.rv(this.ev(x,sc)); acc=this.binop('<<',acc,b,e.line); } return acc; }
      const b=this.rv(this.ev(e.b,sc)); const a=this.rv(root);
      if(isCls(a.t)||isCls(b.t)){ const r=this.opOverload(op,a,b,e.line,root); if(r) return r; throw cerr(`Операция << не определена для класса`,e.line,'E2093'); }
      return this.binop(op,a,b,e.line,e);
    }
    const ax=this.ev(e.a,sc);
    const at=unref(ax.t);
    if(op==='>>'&&(at===tIs||at.n==='istream')){ const st=this.rv(ax).v; this.istreamIn(st,this.ev(e.b,sc),e.line); return {t:tIs,v:st}; }
    const a=this.rv(ax), b=this.rv(this.ev(e.b,sc));
    if(isCls(a.t)||isCls(b.t)){
      const r=this.opOverload(op,a,b,e.line,ax); if(r) return r;
      throw cerr(`Операция ${op} не определена для класса ${isCls(a.t)?a.t.name:b.t.name} — напиши operator${op}`,e.line,'E2093');
    }
    if(op==='<<'&&isInt(a.t)&&(b.t===tOs)) throw cerr('Перепутан порядок: пиши cout << x',e.line);
    return this.binop(op,a,b,e.line,e);
  }
  opOverload(op,a,b,line,ax){
    if(isCls(a.t)){ const m=this.findMethod(a.v.cls,'operator'+op); if(m){ return this.callFunc(this.pickOverload(m.list,[b],line,'operator'+op),[b],this.objPtr(a.v),line); } }
    const fl=this.funcs.get('operator'+op); if(fl){ const f=this.pickOverload(fl,[ax,b],line,'operator'+op,true); if(f) return this.callFunc(f,[ax,b],null,line); }
    return null;
  }
  binop(op,a,b,line,e){
    const ta=unref(a.t), tb=unref(b.t);
    // строки
    if(isStr(ta)||isStr(tb)){
      const sa=this.toJsStr(a,line), sb=this.toJsStr(b,line);
      const ansi=(ta.ansi||tb.ansi);
      switch(op){
        case '+': if(!isStr(ta)&&!isStr(tb)) break; return {t:T.str(ansi),v:sa+sb};
        case '==': return {t:tBool,v:sa===sb?1:0};
        case '!=': return {t:tBool,v:sa!==sb?1:0};
        case '<': return {t:tBool,v:sa<sb?1:0}; case '>': return {t:tBool,v:sa>sb?1:0};
        case '<=': return {t:tBool,v:sa<=sb?1:0}; case '>=': return {t:tBool,v:sa>=sb?1:0};
      }
      throw cerr(`Операция ${op} не применяется к строкам`,line,'E2xxx');
    }
    // указатели
    if(isPtr(ta)||isPtr(tb)){
      if(op==='+'||op==='-'){
        if(isPtr(ta)&&isInt(tb)){ if(!a.v) throw rerr('Арифметика с нулевым указателем',line); return {t:ta,v:Object.assign({},a.v,{i:a.v.i+(op==='+'?b.v:-b.v)})}; }
        if(isInt(ta)&&isPtr(tb)&&op==='+') return {t:tb,v:Object.assign({},b.v,{i:b.v.i+a.v})};
        if(isPtr(ta)&&isPtr(tb)&&op==='-'){ if(a.v&&b.v&&a.v.arr!==b.v.arr) this.warn('ptrdiff','Разность указателей на разные массивы не имеет смысла',line); return {t:tInt,v:(this.ptrAddr(a.v)-this.ptrAddr(b.v))/(a.v?a.v.es:1)|0}; }
        if(isPtr(ta)&&isPtr(tb)) throw cerr('Два указателя нельзя складывать',line,'E2085');
      }
      if(['==','!=','<','>','<=','>='].includes(op)){
        if(a.lit&&b.lit||(isPtr(ta)&&isCharT(ta.to)&&isPtr(tb)&&isCharT(tb.to)&&(a.isLit||b.isLit))) this.warn('strcmp'+line,'Строки в кавычках и массивы char сравниваются через == по адресу, а не по тексту. Для сравнения текста используй strcmp(a, b) == 0',line);
        const x=isPtr(ta)?this.ptrAddr(a.v):a.v, y=isPtr(tb)?this.ptrAddr(b.v):b.v;
        const r={'==':x===y,'!=':x!==y,'<':x<y,'>':x>y,'<=':x<=y,'>=':x>=y}[op];
        return {t:tBool,v:r?1:0};
      }
      throw cerr(`Операция ${op} не применяется к указателям`,line,'E2xxx');
    }
    if(!isNum(ta)||!isNum(tb)) throw cerr(`Операция ${op} не применяется к ${tname(isNum(ta)?tb:ta)}`,line,'E2xxx');
    if(op==='<<'||op==='>>'||op==='&'||op==='|'||op==='^'||op==='%'){
      if(!isInt(ta)||!isInt(tb)){
        if(op==='%') throw cerr('Остаток от деления % — только для целых чисел. Для дробных есть fmod(x, y) из math.h',line,'E2xxx');
        throw cerr(`Операция ${op} — только для целых чисел`,line,'E2xxx');
      }
    }
    const rt=arith(promote(ta),promote(tb));
    const x=a.v, y=b.v;
    const cmp=(r)=>({t:tBool,v:r?1:0});
    if(isFlt(rt)){
      const f=rt.n==='float'?Math.fround:(v=>v);
      switch(op){
        case '+': return {t:rt,v:f(x+y)}; case '-': return {t:rt,v:f(x-y)}; case '*': return {t:rt,v:f(x*y)};
        case '/': if(y===0) this.warn('div0f'+line,'Деление дробного числа на ноль — получится бесконечность (+INF)',line); return {t:rt,v:f(x/y)};
        case '<': return cmp(x<y); case '>': return cmp(x>y); case '<=': return cmp(x<=y); case '>=': return cmp(x>=y);
        case '==': return cmp(x===y); case '!=': return cmp(x!==y);
      }
    } else {
      const n=rt.n; const U=n==='uint'||n==='ulong';
      const xx=U?x>>>0:x, yy=U?y>>>0:y;
      switch(op){
        case '+': return {t:rt,v:wrapInt(xx+yy,n)};
        case '-': return {t:rt,v:wrapInt(xx-yy,n)};
        case '*': return {t:rt,v:U?(Math.imul(xx,yy)>>>0):n==='llong'?xx*yy:Math.imul(xx,yy)};
        case '/': if(yy===0) throw rerr('Деление целого числа на ноль (Divide by zero) — программа в Builder аварийно завершится',line);
          return {t:rt,v:wrapInt(Math.trunc(xx/yy),n),idiv:xx%yy!==0?`${xx}/${yy}`:null};
        case '%': if(yy===0) throw rerr('Остаток от деления на ноль (Divide by zero)',line); return {t:rt,v:wrapInt(xx%yy,n)};
        case '<': return cmp(xx<yy); case '>': return cmp(xx>yy); case '<=': return cmp(xx<=yy); case '>=': return cmp(xx>=yy);
        case '==': return cmp(xx===yy); case '!=': return cmp(xx!==yy);
        case '&': return {t:rt,v:wrapInt(xx&yy,n)}; case '|': return {t:rt,v:wrapInt(xx|yy,n)}; case '^': return {t:rt,v:wrapInt(xx^yy,n)};
        case '<<': return {t:promote(ta),v:wrapInt(x<<(y&31),promote(ta).n)};
        case '>>': return {t:promote(ta),v:(promote(ta).n==='uint'?(x>>>(y&31)):(x>>(y&31)))};
      }
    }
    throw cerr('Неизвестная операция '+op,line);
  }
  toJsStr(v,line,forAppend){
    const t=unref(v.t);
    if(isStr(t)) return v.v;
    if(isPtr(t)&&isCharT(t.to)) return this.cstr(v.v,line);
    if(isCharT(t)) return CPP.b2c(v.v);
    if(isNum(t)&&forAppend) return CPP.b2c(v.v);
    if(isNum(t)) throw cerr(`Число нельзя сложить со строкой string. Для превращения числа в текст в Builder есть IntToStr(x)`,line,'E2xxx');
    throw cerr(`Нельзя использовать ${tname(t)} как строку`,line,'E2xxx');
  }

  /* ---------- вызовы ---------- */
  evArgs(list,sc,asRv){ // аргументы вычисляются справа налево, как в bcc32
    const r=new Array(list.length);
    for(let k=list.length-1;k>=0;k--){ const v=this.ev(list[k],sc); r[k]=asRv?this.rv(v):v; }
    return r;
  }
  evCall(e,sc){
    const f=e.f;
    if(f.k==='id'){
      const n=f.name;
      // локальная переменная-объект с operator()
      const top=this.curScopeTop(sc);
      if(top&&top.thisPtr){
        const m=this.findMethod(top.thisPtr.obj.cls,n);
        if(m&&!this.lookup(n,sc)) return this.callMethod(top.thisPtr.obj,n,this.evArgs(e.args,sc),e.line,true,sc,true,top.ci);
        // метод самой формы VCL без «this->»: Close(), Hide(), Show(), Repaint()…
        const o=top.thisPtr.obj;
        if(o.vcl&&this.vcl&&!this.lookup(n,sc)&&!this.funcs.has(n)){ const r=this.vcl.member(o,n,e.line,true); if(r&&r.vclMethod) return this.vcl.callMethod(r,this.evArgs(e.args,sc),e.line,this); }
      }
      if(this.funcs.has(n)&&!this.lookup(n,sc)){
        const args=this.evArgs(e.args,sc);
        const fn=this.pickOverload(this.funcs.get(n),args,e.line,n);
        return this.callFunc(fn,args,null,e.line);
      }
      if(this.vcl){ const r=this.vcl.call(n,e.args,sc,e.line,this); if(r) return r; }
      const L=CPP.LIB[n];
      if(L&&L.fn){
        const args=L.raw?e.args:this.evArgs(e.args,sc,!L.lv);
        if(L.argc!=null&&args.length<L.argc) throw cerr(`Функции ${n} нужно ${L.argc} аргумент(а), а передано ${args.length}`,e.line,'E2193');
        return L.fn(this,args,e.line,sc,e)||{t:tVoid,v:0};
      }
      if(this.lookup(n,sc)) throw cerr(`«${n}» — переменная, а не функция; скобки ( ) после неё не нужны`,e.line,'E2314');
      throw cerr(`Вызов неизвестной функции «${n}»`,e.line,'E2268');
    }
    const fx=this.ev(f,sc);
    if(fx.method){ return this.callMethod(fx.method.o,fx.method.name,this.evArgs(e.args,sc),e.line,fx.method.viaPtr||true,sc,false,fx.method.scls); }
    if(fx.scopeFn){ // Base::method(...)
      const top=this.curScopeTop(sc); const {ci,name}=fx.scopeFn;
      const m=ci.methods.get(name);
      if(!m) throw cerr(`В классе ${ci.name} нет метода ${name}`,e.line,'E2316');
      const args=this.evArgs(e.args,sc);
      const fn=this.pickOverload(m,args,e.line,name);
      if(fn.static||!top||!top.thisPtr) return this.callFunc(fn,args,null,e.line);
      return this.callFunc(fn,args,top.thisPtr,e.line);
    }
    if(fx.gfn){ const args=this.evArgs(e.args,sc); return this.callFunc(this.pickOverload(this.funcs.get(fx.gfn),args,e.line,fx.gfn),args,null,e.line); }
    if(fx.strObj) return CPP.strMethod(this,fx.strObj,fx.mname,this.evArgs(e.args,sc),e.line);
    if(fx.stream) return CPP.streamMethod(this,fx.stream,fx.mname,this.evArgs(e.args,sc),e.line,sc,e.args);
    if(fx.vclMethod) return this.vcl.callMethod(fx,this.evArgs(e.args,sc),e.line,this);
    if(fx.lv&&isCls(fx.t)){ const o=fx.cell.v; if(this.findMethod(o.cls,'operator()')) return this.callMethod(o,'operator()',this.evArgs(e.args,sc),e.line,true,sc); }
    throw cerr('Это нельзя вызвать как функцию',e.line,'E2314');
  }
  callMethod(o,name,args,line,dynamic,sc,implicitThis,scls){
    const m=this.findMethod(scls&&this.isDerived(o.cls,scls)?scls:o.cls,name);
    if(!m) throw cerr(`В классе ${o.cls.name} нет метода ${name}`,line,'E2316');
    let fn=this.pickOverload(m.list,args,line,o.cls.name+'::'+name);
    // виртуальный вызов: ищем переопределение в настоящем классе объекта
    if(this.isVirtualIn(m.ci,name)&&dynamic){
      const dm=this.findMethod(o.cls,name);
      const cand=dm&&this.pickOverload(dm.list,args,line,name,true);
      if(cand) fn=cand;
    }
    const top=sc&&this.curScopeTop(sc);
    if(!implicitThis) this.checkAccess(fn,m.ci,line,'метод',top);
    if(fn.pure&&!fn.body) throw rerr(`Вызов чистой виртуальной функции ${m.ci.name}::${name}`,line);
    if(fn.static) return this.callFunc(fn,args,null,line);
    return this.callFunc(fn,args,this.objPtr(o),line);
  }
  isVirtualIn(ci,name){ const l=ci.methods.get(name); if(l&&l.some(m=>m.virtual)) return true; return ci.bases.some(b=>b.ci&&this.isVirtualIn(b.ci,name)); }
  strCtor(args,line){
    if(!args.length) return '';
    const a=args[0];
    if(args.length===2&&isInt(a.t)) return CPP.b2c(args[1].v).repeat(a.v);
    return this.toJsStr(a,line);
  }

  /* ---------- ввод/вывод ---------- */
  out(s,attr){ this.con.write(s,attr==null?this.con.attr:attr); }
  ostreamOut(st,x,line){
    if(st==='file'){ return; }
    const os=this.os;
    if(x.manip){ x.manip(this); return; }
    const v=this.rv(x);
    if(v.t===tManip){ v.v(this); return; }
    if(v.t===tOs) return;
    if(isCls(v.t)){
      const r=this.opOverload('<<',{t:tOs,v:st},v,line,{t:tOs,v:st}); if(r) return;
      throw cerr(`cout не умеет печатать объект класса ${v.t.name} — выведи его поля по отдельности или напиши operator<<`,line,'E2094');
    }
    if(isVoid(v.t)) throw cerr('Функция void ничего не возвращает — её результат нельзя вывести через cout',line,'E2094');
    let s;
    const t=unref(v.t);
    if(isPtr(t)&&isCharT(t.to)) s=this.cstr(v.v,line);
    else if(isPtr(t)) s=String(this.ptrAddr(v.v));
    else if(isStr(t)) s=v.v;
    else if(isCharT(t)) s=CPP.b2c(v.v);
    else if(t.k==='p'&&t.n==='bool'&&os.boolalpha) s=v.v?'true':'false';
    else if(isFlt(t)) s=this.fmtFloat(v.v);
    else if(isInt(t)){
      const n=t.k==='enum'?'int':t.n;
      if(os.base===16) s=(v.v>>>0).toString(16); else if(os.base===8) s=(v.v>>>0).toString(8);
      else s=String((n==='uint'||n==='ulong')?v.v>>>0:v.v);
      if(os.showpos&&v.v>0&&os.base===10) s='+'+s;
      if(os.upper) s=s.toUpperCase();
    }
    else s=String(v.v);
    if(os.w>0&&s.length<os.w){ s=os.left?s.padEnd(os.w,os.fill):(os.internal&&/^[+-]/.test(s)?s[0]+s.slice(1).padStart(os.w-1,os.fill):s.padStart(os.w,os.fill)); }
    os.w=0;
    this.out(s);
  }
  fmtFloat(x){
    const os=this.os;
    let s;
    if(os.fixed) s=CPP.numStr(x,'f',os.prec);
    else if(os.sci) s=CPP.numStr(x,'e',os.prec,{upper:os.upper});
    else s=CPP.numStr(x,'g',os.prec,{alt:os.showpoint,upper:os.upper});
    if(os.showpos&&x>=0&&!s.startsWith('+')) s='+'+s;
    return s;
  }
  // --- ввод ---
  echoLine(){
    if(this.ip>this.echoedTo&&(this.ip===0||this.input[this.ip-1]==='\n')&&this.opts.echo!==false){
      let j=this.input.indexOf('\n',this.ip); if(j<0) j=this.input.length;
      this.con.write(this.input.slice(this.ip,j)+'\n',this.opts.inputAttr||15);
      this.echoedTo=j;
    }
  }
  peekCh(){ if(this.ip>=this.input.length){ if(this.opts.interactive) throw new WaitSig(); return null; } this.echoLine(); return this.input[this.ip]; }
  getCh(){ const c=this.peekCh(); if(c!==null) this.ip++; return c; }
  skipWs(){ while(true){ const c=this.peekCh(); if(c===null) return false; if(/\s/.test(c)) this.ip++; else return true; } }
  noInput(line){ this.inFail=true; this.warn('eof','Программа ждала ввод, а данных больше нет. Допиши значения в поле «Ввод»',line); }
  readToken(kind,line){
    if(this.inFail) return null;
    if(!this.skipWs()){ this.noInput(line); return null; }
    let s='';
    const rest=this.input.slice(this.ip);
    let m;
    if(kind==='int') m=rest.match(/^[+-]?\d+/);
    else if(kind==='float') m=rest.match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
    else if(kind==='char') m=rest.match(/^[\s\S]/);
    else m=rest.match(/^\S+/);
    if(!m){ this.inFail=true; this.warn('badin','Введено не то, что ждала программа (например, буква вместо числа). Дальше cin перестаёт читать',line); return null; }
    s=m[0]; this.ip+=s.length;
    return s;
  }
  istreamIn(st,x,line){
    if(x.manip||x.t===tManip) return;
    if(!x.lv){ throw cerr('После >> должна стоять переменная, в которую читаем',line,'E2277'); }
    if(x.vclProp) throw cerr('В свойство компонента через cin читать нельзя',line);
    const t=unref(x.t);
    if(t.c) throw cerr('Нельзя прочитать значение в константу',line,'E2024');
    if(isInt(t)&&!isCharT(t)){ const s=this.readToken('int',line); if(s==null) return; x.cell.v=toIntT(parseInt(s,10),t.k==='enum'?'int':t.n); x.cell.u=false; return; }
    if(isFlt(t)){ const s=this.readToken('float',line); if(s==null) return; let v=parseFloat(s); if(t.n==='float') v=Math.fround(v); x.cell.v=v; x.cell.u=false; return; }
    if(isCharT(t)){ const s=this.readToken('char',line); if(s==null) return; x.cell.v=toIntT(CPP.c2b(s),"char"); x.cell.u=false; return; }
    if(isStr(t)){ const s=this.readToken('word',line); if(s==null) return; x.cell.v=s; return; }
    if(isArr(t)&&isCharT(t.of)){ const s=this.readToken('word',line); if(s==null) return; this.writeCStr({arr:x.cell.v,i:0,base:x.cell,es:1},s,line); return; }
    if(isPtr(t)&&isCharT(t.to)){ const s=this.readToken('word',line); if(s==null) return; this.writeCStr(x.cell.v,s,line); return; }
    if(isArr(t)) throw cerr('Массив целиком через cin не читают — читай по элементам в цикле: cin >> a[i]',line,'E2094');
    throw cerr(`cin не умеет читать значение типа ${tname(t)}`,line,'E2094');
  }
  writeCStr(p,s,line){
    if(!p) throw rerr('Запись строки по нулевому указателю',line);
    if(p.i+s.length>=p.arr.length) throw rerr(`Строка «${s}» (${s.length} симв. + '\\0') не помещается в массив из ${p.arr.length-p.i} символов — переполнение буфера`,line);
    for(let k=0;k<s.length;k++){ p.arr[p.i+k].v=toIntT(CPP.c2b(s[k]),"char"); p.arr[p.i+k].u=false; }
    p.arr[p.i+s.length].v=0; p.arr[p.i+s.length].u=false;
  }
  readLine(){ // остаток текущей строки (для getline/gets)
    if(this.ip>=this.input.length){ if(this.opts.interactive) throw new WaitSig(); return null; }
    this.echoLine();
    let j=this.input.indexOf('\n',this.ip); let s;
    if(j<0){ s=this.input.slice(this.ip); this.ip=this.input.length; } else { s=this.input.slice(this.ip,j); this.ip=j+1; }
    return s;
  }
}
Interp.oid=0;
function sameType(a,b){
  if(!a||!b) return false;
  if(a.k!==b.k) return false;
  switch(a.k){ case 'p': return a.n===b.n; case 'ptr': return sameType(a.to,b.to); case 'ref': return sameType(a.to,b.to); case 'arr': return sameType(a.of,b.of);
    case 'cls': case 'enum': return a.name===b.name; case 'str': return !!a.ansi===!!b.ansi; }
  return false;
}
function mergeParams(a,b){ return a.map((p,i)=>Object.assign({},p,{name:b[i]&&b[i].name||p.name,def:p.def!=null?p.def:(b[i]&&b[i].def)})); }

CPP.Interp=Interp;
CPP.types={tInt,tDbl,tBool,tChar,tVoid,tFlt,tUint,tLong,tOs,tIs,tManip,P,isInt,isFlt,isNum,isPtr,isStr,isCls,isArr,isCharT,isVoid,unref,toIntT,tname,sameType};
CPP.signals={ExitSig};
CPP.run=function(src,opts){
  let prog;
  try{ prog=CPP.parse(src); }
  catch(e){ if(e instanceof CppError) return {ok:false,error:e,lines:[],screen:[],warnings:[],compileError:true}; return {ok:false,error:rerr('Внутренняя ошибка разбора: '+e.message,0),lines:[],screen:[],warnings:[]}; }
  const it=new Interp(prog,opts);
  const r=it.run();
  if(r.error&&r.error.kind==='compile') r.compileError=true;
  return r;
};
})(typeof window!=='undefined'?window:globalThis);
