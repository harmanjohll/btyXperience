// Test server: serves gem/ and swaps the three Firebase imports for a stand-in that keeps
// every document in this process's memory. Every browser context (the presenter and each
// phone) talks to the same store, so the whole show can be played end to end offline.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../gem');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const STUBS = { 'firebase-app.js': 'fb-app.js', 'firebase-firestore.js': 'fb-fs.js', 'firebase-auth.js': 'fb-auth.js' };

export function startServer(port = 0) {
  const store = new Map();          // path → data
  const clients = new Set();        // SSE responses
  const log = [];                   // every write, for assertions
  const now = () => Date.now();
  const stamp = v => {              // serverTimestamp sentinels → numbers
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (v.__st === 1) return now();
      const o = {}; for (const k in v) o[k] = stamp(v[k]); return o;
    }
    if (Array.isArray(v)) return v.map(stamp);
    return v;
  };
  const deepMerge = (a, b) => {
    const o = { ...(a || {}) };
    for (const k in b) {
      const bv = b[k];
      o[k] = (bv && typeof bv === 'object' && !Array.isArray(bv) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) ? deepMerge(o[k], bv) : bv;
    }
    return o;
  };
  const send = msg => { const line = `data: ${JSON.stringify(msg)}\n\n`; clients.forEach(r => { try { r.write(line); } catch (e) {} }); };
  const api = {
    set(p, data, merge) { const d = stamp(data); const next = merge ? deepMerge(store.get(p), d) : d; store.set(p, next); log.push({ op: 'set', path: p, data: d, merge: !!merge, at: now() }); send({ t: 'set', path: p, data: next }); },
    del(p) { if (!store.has(p)) return; store.delete(p); log.push({ op: 'del', path: p, at: now() }); send({ t: 'del', path: p }); },
    get: p => store.get(p),
    col: name => [...store.entries()].filter(([p]) => p.split('/')[0] === name && p.split('/').length === 2).map(([p, d]) => ({ id: p.split('/')[1], data: d })),
    clear() { [...store.keys()].forEach(k => api.del(k)); log.length = 0; },
    store, log,
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = decodeURIComponent(url.pathname);
    if (p === '/__fs/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ t: 'dump', docs: [...store.entries()] })}\n\n`);
      clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (p === '/__fs/write' && req.method === 'POST') {
      let body = ''; req.on('data', c => body += c); req.on('end', () => {
        try { const ops = JSON.parse(body); (Array.isArray(ops) ? ops : [ops]).forEach(o => o.op === 'del' ? api.del(o.path) : api.set(o.path, o.data, o.merge)); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}'); }
        catch (e) { res.writeHead(400); res.end(String(e)); }
      }); return;
    }
    const stubName = p.startsWith('/__stub/') ? p.slice(8) : null;
    if (stubName) {
      const fp = path.join(HERE, stubName);
      fs.readFile(fp, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(d); }); return;
    }
    if (p === '/' || p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(fp, (e, d) => {
      if (e) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(fp);
      if (ext === '.html' || ext === '.js') {
        let s = d.toString();
        for (const [real, stub] of Object.entries(STUBS)) s = s.split(FB + real).join('/__stub/' + stub);
        res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'no-store' }); res.end(s); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' }); res.end(d);
    });
  });
  return new Promise(resolve => server.listen(port, () => {
    const { port: p } = server.address();
    resolve({ url: `http://localhost:${p}`, api, close: () => new Promise(r => { clients.forEach(c => { try { c.end(); } catch (e) {} }); server.close(r); }) });
  }));
}
