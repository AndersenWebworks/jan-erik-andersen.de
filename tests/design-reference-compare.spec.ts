import { test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(__dirname, '..', 'qa-screenshots', 'design-compare');

const ACTUAL = 'http://localhost:5500/index.html';
const REFERENCE = 'http://localhost:5500/docs/reference-design.html';

const sections = [
  { id: 'hero',     actual: '#hero',     ref: 'main > section.hero' },
  { id: 'projekte', actual: '#projekte', ref: 'main > section#projekte' },
  { id: 'focus',    actual: '#leistungen', ref: 'main > section#leistungen' },
  { id: 'stimmen',  actual: '#stimmen',  ref: 'main > section[data-screen-label="04 Kunden"]' },
  { id: 'prozess',  actual: '#prozess',  ref: 'main > section[data-screen-label="05 Ablauf"]' },
  { id: 'ueber',    actual: '#ueber',    ref: 'main > section#ueber' },
  { id: 'preise',   actual: '#preise',   ref: 'main > section#preise' },
  { id: 'faq',      actual: '#faq',      ref: 'main > section#faq' },
  { id: 'kontakt',  actual: '#kontakt',  ref: 'main > section#kontakt' },
];

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

test.describe('Design-Referenz vs. aktuelle Seite', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const sec of sections) {
    test(`section: ${sec.id}`, async ({ page }) => {
      // Aktuelle Seite — Typewriter-Animationen vorab deaktivieren, indem alle Heading-Targets
      // ihr data-typed='1'-Flag bekommen, bevor das Page-Script sie erfasst.
      await page.addInitScript(() => {
        // Sobald DOM existiert, alle Section-Headings als "schon getippt" markieren
        const mark = () => {
          document.querySelectorAll('.hero h2, .projects-section h2, .services-section h2, .testimonials-section h2, .process-section h2, .pricing-section h2, .contact-section h2, .focus-grid h2, .section-header h2, .services-intro h2, .contact-card h2, .about-teaser h2, .faq-section h2').forEach(h => {
            (h as HTMLElement).dataset.typed = '1';
          });
        };
        document.addEventListener('readystatechange', mark);
        document.addEventListener('DOMContentLoaded', mark);
      });
      await page.goto(ACTUAL, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // Funnel komplett deaktivieren + Header-Nav forciert einblenden + Typewriter stoppen
      await page.evaluate(() => {
        // alle laufenden Timer killen, damit Typewriter-Loop nicht mehr ueberschreibt
        const high = (setTimeout as any)(() => {}, 0);
        for (let i = 0; i < high; i++) { try { clearTimeout(i); clearInterval(i); } catch (e) {} }
        document.documentElement.classList.remove('funnel-active');
        const f = document.getElementById('funnel');
        if (f) { (f as HTMLElement).style.display = 'none'; }
        const reopen = document.getElementById('funnel-reopen');
        if (reopen) { (reopen as HTMLElement).hidden = true; }
        // Header beim Element-Screenshot ausblenden, sonst ueberlagert er sticky den Section-Inhalt
        const sh = document.getElementById('site-header');
        if (sh) { (sh as HTMLElement).style.display = 'none'; }
        // Animations-Klasse erzwingen (IntersectionObserver feuert nicht fuer Off-Screen-Sections beim Element-Screenshot)
        document.querySelectorAll('.hero, .services-grid, .standards-strip, .focus-grid, .focus-card, .project-card, .testimonial-card, .process-step, .about-teaser-card, .pricing-card, .faq-item, .contact-card, [data-animate]').forEach(el => el.classList.add('is-visible'));
        // Typewriter-Animation: Endzustand erzwingen, damit Headline vollstaendig
        document.querySelectorAll('.hero-typewriter-text').forEach(el => { (el as HTMLElement).textContent = 'Die Kompetenz einer Agentur. Ohne den Ballast.'; });
        document.querySelectorAll('.typewriter-cursor').forEach(el => { (el as HTMLElement).style.display = 'none'; });
      });
      await page.waitForTimeout(800);
      const a = page.locator(sec.actual).first();
      await a.scrollIntoViewIfNeeded();
      // Bei sehr langen Sections rendert element.screenshot stark skaliert.
      // Stattdessen: an Top der Section scrollen, Viewport-Screenshot vom oberen Bereich.
      await page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) window.scrollTo({ top: el.offsetTop - 16, behavior: 'instant' as ScrollBehavior });
      }, sec.actual);
      await page.waitForTimeout(300);
      const box = await a.boundingBox();
      const clipH = Math.min(box?.height ?? 900, 900);
      await page.screenshot({
        path: path.join(OUT, `${sec.id}-actual.png`),
        clip: { x: 0, y: 0, width: 1280, height: clipH },
      });

      // Referenz
      await page.goto(REFERENCE, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const r = page.locator(sec.ref).first();
      await r.scrollIntoViewIfNeeded();
      await page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) window.scrollTo({ top: el.offsetTop - 16, behavior: 'instant' as ScrollBehavior });
      }, sec.ref);
      await page.waitForTimeout(300);
      const rbox = await r.boundingBox();
      const rh = Math.min(rbox?.height ?? 900, 900);
      await page.screenshot({
        path: path.join(OUT, `${sec.id}-reference.png`),
        clip: { x: 0, y: 0, width: 1280, height: rh },
      });
    });
  }
});
