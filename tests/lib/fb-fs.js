// Stand-in for firebase-firestore.js (tests only). Documents live in the test server's
// memory; every browser context streams changes over Server-Sent Events, so the
// presenter, the fleet and every phone see one shared database — like the real one.
const cache = new Map();
const listeners = new Set();
let ready = false;
const waiters = [];
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

const es = new EventSource('/__fs/stream');
es.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.t === 'dump') {
    cache.clear(); m.docs.forEach(([p, d]) => cache.set(p, d));
    const first = !ready; ready = true;
    if (first) waiters.splice(0).forEach(f => f());
    listeners.forEach(l => fire(l));
    return;
  }
  if (m.t === 'set') cache.set(m.path, m.data);
  if (m.t === 'del') cache.delete(m.path);
  const col = m.path.split('/')[0];
  listeners.forEach(l => { if ((l.kind === 'doc' && l.key === m.path) || (l.kind === 'col' && l.key === col)) fire(l); });
};
const whenReady = () => (ready ? Promise.resolve() : new Promise(r => waiters.push(r)));

function docSnap(path) {
  const d = cache.get(path);
  return { id: path.split('/').pop(), ref: { __kind: 'doc', path }, exists: () => d !== undefined, data: () => clone(d), metadata: { hasPendingWrites: false, fromCache: false } };
}
function colSnap(name, prev) {
  const docs = [...cache.keys()].filter(p => { const s = p.split('/'); return s[0] === name && s.length === 2; }).sort().map(docSnap);
  const now = new Map(docs.map(d => [d.id, JSON.stringify(d.data())]));
  const changes = [];
  docs.forEach((d, i) => { if (!prev.has(d.id)) changes.push({ type: 'added', doc: d, newIndex: i }); else if (prev.get(d.id) !== now.get(d.id)) changes.push({ type: 'modified', doc: d, newIndex: i }); });
  prev.forEach((_, id) => { if (!now.has(id)) changes.push({ type: 'removed', doc: docSnap(name + '/' + id) }); });
  return { snap: { docs, size: docs.length, empty: docs.length === 0, forEach: f => docs.forEach(f), docChanges: () => changes, metadata: { hasPendingWrites: false } }, now };
}
function fire(l) {
  try {
    if (l.kind === 'doc') { const s = docSnap(l.key); const sig = JSON.stringify(s.data()); if (l.inited && sig === l.prev) return; l.prev = sig; l.inited = true; l.cb(s); }
    else { const { snap, now } = colSnap(l.key, l.prev); if (l.inited && !snap.docChanges().length) return; l.prev = now; l.inited = true; l.cb(snap); }
  } catch (e) { console.error('[fs stub] listener threw', e); }
}

let autoN = 0;
export function getFirestore() { return { __kind: 'db' }; }
export function collection(db, name) { return { __kind: 'col', name }; }
export function doc(a, b, c) {
  if (a && a.__kind === 'col') return { __kind: 'doc', path: a.name + '/' + (b || ('auto' + Date.now().toString(36) + (++autoN) + Math.random().toString(36).slice(2, 6))) };
  return { __kind: 'doc', path: c ? b + '/' + c : b };
}
export function serverTimestamp() { return { __st: 1 }; }
async function post(ops) {
  const r = await fetch('/__fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ops) });
  if (!r.ok) throw new Error('write failed');
}
export function setDoc(ref, data, opts) { return post({ op: 'set', path: ref.path, data, merge: !!(opts && opts.merge) }); }
export function updateDoc(ref, data) { return post({ op: 'set', path: ref.path, data, merge: true }); }
export function deleteDoc(ref) { return post({ op: 'del', path: ref.path }); }
export async function getDoc(ref) { await whenReady(); return docSnap(ref.path); }
export async function getDocs(ref) { await whenReady(); return colSnap(ref.name, new Map()).snap; }
export function writeBatch() {
  const ops = [];
  return { set(ref, data, opts) { ops.push({ op: 'set', path: ref.path, data, merge: !!(opts && opts.merge) }); return this; }, delete(ref) { ops.push({ op: 'del', path: ref.path }); return this; }, commit: () => post(ops) };
}
export function onSnapshot(ref, cb, errCb) {
  const l = ref.__kind === 'doc' ? { kind: 'doc', key: ref.path, cb, prev: null, inited: false } : { kind: 'col', key: ref.name, cb, prev: new Map(), inited: false };
  listeners.add(l);
  if (ready) setTimeout(() => fire(l), 0);
  return () => listeners.delete(l);
}
