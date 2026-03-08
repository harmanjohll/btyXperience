/* === Beatty SAIL — Shared Boat Module ===
   Provides origami SVG generation, SAIL data, and shared utilities.
   Used by both sailor.html and presenter.html.
*/

// === PACE MODE ===
export const PACE_MODE = 'audience';

// === BRAND COLORS ===
export const COLORS = {
    btyBlue: '#000C53',
    btyYellow: '#FFE200',
    btyRed: '#EC3237',
};

// === DEFAULT BOAT COLORS ===
export const BOAT_DEFAULTS = {
    hull: '#1e3a5f',
    keel: '#0f2a4a',
    sail: '#ffffff',
    flag: '#FFE200',
    mast: '#3d2b1a',
};

// === SAIL PROGRAMME DATA ===
export const SAIL_DATA = {
    S: {
        letter: 'S',
        title: 'Stewardship',
        subtitle: 'The Foundation',
        foldInstruction: 'Fold the paper in half',
        tagline: 'Every great voyage begins with a strong foundation.',
        info: 'Our Leaders for Life Programme (LLP) develops purpose-driven leaders through the Kouzes & Posner Leadership Challenge \u2014 Model the Way, Inspire a Shared Vision, Challenge the Process, Enable Others to Act, and Encourage the Heart.',
        question: 'What kind of leader are you?',
        options: [
            { text: 'I lead by example \u2014 actions over words', color: '#3b82f6', id: 'model' },
            { text: 'I rally people around a shared vision', color: '#f59e0b', id: 'inspire' },
            { text: 'I challenge the status quo', color: '#ef4444', id: 'challenge' },
            { text: 'I lift others up to shine', color: '#10b981', id: 'enable' },
        ],
    },
    A: {
        letter: 'A',
        title: 'Applied Learning',
        subtitle: 'The Structure',
        foldInstruction: 'Fold the corners down to the centre',
        tagline: 'What gives your journey direction.',
        info: 'Our Applied Learning Programme (ALP) \u2014 Think.Create.Innovate \u2014 focuses on STEM and Machine Learning for smart living. Through NEXUS@BTY, students connect knowledge across disciplines to tackle real-world problems.',
        question: 'What real-world challenge would you tackle?',
        options: [
            { text: 'Smart city solutions with AI & data', color: '#8b5cf6', id: 'ai' },
            { text: 'Sustainability & green engineering', color: '#22c55e', id: 'green' },
            { text: 'Robotics & automation for people', color: '#3b82f6', id: 'robotics' },
            { text: 'Creative design & digital media', color: '#ec4899', id: 'creative' },
        ],
    },
    I: {
        letter: 'I',
        title: 'International & Industry',
        subtitle: 'The Sail',
        foldInstruction: 'Fold the flaps up on both sides',
        tagline: 'What catches the wind and propels you forward.',
        info: 'From South Korea to New Zealand, Estonia to Japan \u2014 our NEXUS exchanges and industry attachments at Rockwell Automation, A*STAR, PIL, and more take learning beyond the classroom and beyond borders.',
        question: 'Where would the wind take you?',
        options: [
            { text: 'South Korea \u2014 A.I. & Innovation', color: '#3b82f6', gradient: ['#3b82f6','#60a5fa'], id: 'korea' },
            { text: 'Japan \u2014 Culture & Social Sciences', color: '#ec4899', gradient: ['#ec4899','#f9a8d4'], id: 'japan' },
            { text: 'New Zealand \u2014 Leadership & Sustainability', color: '#10b981', gradient: ['#10b981','#6ee7b7'], id: 'nz' },
            { text: 'Industry \u2014 Engineering & Maritime', color: '#f59e0b', gradient: ['#f59e0b','#fcd34d'], id: 'industry' },
        ],
    },
    L: {
        letter: 'L',
        title: 'Learning to Live, Learn & Love',
        subtitle: 'The Flag',
        foldInstruction: 'Open and pull apart to reveal the boat',
        tagline: 'Your identity \u2014 the values you sail by.',
        info: 'D.R.E.A.M. \u2014 Discipline, Resilience, Empathy, Adaptability, Mindfulness. These are the compass bearings that guide every Beattyian\'s voyage.',
        question: 'Which value is your compass?',
        options: [
            { text: 'Discipline \u2014 steady course', color: '#3b82f6', icon: '\u2693', id: 'discipline' },
            { text: 'Resilience \u2014 weather any storm', color: '#ef4444', icon: '\uD83D\uDD25', id: 'resilience' },
            { text: 'Empathy \u2014 sail with others', color: '#ec4899', icon: '\uD83D\uDC99', id: 'empathy' },
            { text: 'Adaptability \u2014 shift with the wind', color: '#10b981', icon: '\uD83C\uDF0A', id: 'adaptability' },
        ],
    },
};

// === ARCHETYPE MAP ===
export const ARCHETYPES = {
    korea:    { name: 'The Innovator',           quote: 'Technology opens doors \u2014 I build what\'s next.' },
    japan:    { name: 'The Global Explorer',     quote: 'Every culture holds wisdom worth discovering.' },
    nz:       { name: 'The Eco-Strategist',      quote: 'Leadership and sustainability \u2014 charting a greener course.' },
    industry: { name: 'The Industry Trailblazer', quote: 'Real-world experience shapes future-ready leaders.' },
};

// === LABEL MAPS ===
export const LABELS = {
    stewardship:   { model: 'Leads by example', inspire: 'Inspires shared vision', challenge: 'Challenges the status quo', enable: 'Lifts others up' },
    applied:       { ai: 'Smart city AI', green: 'Green engineering', robotics: 'Robotics & automation', creative: 'Creative design' },
    international: { korea: 'South Korea \u2014 A.I.', japan: 'Japan \u2014 Culture', nz: 'New Zealand \u2014 Leadership', industry: 'Industry \u2014 Engineering' },
    learning:      { discipline: '\u2693 Discipline', resilience: '\uD83D\uDD25 Resilience', empathy: '\uD83D\uDC99 Empathy', adaptability: '\uD83C\uDF0A Adaptability' },
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
   Stage 0: Flat square of paper
   Stage 1: Folded in half (top edge down to bottom) — rectangle
   Stage 2: Top corners folded down to centre — triangle top + rect bottom
   Stage 3: Bottom flaps folded up — hat/triangle shape
   Stage 4: Opened and pulled apart — BOAT REVEALED
   Stage 5: Complete boat with flag (for memento)
   ============================================================ */

// Paper colors (cream with slight shadow tones)
const P = {
    front: '#f5f0e8',
    back:  '#e8e0d0',
    shadow: '#d4c9b8',
    crease: '#c4b8a8',
    foldShadow: 'rgba(0,0,0,0.08)',
};

// Fold source/target coordinates per stage (in SVG viewBox 0 0 280 280)
// Each has: from {x,y}, to {x,y}, description
export const FOLD_GUIDES = [
    // Stage 0 → 1: drag top edge down to bottom
    { from: { x: 140, y: 30 },  to: { x: 140, y: 250 }, label: 'Fold top to bottom' },
    // Stage 1 → 2: drag top-left corner to centre, then top-right
    { from: { x: 30, y: 30 },   to: { x: 140, y: 155 }, label: 'Fold corners to centre' },
    // Stage 2 → 3: drag bottom-left flap up
    { from: { x: 60, y: 250 },  to: { x: 60, y: 155 },  label: 'Fold bottom flaps up' },
    // Stage 3 → 4: pull left and right apart to open into boat
    { from: { x: 80, y: 140 },  to: { x: 30, y: 200 },  label: 'Pull open to reveal' },
];

/**
 * Build an origami SVG at a given fold stage.
 * Stages 0-3 are pure paper (no boat). Stage 4+ is the boat.
 */
export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const vb = '0 0 280 280';

    // ---- Stage 0: Flat square paper ----
    if (stage === 0) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Paper -->
            <rect x="20" y="20" width="240" height="240" rx="2" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.5"/>
            <!-- Faint grid -->
            <line x1="140" y1="20" x2="140" y2="260" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.4"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.4"/>
            <line x1="20" y1="20" x2="260" y2="260" stroke="${P.crease}" stroke-width="0.25" stroke-dasharray="3 8" opacity="0.25"/>
            <line x1="260" y1="20" x2="20" y2="260" stroke="${P.crease}" stroke-width="0.25" stroke-dasharray="3 8" opacity="0.25"/>
            <!-- Subtle paper texture -->
            <rect x="20" y="20" width="240" height="240" rx="2" fill="url(#paperNoise)" opacity="0.03"/>
            <defs><filter id="pn"><feTurbulence baseFrequency="0.8" numOctaves="4" seed="2"/></filter>
            <rect id="paperNoise" width="100%" height="100%" filter="url(#pn)"/></defs>
        </svg>`;
    }

    // ---- Stage 1: Folded in half (rectangle, two layers) ----
    if (stage === 1) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Bottom layer (back of paper, slightly visible) -->
            <rect x="20" y="140" width="240" height="122" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.8" opacity="0.5"/>
            <!-- Top layer (folded down) -->
            <rect x="20" y="140" width="240" height="120" rx="1" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.2"/>
            <!-- Fold crease at top -->
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2.5" opacity="0.7"/>
            <!-- Fold shadow below crease -->
            <rect x="20" y="137" width="240" height="6" fill="${P.foldShadow}" rx="3"/>
            <!-- Faint centre guide -->
            <line x1="140" y1="140" x2="140" y2="260" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.35"/>
            <!-- Paper edge detail -->
            <line x1="22" y1="258" x2="258" y2="258" stroke="${P.shadow}" stroke-width="0.5" opacity="0.4"/>
        </svg>`;
    }

    // ---- Stage 2: Top corners folded to centre (triangle top) ----
    if (stage === 2) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Rectangle body (back layer, visible below triangles) -->
            <rect x="20" y="140" width="240" height="120" rx="1" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.8"/>
            <!-- Left triangle fold (front paper folded over) -->
            <path d="M20,140 L140,230 L20,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="0.8" opacity="0.4"/>
            <!-- Right triangle fold -->
            <path d="M260,140 L140,230 L260,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="0.8" opacity="0.4"/>
            <!-- Top triangle — left flap -->
            <path d="M20,140 L140,230 L20,140 Z" fill="none"/>
            <path d="M20,140 L140,220 L20,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Top triangle — right flap -->
            <path d="M260,140 L140,220 L260,260 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Shadow under triangle folds -->
            <path d="M25,145 L140,228 L255,145" fill="none" stroke="${P.foldShadow}" stroke-width="4" opacity="0.5"/>
            <!-- Crease lines (diagonal folds) -->
            <line x1="20" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.6"/>
            <line x1="260" y1="140" x2="140" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.6"/>
            <!-- Horizontal crease from stage 1 -->
            <line x1="20" y1="140" x2="260" y2="140" stroke="${P.crease}" stroke-width="2" opacity="0.5"/>
            <!-- Bottom edge detail -->
            <line x1="22" y1="258" x2="258" y2="258" stroke="${P.shadow}" stroke-width="0.5" opacity="0.4"/>
        </svg>`;
    }

    // ---- Stage 3: Bottom flaps folded up (hat/crown shape) ----
    if (stage === 3) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Back layer of hat body -->
            <path d="M20,160 L140,230 L260,160 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.6"/>
            <!-- Bottom flap folded up — front -->
            <path d="M20,220 L260,220 L260,160 L20,160 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1"/>
            <!-- Bottom flap folded up — back (behind, peeking) -->
            <path d="M20,224 L260,224 L260,220 L20,220 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.6"/>
            <!-- Triangle point at top -->
            <path d="M20,160 L140,80 L260,160 Z" fill="${P.front}" stroke="${P.shadow}" stroke-width="1.2"/>
            <!-- Shadow under the triangle point -->
            <path d="M30,160 L140,88 L250,160" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="5"/>
            <!-- Crease lines -->
            <line x1="20" y1="160" x2="260" y2="160" stroke="${P.crease}" stroke-width="2" opacity="0.6"/>
            <line x1="20" y1="220" x2="260" y2="220" stroke="${P.crease}" stroke-width="1.5" opacity="0.5"/>
            <!-- Centre line -->
            <line x1="140" y1="80" x2="140" y2="220" stroke="${P.crease}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.3"/>
            <!-- Corner tucks (tiny triangles at bottom corners) -->
            <path d="M20,220 L35,210 L20,210 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.5"/>
            <path d="M260,220 L245,210 L260,210 Z" fill="${P.back}" stroke="${P.shadow}" stroke-width="0.5" opacity="0.5"/>
        </svg>`;
    }

    // ---- Stage 4+: Boat revealed! ----
    const gid = extras.gradientId || 'sg_' + Math.random().toString(36).slice(2, 6);
    const sailGradientDef = colors.sailGradient
        ? `<linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" style="stop-color:${colors.sailGradient[0]};stop-opacity:1"/>
             <stop offset="100%" style="stop-color:${colors.sailGradient[1]};stop-opacity:1"/>
           </linearGradient>`
        : '';
    const sailFill = colors.sailGradient ? `url(#${gid})` : colors.sail;

    const aspirationText = extras.aspiration
        ? `<text x="140" y="242" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="9" font-weight="800" font-family="Inter,sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>`
        : '';
    const flagIconText = extras.flagIcon
        ? `<text x="155" y="33" text-anchor="middle" font-size="12">${extras.flagIcon}</text>`
        : '';

    // Show flag only at stage 5 (after L choice)
    const showFlag = stage >= 5;

    return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
        <defs>${sailGradientDef}</defs>
        <!-- Water reflection -->
        <ellipse cx="140" cy="268" rx="100" ry="6" fill="rgba(59,130,246,0.12)"/>
        <!-- Origami paper texture on hull -->
        <path d="M55,192 L75,252 L205,252 L225,192 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <!-- Paper fold lines on hull (origami feel) -->
        <line x1="65" y1="200" x2="215" y2="200" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
        <line x1="140" y1="192" x2="140" y2="252" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" stroke-dasharray="3 4"/>
        ${aspirationText}
        <!-- Keel -->
        <rect x="134" y="252" width="12" height="14" rx="2" fill="${colors.keel}"/>
        <!-- Mast -->
        <line x1="140" y1="42" x2="140" y2="192" stroke="${colors.mast}" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Main sail (right) — paper-like with fold lines -->
        <path d="M146,52 L146,182 L228,170 Z" fill="${sailFill}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <line x1="146" y1="90" x2="198" y2="140" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
        <line x1="146" y1="130" x2="188" y2="160" stroke="rgba(0,0,0,0.03)" stroke-width="0.5"/>
        <!-- Jib sail (left) -->
        <path d="M134,58 L134,178 L72,168 Z" fill="${sailFill}" opacity="0.55"/>
        ${showFlag ? `<!-- Flag -->
        <path d="M140,42 L140,22 L168,28 L140,34 Z" fill="${colors.flag}"/>
        ${flagIconText}` : ''}
    </svg>`;
}

// Alias for presenter backward-compatibility
export function buildBoatSVG(colors, step, size = 280, extras = {}) {
    // Presenter uses step 1-4 as SAIL steps; map to origami stage 4/5
    if (step >= 4) return buildOrigamiSVG(colors, 5, size, extras);
    if (step >= 1) return buildOrigamiSVG(colors, 4, size, extras);
    return buildOrigamiSVG(colors, 0, size, extras);
}

// === HAPTIC FEEDBACK ===
export function haptic(duration = 30) {
    if (navigator.vibrate) navigator.vibrate(duration);
}
