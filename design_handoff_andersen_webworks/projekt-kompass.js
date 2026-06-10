/* ── Projekt-Kompass — improved 4-step recommender ── */
(function(){
  const I = {
    web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M8 21h8"/></svg>',
    shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5 7h14l-1 13H6L5 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    redo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4"/></svg>',
    care:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"/><path d="M9 12l2 2 4-4"/></svg>',
    audit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
    a11y:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="1.6"/><path d="M4 8h16M12 8v6m0 0l-3 6m3-6l3 6"/></svg>',
    ai:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M5 8l2 2M19 8l-2 2"/><rect x="6" y="10" width="12" height="9" rx="2"/><path d="M9.5 14h.01M14.5 14h.01"/></svg>',
    globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
    crm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11l2 2 3-3"/></svg>',
    bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
    pages:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>'
  };

  // step 1 — need
  const NEEDS = [
    {id:'website', ico:I.web, t:'Neue Website', d:'Firmenseite, Landingpage oder Portal – von Null gebaut'},
    {id:'shop',    ico:I.shop, t:'Online-Shop', d:'WooCommerce mit Produkten, Warenkorb, Check-out'},
    {id:'redesign',ico:I.redo, t:'Redesign / Verbesserung', d:'Bestehende Seite auffrischen, schneller & barrierefrei'},
    {id:'betreuung',ico:I.care, t:'Laufende Betreuung', d:'Updates, Sicherheit, Content-Pflege, ein Ansprechpartner'},
    {id:'analyse', ico:I.audit, t:'Website-Analyse', d:'Audit: Was läuft, was nicht, was kostet die Behebung'}
  ];

  // per-need q2 (single, base price) + q3 (multi extras OR single tier) + included bullets
  const FLOWS = {
    website:{
      unit:'Festpreis', pkg:'Firmenwebsite',
      q2:{title:'Wie groß wird die Website?', hint:'Grobe Einordnung genügt.', multi:false, options:[
        {id:'landing', ico:I.bolt, t:'Landingpage', d:'1–3 fokussierte Seiten', price:[2400,3200], pkg:'Landingpage'},
        {id:'firma',   ico:I.pages, t:'Firmenwebsite', d:'5–10 Seiten, klassischer Auftritt', price:[2400,5000], pkg:'Firmenwebsite'},
        {id:'portal',  ico:I.box, t:'Umfangreich / Portal', d:'10+ Seiten, Tools, Bereiche', price:[5000,12000], pkg:'Portal / Custom'}
      ]},
      q3:{title:'Was soll mit dabei sein?', hint:'Mehrfachauswahl möglich – oder weiter ohne.', multi:true, options:[
        {id:'bfsg', ico:I.a11y, t:'Barrierefreiheit (BFSG)', d:'WCAG 2.1 AA – Pflicht für B2C', add:[800,2000]},
        {id:'ki',   ico:I.ai, t:'KI-Sichtbarkeit', d:'Zitiert in ChatGPT & Perplexity', add:[800,1500]},
        {id:'multi',ico:I.globe, t:'Mehrsprachig', d:'z. B. DE / EN', add:[600,1800]},
        {id:'custom',ico:I.box, t:'Custom-Funktion', d:'Portal, Tool, Rechner …', add:[1200,4000]}
      ]},
      incl:['Konzept, Design & Umsetzung','Responsive & DSGVO-konform','CMS-Einweisung','30 Tage Support nach Launch','Lektorat durch Annemarie Andersen']
    },
    shop:{
      unit:'Festpreis', pkg:'WooCommerce-Shop',
      q2:{title:'Was für ein Shop wird es?', hint:'', multi:false, options:[
        {id:'standard', ico:I.shop, t:'Standard-Shop', d:'bis 50 Produkte, Check-out, Zahlung', price:[4800,9000], pkg:'Standard-Shop'},
        {id:'b2b',      ico:I.crm, t:'B2B-Shop', d:'Preisgruppen, Händlerportal', price:[7500,15000], pkg:'B2B-Shop'},
        {id:'gross',    ico:I.box, t:'Großer Katalog', d:'500+ Produkte, Filter & Varianten', price:[9000,18000], pkg:'Katalog-Shop'}
      ]},
      q3:{title:'Welche Extras brauchen Sie?', hint:'Mehrfachauswahl möglich.', multi:true, options:[
        {id:'muster', ico:I.box, t:'Musterbestellsystem', d:'mit E-Mail-Nachverfolgung', add:[800,2500]},
        {id:'crm',    ico:I.crm, t:'CRM-Anbindung', d:'z. B. Salesforce Web-to-Lead', add:[1000,3000]},
        {id:'bfsg',   ico:I.a11y, t:'Barrierefreiheit (BFSG)', d:'WCAG 2.1 AA', add:[800,2000]},
        {id:'ki',     ico:I.ai, t:'KI-Sichtbarkeit', d:'Schema & strukturierte Daten', add:[800,1500]}
      ]},
      incl:['Produktstruktur + Varianten','Check-out + Zahlungsanbindung','Germanized (Rechtstexte, E-Rechnung)','Schulung Produktverwaltung','Lektorat inklusive']
    },
    redesign:{
      unit:'Festpreis', pkg:'Redesign',
      q2:{title:'Was stört Sie am meisten?', hint:'', multi:false, options:[
        {id:'veraltet', ico:I.redo, t:'Sieht veraltet aus', d:'Design & Struktur überholen', price:[1800,6000], pkg:'Redesign'},
        {id:'langsam',  ico:I.bolt, t:'Zu langsam', d:'Performance & Ladezeit', price:[800,3000], pkg:'Performance-Optimierung'},
        {id:'mobil',    ico:I.web, t:'Nicht mobilfähig', d:'Responsive Umbau', price:[1200,4000], pkg:'Responsive-Redesign'},
        {id:'bfsg',     ico:I.a11y, t:'Nicht barrierefrei', d:'BFSG-Nachrüstung', price:[1200,4000], pkg:'BFSG-Update'}
      ]},
      q3:{title:'Erst prüfen oder direkt los?', hint:'', multi:false, options:[
        {id:'analyse', ico:I.audit, t:'Erst eine Analyse', d:'Bericht mit Prioritäten, ab 400 €', flag:'analyse'},
        {id:'direkt',  ico:I.bolt, t:'Direkt umsetzen', d:'Ich weiß, was raus muss'}
      ]},
      incl:['Konkrete Analyse, was nicht stimmt','Gezielte Behebung statt Pauschal-Neubau','Offene Standards, kein Lock-in','Lektorat inklusive']
    },
    betreuung:{
      unit:'/Monat', pkg:'Betreuung',
      q2:{title:'Was soll betreut werden?', hint:'', multi:false, options:[
        {id:'website', ico:I.web, t:'Eine Website', d:'Updates, Sicherheit, Content', price:[200,400], pkg:'Betreuung Basis/Standard'},
        {id:'shop',    ico:I.shop, t:'Ein Online-Shop', d:'WooCommerce-Pflege', price:[800,800], pkg:'Betreuung Shop'},
        {id:'mehrere', ico:I.box, t:'Mehrere Websites', d:'Firmengruppe / Portfolio', price:[400,1200], pkg:'Betreuung Standard+'}
      ]},
      q3:{title:'Wie viel Support pro Monat?', hint:'', multi:false, options:[
        {id:'wenig',  ico:I.clock, t:'Wenig', d:'≈ 2,5 Std. · Basis', tier:'Basis'},
        {id:'mittel', ico:I.clock, t:'Mittel', d:'≈ 5 Std. · Standard', tier:'Standard'},
        {id:'viel',   ico:I.clock, t:'Viel', d:'≈ 10 Std. · Shop / Premium', tier:'Premium'}
      ]},
      incl:['Updates, Sicherheit & Monitoring','Content-Änderungen','Direkte Erreichbarkeit','Monatlich kündbar – keine Bindung']
    },
    analyse:{
      unit:'einmalig', pkg:'Website-Analyse',
      q2:{title:'Worauf soll ich schauen?', hint:'Mehrfachauswahl möglich.', multi:true, options:[
        {id:'perf', ico:I.bolt, t:'Performance', d:'Ladezeit & Technik', add:[0,0]},
        {id:'seo',  ico:I.audit, t:'SEO', d:'Auffindbarkeit bei Google', add:[0,100]},
        {id:'bfsg', ico:I.a11y, t:'Barrierefreiheit (BFSG)', d:'WCAG-Check', add:[0,200]},
        {id:'ki',   ico:I.ai, t:'KI-Sichtbarkeit', d:'Schema & strukturierte Daten', add:[0,200]}
      ]},
      q3:{title:'Wie groß ist die Seite?', hint:'', multi:false, options:[
        {id:'klein', ico:I.pages, t:'Klein', d:'Bis ~10 Seiten', add:[0,0]},
        {id:'mittel',ico:I.pages, t:'Mittel', d:'10–30 Seiten', add:[100,300]},
        {id:'gross', ico:I.box, t:'Groß / Shop', d:'30+ Seiten oder Shop', add:[300,600]}
      ]},
      base:[400,400],
      incl:['Konkreter Bericht mit Prioritäten','Aufwandsschätzungen je Maßnahme','Handlungsempfehlungen','Ehrlich: auch ob Neubau günstiger ist']
    }
  };

  const TIMING = [
    {id:'sofort', ico:I.bolt, t:'So bald wie möglich', d:'Es eilt'},
    {id:'quartal',ico:I.clock, t:'In 1–3 Monaten', d:'Geplant, aber nicht akut'},
    {id:'orient', ico:I.map, t:'Erst mal orientieren', d:'Noch unverbindlich'}
  ];
  const TIMING_COPY = {
    sofort:'Es eilt — ich bin in der Regel <b>innerhalb von zwei Wochen</b> verfügbar. Schreiben Sie kurz, was ansteht.',
    quartal:'Guter Zeitrahmen. Im <b>kostenlosen Erstgespräch</b> legen wir Umfang und konkreten Festpreis fest.',
    orient:'Noch unverbindlich — völlig okay. Das Erstgespräch ist <b>kostenlos und ohne Verkaufsdruck</b>.'
  };

  // ── state ── (q2/q3 hold a string for single-select, an array for multi)
  const state = { step:0, need:null, q2:null, q3:null, timing:null };
  const EMBED = (window.self !== window.top) || location.hash.indexOf('embed') > -1;
  if(EMBED) document.body.classList.add('embed');
  window.addEventListener('message', (e)=>{
    if(e.data && e.data.type==='aw-theme'){
      document.documentElement.setAttribute('data-theme', e.data.theme);
      postHeight();
    }
  });
  function postHeight(){
    if(!EMBED) return;
    const el = document.getElementById('kompass');
    try{ parent.postMessage({type:'kp-height', h: el.offsetHeight}, '*'); }catch(e){}
  }
  const body  = document.getElementById('kpBody');
  const qEl   = document.getElementById('kpQ');
  const hintEl= document.getElementById('kpHint');
  const countEl=document.getElementById('kpCount');
  const backBtn=document.getElementById('kpBack');
  const nextBtn=document.getElementById('kpNext');
  const foot  = document.getElementById('kpFoot');
  const head  = document.querySelector('.kp-head');
  const prog  = document.getElementById('kpProg').children;

  function fmt(n){ return n.toLocaleString('de-DE'); }
  function checkIco(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-11"/></svg>'; }

  function optMarkup(o, multi, selected){
    return '<button class="opt'+(selected?' sel':'')+'" data-id="'+o.id+'" type="button">'+
      '<span class="ico">'+o.ico+'</span>'+
      '<span class="txt"><b>'+o.t+'</b><span>'+o.d+'</span></span>'+
      '<span class="check'+(multi?' sq':'')+'">'+checkIco()+'</span>'+
    '</button>';
  }

  function curStepDef(){
    if(state.step===0) return {title:'Was möchten Sie umsetzen?', hint:'60 Sekunden, dann kennen Sie Lösung, Preisrahmen und Schritt.', multi:false, options:NEEDS, key:'need'};
    const f = FLOWS[state.need];
    if(state.step===1) return Object.assign({key:'q2'}, f.q2);
    if(state.step===2) return Object.assign({key:'q3'}, f.q3);
    if(state.step===3) return {title:'Wann soll es losgehen?', hint:'', multi:false, options:TIMING, key:'timing'};
  }

  function selectedFor(key){
    const v = state[key];
    if(Array.isArray(v)) return v.slice();
    if(v) return [v];
    return [];
  }

  function render(){
    if(state.step>3){ renderResult(); return; }
    const def = curStepDef();
    head.style.display=''; foot.style.display='';
    qEl.textContent = def.title;
    hintEl.textContent = def.hint || '';
    hintEl.style.display = def.hint ? '' : 'none';
    countEl.textContent = 'Schritt '+(state.step+1)+' von 4';
    // progress
    for(let i=0;i<4;i++){
      prog[i].className='seg'+(i<state.step?' done':(i===state.step?' active':''));
    }
    const sel = selectedFor(def.key);
    body.innerHTML = '<div class="step show"><div class="opts">'+
      def.options.map(o=>optMarkup(o, def.multi, sel.indexOf(o.id)>-1)).join('')+
    '</div></div>';
    backBtn.hidden = state.step===0;
    // multi steps use an explicit Next (extras can be skipped); single auto-advance
    nextBtn.style.display = def.multi ? '' : 'none';
    if(def.multi){
      nextBtn.disabled = false;
      nextBtn.innerHTML = (sel.length? 'Weiter':'Überspringen')+' <span class="arr">→</span>';
    }
    body.querySelectorAll('.opt').forEach(btn=>{
      btn.addEventListener('click', ()=>onPick(def, btn.dataset.id));
    });
    postHeight(); setTimeout(postHeight, 60);
  }

  function onPick(def, id){
    const key = def.key;
    if(def.multi){
      let arr = state[key]; if(!Array.isArray(arr)){ arr=[]; state[key]=arr; }
      const i = arr.indexOf(id);
      if(i>-1) arr.splice(i,1); else arr.push(id);
      body.querySelector('.opt[data-id="'+id+'"]').classList.toggle('sel');
      nextBtn.innerHTML = (arr.length?'Weiter':'Überspringen')+' <span class="arr">→</span>';
      return;
    }
    // single-select → store, reset downstream on need change, then auto-advance
    if(key==='need' && state.need!==id){ state.need=id; state.q2=null; state.q3=null; }
    state[key]=id;
    body.querySelectorAll('.opt').forEach(b=>b.classList.remove('sel'));
    body.querySelector('.opt[data-id="'+id+'"]').classList.add('sel');
    setTimeout(()=>{ state.step++; render(); }, 190);
  }

  nextBtn.addEventListener('click', ()=>{ state.step++; render(); });
  backBtn.addEventListener('click', ()=>{ if(state.step>0){ state.step--; render(); } });

  // ── pricing ──
  function addOpt(def, answer, acc){
    if(!def || !def.options) return;
    const ids = Array.isArray(answer) ? answer : (answer?[answer]:[]);
    ids.forEach(id=>{
      const o = def.options.find(x=>x.id===id);
      if(!o) return;
      if(o.price){ acc.min+=o.price[0]; acc.max+=o.price[1]; }
      if(o.add){ acc.min+=o.add[0]; acc.max+=o.add[1]; }
    });
  }
  function computePrice(){
    const f = FLOWS[state.need];
    const acc = {min:0, max:0};
    if(f.base){ acc.min+=f.base[0]; acc.max+=f.base[1]; }
    addOpt(f.q2, state.q2, acc);
    addOpt(f.q3, state.q3, acc);
    return acc;
  }

  // ── result ──
  function renderResult(){
    const f = FLOWS[state.need];
    head.style.display='none'; foot.style.display='none';
    const q2o = (f.q2.options||[]).find(o=>o.id===state.q2);

    // package name: prefer q2 option's pkg, else flow pkg
    let pkg = (q2o && q2o.pkg) ? q2o.pkg : f.pkg;

    // betreuung: refine package by support tier (single q3)
    if(state.need==='betreuung'){
      const q3o = f.q3.options.find(o=>o.id===state.q3);
      if(q3o && q3o.tier){
        pkg = 'Betreuung '+q3o.tier;
        if(q3o.tier==='Basis') pkg='Betreuung Basis';
        if(q3o.tier==='Standard') pkg='Betreuung Standard';
      }
    }

    const {min,max} = computePrice();
    const unit = f.unit;
    let numText, unitText;
    if(unit==='/Monat'){
      // tier nudges the monthly figure within the range
      const tierMap={wenig:0,mittel:0.5,viel:1};
      const t = tierMap[state.q3] != null ? tierMap[state.q3] : 0;
      const monthly = Math.round((min + (max-min)*t)/50)*50 || min;
      numText = 'ab '+fmt(monthly)+' €';
      unitText = '/ Monat · monatlich kündbar';
    } else if(unit==='einmalig'){
      numText = 'ab '+fmt(min||400)+' €';
      unitText = 'einmalig · Analysebericht';
    } else {
      numText = 'ab '+fmt(min)+' €';
      unitText = 'Festpreis · typisch '+fmt(min)+'–'+fmt(max)+' €';
    }

    // included list = base bullets + selected extras (multi only)
    let incl = f.incl.slice();
    const extraLabels = {
      bfsg:'Barrierefreiheit (BFSG / WCAG 2.1 AA)', ki:'KI-Sichtbarkeit (Schema, strukturierte Daten)',
      multi:'Mehrsprachige Umsetzung', custom:'Individuelle Custom-Funktion',
      muster:'Musterbestellsystem mit E-Mail-Tracking', crm:'CRM-Anbindung (z. B. Salesforce)'
    };
    if(f.q3.multi && Array.isArray(state.q3)){
      state.q3.forEach(id=>{ if(extraLabels[id]) incl.push(extraLabels[id]); });
    }
    // redesign: if "erst Analyse" chosen, lead with that
    if(state.need==='redesign' && state.q3==='analyse'){
      pkg = 'Analyse → '+pkg;
      incl = ['Erst Analyse (ab 400 €): Bericht mit Prioritäten'].concat(incl);
    }

    const tcopy = TIMING_COPY[state.timing] || TIMING_COPY.quartal;

    // mailto summary
    const needLabel = (NEEDS.find(n=>n.id===state.need)||{}).t||'';
    const q3summary = (f.q3.multi && Array.isArray(state.q3) && state.q3.length)
      ? state.q3.map(id=>{const o=f.q3.options.find(x=>x.id===id);return o?o.t:id;}).join(', ')
      : (!f.q3.multi && state.q3 ? (f.q3.options.find(o=>o.id===state.q3)||{}).t : '');
    const bodyLines = [
      'Hallo Jan-Erik,', '',
      'über den Projekt-Kompass kam folgende Richtung heraus:',
      '• Bedarf: '+needLabel,
      '• Lösung: '+pkg,
      q2o ? '• Umfang: '+q2o.t : '',
      q3summary ? '• Details: '+q3summary : '',
      '• Preisrahmen: '+numText+' ('+unitText+')',
      '', 'Lassen Sie uns ein Erstgespräch vereinbaren.'
    ].filter(Boolean).join('\n');
    const mailto = 'mailto:mail@andersen-webworks.de?subject='+
      encodeURIComponent('Projekt-Kompass: '+pkg)+'&body='+encodeURIComponent(bodyLines);

    body.innerHTML =
      '<div class="result show">'+
        '<div class="res-top">'+
          '<div class="res-tag">Ihre Richtung</div>'+
          '<h3 class="res-name">'+pkg+'</h3>'+
          '<div class="res-price"><span class="num">'+numText+'</span><span class="unit">'+unitText+'</span></div>'+
        '</div>'+
        '<div class="res-body">'+
          '<div class="res-h">Das ist dabei</div>'+
          '<ul class="res-list">'+incl.map(x=>'<li>'+checkIco()+' <span>'+x+'</span></li>').join('')+'</ul>'+
          '<div class="res-next"><b>Nächster Schritt:</b> '+tcopy+' Den konkreten <b>Festpreis nennt Jan-Erik nach dem Erstgespräch</b> – keine versteckten Kosten.</div>'+
        '</div>'+
        '<div class="res-cta">'+
          '<a class="primary" href="'+mailto+'">Kostenloses Erstgespräch →</a>'+
          '<a class="restart" href="#" id="kpRestart">↺ Nochmal starten</a>'+
        '</div>'+
        '<div class="res-disclaimer">Unverbindliche Orientierung auf Basis Ihrer Angaben. Alle Preise netto. '+
        'Bei Aufgaben ohne klar abgrenzbaren Umfang: 80 €/h netto.</div>'+
      '</div>';

    document.getElementById('kpRestart').addEventListener('click', (e)=>{
      e.preventDefault();
      state.step=0; state.need=null; state.q2=null; state.q3=null; state.timing=null;
      render();
    });
    postHeight(); setTimeout(postHeight, 60);
  }

  render();
})();
