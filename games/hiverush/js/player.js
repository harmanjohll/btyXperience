/* HIVE RUSH player device. The facilitator enters the Game PIN once per device; after that,
   every new group only names their squad and taps READY. Zero typing for the children. */
(function () {
  const C = HR.CONTENT, FX = HR.FX, esc = FX.esc, Net = HR.Net, ROUNDS = C.rounds;
  const app = document.getElementById('app');
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  const params = new URLSearchParams(location.search);

  const S = {
    pin: params.get('pin') || ls.get('hr_pin'), solo: params.has('solo'),
    game: null, me: null, players: [], viewKey: null, play: null, live: null, unsubs: [],
    squad: null, ranks: {}, timeoutSent: {}, uid: null, engine: null,
  };

  /* ---------- helpers ---------- */
  const active = () => {
    const g = S.game; if (!g) return [];
    const k = g.kicked || [];
    return S.players.filter(p => p.session === g.session && !k.includes(p.id));
  };
  const ranked = () => active().slice().sort((a, b) => (b.score || 0) - (a.score || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));
  const myAnswer = r => (S.me && S.me.answers && S.me.answers[r]) || null;
  function hud() {
    const chip = document.getElementById('squadChip');
    const g = S.game, me = S.me;
    if (chip) {
      if (me && g && me.session === g.session && g.phase !== 'lobby') {
        chip.innerHTML = `<span>${esc(me.emoji)}</span><b>${esc(me.name)}</b><i>${FX.fmt(me.score)} 🍯</i>`; chip.hidden = false;
      } else chip.hidden = true;
    }
  }

  function view(key, cls, html, after) {
    if (key === S.viewKey) { S.live && S.live(); hud(); return false; }
    S.viewKey = key; S.live = null;
    if (S.play) { S.play.stop(); S.play = null; }
    app.innerHTML = `<section class="scr ${cls}">${html}</section>`;
    after && after(app.firstElementChild);
    S.live && S.live();
    hud();
    return true;
  }

  /* ---------- JOIN (facilitator, once per device) ---------- */
  function viewJoin(msg) {
    let pin = '';
    view('join:' + (msg || ''), 'scr-join', `
      <div class="brand">
        <img class="brand-crest" src="crest.png" alt="Beatty crest">
        <h1 class="logo"><span>HIVE</span><span>RUSH</span></h1>
        <p class="tag">The Beatty Challenge</p>
      </div>
      <div class="pin-box">
        <div class="pin-label">Game PIN</div>
        <div class="pin-digits">${'<i></i>'.repeat(4)}</div>
        <div class="pin-msg">${esc(msg || 'Type the PIN shown on the host screen')}</div>
      </div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
        <button data-k="del" class="k-del" aria-label="Delete">⌫</button><button data-k="0">0</button><button data-k="go" class="k-go">GO</button></div>
      <button class="link-btn" id="soloBtn">No internet? Play solo</button>`, root => {
      const digits = root.querySelectorAll('.pin-digits i'), msgEl = root.querySelector('.pin-msg');
      const paint = () => digits.forEach((d, i) => { d.textContent = pin[i] || ''; d.classList.toggle('on', i < pin.length); });
      async function go() {
        if (pin.length !== 4) { root.querySelector('.pin-digits').classList.add('shake'); setTimeout(() => root.querySelector('.pin-digits').classList.remove('shake'), 500); return; }
        msgEl.textContent = 'Finding the hive…'; FX.fullscreen(); FX.keepAwake();
        try {
          await Net.ready(); const g = await Net.getGame(pin);
          if (!g) { msgEl.textContent = 'No game with that PIN. Check the host screen.'; FX.sfx.bad(); pin = ''; paint(); return; }
          ls.set('hr_pin', pin); S.pin = pin; FX.sfx.good(); connect();
        } catch (e) { viewOffline(); }
      }
      root.querySelectorAll('.keypad button').forEach(b => b.addEventListener('pointerdown', e => {
        e.preventDefault(); const k = b.dataset.k; FX.sfx.key(); FX.vib(8);
        if (k === 'del') pin = pin.slice(0, -1); else if (k === 'go') return go(); else if (pin.length < 4) pin += k;
        paint(); if (pin.length === 4) setTimeout(go, 150);
      }));
      root.querySelector('#soloBtn').onclick = startSolo;
    });
  }

  function viewOffline() {
    const dot = document.getElementById('netDot'); if (dot) dot.classList.add('off');
    view('offline', 'scr-center', `
      <div class="big-emoji">📡</div><h2 class="h2">Can’t reach the hive</h2>
      <p class="sub">This device is not connected to the internet, or the game server is blocked on this WiFi.</p>
      <div class="stack"><button class="btn btn-go" id="retry">Try again</button><button class="btn btn-ghost" id="solo">Play solo instead</button></div>`, root => {
      root.querySelector('#retry').onclick = () => { S.viewKey = null; S.pin ? connect() : viewJoin(); };
      root.querySelector('#solo').onclick = startSolo;
    });
  }

  /* ---------- SQUAD: name + avatar, the first thing children see ---------- */
  function rollName() {
    const used = new Set(active().map(p => p.name));
    for (let i = 0; i < 30; i++) { const n = FX.pick(C.squadAdjectives) + ' ' + FX.pick(C.squadNouns); if (!used.has(n)) return n; }
    return FX.pick(C.squadAdjectives) + ' ' + FX.pick(C.squadNouns) + ' ' + (2 + Math.floor(Math.random() * 8));
  }
  function viewSquad(note) {
    const g = S.game;
    if (!S.squad || S.squad.session !== g.session) S.squad = { session: g.session, name: rollName(), emoji: FX.pick(C.avatars) };
    const sq = S.squad;
    view('squad:' + g.session + ':' + (note || ''), 'scr-squad', `
      <div class="squad-head"><div class="eyebrow">Welcome to</div><h1 class="logo logo-sm"><span>HIVE</span><span>RUSH</span></h1></div>
      ${note ? `<div class="note">${esc(note)}</div>` : ''}
      <div class="squad-card" id="sqCard">
        <div class="squad-emoji" id="sqEmoji">${sq.emoji}</div>
        <div class="squad-label">Your squad name</div>
        <div class="squad-name" id="sqName">${esc(sq.name)}</div>
        <button class="dice" id="sqRoll" aria-label="New name"><span>🎲</span> New name</button>
      </div>
      <div class="avatars">${C.avatars.map(a => `<button class="av ${a === sq.emoji ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <button class="btn btn-go btn-xl" id="ready">WE’RE READY! <span class="arrow">→</span></button>
      <div class="micro">Playing as 1, 2 or 3 friends? One squad per device.</div>`, root => {
      const nameEl = root.querySelector('#sqName'), emo = root.querySelector('#sqEmoji');
      root.querySelector('#sqRoll').addEventListener('pointerdown', e => {
        e.preventDefault(); let n = 0; FX.vib(10);
        const spin = setInterval(() => {
          nameEl.textContent = FX.pick(C.squadAdjectives) + ' ' + FX.pick(C.squadNouns); FX.sfx.key();
          if (++n > 7) { clearInterval(spin); sq.name = rollName(); nameEl.textContent = sq.name; nameEl.classList.remove('land'); void nameEl.offsetWidth; nameEl.classList.add('land'); FX.sfx.pop(); }
        }, 55);
      });
      root.querySelectorAll('.av').forEach(b => b.addEventListener('pointerdown', e => {
        e.preventDefault(); sq.emoji = b.dataset.a; emo.textContent = sq.emoji; emo.classList.remove('land'); void emo.offsetWidth; emo.classList.add('land');
        root.querySelectorAll('.av').forEach(x => x.classList.toggle('on', x === b)); FX.sfx.pop(); FX.vib(10);
      }));
      root.querySelector('#ready').addEventListener('click', () => {
        FX.sfx.go(); FX.vib([20, 40, 60]); FX.keepAwake();
        register(sq);
      });
    });
  }

  function register(sq) {
    const data = { session: S.game.session, name: sq.name, emoji: sq.emoji, score: 0, streak: 0, answers: {}, joinedAt: Date.now() };
    if (S.solo) { S.me = Object.assign({ id: 'me' }, data); S.players = [S.me]; route(); return; }
    Net.setMe(S.pin, data, false).catch(() => {});
  }

  /* ---------- LOBBY ---------- */
  function viewLobby() {
    const me = S.me, g = S.game;
    view('lobby:' + g.session, 'scr-lobby', `
      <div class="eyebrow">You’re in!</div>
      <button class="me-card" id="meCard"><span class="me-emoji">${me.emoji}</span><span class="me-name">${esc(me.name)}</span></button>
      <div class="lobby-wait"><span class="dots"><i></i><i></i><i></i></span> Waiting for the host to start</div>
      <div class="lobby-squads"><div class="lobby-count"></div><div class="chips"></div></div>
      ${g.record && g.record.score ? `<div class="record">🏆 Today’s booth record: <b>${FX.fmt(g.record.score)}</b> by ${esc(g.record.emoji || '')} ${esc(g.record.name)}. Can you beat it?</div>` : ''}
      <button class="link-btn" id="rename">Change our name</button>`, root => {
      const card = root.querySelector('#meCard');
      card.addEventListener('pointerdown', () => { card.classList.remove('boing'); void card.offsetWidth; card.classList.add('boing'); FX.sfx.buzz(); FX.vib(15); });
      root.querySelector('#rename').onclick = () => { S.squad = null; if (S.solo) { S.me = null; route(); } else Net.setMe(S.pin, { session: 0 }, true); };
      S.live = () => {
        const list = active();
        root.querySelector('.lobby-count').textContent = list.length === 1 ? '1 squad in the hive' : list.length + ' squads in the hive';
        root.querySelector('.chips').innerHTML = list.map(p => `<span class="chip ${p.id === S.uid ? 'mine' : ''}">${esc(p.emoji)} ${esc(p.name)}</span>`).join('');
      };
    });
  }

  /* ---------- COUNTDOWN + INTRO ---------- */
  function viewCountdown() {
    view('cd:' + S.game.session, 'scr-center scr-count', `<div class="count-num" id="cn">3</div><div class="count-sub">Get ready…</div>`, root => {
      const el = root.querySelector('#cn'); let n = 3; FX.sfx.count();
      const t = setInterval(() => {
        n--; if (S.viewKey !== 'cd:' + S.game.session) return clearInterval(t);
        if (n > 0) { el.textContent = n; FX.sfx.count(); } else { el.textContent = 'GO!'; el.classList.add('go'); FX.sfx.go(); FX.vib(60); clearInterval(t); }
        el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
      }, 900);
    });
  }
  function viewIntro(r) {
    const rd = ROUNDS[r];
    view('intro:' + S.game.session + ':' + r, 'scr-center scr-intro' + (rd.golden ? ' is-golden' : ''), `
      <div class="intro-round">Round ${r + 1} of ${ROUNDS.length}</div>
      <h2 class="intro-title">${esc(rd.title)}</h2>
      ${rd.golden ? '<div class="x2">×2 DOUBLE HONEY</div>' : ''}
      <p class="intro-rule">${esc(rd.rule)}</p>`, () => { rd.golden ? FX.sfx.fanfare() : FX.sfx.slam(); FX.vib(40); });
  }

  /* ---------- QUESTION + LOCKED ---------- */
  function submit(r, res, timeout) {
    const prev = (S.me && S.me.answers) || {};
    if (prev[r]) return;
    const lastOk = r > 0 && prev[r - 1] && prev[r - 1].ok;
    const streak = res.ok ? (lastOk ? (S.me.streak || 0) + 1 : 1) : 0;
    const bonus = res.ok ? HR.Score.streakBonus(streak) : 0;
    const rec = { pts: res.pts, ok: !!res.ok, v: res.v == null ? null : res.v, ms: Math.round(res.ms || 0), bonus };
    if (res.detail != null) rec.detail = res.detail;
    if (timeout) rec.timeout = true;
    const answers = Object.assign({}, prev, { [r]: rec });
    const score = Object.values(answers).reduce((s, a) => s + (a.pts || 0) + (a.bonus || 0), 0);
    if (S.solo) { S.me = Object.assign({}, S.me, { answers, score, streak }); S.players = [S.me]; S.engine.setPlayers(S.players); route(); return; }
    S.me = Object.assign({}, S.me, { answers, score, streak }); // optimistic
    Net.setMe(S.pin, { answers: { [r]: rec }, score, streak }, true).catch(() => {});
    route();
  }

  function viewQuestion(r) {
    const key = 'q:' + S.game.session + ':' + r;
    if (myAnswer(r)) return viewLocked(r);
    view(key, 'scr-q' + (ROUNDS[r].golden ? ' is-golden' : ''), '<div id="qmount" class="qmount"></div>', root => {
      FX.vib(20);
      S.play = HR.Rounds.play(root.querySelector('#qmount'), ROUNDS[r], res => submit(r, res, !!res.timeout));
    });
  }

  function viewLocked(r) {
    const a = myAnswer(r), rd = ROUNDS[r];
    let line = 'Answer locked in!';
    if (rd.type === 'mythfact') line = `${a.v} of ${rd.cards.length} cards done!`;
    if (rd.type === 'order' && a.ok) line = 'DREAM spelled!';
    if (rd.type === 'hunt') line = `${a.v} of ${rd.targets.length} found!`;
    if (rd.type === 'slider') line = `You guessed ${a.v}`;
    if (a.timeout) line = 'Time’s up!';
    view('locked:' + S.game.session + ':' + r, 'scr-center scr-locked', `
      <div class="lock-ico">🔒</div>
      <h2 class="h2">${esc(line)}</h2>
      <button class="bee-fidget" id="bee" aria-label="Tap the bee">🐝</button>
      <div class="sub" id="waitTxt"></div>`, root => {
      const bee = root.querySelector('#bee');
      bee.addEventListener('pointerdown', e => { e.preventDefault(); bee.classList.remove('spin'); void bee.offsetWidth; bee.classList.add('spin'); FX.sfx.buzz(); FX.vib(10); });
      S.live = () => {
        if (S.solo) { root.querySelector('#waitTxt').textContent = 'Revealing…'; return; }
        const left = active().filter(p => !(p.answers && p.answers[r])).length;
        root.querySelector('#waitTxt').textContent = left > 0 ? `Waiting for ${left} more squad${left === 1 ? '' : 's'}… tap the bee!` : 'Everyone’s in! Revealing…';
      };
    });
  }

  /* ---------- REVEAL ---------- */
  function correctLine(rd, a) {
    switch (rd.type) {
      case 'mcq': return `Answer: ${rd.options[rd.answer].e} ${rd.options[rd.answer].t}`;
      case 'slider': return `It’s ${rd.answer}! You said ${a && a.v != null ? a.v : '…'}`;
      case 'mythfact': return `${a ? a.v : 0} of ${rd.cards.length} cards right`;
      case 'order': return a && a.ok ? `Spelled in ${(a.ms / 1000).toFixed(1)}s${a.detail && a.detail.mistakes ? ` with ${a.detail.mistakes} slip${a.detail.mistakes > 1 ? 's' : ''}` : ', no slips!'}` : 'D R E A M: Discipline, Resilience, Empathy, Adaptability, Mindfulness';
      case 'hunt': return `${a ? a.v : 0} of ${rd.targets.length} exchanges found`;
    }
    return '';
  }
  function viewReveal(r) {
    const rd = ROUNDS[r];
    if (!myAnswer(r) && !S.timeoutSent[S.game.session + ':' + r]) {
      S.timeoutSent[S.game.session + ':' + r] = true;
      if (S.play) S.play.forceEnd(); // slider/hunt etc. submit their partial answer
      if (!myAnswer(r)) submit(r, { pts: 0, ok: false, v: null, ms: rd.limit * 1000 }, true);
    }
    const a = myAnswer(r) || { pts: 0, ok: false };
    const total = (a.pts || 0) + (a.bonus || 0);
    const mood = a.ok ? 'good' : total > 0 ? 'mid' : 'bad';
    const cheer = a.ok ? FX.pick(C.cheersRight) : total > 0 ? 'Nice one!' : a.timeout ? 'Time’s up!' : FX.pick(C.cheersWrong);
    view('rev:' + S.game.session + ':' + r, 'scr-center scr-reveal mood-' + mood, `
      <div class="rev-cheer">${esc(cheer)}</div>
      ${total > 0 ? '<div class="rev-pts">+<span id="pts">0</span></div><div class="rev-unit">honey</div>'
        : '<div class="rev-zero">💪</div><div class="rev-zero-t">Shake it off. The next one’s yours!</div>'}
      ${a.bonus ? `<div class="streak">🔥 ${S.me.streak} in a row! +${a.bonus}</div>` : ''}
      <div class="rev-answer">${esc(correctLine(rd, a))}</div>
      <div class="fact"><div class="fact-k">🐝 Did you know?</div><div class="fact-t">${esc(rd.fact)}</div></div>`, root => {
      if (total > 0) setTimeout(() => FX.countUp(root.querySelector('#pts'), 0, total, 900, true), 250);
      if (a.ok) { FX.sfx.good(); FX.vib([30, 50, 30]); setTimeout(() => FX.confetti(rd.golden ? 160 : 90), 200); }
      else if (total > 0) FX.sfx.good(); else { FX.sfx.bad(); FX.vib(40); }
    });
  }

  /* ---------- BOARD ---------- */
  function viewBoard(r) {
    const list = ranked(); const i = list.findIndex(p => p.id === S.uid); const rank = i + 1;
    const prev = S.ranks[S.game.session]; S.ranks[S.game.session] = rank;
    const me = list[i] || S.me;
    let gap = '';
    if (list.length === 1) gap = 'Every point counts. Keep going!';
    else if (rank === 1) gap = list[1] ? `You lead by ${FX.fmt((me.score || 0) - (list[1].score || 0))}! Hold on!` : 'You’re in the lead!';
    else { const above = list[i - 1]; gap = `Only ${FX.fmt((above.score || 0) - (me.score || 0))} behind ${above.emoji} ${above.name}!`; }
    const move = prev && rank < prev ? `<div class="move up">▲ Up ${prev - rank} place${prev - rank > 1 ? 's' : ''}!</div>` : prev && rank > prev ? '<div class="move">Fight back next round!</div>' : '';
    view('board:' + S.game.session + ':' + r, 'scr-center scr-board', `
      <div class="eyebrow">After round ${r + 1}</div>
      <div class="rank"><span class="rank-hash">#</span>${rank || '–'}</div>
      <div class="rank-of">of ${list.length} squad${list.length === 1 ? '' : 's'}</div>
      ${move}
      <div class="gap">${esc(gap)}</div>
      <ol class="mini-board">${list.slice(0, 6).map((p, k) => `<li class="${p.id === S.uid ? 'mine' : ''}"><b>${k + 1}</b><span>${esc(p.emoji)} ${esc(p.name)}</span><i>${FX.fmt(p.score)}</i></li>`).join('')}</ol>`, () => {
      prev && rank < prev ? (FX.sfx.good(), FX.vib([20, 30, 20])) : FX.sfx.whoosh();
    });
  }

  /* ---------- PODIUM + FINALE ---------- */
  function viewPodium() {
    const list = ranked(); const rank = list.findIndex(p => p.id === S.uid) + 1; const me = S.me;
    const g = S.game, rec = g.record;
    const newRecord = !S.solo && rank === 1 && (!rec || !rec.score || (me.score || 0) >= rec.score) && (me.score || 0) > 0;
    view('pod:' + g.session, 'scr-center scr-podium', `
      <div class="pod-wait" id="pw"><div class="eyebrow">The results are in…</div><div class="drum">🥁</div></div>
      <div class="pod-res" id="pr" hidden>
        <div class="pod-medal">${rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🐝'}</div>
        <div class="pod-title">${rank === 1 ? (list.length > 1 ? 'CHAMPIONS!' : 'HIVE MASTER!') : rank === 2 ? '2nd PLACE!' : rank === 3 ? '3rd PLACE!' : 'HIVE HEROES!'}</div>
        <div class="pod-score"><span id="fs">0</span> honey</div>
        ${newRecord ? '<div class="stamp">NEW BOOTH RECORD!</div>' : ''}
        <div class="sub">${esc(me.emoji)} ${esc(me.name)} · ${FX.ordinal(rank)} of ${list.length}</div>
      </div>`, root => {
      FX.sfx.drumroll(2.6);
      setTimeout(() => {
        if (S.viewKey !== 'pod:' + g.session) return;
        root.querySelector('#pw').hidden = true; root.querySelector('#pr').hidden = false;
        FX.countUp(root.querySelector('#fs'), 0, me.score || 0, 1200, true);
        if (rank === 1) { FX.sfx.fanfare(); FX.confetti(220); setTimeout(() => FX.confetti(160, { rain: true }), 600); FX.vib([60, 60, 120]); }
        else { FX.sfx.good(); FX.confetti(rank <= 3 ? 120 : 70); FX.vib(50); }
      }, 2700);
    });
  }

  function viewFinale() {
    const oh = C.openHouse, me = S.me, list = ranked(), rank = list.findIndex(p => p.id === S.uid) + 1;
    view('fin:' + S.game.session, 'scr-finale', `
      <div class="fin-top"><img src="crest.png" class="fin-crest" alt=""><div class="eyebrow">The real hive is waiting</div></div>
      <h2 class="fin-title">Come to our<br><span>OPEN HOUSE</span></h2>
      <div class="fin-when">
        <div class="fin-day">${esc(oh.day)}</div>
        <div class="fin-date">${esc(oh.date)}</div>
        <div class="fin-time">${esc(oh.time)}</div>
        <div class="fin-place">${esc(oh.place)}</div>
      </div>
      <div class="fin-parents">👨‍👩‍👧 Bring your parents! Meet real Beattyians and see the hive for yourself.</div>
      <div class="prize">🎁 <b>Show this screen</b> to collect your prize!</div>
      <div class="fin-me">${esc(me.emoji)} ${esc(me.name)} · ${FX.fmt(me.score)} honey · ${FX.ordinal(rank)} place</div>
      ${S.solo ? '<div class="solo-board" id="sb"></div><button class="btn btn-go" id="again">Play again</button>' : ''}`, root => {
      FX.sfx.whoosh();
      if (S.solo) {
        root.querySelector('#sb').innerHTML = '<div class="eyebrow">Top squads on this device today</div><ol class="mini-board">' +
          soloBoard().map(p => `<li class="${p.mine ? 'mine' : ''}"><b></b><span>${esc(p.emoji)} ${esc(p.name)}</span><i>${FX.fmt(p.score)}</i></li>`).join('') + '</ol>';
        root.querySelector('#again').onclick = () => { const b = soloBoard()[0]; S.game.record = b ? { score: b.score, name: b.name, emoji: b.emoji } : null; S.game.session++; S.squad = null; S.me = null; S.engine.newGroup(S.game.session); };
      }
    });
  }

  /* ---------- router ---------- */
  function route() {
    const g = S.game;
    if (!g) return;
    const kicked = (g.kicked || []).includes(S.uid);
    const reg = S.me && S.me.session === g.session && !kicked;
    if (!reg) {
      const note = kicked ? 'The host reset this squad. Pick a name to rejoin!' : g.phase !== 'lobby' ? 'A game is running. Join now and jump in!' : '';
      return viewSquad(note);
    }
    const r = g.round;
    switch (g.phase) {
      case 'lobby': return S.solo ? soloLobbyView() : viewLobby();
      case 'countdown': return viewCountdown();
      case 'intro': return viewIntro(r);
      case 'question': return viewQuestion(r);
      case 'reveal': return viewReveal(r);
      case 'board': return viewBoard(r);
      case 'podium': return viewPodium();
      case 'finale': return viewFinale();
    }
  }

  /* ---------- multiplayer wiring ---------- */
  async function connect() {
    S.unsubs.forEach(u => { try { u(); } catch (e) {} }); S.unsubs = [];
    view('loading', 'scr-center', '<div class="loader"><i></i><i></i><i></i></div><div class="sub">Joining the hive…</div>');
    try { S.uid = await Net.ready(); } catch (e) { return viewOffline(); }
    let first = true;
    S.unsubs.push(Net.watchGame(S.pin, g => {
      if (!g) { if (first) { ls.set('hr_pin', null); S.pin = null; S.viewKey = null; viewJoin('That game has ended. Enter the new PIN.'); } return; }
      first = false; S.game = g; route();
    }));
    S.unsubs.push(Net.watchMe(S.pin, me => { S.me = me ? Object.assign({ id: S.uid }, me) : null; if (S.game) route(); }));
    S.unsubs.push(Net.watchPlayers(S.pin, list => { S.players = list; if (S.game) route(); }));
  }

  /* ---------- solo mode: same game, no network, scored against this device's day ---------- */
  function soloKey() { const d = new Date(); return 'hr_solo_' + d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + d.getDate(); }
  function soloBoard() {
    let list = []; try { list = JSON.parse(ls.get(soloKey()) || '[]'); } catch (e) {}
    return list.slice(0, 5);
  }
  function saveSolo() {
    let list = []; try { list = JSON.parse(ls.get(soloKey()) || '[]'); } catch (e) {}
    list.forEach(p => { p.mine = false; });
    list.push({ name: S.me.name, emoji: S.me.emoji, score: S.me.score || 0, mine: true });
    list.sort((a, b) => b.score - a.score); ls.set(soloKey(), JSON.stringify(list.slice(0, 20)));
  }
  function startSolo() {
    S.solo = true; S.uid = 'me'; S.unsubs.forEach(u => { try { u(); } catch (e) {} });
    const best = soloBoard()[0];
    S.game = { session: 1, phase: 'lobby', round: -1, kicked: [], record: best ? { score: best.score, name: best.name, emoji: best.emoji } : null };
    S.engine = HR.Engine({
      rounds: ROUNDS, skipBoard: true,
      write(patch) {
        const wasPhase = S.game.phase;
        Object.assign(S.game, patch);
        if (S.game.phase === 'finale' && wasPhase !== 'finale') saveSolo();
        route();
      },
    });
    S.viewKey = null; route();
  }
  // solo lobby has a START button instead of a host
  function soloLobbyView() {
      view('slobby:' + S.game.session, 'scr-center scr-lobby', `
        <div class="eyebrow">Solo challenge</div>
        <div class="me-card"><span class="me-emoji">${S.me.emoji}</span><span class="me-name">${esc(S.me.name)}</span></div>
        ${S.game.record ? `<div class="record">🏆 Beat today’s best: <b>${FX.fmt(S.game.record.score)}</b> by ${esc(S.game.record.emoji)} ${esc(S.game.record.name)}</div>` : '<div class="record">Set the first score of the day!</div>'}
        <button class="btn btn-go btn-xl" id="sgo">START!</button>`, root => { root.querySelector('#sgo').onclick = () => { FX.sfx.go(); S.engine.setPlayers([S.me]); S.engine.start(); }; });
  }

  /* ---------- HUD: mute, connection, hidden exit (hold the crest 2s) ---------- */
  function initHud() {
    const mute = document.getElementById('muteBtn');
    const paint = () => { mute.textContent = FX.isMuted() ? '🔇' : '🔊'; };
    paint(); mute.onclick = () => { FX.setMuted(!FX.isMuted()); paint(); };
    const dot = document.getElementById('netDot');
    const setDot = on => { dot.classList.toggle('off', !on); dot.title = on ? 'Connected' : 'Reconnecting…'; };
    Net.onStatus(setDot); setDot(navigator.onLine);
    const exit = document.getElementById('exitHold'); let t = null;
    exit.addEventListener('pointerdown', () => { t = setTimeout(() => {
      if (confirm('Facilitator: leave this game on this device?')) { ls.set('hr_pin', null); location.href = location.pathname; }
    }, 2000); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => exit.addEventListener(ev, () => clearTimeout(t)));
  }

  initHud();
  if (S.solo) startSolo(); else if (S.pin) connect(); else viewJoin();
  HR.__player = S; // for tests and debugging
})();
