/**
 * Berater-Funnel Engine v3
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
    /* Start */
    { match: 'neue Website',          icon: 'monitor' },
    { match: 'Website oder einen Shop', icon: 'monitor' },
    { match: 'Problem',               icon: 'alert-triangle' },
    { match: 'Betreuung',             icon: 'shield' },
    { match: 'KI-Sichtbarkeit',      icon: 'eye' },
    { match: 'Kontakt aufnehmen',     icon: 'mail' },
    { match: 'selbst lesen',          icon: 'book-open' },
    { match: 'Was kostet',            icon: 'file-text' },
    { match: 'vergleiche Anbieter',   icon: 'search' },
    /* Neue Website */
    { match: 'Firmenwebsite',         icon: 'monitor' },
    { match: 'Unternehmenswebsite',   icon: 'monitor' },
    { match: 'Online-Shop',           icon: 'shopping-bag' },
    { match: 'Web-App',               icon: 'code' },
    { match: 'Portal, Tool',          icon: 'code' },
    { match: 'Landingpage',           icon: 'file-text' },
    { match: 'Onepager',              icon: 'file-text' },
    { match: 'nicht sicher',          icon: 'search' },
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
    { match: 'B2C',                   icon: 'shopping-bag' },
    { match: 'Endkunden',             icon: 'shopping-bag' },
    { match: 'ndler',                 icon: 'shopping-bag' },
    { match: 'Gewerbekunden',         icon: 'shopping-bag' },
    { match: 'Unter 50',              icon: 'file-text' },
    { match: '50 bis 500',            icon: 'layers' },
    { match: 'ber 500',               icon: 'maximize' },
    { match: 'WooCommerce',           icon: 'shopping-bag' },
    { match: 'was Individuelles',     icon: 'code' },
    { match: 'Standard könnte',       icon: 'layers' },
    { match: 'Standard reicht',       icon: 'layers' },
    { match: 'Standard klingt',       icon: 'layers' },
    { match: 'das brauche ich',       icon: 'chevron-right' },
    { match: 'ist das einfacher',     icon: 'layers' },
    { match: 'ist das anders',        icon: 'layers' },
    { match: 'in meinen Rahmen',      icon: 'chevron-right' },
    /* Portal */
    { match: 'Karriere',              icon: 'layers' },
    { match: 'Stellen ausschreiben',  icon: 'layers' },
    { match: 'Bewerbungen',           icon: 'layers' },
    { match: 'Kundenportal',          icon: 'shield' },
    { match: 'Kunden einloggen',      icon: 'shield' },
    { match: 'Daten einsehen',        icon: 'shield' },
    { match: 'Internes Tool',         icon: 'code' },
    { match: 'Bericht',               icon: 'file-text' },
    { match: 'Report',                icon: 'file-text' },
    { match: 'mehr als Standard',     icon: 'code' },
    { match: 'wirklich Custom',       icon: 'code' },
    { match: 'reicht ein Tool',       icon: 'layers' },
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
    { match: 'Gehackt',               icon: 'alert-triangle' },
    { match: 'Sicherheitsproblem',    icon: 'alert-triangle' },
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
    { match: 'Sicherheit',            icon: 'shield' },
    { match: 'nderungen',             icon: 'layers' },
    { match: 'Komplett',              icon: 'maximize' },
    { match: 'Statisch',              icon: 'code' },
    { match: 'festen Entwickler',     icon: 'maximize' },
    { match: 'Basis reicht',          icon: 'shield' },
    { match: 'Premium',               icon: 'maximize' },
    { match: 'schaftskritisch',       icon: 'maximize' },
    /* GEO */
    { match: 'Nichts',                icon: 'book-open' },
    { match: 'Grundidee',             icon: 'eye' },
    { match: 'Audit',                 icon: 'search' },
    { match: 'Klingt relevant',       icon: 'eye' },
    /* Budget */
    { match: 'Unter 2.400',           icon: 'file-text' },
    { match: 'Unter 2.000',           icon: 'file-text' },
    { match: 'Unter 4.800',           icon: 'file-text' },
    { match: 'Unter 10.000',          icon: 'file-text' },
    { match: 'Budget ist kleiner',    icon: 'file-text' },
    { match: '2.400',                 icon: 'layers' },
    { match: '2.000',                 icon: 'layers' },
    { match: '4.800',                 icon: 'layers' },
    { match: '10.000',                icon: 'layers' },
    { match: '20.000',                icon: 'maximize' },
    { match: 'ber 10.000',            icon: 'maximize' },
    { match: 'ber 20.000',            icon: 'maximize' },
    { match: 'Projekt ist größer',    icon: 'maximize' },
    { match: 'Katalog ist größer',    icon: 'maximize' },
    { match: 'Budget steht',          icon: 'search' },
    { match: 'Baukästen',             icon: 'book-open' },
    { match: 'Trotzdem kurz',         icon: 'mail' },
    { match: 'Trotzdem reden',        icon: 'mail' },
    { match: 'Trotzdem Fragen',       icon: 'mail' },
    /* Zeitrahmen */
    { match: 'So schnell',            icon: 'zap' },
    { match: '1–3 Monaten',           icon: 'layers' },
    { match: '2–3 Monaten',           icon: 'layers' },
    { match: '3–6 Monaten',           icon: 'layers' },
    { match: '4–8 Wochen',            icon: 'layers' },
    { match: '6+ Monaten',            icon: 'maximize' },
    { match: 'Kein fester',           icon: 'search' },
    /* Produktanzahl */
    { match: 'Unter 50 Prod',         icon: 'file-text' },
    { match: '50–200',                icon: 'layers' },
    { match: '200–500',               icon: 'layers' },
    { match: 'ber 500 Prod',          icon: 'maximize' },
    /* Branchen */
    { match: 'Handwerk',              icon: 'tool' },
    { match: 'Produktion',            icon: 'tool' },
    { match: 'Beratung',              icon: 'layers' },
    { match: 'Dienstleistung',        icon: 'layers' },
    { match: 'Agentur',               icon: 'layers' },
    { match: 'Steuer',                icon: 'shield' },
    { match: 'Finanzen',              icon: 'shield' },
    { match: 'Gesundheit',            icon: 'shield' },
    { match: 'Soziales',              icon: 'shield' },
    { match: 'Firmengruppe',          icon: 'maximize' },
    { match: 'Holding',               icon: 'maximize' },
    /* Redesign-spezifisch */
    { match: 'Facelift',              icon: 'monitor' },
    { match: 'Phasen-Ansatz',         icon: 'layers' },
    { match: 'Umfang reduzieren',     icon: 'file-text' },
    { match: 'MVP',                   icon: 'zap' },
    { match: 'Kompromisse',           icon: 'layers' },
    { match: 'realistisch planen',    icon: 'layers' },
    { match: 'berdenke',              icon: 'search' },
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
    /* CTA / Result actions */
    { match: 'Mail schreiben',        icon: 'mail' },
    { match: 'schicken',              icon: 'mail' },
    { match: 'Schicken',              icon: 'mail' },
    { match: 'rzählen',               icon: 'mail' },
    { match: 'Reden wir',             icon: 'mail' },
    { match: 'reden wir',             icon: 'mail' },
    { match: 'sprechen',              icon: 'mail' },
    { match: 'Sprechen',              icon: 'mail' },
    { match: 'Minuten',               icon: 'mail' },
    { match: 'besprechen',            icon: 'mail' },
    { match: 'Beschreiben',           icon: 'mail' },
    { match: 'schildern',             icon: 'mail' },
    { match: 'melden',                icon: 'alert-triangle' },
    { match: 'prüfen',                icon: 'search' },
    { match: 'Lassen Sie uns',        icon: 'mail' },
    /* Navigation */
    { match: 'ck zum Anfang',         icon: 'refresh-cw' },
    { match: 'Anderes',               icon: 'layers' },
    { match: 'Beides',                icon: 'layers' }
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
    return '<span class="funnel-step-label funnel-stagger" style="--i:0">Schritt ' + step + ' von ' + total + '</span>';
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
    // Check for deep link to a result via URL hash
    var hash = window.location.hash.replace('#', '');

    if (window.location.protocol === 'file:' || (isFunnelDone() && !hash)) {
      skipFunnel();
      return;
    }
    // Mobile: Funnel als Block im Flow rendern, kein Modal-Overlay
    // (Google straft Intrusive Interstitials ab; Mobile bekommt Funnel kompakt)
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      document.documentElement.classList.add('funnel-active', 'funnel-inline');
    } else {
      // Desktop: Modal mit 800ms Delay -- User sieht erst Hero, dann Wow-Effekt
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

      // Fire synapse BEFORE new content appears
      if (direction === 'forward') {
        updateConstellationDepth();
      }

      currentNodeId = nodeId;
      app.setAttribute('data-node', nodeId);
      app.innerHTML = buildHTML(nodeId);
      bindEvents();

      // D3: Update URL hash for result nodes (shareable links)
      var node = tree[nodeId];
      if (node && node.type === 'result') {
        window.history.replaceState(null, '', '#' + nodeId);
        trackEvent('result', nodeId);
      } else if (nodeId === '_contact') {
        trackEvent('contact');
      }

      // Delay slide-in so the synapse line is visible first
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
    /* ── Direkt / Allgemein ── */
    'result-direkt': {
      subject: 'Kurze Anfrage',
      body: 'ich moechte kurz mit Ihnen sprechen. Kein langer Funnel noetig – hier ist mein Anliegen:',
      url: false
    },
    'result-beratung': {
      subject: 'Beratungsgespraech',
      body: 'ich bin nicht sicher, was genau ich brauche. Koennen wir kurz sprechen, um das zu klaeren?',
      url: true
    },
    'result-budget-klein': {
      subject: 'Website – kleines Budget',
      body: 'mein Budget liegt unter 2.400 EUR. Ich weiss, dass das knapp ist, aber vielleicht gibt es trotzdem einen Weg.',
      url: true
    },
    /* ── Neue Website ── */
    'result-website': {
      subject: 'Neue Firmenwebsite',
      body: 'wir brauchen eine neue Website fuer unser Unternehmen. Ich habe Ihren Berater-Funnel durchgeklickt.',
      url: true
    },
    'result-industrie': {
      subject: 'Firmenwebsite (Industrie/Handwerk)',
      body: 'wir sind ein Industriebetrieb und brauchen eine neue Website. Ihr Hinweis zu Gerwing Steinwerke und Ihre Erfahrung mit B2B-Katalogen klingt passend.',
      url: true
    },
    'result-beratung-branche': {
      subject: 'Firmenwebsite (Beratung/Dienstleistung)',
      body: 'wir sind eine Beratungsfirma und brauchen eine neue Website. Ihr Punkt zu Vertrauen und KI-Sichtbarkeit hat mich angesprochen.',
      url: true
    },
    'result-recht': {
      subject: 'Firmenwebsite (Kanzlei/Steuerbuero)',
      body: 'wir sind eine Kanzlei/ein Steuerbuero und brauchen eine neue Website. Ihr Hinweis, dass alle Kanzlei-Websites gleich aussehen, trifft leider auch auf unsere zu.',
      url: true
    },
    'result-sozial': {
      subject: 'Website (Verein/soziale Einrichtung)',
      body: 'wir sind ein Verein/eine soziale Einrichtung und brauchen eine neue Website. Ihr Hinweis zu begrenzten Budgets und echten Geschichten hat mich angesprochen.',
      url: true
    },
    'result-gross': {
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
    'result-shop-mittel': {
      subject: 'WooCommerce-Shop (200-500 Produkte)',
      body: 'wir brauchen einen Online-Shop mit 200-500 Produkten. Ihr Hinweis zum strukturierten Import war hilfreich – manuelles Einpflegen ist keine Option.',
      url: true
    },
    'result-shop-budget-knapp': {
      subject: 'WooCommerce-Shop (Budget begrenzt)',
      body: 'wir brauchen einen Shop, haben aber ein begrenztes Budget (unter 4.800 EUR). Ich bin bereit, Kompromisse zu machen – reden wir ueber die Optionen.',
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
    'result-shop-beratung': {
      subject: 'Shop-Beratung',
      body: 'ich bin nicht sicher, ob Shopify reicht oder WooCommerce sein muss. Koennen wir kurz sprechen?',
      url: true
    },
    'result-shop-budget-klein': {
      subject: 'Shop (Budget begrenzt)',
      body: 'wir brauchen einen Shop, haben aber ein begrenztes Budget (unter 4.800 EUR). Ich bin bereit, Kompromisse zu machen.',
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
    'result-portal-standard': {
      subject: 'Karriereportal (Standard)',
      body: 'Sie haben ehrlich gesagt, dass ein Standardtool fuer unseren Bedarf reichen koennte. Trotzdem ein paar Fragen dazu.',
      url: false
    },
    'result-portal-custom': {
      subject: 'Custom-Tool / Web-App',
      body: 'wir brauchen ein Tool, das kein fertiges Produkt abbilden kann. Ich habe geprueft: Standardtools reichen nicht.',
      url: false
    },
    'result-bericht': {
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
    'result-relaunch': {
      subject: 'Komplett-Relaunch',
      body: 'unsere Website braucht einen kompletten Neuanfang – Design, Technik und Inhalte. Ich habe Ihren Funnel durchgeklickt.',
      url: true
    },
    'result-redesign-beratung': {
      subject: 'Redesign oder Relaunch?',
      body: 'ich bin nicht sicher, ob ein Facelift reicht oder ob wir einen Komplett-Relaunch brauchen. Koennen wir das klaeren?',
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
    'result-sicherheit': {
      subject: 'DRINGEND: Website gehackt',
      body: 'unsere Website wurde vermutlich gehackt oder enthaelt Malware. Wir brauchen schnell Hilfe.',
      url: true
    },
    /* ── Betreuung ── */
    'result-betreuung-basis': {
      subject: 'Website-Betreuung (Basis)',
      body: 'wir suchen jemanden, der sich um Updates, Sicherheit und Backups unserer Website kuemmert.',
      url: true
    },
    'result-betreuung-standard': {
      subject: 'Website-Betreuung (Standard)',
      body: 'wir suchen jemanden fuer die laufende Betreuung unserer Website – Updates plus regelmaessige inhaltliche Aenderungen.',
      url: true
    },
    'result-betreuung-premium': {
      subject: 'Website-Betreuung (Premium/Retainer)',
      body: 'wir suchen im Grunde einen eigenen Webentwickler – jemanden, der unsere Website komplett betreut. Retainer-Modell.',
      url: true
    },
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
    /* ── GEO (neue Nodes) ── */
    'result-geo-baukasten': {
      subject: 'KI-Sichtbarkeit (Baukasten)',
      body: 'unsere Website laeuft auf einem Baukastensystem und wir wuerden gern die KI-Sichtbarkeit verbessern. Ihr Funnel hat ehrlich gesagt, dass das schwierig wird – koennen wir die Optionen besprechen?',
      url: true
    },
    'geo-neubau': {
      subject: 'Neue Website mit KI-Sichtbarkeit',
      body: 'wir planen eine neue Website und moechten, dass KI-Sichtbarkeit von Anfang an eingebaut ist. Ihr Funnel hat uns ueberzeugt.',
      url: true
    },
    /* ── BFSG (neue Nodes) ── */
    'bfsg-nicht-betroffen': {
      subject: 'Barrierefreiheit (freiwillig)',
      body: 'wir sind laut Ihrem Check nicht BFSG-pflichtig, wuerden unsere Website aber trotzdem barrierefrei machen lassen. Koennen Sie das einschaetzen?',
      url: true
    },
    'result-bfsg-audit': {
      subject: 'BFSG-Audit',
      body: 'wir moechten pruefen lassen, ob unsere Website barrierefrei ist. Ihr Funnel hat uns auf konkrete Testpunkte hingewiesen – einige davon bestehen wir nicht.',
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

  var PATH_CONTEXT = {
    'neu-was': 'Neue Website/Shop',
    'website-budget': 'Budget-Check',
    'website-branche': 'Branchenauswahl',
    'website-gross': 'Grossprojekt',
    'shop-art': 'Shop-Typ',
    'shop-b2c': 'B2C-Shop',
    'shop-b2b': 'B2B-Shop',
    'shop-budget': 'Shop-Budget',
    'portal-was': 'Portal/Tool',
    'portal-karriere': 'Karriereportal',
    'portal-intern': 'Internes Tool',
    'problem-was': 'Bestehendes Problem',
    'problem-redesign': 'Redesign-Check',
    'problem-technik': 'Technisches Problem',
    'betreuung-was': 'Laufende Betreuung',
    'betreuung-info': 'Betreuungs-Pakete',
    'geo-einstieg': 'KI-Sichtbarkeit',
    'geo-nachr\u00fcsten': 'KI nachruesten',
    'bfsg-check': 'BFSG-Betroffenheit',
    'bfsg-betroffen': 'BFSG-pflichtig'
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
    var fb = { subject: 'Anfrage', body: 'ich habe mir Ihre Website angeschaut und w\u00fcrde gern mit Ihnen sprechen.', url: false };
    var data = RESULT_EMAILS[resultId] || fb;

    var pathSummary = buildPathSummary();
    var subject = data.subject;
    var body = 'Hallo Herr Andersen,\n\n' + data.body;
    if (data.url) {
      body += '\n\nUnsere Website: [URL]';
    }
    if (pathSummary) {
      body += '\n\n(Mein Weg durch den Berater: ' + pathSummary + ')';
    }
    body += '\n\nK\u00f6nnen wir kurz telefonieren?\n\nViele Gr\u00fc\u00dfe\n[Ihr Name]';

    var previewHtml = 'Hallo Herr Andersen,\n\n' + esc(data.body);
    if (data.url) {
      previewHtml += '\n\nUnsere Website: <span class="funnel-contact-placeholder">[URL]</span>';
    }
    if (pathSummary) {
      previewHtml += '\n\n<span class="funnel-contact-placeholder">(Mein Weg: ' + esc(pathSummary) + ')</span>';
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
    h += '<a href="' + esc(mailtoHref) + '" class="funnel-contact-send funnel-stagger" style="--i:2" data-action="mailto">';
    h += '<span class="funnel-contact-send-icon">' + ICONS.mail + '</span>';
    h += '<span class="funnel-contact-send-text">';
    h += '<strong>Mail-Entwurf \u00f6ffnen</strong>';
    h += '<span>Erstgespr\u00e4ch kostenlos</span>';
    h += '</span>';
    h += '<span class="funnel-cta-arrow">' + ICONS['chevron-right'] + '</span>';
    h += '</a>';

    /* D2: Trust badge */
    h += '<p class="funnel-trust-badge funnel-stagger" style="--i:2.5">E-Mails beantworte ich innerhalb eines Werktags. 27+ Jahre Webprojekte \u00b7 50+ Projekte \u00b7 14+ Branchen.</p>';

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
        // D1: Track path choice on start screen
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
    // Clear URL hash on exit
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
      // Only trigger on horizontal swipes (not vertical scroll)
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0 && history.length > 0) {
          goBack(); // Swipe right = go back
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

    // Convert numbered lists: "1. text 2. text 3. text" → <ol>
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

    // Convert double newlines to visual breaks (for price hints etc.)
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
  /*
   * One cursor per slide. Types ALL visible text sequentially.
   * Plain text elements: character by character.
   * HTML-rich elements (info-text, result-text): fade in as block.
   * Cursor blinks, moves between elements, disappears when done.
   */

  var typewriterTimer = null;
  var typewriterCursor = null;
  var TARGET_DURATION = 2000; // total typing time in ms

  function applyTypewriter() {
    // Kill any running typewriter
    if (typewriterTimer) clearTimeout(typewriterTimer);
    if (typewriterCursor && typewriterCursor.parentNode) {
      typewriterCursor.parentNode.removeChild(typewriterCursor);
    }

    // Collect elements to type, in visual order
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

    // HTML-rich elements that get revealed as a block, not typed
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
          // Only type elements that have direct text
          var text = el.textContent;
          if (text.length > 0) {
            // Preserve child elements (icons, arrows) - only blank out text nodes
            var savedChildren = [];
            while (el.firstChild) {
              savedChildren.push(el.removeChild(el.firstChild));
            }
            // Separate text nodes from element nodes
            var textContent = '';
            var trailingElements = [];
            for (var c = 0; c < savedChildren.length; c++) {
              if (savedChildren[c].nodeType === 3) {
                textContent += savedChildren[c].textContent;
              } else {
                trailingElements.push(savedChildren[c]);
              }
            }
            // Re-append non-text children (icons etc) hidden
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

    // Calculate speed: total chars / target duration
    var totalChars = 0;
    for (var q = 0; q < queue.length; q++) {
      if (!queue[q].instant) totalChars += queue[q].text.length;
    }
    var charSpeed = Math.max(8, Math.min(25, Math.floor(TARGET_DURATION / Math.max(totalChars, 1))));
    var pauseBetween = charSpeed * 3;

    // Create cursor
    typewriterCursor = document.createElement('span');
    typewriterCursor.className = 'typewriter-cursor';
    typewriterCursor.textContent = '\u2502';

    // Map each queue item to its closest stagger-parent (button, div, etc.)
    // so we can reveal the container when its content starts typing
    for (var r = 0; r < queue.length; r++) {
      var staggerParent = queue[r].el.closest('.funnel-stagger') || queue[r].el;
      queue[r].container = staggerParent;
    }

    // Hide ALL stagger elements - they fade in when typewriter reaches them
    var allStaggers = app.querySelectorAll('.funnel-stagger');
    for (var h = 0; h < allStaggers.length; h++) {
      // Don't use the stagger transition - we control visibility directly
      allStaggers[h].style.opacity = '0';
      allStaggers[h].style.translate = '0 0';
      allStaggers[h].style.transition = 'opacity 250ms ease';
    }
    // Also hide accent line
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
        // Done - reveal anything still hidden (accent line, back btn, etc.)
        for (var f = 0; f < allStaggers.length; f++) {
          allStaggers[f].style.opacity = '1';
        }
        if (accentLine) { accentLine.style.opacity = '1'; accentLine.classList.add('funnel-reveal'); }
        // Fade out cursor
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

      // First char of element: reveal container + place cursor
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

    // Start after slide-in settles
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
  /*
   * Punkte schweben langsam. Start: NULL Verbindungen.
   * Pro beantworteter Frage: eine neue Synapse wird geknuepft.
   * Zwei zufaellige unverbundene Punkte werden gewaehlt.
   * Linie wird animiert gezeichnet (Startpunkt -> Endpunkt),
   * kurz rot aufleuchtend, dann zurueck zu normaler Farbe.
   * Je tiefer im Funnel = dichteres Netz.
   */

  var constellationCanvas = null;
  var constellationCtx = null;
  var nodes = [];
  var synapses = []; // { a: idx, b: idx, progress: 0..1, flash: 0..1 }
  var constellationRAF = null;

  var NODE_COUNT = 20;
  var DRIFT_SPEED = 0.2;
  var SYNAPSE_DRAW_MS = 600;  // time to draw one synapse line
  var FLASH_DURATION_MS = 800; // red glow duration after connection

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
    // Spread nodes across viewport with margin
    var margin = 60;
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - margin * 2),
        vx: (Math.random() - 0.5) * DRIFT_SPEED * 2,
        vy: (Math.random() - 0.5) * DRIFT_SPEED * 2,
        r: Math.random() * 1.2 + 0.8,
        baseOpacity: Math.random() * 0.2 + 0.15,
        flash: 0 // 0..1, red glow when synapse connects
      });
    }
  }

  /* ── Knuepfe eine neue Synapse ── */

  var lastConnectedNode = -1;
  var connectedNodes = {};
  var connectionOrder = 0; // counter for numbering connected nodes

  function addSynapse() {
    if (nodes.length < 2) return;

    var a, b;

    if (lastConnectedNode === -1) {
      // First synapse: pick two random nodes
      a = Math.floor(Math.random() * nodes.length);
      do { b = Math.floor(Math.random() * nodes.length); } while (b === a);
    } else {
      // Continue from last endpoint: find nearest unconnected node
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
      // If all nodes connected, pick any unconnected pair
      if (b === -1) {
        for (var j = 0; j < nodes.length; j++) {
          for (var k = j + 1; k < nodes.length; k++) {
            if (!synapseExists(j, k)) { a = j; b = k; break; }
          }
          if (b !== -1) break;
        }
      }
    }

    if (b === -1 || a === b) return; // fully connected

    synapses.push({
      a: a,
      b: b,
      startTime: performance.now(),
      progress: 0,
      flash: 1
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

  /* ── Animation Loop ── */

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

    // Update + draw nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      // Drift
      n.x += n.vx;
      n.y += n.vy;

      // Soft bounce off edges
      if (n.x < 30 || n.x > w - 30) n.vx *= -1;
      if (n.y < 30 || n.y > h - 30) n.vy *= -1;

      // Decay flash
      if (n.flash > 0) n.flash = Math.max(0, n.flash - 0.015);

      // Draw node
      var nodeOpacity = n.baseOpacity + n.flash * 0.6;
      var nodeR = n.r + n.flash * 2;
      var nodeColor = n.flash > 0.01
        ? 'rgba(' + accentRGB + ',' + nodeOpacity + ')'
        : 'rgba(' + dotColor + ',' + nodeOpacity + ')';

      constellationCtx.beginPath();
      constellationCtx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
      constellationCtx.fillStyle = nodeColor;
      constellationCtx.fill();

      // Label: 01, 02, ... for connected nodes
      if (n.label) {
        var labelNum = n.label < 10 ? '0' + n.label : '' + n.label;
        constellationCtx.font = '500 9px ui-monospace, SF Mono, Monaco, Consolas, monospace';
        constellationCtx.textAlign = 'center';
        constellationCtx.fillStyle = 'rgba(' + dotColor + ',' + (0.25 + n.flash * 0.5) + ')';
        constellationCtx.fillText(labelNum, n.x, n.y - nodeR - 5);
      }

      // Glow ring when flashing
      if (n.flash > 0.1) {
        constellationCtx.beginPath();
        constellationCtx.arc(n.x, n.y, nodeR + 4 * n.flash, 0, Math.PI * 2);
        constellationCtx.strokeStyle = 'rgba(' + accentRGB + ',' + (n.flash * 0.3) + ')';
        constellationCtx.lineWidth = 1.5;
        constellationCtx.stroke();
      }
    }

    // Update + draw synapses
    for (var s = 0; s < synapses.length; s++) {
      var syn = synapses[s];
      var na = nodes[syn.a];
      var nb = nodes[syn.b];

      // Advance drawing progress
      var elapsed = now - syn.startTime;
      syn.progress = Math.min(1, elapsed / SYNAPSE_DRAW_MS);
      // Ease-out for drawing
      var drawProgress = 1 - Math.pow(1 - syn.progress, 2);

      // Decay flash after fully drawn
      if (syn.progress >= 1 && syn.flash > 0) {
        syn.flash = Math.max(0, syn.flash - 0.012);
      }

      // Interpolate line endpoint
      var endX = na.x + (nb.x - na.x) * drawProgress;
      var endY = na.y + (nb.y - na.y) * drawProgress;

      // Line color: red while flashing, then normal
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
    // Add one synapse per answered question
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
