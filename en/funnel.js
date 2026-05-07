/**
 * Advisor Funnel Engine v3 (EN)
 * Premium design: SVG icons, progress dots, decorative elements,
 * directional animations, staggered reveals, scroll lock.
 * Vanilla JS, JSON-driven, no backend.
 * jan-erik-andersen.de — 2026
 */
(function () {
  'use strict';

  var SLIDE_OUT_MS = 350;
  var SLIDE_IN_MS  = 450;
  var PRESS_MS     = 120;

  var funnel   = document.getElementById('funnel');
  var app      = document.getElementById('funnel-app');
  var tree     = null;
  var history  = [];
  var currentNodeId = 'start';
  var lastResultTitle = '';
  var isAnimating = false;

  /* ── SVG Icon Library (Feather-style, 20x20, stroke 1.5) ── */

  var ICONS = {
    monitor: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    'shopping-bag': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
    tool: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    eye: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    'book-open': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    layers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    maximize: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    code: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'file-text': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    'alert-triangle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    mail: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>',
    linkedin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    'refresh-cw': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
    'external-link': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    'chevron-right': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    'arrow-left': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'
  };

  /* ── Icon Mapping by Option Label ────────────────────────── */
  var OPTION_ICON_MAP = [
    /* Start v4.0 */
    { match: 'website or shop',       icon: 'monitor' },
    { match: 'new website',           icon: 'monitor' },
    { match: 'has a problem',         icon: 'alert-triangle' },
    { match: 'ongoing maintenance',   icon: 'shield' },
    { match: 'looking for ongoing',   icon: 'shield' },
    { match: 'get in touch',          icon: 'mail' },
    { match: 'AI visibility',         icon: 'eye' },
    { match: 'interested in AI',      icon: 'eye' },
    { match: 'read on my own',        icon: 'book-open' },
    { match: 'does this cost',        icon: 'file-text' },
    { match: 'comparing providers',   icon: 'search' },
    /* New Website v4.0 */
    { match: 'Company website',       icon: 'monitor' },
    { match: 'Online shop',           icon: 'shopping-bag' },
    { match: 'Web app',               icon: 'code' },
    { match: 'Portal, tool',          icon: 'code' },
    { match: 'customer portal',       icon: 'code' },
    { match: 'Landing page',          icon: 'file-text' },
    { match: 'one-pager',             icon: 'file-text' },
    { match: 'not sure',              icon: 'search' },
    /* Industry */
    { match: 'Industry',              icon: 'tool' },
    { match: 'Manufacturing',         icon: 'tool' },
    { match: 'Law',                   icon: 'shield' },
    { match: 'Consulting',            icon: 'layers' },
    { match: 'Legal',                 icon: 'shield' },
    { match: 'Association',           icon: 'shield' },
    { match: 'Nonprofit',             icon: 'shield' },
    { match: 'Hospitality',           icon: 'monitor' },
    { match: 'Tourism',               icon: 'monitor' },
    { match: 'Holiday',               icon: 'monitor' },
    { match: 'Other industry',        icon: 'layers' },
    /* Scope */
    { match: 'Manageable',            icon: 'file-text' },
    { match: 'Medium',                icon: 'layers' },
    { match: 'Large',                 icon: 'maximize' },
    /* CMS */
    { match: 'manage it ourselves',   icon: 'layers' },
    { match: 'developer handles',     icon: 'code' },
    { match: 'Not sure yet',          icon: 'search' },
    /* Shop v4.0 */
    { match: 'Standard online',       icon: 'shopping-bag' },
    { match: 'B2B',                   icon: 'shopping-bag' },
    { match: 'B2C',                   icon: 'shopping-bag' },
    { match: 'End consumers',         icon: 'shopping-bag' },
    { match: 'Dealers',               icon: 'shopping-bag' },
    { match: 'business customers',    icon: 'shopping-bag' },
    { match: 'Under 50',              icon: 'file-text' },
    { match: '50 to 500',             icon: 'layers' },
    { match: 'Over 500',              icon: 'maximize' },
    { match: 'WooCommerce',           icon: 'shopping-bag' },
    { match: 'something custom',      icon: 'code' },
    { match: 'Standard might',        icon: 'layers' },
    { match: 'simpler for us',        icon: 'layers' },
    { match: 'Fits my budget',        icon: 'chevron-right' },
    { match: 'budget is smaller',     icon: 'file-text' },
    { match: 'catalogue is larger',   icon: 'maximize' },
    { match: 'project is bigger',     icon: 'maximize' },
    /* Portal v4.0 */
    { match: 'Career',                icon: 'layers' },
    { match: 'Post jobs',             icon: 'layers' },
    { match: 'applications',          icon: 'layers' },
    { match: 'Customer portal',       icon: 'shield' },
    { match: 'Customer login',        icon: 'shield' },
    { match: 'view data',             icon: 'shield' },
    { match: 'Internal tool',         icon: 'code' },
    { match: 'Interactive report',    icon: 'file-text' },
    { match: 'more than standard',    icon: 'code' },
    { match: 'really need custom',    icon: 'code' },
    { match: 'probably enough',       icon: 'layers' },
    { match: 'tool is enough',        icon: 'layers' },
    /* Problem */
    { match: 'design',                icon: 'monitor' },
    { match: 'content',               icon: 'file-text' },
    { match: 'outdated',              icon: 'alert-triangle' },
    { match: 'slow',                  icon: 'zap' },
    { match: 'accessible',            icon: 'shield' },
    { match: 'found',                 icon: 'search' },
    { match: 'broken',                icon: 'tool' },
    { match: 'Everything',            icon: 'maximize' },
    /* Problem CMS v4.0 */
    { match: 'WordPress',             icon: 'code' },
    { match: 'Shopify',               icon: 'shopping-bag' },
    { match: 'other system',          icon: 'code' },
    { match: 'know',                  icon: 'search' },
    { match: 'Hacked',                icon: 'alert-triangle' },
    { match: 'security issue',        icon: 'alert-triangle' },
    { match: 'Design is enough',      icon: 'monitor' },
    { match: 'Complete rebuild',      icon: 'maximize' },
    /* BFSG */
    { match: 'No, not',               icon: 'search' },
    { match: 'errors are unclear',    icon: 'alert-triangle' },
    { match: 'help fixing',           icon: 'tool' },
    { match: 'one failed',            icon: 'alert-triangle' },
    { match: 'professional check',    icon: 'search' },
    /* SEO */
    { match: 'On Google',             icon: 'search' },
    { match: 'ChatGPT',               icon: 'eye' },
    { match: 'Both',                  icon: 'search' },
    /* Maintenance v4.0 */
    { match: 'Updates',               icon: 'shield' },
    { match: 'security',              icon: 'shield' },
    { match: 'regular changes',       icon: 'layers' },
    { match: 'Full service',          icon: 'maximize' },
    { match: 'dedicated developer',   icon: 'maximize' },
    { match: 'Static',                icon: 'code' },
    { match: 'Basic is enough',       icon: 'shield' },
    { match: 'Standard sounds',       icon: 'layers' },
    { match: 'Premium',               icon: 'maximize' },
    { match: 'business-critical',     icon: 'maximize' },
    /* GEO */
    { match: 'Nothing',               icon: 'book-open' },
    { match: 'Basic idea',            icon: 'eye' },
    { match: 'audit',                 icon: 'search' },
    { match: 'Sounds relevant',       icon: 'eye' },
    /* Costs */
    { match: 'Website',               icon: 'monitor' },
    { match: 'shop',                  icon: 'shopping-bag' },
    { match: 'Single task',           icon: 'tool' },
    { match: 'Too expensive',         icon: 'search' },
    /* Compare */
    { match: 'Freelancer vs',         icon: 'layers' },
    { match: 'Different freelancers', icon: 'search' },
    { match: 'DIY',                   icon: 'code' },
    /* Info actions */
    { match: 'Got it',                icon: 'chevron-right' },
    { match: 'Fits',                  icon: 'chevron-right' },
    { match: 'I want',                icon: 'chevron-right' },
    { match: 'I need',                icon: 'chevron-right' },
    { match: 'I have a',              icon: 'tool' },
    { match: 'hear your answers',     icon: 'eye' },
    { match: 'More questions',        icon: 'mail' },
    { match: 'not sure',              icon: 'search' },
    /* CTA / Result actions */
    { match: 'Send',                  icon: 'mail' },
    { match: 'send',                  icon: 'mail' },
    { match: 'Tell me',               icon: 'mail' },
    { match: 'talk',                  icon: 'mail' },
    { match: 'Talk',                  icon: 'mail' },
    { match: 'discuss',               icon: 'mail' },
    { match: 'Discuss',               icon: 'mail' },
    { match: 'minutes',               icon: 'mail' },
    { match: 'Describe',              icon: 'mail' },
    { match: 'describe',              icon: 'mail' },
    { match: 'check',                 icon: 'search' },
    { match: 'Check',                 icon: 'search' },
    { match: 'report',                icon: 'alert-triangle' },
    { match: 'Let',                   icon: 'mail' },
    /* Navigation */
    { match: 'Back to the start',     icon: 'refresh-cw' },
    { match: 'Other',                 icon: 'layers' },
    { match: 'both',                  icon: 'layers' }
  ];

  function getOptionIcon(label) {
    for (var i = 0; i < OPTION_ICON_MAP.length; i++) {
      if (label.indexOf(OPTION_ICON_MAP[i].match) !== -1) {
        return ICONS[OPTION_ICON_MAP[i].icon] || '';
      }
    }
    return '';
  }

  /* ── Depth Calculation for Progress ────────────────────── */

  var nodeDepths = {};

  function computeDepths() {
    function minToResult(nodeId, seen) {
      if (seen[nodeId]) return 99;
      seen[nodeId] = true;
      var node = tree[nodeId];
      if (!node) return 99;
      if (node.type === 'result') return 0;
      var min = 99;
      if (node.options) {
        for (var i = 0; i < node.options.length; i++) {
          var next = node.options[i].next;
          if (next) {
            var copy = {};
            for (var k in seen) copy[k] = true;
            var d = minToResult(next, copy);
            if (d < min) min = d;
          }
        }
      }
      return min + 1;
    }
    for (var id in tree) {
      nodeDepths[id] = minToResult(id, {});
    }
  }

  function buildStepLabel(nodeType) {
    if (nodeType === 'result') return '';
    var step = history.length + 1;
    if (step <= 1) return '';
    var total = history.length + (nodeDepths[currentNodeId] || 1);
    return '<span class="funnel-step-label funnel-stagger" style="--i:0">Step ' + step + ' of ' + total + '</span>';
  }

  /* ── Session Memory ────────────────────────────────── */

  var STORAGE_KEY = 'funnel-done';
  var STORAGE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  function isFunnelDone() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var ts = parseInt(raw, 10);
    if (isNaN(ts)) return true; // legacy '1' value
    return (Date.now() - ts) < STORAGE_TTL;
  }

  function markFunnelDone() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  function showReopenButton() {
    var btn = document.getElementById('funnel-reopen');
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      });
    }
  }

  function skipFunnel() {
    funnel.classList.add('funnel-hidden');
    funnel.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('funnel-active');
    showReopenButton();
  }

  /* ── GoatCounter Tracking ────────────────────────── */

  function trackEvent(event, detail) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({
        path: 'funnel/' + event + (detail ? '/' + detail : ''),
        title: 'Funnel: ' + event,
        event: true
      });
    }
  }

  /* ── Init ─────────────────────────────────────────── */

  function init() {
    var hash = window.location.hash.replace('#', '');

    if (window.location.protocol === 'file:' || (isFunnelDone() && !hash)) {
      skipFunnel();
      return;
    }
    // Mobile: render funnel inline in flow, no modal overlay
    // (Google penalises Intrusive Interstitials; mobile gets a compact funnel)
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      document.documentElement.classList.add('funnel-active', 'funnel-inline');
    } else {
      // Desktop: modal with 800ms delay – user sees the hero first, then the wow effect
      setTimeout(function () {
        document.documentElement.classList.add('funnel-active');
      }, 800);
    }
    initConstellation();
    fetch('funnel.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        tree = data.nodes;
        computeDepths();
        trackEvent('start');
        if (hash && tree[hash] && tree[hash].type === 'result') {
          show(hash);
        } else {
          show('start');
        }
      })
      .catch(function () {
        skipFunnel();
      });
  }

  /* ── Show (initial, no slide) ─────────────────────── */

  function show(nodeId) {
    currentNodeId = nodeId;
    app.setAttribute('data-node', nodeId);
    app.innerHTML = buildHTML(nodeId);
    bindEvents();
    initMagneticButtons();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        revealStaggered();
        focusHeading();
        applyTypewriter();
      });
    });
  }

  /* ── Navigate (with directional slide) ────────────── */

  function navigate(nodeId, direction) {
    if (isAnimating) return;
    isAnimating = true;

    var outClass = direction === 'forward' ? 'funnel-slide-out-left' : 'funnel-slide-out-right';
    var inClass  = direction === 'forward' ? 'funnel-slide-in-right' : 'funnel-slide-in-left';

    app.classList.add(outClass);

    setTimeout(function () {
      app.classList.remove(outClass);

      if (direction === 'forward') {
        updateConstellationDepth();
      }

      currentNodeId = nodeId;
      app.setAttribute('data-node', nodeId);
      app.innerHTML = buildHTML(nodeId);
      bindEvents();

      var node = tree[nodeId];
      if (node && node.type === 'result') {
        window.history.replaceState(null, '', '#' + nodeId);
        trackEvent('result', nodeId);
      } else if (nodeId === '_contact') {
        trackEvent('contact');
      }

      var synapseDelay = direction === 'forward' ? 500 : 0;

      setTimeout(function () {
        app.classList.add(inClass);

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            revealStaggered();
            focusHeading();
            applyTypewriter();
            initMagneticButtons();
          });
        });

        setTimeout(function () {
          app.classList.remove(inClass);
          isAnimating = false;
        }, SLIDE_IN_MS);
      }, synapseDelay);
    }, SLIDE_OUT_MS);
  }

  /* ── HTML Builders ────────────────────────────────── */

  function buildHTML(nodeId) {
    if (nodeId === '_contact') return buildContact();
    var node = tree[nodeId];
    if (!node) return '';
    if (node.type === 'question') return buildQuestion(node, nodeId);
    if (node.type === 'info')     return buildInfo(node, nodeId);
    if (node.type === 'result') {
      lastResultTitle = node.title || '';
      return buildResult(node, nodeId);
    }
    return '';
  }

  function buildQuestion(node, nodeId) {
    var h = buildStepLabel('question');
    h += backBtn();

    h += '<h2 class="funnel-question funnel-stagger" tabindex="-1">' + esc(node.text) + '</h2>';
    if (node.subtitle) {
      h += '<p class="funnel-subtitle funnel-stagger" style="--i:1">' + esc(node.subtitle) + '</p>';
    }
    h += '<div class="funnel-accent-line funnel-stagger" style="--i:1.5"></div>';

    h += '<div class="funnel-options">';
    for (var i = 0; i < node.options.length; i++) {
      var opt = node.options[i];
      var num = String(i + 1).length < 2 ? '0' + (i + 1) : String(i + 1);
      var si = 'style="--i:' + (i + 2) + '"';
      var data = opt.action ? 'data-action="' + esc(opt.action) + '"' : 'data-next="' + esc(opt.next) + '"';
      var icon = getOptionIcon(opt.label);
      h += '<button class="funnel-option funnel-stagger" ' + si + ' ' + data + '>';
      h += '<span class="funnel-option-num">' + num + '</span>';
      if (icon) h += '<span class="funnel-option-icon">' + icon + '</span>';
      h += '<span class="funnel-option-label">' + esc(opt.label) + '</span>';
      h += '<span class="funnel-option-arrow" aria-hidden="true">' + ICONS['chevron-right'] + '</span>';
      h += '</button>';
    }
    h += '</div>';
    return h;
  }

  function buildInfo(node, nodeId) {
    var h = buildStepLabel('info');
    h += backBtn();

    h += '<div class="funnel-info-block funnel-stagger">';
    h += '<div class="funnel-info-text" tabindex="-1">' + formatText(node.text) + '</div>';
    if (node.detail) {
      h += '<div class="funnel-info-detail">' + formatText(node.detail) + '</div>';
    }
    h += '</div>';
    h += '<div class="funnel-options">';
    for (var i = 0; i < node.options.length; i++) {
      var opt = node.options[i];
      var si = 'style="--i:' + (i + 1) + '"';
      var icon = getOptionIcon(opt.label);
      h += '<button class="funnel-option funnel-stagger" ' + si + ' data-next="' + esc(opt.next) + '">';
      if (icon) h += '<span class="funnel-option-icon">' + icon + '</span>';
      h += '<span class="funnel-option-label">' + esc(opt.label) + '</span>';
      h += '<span class="funnel-option-arrow" aria-hidden="true">' + ICONS['chevron-right'] + '</span>';
      h += '</button>';
    }
    h += '</div>';
    return h;
  }

  function buildResult(node, nodeId) {
    var h = backBtn();

    h += '<h3 class="funnel-result-title funnel-stagger" tabindex="-1">' + esc(node.title) + '</h3>';
    h += '<div class="funnel-result-text funnel-stagger" style="--i:1">' + formatText(node.text) + '</div>';

    if (node.proof && node.proof.length > 0) {
      h += '<div class="funnel-proof funnel-stagger" style="--i:2">';
      h += '<span class="funnel-proof-label">References</span>';
      h += '<div class="funnel-proof-items">';
      for (var i = 0; i < node.proof.length; i++) {
        var p = node.proof[i];
        if (p.href) {
          h += '<a class="funnel-proof-item funnel-proof-link" href="' + esc(p.href) + '" target="_blank" rel="noopener">';
        } else {
          h += '<div class="funnel-proof-item">';
        }
        h += '<span class="funnel-proof-name">' + esc(p.name) + '</span>';
        h += '<span class="funnel-proof-desc">' + esc(p.desc) + '</span>';
        h += p.href ? '</a>' : '</div>';
      }
      h += '</div>';
      h += '</div>';
    }

    var ctaI = node.proof && node.proof.length > 0 ? 3 : 2;
    h += '<div class="funnel-cta-group funnel-stagger" style="--i:' + ctaI + '">';
    h += '<button class="funnel-cta" data-action="contact">' + esc(node.cta.label);
    h += ' <span class="funnel-cta-arrow">' + ICONS['chevron-right'] + '</span></button>';
    h += '</div>';

    h += '<div class="funnel-result-actions funnel-stagger" style="--i:' + (ctaI + 1) + '">';
    h += '<button class="funnel-restart" data-action="restart">';
    h += '<span class="funnel-action-icon">' + ICONS['refresh-cw'] + '</span> Start over</button>';
    if (node.ctaSecondary) {
      h += '<a href="' + esc(node.ctaSecondary.href) + '" class="funnel-result-link">';
      h += '<span class="funnel-action-icon">' + ICONS['external-link'] + '</span> ' + esc(node.ctaSecondary.label) + '</a>';
    }
    h += '<button class="funnel-exit-btn" data-action="exit">';
    h += '<span class="funnel-action-icon">' + ICONS['external-link'] + '</span> Read more about me</button>';
    h += '</div>';
    return h;
  }

  /* ── Email Builder from Funnel Path ─────────────────── */

  var RESULT_EMAILS = {
    /* Direct / General */
    'result-direkt': {
      subject: 'Quick inquiry',
      body: 'I\'d like to have a quick chat. No long funnel needed \u2013 here\'s my request:',
      url: false
    },
    'result-beratung': {
      subject: 'Consulting call',
      body: 'I\'m not sure exactly what I need. Could we have a quick call to clarify?',
      url: true
    },
    'result-budget-klein': {
      subject: 'Website \u2013 small budget',
      body: 'my budget is below 2,400 EUR. I know that\'s tight, but maybe there\'s still a way.',
      url: true
    },
    /* New Website */
    'result-website': {
      subject: 'New company website',
      body: 'we need a new website for our company. I\'ve clicked through your advisor funnel.',
      url: true
    },
    'result-industrie': {
      subject: 'Company website (industry/manufacturing)',
      body: 'we are an industrial company and need a new website. Your reference to Gerwing Steinwerke and your experience with B2B catalogues sound like a fit.',
      url: true
    },
    'result-beratung-branche': {
      subject: 'Company website (consulting/services)',
      body: 'we are a consulting firm and need a new website. Your point about trust and AI visibility resonated with me.',
      url: true
    },
    'result-recht': {
      subject: 'Company website (law firm/tax office)',
      body: 'we are a law firm/tax office and need a new website. Your remark that all law firm websites look alike unfortunately applies to ours, too.',
      url: true
    },
    'result-sozial': {
      subject: 'Website (association/social organisation)',
      body: 'we are an association/social organisation and need a new website. Your note on limited budgets and real stories spoke to me.',
      url: true
    },
    'result-gross': {
      subject: 'Web presence for corporate group',
      body: 'we are a corporate group with several entities and need a unified web presence. Your point about coordination being the main issue applies to us.',
      url: true
    },
    /* Shop */
    'result-shop': {
      subject: 'WooCommerce shop',
      body: 'we need an online shop with custom requirements. Shopify isn\'t enough because we have to map our own processes.',
      url: true
    },
    'result-shop-mittel': {
      subject: 'WooCommerce shop (200\u2013500 products)',
      body: 'we need an online shop with 200\u2013500 products. Your note on structured imports was helpful \u2013 manual data entry isn\'t an option.',
      url: true
    },
    'result-shop-budget-knapp': {
      subject: 'WooCommerce shop (budget limited)',
      body: 'we need a shop but have a limited budget (under 4,800 EUR). I\'m willing to compromise \u2013 let\'s talk through the options.',
      url: true
    },
    'result-shop-standard': {
      subject: 'Online shop (consulting)',
      body: 'I\'ve clicked through your funnel and you honestly said Shopify might be enough for our case. Still, I\'d like a quick call to discuss whether WooCommerce makes sense long-term.',
      url: true
    },
    'result-shop-gross': {
      subject: 'Large online shop (500+ products)',
      body: 'we need a shop with a large product catalogue. Your notes on hosting and infrastructure for 500+ products were helpful.',
      url: true
    },
    'result-shop-b2b': {
      subject: 'B2B shop with dealer portal',
      body: 'we need a B2B shop \u2013 tiered pricing, dealer logins, approval flows. Not a stock theme but a real tool for our sales team.',
      url: true
    },
    'result-shop-beratung': {
      subject: 'Shop consulting',
      body: 'I\'m not sure if Shopify is enough or if it has to be WooCommerce. Could we have a brief call?',
      url: true
    },
    'result-shop-budget-klein': {
      subject: 'Shop (budget limited)',
      body: 'we need a shop but have a limited budget (under 4,800 EUR). I\'m willing to compromise.',
      url: true
    },
    /* Portal */
    'result-portal-karriere': {
      subject: 'Career portal (custom)',
      body: 'we need a career portal that goes beyond what JOIN or Personio can do \u2013 own design, integrated into our website.',
      url: true
    },
    'result-portal-karriere-standard': {
      subject: 'Career portal (consulting)',
      body: 'you honestly said a standard tool might be enough for our needs. Still a few questions about it.',
      url: false
    },
    'result-portal-kunden': {
      subject: 'Customer portal with login',
      body: 'we need a login area for our customers \u2013 viewing data, documents, maybe order history. Your note on GDPR requirements was important.',
      url: true
    },
    'result-portal-intern': {
      subject: 'Custom tool / web app',
      body: 'we need an internal tool that no off-the-shelf product covers. I\'ve checked: standard tools aren\'t enough.',
      url: false
    },
    'result-portal-tool': {
      subject: 'Tool selection consulting',
      body: 'you made me realise that an off-the-shelf tool might be enough for us. Could you advise us on the selection?',
      url: false
    },
    'result-portal-standard': {
      subject: 'Career portal (standard)',
      body: 'you honestly said a standard tool might be enough for our needs. Still a few questions about it.',
      url: false
    },
    'result-portal-custom': {
      subject: 'Custom tool / web app',
      body: 'we need a tool that no off-the-shelf product covers. I\'ve checked: standard tools aren\'t enough.',
      url: false
    },
    'result-bericht': {
      subject: 'Interactive report',
      body: 'we\'d like to publish a report (annual/impact report) as an interactive website rather than a PDF.',
      url: false
    },
    'result-landingpage': {
      subject: 'Landing page',
      body: 'we need a focused landing page for a specific offer. One page, one goal.',
      url: false
    },
    /* Problem: Redesign */
    'result-redesign': {
      subject: 'Design refresh for our website',
      body: 'the design of our website is outdated, but the technology and content are still fine. We need a visual update, not a full relaunch.',
      url: true
    },
    'result-redesign-technik': {
      subject: 'Technical update for our website',
      body: 'our website has a technical issue: not responsive, outdated PHP or no HTTPS. We need help with the technical foundation.',
      url: true
    },
    'result-redesign-content': {
      subject: 'Content update for our website',
      body: 'our website content is outdated (wrong services, old photos). We need a content update, not a redesign.',
      url: true
    },
    'result-redesign-komplett': {
      subject: 'Complete redesign',
      body: 'everything on our website is outdated: design, technology and content. We need a fresh start, but planned sensibly.',
      url: true
    },
    'result-relaunch': {
      subject: 'Complete relaunch',
      body: 'our website needs a complete fresh start \u2013 design, technology and content. I\'ve clicked through your funnel.',
      url: true
    },
    'result-redesign-beratung': {
      subject: 'Redesign or relaunch?',
      body: 'I\'m not sure whether a facelift is enough or if we need a full relaunch. Can we figure that out together?',
      url: true
    },
    /* Problem: Performance */
    'result-performance-wp': {
      subject: 'WordPress performance',
      body: 'our WordPress site is too slow. I checked pagespeed.web.dev and the score isn\'t good. Could you take a look?',
      url: true
    },
    'result-performance': {
      subject: 'Website too slow',
      body: 'our website is too slow. I\'ve tested it on pagespeed.web.dev. Could you take a look?',
      url: true
    },
    /* Problem: BFSG / EAA */
    'result-bfsg': {
      subject: 'Accessibility / EAA',
      body: 'we need to make our website accessible (European Accessibility Act). I did the quick test in your funnel and found at least one issue.',
      url: true
    },
    'result-bfsg-fix': {
      subject: 'Fix EAA issues',
      body: 'we\'ve had our website audited and know which accessibility issues exist. Could you fix and document them?',
      url: true
    },
    /* Problem: SEO / GEO */
    'result-seo-google': {
      subject: 'Google visibility',
      body: 'our website isn\'t found well on Google. Could you take a look?',
      url: true
    },
    'result-seo-ki': {
      subject: 'AI visibility',
      body: 'I asked ChatGPT about our company and the answer was thin or wrong. Could you help make our website visible to AI systems?',
      url: true
    },
    'result-seo': {
      subject: 'Website isn\'t being found',
      body: 'our website isn\'t found well \u2013 neither on Google nor by AI systems. Could you take a look?',
      url: true
    },
    /* Problem: Technical */
    'result-technik-wp': {
      subject: 'WordPress problem',
      body: 'our WordPress site has a technical issue. I\'ve disabled plugins and checked the Health Check tool but can\'t make progress.',
      url: true
    },
    'result-technik-woo': {
      subject: 'WooCommerce problem',
      body: 'our WooCommerce shop has an issue \u2013 orders, payments or display. Could you take a look soon?',
      url: true
    },
    'result-technik': {
      subject: 'Technical problem',
      body: 'something on our website is broken and we can\'t figure it out. Could you take a look?',
      url: true
    },
    'result-technik-sicherheit': {
      subject: 'URGENT: website hacked',
      body: 'our website has likely been hacked or contains malware. We need help quickly.',
      url: true
    },
    'result-sicherheit': {
      subject: 'URGENT: website hacked',
      body: 'our website has likely been hacked or contains malware. We need help quickly.',
      url: true
    },
    /* Maintenance */
    'result-betreuung-basis': {
      subject: 'Website maintenance (Basic)',
      body: 'we\'re looking for someone to handle updates, security and backups for our website.',
      url: true
    },
    'result-betreuung-standard': {
      subject: 'Website maintenance (Standard)',
      body: 'we\'re looking for someone for ongoing website maintenance \u2013 updates plus regular content changes.',
      url: true
    },
    'result-betreuung-premium': {
      subject: 'Full-service maintenance (Premium/Retainer)',
      body: 'we\'re essentially looking for our own web developer \u2013 someone who fully maintains our website and takes care of everything. Retainer model.',
      url: true
    },
    'result-betreuung-wp-basis': {
      subject: 'WordPress maintenance (Basic)',
      body: 'we\'re looking for someone to handle updates, security and backups for our WordPress site.',
      url: true
    },
    'result-betreuung-wp-standard': {
      subject: 'WordPress maintenance (Standard)',
      body: 'we\'re looking for someone for ongoing maintenance of our WordPress site \u2013 updates plus regular content changes.',
      url: true
    },
    'result-betreuung-woo-basis': {
      subject: 'WooCommerce maintenance (Basic)',
      body: 'we\'re looking for someone to handle updates and monitoring for our WooCommerce shop.',
      url: true
    },
    'result-betreuung-woo-standard': {
      subject: 'WooCommerce maintenance (Standard)',
      body: 'we\'re looking for someone for ongoing maintenance of our WooCommerce shop \u2013 updates plus regular changes and support.',
      url: true
    },
    'result-betreuung-statisch': {
      subject: 'Static website maintenance',
      body: 'we have a static website and occasionally need someone for changes.',
      url: true
    },
    /* GEO */
    'result-geo': {
      subject: 'AI visibility',
      body: 'I read on your website about how you make websites visible to AI systems. I\'m interested.',
      url: true
    },
    'result-geo-audit': {
      subject: 'AI visibility audit',
      body: 'I\'d like to know how visible our website is to AI systems. Could you check?',
      url: true
    },
    /* GEO (new nodes) */
    'result-geo-baukasten': {
      subject: 'AI visibility (website builder)',
      body: 'our website runs on a website builder system and we\'d like to improve AI visibility. Your funnel said honestly that this will be tricky \u2013 can we discuss the options?',
      url: true
    },
    'geo-neubau': {
      subject: 'New website with AI visibility',
      body: 'we\'re planning a new website and want AI visibility built in from the start. Your funnel convinced us.',
      url: true
    },
    /* BFSG (new nodes) */
    'bfsg-nicht-betroffen': {
      subject: 'Accessibility (voluntary)',
      body: 'according to your check we are not subject to the EAA, but we\'d still like to make our website accessible. Could you give us an estimate?',
      url: true
    },
    'result-bfsg-audit': {
      subject: 'EAA audit',
      body: 'we\'d like to have our website checked for accessibility. Your funnel pointed us to specific test items \u2013 we fail some of them.',
      url: true
    },
    /* Comparison */
    'result-vergleich-kontakt': {
      subject: 'Inquiry after provider comparison',
      body: 'I clicked through your advisor funnel and the tips on choosing a freelancer were helpful. I\'d like to hear your answers to the five questions.',
      url: false
    }
  };

  function getLastResultId() {
    var path = history.concat([currentNodeId]);
    for (var i = path.length - 1; i >= 0; i--) {
      if (path[i].indexOf('result-') === 0) return path[i];
    }
    return '';
  }

  var PATH_CONTEXT = {
    'neu-was': 'New website/shop',
    'website-budget': 'Budget check',
    'website-branche': 'Industry selection',
    'website-gross': 'Large project',
    'shop-art': 'Shop type',
    'shop-b2c': 'B2C shop',
    'shop-b2b': 'B2B shop',
    'shop-budget': 'Shop budget',
    'portal-was': 'Portal/tool',
    'portal-karriere': 'Career portal',
    'portal-intern': 'Internal tool',
    'problem-was': 'Existing problem',
    'problem-redesign': 'Redesign check',
    'problem-technik': 'Technical issue',
    'betreuung-was': 'Ongoing maintenance',
    'betreuung-info': 'Maintenance packages',
    'geo-einstieg': 'AI visibility',
    'geo-nachrüsten': 'Retrofit AI',
    'bfsg-check': 'EAA applicability',
    'bfsg-betroffen': 'EAA-required'
  };

  function buildPathSummary() {
    var steps = [];
    for (var i = 0; i < history.length; i++) {
      if (PATH_CONTEXT[history[i]]) steps.push(PATH_CONTEXT[history[i]]);
    }
    return steps.length > 0 ? steps.join(' > ') : '';
  }

  function buildEmailFromPath() {
    var resultId = getLastResultId();
    var fb = { subject: 'Inquiry', body: 'I\'ve looked at your website and would like to speak with you.', url: false };
    var data = RESULT_EMAILS[resultId] || fb;

    var pathSummary = buildPathSummary();
    var subject = data.subject;
    var body = 'Hello Mr. Andersen,\n\n' + data.body;
    if (data.url) {
      body += '\n\nOur website: [URL]';
    }
    if (pathSummary) {
      body += '\n\n(My path through the advisor: ' + pathSummary + ')';
    }
    body += '\n\nCould we have a brief call?\n\nBest regards\n[Your name]';

    var previewHtml = 'Hello Mr. Andersen,\n\n' + esc(data.body);
    if (data.url) {
      previewHtml += '\n\nOur website: <span class="funnel-contact-placeholder">[URL]</span>';
    }
    if (pathSummary) {
      previewHtml += '\n\n<span class="funnel-contact-placeholder">(My path: ' + esc(pathSummary) + ')</span>';
    }
    previewHtml += '\n\nCould we have a brief call?\n\nBest regards\n<span class="funnel-contact-placeholder">[Your name]</span>';

    return { subject: subject, body: body, previewHtml: previewHtml };
  }

  function buildContact() {
    var email = buildEmailFromPath();
    var mailtoHref = 'mailto:mail@andersen-webworks.de?subject=' +
      encodeURIComponent(email.subject) + '&body=' + encodeURIComponent(email.body);

    var h = backBtn();

    /* Personal intro with portrait */
    h += '<div class="funnel-contact-intro funnel-stagger">';
    h += '<img src="../portrait.webp" alt="Jan-Erik Andersen" class="funnel-contact-portrait" width="56" height="56" loading="lazy">';
    h += '<div class="funnel-contact-intro-text">';
    h += '<h3 class="funnel-result-title" tabindex="-1">Glad you\u2019re here.</h3>';
    h += '<p class="funnel-contact-intro-sub">I\u2019ve prepared something \u2013 you just need to send it.</p>';
    h += '</div>';
    h += '</div>';

    /* Email preview */
    h += '<div class="funnel-contact-preview funnel-stagger" style="--i:1">';
    h += '<div class="funnel-contact-preview-header">';
    h += '<span class="funnel-contact-preview-to">To: mail@andersen-webworks.de</span>';
    h += '<span class="funnel-contact-preview-subject">' + esc(email.subject) + '</span>';
    h += '</div>';
    h += '<div class="funnel-contact-preview-body">' + email.previewHtml + '</div>';
    h += '</div>';

    /* Primary CTA: send email */
    h += '<a href="' + esc(mailtoHref) + '" class="funnel-contact-send funnel-stagger" style="--i:2" data-action="mailto">';
    h += '<span class="funnel-contact-send-icon">' + ICONS.mail + '</span>';
    h += '<span class="funnel-contact-send-text">';
    h += '<strong>Open email draft</strong>';
    h += '<span>Reply within one business day</span>';
    h += '</span>';
    h += '<span class="funnel-cta-arrow">' + ICONS['chevron-right'] + '</span>';
    h += '</a>';

    /* D2: Trust badge */
    h += '<p class="funnel-trust-badge funnel-stagger" style="--i:2.5">I reply to emails within one business day. 27+ years building web projects \u00b7 50+ projects \u00b7 14+ industries.</p>';

    /* Alternative contact */
    h += '<div class="funnel-contact-alt funnel-stagger" style="--i:3">';
    h += '<span class="funnel-contact-alt-label">Or directly:</span>';
    h += '<a href="tel:+4938733270015" class="funnel-result-link">';
    h += '<span class="funnel-action-icon">' + ICONS.phone + '</span> 038733 270015</a>';
    h += '<a href="https://www.linkedin.com/in/andersen-erik/" target="_blank" rel="noopener" class="funnel-result-link">';
    h += '<span class="funnel-action-icon">' + ICONS.linkedin + '</span> LinkedIn</a>';
    h += '</div>';

    h += '<div class="funnel-result-actions funnel-stagger" style="--i:4">';
    h += '<button class="funnel-restart" data-action="restart">';
    h += '<span class="funnel-action-icon">' + ICONS['refresh-cw'] + '</span> Start over</button>';
    h += '<button class="funnel-exit-btn" data-action="exit">';
    h += '<span class="funnel-action-icon">' + ICONS['external-link'] + '</span> Read more about me</button>';
    h += '</div>';

    return h;
  }

  function backBtn() {
    if (history.length === 0) return '';
    return '<button class="funnel-back funnel-stagger" aria-label="Back">' +
           '<span class="funnel-back-arrow" aria-hidden="true">' + ICONS['arrow-left'] + '</span> Back</button>';
  }

  /* ── Stagger Reveal ───────────────────────────────── */

  function revealStaggered() {
    var items = app.querySelectorAll('.funnel-stagger');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.add('funnel-reveal');
    }
  }

  /* ── Event Binding ────────────────────────────────── */

  function bindEvents() {
    var options = app.querySelectorAll('.funnel-option');
    for (var i = 0; i < options.length; i++) {
      options[i].addEventListener('click', handleOptionClick);
    }

    var back = app.querySelector('.funnel-back');
    if (back) back.addEventListener('click', goBack);

    var btns = app.querySelectorAll('[data-action="restart"]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function () {
        history = [];
        trackEvent('restart');
        navigate('start', 'back');
      });
    }

    var contacts = app.querySelectorAll('[data-action="contact"]');
    for (var m = 0; m < contacts.length; m++) {
      contacts[m].addEventListener('click', function () {
        history.push(currentNodeId);
        navigate('_contact', 'forward');
      });
    }

    var exits = app.querySelectorAll('[data-action="exit"]');
    for (var k = 0; k < exits.length; k++) {
      exits[k].addEventListener('click', exitFunnel);
    }

    /* D1: Track mailto clicks */
    var mailtos = app.querySelectorAll('[data-action="mailto"]');
    for (var ml = 0; ml < mailtos.length; ml++) {
      mailtos[ml].addEventListener('click', function () {
        trackEvent('mailto', getLastResultId());
      });
    }
  }

  /* ── Option Click with Feedback ───────────────────── */

  function handleOptionClick(e) {
    if (isAnimating) return;
    var btn = e.currentTarget;
    var action = btn.getAttribute('data-action');
    var next = btn.getAttribute('data-next');

    btn.classList.add('funnel-option-pressed');

    setTimeout(function () {
      if (action === 'scroll') {
        trackEvent('self-read');
        exitFunnel();
        return;
      }
      if (action === 'exit') {
        trackEvent('exit');
        exitFunnel();
        return;
      }
      if (next) {
        if (currentNodeId === 'start') {
          trackEvent('path', next);
        }
        history.push(currentNodeId);
        navigate(next, 'forward');
      }
    }, PRESS_MS);
  }

  function goBack() {
    if (history.length === 0 || isAnimating) return;
    var prev = history.pop();
    navigate(prev, 'back');
  }

  /* ── Exit Funnel ──────────────────────────────────── */

  function exitFunnel() {
    markFunnelDone();
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    destroyConstellation();
    funnel.classList.add('funnel-exiting');
    setTimeout(function () {
      funnel.classList.add('funnel-hidden');
      funnel.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('funnel-active');
      window.scrollTo(0, 0);
      showReopenButton();
    }, 650);
  }

  /* ── Keyboard ─────────────────────────────────────── */

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && history.length > 0) goBack();
  });

  /* ── C3: Mobile Swipe Navigation ─────────────────── */

  (function () {
    var touchStartX = 0;
    var touchStartY = 0;
    var SWIPE_THRESHOLD = 80;

    funnel.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    funnel.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0 && history.length > 0) {
          goBack();
        }
      }
    }, { passive: true });
  })();

  /* ── Focus ────────────────────────────────────────── */

  function focusHeading() {
    var el = app.querySelector('[tabindex="-1"]');
    if (el) el.focus({ preventScroll: true });
  }

  /* ── Util ─────────────────────────────────────────── */

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatText(str) {
    var html = esc(str);

    if (/\b1\.\s/.test(html) && /\b2\.\s/.test(html)) {
      var idx = html.search(/\b1\.\s/);
      var intro = html.slice(0, idx);
      var rest = html.slice(idx);

      var parts = rest.split(/\b\d+\.\s/);
      var items = [];
      for (var i = 1; i < parts.length; i++) {
        var item = parts[i].trim();
        if (item) items.push(item);
      }

      if (items.length >= 2) {
        var outro = '';
        var last = items[items.length - 1];
        var nl = last.indexOf('\n\n');
        if (nl > -1) {
          outro = last.slice(nl + 2).trim();
          items[items.length - 1] = last.slice(0, nl).trim();
        }

        html = intro + '<ol class="funnel-list">';
        for (var j = 0; j < items.length; j++) {
          html += '<li>' + items[j] + '</li>';
        }
        html += '</ol>';
        if (outro) html += '<p class="funnel-text-after">' + outro + '</p>';
        return html;
      }
    }

    if (html.indexOf('\n\n') > -1) {
      var segs = html.split('\n\n');
      html = segs[0];
      for (var s = 1; s < segs.length; s++) {
        if (segs[s].trim()) html += '<p class="funnel-text-after">' + segs[s].trim() + '</p>';
      }
    }

    return html;
  }

  /* ── Typewriter Effect ────────────────────────────── */

  var typewriterTimer = null;
  var typewriterCursor = null;
  var TARGET_DURATION = 2000;

  function applyTypewriter() {
    if (typewriterTimer) clearTimeout(typewriterTimer);
    if (typewriterCursor && typewriterCursor.parentNode) {
      typewriterCursor.parentNode.removeChild(typewriterCursor);
    }

    var queue = [];
    var selectors = [
      '.funnel-step-label',
      '.funnel-question',
      '.funnel-result-title',
      '.funnel-subtitle',
      '.funnel-contact-intro-sub',
      '.funnel-info-text',
      '.funnel-info-detail',
      '.funnel-result-text',
      '.funnel-option-label',
      '.funnel-proof',
      '.funnel-cta',
      '.funnel-trust-badge',
      '.funnel-contact-preview',
      '.funnel-contact-alt-label',
      '.funnel-restart',
      '.funnel-exit-btn'
    ];

    var instantSelectors = [
      '.funnel-info-text', '.funnel-info-detail', '.funnel-result-text',
      '.funnel-proof', '.funnel-contact-preview'
    ];

    for (var s = 0; s < selectors.length; s++) {
      var els = app.querySelectorAll(selectors[s]);
      for (var e = 0; e < els.length; e++) {
        var el = els[e];
        var isInstant = false;
        for (var k = 0; k < instantSelectors.length; k++) {
          if (el.matches(instantSelectors[k])) { isInstant = true; break; }
        }

        if (isInstant) {
          var savedHTML = el.innerHTML;
          el.innerHTML = '';
          el.style.opacity = '0';
          queue.push({ el: el, html: savedHTML, instant: true });
        } else {
          var text = el.textContent;
          if (text.length > 0) {
            var savedChildren = [];
            while (el.firstChild) {
              savedChildren.push(el.removeChild(el.firstChild));
            }
            var textContent = '';
            var trailingElements = [];
            for (var c = 0; c < savedChildren.length; c++) {
              if (savedChildren[c].nodeType === 3) {
                textContent += savedChildren[c].textContent;
              } else {
                trailingElements.push(savedChildren[c]);
              }
            }
            for (var t = 0; t < trailingElements.length; t++) {
              trailingElements[t].style.opacity = '0';
              el.appendChild(trailingElements[t]);
            }
            if (textContent.length > 0) {
              queue.push({ el: el, text: textContent, trailing: trailingElements });
            }
          }
        }
      }
    }

    if (queue.length === 0) return;

    var totalChars = 0;
    for (var q = 0; q < queue.length; q++) {
      if (!queue[q].instant) totalChars += queue[q].text.length;
    }
    var charSpeed = Math.max(8, Math.min(25, Math.floor(TARGET_DURATION / Math.max(totalChars, 1))));
    var pauseBetween = charSpeed * 3;

    typewriterCursor = document.createElement('span');
    typewriterCursor.className = 'typewriter-cursor';
    typewriterCursor.textContent = '\u2502';

    for (var r = 0; r < queue.length; r++) {
      var staggerParent = queue[r].el.closest('.funnel-stagger') || queue[r].el;
      queue[r].container = staggerParent;
    }

    var allStaggers = app.querySelectorAll('.funnel-stagger');
    for (var h = 0; h < allStaggers.length; h++) {
      allStaggers[h].style.opacity = '0';
      allStaggers[h].style.translate = '0 0';
      allStaggers[h].style.transition = 'opacity 250ms ease';
    }
    var accentLine = app.querySelector('.funnel-accent-line');
    if (accentLine) { accentLine.style.opacity = '0'; accentLine.style.transition = 'opacity 250ms ease'; }

    var revealedContainers = [];

    function revealContainer(el) {
      var container = el.closest('.funnel-stagger') || el;
      if (revealedContainers.indexOf(container) !== -1) return;
      revealedContainers.push(container);
      container.style.opacity = '1';
    }

    var currentItem = 0;
    var currentChar = 0;
    var textNode = null;

    function tick() {
      if (currentItem >= queue.length) {
        for (var f = 0; f < allStaggers.length; f++) {
          allStaggers[f].style.opacity = '1';
        }
        if (accentLine) { accentLine.style.opacity = '1'; accentLine.classList.add('funnel-reveal'); }
        if (typewriterCursor.parentNode) {
          typewriterCursor.classList.add('typewriter-cursor-done');
          setTimeout(function () {
            if (typewriterCursor && typewriterCursor.parentNode) {
              typewriterCursor.parentNode.removeChild(typewriterCursor);
            }
          }, 600);
        }
        return;
      }

      var item = queue[currentItem];

      if (item.instant) {
        revealContainer(item.el);
        item.el.innerHTML = item.html;
        item.el.style.opacity = '1';
        currentItem++;
        currentChar = 0;
        textNode = null;
        typewriterTimer = setTimeout(tick, pauseBetween);
        return;
      }

      if (currentChar === 0) {
        revealContainer(item.el);
        textNode = document.createTextNode('');
        if (item.trailing && item.trailing.length > 0) {
          item.el.insertBefore(textNode, item.trailing[0]);
          item.el.insertBefore(typewriterCursor, item.trailing[0]);
        } else {
          item.el.appendChild(textNode);
          item.el.appendChild(typewriterCursor);
        }
      }

      if (currentChar < item.text.length) {
        textNode.textContent += item.text[currentChar];
        currentChar++;
        typewriterTimer = setTimeout(tick, charSpeed);
      } else {
        if (item.trailing) {
          for (var i = 0; i < item.trailing.length; i++) {
            item.trailing[i].style.opacity = '';
          }
        }
        currentItem++;
        currentChar = 0;
        textNode = null;
        typewriterTimer = setTimeout(tick, pauseBetween);
      }
    }

    typewriterTimer = setTimeout(tick, 150);
  }

  /* ── Magnetic Buttons ──────────────────────────────── */

  var MAGNET_RADIUS = 80;
  var MAGNET_STRENGTH = 8;

  function initMagneticButtons() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var options = app.querySelectorAll('.funnel-option, .funnel-cta, .funnel-contact-send');
    for (var i = 0; i < options.length; i++) {
      options[i].addEventListener('mousemove', magnetMove);
      options[i].addEventListener('mouseleave', magnetLeave);
    }
  }

  function magnetMove(e) {
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var dx = e.clientX - centerX;
    var dy = e.clientY - centerY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var maxDist = Math.max(rect.width, rect.height) / 2 + MAGNET_RADIUS;

    if (dist < maxDist) {
      var pull = (1 - dist / maxDist) * MAGNET_STRENGTH;
      var tx = (dx / maxDist) * pull;
      var ty = (dy / maxDist) * pull;
      btn.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
    }
  }

  function magnetLeave(e) {
    e.currentTarget.style.transform = '';
  }

  /* ── Constellation Canvas (Synapsen-Modell) ─────── */

  var constellationCanvas = null;
  var constellationCtx = null;
  var nodes = [];
  var synapses = [];
  var constellationRAF = null;

  var NODE_COUNT = 20;
  var DRIFT_SPEED = 0.2;
  var SYNAPSE_DRAW_MS = 600;
  var FLASH_DURATION_MS = 800;

  function initConstellation() {
    if (constellationCanvas) return;

    constellationCanvas = document.createElement('canvas');
    constellationCanvas.className = 'funnel-constellation';
    constellationCanvas.setAttribute('aria-hidden', 'true');
    funnel.insertBefore(constellationCanvas, funnel.firstChild);
    constellationCtx = constellationCanvas.getContext('2d');

    resizeCanvas();
    spawnNodes();
    window.addEventListener('resize', resizeCanvas);
    animateConstellation();
  }

  function resizeCanvas() {
    if (!constellationCanvas || !funnel) return;
    constellationCanvas.width = funnel.offsetWidth;
    constellationCanvas.height = funnel.offsetHeight;
  }

  function spawnNodes() {
    var w = funnel ? funnel.offsetWidth : window.innerWidth;
    var h = funnel ? funnel.offsetHeight : window.innerHeight;
    var margin = 60;
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - margin * 2),
        vx: (Math.random() - 0.5) * DRIFT_SPEED * 2,
        vy: (Math.random() - 0.5) * DRIFT_SPEED * 2,
        r: Math.random() * 1.2 + 0.8,
        baseOpacity: Math.random() * 0.2 + 0.15,
        flash: 0
      });
    }
  }

  var lastConnectedNode = -1;
  var connectedNodes = {};
  var connectionOrder = 0;

  function addSynapse() {
    if (nodes.length < 2) return;

    var a, b;

    if (lastConnectedNode === -1) {
      a = Math.floor(Math.random() * nodes.length);
      do { b = Math.floor(Math.random() * nodes.length); } while (b === a);
    } else {
      a = lastConnectedNode;
      b = -1;
      var bestDist = Infinity;
      for (var i = 0; i < nodes.length; i++) {
        if (i === a || connectedNodes[i]) continue;
        var dx = nodes[a].x - nodes[i].x;
        var dy = nodes[a].y - nodes[i].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) { bestDist = d; b = i; }
      }
      if (b === -1) {
        for (var j = 0; j < nodes.length; j++) {
          for (var k = j + 1; k < nodes.length; k++) {
            if (!synapseExists(j, k)) { a = j; b = k; break; }
          }
          if (b !== -1) break;
        }
      }
    }

    if (b === -1 || a === b) return;

    synapses.push({
      a: a, b: b,
      startTime: performance.now(),
      progress: 0, flash: 1
    });
    nodes[a].flash = 1;
    nodes[b].flash = 1;
    if (!connectedNodes[a]) { connectionOrder++; nodes[a].label = connectionOrder; connectedNodes[a] = true; }
    if (!connectedNodes[b]) { connectionOrder++; nodes[b].label = connectionOrder; connectedNodes[b] = true; }
    lastConnectedNode = b;
  }

  function synapseExists(a, b) {
    for (var i = 0; i < synapses.length; i++) {
      if ((synapses[i].a === a && synapses[i].b === b) ||
          (synapses[i].a === b && synapses[i].b === a)) return true;
    }
    return false;
  }

  function animateConstellation() {
    if (!constellationCtx || !constellationCanvas) return;
    var w = constellationCanvas.width;
    var h = constellationCanvas.height;
    var now = performance.now();
    constellationCtx.clearRect(0, 0, w, h);

    var isDark = document.querySelector('.darkmode-checkbox') &&
                 document.querySelector('.darkmode-checkbox').checked;
    var dotColor = isDark ? '255,255,255' : '0,0,0';
    var accentRGB = '212,2,53';

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 30 || n.x > w - 30) n.vx *= -1;
      if (n.y < 30 || n.y > h - 30) n.vy *= -1;
      if (n.flash > 0) n.flash = Math.max(0, n.flash - 0.015);

      var nodeOpacity = n.baseOpacity + n.flash * 0.6;
      var nodeR = n.r + n.flash * 2;
      var nodeColor = n.flash > 0.01
        ? 'rgba(' + accentRGB + ',' + nodeOpacity + ')'
        : 'rgba(' + dotColor + ',' + nodeOpacity + ')';

      constellationCtx.beginPath();
      constellationCtx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
      constellationCtx.fillStyle = nodeColor;
      constellationCtx.fill();

      if (n.label) {
        var labelNum = n.label < 10 ? '0' + n.label : '' + n.label;
        constellationCtx.font = '500 9px ui-monospace, SF Mono, Monaco, Consolas, monospace';
        constellationCtx.textAlign = 'center';
        constellationCtx.fillStyle = 'rgba(' + dotColor + ',' + (0.25 + n.flash * 0.5) + ')';
        constellationCtx.fillText(labelNum, n.x, n.y - nodeR - 5);
      }

      if (n.flash > 0.1) {
        constellationCtx.beginPath();
        constellationCtx.arc(n.x, n.y, nodeR + 4 * n.flash, 0, Math.PI * 2);
        constellationCtx.strokeStyle = 'rgba(' + accentRGB + ',' + (n.flash * 0.3) + ')';
        constellationCtx.lineWidth = 1.5;
        constellationCtx.stroke();
      }
    }

    for (var s = 0; s < synapses.length; s++) {
      var syn = synapses[s];
      var na = nodes[syn.a];
      var nb = nodes[syn.b];

      var elapsed = now - syn.startTime;
      syn.progress = Math.min(1, elapsed / SYNAPSE_DRAW_MS);
      var drawProgress = 1 - Math.pow(1 - syn.progress, 2);

      if (syn.progress >= 1 && syn.flash > 0) {
        syn.flash = Math.max(0, syn.flash - 0.012);
      }

      var endX = na.x + (nb.x - na.x) * drawProgress;
      var endY = na.y + (nb.y - na.y) * drawProgress;

      var lineAlpha = 0.15 + syn.flash * 0.4;
      var lineColor = syn.flash > 0.01
        ? 'rgba(' + accentRGB + ',' + lineAlpha + ')'
        : 'rgba(' + dotColor + ',' + 0.15 + ')';

      constellationCtx.beginPath();
      constellationCtx.moveTo(na.x, na.y);
      constellationCtx.lineTo(endX, endY);
      constellationCtx.strokeStyle = lineColor;
      constellationCtx.lineWidth = syn.flash > 0.01 ? 1.2 : 0.6;
      constellationCtx.stroke();
    }

    constellationRAF = requestAnimationFrame(animateConstellation);
  }

  function updateConstellationDepth() {
    addSynapse();
  }

  function destroyConstellation() {
    if (constellationRAF) cancelAnimationFrame(constellationRAF);
    if (constellationCanvas && constellationCanvas.parentNode) {
      constellationCanvas.parentNode.removeChild(constellationCanvas);
    }
    constellationCanvas = null;
    constellationCtx = null;
    nodes = [];
    synapses = [];
    constellationRAF = null;
    lastConnectedNode = -1;
    connectedNodes = {};
    connectionOrder = 0;
  }

  /* ── Start ────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
