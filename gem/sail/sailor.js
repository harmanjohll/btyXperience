/* === Beatty SAIL — Sailor (Participant) v7 ===
   Washi craft origami · 8 folds · hanko stamps · ink trail.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    buildOrigamiSVG, haptic, hapticPattern,
    SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FOLD_GUIDES, FOLD_FLAPS, FOLD_LABELS, CREASE_LINES, LABELS,
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

// === FIREBASE ===
let db, auth;
try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    await signInAnonymously(auth);
} catch (e) { console.error("Firebase:", e); }

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
    try { await setDoc(doc(db, "sailBoats", auth.currentUser.uid), { ...D, timestamp: serverTimestamp() }); }
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
            <img src="${LOGO_URL}" alt="Beatty" class="h-16 w-16 mb-5 drop-shadow-lg">
            <h1 class="font-serif text-3xl tracking-tight mb-2" style="color:var(--accent-gold);">Set Sail</h1>
            <p class="text-sm mb-6 text-center max-w-xs" style="color:var(--text-secondary);">A single sheet holds a thousand shapes.<br>Fold yours — and discover which one is you.</p>
            <div class="origami-stage mb-4">
                ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 280)}
            </div>
            <p class="text-xs mb-6 text-center font-serif italic" style="color:var(--text-muted);">"Between your hands and a sheet of paper, every path is possible."</p>
            <button id="startBtn" class="btn-start">Begin Folding</button>
            <p class="text-[10px] mt-6 tracking-widest uppercase" style="color:var(--text-muted);">Beatty Secondary School &middot; Open House 2026</p>
        </div>
    </div>`;
}

/* ============================================================
   RENDER: FOLD STEP (8 folds)
   ============================================================ */

// Which paper stage to show BEFORE each fold
const STAGE_FOR_FOLD = [0, 1, 2, 3, 4, 5, 6, 7];
// Which step to go to AFTER each fold completes
const NEXT_STEP_AFTER_FOLD = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 9, 5: 10, 6: 13, 7: 14 };

function renderFoldStep(foldIndex) {
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
            ${progressBarHTML(questionsDone())}
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
            <p class="text-[10px]" style="color:var(--text-muted);">Drag from the <span style="color:var(--accent-gold);font-weight:700;">glowing dot</span> toward the target · then <span style="color:var(--accent-gold);font-weight:700;">press to crease</span></p>
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

        // === GUIDED PRESS-TO-CREASE step ===
        const creaseLine = CREASE_LINES[foldIndex];
        const stageRect2 = stageEl.getBoundingClientRect();
        const s2 = stageRect2.width / 280;
        const cx1 = creaseLine.x1 * s2, cy1 = creaseLine.y1 * s2;
        const cx2 = creaseLine.x2 * s2, cy2 = creaseLine.y2 * s2;
        const cmx = (cx1 + cx2) / 2, cmy = (cy1 + cy2) / 2;

        const creaseOverlay = document.createElement('div');
        creaseOverlay.className = 'crease-overlay';
        creaseOverlay.innerHTML = `
            <svg class="crease-guide-svg" viewBox="0 0 ${stageRect2.width} ${stageRect2.height}" width="${stageRect2.width}" height="${stageRect2.height}">
                <line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}"
                    class="crease-guide-line"/>
                <line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}"
                    class="crease-guide-line-glow"/>
            </svg>
            <div class="crease-prompt" style="left:${cmx}px;top:${cmy}px;">
                <div class="crease-icon">✋</div>
                <span class="crease-text">Press along crease</span>
            </div>`;
        stageEl.appendChild(creaseOverlay);

        function handleCrease(ev) {
            ev.preventDefault();
            creaseOverlay.removeEventListener('click', handleCrease);
            creaseOverlay.removeEventListener('touchstart', handleCrease);

            // Solidify the crease line + visual feedback
            const guideLine = creaseOverlay.querySelector('.crease-guide-line');
            if (guideLine) guideLine.classList.add('crease-sealed');
            creaseOverlay.querySelector('.crease-prompt').classList.add('crease-pressing');
            haptic(60);
            playFoldSound();

            setTimeout(() => {
                creaseOverlay.remove();
                finishFold();
            }, 450);
        }
        creaseOverlay.addEventListener('click', handleCrease);
        creaseOverlay.addEventListener('touchstart', handleCrease, { passive: false });

        function finishFold() {
            const isHatToDiamond = foldIndex === 5;

            if (isBoatReveal) {
                stageEl.classList.add('boat-reveal');
                hapticPattern([50, 30, 100]);
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
                svgInner.style.transition = 'transform 0.7s cubic-bezier(0.22,1,0.36,1)';
                svgInner.style.transform = 'scaleX(1.5) scaleY(0.45)';
                setTimeout(() => {
                    svgInner.outerHTML = buildOrigamiSVG(c, 8, 280, extras());
                    stageEl.classList.remove('boat-reveal');
                    stageEl.classList.add('boat-reveal');
                    spawnParticles(stageEl, 20);
                    spawnRipples(stageEl);
                }, 750);
            } else if (isHatToDiamond) {
                svgInner.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                svgInner.style.transform = 'scaleX(0.35) scaleY(1.3)';
                haptic(40);
                setTimeout(() => {
                    svgInner.outerHTML = buildOrigamiSVG(c, 6, 280, extras());
                    spawnParticles(stageEl, 10);
                }, 650);
            } else {
                setTimeout(() => {
                    svgInner.outerHTML = buildOrigamiSVG(c, paperStage + 1, 280, extras());
                    spawnParticles(stageEl, 8);
                }, 450);
            }

            const advanceDelay = isBoatReveal ? 2500 : isHatToDiamond ? 1400 : 1000;
            const nextStep = NEXT_STEP_AFTER_FOLD[foldIndex];
            setTimeout(() => { step = nextStep; route(); }, advanceDelay);
        }
    });
}

/* ============================================================
   RENDER: TWO-PICK QUESTION
   ============================================================ */
function renderQuestion(config) {
    const { scenario, question, options, dataKey, backStep, qNum, paperStage, info, sailLetter, sailTitle } = config;
    const c = colors();

    $app.innerHTML = `
    <div class="sail-screen">
        <div class="paper-zone">
            ${progressBarHTML(qNum - 1)}
            <div class="origami-stage medium">
                ${buildOrigamiSVG(c, paperStage, 280, extras())}
            </div>
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
                <button class="nav-btn secondary" id="backBtn" ${backStep === null ? 'disabled' : ''}>Back</button>
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

    document.getElementById('backBtn').addEventListener('click', () => {
        if (backStep !== null) { step = backStep; route(); }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (pick1 === null || pick2 === null) return;
        haptic(40);
        D[prevPick1Key] = pick1;
        D[prevPick2Key] = pick2;
        const primaryOpt = options[pick1];
        applyPrimaryChoice(dataKey, primaryOpt);
        // Add stamp mark
        addMark(dataKey, primaryOpt.id);
        save();
        advanceFromQuestion(dataKey);
    });
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
            <div class="origami-stage medium">
                ${buildOrigamiSVG(c, 9, 280, extras())}
            </div>
        </div>
        <div class="content-zone text-center">
            <h2 class="font-serif text-xl mb-2" style="color:var(--accent-gold);">Name Your Vessel</h2>
            <p class="text-sm mb-4" style="color:var(--text-secondary);">One word — your aspiration, inscribed on the hull forever.</p>
            <input type="text" id="aspirationInput" maxlength="15"
                class="w-full p-3 text-center text-xl font-black outline-none rounded-xl mb-4"
                style="background:var(--bg-card);color:var(--text-primary);border:2px solid var(--accent-gold);caret-color:var(--accent-gold);"
                placeholder="e.g. COURAGE">
            <div class="nav-bar">
                <button class="nav-btn secondary" id="backBtn">Back</button>
                <button class="nav-btn primary" id="launchBtn">Launch</button>
            </div>
        </div>
    </div>`;
    document.getElementById('backBtn').addEventListener('click', () => { step = 14; route(); });
}

/* ============================================================
   RENDER: PROCESSING — "Charting your course..."
   ============================================================ */
function renderProcessing() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
            <div class="origami-stage medium mb-6" id="processingBoat">
                ${buildOrigamiSVG(c, 9, 280, extras())}
            </div>
            <h2 class="font-serif text-xl mb-4" style="color:var(--accent-gold);">Charting your course</h2>
            <div class="processing-dots">
                <span></span><span></span><span></span>
            </div>
            <p class="text-xs mt-4 font-serif italic" style="color:var(--text-muted);">Reading the stars you chose...</p>
        </div>
    </div>`;
    setTimeout(() => {
        const boat = document.getElementById('processingBoat');
        if (boat) spawnRipples(boat);
    }, 800);
    setTimeout(() => { step = 17; route(); }, 3000);
}

/* ============================================================
   RENDER: ARCHETYPE REVEAL
   ============================================================ */
function renderArchetypeReveal() {
    const archetype = ARCHETYPES[D.internationalPick1] || ARCHETYPES.korea;
    const sailOpt = SAIL_DATA.I.options.find(o => o.id === D.internationalPick1) || SAIL_DATA.I.options[0];

    $app.innerHTML = `
    <div class="archetype-reveal">
        <p class="text-xs uppercase tracking-[0.3em] mb-6 fade-in" style="color:var(--text-muted);">You are</p>
        <h1 class="archetype-name" style="color:${sailOpt.color};">${archetype.name}</h1>
        <p class="archetype-quote-reveal font-serif italic text-sm mt-6 max-w-xs text-center px-6" style="color:var(--text-secondary);">${archetype.quote}</p>
        <button id="revealContinue" class="archetype-continue btn-start mt-10">See Your Card</button>
    </div>`;

    document.getElementById('revealContinue').addEventListener('click', () => {
        haptic(40);
        step = 18;
        route();
    });
}

/* ============================================================
   RENDER: MEMENTO CARD
   ============================================================ */
function renderMemento() {
    const c = colors();
    const sailOpt  = SAIL_DATA.I.options.find(o => o.id === D.internationalPick1) || SAIL_DATA.I.options[0];
    const leadOpt  = SAIL_DATA.S.options.find(o => o.id === D.stewardshipPick1) || SAIL_DATA.S.options[0];
    const chalOpt  = SAIL_DATA.A.options.find(o => o.id === D.appliedPick1) || SAIL_DATA.A.options[0];
    const valOpt   = SAIL_DATA.L.options.find(o => o.id === D.learningPick1) || SAIL_DATA.L.options[0];
    const archetype = ARCHETYPES[D.internationalPick1] || ARCHETYPES.korea;
    const subjectLabel = LABELS.subject[D.subjectPick1] || '';
    const industryLabel = LABELS.industry[D.industryPick1] || '';

    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="content-zone pt-4">
            <div class="memento-card" id="memento-card" style="border-color:${sailOpt.color};">
                <div class="memento-header">
                    <div class="memento-boat">${buildOrigamiSVG(c, 9, 88, extras())}</div>
                    <div style="flex:1;min-width:0;">
                        <h1 class="text-lg font-black leading-tight" style="color:${sailOpt.color};">${archetype.name}</h1>
                        <p class="text-[10px] font-bold uppercase tracking-widest mt-0.5" style="color:var(--text-muted);">Your Beatty Compass Card</p>
                    </div>
                </div>
                <div class="memento-quote">
                    <p class="text-sm font-serif italic leading-relaxed" style="color:var(--text-primary);">${archetype.quote}</p>
                </div>
                <div style="padding:0 20px 8px;">
                    <p class="text-xs leading-relaxed" style="color:var(--text-secondary);">${archetype.persona}</p>
                </div>
                <div class="memento-divider"></div>
                <div style="padding:12px 20px;" class="space-y-1.5">
                    <div class="flex items-start gap-2 rounded-lg p-2" style="background:rgba(255,255,255,0.02);border-left:3px solid ${leadOpt.color};">
                        <span class="font-black text-[10px] mt-0.5" style="color:var(--accent-gold);">S</span>
                        <div><p class="text-[10px] font-bold uppercase" style="color:var(--text-muted);">Stewardship</p><p class="text-xs" style="color:var(--text-primary);">${leadOpt.text.split('—')[0].trim()}</p></div>
                    </div>
                    <div class="flex items-start gap-2 rounded-lg p-2" style="background:rgba(255,255,255,0.02);border-left:3px solid ${chalOpt.color};">
                        <span class="font-black text-[10px] mt-0.5" style="color:var(--accent-gold);">A</span>
                        <div><p class="text-[10px] font-bold uppercase" style="color:var(--text-muted);">Applied Learning</p><p class="text-xs" style="color:var(--text-primary);">${chalOpt.text.split('—')[0].trim()}${subjectLabel ? ' · '+subjectLabel : ''}</p></div>
                    </div>
                    <div class="flex items-start gap-2 rounded-lg p-2" style="background:rgba(255,255,255,0.02);border-left:3px solid ${sailOpt.color};">
                        <span class="font-black text-[10px] mt-0.5" style="color:var(--accent-gold);">I</span>
                        <div><p class="text-[10px] font-bold uppercase" style="color:var(--text-muted);">International & Industry</p><p class="text-xs" style="color:var(--text-primary);">${sailOpt.text.split('—')[0].trim()}${industryLabel ? ' · '+industryLabel : ''}</p></div>
                    </div>
                    <div class="flex items-start gap-2 rounded-lg p-2" style="background:rgba(255,255,255,0.02);border-left:3px solid ${valOpt.color};">
                        <span class="font-black text-[10px] mt-0.5" style="color:var(--accent-gold);">L</span>
                        <div><p class="text-[10px] font-bold uppercase" style="color:var(--text-muted);">Learning to Live, Learn & Love</p><p class="text-xs" style="color:var(--text-primary);">${valOpt.icon||''} ${valOpt.text.split('—')[0].trim()}</p></div>
                    </div>
                </div>
                <div class="memento-section" style="border-color:#10b981;">
                    <h4 class="font-bold uppercase tracking-wide text-[10px] mb-1" style="color:#10b981;">Recommended Pathways</h4>
                    <p class="text-xs leading-relaxed" style="color:var(--text-secondary);">${archetype.recommended.map(r => `<span style="color:#6ee7b7;">${r}</span>`).join(' · ')}</p>
                </div>
                <div class="memento-footer">
                    <p class="text-[10px] mb-1 uppercase tracking-widest" style="color:var(--text-muted);">My aspiration</p>
                    <p class="text-3xl font-black uppercase tracking-wide" style="color:${sailOpt.color};text-shadow:0 2px 12px rgba(0,0,0,0.5);">${(D.aspiration||'FUTURE LEADER').toUpperCase()}</p>
                    <div class="flex items-center justify-center gap-2 mt-3">
                        <img src="${LOGO_URL}" alt="Beatty" class="h-4 w-4 opacity-60">
                        <p class="text-[10px]" style="color:var(--text-muted);">Beatty Secondary School · Open House 2026</p>
                    </div>
                </div>
            </div>
            <button id="downloadCardBtn" class="nav-btn primary w-full mt-4 text-lg uppercase tracking-wide">Download Card</button>
            <button id="resetBtn" class="mt-3 w-full text-sm underline pb-4" style="color:var(--text-muted);">Start Over</button>
        </div>
    </div>`;
}

/* ============================================================
   LAUNCH HANDLER
   ============================================================ */
async function handleLaunch() {
    const input = document.getElementById('aspirationInput');
    const word = input.value.trim();
    if (!word) { input.style.borderColor = '#ef4444'; return; }
    D.aspiration = word;
    save();
    await saveToFirebase();
    hapticPattern([50, 30, 100]);
    step = 16;
    route();
}

function downloadCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('downloadCardBtn');
    btn.textContent = 'Generating...'; btn.disabled = true;
    haptic(40);
    html2canvas(card, { backgroundColor: '#1a1714', scale: 3, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Beatty-SAIL-Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = 'Download Card'; btn.disabled = false;
    }).catch(() => { btn.textContent = 'Download Failed'; btn.disabled = false; });
}

/* ============================================================
   ROUTER
   ============================================================ */
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
        }
    };
    transition(render);
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
$app.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'startBtn')        { haptic(15); step = 1; route(); }
    if (t.id === 'launchBtn')       { handleLaunch(); }
    if (t.id === 'downloadCardBtn') { downloadCard(); }
    if (t.id === 'resetBtn') {
        localStorage.removeItem(SK);
        D = { marks: [] }; step = 0; route();
    }
});

/* ============================================================
   RESUME STATE
   ============================================================ */
if (D.aspiration)                            step = 18;
else if (D.learningPick1 !== undefined)      step = 15;
else if (D.industryPick1 !== undefined)      step = 12;
else if (D.internationalPick1 !== undefined) step = 11;
else if (D.subjectPick1 !== undefined)       step = 8;
else if (D.appliedPick1 !== undefined)       step = 7;
else if (D.stewardshipPick1 !== undefined)   step = 4;

route();
