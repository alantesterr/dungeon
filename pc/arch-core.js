/* ядро учебного сайта автора: EWB-окна, калькуляторы тем 1–9, ассемблер. Перенесено как есть (без разметки страниц). */
/* ======================= Программы для симулятора ======================= */
const PROGS = {
out2:`INCLUDE Irvine32.inc

.data
    a DWORD 10
    b DWORD 20
    ce DWORD 30         ; не c: C зарезервировано в MASM

.code
main PROC
    mov eax, a
    call WriteDec
    call Crlf

    mov eax, b
    call WriteDec
    call Crlf

    mov eax, ce
    call WriteDec
    call Crlf

    exit
main ENDP
END main`,
out3:`INCLUDE Irvine32.inc

.data
    num DWORD 100
    neg5 DWORD -5
    msg BYTE "Value = ",0

.code
main PROC
    mov edx, OFFSET msg   ; EDX = адрес строки
    call WriteString      ; печатаем "Value = "
    mov eax, num          ; EAX = 100
    call WriteDec
    call Crlf

    mov eax, neg5         ; EAX = FFFFFFFBh (−5)
    call WriteInt         ; со знаком: -5
    call Crlf
    call WriteDec         ; без знака: 4294967291
    call Crlf
    exit
main ENDP
END main`,
ctrl:`INCLUDE Irvine32.inc

.data
    A  DB -120          ; байт 88h
    B  DB -30           ; байт E2h
    C1 DW +500          ; слово 01F4h (имя C зарезервировано!)
    S  DW 0             ; сюда положим ответ

.code
main PROC
    xor eax, eax        ; EAX = 0 — убираем мусор
    xor ebx, ebx        ; EBX = 0

    mov al, A           ; AL = 88h (−120)
    cbw                 ; AX = FF88h — знак расширен
    mov bx, ax          ; BX = FF88h

    mov al, B           ; AL = E2h (−30)
    cbw                 ; AX = FFE2h
    add bx, ax          ; BX = FF6Ah (−150)

    add bx, C1          ; BX = 015Eh (+350)
    mov S, bx           ; S = 350

    call DumpRegs       ; печать регистров
    exit
main ENDP
END main`,
cisc:`.model small
.stack 100h
.data
    A DB -25
    B DB 40
    C DW -1000
    S DW ?
.code
main PROC
    mov ax, @data
    mov ds, ax

    mov al, A
    cbw
    mov bx, ax

    mov al, B
    cbw
    add bx, ax

    add bx, C
    mov S, bx

    mov ax, 4C00h
    int 21h
main ENDP
END main`,
l1:`INCLUDE Irvine32.inc
.data
    A   DB 25
    B   DB 40
    Sum DW 0
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    mov al, A        ; AL = 19h (25)
    mov ah, 0        ; AX = 0019h — беззнаковое расширение
    mov bx, ax       ; BX = 0019h
    mov al, B        ; AL = 28h (40)
    mov ah, 0        ; AX = 0028h
    add bx, ax       ; BX = 0041h = 65
    mov Sum, bx      ; Sum = 65
    call DumpRegs
    exit
main ENDP
END main`,
l2:`INCLUDE Irvine32.inc
.data
    X DB 50
    Y DW 300
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    mov al, X        ; AL = 32h (50)
    mov ah, 0        ; AX = 0032h
    mov bx, Y        ; BX = 012Ch (300)
    sub bx, ax       ; BX = 00FAh (250)
    mov Y, bx        ; Y = 250
    call DumpRegs
    exit
main ENDP
END main`,
l3:`INCLUDE Irvine32.inc
.data
    A      DB -15     ; F1h
    B      DB -30     ; E2h
    Result DW 0
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    mov al, A        ; AL = F1h
    cbw              ; AX = FFF1h (−15)
    mov bx, ax       ; BX = FFF1h
    mov al, B        ; AL = E2h
    cbw              ; AX = FFE2h (−30)
    add bx, ax       ; BX = FFD3h (−45)
    mov Result, bx
    call DumpRegs
    exit
main ENDP
END main`,
l4:`INCLUDE Irvine32.inc
.data
    A   DB 80
    B   DB 35
    C1  DW 120       ; не C!
    Res DW 0
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    mov al, A        ; AL = 50h (80)
    mov ah, 0        ; AX = 0050h
    mov bx, ax       ; BX = 0050h
    mov al, B        ; AL = 23h (35)
    mov ah, 0        ; AX = 0023h
    sub bx, ax       ; BX = 002Dh (45)
    add bx, C1       ; BX = 00A5h (165)
    mov Res, bx
    call DumpRegs
    exit
main ENDP
END main`,
l5:`INCLUDE Irvine32.inc
.data
    N1       DW 60000     ; EA60h
    N2       DW 10000     ; 2710h
    Sum16    DW 0
    Overflow DB 0
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    xor edx, edx
    mov ax, N1       ; AX = EA60h
    add ax, N2       ; AX = 1170h, CF = 1 — перенос!
    mov dl, 0        ; MOV не трогает CF
    adc dl, 0        ; DL = 0 + 0 + CF = 1
    mov Overflow, dl
    mov Sum16, ax
    mov bl, dl       ; EBX = 00000001
    shl ebx, 16      ; EBX = 00010000
    mov bx, ax       ; EBX = 00011170h = 70000
    call DumpRegs
    exit
main ENDP
END main`,
l6:`INCLUDE Irvine32.inc
.data
    Num1_Low  DW 40000   ; 9C40h
    Num1_High DW 1
    Num2_Low  DW 30000   ; 7530h
    Num2_High DW 0
    Res_Low   DW 0
    Res_High  DW 0
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    xor edx, edx
    mov ax, Num1_Low     ; AX = 9C40h
    add ax, Num2_Low     ; AX = 1170h, CF = 1
    mov Res_Low, ax      ; MOV не портит CF
    mov dx, Num1_High    ; DX = 0001
    adc dx, Num2_High    ; DX = 1 + 0 + CF = 2
    mov Res_High, dx
    mov bx, dx           ; EBX = 00000002
    shl ebx, 16          ; EBX = 00020000
    mov bx, ax           ; EBX = 00021170h = 135536
    call DumpRegs
    exit
main ENDP
END main`,
l7:`INCLUDE Irvine32.inc
.data
    A  DW 65000      ; FDE8h
    B  DW 65000
    C1 DW 65000      ; не C!
    Res_Low  DW 0
    Res_High DW 0
.code
main PROC
    xor eax, eax
    xor ebx, ebx
    xor edx, edx
    mov ax, A        ; AX = FDE8h
    add ax, B        ; AX = FBD0h, CF = 1
    adc dx, 0        ; DX = 1
    add ax, C1       ; AX = F9B8h, CF = 1
    adc dx, 0        ; DX = 2
    mov Res_Low, ax
    mov Res_High, dx
    mov bx, dx
    shl ebx, 16
    mov bx, ax       ; EBX = 0002F9B8h = 195000
    call DumpRegs
    exit
main ENDP
END main`,
lec9:`INCLUDE Irvine32.inc
.code
main PROC
    mov eax, 5       ; EAX = 5, флаги не меняются
    mov ebx, 3       ; EBX = 3
    add eax, ebx     ; EAX = 8, ZF = 0
    sub eax, 8       ; EAX = 0, ZF = 1
    call DumpRegs
    exit
main ENDP
END main`,
p51:`.model small
.stack 100h
.code
start:
    mov ax, 5
    mov bx, 3
    mov cx, 10
    mov ch, al       ; CH ← AL — меняется старший байт CX
    mov al, cx       ; ошибка: 8 бит ← 16 бит. Исправь на mov al, cl
    mov ax, 4C00h
    int 21h
end start`,
p52:`.model small
.stack 100h
.code
start:
    mov ax, 7
    mov bx, 4
    add ax, bx       ; AX = 11 (000Bh)
    mov ax, 4C00h
    int 21h
end start`,
p53:`.model small
.stack 100h
.code
start:
    mov ax, 15
    mov bx, 6
    sub ax, bx       ; AX = 9, BX не меняется
    mov ax, 4C00h
    int 21h
end start`,
p54:`.model small
.stack 100h
.code
start:
    mov ax, 12       ; AX = 000Ch
    mov bx, ax       ; BX = 000Ch
    mov cx, bx       ; CX = 000Ch
    mov ax, 4C00h
    int 21h
end start`,
p61:`.model small
.stack 100h
.data
    a  db 20         ; беззнаковый байт  14h
    b  db -10        ; знаковый байт     F6h
    c1 dw 1000       ; беззнаковое слово 03E8h
    d  dw -200       ; знаковое слово    FF38h
    s  dw 0
.code
start:
    mov ax, @data
    mov ds, ax
    mov al, a
    mov ah, 0        ; беззнаковое расширение → 0014h
    mov bx, ax       ; BX = 20
    mov al, b
    cbw              ; знаковое расширение → FFF6h
    add bx, ax       ; BX = 10
    add bx, c1       ; BX = 1010
    add bx, d        ; BX = 810 (032Ah)
    mov s, bx
    mov ax, 4C00h
    int 21h
end start`,
p62:`.model small
.stack 100h
.data
    a  db 100        ; беззнаковый байт
    b  db -30        ; знаковый байт
    c1 dw 2000       ; беззнаковое слово
    d  dw -500       ; знаковое слово
    e  db 50         ; знаковый байт
    s  dw 0
.code
start:
    mov ax, @data
    mov ds, ax
    mov al, a
    mov ah, 0
    mov bx, ax       ; BX = 100
    mov al, b
    cbw
    add bx, ax       ; BX = 70
    add bx, c1       ; BX = 2070
    add bx, d        ; BX = 1570
    mov al, e
    cbw
    add bx, ax       ; BX = 1620 (0654h)
    mov s, bx
    mov ax, 4C00h
    int 21h
end start`,
p63:`.model small
.stack 100h
.data
    a  db -50        ; знаковый байт
    b  db 250        ; БЕЗзнаковый байт!
    c1 dw -1000      ; знаковое слово
    d  dw 5000       ; беззнаковое слово
    e  db 25         ; беззнаковый байт
    s  dw 0
.code
start:
    mov ax, @data
    mov ds, ax
    mov al, a
    cbw              ; a знаковый
    mov bx, ax       ; BX = −50
    mov al, b
    mov ah, 0        ; b беззнаковый — cbw дал бы −6!
    add bx, ax       ; BX = 200
    add bx, c1       ; BX = −800
    add bx, d        ; BX = 4200
    mov al, e
    mov ah, 0
    add bx, ax       ; BX = 4225 (1081h)
    mov s, bx
    mov ax, 4C00h
    int 21h
end start`,
p64:`.model small
.stack 100h
.data
    a  db 120        ; беззнаковый байт
    b  db -80        ; знаковый байт
    c1 dw 300        ; беззнаковое слово
    d  dw -1500      ; знаковое слово
    e  db 60         ; знаковый байт
    f  dw 10000      ; беззнаковое слово
    s  dw 0
.code
start:
    mov ax, @data
    mov ds, ax
    mov al, a
    mov ah, 0
    mov bx, ax       ; 120
    mov al, b
    cbw
    add bx, ax       ; 40
    add bx, c1       ; 340
    add bx, d        ; −1160
    mov al, e
    cbw
    add bx, ax       ; −1100
    add bx, f        ; 8900 (22C4h)
    mov s, bx
    mov ax, 4C00h
    int 21h
end start`,
p65:`.model small
.stack 100h
.data
    a  db 120        ; знаковый байт
    b  db 100        ; знаковый байт
    c1 db 250        ; беззнаковый байт
    d  dw -30000     ; знаковое слово
    e  dw 20000      ; знаковое слово
    s  dw 0
.code
start:
    mov ax, @data
    mov ds, ax
    mov al, a
    add al, b        ; (а) 8 бит: AL = DCh = −36?! смотри OF
    mov al, a
    cbw              ; (б) правильно: сначала расширяем
    mov bx, ax       ; 120
    mov al, b
    cbw
    add bx, ax       ; 220 — в 16 битах влезло
    mov al, c1
    mov ah, 0
    add bx, ax       ; 470
    add bx, d        ; −29530
    add bx, e        ; −9530 (DAC6h)
    mov s, bx
    mov ax, 4C00h
    int 21h
end start`,
p66:`.model small
.stack 100h
.data
    a      db 255       ; беззн. байт
    b      db -128      ; знак. байт
    c1     dw 32767     ; знак. слово
    d      dw 60000     ; беззн. слово
    e      dw -1000     ; знак. слово
    res_lo dw 0
    res_hi dw 0
.code
start:
    mov ax, @data
    mov ds, ax
    mov cx, 0           ; CX:BX — 32-битная сумма
    mov al, a
    mov ah, 0           ; AX = 00FFh
    mov bx, ax          ; CX:BX = 0000:00FF (255)
    mov al, b
    cbw                 ; AX = FF80h
    cwd                 ; DX = FFFFh (−128 в 32 битах)
    add bx, ax
    adc cx, dx          ; CX:BX = 0000:007F (127)
    mov ax, c1
    cwd                 ; DX = 0000
    add bx, ax
    adc cx, dx          ; CX:BX = 0000:807E (32894)
    add bx, d           ; беззнаковое: старшая часть 0
    adc cx, 0           ; CX:BX = 0001:6ADE (92894)
    mov ax, e
    cwd                 ; DX = FFFFh
    add bx, ax
    adc cx, dx          ; CX:BX = 0001:66F6 (91894)
    mov res_lo, bx
    mov res_hi, cx
    mov ax, 4C00h
    int 21h
end start`
};

/* ======================= Мини-эмулятор x86 ======================= */
const REGMAP = {};
['a','b','c','d'].forEach(x=>{
  REGMAP['e'+x+'x']={r:'e'+x+'x',p:'e',s:32};
  REGMAP[x+'x']={r:'e'+x+'x',p:'x',s:16};
  REGMAP[x+'h']={r:'e'+x+'x',p:'h',s:8};
  REGMAP[x+'l']={r:'e'+x+'x',p:'l',s:8};
});
['si','di','bp','sp'].forEach(x=>{REGMAP['e'+x]={r:'e'+x,p:'e',s:32};REGMAP[x]={r:'e'+x,p:'x',s:16};});
const RESERVED = new Set(['c','pascal','stdcall','basic','fortran','syscall','offset','ptr','byte','word','dword','proc','end']);
const SEGREGS = new Set(['ds','es','ss','cs','fs','gs']);
const TYPES = {db:1,byte:1,sbyte:1,dw:2,word:2,sword:2,dd:4,dword:4,sdword:4};
const P2 = b => Math.pow(2,b);
const norm = (v,b) => { const m=P2(b); return ((v % m) + m) % m; };
const signed = (v,b) => v >= P2(b-1) ? v - P2(b) : v;
const hx = (v,b) => norm(v,b).toString(16).toUpperCase().padStart(b/4,'0')+'h';
const hxr = (v,b) => norm(v,b).toString(16).toUpperCase().padStart(b/4,'0');
const decS = (v,b) => { const u=norm(v,b), s=signed(u,b); return s===u ? String(u) : (u+' / '+fmtNeg(s)); };
const fmtNeg = n => n<0 ? '−'+(-n) : String(n);
const parity = v => { let x=v&0xFF,c=0; while(x){c+=x&1;x>>=1;} return c%2===0 ? 1 : 0; };
const bin = (v,b) => norm(v,b).toString(2).padStart(b,'0').replace(/(.{4})(?=.)/g,'$1 ');
const TYPE_RU = {1:'байт · 8 бит',2:'слово · 16 бит',4:'двойное слово · 32 бита'};
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function parseNum(s){
  s=s.trim().replace(/^\+/,'');
  let neg=false; if(s.startsWith('-')){neg=true;s=s.slice(1).trim();}
  let v=null;
  if(/^[0-9][0-9a-f]*h$/i.test(s)) v=parseInt(s.slice(0,-1),16);
  else if(/^0x[0-9a-f]+$/i.test(s)) v=parseInt(s,16);
  else if(/^[01]+b$/i.test(s)) v=parseInt(s.slice(0,-1),2);
  else if(/^[0-9]+d?$/i.test(s)) v=parseInt(s,10);
  if(v===null||isNaN(v)) return null;
  return neg?-v:v;
}
function splitTop(s){ // split by commas outside quotes
  const out=[];let cur='',q=null;
  for(const ch of s){ if(q){cur+=ch; if(ch===q) q=null;} else if(ch==='"'||ch==="'"){q=ch;cur+=ch;} else if(ch===','){out.push(cur);cur='';} else cur+=ch; }
  if(cur.trim()!=='') out.push(cur); return out.map(x=>x.trim());
}
function stripComment(line){
  let q=null; for(let i=0;i<line.length;i++){const ch=line[i]; if(q){if(ch===q)q=null;} else if(ch==='"'||ch==="'") q=ch; else if(ch===';') return [line.slice(0,i), line.slice(i+1).trim()];}
  return [line,''];
}
function AsmError(line,msg,hint){ this.line=line; this.msg=msg; this.hint=hint||''; }

function assemble(src){
  const lines=src.replace(/\r/g,'').split('\n');
  const mode = /irvine32/i.test(src) ? 32 : 16;
  const mem=[]; const vars={}; const code=[]; let sec=null;
  for(let i=0;i<lines.length;i++){
    const [body,comment]=stripComment(lines[i]); const t=body.trim(); if(!t) continue;
    const low=t.toLowerCase();
    if(/^(include|\.model|\.stack|\.386|\.486|\.586|option|title)\b/.test(low)) continue;
    if(/^(stack|code)\b/.test(low)) throw new AsmError(i,`Syntax error: ${t.split(/\s+/)[0]}`,'Директива пишется с точкой: .stack / .code, а метка — с двоеточием: start:');
    if(low==='.data'){sec='data';continue;}
    if(low==='.code'){sec='code';continue;}
    if(/^end\b/.test(low)) break;
    if(/\bproc\b|\bendp\b/.test(low)) continue;
    if(/^[a-z_][\w]*:$/i.test(t)) continue;
    if(sec==='data'){
      const m=t.match(/^([a-z_@$?][\w@$?]*)\s+([a-z]+)\s+(.+)$/i);
      if(!m||!TYPES[m[2].toLowerCase()]) throw new AsmError(i,'Не понимаю строку данных','Формат: имя DB/DW/DWORD значение');
      const name=m[1], lname=name.toLowerCase(), size=TYPES[m[2].toLowerCase()];
      if(RESERVED.has(lname)) throw new AsmError(i,`Syntax error: ${name}`,`«${name}» — зарезервированное слово MASM${lname==='c'?' (соглашение о вызове языка C)':''}. Переименуй переменную, например в ${lname==='c'?'CE':name.toUpperCase()+'E'} — и в .data, и в коде, где она используется.`);
      if(REGMAP[lname]||SEGREGS.has(lname)) throw new AsmError(i,`Syntax error: ${name}`,`«${name}» — имя регистра, так называть переменную нельзя.`);
      if(vars[lname]) throw new AsmError(i,`Повторное объявление: ${name}`);
      const addr=mem.length; let count=0;
      for(const part of splitTop(m[3])){
        const sm=part.match(/^(["'])(.*)\1$/);
        if(sm){ if(size!==1) throw new AsmError(i,'Строка может быть только BYTE/DB'); for(const ch of sm[2]){mem.push(ch.charCodeAt(0)&0xFF);count++;} continue; }
        let v = part==='?' ? 0 : parseNum(part);
        if(v===null) throw new AsmError(i,`Не число: ${part}`);
        const b=size*8; if(v<-P2(b-1)||v>P2(b)-1) throw new AsmError(i,`Значение ${part} не помещается в ${b} бит`,`Диапазон ${b}-битного числа: ${-P2(b-1)}…${P2(b)-1}`);
        const u=norm(v,b); for(let k=0;k<size;k++){mem.push(Math.floor(u/P2(8*k))&0xFF);} count++;
      }
      vars[lname]={name,addr,size,count,isStr:/["']/.test(m[3])};
      continue;
    }
    if(sec!=='code') throw new AsmError(i,'Строка вне секций .data / .code');
    const m=t.match(/^([a-z]+)\s*(.*)$/i); if(!m) throw new AsmError(i,'Не понимаю строку');
    const op=m[1].toLowerCase(); const args=m[2]?splitTop(m[2]):[];
    const ins={line:i,op,args,comment,raw:t};
    if(op==='mov' && args.length===2 && (/^@data$/i.test(args[1])||SEGREGS.has(args[0].toLowerCase()))){ins.skip='Служебная строка DOS: настраивает сегментный регистр DS на сегмент данных. В симуляторе пропускаем — данные и так доступны.';code.push(ins);continue;}
    ins.ops= op==='call' ? [] : args.map(a=>resolve(a,vars,i));
    validate(ins,mode);
    code.push(ins);
  }
  return {mode,mem,vars,code,lines};
}
function resolve(a,vars,line){
  let s=a.trim(), low=s.toLowerCase(), size=null;
  const pm=low.match(/^(byte|word|dword)\s+ptr\s+(.+)$/); if(pm){size={byte:8,word:16,dword:32}[pm[1]]; s=s.slice(s.toLowerCase().indexOf('ptr')+3).trim(); low=s.toLowerCase();}
  if(REGMAP[low]) return {k:'reg',...REGMAP[low],name:low.toUpperCase()};
  if(low.startsWith('offset ')){const n=low.slice(7).trim(); if(!vars[n]) throw new AsmError(line,`Неизвестное имя: ${n}`); return {k:'imm',v:vars[n].addr,name:'OFFSET '+vars[n].name};}
  const br=low.match(/^\[(.+)\]$/); if(br) low=br[1].trim();
  if(vars[low]) return {k:'mem',addr:vars[low].addr,s:size||vars[low].size*8,name:vars[low].name,v:vars[low]};
  const n=parseNum(low); if(n!==null) return {k:'imm',v:n,name:s};
  if(RESERVED.has(low)) throw new AsmError(line,`Syntax error: ${s}`,`«${s}» — зарезервированное слово MASM. Переименуй переменную, например в ${low==='c'?'CE':s.toUpperCase()+'E'} — и в .data, и здесь.`);
  throw new AsmError(line,`Неизвестный операнд: ${s}`,'Проверь, объявлена ли переменная в .data и нет ли опечатки.');
}
function validate(ins,mode){
  const {op,ops,line}=ins; const two=['mov','add','adc','sub','sbb','xor','and','or','cmp'];
  const need=(n)=>{ if(ops.length!==n) throw new AsmError(line,`${op.toUpperCase()}: нужно операндов — ${n}`); };
  if(two.includes(op)){
    need(2); const [d,s]=ops;
    if(d.k==='imm') throw new AsmError(line,'Приёмник не может быть числом','Первый операнд — куда записывать: регистр или переменная.');
    if(d.k==='mem'&&s.k==='mem') throw new AsmError(line,'Нельзя: память → память одной командой','Сначала загрузи одну переменную в регистр, потом работай с ним.');
    if(s.k!=='imm'&&d.s!==s.s) throw new AsmError(line,`instruction operands must be the same size (${d.s} и ${s.s} бит)`,`Размеры операндов не совпадают: ${d.name} — ${d.s} бит, ${s.name} — ${s.s} бит. Расширь меньший операнд или возьми регистр нужного размера (например, CL вместо CX).`);
    if(s.k==='imm'&&(s.v<-P2(d.s-1)||s.v>P2(d.s)-1)) throw new AsmError(line,`Число ${s.name} не помещается в ${d.s} бит`);
    return;
  }
  if(op==='movzx'||op==='movsx'){need(2); if(ops[0].k!=='reg'||ops[1].k==='imm'||ops[1].s>=ops[0].s) throw new AsmError(line,`${op.toUpperCase()}: приёмник — регистр большего размера, источник — меньшего`); return;}
  if(op==='shl'||op==='shr'){need(2); if(ops[0].k==='imm'||ops[1].k!=='imm') throw new AsmError(line,`${op.toUpperCase()}: формат shl регистр, число`); return;}
  if(op==='inc'||op==='dec'){need(1); if(ops[0].k==='imm') throw new AsmError(line,'Нельзя увеличить число'); return;}
  if(op==='cbw'||op==='cwd'||op==='exit'){need(0); return;}
  if(op==='int'){need(1); return;}
  if(op==='call'){ const fn=(ins.args[0]||'').toLowerCase(); if(!['dumpregs','writedec','writeint','writehex','writebin','writestring','crlf'].includes(fn)) throw new AsmError(line,`call ${ins.args[0]}: такую процедуру симулятор не знает`); ins.fn=fn; ins.ops=[]; return;}
  throw new AsmError(line,`Команду ${op.toUpperCase()} симулятор пока не поддерживает`,'Поддерживаются: MOV, MOVZX, MOVSX, ADD, ADC, SUB, SBB, XOR, AND, OR, CMP, SHL, SHR, INC, DEC, CBW, CWD, CALL, INT 21h, exit.');
}
function initState(prog){
  const regs = prog.mode===32
    ? {eax:0x0019FFCC,ebx:0x003BE000,ecx:0x00000000,edx:0x00401000,esi:0,edi:0,ebp:0x0019FF80,esp:0x0019FF74}
    : {eax:0,ebx:0,ecx:0,edx:0,esi:0,edi:0,ebp:0,esp:0x100};
  return {regs,flags:{CF:0,ZF:0,SF:0,OF:0,PF:0,AF:0},mem:prog.mem.slice(),out:'',done:false,pc:0};
}
function cloneState(s){return {regs:{...s.regs},flags:{...s.flags},mem:s.mem.slice(),out:s.out,done:s.done,pc:s.pc};}
function getReg(st,o){const v=st.regs[o.r]; if(o.p==='e') return v; if(o.p==='x') return v&0xFFFF; if(o.p==='l') return v&0xFF; return (v>>>8)&0xFF;}
function setReg(st,o,val){let v=st.regs[o.r];
  if(o.p==='e') v=norm(val,32); else if(o.p==='x') v=v-(v&0xFFFF)+norm(val,16); else if(o.p==='l') v=v-(v&0xFF)+norm(val,8); else v=v-(v&0xFF00)+norm(val,8)*256;
  st.regs[o.r]=norm(v,32);}
function readMem(st,addr,bytes){let v=0; for(let k=0;k<bytes;k++) v+=(st.mem[addr+k]||0)*P2(8*k); return v;}
function writeMem(st,addr,bytes,val){const u=norm(val,bytes*8); for(let k=0;k<bytes;k++) st.mem[addr+k]=Math.floor(u/P2(8*k))&0xFF;}
function rd(st,o,size){ if(o.k==='reg') return getReg(st,o); if(o.k==='mem') return readMem(st,o.addr,o.s/8); return norm(o.v,size||32); }
function wr(st,o,val){ if(o.k==='reg') setReg(st,o,val); else writeMem(st,o.addr,o.s/8,val); }
function setSZP(st,res,b){st.flags.ZF=res===0?1:0; st.flags.SF=res>=P2(b-1)?1:0; st.flags.PF=parity(res);}
function flagsTxt(f){return `CF=${f.CF} ZF=${f.ZF} SF=${f.SF} OF=${f.OF}`;}
function valTxt(v,b){const u=norm(v,b),s=signed(u,b); return `${hx(u,b)} = ${s===u?u:(u+' (без знака) / '+fmtNeg(s)+' (со знаком)')}`;}

function execStep(prog,st){
  const ins=prog.code[st.pc]; if(!ins){st.done=true; return {lead:'Конец программы',txt:''};}
  st.pc++;
  if(ins.skip) return {lead:ins.raw,txt:ins.skip};
  const {op,ops}=ins; const f=st.flags; let lead=ins.raw, txt='', pre='';
  const d=ops[0], s=ops[1];
  const extPre=(fromName,fromV,fromB,toName,toV,toB,fill)=>{ const fb=bin(fromV,fromB), pad=' '.repeat(bin(toV,toB).length-fb.length);
    return `было  ${fromName} = ${pad}${fb}   (${hx(fromV,fromB)} = ${fmtNeg(signed(fromV,fromB))} со знаком / ${norm(fromV,fromB)} без знака)\nстало ${toName} = ${bin(toV,toB)}   (${hx(toV,toB)} = ${fmtNeg(signed(toV,toB))} / ${norm(toV,toB)})\n${' '.repeat(toName.length+9)}${'^'.repeat(bin(toV,toB).length-fb.length-1)} дописано: ${fill}`; };
  switch(op){
    case 'mov': { const b=d.s; const v=rd(st,s,b);
      const before = d.k==='reg' && d.p==='h' ? (st.regs[d.r]&0xFF) : null; wr(st,d,v);
      if(d.k==='reg'&&d.p==='h'&&s.k==='imm'&&s.v===0){ const X=d.name[0], al=before, ax=st.regs[d.r]&0xFFFF;
        lead=ins.raw+'   ← беззнаковое расширение байта до слова';
        txt=`${X}H = 0000 0000, значит ${X}X = ${X}H : ${X}L. Слева от ${X}L дописали 8 нулей — число стало 16-битным и при этом НЕ изменилось. Так расширяют только беззнаковые (и положительные) числа. Для отрицательного так нельзя: −10 = 1111 0110, с нулями получится 0000 0000 1111 0110 = 246. Для знаковых нужен CBW.`;
        pre=extPre(X+'L',al,8,X+'X',ax,16,'8 нулей (AH = 0000 0000)'); }
      else { const from = s.k==='imm' ? `число ${s.name}` : s.k==='mem' ? `переменную ${s.name} из памяти` : `регистр ${s.name}`;
        txt=`Копируем ${from} в ${d.name}: ${d.name} = ${bin(v,b)} = ${valTxt(v,b)}. MOV ничего не считает и флаги не меняет.${d.k==='reg'&&d.p!=='e'&&d.s<32?` Остальные биты регистра E${d.name.length===2?d.name[0]+'X':d.name} не тронуты.`:''}`; }
      break; }
    case 'movzx': case 'movsx': { const v=rd(st,s); const sg=op==='movsx'; const r= sg? norm(signed(v,s.s),d.s) : v; wr(st,d,r);
      const neg=v>=P2(s.s-1);
      lead=ins.raw+`   ← ${sg?'знаковое':'беззнаковое'} расширение ${s.s} → ${d.s} бит`;
      txt= sg ? `MOVSX копирует знаковый бит ${s.name} (${neg?1:0}) во все новые старшие биты. Число со знаком не меняется: ${fmtNeg(signed(v,s.s))}.` : `MOVZX дописывает слева нули. Число без знака не меняется: ${v}.`;
      pre=extPre(s.name,v,s.s,d.name,r,d.s, sg?(neg?'единицы (копии знака 1)':'нули (копии знака 0)'):'нули'); break; }
    case 'add': case 'adc': case 'sub': case 'sbb': case 'cmp': {
      const b=d.s, a=rd(st,d,b), c=rd(st,s,b), cin=(op==='adc'||op==='sbb')?f.CF:0;
      const isAdd=op==='add'||op==='adc'; let r,res;
      if(isAdd){ r=a+c+cin; res=norm(r,b); f.CF=r>=P2(b)?1:0; f.OF=(((a^c)&P2(b-1)?0:1) && ((a&P2(b-1))!==(res&P2(b-1))) ? 1:0); }
      else { r=a-c-cin; res=norm(r,b); f.CF=r<0?1:0; f.OF=( (((a>=P2(b-1))!==(c>=P2(b-1))) && ((a>=P2(b-1))!==(res>=P2(b-1)))) ?1:0); }
      if(isAdd) f.OF = ((signed(a,b)+signed(c,b)+cin) > P2(b-1)-1 || (signed(a,b)+signed(c,b)+cin) < -P2(b-1)) ? 1:0;
      else f.OF = ((signed(a,b)-signed(c,b)-cin) > P2(b-1)-1 || (signed(a,b)-signed(c,b)-cin) < -P2(b-1)) ? 1:0;
      f.AF=((a^c^res)&0x10)?1:0; setSZP(st,res,b);
      if(op!=='cmp') wr(st,d,res);
      const sign=isAdd?'+':'−';
      txt=`${d.name} = ${hx(a,b)} ${sign} ${hx(c,b)}${cin?` ${sign} CF(1)`:(op==='adc'||op==='sbb'?` ${sign} CF(0)`:'')} = ${valTxt(res,b)}. ${flagsTxt(f)}.`;
      { const w=bin(a,b).length, dd=(v)=>`${hx(v,b)} = ${decS(v,b)}`;
        pre=`  ${bin(a,b)}   (${dd(a)})\n${sign} ${bin(c,b)}   (${dd(c)})${(op==='adc'||op==='sbb')?`\n${sign} ${' '.repeat(w-1)}${cin}   (CF)`:''}\n  ${'─'.repeat(w)}\n${isAdd&&f.CF?'1':' '} ${bin(res,b)}   (${dd(res)})${isAdd&&f.CF?'\n↑ этот 1 не влез в '+b+' бит → ушёл в CF':''}`; }
      if(f.CF) txt+= isAdd?' CF=1: был перенос за пределы '+b+' бит (для беззнаковых чисел результат не влез).':' CF=1: был заём (беззнаково первое меньше второго).';
      if(f.OF) txt+=' OF=1: знаковое переполнение — результат со знаком неверный!';
      if(op==='cmp') txt='CMP сравнивает (вычитает без записи). '+txt;
      break; }
    case 'xor': case 'and': case 'or': { const b=d.s,a=rd(st,d,b),c=rd(st,s,b); const res= op==='xor'? norm((a^c)>>>0,b) : op==='and'? norm((a&c)>>>0,b) : norm((a|c)>>>0,b); wr(st,d,res); f.CF=0;f.OF=0;f.AF=0;setSZP(st,res,b);
      txt = (op==='xor'&&d.k==='reg'&&s.k==='reg'&&d.name===s.name) ? `${d.name} XOR ${d.name} = 0 — быстрый способ обнулить регистр. ZF=1.` : `${d.name} = ${valTxt(res,b)}. ${flagsTxt(f)}.`; break; }
    case 'shl': case 'shr': { const b=d.s,a=rd(st,d,b),n=s.v&31; let res; if(op==='shl'){res=norm(a*P2(n),b); f.CF=n?(Math.floor(a*P2(n-1)/P2(b-1))&1):f.CF;} else {res=Math.floor(a/P2(n)); f.CF=n?(Math.floor(a/P2(n-1))&1):f.CF;} wr(st,d,res); setSZP(st,res,b); f.OF=0;
      txt=`${d.name} = ${hx(a,b)} сдвинуть ${op==='shl'?'влево':'вправо'} на ${n} бит = ${hx(res,b)}${op==='shl'?` (то же, что умножить на ${P2(n)})`:''}.`; break; }
    case 'inc': case 'dec': { const b=d.s,a=rd(st,d,b); const r=op==='inc'?a+1:a-1; const res=norm(r,b); f.OF=(op==='inc'?a===P2(b-1)-1:a===P2(b-1))?1:0; f.AF=((a^1^res)&0x10)?1:0; setSZP(st,res,b); wr(st,d,res); txt=`${d.name} = ${valTxt(res,b)}. CF не меняется.`; break; }
    case 'cbw': { const al=st.regs.eax&0xFF; const neg=al>=0x80; const ax=neg?0xFF00+al:al; setReg(st,{r:'eax',p:'x'},ax);
      lead='cbw   ← знаковое расширение AL (8 бит) → AX (16 бит)';
      txt=`Смотрим на старший бит AL — это знак: AL = ${bin(al,8)}, старший бит = ${neg?1:0}, значит число ${neg?'отрицательное':'положительное'}. CBW копирует этот бит во все 8 бит AH: AH = ${neg?'1111 1111':'0000 0000'}. Значение не изменилось (${fmtNeg(signed(al,8))}), просто теперь оно записано в 16 битах и его можно складывать со словами.${neg?` Если бы слева дописали нули (mov ah, 0), получилось бы 0000 0000 ${bin(al,8)} = ${al} — уже совсем другое число!`:' Для положительного числа CBW даёт то же, что mov ah, 0.'}`;
      pre=extPre('AL',al,8,'AX',ax,16, neg?'8 единиц — копии знака 1 (AH = FFh)':'8 нулей — копии знака 0 (AH = 00h)'); break; }
    case 'cwd': { const ax=st.regs.eax&0xFFFF; const neg=ax>=0x8000; const dx=neg?0xFFFF:0; setReg(st,{r:'edx',p:'x'},dx);
      lead='cwd   ← знаковое расширение AX (16 бит) → DX:AX (32 бита)';
      txt=`То же, что CBW, только шире: старший бит AX = ${neg?1:0}, его копия заполняет все 16 бит DX: DX = ${hx(dx,16)}. Пара DX:AX — то же число ${fmtNeg(signed(ax,16))}, но уже в 32 битах (DX — старшая половина, AX — младшая).`;
      pre=extPre('AX',ax,16,'DX:AX',dx*65536+ax,32, neg?'16 единиц — копии знака (DX = FFFFh)':'16 нулей (DX = 0000h)'); break; }
    case 'int': { const ah=(st.regs.eax>>>8)&0xFF; if(ah===0x4C){st.done=true; txt='INT 21h с AH = 4Ch — завершение программы (DOS).';} else txt='INT 21h — прерывание DOS (в симуляторе ничего не делает).'; break; }
    case 'exit': st.done=true; txt='exit — программа завершена.'; break;
    case 'call': {
      const fn=ins.fn, eax=st.regs.eax;
      if(fn==='dumpregs'){ st.out+=dumpRegs(st,prog)+'\n'; txt='DumpRegs печатает все 32-битные регистры и флаги — смотри окно вывода.'; }
      else if(fn==='writedec'){ st.out+=String(eax); txt=`WriteDec печатает EAX как беззнаковое: ${eax}`; }
      else if(fn==='writeint'){ const sv=signed(eax,32); st.out+=(sv>=0?'+':'')+sv; txt=`WriteInt печатает EAX со знаком: ${(sv>=0?'+':'')+sv}`; }
      else if(fn==='writehex'){ st.out+=hxr(eax,32); txt='WriteHex печатает EAX в hex.'; }
      else if(fn==='writebin'){ st.out+=eax.toString(2).padStart(32,'0').replace(/(.{4})(?!$)/g,'$1 '); txt='WriteBin печатает EAX в двоичном виде.'; }
      else if(fn==='writestring'){ let a=st.regs.edx, str=''; while(a<st.mem.length&&st.mem[a]!==0){str+=String.fromCharCode(st.mem[a]);a++;} st.out+=str; txt=`WriteString печатает строку с адреса EDX до байта 0: «${str}»`; }
      else if(fn==='crlf'){ st.out+='\n'; txt='Crlf — перевод строки.'; }
      break; }
  }
  return {lead,txt,pre,comment:ins.comment};
}
function dumpRegs(st,prog){
  const r=st.regs,f=st.flags; const efl=f.CF*1+2+f.PF*4+f.AF*16+f.ZF*64+f.SF*128+512+f.OF*2048;
  const eip=0x00401000+(prog.code[st.pc-1]?prog.code[st.pc-1].line*5:0);
  return `  EAX=${hxr(r.eax,32)}  EBX=${hxr(r.ebx,32)}  ECX=${hxr(r.ecx,32)}  EDX=${hxr(r.edx,32)}\n  ESI=${hxr(r.esi,32)}  EDI=${hxr(r.edi,32)}  EBP=${hxr(r.ebp,32)}  ESP=${hxr(r.esp,32)}\n  EIP=${hxr(eip,32)}  EFL=${hxr(efl,32)}  CF=${f.CF}  SF=${f.SF}  ZF=${f.ZF}  OF=${f.OF}  AF=${f.AF}  PF=${f.PF}`;
}

/* ======================= UI симулятора ======================= */
class Sim{
  constructor(el){
    this.el=el; this.src0=PROGS[el.dataset.p]; this.src=this.src0; this.title=el.dataset.title||'Симулятор';
    el.innerHTML=`<div class="sh"><span class="st">▶ ${esc(this.title)}</span><span class="mode"></span></div>
      <div class="grid"><div class="code"><div class="gut" aria-hidden="true"></div><div class="edw"><div class="hl" aria-hidden="true"></div><textarea spellcheck="false" wrap="off" autocomplete="off" aria-label="Код программы — его можно править"></textarea></div></div><div class="state"></div></div>
      <div class="expl" aria-live="polite"></div>
      <div class="ctl">
        <button class="btn pri" data-a="step">Шаг ▶</button>
        <button class="btn" data-a="back">◀ Назад</button>
        <button class="btn" data-a="orig" hidden>Вернуть исходный код</button>
        <span class="hint">Код можно править прямо здесь — программа соберётся заново.</span>
      </div>`;
    this.codeEl=el.querySelector('.code'); this.stateEl=el.querySelector('.state'); this.explEl=el.querySelector('.expl'); this.modeEl=el.querySelector('.mode');
    this.ta=el.querySelector('textarea'); this.hl=el.querySelector('.hl'); this.gut=el.querySelector('.gut');
    this.ta.value=this.src; this.sizeCode();
    this.ta.addEventListener('input',()=>{ this.sizeCode(); clearTimeout(this.tm); this.tm=setTimeout(()=>{ this.src=this.ta.value; this.changed=true; this.build(); },700); });
    el.querySelector('.ctl').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) this.act(b.dataset.a);});
    this.build();
  }
  sizeCode(){
    const lines=this.ta.value.replace(/\r/g,'').split('\n');
    this.ta.rows=lines.length; this.ta.style.width=(Math.max(24,...lines.map(l=>l.length))+3)+'ch';
    this.gut.textContent=lines.map((_,i)=>i+1).join('\n');
    if(this.hl.children.length!==lines.length) this.hl.innerHTML=lines.map(()=>'<div></div>').join('');
  }
  build(){
    this.err=null;
    try{ this.prog=assemble(this.src); }catch(e){ if(e instanceof AsmError){this.err=e; this.prog=null;} else throw e; }
    this.el.querySelector('[data-a=orig]').hidden = this.src===this.src0;
    this.reset();
    if(this.changed && this.prog){ this.msg={lead:'Код изменён — программа собрана заново',txt:'Нажимай «Шаг ▶», чтобы пройти её с начала.'}; this.render(); }
    this.changed=false;
  }
  reset(){
    this.hist=[];
    if(this.prog){ this.st=initState(this.prog); this.prev=cloneState(this.st); this.msg={lead:'Готово к запуску — нажми «Шаг ▶»',txt:this.prog.mode===32?'Режим Irvine32 (32 бита). Регистры при старте содержат «мусор» от Windows — поэтому в программах сначала стоит xor.':'Режим 8086 (16 бит, как emu8086). Регистры при старте = 0.'}; this.modeEl.textContent=this.prog.mode===32?'Irvine32 · 32 бита':'8086 · 16 бит'; }
    else { this.st=null; this.msg=null; this.modeEl.textContent='ошибка сборки'; }
    this.render();
  }
  act(a){
    if(a==='orig'){ this.src=this.src0; this.ta.value=this.src; this.sizeCode(); this.build(); return; }
    if(!this.prog) return;
    if(a==='back'){ if(this.hist.length){ const h=this.hist.pop(); this.st=h.st; this.prev=h.prev; this.msg=h.msg; this.render(); } return; }
    if(a==='step'){ if(this.st.done||this.st.pc>=this.prog.code.length){ this.reset(); return; } this.step(); this.render(); }
  }
  step(){
    this.hist.push({st:cloneState(this.st),prev:this.prev,msg:this.msg});
    this.prev=cloneState(this.st); this.msg=execStep(this.prog,this.st);
  }
  render(){
    const rows=this.hl.children;
    const curLine = this.prog && this.st.pc>0 && this.hist.length ? this.prog.code[this.st.pc-1].line : -1;
    const doneSet=new Set(); if(this.prog) for(let k=0;k<this.st.pc-1;k++) doneSet.add(this.prog.code[k].line);
    for(let i=0;i<rows.length;i++) rows[i].className= this.err&&i===this.err.line ? 'err' : i===curLine ? 'cur' : doneSet.has(i) ? 'done' : '';
    const cur=rows[curLine]; if(cur){ const c=this.codeEl; const top=cur.offsetTop-c.clientHeight/2; if(cur.offsetTop<c.scrollTop||cur.offsetTop>c.scrollTop+c.clientHeight-30) c.scrollTop=Math.max(0,top); }
    const stepBtn=this.el.querySelector('[data-a=step]'), backBtn=this.el.querySelector('[data-a=back]');
    if(!this.prog){
      this.stateEl.innerHTML=`<div class="lbl">Сборка</div><p>Программа не собралась — как в настоящем ассемблере. Исправь строку, отмеченную красным: программа соберётся сама.</p>`;
      this.explEl.className='expl error';
      this.explEl.innerHTML=`<div class="lead">Строка ${this.err.line+1}: ${esc(this.err.msg)}</div><div>${esc(this.err.hint)}</div>`;
      stepBtn.disabled=true; backBtn.disabled=true; stepBtn.textContent='Шаг ▶'; return;
    }
    const st=this.st, pv=this.prev, m32=this.prog.mode===32;
    const regRow=(R)=>{ const v=st.regs[R], p=pv.regs[R]; const hs=hxr(v,32), ps=hxr(p,32);
      const seg=(a,b,cls)=>{const s=hs.slice(a,b),o=ps.slice(a,b); return `<span class="${cls}${s!==o?' chg':''}">${s}</span>`;};
      const name=R.toUpperCase();
      if(m32) return `<span class="rn">${name}</span><span class="rv">${seg(0,4,'hi')}${seg(4,6,'h8')}${seg(6,8,'l8')}</span><span class="rd">${name.slice(1)} = ${decS(v&0xFFFF,16)}</span>`;
      return `<span class="rn">${name.slice(1)}</span><span class="rv">${seg(4,6,'h8')}${seg(6,8,'l8')}</span><span class="rd">${decS(v&0xFFFF,16)}</span>`; };
    const fl=['CF','ZF','SF','OF','PF','AF'].map(k=>`<span class="flag${st.flags[k]?' on':''}${st.flags[k]!==pv.flags[k]?' chg':''}" title="${k}">${k}=${st.flags[k]}</span>`).join('');
    const vs=Object.values(this.prog.vars);
    const memRows=vs.map(v=>{
      if(v.isStr){ const n=v.size*v.count; let s='',ch=false; for(let k=0;k<n;k++){const c=st.mem[v.addr+k]; if(c!==pv.mem[v.addr+k]) ch=true; s+= c?String.fromCharCode(c):'·0';}
        return `<tr><td>${esc(v.name)}</td><td>строка байт</td><td class="bin${ch?' chg':''}">«${esc(s)}»</td><td>${n} байт</td></tr>`; }
      const b=v.size*8; let cells=[];
      for(let k=0;k<v.count;k++){ const a=v.addr+k*v.size, val=readMem(st,a,v.size), old=readMem(pv,a,v.size);
        cells.push({bin:bin(val,b),val,ch:val!==old}); }
      const ch=cells.some(c=>c.ch);
      return `<tr><td>${esc(v.name)}</td><td>${TYPE_RU[v.size]}</td><td class="bin${ch?' chg':''}">${cells.map(c=>c.bin).join('<br>')}</td><td>${cells.map(c=>`${hx(c.val,b)} = ${decS(c.val,b)}`).join('<br>')}</td></tr>`; }).join('');
    this.stateEl.innerHTML=`
      <div><div class="lbl">Регистры ${m32?'(hex: <span style="color:#8b5cf6">AH</span> · <span style="color:#16a06a">AL</span>)':'(AH · AL)'}</div><div class="regs">${['eax','ebx','ecx','edx'].map(regRow).join('')}</div></div>
      <div><div class="lbl">Флаги</div><div class="flags">${fl}</div></div>
      ${vs.length?`<div><div class="lbl">Переменные в памяти</div><div class="tw" style="margin:0"><table class="memt"><tr><th>Переменная</th><th>Тип</th><th>Двоичный вид</th><th>Значение</th></tr>${memRows}</table></div><div class="cap" style="font-size:12px;color:var(--muted);margin-top:3px">Двоичный вид — ровно столько бит, сколько объявлено: DB — 8, DW — 16, DWORD — 32. «Значение»: hex = без знака / со знаком.</div></div>`:''}
      ${st.out?`<div><div class="lbl">Вывод программы</div><div class="term">${esc(st.out)}</div></div>`:''}`;
    this.explEl.className='expl';
    const msg=this.msg||{lead:'',txt:''};
    this.explEl.innerHTML=`<div class="lead">${esc(msg.lead||'')}</div><div>${esc(msg.txt||'')}</div>${msg.pre?`<pre class="mini">${esc(msg.pre)}</pre>`:''}${msg.comment?`<div style="color:var(--muted)">Комментарий в коде: ${esc(msg.comment)}</div>`:''}`;
    const atEnd=st.done||st.pc>=this.prog.code.length;
    stepBtn.disabled=false; stepBtn.textContent= atEnd ? 'С начала ↺' : 'Шаг ▶';
    backBtn.disabled=!this.hist.length;
  }
}
/* ======================= Калькуляторы темы 9 ======================= */
function pageCalc(root){
  root.innerHTML=`<div class="wt">Калькулятор: виртуальный адрес → физический</div>
    <div class="row-in">
      <label for="pcVa">Виртуальный адрес (hex)<input id="pcVa" value="1234"></label>
      <label for="pcSz">Размер страницы<select id="pcSz"><option value="256">256 Б (0x100)</option><option value="4096" selected>4 КиБ (0x1000)</option><option value="65536">64 КиБ (0x10000)</option></select></label>
      <label for="pcFr">Номер кадра (из таблицы страниц, дес.)<input id="pcFr" type="number" value="9" min="0"></label>
    </div><div class="calc-out" aria-live="polite"></div>`;
  const va=root.querySelector('#pcVa'), sz=root.querySelector('#pcSz'), fr=root.querySelector('#pcFr'), out=root.querySelector('.calc-out');
  function upd(){
    const v=parseInt(va.value.replace(/^0x/i,'').replace(/h$/i,''),16); const s=+sz.value; const f=parseInt(fr.value)||0;
    if(isNaN(v)){out.textContent='Введи адрес в шестнадцатеричном виде, например 1234';return;}
    const bits=Math.log2(s), hd=bits/4; const page=Math.floor(v/s), off=v%s; const pa=f*s+off;
    const vh=v.toString(16).toUpperCase(); const pad=vh.padStart(hd+1,'0');
    const pPart=pad.slice(0,pad.length-hd), oPart=pad.slice(-hd);
    out.innerHTML=`Шаг 1. VA = 0x${vh} = ${v}. Страница ${s} байт = 2<sup>${bits}</sup> → смещение = младшие ${bits} бит = последние <b>${hd}</b> hex-цифры.<br>
      Шаг 2. 0x<span class="hx-p">${pPart}</span><span class="hx-o">${oPart}</span> → страница <span class="hx-p">0x${page.toString(16).toUpperCase()}</span> (${page}), смещение <span class="hx-o">0x${off.toString(16).toUpperCase()}</span> (${off}).<br>
      Шаг 3. По таблице страниц: страница ${page} → кадр ${f}. Смещение не меняется.<br>
      Шаг 4. ФА = ${f} × ${s} + ${off} = ${pa} = <b>0x<span class="hx-p">${f.toString(16).toUpperCase()}</span><span class="hx-o">${off.toString(16).toUpperCase().padStart(hd,'0')}</span></b>`;
  }
  [va,sz,fr].forEach(x=>x.addEventListener('input',upd)); upd();
}
function amatCalc(root){
  root.innerHTML=`<div class="wt">Калькулятор: среднее время доступа</div>
    <div class="row-in">
      <label for="amH">Доля попаданий H: <b id="amHv">0,90</b><input id="amH" type="range" min="0" max="1" step="0.01" value="0.9"></label>
      <label for="amC">Tкэш, нс<input id="amC" type="number" value="2" min="0" step="0.1"></label>
      <label for="amR">TОЗУ, нс<input id="amR" type="number" value="80" min="0"></label>
    </div><div class="calc-out" aria-live="polite"></div>`;
  const h=root.querySelector('#amH'),c=root.querySelector('#amC'),r=root.querySelector('#amR'),out=root.querySelector('.calc-out'),hv=root.querySelector('#amHv');
  const f=x=>(Math.round(x*100)/100).toString().replace('.',',');
  function upd(){ const H=+h.value,C=+c.value,R=+r.value; hv.textContent=f(H);
    const t1=C+(1-H)*R, t2=H*C+(1-H)*R;
    out.innerHTML=`<b>Модель лабы:</b> Tср = ${f(C)} + (1 − ${f(H)}) × ${f(R)} = ${f(C)} + ${f((1-H)*R)} = <b>${f(t1)} нс</b><br>
      <b>Учебниковая:</b> Tср = ${f(H)} × ${f(C)} + (1 − ${f(H)}) × ${f(R)} = <b>${f(t2)} нс</b><br>
      1000 обращений: ${f(t1*1000)} нс с кэшем против ${f(R*1000)} нс без кэша — в ${f(R/t1)} раза быстрее.`; }
  [h,c,r].forEach(x=>x.addEventListener('input',upd)); upd();
}
function matCalc(root){
  root.innerHTML=`<div class="wt">Матрёшка регистра: введи RAX</div>
    <div class="row-in"><label for="mtV">RAX (hex, до 16 цифр)<input id="mtV" value="0000000012345678" style="width:230px"></label></div>
    <div class="diagram" style="margin:0"><div class="mat"></div></div>`;
  const inp=root.querySelector('#mtV'), m=root.querySelector('.mat');
  function upd(){ let s=inp.value.replace(/[^0-9a-f]/gi,'').toUpperCase().slice(-16).padStart(16,'0');
    const row=(n,parts)=>`<div class="row"><b>${n}</b><div class="bar">${parts}</div></div>`;
    const seg=(txt,flex,bg,fg,hide)=>`<div class="seg" style="flex:${flex};${bg?'background:'+bg+';':''}${fg?'color:'+fg+';':''}${hide?'visibility:hidden;':''}">${txt}</div>`;
    m.innerHTML=row('RAX',seg(s.slice(0,8),8,'','var(--muted)')+seg(s.slice(8,12),4)+seg(s.slice(12,14),2,'#8b5cf6','#fff')+seg(s.slice(14),2,'#16a06a','#fff'))
      +row('EAX',seg('',8,'','',1)+seg(s.slice(8),8,'var(--accent-soft)'))
      +row('AX',seg('',12,'','',1)+seg(s.slice(12),4,'var(--accent-soft)'))
      +row('AH | AL',seg('',12,'','',1)+seg(s.slice(12,14),2,'#8b5cf6','#fff')+seg(s.slice(14),2,'#16a06a','#fff'))
      +`<p style="margin:6px 0 0;font-family:var(--f-body)">EAX = ${s.slice(8)}h, AX = ${s.slice(12)}h (${parseInt(s.slice(12),16)}), AH = ${s.slice(12,14)}h, AL = ${s.slice(14)}h. Запись в EAX в 64-битном режиме обнулит старшие 8 цифр RAX.</p>`; }
  inp.addEventListener('input',upd); upd();
}
function stackSim(root){
  root.innerHTML=`<div class="wt">Стек: PUSH и POP</div>
    <div class="row-in">
      <label for="skV">Значение для PUSH (hex)<input id="skV" value="1111"></label>
      <button class="btn pri" data-a="push">PUSH</button><button class="btn" data-a="pop">POP</button><button class="btn" data-a="clr">Сброс</button>
    </div><div class="tw" style="margin:0"><table class="memt sk"></table></div><div class="calc-out" style="margin-top:8px" aria-live="polite"></div>`;
  let sp=0x100, mem={}, last=null, popped=[];
  const tb=root.querySelector('.sk'), out=root.querySelector('.calc-out'), inp=root.querySelector('#skV');
  function draw(msg){ let rows='<tr><th>Адрес</th><th>Содержимое</th><th></th></tr>';
    for(let a=0xF6;a<=0x100;a+=2){ const v=mem[a]; rows+=`<tr><td>${hxr(a,16)}h</td><td class="${a===last?'chg':''}" style="${a<sp||v===undefined?'color:var(--muted)':''}">${v===undefined?'—':hxr(v,16)}${v!==undefined&&a<sp?' (мусор)':''}</td><td>${a===sp?'← SP':''}</td></tr>`; }
    tb.innerHTML=rows; out.textContent=msg||`SP = ${hxr(sp,16)}h. Стек растёт вниз: PUSH уменьшает SP на 2.`; }
  root.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.a==='push'){ if(sp<=0xF8){draw('Стек переполнен в этом примере — нажми POP или Сброс.');return;} const v=parseInt(inp.value,16)&0xFFFF; sp-=2; mem[sp]=v; last=sp; draw(`PUSH ${hxr(v,16)}h: SP = SP − 2 = ${hxr(sp,16)}h, затем [${hxr(sp,16)}h] ← ${hxr(v,16)}h.`); inp.value=hxr((v+0x1111)&0xFFFF,16); }
    if(b.dataset.a==='pop'){ if(sp>=0x100){draw('Стек пуст — снимать нечего.');return;} const v=mem[sp]; last=null; const a=sp; sp+=2; draw(`POP: прочитали [${hxr(a,16)}h] = ${hxr(v,16)}h, затем SP = SP + 2 = ${hxr(sp,16)}h. Значение в памяти осталось, но теперь это мусор.`); }
    if(b.dataset.a==='clr'){ sp=0x100; mem={}; last=null; inp.value='1111'; draw(); }
  });
  draw();
}

/* ======================= Таблицы «по шагам» ======================= */
function revealTables(){
  document.querySelectorAll('.reveal').forEach(box=>{
    const rows=[...box.querySelectorAll('tr')].slice(2); let i=0;
    const ctl=document.createElement('div'); ctl.className='ctl';
    ctl.innerHTML='<button class="btn pri">Следующая команда ▶</button><button class="btn">Показать всё</button><button class="btn">Сначала</button>';
    box.appendChild(ctl);
    const [bN,bA,bR]=ctl.querySelectorAll('button');
    const draw=()=>{ rows.forEach((r,k)=>{ r.classList.toggle('hid',k>=i); r.classList.toggle('new',k===i-1); }); bN.disabled=i>=rows.length; };
    bN.onclick=()=>{ if(i<rows.length){i++;draw();} }; bA.onclick=()=>{i=rows.length;draw();}; bR.onclick=()=>{i=0;draw();};
    draw();
  });
}

/* ======================= Тесты ======================= */
const DEFAULT_TESTS = {
t8:{ base:[
 {q:'Архитектура процессора, в которой быстродействие увеличивается за счёт упрощения инструкций, чтобы их декодирование было более простым, а время выполнения — короче:',a:['RISC-архитектура','CISC-архитектура','MISC-архитектура','SCSI-архитектура','USB-архитектура'],e:'RISC — Reduced: команды простые и одинаковой длины, их легко декодировать и выполнять за такт.'},
 {q:'Компьютер с полным набором команд:',a:['CISC','MISC','RISC','SCSI','USB'],e:'CISC — Complex (полный, сложный) набор команд. SCSI и USB — интерфейсы, а не архитектуры процессоров.'},
 {q:'Компьютер с минимальным набором команд:',a:['MISC','CISC','RISC','SCSI','USB'],e:'MISC — Minimal Instruction Set Computer.'},
 {q:'Архитектура, основная идея которой — один конвейер с большим количеством функциональных блоков:',a:['суперскалярная архитектура','конвейерная архитектура','мультиплексорная супер-архитектура','мультипроцессорная архитектура','суперкомпьютерная архитектура'],e:'Суперскалярный процессор имеет несколько исполнительных блоков и выполняет несколько команд за такт.'},
 {q:'Сопроцессоры используются для:',a:['операций с плавающей точкой','нет верного ответа','ускорения ввода информации на экран','ускорения обработки данных','ускорения передачи данных'],e:'Математический сопроцессор (FPU, например 8087) считает числа с плавающей точкой.'},
 {q:'Говоря о 16-разрядной ЭВМ, имеют в виду:',a:['размер слова 16 бит','нет верного ответа','размер внутренних регистров памяти 16 бит','разрядность шины адреса 16 бит','разрядность шины данных 16 бит'],e:'Разрядность ЭВМ = размер машинного слова. У 8086 слово 16 бит, а шина адреса — 20 бит.'},
 {q:'Двойное слово — это:',a:['32 бит','16 бит','2 бит','4 бит','8 бит'],e:'Байт 8, слово 16, двойное слово (DD/DWORD) 32 бита.'},
 {q:'Максимальное беззнаковое 16-ричное число, которое можно хранить в слове:',a:['FFFF','10000','1111','AAAA0','ABCDEF'],e:'Слово = 16 бит = 4 hex-цифры. Максимум FFFFh = 65535.'},
 {q:'Минимальная ячейка памяти, в которой можно хранить число (−150):',a:['слово','байт','бит','двойное слово','учетверенное слово'],e:'Знаковый байт хранит только −128…127, поэтому −150 нужно слово (−32768…32767).'},
 {q:'Какое беззнаковое десятичное число имеет такой же двоичный код, как и отрицательное число −50:',a:['206','10','128','205','224'],e:'−50 в байте = CEh = 256 − 50 = 206. То же самое видно при CBW: AL = CEh.'}
], pool:[
 {q:'Какой регистр хранит адрес СЛЕДУЮЩЕЙ команды?',a:['PC (IP)','IR','MAR','SP','FLAGS'],e:'Счётчик команд PC (в x86 — IP/EIP/RIP).'},
 {q:'Где находится ТЕКУЩАЯ выполняемая команда?',a:['IR','PC','MDR','SP','BX'],e:'IR — регистр команды. PC — уже адрес следующей.'},
 {q:'Правильный порядок машинного цикла:',a:['выборка → декодирование → выполнение → запись','декодирование → выборка → выполнение','выполнение → выборка → запись','выборка → выполнение → декодирование','запись → выборка → выполнение'],e:'Fetch → Decode → Execute → Writeback.'},
 {q:'Блок, выполняющий арифметические и логические операции:',a:['АЛУ','УУ','кэш','контроллер шины','регистр флагов'],e:'АЛУ — арифметико-логическое устройство.'},
 {q:'Блок, который расшифровывает команды и координирует работу узлов:',a:['УУ','АЛУ','FPU','ОЗУ','кэш L3'],e:'Устройство управления — «мозг» процессора.'},
 {q:'Принцип однородности памяти означает:',a:['программы и данные хранятся в одной памяти','память состоит из одинаковых микросхем','все ячейки одного размера','команды выполняются по порядку','вся информация двоичная'],e:'Однородность — команды и данные в одной памяти, процессор их «на вид» не различает.'},
 {q:'Принцип адресности памяти:',a:['ячейки памяти пронумерованы, у каждой свой адрес','программы и данные в одной памяти','вычисления идут по программе','данные кодируются в двоичном виде','адрес хранится в PC'],e:'Каждой ячейке (байту) назначен уникальный адрес.'},
 {q:'Архитектура с РАЗДЕЛЬНОЙ памятью команд и данных:',a:['гарвардская','фон Неймана','CISC','VLIW','MISC'],e:'В архитектуре фон Неймана память общая, в гарвардской — раздельная.'},
 {q:'ISA — это:',a:['набор всех машинных команд, которые понимает процессор','тип шины','язык высокого уровня','модель кэша','вид памяти'],e:'Instruction Set Architecture — система команд.'},
 {q:'В RISC с оперативной памятью работают только команды:',a:['LOAD и STORE','ADD и SUB','MOV и CBW','JUMP и CALL','все арифметические'],e:'Модель load/store: считают только регистры.'},
 {q:'Признак CISC:',a:['команды переменной длины, могут обращаться к памяти','все команды за 1 такт','только LOAD/STORE работают с памятью','фиксированная длина команд','много регистров и мало команд'],e:'Остальные варианты — признаки RISC.'},
 {q:'Пример CISC-процессора:',a:['Intel x86','ARM','RISC-V','MIPS','PowerPC'],e:'x86 (Intel, AMD) — классический CISC.'},
 {q:'Пример RISC-архитектуры:',a:['ARM','8086','80386','Pentium','x86-64'],e:'ARM — смартфоны, Apple M. Остальные — x86 (CISC).'},
 {q:'В архитектуре VLIW:',a:['компилятор объединяет несколько независимых операций в одну длинную команду','процессор сам переставляет команды','одна команда обрабатывает много данных','используется минимум команд','память команд отдельна'],e:'Very Long Instruction Word — параллелизм планирует компилятор.'},
 {q:'Конвейер (pipeline) — это:',a:['совмещение этапов разных команд во времени','очередь в памяти','вид кэша','шина данных','многоядерность'],e:'Пока одна команда выполняется, следующая уже декодируется.'},
 {q:'Микропрограммное управление:',a:['каждая команда выполняется как последовательность микрокоманд из ПЗУ управления','управление жёсткой логикой','управление через ОС','выполнение на сопроцессоре','прерывание по таймеру'],e:'Предложено М. Уилксом в 1951 году; типично для CISC.'},
 {q:'Аппаратное (жёсткое) управление характерно для:',a:['RISC','CISC','VLIW','MISC','любой архитектуры одинаково'],e:'Простые команды RISC удобно реализовать готовой логической схемой.'},
 {q:'Первый 32-битный процессор семейства x86:',a:['80386','8086','80286','80186','Pentium'],e:'«Тройка» 80386 (1985).'},
 {q:'С какого процессора (1978) началась архитектура x86?',a:['8086','80286','80386','4004','Pentium'],e:'Intel 8086 — 16-битный родоначальник.'},
 {q:'Почему процессор после 80486 назвали Pentium?',a:['цифры нельзя зарегистрировать как торговую марку','он был RISC','он был 64-битным','так решила AMD','в нём 5 ядер'],e:'«Пента» — пять, но как слово, а не номер.'},
 {q:'Команда CBW:',a:['знаково расширяет AL до AX','обнуляет AX','копирует AX в BX','беззнаково расширяет AL','меняет AH и AL местами'],e:'Convert Byte to Word — AH заполняется копиями знакового бита AL.'},
 {q:'После mov al,-25 / cbw регистр AX равен:',a:['FFE7h','00E7h','E7FFh','0019h','FF19h'],e:'−25 = E7h, знак 1 → AH = FF.'},
 {q:'ADC отличается от ADD тем, что:',a:['дополнительно прибавляет флаг CF','работает только с байтами','не меняет флаги','вычитает','прибавляет OF'],e:'Add with Carry — для переноса в старшую часть длинного числа.'},
 {q:'Флаг CF показывает:',a:['перенос/заём при беззнаковой арифметике','знаковое переполнение','нулевой результат','знак результата','чётность'],e:'Carry Flag.'},
 {q:'Флаг OF показывает:',a:['знаковое переполнение','беззнаковый перенос','нулевой результат','чётность','направление'],e:'Overflow Flag — например, 127 + 1 в байте со знаком.'},
 {q:'Какая команда x86 НЕДОПУСТИМА?',a:['mov S, A (обе — переменные в памяти)','mov ax, bx','add bx, C1','mov al, 5','cbw'],e:'Память → память одной командой нельзя, только через регистр.'},
 {q:'LOAD R1, [100] делает:',a:['копирует содержимое ячейки 100 в R1','записывает число 100 в R1','записывает R1 в ячейку 100','переходит на адрес 100','обнуляет ячейку 100'],e:'Квадратные скобки — «содержимое по адресу».'},
 {q:'ADD R1, R2 в учебной модели:',a:['R1 ← R1 + R2','R2 ← R1 + R2','R1 ← R2','память ← R1 + R2','R3 ← R1 + R2'],e:'Первый операнд — приёмник.'},
 {q:'[100]=7, [101]=5. После LOAD R1,[100]; LOAD R2,[101]; ADD R1,R2; STORE [200],R1 в ячейке 200:',a:['12','7','5','2','200'],e:'7 + 5 = 12. Проверь в симуляторе учебного процессора.'},
 {q:'Почему переменную в MASM нельзя назвать C?',a:['C — зарезервированное слово','имя слишком короткое','C — это регистр','C — это команда','заглавные буквы запрещены'],e:'C — языковой тип (соглашение о вызове). Отсюда «Syntax error: C».'}
]},
t9:{ base:[
 {q:'Для программиста доступна:',a:['внутренняя память доступна через регистры','внутренняя память доступна через информационную магистраль','внутренняя память процессора недоступна','вся рабочая память процессора','только внешняя память'],e:'Программа «видит» процессор только через его регистры.'},
 {q:'Сколько сегментных регистров входит в состав процессора?',a:['6','10','12','14','8'],e:'CS, DS, SS, ES, FS, GS.'},
 {q:'Внутренний КЭШ процессора Pentium разделён на:',a:['КЭШ команд и КЭШ данных','КЭШ команд и КЭШ адресов','КЭШ команд и КЭШ разрядов','КЭШ разрядов и КЭШ данных','нет верного ответа'],e:'L1I и L1D — «гарвард внутри фон Неймана».'},
 {q:'В качестве кэш-памяти предпочитают использовать:',a:['SRAM','DDR SDRAM','DRAM','RDRAM','SDRAM'],e:'SRAM быстрая и без регенерации.'},
 {q:'Какой из видов памяти не требует регенерации?',a:['SRAM','DDR SDRAM','DRAM','RDRAM','SDRAM'],e:'В SRAM бит хранит триггер, а не конденсатор.'},
 {q:'Для запоминания состояния прерванной программы используется:',a:['стек','нет верного ответа','ОЗУ','очередь','ПЗУ'],e:'При прерывании в стек кладутся FLAGS, CS, IP.'},
 {q:'Минимальной адресной единицей является:',a:['байт','бит','двойное слово','нет верного ответа','слово'],e:'Адрес есть у каждого байта, у отдельного бита — нет.'},
 {q:'Базовый адрес является:',a:['начальной точкой массива данных','конечной точкой массива данных','массивом адресов','массивом данных','промежуточной точкой массива данных'],e:'База + смещение = адрес элемента.'},
 {q:'В каком диапазоне лежат 8-битовые целые знаковые числа?',a:['от −128 до +127','−256..+255','от 0 до 255','от 0 до 65535','от −32768 до +32767'],e:'−2⁷ … 2⁷−1.'},
 {q:'16-битовые целые числа без знака лежат в диапазоне:',a:['от 0 до 65535','0…536','от 0 до 255','от −128 до +127','от −32768 до +32767'],e:'0 … 2¹⁶−1.'},
 {q:'16-битовые целые числа со знаком лежат в диапазоне:',a:['от −32768 до +32767','−256..+255','от 0 до 255','от 0 до 65535','от −128 до +127'],e:'−2¹⁵ … 2¹⁵−1.'},
 {q:'Минимальная ячейка памяти, в которой можно хранить число (12H):',a:['байт','бит','двойное слово','слово','учетверенное слово'],e:'12h = 18 — влезает в байт.'}
], pool:[
 {q:'Порядок уровней памяти от самого быстрого:',a:['регистры → L1 → L2 → L3 → ОЗУ → SSD/HDD','L1 → регистры → ОЗУ → L3','ОЗУ → кэш → регистры → диск','регистры → ОЗУ → кэш → диск','L3 → L2 → L1 → регистры'],e:'Чем ближе к ядру, тем быстрее и меньше.'},
 {q:'При движении вниз по иерархии памяти:',a:['ёмкость растёт, скорость падает, цена бита падает','всё растёт','ёмкость падает, скорость растёт','цена бита растёт','ничего не меняется'],e:'Это и есть компромисс иерархии.'},
 {q:'Самая быстрая память компьютера:',a:['регистры','кэш L3','ОЗУ','SSD','ПЗУ'],e:'Регистры — внутри ядра, доступ за такт.'},
 {q:'Временная локальность:',a:['недавно использованные данные скоро понадобятся снова','соседние адреса запрашиваются подряд','данные хранятся временно','кэш очищается по таймеру','данные живут до выключения'],e:'Пример — переменная цикла.'},
 {q:'Пространственная локальность:',a:['после адреса X скоро обратятся к X+1, X+2…','данные используются повторно','память делится на пространства','кэш хранит адреса','страницы одинакового размера'],e:'Пример — обход массива. Поэтому кэш грузит строку по 64 байта.'},
 {q:'TLB хранит:',a:['соответствия виртуальных страниц физическим кадрам','данные программы','команды','содержимое стека','флаги'],e:'TLB — кэш переводов адресов, а не данных.'},
 {q:'MMU — это:',a:['блок управления памятью, переводящий виртуальные адреса в физические','модуль ОЗУ','кэш L3','контроллер диска','сопроцессор'],e:'Memory Management Unit.'},
 {q:'Page Fault возникает, когда:',a:['отображения страницы нет или нарушены права доступа','промах TLB','промах кэша L1','переполнение стека','деление на 0'],e:'Промах TLB — не ошибка, Page Fault — исключение для ОС.'},
 {q:'Промах TLB означает:',a:['нужно искать отображение в таблице страниц','ошибку страницы','что данных нет в ОЗУ','сбой программы','промах кэша'],e:'Просто перевод не нашёлся в быстром буфере.'},
 {q:'Страница 4096 байт, VA = 0x1234. Номер страницы и смещение:',a:['1 и 0x234','0x12 и 0x34','0x123 и 4','4 и 0x1234','0 и 0x1234'],e:'Смещение — последние 3 hex-цифры.'},
 {q:'Страница 1 → кадр 9 (4 КиБ), VA = 0x1234. Физический адрес:',a:['0x9234','0x1239','0x9000','0x1234','0x91234'],e:'Меняем номер страницы на номер кадра: 0x9 | 234.'},
 {q:'Страница 256 байт, VA = 0x1234. Номер страницы:',a:['0x12 (18)','1','0x34','0x123','4'],e:'256 = 0x100, смещение — последние 2 hex-цифры (0x34).'},
 {q:'Сколько младших бит занимает смещение при странице 4 КиБ?',a:['12','8','4','16','32'],e:'4096 = 2¹².'},
 {q:'Младшие 16 бит регистра EAX называются:',a:['AX','AL','AH','RAX','EAX'],e:'EAX → AX → AH:AL.'},
 {q:'AX = 1234h. Чему равен AH?',a:['12h','34h','1234h','00h','43h'],e:'AH — старший байт, AL = 34h.'},
 {q:'В 64-битном режиме запись в EAX:',a:['обнуляет старшие 32 бита RAX','не трогает RAX','копирует значение в старшую часть','вызывает ошибку','меняет EBX'],e:'Особенность x86-64 из лекции.'},
 {q:'Регистр SP указывает на:',a:['вершину стека','следующую команду','начало сегмента данных','флаги','базу массива'],e:'Stack Pointer.'},
 {q:'Регистр IP (EIP/RIP) хранит:',a:['адрес следующей команды','текущий результат','вершину стека','номер прерывания','флаги'],e:'Instruction Pointer = PC.'},
 {q:'ZF = 1, если:',a:['результат операции равен 0','был перенос','результат отрицательный','знаковое переполнение','чётное число единиц'],e:'Zero Flag.'},
 {q:'MOV EAX,5; MOV EBX,3; ADD EAX,EBX; SUB EAX,8. Итог:',a:['EAX=0, ZF=1','EAX=8, ZF=0','EAX=0, ZF=0','EAX=16, ZF=0','EAX=−8, SF=1'],e:'5 + 3 − 8 = 0 → ZF = 1.'},
 {q:'Команда MOV на арифметические флаги:',a:['не влияет','устанавливает ZF','сбрасывает все','устанавливает CF','меняет OF'],e:'Поэтому CF доживает от ADD до ADC через MOV.'},
 {q:'PUSH и POP изменяют:',a:['регистр SP и память стека','только IP','только флаги','только AX','сегментные регистры'],e:'PUSH: SP − 2 и запись; POP: чтение и SP + 2.'},
 {q:'Tкэш = 2 нс, TRAM = 80 нс, H = 0,9. По формуле лабы Tср =',a:['10 нс','8 нс','82 нс','2 нс','72 нс'],e:'2 + 0,1 × 80 = 10.'},
 {q:'Регистром-счётчиком для циклов в x86 традиционно является:',a:['CX','AX','BX','DX','SP'],e:'C — Counter (команда LOOP).'},
 {q:'Регистром-аккумулятором в x86 является:',a:['AX','BX','CX','SI','IP'],e:'A — Accumulator.'},
 {q:'Виртуальная память — это:',a:['механизм отображения и защиты адресов','отдельная микросхема','файл подкачки','кэш L3','ПЗУ'],e:'Это способ адресации, а не уровень хранения.'},
 {q:'Чем кэш отличается от регистров?',a:['кэш прозрачен для программы, а регистры — операнды команд','кэш быстрее регистров','регистры находятся в ОЗУ','кэш энергонезависим','ничем'],e:'Программист называет регистры в командах, а кэш работает сам.'},
 {q:'Как беззнаково расширить байт в AL до AX?',a:['mov ah, 0','cbw','mov al, 0','cwd','add ah, al'],e:'CBW — знаковое расширение.'},
 {q:'После mov cx,10 / mov al,5 / mov ch,al регистр CX равен:',a:['050Ah (1290)','000Fh','0005h','000Ah','0A05h'],e:'CH = 05 (старший байт), CL = 0A.'},
 {q:'Почему mov al, cx вызывает ошибку?',a:['размеры операндов не совпадают (8 и 16 бит)','CX нельзя читать','AL только для чтения','нужно сначала CBW','MOV не работает с CX'],e:'Нужно mov al, cl.'}
]}};

/* ======================= Темы 1–7: инструменты ======================= */
const TOPICS=['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12','t13','t14','t15','t16','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14','c15','c16','c17'];
Object.assign(DEFAULT_TESTS, window.CPP_TESTS||{});
TOPICS.forEach(k=>{ if(!DEFAULT_TESTS[k]) DEFAULT_TESTS[k]={base:[],pool:[]}; });
// вопрос с кодом: ```cpp … ``` — блок, `…` — в строке
// «English text (Русский перевод)» → английский сверху, русский отдельной строкой ниже (только если основная часть латиницей)
function biSplit(t){ const s=String(t).replace(/\s+$/,''); if(!s.endsWith(')')) return null;
  let d=0,i=s.length-1; for(;i>=0;i--){ if(s[i]===')') d++; else if(s[i]==='('){ d--; if(d===0) break; } }
  if(i<=0) return null; const en=s.slice(0,i).replace(/\s+$/,''), ru=s.slice(i+1,-1);
  if(!/[А-Яа-яЁё]/.test(ru)||!/[A-Za-z]/.test(en)||/[А-Яа-яЁё]/.test(en.replace(/\(НЕ ТОЧНО\)/g,''))) return null; return [en,ru]; }
function qfmt(s){
  const parts=String(s).split(/```(?:cpp)?\n?([\s\S]*?)```/);
  const tx=p=>esc(p).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/^\n+|\n+$/g,'');
  return parts.map((p,i)=>{ if(i%2) return `<pre class="cpp-code qcode">${window.CPP&&CPP.highlight?CPP.highlight(p.replace(/\n$/,'')):esc(p)}</pre>`;
    const b=biSplit(p); return b?`<span class="en">${tx(b[0])}</span><span class="ru">${tx(b[1])}</span>`:tx(p); }).join('');
}
const ovl = s => `<span class="ov">${s}</span>`;
const grp4 = s => s.replace(/(.{4})(?=.)/g,'$1 ');
function parseIntLoose(s){ s=String(s).trim().replace(/\s+/g,''); let neg=false; if(s[0]==='-'||s[0]==='−'){neg=true;s=s.slice(1);} s=s.replace(/^\+/,'');
  let v=null; if(/^0x[0-9a-f]+$/i.test(s)) v=parseInt(s.slice(2),16); else if(/^[0-9a-f]+h$/i.test(s)) v=parseInt(s.slice(0,-1),16); else if(/^[01]+b$/i.test(s)) v=parseInt(s.slice(0,-1),2); else if(/^\d+$/.test(s)) v=parseInt(s,10);
  return v===null||isNaN(v)?null:(neg?-v:v); }
function toggleBtn(label,val,attr){ return `<button class="tgl${val?' on':''}" ${attr}>${label}<b>${val}</b></button>`; }

/* ---------- Тема 1: числа и доп. код ---------- */
function numCalc(root){
  root.innerHTML=`<div class="wt" id="t1-tool">Калькулятор: число → двоичный, hex, дополнительный код</div>
    <div class="row-in"><label for="ncV">Число (−25, 47, B3h, 1010b)<input id="ncV" value="-25"></label>
      <label for="ncB">Разрядность<select id="ncB"><option>4</option><option selected>8</option><option>16</option><option>32</option></select></label></div>
    <div class="calc-out" id="ncOut" aria-live="polite"></div>
    <div class="wt" style="margin-top:14px">Сложение и вычитание в N битах (перенос CF и переполнение OF)</div>
    <div class="row-in"><label for="naA">A<input id="naA" value="10"></label>
      <label for="naOp">Операция<select id="naOp"><option value="+">A + B</option><option value="-">A − B</option></select></label>
      <label for="naB">B<input id="naB" value="7"></label>
      <label for="naN">Бит<select id="naN"><option selected>4</option><option>8</option><option>16</option></select></label></div>
    <div class="calc-out" id="naOut" aria-live="polite"></div>`;
  const $=id=>root.querySelector('#'+id);
  function conv(){ const v=parseIntLoose($('ncV').value), b=+$('ncB').value, out=$('ncOut');
    if(v===null){ out.textContent='Не понял число. Примеры: −25, 47, B3h, 1010b.'; return; }
    if(v<-P2(b-1)||v>P2(b)-1){ out.innerHTML=`Число ${fmtNeg(v)} не помещается в ${b} бит: без знака 0…${P2(b)-1}, со знаком ${fmtNeg(-P2(b-1))}…${P2(b-1)-1}.`; return; }
    const code=norm(v,b), us=code, sg=signed(code,b); let h='';
    if(v<0){ const a=-v; h+=`<b>Дополнительный код ${fmtNeg(v)} в ${b} битах:</b><br>1) модуль ${a} = ${bin(a,b)}<br>2) инверсия (обратный код) = ${bin(~a>>>0,b)}<br>3) +1 = <b>${bin(code,b)}</b><br>Проверка: 2<sup>${b}</sup> − ${a} = ${P2(b)} − ${a} = ${code} ✔<br><br>`; }
    else { let s=v,steps=[]; if(v>0&&v<4096){ while(s>0){ steps.push(`${s} : 2 = ${Math.floor(s/2)}, остаток ${s%2}`); s=Math.floor(s/2);} h+=`<b>Перевод делением на 2</b> (остатки снизу вверх):<br>${steps.join('<br>')}<br><br>`; } }
    h+=`<b>Двоичный (${b} бит):</b> ${bin(code,b)}<br><b>Hex:</b> ${hxr(code,b)}h &nbsp; <b>Oct:</b> ${code.toString(8)}₈<br><b>Этот же код без знака:</b> ${us} &nbsp; <b>со знаком:</b> ${fmtNeg(sg)}<br><b>Старший бит</b> = ${code>=P2(b-1)?1:0} → ${code>=P2(b-1)?'как знаковое — отрицательное':'положительное'}`;
    out.innerHTML=h; }
  function add(){ const n=+$('naN').value, A=parseIntLoose($('naA').value), B=parseIntLoose($('naB').value), op=$('naOp').value, out=$('naOut');
    if(A===null||B===null){ out.textContent='Введи два числа.'; return; }
    const lim=(x)=>x<-P2(n-1)||x>P2(n)-1; if(lim(A)||lim(B)){ out.textContent=`Числа должны помещаться в ${n} бит.`; return; }
    const a=norm(A,n), bb=norm(B,n), b2= op==='+'? bb : norm(~bb+1,n);
    const full=a+b2, res=norm(full,n), carry=full>=P2(n)?1:0;
    const sa=signed(a,n), sb=signed(b2,n), sr=signed(res,n); const of=(sa>=0)===(sb>=0)&&(sr>=0)!==(sa>=0)?1:0;
    let carries=''; let c=0; for(let i=0;i<n;i++){ const s=((a>>i)&1)+((b2>>i)&1)+c; c=s>1?1:0; carries=c+carries; }
    let h= op==='-'?`A − B = A + (доп. код B): −B = инверсия ${bin(bb,n)} + 1 = ${bin(b2,n)}<br>`:'';
    h+=`<pre class="mini">перенос ${grp4(carries)}
     ${bin(a,n)}   (${a} / ${fmtNeg(sa)})
   + ${bin(b2,n)}   (${b2} / ${fmtNeg(sb)})
   ${'─'.repeat(bin(a,n).length+2)}
   ${carry?'1':' '} ${bin(res,n)}   (${res} / ${fmtNeg(sr)})</pre>`;
    h+=`<b>CF = ${carry}</b> — ${carry?`единица вылетела за ${n} бит${op==='+'?': для беззнаковых результат НЕ влез (верный был бы '+(a+b2)+')':' (при вычитании CF=1 значит «заёма нет»)'}`:'переноса нет'}.<br><b>OF = ${of}</b> — ${of?'знаковое переполнение: как числа со знаком ответ неверный!':'знакового переполнения нет: как числа со знаком ответ верный.'}`;
    out.innerHTML=h; }
  ['ncV','ncB'].forEach(i=>$(i).addEventListener('input',conv)); ['naA','naB','naOp','naN'].forEach(i=>$(i).addEventListener('input',add)); conv(); add();
}

/* ---------- Тема 2: IEEE 754 ---------- */
function ieeeCalc(root){
  root.innerHTML=`<div class="wt" id="t2-tool">Конвертер IEEE 754 (с шагами)</div>
    <div class="row-in"><label for="ieV">Десятичное число<input id="ieV" value="21.625"></label>
      <label for="ieF">Формат<select id="ieF"><option value="32">single (32 бит)</option><option value="64">double (64 бит)</option></select></label>
      <label for="ieH">…или hex-код для расшифровки<input id="ieH" placeholder="430F0000"></label></div>
    <div class="calc-out" id="ieOut" aria-live="polite"></div>`;
  const $=id=>root.querySelector('#'+id);
  function fields(bitsStr,f){ const eb=f===32?8:11, bias=f===32?127:1023; return {s:bitsStr[0], e:bitsStr.slice(1,1+eb), m:bitsStr.slice(1+eb), eb, bias}; }
  function bitsOf(x,f){ const dv=new DataView(new ArrayBuffer(8)); if(f===32){ dv.setFloat32(0,x); return dv.getUint32(0).toString(2).padStart(32,'0'); } dv.setFloat64(0,x); return dv.getUint32(0).toString(2).padStart(32,'0')+dv.getUint32(4).toString(2).padStart(32,'0'); }
  function valOf(bits,f){ const dv=new DataView(new ArrayBuffer(8)); if(f===32){ dv.setUint32(0,parseInt(bits,2)); return dv.getFloat32(0);} dv.setUint32(0,parseInt(bits.slice(0,32),2)); dv.setUint32(4,parseInt(bits.slice(32),2)); return dv.getFloat64(0); }
  const toHex=b=>b.match(/.{4}/g).map(x=>parseInt(x,2).toString(16).toUpperCase()).join('');
  function fracBin(fr,max){ let s=''; for(let i=0;i<max&&fr>0;i++){ fr*=2; if(fr>=1){s+='1';fr-=1;} else s+='0'; } return {s,rest:fr>0}; }
  function explain(bits,f,title){ const F=fields(bits,f), E=parseInt(F.e,2), allOnes=/^1+$/.test(F.e), zeroE=/^0+$/.test(F.e), mz=/^0+$/.test(F.m);
    let h=`${title}<b>Поля:</b> S = ${F.s} | E = ${grp4(F.e)} | M = ${grp4(F.m)}<br><b>Hex:</b> ${toHex(bits)}h<br>`;
    if(allOnes) return h+`<b>E = все единицы</b> → ${mz?(F.s==='1'?'−∞':'+∞'):'NaN (не число)'}`;
    if(zeroE) return h+(mz?`<b>E = 0 и M = 0</b> → ${F.s==='1'?'−0':'+0'}`:`<b>E = 0, M ≠ 0</b> → денормализованное число (без скрытой единицы): ${valOf(bits,f)}`);
    const p=E-F.bias, mtrim=F.m.replace(/0+$/,'');
    return h+`<b>Знак:</b> ${F.s==='1'?'1 → минус':'0 → плюс'}<br><b>Порядок:</b> E = ${E}, p = E − ${F.bias} = ${p}<br><b>Число:</b> ${F.s==='1'?'−':''}1,${mtrim||'0'} × 2<sup>${p}</sup> = <b>${valOf(bits,f)}</b>`; }
  function fromDec(){ const f=+$('ieF').value, raw=$('ieV').value.trim().replace(',','.'), out=$('ieOut');
    let x; if(/^[+-]?(inf|∞)/i.test(raw)) x=raw[0]==='-'?-Infinity:Infinity; else if(/^nan$/i.test(raw)) x=NaN; else x=Number(raw);
    if(raw===''||(isNaN(x)&&!/^nan$/i.test(raw))){ out.textContent='Введи число, например 13.625 или −7.25'; return; }
    const bits=bitsOf(x,f); let h='';
    if(isFinite(x)&&x!==0){ const a=Math.abs(x), ip=Math.floor(a), fb=fracBin(a-ip,60), ib=ip.toString(2);
      const F=fields(bits,f), E=parseInt(F.e,2), p=E-F.bias;
      h+=`<b>Шаг 1. Знак:</b> ${x<0?'минус → S = 1':'плюс → S = 0'}<br>`;
      h+=`<b>Шаг 2. Модуль в двоичном:</b> целая ${ip} = ${ib}, дробная ${+(a-ip).toPrecision(12)} = 0,${fb.s||'0'}${fb.rest?'… (дробь не кончается — будет округление)':''}<br>&nbsp;&nbsp;→ ${ib},${fb.s||'0'}${fb.rest?'…':''}<br>`;
      if(E>0&&E<(f===32?255:2047)) h+=`<b>Шаг 3. Нормализация:</b> 1,${F.m.replace(/0+$/,'')||'0'} × 2<sup>${p}</sup> (запятую сдвинули на ${Math.abs(p)} ${p>=0?'влево':'вправо'})<br><b>Шаг 4. Порядок:</b> E = ${p} + ${F.bias} = ${E} = ${F.e}<br><b>Шаг 5. Мантисса</b> (без скрытой «1,», ${F.m.length} бит): ${grp4(F.m)}<br>`;
      if(f===32&&valOf(bits,32)!==x) h+=`<span style="color:var(--fix)">В single число хранится приближённо: ${valOf(bits,32)}</span><br>`;
      h+='<br>'; }
    out.innerHTML=h+explain(bits,f,`<b>Итог (${f===32?'single':'double'}):</b><br>`); }
  function fromHex(){ const raw=$('ieH').value.replace(/[^0-9a-f]/gi,''), out=$('ieOut'); if(!raw){ fromDec(); return; }
    const f= raw.length>8?64:32; const bits=raw.padStart(f/4,'0').slice(-f/4).split('').map(c=>parseInt(c,16).toString(2).padStart(4,'0')).join('');
    out.innerHTML=explain(bits,f,`<b>Расшифровка ${raw.toUpperCase()}h как ${f===32?'single':'double'}:</b><br>${grp4(bits)}<br>`); }
  $('ieV').addEventListener('input',()=>{$('ieH').value='';fromDec();}); $('ieF').addEventListener('input',()=>{$('ieH').value?fromHex():fromDec();}); $('ieH').addEventListener('input',fromHex); fromDec();
}

/* ---------- Логика: парсер выражений ---------- */
function lexExpr(src){
  const t=[]; let i=0; const s=src.replace(/→/g,'>').replace(/->/g,'>');
  while(i<s.length){ const ch=s[i];
    if(/\s/.test(ch)){i++;continue;}
    let m=s.slice(i).match(/^x\d+/i); if(m){t.push({k:'v',v:m[0].toLowerCase()}); i+=m[0].length; continue;}
    if(/[A-Za-z]/.test(ch)){t.push({k:'v',v:ch.toUpperCase()}); i++; continue;}
    if(ch==='0'||ch==='1'){t.push({k:'c',v:+ch}); i++; continue;}
    if('!~¬'.includes(ch)){t.push({k:'not'}); i++; continue;}
    if(ch==="'"||ch==='’'||ch==='′'){t.push({k:'pnot'}); i++; continue;}
    if('*&·∧'.includes(ch)){t.push({k:'op',v:'and'}); i++; continue;}
    if('+|∨'.includes(ch)){t.push({k:'op',v:'or'}); i++; continue;}
    if('^⊕'.includes(ch)){t.push({k:'op',v:'xor'}); i++; continue;}
    if('=≡~'.includes(ch)){t.push({k:'op',v:'eq'}); i++; continue;}
    if(ch==='>'){t.push({k:'op',v:'imp'}); i++; continue;}
    if(ch==='('||ch===')'){t.push({k:ch}); i++; continue;}
    throw new Error('Непонятный символ «'+ch+'»');
  }
  const out=[]; for(const x of t){ const prev=out[out.length-1];
    if(prev&&(prev.k==='v'||prev.k==='c'||prev.k===')'||prev.k==='pnot')&&(x.k==='v'||x.k==='c'||x.k==='('||x.k==='not')) out.push({k:'op',v:'and'});
    out.push(x); } return out; }
function parseExpr(src){
  const t=lexExpr(src); let p=0; const peek=()=>t[p];
  const prec={imp:1,eq:1,or:2,xor:3,and:4};
  function primary(){ const x=t[p++]; if(!x) throw new Error('Выражение оборвалось');
    if(x.k==='not') return {op:'not',a:postfix(primary())};
    if(x.k==='v') return postfix({v:x.v}); if(x.k==='c') return postfix({c:x.v});
    if(x.k==='('){ const e=bin_(0); if(!t[p]||t[p].k!==')') throw new Error('Не хватает «)»'); p++; return postfix(e); }
    throw new Error('Лишний знак операции'); }
  function postfix(n){ while(peek()&&peek().k==='pnot'){p++; n={op:'not',a:n};} return n; }
  function bin_(minP){ let l=primary(); while(peek()&&peek().k==='op'&&prec[peek().v]>=minP){ const o=t[p++].v; const r=bin_(prec[o]+1); l={op:o,a:l,b:r}; } return l; }
  const e=bin_(0); if(p<t.length) throw new Error('Лишняя «)» или символ'); return e; }
function exprVars(e,set=new Set()){ if(e.v) set.add(e.v); if(e.a) exprVars(e.a,set); if(e.b) exprVars(e.b,set); return set; }
const varSort=(a,b)=>{ const na=a.match(/\d+/), nb=b.match(/\d+/); if(na&&nb&&a[0]===b[0]) return na[0]-nb[0]; return a<b?-1:a>b?1:0; };
function evalExpr(e,env){ if(e.c!==undefined) return e.c; if(e.v) return env[e.v];
  const a=evalExpr(e.a,env); if(e.op==='not') return a?0:1; const b=evalExpr(e.b,env);
  return {and:a&b,or:a|b,xor:a^b,eq:a===b?1:0,imp:(!a||b)?1:0}[e.op]; }

/* ---------- Минимизация (Квайн — Мак-Класки) ---------- */
function popc(x){let c=0;while(x){c+=x&1;x>>=1;}return c;}
function minimize(n,ones){
  const full=(1<<n)-1; if(!ones.length) return {terms:[],zero:true}; if(ones.length===P2(n)) return {terms:[{v:0,m:full}],one:true};
  let cur=ones.map(v=>({v,m:0})), primes=[], seen=new Set();
  while(cur.length){ const next=[], used=new Set(), keys=new Set();
    for(let i=0;i<cur.length;i++) for(let j=i+1;j<cur.length;j++){ const a=cur[i],b=cur[j]; if(a.m!==b.m) continue; const d=a.v^b.v; if(popc(d)!==1) continue;
      used.add(i); used.add(j); const nv={v:a.v&~d,m:a.m|d}; const k=nv.v+'/'+nv.m; if(!keys.has(k)){keys.add(k); next.push(nv);} }
    cur.forEach((x,i)=>{ if(!used.has(i)){ const k=x.v+'/'+x.m; if(!seen.has(k)){seen.add(k); primes.push(x);} } }); cur=next; }
  const covers=(pi,mt)=>((mt&~pi.m)===pi.v);
  let best=null; const lits=s=>s.reduce((acc,p)=>acc+n-popc(p.m),0);
  (function rec(rest,chosen){ if(best&&chosen.length>best.length) return;
    if(!rest.length){ if(!best||chosen.length<best.length||(chosen.length===best.length&&lits(chosen)<lits(best))) best=chosen.slice(); return; }
    const mt=rest[0]; for(const pi of primes.filter(p=>covers(p,mt))){ chosen.push(pi); rec(rest.filter(x=>!covers(pi,x)),chosen); chosen.pop(); } })(ones.slice(),[]);
  return {terms:best,primes}; }
function termHTML(t,names){ const n=names.length; const parts=[]; for(let i=0;i<n;i++){ const bit=1<<(n-1-i); if(t.m&bit) continue; parts.push((t.v&bit)?names[i]:ovl(names[i])); } return parts.join('')||'1'; }
function termText(t,names){ const n=names.length; const parts=[]; for(let i=0;i<n;i++){ const bit=1<<(n-1-i); if(t.m&bit) continue; parts.push(((t.v&bit)?'':'!')+names[i]); } return parts.join('*')||'1'; }
function minHTML(res,names){ if(res.zero) return '0'; if(res.one) return '1'; return res.terms.map(t=>termHTML(t,names)).join(' + '); }
function mintermHTML(r,names){ const n=names.length; return names.map((nm,i)=>((r>>(n-1-i))&1)?nm:ovl(nm)).join(''); }
function maxtermHTML(r,names){ const n=names.length; return '('+names.map((nm,i)=>((r>>(n-1-i))&1)?ovl(nm):nm).join(' + ')+')'; }

/* ---------- Тема 3: калькулятор логики ---------- */
function logicCalc(root,first){
  root.classList.add('lcw');
  root.innerHTML=`<div class="wt"${first?' id="t3-tool"':''}>Калькулятор логики: выражение → таблица истинности, СДНФ, СКНФ, минимальная форма</div>
    <div class="row-in"><label style="flex:1;min-width:220px">Выражение (НЕ: ! или ', И: * или подряд AB, ИЛИ: +, XOR: ^, импликация: ->)<input class="lcE" value="!A*B + C" style="width:100%"></label></div>
    <div class="calc-out lcOut" aria-live="polite"></div>
    ${first?`<div class="wt" style="margin-top:14px">Вентили вживую: переключай A и B</div><div class="gates"></div>`:''}`;
  const inp=root.querySelector('.lcE'), out=root.querySelector('.lcOut');
  function run(){ let e; try{ e=parseExpr(inp.value); }catch(err){ out.innerHTML=`<span style="color:var(--bad)">${esc(err.message)}</span>`; return; }
    const names=[...exprVars(e)].sort(varSort), n=names.length; if(n>6){ out.textContent='Не больше 6 переменных.'; return; }
    const ones=[], zeros=[]; let rows='';
    for(let r=0;r<P2(n);r++){ const env={}; names.forEach((nm,i)=>env[nm]=(r>>(n-1-i))&1); const f=evalExpr(e,env); (f?ones:zeros).push(r);
      rows+=`<tr${f?' class="hi1"':''}><td class="n">${r}</td>${names.map(nm=>`<td class="n">${env[nm]}</td>`).join('')}<td class="n"><b>${f}</b></td></tr>`; }
    const res=minimize(n,ones);
    out.innerHTML=`<div class="tw" style="margin:0 0 8px"><table class="tt"><tr><th>№</th>${names.map(x=>`<th>${x}</th>`).join('')}<th>F</th></tr>${rows}</table></div>
      <b>Σ (где F = 1):</b> ${ones.length?'Σ('+ones.join(',')+')':'нет — функция всегда 0'}<br>
      <b>СДНФ:</b> ${ones.length?ones.map(r=>mintermHTML(r,names)).join(' + '):'—'}<br>
      <b>СКНФ:</b> ${zeros.length?zeros.map(r=>maxtermHTML(r,names)).join(''):'— (функция всегда 1)'}<br>
      <b>Минимальная ДНФ:</b> <span class="ans">${minHTML(res,names)}</span>
      ${n>=2&&n<=4?`<br><button class="btn" data-k="${n}:${ones.join(',')}:${names.join(',')}">Открыть в карте Карно</button>`:''}`;
    const kb=out.querySelector('[data-k]'); if(kb) kb.addEventListener('click',()=>{ const km=document.querySelector('#kmapCalc'); if(km&&km._load){ km._load(kb.dataset.k); showTopic('t4'); const kd=km.closest('details'); if(kd) kd.open=true; km.scrollIntoView({behavior:'smooth',block:'start'}); } }); }
  inp.addEventListener('input',run); root._load=(e)=>{ inp.value=e; run(); }; run();
  if(first){ const g=root.querySelector('.gates'); const st={A:0,B:1};
    const draw=()=>{ const A=st.A,B=st.B; const rows=[['AND · И',A&B],['OR · ИЛИ',A|B],['NOT A · НЕ',A?0:1],['NAND · И-НЕ',(A&B)?0:1],['NOR · ИЛИ-НЕ',(A|B)?0:1],['XOR · искл. ИЛИ',A^B],['XNOR · эквивалентность',A===B?1:0],['A → B · импликация',(!A||B)?1:0]];
      g.innerHTML=`<div class="row-in">${toggleBtn('A = ',A,'data-g="A"')}${toggleBtn('B = ',B,'data-g="B"')}</div><div class="lamps">${rows.map(([nm,v])=>`<div class="lamp${v?' on':''}"><i></i>${nm}<b>${v}</b></div>`).join('')}</div>`; };
    g.addEventListener('click',e=>{ const b=e.target.closest('[data-g]'); if(!b) return; st[b.dataset.g]^=1; draw(); }); draw(); }
}

/* ---------- Тема 4: карта Карно ---------- */
const GRAY2=[0,1,3,2];
const KM_PRESETS=(()=>{ const P=[];
  const tables={
    'Лаба 5 · 2 перем.':{names:['x1','x2'],rows:'00:0111101 01:1101100 10:1110110 11:1110011'},
    'Лаба 5 · 3 перем.':{names:['x1','x2','x3'],rows:'000:010111100110 001:000011100100 010:100010000100 011:100000000000 100:011100101000 101:001000011010 110:101000001101 111:010000011111'},
    'Лаба 5 · 4 перем.':{names:['x1','x2','x3','x4'],rows:'0000:101110010111 0001:101010100011 0010:001010100100 0011:010011111010 0100:010001001001 0101:011101101011 0110:010110110100 0111:110010100011 1000:110010100100 1001:100111111010 1010:101111001001 1011:011101101011 1100:000000110100 1101:010001111010 1110:111101001001 1111:101111001011'},
    'Лаба синтез · 3 перем.':{names:['x1','x2','x3'],rows:'000:010111100 001:000011100 010:100010000 011:100000000 100:011100101 101:001000011 110:101000001 111:010000011'},
    'Лаба синтез · 2 перем.':{names:['x1','x2'],rows:'00:101 01:100 10:110 11:011',labels:['F10','F11','F13']}};
  for(const [grp,t] of Object.entries(tables)){ const rows=t.rows.split(' ').map(r=>r.split(':')); const nf=rows[0][1].length;
    for(let f=0;f<nf;f++){ const ones=rows.filter(r=>r[1][f]==='1').map(r=>parseInt(r[0],2)); P.push({grp,label:(t.labels?t.labels[f]:'F'+(f+1)),names:t.names,ones}); } }
  P.push({grp:'Примеры',label:'Σ(1,3,5,7) — СРО',names:['A','B','C'],ones:[1,3,5,7]});
  P.push({grp:'Примеры',label:'Σ(1,3,5,7,10,11,14,15) — силабус',names:['A','B','C','D'],ones:[1,3,5,7,10,11,14,15]});
  P.push({grp:'Примеры',label:"A'B'C'+A'BC+ABC'+ABC — силабус",names:['A','B','C'],ones:[0,3,6,7]});
  P.push({grp:'Примеры',label:'Функция большинства',names:['A','B','C'],ones:[3,5,6,7]});
  P.push({grp:'Примеры',label:'Пример лабы 5 (x̄₀ + x₁x₂)',names:['x0','x1','x2'],ones:[0,2,1,3,7]});
  return P; })();
function kmapCalc(root){
  const COLORS=['#e8590c','#1c7ed6','#2f9e44','#ae3ec9','#f08c00','#0ca678','#d6336c','#5c7cfa'];
  let st={n:3,names:['A','B','C'],ones:new Set([1,3,5,7])};
  const opts=KM_PRESETS.map((p,i)=>`<option value="${i}">${p.grp} — ${p.label}</option>`).join('');
  root.innerHTML=`<div class="wt" id="t4-kmap">Карта Карно: кликай клетки — минимальная форма считается сама</div>
    <div class="row-in"><label for="kmN">Переменных<select id="kmN"><option>2</option><option selected>3</option><option>4</option></select></label>
      <label for="kmP" style="flex:1;min-width:220px">Готовая функция из лаб<select id="kmP" style="width:100%"><option value="">— выбери —</option>${opts}</select></label>
      <button class="btn" data-a="clr">Очистить</button></div>
    <div class="kmwrap"><div class="kmap"></div><div class="calc-out kmOut" aria-live="polite"></div></div>`;
  const $=s=>root.querySelector(s);
  function idx(r,c){ const n=st.n; if(n===2) return (GRAY2[c]&1)<<1 | (r&1); if(n===3) return (GRAY2[c]<<1)|r; return (GRAY2[c]<<2)|GRAY2[r]; }
  function draw(){ const n=st.n, nm=st.names, rows=n===2?2:n===3?2:4, cols=n===2?2:4;
    const colVars=n===2?nm[0]:nm.slice(0,2).join(''), rowVars=n===2?nm[1]:n===3?nm[2]:nm.slice(2).join('');
    const colL=c=> n===2? String(c) : GRAY2[c].toString(2).padStart(2,'0'), rowL=r=> n===4? GRAY2[r].toString(2).padStart(2,'0') : String(r);
    const res=minimize(n,[...st.ones].sort((a,b)=>a-b));
    const groups=(res.terms||[]).filter(()=>!res.one&&!res.zero);
    let h=`<table class="km"><tr><th class="corner"><span>${rowVars}</span><span>${colVars}</span></th>${Array.from({length:cols},(_,c)=>`<th>${colL(c)}</th>`).join('')}</tr>`;
    for(let r=0;r<rows;r++){ h+=`<tr><th>${rowL(r)}</th>`; for(let c=0;c<cols;c++){ const m=idx(r,c), on=st.ones.has(m);
      const dots=groups.map((g,gi)=>((m&~g.m)===g.v&&on)?`<i style="background:${COLORS[gi%COLORS.length]}"></i>`:'').join('');
      h+=`<td><button class="kc${on?' on':''}" data-m="${m}" aria-label="минтерм ${m}">${on?1:0}<small>${m}</small><span class="dots">${dots}</span></button></td>`; } h+='</tr>'; }
    h+='</table>'; $('.kmap').innerHTML=h;
    const ones=[...st.ones].sort((a,b)=>a-b);
    $('.kmOut').innerHTML=`<b>Σ:</b> ${ones.length?'Σ('+ones.join(',')+')':'—'}<br><b>СДНФ:</b> ${ones.length?ones.map(r=>mintermHTML(r,nm)).join(' + '):'0'}<br>
      <b>Группы:</b><br>${res.zero?'нет единиц → F = 0':res.one?'все клетки → F = 1':groups.map((g,gi)=>`<span class="sw" style="background:${COLORS[gi%COLORS.length]};border:0"></span> ${P2(popc(g.m))} кл. → ${termHTML(g,nm)}`).join('<br>')}<br>
      <b>Ответ:</b> <span class="ans">F = ${minHTML(res,nm)}</span><br><span style="color:var(--muted)">Было минтермов: ${ones.length}, стало слагаемых: ${res.one||res.zero?0:groups.length}.</span>`; }
  root.addEventListener('click',e=>{ const b=e.target.closest('.kc'); if(b){ const m=+b.dataset.m; st.ones.has(m)?st.ones.delete(m):st.ones.add(m); $('#kmP').value=''; draw(); return; }
    const a=e.target.closest('[data-a=clr]'); if(a){ st.ones.clear(); $('#kmP').value=''; draw(); } });
  $('#kmN').addEventListener('input',()=>{ const n=+$('#kmN').value; st={n,names:['A','B','C','D'].slice(0,n),ones:new Set()}; $('#kmP').value=''; draw(); });
  $('#kmP').addEventListener('input',()=>{ const p=KM_PRESETS[+$('#kmP').value]; if(!p) return; st={n:p.names.length,names:p.names.slice(),ones:new Set(p.ones)}; $('#kmN').value=String(st.n); draw(); });
  root._load=(spec)=>{ const [n,ones,names]=spec.split(':'); const N=+n; st={n:N,names:names?names.split(','):(N===3?['x0','x1','x2']:['A','B','C','D'].slice(0,N)),ones:new Set(ones?ones.split(',').filter(Boolean).map(Number):[])}; $('#kmN').value=String(N); $('#kmP').value=''; draw(); };
  draw(); }

/* ---------- Тема 5: сумматор и MUX ---------- */
function adderSim(root){
  const st={mode:'full',A:1,B:1,C:1,x:27,y:30,n:7};
  root.innerHTML=`<div class="wt">Симулятор сумматора</div><div class="row-in"><label for="adM">Схема<select id="adM"><option value="half">Полусумматор</option><option value="full" selected>Полный сумматор</option><option value="multi">Многоразрядный (цепочка)</option></select></label></div><div class="adB"></div>`;
  const body=root.querySelector('.adB');
  function draw(){ if(st.mode!=='multi'){ const A=st.A,B=st.B,C=st.mode==='full'?st.C:0; const S=A^B^C, Co=(A&B)|(C&(A^B));
      body.innerHTML=`<div class="row-in">${toggleBtn('A = ',A,'data-t="A"')}${toggleBtn('B = ',B,'data-t="B"')}${st.mode==='full'?toggleBtn('Cin = ',C,'data-t="C"'):''}</div>
        <div class="lamps"><div class="lamp${S?' on':''}"><i></i>Σ (сумма)<b>${S}</b></div><div class="lamp${Co?' on':''}"><i></i>Co (перенос)<b>${Co}</b></div></div>
        <div class="calc-out">${st.mode==='half'?`Σ = A ⊕ B = ${A} ⊕ ${B} = <b>${S}</b><br>Co = A · B = ${A} · ${B} = <b>${Co}</b>`:`Σ = A ⊕ B ⊕ Cin = ${A} ⊕ ${B} ⊕ ${C} = <b>${S}</b><br>Co = AB + Cin(A ⊕ B) = ${A&B} + ${C}·${A^B} = <b>${Co}</b><br>Как из двух полусумматоров: ПС1(A,B) → s₁ = ${A^B}, c₁ = ${A&B}; ПС2(s₁, Cin) → Σ = ${S}, c₂ = ${C&(A^B)}; OR(c₁, c₂) = ${Co}`}<br>Проверка арифметикой: ${A} + ${B}${st.mode==='full'?' + '+C:''} = ${A+B+C} = ${Co}${S}₂</div>`; return; }
    const n=st.n, x=st.x, y=st.y; if(x<0||y<0||x>P2(n)-1||y>P2(n)-1){ body.innerHTML=`<div class="row-in">${inputsHtml()}</div><div class="calc-out">Числа должны быть от 0 до ${P2(n)-1} для ${n} разрядов.</div>`; bindInputs(); return; }
    let c=0, rows=''; const sb=[]; for(let i=0;i<n;i++){ const a=(x>>i)&1,b=(y>>i)&1,s=a^b^c,co=(a&b)|(c&(a^b)); rows+=`<tr><td class="n">${i}</td><td class="n">${a}</td><td class="n">${b}</td><td class="n">${c}</td><td class="n"><b>${s}</b></td><td class="n">${co}</td></tr>`; sb.unshift(s); c=co; }
    body.innerHTML=`<div class="row-in">${inputsHtml()}</div><div class="calc-out">${bin(x,n)} (${x}) + ${bin(y,n)} (${y}) = ${c?'<b>1</b> ':''}${grp4(sb.join(''))} = <b>${x+y}</b>${c?` — перенос из старшего разряда: в ${n} бит не влезло, нужен ${n+1}-й`:''}. На Display в EWB: ${(x+y).toString(16).toUpperCase()}h</div>
      <div class="tw"><table><tr><th>Разряд</th><th>A</th><th>B</th><th>Cin</th><th>Σ</th><th>Co</th></tr>${rows}</table></div><p style="font-size:13px;color:var(--muted)">Разряд 0 — младший. Co каждого разряда идёт на Cin следующего («волна» переноса).</p>`; bindInputs(); }
  const inputsHtml=()=>`<label for="adX">A (дес.)<input id="adX" type="number" min="0" value="${st.x}"></label><label for="adY">B (дес.)<input id="adY" type="number" min="0" value="${st.y}"></label><label for="adN">Разрядов<select id="adN">${[2,3,4,5,6,7,8].map(k=>`<option${k===st.n?' selected':''}>${k}</option>`).join('')}</select></label>`;
  function bindInputs(){ ['adX','adY','adN'].forEach(id=>{ const el=root.querySelector('#'+id); el.addEventListener('change',()=>{ st.x=+root.querySelector('#adX').value||0; st.y=+root.querySelector('#adY').value||0; st.n=+root.querySelector('#adN').value; draw(); }); }); }
  root.querySelector('#adM').addEventListener('input',e=>{ st.mode=e.target.value; draw(); });
  body.addEventListener('click',e=>{ const b=e.target.closest('[data-t]'); if(!b) return; st[b.dataset.t]^=1; draw(); });
  draw(); }
function muxSim(root){
  const st={dev:'mux',D:[0,1,1,0],S:[1,0],d:1,E:[0,0,1,0]};
  root.innerHTML=`<div class="wt">Симулятор: MUX, DEMUX, дешифратор, шифратор</div><div class="row-in"><label for="mxD">Устройство<select id="mxD"><option value="mux">Мультиплексор 4:1</option><option value="demux">Демультиплексор 1:4</option><option value="dec">Дешифратор 2:4</option><option value="enc">Шифратор 4:2</option></select></label></div><div class="mxB"></div>`;
  const body=root.querySelector('.mxB');
  function draw(){ const [s1,s0]=st.S, sel=s1*2+s0; let ins='',outs='',f='';
    if(st.dev==='mux'){ ins=st.D.map((v,i)=>toggleBtn(`D${i} = `,v,`data-d="${i}"`)).join('')+toggleBtn('S1 = ',s1,'data-s="0"')+toggleBtn('S0 = ',s0,'data-s="1"');
      const y=st.D[sel]; outs=`<div class="lamp${y?' on':''}"><i></i>Y<b>${y}</b></div>`; f=`S1S0 = ${s1}${s0} = ${sel} → выбран вход D${sel} = ${y}. Y = S̄1S̄0D0 + S̄1S0D1 + S1S̄0D2 + S1S0D3`; }
    if(st.dev==='demux'){ ins=toggleBtn('D = ',st.d,'data-x="d"')+toggleBtn('S1 = ',s1,'data-s="0"')+toggleBtn('S0 = ',s0,'data-s="1"');
      outs=[0,1,2,3].map(i=>{const y=i===sel?st.d:0; return `<div class="lamp${y?' on':''}"><i></i>Y${i}<b>${y}</b></div>`;}).join(''); f=`Сигнал D = ${st.d} уходит на выход Y${sel}, остальные 0.`; }
    if(st.dev==='dec'){ ins=toggleBtn('A1 = ',s1,'data-s="0"')+toggleBtn('A0 = ',s0,'data-s="1"');
      outs=[0,1,2,3].map(i=>{const y=i===sel?1:0; return `<div class="lamp${y?' on':''}"><i></i>Y${i}<b>${y}</b></div>`;}).join(''); f=`Код ${s1}${s0}₂ = ${sel} → горит Y${sel}. Y${sel} = ${s1?'A1':'Ā1'}·${s0?'A0':'Ā0'}. Схема: 2 NOT + 4 AND.`; }
    if(st.dev==='enc'){ ins=st.E.map((v,i)=>toggleBtn(`D${i} = `,v,`data-e="${i}"`)).join('');
      const a1=st.E[2]|st.E[3], a0=st.E[1]|st.E[3], cnt=st.E.reduce((a,b)=>a+b,0);
      outs=`<div class="lamp${a1?' on':''}"><i></i>A1<b>${a1}</b></div><div class="lamp${a0?' on':''}"><i></i>A0<b>${a0}</b></div>`;
      f=`A1 = D2 + D3 = ${a1}, A0 = D1 + D3 = ${a0} → код ${a1}${a0}.`+(cnt>1?` <span style="color:var(--bad)">Активно ${cnt} входа — обычный шифратор выдаёт «смесь», ответ неоднозначен!</span>`:cnt===0?' Ни один вход не активен — выход 00, как у D0: без сигнала Valid не различить.':''); }
    body.innerHTML=`<div class="row-in">${ins}</div><div class="lamps">${outs}</div><div class="calc-out">${f}</div>`; }
  root.querySelector('#mxD').addEventListener('input',e=>{ st.dev=e.target.value; draw(); });
  body.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.d) st.D[+b.dataset.d]^=1; if(b.dataset.s) st.S[+b.dataset.s]^=1; if(b.dataset.x) st.d^=1; if(b.dataset.e) st.E[+b.dataset.e]^=1; draw(); });
  draw(); }

/* ---------- Тема 6: триггеры ---------- */
const FF_TYPES={
  rsnor:{label:'RS асинхронный (на ИЛИ-НЕ)',ins:['S','R'],def:{S:'0010000001100000',R:'0000010000100110'}},
  rsnand:{label:'RS асинхронный (на И-НЕ, вход активен нулём)',ins:['S̄','R̄'],def:{'S̄':'1101111110011111','R̄':'1111101111011001'}},
  rssync:{label:'RS синхронный (тактируемый)',clk:true,ins:['S','R'],def:{C:'0101010101010101',S:'0110000000000000',R:'0000011000000000'}},
  dff:{label:'D-триггер (по переднему фронту)',clk:true,ins:['D'],def:{C:'0101010101010101',D:'0011100001110000'}},
  dlatch:{label:'D-защёлка (по уровню C = 1)',clk:true,ins:['D'],def:{C:'0011000011110000',D:'0110110010110110'}},
  tff:{label:'T-триггер (по переднему фронту)',clk:true,ins:['T'],def:{C:'0101010101010101',T:'1111111100001111'}},
  jk:{label:'JK-триггер (по переднему фронту)',clk:true,ins:['J','K'],def:{C:'0101010101010101',J:'0111000011111111',K:'0000011111111111'}}};
function ffSim(root){
  const N=16; let type='rsnor', sig={};
  root.innerHTML=`<div class="wt" id="t6-sim">Симулятор триггеров с временной диаграммой</div>
    <div class="row-in"><label for="ffT" style="flex:1;min-width:220px">Триггер<select id="ffT" style="width:100%">${Object.entries(FF_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label>
      <button class="btn" data-a="def">Пример</button><button class="btn" data-a="clr">Обнулить входы</button></div>
    <p style="font-size:13.5px;color:var(--muted);margin:0 0 6px">Кликай по клеткам входных сигналов — уровень меняется 0 ↔ 1, Q пересчитывается сразу.</p>
    <div class="tw ffw"></div><div class="calc-out ffOut" aria-live="polite"></div>`;
  const wrap=root.querySelector('.ffw'), out=root.querySelector('.ffOut');
  function load(def){ const T=FF_TYPES[type]; sig={}; if(T.clk) sig.C=(def?T.def.C:'0'.repeat(N)).split('').map(Number); T.ins.forEach(k=>sig[k]=(def?T.def[k]:(type==='rsnand'?'1'.repeat(N):'0'.repeat(N))).split('').map(Number)); draw(); }
  function compute(){ const T=FF_TYPES[type]; const Q=[], NQ=[], ev=[]; let q=0;
    for(let k=0;k<N;k++){ let mark='';
      const rise=T.clk&&k>0&&sig.C[k-1]===0&&sig.C[k]===1;
      if(type==='rsnor'||(type==='rssync'&&sig.C[k])||type==='rsnand'){
        let S=sig.S??(1-sig['S̄'][k]), R=sig.R??(1-sig['R̄'][k]); if(Array.isArray(S)) S=S[k]; if(Array.isArray(R)) R=R[k];
        if(S&&R){ mark='F'; } else if(S){ if(q!==1) ev.push(`такт ${k}: установка → Q = 1`); q=1; } else if(R){ if(q!==0) ev.push(`такт ${k}: сброс → Q = 0`); q=0; } else if(q==='F'){ q='?'; ev.push(`такт ${k}: выход из запрета в хранение → состояние неопределённо (гонка)`); }
        if(mark==='F'){ if(q!=='F') ev.push(`такт ${k}: ЗАПРЕЩЁННАЯ комбинация — Q = Q̄ = ${type==='rsnand'?1:0}`); q='F'; } }
      else if(type==='dff'&&rise){ const d=sig.D[k]; if(q!==d) ev.push(`такт ${k}: фронт ↑, D = ${d} → Q = ${d}`); q=d; }
      else if(type==='dlatch'&&sig.C[k]){ const d=sig.D[k]; if(q!==d) ev.push(`такт ${k}: C = 1, защёлка прозрачна → Q = D = ${d}`); q=d; }
      else if(type==='tff'&&rise){ if(sig.T[k]){ q= q==='?'?'?':1-q; ev.push(`такт ${k}: фронт ↑, T = 1 → переключение, Q = ${q}`);} }
      else if(type==='jk'&&rise){ const j=sig.J[k],kk=sig.K[k]; const old=q; if(j&&kk) q= q==='?'?'?':1-q; else if(j) q=1; else if(kk) q=0; if(j||kk) ev.push(`такт ${k}: фронт ↑, J=${j} K=${kk} → ${j&&kk?'toggle':j?'установка':'сброс'}, Q = ${q}${old===q?' (не изменился)':''}`); }
      Q.push(q); NQ.push(q==='F'?(type==='rsnand'?1:0):q==='?'?'?':1-q); if(q==='F'&&type==='rsnand') Q[k]='F1'; }
    return {Q,NQ,ev}; }
  function draw(){ const T=FF_TYPES[type], {Q,NQ,ev}=compute(); const cw=34, lw=46, rh=34, rows=[];
    if(T.clk) rows.push(['C',sig.C,true]); T.ins.forEach(k=>rows.push([k,sig[k],true])); rows.push(['Q',Q,false]); rows.push(['¬Q',NQ,false]);
    const W=lw+N*cw+8, H=rows.length*rh+22; let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ffsvg" role="img" aria-label="Временная диаграмма">`;
    for(let k=0;k<=N;k++) s+=`<line x1="${lw+k*cw}" y1="0" x2="${lw+k*cw}" y2="${H-18}" class="grid"/>`;
    if(T.clk) for(let k=1;k<N;k++) if(type!=='dlatch'&&sig.C[k-1]===0&&sig.C[k]===1) s+=`<line x1="${lw+k*cw}" y1="0" x2="${lw+k*cw}" y2="${H-18}" class="edge"/>`;
    rows.forEach(([name,arr,edit],ri)=>{ const y0=ri*rh+6, hi=y0+4, lo=y0+rh-10; s+=`<text x="4" y="${y0+rh/2+2}" class="lbl">${name}</text>`;
      let path='', brk=true; arr.forEach((v,k)=>{ const x=lw+k*cw;
        if(v==='F'||v==='F1'||v==='?'){ brk=true; s+=`<rect x="${x}" y="${hi}" width="${cw}" height="${lo-hi}" class="${v==='?'?'unk':'forb'}"/><text x="${x+cw/2}" y="${(hi+lo)/2+4}" class="qm">${v==='?'?'?':(v==='F1'?'1':'0')}</text>`; return; }
        const y=v?hi:lo; path+=(brk?'M':'L')+x+' '+y+' L'+(x+cw)+' '+y+' '; brk=false;
        if(edit) s+=`<rect x="${x}" y="${y0}" width="${cw}" height="${rh-6}" class="hit" data-sig="${name}" data-k="${k}"><title>${name}[${k}] = ${v} — клик меняет</title></rect>`; });
      s+=`<path d="${path}" class="${edit?'wv in':'wv out'}"/>`; });
    for(let k=0;k<N;k++) s+=`<text x="${lw+k*cw+cw/2}" y="${H-4}" class="tk">${k}</text>`;
    s+='</svg>'; wrap.innerHTML=s;
    const info={rsnor:'Q⁺: S=1 → 1; R=1 → 0; S=R=0 → хранение; S=R=1 → запрет (красное).',rsnand:'Входы активны нулём: S̄=0 → Q=1; R̄=0 → Q=0; оба 1 → хранение; оба 0 → запрет (Q = Q̄ = 1).',rssync:'Пока C = 0, входы S и R игнорируются. При C = 1 работает как RS на ИЛИ-НЕ.',dff:'Q меняется только на передних фронтах C (синие линии): Q⁺ = D в момент фронта. Между фронтами D может скакать — Q не реагирует.',dlatch:'Пока C = 1, защёлка «прозрачна»: Q повторяет D. Когда C = 0 — держит последнее значение.',tff:'На каждом переднем фронте при T = 1 Q переключается. Выход — меандр с частотой f/2.',jk:'На фронте: 00 — хранение, 10 — Q=1, 01 — Q=0, 11 — toggle. (В EWB JK срабатывает по заднему фронту — суть та же.)'}[type];
    out.innerHTML=`<b>Правило:</b> ${info}<br><b>Что произошло:</b><br>${ev.length?ev.map(esc).join('<br>'):'Q не менялся.'}`; }
  wrap.addEventListener('click',e=>{ const r=e.target.closest('.hit'); if(!r) return; const k=+r.dataset.k, nm=r.dataset.sig; sig[nm][k]^=1; draw(); });
  root.querySelector('#ffT').addEventListener('input',e=>{ type=e.target.value; load(true); });
  root.addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(!b) return; load(b.dataset.a==='def'); });
  load(true); }

/* ---------- Тема 7: счётчик ---------- */
function cntSim(root){
  const st={n:3,type:'async',dir:'up',M:0,v:0,hist:[0],ripple:[],timer:null};
  root.innerHTML=`<div class="wt" id="t7-sim">Симулятор счётчика</div>
    <div class="row-in"><label for="ctN">Разрядов<select id="ctN">${[2,3,4,5,6].map(k=>`<option${k===3?' selected':''}>${k}</option>`).join('')}</select></label>
      <label for="ctT">Тип<select id="ctT"><option value="async">Асинхронный (ripple)</option><option value="sync">Синхронный</option></select></label>
      <label for="ctD">Направление<select id="ctD"><option value="up">Суммирующий</option><option value="down">Вычитающий</option></select></label>
      <label for="ctM">Модуль M (пусто = 2ⁿ)<input id="ctM" type="number" min="2" placeholder="например 10"></label></div>
    <div class="row-in"><button class="btn pri" data-a="tick">Такт ▶</button><button class="btn" data-a="auto">Авто ⏵</button><button class="btn" data-a="rst">Сброс в 0</button></div>
    <div class="ctState"></div><div class="tw ctw"></div><div class="calc-out ctOut" aria-live="polite"></div>`;
  const $=s=>root.querySelector(s);
  function modM(){ const M=st.M; return M&&M>=2&&M<=P2(st.n)?M:P2(st.n); }
  function tick(){ const n=st.n, N=P2(n), M=modM(); let v=st.v, rip=[];
    if(st.dir==='up'){ let x=v; for(let i=0;i<n;i++){ const was=(x>>i)&1; x^=(1<<i); rip.push(x); if(was===0) break; }
      let next=(v+1)%N; let reset=false; if(M<N&&next===M){ reset=true; } if(st.type==='sync') rip=[next]; else if(rip[rip.length-1]!==next) rip.push(next);
      if(reset){ rip.push(0); next=0; } st.v=next; st.ripple=rip; st.reset=reset; }
    else { let x=v; for(let i=0;i<n;i++){ const was=(x>>i)&1; x^=(1<<i); rip.push(x); if(was===1) break; }
      const next=(v-1+N)%N; if(st.type==='sync') rip=[next]; st.v=next; st.ripple=rip; st.reset=false; }
    st.hist.push(st.v); if(st.hist.length>24) st.hist.shift(); draw(); }
  function draw(){ const n=st.n, M=modM(), N=P2(n); const bits=bin(st.v,n).replace(/ /g,'');
    $('.ctState').innerHTML=`<div class="lamps">${bits.split('').map((b,i)=>`<div class="lamp${b==='1'?' on':''}"><i></i>Q${n-1-i}<b>${b}</b></div>`).join('')}<div class="lamp big"><i style="display:none"></i>= ${st.v}</div></div>`;
    const cw=26, lw=40, rh=30, steps=st.hist.length; const W=lw+steps*cw+10, rowsN=n+1, H=rowsN*rh+18;
    let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ffsvg" role="img" aria-label="Временная диаграмма счётчика">`;
    const sigRow=(ri,name,vals,isClk)=>{ const y0=ri*rh+6, hi=y0+4, lo=y0+rh-10; s+=`<text x="4" y="${y0+rh/2+2}" class="lbl">${name}</text>`; let p='';
      vals.forEach((v,k)=>{ const x=lw+k*cw; if(isClk){ p+=`${p?'L':'M'}${x} ${lo} L${x} ${hi} L${x+cw/2} ${hi} L${x+cw/2} ${lo} L${x+cw} ${lo} `; } else { const d= st.type==='async'?(ri-1)*2:0; const y=v?hi:lo; p+=`${p?'L':'M'}${x+cw/2+d} ${y} L${x+cw+cw/2+d} ${y} `; } });
      s+=`<path d="${p}" class="wv ${isClk?'in':'out'}"/>`; };
    sigRow(0,'CLK',st.hist,true); for(let i=0;i<n;i++) sigRow(i+1,'Q'+i,st.hist.map(v=>(v>>i)&1),false);
    st.hist.forEach((v,k)=>{ s+=`<text x="${lw+k*cw+cw/2}" y="${H-4}" class="tk">${v}</text>`; }); s+='</svg>'; $('.ctw').innerHTML=s;
    const Mb=M.toString(2).padStart(n,'0'); const resetQs=Mb.split('').map((b,i)=>b==='1'?'Q'+(n-1-i):null).filter(Boolean);
    let h=`<b>Ёмкость:</b> ${n} триггеров → 2<sup>${n}</sup> = ${N} состояний${M<N?`, используем модуль M = ${M} (счёт 0…${M-1})`:''}.<br>`;
    if(st.type==='sync') h+=`<b>Синхронный:</b> общий CLK на все триггеры. ${st.dir==='up'?Array.from({length:n},(_,i)=>`J${i}=K${i}=${i===0?'1':Array.from({length:i},(_,j)=>'Q'+j).join('·')}`).join('; '):'для вычитания условия берут от Q̄: J1=K1=Q̄0, J2=K2=Q̄0·Q̄1…'}<br>`;
    else h+=`<b>Асинхронный:</b> CLK только на Q0, каждый следующий тактируется ${st.dir==='up'?'выходом Q предыдущего (по спаду)':'инверсным выходом Q̄ предыдущего'}. На диаграмме видно смещение — задержка каждого каскада.<br>`;
    if(M<N) h+=`<b>Сброс по модулю:</b> M = ${M} = ${Mb}₂ → на элемент И-НЕ подаём ${resetQs.join(', ')}; его выход → CLR всех триггеров.<br>`;
    if(st.ripple.length){ const codes=st.ripple.map(x=>bin(x,n).replace(/ /g,'')); h+=`<b>Последний такт:</b> ${codes.join(' → ')}`;
      if(st.type==='async'&&st.ripple.length>1){ const mids=st.ripple.slice(0,-1).filter(x=>x!==st.v); if(mids.length) h+=` <span style="color:var(--fix)">— промежуточные (ложные) коды: ${mids.join(', ')}${st.reset?` (включая ${M} — он сразу вызвал сброс)`:''}</span>`; } }
    if(st.dir==='down'&&st.M) h+=`<br><span style="color:var(--muted)">Модуль в этом симуляторе применяется только к суммирующему счёту.</span>`;
    $('.ctOut').innerHTML=h; }
  function reset(){ st.v=0; st.hist=[0]; st.ripple=[]; draw(); }
  root.addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(!b) return;
    if(b.dataset.a==='tick') tick(); if(b.dataset.a==='rst') reset();
    if(b.dataset.a==='auto'){ if(st.timer){ clearInterval(st.timer); st.timer=null; b.textContent='Авто ⏵'; } else { st.timer=setInterval(tick,700); b.textContent='Пауза ⏸'; } } });
  $('#ctN').addEventListener('input',e=>{ st.n=+e.target.value; reset(); }); $('#ctT').addEventListener('input',e=>{ st.type=e.target.value; reset(); }); $('#ctD').addEventListener('input',e=>{ st.dir=e.target.value; reset(); });
  $('#ctM').addEventListener('input',e=>{ st.M=+e.target.value||0; if(st.M>P2(st.n)){ const need=Math.ceil(Math.log2(st.M)); if(need<=6){ st.n=need; $('#ctN').value=String(need);} } reset(); });
  draw(); }

function initTools17(){
  const g=id=>document.getElementById(id);
  numCalc(g('numCalc')); ieeeCalc(g('ieeeCalc')); logicCalc(g('logicCalc'),true); const l4=g('logicCalc4'); if(l4) logicCalc(l4,false);
  kmapCalc(g('kmapCalc')); adderSim(g('adderSim')); muxSim(g('muxSim')); ffSim(g('ffSim')); cntSim(g('cntSim'));
  document.addEventListener('click',e=>{ const b=e.target.closest('.lc-load'); if(b){ const sec=b.closest('.topic'); const w=(sec&&sec.querySelector('.lcw'))||document.querySelector('.lcw'); if(w&&w._load){ w._load(b.dataset.e); if(w.closest('.xblock')) w.classList.add('open'); w.scrollIntoView({behavior:'smooth',block:'start'}); } }
    const k=e.target.closest('.km-load'); if(k){ const km=g('kmapCalc'); km._load(k.dataset.k); km.scrollIntoView({behavior:'smooth',block:'start'}); } });
}

/* ======================= Тесты тем 1–7 ======================= */
Object.assign(DEFAULT_TESTS,{
t1:{base:[
 {q:'Какое максимальное количество комбинаций можно получить при помощи 16-ти битов:',a:['65536','1024','256','64','8'],e:'2¹⁶ = 65 536.'},
 {q:'Шестнадцатеричное число B3 в двоичном виде:',a:['10110011','01010101','10011100','11001111','11110001'],e:'B = 1011, 3 = 0011.'},
 {q:'Десятичное число 47 в шестнадцатеричной системе счисления – это:',a:['2F','215','A2','AF','F2'],e:'47 = 2·16 + 15 → 2F.'},
 {q:'В каком диапазоне лежат 8-битовые целые беззнаковые числа?',a:['от 0 до 255','от 0 до 65535','от -128 до +127','от -210 до + 210','от -32768 до + 32767'],e:'0 … 2⁸ − 1.'},
 {q:'8-битовые целые числа без знака занимают:',a:['1 байт и воспринимаются как положительное число','1 байт и воспринимаются как отрицательное число','2 байта и воспринимаются как отрицательное число','2 байта и воспринимаются как положительное число','4 байта и воспринимаются как положительное число'],e:'8 бит = 1 байт; без знака — всегда ≥ 0.'},
 {q:'Максимальное беззнаковое число, которое можно хранить в байте',a:['255','100','127','128','256'],e:'1111 1111 = 255.'},
 {q:'Минимальное знаковое число, которое можно хранить в байте',a:['-128','+100','+128','+255','-256'],e:'1000 0000 = −128.'},
 {q:'Десятичное число (-18) в двоичной системе счисления (размером в байт) – это:',a:['11101110','10101010','11001010','11001110','11100011'],e:'18 = 00010010 → инверсия 11101101 → +1 = 11101110.'},
 {q:'Чему в двоичной системе счисления равен результат умножения двоичных чисел 1010 и 111',a:['1000110','100001','1001010','101101','11000'],e:'10 × 7 = 70 = 1000110₂.'},
 {q:'Чему в восьмеричной системе счисления равен результат умножения двоичных чисел 1001 и 111',a:['77','10','11100','3F','75'],e:'9 × 7 = 63 = 77₈.'},
 {q:'Десятичное число (-27) в двоичной системе счисления (размером в байт) – это',a:['11100101','10001111','10100010','10101111','11001111'],e:'256 − 27 = 229 = 11100101.'},
 {q:'Десятичное число (-10) в двоичной системе счисления (размером в слово) – это',a:['1111111111110110','0001011101001111','1000101000101100','1100001010100010','1111111110001111'],e:'65536 − 10 = 65526 = FFF6h.'},
 {q:'Какое беззнаковое десятичное число имеет такой же двоичный код, как и отрицательное число -200',a:['65336','10','2','56','FAh'],e:'−200 не помещается в байт, значит слово: 65536 − 200 = 65336.'},
 {q:'Какое беззнаковое десятичное число имеет такой же двоичный код, как и отрицательное число -50',a:['206','10','128','205','224'],e:'256 − 50 = 206.'},
 {q:'Какое знаковое десятичное число имеет такой же двоичный код, как и беззнаковое 141',a:['-115','-1','-128','-22','-3'],e:'141 − 256 = −115.'},
 {q:'Какое знаковое десятичное число имеет такой же двоичный код, как и беззнаковое 246',a:['-10','-1','-127','-128','-245'],e:'246 − 256 = −10.'},
 {q:'Дополнительный код положительного числа 100',a:['01100100','00000000','01010101','10101010','11111111'],e:'У положительных доп. код = обычный двоичный.'},
 {q:'Дополнительный код отрицательного числа -7',a:['11111001','01111111','10000001','10101010','11110011'],e:'256 − 7 = 249 = 11111001.'},
 {q:'Дополнительный код числа -24',a:['11101000','00111111','01010101','01111111','10101010'],e:'256 − 24 = 232 = 11101000.'},
 {q:'Дополнительный код числа -51',a:['11001101','00111111','01010101','10101010','11110000'],e:'256 − 51 = 205 = 11001101.'},
 {q:'Число 42 в шестнадцатеричном коде',a:['2A','3A','81','A2','А5'],e:'42 = 2·16 + 10.'},
 {q:'Число 161 в шестнадцатеричном коде',a:['А1','0AAh','1A','81','A3'],e:'161 = 10·16 + 1.'},
 {q:'Число 12 в восьмеричном коде',a:['14','11','13','18','42'],e:'12 = 1·8 + 4.'},
 {q:'Десятичное число 89 в шестнадцатеричном коде',a:['59','123','45','950','ВС'],e:'89 = 5·16 + 9.'},
 {q:'Чему равна сумма двоичных чисел 10010+1001111',a:['1100001','00001111','10101010','11111000','11111111'],e:'18 + 79 = 97 = 1100001.'},
 {q:'Какому десятичному числу равна сумма двоичных чисел 1111+00001111?',a:['30','198','21','255','321'],e:'15 + 15 = 30.'},
 {q:'Какому десятичному числу равна сумма шестнадцатеричных чисел AA и 20?',a:['202','115','198','242','255'],e:'170 + 32 = 202.'},
 {q:'Шестнадцатеричное число 50h в двоичном виде:',a:['1010000','00011100','01010101','11001111','11110000'],e:'5 = 101, 0 = 0000 → 101 0000.'},
 {q:'Десятичное число 127 в шестнадцатеричной системе счисления – это:',a:['7F','111','150','35','FF'],e:'127 = 7·16 + 15.'}
],pool:[
 {q:'Сколько бит в байте?',a:['8','4','16','2','10'],e:'Байт = 8 бит.'},
 {q:'Формула максимального беззнакового числа из N бит:',a:['2ᴺ − 1','2ᴺ','2ᴺ⁻¹','2ᴺ⁻¹ − 1','N²'],e:'Все N бит = 1.'},
 {q:'Диапазон N-битного знакового числа в доп. коде:',a:['от −2ᴺ⁻¹ до 2ᴺ⁻¹ − 1','от −2ᴺ до 2ᴺ','от 0 до 2ᴺ − 1','от −2ᴺ⁻¹ до 2ᴺ⁻¹','от −(2ᴺ − 1) до 2ᴺ − 1'],e:'Отрицательных на одно больше.'},
 {q:'Как получить дополнительный код отрицательного числа?',a:['инвертировать биты модуля и прибавить 1','только инвертировать биты','поставить 1 в старший бит','вычесть 1 и инвертировать знак','записать модуль справа налево'],e:'Инверсия + 1.'},
 {q:'Код −5 в 8-битном дополнительном коде:',a:['11111011','10000101','11111010','00000101','11110101'],e:'256 − 5 = 251 = FBh.'},
 {q:'Чем прямой код отличается от дополнительного?',a:['в прямом знак + модуль и два нуля, в дополнительном один ноль','ничем','прямой только для отрицательных','дополнительный длиннее','в дополнительном нет знака'],e:'Прямой: +0 и −0.'},
 {q:'10 + 7 в 4-битной беззнаковой арифметике даёт:',a:['0001 и перенос','10001 без переноса','1111','0111','ошибку процессора'],e:'17 − 16 = 1, пятый бит уходит в перенос.'},
 {q:'Перенос (CF) важен для чисел:',a:['беззнаковых','знаковых','вещественных','только отрицательных','только чётных'],e:'Для знаковых смотрят OF.'},
 {q:'Знаковое переполнение — это когда:',a:['сложили два числа одного знака и получили другой знак','был перенос из старшего бита','результат равен 0','результат отрицательный','числа разного знака'],e:'Например 127 + 1 = −128 в байте.'},
 {q:'В 8 битах 127 + 1 как знаковые даёт:',a:['−128 (переполнение)','128','0','−1','127'],e:'0111 1111 + 1 = 1000 0000.'},
 {q:'Вычитание A − B в процессоре выполняется как:',a:['A + доп. код B','A − B отдельной схемой','B − A','A · B','A ⊕ B'],e:'Поэтому нужен только сумматор.'},
 {q:'Код FFh как знаковый байт равен:',a:['−1','255','−127','−255','0'],e:'256 − 255 = 1 → −1.'},
 {q:'Двоичное 1101 в десятичной системе:',a:['13','11','14','9','15'],e:'8 + 4 + 1.'},
 {q:'Одна шестнадцатеричная цифра соответствует:',a:['4 битам','3 битам','8 битам','2 битам','16 битам'],e:'16 = 2⁴.'},
 {q:'Одна восьмеричная цифра соответствует:',a:['3 битам','4 битам','8 битам','2 битам','1 биту'],e:'8 = 2³.'},
 {q:'Минимальное знаковое 16-битное число:',a:['−32768','−32767','−65535','−65536','0'],e:'−2¹⁵.'},
 {q:'Сколько разных значений хранит 4-битное число?',a:['16','15','8','4','32'],e:'2⁴.'},
 {q:'Старший бит в знаковом числе означает:',a:['знак (1 — минус)','чётность','перенос','переполнение','ноль'],e:'Sign bit.'},
 {q:'Число −1 в 16-битном доп. коде:',a:['FFFFh','8001h','0001h','7FFFh','FFFEh'],e:'Все единицы.'},
 {q:'Перевод 25 в двоичную систему:',a:['11001','10011','11010','10101','11101'],e:'16 + 8 + 1.'}
]},
t2:{base:[
 {q:'Сколько бит отводится под хранение порядка в формате половинной точности (Half precision)?',a:['5','14','16','32','8'],e:'Half: 1 + 5 + 10.'},
 {q:'Сколько бит отводится под хранение порядка в формате одинарной точности (коротком вещественном типе, Single)?',a:['8','10','14','16','32'],e:'Single: 1 + 8 + 23.'},
 {q:'Сколько бит отводится под хранение короткого вещественного числа (формат одинарной точности)?',a:['32','10','14','16','4'],e:'4 байта.'},
 {q:'Сколько бит отводится под хранение вещественного числа в формате половинной точности (Half)?',a:['16','10','14','32','4'],e:'2 байта.'},
 {q:'Сколько бит отводится под хранение длинного вещественного числа (формат двойной точности, Double)?',a:['64','10','16','4','8'],e:'8 байт.'},
 {q:'Сколько бит отводится под хранение порядка в длинном вещественном типе (формат двойной точности, Double)?',a:['11','14','16','32','8'],e:'Double: 1 + 11 + 52.'},
 {q:'При хранении вещественных чисел старший бит отвечает за:',a:['знак числа','количество знаков после запятой','порядок без смещения','размер мантиссы','смещение порядка'],e:'S — первый бит.'},
 {q:'Смещение (сдвиг) порядка для коротких вещественных чисел (формат одинарной точности) равно:',a:['127','1023','15','255','256'],e:'2⁷ − 1.'},
 {q:'Смещение (сдвиг) порядка для вещественных чисел в формате половинной точности равно:',a:['15','1023','128','255','256'],e:'2⁴ − 1.'},
 {q:'Смещение (сдвиг) порядка для длинных вещественных чисел (формат двойной точности) равно:',a:['1023','1024','127','128','256'],e:'2¹⁰ − 1.'},
 {q:'Из представленных чисел выберите положительное:',a:['4FA74012','8A83126E','940C4801','BF828F5C','C1212540'],e:'Первая hex-цифра 0–7 → знак 0.'},
 {q:'Из представленных чисел выберите положительное:',a:['6B12A010','AF828F5C','CA200000','F48C4800','FA80026E'],e:'6 = 0110, старший бит 0.'},
 {q:'Из представленных чисел выберите отрицательное:',a:['9FA11264321CED91','4000147AE147AE14','40AAAA64ADFF822C','70C3880CCCDD93C4','7F3062400001A9FC'],e:'9 = 1001, старший бит 1.'},
 {q:'Из представленных чисел выберите отрицательное:',a:['AAF55E353F7CED91','1200147AE987AE14','40C3880CCCDD93C4','6ADE104DD2F1A9FC','7509C764ADFF822C'],e:'A = 1010.'},
 {q:'Сопроцессоры используются для:',a:['операции с плавающей точкой;','Нет верного ответа','ускорения ввода информации на экран;','ускорения обработки данных;','ускорения передачи данных;'],e:'FPU (8087).'}
],pool:[
 {q:'Сколько бит мантиссы хранится в single?',a:['23','24','8','32','52'],e:'24-й бит — скрытая единица.'},
 {q:'Сколько бит мантиссы хранится в double?',a:['52','53','11','64','23'],e:'Плюс скрытый бит.'},
 {q:'Нормализованная двоичная запись — это:',a:['1,M × 2ᵖ','0,M × 2ᵖ','M × 10ᵖ','M без порядка','1 × M'],e:'Перед запятой ровно одна 1.'},
 {q:'Зачем нужен скрытый (неявный) бит?',a:['ведущая 1 всегда есть — её не хранят и выигрывают 1 бит точности','чтобы хранить знак','для NaN','для порядка','для округления'],e:'Экономия бита.'},
 {q:'21,625 в нормализованной двоичной форме:',a:['1,0101101 × 2⁴','1,0101101 × 2⁵','10,101101 × 2³','0,10101101 × 2⁵','1,101 × 2⁴'],e:'10101,101 → 4 сдвига.'},
 {q:'Смещённый порядок для 21,625 в single:',a:['131','127','4','132','123'],e:'4 + 127.'},
 {q:'Код 21,625 в single:',a:['41AD0000','41A00000','C1AD0000','42AD0000','40AD0000'],e:'0 10000011 0101101…'},
 {q:'430F0000h как single равно:',a:['143','15','430','−143','14,3'],e:'1,0001111 × 2⁷.'},
 {q:'C2440000h как single равно:',a:['−49','49','−98','−24,5','194'],e:'S = 1, 1,10001 × 2⁵.'},
 {q:'Почему 0,1 нельзя точно записать в двоичном виде?',a:['в двоичной системе это бесконечная периодическая дробь','потому что 0,1 < 1','из-за знака','мантисса слишком короткая для любых чисел','порядок отрицательный'],e:'0,000110011…'},
 {q:'E = все единицы, M = 0 означает:',a:['бесконечность','ноль','NaN','денормализованное число','максимальное число'],e:'±∞.'},
 {q:'E = все единицы, M ≠ 0 означает:',a:['NaN','бесконечность','ноль','отрицательное число','ошибку записи'],e:'Not a Number.'},
 {q:'E = 0 и M = 0 означает:',a:['±0','NaN','бесконечность','1','минимальное нормализованное'],e:'Два нуля: +0 и −0.'},
 {q:'Зачем порядок хранят со смещением (bias)?',a:['чтобы порядок был неотрицательным и числа сравнивались как целые','чтобы хранить знак','для скрытого бита','для NaN','чтобы увеличить мантиссу'],e:'Упрощает сравнение.'},
 {q:'−7,25 в single:',a:['C0E80000','40E80000','C0F80000','C1E80000','C0E00000'],e:'1 10000001 1101…'},
 {q:'Точность single в десятичных цифрах примерно:',a:['7–8','15–16','3–4','19–20','32'],e:'24 бита ≈ 7 цифр.'},
 {q:'Дробная часть переводится в двоичную систему:',a:['умножением на 2 и записью целых частей','делением на 2 и записью остатков','сдвигом вправо','через hex','делением на 10'],e:'0,625×2 = 1,25 → 1…'},
 {q:'Временный (extended) формат x87 занимает:',a:['80 бит (10 байт)','64 бит','128 бит','32 бит','48 бит'],e:'Порядок 15, мантисса 64 с явным битом.'}
]},
t3:{base:[
 {q:'Логические элементы И, ИЛИ, И-НЕ, ИЛИ-НЕ, исключающее ИЛИ называются:',a:['Вентилями','Большими интегральными микросхемами','Все вышеперечисленное верно','Регистрами','Триггерами'],e:'Вентиль = логический элемент.'},
 {q:'Какая из операций называется ДИЗЪЮНКЦИЕЙ:',a:['ИЛИ','И','ИЛИ-НЕ','исключающее ИЛИ','НЕ'],e:'Дизъюнкция — логическое сложение.'},
 {q:'Какая из операций называется КОНЪЮНКЦИЕЙ',a:['И','ИЛИ','ИЛИ-НЕ','исключающее ИЛИ','НЕ'],e:'Конъюнкция — логическое умножение.'},
 {q:'Какая из операций называется сложением по модулю 2',a:['исключающее ИЛИ','И','ИЛИ','ИЛИ-НЕ','НЕ'],e:'XOR: 1 + 1 = 0.'},
 {q:'Какому логическому элементу (вентилю) соответствует данная таблица истинности: A B → Выход: 0 0 → 0; 0 1 → 1; 1 0 → 1; 1 1 → 0',a:['исключающее ИЛИ','И','ИЛИ','ИЛИ-НЕ','НЕ'],e:'1 при разных входах.'},
 {q:'Какому логическому элементу (вентилю) соответствует данная таблица истинности: A B → Выход: 0 0 → 0; 0 1 → 0; 1 0 → 0; 1 1 → 1',a:['И','ИЛИ','ИЛИ-НЕ','исключающее ИЛИ','НЕ'],e:'1 только при двух единицах.'},
 {q:'Какому логическому элементу (вентилю) соответствует данная таблица истинности: A B → Выход: 0 0 → 1; 0 1 → 0; 1 0 → 0; 1 1 → 0',a:['ИЛИ-НЕ','И','ИЛИ','исключающее ИЛИ','НЕ'],e:'1 только при двух нулях.'},
 {q:'Какая операция истинна только тогда, когда ВСЕ входы равны 1? (из лекции)',a:['И','ИЛИ','НЕ','Исключающее ИЛИ','Импликация'],e:'AND.'},
 {q:'Какая операция выполняется первой при отсутствии скобок? (из лекции)',a:['Инверсия','Дизъюнкция','Конъюнкция','Импликация','Эквивалентность'],e:'НЕ → И → ИЛИ.'},
 {q:'Каков результат операции ИЛИ-НЕ (NOR) при A=0, B=0? (из лекции)',a:['1','0','Не определено','A','B'],e:'¬(0+0) = 1.'},
 {q:'В каком случае логическая импликация A → B принимает значение 0? (из лекции)',a:['A=1, B=0','A=0, B=0','A=0, B=1','A=1, B=1','Ни в каком'],e:'Из истины ложь не следует.'},
 {q:'Для вентиля XOR (2 входа) выход равен 1, если: (из лекции)',a:['Входы различны','Оба входа 1','Оба входа 0','Входы одинаковы','Любые входы'],e:'Нечётное число единиц.'}
],pool:[
 {q:'Закон де Моргана:',a:['¬(A·B) = Ā + B̄','¬(A·B) = Ā · B̄','¬(A+B) = Ā + B̄','A·B = A + B','¬A = A'],e:'Черта рвётся — знак меняется.'},
 {q:'¬(A + B) по Де Моргану равно:',a:['Ā · B̄','Ā + B̄','A · B','A ⊕ B','¬A + B'],e:'NOR = AND инверсий.'},
 {q:'Почему NAND называют универсальным элементом?',a:['из него одного можно собрать любую логическую функцию','он самый быстрый','у него три входа','он не потребляет ток','он хранит бит'],e:'NOT = NAND(A,A) и т. д.'},
 {q:'NOT A через NAND:',a:['NAND(A, A)','NAND(A, 0)','NAND(A, Ā)','NOR(A, 1)','AND(A, A)'],e:'¬(A·A) = Ā.'},
 {q:'Сколько строк в таблице истинности для 3 входов?',a:['8','3','6','9','16'],e:'2³.'},
 {q:'Сколько строк в таблице истинности для 4 входов?',a:['16','8','4','32','12'],e:'2⁴.'},
 {q:'A + A·B упрощается до:',a:['A','B','A·B','A + B','1'],e:'Поглощение.'},
 {q:'A·Ā равно:',a:['0','1','A','Ā','A²'],e:'Закон дополнения.'},
 {q:'A + Ā равно:',a:['1','0','A','Ā','2A'],e:'Закон дополнения.'},
 {q:'A′B + A′B′ упрощается до:',a:['A′','B′','A','B','1'],e:'A′(B + B′) = A′.'},
 {q:'AB′ + AB упрощается до:',a:['A','B','AB','A + B','0'],e:'Склеивание.'},
 {q:'Функция «хотя бы два из трёх входов = 1»:',a:['AB + BC + AC','A + B + C','ABC','A ⊕ B ⊕ C','A(B + C)'],e:'Функция большинства.'},
 {q:'Эквивалентность A ≡ B равна 1, когда:',a:['A и B одинаковы','A и B разные','A = 1','B = 0','всегда'],e:'Это XNOR.'},
 {q:'Чем XOR отличается от OR?',a:['при A = B = 1 XOR даёт 0, а OR даёт 1','ничем','XOR имеет 3 входа','OR даёт 0 при двух единицах','XOR — это NOT'],e:'Единственное различие — строка 11.'},
 {q:'Y = Ā·B + C: какой вентиль ближе всего ко входу A?',a:['НЕ','ИЛИ','И','XOR','NAND'],e:'Инверсия — высший приоритет.'},
 {q:'Кружок на выходе вентиля на схеме означает:',a:['инверсию (НЕ)','землю','вход тактов','соединение проводов','усилитель'],e:'AND + кружок = NAND.'},
 {q:'Какой инструмент EWB строит таблицу истинности по схеме?',a:['Logic Converter','Word Generator','Oscilloscope','Bode Plotter','Multimeter'],e:'Логический преобразователь.'},
 {q:'Логический сигнал 1 в цифровой схеме — это:',a:['высокий уровень напряжения','отсутствие тока','отрицательное напряжение','переменный ток','земля'],e:'Истина / High.'}
]},
t4:{base:[],pool:[
 {q:'ДНФ — это:',a:['сумма (ИЛИ) произведений (И)','произведение сумм','только инверсии','одна конъюнкция','таблица истинности'],e:'Sum of Products.'},
 {q:'КНФ — это:',a:['произведение (И) сумм (ИЛИ)','сумма произведений','одна дизъюнкция','список минтермов','карта Карно'],e:'Product of Sums.'},
 {q:'Чем СДНФ отличается от обычной ДНФ?',a:['в каждом слагаемом есть все переменные','она короче','в ней нет инверсий','в ней только ИЛИ','ничем'],e:'Совершенная = все переменные в каждом члене.'},
 {q:'Минтерм — это:',a:['конъюнкция всех переменных, равная 1 ровно на одной строке','дизъюнкция всех переменных','минимальная группа на карте','самая короткая формула','ноль функции'],e:'Элементарное произведение.'},
 {q:'Макстерм — это:',a:['дизъюнкция всех переменных, равная 0 ровно на одной строке','конъюнкция всех переменных','максимальная группа','единица функции','число строк'],e:'Элементарная сумма.'},
 {q:'СДНФ строят по строкам таблицы, где F равна:',a:['1','0','x','любой','половине'],e:'По единицам.'},
 {q:'СКНФ строят по строкам таблицы, где F равна:',a:['0','1','x','любой','максимуму'],e:'По нулям.'},
 {q:'В СДНФ строка A=0, B=1, C=1 даёт минтерм:',a:['ĀBC','AB̄C̄','A + B̄ + C̄','ABC','Ā + B + C'],e:'0 → с чертой.'},
 {q:'В СКНФ строка A=0, B=1, C=1 даёт макстерм:',a:['(A + B̄ + C̄)','ĀBC','(Ā + B + C)','AB̄C̄','(A + B + C)'],e:'В СКНФ наоборот: 1 → с чертой.'},
 {q:'Порядок столбцов в карте Карно:',a:['00, 01, 11, 10 (код Грея)','00, 01, 10, 11','11, 10, 01, 00','0, 1, 2, 3','любой'],e:'Соседи отличаются одним битом.'},
 {q:'Допустимый размер группы на карте Карно:',a:['1, 2, 4, 8…','3','6','5','любой'],e:'Степень двойки.'},
 {q:'Группа из 4 клеток на карте 4 переменных убирает:',a:['2 переменные','1 переменную','3 переменные','4 переменные','ничего'],e:'2² = 4.'},
 {q:'Минимизируйте Σ(1,3,5,7) для A,B,C:',a:['C','A','AB + C','Ā','B + C'],e:'Все строки с C = 1.'},
 {q:'Σ(1,3,5,7,10,11,14,15) для A,B,C,D минимизируется в:',a:['ĀD + AC','AD + ĀC','A + D','CD + AB','ĀC + AD'],e:'Две четвёрки.'},
 {q:'Могут ли группы на карте Карно пересекаться?',a:['да, клетка может входить в несколько групп','нет, никогда','только по диагонали','только в 2-переменных картах','только если групп две'],e:'Это разрешено правилами.'},
 {q:'Крайние столбцы карты Карно являются:',a:['соседними (карта «сворачивается»)','несвязанными','запрещёнными','только для нулей','диагональными'],e:'00 и 10 отличаются одним битом.'},
 {q:'Схема по ДНФ: на первом уровне стоят элементы',a:['И, на втором — ИЛИ','ИЛИ, на втором — И','НЕ, на втором — XOR','только NAND','триггеры'],e:'Структура И → ИЛИ.'},
 {q:'Зачем минимизировать логическую функцию?',a:['чтобы схема содержала меньше вентилей','чтобы изменить таблицу истинности','чтобы добавить память','чтобы увеличить задержку','чтобы получить СКНФ'],e:'Таблица остаётся той же.'},
 {q:'F = x̄₁x̄₂ + x₁x₂ — это функция:',a:['XNOR (эквивалентность)','XOR','NAND','NOR','OR'],e:'1 при одинаковых входах.'},
 {q:'A(A + B)(A + B + C) упрощается до:',a:['A','A + B','ABC','A + C','1'],e:'Поглощение.'},
 {q:'(ABC + ¬(ABC)) ⊕ C равно:',a:['C̄','C','1','0','ABC'],e:'X + X̄ = 1, 1 ⊕ C = C̄.'},
 {q:'¬((A + C)(B + D)) по Де Моргану:',a:['ĀC̄ + B̄D̄','(Ā + C̄)(B̄ + D̄)','AC + BD','Ā + B̄ + C̄ + D̄','ABCD'],e:'¬(XY) = X̄ + Ȳ.'}
]},
t5:{base:[
 {q:'Двоичный полусумматор - это',a:['устройство, вычисляющее сумму в разряде единиц','программа, решающая прикладную задачу','программа, управляющая работой внешних устройств','устройство, вычисляющее сумму в разряде двоек, четверок и т.д.','устройство, управляющее работой внешних устройств'],e:'Не учитывает перенос снизу.'},
 {q:'Двоичный полный сумматор - это',a:['устройство, вычисляющее сумму в разряде двоек, четверок и т.д.','программа, решающая прикладную задачу','программа, управляющая работой внешних устройств','устройство, вычисляющее сумму в разряде единиц','устройство, управляющее работой внешних устройств'],e:'Учитывает Cin.'},
 {q:'Устройство, которое осуществляет выборку одного из нескольких входов и подключает его к своему выходу, в зависимости от состояния двоичного кода, т.е. устройство, преобразующее параллельный код в последовательный:',a:['мультиплексор','дешифратор','сумматор','счетчик','шифратор'],e:'MUX.'},
 {q:'Шифратор – это:',a:['Комбинационная схема, имеющая 2ⁿ входов и n выходов, принимающая на входы унитарный код','Комбинационная схема, имеющая n входов и 2ⁿ выходов и преобразующая двоичный код на своих входах в унитарный код на выходах','Память небольшого объёма с высокой скоростью работы','Технология, позволяющая процессору обрабатывать более одной команды одновременно','Устройство, которое осуществляет выборку одного из нескольких входов и подключает его к своему выходу'],e:'Encoder: 2ⁿ → n.'},
 {q:'Дешифратор – это:',a:['Комбинационная схема, имеющая n входов и 2ⁿ выходов и преобразующая двоичный код на своих входах в унитарный код на выходах','Комбинационная схема, имеющая 2ⁿ входов и n выходов, принимающая на входы унитарный код','Память небольшого объёма с высокой скоростью работы','Технология, позволяющая процессору обрабатывать более одной команды одновременно','Устройство, преобразующее параллельный код в последовательный'],e:'Decoder: n → 2ⁿ.'},
 {q:'К комбинационным логическим схемам относятся',a:['Шифраторы, дешифраторы, мультиплексоры, сумматоры','Асинхронные счетчики','запоминающие устройства','реверсивные счетчики','Регистры'],e:'Без памяти.'},
 {q:'Мультиплексор - это',a:['устройство, преобразующее параллельный код в последовательный','Программа, управляющая работой внешнего устройства','Устройство для сложения двоичных разрядов','Устройство, преобразующее последовательный код в параллельный','Устройство, управляющее работой внешнего устройства'],e:'Много входов → один выход.'},
 {q:'Демультиплексор - это',a:['Устройство, преобразующее последовательный код в параллельный','Программа, управляющая работой внешнего устройства','Устройство для сложения двоичных разрядов','устройство, преобразующее параллельный код в последовательный','Устройство, управляющее работой внешнего устройства'],e:'Один вход → много выходов.'},
 {q:'Какой из двоичных кодов является унитарным (позиционным), то есть содержит ровно одну единицу',a:['10000000','00001111','10101010','11100000','11111111'],e:'Одна единица.'},
 {q:'Какие логические элементы необходимы для создания дешифратора 2 в 4?',a:['2 элемента NOT и 4 элемента AND','2 элемента AND и 4 элемента NOT','2 элемента AND и 4 элемента OR','2 элемента NOT и 4 элемента OR','3 элемента AND и 2 элемента OR'],e:'Инверсии двух входов + 4 конъюнкции.'}
],pool:[
 {q:'Сумма полусумматора:',a:['Σ = A ⊕ B','Σ = A · B','Σ = A + B','Σ = ¬(A·B)','Σ = Ā'],e:'XOR.'},
 {q:'Перенос полусумматора:',a:['C = A · B','C = A ⊕ B','C = A + B','C = Ā·B','C = 1'],e:'AND.'},
 {q:'Сумма полного сумматора:',a:['A ⊕ B ⊕ Cin','A·B·Cin','A + B + Cin','(A⊕B)·Cin','AB + Cin'],e:'XOR трёх.'},
 {q:'Перенос полного сумматора:',a:['AB + Cin(A ⊕ B)','A ⊕ B ⊕ Cin','A·B·Cin','A + B','Cin'],e:'Две или три единицы.'},
 {q:'Полный сумматор собирается из:',a:['двух полусумматоров и элемента ИЛИ','трёх полусумматоров','двух XOR','одного полусумматора и НЕ','четырёх AND'],e:'ПС + ПС + OR.'},
 {q:'Полный сумматор: A=1, B=1, Cin=1 → Σ и Co:',a:['Σ=1, Co=1','Σ=0, Co=1','Σ=1, Co=0','Σ=0, Co=0','Σ=3'],e:'1+1+1 = 11₂.'},
 {q:'Сколько управляющих бит у MUX 8:1?',a:['3','8','2','4','1'],e:'2³ = 8.'},
 {q:'Сколько управляющих бит у MUX 16:1?',a:['4','16','8','2','5'],e:'2⁴ = 16.'},
 {q:'MUX 4:1, S1S0 = 10 выбирает вход:',a:['D2','D1','D0','D3','никакой'],e:'10₂ = 2.'},
 {q:'Дешифратор 2:4 при A1A0 = 11 активирует:',a:['Y3','Y0','Y1','Y2','все выходы'],e:'11₂ = 3.'},
 {q:'Шифратор 4:2 при активном D2 выдаёт:',a:['10','01','11','00','100'],e:'2 = 10₂.'},
 {q:'Сколько MUX 2:1 нужно для MUX 4:1?',a:['3','2','4','1','6'],e:'Два на первом уровне + один.'},
 {q:'Комбинационная схема отличается от последовательностной тем, что',a:['не имеет памяти','имеет тактовый вход','хранит состояние','работает только с числами','медленнее'],e:'Выход зависит только от входов.'},
 {q:'Частичное произведение двух битов вычисляется элементом:',a:['AND','OR','XOR','NOT','NOR'],e:'Таблица AND = таблица умножения.'},
 {q:'111₂ × 101₂ равно:',a:['100011','110101','111111','101011','35₂'],e:'7 × 5 = 35.'},
 {q:'Сколько полных сумматоров нужно для 4-разрядного сложения (плюс 1 полусумматор)?',a:['3','4','2','5','8'],e:'Младший — полусумматор.'},
 {q:'Где в процессоре стоит мультиплексор?',a:['на входе АЛУ для выбора регистра-источника','в блоке питания','в мониторе','в жёстком диске','в клавиатуре'],e:'Выбор операнда.'},
 {q:'27 + 30 на 7-разрядном сумматоре даёт:',a:['0111001','0111011','1000111','0110111','1011001'],e:'57 = 0111001.'}
]},
t6:{base:[
 {q:'К последовательностным логическим схемам относятся',a:['Запоминающие устройства','дешифраторы','мультиплексоры, сумматоры','сумматоры','шифраторы'],e:'У них есть память.'},
 {q:'Какой из триггеров называется триггером с задержкой',a:['D-триггер','JK-триггер','RS-триггер','T-триггер','Все перечисленные'],e:'D = Delay.'},
 {q:'Какой из триггеров имеет режим переключения',a:['T-триггер','D-триггер','JK-триггер','RS-триггер','Все перечисленные'],e:'T = Toggle (в базе правильный ответ именно T).'}
],pool:[
 {q:'Триггер хранит:',a:['1 бит','1 байт','1 слово','2 бита','4 бита'],e:'Два устойчивых состояния.'},
 {q:'Чем триггер отличается от комбинационного элемента?',a:['имеет память (обратную связь)','имеет больше входов','работает быстрее','не потребляет ток','у него нет выходов'],e:'Выход зависит от прошлого.'},
 {q:'RS на ИЛИ-НЕ: запрещённая комбинация —',a:['S = 1, R = 1','S = 0, R = 0','S = 1, R = 0','S = 0, R = 1','такой нет'],e:'Q = Q̄ = 0.'},
 {q:'RS на И-НЕ: запрещённая комбинация —',a:['S̄ = 0, R̄ = 0','S̄ = 1, R̄ = 1','S̄ = 1, R̄ = 0','S̄ = 0, R̄ = 1','такой нет'],e:'Входы активны нулём.'},
 {q:'RS на ИЛИ-НЕ при S = 0, R = 0:',a:['хранит предыдущее состояние','Q = 1','Q = 0','переключается','запрещено'],e:'Режим хранения.'},
 {q:'Уравнение D-триггера:',a:['Q(t+1) = D','Q(t+1) = Q̄','Q(t+1) = D·Q','Q(t+1) = J·Q̄ + K̄·Q','Q(t+1) = 0'],e:'Запоминает D.'},
 {q:'JK-триггер при J = K = 1:',a:['переключается в противоположное состояние','запрещён','хранит','устанавливается в 1','сбрасывается'],e:'Toggle.'},
 {q:'Уравнение JK-триггера:',a:['Q⁺ = JQ̄ + K̄Q','Q⁺ = J + K','Q⁺ = J·K','Q⁺ = D','Q⁺ = T ⊕ Q'],e:'Из лекции.'},
 {q:'T-триггер при T = 1 делит частоту на:',a:['2','4','1','8','3'],e:'Два импульса — один период.'},
 {q:'Как сделать T-триггер из D-триггера?',a:['соединить D с Q̄','соединить D с Q','подать D = 1','подать D = 0','убрать тактовый вход'],e:'Каждый такт запоминает инверсию.'},
 {q:'Как сделать T-триггер из JK?',a:['J = K = 1 (или J = K = T)','J = 1, K = 0','J = 0, K = 1','J = K = 0','J = Q'],e:'Режим toggle.'},
 {q:'Срабатывание по фронту означает:',a:['реакция только в момент перехода тактового сигнала 0→1 (или 1→0)','реакция всё время, пока C = 1','реакция без тактов','реакция на любые входы','реакция только при C = 0'],e:'Flip-flop.'},
 {q:'Защёлка (latch) — это триггер с управлением:',a:['по уровню','по фронту','без управления','по спаду','только асинхронным'],e:'Прозрачна при C = 1.'},
 {q:'Setup time — это время стабильности входа:',a:['до фронта такта','после фронта','между тактами','всё время работы','до включения питания'],e:'t_SU.'},
 {q:'Метастабильность — это:',a:['зависание выхода между 0 и 1','быстрое переключение','отсутствие питания','запрещённая комбинация RS','режим хранения'],e:'Нарушение setup/hold.'},
 {q:'Из D-триггеров строят:',a:['регистры','мультиплексоры','шифраторы','сумматоры','дешифраторы'],e:'Группа D-триггеров хранит слово.'},
 {q:'Ячейка SRAM — это по сути:',a:['триггер из 6 транзисторов','конденсатор','ферритовое кольцо','диод','резистор'],e:'Поэтому без регенерации.'},
 {q:'Асинхронные входы PR и CLR действуют:',a:['сразу, без тактового сигнала','только по фронту','только при C = 1','никогда','только вместе с D'],e:'Начальная установка.'},
 {q:'Какой инструмент EWB показывает временные диаграммы?',a:['Logic Analyzer','Word Generator','Logic Converter','Multimeter','Function Generator'],e:'Логический анализатор.'},
 {q:'Парафазные выходы триггера — это:',a:['Q и Q̄','S и R','J и K','C и D','PR и CLR'],e:'Прямой и инверсный.'}
]},
t7:{base:[],pool:[
 {q:'Цифровой счётчик — это:',a:['устройство, меняющее двоичный код при поступлении импульсов','устройство сложения двух чисел','шифратор','дешифратор','регистр флагов'],e:'Импульс → следующее состояние.'},
 {q:'Модуль счёта — это:',a:['число различных состояний счётчика','число триггеров','частота такта','максимальное число + 2','число входов'],e:'M.'},
 {q:'Сколько состояний у 3-разрядного двоичного счётчика?',a:['8','3','6','7','9'],e:'2³.'},
 {q:'Сколько состояний у счётчика из 4 триггеров?',a:['16','4','8','15','32'],e:'2⁴.'},
 {q:'Сколько триггеров нужно для MOD-10?',a:['4','3','10','5','2'],e:'2³ = 8 < 10 ≤ 16.'},
 {q:'Сколько триггеров нужно для MOD-12?',a:['4','3','12','6','5'],e:'Из лабы.'},
 {q:'Асинхронный (ripple) счётчик: такт подаётся',a:['только на первый триггер, остальные — от выхода предыдущего','на все триггеры сразу','только на последний','через дешифратор','на J и K'],e:'Отсюда «волна».'},
 {q:'Синхронный счётчик: такт подаётся',a:['на все триггеры одновременно','только на первый триггер','поочерёдно','через счётчик','не подаётся'],e:'Общий CLK.'},
 {q:'Почему в асинхронном счётчике возникают задержки?',a:['каждый триггер ждёт переключения предыдущего, задержки складываются','из-за общего такта','из-за элемента И','из-за большого модуля','их нет'],e:'n × t_зад.'},
 {q:'Главное преимущество синхронного счётчика:',a:['все разряды меняются одновременно, нет ложных кодов','меньше элементов','не нужен такт','проще схема','считает только вниз'],e:'Быстрее и надёжнее.'},
 {q:'Синхронный счётчик: условие для второго триггера',a:['J1 = K1 = Q0','J1 = K1 = 1','J1 = K1 = Q̄0','J1 = Q0, K1 = 1','J1 = K1 = Q1'],e:'Переключается, когда Q0 = 1.'},
 {q:'Синхронный счётчик: условие для третьего триггера',a:['J2 = K2 = Q0·Q1','J2 = K2 = Q1','J2 = K2 = Q0 + Q1','J2 = K2 = 1','J2 = K2 = Q2'],e:'Нужен элемент AND.'},
 {q:'Декадный счётчик сбрасывается при коде',a:['1010','1001','1111','1000','0000'],e:'Десять.'},
 {q:'Какие выходы MOD-10 подают на элемент сброса?',a:['Q3 и Q1','Q3 и Q0','Q2 и Q1','Q0 и Q1','все четыре'],e:'1010 → Q3 = Q1 = 1.'},
 {q:'Для MOD-13 на элемент сброса подают выходы',a:['Q3, Q2, Q0','Q3, Q1, Q0','Q2, Q1, Q0','Q3, Q2','Q3, Q0'],e:'13 = 1101.'},
 {q:'Вычитающий асинхронный счётчик получают, подавая на такт следующего триггера',a:['инверсный выход Q̄ предыдущего','прямой выход Q','общий CLK','J предыдущего','питание +5 В'],e:'Или берут показания с Q̄.'},
 {q:'Q0 в 3-разрядном счётчике меняется',a:['на каждом такте','каждые 2 такта','каждые 4 такта','каждые 8 тактов','никогда'],e:'Младший разряд.'},
 {q:'Q2 в 3-разрядном счётчике имеет частоту',a:['f/8','f/2','f/4','f','f/3'],e:'Каждый каскад делит на 2.'},
 {q:'Сколько разных значений принимает счётчик MOD-10?',a:['10 (от 0 до 9)','11','9','16','8'],e:'0…9.'},
 {q:'Счётчик на D-триггерах (2 разряда): D0 = ',a:['¬Q0','Q0','Q1','Q0 ⊕ Q1','1'],e:'Из лекции; D1 = Q1 ⊕ Q0.'},
 {q:'Счётчик команд (PC) процессора отличается от простого счётчика тем, что',a:['в него можно загрузить новый адрес при переходе','он считает только вниз','он асинхронный','у него один триггер','он не хранит число'],e:'Регистр с логикой изменения.'},
 {q:'Чем опасен асинхронный сброс по коду M?',a:['код M кратко появляется на выходах («иголка»)','счётчик перестаёт считать','нужен новый такт','сбрасывается только Q0','ничем'],e:'Переходный процесс.'}
]}});

/* ======================= EWB-окна: схема, моделирование, «как собрать» ======================= */
const EWB_ICONS={
 new:'<svg viewBox="0 0 24 24"><path d="M5 2h10l4 4v16H5z" fill="#fff" stroke="#333"/><path d="M15 2v4h4" fill="none" stroke="#333"/></svg>',
 open:'<svg viewBox="0 0 24 24"><path d="M2 6h7l2 2h9v12H2z" fill="#f4c542" stroke="#8a6d00"/><path d="M2 20l3-9h18l-3 9z" fill="#ffe08a" stroke="#8a6d00"/></svg>',
 save:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="#2b4c9a" stroke="#1a2f66"/><rect x="7" y="3" width="10" height="7" fill="#fff"/><rect x="6" y="14" width="12" height="7" fill="#ddd"/></svg>',
 copy:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="11" height="13" fill="#fff" stroke="#333"/><rect x="9" y="8" width="11" height="13" fill="#fff" stroke="#333"/></svg>',
 rot:'<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 108 8" fill="none" stroke="#333" stroke-width="2"/><path d="M12 0v8l5-4z" fill="#333"/></svg>',
 zin:'<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="#e8f1ff" stroke="#333" stroke-width="2"/><path d="M15 15l7 7" stroke="#333" stroke-width="3"/><path d="M6 10h8M10 6v8" stroke="#333" stroke-width="2"/></svg>',
 zout:'<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="#e8f1ff" stroke="#333" stroke-width="2"/><path d="M15 15l7 7" stroke="#333" stroke-width="3"/><path d="M6 10h8" stroke="#333" stroke-width="2"/></svg>',
 help:'<svg viewBox="0 0 24 24"><text x="7" y="20" style="font:bold 20px Arial;fill:#1a3fa0">?</text></svg>'};
const EWB_BINS=[
 {k:'sources',t:'Sources',i:'<svg viewBox="0 0 26 18"><path d="M13 2v14M6 6h14M9 10h8M11 14h4" stroke="#000" stroke-width="1.5"/></svg>'},
 {k:'basic',t:'Basic',i:'<svg viewBox="0 0 26 18"><path d="M2 9h22" stroke="#000"/><circle cx="13" cy="9" r="3"/></svg>'},
 {k:'ind',t:'Indicators',i:'<svg viewBox="0 0 26 18"><circle cx="13" cy="9" r="7" fill="#f33" stroke="#000"/></svg>'},
 {k:'gates',t:'Logic Gates',i:'<svg viewBox="0 0 26 18"><path d="M6 2h7a7 7 0 010 14H6z" fill="#fff" stroke="#000" stroke-width="1.3"/><path d="M0 6h6M0 12h6M20 9h6" stroke="#000"/></svg>'},
 {k:'digital',t:'Digital',i:'<svg viewBox="0 0 26 18"><rect x="5" y="1" width="16" height="16" fill="#fff" stroke="#000"/><text x="8" y="13" style="font:bold 9px Arial">FF</text></svg>'},
 {k:'inst',t:'Instruments',i:'<svg viewBox="0 0 26 18"><rect x="1" y="2" width="24" height="14" fill="#ccc" stroke="#000"/><path d="M4 12h3V6h4v6h4V6h4v6h3" fill="none" stroke="#000"/></svg>'}];
const EWB_BIN_OF={sw:'basic',conn:'basic',vcc:'sources',gnd:'sources',clk:'sources',lamp:'ind',hex:'ind',gate:'gates',ha:'digital',fa:'digital',jk:'digital',d:'digital',lc:'inst',la:'inst',wg:'inst'};
const EWB_NAME={sw:'Switch (переключатель)',vcc:'+5V (Vcc)',gnd:'Ground (земля)',clk:'Clock (тактовый генератор)',lamp:'Red Probe (лампочка)',hex:'Decoded Seven-Segment Display',ha:'Half-Adder',fa:'Full-Adder',jk:'JK Flip-Flop',d:'D Flip-Flop',lc:'Logic Converter',la:'Logic Analyzer',wg:'Word Generator'};

/* ---- геометрия деталей ---- */
function ewbGeom(c){ const p=c.p||{};
  switch(c.type){
    case 'gate':{ if(p.k==='not'||p.k==='buf') return {w:48,h:24,pins:{i0:[0,12,'in'],o:[48,12,'out']}};
      const n=p.n||2, h=Math.max(30,n*12+6), pins={o:[56,h/2,'out']}; for(let i=0;i<n;i++) pins['i'+i]=[0,Math.round(h/(n+1)*(i+1)),'in']; return {w:56,h,pins}; }
    case 'sw': return {w:48,h:34,pins:{o:[48,15,'out']}};
    case 'vcc': return {w:24,h:26,pins:{o:[12,26,'out']}};
    case 'gnd': return {w:24,h:22,pins:{o:[12,0,'out']}};
    case 'clk': return {w:50,h:36,pins:{o:[50,18,'out']}};
    case 'conn': return {w:8,h:8,pins:{n:[4,4,'out'],i:[4,4,'in']}};
    case 'lamp': return {w:28,h:24,pins:{i:[0,12,'in']}};
    case 'hex': return {w:46,h:70,pins:{b3:[8,70,'in'],b2:[18,70,'in'],b1:[28,70,'in'],b0:[38,70,'in']}};
    case 'ha': return {w:70,h:50,pins:{A:[0,15,'in'],B:[0,35,'in'],S:[70,15,'out'],C:[70,35,'out']}};
    case 'fa': return {w:70,h:60,pins:{A:[0,15,'in'],B:[0,30,'in'],Ci:[0,45,'in'],S:[70,20,'out'],Co:[70,42,'out']}};
    case 'jk': { const as=!!p.async; const y0=as?10:0; return {w:70,h:as?80:60,pins:Object.assign({J:[0,y0+15,'in'],C:[0,y0+30,'in'],K:[0,y0+45,'in'],Q:[70,y0+15,'out'],Qn:[70,y0+45,'out']},as?{PR:[35,0,'in'],CLR:[35,80,'in']}:{})}; }
    case 'd': { const as=!!p.async; const y0=as?10:0; return {w:70,h:as?80:60,pins:Object.assign({D:[0,y0+20,'in'],C:[0,y0+40,'in'],Q:[70,y0+15,'out'],Qn:[70,y0+45,'out']},as?{PR:[35,0,'in'],CLR:[35,80,'in']}:{})}; }
    case 'lc': { const pins={}; 'ABCDEFGH'.split('').forEach((k,i)=>pins[k]=[12+i*18,0,'in']); pins.Out=[162,0,'in']; return {w:172,h:46,pins}; }
    case 'la': { const pins={}; for(let k=0;k<8;k++) pins['c'+k]=[0,10+k*12,'in']; return {w:46,h:106,pins}; }
    case 'wg': { const n=p.n||8, w=Math.max(80,12*n+24), pins={}; for(let k=0;k<n;k++) pins['b'+k]=[w-14-k*12,40,'out']; return {w,h:40,pins}; }
  } return {w:20,h:20,pins:{}}; }
const EWB_T=(x,y,s,o='')=>`<text x="${x}" y="${y}"${o}>${s}</text>`;
const EWB_L=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ld"/>`;
function ewbDraw(c,view){ const p=c.p||{}, g=ewbGeom(c); let s='';
  const lbl=p.label?EWB_T(g.w/2,-5,p.label,' class="lb" text-anchor="middle"'):'';
  switch(c.type){
    case 'gate':{ const k=p.k, inv=['nand','nor','xnor','not'].includes(k), base=k.replace(/^n(and|or)$/,'$1').replace('xnor','xor');
      if(k==='not'||k==='buf'){ s+=EWB_L(0,12,10,12)+`<path class="bd" d="M10,1 L34,12 L10,23 Z"/>`+(inv?`<circle class="bd" cx="37" cy="12" r="3"/>`+EWB_L(40,12,48,12):EWB_L(34,12,48,12)); break; }
      const h=g.h, m=h/2, t=m-15, b=m+15;
      Object.entries(g.pins).forEach(([n,[x,y,d]])=>{ if(d==='in') s+=EWB_L(0,y,base==='and'?12:14,y); });
      if(g.h>30) s+=EWB_L(base==='and'?12:13,Math.min(...Object.values(g.pins).filter(q=>q[2]==='in').map(q=>q[1])),base==='and'?12:13,t)+EWB_L(base==='and'?12:13,b,base==='and'?12:13,Math.max(...Object.values(g.pins).filter(q=>q[2]==='in').map(q=>q[1])));
      if(base==='and') s+=`<path class="bd" d="M12,${t} H29 A15,15 0 0 1 29,${b} H12 Z"/>`;
      else s+=`<path class="bd" d="M10,${t} Q30,${t} 44,${m} Q30,${b} 10,${b} Q18,${m} 10,${t} Z"/>`;
      if(base==='xor') s+=`<path class="ln" d="M5,${t} Q13,${m} 5,${b}"/>`;
      s+= inv?`<circle class="bd" cx="47" cy="${m}" r="3"/>`+EWB_L(50,m,56,m):EWB_L(44,m,56,m); break; }
    case 'sw':{ const on=!!p.on; s+=`<rect class="bd" x="2" y="4" width="38" height="22" rx="2"/>`+EWB_T(7,12,'1',' class="sm"')+EWB_T(7,24,'0',' class="sm"')+`<circle cx="30" cy="15" r="2.5"/><line x1="30" y1="15" x2="14" y2="${on?8:22}" class="lv"/>`+EWB_L(40,15,48,15)+EWB_T(21,34,`Key = ${p.key||p.label||''}`,' class="sm" text-anchor="middle"'); break; }
    case 'vcc': s+=EWB_L(12,12,12,26)+`<path class="ln" d="M4,12 H20"/>`+EWB_T(12,9,'+5V',' class="sm" text-anchor="middle"'); break;
    case 'gnd': s+=EWB_L(12,0,12,10)+`<path class="ln" d="M3,10 H21 M6,14 H18 M9,18 H15"/>`; break;
    case 'clk': s+=`<rect class="bd" x="2" y="6" width="38" height="26"/><path class="ln" d="M7,26 H13 V12 H21 V26 H29 V12 H35"/>`+EWB_L(40,18,50,18)+EWB_T(21,46,p.f||'1 Hz',' class="sm" text-anchor="middle"'); break;
    case 'conn': s+=`<circle cx="4" cy="4" r="3" fill="#000"/>`; break;
    case 'lamp':{ const on=view&&view.on; s+=EWB_L(0,12,12,12)+(on?`<circle cx="20" cy="12" r="13" fill="#ff2a2a" opacity=".25"/>`:'')+`<circle class="bd" cx="20" cy="12" r="8" style="fill:${on?'#ff2a2a':'#fff'}"/>`; break; }
    case 'hex':{ const v=view?view.v:null; s+=`<rect x="2" y="2" width="42" height="58" fill="#222" stroke="#000"/>`+EWB_T(23,46,v==null?'8':v.toString(16).toUpperCase(),` style="font:bold 34px Consolas,monospace;fill:${v==null?'#4a1010':'#ff3030'}" text-anchor="middle"`); [8,18,28,38].forEach(x=>s+=EWB_L(x,60,x,70)); break; }
    case 'ha': case 'fa': case 'jk': case 'd':{ const top=(c.type==='jk'||c.type==='d')&&p.async?10:0, bot=top+((c.type==='fa')?60:(c.type==='ha')?50:60);
      Object.entries(g.pins).forEach(([n,[x,y,dir]])=>{ if(x===0){ const bub=n==='C'&&p.edge==='fall'; s+=EWB_L(0,y,bub?6:12,y)+(bub?`<circle class="bd" cx="9" cy="${y}" r="3"/>`:''); } else if(x===g.w) s+=EWB_L(g.w-12,y,g.w,y); else if(y===0) s+=EWB_L(x,0,x,top-6)+`<circle class="bd" cx="${x}" cy="${top-3}" r="3"/>`; else s+=EWB_L(x,bot+6,x,g.h)+`<circle class="bd" cx="${x}" cy="${bot+3}" r="3"/>`; });
      s+=`<rect class="bd" x="12" y="${top}" width="${g.w-24}" height="${bot-top}"/>`;
      Object.entries(g.pins).forEach(([n,[x,y]])=>{ const nm=n==='Qn'?"Q'":n==='Ci'?'Ci':n;
        if(x===0){ if(n==='C'&&(c.type==='jk'||c.type==='d')) s+=`<path class="ln" d="M12,${y-5} L19,${y} L12,${y+5}"/>`; else s+=EWB_T(15,y+4,nm,' class="pn"'); }
        else if(x===g.w) s+=EWB_T(g.w-15,y+4,nm,' class="pn" text-anchor="end"');
        else if(y===0) s+=EWB_T(x,top+11,nm,' class="sm" text-anchor="middle"'); else s+=EWB_T(x,bot-3,nm,' class="sm" text-anchor="middle"'); });
      if(c.type==='ha') s+=EWB_T(35,30,'½Σ',' class="sm" text-anchor="middle"'); if(c.type==='fa') s+=EWB_T(35,34,'Σ',' class="sm" text-anchor="middle"'); break; }
    case 'lc': s+=`<rect x="0" y="6" width="172" height="40" fill="#e3262b" stroke="#600"/>`; Object.values(g.pins).forEach(([x])=>s+=EWB_L(x,0,x,8)+`<circle cx="${x}" cy="11" r="2.6" fill="#fff" stroke="#600"/>`);
      s+=`<rect x="16" y="18" width="140" height="22" fill="#fff" stroke="#600"/><path class="ln" d="M30,22 h9 a7,7 0 0 1 0,14 h-9 z M24,25 h6 M24,33 h6 M46,29 h5 M62,29 h28 M62,29 l5,-4 M62,29 l5,4 M90,29 l-5,-4 M90,29 l-5,4"/>`+EWB_T(100,35,'A|B',' style="font:bold 13px Arial"'); break;
    case 'la': s+=`<rect x="6" y="0" width="40" height="106" fill="#c8c8c8" stroke="#000"/><rect x="14" y="6" width="26" height="94" fill="#fff" stroke="#555"/>`; for(let k=0;k<8;k++) s+=EWB_L(0,10+k*12,8,10+k*12)+`<path d="M17,${13+k*12} h4 v-5 h5 v5 h5 v-5 h5" fill="none" stroke="#333" stroke-width=".7"/>`; break;
    case 'wg':{ const n=p.n||8; s+=`<rect x="0" y="0" width="${g.w}" height="32" fill="#c8c8c8" stroke="#000"/><rect x="5" y="5" width="${g.w-10}" height="16" fill="#fff" stroke="#555"/>`+EWB_T(10,17,('000'+(view?view.word:0).toString(16).toUpperCase()).slice(-4),' style="font:11px Consolas,monospace"');
      Object.values(g.pins).forEach(([x])=>s+=`<circle cx="${x}" cy="27" r="2" fill="#fff" stroke="#333"/>`+EWB_L(x,29,x,40)); break; }
  }
  return lbl+s; }

/* ---- моделирование ---- */
function ewbEval(c,get){ const p=c.p||{}, st=c.st;
  switch(c.type){
    case 'gate':{ const n=(p.k==='not'||p.k==='buf')?1:(p.n||2), a=[]; for(let i=0;i<n;i++) a.push(get('i'+i)?1:0);
      const v={and:a.every(x=>x),or:a.some(x=>x),xor:a.reduce((s,x)=>s^x,0)===1,not:!a[0],buf:!!a[0]};
      const k=p.k; let o; if(k==='nand') o=!v.and; else if(k==='nor') o=!v.or; else if(k==='xnor') o=!v.xor; else o=v[k]; return {o:o?1:0}; }
    case 'sw': return {o:p.on?1:0};
    case 'vcc': return {o:1}; case 'gnd': return {o:0};
    case 'clk': return {o:st.v||0};
    case 'conn': return {n:get('i')};
    case 'lamp': c.view={on:get('i')===1}; return {};
    case 'hex': c.view={v:get('b0')|(get('b1')<<1)|(get('b2')<<2)|(get('b3')<<3)}; return {};
    case 'ha':{ const a=get('A'),b=get('B'); return {S:a^b,C:a&b}; }
    case 'fa':{ const a=get('A'),b=get('B'),ci=get('Ci'); return {S:a^b^ci,Co:(a&b)|(ci&(a^b))}; }
    case 'jk': case 'd':{ const C=get('C'), fall=p.edge==='fall'; const cur=c.type==='d'?{D:get('D')}:{J:get('J'),K:get('K')}; const pv=(p.pre&&st.pv)||cur; // p.pre: входы берутся ДО фронта (нужно синхронным схемам)
      if(st.pc!==undefined&&st.pc!==C&&(fall?C===0:C===1)){ if(c.type==='d') st.q=pv.D; else { const j=pv.J,k=pv.K; st.q= j&&k?1-st.q:j?1:k?0:st.q; } }
      st.pc=C; st.pv=cur;
      if(p.async){ const pr=c.in.PR?get('PR'):1, clr=c.in.CLR?get('CLR'):1; if(clr===0) st.q=0; else if(pr===0) st.q=1; }
      return {Q:st.q,Qn:1-st.q}; }
    case 'wg':{ const o={}; for(let k=0;k<(p.n||8);k++) o['b'+k]=(st.word>>k)&1; c.view={word:st.word}; return o; }
  } return {}; }

class EWBWin{
  constructor(el,circ){ this.el=el; this.zoom=1; this.colorLv=false; this.load(circ); }
  load(circ){ this.circ=circ; const comps=circ.comps.map(c=>Object.assign({},c,{p:Object.assign({},c.p||{}),st:Object.assign({q:0,v:0,word:0,idx:-1},c.st||{}),out:Object.assign({},c.out||{})}));
    this.comps=comps; this.byId={}; comps.forEach(c=>this.byId[c.id]=c);
    this.src={}; comps.forEach(c=>c.in={}); (circ.wires||[]).forEach(w=>{ const [fc,fp]=w.f.split('.'),[tc,tp]=w.t.split('.'); this.src[w.t]=[fc,fp]; if(this.byId[tc]) this.byId[tc].in[tp]=1; });
    this.mode='done'; this.step=(circ.steps||[]).length; this.power=true; this.hist=[]; this.build(); this.settle(true); this.render(); }
  get(c,pin){ const s=this.src[c.id+'.'+pin]; if(!s) return 0; const sc=this.byId[s[0]]; const v=sc&&sc.out[s[1]]; return v?1:0; }
  settle(init){ for(let it=0;it<80;it++){ let ch=false; for(const c of this.comps){ const o=ewbEval(c,(pin)=>this.get(c,pin)); for(const k in o) if(c.out[k]!==o[k]){ c.out[k]=o[k]; ch=true; } } if(!ch) break; }
    if(!init) this.record(); }
  record(){ const ch=this.channels(); if(!ch.length) return; this.hist.push(ch.map(x=>x.v())); if(this.hist.length>40) this.hist.shift(); }
  channels(){ const L=[]; if(!this.circ.probe) this.comps.forEach(c=>{ if(c.type==='sw'||c.type==='clk') L.push({n:c.p.label||c.id,v:()=>c.out.o?1:0}); });
    if(this.circ.probe) this.circ.probe.forEach(([nm,ref])=>{ const [ci,pi]=ref.split('.'); L.push({n:nm,v:()=>{ const c=this.byId[ci]; return c&&c.out[pi]?1:0; }}); });
    else this.comps.forEach(c=>{ if(c.type==='lamp') L.push({n:c.p.label||c.id,v:()=>this.get(c,'i')}); }); return L; }
  visible(c){ if(this.mode==='done') return true; const s=this.circ.steps[this.step]; if(!s) return true; const shown=new Set(); for(let i=0;i<=this.step;i++) (this.circ.steps[i].show||[]).forEach(x=>shown.add(x)); return shown.has(c.id); }
  wiresOn(){ if(this.mode==='done') return true; for(let i=0;i<=this.step;i++) if(this.circ.steps[i].wires) return true; return false; }
  powerOn(){ if(this.mode==='done') return this.power; for(let i=0;i<=this.step;i++) if(this.circ.steps[i].power) return this.power; return false; }
  build(){ const C=this.circ, steps=C.steps||[];
    this.el.innerHTML=`<div class="ewbw">
      <div class="e-title"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="3" width="14" height="10" fill="#d33"/><circle cx="5" cy="8" r="2" fill="#fff"/><circle cx="11" cy="8" r="2" fill="#36f"/></svg><span>Electronics Workbench — ${esc(C.file||'Untitled')}</span><span class="grow"></span><i class="wb">_</i><i class="wb">□</i><i class="wb">×</i></div>
      <div class="e-menu"><span>File</span><span>Edit</span><span>Circuit</span><span>Analysis</span><span>Window</span><span>Help</span></div>
      <div class="e-tools">${['new','open','save','copy','rot','zout','zin','help'].map(k=>`<span class="tb">${EWB_ICONS[k]}</span>`).join('')}<span class="grow"></span>
        <div class="e-power" title="Питание: включить/выключить моделирование"><button class="pw" data-a="power" aria-label="Питание"><span>O</span><span>I</span><i></i></button><span class="pause">Pause</span></div></div>
      <div class="e-bins">${EWB_BINS.map(b=>`<span class="binb" data-bin="${b.k}" title="${b.t}">${b.i}<span>${b.t}</span></span>`).join('')}</div>
      <div class="e-doc">${esc(C.file||'Untitled')}</div>
      <div class="e-body"><div class="e-canvas"></div><div class="e-panels"></div></div>
      <div class="e-status"></div></div>
      <div class="ewb-ctl">
        ${C.choices?`<label class="ewb-sel">Схема: <select>${C.choices.map((ch,i)=>`<option value="${i}">${esc(ch.t)}</option>`).join('')}</select></label>`:''}
        <div class="seg" role="group"><button data-m="done" class="on">Готовая схема</button>${steps.length?`<button data-m="steps">Как собрать по шагам</button>`:''}</div>
        <button class="btn" data-a="color">Показать уровни на проводах</button>
        ${C.wg?`<button class="btn" data-a="wgstep">Word Generator: Step ▶</button>`:''}
        ${C.clock?`<button class="btn" data-a="tick">Такт ▶</button><button class="btn" data-a="auto">Авто ⏵</button>`:''}
        <span class="hint">Щёлкай переключатели — схема работает как в EWB.</span></div>
      <div class="ewb-step" hidden></div>`;
    const $=s=>this.el.querySelector(s);
    this.cv=$('.e-canvas'); this.pan=$('.e-panels'); this.stat=$('.e-status'); this.stepBox=$('.ewb-step');
    this.el.querySelector('.ewb-ctl').addEventListener('click',e=>this.onCtl(e));
    this.el.querySelector('.pw').addEventListener('click',()=>{ this.power=!this.power; this.render(); });
    const sel=this.el.querySelector('.ewb-sel select'); if(sel&&C.choiceIdx!=null) sel.value=C.choiceIdx; if(sel) sel.addEventListener('input',()=>{ const ch=C.choices[+sel.value]; const nc=ch.make(); nc.choices=C.choices; this.load(nc); this.el.querySelector('.ewb-sel select').value=sel.value; });
    this.cv.addEventListener('click',e=>{ const g=e.target.closest('[data-sw]'); if(!g||!this.powerOn()) return; const c=this.byId[g.dataset.sw]; c.p.on=!c.p.on; this.settle(); this.render(); });
  }
  onCtl(e){ const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.m){ this.mode=b.dataset.m; this.step= this.mode==='steps'?0:(this.circ.steps||[]).length; this.el.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b)); this.render(); return; }
    const a=b.dataset.a;
    if(a==='color'){ this.colorLv=!this.colorLv; b.classList.toggle('pri',this.colorLv); this.render(); }
    if(a==='wgstep'){ const w=this.comps.find(c=>c.type==='wg'); const words=w.p.words; w.st.idx=(w.st.idx+1)%words.length; w.st.word=words[w.st.idx]; this.settle(); this.render(); }
    if(a==='tick'){ this.tick(); }
    if(a==='auto'){ if(this.timer){ clearInterval(this.timer); this.timer=null; b.textContent='Авто ⏵'; } else { this.timer=setInterval(()=>this.tick(),550); b.textContent='Пауза ⏸'; } }
    if(a==='prev'){ this.step=Math.max(0,this.step-1); this.render(); } if(a==='next'){ this.step=Math.min(this.circ.steps.length-1,this.step+1); this.render(); } }
  tick(){ const c=this.comps.find(x=>x.type==='clk'); if(!c||!this.powerOn()) return; c.st.v=1; this.settle(); c.st.v=0; this.settle(); this.render(); }
  pinXY(c,pin){ const g=ewbGeom(c), q=g.pins[pin]; return q?[c.x+q[0],c.y+q[1]]:[c.x,c.y]; }
  render(){ const C=this.circ, comps=this.comps, pw=this.powerOn(), wOn=this.wiresOn();
    let maxX=0,maxY=0; comps.forEach(c=>{ const g=ewbGeom(c); maxX=Math.max(maxX,c.x+g.w+20); maxY=Math.max(maxY,c.y+g.h+30); });
    let s=`<svg class="ewbsvg" viewBox="-10 -14 ${maxX+20} ${maxY+20}" width="${(maxX+20)*this.zoom}" height="${(maxY+20)*this.zoom}" role="img" aria-label="Схема ${esc(C.file||'')}">`;
    if(wOn){ const fan={}; (C.wires||[]).forEach(w=>{ (fan[w.f]=fan[w.f]||[]).push(w); });
      (C.wires||[]).forEach(w=>{ const [fc,fp]=w.f.split('.'),[tc,tp]=w.t.split('.'); const a=this.byId[fc], b=this.byId[tc]; if(!a||!b||!this.visible(a)||!this.visible(b)) return;
        const [x1,y1]=this.pinXY(a,fp), [x2,y2]=this.pinXY(b,tp); let pts;
        if(w.via){ const via=w.via.map(p=>p.slice()); if(a.type==='wg'){ const ox=via[0][0]; via.forEach(p=>{ if(p[0]===ox) p[0]=x1; }); } pts=[[x1,y1],...via,[x2,y2]]; }
        else { const xm=w.xm!==undefined?w.xm:(x2>x1+16? x2-10-(w.off||0) : x1+12); pts= y1===y2&&!w.xm?[[x1,y1],[x2,y2]]:[[x1,y1],[xm,y1],[xm,y2],[x2,y2]]; if(x2<=x1+16&&!w.xm) pts=[[x1,y1],[x1+12,y1],[x1+12,y2],[x2,y2]]; }
        const lv=a.out[fp]?1:0; s+=`<polyline class="wire${this.colorLv&&pw?(lv?' w1':' w0'):''}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`; w._pts=pts; });
      Object.values(fan).forEach(list=>{ if(list.length<2) return; list.forEach(w=>{ if(!w._pts||w._pts.length<3) return; const [x,y]=w._pts[1]; const far=list.some(o=>o!==w&&o._pts&&o._pts[1]&&o._pts[1][1]===y&&o._pts[1][0]>x); if(far||w.dot) s+=`<circle cx="${x}" cy="${y}" r="2.6" fill="#000"/>`; }); }); }
    comps.forEach(c=>{ if(!this.visible(c)) return; const g=ewbGeom(c); const isNew=this.mode==='steps'&&(this.circ.steps[this.step].show||[]).includes(c.id);
      if(c.type==='lamp') c.view={on:pw&&this.get(c,'i')===1}; if(c.type==='hex') c.view=pw?c.view:{v:null};
      s+=`<g transform="translate(${c.x},${c.y})" class="cmp${isNew?' new':''}"${c.type==='sw'?` data-sw="${c.id}" role="button" tabindex="0"`:''}>${isNew?`<rect x="-6" y="-16" width="${g.w+12}" height="${g.h+26}" class="hl"/>`:''}${ewbDraw(c,c.view)}</g>`; });
    s+='</svg>'; this.cv.innerHTML=s;
    this.el.querySelector('.pw').classList.toggle('on',pw);
    const st=this.mode==='steps'?this.circ.steps[this.step]:null;
    this.el.querySelectorAll('.binb').forEach(b=>b.classList.toggle('hot',!!(st&&st.bin===b.dataset.bin)));
    this.stepBox.hidden=!st;
    if(st){ this.stepBox.innerHTML=`<div class="sn">Шаг ${this.step+1} из ${this.circ.steps.length}</div><div class="st">${st.t}</div><div class="nav"><button class="btn" data-a="prev"${this.step?'':' disabled'}>◀ Назад</button><button class="btn pri" data-a="next"${this.step<this.circ.steps.length-1?'':' disabled'}>Дальше ▶</button></div>`;
      this.stepBox.querySelectorAll('button').forEach(b=>b.onclick=()=>{ this.step=b.dataset.a==='next'?Math.min(this.circ.steps.length-1,this.step+1):Math.max(0,this.step-1); this.render(); }); }
    this.stat.textContent= pw?(C.status||'Моделирование включено. Щёлкай переключатели (в EWB — клавиши A, B, C…).'):'Питание выключено — включи переключатель O/I справа вверху.';
    this.renderPanels(); }
  renderPanels(){ const C=this.circ, pan=[]; const done=this.mode==='done'||(this.circ.steps[this.step]&&this.circ.steps[this.step].power);
    if(C.lc&&done) pan.push(this.lcPanel());
    if(C.wg&&done){ const w=this.comps.find(c=>c.type==='wg'); pan.push(`<div class="e-win"><div class="e-wt">Word Generator</div><div class="e-wb"><div class="wgl">${w.p.words.map((x,i)=>`<span class="${i===w.st.idx?'on':''}">${('000'+x.toString(16).toUpperCase()).slice(-4)}</span>`).join('')}</div><div class="wgb">Binary: <b>${(w.st.word>>>0).toString(2).padStart(w.p.n||8,'0')}</b><br><span class="sm">Кнопка Step подаёт следующее слово (подсвечено).</span></div></div></div>`); }
    if(C.la&&done) pan.push(this.laPanel());
    this.pan.innerHTML=pan.join(''); this.pan.hidden=!pan.length; }
  lcPanel(){ const sws=this.comps.filter(c=>c.type==='sw'), out=this.comps.find(c=>c.type==='lc'); if(!out) return '';
    const n=sws.length, saved=sws.map(c=>c.p.on), rows=[], ones=[];
    for(let r=0;r<P2(n);r++){ sws.forEach((c,i)=>c.p.on=(r>>(n-1-i))&1); this.settle(true); const v=this.get(out,'Out'); rows.push([r,v]); if(v) ones.push(r); }
    sws.forEach((c,i)=>c.p.on=saved[i]); this.settle(true);
    const names=sws.map(c=>c.p.label); const res=minimize(n,ones);
    return `<div class="e-win"><div class="e-wt">Logic Converter</div><div class="e-wb lcw2"><div class="lct"><div class="lch">${names.map(x=>`<b>${x}</b>`).join('')}<b>Out</b></div>${rows.map(([r,v])=>`<div>${(r).toString(2).padStart(n,'0').split('').map(x=>`<span>${x}</span>`).join('')}<span class="o">${v}</span></div>`).join('')}</div>
      <div class="lcbtns"><div class="lcb">схема → таблица ✔</div><div class="lcb">таблица → A|B</div><div class="lcb">таблица → SIMP A|B</div></div></div>
      <div class="lcexp"><b>A|B:</b> ${ones.length?ones.map(r=>mintermHTML(r,names)).join('+'):'0'}<br><b>SIMP:</b> ${minHTML(res,names)}</div></div>`; }
  laPanel(){ const ch=this.channels(), H=this.hist; if(!ch.length) return ''; const cw=14, lw=40, rh=20, W=lw+Math.max(20,H.length)*cw+4;
    let s=`<svg viewBox="0 0 ${W} ${ch.length*rh+6}" width="${W}" height="${ch.length*rh+6}" class="lasvg">`;
    ch.forEach((c,i)=>{ const y0=i*rh+4, hi=y0+3, lo=y0+rh-5; s+=`<text x="2" y="${y0+rh/2+3}" class="lt">${esc(c.n)}</text>`; let p=''; H.forEach((row,k)=>{ const y=row[i]?hi:lo; p+=`${p?'L':'M'}${lw+k*cw} ${y} L${lw+(k+1)*cw} ${y} `; }); s+=`<path d="${p}" class="lw"/>`; });
    s+='</svg>'; return `<div class="e-win la"><div class="e-wt">Logic Analyzer</div><div class="e-wb lab">${H.length?s:'<span class="sm">Пока пусто: переключай входы или нажимай Step/Такт — здесь появятся временные диаграммы.</span>'}</div></div>`; }
}

/* ---- схема по формуле: авто-раскладка ---- */
function ewbFromExpr(src,opt={}){
  const e=parseExpr(src); const vars=[...exprVars(e)].sort(varSort);
  const comps=[], wires=[]; let gid=0; const id=p=>p+(++gid);
  const SWX=10, SWDY=Math.max(56,opt.dy||60);
  const swId={}; vars.forEach((v,i)=>{ swId[v]='s_'+v; comps.push({id:swId[v],type:'sw',x:SWX,y:20+i*SWDY,p:{label:v,key:v.toUpperCase().slice(-1),on:0}}); });
  const notId={};
  const simp=n=>{ if(n.op==='not'&&n.a.op&&['and','or','xor'].includes(n.a.op)) return {op:{and:'nand',or:'nor',xor:'xnor'}[n.a.op],args:flat(n.a.op,n.a).map(simp)};
    if(n.op&&n.op!=='not'&&['and','or','xor'].includes(n.op)) return {op:n.op,args:flat(n.op,n).map(simp)};
    if(n.op==='not') return {op:'not',args:[simp(n.a)]}; if(n.op==='imp') return {op:'or',args:[{op:'not',args:[simp(n.a)]},simp(n.b)]}; if(n.op==='eq') return {op:'xnor',args:[simp(n.a),simp(n.b)]}; return n; };
  function flat(op,n){ const r=[]; (function f(x){ if(x.op===op&&r.length<6) { f(x.a); f(x.b); } else r.push(x); })(n); return r; }
  const tree=simp(e);
  const layers={}; let maxD=1;
  function place(n){ // returns {ref:'id.pin', y}
    if(n.v){ const c=comps.find(x=>x.id===swId[n.v]); return {ref:swId[n.v]+'.o',y:c.y+15,d:0}; }
    if(n.c!==undefined){ const k=id(n.c?'vcc':'gnd'); comps.push({id:k,type:n.c?'vcc':'gnd',x:70,y:n.c?-6:400}); return {ref:k+'.o',y:n.c?20:400,d:0}; }
    if(n.op==='not'&&n.args[0].v){ const v=n.args[0].v; if(!notId[v]){ const sw=comps.find(x=>x.id===swId[v]); notId[v]='n_'+v; comps.push({id:notId[v],type:'gate',x:80,y:sw.y+3+30,p:{k:'not'}}); wires.push({f:swId[v]+'.o',t:notId[v]+'.i0',xm:66}); }
      const c=comps.find(x=>x.id===notId[v]); return {ref:notId[v]+'.o',y:c.y+12,d:0.5}; }
    const kids=n.args.map(place); const d=Math.max(...kids.map(k=>Math.ceil(k.d)))+1; maxD=Math.max(maxD,d);
    const k=id('g'), nIn=n.op==='not'?1:kids.length; const g={id:k,type:'gate',x:0,y:0,p:{k:n.op,n:nIn},_d:d}; const geo=ewbGeom(g);
    const yc=kids.reduce((s,q)=>s+q.y,0)/kids.length; g.y=Math.round(yc-geo.h/2); comps.push(g);
    (layers[d]=layers[d]||[]).push(g);
    kids.forEach((q,i)=>wires.push({f:q.ref,t:k+'.i'+i,off:i*5}));
    return {ref:k+'.o',y:g.y+geo.h/2,d,g}; }
  const root=place(tree);
  Object.entries(layers).forEach(([d,list])=>{ list.sort((a,b)=>a.y-b.y); let last=-1e9; list.forEach(g=>{ const h=ewbGeom(g).h; if(g.y<last+16) g.y=last+16; last=g.y+h; g.x=150+(+d-1)*120; }); });
  const outY= root.g? root.g.y+ewbGeom(root.g).h/2 : root.y;
  const lampX=150+(maxD-1)*120+(root.g?110:60);
  comps.push({id:'out',type:'lamp',x:lampX,y:outY-12,p:{label:opt.out||'F'}}); wires.push({f:root.ref,t:'out.i'});
  if(opt.lc){ const n=vars.length; const lcY=20+vars.length*SWDY+40; comps.push({id:'lc',type:'lc',x:SWX+60,y:lcY}); vars.forEach((v,i)=>wires.push({f:swId[v]+'.o',t:'lc.'+'ABCDEFGH'[i],via:null,xm:undefined,_lc:1})); wires.push({f:root.ref,t:'lc.Out'}); }
  // провода к LC тянем через нижнюю шину
  if(opt.lc){ const lc=comps.find(c=>c.id==='lc'); wires.forEach(w=>{ if(!w._lc&&w.t!=='lc.Out') return; const [fc,fp]=w.f.split('.'); const a=comps.find(c=>c.id===fc); const [x1,y1]=[a.x+ewbGeom(a).pins[fp][0],a.y+ewbGeom(a).pins[fp][1]]; const tp=w.t.split('.')[1]; const [x2,y2]=[lc.x+ewbGeom(lc).pins[tp][0],lc.y];
      const busY=lc.y-14-(w.t==='lc.Out'?45:('ABCDEFGH'.indexOf(tp))*5); w.via= w.t==='lc.Out'?[[x1+14,y1],[x1+14,busY],[x2,busY]]:[[x1+6+'ABCDEFGH'.indexOf(tp)*4,y1],[x1+6+'ABCDEFGH'.indexOf(tp)*4,busY],[x2,busY]]; }); }
  const gates=comps.filter(c=>c.type==='gate'&&c.p.k!=='not');
  const nots=comps.filter(c=>c.type==='gate'&&c.p.k==='not');
  const kinds={}; gates.forEach(g=>{ const nm=g.p.k.toUpperCase(); kinds[nm]=(kinds[nm]||0)+1; });
  const steps=[
    {bin:'basic',show:vars.map(v=>swId[v]),t:`Открой панель <b>Basic</b> и перетащи на поле <b>${vars.length} Switch</b> (переключатель). Двойной щелчок по каждому → вкладка <b>Label</b>: ${vars.join(', ')}; вкладка <b>Value</b> → Key: ${vars.map(v=>v.toUpperCase().slice(-1)).join(', ')} — этой клавишей переключатель будет щёлкать. <i>(В лабе входы часто делают точками-коннекторами из Basic — тоже можно; переключатели удобнее для проверки.)</i>`}];
  if(nots.length) steps.push({bin:'gates',show:nots.map(c=>c.id),t:`Панель <b>Logic Gates</b> → <b>NOT</b> (инвертор) ×${nots.length}. Поставь сразу после входов ${nots.map(c=>c.id.slice(2)).join(', ')} — получатся ${nots.map(c=>'¬'+c.id.slice(2)).join(', ')}.`});
  const cols=Object.keys(layers).sort((a,b)=>a-b);
  cols.forEach((d,i)=>{ const list=layers[d]; steps.push({bin:'gates',show:list.map(c=>c.id),t:`Панель <b>Logic Gates</b> → ${list.map(g=>`<b>${g.p.k.toUpperCase()}</b>${g.p.k!=='not'&&g.p.n>2?` (${g.p.n} входа: двойной щелчок → Number of inputs = ${g.p.n})`:''}`).join(', ')} — ${i===0?'первый слой: элементы, которые берут сигналы прямо от входов':'следующий слой: на их входы придут выходы предыдущих элементов'}.`}); });
  steps.push({bin:'ind',show:['out'],t:`Панель <b>Indicators</b> → <b>Red Probe</b> (лампочка) на выход. Подпиши её ${opt.out||'F'}. Горит = 1.`});
  if(opt.lc) steps.push({bin:'inst',show:['lc'],t:`Панель <b>Instruments</b> → <b>Logic Converter</b>. Его выводы A, B, C… подключи ко входам <b>в том же порядке</b>, а крайний правый (Out) — к выходу схемы.`});
  steps.push({wires:true,show:[],t:`Соедини провода: наведи мышь на вывод детали (появится точка), зажми и тяни до вывода другой детали. Если сигнал нужен в двух местах — тяни второй провод прямо от уже существующего провода: EWB сам поставит чёрную точку-узел.`});
  steps.push({power:true,show:[],t:`Включи питание — переключатель <b>O/I</b> справа вверху. Щёлкай клавиши ${vars.map(v=>v.toUpperCase().slice(-1)).join(', ')} и смотри на лампочку.${opt.lc?' Двойной щелчок по Logic Converter → первая кнопка справа строит таблицу истинности, вторая — выражение (СДНФ), третья — упрощённое.':''}`});
  return {file:opt.file||'Untitled',comps,wires,steps,lc:!!opt.lc,la:!!opt.la,status:opt.status};
}

/* ---- готовые схемы из лаб ---- */
const EWB_CIRCUITS={
  ha_gates:()=>({file:'half_adder.ewb',comps:[
    {id:'A',type:'sw',x:10,y:20,p:{label:'A',key:'A'}},{id:'B',type:'sw',x:10,y:90,p:{label:'B',key:'B'}},
    {id:'x',type:'gate',x:150,y:22,p:{k:'xor',n:2}},{id:'a',type:'gate',x:150,y:92,p:{k:'and',n:2}},
    {id:'S',type:'lamp',x:260,y:25,p:{label:'Σ (сумма)'}},{id:'C',type:'lamp',x:260,y:95,p:{label:'C (перенос)'}}],
   wires:[{f:'A.o',t:'x.i0',off:0},{f:'B.o',t:'x.i1',off:8},{f:'A.o',t:'a.i0',off:16},{f:'B.o',t:'a.i1',off:0},{f:'x.o',t:'S.i'},{f:'a.o',t:'C.i'}],
   steps:[{bin:'basic',show:['A','B'],t:'Basic → 2 Switch, подписи A и B (Key = A, B).'},{bin:'gates',show:['x'],t:'Logic Gates → <b>XOR</b>: он даёт сумму Σ = A ⊕ B.'},{bin:'gates',show:['a'],t:'Logic Gates → <b>AND</b>: он даёт перенос C = A · B.'},{bin:'ind',show:['S','C'],t:'Indicators → 2 Red Probe: на выход XOR (Σ) и на выход AND (C).'},{wires:true,show:[],t:'Провода: A идёт на первый вход и XOR, и AND (провод от провода — появится точка-узел); B — на вторые входы.'},{power:true,show:[],t:'Питание O/I → щёлкай A и B. 1 + 1: Σ гаснет, C загорается — это «10» в двоичной.'}]}),
  fa_2ha:()=>({file:'full_adder_2HA.ewb',comps:[
    {id:'A',type:'sw',x:10,y:10,p:{label:'A',key:'A'}},{id:'B',type:'sw',x:10,y:70,p:{label:'B',key:'B'}},{id:'Ci',type:'sw',x:10,y:150,p:{label:'Cin',key:'C'}},
    {id:'h1',type:'ha',x:130,y:20,p:{label:'ПС1'}},{id:'h2',type:'ha',x:260,y:90,p:{label:'ПС2'}},{id:'o',type:'gate',x:390,y:40,p:{k:'or',n:2}},
    {id:'S',type:'lamp',x:420,y:93,p:{label:'Σ'}},{id:'Co',type:'lamp',x:500,y:43,p:{label:'Co'}}],
   wires:[{f:'A.o',t:'h1.A'},{f:'B.o',t:'h1.B'},{f:'h1.S',t:'h2.A'},{f:'Ci.o',t:'h2.B'},{f:'h1.C',t:'o.i0',xm:225},{f:'h2.C',t:'o.i1',xm:365},{f:'h2.S',t:'S.i'},{f:'o.o',t:'Co.i'}],
   steps:[{bin:'basic',show:['A','B','Ci'],t:'Basic → 3 Switch: A, B и Cin (перенос из младшего разряда).'},{bin:'digital',show:['h1'],t:'Digital → <b>Half-Adder</b> (ПС1): складывает A и B.'},{bin:'digital',show:['h2'],t:'Ещё один <b>Half-Adder</b> (ПС2): складывает сумму ПС1 с Cin.'},{bin:'gates',show:['o'],t:'Logic Gates → <b>OR</b>: объединяет переносы обоих полусумматоров — это Co.'},{bin:'ind',show:['S','Co'],t:'Indicators → 2 Red Probe: Σ (сумма ПС2) и Co (выход OR).'},{wires:true,show:[],t:'A, B → входы ПС1; S ПС1 → A ПС2; Cin → B ПС2; C обоих ПС → OR.'},{power:true,show:[],t:'Питание → проверь все 8 комбинаций: 1+1+1 = 11₂ (Σ=1, Co=1).'}]}),
  add3:()=>{ const comps=[{id:'wg',type:'wg',x:10,y:0,p:{n:11,words:[0x000,0x101,0x203,0x305,0x507,0x706,0x707],label:'Word Generator'},st:{word:0,idx:-1}}];
    const wires=[];
    for(let i=0;i<3;i++){ const fx=360-i*130; comps.push({id:'f'+i,type:'fa',x:fx,y:110,p:{label:'FA'+i}},{id:'L'+i,type:'lamp',x:fx+90,y:250,p:{label:'Σ'+i}});
      wires.push({f:'wg.b'+i,t:'f'+i+'.A',via:[[0,52+i*4],[fx-12,52+i*4],[fx-12,125]]},{f:'wg.b'+(8+i),t:'f'+i+'.B',via:[[1,70+i*4],[fx-20,70+i*4],[fx-20,140]]},
        {f:'f'+i+'.S',t:'L'+i+'.i',via:[[fx+80,130],[fx+80,262]]},{f:'f'+i+'.S',t:'hx.b'+i,via:[[fx+80,262],[fx+80,322+i*6],[538-i*10,322+i*6]]}); }
    comps.push({id:'g0',type:'gnd',x:330,y:200},{id:'Lc',type:'lamp',x:186,y:280,p:{label:'C (перенос)'}},{id:'hx',type:'hex',x:500,y:230,p:{label:'Display'}});
    wires.push({f:'g0.o',t:'f0.Ci',via:[[342,155]]},{f:'f0.Co',t:'f1.Ci',via:[[440,152],[440,215],[220,215],[220,155]]},{f:'f1.Co',t:'f2.Ci',via:[[310,152],[310,225],[90,225],[90,155]]},
      {f:'f2.Co',t:'Lc.i',via:[[176,152],[176,292]]},{f:'f2.Co',t:'hx.b3',via:[[176,292],[176,346],[508,346]]});
    return {file:'adder3.ewb',comps,wires,wg:true,la:true,probe:[['Σ0','f0.S'],['Σ1','f1.S'],['Σ2','f2.S'],['C','f2.Co']],status:'Нажимай «Word Generator: Step» — на сумматор подаются пары чисел; Display показывает сумму в hex.',
      steps:[{bin:'inst',show:['wg'],t:'Instruments → <b>Word Generator</b>. Двойной щелчок → в списке слов (hex) задай пары: младшие 3 бита — первое слагаемое, биты 8, 9, 10 — второе (например, 0305h = 3 + 5).'},{bin:'digital',show:['f0','f1','f2'],t:'Digital → 3 <b>Full-Adder</b>. Справа — младший разряд (FA0), слева — старший (FA2).'},{bin:'sources',show:['g0'],t:'Sources → <b>Ground</b> на Ci младшего сумматора: переноса снизу нет, значит 0.'},{bin:'ind',show:['L0','L1','L2','Lc','hx'],t:'Indicators → 4 Red Probe (Σ0, Σ1, Σ2 и перенос C) и <b>Decoded 7-Segment Display</b> — он покажет сумму в hex.'},{wires:true,show:[],t:'Выходы генератора 0–2 → входы A сумматоров, 8–10 → входы B. Co каждого → Ci следующего. Σ → лампочки и Display (младший бит — на правый вывод дисплея).'},{power:true,show:[],t:'Питание O/I → в окне генератора жми <b>Step</b>: на каждом шаге новое слово, лампочки и Display показывают сумму.'}]}; },  dec24:()=>{ const comps=[{id:'A1',type:'sw',x:10,y:10,p:{label:'A1',key:'B'}},{id:'A0',type:'sw',x:10,y:70,p:{label:'A0',key:'A'}},{id:'n1',type:'gate',x:90,y:40,p:{k:'not'}},{id:'n0',type:'gate',x:90,y:100,p:{k:'not'}}]; const wires=[{f:'A1.o',t:'n1.i0',xm:70},{f:'A0.o',t:'n0.i0',xm:76}];
    const src=[['n1.o','n0.o'],['n1.o','A0.o'],['A1.o','n0.o'],['A1.o','A0.o']];
    for(let i=0;i<4;i++){ comps.push({id:'y'+i,type:'gate',x:230,y:20+i*55,p:{k:'and',n:2}},{id:'L'+i,type:'lamp',x:330,y:23+i*55,p:{label:'Y'+i}}); wires.push({f:src[i][0],t:'y'+i+'.i0',off:i*6},{f:src[i][1],t:'y'+i+'.i1',off:i*6+3},{f:'y'+i+'.o',t:'L'+i+'.i'}); }
    return {file:'decoder2x4.ewb',comps,wires,steps:[{bin:'basic',show:['A1','A0'],t:'Basic → 2 Switch: A1 (старший) и A0 (младший).'},{bin:'gates',show:['n1','n0'],t:'Logic Gates → 2 <b>NOT</b>: получаем Ā1 и Ā0.'},{bin:'gates',show:['y0','y1','y2','y3'],t:'Logic Gates → 4 <b>AND</b>: Y0 = Ā1Ā0, Y1 = Ā1A0, Y2 = A1Ā0, Y3 = A1A0.'},{bin:'ind',show:['L0','L1','L2','L3'],t:'Indicators → 4 Red Probe на выходы Y0–Y3.'},{wires:true,show:[],t:'Каждый AND получает свою пару: прямой или инверсный сигнал каждого входа.'},{power:true,show:[],t:'Питание → при любом коде горит ровно одна лампочка: дешифратор переводит двоичный код в унитарный.'}]}; },
  rs_nand:()=>({file:'rs_nand.ewb',comps:[
    {id:'wg',type:'wg',x:10,y:0,p:{n:2,words:[3,1,3,2,3,0,3],label:'Word Generator'},st:{word:3,idx:-1}},
    {id:'g1',type:'gate',x:150,y:70,p:{k:'nand',n:2},out:{o:0}},{id:'g2',type:'gate',x:150,y:160,p:{k:'nand',n:2},out:{o:1}},
    {id:'Q',type:'lamp',x:290,y:73,p:{label:'Q'}},{id:'Qn',type:'lamp',x:290,y:163,p:{label:"Q'"}}],
   wires:[{f:'wg.b0',t:'g1.i0',via:[[28,60],[120,60],[120,80]]},{f:'wg.b1',t:'g2.i1',via:[[16,52],[16,182],[150,182]]},
     {f:'g2.o',t:'g1.i1',via:[[230,175],[230,140],[130,110],[130,90]]},{f:'g1.o',t:'g2.i0',via:[[220,85],[220,120],[130,140],[130,170]]},{f:'g1.o',t:'Q.i'},{f:'g2.o',t:'Qn.i'}],
   wg:true,la:true,probe:[["S'",'wg.b0'],["R'",'wg.b1'],['Q','g1.o'],["Q'",'g2.o']],status:'Генератор слов: бит 0 = S′, бит 1 = R′ (входы активны нулём). Жми Step.',
   steps:[{bin:'inst',show:['wg'],t:'Instruments → <b>Word Generator</b>. Слова (hex): 3, 1, 3, 2, 3, 0, 3 — это пары R′S′ = 11 (хранение), 01 (установка), 11, 10 (сброс), 11, 00 (запрет), 11.'},{bin:'gates',show:['g1','g2'],t:'Logic Gates → 2 <b>NAND</b> (И-НЕ). Это и есть RS-триггер: выход каждого заводится на вход другого — обратная связь, которая «запоминает» бит.'},{bin:'ind',show:['Q','Qn'],t:'Indicators → 2 Red Probe: Q и Q′.'},{wires:true,show:[],t:'Выход 0 генератора → первый вход верхнего NAND (S′), выход 1 → второй вход нижнего (R′). Перекрёстно: выход верхнего → вход нижнего, выход нижнего → вход верхнего.'},{power:true,show:[],t:'Питание → жми <b>Step</b> в генераторе и смотри Logic Analyzer: на слове 0 (S′ = R′ = 0) обе лампочки горят — это запрещённое состояние.'}]}),
  jk_wg:()=>({file:'jk.ewb',comps:[{id:'wg',type:'wg',x:10,y:0,p:{n:3,words:[0,2,1,2,0,4,6,4,6,5,7,5,7,4],label:'Word Generator'},st:{word:0,idx:-1}},{id:'ff',type:'jk',x:170,y:80,p:{label:'JK',edge:'fall'},st:{q:0}},{id:'Q',type:'lamp',x:290,y:83,p:{label:'Q'}},{id:'Qn',type:'lamp',x:290,y:113,p:{label:"Q'"}}],
   wires:[{f:'wg.b2',t:'ff.J',via:[[36,60],[150,60],[150,95]]},{f:'wg.b1',t:'ff.C',via:[[48,66],[140,66],[140,110]]},{f:'wg.b0',t:'ff.K',via:[[60,72],[130,72],[130,125]]},{f:'ff.Q',t:'Q.i'},{f:'ff.Qn',t:'Qn.i'}],
   wg:true,la:true,probe:[['J','wg.b2'],['C','wg.b1'],['K','wg.b0'],['Q','ff.Q']],status:'Бит 2 = J, бит 1 = C (такт), бит 0 = K. JK срабатывает по заднему фронту C (1→0).',
   steps:[{bin:'inst',show:['wg'],t:'Instruments → <b>Word Generator</b>: три выхода — J, C, K. Слова подобраны так, чтобы показать все режимы: установка, сброс, хранение и toggle.'},{bin:'digital',show:['ff'],t:'Digital → <b>JK Flip-Flop</b>. Кружок на входе C — срабатывание по <b>заднему</b> фронту.'},{bin:'ind',show:['Q','Qn'],t:'Indicators → Red Probe на Q и Q′.'},{wires:true,show:[],t:'Соедини выходы генератора с J, C, K. (В лабе ещё подключают Logic Analyzer к J, C, K, Q — здесь он открыт справа.)'},{power:true,show:[],t:'Питание → жми Step. Q меняется только когда C падает 1→0. При J = K = 1 — каждый такт переключение.'}]}),
  d_wg:()=>({file:'d_trigger.ewb',comps:[{id:'wg',type:'wg',x:10,y:0,p:{n:2,words:[0,2,0,1,3,1,0,1,3,2,0],label:'Word Generator'},st:{word:0,idx:-1}},{id:'ff',type:'d',x:170,y:80,p:{label:'D',edge:'rise'},st:{q:0}},{id:'Q',type:'lamp',x:290,y:83,p:{label:'Q'}}],
   wires:[{f:'wg.b0',t:'ff.D',via:[[60,60],[150,60],[150,100]]},{f:'wg.b1',t:'ff.C',via:[[48,66],[140,66],[140,120]]},{f:'ff.Q',t:'Q.i'}],
   wg:true,la:true,probe:[['D','wg.b0'],['C','wg.b1'],['Q','ff.Q']],status:'Бит 0 = D, бит 1 = C. Q запоминает D в момент переднего фронта C (0→1).',
   steps:[{bin:'inst',show:['wg'],t:'Instruments → Word Generator: бит 0 = D, бит 1 = C.'},{bin:'digital',show:['ff'],t:'Digital → <b>D Flip-Flop</b> (по переднему фронту).'},{bin:'ind',show:['Q'],t:'Indicators → Red Probe на Q.'},{wires:true,show:[],t:'Соедини генератор с D и C.'},{power:true,show:[],t:'Питание → Step. Смотри: D меняется много раз, а Q — только в моменты, когда C идёт 0→1.'}]}),
  cnt_async:()=>({file:'counter_async3.ewb',comps:[{id:'clk',type:'clk',x:10,y:90,p:{label:'Clock',f:'1 Hz'}},{id:'v',type:'vcc',x:110,y:0},
    {id:'f0',type:'jk',x:120,y:60,p:{label:'JK0',edge:'fall'}},{id:'f1',type:'jk',x:250,y:60,p:{label:'JK1',edge:'fall'}},{id:'f2',type:'jk',x:380,y:60,p:{label:'JK2',edge:'fall'}},
    {id:'L0',type:'lamp',x:500,y:180,p:{label:'Q0'}},{id:'L1',type:'lamp',x:500,y:210,p:{label:'Q1'}},{id:'L2',type:'lamp',x:500,y:240,p:{label:'Q2'}},{id:'hx',type:'hex',x:580,y:82,p:{label:'Display'}}],
   wires:[{f:'clk.o',t:'f0.C'},{f:'v.o',t:'f0.J',via:[[122,26],[122,40],[106,40],[106,75]]},{f:'v.o',t:'f0.K',via:[[122,40],[100,40],[100,105]]},{f:'v.o',t:'f1.J',via:[[122,40],[236,40],[236,75]]},{f:'v.o',t:'f1.K',via:[[236,40],[230,40],[230,105]]},{f:'v.o',t:'f2.J',via:[[236,40],[366,40],[366,75]]},{f:'v.o',t:'f2.K',via:[[366,40],[360,40],[360,105]]},
     {f:'f0.Q',t:'f1.C',via:[[200,75],[215,75],[215,90],[250,90]]},{f:'f1.Q',t:'f2.C',via:[[330,75],[345,75],[345,90],[380,90]]},
     {f:'f0.Q',t:'L0.i',via:[[205,75],[205,192],[500,192]]},{f:'f1.Q',t:'L1.i',via:[[335,75],[335,222],[500,222]]},{f:'f2.Q',t:'L2.i',via:[[465,75],[465,252],[500,252]]},
     {f:'f0.Q',t:'hx.b0',via:[[205,192],[490,192],[490,150],[618,150],[618,152]]},{f:'f1.Q',t:'hx.b1',via:[[335,222],[485,222],[485,145],[608,145],[608,152]]},{f:'f2.Q',t:'hx.b2',via:[[465,252],[480,252],[480,140],[598,140],[598,152]]}],
   clock:true,la:true,probe:[['CLK','clk.o'],['Q0','f0.Q'],['Q1','f1.Q'],['Q2','f2.Q']],status:'Жми «Такт» — Display считает 0…7. В EWB Clock тикает сам с заданной частотой.',
   steps:[{bin:'sources',show:['clk'],t:'Sources → <b>Clock</b>. Двойной щелчок: Frequency = 1 Hz (чтобы глазом видеть счёт), Voltage = 5 V.'},{bin:'sources',show:['v'],t:'Sources → <b>+5V</b> (Vcc): логическая 1 на все J и K — триггеры в режиме toggle.'},{bin:'digital',show:['f0','f1','f2'],t:'Digital → 3 <b>JK Flip-Flop</b> (по спаду). Каждый делит частоту на 2.'},{bin:'ind',show:['L0','L1','L2','hx'],t:'Indicators → 3 Red Probe и Decoded 7-Segment Display.'},{wires:true,show:[],t:'Clock → C первого. <b>Q предыдущего → C следующего</b> (это и делает счётчик асинхронным). Все J, K → +5V. Q0, Q1, Q2 → лампочки и Display (Q0 — правый вывод).'},{power:true,show:[],t:'Питание → счёт 0, 1, 2 … 7, 0. Для вычитающего лампочки и Display подключи к Q′.'}]}),
  cnt_mod10:()=>{ const comps=[{id:'clk',type:'clk',x:10,y:90,p:{label:'Clock',f:'1 Hz'}},{id:'v',type:'vcc',x:100,y:0}]; const wires=[{f:'clk.o',t:'f0.C'}];
    for(let i=0;i<4;i++){ comps.push({id:'f'+i,type:'jk',x:110+i*125,y:50,p:{label:'JK'+i,edge:'fall',async:1}}); const fx=110+i*125; wires.push({f:'v.o',t:'f'+i+'.J',via:[[112,26],[112,34],[fx-12,34],[fx-12,75]]},{f:'v.o',t:'f'+i+'.K',via:[[fx-12,34],[fx-18,34],[fx-18,105]]}); if(i) wires.push({f:'f'+(i-1)+'.Q',t:'f'+i+'.C',via:[[fx-125+80,75],[fx-125+92,75],[fx-125+92,90],[fx,90]]}); }
    comps.push({id:'nd',type:'gate',x:330,y:190,p:{k:'nand',n:2}},{id:'hx',type:'hex',x:640,y:130,p:{label:'Display'}});
    wires.push({f:'f3.Q',t:'nd.i0',via:[[575,75],[590,75],[590,180],[310,180],[310,200]]},{f:'f1.Q',t:'nd.i1',via:[[325,75],[318,75],[318,210],[330,210]]});
    ['f0','f1','f2','f3'].forEach((f,i)=>wires.push({f:'nd.o',t:f+'.CLR',via:[[400,205],[400,240],[145+i*125,240],[145+i*125,130]]}));
    ['f0','f1','f2','f3'].forEach((f,i)=>{ const qx=110+i*125+70; wires.push({f:f+'.Q',t:'hx.b'+i,via:[[qx+8+i,75],[qx+8+i,120-i*4],[678-i*10,120-i*4],[678-i*10,200]]}); });
    return {file:'counter_mod10.ewb',comps,wires,clock:true,la:true,probe:[['CLK','clk.o'],['Q0','f0.Q'],['Q1','f1.Q'],['Q2','f2.Q'],['Q3','f3.Q'],['CLR','nd.o']],status:'Жми «Такт»: 0…9, на 10 (1010) NAND сразу сбрасывает счётчик в 0.',
      steps:[{bin:'sources',show:['clk','v'],t:'Sources → Clock (1 Hz) и +5V.'},{bin:'digital',show:['f0','f1','f2','f3'],t:'Digital → 4 <b>JK Flip-Flop</b> с асинхронными входами (PR, CLR). 2³ = 8 мало для 10 состояний, поэтому четыре.'},{bin:'gates',show:['nd'],t:'Logic Gates → <b>NAND</b> на 2 входа. 10 = 1010₂: единицы в Q3 и Q1 → на NAND подаём Q3 и Q1.'},{bin:'ind',show:['hx'],t:'Indicators → Decoded 7-Segment Display на Q0…Q3.'},{wires:true,show:[],t:'Как обычный асинхронный счётчик (Q → C следующего, J = K = +5V). Выход NAND → входы <b>CLR</b> всех четырёх триггеров (CLR активен нулём — кружок на входе).'},{power:true,show:[],t:'Питание → счёт 0…9. В момент, когда появляется 1010, NAND выдаёт 0 и мгновенно сбрасывает всё в 0000.'}]}; }
};

function initEWB(){
  document.querySelectorAll('.ewb').forEach(el=>{ let circ;
    if(el.dataset.c) circ=(EWB_CIRCUITS[el.dataset.c]||(window.EWB_EXTRA||{})[el.dataset.c])();
    else if(el.dataset.exprs){ const list=JSON.parse(el.dataset.exprs); const choices=list.map(x=>({t:x.t,make:()=>ewbFromExpr(x.e,{file:x.f||'task.ewb',lc:!!x.lc,out:x.out})})); circ=choices[0].make(); circ.choices=choices; }
    else circ=ewbFromExpr(el.dataset.expr,{file:el.dataset.file||'scheme.ewb',lc:el.dataset.lc==='1',out:el.dataset.out});
    new EWBWin(el,circ); });
}

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const clone = o => JSON.parse(JSON.stringify(o));
function getTests(key){ return ED.tests[key] || DEFAULT_TESTS[key]; }
function parseQuestions(text){
  const out=[]; let cur=null, last=null;
  for(const raw of text.replace(/^﻿/,'').replace(/\r/g,'').split('\n')){
    const line=raw.trim(); if(!line) continue; let m;
    if((m=line.match(/^<question>\s*(.*)$/i))){ cur={q:m[1],vars:[]}; out.push(cur); last='q'; }
    else if((m=line.match(/^<variantright>\s*(.*)$/i))){ if(cur){cur.vars.push({t:m[1],ok:true}); last='v';} }
    else if((m=line.match(/^<variant>\s*(.*)$/i))){ if(cur){cur.vars.push({t:m[1],ok:false}); last='v';} }
    else if((m=line.match(/^<explanation>\s*(.*)$/i))){ if(cur) cur.e=m[1]; }
    else if(cur){ if(last==='q') cur.q+=(cur.q?'\n':'')+line; else if(cur.vars.length) cur.vars[cur.vars.length-1].t+=' '+line; }
  }
  const good=[], bad=[];
  out.forEach(x=>{ if(!x.q.trim()||x.vars.length<2){bad.push(x);return;} let i=x.vars.findIndex(v=>v.ok); if(i<0) i=0;
    good.push({q:x.q.trim(),a:[x.vars[i].t,...x.vars.filter((_,j)=>j!==i).map(v=>v.t)],e:x.e||''}); });
  return {good,bad};
}
const toFormat = it => `<question>${it.q}\n<variantright>${it.a[0]}\n`+it.a.slice(1).map(v=>`<variant>${v}`).join('\n');
function saveTests(key,data){ ED.tests[key]=data; store.setTests(key,data); renderTests(key); }

/* Тесты-листалка: один вопрос на экране, стрелки ← →, кнопки «Загуглить» и «Спросить ИИ». Сначала база, потом доп. вопросы в случайном порядке. */
function plainQ(s){ return String(s).replace(/```(?:cpp)?\n?/g,'\n').replace(/`/g,'').replace(/\n{2,}/g,'\n').trim(); }
function renderCarousel(root,key,T){
  // C++: вопросы базы тоже в случайном порядке (новый порядок при каждой загрузке)
  const BN=T.baseName||'Из базы'; const seq=[...shuffle(T.base).map(it=>({it,src:it.src==='exam2022'?'Экзамен 2022 (54 вопроса)':BN})),...shuffle(T.pool).map(it=>({it,src:'Дополнительный'}))];
  if(!seq.length){ root.innerHTML='<p style="color:var(--muted)">Тестов к этой теме пока нет.</p>'; return; }
  const st=seq.map(()=>null); let cur=0, ok=0, all=0;
  root.innerHTML=`<div class="tcar" tabindex="0" aria-label="Тесты: стрелки влево и вправо листают вопросы">
    <div class="tc-top"><span class="tc-n"></span><span class="tc-src"></span><span class="tc-sc">Верно: <b>0 из 0</b></span></div>
    <div class="tc-bar" aria-hidden="true"><i></i></div>
    <div class="q tc-q"></div>
    <div class="tc-ask"><a class="btn tc-g" target="_blank" rel="noopener">🔎 Загуглить вопрос</a><a class="btn tc-ai" target="_blank" rel="noopener">✨ Спросить ИИ (Google)</a></div>
    <div class="tc-nav"><button class="btn" data-n="-1">← Назад</button><span class="tc-pos"></span><button class="btn pri" data-n="1">Вперёд →</button></div>
    <div class="tc-foot"><button class="btn tc-next-un">К следующему без ответа</button><button class="btn tc-reset">Начать заново</button></div></div>`;
  const q=root.querySelector('.tc-q'), sc=root.querySelector('.tc-sc b'), bar=root.querySelector('.tc-bar i');
  const show=()=>{
    const {it,src}=seq[cur]; let s=st[cur];
    if(!s){ s=st[cur]={opts:shuffle(it.a.map((t,i)=>({t,ok:i===0}))),pick:null}; }
    root.querySelector('.tc-n').textContent=`Вопрос ${cur+1} из ${seq.length}`;
    root.querySelector('.tc-src').textContent=src+(src===BN&&cur===T.base.length-1&&T.pool.length?' · дальше — доп. вопросы':'');
    root.querySelector('.tc-pos').textContent=`${cur+1} / ${seq.length}`;
    bar.style.width=((cur+1)/seq.length*100)+'%';
    q.innerHTML=`<div class="qt">${qfmt(it.q)}</div>${it.en?`<div class="qen">(EN) ${esc(it.en)}</div>`:''}<div class="opts">${s.opts.map((o,i)=>`<button class="opt" data-i="${i}">${qfmt(o.t)}</button>`).join('')}</div>`;
    if(s.pick!=null) mark(s);
    const txt=plainQ(it.q)+'\nВарианты ответа:\n'+s.opts.map((o,i)=>(i+1)+') '+plainQ(o.t)).join('\n');
    root.querySelector('.tc-g').href='https://www.google.com/search?q='+encodeURIComponent(txt);
    root.querySelector('.tc-ai').href='https://www.google.com/search?udm=50&q='+encodeURIComponent(txt+'\nКакой вариант правильный? Объясни простыми словами, почему.');
    root.querySelectorAll('.tc-nav button')[0].disabled=cur===0; root.querySelectorAll('.tc-nav button')[1].disabled=cur===seq.length-1;
  };
  const mark=(s)=>{ const it=seq[cur].it;
    q.querySelectorAll('.opt').forEach((x,i)=>{ x.disabled=true; if(s.opts[i].ok) x.classList.add('right'); if(i===s.pick&&!s.opts[i].ok) x.classList.add('wrong'); });
    const o=s.opts[s.pick]; const ex=document.createElement('div'); ex.className='ex'; ex.innerHTML=qfmt((o.ok?'Верно. ':'Неверно. ')+(it.e||('Правильный ответ: '+it.a[0]))); q.appendChild(ex); };
  q.addEventListener('click',e=>{ const b=e.target.closest('.opt'); if(!b) return; const s=st[cur]; if(s.pick!=null) return; s.pick=+b.dataset.i; all++; if(s.opts[s.pick].ok) ok++; sc.textContent=`${ok} из ${all}`; mark(s); });
  const go=d=>{ const n=cur+d; if(n<0||n>=seq.length) return; cur=n; show(); };
  root.querySelector('.tc-nav').addEventListener('click',e=>{ const b=e.target.closest('[data-n]'); if(b) go(+b.dataset.n); });
  root.querySelector('.tc-next-un').addEventListener('click',()=>{ for(let k=1;k<=seq.length;k++){ const n=(cur+k)%seq.length; if(!st[n]||st[n].pick==null){ cur=n; show(); return; } } toast('На все вопросы уже есть ответ'); });
  root.querySelector('.tc-reset').addEventListener('click',()=>renderTests(key));
  root.querySelector('.tcar').addEventListener('keydown',e=>{ if(e.target.closest('input,textarea')) return;
    if(e.key==='ArrowRight'){ e.preventDefault(); go(1); } else if(e.key==='ArrowLeft'){ e.preventDefault(); go(-1); }
    else if(/^[1-9]$/.test(e.key)){ const b=q.querySelectorAll('.opt')[+e.key-1]; if(b&&!b.disabled) b.click(); } });
  show();
}
function renderTests(key){
  const root=document.getElementById('tests-'+key), T=getTests(key), ed=ED.editing;
  if(!root) return;
  if(!ed) return renderCarousel(root,key,T);
  let score={ok:0,all:0}; let pool=shuffle(T.pool.map((_,i)=>i)), pi=0;
  root.innerHTML=`${ed?`<div class="tedbar">
      <b style="margin-right:4px">Тесты:</b>
      <button class="btn" data-z="addb">+ Вопрос в базу</button>
      <button class="btn" data-z="addp">+ Вопрос в доп.</button>
      <select aria-label="Куда загружать вопросы" class="impSec"><option value="base">в базу</option><option value="pool">в доп.</option></select>
      <label class="btn" for="timp-${key}">Загрузить .txt</label><input type="file" id="timp-${key}" accept=".txt,text/plain" hidden>
      <button class="btn" data-z="exp">Скачать тесты (.txt)</button>
      <button class="btn" data-z="def">${ED.tests[key]?'Вернуть тесты по умолчанию':'Тесты по умолчанию'}</button>
      <span class="tmsg" style="font-size:13px;color:var(--muted);width:100%">Формат как в базе: строка &lt;question&gt;, потом &lt;variant&gt;. Правильный — &lt;variantright&gt;, а если его нет, первый вариант.</span>
    </div>`:''}
    <p>${ed?'В режиме редактора показаны все вопросы — можно менять, удалять и добавлять.':'Отвечай кликом — сразу увидишь, верно ли, и короткое объяснение.'}</p>
    <div class="score"><span>Верно: <b class="sc">0 из 0</b></span></div>
    <h3>Из базы (${T.base.length})</h3><div class="qbox qb-base"></div>
    <h3>${ed?`Дополнительные (все ${T.pool.length})`:`Дополнительные: случайные 5 из ${T.pool.length}`}</h3><div class="qbox qb-pool"></div>
    ${ed?'':'<div class="score"><button class="btn pri more">Показать ещё 5</button><span class="left" style="color:var(--muted);font-size:14px"></span></div>'}`;
  const sc=root.querySelector('.sc');
  const openForm=(card,sec,idx)=>{
    const it= idx==null ? {q:'',a:['',''],e:''} : T[sec][idx];
    const f=document.createElement('div'); f.className='q qform';
    f.innerHTML=`<div class="qn">${idx==null?'Новый вопрос':'Изменение вопроса'}</div>
      <textarea spellcheck="false" aria-label="Вопрос в формате базы"></textarea>
      <label>Пояснение после ответа (необязательно)<input class="qe"></label>
      <div class="err"></div>
      <div class="qctl"><button class="btn pri" data-f="save">Сохранить</button><button class="btn" data-f="cancel">Отмена</button></div>`;
    f.querySelector('textarea').value = idx==null ? '<question>\n<variantright>\n<variant>\n<variant>\n<variant>\n<variant>' : toFormat(it);
    f.querySelector('.qe').value=it.e||'';
    f.addEventListener('click',e=>{ const b=e.target.closest('[data-f]'); if(!b) return;
      if(b.dataset.f==='cancel'){ renderTests(key); return; }
      const {good}=parseQuestions(f.querySelector('textarea').value);
      if(good.length!==1){ f.querySelector('.err').textContent= good.length? 'Здесь больше одного вопроса — для пачки используй «Загрузить .txt».' : 'Нужна строка <question> с текстом и минимум два варианта (<variant> или <variantright>).'; return; }
      const q=good[0]; q.e=f.querySelector('.qe').value.trim();
      const data=clone(T); if(idx==null) data[sec].push(q); else data[sec][idx]=q; saveTests(key,data); });
    if(card) card.replaceWith(f); else root.querySelector(sec==='base'?'.qb-base':'.qb-pool').appendChild(f);
    f.querySelector('textarea').focus();
  };
  const mk=(item,n,box,sec,idx)=>{
    const d=document.createElement('div'); d.className='q';
    const opts=shuffle(item.a.map((t,i)=>({t,ok:i===0})));
    d.innerHTML=`<div class="qn">${n}</div><div class="qt">${qfmt(item.q)}</div><div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}">${qfmt(o.t)}</button>`).join('')}</div>
      ${ed?`<div class="qctl"><button class="btn" data-c="edit">Изменить</button><button class="btn" data-c="del">Удалить</button></div>`:''}`;
    d.querySelector('.opts').addEventListener('click',e=>{ const b=e.target.closest('.opt'); if(!b) return; const o=opts[+b.dataset.i];
      d.querySelectorAll('.opt').forEach((x,i)=>{ x.disabled=true; if(opts[i].ok) x.classList.add('right'); });
      if(!o.ok) b.classList.add('wrong');
      score.all++; if(o.ok) score.ok++; sc.textContent=`${score.ok} из ${score.all}`;
      const ex=document.createElement('div'); ex.className='ex'; ex.innerHTML=qfmt((o.ok?'Верно. ':'Неверно. ')+(item.e||('Правильный ответ: '+item.a[0]))); d.insertBefore(ex,d.querySelector('.qctl')); });
    if(ed) d.querySelector('.qctl').addEventListener('click',e=>{ const b=e.target.closest('[data-c]'); if(!b) return;
      if(b.dataset.c==='edit') openForm(d,sec,idx);
      if(b.dataset.c==='del'){ if(b.dataset.sure){ const data=clone(T); data[sec].splice(idx,1); saveTests(key,data); } else { b.dataset.sure='1'; b.textContent='Точно удалить?'; b.classList.add('pri'); } } });
    box.appendChild(d);
  };
  const bb=root.querySelector('.qb-base'); T.base.forEach((it,i)=>mk(it,'База · '+(i+1),bb,'base',i));
  const pb=root.querySelector('.qb-pool');
  if(ed){ T.pool.forEach((it,i)=>mk(it,'Доп. · '+(i+1),pb,'pool',i)); }
  else if(T.pool.length){
    const more=root.querySelector('.more'), left=root.querySelector('.left');
    const addFive=()=>{ for(let k=0;k<Math.min(5,T.pool.length);k++){ if(pi>=pool.length){ pool=shuffle(T.pool.map((_,i)=>i)); pi=0; } mk(T.pool[pool[pi]],'Доп. · '+(pb.children.length+1),pb,'pool',pool[pi]); pi++; }
      left.textContent= pi<pool.length ? `Осталось новых: ${pool.length-pi}` : 'Все вопросы показаны — дальше пойдут по новому кругу.'; };
    more.addEventListener('click',addFive); addFive();
  } else { const m=root.querySelector('.more'); if(m) m.hidden=true; }
  if(ed){
    const bar=root.querySelector('.tedbar'), msg=bar.querySelector('.tmsg');
    bar.addEventListener('click',e=>{ const b=e.target.closest('[data-z]'); if(!b) return;
      if(b.dataset.z==='addb') openForm(null,'base',null);
      if(b.dataset.z==='addp') openForm(null,'pool',null);
      if(b.dataset.z==='exp'){ const t=getTests(key); saveFile(`Тесты темы ${key.slice(1)}.txt`, [...t.base,...t.pool].map(toFormat).join('\n')+'\n'); }
      if(b.dataset.z==='def'){ if(!ED.tests[key]) return; if(b.dataset.sure){ ED.tests[key]=null; store.setTests(key,null); renderTests(key); } else { b.dataset.sure='1'; b.textContent='Точно? Твои тесты удалятся'; b.classList.add('pri'); } }
    });
    bar.querySelector('input[type=file]').addEventListener('change',async e=>{ const file=e.target.files[0]; if(!file) return;
      const {good,bad}=parseQuestions(await file.text()); const sec=bar.querySelector('.impSec').value;
      if(!good.length){ msg.textContent='В файле не нашлось вопросов в формате <question> / <variant>. Если это .docx — сохрани его как «Обычный текст (.txt)».'; return; }
      const data=clone(getTests(key)); data[sec].push(...good); saveTests(key,data);
      toast(`Добавлено вопросов: ${good.length}${bad.length?`, пропущено (меньше двух вариантов): ${bad.length}`:''}`); });
  }
}

/* ======================= Редактор и хранилище правок ======================= */
const ED={mode:'none',db:null,dl:null,canEdit:false,editing:false,blocks:{},tests:{}};
const UNIT_SEL=['.topic-head h1','.read > p','.read > ul','.read > ol','.read > h2','.read > h3','.read > h4','.read > pre','.read > .tw','.read > aside','.read > details.lab-orig > .body','.solve > p','.solve > ul','.solve > ol','.solve > pre','.solve > .tw','.solve > .trap','.solve > .task','.read > .lab-task'].join(',');
const units={};
const LS_KEY='arch-edits-v1';
function hashStr(s){let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36);}
function initUnits(){ const seen={};
  document.querySelectorAll(UNIT_SEL).forEach(el=>{ if(el.closest('.sim,.widget,.reveal,.cppw,.vclw,[id^="tests-"]')) return;
    let id=el.closest('.topic').id+'-'+hashStr(el.tagName+'|'+el.textContent.replace(/\s+/g,' ').trim());
    if(seen[id]){ seen[id]++; id+='-'+seen[id]; } else seen[id]=1;
    el.dataset.eid=id; el.classList.add('eunit'); units[id]={el,orig:el.innerHTML}; });
}
function sanitize(html){ const t=document.createElement('template'); t.innerHTML=html||'';
  t.content.querySelectorAll('script,style,iframe,object,embed,link,meta,form').forEach(n=>n.remove());
  t.content.querySelectorAll('*').forEach(n=>{ [...n.attributes].forEach(a=>{ if(/^on/i.test(a.name)||a.name==='contenteditable'||(/^(href|src|xlink:href)$/i.test(a.name)&&/^\s*(javascript|data):/i.test(a.value))) n.removeAttribute(a.name); }); });
  return t.innerHTML; }
function applyAll(){
  for(const id in units){ const u=units[id], o=ED.blocks[id];
    u.el.innerHTML = o&&o.html!=null ? sanitize(o.html) : u.orig;
    u.el.classList.toggle('edited',!!(o&&o.html!=null)); u.el.classList.toggle('deleted',!!(o&&o.del)); }
  document.querySelectorAll('.ublock').forEach(x=>x.remove());
  Object.entries(ED.blocks).filter(([,b])=>b&&b.after).sort((a,b)=>(a[1].ts||0)-(b[1].ts||0)).forEach(([id,b])=>insertUblock(id,b));
  setEditable(ED.editing);
}
function insertUblock(id,b){
  const anchor=document.querySelector(`[data-eid="${CSS.escape(b.after)}"]`); if(!anchor) return null;
  let ref=anchor; while(ref.nextElementSibling&&ref.nextElementSibling.classList.contains('ublock')&&ref.nextElementSibling.dataset.after===b.after) ref=ref.nextElementSibling;
  const d=document.createElement('div'); d.className='ublock eunit'; d.dataset.eid=id; d.dataset.after=b.after; d.innerHTML=sanitize(b.html);
  ref.after(d); return d;
}
function setEditable(on){ document.querySelectorAll('.eunit').forEach(el=>{ if(on){el.contentEditable='true'; el.spellcheck=true;} else el.removeAttribute('contenteditable'); }); }

const store={
  chains:{},
  q(path,fn){ setStat('saving'); this.chains[path]=(this.chains[path]||Promise.resolve()).then(fn).then(()=>setStat('ok'),e=>{ setStat('err',e); }); return this.chains[path]; },
  saveLocal(){ try{ localStorage.setItem(LS_KEY,JSON.stringify({blocks:ED.blocks,tests:ED.tests})); setStat('ok'); }catch(e){ setStat('err',e); } },
  setBlock(id,data){ if(data) ED.blocks[id]=data; else delete ED.blocks[id];
    if(ED.mode==='db') return this.q('edits/'+id,()=> data ? ED.db.collection('edits').doc(id).set(data) : ED.db.collection('edits').doc(id).delete());
    this.saveLocal(); },
  setTests(k,data){ if(ED.mode==='db') return this.q('tests/'+k,()=> data ? ED.db.doc('tests/'+k).set(data) : ED.db.doc('tests/'+k).delete());
    this.saveLocal(); },
  async load(){
    if(ED.mode==='db'){
      const timeout=new Promise((_,rej)=>setTimeout(()=>rej({code:'timeout'}),10000));
      const snap=await Promise.race([ED.db.collection('edits').get(),timeout]);
      snap.docs.forEach(d=>{ ED.blocks[d.id]=clone(d.data()); });
      for(const k of TOPICS){ const s=await Promise.race([ED.db.doc('tests/'+k).get(),timeout]); if(s.exists) ED.tests[k]=clone(s.data()); }
    } else { try{ const raw=localStorage.getItem(LS_KEY); if(raw){ const o=JSON.parse(raw); ED.blocks=o.blocks||{}; ED.tests=o.tests||{}; } }catch(_){} }
  }
};
function setStat(s,e){ const el=document.getElementById('edstat'); if(!el) return;
  const where= ED.mode==='db' ? 'видят все, у кого есть доступ к сайту' : 'только в этом браузере — скачивай файл правок';
  if(s==='saving') el.textContent='Сохраняю…';
  else if(s==='ok') el.textContent=`Сохранено ✓ (${where})`;
  else if(s==='err') el.textContent=`Не сохранилось: ${(e&&(e.code||e.message))||'ошибка'}. Скачай правки файлом, чтобы не потерять.`;
  else el.textContent=s; }
function toast(t){ const d=document.createElement('div'); d.className='toast'; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),3200); }
async function saveFile(name,text){
  if(ED.dl){ try{ await ED.dl.save({filename:name,data:text}); toast('Файл сохранён: '+name); return; }catch(e){ if(e&&e.code==='declined') return; } }
  const m=document.createElement('div'); m.className='modal';
  m.innerHTML=`<div class="box"><b>${esc(name)}</b><span style="font-size:14px;color:var(--muted)">Скачивание здесь недоступно. Скопируй текст и сохрани его в файл с этим именем.</span><textarea readonly></textarea><div class="qctl"><button class="btn pri" data-m="copy">Копировать</button><button class="btn" data-m="close">Закрыть</button></div></div>`;
  m.querySelector('textarea').value=text; document.body.appendChild(m);
  m.addEventListener('click',async e=>{ const b=e.target.closest('[data-m]'); if(e.target===m||(b&&b.dataset.m==='close')) m.remove();
    if(b&&b.dataset.m==='copy'){ const ta=m.querySelector('textarea'); try{ await navigator.clipboard.writeText(ta.value); toast('Скопировано'); }catch(_){ ta.select(); } } });
}

// --- работа с блоками
const timers={};
function saveUnit(el){
  const id=el.dataset.eid; if(!id) return; clearTimeout(timers[id]);
  const html=sanitize(el.innerHTML);
  if(el.classList.contains('ublock')){ const b=ED.blocks[id]||{after:el.dataset.after,ts:Date.now()}; store.setBlock(id,{...b,html}); return; }
  const u=units[id], cur=ED.blocks[id]||{};
  if(html===u.orig && !cur.del){ store.setBlock(id,null); el.classList.remove('edited'); return; }
  store.setBlock(id,{...cur,html: html===u.orig?null:html,ts:Date.now()}); el.classList.toggle('edited',html!==u.orig);
}
let focusEl=null; const tool=document.getElementById('edtool')||document.createElement('div');
function placeTool(){ if(!focusEl||!ED.editing){ tool.hidden=true; return; }
  const r=focusEl.getBoundingClientRect(); tool.hidden=false;
  const top=window.scrollY+r.top-tool.offsetHeight-8; tool.style.top=Math.max(window.scrollY+70,top)+'px';
  tool.style.left=Math.max(8,Math.min(window.scrollX+r.left, window.scrollX+document.documentElement.clientWidth-tool.offsetWidth-8))+'px';
  tool.querySelector('[data-t=orig]').hidden=focusEl.classList.contains('ublock');
  tool.querySelector('[data-t=del]').textContent= focusEl.classList.contains('deleted') ? 'Блок удалён' : 'Удалить блок'; }
document.addEventListener('focusin',e=>{ if(!ED.editing) return; const u=e.target.closest&&e.target.closest('.eunit'); if(u){ focusEl=u; placeTool(); } });
document.addEventListener('input',e=>{ const u=e.target.closest&&e.target.closest('.eunit'); if(!u||!ED.editing) return; setStat('Есть несохранённые изменения…'); clearTimeout(timers[u.dataset.eid]); timers[u.dataset.eid]=setTimeout(()=>saveUnit(u),1200); placeTool(); });
document.addEventListener('focusout',e=>{ const u=e.target.closest&&e.target.closest('.eunit'); if(u&&ED.editing&&timers[u.dataset.eid]) saveUnit(u); });
document.addEventListener('paste',e=>{ const u=e.target.closest&&e.target.closest('.eunit'); if(!u||!ED.editing) return; e.preventDefault(); const t=(e.clipboardData||window.clipboardData).getData('text/plain'); document.execCommand('insertText',false,t); });
window.addEventListener('resize',placeTool); window.addEventListener('scroll',()=>{ if(!tool.hidden) placeTool(); },{passive:true});
tool.addEventListener('mousedown',e=>e.preventDefault());
tool.addEventListener('click',e=>{ const b=e.target.closest('[data-t]'); if(!b||!focusEl) return; const el=focusEl, id=el.dataset.eid;
  if(b.dataset.t==='bold'){ document.execCommand('bold'); return; }
  if(b.dataset.t==='italic'){ document.execCommand('italic'); return; }
  if(b.dataset.t==='list'){ document.execCommand('insertUnorderedList'); return; }
  if(b.dataset.t==='add'){ const nid='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); const blk={after:id,html:'<p>Новый блок — впиши сюда свой текст.</p>',ts:Date.now()};
    store.setBlock(nid,blk); const d=insertUblock(nid,blk); if(d){ d.contentEditable='true'; d.focus(); const sel=getSelection(); sel.selectAllChildren(d); } return; }
  if(b.dataset.t==='orig'){ if(el.classList.contains('ublock')) return; clearTimeout(timers[id]); el.innerHTML=units[id].orig; el.classList.remove('edited','deleted'); store.setBlock(id,null); placeTool(); toast('Блок возвращён к оригиналу'); return; }
  if(b.dataset.t==='del'){
    if(el.classList.contains('ublock')){ clearTimeout(timers[id]); const after=el.dataset.after;
      Object.entries(ED.blocks).forEach(([cid,cb])=>{ if(cb&&cb.after===id) store.setBlock(cid,{...cb,after}); });
      store.setBlock(id,null); el.remove(); focusEl=null; placeTool(); applyAll(); return; }
    if(el.classList.contains('deleted')) return;
    const cur=ED.blocks[id]||{}; store.setBlock(id,{...cur,html:cur.html??null,del:true,ts:Date.now()}); el.classList.add('deleted'); placeTool(); toast('Блок удалён. «Вернуть оригинал» — отменить.'); }
});
function setEditing(on){
  ED.editing=on; document.body.classList.toggle('editing',on);
  document.getElementById('edbar').hidden=!on; const btn=document.getElementById('edBtn'); btn.classList.toggle('on',on); btn.textContent=on?'✎ Редактор включён':'✎ Редактор';
  if(!on){ document.querySelectorAll('.eunit').forEach(el=>{ if(timers[el.dataset.eid]) saveUnit(el); }); focusEl=null; }
  setEditable(on); placeTool();
  if(on){ document.querySelectorAll('details.lab-orig, details.lec, details.sol').forEach(d=>d.open=true); setStat('ok'); }
  TOPICS.forEach(renderTests);
}
document.getElementById('edBtn').addEventListener('click',()=>setEditing(!ED.editing));
document.getElementById('edbar').addEventListener('click',e=>{ const b=e.target.closest('[data-x]'); if(!b) return; const topic=document.querySelector('.topic:not([hidden])').id;
  if(b.dataset.x==='done') setEditing(false);
  if(b.dataset.x==='json') saveFile(`Правки архитектура ${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({site:'arch-8-9',version:1,exported:new Date().toISOString(),blocks:ED.blocks,tests:ED.tests},null,1));
  if(b.dataset.x==='txt'){ const parts=[]; document.querySelectorAll(`#${topic} .eunit:not(.deleted)`).forEach(el=>{ const t=(el.innerText||el.textContent).trim(); if(t) parts.push(t); });
    const T=getTests(topic); parts.push('\n=== ТЕСТЫ ===\n'+[...T.base,...T.pool].map(toFormat).join('\n'));
    saveFile(`Конспект темы ${topic.slice(1)} (с правками).txt`, parts.join('\n\n')+'\n'); }
  if(b.dataset.x==='reset'){ if(!b.dataset.sure){ b.dataset.sure='1'; b.textContent=`Точно сбросить тему ${topic.slice(1)}? Нажми ещё раз`; b.classList.add('pri'); setTimeout(()=>{ delete b.dataset.sure; b.textContent='Сбросить правки темы'; b.classList.remove('pri'); },5000); return; }
    delete b.dataset.sure; b.textContent='Сбросить правки темы'; b.classList.remove('pri');
    Object.keys(ED.blocks).filter(id=>id.startsWith(topic+'-')||(ED.blocks[id]&&ED.blocks[id].after&&String(ED.blocks[id].after).startsWith(topic+'-'))).forEach(id=>store.setBlock(id,null));
    if(ED.tests[topic]){ ED.tests[topic]=null; store.setTests(topic,null); }
    applyAll(); renderTests(topic); toast('Правки темы сброшены'); }
});
document.getElementById('edImport').addEventListener('change',async e=>{ const file=e.target.files[0]; e.target.value=''; if(!file) return;
  let o; try{ o=JSON.parse(await file.text()); }catch(_){ toast('Это не файл правок (.json)'); return; }
  if(!o||typeof o!=='object'||!o.blocks){ toast('В файле нет правок этого сайта'); return; }
  let n=0; for(const [id,b] of Object.entries(o.blocks)){ if(b&&typeof b==='object'){ store.setBlock(id,b); n++; } }
  for(const k of TOPICS){ if(o.tests&&o.tests[k]&&Array.isArray(o.tests[k].base)&&Array.isArray(o.tests[k].pool)){ ED.tests[k]=o.tests[k]; store.setTests(k,o.tests[k]); } }
  applyAll(); TOPICS.forEach(renderTests); toast(`Загружено правок: ${n}`); });

async function initEditor(){
  let db=null,user=null,dl=null;
  if(window.claude&&typeof window.claude.use==='function'){
    [db,user,dl]=await Promise.all([claude.use('db').catch(()=>null),claude.use('user').catch(()=>null),claude.use('downloads').catch(()=>null)]);
  }
  ED.dl=dl;
  if(db){ ED.mode='db'; ED.db=db; ED.canEdit= user ? await user.canEdit() : false; }
  else { ED.mode='local'; ED.canEdit=true; }
  try{ await store.load(); }catch(e){ if(ED.mode==='db'){ toast('Правки пока не загрузились — показан оригинал.'); } }
  if(Object.keys(ED.blocks).length) applyAll();
  if(TOPICS.some(k=>ED.tests[k])) TOPICS.forEach(renderTests);
  document.getElementById('edBtn').hidden=!ED.canEdit;
}
