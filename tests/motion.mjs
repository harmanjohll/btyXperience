// Motion check for version 2: walk the whole show with Next (as the presenter does) and check that every
// slide visibly builds in: its first piece goes from hidden to shown over at least 300 ms while the slide
// itself is fully on screen. Run twice: as normal, and with the laptop asking for reduced motion (the big
// screen must still move). ?calm=1 must still calm it.
// Usage: node tests/motion.mjs
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, sleep, until } from './lib/harness.mjs';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('motion');
console.log('MOTION · every slide builds in');

async function walk(reducedMotion, query = '') {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(srv.url + '/v2.html?presenter=true' + query, { waitUntil: 'domcontentloaded' });
  await until(() => p.evaluate(() => typeof dbReady !== 'undefined' && dbReady).catch(() => false), 10000);
  await p.click('#beginBtn'); await sleep(600);
  await p.evaluate(() => window.__jump('deck_a', 0)); await sleep(2500);
  const still = [], seen = [];
  for (let k = 0; k < 140; k++) {
    if (/Finish/.test(await p.$eval('#nextBtn', e => e.textContent))) break;
    await p.click('#nextBtn');
    const samples = [];
    for (let t = 0; t < 22; t++) {
      samples.push(await p.evaluate(() => {
        const body = document.getElementById('scBody'); if (!body) return null;
        const eff = el => { let o = 1, n = el; while (n) { o *= +getComputedStyle(n).opacity; n = n.parentElement; } return o; };
        const first = body.querySelector('.bi:not(.fit-box), .fit-box > figure, .lp-ring, .ms-disc, .st2-climber');   // a photo box never fades; its photos do
        return { id: document.getElementById('scene')?.dataset.deck + ' ' + document.getElementById('scNum')?.textContent, c: eff(body), e: first ? eff(first) : null };
      }));
      await sleep(70);
    }
    const s = samples.filter(Boolean); if (!s.length) { await sleep(400); continue; }
    const id = s[s.length - 1].id; if (seen.includes(id)) continue; seen.push(id);
    // visible build: the first piece is under 0.2 while the slide is at 0.95+, and later reaches 0.95
    const low = s.findIndex(x => x.e !== null && x.e < .2 && x.c > .95), high = s.findIndex((x, i) => i > low && x.e > .95);
    if (low < 0 || high < 0 || (high - low) * 85 < 300) still.push(id);
    await sleep(500);
  }
  await ctx.close();
  return { still, n: seen.length, errs };
}

const a = await walk('no-preference');
c.ok(a.n > 60 && a.still.length === 0, `every slide builds in visibly (${a.n} slides) ${a.still.slice(0, 8).join(', ')}`);
const b = await walk('reduce');
c.ok(b.n > 60 && b.still.length === 0, `with the laptop asking for reduced motion, the big screen still moves (${b.n} slides) ${b.still.slice(0, 8).join(', ')}`);
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const p = await ctx.newPage();
await p.goto(srv.url + '/v2.html?presenter=true&calm=1', { waitUntil: 'domcontentloaded' });
c.ok(await p.evaluate(() => document.documentElement.classList.contains('calm')), '?calm=1 turns motion down');
c.ok(a.errs.length + b.errs.length === 0, 'no page errors ' + JSON.stringify([...a.errs, ...b.errs].slice(0, 3)));
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
