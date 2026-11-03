/* Test stand-in for the Firebase compat SDK (only the calls Hive Rush uses). Every tab in one
   browser context shares a database via localStorage + BroadcastChannel, so a host and several
   player tabs behave like separate devices on the real service. Each tab gets its own uid. */
(function () {
  // one localStorage key per document, like Firestore: tabs writing different docs never clobber each other
  const PRE = 'fbstub:', ch = new BroadcastChannel('fbstub');
  const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  // each tab keeps a cache seeded from localStorage; changes travel WITH the broadcast message, because
  // localStorage syncs between tabs asynchronously and could otherwise be read stale
  const cache = new Map();
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PRE)) cache.set(k.slice(PRE.length), JSON.parse(localStorage.getItem(k))); }
  const getDoc = path => clone(cache.get(path));
  const allPaths = () => [...cache.keys()];
  const listeners = new Set();
  const notify = () => listeners.forEach(l => l());
  ch.onmessage = e => { const { path, data } = e.data || {}; if (path) cache.set(path, data); notify(); };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  function merge(a, b) { for (const k of Object.keys(b)) { if (isObj(b[k]) && isObj(a[k])) merge(a[k], b[k]); else a[k] = clone(b[k]); } return a; }
  function write(path, data, opts) {
    const next = opts && opts.merge ? merge(getDoc(path) || {}, data) : clone(data);
    cache.set(path, next); localStorage.setItem(PRE + path, JSON.stringify(next));
    ch.postMessage({ path, data: next }); setTimeout(notify, 0); return Promise.resolve();
  }
  const snap = path => { const d = getDoc(path); return { id: path.split('/').pop(), exists: d !== undefined, data: () => clone(d), metadata: { fromCache: false, hasPendingWrites: false } }; };
  function DocRef(path) { this.path = path; this.id = path.split('/').pop(); }
  DocRef.prototype.collection = function (n) { return new ColRef(this.path + '/' + n); };
  DocRef.prototype.get = function () { return Promise.resolve(snap(this.path)); };
  DocRef.prototype.set = function (d, o) { return write(this.path, d, o); };
  DocRef.prototype.update = function (d) { return write(this.path, d, { merge: true }); };
  DocRef.prototype.onSnapshot = function (a, b) {
    const cb = typeof a === 'function' ? a : b; let prev = null;
    const l = () => { const s = snap(this.path); const sig = JSON.stringify(s.data()); if (sig === prev) return; prev = sig; cb(s); };
    listeners.add(l); setTimeout(l, 0); return () => listeners.delete(l);
  };
  function ColRef(path) { this.path = path; }
  ColRef.prototype.doc = function (id) { return new DocRef(this.path + '/' + id); };
  ColRef.prototype.onSnapshot = function (cb) {
    let prev = null; const depth = this.path.split('/').length + 1;
    const l = () => {
      const docs = allPaths().filter(p => p.startsWith(this.path + '/') && p.split('/').length === depth).sort().map(snap);
      const sig = JSON.stringify(docs.map(d => [d.id, d.data()])); if (sig === prev) return; prev = sig;
      cb({ forEach: f => docs.forEach(f), docs, size: docs.length });
    };
    listeners.add(l); setTimeout(l, 0); return () => listeners.delete(l);
  };
  let uid = sessionStorage.getItem('fbstub_uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('fbstub_uid', uid); }
  const auth = { currentUser: null, signInAnonymously() { this.currentUser = { uid }; return Promise.resolve({ user: this.currentUser }); } };
  const fs = { settings() {}, collection: n => new ColRef(n) };
  window.firebase = { apps: [], initializeApp() { this.apps.push({}); return {}; }, app() { return {}; }, auth: () => auth, firestore: () => fs };
  window.firebase.firestore.FieldValue = { serverTimestamp: () => Date.now() };
})();
