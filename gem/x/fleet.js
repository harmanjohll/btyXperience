/* === Beatty SAIL — Presenter (Fleet View) Logic v2 ===
   Rich spotlight, archetype distribution, arrival chime, milestones.
*/

import { buildOrigamiSVG, FIREBASE_CONFIG, LABELS, ARCHETYPES, SAIL_DATA } from './boat.js';

// === FIREBASE (dynamic import) ===
// A static firebase import would kill the whole module — and blank the big
// screen — if the venue network blocks or throttles the gstatic CDN. Load it
// off the critical path instead: the ocean scene renders immediately, boats
// stream in once live sync connects, and demo mode ('D') works either way.
let initializeApp, getFirestore, collection, onSnapshot, getAuth, signInAnonymously;
let db, auth;
(async () => {
    try {
        const [a, fs, au] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
        ]);
        initializeApp = a.initializeApp;
        ({ getFirestore, collection, onSnapshot } = fs);
        ({ getAuth, signInAnonymously } = au);
        const app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
        auth = getAuth(app);
        // Sign in first so reads pass the secured Firestore rules; start the
        // listener whether or not sign-in succeeds so it also works pre-rules.
        await signInAnonymously(auth).catch((e) => console.warn("Fleet auth failed:", e));
        startFleetListener();
    } catch (e) {
        console.warn("Fleet live sync unavailable — demo mode still works (press D):", e);
        showConnectionNotice();
    }
})();

// === DOM ===
const fleetArea       = document.getElementById('fleetArea');
const boatCountEl     = document.getElementById('boatCount');
const spotlightEl     = document.getElementById('spotlight');
const spotlightCardEl = document.getElementById('spotlightCard');
const distBarEl       = document.getElementById('distributionBar');

// === STATE ===
const boats        = new Map();
const boatElements = new Map();
const archetypeCounts = {};
let autoSpotlightEnabled = true;
let autoSpotlightTimer   = null;

// === WEB AUDIO — arrival chime ===
let audioCtx;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function playArrivalChime() {
    try {
        const ctx = getAudioCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.4);
    } catch(e) {}
}

// === COMPUTE ARCHETYPE (mirrors sailor.js logic) ===
function computeArchetypeForData(data) {
    const tally = {};
    function add(id, w) { if (id) tally[id] = (tally[id] || 0) + w; }

    // Map stored choice keys to option IDs
    function pickId(optionsArray, choiceKey) {
        if (!optionsArray || choiceKey === undefined || choiceKey === null) return null;
        // choiceKey might be an ID string or index
        if (typeof choiceKey === 'string') return choiceKey;
        const opt = optionsArray[choiceKey];
        return opt?.id || null;
    }

    // S
    add(pickId(SAIL_DATA.S.options, data.stewardshipChoice ?? data.stewardshipPick1 ?? data.S_pick1), 2);
    add(pickId(SAIL_DATA.S.options, data.S_pick2), 1);
    // A
    add(pickId(SAIL_DATA.A.options, data.appliedChoice ?? data.appliedPick1 ?? data.A_pick1), 2);
    add(pickId(SAIL_DATA.A.options, data.A_pick2), 1);
    // A_sub
    add(pickId(SAIL_DATA.A.subOptions, data.subjectPick1 ?? data.A_sub_pick1), 2);
    add(pickId(SAIL_DATA.A.subOptions, data.A_sub_pick2), 1);
    // I
    add(pickId(SAIL_DATA.I.options, data.internationalChoice ?? data.internationalPick1 ?? data.I_pick1), 2);
    add(pickId(SAIL_DATA.I.options, data.I_pick2), 1);
    // I_sub
    add(pickId(SAIL_DATA.I.subOptions, data.industryPick1 ?? data.I_sub_pick1), 2);
    add(pickId(SAIL_DATA.I.subOptions, data.I_sub_pick2), 1);
    // L
    add(pickId(SAIL_DATA.L.options, data.learningChoice ?? data.learningPick1 ?? data.L_pick1), 2);
    add(pickId(SAIL_DATA.L.options, data.L_pick2), 1);

    let best = null, bestScore = -1;
    for (const [key, arch] of Object.entries(ARCHETYPES)) {
        let score = 0;
        for (const [signal, weight] of Object.entries(arch.signals || {})) {
            score += (tally[signal] || 0) * weight;
        }
        if (score > bestScore) { bestScore = score; best = { ...arch, key }; }
    }
    return best || { ...ARCHETYPES.innovator, key: 'innovator' };
}

// === BUILD MINI BOAT ===
function buildMiniBoat(data, size = 60) {
    const colors = {
        hull: data.hullColor || '#4a3728',
        keel: data.keelColor || '#3a2a1e',
        sail: data.sailColor || '#f5f0e8',
        sailGradient: data.sailGradient || null,
        flag: data.flagColor || '#FFE200',
        mast: '#3d2b1a',
    };
    let svg = buildOrigamiSVG(colors, 8, size, {
        aspiration: data.aspiration,
        flagIcon: data.flagIcon,
        marks: data.marks || [],
    });
    // Strip the washi feTurbulence filter for fleet boats. The paper grain is
    // imperceptible at 34–80px, but 100+ turbulence filters (one per boat,
    // each bobbing) would cripple the big screen's frame rate at a full house.
    // The phone keeps the full texture on its single hero boat.
    svg = svg.replace(/<filter id="washiTex"[\s\S]*?<\/filter>/g, '')
             .replace(/filter="url\(#washiTex\)"/g, '');
    return svg;
}

// === ARCHETYPE DISTRIBUTION BAR ===
function updateDistributionBar() {
    if (!distBarEl) return;
    const total = Object.values(archetypeCounts).reduce((a, b) => a + b, 0);
    if (total === 0) { distBarEl.innerHTML = ''; return; }

    const entries = Object.entries(ARCHETYPES).map(([key, arch]) => ({
        key, name: arch.name, color: arch.color || '#D4A843',
        count: archetypeCounts[key] || 0,
    })).filter(e => e.count > 0).sort((a, b) => b.count - a.count);

    distBarEl.innerHTML = entries.map(e => {
        const pct = ((e.count / total) * 100).toFixed(0);
        return `<div class="dist-row">
            <span class="dist-label" style="color:${e.color};">${e.name.replace('The ', '')}</span>
            <div class="dist-track"><div class="dist-fill" style="width:${pct}%; background:${e.color};"></div></div>
            <span class="dist-count">${e.count}</span>
        </div>`;
    }).join('');
}

// === MILESTONE CELEBRATIONS ===
const MILESTONES = [10, 25, 50, 100, 200, 500];
let lastMilestone = 0;
function checkMilestone(count) {
    const hit = MILESTONES.filter(m => m <= count && m > lastMilestone);
    if (hit.length === 0) return;
    lastMilestone = Math.max(...hit);
    showMilestone(lastMilestone);
}

function showMilestone(n) {
    const el = document.createElement('div');
    el.className = 'milestone-flash';
    el.innerHTML = `<span class="milestone-number">${n}</span><span class="milestone-text">boats in the fleet!</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// === PLACE A BOAT ON THE OCEAN ===
function placeBoat(data) {
    if (boatElements.has(data.uid)) return;

    const archetype = computeArchetypeForData(data);
    data._archetype = archetype;

    // Track archetype distribution
    archetypeCounts[archetype.key] = (archetypeCounts[archetype.key] || 0) + 1;
    updateDistributionBar();

    const el = document.createElement('div');
    el.className = 'fleet-boat boat-enter';

    const areaW = fleetArea.clientWidth;
    const areaH = fleetArea.clientHeight;
    // Depth: 0 = far (near the horizon, small & faint), 1 = near (foreground, big & bright)
    const depth = Math.random();
    const yTop = areaH * 0.28, yBot = areaH * 0.86;
    const y = yTop + depth * (yBot - yTop);
    const x = areaW * 0.06 + Math.random() * (areaW * 0.88);
    const size = 34 + depth * 46;
    const bobDelay = Math.random() * 4;

    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.opacity = (0.72 + depth * 0.28).toFixed(2);
    el.style.zIndex = String(10 + Math.round(depth * 100));
    el.style.animationDelay = (Math.random() * 0.5) + 's';

    el.innerHTML = buildMiniBoat(data, size);
    el.dataset.uid = data.uid;

    // Colour glow matching archetype
    el.style.filter = `drop-shadow(0 0 ${4 + depth * 8}px ${archetype.color || '#D4A843'})`;

    // Golden wake ripple at the arrival point
    const wake = document.createElement('div');
    wake.className = 'boat-wake';
    wake.style.left = (x + size / 2) + 'px';
    wake.style.top  = (y + size * 0.7) + 'px';
    fleetArea.appendChild(wake);
    setTimeout(() => wake.remove(), 1700);

    el.addEventListener('animationend', () => {
        el.classList.remove('boat-enter');
        el.style.animationDelay = bobDelay + 's';
    }, { once: true });

    el.addEventListener('click', () => showSpotlight(data));
    fleetArea.appendChild(el);
    boatElements.set(data.uid, el);

    const count = boatElements.size;
    boatCountEl.textContent = count;

    // Arrival chime
    playArrivalChime();

    // Milestone check
    checkMilestone(count);

    // Celebrate the arrival WITHOUT covering the fleet. A full-screen modal on
    // every boat would blanket the sea at a busy open house; instead we draw a
    // golden halo on the actual boat and slide a lower-third ribbon
    // ("Now setting sail — <Archetype> · <ASPIRATION>") that echoes the phone's
    // parting line, "your boat is joining the fleet." A manual click still opens
    // the rich modal spotlight below.
    if (autoSpotlightEnabled) {
        featureBoatInPlace(el);
        enqueueRibbon(data, archetype);
    }
}

// === IN-PLACE FEATURE: halo the newest boat on the sea ===
function featureBoatInPlace(el) {
    if (!el) return;
    const z0 = el.style.zIndex;
    el.classList.add('featured');
    el.style.zIndex = '150';
    setTimeout(() => { el.classList.remove('featured'); el.style.zIndex = z0; }, 3600);
}

// === ARRIVAL RIBBON (lower third, non-blocking, burst-tolerant) ===
const ribbonQueue = [];
let ribbonActive = false;
function enqueueRibbon(data, archetype) {
    ribbonQueue.push({ data, archetype });
    // Under a burst, keep only the most recent few so the ribbon never lags
    // far behind the sea; the count badge shows how many are still queued.
    if (ribbonQueue.length > 4) ribbonQueue.splice(0, ribbonQueue.length - 4);
    pumpRibbon();
}
function pumpRibbon() {
    if (ribbonActive || ribbonQueue.length === 0) return;
    ribbonActive = true;
    const { data, archetype } = ribbonQueue.shift();
    renderRibbon(data, archetype);
}
function renderRibbon(data, archetype) {
    const ac = archetype.color || '#FFE200';
    const waiting = ribbonQueue.length;
    const el = document.createElement('div');
    el.className = 'arrival-ribbon';
    el.innerHTML = `
        <div class="ribbon-boat">${buildMiniBoat(data, 46)}</div>
        <div class="ribbon-text">
            <span class="ribbon-kicker">Now setting sail</span>
            <span class="ribbon-name" style="color:${ac};">${archetype.name}</span>
            <span class="ribbon-asp">${(data.aspiration || 'VOYAGER').toUpperCase()}</span>
        </div>
        ${waiting > 0 ? `<div class="ribbon-more">+${waiting}</div>` : ''}`;
    document.body.appendChild(el);
    // Move faster when boats are backed up so the ribbon keeps pace with arrivals
    const dwell = waiting > 0 ? 1500 : 3200;
    setTimeout(() => {
        el.classList.add('ribbon-out');
        setTimeout(() => { el.remove(); ribbonActive = false; pumpRibbon(); }, 440);
    }, dwell);
}

// === SPOTLIGHT (RICH) ===
window.closeSpotlight = function() {
    spotlightEl.style.display = 'none';
};

function showSpotlight(data) {
    const archetype = data._archetype || computeArchetypeForData(data);
    const ac = archetype.color || '#D4A843';

    // Resolve choice labels
    function choiceLabel(labelMap, key) {
        if (!key) return '\u2014';
        return labelMap[key] || key;
    }

    spotlightCardEl.innerHTML = `
        <div class="mb-4">${buildMiniBoat(data, 120)}</div>
        <h2 class="text-2xl font-black mb-1" style="color:${ac};">${archetype.name}</h2>
        <p class="text-xs uppercase tracking-widest mb-1" style="color:${ac}; opacity:0.7;">${(data.aspiration || 'VOYAGER').toUpperCase()}</p>
        <p class="text-gray-400 text-xs font-serif italic mb-4 max-w-xs mx-auto">${archetype.quote}</p>
        <div class="text-left space-y-2 text-sm">
            <div class="flex items-center gap-2">
                <span style="color:var(--bty-yellow);" class="font-black">S</span>
                <span class="text-gray-300">${choiceLabel(LABELS.stewardship, data.stewardshipChoice ?? data.stewardshipPick1)}</span>
            </div>
            <div class="flex items-center gap-2">
                <span style="color:var(--bty-yellow);" class="font-black">A</span>
                <span class="text-gray-300">${choiceLabel(LABELS.applied, data.appliedChoice ?? data.appliedPick1)}</span>
            </div>
            <div class="flex items-center gap-2">
                <span style="color:var(--bty-yellow);" class="font-black">I</span>
                <span class="text-gray-300">${choiceLabel(LABELS.international, data.internationalChoice ?? data.internationalPick1)}</span>
            </div>
            <div class="flex items-center gap-2">
                <span style="color:var(--bty-yellow);" class="font-black">L</span>
                <span class="text-gray-300">${choiceLabel(LABELS.learning, data.learningChoice ?? data.learningPick1)}</span>
            </div>
        </div>
        <button onclick="closeSpotlight()" class="mt-6 px-6 py-2 font-bold rounded-xl text-sm" style="background:${ac}; color:#0f172a;">Close</button>
    `;
    spotlightEl.style.display = 'flex';
}

// === LISTEN TO FIREBASE (invoked from the dynamic-import block once ready) ===
function startFleetListener() {
    if (!db || !onSnapshot) return;
    onSnapshot(collection(db, "x_boats"), (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
                const data = { uid: change.doc.id, ...change.doc.data() };
                boats.set(data.uid, data);
                if (data.aspiration) placeBoat(data);
            }
        });
    }, (err) => console.warn("Fleet listener error:", err));
}

// === CONNECTION NOTICE (only if live sync can't load) ===
function showConnectionNotice() {
    if (document.getElementById('connNotice')) return;
    const el = document.createElement('div');
    el.id = 'connNotice';
    el.className = 'conn-notice';
    el.innerHTML = 'Live sync offline · press <b>D</b> for demo';
    document.body.appendChild(el);
}

// === TOGGLE AUTO-SPOTLIGHT: press 'a' ===
document.addEventListener('keydown', (e) => {
    if (e.key === 'a') {
        autoSpotlightEnabled = !autoSpotlightEnabled;
        showToast(autoSpotlightEnabled ? 'Arrival ribbons ON' : 'Arrival ribbons OFF');
    }
});

// === DEMO MODE: press 'd' to spawn a test boat ===
document.addEventListener('keydown', (e) => {
    if (e.key !== 'd') return;
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

    placeBoat({
        uid: 'demo_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        hullColor: r(['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6']),
        keelColor: r(['#3b82f6', '#f59e0b', '#ef4444', '#10b981']),
        sailColor: r(['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']),
        sailGradient: r([['#3b82f6', '#60a5fa'], ['#ec4899', '#f9a8d4'], ['#10b981', '#6ee7b7'], ['#f59e0b', '#fcd34d']]),
        flagColor: r(['#3b82f6', '#ef4444', '#ec4899', '#10b981', '#FFE200']),
        aspiration: r(['COURAGE', 'DREAM', 'INNOVATE', 'LEAD', 'CREATE', 'EXPLORE', 'INSPIRE', 'SERVE', 'DISCOVER', 'BUILD']),
        stewardshipChoice: r(['model', 'inspire', 'challenge', 'enable', 'encourage']),
        appliedChoice: r(['ai', 'green', 'robotics', 'creative']),
        internationalChoice: r(['korea', 'japan', 'nz', 'estonia']),
        learningChoice: r(['discipline', 'resilience', 'empathy', 'adaptability', 'mindfulness']),
        flagIcon: r(['\u2693', '\uD83D\uDD25', '\uD83D\uDC99', '\uD83C\uDF0A', '\uD83E\uDDD8']),
        marks: [],
    });
});

// === TOAST HELPER ===
function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'presenter-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}
