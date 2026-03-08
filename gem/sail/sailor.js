/* === Beatty SAIL — Sailor (Participant) Logic === */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { buildBoatSVG, haptic, SAIL_DATA, BOAT_DEFAULTS, ARCHETYPES, FIREBASE_CONFIG, LOGO_URL } from './boat.js';

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
const STORAGE_KEY = 'btySail_v1';
let userData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentStep = 0;

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
    };
}

function progressHTML(step) {
    const labels = ['S', 'A', 'I', 'L'];
    return `<div class="flex items-center justify-center gap-3 mb-6">
        ${labels.map((l, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : '';
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

// === RENDER: WELCOME ===
function renderWelcome() {
    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center fade-in flex flex-col items-center justify-center min-h-[80dvh]">
        <img src="${LOGO_URL}" alt="Beatty Crest" class="h-20 w-20 mb-6 drop-shadow-lg">
        <h1 class="text-3xl font-black tracking-tight mb-2" style="color: var(--bty-yellow);">Set Sail</h1>
        <p class="text-gray-400 text-sm mb-8 max-w-xs">Every Beattyian sets sail on a unique voyage.<br>Build yours — fold by fold.</p>
        <div class="mb-8 opacity-40">
            ${buildBoatSVG(BOAT_DEFAULTS, 0, 200)}
        </div>
        <button id="startBtn" class="w-full max-w-xs p-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider active:scale-95 transition-transform">
            Begin Your Voyage
        </button>
        <p class="text-[10px] text-gray-600 mt-6 tracking-widest uppercase">Beatty Secondary School &middot; Open House</p>
    </div>`;
}

// === RENDER: FOLD STEP (S, A, I, L) ===
function renderFoldStep(stepIndex) {
    const keys = ['S', 'A', 'I', 'L'];
    const key = keys[stepIndex];
    const data = SAIL_DATA[key];
    const colors = getBoatColors();

    appContainer.innerHTML = `
    <div class="w-full max-w-sm text-center slide-up flex flex-col items-center pb-8">
        ${progressHTML(stepIndex)}
        <div class="paper-container mb-4">
            <div class="paper fold-flash">
                ${buildBoatSVG(colors, stepIndex + 1, 280, boatExtras())}
            </div>
        </div>
        <div class="mb-4">
            <div class="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5">
                <span class="text-yellow-400 font-black text-lg">${data.letter}</span>
                <span class="text-yellow-200 font-bold text-sm">${data.title}</span>
            </div>
        </div>
        <div class="info-panel rounded-2xl p-5 mb-5 w-full text-left">
            <p class="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Fold ${stepIndex + 1}: ${data.boatPart}</p>
            <p class="text-white text-sm font-semibold mb-2">${data.tagline}</p>
            <p class="text-gray-400 text-xs leading-relaxed">${data.info}</p>
        </div>
        <h3 class="text-lg font-bold mb-4 text-white">${data.question}</h3>
        <div class="w-full space-y-3">
            ${data.options.map((opt, i) => `
                <button data-step="${key}" data-option="${i}" class="choice-btn w-full text-left p-4 bg-gray-800/80 border-2 border-gray-700 rounded-xl text-sm font-semibold shadow-md flex items-center gap-3">
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
        <div class="paper-container mb-6">
            <div class="paper">
                ${buildBoatSVG(colors, 5, 280, boatExtras())}
            </div>
        </div>
        <h2 class="text-2xl font-black text-yellow-400 mb-2">Name Your Vessel</h2>
        <p class="text-gray-400 text-sm mb-6">One word. Your aspiration — inscribed on the hull forever.</p>
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
        <div class="sail-away mb-8">
            ${buildBoatSVG(colors, 5, 220, boatExtras())}
        </div>
        <p class="text-yellow-400 font-bold text-lg animate-pulse mt-8">Your boat has joined the fleet!</p>
        <p class="text-gray-500 text-sm mt-2">Look at the main screen...</p>
    </div>`;
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
            <div class="p-5 pb-3 relative z-10">
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 -ml-2 -mt-2">
                        ${buildBoatSVG(colors, 5, 100, boatExtras())}
                    </div>
                    <div class="pt-2">
                        <h1 class="text-xl font-black leading-none tracking-tight" style="color:${sailChoice.color};">${archetype.name}</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Your SAIL Voyage Card</p>
                    </div>
                </div>
            </div>
            <div class="bg-slate-900/50 mx-4 p-4 rounded-xl border border-white/5 relative z-10">
                <p class="text-sm italic text-gray-100 font-serif">"${archetype.quote}"</p>
            </div>
            <div class="p-5 pt-4 relative z-10 space-y-3">
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-3 shadow-lg" style="border-color:${leaderChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-1">S &middot; Stewardship</h4>
                    <p class="text-xs text-gray-200">${leaderChoice.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-3 shadow-lg" style="border-color:${challengeChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-1">A &middot; Applied Learning</h4>
                    <p class="text-xs text-gray-200">${challengeChoice.text}</p>
                </div>
                <div class="bg-blue-900/30 border-l-4 rounded-r-lg p-3 shadow-lg" style="border-color:${sailChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-1">I &middot; International & Industry</h4>
                    <p class="text-xs text-gray-200">${sailChoice.text}</p>
                </div>
                <div class="bg-slate-800 border-l-4 rounded-r-lg p-3 shadow-lg" style="border-color:${valueChoice.color}">
                    <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-[10px] mb-1">L &middot; Learning to Live, Learn & Love</h4>
                    <p class="text-xs text-gray-200">${valueChoice.icon || ''} ${valueChoice.text}</p>
                </div>
            </div>
            <div class="bg-black/40 p-5 text-center relative z-10 border-t border-white/10">
                <p class="text-[10px] text-gray-400 mb-1 uppercase tracking-widest">My Aspiration</p>
                <p class="text-3xl font-black uppercase tracking-wide" style="color:${sailChoice.color}; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${(userData.aspiration || 'FUTURE LEADER').toUpperCase()}</p>
                <div class="flex items-center justify-center gap-2 mt-3">
                    <img src="${LOGO_URL}" alt="Beatty" class="h-5 w-5 opacity-60">
                    <p class="text-[10px] text-gray-500">Beatty Secondary School &middot; Open House 2025</p>
                </div>
            </div>
        </div>
        <button id="downloadCardBtn" class="mt-6 w-full p-4 bg-yellow-400 text-blue-900 font-black rounded-xl shadow-xl text-lg uppercase tracking-wide active:scale-95 transition-transform">Download Card</button>
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

    const stepMap = { S: 1, A: 2, I: 3, L: 4 };
    setTimeout(() => { currentStep = stepMap[stepKey] + 1; route(); }, 500);
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
    currentStep = 6;
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
        case 0: renderWelcome(); break;
        case 1: renderFoldStep(0); break;
        case 2: renderFoldStep(1); break;
        case 3: renderFoldStep(2); break;
        case 4: renderFoldStep(3); break;
        case 5: renderAspiration(); break;
        case 6: renderLaunch(); break;
        case 7: renderMemento(); break;
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
if (userData.aspiration)            currentStep = 7;
else if (userData.learningChoice)   currentStep = 5;
else if (userData.internationalChoice) currentStep = 4;
else if (userData.appliedChoice)    currentStep = 3;
else if (userData.stewardshipChoice) currentStep = 2;

route();
