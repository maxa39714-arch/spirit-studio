// ---------- shared: shows a "+" (add series) icon in the header ----------
// only when the signed-in user is an admin. Safe to call on any page that
// has an element with id="headerActions".
import { auth } from "./firebase-config.js";
import { isAdmin } from "./auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function showAdminPlusIcon(){
  const target = document.getElementById('headerActions');
  if (!target) return;

  onAuthStateChanged(auth, (user) => {
    const existing = document.getElementById('adminPlusBtn');
    if (isAdmin(user)){
      if (existing) return; // already shown
      const link = document.createElement('a');
      link.id = 'adminPlusBtn';
      link.href = 'admin.html';
      link.className = 'icon-btn';
      link.title = 'Add / manage series';
      link.setAttribute('aria-label', 'Add series');
      link.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      target.prepend(link);
    } else if (existing){
      existing.remove();
    }
  });
}
