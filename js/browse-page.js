// ---------- shared logic for trending.html and latest.html — live Firestore data ----------
import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cardHTML, emptyStateHTML } from "./cards.js";
import { showAdminPlusIcon } from "./header-admin.js";

showAdminPlusIcon();

// header scroll shadow
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 12);
}, { passive:true });

function ts(val){
  if (!val) return Date.now();
  if (typeof val.toMillis === 'function') return val.toMillis();
  return Date.now();
}

const isLatest = window.location.pathname.includes('latest.html');

onSnapshot(collection(db, "series"), (snap) => {
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const sorted = isLatest
    ? docs.sort((a,b) => ts(b.updatedAt || b.createdAt) - ts(a.updatedAt || a.createdAt))
    : docs.sort((a,b) => ts(b.createdAt) - ts(a.createdAt));

  const grid = document.getElementById('pageGrid');
  grid.innerHTML = sorted.length
    ? sorted.map(d => cardHTML(d.id, d)).join('')
    : emptyStateHTML('No series have been added yet.');
}, (err) => {
  console.error('Failed to load series:', err);
  document.getElementById('pageGrid').innerHTML = emptyStateHTML('Could not load series: ' + err.message);
});
