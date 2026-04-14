/**
 * Berater-Funnel Engine v3
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
    { match: 'neue Website',          icon: 'monitor' },
    { match: 'Problem',               icon: 'alert-triangle' },
    { match: 'Betreuung',             icon: 'shield' },
    { match: 'KI-Sichtbarkeit',      icon: 'eye' },
    { match: 'selbst lesen',          icon: 'book-open' },
    { match: 'Was kostet',            icon: 'file-text' },
    { match: 'vergleiche Anbieter',   icon: 'search' },
    /* Neue Website */
    { match: 'Unternehmenswebsite',   icon: 'monitor' },
    { match: 'Online-Shop',           icon: 'shopping-bag' },
    { match: 'Web-App',               icon: 'code' },
    { match: 'Landingpage',           icon: 'file-text' },
    { match: 'Onepager',              icon: 'file-text' },
    /* Branche */
    { match: 'Industrie',             icon: 'tool' },
    { match: 'Recht',                 icon: 'shield' },
    { match: 'Verein',                icon: 'shield' },
    { match: 'Gastro',                icon: 'monitor' },
    { match: 'Andere Branche',        icon: 'layers' },
    /* Umfang */
    { match: 'berschaubar',           icon: 'file-text' },
    { match: 'Mittelgro',             icon: 'layers' },
    { match: 'Gro',                   icon: 'maximize' },
    /* CMS */
    { match: 'pflegen selbst',        icon: 'layers' },
    { match: 'Entwickler',            icon: 'code' },
    { match: 'eiss noch nicht',       icon: 'search' },
    { match: 'eiss ich nicht',        icon: 'search' },
    /* Shop */
    { match: 'Klassischer',           icon: 'shopping-bag' },
    { match: 'B2B',                   icon: 'shopping-bag' },
    { match: 'Unter 50',              icon: 'file-text' },
    { match: '50 bis 500',            icon: 'layers' },
    { match: 'ber 500',               icon: 'maximize' },
    { match: 'WooCommerce',           icon: 'shopping-bag' },
    /* Portal */
    { match: 'Karriere',              icon: 'layers' },
    { match: 'Kundenportal',          icon: 'shield' },
    { match: 'Internes Tool',         icon: 'code' },
    { match: 'Bericht',               icon: 'file-text' },
    /* Problem */
    { match: 'Design',                icon: 'monitor' },
    { match: 'Inhalte',               icon: 'file-text' },
    { match: 'veraltet',              icon: 'alert-triangle' },
    { match: 'langsam',               icon: 'zap' },
    { match: 'barrierefrei',          icon: 'shield' },
    { match: 'gefunden',              icon: 'search' },
    { match: 'kaputt',                icon: 'tool' },
    { match: 'Alles zusammen',        icon: 'maximize' },
    /* Problem CMS */
    { match: 'WordPress',             icon: 'code' },
    { match: 'Shopify',               icon: 'shopping-bag' },
    /* BFSG */
    { match: 'Nein, noch',            icon: 'search' },
    { match: 'Fehler sind unklar',    icon: 'alert-triangle' },
    { match: 'Hilfe beim Fix',        icon: 'tool' },
    { match: 'einer hat gefehlt',     icon: 'alert-triangle' },
    { match: 'pruefen lassen',        icon: 'search' },
    /* SEO */
    { match: 'Bei Google',            icon: 'search' },
    { match: 'ChatGPT',               icon: 'eye' },
    { match: 'Beides',                icon: 'search' },
    /* Betreuung */
    { match: 'Updates',               icon: 'shield' },
    { match: 'nderungen',             icon: 'layers' },
    { match: 'Komplett',              icon: 'maximize' },
    { match: 'Statisch',              icon: 'code' },
    /* GEO */
    { match: 'Nichts',                icon: 'book-open' },
    { match: 'Grundidee',             icon: 'eye' },
    { match: 'Audit',                 icon: 'search' },
    { match: 'Klingt relevant',       icon: 'eye' },
    /* Kosten */
    { match: 'Website',               icon: 'monitor' },
    { match: 'Shop',                  icon: 'shopping-bag' },
    { match: 'Einzelne Aufgabe',      icon: 'tool' },
    { match: 'Zu teuer',              icon: 'search' },
    /* Vergleich */
    { match: 'Freelancer vs',         icon: 'layers' },
    { match: 'Verschiedene Freelancer', icon: 'search' },
    { match: 'Selber machen',         icon: 'code' },
    /* Info actions */
    { match: 'Verstanden',            icon: 'chevron-right' },
    { match: 'Passt',                 icon: 'chevron-right' },
    { match: 'ich will',              icon: 'chevron-right' },
    { match: 'Ich will',              icon: 'chevron-right' },
    { match: 'Ich brauche',           icon: 'chevron-right' },
    { match: 'Ich habe eine',         icon: 'tool' },
    { match: 'Antworten',             icon: 'eye' },
    { match: 'Noch Fragen',           icon: 'mail' },
    { match: 'unsicher',              icon: 'search' },
    /* Navigation */
    { match: 'ck zum Anfang',         icon: 'refresh-cw' },
    { match: 'Anderes',               icon: 'layers' }
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

  var MAX_DEPTH = 5; // start → branche → umfang → cms → result

  function getDepth() {
    return Math.min(history.length + 1, MAX_DEPTH);
  }

  function buildStepLabel(nodeType) {
    if (nodeType === 'result') return '';
    var depth = getDepth();
    if (depth <= 1) return '';
    return '<span class="funnel-step-label funnel-stagger" style="--i:0">Schritt ' + depth + '</span>';
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
        app.innerHTML = '<p class="funnel-error">Funnel konnte nicht geladen werden.</p>';
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
      h += '<span class="funnel-proof-label">Referenzen</span>';
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
    h += '<span class="funnel-action-icon">' + ICONS['refresh-cw'] + '</span> Nochmal von vorn</button>';
    if (node.ctaSecondary) {
      h += '<a href="' + esc(node.ctaSecondary.href) + '" class="funnel-result-link">';
      h += '<span class="funnel-action-icon">' + ICONS['external-link'] + '</span> ' + esc(node.ctaSecondary.label) + '</a>';
    }
    h += '<button class="funnel-exit-btn" data-action="exit">';
    h += '<span class="funnel-action-icon">' + ICONS['external-link'] + '</span> Mehr \u00fcber mich lesen</button>';
    h += '</div>';
    return h;
  }

  /* ── Email Builder from Funnel Path ─────────────────── */

  var RESULT_EMAILS = {
    /* ── Neue Website ── */
    'result-website': {
      subject: 'Neue Firmenwebsite',
      body: 'wir brauchen eine neue Website fuer unser Unternehmen. Ich habe Ihren Berater-Funnel durchgeklickt und die Tipps zu Seitenstruktur und CMS-Wahl waren hilfreich.',
      url: true
    },
    'result-website-wp': {
      subject: 'Neue WordPress-Website',
      body: 'wir brauchen eine neue Website und WordPress passt zu uns, weil unser Team Inhalte selbst pflegen will. Ihr Hinweis zu Elementor/Divi vs. YOOtheme Pro war interessant.',
      url: true
    },
    'result-website-statisch': {
      subject: 'Neue statische Website',
      body: 'wir brauchen eine neue Website. Statisches HTML klingt nach der richtigen Wahl fuer uns, weil sich unsere Inhalte selten aendern.',
      url: true
    },
    'result-website-gross': {
      subject: 'Web-Auftritt Firmengruppe',
      body: 'wir sind eine Unternehmensgruppe mit mehreren Gesellschaften und brauchen einen einheitlichen Web-Auftritt. Ihr Punkt zur Koordination als Hauptproblem trifft bei uns zu.',
      url: true
    },
    /* ── Shop ── */
    'result-shop': {
      subject: 'WooCommerce-Shop',
      body: 'wir brauchen einen Online-Shop mit individuellen Anforderungen. Shopify reicht nicht, weil wir eigene Prozesse abbilden muessen.',
      url: true
    },
    'result-shop-standard': {
      subject: 'Online-Shop (Beratung)',
      body: 'ich habe Ihren Funnel durchgeklickt und Sie haben ehrlich gesagt, dass Shopify fuer unseren Fall reichen koennte. Trotzdem wuerde ich gern kurz mit Ihnen sprechen, ob WooCommerce sich langfristig lohnt.',
      url: true
    },
    'result-shop-gross': {
      subject: 'Grosser Online-Shop (500+ Produkte)',
      body: 'wir brauchen einen Shop mit grossem Produktkatalog. Ihre Hinweise zu Hosting und Infrastruktur bei 500+ Produkten waren hilfreich.',
      url: true
    },
    'result-shop-b2b': {
      subject: 'B2B-Shop mit Haendlerportal',
      body: 'wir brauchen einen B2B-Shop – Staffelpreise, Haendlerzugaenge, Freigabeprozesse. Kein Standard-Theme, sondern ein Werkzeug fuer unseren Vertrieb.',
      url: true
    },
    /* ── Portal ── */
    'result-portal-karriere': {
      subject: 'Karriereportal (Custom)',
      body: 'wir brauchen ein Karriereportal, das ueber das hinausgeht, was JOIN oder Personio koennen – eigenes Design, Integration in unsere Website.',
      url: true
    },
    'result-portal-karriere-standard': {
      subject: 'Karriereportal (Beratung)',
      body: 'Sie haben ehrlich gesagt, dass ein Standardtool fuer unseren Bedarf reichen koennte. Trotzdem ein paar Fragen dazu.',
      url: false
    },
    'result-portal-kunden': {
      subject: 'Kundenportal mit Login',
      body: 'wir brauchen einen Login-Bereich fuer unsere Kunden – Daten einsehen, Dokumente, vielleicht Bestellhistorie. Ihr Hinweis zu DSGVO-Anforderungen war wichtig.',
      url: true
    },
    'result-portal-intern': {
      subject: 'Custom-Tool / Web-App',
      body: 'wir brauchen ein internes Tool, das kein fertiges Produkt abbilden kann. Ich habe geprueft: Standardtools reichen nicht.',
      url: false
    },
    'result-portal-tool': {
      subject: 'Beratung Toolauswahl',
      body: 'Sie haben mich darauf gebracht, dass ein fertiges Tool fuer uns reichen koennte. Koennen Sie uns bei der Auswahl beraten?',
      url: false
    },
    'result-portal-bericht': {
      subject: 'Interaktiver Bericht',
      body: 'wir moechten einen Bericht (Jahresbericht / Wirkungsbericht) als interaktive Website statt als PDF erstellen.',
      url: false
    },
    'result-landingpage': {
      subject: 'Landingpage',
      body: 'wir brauchen eine fokussierte Landingpage fuer ein konkretes Angebot. Eine Seite, ein Ziel.',
      url: false
    },
    /* ── Problem: Redesign ── */
    'result-redesign': {
      subject: 'Design-Update unserer Website',
      body: 'das Design unserer Website ist veraltet, aber Technik und Inhalte stimmen noch. Wir brauchen ein visuelles Update, keinen Komplett-Relaunch.',
      url: true
    },
    'result-redesign-technik': {
      subject: 'Technisches Update unserer Website',
      body: 'unsere Website hat ein Technik-Problem: nicht responsive, veraltetes PHP oder kein HTTPS. Wir brauchen Hilfe beim technischen Fundament.',
      url: true
    },
    'result-redesign-content': {
      subject: 'Content-Update unserer Website',
      body: 'unsere Website-Inhalte sind veraltet (falsche Leistungen, alte Fotos). Wir brauchen ein Content-Update, kein Redesign.',
      url: true
    },
    'result-redesign-komplett': {
      subject: 'Komplett-Redesign',
      body: 'bei unserer Website ist alles veraltet: Design, Technik und Inhalte. Wir brauchen einen Neuanfang, aber sinnvoll geplant.',
      url: true
    },
    /* ── Problem: Performance ── */
    'result-performance-wp': {
      subject: 'WordPress-Performance',
      body: 'unsere WordPress-Website ist zu langsam. Ich habe pagespeed.web.dev geprueft und der Score ist nicht gut. Koennen Sie sich das anschauen?',
      url: true
    },
    'result-performance': {
      subject: 'Website zu langsam',
      body: 'unsere Website ist zu langsam. Ich habe pagespeed.web.dev getestet. Koennen Sie sich das anschauen?',
      url: true
    },
    /* ── Problem: BFSG ── */
    'result-bfsg': {
      subject: 'Barrierefreiheit / BFSG',
      body: 'wir muessen unsere Website barrierefrei machen (BFSG). Ich habe den Schnelltest aus Ihrem Funnel gemacht und mindestens ein Problem gefunden.',
      url: true
    },
    'result-bfsg-fix': {
      subject: 'BFSG-Fehler beheben',
      body: 'wir haben unsere Website pruefen lassen und wissen, welche BFSG-Fehler existieren. Koennen Sie die beheben und dokumentieren?',
      url: true
    },
    /* ── Problem: SEO / GEO ── */
    'result-seo-google': {
      subject: 'Google-Sichtbarkeit',
      body: 'unsere Website wird bei Google schlecht gefunden. Koennen Sie sich das anschauen?',
      url: true
    },
    'result-seo-ki': {
      subject: 'KI-Sichtbarkeit',
      body: 'ich habe ChatGPT nach unserem Unternehmen gefragt und die Antwort war duenn oder falsch. Koennen Sie helfen, unsere Website fuer KI-Systeme sichtbar zu machen?',
      url: true
    },
    'result-seo': {
      subject: 'Website wird nicht gefunden',
      body: 'unsere Website wird schlecht gefunden – weder bei Google noch bei KI-Systemen. Koennen Sie sich das anschauen?',
      url: true
    },
    /* ── Problem: Technik ── */
    'result-technik-wp': {
      subject: 'WordPress-Problem',
      body: 'unsere WordPress-Website hat ein technisches Problem. Ich habe Plugins deaktiviert und den Health Check geprueft, komme aber nicht weiter.',
      url: true
    },
    'result-technik-woo': {
      subject: 'WooCommerce-Problem',
      body: 'unser WooCommerce-Shop hat ein Problem – Bestellungen, Zahlungen oder Darstellung. Koennen Sie sich das zeitnah anschauen?',
      url: true
    },
    'result-technik': {
      subject: 'Technisches Problem',
      body: 'auf unserer Website ist etwas kaputt und wir kommen nicht weiter. Koennen Sie sich das anschauen?',
      url: true
    },
    'result-technik-sicherheit': {
      subject: 'DRINGEND: Website gehackt',
      body: 'unsere Website wurde vermutlich gehackt oder enthaelt Malware. Wir brauchen schnell Hilfe.',
      url: true
    },
    /* ── Betreuung ── */
    'result-betreuung-wp-basis': {
      subject: 'WordPress-Betreuung (Basis)',
      body: 'wir suchen jemanden, der sich um Updates, Sicherheit und Backups unserer WordPress-Website kuemmert.',
      url: true
    },
    'result-betreuung-wp-standard': {
      subject: 'WordPress-Betreuung (Standard)',
      body: 'wir suchen jemanden fuer die laufende Betreuung unserer WordPress-Website – Updates plus regelmaessige inhaltliche Aenderungen.',
      url: true
    },
    'result-betreuung-woo-basis': {
      subject: 'WooCommerce-Betreuung (Basis)',
      body: 'wir suchen jemanden, der sich um Updates und Monitoring unseres WooCommerce-Shops kuemmert.',
      url: true
    },
    'result-betreuung-woo-standard': {
      subject: 'WooCommerce-Betreuung (Standard)',
      body: 'wir suchen jemanden fuer die laufende Betreuung unseres WooCommerce-Shops – Updates plus regelmaessige Aenderungen und Support.',
      url: true
    },
    'result-betreuung-statisch': {
      subject: 'Betreuung statische Website',
      body: 'wir haben eine statische Website und brauchen gelegentlich jemanden fuer Aenderungen.',
      url: true
    },
    'result-betreuung-premium': {
      subject: 'Komplett-Betreuung',
      body: 'wir suchen im Grunde einen eigenen Webentwickler – jemanden, der unsere Website komplett betreut und sich um alles kuemmert. Retainer-Modell.',
      url: true
    },
    /* ── GEO ── */
    'result-geo': {
      subject: 'KI-Sichtbarkeit',
      body: 'ich habe auf Ihrer Website gelesen, wie Sie Websites fuer KI-Systeme sichtbar machen. Das interessiert mich.',
      url: true
    },
    'result-geo-audit': {
      subject: 'KI-Sichtbarkeits-Audit',
      body: 'mich wuerde interessieren, wie sichtbar unsere Website fuer KI-Systeme ist. Koennen Sie das pruefen?',
      url: true
    },
    /* ── Vergleich ── */
    'result-vergleich-kontakt': {
      subject: 'Anfrage nach Anbietervergleich',
      body: 'ich habe Ihren Berater-Funnel durchgeklickt und die Tipps zur Freelancer-Auswahl waren hilfreich. Ich wuerde gern Ihre Antworten auf die fuenf Fragen hoeren.',
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

  function buildEmailFromPath() {
    var resultId = getLastResultId();
    var fb = { subject: 'Anfrage', body: 'ich habe mir Ihre Website angeschaut und w\u00fcrde gern mit Ihnen sprechen.', url: false };
    var data = RESULT_EMAILS[resultId] || fb;

    var subject = data.subject;
    var body = 'Hallo Herr Andersen,\n\n' + data.body;
    if (data.url) {
      body += '\n\nUnsere Website: [URL]';
    }
    body += '\n\nK\u00f6nnen wir kurz telefonieren?\n\nViele Gr\u00fc\u00dfe\n[Ihr Name]';

    var previewHtml = 'Hallo Herr Andersen,\n\n' + esc(data.body);
    if (data.url) {
      previewHtml += '\n\nUnsere Website: <span class="funnel-contact-placeholder">[URL]</span>';
    }
    previewHtml += '\n\nK\u00f6nnen wir kurz telefonieren?\n\nViele Gr\u00fc\u00dfe\n<span class="funnel-contact-placeholder">[Ihr Name]</span>';

    return { subject: subject, body: body, previewHtml: previewHtml };
  }

  function buildContact() {
    var email = buildEmailFromPath();
    var mailtoHref = 'mailto:mail@andersen-webworks.de?subject=' +
      encodeURIComponent(email.subject) + '&body=' + encodeURIComponent(email.body);

    var h = backBtn();

    /* Personal intro with portrait */
    h += '<div class="funnel-contact-intro funnel-stagger">';
    h += '<img src="portrait.webp" alt="Jan-Erik Andersen" class="funnel-contact-portrait" width="56" height="56" loading="lazy">';
    h += '<div class="funnel-contact-intro-text">';
    h += '<h3 class="funnel-result-title" tabindex="-1">Freut mich.</h3>';
    h += '<p class="funnel-contact-intro-sub">Ich hab schon mal was vorbereitet \u2013 Sie m\u00fcssen nur noch absenden.</p>';
    h += '</div>';
    h += '</div>';

    /* Email preview */
    h += '<div class="funnel-contact-preview funnel-stagger" style="--i:1">';
    h += '<div class="funnel-contact-preview-header">';
    h += '<span class="funnel-contact-preview-to">An: mail@andersen-webworks.de</span>';
    h += '<span class="funnel-contact-preview-subject">' + esc(email.subject) + '</span>';
    h += '</div>';
    h += '<div class="funnel-contact-preview-body">' + email.previewHtml + '</div>';
    h += '</div>';

    /* Primary CTA: send email */
    h += '<a href="' + esc(mailtoHref) + '" class="funnel-contact-send funnel-stagger" style="--i:2">';
    h += '<span class="funnel-contact-send-icon">' + ICONS.mail + '</span>';
    h += '<span class="funnel-contact-send-text">';
    h += '<strong>E-Mail absenden</strong>';
    h += '<span>Erstgespr\u00e4ch kostenlos</span>';
    h += '</span>';
    h += '<span class="funnel-cta-arrow">' + ICONS['chevron-right'] + '</span>';
    h += '</a>';

    /* Alternative contact */
    h += '<div class="funnel-contact-alt funnel-stagger" style="--i:3">';
    h += '<span class="funnel-contact-alt-label">Oder direkt:</span>';
    h += '<a href="tel:+4938733270015" class="funnel-result-link">';
    h += '<span class="funnel-action-icon">' + ICONS.phone + '</span> 038733 270015</a>';
    h += '<a href="https://www.linkedin.com/in/andersen-erik/" target="_blank" rel="noopener" class="funnel-result-link">';
    h += '<span class="funnel-action-icon">' + ICONS.linkedin + '</span> LinkedIn</a>';
    h += '</div>';

    h += '<div class="funnel-result-actions funnel-stagger" style="--i:4">';
    h += '<button class="funnel-restart" data-action="restart">';
    h += '<span class="funnel-action-icon">' + ICONS['refresh-cw'] + '</span> Nochmal von vorn</button>';
    h += '<button class="funnel-exit-btn" data-action="exit">';
    h += '<span class="funnel-action-icon">' + ICONS['external-link'] + '</span> Mehr \u00fcber mich lesen</button>';
    h += '</div>';

    return h;
  }

  function backBtn() {
    if (history.length === 0) return '';
    return '<button class="funnel-back funnel-stagger" aria-label="Zur\u00fcck">' +
           '<span class="funnel-back-arrow" aria-hidden="true">' + ICONS['arrow-left'] + '</span> Zur\u00fcck</button>';
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

  /* ── Mouse Spotlight ──────────────────────────────── */

  if (funnel && window.matchMedia('(pointer: fine)').matches) {
    var spot = document.createElement('div');
    spot.className = 'funnel-spotlight';
    funnel.appendChild(spot);

    funnel.addEventListener('mousemove', function (e) {
      spot.style.left = e.clientX + 'px';
      spot.style.top = e.clientY + 'px';
    });

    funnel.addEventListener('mouseenter', function () { spot.style.opacity = '1'; });
    funnel.addEventListener('mouseleave', function () { spot.style.opacity = '0'; });
  }

  /* ── Start ────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
