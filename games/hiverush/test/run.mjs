// Hive Rush end to end test: one host + three player devices play a full game through the
// Firebase stand-in, then a new group, solo mode and the offline fallback.
// Run:  node games/hiverush/test/run.mjs      Screenshots land in games/hiverush/test/out/
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true });
const STUB = fs.readFileSync(path.join(HERE, 'firebase-stub.js'), 'utf8');
const C = (() => { const window = {}; eval(fs.readFileSync(path.join(ROOT, 'js/content.js'), 'utf8').replace('window.HR = window.HR || {};', 'var HR = window.HR = {};')); return window.HR.CONTENT; })();

function loadPW() {
  try { return createRequire(import.meta.url)('playwright'); } catch (e) {}
  for (const b of ['/opt/node22/lib/node_modules/', '/usr/local/lib/node_modules/', '/usr/lib/node_modules/']) { try { return createRequire(b)('playwright'); } catch (e) {} }
  throw new Error('playwright not found');
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 20000, step = 100) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = await fn(); if (v) return v; } catch (e) {} await sleep(step); } return null; }
const fails = []; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails.push(m); return c; };
const errs = [];
let shotN = 0;
const shot = (p, name) => p.screenshot({ path: path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png') });

const { chromium } = loadPW();
const browser = await chromium.launch({ args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] }); // each real device is foreground

async function mkPage(ctx, label, w, h, stub = true) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h });
  p.on('pageerror', e => errs.push(`[${label}] ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load/.test(m.text())) errs.push(`[${label}] ${m.text()}`); });
  p.label = label; return p;
}
async function routeFirebase(ctx, mode) {
  await ctx.route('https://www.gstatic.com/firebasejs/**', route => {
    if (mode === 'offline') return route.abort();
    const body = route.request().url().includes('firebase-app-compat') ? STUB : '/* stubbed */';
    route.fulfill({ status: 200, contentType: 'text/javascript', body });
  });
}
const viewKey = p => p.evaluate(() => (window.HR && HR.__player && HR.__player.viewKey) || '');
const hostPhase = h => h.evaluate(() => (HR.__host.st && HR.__host.st.phase + ':' + HR.__host.st.round) || '');

/* ===================== multiplayer ===================== */
console.log('\nMultiplayer: host + 3 devices');
const ctx = await browser.newContext({ hasTouch: false });
await routeFirebase(ctx, 'stub');
const host = await mkPage(ctx, 'host', 1366, 800);
await host.goto(BASE + '/host.html');
await shot(host, 'host-setup');
await host.click('#create');
const pin = await until(() => host.$eval('.pin-big', e => e.textContent.trim()).catch(() => null));
ok(/^\d{4}$/.test(pin || ''), 'host created 4 digit PIN ' + pin);

const P = [await mkPage(ctx, 'phone', 390, 844), await mkPage(ctx, 'tablet', 820, 1180), await mkPage(ctx, 'tabletL', 1180, 820)];
for (const p of P) await p.goto(BASE + '/index.html');
await shot(P[0], 'phone-join');
// enter the PIN on the keypad of each device
for (const p of P) {
  if ((await viewKey(p)).startsWith('join')) { for (const d of pin) { await p.click(`.keypad button[data-k="${d}"]`); await sleep(60); } }
  ok(await until(async () => (await viewKey(p)).startsWith('squad')), `${p.label} reached squad screen`);
}
await P[0].click('#sqRoll'); await sleep(700);
await P[1].click('.av[data-a="🚀"]'); await sleep(200);
await shot(P[0], 'phone-squad'); await shot(P[2], 'tabletL-squad');
for (const p of P) await p.click('#ready');
ok(await until(async () => (await host.$eval('#lc', e => +e.textContent)) === 3), 'host lobby shows 3 squads');
await sleep(600);
await shot(host, 'host-lobby'); await shot(P[1], 'tablet-lobby');
const names = await Promise.all(P.map(p => p.evaluate(() => HR.__player.me.name)));
ok(new Set(names).size === 3, 'squad names are unique: ' + names.join(' | '));
await host.click('#start');

// strategies: phone = perfect & fast, tablet = mixed, tabletL = slow / sometimes silent
async function playRound(p, r, style) {
  const rd = C.rounds[r];
  await until(async () => (await viewKey(p)).startsWith('q:'), 15000, 50);
  if (style === 'skip') return;
  await sleep(style === 'fast' ? 400 : 2500);
  if (rd.type === 'mcq') {
    if (process.env.DBG) console.log('    dbg before', p.label, r, await viewKey(p), await p.locator('.tile').count());
    await p.locator(`.tile[data-i="${style === 'wrong' ? 1 : rd.answer}"]`).dispatchEvent('pointerdown');
    if (process.env.DBG) { await sleep(600); console.log('    dbg after', p.label, r, await viewKey(p), JSON.stringify(await p.evaluate(r => HR.__player.me.answers[r] || null, r))); }
  }
  if (rd.type === 'mythfact') for (const c of rd.cards) { await p.locator(`.mf-btn[data-a="${(style === 'wrong' ? !c.fact : c.fact) ? 1 : 0}"]`).dispatchEvent('pointerdown'); await sleep(520); }
  if (rd.type === 'slider') {
    const target = style === 'wrong' ? 72 : rd.answer;
    const box = await p.locator('.sl-track').boundingBox();
    await p.mouse.click(box.x + box.width * (target - rd.min) / (rd.max - rd.min), box.y + box.height / 2);
    await sleep(200); await p.click('.sl-lock');
  }
  if (rd.type === 'order') { const seq = style === 'wrong' ? [1, 0, 1, 2, 3, 4] : [0, 1, 2, 3, 4]; for (const i of seq) { await p.locator(`.ord-tile[data-i="${i}"]`).dispatchEvent('pointerdown'); await sleep(180); } }
  if (rd.type === 'hunt') {
    const labels = await p.$$eval('.bub span', els => els.map(e => e.textContent));
    for (let i = 0; i < labels.length; i++) {
      const real = rd.targets.includes(labels[i]);
      if (real || (style === 'wrong' && labels[i] === rd.decoys[0])) { await p.locator(`.bub[data-i="${i}"]`).dispatchEvent('pointerdown'); await sleep(150); }
    }
  }
}
const plans = [['fast', 'wrong', 'skip'], ['fast', 'wrong', 'slow'], ['fast', 'slow', 'wrong'], ['fast', 'wrong', 'slow'], ['fast', 'slow', 'wrong'], ['fast', 'wrong', 'slow']];
for (let r = 0; r < C.rounds.length; r++) {
  const t0 = Date.now();
  // capture intro on the first and golden rounds
  if (r === 0 || C.rounds[r].golden) { await until(async () => (await hostPhase(host)) === 'intro:' + r, 20000, 50); await sleep(900); await shot(host, `host-intro-${r}`); await shot(P[0], `phone-intro-${r}`); }
  await until(async () => (await hostPhase(host)) === 'question:' + r, 25000, 50);
  await sleep(250);
  await shot(P[0], `phone-q${r}-${C.rounds[r].type}`); await shot(P[2], `tabletL-q${r}-${C.rounds[r].type}`);
  if (r === 0) await shot(host, `host-q${r}`);
  if (r === 4) { await shot(P[1], `tablet-q${r}-${C.rounds[r].type}`); }
  await Promise.all(P.map((p, i) => playRound(p, r, plans[r][i]).catch(e => console.log('    play error', p.label, r, e.message.split('\n')[0]))));
  if (r === 0) { await sleep(300); await shot(P[0], 'phone-locked'); }
  ok(await until(async () => (await hostPhase(host)) === 'reveal:' + r, 25000, 50), `round ${r + 1} (${C.rounds[r].type}) reached reveal in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await sleep(1400);
  await shot(host, `host-reveal-${r}`); await shot(P[0], `phone-reveal-${r}`); await shot(P[1], `tablet-reveal-${r}`);
  if (r < C.rounds.length - 1) {
    await until(async () => (await hostPhase(host)) === 'board:' + r, 12000, 50); await sleep(1500);
    if (r === 1 || r === 3) { await shot(host, `host-board-${r}`); await shot(P[1], `tablet-board-${r}`); }
  }
}
const scores = await Promise.all(P.map(p => p.evaluate(() => HR.__player.me.score)));
for (const p of P) console.log('   ', p.label, JSON.stringify(await p.evaluate(() => Object.entries(HR.__player.me.answers).map(([r, a]) => r + ':' + a.pts + (a.timeout ? 'T' : a.ok ? '✓' : '✗')))));
ok(scores[0] > scores[1] && scores[0] > scores[2], 'perfect player leads: ' + scores.join(' / '));
const r0 = await P[2].evaluate(() => HR.__player.me.answers[0]);
ok(r0 && r0.timeout && r0.pts === 0, 'silent device got a timeout record for round 1');
const slider = await P[1].evaluate(() => HR.__player.me.answers[2]);
ok(slider && slider.v === 90 && slider.pts === 1000, 'slider exact guess scored 1000 (got ' + JSON.stringify(slider) + ')');
ok(await until(async () => (await hostPhase(host)).startsWith('podium'), 15000), 'host reached podium');
await sleep(6500); await shot(host, 'host-podium'); await shot(P[0], 'phone-podium'); await shot(P[1], 'tablet-podium');
ok(await until(async () => (await hostPhase(host)).startsWith('finale'), 15000), 'host reached finale');
await sleep(800); await shot(host, 'host-finale'); await shot(P[0], 'phone-finale'); await shot(P[2], 'tabletL-finale');
ok(await host.$('.qr svg') != null, 'finale shows Open House QR');

// new group: devices return to the squad screen without re-entering the PIN
await host.click('#next');
ok(await until(async () => (await viewKey(P[0])).startsWith('squad:2')), 'new group: devices back at squad screen (session 2)');
ok(await until(async () => /Booth record today/.test(await host.textContent('body'))), 'host lobby shows booth record');
await shot(host, 'host-lobby-group2');

// reload resilience: a player tab reloads mid lobby and stays joined
await P[0].click('#ready');
await until(async () => (await host.$eval('#lc', e => +e.textContent)) === 1);
await P[0].reload();
ok(await until(async () => (await viewKey(P[0])).startsWith('lobby:2')), 'player reload keeps device in the game');
await ctx.close();

/* ===================== solo ===================== */
console.log('\nSolo mode');
const sctx = await browser.newContext();
await routeFirebase(sctx, 'offline');
const s = await mkPage(sctx, 'solo', 820, 1180);
await s.goto(BASE + '/index.html');
ok(await until(async () => (await viewKey(s)).startsWith('join')), 'solo: join screen without PIN');
await s.click('#soloBtn');
await s.click('#ready');
await s.click('#sgo');
for (let r = 0; r < C.rounds.length; r++) { await playRound(s, r, 'fast'); await until(async () => (await viewKey(s)).startsWith('rev:'), 25000, 50); }
ok(await until(async () => (await viewKey(s)).startsWith('fin:'), 40000), 'solo reached finale');
await sleep(600); await shot(s, 'solo-finale');
ok(await s.$('.solo-board li') != null, 'solo finale shows today’s device board');

/* ===================== offline ===================== */
console.log('\nOffline fallback');
const o = await mkPage(sctx, 'offline', 390, 844);
await o.goto(BASE + '/index.html');
for (const d of '1234') await o.click(`.keypad button[data-k="${d}"]`);
ok(await until(async () => (await viewKey(o)) === 'offline', 20000), 'no internet: shows “Can’t reach the hive” with solo option');
await shot(o, 'phone-offline');
await sctx.close();

await browser.close(); server.close();
console.log('\nPage errors:', errs.length ? '\n  ' + errs.join('\n  ') : 'none');
if (errs.length) fails.push('page errors');
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
process.exit(fails.length ? 1 : 0);
