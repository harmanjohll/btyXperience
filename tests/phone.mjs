// One phone through every screen, driven by writing the show's saved state directly.
// Screenshots each screen (tests/out/ph-*.png) and checks the phone answers only when asked.
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, phone, board, sleep, until, appHTML, phoneState, foldTo, setState, shot } from './lib/harness.mjs';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('phone');
const B = srv.url;
const POLL = { id: 'dream_poll', question: 'What does D.R.E.A.M. stand for at Beatty?', options: ['Discipline, Respect, Excellence, Achievement, Mindfulness', 'Discipline, Resilience, Empathy, Adaptability, Mindfulness', 'Diligence, Respect, Empathy, Adaptability, Mastery', 'Determination, Resilience, Excellence, Ambition, Mindfulness'], correctAnswer: 1, insight: 'D.R.E.A.M. guides every Beattyian.' };
const GLOBE = { type: 'global', options: [{ id: 'Hanoi', text: 'Vietnam (Hanoi)' }, { id: 'GeoBali', text: 'Bali (Geography)' }, { id: 'NZ', text: 'New Zealand' }] };
const MAP = { type: 'local', options: [{ id: 'Rockwell', text: 'Rockwell Automation' }, { id: 'ASTAR', text: 'A*STAR Research' }] };
let step = 0;
const go = async (s, wait = 900) => { await setState(B, { step: step++, chapter: s.chapter || 'Who we are', ...s }); await sleep(wait); };

console.log('PHONE');
const p = await phone(browser, B, 'phone');
c.ok(await p.$('#boardBtn'), 'boots to the boarding screen'); await shot(p, 'ph-01-board');
await go({ currentView: 'chart', chapter: 'Into the Hive' }, 500);
c.ok(await p.$('#boardBtn'), 'the presenter starting does not skip boarding');
await p.click('#boardBtn'); await sleep(400); await p.click('.quiz-opt[data-i="1"]'); await sleep(200); await shot(p, 'ph-02-quiz');
await p.click('.quiz-opt[data-i="0"]'); await sleep(520);
for (let q = 1; q < 5; q++) { await p.click('.quiz-opt[data-i="1"]'); await sleep(150); await p.click('.quiz-opt[data-i="0"]'); await sleep(520); }
await sleep(500); await shot(p, 'ph-03-reveal');
await sleep(2700); c.ok(/You're in the Hive/.test(await appHTML(p)), 'aboard after the quiz'); await shot(p, 'ph-04-aboard');

await go({ currentView: 'video', title: 'Welcome to Beatty' }); c.ok(await p.$('.watch-screen'), 'video → watch'); await shot(p, 'ph-05-watch');
await go({ currentView: 'slide', card: { title: '', keys: [] } }); c.ok(await p.$('.glance-screen'), 'deck → glance'); await shot(p, 'ph-06-glance');
await go({ currentView: 'values', chapter: 'Our values' }); await shot(p, 'ph-07-values');
await go({ currentView: 'funfact', chapter: 'Passions', funfact: { number: '17', label: 'CCAs to belong to', subtitle: 'A hive has a place for every kind of bee.' } }, 1700); await shot(p, 'ph-08-funfact');

await go({ currentView: 'fold', chapter: 'Our values', fold: { to: 2, letter: 'S' } }, 1200); await shot(p, 'ph-09-fold');
c.ok(await foldTo(p, 2), 'fold beat: two folds'); await sleep(600); await shot(p, 'ph-10-rest');

await go({ currentView: 'poll', pollData: POLL, revealed: false }); c.ok((await p.$$('.answer-opt')).length === 4, 'poll: four answers'); await shot(p, 'ph-11-poll');
await p.click('.answer-opt[data-poll="1"]'); await sleep(700); c.ok(!(await appHTML(p)).includes('pbar-fill'), 'locked in, no result yet'); await shot(p, 'ph-12-locked');
await go({ currentView: 'poll', pollData: POLL, revealed: true, tally: { id: 'dream_poll', total: 10, counts: [2, 6, 1, 1] } }, 1200);
c.ok(await p.$eval('.pbar[data-i="1"] .pbar-pc', e => e.textContent) === '60%', 'revealed: bars from the tally (60%)'); await shot(p, 'ph-13-revealed');

await go({ currentView: 'globe', chapter: 'NEXUS@BTY', nexusData: GLOBE }); await shot(p, 'ph-14-globe');
await p.click('.answer-opt[data-nx="Hanoi"]'); await sleep(900); await shot(p, 'ph-15-globe-chosen');
await go({ currentView: 'industry_map', chapter: 'NEXUS@BTY', nexusData: MAP }); await p.click('.answer-opt[data-nx="ASTAR"]'); await sleep(900); await shot(p, 'ph-16-map-chosen');
const mineDoc = srv.api.col('compassQuiz')[0]?.data || {};
c.ok(mineDoc.n && mineDoc.n.global === 'Hanoi' && mineDoc.n.local === 'ASTAR' && mineDoc.v && mineDoc.v.dream_poll === 1, 'its saved state holds the vote and both picks');


await go({ currentView: 'fold', chapter: 'Set sail', fold: { to: 8, letter: 'L' } }, 1200);
c.ok(await foldTo(p, 8), 'last beat: boat complete'); await sleep(2500); await shot(p, 'ph-20-boat-done');
await go({ currentView: 'pulse_check', chapter: 'Your journey' }); await shot(p, 'ph-21-pulse'); await p.click('[data-mood="Excited!"]'); await sleep(800);
await go({ currentView: 'fleet', chapter: 'Set sail' }, 1200);
if (await p.$('#dreamInput')) { await shot(p, 'ph-22-name'); await p.fill('#dreamInput', 'Engineer'); await p.click('#dreamBtn'); await sleep(900); await shot(p, 'ph-23-writing'); }
await until(() => p.$('.ready-screen'), 8000); await shot(p, 'ph-24-ready');
await go({ currentView: 'fleet', chapter: 'Set sail', cue: { id: 'sail-1', kind: 'sail', at: Date.now() + 8000 } }, 2500); await shot(p, 'ph-25-hold');
c.ok(await until(async () => (await phoneState(p)).launched, 10000), 'launches on the cue'); await sleep(1800); await shot(p, 'ph-26-atsea');
await go({ currentView: 'finale', chapter: 'Your journey' }); await shot(p, 'ph-27-hive');
await go({ currentView: 'memento', chapter: 'Your journey', fleet: 212 }, 2500);
c.ok(await p.$('.compass-card'), 'the Compass Card'); await shot(p, 'ph-28-card');
await p.setViewportSize({ width: 390, height: 2400 }); await sleep(400); await shot(p, 'ph-29-card-full'); await p.setViewportSize({ width: 390, height: 844 });

// Rejoin: a reload keeps the boat and lands back on the card.
await p.reload({ waitUntil: 'domcontentloaded' }); await sleep(2500);
c.ok(await p.$('.compass-card') && (await phoneState(p)).launched, 'a reload keeps everything (lands on the card)');
c.ok(p.errs.length === 0, 'no page errors ' + JSON.stringify(p.errs.slice(0, 5)));

// Solo: no presenter at all → the practise button appears.
await fetch(B + '/__fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'del', path: 'session/state' }) });
const solo = await phone(browser, B, 'solo');
await board(solo); const sb = await until(() => solo.$('#soloStart'), 24000);
c.ok(sb, 'no presenter → "Practise a fold while you wait"');
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
