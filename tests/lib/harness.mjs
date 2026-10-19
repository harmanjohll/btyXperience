// Shared helpers: browser, presenter and phone pages, gestures, checks, screenshots.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.resolve(HERE, '../out');
fs.mkdirSync(OUT, { recursive: true });

export async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) {}
  for (const base of ['/opt/node22/lib/node_modules/', '/usr/local/lib/node_modules/', '/usr/lib/node_modules/']) {
    try { return createRequire(base)('playwright'); } catch (e) {}
  }
  throw new Error('Playwright not found — npm i -D playwright');
}

export function checker(name) {
  const fails = [], passes = [];
  const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); (cond ? passes : fails).push(msg); return !!cond; };
  return { ok, fails, passes, name };
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function until(fn, ms = 8000, step = 120) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = await fn(); if (v) return v; } catch (e) {} await sleep(step); } return null; }

export async function newPage(browser, { width, height, label, mobile = false }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: false });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', e => page.errs.push(`[${label}] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource|youtube|google/i.test(m.text())) page.errs.push(`[${label} console] ${m.text()}`); });
  page.label = label;
  return page;
}

export async function shot(page, name) { await page.screenshot({ path: path.join(OUT, name + '.png') }); }

/* ---------- presenter ---------- */
export async function presenter(browser, base) {
  const p = await newPage(browser, { width: 1920, height: 1080, label: 'presenter' });
  await p.goto(base + '/btx27.html?presenter=true', { waitUntil: 'domcontentloaded' });
  await until(() => p.evaluate(() => typeof dbReady !== 'undefined' ? dbReady : false).catch(() => false), 10000);
  await p.click('#beginBtn');
  await p.waitForTimeout(500);
  return p;
}
export async function stepNum(p) { const t = await p.$eval('#progText', e => e.textContent).catch(() => ''); const m = t.match(/Step\s+(\d+)/i); return m ? +m[1] : -1; }
export async function goStep(p, n) {
  for (let i = 0; i < 80; i++) {
    const c = await stepNum(p); if (c >= n) break;
    await p.click('#nextBtn');
    await until(async () => (await stepNum(p)) !== c, 2500, 60);   // a reveal press keeps the step; the next press moves on
  }
  await p.waitForTimeout(600);
  return stepNum(p);
}

/* ---------- phone ---------- */
export async function phone(browser, base, label) {
  const p = await newPage(browser, { width: 390, height: 844, label, mobile: false });   // mouse gestures drive the fold code; hasTouch would switch it to touch-only
  await p.goto(base + '/x/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  return p;
}
export async function board(p, picks = [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0]]) {
  await p.waitForSelector('#boardBtn', { timeout: 8000 });
  await p.click('#boardBtn'); await p.waitForTimeout(400);
  for (const [a, b] of picks) { await p.click(`.quiz-opt[data-i="${a}"]`); await p.waitForTimeout(150); await p.click(`.quiz-opt[data-i="${b}"]`); await p.waitForTimeout(520); }
  await p.waitForTimeout(3200);
}
export const phoneState = p => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('btySail_v7') || '{}'); } catch (e) { return {}; } });
export const appHTML = p => p.evaluate(() => document.getElementById('app').innerHTML);

async function drag(p, sx, sy, ex, ey, N = 22) {
  await p.mouse.move(sx, sy); await p.mouse.down();
  for (let i = 1; i <= N; i++) { const t = i / N; await p.mouse.move(sx + (ex - sx) * t, sy + (ey - sy) * t); await p.waitForTimeout(22); }
  await p.waitForTimeout(80); await p.mouse.up();
}
// One fold: drag the corner dot to its target, then run a finger along the crease.
export async function fold(p) {
  await p.waitForSelector('#origamiStage .fold-overlay', { timeout: 6000 });
  await p.waitForTimeout(250);                      // (foldTo already let the fade-up finish)
  const g1 = await p.evaluate(() => { const st = document.getElementById('origamiStage'); const ov = st.querySelector('.fold-overlay'); const dot = st.querySelector('.fold-dot'); const tgt = st.querySelector('.fold-target'); const r = ov.getBoundingClientRect(); return { left: r.left, top: r.top, fx: parseFloat(dot.style.left), fy: parseFloat(dot.style.top), tx: parseFloat(tgt.style.left), ty: parseFloat(tgt.style.top) }; });
  await drag(p, g1.left + g1.fx, g1.top + g1.fy, g1.left + g1.tx, g1.top + g1.ty); await p.waitForTimeout(220);
  await p.waitForSelector('.crease-overlay', { timeout: 6000 });
  const g2 = await p.evaluate(() => { const ov = document.querySelector('.crease-overlay'); const hand = ov.querySelector('.crease-hand'); const g = ov.querySelector('.crease-guide-line'); const r = ov.getBoundingClientRect(); return { left: r.left, top: r.top, x1: parseFloat(hand.style.left), y1: parseFloat(hand.style.top), gx2: parseFloat(g.getAttribute('x2')), gy2: parseFloat(g.getAttribute('y2')) }; });
  await drag(p, g2.left + g2.x1, g2.top + g2.y1, g2.left + g2.gx2, g2.top + g2.gy2);
}
export async function waitFold(p, n, ms = 8000) { return until(async () => ((await phoneState(p)).nextFold || 0) >= n, ms, 150); }
// Fold until the phone's boat reaches `n` folds (handles the pull-open on the last one).
export async function foldTo(p, n) {
  for (let guard = 0; guard < 6; guard++) {
    const cur = (await phoneState(p)).nextFold || 0; if (cur >= n) return true;
    if (!(await p.$('#origamiStage .fold-overlay'))) { await p.waitForTimeout(500); continue; }
    await p.waitForTimeout(750);
    if (await p.$('.pull-dot') && !(await p.$('.fold-dot'))) { await pullOpen(p); await waitFold(p, cur + 1, 8000); continue; }
    await fold(p); await waitFold(p, cur + 1, 6000);
  }
  return ((await phoneState(p)).nextFold || 0) >= n;
}
export async function pullOpen(p) {
  const r = await p.evaluate(() => { const d = document.querySelector('.pull-dot.r') || document.querySelector('.pull-dot'); if (!d) return null; const b = d.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  if (!r) return false;
  await drag(p, r.x, r.y, r.x + 140, r.y, 18); return true;      // pull the boat open sideways
}

/* ---------- write the show's saved state directly (phone-only walks) ---------- */
export async function setState(base, data) {
  await fetch(base + '/__fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'set', path: 'session/state', data: { ts: Date.now(), sts: { __st: 1 }, ...data } }) });
}
