/* === Beatty SAIL — Sailor (Participant) v6 ===
   Dark-theme origami + actionarcnlc two-pick questions + fold-on-paper.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    buildOrigamiSVG, haptic,
    SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FOLD_GUIDES, FOLD_FLAPS, LABELS,
    FIREBASE_CONFIG, LOGO_URL,
} from './boat.js';

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
const SK = 'btySail_v6';
let D = JSON.parse(localStorage.getItem(SK)) || {};
let step = 0;

/*  Step map:
    0  = welcome
    1  = fold 0 (S)          → paper stage 0→1
    2  = choose S (two-pick)
    3  = fold 1 (A)          → paper stage 1→2
    4  = choose A (two-pick)
    5  = choose A sub (two-pick)
    6  = fold 2 (I)          → paper stage 2→3
    7  = choose I (two-pick)
    8  = choose I sub (two-pick)
    9  = fold 3 (L)          → paper stage 3→4 (BOAT REVEAL!)
    10 = choose L (two-pick)
    11 = aspiration
    12 = launch
    13 = memento
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
function extras() { return { aspiration: D.aspiration, flagIcon: D.flagIcon }; }

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
    const cols = ['#FFE200','#D4A843','#F0D68A','#3b82f6','#10b981','#ec4899'];
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

/* ============================================================
   FOLD-ON-PAPER INTERACTION
   Real-time fold flap visualization + paper tilt + crease mark.
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

    let isDown = false, completed = false;

    function getPos(e) {
        const rect = overlay.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
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
    }

    function move(e) {
        if (!isDown || completed) return;
        e.preventDefault();
        const pos = getPos(e);

        // Draw drag line
        dragSvg.innerHTML = `<svg viewBox="0 0 ${stageSize} ${stageSize}" width="${stageSize}" height="${stageSize}">
            <line x1="${sc.from.x}" y1="${sc.from.y}" x2="${pos.x}" y2="${pos.y}"/>
        </svg>`;

        // Paper tilt effect
        const progressX = (pos.x - sc.from.x) / stageSize;
        const progressY = (pos.y - sc.from.y) / stageSize;
        const tiltX = -progressY * 12;
        const tiltY = progressX * 8;
        svgEl.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        // Progress
        const distToTarget = Math.sqrt((pos.x-sc.to.x)**2 + (pos.y-sc.to.y)**2);
        const progress = Math.max(0, Math.min(1, 1 - distToTarget / totalDist));
        ringCircle.style.strokeDashoffset = circ * (1 - progress);

        // Real-time fold flap visualization
        if (flap.clipFrom && flapEl) {
            flapEl.style.opacity = '1';
            // Interpolate clip-path from source to destination
            const interp = `polygon(${interpolatePolygon(flap.clipFrom, flap.clipTo, progress)})`;
            flapEl.style.clipPath = interp;
            flapEl.style.webkitClipPath = interp;
            // Rotate the flap SVG
            const deg = progress * flap.maxDeg;
            const flapSvg = flapEl.querySelector('.origami-svg');
            if (flapSvg) {
                flapSvg.style.transformOrigin = flap.axis;
                flapSvg.style.transform = `${flap.rotate}(${deg}deg)`;
            }
        }

        // Move progress ring with finger
        ring.style.left = pos.x + 'px';
        ring.style.top = pos.y + 'px';

        // Haptic milestones
        if (progress > 0.3 && progress < 0.33) haptic(15);
        if (progress > 0.6 && progress < 0.63) haptic(20);
        if (progress > 0.85 && progress < 0.88) haptic(30);

        if (distToTarget < 30) {
            completed = true; isDown = false;
            svgEl.style.transform = '';
            stageEl.classList.remove('tilting');
            if (flapEl) flapEl.style.opacity = '0';
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
        // Reset flap
        if (flapEl) {
            flapEl.style.opacity = '0';
            const flapSvg = flapEl.querySelector('.origami-svg');
            if (flapSvg) flapSvg.style.transform = '';
        }
        // Reset ring position
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

/* Interpolate between two CSS polygon strings */
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
            <p class="text-sm mb-6 text-center max-w-xs" style="color:var(--text-secondary);">Every Beattyian sets sail on a unique voyage.<br>Build yours — fold by fold.</p>
            <div class="origami-stage mb-4">
                ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 280)}
            </div>
            <p class="text-xs mb-6 text-center font-serif italic" style="color:var(--text-muted);">You have a piece of paper.<br>What will it become?</p>
            <button id="startBtn" class="btn-start">Begin Folding</button>
            <p class="text-[10px] mt-6 tracking-widest uppercase" style="color:var(--text-muted);">Beatty Secondary School &middot; Open House 2026</p>
        </div>
    </div>`;
}

/* ============================================================
   RENDER: FOLD STEP
   ============================================================ */
function renderFoldStep(foldIndex) {
    const keys = ['S','A','I','L'];
    const data = SAIL_DATA[keys[foldIndex]];
    const guide = FOLD_GUIDES[foldIndex];
    const c = colors();
    const stage = foldIndex;
    const isBoatReveal = foldIndex === 3;

    // Arrow SVG in 280 viewBox
    const fx = guide.from.x, fy = guide.from.y;
    const tx = guide.to.x, ty = guide.to.y;
    const adx = tx-fx, ady = ty-fy;
    const aLen = Math.sqrt(adx*adx+ady*ady);
    const ux = adx/aLen, uy = ady/aLen;
    const ahX = fx+adx*0.75, ahY = fy+ady*0.75;
    const sz = 7;

    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="paper-zone">
            ${progressBarHTML(questionsDone())}
            <div class="origami-stage" id="origamiStage">
                ${buildOrigamiSVG(c, stage, 280)}
                <!-- Fold flap overlay (real-time fold visualization) -->
                <div class="fold-flap" style="opacity:0;">
                    ${buildOrigamiSVG(c, stage, 280)}
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
                <span class="font-bold text-sm" style="color:var(--accent-gold-light);">Fold ${foldIndex+1} of 4</span>
            </div>
            <p class="text-xs mb-1" style="color:var(--text-secondary);">${data.foldInstruction}</p>
            <p class="text-[10px]" style="color:var(--text-muted);">Drag from the <span style="color:var(--bty-yellow);font-weight:700;">glowing dot</span> toward the target</p>
        </div>
    </div>`;

    const stageEl = document.getElementById('origamiStage');
    setupFoldInteraction(stageEl, foldIndex, () => {
        // Hide guides
        stageEl.querySelector('.fold-dot').style.opacity = '0';
        stageEl.querySelector('.fold-target').style.opacity = '0';
        stageEl.querySelector('.fold-arrow').style.opacity = '0';
        stageEl.querySelector('.fold-progress-ring').style.opacity = '0';
        stageEl.querySelector('.fold-drag-line').innerHTML = '';

        stageEl.classList.add(isBoatReveal ? 'boat-reveal' : 'fold-animating');

        // Flash
        const flash = document.createElement('div');
        flash.className = 'fold-flash';
        stageEl.appendChild(flash);
        setTimeout(() => flash.remove(), 700);

        // Update SVG to next stage
        setTimeout(() => {
            stageEl.querySelector('.origami-svg').outerHTML = buildOrigamiSVG(c, isBoatReveal ? 4 : stage + 1, 280);
            spawnParticles(stageEl, isBoatReveal ? 16 : 8);
        }, isBoatReveal ? 800 : 450);

        // Advance to choice step
        const nextMap = [2, 4, 7, 10];
        setTimeout(() => { step = nextMap[foldIndex]; route(); }, isBoatReveal ? 2000 : 1200);
    });
}

/* ============================================================
   RENDER: TWO-PICK QUESTION (actionarcnlc pattern)
   ============================================================ */
function renderQuestion(config) {
    const { scenario, question, options, dataKey, backStep, qNum, paperStage, info, sailLetter, sailTitle } = config;
    const c = colors();

    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="paper-zone">
            ${progressBarHTML(qNum - 1)}
            <div class="origami-stage medium">
                ${buildOrigamiSVG(c, paperStage, 280)}
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

    // Restore previous picks
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
            haptic(20);
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
        save();
        advanceFromQuestion(dataKey);
    });
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
    const map = { S: 3, A: 5, A_sub: 6, I: 8, I_sub: 9, L: 11 };
    step = map[dataKey];
    route();
}

// Step-specific question renders
function renderChooseS() {
    const d = SAIL_DATA.S;
    renderQuestion({
        scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'S', backStep: 1, qNum: 1, paperStage: 1,
        info: d.info, sailLetter: d.letter, sailTitle: d.title,
    });
}

function renderChooseA() {
    const d = SAIL_DATA.A;
    renderQuestion({
        scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'A', backStep: 2, qNum: 2, paperStage: 2,
        info: d.info, sailLetter: d.letter, sailTitle: d.title,
    });
}

function renderChooseASub() {
    const d = SAIL_DATA.A;
    renderQuestion({
        scenario: d.subScenario, question: d.subQuestion, options: d.subOptions,
        dataKey: 'A_sub', backStep: 4, qNum: 3, paperStage: 2,
        info: null, sailLetter: d.letter, sailTitle: d.title,
    });
}

function renderChooseI() {
    const d = SAIL_DATA.I;
    renderQuestion({
        scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'I', backStep: 6, qNum: 4, paperStage: 3,
        info: d.info, sailLetter: d.letter, sailTitle: d.title,
    });
}

function renderChooseISub() {
    const d = SAIL_DATA.I;
    renderQuestion({
        scenario: d.subScenario, question: d.subQuestion, options: d.subOptions,
        dataKey: 'I_sub', backStep: 7, qNum: 5, paperStage: 3,
        info: null, sailLetter: d.letter, sailTitle: d.title,
    });
}

function renderChooseL() {
    const d = SAIL_DATA.L;
    renderQuestion({
        scenario: d.scenario, question: d.question, options: d.options,
        dataKey: 'L', backStep: 9, qNum: 6, paperStage: 4,
        info: d.info, sailLetter: d.letter, sailTitle: d.title,
    });
}

/* ============================================================
   RENDER: ASPIRATION
   ============================================================ */
function renderAspiration() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="paper-zone">
            ${progressBarHTML(TOTAL_QUESTIONS)}
            <div class="origami-stage medium">
                ${buildOrigamiSVG(c, 5, 280, extras())}
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
    document.getElementById('backBtn').addEventListener('click', () => { step = 10; route(); });
}

/* ============================================================
   RENDER: LAUNCH
   ============================================================ */
function renderLaunch() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen fade-in">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
            <div class="relative" id="launchContainer">
                <div class="sail-away">${buildOrigamiSVG(c, 5, 180, extras())}</div>
            </div>
            <p class="font-bold text-lg animate-pulse mt-10" style="color:var(--accent-gold);">Your boat has joined the fleet!</p>
            <p class="text-sm mt-2" style="color:var(--text-muted);">Look at the main screen...</p>
        </div>
    </div>`;
    setTimeout(() => { const c = document.getElementById('launchContainer'); if (c) spawnParticles(c, 20); }, 300);
    setTimeout(() => { step = 13; route(); }, 3500);
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
                    <div class="memento-boat">${buildOrigamiSVG(c, 5, 56, extras())}</div>
                    <div style="flex:1;min-width:0;">
                        <h1 class="text-lg font-black leading-tight" style="color:${sailOpt.color};">${archetype.name}</h1>
                        <p class="text-[10px] font-bold uppercase tracking-widest mt-0.5" style="color:var(--text-muted);">Your Beatty Compass Card</p>
                    </div>
                </div>
                <div class="memento-quote">
                    <p class="text-sm font-serif italic leading-relaxed" style="color:var(--text-primary);">${archetype.quote}</p>
                </div>
                <div class="px-4 pb-2">
                    <p class="text-xs leading-relaxed" style="color:var(--text-secondary);">${archetype.persona}</p>
                </div>
                <div class="memento-divider"></div>
                <div class="px-4 py-3 space-y-1.5">
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
    haptic(80);
    step = 12;
    route();
}

function downloadCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('downloadCardBtn');
    btn.textContent = 'Generating...'; btn.disabled = true;
    html2canvas(card, { backgroundColor: '#0f1019', scale: 3, useCORS: true }).then(canvas => {
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
    switch (step) {
        case 0:  renderWelcome(); break;
        case 1:  renderFoldStep(0); break;
        case 2:  renderChooseS(); break;
        case 3:  renderFoldStep(1); break;
        case 4:  renderChooseA(); break;
        case 5:  renderChooseASub(); break;
        case 6:  renderFoldStep(2); break;
        case 7:  renderChooseI(); break;
        case 8:  renderChooseISub(); break;
        case 9:  renderFoldStep(3); break;
        case 10: renderChooseL(); break;
        case 11: renderAspiration(); break;
        case 12: renderLaunch(); break;
        case 13: renderMemento(); break;
    }
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
$app.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'startBtn')        { haptic(); step = 1; route(); }
    if (t.id === 'launchBtn')       { handleLaunch(); }
    if (t.id === 'downloadCardBtn') { downloadCard(); }
    if (t.id === 'resetBtn') {
        localStorage.removeItem(SK);
        D = {}; step = 0; route();
    }
});

/* ============================================================
   RESUME STATE
   ============================================================ */
if (D.aspiration)                         step = 13;
else if (D.learningPick1 !== undefined)   step = 11;
else if (D.industryPick1 !== undefined)   step = 9;
else if (D.internationalPick1 !== undefined) step = 8;
else if (D.subjectPick1 !== undefined)    step = 6;
else if (D.appliedPick1 !== undefined)    step = 5;
else if (D.stewardshipPick1 !== undefined) step = 3;

route();
