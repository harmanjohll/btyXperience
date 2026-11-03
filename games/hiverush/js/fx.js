/* HIVE RUSH effects: synthesised sound + music (no audio files), haptics, confetti,
   number roll ups, screen wake lock, fullscreen. Everything degrades silently. */
(function () {
  const FX = {};
  let ctx = null, master = null, musicBus = null, sfxBus = null;
  let muted = false, musicOn = true;
  try { muted = localStorage.getItem('hr_muted') === '1'; } catch (e) {}
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  FX.reduceMotion = reduceMotion;

  function ac() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.22; musicBus.connect(comp);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(comp);
    return ctx;
  }
  FX.unlock = function () { const c = ac(); if (c && c.state === 'suspended') c.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, FX.unlock, { passive: true }));
  FX.isMuted = () => muted;
  FX.setMuted = function (m) {
    muted = m; try { localStorage.setItem('hr_muted', m ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
  };

  function tone(freq, t0, dur, { type = 'sine', vol = 0.3, bus, attack = 0.005, glide = 0, filter = 0 } = {}) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * glide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (filter) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
    node.connect(g); g.connect(bus || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(t0, dur, { vol = 0.2, hp = 6000, bus, lp = 0 } = {}) {
    const c = ac(); if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const f = c.createBiquadFilter(); f.type = lp ? 'lowpass' : 'highpass'; f.frequency.value = lp || hp;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }
  const now = () => (ac() ? ctx.currentTime : 0);
  const N = n => 440 * Math.pow(2, (n - 69) / 12);

  FX.sfx = {
    tap() { const t = now(); tone(N(84), t, 0.06, { type: 'triangle', vol: 0.25 }); },
    key() { const t = now(); tone(N(79 + Math.floor(Math.random() * 5)), t, 0.07, { type: 'triangle', vol: 0.22 }); },
    pop() { const t = now(); tone(N(72), t, 0.12, { type: 'sine', vol: 0.4, glide: 2.2 }); },
    lock() { const t = now(); tone(N(67), t, 0.08, { type: 'square', vol: 0.12, filter: 2400 }); tone(N(79), t + 0.07, 0.16, { type: 'square', vol: 0.12, filter: 2400 }); },
    good() { const t = now(); [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.07, 0.25, { type: 'triangle', vol: 0.3 })); },
    bad() { const t = now(); tone(N(55), t, 0.28, { type: 'sawtooth', vol: 0.12, glide: 0.7, filter: 900 }); },
    tick(urgent) { const t = now(); tone(urgent ? 1400 : 1000, t, 0.035, { type: 'square', vol: urgent ? 0.14 : 0.08, filter: 3000 }); },
    whoosh() { const t = now(); noise(t, 0.35, { vol: 0.18, hp: 900 }); },
    coin() { const t = now(); tone(N(88), t, 0.05, { type: 'square', vol: 0.06, filter: 4000 }); },
    buzz() { const t = now(); tone(180, t, 0.25, { type: 'sawtooth', vol: 0.08, filter: 700, glide: 1.3 }); },
    slam() { const t = now(); tone(70, t, 0.4, { type: 'sine', vol: 0.6, glide: 0.4 }); noise(t, 0.2, { vol: 0.15, hp: 2000 }); },
    go() { const t = now(); [60, 64, 67, 72].forEach(n => tone(N(n), t, 0.5, { type: 'sawtooth', vol: 0.09, filter: 2600 })); tone(N(84), t, 0.5, { type: 'triangle', vol: 0.2 }); },
    count() { const t = now(); tone(N(69), t, 0.18, { type: 'square', vol: 0.12, filter: 2000 }); },
    fanfare() {
      const t = now();
      [[67, 0], [72, 0.14], [76, 0.28], [79, 0.42], [76, 0.62], [79, 0.76]].forEach(([n, d]) => {
        tone(N(n), t + d, 0.3, { type: 'sawtooth', vol: 0.1, filter: 3000 }); tone(N(n - 12), t + d, 0.3, { type: 'triangle', vol: 0.15 });
      });
      [72, 76, 79, 84].forEach(n => tone(N(n), t + 0.95, 1.2, { type: 'sawtooth', vol: 0.07, filter: 2600 }));
    },
    drumroll(sec) {
      const t = now(); const steps = Math.floor(sec * 22);
      for (let i = 0; i < steps; i++) noise(t + i / 22, 0.06, { vol: 0.05 + 0.12 * (i / steps), lp: 1800 });
      tone(55, t + sec, 0.6, { type: 'sine', vol: 0.5, glide: 0.5 }); noise(t + sec, 0.5, { vol: 0.2, hp: 3000 });
    },
  };

  /* ---------- tiny step sequencer for host music ---------- */
  let seqTimer = null, seqStep = 0, seqNext = 0, seqMode = null;
  const PROG = { lobby: [[48, 55, 64], [43, 50, 62], [45, 52, 60], [41, 48, 57]], think: [[40, 47, 55], [40, 47, 55], [43, 50, 59], [38, 45, 54]] };
  function scheduleStep(step, t) {
    const mode = seqMode; const bar = Math.floor(step / 16) % 4; const s = step % 16;
    const chord = PROG[mode][bar];
    if (mode === 'lobby') {
      if (s % 4 === 0) tone(60, t, 0.25, { type: 'sine', vol: 0.55, glide: 0.5, bus: musicBus });
      if (s % 4 === 2) noise(t, 0.05, { vol: 0.12, bus: musicBus });
      if (s === 4 || s === 12) noise(t, 0.12, { vol: 0.12, hp: 1500, bus: musicBus });
      if ([0, 3, 6, 10, 11, 14].includes(s)) tone(N(chord[0] - 12 + (s === 14 ? 12 : 0)), t, 0.18, { type: 'sawtooth', vol: 0.22, filter: 600, bus: musicBus });
      if ([2, 7, 10].includes(s)) chord.forEach(n => tone(N(n + 12), t, 0.12, { type: 'square', vol: 0.05, filter: 2200, bus: musicBus }));
      if (s === 0 && bar % 2 === 0) tone(N(chord[2] + 24), t, 0.4, { type: 'triangle', vol: 0.06, bus: musicBus });
    } else if (mode === 'think') {
      if (s % 4 === 0) tone(58, t, 0.2, { type: 'sine', vol: 0.5, glide: 0.5, bus: musicBus });
      noise(t, 0.03, { vol: s % 2 ? 0.05 : 0.09, bus: musicBus });
      const arp = [chord[0] + 24, chord[1] + 24, chord[2] + 24, chord[1] + 24];
      if (s % 2 === 0) tone(N(arp[(s / 2) % 4]), t, 0.1, { type: 'square', vol: 0.05, filter: 2800, bus: musicBus });
      if (s % 8 === 0) tone(N(chord[0] - 12), t, 0.45, { type: 'sawtooth', vol: 0.2, filter: 500, bus: musicBus });
    }
  }
  FX.music = function (mode) {
    if (mode === seqMode) return;
    seqMode = mode || null;
    if (seqTimer) { clearInterval(seqTimer); seqTimer = null; }
    if (!seqMode || !musicOn || !ac()) return;
    const bpm = seqMode === 'think' ? 132 : 112; const dt = 60 / bpm / 4;
    seqStep = 0; seqNext = ctx.currentTime + 0.08;
    seqTimer = setInterval(() => {
      if (!ctx) return;
      while (seqNext < ctx.currentTime + 0.12) { scheduleStep(seqStep, seqNext); seqNext += dt; seqStep++; }
    }, 30);
  };
  FX.setMusicOn = function (v) { musicOn = v; const m = seqMode; seqMode = null; if (v) FX.music(m); else { if (seqTimer) clearInterval(seqTimer); seqTimer = null; seqMode = m; } };

  /* ---------- haptics ---------- */
  FX.vib = function (p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  /* ---------- confetti ---------- */
  let cv = null, cx = null, parts = [], raf = 0;
  const COLS = ['#FFE200', '#FFFFFF', '#EC3237', '#FFE200', '#7f8cff'];
  function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.y < cv.height + 40 && p.life > 0);
    for (const p of parts) {
      p.vy += 0.18 * p.g; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 1;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
      if (p.hex) { cx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; cx.lineTo(Math.cos(a) * p.s, Math.sin(a) * p.s); } cx.fill(); }
      else cx.fillRect(-p.s, -p.s * 0.4, p.s * 2, p.s * 0.8);
      cx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop); else { raf = 0; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  FX.confetti = function (n = 120, opts = {}) {
    if (!cv) {
      cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv); cx = cv.getContext('2d');
      const fit = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; cx.setTransform(1, 0, 0, 1, 0, 0); };
      fit(); addEventListener('resize', fit);
    }
    if (reduceMotion) n = Math.min(n, 30);
    const W = cv.width, H = cv.height, d = devicePixelRatio;
    const ox = opts.x != null ? opts.x * W : W / 2, oy = opts.y != null ? opts.y * H : H * 0.35;
    for (let i = 0; i < n; i++) {
      const a = opts.rain ? Math.PI / 2 : Math.random() * Math.PI * 2, sp = opts.rain ? 1 : (4 + Math.random() * 9) * d;
      parts.push({ x: opts.rain ? Math.random() * W : ox, y: opts.rain ? -20 - Math.random() * H * 0.5 : oy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.rain ? 0 : 6 * d), g: d, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        s: (4 + Math.random() * 6) * d, c: (opts.colors || COLS)[i % (opts.colors || COLS).length], hex: Math.random() < 0.45, life: 400 });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  /* ---------- number roll up ---------- */
  FX.countUp = function (el, from, to, ms = 900, tickSound = false) {
    if (!el) return;
    const t0 = performance.now(); let lastTick = 0;
    const fmt = v => Math.round(v).toLocaleString('en-SG');
    function f(t) {
      const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (tickSound && t - lastTick > 70 && k < 1) { FX.sfx.coin(); lastTick = t; }
      if (k < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  };

  /* ---------- keep the screen awake, go fullscreen ---------- */
  let lock = null;
  FX.keepAwake = async function () {
    try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {}
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') FX.keepAwake(); });
  FX.fullscreen = function () {
    const el = document.documentElement;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } catch (e) {}
  };

  /* ---------- helpers ---------- */
  FX.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  FX.pick = a => a[Math.floor(Math.random() * a.length)];
  FX.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  FX.fmt = n => Math.round(n || 0).toLocaleString('en-SG');
  FX.ordinal = n => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');

  /* stop pinch zoom and long press menus on kiosk devices (double tap zoom is off via CSS touch-action) */
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea')) e.preventDefault(); });

  HR.FX = FX;
})();
