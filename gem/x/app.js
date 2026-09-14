/* === Beatty SAIL — Sailor (Participant) v7 ===
   Washi craft origami · 8 folds · hanko stamps · ink trail.
*/

// Firebase is loaded via DYNAMIC import (see FIREBASE block below) so a CDN
// outage on venue wifi can't stop the applet from running — only the shared
// Fleet sync is lost. Boat rendering + the local experience still work.
let initializeApp, getFirestore, doc, setDoc, serverTimestamp, onSnapshot, collection, getDocs, getAuth, signInAnonymously;
import {
    buildOrigamiSVG, haptic, hapticPattern,
    SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FOLD_GUIDES, FOLD_FLAPS, FOLD_LABELS, CREASE_LINES, LABELS,
    STAMP_MARKS, MARK_SLOTS,
    FIREBASE_CONFIG, LOGO_URL, HAND_FONT, cleanWord, wordOK,
} from './boat.js';

// === PAPER CREASE SOUND (Web Audio API) ===
let audioCtx;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

// === BOARDING: one tap unlocks everything the phone needs for the whole show ===
// iOS only plays sound after a user gesture (and only resumes a context inside
// it); Android only vibrates after the page has been tapped; the screen wake
// lock must be requested from a gesture and re-taken when the page comes back.
// The "Which bee are you?" tap is that gesture.
let wakeLock = null;
let silentEl = null;
function unlockAudio() {
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const buf = ctx.createBuffer(1, 1, 22050); const src = ctx.createBufferSource();
        src.buffer = buf; src.connect(ctx.destination); src.start(0);
        // An <audio> element flips the iOS audio session out of "ambient", so Web
        // Audio keeps playing even with the ring switch on silent.
        if (!silentEl) {
            silentEl = document.createElement('audio'); silentEl.setAttribute('playsinline', '');
            silentEl.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
            silentEl.volume = 0.01;
        }
        silentEl.play().catch(() => {});
    } catch (e) {}
}
async function takeWakeLock() {
    try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
function primeVibrate() { try { if (navigator.vibrate) navigator.vibrate(1); } catch (e) {} }
// Keep the unlocks alive: phones sleep, tabs hide, contexts get suspended.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    takeWakeLock();
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
});
document.addEventListener('touchend', () => { try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {} }, { passive: true });

// === SHARED CLOCK ===
// Every "together" moment is scheduled at a SERVER time; each phone fires it on
// its own clock. We learn (local − server) by writing our own compassQuiz doc
// with a server timestamp and reading it back: we know when we sent it and when
// the confirmation returned. Median of a few samples. Firestore's propagation
// delay never enters the picture, because cues are scheduled seconds ahead.
let clockOffset = 0; const clockSamples = [];
function serverNow() { return Date.now() - clockOffset; }
function syncClock() {
    if (!db || !auth?.currentUser || !onSnapshot) return;
    try {
        const ref = doc(db, "compassQuiz", auth.currentUser.uid);
        const lt = Date.now();
        setDoc(ref, { archetype: D.bee || 'Beattyian', timestamp: serverTimestamp(), lt }).catch(() => {});
        let unsub = null;
        unsub = onSnapshot(ref, (snap) => {
            try {
                if (snap.metadata && snap.metadata.hasPendingWrites) return;
                const d = snap.data ? snap.data() : null; if (!d || d.lt !== lt) return;
                const st = typeof d.timestamp === 'number' ? d.timestamp : (d.timestamp && typeof d.timestamp.toMillis === 'function' ? d.timestamp.toMillis() : null);
                if (st == null) return;
                clockSamples.push((lt + Date.now()) / 2 - st); if (clockSamples.length > 5) clockSamples.shift();
                const a = [...clockSamples].sort((x, y) => x - y); clockOffset = a[Math.floor(a.length / 2)];
                if (unsub) unsub();
            } catch (e) {}
        }, () => {});
        setTimeout(() => { try { unsub && unsub(); } catch (e) {} }, 15000);
    } catch (e) {}
}
function playCreaseSound() {
    try {
        const ctx = getAudioCtx();
        // Noise burst filtered to sound like paper crinkling
        const dur = 0.18;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 2000;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 4500; bp.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        src.connect(hp).connect(bp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) { /* audio not supported */ }
}
function playCreasePitched(pitch) {
    try {
        const ctx = getAudioCtx();
        const dur = 0.18;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = pitch;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4500; bp.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        src.connect(hp).connect(bp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) {}
}
function spawnDust(x, y, count = 3) {
    const container = document.querySelector('.crease-overlay') || document.querySelector('.origami-stage');
    if (!container) return;
    for (let i = 0; i < count; i++) {
        const d = document.createElement('div');
        d.className = 'crease-dust';
        d.style.left = x + 'px'; d.style.top = y + 'px';
        d.style.setProperty('--dx', (Math.random() - 0.5) * 20 + 'px');
        d.style.setProperty('--dy', (-5 - Math.random() * 15) + 'px');
        container.appendChild(d);
        setTimeout(() => d.remove(), 800);
    }
}
function playFoldSound() {
    try {
        const ctx = getAudioCtx();
        // Longer crease-fold sound — two layered noise bursts
        const dur = 0.35;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * (t < 0.3 ? t / 0.3 : Math.pow(1 - (t - 0.3) / 0.7, 1.5)) * 0.7;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        src.connect(bp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) { /* audio not supported */ }
}
/* ============================================================
   THE SIX SOUNDS — all paper-coloured, all under 1.5 s. No music on the
   phone, so each fold is heard: crease slide (gain follows the finger),
   lock, chapter chime, reveal hit, departure whoosh, found-you ping.
   ============================================================ */
let slideSrc = null, slideGain = null, slideFilter = null, slideDecay = null;
function startSlideNoise() {
    try {
        stopSlideNoise(true);
        const ctx = getAudioCtx(), dur = 2;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        slideSrc = ctx.createBufferSource(); slideSrc.buffer = buf; slideSrc.loop = true;
        slideFilter = ctx.createBiquadFilter(); slideFilter.type = 'bandpass'; slideFilter.frequency.value = 3200; slideFilter.Q.value = 0.7;
        slideGain = ctx.createGain(); slideGain.gain.value = 0.0001;
        slideSrc.connect(slideFilter).connect(slideGain).connect(ctx.destination); slideSrc.start();
    } catch (e) {}
}
function setSlideSpeed(v) {        // v: 0 (still) → 1 (fast) — the paper only sounds while it moves
    try {
        if (!slideGain) return; const ctx = getAudioCtx();
        slideGain.gain.setTargetAtTime(Math.min(0.22, 0.015 + v * 0.2), ctx.currentTime, 0.03);
        slideFilter.frequency.setTargetAtTime(2600 + v * 2400, ctx.currentTime, 0.05);
        clearTimeout(slideDecay); slideDecay = setTimeout(() => { try { slideGain && slideGain.gain.setTargetAtTime(0.0001, getAudioCtx().currentTime, 0.05); } catch (e) {} }, 90);
    } catch (e) {}
}
function stopSlideNoise(immediate) {
    try {
        clearTimeout(slideDecay);
        if (!slideSrc) return; const ctx = getAudioCtx(); const src = slideSrc, g = slideGain; slideSrc = null; slideGain = null; slideFilter = null;
        if (immediate) { try { src.stop(); } catch (e) {} return; }
        g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04); setTimeout(() => { try { src.stop(); } catch (e) {} }, 250);
    } catch (e) {}
}
function playLock() {              // the crease seals: a dry click over a short crinkle
    try {
        const ctx = getAudioCtx(), t = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.08);
        playCreaseSound();
    } catch (e) {}
}
function playChapterChime() {      // two notes: a hat, a diamond
    try {
        const ctx = getAudioCtx(), t = ctx.currentTime;
        [[659, 0], [988, 0.16]].forEach(([f, dt]) => {
            const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(0.14, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.55);
            o.connect(g).connect(ctx.destination); o.start(t + dt); o.stop(t + dt + 0.6);
        });
    } catch (e) {}
}
function playWhump() {             // the reveal hit: the hull snaps open
    try {
        const ctx = getAudioCtx(), t = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
        o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.28);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.36);
        const dur = 0.14, buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
        const src = ctx.createBufferSource(); src.buffer = buf; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        const ng = ctx.createGain(); ng.gain.value = 0.35; src.connect(lp).connect(ng).connect(ctx.destination); src.start(t);
    } catch (e) {}
}
function playArpeggio() {          // rising three notes: the name is on the hull
    try {
        const ctx = getAudioCtx(), t = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; const st = t + i * 0.13;
            g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.13, st + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.75);
            o.connect(g).connect(ctx.destination); o.start(st); o.stop(st + 0.8);
        });
    } catch (e) {}
}
function playPencil(sec) {         // a pencil writing on paper, for as long as the word takes
    try {
        const ctx = getAudioCtx(), t = ctx.currentTime, dur = Math.max(0.3, Math.min(3, sec));
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.1;
        const g = ctx.createGain(); g.gain.value = 0.0001;
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.type = 'sine'; lfo.frequency.value = 9; lg.gain.value = 0.05; lfo.connect(lg).connect(g.gain);
        g.gain.setValueAtTime(0.06, t); g.gain.setValueAtTime(0.06, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(bp).connect(g).connect(ctx.destination); src.start(t); lfo.start(t); src.stop(t + dur); lfo.stop(t + dur);
    } catch (e) {}
}

/* The haptic map. Android: real ticks. iOS has no web vibration, so the paper
   itself shakes 2–3 px instead of the phone. */
const HAPTIC = { tick: 12, lock: 35, chapter: [20, 40, 20], reveal: [50, 30, 100, 30, 80], depart: [15, 30, 15, 30, 120] };
function feel(kind, el) {
    const v = HAPTIC[kind];
    if (navigator.vibrate) { try { navigator.vibrate(v); } catch (e) {} return; }
    if (kind === 'tick') return;
    const t = el || document.getElementById('origamiStage') || document.querySelector('.follow-boat');
    if (!t) return;
    t.classList.remove('paper-shake'); void t.offsetWidth; t.classList.add('paper-shake');
}

/* Tilt the phone, tilt the boat. (iOS asks permission — we ask on a tap, never mid-gesture.) */
let tiltEl = null, tiltBound = false;
function enableTilt(el) {
    tiltEl = el;
    if (tiltBound) return; tiltBound = true;
    window.addEventListener('deviceorientation', (e) => {
        if (!tiltEl || !tiltEl.isConnected) { tiltEl = null; return; }
        const g = Math.max(-16, Math.min(16, (e.gamma || 0) * 0.5));
        const b = Math.max(-8, Math.min(8, ((e.beta || 0) - 45) * 0.15));
        tiltEl.style.transform = `perspective(500px) rotateZ(${g.toFixed(1)}deg) rotateX(${b.toFixed(1)}deg)`;
    }, { passive: true });
}
function requestTiltPermission() {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) {}
}
const NEEDS_TILT_TAP = (() => { try { return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'; } catch (e) { return false; } })();

/* The word writes itself on the hull, letter by letter, with a pencil scratch.
   Returns how long it takes (ms) so the caller can time what follows. */
function handwrite(host, word, { size = 22, per = 95, top = '80%' } = {}) {
    const el = document.createElement('div'); el.className = 'hand-word'; el.style.fontSize = size + 'px'; el.style.top = top;
    el.innerHTML = [...word].map((ch, i) => `<span style="animation-delay:${i * per}ms">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    host.appendChild(el);
    playPencil(word.length * per / 1000 + 0.15);
    return word.length * per + 320;
}

/* Hat → Diamond → Boat: a mini-reveal with a two-note chime at each. */
const CHAPTER_AT = { 5: ['🎩', "That's a hat!"], 6: ['💎', 'Now a diamond'] };
function chapterFlash(nextFold) {
    const ch = CHAPTER_AT[nextFold]; if (!ch) return;
    playChapterChime(); feel('chapter');
    const el = document.createElement('div'); el.className = 'chapter-flash'; el.innerHTML = `<span>${ch[0]}</span>${ch[1]}`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('out'), 1500); setTimeout(() => el.remove(), 2000);
}

function playRevealSound() {
    try {
        const ctx = getAudioCtx();
        const t = ctx.currentTime;
        // Chime: sine sweep 440→880
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.5);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, t);
        oscGain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        oscGain.gain.linearRampToValueAtTime(0.12, t + 0.35);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.connect(oscGain).connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.9);
        // Splash: filtered noise burst
        const dur = 0.5;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.18, t);
        sGain.gain.exponentialRampToValueAtTime(0.01, t + dur);
        src.connect(lp).connect(sGain).connect(ctx.destination);
        src.start(t);
    } catch(e) {}
}
function playStampSound() {
    try {
        const ctx = getAudioCtx();
        const dur = 0.12;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 200; bp.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        src.connect(bp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) {}
}
function playTransitionSound() {
    try {
        const ctx = getAudioCtx();
        const dur = 0.08;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.3;
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        src.connect(hp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) {}
}
let ambientOsc, ambientGain;
function startAmbient() {
    try {
        const ctx = getAudioCtx();
        if (ambientOsc) return;
        ambientOsc = ctx.createOscillator();
        ambientOsc.type = 'sine'; ambientOsc.frequency.value = 60;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 80;
        ambientGain = ctx.createGain(); ambientGain.gain.value = 0;
        ambientGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2);
        ambientOsc.connect(lp).connect(ambientGain).connect(ctx.destination);
        ambientOsc.start();
    } catch(e) {}
}
function stopAmbient() {
    try {
        if (ambientGain) {
            const ctx = getAudioCtx();
            ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
            setTimeout(() => { if (ambientOsc) { ambientOsc.stop(); ambientOsc = null; ambientGain = null; } }, 1200);
        }
    } catch(e) {}
}

// === FIREBASE (off the critical path — the applet boots below regardless) ===
let db, auth;
(async () => {
    try {
        const [a, fs, au] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
        ]);
        initializeApp = a.initializeApp;
        ({ getFirestore, doc, setDoc, serverTimestamp, onSnapshot, collection, getDocs } = fs);
        ({ getAuth, signInAnonymously } = au);
        const app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
        auth = getAuth(app);
        await signInAnonymously(auth);
        startSessionListener();
    } catch (e) { console.warn("SAIL live sync unavailable — running solo:", e); }
})();

// === PRESENTER-DRIVEN SYNC (the phone follows btx27's session/state) ===
// btx27 broadcasts the current slide to session/state (currentView + the poll /
// nexus question data). The phone ANSWERS whatever question is on screen, FOLDS
// the boat on the passive slides, and SAILS into the fleet on the presenter's
// cue. One source of truth — the same channel the whole room already shares.
let sessionBeat = null;
let onSetSailCue = null;   // legacy hook (unused in session/state mode)
function startSessionListener() {
    if (!db || !onSnapshot) return;
    try {
        onSnapshot(doc(db, "session", "state"), (snap) => {
            const exists = snap && (snap.exists ? (snap.exists.call ? snap.exists() : snap.exists) : true);
            const data = exists ? (snap.data ? snap.data() : null) : null;
            if (!data) {                       // no live session yet → wait aboard
                if (!followMode && !(D.aspiration && D.launched && D.dreamSent)) { D.boarded ? renderAboard() : renderBoard(); }
                return;
            }
            if (data.cue) handleCue(data.cue);
            applyView(data);
        }, (e) => console.warn("Session listener:", e));
    } catch (e) { console.warn("Session listen failed:", e); }
}

// === STATE ===
const $app = document.getElementById('app');
const SK = 'btySail_v7';
let D = JSON.parse(localStorage.getItem(SK)) || {};
D.marks = D.marks || [];
let step = 0;

/*  Step map (19 steps):
    0  = welcome
    1  = fold 0  (left-to-right)        stage 0→1
    2  = fold 1  (top-down)             stage 1→2
    3  = Q1: Stewardship                stage 2 + stamp
    4  = fold 2  (open→rect, fold TL)   stage 2→3
    5  = fold 3  (fold TR corner)       stage 3→4
    6  = Q2: Applied Learning           stage 4 + stamp
    7  = Q3: Applied Learning sub       stage 4 + stamp
    8  = fold 4  (bottom front flap)    stage 4→5
    9  = fold 5  (bottom back flap)     stage 5→6
    10 = Q4: International              stage 6 + stamp
    11 = Q5: International sub          stage 6 + stamp
    12 = fold 6  (sides→diamond)        stage 6→7
    13 = fold 7  (pull apart → BOAT!)   stage 7→8
    14 = Q6: Learning                   stage 8 + stamp
    15 = aspiration (name vessel)       stage 9
    16 = processing "Charting..."
    17 = archetype reveal
    18 = memento card
*/

const TOTAL_QUESTIONS = 6;

function save() { localStorage.setItem(SK, JSON.stringify(D)); }
async function saveToFirebase() {
    if (!auth?.currentUser) return;
    try { await setDoc(doc(db, "x_boats", auth.currentUser.uid), { ...D, timestamp: serverTimestamp() }); }
    catch (e) { console.error("FB:", e); }
}

// === HELPERS ===
function colors() {
    return {
        hull: D.hullColor || BOAT_DEFAULTS.hull,
        keel: D.keelColor || BOAT_DEFAULTS.keel,
        sail: D.sailColor || BOAT_DEFAULTS.sail,
        sailGradient: D.sailGradient || null,
        flag: D.flagColor || BOAT_DEFAULTS.flag,
        mast: BOAT_DEFAULTS.mast,
    };
}
function extras() { return { aspiration: D.aspiration, flagIcon: D.flagIcon, marks: D.marks || [] }; }

/* === COMPOSITE ARCHETYPE SCORING ===
   Tallies ALL picks across all 6 questions, matches against archetype signal profiles. */
function computeArchetype() {
    // Collect all chosen option IDs (primary = weight 2, secondary = weight 1)
    const tally = {};
    function add(id, w) { if (id) tally[id] = (tally[id] || 0) + w; }

    // S
    if (D.stewardshipPick1 !== undefined) add(SAIL_DATA.S.options[D.S_pick1]?.id, 2);
    if (D.S_pick2 !== undefined) add(SAIL_DATA.S.options[D.S_pick2]?.id, 1);
    // A
    if (D.appliedPick1 !== undefined) add(SAIL_DATA.A.options[D.A_pick1]?.id, 2);
    if (D.A_pick2 !== undefined) add(SAIL_DATA.A.options[D.A_pick2]?.id, 1);
    // A_sub
    if (D.subjectPick1 !== undefined) add(SAIL_DATA.A.subOptions?.[D.A_sub_pick1]?.id, 2);
    if (D.A_sub_pick2 !== undefined) add(SAIL_DATA.A.subOptions?.[D.A_sub_pick2]?.id, 1);
    // I
    if (D.internationalPick1 !== undefined) add(SAIL_DATA.I.options[D.I_pick1]?.id, 2);
    if (D.I_pick2 !== undefined) add(SAIL_DATA.I.options[D.I_pick2]?.id, 1);
    // I_sub
    if (D.industryPick1 !== undefined) add(SAIL_DATA.I.subOptions?.[D.I_sub_pick1]?.id, 2);
    if (D.I_sub_pick2 !== undefined) add(SAIL_DATA.I.subOptions?.[D.I_sub_pick2]?.id, 1);
    // L
    if (D.learningPick1 !== undefined) add(SAIL_DATA.L.options[D.L_pick1]?.id, 2);
    if (D.L_pick2 !== undefined) add(SAIL_DATA.L.options[D.L_pick2]?.id, 1);

    // Score each archetype by matching tally against its signal profile
    let best = null, bestScore = -1;
    for (const [key, arch] of Object.entries(ARCHETYPES)) {
        let score = 0;
        for (const [signal, weight] of Object.entries(arch.signals || {})) {
            score += (tally[signal] || 0) * weight;
        }
        if (score > bestScore) { bestScore = score; best = { ...arch, key }; }
    }
    return best || ARCHETYPES.innovator;
}

function questionsDone() {
    let n = 0;
    if (D.stewardshipPick1 !== undefined) n++;
    if (D.appliedPick1 !== undefined) n++;
    if (D.subjectPick1 !== undefined) n++;
    if (D.internationalPick1 !== undefined) n++;
    if (D.industryPick1 !== undefined) n++;
    if (D.learningPick1 !== undefined) n++;
    return n;
}

function progressBarHTML(qDone) {
    const pct = Math.round((qDone / TOTAL_QUESTIONS) * 100);
    return `<div class="mb-4 w-full">
        <div class="flex justify-between items-center mb-1.5">
            <span class="text-[10px] font-semibold tracking-widest uppercase" style="color:var(--text-muted);">Progress</span>
            <span class="text-[10px] font-medium" style="color:var(--accent-gold);">${pct}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
}

function spawnParticles(container, count = 12) {
    const cols = ['#FFE200','#F0D68A','#f5f0e8','#e8e0d0','#c9bfae','#8b5cf6'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'launch-particle';
        p.style.background = cols[Math.floor(Math.random() * cols.length)];
        p.style.setProperty('--px', (Math.random()-0.5)*200+'px');
        p.style.setProperty('--py', (Math.random()-0.5)*200+'px');
        p.style.left = '50%'; p.style.top = '50%';
        container.appendChild(p);
        setTimeout(() => p.remove(), 1500);
    }
}

/* === LIVING OCEAN — waves react to journey progress === */
const WAVE_AMP = { S: 4, A: 6, I: 9, L: 13 };
function injectOcean() {
    if (document.querySelector('.ocean-canvas')) return;
    const oc = document.createElement('div');
    oc.className = 'ocean-canvas';
    oc.innerHTML = '<div class="wave wave-1"></div><div class="wave wave-2"></div><div class="wave wave-3"></div>';
    // Floating motes
    for (let i = 0; i < 10; i++) {
        const m = document.createElement('div');
        m.className = 'ocean-mote';
        m.style.left = Math.random() * 100 + '%';
        m.style.bottom = Math.random() * 80 + 'px';
        m.style.animationDelay = (Math.random() * 6) + 's';
        m.style.animationDuration = (4 + Math.random() * 4) + 's';
        oc.appendChild(m);
    }
    document.body.prepend(oc);
}
function setWaveIntensity(amp) {
    const oc = document.querySelector('.ocean-canvas');
    if (oc) oc.style.setProperty('--wave-amp', amp);
}
function waveSurge() {
    const oc = document.querySelector('.ocean-canvas');
    if (!oc) return;
    oc.classList.add('wave-surge');
    setTimeout(() => oc.classList.remove('wave-surge'), 3000);
}

function spawnRipples(container) {
    const cx = container.offsetWidth / 2;
    const cy = container.offsetHeight / 2;
    for (let i = 0; i < 4; i++) {
        const r = document.createElement('div');
        r.className = 'water-ripple';
        r.style.left = cx + 'px';
        r.style.top = cy + 'px';
        r.style.animationDelay = (i * 200) + 'ms';
        container.appendChild(r);
        setTimeout(() => r.remove(), 1700);
    }
}

/* ============================================================
   PAGE TRANSITION — crossfade with subtle slide
   ============================================================ */
function transition(renderFn) {
    const current = $app.firstElementChild;
    if (current) {
        current.classList.add('page-exit');
        haptic(20);
        playTransitionSound();
        setTimeout(() => {
            renderFn();
            const next = $app.firstElementChild;
            if (next) next.classList.add('page-enter');
        }, 150);
    } else {
        renderFn();
    }
}

/* ============================================================
   FOLD-ON-PAPER INTERACTION + ink trail
   ============================================================ */
/* ── Fold physics. Finger-driven and reversible to 60 %; past that it folds
   itself with a 220 ms decelerating spring and a little overshoot; let go
   early and it springs back. 52 px targets with a weak magnetic snap, the
   target brightening as the finger nears, ±8 mm off the crease tolerated.
   Idle 1.5 s → a ghost fingertip traces the gesture, no text, and vanishes
   the moment a real finger lands. ── */
const SNAP_AT = 0.6;     // released past this → completes itself
const AUTO_AT = 0.94;    // dragged this far → snaps home
function easeOutBack(t) { const c = 1.35; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
function setupFoldInteraction(stageEl, foldIndex, onComplete) {
    const guide = FOLD_GUIDES[foldIndex];
    const flap = FOLD_FLAPS[foldIndex];
    const crease = CREASE_LINES[foldIndex];
    const stageRect = stageEl.getBoundingClientRect();
    const stageSize = stageRect.width || 280;
    const s = stageSize / 280;
    const sc = { from: { x: guide.from.x * s, y: guide.from.y * s }, to: { x: guide.to.x * s, y: guide.to.y * s } };

    const overlay = stageEl.querySelector('.fold-overlay');
    const dot = stageEl.querySelector('.fold-dot');
    const target = stageEl.querySelector('.fold-target');
    const dragSvg = stageEl.querySelector('.fold-drag-line');
    const ringCircle = stageEl.querySelector('.fold-progress-ring circle');
    const ring = stageEl.querySelector('.fold-progress-ring');
    const svgEl = stageEl.querySelector('.origami-svg');
    const flapEl = stageEl.querySelector('.fold-flap');
    const shadowEl = stageEl.querySelector('.fold-shadow');

    dot.style.left = sc.from.x + 'px'; dot.style.top = sc.from.y + 'px';
    target.style.left = sc.to.x + 'px'; target.style.top = sc.to.y + 'px';
    ring.style.left = sc.from.x + 'px'; ring.style.top = sc.from.y + 'px';
    const dx = sc.to.x - sc.from.x, dy = sc.to.y - sc.from.y;
    const totalDist = Math.max(1, Math.hypot(dx, dy));
    const circ = 2 * Math.PI * 15;
    ringCircle.style.strokeDasharray = circ; ringCircle.style.strokeDashoffset = circ;
    // The shadow that sweeps across the crease as the flap closes.
    if (shadowEl && crease) {
        const ang = Math.atan2(crease.y2 - crease.y1, crease.x2 - crease.x1) * 180 / Math.PI;
        shadowEl.style.left = ((crease.x1 + crease.x2) / 2 * s) + 'px'; shadowEl.style.top = ((crease.y1 + crease.y2) / 2 * s) + 'px';
        shadowEl.style.width = (Math.hypot(crease.x2 - crease.x1, crease.y2 - crease.y1) * s) + 'px';
        shadowEl.style.setProperty('--ang', ang + 'deg');
    }

    let canvas, ctx, inkFadeInterval;
    let isDown = false, completed = false, anim = null, curP = 0, touched = false, ghostTimer = null, ghostEl = null;

    function getPos(e) { const rect = overlay.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - rect.left, y: t.clientY - rect.top }; }
    function startInkTrail() {
        canvas = document.createElement('canvas'); canvas.className = 'ink-trail-canvas'; canvas.width = stageSize; canvas.height = stageSize;
        stageEl.appendChild(canvas); ctx = canvas.getContext('2d');
        inkFadeInterval = setInterval(() => { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = 'source-over'; }, 33);
    }
    function drawInk(pos) {
        if (!ctx) return;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,226,0,0.55)'; ctx.fill();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,226,0,0.12)'; ctx.fill();
    }
    function stopInkTrail() { if (inkFadeInterval) clearInterval(inkFadeInterval); if (canvas) { const cv = canvas; setTimeout(() => cv.remove(), 600); } canvas = null; ctx = null; }

    // One painter for the whole fold at progress p (0 flat → 1 folded).
    function applyP(p) {
        curP = p;
        ringCircle.style.strokeDashoffset = circ * (1 - Math.min(1, p));
        target.style.opacity = (0.45 + 0.55 * Math.min(1, p)).toFixed(2);
        target.style.transform = `translate(-50%,-50%) scale(${(1 + 0.3 * Math.min(1, p)).toFixed(3)})`;
        if (flap.clipFrom && flapEl) {
            flapEl.style.opacity = p > 0.01 ? '1' : '0';
            const interp = `polygon(${interpolatePolygon(flap.clipFrom, flap.clipTo, p)})`;
            flapEl.style.clipPath = interp; flapEl.style.webkitClipPath = interp;
            const flapSvg = flapEl.querySelector('.origami-svg');
            if (flapSvg) { flapSvg.style.transformOrigin = flap.axis; flapSvg.style.transform = `${flap.rotate}(${(p * flap.maxDeg).toFixed(1)}deg)`; }
            flapEl.style.filter = `brightness(${(1 - 0.22 * Math.min(1, p)).toFixed(3)})`;
        }
        if (shadowEl) shadowEl.style.opacity = (Math.min(1, p) * 0.55).toFixed(2);
    }
    function animateTo(to, ms, overshoot, done) {
        if (anim) cancelAnimationFrame(anim);
        const from = curP, t0 = performance.now();
        (function frame(now) {
            const t = Math.min(1, (now - t0) / ms);
            const e = overshoot ? easeOutBack(t) : 1 - Math.pow(1 - t, 3);
            applyP(Math.max(0, Math.min(1.08, from + (to - from) * e)));
            if (t < 1) anim = requestAnimationFrame(frame); else { anim = null; applyP(to); done && done(); }
        })(t0);
    }
    function finish() {
        completed = true; isDown = false;
        svgEl.style.transform = ''; stageEl.classList.remove('tilting');
        dragSvg.innerHTML = ''; stopInkTrail(); killGhost();
        if (flapEl) flapEl.style.opacity = '0';
        if (shadowEl) shadowEl.style.opacity = '0';
        onComplete();
    }

    // Ghost fingertip: teaches the gesture without a word.
    function ghost() {
        if (touched || completed || !overlay.isConnected) return;
        killGhost(false);
        ghostEl = document.createElement('div'); ghostEl.className = 'ghost-finger';
        ghostEl.style.left = sc.from.x + 'px'; ghostEl.style.top = sc.from.y + 'px';
        stageEl.appendChild(ghostEl);
        const a = ghostEl.animate([
            { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
            { transform: 'translate(-50%,-50%) scale(1)', opacity: .85, offset: .15 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: .85, offset: .85 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)`, opacity: 0 }
        ], { duration: 1500, easing: 'cubic-bezier(.4,0,.2,1)' });
        a.onfinish = () => { if (ghostEl) ghostEl.remove(); ghostEl = null; if (!touched) ghostTimer = setTimeout(ghost, 1300); };
    }
    function killGhost(stop = true) { if (ghostEl) { ghostEl.remove(); ghostEl = null; } if (stop) { clearTimeout(ghostTimer); ghostTimer = null; } }
    ghostTimer = setTimeout(ghost, 1500);

    function start(e) {
        if (completed || anim) return;
        e.preventDefault();
        const pos = getPos(e);
        if (Math.hypot(pos.x - sc.from.x, pos.y - sc.from.y) > 60) return;
        touched = true; killGhost(); isDown = true;
        feel('tick');
        dot.style.animation = 'none'; target.style.animation = 'none';
        stageEl.classList.add('tilting');
        svgEl.style.transform = 'perspective(400px) rotateX(5deg)';     // the paper pre-bends under the finger
        startInkTrail();
    }
    function move(e) {
        if (!isDown || completed) return;
        e.preventDefault();
        const pos = getPos(e);
        drawInk(pos);
        dragSvg.innerHTML = `<svg viewBox="0 0 ${stageSize} ${stageSize}" width="${stageSize}" height="${stageSize}"><line x1="${sc.from.x}" y1="${sc.from.y}" x2="${pos.x}" y2="${pos.y}"/></svg>`;
        const progressX = (pos.x - sc.from.x) / stageSize, progressY = (pos.y - sc.from.y) / stageSize;
        svgEl.style.transform = `perspective(400px) rotateX(${(5 - progressY * 12).toFixed(2)}deg) rotateY(${(progressX * 8).toFixed(2)}deg)`;
        // Progress is how far along the dot→target line the finger has come; drifting off it is fine.
        const along = ((pos.x - sc.from.x) * dx + (pos.y - sc.from.y) * dy) / (totalDist * totalDist);
        const p = Math.max(0, Math.min(1, along));
        ring.style.left = pos.x + 'px'; ring.style.top = pos.y + 'px';
        const prev = curP; applyP(p);
        [0.25, 0.5, 0.75].forEach(m => { if (prev < m && p >= m) { feel('tick'); playCreaseSound(); } });
        if (p >= AUTO_AT) { isDown = false; animateTo(1, 220, true, finish); }
    }
    function end() {
        if (!isDown || completed) return;
        isDown = false; dragSvg.innerHTML = ''; stopInkTrail();
        ring.style.left = sc.from.x + 'px'; ring.style.top = sc.from.y + 'px';
        if (curP >= SNAP_AT) { animateTo(1, 240, true, finish); return; }        // past the point of no return: it folds itself
        svgEl.style.transform = ''; stageEl.classList.remove('tilting');
        dot.style.animation = ''; target.style.animation = '';
        animateTo(0, 260, true, () => { if (flapEl) flapEl.style.opacity = '0'; });   // springs back
    }
    overlay.addEventListener('mousedown', start);
    overlay.addEventListener('mousemove', move);
    overlay.addEventListener('mouseup', end);
    overlay.addEventListener('mouseleave', end);
    overlay.addEventListener('touchstart', start, { passive: false });
    overlay.addEventListener('touchmove', move, { passive: false });
    overlay.addEventListener('touchend', end);
    overlay.addEventListener('touchcancel', end);
}

/* ── Fold 8 is a different gesture: the pull-open. Two glowing corners resist
   while the paper bulges and the camera drifts to water level; then it gives. ── */
function setupPullOpen(stageEl, onSnap) {
    const rect = stageEl.getBoundingClientRect(); const size = rect.width || 280; const s = size / 280;
    const overlay = stageEl.querySelector('.fold-overlay'); const svgEl = stageEl.querySelector('.origami-svg');
    const dots = { l: stageEl.querySelector('.pull-dot.l'), r: stageEl.querySelector('.pull-dot.r') };
    const corners = { l: { x: 50 * s, y: 140 * s, dir: -1 }, r: { x: 230 * s, y: 140 * s, dir: 1 } };
    const TRAVEL = 78 * s;
    const ocean = document.querySelector('.ocean-canvas');
    let side = null, isDown = false, done = false, startX = 0, p = 0, anim = null, touched = false, ghostTimer = null, ghostEl = null;
    function pos(e) { const r = overlay.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    function paint(q) {
        p = q;
        const v = Math.pow(Math.max(0, Math.min(1, q)), 1.8);          // resists at first, then gives
        svgEl.style.transform = `perspective(500px) rotateX(${(9 * v).toFixed(2)}deg) scale(${(1 + 0.05 * v).toFixed(3)},${(1 + 0.11 * v).toFixed(3)}) translateY(${(12 * v).toFixed(1)}px)`;
        if (dots.l) dots.l.style.setProperty('--pull', (-22 * v).toFixed(1) + 'px');
        if (dots.r) dots.r.style.setProperty('--pull', (22 * v).toFixed(1) + 'px');
        setWaveIntensity(13 + 14 * v);
        if (ocean) ocean.style.transform = `translateY(${(-26 * v).toFixed(1)}px)`;
    }
    function animateTo(to, ms, cb) {
        if (anim) cancelAnimationFrame(anim); const from = p, t0 = performance.now();
        (function frame(now) { const t = Math.min(1, (now - t0) / ms); paint(from + (to - from) * easeOutBack(t)); if (t < 1) anim = requestAnimationFrame(frame); else { anim = null; paint(to); cb && cb(); } })(t0);
    }
    function ghost() {
        if (touched || done || !overlay.isConnected) return;
        if (ghostEl) ghostEl.remove();
        ghostEl = document.createElement('div'); ghostEl.className = 'ghost-finger';
        ghostEl.style.left = corners.r.x + 'px'; ghostEl.style.top = corners.r.y + 'px'; stageEl.appendChild(ghostEl);
        const a = ghostEl.animate([
            { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: .85, offset: .2 },
            { transform: `translate(calc(-50% + ${TRAVEL * 0.9}px), -50%) scale(1)`, opacity: .85, offset: .85 }, { transform: `translate(calc(-50% + ${TRAVEL * 0.9}px), -50%) scale(.6)`, opacity: 0 }
        ], { duration: 1500, easing: 'cubic-bezier(.4,0,.2,1)' });
        a.onfinish = () => { if (ghostEl) ghostEl.remove(); ghostEl = null; if (!touched) ghostTimer = setTimeout(ghost, 1300); };
    }
    ghostTimer = setTimeout(ghost, 1500);
    function snap() {
        done = true; isDown = false; clearTimeout(ghostTimer); if (ghostEl) ghostEl.remove();
        overlay.remove(); Object.values(dots).forEach(d => d && (d.style.opacity = '0'));
        onSnap();
    }
    function start(e) {
        if (done || anim) return; e.preventDefault();
        const q = pos(e);
        side = ['l', 'r'].find(k => Math.hypot(q.x - corners[k].x, q.y - corners[k].y) <= 60); if (!side) return;
        touched = true; clearTimeout(ghostTimer); if (ghostEl) { ghostEl.remove(); ghostEl = null; }
        isDown = true; startX = q.x; feel('tick');
        Object.values(dots).forEach(d => d && (d.style.animation = 'none'));
    }
    function move(e) {
        if (!isDown || done) return; e.preventDefault();
        const q = pos(e); const prev = p;
        const np = Math.max(0, Math.min(1, ((q.x - startX) * corners[side].dir) / TRAVEL));
        paint(np);
        [0.35, 0.7].forEach(m => { if (prev < m && np >= m) { feel('tick'); playCreasePitched(0.7); } });
        if (np >= 0.85) snap();
    }
    function end() {
        if (!isDown || done) return; isDown = false;
        if (p >= 0.6) { animateTo(1, 200, snap); return; }
        animateTo(0, 320, null);
    }
    overlay.addEventListener('mousedown', start); overlay.addEventListener('mousemove', move); overlay.addEventListener('mouseup', end); overlay.addEventListener('mouseleave', end);
    overlay.addEventListener('touchstart', start, { passive: false }); overlay.addEventListener('touchmove', move, { passive: false }); overlay.addEventListener('touchend', end); overlay.addEventListener('touchcancel', end);
}

/* The reveal: resist → silence → snap → water → sail → handwriting → arpeggio; then tilt. */
function revealBoat(stageEl, foldIndex) {
    const c = colors(); const svgEl = stageEl.querySelector('.origami-svg');
    const ocean = document.querySelector('.ocean-canvas');
    // 1 · Silence. 400 ms with nothing — the gasp lives in the gap.
    stopAmbient(); stopSlideNoise(true);
    $app.classList.add('hush');
    setTimeout(() => {
        // 2 · Snap. The hull opens in 300 ms with a whump and a double pulse.
        $app.classList.remove('hush');
        playWhump(); feel('reveal', stageEl);
        const baseC = { ...c, hull: BOAT_DEFAULTS.hull, sail: BOAT_DEFAULTS.sail, sailGradient: null, flag: BOAT_DEFAULTS.flag };
        if (svgEl) svgEl.outerHTML = `<div class="boat-rising snap-open">${buildOrigamiSVG(baseC, 8, 280, { ...extras(), aspiration: '' })}</div>`;
        $app.classList.add('screen-shake'); setTimeout(() => $app.classList.remove('screen-shake'), 400);
        // 3 · Water. The surface under it becomes sea.
        const water = document.createElement('div'); water.className = 'water-line'; stageEl.appendChild(water);
        requestAnimationFrame(() => water.classList.add('on'));
        spawnRipples(stageEl); waveSurge(); setWaveIntensity(16); if (ocean) ocean.style.transform = '';
        // 4 · The sail rises in the destination colour.
        setTimeout(() => {
            const rising = stageEl.querySelector('.boat-rising'); if (!rising) return;
            rising.classList.remove('snap-open');
            rising.innerHTML = buildOrigamiSVG(c, 9, 280, { ...extras(), aspiration: '' });
            rising.querySelectorAll('.sail-cloth, .flag-cloth').forEach((el, i) => {
                el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 100%';
                try { el.animate([{ transform: 'scaleY(0.04)' }, { transform: 'scaleY(1.06)', offset: 0.75 }, { transform: 'scaleY(1)' }], { duration: 700, delay: i * 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }); } catch (e) {}
            });
            spawnParticles(stageEl, getIntensity().particles + 10);
            // 5 · The name writes itself on the hull (if it has one yet), then a rising arpeggio.
            const word = (D.aspiration || '').trim();
            const wait = word ? handwrite(stageEl, word, { size: Math.max(16, Math.min(24, 200 / Math.max(6, word.length))) }) : 0;
            setTimeout(() => { playArpeggio(); feel('chapter', stageEl); }, 700 + wait);
            // 6 · Tilt the phone, tilt the boat.
            setTimeout(() => enableTilt(rising), 800 + wait);
            setTimeout(() => {
                if (foldFollowActive) onFoldBeatDone(foldIndex);
                else { step = NEXT_STEP_AFTER_FOLD[foldIndex]; route(); }
            }, 2700 + wait);
        }, 380);
    }, 400);
}

function interpolatePolygon(fromPoly, toPoly, t) {
    const parsePoints = (poly) => {
        const inner = poly.replace(/polygon\(|\)/g, '');
        return inner.split(',').map(p => {
            const [x, y] = p.trim().split(/\s+/);
            return { x: parseFloat(x), y: parseFloat(y) };
        });
    };
    const from = parsePoints(fromPoly);
    const to = parsePoints(toPoly);
    return from.map((fp, i) => {
        const tp = to[i] || fp;
        const x = fp.x + (tp.x - fp.x) * t;
        const y = fp.y + (tp.y - fp.y) * t;
        return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
    }).join(', ');
}

/* ============================================================
   RENDER: WELCOME
   ============================================================ */
function renderWelcome() {
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
            <img src="${LOGO_URL}" alt="Beatty Secondary crest" class="h-16 w-16 mb-5 drop-shadow-lg" style="width:64px;height:64px;object-fit:contain" onerror="this.style.display='none'">
            <p class="text-[10px] mb-2 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">The Beatty Experience · Open House 2026</p>
            <h1 class="font-serif text-3xl tracking-tight mb-2" style="color:var(--accent-gold);">Set Sail</h1>
            <p class="text-sm mb-6 text-center max-w-xs" style="color:var(--text-secondary);">Fold your boat, discover who you are,<br>and set sail with your cohort.</p>
            <div class="origami-stage mb-4" id="welcomeBoat">
                ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 280)}
            </div>
            <p class="text-xs mb-6 text-center font-serif italic" style="color:var(--text-muted);">"Between your hands and a sheet of paper, every path is possible."</p>
            <button id="startBtn" class="btn-start">Fold Your Boat</button>
            <p class="text-[10px] mt-2" style="color:var(--text-muted);">2 minutes · 8 folds · your personal compass card</p>
            <p class="text-[11px] mt-4 font-serif italic" style="color:var(--accent-gold);">From our Hive, every Beattyian sets sail.</p>
            <p class="text-[10px] mt-1 tracking-widest uppercase" style="color:var(--text-muted);">Non Vi Sed Arte · Open House 2026</p>
        </div>
    </div>`;

    // Looping boat-fold preview: cycle through stages 0→8 then back
    const welcomeBoat = document.getElementById('welcomeBoat');
    const stages = [0,1,2,3,4,5,6,7,8];
    let si = 0;
    const previewInterval = setInterval(() => {
        si = (si + 1) % stages.length;
        if (welcomeBoat && welcomeBoat.isConnected) {
            welcomeBoat.innerHTML = buildOrigamiSVG(BOAT_DEFAULTS, stages[si], 280);
        } else {
            clearInterval(previewInterval);
        }
    }, 800);
}

/* ============================================================
   RENDER: FOLD STEP (8 folds)
   ============================================================ */

// Which paper stage to show BEFORE each fold
const STAGE_FOR_FOLD = [0, 1, 2, 3, 4, 5, 6, 7];
// Which step to go to AFTER each fold completes
const NEXT_STEP_AFTER_FOLD = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 9, 5: 10, 6: 13, 7: 14 };

/* ── CHAPTER CARDS — SAIL letter intros before chapter-starting folds ── */
const CHAPTER_FOR_FOLD = {
    0: { letter: 'S', title: 'Stewardship', subtitle: 'The Foundation' },
    2: { letter: 'A', title: 'Applied Learning', subtitle: 'The Structure' },
    4: { letter: 'I', title: 'International & Industry', subtitle: 'The Sail' },
    6: { letter: 'L', title: 'Learning to Live, Learn & Love', subtitle: 'The Flag' },
};

/* ── CRESCENDO INTENSITY per chapter ── */
const CHAPTER_INTENSITY = {
    S: { particles: 8, hapticBase: 15, gain: 0.2 },
    A: { particles: 10, hapticBase: 20, gain: 0.25 },
    I: { particles: 14, hapticBase: 30, gain: 0.3 },
    L: { particles: 20, hapticBase: 40, gain: 0.35 },
};
let currentChapter = 'S';
function getIntensity() { return CHAPTER_INTENSITY[currentChapter] || CHAPTER_INTENSITY.S; }

function renderFoldStep(foldIndex) {
    armFoldAssist(foldIndex);
    const chapter = CHAPTER_FOR_FOLD[foldIndex];
    if (chapter) {
        currentChapter = chapter.letter;
        // In follow/solo mode the presenter's screen provides the framing, so
        // skip the chapter card and go straight to the fold (keeps it tight).
        if (foldFollowActive) { renderFoldStepInner(foldIndex); return; }
        showChapterCard(chapter, () => renderFoldStepInner(foldIndex));
        return;
    }
    renderFoldStepInner(foldIndex);
}

function showChapterCard(chapter, onDone) {
    setWaveIntensity(WAVE_AMP[chapter.letter] || 4);
    $app.innerHTML = `
    <div class="chapter-card">
        <span class="chapter-letter" style="color:var(--accent-gold);">${chapter.letter}</span>
        <h2 class="chapter-title">${chapter.title}</h2>
        <p class="chapter-subtitle">${chapter.subtitle}</p>
    </div>`;
    haptic(30);
    setTimeout(() => {
        const card = $app.querySelector('.chapter-card');
        if (card) card.classList.add('chapter-card-exit');
        setTimeout(onDone, 400);
    }, 1800);
}

function renderFoldStepInner(foldIndex) {
    const guide = FOLD_GUIDES[foldIndex];
    const c = colors();
    const paperStage = STAGE_FOR_FOLD[foldIndex];
    const isBoatReveal = foldIndex === 7;

    // A faint path hint; the ghost fingertip does the real teaching.
    const fx = guide.from.x, fy = guide.from.y, tx = guide.to.x, ty = guide.to.y;
    const adx = tx - fx, ady = ty - fy, aLen = Math.hypot(adx, ady) || 1, ux = adx / aLen, uy = ady / aLen;
    const ahX = fx + adx * 0.75, ahY = fy + ady * 0.75, sz = 7;
    const guides = isBoatReveal
        ? `<div class="fold-overlay"></div>
           <div class="pull-dot l" style="left:${(50 / 280 * 100).toFixed(2)}%;top:50%"></div>
           <div class="pull-dot r" style="left:${(230 / 280 * 100).toFixed(2)}%;top:50%"></div>`
        : `<svg class="fold-arrow" viewBox="0 0 280 280" style="width:100%;height:100%;">
               <line x1="${fx}" y1="${fy}" x2="${fx + adx * 0.78}" y2="${fy + ady * 0.78}"/>
               <polygon points="${ahX},${ahY} ${ahX - ux * sz - uy * sz * 0.5},${ahY - uy * sz + ux * sz * 0.5} ${ahX - ux * sz + uy * sz * 0.5},${ahY - uy * sz - ux * sz * 0.5}"/>
           </svg>
           <div class="fold-shadow"></div>
           <div class="fold-overlay"></div>
           <div class="fold-dot"></div>
           <div class="fold-target"></div>
           <div class="fold-progress-ring"><svg viewBox="0 0 36 36" style="width:100%;height:100%"><circle cx="18" cy="18" r="15"/></svg></div>
           <div class="fold-drag-line"></div>`;
    const hint = isBoatReveal
        ? `Hold a <span style="color:var(--accent-gold);font-weight:700;">glowing corner</span> and <span style="color:var(--accent-gold);font-weight:700;">pull it outward</span>`
        : `Drag the <span style="color:var(--accent-gold);font-weight:700;">glowing dot</span> to the target · then <span style="color:var(--accent-gold);font-weight:700;">slide along the crease</span>`;

    $app.innerHTML = `
    <div class="sail-screen">
        <div class="paper-zone">
            ${foldFollowActive ? '' : progressBarHTML(questionsDone())}
            <div class="origami-stage${isBoatReveal ? ' pull-stage' : ''}" id="origamiStage">
                ${buildOrigamiSVG(c, paperStage, 280, extras())}
                <div class="fold-flap" style="opacity:0;">
                    ${buildOrigamiSVG(c, paperStage, 280, extras())}
                </div>
                ${guides}
            </div>
        </div>
        <div class="content-zone text-center">
            <div class="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2" style="background:rgba(255,226,0,0.1);border:1px solid rgba(255,226,0,0.3);">
                <div class="fold-badge">${foldIndex + 1}</div>
                <span class="font-bold text-sm" style="color:var(--accent-gold-light);">Fold ${foldIndex + 1} of 8</span>
            </div>
            <div class="fold-step-indicator justify-center">
                <div class="fold-step-mini">${buildOrigamiSVG(BOAT_DEFAULTS, paperStage, 24)}</div>
                <span class="fold-step-arrow-icon">→</span>
                <div class="fold-step-mini">${buildOrigamiSVG(BOAT_DEFAULTS, Math.min(paperStage + 1, 8), 24)}</div>
            </div>
            <p class="text-xs mb-1" style="color:var(--text-secondary);">${FOLD_LABELS[foldIndex]}</p>
            <p class="text-[10px]" style="color:var(--text-muted);">${hint}</p>
        </div>
    </div>`;

    const stageEl = document.getElementById('origamiStage');
    if (isBoatReveal) { setupPullOpen(stageEl, () => revealBoat(stageEl, foldIndex)); return; }

    setupFoldInteraction(stageEl, foldIndex, () => {
        playLock(); feel('lock', stageEl);

        // Hide the guides
        ['.fold-dot', '.fold-target', '.fold-arrow', '.fold-progress-ring'].forEach(q => { const el = stageEl.querySelector(q); if (el) el.style.opacity = '0'; });
        stageEl.querySelector('.fold-drag-line').innerHTML = '';

        // === THE IRON: a finger slides along the crease to seal it ===
        const creaseLine = CREASE_LINES[foldIndex];
        const stageRect2 = stageEl.getBoundingClientRect();
        const s2 = (stageRect2.width || 280) / 280;
        const cx1 = creaseLine.x1 * s2, cy1 = creaseLine.y1 * s2;
        const cx2 = creaseLine.x2 * s2, cy2 = creaseLine.y2 * s2;

        const creaseOverlay = document.createElement('div');
        creaseOverlay.className = 'crease-overlay';
        creaseOverlay.innerHTML = `
            <svg class="crease-guide-svg" viewBox="0 0 ${stageRect2.width} ${stageRect2.height}" width="${stageRect2.width}" height="${stageRect2.height}">
                <line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}" class="crease-guide-line"/>
                <line x1="${cx1}" y1="${cy1}" x2="${cx1}" y2="${cy1}" class="crease-sealed-line"/>
            </svg>
            <div class="crease-hand" style="left:${cx1}px;top:${cy1}px;">✋</div>
            <div class="crease-label">Slide along the crease</div>`;
        stageEl.appendChild(creaseOverlay);

        const handEl = creaseOverlay.querySelector('.crease-hand');
        const sealedLine = creaseOverlay.querySelector('.crease-sealed-line');
        let creaseDown = false, creaseDone = false, lastT = 0, lastX = 0, lastY = 0, lastTick = 0;

        function creasePos(e) {
            const rect = creaseOverlay.getBoundingClientRect();
            const ex = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const ey = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            const dx = cx2 - cx1, dy = cy2 - cy1;
            let t = ((ex - cx1) * dx + (ey - cy1) * dy) / (dx * dx + dy * dy);
            t = Math.max(0, Math.min(1, t));
            return { t, x: cx1 + dx * t, y: cy1 + dy * t, ex, ey };
        }
        function creaseStart(e) {
            if (creaseDone) return;
            e.preventDefault();
            const p = creasePos(e);
            if (Math.hypot(p.x - cx1, p.y - cy1) > 60 && p.t < 0.15) return;   // start near the beginning
            creaseDown = true; lastT = performance.now(); lastX = p.ex; lastY = p.ey; lastTick = 0;
            handEl.style.transition = 'none';
            feel('tick'); startSlideNoise();
        }
        function creaseMove(e) {
            if (!creaseDown || creaseDone) return;
            e.preventDefault();
            const p = creasePos(e);
            const dustMultiplier = getIntensity().gain / 0.2;
            // The sound follows the finger's speed — still finger, silent paper.
            const now = performance.now(), dt = Math.max(8, now - lastT);
            const speed = Math.hypot(p.ex - lastX, p.ey - lastY) / dt;          // px per ms
            lastT = now; lastX = p.ex; lastY = p.ey;
            setSlideSpeed(Math.min(1, speed / 1.1));

            handEl.style.left = p.x + 'px'; handEl.style.top = p.y + 'px';
            const sw = 1.5 + p.t * 3.5 * dustMultiplier;
            sealedLine.setAttribute('stroke-width', sw);
            const r = Math.round(180 - p.t * 60), g = Math.round(140 - p.t * 40);
            sealedLine.setAttribute('stroke', `rgba(${r},${g},50,${(0.6 + p.t * 0.35).toFixed(2)})`);
            sealedLine.setAttribute('x2', p.x); sealedLine.setAttribute('y2', p.y);
            if (Math.random() < 0.35 * dustMultiplier) spawnDust(p.x, p.y, Math.ceil(2 * dustMultiplier));
            // 10–15 ms ticks along the slide
            if (p.t - lastTick >= 0.12) { lastTick = p.t; feel('tick'); }

            if (p.t > 0.9) {
                creaseDone = true; creaseDown = false;
                stopSlideNoise();
                handEl.style.transition = 'left 0.15s, top 0.15s';
                handEl.style.left = cx2 + 'px'; handEl.style.top = cy2 + 'px';
                sealedLine.setAttribute('x2', cx2); sealedLine.setAttribute('y2', cy2);
                spawnDust(cx2, cy2, Math.ceil(6 * dustMultiplier));
                handEl.classList.add('crease-hand-done');
                feel('lock', stageEl); playLock();
                setTimeout(() => { creaseOverlay.remove(); finishFold(); }, 450);
            }
        }
        function creaseEnd() {
            if (!creaseDown || creaseDone) return;
            creaseDown = false; stopSlideNoise();
            handEl.style.transition = 'left 0.3s cubic-bezier(0.22,1,0.36,1), top 0.3s cubic-bezier(0.22,1,0.36,1)';
            handEl.style.left = cx1 + 'px'; handEl.style.top = cy1 + 'px';
            sealedLine.setAttribute('x2', cx1); sealedLine.setAttribute('y2', cy1);
        }
        creaseOverlay.addEventListener('mousedown', creaseStart);
        creaseOverlay.addEventListener('mousemove', creaseMove);
        creaseOverlay.addEventListener('mouseup', creaseEnd);
        creaseOverlay.addEventListener('mouseleave', creaseEnd);
        creaseOverlay.addEventListener('touchstart', creaseStart, { passive: false });
        creaseOverlay.addEventListener('touchmove', creaseMove, { passive: false });
        creaseOverlay.addEventListener('touchend', creaseEnd);
        creaseOverlay.addEventListener('touchcancel', creaseEnd);

        function finishFold() {
            const isHatToDiamond = foldIndex === 5;
            const intensity = getIntensity();
            if (!isHatToDiamond) stageEl.classList.add('fold-animating');

            const flash = document.createElement('div');
            flash.className = 'fold-flash';
            stageEl.appendChild(flash);
            setTimeout(() => flash.remove(), 700);

            const svgInner = stageEl.querySelector('.origami-svg');
            if (isHatToDiamond) {
                svgInner.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                svgInner.style.transform = 'scaleX(0.35) scaleY(1.3)';
                setTimeout(() => { svgInner.outerHTML = buildOrigamiSVG(c, 6, 280, extras()); spawnParticles(stageEl, intensity.particles); }, 650);
            } else {
                setTimeout(() => { svgInner.outerHTML = buildOrigamiSVG(c, paperStage + 1, 280, extras()); spawnParticles(stageEl, intensity.particles); }, 450);
            }

            const advanceDelay = isHatToDiamond ? 1400 : 1000;
            const nextStep = NEXT_STEP_AFTER_FOLD[foldIndex];
            setTimeout(() => {
                if (foldFollowActive) onFoldBeatDone(foldIndex);
                else { step = nextStep; route(); }
            }, advanceDelay);
        }
    });
}

/* ============================================================
   RENDER: TWO-PICK QUESTION
   ============================================================ */
function renderQuestion(config) {
    const { scenario, question, options, dataKey, backStep, qNum, paperStage, info, sailLetter, sailTitle } = config;
    const c = colors();
    // Presenter-driven: the big screen owns pacing, so the phone drops its own
    // progress % and Back (which would desync it from the slide on screen).
    const followQ = askFollowActive;

    $app.innerHTML = `
    <div class="sail-screen">
        <div class="paper-zone">
            ${followQ ? '' : progressBarHTML(qNum - 1)}
        </div>
        <div class="content-zone">
            <div class="flex items-center gap-2 mb-3">
                <span class="font-black text-base" style="color:var(--accent-gold);">${sailLetter}</span>
                <span class="font-bold text-sm" style="color:var(--accent-gold-light);">${sailTitle}</span>
            </div>
            ${scenario ? `<div class="scenario-box mb-3">
                <p class="text-sm leading-relaxed font-serif italic" style="color:var(--text-secondary);">${scenario}</p>
            </div>` : ''}
            <h2 class="text-base font-bold mb-1 leading-snug" style="color:var(--text-primary);">${question}</h2>
            <p class="text-[10px] mb-4" style="color:var(--text-muted);">Select two. <span style="color:var(--accent-gold);font-weight:600;">1st choice</span> carries more weight than your <span style="color:#60a5fa;font-weight:600;">2nd</span>. Tap again to deselect.</p>
            <div class="space-y-2.5" id="opts">
                ${options.map((opt, i) => `<button class="option-btn fade-up stagger-${i+1}" data-key="${dataKey}" data-idx="${i}"><span class="option-badge"></span>${opt.text}</button>`).join('')}
            </div>
            ${info ? `<div class="info-panel p-3 mt-3"><p class="text-xs leading-relaxed" style="color:var(--text-secondary);">${info}</p></div>` : ''}
            <div class="nav-bar" id="navBar">
                ${followQ ? '' : `<button class="nav-btn secondary" id="backBtn" ${backStep === null ? 'disabled' : ''}>Back</button>`}
                <button class="nav-btn primary" id="nextBtn" disabled>Next</button>
            </div>
        </div>
    </div>`;

    const prevPick1Key = dataKey + '_pick1';
    const prevPick2Key = dataKey + '_pick2';
    let pick1 = D[prevPick1Key] !== undefined ? D[prevPick1Key] : null;
    let pick2 = D[prevPick2Key] !== undefined ? D[prevPick2Key] : null;
    updatePickStyles();

    function updatePickStyles() {
        document.querySelectorAll('.option-btn').forEach(b => {
            const idx = parseInt(b.dataset.idx);
            const badge = b.querySelector('.option-badge');
            b.classList.remove('pick-1', 'pick-2');
            badge.textContent = '';
            if (idx === pick1) { b.classList.add('pick-1'); badge.textContent = '1'; }
            else if (idx === pick2) { b.classList.add('pick-2'); badge.textContent = '2'; }
        });
        document.getElementById('nextBtn').disabled = (pick1 === null || pick2 === null);
    }

    document.querySelectorAll('.option-btn').forEach(b => {
        b.addEventListener('click', () => {
            const idx = parseInt(b.dataset.idx);
            haptic(15);
            if (pick1 === idx) { pick1 = pick2 !== null ? pick2 : null; pick2 = null; }
            else if (pick2 === idx) { pick2 = null; }
            else if (pick1 === null) { pick1 = idx; }
            else if (pick2 === null) { pick2 = idx; }
            else return;
            updatePickStyles();
        });
    });

    document.getElementById('backBtn')?.addEventListener('click', () => {
        if (backStep !== null) { step = backStep; route(); }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (pick1 === null || pick2 === null) return;
        haptic(40);
        D[prevPick1Key] = pick1;
        D[prevPick2Key] = pick2;
        const primaryOpt = options[pick1];
        applyPrimaryChoice(dataKey, primaryOpt);
        addMark(dataKey, primaryOpt.id);
        save();
        // Animate stamp press before advancing
        animateStampPress(dataKey, primaryOpt, paperStage, () => advanceFromQuestion(dataKey));
    });
}

function animateStampPress(questionKey, opt, paperStage, onComplete) {
    const stageEl = document.querySelector('.origami-stage.medium');
    if (!stageEl) { onComplete(); return; }

    const stamp = STAMP_MARKS[opt.id];
    if (!stamp) { onComplete(); return; }

    const slot = MARK_SLOTS[questionKey];
    if (!slot) { onComplete(); return; }

    // Determine position based on paper stage
    let pos;
    if (paperStage >= 8) pos = slot.boat;
    else if (paperStage >= 6) pos = slot.diamond;
    else pos = slot.paper;
    if (!pos) { onComplete(); return; }

    // Scale from viewBox coords to element size
    const rect = stageEl.getBoundingClientRect();
    const scale = rect.width / 280;
    const px = pos.x * scale;
    const py = pos.y * scale;
    const sz = stamp.small ? 36 : 50;
    const col = stamp.color || opt.color || '#8b3a3a';

    const el = document.createElement('div');
    el.className = 'stamp-fly-in';
    el.style.cssText = `position:absolute;left:${px}px;top:${py}px;width:${sz}px;height:${sz}px;z-index:30;pointer-events:none;`;
    el.innerHTML = `<svg viewBox="0 0 ${stamp.small ? 20 : 30} ${stamp.small ? 20 : 30}" width="${sz}" height="${sz}" style="color:${col};overflow:visible;">${stamp.svg}</svg>`;
    stageEl.appendChild(el);

    // Play stamp sound at "hit" moment (300ms in)
    setTimeout(() => {
        playStampSound();
        haptic(50);
    }, 300);

    setTimeout(() => {
        el.remove();
        onComplete();
    }, 1000);
}

function addMark(questionKey, id) {
    // Remove any existing mark for this question key (in case of back-navigation)
    D.marks = (D.marks || []).filter(m => m.questionKey !== questionKey);
    D.marks.push({ id, questionKey });
}

function applyPrimaryChoice(dataKey, opt) {
    switch (dataKey) {
        case 'S':
            D.stewardshipPick1 = opt.id;
            D.hullColor = opt.color;
            break;
        case 'A':
            D.appliedPick1 = opt.id;
            D.keelColor = opt.color;
            break;
        case 'A_sub':
            D.subjectPick1 = opt.id;
            break;
        case 'I':
            D.internationalPick1 = opt.id;
            D.sailColor = opt.color;
            D.sailGradient = opt.gradient || null;
            break;
        case 'I_sub':
            D.industryPick1 = opt.id;
            break;
        case 'L':
            D.learningPick1 = opt.id;
            D.flagColor = opt.color;
            D.flagIcon = opt.icon || '';
            break;
    }
}

function advanceFromQuestion(dataKey) {
    const map = { S: 4, A: 7, A_sub: 8, I: 11, I_sub: 12, L: 15 };
    step = map[dataKey];
    route();
}

// --- Step-specific question renders ---
function renderChooseS() {
    const d = SAIL_DATA.S;
    renderQuestion({ scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'S', backStep: 2, qNum: 1, paperStage: 2,
        info: d.info, sailLetter: d.letter, sailTitle: d.title });
}
function renderChooseA() {
    const d = SAIL_DATA.A;
    renderQuestion({ scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'A', backStep: 5, qNum: 2, paperStage: 4,
        info: d.info, sailLetter: d.letter, sailTitle: d.title });
}
function renderChooseASub() {
    const d = SAIL_DATA.A;
    renderQuestion({ scenario: d.subScenario, question: d.subQuestion, options: d.subOptions,
        dataKey: 'A_sub', backStep: 6, qNum: 3, paperStage: 4,
        info: null, sailLetter: d.letter, sailTitle: d.title });
}
function renderChooseI() {
    const d = SAIL_DATA.I;
    renderQuestion({ scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'I', backStep: 9, qNum: 4, paperStage: 6,
        info: d.info, sailLetter: d.letter, sailTitle: d.title });
}
function renderChooseISub() {
    const d = SAIL_DATA.I;
    renderQuestion({ scenario: d.subScenario, question: d.subQuestion, options: d.subOptions,
        dataKey: 'I_sub', backStep: 10, qNum: 5, paperStage: 6,
        info: null, sailLetter: d.letter, sailTitle: d.title });
}
function renderChooseL() {
    const d = SAIL_DATA.L;
    renderQuestion({ scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'L', backStep: 13, qNum: 6, paperStage: 8,
        info: d.info, sailLetter: d.letter, sailTitle: d.title });
}

/* ============================================================
   RENDER: ASPIRATION
   ============================================================ */
function renderAspiration() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen">
        <div class="paper-zone">
            ${progressBarHTML(TOTAL_QUESTIONS)}
            <div class="origami-stage medium" id="aspirationBoat">
                ${buildOrigamiSVG(c, 9, 280, extras())}
            </div>
        </div>
        <div class="content-zone text-center">
            <h2 class="font-serif text-xl mb-2" style="color:var(--accent-gold);">Name Your Vessel</h2>
            <p class="text-sm mb-4" style="color:var(--text-secondary);">A word or phrase to christen your vessel. Make it yours.</p>
            <input type="text" id="aspirationInput" maxlength="15"
                class="w-full p-3 text-center text-xl font-black outline-none rounded-xl mb-4"
                style="background:var(--bg-card);color:var(--text-primary);border:2px solid var(--accent-gold);caret-color:var(--accent-gold);"
                placeholder="e.g. COURAGE">
            <div class="nav-bar">
                ${(followMode || soloMode) ? '' : `<button class="nav-btn secondary" id="backBtn">Back</button>`}
                <button class="nav-btn primary" id="launchBtn">Launch</button>
            </div>
        </div>
    </div>`;
    document.getElementById('backBtn')?.addEventListener('click', () => { step = 14; route(); });
    // Live aspiration on hull
    const aspirationBoat = document.getElementById('aspirationBoat');
    document.getElementById('aspirationInput').addEventListener('input', (e) => {
        D.aspiration = e.target.value.trim();
        aspirationBoat.innerHTML = buildOrigamiSVG(c, 9, 280, extras());
    });
}

/* ============================================================
   RENDER: PROCESSING — "Charting your course..."
   ============================================================ */
/* ============================================================
   GRAND REVEAL — 3-ACT CINEMATIC
   Merges processing + archetype reveal into one dramatic sequence.
   Act 1 (0–2.5s): Boat sails in from left with wake particles
   Act 2 (2.5–4.5s): Light bloom, letter-by-letter name, particle burst + screen shake
   Act 3 (4.5–5.5s): Quote settles, waves calm, button appears
   ============================================================ */
function renderProcessing() {
    const archetype = computeArchetype();
    const ac = archetype.color || '#FFE200';
    const c = colors();

    // Build letter-by-letter name HTML
    const nameChars = archetype.name.split('').map((ch, i) => {
        if (ch === ' ') return '<span style="width:8px;display:inline-block;"> </span>';
        return `<span class="reveal-char" style="animation-delay:${2.5 + i * 0.07}s; color:${ac};">${ch}</span>`;
    }).join('');

    $app.innerHTML = `
    <div class="archetype-reveal">
        <div class="reveal-glow"></div>
        <div class="reveal-voyage-stage origami-stage medium mb-6" id="revealBoatStage">
            ${buildOrigamiSVG(c, 9, 280, extras())}
        </div>
        <p class="reveal-preamble text-xs uppercase tracking-[0.3em] mb-4" style="color:var(--text-muted);">You are</p>
        <h1 class="archetype-name-staged">${nameChars}</h1>
        <p class="archetype-quote-staged font-serif italic text-sm mt-6 max-w-xs text-center px-6" style="color:var(--text-secondary);" id="revealQuote">${archetype.quote}</p>
        <button id="revealContinue" class="btn-start mt-10" style="opacity:0; transition: opacity 0.5s;">See Your Card</button>
    </div>`;

    // ACT 1: Boat sails in — wake particles trail behind
    const boatStage = document.getElementById('revealBoatStage');
    if (boatStage) {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const w = document.createElement('div');
                w.className = 'reveal-wake';
                w.style.setProperty('--wx', (-20 - Math.random() * 40) + 'px');
                w.style.setProperty('--wy', (Math.random() - 0.5) * 20 + 'px');
                w.style.left = '30%'; w.style.top = '70%';
                boatStage.appendChild(w);
                setTimeout(() => w.remove(), 1500);
            }, 300 + i * 200);
        }
    }

    // ACT 2: At 2.5s — reveal sound, screen shake, particle burst, wave surge
    setTimeout(() => {
        playRevealSound();
        waveSurge();
        $app.classList.add('screen-shake');
        setTimeout(() => $app.classList.remove('screen-shake'), 400);
        if (boatStage) {
            boatStage.classList.remove('reveal-voyage-stage');
            boatStage.classList.add('reveal-boat-arrived');
            spawnParticles(boatStage, 16);
        }
    }, 2500);

    // ACT 3: At 4.5s — quote fades in, button appears
    setTimeout(() => {
        const q = document.getElementById('revealQuote');
        if (q) q.classList.add('reveal-quote-visible');
    }, 4500);
    setTimeout(() => {
        const btn = document.getElementById('revealContinue');
        if (btn) btn.style.opacity = '1';
    }, 5200);

    document.getElementById('revealContinue').addEventListener('click', () => {
        haptic(40);
        step = 18;
        route();
    });
}

function renderArchetypeReveal() {
    // Redirect — Grand Reveal handles both processing + reveal in one sequence
    renderProcessing();
}

/* ============================================================
   RENDER: MEMENTO CARD
   ============================================================ */
/* ============================================================
   THE COMPASS CARD — a proof object, and the record of the voyage.
   The boat first, large, wearing the stamps of every choice made tonight.
   Then the word, who they are in the Hive (quote, persona), the four
   S·A·I·L rows with what they chose and discovered, recommended pathways,
   the port stamp, "Boat N of M" with the fleet strip and them ringed, the
   compass rose, the school QR, the booth if-then, the vision line.
   Share-first; press-and-hold fallback; the PNG is drawn in-house.
   ============================================================ */
const EVENT_LINE = 'Set sail from the Hive · Beatty Open House 2026';
const BOOTH_LINE = 'Show this card at the Hive booth.';
const VISION_LINE = 'Harmonising Hearts · Thriving Together';
const FOLDED_LINE = 'You folded it. You named it. You set it sailing.';
const QR_URL = '../joinbtyqr.png';
const CREST_BIG = 'crest-640.png';
// Rough bearings from Singapore, for the rose.
const DEST_BEARING = { GeoBali: 150, NZ: 140, Korea: 28, MiharaJapan: 42, MutsuzawaJapan: 42, Estonia: 330 };
let cardFile = null, cardRendering = null;

/* Who you are in the Hive — the eight bees, in Beatty's voice. */
const BEE_PROFILES = {
    'The Innovator':            { color: '#FFE200', quote: 'Machine Learning opened my eyes to what’s possible. Now I use data to build solutions for real problems.', persona: 'Driven by technology — you use data and problem-solving to build new and better ways of doing things.', recommended: ['A.I. @ South Korea', 'Rockwell Automation attachment', 'ALP · Think.Create.Innovate'], s: 'challenge', a: 'ai' },
    'The Global Explorer':      { color: '#2BB3A8', quote: 'Studying abroad taught me that leadership transcends borders. Every culture has wisdom to share.', persona: 'Deep cultural curiosity — you understand the world by going out to meet it.', recommended: ['Geography @ Bali', 'Social Sciences @ Japan', 'NEXUS@BTY exchanges'], s: 'inspire', a: null },
    'The Industry Trailblazer': { color: '#F28C28', quote: 'The best classroom I ever had was a factory floor.', persona: 'You learn by doing — hands on machines, systems and real work, and you bring it all back to school.', recommended: ['Makita Mechatronics attachment', 'PIL Maritime attachment', 'Rockwell Automation'], s: 'model', a: 'robotics' },
    'The Community Steward':    { color: '#F26D8B', quote: 'Strength isn’t standing alone — it’s making sure nobody has to.', persona: 'You lead with heart. Empathy and mindfulness guide you — you build trust before you build plans.', recommended: ['Leaders for Life Programme', 'Peer Support · Values-in-Action', 'Student Council'], s: 'enable', a: null },
    'The Creative Artist':      { color: '#B57BEA', quote: 'Give me a blank canvas and I’ll show you the future.', persona: 'You think in sketches, prototypes and stories. Technology is your medium, not your master.', recommended: ['Berita Harian · Tamil Murasu newsrooms', 'Design & Technology', 'Performing & Visual Arts CCAs'], s: 'inspire', a: 'creative' },
    'The STEM Futurist':        { color: '#7FD3F7', quote: 'Every experiment is a question the world hasn’t answered yet.', persona: 'Energised by science and systems — you build tomorrow’s infrastructure one prototype at a time.', recommended: ['A*STAR Research attachment', 'STEM @ Japan', 'ALP · Machine Learning'], s: 'challenge', a: 'robotics' },
    'The Voice Amplifier':      { color: '#EC3237', quote: 'A team becomes unstoppable when every person knows they matter.', persona: 'You lift every voice around you — by vision, by words, by making sure the quiet ones are heard.', recommended: ['Journalism @ Berita Harian', 'Debate & Public Speaking', 'Student Leadership'], s: 'encourage', a: 'creative' },
    'The Eco-Strategist':       { color: '#B5D334', quote: 'We don’t inherit the Earth from our ancestors; we borrow it from our children.', persona: 'Passionate about sustainability, green innovation and servant leadership.', recommended: ['Sustainability @ New Zealand', 'Geography @ Bali', 'Green Engineering'], s: 'enable', a: 'green' },
};
function beeProfile() { return BEE_PROFILES[D.bee] || { color: '#FFE200', quote: 'Non Vi Sed Arte — not by force, but by skill.', persona: 'A Beattyian: every bee has a place in the Hive, and a course of its own.', recommended: ['NEXUS@BTY exchanges', 'Industry attachments', 'Leaders for Life Programme'], s: null, a: null }; }

/* The boat wears its voyage: every choice made tonight becomes a stamp. */
const DEST_STAMP = { GeoBali: 'bali', NZ: 'nz', Korea: 'korea', MiharaJapan: 'japan', MutsuzawaJapan: 'japan', Estonia: 'estonia' };
const IND_STAMP = { Rockwell: 'rockwell', PIL: 'pil', ASTAR: 'astar', Journalism: 'press', TamilMurasu: 'press', Makita: 'makita' };
const PULSE_STAMP = { 'On fire!': 'resilience', 'Excited!': 'adaptability', 'Enjoying it': 'empathy', 'Tell me more': 'mindfulness' };
function stampBoat() {
    const prof = beeProfile(); const marks = [];
    if (prof.s) marks.push({ id: prof.s, questionKey: 'S' });
    if (prof.a) marks.push({ id: prof.a, questionKey: 'A' });
    if (D.global && DEST_STAMP[D.global.id]) marks.push({ id: DEST_STAMP[D.global.id], questionKey: 'I' });
    if (D.local && IND_STAMP[D.local.id]) marks.push({ id: IND_STAMP[D.local.id], questionKey: 'I_sub' });
    if (D.pulse && PULSE_STAMP[D.pulse]) marks.push({ id: PULSE_STAMP[D.pulse], questionKey: 'L' });
    D.marks = marks; save();
}

function destBearing() { return (D.global && DEST_BEARING[D.global.id]) || 0; }
function shortDest(t) { return String(t || '').replace(/\s*\(.*?\)\s*/g, '').trim(); }
function pollOf(id) { return (D.polls || {})[id]; }
function insightOf(id) { const p = pollOf(id); return p && p.insight ? String(p.insight).replace(/^(Correct!|Good guess!|A trick!)\s*/, '') : ''; }

/* The four S·A·I·L rows — what was chosen and discovered in each chapter. */
function sailRows() {
    const prof = beeProfile();
    const g = D.global ? shortDest(D.global.text) : null, l = D.local ? shortDest(D.local.text) : null;
    const dream = pollOf('dream_poll'), cca = pollOf('cca'), count = pollOf('nexus_count_v2'), ind = pollOf('industry');
    return [
        { k: 'S', title: 'Stewardship', main: `${prof.s ? LABELS.stewardship[prof.s] + ' · ' : ''}Leaders for Life`, sub: dream ? `${dream.correct ? '✓ ' : ''}${insightOf('dream_poll')}` : 'D.R.E.A.M. — the values every Beattyian sails under.' },
        { k: 'A', title: 'Applied Learning', main: prof.a ? `Drawn to ${LABELS.applied[prof.a]}${cca && cca.choiceText ? ' · you said ' + cca.choiceText + ' find a CCA they love' : ''}` : (cca && cca.choiceText ? `You said ${cca.choiceText} of Beattyians find a CCA they love` : 'Think.Create.Innovate — STEM & Machine Learning'), sub: cca ? insightOf('cca') : 'Every passion has a home here.' },
        { k: 'I', title: 'International & Industry', main: g || l ? `${g ? 'Exchange · ' + g : ''}${g && l ? '  ·  ' : ''}${l ? 'Attachment · ' + l : ''}` : 'Six exchanges and six attachments to choose from', sub: count ? insightOf('nexus_count_v2') : 'NEXUS@BTY takes learning beyond the classroom.' },
        { k: 'L', title: 'Learning to Live, Learn & Love', main: `${D.pulse ? 'Tonight: ' + D.pulse + '  ·  ' : ''}Sailing toward ${D.aspiration || 'your aspiration'}`, sub: ind ? insightOf('industry') : 'Non Vi Sed Arte — not by force, but by skill.' },
    ];
}

/* Where am I in the fleet? Read x_boats once; rank the launched by launch time. */
function whenDb(ms = 10000) {          // Firebase loads after the first paint; a returning phone renders its card before that
    return new Promise(res => { const t0 = Date.now(); (function tick() { if (db && getDocs && auth?.currentUser) return res(true); if (Date.now() - t0 > ms) return res(false); setTimeout(tick, 200); })(); });
}
async function loadFleetRank() {
    if (!(await whenDb())) return null;
    try {
        const snap = await getDocs(collection(db, 'x_boats'));
        const boats = [];
        snap.forEach(d => { const b = d.data() || {}; if (b.launched) boats.push({ uid: d.id, at: b.launchedAt || (b.timestamp && b.timestamp.toMillis ? b.timestamp.toMillis() : 0), sail: b.sailColor || '#F5F0E8' }); });
        boats.sort((a, b) => a.at - b.at);
        const me = boats.findIndex(b => b.uid === auth.currentUser.uid);
        if (me < 0) return null;
        const W = 20, lo = Math.max(0, me - W), hi = Math.min(boats.length, me + W + 1);
        D.boatNo = me + 1; D.fleetTotal = boats.length;
        D.fleetStrip = boats.slice(lo, hi).map(b => b.sail); D.stripMe = me - lo; save();
        return { n: D.boatNo, total: D.fleetTotal };
    } catch (e) { return null; }
}
function fleetStripHTML() {
    const strip = D.fleetStrip || [D.sailColor || '#F5F0E8']; const me = D.stripMe ?? 0;
    return strip.map((col, i) => `<i class="cc-sail${i === me ? ' me' : ''}" style="--c:${col}"></i>`).join('');
}
function fleetLabel() { return D.boatNo && D.fleetTotal ? `Boat ${D.boatNo} of ${D.fleetTotal}` : (D.launched ? 'In the fleet' : 'Ready to sail'); }

function compassRoseSVG(size, bearing, gold = '#FFE200') {
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 34 : 60; pts.push(`${(50 + r * Math.sin(a)).toFixed(1)},${(50 - r * Math.cos(a)).toFixed(1)}`); }
    const star = pts.map((p, i) => { const q = pts[(i + 1) % 8]; return `<path d="M50,50 L${p} L${q} Z" fill="${i % 2 ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.55)'}"/>`; }).join('');
    return `<svg viewBox="-12 -12 124 124" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="58" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1" stroke-dasharray="2 3"/>
        ${star}
        <g transform="rotate(${bearing} 50 50)"><path d="M50,-4 L57,50 L50,44 L43,50 Z" fill="${gold}"/><path d="M50,104 L57,50 L50,56 L43,50 Z" fill="rgba(255,255,255,.35)"/></g>
        <circle cx="50" cy="50" r="4.5" fill="#000C53" stroke="${gold}" stroke-width="1.5"/>
        <text x="50" y="-9" text-anchor="middle" font-size="9" font-weight="700" fill="rgba(255,255,255,.75)" font-family="Georgia,serif">N</text>
    </svg>`;
}

function renderMemento() {
    stopAmbient(); hideCornerBoat(); stampBoat();
    const c = colors(); const gold = '#FFE200';
    const sail = D.sailColor || gold;
    const prof = beeProfile();
    const word = D.aspiration || 'Beattyian';
    const g = D.global ? shortDest(D.global.text) : null, l = D.local ? shortDest(D.local.text) : null;
    const rows = sailRows();
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone pt-4" style="max-width:400px;">
            <div class="compass-card" id="memento-card" style="--sail:${sail};--bee:${prof.color}">
                <div class="cc-paper"></div>
                <div class="cc-tape"></div>
                <header class="cc-head">
                    <img src="${LOGO_URL}" alt="" onerror="this.style.display='none'">
                    <div><b>Beatty Secondary</b><small>Compass Card · Open House 2026</small></div>
                    <span class="cc-bee">${D.beeIcon || '🐝'}</span>
                </header>
                <div class="cc-boat" id="ccBoat">
                    <div class="cc-boat-tilt">${buildOrigamiSVG(c, 9, 300, { ...extras(), aspiration: '' })}<div class="hand-word cc-hand" style="font-size:${Math.max(15, Math.min(24, 190 / Math.max(6, word.length)))}px">${word}</div></div>
                    <div class="cc-water"></div>
                </div>
                <div class="cc-word"><small>I'm sailing toward</small><h1>${word}</h1><p>${FOLDED_LINE}</p></div>
                <div class="cc-id">
                    <div class="cc-id-name"><span>${D.beeTag || 'A Beattyian'}</span><b style="color:var(--bee)">${D.bee || 'In the Hive'}</b></div>
                    <p class="cc-quote">“${prof.quote}”</p>
                    <p class="cc-persona">${prof.persona}</p>
                </div>
                <div class="cc-rows">
                    ${rows.map(r => `<div class="cc-sail-row"><i>${r.k}</i><div><b>${r.title}</b><span>${r.main}</span><small>${r.sub}</small></div></div>`).join('')}
                </div>
                <p class="cc-rec"><b>Recommended for you</b>${prof.recommended.map(r => `<span>${r}</span>`).join('')}</p>
                <div class="cc-row">
                    <div class="cc-stamp">${g || l ? `<b>${g || l}</b>${g && l ? `<i>${l}</i>` : ''}` : '<b>Beatty</b><i>every pathway</i>'}<em>port of call</em></div>
                    <div class="cc-fleet">
                        <div class="cc-fleet-lab"><span id="ccFleetN">${fleetLabel()}</span></div>
                        <div class="cc-strip" id="ccStrip">${fleetStripHTML()}</div>
                    </div>
                    <div class="cc-rose">${compassRoseSVG(74, destBearing(), gold)}</div>
                </div>
                <footer class="cc-foot">
                    <img class="cc-qr" src="${QR_URL}" alt="" onerror="this.style.display='none'">
                    <div><b>${EVENT_LINE}</b><span>${BOOTH_LINE}</span><small>${VISION_LINE}</small></div>
                </footer>
            </div>
            <button id="shareCardBtn" class="nav-btn primary w-full mt-4 text-base uppercase tracking-wide">${navigator.share ? 'Share my card' : 'Save my card'}</button>
            ${navigator.share ? '<button id="downloadCardBtn" class="nav-btn secondary w-full mt-2 text-sm uppercase tracking-wide">Save image</button>' : ''}
            <p class="text-[11px] mt-3 text-center" style="color:var(--text-secondary);">${BOOTH_LINE} ⛵</p>
            <button id="resetBtn" class="mt-3 w-full text-sm underline pb-4" style="color:var(--text-muted);">Start over</button>
        </div>
    </div>`;
    // Rank in the fleet (once online), then pre-render the PNG so a share can fire inside the tap.
    loadFleetRank().then(r => { const n = document.getElementById('ccFleetN'), s = document.getElementById('ccStrip'); if (r && n) n.textContent = fleetLabel(); if (r && s) s.innerHTML = fleetStripHTML(); }).finally(() => { cardFile = null; cardRendering = renderCardPNG().then(f => { cardFile = f; return f; }).catch(() => null); });
    const boat = document.querySelector('.cc-boat-tilt'); if (boat) enableTilt(boat);
}

/* ---------- Draw the card as a 1080×2160 PNG, in-house (no html2canvas) ---------- */
function loadImg(src) { return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
function svgToImg(svg) { return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function wrapText(ctx, text, x, y, maxW, lineH, maxLines = 2) {   // returns the y after the last line
    const words = String(text || '').split(/\s+/); let line = '', lines = [];
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); let last = lines[maxLines - 1]; while (ctx.measureText(last + '…').width > maxW && last.length) last = last.slice(0, -1); lines[maxLines - 1] = last.replace(/[ ,.·]+$/, '') + '…'; }
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
    return y + lines.length * lineH;
}
async function renderCardPNG() {
    const W = 1080, H = 2160, gold = '#FFE200', sail = D.sailColor || gold, word = D.aspiration || 'Beattyian';
    const prof = beeProfile(); const rows = sailRows();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    const c = colors();
    const [boatImg, crest, qr, rose] = await Promise.all([
        svgToImg(buildOrigamiSVG(c, 9, 720, { ...extras(), aspiration: '', gradientId: 'cardSail' })), loadImg(CREST_BIG), loadImg(QR_URL),
        svgToImg(compassRoseSVG(210, destBearing(), gold))]);
    const SANS = 'Calibri, "Segoe UI", system-ui, sans-serif';
    // Navy ground with a warm glow behind the boat
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#040a33'); bg.addColorStop(0.45, '#0a1650'); bg.addColorStop(1, '#061027'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 500); glow.addColorStop(0, 'rgba(255,226,0,.20)'); glow.addColorStop(1, 'rgba(255,226,0,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    // Washi grain + a crease
    ctx.fillStyle = 'rgba(255,255,255,.045)'; for (let i = 0; i < 10000; i++) { ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 1076); ctx.lineTo(W, 1050); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,226,0,.35)'; ctx.lineWidth = 3; roundRect(ctx, 22, 22, W - 44, H - 44, 44); ctx.stroke();
    // Washi tape (navy + yellow), top right
    ctx.save(); ctx.translate(W - 130, 92); ctx.rotate(0.14); ctx.globalAlpha = .92;
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#000C53' : gold; ctx.fillRect(-150 + i * 25, -20, 25, 40); } ctx.restore();
    // Head
    if (crest) ctx.drawImage(crest, 78, 118, 96, 118);
    ctx.fillStyle = '#fff'; ctx.font = '700 44px Georgia, serif'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Beatty Secondary', 196, 176);
    ctx.fillStyle = 'rgba(255,226,0,.9)'; ctx.font = `600 22px ${SANS}`; ctx.fillText('COMPASS CARD  ·  OPEN HOUSE 2026', 198, 214);
    // The boat, at the ¾ angle, on water, wearing its stamps
    const bw = 640, by = 232;
    const water = ctx.createRadialGradient(W / 2, by + 610, 20, W / 2, by + 610, 340); water.addColorStop(0, 'rgba(127,211,247,.45)'); water.addColorStop(.6, 'rgba(18,41,156,.25)'); water.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = water; ctx.beginPath(); ctx.ellipse(W / 2, by + 610, 350, 52, 0, 0, Math.PI * 2); ctx.fill();
    if (boatImg) { ctx.save(); ctx.translate(W / 2, by + bw / 2); ctx.transform(0.95, -0.05, 0.03, 1, 0, 0); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 24; ctx.drawImage(boatImg, -bw / 2, -bw / 2, bw, bw); ctx.restore(); }
    // The word in handwriting on the hull (right of the stamps)
    ctx.save(); ctx.translate(W / 2 + 28, by + 528); ctx.rotate(-0.035); ctx.fillStyle = '#fff6c8'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
    ctx.font = `600 ${Math.max(36, Math.min(54, 430 / Math.max(6, word.length)))}px ${HAND_FONT}`; ctx.textAlign = 'center'; ctx.fillText(word, 0, 0); ctx.restore();
    // "I'm sailing toward" + the word + the folded line
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = `600 22px ${SANS}`; ctx.fillText("I ' M   S A I L I N G   T O W A R D", W / 2, 906);
    ctx.fillStyle = gold; ctx.font = `700 ${Math.max(56, Math.min(92, 960 / Math.max(6, word.length)))}px Georgia, serif`; ctx.fillText(word, W / 2, 994);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `italic 24px Georgia, serif`; ctx.fillText(FOLDED_LINE, W / 2, 1038);
    // Who you are in the Hive (fixed slots: a two-line quote, a one-line persona)
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = `700 20px ${SANS}`; ctx.fillText((D.beeTag || 'A BEATTYIAN').toUpperCase(), 90, 1098);
    ctx.fillStyle = prof.color; ctx.font = '700 40px Georgia, serif'; ctx.fillText(D.bee || 'In the Hive', 90, 1140);
    ctx.fillStyle = '#fff'; ctx.font = 'italic 26px Georgia, serif'; wrapText(ctx, '“' + prof.quote + '”', 90, 1182, W - 180, 33, 2);
    ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.font = `22px ${SANS}`; wrapText(ctx, prof.persona, 90, 1262, W - 180, 28, 1);
    // The four S·A·I·L rows
    let ry = 1330;
    rows.forEach(r => {
        ctx.fillStyle = 'rgba(255,255,255,.05)'; roundRect(ctx, 76, ry - 34, W - 152, 90, 16); ctx.fill();
        ctx.fillStyle = 'rgba(255,226,0,.14)'; ctx.beginPath(); ctx.arc(120, ry + 11, 25, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = gold; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(120, ry + 11, 25, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = gold; ctx.font = '900 28px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(r.k, 120, ry + 21); ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,226,0,.85)'; ctx.font = `700 16px ${SANS}`; ctx.fillText(r.title.toUpperCase(), 168, ry - 8);
        ctx.fillStyle = '#fff'; ctx.font = `600 24px ${SANS}`; wrapText(ctx, r.main, 168, ry + 19, W - 268, 28, 1);
        ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = `19px ${SANS}`; wrapText(ctx, r.sub, 168, ry + 45, W - 268, 24, 1);
        ry += 100;
    });
    // Recommended for you (two lines at most)
    ctx.fillStyle = 'rgba(255,226,0,.85)'; ctx.font = `700 16px ${SANS}`; ctx.fillText('RECOMMENDED FOR YOU', 90, 1756);
    ctx.fillStyle = '#fff'; ctx.font = `600 22px ${SANS}`; wrapText(ctx, prof.recommended.join('   ·   '), 90, 1786, W - 180, 27, 2);
    // Port stamp · Boat N of M + strip · compass rose
    const rowY = 1908;
    const g = D.global ? shortDest(D.global.text) : null, l = D.local ? shortDest(D.local.text) : null;
    ctx.save(); ctx.translate(200, rowY); ctx.rotate(-0.2); ctx.strokeStyle = sail; ctx.lineWidth = 5; ctx.setLineDash([12, 9]); ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(0, 0, 76, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = sail; ctx.textAlign = 'center'; ctx.font = '700 25px Georgia, serif'; ctx.fillText(g || l || 'Beatty', 0, g && l ? -6 : 7, 140);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = 'italic 17px Georgia, serif'; if (g && l) ctx.fillText(l, 0, 22, 140);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `600 12px ${SANS}`; ctx.fillText('P O R T   O F   C A L L', 0, 54); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '700 34px Georgia, serif'; ctx.fillText(fleetLabel(), W / 2, rowY - 16);
    const strip = D.fleetStrip || [sail], me = D.stripMe ?? 0, sw = Math.min(28, 360 / strip.length), sx0 = W / 2 - sw * strip.length / 2;
    strip.forEach((col, i) => { const x = sx0 + i * sw + sw / 2, y = rowY + 36; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x + 9, y + 5); ctx.lineTo(x - 9, y + 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#4a3728'; ctx.fillRect(x - 11, y + 7, 22, 4);
        if (i === me) { ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 2, 19, 0, Math.PI * 2); ctx.stroke(); } });
    if (rose) ctx.drawImage(rose, W - 300, rowY - 92, 184, 184);
    // Footer: QR + lines
    if (qr) { ctx.fillStyle = '#fff'; roundRect(ctx, W - 262, 2004, 172, 172, 16); ctx.fill(); ctx.drawImage(qr, W - 252, 2014, 152, 152); }
    ctx.textAlign = 'left'; ctx.fillStyle = gold; ctx.font = '700 25px Georgia, serif'; ctx.fillText(EVENT_LINE, 90, 2046, 690);
    ctx.fillStyle = '#fff'; ctx.font = `600 25px ${SANS}`; ctx.fillText(BOOTH_LINE, 90, 2090, 690);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = 'italic 21px Georgia, serif'; ctx.fillText(VISION_LINE, 90, 2128, 690);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return new File([blob], 'Beatty-Compass-Card.png', { type: 'image/png' });
}

/* Share first (inside the tap when the PNG is ready), then a full-screen image to press-and-hold, then download. */
function shareCard() {
    const btn = document.getElementById('shareCardBtn');
    const text = `I'm sailing toward ${D.aspiration || 'my dream'} ⛵ Beatty Open House 2026`;
    const tryShare = (file) => {
        if (file && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
            return navigator.share({ files: [file], title: 'My Beatty Compass Card', text }).then(() => true).catch(e => (e && e.name === 'AbortError') ? true : false);
        }
        return Promise.resolve(false);
    };
    feel('tick');
    if (cardFile) { tryShare(cardFile).then(done => { if (!done) showSaveOverlay(cardFile); }); return; }
    if (btn) { btn.textContent = 'Preparing…'; btn.disabled = true; }
    (cardRendering || renderCardPNG()).then(f => { if (btn) { btn.textContent = navigator.share ? 'Share my card' : 'Save my card'; btn.disabled = false; } if (!f) { showSaveOverlay(null); return; } cardFile = f; tryShare(f).then(done => { if (!done) showSaveOverlay(f); }); });
}
function saveCard() {
    const btn = document.getElementById('downloadCardBtn');
    if (btn) { btn.textContent = 'Preparing…'; btn.disabled = true; }
    (cardFile ? Promise.resolve(cardFile) : (cardRendering || renderCardPNG())).then(f => { if (btn) { btn.textContent = 'Save image'; btn.disabled = false; } cardFile = f; showSaveOverlay(f); });
}
function showSaveOverlay(file) {
    const url = file ? URL.createObjectURL(file) : null;
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const ov = document.createElement('div'); ov.className = 'save-ov';
    ov.innerHTML = `
        <p class="save-hint">${url ? (isIOS ? 'Press and hold the card → <b>Save to Photos</b>' : 'Press and hold to save · or tap Download') : 'Take a screenshot to keep your card'}</p>
        ${url ? `<img src="${url}" alt="Your Beatty Compass Card">` : ''}
        <div class="save-actions">${url && !isIOS ? `<a class="nav-btn primary" download="Beatty-Compass-Card.png" href="${url}">Download</a>` : ''}<button class="nav-btn secondary" id="saveDone">Done</button></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('on'));
    ov.querySelector('#saveDone').onclick = () => { ov.classList.remove('on'); setTimeout(() => { ov.remove(); if (url) URL.revokeObjectURL(url); }, 300); };
}
let resetArmed = null;
function startOver(btn) {
    if (!resetArmed) {
        resetArmed = setTimeout(() => { resetArmed = null; if (btn && btn.isConnected) btn.textContent = 'Start over'; }, 4000);
        if (btn) btn.textContent = 'Tap again to erase your card and start over';
        feel('tick'); return;
    }
    clearTimeout(resetArmed); resetArmed = null;
    localStorage.removeItem(SK);
    D = { marks: [] }; followMode = false; soloMode = false; currentView = null; cardFile = null;
    renderBoard();
}

/* ============================================================
   LAUNCH HANDLER
   ============================================================ */
// Celebratory confetti at the "Set Sail" moment (Beatty navy/gold/red).
function burstConfetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const cols = ['#FFE200', '#EC3237', '#12299c', '#ffffff', '#FFF3A0'];
    for (let i = 0; i < 44; i++) {
        const p = document.createElement('div');
        const sz = 7 + Math.random() * 7;
        p.style.cssText = `position:fixed;top:-12px;left:${Math.random()*100}%;width:${sz}px;height:${sz}px;background:${cols[Math.random()*cols.length|0]};border-radius:${Math.random()>.5?'50%':'2px'};z-index:9999;pointer-events:none`;
        p.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translateY(${innerHeight+40}px) rotate(${720*Math.random()}deg)`,opacity:0}],{duration:2200+Math.random()*1600,easing:'cubic-bezier(.4,0,1,1)'});
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4000);
    }
}

// The "Set Sail" departure — your boat sails off the phone toward the horizon
// to join the collective fleet on the big screen. Coherent with fleet arrival.
function setSailTransition(onDone) {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    const c = colors();
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 30%, rgba(255,226,0,0.16), transparent 55%), linear-gradient(180deg,#00061f 0%,#071133 45%,#0a1650 100%);overflow:hidden';
    ov.innerHTML = `
        <div style="position:absolute;top:30%;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,rgba(255,226,0,0.65),transparent);box-shadow:0 0 26px rgba(255,226,0,0.5);"></div>
        <div id="sailBoat" style="width:210px;height:210px;filter:drop-shadow(0 0 14px rgba(255,226,0,0.35));">${buildOrigamiSVG(c, 8, 210, extras())}</div>
        <p style="font-family:'Georgia',serif;color:var(--accent-gold);font-size:1.5rem;margin-top:6px;">Setting sail…</p>
        <p style="color:var(--text-secondary);font-size:0.82rem;margin-top:6px;letter-spacing:0.24em;text-transform:uppercase;">${(D.aspiration||'').toUpperCase()}</p>
        <p style="color:var(--text-muted);font-size:0.7rem;margin-top:14px;">Look up — your boat is joining the fleet.</p>`;
    document.body.appendChild(ov);
    const boat = ov.querySelector('#sailBoat');
    if (!reduce) boat.animate(
        [{transform:'translateY(60px) scale(1)', opacity:1}, {transform:'translateY(-32vh) scale(0.22)', opacity:0.12}],
        {duration:2000, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards'});
    burstConfetti();
    const hold = reduce ? 700 : 2000;
    setTimeout(() => { ov.style.transition='opacity .4s'; ov.style.opacity='0'; setTimeout(() => { ov.remove(); onDone && onDone(); }, 420); }, hold);
}

function handleLaunch() {
    const input = document.getElementById('aspirationInput');
    const word = input.value.trim();
    if (!word) { input.style.borderColor = '#ef4444'; return; }
    D.aspiration = word;
    save();
    hapticPattern([50, 30, 100]);
    // Hold at the ready-gate; the boat only joins the fleet on the collective cue.
    step = 19; route();
}

// The collective launch — fires when the presenter reaches the fleet slide, so
// the whole hall's boats flood the big screen at once. Writes the boat to the
// fleet, plays the departure, and lands on the "you've set sail" hold.
let launching = false;
function doLaunch() { launchNow(); }   // the "Set sail now" fallback button (no presenter)

function renderReadyToSail() {
    hideCornerBoat();
    saveToFirebase();                            // launched:false → the fleet's harbour counts you
    syncClock();
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen ready-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div class="ready-boat origami-stage medium mb-5">${buildOrigamiSVG(c, 9, 260, extras())}</div>
            <p class="text-xs mb-1 tracking-[0.28em] uppercase" style="color:var(--accent-gold);">Your boat is ready</p>
            <h1 class="font-serif text-2xl mb-1" style="color:var(--text-primary);">${(D.aspiration || 'Set sail').toUpperCase()}</h1>
            <div class="ready-wait mt-4 mb-2">
                <span class="ready-dot"></span>
                <span class="text-sm" style="color:var(--text-secondary);">Hold it — waiting for the captain's cue…</span>
            </div>
            <p class="text-[11px] max-w-xs" style="color:var(--text-muted);">When the whole hall sets sail together, your boat joins the fleet on the big screen. Look up. 🌊</p>
            <button id="sailNowBtn" class="nav-btn secondary mt-8" style="opacity:0;transition:opacity .5s;">Set sail now</button>
        </div>
    </div>`;
    // No presenter (rehearsal / standalone)? Reveal a self-serve launch after a while.
    const btn = document.getElementById('sailNowBtn');
    setTimeout(() => { if (btn && btn.isConnected && !followMode) btn.style.opacity = '1'; }, 6000);
}

/* ============================================================
   ROUTER
   ============================================================ */
// The boat's fold stage shown in the corner while you answer each question.
// (During folds the boat is centre-stage; on these steps it tucks into the
// corner so the question has room and the shape-so-far stays in view.)
const STAGE_AT_STEP = { 3: 2, 6: 4, 7: 4, 10: 6, 11: 6, 14: 8 };
let cornerStagePrev = -1;
function updateCornerBoat() {
    const el = document.getElementById('cornerBoat');
    if (!el) return;
    // Only tuck the corner boat into the question screens. In follow/solo mode
    // the boat's real progress is D.nextFold (folds happen on their own beats),
    // not the old per-step assumption.
    if (STAGE_AT_STEP[step] === undefined) { el.hidden = true; el.classList.remove('expand'); el.innerHTML = ''; cornerStagePrev = -1; return; }
    const stage = (followMode || soloMode) ? Math.min(D.nextFold || 0, 8) : STAGE_AT_STEP[step];
    const grew = cornerStagePrev !== -1 && stage !== cornerStagePrev;
    el.hidden = false;
    el.innerHTML = `<div class="cb-inner">${buildOrigamiSVG(colors(), stage, 92, extras())}</div><span class="cb-label">Your boat</span>`;
    if (grew) { el.classList.add('grew'); setTimeout(() => el.classList.remove('grew'), 660); }
    cornerStagePrev = stage;
}
function hideCornerBoat() { const el = document.getElementById('cornerBoat'); if (el) { el.hidden = true; el.classList.remove('expand'); } }
// Tuck the boat-so-far into the corner while the audience answers a question.
function showCornerBoat() {
    const el = document.getElementById('cornerBoat');
    if (!el) return;
    const stage = Math.min(D.nextFold || 0, 8);
    const waiting = Math.max(0, (D.foldTarget || 0) - (D.nextFold || 0));
    const grew = cornerStagePrev !== -1 && stage !== cornerStagePrev;
    el.hidden = false;
    el.innerHTML = `<div class="cb-inner">${buildOrigamiSVG(colors(), stage, 92, extras())}${waiting ? `<span class="cb-badge">${waiting}</span>` : ''}</div><span class="cb-label">${waiting ? (waiting === 1 ? '1 fold waiting · tap' : waiting + ' folds waiting · tap') : 'Your boat'}</span>`;
    el.classList.toggle('waiting', waiting > 0);
    if (grew) { el.classList.add('grew'); setTimeout(() => el.classList.remove('grew'), 660); }
    cornerStagePrev = stage;
}
function cornerCatchUp() { if ((D.nextFold || 0) > 0 || (D.foldTarget || 0) > 0) showCornerBoat(); else hideCornerBoat(); }

// ============================================================
//   PRESENTER-DRIVEN COMPANION  (the phone follows btx27's session/state)
//   • QUESTION slides  → answer what's on screen (poll · globe · map · pulse ·
//     dream), feeding the same collections the big screen reads live.
//   • PASSIVE slides   → fold the boat, one crease at a time, across the talk.
//   • fleet slide      → the whole hall sets sail together into the fleet.
//   • memento slide    → keep your Compass Card.
// ============================================================
let followMode = false;
let currentView = null;           // dedup signature of the last applied slide
let foldFollowActive = false;     // a fold returns to a rest screen, not self-advance
let askFollowActive = false;      // (legacy — SAIL question mode; unused here)
let soloMode = false;
let soloIdx = -1;
let soloTimerId = null;

// foldIndex → the route() step that renders renderFoldStep(foldIndex)
const FOLD_STEP_FOR_INDEX = [1, 2, 4, 5, 8, 9, 12, 13];

// Personalise the boat from the pathways the audience chooses on the map.
// Sail = destination, flag = industry. Chosen to stay distinct from each other
// AND from a navy sea on a projector from the back row: no navy, no dark blues.
const NEXUS_COLOR = {
    GeoBali:'#F28C28', NZ:'#2BB3A8', Korea:'#D64FA0', MiharaJapan:'#EC5A5F', MutsuzawaJapan:'#B5D334', Estonia:'#7FD3F7',
    Rockwell:'#FFE200', PIL:'#F5F0E8', Journalism:'#EC3237', TamilMurasu:'#A77BEA', Makita:'#2BB3A8', ASTAR:'#7FD3F7',
};
// The eight bees of the Hive — must match btx27's compass chart keys exactly.
const BEES = [
    { name:'The Innovator',            icon:'⚙️', tag:'Builder Bee' },
    { name:'The Global Explorer',      icon:'🧭', tag:'Scout Bee' },
    { name:'The Industry Trailblazer', icon:'🏗️', tag:'Forager Bee' },
    { name:'The Community Steward',    icon:'🤝', tag:'Guardian Bee' },
    { name:'The Creative Artist',      icon:'🎭', tag:'Dancer Bee' },
    { name:'The STEM Futurist',        icon:'🔬', tag:'Architect Bee' },
    { name:'The Voice Amplifier',      icon:'📣', tag:'Herald Bee' },
    { name:'The Eco-Strategist',       icon:'🌱', tag:'Keeper Bee' },
];

/* --- Dispatch on the presenter's current slide --- */
function applyView(state) {
    if (!state) return;
    followMode = true; soloMode = false;
    if (soloTimerId) { clearTimeout(soloTimerId); soloTimerId = null; }
    lastSessionState = state;
    // Nobody follows the show until they've boarded: that one tap is what unlocks
    // sound, keeps the screen awake, and puts their bee in the Hive.
    if (!D.boarded) { if (!document.getElementById('boardGrid')) renderBoard(); return; }
    if (sailSeq || bloomSeq) return;             // a count is running — nothing interrupts it
    const v = state.currentView || 'chart';
    // Leaving a poll → drop its live-results listener.
    if (v !== 'poll' && window.__pollUnsub) { window.__pollUnsub(); window.__pollUnsub = null; }
    // Signature so a repeated snapshot doesn't re-render, but a NEW slide — or the
    // presenter revealing the answer — does.
    const sig = v + '|' + (state.step ?? '') + '|' + (state.pollData?.id || '') + '|' + (state.nexusData?.type || '') + '|' + (state.revealed ? 'R' : '') + '|' + (state.fold ? state.fold.to : '') + '|' + (state.card ? (state.card.title || '') + (state.card.keys || []).length : '');
    if (sig === currentView) return;
    currentView = sig;
    chapterNow = state.chapter || chapterNow;
    if (v !== 'fold') { foldFollowActive = false; clearTimeout(foldAssistTimer); }
    setMode(RESPOND_VIEWS.includes(v) ? 'respond' : WATCH_VIEWS.includes(v) ? 'watch' : 'glance');
    switch (v) {
        case 'poll':          showPoll(state.pollData, !!state.revealed); break;
        case 'globe':
        case 'industry_map':  showNexus(state.nexusData); break;
        case 'pulse_check':   showPulse(); break;
        case 'finale':        D.dreamSent ? renderHiveCell() : showName(); break;
        case 'bloom':         renderPhonesUp(); break;
        case 'fleet':         triggerSetSail(); break;
        case 'memento':
        case 'end':           showCard(); break;
        case 'chart':         renderAboard(); break;          // the opening room portrait
        case 'fold':          startFoldBeat(state.fold); break; // "Fold with us" — presenter-led
        case 'video':         renderWatch(state); break;
        case 'slide':         renderGlance(state, 'deck'); break;
        case 'values':        renderGlance(state, 'values'); break;
        case 'funfact':       renderGlance(state, 'funfact'); break;
        default:              renderWatch(state); break;
    }
}
let lastSessionState = null;

/* --- Folds on the passive slides --- */
function advanceFold() {
    const fi = (D.nextFold == null) ? 0 : D.nextFold;
    if (fi > 7) { renderLookUp('Your boat is folded — eyes on the screen 🌊'); return; }
    foldFollowActive = true;
    step = FOLD_STEP_FOR_INDEX[fi];
    route();
}
function onFoldBeatDone(foldIndex) {
    D.nextFold = foldIndex + 1; save();
    clearTimeout(foldAssistTimer);
    chapterFlash(D.nextFold);                            // 🎩 at 5, 💎 at 6 — the boat has its own reveal
    saveToFirebase();                                   // progress → the presenter's "N folded" count
    if (soloMode) { foldFollowActive = false; soloIdx++; renderRest('Beautiful fold.', 'Eyes back on the big screen ✨'); return; }
    if ((D.nextFold || 0) < (D.foldTarget || 0)) { setTimeout(continueFolding, 380); return; }   // one more in this beat
    foldFollowActive = false;
    renderRest(D.nextFold >= 8 ? 'Your boat is complete! ⛵' : 'Beautiful fold.', 'Eyes back on the big screen ✨');
}

/* ============================================================
   ANSWER THE ON-SCREEN QUESTION  (ported from joinbtx27, in x/ styling)
   ============================================================ */
/* Live trivia poll — vote, then watch the room's bars fill in real time. */
let pollRevealed = false;
function showPoll(p, revealed) {
    pollRevealed = !!revealed;
    if (!p) { renderLookUp('Get ready to vote…'); return; }
    if (D.polls && D.polls[p.id] !== undefined) { showPollResult(p); return; }
    if (pollRevealed) { showPollResult(p); return; }   // revealed before you voted → watch the answer
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:20px;">
            <p class="q-eyebrow">🐝 Live Poll · vote now</p>
            <h2 class="q-question">${p.question}</h2>
            <div class="q-opts mt-4">
                ${p.options.map((o, i) => `<button class="answer-opt" data-poll="${i}">${o}</button>`).join('')}
            </div>
            <p class="q-hint">Your vote appears live on the big screen.</p>
        </div>
    </div>`;
    document.querySelectorAll('[data-poll]').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('.answer-opt').forEach(o => o.disabled = true);
        b.classList.add('sel'); votePoll(p, b.dataset.poll);
    }));
    showCornerBoat();
}
async function votePoll(p, i) {
    const idx = parseInt(i), correct = idx === p.correctAnswer;
    let insight = p.insight || 'Thanks for voting!';
    if (!correct && p.correctAnswer != null) insight = 'Good guess! ' + (p.insight || '');
    if (!D.polls) D.polls = {};
    D.polls[p.id] = { choice: idx, choiceText: p.options[idx], correct, insight }; save();
    haptic(40);
    if (db && auth?.currentUser) { try { await setDoc(doc(db, "polls", `${p.id}_${auth.currentUser.uid}`), { pollId: p.id, vote: idx, timestamp: serverTimestamp() }); } catch (e) {} }
    showPollResult(p);
}
function showPollResult(p) {
    const mine = D.polls?.[p.id];
    const revealed = pollRevealed;
    // Before the reveal the phone knows only that you're in and how many have
    // answered — the answer belongs to the big screen, on the presenter's cue.
    const eyebrow = !revealed ? 'Locked in ✓' : (mine ? (mine.correct ? '✓ You got it!' : 'Good guess!') : 'The answer');
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:20px;">
            <p class="q-eyebrow">${eyebrow}</p>
            <h2 class="q-question" style="font-size:1.15rem;">${p.question}</h2>
            ${!revealed ? `
            <div class="q-locked mt-4">
                <div class="q-locked-pick">${mine ? `You chose <b>${mine.choiceText}</b>` : 'Eyes on the big screen'}</div>
                <div class="q-locked-count"><span id="pollCount">…</span> answered · the answer is coming</div>
            </div>` : `
            <div class="mt-4" id="liveBars">${p.options.map((o, i) => `
                <div class="pbar ${mine && mine.choice === i ? 'me' : ''} ${i === p.correctAnswer ? 'correct' : ''}" data-i="${i}">
                    <div class="pbar-lab"><span>${o} ${i === p.correctAnswer ? '🏆' : ''}${mine && mine.choice === i ? ' · you' : ''}</span><span class="pbar-pc">0%</span></div>
                    <div class="pbar-track"><div class="pbar-fill"></div></div>
                </div>`).join('')}</div>
            <div class="q-insight">${p.insight || ''}</div>`}
        </div>
    </div>`;
    showCornerBoat();
    if (revealed) hapticPattern(mine?.correct ? [30, 40, 90] : [40]);
    if (db && collection && onSnapshot) {
        if (window.__pollUnsub) window.__pollUnsub();
        try {
            window.__pollUnsub = onSnapshot(collection(db, "polls"), (snap) => {
                const bd = {}; let total = 0;
                snap.forEach(d => { const x = d.data(); if (x.pollId === p.id) { total++; if (x.vote != null) bd[x.vote] = (bd[x.vote] || 0) + 1; } });
                const cnt = document.getElementById('pollCount'); if (cnt) cnt.textContent = total;
                p.options.forEach((o, i) => {
                    const row = document.querySelector(`#liveBars .pbar[data-i="${i}"]`); if (!row) return;
                    const c = bd[i] || 0, pct = total > 0 ? (c / total * 100) : 0;
                    row.querySelector('.pbar-fill').style.width = pct + '%';
                    row.querySelector('.pbar-pc').textContent = Math.round(pct) + '%';
                });
            }, () => {});
        } catch (e) {}
    }
}

/* NEXUS globe / industry map — drop your bee, colour your boat. */
function showNexus(nd) {
    if (!nd) { renderLookUp('Choose on the big screen…'); return; }
    const key = nd.type;                              // 'global' | 'local'
    if (D[key]) { renderChosenNexus(key); return; }
    const isGlobe = key === 'global';
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:20px;">
            <p class="q-eyebrow">🧭 Chart your course · ${isGlobe ? 'a destination' : 'an industry'}</p>
            <h2 class="q-question">${isGlobe ? 'Where would the wind take you?' : 'Which world would you step into?'}</h2>
            <div class="q-opts mt-4">
                ${nd.options.map(o => `<button class="answer-opt" data-nx="${o.id}" data-nt="${key}" data-ntxt="${o.text.replace(/"/g, '&quot;')}">${o.text}</button>`).join('')}
            </div>
            <p class="q-hint">Your bee lands on the big screen — and colours your sail. 🗺️</p>
        </div>
    </div>`;
    document.querySelectorAll('[data-nx]').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('.answer-opt').forEach(o => o.disabled = true);
        b.classList.add('sel'); chooseNexus(b.dataset.nx, b.dataset.nt, b.dataset.ntxt);
    }));
    showCornerBoat();
}
async function chooseNexus(id, type, text) {
    D[type] = { id, text };
    const col = NEXUS_COLOR[id];
    if (col) { if (type === 'global') D.sailColor = col; else D.flagColor = col; }
    save(); stampBoat();
    haptic(30);
    if (db && auth?.currentUser) { try { await setDoc(doc(db, "nexusVotes", `${type}_${auth.currentUser.uid}`), { nexusId: id, type, timestamp: serverTimestamp() }); } catch (e) {} }
    renderChosenNexus(type);
}
function renderChosenNexus(type) {
    const c = colors();
    const pick = D[type];
    const stage = Math.min(D.nextFold || 0, 8);
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <div class="follow-check mb-2">✓</div>
            <h1 class="font-serif text-xl mb-1" style="color:var(--accent-gold);">Your bee has landed</h1>
            <p class="text-sm mb-4" style="color:var(--text-secondary);">${pick?.text || ''} — watch the big screen 🗺️</p>
            <div class="follow-boat">${buildOrigamiSVG(c, stage, 190, extras())}</div>
        </div>
    </div>`;
}

/* Pulse check — tap how the room feels. */
function showPulse() {
    if (D.pulse) { D.dreamSent ? renderReadyToSail() : showName(); return; }
    const moods = [{ k: 'On fire!', e: '🔥' }, { k: 'Excited!', e: '🚀' }, { k: 'Enjoying it', e: '😊' }, { k: 'Tell me more', e: '🤔' }];
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:20px;">
            <p class="q-eyebrow">💛 Pulse check · tap your mood</p>
            <h2 class="q-question">How's it feeling so far?</h2>
            <div class="mood-grid mt-4">
                ${moods.map(m => `<button class="mood-btn" data-mood="${m.k}"><span class="mood-e">${m.e}</span><span class="mood-l">${m.k}</span></button>`).join('')}
            </div>
        </div>
    </div>`;
    document.querySelectorAll('[data-mood]').forEach(b => b.addEventListener('click', () => choosePulse(b.dataset.mood)));
    showCornerBoat();
}
async function choosePulse(k) {
    D.pulse = k; save(); stampBoat(); haptic(30);
    if (db && auth?.currentUser) { try { await setDoc(doc(db, "pulseCheck", auth.currentUser.uid), { choice: k, timestamp: Date.now() }); } catch (e) {} }
    // Straight on to naming the boat — it must carry its dream before it sails.
    if (D.dreamSent) renderReadyToSail(); else showName();
}

/* Finale — one-word aspiration, cast into the Hive AND written on your boat. */
/* Name your boat — one word, your dream. It sails on the hull AND joins the Hive. */
function showName() {
    hideCornerBoat();
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:18px;">
            <p class="q-eyebrow">⛵ Name your boat</p>
            <h2 class="q-question">One word — what do you aspire to become?</h2>
            <div class="origami-stage medium mx-auto my-3" id="dreamBoat" style="max-width:220px;">${buildOrigamiSVG(c, 9, 220, extras())}</div>
            <input type="text" id="dreamInput" maxlength="16" class="dream-field" placeholder="e.g. Innovator" autocomplete="off" autocapitalize="characters">
            <button class="nav-btn primary w-full mt-3 text-base uppercase tracking-wide" id="dreamBtn">Write it on the hull ⛵</button>
            <p class="q-hint">It sails with you — and joins the Hive of aspirations.</p>
        </div>
    </div>`;
    const f = document.getElementById('dreamInput');
    f.addEventListener('input', (e) => {
        D.aspiration = e.target.value.trim();
        const st = document.getElementById('dreamBoat'); if (st) st.innerHTML = buildOrigamiSVG(c, 9, 220, extras());
    });
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitName(); });
    document.getElementById('dreamBtn').addEventListener('click', submitName);
    try { f.focus(); } catch (e) {}
}
async function submitName() {
    const f = document.getElementById('dreamInput');
    const w = cleanWord(f.value);
    if (!w) { f.style.borderColor = '#ef4444'; return; }
    if (!(await submitNameGuard(w, f))) return;
    D.aspiration = w; D.dreamSent = true; save();
    hapticPattern([40, 30, 80]);
    saveToFirebase();                   // into the harbour now (launched:false) — or, at sea already, repaint the hull
    if (db && auth?.currentUser) { try { await setDoc(doc(db, "aspirations", auth.currentUser.uid), { word: w, timestamp: serverTimestamp() }); } catch (e) {} }
    if (soloMode) { soloIdx++; renderRest('Your dream is aboard ⛵', 'Ready to set sail'); return; }
    renderNameWriting(w, () => { if (D.launched) renderHiveCell(); else renderReadyToSail(); });
}
async function submitNameGuard(w, f) {
    if (!wordOK(w)) { f.value = ''; f.placeholder = 'Let’s keep it kind — try another word'; f.style.borderColor = '#ef4444'; feel('tick'); return false; }
    return true;
}
/* The word writes itself on the hull in handwriting, pencil scratching, and ends on a rising arpeggio. */
let writingToken = 0;
function renderNameWriting(word, next) {
    hideCornerBoat();
    const token = ++writingToken;
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <p class="text-[10px] mb-3 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">Writing it on the hull</p>
            <div class="origami-stage medium" id="nameBoat" style="max-width:260px;">${buildOrigamiSVG(c, 9, 260, { ...extras(), aspiration: '' })}</div>
        </div>
    </div>`;
    const host = document.getElementById('nameBoat');
    const wait = handwrite(host, word, { size: Math.max(18, Math.min(28, 210 / Math.max(6, word.length))), per: 110 });
    setTimeout(() => { playArpeggio(); feel('chapter', host); }, wait - 120);
    // If the captain's cue (or anything else) took the screen meanwhile, leave it alone.
    setTimeout(() => { if (token !== writingToken || sailSeq || D.launched || !document.getElementById('nameBoat')) return; next(); }, wait + 900);
}

/* Collective Set Sail — the whole hall launches at once on the fleet slide. */
function triggerSetSail() {
    if (D.launched) { renderAtSea(); return; }
    if (sailSeq) return;                                       // the count is running
    if (D.dreamSent) renderReadyToSail(); else showName();     // get to the gate
    // No cue for a long while (the button was never pressed)? Launch anyway.
    clearTimeout(uncuedTimer);
    uncuedTimer = setTimeout(() => { if (!D.launched && !sailSeq) launchNow(); }, 25000);
}
function renderSetSailDone() { renderAtSea(); }
function showCard() { renderMemento(); }

// ============================================================
//   THE COLLECTIVE SET SAIL (phone side)
//   The presenter's cue names a server time. We hold the boat under the thumb
//   through the NON VI / SED ARTE count, tugging on every response, and let go
//   at that instant — the same instant the fleet on the big screen releases.
//   Network latency hides inside the 1.3 s departure.
// ============================================================
const SAIL_WORDS = [[6000,'NON VI',false],[5000,'SED ARTE',true],[4000,'NON VI',false],[3000,'SED ARTE',true],[2000,'NON VI',false],[1000,'SED ARTE!',true]]   // ms remaining before the release;
const DEST_ORDER = ['GeoBali','NZ','Korea','MiharaJapan','MutsuzawaJapan','Estonia'];
const COLOUR_NAME = { '#F28C28':'orange', '#2BB3A8':'teal', '#D64FA0':'magenta', '#EC5A5F':'coral', '#B5D334':'lime', '#7FD3F7':'sky-blue', '#FFE200':'gold', '#F5F0E8':'white' };
let handledCueId = null, sailSeq = null, sailLocalAt = 0, uncuedTimer = null;
function handleCue(cue) {
    if (!cue || !cue.id || cue.id === handledCueId) return;
    handledCueId = cue.id;
    if (cue.kind === 'bloom') { startBloomSequence(cue.at + clockOffset); return; }
    if (cue.kind !== 'sail' || D.launched) return;
    clearTimeout(uncuedTimer);
    if (!D.boarded) { D.boarded = true; save(); }   // a late scanner still sails with everyone
    startSailSequence(cue.at + clockOffset);
}
function startSailSequence(localAt) {
    if (sailSeq) return;
    sailLocalAt = localAt;
    hideCornerBoat();
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen hold-screen fade-up" id="holdScreen">
        <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <p class="text-[10px] mb-2 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">Set Sail, Beatty</p>
            <h1 class="font-serif text-2xl mb-3" id="holdWord" style="color:var(--text-primary);min-height:1.2em;">Hold your boat</h1>
            <div class="hold-boat" id="holdBoat">${buildOrigamiSVG(c, 9, 230, extras())}<div class="hold-ring"></div></div>
            <p class="text-sm mt-4 max-w-xs" id="holdSub" style="color:var(--text-secondary);">Thumb on the boat. On the third <em style="color:var(--accent-gold);">Sed Arte</em> — let go, and look up.</p>
        </div>
    </div>`;
    let wi = 0, dimmed = false;
    const wordEl = document.getElementById('holdWord'), boatEl = document.getElementById('holdBoat'), subEl = document.getElementById('holdSub');
    // Skip straight past words whose moment has already gone (late cue delivery).
    const rem0 = localAt - Date.now(); while (wi < SAIL_WORDS.length && rem0 <= SAIL_WORDS[wi][0] - 900) wi++;
    function tick() {
        const rem = localAt - Date.now();
        while (wi < SAIL_WORDS.length && rem <= SAIL_WORDS[wi][0]) {
            const [, w, resp] = SAIL_WORDS[wi++];
            if (wordEl) { wordEl.textContent = w; wordEl.style.color = resp ? 'var(--accent-gold-light)' : 'var(--text-primary)'; wordEl.classList.remove('word-pop'); void wordEl.offsetWidth; wordEl.classList.add('word-pop'); }
            if (subEl) subEl.textContent = '';
            if (resp) { haptic(30); tugBoat(boatEl); playTick(); }
        }
        if (!dimmed && rem <= 500) { dimmed = true; document.getElementById('holdScreen')?.classList.add('dim'); if (wordEl) wordEl.textContent = ''; }
        if (rem <= 0) { sailSeq = null; launchNow(); return; }
        sailSeq = requestAnimationFrame(tick);
    }
    sailSeq = requestAnimationFrame(tick);
}
function tugBoat(el) { if (!el) return; el.classList.remove('tug'); void el.offsetWidth; el.classList.add('tug'); }
function launchNow() {
    if (sailSeq) { cancelAnimationFrame(sailSeq); sailSeq = null; }
    clearTimeout(uncuedTimer);
    if (D.launched) { renderAtSea(); return; }
    if (!sailLocalAt) sailLocalAt = Date.now();
    D.launched = true; D.launchedAt = serverNow(); save();
    hapticPattern([15, 30, 15, 30, 120]); playWhoosh();
    saveToFirebase();                                          // launched:true — placed if not already at sea
    const boatEl = document.getElementById('holdBoat');
    if (boatEl) { boatEl.classList.add('depart'); setTimeout(renderAtSea, 1400); }
    else setSailTransition(renderAtSea);
}
function renderAtSea() {
    hideCornerBoat();
    const c = colors();
    const col = D.sailColor || '#FFE200', name = COLOUR_NAME[col] || 'coloured';
    const dest = D.global;
    $app.innerHTML = `
    <div class="sail-screen atsea-screen fade-up" id="atSea" style="--sail:${col}">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <p class="text-[10px] mb-2 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">You've set sail</p>
            <h1 class="font-serif text-2xl mb-2" style="color:var(--text-primary);">Look up — you're in the fleet</h1>
            <div class="atsea-swatch" style="background:${col};color:${col}"></div>
            <p class="text-sm mt-3 max-w-xs" style="color:var(--text-secondary);">Find the <b style="color:${col}">${name}</b> sail${dest && dest.text ? ` bound for <b style="color:var(--text-primary)">${dest.text}</b>` : ''}. Every boat on the big screen is a Beattyian setting sail from our Hive. 🌊</p>
            <div class="follow-boat mt-4">${buildOrigamiSVG(c, 9, 150, extras())}</div>
            <div class="rollcall" id="rollCall" hidden><span class="rc-word">Wave! 👋</span><span class="rc-sub" id="rcSub"></span></div>
        </div>
    </div>`;
    scheduleRollCall();
}
function scheduleRollCall() {
    if (!sailLocalAt || !D.global || !D.global.id) return;
    const i = DEST_ORDER.indexOf(D.global.id); if (i < 0) return;
    const when = sailLocalAt + 12000 + i * 3000 - Date.now(); if (when < -2500) return;
    setTimeout(() => {
        const rc = document.getElementById('rollCall'), scr = document.getElementById('atSea'); if (!rc || !scr) return;
        const sub = document.getElementById('rcSub'); if (sub) sub.textContent = (D.global.text || '') + " — that's you!";
        rc.hidden = false; scr.classList.add('rc-flash'); hapticPattern([40, 60, 40]); playPing();
        setTimeout(() => { rc.hidden = true; scr.classList.remove('rc-flash'); }, 2800);
    }, Math.max(0, when));
}
/* Phone sounds for the launch — small, paper-coloured; the hall's PA carries the hit. */
function playTick() { try { const ctx = getAudioCtx(), t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.12); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.2); } catch (e) {} }
function playWhoosh() { try { const ctx = getAudioCtx(), t = ctx.currentTime, dur = 1.2; const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const src = ctx.createBufferSource(); src.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + dur * 0.7); f.frequency.exponentialRampToValueAtTime(900, t + dur); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); src.connect(f).connect(g).connect(ctx.destination); src.start(t); src.stop(t + dur); } catch (e) {} }
function playPing() { try { const ctx = getAudioCtx(), t = ctx.currentTime; [1318, 1976].forEach((fq, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = fq; const s = t + i * 0.07; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.08, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5); o.connect(g).connect(ctx.destination); o.start(s); o.stop(s + 0.55); }); } catch (e) {} }

/* --- The finale: your own cell in the Hive --- */
function renderHiveCell() {
    hideCornerBoat();
    const w = (D.aspiration || '').toUpperCase();
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <p class="text-[10px] mb-4 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">Your cell in the Hive</p>
            <div class="hive-hex"><span>${w}</span></div>
            <p class="text-sm mt-5 max-w-xs" style="color:var(--text-secondary);">Look up — it's rising off your hull and into the Hive. Every cell up there is a Beattyian's dream. 🐝</p>
        </div>
    </div>`;
}

// ============================================================
//   THE HIVE WAKES (phone side) — the Turn before the Prestige
//   Screen black, held up facing out (a lamp, not a screen). Ten … one. On
//   zero every phone blooms yellow in the same instant. Then back to the show.
// ============================================================
let bloomSeq = null;
function renderPhonesUp() {
    hideCornerBoat();
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <div class="follow-eye mb-2">🐝</div>
            <p class="text-[10px] mb-2 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">The Hive wakes</p>
            <h1 class="font-serif text-2xl mb-3" style="color:var(--text-primary);">Phones up. Screen facing out.</h1>
            <p class="text-sm max-w-xs" style="color:var(--text-secondary);">Hold it high. On zero, we light the hall together.</p>
        </div>
    </div>`;
}
function startBloomSequence(localAt) {
    if (bloomSeq) return;
    hideCornerBoat();
    $app.innerHTML = `<div class="bloom-screen black" id="bloomScreen"><div class="bloom-hint">Phones up · screen facing out</div><div class="bloom-n" id="bloomN"></div></div>`;
    let lastSec = null, bloomed = false;
    function tick() {
        const rem = localAt - Date.now();
        const scr = document.getElementById('bloomScreen');
        if (!bloomed && rem <= 0) {
            bloomed = true;
            if (scr) { scr.classList.remove('black', 'pulse'); scr.classList.add('bloom'); const n = document.getElementById('bloomN'); if (n) n.textContent = ''; }
            hapticPattern([60, 40, 220]);
            setTimeout(() => { bloomSeq = null; currentView = null; if (lastSessionState) applyView(lastSessionState); else renderAboard(); }, 6000);
            return;
        }
        const sec = Math.ceil(rem / 1000);
        if (sec <= 10 && sec >= 1 && sec !== lastSec) {
            lastSec = sec;
            if (scr) { scr.classList.remove('pulse'); void scr.offsetWidth; scr.classList.add('pulse'); }
            const n = document.getElementById('bloomN'); if (n) n.textContent = String(sec);
            haptic(20);
        }
        bloomSeq = requestAnimationFrame(tick);
    }
    bloomSeq = requestAnimationFrame(tick);
}

// ============================================================
//   THE PHONE BETWEEN QUESTIONS — three modes, one chapter strip
//   WATCH  (dim, still — the big screen owns the eyes)
//   GLANCE (one title, one line or number — for the back row)
//   RESPOND (the phone is primary — a gold band says "your turn")
// ============================================================
const CHAPTERS = ['Into the Hive', 'Who we are', 'Our values', 'Passions', 'NEXUS@BTY', 'Your pathway', 'Set sail', 'Your journey'];
const RESPOND_VIEWS = ['chart', 'poll', 'globe', 'industry_map', 'pulse_check', 'finale', 'fold', 'memento', 'end'];
const WATCH_VIEWS = ['video', 'fleet', 'bloom'];
let chapterNow = '';
function setMode(mode) {
    document.body.dataset.mode = mode;
    if (!document.getElementById('modeBandT')) {
        ['modeBandT', 'modeBandB'].forEach(id => { const d = document.createElement('div'); d.id = id; d.className = 'mode-band'; document.body.appendChild(d); });
    }
}
function chapterStrip() {
    const idx = CHAPTERS.indexOf(chapterNow);
    return `<div class="ch-strip">${CHAPTERS.map((c, i) => `<span class="ch-dot${i < idx ? ' done' : ''}${i === idx ? ' now' : ''}"></span>`).join('')}<span class="ch-name">${chapterNow || ''}</span></div>`;
}
function renderWatch(state) {
    hideCornerBoat();
    $app.innerHTML = `
    <div class="sail-screen follow-screen watch-screen fade-up">
        ${chapterStrip()}
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <div class="watch-glyph">▲</div>
            <p class="text-[10px] mt-3 tracking-[0.3em] uppercase" style="color:var(--text-muted);">Eyes on the screen</p>
            ${state && state.title ? `<h1 class="font-serif text-lg mt-2" style="color:var(--text-secondary);">${state.title}</h1>` : ''}
        </div>
    </div>`;
    cornerCatchUp();
}
function renderGlance(state, kind) {
    hideCornerBoat();
    let body = '';
    if (kind === 'funfact' && state.funfact) {
        const f = state.funfact; const n = parseInt(String(f.number).replace(/[^0-9]/g, ''), 10);
        body = `<div class="glance-num" id="glanceNum">${isNaN(n) ? f.number : '0'}</div><div class="glance-label">${f.label || ''}</div><p class="glance-sub">${f.subtitle || ''}</p>`;
        setTimeout(() => { if (isNaN(n)) return; const el = document.getElementById('glanceNum'); if (!el) return; const t0 = performance.now();
            (function tick(now) { const p = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0); }, 60);
    } else if (kind === 'values') {
        body = `<div class="glance-title">D.R.E.A.M.</div><div class="dream-chips">${[['D','Discipline'],['R','Resilience'],['E','Empathy'],['A','Adaptability'],['M','Mindfulness']].map(([l, w]) => `<div class="dream-chip"><b>${l}</b>${w}</div>`).join('')}</div><p class="glance-sub">The values every Beattyian sails under.</p>`;
    } else {
        const c = state.card; const hasCard = !!(c && (c.title || (c.keys && c.keys.length)));
        body = hasCard
            ? `<div class="glance-title">${c.title || state.chapter || ''}</div>${c.keys && c.keys.length ? `<ul class="glance-keys">${c.keys.map(k => `<li>${k}</li>`).join('')}</ul>` : ''}`
            : `<div class="watch-glyph" style="color:var(--accent-gold)">▲</div><div class="glance-title" style="margin-top:12px">${state.chapter || 'On screen now'}</div><p class="glance-sub">Eyes on the screen.</p>`;
    }
    $app.innerHTML = `
    <div class="sail-screen follow-screen glance-screen fade-up">
        ${chapterStrip()}
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">${body}</div>
    </div>`;
    cornerCatchUp();
}

/* --- Fold with us: a presenter-led beat of two folds --- */
let foldAssistTimer = null;
function startFoldBeat(f) {
    if (!f) { renderWatch(lastSessionState || {}); return; }
    D.foldTarget = Math.max(D.foldTarget || 0, f.to); save();
    continueFolding();
}
function continueFolding() {
    const target = D.foldTarget || 0;
    if ((D.nextFold || 0) >= target) { renderRest(target >= 8 ? 'Your boat is complete! ⛵' : 'Your boat is ahead ✨', 'Eyes on the screen'); return; }
    foldFollowActive = true;
    step = FOLD_STEP_FOR_INDEX[D.nextFold || 0];
    route();
}
// Nobody may arrive at Set Sail without a boat: after 30 s on one fold, offer to finish it.
function armFoldAssist(foldIndex) {
    clearTimeout(foldAssistTimer);
    if (!foldFollowActive) return;
    foldAssistTimer = setTimeout(() => {
        const zone = document.querySelector('.sail-screen .content-zone'); if (!zone || document.getElementById('foldAssistBtn')) return;
        const b = document.createElement('button'); b.id = 'foldAssistBtn'; b.className = 'nav-btn secondary mt-3 w-full'; b.textContent = 'Stuck? Fold it for me ▸';
        b.onclick = () => { b.disabled = true; foldAssist(foldIndex); };
        zone.appendChild(b);
    }, 30000);
}
function foldAssist(foldIndex) {
    const st = document.getElementById('origamiStage');
    if (st) { st.querySelectorAll('.crease-overlay').forEach(o => o.remove()); const svg = st.querySelector('.origami-svg'); if (svg) svg.outerHTML = buildOrigamiSVG(colors(), Math.min(8, STAGE_FOR_FOLD[foldIndex] + 1), 280, extras()); }
    haptic(40); try { playFoldSound(); } catch (e) {}
    setTimeout(() => onFoldBeatDone(foldIndex), 600);
}

/* --- Resting / holding screens shown between the presenter's slides --- */
/* --- Boarding: "Which bee are you?" — one tap puts you in the Hive and unlocks the phone --- */
function renderBoard() {
    hideCornerBoat();
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:22px;">
            <img src="${LOGO_URL}" alt="Beatty" style="width:46px;height:46px;object-fit:contain;margin:0 auto 10px;display:block" onerror="this.style.display='none'">
            <p class="q-eyebrow" style="text-align:center;">🐝 Come into the Hive</p>
            <h2 class="q-question" style="text-align:center;">Which bee are you?</h2>
            <p class="q-hint" style="margin:6px 0 14px;">Tap one to board. Your bee lands on the big screen.</p>
            <div class="bee-grid" id="boardGrid">
                ${BEES.map((b, i) => `<button class="bee-btn" data-bee="${i}"><span class="bee-ic">${b.icon}</span><span class="bee-nm">${b.name.replace('The ', '')}</span><span class="bee-tag">${b.tag}</span></button>`).join('')}
            </div>
        </div>
    </div>`;
    document.querySelectorAll('[data-bee]').forEach(btn => btn.addEventListener('click', () => board(BEES[+btn.dataset.bee])));
}
function board(bee) {
    // Everything that needs a user gesture happens inside this tap.
    unlockAudio(); primeVibrate(); takeWakeLock();
    haptic(25);
    D.boarded = true; D.bee = bee.name; D.beeTag = bee.tag; D.beeIcon = bee.icon;
    save(); stampBoat();
    syncClock();                                // writes compassQuiz + learns the clock
    try { startAmbient(); } catch (e) {}
    currentView = null;                         // re-apply whatever the presenter is on
    if (lastSessionState) applyView(lastSessionState); else renderAboard();
}
function renderAboard() {
    hideCornerBoat();
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <div style="font-size:2.6rem;line-height:1" class="mb-2">${D.beeIcon || '🐝'}</div>
            <p class="text-[10px] mb-1 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">You're in the Hive</p>
            <h1 class="font-serif text-2xl mb-1" style="color:var(--text-primary);">${D.beeTag || 'Beattyian'}</h1>
            <p class="text-sm mb-5 max-w-xs" style="color:var(--text-secondary);">Find yourself on the big screen. You'll fold a boat, chart a course and set sail with the whole hall. 🌊</p>
            <div class="follow-boat">${buildOrigamiSVG(c, Math.min(D.nextFold || 0, 8), 170, extras())}</div>
        </div>
    </div>`;
    armSoloFallback();
}
function renderLookUp(msg) {
    hideCornerBoat();
    const c = colors();
    const stage = Math.min(D.nextFold || 0, 8);
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <div class="follow-eye mb-2">👀</div>
            <h1 class="font-serif text-xl mb-4" style="color:var(--accent-gold);">Look up at the screen</h1>
            <div class="follow-boat">${buildOrigamiSVG(c, stage, 200, extras())}</div>
            <p class="text-[11px] mt-4" style="color:var(--text-muted);">${msg || 'Your boat so far'}</p>
        </div>
    </div>`;
    if (soloMode) addSoloNext();
}
function renderRest(title, sub) {
    hideCornerBoat();
    const c = colors();
    const stage = Math.min(D.nextFold || 0, 8);
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <div class="follow-check mb-2">✓</div>
            <h1 class="font-serif text-xl mb-1" style="color:var(--accent-gold);">${title}</h1>
            <p class="text-sm mb-4" style="color:var(--text-secondary);">${sub}</p>
            <div class="follow-boat" id="restBoat">${buildOrigamiSVG(c, stage, 190, extras())}</div>
            ${stage >= 8 ? `<p class="text-[10px] mt-3 tracking-[0.2em] uppercase" style="color:var(--text-muted);">${NEEDS_TILT_TAP ? 'Tap the boat, then tilt your phone' : 'Tilt your phone'} 🌊</p>` : ''}
        </div>
    </div>`;
    if (stage >= 8) { const b = document.getElementById('restBoat'); enableTilt(b); b.onclick = () => { requestTiltPermission(); feel('tick'); }; }
    if (soloMode) addSoloNext();
}
/* --- Solo fallback: fold your boat + add a dream even with no presenter --- */
const SOLO_SEQ = ['fold', 'fold', 'fold', 'fold', 'fold', 'fold', 'fold', 'fold', 'dream'];
function armSoloFallback() {
    if (followMode || soloMode) return;
    clearTimeout(soloTimerId);
    soloTimerId = setTimeout(() => {
        if (followMode || soloMode) return;
        const p = document.querySelector('.follow-screen .flex-1');
        if (p && !document.getElementById('soloStart')) {
            const b = document.createElement('button');
            b.id = 'soloStart'; b.className = 'nav-btn secondary mt-6';
            b.textContent = 'No presenter? Fold your boat now ▶';
            b.onclick = () => { soloMode = true; soloIdx = 0; runSolo(); };
            p.appendChild(b);
        }
    }, 6000);
}
function runSolo() {
    const s = SOLO_SEQ[soloIdx];
    if (!s) { showCard(); return; }
    if (s === 'fold') advanceFold();
    else if (s === 'dream') showName();
}
function addSoloNext() {
    const p = document.querySelector('.follow-screen .flex-1'); if (!p) return;
    if (p.querySelector('.solo-next')) return;
    const b = document.createElement('button');
    b.className = 'nav-btn primary mt-6 solo-next'; b.textContent = 'Next ▶';
    b.onclick = () => { runSolo(); };
    p.appendChild(b);
}

function route() {
    const render = () => {
        switch (step) {
            case 0:  renderWelcome(); break;
            case 1:  renderFoldStep(0); break;
            case 2:  renderFoldStep(1); break;
            case 3:  renderChooseS(); break;
            case 4:  renderFoldStep(2); break;
            case 5:  renderFoldStep(3); break;
            case 6:  renderChooseA(); break;
            case 7:  renderChooseASub(); break;
            case 8:  renderFoldStep(4); break;
            case 9:  renderFoldStep(5); break;
            case 10: renderChooseI(); break;
            case 11: renderChooseISub(); break;
            case 12: renderFoldStep(6); break;
            case 13: renderFoldStep(7); break;
            case 14: renderChooseL(); break;
            case 15: renderAspiration(); break;
            case 16: renderProcessing(); break;
            case 17: renderArchetypeReveal(); break;
            case 18: renderMemento(); break;
            case 19: renderReadyToSail(); break;
        }
        updateCornerBoat();
    };
    onSetSailCue = null;   // disarm the collective cue unless the ready-gate re-arms it
    transition(render);
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
$app.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'startBtn')        { haptic(15); startAmbient(); injectOcean(); step = 1; route(); }
    if (t.id === 'launchBtn')       { handleLaunch(); }
    if (t.id === 'sailNowBtn')      { doLaunch(); }
    if (t.id === 'downloadCardBtn') { saveCard(); }
    if (t.id === 'shareCardBtn')   { shareCard(); }
    if (t.id === 'resetBtn')       { startOver(t); }
});

// Tap the corner boat to peek at it larger, tap again to tuck it back.
document.getElementById('cornerBoat')?.addEventListener('click', function () {
    // Behind on folds? The corner is where you catch up, on any passive slide.
    if (followMode && !foldFollowActive && (D.nextFold || 0) < (D.foldTarget || 0)) { haptic(12); continueFolding(); return; }
    this.classList.toggle('expand'); haptic(12);
});

/* ============================================================
   START — presenter-driven. The phone boards with a "follow along" hold; the
   presenter's session/state then drives everything: answer the on-screen
   questions, fold the boat on the passive slides, set sail together. Someone
   who already sailed AND kept their card returns straight to it.
   ============================================================ */
injectOcean();
if (D.aspiration && D.launched && D.dreamSent) { renderMemento(); }
else if (D.boarded) renderAboard();
else renderBoard();
