/* === Beatty SAIL — Shared Boat Module (Washi Craft v7) ===
   Warm rice-paper origami, 10 SVG stages, hanko stamp marks.
*/

export const PACE_MODE = 'audience';
export const COLORS = { btyBlue: '#000C53', btyYellow: '#FFE200', btyRed: '#EC3237' };
export const BOAT_DEFAULTS = { hull: '#4a3728', keel: '#3a2a1e', sail: '#f5f0e8', flag: '#FFE200', mast: '#3d2b1a' };

/* ============================================================
   WASHI PAPER PALETTE
   Warm cream rice-paper with brown creases and fibre texture.
   ============================================================ */
const P = {
    front:     '#f5f0e8',
    back:      '#e8e0d0',
    shadow:    '#c9bfae',
    crease:    'rgba(90,65,35,0.35)',
    foldLine:  'rgba(90,65,35,0.12)',
    highlight: 'rgba(255,255,255,0.4)',
};

/* SVG filter for rice-paper fibre texture */
const WASHI_FILTER_ID = 'washiTex';
function washiDefs() {
    return `<defs>
        <filter id="${WASHI_FILTER_ID}" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="3" result="n"/>
            <feColorMatrix type="saturate" values="0" in="n" result="g"/>
            <feBlend mode="soft-light" in="SourceGraphic" in2="g"/>
        </filter>
    </defs>`;
}
const wf = `filter="url(#${WASHI_FILTER_ID})"`;

/* ============================================================
   SAIL PROGRAMME DATA
   ============================================================ */
export const SAIL_DATA = {
    S: {
        letter: 'S', title: 'Stewardship', subtitle: 'The Foundation',
        foldInstruction: 'Make your first two folds — preparing the paper.',
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
        foldInstruction: 'Fold both corners — shaping the structure.',
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
        foldInstruction: 'Fold the flaps — the hat takes shape.',
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
        foldInstruction: 'The final fold — reveal your boat!',
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
   HANKO STAMP MARKS — woodblock seal SVGs for each answer
   Each is a <g> in a ~30x30 unit space (small: ~20x20).
   ============================================================ */
export const STAMP_MARKS = {
    // S — Stewardship
    model:       { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><path d="M15,4 L15,26 M4,15 L26,15 M7,7 L23,23 M23,7 L7,23" stroke="currentColor" stroke-width="1" opacity="0.6" stroke-linecap="round"/><circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5"/></g>` },
    inspire:     { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><polygon points="15,4 17.5,11.5 25,11.5 19,16.5 21,24 15,19.5 9,24 11,16.5 5,11.5 12.5,11.5" fill="currentColor" opacity="0.45" stroke="currentColor" stroke-width="0.5"/></g>` },
    challenge:   { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M12,4 L18,13 L11,13 L17,22 L10,22 L16,30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/></g>` },
    enable:      { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><circle cx="11" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6"/><circle cx="19" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6"/><circle cx="15" cy="19" r="4" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6"/></g>` },
    // A — Applied Learning
    ai:          { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M6,10 L12,10 L12,15 L18,15 L18,8 L24,8 M8,20 L15,20 L15,25 L22,25" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5" stroke-linecap="round"/><circle cx="12" cy="10" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="18" cy="15" r="1.5" fill="currentColor" opacity="0.5"/></g>` },
    green:       { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M15,26 L15,14 Q15,6 22,6 Q15,10 15,14 M15,18 Q10,14 7,16 Q12,15 15,18" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" stroke-linecap="round"/></g>` },
    robotics:    { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><circle cx="15" cy="15" r="8" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M9,9 L15,15 L21,9 M9,21 L15,15 L21,21" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-linecap="round"/><circle cx="15" cy="15" r="2.5" fill="currentColor" opacity="0.4"/></g>` },
    creative:    { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.35"/><rect x="17" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/><rect x="8" y="17" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/><rect x="17" y="17" width="5" height="5" rx="1" fill="currentColor" opacity="0.35"/></g>` },
    // A_sub — smaller accent marks
    math:        { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><text x="10" y="14" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700" opacity="0.6">∑</text></g>` },
    science:     { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><path d="M10,4 L10,13 L6,16 L14,16 L10,13" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6" stroke-linecap="round"/><circle cx="8" cy="14" r="1" fill="currentColor" opacity="0.5"/><circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5"/></g>` },
    humanities:  { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><path d="M6,5 L6,15 M6,5 L10,5 Q13,5 13,8 Q13,10 10,10 L6,10 M10,10 L14,15" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" stroke-linecap="round" stroke-linejoin="round"/></g>` },
    design:      { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><polygon points="10,3 13,8 10,7 7,8" fill="currentColor" opacity="0.5"/><path d="M10,7 L10,17" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M6,14 L14,14" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-linecap="round"/></g>` },
    // I — International
    korea:       { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M9,15 Q15,6 21,15 Q15,24 9,15 Z" fill="currentColor" opacity="0.3"/><line x1="9" y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1" opacity="0.5"/></g>` },
    japan:       { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><circle cx="15" cy="13" r="3" fill="currentColor" opacity="0.4"/><path d="M12,16 Q12,20 15,22 Q18,20 18,16" fill="currentColor" opacity="0.25"/><path d="M9,10 Q11,8 13,10 M17,10 Q19,8 21,10" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.4"/></g>` },
    nz:          { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M15,5 Q18,10 16,15 Q14,20 15,26 M15,5 Q12,10 14,15 Q16,20 15,26" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M11,8 Q13,11 15,10 M19,8 Q17,11 15,10 M11,20 Q13,17 15,18 M19,20 Q17,17 15,18" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.4"/></g>` },
    estonia:     { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><rect x="9" y="8" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M12,12 L18,12 M12,15 L16,15 M12,18 L18,18" stroke="currentColor" stroke-width="0.8" opacity="0.4" stroke-linecap="round"/><circle cx="21" cy="8" r="2" fill="currentColor" opacity="0.4"/></g>` },
    // I_sub — smaller
    rockwell:    { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><rect x="5" y="7" width="10" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.5"/><circle cx="8" cy="10" r="1.5" fill="currentColor" opacity="0.4"/><circle cx="12" cy="10" r="1.5" fill="currentColor" opacity="0.4"/></g>` },
    astar:       { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><polygon points="10,3 11.5,7.5 16,7.5 12.5,10.5 13.5,15 10,12 6.5,15 7.5,10.5 4,7.5 8.5,7.5" fill="currentColor" opacity="0.45"/></g>` },
    pil:         { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><path d="M4,12 Q7,8 10,12 Q13,16 16,12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-linecap="round"/><path d="M6,14 Q9,10 12,14" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.4"/></g>` },
    media:       { small: true, svg: `<g><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><polygon points="7,5 7,15 15,10" fill="currentColor" opacity="0.45"/></g>` },
    // L — Learning values
    discipline:  { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M15,5 L15,20 M10,18 Q15,24 20,18 M13,7 L17,7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/><circle cx="15" cy="5" r="2" fill="currentColor" opacity="0.4"/></g>` },
    resilience:  { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M15,24 L15,16 Q15,10 12,8 Q15,12 18,8 Q15,10 15,16" fill="currentColor" opacity="0.4"/><path d="M12,6 Q15,3 18,6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/></g>` },
    empathy:     { small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M15,22 Q8,16 8,12 Q8,8 12,8 Q15,8 15,11 Q15,8 18,8 Q22,8 22,12 Q22,16 15,22 Z" fill="currentColor" opacity="0.35"/></g>` },
    adaptability:{ small: false, svg: `<g><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M4,15 Q8,9 12,15 Q16,21 20,15 Q24,9 28,15" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/><path d="M4,19 Q8,13 12,19 Q16,25 20,19" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.3"/></g>` },
};

/* Where stamps render at each paper stage group */
const MARK_SLOTS = {
    S:     { paper: { x: 195, y: 185 }, hat: { x: 155, y: 165 }, boat: { x: 125, y: 218 } },
    A:     { paper: { x: 220, y: 210 }, hat: { x: 175, y: 150 }, boat: { x: 150, y: 218 } },
    A_sub: { paper: { x: 235, y: 235 }, hat: { x: 185, y: 170 }, boat: { x: 162, y: 208 } },
    I:     { paper: { x: 195, y: 165 }, hat: { x: 140, y: 100 }, boat: { x: 165, y: 120 } },
    I_sub: { paper: { x: 215, y: 180 }, hat: { x: 155, y: 115 }, boat: { x: 175, y: 135 } },
    L:     { paper: null, hat: null, boat: { x: 155, y: 38 } },
};

function getMarkPos(questionKey, stage) {
    const slot = MARK_SLOTS[questionKey];
    if (!slot) return null;
    if (stage >= 8) return slot.boat;
    if (stage >= 5) return slot.hat;
    return slot.paper;
}

function renderMarks(marks, stage) {
    if (!marks || marks.length === 0) return '';
    return marks.map(m => {
        const stamp = STAMP_MARKS[m.id];
        if (!stamp) return '';
        const pos = getMarkPos(m.questionKey, stage);
        if (!pos) return '';
        const sz = stamp.small ? 20 : 30;
        const offset = sz / 2;
        const col = stamp.color || '#8b3a3a';
        return `<g transform="translate(${pos.x - offset},${pos.y - offset})" color="${col}" opacity="0.7">${stamp.svg}</g>`;
    }).join('');
}

// Add color to each stamp for rendering
Object.entries(STAMP_MARKS).forEach(([id, s]) => {
    // Find the option to get its color
    for (const key of ['S','A','I','L']) {
        const d = SAIL_DATA[key];
        const opt = d.options.find(o => o.id === id) || (d.subOptions && d.subOptions.find(o => o.id === id));
        if (opt) { s.color = opt.color; break; }
    }
});

/* ============================================================
   FOLD GUIDES — 8 folds in 280x280 viewBox
   ============================================================ */
export const FOLD_GUIDES = [
    // Fold 0: fold left half onto right half
    { from: { x: 30, y: 140 },  to: { x: 250, y: 140 }, label: 'Left edge to right edge' },
    // Fold 1: fold top half down onto bottom half
    { from: { x: 200, y: 30 },  to: { x: 200, y: 250 }, label: 'Top edge down' },
    // Fold 2: open to rectangle, fold top-left corner to centre
    { from: { x: 148, y: 28 },  to: { x: 200, y: 135 }, label: 'Corner to centre' },
    // Fold 3: fold top-right corner to centre
    { from: { x: 252, y: 28 },  to: { x: 200, y: 135 }, label: 'Corner to centre' },
    // Fold 4: fold bottom front flap up
    { from: { x: 200, y: 252 }, to: { x: 200, y: 150 }, label: 'Bottom flap up' },
    // Fold 5: fold bottom back flap up (flip & repeat)
    { from: { x: 200, y: 252 }, to: { x: 200, y: 150 }, label: 'Back flap up' },
    // Fold 6: push sides in to form diamond
    { from: { x: 252, y: 140 }, to: { x: 148, y: 140 }, label: 'Push sides together' },
    // Fold 7: pull top corners apart — boat reveal
    { from: { x: 140, y: 50 },  to: { x: 140, y: 230 }, label: 'Pull apart — reveal!' },
];

export const FOLD_FLAPS = [
    { clipFrom: 'polygon(7% 7%, 50% 7%, 50% 93%, 7% 93%)', clipTo: 'polygon(50% 7%, 93% 7%, 93% 93%, 50% 93%)', axis: '50% 50%', rotate: 'rotateY', maxDeg: 180 },
    { clipFrom: 'polygon(50% 7%, 93% 7%, 93% 50%, 50% 50%)', clipTo: 'polygon(50% 50%, 93% 50%, 93% 93%, 50% 93%)', axis: '50% 50%', rotate: 'rotateX', maxDeg: 180 },
    { clipFrom: 'polygon(50% 7%, 72% 7%, 50% 50%)', clipTo: 'polygon(50% 50%, 72% 50%, 50% 50%)', axis: '72% 7%', rotate: 'rotateY', maxDeg: 0 },
    { clipFrom: 'polygon(93% 7%, 72% 7%, 93% 50%)', clipTo: 'polygon(72% 50%, 72% 7%, 72% 50%)', axis: '72% 7%', rotate: 'rotateY', maxDeg: 0 },
    { clipFrom: 'polygon(7% 75%, 93% 75%, 93% 93%, 7% 93%)', clipTo: 'polygon(7% 55%, 93% 55%, 93% 75%, 7% 75%)', axis: '50% 75%', rotate: 'rotateX', maxDeg: -180 },
    { clipFrom: 'polygon(7% 75%, 93% 75%, 93% 93%, 7% 93%)', clipTo: 'polygon(7% 55%, 93% 55%, 93% 75%, 7% 75%)', axis: '50% 75%', rotate: 'rotateX', maxDeg: -180 },
    { clipFrom: null, clipTo: null, axis: '50% 50%', rotate: 'rotateY', maxDeg: 0 },
    { clipFrom: null, clipTo: null, axis: '50% 50%', rotate: 'rotateY', maxDeg: 0 },
];

/* Fold step labels for the UI */
export const FOLD_LABELS = [
    'Fold the paper in half — left edge to right edge',
    'Fold in half again — top edge down to bottom',
    'Open back to a rectangle. Fold the top-left corner to the centre',
    'Now fold the top-right corner down to the centre',
    'Fold the bottom front flap upward',
    'Flip and fold the bottom back flap up too',
    'Push both sides inward — flatten into a diamond',
    'Pull the top corners apart — reveal your boat!',
];

/* ============================================================
   BUILD ORIGAMI SVG — 10 stages (0-9)
   ============================================================ */
export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const vb = '0 0 280 280';
    const marks = renderMarks(extras.marks, stage);

    /* Stage 0 — Flat square */
    if (stage === 0) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="20" y="20" width="240" height="240" rx="3" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="1"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.foldLine}" stroke-width="0.5" stroke-dasharray="5 7"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.foldLine}" stroke-width="0.5" stroke-dasharray="5 7"/>
            <line x1="20" y1="20" x2="260" y2="260" stroke="${P.foldLine}" stroke-width="0.3" stroke-dasharray="4 10" opacity="0.5"/>
            <line x1="260" y1="20" x2="20" y2="260" stroke="${P.foldLine}" stroke-width="0.3" stroke-dasharray="4 10" opacity="0.5"/>
            ${marks}
        </svg>`;
    }

    /* Stage 1 — Vertical rectangle (folded left-to-right) */
    if (stage === 1) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="138" y="22" width="122" height="238" rx="2" fill="${P.back}" opacity="0.5"/>
            <rect x="140" y="20" width="120" height="240" rx="2" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.crease}" stroke-width="2"/>
            <rect x="137" y="20" width="5" height="240" fill="rgba(0,0,0,0.1)" rx="2"/>
            <line x1="200" y1="20" x2="200" y2="260" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 6"/>
            <line x1="140" y1="140" x2="260" y2="140" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 6"/>
            ${marks}
        </svg>`;
    }

    /* Stage 2 — Small square (folded top-down from rectangle) */
    if (stage === 2) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="138" y="138" width="122" height="122" rx="2" fill="${P.back}" opacity="0.5"/>
            <rect x="140" y="140" width="120" height="120" rx="2" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="140" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2"/>
            <line x1="140" y1="140" x2="140" y2="260" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
            <rect x="140" y="137" width="120" height="5" fill="rgba(0,0,0,0.1)" rx="2"/>
            <line x1="140" y1="140" x2="260" y2="260" stroke="${P.foldLine}" stroke-width="0.3" stroke-dasharray="4 8" opacity="0.5"/>
            ${marks}
        </svg>`;
    }

    /* Stage 3 — Rectangle with top-left corner folded (open from square, fold TL) */
    if (stage === 3) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="140" y="20" width="120" height="240" rx="2" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5"/>
            <path d="M140,20 L200,20 L140,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="200" y1="20" x2="140" y2="140" stroke="${P.crease}" stroke-width="1.5"/>
            <path d="M196,24 L144,136" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="4"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.crease}" stroke-width="1.5" opacity="0.4"/>
            ${marks}
        </svg>`;
    }

    /* Stage 4 — Arrow top (both corners folded) */
    if (stage === 4) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="140" y="20" width="120" height="240" rx="2" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5"/>
            <path d="M140,20 L200,20 L140,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <path d="M260,20 L200,20 L260,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="200" y1="20" x2="140" y2="140" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="200" y1="20" x2="260" y2="140" stroke="${P.crease}" stroke-width="1.5"/>
            <path d="M196,24 L144,136 M204,24 L256,136" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="4"/>
            ${marks}
        </svg>`;
    }

    /* Stage 5 — Hat emerging (front bottom flap folded up) */
    if (stage === 5) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <!-- Back body -->
            <rect x="140" y="20" width="120" height="240" fill="${P.back}" opacity="0.4"/>
            <!-- Triangle top -->
            <path d="M200,20 L140,140 L260,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Bottom flap folded up -->
            <rect x="140" y="140" width="120" height="60" rx="1" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Remaining unfolded back -->
            <rect x="140" y="200" width="120" height="60" fill="${P.back}" opacity="0.5"/>
            <line x1="140" y1="200" x2="260" y2="200" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="200" y1="20" x2="140" y2="140" stroke="${P.crease}" stroke-width="1" opacity="0.5"/>
            <line x1="200" y1="20" x2="260" y2="140" stroke="${P.crease}" stroke-width="1" opacity="0.5"/>
            ${marks}
        </svg>`;
    }

    /* Stage 6 — Paper hat complete (both flaps up) */
    if (stage === 6) {
        // Centre the hat in the viewBox for visual balance
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <!-- Back band -->
            <rect x="60" y="162" width="160" height="43" rx="1" fill="${P.back}" opacity="0.6"/>
            <!-- Triangle crown -->
            <path d="M140,30 L60,160 L220,160 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Front band -->
            <rect x="60" y="160" width="160" height="45" rx="1" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Fold creases -->
            <line x1="60" y1="160" x2="220" y2="160" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="140" y1="30" x2="60" y2="160" stroke="${P.crease}" stroke-width="1" opacity="0.4"/>
            <line x1="140" y1="30" x2="220" y2="160" stroke="${P.crease}" stroke-width="1" opacity="0.4"/>
            <!-- Corner tucks -->
            <path d="M60,205 L73,197 L60,197 Z" fill="${P.back}" opacity="0.4"/>
            <path d="M220,205 L207,197 L220,197 Z" fill="${P.back}" opacity="0.4"/>
            ${marks}
        </svg>`;
    }

    /* Stage 7 — Diamond (sides pushed in) */
    if (stage === 7) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <!-- Shadow -->
            <path d="M140,42 L222,142 L140,242 L58,142 Z" fill="${P.shadow}" opacity="0.3" transform="translate(2,2)"/>
            <!-- Diamond body -->
            <path d="M140,40 L220,140 L140,240 L60,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <!-- Fold creases -->
            <line x1="60" y1="140" x2="220" y2="140" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="140" y1="40" x2="140" y2="240" stroke="${P.crease}" stroke-width="1" opacity="0.5"/>
            <!-- Inner detail lines -->
            <line x1="100" y1="90" x2="180" y2="90" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="3 5" opacity="0.4"/>
            <line x1="100" y1="190" x2="180" y2="190" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="3 5" opacity="0.4"/>
            ${marks}
        </svg>`;
    }

    /* Stage 8+ — Boat */
    const gid = extras.gradientId || 'sg_' + Math.random().toString(36).slice(2, 6);
    const sgDef = colors.sailGradient
        ? `<linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${colors.sailGradient[0]}"/><stop offset="100%" style="stop-color:${colors.sailGradient[1]}"/></linearGradient>` : '';
    const sf = colors.sailGradient ? `url(#${gid})` : colors.sail;
    const asp = extras.aspiration ? `<text x="140" y="244" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="8" font-weight="800" font-family="'Plus Jakarta Sans',sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>` : '';
    const fi = extras.flagIcon ? `<text x="157" y="35" text-anchor="middle" font-size="11">${extras.flagIcon}</text>` : '';
    const flag = stage >= 9;

    return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
        ${washiDefs()}
        <defs>${sgDef}</defs>
        <!-- Water reflection -->
        <ellipse cx="140" cy="268" rx="95" ry="5" fill="rgba(59,130,246,0.08)"/>
        <!-- Hull -->
        <path d="M58,195 L78,253 L202,253 L222,195 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <line x1="68" y1="203" x2="212" y2="203" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
        ${asp}
        <!-- Keel -->
        <rect x="135" y="253" width="10" height="12" rx="2" fill="${colors.keel}"/>
        <!-- Mast -->
        <line x1="140" y1="45" x2="140" y2="195" stroke="${colors.mast}" stroke-width="3" stroke-linecap="round"/>
        <!-- Main sail -->
        <path d="M145,55 L145,185 L222,173 Z" fill="${sf}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <!-- Jib sail -->
        <path d="M135,60 L135,180 L75,170 Z" fill="${sf}" opacity="0.5"/>
        <!-- Flag -->
        ${flag ? `<path d="M140,45 L140,25 L166,31 L140,37 Z" fill="${colors.flag}"/>${fi}` : ''}
        ${marks}
    </svg>`;
}

export function haptic(duration = 30) { if (navigator.vibrate) navigator.vibrate(duration); }
export function hapticPattern(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }
