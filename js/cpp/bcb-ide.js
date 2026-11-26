/* Вкладка «C++Builder» (после темы 15): почти полноценная среда Borland C++Builder 6 в браузере.
   Проект из нескольких форм и модулей (Unit1.cpp/.h, Unit2…), меню File/Edit/Search/View/Project/Run/Help,
   палитра компонентов, Object Inspector, дизайнер форм, редактор с вкладками модулей, Project Manager,
   Project → Options → Forms (главная форма, Auto-create / Available), Include Unit Hdr, Project1.cpp,
   запуск нескольких окон (Show, ShowModal, Close, CreateForm), консольные программы с вводом с клавиатуры.
   Обработчики выполняет интерпретатор C++ (cpp-run.js) через мост VCL (vcl.js). Проекты хранятся в localStorage. */
(function(G){
'use strict';
const CPP=G.CPP, V=CPP.VCL, VU=CPP.VCLUI;
const {esc,amp,fontCss,treeHTML,menuBarHTML}=VU;
const SEP=V.SEPL, KEY='bcb6:';
const store={ get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} } };
const jget=(k,d)=>{ try{ const s=store.get(k); return s?JSON.parse(s):d; }catch(e){ return d; } };

/* ================= шаблоны файлов ================= */
const consoleCpp=()=>`${SEP}

#pragma hdrstop

${SEP}

#pragma argsused
int main(int argc, char* argv[])
{
        return 0;
}
${SEP}
`;
const unitCpp=un=>`${SEP}

#pragma hdrstop

#include "${un}.h"

${SEP}

#pragma package(smart_init)
`;
const unitHdr=un=>`${SEP}

#ifndef ${un}H
#define ${un}H
${SEP}

${SEP}
#endif
`;

/* ================= проект ================= */
const freeUnit=prj=>{ let k=1; while(prj.forms.some(p=>p.un==='Unit'+k)||prj.units.some(u=>u.un==='Unit'+k)) k++; return 'Unit'+k; };
const freeForm=prj=>{ let k=1; while(prj.forms.some(p=>p.fn==='Form'+k)) k++; return 'Form'+k; };
function addForm(prj){
  const fn=freeForm(prj), un=freeUnit(prj), k=prj.forms.length;
  const p=new V.Project({formName:fn,unitName:un,form:{Caption:fn,Visible:false,Left:200+k*24,Top:120+k*24}});
  prj.forms.push(p); prj.auto.push(fn); if(!prj.main) prj.main=fn; return p;
}
function addUnit(prj){ const un=freeUnit(prj); const u={un,cpp:unitCpp(un),h:unitHdr(un)}; prj.units.push(u); return u; }
function newProject(kind,name){
  const prj={name:name||'Project1',kind,forms:[],units:[],main:null,auto:[],title:''};
  if(kind==='console') prj.units.push({un:'Unit1',cpp:consoleCpp(),h:null});
  else addForm(prj);
  return prj;
}
const prjJSON=prj=>({v:1,name:prj.name,kind:prj.kind,forms:prj.forms.map(p=>p.toJSON()),units:prj.units.map(u=>Object.assign({},u)),main:prj.main,auto:prj.auto.slice(),title:prj.title||''});
function prjLoad(d){
  const prj={name:d.name||'Project1',kind:d.kind||'vcl',forms:(d.forms||[]).map(j=>new V.Project(j)),units:(d.units||[]).map(u=>Object.assign({},u)),main:d.main,auto:(d.auto||[]).slice(),title:d.title||''};
  if(prj.kind==='vcl'&&!prj.forms.length) addForm(prj);
  if(!prj.main&&prj.forms[0]) prj.main=prj.forms[0].fn;
  return prj;
}
const fileText=(prj,un,ext)=>{ const p=prj.forms.find(x=>x.un===un); if(p) return ext==='h'?p.unitH():p.code; const u=prj.units.find(x=>x.un===un); return u?(ext==='h'?u.h:u.cpp):''; };

// Project1.cpp — его пишет сам Builder
function projectCpp(prj){
  if(prj.kind==='console') return `${SEP}\n\n#include <vcl.h>\n#pragma hdrstop\n${SEP}\n`+prj.units.map(u=>`USEUNIT("${u.un}.cpp");\n`).join('')+`${SEP}\n// консольное приложение (Console Wizard): функция main() — в ${prj.units[0]?prj.units[0].un:'Unit1'}.cpp\n`;
  const order=[prj.main,...prj.auto.filter(f=>f!==prj.main)].filter(f=>prj.auto.includes(f)||f===prj.main);
  const byFn=fn=>prj.forms.find(p=>p.fn===fn);
  return `${SEP}

#include <vcl.h>
#pragma hdrstop
${SEP}
${prj.forms.map(p=>`USEFORM("${p.un}.cpp", ${p.fn});`).join('\n')}${prj.units.length?'\n'+prj.units.map(u=>`USEUNIT("${u.un}.cpp");`).join('\n'):''}
${SEP}
WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int)
{
        try
        {
                 Application->Initialize();
${prj.title?`                 Application->Title = "${prj.title}";\n`:''}${order.filter(byFn).map(fn=>`                 Application->CreateForm(__classid(${byFn(fn).cls}), &${fn});`).join('\n')}
                 Application->Run();
        }
        catch (Exception &exception)
        {
                 Application->ShowException(&exception);
        }
        catch (...)
        {
                 try
                 {
                         throw Exception("");
                 }
                 catch (Exception &exception)
                 {
                         Application->ShowException(&exception);
                 }
        }
        return 0;
}
${SEP}
`;
}

/* ================= сборка: все модули в один текст + карта строк ================= */
const nlKeep=m=>'\n'.repeat((m.match(/\n/g)||[]).length);
// убрать комментарии и строки, сохранив переводы строк (для проверки #include)
const stripCS=s=>String(s).replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' ')).replace(/\/\/[^\n]*/g,'').replace(/"(?:\\.|[^"\\\n])*"/g,'""').replace(/'(?:\\.|[^'\\\n])*'/g,"' '");
const includesOf=t=>{ const r=new Set(); let m; const re=/^[ \t]*#include\s*"([^"]+?)\.h"/gm; while((m=re.exec(t))) r.add(m[1]); return r; };
const KW=new Set(['if','while','for','switch','return','sizeof','catch','do','else','new','delete']);
function build(prj){
  const names=new Set([...prj.forms.map(p=>p.un),...prj.units.map(u=>u.un)]);
  const blank=t=>String(t||'').replace(/^[ \t]*#include\s*"([^"]+?)\.h"[^\n]*$/gm,(m,n)=>names.has(n)?'':m);
  const blocks=[];
  for(const p of prj.forms){
    const h=p.unitH().replace(new RegExp('__fastcall\\s+'+p.cls+'\\s*\\(\\s*TComponent\\s*\\*\\s*\\w+\\s*\\)\\s*;'),'void __fastcall FormCtor__(TObject *Sender);').replace('extern PACKAGE','extern');
    blocks.push({un:p.un,ext:'h',text:h}); }
  for(const u of prj.units) if(u.h) blocks.push({un:u.un,ext:'h',text:blank(u.h)});
  for(const p of prj.forms) blocks.push({un:p.un,ext:'cpp',text:blank(p.code).replace(p.ctorRe(),m=>`void __fastcall ${p.cls}::FormCtor__(TObject *Sender)`+nlKeep(m))});
  for(const u of prj.units) blocks.push({un:u.un,ext:'cpp',text:blank(u.cpp)});
  let line=1; const parts=[];
  for(const b of blocks){ const t=b.text.replace(/\s+$/,''); b.start=line; b.len=t.split('\n').length; line+=b.len; parts.push(t); }
  return {src:parts.join('\n')+'\n',blocks};
}
const whereOf=(b,line)=>{ for(const x of b.blocks) if(line>=x.start&&line<x.start+x.len) return {un:x.un,ext:x.ext,line:line-x.start+1}; return null; };
// модуль пользуется формой или функцией другого модуля, но не подключил его заголовок
function includeErrors(prj){
  const ex=[];
  for(const p of prj.forms) ex.push({un:p.un,form:true,syms:[p.fn,p.cls]});
  for(const u of prj.units) if(u.h){ const t=stripCS(u.h), s=new Set(); let m;
    const fr=/\b([A-Za-z_]\w*)\s*\([^;{}]*\)\s*;/g; while((m=fr.exec(t))) if(!KW.has(m[1])) s.add(m[1]);
    const cr=/\b(?:class|struct)\s+([A-Za-z_]\w*)/g; while((m=cr.exec(t))) s.add(m[1]);
    const er=/\bextern\s+[\w\s*&]+?\b([A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\s*;/g; while((m=er.exec(t))) s.add(m[1]);
    ex.push({un:u.un,form:false,syms:[...s]}); }
  const files=[...prj.forms.map(p=>({un:p.un,t:p.code})),...prj.units.map(u=>({un:u.un,t:u.cpp}))];
  const errs=[];
  for(const f of files){
    const inc=includesOf(f.t), lines=stripCS(f.t).split('\n');
    for(const e of ex){ if(e.un===f.un||inc.has(e.un)) continue;
      for(const s of e.syms){ const re=new RegExp('(^|[^\\w.>:])'+s+'\\b'); const k=lines.findIndex(l=>re.test(l)); if(k<0) continue;
        const isFn=!e.form&&new RegExp(s+'\\s*\\(').test(lines[k]);
        errs.push({un:f.un,ext:'cpp',line:k+1,code:isFn?'E2268':'E2451',msg:isFn?`Call to undefined function '${s}'`:`Undefined symbol '${s}'`,
          hint:`${s} описан в ${e.un}.h — подключи его: #include "${e.un}.h" (File → Include Unit Hdr…, Alt+F11)`}); break; } }
  }
  return errs;
}

/* ================= примеры ================= */
function example(id){
  const prj=newProject('vcl',id==='modal'?'ModalDemo':'ThreeForms');
  const H=(cls,name,body,sig)=>`void __fastcall ${cls}::${name}(${sig||'TObject *Sender'})\n{\n${body}\n}\n${SEP}\n`;
  const setCode=(p,inc,body)=>{ p.code=V.buildUnit('',p.un,p.fn,p.cls).replace(`#include "${p.un}.h"\n`,`#include "${p.un}.h"\n${inc}`)+body; };
  if(id==='modal'){
    const f1=prj.forms[0], f2=addForm(prj);
    f1.load({formName:'Form1',unitName:'Unit1',form:{Caption:'Главная форма',Width:360,Height:200},comps:[
      {type:'TLabel',Name:'Label1',Caption:'Как тебя зовут?',Left:24,Top:24,Width:200,Font:{Size:10}},
      {type:'TButton',Name:'Button1',Caption:'Ввести имя…',Left:24,Top:64,Width:120,events:{OnClick:'Button1Click'}},
      {type:'TButton',Name:'Button2',Caption:'Выход',Left:160,Top:64,events:{OnClick:'Button2Click'}}]});
    setCode(f1,'#include "Unit2.h"\n',H('TForm1','Button1Click','  Form2->Edit1->Text = "";\n  if (Form2->ShowModal() == mrOk)            // ждём, пока Form2 закроют\n    Label1->Caption = "Привет, " + Form2->Edit1->Text + "!";\n  else\n    Label1->Caption = "Ввод отменён";')+H('TForm1','Button2Click','  Close();                                   // главная форма — закроется всё приложение'));
    f2.load({formName:'Form2',unitName:'Unit2',form:{Caption:'Ввод имени',Width:300,Height:160,BorderStyle:'bsDialog',Position:'poMainFormCenter',Visible:false},comps:[
      {type:'TEdit',Name:'Edit1',Text:'',Left:24,Top:24,Width:240},
      {type:'TBitBtn',Name:'BitBtn1',Caption:'OK',Kind:'bkOK',ModalResult:1,Left:24,Top:72},
      {type:'TBitBtn',Name:'BitBtn2',Caption:'Cancel',Kind:'bkCancel',ModalResult:2,Left:120,Top:72}]});
    setCode(f2,'','');
  } else {
    for(let i=0;i<2;i++) addForm(prj);
    prj.forms.forEach((p,i)=>{ const nx=prj.forms[(i+1)%3];
      p.load({formName:p.fn,unitName:p.un,form:{Caption:p.fn,Width:260,Height:150,Left:40+i*280,Top:40,Visible:i>0},comps:[
        {type:'TEdit',Name:'Edit1',Text:'',Left:16,Top:12,Width:220},{type:'TLabel',Name:'Label1',Caption:'',Left:16,Top:44,Width:220,AutoSize:false,Font:{Size:10,Style:1}},
        {type:'TButton',Name:'Button1',Caption:'→ '+nx.fn,Left:16,Top:72,Width:100,events:{OnClick:'Button1Click'}}]});
      setCode(p,`#include "${nx.un}.h"\n`,H(p.cls,'Button1Click',`  ${nx.fn}->Label1->Caption = Label1->Caption + Edit1->Text;`)); });
  }
  return prj;
}
function exampleConsole(){ const prj=newProject('console','Summa'); prj.units[0].cpp=`${SEP}\n\n#include <iostream.h>\n#include <conio.h>\n#pragma hdrstop\n\n${SEP}\n\n#pragma argsused\nint main(int argc, char* argv[])\n{\n        int a, b;\n        cout << "Vvedi a: ";\n        cin >> a;\n        cout << "Vvedi b: ";\n        cin >> b;\n        cout << "a + b = " << a + b << endl;\n        getch();\n        return 0;\n}\n${SEP}\n`; return prj; }
const EXAMPLES=[['modal','Две формы: ShowModal и ModalResult',()=>example('modal')],['three','Три формы по кругу (лаба темы 10)',()=>example('three')],['console','Консоль: сумма двух чисел (cin/cout)',exampleConsole]];

/* ================= стили (один раз) ================= */
const CSS=`
.bcb.bcbx{position:fixed;inset:0;z-index:1000;overflow:auto;border:0;border-radius:0;background:#3a6ea5;box-shadow:none}
.bcb.bcbx[hidden]{display:none}
.bcbx .bx-win{min-width:980px;height:100%;min-height:600px;display:flex;flex-direction:column;background:#d4d0c8;position:relative}
.bcbx .bx-title{background:linear-gradient(90deg,#0a246a,#a6caf0);color:#fff;font-weight:700;padding:3px 4px 3px 6px;display:flex;gap:6px;align-items:center;flex:none}
.bcbx .bx-title .ico{background:#fff;color:#c00;border-radius:2px;padding:0 3px;font-size:11px}
.bcbx .bx-title .tt{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bcbx .bx-title button{width:18px;height:16px;font:11px Tahoma;line-height:12px;padding:0;background:#d4d0c8;border:1px solid;border-color:#fff #404040 #404040 #fff;cursor:pointer;color:#000}
.bcbx .bx-menu{display:flex;gap:0;padding:1px 2px;flex:none;position:relative}
.bcbx .bx-menu>span{padding:2px 7px;cursor:default;border:1px solid transparent}
.bcbx .bx-menu>span:hover,.bcbx .bx-menu>span.on{border-color:#fff #808080 #808080 #fff}
.bcbx .bx-menu>span.on{border-color:#808080 #fff #fff #808080}
.bcbx .bx-drop{position:absolute;z-index:30;background:#d4d0c8;border:1px solid;border-color:#fff #404040 #404040 #fff;box-shadow:2px 2px 4px rgba(0,0,0,.4);padding:2px;min-width:230px}
.bcbx .bx-drop .it{display:flex;justify-content:space-between;gap:24px;padding:3px 18px 3px 22px;white-space:nowrap;cursor:default}
.bcbx .bx-drop .it:hover{background:#0a246a;color:#fff}
.bcbx .bx-drop .it.dis{color:#808080;pointer-events:none}
.bcbx .bx-drop .it kbd{font:inherit;background:none;padding:0;color:inherit;opacity:.85}
.bcbx .bx-drop hr{border:0;border-top:1px solid #808080;border-bottom:1px solid #fff;margin:3px 2px}
.bcbx .bx-drop .grp{padding:2px 8px;color:#555;font-size:11px}
.bcbx .bx-bar{display:flex;gap:6px;align-items:stretch;padding:3px 4px;border-top:1px solid #fff;border-bottom:1px solid #808080;flex:none}
.bcbx .bx-tools{display:grid;grid-template-columns:repeat(6,26px);gap:2px;align-content:start}
.bcbx .bx-tools button{width:26px;height:24px;padding:0;font:13px Tahoma,sans-serif;background:#d4d0c8;border:1px solid transparent;cursor:pointer;color:#000}
.bcbx .bx-tools button:hover{border-color:#fff #808080 #808080 #fff}
.bcbx .bx-tools button:disabled{opacity:.35;cursor:default}
.bcbx .bx-tools button.run{color:#060;font-weight:700}
.bcbx .bx-palw{flex:1;min-width:0;display:flex;flex-direction:column;border-left:1px solid #808080;padding-left:6px}
.bcbx .bx-palw .pal-tabs{display:flex;gap:0}
.bcbx .bx-palw .ptab{font:11px Tahoma,sans-serif;border:1px solid #808080;border-bottom:0;background:#c8c4bc;padding:1px 8px;cursor:pointer;color:#000}
.bcbx .bx-palw .ptab.on{background:#d4d0c8;font-weight:700}
.bcbx .bx-palw .bcb-pal{border:1px solid #808080;border-top-color:#fff;min-height:40px;padding:2px}
.bcbx .bx-body{flex:1;display:grid;grid-template-columns:240px minmax(0,1fr);min-height:0}
.bcbx .bx-left{display:flex;flex-direction:column;border-right:1px solid #808080;min-height:0}
.bcbx .bx-left .oi{flex:1;border:0;min-height:0}
.bcbx .bx-left .oi-grid{max-height:none}
.bcbx .bx-pm{border-top:2px groove #fff;max-height:42%;display:flex;flex-direction:column}
.bcbx .bx-pm[hidden]{display:none}
.bcbx .bx-pm .tree{background:#fff;margin:0 3px 3px;border:1px solid #808080;overflow:auto;padding:2px 0;font:12px Tahoma,sans-serif}
.bcbx .bx-pm .tree div{padding:1px 4px;white-space:nowrap;cursor:default}
.bcbx .bx-pm .tree div.sel{background:#0a246a;color:#fff}
.bcbx .bx-center{display:grid;grid-template-rows:minmax(0,var(--dz,55%)) 5px minmax(0,1fr);min-height:0;min-width:0}
.bcbx .bx-center.m-form{grid-template-rows:minmax(0,1fr) 0 0}
.bcbx .bx-center.m-code{grid-template-rows:0 0 minmax(0,1fr)}
.bcbx .bx-center.m-form .bx-ed,.bcbx .bx-center.m-code .dz{visibility:hidden}
.bcbx .bx-split{background:#d4d0c8;border-top:1px solid #fff;border-bottom:1px solid #808080;cursor:row-resize}
.bcbx .dz{min-height:0}
.bcbx .dz-scroll{position:relative}
.bcbx .bx-ed{display:flex;flex-direction:column;min-height:0;background:#d4d0c8}
.bcbx .bx-ftabs{display:flex;gap:0;padding:2px 4px 0;flex:none;flex-wrap:wrap}
.bcbx .bx-ftabs span{border:1px solid #808080;border-bottom:0;padding:1px 10px;background:#c8c4bc;cursor:pointer;margin-right:1px}
.bcbx .bx-ftabs span.on{background:#fff;font-weight:700}
.bcbx .bx-ftabs span .x,.bcbx .bx-fsw .x{margin-left:6px;color:#666;font-weight:700;padding:0 3px;border-radius:2px;cursor:pointer}
.bcbx .bx-ftabs span .x:hover,.bcbx .bx-fsw .x:hover{background:#c00;color:#fff}
.bcbx .bx-edw{flex:1;min-height:0;position:relative;border:1px solid #808080;background:#fff}
.bcbx .bx-edw .ced{position:absolute;inset:0;height:auto;border-radius:0;font-size:13px;--ed-bg:#fff;--ed-ink:#000;--ed-gut:#f4f4f4;--ed-k:#000;--ed-c:#000080;--ed-p:#008000;--ed-s:#0000ff;--ed-n:#0000ff}
.bcbx .bx-edw .ro{position:absolute;inset:0;margin:0;overflow:auto;background:#fff;color:#000;border-radius:0;padding:8px 10px;font:13px Consolas,"Courier New",monospace;--ed-k:#000;--ed-c:#000080;--ed-p:#008000;--ed-s:#0000ff;--ed-n:#0000ff}
.bcbx .bx-btabs{display:flex;gap:0;padding:0 4px 2px;flex:none}
.bcbx .bx-btabs span{border:1px solid #808080;border-top:0;padding:1px 10px;background:#c8c4bc;cursor:pointer}
.bcbx .bx-btabs span.on{background:#fff;font-weight:700}
.bcbx .bx-btabs em{margin-left:auto;color:#555;font-style:normal;font-size:11px;padding:1px 6px}
.bcbx .bx-msg{flex:none;max-height:130px;overflow:auto;background:#fff;border-top:2px groove #fff;font:12px Tahoma,sans-serif}
.bcbx .bx-msg[hidden]{display:none}
.bcbx .bx-msg .mh{background:#d4d0c8;padding:1px 6px;font-weight:700;display:flex}
.bcbx .bx-msg .mh button{margin-left:auto;font:11px Tahoma;padding:0 5px}
.bcbx .bx-msg .m{padding:2px 6px;cursor:pointer;white-space:pre-wrap}
.bcbx .bx-msg .m:hover{background:#e8e8ff}
.bcbx .bx-msg .m.e b{color:#b00000}
.bcbx .bx-msg .m.w b{color:#806000}
.bcbx .bx-msg .m small{display:block;color:#555}
.bcbx .bx-status{flex:none;display:flex;gap:2px;padding:2px;border-top:1px solid #fff}
.bcbx .bx-status span{border:1px solid;border-color:#808080 #fff #fff #808080;padding:0 6px;white-space:nowrap}
.bcbx .bx-status span:last-child{flex:1;overflow:hidden;text-overflow:ellipsis}
.bcbx .bx-desk{position:absolute;left:0;right:0;bottom:0;background:#3a6ea5;z-index:20;overflow:hidden}
.bcbx .bx-desk[hidden]{display:none}
.bcbx .bx-desk .dk-bar{position:absolute;left:0;right:0;bottom:0;height:24px;background:#d4d0c8;border-top:1px solid #fff;display:flex;gap:3px;align-items:center;padding:0 3px;z-index:900}
.bcbx .bx-desk .dk-bar .tbt{font:11px Tahoma;padding:2px 8px;border:1px solid;border-color:#fff #404040 #404040 #fff;background:#d4d0c8;cursor:pointer;max-width:170px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.bcbx .bx-desk .dk-bar .tbt.on{border-color:#404040 #fff #fff #404040;background:#e8e6e0;font-weight:700}
.bcbx .bx-desk .dk-bar .hint{margin-left:auto;font:11px Tahoma;color:#333;padding-right:6px}
.bcbx .bx-desk .rw{position:absolute}
.bcbx .bx-desk .rw .wt{cursor:move;background:linear-gradient(90deg,#808080,#c0c0c0)}
.bcbx .bx-desk .rw.act .wt{background:linear-gradient(90deg,#0a246a,#a6caf0)}
.bcbx .bx-desk .modal-ovl{position:absolute;inset:0 0 24px 0;background:rgba(0,0,0,.08)}
.bcbx .bx-desk .ovl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.15);z-index:950}
.bcbx .bx-desk .ovl[hidden]{display:none}
.bcbx .bx-desk .vpop{z-index:960}
.bcbx .bx-con{position:absolute;left:30px;top:20px;width:min(760px,calc(100% - 60px));background:#d4d0c8;border:2px solid;border-color:#d4d0c8 #404040 #404040 #d4d0c8;box-shadow:2px 2px 8px rgba(0,0,0,.5);display:flex;flex-direction:column}
.bcbx .bx-con .wt{background:linear-gradient(90deg,#0a246a,#a6caf0);color:#fff;font:700 12px Tahoma;height:19px;display:flex;align-items:center;padding:0 3px;gap:4px}
.bcbx .bx-con .wt .wc{flex:1}
.bcbx .bx-con .wt i{display:inline-block;width:16px;height:14px;background:#d4d0c8;color:#000;font-style:normal;text-align:center;line-height:13px;border:1px solid;border-color:#fff #404040 #404040 #fff;font-size:11px;cursor:pointer}
.bcbx .bx-con .scr{background:#000;color:#c0c0c0;font:14px/1.25 Consolas,"Lucida Console","Courier New",monospace;height:min(420px,calc(100vh - 220px));overflow:auto;padding:4px 6px;white-space:pre}
.bcbx .bx-con .scr .cl{min-height:1.25em}
.bcbx .bx-con .cin{display:flex;align-items:center;background:#000;color:#fff;font:14px Consolas,monospace;padding:0 6px 4px}
.bcbx .bx-con .cin input{flex:1;background:#000;color:#fff;border:0;outline:none;font:inherit;caret-color:#fff;padding:0}
.bcbx .bx-con .cin[hidden]{display:none}
.bcbx .bx-con .cst{font:11px Tahoma;background:#ffffe1;padding:2px 6px;border-top:1px solid #808080}
.bcbx .bx-dlgs{position:absolute;inset:0;z-index:40;background:rgba(0,0,0,.12);display:flex;align-items:flex-start;justify-content:center;padding-top:70px}
.bcbx .bx-dlgs[hidden]{display:none}
.bcbx .bx-dlg{background:#d4d0c8;border:2px solid;border-color:#d4d0c8 #404040 #404040 #d4d0c8;box-shadow:3px 3px 10px rgba(0,0,0,.5);min-width:340px;max-width:min(680px,94%);max-height:calc(100% - 90px);display:flex;flex-direction:column}
.bcbx .bx-dlg .wt{background:linear-gradient(90deg,#0a246a,#a6caf0);color:#fff;font:700 12px Tahoma;height:19px;display:flex;align-items:center;padding:0 4px;flex:none}
.bcbx .bx-dlg .wt .wc{flex:1}
.bcbx .bx-dlg .db{padding:10px 12px;display:flex;flex-direction:column;gap:8px;overflow:auto}
.bcbx .bx-dlg .btns{display:flex;gap:6px;justify-content:flex-end;padding:6px 12px 10px;flex:none}
.bcbx .bx-dlg .lst{background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;min-height:120px;max-height:260px;overflow:auto;padding:2px;min-width:180px}
.bcbx .bx-dlg .lst div{padding:2px 6px;cursor:default;white-space:nowrap}
.bcbx .bx-dlg .lst div.sel{background:#0a246a;color:#fff}
.bcbx .bx-dlg .two{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}
.bcbx .bx-dlg .two .mid{display:flex;flex-direction:column;gap:4px}
.bcbx .bx-dlg label{display:flex;gap:8px;align-items:center}
.bcbx .bx-dlg input,.bcbx .bx-dlg select{font:12px Tahoma,sans-serif}
.bcbx .bx-dlg .icons{display:grid;grid-template-columns:repeat(4,110px);gap:8px}
.bcbx .bx-dlg .icons button{height:72px;font:12px Tahoma;background:#fff;border:1px solid #808080;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#000}
.bcbx .bx-dlg .icons button b{font-size:22px}
.bcbx .bx-dlg .icons button:hover{background:#e8eefc}
.bcbx .bx-dlg p{margin:0}
.bcbx .bx-dlg .help{font:13px var(--f-body,Tahoma);max-width:620px}
.bcbx .bx-dlg .help li{margin:3px 0}
.bcbx .frm.design .client{min-height:20px}
.bcbx .bx-fsw{display:flex;gap:4px;align-items:center;padding:2px 8px;background:#6b6b6b;color:#fff;font:11.5px Tahoma}
.bcbx .bx-fsw button{font:11px Tahoma;padding:0 6px;background:#d4d0c8;border:1px solid;border-color:#fff #404040 #404040 #fff;cursor:pointer;color:#000}
.bcbx .bx-fsw button.on{border-color:#404040 #fff #fff #404040;background:#fff;font-weight:700}
.cbld-start{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:14px 0}
.cbld-start .btn.big{font-size:1.1em;padding:.7em 1.4em}
.cbld-shot{border:1px solid var(--line);border-radius:8px;background:#d4d0c8;color:#000;padding:0;overflow:hidden;font:12px Tahoma,sans-serif;max-width:640px}
.cbld-shot .t{background:linear-gradient(90deg,#0a246a,#a6caf0);color:#fff;font-weight:700;padding:4px 8px}
.cbld-shot .m{padding:2px 8px;border-bottom:1px solid #808080}
.cbld-shot .b{display:grid;grid-template-columns:120px 1fr;min-height:120px}
.cbld-shot .b>div:first-child{background:#fff;border-right:1px solid #808080;padding:6px;font-size:11px;color:#000080}
.cbld-shot .b>div:last-child{background:#808080;padding:12px}
.cbld-shot .f{background:#d4d0c8;border:2px solid;border-color:#d4d0c8 #404040 #404040 #d4d0c8;width:220px}
.cbld-shot .f .h{background:linear-gradient(90deg,#0a246a,#a6caf0);color:#fff;font-weight:700;padding:2px 4px}
.cbld-shot .f .c{height:70px;background-image:radial-gradient(#000 .6px,transparent .7px);background-size:8px 8px;position:relative}
.cbld-shot .f .c span{position:absolute;left:16px;top:20px;border:1px solid;border-color:#fff #404040 #404040 #fff;padding:2px 10px;background:#d4d0c8}
`;
function css(){ if(document.getElementById('bcb-ide-css')) return; const s=document.createElement('style'); s.id='bcb-ide-css'; s.textContent=CSS; document.head.appendChild(s); }

/* ================= главное меню среды ================= */
const MENU={
  File:[['New ▸','grp'],['  Application','newApp'],['  Form','newForm'],['  Unit','newUnit'],['  Console Application','newCon'],['  Other…','newOther'],'-',
    ['Open Project…','open','Ctrl+F11'],['Reopen: примеры…','examples'],'-',['Save All','save','Shift+Ctrl+S'],['Save Project As…','saveAs'],['Export to file (.bpr.json)','export'],['Import from file…','import'],'-',
    ['Include Unit Hdr…','incHdr','Alt+F11'],'-',['Close All','closeAll'],['Exit','exit']],
  Edit:[['Undo','undo','Ctrl+Z'],'-',['Copy component','copy','Ctrl+C'],['Paste component','paste','Ctrl+V'],['Delete','del','Del'],'-',['Bring to Front','front'],['Send to Back','back'],['Align to Grid','grid'],'-',['Select All','selAll','Ctrl+A']],
  Search:[['Find…','find','Ctrl+F'],['Search Again','findNext','F3'],['Go to Line Number…','gotoLine','Alt+G']],
  View:[['Project Manager','pm','Ctrl+Alt+F11'],['Object Inspector','oi','F11'],['Messages','msgs'],'-',['Units…','viewUnit','Ctrl+F12'],['Forms…','viewForm','Shift+F12'],['Toggle Form/Unit','toggle','F12'],'-',['Форма + код','split']],
  Project:[['Add New Form','newForm'],['Add New Unit','newUnit'],['Remove from Project…','remove'],'-',['View Source (Project1.cpp)','viewSrc'],'-',['Make Project1','make','Ctrl+F9'],['Build Project1','make'],'-',['Options…','options','Shift+Ctrl+F11']],
  Run:[['Run','run','F9'],['Program Reset','reset','Ctrl+F2']],
  Component:[['New Component…','na'],['Install Component…','na']],
  Database:[['Explore','na'],['SQL Monitor','na'],['Form Wizard…','na']],
  Tools:[['Environment Options…','na'],['Editor Options…','na']],
  Window:[['Object Inspector','oi'],['Project Manager','pm']],
  Help:[['Что умеет этот C++Builder','help','F1'],['Горячие клавиши','keys'],'-',['About…','about']],
};
const KEYS=[['F9','Run — запуск'],['Ctrl+F2','Program Reset — остановить программу'],['Ctrl+F9','Make — только скомпилировать'],['F12','форма ⇄ код'],['Shift+F12','View Form — список форм'],['Ctrl+F12','View Unit — список модулей'],['Alt+F11','File → Include Unit Hdr'],['Shift+Ctrl+F11','Project → Options'],['F11','Object Inspector'],['Ctrl+S / Shift+Ctrl+S','Save All'],['Del','удалить компонент'],['Ctrl+C / Ctrl+V','копировать / вставить компонент'],['стрелки','сдвинуть компонент (Shift — размер)'],['Ctrl+F, F3','поиск в коде'],['Alt+G','перейти к строке']];

/* ================= IDE ================= */
let IDE=null;
function openIDE(prjArg){
  css();
  if(IDE){ IDE.show(prjArg); return; }
  IDE=makeIDE(); IDE.show(prjArg);
}
function makeIDE(){
  const root=document.createElement('div'); root.className='bcb bcbx'; root.hidden=true; root.tabIndex=-1;
  root.innerHTML=`<div class="bx-win">
    <div class="bx-title"><span class="ico">C</span><span class="tt"></span><button data-a="min" title="Свернуть (закрыть окно, проект сохранится)">_</button><button data-a="exit" title="Закрыть C++Builder (проект сохранится)">×</button></div>
    <div class="bx-menu">${Object.keys(MENU).map(m=>`<span data-m="${m}">${m}</span>`).join('')}</div>
    <div class="bx-bar">
      <div class="bx-tools">
        <button data-a="newOther" title="New (File → New → Other…)">🗋</button><button data-a="open" title="Open Project">📂</button><button data-a="save" title="Save All">💾</button>
        <button data-a="viewUnit" title="View Unit (Ctrl+F12)">📄</button><button data-a="viewForm" title="View Form (Shift+F12)">🗔</button><button data-a="toggle" title="Toggle Form/Unit (F12)">⇄</button>
        <button data-a="newForm" title="New Form">➕</button><button data-a="incHdr" title="Include Unit Hdr (Alt+F11)">#</button><button data-a="options" title="Project Options">⚙</button>
        <button data-a="run" class="run" title="Run (F9)">▶</button><button data-a="reset" title="Program Reset (Ctrl+F2)">■</button><button data-a="help" title="Help">?</button>
      </div>
      <div class="bx-palw"><div class="pal-tabs">${V.TABS.map((t,i)=>`<button class="ptab${i?'':' on'}" data-tab="${t}">${t}</button>`).join('')}</div>
        <div class="bcb-pal">${Object.keys(V.COMP).filter(k=>k!=='TForm').map(p=>`<button class="pi" data-type="${p}" data-tab="${V.COMP[p].tab}" title="${p}">${V.ICON[p]||'?'}<small>${p.slice(1)}</small></button>`).join('')}</div></div>
    </div>
    <div class="bx-body">
      <div class="bx-left">
        <div class="oi"><div class="oi-h">Object Inspector</div><select class="oi-sel" aria-label="Компонент"></select>
          <div class="oi-tabs"><button class="on" data-oi="p">Properties</button><button data-oi="e">Events</button></div><div class="oi-grid"></div></div>
        <div class="bx-pm"><div class="oi-h">Project Manager</div><div class="tree"></div></div>
      </div>
      <div class="bx-center">
        <div class="dz"><div class="bx-fsw"></div><div class="dz-scroll"><div class="frm design"></div></div>
          <div class="dz-hint">Палитра: выбери компонент и щёлкни по форме. Двойной щелчок по компоненту — обработчик события. Del — удалить, стрелки — сдвинуть.</div></div>
        <div class="bx-split" title="Потяни, чтобы поменять высоту"></div>
        <div class="bx-ed"><div class="bx-ftabs"></div><div class="bx-edw"><div class="edh"></div><pre class="ro" hidden></pre></div><div class="bx-btabs"></div></div>
      </div>
    </div>
    <div class="bx-msg" hidden><div class="mh">Messages <button data-a="msgs">×</button></div><div class="ml"></div></div>
    <div class="bx-status"><span class="st-pos">1: 1</span><span class="st-mod">&nbsp;</span><span class="st-ins">Insert</span><span class="st-msg"></span></div>
    <div class="bx-desk" hidden><div class="dk-wins"></div><div class="dk-bar"></div></div>
    <div class="bx-dlgs" hidden></div>
  </div>`;
  document.body.appendChild(root);
  const $=s=>root.querySelector(s);
  const frm=$('.frm'), grid=$('.oi-grid'), sel=$('.oi-sel'), desk=$('.bx-desk'), dlgs=$('.bx-dlgs');
  const ed=CPP.makeEditor($('.edh'),'',()=>run());
  const edTa=()=>$('.edh .cta');
  let prj=null, P=null, cur=null, oiTab='p', tool=null, file=null, mode='split', R=null, clip=null, lastFind='';

  /* ---------- сохранение ---------- */
  const list=()=>jget(KEY+'list',[]);
  function save(now){
    clearTimeout(save.t);
    const doIt=()=>{ if(!prj) return; store.set(KEY+'p:'+prj.name,JSON.stringify(prjJSON(prj))); const l=list(); if(!l.includes(prj.name)){ l.unshift(prj.name); store.set(KEY+'list',JSON.stringify(l)); } store.set(KEY+'cur',prj.name); status(''); $('.st-mod').innerHTML='&nbsp;'; };
    if(now) doIt(); else { $('.st-mod').textContent='Modified'; save.t=setTimeout(doIt,400); }
  }
  function loadSaved(name){ const d=jget(KEY+'p:'+name,null); return d?prjLoad(d):null; }
  function setProject(p){ stopRun(); syncEditorOut(); prj=p; P=prj.forms.find(f=>f.fn===prj.main)||prj.forms[0]||null; cur=P?P.form:null; const f0=P?P.un:prj.units[0].un; file=null; clearMsgs(); save(true); drawFsw(); drawForm(); drawOI(); openFile(f0,'cpp'); }
  const reloadEditor=()=>{ if(file&&file.un!=='#prj') ed.value=fileText(prj,file.un,file.ext); };

  /* ---------- заголовок, вкладки, Project Manager ---------- */
  const status=s=>{ $('.st-msg').textContent=s||''; };
  function title(){ if(!prj) return; $('.tt').textContent=`C++Builder 6 - ${prj.name}${R?' [Running]':''}${file?' - ['+(file.un==='#prj'?prj.name:file.un)+'.'+file.ext+']':''}`; }
  function allUnits(){ return [...prj.forms.map(p=>({un:p.un,form:p})),...prj.units.map(u=>({un:u.un,unit:u}))]; }
  function drawTabs(){
    const t=$('.bx-ftabs');
    const canDel=u=>allUnits().length>1&&!(u.form&&prj.forms.length<=1);
    t.innerHTML=allUnits().map(u=>`<span data-un="${u.un}" class="${file&&file.un===u.un?'on':''}">${u.un}${canDel(u)?`<b class="x" data-del="${u.un}" title="Удалить ${u.form?u.form.fn+' и ':''}${u.un} из проекта">×</b>`:''}</span>`).join('')+`<span data-un="#prj" class="${file&&file.un==='#prj'?'on':''}">${prj.name}</span>`;
    const b=$('.bx-btabs');
    if(file.un==='#prj') b.innerHTML=`<span class="on">${prj.name}.cpp</span><em>генерирует Builder (только чтение)</em>`;
    else { const u=allUnits().find(x=>x.un===file.un); const hasH=u&&(u.form||u.unit.h!=null);
      b.innerHTML=`<span data-ext="cpp" class="${file.ext==='cpp'?'on':''}">${file.un}.cpp</span>${hasH?`<span data-ext="h" class="${file.ext==='h'?'on':''}">${file.un}.h</span>`:''}${u&&u.form&&file.ext==='h'?'<em>__published — пишет Builder; свои поля и методы пиши в private / public</em>':''}`; }
  }
  function drawPM(){
    const t=$('.bx-pm .tree');
    let h=`<div>🗂 ProjectGroup1</div><div style="padding-left:12px"><b>${prj.kind==='console'?'⌨':'🗔'} ${esc(prj.name)}.exe</b></div><div style="padding-left:26px" data-open="#prj">📄 ${esc(prj.name)}.cpp</div><div style="padding-left:26px">📦 ${esc(prj.name)}.res</div>`;
    for(const u of allUnits()){
      h+=`<div style="padding-left:26px" data-open="${u.un}" class="${file&&file.un===u.un?'sel':''}">${u.form?'🗔':'📄'} ${u.un}.cpp${u.form&&u.form.fn===prj.main?' <i>(главная)</i>':''}</div>`;
      h+=`<div style="padding-left:42px" data-open="${u.un}" data-ext="cpp">📄 ${u.un}.cpp</div>`;
      if(u.form) h+=`<div style="padding-left:42px" data-open="${u.un}" data-ext="dfm">🗔 ${u.un}.dfm (${u.form.fn})</div>`;
      if(u.form||u.unit.h!=null) h+=`<div style="padding-left:42px" data-open="${u.un}" data-ext="h">📄 ${u.un}.h</div>`;
    }
    t.innerHTML=h;
  }
  $('.bx-pm .tree').addEventListener('click',e=>{ const d=e.target.closest('[data-open]'); if(!d) return; const un=d.dataset.open;
    if(un==='#prj'){ openFile('#prj','cpp'); return; }
    if(d.dataset.ext==='dfm'){ const p=prj.forms.find(x=>x.un===un); if(p){ selectForm(p); setMode(mode==='code'?'split':mode); } return; }
    openFile(un,d.dataset.ext||'cpp'); });

  /* ---------- редактор и файлы ---------- */
  function syncEditorOut(){ // сохранить текст из редактора в модель
    if(!file||file.un==='#prj'||!prj) return;
    const v=ed.value; const p=prj.forms.find(x=>x.un===file.un), u=prj.units.find(x=>x.un===file.un);
    if(p){ if(file.ext==='cpp'){ p.code=v; syncEvents(p); } else { if(p.parseUnitH(v)) status(''); else status('Unit .h: не нашёл секции private: / public: — изменения в шапке класса не применены'); } }
    else if(u){ if(file.ext==='h') u.h=v; else u.cpp=v; }
  }
  function openFile(un,ext,line){
    syncEditorOut();
    if(un!=='#prj'&&!allUnits().some(x=>x.un===un)) un=allUnits()[0]?allUnits()[0].un:'#prj';
    file={un,ext:ext||'cpp'};
    const ro=$('.bx-edw .ro'), eh=$('.edh');
    if(un==='#prj'){ ro.hidden=false; eh.hidden=true; ro.innerHTML=CPP.highlight(projectCpp(prj)); }
    else { ro.hidden=true; eh.hidden=false; ed.value=fileText(prj,un,file.ext); ed.markLine(line||0); }
    const p=prj.forms.find(x=>x.un===un); if(p&&p!==P) selectForm(p,true);
    if(mode==='form') setMode('split');
    drawTabs(); drawPM(); title(); pos();
  }
  $('.edh').addEventListener('codechange',()=>{ syncEditorOut(); save(); if(file.ext==='cpp'){ const p=prj.forms.find(x=>x.un===file.un); if(p&&p===P&&oiTab==='e') drawOI(); } pos(); });
  const pos=()=>{ const ta=edTa(); if(!ta||$('.edh').hidden) { $('.st-pos').textContent=' '; return; } const s=ta.value.slice(0,ta.selectionStart).split('\n'); $('.st-pos').textContent=`${s.length}: ${s[s.length-1].length+1}`; };
  $('.edh').addEventListener('keyup',pos); $('.edh').addEventListener('click',pos);
  $('.bx-ftabs').addEventListener('click',e=>{ const d=e.target.closest('[data-del]'); if(d){ e.stopPropagation(); if(R){ status('Сначала останови программу (Ctrl+F2)'); return; } askRemove(d.dataset.del); return; } const s=e.target.closest('[data-un]'); if(s) openFile(s.dataset.un,'cpp'); });
  $('.bx-btabs').addEventListener('click',e=>{ const s=e.target.closest('[data-ext]'); if(s) openFile(file.un,s.dataset.ext); });
  function syncEvents(p){ const hs=new Set(p.handlers().map(h=>h.name)); for(const c of [p.form,...p.comps]) for(const ev in c.events) if(!hs.has(c.events[ev])) delete c.events[ev]; }

  /* ---------- режим: форма / код / вместе ---------- */
  function setMode(m){ mode=m; const c=$('.bx-center'); c.classList.toggle('m-form',m==='form'); c.classList.toggle('m-code',m==='code'); }
  { let drag=null; $('.bx-split').addEventListener('mousedown',e=>{ drag={y:e.clientY,h:$('.dz').getBoundingClientRect().height,H:$('.bx-center').getBoundingClientRect().height}; e.preventDefault(); });
    window.addEventListener('mousemove',e=>{ if(!drag) return; const h=Math.max(80,Math.min(drag.H-90,drag.h+e.clientY-drag.y)); $('.bx-center').style.setProperty('--dz',h+'px'); });
    window.addEventListener('mouseup',()=>{ drag=null; }); }

  /* ---------- дизайнер ---------- */
  function selectForm(p,keepFile){ if(!p) return; if(!keepFile){ openFile(p.un,'cpp'); return; } P=p; cur=p.form; drawFsw(); drawForm(); drawOI(); }
  function drawFsw(){
    const w=$('.bx-fsw');
    if(prj.kind==='console'){ w.innerHTML='Консольное приложение — форм нет. Пиши код в Unit1.cpp и жми F9.'; return; }
    const many=prj.forms.length>1;
    w.innerHTML='Формы: '+prj.forms.map(p=>`<button data-f="${p.fn}" class="${p===P?'on':''}" title="${p.un}.cpp">${p.fn}${p.fn===prj.main?' ★':''}${many?`<b class="x" data-del="${p.un}" title="Удалить ${p.fn} из проекта">×</b>`:''}</button>`).join('')+`<button data-a="newForm" title="File → New → Form">+ Form</button>`;
  }
  $('.bx-fsw').addEventListener('click',e=>{ const d=e.target.closest('[data-del]'); if(d){ e.stopPropagation(); askRemove(d.dataset.del); return; } const b=e.target.closest('button'); if(!b) return; if(b.dataset.f) selectForm(prj.forms.find(p=>p.fn===b.dataset.f)); else if(b.dataset.a) act(b.dataset.a); });
  function drawForm(){
    if(!P){ frm.hidden=true; return; } frm.hidden=false;
    const f=P.form.p; const menu=P.comps.find(c=>c.vcl==='TMainMenu');
    frm.style.width=f.Width+'px'; frm.style.height=f.Height+'px';
    frm.innerHTML=`<div class="wt"><span class="wi">⧉</span><span class="wc">${esc(f.Caption)}</span><span class="wb"><i>_</i><i>□</i><i>×</i></span></div>${menuBarHTML(menu)}<div class="client" style="background-color:${V.colorCss(f.Color)};${fontCss(P.form.p.Font)}">${treeHTML(P,'design',null,f.Width-8,f.Height-31-(menu?19:0))}</div><i class="frh" title="Размер формы" style="position:absolute;right:-5px;bottom:-5px;width:9px;height:9px;background:#000080;cursor:nwse-resize"></i>`;
    const s=frm.querySelector(`.vc[data-n="${cur.Name}"]`); if(s&&cur!==P.form){ s.classList.add('selc'); s.insertAdjacentHTML('beforeend','<i class="rh"></i>'); }
    frm.classList.toggle('fsel',cur===P.form);
  }
  function drawOI(){
    if(!P){ sel.innerHTML=''; grid.innerHTML='<div class="row"><em>Нет формы</em></div>'; return; }
    sel.innerHTML=[P.form,...P.comps].map(c=>`<option value="${c.Name}"${c===cur?' selected':''}>${c.Name}: ${c===P.form?P.cls:c.vcl}</option>`).join('');
    const d=V.COMP[cur.vcl];
    if(oiTab==='p'){
      const rows=Object.keys(d.props).filter(k=>!['ClientWidth','ClientHeight','Files'].includes(k)).sort();
      grid.innerHTML=`<div class="row"><span>Name</span><input data-p="Name" value="${cur.Name}"${cur===P.form?' readonly title="Имя формы задаётся при создании"':''}></div>`+rows.map(k=>{
        const pd=d.props[k], v=cur.p[k]; let e;
        if(pd.t==='bool') e=`<select data-p="${k}"><option${v?'':' selected'}>false</option><option${v?' selected':''}>true</option></select>`;
        else if(pd.t==='enum') e=`<select data-p="${k}">${V.ENUMS[pd.en].map(n=>`<option${V.CONSTS[n]===v?' selected':''}>${n}</option>`).join('')}</select>`;
        else if(pd.t==='color') e=`<select data-p="${k}">${Object.keys(V.COLORS).filter(n=>n!=='clNone').map(n=>`<option${V.COLORS[n]===v?' selected':''}>${n}</option>`).join('')}${Object.values(V.COLORS).includes(v)?'':`<option selected>${V.colorName(v)}</option>`}</select>`;
        else if(pd.t==='font') return `<div class="row sub"><span>Font</span><em>(TFont)</em></div>`+['Name','Size','Color'].map(fk=>`<div class="row ind"><span>${fk}</span>${fk==='Color'?`<select data-f="${fk}">${Object.keys(V.COLORS).filter(n=>n!=='clNone').map(n=>`<option${V.COLORS[n]===v.p.Color?' selected':''}>${n}</option>`).join('')}</select>`:fk==='Name'?`<select data-f="Name">${['MS Sans Serif','Arial','Tahoma','Times New Roman','Courier New','Comic Sans MS','Verdana'].map(n=>`<option${n===v.p.Name?' selected':''}>${n}</option>`).join('')}</select>`:`<input data-f="${fk}" value="${esc(v.p[fk])}">`}</div>`).join('')+`<div class="row ind"><span>Style</span><select data-f="Style">${['[]','[fsBold]','[fsItalic]','[fsBold,fsItalic]','[fsUnderline]','[fsBold,fsUnderline]'].map((n,i)=>{ const val=[0,1,2,3,4,5][i]; return `<option value="${val}"${v.p.Style===val?' selected':''}>${n}</option>`; }).join('')}</select></div>`;
        else if(pd.t==='strings') e=`<button class="dots" data-str="${k}">(TStrings) …</button>`;
        else if(pd.t==='menu') e=`<button class="dots" data-menu="1">(Menu) …</button>`;
        else if(pd.t==='panels') e=`<button class="dots" data-panels="1">(TStatusPanels) …</button>`;
        else if(pd.t==='obj'){ if(k==='Brush') e=`<select data-brush="1">${Object.keys(V.COLORS).filter(n=>n!=='clNone').map(n=>`<option${V.COLORS[n]===v.p.Color?' selected':''}>${n}</option>`).join('')}</select>`; else if(k==='PopupMenu') e=`<select data-pop="1"><option></option>${P.comps.filter(c=>c.vcl==='TPopupMenu').map(c=>`<option${v===c||v===c.Name?' selected':''}>${c.Name}</option>`).join('')}</select>`; else e='<em>—</em>'; }
        else if(pd.t==='dt') e='<em>(сегодня)</em>';
        else if(k==='ModalResult') e=`<select data-p="${k}">${['mrNone','mrOk','mrCancel','mrAbort','mrRetry','mrIgnore','mrYes','mrNo'].map(n=>`<option${V.CONSTS[n]===v?' selected':''}>${n}</option>`).join('')}</select>`;
        else e=`<input data-p="${k}" value="${esc(v)}"${pd.t==='int'?' inputmode="numeric"':''}>`;
        return `<div class="row"><span>${k}</span>${e}</div>`;
      }).join('');
    } else grid.innerHTML=d.events.map(ev=>`<div class="row"><span>${ev}</span><input data-ev="${ev}" value="${esc(cur.events[ev]||'')}" placeholder="двойной щелчок" readonly></div>`).join('')||'<div class="row"><em>Нет событий</em></div>';
  }
  function redrawAll(){ title(); drawFsw(); drawForm(); drawOI(); drawTabs(); drawPM(); openFile(file.un,file.ext); }
  function select(o){ cur=o; drawForm(); drawOI(); }
  sel.addEventListener('change',()=>select(P.find(sel.value)));
  root.querySelectorAll('.oi-tabs button').forEach(b=>b.addEventListener('click',()=>{ oiTab=b.dataset.oi; root.querySelectorAll('.oi-tabs button').forEach(x=>x.classList.toggle('on',x===b)); drawOI(); }));
  grid.addEventListener('change',e=>{
    const t=e.target, d=V.COMP[cur.vcl];
    if(t.dataset.p==='Name'){ const nv=t.value.trim(); if(!/^[A-Za-z_]\w*$/.test(nv)||P.find(nv)){ t.value=cur.Name; status('Имя занято или недопустимо'); return; }
      syncEditorOut(); const old=cur.Name; P.comps.forEach(c=>{ if(c.parent===old) c.parent=nv; }); cur.Name=nv; P.code=P.code.replace(new RegExp('\\b'+old+'\\b','g'),nv);
      for(const ev in cur.events) cur.events[ev]=cur.events[ev].replace(old,nv); save(); reloadEditor(); drawForm(); drawOI(); return; }
    if(t.dataset.p){ const k=t.dataset.p, pd=d.props[k]; let v=t.value;
      if(pd.t==='bool') v=v==='true'; else if(pd.t==='int') v=V.CONSTS[v]!=null?V.CONSTS[v]:(parseInt(v,10)||0); else if(pd.t==='enum'||pd.t==='color') v=V.CONSTS[v]!=null?V.CONSTS[v]:parseInt(v,16);
      cur.p[k]=v; if(k==='Checked'&&cur.vcl==='TCheckBox') cur.p.State=v?1:0;
      if(k==='Caption'&&(cur.vcl==='TLabel'||cur.vcl==='TStaticText')&&cur.p.AutoSize) cur.p.Width=Math.max(10,String(v).length*6);
      if(cur===P.form&&(k==='Width'||k==='Height')){ cur.p.ClientWidth=cur.p.Width-8; cur.p.ClientHeight=cur.p.Height-27; } }
    if(t.dataset.f){ const k=t.dataset.f; cur.p.Font.p[k]=k==='Color'?V.CONSTS[t.value]:k==='Size'||k==='Style'?parseInt(t.value,10)||0:t.value; if(k==='Size'&&!cur.p.Font.p.Size) cur.p.Font.p.Size=8; }
    if(t.dataset.brush) cur.p.Brush.p.Color=V.CONSTS[t.value];
    if(t.dataset.pop) cur.p.PopupMenu=t.value||null;
    save(); drawForm(); if(cur===P.form) drawFsw();
  });
  grid.addEventListener('dblclick',e=>{ const t=e.target.closest('[data-ev]'); if(t) makeHandler(cur,t.dataset.ev); });
  grid.addEventListener('click',e=>{
    const b=e.target.closest('.dots'); if(!b) return;
    if(b.dataset.str) editText(`${cur.Name}->${b.dataset.str} — по строке на элемент`,cur.p[b.dataset.str].items.join('\n'),v=>{ cur.p[b.dataset.str].items=v===''?[]:v.split('\n'); });
    if(b.dataset.panels) editText(`${cur.Name}->Panels (по строке на панель)`,cur.p.Panels.items.map(x=>x.p.Text).join('\n'),v=>{ cur.p.Panels.items=(v===''?[]:v.split('\n')).map(s=>({vcl:'TStatusPanel',id:Math.random(),p:{Text:s,Width:120}})); });
    if(b.dataset.menu) editText(`${cur.Name} — пункты меню. Строка: Заголовок | Имя | Обработчик. Подпункт — два пробела в начале. «-» — разделитель`,menuToText(cur.p.Items.items),v=>{ cur.p.Items.items=textToMenu(v); ensureMenuHandlers(cur.p.Items.items); });
  });
  const menuToText=(items,ind='')=>items.map(m=>`${ind}${m.p.Caption} | ${m.Name} | ${m.events.OnClick||''}\n`+menuToText(m.items,ind+'  ')).join('').replace(/\n$/,'');
  function textToMenu(t){ const rootI=[]; const stack=[{lvl:-1,items:rootI}]; let k=0;
    for(const line of t.split('\n')){ if(!line.trim()) continue; const lvl=(line.match(/^ */)[0].length)>>1; const [cap,name,h]=line.trim().split('|').map(s=>s.trim());
      const m=V.makeComp('TMainMenu','tmp').p.Items; k++; m.Name=name||(cap==='-'?'N'+k:cap.replace(/[^A-Za-z0-9]/g,'')||'Item'+k)+(name?'':'1'); m.p.Caption=cap; if(h) m.events.OnClick=h; m.items=[];
      while(stack[stack.length-1].lvl>=lvl) stack.pop(); stack[stack.length-1].items.push(m); stack.push({lvl,items:m.items}); }
    return rootI; }
  function ensureMenuHandlers(items){ for(const m of items){ if(m.events.OnClick&&!P.handlers().some(h=>h.name===m.events.OnClick)){ syncEditorOut(); P.code=P.code.replace(/\s*$/,'\n')+V.handlerSkeleton(m.events.OnClick,'OnClick',P.cls); } ensureMenuHandlers(m.items); } if(file.un===P.un&&file.ext==='cpp') ed.value=P.code; }
  function editText(ttl,val,apply){
    dialog(esc(ttl),`<textarea spellcheck="false" style="width:520px;max-width:100%;height:200px;font:12px Consolas,monospace">${esc(val)}</textarea>`,[['OK',b=>{ apply(b.querySelector('textarea').value); save(); drawForm(); drawOI(); return true; }],['Cancel']],b=>b.querySelector('textarea').focus());
  }
  function makeHandler(o,ev){
    syncEditorOut();
    const name=P.ensureHandler(o,ev); save(); drawOI();
    if(mode==='form') setMode('split');
    if(!(file&&file.un===P.un&&file.ext==='cpp')) openFile(P.un,'cpp'); else ed.value=P.code;
    const i=P.code.indexOf(P.cls+'::'+name+'('); const ta=edTa();
    if(i>=0&&ta){ const p2=P.code.indexOf('{',i)+2; ta.focus(); ta.setSelectionRange(p2,p2); const ln=P.code.slice(0,p2).split('\n').length; ta.scrollTop=Math.max(0,(ln-5)*20); ta.dispatchEvent(new Event('scroll')); }
    pos();
  }
  const defaultEvent=o=>({TForm:'OnCreate',TTimer:'OnTimer',TEdit:'OnChange',TMemo:'OnChange',TScrollBar:'OnChange',TComboBox:'OnChange'}[o.vcl]||'OnClick');
  root.querySelectorAll('.ptab').forEach(b=>b.addEventListener('click',()=>{ root.querySelectorAll('.ptab').forEach(x=>x.classList.toggle('on',x===b)); root.querySelectorAll('.pi').forEach(p=>p.hidden=p.dataset.tab!==b.dataset.tab); }));
  root.querySelector('.ptab').click();
  $('.bcb-pal').addEventListener('click',e=>{ const b=e.target.closest('.pi'); if(!b) return; if(!P){ status('В консольном проекте нет формы'); return; } tool=tool===b.dataset.type?null:b.dataset.type; root.querySelectorAll('.pi').forEach(x=>x.classList.toggle('on',x.dataset.type===tool)); frm.classList.toggle('placing',!!tool); if(tool){ if(mode==='code') setMode('split'); status('Щёлкни по форме, куда положить '+tool); } });
  let drag=null;
  frm.addEventListener('mousedown',e=>{
    if(e.target.classList.contains('frh')){ drag={form:true,sx:e.clientX,sy:e.clientY,w:P.form.p.Width,h:P.form.p.Height}; e.preventDefault(); return; }
    const client=frm.querySelector('.client'); if(!client) return;
    const cr=client.getBoundingClientRect();
    if(tool){
      let parent=null, ox=cr.left, oy=cr.top;
      const cont=e.target.closest('.v-TPanel,.v-TGroupBox');
      if(cont){ parent=cont.dataset.n; const r=cont.getBoundingClientRect(); ox=r.left; oy=r.top+(cont.matches('.v-TGroupBox')?8:0); }
      const x=Math.max(0,Math.round((e.clientX-ox)/8)*8), y=Math.max(0,Math.round((e.clientY-oy)/8)*8);
      const o=P.add(tool,x,y,parent); tool=null; root.querySelectorAll('.pi').forEach(p=>p.classList.remove('on')); frm.classList.remove('placing');
      save(); select(o); status(`${o.Name}: ${o.vcl} добавлен в ${P.fn}. Он сразу появился в ${P.un}.h в секции __published`); if(file&&file.un===P.un&&file.ext==='h') reloadEditor(); e.preventDefault(); return;
    }
    const vc=e.target.closest('.vc');
    if(!vc){ if(e.target.closest('.client,.wt')) select(P.form); return; }
    const o=P.find(vc.dataset.n); if(!o) return;
    if(cur!==o) select(o);
    drag={o,resize:e.target.classList.contains('rh'),sx:e.clientX,sy:e.clientY,l:o.p.Left,t:o.p.Top,w:o.p.Width,h:o.p.Height};
    e.preventDefault(); root.focus({preventScroll:true});
  });
  window.addEventListener('mousemove',e=>{ if(!drag||!IDE||root.hidden) return; const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; const g=v=>Math.round(v/8)*8;
    if(drag.form){ P.form.p.Width=Math.max(120,drag.w+dx); P.form.p.Height=Math.max(80,drag.h+dy); P.form.p.ClientWidth=P.form.p.Width-8; P.form.p.ClientHeight=P.form.p.Height-27; drawForm(); return; }
    if(drag.resize){ drag.o.p.Width=Math.max(8,g(drag.w+dx)); drag.o.p.Height=Math.max(8,g(drag.h+dy)); drag.o.p.AutoSize=false; } else { drag.o.p.Left=Math.max(0,g(drag.l+dx)); drag.o.p.Top=Math.max(0,g(drag.t+dy)); }
    drawForm(); });
  window.addEventListener('mouseup',()=>{ if(drag){ drag=null; save(); drawOI(); } });
  frm.addEventListener('dblclick',e=>{ if(e.target.classList.contains('frh')) return; const vc=e.target.closest('.vc'); const o=vc?P.find(vc.dataset.n):P.form;
    if(o.vcl==='TMainMenu'||o.vcl==='TPopupMenu'){ select(o); grid.querySelector('[data-menu]')?.click(); return; }
    makeHandler(o,defaultEvent(o)); });

  /* ---------- диалоги среды ---------- */
  function dialog(ttl,body,buttons,onOpen){
    dlgs.hidden=false; const box=document.createElement('div'); box.className='bx-dlg';
    box.innerHTML=`<div class="wt"><span class="wc">${ttl}</span></div><div class="db">${body}</div><div class="btns">${(buttons||[['OK']]).map((b,i)=>`<button class="tb" data-i="${i}">${b[0]}</button>`).join('')}</div>`;
    dlgs.innerHTML=''; dlgs.appendChild(box);
    box.querySelector('.btns').addEventListener('click',e=>{ const b=e.target.closest('[data-i]'); if(!b) return; const f=(buttons||[['OK']])[+b.dataset.i][1]; if(f&&f(box)===false) return; closeDlg(); });
    if(onOpen) onOpen(box); else box.querySelector('.btns button')?.focus();
    return box;
  }
  const closeDlg=()=>{ dlgs.hidden=true; dlgs.innerHTML=''; root.focus({preventScroll:true}); };
  function pickList(ttl,items,onPick,hint){
    const b=dialog(ttl,`${hint?`<p>${hint}</p>`:''}<div class="lst">${items.map((x,i)=>`<div data-i="${i}" class="${i?'':'sel'}">${x[0]}</div>`).join('')||'<em>пусто</em>'}</div>`,[['OK',bx=>{ const s=bx.querySelector('.lst .sel'); if(s) onPick(items[+s.dataset.i][1]); return true; }],['Cancel']]);
    const l=b.querySelector('.lst'); l.addEventListener('click',e=>{ const d=e.target.closest('[data-i]'); if(!d) return; l.querySelectorAll('div').forEach(x=>x.classList.toggle('sel',x===d)); });
    l.addEventListener('dblclick',e=>{ const d=e.target.closest('[data-i]'); if(!d) return; onPick(items[+d.dataset.i][1]); closeDlg(); });
  }
  function optionsDlg(){
    if(prj.kind==='console'){ dialog('Project Options for '+prj.name+'.exe','<p>У консольного приложения нет форм. Вкладка Forms пустая.</p>'); return; }
    let auto=prj.auto.slice(), avail=prj.forms.map(p=>p.fn).filter(f=>!auto.includes(f)), main=prj.main;
    const b=dialog(`Project Options for ${esc(prj.name)}.exe — Forms`,`
      <label>Main form: <select class="mf">${prj.forms.map(p=>`<option${p.fn===main?' selected':''}>${p.fn}</option>`).join('')}</select></label>
      <div class="two"><div><b>Auto-create forms:</b><div class="lst la"></div></div><div class="mid"><button class="tb" data-mv=">">&gt;</button><button class="tb" data-mv="<">&lt;</button><button class="tb" data-mv=">>">&gt;&gt;</button><button class="tb" data-mv="<<">&lt;&lt;</button></div><div><b>Available forms:</b><div class="lst lv"></div></div></div>
      <label>Application Title: <input class="ttl" value="${esc(prj.title||'')}" placeholder="${esc(prj.name)}"></label>
      <p style="font-size:11px;color:#333">Auto-create — создаются в памяти при запуске (Application-&gt;CreateForm в ${esc(prj.name)}.cpp). Available — не создаются: создай сам <code>Application-&gt;CreateForm(__classid(TForm2), &amp;Form2);</code>. Главная форма всегда создаётся первой.</p>`,
      [['OK',bx=>{ main=bx.querySelector('.mf').value; if(!auto.includes(main)) auto.unshift(main); prj.main=main; prj.auto=[main,...auto.filter(f=>f!==main)]; prj.title=bx.querySelector('.ttl').value.trim(); save(); drawFsw(); drawPM(); if(file.un==='#prj') openFile('#prj'); status('Главная форма: '+main); return true; }],['Cancel']]);
    let selA=null, selV=null;
    const draw=()=>{ b.querySelector('.la').innerHTML=auto.map(f=>`<div data-f="${f}" class="${f===selA?'sel':''}">${f}</div>`).join(''); b.querySelector('.lv').innerHTML=avail.map(f=>`<div data-f="${f}" class="${f===selV?'sel':''}">${f}</div>`).join(''); };
    b.querySelector('.la').addEventListener('click',e=>{ const d=e.target.closest('[data-f]'); if(d){ selA=d.dataset.f; draw(); } });
    b.querySelector('.lv').addEventListener('click',e=>{ const d=e.target.closest('[data-f]'); if(d){ selV=d.dataset.f; draw(); } });
    b.querySelector('.mid').addEventListener('click',e=>{ const m=e.target.closest('[data-mv]'); if(!m) return; const mv=m.dataset.mv; const mf=b.querySelector('.mf').value;
      if(mv==='>'&&selA&&selA!==mf){ auto=auto.filter(f=>f!==selA); avail.push(selA); selA=null; }
      if(mv==='<'&&selV){ avail=avail.filter(f=>f!==selV); auto.push(selV); selV=null; }
      if(mv==='>>'){ avail.push(...auto.filter(f=>f!==mf)); auto=auto.filter(f=>f===mf); }
      if(mv==='<<'){ auto.push(...avail); avail=[]; }
      draw(); });
    draw();
  }
  function incHdr(){
    if(!file||file.un==='#prj'||file.ext!=='cpp'){ status('Открой .cpp модуля, в который подключать'); return; }
    const t=fileText(prj,file.un,'cpp'), inc=includesOf(t);
    const items=allUnits().filter(u=>u.un!==file.un&&!inc.has(u.un)&&(u.form||u.unit.h!=null)).map(u=>[`${u.un}${u.form?' ('+u.form.fn+')':''}`,u.un]);
    pickList('Use Unit',items,un=>{
      let s=t; const own=new RegExp(`(#include\\s*"${file.un}\\.h"[^\\n]*\\n)`);
      if(own.test(s)) s=s.replace(own,`$1#include "${un}.h"\n`); else s=s.replace(/(#pragma hdrstop[^\n]*\n)/,`$1#include "${un}.h"\n`);
      const p=prj.forms.find(x=>x.un===file.un), u=prj.units.find(x=>x.un===file.un); if(p) p.code=s; else if(u) u.cpp=s;
      ed.value=s; save(); status(`Добавлено #include "${un}.h" — теперь ${file.un} знает ${un}`);
    },`Какой модуль подключить к ${file.un}.cpp? (вставится #include)`);
  }
  function removeDlg(){
    const items=allUnits().map(u=>[`${u.un}.cpp${u.form?' ('+u.form.fn+')':''}`,u.un]);
    pickList('Remove From Project',items,un=>askRemove(un),'Какой модуль убрать из проекта?');
  }
  // удалить форму или модуль: сначала спросить
  function askRemove(un){
    const p=prj.forms.find(x=>x.un===un);
    if(allUnits().length<=1){ status('В проекте должен остаться хотя бы один модуль'); return; }
    if(p&&prj.kind==='vcl'&&prj.forms.length<=1){ status('У приложения должна остаться хотя бы одна форма'); return; }
    const what=p?`форму <b>${p.fn}</b> и её модуль <b>${un}.cpp / ${un}.h</b>`:`модуль <b>${un}.cpp${prj.units.find(x=>x.un===un).h!=null?' / '+un+'.h':''}</b>`;
    dialog('Remove From Project',`<p>Удалить ${what} из проекта?</p><p style="font-size:11px">Код этого модуля пропадёт. Строки <code>#include "${un}.h"</code> в других модулях тоже уберутся.</p>`,
      [['Yes',()=>{ doRemove(un); return true; }],['No']]);
  }
  function doRemove(un){
    syncEditorOut();
    const p=prj.forms.find(x=>x.un===un);
    if(p){ prj.forms=prj.forms.filter(x=>x!==p); prj.auto=prj.auto.filter(f=>f!==p.fn); if(prj.main===p.fn) prj.main=prj.forms[0].fn; if(P===p){ P=prj.forms.find(f=>f.fn===prj.main)||prj.forms[0]; cur=P.form; } }
    else prj.units=prj.units.filter(x=>x.un!==un);
    const inc=new RegExp(`^[ \\t]*#include\\s*"${un}\\.h"[^\\n]*\\n?`,'gm');
    for(const f of prj.forms) f.code=f.code.replace(inc,'');
    for(const u of prj.units){ u.cpp=u.cpp.replace(inc,''); if(u.h) u.h=u.h.replace(inc,''); }
    const keep=file&&file.un!==un?file:{un:P?P.un:allUnits()[0].un,ext:'cpp'};
    file=null; save(); drawFsw(); drawForm(); drawOI(); openFile(keep.un,keep.ext);
    status(`${p?p.fn+' и '+un:un} удалены из проекта`);
  }
  function newOther(){
    const b=dialog('New Items',`<div class="icons">
      <button data-n="newApp"><b>🗔</b>Application</button><button data-n="newForm"><b>➕</b>Form</button><button data-n="newUnit"><b>📄</b>Unit</button><button data-n="newCon"><b>⌨</b>Console Wizard</button></div>
      <p style="font-size:11px">Application — новый оконный проект (Form1). Form — ещё одна форма в этот проект. Unit — модуль без формы (.cpp + .h) для своих функций и классов. Console Wizard — программа с main(), cin и cout.</p>`,[['Cancel']]);
    b.querySelector('.icons').addEventListener('click',e=>{ const x=e.target.closest('[data-n]'); if(!x) return; closeDlg(); act(x.dataset.n); });
  }
  function openDlg(){
    const l=list(); const items=l.map(n=>{ const d=jget(KEY+'p:'+n,{}); return [`${esc(n)} <small style="color:#666">(${d.kind==='console'?'консоль':(d.forms||[]).length+' форм.'})</small>`,n]; });
    const b=dialog('Open Project',`<div class="lst">${items.map((x,i)=>`<div data-n="${esc(x[1])}" class="${i?'':'sel'}">📁 ${x[0]}</div>`).join('')||'<em>Сохранённых проектов нет</em>'}</div><p><b>Примеры:</b> ${EXAMPLES.map(x=>`<button class="tb" data-ex="${x[0]}">${x[1]}</button>`).join(' ')}</p>`,
      [['Open',bx=>{ const s=bx.querySelector('.lst .sel'); if(!s) return true; syncEditorOut(); save(true); const p=loadSaved(s.dataset.n); if(p) setProject(p); return true; }],['Delete',bx=>{ const s=bx.querySelector('.lst .sel'); if(!s) return false; const n=s.dataset.n; if(prj&&n===prj.name){ status('Открытый проект удалить нельзя — сначала открой другой'); return false; } store.set(KEY+'p:'+n,null); store.set(KEY+'list',JSON.stringify(list().filter(x=>x!==n))); s.remove(); return false; }],['Cancel']]);
    const ls=b.querySelector('.lst'); ls.addEventListener('click',e=>{ const d=e.target.closest('[data-n]'); if(!d) return; ls.querySelectorAll('div').forEach(x=>x.classList.toggle('sel',x===d)); });
    ls.addEventListener('dblclick',e=>{ const d=e.target.closest('[data-n]'); if(!d) return; syncEditorOut(); save(true); const p=loadSaved(d.dataset.n); closeDlg(); if(p) setProject(p); });
    b.addEventListener('click',e=>{ const x=e.target.closest('[data-ex]'); if(!x) return; closeDlg(); openExample(x.dataset.ex); });
  }
  function uniqName(base){ if(G.PR&&G.PR.active) return base; const l=list(); if(!l.includes(base)) return base; let k=2; while(l.includes(base+k)) k++; return base+k; }
  function openExample(id){ const ex=EXAMPLES.find(x=>x[0]===id); if(!ex) return; syncEditorOut(); if(prj) save(true); const p=ex[2](); p.name=uniqName(p.name); setProject(p); status('Открыт пример. Жми F9 (Run)'); }
  function saveAsDlg(){ dialog('Save Project As',`<label>Имя проекта: <input class="nm" value="${esc(prj.name)}"></label><p style="font-size:11px">Только латинские буквы, цифры и _ (как имя .exe).</p>`,[['Save',bx=>{ const n=bx.querySelector('.nm').value.trim(); if(!/^[A-Za-z_]\w*$/.test(n)){ status('Недопустимое имя проекта'); return false; } syncEditorOut(); const old=prj.name; prj.name=n; save(true); if(old!==n) status('Проект сохранён как '+n); redrawAll(); return true; }],['Cancel']],bx=>bx.querySelector('.nm').select()); }
  function exportFile(){ syncEditorOut(); const blob=new Blob([JSON.stringify(prjJSON(prj),null,1)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=prj.name+'.bpr.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); status('Файл '+prj.name+'.bpr.json скачан'); }
  function importFile(){ const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json'; inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; f.text().then(t=>{ try{ const d=JSON.parse(t); const p=prjLoad(d); p.name=uniqName(p.name); syncEditorOut(); save(true); setProject(p); status('Проект загружен из файла'); }catch(e){ status('Не получилось прочитать файл проекта: '+e.message); } }); }; inp.click(); }
  function findDlg(next){
    const ta=edTa(); if(!ta||$('.edh').hidden){ status('Поиск работает в редакторе кода'); return; }
    const go=s=>{ if(!s) return; lastFind=s; const from=ta.selectionEnd; let i=ta.value.indexOf(s,from); if(i<0) i=ta.value.indexOf(s); if(i<0){ status(`Search string '${s}' not found`); return; } ta.focus(); ta.setSelectionRange(i,i+s.length); const ln=ta.value.slice(0,i).split('\n').length; ta.scrollTop=Math.max(0,(ln-5)*20); ta.dispatchEvent(new Event('scroll')); pos(); status(''); };
    if(next&&lastFind){ go(lastFind); return; }
    const sel=ta.value.slice(ta.selectionStart,ta.selectionEnd);
    dialog('Find Text',`<label>Text to find: <input class="fs" value="${esc(sel||lastFind)}"></label>`,[['OK',bx=>{ const v=bx.querySelector('.fs').value; closeDlg(); go(v); return false; }],['Cancel']],bx=>{ const i=bx.querySelector('.fs'); i.select(); i.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const v=i.value; closeDlg(); go(v); } }); });
  }
  function gotoLine(){ const ta=edTa(); if(!ta||$('.edh').hidden) return; dialog('Go to Line Number',`<label>Enter new line number: <input class="ln" type="number" min="1" value="1"></label>`,[['OK',bx=>{ const n=+bx.querySelector('.ln').value; const lines=ta.value.split('\n'); const k=Math.max(1,Math.min(lines.length,n)); const p2=lines.slice(0,k-1).join('\n').length+(k>1?1:0); closeDlg(); ta.focus(); ta.setSelectionRange(p2,p2); ta.scrollTop=Math.max(0,(k-5)*20); ta.dispatchEvent(new Event('scroll')); pos(); return false; }],['Cancel']],bx=>bx.querySelector('.ln').select()); }
  function helpDlg(){
    dialog('C++Builder 6 — что умеет тренажёр',`<div class="help"><ul>
      <li><b>File → New</b>: Application (оконная программа), Form (ещё форма → Unit2.cpp/.h), Unit (модуль без формы), Console Application (main, cin, cout).</li>
      <li><b>Палитра</b> Standard / Additional / Win32 / System / Dialogs: Button, Label, Edit, Memo, CheckBox, RadioButton, ListBox, ComboBox, ScrollBar, GroupBox, RadioGroup, Panel, MainMenu, PopupMenu, BitBtn, StaticText, Shape, Image, StatusBar, DateTimePicker, Timer, Open/Save/Font/ColorDialog.</li>
      <li><b>Object Inspector</b>: свойства и события; двойной щелчок по событию или компоненту — заготовка обработчика в UnitN.cpp.</li>
      <li><b>Несколько форм</b>: <code>Form2-&gt;Show()</code>, <code>ShowModal()</code> (ждёт закрытия, возвращает ModalResult), <code>Hide()</code>, <code>Close()</code>, <code>ModalResult = mrOk</code>, кнопки со свойством ModalResult, <code>Form2-&gt;Edit1-&gt;Text</code>. Чтобы Unit1 видел Form2 — <b>File → Include Unit Hdr</b> (Alt+F11), иначе ошибка <i>Undefined symbol 'Form2'</i>, как в настоящем Builder.</li>
      <li><b>Project → Options → Forms</b>: главная форма, Auto-create и Available forms. Available-форму создают сами: <code>Application-&gt;CreateForm(__classid(TForm2), &amp;Form2);</code></li>
      <li><b>Project → View Source</b> — Project1.cpp с USEFORM и CreateForm (Builder пишет его сам).</li>
      <li><b>UnitN.h</b> можно править: свои поля и методы класса формы пиши в <code>private:</code> / <code>public:</code> (например, <code>int count;</code>), секцию __published ведёт Builder.</li>
      <li><b>Run (F9)</b>: окна программы можно таскать за заголовок; × закрывает форму (OnClose), закрытие главной формы завершает программу. Program Reset (Ctrl+F2) — остановить.</li>
      <li><b>Консоль</b>: программа ждёт ввод — печатай в чёрном окне и жми Enter.</li>
      <li>Проекты сохраняются в браузере (File → Open Project), можно выгрузить в файл и загрузить обратно.</li>
      <li>Чего нет: настоящего .exe, Canvas-рисования, своих компонентов в палитре, отладчика по шагам.</li></ul></div>`);
  }
  function keysDlg(){ dialog('Горячие клавиши',`<div class="tw"><table>${KEYS.map(k=>`<tr><td><kbd>${k[0]}</kbd></td><td>${k[1]}</td></tr>`).join('')}</table></div>`); }
  function aboutDlg(){ dialog('About C++Builder',`<p style="font:700 16px Tahoma">Borland C++Builder 6 <small>(учебный тренажёр)</small></p><p>Эмулятор среды для курса «Программирование C++» (Кокшетауский университет). Код выполняет встроенный интерпретатор C++ с библиотекой VCL.</p>`); }

  /* ---------- сообщения компилятора ---------- */
  function clearMsgs(){ $('.bx-msg .ml').innerHTML=''; $('.bx-msg').hidden=true; }
  function showMsgs(arr){
    const m=$('.bx-msg'); m.hidden=false;
    m.querySelector('.ml').innerHTML=arr.map((x,i)=>`<div class="m ${x.kind||'e'}" data-i="${i}"><b>[C++ ${x.kind==='w'?'Warning':x.kind==='r'?'Exception':'Error'}]</b> ${x.un?esc(x.un+'.'+(x.ext||'cpp'))+(x.line?'('+x.line+')':'')+': ':''}${x.code?esc(x.code)+' ':''}${esc(x.msg)}${x.hint?`<small>${esc(x.hint)}</small>`:''}</div>`).join('');
    m.querySelector('.ml').onclick=e=>{ const d=e.target.closest('[data-i]'); if(!d) return; const x=arr[+d.dataset.i]; if(x.un) openFile(x.un,x.ext||'cpp',x.line); };
    const f=arr.find(x=>x.un); if(f) openFile(f.un,f.ext||'cpp',f.line);
  }
  function errOf(e,b){
    const w=e&&e.line&&b?whereOf(b,e.line):null;
    const code=e&&e.code&&!/x/.test(e.code)?e.code:'';
    return {kind:e&&e.kind==='compile'?'e':'r',un:w&&w.un,ext:w&&w.ext,line:w&&w.line,code,msg:e&&e.message?e.message:String(e)};
  }

  /* ================= запуск ================= */
  const vfs=new Map([['C:\\Мои документы\\пример.txt','Привет из файла!\r\nВторая строка\r\n'],['C:\\Мои документы\\список.txt','молоко\r\nхлеб\r\nсыр\r\n']]);
  function setRunning(on){ title(); root.querySelector('[data-a="run"]').disabled=on; root.querySelector('[data-a="reset"]').disabled=!on; desk.hidden=!on;
    if(on){ const top=$('.bx-bar').getBoundingClientRect().bottom-$('.bx-win').getBoundingClientRect().top; desk.style.top=top+'px'; } }
  function make(){
    syncEditorOut(); save(true); clearMsgs();
    const errs=prj.kind==='vcl'?includeErrors(prj):includeErrors(prj);
    if(errs.length){ showMsgs(errs); status('Компиляция не прошла'); return null; }
    const b=build(prj);
    try{ const prog=CPP.parse(b.src);
      if(prj.kind==='console'){ const it=new CPP.Interp(prog,{}); it.prepare(); }
      else { const rps=prj.forms.map(p=>new V.Project(p.toJSON())); new V.Runtime(rps[0],{projects:rps,source:b.src,isCreated:()=>true,fs:new Map()}).compile(); } }
    catch(e){ if(e instanceof CPP.CppError){ showMsgs([errOf(e,b)]); status('Компиляция не прошла'); return null; } showMsgs([{msg:'Внутренняя ошибка: '+e.message}]); return null; }
    return b;
  }
  function run(){
    if(R) return; if(!prj) return;
    const b=make(); if(!b) return;
    if(prj.kind==='console') return runConsole(b);
    const rps=prj.forms.map(p=>new V.Project(p.toJSON()));
    const main=rps.find(p=>p.fn===prj.main)||rps[0];
    const projects=[main,...rps.filter(p=>p!==main)];
    R={kind:'vcl',rps:projects,main,created:new Set(),timers:[],z:[],modal:[],depth:0,b,active:null,quit:false,design:new Map()};
    const ui={projects,source:b.src,isCreated:p=>p===main||prj.auto.includes(p.fn),message:s=>msgBox(s),close:()=>{ R&&(R.quit=true); },timers:()=>setTimers(),fs:vfs,files:()=>{},
      focus:o=>{ const n=desk.querySelector(`.rw[data-f="${o._proj.fn}"] .vc[data-n="${o.Name}"]`); if(n){ const i=n.matches('input,textarea,button,select')?n:n.querySelector('input'); i&&i.focus(); } },
      formShow:o=>formShow(o), formHide:o=>formHide(o), formClose:o=>formClose(o), isShowing:o=>!!o.p.Visible, createForm:p=>createForm(p),
      modalResult:(o,v)=>{ if(R&&R.modal.length&&R.modal[R.modal.length-1].form===o) R.endModal={form:o,v}; }, mainForm:()=>main.form, activeForm:()=>R&&R.active};
    const rt=new V.Runtime(main,ui); R.rt=rt;
    for(const p of projects){ R.design.set(p.fn,!!p.form.p.Visible); p.form.p.Visible=false; }
    try{ rt.compile(); }catch(e){ const x=e instanceof CPP.CppError?errOf(e,b):{msg:'Внутренняя ошибка: '+e.message}; R=null; showMsgs([x]); return; }
    setRunning(true); status('Программа запущена. Закрой главное окно (×) или нажми Program Reset (Ctrl+F2).');
    for(const p of projects) if(ui.isCreated(p)) createForm(p,true);
    if(!R) return;
    if(rt.app.p.ShowMainForm) safeFire(null,null,null,()=>formShow(main.form));
    for(const p of projects) if(R&&p!==main&&R.created.has(p.fn)&&R.design.get(p.fn)) safeFire(null,null,null,()=>formShow(p.form));
    if(!R) return;
    setTimers(); draw();
  }
  function stopRun(){ if(!R) return; if(R.kind==='vcl') R.timers.forEach(t=>clearInterval(t)); R=null; desk.querySelector('.dk-wins').innerHTML=''; desk.querySelector('.dk-bar').innerHTML=''; desk.querySelectorAll('.ovl,.vpop,.modal-ovl').forEach(x=>x.remove()); setRunning(false); status('Программа завершена'); }
  // вызвать событие «снаружи» (клик пользователя, таймер) — с ловлей ошибок и диалогов
  function top(fn){ if(!R) return; R.depth++; try{ fn(); }catch(e){ handleErr(e,null); } finally{ if(R){ R.depth--; afterTop(); } } }
  function afterTop(){ if(!R||R.depth) return; if(R.endModal){ const m=R.endModal; R.endModal=null; endModal(m.form,m.v); } if(R&&R.quit){ stopRun(); return; } draw(); }
  function inner(o,ev,extra){ if(!R) return false; if(R.depth) return R.rt.fire(o,ev,extra); let r=false; top(()=>{ r=R.rt.fire(o,ev,extra); }); return r; }
  function createForm(p,startup){
    if(R.created.has(p.fn)&&!startup) return; R.created.add(p.fn);
    const go=()=>{ if(p.form.cls&&p.form.cls.methods.get('FormCtor__')&&p.form.cls.methods.get('FormCtor__')[0].body){ p.form.events.__ctor='FormCtor__'; R.rt.fire(p.form,'__ctor'); } R.rt.fire(p.form,'OnCreate'); };
    if(startup) safeFire(null,null,null,go); else go();
  }
  function placeForm(o){
    const p=o.p, dr=desk.getBoundingClientRect(), W=dr.width, H=dr.height-24;
    if(o._placed) return; o._placed=true;
    const mainF=R.main.form;
    if(p.Position===4||p.Position===5){ p.Left=Math.max(0,(W-p.Width)/2|0); p.Top=Math.max(0,(H-p.Height)/2|0); }
    else if((p.Position===6||p.Position===7)&&mainF!==o){ p.Left=Math.max(0,mainF.p.Left+((mainF.p.Width-p.Width)/2|0)); p.Top=Math.max(0,mainF.p.Top+((mainF.p.Height-p.Height)/2|0)); }
    else { p.Left=Math.min(Math.max(0,p.Left),Math.max(0,W-p.Width-6)); p.Top=Math.min(Math.max(0,p.Top),Math.max(0,H-p.Height-6)); }
  }
  function formShow(o){
    if(!R) return; const fn=o._proj.fn;
    if(!R.created.has(fn)) throw new CPP.CppError(`Форма ${fn} ещё не создана (её нет в Auto-create forms) — сначала Application->CreateForm(__classid(${o._proj.cls}), &${fn})`,0,'runtime');
    R.z=R.z.filter(f=>f!==fn); R.z.push(fn); R.active=o;
    if(o.p.Visible) return;
    placeForm(o); o.p.Visible=true;
    inner(o,'OnShow'); inner(o,'OnActivate');
  }
  function formHide(o){ if(!R) return; o.p.Visible=false; R.z=R.z.filter(f=>f!==o._proj.fn);
    const m=R.modal[R.modal.length-1]; if(m&&m.form===o) R.endModal={form:o,v:o.modalResult||2}; }
  function formClose(o){
    if(!R) return;
    const m=R.modal[R.modal.length-1]; if(m&&m.form===o){ R.endModal={form:o,v:o.modalResult||2}; return; }
    const isMain=o===R.main.form;
    const ex={action:{v:isMain?2:1,t:CPP.types.tInt}}; inner(o,'OnClose',ex);
    const a=ex.action.cell?ex.action.cell.v:ex.action.v; if(a===0) return;   // caNone — не закрывать
    if(isMain){ R.quit=true; if(!R.depth) afterTop(); return; }
    o.p.Visible=false; R.z=R.z.filter(f=>f!==o._proj.fn);
  }
  /* --- снимки состояния: чтобы обработчик с диалогом/ShowModal можно было «доиграть» после ответа --- */
  function snapshot(){
    const S=[]; const rec=(h,k)=>{ const v=h[k]; S.push([h,k,Array.isArray(v)?v.slice():v]); };
    const cell=(c,d)=>{ if(!c||d>4) return; rec(c,'v'); if('u' in c) rec(c,'u'); const v=c.v; if(Array.isArray(v)) v.forEach(x=>cell(x,d+1)); else if(v&&v.cls&&v.f&&!v.vcl) for(const k in v.f) cell(v.f[k],d+1); };
    for(const p of R.rps){ for(const o of [p.form,...p.comps]){ for(const k in o.p){ const v=o.p[k]; if(v&&typeof v==='object'){ if(v.vcl==='TFont'||v.vcl==='TBrush') for(const fk in v.p) rec(v.p,fk); else if(v.vcl==='TStrings') rec(v,'items'); else if(v.vcl==='TStatusPanels') v.items.forEach(x=>rec(x.p,'Text')); } else rec(o.p,k); } rec(o,'modalResult'); }
      for(const k in (p.form.f||{})) cell(p.form.f[k],1); }
    const it=R.rt.it; if(it&&it.globalScope) for(const [,g] of it.globalScope.vars) cell(g.cell||g,0);
    return S;
  }
  const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)?a.length===b.length&&a.every((x,i)=>x===b[i]):a===b;
  const restore=S=>{ for(const [h,k,v] of S) h[k]=Array.isArray(v)?v.slice():v; };
  // что изменилось между снимками (пока был открыт диалог)
  const diff=(S1,S2)=>S2.filter((x,i)=>!S1[i]||S1[i][0]!==x[0]||!same(S1[i][2],x[2]));
  function safeFire(o,ev,extra,fn){
    if(!R) return false;
    const ctx={o,ev,extra,fn,S0:snapshot(),answers:[]};
    return runCtx(ctx);
  }
  function runCtx(ctx){
    if(!R) return false; const rt=R.rt; rt.answers=ctx.answers.slice(); rt.ai=0; R.depth++; let r=false;
    try{ r=ctx.fn?(ctx.fn(),true):rt.fire(ctx.o,ctx.ev,ctx.extra); }
    catch(e){ handleErr(e,ctx); }
    finally{ if(R){ R.depth--; afterTop(); } }
    return r;
  }
  function handleErr(e,ctx){
    if(!R) return;
    if(e&&e.vclAsk&&ctx){
      const S1=snapshot();
      const resume=(v,raw)=>{ if(!R) return; const S2=snapshot(); const ch=diff(S1,S2);
        restore(ctx.S0); ctx.answers.push(raw?v:{__ans:1,v,restore:()=>restore(ch)}); runCtx(ctx); };
      if(e.vclAsk.kind==='modal'){ openModal(e.vclAsk.data.form,resume); return; }
      askDialog(e.vclAsk,ans=>resume(ans)); return;
    }
    if(e&&e.vclAsk){ return; }
    if(e instanceof CPP.CppError){ const x=errOf(e,R.b); const m=/^'.*' is not a valid|EConvertError/.test(e.message)?'EConvertError':/List index/.test(e.message)?'EStringListError':/EFOpenError/.test(e.message)?'EFOpenError':/Access violation|нулевой указатель|NULL/.test(e.message)?'EAccessViolation':'Exception';
      exBox(`Project ${prj.name}.exe raised exception class ${m} with message '${e.message.replace(/ — .*$/,'').replace(/ \(E\w+\)$/,'')}'.`, e.message+(x.un?` (${x.un}.${x.ext}, строка ${x.line})`:''));
      if(x.un){ openFile(x.un,x.ext,x.line); } return; }
    exBox('Внутренняя ошибка эмулятора',String(e&&e.message||e));
  }
  function openModal(form,resume){
    const fn=form._proj.fn;
    if(!R.created.has(fn)){ exBox('Access violation',`Форма ${fn} не создана — ShowModal нельзя. Добавь её в Auto-create или вызови Application->CreateForm.`); return; }
    form.modalResult=0; R.modal.push({form,resume});
    R.depth++; try{ formShow(form); }catch(e){ handleErr(e,null); } finally{ R.depth--; }
    draw();
  }
  function endModal(form,v){
    const i=R.modal.findIndex(m=>m.form===form); if(i<0) return; const m=R.modal.splice(i,1)[0];
    form.p.Visible=false; R.z=R.z.filter(f=>f!==form._proj.fn); form.modalResult=v;
    R.active=null; m.resume(v);
  }
  function setTimers(){ if(!R||R.kind!=='vcl') return; R.timers.forEach(t=>clearInterval(t)); R.timers=[];
    for(const p of R.rps) if(R.created.has(p.fn)) for(const c of p.comps) if(c.vcl==='TTimer'&&c.p.Enabled&&c.p.Interval>0&&c.events.OnTimer){ const t=setInterval(()=>{ if(!R||dlgOpen()) return; safeFire(c,'OnTimer'); },Math.max(20,c.p.Interval)); R.timers.push(t); } }
  const dlgOpen=()=>!!desk.querySelector('.ovl:not([hidden])');
  /* --- окна программы --- */
  function draw(){
    if(!R||R.kind!=='vcl') return;
    const wins=desk.querySelector('.dk-wins');
    const act=document.activeElement, an=act&&act.closest&&act.closest('.vc')?act.closest('.vc').dataset.n:null, af=act&&act.closest&&act.closest('.rw')?act.closest('.rw').dataset.f:null, sS=act&&act.selectionStart, sE=act&&act.selectionEnd;
    const vis=R.rps.filter(p=>R.created.has(p.fn)&&p.form.p.Visible);
    wins.querySelectorAll('.rw').forEach(w=>{ if(!vis.some(p=>p.fn===w.dataset.f)) w.remove(); });
    const order=f=>{ const p=R.rps.find(x=>x.fn===f); const st=p&&p.form.p.FormStyle===3?500:0; const mi=R.modal.findIndex(m=>m.form._proj.fn===f); return mi>=0?700+mi*2:st+Math.max(0,R.z.indexOf(f))+1; };
    for(const p of vis){
      const f=p.form.p; let w=wins.querySelector(`.rw[data-f="${p.fn}"]`);
      if(!w){ w=document.createElement('div'); w.className='rw'; w.dataset.f=p.fn; w.tabIndex=-1; w.innerHTML=`<div class="wt"><span class="wi">⧉</span><span class="wc"></span><span class="wb"><i>_</i><i>□</i><i class="x" title="Закрыть">×</i></span></div><div class="rwm"></div><div class="client"></div>`; wins.appendChild(w); }
      const menu=p.comps.find(c=>c.vcl==='TMainMenu');
      w.style.cssText=`left:${f.Left}px;top:${f.Top}px;width:${f.Width}px;z-index:${order(p.fn)};${f.AlphaBlend?'opacity:'+Math.max(.15,f.AlphaBlendValue/255):''}`;
      w.classList.toggle('act',R.active===p.form||(!R.active&&p===R.main));
      w.querySelector('.wc').textContent=f.Caption;
      w.querySelector('.wb').style.display=f.BorderStyle===0?'none':'';
      w.querySelector('.rwm').innerHTML=menuBarHTML(menu);
      const cl=w.querySelector('.client');
      const ch=f.Height-27-(menu?20:0);
      cl.style.cssText=`height:${ch}px;background:${V.colorCss(f.Color)};${fontCss(p.form.p.Font)}${f.Cursor?'cursor:'+V.CURSOR_CSS[f.Cursor]:''}`;
      cl.innerHTML=treeHTML(p,'run',null,f.Width-8,ch);
    }
    let mo=desk.querySelector('.modal-ovl');
    if(R.modal.length){ if(!mo){ mo=document.createElement('div'); mo.className='modal-ovl'; wins.appendChild(mo); } mo.style.zIndex=699+(R.modal.length-1)*2; } else if(mo) mo.remove();
    desk.querySelector('.dk-bar').innerHTML=vis.map(p=>`<button class="tbt${R.active===p.form?' on':''}" data-f="${p.fn}">⧉ ${esc(p.form.p.Caption)}</button>`).join('')+`<span class="hint">${esc(prj.name)}.exe — работает · Program Reset: Ctrl+F2</span>`;
    if(an&&af){ const n=wins.querySelector(`.rw[data-f="${af}"] .vc[data-n="${an}"]`); if(n){ const t=n.matches('input,textarea,select,button')?n:n.querySelector('input'); if(t){ t.focus({preventScroll:true}); try{ if(sS!=null&&t.setSelectionRange) t.setSelectionRange(sS,sE); }catch(e){} } } }
  }
  const projOfEl=el=>{ const w=el&&el.closest&&el.closest('.rw'); return w&&R?R.rps.find(p=>p.fn===w.dataset.f):null; };
  const compOf=el=>{ const p=projOfEl(el); if(!p) return null; const n=el.closest('.vc'); return n?p.find(n.dataset.n):null; };
  const blocked=p=>R&&R.modal.length&&R.modal[R.modal.length-1].form!==p.form;
  function activate(p){ if(!R||R.active===p.form) return; const old=R.active; R.active=p.form; R.z=R.z.filter(f=>f!==p.fn); R.z.push(p.fn); if(old&&old.events.OnDeactivate) safeFire(old,'OnDeactivate'); if(p.form.events.OnActivate) safeFire(p.form,'OnActivate'); draw(); }
  let wdrag=null;
  desk.addEventListener('mousedown',e=>{ if(!R||R.kind!=='vcl') return; const p=projOfEl(e.target); if(!p) return; if(blocked(p)){ e.preventDefault(); return; }
    if(R.active!==p.form){ R.active=p.form; R.z=R.z.filter(f=>f!==p.fn); R.z.push(p.fn); const w=e.target.closest('.rw'); w.style.zIndex=600; desk.querySelectorAll('.rw').forEach(x=>x.classList.toggle('act',x===w)); }
    if(e.target.closest('.wt')&&!e.target.closest('.wb')){ wdrag={p,sx:e.clientX,sy:e.clientY,l:p.form.p.Left,t:p.form.p.Top}; e.preventDefault(); return; }
    const o=compOf(e.target)||p.form; if(o.events&&o.events.OnMouseDown){ const r=(e.target.closest('.vc')||e.target.closest('.client')).getBoundingClientRect(); safeFire(o,'OnMouseDown',{x:Math.round(e.clientX-r.left),y:Math.round(e.clientY-r.top),button:e.button===2?1:0,shift:(e.shiftKey?1:0)|(e.altKey?2:0)|(e.ctrlKey?4:0)}); } });
  window.addEventListener('mousemove',e=>{ if(!wdrag||!R) return; const f=wdrag.p.form.p; f.Left=Math.max(-f.Width+60,wdrag.l+e.clientX-wdrag.sx); f.Top=Math.max(0,wdrag.t+e.clientY-wdrag.sy); const w=desk.querySelector(`.rw[data-f="${wdrag.p.fn}"]`); if(w){ w.style.left=f.Left+'px'; w.style.top=f.Top+'px'; } });
  window.addEventListener('mouseup',()=>{ wdrag=null; });
  desk.addEventListener('mouseup',e=>{ if(!R||R.kind!=='vcl') return; const p=projOfEl(e.target); if(!p||blocked(p)) return; const o=compOf(e.target)||p.form; if(o.events&&o.events.OnMouseUp){ const r=(e.target.closest('.vc')||e.target.closest('.client')||e.target).getBoundingClientRect(); safeFire(o,'OnMouseUp',{x:Math.round(e.clientX-r.left),y:Math.round(e.clientY-r.top),button:e.button===2?1:0}); } });
  desk.addEventListener('click',e=>{
    if(!R) return;
    const tb=e.target.closest('.tbt'); if(tb){ const p=R.rps.find(x=>x.fn===tb.dataset.f); if(p&&!blocked(p)) activate(p); return; }
    if(R.kind!=='vcl') return;
    const p=projOfEl(e.target); if(!p) return; if(blocked(p)) return;
    if(e.target.closest('.x')){ safeFire(null,null,null,()=>formClose(p.form)); return; }
    if(e.target.closest('.wt')) return;
    const mi=e.target.closest('.mi'); if(mi){ openMenu(p,mi); return; }
    const o=compOf(e.target);
    if(!o){ if(e.target.closest('.client')) safeFire(p.form,'OnClick'); return; }
    if(o.p.Enabled===false) return;
    if(o.vcl==='TCheckBox'){ o.p.Checked=!o.p.Checked; o.p.State=o.p.Checked?1:0; }
    if(o.vcl==='TRadioButton'){ p.comps.forEach(c=>{ if(c.vcl==='TRadioButton'&&c.parent===o.parent) c.p.Checked=false; }); o.p.Checked=true; }
    if(o.vcl==='TListBox'){ const li=e.target.closest('.li'); if(li) o.p.ItemIndex=+li.dataset.i; }
    if(o.vcl==='TRadioGroup'){ const r=e.target.closest('input[data-i]'); if(!r) return; o.p.ItemIndex=+r.dataset.i; }
    if(o.vcl==='TBitBtn'&&o.p.Kind===6&&!o.events.OnClick){ safeFire(null,null,null,()=>formClose(p.form)); return; }
    safeFire(o,'OnClick');
    if(!R) return;
    // кнопка со свойством ModalResult закрывает модальную форму
    const mr=o.p.ModalResult||(o.vcl==='TBitBtn'?({1:1,2:2,4:6,5:7,7:3,8:4,9:5}[o.p.Kind]||0):0);
    if(mr&&(o.vcl==='TButton'||o.vcl==='TBitBtn')){ const top2=R.modal[R.modal.length-1]; if(top2&&top2.form===p.form){ p.form.modalResult=mr; endModal(p.form,mr); draw(); } }
    if(R&&o.vcl==='TBitBtn'&&o.p.Kind===6) safeFire(null,null,null,()=>formClose(p.form));
  });
  desk.addEventListener('dblclick',e=>{ if(!R||R.kind!=='vcl') return; const p=projOfEl(e.target); if(!p||blocked(p)||e.target.closest('.wt')) return; safeFire(compOf(e.target)||p.form,'OnDblClick'); });
  desk.addEventListener('input',e=>{ if(!R||R.kind!=='vcl') return; const o=compOf(e.target); if(!o) return;
    if(o.vcl==='TEdit'){ o.p.Text=e.target.value; safeFire(o,'OnChange'); }
    if(o.vcl==='TMemo'){ o.p.Lines.items=e.target.value.split('\n'); safeFire(o,'OnChange'); }
    if(o.vcl==='TScrollBar'){ const v=+e.target.value; const extra={scrollpos:{v,t:CPP.types.tInt},scrollcode:5}; safeFire(o,'OnScroll',extra); o.p.Position=extra.scrollpos.cell?extra.scrollpos.cell.v:v; safeFire(o,'OnChange'); } });
  desk.addEventListener('change',e=>{ if(!R||R.kind!=='vcl') return; const o=compOf(e.target); if(o&&o.vcl==='TComboBox'){ o.p.ItemIndex=+e.target.value; o.p.Text=o.p.Items.items[o.p.ItemIndex]||''; safeFire(o,'OnChange'); } });
  let lastMove=0;
  desk.addEventListener('mousemove',e=>{ if(!R||R.kind!=='vcl'||wdrag) return; const now=Date.now(); if(now-lastMove<40) return; lastMove=now; const p=projOfEl(e.target); if(!p||blocked(p)) return;
    const o=compOf(e.target)||p.form; if(!o.events.OnMouseMove) return; const r=(e.target.closest('.vc')||e.target.closest('.client')||e.target).getBoundingClientRect();
    safeFire(o,'OnMouseMove',{x:Math.round(e.clientX-r.left),y:Math.round(e.clientY-r.top),shift:(e.shiftKey?1:0)|(e.altKey?2:0)|(e.ctrlKey?4:0)}); });
  desk.addEventListener('keypress',e=>{ if(!R||R.kind!=='vcl') return; const p=projOfEl(e.target); if(!p) return; const o=compOf(e.target)||p.form;
    const tgt=o.events.OnKeyPress?o:(p.form.p.KeyPreview&&p.form.events.OnKeyPress?p.form:null); if(!tgt||e.key.length!==1) return;
    const extra={key:{v:CPP.c2b(e.key),t:CPP.types.tChar}}; safeFire(tgt,'OnKeyPress',extra); const k=extra.key.cell?extra.key.cell.v:0;
    if(!k||k!==CPP.c2b(e.key)){ e.preventDefault(); if(k&&e.target.matches('input,textarea')) document.execCommand('insertText',false,CPP.b2c(k)); } });
  desk.addEventListener('keydown',e=>{ if(!R||R.kind!=='vcl') return; const p=projOfEl(e.target); if(!p) return; const o=compOf(e.target)||p.form;
    if(e.key==='Enter'&&!e.target.matches('textarea')){ const d=p.comps.find(c=>(c.vcl==='TButton'||c.vcl==='TBitBtn')&&c.p.Default&&c.p.Visible!==false&&c.p.Enabled!==false); if(d&&!o.events.OnKeyPress){ e.preventDefault(); desk.querySelector(`.rw[data-f="${p.fn}"] .vc[data-n="${d.Name}"]`)?.click(); return; } }
    if(e.key==='Escape'){ const c=p.comps.find(x=>(x.vcl==='TButton'||x.vcl==='TBitBtn')&&x.p.Cancel); if(c){ e.preventDefault(); desk.querySelector(`.rw[data-f="${p.fn}"] .vc[data-n="${c.Name}"]`)?.click(); return; } }
    if(o.events.OnKeyDown){ const extra={key:{v:e.keyCode,t:CPP.types.tInt},shift:(e.shiftKey?1:0)|(e.altKey?2:0)|(e.ctrlKey?4:0)}; safeFire(o,'OnKeyDown',extra); } });
  desk.addEventListener('contextmenu',e=>{ if(!R||R.kind!=='vcl') return; const p=projOfEl(e.target); if(!p) return; const o=compOf(e.target)||p.form; const pm=o.p.PopupMenu||p.form.p.PopupMenu; const m=pm&&(typeof pm==='string'?p.find(pm):pm); if(m){ e.preventDefault(); openMenuItems(p,m.p.Items.items,e.clientX,e.clientY); } });
  function openMenu(p,mi){ const menu=p.comps.find(c=>c.vcl==='TMainMenu'); const m=menu&&menu.p.Items.items.find(x=>x.Name===mi.dataset.m); if(!m) return; if(!m.items.length){ fireMenu(p,m); return; } const r=mi.getBoundingClientRect(); openMenuItems(p,m.items,r.left,r.bottom); }
  function openMenuItems(p,items,x,y){ closePop(); const pop=document.createElement('div'); pop.className='vpop'; const rr=desk.getBoundingClientRect(); pop.style.left=(x-rr.left)+'px'; pop.style.top=(y-rr.top)+'px';
    pop.innerHTML=items.filter(m=>m.p.Visible).map(m=>m.p.Caption==='-'?'<hr>':`<div class="pm${m.p.Enabled?'':' dis'}" data-m="${m.Name}">${m.p.Checked?'✓ ':''}${amp(m.p.Caption)}${m.items.length?' ▸':''}</div>`).join('');
    desk.appendChild(pop);
    pop.addEventListener('click',e=>{ const d=e.target.closest('.pm'); if(!d||d.classList.contains('dis')) return; const m=findMenu(items,d.dataset.m); closePop(); if(m){ if(m.items.length){ openMenuItems(p,m.items,e.clientX,e.clientY); return; } fireMenu(p,m); } });
    setTimeout(()=>document.addEventListener('click',closePop,{once:true}),0); }
  const findMenu=(items,n)=>{ for(const m of items){ if(m.Name===n) return m; const r=findMenu(m.items,n); if(r) return r; } return null; };
  function closePop(){ desk.querySelectorAll('.vpop').forEach(p=>p.remove()); }
  function fireMenu(p,m){ if(!R) return; m._form=p.form; if(m.events.OnClick) safeFire(m,'OnClick'); }
  /* --- диалоги программы (ShowMessage, InputBox, OpenDialog…) --- */
  function ovl(html,onClick){ let ov=desk.querySelector('.ovl'); if(!ov){ ov=document.createElement('div'); ov.className='ovl'; desk.appendChild(ov); } ov.hidden=false; ov.innerHTML=`<div class="dlg">${html}</div>`; ov.querySelector('[data-ok]')?.focus();
    ov.onclick=e=>{ const b=e.target.closest('[data-r]'); if(!b) return; const v=onClick(b.dataset.r,ov); if(v!==false){ ov.hidden=true; ov.innerHTML=''; } };
    ov.onkeydown=e=>{ if(e.key==='Enter'&&!e.target.matches('textarea')){ const b=ov.querySelector('[data-ok]'); if(b){ e.preventDefault(); b.click(); } } if(e.key==='Escape'){ const b=ov.querySelector('[data-r="no"],[data-r="2"],[data-r="7"]'); if(b){ e.preventDefault(); b.click(); } } }; }
  function msgBox(s){ ovl(`<div class="wt"><span class="wc">${esc(prj.title||prj.name)}</span></div><div class="db"><p>${esc(s)}</p><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button></div></div>`,()=>{}); }
  function exBox(ttl,detail){ ovl(`<div class="wt"><span class="wc">Debugger Exception Notification</span></div><div class="db"><p>⚠ ${esc(ttl)}</p><p class="det">${esc(detail)}</p><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button></div></div>`,()=>{}); }
  function askDialog(a,cb){
    if(a.kind==='TOpenDialog'||a.kind==='TSaveDialog'){
      const sv=a.kind==='TSaveDialog'; const flt=a.data.comp.p.Filter||'Все файлы (*.*)|*.*';
      ovl(`<div class="wt"><span class="wc">${sv?'Save As':'Open'}</span></div><div class="db"><div class="fl">${[...vfs.keys()].map(f=>`<div class="fi" data-f="${esc(f)}">📄 ${esc(f.split('\\').pop())}</div>`).join('')||'<em>Папка пуста</em>'}</div>
        <label>File name: <input class="fn" value="${esc(a.data.comp.p.FileName?a.data.comp.p.FileName.split('\\').pop():sv?'новый.txt':'')}"></label><label>Files of type: <select>${flt.split('|').filter((_,i)=>i%2===0).map(s=>`<option>${esc(s)}</option>`).join('')}</select></label>
        <div class="btns"><button class="tb" data-r="ok" data-ok>${sv?'Save':'Open'}</button><button class="tb" data-r="no">Cancel</button></div></div>`,(r,ov)=>{
          if(r==='no'){ cb(null); return; } const n=ov.querySelector('.fn').value.trim(); if(!n) return false; const full=n.includes('\\')?n:'C:\\Мои документы\\'+n;
          if(!sv&&!vfs.has(full)) vfs.set(full,''); cb({name:full,files:[full]}); });
      desk.querySelectorAll('.fi').forEach(x=>x.addEventListener('click',()=>{ desk.querySelector('.ovl .fn').value=x.dataset.f.split('\\').pop(); }));
      return; }
    if(a.kind==='TFontDialog'){ const f=a.data.comp.p.Font.p;
      ovl(`<div class="wt"><span class="wc">Font</span></div><div class="db"><label>Font: <select class="fnm">${['MS Sans Serif','Arial','Times New Roman','Courier New','Comic Sans MS','Tahoma'].map(n=>`<option${n===f.Name?' selected':''}>${n}</option>`).join('')}</select></label><label>Size: <input class="fsz" type="number" value="${f.Size}" min="6" max="72"></label><label>Color: <select class="fcl">${Object.keys(V.COLORS).slice(0,16).map(n=>`<option${V.COLORS[n]===f.Color?' selected':''}>${n}</option>`).join('')}</select></label><label><input type="checkbox" class="fb"${f.Style&1?' checked':''}> Bold</label><label><input type="checkbox" class="fit"${f.Style&2?' checked':''}> Italic</label><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button><button class="tb" data-r="no">Cancel</button></div></div>`,(r,ov)=>{
        if(r==='no'){ cb(null); return; } cb({Name:ov.querySelector('.fnm').value,Size:+ov.querySelector('.fsz').value||8,Color:V.COLORS[ov.querySelector('.fcl').value],Style:(ov.querySelector('.fb').checked?1:0)|(ov.querySelector('.fit').checked?2:0)}); }); return; }
    if(a.kind==='TColorDialog'){ ovl(`<div class="wt"><span class="wc">Color</span></div><div class="db cgrid">${Object.keys(V.COLORS).slice(0,16).map(n=>`<button class="sw" data-r="${n}" title="${n}" style="background:${V.colorCss(V.COLORS[n])}"></button>`).join('')}<div class="btns"><button class="tb" data-r="no">Cancel</button></div></div>`,r=>{ cb(r==='no'?null:V.COLORS[r]); }); return; }
    if(a.kind==='confirm'){ const fl=a.data.flags&15, yn=fl===3||fl===4||!a.data.caption&&a.data.flags==null;
      ovl(`<div class="wt"><span class="wc">${esc(a.data.caption||'Confirm')}</span></div><div class="db"><p>${esc(a.data.text)}</p><div class="btns">${yn||fl===4||fl===3?`<button class="tb" data-r="6" data-ok>Yes</button><button class="tb" data-r="7">No</button>${fl===3?'<button class="tb" data-r="2">Cancel</button>':''}`:fl===1?'<button class="tb" data-r="1" data-ok>OK</button><button class="tb" data-r="2">Cancel</button>':'<button class="tb" data-r="1" data-ok>OK</button>'}</div></div>`,r=>cb(+r)); return; }
    if(a.kind==='input'){ ovl(`<div class="wt"><span class="wc">${esc(a.data.caption)}</span></div><div class="db"><p>${esc(a.data.prompt)}</p><input class="inb" value="${esc(a.data.def)}"><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button><button class="tb" data-r="no">Cancel</button></div></div>`,(r,ov)=>cb(r==='ok'?ov.querySelector('.inb').value:a.data.def)); desk.querySelector('.ovl .inb')?.select(); return; }
  }
  /* --- консольная программа --- */
  function runConsole(b){
    R={kind:'console',b,input:'',keys:[],done:false,waitKey:false};
    setRunning(true);
    const wins=desk.querySelector('.dk-wins');
    wins.innerHTML=`<div class="bx-con"><div class="wt"><span class="wc">C:\\Projects\\${esc(prj.name)}.exe</span><i class="x" title="Закрыть">×</i></div><div class="scr con" tabindex="-1"></div><div class="cin"><input spellcheck="false" autocomplete="off" aria-label="Ввод для программы"></div><div class="cst"></div></div>`;
    desk.querySelector('.dk-bar').innerHTML=`<button class="tbt on">⌨ ${esc(prj.name)}.exe</button><span class="hint">Консоль: печатай и жми Enter · Program Reset: Ctrl+F2</span>`;
    wins.querySelector('.x').addEventListener('click',()=>stopRun());
    const inp=wins.querySelector('.cin input');
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); if(!R||R.kind!=='console'||R.done) return; R.input+=inp.value+'\n'; inp.value=''; conStep(); } });
    const scr=wins.querySelector('.scr');
    scr.addEventListener('click',()=>{ if(R&&R.waitKey) scr.focus(); else inp.focus(); });
    // getch(): любая клавиша
    scr.addEventListener('keydown',e=>{ if(!R||R.kind!=='console'||!R.waitKey||e.ctrlKey||e.altKey||e.metaKey||/^(Shift|Control|Alt|F\d+)$/.test(e.key)) return; e.preventDefault(); e.stopPropagation();
      R.keys.push(e.key==='Enter'?13:e.key==='Escape'?27:e.key===' '?32:e.key.length===1?CPP.c2b(e.key):0); conStep(); });
    conStep();
  }
  function conStep(){
    if(!R||R.kind!=='console') return;
    const r=CPP.run(R.b.src,{input:R.input,keys:R.keys,interactive:true});
    R.waitKey=!!(r.waiting&&r.waitKey);
    const box=desk.querySelector('.bx-con'); if(!box) return;
    const scr=box.querySelector('.scr'), cin=box.querySelector('.cin'), st=box.querySelector('.cst');
    const screen=(r.screen||[]).slice(); while(screen.length>1&&!screen[screen.length-1].length) screen.pop();
    scr.innerHTML=CPP.screenHTML(screen);
    scr.scrollTop=scr.scrollHeight;
    if(r.waiting&&r.waitKey){ cin.hidden=true; st.textContent='getch(): программа ждёт нажатия любой клавиши'; scr.focus({preventScroll:true}); return; }
    if(r.waiting){ cin.hidden=false; st.textContent='Программа ждёт ввода — напечатай и нажми Enter'; box.querySelector('.cin input').focus({preventScroll:true}); return; }
    R.done=true; cin.hidden=true;
    if(r.error){ const x=errOf(r.error,R.b); st.textContent='Ошибка: '+r.error.message+(x.un?` (${x.un}.${x.ext}, строка ${x.line})`:''); if(x.un) openFile(x.un,x.ext,x.line); }
    else st.textContent=`Программа завершилась с кодом ${r.exitCode||0}. Закрой окно (×).`;
    if(r.warnings&&r.warnings.length) showMsgs(r.warnings.slice(0,5).map(w=>({kind:'w',msg:w.msg,line:w.line?whereOf(R.b,w.line)&&whereOf(R.b,w.line).line:0,un:w.line&&whereOf(R.b,w.line)?whereOf(R.b,w.line).un:null,ext:w.line&&whereOf(R.b,w.line)?whereOf(R.b,w.line).ext:null})));
  }

  /* ================= команды ================= */
  function act(a){
    closeMenus();
    if(R&&!['reset','help','keys','about','exit','min','msgs','pm','oi'].includes(a)){ if(a==='run') return; status('Сначала останови программу: Run → Program Reset (Ctrl+F2)'); return; }
    switch(a){
      case 'newApp': syncEditorOut(); save(true); setProject(Object.assign(newProject('vcl'),{name:uniqName('Project1')})); status('Новое приложение: File → New → Application'); break;
      case 'newCon': syncEditorOut(); save(true); setProject(Object.assign(newProject('console'),{name:uniqName('Project1')})); status('Консольное приложение. Пиши код в main() и жми F9'); break;
      case 'newForm': if(prj.kind==='console'){ status('В консольный проект форму не добавить — создай Application'); break; } syncEditorOut(); { const p=addForm(prj); save(); selectForm(p); setMode('split'); status(`Добавлена ${p.fn} и модуль ${p.un}.cpp / ${p.un}.h. Чтобы открыть её из другой формы — File → Include Unit Hdr (Alt+F11)`); } break;
      case 'newUnit': syncEditorOut(); { const u=addUnit(prj); save(); openFile(u.un,'cpp'); status(`Добавлен модуль ${u.un}.cpp / ${u.un}.h`); } break;
      case 'newOther': newOther(); break;
      case 'open': openDlg(); break;
      case 'examples': openDlg(); break;
      case 'save': syncEditorOut(); save(true); status('Сохранено: '+prj.name); break;
      case 'saveAs': saveAsDlg(); break;
      case 'export': exportFile(); break;
      case 'import': importFile(); break;
      case 'incHdr': incHdr(); break;
      case 'closeAll': syncEditorOut(); save(true); setProject(Object.assign(newProject('vcl'),{name:uniqName('Project1')})); status('File → Close All: открыт новый пустой проект'); break;
      case 'exit': case 'min': syncEditorOut(); if(prj) save(true); stopRun(); closeDlg(); root.hidden=true; document.documentElement.style.overflow=''; document.dispatchEvent(new CustomEvent('bcb-hide')); break;
      case 'undo': { const ta=edTa(); if(ta){ ta.focus(); document.execCommand('undo'); } } break;
      case 'copy': if(P&&cur&&cur!==P.form){ clip=JSON.parse(JSON.stringify(P.toJSON().comps.find(c=>c.Name===cur.Name))); status('Скопирован '+cur.Name); } break;
      case 'paste': if(P&&clip){ const o=P.add(clip.type,(clip.Left||0)+16,(clip.Top||0)+16,null); const keep=Object.assign({},clip); delete keep.Name; delete keep.events; delete keep.parent; keep.Left=o.p.Left; keep.Top=o.p.Top; if('Caption' in keep&&keep.Caption===clip.Name) keep.Caption=o.Name; if('Text' in keep&&keep.Text===clip.Name) keep.Text=o.Name; const n=V.makeComp(clip.type,o.Name,keep); o.p=n.p; save(); select(o); } break;
      case 'del': if(P&&cur&&cur!==P.form){ P.remove(cur); cur=P.form; save(); drawForm(); drawOI(); } break;
      case 'front': case 'back': if(P&&cur&&cur!==P.form){ P.comps=P.comps.filter(c=>c!==cur); if(a==='front') P.comps.push(cur); else P.comps.unshift(cur); save(); drawForm(); } break;
      case 'grid': if(P) { for(const c of P.comps){ c.p.Left=Math.round(c.p.Left/8)*8; c.p.Top=Math.round(c.p.Top/8)*8; } save(); drawForm(); } break;
      case 'selAll': { const ta=edTa(); if(ta){ ta.focus(); ta.select(); } } break;
      case 'find': findDlg(false); break;
      case 'findNext': findDlg(true); break;
      case 'gotoLine': gotoLine(); break;
      case 'pm': $('.bx-pm').hidden=!$('.bx-pm').hidden; break;
      case 'oi': $('.oi').hidden=!$('.oi').hidden; break;
      case 'msgs': $('.bx-msg').hidden=!$('.bx-msg').hidden||!$('.bx-msg .ml').innerHTML; break;
      case 'viewUnit': pickList('View Unit',[...allUnits().map(u=>[u.un,u.un]),[prj.name,'#prj']],un=>openFile(un,'cpp')); break;
      case 'viewForm': if(prj.kind==='console'){ status('В консольном проекте форм нет'); break; } pickList('View Form',prj.forms.map(p=>[`${p.fn} <small style="color:#666">(${p.un}.cpp)</small>`,p.fn]),fn=>{ selectForm(prj.forms.find(p=>p.fn===fn)); if(mode==='code') setMode('split'); }); break;
      case 'toggle': setMode(mode==='code'?'form':mode==='form'?'code':(document.activeElement===edTa()?'form':'code')); break;
      case 'split': setMode('split'); break;
      case 'remove': removeDlg(); break;
      case 'viewSrc': openFile('#prj','cpp'); break;
      case 'make': if(make()) { showMsgs([{kind:'w',msg:`Compiling… Linking… ${prj.name}.exe — 0 errors (Done)`}]); status('Make: ошибок нет'); } break;
      case 'options': optionsDlg(); break;
      case 'run': run(); break;
      case 'reset': stopRun(); break;
      case 'help': helpDlg(); break;
      case 'keys': keysDlg(); break;
      case 'about': aboutDlg(); break;
      case 'na': status('В тренажёре этой команды нет'); break;
    }
  }
  /* --- выпадающие меню --- */
  let openM=null;
  function closeMenus(){ root.querySelectorAll('.bx-drop').forEach(d=>d.remove()); root.querySelectorAll('.bx-menu>span').forEach(s=>s.classList.remove('on')); openM=null; }
  function showMenu(name,span){
    closeMenus(); openM=name; span.classList.add('on');
    const d=document.createElement('div'); d.className='bx-drop';
    d.innerHTML=MENU[name].map(x=>x==='-'?'<hr>':x[1]==='grp'?`<div class="grp">${x[0]}</div>`:`<div class="it${x[1]==='na'||(R&&!['reset','help','keys','about','pm','oi','msgs'].includes(x[1]))?' dis':''}" data-a="${x[1]}"><span>${x[0].replace(/^  /,'&nbsp;&nbsp;&nbsp;')}</span><kbd>${x[2]||''}</kbd></div>`).join('');
    const r=span.getBoundingClientRect(), rr=$('.bx-win').getBoundingClientRect();
    d.style.left=(r.left-rr.left)+'px'; d.style.top=(r.bottom-rr.top)+'px';
    $('.bx-win').appendChild(d);
    d.addEventListener('click',e=>{ const it=e.target.closest('.it'); if(it) act(it.dataset.a); });
  }
  $('.bx-menu').addEventListener('click',e=>{ const s=e.target.closest('[data-m]'); if(!s) return; if(openM===s.dataset.m) closeMenus(); else showMenu(s.dataset.m,s); e.stopPropagation(); });
  $('.bx-menu').addEventListener('mouseover',e=>{ const s=e.target.closest('[data-m]'); if(s&&openM&&openM!==s.dataset.m) showMenu(s.dataset.m,s); });
  root.addEventListener('click',e=>{ if(openM&&!e.target.closest('.bx-drop,.bx-menu')) closeMenus(); });
  root.querySelector('.bx-tools').addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(b) act(b.dataset.a); });
  root.querySelector('.bx-title').addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(b) act(b.dataset.a); });
  $('.bx-msg .mh').addEventListener('click',e=>{ if(e.target.closest('[data-a]')) $('.bx-msg').hidden=true; });
  /* --- клавиатура --- */
  root.addEventListener('keydown',e=>{
    if(root.hidden) return;
    const k=e.key, c=e.ctrlKey||e.metaKey, s=e.shiftKey, inField=e.target.closest('input,textarea,select'), inDesk=e.target.closest('.bx-desk');
    if(k==='Escape'){ if(!dlgs.hidden){ closeDlg(); e.preventDefault(); return; } if(openM){ closeMenus(); return; } }
    if(!dlgs.hidden) return;
    const keymap=[[k==='F9'&&!c,'run'],[k==='F2'&&c,'reset'],[k==='F9'&&c,'make'],[k==='F12'&&!s&&!c,'toggle'],[k==='F12'&&s,'viewForm'],[k==='F12'&&c,'viewUnit'],[k==='F11'&&e.altKey&&!c,'incHdr'],[k==='F11'&&c&&s,'options'],[k==='F11'&&c&&e.altKey,'pm'],[k==='F11'&&c&&!s&&!e.altKey,'open'],[k==='F11'&&!c&&!s&&!e.altKey,'oi'],[(k==='s'||k==='S'||k==='ы'||k==='Ы')&&c,'save'],[(k==='f'||k==='а')&&c&&!inDesk,'find'],[k==='F3','findNext'],[(k==='g'||k==='п')&&e.altKey,'gotoLine'],[k==='F1','help']];
    for(const [cond,a] of keymap) if(cond){ e.preventDefault(); act(a); return; }
    if(inDesk||inField||R) return;
    // дизайнер: Del, стрелки, Ctrl+C/V
    if(!P||!cur) return;
    if(k==='Delete'&&cur!==P.form){ e.preventDefault(); act('del'); return; }
    if(k==='Delete'&&cur===P.form&&prj.forms.length>1){ e.preventDefault(); askRemove(P.un); return; }
    if(c&&(k==='c'||k==='с')&&cur!==P.form){ e.preventDefault(); act('copy'); return; }
    if(c&&(k==='v'||k==='м')){ e.preventDefault(); act('paste'); return; }
    if(k.startsWith('Arrow')&&cur!==P.form){ e.preventDefault(); const st=c?1:8; const dx=k==='ArrowLeft'?-st:k==='ArrowRight'?st:0, dy=k==='ArrowUp'?-st:k==='ArrowDown'?st:0;
      if(s){ cur.p.Width=Math.max(4,cur.p.Width+dx); cur.p.Height=Math.max(4,cur.p.Height+dy); cur.p.AutoSize=false; } else { cur.p.Left=Math.max(0,cur.p.Left+dx); cur.p.Top=Math.max(0,cur.p.Top+dy); }
      save(); drawForm(); drawOI(); }
  });

  return {
    get(){ syncEditorOut(); return prj; }, hide(){ syncEditorOut(); if(prj) save(true); stopRun(); closeDlg(); root.hidden=true; document.documentElement.style.overflow=''; }, root,
    show(p){
      root.hidden=false; document.documentElement.style.overflow='hidden';
      if(p){ if(prj){ syncEditorOut(); save(true); } if(!p.dgKeep) p.name=uniqName(p.name); setProject(p); }
      else if(!prj){ const n=store.get(KEY+'cur'); const s=n&&loadSaved(n); setProject(s||newProject('vcl')); }
      else redrawAll();
      root.focus({preventScroll:true});
    }
  };
}

/* ================= страница вкладки ================= */
function renderPage(sec){
  if(sec.dataset.ready) return; sec.dataset.ready='1';
  sec.innerHTML=`<div class="read">
  <div class="topic-head"><div class="eyebrow">C++ · после темы 15 · среда разработки</div><h1>C++Builder 6 — тренажёр среды</h1></div>
  <p>Здесь собрана почти настоящая среда <b>Borland C++Builder 6</b>, которую мы проходим по силлабусу (темы 9–15). Создаёшь проект, кладёшь компоненты на формы, пишешь обработчики и запускаешь по <b>F9</b>, как в оригинале. Работает прямо в браузере, проекты сохраняются.</p>
  <div class="cbld-start"><button class="btn pri big" data-open="last">▶ Открыть C++Builder 6</button><button class="btn" data-open="app">File → New → Application</button><button class="btn" data-open="con">File → New → Console Application</button></div>
  <div class="cbld-shot" aria-hidden="true"><div class="t">C++Builder 6 - Project1</div><div class="m">File &nbsp;Edit &nbsp;Search &nbsp;View &nbsp;Project &nbsp;Run &nbsp;Component &nbsp;Tools &nbsp;Help</div><div class="b"><div>Object Inspector<br>Caption: Form1<br>Width: 400<br>Height: 300</div><div><div class="f"><div class="h">Form1</div><div class="c"><span>Button1</span></div></div></div></div></div>
  <h2>Что можно делать</h2>
  <ul>
    <li><b>File → New → Application / Form / Unit / Console Application</b>: оконная программа из нескольких форм (Unit1, Unit2, Unit3…), модули без формы, консольные программы с <code>cin</code> и <code>cout</code>.</li>
    <li><b>Палитра компонентов</b> (Standard, Additional, Win32, System, Dialogs), <b>Object Inspector</b> со свойствами и событиями, двойной щелчок создаёт обработчик.</li>
    <li><b>Несколько форм</b>: <code>Form2-&gt;Show()</code>, <code>Form2-&gt;ShowModal()</code> с <code>ModalResult</code>, <code>Hide()</code>, <code>Close()</code>, <code>Form2-&gt;Edit1-&gt;Text</code>, <b>File → Include Unit Hdr</b> (Alt+F11).</li>
    <li><b>Project → Options → Forms</b>: главная форма, Auto-create и Available forms, <code>Application-&gt;CreateForm(__classid(TForm2), &amp;Form2)</code>. <b>Project → View Source</b> показывает Project1.cpp с USEFORM.</li>
    <li><b>Project Manager</b>, View Form (Shift+F12), View Unit (Ctrl+F12), F12 «форма ⇄ код», поиск, переход к строке, сообщения компилятора с номером строки.</li>
    <li>Можно править <b>UnitN.h</b>: свои поля и методы класса формы в <code>private:</code> / <code>public:</code>.</li>
  </ul>
  <h2>Готовые примеры</h2>
  <div class="cbld-start">${EXAMPLES.map(x=>`<button class="btn" data-ex="${x[0]}">${x[1]}</button>`).join('')}</div>
  <details class="sol"><summary>Как сделать программу из двух форм — по шагам</summary><div class="solve">
    <ol>
      <li>Открой C++Builder → <b>File → New → Application</b>. Появятся Form1 и Unit1.cpp.</li>
      <li><b>File → New → Form</b> — появятся Form2 и Unit2.cpp / Unit2.h (кнопка «+ Form» над формой делает то же).</li>
      <li>На Form2 положи <b>Edit</b> и <b>Button</b>. У кнопки в Object Inspector поставь <b>ModalResult = mrOk</b>.</li>
      <li>Переключись на Form1 (кнопки «Формы:» или Shift+F12), положи <b>Button</b> и <b>Label</b>, дважды щёлкни по кнопке.</li>
      <li>Чтобы Unit1 «знал» Form2: открой Unit1.cpp и нажми <b>File → Include Unit Hdr</b> (Alt+F11) → Unit2. Builder вставит <code>#include "Unit2.h"</code>.</li>
      <li>В обработчике напиши:<pre class="cpp-code">if (Form2-&gt;ShowModal() == mrOk)
  Label1-&gt;Caption = Form2-&gt;Edit1-&gt;Text;</pre></li>
      <li><b>F9</b>. Нажми кнопку — откроется Form2. Введи текст, нажми кнопку на Form2 — текст появится на Form1.</li>
    </ol>
    <p>Попробуй убрать <code>#include "Unit2.h"</code> и запустить. Будет та же ошибка, что в настоящем Builder: <code>E2451 Undefined symbol 'Form2'</code>.</p>
  </div></details>
  <p class="foot">Проекты хранятся в этом браузере (File → Open Project). Их можно выгрузить в файл (File → Export) и загрузить на другом компьютере (File → Import). Настоящий .exe тренажёр не создаёт: код выполняет встроенный интерпретатор C++.</p>
  </div>`;
  sec.addEventListener('click',e=>{ const b=e.target.closest('[data-open],[data-ex]'); if(!b) return;
    if(b.dataset.ex){ const ex=EXAMPLES.find(x=>x[0]===b.dataset.ex); openIDE(ex[2]()); return; }
    const o=b.dataset.open; openIDE(o==='app'?newProject('vcl'):o==='con'?newProject('console'):null); });
}
CPP.initIDE=function(sec){ if(sec&&sec.id==='c16') renderPage(sec); };
CPP.openIDE=openIDE; CPP.ide=()=>IDE;  /* игра «Подземелье»: доступ к проекту и закрытию */
CPP.IDE_TEST={newProject,addForm,addUnit,build,includeErrors,prjJSON,prjLoad,example,exampleConsole,projectCpp};
})(typeof window!=='undefined'?window:globalThis);
