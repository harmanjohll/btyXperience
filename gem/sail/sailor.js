/* === Beatty SAIL — Sailor (Participant) Logic ===
   Origami-first experience: flat paper → crease → fold → sailboat
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { buildOrigamiSVG, haptic, SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FIREBASE_CONFIG, LOGO_URL, PACE_MODE } from './boat.js';

// === FIREBASE INIT ===
let db, auth;
try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    await signInAnonymously(auth);
} catch (e) { console.error("Firebase init failed:", e); }

// === STATE ===
const appContainer = document.getElementById('app');
const STORAGE_KEY = 'btySail_v2';
let userData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentStep = 0;
// Steps: 0=welcome, 1=crease1, 2=choose1, 3=crease2, 4=choose2,
//        5=crease3, 6=choose3, 7=crease4, 8=choose4,
//        9=aspiration, 10=launch, 11=memento

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); }

async function saveToFirebase() {
    if (!auth?.currentUser) return;
    try {
        await setDoc(doc(db, "sailBoats", auth.currentUser.uid), {
            ...userData,
            timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Firebase save error:", e); }
}

// === HELPERS ===
function getBoatColors() {
    return {
        hull: userData.hullColor || BOAT_DEFAULTS.hull,
        keel: userData.keelColor || BOAT_DEFAULTS.keel,
        sail: userData.sailColor || BOAT_DEFAULTS.sail,
        sailGradient: userData.sailGradient || null,
        flag: userData.flagColor || BOAT_DEFAULTS.flag,
        mast: BOAT_DEFAULTS.mast,
    };
}

function getOrigamiStage() {
    // Map current choices to origami stage 0-5
    if (userData.learningChoice) return 4;
    if (userData.internationalChoice) return 3;
    if (userData.appliedChoice) return 2;
    if (userData.stewardshipChoice) return 1;
    return 0;
}

function progressHTML(foldsDone) {
    const labels = ['S', 'A', 'I', 'L'];
    return `<div class="flex items-center justify-center gap-3 mb-4">
        ${labels.map((l, i) => {
            const state = i < foldsDone ? 'done' : i === foldsDone ? 'active' : '';
            return `<div class="flex flex-col items-center gap-1">
                <div class="progress-dot ${state}"></div>
                <span class="text-[10px] font-bold tracking-wider ${state === 'active' ? 'text-yellow-400' : state === 'done' ? 'text-yellow-600' : 'text-gray-600'}">${l}</span>
            </div>`;
        }).join('<div class="w-6 h-px bg-gray-700"></div>')}
    </div>`;
}

function boatExtras() {
    return { aspiration: userData.aspiration, flagIcon: userData.flagIcon };
}

// === CREASE GESTURE SYSTEM ===
function setupCreaseGesture(zoneEl, onComplete) {
    const fill = zoneEl.querySelector('.crease-fill');
    let progress = 0;
    let isDown = false;
    let lastX = 0;
    const THRESHOLD = 100; // percentage to complete

    function getX(e) {
        if (e.touches) return e.touches[0].clientX;
        return e.clientX;
    }

    function start(e) {
        e.preventDefault();
        isDown = true;
        lastX = getX(e);
        zoneEl.classList.add('active');
        haptic(10);
    }

    function move(e) {
        if (!isDown) return;
        e.preventDefault();
        const x = getX(e);
        const dx = Math.abs(x - lastX);
        lastX = x;

        // Progress increases with horizontal movement (like running finger along crease)
        progress = Math.min(THRESHOLD, progress + dx * 0.4);
        fill.style.width = progress + '%';

        // Haptic at thresholds
        if (progress > 25 && progress < 27) haptic(15);
        if (progress > 50 && progress < 52) haptic(20);
        if (progress > 75 && progress < 77) haptic(25);

        if (progress >= THRESHOLD) {
            isDown = false;
            zoneEl.classList.remove('active');
            zoneEl.classList.add('complete');
            haptic(60);
            onComplete();
        }
    }

    function end() {
        if (!isDown) return;
        isDown = false;
        zoneEl.classList.remove('active');
        // Don't reset — keep partial progress so they can continue
    }

    zoneEl.addEventListener('mousedown', start);
    zoneEl.addEventListener('mousemove', move);
    zoneEl.addEventListener('mouseup', end);
    zoneEl.addEventListener('mouseleave', end);
    zoneEl.addEventListener('touchstart', start, { passive: false });
    zoneEl.addEventListener('touchmove', move, { passive: false });
    zoneEl.addEventListener('touchend', end);
}

// === SPAWN PARTICLES ===
function spawnParticles(container, count = 12) {
    const colors = ['#FFE200', '#3b82f6', '#ef4444', '#10b981', '#ec4899', '#f59e0b'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'launch-particle';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.setProperty('--px', (Math.random() - 0.5) * 200 + 'px');
        p.style.setProperty('--py', (Math.random() - 0.5) * 200 + 'px');
        p.style.left = '50%';
        p.style.top = '50%';
        container.appendChild(p);
        setTimeout(() => p.remove(), 1500);
    }
}

// === RENDER: WELCOME ===
function renderWelcome() {
    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center fade-in flex flex-col items-center justify-center min-h-[80dvh]">
        <img src="${LOGO_URL}" alt="Beatty Crest" class="h-20 w-20 mb-6 drop-shadow-lg">
        <h1 class="text-3xl font-black tracking-tight mb-2" style="color: var(--bty-yellow);">Set Sail</h1>
        <p class="text-gray-400 text-sm mb-8 max-w-xs">Every Beattyian sets sail on a unique voyage.<br>Build yours — fold by fold.</p>
        <div class="origami-stage mb-6">
            <div class="origami-paper">
                ${buildOrigamiSVG(BOAT_DEFAULTS, 0, 220)}
            </div>
        </div>
        <p class="text-gray-500 text-xs mb-6 italic">You have a piece of paper. What will it become?</p>
        <button id="startBtn" class="w-full max-w-xs p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
            Begin Folding
        </button>
        <p class="text-[10px] text-gray-600 mt-6 tracking-widest uppercase">Beatty Secondary School &middot; Open House 2026</p>
    </div>`;
}

// === RENDER: CREASE STEP (before each fold) ===
function renderCreaseStep(foldIndex) {
    const keys = ['S', 'A', 'I', 'L'];
    const data = SAIL_DATA[keys[foldIndex]];
    const colors = getBoatColors();
    const stage = foldIndex; // Show paper at current stage (before this fold)

    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(foldIndex)}
        <div class="origami-stage mb-4">
            <div class="origami-paper" id="origamiPaper">
                ${buildOrigamiSVG(colors, stage, 260)}
            </div>
        </div>
        <div class="mb-3">
            <div class="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5">
                <div class="fold-badge">${foldIndex + 1}</div>
                <span class="text-yellow-200 font-bold text-sm">Fold ${foldIndex + 1}: ${data.boatPart}</span>
            </div>
        </div>
        <p class="text-gray-400 text-xs mb-4">${data.foldInstruction}</p>
        <div class="crease-zone" id="creaseZone">
            <div class="crease-fill"></div>
            <div class="crease-line"></div>
            <div class="crease-hint">\u261E</div>
            <div class="crease-label">Slide to crease</div>
        </div>
        <p class="text-gray-600 text-[10px] mt-2 tracking-wide">Drag your finger across the fold line</p>
    </div>`;

    // Setup crease gesture
    const zone = document.getElementById('creaseZone');
    setupCreaseGesture(zone, () => {
        // Crease complete — trigger fold animation
        const paper = document.getElementById('origamiPaper');
        paper.classList.add('fold-animating');

        // After fold animation, show the new stage briefly then go to choice
        setTimeout(() => {
            paper.innerHTML = buildOrigamiSVG(colors, stage + 1, 260);
            spawnParticles(paper, 8);
        }, 600);

        setTimeout(() => {
            currentStep = (foldIndex * 2) + 2; // go to choice step
            route();
        }, 1400);
    });
}

// === RENDER: CHOICE STEP (after each fold) ===
function renderChoiceStep(foldIndex) {
    const keys = ['S', 'A', 'I', 'L'];
    const key = keys[foldIndex];
    const data = SAIL_DATA[key];
    const colors = getBoatColors();
    const stage = foldIndex + 1; // After this fold

    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(foldIndex)}
        <div class="origami-stage mb-3" style="height:200px; width:200px;">
            <div class="origami-paper">
                ${buildOrigamiSVG(colors, stage, 200)}
            </div>
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

// === RENDER: ASPIRATION ===
function renderAspiration() {
    const colors = getBoatColors();
    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(4)}
        <div class="origami-stage mb-4" style="height:220px; width:220px;">
            <div class="origami-paper">
                ${buildOrigamiSVG(colors, 4, 220, boatExtras())}
            </div>
        </div>
        <h2 class="text-2xl font-black text-yellow-400 mb-2">Name Your Vessel</h2>
        <p class="text-gray-400 text-sm mb-5">One word. Your aspiration — inscribed on the hull forever.</p>
        <input type="text" id="aspirationInput" maxlength="15" class="w-full max-w-xs p-4 bg-gray-800 text-white border-2 border-blue-500 focus:border-yellow-400 rounded-xl mb-4 text-center text-2xl font-black outline-none placeholder-gray-600" placeholder="e.g. COURAGE">
        <button id="launchBtn" class="w-full max-w-xs p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
            Launch Your Boat
        </button>
    </div>`;
}

// === RENDER: LAUNCH ANIMATION ===
function renderLaunch() {
    const colors = getBoatColors();
    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center fade-in flex flex-col items-center justify-center min-h-[80dvh]">
        <div class="relative" id="launchContainer">
            <div class="sail-away mb-8">
                ${buildOrigamiSVG(colors, 4, 200, boatExtras())}
            </div>
        </div>
        <p class="text-yellow-400 font-bold text-lg animate-pulse mt-8">Your boat has joined the fleet!</p>
        <p class="text-gray-500 text-sm mt-2">Look at the main screen...</p>
    </div>`;

    // Spawn particles on launch
    setTimeout(() => {
        const container = document.getElementById('launchContainer');
        if (container) spawnParticles(container, 20);
    }, 300);

    setTimeout(() => renderMemento(), 3500);
}

// === RENDER: MEMENTO CARD ===
function renderMemento() {
    const colors = getBoatColors();
    const sailChoice     = SAIL_DATA.I.options.find(o => o.id === userData.internationalChoice) || SAIL_DATA.I.options[0];
    const leaderChoice   = SAIL_DATA.S.options.find(o => o.id === userData.stewardshipChoice)   || SAIL_DATA.S.options[0];
    const challengeChoice= SAIL_DATA.A.options.find(o => o.id === userData.appliedChoice)       || SAIL_DATA.A.options[0];
    const valueChoice    = SAIL_DATA.L.options.find(o => o.id === userData.learningChoice)      || SAIL_DATA.L.options[0];
    const archetype      = ARCHETYPES[userData.internationalChoice] || ARCHETYPES.korea;

    appContainer.innerHTML = `
    <div class="w-full max-w-md text-center fade-in pb-8">
        <div id="memento-card" class="relative overflow-hidden rounded-3xl border-4 shadow-2xl text-left" style="border-color:${sailChoice.color}; background-color: #0f172a;">
            <!-- Header with boat and archetype -->
            <div class="p-5 pb-3 relative z-10">
                <div class="flex items-center gap-3">
                    <div class="flex-shrink-0" style="width:80px; height:80px;">
                        ${buildOrigamiSVG(colors, 4, 80, boatExtras())}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h1 class="text-lg font-black leading-tight tracking-tight" style="color:${sailChoice.color};">${archetype.name}</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Your SAIL Voyage Card</p>
                    </div>
                </div>
            </div>

            <!-- Quote -->
            <div class="mx-4 p-3 rounded-xl border border-white/5 relative z-10" style="background: rgba(15,23,42,0.5);">
                <p class="text-sm italic text-gray-100 font-serif">"${archetype.quote}"</p>
            </div>

            <!-- SAIL choices -->
            <div class="p-4 pt-3 relative z-10 space-y-2">
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${leaderChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">S &middot; Stewardship</h4>
                    <p class="text-xs text-gray-200">${leaderChoice.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${challengeChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">A &middot; Applied Learning</h4>
                    <p class="text-xs text-gray-200">${challengeChoice.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${sailChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">I &middot; International & Industry</h4>
                    <p class="text-xs text-gray-200">${sailChoice.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-2.5 shadow-lg" style="border-color:${valueChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-0.5">L &middot; Learning to Live, Learn & Love</h4>
                    <p class="text-xs text-gray-200">${valueChoice.icon || ''} ${valueChoice.text}</p>
                </div>
            </div>

            <!-- Aspiration footer -->
            <div class="bg-black/40 p-4 text-center relative z-10 border-t border-white/10">
                <p class="text-[10px] text-gray-400 mb-1 uppercase tracking-widest">My Aspiration</p>
                <p class="text-2xl font-black uppercase tracking-wide" style="color:${sailChoice.color}; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${(userData.aspiration || 'FUTURE LEADER').toUpperCase()}</p>
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

// === CHOICE HANDLER ===
function handleFoldChoice(stepKey, optionIndex) {
    const data = SAIL_DATA[stepKey];
    const option = data.options[optionIndex];
    haptic(40);

    switch (stepKey) {
        case 'S': userData.stewardshipChoice = option.id; userData.hullColor = option.color; break;
        case 'A': userData.appliedChoice = option.id; userData.keelColor = option.color; break;
        case 'I': userData.internationalChoice = option.id; userData.sailColor = option.color; userData.sailGradient = option.gradient || null; break;
        case 'L': userData.learningChoice = option.id; userData.flagColor = option.color; userData.flagIcon = option.icon || ''; break;
    }
    save();

    const btns = appContainer.querySelectorAll('.choice-btn');
    btns.forEach(b => b.classList.remove('selected'));
    btns[optionIndex].classList.add('selected');

    // Advance: after choice, go to next crease step (or aspiration if done)
    const nextStepMap = { S: 3, A: 5, I: 7, L: 9 };
    setTimeout(() => { currentStep = nextStepMap[stepKey]; route(); }, 500);
}

// === LAUNCH HANDLER ===
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

// === DOWNLOAD CARD ===
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
        console.error("Canvas error:", err);
        btn.textContent = "Download Failed";
        btn.disabled = false;
    });
}

// === ROUTER ===
function route() {
    switch (currentStep) {
        case 0:  renderWelcome(); break;
        case 1:  renderCreaseStep(0); break;  // Crease for S (hull)
        case 2:  renderChoiceStep(0); break;  // Choose S
        case 3:  renderCreaseStep(1); break;  // Crease for A (keel)
        case 4:  renderChoiceStep(1); break;  // Choose A
        case 5:  renderCreaseStep(2); break;  // Crease for I (sail)
        case 6:  renderChoiceStep(2); break;  // Choose I
        case 7:  renderCreaseStep(3); break;  // Crease for L (flag)
        case 8:  renderChoiceStep(3); break;  // Choose L
        case 9:  renderAspiration(); break;
        case 10: renderLaunch(); break;
        case 11: renderMemento(); break;
    }
}

// === EVENT DELEGATION ===
appContainer.addEventListener('click', (e) => {
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
        handleFoldChoice(target.dataset.step, parseInt(target.dataset.option));
    }
});

// === RESUME STATE ===
if (userData.aspiration)               currentStep = 11;
else if (userData.learningChoice)      currentStep = 9;
else if (userData.internationalChoice) currentStep = 7;
else if (userData.appliedChoice)       currentStep = 5;
else if (userData.stewardshipChoice)   currentStep = 3;

route();
