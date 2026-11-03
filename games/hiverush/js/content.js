/* HIVE RUSH: all words and facts live here, so the game can be edited without touching code.
   Facts are drawn from the btyXperience app (experience/shared/data.js) and the school site
   copies in content/raw. Copy rule: no hyphens or dashes in anything a player sees. */
window.HR = window.HR || {};

HR.CONTENT = {
  openHouse: {
    day: 'Saturday',
    date: '21 November',
    time: '8:30 am to 12:30 pm',
    place: 'Beatty Secondary School',
    url: 'https://go.gov.sg/probeatty',
    urlLabel: 'go.gov.sg/probeatty',
  },

  rounds: [
    {
      type: 'mcq', title: 'Quick Pick', rule: 'Tap the right answer. Faster means more honey!',
      limit: 15,
      prompt: 'Which animal is on the Beatty school crest?',
      options: [
        { t: 'A busy bee', e: '🐝' },
        { t: 'A lion', e: '🦁' },
        { t: 'An eagle', e: '🦅' },
        { t: 'A dolphin', e: '🐬' },
      ],
      answer: 0,
      fact: 'The bees come from Admiral Beatty’s coat of arms. They stand for the hard work behind every success.',
    },
    {
      type: 'mythfact', title: 'Myth or Fact', rule: 'Swipe right for FACT, left for MYTH. Three cards, go!',
      limit: 20,
      prompt: 'Myth or fact?',
      cards: [
        { t: 'In NEXUS@BTY, every Beattyian gets to explore Artificial Intelligence.', fact: true,
          why: 'Fact! NEXUS@BTY connects Maths, Science and A.I. for every student.' },
        { t: 'Every Beattyian must join the same CCA.', fact: false,
          why: 'Myth! There are 17 CCAs: sports, uniformed groups, performing arts and clubs.' },
        { t: 'Beattyians can do an attachment at A*STAR, a real science research lab.', fact: true,
          why: 'Fact! A*STAR is one of 7 industry attachments.' },
      ],
      fact: 'NEXUS@BTY takes learning beyond the classroom: A.I., real labs, real industry.',
    },
    {
      type: 'slider', title: 'Closest Wins', rule: 'Slide to your best guess. The closer you are, the more honey!',
      limit: 15,
      prompt: 'Out of every 100 Beattyians, how many get their 1st or 2nd choice CCA?',
      min: 0, max: 100, start: 50, answer: 90, unit: 'out of 100', okWithin: 5,
      fact: '9 out of 10 Beattyians get their 1st or 2nd choice CCA. Your passion has a place here.',
    },
    {
      type: 'order', title: 'Spell the Dream', rule: 'Our 5 values spell a word. Tap them in order!',
      limit: 20,
      prompt: 'Tap the values in order to spell D R E A M',
      word: 'DREAM',
      items: ['Discipline', 'Resilience', 'Empathy', 'Adaptability', 'Mindfulness'],
      fact: 'DREAM: Discipline, Resilience, Empathy, Adaptability, Mindfulness. The compass every Beattyian sails by.',
    },
    {
      type: 'hunt', title: 'Passport Hunt', rule: 'Pop every place Beattyians fly to on exchange. Avoid the fakes!',
      limit: 20,
      prompt: 'Pop every REAL Beatty overseas exchange!',
      targets: ['South Korea', 'Japan', 'New Zealand', 'Estonia', 'Bali'],
      decoys: ['The Moon', 'Antarctica', 'Atlantis'],
      fact: '7 international exchanges and 7 industry attachments. Your passport is waiting.',
    },
    {
      type: 'mcq', title: 'Golden Round', rule: 'Double honey! Anyone can still win this.',
      limit: 15, golden: true,
      prompt: 'Our motto is “Non Vi Sed Arte”. What does it mean?',
      options: [
        { t: 'Not with force, but with skill', e: '🧠' },
        { t: 'Never give up, never stop', e: '🏃' },
        { t: 'Work hard, play hard', e: '💪' },
        { t: 'Be first, be fast', e: '⚡' },
      ],
      answer: 0,
      fact: 'Not with force, but with skill. Chosen by our first principal, Mr Meyer, from Admiral Beatty’s coat of arms.',
    },
  ],

  squadAdjectives: ['Turbo', 'Cosmic', 'Golden', 'Ninja', 'Rocket', 'Electric', 'Thunder', 'Mighty',
    'Hyper', 'Lightning', 'Galaxy', 'Sonic', 'Blazing', 'Atomic', 'Stealth', 'Royal', 'Super', 'Neon'],
  squadNouns: ['Bees', 'Buzzers', 'Stingers', 'Honeycombs', 'Wings', 'Swarm', 'Queens', 'Drones',
    'Hive', 'Pollinators', 'Busybodies', 'Honeypots'],
  avatars: ['🐝', '🚀', '⚡', '🔥', '👑', '🌟', '🍯', '🦄', '🎯', '🐉', '🤖', '🌈'],

  cheersRight: ['YES!', 'NAILED IT!', 'BRILLIANT!', 'SO SHARP!', 'BUZZING!', 'GENIUS!'],
  cheersWrong: ['So close!', 'Nearly!', 'Ooh, not quite!', 'Next one’s yours!'],
};
