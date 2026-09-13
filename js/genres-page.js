// ---------- genres.html logic — fully live from Firestore ----------
import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cardHTML, emptyStateHTML } from "./cards.js";
import { showAdminPlusIcon } from "./header-admin.js";

showAdminPlusIcon();

const GENRE_LABELS = {
  all:"All Series", action:"Action", isekai:"Isekai", fantasy:"Fantasy",
  romance:"Romance", shounen:"Shounen", slice:"Slice of Life",
  horror:"Horror", scifi:"Sci-Fi"
};

let docs = [];
let activeGenre = new URLSearchParams(window.location.search).get('g') || 'all';

function render(){
  const list = activeGenre === 'all' ? docs : docs.filter(s => (s.genres||[]).includes(activeGenre));
  document.getElementById('genreGridTitle').textContent = GENRE_LABELS[activeGenre] || 'Series';
  document.getElementById('genreCount').textContent = `${list.length} series`;
  const grid = document.getElementById('genrePosterGrid');
  grid.innerHTML = list.length
    ? list.map(s => cardHTML(s.id, s)).join('')
    : emptyStateHTML('No series in this genre yet.');
}

onSnapshot(collection(db, "series"), (snap) => {
  docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}, (err) => {
  console.error('Failed to load series:', err);
  document.getElementById('genrePosterGrid').innerHTML = emptyStateHTML('Could not load series: ' + err.message);
});

const chips = document.querySelectorAll('.chip');
chips.forEach(chip => {
  if (chip.dataset.genre === activeGenre){
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  }
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeGenre = chip.dataset.genre;
    render();
  });
});

// header scroll shadow
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 12);
}, { passive:true });
