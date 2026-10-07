const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Berlin', reducedMotion: 'reduce' });
  await ctx.route(/^(?!http:\/\/localhost)/, r => r.abort());
  fs.mkdirSync('rg/a', { recursive: true }); fs.mkdirSync('rg/b', { recursive: true });
  for (const [root, dir] of [['system_head', 'a'], ['system', 'b']]) {
    for (const g of ['foundations', 'elements', 'modules-1', 'modules-2', 'additions']) {
      const page = await ctx.newPage();
      await page.goto('http://localhost:8420/' + root + '/index.html#' + g, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#doc .anchor'));
      await page.waitForTimeout(2000);
      await page.addStyleTag({ content: '*{animation:none!important;transition:none!important} .bar{display:none!important}' });
      const ids = await page.$$eval('#doc .anchor', a => a.map(x => x.id));
      for (const id of ids) {
        const el = await page.$('#doc [id="' + id + '"]');
        try { await el.screenshot({ path: `rg/${dir}/${g}__${id}.png` }); } catch (e) { console.log('fail', id, e.message.slice(0, 80)); }
      }
      await page.close();
    }
  }
  await browser.close();
})();
