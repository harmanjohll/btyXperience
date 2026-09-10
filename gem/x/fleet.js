/* === Beatty SAIL — Presenter (Fleet View) Logic v2 ===
   Rich spotlight, archetype distribution, arrival chime, milestones.
*/

import { buildOrigamiSVG, FIREBASE_CONFIG, LABELS, ARCHETYPES, SAIL_DATA } from './boat.js';

// === FIREBASE (dynamic import) ===
// A static firebase import would kill the whole module — and blank the big
// screen — if the venue network blocks or throttles the gstatic CDN. Load it
// off the critical path instead: the ocean scene renders immediately, boats
// stream in once live sync connects, and demo mode ('D') works either way.
let initializeApp, getFirestore, collection, onSnapshot, doc, setDoc, serverTimestamp, getAuth, signInAnonymously;
let db, auth;
(async () => {
    try {
        const [a, fs, au] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
        ]);
        initializeApp = a.initializeApp;
        ({ getFirestore, collection, onSnapshot, doc, setDoc, serverTimestamp } = fs);
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
// Finale mode: the fleet keeps sailing beneath the honeycomb; boats sit low and each
// releases a gold bee-dot that rises into the sky — the word leaving the hull.
const FINALE = new URLSearchParams(location.search).has('finale');
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
    if (releaseAt) return;   // the launch has its own number; no milestone flashes over it
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

// === EVEN HORIZONTAL SPREAD ===
const FLEET_ZONES = 7;
const zoneCounts = new Array(FLEET_ZONES).fill(0);
function leastPopulatedZone() {
    const min = Math.min(...zoneCounts);
    const candidates = [];
    for (let i = 0; i < FLEET_ZONES; i++) if (zoneCounts[i] === min) candidates.push(i);
    const z = candidates[Math.floor(Math.random() * candidates.length)];
    zoneCounts[z]++;
    return z;
}

// === PLACE A BOAT ON THE OCEAN ===
function placeBoat(data) {
    if (boatElements.has(data.uid)) return;

    // First boat clears the "waiting" hint
    const hint = document.getElementById('fleetHint');
    if (hint) hint.remove();

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
    const yTop = areaH * (FINALE ? 0.60 : 0.28), yBot = areaH * 0.88;
    const y = yTop + depth * (yBot - yTop);
    // Spread evenly: place each boat in the least-populated horizontal zone,
    // jittered. Pure random clusters lopsidedly when only a few boats are on
    // screen (very visible at the start of the event); zoning keeps the sea
    // balanced from the first boat.
    const zone = leastPopulatedZone();
    const zoneW = (areaW * 0.88) / FLEET_ZONES;
    const x = areaW * 0.06 + zone * zoneW + Math.random() * zoneW * 0.86;
    const size = 34 + depth * 46;
    const bobDelay = Math.random() * 4;

    el.style.left = x + 'px';
    el.style.setProperty('--gx', (x / areaW).toFixed(2));   // gust stagger, left → right
    el.style.top  = y + 'px';
    el.style.opacity = (0.72 + depth * 0.28).toFixed(2);
    el.style.zIndex = String(10 + Math.round(depth * 100));
    el.style.animationDelay = (Math.random() * 0.5) + 's';

    el.innerHTML = buildMiniBoat(data, size);
    el.dataset.uid = data.uid;
    el.dataset.size = size;
    el.dataset.glow = (4 + depth * 8).toFixed(1);

    // Glow in the boat's own sail colour — identity you can see from the back row
    el.style.filter = `drop-shadow(0 0 ${4 + depth * 8}px ${data.sailColor || '#FFE200'})`;

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

    el.onclick = () => showSpotlight(data);
    fleetArea.appendChild(el);
    boatElements.set(data.uid, el);

    const count = boatElements.size;
    boatCountEl.textContent = count;
    // Stragglers tick the big number up after the waves have landed.
    if (released && !FINALE) { const big = document.getElementById('fleetBig'); if (big && big.classList.contains('sailing')) { big.dataset.n = count; big.innerHTML = `<span class="fb-n">${count}</span><span class="fb-l">${count === 1 ? 'boat' : 'boats'} set sail</span>`; } }
    if (FINALE) setTimeout(() => riseBeeDot(x + size / 2, y + size * 0.35), 700 + Math.random() * 1100);

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
    // …but not while a wave is landing: 200 ribbons would blanket the sea.
    if (autoSpotlightEnabled && !FINALE && !(releaseAt && Date.now() < releaseAt + 3000)) {
        featureBoatInPlace(el);
        enqueueRibbon(data, archetype);
    }
}

// === REPAINT A BOAT IN PLACE (its dream or colours arrived, or changed) ===
function updateBoat(data) {
    const el = boatElements.get(data.uid); if (!el) return;
    const size = parseFloat(el.dataset.size) || 60;
    data._archetype = computeArchetypeForData(data);
    el.innerHTML = buildMiniBoat(data, size);
    el.style.filter = `drop-shadow(0 0 ${parseFloat(el.dataset.glow) || 8}px ${data.sailColor || '#FFE200'})`;
    el.onclick = () => showSpotlight(data);
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
    const ac = data.sailColor || '#FFE200';
    const waiting = ribbonQueue.length;
    const el = document.createElement('div');
    el.className = 'arrival-ribbon';
    el.innerHTML = `
        <div class="ribbon-boat">${buildMiniBoat(data, 46)}</div>
        <div class="ribbon-text">
            <span class="ribbon-kicker">Now setting sail</span>
            <span class="ribbon-name" style="color:${ac};">${data.aspiration ? data.aspiration.toUpperCase() : 'A BEATTYIAN'}</span>
            <span class="ribbon-asp">${data.global?.text || data.local?.text || 'From our Hive'}</span>
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
    startSessionListener();
    onSnapshot(collection(db, "x_boats"), (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
                onBoatDoc({ uid: change.doc.id, ...change.doc.data() });
            }
        });
    }, (err) => console.warn("Fleet listener error:", err));
    showWaitingHint();
}

// ============================================================
//   THE COLLECTIVE SET SAIL — harbour · cue · waves · gust · roll call
//   Phones write their boat when they reach the ready gate (launched:false):
//   the harbour fills and the screen counts "N boats ready". The presenter's
//   cue names a server time; at that instant the harbour releases in three
//   waves (so the eye sees it grow), a gust ripples every sail, the number
//   lands large, and the roll call spotlights each destination in turn.
// ============================================================
const harbour = new Map();
let released = FINALE, releaseAt = 0;   // in the finale everyone has already sailed
let stragglers = [], stragglerTimer = null;
let handledCueId = null, uncuedTimer = null;
let fleetOffset = 0; const fleetSamples = []; let lastSts = null;
const DEST_ROLL = [
    { id:'GeoBali', name:'Bali', col:'#F28C28' }, { id:'NZ', name:'New Zealand', col:'#2BB3A8' }, { id:'Korea', name:'South Korea', col:'#D64FA0' },
    { id:'MiharaJapan', name:'Mihara, Japan', col:'#EC5A5F' }, { id:'MutsuzawaJapan', name:'Mutsuzawa, Japan', col:'#B5D334' }, { id:'Estonia', name:'Estonia', col:'#7FD3F7' },
];
function startSessionListener() {
    if (!db || !onSnapshot || !doc) return;
    try {
        onSnapshot(doc(db, "session", "state"), (snap) => {
            const d = (snap && snap.data) ? snap.data() : null; if (!d) return;
            // Clock: the presenter stamps every write with a server timestamp; on the
            // presenter's own machine it lands fast — assume ~120 ms in flight.
            const sts = typeof d.sts === 'number' ? d.sts : (d.sts && typeof d.sts.toMillis === 'function' ? d.sts.toMillis() : null);
            if (sts != null && sts !== lastSts) {
                lastSts = sts; fleetSamples.push(Date.now() - sts - 120); if (fleetSamples.length > 5) fleetSamples.shift();
                const a = [...fleetSamples].sort((x, y) => x - y); fleetOffset = a[Math.floor(a.length / 2)];
            }
            if (d.cue && d.cue.kind === 'sail' && d.cue.id !== handledCueId) { handledCueId = d.cue.id; scheduleRelease(d.cue.at + fleetOffset); }
            // Safety: on the fleet slide with no cue for a long while, release anyway.
            if (d.currentView === 'fleet' && !released && !releaseAt && !uncuedTimer) {
                uncuedTimer = setTimeout(() => { if (!released && !releaseAt) scheduleRelease(Date.now() + 1000); }, 25000);
            }
        }, () => {});
    } catch (e) {}
}
function onBoatDoc(data) {
    boats.set(data.uid, data);
    if (boatElements.has(data.uid)) { updateBoat(data); return; }               // repaint in place
    if (!data.launched && !released) { harbour.set(data.uid, data); updateReadyCount(); return; }
    if (releaseAt && Date.now() < releaseAt + 2600) {                              // arrived mid-launch → next wave
        stragglers.push(data); clearTimeout(stragglerTimer);
        stragglerTimer = setTimeout(flushStragglers, Math.max(50, (releaseAt + 2700) - Date.now())); return;
    }
    placeBoat(data);
}
function flushStragglers() { const q = stragglers; stragglers = []; q.forEach((d, i) => setTimeout(() => placeBoat(d), i * 120)); }
function bigEl() {
    let el = document.getElementById('fleetBig');
    if (!el) { el = document.createElement('div'); el.id = 'fleetBig'; el.className = 'fleet-big'; document.body.appendChild(el); }
    return el;
}
function updateReadyCount() {
    if (released) return;
    const el = bigEl(); el.className = 'fleet-big ready';
    el.innerHTML = `<span class="fb-n">${harbour.size}</span><span class="fb-l">${harbour.size === 1 ? 'boat' : 'boats'} ready</span>`;
    const hint = document.getElementById('fleetHint'); if (hint && harbour.size > 0) hint.remove();
}
function scheduleRelease(localAt) {
    if (released || releaseAt) return;
    releaseAt = localAt; clearTimeout(uncuedTimer);
    const t0 = Math.max(0, localAt - Date.now());
    setTimeout(() => document.body.classList.add('countdown'), Math.max(0, t0 - 8000));
    [[600, 0.4], [1300, 0.5], [2000, 1]].forEach(([dt, frac], i, arr) => setTimeout(() => releaseWave(frac, i === arr.length - 1), t0 + dt));
    setTimeout(() => document.body.classList.remove('countdown'), t0 + 500);
    setTimeout(() => { gust(); setInterval(gust, 8000); }, t0 + 4000);
    DEST_ROLL.forEach((d, i) => setTimeout(() => rollCall(d, i === DEST_ROLL.length - 1), t0 + 12000 + i * 3000));
    setTimeout(() => bigEl().classList.add('fade'), t0 + 40000);
}
function releaseWave(frac, last) {
    const pool = [...harbour.values()];
    if (last) released = true;
    const n = last ? pool.length : Math.ceil(pool.length * frac);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }   // a wave is a spread of the room
    pool.slice(0, n).forEach((d, i) => { harbour.delete(d.uid); setTimeout(() => placeBoat(d), i * 45); });
    showBigCount(n);
}
function showBigCount(justReleased) {
    const el = bigEl(); el.className = 'fleet-big sailing';
    const target = boatElements.size + (justReleased || 0);
    const from = parseInt(el.dataset.n || '0', 10) || 0;
    const t0 = performance.now(), dur = 1400;
    (function tick(now) {
        const p = Math.min(1, (now - t0) / dur); const v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
        el.innerHTML = `<span class="fb-n">${v}</span><span class="fb-l">${v === 1 ? 'boat' : 'boats'} set sail</span>`; el.dataset.n = v;
        if (p < 1) requestAnimationFrame(tick);
    })(t0);
}
function gust() { fleetArea.classList.remove('gust'); void fleetArea.offsetWidth; fleetArea.classList.add('gust'); }
function rollCall(dest, last) {
    let cap = document.getElementById('fleetCall');
    if (!cap) { cap = document.createElement('div'); cap.id = 'fleetCall'; cap.className = 'fleet-call'; document.body.appendChild(cap); }
    cap.innerHTML = `<span class="fc-swatch" style="background:${dest.col};color:${dest.col}"></span>${dest.name} — <em>wave!</em>`;
    cap.classList.remove('pop', 'out'); void cap.offsetWidth; cap.classList.add('pop');
    boatElements.forEach((el, uid) => { const d = boats.get(uid); el.classList.toggle('called', !!(d && d.global && d.global.id === dest.id)); });
    setTimeout(() => { boatElements.forEach(el => el.classList.remove('called')); if (last) cap.classList.add('out'); }, 2800);
}
// Rehearsal without a presenter: S releases the harbour on an 8-second count.
document.addEventListener('keydown', (e) => { if ((e.key === 's' || e.key === 'S') && !releaseAt && !e.target.closest('input,textarea')) scheduleRelease(Date.now() + 8000); });

// === FINALE: a bee-dot rises from the hull into the honeycomb sky ===
function riseBeeDot(x, y) {
    const d = document.createElement('div'); d.className = 'bee-dot';
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.setProperty('--drift', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
    fleetArea.appendChild(d); setTimeout(() => d.remove(), 2800);
}

// === WAITING HINT (live, but no boats yet) ===
function showWaitingHint() {
    if (document.getElementById('fleetHint') || boatElements.size > 0) return;
    const el = document.createElement('div');
    el.id = 'fleetHint';
    el.className = 'fleet-hint';
    el.innerHTML = `<span class="fleet-hint-dot"></span>Waiting for the first boat to set sail…`;
    document.body.appendChild(el);
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

// === DEMO MODE: press 'd' (or ?demo=N) to spawn test boats ===
function spawnDemoBoat() {
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
}
document.addEventListener('keydown', (e) => { if (e.key === 'd') spawnDemoBoat(); });

// ?demo=N pre-populates the fleet with N boats \u2014 lets the presenter preview or
// rehearse the fleet scene (inside btx27) without live phones.
(function () {
    const n = parseInt(new URLSearchParams(location.search).get('demo') || '0', 10);
    if (!n) return;
    let i = 0;
    const iv = setInterval(() => { spawnDemoBoat(); if (++i >= n) clearInterval(iv); }, 240);
})();

// === PRESENTER BEATS: broadcast the session cue to every phone ===
function broadcastBeat(beat) {
    if (!db || !setDoc || !doc) { showToast('Live sync not ready'); return; }
    try { setDoc(doc(db, "x_session", "state"), { beat, ts: serverTimestamp ? serverTimestamp() : Date.now() }); }
    catch (e) { console.warn("Beat broadcast failed:", e); }
}

// 'S' calls the collective Set Sail \u2014 every phone waiting at its ready-gate
// launches at once and floods the fleet. 'G' resets the room to "gather".
document.addEventListener('keydown', (e) => {
    if (e.key === 's' || e.key === 'S') { broadcastBeat('set_sail'); showSetSailFlourish(); }
    else if (e.key === 'g' || e.key === 'G') { broadcastBeat('gather'); showToast('Room reset \u2014 gathering'); }
});

// === SET SAIL FLOURISH \u2014 a full-width call across the fleet ===
function showSetSailFlourish() {
    if (document.getElementById('setSailFlourish')) return;
    const el = document.createElement('div');
    el.id = 'setSailFlourish';
    el.className = 'set-sail-flourish';
    el.innerHTML = `<div class="ssf-inner"><span class="ssf-emoji">\u26F5</span><span class="ssf-text">Set Sail, Beatty!</span></div>`;
    document.body.appendChild(el);
    playArrivalChime();
    setTimeout(() => { el.classList.add('ssf-out'); setTimeout(() => el.remove(), 700); }, 3200);
}

// === TOAST HELPER ===
function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'presenter-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}
