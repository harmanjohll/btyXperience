/* === Beatty SAIL — Sailor (Participant) Logic ===
   Origami-first: fold directly on the paper, boat reveals at the end.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    buildOrigamiSVG, haptic,
    SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FOLD_GUIDES,
    FIREBASE_CONFIG, LOGO_URL, PACE_MODE,
} from './boat.js';

// === FIREBASE ===
let db, auth;
try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    await signInAnonymously(auth);
} catch (e) { console.error("Firebase init:", e); }

// === STATE ===
const $app = document.getElementById('app');
const STORAGE_KEY = 'btySail_v3';
let userData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentStep = 0;
// Steps: 0=welcome, 1=fold0, 2=choose0, 3=fold1, 4=choose1,
//        5=fold2, 6=choose2, 7=fold3, 8=choose3,
//        9=aspiration, 10=launch, 11=memento

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); }

async function saveToFirebase() {
    if (!auth?.currentUser) return;
    try {
        await setDoc(doc(db, "sailBoats", auth.currentUser.uid), { ...userData, timestamp: serverTimestamp() });
    } catch (e) { console.error("Firebase:", e); }
}

// === HELPERS ===
function getColors() {
    return {
        hull: userData.hullColor || BOAT_DEFAULTS.hull,
        keel: userData.keelColor || BOAT_DEFAULTS.keel,
        sail: userData.sailColor || BOAT_DEFAULTS.sail,
        sailGradient: userData.sailGradient || null,
        flag: userData.flagColor || BOAT_DEFAULTS.flag,
        mast: BOAT_DEFAULTS.mast,
    };
}

function origamiStage() {
    if (userData.learningChoice) return 5;       // flag added
    if (userData.internationalChoice) return 4;  // boat revealed
    if (userData.appliedChoice) return 3;
    if (userData.stewardshipChoice) return 2;
    return 0;
}

function progressHTML(foldsDone) {
    const labels = ['S', 'A', 'I', 'L'];
    return `<div class="flex items-center justify-center gap-3 mb-4">
        ${labels.map((l, i) => {
            const st = i < foldsDone ? 'done' : i === foldsDone ? 'active' : '';
            return `<div class="flex flex-col items-center gap-1">
                <div class="progress-dot ${st}"></div>
                <span class="text-[10px] font-bold tracking-wider ${st === 'active' ? 'text-yellow-400' : st === 'done' ? 'text-yellow-600' : 'text-gray-600'}">${l}</span>
            </div>`;
        }).join('<div class="w-6 h-px bg-gray-700"></div>')}
    </div>`;
}

function extras() { return { aspiration: userData.aspiration, flagIcon: userData.flagIcon }; }

function spawnParticles(container, count = 12) {
    const colors = ['#FFE200', '#3b82f6', '#ef4444', '#10b981', '#ec4899', '#f59e0b'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'launch-particle';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.setProperty('--px', (Math.random() - 0.5) * 200 + 'px');
        p.style.setProperty('--py', (Math.random() - 0.5) * 200 + 'px');
        p.style.left = '50%'; p.style.top = '50%';
        container.appendChild(p);
        setTimeout(() => p.remove(), 1500);
    }
}

/* ============================================================
   FOLD-ON-PAPER INTERACTION
   ============================================================
   - A pulsing dot appears on the paper at the "from" point
   - A dashed target circle at the "to" point
   - A ghost arrow connects them
   - User drags from source toward target
   - Progress ring fills as they get closer
   - On completion: fold animation + advance
   ============================================================ */

function setupFoldInteraction(stageEl, foldIndex, onComplete) {
    const guide = FOLD_GUIDES[foldIndex];
    const overlay = stageEl.querySelector('.fold-overlay');
    const dot = stageEl.querySelector('.fold-dot');
    const target = stageEl.querySelector('.fold-target');
    const dragSvg = stageEl.querySelector('.fold-drag-line');
    const ringCircle = stageEl.querySelector('.fold-progress-ring circle');

    // Position source dot and target
    dot.style.left = guide.from.x + 'px';
    dot.style.top = guide.from.y + 'px';
    target.style.left = guide.to.x + 'px';
    target.style.top = guide.to.y + 'px';

    // Calculate total distance
    const dx = guide.to.x - guide.from.x;
    const dy = guide.to.y - guide.from.y;
    const totalDist = Math.sqrt(dx * dx + dy * dy);

    // Progress ring circumference
    const circumference = 2 * Math.PI * 17; // r=17
    ringCircle.style.strokeDasharray = circumference;
    ringCircle.style.strokeDashoffset = circumference;

    // Position progress ring at source
    const ring = stageEl.querySelector('.fold-progress-ring');
    ring.style.left = guide.from.x + 'px';
    ring.style.top = guide.from.y + 'px';

    let isDown = false;
    let completed = false;

    function getPos(e) {
        const rect = overlay.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        // Scale to SVG viewBox (280x280) from actual element size
        const scaleX = 280 / rect.width;
        const scaleY = 280 / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }

    function start(e) {
        if (completed) return;
        e.preventDefault();
        const pos = getPos(e);
        // Must start near the source dot (within 40px radius)
        const distFromSource = Math.sqrt(
            (pos.x - guide.from.x) ** 2 + (pos.y - guide.from.y) ** 2
        );
        if (distFromSource > 45) return;
        isDown = true;
        haptic(15);
        dot.style.animation = 'none'; // stop pulsing while dragging
    }

    function move(e) {
        if (!isDown || completed) return;
        e.preventDefault();
        const pos = getPos(e);

        // Draw drag line from source to current position
        dragSvg.innerHTML = `<svg viewBox="0 0 280 280" width="280" height="280">
            <line x1="${guide.from.x}" y1="${guide.from.y}" x2="${pos.x}" y2="${pos.y}"/>
        </svg>`;

        // Calculate progress: how close is the drag tip to the target?
        const distToTarget = Math.sqrt(
            (pos.x - guide.to.x) ** 2 + (pos.y - guide.to.y) ** 2
        );
        const progress = Math.max(0, Math.min(1, 1 - distToTarget / totalDist));

        // Update progress ring
        const offset = circumference * (1 - progress);
        ringCircle.style.strokeDashoffset = offset;

        // Haptic at milestones
        if (progress > 0.3 && progress < 0.32) haptic(15);
        if (progress > 0.6 && progress < 0.62) haptic(20);
        if (progress > 0.85 && progress < 0.87) haptic(30);

        // Complete when close enough to target (within 35px)
        if (distToTarget < 35) {
            completed = true;
            isDown = false;
            haptic(80);
            onComplete();
        }
    }

    function end() {
        if (!isDown || completed) return;
        isDown = false;
        // Reset drag line but keep progress ring
        dragSvg.innerHTML = '';
        dot.style.animation = ''; // resume pulse
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

// --- WELCOME ---
function renderWelcome() {
    $app.innerHTML = `
    <div class="w-full max-w-sm text-center fade-in flex flex-col items-center justify-center min-h-[80dvh]">
        <img src="${LOGO_URL}" alt="Beatty" class="h-20 w-20 mb-6 drop-shadow-lg">
        <h1 class="text-3xl font-black tracking-tight mb-2" style="color: var(--bty-yellow);">Set Sail</h1>
        <p class="text-gray-400 text-sm mb-8 max-w-xs">Every Beattyian sets sail on a unique voyage.<br>Build yours — fold by fold.</p>
        <div class="origami-stage mb-6">
            ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 220)}
        </div>
        <p class="text-gray-500 text-xs mb-6 italic">You have a piece of paper. What will it become?</p>
        <button id="startBtn" class="w-full max-w-xs p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
            Begin Folding
        </button>
        <p class="text-[10px] text-gray-600 mt-6 tracking-widest uppercase">Beatty Secondary School &middot; Open House 2026</p>
    </div>`;
}

// --- FOLD STEP (interactive, on the paper) ---
function renderFoldStep(foldIndex) {
    const keys = ['S', 'A', 'I', 'L'];
    const data = SAIL_DATA[keys[foldIndex]];
    const guide = FOLD_GUIDES[foldIndex];
    const colors = getColors();
    const stage = foldIndex; // paper at current stage (before this fold)
    const isBoatReveal = foldIndex === 3;

    // Build ghost arrow SVG (dashed line from source to target with arrowhead)
    const arrowDx = guide.to.x - guide.from.x;
    const arrowDy = guide.to.y - guide.from.y;
    const arrowLen = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);
    const aUx = arrowDx / arrowLen;
    const aUy = arrowDy / arrowLen;
    // Arrowhead at 80% of the way
    const ahX = guide.from.x + arrowDx * 0.75;
    const ahY = guide.from.y + arrowDy * 0.75;
    const aSize = 8;
    const ah1x = ahX - aUx * aSize - aUy * aSize * 0.5;
    const ah1y = ahY - aUy * aSize + aUx * aSize * 0.5;
    const ah2x = ahX - aUx * aSize + aUy * aSize * 0.5;
    const ah2y = ahY - aUy * aSize - aUx * aSize * 0.5;

    $app.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(foldIndex)}
        <div class="mb-2">
            <div class="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5">
                <div class="fold-badge">${foldIndex + 1}</div>
                <span class="text-yellow-200 font-bold text-sm">Fold ${foldIndex + 1} of 4</span>
            </div>
        </div>
        <p class="text-gray-400 text-xs mb-3">${data.foldInstruction}</p>

        <div class="origami-stage mb-3" id="origamiStage">
            <!-- The paper SVG -->
            ${buildOrigamiSVG(colors, stage, 280)}

            <!-- Ghost arrow -->
            <svg class="fold-arrow" viewBox="0 0 280 280" width="280" height="280">
                <line x1="${guide.from.x}" y1="${guide.from.y}" x2="${guide.to.x * 0.8 + guide.from.x * 0.2}" y2="${guide.to.y * 0.8 + guide.from.y * 0.2}"/>
                <polygon points="${ahX},${ahY} ${ah1x},${ah1y} ${ah2x},${ah2y}"/>
            </svg>

            <!-- Fold interaction overlay -->
            <div class="fold-overlay"></div>

            <!-- Source dot (pulsing) -->
            <div class="fold-dot"></div>

            <!-- Target dot (dashed ring) -->
            <div class="fold-target"></div>

            <!-- Progress ring -->
            <div class="fold-progress-ring">
                <svg viewBox="0 0 40 40" width="40" height="40">
                    <circle cx="20" cy="20" r="17"/>
                </svg>
            </div>

            <!-- Drag feedback line -->
            <div class="fold-drag-line"></div>
        </div>

        <p class="text-gray-600 text-[10px] mt-1 tracking-wide">
            Drag from the <span class="text-yellow-400 font-bold">glowing dot</span> to the target
        </p>
    </div>`;

    // Wire up fold interaction
    const stageEl = document.getElementById('origamiStage');
    setupFoldInteraction(stageEl, foldIndex, () => {
        // Hide guides
        stageEl.querySelector('.fold-dot').style.opacity = '0';
        stageEl.querySelector('.fold-target').style.opacity = '0';
        stageEl.querySelector('.fold-arrow').style.opacity = '0';
        stageEl.querySelector('.fold-progress-ring').style.opacity = '0';
        stageEl.querySelector('.fold-drag-line').innerHTML = '';

        // Add fold/reveal animation class
        stageEl.classList.add(isBoatReveal ? 'boat-reveal' : 'fold-animating');

        // Flash
        const flash = document.createElement('div');
        flash.className = 'fold-flash';
        stageEl.appendChild(flash);
        setTimeout(() => flash.remove(), 700);

        // Show next stage SVG after animation
        setTimeout(() => {
            const nextStage = isBoatReveal ? 4 : stage + 1;
            stageEl.querySelector('.origami-svg').outerHTML = buildOrigamiSVG(colors, nextStage, 280);
            spawnParticles(stageEl, isBoatReveal ? 16 : 8);
        }, isBoatReveal ? 900 : 500);

        // Advance to choice step
        setTimeout(() => {
            currentStep = (foldIndex * 2) + 2;
            route();
        }, isBoatReveal ? 2200 : 1400);
    });
}

// --- CHOICE STEP ---
function renderChoiceStep(foldIndex) {
    const keys = ['S', 'A', 'I', 'L'];
    const key = keys[foldIndex];
    const data = SAIL_DATA[key];
    const colors = getColors();
    // After the fold: stages 1,2,3 are paper; 4 is boat; 5 is boat+flag
    const stage = foldIndex < 3 ? foldIndex + 1 : 4;

    $app.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(foldIndex)}
        <div class="origami-stage mb-3" style="width:200px; height:200px;">
            ${buildOrigamiSVG(colors, stage, 200)}
        </div>
        <div class="info-panel rounded-2xl p-4 mb-4 w-full text-left">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-yellow-400 font-black text-lg">${data.letter}</span>
                <span class="text-yellow-200 font-bold text-sm">${data.title}</span>
            </div>
            <p class="text-white text-sm font-semibold mb-1">${data.tagline}</p>
            <p class="text-gray-400 text-xs leading-relaxed">${data.info}</p>
        </div>
        <h3 class="text-base font-bold mb-3 text-white">${data.question}</h3>
        <div class="w-full space-y-2.5">
            ${data.options.map((opt, i) => `
                <button data-step="${key}" data-option="${i}" class="choice-btn w-full text-left p-3.5 bg-gray-800/80 border-2 border-gray-700 rounded-xl text-sm font-semibold shadow-md flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${opt.color}"></span>
                    <span>${opt.icon || ''} ${opt.text}</span>
                </button>
            `).join('')}
        </div>
    </div>`;
}

// --- ASPIRATION ---
function renderAspiration() {
    const colors = getColors();
    $app.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(4)}
        <div class="origami-stage mb-4" style="width:220px; height:220px;">
            ${buildOrigamiSVG(colors, 5, 220, extras())}
        </div>
        <h2 class="text-2xl font-black text-yellow-400 mb-2">Name Your Vessel</h2>
        <p class="text-gray-400 text-sm mb-5">One word. Your aspiration — inscribed on the hull forever.</p>
        <input type="text" id="aspirationInput" maxlength="15" class="w-full max-w-xs p-4 bg-gray-800 text-white border-2 border-blue-500 focus:border-yellow-400 rounded-xl mb-4 text-center text-2xl font-black outline-none placeholder-gray-600" placeholder="e.g. COURAGE">
        <button id="launchBtn" class="w-full max-w-xs p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
            Launch Your Boat
        </button>
    </div>`;
}

// --- LAUNCH ---
function renderLaunch() {
    const colors = getColors();
    $app.innerHTML = `
    <div class="w-full max-w-sm text-center fade-in flex flex-col items-center justify-center min-h-[80dvh]">
        <div class="relative" id="launchContainer">
            <div class="sail-away mb-8">
                ${buildOrigamiSVG(colors, 5, 200, extras())}
            </div>
        </div>
        <p class="text-yellow-400 font-bold text-lg animate-pulse mt-8">Your boat has joined the fleet!</p>
        <p class="text-gray-500 text-sm mt-2">Look at the main screen...</p>
    </div>`;
    setTimeout(() => {
        const c = document.getElementById('launchContainer');
        if (c) spawnParticles(c, 20);
    }, 300);
    setTimeout(() => renderMemento(), 3500);
}

// --- MEMENTO CARD ---
function renderMemento() {
    const colors = getColors();
    const sailOpt  = SAIL_DATA.I.options.find(o => o.id === userData.internationalChoice) || SAIL_DATA.I.options[0];
    const leadOpt  = SAIL_DATA.S.options.find(o => o.id === userData.stewardshipChoice)   || SAIL_DATA.S.options[0];
    const chalOpt  = SAIL_DATA.A.options.find(o => o.id === userData.appliedChoice)       || SAIL_DATA.A.options[0];
    const valOpt   = SAIL_DATA.L.options.find(o => o.id === userData.learningChoice)      || SAIL_DATA.L.options[0];
    const archetype = ARCHETYPES[userData.internationalChoice] || ARCHETYPES.korea;

    $app.innerHTML = `
    <div class="w-full max-w-md text-center fade-in pb-8">
        <div id="memento-card" class="relative overflow-hidden rounded-3xl border-4 shadow-2xl text-left" style="border-color:${sailOpt.color}; background-color: #0f172a;">
            <div class="p-5 pb-3 relative z-10">
                <div class="flex items-center gap-3">
                    <div class="flex-shrink-0" style="width:80px; height:80px;">
                        ${buildOrigamiSVG(colors, 5, 80, extras())}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h1 class="text-lg font-black leading-tight tracking-tight" style="color:${sailOpt.color};">${archetype.name}</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Your SAIL Voyage Card</p>
                    </div>
                </div>
            </div>
            <div class="mx-4 p-3 rounded-xl border border-white/5 relative z-10" style="background: rgba(15,23,42,0.5);">
                <p class="text-sm italic text-gray-100 font-serif">"${archetype.quote}"</p>
            </div>
            <div class="p-4 pt-3 relative z-10 space-y-2">
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${leadOpt.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">S &middot; Stewardship</h4>
                    <p class="text-xs text-gray-200">${leadOpt.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${chalOpt.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">A &middot; Applied Learning</h4>
                    <p class="text-xs text-gray-200">${chalOpt.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${sailOpt.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">I &middot; International & Industry</h4>
                    <p class="text-xs text-gray-200">${sailOpt.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${valOpt.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">L &middot; Learning to Live, Learn & Love</h4>
                    <p class="text-xs text-gray-200">${valOpt.icon || ''} ${valOpt.text}</p>
                </div>
            </div>
            <div class="bg-black/40 p-4 text-center relative z-10 border-t border-white/10">
                <p class="text-[10px] text-gray-400 mb-1 uppercase tracking-widest">My Aspiration</p>
                <p class="text-2xl font-black uppercase tracking-wide" style="color:${sailOpt.color}; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${(userData.aspiration || 'FUTURE LEADER').toUpperCase()}</p>
                <div class="flex items-center justify-center gap-2 mt-2">
                    <img src="${LOGO_URL}" alt="Beatty" class="h-4 w-4 opacity-60">
                    <p class="text-[10px] text-gray-500">Beatty Secondary School &middot; Open House 2026</p>
                </div>
            </div>
        </div>
        <button id="downloadCardBtn" class="mt-5 w-full p-4 bg-yellow-400 text-blue-900 font-black rounded-xl shadow-xl text-lg uppercase tracking-wide active:scale-95 transition-transform">Download Card</button>
        <button id="resetBtn" class="mt-3 text-sm text-gray-500 underline">Start Over</button>
    </div>`;
}

/* ============================================================
   CHOICE HANDLER
   ============================================================ */
function handleChoice(stepKey, optionIndex) {
    const data = SAIL_DATA[stepKey];
    const opt = data.options[optionIndex];
    haptic(40);

    switch (stepKey) {
        case 'S': userData.stewardshipChoice = opt.id; userData.hullColor = opt.color; break;
        case 'A': userData.appliedChoice = opt.id; userData.keelColor = opt.color; break;
        case 'I': userData.internationalChoice = opt.id; userData.sailColor = opt.color; userData.sailGradient = opt.gradient || null; break;
        case 'L': userData.learningChoice = opt.id; userData.flagColor = opt.color; userData.flagIcon = opt.icon || ''; break;
    }
    save();

    const btns = $app.querySelectorAll('.choice-btn');
    btns.forEach(b => b.classList.remove('selected'));
    btns[optionIndex].classList.add('selected');

    const nextMap = { S: 3, A: 5, I: 7, L: 9 };
    setTimeout(() => { currentStep = nextMap[stepKey]; route(); }, 500);
}

/* ============================================================
   LAUNCH & DOWNLOAD
   ============================================================ */
async function handleLaunch() {
    const input = document.getElementById('aspirationInput');
    const word = input.value.trim();
    if (!word) { input.classList.add('border-red-500'); return; }
    userData.aspiration = word;
    save();
    await saveToFirebase();
    haptic(80);
    currentStep = 10;
    route();
}

function downloadCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('downloadCardBtn');
    btn.textContent = "Generating...";
    btn.disabled = true;
    html2canvas(card, { backgroundColor: '#0f172a', scale: 3, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Beatty-SAIL-Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = "Download Card";
        btn.disabled = false;
    }).catch(err => {
        console.error("Canvas:", err);
        btn.textContent = "Download Failed";
        btn.disabled = false;
    });
}

/* ============================================================
   ROUTER
   ============================================================ */
function route() {
    switch (currentStep) {
        case 0:  renderWelcome(); break;
        case 1:  renderFoldStep(0); break;   // Fold 1: top to bottom
        case 2:  renderChoiceStep(0); break;  // Choose S
        case 3:  renderFoldStep(1); break;   // Fold 2: corners to centre
        case 4:  renderChoiceStep(1); break;  // Choose A
        case 5:  renderFoldStep(2); break;   // Fold 3: flaps up
        case 6:  renderChoiceStep(2); break;  // Choose I
        case 7:  renderFoldStep(3); break;   // Fold 4: pull open → BOAT!
        case 8:  renderChoiceStep(3); break;  // Choose L
        case 9:  renderAspiration(); break;
        case 10: renderLaunch(); break;
        case 11: renderMemento(); break;
    }
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
$app.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    if (target.id === 'startBtn')        { haptic(); currentStep = 1; route(); return; }
    if (target.id === 'launchBtn')       { handleLaunch(); return; }
    if (target.id === 'downloadCardBtn') { downloadCard(); return; }
    if (target.id === 'resetBtn') {
        localStorage.removeItem(STORAGE_KEY);
        userData = {};
        currentStep = 0;
        route();
        return;
    }
    if (target.dataset.step) {
        handleChoice(target.dataset.step, parseInt(target.dataset.option));
    }
});

/* ============================================================
   RESUME STATE
   ============================================================ */
if (userData.aspiration)               currentStep = 11;
else if (userData.learningChoice)      currentStep = 9;
else if (userData.internationalChoice) currentStep = 7;
else if (userData.appliedChoice)       currentStep = 5;
else if (userData.stewardshipChoice)   currentStep = 3;

route();
