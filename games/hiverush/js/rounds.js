/* HIVE RUSH round mechanics (player side). Each round type renders into an element and
   reports one result: { pts, ok, v, ms, detail }. Scoring is generous: effort always earns honey. */
(function () {
  const FX = HR.FX, esc = FX.esc;
  const TILES = [
    { cls: 't-yellow', shape: 'hex' }, { cls: 't-red', shape: 'tri' },
    { cls: 't-white', shape: 'dot' }, { cls: 't-blue', shape: 'sq' },
  ];
  const SHAPES = {
    hex: '<svg viewBox="0 0 24 24"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"/></svg>',
    tri: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/></svg>',
    dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
    sq: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  };
  HR.TILES = TILES; HR.SHAPES = SHAPES;

  /* ---------- honey timer ---------- */
  function Timer(host, limitSec, onEnd) {
    host.innerHTML = '<div class="timer"><div class="timer-fill"></div><div class="timer-num"></div></div>';
    const fill = host.querySelector('.timer-fill'), num = host.querySelector('.timer-num');
    const t0 = performance.now(), L = limitSec * 1000; let last = -1, raf = 0, done = false;
    function f(t) {
      const left = Math.max(0, L - (t - t0)); const s = Math.ceil(left / 1000);
      fill.style.transform = 'scaleX(' + (left / L) + ')';
      if (s !== last) {
        last = s; num.textContent = s;
        if (s <= 5 && s > 0) { FX.sfx.tick(s <= 3); host.firstChild.classList.add('urgent'); }
      }
      if (left <= 0) { if (!done) { done = true; onEnd && onEnd(); } return; }
      raf = requestAnimationFrame(f);
    }
    raf = requestAnimationFrame(f);
    return { elapsed: () => performance.now() - t0, stop() { done = true; cancelAnimationFrame(raf); host.firstChild && host.firstChild.classList.add('stopped'); } };
  }
  HR.Timer = Timer;

  const speed = (ms, limitMs) => Math.max(0, 1 - ms / limitMs);
  // a finished round celebrates for a moment; a timed out one reports at once (sync), so a
  // forced end at reveal time still captures the partial answer
  const later = (fn, d) => (d ? setTimeout(fn, d) : fn());

  /* ---------- scoring (pure, so the host and tests can reuse it) ---------- */
  HR.Score = {
    mcq(r, idx, ms) { const ok = idx === r.answer; const m = r.golden ? 2 : 1; return { ok, pts: ok ? Math.round((500 + 500 * speed(ms, r.limit * 1000)) * m) : 0 }; },
    mythfact(r, marks, ms, complete) {
      const right = marks.filter(Boolean).length;
      const bonus = complete ? Math.round(160 * speed(ms, r.limit * 1000) * (right / r.cards.length)) : 0;
      return { ok: right === r.cards.length, pts: right * 280 + bonus };
    },
    slider(r, val) { const d = Math.abs(val - r.answer); return { ok: d <= r.okWithin, pts: Math.round(1000 * Math.max(0, 1 - d / 40)) }; },
    order(r, filled, mistakes, ms, complete) {
      if (!complete) return { ok: false, pts: Math.max(0, filled * 120 - mistakes * 40) };
      return { ok: true, pts: Math.max(150, Math.round(1000 - 600 * (ms / (r.limit * 1000))) - 120 * mistakes) };
    },
    hunt(r, found, wrong, ms, complete) {
      const bonus = complete ? Math.round(300 * speed(ms, r.limit * 1000)) : 0;
      return { ok: complete, pts: Math.max(0, found * 140 - wrong * 80 + bonus) };
    },
    streakBonus(streak) { return streak >= 2 ? Math.min(300, (streak - 1) * 100) : 0; },
  };

  /* ---------- the five mechanics ---------- */
  const R = {};

  R.mcq = function (el, r, api) {
    el.innerHTML = `<div class="q-prompt">${esc(r.prompt)}</div>
      <div class="mcq">${r.options.map((o, i) => `
        <button class="tile ${TILES[i].cls}" data-i="${i}">
          <span class="tile-shape">${SHAPES[TILES[i].shape]}</span>
          <span class="tile-emoji">${o.e || ''}</span>
          <span class="tile-text">${esc(o.t)}</span>
        </button>`).join('')}</div>`;
    let done = false;
    el.querySelectorAll('.tile').forEach(b => b.addEventListener('pointerdown', e => {
      if (done) return; done = true; e.preventDefault();
      const i = +b.dataset.i; const ms = api.elapsed();
      b.classList.add('chosen'); el.querySelector('.mcq').classList.add('decided');
      FX.sfx.lock(); FX.vib(30);
      const s = HR.Score.mcq(r, i, ms);
      setTimeout(() => api.done({ pts: s.pts, ok: s.ok, v: i, ms }), 380);
    }));
    return { timeUp() { if (!done) { done = true; api.done({ pts: 0, ok: false, v: null, ms: r.limit * 1000, timeout: true }); } } };
  };

  R.mythfact = function (el, r, api) {
    el.innerHTML = `<div class="mf">
      <div class="mf-count"><span>1</span> / ${r.cards.length}</div>
      <div class="mf-stack"></div>
      <div class="mf-btns">
        <button class="mf-btn mf-myth" data-a="0"><b>✗</b> MYTH</button>
        <button class="mf-btn mf-fact" data-a="1">FACT <b>✓</b></button>
      </div>
      <div class="mf-hint">Swipe the card, or tap a button</div></div>`;
    const stack = el.querySelector('.mf-stack'); const marks = []; let idx = 0, busy = false, finished = false;
    r.cards.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'mf-card'; d.style.zIndex = 10 - i;
      d.style.setProperty('--i', i);
      d.innerHTML = `<div class="mf-tag">CARD ${i + 1}</div><div class="mf-text">${esc(c.t)}</div>
        <div class="mf-stamp s-fact">FACT</div><div class="mf-stamp s-myth">MYTH</div>`;
      stack.appendChild(d);
    });
    const cards = [...stack.children];
    function finish(complete) {
      if (finished) return; finished = true; const ms = api.elapsed();
      while (marks.length < r.cards.length) marks.push(false);
      const s = HR.Score.mythfact(r, marks, ms, complete);
      later(() => api.done({ pts: s.pts, ok: s.ok, v: marks.filter(Boolean).length, detail: marks, ms }), complete ? 650 : 0);
    }
    function answer(isFact) {
      if (busy || finished || idx >= cards.length) return; busy = true;
      const card = cards[idx], right = isFact === r.cards[idx].fact; marks.push(right);
      card.classList.add(isFact ? 'go-right' : 'go-left', right ? 'right' : 'wrong');
      card.style.transform = '';
      const flash = document.createElement('div'); flash.className = 'mf-flash ' + (right ? 'ok' : 'no');
      flash.textContent = right ? '✓' : '✗'; el.querySelector('.mf').appendChild(flash);
      setTimeout(() => flash.remove(), 700);
      right ? (FX.sfx.good(), FX.vib(25)) : (FX.sfx.bad(), FX.vib([40, 40, 40]));
      idx++;
      setTimeout(() => {
        busy = false; card.remove();
        if (idx >= cards.length) finish(true); else el.querySelector('.mf-count span').textContent = idx + 1;
      }, 420);
    }
    el.querySelectorAll('.mf-btn').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); answer(b.dataset.a === '1'); }));
    // swipe
    let sx = 0, dx = 0, drag = null;
    stack.addEventListener('pointerdown', e => {
      const c = cards[idx]; if (!c || busy || !c.contains(e.target)) return;
      drag = c; sx = e.clientX; dx = 0; c.setPointerCapture(e.pointerId); c.classList.add('dragging');
    });
    stack.addEventListener('pointermove', e => {
      if (!drag) return; dx = e.clientX - sx;
      drag.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
      drag.classList.toggle('lean-right', dx > 30); drag.classList.toggle('lean-left', dx < -30);
    });
    const end = () => {
      if (!drag) return; const c = drag; drag = null; c.classList.remove('dragging', 'lean-left', 'lean-right');
      if (Math.abs(dx) > Math.min(110, stack.clientWidth * 0.22)) answer(dx > 0); else c.style.transform = '';
    };
    stack.addEventListener('pointerup', end); stack.addEventListener('pointercancel', end);
    return { timeUp() { finish(false); } };
  };

  R.slider = function (el, r, api) {
    let val = r.start, locked = false;
    el.innerHTML = `<div class="q-prompt">${esc(r.prompt)}</div>
      <div class="sl">
        <div class="sl-big"><span class="sl-num">${val}</span><small>${esc(r.unit)}</small></div>
        <div class="sl-people" aria-hidden="true"></div>
        <div class="sl-row">
          <button class="sl-nudge" data-d="-1">−</button>
          <div class="sl-track"><div class="sl-fill"></div><div class="sl-thumb">🐝</div></div>
          <button class="sl-nudge" data-d="1">+</button>
        </div>
        <button class="btn btn-go sl-lock">LOCK IT IN</button>
      </div>`;
    const track = el.querySelector('.sl-track'), fill = el.querySelector('.sl-fill'), thumb = el.querySelector('.sl-thumb'),
      num = el.querySelector('.sl-num'), people = el.querySelector('.sl-people');
    people.innerHTML = Array.from({ length: 20 }, () => '<i></i>').join('');
    const dots = [...people.children];
    function set(v, haptic) {
      v = Math.max(r.min, Math.min(r.max, Math.round(v)));
      if (v === val && haptic) return; const prev = val; val = v;
      const k = (v - r.min) / (r.max - r.min);
      fill.style.width = k * 100 + '%'; thumb.style.left = k * 100 + '%'; num.textContent = v;
      const lit = Math.round(v / 5); dots.forEach((d, i) => d.classList.toggle('on', i < lit));
      if (haptic && Math.floor(prev / 5) !== Math.floor(v / 5)) { FX.sfx.key(); FX.vib(8); }
    }
    set(val);
    let dragging = false;
    const fromX = x => { const b = track.getBoundingClientRect(); return r.min + (x - b.left) / b.width * (r.max - r.min); };
    track.addEventListener('pointerdown', e => { if (locked) return; dragging = true; track.setPointerCapture(e.pointerId); set(fromX(e.clientX), true); });
    track.addEventListener('pointermove', e => { if (dragging && !locked) set(fromX(e.clientX), true); });
    const stop = () => { dragging = false; };
    track.addEventListener('pointerup', stop); track.addEventListener('pointercancel', stop);
    el.querySelectorAll('.sl-nudge').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); if (!locked) { set(val + +b.dataset.d); FX.sfx.key(); } }));
    function lock(timeout) {
      if (locked) return; locked = true; el.querySelector('.sl').classList.add('locked');
      const ms = api.elapsed(); const s = HR.Score.slider(r, val);
      if (!timeout) { FX.sfx.lock(); FX.vib(30); }
      later(() => api.done({ pts: s.pts, ok: s.ok, v: val, ms, timeout: !!timeout }), timeout ? 0 : 350);
    }
    el.querySelector('.sl-lock').addEventListener('click', () => lock(false));
    return { timeUp() { lock(true); } };
  };

  R.order = function (el, r, api) {
    const letters = r.word.split('');
    const pool = FX.shuffle(r.items.map((t, i) => ({ t, i })));
    el.innerHTML = `<div class="q-prompt">${esc(r.prompt)}</div>
      <div class="ord">
        <div class="ord-slots">${letters.map((L, i) => `<div class="ord-slot" data-i="${i}"><b>${L}</b><span></span></div>`).join('')}</div>
        <div class="ord-pool">${pool.map(p => `<button class="ord-tile" data-i="${p.i}"><b>${esc(p.t[0])}</b>${esc(p.t.slice(1))}</button>`).join('')}</div>
      </div>`;
    let next = 0, mistakes = 0, finished = false;
    const slots = el.querySelectorAll('.ord-slot');
    slots[0].classList.add('next');
    function finish(complete) {
      if (finished) return; finished = true; const ms = api.elapsed();
      const s = HR.Score.order(r, next, mistakes, ms, complete);
      later(() => api.done({ pts: s.pts, ok: s.ok, v: complete ? ms : null, detail: { filled: next, mistakes }, ms }), complete ? 600 : 0);
    }
    el.querySelectorAll('.ord-tile').forEach(b => b.addEventListener('pointerdown', e => {
      e.preventDefault(); if (finished || b.classList.contains('used')) return;
      if (+b.dataset.i === next) {
        b.classList.add('used'); const s = slots[next]; s.classList.remove('next'); s.classList.add('filled');
        s.querySelector('span').textContent = r.items[next];
        FX.sfx.pop(); FX.vib(15); next++;
        if (next >= letters.length) { FX.sfx.good(); el.querySelector('.ord').classList.add('done'); finish(true); }
        else slots[next].classList.add('next');
      } else {
        mistakes++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); FX.sfx.buzz(); FX.vib([30, 30, 30]);
      }
    }));
    return { timeUp() { finish(false); } };
  };

  R.hunt = function (el, r, api) {
    const items = FX.shuffle([...r.targets.map(t => ({ t, real: true })), ...r.decoys.map(t => ({ t, real: false }))]);
    el.innerHTML = `<div class="q-prompt">${esc(r.prompt)}</div>
      <div class="hunt-bar"><span class="hunt-found">0</span> / ${r.targets.length} found</div>
      <div class="hunt">${items.map((it, i) => `<button class="bub" data-i="${i}"><span>${esc(it.t)}</span></button>`).join('')}</div>`;
    const arena = el.querySelector('.hunt'), bubs = [...arena.children];
    let found = 0, wrong = 0, finished = false, raf = 0;
    let W = 0, H = 0;
    const st = bubs.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, gone: false }));
    function layout() {
      W = arena.clientWidth; H = arena.clientHeight;
      const cols = W > H ? 4 : 2, rows = Math.ceil(bubs.length / cols);
      bubs.forEach((b, i) => {
        const s = st[i]; s.w = b.offsetWidth; s.h = b.offsetHeight;
        if (!s.placed) {
          const c = i % cols, rr = Math.floor(i / cols);
          s.x = (c + 0.5) * (W / cols) - s.w / 2 + (Math.random() - 0.5) * 20;
          s.y = (rr + 0.5) * (H / rows) - s.h / 2 + (Math.random() - 0.5) * 20;
          const a = Math.random() * Math.PI * 2, sp = FX.reduceMotion ? 0.12 : 0.45 + Math.random() * 0.35;
          s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp; s.placed = true;
        }
      });
    }
    function tick() {
      st.forEach((s, i) => {
        if (s.gone) return;
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) { s.x = 0; s.vx = Math.abs(s.vx); } if (s.x > W - s.w) { s.x = W - s.w; s.vx = -Math.abs(s.vx); }
        if (s.y < 0) { s.y = 0; s.vy = Math.abs(s.vy); } if (s.y > H - s.h) { s.y = H - s.h; s.vy = -Math.abs(s.vy); }
        bubs[i].style.transform = `translate(${s.x}px, ${s.y}px)`;
      });
      raf = requestAnimationFrame(tick);
    }
    requestAnimationFrame(() => { layout(); tick(); });
    const onResize = () => layout(); addEventListener('resize', onResize);
    function finish(complete) {
      if (finished) return; finished = true; const ms = api.elapsed();
      const s = HR.Score.hunt(r, found, wrong, ms, complete);
      later(() => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); api.done({ pts: s.pts, ok: s.ok, v: found, detail: { found, wrong }, ms }); }, complete ? 600 : 0);
    }
    bubs.forEach((b, i) => b.addEventListener('pointerdown', e => {
      e.preventDefault(); if (finished || st[i].gone) return;
      if (items[i].real) {
        st[i].gone = true; b.classList.add('popped'); found++;
        el.querySelector('.hunt-found').textContent = found;
        FX.sfx.pop(); FX.vib(20);
        const rect = b.getBoundingClientRect();
        FX.confetti(14, { x: (rect.left + rect.width / 2) / innerWidth, y: (rect.top + rect.height / 2) / innerHeight });
        if (found >= r.targets.length) { FX.sfx.good(); finish(true); }
      } else {
        wrong++; b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); FX.sfx.buzz(); FX.vib([40, 30, 40]);
        st[i].vx *= -1.6; st[i].vy *= -1.6;
      }
    }));
    return { timeUp() { finish(false); }, destroy() { cancelAnimationFrame(raf); removeEventListener('resize', onResize); } };
  };

  /* play(): mounts a round with its timer. api.done fires exactly once. */
  HR.Rounds = {
    play(el, r, onDone, opts = {}) {
      el.innerHTML = `<div class="q-wrap ${r.golden ? 'golden' : ''}"><div class="q-timer"></div><div class="q-body"></div></div>`;
      const body = el.querySelector('.q-body');
      let fired = false, inst = null;
      const limit = opts.limit || r.limit;
      const timer = Timer(el.querySelector('.q-timer'), limit, () => inst && inst.timeUp());
      const api = {
        elapsed: () => timer.elapsed(),
        done(res) {
          if (fired) return; fired = true; timer.stop(); inst && inst.destroy && inst.destroy();
          onDone(Object.assign({ pts: 0, ok: false, v: null, ms: 0 }, res));
        },
      };
      inst = R[r.type](body, r, api);
      return { stop() { timer.stop(); inst && inst.destroy && inst.destroy(); }, forceEnd() { inst && inst.timeUp(); } };
    },
  };
})();
