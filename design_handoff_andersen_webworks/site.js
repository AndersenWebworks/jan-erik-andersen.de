/* ═══ Andersen Webworks — site interactions ═══ */
(function(){
  /* theme toggle (persisted) */
  const body = document.body;
  const tbtn = document.getElementById('theme-toggle');
  const ticon = document.getElementById('theme-icon');
  const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
  const MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>';
  function setTheme(t){
    body.dataset.theme = t;
    if(ticon) ticon.innerHTML = t==='dark' ? SUN : MOON;
    try{ localStorage.setItem('aw_theme', t); }catch(e){}
    // tell the embedded kompass to match
    const kp = document.getElementById('kp-hero');
    if(kp && kp.contentWindow){ try{ kp.contentWindow.postMessage({type:'aw-theme',theme:t},'*'); }catch(e){} }
  }
  if(tbtn) tbtn.addEventListener('click', ()=> setTheme(body.dataset.theme==='dark'?'light':'dark'));
  try{ setTheme(localStorage.getItem('aw_theme') || 'light'); }catch(e){ setTheme('light'); }
  // re-sync theme to the kompass once its iframe is ready
  const kpHero = document.getElementById('kp-hero');
  if(kpHero) kpHero.addEventListener('load', ()=>{
    try{ kpHero.contentWindow.postMessage({type:'aw-theme',theme:body.dataset.theme||'light'},'*'); }catch(e){}
  });

  /* sticky header shadow */
  const topbar = document.getElementById('topbar');
  const onScroll = ()=>{ if(topbar) topbar.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* mobile menu */
  const mm = document.getElementById('mobile-menu');
  const open = document.getElementById('menu-open');
  const close = document.getElementById('menu-close');
  function setMenu(o){ if(!mm) return; mm.classList.toggle('open', o); body.style.overflow = o?'hidden':''; }
  if(open) open.addEventListener('click', ()=>setMenu(true));
  if(close) close.addEventListener('click', ()=>setMenu(false));
  if(mm) mm.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>setMenu(false)));

  /* logo wall marquee */
  const LOGOS = ['Gerwing Steinwerke','Runden Group','WBG Pooling','Woodshed Studio','CASARO',
    'Dark Fortress','Goodgame Studios','Deep Silver FISHLABS','Daedalic','dcorr','Ecobyte',
    'Planworks','RPLC','Rubetrans','Beachhouse Studio','InnoGames','YOOtheme'];
  const track = document.getElementById('mtrack');
  if(track){
    const chip = name => '<span class="logo-chip"><span class="bullet"></span>'+name+'</span>';
    const html = LOGOS.map(chip).join('');
    track.innerHTML = html + html; // duplicate for seamless loop
  }

  /* scroll reveal */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* kompass iframe height sync */
  window.addEventListener('message', (e)=>{
    const d = e.data;
    if(d && d.type==='kp-height'){
      document.querySelectorAll('iframe.kp-frame').forEach(f=>{
        if(f.contentWindow===e.source){ f.style.height = Math.max(d.h, 380) + 'px'; }
      });
    }
  });
})();
