const lighthouse = require('lighthouse');
const { Launcher } = require('chrome-launcher');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe');

// Pre-clean temp dirs
const tmpDir = os.tmpdir();
try {
  fs.readdirSync(tmpDir).filter(d => d.startsWith('lighthouse.')).forEach(d => {
    try { fs.rmSync(path.join(tmpDir, d), { recursive: true, force: true }); } catch (_) {}
  });
} catch (_) {}

async function audit(url, label) {
  const launcher = new Launcher({
    chromePath: CHROME_PATH,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1920,1080'],
    logLevel: 'error',
    maxConnectionRetries: 5,
  });

  try {
    await launcher.launch();
    const port = launcher.port;

    const flags = {
      port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    };
    const config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1920, height: 1080 },
      },
    };

    console.log(`\n--- ${label} ---`);
    const { lhr } = await lighthouse.default(url, flags, config);

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
    try { await launcher.kill(); } catch (_) {}
    try { launcher.destroyTmp(); } catch (_) {}
    // Final cleanup
    setTimeout(() => {
      try {
        fs.readdirSync(tmpDir).filter(d => d.startsWith('lighthouse.')).forEach(d => {
          try { fs.rmSync(path.join(tmpDir, d), { recursive: true, force: true }); } catch (_) {}
        });
      } catch (_) {}
    }, 1000);
  }
}

(async () => {
  console.log('=== LIGHTHOUSE AUDIT ===\n');
  const base = 'https://923825e7.coffeecraze.pages.dev';
  const results = {};
  results['Home'] = await audit(base, 'Home');
  results['Shop'] = await audit(base + '/shop', 'Shop');
  results['Auth'] = await audit(base + '/auth', 'Auth');
  results['FAQ'] = await audit(base + '/faq', 'FAQ');

  console.log('\n=== FINAL SCORES ===');
  for (const [page, s] of Object.entries(results)) {
    if (s) console.log(`${page}:  Perf=${s.performance}  A11y=${s.accessibility}  BP=${s.bp}  SEO=${s.seo}`);
    else console.log(`${page}: FAILED`);
  }
})();
