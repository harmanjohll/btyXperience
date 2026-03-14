/* ═══════════════════════════════════════════════════════════════
   btyXperience — Audience Module
   Merged SAIL origami profiling + presenter-synced interactions.
   Phase 1: Self-paced profiling & origami (always self-paced)
   Phase 2: Presenter-synced interactions (polls, nexus, aspiration, card)
   ═══════════════════════════════════════════════════════════════ */

import { SAIL_DATA, QUESTION_SEQUENCE, FOLD_STAGE_MAP, ARCHETYPES,
         computeArchetype, SCHOOL, COLORS, LOGO_URL } from '../shared/data.js';
import { initFirebase, writeDoc, listenDoc, listenCollection, uid,
         doc, setDoc, getDb, getAppAuth, serverTimestamp, onSnapshot, collection } from '../shared/firebase.js';
import { buildOrigamiSVG, BOAT_DEFAULTS, FOLD_LABELS, haptic } from '../shared/boat-svg.js';

const STORAGE_KEY = 'btyx_audience_v1';
const app = document.getElementById('app');

let userData = {};
let currentQuestionIndex = 0;
let currentFoldStage = 0;
let paceMode = 'audience';

// ── INIT ──
async function init() {
    userData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    try {
        await initFirebase();
    } catch (e) {
        console.error('Firebase init failed:', e);
        renderError('Connection Error', 'Could not connect. Please refresh.');
        return;
    }

    // Listen for pace changes
    listenDoc('config', 'pace', (data) => {
        if (data) paceMode = data.mode || 'audience';
        updatePaceBanner();
    });

    // Determine where to resume
    if (userData.archetype && userData.phase === 'done') {
        renderCompassCard();
    } else if (userData.archetype) {
        startPhase2();
    } else {
        renderWelcome();
    }
}

// ── SAVE / LOAD ──
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); }

// ── PACE BANNER ──
function updatePaceBanner() {
    let banner = document.getElementById('paceBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'paceBanner';
        banner.className = 'pace-banner';
        document.body.prepend(banner);
    }
    if (paceMode === 'presenter') {
        banner.className = 'pace-banner presenter';
        banner.textContent = 'Following presentation';
    } else {
        banner.className = 'pace-banner audience';
        banner.textContent = 'Explore at your own pace';
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1: Self-paced profiling + origami
// ═══════════════════════════════════════════════════════════════

function renderWelcome() {
    app.innerHTML = `
        <div class="text-center fade-in w-full max-w-md">
            <img src="${LOGO_URL}" alt="Beatty Crest" class="mx-auto h-24 w-24 mb-6 drop-shadow-lg">
            <h1 class="text-3xl font-black mb-2" style="color:${COLORS.yellow}">The Beatty Experience</h1>
            <p class="text-gray-400 mb-2 text-sm">${SCHOOL.motto}</p>
            <p class="text-gray-300 mb-8 text-sm leading-relaxed">
                Build your paper boat as you discover your path.<br>
                Answer 6 questions — each fold brings you closer to your archetype.
            </p>
            <button id="startBtn" class="btn-primary w-full text-lg">Set Sail</button>
        </div>`;
}

function renderQuestion() {
    if (currentQuestionIndex >= QUESTION_SEQUENCE.length) {
        finishProfiling();
        return;
    }

    const qDef = QUESTION_SEQUENCE[currentQuestionIndex];
    const sailSection = SAIL_DATA[qDef.sailKey];
    const isMain = qDef.type === 'main';

    const scenario = isMain ? sailSection.scenario : sailSection.subScenario;
    const question = isMain ? sailSection.question : sailSection.subQuestion;
    const options = isMain ? sailSection.options : sailSection.subOptions;
    const info = isMain ? sailSection.info : null;

    // Progress dots
    const dots = QUESTION_SEQUENCE.map((_, i) => {
        const cls = i < currentQuestionIndex ? 'done' : i === currentQuestionIndex ? 'active' : '';
        return `<div class="progress-dot ${cls}"></div>`;
    }).join('');

    // Origami preview
    const boatColors = { ...BOAT_DEFAULTS };
    const origamiSVG = buildOrigamiSVG(boatColors, currentFoldStage, 200);

    app.innerHTML = `
        <div class="w-full max-w-lg fade-in">
            <div class="progress-dots">${dots}</div>

            <!-- SAIL badge + title -->
            <div class="flex items-center gap-3 mb-4">
                <div class="sail-badge">${sailSection.letter}</div>
                <div>
                    <h2 class="text-lg font-black" style="color:${COLORS.yellow}">${sailSection.title}</h2>
                    <p class="text-xs text-gray-400">${sailSection.subtitle}</p>
                </div>
            </div>

            <!-- Origami preview -->
            <div class="origami-container" id="origamiPreview">${origamiSVG}</div>
            <p class="fold-instruction">${sailSection.foldInstruction}</p>

            <!-- Question card -->
            <div class="question-card mt-4">
                <p class="scenario-text">${scenario}</p>
                <h3 class="text-base font-bold mb-4">${question}</h3>
                <div class="space-y-2.5" id="opts">
                    ${options.map(opt => `
                        <button data-id="${opt.id}" class="action-option w-full text-left p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-sm font-semibold" style="border-left: 4px solid ${opt.color}">
                            ${opt.text}
                        </button>
                    `).join('')}
                </div>
            </div>

            ${info ? `<p class="text-xs text-gray-500 mt-4 leading-relaxed italic">${info}</p>` : ''}
        </div>`;
}

function handleAnswer(optionId) {
    if (!userData.answers) userData.answers = [];
    userData.answers.push(optionId);
    save();

    // Advance fold stages
    const stages = FOLD_STAGE_MAP[currentQuestionIndex];
    if (stages) {
        const origami = document.getElementById('origamiPreview');
        if (origami) {
            origami.classList.add('folding');
            haptic(40);
        }
        currentFoldStage = stages[stages.length - 1] + 1; // move to next stage
    }

    currentQuestionIndex++;

    // Brief pause then next question
    setTimeout(() => renderQuestion(), 500);
}

async function finishProfiling() {
    const { archetype, scores } = computeArchetype(userData.answers);
    userData.archetype = archetype;
    userData.scores = scores;
    save();

    // Write to Firebase
    const db = getDb();
    try {
        await setDoc(doc(db, 'profiles', uid()), {
            archetype,
            answers: userData.answers,
            timestamp: serverTimestamp(),
        });

        // Also write sailBoat data for fleet view
        const archetypeData = ARCHETYPES[archetype];
        await setDoc(doc(db, 'sailBoats', uid()), {
            archetype,
            archetypeColor: archetypeData.color,
            answers: userData.answers,
            hull: BOAT_DEFAULTS.hull,
            sail: BOAT_DEFAULTS.sail,
            flag: BOAT_DEFAULTS.flag,
            timestamp: serverTimestamp(),
        });
    } catch (e) {
        console.error('Profile write error:', e);
    }

    renderArchetypeReveal();
}

function renderArchetypeReveal() {
    const archetype = userData.archetype;
    const data = ARCHETYPES[archetype];
    const boatSVG = buildOrigamiSVG(
        { ...BOAT_DEFAULTS, sailGradient: [data.color, '#f5f0e8'] },
        9, 220, { aspiration: '' }
    );

    app.innerHTML = `
        <div class="reveal-container w-full max-w-md">
            <p class="text-sm text-gray-400 mb-2">Your compass points to...</p>
            <h2 class="archetype-name" style="color:${data.color}">${archetype}</h2>
            <div class="boat-reveal my-6">${boatSVG}</div>
            <p class="archetype-quote">"${data.quote}"</p>
            <p class="text-sm text-gray-300 mt-4">${data.description}</p>
            <button id="continueBtn" class="btn-primary w-full mt-8">Continue to Presentation</button>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: Presenter-synced interactions
// ═══════════════════════════════════════════════════════════════

function startPhase2() {
    // Listen for session state changes from presenter
    const db = getDb();
    onSnapshot(doc(db, 'session', 'state'), (snap) => {
        if (snap.exists()) {
            renderPresenterView(snap.data());
        } else {
            renderWaiting(`Welcome, <strong style="color:${ARCHETYPES[userData.archetype]?.color || COLORS.yellow}">${userData.archetype}</strong>!<br><br>Waiting for the presentation to begin...`);
        }
    });
}

function renderPresenterView(state) {
    if (!state || !state.currentView) {
        renderWaiting('Waiting for the presentation...');
        return;
    }

    const title = state.title || '';
    const desc = state.description || '';

    switch (state.currentView) {
        case 'poll':
            if (userData.polls && userData.polls[state.pollData.id] !== undefined) {
                const saved = userData.polls[state.pollData.id];
                renderWaiting(`Vote Recorded!<br><br>${saved.insight || 'Watch the main screen.'}`);
            } else {
                renderPoll(state.pollData);
            }
            break;

        case 'globe': case 'industry_map':
            if (userData[state.nexusData.type]) {
                renderWaiting('Your choice is on the map!<br>Watch the big screen.');
            } else {
                renderNexus(state.nexusData);
            }
            break;

        case 'finale':
            renderAspirationInput();
            break;

        case 'memento': case 'end':
            userData.phase = 'done';
            save();
            renderCompassCard();
            break;

        case 'chart':
            renderWaiting(`Your archetype: <strong style="color:${ARCHETYPES[userData.archetype]?.color}">${userData.archetype}</strong><br><br>Watch the live chart on screen!`);
            break;

        case 'video':
            renderWaiting('<span class="text-4xl block mb-4">📺</span>Video playing — look at the main screen.');
            break;

        case 'slide':
            renderWaiting('<span class="text-2xl block mb-4">📋</span>Presentation in progress — look up!');
            break;

        case 'static':
            if (state.staticContent) {
                renderWaiting('<span class="text-xl block mb-2" style="color:' + COLORS.yellow + '">D.R.E.A.M. Values</span>Reflect on the values shown on screen.');
            } else {
                renderWaiting(title ? `<strong style="color:${COLORS.yellow}">${title}</strong><br>${desc}` : 'Watch the main screen.');
            }
            break;

        case 'reset':
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
            break;

        default:
            renderWaiting('Watch the main screen.');
    }
}

// ── POLL ──
function renderPoll(pollData) {
    app.innerHTML = `
        <div class="w-full max-w-md text-center fade-in" data-poll-json='${JSON.stringify(pollData).replace(/'/g, "&apos;")}'>
            <p class="text-sm font-bold mb-2 uppercase tracking-widest" style="color:${COLORS.yellow}">Live Poll</p>
            <h2 class="text-xl font-bold mb-6 leading-snug">${pollData.question}</h2>
            <div class="space-y-3">
                ${pollData.options.map((opt, i) => `
                    <button data-poll-id="${pollData.id}" data-option-index="${i}" class="action-option w-full text-left p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-base font-semibold">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>`;
}

async function handlePollAnswer(pollId, optionIndex, pollData) {
    if (!userData.polls) userData.polls = {};
    const idx = parseInt(optionIndex);
    const isCorrect = idx === pollData.correctAnswer;
    let insight = pollData.insight || 'Thanks for voting!';
    if (!isCorrect && pollData.correctAnswer !== null && pollData.correctAnswer !== undefined) {
        insight = `Good guess!<br><br>${pollData.insight}`;
    }

    userData.polls[pollId] = { choice: idx, choiceText: pollData.options[idx], isCorrect, insight };
    save();

    const db = getDb();
    await setDoc(doc(db, 'polls', `${pollId}_${uid()}`), {
        pollId, vote: idx, timestamp: serverTimestamp(),
    });

    renderWaiting(`Vote Recorded!<br><br>${insight}`);
}

// ── NEXUS ──
function renderNexus(nexusData) {
    app.innerHTML = `
        <div class="w-full max-w-md text-center fade-in">
            <h2 class="text-xl font-bold mb-2">Chart Your Course</h2>
            <p class="mb-5 text-gray-300 text-sm">As a <strong style="color:${ARCHETYPES[userData.archetype]?.color}">${userData.archetype}</strong>, which excites you?</p>
            <div class="space-y-3">
                ${nexusData.options.map(opt => `
                    <button data-nexus-id="${opt.id}" data-nexus-type="${nexusData.type}" data-nexus-text="${opt.text}" class="action-option w-full text-left p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl font-semibold">
                        ${opt.text}
                    </button>
                `).join('')}
            </div>
        </div>`;
}

async function handleNexusChoice(nexusId, nexusType, nexusText) {
    userData[nexusType] = { id: nexusId, text: nexusText };
    save();

    const db = getDb();
    await setDoc(doc(db, 'nexusVotes', uid()), {
        nexusId, timestamp: serverTimestamp(),
    });

    renderWaiting('Your choice is on the map!<br>Look at the main screen.');
}

// ── ASPIRATION ──
function renderAspirationInput() {
    if (userData.aspiration) {
        renderWaiting('Your aspiration is part of the crest!');
        return;
    }
    app.innerHTML = `
        <div class="w-full max-w-md text-center fade-in">
            <h2 class="text-2xl font-bold mb-3" style="color:${COLORS.yellow}">One Word.</h2>
            <p class="mb-6 text-gray-300">What is your future aspiration?<br>(e.g. Doctor, Innovator)</p>
            <input type="text" id="aspirationInput" maxlength="15" class="w-full p-4 bg-gray-800 text-white border-2 border-blue-500 focus:border-yellow-400 rounded-xl mb-5 text-center text-xl font-bold outline-none" placeholder="Type here...">
            <button id="submitAspiration" class="btn-primary w-full">Add to Crest</button>
        </div>`;
}

async function handleAspirationSubmit() {
    const input = document.getElementById('aspirationInput');
    const word = input?.value.trim();
    if (!word) return;

    input.disabled = true;
    const btn = document.getElementById('submitAspiration');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    userData.aspiration = word;
    save();

    const db = getDb();
    await setDoc(doc(db, 'aspirations', uid()), {
        word, timestamp: serverTimestamp(),
    });

    renderWaiting('Thank you!<br>Your aspiration is now part of our crest.');
}

// ── COMPASS CARD ──
function renderCompassCard() {
    const archetype = userData.archetype;
    const data = ARCHETYPES[archetype];
    if (!data) { renderError('Error', 'Could not load your profile.'); return; }

    // Insights from polls
    let insightsHTML = '';
    const pollKeys = Object.keys(userData.polls || {});
    if (pollKeys.length > 0) {
        const rawInsights = pollKeys.map(k => (userData.polls[k].insight || '').replace('Good guess!<br><br>', ''));
        const unique = [...new Set(rawInsights)].slice(0, 3);
        insightsHTML = `
        <div class="bg-slate-800 border-l-4 border-yellow-400 rounded-r-lg p-4 mb-4 shadow-lg">
            <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">Your Insights</h4>
            <ul class="space-y-2 text-xs text-gray-200 leading-relaxed">
                ${unique.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>`;
    }

    // Pathways
    const globalChoice = userData.global?.text || 'a future global exchange';
    const localChoice = userData.local?.text || 'a future industry attachment';
    const pathwayText = `You've set your sights on <strong>${globalChoice}</strong> and <strong>${localChoice}</strong>. With ${SCHOOL.exchangeCount} international exchanges and ${SCHOOL.industryCount} industry attachments, we can't wait for you to pursue these opportunities.`;
    const recsText = `Keep in mind: ${data.recommendations.join(' \u2022 ')}. Get ready for your aspirations to take flight.`;

    // Boat SVG for card
    const boatSVG = buildOrigamiSVG(
        { ...BOAT_DEFAULTS, sailGradient: [data.color, '#f5f0e8'] },
        9, 120, { aspiration: userData.aspiration || '' }
    );

    app.innerHTML = `
        <div class="w-full max-w-md text-center fade-in pb-8">
            <div id="memento-card" class="relative overflow-hidden rounded-3xl border-4 shadow-2xl text-left" style="border-color:${data.color}; background-color: #0f172a;">
                <!-- Header -->
                <div class="p-5 pb-3 relative z-10">
                    <div class="flex items-center gap-3 mb-1">
                        <img src="${LOGO_URL}" alt="Beatty Crest" class="h-10 w-10 drop-shadow-md">
                        <div>
                            <h1 class="text-xl font-black leading-none tracking-tight" style="color:${data.color};">${archetype}</h1>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Your Beatty Compass Card</p>
                        </div>
                    </div>
                </div>

                <!-- Boat + Quote -->
                <div class="flex items-center gap-3 mx-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div class="shrink-0">${boatSVG}</div>
                    <p class="text-sm italic text-gray-100 font-serif">"${data.quote}"</p>
                </div>

                <!-- Body -->
                <div class="p-5 pt-3 relative z-10">
                    <p class="text-xs text-gray-300 mb-4 font-medium">${data.description}</p>
                    ${insightsHTML}
                    <div class="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-4 shadow-lg">
                        <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">Your Chosen Pathways</h4>
                        <p class="text-xs text-gray-200 leading-relaxed">${pathwayText}</p>
                    </div>
                    <div class="bg-slate-800/50 border-l-4 border-gray-500 rounded-r-lg p-4 shadow-lg">
                        <h4 class="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">Recommended Pathways</h4>
                        <p class="text-xs text-gray-400 leading-relaxed">${recsText}</p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-black/40 p-5 text-center relative z-10 border-t border-white/10">
                    <p class="text-xs text-gray-400 mb-1">Join us and have your aspiration to become</p>
                    <p class="text-2xl font-black uppercase tracking-wide" style="color:${data.color}; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${userData.aspiration || 'FUTURE LEADER'}</p>
                    <p class="text-xs text-gray-400 mt-1">take flight!</p>
                </div>
            </div>

            <button id="downloadCardBtn" class="btn-primary w-full mt-6 text-base">Download Card</button>
            <p class="text-xs text-gray-500 mt-2">Show this card at our booth for a gift!</p>
            <button id="retakeBtn" class="mt-4 text-sm text-gray-500 underline hover:text-white">Retake Quiz</button>
        </div>`;
}

function downloadCard() {
    const card = document.getElementById('memento-card');
    const btn = document.getElementById('downloadCardBtn');
    if (!card || !btn) return;
    btn.textContent = 'Generating...';
    btn.disabled = true;

    if (typeof html2canvas === 'undefined') {
        btn.textContent = 'Download unavailable';
        return;
    }

    html2canvas(card, { backgroundColor: '#0f172a', scale: 3, useCORS: true }).then(canvas => {
        // Try Web Share first, fall back to download
        canvas.toBlob(blob => {
            if (navigator.share && blob) {
                const file = new File([blob], 'Beatty-Compass-Card.png', { type: 'image/png' });
                navigator.share({ files: [file], title: 'My Beatty Compass Card' }).catch(() => {
                    downloadBlob(blob);
                });
            } else {
                downloadBlob(blob);
            }
            btn.textContent = 'Download Card';
            btn.disabled = false;
        }, 'image/png');
    }).catch(() => {
        btn.textContent = 'Download Failed';
        btn.disabled = false;
    });
}

function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'Beatty-Compass-Card.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// ── UTILITY RENDERS ──
function renderWaiting(message) {
    app.innerHTML = `
        <div class="w-full max-w-md text-center slide-in">
            <div class="animate-pulse mb-4">
                <svg class="mx-auto h-12 w-12 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p class="text-lg font-semibold leading-relaxed">${message}</p>
        </div>`;
}

function renderError(title, message) {
    app.innerHTML = `
        <div class="text-center p-6 bg-red-900/80 rounded-xl border border-red-500 m-4">
            <h2 class="text-xl font-bold mb-2">${title}</h2>
            <p>${message}</p>
        </div>`;
}

// ── EVENT DELEGATION ──
app.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    // Welcome
    if (target.id === 'startBtn') { renderQuestion(); return; }

    // Continue after archetype reveal
    if (target.id === 'continueBtn') { startPhase2(); return; }

    // Retake
    if (target.id === 'retakeBtn') {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
        return;
    }

    // Download card
    if (target.id === 'downloadCardBtn') { downloadCard(); return; }

    // Aspiration submit
    if (target.id === 'submitAspiration') { handleAspirationSubmit(); return; }

    // Profiling answer (Phase 1)
    if (target.dataset.id && !target.dataset.pollId && !target.dataset.nexusId) {
        target.disabled = true;
        target.classList.add('selected');
        const siblings = target.parentElement.querySelectorAll('button');
        siblings.forEach(b => { if (b !== target) { b.disabled = true; b.style.opacity = '0.4'; } });
        handleAnswer(target.dataset.id);
        return;
    }

    // Poll answer (Phase 2)
    if (target.dataset.pollId) {
        const pollContainer = target.closest('[data-poll-json]');
        if (!pollContainer) return;
        const pollData = JSON.parse(pollContainer.dataset.pollJson);
        const allBtns = pollContainer.querySelectorAll('button');
        allBtns.forEach(b => { b.disabled = true; b.classList.add('opacity-50'); });
        target.classList.remove('opacity-50');
        target.classList.add('selected');
        handlePollAnswer(target.dataset.pollId, target.dataset.optionIndex, pollData);
        return;
    }

    // Nexus answer (Phase 2)
    if (target.dataset.nexusId) {
        target.disabled = true;
        target.classList.add('selected');
        handleNexusChoice(target.dataset.nexusId, target.dataset.nexusType, target.dataset.nexusText);
    }
});

// ── GO ──
init();
