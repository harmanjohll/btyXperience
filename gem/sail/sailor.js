/* === Beatty SAIL — Sailor (Participant) ===
   Responsive origami + actionarcnlc two-pick questions + back/next nav.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    buildOrigamiSVG, haptic,
    SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FOLD_GUIDES, LABELS,
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
const SK = 'btySail_v5';
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

const TOTAL_QUESTIONS = 6; // S, A, A_sub, I, I_sub, L

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
    return `<div class="mb-4">
        <div class="flex justify-between items-center mb-1.5">
            <span class="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Progress</span>
            <span class="text-[10px] font-medium text-yellow-400">${pct}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
}

function spawnParticles(container, count = 12) {
    const cols = ['#FFE200','#3b82f6','#ef4444','#10b981','#ec4899','#f59e0b'];
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
   FOLD-ON-PAPER INTERACTION (with paper tilt + crease mark)
   ============================================================ */

function setupFoldInteraction(stageEl, foldIndex, onComplete) {
    const guide = FOLD_GUIDES[foldIndex];
    // Get actual rendered size of the stage element
    const stageRect = stageEl.getBoundingClientRect();
    const stageSize = stageRect.width;
    const s = stageSize / 280; // scale factor

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
        if (d > 55) return; // must start near source dot
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

        // Paper tilt effect — tilt toward drag direction
        const progressX = (pos.x - sc.from.x) / stageSize;
        const progressY = (pos.y - sc.from.y) / stageSize;
        const tiltX = -progressY * 12; // tilt forward/back
        const tiltY = progressX * 8;   // tilt left/right
        svgEl.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        // Progress calculation
        const distToTarget = Math.sqrt((pos.x-sc.to.x)**2 + (pos.y-sc.to.y)**2);
        const progress = Math.max(0, Math.min(1, 1 - distToTarget / totalDist));
        ringCircle.style.strokeDashoffset = circ * (1 - progress);

        // Haptic milestones
        if (progress > 0.3 && progress < 0.33) haptic(15);
        if (progress > 0.6 && progress < 0.63) haptic(20);
        if (progress > 0.85 && progress < 0.88) haptic(30);

        if (distToTarget < 30) {
            completed = true; isDown = false;
            svgEl.style.transform = '';
            stageEl.classList.remove('tilting');
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
    }

    overlay.addEventListener('mousedown', start);
    overlay.addEventListener('mousemove', move);
    overlay.addEventListener('mouseup', end);
    overlay.addEventListener('mouseleave', end);
    overlay.addEventListener('touchstart', start, { passive: false });
    overlay.addEventListener('touchmove', move, { passive: false });
    overlay.addEventListener('touchend', end);
}

/* ============================================================
   RENDER: WELCOME
   ============================================================ */
function renderWelcome() {
    $app.innerHTML = `
    <div class="sail-screen fade-up">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
            <img src="${LOGO_URL}" alt="Beatty" class="h-16 w-16 mb-5 drop-shadow-lg">
            <h1 class="text-3xl font-black tracking-tight mb-2" style="color:var(--accent-gold);">Set Sail</h1>
            <p class="text-gray-400 text-sm mb-6 text-center max-w-xs">Every Beattyian sets sail on a unique voyage.<br>Build yours — fold by fold.</p>
            <div class="origami-stage mb-4">
                ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 280)}
            </div>
            <p class="text-gray-500 text-xs mb-6 italic text-center">You have a piece of paper.<br>What will it become?</p>
            <button id="startBtn" class="nav-btn primary w-full max-w-xs text-lg uppercase tracking-wider">Begin Folding</button>
            <p class="text-[10px] text-gray-600 mt-6 tracking-widest uppercase">Beatty Secondary School &middot; Open House 2026</p>
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

    // Arrow SVG in 280 viewBox (will scale with CSS)
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
            <div class="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1 mb-2">
                <div class="fold-badge">${foldIndex+1}</div>
                <span class="text-yellow-200 font-bold text-sm">Fold ${foldIndex+1} of 4</span>
            </div>
            <p class="text-gray-400 text-xs mb-1">${data.foldInstruction}</p>
            <p class="text-gray-600 text-[10px]">Drag from the <span class="text-yellow-400 font-bold">glowing dot</span> toward the target</p>
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

            // Add crease mark on the paper
            if (!isBoatReveal) {
                const creaseMark = document.createElement('div');
                creaseMark.className = 'crease-mark';
                creaseMark.style.cssText = 'position:absolute;inset:0;z-index:8;pointer-events:none;';
                // Map fold guide to crease line position on the new stage
                creaseMark.innerHTML = `<svg viewBox="0 0 280 280" style="width:100%;height:100%;">
                    <line x1="${guide.from.x}" y1="${Math.min(guide.from.y, guide.to.y)}" x2="${guide.to.x}" y2="${Math.max(guide.from.y, guide.to.y)}" stroke="rgba(180,160,130,0.4)" stroke-width="1.5"/>
                </svg>`;
                stageEl.appendChild(creaseMark);
            }
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
            <div class="origami-stage small">
                ${buildOrigamiSVG(c, paperStage, 280)}
            </div>
        </div>
        <div class="content-zone">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-yellow-400 font-black text-base">${sailLetter}</span>
                <span class="text-yellow-200 font-bold text-sm">${sailTitle}</span>
            </div>
            ${scenario ? `<div class="scenario-box mb-3">
                <p class="text-sm leading-relaxed italic text-gray-400" style="font-family:Georgia,serif;">${scenario}</p>
            </div>` : ''}
            <h2 class="text-base font-bold mb-1 text-white leading-snug">${question}</h2>
            <p class="text-[10px] mb-4 text-gray-500">Select two. <span class="text-yellow-400 font-semibold">1st choice</span> carries more weight than your <span class="text-blue-400 font-semibold">2nd</span>. Tap again to deselect.</p>
            <div class="space-y-2.5" id="opts">
                ${options.map((opt, i) => `<button class="option-btn fade-up stagger-${i+1}" data-key="${dataKey}" data-idx="${i}"><span class="option-badge"></span>${opt.text}</button>`).join('')}
            </div>
            ${info ? `<div class="info-panel rounded-xl p-3 mt-3"><p class="text-gray-400 text-xs leading-relaxed">${info}</p></div>` : ''}
            <div class="nav-bar" id="navBar">
                <button class="nav-btn secondary" id="backBtn" ${backStep === null ? 'disabled' : ''}>Back</button>
                <button class="nav-btn primary" id="nextBtn" disabled>Next</button>
            </div>
        </div>
    </div>`;

    // Restore previous picks if any
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

    // Option click handler
    document.querySelectorAll('.option-btn').forEach(b => {
        b.addEventListener('click', () => {
            const idx = parseInt(b.dataset.idx);
            haptic(20);
            if (pick1 === idx) { pick1 = pick2 !== null ? pick2 : null; pick2 = null; }
            else if (pick2 === idx) { pick2 = null; }
            else if (pick1 === null) { pick1 = idx; }
            else if (pick2 === null) { pick2 = idx; }
            else return; // already 2 selected
            updatePickStyles();
        });
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        if (backStep !== null) { step = backStep; route(); }
    });

    // Next button
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (pick1 === null || pick2 === null) return;
        haptic(40);

        // Save picks
        D[prevPick1Key] = pick1;
        D[prevPick2Key] = pick2;

        // Primary pick determines boat color
        const primaryOpt = options[pick1];
        applyPrimaryChoice(dataKey, primaryOpt);
        save();

        // Advance
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
            <div class="origami-stage small">
                ${buildOrigamiSVG(c, 5, 280, extras())}
            </div>
        </div>
        <div class="content-zone text-center">
            <h2 class="text-xl font-black text-yellow-400 mb-2">Name Your Vessel</h2>
            <p class="text-gray-400 text-sm mb-4">One word — your aspiration, inscribed on the hull forever.</p>
            <input type="text" id="aspirationInput" maxlength="15" class="w-full p-3 bg-gray-800 text-white border-2 border-blue-500 focus:border-yellow-400 rounded-xl mb-4 text-center text-xl font-black outline-none placeholder-gray-600" placeholder="e.g. COURAGE">
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
            <p class="text-yellow-400 font-bold text-lg animate-pulse mt-10">Your boat has joined the fleet!</p>
            <p class="text-gray-500 text-sm mt-2">Look at the main screen...</p>
        </div>
    </div>`;
    setTimeout(() => { const c = document.getElementById('launchContainer'); if (c) spawnParticles(c, 20); }, 300);
    setTimeout(() => { step = 13; route(); }, 3500);
}

/* ============================================================
   RENDER: MEMENTO CARD (robust, no overlaps)
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
                    <div class="memento-archetype">
                        <h1 class="text-lg font-black leading-tight" style="color:${sailOpt.color};">${archetype.name}</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Your Beatty Compass Card</p>
                    </div>
                </div>
                <div class="memento-quote">
                    <p class="text-sm italic text-gray-100 leading-relaxed" style="font-family:Georgia,serif;">${archetype.quote}</p>
                </div>
                <div class="px-4 pb-2">
                    <p class="text-xs text-gray-400 leading-relaxed">${archetype.persona}</p>
                </div>
                <div class="memento-section" style="border-color:var(--accent-gold);">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-1">Your Insights</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">${SAIL_DATA.S.info}</p>
                </div>
                <div class="memento-section" style="border-color:${sailOpt.color};">
                    <h4 class="font-bold uppercase tracking-wide text-[10px] mb-1" style="color:${sailOpt.color};">Your Chosen Pathways</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        You've set your sights on <strong class="text-white">${sailOpt.text.split('—')[0].trim()}</strong>${industryLabel ? ` and an industry attachment at <strong class="text-white">${industryLabel}</strong>` : ''}.
                        ${SAIL_DATA.I.info}
                    </p>
                </div>
                <div class="px-4 pb-2 space-y-1.5">
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left:3px solid ${leadOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">S</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">Stewardship</p><p class="text-xs text-gray-200">${leadOpt.text.split('—')[0].trim()}</p></div>
                    </div>
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left:3px solid ${chalOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">A</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">Applied Learning</p><p class="text-xs text-gray-200">${chalOpt.text.split('—')[0].trim()}${subjectLabel ? ' · '+subjectLabel : ''}</p></div>
                    </div>
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left:3px solid ${sailOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">I</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">International & Industry</p><p class="text-xs text-gray-200">${sailOpt.text.split('—')[0].trim()}${industryLabel ? ' · '+industryLabel : ''}</p></div>
                    </div>
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left:3px solid ${valOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">L</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">Learning to Live, Learn & Love</p><p class="text-xs text-gray-200">${valOpt.icon||''} ${valOpt.text.split('—')[0].trim()}</p></div>
                    </div>
                </div>
                <div class="memento-section" style="border-color:#10b981;">
                    <h4 class="font-bold text-green-400 uppercase tracking-wide text-[10px] mb-1">Recommended Pathways</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">${archetype.recommended.map(r => `<span class="text-green-300">${r}</span>`).join(' · ')}</p>
                </div>
                <div class="memento-footer">
                    <p class="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">My aspiration</p>
                    <p class="text-3xl font-black uppercase tracking-wide" style="color:${sailOpt.color};text-shadow:0 2px 12px rgba(0,0,0,0.5);">${(D.aspiration||'FUTURE LEADER').toUpperCase()}</p>
                    <div class="flex items-center justify-center gap-2 mt-3">
                        <img src="${LOGO_URL}" alt="Beatty" class="h-4 w-4 opacity-60">
                        <p class="text-[10px] text-gray-500">Beatty Secondary School · Open House 2026</p>
                    </div>
                </div>
            </div>
            <button id="downloadCardBtn" class="nav-btn primary w-full mt-4 text-lg uppercase tracking-wide">Download Card</button>
            <button id="resetBtn" class="mt-3 w-full text-sm text-gray-500 underline pb-4">Start Over</button>
        </div>
    </div>`;
}

/* ============================================================
   LAUNCH HANDLER
   ============================================================ */
async function handleLaunch() {
    const input = document.getElementById('aspirationInput');
    const word = input.value.trim();
    if (!word) { input.classList.add('border-red-500'); return; }
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
    html2canvas(card, { backgroundColor: '#0f172a', scale: 3, useCORS: true }).then(canvas => {
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
