/* HIVE RUSH host screen: the facilitator's laptop, TV or tablet. Creates the PIN, shows squads
   arriving, runs the rounds on autopilot, and stages the reveals, leaderboard, podium and the
   Open House finale. The engine here is the single source of truth for game phase. */
(function () {
  const C = HR.CONTENT, FX = HR.FX, esc = FX.esc, Net = HR.Net, ROUNDS = C.rounds;
  const app = document.getElementById('app');
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  const H = { pin: null, game: null, players: [], engine: null, st: null, viewKey: null, live: null, prevOrder: [], prevScores: {}, unsubs: [], answeredSeen: new Set() };
  const todayKey = () => { const d = new Date(); return 'hr_record_' + d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + d.getDate(); };
  const getRecord = () => { try { return JSON.parse(ls.get(todayKey()) || 'null'); } catch (e) { return null; } };

  const active = () => {
    const g = H.game; if (!g) return [];
    const k = g.kicked || [];
    return H.players.filter(p => p.session === g.session && !k.includes(p.id));
  };
  const ranked = () => active().slice().sort((a, b) => (b.score || 0) - (a.score || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));

  function view(key, cls, html, after) {
    if (key === H.viewKey) { H.live && H.live(); return false; }
    H.viewKey = key; H.live = null;
    app.innerHTML = `<section class="scr host-scr ${cls}">${html}</section>`;
    after && after(app.firstElementChild);
    H.live && H.live();
    return true;
  }

  /* ---------- setup ---------- */
  function viewSetup(msg) {
    const prev = ls.get('hr_host_pin');
    view('setup:' + (msg || ''), 'h-setup', `
      <div class="brand brand-row">
        <img class="brand-crest" src="crest.png" alt="Beatty crest">
        <div><h1 class="logo"><span>HIVE</span><span>RUSH</span></h1><p class="tag">Host screen · The Beatty Challenge</p></div>
      </div>
      ${msg ? `<div class="note">${esc(msg)}</div>` : ''}
      <div class="setup-actions">
        <button class="btn btn-go btn-xl" id="create">Create a game</button>
        ${prev ? `<button class="btn btn-ghost" id="resume">Resume game ${esc(prev)}</button>` : ''}
      </div>
      <ol class="howto">
        <li><b>Create a game.</b> You get a 4 digit PIN.</li>
        <li><b>On each player device,</b> open Hive Rush and type the PIN. You only do this once per device.</li>
        <li><b>Children name their squad</b> (1 to 3 per device) and tap READY.</li>
        <li><b>Press START.</b> It runs itself: 6 rounds, about 3 minutes. Press <b>New group</b> for the next group.</li>
      </ol>`, root => {
      root.querySelector('#create').onclick = create;
      const r = root.querySelector('#resume'); if (r) r.onclick = () => resume(prev);
    });
  }

  async function create() {
    view('loading', 'h-center', '<div class="loader"><i></i><i></i><i></i></div><div class="sub">Building the hive…</div>');
    try {
      await Net.ready();
      const g = await Net.createGame({ record: getRecord() });
      ls.set('hr_host_pin', g.pin); attach(g.pin, g);
    } catch (e) { viewSetup('Could not reach the game server. Check the WiFi or hotspot, then try again.'); }
  }
  async function resume(pin) {
    view('loading', 'h-center', '<div class="loader"><i></i><i></i><i></i></div><div class="sub">Reconnecting…</div>');
    try {
      const uid = await Net.ready(); const g = await Net.getGame(pin);
      if (!g || g.hostUid !== uid) { ls.set('hr_host_pin', null); return viewSetup('That game can’t be resumed here. Create a new one.'); }
      attach(pin, g, true);
    } catch (e) { viewSetup('Could not reach the game server. Check the WiFi or hotspot, then try again.'); }
  }

  function attach(pin, g, resuming) {
    H.pin = pin; H.game = g;
    H.engine = HR.Engine({
      rounds: ROUNDS,
      write: patch => { Object.assign(H.game, patch); Net.setGame(pin, patch).catch(err => console.warn(err)); },
      onChange: st => { H.st = st; render(); },
    });
    H.unsubs.forEach(u => u()); H.unsubs = [];
    H.unsubs.push(Net.watchPlayers(pin, list => {
      H.players = list; H.engine.setPlayers(active()); if (H.st) render();
    }));
    document.body.classList.add('in-game');
    if (resuming) H.engine.resumeFrom(g); else { H.st = H.engine.state(); render(); }
    paintBar();
  }

  /* ---------- control bar ---------- */
  function paintBar() {
    const bar = document.getElementById('hostBar'); if (!H.st) { bar.hidden = true; return; }
    bar.hidden = false;
    const ph = H.st.phase;
    bar.innerHTML = `
      <span class="bar-pin">PIN <b>${esc(H.pin)}</b></span>
      ${ph !== 'lobby' && ph !== 'finale' ? `<button data-a="pause">${H.st.paused ? '▶ Resume' : '⏸ Pause'}</button><button data-a="skip">⏭ Next</button>` : ''}
      ${ph !== 'lobby' ? '<button data-a="group">👥 New group</button>' : ''}
      <button data-a="mute">${FX.isMuted() ? '🔇' : '🔊'}</button>
      <button data-a="fs">⛶</button>`;
    bar.querySelectorAll('button').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'pause') H.st.paused ? H.engine.resume() : H.engine.pause();
      if (a === 'skip') H.engine.skip();
      if (a === 'group') newGroup(ph !== 'finale');
      if (a === 'mute') { FX.setMuted(!FX.isMuted()); }
      if (a === 'fs') FX.fullscreen();
      paintBar();
    });
  }
  function newGroup(confirmIt) {
    if (confirmIt && !confirm('Start fresh for a new group? The current game will end.')) return;
    const session = (H.game.session || 1) + 1;
    H.prevOrder = []; H.prevScores = {}; H.answeredSeen.clear();
    Net.setGame(H.pin, { kicked: [], record: getRecord() }).catch(() => {});
    H.game.kicked = []; H.game.record = getRecord();
    H.engine.newGroup(session);
  }

  /* ---------- render by phase ---------- */
  function render() {
    const st = H.st; if (!st) return;
    paintBar();
    const r = st.round, sess = H.game.session;
    FX.music(st.phase === 'lobby' || st.phase === 'board' || st.phase === 'finale' ? 'lobby' : st.phase === 'question' ? 'think' : null);
    switch (st.phase) {
      case 'lobby': return viewLobby(sess);
      case 'countdown': return viewCountdown(sess);
      case 'intro': return viewIntro(sess, r);
      case 'question': return viewQuestion(sess, r);
      case 'reveal': return viewReveal(sess, r);
      case 'board': return viewBoard(sess, r);
      case 'podium': return viewPodium(sess);
      case 'finale': return viewFinale(sess);
    }
  }

  function viewLobby(sess) {
    const rec = H.game.record;
    view('lobby:' + sess, 'h-lobby', `
      <div class="lobby-left">
        <img class="brand-crest sm" src="crest.png" alt="">
        <h1 class="logo"><span>HIVE</span><span>RUSH</span></h1>
        <div class="pin-card"><div class="pin-label">Game PIN</div><div class="pin-big">${esc(H.pin)}</div></div>
        ${rec && rec.score ? `<div class="record">🏆 Booth record today: <b>${FX.fmt(rec.score)}</b> by ${esc(rec.emoji || '')} ${esc(rec.name)}</div>` : '<div class="record">First group of the day? Set the record!</div>'}
      </div>
      <div class="lobby-right">
        <div class="lobby-count"><b id="lc">0</b> squads in the hive</div>
        <div class="squad-grid" id="sg"></div>
        <button class="btn btn-go btn-xl" id="start" disabled>START!</button>
        <div class="micro">Tap a squad to remove it.</div>
      </div>`, root => {
      const seen = new Set();
      root.querySelector('#start').onclick = () => { FX.sfx.go(); H.engine.start(); };
      H.live = () => {
        const list = active();
        root.querySelector('#lc').textContent = list.length;
        root.querySelector('#start').disabled = !list.length;
        const grid = root.querySelector('#sg');
        grid.innerHTML = list.map(p => `<button class="sq-tile ${seen.has(p.id) ? '' : 'new'}" data-id="${esc(p.id)}"><span>${esc(p.emoji)}</span>${esc(p.name)}</button>`).join('') ||
          '<div class="empty">Waiting for squads… type the PIN on each device.</div>';
        list.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); FX.sfx.pop(); } });
        grid.querySelectorAll('.sq-tile').forEach(t => t.onclick = () => {
          const p = list.find(x => x.id === t.dataset.id);
          if (p && confirm(`Remove ${p.name}?`)) { const k = (H.game.kicked || []).concat(p.id); H.game.kicked = k; Net.setGame(H.pin, { kicked: k }); render(); }
        });
      };
    });
  }

  function viewCountdown(sess) {
    view('cd:' + sess, 'h-center h-count', '<div class="count-num" id="cn">3</div><div class="count-sub">Eyes on your device!</div>', root => {
      const el = root.querySelector('#cn'); let n = 3; FX.sfx.count();
      const t = setInterval(() => {
        n--; if (H.viewKey !== 'cd:' + sess) return clearInterval(t);
        if (n > 0) { el.textContent = n; FX.sfx.count(); } else { el.textContent = 'GO!'; el.classList.add('go'); FX.sfx.go(); clearInterval(t); }
        el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
      }, 900);
    });
  }

  function viewIntro(sess, r) {
    const rd = ROUNDS[r];
    view('intro:' + sess + ':' + r, 'h-center scr-intro' + (rd.golden ? ' is-golden' : ''), `
      <div class="intro-round">Round ${r + 1} of ${ROUNDS.length}</div>
      <h2 class="intro-title">${esc(rd.title)}</h2>
      ${rd.golden ? '<div class="x2">×2 DOUBLE HONEY</div>' : ''}
      <p class="intro-rule">${esc(rd.rule)}</p>`, () => { rd.golden ? FX.sfx.fanfare() : FX.sfx.slam(); });
  }

  function questionVisual(rd) {
    switch (rd.type) {
      case 'mcq': return `<div class="mcq host-mcq">${rd.options.map((o, i) => `<div class="tile ${HR.TILES[i].cls}"><span class="tile-shape">${HR.SHAPES[HR.TILES[i].shape]}</span><span class="tile-emoji">${o.e}</span><span class="tile-text">${esc(o.t)}</span></div>`).join('')}</div>`;
      case 'mythfact': return `<div class="host-cards">${rd.cards.map((c, i) => `<div class="hc"><b>${i + 1}</b>${esc(c.t)}</div>`).join('')}</div>`;
      case 'slider': return `<div class="host-line"><div class="hl-q">?</div><div class="hl-track"><span>${rd.min}</span><span>${rd.max}</span></div></div>`;
      case 'order': return `<div class="host-order">${FX.shuffle(rd.items).map(t => `<span><b>${esc(t[0])}</b>${esc(t.slice(1))}</span>`).join('')}</div>`;
      case 'hunt': return `<div class="host-hunt">${FX.shuffle([...rd.targets, ...rd.decoys]).map((t, i) => `<span style="--d:${i * 0.4}s">${esc(t)}</span>`).join('')}</div>`;
    }
    return '';
  }

  function viewQuestion(sess, r) {
    const rd = ROUNDS[r];
    view('q:' + sess + ':' + r, 'h-q' + (rd.golden ? ' is-golden' : ''), `
      <div class="hq-top"><div class="hq-round">${esc(rd.title)} · ${r + 1}/${ROUNDS.length}</div><div class="hq-clock"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="ring-bg"/><circle cx="50" cy="50" r="44" class="ring" id="ring"/></svg><b id="clock">${rd.limit}</b></div></div>
      <h2 class="hq-prompt">${esc(rd.prompt)}</h2>
      ${questionVisual(rd)}
      <div class="answered"><div class="answered-k"><b id="ac">0</b> / <span id="at">0</span> locked in</div><div class="answered-row" id="ar"></div></div>`, root => {
      const ring = root.querySelector('#ring'), clock = root.querySelector('#clock'); const L = rd.limit * 1000, t0 = Date.now(); let last = -1;
      const CIRC = 2 * Math.PI * 44; ring.style.strokeDasharray = CIRC;
      const tick = () => {
        if (H.viewKey !== 'q:' + sess + ':' + r) return;
        const left = Math.max(0, L - (Date.now() - t0)); const s = Math.ceil(left / 1000);
        ring.style.strokeDashoffset = CIRC * (1 - left / L);
        if (s !== last) { last = s; clock.textContent = s; if (s <= 5 && s > 0) { FX.sfx.tick(s <= 3); root.querySelector('.hq-clock').classList.add('urgent'); } }
        if (left > 0) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      H.live = () => {
        const list = active(); const done = list.filter(p => p.answers && p.answers[r]);
        root.querySelector('#ac').textContent = done.length; root.querySelector('#at').textContent = list.length;
        root.querySelector('#ar').innerHTML = list.map(p => `<span class="av-dot ${p.answers && p.answers[r] ? 'on' : ''}" title="${esc(p.name)}">${esc(p.emoji)}</span>`).join('');
        done.forEach(p => { const k = sess + ':' + r + ':' + p.id; if (!H.answeredSeen.has(k)) { H.answeredSeen.add(k); FX.sfx.lock(); } });
      };
    });
  }

  function revealVisual(rd, r) {
    const list = active(); const ans = p => p.answers && p.answers[r];
    switch (rd.type) {
      case 'mcq': {
        const counts = rd.options.map((_, i) => list.filter(p => ans(p) && ans(p).v === i));
        const max = Math.max(1, ...counts.map(c => c.length));
        return `<div class="mcq host-mcq reveal">${rd.options.map((o, i) => `<div class="tile ${HR.TILES[i].cls} ${i === rd.answer ? 'correct' : 'dim'}">
          <span class="tile-shape">${HR.SHAPES[HR.TILES[i].shape]}</span><span class="tile-emoji">${o.e}</span><span class="tile-text">${esc(o.t)}</span>
          <span class="tile-count"><i style="--w:${counts[i].length / max}"></i><b>${counts[i].length}</b> ${counts[i].map(p => esc(p.emoji)).join('')}</span>
          ${i === rd.answer ? '<span class="tick">✓</span>' : ''}</div>`).join('')}</div>`;
      }
      case 'mythfact':
        return `<div class="host-cards reveal">${rd.cards.map((c, i) => {
          const got = list.filter(p => ans(p) && ans(p).detail && ans(p).detail[i]).length;
          return `<div class="hc ${c.fact ? 'is-fact' : 'is-myth'}"><b>${c.fact ? 'FACT' : 'MYTH'}</b><span>${esc(c.why)}</span><em>${got}/${list.length} ✓</em></div>`;
        }).join('')}</div>`;
      case 'slider': {
        const pins = list.filter(p => ans(p) && ans(p).v != null).sort((a, b) => Math.abs(ans(a).v - rd.answer) - Math.abs(ans(b).v - rd.answer));
        const pos = v => ((v - rd.min) / (rd.max - rd.min)) * 100;
        const best = pins[0];
        return `<div class="host-line reveal">
          <div class="hl-answer">${rd.answer}<small>${esc(rd.unit)}</small></div>
          <div class="hl-track"><span>${rd.min}</span><span>${rd.max}</span>
            <div class="hl-target" style="left:${pos(rd.answer)}%"></div>
            ${pins.map((p, i) => `<div class="hl-pin" style="left:${pos(ans(p).v)}%;--d:${0.3 + i * 0.25}s;--row:${i % 3}"><span>${esc(p.emoji)}</span><b>${ans(p).v}</b></div>`).join('')}
          </div>
          ${best ? `<div class="hl-best">Closest: ${esc(best.emoji)} ${esc(best.name)} with ${ans(best).v}!</div>` : ''}</div>`;
      }
      case 'order':
      case 'hunt': {
        const rows = list.map(p => ({ p, a: ans(p) })).sort((x, y) => ((y.a && y.a.pts) || 0) - ((x.a && x.a.pts) || 0));
        const label = a => !a || a.timeout ? 'Out of time' : rd.type === 'order' ? (a.ok ? `${(a.ms / 1000).toFixed(1)}s` : `${a.detail ? a.detail.filled : 0}/5`) : `${a.v}/${rd.targets.length} found${a.ok ? ` in ${(a.ms / 1000).toFixed(1)}s` : ''}`;
        const head = rd.type === 'order' ? `<div class="dream-word">${rd.items.map(t => `<span><b>${t[0]}</b>${esc(t.slice(1))}</span>`).join('')}</div>`
          : `<div class="dream-word">${rd.targets.map(t => `<span>✈️ ${esc(t)}</span>`).join('')}</div>`;
        return `${head}<ol class="speed-list">${rows.slice(0, 8).map((x, i) => `<li style="--d:${0.2 + i * 0.15}s"><b>${i + 1}</b><span>${esc(x.p.emoji)} ${esc(x.p.name)}</span><i>${label(x.a)}</i></li>`).join('')}</ol>`;
      }
    }
    return '';
  }

  function viewReveal(sess, r) {
    const rd = ROUNDS[r];
    view('rev:' + sess + ':' + r, 'h-reveal' + (rd.golden ? ' is-golden' : ''), `
      <div class="hq-round">${esc(rd.title)} · the answer</div>
      <h2 class="hq-prompt sm">${esc(rd.prompt)}</h2>
      <div id="rv"></div>
      <div class="fact host-fact"><div class="fact-k">🐝 Did you know?</div><div class="fact-t">${esc(rd.fact)}</div></div>`, root => {
      FX.sfx.drumroll(0.8); setTimeout(() => FX.sfx.good(), 900);
      // wait a beat for late (timed out) answers to land, then only redraw when answers change
      let sig = null, ready = false;
      setTimeout(() => { ready = true; H.live && H.live(); }, 700);
      H.live = () => {
        if (!ready) return;
        const now = JSON.stringify(active().map(p => [p.id, p.answers && p.answers[r]]));
        if (now === sig) return; sig = now;
        root.querySelector('#rv').innerHTML = revealVisual(rd, r);
      };
    });
  }

  function viewBoard(sess, r) {
    const list = ranked();
    view('board:' + sess + ':' + r, 'h-board', `
      <div class="hq-round">Leaderboard · after round ${r + 1} of ${ROUNDS.length}</div>
      <ol class="board" id="bd">${list.map((p, i) => {
        const gained = ((p.answers && p.answers[r] && (p.answers[r].pts + (p.answers[r].bonus || 0))) || 0);
        return `<li data-id="${esc(p.id)}" class="${i === 0 ? 'lead' : ''}"><b>${i + 1}</b><span class="b-emo">${esc(p.emoji)}</span><span class="b-name">${esc(p.name)}</span>
          ${gained ? `<span class="b-gain">+${FX.fmt(gained)}</span>` : ''}${p.streak >= 2 ? `<span class="b-streak">🔥${p.streak}</span>` : ''}<i class="b-score" data-from="${H.prevScores[p.id] || 0}" data-to="${p.score || 0}">${FX.fmt(H.prevScores[p.id] || 0)}</i></li>`;
      }).join('')}</ol>`, root => {
      // FLIP: start each row where it was last time, then glide to its new place
      const rows = [...root.querySelectorAll('#bd li')]; const h = rows[0] ? rows[0].offsetHeight + 12 : 0;
      rows.forEach((li, i) => {
        const was = H.prevOrder.indexOf(li.dataset.id);
        if (was >= 0 && was !== i) { li.style.transform = `translateY(${(was - i) * h}px)`; li.style.transition = 'none'; }
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        rows.forEach(li => { li.style.transition = ''; li.style.transform = ''; });
        root.querySelectorAll('.b-score').forEach(el => FX.countUp(el, +el.dataset.from, +el.dataset.to, 1200));
      }));
      FX.sfx.whoosh();
      H.prevOrder = list.map(p => p.id); list.forEach(p => { H.prevScores[p.id] = p.score || 0; });
    });
  }

  function viewPodium(sess) {
    const list = ranked(); const [p1, p2, p3] = list;
    const col = (p, place) => p ? `<div class="pod pod-${place}"><div class="pod-who"><span>${esc(p.emoji)}</span><b>${esc(p.name)}</b><i>${FX.fmt(p.score)}</i></div><div class="pod-block">${place}</div></div>` : `<div class="pod pod-${place} empty"><div class="pod-block">${place}</div></div>`;
    view('pod:' + sess, 'h-podium', `
      <div class="hq-round">And the champions are…</div>
      <div class="podium">${col(p2, 2)}${col(p1, 1)}${col(p3, 3)}</div>
      ${list.length > 3 ? `<div class="also">Also buzzing: ${list.slice(3).map(p => `${esc(p.emoji)} ${esc(p.name)}`).join(' · ')}</div>` : ''}`, root => {
      const show = (place, delay, big) => setTimeout(() => {
        if (H.viewKey !== 'pod:' + sess) return;
        const el = root.querySelector('.pod-' + place); if (!el) return; el.classList.add('up');
        if (big) { FX.sfx.fanfare(); FX.confetti(260); setTimeout(() => FX.confetti(200, { rain: true }), 500); } else FX.sfx.slam();
      }, delay);
      show(3, 700); show(2, 2200); FX.sfx.drumroll(0.1); setTimeout(() => FX.sfx.drumroll(2.6), 2900); show(1, 5600, true);
    });
  }

  function viewFinale(sess) {
    const oh = C.openHouse; const top = ranked()[0];
    // update today's booth record
    const rec = getRecord();
    if (top && (top.score || 0) > ((rec && rec.score) || 0)) {
      const nr = { score: top.score, name: top.name, emoji: top.emoji }; ls.set(todayKey(), JSON.stringify(nr));
    }
    view('fin:' + sess, 'h-finale', `
      <div class="fin-left">
        <div class="eyebrow">The real hive is waiting</div>
        <h2 class="fin-title">Come to our<br><span>OPEN HOUSE</span></h2>
        <div class="fin-when"><div class="fin-day">${esc(oh.day)}</div><div class="fin-date">${esc(oh.date)}</div><div class="fin-time">${esc(oh.time)}</div><div class="fin-place">${esc(oh.place)}</div></div>
        <div class="fin-parents">Bring your parents! Meet real Beattyians and see the hive for yourself.</div>
        <div class="prize">🎁 Show your device screen to collect your prize!</div>
      </div>
      <div class="fin-right">
        <div class="qr" id="qr"></div>
        <div class="qr-k">Parents: scan for Open House details</div>
        <div class="qr-url">${esc(oh.urlLabel)}</div>
        <button class="btn btn-go" id="next">👥 Next group</button>
      </div>`, root => {
      try { const q = qrcode(0, 'M'); q.addData(oh.url); q.make(); root.querySelector('#qr').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) {}
      root.querySelector('#next').onclick = () => newGroup(false);
    });
  }

  viewSetup();
  HR.__host = H;
})();
