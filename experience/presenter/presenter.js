/* ═══════════════════════════════════════════════════════════════
   btyXperience — Presenter Module
   Main screen: journey steps, live data, globe, polls, pace control.
   ═══════════════════════════════════════════════════════════════ */

import { JOURNEY_STEPS, ARCHETYPES, ARCHETYPE_NAMES, ARCHETYPE_COLORS, SCHOOL, COLORS,
         EXCHANGE_DATA, INDUSTRY_DATA, GLOBE_DESTINATIONS, LOGO_URL, DREAM_VALUES } from '../shared/data.js';
import { initFirebase, writeSessionState, writePaceConfig, resetSession,
         listenCollection, listenDoc, getDb,
         doc, setDoc, onSnapshot, collection } from '../shared/firebase.js';

// ── STATE ──
let currentStep = 0;
let liveData = { profiles: {}, polls: {}, nexus: {}, aspirations: [] };
let heartbeatInterval = null;
let paceMode = 'audience';
const isPresenter = new URLSearchParams(window.location.search).get('presenter') === 'true';

// ── DOM REFS ──
const journeyContent = document.getElementById('journey-content');
const progressBar = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const footerStatus = document.getElementById('footerStatus');
const participantCount = document.getElementById('participantCount');

// ── INIT ──
async function init() {
    try {
        await initFirebase();
    } catch (e) {
        console.error('Firebase init failed:', e);
        journeyContent.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-400 text-3xl">Firebase connection failed.</p></div>';
        return;
    }

    initListeners();
    setupControls();
    if (isPresenter) setupPresenterPanel();
    updateJourneyStep();
}

// ── FIREBASE LISTENERS ──
function initListeners() {
    // Profiles (archetype distribution)
    listenCollection('profiles', snap => {
        handleSnapshot(snap, 'profiles', 'archetype');
        const total = liveData.profiles?.default?.total || 0;
        participantCount.textContent = `${total} Participants`;
    });

    // Polls
    listenCollection('polls', snap => {
        handleSnapshot(snap, 'polls', 'vote', 'pollId');
    });

    // Nexus votes
    listenCollection('nexusVotes', snap => {
        handleSnapshot(snap, 'nexus', 'nexusId');
        const step = JOURNEY_STEPS[currentStep];
        if (step?.type === 'globe' || step?.type === 'industry_map') {
            setTimeout(() => {
                if (liveData.nexus?.default) updateNexusStats(liveData.nexus.default.breakdown || {});
            }, 50);
        }
    });

    // Aspirations
    listenCollection('aspirations', snap => {
        liveData.aspirations = snap.docs.map(d => d.data().word);
        if (JOURNEY_STEPS[currentStep]?.type === 'finale') updateJourneyStep();
    });

    // Pace sync (non-presenter follows)
    if (!isPresenter) {
        listenDoc('config', 'pace', (data) => {
            if (data && data.mode === 'presenter' && typeof data.step === 'number') {
                if (data.step !== currentStep && data.step >= 0 && data.step < JOURNEY_STEPS.length) {
                    currentStep = data.step;
                    updateJourneyStep();
                }
            }
        });
    }
}

function handleSnapshot(snapshot, dataType, property, groupBy = 'default') {
    const results = {};
    snapshot.forEach(d => {
        const data = d.data();
        const key = data[groupBy] || 'default';
        if (!results[key]) results[key] = { total: 0, breakdown: {} };
        results[key].total++;
        if (data[property] !== undefined && data[property] !== null) {
            results[key].breakdown[data[property]] = (results[key].breakdown[data[property]] || 0) + 1;
        }
    });
    liveData[dataType] = results;

    // Live update polls DOM
    const step = JOURNEY_STEPS[currentStep];
    if (step?.type === 'poll' && dataType === 'polls' && results[step.pollData.id]) {
        updatePollDOM(step.pollData.id);
    }
}

// ── CONTROLS ──
function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') nextBtn.click();
        else if (e.key === 'ArrowLeft') prevBtn.click();
    });

    nextBtn.addEventListener('click', () => {
        const step = JOURNEY_STEPS[currentStep];
        if (step.type === 'poll' && !step.revealed) {
            step.revealed = true;
            updateJourneyStep();
            return;
        }
        if (currentStep < JOURNEY_STEPS.length - 1) {
            currentStep++;
            updateJourneyStep();
            syncPace();
        } else {
            renderEndScreen();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            JOURNEY_STEPS[currentStep].revealed = false;
            currentStep--;
            updateJourneyStep();
            syncPace();
        }
    });
}

function syncPace() {
    if (isPresenter && paceMode === 'presenter') {
        writePaceConfig('presenter', currentStep);
    }
}

// ── PRESENTER PANEL ──
function setupPresenterPanel() {
    const panel = document.getElementById('presenterPanel');
    if (!panel) return;
    panel.classList.remove('hidden');

    // Step label
    const stepLabel = document.getElementById('stepLabel');
    function updateLabel() {
        const s = JOURNEY_STEPS[currentStep];
        stepLabel.textContent = `Step ${currentStep + 1}/${JOURNEY_STEPS.length}: ${s?.title || s?.id || '—'}`;
    }
    nextBtn.addEventListener('click', () => setTimeout(updateLabel, 50));
    prevBtn.addEventListener('click', () => setTimeout(updateLabel, 50));
    setTimeout(updateLabel, 100);

    // Pace toggle
    const paceBtn = document.getElementById('paceToggleBtn');
    const paceBadge = document.getElementById('paceBadge');
    paceBtn.addEventListener('click', async () => {
        paceMode = paceMode === 'audience' ? 'presenter' : 'audience';
        paceBtn.textContent = paceMode === 'audience' ? 'Audience Self-Paces' : 'Presenter Controls';
        paceBadge.className = `pace-badge ${paceMode}`;
        paceBadge.textContent = paceMode === 'audience' ? 'Audience Pace' : 'Presenter Pace';
        await writePaceConfig(paceMode, currentStep);
        showToast(paceMode === 'presenter' ? 'Presenter controls the pace' : 'Audience self-paces');
    });

    // QR overlay
    const qrOverlay = document.getElementById('qrOverlay');
    document.getElementById('showQRBtn').addEventListener('click', () => qrOverlay.classList.remove('hidden'));
    qrOverlay.addEventListener('click', () => qrOverlay.classList.add('hidden'));

    // Reset
    const resetModal = document.getElementById('resetModal');
    document.getElementById('resetBtn').addEventListener('click', () => resetModal.classList.remove('hidden'));
    document.getElementById('cancelReset').addEventListener('click', () => resetModal.classList.add('hidden'));
    document.getElementById('confirmReset').addEventListener('click', async () => {
        const input = document.getElementById('resetInput');
        if (input.value !== 'RESET') { showToast('Type RESET to confirm.'); return; }
        try {
            await resetSession();
            resetModal.classList.add('hidden');
            showToast('Session reset! Reloading...');
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            console.error('Reset error:', e);
            showToast('Reset failed. Check console.');
        }
    });
}

// ── JOURNEY STEP RENDER ──
function updateJourneyStep() {
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    if (currentStep >= JOURNEY_STEPS.length) return;

    const step = JOURNEY_STEPS[currentStep];
    footerStatus.textContent = `Step ${currentStep + 1} / ${JOURNEY_STEPS.length}`;

    // Write session state for audience devices
    writeSessionState({
        currentView: step.type,
        pollData: step.pollData || null,
        nexusData: step.nexusData || null,
        title: step.title,
        description: step.description,
        url: step.url || null,
        staticContent: step.type === 'static' ? true : null,
    });

    const contentHTML = renderContent(step);
    let wrapperClass = 'text-center fade-in h-full flex flex-col justify-center items-center w-full';
    let titleHTML = step.title ? `<h2 class="text-5xl lg:text-7xl font-black bty-text-yellow mb-6 drop-shadow-md">${step.title}</h2>` : '';
    let descHTML = step.description ? `<p class="text-3xl text-gray-200 max-w-7xl mx-auto mb-10 leading-relaxed">${step.description}</p>` : '';

    if (step.type === 'slide' || step.type === 'video' || step.type === 'globe' || step.type === 'industry_map') {
        wrapperClass = 'w-full h-full p-0 m-0 fade-in';
        titleHTML = ''; descHTML = '';
    }

    if (contentHTML) {
        journeyContent.innerHTML = `<div class="${wrapperClass}">${titleHTML}${descHTML}<div class="flex-grow w-full h-full">${contentHTML}</div></div>`;
    }

    // DREAM flip cards (btx26 structure: container > card toggles is-flipped)
    if (step.id === 'values') {
        journeyContent.querySelectorAll('.dream-card-container').forEach(container => {
            container.addEventListener('click', () => {
                container.querySelector('.dream-card').classList.toggle('is-flipped');
            });
        });
    }

    // Poll heartbeat
    if (step.type === 'poll') {
        heartbeatInterval = setInterval(() => {
            if (journeyContent.querySelector(`[data-poll-id="${step.pollData.id}"]`)) {
                updatePollDOM(step.pollData.id);
            }
        }, 500);
    }

    // Progress bar
    progressBar.style.width = `${((currentStep + 1) / JOURNEY_STEPS.length) * 100}%`;
    prevBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';

    let btnText = 'Next';
    if (step.type === 'poll' && !step.revealed) btnText = 'Reveal Answer';
    else if (currentStep === JOURNEY_STEPS.length - 1) btnText = 'Finish';
    nextBtn.textContent = btnText;
}

// ── CONTENT RENDERERS ──
function renderContent(step) {
    switch (step.type) {
        case 'chart':   return renderCompassChart(liveData.profiles?.default);
        case 'poll':    return renderPollChart(step.pollData, liveData.polls[step.pollData.id], step.revealed);
        case 'globe':   return renderGlobe(liveData.nexus);
        case 'industry_map': return renderIndustryMap(step.localData, liveData.nexus);
        case 'finale':  return renderWordCloud(liveData.aspirations);
        case 'memento': return '<div class="text-center h-full flex flex-col justify-center items-center"><p class="text-9xl mb-8">📱</p><p class="text-6xl font-bold bty-text-yellow animate-pulse">Check your phone!</p></div>';
        case 'static':  return step.content === 'dream_values' ? renderDreamValues() : step.content;
        case 'video':   return `<div class="w-full h-full flex items-center justify-center bg-black"><iframe class="w-full h-full" src="${step.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
        case 'slide':   return `<div class="w-full h-full bg-black"><iframe src="${step.url}" frameborder="0" width="100%" height="100%" allowfullscreen></iframe></div>`;
        default: return '';
    }
}

function renderDreamValues() {
    return `<div class="grid grid-cols-5 gap-0 w-full max-w-[95vw] mx-auto h-[70vh]">
        ${DREAM_VALUES.map(v => `
        <div class="dream-card-container">
            <div class="dream-card">
                <div class="dream-card-front">
                    <div class="dream-bg" style="background-image: url('${v.img}')"></div>
                    <div class="relative z-10 text-center p-2">
                        <h3 class="text-8xl font-black bty-text-yellow drop-shadow-lg">${v.name.charAt(0)}</h3>
                        <p class="mt-2 text-3xl font-bold text-white drop-shadow-md">${v.name}</p>
                    </div>
                </div>
                <div class="dream-card-back">
                    <h4 class="text-4xl font-bold bty-text-yellow mb-8">${v.name}</h4>
                    <ul class="text-2xl space-y-6 text-left list-disc pl-8">${v.points.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
            </div>
        </div>`).join('')}
    </div>`;
}

function renderCompassChart(data) {
    const total = data?.total || 0;
    if (total === 0) return '<div class="h-full flex items-center justify-center"><p class="text-gray-400 text-4xl animate-pulse">Waiting for results...</p></div>';

    return `<div class="h-full flex flex-col justify-center w-full max-w-[80vw] mx-auto py-8"><div class="space-y-6 w-full">${ARCHETYPE_NAMES.map((name, i) => {
        const count = data.breakdown?.[name] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return `<div class="text-left"><div class="flex justify-between items-end mb-1"><span class="font-bold text-3xl text-white truncate mr-4">${name}</span><span class="text-2xl font-mono text-gray-300">${count}</span></div><div class="w-full bg-gray-700/50 rounded-full h-14 backdrop-blur"><div class="chart-bar text-right pr-6 font-bold text-3xl text-white leading-[3.5rem] rounded-full shadow-lg" style="width: ${pct}%; background-color: ${ARCHETYPE_COLORS[i]}; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${pct.toFixed(0)}%</div></div></div>`;
    }).join('')}</div></div>`;
}

function renderPollChart(pollData, data, isRevealed = false) {
    const total = data?.total || 0;
    let html = `<div data-poll-id="${pollData.id}" class="h-full flex flex-col justify-center max-w-[90vw] mx-auto w-full">`;
    html += `<div class="flex justify-between items-start mb-12"><h2 class="text-6xl font-black leading-tight w-3/4">${pollData.question}</h2><div class="text-right font-bold text-4xl bty-text-yellow total-votes-display bg-white/10 px-6 py-4 rounded-xl">Votes: ${total}</div></div>`;
    html += `<div class="space-y-8 w-full">${pollData.options.map((opt, i) => {
        const count = data?.breakdown?.[i] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const isCorrect = i === pollData.correctAnswer;
        const wrapperClass = isCorrect && isRevealed ? 'correct-answer-box' : 'border-4 border-transparent p-4';
        return `<div class="${wrapperClass} transition-all duration-500" data-option-index="${i}"><div class="text-left"><div class="flex justify-between items-end mb-4"><span class="font-bold text-4xl text-white">${opt} ${isCorrect && isRevealed ? '✓' : ''}</span><span class="text-3xl font-mono vote-count text-gray-300">${count}</span></div><div class="w-full bg-gray-700/50 rounded-full h-20 backdrop-blur"><div class="chart-bar text-center font-black text-4xl text-blue-900 leading-[5rem] rounded-full shadow-lg" style="width: ${pct}%; background-color: ${isCorrect && isRevealed ? 'var(--bty-yellow)' : '#A0AEC0'};">${pct.toFixed(0)}%</div></div></div></div>`;
    }).join('')}</div>`;
    if (total === 0 && !isRevealed) html += '<div class="flex justify-center mt-12"><p class="text-gray-400 text-3xl animate-pulse">Waiting for votes...</p></div>';
    html += '</div>';
    return html;
}

function updatePollDOM(pollId) {
    const data = liveData.polls[pollId];
    const total = data?.total || 0;
    const container = journeyContent.querySelector(`[data-poll-id="${pollId}"]`);
    if (!container) return;

    const totalEl = container.querySelector('.total-votes-display');
    if (totalEl) totalEl.textContent = `Votes: ${total}`;

    const step = JOURNEY_STEPS.find(s => s.pollData?.id === pollId);
    if (!step?.pollData) return;

    step.pollData.options.forEach((_, i) => {
        const count = data?.breakdown?.[i] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const wrapper = container.querySelector(`[data-option-index='${i}']`);
        if (wrapper) {
            const voteEl = wrapper.querySelector('.vote-count');
            const barEl = wrapper.querySelector('.chart-bar');
            if (voteEl) voteEl.textContent = `${count}`;
            if (barEl) {
                const cur = parseFloat(barEl.style.width) || 0;
                if (Math.abs(cur - pct) > 0.1) barEl.style.width = `${pct}%`;
                barEl.textContent = `${pct.toFixed(0)}%`;
            }
        }
    });
}

function updateNexusStats(breakdown) {
    const container = document.getElementById('nexus-stats-container');
    if (!container) return;
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const step = JOURNEY_STEPS[currentStep];
    let options = [];
    if (step.type === 'globe') options = step.nexusData.options;
    else if (step.type === 'industry_map') options = step.nexusData.options;

    let html = `<h3 class="text-3xl font-black bty-text-yellow mb-8">Live Results (${total})</h3><div class="space-y-6">`;
    options.forEach(opt => {
        const count = breakdown[opt.id] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        html += `<div><div class="flex justify-between text-xl mb-2 text-white font-bold"><span>${opt.text}</span><span>${count}</span></div><div class="w-full bg-gray-700 rounded-full h-6"><div class="bg-blue-500 h-6 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style="width: ${pct}%"></div></div></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ── WORD CLOUD ──
function renderWordCloud(words = []) {
    const cloudHTML = '<div id="word-cloud-container" class="relative w-full h-full overflow-hidden bg-black/20"></div>';
    setTimeout(() => {
        const cloud = document.getElementById('word-cloud-container');
        if (!cloud) return;
        cloud.innerHTML = '';
        const unique = [...new Set(words)];
        if (unique.length === 0) {
            cloud.innerHTML = '<div class="flex h-full items-center justify-center text-gray-500 text-5xl">Waiting for aspirations...</div>';
            return;
        }
        let angle = Math.random() * Math.PI * 2;
        let radius = 50;
        const inc = unique.length > 1 ? 600 / unique.length : 0;
        unique.forEach(word => {
            const el = document.createElement('span');
            el.className = 'word absolute font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(255,255,0,0.5)]';
            el.textContent = word;
            const x = Math.max(5, Math.min(95, 50 + radius * Math.cos(angle)));
            const y = Math.max(5, Math.min(95, 50 + radius * Math.sin(angle)));
            el.style.left = `${x}%`; el.style.top = `${y}%`;
            el.style.transform = `translate(-50%, -50%) scale(1) rotate(${Math.random() * 30 - 15}deg)`;
            el.style.fontSize = `${40 + Math.random() * 80}px`;
            el.style.opacity = '1';
            cloud.appendChild(el);
            angle += (Math.PI * 2) / unique.length * (0.8 + Math.random() * 0.4);
            radius += inc;
        });
    }, 100);
    return cloudHTML;
}

// ── 3D GLOBE ──
let globe, scene, camera, renderer, animationFrameId;
let isSpinning = true;
const globePinsData = [];

function renderGlobe(data = {}) {
    setTimeout(() => initGlobe(data), 50);
    return `
    <div class="flex h-full w-full gap-0">
        <div class="w-2/3 h-full relative bg-black/30 overflow-hidden border-r border-white/10">
            <div id="globe-container" class="w-full h-full"><div id="globe-pins-container"></div></div>
            <div class="globe-controls">
                <button id="spinBtn" class="globe-btn hover:bg-blue-900/90 transition-colors shadow-lg">Stop Spin</button>
            </div>
        </div>
        <div class="w-1/3 h-full bg-gray-800/90 backdrop-blur-xl p-8 overflow-y-auto shadow-2xl">
            <div id="nexus-stats-container"><p class="text-gray-400 animate-pulse text-xl">Waiting for selections...</p></div>
        </div>
    </div>`;
}

function initGlobe(data = {}) {
    const container = document.getElementById('globe-container');
    const pinsContainer = document.getElementById('globe-pins-container');
    if (!container || typeof THREE === 'undefined') return;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    while (container.firstChild && container.firstChild.id !== 'globe-pins-container') container.removeChild(container.firstChild);
    pinsContainer.innerHTML = '';

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3.0;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.insertBefore(renderer.domElement, pinsContainer);

    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    globe = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), new THREE.MeshStandardMaterial({ map: earthTexture, metalness: 0.3, roughness: 0.7 }));
    scene.add(globe);

    // Glow
    const glowMat = new THREE.ShaderMaterial({
        vertexShader: 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'varying vec3 vN;void main(){float i=pow(0.6-dot(vN,vec3(0,0,1)),4.0);gl_FragColor=vec4(0.2,0.5,1.0,1.0)*i;}',
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), glowMat);
    glow.scale.set(1.15, 1.15, 1.15);
    scene.add(glow);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // Pins
    globePinsData.length = 0;
    Object.entries(GLOBE_DESTINATIONS).forEach(([id, dest]) => {
        const pinEl = document.createElement('div');
        pinEl.className = 'pin globe-pin';
        if (dest.noClick) pinEl.style.pointerEvents = 'none';
        pinEl.innerHTML = `<div class="pin-label">${dest.name}</div><div class="pin-stem"></div><div class="pin-dot"></div>`;
        if (!dest.noClick) pinEl.onclick = () => showModal(id);
        pinsContainer.appendChild(pinEl);
        globePinsData.push({ ...dest, id, element: pinEl, vector: latLonToVec3(dest.lat, dest.lon, 1.5) });
    });

    // Interaction
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    renderer.domElement.addEventListener('pointerdown', e => { isDragging = true; isSpinning = false; prevMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('pointerup', () => { isDragging = false; });
    renderer.domElement.addEventListener('pointermove', e => {
        if (!isDragging) return;
        globe.rotation.y += (e.clientX - prevMouse.x) * 0.005;
        globe.rotation.x += (e.clientY - prevMouse.y) * 0.005;
        prevMouse = { x: e.clientX, y: e.clientY };
    });
    renderer.domElement.addEventListener('wheel', e => {
        e.preventDefault();
        camera.position.z = Math.max(2.2, Math.min(6.0, camera.position.z + e.deltaY * 0.005));
    });
    document.getElementById('spinBtn').addEventListener('click', () => {
        isSpinning = !isSpinning;
        document.getElementById('spinBtn').textContent = isSpinning ? 'Stop Spin' : 'Start Spin';
    });

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        if (isSpinning) globe.rotation.y += 0.0008;
        globePinsData.forEach(pin => {
            const pos = pin.vector.clone().applyEuler(globe.rotation);
            const screenPos = pos.clone().project(camera);
            if (pos.z > -0.35) {
                const x = (screenPos.x * container.clientWidth / 2) + container.clientWidth / 2;
                const y = -(screenPos.y * container.clientHeight / 2) + container.clientHeight / 2;
                pin.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
                pin.element.style.opacity = '1';
                pin.element.style.display = 'flex';
            } else {
                pin.element.style.opacity = '0';
                pin.element.style.display = 'none';
            }
        });
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function latLonToVec3(lat, lon, r) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(-(r * Math.sin(phi) * Math.cos(theta)), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// ── INDUSTRY MAP ──
function renderIndustryMap(localData, liveNexus = {}) {
    const pins = localData.map(ind => {
        const offsetStyle = ind.offset ? ` style="${ind.offset}"` : '';
        return `<div class="pin sg-map-pin" style="left:${ind.position.x}%;top:${ind.position.y}%;" onclick="window._showModal('${ind.id}')">
            <div class="pin-label"${offsetStyle}>${ind.name}</div>
            <div class="pin-dot" style="background-color:${ind.color}; border: 4px solid white;"></div>
            <div class="pin-stem" style="background-color:${ind.color};"></div>
        </div>`;
    }).join('');
    const mapImg = '<img src="assets/sgmap.png" alt="Singapore Map" class="absolute top-0 left-0 w-full h-full object-contain -z-10 filter drop-shadow-xl" />';

    return `
    <div class="flex h-full w-full gap-0">
        <div class="w-2/3 h-full relative bg-white/5 flex justify-center items-center overflow-hidden border-r border-white/10">
            <div id="industry-nexus-container" class="w-full h-full flex justify-center items-center relative scale-95">${mapImg}${pins}</div>
        </div>
        <div class="w-1/3 h-full bg-gray-800/90 backdrop-blur-xl p-8 overflow-y-auto shadow-2xl">
            <div id="nexus-stats-container"><p class="text-gray-400 animate-pulse text-xl">Waiting for selections...</p></div>
        </div>
    </div>`;
}

// ── MODAL ──
function showModal(id) {
    const data = { ...EXCHANGE_DATA, ...INDUSTRY_DATA }[id];
    if (!data) return;
    const highlights = data.highlights?.length > 0
        ? `<ul class="list-disc list-inside mt-6 text-gray-300 text-2xl space-y-3">${data.highlights.map(h => `<li>${h}</li>`).join('')}</ul>` : '';
    const badges = (data.studentCount ? `<span class="bg-blue-900 text-blue-200 text-lg font-bold px-4 py-2 rounded-full border border-blue-500 mr-3">${data.studentCount} Students</span>` : '')
        + (data.duration ? `<span class="bg-purple-900 text-purple-200 text-lg font-bold px-4 py-2 rounded-full border border-purple-500">${data.duration}</span>` : '');

    const modal = document.getElementById('nexusModal');
    document.getElementById('modalContent').innerHTML = `
        <h2 class="text-5xl font-black bty-text-yellow mb-4">${data.title}</h2>
        <div class="mb-8">${badges}</div>
        <p class="text-white text-2xl leading-relaxed">${data.description || ''}</p>
        ${highlights}`;
    modal.classList.remove('hidden', 'opacity-0');
}
window._showModal = showModal;

document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('nexusModal').classList.add('hidden', 'opacity-0');
});

// ── END SCREEN ──
function renderEndScreen() {
    journeyContent.innerHTML = `
        <div class="text-center fade-in h-full flex flex-col justify-center items-center">
            <h2 class="text-8xl font-black bty-text-yellow mb-12 drop-shadow-xl">Your Journey Begins Now.</h2>
            <p class="text-4xl text-gray-200 mb-16 max-w-6xl leading-relaxed">Thank you for exploring The Beatty Experience.<br>We invite you to join our family and discover where your aspirations will take you.</p>
            <a href="https://www.beattysec.moe.edu.sg/" target="_blank" class="btn-primary text-3xl px-12 py-6">Visit Our Website</a>
        </div>`;
    writeSessionState({ currentView: 'end' });
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    progressBar.style.width = '100%';
}

// ── TOAST ──
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }
}

// ── GO ──
init();
