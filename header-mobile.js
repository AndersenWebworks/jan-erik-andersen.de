/**
 * Mobile Header — Hamburger Menu
 * Dynamically creates hamburger button + mobile menu panel.
 * Clones nav links and dark mode toggle from the existing header.
 * Active at ≤480px via CSS, hidden on larger screens.
 * jan-erik-andersen.de — 2026
 */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var inner = header && header.querySelector('.site-header-inner');
  var nav = header && header.querySelector('.header-nav');
  if (!inner || !nav) return;

  var isDE = document.documentElement.lang === 'de';

  /* ── Hamburger Button ─────────────────────────────── */

  var btn = document.createElement('button');
  btn.className = 'header-hamburger';
  btn.id = 'header-hamburger';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'header-mobile-menu');
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML =
    '<svg class="hamburger-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' +
    '</svg>' +
    '<svg class="hamburger-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
    '</svg>';

  inner.insertBefore(btn, inner.firstChild);

  /* ── Mobile Menu Panel ────────────────────────────── */

  var panel = document.createElement('div');
  panel.className = 'header-mobile-menu';
  panel.id = 'header-mobile-menu';
  panel.setAttribute('aria-hidden', 'true');

  // Clone nav links
  var mobileNav = document.createElement('nav');
  var links = nav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    var clone = links[i].cloneNode(true);
    mobileNav.appendChild(clone);
  }
  panel.appendChild(mobileNav);

  // Dark mode toggle in mobile menu
  var dmCheckbox = document.getElementById('darkmode-toggle');
  if (dmCheckbox) {
    var footer = document.createElement('div');
    footer.className = 'mobile-menu-footer';

    var label = document.createElement('span');
    label.className = 'mobile-label';
    label.textContent = isDE ? 'Darstellung' : 'Appearance';
    footer.appendChild(label);

    var toggle = document.createElement('label');
    toggle.className = 'pill-toggle';
    toggle.innerHTML =
      '<input type="checkbox" class="darkmode-checkbox-mobile" ' + (dmCheckbox.checked ? 'checked' : '') + '>' +
      '<span class="pill-track">' +
        '<span class="pill-option">Light</span>' +
        '<span class="pill-option">Dark</span>' +
        '<span class="pill-indicator"></span>' +
      '</span>';
    footer.appendChild(toggle);

    var mobileCb = toggle.querySelector('.darkmode-checkbox-mobile');
    // Sync both toggles
    mobileCb.addEventListener('change', function () {
      dmCheckbox.checked = mobileCb.checked;
      dmCheckbox.dispatchEvent(new Event('change'));
    });
    dmCheckbox.addEventListener('change', function () {
      mobileCb.checked = dmCheckbox.checked;
    });

    panel.appendChild(footer);
  }

  inner.appendChild(panel);

  /* ── Toggle ───────────────────────────────────────── */

  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    panel.setAttribute('aria-hidden', open ? 'true' : 'false');
  });

  // Close on nav link click
  mobileNav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
    }
  });
})();
