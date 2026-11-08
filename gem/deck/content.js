/* ============================================================
   THE SHOW'S SLIDES — one plain list per deck. Edit words here; no code needed.

   Each deck replaces a Google Slides embed in the show (btx27.html).
     use:true   → the show uses these slides in place of the Google deck.
     use:false  → the Google deck stays; preview these with btx27.html?presenter=true&scenes=1

   Slide kinds (pick one per slide):
     statement  title, sub, body, icon         one big idea
     duo        items:[{label,title,body}]      two ideas side by side
     pillars    title, items:[{icon,title,body}]   three to five cards
     stats      title, items:[{n,label,sub,ring}]  big numbers that count up (ring: a % to draw)
     steps      title, items:[{tag,title,body,who}]   a journey, left to right
     acronym    title, letters:[[L,word,line]]       letters that build one by one
     quote      quote, by
     bars       title, sub, groups:[{label, rows:[[name,value]]}], unit   school data as bars
     live       show:'bees'|'poll'|'picks'|'pulse'|'words'|'fleet', title    the room, live
     ask        id, question, options:[…]       phones answer; the bars fill live

   Every slide may also have:
     notes   what to say (shown in the presenter view, never on the big screen)
     phone   what the phones show; leave it out and the phones get the slide's headline.
             phone:{ title, line } or phone:false (phones show the chapter line)

   Icons: bee innovator explorer trailblazer steward artist futurist voice eco flame rocket
          smile curious phone sail globe pin check eye hex spark wave fold chart poll heart school arrow

   DRAFT: written from the school's own published words (mission, vision, DREAM, HEART,
   NEXUS@BTY, programmes) while the Google decks were out of reach. Lines marked
   [confirm] in the notes need a check before use:true.
   ============================================================ */
window.BTY_DECKS = {

  /* ---------- Step 3 · Who we are (after the welcome film) ---------- */
  deck_a: { use:false, chapter:'Who we are', slides:[
    { kind:'pillars', title:'One coat of arms, three gifts',
      items:[
        { icon:'sail',   title:'Our name',  body:'Admiral Earl David Beatty. Our navy and yellow, and our crest, come from his Coat of Arms.' },
        { icon:'bee',    title:'Our bee',   body:'A hive of busy bees on the same Coat of Arms: the hard work that success asks of us.' },
        { icon:'school', title:'Our motto', body:'Non Vi Sed Arte, chosen by Mr Meyer, our first principal.' } ],
      notes:'Everything about us starts with one Coat of Arms: our name, our colours, our bee and our motto. Point at the crest in the corner.' },
    { kind:'statement', icon:'school', eyebrow:'Our motto', title:'Non Vi Sed Arte', latin:true, sub:'Not with force but with skill.',
      body:'Skill is learned, practised and shared. That is the work of a hive.',
      notes:'Say the motto slowly. We will shout it together at the end, when the boats set sail; tell them to remember it.' },
    { kind:'duo', items:[
        { label:'Our mission', title:'Nurturing Adaptive Thinkers, Agile Learners and Active Contributors' },
        { label:'Our vision',  title:'Every Beattyian A Purpose Driven Steward' } ],
      phone:{ title:'Every Beattyian A Purpose Driven Steward', line:'Nurturing Adaptive Thinkers, Agile Learners and Active Contributors.' },
      notes:'Mission and vision, verbatim. A steward looks after something bigger than themselves: a team, a community, the planet.' },
    { kind:'live', show:'bees', title:'The Hive tonight',
      notes:'This is the room, live: the bee each person found in the compass quiz. Call out the biggest group and the rarest bee.' },
    { kind:'statement', icon:'heart', eyebrow:'Our 2026 theme', title:'Harmonising Hearts, Thriving Together',
      body:'Many voices, held together; each of us growing, all of us growing together.',
      notes:'Our theme this year. Harmonising is not sounding the same; it is many different voices that work together. Next: our first fold.' },
  ]},

  /* ---------- Step 7 · Our values (after the DREAM poll and the value cards) ---------- */
  deck_b: { use:false, chapter:'Our values', slides:[
    { kind:'live', show:'poll', poll:'dream_poll', title:'How well does the hall know DREAM?',
      notes:'The poll result from a minute ago, recalled. Praise the hall if most got it right.' },
    { kind:'acronym', title:'HEART: how we carry ourselves', letters:[
        ['H','Honour','We keep our word'],
        ['E','Engagement','We show up, fully'],
        ['A','Affinity','We find our people'],
        ['R','Relatedness','We look out for each other'],
        ['T','Transformation','We grow, every year'] ],
      notes:'HEART is our 2026 character framework. [confirm] The short line under each word is a draft; replace with the school\'s own words.' },
    { kind:'statement', icon:'heart', eyebrow:'HEART and DREAM', title:'HEART is a posture; DREAM is who we become',
      body:'HEART is how we stand with one another. DREAM (Discipline, Resilience, Empathy, Adaptability, Mindfulness) is what we grow, day by day.',
      notes:'The two work together, not in place of each other.' },
    { kind:'ask', id:'grow_value', question:'Which value do you most want to grow?',
      options:['Discipline','Resilience','Empathy','Adaptability','Mindfulness'],
      notes:'Phones answer now. Watch the bars fill; read out the leader. There is no wrong answer.' },
  ]},

  /* ---------- Step 11 · Passions (after the CCA fact, fold A and the CCA poll) ---------- */
  deck_c: { use:false, chapter:'Passions', slides:[
    { kind:'stats', title:'A place for every kind of bee', items:[
        { n:'17', label:'CCAs to belong to' },
        { n:'4',  label:'CCA families' },
        { n:'90', suffix:'%', label:'get their 1st or 2nd choice CCA', ring:90 } ],
      notes:'Seventeen CCAs, four families, and nine in ten students land a CCA they chose. [confirm] the 90% figure for this year.' },
    { kind:'pillars', title:'Four families', items:[
        { icon:'steward', title:'Uniformed Groups', body:'Lead, serve and stand tall together.' },
        { icon:'artist',  title:'Performing Arts',  body:'Find your stage and your voice.' },
        { icon:'flame',   title:'Sports & Games',   body:'Train hard, play fair, win as a team.' },
        { icon:'spark',   title:'Clubs',            body:'Follow a curiosity with friends who share it.' } ],
      notes:'[confirm] Name two or three CCAs from each family, and a recent highlight.' },
    { kind:'live', show:'poll', poll:'cca', title:'Did the hall guess right?',
      notes:'The CCA poll, recalled.' },
    { kind:'duo', items:[
        { label:'Applied Learning Programme', title:'Learning that meets the real world', body:'Real world applied learning across disciplines.' },
        { label:'Learning for Life Programme', title:'Character, values and life skills', body:'Values, character and life skills development.' } ],
      notes:'Our ALP and LLP. [confirm] One example of each from this year.' },
    { kind:'ask', id:'cca_family', question:'Which CCA family is calling you?',
      options:['Uniformed Groups','Performing Arts','Sports & Games','Clubs'],
      notes:'Phones answer. Invite parents to visit the CCA booths after the show.' },
  ]},

  /* ---------- Step 18 · NEXUS@BTY (after the globe and the map) ---------- */
  deck_d: { use:false, chapter:'NEXUS@BTY', slides:[
    { kind:'statement', icon:'globe', eyebrow:'Our signature programme', title:'NEXUS@BTY',
      sub:'A journey that sparks discovery, carefully curated and diligently designed.',
      notes:'NEXUS@BTY is our signature interdisciplinary programme. Every Beattyian takes the journey.' },
    { kind:'steps', title:'Three stages, one journey', items:[
        { tag:'NX101', title:'Critical Cornerstones', body:'The Critical Inquiry Project: thinking across Geography, Mathematics and Applied Learning.', who:'All students' },
        { tag:'NX201', title:'Constructive Curiosities', body:'STEM Playgrounds: design and computational thinking across Mathematics, the Sciences and AI.', who:'All students' },
        { tag:'NX301 · NX302', title:'Creative Connections', body:'An industry attachment or an international exchange, with a certificate of Merit or Distinction.', who:'Selected students' } ],
      notes:'All students take NX101 and NX201 and are certified. Selected students go on to NX301 or NX302: the exchanges and attachments you just chose from.' },
    { kind:'pillars', title:'At its core, NEXUS@BTY grows', items:[
        { icon:'innovator', title:'Critical and creative', body:'Discerning decision makers, inventive problem solvers and empathetic communicators.' },
        { icon:'explorer',  title:'Learning how to learn', body:'Joyful explorers, purposeful navigators and reflective knowledge builders.' },
        { icon:'steward',   title:'Driven to serve',       body:'Impactful changemakers, compassionate connectors and community builders.' } ],
      notes:'The three outcomes, in the school\'s own words.' },
    { kind:'bars', title:'Where the doors open', sub:'Places on each programme', unit:'places', groups:[
        { label:'International exchanges', rows:[['Bali · Geography',30],['Hanoi',20],['Estonia',16],['Mihara, Japan',14],['Mutsuzawa, Japan',14],['South Korea',12],['New Zealand',10]] },
        { label:'Industry attachments · 7 to 8 months', rows:[['Makita × ITE West',16],['Rockwell Automation',12],['PIL',12],['Berita Harian',8],['Tamil Murasu',8],['A*STAR',6]] } ],
      phone:{ title:'14 doors into the wider world', line:'8 international exchanges · 6 industry attachments.' },
      notes:'[confirm] Places per programme are from last year\'s exchange cards; Literature · Bali is not yet listed.' },
    { kind:'live', show:'picks', title:'Where tonight\'s hall would go',
      notes:'What the room chose on the globe and the map, live.' },
  ]},

  /* ---------- Step 19 · Your pathway ---------- */
  deck_e: { use:false, chapter:'Your pathway', slides:[
    { kind:'statement', icon:'explorer', eyebrow:'Where every pathway leads', title:'Every Beattyian A Purpose Driven Steward',
      notes:'Our vision, again: every pathway at Beatty leads here.' },
    { kind:'pillars', title:'Built around every learner', items:[
        { icon:'chart',  title:'Full Subject Based Banding', body:'Subjects at the level that fits each student.' },
        { icon:'spark',  title:'Applied Learning', body:'Real world learning across disciplines.' },
        { icon:'heart',  title:'Learning for Life', body:'Values, character and life skills.' },
        { icon:'school', title:'Character and Citizenship', body:'Growing as a person and as a citizen.' },
        { icon:'voice',  title:'Hearing Loss Support', body:'Specialised support for students with hearing loss.' } ],
      notes:'[confirm] Programme details evolve; check each line against the school website.' },
    { kind:'ask', id:'school_choice', question:'What matters most when you choose a secondary school?',
      options:['Caring teachers and friends','Opportunities beyond the classroom','A CCA I love','Strong academic pathways'],
      notes:'Phones answer. Speak to whichever wins: we have an answer for each.' },
    { kind:'statement', icon:'sail', eyebrow:'Next', title:'One last fold',
      body:'Pull your boat open. In a moment, the whole hall sets sail together.',
      notes:'Lead into the final fold beat.' },
  ]},

  /* ---------- Step 24 · Your journey (after Set Sail and the Hive of aspirations) ---------- */
  deck_f: { use:false, chapter:'Your journey', slides:[
    { kind:'live', show:'fleet', title:'boats set sail tonight',
      notes:'The fleet count, live: every boat folded and launched in this hall.' },
    { kind:'live', show:'words', title:'Tonight, the hall dreams of',
      notes:'The words from every boat. Read a few aloud.' },
    { kind:'live', show:'pulse', title:'How the hall felt',
      notes:'The mood check from earlier.' },
    { kind:'statement', icon:'heart', eyebrow:'Come grow with us', title:'Harmonising Hearts, Thriving Together',
      body:'Make Beatty your 1st choice.',
      notes:'Thank the hall. Next: their Compass Card, on every phone.' },
  ]},
};
