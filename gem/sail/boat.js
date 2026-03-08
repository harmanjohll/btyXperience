/* === Beatty SAIL — Shared Boat Module ===
   Provides boat SVG generation, SAIL data, and shared utilities
   Used by both sailor.html and presenter.html
*/

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
    mast: '#2d1f0f',
};

// === SAIL PROGRAMME DATA ===
export const SAIL_DATA = {
    S: {
        letter: 'S',
        title: 'Stewardship',
        subtitle: 'The Foundation',
        boatPart: 'Hull',
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

// === BOAT SVG BUILDER ===
/**
 * Build a sailboat SVG string.
 * @param {object} colors - { hull, keel, sail, sailGradient, flag }
 * @param {number} step - How many folds completed (0-5). Controls opacity of parts.
 * @param {number} size - Width/height in px.
 * @param {object} extras - { aspiration, flagIcon, gradientId }
 */
export function buildBoatSVG(colors, step, size = 280, extras = {}) {
    const hullOpacity  = step >= 1 ? 1 : 0.15;
    const keelOpacity  = step >= 2 ? 1 : 0.08;
    const mastOpacity  = step >= 2 ? 1 : 0.08;
    const sailOpacity  = step >= 3 ? 1 : 0.08;
    const flagOpacity  = step >= 4 ? 1 : 0.08;

    const gid = extras.gradientId || 'sailGrad';
    const sailGradientDef = colors.sailGradient
        ? `<defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" style="stop-color:${colors.sailGradient[0]};stop-opacity:1"/>
             <stop offset="100%" style="stop-color:${colors.sailGradient[1]};stop-opacity:1"/>
           </linearGradient></defs>`
        : '';
    const sailFill = colors.sailGradient ? `url(#${gid})` : colors.sail;

    const aspirationText = extras.aspiration
        ? `<text x="140" y="215" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="11" font-weight="900" font-family="Inter,sans-serif" letter-spacing="2">${extras.aspiration.toUpperCase()}</text>`
        : '';

    const flagIconText = extras.flagIcon
        ? `<text x="153" y="52" text-anchor="middle" font-size="14">${extras.flagIcon}</text>`
        : '';

    return `<svg viewBox="0 0 280 280" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="boat-svg">
    ${sailGradientDef}
    <ellipse cx="140" cy="240" rx="120" ry="8" fill="rgba(59,130,246,0.15)" opacity="${hullOpacity}"/>
    <path d="M60,200 L80,235 L200,235 L220,200 Z" fill="${colors.hull}" opacity="${hullOpacity}" class="boat-hull" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <line x1="70" y1="205" x2="210" y2="205" stroke="rgba(255,255,255,0.15)" stroke-width="1" opacity="${hullOpacity}"/>
    ${aspirationText}
    <rect x="135" y="195" width="10" height="45" rx="2" fill="${colors.keel}" opacity="${keelOpacity}" class="boat-keel"/>
    <line x1="140" y1="55" x2="140" y2="200" stroke="#3d2b1a" stroke-width="4" stroke-linecap="round" opacity="${mastOpacity}" class="boat-mast"/>
    <path d="M145,65 L145,185 L230,175 Z" fill="${sailFill}" opacity="${sailOpacity}" class="boat-sail" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <line x1="145" y1="100" x2="200" y2="145" stroke="rgba(0,0,0,0.06)" stroke-width="1" opacity="${sailOpacity}"/>
    <line x1="145" y1="140" x2="190" y2="165" stroke="rgba(0,0,0,0.04)" stroke-width="1" opacity="${sailOpacity}"/>
    <path d="M135,70 L135,180 L70,170 Z" fill="${sailFill}" opacity="${sailOpacity * 0.7}" class="boat-sail"/>
    <path d="M140,55 L140,35 L165,42 L140,49 Z" fill="${colors.flag}" opacity="${flagOpacity}" class="boat-flag"/>
    ${flagIconText}
</svg>`;
}

// === HAPTIC FEEDBACK ===
export function haptic(duration = 30) {
    if (navigator.vibrate) navigator.vibrate(duration);
}
