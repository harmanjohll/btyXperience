/* HIVE RUSH network layer: Firebase (compat SDK, classic scripts so it also runs from file://).
   Data lives in its own collection, hiveRush/{pin} with a players subcollection keyed by the
   anonymous auth uid. Nothing personal is stored: squad names are generated, never typed. */
(function () {
  const CONFIG = {
    apiKey: 'AIzaSyBjHO57QKoMW-u4oLGGdgDSqw5gttqX6Fg',
    authDomain: 'btyx-61dc6.firebaseapp.com',
    projectId: 'btyx-61dc6',
    storageBucket: 'btyx-61dc6.appspot.com',
    messagingSenderId: '851137405745',
    appId: '1:851137405745:web:c95b86b6f0462a9bc20610',
  };
  const ROOT = 'hiveRush';
  let db = null, uid = null, readyP = null;
  const statusSubs = new Set();
  let online = navigator.onLine;

  function setOnline(v) { if (v !== online) { online = v; statusSubs.forEach(f => f(v)); } }
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));

  function withTimeout(p, ms, msg) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
  }

  function ready() {
    if (readyP) return readyP;
    readyP = withTimeout((async () => {
      if (!window.firebase || !firebase.initializeApp) throw new Error('no-sdk');
      const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(CONFIG);
      db = firebase.firestore(app);
      try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) { /* already set */ }
      const auth = firebase.auth(app);
      if (!auth.currentUser) await auth.signInAnonymously();
      uid = auth.currentUser.uid;
      return uid;
    })(), 12000, 'timeout');
    readyP.catch(() => { readyP = null; });
    return readyP;
  }

  const game = pin => db.collection(ROOT).doc(String(pin));
  const players = pin => game(pin).collection('players');

  function watchDoc(ref, cb) {
    return ref.onSnapshot({ includeMetadataChanges: true }, snap => {
      if (snap.metadata) setOnline(!snap.metadata.fromCache);
      cb(snap.exists ? snap.data() : null);
    }, err => { console.warn('[hive] watch error', err); setOnline(false); });
  }

  HR.Net = {
    ready,
    uid: () => uid,
    isOnline: () => online,
    onStatus(f) { statusSubs.add(f); return () => statusSubs.delete(f); },

    async getGame(pin) { const s = await game(pin).get(); return s.exists ? s.data() : null; },

    async createGame(extra) {
      for (let i = 0; i < 12; i++) {
        const pin = String(1000 + Math.floor(Math.random() * 9000));
        let existing = null;
        try { existing = await this.getGame(pin); } catch (e) { existing = null; }
        if (existing && existing.hostUid !== uid && Date.now() - (existing.createdAt || 0) < 12 * 3600e3) continue;
        const data = Object.assign({ pin, hostUid: uid, session: 1, phase: 'lobby', round: -1, phaseAt: Date.now(),
          limit: 0, paused: false, kicked: [], createdAt: Date.now(), v: 1 }, extra || {});
        try { await game(pin).set(data); return data; } catch (e) { continue; }
      }
      throw new Error('Could not create a game PIN');
    },

    setGame(pin, patch) { return game(pin).set(patch, { merge: true }); },
    watchGame(pin, cb) { return watchDoc(game(pin), cb); },

    setMe(pin, data, merge) { return players(pin).doc(uid).set(data, merge ? { merge: true } : undefined); },
    watchMe(pin, cb) { return watchDoc(players(pin).doc(uid), cb); },
    watchPlayers(pin, cb) {
      return players(pin).onSnapshot(qs => {
        const list = [];
        qs.forEach(d => list.push(Object.assign({ id: d.id }, d.data())));
        cb(list);
      }, err => console.warn('[hive] players watch error', err));
    },
  };
})();
