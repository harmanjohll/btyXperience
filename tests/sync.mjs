// The whole show, end to end: one presenter and three phones on one shared (stand-in) database.
// Checks that phones follow the presenter's pace, answer only when asked, are counted on the
// big screen, fold in four beats, set sail together, and leave with a card.
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, presenter, phone, board, goStep, sleep, until, appHTML, phoneState, foldTo, shot } from './lib/harness.mjs';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('sync');
const mine = () => srv.api.col('compassQuiz');
const state = () => srv.api.get('session/state') || {};

console.log('SYNC · presenter + 3 phones');
const pr = await presenter(browser, srv.url);
const phones = [];
for (let i = 1; i <= 3; i++) phones.push(await phone(browser, srv.url, 'phone' + i));
c.ok(phones.every(Boolean), 'three phones open the audience page');

// --- Step 1: join + compass quiz ---------------------------------------------------------
await Promise.all(phones.map((p, i) => board(p, i === 2 ? [[3, 2], [3, 2], [3, 2], [3, 2], [3, 2]] : [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0]])));
const pill = await until(async () => { const t = await pr.$eval('#pCount', e => e.textContent); return /3 in the Hive · 3 ready/.test(t) ? t : null; }, 8000);
c.ok(pill, 'presenter: "3 in the Hive · 3 ready"');
c.ok(mine().every(d => d.data.done && /^The /.test(d.data.archetype)), 'each phone keeps ONE saved state with its bee');
await shot(pr, 'sync-01-hive');

// --- Step 2: video → phones watch; a reaction floats up ----------------------------------
await goStep(pr, 2);
await until(() => phones[0].$('#reactBar'), 5000);
c.ok(await phones[0].$('.watch-screen'), 'video: phones show "eyes on the screen"');
await phones[0].click('.react-btn[data-e="👏"]');
const floated = await until(() => pr.$('#reactionOverlay .floating-reaction'), 5000);
c.ok(floated, 'a phone\'s 👏 floats up the big screen');

// --- Step 4: Fold with us · S (folds 1–2) --------------------------------------------------
await goStep(pr, 4);
await until(() => phones[0].$('#origamiStage .fold-overlay'), 6000);
const folded1 = []; for (const p of phones) folded1.push(await foldTo(p, 2));
c.ok(folded1.every(Boolean), 'fold beat S: every phone folds twice');
const fc = await until(async () => { const t = await pr.$eval('.fc-n', e => e.textContent).catch(() => ''); return t === '3' ? t : null; }, 6000);
c.ok(fc, 'presenter counts 3 boats past fold 2');
await shot(pr, 'sync-04-fold');

// --- Step 5: poll → vote → reveal → phones draw the tally ----------------------------------
await goStep(pr, 5);
await until(() => phones[0].$('.answer-opt'), 6000);
await phones[0].click('.answer-opt[data-poll="1"]'); await phones[1].click('.answer-opt[data-poll="1"]'); await phones[2].click('.answer-opt[data-poll="0"]');
const voted = await until(async () => /3/.test(await pr.$eval('.votes-chip .pv', e => e.textContent).catch(() => '')), 6000);
c.ok(voted, 'presenter: 3 voted');
c.ok(!(await appHTML(phones[0])).includes('pbar-fill'), 'before the reveal phones show only "locked in"');
await pr.click('#nextBtn');        // first press = Reveal answer
const tl = await until(() => state().tally, 5000);
c.ok(tl && tl.total === 3 && tl.counts[1] === 2 && tl.counts[0] === 1, 'reveal puts the tally in the show\'s saved state ' + JSON.stringify(tl));
const bar = await until(async () => { const w = await phones[2].$eval('.pbar[data-i="1"] .pbar-pc', e => e.textContent).catch(() => ''); return w === '67%' ? w : null; }, 5000);
c.ok(bar, 'phones draw the result bars from the tally (67% / 33%)');
await shot(phones[2], 'sync-05-phone-reveal');

// --- Steps 9, 15: the next fold beats ------------------------------------------------------
for (const [stepN, to] of [[9, 4], [15, 6]]) {
  await goStep(pr, stepN);
  await until(() => phones[0].$('#origamiStage .fold-overlay'), 6000);
  const r = []; for (const p of phones) r.push(await foldTo(p, to));
  c.ok(r.every(Boolean), `fold beat at step ${stepN}: phones reach fold ${to}`);
}

// --- Step 16/17: globe + map picks ---------------------------------------------------------
await goStep(pr, 16);
await until(() => phones[0].$('.answer-opt[data-nx]'), 6000);
for (const p of phones) await p.click('.answer-opt[data-nx="Hanoi"]');
const gl = await until(async () => { const t = await pr.$eval('.gpin[data-id="Hanoi"] .gcnt', e => e.textContent).catch(() => ''); return t === '3' ? t : null; }, 6000);
c.ok(gl, 'globe: Hanoi pin shows 3');
await goStep(pr, 17);
await until(() => phones[0].$('.answer-opt[data-nx]'), 6000);
for (const p of phones) await p.click('.answer-opt[data-nx="ASTAR"]');
const mp = await until(async () => /3/.test(await pr.$eval('#nexusStats', e => e.textContent).catch(() => '')), 6000);
c.ok(mp, 'map: 3 choices counted, separately from the globe');

// --- Step 20: last fold beat → boat complete ----------------------------------------------
await goStep(pr, 20);
await until(() => phones[0].$('#origamiStage .fold-overlay, .pull-dot'), 8000);
const r8 = []; for (const p of phones) r8.push(await foldTo(p, 8));
c.ok(r8.every(Boolean), 'fold beat L: every boat is complete (8 folds)');

// --- Step 21: pulse ----------------------------------------------------------------------
await goStep(pr, 21);
await until(() => phones[0].$('[data-mood]'), 6000);
for (const p of phones) await p.click('[data-mood="Excited!"]');
const pl = await until(async () => mine().filter(d => d.data.p === 'Excited!').length === 3, 5000);
c.ok(pl, 'pulse: three moods saved');

// --- Step 22: name the boat, then SET SAIL together --------------------------------------
await goStep(pr, 22);
for (const [i, p] of phones.entries()) {
  await until(() => p.$('#dreamInput, #holdBoat, .ready-screen'), 8000);
  if (await p.$('#dreamInput')) { await p.fill('#dreamInput', ['Engineer', 'Doctor', 'Artist'][i]); await p.click('#dreamBtn'); }
}
const ready = await until(async () => (await Promise.all(phones.map(p => p.$('.ready-screen')))).every(Boolean), 9000);
c.ok(ready, 'named boats wait at the ready gate');
await pr.click('#setSailBtn');
const held = await until(async () => (await Promise.all(phones.map(p => p.$('#holdBoat')))).every(Boolean), 6000);
c.ok(held, 'the cue reaches every phone: "Hold your boat"');
const launched = await until(async () => (await Promise.all(phones.map(phoneState))).every(d => d.launched), 14000);
c.ok(launched, 'every boat launches on the same count');
const at = (await Promise.all(phones.map(phoneState))).map(d => d.launchedAt);
c.ok(Math.max(...at) - Math.min(...at) < 400, `launch moments within 400 ms of each other (${Math.max(...at) - Math.min(...at)} ms)`);
await sleep(1500);
await shot(pr, 'sync-22-fleet');

// --- Step 23: Hive of aspirations ---------------------------------------------------------
await goStep(pr, 23);
const words = await until(async () => { const t = await pr.$eval('#journeyContent', e => e.textContent).catch(() => ''); return /ENGINEER|Engineer/.test(t) && /DOCTOR|Doctor/.test(t) ? t : null; }, 6000);
c.ok(words, 'the hive shows the boats\' words');

// --- Step 25: the card ---------------------------------------------------------------------
await goStep(pr, 25);
const card = await until(() => phones[0].$('.compass-card'), 8000);
c.ok(card, 'phones land on their Compass Card');
const fleetN = state().fleet;
c.ok(fleetN === 3, 'the show\'s saved state knows the fleet size: ' + fleetN);
const lbl = await until(async () => /One of 3 boats/.test(await appHTML(phones[0])), 6000);
c.ok(lbl, 'card: "One of 3 boats"');
await shot(phones[0], 'sync-25-card');

// --- Reset = a new show: phones start fresh, counts go back to zero (no deletes needed) ---
const e1 = state().epoch;
await pr.evaluate(() => { document.getElementById('presenterPanel')?.classList.remove('collapsed'); });
await pr.click('#ppReset'); await pr.fill('#resetInput', 'RESET'); await pr.click('#resetConfirm');
const e2 = await until(() => state().epoch !== e1 ? state().epoch : null, 6000);
c.ok(e2 && e2 !== e1, 'Reset writes a new show id');
const fresh = await until(async () => (await Promise.all(phones.map(p => p.$('#boardBtn')))).every(Boolean), 8000);
c.ok(fresh, 'every phone drops its rehearsal boat and is back at "Tap to board"');
await sleep(2500);   // the presenter reloads itself
await until(() => pr.$('#beginBtn'), 8000); await pr.click('#beginBtn').catch(() => {});
const zero = await until(async () => /Warming up/.test(await pr.$eval('#pCount', e => e.textContent).catch(() => '')), 6000);
c.ok(zero, 'the big screen counts zero phones for the new show');
await board(phones[0]);
const one = await until(async () => /1 in the Hive · 1 ready/.test(await pr.$eval('#pCount', e => e.textContent).catch(() => '')), 8000);
c.ok(one, 'a phone boarding the new show is counted');

// --- What the database saw --------------------------------------------------------------
const cols = new Set(srv.api.log.filter(l => l.op === 'set').map(l => l.path.split('/')[0]));
c.ok([...cols].every(x => x === 'compassQuiz' || x === 'session'), 'only two saved states were written: ' + [...cols].join(', '));
const phoneWrites = srv.api.log.filter(l => l.path.startsWith('compassQuiz/')).length / 3;
c.ok(phoneWrites < 40, `about ${phoneWrites.toFixed(0)} writes per phone for the whole show`);
const errs = [pr, ...phones].flatMap(p => p.errs);
c.ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));

await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
