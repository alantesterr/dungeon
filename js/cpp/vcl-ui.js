/* Интерфейс эмулятора C++Builder 6: палитра, дизайнер формы, Object Inspector, Unit1.cpp, запуск (F9), автопроверка, обучалка. */
(function(G){
'use strict';
const CPP=G.CPP, V=CPP.VCL;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={ get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} } };
const fontCss=f=>{ const p=f.p; return `font-family:${p.Name==='MS Sans Serif'?"Tahoma,'MS Sans Serif',Arial,sans-serif":"'"+p.Name+"',Tahoma,sans-serif"};font-size:${Math.round(p.Size*4/3)}px;color:${V.colorCss(p.Color)};${p.Style&1?'font-weight:bold;':''}${p.Style&2?'font-style:italic;':''}${p.Style&4?'text-decoration:underline;':''}`; };
const KIND_CAP={1:'OK',2:'Cancel',3:'&Help',4:'&Yes',5:'&No',6:'&Close',7:'Abort',8:'&Retry',9:'&Ignore',10:'&All'};
const KIND_GLYPH={1:'✔',2:'✖',3:'?',4:'✔',5:'⊘',6:'🚪',7:'✖',8:'↻',9:'→',10:'✔✔'};
const amp=s=>esc(String(s)).replace(/&amp;(.)/,'<u>$1</u>');

/* ---------- отрисовка компонента (общая для дизайнера и запуска) ---------- */
function compHTML(o,mode,kids){
  const p=o.p, d=V.COMP[o.vcl];
  if(d.nv) return mode==='design'?`<div class="vc nv" data-n="${o.Name}" style="left:${p.Left||8}px;top:${p.Top||8}px" title="${o.vcl} ${o.Name}">${V.ICON[o.vcl]||'?'}</div>`:'';
  const A=o._a||{L:p.Left,T:p.Top,W:p.Width,H:p.Height};
  const pos=`left:${A.L}px;top:${A.T}px;width:${A.W}px;height:${A.H}px;`;
  const vis=(!p.Visible&&mode==='run')?'display:none;':'';
  const dis=p.Enabled===false?' dis':'';
  const font=p.Font?fontCss(p.Font):'';
  const cur=mode==='run'&&p.Cursor?`cursor:${V.CURSOR_CSS[p.Cursor]||'default'};`:'';
  const base=`class="vc v-${o.vcl}${dis}" data-n="${o.Name}" style="${pos}${vis}${cur}`;
  const ttl=mode==='run'&&p.ShowHint&&p.Hint?` title="${esc(p.Hint)}"`:'';
  const al=['left','right','center'][p.Alignment||0];
  switch(o.vcl){
    case 'TLabel': return `<div ${base}${font}background:${p.Transparent?'transparent':V.colorCss(p.Color)};text-align:${al};${p.AutoSize?'width:auto;height:auto;white-space:pre;':''}${p.WordWrap?'white-space:pre-wrap;':''}"${ttl}>${amp(p.Caption)}</div>`;
    case 'TStaticText': return `<div ${base}${font}background:${V.colorCss(p.Color)};text-align:${al};${p.AutoSize?'width:auto;height:auto;white-space:pre;':''}${p.BorderStyle===2?'border:1px solid;border-color:#808080 #fff #fff #808080;':p.BorderStyle===1?'border:1px solid #000;':''}"${ttl}>${amp(p.Caption)}</div>`;
    case 'TButton': return `<button ${base}${font}"${ttl}${p.Enabled===false?' disabled':''} tabindex="${mode==='run'?0:-1}">${amp(p.Caption)}</button>`;
    case 'TBitBtn': { const cap=p.Kind&&p.Caption===o.Name?KIND_CAP[p.Kind]:p.Caption; return `<button ${base}${font}"${ttl}${p.Enabled===false?' disabled':''} tabindex="${mode==='run'?0:-1}"><span class="gl">${KIND_GLYPH[p.Kind]||''}</span> ${amp(cap)}</button>`; }
    case 'TEdit': return `<input ${base}${font}background:${V.colorCss(p.Color)}" value="${esc(p.Text)}"${mode==='design'||p.ReadOnly?' readonly':''}${p.Enabled===false?' disabled':''}${ttl} tabindex="${mode==='run'?0:-1}">`;
    case 'TMemo': return `<textarea ${base}${font}background:${V.colorCss(p.Color)};overflow:${p.ScrollBars===3?'scroll':p.ScrollBars===2?'hidden scroll':p.ScrollBars===1?'scroll hidden':'hidden'};white-space:${p.WordWrap?'pre-wrap':'pre'}"${mode==='design'||p.ReadOnly?' readonly':''}${p.Enabled===false?' disabled':''}${ttl} tabindex="${mode==='run'?0:-1}">${esc(p.Lines.items.join('\n'))}</textarea>`;
    case 'TCheckBox': return `<label ${base}${font}background:${V.colorCss(p.Color)}"${ttl}><input type="checkbox"${p.Checked?' checked':''}${p.Enabled===false?' disabled':''} tabindex="${mode==='run'?0:-1}"> ${amp(p.Caption)}</label>`;
    case 'TRadioButton': return `<label ${base}${font}background:${V.colorCss(p.Color)}"${ttl}><input type="radio"${p.Checked?' checked':''}${p.Enabled===false?' disabled':''} tabindex="${mode==='run'?0:-1}"> ${amp(p.Caption)}</label>`;
    case 'TListBox': return `<div ${base}${font}background:${V.colorCss(p.Color)}"${ttl} tabindex="${mode==='run'?0:-1}">${p.Items.items.map((s,i)=>`<div class="li${i===p.ItemIndex?' sel':''}" data-i="${i}">${esc(s)||'&nbsp;'}</div>`).join('')}${mode==='design'&&!p.Items.items.length?`<div class="li ghost">${o.Name}</div>`:''}</div>`;
    case 'TComboBox': return `<select ${base}${font}"${p.Enabled===false?' disabled':''}${ttl} tabindex="${mode==='run'?0:-1}">${p.ItemIndex<0?`<option selected>${esc(p.Text)}</option>`:''}${p.Items.items.map((s,i)=>`<option value="${i}"${i===p.ItemIndex?' selected':''}>${esc(s)}</option>`).join('')}</select>`;
    case 'TScrollBar': return `<input type="range" ${base}" min="${p.Min}" max="${p.Max}" value="${p.Position}"${p.Enabled===false?' disabled':''}${mode==='design'?' disabled':''}${ttl} tabindex="${mode==='run'?0:-1}">`;
    case 'TGroupBox': return `<fieldset ${base}${font}background:${V.colorCss(p.Color)}"${ttl}><legend>${amp(p.Caption)}</legend>${kids||''}</fieldset>`;
    case 'TRadioGroup': return `<fieldset ${base}${font}background:${V.colorCss(p.Color)}"${ttl}><legend>${amp(p.Caption)}</legend><div class="rg" style="column-count:${p.Columns}">${p.Items.items.map((s,i)=>`<label class="rgi"><input type="radio" name="rg-${o.id}" data-i="${i}"${i===p.ItemIndex?' checked':''} tabindex="${mode==='run'?0:-1}"> ${esc(s)}</label>`).join('')}</div></fieldset>`;
    case 'TPanel': return `<div ${base}${font}background:${V.colorCss(p.Color)};border-style:${['none','solid','solid','solid'][p.BevelOuter||0]};border-color:${p.BevelOuter===1?'#808080 #fff #fff #808080':'#fff #808080 #808080 #fff'}"${ttl}><span class="pcap">${amp(p.Caption)}</span>${kids||''}</div>`;
    case 'TShape': { const sh=p.Shape; const r=sh===4||sh===5?'50%':sh===2||sh===3?'10px':'0'; const sq=sh===1||sh===3||sh===5; const s=Math.min(p.Width,p.Height);
      return `<div ${base}"${ttl}><div style="width:${sq?s:p.Width}px;height:${sq?s:p.Height}px;border:1px solid #000;border-radius:${r};background:${V.colorCss(p.Brush.p.Color)};${sq?`margin:${(p.Height-s)/2}px ${(p.Width-s)/2}px`:''}"></div></div>`; }
    case 'TImage': return `<div ${base}"${ttl}>${p.Picture.file?`<div class="img">🖼 ${esc(p.Picture.file.split(/[\\/]/).pop())}</div>`:mode==='design'?'<div class="img ghost">Image</div>':''}</div>`;
    case "TStatusBar": return `<div ${base}${font}">${p.SimplePanel||!p.Panels.items.length?`<span class="sp" style="flex:1">${esc(p.SimpleText)}</span>`:p.Panels.items.map((x,i,a)=>`<span class="sp" style="${i===a.length-1?'flex:1':'width:'+x.p.Width+'px'}">${esc(x.p.Text)}</span>`).join('')}</div>`;
    case 'TDateTimePicker': { const d=p.DateTime?p.DateTime.d:new Date(); return `<div ${base}${font}"${ttl}><span>${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}</span><b>▾</b></div>`; }
  }
  return `<div ${base}">${o.vcl}</div>`;
}
function menuBarHTML(menu){ if(!menu) return ''; return `<div class="vmenu">${menu.p.Items.items.filter(m=>m.p.Visible).map(m=>`<span class="mi" data-m="${m.Name}">${amp(m.p.Caption)}</span>`).join('')}</div>`; }
function layout(items,W,H){ let l=0,t=0,r=W,b=H; const by=a=>items.filter(c=>c.p.Align===a&&!V.COMP[c.vcl].nv);
  for(const c of by(1)){ c._a={L:l,T:t,W:r-l,H:c.p.Height}; t+=c.p.Height; }
  for(const c of by(2)){ b-=c.p.Height; c._a={L:l,T:b,W:r-l,H:c.p.Height}; }
  for(const c of by(3)){ c._a={L:l,T:t,W:c.p.Width,H:b-t}; l+=c.p.Width; }
  for(const c of by(4)){ r-=c.p.Width; c._a={L:r,T:t,W:c.p.Width,H:b-t}; }
  for(const c of by(5)){ c._a={L:l,T:t,W:Math.max(0,r-l),H:Math.max(0,b-t)}; }
  items.forEach(c=>{ if(!c.p.Align) c._a=null; });
}
function treeHTML(proj,mode,parent,W,H){
  const items=proj.comps.filter(c=>(c.parent||null)===(parent||null)); layout(items,W,H);
  return items.map(c=>{ const a=c._a||{W:c.p.Width,H:c.p.Height}; return compHTML(c,mode,V.COMP[c.vcl].container?treeHTML(proj,mode,c.Name,a.W-2,a.H-(c.vcl==="TGroupBox"?16:2)):""); }).join("");
}

/* ---------- окно задания ---------- */
function initVcl(el){
  if(el.dataset.ready) return; el.dataset.ready='1';
  const id=el.dataset.id;
  const cfgEl=el.querySelector('script[data-role="vcl"]');
  const cfg=JSON.parse(cfgEl.textContent);
  const key='vclw:'+id;
  let proj;
  const saved=store.get(key);
  try{ proj=new V.Project(saved?JSON.parse(saved):cfg); }catch(e){ proj=new V.Project(cfg); }
  const palette=cfg.palette||Object.keys(V.COMP).filter(k=>k!=='TForm');
  el.innerHTML=`
  <div class="bcb">
    <div class="bcb-title"><span class="ico">C</span> C++Builder 6 - Project1 <span class="tt">${esc(el.dataset.title||'')}</span></div>
    <div class="bcb-menu"><span>File</span><span>Edit</span><span>Search</span><span>View</span><span>Project</span><span class="run-m">Run</span><span>Component</span><span>Tools</span><span>Help</span></div>
    <div class="bcb-tools">
      <button class="tb run" data-a="run" title="Run (F9)">▶ <u>R</u>un&nbsp;<kbd>F9</kbd></button>
      ${cfg.checks&&cfg.checks.length?'<button class="tb" data-a="check" title="Проверить, работает ли как в задании">✓ Проверить</button>':''}
      ${cfg.ref?'<button class="tb" data-a="ref" title="Загрузить готовое решение">📋 Эталон</button>':''}
      <button class="tb" data-a="reset" title="Начать заново">↺ Заново</button>
      <span class="pal-tabs">${V.TABS.filter(t=>palette.some(p=>V.COMP[p].tab===t)).map((t,i)=>`<button class="ptab${i?'':' on'}" data-tab="${t}">${t}</button>`).join('')}</span>
    </div>
    <div class="bcb-pal">${palette.map(p=>`<button class="pi" data-type="${p}" data-tab="${V.COMP[p].tab}" title="${p}">${V.ICON[p]||'?'}<small>${p.slice(1)}</small></button>`).join('')}</div>
    ${cfg.steps?`<div class="bcb-steps"><b>Шаги обучалки</b><ol>${cfg.steps.map((s,i)=>`<li data-s="${i}">${s.t}</li>`).join('')}</ol></div>`:''}
    <div class="bcb-main">
      <div class="oi"><div class="oi-h">Object Inspector</div><select class="oi-sel" aria-label="Компонент"></select>
        <div class="oi-tabs"><button class="on" data-oi="p">Properties</button><button data-oi="e">Events</button></div><div class="oi-grid"></div></div>
      <div class="dz"><div class="dz-scroll"><div class="frm design"></div></div>
        <div class="dz-hint">Палитра: выбери компонент и щёлкни по форме. Перетаскивай мышью, уголок справа внизу — размер. Двойной щелчок — обработчик события. Delete — удалить.</div></div>
    </div>
    <div class="bcb-code"><div class="ct"><span class="on">Unit1.cpp</span><span class="h">Unit1.h</span></div><div class="ce"></div><pre class="ch" hidden></pre></div>
    <div class="cw-err" hidden></div>
    <div class="vres" hidden></div>
    <div class="runwin" hidden></div>
  </div>`;
  const $=s=>el.querySelector(s);
  const frm=$('.frm'), grid=$('.oi-grid'), sel=$('.oi-sel'), errBox=$('.cw-err'), resBox=$('.vres'), runwin=$('.runwin');
  let tool=null, cur=proj.form, oiTab='p';
  const ed=CPP.makeEditor($('.ce'),proj.code,()=>run());
  $('.ce').addEventListener('codechange',()=>{ proj.code=ed.value; save(); syncEvents(); stepsUpd(); });
  const save=()=>{ clearTimeout(save.t); save.t=setTimeout(()=>store.set(key,JSON.stringify(proj.toJSON())),300); };
  function syncEvents(){ const hs=new Set(proj.handlers().map(h=>h.name)); for(const c of [proj.form,...proj.comps]) for(const ev in c.events) if(!hs.has(c.events[ev])) delete c.events[ev]; }

  /* --- дизайнер --- */
  function drawForm(){
    const f=proj.form.p;
    const menu=proj.comps.find(c=>c.vcl==='TMainMenu');
    frm.style.width=f.Width+'px'; frm.style.height=f.Height+'px';
    frm.innerHTML=`<div class="wt"><span class="wi">⧉</span><span class="wc">${esc(f.Caption)}</span><span class="wb"><i>_</i><i>□</i><i>×</i></span></div>${menuBarHTML(menu)}<div class="client" style="background-color:${V.colorCss(f.Color)};${fontCss(proj.form.p.Font)}">${treeHTML(proj,"design",null,f.Width-8,f.Height-31-(menu?19:0))}</div>`;
    const s=frm.querySelector(`.vc[data-n="${cur.Name}"]`); if(s&&cur!==proj.form){ s.classList.add('selc'); s.insertAdjacentHTML('beforeend','<i class="rh"></i>'); }
    frm.classList.toggle('fsel',cur===proj.form);
  }
  function drawOI(){
    sel.innerHTML=[proj.form,...proj.comps].map(c=>`<option value="${c.Name}"${c===cur?' selected':''}>${c.Name}: ${c.vcl}</option>`).join('');
    const d=V.COMP[cur.vcl];
    if(oiTab==='p'){
      const rows=Object.keys(d.props).filter(k=>!['ClientWidth','ClientHeight','Files'].includes(k)).sort();
      grid.innerHTML=`<div class="row"><span>Name</span><input data-p="Name" value="${cur.Name}"${cur===proj.form?' readonly':''}></div>`+rows.map(k=>{
        const pd=d.props[k], v=cur.p[k];
        let ed;
        if(pd.t==='bool') ed=`<select data-p="${k}"><option${v?'':' selected'}>false</option><option${v?' selected':''}>true</option></select>`;
        else if(pd.t==='enum') ed=`<select data-p="${k}">${V.ENUMS[pd.en].map(n=>`<option${V.CONSTS[n]===v?' selected':''}>${n}</option>`).join('')}</select>`;
        else if(pd.t==='color') ed=`<select data-p="${k}">${Object.keys(V.COLORS).filter(n=>n!=='clNone').map(n=>`<option${V.COLORS[n]===v?' selected':''}>${n}</option>`).join('')}${Object.values(V.COLORS).includes(v)?'':`<option selected>${V.colorName(v)}</option>`}</select>`;
        else if(pd.t==='font') return `<div class="row sub"><span>Font</span><em>(TFont)</em></div>`+['Name','Size','Color'].map(fk=>`<div class="row ind"><span>${fk}</span>${fk==='Color'?`<select data-f="${fk}">${Object.keys(V.COLORS).filter(n=>n!=='clNone').map(n=>`<option${V.COLORS[n]===v.p.Color?' selected':''}>${n}</option>`).join('')}</select>`:`<input data-f="${fk}" value="${esc(v.p[fk])}">`}</div>`).join('')+`<div class="row ind"><span>Style</span><select data-f="Style">${['[]','[fsBold]','[fsItalic]','[fsBold,fsItalic]'].map((n,i)=>`<option value="${i}"${v.p.Style===i?' selected':''}>${n}</option>`).join('')}</select></div>`;
        else if(pd.t==='strings') ed=`<button class="dots" data-str="${k}">(TStrings) …</button>`;
        else if(pd.t==='menu') ed=`<button class="dots" data-menu="1">(Menu) …</button>`;
        else if(pd.t==='panels') ed=`<button class="dots" data-panels="1">(TStatusPanels) …</button>`;
        else if(pd.t==='obj'){ if(k==='Brush') ed=`<select data-brush="1">${Object.keys(V.COLORS).filter(n=>n!=='clNone').map(n=>`<option${V.COLORS[n]===v.p.Color?' selected':''}>${n}</option>`).join('')}</select>`; else if(k==='PopupMenu') ed=`<select data-pop="1"><option></option>${proj.comps.filter(c=>c.vcl==='TPopupMenu').map(c=>`<option${v===c||v===c.Name?' selected':''}>${c.Name}</option>`).join('')}</select>`; else ed='<em>—</em>'; }
        else if(pd.t==='dt') ed='<em>(сегодня)</em>';
        else ed=`<input data-p="${k}" value="${esc(v)}"${pd.t==='int'?' inputmode="numeric"':''}>`;
        return `<div class="row"><span>${k}</span>${ed}</div>`;
      }).join('');
    } else {
      grid.innerHTML=d.events.map(ev=>`<div class="row"><span>${ev}</span><input data-ev="${ev}" value="${esc(cur.events[ev]||'')}" placeholder="двойной щелчок" readonly></div>`).join('')||'<div class="row"><em>Нет событий</em></div>';
    }
  }
  function redraw(){ drawForm(); drawOI(); stepsUpd(); }
  function select(o){ cur=o; redraw(); }
  sel.addEventListener('change',()=>select(proj.find(sel.value)));
  el.querySelectorAll('.oi-tabs button').forEach(b=>b.addEventListener('click',()=>{ oiTab=b.dataset.oi; el.querySelectorAll('.oi-tabs button').forEach(x=>x.classList.toggle('on',x===b)); drawOI(); }));
  grid.addEventListener('change',e=>{
    const t=e.target, d=V.COMP[cur.vcl];
    if(t.dataset.p==='Name'){ const nv=t.value.trim(); if(!/^[A-Za-z_]\w*$/.test(nv)||proj.find(nv)){ t.value=cur.Name; return; }
      const old=cur.Name; proj.comps.forEach(c=>{ if(c.parent===old) c.parent=nv; }); cur.Name=nv; proj.code=proj.code.replace(new RegExp('\\b'+old+'\\b','g'),nv);
      for(const ev in cur.events) cur.events[ev]=cur.events[ev].replace(old,nv); ed.value=proj.code; save(); redraw(); return; }
    if(t.dataset.p){ const k=t.dataset.p, pd=d.props[k]; let v=t.value;
      if(pd.t==='bool') v=v==='true'; else if(pd.t==='int') v=parseInt(v,10)||0; else if(pd.t==='enum'||pd.t==='color') v=V.CONSTS[v]!=null?V.CONSTS[v]:parseInt(v,16);
      cur.p[k]=v; if(k==='Checked'&&cur.vcl==='TCheckBox') cur.p.State=v?1:0;
      if((k==='Caption')&&(cur.vcl==='TLabel'||cur.vcl==='TStaticText')&&cur.p.AutoSize) cur.p.Width=Math.max(10,String(v).length*6);
      if(cur===proj.form&&(k==='Width'||k==='Height')){ cur.p.ClientWidth=cur.p.Width-8; cur.p.ClientHeight=cur.p.Height-27; }
    }
    if(t.dataset.f){ const k=t.dataset.f; cur.p.Font.p[k]=k==='Color'?V.CONSTS[t.value]:k==='Size'||k==='Style'?parseInt(t.value,10)||8:t.value; }
    if(t.dataset.brush) cur.p.Brush.p.Color=V.CONSTS[t.value];
    if(t.dataset.pop) cur.p.PopupMenu=t.value||null;
    save(); drawForm(); stepsUpd();
  });
  grid.addEventListener('dblclick',e=>{ const t=e.target.closest('[data-ev]'); if(t) makeHandler(cur,t.dataset.ev); });
  grid.addEventListener('click',e=>{
    const b=e.target.closest('.dots'); if(!b) return;
    if(b.dataset.str) editText(`${cur.Name}->${b.dataset.str}`,cur.p[b.dataset.str].items.join('\n'),v=>{ cur.p[b.dataset.str].items=v===''?[]:v.split('\n'); });
    if(b.dataset.panels) editText(`${cur.Name}->Panels (по строке на панель)`,cur.p.Panels.items.map(x=>x.p.Text).join('\n'),v=>{ cur.p.Panels.items=(v===''?[]:v.split('\n')).map(s=>({vcl:'TStatusPanel',id:Math.random(),p:{Text:s,Width:120}})); });
    if(b.dataset.menu) editText(`${cur.Name} — пункты меню. Формат строки: Заголовок | Имя | Обработчик; подпункт — с двумя пробелами в начале`,menuToText(cur.p.Items.items),v=>{ cur.p.Items.items=textToMenu(v); });
  });
  function editText(title,val,apply){
    const box=document.createElement('div'); box.className='strdlg';
    box.innerHTML=`<div class="wt"><span class="wc">${esc(title)}</span></div><textarea spellcheck="false">${esc(val)}</textarea><div class="btns"><button class="tb" data-ok>OK</button><button class="tb" data-x>Cancel</button></div>`;
    el.querySelector('.bcb').appendChild(box); box.querySelector('textarea').focus();
    box.addEventListener('click',e=>{ if(e.target.closest('[data-ok]')){ apply(box.querySelector('textarea').value); save(); redraw(); box.remove(); } if(e.target.closest('[data-x]')) box.remove(); });
  }
  const menuToText=(items,ind='')=>items.map(m=>`${ind}${m.p.Caption} | ${m.Name} | ${m.events.OnClick||''}\n`+menuToText(m.items,ind+'  ')).join('').replace(/\n$/,'');
  function textToMenu(t){ const root=[]; const stack=[{lvl:-1,items:root}];
    for(const line of t.split('\n')){ if(!line.trim()) continue; const lvl=(line.match(/^ */)[0].length)>>1; const [cap,name,h]=line.trim().split('|').map(s=>s.trim());
      const m=V.makeComp('TMainMenu','tmp').p.Items; m.Name=name||cap.replace(/[^A-Za-z0-9]/g,'')+'1'; m.p.Caption=cap; if(h) m.events.OnClick=h; m.items=[];
      while(stack[stack.length-1].lvl>=lvl) stack.pop(); stack[stack.length-1].items.push(m); stack.push({lvl,items:m.items}); }
    return root; }
  function makeHandler(o,ev){
    const name=proj.ensureHandler(o,ev); ed.value=proj.code; proj.code=ed.value; save(); drawOI();
    const i=proj.code.indexOf('TForm1::'+name+'('); const ta=$('.cta');
    if(i>=0){ const pos=proj.code.indexOf('{',i)+2; ta.focus(); ta.setSelectionRange(pos,pos); const ln=proj.code.slice(0,pos).split('\n').length; ta.scrollTop=Math.max(0,(ln-4)*21); ta.dispatchEvent(new Event('scroll')); }
    stepsUpd();
  }
  const defaultEvent=o=>({TForm:'OnCreate',TTimer:'OnTimer',TEdit:'OnChange',TMemo:'OnChange',TScrollBar:'OnChange',TComboBox:'OnChange'}[o.vcl]||'OnClick');
  el.querySelectorAll('.ptab').forEach(b=>b.addEventListener('click',()=>{ el.querySelectorAll('.ptab').forEach(x=>x.classList.toggle('on',x===b)); el.querySelectorAll('.pi').forEach(p=>p.hidden=p.dataset.tab!==b.dataset.tab); }));
  { const first=el.querySelector('.ptab'); if(first) first.click(); }
  el.querySelector('.bcb-pal').addEventListener('click',e=>{ const b=e.target.closest('.pi'); if(!b) return; tool=tool===b.dataset.type?null:b.dataset.type; el.querySelectorAll('.pi').forEach(x=>x.classList.toggle('on',x.dataset.type===tool)); frm.classList.toggle('placing',!!tool); });
  // мышь на форме
  let drag=null;
  frm.addEventListener('mousedown',e=>{
    const client=frm.querySelector('.client'); if(!client) return;
    const cr=client.getBoundingClientRect();
    if(tool){
      let parent=null, ox=cr.left, oy=cr.top;
      const cont=e.target.closest('.v-TPanel,.v-TGroupBox');
      if(cont){ parent=cont.dataset.n; const r=cont.getBoundingClientRect(); ox=r.left; oy=r.top+(cont.matches('.v-TGroupBox')?8:0); }
      const x=Math.max(0,Math.round((e.clientX-ox)/8)*8), y=Math.max(0,Math.round((e.clientY-oy)/8)*8);
      const o=proj.add(tool,x,y,parent); tool=null; el.querySelectorAll('.pi').forEach(p=>p.classList.remove('on')); frm.classList.remove('placing');
      save(); select(o); e.preventDefault(); return;
    }
    const vc=e.target.closest('.vc');
    if(!vc){ if(e.target.closest('.client,.wt')) select(proj.form); return; }
    const o=proj.find(vc.dataset.n); if(!o) return;
    if(cur!==o) select(o);
    const resize=e.target.classList.contains('rh');
    drag={o,resize,sx:e.clientX,sy:e.clientY,l:o.p.Left,t:o.p.Top,w:o.p.Width,h:o.p.Height};
    e.preventDefault();
  });
  window.addEventListener('mousemove',e=>{ if(!drag) return; const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; const g=v=>Math.round(v/8)*8;
    if(drag.resize){ drag.o.p.Width=Math.max(8,g(drag.w+dx)); drag.o.p.Height=Math.max(8,g(drag.h+dy)); drag.o.p.AutoSize=false; } else { drag.o.p.Left=Math.max(0,g(drag.l+dx)); drag.o.p.Top=Math.max(0,g(drag.t+dy)); }
    drawForm(); });
  window.addEventListener('mouseup',()=>{ if(drag){ drag=null; save(); drawOI(); } });
  frm.addEventListener('dblclick',e=>{ const vc=e.target.closest('.vc'); const o=vc?proj.find(vc.dataset.n):proj.form; makeHandler(o,defaultEvent(o)); });
  el.addEventListener('keydown',e=>{
    if(e.key==='F9'){ e.preventDefault(); run(); return; }
    if((e.key==='Delete')&&cur!==proj.form&&!e.target.closest('input,textarea,select')){ proj.remove(cur); cur=proj.form; save(); redraw(); }
  });
  el.tabIndex=-1;
  // вкладки кода
  el.querySelector('.ct').addEventListener('click',e=>{ const s=e.target.closest('span'); if(!s) return; el.querySelectorAll('.ct span').forEach(x=>x.classList.toggle('on',x===s));
    const h=s.classList.contains('h'); $('.ce').hidden=h; $('.ch').hidden=!h; if(h) $('.ch').innerHTML=CPP.highlight(unitH()); });
  const unitH=()=>`//---------------------------------------------------------------------------\n\n#ifndef Unit1H\n#define Unit1H\n//---------------------------------------------------------------------------\n#include <Classes.hpp>\n#include <Controls.hpp>\n#include <StdCtrls.hpp>\n#include <Forms.hpp>\n//---------------------------------------------------------------------------\n`+proj.header().replace('public:\n  void __fastcall FormCtor__(TObject *Sender);\n','private:\t// User declarations\npublic:\t\t// User declarations\n  __fastcall TForm1(TComponent* Owner);\n').replace('__published:','__published:\t// IDE-managed Components').replace('extern TForm1','extern PACKAGE TForm1')+'//---------------------------------------------------------------------------\n#endif\n';

  /* --- ошибки компиляции --- */
  function showError(e){
    const code=e.code&&!/x/.test(e.code)?` <code>${e.code}</code>`:'';
    errBox.innerHTML=`<b>${e.kind==='compile'?'[C++ Error] Unit1.cpp'+(e.line?'('+e.line+')':''):'Ошибка во время работы'}</b>${code}<div>${esc(e.message)}</div>`;
    errBox.className='cw-err '+(e.kind==='compile'?'ce':'re'); errBox.hidden=false; if(e.line) ed.markLine(e.line);
  }
  function compile(rt){ errBox.hidden=true; ed.markLine(0); try{ rt.compile(); return true; }catch(e){ if(e instanceof CPP.CppError){ showError(e); return false; } showError({kind:'compile',message:'Внутренняя ошибка: '+e.message}); return false; } }

  /* --- запуск --- */
  let running=null;
  function run(){
    stopRun();
    const rp=new V.Project(proj.toJSON());
    const ui={message:s=>msgBox(s), close:()=>stopRun(), timers:()=>setTimers(), fs:running&&running.fs||vfs, files:()=>{}, focus:o=>{ const n=runwin.querySelector(`.vc[data-n="${o.Name}"]`); if(n){ const inp=n.matches('input,textarea,button,select')?n:n.querySelector('input'); inp&&inp.focus(); } }};
    const rt=new V.Runtime(rp,ui);
    if(!compile(rt)) return;
    running={rt,rp,timers:[],fs:ui.fs};
    runwin.hidden=false;
    buildRun();
    try{ if(rt.form.cls&&rt.form.cls.methods.get('FormCtor__')) { rt.form.events.__ctor='FormCtor__'; safeFire(rt.form,'__ctor'); } safeFire(rt.form,'OnCreate'); safeFire(rt.form,'OnShow'); }catch(e){}
    refresh(); setTimers();
    const rwEl=runwin.querySelector(".rw"); if(rwEl) rwEl.scrollIntoView({block:"center",behavior:"smooth"});
    stepsUpd(true);
  }
  function stopRun(){ if(!running) return; running.timers.forEach(t=>clearInterval(t)); running=null; runwin.hidden=true; runwin.innerHTML=''; }
  function setTimers(){ if(!running) return; running.timers.forEach(t=>clearInterval(t)); running.timers=[];
    for(const c of running.rp.comps) if(c.vcl==='TTimer'&&c.p.Enabled&&c.p.Interval>0&&c.events.OnTimer){ const t=setInterval(()=>{ safeFire(c,'OnTimer'); refresh(); },Math.max(20,c.p.Interval)); running.timers.push(t); } }
  function safeFire(o,ev,extra){
    if(!running) return false;
    const rt=running.rt;
    try{ rt.answers=[]; rt.ai=0; return rt.fire(o,ev,extra); }
    catch(e){ return handleErr(e,o,ev,extra); }
  }
  function handleErr(e,o,ev,extra){
    if(e&&e.vclAsk){ askDialog(e.vclAsk,ans=>{ const rt=running&&running.rt; if(!rt) return; rt.answers.push(ans); rt.ai=0; try{ rt.fire(o,ev,extra); }catch(e2){ handleErr(e2,o,ev,extra); } refresh(); }); return false; }
    if(e instanceof CPP.CppError){ const m=/^'.*' is not a valid|EConvertError/.test(e.message)?'EConvertError':/List index/.test(e.message)?'EStringListError':/EFOpenError/.test(e.message)?'EFOpenError':'Exception';
      exBox(`Project Project1.exe raised exception class ${m} with message '${e.message.replace(/ — .*$/,'').replace(/ \(E\w+\)$/,'')}'.`, e.message+(e.line?` (строка ${e.line} в Unit1.cpp)`:'')); if(e.line) ed.markLine(e.line); return false; }
    exBox('Внутренняя ошибка эмулятора',String(e&&e.message||e)); return false;
  }
  function buildRun(){
    const f=running.rp.form;
    runwin.innerHTML=`<div class="rw" tabindex="-1"><div class="wt act"><span class="wi">⧉</span><span class="wc"></span><span class="wb"><i>_</i><i>□</i><i class="x" title="Закрыть">×</i></span></div><div class="rwm"></div><div class="client"></div><div class="rwbar">Программа запущена. Закрой окно (×) — вернёшься в Builder.</div></div><div class="ovl" hidden></div>`;
    runwin.querySelector('.x').addEventListener('click',()=>{ if(running){ safeFire(running.rp.form,'OnClose'); } stopRun(); });
    wireRun();
  }
  function refresh(){
    if(!running) return;
    const rp=running.rp, f=rp.form.p;
    const rw=runwin.querySelector('.rw'); if(!rw) return;
    if(!f.Visible){ rw.style.opacity='.35'; } else rw.style.opacity=f.AlphaBlend?Math.max(.15,f.AlphaBlendValue/255):'';
    rw.style.width=f.Width+'px';
    rw.querySelector('.wc').textContent=f.Caption;
    const menu=rp.comps.find(c=>c.vcl==='TMainMenu');
    rw.querySelector('.rwm').innerHTML=menuBarHTML(menu);
    const cl=rw.querySelector('.client');
    const act=document.activeElement, an=act&&act.closest&&act.closest('.vc')?act.closest('.vc').dataset.n:null, selS=act&&act.selectionStart, selE=act&&act.selectionEnd;
    cl.style.cssText=`height:${f.Height-27-(menu?20:0)}px;background:${V.colorCss(f.Color)};${fontCss(rp.form.p.Font)}${f.Cursor?'cursor:'+V.CURSOR_CSS[f.Cursor]:''}`;
    cl.innerHTML=treeHTML(rp,"run",null,f.Width-8,f.Height-27-(menu?20:0));
    if(an){ const n=cl.querySelector(`.vc[data-n="${an}"]`); if(n){ const t=n.matches('input,textarea,select,button')?n:n.querySelector('input'); if(t){ t.focus(); try{ if(selS!=null&&t.setSelectionRange) t.setSelectionRange(selS,selE); }catch(e){} } } }
  }
  function wireRun(){
    const rw=runwin.querySelector('.rw');
    const rp=()=>running&&running.rp;
    const comp=t=>{ const n=t.closest('.vc'); return n&&rp()?rp().find(n.dataset.n):null; };
    const after=()=>{ refresh(); };
    rw.addEventListener('click',e=>{
      if(!running) return;
      const mi=e.target.closest('.mi'); if(mi){ openMenu(mi); return; }
      const o=comp(e.target);
      if(!o){ if(e.target.closest('.client')) { safeFire(rp().form,'OnClick'); after(); } return; }
      if(o.p.Enabled===false) return;
      if(o.vcl==='TCheckBox'){ o.p.Checked=!o.p.Checked; o.p.State=o.p.Checked?1:0; }
      if(o.vcl==='TRadioButton'){ rp().comps.forEach(c=>{ if(c.vcl==='TRadioButton'&&c.parent===o.parent) c.p.Checked=false; }); o.p.Checked=true; }
      if(o.vcl==='TListBox'){ const li=e.target.closest('.li'); if(li) o.p.ItemIndex=+li.dataset.i; }
      if(o.vcl==='TRadioGroup'){ const r=e.target.closest('input[data-i]'); if(!r) return; o.p.ItemIndex=+r.dataset.i; }
      if(o.vcl==='TBitBtn'&&o.p.Kind===6&&!o.events.OnClick){ stopRun(); return; }
      if(o.vcl==='TComboBox'||o.vcl==='TEdit'||o.vcl==='TMemo'||o.vcl==='TScrollBar') { safeFire(o,'OnClick'); after(); return; }
      safeFire(o,'OnClick');
      if(o.vcl==='TBitBtn'&&o.p.Kind===6&&running) { stopRun(); return; }
      after();
    });
    rw.addEventListener('dblclick',e=>{ const o=comp(e.target); safeFire(o||rp().form,'OnDblClick'); after(); });
    rw.addEventListener('input',e=>{ const o=comp(e.target); if(!o) return;
      if(o.vcl==='TEdit'){ o.p.Text=e.target.value; safeFire(o,'OnChange'); after(); }
      if(o.vcl==='TMemo'){ o.p.Lines.items=e.target.value.split('\n'); safeFire(o,'OnChange'); after(); }
      if(o.vcl==='TScrollBar'){ const v=+e.target.value; const extra={scrollpos:{v,t:CPP.types.tInt},scrollcode:5}; safeFire(o,'OnScroll',extra); o.p.Position=extra.scrollpos.cell?extra.scrollpos.cell.v:v; safeFire(o,'OnChange'); after(); }
    });
    rw.addEventListener('change',e=>{ const o=comp(e.target); if(o&&o.vcl==='TComboBox'){ o.p.ItemIndex=+e.target.value; o.p.Text=o.p.Items.items[o.p.ItemIndex]||''; safeFire(o,'OnChange'); after(); } });
    let lastMove=0;
    rw.addEventListener('mousemove',e=>{ if(!running) return; const now=Date.now(); if(now-lastMove<40) return; lastMove=now;
      const o=comp(e.target)||rp().form; const cr=(e.target.closest('.vc')||rw.querySelector('.client')).getBoundingClientRect();
      const shift=(e.shiftKey?1:0)|(e.altKey?2:0)|(e.ctrlKey?4:0);
      if(o.events.OnMouseMove){ safeFire(o,'OnMouseMove',{x:Math.round(e.clientX-cr.left),y:Math.round(e.clientY-cr.top),shift}); after(); } });
    rw.addEventListener('mousedown',e=>{ const o=comp(e.target)||rp().form; if(o.events.OnMouseDown){ safeFire(o,'OnMouseDown',{x:e.offsetX,y:e.offsetY,button:e.button===2?1:0}); after(); } });
    rw.addEventListener('mouseup',e=>{ const o=comp(e.target)||rp().form; if(o.events.OnMouseUp){ safeFire(o,'OnMouseUp',{x:e.offsetX,y:e.offsetY,button:e.button===2?1:0}); after(); } });
    rw.addEventListener('keypress',e=>{ const o=comp(e.target)||rp().form; if(o.events.OnKeyPress&&e.key.length===1){ const extra={key:{v:CPP.c2b(e.key),t:CPP.types.tChar}}; safeFire(o,'OnKeyPress',extra); const k=extra.key.cell?extra.key.cell.v:0; if(!k||k!==CPP.c2b(e.key)){ e.preventDefault(); if(k&&e.target.matches('input,textarea')) document.execCommand('insertText',false,CPP.b2c(k)); } after(); } });
    rw.addEventListener('contextmenu',e=>{ const o=comp(e.target)||rp().form; const pm=o.p.PopupMenu||rp().form.p.PopupMenu; const m=pm&&(typeof pm==='string'?rp().find(pm):pm); if(m){ e.preventDefault(); openMenuItems(m.p.Items.items,e.clientX,e.clientY); } });
  }
  function openMenu(mi){ const menu=running.rp.comps.find(c=>c.vcl==='TMainMenu'); const m=menu.p.Items.items.find(x=>x.Name===mi.dataset.m); if(!m) return;
    if(!m.items.length){ fireMenu(m); return; } const r=mi.getBoundingClientRect(); openMenuItems(m.items,r.left,r.bottom); }
  function openMenuItems(items,x,y){ closePop(); const pop=document.createElement('div'); pop.className='vpop'; const rr=runwin.getBoundingClientRect(); pop.style.left=(x-rr.left)+'px'; pop.style.top=(y-rr.top)+'px';
    pop.innerHTML=items.filter(m=>m.p.Visible).map(m=>m.p.Caption==='-'?'<hr>':`<div class="pm${m.p.Enabled?'':' dis'}" data-m="${m.Name}">${m.p.Checked?'✓ ':''}${amp(m.p.Caption)}</div>`).join('');
    runwin.appendChild(pop);
    pop.addEventListener('click',e=>{ const d=e.target.closest('.pm'); if(!d||d.classList.contains('dis')) return; const m=findMenu(items,d.dataset.m); closePop(); if(m) fireMenu(m); });
    setTimeout(()=>document.addEventListener('click',closePop,{once:true}),0); }
  const findMenu=(items,n)=>{ for(const m of items){ if(m.Name===n) return m; const r=findMenu(m.items,n); if(r) return r; } return null; };
  function closePop(){ runwin.querySelectorAll('.vpop').forEach(p=>p.remove()); }
  function fireMenu(m){ if(!running) return; if(m.events.OnClick){ safeFire(m,'OnClick'); refresh(); } }

  /* --- диалоги во время работы программы --- */
  const vfs=new Map([['C:\\Мои документы\\пример.txt','Привет из файла!\r\nВторая строка\r\n'],['C:\\Мои документы\\список.txt','молоко\r\nхлеб\r\nсыр\r\n']]);
  function dlg(html,onOk){ const ov=runwin.querySelector('.ovl'); ov.hidden=false; ov.innerHTML=`<div class="dlg">${html}</div>`; ov.querySelector('[data-ok]')?.focus();
    ov.onclick=e=>{ const b=e.target.closest('[data-r]'); if(!b) return; const v=onOk(b.dataset.r,ov); if(v!==false){ ov.hidden=true; ov.innerHTML=''; } }; }
  function askDialog(a,cb){
    const fs=running.fs;
    if(a.kind==='TOpenDialog'||a.kind==='TSaveDialog'){
      const save=a.kind==='TSaveDialog'; const flt=a.data.comp.p.Filter||'Все файлы (*.*)|*.*';
      dlg(`<div class="wt"><span class="wc">${save?'Save As':'Open'}</span></div><div class="db"><div class="fl">${[...fs.keys()].map(f=>`<div class="fi" data-f="${esc(f)}">📄 ${esc(f.split('\\').pop())}</div>`).join('')||'<em>Папка пуста</em>'}</div>
        <label>File name: <input class="fn" value="${esc(a.data.comp.p.FileName?a.data.comp.p.FileName.split('\\').pop():save?'новый.txt':'')}"></label><label>Files of type: <select>${flt.split('|').filter((_,i)=>i%2===0).map(s=>`<option>${esc(s)}</option>`).join('')}</select></label>
        <div class="btns"><button class="tb" data-r="ok" data-ok>${save?'Save':'Open'}</button><button class="tb" data-r="no">Cancel</button></div></div>`,(r,ov)=>{
          if(r==='no'){ cb(null); return; } const n=ov.querySelector('.fn').value.trim(); if(!n) return false; const full=n.includes('\\')?n:'C:\\Мои документы\\'+n;
          if(!save&&!fs.has(full)){ fs.set(full,''); } cb({name:full,files:[full]}); });
      runwin.querySelectorAll('.fi').forEach(x=>x.addEventListener('click',()=>{ runwin.querySelector('.fn').value=x.dataset.f.split('\\').pop(); }));
      return; }
    if(a.kind==='TFontDialog'){ const f=a.data.comp.p.Font.p;
      dlg(`<div class="wt"><span class="wc">Font</span></div><div class="db"><label>Font: <select class="fnm">${['MS Sans Serif','Arial','Times New Roman','Courier New','Comic Sans MS','Tahoma'].map(n=>`<option${n===f.Name?' selected':''}>${n}</option>`).join('')}</select></label><label>Size: <input class="fsz" type="number" value="${f.Size}" min="6" max="72"></label><label>Color: <select class="fcl">${Object.keys(V.COLORS).slice(0,16).map(n=>`<option${V.COLORS[n]===f.Color?' selected':''}>${n}</option>`).join('')}</select></label><label><input type="checkbox" class="fb"${f.Style&1?' checked':''}> Bold</label><label><input type="checkbox" class="fit"${f.Style&2?' checked':''}> Italic</label><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button><button class="tb" data-r="no">Cancel</button></div></div>`,(r,ov)=>{
        if(r==='no'){ cb(null); return; } cb({Name:ov.querySelector('.fnm').value,Size:+ov.querySelector('.fsz').value||8,Color:V.COLORS[ov.querySelector('.fcl').value],Style:(ov.querySelector('.fb').checked?1:0)|(ov.querySelector('.fit').checked?2:0)}); }); return; }
    if(a.kind==='TColorDialog'){ dlg(`<div class="wt"><span class="wc">Color</span></div><div class="db cgrid">${Object.keys(V.COLORS).slice(0,16).map(n=>`<button class="sw" data-r="${n}" title="${n}" style="background:${V.colorCss(V.COLORS[n])}"></button>`).join('')}<div class="btns"><button class="tb" data-r="no">Cancel</button></div></div>`,r=>{ cb(r==='no'?null:V.COLORS[r]); }); return; }
    if(a.kind==='confirm'){ const yn=(a.data.flags&15)===3||(a.data.flags&15)===4;
      dlg(`<div class="wt"><span class="wc">${esc(a.data.caption||'Project1')}</span></div><div class="db"><p>${esc(a.data.text)}</p><div class="btns">${yn?`<button class="tb" data-r="6" data-ok>Yes</button><button class="tb" data-r="7">No</button>${(a.data.flags&15)===3?'<button class="tb" data-r="2">Cancel</button>':''}`:'<button class="tb" data-r="1" data-ok>OK</button>'}</div></div>`,r=>cb(+r)); return; }
    if(a.kind==='input'){ dlg(`<div class="wt"><span class="wc">${esc(a.data.caption)}</span></div><div class="db"><p>${esc(a.data.prompt)}</p><input class="inb" value="${esc(a.data.def)}"><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button><button class="tb" data-r="no">Cancel</button></div></div>`,(r,ov)=>cb(r==='ok'?ov.querySelector('.inb').value:a.data.def)); return; }
  }
  function msgBox(s){ const ov=runwin.querySelector('.ovl'); if(!ov) return; ov.hidden=false; ov.innerHTML=`<div class="dlg"><div class="wt"><span class="wc">Project1</span></div><div class="db"><p>${esc(s)}</p><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button></div></div></div>`; ov.onclick=e=>{ if(e.target.closest('[data-r]')){ ov.hidden=true; ov.innerHTML=''; } }; }
  function exBox(title,detail){ const ov=runwin.querySelector('.ovl'); if(!ov) { showError({kind:'runtime',message:detail}); return; } ov.hidden=false; ov.innerHTML=`<div class="dlg ex"><div class="wt"><span class="wc">Debugger Exception Notification</span></div><div class="db"><p>⚠ ${esc(title)}</p><p class="det">${esc(detail)}</p><div class="btns"><button class="tb" data-r="ok" data-ok>OK</button></div></div></div>`; ov.onclick=e=>{ if(e.target.closest('[data-r]')){ ov.hidden=true; ov.innerHTML=''; } }; }

  /* --- автопроверка (как работает «оригинал») --- */
  function headless(p){
    const rp=new V.Project(p.toJSON?p.toJSON():p); let clock=Date.UTC(2026,10,19,9,0,0);
    const ui={message:()=>{}, close:()=>{ rp.form.p.__closed=true; }, timers:()=>{}, fs:new Map(vfs), files:()=>{}, clock:()=>clock+new Date().getTimezoneOffset()*60000};
    const rt=new V.Runtime(rp,ui); rt.compile(); ui.tick=ms=>{ clock+=ms; };
    if(rt.form.cls&&rt.form.cls.methods.get('FormCtor__')){ rt.form.events.__ctor='FormCtor__'; rt.fire(rt.form,'__ctor'); }
    rt.fire(rt.form,'OnCreate'); return {rt,rp,ui};
  }
  function runCheck(p,ch){
    const {rt,rp,ui}=headless(p); const answers=[];
    const fire=(o,ev,ex)=>{ rt.answers=answers.slice(); rt.ai=0; rt.fire(o,ev,ex); answers.length=0; };
    // "@7" или "@×|*" — кнопка с такой надписью (Caption), как бы её ни назвали
    const capNorm=s=>String(s).replace(/&/g,'').trim().toLowerCase();
    const need=n=>{
      if(n[0]==='@'){ const alts=n.slice(1).split('|').map(capNorm);
        const o=rp.comps.find(c=>(c.vcl==='TButton'||c.vcl==='TBitBtn'||c.vcl==='TSpeedButton')&&alts.includes(capNorm(c.p.Caption)));
        if(!o) throw new Error(`на форме нет кнопки с надписью «${n.slice(1).split('|').join('» или «')}»`); return o; }
      const o=rp.find(n); if(!o) throw new Error(`на форме нет компонента ${n} — назови компоненты как в задании`); return o; };
    for(const a of ch.act||[]){
      const [k,n,x,y]=a;
      if(k==='answer'){ answers.push(n); continue; }
      const o=k==='menu'?null:n==='Form1'?rp.form:need(n);
      if(k==='set'){ if(x==='Text'&&(o.vcl==='TEdit'||o.vcl==='TComboBox')){ o.p.Text=String(y); fire(o,'OnChange'); } else if(x==='Lines'||x==='Items'){ o.p[x].items=y.slice(); } else o.p[x]=y; }
      else if(k==='click'){ if(o.vcl==='TCheckBox'){ o.p.Checked=!o.p.Checked; o.p.State=o.p.Checked?1:0; } fire(o,'OnClick'); }
      else if(k==='select'){ o.p.ItemIndex=x; fire(o,'OnClick'); if(o.vcl==='TComboBox'){ o.p.Text=o.p.Items.items[x]; fire(o,'OnChange'); } }
      else if(k==='tick'){ for(let i=0;i<(x||1);i++){ ui.tick(o.p.Interval); if(o.p.Enabled) fire(o,'OnTimer'); } }
      else if(k==='scroll'){ const extra={scrollpos:{v:x,t:CPP.types.tInt},scrollcode:5}; o.p.Position=x; fire(o,'OnScroll',extra); fire(o,'OnChange'); }
      else if(k==='move'){ fire(o,'OnMouseMove',{x:x||1,y:y||1,shift:a[4]||0}); }
      else if(k==='menu'){ const m=findMenu(rp.comps.filter(c=>c.vcl==='TMainMenu'||c.vcl==='TPopupMenu').flatMap(c=>c.p.Items.items),n); if(!m) throw new Error('нет пункта меню '+n); fire(m,'OnClick'); }
      else if(k==='key'){ fire(o,'OnKeyPress',{key:{v:CPP.c2b(x),t:CPP.types.tChar}}); }
      else if(k==='event'){ fire(o,x); }
    }
    const bad=[];
    for(const e of ch.exp||[]){
      const [n,prop,want]=e; const o=n==='Form1'?rp.form:need(n);
      let got;
      if(prop==='Lines'||prop==='Items') got=o.p[prop].items.join('|');
      else if(prop==='Font.Size') got=o.p.Font.p.Size; else if(prop==='Font.Color') got=V.colorName(o.p.Font.p.Color); else if(prop==='Brush.Color') got=V.colorName(o.p.Brush.p.Color);
      else if(prop==='Color') got=V.colorName(o.p.Color);
      else if(prop==='Panels.0') got=o.p.Panels.items[0]?o.p.Panels.items[0].p.Text:'';
      else got=o.p[prop];
      let ok;
      if(want&&typeof want==='object'&&want.re) ok=new RegExp(want.re).test(String(got));
      else if(want&&typeof want==='object'&&want.ne!==undefined) ok=String(got)!==String(want.ne);
      else if(typeof want==='number'&&typeof got==='string') ok=Math.abs(parseFloat(got.replace(',','.'))-want)<1e-6*Math.max(1,Math.abs(want));
      else ok=String(got)===String(want);
      if(!ok) bad.push(`${n}->${prop}: ожидалось ${want&&want.re?'по шаблону '+want.re:want&&want.ne!==undefined?'не '+want.ne:JSON.stringify(want)}, а получилось ${JSON.stringify(got)}`);
    }
    return bad;
  }
  function checkAll(){
    resBox.hidden=false; errBox.hidden=true;
    const rows=[]; let okAll=true;
    for(const ch of cfg.checks){ let bad;
      try{ bad=runCheck(proj,ch); }catch(e){ if(e instanceof CPP.CppError){ showError(e); bad=['ошибка: '+e.message]; } else bad=[e.vclAsk?'программа ждёт ответа в диалоге':String(e.message)]; }
      if(bad.length) okAll=false;
      rows.push(`<li class="${bad.length?'bad':'ok'}">${bad.length?'✗':'✓'} ${esc(ch.name)}${bad.length?'<br><small>'+bad.map(esc).join('<br>')+'</small>':''}</li>`); }
    resBox.className='vres '+(okAll?'ok':'bad'); resBox.innerHTML=`<b>${okAll?'Работает как в задании ✓':'Пока не всё работает'}</b><ul>${rows.join('')}</ul>`;
    if(okAll){ store.set(key+':done','1'); el.classList.add('solved'); }
    stepsUpd(true);
  }
  /* --- шаги обучалки --- */
  let ranOnce=false;
  function stepsUpd(ran){
    if(ran) ranOnce=true;
    if(!cfg.steps) return;
    const hs=new Set(proj.handlers().map(h=>h.name));
    let allPrev=true;
    cfg.steps.forEach((s,i)=>{
      const c=s.c||{}; let ok=false;
      try{
        if(c.comp) ok=proj.comps.some(x=>x.vcl===c.comp)&&(!c.count||proj.comps.filter(x=>x.vcl===c.comp).length>=c.count);
        if(c.prop){ const o=proj.find(c.prop[0]); ok=!!o&&(c.prop[1]==='Font.Size'?o.p.Font.p.Size==c.prop[2]:c.prop[1]==='Font.Color'?V.colorName(o.p.Font.p.Color)===c.prop[2]:typeof c.prop[2]==='string'&&/^cl/.test(c.prop[2])?V.colorName(o.p[c.prop[1]])===c.prop[2]:String(o.p[c.prop[1]])===String(c.prop[2])); }
        if(c.handler) ok=hs.has(c.handler);
        if(c.code) ok=new RegExp(c.code).test(proj.code);
        if(c.run) ok=ranOnce;
        if(c.check!=null) ok=runCheck(proj,cfg.checks[c.check]).length===0;
      }catch(e){ ok=false; }
      const li=el.querySelector(`.bcb-steps li[data-s="${i}"]`); if(li){ li.classList.toggle('done',ok); li.classList.toggle('next',!ok&&allPrev); }
      if(!ok) allPrev=false;
    });
  }
  el.querySelector('.bcb-tools').addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(!b) return;
    if(b.dataset.a==='run') run();
    if(b.dataset.a==='check') checkAll();
    if(b.dataset.a==='ref'||b.dataset.a==='reset'){ if(!b.dataset.sure){ b.dataset.sure='1'; const old=b.innerHTML; b.textContent='Точно? Твоя работа заменится'; setTimeout(()=>{ delete b.dataset.sure; b.innerHTML=old; },3000); b._old=old; return; }
      delete b.dataset.sure; b.innerHTML=b._old; stopRun(); proj=new V.Project(b.dataset.a==='ref'?cfg.ref:cfg); ed.value=proj.code; proj.code=ed.value; cur=proj.form; save(); redraw(); resBox.hidden=true; errBox.hidden=true; }
  });
  if(store.get(key+':done')) el.classList.add('solved');
  redraw();
}
CPP.initVcl=function(root){ (root||document).querySelectorAll('.vclw').forEach(initVcl); };
CPP.VCLUI={compHTML,treeHTML,menuBarHTML,fontCss,amp,esc,layout};
})(typeof window!=='undefined'?window:globalThis);
