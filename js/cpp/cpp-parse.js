/* Учебный интерпретатор C++ в стиле Borland C++Builder 6 — лексер и парсер.
   Результат: дерево программы (AST). Ошибки — CppError с номером строки и текстом по-русски. */
(function(G){
'use strict';
const CPP = G.CPP = G.CPP || {};

class CppError extends Error {
  constructor(msg, line, kind, code){ super(msg); this.line=line||0; this.kind=kind||'compile'; this.code=code||''; }
}
CPP.CppError = CppError;
const cerr=(msg,line,code)=>new CppError(msg,line,'compile',code);

/* ---------------- Лексер ---------------- */
const KW=new Set(('int char short long unsigned signed float double bool void const static if else while do for switch case default '+
  'break continue return goto struct class public private protected virtual new delete this true false sizeof enum typedef using '+
  'namespace inline operator friend template typename extern register auto volatile __fastcall __property __published static_cast '+
  'NULL nullptr').split(' '));
const PUNCT=['<<=','>>=','->*','...','::','->','++','--','<<','>>','<=','>=','==','!=','&&','||','+=','-=','*=','/=','%=','&=','|=','^=',
  '+','-','*','/','%','<','>','=','!','~','&','|','^','?',':',';',',','.','(',')','[',']','{','}','#'];

function lex(src){
  const toks=[], headers=[], defines=new Map();
  let i=0, line=1; const n=src.length;
  const push=(t,v,extra)=>{ const o={t,v,line}; if(extra) Object.assign(o,extra); toks.push(o); };
  let atLineStart=true;
  while(i<n){
    const c=src[i];
    if(c==='\n'){ line++; i++; atLineStart=true; continue; }
    if(c===' '||c==='\t'||c==='\r'||c==='\f'||c==='\v'){ i++; continue; }
    if(c==='/'&&src[i+1]==='/'){ while(i<n&&src[i]!=='\n') i++; continue; }
    if(c==='/'&&src[i+1]==='*'){ const st=line; i+=2; while(i<n&&!(src[i]==='*'&&src[i+1]==='/')){ if(src[i]==='\n') line++; i++; }
      if(i>=n) throw cerr('Комментарий /* не закрыт — нет */',st,'E2134'); i+=2; continue; }
    if(c==='#'&&atLineStart){
      let j=i; let txt=''; while(j<n&&src[j]!=='\n'){ if(src[j]==='\\'&&src[j+1]==='\n'){ j+=2; line++; continue; } txt+=src[j]; j++; }
      i=j; directive(txt.slice(1).trim(), line); continue;
    }
    atLineStart=false;
    if(/[A-Za-z_]/.test(c)){
      let j=i+1; while(j<n&&/[A-Za-z0-9_]/.test(src[j])) j++;
      const w=src.slice(i,j); i=j;
      if(defines.has(w)){ expandMacro(w); continue; }
      push(KW.has(w)?'kw':'id',w); continue;
    }
    if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(src[i+1]||''))){ i=number(i); continue; }
    if(c==='"'){ let s=''; i++; while(true){ if(i>=n||src[i]==='\n') throw cerr('Строка не закрыта — нет второй кавычки "',line,'E2380');
        if(src[i]==='"') break; if(src[i]==='\\'){ const r=esc(i); s+=r.ch; i=r.i; } else { s+=src[i]; i++; } }
      i++;
      const last=toks[toks.length-1];
      if(last&&last.t==='str') last.v+=s; else push('str',s);
      continue; }
    if(c==="'"){ i++; let ch; if(src[i]==='\\'){ const r=esc(i); ch=r.ch; i=r.i; } else { ch=src[i]; i++; }
      if(src[i]!=="'"){ // многосимвольная константа 'ab' — в C++ это int, встречается редко
        let extra=''; while(i<n&&src[i]!=="'"&&src[i]!=='\n'){ extra+=src[i]; i++; }
        if(src[i]!=="'") throw cerr("Символьная константа не закрыта — нет второй кавычки '",line,'E2380');
        ch=ch+extra; }
      i++; push('chr',ch); continue; }
    let p=null; for(const q of PUNCT){ if(src.startsWith(q,i)){ p=q; break; } }
    if(!p) throw cerr(`Недопустимый символ «${c}» в программе`,line,'E2206');
    push('op',p); i+=p.length;
  }
  push('eof','');
  return {toks,headers,defines};

  function esc(k){ // k указывает на '\'
    const d=src[k+1]; const map={n:'\n',t:'\t',r:'\r','0':'\0',a:'\x07',b:'\b',f:'\f',v:'\v','\\':'\\',"'":"'",'"':'"','?':'?'};
    if(d==='x'){ let j=k+2, h=''; while(/[0-9a-fA-F]/.test(src[j]||'')&&h.length<4){ h+=src[j]; j++; } return {ch:CPP.b2c(parseInt(h||'0',16)),i:j}; }
    if(/[0-7]/.test(d)){ let j=k+1, o=''; while(/[0-7]/.test(src[j]||'')&&o.length<3){ o+=src[j]; j++; } return {ch:CPP.b2c(parseInt(o,8)),i:j}; }
    if(d in map) return {ch:map[d],i:k+2};
    return {ch:d,i:k+2};
  }
  function number(k){
    let j=k, isF=false, s='';
    if(src[j]==='0'&&/[xX]/.test(src[j+1]||'')){ j+=2; while(/[0-9a-fA-F]/.test(src[j]||'')) j++; s=src.slice(k,j);
      let suf=''; while(/[uUlL]/.test(src[j]||'')){ suf+=src[j]; j++; }
      push('num',parseInt(s,16),{nt:/u/i.test(suf)?'uint':'int',raw:src.slice(k,j)}); return j; }
    while(/[0-9]/.test(src[j]||'')) j++;
    if(src[j]==='.'){ isF=true; j++; while(/[0-9]/.test(src[j]||'')) j++; }
    if(/[eE]/.test(src[j]||'')&&/[0-9+-]/.test(src[j+1]||'')){ isF=true; j++; if(/[+-]/.test(src[j])) j++; while(/[0-9]/.test(src[j]||'')) j++; }
    s=src.slice(k,j);
    let suf=''; while(/[uUlLfF]/.test(src[j]||'')){ suf+=src[j]; j++; }
    if(/[A-Za-z_]/.test(src[j]||'')) throw cerr(`Неверная числовая константа «${src.slice(k,j+1)}»`,line,'E2279');
    if(isF||/f/i.test(suf)&&isF){ push('num',parseFloat(s),{nt:/f/i.test(suf)?'float':'double',raw:src.slice(k,j)}); return j; }
    let v = (s.length>1&&s[0]==='0') ? parseInt(s,8) : parseInt(s,10);
    let nt=/u/i.test(suf)?'uint':'int'; if(v>2147483647) nt='uint';
    push('num',v,{nt,raw:src.slice(k,j)}); return j;
  }
  function directive(d, ln){
    let m;
    if((m=d.match(/^include\s*[<"]\s*([^>"]+?)\s*[>"]/))){ headers.push({name:m[1].toLowerCase(),line:ln}); return; }
    if((m=d.match(/^define\s+([A-Za-z_]\w*)(\([^)]*\))?\s*(.*)$/))){
      const params=m[2]?m[2].slice(1,-1).split(',').map(s=>s.trim()).filter(Boolean):null;
      let body=m[3].replace(/\/\/.*$/,'').replace(/\/\*.*?\*\//g,'').trim();
      defines.set(m[1],{params,body,line:ln}); return; }
    if(/^(pragma|ifndef|ifdef|endif|else|undef|if|elif|error|line)\b/.test(d)) return;
    if(d==='') return;
    throw cerr(`Неизвестная директива препроцессора #${d.split(/\s/)[0]}`,ln,'E2109');
  }
  function expandMacro(name){
    const m=defines.get(name);
    let body=m.body;
    if(m.params){
      // читаем аргументы F(a,b)
      while(i<n&&/\s/.test(src[i])){ if(src[i]==='\n') line++; i++; }
      if(src[i]!=='('){ push('id',name); return; }
      let depth=0, cur='', args=[]; i++;
      while(i<n){ const ch=src[i]; if(ch==='('){ depth++; cur+=ch; } else if(ch===')'){ if(depth===0) break; depth--; cur+=ch; }
        else if(ch===','&&depth===0){ args.push(cur); cur=''; } else { if(ch==='\n') line++; cur+=ch; } i++; }
      i++; args.push(cur);
      m.params.forEach((p,k)=>{ body=body.replace(new RegExp('\\b'+p+'\\b','g'),'('+(args[k]||'').trim()+')'); });
    }
    const sub=lex(body);
    sub.toks.pop();
    for(const t of sub.toks){ t.line=line; toks.push(t); }
  }
}
CPP.lex=lex;

/* ---------------- Типы ---------------- */
const T={
  prim:(n)=>({k:'p',n}),
  arr:(of,n)=>({k:'arr',of,n}),
  ptr:(to)=>({k:'ptr',to}),
  ref:(to)=>({k:'ref',to}),
  cls:(name)=>({k:'cls',name}),
  str:(ansi)=>({k:'str',ansi:!!ansi}),
  enm:(name)=>({k:'enum',name}),
};
CPP.T=T;
const PRIMS=new Set(['int','char','short','long','unsigned','signed','float','double','bool','void']);

/* ---------------- Парсер ---------------- */
function parse(src){
  const L=lex(src);
  const toks=L.toks; let p=0;
  const typeNames=new Map([['string',{k:'str'}],['AnsiString',{k:'str',ansi:true}],['String',{k:'str',ansi:true}],
    ['ostream',{k:'p',n:'ostream'}],['istream',{k:'p',n:'istream'}],['FILE',{k:'p',n:'FILE'}],['size_t',{k:'p',n:'uint'}],
    ['TDateTime',{k:'p',n:'double'}],['HANDLE',{k:'p',n:'int'}],['TScrollCode',{k:'p',n:'int'}],['TMouseButton',{k:'p',n:'int'}],['TCloseAction',{k:'p',n:'int'}],['WORD',{k:'p',n:'ushort'}],['TModalResult',{k:'p',n:'int'}],['DWORD',{k:'p',n:'uint'}],['BOOL',{k:'p',n:'int'}],['TColor',{k:'p',n:'int'}],['Byte',{k:'p',n:'uchar'}],['Word',{k:'p',n:'ushort'}]]);
  const classNames=new Set(), classDefs=[], enumDefs=[];
  const peek=(o=0)=>toks[Math.min(p+o,toks.length-1)];
  const next=()=>toks[p++];
  const is=(v,o=0)=>{ const t=peek(o); return (t.t==='op'||t.t==='kw')&&t.v===v; };
  const accept=(v)=>{ if(is(v)){ p++; return true; } return false; };
  const lineOf=()=>peek().line;
  function expect(v,what){
    if(is(v)){ return next(); }
    const t=peek();
    const shown=t.t==='eof'?'конец программы':`«${t.v}»`;
    // типичная ошибка — пропущенная ;
    if(v===';'&&t.v==='{'&&toks[p-1]&&toks[p-1].v===')') throw cerr('Пропущена «;» после «)» — похоже, внутри функции написана ещё одна функция (строка вида «void … (…) {»). Так нельзя: функции пишут одну за другой, не вкладывая. Если Builder уже создал пустой обработчик — вставь внутрь его { } только строки кода, без заголовка, или удали пустую заготовку и вставь функцию целиком на её место',toks[p-1].line,'E2379');
    if(v===';'){ const prev=toks[p-1]; throw cerr(`Пропущена точка с запятой «;» ${prev?'после «'+prev.v+'»':''}`,prev?prev.line:t.line,'E2379'); }
    if(v==='}') throw cerr(`Ожидалась «}», а встретилось ${shown}. Проверь, все ли фигурные скобки закрыты`,t.line,'E2134');
    throw cerr(`Ожидалось «${v}»${what?' ('+what+')':''}, а встретилось ${shown}`,t.line,'E2188');
  }
  function ident(what){
    const t=peek(); if(t.t==='id'){ p++; return t.v; }
    throw cerr(`Ожидалось имя${what?' '+what:''}, а встретилось «${t.v||'конец программы'}»`,t.line,'E2040');
  }
  function skipStd(){ let s=false; while(peek().t==='id'&&peek().v==='std'&&is('::',1)){ p+=2; s=true; } return s; }

  // --- типы ---
  function isTypeStart(o=0){
    let t=peek(o);
    if(t.t==='id'&&t.v==='std'&&is('::',o+1)) t=peek(o+2);
    if(t.t==='kw') return PRIMS.has(t.v)||['const','static','struct','class','enum','inline','virtual','extern','register','volatile','auto','typename','friend'].includes(t.v);
    if(t.t==='id') return typeNames.has(t.v)||classNames.has(t.v);
    return false;
  }
  function declSpec(){
    const s={const:false,static:false,virtual:false,inline:false,friend:false,typedef:false};
    let words=[], base=null;
    while(true){
      skipStd();
      const t=peek();
      if(t.t==='kw'){
        if(t.v==='const'||t.v==='volatile'){ p++; if(t.v==='const') s.const=true; continue; }
        if(t.v==='static'){ p++; s.static=true; continue; }
        if(t.v==='virtual'){ p++; s.virtual=true; continue; }
        if(t.v==='inline'||t.v==='extern'||t.v==='register'||t.v==='auto'||t.v==='typename'||t.v==='__fastcall'){ p++; s.inline=s.inline||t.v==='inline'; continue; }
        if(t.v==='friend'){ p++; s.friend=true; continue; }
        if(t.v==='typedef'){ p++; s.typedef=true; continue; }
        if(PRIMS.has(t.v)){ words.push(t.v); p++; continue; }
        if((t.v==='struct'||t.v==='class'||t.v==='enum')&&!base&&!words.length){
          if(peek(1).t==='id'&&!is('{',2)&&!is(':',2)){ p++; const nm=next().v; base=t.v==='enum'?T.enm(nm):T.cls(nm); continue; }
          if(t.v==='enum'){ base=parseEnum(); continue; }
          base=parseClass(); continue;
        }
        break;
      }
      if(t.t==='id'&&!base&&!words.length){
        if(classNames.has(t.v)&&!is('::',1)){ p++; base=T.cls(t.v); continue; }
        if(classNames.has(t.v)&&is('::',1)&&peek(2).t==='id'&&typeNames.has(t.v+'::'+peek(2).v)){ p+=3; base=typeNames.get(t.v+'::'+toks[p-1].v); continue; }
        if(typeNames.has(t.v)){ p++; base=Object.assign({},typeNames.get(t.v)); continue; }
      }
      break;
    }
    if(!base){
      if(!words.length){
        if(toks[p-1]&&toks[p-1].v==='auto') throw cerr('auto для автоматического типа — это C++11, в C++Builder 6 его нет. Укажи тип явно: int, double, char…',toks[p-1].line,'E2141');
        if(s.const||s.static) throw cerr(`После ${s.const?'const':'static'} нужен тип, например: ${s.const?'const':'static'} int x = 5;`,lineOf(),'E2141');
        return null;
      }
      base=T.prim(primFromWords(words));
    }
    if(s.const) base=Object.assign({},base,{c:true});
    s.t=base; return s;
  }
  function primFromWords(w){
    const has=x=>w.includes(x), cnt=x=>w.filter(y=>y===x).length;
    if(has('void')) return 'void';
    if(has('bool')) return 'bool';
    if(has('float')) return 'float';
    if(has('double')) return has('long')?'ldouble':'double';
    if(has('char')) return has('unsigned')?'uchar':'char';
    if(has('short')) return has('unsigned')?'ushort':'short';
    if(has('long')) return has('unsigned')?'ulong':(cnt('long')>1?'llong':'long');
    return has('unsigned')?'uint':'int';
  }
  // декларатор: * & имя [N] (параметры)
  function declarator(base, opts={}){
    let t=base;
    while(true){
      if(accept('*')){ t=T.ptr(t); while(is('const')){ p++; t=Object.assign({},t,{c:true}); } continue; }
      if(accept('&')){ t=T.ref(t); continue; }
      if(is('__fastcall')){ p++; continue; }
      break;
    }
    let name=null, qual=null, line=lineOf(), isDtor=false, isOp=null;
    if(peek().t==='id'){
      name=next().v;
      if(is('::')){ // Класс::метод
        p++; qual=name;
        if(accept('~')){ isDtor=true; name='~'+ident('деструктора'); }
        else if(is('operator')){ p++; isOp=opName(); name='operator'+isOp; }
        else name=ident('члена класса');
      }
    } else if(is('operator')){ p++; isOp=opName(); name='operator'+isOp; }
    else if(is('(')&&is('*',1)){ // указатель на функцию — не поддерживаем
      throw cerr('Указатели на функции в этом тренажёре не поддерживаются',lineOf());
    } else if(!opts.abstract) {
      throw cerr(`Ожидалось имя переменной, а встретилось «${peek().v||'конец программы'}»`,lineOf(),'E2040');
    }
    // функция?
    if(is('(')&&(opts.allowFunc!==false)&&looksLikeParams()){
      p++; const params=paramList();
      let isConst=false; if(accept('const')) isConst=true;
      return {name,qual,ret:t,params,isFunc:true,line,isConst,isDtor,isOp};
    }
    const dims=[];
    while(accept('[')){ if(is(']')){ dims.push(null); } else dims.push(expr()); expect(']'); }
    for(let k=dims.length-1;k>=0;k--) t=T.arr(t,dims[k]);
    return {name,qual,t,line};
  }
  function opName(){
    const t=next();
    if(t.v==='('){ expect(')'); return '()'; }
    if(t.v==='['){ expect(']'); return '[]'; }
    if((t.v==='new'||t.v==='delete')) return ' '+t.v;
    return t.v;
  }
  function looksLikeParams(){
    // ( ) или ( тип ... ) или ( void ) — иначе это вызов конструктора Dog d("x")
    if(is(')',1)) return true;
    const save=p; p++;
    const r=isTypeStart()||is('...');
    p=save; return r;
  }
  function paramList(){
    const ps=[];
    if(accept(')')) return ps;
    if(is('void')&&is(')',1)){ p+=2; return ps; }
    while(true){
      if(accept('...')){ ps.push({name:null,t:T.prim('int'),vararg:true}); break; }
      const ds=declSpec(); if(!ds) throw cerr(`Ожидался тип параметра, а встретилось «${peek().v}»`,lineOf(),'E2293');
      let d;
      if(is(',')||is(')')||is('=')) d={name:null,t:ds.t};
      else d=declarator(ds.t,{abstract:true,allowFunc:false});
      let t=d.t; if(t.k==='arr') t=T.ptr(t.of); // массив-параметр = указатель
      const prm={name:d.name,t};
      if(accept('=')) prm.def=assignExpr();
      ps.push(prm);
      if(accept(',')) continue;
      break;
    }
    expect(')');
    return ps;
  }

  // --- верхний уровень ---
  function program(){
    const decls=[];
    while(peek().t!=='eof'){
      if(accept(';')) continue;
      decls.push(...topDecl());
    }
    return {k:'prog',decls,headers:L.headers,defines:L.defines};
  }
  function topDecl(){
    const line=lineOf();
    if(is('using')){ p++; if(accept('namespace')){ const nm=ident('пространства имён'); expect(';'); return [{k:'using',name:nm,line}]; }
      skipStd(); ident(); expect(';'); return []; }
    if(is('namespace')){ throw cerr('Свои namespace в тренажёре не нужны — пиши без них',line); }
    if(is('template')) throw cerr('Шаблоны (template) в курсе не проходят и в тренажёре не поддерживаются',line);
    // конструктор/деструктор вне класса: Book::Book(...) / Book::~Book()
    if(peek().t==='id'&&classNames.has(peek().v)&&is('::',1)&&((peek(2).t==='id'&&peek(2).v===peek().v)||is('~',2))){
      const cls=next().v; p++; let isDtor=false; if(accept('~')) isDtor=true; const nm=ident();
      expect('('); const params=paramList();
      const f={k:'func',name:isDtor?'~'+nm:nm,cls,ret:T.prim('void'),params,isCtor:!isDtor,isDtor,line};
      if(accept(';')) return [];
      if(accept(':')) f.inits=ctorInits();
      f.body=block(); return [f];
    }
    // main() без типа (старый стиль C)
    if(peek().t==='id'&&!isTypeStart()&&is('(',1)){
      const nm=next().v; expect('('); const params=paramList();
      if(accept(';')) return [];
      return [{k:'func',name:nm,ret:T.prim('int'),params,body:block(),line,implicitInt:true}];
    }
    const ds=declSpec();
    if(!ds) throw cerr(`Непонятная конструкция: «${peek().v}». Вне функций можно объявлять только переменные, функции и классы`,line,'E2141');
    if(accept(';')) return ds.t.k==='cls'||ds.t.k==='enum'?[]:[]; // class X {...};
    if(ds.typedef){ const d=declarator(ds.t,{allowFunc:false}); typeNames.set(d.name,d.t); expect(';'); return []; }
    const out=[];
    while(true){
      const d=declarator(ds.t);
      if(d.isFunc){
        const f={k:'func',name:d.name,cls:d.qual,ret:d.ret,params:d.params,line:d.line,isConst:d.isConst,static:ds.static,isOp:d.isOp};
        if(is('{')){ f.body=block(); out.push(f); return out; }
        f.proto=true; out.push(f);
      } else {
        out.push(varItem(d,ds,true));
      }
      if(accept(',')) continue;
      expect(';'); return out;
    }
  }
  function varItem(d,ds,global){
    const v={k:'var',name:d.name,cls:d.qual,t:d.t,line:d.line,static:ds.static,global:!!global};
    if(accept('=')){
      if(is('{')) v.init=initList(); else v.init=assignExpr();
    } else if(is('(')){ // Dog d("Rex"); int x(5);
      p++; v.ctorArgs=[]; if(!accept(')')){ do{ v.ctorArgs.push(assignExpr()); }while(accept(',')); expect(')'); }
    }
    return v;
  }
  function initList(){
    const line=lineOf(); expect('{'); const items=[];
    while(!is('}')){ items.push(is('{')?initList():assignExpr()); if(!accept(',')) break; }
    expect('}'); return {k:'ilist',items,line};
  }
  function parseEnum(){
    const line=lineOf(); expect('enum'); let name=null; if(peek().t==='id') name=next().v;
    expect('{'); const items=[];
    while(!is('}')){ const nm=ident('элемента enum'); let val=null; if(accept('=')) val=condExpr(); items.push({name:nm,val}); if(!accept(',')) break; }
    expect('}');
    const t=T.enm(name||'(enum)'); t.decl={k:'enum',name,items,line};
    if(name) typeNames.set(name,t);
    enumDefs.push(t.decl);
    return t;
  }
  function parseClass(){
    const line=lineOf(); const kw=next().v; // class/struct
    const name=ident('класса'); classNames.add(name);
    const def={k:'class',name,isStruct:kw==='struct',bases:[],fields:[],methods:[],line,statics:[],props:[],enums:[]};
    if(accept(':')){
      do{ let acc=kw==='struct'?'public':'private', virt=false;
        while(is('public')||is('private')||is('protected')||is('virtual')){ const w=next().v; if(w==='virtual') virt=true; else acc=w; }
        skipStd(); const b=ident('базового класса');
        if(!classNames.has(b)&&!CPP.VCL_BASES?.has(b)) throw cerr(`Базовый класс «${b}» не объявлен выше`,line,'E2303');
        def.bases.push({name:b,access:acc,virtual:virt}); }while(accept(','));
    }
    if(!is('{')){ expect(';'); return T.cls(name); } // предварительное объявление
    expect('{');
    let access=kw==='struct'?'public':'private';
    while(!is('}')){
      if(peek().t==='eof') throw cerr(`Класс ${name} не закрыт — нет «};»`,line,'E2134');
      if((is('public')||is('private')||is('protected')||is('__published'))&&is(':',1)){ access=next().v; if(access==='__published') access='public'; p++; continue; }
      if(accept(';')) continue;
      const ml=lineOf();
      if(is('__property')){ p++; def.props.push(parseProperty(access)); continue; }
      if(is('enum')){ const et=parseEnum(); def.enums.push(et.decl); expect(';'); continue; }
      // конструктор / деструктор
      let virt=false; if(is('virtual')&&(is('~',1))){ p++; virt=true; }
      if((peek().t==='id'&&peek().v===name&&is('(',1))||(is('explicit')&&false)){
        p++; expect('('); const params=paramList();
        const m={k:'func',name,cls:name,ret:T.prim('void'),params,isCtor:true,access,line:ml};
        if(accept(':')) m.inits=ctorInits();
        if(is('{')) m.body=block(); else { expect(';'); m.proto=true; }
        def.methods.push(m); continue;
      }
      if(is('~')&&peek(1).t==='id'&&peek(1).v===name){
        p+=2; expect('('); expect(')');
        const m={k:'func',name:'~'+name,cls:name,ret:T.prim('void'),params:[],isDtor:true,access,line:ml,virtual:virt};
        if(is('{')) m.body=block(); else { expect(';'); m.proto=true; }
        def.methods.push(m); continue;
      }
      const ds=declSpec();
      if(!ds) throw cerr(`Непонятный член класса ${name}: «${peek().v}»`,ml,'E2141');
      if(ds.friend){ // friend-объявление пропускаем до ; или тела
        let depth=0; while(peek().t!=='eof'){ if(is('{')) depth++; if(is('}')){ if(depth===0) break; depth--; if(depth===0){ p++; break; } } if(is(';')&&depth===0){ p++; break; } p++; }
        continue; }
      while(true){
        const d=declarator(ds.t);
        if(d.isFunc){
          const m={k:'func',name:d.name,cls:name,ret:d.ret,params:d.params,access,line:d.line,virtual:ds.virtual,static:ds.static,isConst:d.isConst,isOp:d.isOp};
          if(accept('=')){ const z=next(); if(z.v!==0) throw cerr('После «=» у метода может быть только 0 (чистая виртуальная функция)',ml); m.pure=true; m.virtual=true; }
          if(is('{')){ m.body=block(); def.methods.push(m); break; }
          m.proto=true; def.methods.push(m);
        } else {
          const f={name:d.name,t:d.t,access,line:d.line,static:ds.static};
          if(accept('=')) f.init=is('{')?initList():assignExpr();
          if(ds.static) def.statics.push(f); else def.fields.push(f);
        }
        if(accept(',')) continue;
        expect(';'); break;
      }
    }
    expect('}');
    classDefs.push(def);
    const t=T.cls(name); t.decl=def; return t;
  }
  function parseProperty(access){
    // __property int Age = {read=FAge, write=SetAge};
    const line=lineOf(); const ds=declSpec(); const d=declarator(ds.t,{allowFunc:false});
    expect('='); expect('{'); const pr={name:d.name,t:d.t,access,line};
    while(!is('}')){ const key=ident(); expect('='); const val=ident(); pr[key]=val; if(!accept(',')) break; }
    expect('}'); expect(';'); return pr;
  }
  function ctorInits(){
    const inits=[];
    do{ const line=lineOf(); const nm=ident('поля в списке инициализации'); expect('('); const args=[]; if(!accept(')')){ do{ args.push(assignExpr()); }while(accept(',')); expect(')'); }
      inits.push({name:nm,args,line}); }while(accept(','));
    return inits;
  }

  // --- операторы ---
  function block(){
    const line=lineOf(); expect('{'); const body=[];
    while(!is('}')){ if(peek().t==='eof') throw cerr('Не хватает закрывающей «}» — блок не закрыт',line,'E2134'); body.push(stmt()); }
    expect('}'); return {k:'block',body,line};
  }
  function stmt(){
    skipStd();
    const t=peek(), line=t.line;
    if(is('{')) return block();
    if(accept(';')) return {k:'empty',line};
    if(t.t==='kw'){
      switch(t.v){
        case 'if':{ p++; expect('(','условие if'); const c=expr(); expect(')'); const a=stmt(); let b=null; if(accept('else')) b=stmt(); return {k:'if',c,a,b,line}; }
        case 'while':{ p++; expect('(','условие while'); const c=expr(); expect(')'); return {k:'while',c,body:stmt(),line}; }
        case 'do':{ p++; const body=stmt(); if(!is('while')) throw cerr('После тела do { … } должно идти while(условие);',lineOf(),'E2054'); p++; expect('('); const c=expr(); expect(')'); expect(';'); return {k:'do',c,body,line}; }
        case 'for':{ p++; expect('(','после for'); let init=null;
          if(!is(';')){ if(isTypeStart()) init=localDecl(); else { init={k:'expr',e:expr(),line}; expect(';'); } } else p++;
          const c=is(';')?null:expr(); expect(';','в заголовке for нужны две «;»');
          const step=is(')')?null:expr(); expect(')');
          return {k:'for',init,c,step,body:stmt(),line}; }
        case 'switch':{ p++; expect('('); const c=expr(); expect(')'); const body=stmt(); return {k:'switch',c,body,line}; }
        case 'case':{ p++; const v=condExpr(); expect(':','после case'); return {k:'case',v,line}; }
        case 'default':{ p++; expect(':','после default'); return {k:'default',line}; }
        case 'break': p++; expect(';'); return {k:'break',line};
        case 'continue': p++; expect(';'); return {k:'continue',line};
        case 'return':{ p++; let e=null; if(!is(';')) e=expr(); expect(';'); return {k:'return',e,line}; }
        case 'goto':{ p++; const lb=ident('метки'); expect(';'); return {k:'goto',label:lb,line}; }
        case 'else': throw cerr('«else» без «if» — проверь скобки и точку с запятой перед else',line,'E2054');
      }
    }
    if(t.t==='id'&&is(':',1)&&!is('::',1)){ p+=2; return {k:'label',name:t.v,line,s:is('}')?{k:'empty',line}:stmt()}; }
    if(isTypeStart()&&!(peek().t==='id'&&(is('(',1)||is('::',1)||is('.',1)||is('->',1)))) return localDecl();
    const e=expr(); expect(';'); return {k:'expr',e,line};
  }
  function localDecl(){
    const line=lineOf(); const ds=declSpec();
    if(!ds) throw cerr(`Непонятное объявление: «${peek().v}»`,line,'E2141');
    if(accept(';')) return {k:'empty',line};
    if(ds.typedef){ const d=declarator(ds.t,{allowFunc:false}); typeNames.set(d.name,d.t); expect(';'); return {k:'empty',line}; }
    const items=[];
    while(true){
      const d=declarator(ds.t);
      if(d.isFunc){ items.push({k:'proto',line}); }
      else items.push(varItem(d,ds,false));
      if(accept(',')) continue;
      expect(';'); break;
    }
    return {k:'decl',items,line};
  }

  // --- выражения ---
  function expr(){ let e=assignExpr(); while(is(',')){ const line=lineOf(); p++; e={k:'comma',a:e,b:assignExpr(),line}; } return e; }
  const ASSIGN=new Set(['=','+=','-=','*=','/=','%=','<<=','>>=','&=','|=','^=']);
  function assignExpr(){
    const line=lineOf(); const a=condExpr();
    if(peek().t==='op'&&ASSIGN.has(peek().v)){ const op=next().v; const b=is('{')?initList():assignExpr(); return {k:'assign',op,a,b,line}; }
    return a;
  }
  function condExpr(){
    const line=lineOf(); const c=bin(0);
    if(accept('?')){ const a=expr(); expect(':','в операции ?: нужно двоеточие'); const b=assignExpr(); return {k:'cond',c,a,b,line}; }
    return c;
  }
  const LEVELS=[['||'],['&&'],['|'],['^'],['&'],['==','!='],['<','<=','>','>='],['<<','>>'],['+','-'],['*','/','%']];
  function bin(lv){
    if(lv>=LEVELS.length) return unary();
    let a=bin(lv+1);
    while(peek().t==='op'&&LEVELS[lv].includes(peek().v)){ const line=lineOf(); const op=next().v; const b=bin(lv+1); a={k:'bin',op,a,b,line}; }
    return a;
  }
  function unary(){
    const t=peek(), line=t.line;
    if(t.t==='op'){
      if(t.v==='++'||t.v==='--'){ p++; return {k:'pre',op:t.v,a:unary(),line}; }
      if(['+','-','!','~','*','&'].includes(t.v)){ p++; return {k:'un',op:t.v,a:unary(),line}; }
      if(t.v==='('&&isCastAhead()){ p++; const tt=typeName(); expect(')'); return {k:'cast',t:tt,a:unary(),line}; }
    }
    if(t.t==='kw'){
      if(t.v==='sizeof'){ p++;
        if(is('(')&&(()=>{ const s=p; p++; const r=isTypeStart(); p=s; return r; })()){ p++; const tt=typeName(); expect(')'); return {k:'sizeof',t:tt,line}; }
        return {k:'sizeof',a:unary(),line}; }
      if(t.v==='new'){ p++; const ds=declSpec(); if(!ds) throw cerr('После new нужен тип',line); let tt=ds.t; while(accept('*')) tt=T.ptr(tt);
        if(accept('[')){ const n=expr(); expect(']'); return {k:'new',t:tt,n,line}; }
        let args=null; if(accept('(')){ args=[]; if(!accept(')')){ do{ args.push(assignExpr()); }while(accept(',')); expect(')'); } }
        return {k:'new',t:tt,args,line}; }
      if(t.v==='delete'){ p++; let arr=false; if(is('[')){ p++; expect(']'); arr=true; } return {k:'delete',a:unary(),arr,line}; }
    }
    return postfix(primary());
  }
  function isCastAhead(){
    // ( тип ) выражение
    const s=p; p++;
    let ok=false;
    if(isTypeStart()){ const save=p; try{ typeName(); ok=is(')'); }catch(e){ ok=false; } p=save; }
    p=s; return ok;
  }
  function typeName(){
    const ds=declSpec(); if(!ds) throw cerr('Ожидался тип',lineOf());
    let t=ds.t; while(true){ if(accept('*')){ t=T.ptr(t); continue; } if(accept('&')){ t=T.ref(t); continue; } break; }
    while(accept('[')){ const n=is(']')?null:expr(); expect(']'); t=T.arr(t,n); }
    return t;
  }
  function postfix(e){
    while(true){
      const line=lineOf();
      if(accept('(')){ const args=[]; if(!accept(')')){ do{ args.push(assignExpr()); }while(accept(',')); expect(')','закрывающая скобка вызова'); } e={k:'call',f:e,args,line}; continue; }
      if(accept('[')){ const i=expr(); expect(']'); e={k:'idx',a:e,i,line}; continue; }
      if(is('.')||is('->')){ const arrow=next().v==='->'; let name;
        if(accept('~')) name='~'+ident(); else if(is('operator')){ p++; name='operator'+opName(); } else name=ident('члена после «'+(arrow?'->':'.')+'»');
        e={k:'mem',a:e,name,arrow,line}; continue; }
      if(is('++')||is('--')){ e={k:'post',op:next().v,a:e,line}; continue; }
      return e;
    }
  }
  function primary(){
    const stdq=skipStd();
    const t=peek(), line=t.line;
    if(stdq&&t.t==='id'&&!is('::',1)&&!is('(',1)){ p++; return {k:'id',name:t.v,line,std:true}; }
    if(stdq&&t.t==='id'&&is('(',1)&&!classNames.has(t.v)&&!typeNames.has(t.v)){ p++; return {k:'id',name:t.v,line,std:true}; }
    if(t.t==='num'){ p++; return {k:'num',v:t.v,nt:t.nt,raw:t.raw,line}; }
    if(t.t==='str'){ p++; return {k:'str',v:t.v,line}; }
    if(t.t==='chr'){ p++; return t.v.length>1?{k:'num',v:[...t.v].reduce((a,c)=>a*256+c.charCodeAt(0),0),nt:'int',line}:{k:'chr',v:t.v,line}; }
    if(t.t==='kw'){
      if(t.v==='true'||t.v==='false'){ p++; return {k:'bool',v:t.v==='true'?1:0,line}; }
      if(t.v==='NULL'){ p++; return {k:'null',line}; }
      if(t.v==='nullptr') throw cerr('nullptr — это C++11, в C++Builder 6 его нет. Пиши NULL или 0',line,'E2451');
      if(t.v==='this'){ p++; return {k:'this',line}; }
      if(t.v==='static_cast'){ p++; expect('<'); const tt=typeName(); expect('>'); expect('('); const a=expr(); expect(')'); return {k:'cast',t:tt,a,line}; }
      if(PRIMS.has(t.v)&&is('(',1)){ const tt=T.prim(primFromWords([next().v])); p++; const a=is(')')?{k:'num',v:0,nt:'int',line}:expr(); expect(')'); return {k:'cast',t:tt,a,line,fn:true}; }
    }
    if(accept('(')){ const e=expr(); expect(')','закрывающая скобка'); return e; }
    if(is('::')&&peek(1).t==='id'){ p++; return {k:'gscope',name:next().v,line}; }
    if(t.t==='id'){
      p++;
      if(is('::')){ p++; let name; if(accept('~')) name='~'+ident(); else name=ident(); return {k:'scope',cls:t.v,name,line}; }
      if(typeNames.has(t.v)&&typeNames.get(t.v).k==='str'&&is('(')){ // string("abc")
        p++; const args=[]; if(!accept(')')){ do{ args.push(assignExpr()); }while(accept(',')); expect(')'); }
        return {k:'ctor',t:typeNames.get(t.v),args,line}; }
      if(classNames.has(t.v)&&is('(')){ p++; const args=[]; if(!accept(')')){ do{ args.push(assignExpr()); }while(accept(',')); expect(')'); }
        return {k:'ctor',t:T.cls(t.v),args,line}; }
      return {k:'id',name:t.v,line};
    }
    if(t.t==='eof') throw cerr('Программа оборвалась посреди выражения',line,'E2188');
    throw cerr(`Ожидалось выражение, а встретилось «${t.v}»`,line,'E2188');
  }

  if(CPP.VCL_TYPES) for(const [k,v] of CPP.VCL_TYPES) { classNames.add(k); }
  const prog=program();
  prog.classNames=classNames; prog.classDefs=classDefs; prog.enumDefs=enumDefs;
  return prog;
}
CPP.parse=parse;
})(typeof window!=='undefined'?window:globalThis);
