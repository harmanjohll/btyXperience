// The audit: every step and every slide of the show, as the audience sees it.
// For each one: frames at 0.1 s, 0.5 s, 1.5 s and 3 s (tests/out/audit/), the phone beside it, and
// automatic flags in tests/out/audit/audit.json:
//   overflow   text or boxes spilling out of the slide
//   overlap    two pieces of text on top of each other
//   crop       a photo shown cropped (object-fit: cover at the wrong proportions)
//   goldcream  gold text on a cream page
//   late       text still invisible at 0.6 s (diagrams that explain step by step are exempt)
// Usage: node tests/audit.mjs            (prints the flags; exits 1 if any)
//        V=2 node tests/audit.mjs        version 2 (v2.html, /x/v2.html) into tests/out/audit-v2/
//        ONLY=deck_b,deck_c node tests/audit.mjs   just those steps; TAG=after writes to audit-v2-after/
import fs from 'fs';
import path from 'path';
import { startServer } from './lib/server.mjs';
import { loadPlaywright, presenter, phone, board, sleep, until, OUT } from './lib/harness.mjs';

const V2 = process.env.V === '2', ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const DIR = path.join(OUT, 'audit' + (V2 ? '-v2' : '') + (process.env.TAG ? '-' + process.env.TAG : '')); fs.mkdirSync(DIR, { recursive: true });
const DOC = V2 ? 'session/v2' : 'session/state';
const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const pr = await presenter(browser, srv.url, '', V2 ? 'v2.html' : 'btx27.html');
const put = (p, data) => fetch(srv.url + '/__fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'set', path: p, data, merge: true }) });
const e = await until(() => srv.api.get(DOC)?.epoch, 4000);
const A = ['The Innovator', 'The Global Explorer', 'The Industry Trailblazer', 'The Community Steward', 'The Creative Artist', 'The STEM Futurist', 'The Voice Amplifier', 'The Eco-Strategist'];
for (let i = 0; i < 18; i++) await put('compassQuiz/a' + i, { e, archetype: A[i % 8], done: true, v: { dream_poll: i % 4 ? 1 : 0, cca: 2 }, n: { global: ['Hanoi', 'NZ', 'GeoBali'][i % 3], local: ['ASTAR', 'PIL'][i % 2] }, w: ['Engineer', 'Doctor', 'Artist'][i % 3], f: 8, boat: { launched: true }, m: { grow_value: i % 5, cca_family: i % 4 } });
const ph = await phone(browser, srv.url, 'phone', V2 ? '/x/v2.html' : '/x/'); await board(ph);

const plan = await pr.evaluate(() => { const out = []; let k = 0; while (true) { const id = (window.__stepId ? window.__stepId(k) : null); if (!id) break; out.push(id); k++; } return out; });
const decks = await pr.evaluate(() => Object.fromEntries(Object.entries(window.BTY_DECKS).map(([k, d]) => [k, d.slides.length])));
const flags = [];
const check = () => pr.evaluate(() => {
  const out = [], body = document.getElementById('scBody'), scene = document.getElementById('scene');
  const root = body || document.getElementById('journeyContent'); if (!root) return out;
  const R = (scene || root).getBoundingClientRect();
  const vis = el => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && el.getClientRects().length; };
  const textEls = [...root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,cite,b,small,em,figcaption,.eyebrow,.sc-meta,.tb-res,.pn-l')].filter(el => vis(el) && el.textContent.trim());
  // overflow: out of the slide, or clipped text
  textEls.forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.left < R.left - 2 || r.right > R.right + 2 || r.bottom > R.bottom + 2 || r.top < R.top - 2)) out.push({ k: 'overflow', t: el.textContent.trim().slice(0, 50) });
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push({ k: 'overflow', t: 'clipped: ' + el.textContent.trim().slice(0, 50) }); });
  // overlap: text on text (not nested; not a caption over its own photo)
  const blocks = [...root.querySelectorAll('h2,h3,h4,p,li,blockquote,.eyebrow,.sc-meta,.pn-l,.tb-box,.vn-q')].filter(el => vis(el) && el.textContent.trim() && !el.closest('figure'));
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) { const a = blocks[i], b = blocks[j]; if (a.contains(b) || b.contains(a)) continue;
    const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(); const w = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left), h = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
    if (w > 4 && h > 4 && w * h > .15 * Math.min(r1.width * r1.height, r2.width * r2.height)) out.push({ k: 'overlap', t: a.textContent.trim().slice(0, 30) + ' × ' + b.textContent.trim().slice(0, 30) }); }
  // crop: a photo drawn at the wrong proportions (round portraits and the blurred fills are on purpose)
  root.querySelectorAll('img').forEach(im => { if (!vis(im) || !im.naturalWidth || im.closest('.face,.round,.cl-screen,.cv-bg') || im.classList.contains('ph-blur')) return;   // round portraits, blurred fills and the two scenic cover backdrops are on purpose
    const cs = getComputedStyle(im); if (cs.objectFit !== 'cover') return; const r = im.getBoundingClientRect(); const a1 = r.width / r.height, a2 = im.naturalWidth / im.naturalHeight;
    const trim = im.closest('.fit-box') ? .2 : .08;   // laid out photos may lose a sliver (at most ~15%) to fill their box; screenshots marked whole never do
    if (Math.abs(a1 - a2) / a2 > trim) out.push({ k: 'crop', t: im.getAttribute('src') + (im.closest('.cv-bg') ? ' (full-bleed cover)' : '') }); });
  // gold on cream
  if (scene && scene.classList.contains('cream')) textEls.forEach(el => { const c = getComputedStyle(el).color; if (/255, 226, 0|255, 236, 102/.test(c)) out.push({ k: 'goldcream', t: el.textContent.trim().slice(0, 40) }); });
  return out;
});
const lateCheck = () => pr.evaluate(() => { const root = document.getElementById('scBody'); if (!root) return [];
  const step = '.cr-list li,.tb-col,.tb-col *,.tb-kid *,.mx-p,.mx-phase *,.arrive,.arrive *,.sl-col,.sl-col *,.st-marker,.sc-step,.sc-step *,.pn-l,.pn-l *,.vn-q,.vn-q *,.fly,.core';
  return [...root.querySelectorAll('h2,h3,p,li,b,span')].filter(el => el.textContent.trim() && !el.matches(step) && !el.closest(step)).filter(el => { let o = 1, n = el; while (n && n !== root) { o *= +getComputedStyle(n).opacity; n = n.parentElement; } return o < .5; }).map(el => ({ k: 'late', t: el.textContent.trim().slice(0, 40) })); });

let n = 0;
for (let k = 0; k < plan.length; k++) {
  const id = plan[k], slides = decks[id] || 1;
  if (ONLY.length && !ONLY.includes(id)) continue;
  for (let i = 0; i < slides; i++) {
    const name = `${String(k + 1).padStart(2, '0')}-${id}-${String(i + 1).padStart(2, '0')}`;
    await pr.evaluate(([id, i]) => window.__jump(id, i), [id, i]);
    const t0 = Date.now(); const at = async ms => { const w = ms - (Date.now() - t0); if (w > 0) await sleep(w); };
    await at(100); await pr.screenshot({ path: path.join(DIR, name + '-0100.png') });
    await at(500); await pr.screenshot({ path: path.join(DIR, name + '-0500.png') });
    await at(600); const late = await lateCheck();
    await at(1500); await pr.screenshot({ path: path.join(DIR, name + '-1500.png') });
    await at(3000); await pr.screenshot({ path: path.join(DIR, name + '-3000.png') });
    if (/^(deck_|values|funfact|chart|poll|memento|card)/.test(id) || decks[id]) { await sleep(id === 'deck_f' || id === 'deck_d' ? 6000 : 3500); }
    await pr.screenshot({ path: path.join(DIR, name + '-settled.png') });   // after every build and diagram has played
    const f = [...await check(), ...late];
    await ph.screenshot({ path: path.join(DIR, name + '-phone.png') });
    f.forEach(x => flags.push({ slide: name, ...x }));
    n++;
  }
}
fs.writeFileSync(path.join(DIR, 'audit.json'), JSON.stringify({ slides: n, flags }, null, 1));
console.log(`AUDIT · ${n} screens`);
const by = {}; flags.forEach(f => (by[f.k] = by[f.k] || []).push(f));
for (const k in by) { console.log(`  ${k}: ${by[k].length}`); by[k].slice(0, 12).forEach(f => console.log(`    ${f.slide}  ${f.t}`)); }
console.log('page errors', [...pr.errs, ...ph.errs]);
await browser.close(); await srv.close();
process.exit(flags.length || pr.errs.length ? 1 : 0);
