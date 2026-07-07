const lighthouse = require('lighthouse');
const playwright = require('playwright');

const TARGET_URL = 'https://923825e7.coffeecraze.pages.dev';

async function runLighthouse(url, formFactor) {
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=0', '--no-sandbox']
  });

  const page = await browser.newPage();
  const cdpSession = await page.context().newCDPSession(page);
  const portStr = await cdpSession.send('Browser.getVersion');
  const wsEndpoint = browser._connection.url;

  const flags = {
    port: new URL(wsEndpoint).port,
    output: 'json',
    logLevel: 'error',
    formFactor,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  };

  const config = { extends: 'lighthouse:default' };

  try {
    const { lhr } = await lighthouse(url, flags, config);
    return lhr;
  } finally {
    await browser.close();
  }
}

async function audit(url, label) {
  console.log(`\n--- ${label} ---`);
  try {
    const lhr = await runLighthouse(url, 'desktop');
    const scores = {
      performance: Math.round((lhr.categories.performance.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility.score || 0) * 100),
      'best-practices': Math.round((lhr.categories['best-practices'].score || 0) * 100),
      seo: Math.round((lhr.categories.seo.score || 0) * 100),
    };
    console.log('Scores:', JSON.stringify(scores));

    // Key audits
    const keys = ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time',
      'first-contentful-paint', 'speed-index', 'interaction-to-next-paint'];
    keys.forEach(k => {
      if (lhr.audits[k]) {
        const a = lhr.audits[k];
        console.log(`  ${k}: ${a.displayValue || a.numericValue} (score: ${a.score != null ? Math.round(a.score * 100) + '%' : 'N/A'})`);
      }
    });

    // Failed audits
    const failing = Object.entries(lhr.audits)
      .filter(([_, v]) => v.score !== null && v.score !== undefined && v.score < 0.5)
      .map(([k, v]) => ({ id: k, title: v.title, score: Math.round(v.score * 100) }));
    if (failing.length > 0) {
      console.log('\n  Issues to fix:');
      failing.forEach(i => console.log(`    [${i.score}%] ${i.title}`));
    }
    return scores;
  } catch (e) {
    console.error(`  FAILED: ${e.message}`);
    return null;
  }
}

(async () => {
  console.log('=== LIGHTHOUSE AUDIT ===');
  const results = {};
  results['Home'] = await audit(TARGET_URL, 'Home');
  results['Shop'] = await audit(TARGET_URL + '/shop', 'Shop');
  results['FAQ'] = await audit(TARGET_URL + '/faq', 'FAQ');
  results['Subscriptions'] = await audit(TARGET_URL + '/subscriptions', 'Subscriptions');

  console.log('\n=== SUMMARY ===');
  for (const [page, scores] of Object.entries(results)) {
    if (scores) {
      console.log(`${page}: Perf=${scores.performance} A11y=${scores.accessibility} BP=${scores['best-practices']} SEO=${scores.seo}`);
    } else {
      console.log(`${page}: FAILED`);
    }
  }
})();
