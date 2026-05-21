import { test, expect, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs';
import http, { type Server } from 'node:http';
import path from 'node:path';

let ROOT = '';
const OUT_DIR = path.join(process.cwd(), 'test-results', 'motion-audit');

type WatchedSelector = {
  name: string;
  selector: string;
};

type Viewport = {
  width: number;
  height: number;
};

type RectSample = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FrameSample = {
  ts: number;
  scrollY: number;
  boxes: Record<string, RectSample | null>;
};

type LayoutShiftSample = {
  ts: number;
  value: number;
  hadRecentInput: boolean;
  sources: Array<{
    node: string;
    previous: RectSample | null;
    current: RectSample | null;
  }>;
};

type MotionAuditRuntime = {
  frames: FrameSample[];
  shifts: LayoutShiftSample[];
  marks: Array<{ label: string; ts: number; scrollY: number }>;
};

type FlowReport = {
  flow: string;
  path: string;
  viewport: Viewport;
  generatedAt: string;
  durationMs: number;
  frameCount: number;
  marks: MotionAuditRuntime['marks'];
  layoutShift: {
    total: number;
    noRecentInput: number;
    count: number;
    biggest: LayoutShiftSample[];
  };
  jumps: Array<{
    selector: string;
    metric: 'top' | 'left' | 'width' | 'height';
    fromMs: number;
    toMs: number;
    delta: number;
    before: RectSample;
    after: RectSample;
  }>;
  notes: string[];
};

declare global {
  interface Window {
    __motionAudit?: MotionAuditRuntime;
  }
}

const WATCHED_SELECTORS: WatchedSelector[] = [
  { name: 'header', selector: '.site-header' },
  { name: 'hero', selector: '.hero' },
  { name: 'hero-title', selector: '.hero-typewriter' },
  { name: 'hero-copy', selector: '.hero-copy' },
  { name: 'funnel', selector: '#funnel' },
  { name: 'funnel-container', selector: '.funnel-container' },
  { name: 'funnel-title', selector: '.funnel-question-title' },
  { name: 'funnel-options', selector: '.funnel-options' },
  { name: 'funnel-skip', selector: '#funnel-skip' },
  { name: 'projects', selector: '.projects-section' },
  { name: 'process', selector: '.process-section' },
  { name: 'contact', selector: '.contact-section' },
];

test.use({ trace: 'off' });

test.describe.serial('motion audit', () => {
  test.setTimeout(90000);
  let server: Server;

  test.beforeAll(async () => {
    server = await startStaticServer();
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Motion audit server did not expose a TCP port');
    ROOT = `http://127.0.0.1:${address.port}`;
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    });
  });

  test('collects motion metrics for critical user paths', async ({ browser, page: _bootPage }) => {
    test.setTimeout(90000);

    const reports: FlowReport[] = [];

    reports.push(await runFlow(browser, {
      name: 'mobile-funnel-de',
      path: '/',
      viewport: { width: 390, height: 844 },
      freshFunnel: true,
      actions: async (page) => {
        await mark(page, 'funnel-visible');
        await page.waitForTimeout(2600);
        await mark(page, 'after-initial-typewriter');
        await page.locator('.funnel-option').first().click();
        await page.waitForTimeout(1200);
        await mark(page, 'after-first-step');
        await page.locator('.funnel-option').first().click();
        await page.waitForTimeout(1200);
        await mark(page, 'after-second-step');
        await page.locator('#funnel-skip').click();
        await page.waitForTimeout(900);
        await mark(page, 'after-skip');
      }
    }));

    reports.push(await runFlow(browser, {
      name: 'small-mobile-funnel-de',
      path: '/',
      viewport: { width: 390, height: 360 },
      freshFunnel: true,
      actions: async (page) => {
        await mark(page, 'small-funnel-visible');
        await page.waitForTimeout(1800);
        await page.locator('.funnel-container').evaluate((el) => { el.scrollTop = 120; });
        await page.waitForTimeout(500);
        await mark(page, 'small-funnel-internal-scroll');
        await page.locator('#funnel-skip').click();
        await page.waitForTimeout(700);
        await mark(page, 'small-funnel-after-skip');
      }
    }));

    reports.push(await runFlow(browser, {
      name: 'desktop-funnel-de',
      path: '/',
      viewport: { width: 1280, height: 800 },
      freshFunnel: true,
      actions: async (page) => {
        await mark(page, 'desktop-funnel-visible');
        await page.waitForTimeout(2200);
        await page.locator('.funnel-option').first().click();
        await page.waitForTimeout(1000);
        await mark(page, 'desktop-after-step');
        await page.locator('#funnel-skip').click();
        await page.waitForTimeout(800);
        await mark(page, 'desktop-after-skip');
      }
    }));

    reports.push(await runFlow(browser, {
      name: 'mobile-page-scroll-de',
      path: '/',
      viewport: { width: 390, height: 844 },
      freshFunnel: false,
      actions: async (page) => {
        await mark(page, 'page-ready');
        await page.waitForTimeout(900);
        await page.mouse.wheel(0, 550);
        await page.waitForTimeout(700);
        await mark(page, 'after-scroll-1');
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(900);
        await mark(page, 'after-scroll-2');
        await page.mouse.wheel(0, -500);
        await page.waitForTimeout(700);
        await mark(page, 'after-scroll-up');
      }
    }));

    reports.push(await runFlow(browser, {
      name: 'desktop-page-scroll-de',
      path: '/',
      viewport: { width: 1280, height: 800 },
      freshFunnel: false,
      actions: async (page) => {
        await mark(page, 'desktop-page-ready');
        await page.waitForTimeout(700);
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(600);
        await mark(page, 'desktop-scroll-1');
        await page.mouse.wheel(0, 1400);
        await page.waitForTimeout(900);
        await mark(page, 'desktop-scroll-2');
      }
    }));

    reports.push(await runFlow(browser, {
      name: 'mobile-funnel-en',
      path: '/en/',
      viewport: { width: 390, height: 844 },
      freshFunnel: true,
      actions: async (page) => {
        await mark(page, 'en-funnel-visible');
        await page.waitForTimeout(2200);
        await page.locator('#funnel-skip').click();
        await page.waitForTimeout(800);
        await mark(page, 'en-after-skip');
      }
    }));

    writeReports(reports);

    expect(reports).toHaveLength(6);
    for (const report of reports) {
      expect(
        report.layoutShift.noRecentInput,
        `${report.flow}: no-input CLS should stay below the good Core Web Vitals threshold`
      ).toBeLessThan(0.1);
    }
  });
});

async function runFlow(
  browser: Browser,
  flow: {
    name: string;
    path: string;
    viewport: Viewport;
    freshFunnel: boolean;
    actions: (page: Page) => Promise<void>;
  }
): Promise<FlowReport> {
  const page = await browser.newPage();
  await page.setViewportSize(flow.viewport);

  try {
    await installMotionObserver(page, WATCHED_SELECTORS);

    if (flow.freshFunnel) {
      await page.addInitScript(() => localStorage.removeItem('funnel-done'));
    } else {
      await page.addInitScript(() => localStorage.setItem('funnel-done', String(Date.now())));
    }

    const startedAt = Date.now();
    await page.goto(`${ROOT}${flow.path}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    await mark(page, 'loaded');

    await flow.actions(page);

    const runtime = await page.evaluate(() => window.__motionAudit);
    if (!runtime) throw new Error('Motion audit runtime was not installed');

  const report = summarizeFlow({
    flow: flow.name,
    path: flow.path,
    viewport: flow.viewport,
    generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      runtime
  });

  const fileBase = sanitize(flow.name);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, `${fileBase}.json`),
      `${JSON.stringify({ ...report, frames: runtime.frames, shifts: runtime.shifts }, null, 2)}\n`
    );

    if (report.layoutShift.noRecentInput > 0.02 || report.jumps.length > 0) {
      await page.screenshot({
        path: path.join(OUT_DIR, `${fileBase}.png`),
        fullPage: true
      });
    }

    return report;
  } finally {
    await page.close();
  }
}

async function installMotionObserver(page: Page, selectors: WatchedSelector[]) {
  await page.addInitScript((watchedSelectors) => {
    const runtime: MotionAuditRuntime = {
      frames: [],
      shifts: [],
      marks: []
    };

    window.__motionAudit = runtime;

    const serializeRect = (rect: DOMRectReadOnly | null): RectSample | null => {
      if (!rect) return null;
      return {
        x: round(rect.x),
        y: round(rect.y),
        width: round(rect.width),
        height: round(rect.height)
      };
    };

    const describeNode = (node: Node | null): string => {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return '';
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const className = typeof el.className === 'string'
        ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).map((name) => `.${name}`).join('')
        : '';
      return `${tag}${id}${className}`;
    };

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShift[]) {
          runtime.shifts.push({
            ts: round(entry.startTime),
            value: round(entry.value, 5),
            hadRecentInput: entry.hadRecentInput,
            sources: (entry.sources || []).map((source) => ({
              node: describeNode(source.node),
              previous: serializeRect(source.previousRect),
              current: serializeRect(source.currentRect)
            }))
          });
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Older browsers simply do not expose Layout Instability entries.
    }

    const sample = (ts: number) => {
      const boxes: Record<string, RectSample | null> = {};
      for (const item of watchedSelectors) {
        const el = document.querySelector(item.selector);
        boxes[item.name] = el ? serializeRect(el.getBoundingClientRect()) : null;
      }

      runtime.frames.push({
        ts: round(ts),
        scrollY: round(window.scrollY),
        boxes
      });

      if (runtime.frames.length < 1200) {
        window.requestAnimationFrame(sample);
      }
    };

    window.requestAnimationFrame(sample);

    function round(value: number, decimals = 2) {
      const factor = 10 ** decimals;
      return Math.round(value * factor) / factor;
    }
  }, selectors);
}

async function mark(page: Page, label: string) {
  await page.evaluate((currentLabel) => {
    window.__motionAudit?.marks.push({
      label: currentLabel,
      ts: Math.round(performance.now() * 100) / 100,
      scrollY: Math.round(window.scrollY * 100) / 100
    });
  }, label);
}

function summarizeFlow(input: {
  flow: string;
  path: string;
  viewport: Viewport;
  generatedAt: string;
  durationMs: number;
  runtime: MotionAuditRuntime;
}): FlowReport {
  const shifts = input.runtime.shifts;
  const noRecentInput = shifts.filter((shift) => !shift.hadRecentInput);
  const totalShift = shifts.reduce((sum, shift) => sum + shift.value, 0);
  const noInputShift = noRecentInput.reduce((sum, shift) => sum + shift.value, 0);
  const jumps = collectJumps(input.runtime.frames, input.runtime.marks);
  const notes: string[] = [];

  if (noInputShift > 0.02) {
    notes.push(`Layout-shift score without recent input is ${round(noInputShift, 5)}.`);
  }

  if (jumps.length > 0) {
    notes.push(`${jumps.length} frame-to-frame element jumps exceeded the audit threshold.`);
  }

  if (notes.length === 0) {
    notes.push('No motion threshold was exceeded in this path.');
  }

  return {
    flow: input.flow,
    path: input.path,
    viewport: input.viewport,
    generatedAt: input.generatedAt,
    durationMs: input.durationMs,
    frameCount: input.runtime.frames.length,
    marks: input.runtime.marks,
    layoutShift: {
      total: round(totalShift, 5),
      noRecentInput: round(noInputShift, 5),
      count: shifts.length,
      biggest: [...shifts].sort((a, b) => b.value - a.value).slice(0, 8)
    },
    jumps,
    notes
  };
}

function collectJumps(frames: FrameSample[], marks: MotionAuditRuntime['marks']) {
  const jumps: FlowReport['jumps'] = [];
  const metrics: Array<'top' | 'left' | 'width' | 'height'> = ['top', 'left', 'width', 'height'];
  const loadedMark = marks.find((mark) => mark.label === 'loaded');
  const stableAfter = loadedMark ? loadedMark.ts + 200 : 0;

  for (let i = 1; i < frames.length; i++) {
    const beforeFrame = frames[i - 1];
    const afterFrame = frames[i];
    const scrollDelta = Math.abs(afterFrame.scrollY - beforeFrame.scrollY);

    if (afterFrame.ts < stableAfter) continue;
    if (scrollDelta > 1) continue;

    const names = new Set([
      ...Object.keys(beforeFrame.boxes),
      ...Object.keys(afterFrame.boxes)
    ]);

    for (const name of names) {
      const before = beforeFrame.boxes[name];
      const after = afterFrame.boxes[name];
      if (!before || !after) continue;
      if (isExpectedOverlayToggle(name, before, after)) continue;

      for (const metric of metrics) {
        const beforeValue = rectMetric(before, metric);
        const afterValue = rectMetric(after, metric);
        const delta = round(afterValue - beforeValue);
        const abs = Math.abs(delta);

        if (abs >= jumpThreshold(name, metric)) {
          jumps.push({
            selector: name,
            metric,
            fromMs: beforeFrame.ts,
            toMs: afterFrame.ts,
            delta,
            before,
            after
          });
        }
      }
    }
  }

  return jumps
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 30);
}

function isExpectedOverlayToggle(name: string, before: RectSample, after: RectSample) {
  if (!name.startsWith('funnel')) return false;
  return before.width === 0 || before.height === 0 || after.width === 0 || after.height === 0;
}

function rectMetric(rect: RectSample, metric: 'top' | 'left' | 'width' | 'height') {
  if (metric === 'top') return rect.y;
  if (metric === 'left') return rect.x;
  return rect[metric];
}

function jumpThreshold(name: string, metric: 'top' | 'left' | 'width' | 'height') {
  if (name.startsWith('funnel') && (metric === 'top' || metric === 'left')) return 18;
  if (metric === 'height' || metric === 'width') return 10;
  return 8;
}

function writeReports(reports: FlowReport[]) {
  const summary = {
    generatedAt: new Date().toISOString(),
    reports
  };

  fs.writeFileSync(
    path.join(OUT_DIR, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`
  );

  const lines: string[] = [
    '# Motion Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '| Flow | Viewport | CLS no input | Jumps | Notes |',
    '| --- | --- | ---: | ---: | --- |'
  ];

  for (const report of reports) {
    lines.push([
      report.flow,
      `${report.viewport.width}x${report.viewport.height}`,
      report.layoutShift.noRecentInput.toFixed(5),
      String(report.jumps.length),
      report.notes.join(' ')
    ].map(escapeMarkdownCell).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }

  lines.push('');
  lines.push('## Biggest Findings');
  lines.push('');

  for (const report of reports) {
    lines.push(`### ${report.flow}`);
    lines.push('');

    if (report.layoutShift.biggest.length > 0) {
      lines.push('- Layout shifts:');
      for (const shift of report.layoutShift.biggest.slice(0, 5)) {
        const sources = shift.sources.map((source) => source.node).filter(Boolean).join(', ') || 'unknown source';
        lines.push(`  - ${shift.value.toFixed(5)} at ${shift.ts}ms, recentInput=${shift.hadRecentInput}, sources=${sources}`);
      }
    } else {
      lines.push('- No layout-shift entries recorded.');
    }

    if (report.jumps.length > 0) {
      lines.push('- Largest element jumps while scroll position was stable:');
      for (const jump of report.jumps.slice(0, 8)) {
        lines.push(`  - ${jump.selector}.${jump.metric}: ${jump.delta}px from ${jump.fromMs}ms to ${jump.toMs}ms`);
      }
    } else {
      lines.push('- No frame-to-frame element jumps crossed the threshold.');
    }

    lines.push('');
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), `${lines.join('\n')}\n`);
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function sanitize(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function startStaticServer() {
  const rootDir = process.cwd();

  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400).end();
      return;
    }

    const parsed = new URL(req.url, ROOT || 'http://127.0.0.1');
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    if (pathname === '/') pathname = '/index.html';

    const relative = pathname.replace(/^\/+/, '').replace(/\//g, path.sep);
    const filePath = path.resolve(rootDir, relative);

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403).end();
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr) {
        res.writeHead(404).end();
        return;
      }

      const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
      fs.stat(finalPath, (finalErr) => {
        if (finalErr) {
          res.writeHead(404).end();
          return;
        }

        res.writeHead(200, { 'Content-Type': mimeType(finalPath) });
        fs.createReadStream(finalPath).pipe(res);
      });
    });
  });

  return new Promise<Server>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}

function mimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}
