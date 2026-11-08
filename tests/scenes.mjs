// The native decks (deck/content.js; ?scenes=0 brings the Google decks back): every slide renders and pages
// with NEXT / BACK, the room's live dashboards fill from the phones' saved states, a slide's
// one-tap question reaches the phones and its bars fill, and the presenter view follows along.
import { startServer } from './lib/server.mjs';
import { loadPlaywright, checker, presenter, phone, board, stepNum, sleep, until, shot } from './lib/harness.mjs';

const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const c = checker('scenes');
console.log('SCENES');
const pr = await presenter(browser, srv.url);
const put = (path, data) => fetch(srv.url + '/__fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'set', path, data, merge: true }) });

// A room's worth of phones, written straight into the stand-in database for this show.
const e = await until(() => srv.api.get('session/state')?.epoch, 4000);
const A = ['The Innovator', 'The Global Explorer', 'The Industry Trailblazer', 'The Community Steward', 'The Creative Artist', 'The STEM Futurist', 'The Voice Amplifier', 'The Eco-Strategist'];
const G = ['Hanoi', 'GeoBali', 'NZ', 'Korea', 'Estonia', 'LitBali', 'Hanoi', 'NZ'], L = ['ASTAR', 'PIL', 'Rockwell', 'Makita', 'ASTAR'];
const W = ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Pilot', 'Chef', 'Engineer', 'Scientist', 'Doctor', 'Engineer', 'Designer', 'Nurse'];
const M = ['On fire!', 'Excited!', 'Enjoying it', 'Excited!'];
for (let i = 0; i < 24; i++) await put('compassQuiz/seed' + i, { e, archetype: A[[0, 0, 1, 2, 0, 3, 4, 5, 1, 6, 7, 0][i % 12]], done: true,
  v: { dream_poll: i % 5 ? 1 : 0, cca: i % 4 ? 2 : 1 }, n: { global: G[i % G.length], local: L[i % L.length] }, p: M[i % 4], w: W[i % W.length], f: 8, boat: { launched: true } });
await until(async () => /24 in the Hive/.test(await pr.$eval('#pCount', el => el.textContent)), 5000);

// The presenter view, in a second window of the same browser.
const notes = await pr.context().newPage(); notes.errs = []; notes.on('pageerror', er => notes.errs.push('[notes] ' + er.message));
await notes.setViewportSize({ width: 1180, height: 760 });
await notes.goto(srv.url + '/notes.html', { waitUntil: 'domcontentloaded' });

const scene = () => pr.evaluate(() => { const b = document.getElementById('scBody'), n = document.getElementById('scNum'); return b ? { num: n ? n.textContent : '', html: b.innerHTML.length } : null; });
const slideNow = () => pr.evaluate(() => { const d = window.BTY_DECKS[document.getElementById('scene').dataset.deck]; return d.slides[parseInt(document.getElementById('scNum').textContent, 10) - 1]; });
const decks = await pr.evaluate(() => Object.fromEntries(Object.entries(window.BTY_DECKS).map(([k, d]) => [k, d.slides.length])));
const total = Object.values(decks).reduce((a, b) => a + b, 0);
c.ok(Object.keys(decks).length === 6 && total >= 60, `six decks, ${total} slides, all switched on`);
c.ok(await pr.evaluate(() => Object.values(window.BTY_DECKS).every(d => d.use)), 'every deck is use:true');

const ph = await phone(browser, srv.url, 'phone');
await board(ph);

let slidesSeen = 0, step = 1, guard = 0, creamSeen = 0, toneWrong = [], imgCount = 0, brokenAll = [];
const TOTAL = await pr.$eval('#progText', el => +el.textContent.split('/')[1]);
while (step < TOTAL && guard++ < 200) {
  const was = await scene();
  await pr.click('#nextBtn'); await sleep(was ? 560 : 420);
  step = await stepNum(pr);
  const s = await scene();
  if (!s) continue;
  slidesSeen++;
  await sleep(1500);                                   // let the build-in finish
  const deck = await pr.$eval('#scene', el => el.dataset.deck);
  const i = parseInt(s.num, 10);
  c.ok(s.html > 40, `${deck} slide ${i} draws`);
  await shot(pr, `sc-${deck}-${String(i).padStart(2, '0')}`);
  const st = srv.api.get('session/state');
  if (!(st.scene && st.scene.deck === deck && st.scene.i === i - 1)) c.ok(false, `${deck} slide ${i} is in the show's saved state`);
  const sl = await slideNow();
  const tone = await pr.evaluate(() => { const el = document.getElementById('scene'); return { cream: el.classList.contains('cream'), bg: getComputedStyle(el).backgroundColor }; });
  if (tone.cream) creamSeen++;
  if (tone.cream !== (sl.tone === 'cream' && sl.kind !== 'ask') || (tone.cream && tone.bg !== 'rgb(246, 239, 225)')) toneWrong.push(`${deck} ${i}`);
  if (sl.kind === 'ask') {
    const opt = await until(() => ph.$('.answer-opt[data-ask]'), 5000);
    c.ok(opt, `${deck}: "${sl.question}" reaches the phone`);
    await shot(ph, `sc-phone-${sl.id}`);
    for (let k = 0; k < 9; k++) await put('compassQuiz/seed' + k, { m: { [sl.id]: k % sl.options.length } });
    await ph.click('.answer-opt[data-ask="1"]');
    const n = await until(async () => { const t = await pr.$eval('#scN', el => +el.textContent).catch(() => 0); return t === 10 ? t : null; }, 5000);
    c.ok(n, `${deck}: ten answers counted live on the big screen`);
    await sleep(1400); await shot(pr, `sc-${deck}-${String(i).padStart(2, '0')}-answered`);
    await shot(ph, `sc-phone-${sl.id}-locked`);
  } else if (i <= 2) {
    await shot(ph, `sc-phone-${deck}-${i}`);
  }
  if (sl.kind === 'live' && sl.show === 'bees') c.ok(await until(async () => (await pr.$eval('#scN', el => el.textContent)) === '25', 3000), 'live: the Hive counts 25 bees (24 seeded + this phone)');
  if (sl.kind === 'live' && sl.show === 'picks') c.ok((await pr.$$('#scLiveG .sc-row')).length >= 4 && (await pr.$$('#scLiveL .sc-row')).length >= 3, 'live: the hall\'s globe and map picks');
  if (sl.kind === 'live' && sl.show === 'words') c.ok((await pr.$$('#scLive span')).length >= 6, 'live: the hall\'s words');
  if (sl.kind === 'live' && sl.show === 'fleet') c.ok(await until(async () => (await pr.$eval('#scN', el => el.textContent)) === '24', 3000), 'live: 24 boats set sail');
  const imgs = await pr.evaluate(() => [...document.querySelectorAll('#scBody img')].map(im => ({ src: im.getAttribute('src'), ok: im.complete && im.naturalWidth > 0 })));
  const broken = imgs.filter(x => !x.ok);
  if (broken.length) { await sleep(1500); const again = await pr.evaluate(() => [...document.querySelectorAll('#scBody img')].filter(im => !(im.complete && im.naturalWidth > 0)).map(im => im.getAttribute('src'))); if (again.length) brokenAll.push(...again); }
  imgCount += imgs.length;
  if (deck === 'deck_c' && i === 2) {
    const nt = await notes.evaluate(() => ({ now: document.getElementById('nowTitle')?.textContent, next: document.getElementById('nextTitle')?.textContent, notes: document.getElementById('nowNotes')?.textContent }));
    c.ok(nt.now === 'The joy of stewardship' && /leadership/i.test(nt.notes || ''), `presenter view follows: now "${nt.now}"`);
    c.ok(nt.next && nt.next.length > 3, `presenter view: next "${nt.next}"`);
    await shot(notes, 'sc-notes');
  }
}
c.ok(slidesSeen === total, `every slide was shown once (${slidesSeen}/${total})`);
c.ok(imgCount > 100 && !brokenAll.length, `every photo loads (${imgCount} shown) ${brokenAll.slice(0, 5).join(', ')}`);
c.ok(creamSeen >= 8 && !toneWrong.length, `cream pages where marked (${creamSeen}), questions always navy ${toneWrong.join(', ')}`);

// BACK out of the step after a deck lands on that deck's last slide.
await pr.click('#prevBtn'); await sleep(900);          // card → deck_f, last slide
const back = await scene();
c.ok(back && parseInt(back.num, 10) === decks.deck_f, `back into a deck lands on its last slide (${back && back.num})`);
await pr.click('#prevBtn'); await sleep(600);
const back2 = await scene();
c.ok(back2 && parseInt(back2.num, 10) === decks.deck_f - 1, 'back again pages within the deck');

// The presenter view's Next drives the big screen.
await notes.click('#nNext'); await sleep(700);
const fwd = await scene();
c.ok(fwd && parseInt(fwd.num, 10) === decks.deck_f, 'the presenter view\'s Next pages the big screen');

// ?scenes=0 brings the Google decks back (the show-day escape hatch).
const plain = await presenter(browser, srv.url, '&scenes=0');
await plain.click('#nextBtn'); await sleep(500); await plain.click('#nextBtn'); await sleep(1200);
c.ok(await plain.$('iframe[src*="docs.google.com"]') && !(await plain.$('#scene')), '?scenes=0 brings the Google deck back');

const errs = [pr, ph, notes, plain].flatMap(p => p.errs);
c.ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));
await browser.close(); await srv.close();
console.log(c.fails.length ? `\nFAILED ${c.fails.length}: ${c.fails.join(' | ')}` : '\nALL PASS');
process.exit(c.fails.length ? 1 : 0);
