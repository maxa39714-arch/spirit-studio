// ---------- shared card rendering (real Firestore data only) ----------
const FALLBACK_CLASSES = ['g1','g2','g3','g4','g5','g6','g7','g8'];

function fallbackClass(id){
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_CLASSES[hash % FALLBACK_CLASSES.length];
}

export function cardHTML(id, s){
  const genres = (s.genres || []).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ');
  const posterInner = s.posterUrl
    ? `<img class="poster-img" src="${s.posterUrl}" alt="${s.title}">`
    : `<div class="poster-art"><span>${s.title}</span></div>`;
  const posterClass = s.posterUrl ? '' : fallbackClass(id);

  return `
    <a class="card" href="series.html?id=${id}">
      <div class="card-poster ${posterClass}">
        ${posterInner}
        <span class="poster-badge">${s.type || 'TV'}</span>
        <span class="poster-ep">${s.episodeCount || 0} EP</span>
        <div class="play-overlay">
          <svg viewBox="0 0 24 24" fill="#FFB238"><circle cx="12" cy="12" r="11" fill="rgba(5,6,15,.55)"/><path d="M10 8l6 4-6 4z" fill="#FFB238"/></svg>
        </div>
      </div>
      <div class="card-title">${s.title}</div>
      <div class="card-sub">${s.status || 'Ongoing'} · ${genres}</div>
    </a>`;
}

export function emptyStateHTML(text){
  return `<div class="empty-state">${text}</div>`;
}
