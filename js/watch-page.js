// ---------- watch.html logic — live from Firestore only ----------
import { db } from "./firebase-config.js";
import { showAdminPlusIcon } from "./header-admin.js";
import { doc, onSnapshot, collection, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

showAdminPlusIcon();

const params = new URLSearchParams(window.location.search);
const seriesId = params.get('id');
const epNumber = Number(params.get('ep')) || 1;

const playerFrame = document.getElementById('playerFrame');
const watchTitle = document.getElementById('watchTitle');
const watchSub = document.getElementById('watchSub');
const sideList = document.getElementById('sideEpList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function showEmptyPlayer(msg){
  playerFrame.innerHTML = `<div class="player-empty">${msg}</div>`;
}

function renderPlayer(ep){
  if (!ep || !ep.videoUrl){
    showEmptyPlayer("No video added for this episode yet.");
    return;
  }
  if (ep.videoType === 'embed'){
    playerFrame.innerHTML = `<iframe src="${ep.videoUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
  } else {
    playerFrame.innerHTML = `<video class="ss-player" src="${ep.videoUrl}" ${ep.thumbnail ? `poster="${ep.thumbnail}"` : ''} controls autoplay playsinline></video>`;
  }
}

function setupPrevNext(episodes){
  const idx = episodes.findIndex(e => e.number === epNumber);
  const prev = episodes[idx - 1];
  const next = episodes[idx + 1];
  if (prev){ prevBtn.href = `watch.html?id=${seriesId}&ep=${prev.number}`; prevBtn.style.pointerEvents='auto'; prevBtn.style.opacity=1; }
  else { prevBtn.style.opacity = .4; prevBtn.style.pointerEvents = 'none'; }
  if (next){ nextBtn.href = `watch.html?id=${seriesId}&ep=${next.number}`; nextBtn.style.pointerEvents='auto'; nextBtn.style.opacity=1; }
  else { nextBtn.style.opacity = .4; nextBtn.style.pointerEvents = 'none'; }
}

function renderSidebar(episodes){
  sideList.innerHTML = '';
  episodes.forEach(ep => {
    const a = document.createElement('a');
    a.href = `watch.html?id=${seriesId}&ep=${ep.number}`;
    a.className = 'side-ep' + (ep.number === epNumber ? ' current' : '');
    a.innerHTML = `<span class="ep-num">${ep.number}</span><span>${ep.title}</span>`;
    sideList.appendChild(a);
  });
  setupPrevNext(episodes);
}

if (!seriesId){
  watchTitle.textContent = "No episode selected";
  showEmptyPlayer("Go back and pick a series to watch.");
} else {
  let seriesTitle = '';

  onSnapshot(doc(db, "series", seriesId), (snap) => {
    if (!snap.exists()){
      watchTitle.textContent = "Series not found";
      showEmptyPlayer("This series doesn't exist or was removed.");
      return;
    }
    seriesTitle = snap.data().title;
  }, (err) => {
    console.error('Failed to load series:', err);
  });

  onSnapshot(query(collection(db, "series", seriesId, "episodes"), orderBy("number", "asc")), (snap) => {
    if (snap.empty){
      watchTitle.textContent = "No episodes yet";
      showEmptyPlayer("This series doesn't have any episodes uploaded yet.");
      sideList.innerHTML = '';
      return;
    }
    const episodes = snap.docs.map(d => d.data());
    const current = episodes.find(e => e.number === epNumber) || episodes[0];

    watchTitle.textContent = `${seriesTitle} — Episode ${current.number}`;
    watchSub.textContent = current.title;
    renderPlayer(current);
    renderSidebar(episodes);
  }, (err) => {
    console.error('Failed to load episodes:', err);
    showEmptyPlayer('Could not load episodes: ' + err.message);
  });
}
