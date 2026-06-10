/* ─── JEA Webworks styleguide — canvas controller ─── */
(function(){
  const canvas = document.getElementById('canvas');
  const sizer  = document.getElementById('sizer');
  const stage  = document.getElementById('stage');
  const zval   = document.getElementById('zval');

  let z = 1;
  const MIN = 0.12, MAX = 2;

  /* ---- lazy-load iframes + auto height ---- */
  function loadFrames(){
    document.querySelectorAll('iframe[data-src]').forEach(f => {
      f.addEventListener('load', () => {
        if (f.classList.contains('auto')) {
          try {
            const doc = f.contentDocument;
            const h = Math.max(
              doc.body.scrollHeight,
              doc.documentElement.scrollHeight
            );
            if (h > 40) f.style.height = h + 'px';
          } catch(e){}
        }
        relayout();
      });
      f.src = f.dataset.src;
    });
  }

  /* ---- layout / zoom ---- */
  function relayout(){
    const w = stage.offsetWidth;
    const h = stage.offsetHeight;
    sizer.style.width  = (w * z) + 'px';
    sizer.style.height = (h * z) + 'px';
    stage.style.transform = 'scale(' + z + ')';
  }

  function setZoom(nz, cx, cy){
    nz = Math.max(MIN, Math.min(MAX, nz));
    // keep the point (cx,cy) in the canvas viewport stable
    let ax, ay;
    if (cx == null){
      ax = canvas.clientWidth/2; ay = canvas.clientHeight/2;
    } else { ax = cx; ay = cy; }
    const beforeX = (canvas.scrollLeft + ax) / z;
    const beforeY = (canvas.scrollTop  + ay) / z;
    z = nz;
    relayout();
    canvas.scrollLeft = beforeX * z - ax;
    canvas.scrollTop  = beforeY * z - ay;
    zval.textContent = Math.round(z*100) + '%';
  }

  function fit(){
    // fit full stage width into canvas
    const pad = 40;
    const natW = stage.offsetWidth;
    const natH = stage.offsetHeight;
    const zw = (canvas.clientWidth  - pad) / natW;
    const zh = (canvas.clientHeight - pad) / natH;
    z = Math.max(MIN, Math.min(MAX, Math.min(zw, zh)));
    relayout();
    zval.textContent = Math.round(z*100) + '%';
    // center
    canvas.scrollLeft = (sizer.offsetWidth  - canvas.clientWidth)/2;
    canvas.scrollTop  = 0;
  }

  function homeView(){
    // comfortable readable default anchored at the first artboard
    z = 0.5;
    // if the desktop artboard would overflow the canvas width, shrink to fit it
    const first = document.getElementById('art-desktop');
    if (first){
      const fw = first.offsetWidth;
      const avail = canvas.clientWidth - 80;
      if (fw * z > avail) z = Math.max(MIN, avail / fw);
    }
    relayout();
    zval.textContent = Math.round(z*100) + '%';
    canvas.scrollLeft = 0;
    canvas.scrollTop = 0;
    if (first) select(first, false);
  }

  /* ---- zoom controls ---- */
  document.getElementById('zoomIn').onclick  = () => setZoom(z * 1.2);
  document.getElementById('zoomOut').onclick = () => setZoom(z / 1.2);
  document.getElementById('zoomFit').onclick = () => fit();
  document.getElementById('resetBtn').onclick = () => { homeView(); };

  /* ctrl/cmd + wheel to zoom */
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey){
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 1/1.12;
      setZoom(z * factor, e.clientX - r.left, e.clientY - r.top);
    }
  }, { passive:false });

  /* ---- drag to pan (on canvas background) ---- */
  let panning = false, sx=0, sy=0, sl=0, st=0;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.target.closest('iframe')) return;          // let iframe interactions through
    if (e.target.closest('.layer, .tool, button, a')) return;
    panning = true;
    canvas.classList.add('panning');
    sx = e.clientX; sy = e.clientY;
    sl = canvas.scrollLeft; st = canvas.scrollTop;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!panning) return;
    canvas.scrollLeft = sl - (e.clientX - sx);
    canvas.scrollTop  = st - (e.clientY - sy);
  });
  function endPan(e){
    if (!panning) return;
    panning = false;
    canvas.classList.remove('panning');
    try{ canvas.releasePointerCapture(e.pointerId); }catch(_){}
  }
  canvas.addEventListener('pointerup', endPan);
  canvas.addEventListener('pointercancel', endPan);

  /* ---- selection + inspector ---- */
  const rp = {
    name: document.getElementById('insName'),
    type: document.getElementById('insType'),
    w: document.getElementById('insW'),
    h: document.getElementById('insH'),
    note: document.getElementById('insNote')
  };
  function select(art, scroll){
    document.querySelectorAll('.art.is-sel').forEach(a => a.classList.remove('is-sel'));
    document.querySelectorAll('.layer.sel').forEach(l => l.classList.remove('sel'));
    art.classList.add('is-sel');
    const lyr = document.querySelector('.layer[data-target="'+art.id+'"]');
    if (lyr) lyr.classList.add('sel');
    const dim = (art.dataset.dim || '').split('×');
    rp.name.innerHTML = art.dataset.name || art.id;
    rp.w.textContent = (dim[0]||'').trim() || '—';
    rp.h.textContent = (dim[1]||'').trim() || 'auto';
    rp.note.textContent = art.dataset.note || '';
    if (scroll) scrollToArt(art);
  }
  function scrollToArt(art){
    const cr = canvas.getBoundingClientRect();
    const ar = art.getBoundingClientRect();
    canvas.scrollLeft += (ar.left - cr.left) - 64;
    canvas.scrollTop  += (ar.top  - cr.top)  - 64;
  }

  document.querySelectorAll('.art').forEach(art => {
    art.addEventListener('pointerdown', (e) => {
      if (e.target.closest('iframe')) { select(art, false); return; }
      select(art, false);
    });
  });

  document.querySelectorAll('.layer[data-target]').forEach(lyr => {
    lyr.addEventListener('click', () => {
      const art = document.getElementById(lyr.dataset.target);
      if (art) select(art, true);
    });
  });

  /* ---- left panel tabs ---- */
  document.querySelectorAll('.lp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lp-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const layers = document.getElementById('layersWrap');
      const assets = document.getElementById('assetsWrap');
      if (tab.dataset.tab === 'assets'){
        layers.classList.add('hide'); assets.classList.add('show');
      } else {
        layers.classList.remove('hide'); assets.classList.remove('show');
      }
    });
  });

  /* kompass embed height sync */
  window.addEventListener('message', (e)=>{
    const d = e.data;
    if(d && d.type==='kp-height'){
      document.querySelectorAll('iframe.kp').forEach(f=>{
        if(f.contentWindow===e.source){ f.style.height = Math.max(d.h, 360) + 'px'; relayout(); }
      });
    }
  });

  /* ---- init ---- */
  loadFrames();
  // initial view once layout settles
  setTimeout(() => { homeView(); }, 250);
  window.addEventListener('resize', () => relayout());
  // re-anchor a touch later after fonts/frames settle
  setTimeout(() => { relayout(); }, 1400);
})();
