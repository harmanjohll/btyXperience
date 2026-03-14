/* ═══════════════════════════════════════════════════════════════
   btyXperience — Boat SVG Module (Visual Only)
   Origami paper-boat fold stages, washi paper aesthetics.
   Extracted from gem/sail/boat.js — no data, no Firebase.
   ═══════════════════════════════════════════════════════════════ */

export const BOAT_DEFAULTS = {
    hull: '#4a3728', keel: '#3a2a1e', sail: '#f5f0e8',
    flag: '#FFE200', mast: '#3d2b1a',
};

/* ── WASHI PAPER PALETTE ── */
const P = {
    front:     '#f5f0e8',
    back:      '#f5f0e8',
    layer:     'rgba(90,65,35,0.06)',
    shadow:    '#c9bfae',
    crease:    'rgba(90,65,35,0.35)',
    foldLine:  'rgba(90,65,35,0.12)',
    highlight: 'rgba(255,255,255,0.4)',
};

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

/* ── FOLD ANIMATION DATA ── */
export const FOLD_GUIDES = [
    { from: { x: 140, y: 38 },  to: { x: 140, y: 242 }, label: 'Top edge to bottom' },
    { from: { x: 38, y: 90 },   to: { x: 135, y: 170 }, label: 'Corner to centre' },
    { from: { x: 242, y: 90 },  to: { x: 145, y: 170 }, label: 'Corner to centre' },
    { from: { x: 140, y: 192 }, to: { x: 140, y: 158 }, label: 'Brim up' },
    { from: { x: 140, y: 192 }, to: { x: 140, y: 158 }, label: 'Back brim up' },
    { from: { x: 242, y: 132 }, to: { x: 58, y: 132 },  label: 'Push sides' },
    { from: { x: 140, y: 225 }, to: { x: 140, y: 58 },  label: 'Bottom up' },
    { from: { x: 140, y: 55 },  to: { x: 140, y: 210 }, label: 'Pull apart!' },
];

export const CREASE_LINES = [
    { x1: 30,  y1: 140, x2: 250, y2: 140 },
    { x1: 140, y1: 85,  x2: 30,  y2: 175 },
    { x1: 140, y1: 85,  x2: 250, y2: 175 },
    { x1: 30,  y1: 175, x2: 250, y2: 175 },
    { x1: 30,  y1: 175, x2: 250, y2: 175 },
    { x1: 140, y1: 85,  x2: 140, y2: 175 },
    { x1: 50,  y1: 140, x2: 230, y2: 140 },
    { x1: 50,  y1: 140, x2: 230, y2: 140 },
];

export const FOLD_FLAPS = [
    { clipFrom: 'polygon(11% 11%, 89% 11%, 89% 50%, 11% 50%)',
      clipTo:   'polygon(11% 50%, 89% 50%, 89% 89%, 11% 89%)',
      axis: '50% 50%', rotate: 'rotateX', maxDeg: 180 },
    { clipFrom: 'polygon(11% 30%, 50% 30%, 11% 63%)',
      clipTo:   'polygon(50% 30%, 11% 63%, 50% 63%)',
      axis: '50% 30%', rotate: 'rotateY', maxDeg: 0 },
    { clipFrom: 'polygon(89% 30%, 50% 30%, 89% 63%)',
      clipTo:   'polygon(50% 30%, 89% 63%, 50% 63%)',
      axis: '50% 30%', rotate: 'rotateY', maxDeg: 0 },
    { clipFrom: 'polygon(11% 63%, 89% 63%, 89% 70%, 11% 70%)',
      clipTo:   'polygon(11% 56%, 89% 56%, 89% 63%, 11% 63%)',
      axis: '50% 63%', rotate: 'rotateX', maxDeg: -180 },
    { clipFrom: 'polygon(11% 63%, 89% 63%, 89% 70%, 11% 70%)',
      clipTo:   'polygon(11% 56%, 89% 56%, 89% 63%, 11% 63%)',
      axis: '50% 63%', rotate: 'rotateX', maxDeg: -180 },
    { clipFrom: null, clipTo: null, axis: '50% 50%', rotate: 'rotateY', maxDeg: 0 },
    { clipFrom: 'polygon(18% 50%, 82% 50%, 50% 82%)',
      clipTo:   'polygon(18% 50%, 82% 50%, 50% 18%)',
      axis: '50% 50%', rotate: 'rotateX', maxDeg: -180 },
    { clipFrom: null, clipTo: null, axis: '50% 50%', rotate: 'rotateY', maxDeg: 0 },
];

export const FOLD_LABELS = [
    'Fold the paper in half — top edge down to the bottom',
    'Fold the top-left corner down to the centre',
    'Fold the top-right corner down to match',
    'Fold the front bottom strip upward',
    'Flip and fold the back strip up too',
    'Push both sides together — flatten into a diamond',
    'Fold the bottom point up to the top',
    'Pull the sides apart — reveal your boat!',
];

/* ══════════════════════════════════════════════════════════════
   BUILD ORIGAMI SVG — 10 stages (0-9), all centred in 280×280 viewBox
   ══════════════════════════════════════════════════════════════ */
export function buildOrigamiSVG(colors, stage, size = 280, extras = {}) {
    const vb = '0 0 280 280';
    const marks = extras.marks ? renderMarks(extras.marks, stage) : '';

    if (stage === 0) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="30" y="30" width="220" height="220" rx="3" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="1"/>
            <line x1="30" y1="140" x2="250" y2="140" stroke="${P.foldLine}" stroke-width="0.6" stroke-dasharray="6 8"/>
            <line x1="140" y1="30" x2="140" y2="250" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 10" opacity="0.5"/>
            ${marks}
        </svg>`;
    }

    if (stage === 1) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="28" y="87" width="224" height="110" rx="2" fill="${P.shadow}" opacity="0.25"/>
            <rect x="30" y="85" width="220" height="110" rx="2" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="30" y1="85" x2="250" y2="85" stroke="${P.crease}" stroke-width="2"/>
            <rect x="30" y="82" width="220" height="5" fill="rgba(0,0,0,0.08)" rx="2"/>
            <line x1="140" y1="85" x2="140" y2="195" stroke="${P.foldLine}" stroke-width="0.5" stroke-dasharray="5 7"/>
            ${marks}
        </svg>`;
    }

    if (stage === 2) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="30" y="85" width="220" height="110" rx="2" fill="${P.front}" ${wf} stroke="${P.shadow}" stroke-width="0.5"/>
            <path d="M30,85 L140,85 L30,175 Z" fill="${P.layer}"/>
            <path d="M30,85 L140,85 L30,175 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.6"/>
            <line x1="140" y1="85" x2="30" y2="175" stroke="${P.crease}" stroke-width="1.8"/>
            <path d="M136,89 L34,171" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="4"/>
            <line x1="140" y1="85" x2="250" y2="175" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 8" opacity="0.4"/>
            <line x1="30" y1="85" x2="250" y2="85" stroke="${P.crease}" stroke-width="1.2" opacity="0.4"/>
            ${marks}
        </svg>`;
    }

    if (stage === 3) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="30" y="175" width="220" height="20" rx="1" fill="${P.front}" ${wf} stroke="${P.shadow}" stroke-width="0.5"/>
            <rect x="30" y="175" width="220" height="20" rx="1" fill="${P.layer}"/>
            <path d="M140,85 L30,175 L250,175 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="140" y1="85" x2="30" y2="175" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="140" y1="85" x2="250" y2="175" stroke="${P.crease}" stroke-width="1.5"/>
            <path d="M136,89 L34,171 M144,89 L246,171" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="4"/>
            <line x1="30" y1="85" x2="250" y2="85" stroke="${P.crease}" stroke-width="1" opacity="0.3"/>
            <line x1="30" y1="175" x2="250" y2="175" stroke="${P.foldLine}" stroke-width="0.5" stroke-dasharray="4 6" opacity="0.5"/>
            ${marks}
        </svg>`;
    }

    if (stage === 4) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <rect x="30" y="175" width="220" height="20" rx="1" fill="${P.front}" ${wf} opacity="0.85"/>
            <rect x="30" y="175" width="220" height="20" rx="1" fill="${P.layer}"/>
            <path d="M140,85 L30,175 L250,175 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <rect x="30" y="156" width="220" height="19" rx="1" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.6"/>
            <line x1="30" y1="175" x2="250" y2="175" stroke="${P.crease}" stroke-width="1.8"/>
            <line x1="140" y1="85" x2="30" y2="175" stroke="${P.crease}" stroke-width="1" opacity="0.4"/>
            <line x1="140" y1="85" x2="250" y2="175" stroke="${P.crease}" stroke-width="1" opacity="0.4"/>
            ${marks}
        </svg>`;
    }

    if (stage === 5) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <path d="M142,87 L32,177 L252,177 Z" fill="${P.shadow}" opacity="0.2" transform="translate(2,2)"/>
            <path d="M140,85 L30,175 L250,175 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <rect x="30" y="159" width="220" height="16" rx="1" fill="${P.front}" ${wf} opacity="0.85"/>
            <rect x="30" y="159" width="220" height="16" rx="1" fill="${P.layer}"/>
            <rect x="30" y="157" width="220" height="18" rx="1" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.6"/>
            <line x1="30" y1="175" x2="250" y2="175" stroke="${P.crease}" stroke-width="1.5"/>
            <line x1="140" y1="85" x2="30" y2="175" stroke="${P.crease}" stroke-width="1" opacity="0.35"/>
            <line x1="140" y1="85" x2="250" y2="175" stroke="${P.crease}" stroke-width="1" opacity="0.35"/>
            <path d="M30,175 L42,168 L30,168 Z" fill="${P.layer}" opacity="0.6"/>
            <path d="M250,175 L238,168 L250,168 Z" fill="${P.layer}" opacity="0.6"/>
            ${marks}
        </svg>`;
    }

    if (stage === 6) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <path d="M140,52 L232,142 L140,232 L48,142 Z" fill="${P.shadow}" opacity="0.2" transform="translate(2,2)"/>
            <path d="M140,50 L230,140 L140,230 L50,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="50" y1="140" x2="230" y2="140" stroke="${P.crease}" stroke-width="1.8"/>
            <line x1="140" y1="50" x2="140" y2="230" stroke="${P.crease}" stroke-width="1" opacity="0.45"/>
            <line x1="95" y1="95" x2="185" y2="95" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="3 5" opacity="0.35"/>
            <line x1="95" y1="185" x2="185" y2="185" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="3 5" opacity="0.35"/>
            ${marks}
        </svg>`;
    }

    if (stage === 7) {
        return `<svg viewBox="${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="origami-svg">
            ${washiDefs()}
            <path d="M140,52 L232,142 L48,142 Z" fill="${P.shadow}" opacity="0.2" transform="translate(2,3)"/>
            <path d="M140,50 L50,140 L230,140 Z" fill="${P.front}" ${wf} opacity="0.85"/>
            <path d="M140,50 L50,140 L230,140 Z" fill="${P.layer}"/>
            <path d="M140,50 L50,140 L230,140 Z" fill="${P.front}" ${wf} stroke="${P.highlight}" stroke-width="0.8"/>
            <line x1="50" y1="140" x2="230" y2="140" stroke="${P.crease}" stroke-width="2"/>
            <line x1="50" y1="141" x2="230" y2="141" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>
            <line x1="50" y1="140" x2="140" y2="210" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.3"/>
            <line x1="230" y1="140" x2="140" y2="210" stroke="${P.foldLine}" stroke-width="0.4" stroke-dasharray="4 6" opacity="0.3"/>
            ${marks}
        </svg>`;
    }

    /* ── Stages 8-9: Boat (+ flag at 9) ── */
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
        <ellipse cx="140" cy="268" rx="95" ry="5" fill="rgba(59,130,246,0.08)"/>
        <path d="M58,195 L78,253 L202,253 L222,195 Z" fill="${colors.hull}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <line x1="68" y1="203" x2="212" y2="203" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
        ${asp}
        <rect x="135" y="253" width="10" height="12" rx="2" fill="${colors.keel}"/>
        <line x1="140" y1="45" x2="140" y2="195" stroke="${colors.mast}" stroke-width="3" stroke-linecap="round"/>
        <path d="M145,55 L145,185 L222,173 Z" fill="${sf}" ${wf} stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <path d="M135,60 L135,180 L75,170 Z" fill="${sf}" ${wf} opacity="0.5"/>
        ${flag ? `<path d="M140,45 L140,25 L166,31 L140,37 Z" fill="${colors.flag}"/>${fi}` : ''}
        ${marks}
    </svg>`;
}

/* ── MARK / STAMP RENDERING (simplified) ── */
const MARK_SLOTS = {
    S:     { paper: { x: 180, y: 128 }, diamond: { x: 168, y: 108 }, boat: { x: 115, y: 225 } },
    A:     { paper: { x: 108, y: 142 }, diamond: { x: 112, y: 115 }, boat: { x: 150, y: 225 } },
    A_sub: { paper: { x: 145, y: 152 }, diamond: { x: 140, y: 100 }, boat: { x: 170, y: 215 } },
    I:     { paper: { x: 148, y: 112 }, diamond: { x: 140, y: 88 },  boat: { x: 170, y: 125 } },
    I_sub: { paper: { x: 170, y: 128 }, diamond: { x: 162, y: 98 },  boat: { x: 185, y: 140 } },
    L:     { paper: null, diamond: null, boat: { x: 155, y: 38 } },
};

function getMarkPos(qKey, stage) {
    const s = MARK_SLOTS[qKey];
    if (!s) return null;
    if (stage >= 8) return s.boat;
    if (stage >= 6) return s.diamond;
    return s.paper;
}

function renderMarks(marks, stage) {
    if (!marks || !marks.length) return '';
    return marks.map(m => {
        const pos = getMarkPos(m.questionKey, stage);
        if (!pos) return '';
        const sz = m.small ? 28 : 40;
        const half = sz / 2;
        const col = m.color || '#8b3a3a';
        const svg = m.svg || `<circle cx="${sz/2}" cy="${sz/2}" r="${sz/2 - 1}" fill="${col}" opacity="0.3"/>`;
        return `<g transform="translate(${pos.x - half},${pos.y - half})" style="color:${col}" opacity="0.88">${svg}</g>`;
    }).join('');
}

/* ── HAPTIC FEEDBACK ── */
export function haptic(duration = 30) { if (navigator.vibrate) navigator.vibrate(duration); }
export function hapticPattern(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }
