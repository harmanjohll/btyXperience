/* ═══════════════════════════════════════════════════════════════
   btyXperience — Single Source of Truth
   All school data, archetypes, profiling questions, journey steps.
   ═══════════════════════════════════════════════════════════════ */

// ── SCHOOL FACTS ──
export const SCHOOL = {
    name: 'Beatty Secondary School',
    motto: 'Non Vi Sed Arte (Not with force but with skill)',
    yearsOfExcellence: 72,
    ccaCount: 17,
    exchangeCount: 7,
    industryCount: 7,
    mission: 'Nurturing Adaptive Thinkers, Agile Learners and Active Contributors',
    vision: 'Every Beattyian A Purpose Driven Steward',
    values: ['Discipline', 'Resilience', 'Empathy', 'Adaptability', 'Mindfulness'],
};

export const COLORS = {
    blue: '#000C53',
    yellow: '#FFE200',
    red: '#EC3237',
};

export const LOGO_URL = 'assets/BTlogo.png';

// ── ARCHETYPES (canonical set from joinbtx.html) ──
export const ARCHETYPES = {
    'The Innovator': {
        color: '#f59e0b',
        quote: "Machine Learning opened my eyes to what's possible. Now I use data to build solutions for real problems.",
        description: 'You are driven by technology, using data and problem-solving to build new and better ways to do things.',
        recommendations: ['A.I. @ South Korea', 'Engineering @ Rockwell Automation'],
    },
    'The Global Explorer': {
        color: '#10b981',
        quote: "Studying abroad taught me that leadership transcends borders. Every culture has wisdom to share.",
        description: 'You have a deep cultural curiosity and a desire to understand the world through international exchange.',
        recommendations: ['Leadership @ New Zealand', 'Social Sciences @ Mihara, Japan'],
    },
    'The Industry Trailblazer': {
        color: '#3b82f6',
        quote: "My industry attachment showed me engineering isn't just theory — it's changing lives every day.",
        description: 'You are focused on practical application and making a real-world impact through hands-on industry experience.',
        recommendations: ['Mechatronics @ ITE West & Makita', 'Maritime Sustainability @ PIL'],
    },
    'The Community Steward': {
        color: '#ef4444',
        quote: "D.R.E.A.M. isn't just our values — it's how we lift each other up. That's true leadership.",
        description: 'You are motivated by community service, mentorship, and empowering others to achieve their best.',
        recommendations: ['Leading school initiatives', 'Mentoring junior students'],
    },
    'The Creative Artist': {
        color: '#ec4899',
        quote: "Through school concerts, I learned my voice matters. Art changes hearts.",
        description: 'You find energy in performance, artistic expression, and bringing creative visions to life.',
        recommendations: ['Geography/Literature @ Bali', 'School concert performances'],
    },
    'The STEM Futurist': {
        color: '#8b5cf6',
        quote: "Science isn't about memorizing facts — it's the thrill of discovery, of using data to prove the impossible possible.",
        description: 'You thrive on research, data analysis, and systematic investigation to solve complex problems and shape the future.',
        recommendations: ['Research @ A*STAR', 'Cybersecurity @ Estonia'],
    },
    'The Voice Amplifier': {
        color: '#06b6d4',
        quote: "Journalism taught me every story deserves to be told. Your voice can change the world.",
        description: 'You are passionate about journalism, storytelling, and advocating for important ideas.',
        recommendations: ['Media & Journalism @ Berita Harian', 'Media & Journalism @ Tamil Murasu'],
    },
    'The Eco-Strategist': {
        color: '#22c55e',
        quote: "We don't inherit the Earth from our ancestors; we borrow it from our children.",
        description: 'You are passionate about finding sustainable solutions, analysing environmental systems, and advocating for a greener future.',
        recommendations: ['Sustainability @ New Zealand', 'Developing green campaigns'],
    },
};

export const ARCHETYPE_NAMES = Object.keys(ARCHETYPES);
export const ARCHETYPE_COLORS = ARCHETYPE_NAMES.map(k => ARCHETYPES[k].color);

// ── PROFILING QUESTIONS ──
// Weaves boat.js's rich SAIL scenario format with joinbtx.html's 8 archetypes.
// Each option awards weighted points to 1–3 archetypes.
// After all questions, highest-scoring archetype wins.

export const SAIL_DATA = {
    S: {
        letter: 'S',
        title: 'Stewardship',
        subtitle: 'The Foundation',
        foldInstruction: 'Make your first two folds — preparing the paper.',
        scenario: 'You are leading a team for the first time. Everyone looks to you. The group is diverse — some eager, some unsure, and some with strong opinions.',
        question: 'What is your first instinct as a leader?',
        options: [
            { text: 'Show them how it\'s done — lead by example, actions over words.',
              id: 'model', color: '#3b82f6',
              weight: { 'The Community Steward': 3, 'The Industry Trailblazer': 1 } },
            { text: 'Paint a picture of what we could achieve together — inspire a shared vision.',
              id: 'inspire', color: '#f59e0b',
              weight: { 'The Voice Amplifier': 3, 'The Global Explorer': 1 } },
            { text: 'Challenge the old way — push boundaries and try something nobody has attempted.',
              id: 'challenge', color: '#ef4444',
              weight: { 'The Innovator': 2, 'The Industry Trailblazer': 2 } },
            { text: 'Focus on each person — understand their strengths and help them shine.',
              id: 'enable', color: '#10b981',
              weight: { 'The Community Steward': 2, 'The Global Explorer': 1, 'The Eco-Strategist': 1 } },
            { text: 'Celebrate every win — recognise effort and lift the team\'s spirit.',
              id: 'encourage', color: '#ec4899',
              weight: { 'The Creative Artist': 2, 'The Community Steward': 1, 'The Voice Amplifier': 1 } },
        ],
        info: 'At Beatty, every student is a leader. Our Leaders for Life Programme builds five leadership muscles — leading by example, inspiring others, challenging the process, lifting people up, and encouraging the heart.',
    },
    A: {
        letter: 'A',
        title: 'Applied Learning',
        subtitle: 'The Structure',
        foldInstruction: 'Fold both corners — shaping the structure.',
        scenario: 'Your school just received a grant to solve a real-world community problem. You have full creative freedom and one semester on the clock.',
        question: 'Which problem domain draws you in most?',
        options: [
            { text: 'Smart city solutions — using AI and data to make the neighbourhood safer.',
              id: 'ai', color: '#8b5cf6',
              weight: { 'The Innovator': 3, 'The STEM Futurist': 1 } },
            { text: 'Green engineering — sustainable energy, waste reduction, urban farming.',
              id: 'green', color: '#22c55e',
              weight: { 'The Eco-Strategist': 3, 'The STEM Futurist': 1 } },
            { text: 'Robotics — building automated systems that help people in daily life.',
              id: 'robotics', color: '#3b82f6',
              weight: { 'The STEM Futurist': 3, 'The Industry Trailblazer': 1 } },
            { text: 'Digital media — designing a game, an app, or an interactive experience.',
              id: 'creative', color: '#ec4899',
              weight: { 'The Creative Artist': 3, 'The Voice Amplifier': 1 } },
        ],
        info: 'Our Applied Learning Programme (ALP) — Think.Create.Innovate — focuses on STEM and Machine Learning for smart living. Through NEXUS@BTY, students connect knowledge across disciplines.',
        subScenario: 'The grant committee loves your idea. Now your project needs a specialist.',
        subQuestion: 'Who do you recruit to your team first?',
        subOptions: [
            { text: 'The coder — she thinks in algorithms and can automate anything.',
              id: 'math', color: '#6366f1',
              weight: { 'The Innovator': 2, 'The STEM Futurist': 2 } },
            { text: 'The scientist — he builds prototypes and runs experiments others wouldn\'t dare try.',
              id: 'science', color: '#14b8a6',
              weight: { 'The STEM Futurist': 3, 'The Industry Trailblazer': 1 } },
            { text: 'The storyteller — she turns complex ideas into words everyone understands.',
              id: 'humanities', color: '#f97316',
              weight: { 'The Voice Amplifier': 3, 'The Global Explorer': 1 } },
            { text: 'The maker — he sketches, builds, and crafts until the idea is real.',
              id: 'design', color: '#a855f7',
              weight: { 'The Creative Artist': 3, 'The Industry Trailblazer': 1 } },
        ],
    },
    I: {
        letter: 'I',
        title: 'International & Industry',
        subtitle: 'The Sail',
        foldInstruction: 'Fold the flaps — the hat takes shape.',
        scenario: 'You have been offered a fully-funded trip abroad. One destination, one chance to bring knowledge back that could change your school.',
        question: 'Where would the wind take you?',
        options: [
            { text: 'South Korea — AI labs and K-innovation culture.',
              id: 'korea', color: '#3b82f6',
              weight: { 'The Innovator': 3, 'The STEM Futurist': 1 } },
            { text: 'Japan — ancient culture fuelling modern creativity and social design.',
              id: 'japan', color: '#ec4899',
              weight: { 'The Global Explorer': 3, 'The Creative Artist': 1 } },
            { text: 'New Zealand — sustainability and servant leadership hand in hand.',
              id: 'nz', color: '#10b981',
              weight: { 'The Eco-Strategist': 3, 'The Community Steward': 1 } },
            { text: 'Estonia — the most digital nation. Cybersecurity and e-governance.',
              id: 'estonia', color: '#f59e0b',
              weight: { 'The STEM Futurist': 3, 'The Innovator': 1 } },
        ],
        info: 'From South Korea to New Zealand, Estonia to Japan — our NEXUS exchanges take learning beyond the classroom. With 7 international exchanges to choose from!',
        subScenario: 'Back home, a door opens to the professional world. One semester, one industry, hands-on experience.',
        subQuestion: 'Which world do you step into?',
        subOptions: [
            { text: 'The smart factory — machines, sensors, and systems that run themselves.',
              id: 'rockwell', color: '#3b82f6',
              weight: { 'The Industry Trailblazer': 3, 'The Innovator': 1 } },
            { text: 'The research lab — where questions lead to discoveries nobody expected.',
              id: 'astar', color: '#8b5cf6',
              weight: { 'The STEM Futurist': 3, 'The Industry Trailblazer': 1 } },
            { text: 'The shipping port — global logistics, moving goods across oceans.',
              id: 'pil', color: '#0ea5e9',
              weight: { 'The Industry Trailblazer': 2, 'The Global Explorer': 2 } },
            { text: 'The studio — cameras, code, and stories that reach thousands.',
              id: 'media', color: '#ec4899',
              weight: { 'The Voice Amplifier': 3, 'The Creative Artist': 1 } },
        ],
    },
    L: {
        letter: 'L',
        title: 'Learning to Live, Learn & Love',
        subtitle: 'The Flag',
        foldInstruction: 'The final fold — reveal your boat!',
        scenario: 'It is the last day of school. As you look back on your years at Beatty, one value stands out — the compass bearing that guided you through every storm.',
        question: 'Which value is your compass?',
        options: [
            { text: 'Discipline — the steady course. I stayed focused when everything was noise.',
              id: 'discipline', color: '#3b82f6', icon: '⚓',
              weight: { 'The Industry Trailblazer': 2, 'The STEM Futurist': 2 } },
            { text: 'Resilience — I weathered every storm and came back stronger each time.',
              id: 'resilience', color: '#ef4444', icon: '💪',
              weight: { 'The Industry Trailblazer': 2, 'The Innovator': 2 } },
            { text: 'Empathy — I never sailed alone. I carried others with me.',
              id: 'empathy', color: '#ec4899', icon: '💙',
              weight: { 'The Community Steward': 3, 'The Eco-Strategist': 1 } },
            { text: 'Adaptability — when the wind changed, I changed with it. And thrived.',
              id: 'adaptability', color: '#10b981', icon: '🌊',
              weight: { 'The Global Explorer': 3, 'The Innovator': 1 } },
            { text: 'Mindfulness — I learned to be still, to listen, and to act with intention.',
              id: 'mindfulness', color: '#8b5cf6', icon: '🧘',
              weight: { 'The Eco-Strategist': 2, 'The Community Steward': 1, 'The Creative Artist': 1 } },
        ],
        info: 'D.R.E.A.M. — Discipline, Resilience, Empathy, Adaptability, Mindfulness. These compass bearings guide every Beattyian\'s voyage.',
    },
};

// Flat question sequence for the audience profiling journey:
// S main → A main → A sub → I main → I sub → L main = 6 questions
export const QUESTION_SEQUENCE = [
    { sailKey: 'S', type: 'main' },
    { sailKey: 'A', type: 'main' },
    { sailKey: 'A', type: 'sub' },
    { sailKey: 'I', type: 'main' },
    { sailKey: 'I', type: 'sub' },
    { sailKey: 'L', type: 'main' },
];

// Map question index → origami fold stages to advance through
// boat.js has 10 SVG stages (0-9), distributed across 6 questions + reveal
export const FOLD_STAGE_MAP = [
    [0, 1],    // Q0 (S): stages 0-1 (top fold + crease)
    [2, 3],    // Q1 (A): stages 2-3 (corner folds)
    [4],       // Q2 (A sub): stage 4 (brim)
    [5, 6],    // Q3 (I): stages 5-6 (hat → diamond)
    [7],       // Q4 (I sub): stage 7 (bottom up)
    [8, 9],    // Q5 (L): stages 8-9 (pull apart → boat!)
];

// ── ARCHETYPE SCORING ──
// Compute archetype from all answers
export function computeArchetype(answers) {
    const scores = {};
    for (const name of ARCHETYPE_NAMES) scores[name] = 0;

    answers.forEach((answer, qIdx) => {
        const qDef = QUESTION_SEQUENCE[qIdx];
        const sailSection = SAIL_DATA[qDef.sailKey];
        const options = qDef.type === 'sub' ? sailSection.subOptions : sailSection.options;
        const chosen = options.find(o => o.id === answer);
        if (chosen && chosen.weight) {
            for (const [archetype, pts] of Object.entries(chosen.weight)) {
                scores[archetype] = (scores[archetype] || 0) + pts;
            }
        }
    });

    let best = ARCHETYPE_NAMES[0];
    let bestScore = 0;
    for (const [name, score] of Object.entries(scores)) {
        if (score > bestScore) { bestScore = score; best = name; }
    }
    return { archetype: best, scores };
}

// ── EXCHANGE & INDUSTRY DATA (from btx26.html modalData) ──
export const EXCHANGE_DATA = {
    GeoBali:        { title: 'Geography/Literature @ Bali', studentCount: 30, duration: '1 Week', description: 'Embark on an immersive exploration of Bali\'s dynamic landscape...', highlights: ['Understand Bali\'s volcanic history...', 'Evaluate how local communities adapt...', 'Experience a real field site...'] },
    NZ:             { title: 'Leadership/Sustainability @ Aorere College, New Zealand', studentCount: 10, duration: '1 Week', description: 'The exchange programme, crafted in collaboration with Aorere College...', highlights: ['Sharpen critical and creative thinking.', 'Develop essential leadership qualities.', 'Understand language\'s role in leadership.'] },
    Korea:          { title: 'A.I. @ South Korea', studentCount: 12, duration: '1 Week', description: 'Dive into the future of technology in one of the world\'s most innovative hubs.', highlights: [] },
    MiharaJapan:    { title: 'Social Sciences @ Mihara, Japan', studentCount: 14, duration: '1 Week', description: 'Embark on a transformative journey with our exchange programme with Hiroshima University High School...', highlights: ['Deepen global and cultural literacies.', 'Develop social-emotional competencies.', 'Experience rich Japanese culture.'] },
    MutsuzawaJapan: { title: 'STEM @ Mutsuzawa, Japan', studentCount: 14, duration: '1 Week', description: 'Embark on a transformative journey shaping future leaders in science and technology innovation...', highlights: ['Deepen global and cultural literacies.', 'Develop social-emotional competencies.', 'Experience rich Japanese culture.'] },
    Estonia:        { title: 'Cybersecurity @ Estonia', studentCount: 16, duration: '1 Week', description: 'Learn from the world\'s leading digital society and dive deep into cybersecurity.', highlights: ['Cultural exchange activities.', 'Explore Estonian Film.', 'Research digital citizenship.'] },
};

export const INDUSTRY_DATA = {
    Rockwell:    { title: 'Engineering @ Rockwell Automation', studentCount: 12, duration: '7-8 months', description: 'Get a head start in industrial automation, focusing on cybersecurity, digital twinning, and sustainability.' },
    PIL:         { title: 'Maritime Sustainability, Materials & Corporate Communications @ Pacific International Lines', studentCount: 12, duration: '7-8 months', description: 'Understand global trade, focusing on sustainable logistics, innovative materials, and corporate engagement.' },
    ASTAR:       { title: 'Research @ A*STAR', studentCount: 6, duration: '7-8 months', description: 'Experience life as a research scientist at Singapore\'s premier R&D agency.' },
    Journalism:  { title: 'Media & Journalism @ Berita Harian', studentCount: 8, duration: '7-8 months', description: 'Discover the fast-paced world of news and ethical reporting in Malay language media.' },
    TamilMurasu: { title: 'Media & Journalism @ Tamil Murasu', studentCount: 8, duration: '7-8 months', description: 'Engage with the vibrant world of news and media within the Tamil language community.' },
    Makita:      { title: 'Mechatronics @ ITE West & Makita', studentCount: 16, duration: '7-8 months', description: 'A deep dive into modern mechatronics and manufacturing processes with industry giant Makita.' },
};

// ── PRESENTER JOURNEY STEPS ──
// Each step defines what the presenter screen shows and what the audience phone shows.
// audienceView: 'watch' = passive, 'interact' = has UI, 'fold' = origami fold prompt
export const JOURNEY_STEPS = [
    {
        id: 'compass',
        type: 'chart',
        title: 'Our Audience Compass',
        description: 'A live reflection of our collective personality.',
        audienceView: 'watch',
    },
    {
        id: 'video_intro',
        type: 'video',
        title: 'The Beatty Experience',
        description: '',
        url: 'https://www.youtube.com/embed/6xpckUCGIlE?autoplay=1&modestbranding=1&rel=0&controls=0',
        audienceView: 'watch',
    },
    {
        id: 'deck_a',
        type: 'slide',
        title: '',
        description: '',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vRpjJ-5NgPJO2LRLdKEcpBgqv-xMAriN5QxdbJSPLS5IE2y2pjNhE0icRG8lKqp0x0dM0KbbS9e1HWK/pubembed?start=false&loop=false&delayms=60000',
        audienceView: 'fold',
    },
    {
        id: 'poll_dream',
        type: 'poll',
        title: 'Live Poll: Our Core Values',
        description: '',
        audienceView: 'interact',
        pollData: {
            id: 'dream',
            question: 'Which of these D.R.E.A.M. values do you feel most strongly about?',
            options: ['Discipline', 'Resilience', 'Empathy', 'Adaptability', 'Mindfulness'],
            correctAnswer: null,
            insight: 'All five values form the compass that guides every Beattyian!',
        },
    },
    {
        id: 'values',
        type: 'static',
        title: '',
        description: '',
        audienceView: 'watch',
        content: `<div class="grid grid-cols-5 gap-0 w-full max-w-[95vw] mx-auto h-[70vh]">
            <div class="dream-card cursor-pointer group perspective-1000 h-full"><div class="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-[.is-flipped]:rotate-y-180"><div class="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10"><img src="assets/values/Discipline.png" class="w-full h-full object-cover"><div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4"><h3 class="text-2xl font-black text-white">Discipline</h3></div></div><div class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-blue-900 border-2 border-yellow-400 flex items-center justify-center p-6"><p class="text-xl text-center text-white">The steady course — focused and resolute.</p></div></div></div>
            <div class="dream-card cursor-pointer group perspective-1000 h-full"><div class="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-[.is-flipped]:rotate-y-180"><div class="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10"><img src="assets/values/Resilience.png" class="w-full h-full object-cover"><div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4"><h3 class="text-2xl font-black text-white">Resilience</h3></div></div><div class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-blue-900 border-2 border-yellow-400 flex items-center justify-center p-6"><p class="text-xl text-center text-white">The strength to weather every storm.</p></div></div></div>
            <div class="dream-card cursor-pointer group perspective-1000 h-full"><div class="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-[.is-flipped]:rotate-y-180"><div class="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10"><img src="assets/values/Empathy.png" class="w-full h-full object-cover"><div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4"><h3 class="text-2xl font-black text-white">Empathy</h3></div></div><div class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-blue-900 border-2 border-yellow-400 flex items-center justify-center p-6"><p class="text-xl text-center text-white">Never sailing alone — carrying others with you.</p></div></div></div>
            <div class="dream-card cursor-pointer group perspective-1000 h-full"><div class="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-[.is-flipped]:rotate-y-180"><div class="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10"><img src="assets/values/Adaptability.png" class="w-full h-full object-cover"><div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4"><h3 class="text-2xl font-black text-white">Adaptability</h3></div></div><div class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-blue-900 border-2 border-yellow-400 flex items-center justify-center p-6"><p class="text-xl text-center text-white">When the wind changes, you change with it.</p></div></div></div>
            <div class="dream-card cursor-pointer group perspective-1000 h-full"><div class="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-[.is-flipped]:rotate-y-180"><div class="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10"><img src="assets/values/Mindfulness.png" class="w-full h-full object-cover"><div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4"><h3 class="text-2xl font-black text-white">Mindfulness</h3></div></div><div class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-blue-900 border-2 border-yellow-400 flex items-center justify-center p-6"><p class="text-xl text-center text-white">Stillness, listening, and intentional action.</p></div></div></div>
        </div>`,
    },
    {
        id: 'deck_b',
        type: 'slide',
        title: '',
        description: '',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vSrojJmwv5d-ElzN38A8S1Q_YAYl1_VulE6jPSFy6n8dEjPUnzNltCRstS8VC3fUgSg7Xd0fYN4-NWZ/pubembed?start=false&loop=false&delayms=60000',
        audienceView: 'fold',
    },
    {
        id: 'poll_cca',
        type: 'poll',
        title: 'Live Poll: Pursuing Passions',
        description: '',
        audienceView: 'interact',
        pollData: {
            id: 'cca',
            question: 'What % of students get their 1st or 2nd choice CCA?',
            options: ['50%', '70%', '90%', '100%'],
            correctAnswer: 2,
            insight: 'Amazing right? 9 out of 10 Beattyians pursue their true passions!',
        },
    },
    {
        id: 'deck_c',
        type: 'slide',
        title: '',
        description: '',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vSPBCKf2jwhgnzADjp6D8QcYaz5aSykXkmBsCCSgYNS5QugQUIPYg1pHoD9i3WBkKxH7BjZaTqQvQZe/pubembed?start=false&loop=false&delayms=60000',
        audienceView: 'fold',
    },
    {
        id: 'poll_nexus_count',
        type: 'poll',
        title: 'Live Poll: Our Opportunities',
        description: '',
        audienceView: 'interact',
        pollData: {
            id: 'nexus_count_v2',
            question: 'How many international exchanges and industry attachments does Beatty offer?',
            options: ['None', '3 & 3', '7 & 7', '10 & 15'],
            correctAnswer: 2,
            insight: 'Beatty offers 7 international exchanges and 7 industry attachments — 14 incredible opportunities!',
        },
    },
    {
        id: 'poll_industry',
        type: 'poll',
        title: 'Live Poll: Our Pathways',
        description: '',
        audienceView: 'interact',
        pollData: {
            id: 'industry',
            question: 'Which is NOT an area that students can dive deeper into?',
            options: ['Sustainability', 'Journalism & Media', 'Engineering & AI', 'None of the Above'],
            correctAnswer: 3,
            insight: 'Trick question! At Beatty, we offer ALL these areas. Every passion has a pathway here!',
        },
    },
    {
        id: 'nexus_global',
        type: 'globe',
        title: 'International Exchanges',
        description: 'Explore our global partnerships.',
        audienceView: 'interact',
        nexusData: {
            type: 'global',
            options: [
                { id: 'GeoBali', text: 'Bali (Geog)' },
                { id: 'NZ', text: 'New Zealand' },
                { id: 'Korea', text: 'South Korea (AI)' },
                { id: 'MiharaJapan', text: 'Japan (Soc. Sci)' },
                { id: 'MutsuzawaJapan', text: 'Japan (STEM)' },
                { id: 'Estonia', text: 'Estonia (Cyber)' },
            ],
        },
    },
    {
        id: 'nexus_local',
        type: 'industry_map',
        title: 'Industry Attachments',
        description: 'Real-world experience in Singapore.',
        audienceView: 'interact',
        localData: [
            { id: 'Rockwell',    name: 'Rockwell',     position: { x: 18, y: 47 }, color: '#ef4444' },
            { id: 'PIL',         name: 'PIL',           position: { x: 50, y: 55 }, color: '#8b5cf6' },
            { id: 'Journalism',  name: 'BH',            position: { x: 50, y: 43 }, color: '#06b6d4', offset: 'bottom: 32px;' },
            { id: 'TamilMurasu', name: 'TM',            position: { x: 54, y: 43 }, color: '#f59e0b', offset: 'top: 32px;' },
            { id: 'Makita',      name: 'Makita x ITE',  position: { x: 28, y: 42 }, color: '#10b981' },
            { id: 'ASTAR',       name: 'A*STAR',        position: { x: 43, y: 57 }, color: '#3b82f6' },
        ],
        nexusData: {
            type: 'local',
            options: [
                { id: 'Rockwell', text: 'Rockwell Automation' },
                { id: 'PIL', text: 'PIL (Maritime)' },
                { id: 'Journalism', text: 'Berita Harian' },
                { id: 'TamilMurasu', text: 'Tamil Murasu' },
                { id: 'Makita', text: 'Makita (Mechatronics)' },
                { id: 'ASTAR', text: 'A*STAR Research' },
            ],
        },
    },
    {
        id: 'deck_d',
        type: 'slide',
        title: '',
        description: '',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vRIJppB8CD0rLo6qLaE4eiXeJHcYviqju1Gf3QChKnv7XsJY2cfYQ0eU8M7pSf5Bos2DcyuIxl6ZCPX/pubembed?start=false&loop=false&delayms=60000',
        audienceView: 'fold',
    },
    {
        id: 'deck_e',
        type: 'slide',
        title: '',
        description: '',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vRxw0Yj77fW9I87q0-XgXfqwGPwdi6RPDXBHb7CMGmEJTdBhELve0N5rAg5WbtS2vivKyV5WZO9gB_m/pubembed?start=false&loop=false&delayms=60000',
        audienceView: 'fold',
    },
    {
        id: 'finale',
        type: 'finale',
        title: 'Our Aspirations Crest',
        description: 'Building a symbol of our collective future.',
        audienceView: 'interact',
    },
    {
        id: 'deck_f',
        type: 'slide',
        title: '',
        description: '',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vQx7tJCZ8s5AD5S9F7S2kNmAgfEX7KnIP6fLMQfcFCfQr4-9JeUVxFcyYRhzNtZYbBaCvLM1Wz8p1sX/pubembed?start=false&loop=false&delayms=60000',
        audienceView: 'watch',
    },
    {
        id: 'card',
        type: 'memento',
        title: 'Your Journey Begins',
        description: 'Please check your phone for your personalized Beatty Compass Card.',
        audienceView: 'interact',
    },
];

// ── GLOBE DESTINATIONS (for 3D globe pins) ──
export const GLOBE_DESTINATIONS = {
    Korea:          { lat: 37.56, lon: 126.97, name: 'A.I. @ Korea',           color: '#f59e0b' },
    NZ:             { lat: -41.28, lon: 174.77, name: 'Sustainability @ NZ',    color: '#10b981' },
    MiharaJapan:    { lat: 34.40, lon: 133.08, name: 'Soc. Sci. @ Japan',      color: '#ef4444' },
    MutsuzawaJapan: { lat: 35.43, lon: 140.32, name: 'STEM @ Mutsuzawa',       color: '#f472b6' },
    GeoBali:        { lat: -8.67, lon: 115.22, name: 'Geog. @ Bali',           color: '#3b82f6' },
    Estonia:        { lat: 59.43, lon: 24.75, name: 'Cybersecurity @ Estonia', color: '#8b5cf6' },
    LitBali:        { lat: -8.67, lon: 115.82, name: 'Lit. @ Bali',            color: '#3b82f6', noClick: true },
};
