// Stand-in for firebase-auth.js (tests only). One anonymous user per browser context;
// it survives a reload (like the real thing), so rejoin can be tested.
function uid() {
  try { let u = localStorage.getItem('__test_uid'); if (!u) { u = 'u' + Math.random().toString(36).slice(2, 10); localStorage.setItem('__test_uid', u); } return u; }
  catch (e) { return 'u' + Math.random().toString(36).slice(2, 10); }
}
const user = { uid: uid(), isAnonymous: true };
const auth = { currentUser: null };
export function getAuth() { return auth; }
export function signInAnonymously(a) { (a || auth).currentUser = user; return Promise.resolve({ user }); }
export function onAuthStateChanged(a, cb) { setTimeout(() => cb((a || auth).currentUser), 0); return () => {}; }
