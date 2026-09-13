// ---------- series.html logic — live from Firestore only ----------
import { db } from "./firebase-config.js";
import { showAdminPlusIcon } from "./header-admin.js";
import { doc, onSnapshot, collection, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

showAdminPlusIcon();

const params = new URLSearchParams(window.location.search);
const seriesId = params.get('id');

const titleEl = document.getElementById('detailTitle');
const descEl = document.getElementById('detailDesc');
const metaEl = document.getElementById('detailMeta');
const posterEl = document.getElementById('detailPoster');
const posterTitleEl = document.getElementById('detailPosterTitle');
const epContainer = document.getElementById('episodeContainer');
const watchFirstBtn = document.getElementById('watchFirstBtn');

function renderEpisodeCard(ep, index){
  const a = document.createElement('a');
  a.className = 'ep-card';
  a.href = `watch.html?id=${seriesId}&ep=${ep.number}`;
  a.innerHTML = `
    <div class="ep-left">
      <div class="ep-num">${ep.number}</div>
      <div class="ep-title">${ep.title}</div>
    </div>
    <div class="ep-play">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    </div>`;
  epContainer.appendChild(a);
  if (index === 0) watchFirstBtn.href = a.href;
}

function fillDetails(s){
  titleEl.textContent = s.title;
  posterTitleEl.textContent = s.title;
  descEl.textContent = s.synopsis || "No synopsis available.";
  const genres = (s.genres||[]).map(g => g.charAt(0).toUpperCase()+g.slice(1)).join(' · ');
  metaEl.innerHTML = `
    <span class="pill">${s.type || 'TV'}</span>
    <span class="pill">${s.status || 'Ongoing'}</span>
    <span class="dot"></span>
    <span>${genres}</span>`;

  if (s.posterUrl){
    posterEl.innerHTML = `<img class="poster-img" src="${s.posterUrl}" alt="${s.title}">`;
  } else {
    posterEl.innerHTML = `<div class="poster-art"><span>${s.title}</span></div>`;
  }
}

if (!seriesId){
  titleEl.textContent = "No series selected";
  descEl.textContent = "Go back and pick a series to view.";
} else {
  onSnapshot(doc(db, "series", seriesId), (snap) => {
    if (!snap.exists()){
      titleEl.textContent = "Series not found";
      descEl.textContent = "This series doesn't exist or was removed.";
      epContainer.innerHTML = '';
      return;
    }
    fillDetails(snap.data());
  }, (err) => {
    console.error('Failed to load series:', err);
    titleEl.textContent = "Could not load series";
    descEl.textContent = err.message;
  });

  onSnapshot(query(collection(db, "series", seriesId, "episodes"), orderBy("number", "asc")), (snap) => {
    epContainer.innerHTML = '';
    if (snap.empty){
      epContainer.innerHTML = '<div class="empty-state">No episodes uploaded yet — check back soon.</div>';
      return;
    }
    snap.forEach((d, i) => renderEpisodeCard(d.data(), i));
  }, (err) => {
    console.error('Failed to load episodes:', err);
    epContainer.innerHTML = `<div class="empty-state">Could not load episodes: ${err.message}</div>`;
  });
}
