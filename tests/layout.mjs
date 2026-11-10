// Layout check for version 2: every slide measured against the show's layout standard.
//   balance   content sits centred in the space under the title (top and bottom gaps within 60 px)
//   fill      content uses the space it has (at least 60% of the free height, unless a statement)
//   band      no empty horizontal band over 170 px inside the content area
//   edge      nothing within 16 px of the slide frame or the roadmap below it
//   type      no visible text smaller than 20 px at 1080p
// Usage: node tests/layout.mjs        (writes tests/out/layout-v2.json, prints the flags; exits 1 if any)
//        ONLY=deck_b,deck_c node tests/layout.mjs
import fs from 'fs';
import path from 'path';
import { startServer } from './lib/server.mjs';
import { loadPlaywright, presenter, sleep, until, OUT } from './lib/harness.mjs';

const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const { chromium } = await loadPlaywright();
const srv = await startServer();
const browser = await chromium.launch({ headless: true });
const pr = await presenter(browser, srv.url, '', 'v2.html');
await until(() => srv.api.get('session/v2')?.epoch, 4000);
const decks = await pr.evaluate(() => Object.fromEntries(Object.entries(window.BTY_DECKS).map(([k, d]) => [k, d.slides.map(s => s.kind)])));
const LONG = new Set(['mission', 'loop', 'stairs', 'crest', 'tiebreak', 'mix', 'slope', 'venn', 'pins']);
const OPEN = new Set(['statement', 'quote', 'cover', 'photo', 'ask', 'live']);   // meant to breathe

const measure = () => pr.evaluate(() => {
  const body = document.getElementById('scBody'), scene = document.getElementById('scene'), foot = document.querySelector('footer');
  if (!body) return null;
  const B = body.getBoundingClientRect(), S = scene.getBoundingClientRect(), F = foot.getBoundingClientRect();
  const vis = el => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; let o = 1, n = el; while (n && n !== body.parentElement) { o *= +getComputedStyle(n).opacity; n = n.parentElement; } return o > .5 && el.getClientRects().length; };
  const title = body.querySelector('.sc-t');
  const T = title && vis(title) ? title.getBoundingClientRect() : null;
  const parts = [...body.querySelectorAll('h2.sc-h,h2.cv-h,.sc-logo,h3,h4,p,li,blockquote,cite,figure,.lp-ring,.ms-disc,.ms-ico,.ms-row,.st2-svg path,.st2-svg rect,.st2-svg text,.sc-row,.pp,.lg,.lk,.qs-card,.tb-kid,.tb-box,.mx-box,.sc-stat,.sc-let,.sc-step,.rx-k,.rx-c,.vn-c,.vn-q,table,.sc-slope,.pn-map,.cr-img,.sc-card,.sc-pill,svg.sc-slope text,.day-bar')]
    .filter(el => el !== title && !(title && title.contains(el)) && vis(el)).map(el => el.getBoundingClientRect()).filter(r => r.width > 2 && r.height > 2);
  const text = [...body.querySelectorAll('h2,h3,h4,p,li,b,span,em,cite,figcaption,text,td,th')].filter(el => el.textContent.trim() && vis(el) && !el.children.length);
  const minFont = text.length ? Math.min(...text.map(el => parseFloat(getComputedStyle(el).fontSize) * (el.closest('.stage') ? (el.closest('.stage').getBoundingClientRect().width / el.closest('.stage').offsetWidth) : 1))) : 0;
  if (!parts.length) return { empty: true };
  const U = { top: Math.min(...parts.map(r => r.top)), bottom: Math.max(...parts.map(r => r.bottom)), left: Math.min(...parts.map(r => r.left)), right: Math.max(...parts.map(r => r.right)) };
  const top0 = T ? T.bottom : B.top, free = B.bottom - top0;
  let band = 0, run = 0; for (let y = U.top; y < U.bottom; y += 4) { const hit = parts.some(r => r.top <= y && r.bottom >= y); run = hit ? 0 : run + 4; band = Math.max(band, run); }
  return { gapTop: Math.round(U.top - top0), gapBottom: Math.round(B.bottom - U.bottom), fill: +((U.bottom - U.top) / free).toFixed(2), width: +((U.right - U.left) / B.width).toFixed(2), band,
    edge: Math.round(Math.min(U.left - S.left, S.right - U.right, F.top - U.bottom)), minFont: Math.round(minFont) };
});

const rows = [], flags = [];
for (const [id, kinds] of Object.entries(decks)) {
  if (ONLY.length && !ONLY.includes(id)) continue;
  for (let i = 0; i < kinds.length; i++) {
    await pr.evaluate(([id, i]) => window.__jump(id, i), [id, i]);
    await sleep(LONG.has(kinds[i]) ? 9000 : 4200);
    const m = await measure(); if (!m) continue;
    const name = `${id} ${i + 1} ${kinds[i]}`; rows.push({ name, ...m });
    if (m.empty) continue;
    const bleed = kinds[i] === 'cover' || kinds[i] === 'photo';
    const why = [];
    if (!bleed && Math.abs(m.gapTop - m.gapBottom) > 60) why.push(`balance ${m.gapTop}/${m.gapBottom}`);
    if (!bleed && !OPEN.has(kinds[i]) && m.fill < .6) why.push(`fill ${m.fill}`);
    if (!bleed && m.band > 170) why.push(`band ${m.band}`);
    if (!bleed && m.edge < 16) why.push(`edge ${m.edge}`);
    if (m.minFont && m.minFont < 20) why.push(`type ${m.minFont}px`);
    if (why.length) flags.push(`${name}: ${why.join(', ')}`);
  }
}
fs.writeFileSync(path.join(OUT, 'layout-v2.json'), JSON.stringify(rows, null, 1));
console.log(`LAYOUT · ${rows.length} slides`);
flags.forEach(f => console.log('  ✗ ' + f));
console.log(flags.length ? `\n${flags.length} flagged` : '\nALL PASS');
await browser.close(); await srv.close();
process.exit(flags.length ? 1 : 0);
