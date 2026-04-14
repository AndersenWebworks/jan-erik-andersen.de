/**
 * Advisor Funnel Engine v3 (EN)
 * Premium design: SVG icons, progress dots, decorative elements,
 * directional animations, staggered reveals, scroll lock.
 * Vanilla JS, JSON-driven, no backend.
 * jan-erik-andersen.de — 2026
 */
(function () {
  'use strict';

  var SLIDE_OUT_MS = 300;
  var SLIDE_IN_MS  = 400;
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
    /* Start */
    { match: 'new website',           icon: 'monitor' },
    { match: 'has a problem',         icon: 'alert-triangle' },
    { match: 'ongoing maintenance',   icon: 'shield' },
    { match: 'AI visibility',         icon: 'eye' },
    { match: 'read on my own',        icon: 'book-open' },
    { match: 'does this cost',        icon: 'file-text' },
    { match: 'comparing providers',   icon: 'search' },
    /* New Website */
    { match: 'Company website',       icon: 'monitor' },
    { match: 'Online shop',           icon: 'shopping-bag' },
    { match: 'Web app',               icon: 'code' },
    { match: 'Landing page',          icon: 'file-text' },
    { match: 'one-pager',             icon: 'file-text' },
    /* Industry */
    { match: 'Industry',              icon: 'tool' },
    { match: 'Law',                   icon: 'shield' },
    { match: 'Association',           icon: 'shield' },
    { match: 'Hospitality',           icon: 'monitor' },
    { match: 'Other industry',        icon: 'layers' },
    /* Scope */
    { match: 'Manageable',            icon: 'file-text' },
    { match: 'Medium',                icon: 'layers' },
    { match: 'Large',                 icon: 'maximize' },
    /* CMS */
    { match: 'manage it ourselves',   icon: 'layers' },
    { match: 'developer handles',     icon: 'code' },
    { match: 'Not sure yet',          icon: 'search' },
    /* Shop */
    { match: 'Standard online',       icon: 'shopping-bag' },
    { match: 'B2B',                   icon: 'shopping-bag' },
    { match: 'Under 50',              icon: 'file-text' },
    { match: '50 to 500',             icon: 'layers' },
    { match: 'Over 500',              icon: 'maximize' },
    { match: 'WooCommerce',           icon: 'shopping-bag' },
    /* Portal */
    { match: 'Career',                icon: 'layers' },
    { match: 'Customer portal',       icon: 'shield' },
    { match: 'Internal tool',         icon: 'code' },
    { match: 'Interactive report',    icon: 'file-text' },
    /* Problem */
    { match: 'design',                icon: 'monitor' },
    { match: 'content',               icon: 'file-text' },
    { match: 'outdated',              icon: 'alert-triangle' },
    { match: 'slow',                  icon: 'zap' },
    { match: 'accessible',            icon: 'shield' },
    { match: 'found',                 icon: 'search' },
    { match: 'broken',                icon: 'tool' },
    { match: 'Everything',            icon: 'maximize' },
    /* Problem CMS */
    { match: 'WordPress',             icon: 'code' },
    { match: 'Shopify',               icon: 'shopping-bag' },
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
    /* Maintenance */
    { match: 'Updates',               icon: 'shield' },
    { match: 'regular changes',       icon: 'layers' },
    { match: 'Full service',          icon: 'maximize' },
    { match: 'Static',                icon: 'code' },
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
    /* Navigation */
    { match: 'Back to the start',     icon: 'refresh-cw' },
    { match: 'Other',                 icon: 'layers' }
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

  var MAX_DEPTH = 5;

  function getDepth() {
    return Math.min(history.length + 1, MAX_DEPTH);
  }

  function buildStepLabel(nodeType) {
    if (nodeType === 'result') return '';
    var depth = getDepth();
    if (depth <= 1) return '';
    return '<span class="funnel-step-label funnel-stagger" style="--i:0">Step ' + depth + '</span>';
  }

  /* ── Session Memory ────────────────────────────────── */

  var STORAGE_KEY = 'funnel-done';

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

  /* ── Init ─────────────────────────────────────────── */

  function init() {
    if (localStorage.getItem(STORAGE_KEY)) {
      skipFunnel();
      return;
    }
    document.documentElement.classList.add('funnel-active');
    fetch('funnel.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        tree = data.nodes;
        show('start');
      })
      .catch(function () {
        app.innerHTML = '<p class="funnel-error">Could not load funnel.</p>';
      });
  }

  /* ── Show (initial, no slide) ─────────────────────── */

  function show(nodeId) {
    currentNodeId = nodeId;
    app.setAttribute('data-node', nodeId);
    app.innerHTML = buildHTML(nodeId);
    bindEvents();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        revealStaggered();
        focusHeading();
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

      currentNodeId = nodeId;
      app.setAttribute('data-node', nodeId);
      app.innerHTML = buildHTML(nodeId);
      bindEvents();

      app.classList.add(inClass);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          revealStaggered();
          focusHeading();
        });
      });

      setTimeout(function () {
        app.classList.remove(inClass);
        isAnimating = false;
      }, SLIDE_IN_MS);
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

    h += '<div class="funnel-options">';
    for (var i = 0; i < node.options.length; i++) {
      var opt = node.options[i];
      var si = 'style="--i:' + (i + 2) + '"';
      var data = opt.action ? 'data-action="' + esc(opt.action) + '"' : 'data-next="' + esc(opt.next) + '"';
      var icon = getOptionIcon(opt.label);
      h += '<button class="funnel-option funnel-stagger" ' + si + ' ' + data + '>';
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
    h += '<p class="funnel-info-text" tabindex="-1">' + esc(node.text) + '</p>';
    if (node.detail) {
      h += '<p class="funnel-info-detail">' + esc(node.detail) + '</p>';
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
    h += '<p class="funnel-result-text funnel-stagger" style="--i:1">' + esc(node.text) + '</p>';

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
    'result-website': {
      subject: 'New company website',
      body: 'we need a new website for our company. We either don\'t have one yet or the current one is no longer presentable.',
      url: true
    },
    'result-website-gross': {
      subject: 'Website for corporate group',
      body: 'we are a corporate group with multiple subsidiaries and need a unified web presence \u2013 probably multilingual.',
      url: true
    },
    'result-shop': {
      subject: 'Online shop',
      body: 'we want to set up an online shop for direct-to-consumer sales.',
      url: true
    },
    'result-shop-b2b': {
      subject: 'B2B shop with dealer portal',
      body: 'we need a B2B shop with a dealer portal \u2013 price lists, customer accounts, the full package.',
      url: true
    },
    'result-portal': {
      subject: 'Web app / Portal',
      body: 'we need a web app or portal \u2013 not a classic website but something interactive where users can work.',
      url: false
    },
    'result-landingpage': {
      subject: 'Landing page',
      body: 'we need a single, well-crafted page \u2013 a landing page for a specific offer or topic.',
      url: false
    },
    'result-redesign': {
      subject: 'Website redesign',
      body: 'our website no longer looks contemporary. We need a redesign \u2013 technology, design, or both.',
      url: true
    },
    'result-performance': {
      subject: 'Website too slow',
      body: 'our website is too slow and we\'re not sure why. Could you take a look?',
      url: true
    },
    'result-bfsg': {
      subject: 'Accessibility / EAA',
      body: 'we need to make our website accessible (European Accessibility Act). Can you assess what\'s needed?',
      url: true
    },
    'result-seo': {
      subject: 'Website not being found',
      body: 'our website isn\'t being found well \u2013 neither on Google nor in AI assistants. We need help with visibility.',
      url: true
    },
    'result-technik': {
      subject: 'Technical problem',
      body: 'something on our website is broken and we can\'t figure it out. Could you take a look soon?',
      url: true
    },
    'result-betreuung-basis': {
      subject: 'Website maintenance (Basic)',
      body: 'we\'re looking for someone to handle updates, security and backups for our website \u2013 reliably and in the background.',
      url: true
    },
    'result-betreuung-standard': {
      subject: 'Website maintenance',
      body: 'we\'re looking for someone for ongoing website maintenance \u2013 not just technical but also regular content changes.',
      url: true
    },
    'result-betreuung-premium': {
      subject: 'Full-service maintenance',
      body: 'we\'re essentially looking for our own web developer \u2013 someone who fully maintains our website and takes care of everything.',
      url: true
    },
    'result-geo': {
      subject: 'AI visibility',
      body: 'I read on your website about how you make websites visible to AI systems. I\'m interested \u2013 can you tell me more?',
      url: true
    },
    'result-geo-audit': {
      subject: 'AI visibility audit',
      body: 'I\'d like to know how visible our website is to AI systems. Can you check?',
      url: true
    }
  };

  function getLastResultId() {
    var path = history.concat([currentNodeId]);
    for (var i = path.length - 1; i >= 0; i--) {
      if (path[i].indexOf('result-') === 0) return path[i];
    }
    return '';
  }

  function buildEmailFromPath() {
    var resultId = getLastResultId();
    var fb = { subject: 'Inquiry', body: 'I\'ve looked at your website and would like to speak with you.', url: false };
    var data = RESULT_EMAILS[resultId] || fb;

    var subject = data.subject;
    var body = 'Hello Mr. Andersen,\n\n' + data.body;
    if (data.url) {
      body += '\n\nOur website: [URL]';
    }
    body += '\n\nCould we have a brief call?\n\nBest regards\n[Your name]';

    var previewHtml = 'Hello Mr. Andersen,\n\n' + esc(data.body);
    if (data.url) {
      previewHtml += '\n\nOur website: <span class="funnel-contact-placeholder">[URL]</span>';
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
    h += '<a href="' + esc(mailtoHref) + '" class="funnel-contact-send funnel-stagger" style="--i:2">';
    h += '<span class="funnel-contact-send-icon">' + ICONS.mail + '</span>';
    h += '<span class="funnel-contact-send-text">';
    h += '<strong>Send email</strong>';
    h += '<span>Initial consultation free</span>';
    h += '</span>';
    h += '<span class="funnel-cta-arrow">' + ICONS['chevron-right'] + '</span>';
    h += '</a>';

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
  }

  /* ── Option Click with Feedback ───────────────────── */

  function handleOptionClick(e) {
    if (isAnimating) return;
    var btn = e.currentTarget;
    var action = btn.getAttribute('data-action');
    var next = btn.getAttribute('data-next');

    btn.classList.add('funnel-option-pressed');

    setTimeout(function () {
      if (action === 'scroll' || action === 'exit') {
        exitFunnel();
        return;
      }
      if (next) {
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
    localStorage.setItem(STORAGE_KEY, '1');
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

  /* ── Start ────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
