const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, '..', 'data');
const JOURNEY_FILE = path.join(DATA_DIR, 'journey_submissions.jsonl');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(JOURNEY_FILE)) {
  fs.writeFileSync(JOURNEY_FILE, '', 'utf8');
}

let journeyStartCount = 0;
try {
  const lines = fs.readFileSync(JOURNEY_FILE, 'utf8').split('\n').filter(Boolean);
  journeyStartCount = lines.length;
} catch (_) {
  journeyStartCount = 0;
}

const PRESETS = {
  cca: {
    q: 'How many students get their 1st or 2nd choice CCA?',
    opts: ['50%', '70%', '90%', '100%'],
    answer: '90%'
  },
  g3jc: {
    q: 'What percentage of majority G3 students qualify for JC?',
    opts: ['60%', '75%', '90%'],
    answer: '90%'
  },
  g3poly: {
    q: 'What percentage of majority G3 students qualify for Poly?',
    opts: ['70%', '85%', '99%'],
    answer: '99%'
  },
  g2pfp: {
    q: 'What percentage of majority G2 students qualify for PFP?',
    opts: ['10%', '25%', '40%'],
    answer: '25%'
  },
  nexus: {
    q: 'What percentage of students participate in NEXUS 301/302 (International Exchange / Industry Attachment)?',
    opts: ['20%', '35%', '50%'],
    answer: '50%'
  }
};

const PERSONAS = {
  explorer: {
    label: 'Explorer',
    description: 'Tries new paths, experiments, and learns by doing'
  },
  creator: {
    label: 'Creator',
    description: 'Builds solutions, designs experiences, and iterates fast'
  },
  guardian: {
    label: 'Guardian',
    description: 'Rallies people, supports teams, and keeps spirits high'
  },
  trailblazer: {
    label: 'Trailblazer',
    description: 'Thinks ahead, analyses patterns, and leads change'
  }
};

// Simple in-memory state
const state = {
  scene: 'join',
  poll: null,
  audienceCounts: { total: 0, students: 0, parents: 0 },
  interests: {},
  personaCounts: { explorer: 0, creator: 0, guardian: 0, trailblazer: 0 },
  timeline: { active: false, label: 'Idle' },
  lastPreset: null,
  journeyCount: journeyStartCount,
  socialFeature: null,
  media: null
};

// SSE clients
const clients = new Set();
let timelineTimers = [];

function sendEvent(event, data) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch (_) {}
  }
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

function contentTypeFor(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain; charset=utf-8';
}

function parseBody(req, cb) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { cb(JSON.parse(body || '{}')); } catch { cb({}); }
  });
}

function cloneCounts(counts) {
  return {
    total: counts.total,
    students: counts.students,
    parents: counts.parents
  };
}

function clonePersonaCounts(personaCounts) {
  return {
    explorer: personaCounts.explorer || 0,
    creator: personaCounts.creator || 0,
    guardian: personaCounts.guardian || 0,
    trailblazer: personaCounts.trailblazer || 0
  };
}

function applyAction(type, payload = {}) {
  let broadcastPayload = payload || {};

  switch (type) {
    case 'scene': {
      if (payload?.scene) state.scene = payload.scene;
      break;
    }
    case 'join': {
      const role = payload?.role || 'guest';
      state.audienceCounts.total += 1;
      if (role === 'student') state.audienceCounts.students += 1;
      if (role === 'parent') state.audienceCounts.parents += 1;
      const tags = Array.isArray(payload?.interests) ? payload.interests : [];
      for (const t of tags) state.interests[t] = (state.interests[t] || 0) + 1;
      broadcastPayload = {
        audienceCounts: cloneCounts(state.audienceCounts),
        interests: { ...state.interests }
      };
      break;
    }
    case 'poll:start': {
      const options = (payload.options || []).map((opt, idx) => ({
        id: opt.id ?? idx + 1,
        label: opt.label,
        count: 0
      }));
      const durationMs = payload.durationMs || 15000;
      state.poll = {
        id: payload.id || Date.now(),
        question: payload.question || '',
        options,
        endsAt: Date.now() + durationMs,
        answerText: payload.answerText || null
      };
      broadcastPayload = {
        id: state.poll.id,
        question: state.poll.question,
        options: state.poll.options,
        endsAt: state.poll.endsAt
      };
      break;
    }
    case 'poll:vote': {
      const optId = payload?.optionId;
      if (state.poll && optId != null) {
        const found = state.poll.options.find(o => o.id === optId);
        if (found) found.count += 1;
      }
      if (state.poll) {
        broadcastPayload = {
          id: state.poll.id,
          question: state.poll.question,
          options: state.poll.options,
          endsAt: state.poll.endsAt
        };
      }
      break;
    }
    case 'poll:stop': {
      state.poll = null;
      broadcastPayload = {};
      break;
    }
    case 'poll:reveal': {
      const answerText = payload?.answerText || state.poll?.answerText || '';
      if (state.poll) {
        broadcastPayload = {
          answerText,
          options: state.poll.options.map(o => ({ id: o.id, label: o.label, count: o.count }))
        };
      } else {
        broadcastPayload = { answerText };
      }
      break;
    }
    case 'media:play': {
      state.media = {
        id: payload?.id || `media-${Date.now()}`,
        title: payload?.title || '',
        url: payload?.url || ''
      };
      broadcastPayload = state.media;
      break;
    }
    case 'media:stop': {
      state.media = null;
      broadcastPayload = {};
      break;
    }
    case 'social:feature': {
      state.socialFeature = payload?.id || null;
      broadcastPayload = { id: state.socialFeature };
      break;
    }
    case 'ops:ping': {
      broadcastPayload = {
        note: payload?.note || 'Tech check',
        ts: Date.now()
      };
      break;
    }
    case 'persona': {
      const id = payload?.id;
      if (id && PERSONAS[id]) {
        state.personaCounts[id] = (state.personaCounts[id] || 0) + 1;
      }
      broadcastPayload = {
        personaCounts: clonePersonaCounts(state.personaCounts),
        id
      };
      break;
    }
    default: {
      break;
    }
  }

  sendEvent(type, broadcastPayload);
  return broadcastPayload;
}

function updateTimeline(active, label) {
  state.timeline = { active, label };
  sendEvent('timeline:status', state.timeline);
}

function clearTimeline(label = 'Paused') {
  for (const timer of timelineTimers) clearTimeout(timer);
  timelineTimers = [];
  updateTimeline(false, label);
}

function startPollPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;
  const options = preset.opts.map((label, idx) => ({ id: idx + 1, label }));
  state.lastPreset = key;
  applyAction('scene', { scene: 'poll' });
  applyAction('poll:start', {
    id: Date.now(),
    question: preset.q,
    options,
    durationMs: 20000,
    answerText: `Correct: ${preset.answer}`
  });
}

function startTimeline() {
  function resetForFlow() {
    state.scene = 'join';
    state.poll = null;
    state.lastPreset = null;
    state.timeline = { active: true, label: 'Preparing flow' };
    state.personaCounts = { explorer: 0, creator: 0, guardian: 0, trailblazer: 0 };
    state.socialFeature = null;
    state.media = null;
    sendEvent('persona', { personaCounts: clonePersonaCounts(state.personaCounts) });
    sendEvent('poll:stop', {});
    sendEvent('media:stop', {});
    sendEvent('social:feature', { id: null });
  }

  resetForFlow();

  const sequence = [
    { delay: 0, label: 'Welcome & profile the room', action: () => applyAction('scene', { scene: 'join' }) },
    { delay: 15000, label: 'Feelings pulse - what matters most?', action: () => applyAction('scene', { scene: 'pulse' }) },
    { delay: 32000, label: 'Persona prompt - how do you respond to challenge?', action: () => applyAction('scene', { scene: 'persona' }) },
    { delay: 50000, label: 'Choose your Beatty track', action: () => applyAction('scene', { scene: 'tracks' }) },
    { delay: 65000, label: 'Opportunities matched to you', action: () => applyAction('scene', { scene: 'recommend' }) },
    { delay: 80000, label: 'Social proof - Beatty in action', action: () => applyAction('scene', { scene: 'social' }) },
    { delay: 95000, label: 'Poll - 1st or 2nd choice CCA?', action: () => startPollPreset('cca') },
    { delay: 120000, label: 'Reveal - 90% get their top CCAs', action: () => applyAction('poll:reveal', {}) },
    { delay: 126000, label: 'Celebrate & spotlight journeys', action: () => { applyAction('poll:stop', {}); applyAction('scene', { scene: 'finale' }); } },
    { delay: 140000, label: 'Flow complete - ready for Q&A', action: () => clearTimeline('Flow complete - ready for Q&A') }
  ];

  clearTimeline('Preparing flow');
  updateTimeline(true, sequence[0].label);
  for (const step of sequence) {
    const timer = setTimeout(() => {
      if (!state.timeline.active) return;
      if (step.label) updateTimeline(true, step.label);
      step.action();
    }, step.delay);
    timelineTimers.push(timer);
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // SSE stream
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`event: init\n`);
    res.write(`data: ${JSON.stringify(state)}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  // Broadcast endpoint
if (pathname === '/broadcast' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    parseBody(req, (body) => {
      const { type, payload } = body;
      if (!type) {
        res.writeHead(400); res.end('Missing type'); return;
      }

      if (type === 'timeline') {
        const action = payload?.action;
        if (action === 'start') startTimeline();
        else if (action === 'stop') clearTimeline('Stopped by host');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, state }));
        return;
      }

      applyAction(type, payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, state }));
    });
    return;
  }

  if (pathname === '/journey' && req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.readFile(JOURNEY_FILE, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Unable to read journey log');
        return;
      }
      const entries = content
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try { return JSON.parse(line); } catch { return null; }
        })
        .filter(Boolean);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(entries));
    });
    return;
  }

  if (pathname === '/journey/clear' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.writeFile(JOURNEY_FILE, '', 'utf8', err => {
      if (!err) {
        state.journeyCount = 0;
        sendEvent('journey:summary', { count: state.journeyCount });
      }
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: !err }));
    });
    return;
  }

  if (pathname === '/journey' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    parseBody(req, (body) => {
      const entry = {
        ts: new Date().toISOString(),
        name: (body.name || '').slice(0, 120),
        email: (body.email || '').slice(0, 120),
        contact: (body.contact || '').slice(0, 60),
        role: body.role || '',
        interests: Array.isArray(body.interests) ? body.interests.slice(0, 5) : [],
        persona: body.persona || '',
        mood: body.mood || '',
        pollChoice: body.pollChoice || '',
        notes: (body.notes || '').slice(0, 500)
      };
      fs.appendFile(JOURNEY_FILE, JSON.stringify(entry) + '\n', () => {});
      state.journeyCount += 1;
      sendEvent('journey:summary', { count: state.journeyCount });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // Static assets from content (logo etc.)
  if (pathname.startsWith('/content/')) {
    const f = path.join(__dirname, '..', pathname);
    return serveFile(res, f, contentTypeFor(f));
  }

  // Static files
  let filePath = 'index.html';
  if (pathname === '/' || pathname === '/stage') filePath = 'index.html';
  else if (pathname === '/passport') filePath = 'passport.html';
  else if (pathname === '/admin') filePath = 'admin.html';
  else filePath = pathname.replace(/^\//, '');

  const abs = path.join(__dirname, 'public', filePath);
  serveFile(res, abs, contentTypeFor(abs));
});

function getLocalIPs() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name] || []) {
      if (i.family === 'IPv4' && !i.internal) { ips.push(i.address); }
    }
  }
  return ips;
}

server.listen(PORT, () => {
  console.log(`Beatty interactive prototype running on http://localhost:${PORT}`);
  const ips = getLocalIPs();
  if (ips.length) {
    console.log('On your phone use:');
    for (const ip of ips) console.log(`  http://${ip}:${PORT}/passport`);
  }
  console.log('Open /stage for the Stageboard, /passport for audience, /admin for control');
});
