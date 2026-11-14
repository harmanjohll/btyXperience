/* ============================================================
   THE SHOW'S SLIDES (used by index.html, the show). The older copies are deck/content-v2.js and deck/content.js.
   THE SHOW'S SLIDES: one plain list per deck. Edit words here; no code needed.

   Ported from the six Google Slides decks the show used to embed (steps 3, 7, 11, 18, 19, 24),
   rebuilt as native slides: same messages, numbers and photos, drawn in the show's own design,
   with the room's live data and a companion on every phone. Photos live in deck/img/<deck>/.

     use:true   the show uses these slides (the Google deck is no longer loaded)
     use:false  the Google deck comes back for that step

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
     live       show:'bees'|'poll'|'picks'|'pulse'|'words'|'fleet'|'questions', title    the room, live
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
    { kind:'cover', img:'a/identity.jpg', pos:'70% 35%', title:'Identity', sub:'Unity, hard work, and skill over force',
      notes:'Who we are begins with one Coat of Arms.' },
    { kind:'crest', tone:'cream', img:'a/crest.png', title:'Our crest', items:[
        { title:'Unity', body:'As symbolised by the admiral command colours of navy blue and yellow' },
        { title:'Hard work', body:'As symbolised by the bees, working together around the hive' },
        { title:'Non Vi Sed Arte', body:'Not with force, but with skill: our motto' } ],
      phone:{ title:'Our crest', line:'Unity, hard work, and skill over force.' },
      notes:'Three things our crest stands for. The navy and yellow: unity. Watch the bees: they come in together, circle the hive and each takes its place. That is hard work, done together. Then our motto, Non Vi Sed Arte: not with force, but with skill. We will shout it together when the boats set sail; ask them to remember it.' },
    { kind:'gallery', title:'They took charge of their future', imgs:[
        { src:'a/clip-future.jpg', fit:'contain' }, { src:'a/nabilah.jpg' }, { src:'a/results.jpg' }, { src:'a/clip-st.jpg', fit:'contain' }, { src:'a/clip-bh.jpg', fit:'contain' } ],
      phone:{ title:'They took charge of their future', line:'Our graduates, in the news.' },
      notes:'Our graduates in The Straits Times and Berita Harian: they turned their results around, with friends, teachers and their CCA beside them.' },
    { kind:'quotes', tone:'cream', title:'In their words', items:[
        { tag:'Friends', icon:'heart', q:'I believe that good and positive friends are important because we can help each other.', by:'A Beatty graduate' },
        { tag:'Teachers', icon:'school', q:'I would schedule Zoom consultations with my teachers and watch YouTube videos to understand geography concepts better.', by:'A Beatty graduate' },
        { tag:'CCA', icon:'flame', q:'Instead of going home to rest after training, we decided it was better to revise after training, especially on Saturdays, for three or four hours before heading home.', by:'Anisah, in Berita Harian (translated from Malay)' } ],
      phone:{ title:'In their words', line:'What helped our graduates: friends, teachers and their CCA.' },
      notes:'What helped them was the place, not luck: good friends who help each other, teachers they could reach any time, and a CCA where they trained hard and then studied together. That is the environment we build.' },
    { kind:'slope', title:'The world is changing, fast', sub:'The top ten skills, then and next', mark:['Judgment & Decision Making','Complex Problem Solving'],
      bty:[['Fluency of Ideas','ALP design thinking'],['Active Learning','our Learning Practice'],['Learning Strategies','MAP · GROW · ACT']],
      bridge:'Every one of these is a habit: habits of learning, habits of living.', cols:[
        { head:'In 2015', items:['Complex Problem Solving','Coordinating with Others','People Management','Critical Thinking','Negotiation','Quality Control','Service Orientation','Judgment & Decision Making','Active Listening','Creativity'] },
        { head:'In 2020', items:['People Management','Complex Problem Solving','Critical Thinking','Creativity','Coordinating with Others','Emotional Intelligence','Judgment & Decision Making','Service Orientation','Negotiation','Cognitive Flexibility'] },
        { head:'In 2030', items:['Judgment & Decision Making','Fluency of Ideas','Active Learning','Learning Strategies','Originality','System Evaluation','Deductive Reasoning','Complex Problem Solving','Systems Analysis','Monitoring'] } ],
      notes:'The red line: Judgment and Decision Making climbs from 8th to 1st. The gold line: Complex Problem Solving slips from 1st to 8th. Now watch the teal: three of tomorrow\'s top skills are what we already grow every day. Fluency of Ideas, in our ALP\'s design thinking. Active Learning, in our Learning Practice. Learning Strategies, in MAP, GROW and ACT. And every one of them is a habit: habits of learning, habits of living. Hold that thought; you will see each of them in a day at Beatty.' },
    { kind:'mission', tone:'cream', title:'Beattyian identity',
      belief:{ head:'Fundamental belief', text:'Every Beattyian has latent giftings who, when given opportunities and time, can develop talents that they can share with the community.' },
      items:[
        { icon:'thinker',   strong:'Adaptive', word:'Thinkers',     be:'critical, creative and user centric', become:'discerning decision makers, inventive problem solvers and empathetic communicators' },
        { icon:'mind',      strong:'Agile',    word:'Learners',     toLine:'To learn how to learn, how to live, and how to love', become:'joyful explorers, purposeful navigators and reflective knowledge builders' },
        { icon:'community', strong:'Active',   word:'Contributors', be:'driven, to serve and to add value', become:'impactful changemakers, compassionate connectors and community builders' } ],
      phone:{ title:'Beattyian identity', line:'Adaptive Thinkers, Agile Learners, Active Contributors.' },
      notes:'Start with the circle: our fundamental belief. Every Beattyian has latent giftings who, given opportunities and time, can develop talents to share with the community. From that belief come our three outcomes, our mission: Adaptive Thinkers, Agile Learners, Active Contributors. Each has who they are now (to be) and who they become.' },
    { kind:'venn', tone:'cream', title:'Purpose', centre:'BTY', foot:'Every Beattyian A Purpose-Driven Steward', items:[
        { tag:'VS', title:'Valued by self', q:'What allows you to live out your values, and help you find meaning and purpose?' },
        { tag:'RC', title:'Relatedness and community', q:'What is that which allows you to relate and connect with others?' },
        { tag:'PG', title:'Personal growth', q:'What area creates that desire to continue to improve?' },
        { tag:'VO', title:'Valued by others', q:'What value are you capable of generating that others require?' } ],
      notes:'Purpose lives where these four meet: what you value, who you connect with, how you grow, and what others need from you.' },
    { ch:'Our values', kind:'cover', title:'VALUES', rainbow:true, tints:['#FFFFFF','#5B7BFF','#FF4D52','#3FBF5A','#FFD23F','#FF9A3D'],
      phone:{ title:'Values', line:'Five values. Can you name them? A question is coming.' },
      notes:'And that brings us to our values. Next: the poll. Can they name all five?' },
  ]},

  /* ---------- Step 7 · A day at Beatty (after the DREAM poll and the value cards) ---------- */
  deck_b: { use:true, chapter:'Our values', slides:[
    { kind:'stairs', tone:'cream', title:'Perspective', sub:'Inspiration starts you. Habits carry you.',
      notes:'Watch the two climbers. On the right, inspiration alone: every leap needs a bigger burst, takes longer to gather, and fails more often; it gets harder each time. On the left, one burst of inspiration starts you, then routines become habits: small steps that get easier and quicker, like a spiral that rises faster as it turns.' },
    { kind:'cover', ch:'A day at Beatty', img:'b/morning.jpg', whole:true, day:'morning', title:'Morning', sub:'Reset, Refreshed, Ready',
      notes:'Let us walk through a day at Beatty, starting with the morning.' },
    { ch:'A day at Beatty', kind:'quote', tone:'cream', title:'Habits to build the child for life',
      quote:'You don\'t determine your future. You determine your habits. Your habits determine your future.', by:'F. M. Alexander',
      also:{ quote:'Schools are also social institutions and coming to school isn\'t just about tests; it\'s also about spending meaningful time with your peers. Early starts are also about forming habits that set students up for life, like how to start the day right.', by:'Harman Johll, in The Straits Times' },
      img:{ src:'b/clip-habits-v2.jpg', fit:'contain', cap:'The Straits Times, on our 7.30am start' },
      notes:'We kept our 7.30am start. Early starts are about forming habits that set students up for life.' },
    { ch:'A day at Beatty', kind:'mix', title:'FSBB@Beatty', phase1:'Subject classes: each student at their own level', phase2:'Form classes: mixed, together for the Common Core', legend:'subject levels', chip:'Common Core',
      foot:'Applied Learning Programme, Assembly Programmes, Art, Character & Citizenship Education, Design & Technology, Food & Consumer Education, Form Teacher Guidance, Music, Physical Education',
      notes:'Full Subject Based Banding. First the screen sorts students by subject level; then they mix into form classes, where they learn the Common Core together. [confirm] which colour means which level.' },
    { ch:'A day at Beatty', kind:'feature', tone:'cream', title:'Awareness: beliefs, emotions, behaviours',
      sub:'Why pay attention to emotions? Social and emotional competence has been strongly linked with being happier and contented, and stronger achievement.',
      imgs:[{ src:'b/journal-1.jpg', fit:'contain' },{ src:'b/journal-2.jpg', fit:'contain' },{ src:'b/journal-3.jpg', fit:'contain' },{ src:'b/journal-4.jpg', fit:'contain' }],
      items:[{ icon:'smile', title:'Positive self talk' },{ icon:'arrow', title:'Goal setting' },{ icon:'eye', title:'Identifying negative emotions' }],
      note:'A journal to recognise, understand, label, express and regulate emotions.',
      notes:'Every student keeps a journal that helps them notice and manage their emotions.' },
    { ch:'A day at Beatty', kind:'feature', eyebrow:'Applied Learning Programme (ALP)', title:'Nurturing future ready Beattyians', imgs:[{ src:'b/alp-bh-v2.jpg', fit:'contain', cap:'Berita Harian' }], items:[
        'Every Beattyian must be equipped with the ability to connect, extend and challenge the issues of tomorrow',
        'Beattyians must "Think. Create. Innovate." with empathy, for the betterment of lives of others and self',
        'Failure and play are learning experiences for success' ],
      notes:'Our ALP, featured in Berita Harian.' },
    { ch:'A day at Beatty', kind:'gallery', tone:'cream', title:'Makerspace@Beatty', sub:'A flexible learning space as a playground for learning through "structured" and "unstructured" play',
      imgs:[{ src:'b/maker-space.jpg' },{ src:'b/maker-neon.jpg' },{ src:'b/maker-drone.jpg', cap:'Drone programming' },{ src:'b/maker-heatpress.jpg', cap:'Heat press' },{ src:'b/maker-sewing.jpg', cap:'Sewing' },{ src:'b/maker-3d.jpg', cap:'3D printing' },{ src:'b/maker-laser.jpg', cap:'Laser cutting' }],
      notes:'Drones, heat press, sewing, 3D printing and laser cutting, all in one space.' },
    { ch:'A day at Beatty', kind:'ask', id:'maker_first', question:'What would you make first in our Makerspace?',
      options:['Program a drone','3D print something','Laser cut a design','Press my own tee'],
      notes:'Phones answer. Read the top pick aloud, then move on to ALP 3.0.' },
    { ch:'A day at Beatty', kind:'feature', title:'ALP 3.0', img:'b/alp3-v2.jpg', fit:'contain',
      items:[{ icon:'heart', label:'Why', title:'Tech for Good', body:'Technology that serves people and the community' },
        { icon:'futurist', label:'How', title:'Tech-enabled Design Thinker', body:'Design thinking, now with the tools of AI and machine learning' },
        { icon:'rocket', label:'Who', title:'Tech-enabled Changemaker', body:'Our mission, lived: to become impactful changemakers' }],
      notes:'ALP 3.0 in three lines. Why: Tech for Good, technology that serves people. How: our students become Tech-enabled Design Thinkers, design thinking now with AI and machine learning. Who they become: Tech-enabled Changemakers, the same impactful changemakers our mission names. [confirm] the wording.' },
    { ch:'A day at Beatty', kind:'gallery', title:'Think. Create. Innovate.', imgs:['b/alp-4.jpg','b/alp-1.jpg','b/alp-2.jpg','b/alp-3.jpg'],
      notes:'ALP in action.' },
    { ch:'A day at Beatty', kind:'gallery', tone:'cream', title:'On the world stage', sub:'Country award winners, ages 13 to 18, and learning with industry at Rockwell Automation', imgs:[{ src:'b/award-table.jpg', fit:'contain' },{ src:'b/award-team.jpg', whole:true },{ src:'b/rockwell.jpg', whole:true },{ src:'b/award-3.jpg' }],
      notes:'Our students among the country award winners. [confirm] the name of the competition.' },
    { ch:'A day at Beatty', kind:'feature', side:'right', title:'Personal Learning Devices', imgs:['b/pld-1.jpg','b/pld-2.jpg'], items:[
        'Personal Learning Devices (PLDs) are meant to support, modify and enhance what and how Beattyians learn',
        'We must understand how to use this, and the tools it comes with, to improve as learners',
        'Establish good routines and habits to make the best use of the tools given, to become deep thinkers and engaged learners' ],
      notes:'Every student has a Personal Learning Device; we teach them to use it well.' },
    { ch:'A day at Beatty', kind:'loop', tone:'cream', title:'Beattyians’ Learning Practice', centre:'Proactive',
      items:[
        { at:'bl', icon:'check',     head:'Prepare',     color:'#1BA39C', ink:'#0F7F79', qs:['Have I completed my homework?','Have I read ahead of the lesson?'] },
        { at:'top', icon:'curious',  head:'Participate', color:'#1F4E9C', ink:'#1F4E9C', qs:['Am I listening actively?','Am I asking questions to clarify my thinking?'] },
        { at:'br', icon:'innovator', head:'Process',     color:'#2E7BC4', ink:'#1F5F9E', qs:['What have I understood, and what am I yet to understand?','What notes should I make?'] } ],
      phone:{ title:'Our Learning Practice', line:'Prepare, participate, process: proactive learners.' },
      notes:'Learning to learn starts with a practice: prepare before the lesson, participate during it, process after it. Proactive learners ask these questions themselves.' },
    { ch:'A day at Beatty', kind:'feature', tone:'cream', title:'MAP your learning', sub:'Note making is a critical skill, and we teach it',
      imgs:[{ src:'b/notes-1.jpg', fit:'contain' },{ src:'b/notes-2.jpg', fit:'contain' }],
      items:[{ letter:'M', color:'#1F4E9C', title:'Make notes', body:'Capture the key ideas in your own words' },
        { letter:'A', color:'#2E7BC4', title:'Arrange', body:'Connect the ideas in a mind map' },
        { letter:'P', color:'#1BA39C', title:'Practise', body:'Test yourself from your notes' }],
      phone:{ title:'MAP your learning', line:'Make notes, arrange them, practise from them.' },
      notes:'MAP your learning, GROW your thinking, ACT on feedback. Note making is taught, not assumed: these are real student notes, with teacher feedback. [confirm] what M, A and P stand for: this draft reads Make notes, Arrange (mind map), Practise.' },
    { ch:'A day at Beatty', kind:'loop', tone:'cream', title:'GROW your thinking', centre:'Believe you can',
      items:[
        { letter:'G', head:'Gift yourself success',      color:'#F2A51A', ink:'#B06A00', qs:['What is one thing **I understand** from the lesson?'] },
        { letter:'R', head:'Rise above with small steps', color:'#E2463F', ink:'#C2312C', qs:['What will I do **to improve** on one thing that I **do not yet understand**?'] },
        { letter:'O', head:'Own your knowledge',          color:'#6A55C8', ink:'#5743B2', qs:['What is one real life **example**?'] },
        { letter:'W', head:'Watch for what comes next',   color:'#1BA39C', ink:'#0F7F79', qs:['What do I **already know** about the next topic?'] } ],
      phone:{ title:'GROW', line:'Gift, Rise, Own, Watch: four questions after every lesson.' },
      notes:'After every lesson, four questions, in a loop: Gift yourself success, Rise above with small steps, Own your knowledge, Watch for what comes next. Students write a GROW once a week in the E21CC Log.' },
    { ch:'A day at Beatty', kind:'loop', tone:'cream', title:'ACT on feedback', centre:'Feedback',
      items:[
        { letter:'A', head:'Acknowledge', color:'#000C53', ink:'#000C53', qs:['How do I feel about the feedback?','How might it help me learn better?'] },
        { letter:'C', head:'Connect',     color:'#FFE200', ink:'#7A6000', qs:['How does it connect with the success criteria and my goals?','And with previous feedback?'] },
        { letter:'T', head:'Test',        color:'#EC3237', ink:'#C2312C', qs:['What habit will I adjust? What will I do differently?','How will I know I am improving?'] } ],
      phone:{ title:'ACT on feedback', line:'Acknowledge, Connect, Test.' },
      notes:'When feedback comes back, students ACT on it: Acknowledge how they feel and how it helps; Connect it to the success criteria, their goals and earlier feedback; Test a change in habit, and check that they are improving. This is the ACT journal in the E21CC Log.' },
    { ch:'A day at Beatty', kind:'ask', id:'habit_first', question:'Which habit would you start first?',
      options:['Prepare before class','MAP my notes','GROW after each lesson','ACT on feedback'],
      notes:'Phones answer. Tie it back: every one of these is a habit, and habits carry you.' },
    { ch:'A day at Beatty', kind:'photo', img:'b/gifts-1.jpg', title:'Discovering and uncovering gifts',
      notes:'Every Beattyian has latent giftings; we help them find them.' },
    { ch:'A day at Beatty', kind:'gallery', title:'Education and career guidance', sub:'Professionals share their work with our classes', imgs:[{ src:'b/ecg-1.jpg', cap:'A pharmacist' },{ src:'b/ecg-2.jpg', cap:'A police officer' },{ src:'b/ecg-3.jpg', cap:'A healthcare professional' }],
      notes:'Guidance on pathways and careers, from Secondary 1: professionals visit our classes. [confirm] the three speakers.' },
    { kind:'cover', ch:'A day at Beatty', img:'b/canoe.jpg', whole:true, day:'afternoon', title:'Afternoon', sub:'Enriching Character, Pursuing Passions',
      notes:'In the afternoon: CCAs.' },
    { ch:'A day at Beatty', kind:'quote', tone:'cream', title:'Take flight with CCA',
      quote:'CCAs bring students from diverse backgrounds and different academic streams together.', by:'Ms Tng Ee Hwei, HOD of PE and CCA',
      also:{ quote:'CCAs are a big part of secondary school life. When it came to secondary school choices, the CCA played a big factor.', by:'Freya Swallow, who chose Beatty for canoeing' },
      img:'b/canoe-2.jpg',
      notes:'Freya chose Beatty because it offered canoeing as a CCA.' },
    { ch:'A day at Beatty', kind:'photo', img:'b/sports.jpg', title:'Sports & Games', notes:'Our sports and games CCAs.' },
    { ch:'A day at Beatty', kind:'photo', img:'b/ug.jpg', title:'Uniformed Groups', notes:'Our uniformed groups.' },
    { ch:'A day at Beatty', kind:'photo', img:'b/pa.jpg', title:'Performing Arts', notes:'Our performing arts groups.' },
    { ch:'A day at Beatty', kind:'gallery', imgs:['b/pa-1.jpg','b/pa-2.jpg','b/pa-3.jpg','b/pa-4.jpg','b/pa-5.jpg','b/pa-6.jpg'],
      phone:{ title:'Performing Arts', line:'Find your stage.' },
      notes:'More from our performing arts.' },
    { ch:'A day at Beatty', kind:'ask', id:'cca_family', question:'Which CCA family is calling you?',
      options:['Uniformed Groups','Performing Arts','Sports & Games','Clubs'],
      notes:'Phones answer. Invite families to the CCA booths after the show.' },
  ]},

  /* ---------- Step 11 · Passions: enrichment and NEXUS (after the CCA fact, fold A and the CCA poll) ---------- */
  deck_c: { use:true, chapter:'Passions', slides:[
    { kind:'feature', tone:'cream', title:'The joy of stewardship', sub:'Purpose-driven stewards',
      imgs:[{ src:'c/wheel.png', fit:'contain' },'c/stewards.jpg'], items:[
        { title:'Practices of leadership', body:'Model the way, inspire a shared vision, challenge the process, enable others to act, encourage the heart' },
        { title:'Joy of leadership', body:'Strengths, health, absorption, relationship, purpose' },
        { title:'At the heart', body:'DREAM: Discipline, Resilience, Empathy, Adaptability, Mindfulness' } ],
      notes:'Our leadership model: the practices of leadership, the joy of leadership, and DREAM at the centre.' },
    { kind:'gallery', title:'Stewardship in action', imgs:['c/lead-1.jpg','c/lead-2.jpg','c/lead-3.jpg'],
      notes:'Student leaders at work.' },
    { kind:'feature', title:'English Language and Literature enrichment', sub:'Developing students\' communication and critical thinking skills',
      imgs:['c/el-1.jpg','c/el-2.jpg','c/el-3.jpg'], items:[
        { icon:'voice', title:'PESA', body:'YMCA Plain English Speaking Awards: public speaking on a national stage' },
        { icon:'chart', title:'Debates', body:'Debate Fest, and debating beyond school' },
        { icon:'heart', title:'Community Engagement', body:'Using language to reach and serve the community' },
        { icon:'wave', title:'Reading the news', body:'Navigating the complexities of news reporting' } ],
      tags:['Readers\' Theatre','Your Say'],
      notes:'Public speaking at PESA, debates, community engagement, and learning to read the news well. [confirm] the lines under Debates and Community Engagement.' },
    { kind:'feature', tone:'cream', layout:'stack', title:'Mother Tongue Languages Fortnight', imgs:['c/mt-1.jpg','c/mt-2.jpg','c/mt-3.jpg'], items:[
        { title:'Immersion', body:'An immersive environment for students to learn and use their Mother Tongue' },
        { title:'Cultures', body:'An appreciation of the cultures in Singapore' },
        { title:'Community Engagement', body:'In dialects' } ],
      notes:'Two weeks of language and culture, and community engagement in dialects.' },
    { kind:'feature', title:'Math enrichment', imgs:['c/math-1.jpg','c/math-2.jpg','c/math-3.jpg',{ src:'c/simc.jpg', fit:'contain', cap:'SIMC² 2022' }], items:[
        { title:'Math Olympiad' }, { title:'Financial Literacy Workshop' },
        { title:'SIMC²', body:'Singapore International Mathematical Challenge: our teams did well in 2022, 2024 and 2026', years:['2022','2024','2026'] } ],
      notes:'Our teams did well at the Singapore International Mathematical Challenge in 2022, 2024 and 2026; the photo is the 2022 team.' },
    { kind:'feature', tone:'cream', side:'right', title:'Science enrichment', sub:'A curriculum of practice and identity', imgs:['c/sci-1.jpg','c/sci-2.jpg','c/sci-3.jpg','c/sci-4.jpg'], items:[
        { title:'Competitions', body:'International competitions, Physics Olympiad, Chemistry Olympiad, Engineering Innovation Challenge' },
        { title:'Research', body:'Science research, microbiology workshops, Science Day @ Beatty' },
        { title:'Work attachments', body:'At A*STAR, NUS and Pfizer' } ],
      tags:['Application & transfer','Depth of knowledge','Hands on learning'],
      notes:'Science as a practice: research, competitions and real work attachments.' },
    { kind:'ask', id:'enrich_first', question:'Which would you try first?',
      options:['Debate and public speaking','Math Olympiad','Science research','Mother Tongue Fortnight'],
      notes:'Phones answer. Whatever leads, there is a place for it here.' },
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
    { ch:'NEXUS@BTY', kind:'statement', logo:'nexus', title:'NEXUS', sub:'a connection or series of connections, linking two or more things; a central or focal point',
      notes:'Navigation and exploration, understandings and synergies, across disciplines.' },
    { ch:'NEXUS@BTY', kind:'mission', tone:'cream', logo:'nexus', title:'At its core, NEXUS@BTY grows',
      items:[
        { icon:'thinker',   strong:'Adaptive', word:'Thinkers',     be:'critical, creative and user centric thinkers', become:'discerning decision makers, inventive problem solvers and empathetic communicators' },
        { icon:'mind',      strong:'Agile',    word:'Learners',     toLine:'To learn how to learn, how to live, and how to love', become:'joyful explorers, purposeful navigators and reflective knowledge builders' },
        { icon:'community', strong:'Active',   word:'Contributors', be:'driven, to serve and to add value', become:'impactful changemakers, compassionate connectors and community builders' } ],
      phone:{ title:'At its core, NEXUS@BTY grows', line:'Adaptive Thinkers, Agile Learners, Active Contributors.' },
      notes:'NEXUS grows the same three things as our mission: Adaptive Thinkers, Agile Learners and Active Contributors.' },
    { ch:'NEXUS@BTY', kind:'steps', title:'Three stages, one journey', items:[
        { tag:'NX101', title:'Critical Cornerstones', body:'The Critical Inquiry Project: thinking across Geography, Mathematics and Applied Learning.', who:'All students' },
        { tag:'NX201', title:'Constructive Curiosities', body:'STEM Playgrounds: design and computational thinking across Mathematics, the Sciences and AI.', who:'All students' },
        { tag:'NX301 · NX302', title:'Creative Connections', body:'An international exchange or an industry attachment, with a certificate of Merit or Distinction.', who:'Selected students' } ],
      notes:'All students take NX101 and NX201. Selected students go on to NX301 or NX302.' },
    { ch:'NEXUS@BTY', kind:'feature', tone:'cream', title:'NX101: Critical Inquiry Project',
      sub:'An interdisciplinary learning adventure that enables students to connect concepts and processes across Geography, Mathematics and Applied Learning',
      imgs:['c/nx101-1.jpg','c/nx101-2.jpg','c/nx101-3.jpg','c/nx101-4.jpg'],
      notes:'Secondary 1s test the water of the Kallang River, and apply what they learn across subjects.' },
    { ch:'NEXUS@BTY', kind:'gallery', title:'NX201: STEM Playgrounds', sub:'Secondary 2: AI and its applications', imgs:['c/nx201-1.jpg','c/nx201-2.jpg','c/nx201-3.jpg','c/nx201-4.jpg','c/nx201-5.jpg'],
      notes:'Secondary 2s explore AI and its applications.' },
  ]},

  /* ---------- NEXUS@BTY · the exchanges (before the globe pick) ---------- */
  deck_d: { use:true, chapter:'NEXUS@BTY', slides:[
    { kind:'pins', tone:'cream', title:'Internationalisation Programme', img:'d/worldmap.jpg', home:{ x:66.8, y:54.4, label:'Beatty, Singapore' }, pins:[
        { x:30.4, y:5.0,  lx:33,   ly:1.5,  label:'Digital Citizenship & Smart Nations e-Exchange with Estonia', sub:'12 to 20 Sec 3 students' },
        { x:74.1, y:25.3, lx:47,   ly:25,   label:'A.I. Research Exchange with Middle Schools, South Korea', sub:'8 to 10 Sec 3 students' },
        { x:79.2, y:24.2, lx:76,   ly:5,    label:'Science & Mathematics Research Exchange with Mutsuzawa High School', sub:'10 to 12 Sec 3 students' },
        { x:76.4, y:25.9, lx:78,   ly:31,   label:'Science Research Exchange with SSH in Mihara, Hiroshima', sub:'10 to 12 Sec 3 students' },
        { x:72.9, y:63.7, lx:48,   ly:58,   label:'Geographical Investigation, Bali', sub:'All Sec 3 Geography students' },
        { x:74.1, y:68.6, lx:77,   ly:62,   label:'Literary Adventures, Bali', sub:'All Sec 3 Literature students' },
        { x:93.6, y:88.1, lx:70,   ly:82,   label:'Leadership x Language Arts Exchange with Aorere College', sub:'8 to 10 Sec 3 students' },
        { x:65.8, y:37.6, lx:41,   ly:37,   label:'Ecostewardship Exchange, Hanoi, Vietnam', sub:'16 to 20 Sec 3 students' } ],
      stat:{ n:124, pre:'Up to', label:'Sec 3 students on an exchange each year', sub:'close to half the cohort', x:-16, y:50 },
      notes:'Eight programmes across the region, now with Ecostewardship in Hanoi. Count them up: up to 124 Secondary 3 students a year, close to half the cohort, go on an exchange (the other programmes at their maximum, plus about 40 Geography and Literature students in Bali).' },
    { kind:'gallery', title:'NX3014: Leadership x Language Arts @ New Zealand', sub:'An exchange with Aorere College', imgs:[{ src:'d/nz-1.jpg', whole:true },'d/nz-2.jpg','d/nz-3.jpg','d/nz-4.jpg'],
      notes:'Leadership and language arts with Aorere College.' },
    { kind:'gallery', tone:'cream', title:'NX3011 and NX3012: Japan', sub:'Mihara City International Exchange · Mutsuzawa High School International Exchange',
      imgs:[{ src:'d/jp-1.jpg', cap:'Mihara City' },{ src:'d/jp-2.jpg', cap:'Mutsuzawa High School', whole:true }],
      notes:'Science research in Mihara, Hiroshima, and science and mathematics in Mutsuzawa.' },
    { kind:'gallery', title:'NX3015: Geographical Investigation @ Bali', imgs:['d/bali-1.jpg','d/bali-2.jpg','d/bali-3.jpg','d/bali-4.jpg','d/bali-5.jpg'],
      notes:'Every Secondary 3 Geography student reads a real volcanic landscape.' },
  ]},

  /* ---------- NEXUS@BTY · industry attachments (between the globe and the map pick) ---------- */
  deck_d2: { use:true, chapter:'NEXUS@BTY', slides:[
    { kind:'gallery', title:'NX302: Industry Attachments', sub:'40 to 50 students each year', imgs:['d/ind-1.jpg','d/ind-2.jpg','d/ind-3.jpg','d/ind-4.jpg'],
      notes:'Selected students, 40 to 50 each year, spend time with our industry partners.' },
    { kind:'logos', tone:'cream', title:'Our industry partners', items:[
        { img:'d/logo-rockwell.png', name:'Rockwell Automation' },{ img:'d/logo-pil.png', name:'PIL' },{ img:'d/logo-astar.png', name:'A*STAR' },{ img:'d/logo-nus.png', name:'NUS' },
        { img:'d/logo-sph.png', name:'SPH' },{ img:'d/logo-deloitte.png', name:'Deloitte' },{ img:'d/logo-ite.png', name:'ITE' },{ img:'d/logo-science.png', name:'Science Centre Singapore' } ],
      notes:'Rockwell Automation, PIL, A*STAR, NUS, SPH, Deloitte, ITE and the Science Centre.' },
    { kind:'gallery', title:'European Union @ BTY', imgs:['d/eu-1.jpg',{ src:'d/eu-2.jpg', cap:'Estonia: Digital Transformation & Sustainability', whole:true },'d/eu-3.jpg'],
      sub:'Ms Eszter Nemeth, Deputy Head of Mission of the EU in Singapore, on the roles youths can play in EU Singapore ties',
      notes:'The EU came to us.' },
    { kind:'stats', tone:'cream', title:'NEXUS@BTY: out into the world', items:[
        { n:'124', label:'Sec 3s on an international exchange, at most', ring:48 },
        { n:'40 to 50', label:'on an industry attachment', ring:17 },
        { n:'2 in 3', label:'Sec 3s on one or both', ring:65 } ],
      phone:{ title:'Out into the world', line:'About 2 in 3 of our Sec 3s go on an exchange or an attachment.' },
      notes:'Put together: up to 124 on an international exchange and 40 to 50 on an industry attachment. That is about 2 in 3 of our Secondary 3s out in the world through NEXUS@BTY. [confirm] the cohort size behind the rings (about 260).' },
  ]},

  /* ---------- Heart and home: our teachers and our spaces ---------- */
  deck_e: { use:true, chapter:'Heart and home', slides:[
    { kind:'gallery', whole:true, title:'Our caring teachers', sub:'A team of Innovative, Caring and Engaged Educators', imgs:['e/teachers-1.jpg','e/teachers-2.jpg'],
      notes:'Our teachers.' },
    { kind:'statement', tone:'cream', title:'Each child is a gift',
      body:'Beatty is a community that allows its learners to discover who they are, as they uncover their giftings through a broad range of learning opportunities and experiences.',
      notes:'This stems from a deep belief that each child is a gift, and that Beatty is a community that will allow its learners to discover who they are as they uncover their giftings through a broad range of learning opportunities and experiences.' },
    { kind:'quote',
      quote:'The first thing we must all do is love and care for our children; everything else will fall in place.',
      phone:{ title:'Love and care first', line:'Everything else will fall in place.' },
      notes:'Read the rest aloud: To love and care is to do what is required for each child to realise and actualise his or her potential, and to gradually become the best version of themselves. It is about learning who they are, learning with and from them, and to then know what they need most at each stage of their journey so as to set them on the right course to lead meaningful, purposeful lives.' },
    { kind:'gallery', tone:'cream', title:'Our canteen makeover!', imgs:['e/canteen-1.jpg','e/canteen-2.jpg','e/canteen-3.jpg','e/canteen-4.jpg',{ src:'e/canteen-cna-v2.jpg', fit:'contain', cap:'CNA' }],
      notes:'Our renewed canteen, and our canteen operator, featured on CNA.' },
    { kind:'photo', img:'e/classroom.jpg', title:'Our classrooms', notes:'Bright, flexible classrooms.' },
    { kind:'gallery', title:'Environment matters!', imgs:[{ src:'e/foyer.jpg', cap:'Foyer' },{ src:'e/heritage-v2.jpg', cap:'Heritage Gallery' },{ src:'e/library.jpg', cap:'Library & classrooms' },{ src:'e/linkway.jpg', cap:'Linkway' },{ src:'e/entrance.jpg', cap:'Entrance' }],
      notes:'Spaces designed for learning and belonging.' },
    { kind:'gallery', tone:'cream', title:'Continuous improvement', sub:'Plans for our new spaces', imgs:['e/future-1.jpg','e/future-2.jpg','e/future-3.jpg'],
      notes:'And we keep improving.' },
    { kind:'statement', tone:'cream', title:'One last fold',
      body:'Pull your boat open. In a moment, the whole hall sets sail together.',
      notes:'Lead into the final fold beat.' },
  ]},

  /* ---------- Your journey (after Set Sail and the Hive of aspirations): straight to the card ---------- */
  deck_f: { use:true, chapter:'Your journey', slides:[
    { kind:'cover', img:'f/rainbow-v2.jpg', whole:true, eyebrow:'DREAM', title:'Chase the rainbow at Beatty', sub:'where your aspirations take flight',
      notes:'Chase the rainbow at Beatty.' },
    { kind:'people', title:'Beatty\'s illustrious alumni', items:[
        { img:'f/alum-ow.jpg', name:'Ow Chio Kiat', role:'Chairman, Stamford Land' },
        { img:'f/alum-goh.jpg', name:'Justice Goh Joon Seng', role:'High Court Judge' },
        { img:'f/alum-shih.jpg', name:'Prof Shih Choon Fong', role:'President, NUS' },
        { img:'f/alum-loh.jpg', name:'Prof Loh Hong Sai', role:'Dental Surgeon' } ],
      notes:'Some of those who came before. [confirm] roles (some are former).' },
    { kind:'people', tone:'cream', title:'Beatty\'s future', sub:'Our students today. Next year, you.', items:[
        { img:'f/future-1.jpg' },{ img:'f/future-2.jpg' },{ img:'f/future-3.jpg' },{ img:'f/future-4.jpg' },{ you:true, icon:'smile', name:'You', role:'Class of 2030' } ],
      phone:{ title:'Beatty\'s future', line:'Our students today. And next year, you.' },
      notes:'Those who come next: our students today, and the last circle is for them. You.' },
    { kind:'stats', tone:'cream', title:'Where Beattyians go next', items:[
        { n:'9 in 10', label:'4E students qualify for JC', ring:90 },
        { n:'~100%', label:'of 4E students qualify for Poly or JC', ring:99 },
        { n:'3 in 10', label:'4N students qualify for PFP', ring:30 } ],
      notes:'Nine in ten Express students qualify for JC; nearly all qualify for Poly or JC; three in ten Normal students qualify for the Polytechnic Foundation Programme. [confirm] this year\'s figures.' },
    { kind:'quote', tone:'cream', quote:'Don\'t choose what you think is the best school, but what is the best school for your child.',
      by:'A Beatty parent, in MOE\'s #ProudOfP6ers', img:'f/parent-quote.jpg', fit:'contain',
      notes:'A Beatty parent, with her daughter Caitlin, in MOE\'s guide to choosing a school. [confirm] the spelling of her name before saying it (the poster has Ferrmancis Quek).' },
    { kind:'photo', img:'f/choose.jpg', title:'Choose Beatty!', notes:'Choose Beatty. Next press: the Boarding Pass lands on every phone.' },
  ]},

  /* ---------- After the card · phones stay on their boarding pass: how to choose, then questions ---------- */
  deck_tail: { use:true, keepCard:true, chapter:'Your journey', slides:[
    { kind:'pillars', layout:'rows', heads:['MOE\'s advice','First','Then'], title:'Choosing a secondary school', items:[
        { icon:'curious', title:'Ask', body:'What are their strengths, interests and abilities?', more:'What courses and programmes will develop these? Will the pace of learning suit them?' },
        { icon:'eye', title:'Consider', body:'School culture; courses; programmes, subjects and CCAs offered; location and transport', more:'If your child has special educational needs, schools with specialised facilities or resources' },
        { icon:'check', title:'Submit', body:'6 school options, so your child is more likely to get a school of choice', more:'Include 2 to 3 schools where your child\'s PSLE score is better than the school\'s cut off point' },
        { icon:'globe', title:'Refer to', body:'MOE\'s SchoolFinder', more:'Subjects, CCAs, location and contact details of every school' } ],
      notes:'Every phone now holds its Boarding Pass and keeps it to the end. How to choose, MOE\'s advice in four words: ask, consider, submit, refer.' },
    { kind:'statement', tone:'cream', title:'Your ranking of school choices matters',
      body:'The higher you rank your preferred school in your choice order, the better your child\'s chance of being posted there if there is a tie breaker. Schools\' PSLE score ranges can vary from year to year.',
      notes:'Rank the school you want first.' },
    { kind:'tiebreak', title:'Tie breakers in the new S1 Posting System',
      sub:'Used only if two or more students with the same PSLE score vie for the last place(s) in a school. A simplified example.',
      notes:'Five students, last places. Jane scores better, so she goes first to School A. The other four tie. Citizenship: Bryan and Mary are Singapore Citizens, so they get School B before Alan and Rina. Choice order: Bryan ranked School B higher than Mary, so Bryan gets it; Mary goes to School C. Ballot: Alan and Rina both ranked School D third; the ballot gives Alan School D, and Rina goes to School E.' },
    { kind:'table', title:'Full SBB under the new AL system',
      sub:'To provide them with opportunities to reach their fullest potential, eligible students will be able to take selected subjects at a more demanding level.',
      head:['','PG2 and PG1 students who scored','May take'],
      rows:[['Standard Level','AL 5 or better','G3 EL, MA, SC and MTL'],['','AL 6 or better','G2 EL, MA, SC and MTL'],['Foundation Level','AL A','G2 EL, MA, SC and MTL']],
      note:'Students in PG3 will take all subjects at the G3 level, regardless of their individual AL scores at the PSLE.',
      notes:'How subject based banding works with AL scores.' },
    { kind:'cover', crest:true, title:'Thank you!', sub:'Harmonising Hearts, Thriving Together',
      notes:'Thank the hall.' },
    { kind:'live', show:'questions', title:'Your questions', sub:'Ask from your phone: tap Ask a question under your Boarding Pass',
      notes:'Questions sent from the phones appear here, newest first. Click a question to bring it to the front; click its cross to take it off the screen. Questions from the floor are welcome too.' },
    { kind:'feature', tone:'cream', title:'Getting to Beatty', img:'f/map.jpg', items:[
        { icon:'pin', title:'Buses', body:'13, 28, 56, 73, 88, 93, 104, 105, 152, 153, 155, 157, 159, 163, 231, 232, 235, 238' },
        { icon:'arrow', title:'MRT', body:'Braddell, Caldecott' },
        { icon:'globe', title:'Website', body:'beattysec.moe.edu.sg' },
        { icon:'phone', title:'Call or email', body:'6256 9108 · beatty_ss@moe.edu.sg' } ],
      notes:'How to find us.' },
    { kind:'links', title:'Connect@Beatty', items:[
        { label:'Facebook', url:'https://go.gov.sg/beattyfb' },{ label:'Instagram', url:'https://go.gov.sg/beattyig' },{ label:'LinkedIn', url:'https://go.gov.sg/beattyin' } ],
      notes:'Scan to follow us.' },
    { kind:'links', tone:'cream', title:'Your voice matters', sub:'Please share your feedback using this form.', items:[
        { label:'Feedback form', url:'https://go.gov.sg/oh25survey' } ],
      notes:'[confirm] this year\'s feedback link (last year: go.gov.sg/oh25survey).' },
  ]},
};
