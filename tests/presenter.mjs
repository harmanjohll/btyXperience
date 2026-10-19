// The big screen on its own: all 26 steps render without errors (screenshot each),
// plus the globe's controls, poll layout and the bee landing on the opening chart.
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, presenter, goStep, stepNum, sleep, until, shot, decodeQR } from './lib/harness.mjs';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('presenter');
console.log('PRESENTER');
const pr = await presenter(browser, srv.url);

// A bee lands when a phone finds its archetype (written straight into the stand-in database).
const put = (path, data, merge = true) => fetch(srv.url + '/__fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'set', path, data, merge }) });
await put('compassQuiz/a', { archetype: 'Beattyian' }); await put('compassQuiz/b', { archetype: 'Beattyian' });
await until(async () => /2 in the Hive · 0 ready/.test(await pr.$eval('#pCount', e => e.textContent)), 4000);
await put('compassQuiz/a', { archetype: 'The Innovator', done: true });
const flew = await until(() => pr.$('.bee-fly'), 3000);
c.ok(flew, 'a phone finds its bee → a bee flies to its cell');
c.ok(await until(async () => /2 in the Hive · 1 ready/.test(await pr.$eval('#pCount', e => e.textContent)), 4000), 'pill: "2 in the Hive · 1 ready"');
await sleep(1800);
await shot(pr, 'p-01');
const joinTxt = await decodeQR(pr, '.jq-card');
c.ok(joinTxt === srv.url + '/x/', `the big join QR scans to the audience page (${joinTxt})`);
const pillTxt = await decodeQR(pr, '#qrPill .qr-svg');
c.ok(pillTxt === srv.url + '/x/', 'the header QR scans to the same page');

for (let n = 2; n <= 26; n++) {
  await goStep(pr, n);
  const at = await stepNum(pr);
  if (at !== n) { c.ok(false, `reached step ${n} (at ${at})`); continue; }
  await sleep(n === 16 ? 1200 : 500);
  await shot(pr, 'p-' + String(n).padStart(2, '0'));
  if (n === 12) {
    const q = await pr.$eval('.poll-q', e => ({ h: e.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(e).lineHeight) }));
    c.ok(q.h / q.lh < 2.6, `step 12 question sits on ≤2 lines (${(q.h / q.lh).toFixed(1)})`);
  }
  if (n === 16) {
    // Globe: zoom about the pointer, buttons, keys, drag, double-click, reset, limits.
    await pr.waitForSelector('#globeCanvas');
    c.ok(Math.abs(await pr.evaluate(() => window.__globe.zoom) - 1) < 0.01, 'globe opens at zoom 1');
    await pr.click('#spinBtn'); await pr.click('#spinBtn'); await sleep(250);          // hold it still (drift off)
    const hanoi = () => pr.evaluate(() => { const g = window.__globe, u = g.unit(21.03, 105.85), [x, y] = g.proj(u[0], u[1], u[2]); const h = document.getElementById('globeHost').getBoundingClientRect(); return { x: h.left + x, y: h.top + y }; });
    const p0 = await hanoi(); await pr.mouse.move(p0.x, p0.y); await pr.mouse.wheel(0, -360); await sleep(1000);
    const z1 = await pr.evaluate(() => window.__globe.zoom), p1 = await hanoi();
    c.ok(z1 > 1.6 && z1 < 2.6, `wheel zooms in (${z1.toFixed(2)})`);
    c.ok(Math.hypot(p1.x - p0.x, p1.y - p0.y) < 3, 'the place under the pointer stays put while zooming');
    await pr.keyboard.press('-'); await sleep(700); const z2 = await pr.evaluate(() => window.__globe.zoom); c.ok(z2 < z1 - 0.2, '"−" key zooms out');
    await pr.click('#zoomIn'); await sleep(700); c.ok((await pr.evaluate(() => window.__globe.zoom)) > z2 + 0.2, '+ button zooms in');
    await pr.click('.gpin[data-id="Hanoi"] .lbl'); await sleep(500);
    c.ok(await pr.evaluate(() => { const m = document.querySelector('.modal-overlay, #nexusModal, .nexus-modal'); return !!m && getComputedStyle(m).display !== 'none' && !m.classList.contains('hidden'); }), 'a pin still opens its exchange card');
    await pr.evaluate(() => document.querySelectorAll('.modal-overlay, #nexusModal, .nexus-modal').forEach(m => m.classList.add('hidden')));
    await pr.keyboard.press('0'); await sleep(900);
    c.ok(Math.abs(await pr.evaluate(() => window.__globe.zoom) - 1) < 0.02, '"0" resets the view');
    await shot(pr, 'p-16-globe');
  }
}
c.ok(pr.errs.length === 0, 'no page errors across 26 steps ' + JSON.stringify(pr.errs.slice(0, 5)));
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
