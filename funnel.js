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
    'result-website': {
      subject: 'Neue Unternehmenswebsite',
      body: 'wir brauchen eine neue Website f\u00fcr unser Unternehmen. Bisher haben wir noch nichts, oder das Bestehende ist nicht mehr vorzeigbar.',
      url: true
    },
    'result-website-gross': {
      subject: 'Website f\u00fcr Firmengruppe',
      body: 'wir sind eine Unternehmensgruppe mit mehreren Gesellschaften und brauchen einen einheitlichen Web-Auftritt \u2013 wahrscheinlich mehrsprachig.',
      url: true
    },
    'result-shop': {
      subject: 'Online-Shop',
      body: 'wir m\u00f6chten einen Online-Shop aufbauen. Es geht um den Verkauf an Endkunden.',
      url: true
    },
    'result-shop-b2b': {
      subject: 'B2B-Shop mit H\u00e4ndlerbereich',
      body: 'wir brauchen einen B2B-Shop mit Händlerbereich \u2013 also Preislisten, Kundenzug\u00e4nge, das ganze Programm.',
      url: true
    },
    'result-portal': {
      subject: 'Web-App / Portal',
      body: 'wir brauchen eine Web-App oder ein Portal \u2013 kein klassischer Internetauftritt, sondern etwas Interaktives, in dem Nutzer arbeiten k\u00f6nnen.',
      url: false
    },
    'result-landingpage': {
      subject: 'Landingpage',
      body: 'wir brauchen eine einzelne, gute Seite \u2013 eine Landingpage f\u00fcr ein konkretes Angebot oder Thema.',
      url: false
    },
    'result-redesign': {
      subject: 'Redesign unserer Website',
      body: 'unsere Website sieht nicht mehr zeitgem\u00e4\u00df aus. Wir brauchen ein Redesign \u2013 Technik, Design, oder beides.',
      url: true
    },
    'result-performance': {
      subject: 'Website zu langsam',
      body: 'unsere Website ist zu langsam und wir wissen nicht genau woran es liegt. K\u00f6nnen Sie sich das mal anschauen?',
      url: true
    },
    'result-bfsg': {
      subject: 'Barrierefreiheit / BFSG',
      body: 'wir m\u00fcssen unsere Website barrierefrei machen (BFSG). K\u00f6nnen Sie einsch\u00e4tzen, was daf\u00fcr n\u00f6tig ist?',
      url: true
    },
    'result-seo': {
      subject: 'Website wird nicht gefunden',
      body: 'unsere Website wird schlecht gefunden \u2013 weder bei Google noch bei KI-Assistenten. Wir brauchen Hilfe bei der Sichtbarkeit.',
      url: true
    },
    'result-technik': {
      subject: 'Technisches Problem',
      body: 'auf unserer Website ist etwas kaputt und wir kommen nicht weiter. K\u00f6nnen Sie sich das zeitnah anschauen?',
      url: true
    },
    'result-betreuung-basis': {
      subject: 'Website-Betreuung (Basis)',
      body: 'wir suchen jemanden, der sich um Updates, Sicherheit und Backups unserer Website k\u00fcmmert \u2013 zuverl\u00e4ssig und im Hintergrund.',
      url: true
    },
    'result-betreuung-standard': {
      subject: 'Website-Betreuung',
      body: 'wir suchen jemanden f\u00fcr die laufende Betreuung unserer Website \u2013 nicht nur Technik, sondern auch regelm\u00e4\u00dfige inhaltliche \u00c4nderungen.',
      url: true
    },
    'result-betreuung-premium': {
      subject: 'Komplett-Betreuung',
      body: 'wir suchen im Grunde einen eigenen Webentwickler \u2013 jemanden, der unsere Website komplett betreut und sich um alles k\u00fcmmert.',
      url: true
    },
    'result-geo': {
      subject: 'KI-Sichtbarkeit',
      body: 'ich habe auf Ihrer Website gelesen, wie Sie Websites f\u00fcr KI-Systeme sichtbar machen. Das interessiert mich \u2013 k\u00f6nnen Sie mir mehr dazu erz\u00e4hlen?',
      url: true
    },
    'result-geo-audit': {
      subject: 'KI-Sichtbarkeits-Audit',
      body: 'mich w\u00fcrde interessieren, wie sichtbar unsere Website f\u00fcr KI-Systeme ist. K\u00f6nnen Sie das pr\u00fcfen?',
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

  /* ── Start ────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
