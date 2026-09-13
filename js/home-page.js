// ---------- home.html logic — fully live from Firestore ----------
import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cardHTML } from "./cards.js";

const GENRE_LABELS = {
  action:"Action", isekai:"Isekai", fantasy:"Fantasy", romance:"Romance",
  shounen:"Shounen", slice:"Slice of Life", horror:"Horror", scifi:"Sci-Fi"
};
const GENRE_KEYS = Object.keys(GENRE_LABELS);

let docs = [];
let activeGenre = 'all';

// ---------- header scroll ----------
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 12);
}, { passive:true });

// ---------- mobile drawer ----------
const drawer = document.getElementById('mobileDrawer');
const menuToggle = document.getElementById('menuToggle');
const drawerClose = document.getElementById('drawerClose');
if (menuToggle) menuToggle.addEventListener('click', () => drawer.classList.add('open'));
if (drawerClose) drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
if (drawer) drawer.addEventListener('click', e => { if (e.target === drawer) drawer.classList.remove('open'); });

// ---------- timestamp helpers (server timestamp may be briefly null right after a write) ----------
function ts(val){
  if (!val) return Date.now();
  if (typeof val.toMillis === 'function') return val.toMillis();
  return Date.now();
}
const byCreatedDesc = (a,b) => ts(b.createdAt) - ts(a.createdAt);
const byUpdatedDesc = (a,b) => ts(b.updatedAt || b.createdAt) - ts(a.updatedAt || a.createdAt);

// ---------- hero ----------
function renderHero(s){
  document.getElementById('heroTitle').innerHTML = s.title;
  document.getElementById('heroDesc').textContent = s.synopsis || 'No synopsis added yet.';
  const genres = (s.genres || []).map(g => GENRE_LABELS[g] || g).join(' · ');
  document.getElementById('heroMeta').innerHTML = `
    <span class="pill">${s.type || 'TV'}</span>
    <span class="pill">${s.status || 'Ongoing'}</span>
    <span>${s.episodeCount || 0} Episodes</span>
    <span class="dot"></span>
    <span>${genres}</span>`;
  document.getElementById('heroActions').style.display = 'flex';
  document.getElementById('heroWatchBtn').href = `series.html?id=${s.id}`;
  document.getElementById('heroInfoBtn').href = `series.html?id=${s.id}`;

  const heroSection = document.getElementById('heroSection');
  if (s.bannerUrl){
    heroSection.style.backgroundImage =
      `radial-gradient(120% 90% at 78% 8%, rgba(255,90,31,.20), transparent 55%), ` +
      `linear-gradient(180deg, rgba(5,6,15,.25) 0%, rgba(5,6,15,.7) 55%, var(--void) 96%), ` +
      `url('${s.bannerUrl}')`;
    heroSection.style.backgroundSize = 'cover';
    heroSection.style.backgroundPosition = 'center';
  }
}

function renderRail(containerId, list){
  document.getElementById(containerId).innerHTML = list.map(d => cardHTML(d.id, d)).join('');
}

function render(){
  const noDataAtAll = docs.length === 0;
  document.getElementById('homeEmptyState').style.display = noDataAtAll ? 'block' : 'none';

  if (noDataAtAll){
    document.getElementById('trending').style.display = 'none';
    document.getElementById('latest').style.display = 'none';
    document.getElementById('dynamicGenreRails').innerHTML = '';
    document.getElementById('heroActions').style.display = 'none';
    return;
  }

  const heroDoc = [...docs].sort(byCreatedDesc)[0];
  renderHero(heroDoc);

  const filtered = activeGenre === 'all' ? docs : docs.filter(d => (d.genres||[]).includes(activeGenre));
  const trendingList = [...filtered].sort(byCreatedDesc);
  const latestList = [...filtered].sort(byUpdatedDesc);

  document.getElementById('trending').style.display = trendingList.length ? '' : 'none';
  document.getElementById('latest').style.display = latestList.length ? '' : 'none';
  renderRail('railTrending', trendingList);
  renderRail('railLatest', latestList);

  const dynContainer = document.getElementById('dynamicGenreRails');
  dynContainer.innerHTML = '';
  if (activeGenre === 'all'){
    GENRE_KEYS.forEach(g => {
      const list = docs.filter(d => (d.genres||[]).includes(g));
      if (list.length === 0) return;
      const section = document.createElement('section');
      section.className = 'rail';
      section.innerHTML = `
        <div class="rail-head">
          <h2 class="rail-title">${GENRE_LABELS[g]}</h2>
          <a href="genres.html?g=${g}" class="rail-link">See all →</a>
        </div>
        <div class="rail-track">${list.map(d => cardHTML(d.id, d)).join('')}</div>`;
      dynContainer.appendChild(section);
    });
  }
}

// ---------- live Firestore subscription ----------
onSnapshot(collection(db, "series"), (snap) => {
  docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}, (err) => {
  console.error('Failed to load series:', err);
  document.getElementById('homeEmptyState').textContent = 'Could not load series: ' + err.message;
  document.getElementById('homeEmptyState').style.display = 'block';
});

// ---------- genre chip filtering ----------
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeGenre = chip.dataset.genre;
    render();
  });
});
