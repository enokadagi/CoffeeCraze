const lighthouse = require('lighthouse');

// Use Playwright's chromium path
const PLAYWRIGHT_CHROME = require('path').join(
  require('os').homedir(),
  'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe'
);

async function runLighthouse(url, label) {
  const { Launcher } = require('chrome-launcher');

  // Launch Chrome via chrome-launcher pointing to Playwright's chromium
  const launching = new Launcher({
    chromePath: PLAYWRIGHT_CHROME,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    logLevel: 'error',
  });

  const chrome = await launching.launch();
  const port = chrome.port;

  const flags = {
    port,
    output: 'json',
    logLevel: 'error',
    formFactor: 'desktop',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  };

  const config = { extends: 'lighthouse:default' };

  try {
    console.log(`\n--- ${label} ---`);
    const { lhr } = await lighthouse(url, flags, config);

    const scores = {
      performance: Math.round((lhr.categories.performance.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility.score || 0) * 100),
      bp: Math.round((lhr.categories['best-practices'].score || 0) * 100),
      seo: Math.round((lhr.categories.seo.score || 0) * 100),
    };
    console.log('  Scores:', JSON.stringify(scores));

    const metrics = ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time',
      'first-contentful-paint', 'speed-index', 'interaction-to-next-paint'];
    metrics.forEach(k => {
      const a = lhr.audits[k];
      if (a) console.log(`  ${k}: ${a.displayValue || a.numericValue} (${a.score != null ? Math.round(a.score * 100) + '%' : 'N/A'})`);
    });

    const failing = Object.entries(lhr.audits)
      .filter(([_, v]) => v.score !== null && v.score < 0.5)
      .map(([k, v]) => ({ id: k, title: v.title, score: Math.round(v.score * 100) }));
    if (failing.length > 0) {
      console.log('\n  Issues:');
      failing.forEach(i => console.log(`    [${i.score}%] ${i.title}`));
    }
    return scores;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return null;
  } finally {
    try { await chrome.kill(); } catch (_) {}
    try { launching.destroyTmp(); } catch (_) {}
  }
}

(async () => {
  console.log('=== LIGHTHOUSE AUDIT ===\n');

  // Clean up any leftover temp dirs first
  const fs = require('fs');
  const tmpDir = require('os').tmpdir();
  try {
    const dirs = fs.readdirSync(tmpDir).filter(d => d.startsWith('lighthouse.'));
    dirs.forEach(d => {
      try { fs.rmSync(require('path').join(tmpDir, d), { recursive: true, force: true }); } catch (_) {}
    });
  } catch (_) {}

  const base = 'https://923825e7.coffeecraze.pages.dev';
  const results = {};
  results['Home'] = await runLighthouse(base, 'Home');
  results['Shop'] = await runLighthouse(base + '/shop', 'Shop');
  results['Auth'] = await runLighthouse(base + '/auth', 'Auth');
  results['FAQ'] = await runLighthouse(base + '/faq', 'FAQ');

  console.log('\n=== FINAL SCORES ===');
  for (const [page, s] of Object.entries(results)) {
    if (s) console.log(`${page}:  Perf=${s.performance}  A11y=${s.accessibility}  BP=${s.bp}  SEO=${s.seo}`);
    else console.log(`${page}: FAILED`);
  }
})();
