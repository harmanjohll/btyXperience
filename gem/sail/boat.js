/* === Beatty SAIL — Shared Boat Module ===
   Dark-paper origami SVG, SAIL data, fold guides.
*/

export const PACE_MODE = 'audience';
export const COLORS = { btyBlue: '#000C53', btyYellow: '#FFE200', btyRed: '#EC3237' };
export const BOAT_DEFAULTS = { hull: '#1e3a5f', keel: '#0f2a4a', sail: '#ffffff', flag: '#FFE200', mast: '#3d2b1a' };

/* ============================================================
   SAIL PROGRAMME DATA
   ============================================================ */
export const SAIL_DATA = {
    S: {
        letter: 'S', title: 'Stewardship', subtitle: 'The Foundation',
        foldInstruction: 'Fold the paper in half — top edge down to bottom',
        scenario: 'You are leading a team for the first time. Everyone looks to you. The group is diverse — some eager, some unsure, and some with strong opinions.',
        question: 'What is your first instinct as a leader?',
        options: [
            { text: 'Show them how it\'s done — lead by example, actions over words.', color: '#3b82f6', id: 'model', weight: { model: 3, inspire: 0, challenge: 1, enable: 0 } },
            { text: 'Paint a picture of what we could achieve together — inspire a shared vision.', color: '#f59e0b', id: 'inspire', weight: { model: 0, inspire: 3, challenge: 0, enable: 1 } },
            { text: 'Challenge the old way — push boundaries and try something nobody has attempted.', color: '#ef4444', id: 'challenge', weight: { model: 1, inspire: 0, challenge: 3, enable: 0 } },
            { text: 'Focus on each person — understand their strengths and help them shine.', color: '#10b981', id: 'enable', weight: { model: 0, inspire: 1, challenge: 0, enable: 3 } },
        ],
        info: 'Our Leaders for Life Programme (LLP) develops purpose-driven leaders through the Kouzes & Posner Leadership Challenge — Model the Way, Inspire a Shared Vision, Challenge the Process, Enable Others to Act, and Encourage the Heart.',
    },
    A: {
        letter: 'A', title: 'Applied Learning', subtitle: 'The Structure',
        foldInstruction: 'Fold both top corners down to the centre',
        scenario: 'Your school just received a grant to solve a real-world community problem. You have full creative freedom and one semester on the clock.',
        question: 'Which problem domain draws you in most?',
        options: [
            { text: 'Smart city solutions — using AI and data to make the neighbourhood safer.', color: '#8b5cf6', id: 'ai', weight: { ai: 3, green: 0, robotics: 1, creative: 0 } },
            { text: 'Green engineering — sustainable energy, waste reduction, urban farming.', color: '#22c55e', id: 'green', weight: { ai: 0, green: 3, robotics: 0, creative: 1 } },
            { text: 'Robotics — building automated systems that help people in daily life.', color: '#3b82f6', id: 'robotics', weight: { ai: 1, green: 0, robotics: 3, creative: 0 } },
            { text: 'Digital media — designing a game, an app, or an interactive experience.', color: '#ec4899', id: 'creative', weight: { ai: 0, green: 1, robotics: 0, creative: 3 } },
        ],
        info: 'Our Applied Learning Programme (ALP) — Think.Create.Innovate — focuses on STEM and Machine Learning for smart living. Through NEXUS@BTY, students connect knowledge across disciplines.',
        subScenario: 'The grant committee loves your idea. Now they want to know what subjects fuel your approach.',
        subQuestion: 'Which area of study fuels your passion?',
        subOptions: [
            { text: 'Mathematics & Computing — algorithms, logic, code.', color: '#6366f1', id: 'math', weight: { math: 3, science: 1, humanities: 0, design: 0 } },
            { text: 'Sciences & Engineering — experiments, prototypes, physics.', color: '#14b8a6', id: 'science', weight: { math: 1, science: 3, humanities: 0, design: 0 } },
            { text: 'Humanities & Media — storytelling, research, communication.', color: '#f97316', id: 'humanities', weight: { math: 0, science: 0, humanities: 3, design: 1 } },
            { text: 'Design & Technology — making, crafting, visual problem-solving.', color: '#a855f7', id: 'design', weight: { math: 0, science: 0, humanities: 1, design: 3 } },
        ],
    },
    I: {
        letter: 'I', title: 'International & Industry', subtitle: 'The Sail',
        foldInstruction: 'Fold the bottom flaps up on both sides',
        scenario: 'You have been offered a fully-funded trip abroad. One destination, one chance to bring knowledge back that could change your school.',
        question: 'Where would the wind take you?',
        options: [
            { text: 'South Korea — AI labs and K-innovation culture.', color: '#3b82f6', gradient: ['#3b82f6','#60a5fa'], id: 'korea', weight: { korea: 3, japan: 0, nz: 0, estonia: 1 } },
            { text: 'Japan — ancient culture fuelling modern creativity and social design.', color: '#ec4899', gradient: ['#ec4899','#f9a8d4'], id: 'japan', weight: { korea: 0, japan: 3, nz: 1, estonia: 0 } },
            { text: 'New Zealand — sustainability and servant leadership hand in hand.', color: '#10b981', gradient: ['#10b981','#6ee7b7'], id: 'nz', weight: { korea: 0, japan: 1, nz: 3, estonia: 0 } },
            { text: 'Estonia — the most digital nation. Cybersecurity and e-governance.', color: '#f59e0b', gradient: ['#f59e0b','#fcd34d'], id: 'estonia', weight: { korea: 1, japan: 0, nz: 0, estonia: 3 } },
        ],
        info: 'From South Korea to New Zealand, Estonia to Japan — our NEXUS exchanges take learning beyond the classroom. With 7 international exchanges to choose from!',
        subScenario: 'Back home, you can also join an industry attachment for hands-on professional experience.',
        subQuestion: 'Which industry attachment calls to you?',
        subOptions: [
            { text: 'Rockwell Automation — smart manufacturing and industrial IoT.', color: '#3b82f6', id: 'rockwell', weight: { rockwell: 3, astar: 1, pil: 0, media: 0 } },
            { text: 'A*STAR — cutting-edge research in science and innovation.', color: '#8b5cf6', id: 'astar', weight: { rockwell: 1, astar: 3, pil: 0, media: 0 } },
            { text: 'PIL — maritime logistics and global supply chains.', color: '#0ea5e9', id: 'pil', weight: { rockwell: 0, astar: 0, pil: 3, media: 1 } },
            { text: 'Media & Design Studios — content creation and digital storytelling.', color: '#ec4899', id: 'media', weight: { rockwell: 0, astar: 0, pil: 1, media: 3 } },
        ],
    },
    L: {
        letter: 'L', title: 'Learning to Live, Learn & Love', subtitle: 'The Flag',
        foldInstruction: 'Pull apart the sides to reveal your boat!',
        scenario: 'It is the last day of school. As you look back on your years at Beatty, one value stands out — the compass bearing that guided you through every storm.',
        question: 'Which value is your compass?',
        options: [
            { text: 'Discipline — the steady course. I stayed focused when everything was noise.', color: '#3b82f6', icon: '⚓', id: 'discipline', weight: { discipline: 3, resilience: 1, empathy: 0, adaptability: 0 } },
            { text: 'Resilience — I weathered every storm and came back stronger each time.', color: '#ef4444', icon: '🔥', id: 'resilience', weight: { discipline: 1, resilience: 3, empathy: 0, adaptability: 0 } },
            { text: 'Empathy — I never sailed alone. I carried others with me.', color: '#ec4899', icon: '💙', id: 'empathy', weight: { discipline: 0, resilience: 0, empathy: 3, adaptability: 1 } },
            { text: 'Adaptability — when the wind changed, I changed with it. And thrived.', color: '#10b981', icon: '🌊', id: 'adaptability', weight: { discipline: 0, resilience: 0, empathy: 1, adaptability: 3 } },
        ],
        info: 'D.R.E.A.M. — Discipline, Resilience, Empathy, Adaptability, Mindfulness. These compass bearings guide every Beattyian\'s voyage.',
    },
};

export const ARCHETYPES = {
    korea:   { name: 'The Innovator',       quote: '"Machine Learning opened my eyes to what\'s possible. Now I use data to build solutions for real problems."',
               persona: 'You are driven by technology, using data and problem-solving to build new and better ways of doing things.',
               recommended: ['A.I. @ South Korea', 'Engineering @ Rockwell Automation', 'NEXUS@BTY Innovation Lab'] },
    japan:   { name: 'The Global Explorer', quote: '"Studying abroad taught me that leadership transcends borders. Every culture has wisdom to share."',
               persona: 'You have a deep cultural curiosity and a desire to understand the world through international exchange.',
               recommended: ['Social Sciences @ Japan', 'Cultural Exchange CCA', 'Global Citizens Programme'] },
    nz:      { name: 'The Eco-Strategist',  quote: '"We don\'t inherit the Earth from our ancestors; we borrow it from our children."',
               persona: 'You are passionate about sustainability, green innovation, and servant leadership.',
               recommended: ['Sustainability @ New Zealand', 'Green Engineering', 'Environmental Science'] },
    estonia: { name: 'The Digital Pioneer', quote: '"The digital world is the new frontier — I\'m already there."',
               persona: 'You are energised by digital innovation, cybersecurity, and building tomorrow\'s infrastructure.',
               recommended: ['Cybersecurity @ Estonia', 'Computing CCA', 'Research @ A*STAR'] },
};

export const LABELS = {
    stewardship:   { model: 'Leads by example', inspire: 'Inspires vision', challenge: 'Challenges status quo', enable: 'Lifts others up' },
    applied:       { ai: 'Smart city AI', green: 'Green engineering', robotics: 'Robotics', creative: 'Creative design' },
    international: { korea: 'South Korea', japan: 'Japan', nz: 'New Zealand', estonia: 'Estonia' },
    learning:      { discipline: '⚓ Discipline', resilience: '🔥 Resilience', empathy: '💙 Empathy', adaptability: '🌊 Adaptability' },
    subject:       { math: 'Maths & Computing', science: 'Sciences', humanities: 'Humanities & Media', design: 'Design & Tech' },
    industry:      { rockwell: 'Rockwell Automation', astar: 'A*STAR', pil: 'PIL Maritime', media: 'Media Studios' },
};

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBjHO57QKoMW-u4oLGGdgDSqw5gttqX6Fg", authDomain: "btyx-61dc6.firebaseapp.com",
    projectId: "btyx-61dc6", storageBucket: "btyx-61dc6.appspot.com",
    messagingSenderId: "851137405745", appId: "1:851137405745:web:c95b86b6f0462a9bc20610",
};
export const LOGO_URL = 'https://raw.githubusercontent.com/harmanjohll/btyXperience/fc98005f3682a779482dd1bf5e7cff5f9adb8451/gem/BTlogo.png';

/* ============================================================
   DARK ORIGAMI PAPER
   Deep indigo paper with gold crease lines, matching the dark UI.
   Yellow dots and arrows are clearly visible against this.
   ============================================================ */

const P = {
    front: '#1e2245',  // dark indigo
    back: '#161835',   // deeper indigo
    shadow: '#0d0f25', // near-black
    crease: 'rgba(212,168,67,0.2)', // gold crease
    foldLine: 'rgba(212,168,67,0.12)',
    highlight: 'rgba(255,255,255,0.06)',
};

// Fold guides in 280x280 viewBox
export const FOLD_GUIDES = [
    { from: { x: 140, y: 25 },  to: { x: 140, y: 255 }, label: 'Top to bottom' },
    { from: { x: 25, y: 142 },  to: { x: 140, y: 210 }, label: 'Corner to centre' },
    { from: { x: 140, y: 255 }, to: { x: 140, y: 165 }, label: 'Flaps up' },
    { from: { x: 140, y: 210 }, to: { x: 140, y: 258 }, label: 'Pull open' },
];

// Each fold also defines a "flap" for real-time fold visualization
// flap: the region of paper that folds, as a clip-path polygon
// axis: CSS transform origin for the flap rotation
// rotateAxis: which CSS axis to rotate around
export const FOLD_FLAPS = [
    // Fold 0: top half folds down. Flap = top half of square paper
    { clipFrom: 'polygon(7% 7%, 93% 7%, 93% 50%, 7% 50%)',
      clipTo:   'polygon(7% 50%, 93% 50%, 93% 93%, 7% 93%)',
      axis: '50% 50%', rotate: 'rotateX', maxDeg: 180 },
    // Fold 1: top-left corner folds to centre. Flap = top-left triangle
    { clipFrom: 'polygon(7% 50%, 50% 75%, 7% 93%)',
      clipTo:   'polygon(7% 50%, 50% 75%, 7% 93%)',
      axis: '7% 50%', rotate: 'rotateY', maxDeg: 0 }, // simpler for this fold
    // Fold 2: bottom flap folds up
    { clipFrom: 'polygon(7% 75%, 93% 75%, 93% 93%, 7% 93%)',
      clipTo:   'polygon(7% 57%, 93% 57%, 93% 75%, 7% 75%)',
      axis: '50% 75%', rotate: 'rotateX', maxDeg: -180 },
    // Fold 3: pull apart (special reveal, no flap)
    { clipFrom: null, clipTo: null, axis: '50% 50%', rotate: 'rotateY', maxDeg: 0 },
];

export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const vb = '0 0 280 280';

    if (stage === 0) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="20" width="240" height="240" rx="3" fill="${P.front}" stroke="${P.highlight}" stroke-width="1"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.foldLine}" stroke-width="0.5" stroke-dasharray="5 7"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.foldLine}" stroke-width="0.5" stroke-dasharray="5 7"/>
            <line x1="20" y1="20" x2="260" y2="260" stroke="${P.foldLine}" stroke-width="0.3" stroke-dasharray="4 10" opacity="0.5"/>
            <line x1="260" y1="20" x2="20" y2="260" stroke="${P.foldLine}" stroke-width="0.3" stroke-dasharray="4 10" opacity="0.5"/>
        </svg>`;
    }

    if (stage === 1) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="142" width="240" height="118" rx="2" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.6"/>
            <rect x="20" y="140" width="240" height="120" rx="2" fill="${P.front}" stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2"/>
            <rect x="20" y="137" width="240" height="5" fill="rgba(0,0,0,0.15)" rx="2"/>
            <line x1="140" y1="140" x2="140" y2="260" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 6"/>
        </svg>`;
    }

    if (stage === 2) {
        // Rectangle with BOTH top corners folded to centre
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Back layer -->
            <rect x="20" y="140" width="240" height="120" rx="2" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5"/>
            <!-- Left triangle flap -->
            <path d="M20,140 L140,220 L20,260 Z" fill="${P.front}" stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Right triangle flap -->
            <path d="M260,140 L140,220 L260,260 Z" fill="${P.front}" stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Fold shadow -->
            <path d="M28,148 L140,224 L252,148" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4"/>
            <!-- Creases -->
            <line x1="20" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="260" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
        </svg>`;
    }

    if (stage === 3) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Triangle body -->
            <path d="M20,165 L140,80 L260,165 Z" fill="${P.front}" stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Bottom band folded up -->
            <rect x="20" y="165" width="240" height="50" rx="2" fill="${P.front}" stroke="${P.highlight}" stroke-width="0.8"/>
            <rect x="20" y="215" width="240" height="6" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.3" opacity="0.5"/>
            <!-- Fold shadow -->
            <path d="M28,165 L140,86 L252,165" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="4"/>
            <!-- Creases -->
            <line x1="20" y1="165" x2="260" y2="165" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="140" y1="80" x2="140" y2="215" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 6"/>
            <!-- Corner tucks -->
            <path d="M20,215 L33,207 L20,207 Z" fill="${P.back}" opacity="0.4"/>
            <path d="M260,215 L247,207 L260,207 Z" fill="${P.back}" opacity="0.4"/>
        </svg>`;
    }

    // Stage 4+ — boat
    const gid = extras.gradientId || 'sg_' + Math.random().toString(36).slice(2, 6);
    const sgDef = colors.sailGradient
        ? `<linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${colors.sailGradient[0]}"/><stop offset="100%" style="stop-color:${colors.sailGradient[1]}"/></linearGradient>` : '';
    const sf = colors.sailGradient ? `url(#${gid})` : colors.sail;
    const asp = extras.aspiration ? `<text x="140" y="244" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="8" font-weight="800" font-family="'Plus Jakarta Sans',sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>` : '';
    const fi = extras.flagIcon ? `<text x="157" y="35" text-anchor="middle" font-size="11">${extras.flagIcon}</text>` : '';
    const flag = stage >= 5;

    return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
        <defs>${sgDef}</defs>
        <ellipse cx="140" cy="268" rx="95" ry="5" fill="rgba(59,130,246,0.08)"/>
        <path d="M58,195 L78,253 L202,253 L222,195 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <line x1="68" y1="203" x2="212" y2="203" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
        ${asp}
        <rect x="135" y="253" width="10" height="12" rx="2" fill="${colors.keel}"/>
        <line x1="140" y1="45" x2="140" y2="195" stroke="${colors.mast}" stroke-width="3" stroke-linecap="round"/>
        <path d="M145,55 L145,185 L222,173 Z" fill="${sf}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <path d="M135,60 L135,180 L75,170 Z" fill="${sf}" opacity="0.5"/>
        ${flag ? `<path d="M140,45 L140,25 L166,31 L140,37 Z" fill="${colors.flag}"/>${fi}` : ''}
    </svg>`;
}

export function buildBoatSVG(colors, step, size = 280, extras = {}) {
    if (step >= 4) return buildOrigamiSVG(colors, 5, size, extras);
    if (step >= 1) return buildOrigamiSVG(colors, 4, size, extras);
    return buildOrigamiSVG(colors, 0, size, extras);
}

export function haptic(duration = 30) { if (navigator.vibrate) navigator.vibrate(duration); }
