// node harvest.js spec.json out.json — spec: [{name,page,sel,idx?,setup?,width?}]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
const spec = JSON.parse(fs.readFileSync(process.argv[2]));
const out = fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3])) : {};
function clean([sel, idx]) {
  const els = [...document.querySelectorAll(sel)];
  const e = els[idx || 0];
  if (!e) return null;
  const c = e.cloneNode(true);
  [c, ...c.querySelectorAll('*')].forEach(n => {
    if (n.classList) ['rv', 'in', 'is-in', 'rv-in', 'rv-f', 'sk-host', 'rv-done'].forEach(x => n.classList.remove(x));
    if (n.getAttribute && n.getAttribute('class') === '') n.removeAttribute('class');
    if (n.style) {
      ['transform', 'opacity', 'transition-delay', 'transition', '--rv-d', 'visibility'].forEach(p => n.style.removeProperty(p));
      if (n.getAttribute('style') === '') n.removeAttribute('style');
    }
    ['data-href', 'data-rv', 'aria-hidden-sk'].forEach(a => n.removeAttribute && n.removeAttribute(a));
  });
  c.querySelectorAll('.sk-over, script, template').forEach(n => n.remove());
  return { html: c.outerHTML, w: Math.round(e.getBoundingClientRect().width), n: els.length };
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Berlin' });
  await ctx.route(/^(?!http:\/\/localhost)/, r => r.abort());
  const byPage = {};
  spec.forEach(s => (byPage[s.page + '||' + (s.pre || '')] = byPage[s.page + '||' + (s.pre || '')] || []).push(s));
  for (const key of Object.keys(byPage)) {
    const [pg, pre] = key.split('||');
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error(pg, e.message));
    await page.goto('http://localhost:8420/' + pg, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.dataset.rendered, null, { timeout: 15000 }).catch(() => console.error('no render', pg));
    await page.waitForTimeout(1800);
    if (pre) { await page.evaluate(pre); await page.waitForTimeout(800); }
    for (const s of byPage[key]) {
      if (s.setup) { await page.evaluate(s.setup); await page.waitForTimeout(700); }
      const r = await page.evaluate(clean, [s.sel, s.idx || 0]);
      if (!r) { console.error('MISS', s.name, pg, s.sel); continue; }
      out[s.name] = Object.assign({ page: pg }, r);
      console.log(s.name.padEnd(28), String(r.html.length).padStart(7), 'w=' + r.w, 'n=' + r.n);
    }
    await page.close();
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  await browser.close();
})();
