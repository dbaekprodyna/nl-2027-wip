// Usage: node extract.js <base> <out.json>
// Renders prototype pages + DS groups at 1440, records computed-style signatures per class.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8420';
const out = process.argv[3] || '/tmp/sig.json';
const PAGES = ['index.html', 'about.html', 'article.html', 'calendar.html', 'conference.html', 'conferences.html',
  'game.html', 'news.html', 'player.html', 'search.html?q=ger', 'standings.html', 'standings.html?view=qualification',
  'stats.html', 'stop.html', 'team.html', 'teams.html', 'index.html#season=off', 'index.html#season=pre'];
const DS = ['foundations', 'elements', 'modules-1', 'modules-2', 'additions'];

const PROPS = ['display', 'position', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform',
  'text-align', 'color', 'background-color', 'background-image', 'border-top-width', 'border-top-color', 'border-bottom-width',
  'border-bottom-color', 'border-left-width', 'border-left-color', 'border-right-width', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'flex-direction', 'justify-content', 'align-items', 'clip-path', 'box-shadow', 'filter', 'opacity', 'min-width', 'grid-template-columns', 'white-space',
  'background-size', 'object-fit', 'z-index', 'font-variant-caps', 'cursor'];

function collect(scopeSel) {
  const PROPS = window.__PROPS;
  const res = {};
  const scope = scopeSel ? document.querySelector(scopeSel) : document.body;
  if (!scope) return res;
  const els = scope.querySelectorAll('[class]');
  for (const el of els) {
    if (el.closest('.nav, .bar, template')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    const sig = {};
    for (const p of PROPS) {
      let v = cs.getPropertyValue(p);
      if (p === 'background-image' && v.length > 80) v = v.slice(0, 80);
      if (p === 'grid-template-columns' && v !== 'none') v = v.split(' ').length + 'cols';
      sig[p] = v;
    }
    if (r.width < 100) sig.w = Math.round(r.width);
    if (r.height < 100) sig.h = Math.round(r.height);
    const GEN = /^(cutfill|lbl|ico|t-[a-z0-9-]+|ftag-(code|name|txt)|flag(-[a-z])?|cut(-[a-z]+)?|sh|rv.*|in|is-in)$/;
    const own = c => [...c.classList].filter(x => !/^(rv|in|is-in|rv-in)$/.test(x)).sort().join('.');
    let key = own(el);
    if ([...el.classList].every(x => GEN.test(x))) {
      let pnode = el.parentElement, hops = 0;
      while (pnode && hops < 3 && (!pnode.classList.length || [...pnode.classList].every(x => GEN.test(x)))) { pnode = pnode.parentElement; hops++; }
      if (pnode) key = own(pnode) + ' > ' + key;
    }
    const k = JSON.stringify(sig);
    (res[key] = res[key] || {});
    res[key][k] = (res[key][k] || 0) + 1;
  }
  return res;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Berlin' });
  await ctx.route(/^(?!http:\/\/localhost)/, r => r.abort());
  const result = { pages: {}, ds: {}, errors: [] };
  for (const p of PAGES) {
    const page = await ctx.newPage();
    page.on('pageerror', e => result.errors.push(p + ': ' + e.message));
    await page.goto(base + '/' + p, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.dataset.rendered, null, { timeout: 15000 }).catch(() => result.errors.push(p + ': no rendered'));
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in', 'rv-in', 'is-in')));
    await page.evaluate(p => window.__PROPS = p, PROPS);
    result.pages[p] = await page.evaluate(collect, null);
    await page.close();
  }
  for (const g of DS) {
    const page = await ctx.newPage();
    page.on('pageerror', e => result.errors.push('ds/' + g + ': ' + e.message));
    await page.goto(base + '/system/index.html#' + g, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#doc .anchor'), null, { timeout: 15000 }).catch(() => result.errors.push(g + ': no anchors'));
    await page.waitForTimeout(1500);
    await page.evaluate(p => window.__PROPS = p, PROPS);
    // per anchor section
    const anchors = await page.$$eval('#doc .anchor', a => a.map(x => x.id));
    result.ds[g] = {};
    for (const id of anchors) {
      result.ds[g][id] = await page.evaluate(collect, '#doc [id="' + id + '"]');
    }
    await page.close();
  }
  fs.writeFileSync(out, JSON.stringify(result));
  console.log('errors', result.errors);
  await browser.close();
})();
