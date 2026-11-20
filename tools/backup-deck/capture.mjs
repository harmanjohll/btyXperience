// BACKUP DECK, step 1 of 2: record every slide of the show as a short video.
//
// The show is opened in a headless browser with a stand in database and no phones. The page is given a clock that
// this script steps by hand, one thirtieth of a second at a time, and a picture is taken at each step, so every
// animation is recorded exactly as the show plays it, however slow the machine. Each slide becomes: an .mp4 (its build), a .jpg (its first frame)
// and a .png (how it looks once built). build_pptx.py then puts them into a PowerPoint file.
//
//   node tools/backup-deck/capture.mjs                 everything, into tests/out/backup-deck/
//   node tools/backup-deck/capture.mjs --only deck_e   only items whose key starts with deck_e
//   node tools/backup-deck/capture.mjs --workers 3     how many browser pages record at once (default 3)
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { startServer } from '../../tests/lib/server.mjs';
import { loadPlaywright, until, sleep } from '../../tests/lib/harness.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('out', path.join(HERE, '../../tests/out/backup-deck')));
const ONLY = (arg('only', '') || '').split(',').filter(Boolean);
const WORKERS = +arg('workers', 3);
const FPS = 30, FRAME = 1000 / FPS;
const SETTLE = 36;                                   // this many identical frames in a row (1.2 s) = the slide has finished building
const MIN = { default: 75 };                         // never shorter than 2.5 s
const MAX = { default: 12, feast: 66, crest: 18, mix: 20, stairs: 18, loop: 18, mission: 18, slope: 18, tiebreak: 24, venn: 16, pins: 18 };   // seconds; slides that never stop moving are cut here
fs.mkdirSync(OUT, { recursive: true });

/* What the recording leaves out of the picture: the join code, the head count, the Back and Next buttons (there are
   no phones and no presenter in a PowerPoint file), the drifting specks behind the slide, and the vote counts. */
const HIDE = `#qrPill, #participantPill, #hivePulse, #liveBadge, #prevBtn, #nextBtn, #pollenCanvas, #toast,
  .votes-chip, .poll-wait, .poll-n { visibility: hidden !important }`;

/* Runs in the page before the show's own code.
   1. A clock that only moves when told to: timers, animation frames and "what time is it" all read it once it is
      started, so everything the show schedules happens at an exact moment of the recording.
   2. The browser's CSS animations follow the real clock regardless, so each one is paused and moved by hand to
      where it should be on the stepped clock. */
const IN_PAGE = () => {
  const realNow = performance.now.bind(performance), RealDateNow = Date.now.bind(Date);
  const real = { st: window.setTimeout.bind(window), ct: window.clearTimeout.bind(window), si: window.setInterval.bind(window), ci: window.clearInterval.bind(window), raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window) };
  let on = false, vnow = 0, v0 = 0, d0 = 0, seq = 1e9; const timers = new Map(); let rafs = new Map();
  performance.now = () => on ? vnow : realNow();
  Date.now = () => on ? d0 + (vnow - v0) : RealDateNow();
  window.setTimeout = (fn, ms, ...a) => { if (!on || typeof fn !== 'function') return real.st(fn, ms, ...a); const id = seq++; timers.set(id, { at: vnow + Math.max(0, +ms || 0), fn, a }); return id; };
  window.setInterval = (fn, ms, ...a) => { if (!on || typeof fn !== 'function') return real.si(fn, ms, ...a); const id = seq++; timers.set(id, { at: vnow + Math.max(1, +ms || 0), fn, a, every: Math.max(1, +ms || 0) }); return id; };
  window.clearTimeout = id => { if (!timers.delete(id)) real.ct(id); };
  window.clearInterval = id => { if (!timers.delete(id)) real.ci(id); };
  window.requestAnimationFrame = fn => { if (!on) return real.raf(fn); const id = seq++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = id => { if (!rafs.delete(id)) real.caf(id); };
  window.__clock = {
    start() { if (on) return; v0 = vnow = realNow(); d0 = RealDateNow(); on = true; },
    tick(ms) {
      const end = vnow + ms;
      for (let guard = 0; guard < 5000; guard++) {            // every timer that falls due in this step, in order
        let nextId = null, next = null; for (const [id, t] of timers) if (t.at <= end && (!next || t.at < next.at)) { next = t; nextId = id; }
        if (!next) break;
        vnow = Math.max(vnow, next.at);
        if (next.every) next.at += next.every; else timers.delete(nextId);
        try { next.fn(...next.a); } catch (e) { console.error(e); }
      }
      vnow = end;
      const run = rafs; rafs = new Map();                      // then one animation frame
      for (const fn of run.values()) { try { fn(vnow); } catch (e) { console.error(e); } }
    },
  };
  const born = new WeakMap(); let first = true;
  window.__sync = () => {
    const now = performance.now();
    for (const a of document.getAnimations()) {
      if (a.playState === 'idle') continue;
      let b = born.get(a);
      if (b === undefined) { const age = +a.currentTime || 0; b = now - (first ? age : Math.min(age, 20)); born.set(a, b); }   // seen for the first time: it began a moment ago
      try { if (a.playState !== 'paused') a.pause(); a.currentTime = now - b; } catch (e) {}
    }
    first = false;
  };
  // "Live poll" reads oddly with no phones in the room.
  const fix = () => document.querySelectorAll('.eyebrow, .poll-eyebrow, [class*="eyebrow"]').forEach(e => { if (/^\s*Live Poll/i.test(e.textContent) && !e.children.length) e.textContent = e.textContent.replace(/Live Poll/i, 'Show of hands'); });
  document.addEventListener('DOMContentLoaded', () => { new MutationObserver(fix).observe(document.documentElement, { childList: true, subtree: true }); fix(); });
};

/* The running order: every slide of every deck, the fun fact, the value cards (one press per card), and each quiz
   as a question followed by its answer. Steps that only make sense with phones are left out. */
const PLAN = async () => {
  // The show keeps its step list to itself, so it is read from the page's own source: each step's id and type, in order.
  const src = await (await fetch('index.html')).text(), steps = [];
  for (const m of src.matchAll(/^\s*\{ id:'(\w+)', type:'(\w+)'(.*)$/gm)) { const k = window.__stepIndex(m[1]); if (k >= 0) steps[k] = { id: m[1], type: m[2], rest: m[3] }; }
  const txt = (rest, key) => { const m = rest.match(new RegExp(key + ':\\s*"([^"]*)"')); return m ? m[1].replace(/\\u00A0/g, ' ') : ''; };
  const out = [];
  for (const st of steps.filter(Boolean)) {
    const d = window.BTY_DECKS[st.id];
    if (d) { d.slides.forEach((s, i) => { if (s.kind === 'live' || s.kind === 'ask' || /^One last fold/.test(s.title || '')) return;
        out.push({ key: `${st.id}-${String(i + 1).padStart(2, '0')}`, kind: s.kind, title: s.title || s.quote || s.kind, notes: (s.notes || '').replace(/\s*\[confirm\][^.]*\.?/g, '').trim(), go: { t: 'jump', id: st.id, i } }); }); continue; }
    if (st.type === 'video') out.push({ key: st.id, kind: 'video', placeholder: true, title: 'Video', url: 'https://www.youtube.com/watch?v=' + ((st.rest || '').match(/embed\/([\w-]+)/) || [])[1] });
    if (st.type === 'funfact') out.push({ key: st.id, kind: 'funfact', title: `${txt(st.rest, 'number')} ${txt(st.rest, 'label')}`, notes: '', go: { t: 'jump', id: st.id, i: 0 } });
    if (st.type === 'values') { const title = txt(st.rest, 'title'); st.title = title; out.push({ key: st.id + '-0', kind: 'values', title: st.title, notes: 'The five values. Each of the next five presses turns one card over.', go: { t: 'jump', id: st.id, i: 0 } });
      for (let n = 0; n < 5; n++) out.push({ key: `${st.id}-${n + 1}`, kind: 'values', title: `${st.title} (${'DREAM'[n]})`, notes: '', go: { t: 'card', n } }); }
    if (st.type === 'poll') { const title = txt(st.rest, 'title').replace(/^Live Poll\s*·\s*/, 'Quiz: ');
      out.push({ key: st.id + '-q', kind: 'poll', title, notes: 'Ask for a show of hands. The next press shows the answer.', go: { t: 'jump', id: st.id, i: 0 } });
      out.push({ key: st.id + '-a', kind: 'poll', title: title + ' (answer)', notes: 'The answer.', go: { t: 'next' } }); }
  }
  return out;
};
const TRIGGER = go => {
  if (go.t === 'jump') return window.__jump(go.id, go.i);
  if (go.t === 'next') return document.getElementById('nextBtn').click();
  if (go.t === 'card') return document.querySelectorAll('.dcard')[go.n].click();
};

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();

async function openShow() {
  const srv = await startServer();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(IN_PAGE);
  await page.goto(srv.url + '/index.html?presenter=true', { waitUntil: 'domcontentloaded' });
  await until(() => page.evaluate(() => !!window.BTY_DECKS && typeof window.__jump === 'function' && !document.getElementById('beginBtn')?.disabled).catch(() => false), 10000); await sleep(1500);
  await page.addStyleTag({ content: HIDE });
  await page.click('#beginBtn'); await sleep(1800);
  // Every photo is fetched before the clock is taken over, so none arrives late in a recording.
  await page.evaluate(async () => { const srcs = new Set(); JSON.stringify(window.BTY_DECKS, (k, v) => { if (typeof v === 'string' && /^[\w./-]+\.(jpe?g|png|webp|svg|gif)$/i.test(v)) srcs.add('deck/img/' + v.replace(/^\/+/, '')); return v; });
    await Promise.all([...srcs].map(u => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = u; }))); });
  const cdp = await ctx.newCDPSession(page);
  await page.evaluate(() => { window.__clock.start(); window.__sync(); });
  const step = () => page.evaluate(ms => { window.__clock.tick(ms); window.__sync(); }, FRAME);
  return { srv, ctx, page, cdp, step, errs };
}

async function record(show, item) {
  const { page, cdp, step } = show, base = path.join(OUT, item.key);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-level', '4.1',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-g', '30', '-movflags', '+faststart', '-r', String(FPS), base + '.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(res => ff.on('close', res));
  await page.evaluate(TRIGGER, item.go); await page.evaluate(() => window.__sync());
  const max = (MAX[item.kind] || MAX.default) * FPS, min = MIN.default; let n = 0, same = 0, prev = ''; const tR = Date.now();
  while (n < max) {
    await step();
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, optimizeForSpeed: true });
    const buf = Buffer.from(data, 'base64');
    if (n === 0) fs.writeFileSync(base + '.jpg', buf);
    if (!ff.stdin.write(buf)) await new Promise(res => ff.stdin.once('drain', res));
    same = data === prev ? same + 1 : 0; prev = data; n++;
    if (process.env.TIMING && n % 30 === 0) console.log(`      ${item.key} frame ${n} at ${Date.now() - tR} ms, same ${same}`);
    if (n >= min && same >= SETTLE) break;
  }
  ff.stdin.end(); await done;
  const still = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(base + '.png', Buffer.from(still.data, 'base64'));
  return { frames: n, seconds: +(n / FPS).toFixed(2), settled: same >= SETTLE };
}

// The plan, from one page; then the work is shared out in runs of neighbouring slides.
const first = await openShow();
const plan = await first.page.evaluate(PLAN);
await first.ctx.close(); await first.srv.close();
const wanted = plan.map((it, k) => ({ ...it, k })).filter(it => !ONLY.length || ONLY.some(o => it.key.startsWith(o)));
const todo = wanted.filter(it => !it.placeholder);
const per = Math.ceil(todo.length / WORKERS), chunks = []; for (let i = 0; i < todo.length; i += per) chunks.push(todo.slice(i, i + per));
console.log(`${plan.length} slides in the backup deck; recording ${todo.length} with ${chunks.length} page(s)`);
const results = {}; const t0 = Date.now();
await Promise.all(chunks.map(async (chunk, w) => {
  const show = await openShow(); let last = -2;
  for (const it of chunk) {
    // Start from where the slide before it ended, as it would in the show (replayed without recording when needed).
    if (it.go.t !== 'jump' && last !== it.k - 1) { let j = it.k; while (plan[j].go?.t !== 'jump') j--; for (; j < it.k; j++) { await show.page.evaluate(TRIGGER, plan[j].go); for (let f = 0; f < 150; f++) await show.step(); } }
    const r = await record(show, it); results[it.key] = r; last = it.k;
    console.log(`  [${w + 1}] ${it.key.padEnd(22)} ${String(r.seconds).padStart(5)} s ${r.settled ? '' : '(cut at its limit)'}  ${it.title.slice(0, 50)}`);
  }
  if (show.errs.length) console.log('  page errors:', show.errs.slice(0, 3));
  await show.ctx.close(); await show.srv.close();
}));
await browser.close();
// The manifest keeps earlier results for slides that were not recorded again this time.
const mf = path.join(OUT, 'manifest.json'); let old = {}; try { for (const it of JSON.parse(fs.readFileSync(mf, 'utf8')).items) old[it.key] = it; } catch (e) {}
const items = plan.map(it => ({ key: it.key, kind: it.kind, title: it.title, notes: it.notes || '', placeholder: !!it.placeholder, url: it.url || '', ...(results[it.key] || (old[it.key] ? { frames: old[it.key].frames, seconds: old[it.key].seconds, settled: old[it.key].settled } : {})) }));
fs.writeFileSync(mf, JSON.stringify({ made: new Date().toISOString(), fps: FPS, items }, null, 1));
console.log(`done in ${Math.round((Date.now() - t0) / 1000)} s: ${OUT}`);
