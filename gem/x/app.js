/* === Beatty SAIL — Sailor (Participant) v7 ===
   Washi craft origami · 8 folds · hanko stamps · ink trail.
*/

// Firebase is loaded via DYNAMIC import (see FIREBASE block below) so a CDN
// outage on venue wifi can't stop the applet from running — only the shared
// Fleet sync is lost. Boat rendering + the local experience still work.
let initializeApp, getFirestore, doc, setDoc, serverTimestamp, onSnapshot, collection, getAuth, signInAnonymously;
import {
    buildOrigamiSVG, haptic, hapticPattern,
    SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FOLD_GUIDES, FOLD_FLAPS, FOLD_LABELS, CREASE_LINES, LABELS,
    STAMP_MARKS, MARK_SLOTS,
    FIREBASE_CONFIG, LOGO_URL,
} from './boat.js';

// === PAPER CREASE SOUND (Web Audio API) ===
let audioCtx;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
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
        ({ getFirestore, doc, setDoc, serverTimestamp, onSnapshot, collection } = fs);
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
            if (!data) {                       // no live session yet → wait to board
                if (!followMode && !(D.aspiration && D.launched)) renderJoinHold();
                return;
            }
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
    const cols = ['#D4A843','#F0D68A','#f5f0e8','#e8e0d0','#c9bfae','#8b5cf6'];
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
function setupFoldInteraction(stageEl, foldIndex, onComplete) {
    const guide = FOLD_GUIDES[foldIndex];
    const flap = FOLD_FLAPS[foldIndex];
    const stageRect = stageEl.getBoundingClientRect();
    const stageSize = stageRect.width;
    const s = stageSize / 280;

    const sc = {
        from: { x: guide.from.x * s, y: guide.from.y * s },
        to:   { x: guide.to.x * s,   y: guide.to.y * s },
    };

    const overlay = stageEl.querySelector('.fold-overlay');
    const dot = stageEl.querySelector('.fold-dot');
    const target = stageEl.querySelector('.fold-target');
    const dragSvg = stageEl.querySelector('.fold-drag-line');
    const ringCircle = stageEl.querySelector('.fold-progress-ring circle');
    const svgEl = stageEl.querySelector('.origami-svg');
    const flapEl = stageEl.querySelector('.fold-flap');

    dot.style.left = sc.from.x + 'px';
    dot.style.top = sc.from.y + 'px';
    target.style.left = sc.to.x + 'px';
    target.style.top = sc.to.y + 'px';

    const dx = sc.to.x - sc.from.x;
    const dy = sc.to.y - sc.from.y;
    const totalDist = Math.sqrt(dx*dx + dy*dy);

    const circ = 2 * Math.PI * 15;
    ringCircle.style.strokeDasharray = circ;
    ringCircle.style.strokeDashoffset = circ;

    const ring = stageEl.querySelector('.fold-progress-ring');
    ring.style.left = sc.from.x + 'px';
    ring.style.top = sc.from.y + 'px';

    // Ink trail canvas
    let canvas, ctx, inkFadeInterval;

    let isDown = false, completed = false;

    function getPos(e) {
        const rect = overlay.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    }

    function startInkTrail() {
        canvas = document.createElement('canvas');
        canvas.className = 'ink-trail-canvas';
        canvas.width = stageSize;
        canvas.height = stageSize;
        stageEl.appendChild(canvas);
        ctx = canvas.getContext('2d');
        inkFadeInterval = setInterval(() => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
        }, 33);
    }

    function drawInk(pos) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 168, 67, 0.55)';
        ctx.fill();
        // Glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 168, 67, 0.12)';
        ctx.fill();
    }

    function stopInkTrail() {
        if (inkFadeInterval) clearInterval(inkFadeInterval);
        if (canvas) setTimeout(() => canvas.remove(), 600);
    }

    function start(e) {
        if (completed) return;
        e.preventDefault();
        const pos = getPos(e);
        const d = Math.sqrt((pos.x-sc.from.x)**2 + (pos.y-sc.from.y)**2);
        if (d > 55) return;
        isDown = true;
        haptic(15);
        dot.style.animation = 'none';
        stageEl.classList.add('tilting');
        startInkTrail();
    }

    function move(e) {
        if (!isDown || completed) return;
        e.preventDefault();
        const pos = getPos(e);

        // Ink trail
        drawInk(pos);

        // Drag line
        dragSvg.innerHTML = `<svg viewBox="0 0 ${stageSize} ${stageSize}" width="${stageSize}" height="${stageSize}">
            <line x1="${sc.from.x}" y1="${sc.from.y}" x2="${pos.x}" y2="${pos.y}"/>
        </svg>`;

        // Paper tilt
        const progressX = (pos.x - sc.from.x) / stageSize;
        const progressY = (pos.y - sc.from.y) / stageSize;
        const tiltX = -progressY * 12;
        const tiltY = progressX * 8;
        svgEl.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        // Progress
        const distToTarget = Math.sqrt((pos.x-sc.to.x)**2 + (pos.y-sc.to.y)**2);
        const progress = Math.max(0, Math.min(1, 1 - distToTarget / totalDist));
        ringCircle.style.strokeDashoffset = circ * (1 - progress);

        // Fold flap visualization
        if (flap.clipFrom && flapEl) {
            flapEl.style.opacity = '1';
            const interp = `polygon(${interpolatePolygon(flap.clipFrom, flap.clipTo, progress)})`;
            flapEl.style.clipPath = interp;
            flapEl.style.webkitClipPath = interp;
            const deg = progress * flap.maxDeg;
            const flapSvg = flapEl.querySelector('.origami-svg');
            if (flapSvg) {
                flapSvg.style.transformOrigin = flap.axis;
                flapSvg.style.transform = `${flap.rotate}(${deg}deg)`;
            }
        }

        // Move ring with finger
        ring.style.left = pos.x + 'px';
        ring.style.top = pos.y + 'px';

        // Haptic + sound milestones
        if (progress > 0.3 && progress < 0.33) { haptic(15); playCreaseSound(); }
        if (progress > 0.6 && progress < 0.63) { haptic(20); playCreaseSound(); }
        if (progress > 0.85 && progress < 0.88) { haptic(30); playCreaseSound(); }

        if (distToTarget < 30) {
            completed = true; isDown = false;
            svgEl.style.transform = '';
            stageEl.classList.remove('tilting');
            if (flapEl) flapEl.style.opacity = '0';
            stopInkTrail();
            haptic(80);
            onComplete();
        }
    }

    function end() {
        if (!isDown || completed) return;
        isDown = false;
        dragSvg.innerHTML = '';
        svgEl.style.transform = '';
        stageEl.classList.remove('tilting');
        dot.style.animation = '';
        stopInkTrail();
        if (flapEl) {
            flapEl.style.opacity = '0';
            const flapSvg = flapEl.querySelector('.origami-svg');
            if (flapSvg) flapSvg.style.transform = '';
        }
        ring.style.left = sc.from.x + 'px';
        ring.style.top = sc.from.y + 'px';
        ringCircle.style.strokeDashoffset = circ;
    }

    overlay.addEventListener('mousedown', start);
    overlay.addEventListener('mousemove', move);
    overlay.addEventListener('mouseup', end);
    overlay.addEventListener('mouseleave', end);
    overlay.addEventListener('touchstart', start, { passive: false });
    overlay.addEventListener('touchmove', move, { passive: false });
    overlay.addEventListener('touchend', end);
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

    // Arrow SVG
    const fx = guide.from.x, fy = guide.from.y;
    const tx = guide.to.x, ty = guide.to.y;
    const adx = tx-fx, ady = ty-fy;
    const aLen = Math.sqrt(adx*adx+ady*ady);
    const ux = adx/aLen, uy = ady/aLen;
    const ahX = fx+adx*0.75, ahY = fy+ady*0.75;
    const sz = 7;

    $app.innerHTML = `
    <div class="sail-screen">
        <div class="paper-zone">
            ${foldFollowActive ? '' : progressBarHTML(questionsDone())}
            <div class="origami-stage" id="origamiStage">
                ${buildOrigamiSVG(c, paperStage, 280, extras())}
                <div class="fold-flap" style="opacity:0;">
                    ${buildOrigamiSVG(c, paperStage, 280, extras())}
                </div>
                <svg class="fold-arrow" viewBox="0 0 280 280" style="width:100%;height:100%;">
                    <line x1="${fx}" y1="${fy}" x2="${fx+adx*0.78}" y2="${fy+ady*0.78}"/>
                    <polygon points="${ahX},${ahY} ${ahX-ux*sz-uy*sz*0.5},${ahY-uy*sz+ux*sz*0.5} ${ahX-ux*sz+uy*sz*0.5},${ahY-uy*sz-ux*sz*0.5}"/>
                </svg>
                <div class="fold-overlay"></div>
                <div class="fold-dot"></div>
                <div class="fold-target"></div>
                <div class="fold-progress-ring"><svg viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="18" r="15"/></svg></div>
                <div class="fold-drag-line"></div>
            </div>
        </div>
        <div class="content-zone text-center">
            <div class="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2" style="background:rgba(212,168,67,0.1);border:1px solid rgba(212,168,67,0.3);">
                <div class="fold-badge">${foldIndex+1}</div>
                <span class="font-bold text-sm" style="color:var(--accent-gold-light);">Fold ${foldIndex+1} of 8</span>
            </div>
            <div class="fold-step-indicator justify-center">
                <div class="fold-step-mini">${buildOrigamiSVG(BOAT_DEFAULTS, paperStage, 24)}</div>
                <span class="fold-step-arrow-icon">→</span>
                <div class="fold-step-mini">${buildOrigamiSVG(BOAT_DEFAULTS, Math.min(paperStage+1, 8), 24)}</div>
            </div>
            <p class="text-xs mb-1" style="color:var(--text-secondary);">${FOLD_LABELS[foldIndex]}</p>
            <p class="text-[10px]" style="color:var(--text-muted);">Drag from the <span style="color:var(--accent-gold);font-weight:700;">glowing dot</span> toward the target · then <span style="color:var(--accent-gold);font-weight:700;">slide along the crease</span></p>
        </div>
    </div>`;

    const stageEl = document.getElementById('origamiStage');
    setupFoldInteraction(stageEl, foldIndex, () => {
        // Play light crease sound on drag completion
        playCreaseSound();

        // Hide guides
        stageEl.querySelector('.fold-dot').style.opacity = '0';
        stageEl.querySelector('.fold-target').style.opacity = '0';
        stageEl.querySelector('.fold-arrow').style.opacity = '0';
        stageEl.querySelector('.fold-progress-ring').style.opacity = '0';
        stageEl.querySelector('.fold-drag-line').innerHTML = '';

        // === ANIMATED HAND-ALONG-CREASE interaction ===
        const creaseLine = CREASE_LINES[foldIndex];
        const stageRect2 = stageEl.getBoundingClientRect();
        const s2 = stageRect2.width / 280;
        const cx1 = creaseLine.x1 * s2, cy1 = creaseLine.y1 * s2;
        const cx2 = creaseLine.x2 * s2, cy2 = creaseLine.y2 * s2;
        const cLen = Math.sqrt((cx2-cx1)**2 + (cy2-cy1)**2);

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
        let creaseDown = false, creaseDone = false;

        function creasePos(e) {
            const rect = creaseOverlay.getBoundingClientRect();
            const ex = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const ey = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            // Project onto crease line
            const dx = cx2 - cx1, dy = cy2 - cy1;
            let t = ((ex - cx1) * dx + (ey - cy1) * dy) / (dx * dx + dy * dy);
            t = Math.max(0, Math.min(1, t));
            return { t, x: cx1 + dx * t, y: cy1 + dy * t };
        }

        function creaseStart(e) {
            if (creaseDone) return;
            e.preventDefault();
            const p = creasePos(e);
            if (Math.sqrt((p.x - cx1)**2 + (p.y - cy1)**2) > 60 && p.t < 0.15) return; // must start near beginning
            creaseDown = true;
            handEl.style.transition = 'none';
            haptic(15);
        }

        function creaseMove(e) {
            if (!creaseDown || creaseDone) return;
            e.preventDefault();
            const p = creasePos(e);
            const dustMultiplier = getIntensity().gain / 0.2; // 1→1.75 across chapters

            // Move hand
            handEl.style.left = p.x + 'px';
            handEl.style.top = p.y + 'px';

            // Living Crease: deepening stroke-width and darkening colour
            const sw = 1.5 + p.t * 3.5 * dustMultiplier;
            sealedLine.setAttribute('stroke-width', sw);
            const r = Math.round(180 - p.t * 60);
            const g = Math.round(140 - p.t * 40);
            sealedLine.setAttribute('stroke', `rgba(${r},${g},50,${(0.6 + p.t * 0.35).toFixed(2)})`);

            // Grow sealed line behind hand
            sealedLine.setAttribute('x2', p.x);
            sealedLine.setAttribute('y2', p.y);

            // Living Crease: dust particles at finger position
            if (Math.random() < 0.35 * dustMultiplier) {
                spawnDust(p.x, p.y, Math.ceil(2 * dustMultiplier));
            }

            // Pitch-shifted crease sounds + progressive haptics
            const pitch = 1.0 + p.t * 0.25; // 1.0x → 1.25x
            if (p.t > 0.25 && p.t < 0.28) { playCreasePitched(pitch); haptic(Math.round(15 * dustMultiplier)); }
            if (p.t > 0.5 && p.t < 0.53) { playCreasePitched(pitch); haptic(Math.round(20 * dustMultiplier)); }
            if (p.t > 0.75 && p.t < 0.78) { playCreasePitched(pitch); haptic(Math.round(25 * dustMultiplier)); }

            if (p.t > 0.9) {
                creaseDone = true; creaseDown = false;
                // Snap to end
                handEl.style.transition = 'left 0.15s, top 0.15s';
                handEl.style.left = cx2 + 'px';
                handEl.style.top = cy2 + 'px';
                sealedLine.setAttribute('x2', cx2);
                sealedLine.setAttribute('y2', cy2);
                // Dust burst at completion
                spawnDust(cx2, cy2, Math.ceil(6 * dustMultiplier));
                // Final seal
                handEl.classList.add('crease-hand-done');
                haptic(60);
                playFoldSound();
                setTimeout(() => {
                    creaseOverlay.remove();
                    finishFold();
                }, 500);
            }
        }

        function creaseEnd() {
            if (!creaseDown || creaseDone) return;
            creaseDown = false;
            // Spring hand back to start
            handEl.style.transition = 'left 0.3s cubic-bezier(0.22,1,0.36,1), top 0.3s cubic-bezier(0.22,1,0.36,1)';
            handEl.style.left = cx1 + 'px';
            handEl.style.top = cy1 + 'px';
            sealedLine.setAttribute('x2', cx1);
            sealedLine.setAttribute('y2', cy1);
        }

        creaseOverlay.addEventListener('mousedown', creaseStart);
        creaseOverlay.addEventListener('mousemove', creaseMove);
        creaseOverlay.addEventListener('mouseup', creaseEnd);
        creaseOverlay.addEventListener('mouseleave', creaseEnd);
        creaseOverlay.addEventListener('touchstart', creaseStart, { passive: false });
        creaseOverlay.addEventListener('touchmove', creaseMove, { passive: false });
        creaseOverlay.addEventListener('touchend', creaseEnd);

        function finishFold() {
            const isHatToDiamond = foldIndex === 5;
            const intensity = getIntensity();

            if (isBoatReveal) {
                stageEl.classList.add('boat-reveal');
                hapticPattern([50, 30, 100, 30, 80]);
            } else if (!isHatToDiamond) {
                stageEl.classList.add('fold-animating');
            }

            // Flash
            const flash = document.createElement('div');
            flash.className = 'fold-flash';
            stageEl.appendChild(flash);
            setTimeout(() => flash.remove(), 700);

            // Update SVG to next stage
            const svgInner = stageEl.querySelector('.origami-svg');

            if (isBoatReveal) {
                // === DRAMATIC BOAT REVEAL ===
                svgInner.style.transition = 'transform 1.2s cubic-bezier(0.22,1,0.36,1)';
                svgInner.style.transform = 'scaleX(1.5) scaleY(0.45)';
                setTimeout(() => {
                    // First show boat in washi base colours (no user colours yet)
                    const baseC = { ...c, hull: BOAT_DEFAULTS.hull, sail: BOAT_DEFAULTS.sail, sailGradient: null, flag: BOAT_DEFAULTS.flag };
                    svgInner.outerHTML = `<div class="boat-rising">${buildOrigamiSVG(baseC, 8, 280, extras())}</div>`;
                    playRevealSound();
                    waveSurge();
                    // Screen shake
                    $app.classList.add('screen-shake');
                    setTimeout(() => $app.classList.remove('screen-shake'), 400);
                    stageEl.classList.remove('boat-reveal');
                    stageEl.classList.add('boat-reveal');
                    spawnParticles(stageEl, intensity.particles + 10);
                    spawnRipples(stageEl);
                    // Fade in user's chosen colours after 500ms
                    setTimeout(() => {
                        const rising = stageEl.querySelector('.boat-rising');
                        if (rising) rising.innerHTML = buildOrigamiSVG(c, 8, 280, extras());
                    }, 500);
                }, 1200);
            } else if (isHatToDiamond) {
                svgInner.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                svgInner.style.transform = 'scaleX(0.35) scaleY(1.3)';
                haptic(intensity.hapticBase);
                setTimeout(() => {
                    svgInner.outerHTML = buildOrigamiSVG(c, 6, 280, extras());
                    spawnParticles(stageEl, intensity.particles);
                }, 650);
            } else {
                setTimeout(() => {
                    svgInner.outerHTML = buildOrigamiSVG(c, paperStage + 1, 280, extras());
                    spawnParticles(stageEl, intensity.particles);
                }, 450);
            }

            const advanceDelay = isBoatReveal ? 3500 : isHatToDiamond ? 1400 : 1000;
            const nextStep = NEXT_STEP_AFTER_FOLD[foldIndex];
            // In follow/solo mode a fold returns to the "look up" rest state and
            // waits for the presenter's next beat, instead of self-advancing.
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
    const ac = archetype.color || '#D4A843';
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
function renderMemento() {
    stopAmbient();
    const c = colors();
    const gold = 'var(--accent-gold)';
    // The pathways they chose live on the globe & map.
    const g = D.global ? D.global.text : null;
    const l = D.local ? D.local.text : null;
    const pathText = (g || l)
        ? `You set your sights on ${g ? `a global exchange to <b style="color:var(--text-primary);">${g}</b>` : ''}${g && l ? ' and ' : ''}${l ? `an industry attachment at <b style="color:var(--text-primary);">${l}</b>` : ''}. Beatty has the pathway waiting.`
        : `With exchanges and attachments across the world, Beatty has a pathway waiting for you.`;
    // What they discovered from the live polls.
    const pk = Object.keys(D.polls || {});
    const facts = [...new Set(pk.map(k => String(D.polls[k].insight || '').replace('Good guess! ', '')).filter(Boolean))].slice(0, 3);
    const factsHTML = facts.length
        ? `<div class="memento-section" style="border-color:${gold};"><h4 class="font-bold uppercase tracking-wide text-[10px] mb-1.5" style="color:${gold};">What you discovered</h4><ul class="text-xs leading-relaxed" style="color:var(--text-secondary);margin:0;padding-left:16px;">${facts.map(t => `<li style="margin-bottom:4px;">${t}</li>`).join('')}</ul></div>`
        : '';
    const moodLine = D.pulse ? `<p class="text-[10px] mt-1" style="color:var(--text-muted);">Your pulse tonight: <span style="color:var(--text-secondary);">${D.pulse}</span></p>` : '';

    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone pt-4">
            <div class="memento-card" id="memento-card" style="border-color:${gold};">
                <div class="memento-header">
                    <div class="memento-boat">${buildOrigamiSVG(c, 9, 92, extras())}</div>
                    <div style="flex:1;min-width:0;">
                        <h1 class="text-lg font-black leading-tight" style="color:${gold};">Your Boat, Your Course</h1>
                        <p class="text-[10px] font-bold uppercase tracking-widest mt-0.5" style="color:var(--text-muted);">Beatty Compass Card · Open House 2026</p>
                        ${moodLine}
                    </div>
                </div>
                <div class="memento-quote">
                    <p class="text-sm font-serif italic leading-relaxed" style="color:var(--text-primary);">"You folded it, you named it, you set it sailing. Every Beattyian charts their own course — Non Vi Sed Arte."</p>
                </div>
                <div class="memento-divider"></div>
                <div style="padding:12px 20px;">
                    <div class="memento-section mc-path" style="border-color:#12299c;background:rgba(18,41,156,0.18);">
                        <h4 class="font-bold uppercase tracking-wide text-[10px] mb-1" style="color:#8fa6ff;">Your chosen pathways</h4>
                        <p class="text-xs leading-relaxed" style="color:var(--text-secondary);">${pathText}</p>
                    </div>
                    ${factsHTML}
                </div>
                <div class="memento-footer">
                    <p class="text-[10px] mb-1 uppercase tracking-widest" style="color:var(--text-muted);">My aspiration</p>
                    <p class="text-3xl font-black uppercase tracking-wide" style="color:${gold};text-shadow:0 2px 12px rgba(0,0,0,0.5);">${(D.aspiration || 'FUTURE LEADER').toUpperCase()}</p>
                    <div class="flex items-center justify-center gap-2 mt-3">
                        <img src="${LOGO_URL}" alt="Beatty" class="h-4 w-4 opacity-60" style="width:16px;height:16px;object-fit:contain" onerror="this.style.display='none'">
                        <p class="text-[10px]" style="color:var(--text-muted);">Beatty Secondary School · Harmonising Hearts</p>
                    </div>
                </div>
            </div>
            <button id="downloadCardBtn" class="nav-btn primary w-full mt-4 text-lg uppercase tracking-wide">Download Card</button>
            ${navigator.share ? '<button id="shareCardBtn" class="nav-btn secondary w-full mt-2 text-sm uppercase tracking-wide">Share</button>' : ''}
            <button id="resetBtn" class="mt-3 w-full text-sm underline pb-4" style="color:var(--text-muted);">Start Over</button>
        </div>
    </div>`;
}

/* ============================================================
   LAUNCH HANDLER
   ============================================================ */
// Celebratory confetti at the "Set Sail" moment (Beatty navy/gold/red).
function burstConfetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const cols = ['#FFE200', '#EC3237', '#12299c', '#ffffff', '#E4C400'];
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
async function doLaunch() {
    if (launching || D.launched) { renderSetSailDone(); return; }
    launching = true;
    onSetSailCue = null;
    await saveToFirebase();
    D.launched = true; save();
    hapticPattern([50, 30, 100]); burstConfetti();
    // Only land on the "set sail" hold if the presenter is still on the fleet
    // slide — if they've already moved on (e.g. to the finale), don't clobber
    // the screen applyView has since rendered underneath the departure overlay.
    setSailTransition(() => { launching = false; if (!currentView || currentView.indexOf('fleet') === 0) renderSetSailDone(); });
}

function renderReadyToSail() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen ready-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div class="ready-boat origami-stage medium mb-5">${buildOrigamiSVG(c, 8, 260, extras())}</div>
            <p class="text-xs mb-1 tracking-[0.28em] uppercase" style="color:var(--accent-gold);">Your boat is ready</p>
            <h1 class="font-serif text-2xl mb-1" style="color:var(--text-primary);">${(D.aspiration || 'Set sail').toUpperCase()}</h1>
            <div class="ready-wait mt-4 mb-2">
                <span class="ready-dot"></span>
                <span class="text-sm" style="color:var(--text-secondary);">Waiting for the captain's cue…</span>
            </div>
            <p class="text-[11px] max-w-xs" style="color:var(--text-muted);">When the whole hall sets sail together, your boat joins the fleet on the big screen. Look up. 🌊</p>
            <button id="sailNowBtn" class="nav-btn secondary mt-8" style="opacity:0;transition:opacity .5s;">Set sail now</button>
        </div>
    </div>`;
    // Arm the collective cue; if a presenter fires "Set Sail", we launch.
    onSetSailCue = doLaunch;
    if (sessionBeat === 'set_sail') { doLaunch(); return; }
    // Fallback for running without a presenter (standalone / testing): reveal a
    // self-serve button after a moment so nobody is ever stuck at the gate.
    const btn = document.getElementById('sailNowBtn');
    setTimeout(() => { if (btn && btn.isConnected) btn.style.opacity = '1'; }, 6000);
}

function downloadCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('downloadCardBtn');
    // html2canvas loads from a CDN; if it's blocked/offline, calling it throws
    // synchronously (before the .then), which would strand the button on
    // "Generating...". Fail gracefully instead — the card is still on screen to
    // photograph.
    if (typeof html2canvas === 'undefined') {
        btn.textContent = 'Screenshot to save'; setTimeout(() => { btn.textContent = 'Download Card'; }, 2200);
        return;
    }
    btn.textContent = 'Generating...'; btn.disabled = true;
    haptic(40);
    html2canvas(card, { backgroundColor: '#040a33', scale: 3, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Beatty-SAIL-Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = 'Download Card'; btn.disabled = false;
    }).catch(() => { btn.textContent = 'Download Failed'; btn.disabled = false; });
}

async function shareCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('shareCardBtn');
    if (typeof html2canvas === 'undefined' || !navigator.share) {
        btn.textContent = 'Screenshot to share'; setTimeout(() => { btn.textContent = 'Share'; }, 2200);
        return;
    }
    btn.textContent = 'Preparing...'; btn.disabled = true;
    try {
        const canvas = await html2canvas(card, { backgroundColor: '#040a33', scale: 3, useCORS: true });
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const file = new File([blob], 'Beatty-SAIL-Card.png', { type: 'image/png' });
        await navigator.share({ title: 'My Beatty SAIL Card', text: `I'm ${(computeArchetype()).name}! Fold your own boat at Beatty Open House 2026.`, files: [file] });
    } catch(e) { /* share cancelled or unsupported */ }
    btn.textContent = 'Share'; btn.disabled = false;
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
    const grew = cornerStagePrev !== -1 && stage !== cornerStagePrev;
    el.hidden = false;
    el.innerHTML = `<div class="cb-inner">${buildOrigamiSVG(colors(), stage, 92, extras())}</div><span class="cb-label">Your boat</span>`;
    if (grew) { el.classList.add('grew'); setTimeout(() => el.classList.remove('grew'), 660); }
    cornerStagePrev = stage;
}

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
const NEXUS_COLOR = {
    GeoBali:'#E0793C', NZ:'#2F7D5B', Korea:'#C64B86', MiharaJapan:'#C8536B', MutsuzawaJapan:'#4A6BD0', Estonia:'#3A87B8',
    Rockwell:'#C9962A', PIL:'#2F6D9E', Journalism:'#C24A50', TamilMurasu:'#8A5CC0', Makita:'#3F8F6A', ASTAR:'#5566CC',
};

/* --- Dispatch on the presenter's current slide --- */
function applyView(state) {
    if (!state) return;
    followMode = true; soloMode = false;
    if (soloTimerId) { clearTimeout(soloTimerId); soloTimerId = null; }
    const v = state.currentView || 'chart';
    // Leaving a poll → drop its live-results listener.
    if (v !== 'poll' && window.__pollUnsub) { window.__pollUnsub(); window.__pollUnsub = null; }
    // Signature so a repeated snapshot doesn't re-render, but a NEW poll/nexus does.
    const sig = v + '|' + (state.pollData?.id || '') + '|' + (state.nexusData?.type || '');
    if (sig === currentView) return;
    currentView = sig;
    lastSessionState = state;
    switch (v) {
        case 'poll':          showPoll(state.pollData); break;
        case 'globe':
        case 'industry_map':  showNexus(state.nexusData); break;
        case 'pulse_check':   showPulse(); break;
        case 'finale':        showDream(); break;
        case 'fleet':         triggerSetSail(); break;
        case 'memento':
        case 'end':           showCard(); break;
        case 'chart':         renderJoinHold(); break;   // opening room portrait
        // everything passive (video · slides · values · funfacts) → fold the boat
        default:              advanceFold(); break;
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
    foldFollowActive = false;
    hapticPattern([25, 40, 60]);
    const done = D.nextFold >= 8;
    renderRest(done ? 'Your boat is complete! ⛵' : 'Beautiful fold.', 'Eyes back on the big screen ✨');
    if (soloMode) { soloIdx++; }
}

/* ============================================================
   ANSWER THE ON-SCREEN QUESTION  (ported from joinbtx27, in x/ styling)
   ============================================================ */
/* Live trivia poll — vote, then watch the room's bars fill in real time. */
function showPoll(p) {
    if (!p) { renderLookUp('Get ready to vote…'); return; }
    if (D.polls && D.polls[p.id] !== undefined) { showPollResult(p); return; }
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
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:20px;">
            <p class="q-eyebrow">${mine?.correct ? '✓ You got it!' : 'Vote recorded'}</p>
            <h2 class="q-question" style="font-size:1.15rem;">${p.question}</h2>
            <div class="mt-4" id="liveBars">${p.options.map((o, i) => `
                <div class="pbar ${mine && mine.choice === i ? 'me' : ''} ${i === p.correctAnswer ? 'correct' : ''}" data-i="${i}">
                    <div class="pbar-lab"><span>${o} ${i === p.correctAnswer ? '🏆' : ''}${mine && mine.choice === i ? ' · you' : ''}</span><span class="pbar-pc">0%</span></div>
                    <div class="pbar-track"><div class="pbar-fill"></div></div>
                </div>`).join('')}</div>
            <div class="q-insight">${mine?.insight || ''}</div>
        </div>
    </div>`;
    showCornerBoat();
    if (db && collection && onSnapshot) {
        if (window.__pollUnsub) window.__pollUnsub();
        try {
            window.__pollUnsub = onSnapshot(collection(db, "polls"), (snap) => {
                const bd = {}; let total = 0;
                snap.forEach(d => { const x = d.data(); if (x.pollId === p.id) { total++; if (x.vote != null) bd[x.vote] = (bd[x.vote] || 0) + 1; } });
                p.options.forEach((o, i) => {
                    const row = document.querySelector(`#liveBars .pbar[data-i="${i}"]`); if (!row) return;
                    const cnt = bd[i] || 0, pct = total > 0 ? (cnt / total * 100) : 0;
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
    save();
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
    if (D.pulse) { renderRest('Thanks for sharing! 💛', 'Your mood is on the big screen'); return; }
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
    D.pulse = k; save(); haptic(30);
    if (db && auth?.currentUser) { try { await setDoc(doc(db, "pulseCheck", auth.currentUser.uid), { choice: k, timestamp: Date.now() }); } catch (e) {} }
    renderRest('Thanks for sharing! 💛', 'Your mood is on the big screen');
}

/* Finale — one-word aspiration, cast into the Hive AND written on your boat. */
function showDream() {
    if (D.aspiration && D.dreamSent) { renderRest('Your dream is in the Hive 💛', 'Watch it glow on the big screen ✨'); return; }
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone" style="padding-top:18px;">
            <p class="q-eyebrow">🐝 Add your cell to the Hive</p>
            <h2 class="q-question">One word — what do you aspire to become?</h2>
            <div class="origami-stage medium mx-auto my-3" id="dreamBoat" style="max-width:220px;">${buildOrigamiSVG(c, 9, 220, extras())}</div>
            <input type="text" id="dreamInput" maxlength="16" class="dream-field" placeholder="e.g. Innovator" autocomplete="off">
            <button class="nav-btn primary w-full mt-3 text-base uppercase tracking-wide" id="dreamBtn">Add to the Hive 🐝</button>
        </div>
    </div>`;
    const f = document.getElementById('dreamInput');
    f.addEventListener('input', (e) => {
        D.aspiration = e.target.value.trim();
        const st = document.getElementById('dreamBoat'); if (st) st.innerHTML = buildOrigamiSVG(c, 9, 220, extras());
    });
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitDream(); });
    document.getElementById('dreamBtn').addEventListener('click', submitDream);
    try { f.focus(); } catch (e) {}
}
async function submitDream() {
    const f = document.getElementById('dreamInput');
    const w = (f.value || '').replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, 18);
    if (!w) { f.style.borderColor = '#ef4444'; return; }
    D.aspiration = w; D.dreamSent = true; save();
    hapticPattern([40, 30, 80]); burstConfetti();
    if (db && auth?.currentUser) { try { await setDoc(doc(db, "aspirations", auth.currentUser.uid), { word: w, timestamp: serverTimestamp() }); } catch (e) {} }
    saveToFirebase();   // stamp the named dream onto the boat in the fleet
    if (soloMode) soloIdx++;
    renderRest('Your dream is in the Hive 💛', 'Watch it glow on the big screen ✨');
}

/* Collective Set Sail — the whole hall launches at once on the fleet slide. */
function triggerSetSail() {
    if (D.launched) { renderSetSailDone(); return; }
    doLaunch();
}
function renderSetSailDone() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <p class="text-[10px] mb-2 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">You've set sail</p>
            <h1 class="font-serif text-2xl mb-3" style="color:var(--text-primary);">Look up — you're in the fleet</h1>
            <div class="follow-boat">${buildOrigamiSVG(c, 8, 210, extras())}</div>
            <p class="text-sm mt-4 max-w-xs" style="color:var(--text-secondary);">Every boat on the big screen is a Beattyian setting sail from our Hive. 🌊</p>
        </div>
    </div>`;
}
function showCard() { renderMemento(); }

/* --- Resting / holding screens shown between the presenter's slides --- */
function renderJoinHold() {
    hideCornerBoat();
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen follow-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <img src="${LOGO_URL}" alt="Beatty" style="width:54px;height:54px;object-fit:contain" class="mb-4" onerror="this.style.display='none'">
            <p class="text-[10px] mb-2 tracking-[0.3em] uppercase" style="color:var(--accent-gold);">You're aboard</p>
            <h1 class="font-serif text-2xl mb-4" style="color:var(--text-primary);">Follow along on the big screen</h1>
            <div class="follow-boat mb-4">${buildOrigamiSVG(c, Math.min(D.nextFold || 0, 8), 180, extras())}</div>
            <p class="text-sm max-w-xs" style="color:var(--text-secondary);">Answer the questions, fold your boat as we go, and set sail with the whole hall. 🌊</p>
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
            <div class="follow-boat">${buildOrigamiSVG(c, stage, 190, extras())}</div>
        </div>
    </div>`;
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
    else if (s === 'dream') showDream();
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
    if (t.id === 'downloadCardBtn') { downloadCard(); }
    if (t.id === 'shareCardBtn')   { shareCard(); }
    if (t.id === 'resetBtn') {
        localStorage.removeItem(SK);
        D = { marks: [] }; followMode = false; soloMode = false; currentView = null;
        renderJoinHold();
    }
});

// Tap the corner boat to peek at it larger, tap again to tuck it back.
document.getElementById('cornerBoat')?.addEventListener('click', function () {
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
else renderJoinHold();
