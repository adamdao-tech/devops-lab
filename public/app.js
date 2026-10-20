// ============================================================
//  DevOps Lab – kvízy, příkazy, najdi chybu, test na čas
// ============================================================
(() => {
const TOPICS = {linux:'Linux',net:'Sítě & DNS',git:'Git',docker:'Docker',k8s:'Kubernetes',cicd:'CI/CD',iac:'Terraform',aws:'AWS',mon:'Monitoring'};
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md = s => esc(s).replace(/`([^`]+)`/g,'<code>$1</code>');
const hash = s => { let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))|0; return (h>>>0).toString(36); };
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]} return a; };
const today = () => new Date().toISOString().slice(0,10);

// ---------- items ----------
const ITEMS = [
  ...QUIZ.map(o=>({...o,k:'quiz',id:'q'+hash(o.q)})),
  ...CMDS.map(o=>({...o,k:'cmd',id:'c'+hash(o.q)})),
  ...FIX.map(o=>({...o,k:'fix',id:'f'+hash(o.title)}))
];
const byId = Object.fromEntries(ITEMS.map(i=>[i.id,i]));

// ---------- storage ----------
const KEY='devopslab:v1';
let D = (()=>{ try{ return JSON.parse(localStorage.getItem(KEY)) || null; }catch(e){ return null; } })() || {items:{},days:[],exams:[],topics:[]};
D.items ||= {}; D.days ||= []; D.exams ||= []; D.topics ||= []; D.notes ??= ''; D.inotes ||= {};
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} };
const st = id => D.items[id] || {c:0,w:0,box:0,last:0};
function record(id, ok){
  const s = {...st(id)};
  if(ok){ s.c++; s.box=Math.min(5,s.box+1); } else { s.w++; s.box=0; }
  s.last=Date.now(); D.items[id]=s;
  const t=today(); if(!D.days.includes(t)) D.days.push(t);
  save(); badge();
}
const seen = id => !!D.items[id];
const mastered = id => st(id).box>=2;
const needsReview = id => { const s=D.items[id]; return s && s.w>0 && s.box<2; };
function streak(){
  const set=new Set(D.days); let n=0; const d=new Date();
  if(!set.has(today())) d.setDate(d.getDate()-1);
  while(set.has(d.toISOString().slice(0,10))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function weight(id){ const s=D.items[id]; if(!s) return 3; if(s.box===0) return 4; return [4,2,1,.5,.3,.2][s.box]; }
function pick(pool, n){
  const out=[], a=[...pool];
  while(out.length<n && a.length){
    const tot=a.reduce((x,i)=>x+weight(i.id),0); let r=Math.random()*tot, j=0;
    for(;j<a.length;j++){ r-=weight(a[j].id); if(r<=0) break; }
    out.push(a.splice(Math.min(j,a.length-1),1)[0]);
  }
  return out;
}
function badge(){ const n=ITEMS.filter(i=>needsReview(i.id)).length; $('#revc').textContent=n||''; }

// ---------- topic selector ----------
const selTopics = () => D.topics.length ? D.topics : Object.keys(TOPICS);
function topicChips(kind){
  const cnt = t => ITEMS.filter(i=>i.k===kind && i.t===t).length;
  return `<div class="lbl">Témata</div><div class="chips" id="tchips">
    <button class="chip ${!D.topics.length?'on':''}" data-t="">Vše</button>
    ${Object.entries(TOPICS).filter(([t])=>cnt(t)).map(([t,n])=>`<button class="chip ${D.topics.includes(t)?'on':''}" data-t="${t}">${n}<small>${cnt(t)}</small></button>`).join('')}
  </div>`;
}
function bindChips(rerender){
  app.querySelectorAll('#tchips [data-t]').forEach(b=>b.onclick=()=>{
    const t=b.dataset.t;
    if(!t) D.topics=[]; else { const i=D.topics.indexOf(t); i>=0?D.topics.splice(i,1):D.topics.push(t); if(D.topics.length===Object.keys(TOPICS).length) D.topics=[]; }
    save(); rerender();
  });
}

// ---------- dashboard ----------
function dash(){
  const total=ITEMS.length, ans=Object.values(D.items), c=ans.reduce((a,s)=>a+s.c,0), w=ans.reduce((a,s)=>a+s.w,0);
  const acc = c+w ? Math.round(c/(c+w)*100) : 0;
  const mast = ITEMS.filter(i=>mastered(i.id)).length;
  const rev = ITEMS.filter(i=>needsReview(i.id)).length;
  const tp = Object.entries(TOPICS).map(([t,n])=>{
    const its=ITEMS.filter(i=>i.t===t), m=its.filter(i=>mastered(i.id)).length, s=its.filter(i=>seen(i.id)&&!mastered(i.id)&&!needsReview(i.id)).length, r=its.filter(i=>needsReview(i.id)).length;
    const p = x => x/its.length*100;
    return `<div class="card tp"><div class="n">${n}</div><div class="bar"><i class="m" style="width:${p(m)}%"></i><i class="s" style="width:${p(s)}%"></i><i class="w" style="width:${p(r)}%"></i></div><div class="p">${Math.round(p(m))}%</div></div>`;
  }).join('');
  const ex = D.exams.slice(-5).reverse();
  app.innerHTML = `
    <h1>Ahoj 👋</h1><p class="sub">Žádné čtení, jen praxe. Vyber režim a jeď. Chyby se ti budou vracet, dokud je nezvládneš.</p>
    <div class="grid g4">
      <div class="card stat"><div class="k">Zvládnuto</div><div class="v">${mast}<small> / ${total}</small></div></div>
      <div class="card stat"><div class="k">Úspěšnost</div><div class="v">${acc}<small>%</small></div></div>
      <div class="card stat"><div class="k">Série dní</div><div class="v">${streak()}<small> 🔥</small></div></div>
      <div class="card stat"><div class="k">K opakování</div><div class="v" style="color:${rev?'var(--bad)':'inherit'}">${rev}</div></div>
    </div>
    <h2>Režimy</h2>
    <div class="grid g3">
      <a class="card mode" href="#/quiz"><div class="ic">[?]</div><b>Kvíz</b><span>${QUIZ.length} otázek, okamžité vysvětlení</span></a>
      <a class="card mode" href="#/cmd"><div class="ic">$_</div><b>Příkazy</b><span>${CMDS.length} úloh – napiš příkaz z hlavy</span></a>
      <a class="card mode" href="#/fix"><div class="ic">!=</div><b>Najdi chybu</b><span>${FIX.length} rozbitých configů k opravě</span></a>
      <a class="card mode" href="#/exam"><div class="ic">⏱</div><b>Test na čas</b><span>30 otázek / 30 minut, výsledek až na konci</span></a>
      <a class="card mode" href="#/review"><div class="ic">↻</div><b>Opakování chyb</b><span>${rev ? rev+' položek čeká' : 'zatím nic, super'}</span></a>
      <a class="card mode" href="#/mix"><div class="ic">∑</div><b>Mix</b><span>10 náhodných úloh ze všech režimů</span></a>
    </div>
    <h2>Témata</h2>
    <div class="topics">${tp}</div>
    <div class="legend"><span><i style="background:var(--acc)"></i>zvládnuto (2× správně v řadě)</span><span><i style="background:rgba(70,227,138,.3)"></i>rozpracováno</span><span><i style="background:var(--bad);opacity:.7"></i>k opakování</span></div>
    ${ex.length?`<h2>Poslední testy</h2><div class="card exams">${ex.map(e=>`<div><span>${e.d}</span><span>${e.score}/${e.n} · ${Math.round(e.score/e.n*100)} % · ${Math.floor(e.dur/60)}:${String(e.dur%60).padStart(2,'0')}</span></div>`).join('')}</div>`:''}`;
}

// ---------- setup screens ----------
function setup(kind, title, sub){
  const pool = () => ITEMS.filter(i=>i.k===kind && selTopics().includes(i.t));
  const r = () => {
    const p=pool();
    app.innerHTML = `<h1>${title}</h1><p class="sub">${sub}</p>${topicChips(kind)}
      <div class="lbl">Počet</div><div class="chips" id="nchips">${[5,10,20].map(n=>`<button class="chip ${n===(D.n||10)?'on':''}" data-n="${n}">${n}</button>`).join('')}<button class="chip ${D.n===999?'on':''}" data-n="999">Všechny</button></div>
      <div class="row"><button class="btn" id="go" ${p.length?'':'disabled'}>Start (${Math.min(p.length,D.n||10)})</button><span class="hint">Přednost mají úlohy, které jsi ještě neviděl nebo pokazil.</span></div>`;
    bindChips(r);
    app.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{D.n=+b.dataset.n;save();r();});
    $('#go').onclick=()=>run(pick(pool(), D.n||10), {title});
  };
  r();
}

// ---------- session runner ----------
let S=null;
function run(list, opt={}){
  if(!list.length){ app.innerHTML=`<div class="empty">Nic k procvičení. <a href="#/">Zpět</a></div>`; return; }
  S={list, i:0, res:[], exam:!!opt.exam, title:opt.title||'', t0:Date.now(), limit:opt.limit||0};
  if(S.exam){ clearInterval(S.tick); S.tick=setInterval(tick,1000); }
  show();
}
function tick(){ if(!S||!S.exam){return;} const left=S.limit-Math.floor((Date.now()-S.t0)/1000); const el=$('#timer'); if(el) el.textContent=fmtT(Math.max(0,left)); if(left<=0){ clearInterval(S.tick); finish(); } }
const fmtT = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function head(){
  return `<div class="sess-top"><button class="btn ghost" id="quit" title="Ukončit">✕</button><div class="prog"><i style="width:${S.i/S.list.length*100}%"></i></div><span class="cnt">${S.i+1} / ${S.list.length}</span>${S.exam?`<span class="timer" id="timer">${fmtT(S.limit)}</span>`:''}</div>`;
}
function show(){
  const it=S.list[S.i]; NB.setItem(it);
  app.innerHTML = head() + `<span class="tag">${TOPICS[it.t]} · ${{quiz:'kvíz',cmd:'příkaz',fix:'najdi chybu'}[it.k]}</span>${D.inotes[it.id]?`<button class="tag notetag" id="hasnote">📝 máš k tomu poznámku</button>`:''}` + (it.k==='quiz'?quizV(it):it.k==='cmd'?cmdV(it):fixV(it));
  $('#quit').onclick=()=>{ if(S.exam && !confirmQuit()) return; clearInterval(S.tick); S.res.length?finish():(location.hash='#/'); };
  if(S.exam) tick();
  const hn=$('#hasnote'); if(hn) hn.onclick=()=>NB.open('item');
  (it.k==='quiz'?quizB:it.k==='cmd'?cmdB:fixB)(it);
}
function confirmQuit(){ return S.res.length>0; }
function done(it, ok, extra){
  if(!S.exam) record(it.id, ok);
  S.res.push({id:it.id, ok, ...extra});
}
function nextBtn(){ return `<div class="next"><button class="btn" id="nx">${S.i+1<S.list.length?'Další →':'Výsledky'}</button><button class="btn ghost" id="tonote" title="Vloží zadání a řešení do poznámkového bloku">📝 Do bloku</button><span class="hint">Enter = další · N = blok</span></div>`; }
function bindNext(){ const b=$('#nx'); if(!b) return; b.focus(); b.onclick=advance; const t=$('#tonote'); if(t) t.onclick=()=>{ NB.append(summary(S.list[S.i])); t.textContent='✓ V bloku'; t.disabled=true; }; }
function advance(){ S.i++; S.i<S.list.length ? show() : finish(); }

// quiz
function quizV(it){
  it._o = it._o || shuffle(it.o.map((t,i)=>({t,ok:i===it.a})));
  return `<p class="q">${md(it.q)}</p><div class="opts">${it._o.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd><span>${md(o.t)}</span></button>`).join('')}</div><div id="fb"></div>`;
}
function quizB(it){
  const answer = i => {
    const btns=[...app.querySelectorAll('.opt')]; if(btns[0].disabled) return;
    btns.forEach(b=>b.disabled=true);
    const ok=it._o[i].ok;
    done(it, ok, {pick:it._o[i].t});
    if(S.exam){ btns[i].classList.add('pick'); setTimeout(advance,180); return; }
    btns.forEach((b,j)=>{ if(it._o[j].ok) b.classList.add('ok'); else if(j===i) b.classList.add('no'); });
    $('#fb').innerHTML = `<div class="x ${ok?'':'bad'}"><b>${ok?'Správně ✓':'Špatně ✗'}</b>${md(it.x)}</div>`+nextBtn(); bindNext();
  };
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.i));
  keyH = e => { const n=+e.key; if(n>=1&&n<=it._o.length) answer(n-1); };
}

// command
const normCmd = s => s.trim().replace(/^\$\s*/,'').replace(/\s+/g,' ');
function cmdV(it){
  return `<p class="q">${md(it.q)}</p><div class="term"><div class="term-bar"><i></i><i></i><i></i><span>bash</span></div><div class="term-body"><div id="tlog"></div>
    <div class="tin"><span class="ps">$</span><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="napiš příkaz a stiskni Enter"></div></div></div>
    <div class="next" id="cact"><button class="btn ghost" id="reveal">Nevím, ukaž řešení</button><span class="hint">Enter = zkontrolovat</span></div><div id="fb"></div>`;
}
function cmdB(it){
  let tries=0; const inp=$('#tin'), log=$('#tlog'); inp.focus();
  const fin = (ok, said) => {
    inp.disabled=true; $('#cact').remove(); done(it, ok, {pick:said});
    if(S.exam){ setTimeout(advance,150); return; }
    $('#fb').innerHTML = `<div class="x ${ok?'':'bad'}"><b>${ok?'Správně ✓':'Řešení'}</b><div class="fixl">$ ${esc(it.s)}</div><div style="margin-top:6px">${md(it.x)}</div></div>`+nextBtn(); bindNext();
  };
  inp.onkeydown = e => {
    if(e.key!=='Enter') return; e.stopPropagation();
    const v=normCmd(inp.value); if(!v) return;
    const ok = it.a.some(r=>new RegExp(r).test(v));
    log.insertAdjacentHTML('beforeend',`<div class="tl you">$ ${esc(v)}</div>`);
    if(ok){ log.insertAdjacentHTML('beforeend',`<div class="tl ok">✓ přesně tak</div>`); return fin(tries===0, v); }
    tries++; inp.value='';
    if(S.exam) return fin(false, v);
    log.insertAdjacentHTML('beforeend',`<div class="tl no">✗ tohle nesedí${tries===1?' – zkus to znovu':` – nápověda: začíná <b>${esc(it.s.split(' ')[0])}</b>`}</div>`);
    if(tries>=3) fin(false, v);
  };
  $('#reveal').onclick=()=>fin(false,'(neví)');
}

// fix
function fixV(it){
  return `<p class="q">${esc(it.title)}</p><p class="sub" style="margin-top:-10px">${md(it.ctx)} <b>Klikni na chybný řádek.</b></p>
    <div class="code" id="code"><div class="fn">${esc(it.lang)}</div>${it.code.map((l,i)=>`<div class="ln" data-l="${i}"><span class="no">${i+1}</span><span class="tx">${esc(l)||' '}</span></div>`).join('')}</div><div id="fb"></div>`;
}
function fixB(it){
  const code=$('#code');
  code.querySelectorAll('.ln').forEach(l=>l.onclick=()=>{
    if(code.classList.contains('done')) return; code.classList.add('done');
    const i=+l.dataset.l, ok=it.bad.includes(i);
    done(it, ok, {pick:'řádek '+(i+1)});
    if(S.exam){ setTimeout(advance,150); return; }
    it.bad.forEach(b=>code.querySelector(`[data-l="${b}"]`).classList.add(ok?'good':'bad'));
    if(!ok) l.classList.add('wrong');
    $('#fb').innerHTML=`<div class="x ${ok?'':'bad'}"><b>${ok?'Našel jsi to ✓':'Vedle – chyba je na řádku '+it.bad.map(b=>b+1).join(' a ')}</b>${md(it.x)}<div class="fixl">→ ${esc(it.fix)}</div></div>`+nextBtn(); bindNext();
  });
}

// results
function finish(){
  clearInterval(S.tick);
  if(S.exam){ S.res.forEach(r=>record(r.id,r.ok)); }
  const n=S.list.length, ok=S.res.filter(r=>r.ok).length, dur=Math.round((Date.now()-S.t0)/1000);
  if(S.exam){ D.exams.push({d:today(),score:ok,n,dur}); save(); }
  const pct=Math.round(ok/n*100);
  const missed = S.list.filter((it,i)=>!S.res[i] || !S.res[i].ok);
  const ans = it => it.k==='quiz'?it.o[it.a]:it.k==='cmd'?'$ '+it.s:'řádek '+it.bad.map(b=>b+1).join(', ')+': '+it.fix;
  app.innerHTML = `<h1>${S.exam?'Výsledek testu':'Hotovo'}</h1>
    <div class="card" style="display:flex;gap:30px;align-items:center;flex-wrap:wrap;margin:16px 0 8px">
      <div class="big">${ok}<small>/${n}</small></div>
      <div><div style="font-size:18px;font-weight:600">${pct>=85?'Výborně 💪':pct>=70?'Dobrý základ':pct>=50?'Půl na půl, opakuj chyby':'Tady je co dohánět'}</div>
      <div class="hint" style="font-size:13.5px">${pct} % · čas ${fmtT(dur)}${S.exam&&pct>=72?' · u AWS zkoušek se prochází kolem 72 %':''}</div></div>
    </div>
    <div class="row" style="margin:14px 0 6px"><a class="btn" href="#/">Přehled</a>${missed.length?`<button class="btn ghost" id="again">Procvičit těch ${missed.length} chyb</button>`:''}</div>
    ${missed.length?`<h2>Co nevyšlo</h2><ul class="rl">${missed.map(it=>`<li class="no"><b>${it.k==='fix'?esc(it.title):md(it.q)}</b><div class="a">✓ ${md(ans(it))}</div><div class="a">${md(it.x)}</div></li>`).join('')}</ul>`:''}`;
  const a=$('#again'); if(a) a.onclick=()=>run(shuffle(missed),{title:'Chyby'});
  S=null; keyH=null; NB.setItem(null);
}


// ---------- poznámkový blok (pop-up) ----------
function summary(it){
  const h = `## ${TOPICS[it.t]} · ${{quiz:'kvíz',cmd:'příkaz',fix:'najdi chybu'}[it.k]}`;
  if(it.k==='quiz') return `${h}\n${it.q}\n→ ${it.o[it.a]}\n  ${it.x}`;
  if(it.k==='cmd') return `${h}\n${it.q}\n$ ${it.s}\n  ${it.x}`;
  return `${h}\n${it.title} (${it.lang})\n→ ${it.fix}\n  ${it.x}`;
}
const NB = (() => {
  const btn=$('#nbtn'), pan=$('#npanel'), ta=$('#nta'), ita=$('#nita'), tabs=pan.querySelectorAll('[data-nt]'), info=$('#ninfo'), list=$('#nlist');
  let cur=null, tab='main', tmr;
  const saveSoon = () => { clearTimeout(tmr); tmr=setTimeout(save,300); };
  ta.value = D.notes||'';
  ta.oninput = () => { D.notes=ta.value; saveSoon(); };
  ita.oninput = () => { if(!cur) return; const v=ita.value; if(v.trim()) D.inotes[cur.id]=v; else delete D.inotes[cur.id]; saveSoon(); };
  const label = it => it.k==='fix'?it.title:it.q;
  function renderList(){
    const ids=Object.keys(D.inotes).filter(id=>byId[id]);
    list.innerHTML = ids.length ? ids.map(id=>{ const it=byId[id]; return `<div class="ni"><div class="nq"><span class="tag">${TOPICS[it.t]}</span> ${md(label(it))}</div><div class="nt">${esc(D.inotes[id])}</div><button class="link" data-del="${id}">smazat</button></div>`; }).join('')
      : '<p class="hint" style="padding:6px 2px">Zatím žádné poznámky k úlohám. Během procvičování otevři blok a přepni na „K úloze“.</p>';
    list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ delete D.inotes[b.dataset.del]; save(); renderList(); if(cur&&cur.id===b.dataset.del) ita.value=''; });
  }
  function setTab(t){
    if(t==='item' && !cur) t='main';
    tab=t; tabs.forEach(b=>b.classList.toggle('on',b.dataset.nt===t));
    pan.querySelectorAll('[data-pane]').forEach(x=>x.hidden = x.dataset.pane!==t);
    if(t==='all') renderList();
    (t==='main'?ta:t==='item'?ita:null)?.focus();
  }
  function setItem(it){
    cur=it; const itab=pan.querySelector('[data-nt="item"]'); itab.disabled=!it;
    if(it){ info.innerHTML=`<span class="tag">${TOPICS[it.t]}</span> ${md(label(it))}`; ita.value=D.inotes[it.id]||''; }
    else { info.textContent=''; ita.value=''; if(tab==='item') setTab('main'); }
  }
  const isOpen = () => !pan.hidden;
  function open(t){ pan.hidden=false; btn.classList.add('on'); setTab(t||tab); }
  function close(){ pan.hidden=true; btn.classList.remove('on'); ($('#nx')||$('#tin'))?.focus(); }
  const toggle = () => isOpen()?close():open();
  function append(text){ D.notes = (D.notes&&!D.notes.endsWith('\n')?D.notes+'\n\n':D.notes) + text + '\n'; ta.value=D.notes; save(); open('main'); ta.scrollTop=ta.scrollHeight; }
  btn.onclick=toggle; $('#nclose').onclick=close;
  tabs.forEach(b=>b.onclick=()=>setTab(b.dataset.nt));
  $('#ncopy').onclick=()=>{ navigator.clipboard?.writeText(ta.value); $('#ncopy').textContent='✓ Zkopírováno'; setTimeout(()=>$('#ncopy').textContent='Kopírovat',1200); };
  $('#ndl').onclick=()=>{ const b=new Blob([ta.value],{type:'text/markdown'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='devops-poznamky.md'; a.click(); };
  return {open,close,toggle,isOpen,setItem,append,reload(){ ta.value=D.notes||''; renderList(); }};
})();

// ---------- routes ----------
let keyH=null;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && NB.isOpen()){ NB.close(); return; }
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if((e.key==='n'||e.key==='N') && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); NB.toggle(); return; }
  if(e.key==='Enter' && $('#nx')){ e.preventDefault(); advance(); return; }
  if(keyH) keyH(e);
});
function route(){
  const r=location.hash.replace(/^#\/?/,'');
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===r.split('/')[0]));
  if(S && S.tick) clearInterval(S.tick); S=null; keyH=null; NB.setItem(null); window.scrollTo(0,0);
  if(r==='quiz') return setup('quiz','Kvíz','Otázky s okamžitým vysvětlením. Odpovídat můžeš i klávesami 1–4.');
  if(r==='cmd') return setup('cmd','Příkazy','Napiš příkaz z hlavy jako v terminálu. Na úlohu máš 3 pokusy, po prvním omylu dostaneš nápovědu.');
  if(r==='fix') return setup('fix','Najdi chybu','Rozbitý Dockerfile, YAML, Terraform nebo policy. Najdi řádek, který to způsobuje.');
  if(r==='review'){ const l=ITEMS.filter(i=>needsReview(i.id)); return l.length ? run(shuffle(l).slice(0,20),{title:'Opakování'}) : (app.innerHTML=`<div class="empty"><h1>Nic k opakování ✓</h1><p>Co pokazíš, objeví se tady, dokud to 2× za sebou nedáš správně.</p><a class="btn" href="#/quiz">Jít trénovat</a></div>`); }
  if(r==='mix') return run(pick(ITEMS.filter(i=>selTopics().includes(i.t)),10),{title:'Mix'});
  if(r==='exam') return examSetup();
  dash();
}
function examSetup(){
  const pool=()=>ITEMS.filter(i=>i.k==='quiz'&&selTopics().includes(i.t));
  const r=()=>{ const p=pool(), n=Math.min(30,p.length);
    app.innerHTML=`<h1>Test na čas</h1><p class="sub">${n} otázek, ${n} minut. Žádné nápovědy ani vysvětlení během testu – vyhodnocení až na konci, jako u certifikace.</p>${topicChips('quiz')}
      <div class="row"><button class="btn" id="go" ${n?'':'disabled'}>Spustit test</button></div>`;
    bindChips(r);
    $('#go').onclick=()=>run(shuffle(p).slice(0,n).map(x=>({...x,_o:null})),{exam:true,limit:n*60,title:'Test'});
  }; r();
}
window.addEventListener('hashchange',route);

// ---------- export / import / reset ----------
$('#exp').onclick=()=>{ const b=new Blob([JSON.stringify(D)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='devops-lab-postup.json'; a.click(); };
$('#imp').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const j=JSON.parse(t); if(j&&j.items){ D=j; D.notes??=''; D.inotes||={}; save(); NB.reload(); badge(); route(); } }catch(_){ alert('Soubor se nepodařilo načíst.'); } }); };
$('#reset').onclick=()=>{ if(confirm('Opravdu smazat celý postup?')){ D={items:{},days:[],exams:[],topics:[],notes:D.notes,inotes:D.inotes}; save(); badge(); route(); } };

badge(); route();
})();
