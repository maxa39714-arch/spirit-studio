// ---------- Firebase initialization ----------
// Loaded as a module. Keep this file separate from HTML so the config
// never sits inline in markup. This still runs client-side (that's how
// Firebase web apps work) — real protection comes from Firestore/Storage
// Security Rules on the backend, not from hiding this file.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-bxGmWPvmFblLa7cY0Ojio-RFhO_NvFk",
  authDomain: "anime-56524.firebaseapp.com",
  databaseURL: "https://anime-56524-default-rtdb.firebaseio.com",
  projectId: "anime-56524",
  storageBucket: "anime-56524.firebasestorage.app",
  messagingSenderId: "842963264342",
  appId: "1:842963264342:web:82054bce31f2e9a9cbacf7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Explicitly persist the session in this browser (survives reloads, tab
// closes, and coming back to the site later) — so the admin doesn't have
// to sign in again just from navigating between pages.
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Could not set auth persistence:", err);
});

// Single source of truth for who the admin is (multiple accounts allowed).
export const ADMIN_EMAILS = [
  "Ck623292krish@gmail.com",
  "maxa39714@gmail.com"
];
