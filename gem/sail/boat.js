/* === Beatty SAIL — Shared Boat Module ===
   Provides boat SVG generation, SAIL data, and shared utilities
   Used by both sailor.html and presenter.html
*/

// === PACE MODE ===
// 'audience' = self-paced (Mentimeter-style, for testing)
// 'presenter' = synced with presenter's pace (for actual OH day)
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
        boatPart: 'Hull',
        foldInstruction: 'Fold up the base to form the hull',
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
        boatPart: 'Keel',
        foldInstruction: 'Crease the centre fold for the keel',
        tagline: 'What gives your journey direction.',
        info: 'Our Applied Learning Programme (ALP) \u2014 Think.Create.Innovate \u2014 focuses on STEM and Machine Learning for smart living. Through NEXUS@BTY, students connect knowledge across disciplines to tackle real-world problems.',
        question: 'What real-world challenge would you tackle?',
        options: [
            { text: 'Smart city solutions with AI & data', color: '#8b5cf6', pattern: 'circuit', id: 'ai' },
            { text: 'Sustainability & green engineering', color: '#22c55e', pattern: 'leaf', id: 'green' },
            { text: 'Robotics & automation for people', color: '#3b82f6', pattern: 'gear', id: 'robotics' },
            { text: 'Creative design & digital media', color: '#ec4899', pattern: 'wave', id: 'creative' },
        ],
    },
    I: {
        letter: 'I',
        title: 'International & Industry',
        subtitle: 'The Sail',
        boatPart: 'Sail',
        foldInstruction: 'Pull up the sail to catch the wind',
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
        boatPart: 'Flag',
        foldInstruction: 'Fold the pennant to fly your colours',
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

// === ARCHETYPE MAP (derived from International choice) ===
export const ARCHETYPES = {
    korea:    { name: 'The Innovator',          quote: 'Technology opens doors \u2014 I build what\'s next.' },
    japan:    { name: 'The Global Explorer',    quote: 'Every culture holds wisdom worth discovering.' },
    nz:       { name: 'The Eco-Strategist',     quote: 'Leadership and sustainability \u2014 charting a greener course.' },
    industry: { name: 'The Industry Trailblazer', quote: 'Real-world experience shapes future-ready leaders.' },
};

// === LABEL MAPS (for presenter spotlight) ===
export const LABELS = {
    stewardship: {
        model: 'Leads by example',
        inspire: 'Inspires shared vision',
        challenge: 'Challenges the status quo',
        enable: 'Lifts others up',
    },
    applied: {
        ai: 'Smart city AI',
        green: 'Green engineering',
        robotics: 'Robotics & automation',
        creative: 'Creative design',
    },
    international: {
        korea: 'South Korea \u2014 A.I.',
        japan: 'Japan \u2014 Culture',
        nz: 'New Zealand \u2014 Leadership',
        industry: 'Industry \u2014 Engineering',
    },
    learning: {
        discipline: '\u2693 Discipline',
        resilience: '\uD83D\uDD25 Resilience',
        empathy: '\uD83D\uDC99 Empathy',
        adaptability: '\uD83C\uDF0A Adaptability',
    },
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

// === ORIGAMI FOLD STAGES ===
// Each stage represents the paper state during the folding process.
// Stage 0: Flat paper (square)
// Stage 1: First fold done — hull shape visible at bottom
// Stage 2: Second fold — keel/centre crease visible
// Stage 3: Third fold — sail pulled up
// Stage 4: Fourth fold — flag attached
// Stage 5: Complete boat (for memento/fleet)

/**
 * Build an origami paper SVG showing the fold progress.
 * This is the participant view — shows the paper transforming into a boat.
 * @param {object} colors - { hull, keel, sail, sailGradient, flag }
 * @param {number} stage - Fold stage 0-5
 * @param {number} size - Width/height in px
 * @param {object} extras - { aspiration, flagIcon, gradientId }
 */
export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const gid = extras.gradientId || 'sailGrad_' + Math.random().toString(36).slice(2, 6);
    const sailGradientDef = colors.sailGradient
        ? `<defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" style="stop-color:${colors.sailGradient[0]};stop-opacity:1"/>
             <stop offset="100%" style="stop-color:${colors.sailGradient[1]};stop-opacity:1"/>
           </linearGradient></defs>`
        : '';
    const sailFill = colors.sailGradient ? `url(#${gid})` : colors.sail;

    if (stage === 0) {
        // Flat square paper with subtle grid lines (origami paper)
        return `<svg viewBox="0 0 280 280" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <rect x="20" y="20" width="240" height="240" rx="2" fill="#f5f0e8" stroke="#d4c9b8" stroke-width="1.5" class="paper-sheet"/>
            <line x1="140" y1="20" x2="140" y2="260" stroke="#e8ddd0" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.6"/>
            <line x1="20" y1="140" x2="260" y2="140" stroke="#e8ddd0" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.6"/>
            <line x1="20" y1="20" x2="260" y2="260" stroke="#e8ddd0" stroke-width="0.3" stroke-dasharray="3 6" opacity="0.4"/>
            <line x1="260" y1="20" x2="20" y2="260" stroke="#e8ddd0" stroke-width="0.3" stroke-dasharray="3 6" opacity="0.4"/>
            <text x="140" y="145" text-anchor="middle" fill="#c4b8a8" font-size="10" font-family="Inter,sans-serif" font-weight="600" letter-spacing="3" opacity="0.5">FOLD ME</text>
        </svg>`;
    }

    if (stage === 1) {
        // Paper with bottom folded up — hull shape emerging
        return `<svg viewBox="0 0 280 280" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Upper paper (still flat) -->
            <path d="M20,20 L260,20 L260,170 L20,170 Z" fill="#f5f0e8" stroke="#d4c9b8" stroke-width="1"/>
            <line x1="140" y1="20" x2="140" y2="170" stroke="#e8ddd0" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.4"/>
            <!-- Fold crease line -->
            <line x1="20" y1="170" x2="260" y2="170" stroke="#b8a898" stroke-width="2" opacity="0.8"/>
            <!-- Folded hull section -->
            <path d="M50,170 L70,240 L210,240 L230,170 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.2)" stroke-width="1" class="boat-hull"/>
            <line x1="60" y1="180" x2="220" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
            <!-- Paper shadow on fold -->
            <rect x="20" y="168" width="240" height="4" fill="rgba(0,0,0,0.06)" rx="2"/>
        </svg>`;
    }

    if (stage === 2) {
        // Hull + centre keel fold
        return `<svg viewBox="0 0 280 280" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            <!-- Upper paper -->
            <path d="M30,20 L250,20 L250,160 L30,160 Z" fill="#f5f0e8" stroke="#d4c9b8" stroke-width="1"/>
            <!-- Centre fold crease -->
            <line x1="140" y1="20" x2="140" y2="260" stroke="#b8a898" stroke-width="2" opacity="0.6"/>
            <!-- Hull -->
            <path d="M50,170 L70,240 L210,240 L230,170 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.2)" stroke-width="1" class="boat-hull"/>
            <line x1="60" y1="180" x2="220" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
            <!-- Keel -->
            <rect x="134" y="240" width="12" height="20" rx="2" fill="${colors.keel}" class="boat-keel"/>
            <!-- Fold shadow -->
            <rect x="30" y="158" width="220" height="4" fill="rgba(0,0,0,0.06)" rx="2"/>
            <!-- Mast starting to emerge -->
            <line x1="140" y1="80" x2="140" y2="170" stroke="${colors.mast}" stroke-width="3" stroke-linecap="round" opacity="0.4" class="boat-mast"/>
        </svg>`;
    }

    if (stage === 3) {
        // Hull + keel + sail pulled up
        return `<svg viewBox="0 0 280 280" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${sailGradientDef}
            <!-- Remaining paper corner (top-left) -->
            <path d="M20,20 L60,20 L30,50 Z" fill="#f5f0e8" stroke="#d4c9b8" stroke-width="0.5" opacity="0.4"/>
            <!-- Water reflection -->
            <ellipse cx="140" cy="268" rx="100" ry="6" fill="rgba(59,130,246,0.1)"/>
            <!-- Hull -->
            <path d="M55,185 L75,245 L205,245 L225,185 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.15)" stroke-width="1" class="boat-hull"/>
            <line x1="65" y1="195" x2="215" y2="195" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
            <!-- Keel -->
            <rect x="134" y="245" width="12" height="18" rx="2" fill="${colors.keel}" class="boat-keel"/>
            <!-- Mast -->
            <line x1="140" y1="50" x2="140" y2="185" stroke="${colors.mast}" stroke-width="3.5" stroke-linecap="round" class="boat-mast"/>
            <!-- Main sail (right) -->
            <path d="M146,58 L146,175 L225,165 Z" fill="${sailFill}" stroke="rgba(255,255,255,0.2)" stroke-width="1" class="boat-sail"/>
            <line x1="146" y1="95" x2="195" y2="135" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>
            <line x1="146" y1="130" x2="185" y2="155" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
            <!-- Jib sail (left, smaller) -->
            <path d="M134,65 L134,170 L75,162 Z" fill="${sailFill}" opacity="0.6" class="boat-sail"/>
        </svg>`;
    }

    if (stage >= 4) {
        // Complete boat with flag
        const aspirationText = extras.aspiration
            ? `<text x="140" y="240" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="9" font-weight="800" font-family="Inter,sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>`
            : '';

        const flagIconText = extras.flagIcon
            ? `<text x="155" y="33" text-anchor="middle" font-size="12">${extras.flagIcon}</text>`
            : '';

        return `<svg viewBox="0 0 280 280" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${sailGradientDef}
            <!-- Water reflection -->
            <ellipse cx="140" cy="268" rx="100" ry="6" fill="rgba(59,130,246,0.12)"/>
            <!-- Hull -->
            <path d="M55,192 L75,250 L205,250 L225,192 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.15)" stroke-width="1" class="boat-hull"/>
            <line x1="65" y1="202" x2="215" y2="202" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
            <!-- Aspiration on hull -->
            ${aspirationText}
            <!-- Keel -->
            <rect x="134" y="250" width="12" height="16" rx="2" fill="${colors.keel}" class="boat-keel"/>
            <!-- Mast -->
            <line x1="140" y1="42" x2="140" y2="192" stroke="${colors.mast}" stroke-width="3.5" stroke-linecap="round" class="boat-mast"/>
            <!-- Main sail (right) -->
            <path d="M146,52 L146,182 L228,170 Z" fill="${sailFill}" stroke="rgba(255,255,255,0.2)" stroke-width="1" class="boat-sail"/>
            <line x1="146" y1="90" x2="198" y2="135" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>
            <line x1="146" y1="130" x2="188" y2="158" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
            <!-- Jib sail (left) -->
            <path d="M134,58 L134,178 L72,168 Z" fill="${sailFill}" opacity="0.6" class="boat-sail"/>
            <!-- Flag -->
            <path d="M140,42 L140,22 L168,28 L140,34 Z" fill="${colors.flag}" class="boat-flag"/>
            ${flagIconText}
        </svg>`;
    }
}

// Keep buildBoatSVG as alias for presenter compatibility
export function buildBoatSVG(colors, step, size = 280, extras = {}) {
    return buildOrigamiSVG(colors, step >= 1 ? Math.min(step, 5) : 0, size, extras);
}

// === HAPTIC FEEDBACK ===
export function haptic(duration = 30) {
    if (navigator.vibrate) navigator.vibrate(duration);
}
