/* === Beatty SAIL — Shared Boat Module ===
   Origami SVG, SAIL data with scenarios, weighted profiles, fold guides.
*/

export const PACE_MODE = 'audience';

export const COLORS = { btyBlue: '#000C53', btyYellow: '#FFE200', btyRed: '#EC3237' };

export const BOAT_DEFAULTS = {
    hull: '#1e3a5f', keel: '#0f2a4a', sail: '#ffffff',
    flag: '#FFE200', mast: '#3d2b1a',
};

/* ============================================================
   SAIL PROGRAMME DATA — with scenarios & weighted profiles
   Each question: scenario + question + 4 options.
   Users pick TWO per question (1st = full weight, 2nd = 0.5x).
   ============================================================ */

export const SAIL_DATA = {
    S: {
        letter: 'S',
        title: 'Stewardship',
        subtitle: 'The Foundation',
        foldInstruction: 'Fold the paper in half — top edge down to bottom',
        scenario: 'Imagine you are leading a team for the first time. Everyone looks to you to set the direction. The team is diverse — some are eager, some are unsure, and some have strong opinions of their own.',
        question: 'What is your first instinct as a leader?',
        options: [
            { text: 'Show them how it\'s done — lead by example with clear actions and consistency.',
              color: '#3b82f6', id: 'model',
              weight: { model: 3, inspire: 0, challenge: 1, enable: 0 } },
            { text: 'Paint a picture of what we could achieve together — inspire a shared vision.',
              color: '#f59e0b', id: 'inspire',
              weight: { model: 0, inspire: 3, challenge: 0, enable: 1 } },
            { text: 'Question the old way of doing things — push boundaries and try something new.',
              color: '#ef4444', id: 'challenge',
              weight: { model: 1, inspire: 0, challenge: 3, enable: 0 } },
            { text: 'Focus on each person — understand their strengths and help them shine.',
              color: '#10b981', id: 'enable',
              weight: { model: 0, inspire: 1, challenge: 0, enable: 3 } },
        ],
        profiles: {
            model:     { name: 'The Trailblazer',  desc: 'You lead by doing. Actions speak louder than words.' },
            inspire:   { name: 'The Visionary',     desc: 'You rally people around a shared dream.' },
            challenge: { name: 'The Disruptor',     desc: 'You question, push, and innovate.' },
            enable:    { name: 'The Catalyst',       desc: 'You lift others up and unlock their potential.' },
        },
        info: 'Our Leaders for Life Programme (LLP) develops purpose-driven leaders through the Kouzes & Posner Leadership Challenge — Model the Way, Inspire a Shared Vision, Challenge the Process, Enable Others to Act, and Encourage the Heart.',
    },
    A: {
        letter: 'A',
        title: 'Applied Learning',
        subtitle: 'The Structure',
        foldInstruction: 'Fold both top corners down to the centre line',
        scenario: 'Your school has just been given a grant to solve a real-world problem in your community. You and your team have full creative freedom. The clock is ticking — you have one semester.',
        question: 'Which problem domain draws you in most?',
        options: [
            { text: 'Using AI and data analytics to make the neighbourhood smarter and safer.',
              color: '#8b5cf6', id: 'ai',
              weight: { ai: 3, green: 0, robotics: 1, creative: 0 } },
            { text: 'Engineering green solutions — sustainable energy, waste reduction, urban farming.',
              color: '#22c55e', id: 'green',
              weight: { ai: 0, green: 3, robotics: 0, creative: 1 } },
            { text: 'Building robots or automated systems that help people in their daily lives.',
              color: '#3b82f6', id: 'robotics',
              weight: { ai: 1, green: 0, robotics: 3, creative: 0 } },
            { text: 'Designing an interactive experience — a game, an app, or a digital campaign.',
              color: '#ec4899', id: 'creative',
              weight: { ai: 0, green: 1, robotics: 0, creative: 3 } },
        ],
        profiles: {
            ai:       { name: 'Data Architect',    desc: 'You see patterns where others see noise.' },
            green:    { name: 'Green Engineer',     desc: 'You build solutions that heal the planet.' },
            robotics: { name: 'Systems Builder',    desc: 'You create machines that serve humanity.' },
            creative: { name: 'Digital Creator',    desc: 'You turn ideas into immersive experiences.' },
        },
        info: 'Our Applied Learning Programme (ALP) — Think.Create.Innovate — focuses on STEM and Machine Learning for smart living. Through NEXUS@BTY, students connect knowledge across disciplines to tackle real-world problems.',
        subScenario: 'The grant committee is impressed. They want to know what subjects you would draw on most to bring your solution to life.',
        subQuestion: 'Which area of study fuels your passion?',
        subOptions: [
            { text: 'Mathematics & Computing — algorithms, logic, and code.',
              color: '#6366f1', id: 'math',
              weight: { math: 3, science: 1, humanities: 0, design: 0 } },
            { text: 'Sciences & Engineering — experiments, prototypes, and physics.',
              color: '#14b8a6', id: 'science',
              weight: { math: 1, science: 3, humanities: 0, design: 0 } },
            { text: 'Humanities & Media — storytelling, research, and communication.',
              color: '#f97316', id: 'humanities',
              weight: { math: 0, science: 0, humanities: 3, design: 1 } },
            { text: 'Design & Technology — making, crafting, and visual problem-solving.',
              color: '#a855f7', id: 'design',
              weight: { math: 0, science: 0, humanities: 1, design: 3 } },
        ],
    },
    I: {
        letter: 'I',
        title: 'International & Industry',
        subtitle: 'The Sail',
        foldInstruction: 'Fold the bottom flaps up on both sides',
        scenario: 'You have been offered a once-in-a-lifetime opportunity: a fully-funded trip abroad to learn, explore, and bring back knowledge that could change your school. You can only choose one destination.',
        question: 'Where would the wind take you?',
        options: [
            { text: 'South Korea — immerse yourself in AI labs and K-innovation culture.',
              color: '#3b82f6', gradient: ['#3b82f6','#60a5fa'], id: 'korea',
              weight: { korea: 3, japan: 0, nz: 0, estonia: 1 } },
            { text: 'Japan — explore how ancient culture fuels modern creativity and social design.',
              color: '#ec4899', gradient: ['#ec4899','#f9a8d4'], id: 'japan',
              weight: { korea: 0, japan: 3, nz: 1, estonia: 0 } },
            { text: 'New Zealand — learn how sustainability and servant leadership go hand in hand.',
              color: '#10b981', gradient: ['#10b981','#6ee7b7'], id: 'nz',
              weight: { korea: 0, japan: 1, nz: 3, estonia: 0 } },
            { text: 'Estonia — the world\'s most digital nation. Cybersecurity, e-governance, and the future.',
              color: '#f59e0b', gradient: ['#f59e0b','#fcd34d'], id: 'estonia',
              weight: { korea: 1, japan: 0, nz: 0, estonia: 3 } },
        ],
        profiles: {
            korea:   { name: 'Tech Voyager',      desc: 'Innovation is your compass.' },
            japan:   { name: 'Culture Navigator',  desc: 'You bridge tradition and progress.' },
            nz:      { name: 'Eco Pioneer',        desc: 'You chart a greener course.' },
            estonia: { name: 'Digital Explorer',    desc: 'You build the infrastructure of tomorrow.' },
        },
        info: 'From South Korea to New Zealand, Estonia to Japan — our NEXUS exchanges take learning beyond the classroom and beyond borders. With 7 international exchanges to choose from!',
        subScenario: 'Back home, you can also join an industry attachment to gain hands-on professional experience alongside your studies.',
        subQuestion: 'Which industry attachment calls to you?',
        subOptions: [
            { text: 'Rockwell Automation — smart manufacturing and industrial IoT.',
              color: '#3b82f6', id: 'rockwell',
              weight: { rockwell: 3, astar: 1, pil: 0, media: 0 } },
            { text: 'A*STAR — cutting-edge research in science and innovation.',
              color: '#8b5cf6', id: 'astar',
              weight: { rockwell: 1, astar: 3, pil: 0, media: 0 } },
            { text: 'PIL — maritime logistics and global supply chains.',
              color: '#0ea5e9', id: 'pil',
              weight: { rockwell: 0, astar: 0, pil: 3, media: 1 } },
            { text: 'Media & Design Studios — content creation and digital storytelling.',
              color: '#ec4899', id: 'media',
              weight: { rockwell: 0, astar: 0, pil: 1, media: 3 } },
        ],
    },
    L: {
        letter: 'L',
        title: 'Learning to Live, Learn & Love',
        subtitle: 'The Flag',
        foldInstruction: 'Pull apart the sides to reveal your boat!',
        scenario: 'It is the last day of school. You are about to graduate. As you look back on your years at Beatty, one value stands out — the compass bearing that guided you through every storm, every triumph, and every quiet moment of growth.',
        question: 'Which value is your compass?',
        options: [
            { text: 'Discipline — the steady course. I stayed focused when everything was noise.',
              color: '#3b82f6', icon: '⚓', id: 'discipline',
              weight: { discipline: 3, resilience: 1, empathy: 0, adaptability: 0 } },
            { text: 'Resilience — I weathered every storm and came back stronger each time.',
              color: '#ef4444', icon: '🔥', id: 'resilience',
              weight: { discipline: 1, resilience: 3, empathy: 0, adaptability: 0 } },
            { text: 'Empathy — I never sailed alone. I carried others with me.',
              color: '#ec4899', icon: '💙', id: 'empathy',
              weight: { discipline: 0, resilience: 0, empathy: 3, adaptability: 1 } },
            { text: 'Adaptability — when the wind changed, I changed with it. And thrived.',
              color: '#10b981', icon: '🌊', id: 'adaptability',
              weight: { discipline: 0, resilience: 0, empathy: 1, adaptability: 3 } },
        ],
        profiles: {
            discipline:   { name: 'The Anchor',      desc: 'Steady, focused, unwavering.' },
            resilience:   { name: 'The Phoenix',      desc: 'You rise from every fall.' },
            empathy:      { name: 'The Compass Heart', desc: 'You navigate by caring for others.' },
            adaptability: { name: 'The Wind Reader',  desc: 'You thrive in change.' },
        },
        info: 'D.R.E.A.M. — Discipline, Resilience, Empathy, Adaptability, Mindfulness. These compass bearings guide every Beattyian\'s voyage through school and life.',
    },
};

// === ARCHETYPE MAP (based on weighted primary international profile) ===
export const ARCHETYPES = {
    korea:   { name: 'The Innovator',       quote: '"Technology opens doors — I build what\'s next."',
               persona: 'You are passionate about technology, AI, and building solutions that change the world.',
               recommended: ['AI & Data Science pathway', 'Robotics CCA', 'NEXUS@BTY Innovation Lab'] },
    japan:   { name: 'The Global Explorer', quote: '"Every culture holds wisdom worth discovering."',
               persona: 'You connect across borders, blending tradition with progress.',
               recommended: ['Humanities & Media pathway', 'Cultural Exchange CCA', 'Global Citizens Programme'] },
    nz:      { name: 'The Eco-Strategist',  quote: '"We borrow the Earth from our children — let\'s return it better."',
               persona: 'You are passionate about sustainability, green innovation, and servant leadership.',
               recommended: ['Sustainability @ NZ exchange', 'Green Engineering projects', 'Environmental Science pathway'] },
    estonia: { name: 'The Digital Pioneer', quote: '"The digital world is the new frontier — I\'m already there."',
               persona: 'You are passionate about digital innovation, cybersecurity, and building tomorrow\'s infrastructure.',
               recommended: ['Cyber & Digital pathway', 'Computing CCA', 'e-Governance workshops'] },
};

// === LABEL MAPS ===
export const LABELS = {
    stewardship:   { model: 'Leads by example', inspire: 'Inspires vision', challenge: 'Challenges status quo', enable: 'Lifts others up' },
    applied:       { ai: 'Smart city AI', green: 'Green engineering', robotics: 'Robotics & automation', creative: 'Creative design' },
    international: { korea: 'South Korea — A.I.', japan: 'Japan — Culture', nz: 'New Zealand — Sustainability', estonia: 'Estonia — Digital' },
    learning:      { discipline: '⚓ Discipline', resilience: '🔥 Resilience', empathy: '💙 Empathy', adaptability: '🌊 Adaptability' },
    subject:       { math: 'Maths & Computing', science: 'Sciences & Engineering', humanities: 'Humanities & Media', design: 'Design & Technology' },
    industry:      { rockwell: 'Rockwell Automation', astar: 'A*STAR Research', pil: 'PIL Maritime', media: 'Media & Design Studios' },
};

// === FIREBASE CONFIG ===
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBjHO57QKoMW-u4oLGGdgDSqw5gttqX6Fg",
    authDomain: "btyx-61dc6.firebaseapp.com",
    projectId: "btyx-61dc6",
    storageBucket: "btyx-61dc6.appspot.com",
    messagingSenderId: "851137405745",
    appId: "1:851137405745:web:c95b86b6f0462a9bc20610",
};

export const LOGO_URL = 'https://raw.githubusercontent.com/harmanjohll/btyXperience/fc98005f3682a779482dd1bf5e7cff5f9adb8451/gem/BTlogo.png';

/* ============================================================
   ORIGAMI FOLD STAGES
   ============================================================ */

const P = {
    front: '#f5f0e8', back: '#e8e0d0',
    shadow: '#d4c9b8', crease: '#c4b8a8',
    foldShadow: 'rgba(0,0,0,0.08)',
};

// Fold guide coordinates in 280x280 viewBox
export const FOLD_GUIDES = [
    { from: { x: 140, y: 22 },  to: { x: 140, y: 258 }, label: 'Top to bottom' },
    { from: { x: 22, y: 142 },  to: { x: 140, y: 210 }, label: 'Corners to centre' },
    { from: { x: 140, y: 258 }, to: { x: 140, y: 163 }, label: 'Flaps up' },
    { from: { x: 140, y: 218 }, to: { x: 140, y: 262 }, label: 'Pull open' },
];

export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const vb = '0 0 280 280';

    if (stage === 0) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="20" width="240" height="240" rx="2" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.5"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.4"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.4"/>
            <line x1="20" y1="20" x2="260" y2="260" stroke="${P.crease}" stroke-width="0.25" stroke-dasharray="3 8" opacity="0.2"/>
            <line x1="260" y1="20" x2="20" y2="260" stroke="${P.crease}" stroke-width="0.25" stroke-dasharray="3 8" opacity="0.2"/>
        </svg>`;
    }

    if (stage === 1) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="142" width="240" height="118" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.7" opacity="0.5"/>
            <rect x="20" y="140" width="240" height="120" rx="1" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.2"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2.5" opacity="0.6"/>
            <rect x="20" y="137" width="240" height="6" fill="${P.foldShadow}" rx="3"/>
            <line x1="140" y1="140" x2="140" y2="260" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.3"/>
        </svg>`;
    }

    if (stage === 2) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Back rectangle -->
            <rect x="20" y="140" width="240" height="120" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.7"/>
            <!-- Left triangle fold -->
            <path d="M20,140 L140,220 L20,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Right triangle fold -->
            <path d="M260,140 L140,220 L260,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Shadow under folds -->
            <path d="M28,148 L140,224 L252,148" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="5"/>
            <!-- Crease lines -->
            <line x1="20" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
            <line x1="260" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2" opacity="0.4"/>
        </svg>`;
    }

    if (stage === 3) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <path d="M20,160 L140,80 L260,160 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.2"/>
            <rect x="20" y="160" width="240" height="58" rx="1" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <rect x="20" y="218" width="240" height="6" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.5"/>
            <path d="M30,160 L140,88 L250,160" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="4"/>
            <line x1="20" y1="160" x2="260" y2="160" stroke="${P.crease}" stroke-width="2" opacity="0.5"/>
            <line x1="140" y1="80" x2="140" y2="218" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.25"/>
            <path d="M20,218 L34,208 L20,208 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.4"/>
            <path d="M260,218 L246,208 L260,208 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.4"/>
        </svg>`;
    }

    // Stage 4+ — boat
    const gid = extras.gradientId || 'sg_' + Math.random().toString(36).slice(2, 6);
    const sailGDef = colors.sailGradient
        ? `<linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${colors.sailGradient[0]}"/><stop offset="100%" style="stop-color:${colors.sailGradient[1]}"/></linearGradient>` : '';
    const sf = colors.sailGradient ? `url(#${gid})` : colors.sail;
    const asp = extras.aspiration ? `<text x="140" y="244" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="8" font-weight="800" font-family="Inter,sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>` : '';
    const fi = extras.flagIcon ? `<text x="157" y="35" text-anchor="middle" font-size="11">${extras.flagIcon}</text>` : '';
    const flag = stage >= 5;

    return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
        <defs>${sailGDef}</defs>
        <ellipse cx="140" cy="268" rx="95" ry="5" fill="rgba(59,130,246,0.1)"/>
        <path d="M58,195 L78,253 L202,253 L222,195 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <line x1="68" y1="203" x2="212" y2="203" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
        ${asp}
        <rect x="135" y="253" width="10" height="12" rx="2" fill="${colors.keel}"/>
        <line x1="140" y1="45" x2="140" y2="195" stroke="${colors.mast}" stroke-width="3" stroke-linecap="round"/>
        <path d="M145,55 L145,185 L222,173 Z" fill="${sf}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <path d="M135,60 L135,180 L75,170 Z" fill="${sf}" opacity="0.5"/>
        ${flag ? `<path d="M140,45 L140,25 L166,31 L140,37 Z" fill="${colors.flag}"/>${fi}` : ''}
    </svg>`;
}

export function buildBoatSVG(colors, step, size = 280, extras = {}) {
    if (step >= 4) return buildOrigamiSVG(colors, 5, size, extras);
    if (step >= 1) return buildOrigamiSVG(colors, 4, size, extras);
    return buildOrigamiSVG(colors, 0, size, extras);
}

export function haptic(duration = 30) {
    if (navigator.vibrate) navigator.vibrate(duration);
}
