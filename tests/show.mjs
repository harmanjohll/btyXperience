// THE SHOW (gem/index.html + gem/join/): the version to present. This walks it end to end and checks what the
// audit changed: one name, one chapter list on both screens, a quiz poll that hides its split until the reveal,
// questions from the phones on a wall, the card straight after "Choose Beatty!", a Boarding Pass that says why,
// carries links that can be tapped, and survives a second session; and the fallback (v2.html) still drives the phones.
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, presenter, phone, board, goStepId, sleep, until, phoneState, foldTo, shot, decodeQR, OUT } from './lib/harness.mjs';
import fs from 'fs';
import path from 'path';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('show');
console.log('THE SHOW · index.html + join/');
const state = () => srv.api.get('session/v2') || {};
const bad = [];
const watch = p => p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(srv.url)) bad.push(r.status() + ' ' + r.url().replace(srv.url, '')); });

const pr = await presenter(browser, srv.url, '', 'index.html'); watch(pr);
c.ok(await pr.title() === 'The Beatty Experience', 'the show is called The Beatty Experience (no "Version 2")');
c.ok(!/version/i.test(await pr.$eval('#modeNote', e => e.textContent)), 'the start screen has no version label');
const join = await decodeQR(pr, '#qrPill .qr-svg');
c.ok(join === srv.url + '/join/', `the join QR scans to join/ (${join})`);

const phones = [await phone(browser, srv.url, 'a', '/join/'), await phone(browser, srv.url, 'b', '/join/')]; phones.forEach(watch);
c.ok(await phones[0].title() === 'The Beatty Experience · Join' && !/build|version/i.test(await phones[0].$eval('#app', e => e.innerText)), 'the phone page is named, and shows no build text');
await Promise.all(phones.map(p => board(p)));
c.ok(await until(async () => /2 in the Hive · 2 ready/.test(await pr.$eval('#pCount', e => e.textContent)), 8000), 'two phones counted');

// The shape of the show.
const shape = await pr.evaluate(() => { const D = window.BTY_DECKS, all = Object.values(D).flatMap(d => d.slides), f = D.deck_f.slides, t = D.deck_tail.slides;
  return { lastF: f[f.length - 1].title, tail0: t[0].title, wall: t.findIndex(s => s.kind === 'live' && s.show === 'questions'), thanks: t.findIndex(s => /Thank you/.test(s.title || '')),
    asks: all.filter(s => s.kind === 'ask').length, dash: all.filter(s => /[–—]/.test(JSON.stringify({ ...s, notes: '' }))).length,
    steps: [window.__stepIndex('deck_f'), window.__stepIndex('card'), window.__stepIndex('deck_tail'), window.__stepIndex('funfact_nexus')] }; });
c.ok(shape.lastF === 'Choose Beatty!' && shape.steps[1] === shape.steps[0] + 1 && shape.steps[2] === shape.steps[1] + 1, 'the card comes straight after "Choose Beatty!"');
c.ok(shape.tail0 === 'Choosing a secondary school' && shape.wall > shape.thanks && shape.thanks > 0, 'how to choose a school comes after the card, then thanks, then the question wall');
c.ok(shape.asks === 4, `four one tap questions through the slides (${shape.asks})`);
c.ok(shape.dash === 0 && shape.steps[3] === -1, 'no dash on any slide, and the repeated "8" fun fact is gone');

// One chapter list: the phone names the chapter the roadmap lights.
const iMorning = await pr.evaluate(() => window.BTY_DECKS.deck_b.slides.findIndex(s => s.title === 'Morning'));
await pr.evaluate(i => window.__jump('deck_b', i), iMorning); await sleep(1200);
const lit = await pr.evaluate(() => [...document.querySelectorAll('#roadmap .rm.on b')].map(b => b.textContent).join());
const onPhone = await until(() => phones[0].$eval('.ch-name', e => e.textContent).catch(() => null), 4000);
c.ok(lit === 'A day at Beatty' && onPhone === lit && state().chapter === lit, `phone and roadmap name the same chapter (${onPhone} · ${lit})`);
c.ok(!/step/i.test(await phones[0].$eval('#linkPill', e => e.textContent)), 'the phone\'s live pill has no step number');

// The VALUES cover no longer hands the phones the poll's answer.
const iValues = await pr.evaluate(() => window.BTY_DECKS.deck_a.slides.findIndex(s => s.title === 'VALUES'));
await pr.evaluate(i => window.__jump('deck_a', i), iValues); await sleep(900);
c.ok(!/Resilience/.test(await phones[0].$eval('#app', e => e.innerText)), 'the phone does not spell out DREAM before the DREAM poll');

// A quiz poll: votes are counted, the split stays hidden until the reveal.
await pr.evaluate(() => window.__jump('poll_dream', 0));
await until(() => phones[0].$('.answer-opt'), 6000);
await phones[0].click('.answer-opt[data-poll="1"]'); await phones[1].click('.answer-opt[data-poll="0"]');
c.ok(await until(async () => /2/.test(await pr.$eval('.votes-chip .pv', e => e.textContent).catch(() => '')), 6000), 'the big screen counts 2 votes');
const hidden = await pr.evaluate(() => [...document.querySelectorAll('.poll-opt')].every(r => r.querySelector('.pc').textContent === '' && (parseFloat(r.querySelector('.poll-fill').style.width) || 0) === 0));
c.ok(hidden, 'before the reveal no bar and no count shows which answer leads');
await shot(pr, 'show-poll-hidden');
await pr.click('#nextBtn'); await sleep(900);
const shown = await pr.evaluate(() => [...document.querySelectorAll('.poll-opt')].map(r => r.querySelector('.pc').textContent).join());
c.ok(shown === '1,1,0,0' && await pr.$('.poll-opt.win'), `the reveal shows the split and the answer (${shown})`);

// Ask a question from the phone: an unkind one is turned back, a real one reaches the wall.
await pr.evaluate(() => window.__jump('deck_a', 2)); await until(() => phones[0].$('#askBtn'), 5000);
await phones[0].click('#askBtn'); await phones[0].waitForSelector('#askText');
await phones[0].fill('#askText', 'this is shit'); await phones[0].click('#askSend'); await sleep(300);
c.ok(/another way/.test(await phones[0].$eval('#askHint', e => e.textContent)) && !(await phoneState(phones[0])).qs, 'an unkind question is turned back on the phone');
await phones[0].fill('#askText', 'Which clubs exist for students who like to build things?'); await phones[0].click('#askSend'); await sleep(2400);
await phones[1].click('#askBtn'); await phones[1].waitForSelector('#askText'); await phones[1].fill('#askText', 'What time does school end on CCA days?'); await phones[1].click('#askSend'); await sleep(2400);
const iWall = shape.wall;
await pr.evaluate(i => window.__jump('deck_tail', i), iWall); await sleep(1400);
c.ok(await until(async () => (await pr.$$('.sc-qwall .qcard')).length === 2, 5000) && /2/.test(await pr.$eval('#scN', e => e.textContent)), 'both questions are on the wall');
await pr.click('.sc-qwall .qcard >> nth=1'); await sleep(400);
c.ok(await pr.$('.sc-qwall .qcard.spot'), 'a click brings a question to the front'); await shot(pr, 'show-question-wall');
await pr.hover('.sc-qwall .qcard.spot'); await pr.click('.sc-qwall .qcard.spot .qx'); await sleep(400);
c.ok((await pr.$$('.sc-qwall .qcard')).length === 1, 'its cross takes a question off the screen');

// The presenter view hears how many have answered.
const sp = await pr.context().newPage(); await sp.setViewportSize({ width: 1180, height: 760 }); watch(sp);
await sp.goto(srv.url + '/speaker.html', { waitUntil: 'domcontentloaded' });
await pr.evaluate(() => window.__jump('poll_cca', 0)); await until(() => phones[0].$('.answer-opt'), 6000); await phones[0].click('.answer-opt[data-poll="2"]');
c.ok(await until(async () => /1 of 2 voted/.test(await sp.$eval('#done', e => e.textContent).catch(() => '')), 6000), 'the presenter view shows "1 of 2 voted"');
await shot(sp, 'show-speaker'); await sp.close();

// Fold, name, set sail, and the card.
for (const [id, to] of [['fold_s', 1], ['fold_a', 3], ['fold_i', 6], ['fold_l', 8]]) { await goStepIdFresh(id); for (const p of phones) await foldTo(p, to); }
async function goStepIdFresh(id) { await pr.evaluate(id => window.__jump(id, 0), id); await until(() => phones[0].$('#origamiStage .fold-overlay'), 6000); }
await pr.evaluate(() => window.__jump('set_sail', 0));
for (const [i, p] of phones.entries()) { await until(() => p.$('#dreamInput, .ready-screen'), 8000); if (await p.$('#dreamInput')) { await p.fill('#dreamInput', ['Pilot', 'Chef'][i]); await p.click('#dreamBtn'); } }
await until(async () => (await Promise.all(phones.map(p => p.$('.ready-screen')))).every(Boolean), 9000);
await pr.click('#setSailBtn');
c.ok(await until(async () => (await Promise.all(phones.map(phoneState))).every(d => d.launched), 15000), 'the boats set sail together');
await pr.evaluate(() => window.__jump('card', 0));
c.ok(await until(() => phones[0].$('.boarding-pass'), 8000), 'phones land on their Boarding Pass');
const card = await phones[0].evaluate(() => ({ why: document.querySelector('.bp-you p')?.textContent || '', belief: document.querySelector('.bp-you em')?.textContent || '',
  links: [...document.querySelectorAll('.bp-links a')].map(a => a.href), qr: document.querySelector('a.bp-qr')?.href || '', ask: !!document.getElementById('askCardBtn') }));
c.ok(card.why.length > 40 && card.belief === 'Each child is a gift.', `the pass says why Beatty, for this visitor ("${card.why.slice(0, 46)}…")`);
c.ok(card.links.length >= 4 && card.links.every(u => /^https:\/\/go\.gov\.sg\//.test(u)) && /^https:/.test(card.qr) && card.ask, 'under the pass: links to tap, the QR is a link, and Ask a question');
await phones[0].setViewportSize({ width: 390, height: 1500 }); await sleep(300); await shot(phones[0], 'show-phone-pass'); await phones[0].setViewportSize({ width: 390, height: 844 });
const png = await phones[0].evaluate(() => window.__renderCard());
if (png) fs.writeFileSync(path.join(OUT, 'show-pass-saved.png'), Buffer.from(png.split(',')[1], 'base64'));
c.ok(png && png.length > 50000, 'the pass saves as an image');
// The tail keeps the pass on the phone; a question can still be asked from under it.
await pr.evaluate(() => window.__jump('deck_tail', 0));
const kept = await until(() => state().scene && state().scene.keep === 1, 5000); await sleep(700);
c.ok(kept && await phones[0].$('.boarding-pass'), 'after the card the phones keep their pass');

// The fallback: the copy kept from before the audit drives the same phones, with nothing to scan again.
const old = await presenter(browser, srv.url, '', 'v2.html'); watch(old);
await old.evaluate(() => window.__jump('poll_industry', 0));
c.ok(await until(() => phones[1].$('.answer-opt[data-poll]'), 7000), 'fallback: v2.html drives the phones that joined on join/');
await old.close();

// A second session: Reset starts a new show. First session phones keep their passes; new phones join as usual.
await pr.evaluate(() => window.__jump('card', 0)); await until(() => phones[1].$('.boarding-pass'), 7000);
const e1 = state().epoch;
await pr.evaluate(() => { document.getElementById('resetInput').value = 'RESET'; document.getElementById('resetConfirm').click(); });
await until(() => state().epoch && state().epoch !== e1, 8000);
await sleep(2600); await until(() => pr.evaluate(() => typeof dbReady !== 'undefined' && dbReady).catch(() => false), 10000); await pr.click('#beginBtn'); await sleep(600);
c.ok(state().epoch !== e1, 'Reset starts a new show');
c.ok(await until(() => phones[0].$('#joinNewBtn'), 6000) && await phones[0].$('.boarding-pass') && (await phoneState(phones[0])).aspiration === 'Pilot', 'a first session phone keeps its Boarding Pass');
await shot(phones[0], 'show-phone-pass-kept');
await pr.evaluate(() => window.__jump('poll_dream', 0)); await sleep(1200);
c.ok(await phones[0].$('.boarding-pass') && !(await phones[0].$('.answer-opt')), 'and it no longer follows the new session');
await phones[0].reload({ waitUntil: 'domcontentloaded' }); await sleep(2500);
c.ok(await phones[0].$('.boarding-pass'), 'reopening the page later still shows the pass');
const fresh = await phone(browser, srv.url, 'c', '/join/'); watch(fresh); await board(fresh);
c.ok(await until(async () => /1 in the Hive · 1 ready/.test(await pr.$eval('#pCount', e => e.textContent)), 8000), 'the new session counts only its own phones');
await phones[1].click('#joinNewBtn'); await sleep(300); await phones[1].click('#joinNewBtn'); await sleep(600);
c.ok(await phones[1].$('#boardBtn'), 'someone staying for the next session can join it (two taps)');

const errs = [pr, ...phones, fresh].flatMap(p => p.errs);
c.ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));
c.ok(bad.length === 0, 'no missing files ' + JSON.stringify([...new Set(bad)].slice(0, 5)));
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
