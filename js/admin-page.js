// ---------- admin.html logic (link-only, no file uploads / Storage) ----------
import { auth, db, ADMIN_EMAILS } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { signOutUser } from "./auth.js";
import {
  collection, addDoc, getDocs, doc, query, orderBy, serverTimestamp,
  updateDoc, increment, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const gate = document.getElementById('adminGate');
const content = document.getElementById('adminContent');
let currentSeriesId = null;

// ---------- auth guard ----------
onAuthStateChanged(auth, (user) => {
  const isAdmin = !!user && !!user.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase());
  if (!isAdmin){
    window.location.href = "index.html";
    return;
  }
  gate.style.display = 'none';
  content.style.display = 'block';
  document.getElementById('adminEmailTag').textContent = user.email;
  loadSeriesList();
});

document.getElementById('btnLogout').addEventListener('click', async () => {
  await signOutUser();
  window.location.href = "index.html";
});

// ---------- helpers ----------
function showError(el, err){
  el.textContent = (err && err.message) ? err.message : String(err);
  el.style.display = 'block';
}
function hideError(el){
  el.style.display = 'none';
  el.textContent = '';
}

// ---------- STEP 1: create series ----------
const seriesForm = document.getElementById('seriesForm');
const seriesSubmitBtn = document.getElementById('seriesSubmitBtn');
const seriesFormError = document.getElementById('seriesFormError');

seriesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(seriesFormError);
  seriesSubmitBtn.disabled = true;
  seriesSubmitBtn.textContent = 'Creating…';

  try{
    const title = document.getElementById('sTitle').value.trim();
    if (!title){
      throw new Error('Please enter a title.');
    }

    const data = {
      title,
      type: document.getElementById('sType').value,
      genres: document.getElementById('sGenres').value.split(',').map(g => g.trim().toLowerCase()).filter(Boolean),
      status: document.getElementById('sStatus').value,
      synopsis: document.getElementById('sSynopsis').value.trim(),
      bannerUrl: document.getElementById('sBanner').value.trim(),
      posterUrl: document.getElementById('sPoster').value.trim(),
      episodeCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(db, "series"), data);

    seriesForm.reset();
    await loadSeriesList();
  } catch(err){
    console.error('Create series failed:', err);
    showError(seriesFormError, err);
  } finally {
    seriesSubmitBtn.disabled = false;
    seriesSubmitBtn.textContent = '+ Create Series Folder';
  }
});

async function loadSeriesList(){
  const listEl = document.getElementById('seriesList');
  try{
    const snap = await getDocs(query(collection(db, "series"), orderBy("createdAt", "desc")));
    if (snap.empty){
      listEl.innerHTML = '<div class="empty-state">No series yet — create one above.</div>';
      return;
    }
    listEl.innerHTML = '';
    snap.forEach(docSnap => {
      const s = docSnap.data();
      const row = document.createElement('div');
      row.className = 'series-row';
      row.innerHTML = `
        <div class="series-row-left">
          <div class="series-row-thumb">${s.posterUrl ? `<img src="${s.posterUrl}" alt="">` : ''}</div>
          <div>
            <div class="series-row-name">${s.title}</div>
            <div class="series-row-meta">${s.type} · ${(s.genres||[]).join(', ')} · ${s.status} · ${s.episodeCount||0} episodes</div>
          </div>
        </div>
        <div class="row-actions"><button type="button">Manage Episodes →</button></div>`;
      row.addEventListener('click', () => selectSeries(docSnap.id, s.title, row));
      listEl.appendChild(row);
    });
  } catch(err){
    console.error('Load series failed:', err);
    listEl.innerHTML = `<div class="empty-state">Could not load series: ${err.message}</div>`;
  }
}

function selectSeries(id, title, rowEl){
  currentSeriesId = id;
  document.querySelectorAll('.series-row').forEach(r => r.classList.remove('selected'));
  rowEl.classList.add('selected');
  document.getElementById('episodePanel').style.display = 'block';
  document.getElementById('selSeriesName').textContent = title;
  loadEpisodes(id);
  document.getElementById('episodePanel').scrollIntoView({ behavior:'smooth', block:'start' });
}

// ---------- STEP 3: add episode ----------
const epForm = document.getElementById('epForm');
const epSubmitBtn = document.getElementById('epSubmitBtn');
const epFormError = document.getElementById('epFormError');

let editingEpisodeId = null;

epForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(epFormError);

  if (!currentSeriesId){
    showError(epFormError, new Error('Select a series first.'));
    return;
  }

  epSubmitBtn.disabled = true;
  epSubmitBtn.textContent = editingEpisodeId ? 'Updating…' : 'Adding…';

  try{
    const videoUrl = document.getElementById('eVideo').value.trim();
    const videoType = document.querySelector('input[name="videoType"]:checked').value; // 'direct' | 'embed'

    if (!videoUrl){
      throw new Error('Paste a video link.');
    }

    const data = {
      number: Number(document.getElementById('eNumber').value),
      title: document.getElementById('eTitle').value.trim(),
      videoUrl,
      videoType,
      thumbnail: document.getElementById('eThumb').value.trim()
    };

    if (editingEpisodeId){
      await updateDoc(doc(db, "series", currentSeriesId, "episodes", editingEpisodeId), data);
      await updateDoc(doc(db, "series", currentSeriesId), { updatedAt: serverTimestamp() });
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "series", currentSeriesId, "episodes"), data);
      await updateDoc(doc(db, "series", currentSeriesId), { episodeCount: increment(1), updatedAt: serverTimestamp() });
    }

    cancelEditEpisode();
    await loadEpisodes(currentSeriesId);
    await loadSeriesList();
  } catch(err){
    console.error('Save episode failed:', err);
    showError(epFormError, err);
  } finally {
    epSubmitBtn.disabled = false;
    epSubmitBtn.textContent = editingEpisodeId ? 'Update Episode' : '+ Add Episode';
  }
});

function cancelEditEpisode(){
  editingEpisodeId = null;
  epForm.reset();
  document.querySelector('input[name="videoType"][value="direct"]').checked = true;
  epSubmitBtn.textContent = '+ Add Episode';
  const cancelBtn = document.getElementById('epCancelBtn');
  if (cancelBtn) cancelBtn.remove();
}

function startEditEpisode(id, ep){
  editingEpisodeId = id;
  document.getElementById('eNumber').value = ep.number;
  document.getElementById('eTitle').value = ep.title;
  document.getElementById('eVideo').value = ep.videoUrl;
  document.getElementById('eThumb').value = ep.thumbnail || '';
  document.querySelector(`input[name="videoType"][value="${ep.videoType || 'direct'}"]`).checked = true;
  epSubmitBtn.textContent = 'Update Episode';

  if (!document.getElementById('epCancelBtn')){
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'epCancelBtn';
    cancelBtn.className = 'btn-out';
    cancelBtn.style.marginLeft = '10px';
    cancelBtn.textContent = 'Cancel edit';
    cancelBtn.addEventListener('click', cancelEditEpisode);
    epSubmitBtn.insertAdjacentElement('afterend', cancelBtn);
  }
  epForm.scrollIntoView({ behavior:'smooth', block:'center' });
}

async function deleteEpisode(id){
  if (!confirm('Delete this episode? This cannot be undone.')) return;
  try{
    await deleteDoc(doc(db, "series", currentSeriesId, "episodes", id));
    await updateDoc(doc(db, "series", currentSeriesId), { episodeCount: increment(-1), updatedAt: serverTimestamp() });
    await loadEpisodes(currentSeriesId);
    await loadSeriesList();
  } catch(err){
    console.error('Delete episode failed:', err);
    alert('Could not delete: ' + err.message);
  }
}

async function loadEpisodes(seriesId){
  const epListEl = document.getElementById('epList');
  try{
    const snap = await getDocs(query(collection(db, "series", seriesId, "episodes"), orderBy("number", "asc")));
    if (snap.empty){
      epListEl.innerHTML = '<div class="empty-state">No episodes added yet.</div>';
      return;
    }
    epListEl.innerHTML = '';
    snap.forEach(docSnap => {
      const ep = docSnap.data();
      const row = document.createElement('div');
      row.className = 'ep-row';
      row.innerHTML = `
        <span>EP ${ep.number} — ${ep.title}</span>
        <span style="display:flex;align-items:center;gap:8px;">
          <span class="ep-row-tag">${ep.videoType === 'embed' ? 'EMBED' : 'DIRECT'}</span>
          <button type="button" class="ep-edit-btn">Edit</button>
          <button type="button" class="ep-delete-btn">Delete</button>
        </span>`;
      row.querySelector('.ep-edit-btn').addEventListener('click', () => startEditEpisode(docSnap.id, ep));
      row.querySelector('.ep-delete-btn').addEventListener('click', () => deleteEpisode(docSnap.id));
      epListEl.appendChild(row);
    });
  } catch(err){
    console.error('Load episodes failed:', err);
    epListEl.innerHTML = `<div class="empty-state">Could not load episodes: ${err.message}</div>`;
  }
}
