/* HIVE RUSH pacing engine: one phase machine shared by the host screen and solo mode.
   lobby → countdown → (intro → question → reveal → board) × rounds → podium → finale
   It auto advances so the facilitator only presses START. Pause holds the game after the
   current phase; Skip jumps ahead. Questions end early once every squad has answered. */
(function () {
  const DUR = { countdown: 3600, intro: 3000, introGolden: 3800, reveal: 6500, board: 4800, podium: 10500 };

  HR.Engine = function (opts) {
    const rounds = opts.rounds;
    const skipBoard = !!opts.skipBoard;
    let st = { phase: 'lobby', round: -1, phaseAt: Date.now(), limit: 0, paused: false };
    let timer = null, timerDue = 0, earlyEnd = false, players = [];

    function write(patch) { Object.assign(st, patch); opts.write(Object.assign({}, patch)); opts.onChange && opts.onChange(st); }
    function clear() { if (timer) clearTimeout(timer); timer = null; timerDue = 0; }
    function schedule(ms) { clear(); timerDue = Date.now() + ms; timer = setTimeout(() => { timer = null; auto(); }, ms); }

    function nextOf(phase, round) {
      const last = rounds.length - 1;
      switch (phase) {
        case 'lobby': return ['countdown', -1];
        case 'countdown': return ['intro', 0];
        case 'intro': return ['question', round];
        case 'question': return ['reveal', round];
        case 'reveal': return round >= last ? ['podium', round] : (skipBoard ? ['intro', round + 1] : ['board', round]);
        case 'board': return ['intro', round + 1];
        case 'podium': return ['finale', round];
        default: return null;
      }
    }

    function enter(phase, round) {
      earlyEnd = false;
      const r = rounds[round];
      write({ phase, round, phaseAt: Date.now(), limit: phase === 'question' ? r.limit : 0 });
      const ms = phase === 'countdown' ? DUR.countdown
        : phase === 'intro' ? (r && r.golden ? DUR.introGolden : DUR.intro)
        : phase === 'question' ? r.limit * 1000 + 700
        : phase === 'reveal' ? DUR.reveal
        : phase === 'board' ? DUR.board
        : phase === 'podium' ? DUR.podium : 0;
      if (ms) schedule(ms); else clear();
      if (phase === 'question') checkAnswered();
    }

    function advance() { const n = nextOf(st.phase, st.round); if (n) enter(n[0], n[1]); }
    // automatic advance: questions always close on time; every other hold respects Pause
    function auto() { if (st.paused && st.phase !== 'question') return; advance(); }

    function checkAnswered() {
      if (st.phase !== 'question' || earlyEnd || !players.length) return;
      const all = players.every(p => p.answers && p.answers[st.round] != null);
      if (all) { earlyEnd = true; schedule(900); }
    }

    return {
      state: () => Object.assign({}, st),
      start() { if (st.phase === 'lobby') advance(); },
      skip() { advance(); },
      pause() { write({ paused: true }); },
      resume() { write({ paused: false }); if (!timer) advance(); },
      newGroup(session) { clear(); write({ phase: 'lobby', round: -1, phaseAt: Date.now(), limit: 0, paused: false, session }); },
      setPlayers(list) { players = list; checkAnswered(); },
      // after a host reload: pick up where the game doc left off and restart that phase's clock
      resumeFrom(doc) {
        st = { phase: doc.phase, round: doc.round, phaseAt: doc.phaseAt, limit: doc.limit || 0, paused: !!doc.paused };
        if (st.phase !== 'lobby' && st.phase !== 'finale') enter(st.phase, st.round);
        opts.onChange && opts.onChange(st);
      },
      timeLeft: () => (timerDue ? Math.max(0, timerDue - Date.now()) : 0),
      destroy: clear,
    };
  };
  HR.Engine.DUR = DUR;
})();
