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

const errs = [v1, pr, ...phones].flatMap(p => p.errs);
c.ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
