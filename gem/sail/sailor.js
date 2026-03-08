/* === Beatty SAIL — Sailor (Participant) ===
   Origami fold-on-paper + richer questions + proper layout + robust card.
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
const STORAGE_KEY = 'btySail_v4';
let D = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let step = 0;

/*  Step map (14 steps total):
    0  = welcome
    1  = fold 0 (S)
    2  = choose S
    3  = fold 1 (A)
    4  = choose A main
    5  = choose A sub (subject)
    6  = fold 2 (I)
    7  = choose I main (exchange)
    8  = choose I sub (industry)
    9  = fold 3 (L)
    10 = choose L
    11 = aspiration
    12 = launch
    13 = memento
*/

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(D)); }
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
function oStage() {
    if (D.learningChoice) return 5;
    if (D.internationalChoice) return 4;
    if (D.appliedChoice) return 3;
    if (D.stewardshipChoice) return 2;
    return 0;
}
function extras() { return { aspiration: D.aspiration, flagIcon: D.flagIcon }; }

function progressHTML(foldsDone) {
    const L = ['S','A','I','L'];
    return `<div class="flex items-center justify-center gap-2 mb-2">
        ${L.map((l,i) => {
            const s = i < foldsDone ? 'done' : i === foldsDone ? 'active' : '';
            return `<div class="flex flex-col items-center gap-0.5">
                <div class="progress-dot ${s}"></div>
                <span class="text-[9px] font-bold tracking-wider ${s==='active'?'text-yellow-400':s==='done'?'text-yellow-600':'text-gray-600'}">${l}</span>
            </div>`;
        }).join('<div class="w-4 h-px bg-gray-700"></div>')}
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
   FOLD-ON-PAPER INTERACTION
   ============================================================ */

function scaleFoldCoords(guide, stageSize) {
    // FOLD_GUIDES are in 280x280 viewBox. Scale to stageSize.
    const s = stageSize / 280;
    return {
        from: { x: guide.from.x * s, y: guide.from.y * s },
        to:   { x: guide.to.x * s,   y: guide.to.y * s },
    };
}

function setupFoldInteraction(stageEl, foldIndex, stageSize, onComplete) {
    const guide = FOLD_GUIDES[foldIndex];
    const sc = scaleFoldCoords(guide, stageSize);
    const overlay = stageEl.querySelector('.fold-overlay');
    const dot = stageEl.querySelector('.fold-dot');
    const target = stageEl.querySelector('.fold-target');
    const dragSvg = stageEl.querySelector('.fold-drag-line');
    const ringCircle = stageEl.querySelector('.fold-progress-ring circle');

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
        if (d > 50) return;
        isDown = true;
        haptic(15);
        dot.style.animation = 'none';
    }
    function move(e) {
        if (!isDown || completed) return;
        e.preventDefault();
        const pos = getPos(e);
        const svbSz = stageSize;
        dragSvg.innerHTML = `<svg viewBox="0 0 ${svbSz} ${svbSz}" width="${svbSz}" height="${svbSz}">
            <line x1="${sc.from.x}" y1="${sc.from.y}" x2="${pos.x}" y2="${pos.y}"/>
        </svg>`;
        const distToTarget = Math.sqrt((pos.x-sc.to.x)**2 + (pos.y-sc.to.y)**2);
        const progress = Math.max(0, Math.min(1, 1 - distToTarget / totalDist));
        ringCircle.style.strokeDashoffset = circ * (1 - progress);
        if (progress > 0.3 && progress < 0.33) haptic(15);
        if (progress > 0.6 && progress < 0.63) haptic(20);
        if (progress > 0.85 && progress < 0.88) haptic(30);
        if (distToTarget < 30) {
            completed = true; isDown = false;
            haptic(80);
            onComplete();
        }
    }
    function end() {
        if (!isDown || completed) return;
        isDown = false;
        dragSvg.innerHTML = '';
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
   RENDER FUNCTIONS
   ============================================================ */

// --- Arrow SVG helper ---
function arrowSVG(guide, size) {
    const s = size / 280;
    const fx = guide.from.x*s, fy = guide.from.y*s;
    const tx = guide.to.x*s, ty = guide.to.y*s;
    const dx = tx - fx, dy = ty - fy;
    const len = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/len, uy = dy/len;
    const ahX = fx + dx*0.75, ahY = fy + dy*0.75;
    const sz = 7;
    return `<svg class="fold-arrow" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <line x1="${fx}" y1="${fy}" x2="${fx+dx*0.78}" y2="${fy+dy*0.78}"/>
        <polygon points="${ahX},${ahY} ${ahX-ux*sz-uy*sz*0.5},${ahY-uy*sz+ux*sz*0.5} ${ahX-ux*sz+uy*sz*0.5},${ahY-uy*sz-ux*sz*0.5}"/>
    </svg>`;
}

// --- WELCOME ---
function renderWelcome() {
    $app.innerHTML = `
    <div class="sail-screen fade-in">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
            <img src="${LOGO_URL}" alt="Beatty" class="h-16 w-16 mb-5 drop-shadow-lg">
            <h1 class="text-3xl font-black tracking-tight mb-2" style="color:var(--bty-yellow);">Set Sail</h1>
            <p class="text-gray-400 text-sm mb-6 text-center max-w-xs">Every Beattyian sets sail on a unique voyage.<br>Build yours — fold by fold.</p>
            <div class="origami-stage mb-4">
                ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 240)}
            </div>
            <p class="text-gray-500 text-xs mb-6 italic text-center">You have a piece of paper.<br>What will it become?</p>
            <button id="startBtn" class="w-full max-w-xs p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
                Begin Folding
            </button>
            <p class="text-[10px] text-gray-600 mt-6 tracking-widest uppercase">Beatty Secondary School &middot; Open House 2026</p>
        </div>
    </div>`;
}

// --- FOLD STEP ---
function renderFoldStep(foldIndex) {
    const keys = ['S','A','I','L'];
    const data = SAIL_DATA[keys[foldIndex]];
    const guide = FOLD_GUIDES[foldIndex];
    const c = colors();
    const stage = foldIndex;
    const isBoatReveal = foldIndex === 3;
    const svgSize = 240;

    $app.innerHTML = `
    <div class="sail-screen slide-up">
        <div class="paper-zone">
            ${progressHTML(foldIndex)}
            <div class="origami-stage" id="origamiStage" style="width:${svgSize}px; height:${svgSize}px;">
                ${buildOrigamiSVG(c, stage, svgSize)}
                ${arrowSVG(guide, svgSize)}
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
            <p class="text-gray-600 text-[10px] tracking-wide">Drag from the <span class="text-yellow-400 font-bold">glowing dot</span> toward the target</p>
        </div>
    </div>`;

    const stageEl = document.getElementById('origamiStage');
    setupFoldInteraction(stageEl, foldIndex, svgSize, () => {
        stageEl.querySelector('.fold-dot').style.opacity = '0';
        stageEl.querySelector('.fold-target').style.opacity = '0';
        stageEl.querySelector('.fold-arrow').style.opacity = '0';
        stageEl.querySelector('.fold-progress-ring').style.opacity = '0';
        stageEl.querySelector('.fold-drag-line').innerHTML = '';

        stageEl.classList.add(isBoatReveal ? 'boat-reveal' : 'fold-animating');

        const flash = document.createElement('div');
        flash.className = 'fold-flash';
        stageEl.appendChild(flash);
        setTimeout(() => flash.remove(), 700);

        setTimeout(() => {
            stageEl.querySelector('.origami-svg').outerHTML = buildOrigamiSVG(c, isBoatReveal ? 4 : stage + 1, svgSize);
            spawnParticles(stageEl, isBoatReveal ? 16 : 8);
        }, isBoatReveal ? 800 : 450);

        // Map fold index to next step
        const nextMap = [2, 4, 7, 10]; // after fold 0→step2, fold1→step4, fold2→step7, fold3→step10
        setTimeout(() => { step = nextMap[foldIndex]; route(); }, isBoatReveal ? 2000 : 1200);
    });
}

// --- CHOICE STEP (generic) ---
function renderChoice(config) {
    const { foldsDone, paperStage, svgSize, title, letter, tagline, info, question, options, dataKey } = config;
    const c = colors();
    const sz = svgSize || 160;

    $app.innerHTML = `
    <div class="sail-screen slide-up">
        <div class="paper-zone">
            ${progressHTML(foldsDone)}
            <div class="origami-stage small">
                ${buildOrigamiSVG(c, paperStage, sz)}
            </div>
        </div>
        <div class="content-zone">
            <div class="info-panel rounded-2xl p-4 mb-3 text-left">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-yellow-400 font-black text-base">${letter}</span>
                    <span class="text-yellow-200 font-bold text-sm">${title}</span>
                </div>
                ${tagline ? `<p class="text-white text-sm font-semibold mb-1">${tagline}</p>` : ''}
                ${info ? `<p class="text-gray-400 text-xs leading-relaxed">${info}</p>` : ''}
            </div>
            <h3 class="text-sm font-bold mb-3 text-white text-center">${question}</h3>
            <div class="space-y-2">
                ${options.map((opt, i) => `
                    <button data-key="${dataKey}" data-idx="${i}" class="choice-btn w-full text-left p-3 bg-gray-800/80 border-2 border-gray-700 rounded-xl text-sm font-semibold shadow-md flex items-center gap-3">
                        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${opt.color}"></span>
                        <span>${opt.icon || ''} ${opt.text}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    </div>`;
}

// --- Step-specific choice renders ---

function renderChooseS() {
    const d = SAIL_DATA.S;
    renderChoice({
        foldsDone: 0, paperStage: 1, title: d.title, letter: d.letter,
        tagline: d.tagline, info: d.info, question: d.question,
        options: d.options, dataKey: 'S',
    });
}

function renderChooseA() {
    const d = SAIL_DATA.A;
    renderChoice({
        foldsDone: 1, paperStage: 2, title: d.title, letter: d.letter,
        tagline: d.tagline, info: d.info, question: d.question,
        options: d.options, dataKey: 'A',
    });
}

function renderChooseASub() {
    const d = SAIL_DATA.A;
    renderChoice({
        foldsDone: 1, paperStage: 2, title: d.title, letter: d.letter,
        tagline: null, info: null, question: d.subQuestion,
        options: d.subOptions, dataKey: 'A_sub',
    });
}

function renderChooseI() {
    const d = SAIL_DATA.I;
    renderChoice({
        foldsDone: 2, paperStage: 3, title: d.title, letter: d.letter,
        tagline: d.tagline, info: d.info, question: d.question,
        options: d.options, dataKey: 'I',
    });
}

function renderChooseISub() {
    const d = SAIL_DATA.I;
    renderChoice({
        foldsDone: 2, paperStage: 3, title: d.title, letter: d.letter,
        tagline: null, info: null, question: d.subQuestion,
        options: d.subOptions, dataKey: 'I_sub',
    });
}

function renderChooseL() {
    const d = SAIL_DATA.L;
    renderChoice({
        foldsDone: 3, paperStage: 4, title: d.title, letter: d.letter,
        tagline: d.tagline, info: d.info, question: d.question,
        options: d.options, dataKey: 'L',
    });
}

// --- ASPIRATION ---
function renderAspiration() {
    const c = colors();
    $app.innerHTML = `
    <div class="sail-screen slide-up">
        <div class="paper-zone">
            ${progressHTML(4)}
            <div class="origami-stage small">
                ${buildOrigamiSVG(c, 5, 160, extras())}
            </div>
        </div>
        <div class="content-zone text-center">
            <h2 class="text-xl font-black text-yellow-400 mb-2">Name Your Vessel</h2>
            <p class="text-gray-400 text-sm mb-4">One word — your aspiration, inscribed on the hull forever.</p>
            <input type="text" id="aspirationInput" maxlength="15" class="w-full p-3 bg-gray-800 text-white border-2 border-blue-500 focus:border-yellow-400 rounded-xl mb-4 text-center text-xl font-black outline-none placeholder-gray-600" placeholder="e.g. COURAGE">
            <button id="launchBtn" class="w-full p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
                Launch Your Boat
            </button>
        </div>
    </div>`;
}

// --- LAUNCH ---
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

// --- MEMENTO CARD ---
function renderMemento() {
    const c = colors();
    const sailOpt  = SAIL_DATA.I.options.find(o => o.id === D.internationalChoice) || SAIL_DATA.I.options[0];
    const leadOpt  = SAIL_DATA.S.options.find(o => o.id === D.stewardshipChoice) || SAIL_DATA.S.options[0];
    const chalOpt  = SAIL_DATA.A.options.find(o => o.id === D.appliedChoice) || SAIL_DATA.A.options[0];
    const valOpt   = SAIL_DATA.L.options.find(o => o.id === D.learningChoice) || SAIL_DATA.L.options[0];
    const archetype = ARCHETYPES[D.internationalChoice] || ARCHETYPES.korea;
    const subjectLabel = LABELS.subject[D.subjectChoice] || '';
    const industryLabel = LABELS.industry[D.industryChoice] || '';

    // Insights from each pillar
    const sInsight = SAIL_DATA.S.insights[D.stewardshipChoice] || '';
    const iInsight = SAIL_DATA.I.insights[D.internationalChoice] || '';

    $app.innerHTML = `
    <div class="sail-screen fade-in">
        <div class="content-zone pt-4">
            <div class="memento-card" id="memento-card" style="border-color:${sailOpt.color};">
                <!-- Header: boat + archetype -->
                <div class="memento-header">
                    <div class="memento-boat">
                        ${buildOrigamiSVG(c, 5, 56, extras())}
                    </div>
                    <div class="memento-archetype">
                        <h1 class="text-lg font-black leading-tight" style="color:${sailOpt.color};">${archetype.name}</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Your Beatty Compass Card</p>
                    </div>
                </div>

                <!-- Quote -->
                <div class="memento-quote">
                    <p class="text-sm italic text-gray-100 font-serif leading-relaxed">${archetype.quote}</p>
                </div>

                <!-- Persona -->
                <div class="px-4 pb-2">
                    <p class="text-xs text-gray-400 leading-relaxed">${archetype.persona}</p>
                </div>

                <!-- YOUR INSIGHTS -->
                <div class="memento-section" style="border-color:var(--bty-yellow);">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-1">Your Insights</h4>
                    <p class="text-xs text-gray-300 leading-relaxed mb-2">${sInsight}</p>
                    <p class="text-[10px] text-gray-500">At Beatty, we offer ALL these areas — Sustainability, Journalism & Media, Engineering & AI, and more. Every passion has a pathway here!</p>
                </div>

                <!-- YOUR CHOSEN PATHWAYS -->
                <div class="memento-section" style="border-color:${sailOpt.color};">
                    <h4 class="font-bold uppercase tracking-wide text-[10px] mb-1" style="color:${sailOpt.color};">Your Chosen Pathways</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        You've set your sights on <strong class="text-white">${sailOpt.text}</strong>${industryLabel ? ` and an industry attachment at <strong class="text-white">${industryLabel}</strong>` : ''}.
                        ${iInsight}
                    </p>
                </div>

                <!-- YOUR SAIL CHOICES -->
                <div class="px-4 pb-2 space-y-1.5">
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2 border-l-3" style="border-left: 3px solid ${leadOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">S</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">Stewardship</p><p class="text-xs text-gray-200">${leadOpt.text}</p></div>
                    </div>
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left: 3px solid ${chalOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">A</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">Applied Learning</p><p class="text-xs text-gray-200">${chalOpt.text}${subjectLabel ? ` &middot; ${subjectLabel}` : ''}</p></div>
                    </div>
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left: 3px solid ${sailOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">I</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">International & Industry</p><p class="text-xs text-gray-200">${sailOpt.text}${industryLabel ? ` &middot; ${industryLabel}` : ''}</p></div>
                    </div>
                    <div class="flex items-start gap-2 bg-slate-800/80 rounded-lg p-2" style="border-left: 3px solid ${valOpt.color};">
                        <span class="text-yellow-400 font-black text-[10px] mt-0.5">L</span>
                        <div><p class="text-[10px] text-gray-500 font-bold uppercase">Learning to Live, Learn & Love</p><p class="text-xs text-gray-200">${valOpt.icon || ''} ${valOpt.text}</p></div>
                    </div>
                </div>

                <!-- RECOMMENDED PATHWAYS -->
                <div class="memento-section" style="border-color:#10b981;">
                    <h4 class="font-bold text-green-400 uppercase tracking-wide text-[10px] mb-1">Recommended Pathways</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        ${archetype.recommended.map(r => `<span class="text-green-300">${r}</span>`).join(' &bull; ')}
                    </p>
                    <p class="text-[10px] text-gray-500 mt-1">Get ready for your aspirations to take flight.</p>
                </div>

                <!-- Footer: aspiration -->
                <div class="memento-footer">
                    <p class="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Join us at Beatty and have your aspiration to become a/an</p>
                    <p class="text-3xl font-black uppercase tracking-wide" style="color:${sailOpt.color}; text-shadow: 0 2px 12px rgba(0,0,0,0.5);">${(D.aspiration || 'FUTURE LEADER').toUpperCase()}</p>
                    <p class="text-[10px] text-gray-500 mt-1">take flight!</p>
                    <div class="flex items-center justify-center gap-2 mt-3">
                        <img src="${LOGO_URL}" alt="Beatty" class="h-4 w-4 opacity-60">
                        <p class="text-[10px] text-gray-500">Beatty Secondary School &middot; Open House 2026</p>
                    </div>
                </div>
            </div>
            <button id="downloadCardBtn" class="mt-4 w-full p-4 bg-yellow-400 text-blue-900 font-black rounded-xl shadow-xl text-lg uppercase tracking-wide active:scale-95 transition-transform">Download Card</button>
            <button id="resetBtn" class="mt-3 w-full text-sm text-gray-500 underline pb-4">Start Over</button>
        </div>
    </div>`;
}

/* ============================================================
   CHOICE HANDLERS
   ============================================================ */
function handleChoice(key, idx) {
    haptic(40);
    const btns = $app.querySelectorAll('.choice-btn');
    btns.forEach(b => b.classList.remove('selected'));
    btns[idx].classList.add('selected');

    switch (key) {
        case 'S': {
            const opt = SAIL_DATA.S.options[idx];
            D.stewardshipChoice = opt.id;
            D.hullColor = opt.color;
            save();
            setTimeout(() => { step = 3; route(); }, 400);
            break;
        }
        case 'A': {
            const opt = SAIL_DATA.A.options[idx];
            D.appliedChoice = opt.id;
            D.keelColor = opt.color;
            save();
            setTimeout(() => { step = 5; route(); }, 400); // go to sub-question
            break;
        }
        case 'A_sub': {
            const opt = SAIL_DATA.A.subOptions[idx];
            D.subjectChoice = opt.id;
            save();
            setTimeout(() => { step = 6; route(); }, 400); // go to fold 2
            break;
        }
        case 'I': {
            const opt = SAIL_DATA.I.options[idx];
            D.internationalChoice = opt.id;
            D.sailColor = opt.color;
            D.sailGradient = opt.gradient || null;
            save();
            setTimeout(() => { step = 8; route(); }, 400); // go to sub-question
            break;
        }
        case 'I_sub': {
            const opt = SAIL_DATA.I.subOptions[idx];
            D.industryChoice = opt.id;
            save();
            setTimeout(() => { step = 9; route(); }, 400); // go to fold 3
            break;
        }
        case 'L': {
            const opt = SAIL_DATA.L.options[idx];
            D.learningChoice = opt.id;
            D.flagColor = opt.color;
            D.flagIcon = opt.icon || '';
            save();
            setTimeout(() => { step = 11; route(); }, 400); // aspiration
            break;
        }
    }
}

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
    btn.textContent = "Generating..."; btn.disabled = true;
    html2canvas(card, { backgroundColor: '#0f172a', scale: 3, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Beatty-SAIL-Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = "Download Card"; btn.disabled = false;
    }).catch(() => { btn.textContent = "Download Failed"; btn.disabled = false; });
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
    if (t.id === 'startBtn')        { haptic(); step = 1; route(); return; }
    if (t.id === 'launchBtn')       { handleLaunch(); return; }
    if (t.id === 'downloadCardBtn') { downloadCard(); return; }
    if (t.id === 'resetBtn') {
        localStorage.removeItem(STORAGE_KEY);
        D = {}; step = 0; route(); return;
    }
    if (t.dataset.key) handleChoice(t.dataset.key, parseInt(t.dataset.idx));
});

/* ============================================================
   RESUME STATE
   ============================================================ */
if (D.aspiration)               step = 13;
else if (D.learningChoice)      step = 11;
else if (D.industryChoice)      step = 9;
else if (D.internationalChoice) step = 8;
else if (D.subjectChoice)       step = 6;
else if (D.appliedChoice)       step = 5;
else if (D.stewardshipChoice)   step = 3;

route();
