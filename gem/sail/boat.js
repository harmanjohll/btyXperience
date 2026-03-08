/* === Beatty SAIL — Shared Boat Module ===
   Origami SVG generation, SAIL data, fold guides, and shared utilities.
*/

// === PACE MODE ===
export const PACE_MODE = 'audience';

// === BRAND COLORS ===
export const COLORS = { btyBlue: '#000C53', btyYellow: '#FFE200', btyRed: '#EC3237' };

// === DEFAULT BOAT COLORS ===
export const BOAT_DEFAULTS = {
    hull: '#1e3a5f', keel: '#0f2a4a', sail: '#ffffff',
    flag: '#FFE200', mast: '#3d2b1a',
};

// === SAIL PROGRAMME DATA (expanded with sub-questions, insights, pathways) ===
export const SAIL_DATA = {
    S: {
        letter: 'S',
        title: 'Stewardship',
        subtitle: 'The Foundation',
        foldInstruction: 'Fold the paper in half — top edge down to bottom',
        tagline: 'Every great voyage begins with a strong foundation.',
        info: 'Our Leaders for Life Programme (LLP) develops purpose-driven leaders through the Kouzes & Posner Leadership Challenge — Model the Way, Inspire a Shared Vision, Challenge the Process, Enable Others to Act, and Encourage the Heart.',
        question: 'What kind of leader are you?',
        options: [
            { text: 'I lead by example — actions over words', color: '#3b82f6', id: 'model' },
            { text: 'I rally people around a shared vision', color: '#f59e0b', id: 'inspire' },
            { text: 'I challenge the status quo', color: '#ef4444', id: 'challenge' },
            { text: 'I lift others up to shine', color: '#10b981', id: 'enable' },
        ],
        insights: {
            model: 'You believe in leading by example — walking the talk. At Beatty, our LLP helps you Model the Way through community leadership, service learning, and peer mentorship.',
            inspire: 'You have the gift of rallying others around a shared purpose. Our LLP nurtures this through leadership camps, student council, and vision-casting workshops.',
            challenge: 'You are driven to question and improve. Beatty\'s LLP channels this energy through the Challenge the Process framework — innovation projects and critical thinking.',
            enable: 'You shine when others shine. Our LLP helps you Enable Others to Act through peer coaching, collaborative projects, and team-building experiences.',
        },
    },
    A: {
        letter: 'A',
        title: 'Applied Learning',
        subtitle: 'The Structure',
        foldInstruction: 'Fold both top corners down to the centre line',
        tagline: 'Knowledge applied to real-world problems.',
        info: 'Our Applied Learning Programme (ALP) — Think.Create.Innovate — focuses on STEM and Machine Learning for smart living. Through NEXUS@BTY, students connect knowledge across disciplines to tackle real-world problems.',
        question: 'What real-world challenge excites you?',
        options: [
            { text: 'Smart city solutions with AI & data', color: '#8b5cf6', id: 'ai' },
            { text: 'Sustainability & green engineering', color: '#22c55e', id: 'green' },
            { text: 'Robotics & automation for people', color: '#3b82f6', id: 'robotics' },
            { text: 'Creative design & digital media', color: '#ec4899', id: 'creative' },
        ],
        // Sub-question: what subject fuels your passion
        subQuestion: 'Which subject fuels your fire?',
        subOptions: [
            { text: 'Mathematics & Computing', color: '#6366f1', id: 'math' },
            { text: 'Sciences & Engineering', color: '#14b8a6', id: 'science' },
            { text: 'Humanities & Media', color: '#f97316', id: 'humanities' },
            { text: 'Design & Technology', color: '#a855f7', id: 'design' },
        ],
        insights: {
            ai: 'You\'re drawn to the cutting edge — AI and data science. At Beatty, our ALP immerses you in machine learning, smart-living projects, and NEXUS@BTY interdisciplinary challenges.',
            green: 'You care about the planet. Our ALP channels this into sustainability engineering, green innovation projects, and partnerships with environmental organisations.',
            robotics: 'You want to build the future with your hands. Beatty\'s ALP offers robotics clubs, automation workshops, and industry partnerships in engineering.',
            creative: 'You express ideas through design. Our ALP nurtures creative technologists through digital media, design thinking, and cross-disciplinary innovation.',
        },
    },
    I: {
        letter: 'I',
        title: 'International & Industry',
        subtitle: 'The Sail',
        foldInstruction: 'Fold the bottom flaps up on both sides',
        tagline: 'What catches the wind and propels you forward.',
        info: 'From South Korea to New Zealand, Estonia to Japan — our NEXUS exchanges and industry attachments at Rockwell Automation, A*STAR, PIL, and more take learning beyond the classroom and beyond borders.',
        question: 'Where would the wind take you?',
        options: [
            { text: 'South Korea — A.I. & Innovation', color: '#3b82f6', gradient: ['#3b82f6','#60a5fa'], id: 'korea' },
            { text: 'Japan — Culture & Social Sciences', color: '#ec4899', gradient: ['#ec4899','#f9a8d4'], id: 'japan' },
            { text: 'New Zealand — Leadership & Sustainability', color: '#10b981', gradient: ['#10b981','#6ee7b7'], id: 'nz' },
            { text: 'Estonia — Digital & Cyber Innovation', color: '#f59e0b', gradient: ['#f59e0b','#fcd34d'], id: 'estonia' },
        ],
        // Sub-question: industry attachment
        subQuestion: 'Which industry attachment calls to you?',
        subOptions: [
            { text: 'Rockwell Automation — Smart Manufacturing', color: '#3b82f6', id: 'rockwell' },
            { text: 'A*STAR — Research & Innovation', color: '#8b5cf6', id: 'astar' },
            { text: 'PIL — Maritime & Logistics', color: '#0ea5e9', id: 'pil' },
            { text: 'Media & Design Studios', color: '#ec4899', id: 'media' },
        ],
        insights: {
            korea: 'South Korea\'s tech ecosystem is world-leading. Your exchange would immerse you in AI labs, K-innovation culture, and cutting-edge digital infrastructure.',
            japan: 'Japan blends ancient wisdom with modern innovation. You\'d explore cultural depth, social sciences, and how tradition fuels progress.',
            nz: 'New Zealand leads in sustainability and servant leadership. This exchange develops eco-strategists who think globally.',
            estonia: 'Estonia is the world\'s most digital nation. You\'d dive into e-governance, cybersecurity, and digital-first thinking.',
        },
    },
    L: {
        letter: 'L',
        title: 'Learning to Live, Learn & Love',
        subtitle: 'The Flag',
        foldInstruction: 'Pull apart the sides to reveal your boat!',
        tagline: 'Your identity — the values you sail by.',
        info: 'D.R.E.A.M. — Discipline, Resilience, Empathy, Adaptability, Mindfulness. These are the compass bearings that guide every Beattyian\'s voyage through school and life.',
        question: 'Which value is your compass?',
        options: [
            { text: 'Discipline — steady course', color: '#3b82f6', icon: '⚓', id: 'discipline' },
            { text: 'Resilience — weather any storm', color: '#ef4444', icon: '🔥', id: 'resilience' },
            { text: 'Empathy — sail with others', color: '#ec4899', icon: '💙', id: 'empathy' },
            { text: 'Adaptability — shift with the wind', color: '#10b981', icon: '🌊', id: 'adaptability' },
        ],
        insights: {
            discipline: 'Discipline is your anchor. At Beatty, we build this through structured goal-setting, consistent effort, and the discipline to stay the course even when it\'s tough.',
            resilience: 'You bounce back stronger. Beatty\'s character education helps you develop grit and mental toughness through challenges, outdoor education, and CCAs.',
            empathy: 'You feel with others. Our Values-in-Action programme and community partnerships develop deep empathy and compassion in every Beattyian.',
            adaptability: 'You thrive in change. Beatty nurtures flexible thinking through diverse experiences, cross-disciplinary projects, and a growth mindset culture.',
        },
    },
};

// === ARCHETYPE MAP (expanded with richer data) ===
export const ARCHETYPES = {
    korea: {
        name: 'The Innovator',
        quote: '"Technology opens doors — I build what\'s next."',
        persona: 'You are passionate about technology, AI, and building solutions that change the world.',
        recommended: ['AI & Data Science pathway', 'Robotics CCA', 'NEXUS@BTY Innovation Lab'],
    },
    japan: {
        name: 'The Global Explorer',
        quote: '"Every culture holds wisdom worth discovering."',
        persona: 'You are passionate about understanding cultures, social sciences, and connecting across borders.',
        recommended: ['Humanities & Media pathway', 'Cultural Exchange CCA', 'Global Citizens Programme'],
    },
    nz: {
        name: 'The Eco-Strategist',
        quote: '"We don\'t inherit the Earth from our ancestors; we borrow it from our children."',
        persona: 'You are passionate about finding sustainable solutions, analysing environmental systems, and advocating for a greener future.',
        recommended: ['Sustainability @ New Zealand', 'Green Engineering projects', 'Environmental Science pathway'],
    },
    estonia: {
        name: 'The Digital Pioneer',
        quote: '"The digital world is the new frontier — I\'m already there."',
        persona: 'You are passionate about digital innovation, cybersecurity, and building the infrastructure of tomorrow.',
        recommended: ['Cyber & Digital pathway', 'Computing CCA', 'e-Governance workshops'],
    },
};

// === LABEL MAPS ===
export const LABELS = {
    stewardship:   { model: 'Leads by example', inspire: 'Inspires shared vision', challenge: 'Challenges the status quo', enable: 'Lifts others up' },
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

// === LOGO URL ===
export const LOGO_URL = 'https://raw.githubusercontent.com/harmanjohll/btyXperience/fc98005f3682a779482dd1bf5e7cff5f9adb8451/gem/BTlogo.png';

/* ============================================================
   ORIGAMI FOLD STAGES — realistic paper folding
   ============================================================
   Stage 0: Flat square paper (20,20 → 260,260)
   Stage 1: Folded in half top→bottom (rectangle at y=140→260)
   Stage 2: Top corners folded to centre (triangle top + rect)
   Stage 3: Bottom flaps folded up (hat/crown)
   Stage 4: Opened into boat shape — BOAT REVEALED
   Stage 5: Complete boat with flag (memento)
   ============================================================ */

const P = {
    front: '#f5f0e8', back: '#e8e0d0',
    shadow: '#d4c9b8', crease: '#c4b8a8',
    foldShadow: 'rgba(0,0,0,0.08)',
};

// Fold guide coordinates — MUST match the paper geometry in each stage SVG
export const FOLD_GUIDES = [
    // Stage 0→1: Drag top-centre edge down to bottom-centre edge
    { from: { x: 140, y: 22 }, to: { x: 140, y: 258 }, label: 'Fold top to bottom' },
    // Stage 1→2: Drag top-left corner of rectangle to centre
    { from: { x: 22, y: 142 }, to: { x: 140, y: 210 }, label: 'Fold corners to centre' },
    // Stage 2→3: Drag bottom-centre up to the fold line
    { from: { x: 140, y: 258 }, to: { x: 140, y: 163 }, label: 'Fold flaps up' },
    // Stage 3→4: Drag bottom-centre outward/down to open into boat
    { from: { x: 140, y: 218 }, to: { x: 140, y: 262 }, label: 'Pull open to reveal' },
];

/**
 * Build origami paper SVG at a given fold stage.
 * Stages 0–3: pure paper (no boat). Stage 4+: boat.
 */
export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const vb = '0 0 280 280';

    // ---- Stage 0: Flat square ----
    if (stage === 0) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="20" width="240" height="240" rx="2" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.5"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.4"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.4"/>
            <line x1="20" y1="20" x2="260" y2="260" stroke="${P.crease}" stroke-width="0.25" stroke-dasharray="3 8" opacity="0.2"/>
            <line x1="260" y1="20" x2="20" y2="260" stroke="${P.crease}" stroke-width="0.25" stroke-dasharray="3 8" opacity="0.2"/>
        </svg>`;
    }

    // ---- Stage 1: Rectangle (folded in half) ----
    if (stage === 1) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="142" width="240" height="118" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.7" opacity="0.5"/>
            <rect x="20" y="140" width="240" height="120" rx="1" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.2"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2.5" opacity="0.6"/>
            <rect x="20" y="137" width="240" height="6" fill="${P.foldShadow}" rx="3"/>
            <line x1="140" y1="140" x2="140" y2="260" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.3"/>
        </svg>`;
    }

    // ---- Stage 2: Top corners folded to centre ----
    if (stage === 2) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Back layer rectangle -->
            <rect x="20" y="140" width="240" height="120" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.7"/>
            <!-- Left triangle flap -->
            <path d="M20,140 L140,220 L20,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Right triangle flap -->
            <path d="M260,140 L140,220 L260,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Fold shadow under triangles -->
            <path d="M28,148 L140,224 L252,148" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="5"/>
            <!-- Crease lines -->
            <line x1="20" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
            <line x1="260" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2" opacity="0.4"/>
        </svg>`;
    }

    // ---- Stage 3: Hat/crown (bottom flaps folded up) ----
    if (stage === 3) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Triangle body -->
            <path d="M20,160 L140,80 L260,160 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.2"/>
            <!-- Bottom band (folded-up flap, front) -->
            <rect x="20" y="160" width="240" height="58" rx="1" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Bottom band (back, peeking below) -->
            <rect x="20" y="218" width="240" height="6" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.5"/>
            <!-- Shadow under triangle -->
            <path d="M30,160 L140,88 L250,160" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="4"/>
            <!-- Creases -->
            <line x1="20" y1="160" x2="260" y2="160" stroke="${P.crease}" stroke-width="2" opacity="0.5"/>
            <line x1="140" y1="80" x2="140" y2="218" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.25"/>
            <!-- Corner tucks -->
            <path d="M20,218 L34,208 L20,208 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.4"/>
            <path d="M260,218 L246,208 L260,208 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.4"/>
        </svg>`;
    }

    // ---- Stage 4+: Boat revealed ----
    const gid = extras.gradientId || 'sg_' + Math.random().toString(36).slice(2, 6);
    const sailGradientDef = colors.sailGradient
        ? `<linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" style="stop-color:${colors.sailGradient[0]}"/>
             <stop offset="100%" style="stop-color:${colors.sailGradient[1]}"/>
           </linearGradient>` : '';
    const sailFill = colors.sailGradient ? `url(#${gid})` : colors.sail;
    const aspText = extras.aspiration
        ? `<text x="140" y="244" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="8" font-weight="800" font-family="Inter,sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>` : '';
    const flagIcon = extras.flagIcon
        ? `<text x="157" y="35" text-anchor="middle" font-size="11">${extras.flagIcon}</text>` : '';
    const showFlag = stage >= 5;

    return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
        <defs>${sailGradientDef}</defs>
        <!-- Water -->
        <ellipse cx="140" cy="268" rx="95" ry="5" fill="rgba(59,130,246,0.1)"/>
        <!-- Hull -->
        <path d="M58,195 L78,253 L202,253 L222,195 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <line x1="68" y1="203" x2="212" y2="203" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
        <line x1="140" y1="195" x2="140" y2="253" stroke="rgba(255,255,255,0.04)" stroke-width="0.5" stroke-dasharray="3 4"/>
        ${aspText}
        <!-- Keel -->
        <rect x="135" y="253" width="10" height="12" rx="2" fill="${colors.keel}"/>
        <!-- Mast -->
        <line x1="140" y1="45" x2="140" y2="195" stroke="${colors.mast}" stroke-width="3" stroke-linecap="round"/>
        <!-- Main sail -->
        <path d="M145,55 L145,185 L222,173 Z" fill="${sailFill}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <line x1="145" y1="95" x2="192" y2="140" stroke="rgba(0,0,0,0.03)" stroke-width="0.5"/>
        <line x1="145" y1="130" x2="182" y2="158" stroke="rgba(0,0,0,0.02)" stroke-width="0.5"/>
        <!-- Jib -->
        <path d="M135,60 L135,180 L75,170 Z" fill="${sailFill}" opacity="0.5"/>
        ${showFlag ? `<path d="M140,45 L140,25 L166,31 L140,37 Z" fill="${colors.flag}"/>${flagIcon}` : ''}
    </svg>`;
}

// Alias for presenter
export function buildBoatSVG(colors, step, size = 280, extras = {}) {
    if (step >= 4) return buildOrigamiSVG(colors, 5, size, extras);
    if (step >= 1) return buildOrigamiSVG(colors, 4, size, extras);
    return buildOrigamiSVG(colors, 0, size, extras);
}

// === HAPTIC ===
export function haptic(duration = 30) {
    if (navigator.vibrate) navigator.vibrate(duration);
}
