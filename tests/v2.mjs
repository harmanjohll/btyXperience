// Version 2 (gem/v2.html + gem/x/v2.html) is a separate copy of the show. It keeps its own saved
// state (session/v2) and its own phone storage, so both versions can run on the same database at
// the same time without seeing each other. This walks version 2 end to end beside version 1.
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, presenter, phone, board, goStepId, sleep, until, phoneState, foldTo, shot, decodeQR } from './lib/harness.mjs';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('v2');
console.log('VERSION 2 · beside version 1');

const v1 = await presenter(browser, srv.url);                       // version 1 running at the same time
const pr = await presenter(browser, srv.url, '', 'v2.html');
const s1 = () => srv.api.get('session/state') || {}, s2 = () => srv.api.get('session/v2') || {};
c.ok(await until(() => s2().epoch, 5000) && s1().epoch && s1().epoch !== s2().epoch, 'each version keeps its own saved state (session/state and session/v2) and its own show id');
c.ok(/VERSION 2/.test(await pr.$eval('#modeNote', e => e.textContent)), 'the v2 start screen says VERSION 2');
const join = await decodeQR(pr, '#qrPill .qr-svg');
c.ok(join === srv.url + '/x/v2.html', `the v2 join QR scans to the v2 audience page (${join})`);

const phones = [await phone(browser, srv.url, 'v2a', '/x/v2.html'), await phone(browser, srv.url, 'v2b', '/x/v2.html')];
await Promise.all(phones.map(p => board(p)));
c.ok(await until(async () => /2 in the Hive · 2 ready/.test(await pr.$eval('#pCount', e => e.textContent)), 8000), 'v2 counts its 2 phones');
c.ok(/Warming up/.test(await v1.$eval('#pCount', e => e.textContent)), 'version 1 does not see version 2\'s phones');
c.ok(await phones[0].evaluate(() => !!localStorage.getItem('btySail_show2') && !localStorage.getItem('btySail_v7')), 'v2 phones keep their own storage (version 1\'s is untouched)');

await goStepId(pr, 'fold_s');
c.ok(await until(() => phones[0].$('#origamiStage .fold-overlay'), 6000) && s2().currentView === 'fold' && s1().currentView !== 'fold', 'v2 fold beat reaches v2 phones only (version 1 stays put)');
c.ok(await foldTo(phones[0], 1), 'a v2 phone folds');
await goStepId(pr, 'deck_a');
c.ok(await until(() => s2().scene && s2().scene.deck === 'deck_a', 4000) && await until(() => phones[0].$('.scene-companion'), 5000), 'v2 slides and their phone companions run on session/v2');
await goStepId(pr, 'set_sail');
for (const [i, p] of phones.entries()) { await until(() => p.$('#dreamInput, .ready-screen'), 8000); if (await p.$('#dreamInput')) { await p.fill('#dreamInput', ['Pilot', 'Chef'][i]); await p.click('#dreamBtn'); } }
await until(async () => (await Promise.all(phones.map(p => p.$('.ready-screen')))).every(Boolean), 9000);
await pr.click('#setSailBtn');
c.ok(await until(async () => (await Promise.all(phones.map(phoneState))).every(d => d.launched), 15000), 'v2 boats set sail together');
await goStepId(pr, 'card');
c.ok(await until(() => phones[0].$('.boarding-pass'), 8000), 'v2 phones land on their Boarding Pass');
await shot(pr, 'v2-card'); await shot(phones[0], 'v2-phone-pass');
c.ok(!s1().cue && s1().currentView !== 'memento', 'version 1\'s saved state never moved');

// The version 2 design rules, on every slide: one left edge for the chapter line and every title,
// nothing runs into the slide dots or off the page, and no em dash on screen.
const decks = await pr.evaluate(() => Object.fromEntries(Object.entries(window.BTY_DECKS).map(([k, d]) => [k, d.slides.length])));
const bad = { edge: [], dots: [], dash: [], left: [], top: [] }; let L0 = null, T0 = null;
for (const [id, n] of Object.entries(decks)) for (let i = 0; i < n; i++) {
  await pr.evaluate(([id, i]) => window.__jump(id, i), [id, i]); await sleep(i ? 1700 : 2200);
  const r = await pr.evaluate(() => {
    const body = document.getElementById('scBody'), foot = document.querySelector('footer'); if (!body || !foot) return null;
    const L = body.getBoundingClientRect().left, D = foot.getBoundingClientRect().top - 8;
    const t = body.querySelector(':scope > .sc-t, :scope .stage > .sc-t'), edge = t ? Math.abs(t.getBoundingClientRect().left - L) : 0;
    const vis = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .05 && el.getClientRects().length; };
    const over = [...body.querySelectorAll('h2,h3,h4,p,li,b,figure,img,blockquote,.sc-row,.pp,.lg,.lk')].filter(el => vis(el) && !el.closest('.sc-bleed')).filter(el => el.getBoundingClientRect().bottom > D + 2).map(el => el.tagName + ' ' + (el.textContent || el.getAttribute('src') || '').trim().slice(0, 30));
    const tt = t && getComputedStyle(t).position !== 'absolute' ? t.getBoundingClientRect().top : null;
    return { edge, over, dash: /\u2014/.test(body.innerText), L: t ? t.getBoundingClientRect().left : null, T: tt };
  });
  if (!r) continue;
  const k = `${id} ${i + 1}`;
  if (r.edge > 4) bad.edge.push(`${k} (${Math.round(r.edge)}px)`);
  if (r.over.length) bad.dots.push(`${k}: ${r.over[0]}`);
  if (r.dash) bad.dash.push(k);
  if (r.L !== null) { L0 ??= r.L; if (Math.abs(r.L - L0) > 4) bad.left.push(`${k} (${Math.round(r.L)} vs ${Math.round(L0)})`); }
  if (r.T !== null) { T0 ??= r.T; if (Math.abs(r.T - T0) > 6) bad.top.push(`${k} (${Math.round(r.T)} vs ${Math.round(T0)})`); }
}
c.ok(!bad.edge.length, 'every title starts on the slide\'s left edge ' + bad.edge.slice(0, 6).join(', '));
c.ok(!bad.left.length, 'titles keep one left edge on dark and cream pages ' + bad.left.slice(0, 6).join(', '));
c.ok(!bad.top.length, 'titles sit at one height on dark and cream pages ' + bad.top.slice(0, 6).join(', '));
c.ok(!bad.dots.length, 'nothing runs into the chapter roadmap ' + bad.dots.slice(0, 6).join(' | '));
c.ok(!bad.dash.length, 'no em dash on any slide ' + bad.dash.slice(0, 6).join(', '));

// A slide's motion starts over every time it is shown: timers from an earlier visit never fire on a later one.
const revisit = async (id, i, ms, probe) => { await pr.evaluate(([id, i]) => window.__jump(id, i), [id, i]); await sleep(1000);
  await pr.click('#nextBtn'); await sleep(900); await pr.click('#prevBtn'); await sleep(ms); return pr.evaluate(probe); };
const crest = await revisit('deck_a', 1, 1300, () => [...document.querySelectorAll('#scBody .cr-list li')].findIndex(l => l.classList.contains('now')));
const fsbb = await revisit('deck_b', 4, 1500, () => document.querySelector('#scBody .mx-phase')?.dataset.p);
const ties = await revisit('deck_f', 6, 1500, () => document.querySelectorAll('#scBody .tb-col.on').length);
const stairs = await revisit('deck_b', 1, 800, () => document.querySelectorAll('#scBody .st2-bar.on').length);
c.ok(crest === 0 && fsbb === '1' && ties === 1 && stairs === 0, `coming back to a slide replays its motion from the start (crest ${crest}, FSBB ${fsbb}, tie breakers ${ties}, stairs ${stairs})`);
// A poll's reveal arms again whenever the show comes back to it.
await pr.evaluate(() => window.__jump('poll_dream', 0)); await sleep(700); await pr.click('#nextBtn'); await sleep(500); await pr.click('#nextBtn'); await sleep(900);
await pr.evaluate(() => window.__jump('poll_dream', 0)); await sleep(700);
c.ok(/reveal/i.test(await pr.$eval('#nextBtn', e => e.textContent)), 'a poll shown again offers its reveal again');
// Perspective: every "Inspiration" sits in its own stair pocket (right of its riser, between its treads).
await pr.evaluate(() => window.__jump('deck_b', 1)); await sleep(1200);
const pockets = await pr.evaluate(() => [...document.querySelectorAll('#scBody .st2-insp')].map(t => { const b = t.getBBox(), d = t.dataset;
  return b.x >= +d.x0 && b.x + b.width <= +d.x1 && b.y >= +d.y0 - 2 && b.y + b.height <= +d.y1 + 2; }));
c.ok(pockets.length === 4 && pockets.every(Boolean), `each "Inspiration" label sits in its stair pocket ${JSON.stringify(pockets)}`);

// The roadmap lights the chapter the room is in.
await pr.evaluate(() => window.__jump('deck_b', 6)); await sleep(600);
const lit = await pr.evaluate(() => [...document.querySelectorAll('#roadmap .rm.on b')].map(b => b.textContent));
await pr.evaluate(() => window.__jump('nexus_global', 0)); await sleep(600);
const lit2 = await pr.evaluate(() => [...document.querySelectorAll('#roadmap .rm.on b')].map(b => b.textContent));
c.ok(lit.join() === 'A day at Beatty' && lit2.join() === 'NEXUS@BTY', `the roadmap lights the chapter (${lit} · ${lit2})`);

const errs = [v1, pr, ...phones].flatMap(p => p.errs);
c.ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
