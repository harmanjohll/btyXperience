/* ═══════════════════════════════════════════════════════════════
   btyXperience — Audience Module
   Faithful to sailor.js: washi origami, two-pick questions,
   sound synthesis, fold interaction, dust, ocean, stamps, reveal.
   Phase 1: Self-paced profiling & origami
   Phase 2: Presenter-synced interactions
   ═══════════════════════════════════════════════════════════════ */

import { SAIL_DATA, QUESTION_SEQUENCE, FOLD_STAGE_MAP, ARCHETYPES, TOTAL_QUESTIONS,
         computeArchetype, SCHOOL, COLORS, LOGO_URL } from '../shared/data.js';
import { initFirebase, writeDoc, listenDoc, listenCollection, uid,
         doc, setDoc, getDb, getAppAuth, serverTimestamp, onSnapshot, collection } from '../shared/firebase.js';
import { buildOrigamiSVG, BOAT_DEFAULTS, FOLD_LABELS, FOLD_GUIDES, FOLD_FLAPS,
         CREASE_LINES, haptic, hapticPattern } from '../shared/boat-svg.js';

const STORAGE_KEY = 'btyx_audience_v2';
const $app = document.getElementById('app');

let userData = {};
let currentQuestionIndex = 0;
let currentFoldStage = 0;
let paceMode = 'audience';

// ═══════════════════════════════════════════════════════════════
// SOUND SYNTHESIS (from sailor.js)
// ═══════════════════════════════════════════════════════════════
let audioCtx;
let ambientOsc, ambientGain;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playCreaseSound() {
    try {
        const ctx = getAudioCtx();
        const dur = 0.18;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4500; bp.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        src.connect(hp).connect(bp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) {}
}

function playFoldSound() {
    try {
        const ctx = getAudioCtx();
        const dur = 0.35;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * (t < 0.3 ? t / 0.3 : Math.pow(1 - (t - 0.3) / 0.7, 1.5)) * 0.7;
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        src.connect(bp).connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) {}
}

function playRevealSound() {
    try {
        const ctx = getAudioCtx();
        const t = ctx.currentTime;
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

// ═══════════════════════════════════════════════════════════════
// DUST PARTICLES
// ═══════════════════════════════════════════════════════════════
function spawnDust(x, y, count = 3) {
    const container = document.querySelector('.origami-stage');
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

function spawnParticles(container, count = 8) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'crease-dust';
        p.style.left = (rect.width / 2 + (Math.random() - 0.5) * 80) + 'px';
        p.style.top = (rect.height / 2 + (Math.random() - 0.5) * 80) + 'px';
        p.style.setProperty('--dx', (Math.random() - 0.5) * 60 + 'px');
        p.style.setProperty('--dy', (-10 - Math.random() * 40) + 'px');
        container.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
}

// ═══════════════════════════════════════════════════════════════
// LIVING OCEAN
// ═══════════════════════════════════════════════════════════════
function injectOcean() {
    if (document.querySelector('.ocean-canvas')) return;
    const oc = document.createElement('div');
    oc.className = 'ocean-canvas';
    oc.innerHTML = '<div class="wave wave-1"></div><div class="wave wave-2"></div><div class="wave wave-3"></div>';
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

// ═══════════════════════════════════════════════════════════════
// PAGE TRANSITION
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// FOLD INTERACTION (drag-to-fold from sailor.js)
// ═══════════════════════════════════════════════════════════════
function interpolatePolygon(from, to, t) {
    const parsePoints = s => s.replace(/polygon\(|\)/g, '').split(',').map(p => p.trim().split(/\s+/).map(v => parseFloat(v)));
    const f = parsePoints(from);
    const tPts = parsePoints(to);
    return f.map((pt, i) => pt.map((v, j) => (v + (tPts[i][j] - v) * t) + '%').join(' ')).join(', ');
}

function setupFoldInteraction(stageEl, foldIndex, onComplete) {
    const guide = FOLD_GUIDES[foldIndex];
    const flap = FOLD_FLAPS[foldIndex];
    if (!guide) { onComplete(); return; }

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

    if (!overlay || !dot || !target) { onComplete(); return; }

    dot.style.left = sc.from.x + 'px';
    dot.style.top = sc.from.y + 'px';
    target.style.left = sc.to.x + 'px';
    target.style.top = sc.to.y + 'px';

    const dx = sc.to.x - sc.from.x;
    const dy = sc.to.y - sc.from.y;
    const totalDist = Math.sqrt(dx*dx + dy*dy);

    const circ = 2 * Math.PI * 15;
    if (ringCircle) {
        ringCircle.style.strokeDasharray = circ;
        ringCircle.style.strokeDashoffset = circ;
    }

    const ring = stageEl.querySelector('.fold-progress-ring');
    if (ring) { ring.style.left = sc.from.x + 'px'; ring.style.top = sc.from.y + 'px'; }

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
        drawInk(pos);

        if (dragSvg) {
            dragSvg.innerHTML = `<svg viewBox="0 0 ${stageSize} ${stageSize}" width="${stageSize}" height="${stageSize}">
                <line x1="${sc.from.x}" y1="${sc.from.y}" x2="${pos.x}" y2="${pos.y}"/>
            </svg>`;
        }

        // Paper tilt
        const progressX = (pos.x - sc.from.x) / stageSize;
        const progressY = (pos.y - sc.from.y) / stageSize;
        const tiltX = -progressY * 12;
        const tiltY = progressX * 8;
        if (svgEl) svgEl.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        // Progress
        const distToTarget = Math.sqrt((pos.x-sc.to.x)**2 + (pos.y-sc.to.y)**2);
        const progress = Math.max(0, Math.min(1, 1 - distToTarget / totalDist));
        if (ringCircle) ringCircle.style.strokeDashoffset = circ * (1 - progress);

        // Fold flap
        if (flap && flap.clipFrom && flapEl) {
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

        if (ring) { ring.style.left = pos.x + 'px'; ring.style.top = pos.y + 'px'; }

        // Haptic + sound at milestones
        if (progress > 0.3 && progress < 0.33) { haptic(15); playCreaseSound(); spawnDust(pos.x, pos.y, 2); }
        if (progress > 0.6 && progress < 0.63) { haptic(20); playCreaseSound(); spawnDust(pos.x, pos.y, 3); }
        if (progress > 0.85 && progress < 0.88) { haptic(30); playCreaseSound(); spawnDust(pos.x, pos.y, 4); }

        if (distToTarget < 30) {
            completed = true; isDown = false;
            if (svgEl) svgEl.style.transform = '';
            stageEl.classList.remove('tilting');
            if (flapEl) flapEl.style.opacity = '0';
            stopInkTrail();
            haptic(80);
            playFoldSound();
            spawnDust(pos.x, pos.y, 6);
            onComplete();
        }
    }

    function end() {
        if (!isDown || completed) return;
        isDown = false;
        if (dragSvg) dragSvg.innerHTML = '';
        if (svgEl) svgEl.style.transform = '';
        stageEl.classList.remove('tilting');
        dot.style.animation = '';
        stopInkTrail();
        if (flapEl) {
            flapEl.style.opacity = '0';
            const flapSvg = flapEl.querySelector('.origami-svg');
            if (flapSvg) flapSvg.style.transform = '';
        }
        if (ring) { ring.style.left = sc.from.x + 'px'; ring.style.top = sc.from.y + 'px'; }
        if (ringCircle) ringCircle.style.strokeDashoffset = circ;
    }

    overlay.addEventListener('mousedown', start);
    overlay.addEventListener('mousemove', move);
    overlay.addEventListener('mouseup', end);
    overlay.addEventListener('mouseleave', end);
    overlay.addEventListener('touchstart', start, { passive: false });
    overlay.addEventListener('touchmove', move, { passive: false });
    overlay.addEventListener('touchend', end);
}

// ═══════════════════════════════════════════════════════════════
// STAMP ANIMATION
// ═══════════════════════════════════════════════════════════════
function animateStampPress(opt, paperStage, onComplete) {
    const stageEl = document.querySelector('.origami-stage.medium');
    if (!stageEl) { onComplete(); return; }

    const col = opt.color || '#8b3a3a';
    const sz = 36;
    // Place stamp at centre of paper for simplicity
    const rect = stageEl.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height * 0.6;

    const el = document.createElement('div');
    el.className = 'stamp-fly-in';
    el.style.cssText = `position:absolute;left:${px}px;top:${py}px;width:${sz}px;height:${sz}px;z-index:30;pointer-events:none;transform:translate(-50%,-50%);`;
    el.innerHTML = `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" style="color:${col};overflow:visible;">
        <circle cx="12" cy="12" r="10" fill="${col}" opacity="0.4" stroke="${col}" stroke-width="1.5"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${opt.id?.charAt(0).toUpperCase() || '?'}</text>
    </svg>`;
    stageEl.appendChild(el);

    setTimeout(() => { playStampSound(); haptic(50); }, 300);
    setTimeout(() => { el.remove(); onComplete(); }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); }
function boatColors() { return { ...BOAT_DEFAULTS }; }
function extras() { return { aspiration: userData.aspiration || '' }; }

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
async function init() {
    userData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    injectOcean();

    try {
        await initFirebase();
    } catch (e) {
        console.error('Firebase init failed:', e);
        renderError('Connection Error', 'Could not connect. Please refresh.');
        return;
    }

    listenDoc('config', 'pace', (data) => {
        if (data) paceMode = data.mode || 'audience';
        updatePaceBanner();
    });

    if (userData.archetype && userData.phase === 'done') {
        renderCompassCard();
    } else if (userData.archetype) {
        startPhase2();
    } else {
        // Restore question progress
        if (userData.picks && userData.picks.length > 0) {
            currentQuestionIndex = userData.picks.length;
            const lastStages = FOLD_STAGE_MAP[currentQuestionIndex - 1];
            if (lastStages) currentFoldStage = lastStages[lastStages.length - 1] + 1;
        }
        renderWelcome();
    }
}

function updatePaceBanner() {
    let banner = document.getElementById('paceBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'paceBanner';
        banner.className = 'pace-banner';
        document.body.prepend(banner);
    }
    if (paceMode === 'presenter') {
        banner.className = 'pace-banner presenter';
        banner.textContent = 'Following presentation';
    } else {
        banner.className = 'pace-banner audience';
        banner.textContent = 'Explore at your own pace';
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1: Self-paced profiling + origami
// ═══════════════════════════════════════════════════════════════

function renderWelcome() {
    $app.innerHTML = `
        <div class="text-center page-enter w-full max-w-md">
            <img src="${LOGO_URL}" alt="Beatty Crest" class="mx-auto h-24 w-24 mb-6 drop-shadow-lg">
            <h1 class="text-3xl font-black mb-2" style="color:var(--accent-gold)">The Beatty Experience</h1>
            <p class="text-sm mb-2" style="color:var(--text-muted)">${SCHOOL.motto}</p>
            <p class="text-sm mb-8 leading-relaxed" style="color:var(--text-secondary)">
                Build your paper boat as you discover your path.<br>
                Answer 6 questions — each fold brings you closer to your archetype.
            </p>
            <button id="startBtn" class="btn-start text-lg">Set Sail</button>
        </div>`;
}

function renderFoldStep() {
    // Determine which fold stages to do for the current question
    const stages = FOLD_STAGE_MAP[currentQuestionIndex];
    if (!stages || stages.length === 0) {
        renderQuestion();
        return;
    }

    // Set wave intensity by SAIL section
    const qDef = QUESTION_SEQUENCE[currentQuestionIndex];
    const intensityMap = { S: 4, A: 6, I: 9, L: 13 };
    setWaveIntensity(intensityMap[qDef.sailKey] || 4);

    const sailSection = SAIL_DATA[qDef.sailKey];
    const foldIndex = stages[0]; // first fold stage to do
    const nextFoldStage = stages[0]; // SVG stage to show

    $app.innerHTML = `
        <div class="sail-screen page-enter">
            <div class="paper-zone">
                ${progressBarHTML(currentQuestionIndex)}
                <div class="origami-stage medium" id="foldStage">
                    ${buildOrigamiSVG(boatColors(), nextFoldStage, 280, extras())}
                    <div class="fold-flap">${buildOrigamiSVG(boatColors(), nextFoldStage, 280, extras())}</div>
                    <div class="fold-overlay"></div>
                    <div class="fold-dot"></div>
                    <div class="fold-target"></div>
                    <div class="fold-arrow"></div>
                    <div class="fold-drag-line"></div>
                    <svg class="fold-progress-ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15"/></svg>
                </div>
                <p class="fold-instruction">${FOLD_LABELS[foldIndex] || sailSection.foldInstruction}</p>
            </div>
        </div>`;

    const stageEl = document.getElementById('foldStage');
    let currentFoldIdx = 0;

    function doNextFold() {
        if (currentFoldIdx >= stages.length) {
            // All folds done, show question
            currentFoldStage = stages[stages.length - 1] + 1;
            playFoldSound();
            setTimeout(() => transition(() => renderQuestion()), 400);
            return;
        }

        const fi = stages[currentFoldIdx];
        // Update SVG to current stage
        const svgContainer = stageEl.querySelector('.origami-svg');
        if (svgContainer && currentFoldIdx > 0) {
            const newSvg = document.createElement('div');
            newSvg.innerHTML = buildOrigamiSVG(boatColors(), fi, 280, extras());
            const newSvgEl = newSvg.querySelector('.origami-svg') || newSvg.firstElementChild;
            svgContainer.replaceWith(newSvgEl);
        }

        setupFoldInteraction(stageEl, fi >= FOLD_GUIDES.length ? FOLD_GUIDES.length - 1 : fi, () => {
            currentFoldIdx++;
            if (currentFoldIdx < stages.length) {
                // Update SVG for next stage
                const nextStage = stages[currentFoldIdx];
                stageEl.innerHTML = `
                    ${buildOrigamiSVG(boatColors(), nextStage, 280, extras())}
                    <div class="fold-flap">${buildOrigamiSVG(boatColors(), nextStage, 280, extras())}</div>
                    <div class="fold-overlay"></div>
                    <div class="fold-dot"></div>
                    <div class="fold-target"></div>
                    <div class="fold-arrow"></div>
                    <div class="fold-drag-line"></div>
                    <svg class="fold-progress-ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15"/></svg>`;
                const instrEl = document.querySelector('.fold-instruction');
                if (instrEl) instrEl.textContent = FOLD_LABELS[nextStage >= FOLD_GUIDES.length ? FOLD_GUIDES.length - 1 : nextStage] || '';
                setTimeout(() => doNextFold(), 200);
            } else {
                doNextFold();
            }
        });
    }

    setTimeout(() => doNextFold(), 300);
}

function renderQuestion() {
    if (currentQuestionIndex >= QUESTION_SEQUENCE.length) {
        finishProfiling();
        return;
    }

    const qDef = QUESTION_SEQUENCE[currentQuestionIndex];
    const sailSection = SAIL_DATA[qDef.sailKey];
    const isMain = qDef.type === 'main';

    const scenario = isMain ? sailSection.scenario : sailSection.subScenario;
    const question = isMain ? sailSection.question : sailSection.subQuestion;
    const options = isMain ? sailSection.options : sailSection.subOptions;
    const info = isMain ? sailSection.info : null;

    // Restore previous picks if going back
    const pickKey = qDef.sailKey + (qDef.type === 'sub' ? '_sub' : '');

    $app.innerHTML = `
        <div class="sail-screen page-enter">
            <div class="paper-zone">
                ${progressBarHTML(currentQuestionIndex)}
                <div class="origami-stage medium">
                    ${buildOrigamiSVG(boatColors(), currentFoldStage, 280, extras())}
                </div>
            </div>
            <div class="content-zone">
                <div class="flex items-center gap-2 mb-3">
                    <span class="sail-badge">${sailSection.letter}</span>
                    <div>
                        <span class="font-black text-sm" style="color:var(--accent-gold);">${sailSection.title}</span>
                        <span class="text-xs ml-2" style="color:var(--text-muted);">${sailSection.subtitle}</span>
                    </div>
                </div>
                ${scenario ? `<div class="scenario-box mb-3">
                    <p class="text-sm leading-relaxed font-serif italic" style="color:var(--text-secondary);">${scenario}</p>
                </div>` : ''}
                <h2 class="text-base font-bold mb-1 leading-snug" style="color:var(--text-primary);">${question}</h2>
                <p class="text-[10px] mb-4" style="color:var(--text-muted);">Select two. <span style="color:var(--accent-gold);font-weight:600;">1st choice</span> carries more weight than your <span style="color:#60a5fa;font-weight:600;">2nd</span>. Tap again to deselect.</p>
                <div class="space-y-2.5" id="opts">
                    ${options.map((opt, i) => `<button class="option-btn fade-up stagger-${i+1}" data-idx="${i}"><span class="option-badge"></span>${opt.text}</button>`).join('')}
                </div>
                ${info ? `<div class="info-panel p-3 mt-3"><p class="text-xs leading-relaxed" style="color:var(--text-secondary);">${info}</p></div>` : ''}
                <div class="nav-bar" id="navBar">
                    <button class="nav-btn secondary" id="backBtn" ${currentQuestionIndex === 0 ? 'disabled' : ''}>Back</button>
                    <button class="nav-btn primary" id="nextBtn" disabled>Next</button>
                </div>
            </div>
        </div>`;

    let pick1 = null, pick2 = null;

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

    document.getElementById('backBtn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            // Remove last pick and go back
            if (userData.picks && userData.picks.length > 0) userData.picks.pop();
            currentQuestionIndex--;
            const prevStages = FOLD_STAGE_MAP[currentQuestionIndex];
            currentFoldStage = prevStages ? prevStages[0] : 0;
            save();
            transition(() => renderQuestion());
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (pick1 === null || pick2 === null) return;
        haptic(40);

        if (!userData.picks) userData.picks = [];
        // Store or update pick at current index
        userData.picks[currentQuestionIndex] = { pick1, pick2 };
        save();

        const primaryOpt = options[pick1];

        // Animate stamp before advancing
        animateStampPress(primaryOpt, currentFoldStage, () => {
            currentQuestionIndex++;
            if (currentQuestionIndex >= QUESTION_SEQUENCE.length) {
                finishProfiling();
            } else {
                transition(() => renderFoldStep());
            }
        });
    });
}

async function finishProfiling() {
    const { archetype, scores } = computeArchetype(userData.picks);
    userData.archetype = archetype;
    userData.scores = scores;
    save();

    const db = getDb();
    try {
        await setDoc(doc(db, 'profiles', uid()), {
            archetype,
            picks: userData.picks,
            timestamp: serverTimestamp(),
        });

        const archetypeData = ARCHETYPES[archetype];
        await setDoc(doc(db, 'sailBoats', uid()), {
            archetype,
            archetypeColor: archetypeData.color,
            picks: userData.picks,
            hull: BOAT_DEFAULTS.hull,
            sail: BOAT_DEFAULTS.sail,
            flag: BOAT_DEFAULTS.flag,
            timestamp: serverTimestamp(),
        });
    } catch (e) {
        console.error('Profile write error:', e);
    }

    stopAmbient();
    transition(() => renderGrandReveal());
}

// ═══════════════════════════════════════════════════════════════
// GRAND REVEAL (from sailor.js renderProcessing)
// ═══════════════════════════════════════════════════════════════
function renderGrandReveal() {
    const archetype = userData.archetype;
    const data = ARCHETYPES[archetype];
    const ac = data.color || '#D4A843';
    const c = { ...BOAT_DEFAULTS, sailGradient: [ac, '#f5f0e8'] };

    const nameChars = archetype.split('').map((ch, i) => {
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
        <h1 class="archetype-name-staged text-3xl font-black">${nameChars}</h1>
        <p class="archetype-quote-staged font-serif italic text-sm mt-6 max-w-xs text-center px-6" style="color:var(--text-secondary);" id="revealQuote">"${data.quote}"</p>
        <button id="revealContinue" class="btn-start mt-10" style="opacity:0; transition: opacity 0.5s;">Continue to Presentation</button>
    </div>`;

    // ACT 1: Wake particles
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

    // ACT 2: Reveal sound, shake, particles, wave surge
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

    // ACT 3: Quote + button
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
        startPhase2();
    });
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: Presenter-synced interactions
// ═══════════════════════════════════════════════════════════════

function startPhase2() {
    const db = getDb();
    onSnapshot(doc(db, 'session', 'state'), (snap) => {
        if (snap.exists()) {
            renderPresenterView(snap.data());
        } else {
            renderWaiting(`Welcome, <strong style="color:${ARCHETYPES[userData.archetype]?.color || COLORS.yellow}">${userData.archetype}</strong>!<br><br>Waiting for the presentation to begin...`);
        }
    });
}

function renderPresenterView(state) {
    if (!state || !state.currentView) {
        renderWaiting('Waiting for the presentation...');
        return;
    }

    switch (state.currentView) {
        case 'poll':
            if (userData.polls && userData.polls[state.pollData.id] !== undefined) {
                const saved = userData.polls[state.pollData.id];
                renderWaiting(`Vote Recorded!<br><br>${saved.insight || 'Watch the main screen.'}`);
            } else {
                renderPoll(state.pollData);
            }
            break;
        case 'globe': case 'industry_map':
            if (userData[state.nexusData.type]) {
                renderWaiting('Your choice is on the map!<br>Watch the big screen.');
            } else {
                renderNexus(state.nexusData);
            }
            break;
        case 'finale':
            renderAspirationInput();
            break;
        case 'memento': case 'end':
            userData.phase = 'done';
            save();
            renderCompassCard();
            break;
        case 'chart':
            renderWaiting(`Your archetype: <strong style="color:${ARCHETYPES[userData.archetype]?.color}">${userData.archetype}</strong><br><br>Watch the live chart on screen!`);
            break;
        case 'video':
            renderWaiting('Video playing — look at the main screen.');
            break;
        case 'slide':
            renderWaiting('Presentation in progress — look up!');
            break;
        case 'static':
            renderWaiting('Reflect on the values shown on screen.');
            break;
        case 'reset':
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
            break;
        default:
            renderWaiting('Watch the main screen.');
    }
}

// ── POLL ──
function renderPoll(pollData) {
    $app.innerHTML = `
        <div class="w-full max-w-md text-center page-enter" data-poll-json='${JSON.stringify(pollData).replace(/'/g, "&apos;")}'>
            <p class="text-sm font-bold mb-2 uppercase tracking-widest" style="color:var(--accent-gold)">Live Poll</p>
            <h2 class="text-xl font-bold mb-6 leading-snug">${pollData.question}</h2>
            <div class="space-y-3">
                ${pollData.options.map((opt, i) => `
                    <button data-poll-id="${pollData.id}" data-option-index="${i}" class="action-option w-full text-left p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-base font-semibold">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>`;
}

async function handlePollAnswer(pollId, optionIndex, pollData) {
    if (!userData.polls) userData.polls = {};
    const idx = parseInt(optionIndex);
    const isCorrect = idx === pollData.correctAnswer;
    let insight = pollData.insight || 'Thanks for voting!';
    if (!isCorrect && pollData.correctAnswer !== null && pollData.correctAnswer !== undefined) {
        insight = `Good guess!<br><br>${pollData.insight}`;
    }
    userData.polls[pollId] = { choice: idx, choiceText: pollData.options[idx], isCorrect, insight };
    save();

    const db = getDb();
    await setDoc(doc(db, 'polls', `${pollId}_${uid()}`), {
        pollId, vote: idx, timestamp: serverTimestamp(),
    });
    renderWaiting(`Vote Recorded!<br><br>${insight}`);
}

// ── NEXUS ──
function renderNexus(nexusData) {
    $app.innerHTML = `
        <div class="w-full max-w-md text-center page-enter">
            <h2 class="text-xl font-bold mb-2">Chart Your Course</h2>
            <p class="mb-5 text-sm" style="color:var(--text-secondary)">As a <strong style="color:${ARCHETYPES[userData.archetype]?.color}">${userData.archetype}</strong>, which excites you?</p>
            <div class="space-y-3">
                ${nexusData.options.map(opt => `
                    <button data-nexus-id="${opt.id}" data-nexus-type="${nexusData.type}" data-nexus-text="${opt.text}" class="action-option w-full text-left p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl font-semibold">
                        ${opt.text}
                    </button>
                `).join('')}
            </div>
        </div>`;
}

async function handleNexusChoice(nexusId, nexusType, nexusText) {
    userData[nexusType] = { id: nexusId, text: nexusText };
    save();
    const db = getDb();
    await setDoc(doc(db, 'nexusVotes', uid()), {
        nexusId, timestamp: serverTimestamp(),
    });
    renderWaiting('Your choice is on the map!<br>Look at the main screen.');
}

// ── ASPIRATION ──
function renderAspirationInput() {
    if (userData.aspiration) {
        renderWaiting('Your aspiration is part of the crest!');
        return;
    }
    $app.innerHTML = `
        <div class="w-full max-w-md text-center page-enter">
            <h2 class="text-2xl font-bold mb-3" style="color:var(--accent-gold)">One Word.</h2>
            <p class="mb-6" style="color:var(--text-secondary)">What is your future aspiration?<br>(e.g. Doctor, Innovator)</p>
            <input type="text" id="aspirationInput" maxlength="15" class="w-full p-4 bg-gray-800 text-white border-2 border-blue-500 focus:border-yellow-400 rounded-xl mb-5 text-center text-xl font-bold outline-none" placeholder="Type here...">
            <button id="submitAspiration" class="btn-start w-full">Add to Crest</button>
        </div>`;
}

async function handleAspirationSubmit() {
    const input = document.getElementById('aspirationInput');
    const word = input?.value.trim();
    if (!word) return;
    input.disabled = true;
    const btn = document.getElementById('submitAspiration');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    userData.aspiration = word;
    save();
    const db = getDb();
    await setDoc(doc(db, 'aspirations', uid()), {
        word, timestamp: serverTimestamp(),
    });
    renderWaiting('Thank you!<br>Your aspiration is now part of our crest.');
}

// ── COMPASS CARD ──
function renderCompassCard() {
    const archetype = userData.archetype;
    const data = ARCHETYPES[archetype];
    if (!data) { renderError('Error', 'Could not load your profile.'); return; }

    let insightsHTML = '';
    const pollKeys = Object.keys(userData.polls || {});
    if (pollKeys.length > 0) {
        const rawInsights = pollKeys.map(k => (userData.polls[k].insight || '').replace('Good guess!<br><br>', ''));
        const unique = [...new Set(rawInsights)].slice(0, 3);
        insightsHTML = `
        <div class="bg-slate-800 border-l-4 border-yellow-400 rounded-r-lg p-4 mb-4 shadow-lg">
            <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">Your Insights</h4>
            <ul class="space-y-2 text-xs text-gray-200 leading-relaxed">
                ${unique.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>`;
    }

    const globalChoice = userData.global?.text || 'a future global exchange';
    const localChoice = userData.local?.text || 'a future industry attachment';
    const pathwayText = `You've set your sights on <strong>${globalChoice}</strong> and <strong>${localChoice}</strong>. With ${SCHOOL.exchangeCount} international exchanges and ${SCHOOL.industryCount} industry attachments, we can't wait for you to pursue these opportunities.`;
    const recsText = `Keep in mind: ${data.recommendations.join(' \u2022 ')}. Get ready for your aspirations to take flight.`;

    const boatSVG = buildOrigamiSVG(
        { ...BOAT_DEFAULTS, sailGradient: [data.color, '#f5f0e8'] },
        9, 120, { aspiration: userData.aspiration || '' }
    );

    $app.innerHTML = `
        <div class="w-full max-w-md text-center page-enter pb-8">
            <div id="memento-card" class="relative overflow-hidden rounded-3xl border-4 shadow-2xl text-left" style="border-color:${data.color}; background-color: #0f172a;">
                <div class="p-5 pb-3 relative z-10">
                    <div class="flex items-center gap-3 mb-1">
                        <img src="${LOGO_URL}" alt="Beatty Crest" class="h-10 w-10 drop-shadow-md">
                        <div>
                            <h1 class="text-xl font-black leading-none tracking-tight" style="color:${data.color};">${archetype}</h1>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Your Beatty Compass Card</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3 mx-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div class="shrink-0">${boatSVG}</div>
                    <p class="text-sm italic text-gray-100 font-serif">"${data.quote}"</p>
                </div>
                <div class="p-5 pt-3 relative z-10">
                    <p class="text-xs text-gray-300 mb-4 font-medium">${data.description}</p>
                    ${insightsHTML}
                    <div class="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-4 shadow-lg">
                        <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">Your Chosen Pathways</h4>
                        <p class="text-xs text-gray-200 leading-relaxed">${pathwayText}</p>
                    </div>
                    <div class="bg-slate-800/50 border-l-4 border-gray-500 rounded-r-lg p-4 shadow-lg">
                        <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">Recommended Pathways</h4>
                        <p class="text-xs text-gray-400 leading-relaxed">${recsText}</p>
                    </div>
                </div>
                <div class="bg-black/40 p-5 text-center relative z-10 border-t border-white/10">
                    <p class="text-xs text-gray-400 mb-1">Join us and have your aspiration to become</p>
                    <p class="text-2xl font-black uppercase tracking-wide" style="color:${data.color}; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${userData.aspiration || 'FUTURE LEADER'}</p>
                    <p class="text-xs text-gray-400 mt-1">take flight!</p>
                </div>
            </div>
            <button id="downloadCardBtn" class="btn-start w-full mt-6 text-base">Download Card</button>
            <p class="text-xs mt-2" style="color:var(--text-muted)">Show this card at our booth for a gift!</p>
            <button id="retakeBtn" class="mt-4 text-sm underline hover:text-white" style="color:var(--text-muted)">Retake Quiz</button>
        </div>`;
}

function downloadCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('downloadCardBtn');
    if (!card || !btn) return;
    btn.textContent = 'Generating...';
    btn.disabled = true;

    if (typeof html2canvas === 'undefined') {
        btn.textContent = 'Download unavailable';
        return;
    }

    html2canvas(card, { backgroundColor: '#0f172a', scale: 3, useCORS: true }).then(canvas => {
        canvas.toBlob(blob => {
            if (navigator.share && blob) {
                const file = new File([blob], 'Beatty-Compass-Card.png', { type: 'image/png' });
                navigator.share({ files: [file], title: 'My Beatty Compass Card' }).catch(() => downloadBlob(blob));
            } else {
                downloadBlob(blob);
            }
            btn.textContent = 'Download Card';
            btn.disabled = false;
        }, 'image/png');
    }).catch(() => {
        btn.textContent = 'Download Failed';
        btn.disabled = false;
    });
}

function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'Beatty-Compass-Card.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// ── UTILITY RENDERS ──
function renderWaiting(message) {
    $app.innerHTML = `
        <div class="w-full max-w-md text-center page-enter">
            <div class="animate-pulse mb-4">
                <svg class="mx-auto h-12 w-12 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p class="text-lg font-semibold leading-relaxed">${message}</p>
        </div>`;
}

function renderError(title, message) {
    $app.innerHTML = `
        <div class="text-center p-6 bg-red-900/80 rounded-xl border border-red-500 m-4">
            <h2 class="text-xl font-bold mb-2">${title}</h2>
            <p>${message}</p>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════
// EVENT DELEGATION
// ═══════════════════════════════════════════════════════════════
$app.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    if (target.id === 'startBtn') {
        startAmbient();
        transition(() => renderFoldStep());
        return;
    }
    if (target.id === 'retakeBtn') {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
        return;
    }
    if (target.id === 'downloadCardBtn') { downloadCard(); return; }
    if (target.id === 'submitAspiration') { handleAspirationSubmit(); return; }

    // Poll answer (Phase 2)
    if (target.dataset.pollId) {
        const pollContainer = target.closest('[data-poll-json]');
        if (!pollContainer) return;
        const pollData = JSON.parse(pollContainer.dataset.pollJson);
        const allBtns = pollContainer.querySelectorAll('button');
        allBtns.forEach(b => { b.disabled = true; b.classList.add('opacity-50'); });
        target.classList.remove('opacity-50');
        target.classList.add('selected');
        haptic(30);
        handlePollAnswer(target.dataset.pollId, target.dataset.optionIndex, pollData);
        return;
    }

    // Nexus answer (Phase 2)
    if (target.dataset.nexusId) {
        target.disabled = true;
        target.classList.add('selected');
        haptic(30);
        handleNexusChoice(target.dataset.nexusId, target.dataset.nexusType, target.dataset.nexusText);
    }
});

// ── GO ──
init();
