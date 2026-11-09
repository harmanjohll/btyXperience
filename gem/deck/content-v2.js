/* ============================================================
   VERSION 2 of the show's slides (used by v2.html). Version 1 is deck/content.js.
   THE SHOW'S SLIDES: one plain list per deck. Edit words here; no code needed.

   Ported from the six Google Slides decks the show used to embed (steps 3, 7, 11, 18, 19, 24),
   rebuilt as native slides: same messages, numbers and photos, drawn in the show's own design,
   with the room's live data and a companion on every phone. Photos live in deck/img/<deck>/.

     use:true   the show uses these slides (the Google deck is no longer loaded)
     use:false  the Google deck comes back for that step
     Show day:  btx27.html?presenter=true&scenes=0 brings every Google deck back at once.

   Slide kinds (pick one per slide):
     cover      title, sub, eyebrow, img, rainbow, crest      a chapter opener, full screen
     photo      img, title, caption, fit:'contain'           one photo, full screen, caption card
     gallery    title, sub, imgs:[src or {src,cap,fit}], note  two to seven photos as a mosaic
     feature    title, sub, img or imgs, items, tags, round, side:'right'   photos beside words
     statement  title, sub, body, icon (logo:'nexus')         one big idea
     duo        items:[{label,title,body,list}]               two ideas side by side
     pillars    title, items:[{icon,title,body,more}]          three to five cards
     stats      title, items:[{n,suffix,label,ring}]           big numbers (ring: a % to draw)
     steps      title, items:[{tag,title,body,who}]            a journey, left to right
     acronym    title, letters:[[L,word,line]], tints          letters that build one by one
     quote      quote, by, title, img, also:{quote,by}
     columns    title, cols:[{head,items}], mark:[…]           ranked lists side by side
     bars       title, groups:[{label, rows:[[name,value]]}], suffix
     people     title, items:[{img,name,role}]                 portraits in a row
     venn       title, items:[{tag,title,q}] x4, centre, foot
     table      title, sub, head, rows, note
     links      title, sub, items:[{label,url}]                QR codes drawn here; phones get tappable links
     logos      title, items:[{img,name}]
     pins       title, img, pins:[{x,y,label,sub,lx,ly}]       places on a map (x, y, lx, ly in %)
     stairs     title, right:{steps,labels,caption}, left:{steps,label,caption}
     mix        title, chip, foot                              one form class, every level
     live       show:'bees'|'poll'|'picks'|'pulse'|'words'|'fleet', title    the room, live
     ask        id, question, options:[…]                      phones answer; the bars fill live

   Every slide may also have:
     tone    'cream' turns the slide into a cream page (navy words, red accents); leave it out for navy.
             Questions (ask) always stay navy: the gold frame means "phones, your turn".
     notes   what to say (shown in the presenter view, never on the big screen)
     phone   what the phones show; leave it out and the phones get the slide's headline.
             phone:{ title, line } or phone:false (phones show the chapter line)

   Icons: bee innovator explorer trailblazer steward artist futurist voice eco flame rocket
          smile curious phone sail globe pin check eye hex spark wave fold chart poll heart school arrow

   Lines marked [confirm] in the notes are worth a check (a figure or link from last year's decks).
   ============================================================ */
window.BTY_DECKS = {

  /* ---------- Step 3 · Who we are (after the welcome film) ---------- */
  deck_a: { use:true, chapter:'Who we are', slides:[
    { kind:'cover', img:'a/identity.jpg', pos:'70% 35%', eyebrow:'Who we are', title:'Identity', sub:'Unity, hard work, and skill over force',
      notes:'Who we are begins with one Coat of Arms.' },
    { kind:'crest', tone:'cream', img:'a/crest.png', title:'Our crest', items:[
        { title:'Unity', body:'As symbolised by the admiral command colours of navy blue and yellow', area:[50,34,43,34] },
        { title:'Hard work', body:'As symbolised by the bees around the bee hive', area:[49,45,31,19] },
        { title:'Not by force, but with skill', body:'As symbolised by our motto, Non Vi Sed Arte', area:[50,72,47,10] } ],
      phone:{ title:'Our crest', line:'Unity, hard work, and skill over force.' },
      notes:'Three things our crest stands for. The screen lights each part in turn: the navy and yellow for unity, the bees for hard work, the motto for skill over force.' },
    { kind:'statement', icon:'school', eyebrow:'Our motto', title:'Non Vi Sed Arte', latin:true, sub:'Not with force but with skill.',
      body:'Chosen by Mr Meyer, our first principal, from the Coat of Arms of Admiral Earl David Beatty.',
      notes:'Say it slowly. We will shout it together when the boats set sail; ask them to remember it.' },
    { kind:'gallery', title:'They took charge of their future', imgs:[
        { src:'a/clip-future.jpg', fit:'contain' }, { src:'a/nabilah.jpg' }, { src:'a/results.jpg' }, { src:'a/clip-st.jpg', fit:'contain' }, { src:'a/clip-bh.jpg', fit:'contain' } ],
      phone:{ title:'They took charge of their future', line:'Our graduates, in the news.' },
      notes:'Our graduates in The Straits Times and Berita Harian. Cheryl, an auditory learner, read her notes out loud so she could understand them better. Others overcame family duties, migraines and hospital stays to do well.' },
    { kind:'quotes', tone:'cream', title:'In their words', img:'a/nabilah.jpg', items:[
        { q:'Cheryl considers herself more of an auditory learner, so she made it a point to read her learning materials out loud just so she could understand them better.', by:'The Straits Times' },
        { q:'I believe that good and positive friends are important because we can help each other.', by:'A Beatty graduate' },
        { q:'I had many duties, like helping my younger sibling with homework, keeping the house clean, and more. Our parents are working hard and we too must help.', by:'A Beatty graduate, Berita Harian' },
        { q:'I would schedule Zoom consultations with my teachers and watch YouTube videos to understand geography concepts better.', by:'A Beatty graduate' } ],
      phone:{ title:'In their words', line:'Our graduates on how they took charge.' },
      notes:'Four graduates, four habits: learning the way that suits you, good friends, responsibility at home, and reaching out to teachers.' },
    { kind:'slope', title:'The world is changing, fast', sub:'The top ten skills, then and next: watch two of them move', mark:['Judgment & Decision Making','Complex Problem Solving'], cols:[
        { head:'In 2015', items:['Complex Problem Solving','Coordinating with Others','People Management','Critical Thinking','Negotiation','Quality Control','Service Orientation','Judgment & Decision Making','Active Listening','Creativity'] },
        { head:'In 2020', items:['People Management','Complex Problem Solving','Critical Thinking','Creativity','Coordinating with Others','Emotional Intelligence','Judgment & Decision Making','Service Orientation','Negotiation','Cognitive Flexibility'] },
        { head:'In 2030', items:['Judgment & Decision Making','Fluency of Ideas','Active Learning','Learning Strategies','Originality','System Evaluation','Deductive Reasoning','Complex Problem Solving','Systems Analysis','Monitoring'] } ],
      notes:'The red line: Judgment and Decision Making climbs from 8th to 1st. The gold line: Complex Problem Solving slips from 1st to 8th; new skills like Learning Strategies and Originality arrive. This is why we teach how to learn, not only what to learn.' },
    { kind:'bars', tone:'cream', title:'Top reasons for working in the gig economy', suffix:'%', groups:[
        { label:'Gig workers say', rows:[['Make extra money on the side',55],['Balancing career and family needs',48],['Autonomy and control',48],['Only way to make an income',22],['Earning while seeking a better job',19]] } ],
      notes:'Work itself is changing: more people choose gig work, for money, family and autonomy. Our children need to be adaptive.' },
    { kind:'statement', icon:'bee', eyebrow:'Our fundamental belief', title:'Every Beattyian has latent giftings',
      body:'who, when given opportunities and time, can develop talents that they can share with the community.',
      notes:'This belief sits under everything we do.' },
    { kind:'pillars', tone:'cream', title:'Beattyian identity', items:[
        { icon:'innovator', title:'Adaptive Thinkers', body:'To be critical, creative and user centric', more:'To become discerning decision makers, inventive problem solvers and empathetic communicators' },
        { icon:'explorer',  title:'Agile Learners',    body:'To learn how to learn, how to live, and how to love', more:'To become joyful explorers, purposeful navigators and reflective knowledge builders' },
        { icon:'steward',   title:'Active Contributors', body:'To be driven, to serve and to add value', more:'To become impactful changemakers, compassionate connectors and community builders' } ],
      notes:'Our mission in three words each: Adaptive Thinkers, Agile Learners, Active Contributors.' },
    { kind:'venn', tone:'cream', title:'Purpose', centre:'BTY', foot:'Every Beattyian A Purpose Driven Steward', items:[
        { tag:'VS', title:'Valued by self', q:'What allows you to live out your values, and help you find meaning and purpose?' },
        { tag:'RC', title:'Relatedness and community', q:'What is that which allows you to relate and connect with others?' },
        { tag:'PG', title:'Personal growth', q:'What area creates that desire to continue to improve?' },
        { tag:'VO', title:'Valued by others', q:'What value are you capable of generating that others require?' } ],
      notes:'Purpose lives where these four meet: what you value, who you connect with, how you grow, and what others need from you.' },
    { kind:'cover', title:'VALUES', rainbow:true, tints:['#FFFFFF','#5B7BFF','#FF4D52','#3FBF5A','#FFD23F','#FF9A3D'],
      phone:{ title:'Values', line:'Discipline, Resilience, Empathy, Adaptability, Mindfulness.' },
      notes:'And that brings us to our values. First, our first fold.' },
  ]},

  /* ---------- Step 7 · A day at Beatty (after the DREAM poll and the value cards) ---------- */
  deck_b: { use:true, chapter:'Our values', slides:[
    { kind:'ask', id:'grow_value', question:'Which value do you most want to grow?',
      options:['Discipline','Resilience','Empathy','Adaptability','Mindfulness'],
      notes:'Phones answer now. Read out the leader; there is no wrong answer.' },
    { kind:'stairs', tone:'cream', title:'Perspective',
      right:{ steps:12, labels:['Routines','Habits'], caption:'Routines build into habits, one small step at a time' },
      left:{ steps:3, label:'Inspiration', caption:'Inspiration comes in bursts' },
      notes:'Inspiration gets you started, but it comes and goes. Routines, kept daily, become habits, and habits carry you up.' },
    { kind:'cover', img:'b/morning.jpg', whole:true, day:'morning', eyebrow:'A day at Beatty', title:'Morning', sub:'Reset, Refreshed, Ready',
      notes:'Let us walk through a day at Beatty, starting with the morning.' },
    { kind:'quote', tone:'cream', title:'Habits to build the child for life',
      quote:'You don\'t determine your future. You determine your habits. Your habits determine your future.', by:'F. M. Alexander',
      also:{ quote:'Schools are also social institutions and coming to school isn\'t just about tests; it\'s also about spending meaningful time with your peers. Early starts are also about forming habits that set students up for life, like how to start the day right.', by:'Our principal, in The Straits Times' },
      img:'b/clip-habits.jpg', fit:'contain',
      notes:'We kept our 7.30am start. Early starts are about forming habits that set students up for life.' },
    { kind:'mix', title:'FSBB@Beatty', phase1:'Subject classes: each student at their own level', phase2:'Form classes: mixed, together for the Common Core', legend:'subject levels', chip:'Common Core',
      foot:'Applied Learning Programme, Assembly Programmes, Art, Character & Citizenship Education, Design & Technology, Food & Consumer Education, Form Teacher Guidance, Music, Physical Education',
      notes:'Full Subject Based Banding. First the screen sorts students by subject level; then they mix into form classes, where they learn the Common Core together. [confirm] which colour means which level.' },
    { kind:'feature', tone:'cream', title:'Awareness: beliefs, emotions, behaviours',
      sub:'Why pay attention to emotions? Social and emotional competence has been strongly linked with being happier and contented, and stronger achievement.',
      imgs:[{ src:'b/journal-1.jpg', fit:'contain' },{ src:'b/journal-2.jpg', fit:'contain' },{ src:'b/journal-3.jpg', fit:'contain' },{ src:'b/journal-4.jpg', fit:'contain' }],
      items:[{ icon:'smile', title:'Positive self talk' },{ icon:'arrow', title:'Goal setting' },{ icon:'eye', title:'Identifying negative emotions' }],
      note:'A journal to recognise, understand, label, express and regulate emotions.',
      notes:'Every student keeps a journal that helps them notice and manage their emotions.' },
    { kind:'feature', eyebrow:'Applied Learning Programme (ALP)', title:'Nurturing future ready Beattyians', img:'b/alp-bh.jpg', fit:'contain', items:[
        'Every Beattyian must be equipped with the ability to connect, extend and challenge the issues of tomorrow',
        'Beattyians must "Think. Create. Innovate." with empathy, for the betterment of lives of others and self',
        'Failure and play are learning experiences for success' ],
      tags:['Beattyians: Think. Create. Innovate.'],
      notes:'Our ALP, featured in Berita Harian.' },
    { kind:'gallery', tone:'cream', title:'Makerspace@Beatty', sub:'A flexible learning space as a playground for learning through "structured" and "unstructured" play',
      imgs:[{ src:'b/maker-space.jpg' },{ src:'b/maker-neon.jpg' },{ src:'b/maker-drone.jpg', cap:'Drone programming' },{ src:'b/maker-heatpress.jpg', cap:'Heat press' },{ src:'b/maker-sewing.jpg', cap:'Sewing' },{ src:'b/maker-3d.jpg', cap:'3D printing' },{ src:'b/maker-laser.jpg', cap:'Laser cutting' }],
      notes:'Drones, heat press, sewing, 3D printing and laser cutting, all in one space.' },
    { kind:'feature', title:'ALP 3.0', sub:'Tech enabled Design Thinker', img:'b/alp3.jpg', fit:'contain',
      items:[{ icon:'futurist', title:'Machine learning', body:'Design thinking, now with the tools of AI' }],
      notes:'The next version of our ALP: the tech enabled design thinker. [confirm] the line under Machine learning.' },
    { kind:'gallery', title:'Think. Create. Innovate.', imgs:['b/alp-4.jpg','b/alp-1.jpg','b/alp-2.jpg','b/alp-3.jpg'],
      notes:'ALP in action.' },
    { kind:'gallery', tone:'cream', title:'On the world stage', imgs:[{ src:'b/award-table.jpg', fit:'contain', cap:'Country award winners, ages 13 to 18' },{ src:'b/award-team.jpg' },{ src:'b/rockwell.jpg', cap:'Rockwell Automation' },{ src:'b/award-3.jpg' }],
      notes:'Our students among the country award winners. [confirm] the name of the competition.' },
    { kind:'feature', side:'right', title:'Learning to learn', imgs:['b/pld-1.jpg','b/pld-2.jpg'], items:[
        'Personal Learning Devices (PLDs) are meant to support, modify and enhance what and how Beattyians learn',
        'We must understand how to use this, and the tools it comes with, to improve as learners',
        'Establish good routines and habits to make the best use of the tools given, to become deep thinkers and engaged learners' ],
      notes:'Every student has a Personal Learning Device; we teach them to use it well.' },
    { kind:'duo', tone:'cream', title:'Learning strategies', items:[
        { label:'Learning to learn', title:'Beattyians\' Learning Practice', list:['Prepare, participate, process','Note making','Mind mapping'] },
        { label:'Learning to live', title:'The GROW metacognition model', list:['Learning and reflection logs','Gratitude journaling','Self awareness'] } ],
      notes:'Two sets of strategies: how to learn, and how to live.' },
    { kind:'acronym', title:'GROW: our metacognition model', letters:[
        ['G','Gift yourself success','What is one thing I understand from the lesson?'],
        ['R','Rise above with small steps','What will I do to improve on one thing that I do not yet understand?'],
        ['O','Own your knowledge','What is one real life example?'],
        ['W','Watch for what comes next','What do I already know about the next topic?'] ],
      notes:'Four questions students ask themselves after every lesson.' },
    { kind:'feature', tone:'cream', title:'Learn to learn', sub:'To know how to learn: note making as a critical skill that needs to be taught',
      imgs:[{ src:'b/notes-1.jpg', fit:'contain' },{ src:'b/notes-2.jpg', fit:'contain' }],
      notes:'Note making is taught, not assumed. These are real student notes, with teacher feedback.' },
    { kind:'photo', img:'b/gifts-1.jpg', title:'Discovering and uncovering gifts',
      notes:'Every Beattyian has latent giftings; we help them find them.' },
    { kind:'gallery', title:'Education and career guidance', imgs:['b/ecg-1.jpg','b/ecg-2.jpg','b/ecg-3.jpg'],
      notes:'Guidance on pathways and careers, from Secondary 1.' },
    { kind:'cover', img:'b/canoe.jpg', whole:true, day:'afternoon', eyebrow:'A day at Beatty', title:'Afternoon', sub:'Enriching Character, Pursuing Passions',
      notes:'In the afternoon: CCAs.' },
    { kind:'quote', tone:'cream', title:'Take flight with CCA',
      quote:'CCAs bring students from diverse backgrounds and different academic streams together.', by:'Ms Tng Ee Hwei, HOD of PE and CCA',
      also:{ quote:'CCAs are a big part of secondary school life. When it came to secondary school choices, the CCA played a big factor.', by:'Freya Swallow, who chose Beatty for canoeing' },
      img:'b/canoe-2.jpg',
      notes:'Freya chose Beatty because it offered canoeing as a CCA.' },
    { kind:'photo', img:'b/sports.jpg', title:'Sports & Games', notes:'Our sports and games CCAs.' },
    { kind:'photo', img:'b/ug.jpg', title:'Uniformed Groups', notes:'Our uniformed groups.' },
    { kind:'photo', img:'b/pa.jpg', title:'Performing Arts', notes:'Our performing arts groups.' },
    { kind:'gallery', imgs:['b/pa-1.jpg','b/pa-2.jpg','b/pa-3.jpg','b/pa-4.jpg','b/pa-5.jpg','b/pa-6.jpg'],
      phone:{ title:'Performing Arts', line:'Find your stage.' },
      notes:'More from our performing arts.' },
    { kind:'ask', id:'cca_family', question:'Which CCA family is calling you?',
      options:['Uniformed Groups','Performing Arts','Sports & Games','Clubs'],
      notes:'Phones answer. Invite families to the CCA booths after the show.' },
  ]},

  /* ---------- Step 11 · Passions: enrichment and NEXUS (after the CCA fact, fold A and the CCA poll) ---------- */
  deck_c: { use:true, chapter:'Passions', slides:[
    { kind:'feature', tone:'cream', title:'The joy of stewardship', sub:'Purpose driven stewards',
      imgs:[{ src:'c/wheel.png', fit:'contain' },'c/stewards.jpg'], items:[
        { title:'Practices of leadership', body:'Model the way, inspire a shared vision, challenge the process, enable others to act, encourage the heart' },
        { title:'Joy of leadership', body:'Strengths, health, absorption, relationship, purpose' },
        { title:'At the heart', body:'DREAM: Discipline, Resilience, Empathy, Adaptability, Mindfulness' } ],
      notes:'Our leadership model: the practices of leadership, the joy of leadership, and DREAM at the centre.' },
    { kind:'gallery', title:'Stewardship in action', imgs:['c/lead-1.jpg','c/lead-2.jpg','c/lead-3.jpg'],
      notes:'Student leaders at work.' },
    { kind:'feature', title:'English Language and Literature enrichment', imgs:['c/el-1.jpg','c/el-2.jpg','c/el-4.jpg','c/el-3.jpg'], items:[
        'Developing students\' communication and critical thinking skills',
        'Challenge students to navigate the complexities of news reporting',
        { title:'heartBEAT', body:'Beatty Radio Station' } ],
      tags:['Readers\' Theatre','Debate Fest','Your Say'],
      notes:'Radio, debate, readers\' theatre and news.' },
    { kind:'feature', tone:'cream', side:'right', title:'Mother Tongue Languages Fortnight', imgs:['c/mt-1.jpg','c/mt-2.jpg','c/mt-3.jpg'], items:[
        'Create an immersive environment for students to learn and use their Mother Tongue',
        'Develop an appreciation of cultures in Singapore' ],
      notes:'Two weeks of language and culture.' },
    { kind:'feature', title:'Math enrichment', imgs:['c/math-1.jpg','c/math-2.jpg','c/math-3.jpg',{ src:'c/simc.jpg', fit:'contain' }], items:[
        { title:'Math Olympiad' }, { title:'Financial Literacy Workshop' },
        { title:'SIMC²', body:'Singapore International Mathematical Challenge 2022 (Junior Challenge): our winning Beatty team' } ],
      notes:'Our team won at the Singapore International Mathematical Challenge.' },
    { kind:'feature', tone:'cream', side:'right', title:'Science enrichment', sub:'A curriculum of practice and identity', imgs:['c/sci-1.jpg','c/sci-2.jpg','c/sci-3.jpg','c/sci-4.jpg'], items:[
        { title:'Competitions', body:'International competitions, Physics Olympiad, Chemistry Olympiad, Engineering Innovation Challenge' },
        { title:'Research', body:'Science research, microbiology workshops, Science Day @ Beatty' },
        { title:'Work attachments', body:'At A*STAR, NUS and Pfizer' } ],
      tags:['Application & transfer','Depth of knowledge','Hands on learning'],
      notes:'Science as a practice: research, competitions and real work attachments.' },
    { kind:'feature', title:'Values In Action (VIA)', sub:'Learning with our hearts',
      imgs:[{ src:'c/via-1.jpg', cap:'Sign language lessons' },{ src:'c/via-2.jpg', cap:'A song, filmed in sign language' },{ src:'c/via-3.jpg', cap:'Signing the National Pledge' }], items:[
        'Develop ideas around the concept of inclusivity',
        'Understand the hearing loss community',
        'Raise awareness, develop solutions, and enable actions with the hearing loss community to engender a more inclusive community' ],
      notes:'Our students learn sign language and sign the National Pledge at National Day.' },
    { kind:'feature', tone:'cream', img:'c/ganjunhuan.jpg', round:true, pos:'50% 18%', eyebrow:'Class of 2019', title:'Gan Jun Huan', items:[
        { title:'SADeaf\'s Deaf Achiever Awards 2019', body:'Outstanding Deaf Student (Secondary education)' },
        { title:'ITE College Central', body:'Outstanding Deaf Student 2021' },
        { title:'Singapore Poly', body:'Diploma in Architecture' },
        { title:'Today', body:'A Teacher Assistant at Lighthouse School' } ],
      notes:'One of ours, from our Hearing Loss Support programme.' },
    { kind:'cover', img:'c/nx201-3.jpg', whole:true, eyebrow:'Niche programmes', title:'Experiential learning',
      notes:'Now, our niche programme: NEXUS.' },
    { kind:'statement', logo:'nexus', title:'NEXUS', sub:'a connection or series of connections, linking two or more things; a central or focal point',
      notes:'Navigation and exploration, understandings and synergies, across disciplines.' },
    { kind:'pillars', tone:'cream', title:'At its core, NEXUS@BTY grows', items:[
        { icon:'innovator', title:'Adaptive Thinkers', body:'To be critical, creative and user centric', more:'Discerning decision makers, inventive problem solvers and empathetic communicators' },
        { icon:'explorer',  title:'Agile Learners',    body:'To learn how to learn, how to live, and how to love', more:'Joyful explorers, purposeful navigators and reflective knowledge builders' },
        { icon:'steward',   title:'Active Contributors', body:'To be driven, to serve and to add value', more:'Impactful changemakers, compassionate connectors and community builders' } ],
      notes:'NEXUS grows the same three things as our mission.' },
    { kind:'steps', title:'Three stages, one journey', items:[
        { tag:'NX101', title:'Critical Cornerstones', body:'The Critical Inquiry Project: thinking across Geography, Mathematics and Applied Learning.', who:'All students' },
        { tag:'NX201', title:'Constructive Curiosities', body:'STEM Playgrounds: design and computational thinking across Mathematics, the Sciences and AI.', who:'All students' },
        { tag:'NX301 · NX302', title:'Creative Connections', body:'An international exchange or an industry attachment, with a certificate of Merit or Distinction.', who:'Selected students' } ],
      notes:'All students take NX101 and NX201. Selected students go on to NX301 or NX302.' },
    { kind:'feature', tone:'cream', title:'NX101: Critical Inquiry Project',
      sub:'An interdisciplinary learning adventure that enables students to connect concepts and processes across Geography, Mathematics and Applied Learning',
      imgs:['c/nx101-1.jpg','c/nx101-2.jpg','c/nx101-3.jpg','c/nx101-4.jpg'],
      notes:'Secondary 1s test the water of the Kallang River, and apply what they learn across subjects.' },
    { kind:'gallery', title:'NX201: STEM Playgrounds', sub:'Secondary 2: AI and its applications', imgs:['c/nx201-1.jpg','c/nx201-2.jpg','c/nx201-3.jpg','c/nx201-4.jpg','c/nx201-5.jpg'],
      notes:'Secondary 2s explore AI and its applications.' },
  ]},

  /* ---------- NEXUS@BTY · the exchanges (before the globe pick) ---------- */
  deck_d: { use:true, chapter:'NEXUS@BTY', slides:[
    { kind:'pins', tone:'cream', title:'Internationalisation Programme', img:'d/worldmap.jpg', home:{ x:66.8, y:54.4, label:'Beatty, Singapore' }, pins:[
        { x:30.4, y:5.0,  lx:33,   ly:1.5,  label:'Digital Citizenship & Smart Nations e-Exchange with Estonia', sub:'12 to 20 Sec 3 students' },
        { x:74.1, y:25.3, lx:47,   ly:15,   label:'A.I. Research Exchange with Middle Schools, South Korea', sub:'8 to 10 Sec 3 students' },
        { x:79.2, y:24.2, lx:76,   ly:5,    label:'Science & Mathematics Research Exchange with Mutsuzawa High School', sub:'10 to 12 Sec 3 students' },
        { x:76.4, y:25.9, lx:78,   ly:31,   label:'Science Research Exchange with SSH in Mihara, Hiroshima', sub:'10 to 12 Sec 3 students' },
        { x:72.9, y:63.7, lx:48,   ly:58,   label:'Geographical Investigation, Bali', sub:'All Sec 3 Geography students' },
        { x:74.1, y:68.6, lx:77,   ly:62,   label:'Literary Adventures, Bali', sub:'All Sec 3 Literature students' },
        { x:93.6, y:88.1, lx:70,   ly:82,   label:'Leadership x Language Arts Exchange with Aorere College', sub:'8 to 10 Sec 3 students' } ],
      notes:'Seven programmes across the region. [confirm] the Hanoi exchange, which is on tonight\'s globe but not on last year\'s map.' },
    { kind:'gallery', title:'NX3014: Leadership x Language Arts @ New Zealand', imgs:['d/nz-1.jpg','d/nz-2.jpg','d/nz-3.jpg','d/nz-4.jpg'],
      notes:'Leadership and language arts with Aorere College.' },
    { kind:'gallery', tone:'cream', title:'NX3011 and NX3012: Japan', sub:'Mihara City International Exchange · Mutsuzawa High School International Exchange',
      imgs:[{ src:'d/jp-1.jpg', cap:'Mihara City' },{ src:'d/jp-2.jpg', cap:'Mutsuzawa High School' }],
      notes:'Science research in Mihara, Hiroshima, and science and mathematics in Mutsuzawa.' },
    { kind:'gallery', title:'NX3015: Geographical Investigation @ Bali', imgs:['d/bali-1.jpg','d/bali-2.jpg','d/bali-3.jpg','d/bali-4.jpg','d/bali-5.jpg'],
      notes:'Every Secondary 3 Geography student reads a real volcanic landscape.' },
  ]},

  /* ---------- NEXUS@BTY · industry attachments (between the globe and the map pick) ---------- */
  deck_d2: { use:true, chapter:'NEXUS@BTY', slides:[
    { kind:'gallery', title:'NX302: Industry Attachments', imgs:['d/ind-1.jpg','d/ind-2.jpg','d/ind-3.jpg','d/ind-4.jpg'],
      notes:'Selected students spend time with our industry partners.' },
    { kind:'logos', tone:'cream', title:'Our industry partners', items:[
        { img:'d/logo-rockwell.png', name:'Rockwell Automation' },{ img:'d/logo-pil.png', name:'PIL' },{ img:'d/logo-astar.png', name:'A*STAR' },{ img:'d/logo-nus.png', name:'NUS' },
        { img:'d/logo-sph.png', name:'SPH' },{ img:'d/logo-deloitte.png', name:'Deloitte' },{ img:'d/logo-ite.png', name:'ITE' },{ img:'d/logo-science.png', name:'Science Centre Singapore' } ],
      notes:'Rockwell Automation, PIL, A*STAR, NUS, SPH, Deloitte, ITE and the Science Centre.' },
    { kind:'gallery', title:'European Union @ BTY', imgs:['d/eu-1.jpg',{ src:'d/eu-2.jpg', cap:'Estonia: Digital Transformation & Sustainability' },'d/eu-3.jpg'],
      note:'Ms Eszter Nemeth, Deputy Head of Mission of the EU in Singapore, engaging Beattyians in a meaningful discussion on the roles youths can play to enhance EU Singapore ties.',
      notes:'The EU came to us.' },
  ]},

  /* ---------- Step 19 · Your pathway: our teachers and our spaces ---------- */
  deck_e: { use:true, chapter:'Your pathway', slides:[
    { kind:'gallery', title:'Our caring teachers', sub:'A team of Innovative, Caring and Engaged Educators', imgs:['e/teachers-1.jpg','e/teachers-2.jpg'],
      notes:'Our teachers.' },
    { kind:'quote', tone:'cream',
      quote:'This stems from a deep belief that each child is a gift, and that Beatty is a community that will allow its learners to discover who they are as they uncover their giftings through a broad range of learning opportunities and experiences.',
      notes:'Each child is a gift.' },
    { kind:'quote',
      quote:'The first thing we must all do is love and care for our children; everything else will fall in place. To love and care is to do what is required for each child to realise and actualise his or her potential, and to gradually become the best version of themselves. It is about learning who they are, learning with and from them, and to then know what they need most at each stage of their journey so as to set them on the right course to lead meaningful, purposeful lives.',
      notes:'Love and care first; everything else will fall in place.' },
    { kind:'gallery', tone:'cream', title:'Our canteen makeover!', imgs:['e/canteen-1.jpg','e/canteen-2.jpg','e/canteen-3.jpg','e/canteen-4.jpg',{ src:'e/canteen-cna.jpg', fit:'contain' }],
      notes:'Our renewed canteen, and our canteen operator, featured on CNA.' },
    { kind:'photo', img:'e/classroom.jpg', title:'Our classrooms', notes:'Bright, flexible classrooms.' },
    { kind:'gallery', title:'Environment matters!', imgs:[{ src:'e/foyer.jpg', cap:'Foyer' },{ src:'e/heritage.jpg', cap:'Heritage Gallery' },{ src:'e/library.jpg', cap:'Library & classrooms' },{ src:'e/linkway.jpg', cap:'Linkway' },{ src:'e/entrance.jpg' }],
      notes:'Spaces designed for learning and belonging.' },
    { kind:'gallery', tone:'cream', title:'Continuous improvement', imgs:['e/future-1.jpg','e/future-2.jpg','e/future-3.jpg'],
      notes:'And we keep improving.' },
    { kind:'statement', tone:'cream', icon:'sail', eyebrow:'Next', title:'One last fold',
      body:'Pull your boat open. In a moment, the whole hall sets sail together.',
      notes:'Lead into the final fold beat.' },
  ]},

  /* ---------- Step 24 · Your journey (after Set Sail and the Hive of aspirations) ---------- */
  deck_f: { use:true, chapter:'Your journey', slides:[
    { kind:'cover', img:'f/rainbow.jpg', pos:'60% 50%', eyebrow:'DREAM', title:'Chase the rainbow at Beatty', sub:'where your aspirations take flight',
      notes:'Chase the rainbow at Beatty.' },
    { kind:'people', title:'Beatty\'s illustrious alumni', items:[
        { img:'f/alum-ow.jpg', name:'Ow Chio Kiat', role:'Chairman, Stamford Land' },
        { img:'f/alum-goh.jpg', name:'Justice Goh Joon Seng', role:'High Court Judge' },
        { img:'f/alum-shih.jpg', name:'Prof Shih Choon Fong', role:'President, NUS' },
        { img:'f/alum-loh.jpg', name:'Prof Loh Hong Sai', role:'Dental Surgeon' } ],
      notes:'Some of those who came before. [confirm] roles (some are former).' },
    { kind:'people', tone:'cream', title:'Beatty\'s future', items:[
        { img:'f/future-1.jpg' },{ img:'f/future-2.jpg' },{ img:'f/future-3.jpg' },{ img:'f/future-4.jpg' },{ img:'f/future-5.jpg' } ],
      notes:'And those who come next.' },
    { kind:'stats', tone:'cream', title:'Some statistics', items:[
        { n:'9 in 10', label:'4E students qualify for JC', ring:90 },
        { n:'~100%', label:'of 4E students qualify for Poly or JC', ring:99 },
        { n:'3 in 10', label:'4N students qualify for PFP', ring:30 } ],
      notes:'Nine in ten Express students qualify for JC; nearly all qualify for Poly or JC; three in ten Normal students qualify for the Polytechnic Foundation Programme. [confirm] this year\'s figures.' },
    { kind:'pillars', title:'Choosing a secondary school', items:[
        { icon:'curious', title:'Ask', body:'What are their strengths, interests and abilities?', more:'What courses and programmes will develop these? Will the pace of learning suit them?' },
        { icon:'eye', title:'Consider', body:'School culture; courses; programmes, subjects and CCAs offered; location and transport', more:'If your child has special educational needs, schools with specialised facilities or resources' },
        { icon:'check', title:'Submit', body:'6 school options, so your child is more likely to get a school of choice', more:'Include 2 to 3 schools where your child\'s PSLE score is better than the school\'s cut off point' },
        { icon:'globe', title:'Refer to', body:'MOE\'s SchoolFinder', more:'Subjects, CCAs, location and contact details of every school' } ],
      notes:'MOE\'s advice, in four words: ask, consider, submit, refer.' },
    { kind:'statement', tone:'cream', icon:'arrow', title:'Your ranking of school choices matters',
      body:'The higher you rank your preferred school in your choice order, the better your child\'s chance of being posted there if there is a tie breaker. Schools\' PSLE score ranges can vary from year to year.',
      notes:'Rank the school you want first.' },
    { kind:'tiebreak', title:'Tie breakers in the new S1 Posting System',
      sub:'Used only if two or more students with the same PSLE score vie for the last place(s) in a school. A simplified example.',
      notes:'Five students, last places. Jane scores better, so she goes first to School A. The other four tie. Citizenship: Bryan and Mary are Singapore Citizens, so they get School B before Alan and Rina. Choice order: Bryan ranked School B higher than Mary, so Bryan gets it; Mary goes to School C. Ballot: Alan and Rina both ranked School D third; the ballot gives Alan School D, and Rina goes to School E.' },
    { kind:'quote', tone:'cream', quote:'Don\'t choose what you think is the best school, but what is the best school for your child.',
      by:'Fermencia Quek, with her daughter Caitlin, Beatty Secondary School', img:'f/parent-quote.jpg', fit:'contain',
      notes:'A Beatty parent, in MOE\'s guide to choosing a school.' },
    { kind:'photo', img:'f/choose.jpg', title:'Choose Beatty!', notes:'Choose Beatty.' },
  ]},

  /* ---------- After the card · phones stay on their boarding pass ---------- */
  deck_tail: { use:true, keepCard:true, chapter:'Your journey', slides:[
    { kind:'cover', crest:true, title:'Thank you!', sub:'Harmonising Hearts, Thriving Together',
      notes:'Thank the hall.' },
    { kind:'cover', title:'FAQs', phone:{ title:'Questions?', line:'Ask us anything.' }, notes:'Questions from the floor.' },
    { kind:'feature', tone:'cream', title:'Getting to Beatty', img:'f/map.jpg', items:[
        { icon:'pin', title:'Buses', body:'13, 28, 56, 73, 88, 93, 104, 105, 152, 153, 155, 157, 159, 163, 231, 232, 235, 238' },
        { icon:'arrow', title:'MRT', body:'Braddell, Caldecott' },
        { icon:'globe', title:'Website', body:'beattysec.moe.edu.sg' },
        { icon:'phone', title:'Call or email', body:'6256 9108 · beatty_ss@moe.edu.sg' } ],
      notes:'How to find us.' },
    { kind:'table', title:'Full SBB under the new AL system',
      sub:'To provide them with opportunities to reach their fullest potential, eligible students will be able to take selected subjects at a more demanding level.',
      head:['','PG2 and PG1 students who scored','May take'],
      rows:[['Standard Level','AL 5 or better','G3 EL, MA, SC and MTL'],['','AL 6 or better','G2 EL, MA, SC and MTL'],['Foundation Level','AL A','G2 EL, MA, SC and MTL']],
      note:'Students in PG3 will take all subjects at the G3 level, regardless of their individual AL scores at the PSLE.',
      notes:'How subject based banding works with AL scores.' },
    { kind:'links', title:'Connect@Beatty', items:[
        { label:'Facebook', url:'https://go.gov.sg/beattyfb' },{ label:'Instagram', url:'https://go.gov.sg/beattyig' },{ label:'LinkedIn', url:'https://go.gov.sg/beattyin' } ],
      notes:'Scan to follow us.' },
    { kind:'links', tone:'cream', title:'Your voice matters', sub:'Please share your feedback using this form.', items:[
        { label:'Feedback form', url:'https://go.gov.sg/oh25survey' } ],
      notes:'[confirm] this year\'s feedback link (last year: go.gov.sg/oh25survey).' },
  ]},
};
