const { chromium } = require('playwright');

const BASE = 'https://923825e7.coffeecraze.pages.dev';
const URLS = [ '/', '/shop', '/auth', '/faq', '/subscriptions', '/about', '/blog', '/wholesale' ];
const VIEWPORTS = [
  { label: 'Desktop 1920', width: 1920, height: 1080 },
  { label: 'Tablet 768',   width: 768,  height: 1024 },
  { label: 'Mobile 375',   width: 375,  height: 667 },
];

async function measure(browser, path, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const url = BASE + path;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);

    const nav = await page.evaluate(() => {
      const p = performance.getEntriesByType('navigation')[0];
      if (!p) return {};
      return {
        ttfb: Math.round(p.responseStart - p.requestStart),
        domInteractive: Math.round(p.domInteractive),
        domContentLoaded: Math.round(p.domContentLoadedEventEnd),
        load: Math.round(p.loadEventEnd),
      };
    });

    const title = await page.title();
    return { path, vp: vp.label, title, metrics: nav, ok: true };
  } catch (e) {
    return { path, vp: vp.label, error: e.message.substring(0, 100), ok: false };
  } finally {
    await page.close();
  }
}

(async () => {
  console.log('=== COFFEECRAZE PERFORMANCE + RESPONSIVE AUDIT ===\n');

  const browser = await chromium.launch({ headless: true });
  let results = [];

  for (const vp of VIEWPORTS) {
    for (const path of URLS) {
      const r = await measure(browser, path, vp);
      results.push(r);
    }
  }

  await browser.close();

  // Report
  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.label} ===`);
    console.log('Page | TTFB | DOM Loaded | Load | Title');
    console.log('---- | ---- | ---------- | ---- | -----');
    for (const r of results.filter(r => r.vp === vp.label)) {
      if (r.ok) {
        const ttfb = r.metrics.ttfb != null ? r.metrics.ttfb + 'ms' : 'N/A';
        const dcl = r.metrics.domContentLoaded != null ? r.metrics.domContentLoaded + 'ms' : 'N/A';
        const load = r.metrics.load != null ? r.metrics.load + 'ms' : 'N/A';
        console.log(`${r.path.padEnd(20)} | ${String(ttfb).padEnd(6)} | ${String(dcl).padEnd(11)} | ${String(load).padEnd(6)} | ${r.title.substring(0, 50)}`);
      } else {
        console.log(`${r.path.padEnd(20)} | FAIL: ${r.error}`);
      }
    }
  }

  // Summary
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${total - passed}`);

  const success = results.filter(r => r.ok);
  const ttfbOk = success.filter(r => r.metrics.ttfb != null && r.metrics.ttfb < 800).length;
  const loadOk = success.filter(r => r.metrics.load != null && r.metrics.load < 5000).length;
  console.log(`TTFB < 800ms: ${ttfbOk}/${success.length} | Load < 5000ms: ${loadOk}/${success.length}`);

  // Screenshots
  console.log('\n=== Take Screenshots ===');
  const ssBrowser = await chromium.launch({ headless: true });
  for (const vp of VIEWPORTS) {
    const page = await ssBrowser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const ssPath = `C:\\Users\\nilel\\AppData\\Local\\Temp\\opencode\\coffeecraze-${vp.label.toLowerCase().replace(/\s/g, '-')}.png`;
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log(`  ${vp.label}: ${ssPath}`);
    await page.close();
  }
  await ssBrowser.close();

  console.log('\nDone.');
})();
