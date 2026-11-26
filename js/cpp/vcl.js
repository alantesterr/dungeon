/* Эмулятор Borland C++Builder 6 (VCL): компоненты, свойства, события, дизайнер формы, Object Inspector,
   редактор Unit1.cpp и запуск приложения (F9). Обработчики событий выполняет интерпретатор C++ (cpp-run.js).
   Разметка: <div class="vclw" data-id="…" data-title="…"><script type="application/json" data-role="vcl">{…}</script></div>
   Конфиг: {form:{props}, comps:[{type,Name,props…,parent}], code:'обработчики', ref:{form,comps,code},
            checks:[{name, act:[[…]], exp:[[…]]}], steps:[{t:'текст', c:{…}}], palette:['TButton',…]} */
(function(G){
'use strict';
const CPP=G.CPP; const {CppError,T}=CPP;
const Ty=()=>CPP.types;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rerr=(m,l)=>new CppError(m,l,'runtime');
const cerr=(m,l,c)=>new CppError(m,l,'compile',c);

/* ---------------- константы VCL ---------------- */
const COLORS={clBlack:0x000000,clMaroon:0x000080,clGreen:0x008000,clOlive:0x008080,clNavy:0x800000,clPurple:0x800080,clTeal:0x808000,clGray:0x808080,
  clSilver:0xC0C0C0,clRed:0x0000FF,clLime:0x00FF00,clYellow:0x00FFFF,clBlue:0xFF0000,clFuchsia:0xFF00FF,clAqua:0xFFFF00,clWhite:0xFFFFFF,
  clMoneyGreen:0xC0DCC0,clSkyBlue:0xF0CAA6,clCream:0xF0FBFF,clMedGray:0xA4A0A0,
  clBtnFace:-2147483633,clWindow:-2147483643,clWindowText:-2147483640,clHighlight:-2147483635,clNone:0x1FFFFFFF};
const SYS={[-2147483633]:'#d4d0c8',[-2147483643]:'#ffffff',[-2147483640]:'#000000',[-2147483635]:'#0a246a'};
const colorCss=c=>{ if(SYS[c]) return SYS[c]; if(c===0x1FFFFFFF) return 'transparent'; c=c>>>0; return '#'+[c&255,(c>>8)&255,(c>>16)&255].map(x=>x.toString(16).padStart(2,'0')).join(''); };
const colorName=c=>{ for(const k in COLORS) if(COLORS[k]===c) return k; return '0x'+((c>>>0).toString(16).toUpperCase().padStart(8,'0')); };
const ENUMS={
  Align:['alNone','alTop','alBottom','alLeft','alRight','alClient'],
  Alignment:['taLeftJustify','taRightJustify','taCenter'],
  BorderStyle:['bsNone','bsSingle','bsSizeable','bsDialog','bsToolWindow','bsSizeToolWin'],
  SBorderStyle:['sbsNone','sbsSingle','sbsSunken'],
  Position:['poDesigned','poDefault','poDefaultPosOnly','poDefaultSizeOnly','poScreenCenter','poDesktopCenter','poMainFormCenter','poOwnerFormCenter'],
  FormStyle:['fsNormal','fsMDIChild','fsMDIForm','fsStayOnTop'],
  ScrollBars:['ssNone','ssHorizontal','ssVertical','ssBoth'],
  Kind:['bkCustom','bkOK','bkCancel','bkHelp','bkYes','bkNo','bkClose','bkAbort','bkRetry','bkIgnore','bkAll'],
  SBKind:['sbHorizontal','sbVertical'],
  State:['cbUnchecked','cbChecked','cbGrayed'],
  Cursor:['crDefault','crArrow','crCross','crIBeam','crHandPoint','crHourGlass'],
  Shape:['stRectangle','stSquare','stRoundRect','stRoundSquare','stEllipse','stCircle'],
  BevelOuter:['bvNone','bvLowered','bvRaised','bvSpace'],
  WindowState:['wsNormal','wsMinimized','wsMaximized'],
};
const ENUMVAL={}; for(const k in ENUMS) ENUMS[k].forEach((n,i)=>{ if(!(n in ENUMVAL)) ENUMVAL[n]=i; });
ENUMVAL.crHandPoint=-21; ENUMVAL.crDefault=0; ENUMVAL.crArrow=-2; ENUMVAL.crCross=-3; ENUMVAL.crIBeam=-4; ENUMVAL.crHourGlass=-11;
const CONSTS=Object.assign({},COLORS,ENUMVAL,{mrNone:0,mrOk:1,mrCancel:2,mrAbort:3,mrRetry:4,mrIgnore:5,mrYes:6,mrNo:7,
  MB_OK:0,MB_OKCANCEL:1,MB_YESNOCANCEL:3,MB_YESNO:4,MB_ICONINFORMATION:64,MB_ICONWARNING:48,MB_ICONQUESTION:32,MB_ICONERROR:16,
  IDOK:1,IDCANCEL:2,IDYES:6,IDNO:7,ssShift:1,ssAlt:2,ssCtrl:4,ssLeft:8,ssRight:16,mbLeft:0,mbRight:1,mbMiddle:2,
  caNone:0,caHide:1,caFree:2,caMinimize:3,VK_RETURN:13,VK_ESCAPE:27,VK_SPACE:32,VK_LEFT:37,VK_UP:38,VK_RIGHT:39,VK_DOWN:40,
  scLineUp:0,scLineDown:1,scPageUp:2,scPageDown:3,scPosition:4,scTrack:5,scTop:6,scBottom:7,scEndScroll:8,
  fdShowHelp:1,ofAllowMultiSelect:512,fsBold:1,fsItalic:2,fsUnderline:4});
const CURSOR_CSS={0:'default',[-2]:'default',[-3]:'crosshair',[-4]:'text',[-21]:'pointer',[-11]:'wait'};

/* ---------------- описание компонентов ---------------- */
const P=(t,def,ex)=>Object.assign({t,def},ex||{});
const S='str', I='int', B='bool', C='color', F='font', E='enum', L='strings', O='obj';
const CTRL={Left:P(I,0),Top:P(I,0),Width:P(I,75),Height:P(I,25),Visible:P(B,true),Enabled:P(B,true),Hint:P(S,''),ShowHint:P(B,false),Tag:P(I,0),Cursor:P(E,0,{en:'Cursor'}),Align:P(E,0,{en:'Align'})};
const EV_STD=['OnClick','OnDblClick','OnMouseDown','OnMouseMove','OnMouseUp'];
const COMP={
  TForm:{props:{Caption:P(S,'Form1'),Width:P(I,400),Height:P(I,300),Left:P(I,200),Top:P(I,120),Color:P(C,COLORS.clBtnFace),Font:P(F),BorderStyle:P(E,2,{en:'BorderStyle'}),
    Position:P(E,0,{en:'Position'}),FormStyle:P(E,0,{en:'FormStyle'}),AlphaBlend:P(B,false),AlphaBlendValue:P(I,255),Visible:P(B,true),Enabled:P(B,true),Hint:P(S,''),ShowHint:P(B,false),Tag:P(I,0),
    AutoSize:P(B,false),ClientWidth:P(I,392),ClientHeight:P(I,273),Cursor:P(E,0,{en:'Cursor'}),PopupMenu:P(O,null),WindowState:P(E,0,{en:'WindowState'})},
    events:['OnCreate','OnShow','OnActivate','OnClick','OnDblClick','OnMouseDown','OnMouseMove','OnMouseUp','OnKeyPress','OnKeyDown','OnResize','OnClose','OnPaint']},
  TLabel:{tab:'Standard',w:32,h:13,props:Object.assign({},CTRL,{Caption:P(S,'$'),AutoSize:P(B,true),Color:P(C,COLORS.clBtnFace),Font:P(F),Transparent:P(B,false),Alignment:P(E,0,{en:'Alignment'}),WordWrap:P(B,false),Width:P(I,32),Height:P(I,13)}),events:EV_STD},
  TEdit:{tab:'Standard',w:121,h:21,props:Object.assign({},CTRL,{Text:P(S,'$'),Color:P(C,COLORS.clWindow),Font:P(F),ReadOnly:P(B,false),MaxLength:P(I,0),Width:P(I,121),Height:P(I,21)}),events:['OnChange','OnClick','OnDblClick','OnEnter','OnExit','OnKeyPress','OnKeyDown','OnMouseMove']},
  TMemo:{tab:'Standard',w:185,h:89,props:Object.assign({},CTRL,{Lines:P(L,'$'),Color:P(C,COLORS.clWindow),Font:P(F),ReadOnly:P(B,false),ScrollBars:P(E,0,{en:'ScrollBars'}),WordWrap:P(B,true),PopupMenu:P(O,null),Width:P(I,185),Height:P(I,89)}),events:['OnChange','OnClick','OnDblClick','OnEnter','OnExit','OnKeyPress','OnMouseMove']},
  TButton:{tab:'Standard',w:75,h:25,props:Object.assign({},CTRL,{Caption:P(S,'$'),Font:P(F),Default:P(B,false),Cancel:P(B,false),ModalResult:P(I,0)}),events:['OnClick','OnEnter','OnExit','OnKeyPress','OnMouseDown','OnMouseMove','OnMouseUp']},
  TCheckBox:{tab:'Standard',w:97,h:17,props:Object.assign({},CTRL,{Caption:P(S,'$'),Checked:P(B,false),State:P(E,0,{en:'State'}),Font:P(F),Color:P(C,COLORS.clBtnFace),Width:P(I,97),Height:P(I,17)}),events:['OnClick','OnEnter','OnExit','OnMouseMove']},
  TRadioButton:{tab:'Standard',w:113,h:17,props:Object.assign({},CTRL,{Caption:P(S,'$'),Checked:P(B,false),Font:P(F),Color:P(C,COLORS.clBtnFace),Width:P(I,113),Height:P(I,17)}),events:['OnClick','OnMouseMove']},
  TListBox:{tab:'Standard',w:121,h:97,props:Object.assign({},CTRL,{Items:P(L,''),ItemIndex:P(I,-1),Sorted:P(B,false),Color:P(C,COLORS.clWindow),Font:P(F),MultiSelect:P(B,false),Width:P(I,121),Height:P(I,97)}),events:['OnClick','OnDblClick','OnMouseMove','OnKeyPress']},
  TComboBox:{tab:'Standard',w:145,h:21,props:Object.assign({},CTRL,{Items:P(L,''),ItemIndex:P(I,-1),Text:P(S,'$'),Color:P(C,COLORS.clWindow),Font:P(F),Width:P(I,145),Height:P(I,21)}),events:['OnChange','OnClick','OnMouseMove']},
  TScrollBar:{tab:'Standard',w:121,h:17,props:Object.assign({},CTRL,{Min:P(I,0),Max:P(I,100),Position:P(I,0),Kind:P(E,0,{en:'SBKind'}),SmallChange:P(I,1),LargeChange:P(I,1),Width:P(I,121),Height:P(I,17)}),events:['OnChange','OnScroll']},
  TGroupBox:{tab:'Standard',w:185,h:105,container:true,props:Object.assign({},CTRL,{Caption:P(S,'$'),Color:P(C,COLORS.clBtnFace),Font:P(F),Width:P(I,185),Height:P(I,105)}),events:['OnClick','OnMouseMove']},
  TRadioGroup:{tab:'Standard',w:185,h:105,props:Object.assign({},CTRL,{Caption:P(S,'$'),Items:P(L,''),ItemIndex:P(I,-1),Columns:P(I,1),Color:P(C,COLORS.clBtnFace),Font:P(F),Width:P(I,185),Height:P(I,105)}),events:['OnClick','OnMouseMove']},
  TPanel:{tab:'Standard',w:185,h:41,container:true,props:Object.assign({},CTRL,{Caption:P(S,'$'),Color:P(C,COLORS.clBtnFace),Font:P(F),BevelOuter:P(E,2,{en:'BevelOuter'}),Width:P(I,185),Height:P(I,41)}),events:['OnClick','OnDblClick','OnMouseMove','OnResize']},
  TMainMenu:{tab:'Standard',nv:true,props:{Items:P('menu',null),Tag:P(I,0)},events:[]},
  TPopupMenu:{tab:'Standard',nv:true,props:{Items:P('menu',null),Tag:P(I,0)},events:[]},
  TBitBtn:{tab:'Additional',w:75,h:25,props:Object.assign({},CTRL,{Caption:P(S,'$'),Kind:P(E,0,{en:'Kind'}),Font:P(F),ModalResult:P(I,0)}),events:['OnClick','OnMouseMove']},
  TStaticText:{tab:'Additional',w:56,h:17,props:Object.assign({},CTRL,{Caption:P(S,'$'),AutoSize:P(B,true),Alignment:P(E,0,{en:'Alignment'}),BorderStyle:P(E,0,{en:'SBorderStyle'}),Color:P(C,COLORS.clBtnFace),Font:P(F),Width:P(I,56),Height:P(I,17)}),events:['OnClick','OnDblClick','OnMouseMove']},
  TShape:{tab:'Additional',w:65,h:65,props:Object.assign({},CTRL,{Shape:P(E,0,{en:'Shape'}),Brush:P(O,null),Width:P(I,65),Height:P(I,65)}),events:['OnMouseDown','OnMouseMove','OnMouseUp']},
  TImage:{tab:'Additional',w:105,h:105,props:Object.assign({},CTRL,{Stretch:P(B,false),Proportional:P(B,false),Center:P(B,false),Picture:P(O,null),Width:P(I,105),Height:P(I,105)}),events:['OnClick','OnMouseMove']},
  TStatusBar:{tab:'Win32',w:0,h:19,props:Object.assign({},CTRL,{Panels:P('panels',null),SimplePanel:P(B,false),SimpleText:P(S,''),Align:P(E,2,{en:'Align'}),Height:P(I,19)}),events:['OnClick']},
  TDateTimePicker:{tab:'Win32',w:186,h:21,props:Object.assign({},CTRL,{DateTime:P('dt',null),Date:P('dt',null),Time:P('dt',null),Width:P(I,186),Height:P(I,21)}),events:['OnChange','OnClick']},
  TTimer:{tab:'System',nv:true,props:{Enabled:P(B,true),Interval:P(I,1000),Tag:P(I,0)},events:['OnTimer']},
  TOpenDialog:{tab:'Dialogs',nv:true,props:{FileName:P(S,''),Filter:P(S,''),Title:P(S,''),Options:P(I,0),Files:P(L,''),Tag:P(I,0)},events:[]},
  TSaveDialog:{tab:'Dialogs',nv:true,props:{FileName:P(S,''),Filter:P(S,''),Title:P(S,''),Options:P(I,0),Tag:P(I,0)},events:[]},
  TFontDialog:{tab:'Dialogs',nv:true,props:{Font:P(F),Options:P(I,0),Tag:P(I,0)},events:[]},
  TColorDialog:{tab:'Dialogs',nv:true,props:{Color:P(C,0),Tag:P(I,0)},events:[]},
};
const TABS=['Standard','Additional','Win32','System','Dialogs'];
const ICON={TLabel:'A',TEdit:'ab|',TMemo:'≡',TButton:'OK',TCheckBox:'☑',TRadioButton:'◉',TListBox:'☰',TComboBox:'▾',TScrollBar:'⇔',TGroupBox:'[xy]',TRadioGroup:'⦿⦿',TPanel:'▭',
  TMainMenu:'☰M',TPopupMenu:'☰P',TBitBtn:'✔Ok',TStaticText:'Ā',TShape:'◯',TImage:'🖼',TStatusBar:'▁▁',TDateTimePicker:'📅',TTimer:'⏱',TOpenDialog:'📂',TSaveDialog:'💾',TFontDialog:'F',TColorDialog:'🎨'};
const EVSIG={OnMouseMove:'TObject *Sender, TShiftState Shift, int X, int Y',OnMouseDown:'TObject *Sender, TMouseButton Button, TShiftState Shift, int X, int Y',
  OnMouseUp:'TObject *Sender, TMouseButton Button, TShiftState Shift, int X, int Y',OnKeyPress:'TObject *Sender, char &Key',OnKeyDown:'TObject *Sender, WORD &Key, TShiftState Shift',
  OnScroll:'TObject *Sender, TScrollCode ScrollCode, int &ScrollPos',OnClose:'TObject *Sender, TCloseAction &Action'};
const sigOf=ev=>EVSIG[ev]||'TObject *Sender';
const VCL_TYPES=new Map(); ['TObject','TPersistent','TComponent','TControl','TWinControl','TForm','TFont','TStrings','TStringList','TDateTime','TShiftState','TMenuItem','TStatusPanels','TStatusPanel','TBrush','TPicture','TApplication','TCanvas',...Object.keys(COMP)].forEach(n=>VCL_TYPES.set(n,true));
CPP.VCL_TYPES=VCL_TYPES; CPP.VCL_BASES=new Set(VCL_TYPES.keys());

/* ---------------- объекты VCL во время выполнения ---------------- */
let uid=0;
function newFont(){ return {vcl:'TFont',id:++uid,p:{Name:'MS Sans Serif',Size:8,Color:COLORS.clWindowText,Style:0}}; }
function newStrings(owner,text){ const o={vcl:'TStrings',id:++uid,items:text?String(text).split('\n'):[],owner}; return o; }
function newMenuItem(name,caption,children){ return {vcl:'TMenuItem',id:++uid,Name:name,p:{Caption:caption,Enabled:true,Visible:true,Checked:false},events:{},items:children||[]}; }
function makeComp(type,name,init){
  const d=COMP[type]; const o={vcl:type,id:++uid,Name:name,p:{},events:{},parent:null};
  for(const k in d.props){ const pd=d.props[k];
    if(pd.t===F) o.p[k]=newFont(); else if(pd.t===L) o.p[k]=newStrings(o,pd.def==='$'?name:''); else if(pd.t==='menu') o.p[k]=newMenuItem(name+'Items','',[]);
    else if(pd.t==='panels') o.p[k]={vcl:'TStatusPanels',id:++uid,items:[]}; else if(pd.t==='dt') o.p[k]=null;
    else if(pd.t===O) o.p[k]=k==='Brush'?{vcl:'TBrush',id:++uid,p:{Color:COLORS.clWhite}}:k==='Picture'?{vcl:'TPicture',id:++uid,file:''}:null;
    else o.p[k]=pd.def==='$'?name:pd.def; }
  if(type==='TForm') o.p.Font.p.Color=COLORS.clWindowText;
  if(init) applyInit(o,init);
  return o;
}
function applyInit(o,init){
  for(const k in init){
    if(k==='type'||k==='Name'||k==='parent') continue;
    if(k==='events'){ Object.assign(o.events,init.events); continue; }
    const v=init[k];
    if(k==='Lines'||k==='Items'&&o.p.Items&&o.p.Items.vcl==='TStrings'){ o.p[k].items=Array.isArray(v)?v.slice():String(v).split('\n'); continue; }
    if(k==='Items'&&o.p.Items&&o.p.Items.vcl==='TMenuItem'){ o.p.Items.items=(v||[]).map(mkMenu); continue; }
    if(k==='Panels'){ o.p.Panels.items=(v||[]).map(t=>({vcl:'TStatusPanel',id:++uid,p:{Text:t,Width:120}})); continue; }
    if(k==='Font'){ Object.assign(o.p.Font.p,v); continue; }
    if(k==='Brush'){ Object.assign(o.p.Brush.p,v); continue; }
    if(typeof v==='string'&&v in CONSTS&&k!=='Caption'&&k!=='Text'&&k!=='Hint') o.p[k]=CONSTS[v]; else o.p[k]=v;
  }
}
function mkMenu(m){ const it=newMenuItem(m.Name,m.Caption,(m.items||[]).map(mkMenu)); if(m.OnClick) it.events.OnClick=m.OnClick; return it; }
function cloneDate(d){ return {vcl:'TDateTime',id:++uid,d:new Date(d.d.getTime()),clone(){ return cloneDate(this); }}; }
function mkDate(dt){ return {vcl:'TDateTime',id:++uid,d:dt,clone(){ return cloneDate(this); }}; }
const pad=n=>String(n).padStart(2,'0');
const timeStr=d=>`${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const dateStr=d=>`${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;

/* ---------------- проект: компоненты + код ---------------- */
const SEPL='//---------------------------------------------------------------------------';
const unitHead=(un,fn,cls)=>`${SEPL}

#include <vcl.h>
#pragma hdrstop

#include "${un}.h"
${SEPL}
#pragma package(smart_init)
#pragma resource "*.dfm"
${cls} *${fn};
${SEPL}
__fastcall ${cls}::${cls}(TComponent* Owner)
        : TForm(Owner)
{
}
${SEPL}
`;
function handlerSkeleton(name,ev,cls){ return `void __fastcall ${cls||'TForm1'}::${name}(${sigOf(ev)})\n{\n\n}\n${SEPL}\n`; }
function buildUnit(code,un,fn,cls){ return unitHead(un||'Unit1',fn||'Form1',cls||'TForm1')+(code?String(code).replace(/^\n+/,'').replace(/\s*$/,'\n'):''); }
const noComments=s=>String(s||'').replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,'');

class Project{
  constructor(cfg){ this.load(cfg||{}); }
  load(cfg){
    // имя формы/модуля: Form1/Unit1 по умолчанию; в среде C++Builder (bcb-ide.js) форм может быть несколько
    this.fn=cfg.formName||'Form1'; this.un=cfg.unitName||'Unit1'; this.cls='T'+this.fn;
    this.hUser=Object.assign({priv:'',pub:''},cfg.hUser||{});
    this.form=makeComp("TForm",this.fn,cfg.form||{}); this.form._proj=this;
    if(!cfg.form||cfg.form.ClientWidth==null){ this.form.p.ClientWidth=this.form.p.Width-8; this.form.p.ClientHeight=this.form.p.Height-31; }
    this.comps=[];
    for(const c of (cfg.comps||[])){ const o=makeComp(c.type,c.Name,c); o.parent=c.parent||null; o._proj=this; this.comps.push(o); }
    this.code=cfg.unit||buildUnit(cfg.code||'',this.un,this.fn,this.cls);
  }
  find(name){ if(name===this.fn) return this.form; return this.comps.find(c=>c.Name===name)||null; }
  nextName(type){ const base=type.slice(1); let k=1; while(this.find(base+k)) k++; return base+k; }
  add(type,x,y,parent){
    const d=COMP[type]; const name=this.nextName(type);
    const o=makeComp(type,name,{}); o.parent=parent||null; o._proj=this;
    if(!d.nv){ o.p.Left=x; o.p.Top=y; if(type==='TStatusBar'){ o.p.Width=this.form.p.ClientWidth; } }
    else { o.p.Left=x; o.p.Top=y; }
    if(type==='TLabel'||type==='TStaticText') o.p.Width=Math.max(20,o.p.Caption.length*6);
    this.comps.push(o); return o;
  }
  remove(o){ this.comps=this.comps.filter(c=>c!==o&&c.parent!==o.Name); }
  handlers(){ const r=[]; const re=new RegExp('void\\s+__fastcall\\s+'+this.cls+'::(\\w+)\\s*\\(([^)]*)\\)','g'); let m; while((m=re.exec(this.code))) r.push({name:m[1],sig:m[2]}); return r; }
  // все события, привязанные к обработчикам (из Object Inspector)
  ensureHandler(comp,ev){
    const name=(comp.vcl==='TForm'?'Form':comp.Name)+ev.slice(2);
    if(!this.handlers().some(h=>h.name===name)) this.code=this.code.replace(/\s*$/,'\n')+handlerSkeleton(name,ev,this.cls);
    comp.events[ev]=name; return name;
  }
  header(){
    const hs=this.handlers();
    let h=`class ${this.cls} : public TForm\n{\n__published:\n`;
    for(const c of this.comps) h+=`  ${c.vcl} *${c.Name};\n`;
    for(const x of hs) if(x.name!=='FormCtor__') h+=`  void __fastcall ${x.name}(${x.sig});\n`;
    h+='private:\n'+noComments(this.hUser.priv)+'\npublic:\n'+noComments(this.hUser.pub)+`\n  void __fastcall FormCtor__(TObject *Sender);\n};\nextern ${this.cls} *${this.fn};\n`;
    return h;
  }
  // Unit1.h как в C++Builder (секции private/public — то, что пишет пользователь)
  unitH(){
    const G=this.un+'H', hs=this.handlers();
    let h=`${SEPL}\n\n#ifndef ${G}\n#define ${G}\n${SEPL}\n#include <Classes.hpp>\n#include <Controls.hpp>\n#include <StdCtrls.hpp>\n#include <Forms.hpp>\n${SEPL}\nclass ${this.cls} : public TForm\n{\n__published:\t// IDE-managed Components\n`;
    for(const c of this.comps) h+=`        ${c.vcl} *${c.Name};\n`;
    for(const x of hs) h+=`        void __fastcall ${x.name}(${x.sig});\n`;
    const ind=s=>String(s||'').replace(/^\n+|\s+$/g,'');
    h+=`private:\t// User declarations\n${ind(this.hUser.priv)?ind(this.hUser.priv)+'\n':''}public:\t\t// User declarations\n        __fastcall ${this.cls}(TComponent* Owner);\n${ind(this.hUser.pub)?ind(this.hUser.pub)+'\n':''}};\n${SEPL}\nextern PACKAGE ${this.cls} *${this.fn};\n${SEPL}\n#endif\n`;
    return h;
  }
  // разобрать отредактированный Unit1.h: забрать то, что пользователь написал в private / public
  parseUnitH(t){
    const m=String(t).match(/\bprivate\s*:[^\n]*\n([\s\S]*?)\n\s*public\s*:[^\n]*\n([\s\S]*?)\n\s*\}\s*;/);
    if(!m) return false;
    const ctor=new RegExp('^\\s*__fastcall\\s+'+this.cls+'\\s*\\([^)]*\\)\\s*;\\s*$','m');
    this.hUser={priv:m[1].replace(/\s+$/,''),pub:m[2].replace(ctor,'').replace(/^\n+|\s+$/g,'')}; return true;
  }
  ctorRe(){ return new RegExp('__fastcall\\s+'+this.cls+'::'+this.cls+'\\s*\\(\\s*TComponent\\s*\\*\\s*\\w+\\s*\\)\\s*:\\s*TForm\\s*\\(\\s*\\w+\\s*\\)'); }
  source(){ // текст, который реально выполняется (Unit1.h подставлен)
    let s=this.code;
    s=s.replace(new RegExp('#include\\s*"'+this.un+'\\.h"'),()=>this.header().replace(/\n/g,' '));   // заголовок в одну строку — номера строк в Unit1.cpp не сдвигаются
    s=s.replace(this.ctorRe(),m=>`void __fastcall ${this.cls}::FormCtor__(TObject *Sender)`+'\n'.repeat((m.match(/\n/g)||[]).length));   // число строк не меняется
    return s;
  }
  toJSON(){ const r={form:snap(this.form),comps:this.comps.map(c=>Object.assign(snap(c),{type:c.vcl,Name:c.Name,parent:c.parent})),unit:this.code};
    if(this.fn!=='Form1'||this.un!=='Unit1'){ r.formName=this.fn; r.unitName=this.un; }
    if(this.hUser.priv||this.hUser.pub) r.hUser=Object.assign({},this.hUser);
    return r; }
}
function snap(o){ const r={}; for(const k in o.p){ const v=o.p[k]; if(v&&v.vcl==='TFont') r.Font=Object.assign({},v.p); else if(v&&v.vcl==='TStrings') r[k]=v.items.slice(); else if(v&&v.vcl==='TMenuItem') r.Items=v.items.map(menuSnap); else if(v&&v.vcl==='TStatusPanels') r.Panels=v.items.map(p=>p.p.Text); else if(v&&v.vcl==='TBrush') r.Brush=Object.assign({},v.p); else if(v&&typeof v==='object') {} else r[k]=v; } r.events=Object.assign({},o.events); return r; }
function menuSnap(m){ return {Name:m.Name,Caption:m.p.Caption,OnClick:m.events.OnClick,items:m.items.map(menuSnap)}; }

/* ---------------- связь с интерпретатором ---------------- */
class Runtime{
  constructor(proj,ui){ this.proj=proj; this.ui=ui; this.projs=ui.projects||[proj]; this.cells=new Map(); this.fs=ui.fs||new Map(); this.answers=[]; this.ai=0; this.app={vcl:'TApplication',id:-1,p:{Title:'Project1',ShowMainForm:true}}; }
  ptrOf(o){ if(!o) return null; let c=this.cells.get(o); if(!c){ c={v:o,t:T.cls(o.vcl)}; this.cells.set(o,c); } return {arr:[c],i:0,base:c,es:4,obj:o}; }
  pval(o){ return {t:T.ptr(T.cls(o?o.vcl:'TObject')),v:this.ptrOf(o)}; }
  findAny(n){ for(const p of this.projs){ const c=p.find(n); if(c) return c; } return null; }
  projOf(o){ return (o&&o._proj)||this.proj; }
  formOf(o){ return (o&&o._form)||(o&&o.vcl==='TForm'?o:o&&o._proj?o._proj.form:null)||this.form; }
  compile(){
    // ui.source — общий текст всех модулей проекта (среда C++Builder с несколькими формами)
    const prog=CPP.parse(this.ui.source||this.proj.source());
    const it=new CPP.Interp(prog,{vcl:this});
    it.prepare();
    this.it=it; this.form=this.proj.form;
    for(const p of this.projs){
      const g=it.globalScope.vars.get(p.fn); if(g&&(!this.ui.isCreated||this.ui.isCreated(p))) g.cell.v=this.ptrOf(p.form);
      const f=p.form; f.cls=it.classes.get(p.cls); f.f=f.f||Object.create(null);
      // поля, которые пользователь объявил в private/public своего класса формы
      if(f.cls) for(const fd of it.allFields(f.cls)){ if(f.f[fd.name]) continue; const fc=it.makeCell(fd.t,0); fc.name=fd.name; f.f[fd.name]=fc; if(fc.v&&fc.v.cls){ try{ it.construct(fc.v,[],0); }catch(e){} } }
    }
    return it;
  }
  // --- хуки, которые вызывает интерпретатор ---
  hasClass(n){ return VCL_TYPES.has(n); }
  knows(n){ return n in CONSTS||n==='Application'||n==='Sender'||!!this.findAny(n)||['Now','Date','Time','RGB','InputBox','MessageDlg','Random','Randomize','__classid','Screen'].includes(n); }
  knowsMember(n){ return !!this.findAny(n)||n in COMP.TForm.props||['Close','Show','Hide','ShowModal','Repaint','Refresh','SetFocus','Canvas','ModalResult','ComponentCount','Components','Release','Free','BringToFront'].includes(n); }
  newObj(n){ if(n==='TDateTime') return mkDate(new Date(1899,11,30)); if(n==='TStringList') return newStrings(null,''); return {vcl:n,id:++uid,p:{}}; }
  ident(n,line){
    if(n in CONSTS) return {t:Ty().tInt,v:CONSTS[n]};
    if(n==='Application') return this.pval(this.app);
    if(n==='Screen') return this.pval({vcl:'TScreen',id:-2,p:{}});
    const c=this.findAny(n); if(c) return this.pval(c);
    return null;
  }
  scope(cls,name,line){ return null; }
  call(n,argsAst,sc,line,it){
    const ev=()=>it.evArgs(argsAst,sc,true);
    switch(n){
      case '__classid': { const a=argsAst[0]; const nm=a&&(a.name||(a.t&&a.t.name)); return {t:T.ptr(T.cls('TObject')),v:{vcl:'classid',name:nm}}; }
      case 'Now': return {t:T.cls('TDateTime'),v:mkDate(this.now())};
      case 'Date': { const d=this.now(); d.setHours(0,0,0,0); return {t:T.cls('TDateTime'),v:mkDate(d)}; }
      case 'Time': return {t:T.cls('TDateTime'),v:mkDate(this.now())};
      case 'RGB': { const a=ev(); return {t:Ty().tInt,v:(a[0].v&255)|((a[1].v&255)<<8)|((a[2].v&255)<<16)}; }
      case 'InputBox': { const a=ev(); const ans=this.ask('input',{caption:it.toJsStr(a[0],line),prompt:it.toJsStr(a[1],line),def:it.toJsStr(a[2],line)}); return {t:T.str(true),v:ans}; }
      case 'MessageDlg': { const a=ev(); const ans=this.ask('confirm',{text:it.toJsStr(a[0],line)}); return {t:Ty().tInt,v:ans?6:7}; }
    }
    return null;
  }
  now(){ return this.ui.clock?new Date(this.ui.clock()):new Date(); }
  showMessage(s){ this.ui.message(s); }
  // диалоги во время обработчика: ответы подаются «повтором» обработчика
  ask(kind,data){ if(this.ai<this.answers.length){ const a=this.answers[this.ai++]; if(a&&a.__ans){ if(a.restore) a.restore(); return a.v; } return a; } const e=new Error('ask'); e.vclAsk={kind,data}; throw e; }
  propType(o,k){
    const d=(COMP[o.vcl]||{}).props||{}; const pd=d[k];
    if(!pd) return null;
    switch(pd.t){ case S: return T.str(true); case I: case E: case C: return Ty().tInt; case B: return Ty().tBool;
      case F: return T.ptr(T.cls('TFont')); case L: return T.ptr(T.cls('TStrings')); case 'menu': return T.ptr(T.cls('TMenuItem')); case 'panels': return T.ptr(T.cls('TStatusPanels'));
      case 'dt': return T.cls('TDateTime'); case O: return T.ptr(T.cls(k==='Brush'?'TBrush':k==='Picture'?'TPicture':'TObject')); }
    return Ty().tInt;
  }
  lv(t,get,set){ return {t,cell:{get v(){ return get(); },set v(x){ set(x); }},lv:true,prop:true}; }
  member(o,n,line,quiet){
    const self=this, it=this.it;
    const ro=(t,get)=>this.lv(t,get,()=>{ throw cerr(`Свойство ${n} только для чтения`,line,'E2xxx'); });
    const meth=(fn)=>({t:Ty().tVoid,vclMethod:{o,n,fn},v:0});
    switch(o.vcl){
      case 'TFont': if(n in o.p) return this.lv(n==='Name'?T.str(true):Ty().tInt,()=>o.p[n],v=>{ o.p[n]=v; self.changed(); }); break;
      case 'TBrush': if(n==='Color') return this.lv(Ty().tInt,()=>o.p.Color,v=>{ o.p.Color=v; self.changed(); }); break;
      case 'TPicture': if(n==='LoadFromFile') return meth(a=>{ o.file=it.toJsStr(a[0],line); self.changed(); }); break;
      case 'TStrings': {
        if(n==='Count') return ro(Ty().tInt,()=>o.items.length);
        if(n==='Text') return this.lv(T.str(true),()=>o.items.join('\r\n')+(o.items.length?'\r\n':''),v=>{ o.items=String(v).replace(/\r?\n$/,'').split(/\r?\n/); if(v==='') o.items=[]; self.changed(o); });
        if(n==='Strings') return {t:Ty().tVoid,v:{vcl:'idx',index:(i,l)=>{ if(i<0||i>=o.items.length) throw rerr(`List index out of bounds (${i}) — в списке ${o.items.length} строк (EStringListError)`,l); return self.lv(T.str(true),()=>o.items[i],v=>{ o.items[i]=String(v); self.changed(o); }); }}};
        const m={Add:a=>{ o.items.push(it.toJsStr(a[0],line)); self.changed(o); return {t:Ty().tInt,v:o.items.length-1}; },
          Clear:()=>{ o.items=[]; self.changed(o); }, Delete:a=>{ o.items.splice(a[0].v,1); self.changed(o); },
          Insert:a=>{ o.items.splice(a[0].v,0,it.toJsStr(a[1],line)); self.changed(o); }, IndexOf:a=>({t:Ty().tInt,v:o.items.indexOf(it.toJsStr(a[0],line))}),
          LoadFromFile:a=>{ const f=it.toJsStr(a[0],line); if(!self.fs.has(f)) throw rerr(`Cannot open file "${f}" (EFOpenError)`,line); o.items=self.fs.get(f).replace(/\r?\n$/,'').split(/\r?\n/); self.changed(o); },
          SaveToFile:a=>{ self.fs.set(it.toJsStr(a[0],line),o.items.join('\r\n')+'\r\n'); self.ui.files&&self.ui.files(); }};
        if(m[n]) return meth(m[n]); break; }
      case 'TStatusPanels': if(n==='Items') return {t:Ty().tVoid,v:{vcl:'idx',index:(i,l)=>{ if(!o.items[i]) throw rerr(`List index out of bounds (${i})`,l); return {t:T.ptr(T.cls('TStatusPanel')),v:self.ptrOf(o.items[i])}; }}};
        if(n==='Count') return ro(Ty().tInt,()=>o.items.length);
        if(n==='Add') return meth(()=>{ const p={vcl:'TStatusPanel',id:++uid,p:{Text:'',Width:120}}; o.items.push(p); self.changed(); return {t:T.ptr(T.cls('TStatusPanel')),v:self.ptrOf(p)}; }); break;
      case 'TStatusPanel': if(n==='Text'||n==='Width') return this.lv(n==='Text'?T.str(true):Ty().tInt,()=>o.p[n],v=>{ o.p[n]=v; self.changed(); }); break;
      case 'TMenuItem': if(n in o.p) return this.lv(n==='Caption'?T.str(true):Ty().tBool,()=>o.p[n],v=>{ o.p[n]=v; self.changed(); }); if(n==='Click') return meth(()=>self.fire(o,'OnClick')); break;
      case 'TDateTime': { const d=o.d; const s=x=>({t:T.str(true),v:x});
        const m={TimeString:()=>s(timeStr(d)),DateString:()=>s(dateStr(d)),DateTimeString:()=>s(dateStr(d)+' '+timeStr(d)),FormatString:a=>s(fmtDate(it.toJsStr(a[0],line),d))};
        if(m[n]) return meth(m[n]); break; }
      case 'TApplication': if(n==='Terminate') return meth(()=>self.ui.close()); if(n==='Title') return this.lv(T.str(true),()=>o.p.Title||'Project1',v=>{ o.p.Title=String(v); });
        if(n==='Initialize'||n==='Run'||n==='Minimize'||n==='Restore') return meth(()=>{});
        if(n==='ShowMainForm') return this.lv(Ty().tBool,()=>o.p.ShowMainForm?1:0,v=>{ o.p.ShowMainForm=!!v; });
        if(n==='MainForm') return ro(T.ptr(T.cls('TForm')),()=>this.ptrOf(this.ui.mainForm?this.ui.mainForm():this.form));
        if(n==='CreateForm') return meth(a=>{ const cid=a[0].v, dst=a[1]&&a[1].v; const p=cid&&this.projs.find(x=>x.cls===cid.name);
          if(!p) throw rerr(`CreateForm: класс формы ${cid&&cid.name} не найден в проекте`,line);
          if(!dst||!dst.arr) throw rerr('CreateForm: второй параметр — адрес переменной формы, например &Form2',line);
          dst.arr[dst.i].v=this.ptrOf(p.form); if(this.ui.createForm) this.ui.createForm(p); });
        if(n==='MessageBox') return meth(a=>{ const ans=self.ask('confirm',{text:it.toJsStr(a[0],line),caption:a[1]?it.toJsStr(a[1],line):'',flags:a[2]?a[2].v:0}); return {t:Ty().tInt,v:ans}; });
        if(n==='ProcessMessages') return meth(()=>{}); break;
      case 'TShiftState': if(n==='Contains') return meth(a=>({t:Ty().tBool,v:(o.v&(a[0].v))?1:0})); break;
    }
    if(o.vcl==='TForm'&&n!=='Font'){ const P=this.projOf(o); const c=P.find(n); if(c&&c!==o) return {t:T.ptr(T.cls(c.vcl)),v:this.ptrOf(c)};
      if(!c&&!(n in COMP.TForm.props)&&this.projs.length>1&&this.findAny(n)&&!quiet) throw cerr(`На форме ${P.fn} нет компонента ${n} (он есть на другой форме)`,line,'E2316');
      if(n==='ModalResult') return this.lv(Ty().tInt,()=>o.modalResult||0,v=>{ o.modalResult=v; if(v&&this.ui.modalResult) this.ui.modalResult(o,v); });
      if(n==='ComponentCount') return ro(Ty().tInt,()=>P.comps.length);
      if(n==='Components') return {t:Ty().tVoid,v:{vcl:'idx',index:(i,l)=>{ const x=P.comps[i]; if(!x) throw rerr(`List index out of bounds (${i}) — компонентов ${P.comps.length}`,l); return {t:T.ptr(T.cls('TComponent')),v:self.ptrOf(x)}; }}};
      if(n==='Active') return ro(Ty().tBool,()=>this.ui.activeForm&&this.ui.activeForm()===o?1:0); }
    const d=COMP[o.vcl];
    if(d){
      if(n==='Name') return ro(T.str(true),()=>o.Name);
      if(n in o.p){
        const t=this.propType(o,n);
        if(t.k==='ptr'){ return this.lv(t,()=>this.ptrOf(o.p[n]),v=>{ const src=v&&v.arr[v.i].v; if(n==='Font'&&src&&src.vcl==='TFont'){ Object.assign(o.p.Font.p,src.p); self.changed(); } else if(n==='PopupMenu'){ o.p[n]=src; } else throw cerr(`Свойству ${n} так присвоить нельзя`,line); }); }
        if(t.k==='cls') return this.lv(t,()=>o.p[n]||mkDate(self.now()),v=>{ o.p[n]=v; self.changed(o); });
        return this.lv(t,()=>{ if(n==='Checked'&&o.vcl==='TCheckBox') return o.p.Checked?1:0; return o.p[n]; },v=>self.setProp(o,n,v,line));
      }
      const m=this.compMethod(o,n,line);
      if(m) return meth(m);
    }
    if(quiet) return null;
    throw cerr(`У ${o.vcl} (${o.Name||''}) нет свойства или метода «${n}»`,line,'E2316');
  }
  setProp(o,n,v,line){
    if(n==='Checked'&&o.vcl==='TCheckBox'){ o.p.Checked=!!v; o.p.State=v?1:0; this.changed(o); this.fire(o,'OnClick'); return; }
    if(n==='State'&&o.vcl==='TCheckBox'){ o.p.State=v; o.p.Checked=v===1; this.changed(o); this.fire(o,'OnClick'); return; }
    if(n==='Checked'&&o.vcl==='TRadioButton'){ o.p.Checked=!!v; if(v) this.projOf(o).comps.forEach(c=>{ if(c!==o&&c.vcl==='TRadioButton'&&c.parent===o.parent) c.p.Checked=false; }); this.changed(o); return; }
    if(n==='Text'&&(o.vcl==='TEdit'||o.vcl==='TComboBox')){ const old=o.p.Text; o.p.Text=String(v); this.changed(o); if(old!==o.p.Text) this.fire(o,'OnChange'); return; }
    if(n==='Position'&&o.vcl==='TScrollBar'){ v=Math.max(o.p.Min,Math.min(o.p.Max,v)); const old=o.p.Position; o.p.Position=v; this.changed(o); if(old!==v) this.fire(o,'OnChange'); return; }
    if(n==='Enabled'&&o.vcl==='TTimer'){ o.p.Enabled=!!v; this.ui.timers&&this.ui.timers(); return; }
    if(n==='Interval'&&o.vcl==='TTimer'){ o.p.Interval=v; this.ui.timers&&this.ui.timers(); return; }
    if(n==='Visible'&&o.vcl==='TForm'){ if(this.ui.formShow){ if(v) this.ui.formShow(o); else this.ui.formHide(o); return; } o.p.Visible=!!v; this.changed(o); return; }
    if(n==='ItemIndex'&&o.p.Items&&o.p.Items.vcl==='TStrings'){ if(v<-1||v>=o.p.Items.items.length) throw rerr(`List index out of bounds (${v})`,line); o.p.ItemIndex=v; if(o.vcl==='TComboBox') o.p.Text=v>=0?o.p.Items.items[v]:''; this.changed(o); return; }
    if(n==='Caption'&&(o.vcl==='TLabel'||o.vcl==='TStaticText')&&o.p.AutoSize){ o.p.Caption=String(v); this.changed(o); return; }
    o.p[n]=typeof o.p[n]==='boolean'?!!v:v;
    this.changed(o);
  }
  compMethod(o,n,line){
    const self=this;
    const ret=(t,v)=>({t,v});
    const U=this.ui;
    if(o.vcl==='TForm'&&U.formShow) switch(n){   // несколько форм: окнами управляет среда
      case 'Show': return ()=>{ U.formShow(o); };
      case 'Hide': return ()=>{ U.formHide(o); };
      case 'ShowModal': return ()=>{ if(U.isShowing&&U.isShowing(o)) throw rerr('Cannot make a visible window modal — форма уже показана (EInvalidOperation)',line); return ret(Ty().tInt,self.ask('modal',{form:o})); };
      case 'Close': return ()=>{ U.formClose(o); };
      case 'Release': case 'Free': return ()=>{ U.formHide(o); };
    }
    switch(n){
      case 'Show': return ()=>{ if(o.vcl==='TForm') { o.p.Visible=true; self.changed(o); } else { o.p.Visible=true; self.changed(o); } };
      case 'Hide': return ()=>{ o.p.Visible=false; self.changed(o); };
      case 'ShowModal': return ()=>{ o.p.Visible=true; self.changed(o); return ret(Ty().tInt,1); };
      case 'Close': return ()=>{ if(o.vcl==='TForm') self.ui.close(); };
      case 'SetFocus': return ()=>{ self.ui.focus&&self.ui.focus(o); };
      case 'Clear': if(o.vcl==='TMemo'||o.vcl==='TListBox') return ()=>{ (o.p.Lines||o.p.Items).items=[]; if(o.p.ItemIndex!=null) o.p.ItemIndex=-1; self.changed(o); self.fire(o,'OnChange'); };
        if(o.vcl==='TEdit') return ()=>{ self.setProp(o,'Text','',line); }; break;
      case 'Repaint': case 'Refresh': case 'Update': case 'Invalidate': return ()=>{ self.changed(o); };
      case 'Execute': if(o.vcl==='TOpenDialog'||o.vcl==='TSaveDialog'||o.vcl==='TFontDialog'||o.vcl==='TColorDialog') return ()=>{
          const ans=self.ask(o.vcl,{comp:o}); if(!ans) return ret(Ty().tBool,0);
          if(o.vcl==='TFontDialog') Object.assign(o.p.Font.p,ans); else if(o.vcl==='TColorDialog') o.p.Color=ans; else { o.p.FileName=ans.name||ans; if(o.p.Files) o.p.Files.items=ans.files||[o.p.FileName]; }
          return ret(Ty().tBool,1); }; break;
      case 'SelectAll': case 'CopyToClipboard': case 'CutToClipboard': case 'PasteFromClipboard': return ()=>{ self.ui.clip&&self.ui.clip(o,n); };
      case 'Click': return ()=>self.fire(o,'OnClick');
      case 'BringToFront': case 'SendToBack': return ()=>{};
    }
    return null;
  }
  changed(o){ this.dirty=true; }
  // вызов обработчика события
  fire(o,ev,extra){
    const name=o.events&&o.events[ev]; if(!name) return false;
    if(this.firing>20) return false;
    const fo=this.formOf(o);
    const ci=fo.cls; const m=ci&&ci.methods.get(name);
    if(!m||!m[0].body) throw rerr(`Обработчик ${name} указан в Events, но его нет в ${this.projOf(fo).un}.cpp`,0);
    const f=m[0]; const it=this.it;
    const args=[{t:T.ptr(T.cls('TObject')),v:this.ptrOf(o)}];
    const ps=f.params;
    for(let k=1;k<ps.length;k++){
      const pt=ps[k].t; const pname=(ps[k].name||'').toLowerCase();
      if(pt.k==='cls'&&pt.name==='TShiftState') args.push({t:pt,v:{vcl:'TShiftState',v:extra&&extra.shift||0}});
      else if(extra&&pname in extra){ let v=extra[pname]; if(typeof v==='number') v={t:Ty().tInt,v};
        if(pt.k==='ref'){ const c={v:v.v,t:pt.to}; if(typeof extra[pname]==='object') extra[pname].cell=c; args.push({t:pt.to,cell:c,lv:true}); } else args.push(v); }
      else if(pt.k==='ref'){ const c={v:0,t:pt.to}; args.push({t:pt.to,cell:c,lv:true}); }
      else args.push({t:Ty().tInt,v:extra&&extra[pname]!=null?extra[pname]:0});
    }
    this.firing=(this.firing||0)+1;
    try{ it.steps=0; it.callFunc(f,args,this.ptrOf(fo),f.line); }
    finally{ this.firing--; }
    return true;
  }
}
function fmtDate(f,d){ return f.replace(/yyyy/g,d.getFullYear()).replace(/mm/g,pad(d.getMonth()+1)).replace(/dd/g,pad(d.getDate())).replace(/hh/g,pad(d.getHours())).replace(/nn/g,pad(d.getMinutes())).replace(/ss/g,pad(d.getSeconds())); }
CPP.VCL={COMP,COLORS,CONSTS,ENUMS,TABS,ICON,Project,Runtime,colorCss,colorName,sigOf,makeComp,buildUnit,handlerSkeleton,CURSOR_CSS,unitHead,SEPL,noComments};
})(typeof window!=='undefined'?window:globalThis);
CPP.VCL.Runtime.prototype.callMethod=function(fx,args,line,it){ const r=fx.vclMethod.fn(args.map(a=>it.rv(a)),line); return r||{t:CPP.types.tVoid,v:0}; };
