/* === Beatty SAIL — Presenter (Fleet View) Logic === */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { buildBoatSVG, FIREBASE_CONFIG, LABELS } from './boat.js';

// === FIREBASE INIT ===
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// === DOM ===
const fleetArea       = document.getElementById('fleetArea');
const boatCountEl     = document.getElementById('boatCount');
const spotlightEl     = document.getElementById('spotlight');
const spotlightCardEl = document.getElementById('spotlightCard');

// === STATE ===
const boats       = new Map();
const boatElements = new Map();

// === BUILD MINI BOAT ===
function buildMiniBoat(data, size = 60) {
    const colors = {
        hull: data.hullColor || '#1e3a5f',
        keel: data.keelColor || '#0f2a4a',
        sail: data.sailColor || '#ffffff',
        sailGradient: data.sailGradient || null,
        flag: data.flagColor || '#FFE200',
    };
    return buildBoatSVG(colors, 5, size, {
        gradientId: 'sg_' + (data.uid || 'x'),
    });
}

// === PLACE A BOAT ON THE OCEAN ===
function placeBoat(data) {
    if (boatElements.has(data.uid)) return;

    const el = document.createElement('div');
    el.className = 'fleet-boat boat-enter';

    const areaW = fleetArea.clientWidth;
    const areaH = fleetArea.clientHeight;
    const x = 40 + Math.random() * (areaW - 120);
    const y = 20 + Math.random() * (areaH - 100);
    const size = 50 + Math.random() * 30;
    const bobDelay = Math.random() * 4;

    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.animationDelay = (Math.random() * 0.5) + 's';

    el.innerHTML = buildMiniBoat(data, size);
    el.dataset.uid = data.uid;

    el.addEventListener('animationend', () => {
        el.classList.remove('boat-enter');
        el.style.animationDelay = bobDelay + 's';
    }, { once: true });

    el.addEventListener('click', () => showSpotlight(data));
    fleetArea.appendChild(el);
    boatElements.set(data.uid, el);

    boatCountEl.textContent = boatElements.size;
}

// === SPOTLIGHT ===
window.closeSpotlight = function() {
    spotlightEl.style.display = 'none';
};

function showSpotlight(data) {
    const sail = data.sailColor || '#3b82f6';
    spotlightCardEl.innerHTML = `
        <div class="mb-4">${buildMiniBoat({ ...data, uid: 'spot' }, 120)}</div>
        <h2 class="text-2xl font-black mb-1" style="color:${sail};">${(data.aspiration || 'VOYAGER').toUpperCase()}</h2>
        <p class="text-gray-500 text-xs uppercase tracking-widest mb-4">Aspiration</p>
        <div class="text-left space-y-2 text-sm">
            <div class="flex items-center gap-2">
                <span class="text-yellow-400 font-black">S</span>
                <span class="text-gray-300">${LABELS.stewardship[data.stewardshipChoice] || '\u2014'}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-yellow-400 font-black">A</span>
                <span class="text-gray-300">${LABELS.applied[data.appliedChoice] || '\u2014'}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-yellow-400 font-black">I</span>
                <span class="text-gray-300">${LABELS.international[data.internationalChoice] || '\u2014'}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-yellow-400 font-black">L</span>
                <span class="text-gray-300">${LABELS.learning[data.learningChoice] || '\u2014'}</span>
            </div>
        </div>
        <button onclick="closeSpotlight()" class="mt-6 px-6 py-2 bg-yellow-400 text-blue-900 font-bold rounded-xl text-sm">Close</button>
    `;
    spotlightEl.style.display = 'flex';
}

// === LISTEN TO FIREBASE ===
onSnapshot(collection(db, "sailBoats"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
            const data = { uid: change.doc.id, ...change.doc.data() };
            boats.set(data.uid, data);
            if (data.aspiration) placeBoat(data);
        }
    });
});

// === DEMO MODE: press 'd' to spawn a test boat ===
const SAIL_GRADIENT_MAP = {
    korea:    ['#3b82f6', '#60a5fa'],
    japan:    ['#ec4899', '#f9a8d4'],
    nz:       ['#10b981', '#6ee7b7'],
    industry: ['#f59e0b', '#fcd34d'],
};

document.addEventListener('keydown', (e) => {
    if (e.key !== 'd') return;
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const intl = r(['korea', 'japan', 'nz', 'industry']);

    placeBoat({
        uid: 'demo_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        hullColor: r(['#3b82f6', '#f59e0b', '#ef4444', '#10b981']),
        keelColor: r(['#3b82f6', '#f59e0b', '#ef4444', '#10b981']),
        sailColor: r(['#3b82f6', '#ec4899', '#10b981', '#f59e0b']),
        sailGradient: SAIL_GRADIENT_MAP[intl],
        flagColor: r(['#3b82f6', '#ef4444', '#ec4899', '#10b981']),
        aspiration: r(['COURAGE', 'DREAM', 'INNOVATE', 'LEAD', 'CREATE', 'EXPLORE', 'INSPIRE', 'SERVE', 'DISCOVER', 'BUILD']),
        stewardshipChoice: r(['model', 'inspire', 'challenge', 'enable']),
        appliedChoice: r(['ai', 'green', 'robotics', 'creative']),
        internationalChoice: intl,
        learningChoice: r(['discipline', 'resilience', 'empathy', 'adaptability']),
        flagIcon: r(['\u2693', '\uD83D\uDD25', '\uD83D\uDC99', '\uD83C\uDF0A']),
    });
});
