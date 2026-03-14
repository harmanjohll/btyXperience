/* ═══════════════════════════════════════════════════════════════
   btyXperience — Shared Firebase Module
   Config, auth, and helper functions used by both presenter & audience.
   ═══════════════════════════════════════════════════════════════ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, onSnapshot,
         serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBjHO57QKoMW-u4oLGGdgDSqw5gttqX6Fg',
    authDomain: 'btyx-61dc6.firebaseapp.com',
    projectId: 'btyx-61dc6',
    storageBucket: 'btyx-61dc6.appspot.com',
    messagingSenderId: '851137405745',
    appId: '1:851137405745:web:c95b86b6f0462a9bc20610',
};

// ── COLLECTIONS ──
// profiles      — archetype results + all answers (audience writes)
// polls         — poll votes (audience writes)
// nexusVotes    — exchange/industry selections (audience writes)
// aspirations   — word cloud submissions (audience writes)
// sailBoats     — completed boat data for fleet view (audience writes)
// session/state — current presenter step + view info (presenter writes)
// config/pace   — pace mode + step index (presenter writes)

const ALL_COLLECTIONS = ['profiles', 'polls', 'nexusVotes', 'aspirations', 'sailBoats'];

let app, db, auth;

export async function initFirebase() {
    app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    await signInAnonymously(auth);
    return { app, db, auth };
}

export function getDb() { return db; }
export function getAppAuth() { return auth; }
export function uid() { return auth?.currentUser?.uid; }

// ── HELPERS ──

export function writeDoc(path, id, data) {
    return setDoc(doc(db, path, id), { ...data, timestamp: serverTimestamp() });
}

export function writeSessionState(state) {
    return setDoc(doc(db, 'session', 'state'), state);
}

export function writePaceConfig(mode, step) {
    return setDoc(doc(db, 'config', 'pace'), { mode, step });
}

export function listenDoc(path, id, callback) {
    return onSnapshot(doc(db, path, id), snap => {
        callback(snap.exists() ? snap.data() : null);
    });
}

export function listenCollection(path, callback) {
    return onSnapshot(collection(db, path), callback);
}

export async function resetSession() {
    for (const c of ALL_COLLECTIONS) {
        const snapshot = await getDocs(collection(db, c));
        if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    }
    // Clear session state
    await setDoc(doc(db, 'session', 'state'), { currentView: 'reset' });
    await setDoc(doc(db, 'config', 'pace'), { mode: 'audience', step: 0 });
}

// Re-export Firestore functions needed by consumers
export { doc, setDoc, getDoc, getDocs, collection, onSnapshot, serverTimestamp, writeBatch };
