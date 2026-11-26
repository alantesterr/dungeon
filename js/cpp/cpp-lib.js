/* Учебный интерпретатор C++ — консоль, форматирование чисел (как в Borland RTL) и библиотечные функции. */
(function(G){
'use strict';
const CPP=G.CPP;

/* ---------------- char = байт в кодировке Windows-1251 (как в Builder) ---------------- */
const B2C=new Array(256), C2B=new Map();
(function(){
  let s=null;
  try{ s=new TextDecoder('windows-1251').decode(Uint8Array.from({length:256},(_,i)=>i)); }catch(e){}
  for(let i=0;i<256;i++){ const ch=s?s[i]:String.fromCharCode(i); B2C[i]=ch; if(!C2B.has(ch)) C2B.set(ch,i); }
})();
CPP.b2c=v=>B2C[((v%256)+256)%256];                 // байт (или signed char) → символ
CPP.c2b=ch=>{ if(ch==null||ch==='') return 0; const b=C2B.get(ch[0]); return b==null?63:b; }  // символ → байт 0…255 ('?' если нет в 1251)

/* ---------------- Консоль: экран как в окне Windows, с цветами ---------------- */
class Console{
  constructor(){ this.clear(); this.attr=7; }
  clear(){ this.rows=[[]]; this.x=0; this.y=0; }
  row(y){ while(this.rows.length<=y) this.rows.push([]); return this.rows[y]; }
  put(ch,attr){
    const r=this.row(this.y);
    while(r.length<this.x) r.push({c:' ',a:7});
    r[this.x]={c:ch,a:attr}; this.x++;
  }
  write(s,attr,conio){
    if(attr==null) attr=this.attr;
    for(const ch of String(s)){
      if(ch==='\n'){ this.y++; if(!conio) this.x=0; this.row(this.y); }
      else if(ch==='\r'){ this.x=0; }
      else if(ch==='\t'){ do{ this.put(' ',attr); }while(this.x%8); }
      else if(ch==='\b'){ if(this.x>0) this.x--; }
      else if(ch==='\x07'||ch==='\0'){ }
      else this.put(ch,attr);
    }
  }
  gotoxy(x,y){ this.x=Math.max(0,x-1); this.y=Math.max(0,y-1); this.row(this.y); }
  lines(){ // текст без цвета, хвостовые пробелы и пустые строки в конце убраны
    const out=this.rows.map(r=>r.map(c=>c.c).join('').replace(/\s+$/,''));
    while(out.length&&out[out.length-1]==='') out.pop();
    return out;
  }
  colored(){ return this.rows.map(r=>r.map(c=>({c:c.c,a:c.a}))); }
}
CPP.Console=Console;

/* ---------------- Точная печать double (как printf в Borland: округление к чётному) ---------------- */
const dv=new DataView(new ArrayBuffer(8));
function exact(x){ // x>0 конечное → {d: BigInt, e: степень 10}, x = d·10^e
  dv.setFloat64(0,x);
  const hi=dv.getUint32(0), lo=dv.getUint32(4);
  const be=(hi>>>20)&0x7ff;
  let m=(BigInt(hi&0xfffff)<<32n)|BigInt(lo);
  let e2;
  if(be===0){ e2=-1074; } else { m|=1n<<52n; e2=be-1075; }
  if(m===0n) return {d:0n,e:0};
  if(e2>=0) return {d:m<<BigInt(e2),e:0};
  return {d:m*(5n**BigInt(-e2)),e:e2};
}
const P10=k=>10n**BigInt(k);
function roundDiv(d,div){ let q=d/div, r=d%div; const r2=r*2n; if(r2>div||(r2===div&&(q&1n))) q++; return q; }
function fixedDigits(x,prec){ // строка с prec знаками после точки, x>=0
  if(x===0) return prec>0?'0.'+'0'.repeat(prec):'0';
  const {d,e}=exact(x);
  const sh=e+prec; let q= sh>=0 ? d*P10(sh) : roundDiv(d,P10(-sh));
  let s=q.toString();
  if(prec===0) return s;
  if(s.length<=prec) s='0'.repeat(prec-s.length+1)+s;
  return s.slice(0,s.length-prec)+'.'+s.slice(s.length-prec);
}
function expParts(x,prec){ // x>0 → {m:'d.ddd', X}
  if(x===0) return {m:prec>0?'0.'+'0'.repeat(prec):'0',X:0};
  const {d,e}=exact(x);
  const nd=d.toString().length; let X=nd-1+e;
  const sh=prec-nd+1; let q= sh>=0 ? d*P10(sh) : roundDiv(d,P10(-sh));
  let s=q.toString();
  if(s.length>prec+1){ s=s.slice(0,prec+1); X++; }
  return {m: prec>0 ? s[0]+'.'+s.slice(1) : s, X};
}
const expStr=X=>(X<0?'-':'+')+String(Math.abs(X)).padStart(2,'0');
function fmtE(x,prec,upper,alt){ const {m,X}=expParts(x,prec); let mm=m; if(alt&&prec===0) mm+='.'; return mm+(upper?'E':'e')+expStr(X); }
function fmtG(x,prec,upper,alt){
  const P=prec===0?1:prec;
  const {X}=expParts(x,P-1);
  let s;
  if(X<-4||X>=P){ const {m,X:X2}=expParts(x,P-1); s=m; if(!alt&&s.includes('.')) s=s.replace(/\.?0+$/,''); s+=(upper?'E':'e')+expStr(X2); }
  else { s=fixedDigits(x,P-1-X); if(!alt&&s.includes('.')) s=s.replace(/\.?0+$/,''); }
  return s;
}
function special(x,upper){ if(Number.isNaN(x)) return upper?'NAN':'nan'; return x>0?'+INF':'-INF'; }
function numStr(x,mode,prec,opts={}){ // mode: 'f','e','g'
  if(!Number.isFinite(x)) return special(x,opts.upper);
  const neg=x<0||Object.is(x,-0); const a=Math.abs(x);
  let s= mode==='f'?fixedDigits(a,prec): mode==='e'?fmtE(a,prec,opts.upper,opts.alt): fmtG(a,prec,opts.upper,opts.alt);
  if(mode==='f'&&opts.alt&&prec===0) s+='.';
  return (neg?'-':(opts.plus?'+':opts.space?' ':''))+s;
}
CPP.numStr=numStr;

/* printf-формат. getArg(kind) отдаёт очередной аргумент: число или строку. */
function cformat(fmt,args,cstr,line){
  let out='', ai=0;
  const take=()=>{ if(ai>=args.length) return {t:{k:'p',n:'int'},v:0,missing:true}; return args[ai++]; };
  for(let i=0;i<fmt.length;i++){
    const c=fmt[i];
    if(c!=='%'){ out+=c; continue; }
    i++; if(fmt[i]==='%'){ out+='%'; continue; }
    let flags=''; while('-+ #0'.includes(fmt[i])&&i<fmt.length){ flags+=fmt[i]; i++; }
    let width=''; if(fmt[i]==='*'){ width=String(take().v); i++; } else while(/[0-9]/.test(fmt[i])){ width+=fmt[i]; i++; }
    let prec=null; if(fmt[i]==='.'){ i++; prec=''; if(fmt[i]==='*'){ prec=String(take().v); i++; } else while(/[0-9]/.test(fmt[i])){ prec+=fmt[i]; i++; } prec=+prec||0; }
    let len=''; while('hlLqjzt'.includes(fmt[i])&&i<fmt.length){ len+=fmt[i]; i++; }
    const conv=fmt[i]; if(!conv) break;
    const a=take(); let s='';
    const left=flags.includes('-'), zero=flags.includes('0')&&!left, plus=flags.includes('+'), space=flags.includes(' '), alt=flags.includes('#');
    const num=()=>{ const v=a.v; if(a.t.k==='ptr') return 0; if(typeof v==='string') return 0; return Number(v)||0; };
    switch(conv){
      case 'd': case 'i':{ let v=Math.trunc(num()); if(a.t.k==='p'&&(a.t.n==='float'||a.t.n==='double'||a.t.n==='ldouble')) v=0; // как в C: double в %d даёт мусор
        if(len.includes('h')) v=(v<<16)>>16; else v=v|0;
        s=String(Math.abs(v)); if(prec!==null) s=s.padStart(prec,'0'); s=(v<0?'-':plus?'+':space?' ':'')+s; break; }
      case 'u': s=String(Math.trunc(num())>>>0); break;
      case 'o': s=(Math.trunc(num())>>>0).toString(8); if(alt) s='0'+s; break;
      case 'x': case 'X': s=(Math.trunc(num())>>>0).toString(16); if(conv==='X') s=s.toUpperCase(); if(alt&&s!=='0') s=(conv==='X'?'0X':'0x')+s; if(prec!==null) s=s.padStart(prec,'0'); break;
      case 'c': s=CPP.b2c(num()); break;
      case 's':{ s= typeof a.v==='string'? a.v : cstr(a); if(prec!==null) s=s.slice(0,prec); break; }
      case 'f': case 'F': s=numStr(num(),'f',prec==null?6:prec,{plus,space,alt}); break;
      case 'e': case 'E': s=numStr(num(),'e',prec==null?6:prec,{plus,space,alt,upper:conv==='E'}); break;
      case 'g': case 'G': s=numStr(num(),'g',prec==null?6:prec,{plus,space,alt,upper:conv==='G'}); break;
      case 'p': s=(CPP.addrOf?CPP.addrOf(a):0).toString(16).toUpperCase().padStart(8,'0'); break;
      case 'n': break;
      default: s='%'+flags+width+conv;
    }
    const w=+width||0;
    if(s.length<w){
      if(left) s=s.padEnd(w,' ');
      else if(zero&&'diuoxXfFeEgG'.includes(conv)){ const sign=/^[+\- ]/.test(s)?s[0]:''; const body=sign?s.slice(1):s; s=sign+body.padStart(w-sign.length,'0'); }
      else s=s.padStart(w,' ');
    }
    out+=s;
  }
  return out;
}
CPP.cformat=cformat;

/* ---------------- Заголовки ---------------- */
const HDR={
  'iostream.h':['iostream',true],'iostream':['iostream',false],'fstream.h':['fstream',true],'fstream':['fstream',false],
  'iomanip.h':['iomanip',true],'iomanip':['iomanip',false],'conio.h':['conio',true],
  'math.h':['math',true],'cmath':['math',true],'stdio.h':['stdio',true],'cstdio':['stdio',true],
  'stdlib.h':['stdlib',true],'cstdlib':['stdlib',true],'string.h':['cstring',true],'cstring':['cstring',true],'mem.h':['cstring',true],
  'string':['string',false],'cstring.h':['cstring',true],'ctype.h':['ctype',true],'cctype':['ctype',true],
  'time.h':['time',true],'ctime':['time',true],'windows.h':['windows',true],'vcl.h':['vcl',true],'dos.h':['dos',true],
  'stdbool.h':['x',true],'limits.h':['limits',true],'climits':['limits',true],'float.h':['x',true],'values.h':['limits',true],
  'iso646.h':['x',true],'assert.h':['x',true],'algorithm':['algorithm',false],'locale.h':['x',true],'process.h':['stdlib',true],'alloc.h':['stdlib',true],'malloc.h':['stdlib',true],
};
// заголовки VCL, которые C++Builder пишет в Unit1.h
['classes.hpp','controls.hpp','stdctrls.hpp','forms.hpp','extctrls.hpp','buttons.hpp','comctrls.hpp','menus.hpp','dialogs.hpp','graphics.hpp','sysutils.hpp','system.hpp','tchar.h'].forEach(h=>{ HDR[h]=['vcl',true]; });
CPP.HDR=HDR;
// какие группы открывает каждый заголовок (vcl.h подтягивает windows, stdlib, sysutils)
const IMPLIES={iostream:['iostream','string'],fstream:['iostream','fstream','string'],vcl:['vcl','windows','stdlib','sysutils','stdio','cstring','string'],
  windows:['windows'],stdlib:['stdlib'],iomanip:['iomanip','iostream']};
CPP.IMPLIES=IMPLIES;
const HDR_NAME={iostream:'iostream.h',iomanip:'iomanip.h',conio:'conio.h',math:'math.h',stdio:'stdio.h',stdlib:'stdlib.h',cstring:'string.h',string:'string',
  ctype:'ctype.h',time:'time.h',windows:'windows.h',vcl:'vcl.h',sysutils:'vcl.h',dos:'dos.h',fstream:'fstream.h',limits:'limits.h',algorithm:'algorithm'};
CPP.HDR_NAME=HDR_NAME;

/* ---------------- Генератор случайных чисел Borland ---------------- */
const RNG={seed:0};
const lcg=s=>Number((BigInt(s)*22695477n+1n)&0xffffffffn);
RNG.srand=s=>{ RNG.seed=lcg(s>>>0); };
RNG.rand=()=>{ RNG.seed=lcg(RNG.seed); return (RNG.seed>>>16)&0x7fff; };
RNG.lrand=()=>{ const a=RNG.rand(), b=RNG.rand(); return ((a<<16)|(b<<1)|(a&1))&0x7fffffff; };
RNG.reset=()=>RNG.srand(1);
CPP.RNG=RNG;
})(typeof window!=='undefined'?window:globalThis);
